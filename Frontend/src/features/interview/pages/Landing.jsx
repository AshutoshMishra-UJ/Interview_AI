import { Link, useNavigate } from "react-router"
import { useAuth } from "../../auth/hooks/useAuth"
import "../style/landing.scss"
import websiteLogo from "../../../assets/landing/logo.png"
import heroScene from "../../../assets/landing/uploaded/hero-scene.png"
import personaScenarios from "../../../assets/landing/uploaded/persona-scenarios.png"
import interviewSession from "../../../assets/landing/uploaded/interview-session.png"
import analyticsDashboard from "../../../assets/landing/uploaded/analytics-dashboard.png"
import successStory from "../../../assets/landing/uploaded/success-story.png"

const TRUST_LOGOS = ["Google", "Meta", "Amazon", "Microsoft", "Apple", "Netflix", "Atlassian", "Stripe"]

const HOW_IT_WORKS = [
    {
        title: "Configure Your Persona",
        copy: "Pick the role, tone, and difficulty.",
        tag: "Step 01",
        variant: "landing-step-card--persona"
    },
    {
        title: "Conduct the Interview",
        copy: "Practice with a realistic AI avatar.",
        tag: "Step 02",
        variant: "landing-step-card--interview"
    },
    {
        title: "Get Instant Analytics",
        copy: "See confidence, pacing, and filler words instantly.",
        tag: "Step 03",
        variant: "landing-step-card--analytics"
    }
]

const BENTO = [
    {
        title: "Real-time AI Feedback",
        copy: "Fast clarity and delivery feedback.",
        span: "landing-bento__panel--wide"
    },
    {
        title: "Industry-Specific Questions",
        copy: "Questions tuned to your target role.",
        span: ""
    },
    {
        title: "Secure & Private",
        copy: "Private practice, always encrypted.",
        span: ""
    },
    {
        title: "Track Progress Over Time",
        copy: "Measure progress across every session.",
        span: "landing-bento__panel--tall"
    },
    {
        title: "Built for Reflection",
        copy: "Use it for reflection and speaking prep.",
        span: ""
    }
]

const TESTIMONIALS = [
    {
        name: "Maya R.",
        role: "Product Designer",
        quote: "The pacing feedback changed how I answer questions.",
        stars: 5
    },
    {
        name: "Jordan K.",
        role: "Frontend Engineer",
        quote: "It feels polished, real, and actually useful.",
        stars: 5
    },
    {
        name: "Priya S.",
        role: "Public Speaking Coach",
        quote: "I use it before every talk and client pitch.",
        stars: 5
    }
]

function IconStars() {
    return (
        <span className="landing-star-row" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, index) => (
                <svg key={index} viewBox="0 0 24 24">
                    <path d="M12 2l2.9 5.9 6.6.9-4.8 4.7 1.1 6.5L12 16.8 6.2 20l1.1-6.5L2.5 8.8l6.6-.9L12 2z" />
                </svg>
            ))}
        </span>
    )
}

export default function Landing() {
    const { user } = useAuth()
    const navigate = useNavigate()

    return (
        <main className="landing-page">
            <div className="landing-background" aria-hidden="true">
                <span className="landing-background__orb landing-background__orb--purple" />
                <span className="landing-background__orb landing-background__orb--cyan" />
                <span className="landing-background__grid" />
            </div>

            <header className="landing-nav">
                <Link to="/" className="landing-brand">
                    <span className="landing-brand__mark" aria-hidden="true">
                        <img src={websiteLogo} alt="" />
                    </span>
                    <span>
                        <strong>Self-Interview AI</strong>
                        <small>Practice interviews, reflection, and speaking</small>
                    </span>
                </Link>

                <nav className="landing-nav__links" aria-label="Primary">
                    <a href="#how-it-works">How it works</a>
                    <a href="#features">Features</a>
                    <a href="#testimonials">Testimonials</a>
                </nav>

                <div className="landing-nav__actions">
                    <Link className="landing-nav__ghost" to="/login">Login</Link>
                    <Link className="landing-nav__ghost landing-nav__ghost--accent" to="/register">Sign Up</Link>
                    <button className="landing-nav__cta" onClick={() => navigate("/register")}>Start Free Trial</button>
                </div>
            </header>

            <section className="landing-hero">
                <div className="landing-hero__copy">
                    <span className="landing-eyebrow">AI interview rehearsal platform</span>
                    <h1>Interview like the room is already watching.</h1>
                    <p>
                        A premium AI space to rehearse, reflect, and sharpen your delivery in minutes.
                    </p>

                    <div className="landing-hero__actions">
                        <button className="landing-primary-btn" onClick={() => navigate("/register")}>Start Free Trial</button>
                        <Link className="landing-secondary-btn" to="/login">Login</Link>
                    </div>

                    <div className="landing-hero__proof">
                        <div>
                            <strong>10k+</strong>
                            <span>practice sessions run</span>
                        </div>
                        <div>
                            <strong>92%</strong>
                            <span>users feel more confident</span>
                        </div>
                        <div>
                            <strong>3.4x</strong>
                            <span>faster answer improvement</span>
                        </div>
                    </div>
                </div>

                <div className="landing-hero__visual" aria-label="AI avatar analytics preview">
                    <div className="landing-avatar-card">
                        <div className="landing-avatar-card__topbar">
                            <span />
                            <span />
                            <span />
                        </div>
                        <div className="landing-avatar-card__badge">Live interview flow</div>
                        <div className="landing-avatar-card__stage">
                            <div className="landing-avatar-card__avatar">
                                <img src={heroScene} alt="Self-Interview AI practice scene preview" />
                            </div>
                            <div className="landing-avatar-card__analytics">
                                <div className="landing-avatar-card__metric landing-avatar-card__metric--confidence">
                                    <small>Confidence</small>
                                    <strong>86%</strong>
                                </div>
                                <div className="landing-avatar-card__metric landing-avatar-card__metric--pacing">
                                    <small>Pacing</small>
                                    <strong>Optimal</strong>
                                </div>
                                <div className="landing-avatar-card__metric landing-avatar-card__metric--fillers">
                                    <small>Filler words</small>
                                    <strong>2 / min</strong>
                                </div>
                            </div>
                        </div>
                        <div className="landing-avatar-card__waveform">
                            {Array.from({ length: 18 }).map((_, index) => (
                                <span key={index} style={{ height: `${24 + ((index % 6) * 10)}%` }} />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-trust" aria-label="Trusted by teams at">
                <p>Trusted by candidates aiming for teams like these</p>
                <div className="landing-trust__logos">
                    {TRUST_LOGOS.map((company) => (
                        <span key={company}>{company}</span>
                    ))}
                </div>
            </section>

            <section className="landing-how" id="how-it-works">
                <div className="landing-section-heading">
                    <span>How it works</span>
                    <h2>Three short steps. One polished practice loop.</h2>
                </div>

                <div className="landing-steps">
                    {HOW_IT_WORKS.map((step) => (
                        <article key={step.title} className={`landing-step-card ${step.variant}`}>
                            <span className="landing-step-card__tag">{step.tag}</span>
                            <div className="landing-step-card__art" aria-hidden="true">
                                {step.title === "Configure Your Persona" && <img src={personaScenarios} alt="Persona scenarios preview" />}
                                {step.title === "Conduct the Interview" && <img src={interviewSession} alt="Live interview session preview" />}
                                {step.title === "Get Instant Analytics" && <img src={analyticsDashboard} alt="Analytics dashboard preview" />}
                            </div>
                            <h3>{step.title}</h3>
                            <p>{step.copy}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="landing-features" id="features">
                <div className="landing-section-heading">
                    <span>Value props</span>
                    <h2>Designed to feel sharp, private, and premium.</h2>
                </div>

                <div className="landing-bento">
                    {BENTO.map((item) => (
                        <article key={item.title} className={`landing-bento__panel ${item.span}`}>
                            <div className="landing-bento__glow" aria-hidden="true" />
                            <h3>{item.title}</h3>
                            <p>{item.copy}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="landing-testimonials" id="testimonials">
                <div className="landing-section-heading">
                    <span>Testimonials</span>
                    <h2>Used to sharpen interviews, reflection, and speaking.</h2>
                </div>

                <div className="landing-testimonials__track">
                    {TESTIMONIALS.map((item) => (
                        <article key={item.name} className="landing-testimonial-card">
                            <div className="landing-testimonial-card__avatar" aria-hidden="true">
                                <span>{item.name.split(" ").map((part) => part[0]).join("")}</span>
                            </div>
                            <IconStars />
                            <p>“{item.quote}”</p>
                            <div className="landing-testimonial-card__meta">
                                <strong>{item.name}</strong>
                                <span>{item.role}</span>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <section className="landing-final-cta">
                <div className="landing-final-cta__inner">
                    <div className="landing-final-cta__copy">
                        <span className="landing-eyebrow">No credit card required</span>
                        <h2>Start practicing today and walk into your next interview with calm confidence.</h2>
                        <p>Set up your persona, rehearse the conversation, and review the analytics that matter most.</p>
                        <button className="landing-primary-btn" onClick={() => navigate(user ? "/app" : "/register")}>Start Free Trial</button>
                    </div>
                    <div className="landing-final-cta__visual" aria-hidden="true">
                        <img src={successStory} alt="Successful interview outcome preview" />
                    </div>
                </div>
            </section>

            <footer className="landing-footer">
                <div>
                    <strong>Self-Interview AI</strong>
                    <p>Interview prep, self-reflection, and speaking rehearsal in one premium experience.</p>
                </div>
                <div>
                    <span>Product</span>
                    <a href="#how-it-works">How it works</a>
                    <a href="#features">Features</a>
                    <a href="#testimonials">Testimonials</a>
                </div>
                <div>
                    <span>Company</span>
                    <a href="/login">Login</a>
                    <a href="/register">Register</a>
                    <a href="/app">App</a>
                </div>
                <div>
                    <span>Social</span>
                    <a href="https://www.linkedin.com" target="_blank" rel="noreferrer">LinkedIn</a>
                    <a href="https://x.com" target="_blank" rel="noreferrer">X</a>
                    <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
                </div>
            </footer>
        </main>
    )
}