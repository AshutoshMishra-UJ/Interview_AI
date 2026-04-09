const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY
})

const MODEL = "gemini-2.5-flash"
const USE_MOCK_AI = String(process.env.MOCK_AI || "false").toLowerCase() === "true"

function isQuotaOrCreditError(err) {
    const status = Number.isInteger(err?.status)
        ? err.status
        : (Number.isInteger(err?.response?.status) ? err.response.status : null)
    const message = String(err?.message || err?.response?.data?.message || "")
    return status === 429 || /quota|credit|rate limit|resource_exhausted/i.test(message)
}

// ── Company-specific interview context presets ────────────────────────────────
const COMPANY_PRESETS = {
    google: "Google interviews focus heavily on data structures, algorithms (LeetCode hard), system design at massive scale, and Googliness (culture fit). Expect 4-5 coding rounds + system design.",
    amazon: "Amazon interviews are heavily behavioural using the STAR method tied to Amazon's 16 Leadership Principles. Technical rounds focus on coding and system design with scalability in mind.",
    microsoft: "Microsoft interviews test problem-solving, coding proficiency, and design skills. Culture fit (growth mindset) matters a lot. Expect 4-5 rounds including a 'As Appropriate' hiring manager round.",
    meta: "Meta interviews focus on coding (often graph/tree problems), system design at scale, and behavioural questions. Move fast and be ready for product sense questions.",
    startup: "Startup interviews are more practical — expect take-home assignments, culture-fit conversations, and questions about wearing multiple hats and working with ambiguity.",
    default: ""
}

// ── Schemas ───────────────────────────────────────────────────────────────────

const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum(["low", "medium", "high"]).describe("The severity of this skill gap")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day"),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day")
    })).describe("A day-wise preparation plan for the candidate"),
    codingChallenges: z.array(z.object({
        title: z.string().describe("Problem title e.g. 'Two Sum', 'LRU Cache', 'Valid Parentheses'"),
        difficulty: z.enum(["Easy", "Medium", "Hard"]).describe("Difficulty level"),
        category: z.string().describe("Primary DSA category: Arrays, Hash Maps, Two Pointers, Sliding Window, Binary Search, Linked Lists, Trees, Graphs, Dynamic Programming, Stack, Queue, Sorting, Recursion, Bit Manipulation"),
        topics: z.array(z.string()).describe("2-3 secondary DSA topics covered"),
        problemStatement: z.string().describe("Clear problem description without examples"),
        examples: z.array(z.object({
            input: z.string().describe("Example input, e.g. 'nums = [2,7,11,15], target = 9'"),
            output: z.string().describe("Expected output, e.g. '[0,1]'"),
            explanation: z.string().describe("Brief walkthrough of why this output is correct")
        })).min(1).max(2).describe("1-2 concrete examples with input, output and explanation"),
        constraints: z.array(z.string()).describe("Problem constraints like '1 <= nums.length <= 10^4', '−10^9 <= nums[i] <= 10^9'"),
        hint: z.string().describe("Strategic hint about the approach without revealing the solution"),
        starterCode: z.string().describe("JavaScript starter template with function signature and JSDoc comment, body left empty"),
        solution: z.string().describe("Full, clean, well-commented JavaScript solution"),
        timeComplexity: z.string().describe("e.g. O(n), O(n log n)"),
        spaceComplexity: z.string().describe("e.g. O(1), O(n)")
    })).min(3).max(4).describe("3-4 DSA coding challenges directly relevant to the role's tech stack and difficulty, progressively harder")
})

const answerGradeSchema = z.object({
    overallScore: z.number().min(0).max(10).describe("Overall score out of 10"),
    accuracyScore: z.number().min(0).max(10).describe("How accurate and correct the answer is, out of 10"),
    depthScore: z.number().min(0).max(10).describe("How deep and detailed the answer is, out of 10"),
    clarityScore: z.number().min(0).max(10).describe("How clearly and concisely the answer is communicated, out of 10"),
    strengths: z.array(z.string()).min(1).max(3).describe("1-3 specific things the candidate did well in their answer"),
    improvements: z.array(z.string()).min(1).max(3).describe("1-3 specific things to improve or add to the answer"),
    missedKeyPoints: z.array(z.string()).describe("Important points from the model answer that were completely missed"),
    verdict: z.enum(["excellent", "good", "needs_work", "poor"]).describe("Overall verdict on the answer quality")
})

const mockEvaluationSchema = z.object({
    score: z.number().min(0).max(10).describe("Score for this answer out of 10"),
    verdict: z.enum(["excellent", "good", "needs_work", "poor"]).describe("Overall verdict: excellent (9-10), good (7-8), needs_work (5-6), poor (0-4)"),
    feedback: z.string().describe("2-3 sentence concrete feedback on the answer"),
    strengths: z.array(z.string()).min(1).max(2).describe("1-2 specific strengths in the answer"),
    improvements: z.array(z.string()).min(1).max(2).describe("1-2 specific improvements"),
    followUpQuestion: z.string().optional().describe("A natural follow-up question the interviewer would ask based on this answer"),
    isComplete: z.boolean().describe("Whether enough questions have been asked to wrap up the mock interview session")
})

function buildMockInterviewReport({ jobDescription, companyPreset }) {
    const roleHint = (jobDescription || "Software Engineer").split("\n")[0].slice(0, 70)
    const companyLabel = companyPreset && companyPreset !== "default" ? ` (${companyPreset})` : ""

    return {
        matchScore: 78,
        title: `Interview Plan: ${roleHint}${companyLabel}`,
        technicalQuestions: [
            {
                question: "How would you optimize a slow API endpoint under heavy traffic?",
                intention: "Evaluates performance debugging and scalability thinking.",
                answer: "Measure first with profiling, identify bottlenecks (DB, network, CPU), add caching, optimize queries, and validate with load tests."
            },
            {
                question: "Explain trade-offs between SQL and NoSQL for a user analytics feature.",
                intention: "Checks data modeling and architecture decision-making.",
                answer: "Use SQL for strong consistency and relational reporting, NoSQL for flexible schema and high write throughput, and justify by access patterns."
            }
        ],
        behavioralQuestions: [
            {
                question: "Tell me about a time you handled conflicting priorities.",
                intention: "Assesses prioritization and communication using STAR.",
                answer: "Use STAR: context, trade-off rationale, stakeholder alignment, and measurable outcome."
            },
            {
                question: "Describe a project where you learned a new technology quickly.",
                intention: "Assesses adaptability and learning velocity.",
                answer: "Highlight fast ramp-up plan, proof of impact, and lessons carried into future work."
            }
        ],
        skillGaps: [
            { skill: "System Design", severity: "medium" },
            { skill: "Testing Strategy", severity: "low" },
            { skill: "Performance Tuning", severity: "medium" }
        ],
        preparationPlan: [
            { day: 1, focus: "Role analysis", tasks: ["Extract core requirements", "Map skills to resume", "Prepare STAR stories"] },
            { day: 2, focus: "Technical depth", tasks: ["Practice 3 coding problems", "Review complexity analysis", "Mock explain one architecture"] },
            { day: 3, focus: "Interview rehearsal", tasks: ["Run mock interview", "Refine weak answers", "Prepare questions for interviewer"] }
        ],
        codingChallenges: [
            {
                title: "Top K Frequent Elements",
                difficulty: "Medium",
                category: "Hash Maps",
                topics: ["Hash Map", "Heap"],
                problemStatement: "Return the k most frequent numbers from an array.",
                examples: [
                    { input: "nums = [1,1,1,2,2,3], k = 2", output: "[1,2]", explanation: "1 appears 3 times and 2 appears 2 times." }
                ],
                constraints: ["1 <= nums.length <= 10^5", "k is valid"],
                hint: "Count frequency first, then keep top k entries.",
                starterCode: "function topKFrequent(nums, k) {\n  // TODO\n}",
                solution: "function topKFrequent(nums, k) {\n  const freq = new Map();\n  for (const n of nums) freq.set(n, (freq.get(n) || 0) + 1);\n  return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, k).map(([n]) => n);\n}",
                timeComplexity: "O(n log n)",
                spaceComplexity: "O(n)"
            },
            {
                title: "Merge Intervals",
                difficulty: "Medium",
                category: "Sorting",
                topics: ["Sorting", "Arrays"],
                problemStatement: "Merge all overlapping intervals.",
                examples: [
                    { input: "[[1,3],[2,6],[8,10]]", output: "[[1,6],[8,10]]", explanation: "[1,3] and [2,6] overlap." }
                ],
                constraints: ["1 <= intervals.length <= 10^4"],
                hint: "Sort by start, then merge greedily.",
                starterCode: "function merge(intervals) {\n  // TODO\n}",
                solution: "function merge(intervals) {\n  intervals.sort((a,b) => a[0]-b[0]);\n  const out = [];\n  for (const cur of intervals) {\n    if (!out.length || out[out.length-1][1] < cur[0]) out.push(cur);\n    else out[out.length-1][1] = Math.max(out[out.length-1][1], cur[1]);\n  }\n  return out;\n}",
                timeComplexity: "O(n log n)",
                spaceComplexity: "O(n)"
            },
            {
                title: "LRU Cache",
                difficulty: "Hard",
                category: "Linked Lists",
                topics: ["Design", "Hash Map", "Doubly Linked List"],
                problemStatement: "Design an LRU cache with O(1) get and put.",
                examples: [
                    { input: "LRUCache(2), put(1,1), put(2,2), get(1)", output: "1", explanation: "Key 1 is present and becomes most recently used." }
                ],
                constraints: ["1 <= capacity <= 3000"],
                hint: "Combine hashmap for lookup and doubly linked list for recency.",
                starterCode: "class LRUCache {\n  constructor(capacity) {}\n  get(key) {}\n  put(key, value) {}\n}",
                solution: "class LRUCache {\n  constructor(capacity) { this.capacity = capacity; this.map = new Map(); }\n  get(key) { if (!this.map.has(key)) return -1; const val = this.map.get(key); this.map.delete(key); this.map.set(key, val); return val; }\n  put(key, value) { if (this.map.has(key)) this.map.delete(key); this.map.set(key, value); if (this.map.size > this.capacity) { const oldest = this.map.keys().next().value; this.map.delete(oldest); } }\n}",
                timeComplexity: "O(1)",
                spaceComplexity: "O(n)"
            }
        ]
    }
}

function buildMockAnswerGrade() {
    return {
        overallScore: 7,
        accuracyScore: 7,
        depthScore: 6,
        clarityScore: 8,
        strengths: ["Clear structure", "Relevant terminology"],
        improvements: ["Add concrete example", "Explain trade-offs explicitly"],
        missedKeyPoints: ["One key edge case from model answer"],
        verdict: "good"
    }
}

function buildMockResumeHtml({ selfDescription, jobDescription }) {
    return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
          h1, h2 { margin: 0 0 8px; }
          p { line-height: 1.4; }
          .section { margin-top: 16px; }
          ul { margin: 8px 0 0 18px; }
        </style>
      </head>
      <body>
        <h1>Mock Candidate Resume</h1>
        <p>Generated in local mock mode for functional testing.</p>
        <div class="section">
          <h2>Professional Summary</h2>
          <p>${selfDescription || "Adaptable software engineer with full-stack experience and strong problem-solving skills."}</p>
        </div>
        <div class="section">
          <h2>Target Role Notes</h2>
          <p>${jobDescription || "No job description provided."}</p>
        </div>
        <div class="section">
          <h2>Skills</h2>
          <ul>
            <li>JavaScript, React, Node.js</li>
            <li>REST APIs, MongoDB, Testing</li>
            <li>System design fundamentals</li>
          </ul>
        </div>
      </body>
    </html>`
}

// ── Functions ─────────────────────────────────────────────────────────────────

async function generateInterviewReport({ resume, selfDescription, jobDescription, companyPreset = "default", aiMode = "auto" }) {

    const shouldForceMock = USE_MOCK_AI || aiMode === "mock"
    if (shouldForceMock) {
        return {
            interviewReport: buildMockInterviewReport({ jobDescription, companyPreset }),
            source: "mock",
            fallbackReason: aiMode === "mock" ? "manual_toggle" : "env_mock"
        }
    }

    const companyContext = COMPANY_PRESETS[companyPreset] || COMPANY_PRESETS.default

    const prompt = `Generate a comprehensive interview report for a candidate with the following details:
        ${companyContext ? `Company Interview Style: ${companyContext}` : ""}
        Resume: ${resume || "Not provided"}
        Self Description: ${selfDescription || "Not provided"}
        Job Description: ${jobDescription}

        For coding challenges, generate problems specifically relevant to the role's tech stack and difficulty level.
    `

    try {
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: zodToJsonSchema(interviewReportSchema),
            }
        })

        return {
            interviewReport: JSON.parse(response.text),
            source: "live",
            fallbackReason: null
        }
    } catch (err) {
        return {
            interviewReport: buildMockInterviewReport({ jobDescription, companyPreset }),
            source: "mock",
            fallbackReason: isQuotaOrCreditError(err) ? "insufficient_credit" : "live_error_fallback"
        }
    }
}


async function gradeAnswer({ question, modelAnswer, userAnswer }) {

    if (USE_MOCK_AI) {
        return buildMockAnswerGrade()
    }

    const prompt = `You are an expert technical interviewer grading a candidate's answer.

Question: ${question}

Model Answer (reference): ${modelAnswer}

Candidate's Answer: ${userAnswer}

Grade the candidate's answer fairly and constructively. Be specific in feedback.`

    try {
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: zodToJsonSchema(answerGradeSchema),
            }
        })

        return JSON.parse(response.text)
    } catch (err) {
        if (isQuotaOrCreditError(err)) {
            return buildMockAnswerGrade()
        }
        throw err
    }
}


async function evaluateMockAnswer({ question, userAnswer, questionType, conversationHistory, jobTitle }) {

    if (USE_MOCK_AI) {
        return {
            score: 7,
            verdict: "good",
            feedback: "Solid answer structure and relevant points. Add one real-world example and quantify impact for a stronger response.",
            strengths: ["Good clarity", "On-topic reasoning"],
            improvements: ["Include measurable results", "Cover one edge case"],
            followUpQuestion: `Can you walk me through a concrete example related to ${jobTitle || "this role"}?`,
            isComplete: (conversationHistory || []).length >= 4
        }
    }

    const historyContext = conversationHistory.length > 0
        ? `Previous Q&A:\n${conversationHistory.map(h => `Q: ${h.question}\nA: ${h.answer}`).join("\n\n")}`
        : ""

    const prompt = `You are conducting a live mock ${questionType} interview for a ${jobTitle} position.

${historyContext}

Current Question: ${question}
Candidate's Answer: ${userAnswer}

Evaluate the answer and decide if the interview session should continue or wrap up (set isComplete=true after 5+ exchanges or if all key areas have been covered).`

    try {
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: zodToJsonSchema(mockEvaluationSchema),
            }
        })

        return JSON.parse(response.text)
    } catch (err) {
        if (isQuotaOrCreditError(err)) {
            return {
                score: 7,
                verdict: "good",
                feedback: "Solid answer structure and relevant points. Add one real-world example and quantify impact for a stronger response.",
                strengths: ["Good clarity", "On-topic reasoning"],
                improvements: ["Include measurable results", "Cover one edge case"],
                followUpQuestion: `Can you walk me through a concrete example related to ${jobTitle || "this role"}?`,
                isComplete: (conversationHistory || []).length >= 4
            }
        }
        throw err
    }
}


async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] })
    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4", margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    })

    await browser.close()
    return pdfBuffer
}


async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    if (USE_MOCK_AI) {
        const html = buildMockResumeHtml({ selfDescription, jobDescription })
        return await generatePdfFromHtml(html)
    }

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using puppeteer")
    })

    const prompt = `Generate resume for a candidate with the following details:
        Resume: ${resume || "Not provided"}
        Self Description: ${selfDescription || "Not provided"}
        Job Description: ${jobDescription}

        Return a JSON with a single field "html" containing clean, ATS-friendly HTML resume.
        Make it professional, 1-2 pages, visually appealing with subtle colours. Not AI-sounding.`

    try {
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: zodToJsonSchema(resumePdfSchema),
            }
        })

        const jsonContent = JSON.parse(response.text)
        const pdfBuffer = await generatePdfFromHtml(jsonContent.html)
        return pdfBuffer
    } catch (err) {
        if (isQuotaOrCreditError(err)) {
            const html = buildMockResumeHtml({ selfDescription, jobDescription })
            return await generatePdfFromHtml(html)
        }
        throw err
    }
}

// ── ATS Resume Score ───────────────────────────────────────────────────────────
async function analyzeATSScore({ resumeText, jobDescription }) {
    if (USE_MOCK_AI) {
        return {
            overallScore: 74,
            matchedKeywords: ["React", "Node.js", "REST"],
            missingKeywords: ["TypeScript", "CI/CD"],
            suggestions: [
                { section: "Summary", issue: "Too generic", fix: "Mention target role and 2-3 domain strengths." },
                { section: "Experience", issue: "Low impact metrics", fix: "Add quantified outcomes like latency reduction or conversion lift." },
                { section: "Skills", issue: "Missing JD keywords", fix: "Add exact skills from JD where honest and relevant." }
            ],
            summary: "Resume is reasonably aligned but missing a few high-signal keywords and measurable impact statements."
        }
    }

    const atsSchema = z.object({
        overallScore: z.number().min(0).max(100).describe("ATS compatibility score 0-100"),
        matchedKeywords: z.array(z.string()).describe("Keywords from the JD that appear in the resume"),
        missingKeywords: z.array(z.string()).describe("Important JD keywords completely absent from the resume"),
        suggestions: z.array(z.object({
            section: z.string().describe("Resume section e.g. Experience, Skills, Summary"),
            issue: z.string().describe("What the problem is"),
            fix: z.string().describe("Specific actionable fix")
        })).describe("3-5 specific recommendations to improve ATS score"),
        summary: z.string().describe("2-3 sentence overall assessment of the resume vs this JD")
    })

    const prompt = `You are an expert ATS (Applicant Tracking System) analyzer.
Analyze how well this resume matches the job description and provide ATS optimization advice.

Job Description:
${jobDescription}

Resume Content:
${resumeText || "Not provided — analyze based on job description only and give general guidance"}

Be specific, actionable, and honest. Focus on keyword matching, formatting compatibility, and content alignment.`

    try {
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: zodToJsonSchema(atsSchema),
            }
        })

        return JSON.parse(response.text)
    } catch (err) {
        if (isQuotaOrCreditError(err)) {
            return {
                overallScore: 74,
                matchedKeywords: ["React", "Node.js", "REST"],
                missingKeywords: ["TypeScript", "CI/CD"],
                suggestions: [
                    { section: "Summary", issue: "Too generic", fix: "Mention target role and 2-3 domain strengths." },
                    { section: "Experience", issue: "Low impact metrics", fix: "Add quantified outcomes like latency reduction or conversion lift." },
                    { section: "Skills", issue: "Missing JD keywords", fix: "Add exact skills from JD where honest and relevant." }
                ],
                summary: "Resume is reasonably aligned but missing a few high-signal keywords and measurable impact statements."
            }
        }
        throw err
    }
}

// ── Salary Negotiation Coach ───────────────────────────────────────────────────
async function getSalaryCoachReply({ role, company, experience, userMessage, conversationHistory }) {
    if (USE_MOCK_AI) {
        return `- **Market Range**:\n  - For ${role || "this role"}${company ? ` at ${company}` : ""}, estimate a realistic range using location and level data.\n- **Negotiation Script**:\n  - \"Based on my experience and impact, I was targeting a package in the upper part of the range.\"\n- **Next Step**:\n  - Ask for base, bonus, equity, joining bonus, and review cycle details before deciding.`
    }

    const history = (conversationHistory || [])
        .map(m => `${m.role === 'user' ? 'Candidate' : 'Coach'}: ${m.content}`)
        .join('\n')

    const prompt = `You are an expert salary negotiation coach helping a candidate for the role of "${role}"${company ? ` at ${company}` : ''}.
Experience level: ${experience || "Not specified"}.

You give concise, practical, confident advice on market salary ranges, offer negotiations, exact scripts/phrases, and benefits to negotiate.

CRITICAL REQUIREMENT: You MUST format your response strictly using a Markdown schematic bullet-point format. Do NOT use lengthy paragraphs. Break everything down logically:
- **Heading/Category**:
  - Specific actionable point or number
  - "Exact quote/script if applicable"

Previous conversation:
${history || "No prior conversation."}

Candidate: ${userMessage}
Coach:`

    try {
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: prompt
        })

        return response.text?.trim() || "I'm here to help with your salary negotiation. What would you like to know?"
    } catch (err) {
        if (isQuotaOrCreditError(err)) {
            return `- **Market Range**:\n  - For ${role || "this role"}${company ? ` at ${company}` : ""}, estimate a realistic range using location and level data.\n- **Negotiation Script**:\n  - "Based on my experience and impact, I was targeting a package in the upper part of the range."\n- **Next Step**:\n  - Ask for base, bonus, equity, joining bonus, and review cycle details before deciding.`
        }
        throw err
    }
}

module.exports = {
    generateInterviewReport,
    generateResumePdf,
    gradeAnswer,
    evaluateMockAnswer,
    analyzeATSScore,
    getSalaryCoachReply,
    COMPANY_PRESETS,
    isMockAiEnabled: () => USE_MOCK_AI
}