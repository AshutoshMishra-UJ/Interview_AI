import axios from "axios"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
})

// ── Core ──────────────────────────────────────────────────────────────────────

export const generateInterviewReport = async ({ jobDescription, selfDescription, resumeFile, companyPreset, aiMode }) => {
    const formData = new FormData()
    formData.append("jobDescription", jobDescription)
    formData.append("selfDescription", selfDescription)
    if (resumeFile) formData.append("resume", resumeFile)
    if (companyPreset) formData.append("companyPreset", companyPreset)
    if (aiMode) formData.append("aiMode", aiMode)

    const response = await api.post("/api/interview/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    })
    return response.data
}

export const getInterviewReportById = async (interviewId) => {
    const response = await api.get(`/api/interview/report/${interviewId}`)
    return response.data
}

export const getAllInterviewReports = async () => {
    const response = await api.get("/api/interview/")
    return response.data
}

export const generateResumePdf = async ({ interviewReportId }) => {
    const response = await api.post(`/api/interview/resume/pdf/${interviewReportId}`, null, {
        responseType: "blob"
    })
    return response.data
}

// ── Answer Grader ─────────────────────────────────────────────────────────────

export const gradeAnswer = async ({ question, modelAnswer, userAnswer }) => {
    const response = await api.post("/api/interview/grade-answer", { question, modelAnswer, userAnswer })
    return response.data
}

// ── Mock Interview ────────────────────────────────────────────────────────────

export const evaluateMockAnswer = async ({ interviewId, question, userAnswer, questionType, conversationHistory }) => {
    const response = await api.post(`/api/interview/mock/${interviewId}/evaluate`, {
        question, userAnswer, questionType, conversationHistory
    })
    return response.data
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export const getAnalytics = async () => {
    const response = await api.get("/api/interview/analytics/me")
    return response.data
}

// ── Share ─────────────────────────────────────────────────────────────────────

export const generateShareToken = async (interviewId) => {
    const response = await api.post(`/api/interview/share/${interviewId}`)
    return response.data
}

export const getSharedReport = async (token) => {
    const response = await api.get(`/api/interview/share/view/${token}`)
    return response.data
}

// ── Tier 1: ATS Score ─────────────────────────────────────────────────────────

export const parseResumePdf = async (resumeFile) => {
    const formData = new FormData()
    formData.append("resume", resumeFile)
    const response = await api.post("/api/interview/resume/parse", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    })
    return response.data
}

export const analyzeATS = async ({ jobDescription, resumeText }) => {
    const response = await api.post("/api/interview/ats-score", { jobDescription, resumeText })
    return response.data
}

// ── Tier 2: Salary Coach ──────────────────────────────────────────────────────

export const sendSalaryCoachMessage = async ({ role, company, experience, userMessage, conversationHistory }) => {
    const response = await api.post("/api/interview/salary-coach", {
        role, company, experience, userMessage, conversationHistory
    })
    return response.data
}

// ── Tier 2: Leaderboard ───────────────────────────────────────────────────────

export const getLeaderboard = async () => {
    const response = await api.get("/api/interview/leaderboard")
    return response.data
}

// ── Tier 2: Notes ─────────────────────────────────────────────────────────────

export const saveNotes = async (interviewId, notes) => {
    const response = await api.put(`/api/interview/report/${interviewId}/notes`, { notes })
    return response.data
}

// ── Tier 1: Roadmap Progress ──────────────────────────────────────────────────

export const saveRoadmapProgress = async (interviewId, roadmapProgress) => {
    const response = await api.put(`/api/interview/report/${interviewId}/roadmap-progress`, { roadmapProgress })
    return response.data
}

// ── Tier 2: Streak ────────────────────────────────────────────────────────────

export const getStreak = async () => {
    const response = await api.get("/api/interview/streak")
    return response.data
}