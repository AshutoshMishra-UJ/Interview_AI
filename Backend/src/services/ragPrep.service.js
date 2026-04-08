const { GoogleGenAI } = require("@google/genai")

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY
})

const MODEL = "gemini-2.5-flash"

function chunkText(text, chunkSize = 650) {
    const clean = String(text || "").replace(/\s+/g, " ").trim()
    if (!clean) return []

    const chunks = []
    let start = 0
    while (start < clean.length) {
        const end = Math.min(start + chunkSize, clean.length)
        chunks.push(clean.slice(start, end))
        start = end
    }
    return chunks
}

function tokenize(text) {
    return new Set(
        String(text || "")
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ")
            .split(/\s+/)
            .filter((w) => w.length > 2)
    )
}

function scoreChunk(queryTokens, chunk) {
    const tokens = tokenize(chunk)
    let overlap = 0
    queryTokens.forEach((t) => {
        if (tokens.has(t)) overlap += 1
    })
    return overlap
}

function selectTopChunks({ jobDescription, docs, topK = 6 }) {
    const queryTokens = tokenize(jobDescription)
    const scored = []

    docs.forEach((doc, docIndex) => {
        const chunks = chunkText(doc.content)
        chunks.forEach((chunk, chunkIndex) => {
            const score = scoreChunk(queryTokens, chunk)
            if (score > 0) {
                scored.push({
                    id: `${docIndex + 1}.${chunkIndex + 1}`,
                    source: doc.title || `doc-${docIndex + 1}`,
                    chunk,
                    score
                })
            }
        })
    })

    return scored.sort((a, b) => b.score - a.score).slice(0, topK)
}

function fallbackRagResponse(retrievedContext) {
    return {
        roleSummary: "Focus on core role requirements, communication clarity, and practical examples tied to impact.",
        likelyQuestions: [
            "Walk me through a recent project that matches this role's requirements.",
            "How would you prioritize features with limited time and unclear scope?",
            "Explain a difficult technical trade-off you made and why.",
            "How do you measure success after shipping a feature?"
        ],
        prepPlan: [
            "Map 3 role requirements to 3 strong project stories.",
            "Prepare STAR-format examples for leadership and conflict.",
            "Practice concise explanations with quantified outcomes.",
            "Review one system design aligned to the role domain."
        ],
        citations: retrievedContext.map((c) => ({ source: c.source, chunkId: c.id }))
    }
}

async function generateCompanyAwarePrep({ jobDescription, docs }) {
    const retrievedContext = selectTopChunks({ jobDescription, docs, topK: 6 })

    if (retrievedContext.length === 0) {
        return {
            ...fallbackRagResponse([]),
            source: "fallback"
        }
    }

    const contextText = retrievedContext
        .map((c) => `[${c.id}] (${c.source}) ${c.chunk}`)
        .join("\n\n")

    const prompt = `You are an interview coach. Use ONLY the provided context snippets and the job description.

Job Description:
${jobDescription}

Retrieved Context:
${contextText}

Return JSON with keys:
- roleSummary: string
- likelyQuestions: string[] (4 to 6)
- prepPlan: string[] (4 to 6)
- citations: { source: string, chunkId: string }[]

Rules:
- Keep output concise and practical.
- Ground suggestions in the context.
- Do not invent sources.`

    try {
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        })

        const parsed = JSON.parse(response.text)
        return {
            ...parsed,
            citations: Array.isArray(parsed.citations)
                ? parsed.citations
                : retrievedContext.map((c) => ({ source: c.source, chunkId: c.id })),
            source: "live"
        }
    } catch (error) {
        return {
            ...fallbackRagResponse(retrievedContext),
            source: "fallback"
        }
    }
}

module.exports = {
    generateCompanyAwarePrep
}
