import OpenAI from "openai";
import dotenv from "dotenv";
import async from "async";

dotenv.config()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const system = "You are named Tilly the Toucan, and you are currently flying in a jungle. Your goal is to help adventurers learn either English or Spanish. Do not use emojis in your response.";
const additionalContext = "Be creative with your responses.";

export const streamChatbotResponse = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let playerLevel = `The user is currently at level ${req.user.level}. Adjust your responses accordingly. `;
  let languagePreference = "";
  let searchTerm = req?.query?.message ?? "The user did not input anything.";

  const conversation = [
    { role: 'system', content: system + additionalContext + playerLevel + languagePreference },
    { role: 'user', content: searchTerm },
  ];

  let finalMessage = "";
  let partialMessage = "";
  let sentenceCount = 0;
  const sentenceBufferLength = 3;

  const ttsQueue = async.queue((task, callback) => {
    (async () => {
      try {
        const ttsResponse = await openai.audio.speech.create({
          model: 'tts-1',
          voice: 'nova',
          input: task.message,
          response_format: "opus"
        });

        const stream = ttsResponse.body;

        stream.on('data', (chunk) => {
          const base64Chunk = chunk.toString('base64');
          res.write(`data: ${JSON.stringify({ type: 'audio', chunk: base64Chunk })}\n\n`);
        });

        stream.on('end', () => {
          res.write('data: { "type": "partialEnd" }\n\n');
          callback();
        });

        stream.on('error', (err) => {
          console.error('Error in TTS stream:', err);
          res.write('data: { "type": "error", "message": "Failed to generate audio" }\n\n');
          callback(err);
        });

      } catch (error) {
        console.error('Error generating audio:', error);
        res.write('data: { "type": "error", "message": "Failed to generate audio" }\n\n');
        callback(error);
      }
    })();
  }, 1); 

  const processPartialMessage = async (message) => {
    if (message.trim()) {
      return new Promise((resolve, reject) => {
        ttsQueue.push({ message }, (err) => {
          if (err) {
            console.error('Error processing TTS queue:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
  };

  openai.chat.completions.create({
    model: 'gpt-4o',
    messages: conversation,
    stream: true,
  }).then(async (completion) => {
    for await (const chunk of completion) {
      if (chunk.choices[0].finish_reason !== 'stop') {
        const content = chunk.choices[0].delta.content;
        finalMessage += content;
        res.write(`data: ${JSON.stringify({ type: 'text', content })}\n\n`);

        partialMessage += content;
        if (/[.!?]/.test(content)) {
          sentenceCount += 1;
          if (sentenceCount >= sentenceBufferLength) {
            await processPartialMessage(partialMessage);
            partialMessage = "";
            sentenceCount = 0;
          }
        }
      }
    }
  }).catch((error) => {
    console.error(error);
  }).finally(async () => {
    if (partialMessage) {
      await processPartialMessage(partialMessage);
    }
    ttsQueue.drain(() => {
      res.write('data: { "type": "end" }\n\n');
      res.end();
    });
  });
};
