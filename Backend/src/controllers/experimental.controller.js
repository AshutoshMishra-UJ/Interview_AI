const { generateCompanyAwarePrep } = require("../services/ragPrep.service")

async function generateRagPrepController(req, res) {
    try {
        if (String(process.env.ENABLE_EXPERIMENTAL_RAG || "false").toLowerCase() !== "true") {
            return res.status(404).json({ message: "Experimental RAG feature is disabled." })
        }

        const { jobDescription, docs } = req.body

        if (!jobDescription || typeof jobDescription !== "string") {
            return res.status(400).json({ message: "jobDescription is required." })
        }

        if (!Array.isArray(docs) || docs.length === 0) {
            return res.status(400).json({ message: "docs must be a non-empty array." })
        }

        const normalizedDocs = docs
            .map((d) => ({
                title: String(d?.title || "Untitled"),
                content: String(d?.content || "").trim()
            }))
            .filter((d) => d.content.length > 0)

        if (normalizedDocs.length === 0) {
            return res.status(400).json({ message: "No valid document content provided." })
        }

        const prep = await generateCompanyAwarePrep({
            jobDescription,
            docs: normalizedDocs
        })

        return res.status(200).json({
            message: "Company-aware prep generated.",
            prep,
            feature: "experimental-rag"
        })
    } catch (err) {
        return res.status(500).json({ message: err.message || "Failed to generate RAG prep." })
    }
}

module.exports = {
    generateRagPrepController
}
