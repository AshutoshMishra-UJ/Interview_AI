const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: [true, "username already taken"],
        required: true,
    },
    email: {
        type: String,
        unique: [true, "Account already exists with this email address"],
        required: true,
    },
    password: {
        type: String,
        required: true
    },
    // ── Gamification & Streak ──────────────────────────────
    practiceStreak:   { type: Number, default: 0 },
    longestStreak:    { type: Number, default: 0 },
    lastPracticeDate: { type: Date,   default: null },
    totalXP:          { type: Number, default: 0 },
    totalSessions:    { type: Number, default: 0 }
}, { timestamps: true })

const userModel = mongoose.model("users", userSchema)
module.exports = userModel