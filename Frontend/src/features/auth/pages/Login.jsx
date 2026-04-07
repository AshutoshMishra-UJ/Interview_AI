import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'

const Login = () => {

    const { loading, handleLogin, user } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (user) navigate('/')
    }, [user, navigate])

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        const res = await handleLogin({ email, password })
        if (res && res.success) {
            navigate('/')
        } else {
            setError(res?.message || "Login failed")
        }
    }

    if (loading) {
        return (<main className="auth-page"><h1>Loading.......</h1></main>)
    }

    return (
        <main className="auth-page">
            <div className="auth-shell">
                <section className="auth-showcase" aria-hidden="true">
                    <p className="auth-showcase__brand">InterviewAI</p>
                    <h2>Interview prep that feels like a real coaching platform.</h2>
                    <p className="auth-showcase__copy">Create targeted plans, track your score trend, and practice with structured feedback.</p>
                    <div className="auth-showcase__chips">
                        <span>Role-specific plans</span>
                        <span>ATS insights</span>
                        <span>Mock interview flow</span>
                    </div>
                </section>

                <div className="form-container">
                    <p className="auth-brand">InterviewAI</p>
                    <h1>Login</h1>
                    <p className="auth-subtitle">Welcome back. Continue your interview preparation journey.</p>
                    {error && <div className="error-message">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label htmlFor="email">Email</label>
                            <input
                                onChange={(e) => { setEmail(e.target.value) }}
                                type="email" id="email" name='email' placeholder='Enter email address' />
                        </div>
                        <div className="input-group">
                            <label htmlFor="password">Password</label>
                            <input
                                onChange={(e) => { setPassword(e.target.value) }}
                                type="password" id="password" name='password' placeholder='Enter password' />
                        </div>
                        <button className='button primary-button' >Login</button>
                    </form>
                    <p className="auth-switch">Don't have an account? <Link to={"/register"} >Register</Link> </p>
                </div>
            </div>
        </main>
    )
}

export default Login