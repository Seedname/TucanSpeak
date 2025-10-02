import express from "express";
import { streamChatbotResponse } from "../controllers/chatbotController.js";

const chatbotRouter = express.Router();

// chatbotRouter.post('/message', handleUserInput);
chatbotRouter.get('/stream', streamChatbotResponse)
export default chatbotRouter;