import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router'
import { useAuth } from '../hooks/useAuth'

const Register = () => {

    const navigate = useNavigate()
    const { loading, handleRegister, user } = useAuth()

    useEffect(() => {
        if (user) navigate('/')
    }, [user, navigate])

    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        const res = await handleRegister({ username, email, password })
        if (res && res.success) {
            navigate("/")
        } else {
            setError(res?.message || "Registration failed")
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
                    <h2>Build interview confidence with structured AI guidance.</h2>
                    <p className="auth-showcase__copy">From personalized plans to analytics, everything is designed to improve your outcomes.</p>
                    <div className="auth-showcase__chips">
                        <span>Progress dashboard</span>
                        <span>Question practice</span>
                        <span>Professional resume tools</span>
                    </div>
                </section>

                <div className="form-container">
                    <p className="auth-brand">InterviewAI</p>
                    <h1>Register</h1>
                    <p className="auth-subtitle">Create your account and start building your interview strategy.</p>
                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleSubmit}>

                        <div className="input-group">
                            <label htmlFor="username">Username</label>
                            <input
                                onChange={(e) => { setUsername(e.target.value) }}
                                type="text" id="username" name='username' placeholder='Enter username' />
                        </div>
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

                        <button className='button primary-button' >Register</button>

                    </form>

                    <p className="auth-switch">Already have an account? <Link to={"/login"} >Login</Link> </p>
                </div>
            </div>
        </main>
    )
}

export default Register