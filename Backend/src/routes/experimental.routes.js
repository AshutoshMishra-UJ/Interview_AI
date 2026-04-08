const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const experimentalController = require("../controllers/experimental.controller")

const experimentalRouter = express.Router()

experimentalRouter.post(
    "/rag-plan",
    authMiddleware.authUser,
    experimentalController.generateRagPrepController
)

module.exports = experimentalRouter
