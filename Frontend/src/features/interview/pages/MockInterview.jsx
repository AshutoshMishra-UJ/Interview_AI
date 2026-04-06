import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import { evaluateMockAnswer, getInterviewReportById } from '../services/interview.api'
import '../style/mock.scss'

const TYPES = [
    { id: 'technical', label: 'Technical' },
    { id: 'behavioral', label: 'Behavioral' }
]

const TIMER_OPTIONS = [60, 90, 120, 180]

// ── Score Ring ────────────────────────────────────────────────────────────────
const ScoreRing = ({ score }) => {
    const color = score >= 8 ? '#3fb950' : score >= 6 ? '#e3b341' : '#f85149'
    return (
        <div className='score-ring' style={{ '--score-color': color }}>
            <span className='score-ring__val'>{score}</span>
            <span className='score-ring__max'>/10</span>
        </div>
    )
}

// ── Timer Ring ────────────────────────────────────────────────────────────────
const TimerDisplay = ({ seconds, total }) => {
    const pct = seconds / total
    const r = 22
    const circ = 2 * Math.PI * r
    const color = seconds > total * 0.4 ? '#3fb950' : seconds > total * 0.2 ? '#e3b341' : '#f85149'
    const m = Math.floor(seconds / 60)
    const s = String(seconds % 60).padStart(2, '0')
    return (
        <div className='timer-ring'>
            <svg width='60' height='60'>
                <circle cx='30' cy='30' r={r} fill='none' stroke='#21262d' strokeWidth='3' />
                <circle
                    cx='30' cy='30' r={r} fill='none'
                    stroke={color} strokeWidth='3'
                    strokeDasharray={circ}
                    strokeDashoffset={circ * (1 - pct)}
                    strokeLinecap='round'
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
                />
            </svg>
            <span className='timer-ring__time' style={{ color }}>{m}:{s}</span>
        </div>
    )
}

// ── Mic Button ────────────────────────────────────────────────────────────────
const MicButton = ({ isListening, onToggle, supported }) => {
    if (!supported) return null
    return (
        <button
            className={`mic-btn${isListening ? ' mic-btn--active' : ''}`}
            onClick={onToggle}
            title={isListening ? 'Stop voice input' : 'Start voice input'}
            type='button'
        >
            {isListening ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            )}
            {isListening && <span className='mic-pulse' />}
        </button>
    )
}

// ── Main Component ────────────────────────────────────────────────────────────
const MockInterview = () => {
    const { interviewId } = useParams()
    const navigate = useNavigate()

    const [report, setReport] = useState(null)
    const [questionType, setQuestionType] = useState('technical')
    const [timerMode, setTimerMode] = useState(false)
    const [timerDuration, setTimerDuration] = useState(120)
    const [questions, setQuestions] = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [userAnswer, setUserAnswer] = useState('')
    const [conversation, setConversation] = useState([])
    const [evaluation, setEvaluation] = useState(null)
    const [loading, setLoading] = useState(false)
    const [phase, setPhase] = useState('setup')
    const [sessionScore, setSessionScore] = useState([])

    // Voice
    const [voiceSupported, setVoiceSupported] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const recognitionRef = useRef(null)

    // Timer
    const [timeLeft, setTimeLeft] = useState(120)
    const timerRef = useRef(null)

    const bottomRef = useRef()

    // Check voice support
    useEffect(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition
        setVoiceSupported(!!SR)
    }, [])

    useEffect(() => {
        getInterviewReportById(interviewId).then(d => setReport(d.interviewReport))
    }, [interviewId])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [conversation, evaluation])

    // Timer countdown
    useEffect(() => {
        if (phase !== 'interviewing' || !timerMode) return
        clearInterval(timerRef.current)
        setTimeLeft(timerDuration)
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current)
                    return 0
                }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(timerRef.current)
    }, [currentIndex, phase, timerMode])

    // Stop listening on phase change
    useEffect(() => {
        if (phase !== 'interviewing' && recognitionRef.current) {
            recognitionRef.current.stop()
            setIsListening(false)
        }
    }, [phase])

    const toggleVoice = useCallback(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SR) return

        if (isListening) {
            recognitionRef.current?.stop()
            setIsListening(false)
            return
        }

        const rec = new SR()
        rec.continuous = true
        rec.interimResults = true
        rec.lang = 'en-US'

        let interim = ''
        rec.onresult = (e) => {
            interim = ''
            let final = ''
            for (let i = e.resultIndex; i < e.results.length; i++) {
                if (e.results[i].isFinal) final += e.results[i][0].transcript
                else interim += e.results[i][0].transcript
            }
            if (final) setUserAnswer(prev => prev + (prev ? ' ' : '') + final)
        }

        rec.onerror = () => setIsListening(false)
        rec.onend   = () => setIsListening(false)

        recognitionRef.current = rec
        rec.start()
        setIsListening(true)
    }, [isListening])

    const startMock = () => {
        const qs = questionType === 'technical'
            ? report.technicalQuestions
            : report.behavioralQuestions
        setQuestions(qs)
        setCurrentIndex(0)
        setConversation([])
        setPhase('interviewing')
        setEvaluation(null)
        setSessionScore([])
        setUserAnswer('')
    }

    const handleSubmit = async () => {
        if (!userAnswer.trim()) return
        clearInterval(timerRef.current)
        if (recognitionRef.current) { recognitionRef.current.stop(); setIsListening(false) }
        setLoading(true)
        const currentQ = questions[currentIndex]

        try {
            const res = await evaluateMockAnswer({
                interviewId,
                question: currentQ.question,
                userAnswer,
                questionType,
                conversationHistory: conversation
            })
            const ev = res.evaluation || {}
            ev.verdict  = ev.verdict  || 'good'
            ev.score    = ev.score    ?? 5
            ev.feedback = ev.feedback || 'Good attempt.'
            ev.strengths    = ev.strengths    || []
            ev.improvements = ev.improvements || []
            ev.isComplete   = ev.isComplete   ?? false
            setEvaluation(ev)
            setSessionScore(prev => [...prev, ev.score])
            setConversation(prev => [...prev, {
                question: currentQ.question,
                answer: userAnswer,
                evaluation: ev
            }])
            setPhase('evaluated')
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleNext = () => {
        if (evaluation?.isComplete || currentIndex >= questions.length - 1) {
            setPhase('done')
            return
        }
        setCurrentIndex(i => i + 1)
        setUserAnswer('')
        setEvaluation(null)
        setPhase('interviewing')
    }

    const avgScore = sessionScore.length > 0
        ? (sessionScore.reduce((a, b) => a + b, 0) / sessionScore.length).toFixed(1) : 0

    if (!report) return <main className='loading-screen'><h1>Loading mock interview...</h1></main>

    return (
        <div className='mock-page'>
            <header className='mock-header'>
                <button className='mock-back' onClick={() => navigate(`/interview/${interviewId}`)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                    Back
                </button>
                <div className='mock-header__info'>
                    <h1>Mock Interview <span>— {report.title}</span></h1>
                    {sessionScore.length > 0 && (
                        <div className='mock-progress'>
                            <span>Q{currentIndex + 1}/{questions.length}</span>
                            <span className='mock-progress__avg'>Avg: <strong>{avgScore}/10</strong></span>
                        </div>
                    )}
                </div>
                {phase === 'interviewing' && timerMode && (
                    <TimerDisplay seconds={timeLeft} total={timerDuration} />
                )}
            </header>

            <div className='mock-body'>

                {/* ── Setup Screen ── */}
                {phase === 'setup' && (
                    <div className='mock-setup'>
                        <div className='mock-setup__badge'>
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>
                        </div>
                        <h2>AI Mock Interview</h2>
                        <p>The AI asks questions from your plan one by one and provides real-time feedback after each answer. Speak or type your responses.</p>

                        <div className='mock-options'>
                            <div className='mock-option-group'>
                                <label>Question Type</label>
                                <div className='mock-type-selector'>
                                    {TYPES.map(t => (
                                        <button key={t.id}
                                            className={`type-btn${questionType === t.id ? ' type-btn--active' : ''}`}
                                            onClick={() => setQuestionType(t.id)}
                                        >{t.label}</button>
                                    ))}
                                </div>
                            </div>

                            <div className='mock-option-group'>
                                <label>
                                    <input type='checkbox' checked={timerMode} onChange={e => setTimerMode(e.target.checked)} />
                                    &nbsp; Timed Answers
                                </label>
                                {timerMode && (
                                    <div className='timer-select'>
                                        {TIMER_OPTIONS.map(t => (
                                            <button key={t}
                                                className={`timer-opt${timerDuration === t ? ' active' : ''}`}
                                                onClick={() => setTimerDuration(t)}
                                            >{Math.floor(t / 60)}:{String(t % 60).padStart(2, '0')}</button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {voiceSupported && (
                                <div className='mock-option-group'>
                                    <label>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
                                        &nbsp; Voice input available — use mic button while answering
                                    </label>
                                </div>
                            )}
                        </div>

                        <button className='mock-start-btn' onClick={startMock}>
                            Start Session
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        </button>
                        <p className='mock-setup__note'>
                            {questionType === 'technical' ? report.technicalQuestions.length : report.behavioralQuestions.length} {questionType} questions ready
                        </p>
                    </div>
                )}

                {/* ── Interview Screen ── */}
                {(phase === 'interviewing' || phase === 'evaluated') && (
                    <div className='mock-interview'>
                        <div className='mock-chat'>
                            {conversation.map((item, i) => (
                                <div key={i} className='chat-exchange'>
                                    <div className='chat-bubble chat-bubble--ai'>
                                        <span className='bubble-label'>AI Interviewer</span>
                                        {item.question}
                                    </div>
                                    <div className='chat-bubble chat-bubble--user'>
                                        <span className='bubble-label'>You</span>
                                        {item.answer}
                                    </div>
                                    {item.evaluation && (
                                        <div className='chat-eval chat-eval--past'>
                                            <span className={`eval-badge ${item.evaluation.verdict || ''}`}>
                                                {(item.evaluation.verdict || 'good').replace('_', ' ')}
                                            </span>
                                            <span className='eval-score'>{item.evaluation.score ?? '?'}/10</span>
                                        </div>
                                    )}
                                </div>
                            ))}

                            <div className='chat-bubble chat-bubble--ai'>
                                <span className='bubble-label'>AI Interviewer</span>
                                {questions[currentIndex]?.question}
                            </div>

                            {phase === 'interviewing' && (
                                <div className='mock-input-area'>
                                    {timerMode && timeLeft === 0 && (
                                        <div className='timer-expired'>Time is up — submit your answer</div>
                                    )}
                                    <div className='mock-textarea-wrap'>
                                        <textarea
                                            className='mock-textarea'
                                            value={userAnswer}
                                            onChange={e => setUserAnswer(e.target.value)}
                                            placeholder={isListening ? 'Listening... speak your answer' : 'Type your answer or use the mic button...'}
                                            rows={5}
                                            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSubmit() }}
                                        />
                                        {isListening && <div className='voice-wave'><span/><span/><span/><span/><span/></div>}
                                    </div>
                                    <div className='mock-input-footer'>
                                        <div className='mock-input-left'>
                                            <MicButton isListening={isListening} onToggle={toggleVoice} supported={voiceSupported} />
                                            <span className='mock-hint'>Ctrl+Enter to submit</span>
                                        </div>
                                        <button
                                            className='mock-submit-btn'
                                            onClick={handleSubmit}
                                            disabled={loading || !userAnswer.trim()}
                                        >
                                            {loading ? 'Evaluating...' : 'Submit Answer'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {phase === 'evaluated' && evaluation && (
                                <div className='eval-card'>
                                    <div className='eval-card__header'>
                                        <div>
                                            <h3>AI Feedback</h3>
                                            <span className={`verdict-tag verdict-tag--${evaluation.verdict || 'good'}`}>
                                                {(evaluation.verdict || 'good').replace('_', ' ')}
                                            </span>
                                        </div>
                                        <ScoreRing score={evaluation.score} />
                                    </div>

                                    <p className='eval-feedback'>{evaluation.feedback}</p>

                                    <div className='eval-lists'>
                                        <div className='eval-list eval-list--good'>
                                            <h4>Strengths</h4>
                                            <ul>{evaluation.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                                        </div>
                                        <div className='eval-list eval-list--improve'>
                                            <h4>Improvements</h4>
                                            <ul>{evaluation.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul>
                                        </div>
                                    </div>

                                    {evaluation.followUpQuestion && (
                                        <div className='eval-followup'>
                                            <span>Follow-up:</span> {evaluation.followUpQuestion}
                                        </div>
                                    )}

                                    <button className='mock-next-btn' onClick={handleNext}>
                                        {evaluation.isComplete || currentIndex >= questions.length - 1
                                            ? 'See Results' : 'Next Question'}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                                    </button>
                                </div>
                            )}

                            <div ref={bottomRef} />
                        </div>
                    </div>
                )}

                {/* ── Done Screen ── */}
                {phase === 'done' && (
                    <div className='mock-done'>
                        <div className='mock-done__icon'>
                            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#e3b341" strokeWidth="1.5"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
                        </div>
                        <h2>Interview Complete</h2>
                        <div className='done-score-ring'>
                            <span className='done-avg'>{avgScore}</span>
                            <span className='done-max'>/10 avg</span>
                        </div>
                        <p className='done-summary'>
                            You answered {sessionScore.length} questions.
                            {Number(avgScore) >= 7 ? ' Excellent performance!' : ' Keep practising — you are improving!'}
                        </p>

                        <div className='done-breakdown'>
                            {conversation.map((item, i) => (
                                <div key={i} className='done-item'>
                                    <span className='done-item__q'>Q{i + 1}: {item.question.substring(0, 55)}...</span>
                                    <span className={`done-item__score ${item.evaluation?.verdict || 'good'}`}>
                                        {item.evaluation?.score ?? '?'}/10
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className='done-actions'>
                            <button className='mock-start-btn' onClick={() => setPhase('setup')}>Try Again</button>
                            <button className='mock-back-link' onClick={() => navigate(`/interview/${interviewId}`)}>
                                Back to Report
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default MockInterview
