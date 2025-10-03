import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { TranslationServiceClient } from '@google-cloud/translate';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import Prompt from '../models/promptModel.js';
import auth from '../middleware/auth.js';
import express from 'express';
import async from 'async';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const translate = new TranslationServiceClient();
const tts = new TextToSpeechClient();

const promptRouter = express.Router();

export const recognizeSpeech = async (req, res) => {
  if (!req.body.audioData) {
    return res.status(400).json({ success: false, error: 'Audio data is required' });
  }

  try {
    const audioBuffer = Buffer.from(req.body.audioData, 'base64');

    const tempFilePath = path.join(__dirname, 'temp_audio.webm');
    fs.writeFileSync(tempFilePath, audioBuffer);

    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: 'whisper-1',
      response_format: 'text',
    });

    fs.unlinkSync(tempFilePath);
    const transcription = String(response);
    let similarity = 0;
    if (req.body.originalPrompt) {
      const originalPrompt = String(req.body.originalPrompt).toLowerCase().replace(/[^\w\s]/g, '');
      const transcriptText = String(transcription).toLowerCase().replace(/[^\w\s]/g, '');
      similarity = calculateSimilarity(originalPrompt, transcriptText);
    }

    res.json({
      success: true,
      transcript: transcription,
      similarity: similarity,
    });
  } catch (e) {
    console.error('Speech recognition error:', e);
    res.status(500).json({ success: false, error: 'Error processing speech recognition' });
  }
};

const calculateSimilarity = (str1, str2) => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  const longerLength = longer.length;

  if (longerLength === 0) {
    return 1.0;
  }

  return ((longerLength - editDistance(longer, shorter)) / longerLength) * 100;
};

const editDistance = (s1, s2) => {
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j < s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) {
      costs[s2.length] = lastValue;
    }
  }
  return costs[s2.length];
};

const translatePrompts = async (prompts, targetLanguage) => {
  try {
    const projectId = process.env.GOOGLE_CLOUD_CONSOLE_PROJECT_ID;

    const request = {
      parent: `projects/${projectId}/locations/global`,
      contents: prompts,
      mimeType: 'text/plain',
      sourceLanguageCode: 'en',
      targetLanguageCode: targetLanguage,
    };

    const [response] = await translate.translateText(request);
    
    console.log('Full response:', JSON.stringify(response, null, 2));

    // Check if translations exist
    if (!response || !response.translations || !Array.isArray(response.translations)) {
      console.error('Invalid response format:', response);
      throw new Error('Translations are not in expected format.');
    }

    const translatedPrompts = response.translations.map(
      (translation) => translation.translatedText
    );
    
    return translatedPrompts;
  } catch (e) {
    console.error('Error translating prompts:', e);
    console.error('Error details:', e.message);
    return prompts; // Fallback to original English prompts
  }
};

const generatePrompts = async (req, res) => {
  const response = await openai.completions.create({
    model: 'gpt-3.5-turbo-instruct',
    prompt: 'Generate a list of ten basic english sentences the progressively get more difficult. Do not number the prompts. They should not contain numbers. Each sentence must be at maximum equal to 68 characters in length and no less then 50 characters.',
    max_tokens: 250,
    temperature: 0.7,
  });

  const userId = req.user._id;
  const generatedText = response.choices[0].text.trim();
  const generatedPrompts = generatedText
    .split('\n')
    .map((prompt) => prompt.replace(/^\d+\.\s*/, '').trim())
    .filter((prompt) => prompt);

  const targetLanguage = 'es';
  const finalPrompts = await translatePrompts(generatedPrompts, targetLanguage);

  const newPrompt = new Prompt({
    userId: userId,
    generatedPrompts: generatedPrompts,
    translatedPrompts: finalPrompts,
    targetLanguage: targetLanguage,
    nextUpdateTime: Date.now() + 60 * 60 * 1000,
    createdAt: Date.now(),
  });

  await newPrompt.save();
  return newPrompt;
};

export const fetchPrompts = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const userId = req.user._id;
    const currentTime = Date.now();

    const existingPrompts = await Prompt.findOne({
      userId: userId,
    }).sort({ nextUpdateTime: -1 });

    if (existingPrompts && existingPrompts.nextUpdateTime > currentTime) {
      return res.json({
        success: true,
        prompts: existingPrompts.generatedPrompts,
        translatedPrompts: existingPrompts.translatedPrompts,
        nextUpdateTime: existingPrompts.nextUpdateTime,
      });
    }

    await Prompt.deleteMany({ userId: userId });

    const newPrompts = await generatePrompts(req);
    return res.json({
      success: true,
      prompts: newPrompts.generatedPrompts,
      translatedPrompts: newPrompts.translatedPrompts,
      nextUpdateTime: newPrompts.nextUpdateTime,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: 'Error generating or translating prompts' });
  }
};

export const timeRemaining = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const existingPrompts = await Prompt.findOne({
      userId: req.user._id,
    }).sort({ nextUpdateTime: -1 });

    if (!existingPrompts) {
      return res.json({ timeRemaining: 0 });
    }

    const timeRemaining = Math.max(0, existingPrompts.nextUpdateTime - Date.now());
    return res.json({ timeRemaining });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      message: 'Error fetching time remaining',
    });
  }
};

export const synthesizeSpeech = async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text Missing' });
  }

  const request = {
    input: { text },
    voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
    audioConfig: { audioEncoding: 'MP3' },
  };

  try {
    const [response] = await tts.synthesizeSpeech(request);
    const audioContent = response.audioContent.toString('base64');
    res.json({ audioContent });
  } catch (e) {
    console.error(e);
    res.status(500).json({ 
      success: false, 
      message: 'Error synthesizing speech' 
    });
  }
};


export default promptRouter;
