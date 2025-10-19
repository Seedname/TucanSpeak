import express from 'express';
import { tucanDraw  } from '../controllers/drawController.js';

const drawRouter = express.Router();
drawRouter.post('/tucan-draw', tucanDraw);

export default drawRouter;