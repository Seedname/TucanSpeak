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
import crypto from 'crypto';
import { promisify } from 'util'

let usr = 'tilly'; 
let passwd = 'F6QxVpp6vXlVgdc3';
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

const pbkdf2Async = promisify(crypto.pbkdf2);
const iterations = 100000;

async function deriveKey(password, salt) {
  try {
    const derivedKey = await pbkdf2Async(password, salt, iterations, 128, 'sha512');
    return derivedKey.toString('hex'); // or return the derived key as needed
  } catch (err) {
    throw err;
  }
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(128).toString('base64');
  const hash = await deriveKey(password, salt);

  return {
      salt: salt,
      hash: hash
  };
}

async function isPasswordCorrect(savedHash, savedSalt, passwordAttempt) {
  const hashed = await deriveKey(passwordAttempt, savedSalt);
  return savedHash == hashed;
}

async function validUser(content) {
  if (!content) return false;
  if ('username' in content && 'password' in content) {
    const username = content['username'];
    const password = content['password'];

    try {
      const user = await users.findOne({
        "username" : username,
      });
      if (user) {
        const hashed = user['password'];
        const passwordCorrect = await isPasswordCorrect(hashed['hash'], hashed['salt'], password);
        if (passwordCorrect) {
          return user;
        }
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
    const hashed = await hashPassword(password);

    var currentTime = new Date().toLocaleDateString('en-US', {
      timeZone: 'America/New_York', 
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit'
    });

    await users.insertOne({
      'username': username,
      'password': hashed,
      'email': email,
      'level': 0,
      'xp': 0,
      'tucanFlightWins': 0,
      'tucanDrawWins': 0,
      'gameTime': currentTime,
      'collectedReward': false
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
  if (valid) {
    let currentTime = new Date().toLocaleDateString('en-US', {
      timeZone: 'America/New_York', 
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit'
    });
    let update = {}
    if (valid['gameTime'] != currentTime) {
      update['tucanFlightWins'] = 0;
      update['tucanDrawWins'] = 0;
      update['collectedReward'] = false;
      update['gameTime'] = currentTime;
    }
    if (Object.keys(update).length > 0) {
      await users.findOneAndUpdate({_id: valid["_id"]}, {$set:update});
    }
  }
  return res.sendFile(__dirname + '/public/index.html');
});

app.post('/', async (req, res) => {
  if (req.cookies && 'username' in req.cookies && 'password' in req.cookies) {
      const username = req.cookies['username'];
      const password = req.cookies['password'];
      try {
        const user = await validUser({username: username, password: password});
        if (user) {
          return res.status(200).json({
            'level': user['level'],
            'xp': user['xp'],
            'drawWins': user['tucanDrawWins'],
            'flightWins': user['tucanFlightWins'],
            'collectedReward': user['collectedReward']
          });
        }
      } catch (error) {
        console.error(error);
        return res.status(400).send(error);
      }
  }
  return res.status(400).send("something went wrong");
});

app.post('/sign-out', async (req, res) => {
  if (req.cookies && 'username' in req.cookies && 'password' in req.cookies) {
      res.clearCookie('username');
      res.clearCookie('password');
      return res.status(200).json({url: '/login'});
  }
  return res.status(400).send("Something went wrong");
});

app.post('/get-cookie', async (req, res) => {
  if (req.cookies && 'username' in req.cookies && 'password' in req.cookies) {
    const username = req.cookies['username'];
    const password = req.cookies['password'];
    return res.status(200).json({username: username, password: password});
  }
  return res.status(400).send("Something went wrong");
});

app.use(express.static('public', {
  extensions: ['html', 'htm']
}));

const system = "You are named Tilly the Toucan, and you are currently flying in a jungle. Your goal is to help Spanish-speakers who come to you learn English."
const additionalContext = "";

// const system = fs.readFileSync('./system_message.txt', 'utf-8');
// const additionalContext = "Keep your answer as consice and accurate as possible while still answering the question completely if possible. If you recieve a prompt that doesn't make sense after this sentence, just respond with 'Could you please repeat that?'. DO NOT try to answer questions you are not 100% sure of.";

function updateLevel(user, type) {
  let level = user['level'];
  let xp = user['xp'];
  let collectedReward = user['collectedReward'];
  
  let id = user["_id"]
  let flightWins = user['tucanFlightWins'];
  let drawWins = user['tucanDrawWins'];

  if (type == 'flight') {
    flightWins ++;
  } else if (type == 'draw') {
    drawWins ++;
  }

  xp ++;
  
  if (xp >= 20) {
    level ++;
    xp %= 20;
  }

  if (!collectedReward && flightWins >= 5 && drawWins >= 5) {
    collectedReward = true;
    xp += 5;
    if (xp >= 20) {
      level ++;
      xp %= 20;
    }
  }


  users.findOneAndUpdate({_id: id}, {$set: {'level': level, 'xp': xp, 'collectedReward': collectedReward, 'tucanFlightWins': flightWins, 'tucanDrawWins': drawWins}})
}

wss.on('connection', (ws) => {
    ws.send(JSON.stringify({type: 'connected'}));

    ws.on('message', async (data) => {
        data = JSON.parse(data);
        const username = data.username;
        const password = data.password;
        const valid = await validUser({username: username, password: password});

        if (!valid) {
          return;
        }

        switch(data.type) {
          case "start":
            // let levelUnit = ""
            // if (valid["level"] === 1) {
            //   levelUnit = fs.readFileSync('./level_one.txt', 'utf-8');
            // }

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
              const currentTime = new Date().toLocaleTimeString();
              fs.appendFile('data.txt', `${currentTime}\nQ: ${searchTerm}\nA: ${finalMessage}`, err => {console.error(err)});
              ws.send(JSON.stringify({ type: 'end' }));
            });
            break;
          case "drawWin":
            updateLevel(valid, 'draw');
            break;
          case "flightWin":
            updateLevel(valid, 'flight');
            break;
        }
    });
});
