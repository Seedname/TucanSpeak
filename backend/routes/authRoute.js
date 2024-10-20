import express from "express";
import { register, login, verifyEmail, logout, checkVerification } from "../controllers/authController.js";

const authRouter = express.Router();

authRouter.post('/register', register)
authRouter.post('/login', login)
authRouter.get('/verify/:token', verifyEmail)
authRouter.post('/check-verification', checkVerification)
authRouter.post('/logout', logout);

export default authRouter;