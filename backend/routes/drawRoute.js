import express from "express";
import { handleUserInput } from "../controllers/drawController.js";

const drawRouter = express.Router();

drawRouter.post('/message', handleUserInput)

export default drawRouter;