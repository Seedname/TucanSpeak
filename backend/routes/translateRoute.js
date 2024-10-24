import express from "express";
import { handleUserInput } from "../controllers/translateController.js";
import auth from "../middleware/auth.js";

const translateRouter = express.Router();

translateRouter.post('/message', auth, handleUserInput)

export default translateRouter;