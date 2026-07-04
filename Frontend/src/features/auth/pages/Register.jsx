import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import "../auth.landing.scss"

const Register = () => {

    const navigate = useNavigate()
    const { loading, handleRegister } = useAuth()


    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        const res = await handleRegister({ username, email, password })
        if (res && res.success) {
            navigate("/app", { replace: true })
        } else {
            setError(res?.message || "Registration failed")
        }
    }

    if (loading) {
        return <main className="auth-page"><h1>Loading...</h1></main>
    }

    return (
        <main className="auth-page auth-page--register">
            <div className="auth-shell">
                <section className="auth-showcase">
                    <Link to="/" className="auth-showcase__brand">Self-Interview AI</Link>
                    <h2>Build calm, repeatable interview confidence with AI coaching.</h2>
                    <p className="auth-showcase__copy">Set your persona, generate a practice flow, and turn anxiety into measurable progress.</p>
                    <div className="auth-showcase__chips">
                        <span>Guided onboarding</span>
                        <span>Personalized prep</span>
                        <span>Progress tracking</span>
                    </div>
                    <div className="auth-showcase__stats">
                        <div><strong>Free</strong><span>No credit card required</span></div>
                        <div><strong>24/7</strong><span>Practice on your schedule</span></div>
                    </div>
                </section>

                <section className="auth-form-card">
                    <div className="auth-form-card__top">
                        <span className="auth-form-card__eyebrow">Create your account</span>
                        <h1>Register</h1>
                        <p>Start your first self-interview session in a few minutes.</p>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleSubmit}>

                        <div className="input-group">
                            <label htmlFor="username">Username</label>
                            <input
                                onChange={(e) => setUsername(e.target.value)}
                                value={username}
                                type="text"
                                id="username"
                                name="username"
                                placeholder="Enter username"
                            />
                        </div>
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

                        <button className='button primary-button'>Register</button>

                    </form>

                    <p className="auth-switch">Already have an account? <Link to="/login">Login</Link></p>
                </section>
            </div>
        </main>
    )
}

export default Register