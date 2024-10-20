import express from "express"
import bodyParser  from "body-parser"
import cors from "cors"
import { fileURLToPath } from 'url';
import promptRouter from './routes/promptRoute.js'
import authRouter from "./routes/authRoute.js";
import path from "path"
import mongoose from "mongoose"
import dotenv from "dotenv";

dotenv.config()

const app = express()
const port = 4000

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true
}));

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URL)
  .then(()=>console.log("Database Connected"));
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json())

app.use(bodyParser.json({limit: '10mb'}));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true}));

//endpoints
app.use("/prompt", promptRouter)
app.use('/auth', authRouter)

app.get("/", (rq, rs)=>{
  rs.send("Server is Working")
})

app.listen(port, ()=> {
  console.log(`Server Started on http://localhost:${port}`)
  connectDB()
});
