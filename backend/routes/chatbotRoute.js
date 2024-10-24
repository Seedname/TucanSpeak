import express from "express";
import auth from "../middleware/auth.js";
import { handleUserInput, streamChatbotResponse } from "../controllers/chatbotController.js";

const chatbotRouter = express.Router();

// chatbotRouter.post('/message', handleUserInput);
chatbotRouter.get('/stream', streamChatbotResponse)
export default chatbotRouter;