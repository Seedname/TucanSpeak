import OpenAI from "openai";
import fs from 'fs';
import dotenv from "dotenv";

dotenv.config()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// const system = fs.readFileSync('/system_message.txt', 'utf-8');
const additionalContext = "Be creative with your responses.";

export const generateTTS = async (text) => {
  try {
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova",
      input: text,
      response_format: "opus"
    });
    const bufferStr = Buffer.from(await mp3.arrayBuffer()).toString("base64");
    return "data:audio/ogg;base64," + bufferStr;
  } catch (e) {
    console.error('Error generating TTS:', e);
    throw new Error('Failed to generate speech');
  }
};

export const handleUserInput = async (userInput) => {
  const systemPrompt = "You are an English teacher for Spanish-speaking students. Your task is to assess if the student's translation from Spanish to English is correct. If the translation is correct, include the word “correct” in your response, and briefly explain why their answer is accurate. Additionally, mention how the translated sentence is useful in real-world contexts. Your response should be primarily in English, with a few minor Spanish words sprinkled in for flavor. If the translation is incorrect, do not use the word “correct” in your response. Instead, provide a subtle hint pointing out their mistake without directly correcting it. Your feedback should help guide the student toward the right answer. The response should still be mostly in English, with a few minor Spanish words here and there to maintain a conversational tone. Your response should not exceed 200 characters."

  try {
    const assistant = await openai.assistants.create({
      name: "Tilly",
      instructions: systemPrompt,
      tools: [{type: "code_interpreter"}],
      model: "gpt-4o",
    });

    const thread = await openai.threads.create();

    await openai.threads.messages.create(thread.id, {
      role: "user",
      content: userInput,
    });

    let assistantResponse = '';
    const run = openai.threads.runs.stream(thread.id, {
      assistant_id: assistant.id,
    }).on('textDelta', (textDelta) => {
      assistantResponse += textDelta.value;
    });

    return new Promise((resolve) => {
      run.on('end', () => resolve(assistantResponse));
    });
  } catch (e) {
    console.error('Error with OpenAI:', error);
    throw new Error('Failed to get a response from the assistant.');
  }
};