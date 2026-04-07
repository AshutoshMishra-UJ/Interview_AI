import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf } from "../services/interview.api"
import { useContext, useEffect } from "react"
import { InterviewContext } from "../interview.context"
import { useParams } from "react-router"


export const useInterview = () => {

    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports } = context

    const extractErrorMessage = (error, fallbackMessage) => {
        return error?.response?.data?.message || error?.message || fallbackMessage
    }

    const generateReport = async ({ jobDescription, selfDescription, resumeFile, companyPreset, aiMode }) => {
        setLoading(true)
        try {
            const response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile, companyPreset, aiMode })
            if (!response?.interviewReport) {
                throw new Error("Interview report was not returned by the server.")
            }
            const reportWithSource = {
                ...response.interviewReport,
                __source: response?.source || "live",
                __fallbackReason: response?.fallbackReason || null
            }
            setReport(reportWithSource)
            return reportWithSource
        } catch (error) {
            console.log(error)
            throw new Error(extractErrorMessage(error, "Failed to generate interview report."))
        } finally {
            setLoading(false)
        }
    }

    const getReportById = async (interviewId) => {
        setLoading(true)
        try {
            const response = await getInterviewReportById(interviewId)
            if (!response?.interviewReport) {
                throw new Error("Interview report was not returned by the server.")
            }
            setReport(response.interviewReport)
            return response.interviewReport
        } catch (error) {
            console.log(error)
            throw new Error(extractErrorMessage(error, "Failed to fetch interview report."))
        } finally {
            setLoading(false)
        }
    }

    const getReports = async () => {
        setLoading(true)
        try {
            const response = await getAllInterviewReports()
            const allReports = response?.interviewReports || []
            setReports(allReports)
            return allReports
        } catch (error) {
            console.log(error)
            throw new Error(extractErrorMessage(error, "Failed to fetch interview reports."))
        } finally {
            setLoading(false)
        }
    }

    const getResumePdf = async (interviewReportId) => {
        setLoading(true)
        try {
            const response = await generateResumePdf({ interviewReportId })
            const url = window.URL.createObjectURL(new Blob([response], { type: "application/pdf" }))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
        }
        catch (error) {
            console.log(error)
            const message = error?.response?.data?.message || error?.message || "Failed to generate resume PDF."
            alert(message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [interviewId])

    return { loading, report, reports, generateReport, getReportById, getReports, getResumePdf }

}