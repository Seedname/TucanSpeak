import express from 'express';
import https from 'https';
import http from 'http';
import { WebSocketServer } from 'ws';
import OpenAI from 'openai';
import bodyParser from 'body-parser';
import { config } from 'dotenv';
import fs from 'fs';
import { MongoClient, ServerApiVersion } from 'mongodb';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cookieParser from 'cookie-parser';

let usr = "redacted";
let passwd = "redacted";
const uri = `mongodb+srv://${usr}:${passwd}@cluster0.fqcesgs.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db;
let users;

async function connectToMongoDB() {
    try {
        await client.connect();
        console.log('Connected successfully to the database');

        db = client.db('TucanSpeak');
        users = db.collection('users');
    } catch (error) {
        console.error('Failed to connect to the database:', error);
    }
}

connectToMongoDB();

config();

const useHTTPS = false;

const app = express();

let server;

if (useHTTPS) {
  const privateKey = fs.readFileSync('/etc/letsencrypt/live/tucanspeak.ddns.net/privkey.pem', 'utf8');
  const certificate = fs.readFileSync('/etc/letsencrypt/live/tucanspeak.ddns.net/fullchain.pem', 'utf8');

  const credentials = {
    key: privateKey,
    cert: certificate
  };
  server = https.createServer(credentials, app);
  app.listen(80);
  server.listen(443);
} else {
  server = http.createServer(app);
  server.listen(80);
}

const wss = new WebSocketServer({ server });
const API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey: API_KEY });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function validUser(content) {
  if (!content) return false;
  if ('username' in content && 'password' in content) {
    const username = content['username'];
    const password = content['password'];

    try {
      const user = await users.findOne({
        "username" : username,
        "password": password
      });
      if (user) {
        return true;
      }
    } catch (error) {
      console.error(error);
      return false;
    }
  }
  return false;
}

app.get('/login', async (req, res) => {
  const valid = await validUser(req.cookies);
  if (valid) {
    return res.redirect('/');
  }
  return res.sendFile(__dirname + '/public/login.html');
});

app.post('/login', async (req, res) => {
  const valid = await validUser(req.body);
  if (valid) {
    res.cookie('username', req.body.username, { maxAge: 86400*1000, httpOnly: true });
    res.cookie('password', req.body.password, { maxAge: 86400*1000, httpOnly: true });
    return res.json({ redirectUrl: '/' });
  }
  if ('username' in req.body && 'password' in req.body) return res.status(400).send('Invalid username or password');
  return res.sendFile(__dirname + '/public/login.html');
});

app.post('/register', async (req, res) => {
  if ('username' in req.body && 'password' in req.body && 'email' in req.body) {
    const username = req.body['username'];
    const email = req.body['email'];

    try {
      const user_username = await users.findOne({"username" : username});
      if (user_username) {
        return res.status(400).send('Username taken');
      }
      const user_email = await users.findOne({"email" : email});
      if (user_email) {
        return res.status(400).send('Account with email already exists');
      }
    } catch (error) {
      console.error(error);
      return res.sendFile(__dirname + '/public/register.html');
    }

    const password = req.body['password'];
    
    await users.insertOne({
      'username': username,
      'password': password,
      'email': email,
      'level': 0,
      'xp': 0
    });

    res.cookie('username', username, { maxAge: 86400*1000, httpOnly: true });
    res.cookie('password', password, { maxAge: 86400*1000, httpOnly: true });
    return res.json({ redirectUrl: '/' });
  }
  return res.sendFile(__dirname + '/public/register.html');
});

app.get('/', async (req, res) => {
  const valid = await validUser(req.cookies);
  if (!valid) {
    return res.redirect('/login');
  }
  return res.sendFile(__dirname + '/public/index.html');
});

app.post('/', async (req, res) => {
  if (req.cookies && 'username' in req.cookies && 'password' in req.cookies) {
      const username = req.cookies['username'];
      const password = req.cookies['password'];
      try {
        const user = await users.findOne({"username" : username, "password": password});
        if (user) {
          return res.status(200).json({
            'level': user['level'],
            'xp': user['xp']
          });
        }
      } catch (error) {
        console.error(error);
        return res.status(400).send(error);
      }
  }
  return res.status(400).send("something went wrong");
});

app.use(express.static('public', {
  extensions: ['html', 'htm']
}));


// const system = "You are named Tilly the Toucan, and you are currently flying in a jungle. Your goal is to help people who come to you learn English or Spanish."
const system = fs.readFileSync('./system_message.txt', 'utf-8');
const additionalContext = "Keep your answer as consice and accurate as possible while still answering the question completely if possible. If you recieve a prompt that doesn't make sense after this sentence, just respond with 'Could you please repeat that?'. DO NOT try to answer questions you are not 100% sure of.";

let host;
let players = [];

// const labels = ["Apple", "Baseball", "Bucket", "Bicycle", "Cactus", "Cow", "Computer", "Door", "Eye", "Fish", "Giraffe", "Light Bulb", "Mountain", "Pencil", "Pig", "Scissors", "Rainbow", "Smiley Face", "Sun", "Tree"];
let labels = ["Baseball", "Bucket", "Bicycle", "Cactus", "Computer", "Door", "Eye", "Giraffe", "Light Bulb", "Mountain", "Scissors", "Rainbow", "Sun", "Tree"];
let bucket = ["Baseball", "Bucket", "Bicycle", "Cactus", "Computer", "Door", "Eye", "Giraffe", "Light Bulb", "Mountain", "Scissors", "Rainbow", "Sun", "Tree"];
// const labels = ["Airplane","Anvil","Backpack","Banana","Baseball Bat","Basket","Basketball","Bed","Book","Bowtie","Brain","Bread","Bucket","Bush","Cactus","Camera","Candle","Carrot","Computer","Donut","Door","Ear","Flower","Fork","Giraffe","Hand","Key","Ladder","Light Bulb","Lightning","Moon","Mountain","Paper Clip","Rainbow","Skyscraper","Smiley Face","Snail","Spoon","Sun","The Eiffel Tower","The Mona Lisa","Tooth","Tree","Umbrella"];
// const bucket = ["Airplane","Anvil","Backpack","Banana","Baseball Bat","Basket","Basketball","Bed","Book","Bowtie","Brain","Bread","Bucket","Bush","Cactus","Camera","Candle","Carrot","Computer","Donut","Door","Ear","Flower","Fork","Giraffe","Hand","Key","Ladder","Light Bulb","Lightning","Moon","Mountain","Paper Clip","Rainbow","Skyscraper","Smiley Face","Snail","Spoon","Sun","The Eiffel Tower","The Mona Lisa","Tooth","Tree","Umbrella"];

function pickLabel() {
  let index = Math.floor(Math.random() * bucket.length);
  let label = bucket.splice(index, 1).join("");
  if (bucket.length == 0) {
    bucket = JSON.parse(JSON.stringify(labels));
  }
  return label;
}
wss.on('connection', (ws) => {
    ws.send(JSON.stringify({type: 'connected'}));

    ws.on('message', (data) => {
        data = JSON.parse(data);
        if (data.type == "start") {
          let searchTerm = data.content;
          const conversation = [
            { role: 'system', content: system },
            { role: 'user', content: searchTerm + additionalContext },
          ];

          ws.send(JSON.stringify({ type: 'start' }));
          let finalMessage = "";
          openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: conversation,
            stream: true
          }) .then(async (completion) => {
            for await (const chunk of completion) {
              if (chunk.choices[0].finish_reason !== 'stop') {
                const content = chunk.choices[0].delta.content;
                finalMessage += content;
                ws.send(JSON.stringify({ type: 'update', content }));
              }
            }
          }) .catch((error) => {
            console.error(error);
          }) .finally(() => {
            const d = new Date();
            const n = d.toLocaleTimeString();
            fs.appendFile('data.txt', `${n}\nQ: ${searchTerm}\nA: ${finalMessage}`, err => {});
            ws.send(JSON.stringify({ type: 'end' }));
          });
        } 

        if (data.type == "hostGame") {
          host = ws;
        }

        if (data.type == "startRound") {
          let word =  pickLabel();
          host.send(JSON.stringify({type: "startRound", data: "Your word is: " + word}));
          for (let i = 0; i < players.length; i++) {
            players[i].send(JSON.stringify({type: "startRound", data: word}));
          }
        }

        if (data.type == "endRound") {
          host.send(JSON.stringify({type: "endRound", data: "Tie Game"}));
          for (let i = 0; i < players.length; i++) {
            players[i].send(JSON.stringify({type: "endRound", data: "tie"}));
          }
        }

        if (data.type == "joinGame") {
          players.push(ws);
        }

        if (data.type == "answer") {
          const index = players.indexOf(ws);
          host.send(JSON.stringify({type: "endRound", data: "Player " + (index+1) + " wins"}));
          for (let i = 0; i < players.length; i++) {
            if (players[i] == ws) {
              players[i].send(JSON.stringify({type: "endRound", data: "you"}));
            } else {
              players[i].send(JSON.stringify({type: "endRound", data: index}));
            }
          }
        }
    });


    ws.on('close', () => {
      if (ws == host) {
        for (let i = 0; i < players.length; i++) {
          players[i].send(JSON.stringify({type: "disconnect"}));
        }
        players = [];
      }

      const index = players.indexOf(ws);
      if (index >= 0) {
        players.splice(index, 1);
      }
   });
});
