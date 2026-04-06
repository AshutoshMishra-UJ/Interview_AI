const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const interviewController = require("../controllers/interview.controller")
const upload = require("../middlewares/file.middleware")

const interviewRouter = express.Router()

// ── Core ──────────────────────────────────────────────────────────────────────
interviewRouter.post("/", authMiddleware.authUser, upload.single("resume"), interviewController.generateInterViewReportController)
interviewRouter.get("/report/:interviewId", authMiddleware.authUser, interviewController.getInterviewReportByIdController)
interviewRouter.get("/", authMiddleware.authUser, interviewController.getAllInterviewReportsController)
interviewRouter.post("/resume/pdf/:interviewReportId", authMiddleware.authUser, interviewController.generateResumePdfController)

// ── Answer Grader ─────────────────────────────────────────────────────────────
interviewRouter.post("/grade-answer", authMiddleware.authUser, interviewController.gradeAnswerController)

// ── Mock Interview ────────────────────────────────────────────────────────────
interviewRouter.post("/mock/:interviewId/evaluate", authMiddleware.authUser, interviewController.evaluateMockAnswerController)

// ── Analytics ─────────────────────────────────────────────────────────────────
interviewRouter.get("/analytics/me", authMiddleware.authUser, interviewController.getAnalyticsController)

// ── Share ─────────────────────────────────────────────────────────────────────
interviewRouter.post("/share/:interviewId", authMiddleware.authUser, interviewController.generateShareTokenController)
interviewRouter.get("/share/view/:token", interviewController.getSharedReportController)

// ── Tier 1: ATS Score ─────────────────────────────────────────────────────────
interviewRouter.post("/ats-score", authMiddleware.authUser, interviewController.analyzeATSController)

// ── Tier 2: Salary Coach ──────────────────────────────────────────────────────
interviewRouter.post("/salary-coach", authMiddleware.authUser, interviewController.salaryCoachController)

// ── Tier 2: Leaderboard (public) ──────────────────────────────────────────────
interviewRouter.get("/leaderboard", interviewController.getLeaderboardController)

// ── Tier 2: Notes ─────────────────────────────────────────────────────────────
interviewRouter.put("/report/:interviewId/notes", authMiddleware.authUser, interviewController.saveNotesController)

// ── Tier 1: Roadmap Progress ──────────────────────────────────────────────────
interviewRouter.put("/report/:interviewId/roadmap-progress", authMiddleware.authUser, interviewController.updateRoadmapProgressController)

// ── Tier 2: Streak ────────────────────────────────────────────────────────────
interviewRouter.get("/streak", authMiddleware.authUser, interviewController.getStreakController)

module.exports = interviewRouter