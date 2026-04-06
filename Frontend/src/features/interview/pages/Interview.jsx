import React, { useState, useEffect, useRef, useCallback } from 'react'
import '../style/interview.scss'
import { useInterview } from '../hooks/useInterview.js'
import { useNavigate, useParams } from 'react-router'
import { gradeAnswer, generateShareToken, sendSalaryCoachMessage, saveNotes, saveRoadmapProgress, analyzeATS } from '../services/interview.api'
import Editor from '@monaco-editor/react'

// ── Icons ─────────────────────────────────────────────────────────────────────
const CodeIcon     = () => <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
const ChatIcon     = () => <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
const MapIcon      = () => <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
const CardIcon     = () => <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
const TerminalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
const SalaryIcon   = () => <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
const NoteIcon     = () => <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const ShareIcon    = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
const DownloadIcon = () => <svg height="13" style={{ marginRight: "0.5rem" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10.6144 17.7956 11.492 15.7854C12.2731 13.9966 13.6789 12.5726 15.4325 11.7942L17.8482 10.7219C18.6162 10.381 18.6162 9.26368 17.8482 8.92277L15.5079 7.88394C13.7092 7.08552 12.2782 5.60881 11.5105 3.75894L10.6215 1.61673C10.2916.821765 9.19319.821767 8.8633 1.61673L7.97427 3.75892C7.20657 5.60881 5.77553 7.08552 3.97685 7.88394L1.63658 8.92277C.868537 9.26368.868536 10.381 1.63658 10.7219L4.0523 11.7942C5.80589 12.5726 7.21171 13.9966 7.99275 15.7854L8.8704 17.7956C9.20776 18.5682 10.277 18.5682 10.6144 17.7956ZM19.4014 22.6899 19.6482 22.1242C20.0882 21.1156 20.8807 20.3125 21.8695 19.8732L22.6299 19.5353C23.0412 19.3526 23.0412 18.7549 22.6299 18.5722L21.9121 18.2532C20.8978 17.8026 20.0911 16.9698 19.6586 15.9269L19.4052 15.3156C19.2285 14.8896 18.6395 14.8896 18.4628 15.3156L18.2094 15.9269C17.777 16.9698 16.9703 17.8026 15.956 18.2532L15.2381 18.5722C14.8269 18.7549 14.8269 19.3526 15.2381 19.5353L15.9985 19.8732C16.9874 20.3125 17.7798 21.1156 18.2198 22.1242L18.4667 22.6899C18.6473 23.104 19.2207 23.104 19.4014 22.6899Z"/></svg>
const AtsIcon      = () => <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>

const NAV_ITEMS = [
    { id: 'technical',  label: 'Technical',  icon: <CodeIcon /> },
    { id: 'behavioral', label: 'Behavioral', icon: <ChatIcon /> },
    { id: 'roadmap',    label: 'Road Map',   icon: <MapIcon /> },
    { id: 'coding',     label: 'Challenges', icon: <TerminalIcon /> },
    { id: 'ats',        label: 'ATS Analysis',icon: <AtsIcon /> },
    { id: 'flashcards', label: 'Flashcards', icon: <CardIcon /> },
    { id: 'salary',     label: 'Salary',     icon: <SalaryIcon /> },
    { id: 'notes',      label: 'Notes',      icon: <NoteIcon /> },
]

// ── Piston Code Execution ─────────────────────────────────────────────────────
const PISTON_API = 'https://emkc.org/api/v2/piston/execute'
const PISTON_LANGS = {
    javascript: { language: 'javascript', version: '*' },
    python:     { language: 'python',     version: '*'  },
    java:       { language: 'java',       version: '*'  },
}

const runCode = async (code, lang) => {
    const cfg = PISTON_LANGS[lang] || PISTON_LANGS.javascript
    const res = await fetch(PISTON_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: cfg.language, version: cfg.version, files: [{ content: code }] })
    })
    return res.json()
}

// ── Answer Grader Card ────────────────────────────────────────────────────────
const QuestionCard = ({ item, index }) => {
    const [open, setOpen] = useState(false)
    const [practiceMode, setPracticeMode] = useState(false)
    const [userAnswer, setUserAnswer] = useState('')
    const [grade, setGrade] = useState(null)
    const [grading, setGrading] = useState(false)

    const handleGrade = async () => {
        if (!userAnswer.trim()) return
        setGrading(true)
        try {
            const res = await gradeAnswer({ question: item.question, modelAnswer: item.answer, userAnswer })
            setGrade(res.grade)
        } catch (e) { console.error(e) }
        finally { setGrading(false) }
    }

    const verdictColor = { excellent: '#3fb950', good: '#e3b341', needs_work: '#ffa657', poor: '#f85149' }

    return (
        <div className='q-card'>
            <div className='q-card__header' onClick={() => setOpen(o => !o)}>
                <span className='q-card__index'>Q{index + 1}</span>
                <p className='q-card__question'>{item.question}</p>
                <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                </span>
            </div>
            {open && (
                <div className='q-card__body'>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--intention'>Intention</span>
                        <p>{item.intention}</p>
                    </div>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--answer'>Model Answer</span>
                        <p>{item.answer}</p>
                    </div>
                    {!practiceMode ? (
                        <button className='practice-btn' onClick={e => { e.stopPropagation(); setPracticeMode(true) }}>
                            Practice Your Answer
                        </button>
                    ) : (
                        <div className='grade-area' onClick={e => e.stopPropagation()}>
                            <div className='grade-area__header'>
                                <span>Your Answer</span>
                                <button className='grade-area__close' onClick={() => { setPracticeMode(false); setGrade(null); setUserAnswer('') }}>✕</button>
                            </div>
                            <textarea className='grade-textarea' value={userAnswer} onChange={e => setUserAnswer(e.target.value)} placeholder='Type your answer here...' rows={4} />
                            <button className='grade-submit-btn' onClick={handleGrade} disabled={grading || !userAnswer.trim()}>
                                {grading ? 'Analyzing...' : 'Get AI Feedback'}
                            </button>
                            {grade && (
                                <div className='grade-result'>
                                    <div className='grade-result__header'>
                                        <div className='grade-scores'>
                                            {[['Overall', grade.overallScore], ['Accuracy', grade.accuracyScore], ['Depth', grade.depthScore], ['Clarity', grade.clarityScore]].map(([lbl, val]) => (
                                                <div key={lbl} className='grade-score-item'>
                                                    <span className='score-val'>{val}/10</span>
                                                    <span className='score-lbl'>{lbl}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <span className='grade-verdict' style={{ color: verdictColor[grade.verdict] }}>
                                            {(grade.verdict || '').replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className='grade-feedback-cols'>
                                        {grade.strengths?.length > 0 && (
                                            <div className='grade-col grade-col--good'>
                                                <h4>Strengths</h4>
                                                <ul>{grade.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                                            </div>
                                        )}
                                        {grade.improvements?.length > 0 && (
                                            <div className='grade-col grade-col--improve'>
                                                <h4>Improvements</h4>
                                                <ul>{grade.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul>
                                            </div>
                                        )}
                                    </div>
                                    {grade.missedKeyPoints?.length > 0 && (
                                        <div className='grade-missed'>
                                            <h4>Missed Key Points</h4>
                                            <ul>{grade.missedKeyPoints.map((s, i) => <li key={i}>{s}</li>)}</ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ── Road Map with Checkboxes ───────────────────────────────────────────────────
const RoadMapDay = ({ day, completedTasks, onToggleTask }) => {
    const completed = completedTasks || []
    const pct = day.tasks.length > 0 ? Math.round((completed.length / day.tasks.length) * 100) : 0

    return (
        <div className='roadmap-day'>
            <div className='roadmap-day__header'>
                <span className='roadmap-day__badge'>Day {day.day}</span>
                <h3 className='roadmap-day__focus'>{day.focus}</h3>
                <span className='roadmap-day__pct'>{pct}%</span>
            </div>
            {pct > 0 && (
                <div className='roadmap-day__progress'>
                    <div className='roadmap-day__progress-fill' style={{ width: `${pct}%` }} />
                </div>
            )}
            <ul className='roadmap-day__tasks'>
                {day.tasks.map((task, i) => {
                    const done = completed.includes(i)
                    return (
                        <li key={i} className={done ? 'done' : ''} onClick={() => onToggleTask(day.day, i)}>
                            <span className={`roadmap-check ${done ? 'roadmap-check--done' : ''}`}>
                                {done ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                ) : null}
                            </span>
                            {task}
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

// ── LeetCode Challenge with Code Execution ────────────────────────────────────
const LANG_OPTIONS = [
    { id: 'javascript', label: 'JavaScript' },
    { id: 'python',     label: 'Python' },
    { id: 'java',       label: 'Java' },
]

const LANG_STARTERS = {
    python:     (t) => `# ${t}\n\ndef solution():\n    # Write your solution here\n    pass\n`,
    java:       (t) => `// ${t}\n\nclass Solution {\n    public int[] solve(int[] input) {\n        // Write your solution here\n        return new int[]{};\n    }\n}`,
    javascript: (t) => `/**\n * ${t}\n * @param {*} input\n * @return {*}\n */\nfunction solution(input) {\n    // Write your solution here\n\n};\n`,
}

const DIFF_MAP = {
    Easy: { cls: 'easy',   label: 'Easy' },   easy: { cls: 'easy',   label: 'Easy' },
    Medium: { cls: 'medium', label: 'Medium' }, medium: { cls: 'medium', label: 'Medium' },
    Hard: { cls: 'hard',   label: 'Hard' },   hard: { cls: 'hard',   label: 'Hard' },
}

const ChallengeCard = ({ challenge, index }) => {
    const [lang, setLang] = useState('javascript')
    const [showHint, setShowHint] = useState(false)
    const [showSolution, setShowSolution] = useState(false)
    const [code, setCode] = useState(() => challenge.starterCode || LANG_STARTERS.javascript(challenge.title))
    const [running, setRunning] = useState(false)
    const [output, setOutput] = useState(null)

    const diff = DIFF_MAP[challenge.difficulty] || { cls: 'medium', label: challenge.difficulty }

    const switchLang = (l) => {
        setLang(l)
        setOutput(null)
        if (l === 'javascript') setCode(challenge.starterCode || LANG_STARTERS.javascript(challenge.title))
        else setCode(LANG_STARTERS[l]?.(challenge.title) || `// ${challenge.title}\n// Write your solution here\n`)
    }

    const handleRun = async () => {
        setRunning(true)
        setOutput(null)
        try {
            const res = await runCode(code, lang)
            if (res.compile && res.compile.code !== 0) {
                setOutput(res.compile)
            } else {
                setOutput(res.run || { stdout: '', stderr: 'Execution failed or timed out', code: 1 })
            }
        } catch (e) {
            setOutput({ stdout: '', stderr: e.message, code: 1 })
        } finally { setRunning(false) }
    }

    const problemText = challenge.problemStatement || challenge.description || ''

    return (
        <div className='lc-card'>
            <div className='lc-card__header'>
                <div className='lc-card__title-row'>
                    <span className='lc-num'>{index + 1}</span>
                    <h3 className='lc-title'>{challenge.title}</h3>
                    <span className={`lc-diff lc-diff--${diff.cls}`}>{diff.label}</span>
                </div>
                <div className='lc-card__meta'>
                    {challenge.category && <span className='lc-category'>{challenge.category}</span>}
                    {challenge.topics?.map((t, i) => <span key={i} className='lc-topic'>{t}</span>)}
                    {challenge.timeComplexity && (
                        <span className='lc-complexity'>
                            Time: <strong>{challenge.timeComplexity}</strong>
                            {challenge.spaceComplexity && <> &nbsp;·&nbsp; Space: <strong>{challenge.spaceComplexity}</strong></>}
                        </span>
                    )}
                </div>
            </div>

            <div className='lc-split'>
                {/* Problem */}
                <div className='lc-problem'>
                    <div className='lc-section'>
                        <p className='lc-statement'>{problemText}</p>
                    </div>
                    {challenge.examples?.length > 0 && (
                        <div className='lc-section'>
                            <h4 className='lc-section__title'>Examples</h4>
                            {challenge.examples.map((ex, i) => (
                                <div key={i} className='lc-example'>
                                    <div className='lc-example__label'>Example {i + 1}</div>
                                    <div className='lc-example__io'>
                                        <div className='lc-example__row'><span>Input</span><code>{ex.input}</code></div>
                                        <div className='lc-example__row'><span>Output</span><code>{ex.output}</code></div>
                                    </div>
                                    {ex.explanation && <p className='lc-example__explain'>{ex.explanation}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                    {challenge.constraints?.length > 0 && (
                        <div className='lc-section'>
                            <h4 className='lc-section__title'>Constraints</h4>
                            <ul className='lc-constraints'>
                                {challenge.constraints.map((c, i) => <li key={i}><code>{c}</code></li>)}
                            </ul>
                        </div>
                    )}
                    {showHint && challenge.hint && (
                        <div className='lc-hint'>
                            <strong>Hint</strong>
                            <p>{challenge.hint}</p>
                        </div>
                    )}
                </div>

                {/* Editor */}
                <div className='lc-editor-pane'>
                    <div className='lc-editor-header'>
                        <div className='lc-lang-tabs'>
                            {LANG_OPTIONS.map(l => (
                                <button key={l.id} className={`lc-lang-tab${lang === l.id ? ' active' : ''}`} onClick={() => switchLang(l.id)}>
                                    {l.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className='lc-monaco'>
                        <Editor
                            height='280px' language={lang} value={code} onChange={v => setCode(v || '')} theme='vs-dark'
                            options={{ minimap: { enabled: false }, fontSize: 13, lineNumbers: 'on', scrollBeyondLastLine: false, automaticLayout: true, tabSize: 4, wordWrap: 'on', padding: { top: 12, bottom: 12 }, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontLigatures: true }}
                        />
                    </div>
                    <div className='lc-editor-actions'>
                        <button className='lc-hint-btn' onClick={() => setShowHint(h => !h)}>
                            {showHint ? 'Hide Hint' : 'Show Hint'}
                        </button>
                        <button className='lc-run-btn' onClick={handleRun} disabled={running}>
                            {running ? 'Running...' : 'Run Code'}
                        </button>
                        <button className='lc-solution-btn' onClick={() => setShowSolution(s => !s)}>
                            {showSolution ? 'Hide Solution' : 'View Solution'}
                        </button>
                    </div>
                    {/* Output Panel */}
                    {output && (
                        <div className='lc-output'>
                            <div className='lc-output__header'>
                                <span>Output</span>
                                <span className={`lc-output__status ${output.code === 0 ? 'ok' : 'err'}`}>
                                    {output.code === 0 ? 'Passed' : 'Error'}
                                </span>
                            </div>
                            <pre className='lc-output__body'>
                                {output.stdout || output.stderr || 'No output'}
                            </pre>
                        </div>
                    )}
                </div>
            </div>

            {showSolution && (
                <div className='lc-solution'>
                    <div className='lc-solution__header'>
                        <span>Solution — JavaScript</span>
                        {challenge.timeComplexity && (
                            <span className='lc-sol-complexity'>
                                Time: {challenge.timeComplexity} &nbsp;·&nbsp; Space: {challenge.spaceComplexity}
                            </span>
                        )}
                    </div>
                    <Editor
                        height='230px' language='javascript' value={challenge.solution} theme='vs-dark'
                        options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false, automaticLayout: true, fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
                    />
                </div>
            )}
        </div>
    )
}

// ── Flashcard ─────────────────────────────────────────────────────────────────
const Flashcard = ({ item, index, total, onResult }) => {
    const [flipped, setFlipped] = useState(false)
    return (
        <div className='flashcard-wrapper'>
            <p className='flashcard-progress'>Card <span>{index + 1}</span> of <span>{total}</span></p>
            <div className={`flashcard${flipped ? ' flashcard--flipped' : ''}`} onClick={() => setFlipped(f => !f)}>
                <div className='flashcard__inner'>
                    <div className='flashcard__front'>
                        <span className='flashcard__label'>Question</span>
                        <p className='flashcard__text'>{item.question}</p>
                        <span className='flashcard__tap'>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
                            Tap to reveal
                        </span>
                    </div>
                    <div className='flashcard__back'>
                        <span className='flashcard__label'>Model Answer</span>
                        <p className='flashcard__text'>{item.answer}</p>
                    </div>
                </div>
            </div>
            {flipped && (
                <div className='flashcard-actions'>
                    <button className='fc-btn fc-btn--nope' onClick={() => { setFlipped(false); onResult('needs_work') }}>Need Practice</button>
                    <button className='fc-btn fc-btn--got'  onClick={() => { setFlipped(false); onResult('got_it') }}>Got It</button>
                </div>
            )}
        </div>
    )
}

const FlashcardSection = ({ questions, type }) => {
    const storageKey = `fc_${type}_progress`
    const [index, setIndex] = useState(0)
    const [results, setResults] = useState(() => { try { return JSON.parse(localStorage.getItem(storageKey)) || {} } catch { return {} } })
    const [done, setDone] = useState(false)

    const handleResult = (result) => {
        const newResults = { ...results, [index]: result }
        setResults(newResults)
        localStorage.setItem(storageKey, JSON.stringify(newResults))
        const nextPending = questions.filter((_, i) => newResults[i] !== 'got_it')
        if (nextPending.length === 0) { setDone(true); return }
        let next = (index + 1) % questions.length
        while (newResults[next] === 'got_it') next = (next + 1) % questions.length
        setIndex(next)
    }

    const masteredCount = Object.values(results).filter(v => v === 'got_it').length
    const pct = Math.round((masteredCount / questions.length) * 100)

    if (done) return (
        <div className='fc-complete'>
            <div className='fc-complete__icon'>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3fb950" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3>All Cards Mastered</h3>
            <p>You have completed all {questions.length} questions in this set.</p>
            <button className='fc-reset-btn' onClick={() => { setResults({}); localStorage.removeItem(storageKey); setIndex(0); setDone(false) }}>Reset Progress</button>
        </div>
    )

    return (
        <div className='flashcard-section'>
            <div className='fc-mastery-bar'><div className='fc-mastery-bar__fill' style={{ width: `${pct}%` }} /></div>
            <p className='fc-mastery-label'>{masteredCount}/{questions.length} mastered ({pct}%)</p>
            <Flashcard item={questions[index]} index={index} total={questions.filter((_, i) => results[i] !== 'got_it').length} onResult={handleResult} />
        </div>
    )
}

// ── ATS Analyzer ──────────────────────────────────────────────────────────────
const AtsAnalyzer = ({ report }) => {
    const [resumeText, setResumeText] = useState('')
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)

    const analyze = async () => {
        if (!resumeText.trim()) return
        setLoading(true)
        try {
            const res = await analyzeATS({ jobDescription: report.jobDescription, resumeText })
            setResult(res.atsResult)
        } catch (e) {
            console.error(e)
            alert('Failed to analyze ATS score')
        } finally { setLoading(false) }
    }

    return (
        <div className='ats-analyzer'>
            {!result ? (
                <div className='ats-input'>
                    <p className='ats-input__desc'>Paste the raw text of a resume to evaluate how well it matches the targeted job description.</p>
                    <textarea 
                        value={resumeText} 
                        onChange={e => setResumeText(e.target.value)} 
                        placeholder='Paste your resume text here...'
                        rows={12}
                    />
                    <button onClick={analyze} disabled={loading || !resumeText.trim()}>
                        {loading ? 'Analyzing...' : 'Get ATS Score'}
                    </button>
                    <span className='ats-hint'>Analysis takes ~15 seconds</span>
                </div>
            ) : (
                <div className='ats-result'>
                    <div className='ats-result__header'>
                        <div className={`ats-score-ring ats-score-ring--${result.matchScore >= 80 ? 'high' : result.matchScore >= 60 ? 'mid' : 'low'}`}>
                            <span className='ats-score-ring__val'>{result.matchScore}</span>
                            <span className='ats-score-ring__pct'>%</span>
                        </div>
                        <div className='ats-result__title'>
                            <h3>ATS Match Score</h3>
                            <p>Verdict: <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{(result.verdict || '').replace('_', ' ')}</span></p>
                        </div>
                    </div>
                    
                    <div className='ats-lists'>
                        <div className='ats-list'>
                            <h4>✅ Matched Keywords</h4>
                            <div className='ats-tags'>
                                {result.matchedKeywords?.map((k, i) => <span key={i} className='ats-tag ats-tag--match'>{k}</span>)}
                            </div>
                        </div>
                        <div className='ats-list'>
                            <h4>❌ Missing Keywords</h4>
                            <div className='ats-tags'>
                                {result.missingKeywords?.map((k, i) => <span key={i} className='ats-tag ats-tag--miss'>{k}</span>)}
                            </div>
                        </div>
                    </div>

                    {result.improvementSuggestions?.length > 0 && (
                        <div className='ats-suggestions'>
                            <h4>Suggestions for Improvement</h4>
                            <ul>{result.improvementSuggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
                        </div>
                    )}

                    <button className='ats-reset' onClick={() => setResult(null)}>Analyze Another Resume</button>
                </div>
            )}
        </div>
    )
}

// ── Salary Coach ──────────────────────────────────────────────────────────────
const SalaryCoach = ({ report }) => {
    const [messages, setMessages] = useState([
        { role: 'coach', content: `Hello! I am your salary negotiation coach. Tell me about your target role and I will help you negotiate confidently.` }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const bottomRef = useRef()

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

    const send = async () => {
        if (!input.trim() || loading) return
        const userMsg = { role: 'user', content: input }
        setMessages(m => [...m, userMsg])
        setInput('')
        setLoading(true)
        try {
            const res = await sendSalaryCoachMessage({
                role: report.title,
                company: report.companyPreset !== 'default' ? report.companyPreset : '',
                userMessage: input,
                conversationHistory: messages
            })
            setMessages(m => [...m, { role: 'coach', content: res.reply }])
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    return (
        <div className='salary-coach'>
            <div className='salary-coach__messages'>
                {messages.map((m, i) => (
                    <div key={i} className={`sc-bubble sc-bubble--${m.role}`}>
                        <span className='sc-bubble__label'>{m.role === 'coach' ? 'Coach' : 'You'}</span>
                        <p>{m.content}</p>
                    </div>
                ))}
                {loading && (
                    <div className='sc-bubble sc-bubble--coach'>
                        <span className='sc-bubble__label'>Coach</span>
                        <div className='sc-thinking'><span/><span/><span/></div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>
            <div className='salary-coach__input'>
                <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                    placeholder='Ask about salary ranges, negotiation tactics, offer evaluation...'
                    rows={2}
                />
                <button onClick={send} disabled={loading || !input.trim()}>Send</button>
            </div>
        </div>
    )
}

// ── Notes Pad ─────────────────────────────────────────────────────────────────
const NotesPad = ({ interviewId, initialNotes }) => {
    const [notes, setNotes] = useState(initialNotes || '')
    const [saved, setSaved] = useState(false)
    const saveTimer = useRef()

    const handleChange = (v) => {
        setNotes(v)
        setSaved(false)
        clearTimeout(saveTimer.current)
        saveTimer.current = setTimeout(async () => {
            try { await saveNotes(interviewId, v); setSaved(true); setTimeout(() => setSaved(false), 2000) }
            catch (e) { console.error(e) }
        }, 1200)
    }

    return (
        <div className='notes-pad'>
            <div className='notes-pad__header'>
                <span>Session Notes</span>
                {saved && <span className='notes-saved'>Saved</span>}
            </div>
            <textarea
                className='notes-textarea'
                value={notes}
                onChange={e => handleChange(e.target.value)}
                placeholder='Write your notes, key takeaways, or things to review later...'
                rows={18}
            />
            <p className='notes-hint'>Auto-saved as you type</p>
        </div>
    )
}

// ── Share Button ──────────────────────────────────────────────────────────────
const ShareButton = ({ interviewId }) => {
    const [copied, setCopied] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleShare = async () => {
        setLoading(true)
        try {
            const res = await generateShareToken(interviewId)
            const url = `${window.location.origin}/share/${res.shareToken}`
            await navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 3000)
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    return (
        <button className='share-btn' onClick={handleShare} disabled={loading}>
            <ShareIcon />
            {copied ? 'Link Copied' : loading ? 'Generating...' : 'Share Report'}
        </button>
    )
}

// ── Main Interview Page ───────────────────────────────────────────────────────
const Interview = () => {
    const [activeNav, setActiveNav] = useState('technical')
    const [flashcardType, setFlashcardType] = useState('technical')
    const [roadmapProgress, setRoadmapProgress] = useState({}) // { dayNum: [taskIndex] }
    const { report, getReportById, loading, getResumePdf } = useInterview()
    const { interviewId } = useParams()
    const navigate = useNavigate()

    useEffect(() => {
        if (interviewId) getReportById(interviewId)
    }, [interviewId])

    // Load roadmap progress from report
    useEffect(() => {
        if (report?.roadmapProgress) {
            const parsed = {}
            if (report.roadmapProgress instanceof Map) {
                report.roadmapProgress.forEach((v, k) => { parsed[k] = v })
            } else if (typeof report.roadmapProgress === 'object') {
                Object.assign(parsed, report.roadmapProgress)
            }
            setRoadmapProgress(parsed)
        }
    }, [report])

    const toggleTask = useCallback(async (day, taskIdx) => {
        setRoadmapProgress(prev => {
            const key = String(day)
            const existing = prev[key] || []
            const newList = existing.includes(taskIdx)
                ? existing.filter(i => i !== taskIdx)
                : [...existing, taskIdx]
            const newProgress = { ...prev, [key]: newList }
            saveRoadmapProgress(interviewId, newProgress).catch(console.error)
            return newProgress
        })
    }, [interviewId])

    if (loading || !report) {
        return <main className='loading-screen'><h1>Loading your interview plan...</h1></main>
    }

    const scoreColor = report.matchScore >= 80 ? 'score--high' : report.matchScore >= 60 ? 'score--mid' : 'score--low'

    return (
        <div className='interview-page'>
            <div className='interview-layout'>

                {/* ── Left Nav ── */}
                <nav className='interview-nav'>
                    <div className='nav-content'>
                        <p className='interview-nav__label'>Sections</p>
                        {NAV_ITEMS.map(item => (
                            <button
                                key={item.id}
                                className={`interview-nav__item ${activeNav === item.id ? 'interview-nav__item--active' : ''}`}
                                onClick={() => setActiveNav(item.id)}
                            >
                                <span className='interview-nav__icon'>{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <div className='nav-actions'>
                        <button className='mock-interview-btn' onClick={() => navigate(`/interview/${interviewId}/mock`)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                            Mock Interview
                        </button>
                        <ShareButton interviewId={interviewId} />
                        <button onClick={() => getResumePdf(interviewId)} className='button primary-button'>
                            <DownloadIcon />Download Resume
                        </button>
                    </div>
                </nav>

                <div className='interview-divider' />

                {/* ── Center Content ── */}
                <main className='interview-content'>
                    {activeNav === 'technical' && (
                        <section>
                            <div className='content-header'>
                                <h2>Technical Questions</h2>
                                <span className='content-header__count'>{report.technicalQuestions.length} questions</span>
                            </div>
                            <div className='q-list'>
                                {report.technicalQuestions.map((q, i) => <QuestionCard key={i} item={q} index={i} />)}
                            </div>
                        </section>
                    )}

                    {activeNav === 'behavioral' && (
                        <section>
                            <div className='content-header'>
                                <h2>Behavioral Questions</h2>
                                <span className='content-header__count'>{report.behavioralQuestions.length} questions</span>
                            </div>
                            <div className='q-list'>
                                {report.behavioralQuestions.map((q, i) => <QuestionCard key={i} item={q} index={i} />)}
                            </div>
                        </section>
                    )}

                    {activeNav === 'roadmap' && (
                        <section>
                            <div className='content-header'>
                                <h2>Preparation Road Map</h2>
                                <span className='content-header__count'>{report.preparationPlan.length}-day plan</span>
                            </div>
                            <div className='roadmap-list'>
                                {report.preparationPlan.map(day => (
                                    <RoadMapDay
                                        key={day.day}
                                        day={day}
                                        completedTasks={roadmapProgress[String(day.day)] || []}
                                        onToggleTask={toggleTask}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === 'coding' && (
                        <section>
                            <div className='content-header'>
                                <h2>Coding Challenges</h2>
                                <span className='content-header__count'>{(report.codingChallenges || []).length} problems</span>
                            </div>
                            {(report.codingChallenges || []).length === 0 ? (
                                <div className='empty-state'>No coding challenges generated. Create a new report to get role-specific problems.</div>
                            ) : (
                                <div className='challenge-list'>
                                    {report.codingChallenges.map((c, i) => <ChallengeCard key={i} challenge={c} index={i} />)}
                                </div>
                            )}
                        </section>
                    )}

                    {activeNav === 'ats' && (
                        <section>
                            <div className='content-header'>
                                <h2>ATS Resume Analyzer</h2>
                                <span className='content-header__count'>evaluate your resume</span>
                            </div>
                            <AtsAnalyzer report={report} />
                        </section>
                    )}

                    {activeNav === 'flashcards' && (
                        <section>
                            <div className='content-header'><h2>Flashcard Study Mode</h2></div>
                            <div className='fc-type-toggle'>
                                <button className={`fc-toggle-btn${flashcardType === 'technical' ? ' active' : ''}`} onClick={() => setFlashcardType('technical')}>Technical</button>
                                <button className={`fc-toggle-btn${flashcardType === 'behavioral' ? ' active' : ''}`} onClick={() => setFlashcardType('behavioral')}>Behavioral</button>
                            </div>
                            <FlashcardSection
                                key={flashcardType}
                                questions={flashcardType === 'technical' ? report.technicalQuestions : report.behavioralQuestions}
                                type={`${interviewId}_${flashcardType}`}
                            />
                        </section>
                    )}

                    {activeNav === 'salary' && (
                        <section>
                            <div className='content-header'>
                                <h2>Salary Negotiation Coach</h2>
                                <span className='content-header__count'>AI-powered</span>
                            </div>
                            <SalaryCoach report={report} />
                        </section>
                    )}

                    {activeNav === 'notes' && (
                        <section>
                            <div className='content-header'>
                                <h2>Session Notes</h2>
                                <span className='content-header__count'>auto-saved</span>
                            </div>
                            <NotesPad interviewId={interviewId} initialNotes={report.notes || ''} />
                        </section>
                    )}
                </main>

                <div className='interview-divider' />

                {/* ── Right Sidebar ── */}
                <aside className='interview-sidebar'>
                    <div className='match-score'>
                        <p className='match-score__label'>Match Score</p>
                        <div className={`match-score__ring ${scoreColor}`}>
                            <span className='match-score__value'>{report.matchScore}</span>
                            <span className='match-score__pct'>%</span>
                        </div>
                        <p className='match-score__sub'>
                            {report.matchScore >= 80 ? 'Strong match' : report.matchScore >= 60 ? 'Good match' : 'Needs improvement'}
                        </p>
                    </div>

                    <div className='sidebar-divider' />

                    <div className='skill-gaps'>
                        <p className='skill-gaps__label'>Skill Gaps</p>
                        <div className='skill-gaps__list'>
                            {report.skillGaps.map((gap, i) => (
                                <span key={i} className={`skill-tag skill-tag--${gap.severity}`}>{gap.skill}</span>
                            ))}
                        </div>
                    </div>

                    {report.companyPreset && report.companyPreset !== 'default' && (
                        <>
                            <div className='sidebar-divider' />
                            <div className='sidebar-company'>
                                <p className='sidebar-company__label'>Target Company</p>
                                <span className='company-badge'>{report.companyPreset}</span>
                            </div>
                        </>
                    )}

                    <div className='sidebar-divider' />
                    <div className='sidebar-links'>
                        <button className='sidebar-link-btn' onClick={() => navigate('/')}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                            Home
                        </button>
                        <button className='sidebar-link-btn' onClick={() => navigate('/leaderboard')}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
                            Leaderboard
                        </button>
                        <button className='sidebar-link-btn' onClick={() => navigate('/dashboard')}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                            Analytics
                        </button>
                    </div>
                </aside>
            </div>
        </div>
    )
}

export default Interview