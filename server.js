const express = require('express');
const bodyParser = require('body-parser');
const { OpenAI } = require('openai');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const systemPrompt = "You are an English teacher for Spanish-speaking students. Your task is to assess if the student's translation from Spanish to English is correct. If the translation is correct, include the word “correct” in your response, and briefly explain why their answer is accurate. Additionally, mention how the translated sentence is useful in real-world contexts. Your response should be primarily in English, with a few minor Spanish words sprinkled in for flavor. If the translation is incorrect, do not use the word “correct” in your response. Instead, provide a subtle hint pointing out their mistake without directly correcting it. Your feedback should help guide the student toward the right answer. The response should still be mostly in English, with a few minor Spanish words here and there to maintain a conversational tone. Your response should not exceed 200 characters.";

app.use(bodyParser.json());
app.use(express.static('public'));

async function handleUserInput(userInput) {
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
    const userInput = req.body.message;

    try {
        const response = await handleUserInput(userInput);
        res.json({ response });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

