import express from 'express';
import https from 'https';
import http from 'http';
import { WebSocketServer } from 'ws';
import OpenAI from 'openai';
import OpenAIAPI from 'openai';
import bodyParser from 'body-parser';
import { config } from 'dotenv';
import fs from 'fs';
import { MongoClient, ServerApiVersion } from 'mongodb';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import { promisify } from 'util'
import session from 'express-session';
import { default as RedisStore } from "connect-redis";
import { createClient } from 'redis';``
// import { TranslationServiceClient } from '@google-cloud/translate';
import path from 'path';


config();

const redisClient = createClient({
  socket: {
    host: "localhost",
    port: 6379
  }
});

redisClient.connect().catch(console.error);

const dev = process.env.NODE_ENV !== 'production'

const uri = `mongodb+srv://${process.env.MONGODB_PASS}@cluster0.fqcesgs.mongodb.net/?retryWrites=true&w=majority`;
// const uri = "mongodb://localhost:27017/";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db;
let users;
// const sessionHash = [];

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

const app = express();

let server;

if (dev) {
  server = http.createServer(app);
  server.listen(80);
} else {
  const privateKey = fs.readFileSync('/etc/cert/privkey.pem', 'utf8');
  const certificate = fs.readFileSync('/etc/cert/fullchain.pem', 'utf8');
  const passphrase = process.env.CERT_PASS;

  const credentials = {
    key: privateKey,
    cert: certificate,
    passphrase: passphrase,
  };

  server = https.createServer(credentials, app);
  app.enable('trust proxy');

  app.listen(80);
  server.listen(443);

  app.use ((req, res, next) => {
    if (req.secure)  {
      next();
    } else {
      res.redirect('https://tucanspeak.org' + req.url);
    }
  });
}

const wss = new WebSocketServer({
  server: server,
  clientTracking: true,
  verifyClient: (info, done) => {
    console.log("Parsing session info from request...");
    sessionParser(info.req, {}, () => {
      // console.log(info.req);
      done(info.req.session);
    })
  }
}, () => {});

const API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey: API_KEY });
const openaiInstruct = new OpenAIAPI({ apiKey: API_KEY });
const sessionStore = new RedisStore({ 
  client: redisClient,
  ttl: 24 * 60 * 60
});
const secret = crypto.randomBytes(128).toString('base64');
const sessionParser = session({
  store: sessionStore,
  secret: secret,
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: !dev, 
    httpOnly: false, 
    signed: false,
    maxAge: 24 * 60 * 60 * 1000
  }
});

app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(sessionParser);
app.use(express.static('public', {
  extensions: ['html', 'htm']
}));


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pbkdf2Async = promisify(crypto.pbkdf2);
const iterations = 100000;

async function deriveKey(password, salt) {
  try {
    const derivedKey = await pbkdf2Async(password, salt, iterations, 128, 'sha512');
    return derivedKey.toString('hex');
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


async function findOne(query) {
  return await users.find(query).limit(1).next(function(err, doc){
      return doc;
  })
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
      return false;
    }
  }
  return false;
}

function sign(val, secret){
  return val + '.' + crypto
    .createHmac('sha256', secret)
    .update(val)
    .digest('base64')
    .replace(/=+$/, '');
}

let nextUpdateTime;
// const translate = new TranslationServiceClient();

async function generatePrompts() {
  try {
      const response = await openaiInstruct.completions.create({
          model: 'gpt-3.5-turbo-instruct',
          prompt: 'Generate a list of ten basic english sentences the progressively get more difficult. Do not number them the prompts. They should not contain numbers. Each sentence must be at maximum equal to 68 characters in length and no less then 50 characters.',
          max_tokens: 250,
          temperature: 0.7,
      });

      const generatedText = response.choices[0].text.trim();
      const generatedPrompts = generatedText
          .split('\n')
          .map(prompt => prompt.replace(/^\d+\.\s*/, '').trim()) 
          .filter(prompt => prompt);

      console.log("Generated prompts successfully")
      return generatedPrompts
  } catch (e) {
      console.error('Error generating prompts: ', e);
      return [];
  }
};

async function translatePrompts(prompts, targetLanguage) {
  try {
    // const [translations] = await translate.translateText({
    //     parent: `projects/${process.env.GOOGLE_CLOUD_CONSOLE_PROJECT_ID}`,
    //     contents: prompts,
    //     mimeType: 'text/plain',
    //     sourceLanguageCode: 'en',
    //     targetLanguageCode: targetLanguage,
    // });

    // if (!Array.isArray(translations.translations)) {
    //     throw new Error('Translations are not in expected format.');
    // }

    // const translatedPrompts = translations.translations.map(translation => translation.translatedText);

    // return translatedPrompts;
  } catch (e) {
    console.error('Error translating prompts: ', e);
    return prompts;
  }
}

async function updatePrompts() {
  try {
    const prompts = await generatePrompts();
    const translatedPrompts = await translatePrompts(prompts, 'es');

    fs.writeFileSync(path.join(__dirname, 'prompts.json'), JSON.stringify({ prompts, translatedPrompts }));
    console.log("Prompts updated successfully")
    nextUpdateTime = Date.now() + (5 * 60 * 1000)
  } catch (e) {
      console.error('Error updating prompts:', e);
  }
};

async function generateTTS(text) {
  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: "nova",
    input: text,
    response_format: "opus"
  });
  const bufferStr = Buffer.from(await mp3.arrayBuffer()).toString("base64");
  return bufferStr;
}

async function initializePromptsSchedule() {
  await updatePrompts();
  setInterval(updatePrompts, 5 * 60 * 1000);
};

initializePromptsSchedule();


app.post('/prompts', (req, res) => {
  try {
    const promptsData = fs.readFileSync(path.join(__dirname, 'prompts.json'));
    const { prompts, translatedPrompts } = JSON.parse(promptsData);

    res.json({ prompts, translatedPrompts });
  } catch (e) {
    console.error('Error fetching prompts: ', e);
    res.status(500).json({ error: 'Error fetching prompts'});
  }
});


app.get('/time-remaining', (req, res) => {
  const timeRemaining = nextUpdateTime - Date.now();
  res.json({ timeRemaining });
});

app.post('/synthesize-speech', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text parameter required' });
  }

  try {
    let audioResponse = "data:audio/ogg;base64," + await generateTTS(text);
    res.json({ audioResponse });
  } catch (e) {
    console.error('error synthesizing speech: ', e);
    res.status(500).json({ error: 'Error synthesizing speech'});
  }
});


app.get('/login', async (req, res) => {
  const valid = await validUser({'username': req.session.user, 'password': req.session.password});
  if (valid) {
    return res.redirect('/');
  }
  return res.sendFile(__dirname + '/public/login.html');
});

app.post('/login', async (req, res) => {
  if (req.session.user) {
    return res.json({ redirectUrl: '/' });
  }
  const valid = await validUser(req.body);
  if (valid) {
    req.session.user = req.body.username;
    req.session.password = req.body.password;
    // let sessionIdHash = sign(req.sessionID, secret);
    // sessionHash[encodeURIComponent(`s:${sessionIdHash}`)] = req.sessionID;
    res.cookie('language', "English", { maxAge: 86400*1000*400 });
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

    req.session.user = username;
    req.session.password = password;

    return res.json({ redirectUrl: '/' });
  }
  return res.sendFile(__dirname + '/public/register.html');
});

app.get('/', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }

  // const valid = await validUser({'username': req.session.user, 'password': req.session.password});
  // if (!valid) {
  //   return res.redirect('/login');
  // }

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
  if (req.session.user) {
      const username = req.session.user;
      const password = req.session.password;
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
    req.session.destroy();
    return res.status(200).json({url: '/login'});
});

app.post('/change-language', async (req, res) => {
  if ('language' in req.cookies) {
    if (req.cookies['language'] == "Spanish") {
      res.cookie('language', "English", { maxAge: 86400*1000*400 });
    } else if (req.cookies['language'] == "English") {
      res.cookie('language', "Spanish", { maxAge: 86400*1000*400 });
    }
  } else {
    res.cookie('language', "English", { maxAge: 86400*1000*400 });
  }
  return res.status(200).json({});
});

app.get('/flight', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }
  // const valid = await validUser({'username': req.session.user, 'password': req.session.password});
  // if (!valid) {
  //   return res.redirect('/login');
  // }
  return res.sendFile(__dirname + '/public/flight.html');
});

app.get('/draw', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }
  // const valid = await validUser({'username': req.session.user, 'password': req.session.password});
  // if (!valid) {
  //   return res.redirect('/login');
  // }
  return res.sendFile(__dirname + '/public/draw.html');
});

app.get('/speak', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }
  // const valid = await validUser({'username': req.session.user, 'password': req.session.password});
  // if (!valid) {
  //   return res.redirect('/login');
  // }
  return res.sendFile(__dirname + '/public/prompts.html');
});

async function handleUserInput(userInput) {
  const systemPrompt = "You are an English teacher for Spanish-speaking students. Your task is to assess if the student's translation from Spanish to English is correct. If the translation is correct, include the word “correct” in your response, and briefly explain why their answer is accurate. Additionally, mention how the translated sentence is useful in real-world contexts. Your response should be primarily in English, with a few minor Spanish words sprinkled in for flavor. If the translation is incorrect, do not use the word “correct” in your response. Instead, provide a subtle hint pointing out their mistake without directly correcting it. Your feedback should help guide the student toward the right answer. The response should still be mostly in English, with a few minor Spanish words here and there to maintain a conversational tone. Your response should not exceed 200 characters.";
  try {
      const assistant = await openai.beta.assistants.create({
          name: "Tilly",
          instructions: systemPrompt,
          tools: [{ type: "code_interpreter" }],
          model: "gpt-4o"
      });

      const thread = await openai.beta.threads.create();

      await openai.beta.threads.messages.create(thread.id, {
          role: "user",
          content: userInput
      });

      let assistantResponse = '';
      const run = openai.beta.threads.runs.stream(thread.id, {
          assistant_id: assistant.id
      }).on('textDelta', textDelta => {
          assistantResponse += textDelta.value;
      }).on('end', () => {
          return assistantResponse;
      });

      return new Promise((resolve) => {
          run.on('end', () => resolve(assistantResponse));
      });

  } catch (error) {
      console.error('Error with OpenAI:', error);
      throw new Error('Failed to get a response from the assistant.');
  }
}

app.post('/message', async (req, res) => {
  if (!req.session || !req.session.user) {
    res.status(500).json({ error: 'An error occurred while processing your request.' });
    return;  
  }
  // const valid = await validUser({'username': req.session.user, 'password': req.session.password});
  // if (!valid) {
  //   res.status(500).json({ error: 'An error occurred while processing your request.' });
  //   return;
  // }

  const userInput = req.body.message;
  try {
      const response = await handleUserInput(userInput);
      res.json({ response });
  } catch (error) {
      res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

app.get('/write', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }
  // const valid = await validUser({'username': req.session.user, 'password': req.session.password});
  // if (!valid) {
  //   return res.redirect('/login');
  // }
  return res.sendFile(__dirname + '/public/scramble.html');
});

const system = fs.readFileSync('./system_message.txt', 'utf-8');
const additionalContext = "Be creative with your responses.";

function updateLevel(user, points, type) {
  if (points == 0) {
    return;
  }

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

  xp += points;

  if (xp >= 20) {
    level ++;
    xp %= 20;
  }

  if (!collectedReward && flightWins >= 5 && drawWins >= 5) {
    collectedReward = true;
    xp += 15;
    if (xp >= 20) {
      level ++;
      xp %= 20;
    }
  }

  users.findOneAndUpdate({_id: id}, {$set: {'level': level, 'xp': xp, 'collectedReward': collectedReward, 'tucanFlightWins': flightWins, 'tucanDrawWins': drawWins}})
}

function getCookies(request) {
  var cookies = {};
  request.headers && request.headers.cookie.split(';').forEach(function(cookie) {
    var parts = cookie.match(/(.*?)=(.*)$/)
    cookies[ parts[1].trim() ] = (parts[2] || '').trim();
  });
  return cookies;
}


wss.on('connection', async (ws, req) => {
  if (!req.session || !req.session.user) {
    ws.close();
    return;
  }

  const username = req.session.user;
  const password = req.session.password;

  const valid = await validUser({'username': username, 'password': password});

  if (!valid) {
    ws.close();
    return;
  }

  ws.send(JSON.stringify({type: 'connected'}));

  ws.on('message', async (data) => {
    data = JSON.parse(data);
    switch(data.type) {
      case "start":
        let playerLevel = ` The user is currently at level ${valid['level']+1}. Adjust your responses accordingly.`
        let languagePreference = ` The user's language preference is ${data.language}. Respond in this language.`
        let searchTerm = data.content;
        const conversation = [
          { role: 'system', content: system },
          { role: 'user', content: searchTerm + additionalContext + playerLevel + languagePreference},
        ];
        
        ws.send(JSON.stringify({ type: 'start' }));
        let finalMessage = "";
        openai.chat.completions.create({
          model: 'gpt-4o',
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
        }) .finally(async () => {
          const currentTime = new Date().toLocaleTimeString();
          fs.appendFile('data.txt', `${currentTime}\nQ: ${searchTerm}\nA: ${finalMessage}`, err => {});
          ws.send(JSON.stringify({ type: 'end', audio: "data:audio/ogg;base64," + await generateTTS(finalMessage) }));
        });
        break;
      case "drawWin":
        updateLevel(valid, 1, 'draw');
        break;
      case "flightWin":
        updateLevel(valid, data.points, 'flight');
        break;
    }
  });
});
