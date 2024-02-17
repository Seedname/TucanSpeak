import express from 'express';
import https from 'https';
import http from 'http';
import { WebSocketServer } from 'ws';
import OpenAI from 'openai';
import bodyParser from 'body-parser';
import { config } from 'dotenv';
import fs from 'fs';

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

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// const system = "You are named Tilly the Toucan, and you are currently flying in a jungle. Your goal is to help people who come to you learn English or Spanish."
const system = fs.readFileSync('./system_message.txt', 'utf-8');
const additionalContext = "Keep your answer as consice and accurate as possible while still answering the question completely if possible. If you recieve a prompt that doesn't make sense after this sentence, just respond with 'Could you please repeat that?'. DO NOT try to answer questions you are not 100% sure of.";

let host;
let players = [];

// const labels = ["Apple", "Baseball", "Bucket", "Bicycle", "Cactus", "Cow", "Computer", "Door", "Eye", "Fish", "Giraffe", "Light Bulb", "Mountain", "Pencil", "Pig", "Scissors", "Rainbow", "Smiley Face", "Sun", "Tree"];
const labels = ["Baseball", "Bucket", "Bicycle", "Cactus", "Computer", "Door", "Eye", "Fish", "Giraffe", "Light Bulb", "Mountain", "Scissors", "Rainbow", "Smiley Face", "Sun", "Tree"];


function pickLabel() {
  return labels[Math.floor(Math.random() * labels.length)];
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
      }

      const index = players.indexOf(ws);
      if (index >= 0) {
        players.splice(index, 1);
      }
   });
});
