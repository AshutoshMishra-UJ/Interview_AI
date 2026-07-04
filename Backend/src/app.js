const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express()

const allowedOrigins = [
    ...(process.env.CLIENT_URL
        ? process.env.CLIENT_URL.split(",").map((origin) => origin.trim()).filter(Boolean)
        : []),
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175"
]

const isAllowedLocalDevOrigin = (origin) => /^http:\/\/localhost:5\d{3}$/.test(origin)
const corsOptions = {
    origin: (origin, callback) => {
        // Allow non-browser requests (no origin header) and configured web origins.
        if (!origin || allowedOrigins.includes(origin) || isAllowedLocalDevOrigin(origin)) {
            return callback(null, true)
        }
        return callback(new Error("Not allowed by CORS"))
    },
    credentials: true
}

app.use(express.json())
app.use(cookieParser())
const corsMiddleware = cors(corsOptions)

app.use((req, res, next) => {
    corsMiddleware(req, res, (err) => {
        if (err) {
            return next(err)
        }

        if (req.method === "OPTIONS") {
            return res.sendStatus(204)
        }

        return next()
    })
})

/* require all the routes here */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")
const experimentalRouter = require("./routes/experimental.routes")


/* using all the routes here */
app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)
app.use("/api/experimental", experimentalRouter)



module.exports = app