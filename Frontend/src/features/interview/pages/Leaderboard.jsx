import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { getLeaderboard } from '../services/interview.api'
import '../style/leaderboard.scss'

const RankBadge = ({ rank }) => {
    if (rank === 1) return <span className='rank-badge rank-badge--gold'>1</span>
    if (rank === 2) return <span className='rank-badge rank-badge--silver'>2</span>
    if (rank === 3) return <span className='rank-badge rank-badge--bronze'>3</span>
    return <span className='rank-badge'>{rank}</span>
}

const Leaderboard = () => {
    const [entries, setEntries] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        getLeaderboard()
            .then(d => setEntries(d.leaderboard || []))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    return (
        <div className='lb-page'>
            <header className='lb-header'>
                <button className='lb-back' onClick={() => navigate('/')}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                    Home
                </button>
                <div>
                    <h1>Leaderboard</h1>
                    <p>Top interview match scores across all users</p>
                </div>
            </header>

            {loading ? (
                <div className='lb-loading'>Loading rankings...</div>
            ) : entries.length === 0 ? (
                <div className='lb-empty'>No reports yet. Generate your first interview plan to appear here!</div>
            ) : (
                <>
                    {/* Top 3 podium */}
                    {entries.length >= 3 && (
                        <div className='lb-podium'>
                            <div className='lb-podium__slot lb-podium__slot--2'>
                                <div className='lb-podium__score'>{entries[1]?.score}%</div>
                                <div className='lb-podium__name'>{entries[1]?.username}</div>
                                <div className='lb-podium__bar lb-podium__bar--2'>2</div>
                            </div>
                            <div className='lb-podium__slot lb-podium__slot--1'>
                                <div className='lb-podium__crown'>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#e3b341"><path d="M2 20h20M5 20V9l7-5 7 5v11"/><path d="M9 20V14h6v6"/></svg>
                                </div>
                                <div className='lb-podium__score'>{entries[0]?.score}%</div>
                                <div className='lb-podium__name'>{entries[0]?.username}</div>
                                <div className='lb-podium__bar lb-podium__bar--1'>1</div>
                            </div>
                            <div className='lb-podium__slot lb-podium__slot--3'>
                                <div className='lb-podium__score'>{entries[2]?.score}%</div>
                                <div className='lb-podium__name'>{entries[2]?.username}</div>
                                <div className='lb-podium__bar lb-podium__bar--3'>3</div>
                            </div>
                        </div>
                    )}

                    {/* Full table */}
                    <div className='lb-table'>
                        <div className='lb-table__header'>
                            <span>Rank</span>
                            <span>Role / Report</span>
                            <span>User</span>
                            <span>Company</span>
                            <span>Score</span>
                        </div>
                        {entries.map((e, i) => (
                            <div key={i} className={`lb-row${i < 3 ? ' lb-row--top' : ''}`}>
                                <RankBadge rank={e.rank} />
                                <span className='lb-row__title'>{e.title}</span>
                                <span className='lb-row__user'>{e.username}</span>
                                <span className='lb-row__company'>
                                    {e.company ? <span className='company-pill'>{e.company}</span> : '—'}
                                </span>
                                <span className={`lb-score ${e.score >= 80 ? 'lb-score--high' : e.score >= 60 ? 'lb-score--mid' : 'lb-score--low'}`}>
                                    {e.score}%
                                </span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

export default Leaderboard
