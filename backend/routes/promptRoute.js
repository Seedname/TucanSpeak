import express from "express";
import { fetchPrompts, recognizeSpeech, synthesizeSpeech, timeRemaining } from "../controllers/promptController.js"

const promptRouter = express.Router();

promptRouter.get("/get", fetchPrompts)
promptRouter.get("/time-remaining", timeRemaining)
promptRouter.post("/synthesize-speech", synthesizeSpeech)
promptRouter.post("/recognize-speech", recognizeSpeech)

export default promptRouter;