import express from "express";
import { fetchPrompts, recognizeSpeech, synthesizeSpeech, timeRemaining } from "../controllers/promptController.js"
import auth from "../middleware/auth.js";

const promptRouter = express.Router();

promptRouter.get("/get", auth, fetchPrompts)
promptRouter.get("/time-remaining", auth, timeRemaining)
promptRouter.post("/synthesize-speech", auth, synthesizeSpeech)
promptRouter.post("/recognize-speech", auth,  recognizeSpeech)

export default promptRouter;