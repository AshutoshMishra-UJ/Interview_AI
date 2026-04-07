import React, { useState, useRef } from 'react'
import "../style/home.scss"
import { useInterview } from '../hooks/useInterview.js'
import { useNavigate } from 'react-router'
import { useAuth } from '../../auth/hooks/useAuth.js'

/* ── Drag-and-drop resume dropzone ───────────────────────────── */
function ResumeDropzone({ resumeInputRef }) {
    const [isDragging, setIsDragging] = useState(false)
    const [selectedFile, setSelectedFile] = useState(null)

    const handleDragOver = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragEnter = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        const file = e.dataTransfer.files[0]
        if (!file) return

        const allowed = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
        if (!allowed.includes(file.type)) {
            alert('Only PDF or DOCX files are allowed.')
            return
        }

        // Assign the dropped file to the hidden input via DataTransfer
        const dt = new DataTransfer()
        dt.items.add(file)
        resumeInputRef.current.files = dt.files
        setSelectedFile(file.name)
    }

    const handleInputChange = (e) => {
        const file = e.target.files[0]
        setSelectedFile(file ? file.name : null)
    }

    return (
        <div className='upload-section'>
            <label className='section-label'>
                Upload Resume
                <span className='badge badge--best'>Best Results</span>
            </label>
            <div
                className={`dropzone${isDragging ? ' dropzone--dragging' : ''}${selectedFile ? ' dropzone--has-file' : ''}`}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => resumeInputRef.current.click()}
            >
                <span className='dropzone__icon'>
                    {selectedFile ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10 9 9 9 8 9" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="16 16 12 12 8 16" />
                            <line x1="12" y1="12" x2="12" y2="21" />
                            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                        </svg>
                    )}
                </span>

                {selectedFile ? (
                    <>
                        <p className='dropzone__title dropzone__title--file'>{selectedFile}</p>
                        <p className='dropzone__subtitle'>Click or drag to replace</p>
                    </>
                ) : (
                    <>
                        <p className='dropzone__title'>
                            {isDragging ? 'Drop your file here!' : 'Click to upload or drag & drop'}
                        </p>
                        <p className='dropzone__subtitle'>PDF or DOCX (Max 5MB)</p>
                    </>
                )}

                <input
                    ref={resumeInputRef}
                    hidden
                    type='file'
                    id='resume'
                    name='resume'
                    accept='.pdf,.docx'
                    onChange={handleInputChange}
                />
            </div>
        </div>
    )
}

const COMPANIES = [
    { id: 'default', label: '🏢 Any Company' },
    { id: 'google', label: '🔍 Google' },
    { id: 'amazon', label: '📦 Amazon' },
    { id: 'microsoft', label: '🪟 Microsoft' },
    { id: 'meta', label: '👥 Meta' },
    { id: 'startup', label: '🚀 Startup' },
]

/* ── Main Home page ──────────────────────────────────────────── */
const Home = () => {

    const { loading, generateReport, reports } = useInterview()
    const { handleLogout } = useAuth()
    const [jobDescription, setJobDescription] = useState("")
    const [selfDescription, setSelfDescription] = useState("")
    const [companyPreset, setCompanyPreset] = useState("default")
    const [useGeminiAi, setUseGeminiAi] = useState(true)
    const resumeInputRef = useRef()
    const mockModeNotifiedRef = useRef(false)

    const navigate = useNavigate()

    const onLogout = async () => {
        await handleLogout()
        navigate('/login')
    }

    const handleGenerateReport = async () => {
        const resumeFile = resumeInputRef.current?.files?.[0]

        if (!jobDescription.trim()) {
            alert("Please add the target job description.")
            return
        }

        if (!resumeFile && !selfDescription.trim()) {
            alert("Please upload a resume or add a self-description.")
            return
        }

        try {
            const data = await generateReport({
                jobDescription,
                selfDescription,
                resumeFile,
                companyPreset,
                aiMode: useGeminiAi ? "live" : "mock"
            })
            if (!data?._id) {
                alert("Report generated but could not open it. Please try again.")
                return
            }

            if (data?.__source === "mock" && data?.__fallbackReason === "insufficient_credit") {
                setUseGeminiAi(false)
                alert("Gemini credits are insufficient. Switched to Mock AI mode automatically.")
                mockModeNotifiedRef.current = true
            } else if (data?.__source === "mock" && !mockModeNotifiedRef.current) {
                alert("Mock AI mode is enabled. Results are simulated for functional testing.")
                mockModeNotifiedRef.current = true
            }

            navigate(`/interview/${data._id}`)
        } catch (error) {
            alert(error?.message || "Failed to generate report. Please try again in a moment.")
        }
    }

    if (loading) {
        return (
            <main className='loading-screen'>
                <h1>Loading your interview plan...</h1>
            </main>
        )
    }

    return (
        <div className='home-page'>

            {/* Top Nav */}
            <div className='home-topnav'>
                <span className='home-topnav__brand'>⚡ InterviewAI</span>
                <div className='home-topnav__actions'>
                    <button className='home-topnav__dash' onClick={() => navigate('/dashboard')}>
                        📊 Dashboard
                    </button>
                    <button className='home-topnav__logout' onClick={onLogout}>
                        Logout
                    </button>
                </div>
            </div>

            {/* Page Header */}
            <header className='page-header'>
                <h1>Create Your Custom <span className='highlight'>Interview Plan</span></h1>
                <p>Let our AI analyze the job requirements and your unique profile to build a winning strategy.</p>
            </header>

            {/* Company Preset */}
            <div className='company-selector'>
                <span className='company-selector__label'>Target Company:</span>
                <div className='company-pills'>
                    {COMPANIES.map(c => (
                        <button
                            key={c.id}
                            className={`company-pill${companyPreset === c.id ? ' company-pill--active' : ''}`}
                            onClick={() => setCompanyPreset(c.id)}
                        >
                            {c.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className='ai-toggle'>
                <span className='ai-toggle__label'>Use Gemini AI</span>
                <button
                    type='button'
                    className={`ai-toggle__switch${useGeminiAi ? ' ai-toggle__switch--on' : ''}`}
                    onClick={() => setUseGeminiAi((prev) => !prev)}
                    aria-pressed={useGeminiAi}
                    title={useGeminiAi ? 'Gemini AI enabled' : 'Mock AI enabled'}
                >
                    <span className='ai-toggle__thumb' />
                </button>
                <span className='ai-toggle__mode'>{useGeminiAi ? 'Live' : 'Mock'}</span>
            </div>

            {/* Main Card */}
            <div className='interview-card'>
                <div className='interview-card__body'>

                    {/* Left Panel - Job Description */}
                    <div className='panel panel--left'>
                        <div className='panel__header'>
                            <span className='panel__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                                </svg>
                            </span>
                            <h2>Target Job Description</h2>
                            <span className='badge badge--required'>Required</span>
                        </div>
                        <textarea
                            onChange={(e) => { setJobDescription(e.target.value) }}
                            className='panel__textarea'
                            placeholder={`Paste the full job description here...\ne.g. 'Senior Frontend Engineer at Google requires proficiency in React, TypeScript, and large-scale system design...'`}
                            maxLength={5000}
                        />
                        <div className='char-counter'>0 / 5000 chars</div>
                    </div>

                    {/* Vertical Divider */}
                    <div className='panel-divider' />

                    {/* Right Panel - Profile */}
                    <div className='panel panel--right'>
                        <div className='panel__header'>
                            <span className='panel__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </span>
                            <h2>Your Profile</h2>
                        </div>

                        {/* Upload Resume with real drag & drop */}
                        <ResumeDropzone resumeInputRef={resumeInputRef} />

                        {/* OR Divider */}
                        <div className='or-divider'><span>OR</span></div>

                        {/* Quick Self-Description */}
                        <div className='self-description'>
                            <label className='section-label' htmlFor='selfDescription'>Quick Self-Description</label>
                            <textarea
                                onChange={(e) => { setSelfDescription(e.target.value) }}
                                id='selfDescription'
                                name='selfDescription'
                                className='panel__textarea panel__textarea--short'
                                placeholder="Briefly describe your experience, key skills, and years of experience if you don't have a resume handy..."
                            />
                        </div>

                        {/* Info Box */}
                        <div className='info-box'>
                            <span className='info-box__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" stroke="#1a1f27" strokeWidth="2" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" stroke="#1a1f27" strokeWidth="2" />
                                </svg>
                            </span>
                            <p>Either a <strong>Resume</strong> or a <strong>Self Description</strong> is required to generate a personalized plan.</p>
                        </div>
                    </div>
                </div>

                {/* Card Footer */}
                <div className='interview-card__footer'>
                    <span className='footer-info'>AI-Powered Strategy Generation &bull; Approx 30s</span>
                    <button onClick={handleGenerateReport} className='generate-btn'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                        </svg>
                        Generate My Interview Strategy
                    </button>
                </div>
            </div>

            {/* Recent Reports List */}
            {reports.length > 0 && (
                <section className='recent-reports'>
                    <h2>My Recent Interview Plans</h2>
                    <ul className='reports-list'>
                        {reports.map(report => (
                            <li key={report._id} className='report-item' onClick={() => navigate(`/interview/${report._id}`)}>
                                <h3>{report.title || 'Untitled Position'}</h3>
                                <p className='report-meta'>Generated on {new Date(report.createdAt).toLocaleDateString()}</p>
                                <p className={`match-score ${report.matchScore >= 80 ? 'score--high' : report.matchScore >= 60 ? 'score--mid' : 'score--low'}`}>
                                    Match Score: {report.matchScore}%
                                </p>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Page Footer */}
            <footer className='page-footer'>
                <a href='#'>Privacy Policy</a>
                <a href='#'>Terms of Service</a>
                <a href='#'>Help Center</a>
            </footer>
        </div>
    )
}

export default Home