import express from 'express';
import { handleCorrectAnswer, dailyQuest, userStats } from "../controllers/questController.js";

const questRouter = express.Router();

questRouter.post('/handle-correct-answer', handleCorrectAnswer);
questRouter.get('/daily-quest', dailyQuest);
questRouter.get('/user-stats', userStats);

export default questRouter;
