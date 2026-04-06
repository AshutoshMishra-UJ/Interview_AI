const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY
})

const MODEL = "gemini-2.5-flash"

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

// ── Functions ─────────────────────────────────────────────────────────────────

async function generateInterviewReport({ resume, selfDescription, jobDescription, companyPreset = "default" }) {

    const companyContext = COMPANY_PRESETS[companyPreset] || COMPANY_PRESETS.default

    const prompt = `Generate a comprehensive interview report for a candidate with the following details:
        ${companyContext ? `Company Interview Style: ${companyContext}` : ""}
        Resume: ${resume || "Not provided"}
        Self Description: ${selfDescription || "Not provided"}
        Job Description: ${jobDescription}

        For coding challenges, generate problems specifically relevant to the role's tech stack and difficulty level.
    `

    const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(interviewReportSchema),
        }
    })

    return JSON.parse(response.text)
}


async function gradeAnswer({ question, modelAnswer, userAnswer }) {

    const prompt = `You are an expert technical interviewer grading a candidate's answer.

Question: ${question}

Model Answer (reference): ${modelAnswer}

Candidate's Answer: ${userAnswer}

Grade the candidate's answer fairly and constructively. Be specific in feedback.`

    const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(answerGradeSchema),
        }
    })

    return JSON.parse(response.text)
}


async function evaluateMockAnswer({ question, userAnswer, questionType, conversationHistory, jobTitle }) {

    const historyContext = conversationHistory.length > 0
        ? `Previous Q&A:\n${conversationHistory.map(h => `Q: ${h.question}\nA: ${h.answer}`).join("\n\n")}`
        : ""

    const prompt = `You are conducting a live mock ${questionType} interview for a ${jobTitle} position.

${historyContext}

Current Question: ${question}
Candidate's Answer: ${userAnswer}

Evaluate the answer and decide if the interview session should continue or wrap up (set isComplete=true after 5+ exchanges or if all key areas have been covered).`

    const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(mockEvaluationSchema),
        }
    })

    return JSON.parse(response.text)
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

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using puppeteer")
    })

    const prompt = `Generate resume for a candidate with the following details:
        Resume: ${resume || "Not provided"}
        Self Description: ${selfDescription || "Not provided"}
        Job Description: ${jobDescription}

        Return a JSON with a single field "html" containing clean, ATS-friendly HTML resume.
        Make it professional, 1-2 pages, visually appealing with subtle colours. Not AI-sounding.`

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
}

// ── ATS Resume Score ───────────────────────────────────────────────────────────
async function analyzeATSScore({ resumeText, jobDescription }) {
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

    const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(atsSchema),
        }
    })

    return JSON.parse(response.text)
}

// ── Salary Negotiation Coach ───────────────────────────────────────────────────
async function getSalaryCoachReply({ role, company, experience, userMessage, conversationHistory }) {
    const history = (conversationHistory || [])
        .map(m => `${m.role === 'user' ? 'Candidate' : 'Coach'}: ${m.content}`)
        .join('\n')

    const prompt = `You are an expert salary negotiation coach helping a candidate for the role of "${role}"${company ? ` at ${company}` : ''}.
Experience level: ${experience || "Not specified"}.

You give concise, practical, confident advice on:
- Market salary ranges for this role
- How to respond to offers and counter-offers
- Scripts and exact phrases to use in negotiations
- Benefits and perks to negotiate beyond base salary
- When to push back and when to accept

Previous conversation:
${history || "No prior conversation."}

Candidate: ${userMessage}
Coach:`

    const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt
    })

    return response.text?.trim() || "I'm here to help with your salary negotiation. What would you like to know?"
}

module.exports = {
    generateInterviewReport,
    generateResumePdf,
    gradeAnswer,
    evaluateMockAnswer,
    analyzeATSScore,
    getSalaryCoachReply,
    COMPANY_PRESETS
}