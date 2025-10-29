import express from "express"
import bodyParser  from "body-parser"
import cors from "cors"
import { fileURLToPath } from 'url';

import promptRouter from './routes/promptRoute.js'
import authRouter from "./routes/authRoute.js";
import translateRouter from "./routes/translateRoute.js"
import questRouter from "./routes/questRoute.js";
import chatbotRouter from "./routes/chatbotRoute.js";
import drawRouter from "./routes/drawRoute.js";

import path from "path"
import mongoose from "mongoose"
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';

import auth from './middleware/auth.js';

dotenv.config()

const app = express()
const port = 4000

app.use(cors({
  origin: ["https://tucanspeak.netlify.app", "http://localhost:5173"],,
  methods: ['GET', 'POST'],
  credentials: true
}));

app.options("*", cors());

const dev = process.env.NODE_ENV !== 'production';

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URL)
  .then(()=>console.log("Database Connected"));
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.use('/draw', express.static(path.join(__dirname, '../frontend/public/Draw')));

app.get('/draw', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/Draw', 'draw.html'));
});


app.use(express.json())

app.use(bodyParser.json({limit: '500mb'}));
app.use(bodyParser.urlencoded({ limit: '500mb', extended: true}));

app.use(cookieParser());

app.use('/api', auth, (req, res, next) => {
  next();
});

//endpoints
app.use('/auth', authRouter);
app.use("/api/prompt", promptRouter);
app.use("/api/translate", translateRouter);
app.use('/api/quest', questRouter);
app.use('/api/chatbot', chatbotRouter);
app.use('/api/draw', drawRouter);


app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

app.listen(port, ()=> {
  console.log(`Server Started on http://localhost:${port}`);
  connectDB();
});
