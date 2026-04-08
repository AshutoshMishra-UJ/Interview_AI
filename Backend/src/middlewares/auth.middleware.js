const jwt = require("jsonwebtoken")
const mongoose = require("mongoose")
const tokenBlacklistModel = require("../models/blacklist.model")



async function authUser(req, res, next) {

    const token = req.cookies.token

    if (!token) {
        return res.status(401).json({
            message: "Token not provided."
        })
    }

    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
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
            message: "Database unavailable. Please try again shortly."
        })
    }

    if (isTokenBlacklisted) {
        return res.status(401).json({
            message: "token is invalid"
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        req.user = decoded

        next()

    } catch (err) {

        return res.status(401).json({
            message: "Invalid token."
        })
    }

}


module.exports = { authUser }