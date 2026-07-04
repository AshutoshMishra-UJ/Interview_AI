import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { getAnalytics, getAllInterviewReports } from '../services/interview.api'
import { useAuth } from '../../auth/hooks/useAuth'
import '../style/dashboard.scss'

const COLORS = ['#ff2d78', '#ff6b9d', '#e3b341', '#3fb950', '#79c0ff', '#a371f7', '#ffa657', '#f85149']

const SEVERITY_COLOR = ['#ff2d78', '#e3b341', '#3fb950', '#79c0ff', '#a371f7', '#ffa657', '#f85149', '#58a6ff']

const SkillGapBar = ({ skill, count, maxCount, color }) => {
    const pct = Math.round((count / maxCount) * 100)
    return (
        <div className='sg-row'>
            <span className='sg-row__label'>{skill}</span>
            <div className='sg-row__track'>
                <div
                    className='sg-row__fill'
                    style={{ width: `${pct}%`, background: color }}
                />
            </div>
            <span className='sg-row__count'>{count}</span>
        </div>
    )
}

const StatCard = ({ label, value, sub, icon }) => (
    <div className='stat-card'>
        <div className='stat-card__icon'>{icon}</div>
        <div className='stat-card__body'>
            <p className='stat-card__value'>{value}</p>
            <p className='stat-card__label'>{label}</p>
            {sub && <p className='stat-card__sub'>{sub}</p>}
        </div>
    </div>
)

const Dashboard = () => {
    const navigate = useNavigate()
    const { handleLogout } = useAuth()
    const [analytics, setAnalytics] = useState(null)
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([getAnalytics(), getAllInterviewReports()])
            .then(([aRes, rRes]) => {
                setAnalytics(aRes.analytics)
                setReports(rRes.interviewReports || [])
            })
            .catch(err => {
                console.error('Analytics fetch error:', err)
                setAnalytics({ totalSessions: 0, avgScore: 0, bestScore: 0, scoreTrend: [], topSkillGaps: [] })
            })
            .finally(() => setLoading(false))
    }, [])

    const onLogout = async () => {
        await handleLogout()
        navigate('/login', { replace: true })
    }

    if (loading) return <main className='loading-screen'><h1>Loading analytics...</h1></main>
    if (!analytics) return <main className='loading-screen'><h1>Could not load analytics.</h1></main>

    const { totalSessions, avgScore, bestScore, scoreTrend, topSkillGaps } = analytics

    return (
        <div className='dashboard-page'>
            <header className='dash-header'>
                <div>
                    <h1>Analytics Dashboard</h1>
                    <p>Track your interview preparation progress over time</p>
                </div>
                <div className='dash-header__actions'>
                    <button className='dash-new-btn' onClick={() => navigate('/app')}>
                        + New Interview Plan
                    </button>
                    <button className='dash-logout-btn' onClick={onLogout}>
                        Logout
                    </button>
                </div>
            </header>

            {/* Stat Cards */}
            <div className='dash-stats'>
                <StatCard
                    label='Total Sessions' value={totalSessions}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
                />
                <StatCard
                    label='Average Match Score' value={`${avgScore}%`} sub='across all reports'
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>}
                />
                <StatCard
                    label='Best Score' value={`${bestScore}%`} sub='peak performance'
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" /></svg>}
                />
                <StatCard
                    label='Skill Gaps' value={topSkillGaps.length} sub='unique gaps tracked'
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>}
                />
            </div>

            <div className='dash-charts'>
                {/* Match Score Trend */}
                <div className='chart-card'>
                    <h2 className='chart-card__title'>Match Score Over Time</h2>
                    {scoreTrend.length > 1 ? (
                        <ResponsiveContainer width='100%' height={220}>
                            <LineChart data={scoreTrend} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray='3 3' stroke='#21262d' />
                                <XAxis dataKey='date' tick={{ fill: '#7d8590', fontSize: 11 }} />
                                <YAxis domain={[0, 100]} tick={{ fill: '#7d8590', fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', color: '#e6edf3', fontSize: '12px' }}
                                    formatter={(v, _, p) => [`${v}% — ${p.payload.title}`, 'Score']}
                                />
                                <Line type='monotone' dataKey='score' stroke='#ff2d78' strokeWidth={2}
                                    dot={{ fill: '#ff2d78', r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className='chart-empty'>Generate more interview reports to see your score trend</div>
                    )}
                </div>

                {/* Skill Gaps — Custom CSS bars */}
                <div className='chart-card'>
                    <h2 className='chart-card__title'>Most Common Skill Gaps</h2>
                    {topSkillGaps.length > 0 ? (
                        <div className='sg-list'>
                            {topSkillGaps.map((gap, i) => (
                                <SkillGapBar
                                    key={i}
                                    skill={gap.skill}
                                    count={gap.count}
                                    maxCount={topSkillGaps[0].count}
                                    color={SEVERITY_COLOR[i % SEVERITY_COLOR.length]}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className='chart-empty'>No skill gaps recorded yet</div>
                    )}
                </div>
            </div>

            {/* Recent Reports */}
            {reports.length > 0 && (
                <section className='dash-reports'>
                    <h2>Recent Interview Plans</h2>
                    <div className='dash-reports__grid'>
                        {reports.map(r => (
                            <div key={r._id} className='dash-report-card' onClick={() => navigate(`/interview/${r._id}`)}>
                                <div className='dash-report-card__header'>
                                    <h3>{r.title}</h3>
                                    <span className={`score-badge ${r.matchScore >= 80 ? 'score-badge--high' : r.matchScore >= 60 ? 'score-badge--mid' : 'score-badge--low'}`}>
                                        {r.matchScore}%
                                    </span>
                                </div>
                                <p className='dash-report-card__date'>
                                    {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                                {r.companyPreset && r.companyPreset !== 'default' && (
                                    <span className='company-tag'>{r.companyPreset}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}

export default Dashboard
