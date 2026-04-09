const pdfParse = require("pdf-parse")
const crypto = require("crypto")
const { generateInterviewReport, generateResumePdf, gradeAnswer, evaluateMockAnswer, analyzeATSScore, getSalaryCoachReply, isMockAiEnabled } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")
const userModel = require("../models/user.model")

const getAiSource = () => (isMockAiEnabled() ? "mock" : "live")

function normalizeControllerError(err, fallbackMessage) {
    const status = Number.isInteger(err?.status)
        ? err.status
        : (Number.isInteger(err?.response?.status) ? err.response.status : 500)

    let message = err?.message || err?.response?.data?.message || fallbackMessage

    if (typeof message === "string" && message.trim().startsWith("{")) {
        try {
            const parsed = JSON.parse(message)
            message = parsed?.error?.message || message
        } catch (_) {
            // Keep original message when parsing fails.
        }
    }

    if (status === 429 || /quota|rate limit|resource_exhausted/i.test(String(message))) {
        return {
            status: 429,
            message: "AI request quota exceeded. Please wait and try again, or update your Gemini API plan."
        }
    }

    return { status: status >= 400 ? status : 500, message }
}

function toPlainResumeText(parsedResume) {
    if (!parsedResume) return ""
    if (typeof parsedResume === "string") return parsedResume

    if (Array.isArray(parsedResume)) {
        return parsedResume
            .map((item) => toPlainResumeText(item))
            .filter(Boolean)
            .join("\n")
    }

    if (typeof parsedResume === "object") {
        if (typeof parsedResume.text === "string") {
            return parsedResume.text
        }

        if (Array.isArray(parsedResume.pages)) {
            return parsedResume.pages
                .map((page) => (typeof page?.text === "string" ? page.text : ""))
                .filter(Boolean)
                .join("\n")
        }
    }

    return ""
}


// ── Generate Report ───────────────────────────────────────────────────────────
async function generateInterViewReportController(req, res) {
    try {
        let resumeContent = ""
        if (req.file) {
            try {
                const rawText = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText()
                resumeContent = toPlainResumeText(rawText)
            } catch (parseErr) {
                console.warn("Resume parsing failed, continuing without resume text:", parseErr.message)
            }
        }

        const { selfDescription, jobDescription, companyPreset, aiMode } = req.body

        if (!jobDescription || typeof jobDescription !== "string" || !jobDescription.trim()) {
            return res.status(400).json({ message: "jobDescription is required." })
        }

        const aiResult = await generateInterviewReport({
            resume: resumeContent,
            selfDescription,
            jobDescription,
            companyPreset: companyPreset || "default",
            aiMode: aiMode || "live"
        })

        const baseReportPayload = {
            user: req.user.id,
            resume: resumeContent,
            selfDescription,
            jobDescription,
            companyPreset: companyPreset || "default"
        }

        let interviewReport
        try {
            interviewReport = await interviewReportModel.create({
                ...baseReportPayload,
                ...aiResult.interviewReport
            })
        } catch (createErr) {
            // If the live model returns malformed JSON fields, retry persistence with deterministic mock output.
            if (createErr?.name === "ValidationError" && aiResult.source === "live") {
                const mockResult = await generateInterviewReport({
                    resume: resumeContent,
                    selfDescription,
                    jobDescription,
                    companyPreset: companyPreset || "default",
                    aiMode: "mock"
                })

                interviewReport = await interviewReportModel.create({
                    ...baseReportPayload,
                    ...mockResult.interviewReport
                })

                aiResult.source = "mock"
                aiResult.fallbackReason = "invalid_live_response"
            } else {
                throw createErr
            }
        }

        // ── Update Streak & XP ───────────────────────────────
        try {
            const user = await userModel.findById(req.user.id)
            const today = new Date(); today.setHours(0, 0, 0, 0)
            const last = user.lastPracticeDate ? new Date(user.lastPracticeDate) : null
            if (last) last.setHours(0, 0, 0, 0)

            const dayDiff = last ? Math.floor((today - last) / 86400000) : null

            let newStreak = user.practiceStreak || 0
            if (dayDiff === null || dayDiff > 1) newStreak = 1          // first time or broken
            else if (dayDiff === 1) newStreak = newStreak + 1 // consecutive day
            // dayDiff === 0 => same day, keep streak

            await userModel.findByIdAndUpdate(req.user.id, {
                practiceStreak: newStreak,
                longestStreak: Math.max(newStreak, user.longestStreak || 0),
                lastPracticeDate: new Date(),
                $inc: { totalXP: 50, totalSessions: 1 }
            })
        } catch (streakErr) {
            console.warn("Streak update failed (non-critical):", streakErr.message)
        }

        res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport,
            source: aiResult.source,
            fallbackReason: aiResult.fallbackReason || null
        })
    } catch (err) {
        console.error("generateInterViewReport Error:", err)
        const normalized = normalizeControllerError(err, "Failed to generate interview report.")
        res.status(normalized.status).json({ message: normalized.message })
    }
}


// ── Get Report By ID ──────────────────────────────────────────────────────────
async function getInterviewReportByIdController(req, res) {
    try {
        const { interviewId } = req.params
        const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })
        if (!interviewReport) return res.status(404).json({ message: "Interview report not found." })
        res.status(200).json({ message: "Interview report fetched successfully.", interviewReport })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}


// ── Get All Reports ───────────────────────────────────────────────────────────
async function getAllInterviewReportsController(req, res) {
    try {
        const interviewReports = await interviewReportModel
            .find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan -codingChallenges")

        res.status(200).json({ message: "Interview reports fetched successfully.", interviewReports })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}


// ── Generate Resume PDF ───────────────────────────────────────────────────────
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params
        const interviewReport = await interviewReportModel.findById(interviewReportId)
        if (!interviewReport) return res.status(404).json({ message: "Interview report not found." })

        const { resume, jobDescription, selfDescription } = interviewReport
        const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`,
            "X-AI-Source": getAiSource()
        })
        res.send(pdfBuffer)
    } catch (err) {
        const normalized = normalizeControllerError(err, "Failed to generate resume PDF.")
        res.status(normalized.status).json({ message: normalized.message })
    }
}


// ── Grade Answer ──────────────────────────────────────────────────────────────
async function gradeAnswerController(req, res) {
    try {
        const { question, modelAnswer, userAnswer } = req.body
        if (!question || !modelAnswer || !userAnswer) {
            return res.status(400).json({ message: "question, modelAnswer and userAnswer are required." })
        }

        const grade = await gradeAnswer({ question, modelAnswer, userAnswer })
        res.status(200).json({ message: "Answer graded successfully.", grade, source: getAiSource() })
    } catch (err) {
        console.error("gradeAnswer Error:", err)
        const normalized = normalizeControllerError(err, "Failed to grade answer.")
        res.status(normalized.status).json({ message: normalized.message })
    }
}


// ── Mock Interview: Evaluate Answer ──────────────────────────────────────────
async function evaluateMockAnswerController(req, res) {
    try {
        const { interviewId } = req.params
        const { question, userAnswer, questionType, conversationHistory } = req.body

        if (!question || !userAnswer) {
            return res.status(400).json({ message: "question and userAnswer are required." })
        }

        const report = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })
        if (!report) return res.status(404).json({ message: "Report not found." })

        const evaluation = await evaluateMockAnswer({
            question,
            userAnswer,
            questionType: questionType || "technical",
            conversationHistory: conversationHistory || [],
            jobTitle: report.title
        })

        res.status(200).json({ message: "Answer evaluated.", evaluation, source: getAiSource() })
    } catch (err) {
        console.error("evaluateMockAnswer Error:", err)
        const normalized = normalizeControllerError(err, "Failed to evaluate mock answer.")
        res.status(normalized.status).json({ message: normalized.message })
    }
}


// ── Analytics ─────────────────────────────────────────────────────────────────
async function getAnalyticsController(req, res) {
    try {
        const userId = req.user.id

        const reports = await interviewReportModel
            .find({ user: userId })
            .sort({ createdAt: 1 })
            .select("matchScore skillGaps title createdAt")

        const totalSessions = reports.length
        const avgScore = totalSessions > 0
            ? Math.round(reports.reduce((acc, r) => acc + (r.matchScore || 0), 0) / totalSessions)
            : 0
        const bestScore = totalSessions > 0
            ? Math.max(...reports.map(r => r.matchScore || 0))
            : 0

        // Match score trend
        const scoreTrend = reports.map(r => ({
            date: r.createdAt.toISOString().split("T")[0],
            score: r.matchScore || 0,
            title: r.title
        }))

        // Skill gap frequency
        const gapFreq = {}
        reports.forEach(r => {
            (r.skillGaps || []).forEach(g => {
                gapFreq[g.skill] = (gapFreq[g.skill] || 0) + 1
            })
        })
        const topSkillGaps = Object.entries(gapFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([skill, count]) => ({ skill, count }))

        res.status(200).json({
            message: "Analytics fetched.",
            analytics: { totalSessions, avgScore, bestScore, scoreTrend, topSkillGaps }
        })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}


// ── Generate Share Token ──────────────────────────────────────────────────────
async function generateShareTokenController(req, res) {
    try {
        const { interviewId } = req.params
        const report = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })
        if (!report) return res.status(404).json({ message: "Report not found." })

        const token = crypto.randomBytes(20).toString("hex")
        report.shareToken = token
        await report.save()

        res.status(200).json({ message: "Share link generated.", shareToken: token })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}


// ── Get Shared Report (PUBLIC) ────────────────────────────────────────────────
async function getSharedReportController(req, res) {
    try {
        const { token } = req.params
        const report = await interviewReportModel
            .findOne({ shareToken: token })
            .select("-resume -selfDescription -__v -shareToken")

        if (!report) return res.status(404).json({ message: "Shared report not found or link has expired." })

        res.status(200).json({ message: "Shared report fetched.", interviewReport: report })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}


// ── ATS Resume Score ──────────────────────────────────────────────────────────
async function analyzeATSController(req, res) {
    try {
        const { jobDescription, resumeText } = req.body
        if (!jobDescription) return res.status(400).json({ message: "jobDescription is required." })
        const result = await analyzeATSScore({ resumeText: resumeText || "", jobDescription })
        res.status(200).json({ message: "ATS analysis complete.", ats: result, source: getAiSource() })
    } catch (err) {
        console.error("analyzeATS Error:", err)
        const normalized = normalizeControllerError(err, "Failed to analyze ATS score.")
        res.status(normalized.status).json({ message: normalized.message })
    }
}


// ── Salary Coach ────────────────────────────────────────────────────────────────
async function salaryCoachController(req, res) {
    try {
        const { role, company, experience, userMessage, conversationHistory } = req.body
        if (!userMessage) return res.status(400).json({ message: "userMessage is required." })
        const reply = await getSalaryCoachReply({ role, company, experience, userMessage, conversationHistory })
        res.status(200).json({ message: "Salary coach reply.", reply, source: getAiSource() })
    } catch (err) {
        console.error("salaryCoach Error:", err)
        const normalized = normalizeControllerError(err, "Failed to generate salary coach response.")
        res.status(normalized.status).json({ message: normalized.message })
    }
}


// ── Leaderboard ────────────────────────────────────────────────────────
async function getLeaderboardController(req, res) {
    try {
        const top = await interviewReportModel
            .find({ matchScore: { $exists: true } })
            .sort({ matchScore: -1 })
            .limit(20)
            .populate("user", "username")
            .select("title matchScore companyPreset createdAt user")

        const leaderboard = top.map((r, i) => ({
            rank: i + 1,
            title: r.title,
            score: r.matchScore,
            company: r.companyPreset !== "default" ? r.companyPreset : null,
            date: r.createdAt,
            username: r.user?.username || "Anonymous"
        }))

        res.status(200).json({ message: "Leaderboard fetched.", leaderboard })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}


// ── Save Notes ──────────────────────────────────────────────────────────
async function saveNotesController(req, res) {
    try {
        const { interviewId } = req.params
        const { notes } = req.body
        await interviewReportModel.findOneAndUpdate(
            { _id: interviewId, user: req.user.id },
            { notes: notes || "" }
        )
        res.status(200).json({ message: "Notes saved." })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}


// ── Roadmap Progress ────────────────────────────────────────────────
async function updateRoadmapProgressController(req, res) {
    try {
        const { interviewId } = req.params
        const { roadmapProgress } = req.body   // { "1": [0,2], "3": [1] }
        await interviewReportModel.findOneAndUpdate(
            { _id: interviewId, user: req.user.id },
            { roadmapProgress: new Map(Object.entries(roadmapProgress || {})) }
        )
        res.status(200).json({ message: "Roadmap progress saved." })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}


// ── Streak Info ──────────────────────────────────────────────────────────
async function getStreakController(req, res) {
    try {
        const user = await userModel.findById(req.user.id).select("practiceStreak longestStreak totalXP totalSessions lastPracticeDate")
        res.status(200).json({ message: "Streak fetched.", streak: user })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}


// ── Parse Resume PDF (Standalone/ATS) ─────────────────────────────────────────
async function parseResumePdfController(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No PDF file provided." })
        }
        const rawText = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText()
        res.status(200).json({ message: "PDF parsed successfully", text: rawText })
    } catch (err) {
        console.error("parseResumePdf Error:", err)
        res.status(500).json({ message: err.message })
    }
}

module.exports = {
    generateInterViewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    generateResumePdfController,
    gradeAnswerController,
    evaluateMockAnswerController,
    getAnalyticsController,
    generateShareTokenController,
    getSharedReportController,
    analyzeATSController,
    salaryCoachController,
    getLeaderboardController,
    saveNotesController,
    updateRoadmapProgressController,
    getStreakController,
    parseResumePdfController
}