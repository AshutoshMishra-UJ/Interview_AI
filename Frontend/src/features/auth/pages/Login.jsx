import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import "../auth.landing.scss"

const Login = () => {

    const { loading, handleLogin } = useAuth()
    const navigate = useNavigate()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        const res = await handleLogin({ email, password })
        if (res && res.success) {
            navigate('/app', { replace: true })
        } else {
            setError(res?.message || "Login failed")
        }
    }

    if (loading) {
        return <main className="auth-page"><h1>Loading...</h1></main>
    }

    return (
        <main className="auth-page auth-page--login">
            <div className="auth-shell">
                <section className="auth-showcase">
                    <Link to="/" className="auth-showcase__brand">Self-Interview AI</Link>
                    <h2>Practice interviews inside a premium AI feedback loop.</h2>
                    <p className="auth-showcase__copy">Refine your answers, rehearse with confidence, and see exactly where your delivery improves.</p>
                    <div className="auth-showcase__chips">
                        <span>Avatar-led interviews</span>
                        <span>Instant analytics</span>
                        <span>Private practice space</span>
                    </div>
                    <div className="auth-showcase__stats">
                        <div><strong>92%</strong><span>feel more prepared</span></div>
                        <div><strong>3x</strong><span>faster answer improvement</span></div>
                    </div>
                </section>

                <section className="auth-form-card">
                    <div className="auth-form-card__top">
                        <span className="auth-form-card__eyebrow">Welcome back</span>
                        <h1>Login</h1>
                        <p>Continue your interview rehearsal and pick up exactly where you left off.</p>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label htmlFor="email">Email</label>
                            <input
                                onChange={(e) => setEmail(e.target.value)}
                                value={email}
                                type="email"
                                id="email"
                                name="email"
                                placeholder="Enter email address"
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="password">Password</label>
                            <input
                                onChange={(e) => setPassword(e.target.value)}
                                value={password}
                                type="password"
                                id="password"
                                name="password"
                                placeholder="Enter password"
                            />
                        </div>

                        <button className='button primary-button'>Login</button>
                    </form>

                    <p className="auth-switch">Don't have an account? <Link to="/register">Register</Link></p>
                </section>
            </div>
        </main>
    )
}

export default Login