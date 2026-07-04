const jwt = require("jsonwebtoken")
const mongoose = require("mongoose")
const tokenBlacklistModel = require("../models/blacklist.model")


function verifyJwtFromCookie(req, res) {
    const token = req.cookies.token

    if (!token) {
        res.status(401).json({
            message: "Token not provided."
        })
        return null
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        return { token, decoded }
    } catch (err) {
        res.status(401).json({
            message: "Invalid token."
        })
        return null
    }
}



async function authUser(req, res, next) {

    const verified = verifyJwtFromCookie(req, res)
    if (!verified) return
    const { token, decoded } = verified

    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            code: "DB_UNAVAILABLE",
            message: "Database unavailable. Please try again shortly."
        })
    }

    let isTokenBlacklisted
    try {
        isTokenBlacklisted = await tokenBlacklistModel.findOne({
            token
        })
    } catch (err) {
        return res.status(503).json({
            code: "DB_UNAVAILABLE",
            message: "Database unavailable. Please try again shortly."
        })
    }

    if (isTokenBlacklisted) {
        return res.status(401).json({
            message: "token is invalid"
        })
    }

    req.user = decoded
    next()

}

async function authUserDbOptional(req, res, next) {
    const verified = verifyJwtFromCookie(req, res)
    if (!verified) return
    const { token, decoded } = verified

    if (mongoose.connection.readyState !== 1) {
        req.user = decoded
        req.authDegraded = true
        return next()
    }

    try {
        const isTokenBlacklisted = await tokenBlacklistModel.findOne({ token })

        if (isTokenBlacklisted) {
            return res.status(401).json({
                message: "token is invalid"
            })
        }
    } catch (err) {
        req.user = decoded
        req.authDegraded = true
        return next()
    }

    req.user = decoded
    req.authDegraded = false
    next()
}


module.exports = { authUser, authUserDbOptional }