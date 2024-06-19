import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import OpenAIAPI from 'openai';
import { TranslationServiceClient } from '@google-cloud/translate';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

const openai = new OpenAIAPI({
    apiKey: process.env.OPENAI_API_KEY,
});

const translate = new TranslationServiceClient();
const ttsClient = new TextToSpeechClient();

let nextUpdateTime;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json())

//Function to generate prompts using OpenAI API
async function generatePrompts() {
    try {
        const response = await openai.completions.create({
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
        const [translations] = await translate.translateText({
            parent: `projects/${process.env.GOOGLE_CLOUD_CONSOLE_PROJECT_ID}`,
            contents: prompts,
            mimeType: 'text/plain',
            sourceLanguageCode: 'en',
            targetLanguageCode: targetLanguage,
        });

        if (!Array.isArray(translations.translations)) {
            throw new Error('Translations are not in expected format.');
        }

        const translatedPrompts = translations.translations.map(translation => translation.translatedText);

        return translatedPrompts;
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
        nextUpdateTime = Date.now() + (5 * 60 * 1000) //5 Minutes
    } catch (e) {
        console.error('Error updating prompts:', e);
    }
};


//Endpoint to serve prompt.json
app.get('/prompts', (req, res) => {
    try {
        const promptsData = fs.readFileSync(path.join(__dirname, 'prompts.json'));
        const { prompts, translatedPrompts } = JSON.parse(promptsData);

        res.json({ prompts, translatedPrompts });
    } catch (e) {
        console.error('Error fetching prompts: ', e);
        res.status(500).json({ error: 'Eroor fetching prompts'});
    }
});

//Endpoint to recieve time remaining until prompts refresh
app.get('/time-remaining', (req, res) => {
    const timeRemaining = nextUpdateTime - Date.now();
    res.json({ timeRemaining });
});

app.post('/synthesize-speech', async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Text parameter required' });
    }

    const request = {
        input: { text },
        voice: { languageCode: 'en-US', ssmlGender: 'CASUAL'},
        audioConfig: {audioEncoding: 'MP3'},
    };

    try {
        const [response] = await ttsClient.synthesizeSpeech(request);
        const audioContent = response.audioContent.toString('base64');
        res.json({ audioContent });
    } catch (e) {
        console.error('error synthesizing speech: ', e);
        res.status(500).json({ error: 'Error synthesizing speech'});
    }
});

async function initializePromptsSchedule() {
    await updatePrompts();
    setInterval(updatePrompts, 5 * 60 * 1000);//5 minutes
};

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    initializePromptsSchedule();
});