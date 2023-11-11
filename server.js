import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import OpenAI from 'openai';
import bodyParser from 'body-parser';
import { config } from 'dotenv';

config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

const system = "You are named Tilly the Toucan, and you are currently flying in a jungle. Your goal is to help people who come to you learn English or Spanish."

server.listen(80);

const old = false;

// WebSocket handling
wss.on('connection', (ws) => {
    ws.on('message', (data) => {
        data = JSON.parse(data);
        if (data.type == "start") {
          let searchTerm = data.content;
          const conversation = [
            { role: 'system', content: system },
            { role: 'user', content: searchTerm },
          ];
          
          ws.send(JSON.stringify({ type: 'start' }));
          
          if (old) {
              openai.completions.create({
                model: 'text-davinci-003',
                prompt: searchTerm,
                stream: true 
              }) .then(async (completion) => {
                  for await (const chunk of completion) {
                    if (chunk.choices[0].finish_reason !== 'stop') {
                      const content = chunk.choices[0].text;
                      ws.send(JSON.stringify({ type: 'update', content }));
                    }
                  }
                }) .catch((error) => {
                  console.error(error);
                }) .finally(() => {
                  ws.send(JSON.stringify({ type: 'end' }));
                });
          } else {
              openai.chat.completions.create({
                model: 'gpt-3.5-turbo-1106',
                messages: conversation,
                stream: true
              }) .then(async (completion) => {
                for await (const chunk of completion) {
                  if (chunk.choices[0].finish_reason !== 'stop') {
                    const content = chunk.choices[0].delta.content;
                    ws.send(JSON.stringify({ type: 'update', content }));
                  }
                }
              }) .catch((error) => {
                console.error(error);
              }) .finally(() => {
                ws.send(JSON.stringify({ type: 'end' }));
              });
          }
        }
    });

    ws.on('close', () => {

    });
});