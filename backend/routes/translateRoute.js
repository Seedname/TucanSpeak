import express from "express";
import { handleUserInput,  changeLanguage } from "../controllers/translateController.js";
import auth from "../middleware/auth.js";

const translateRouter = express.Router();

translateRouter.post('/message', auth, handleUserInput)
translateRouter.post('/change-language', auth, changeLanguage);

export default translateRouter;