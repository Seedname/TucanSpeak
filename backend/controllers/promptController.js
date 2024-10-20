import path from 'path';
import { fileURLToPath } from 'url';
import OpenAIAPI from 'openai';
import { TranslationServiceClient } from '@google-cloud/translate';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { SpeechClient } from '@google-cloud/speech';
import Prompt from '../models/promptModel.js';
import dotenv from 'dotenv';
import { error } from 'console';

dotenv.config()

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openai = new OpenAIAPI({
  apiKey: process.env.OPENAI_API_KEY,
});

const translate = new TranslationServiceClient();
const tts = new TextToSpeechClient();
const speechClient = new SpeechClient();


export const recognizeSpeech = async (rq, rs) => {
  if (!rq.body.audioData) {
    return rs.status(400).json({success: false, error: 'Audio data is required' });
  }

  try {
    let audioBuffer
    try {
      audioBuffer = Buffer.from(rq.body.audioData, 'base64');
    } catch (e) {
      return rs.status(400).json({
        success: false,
        error: 'Invalid audio data format. Must be base64 encoded'
      });
    }

    const request = {
      audio: {
        content: audioBuffer.toString('base64')
      },
      config: {
        encoding: 'WEBM_OPUS',
        sampleRateHertz: 48000,
        languageCode: 'en-US',
        model: 'default',
        useEnhanced: true,
        enableAutomaticPunctuation: true,
        enableWordTimeOffsets: false,
      }
    };

    const [response] = await speechClient.recognize(request);

    if (!response.results || response.results.length === 0) {
      return rs.status(422).json({
        success: false,
        error: 'No speech could be recognized in the audio'
      });
    }

    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');

    let similarity = 0;
    if (rq.body.originalPrompt) {
      const originalPrompt = rq.body.originalPrompt.toLowerCase().replace(/[^\w\s]/g, '');
      const transcriptText = transcription.toLowerCase().replace(/[^\w\s]/g, '');
      similarity = calculateSimilarity(originalPrompt, transcriptText);
    }

    rs.json({
      success: true,
      transcript: transcription,
      similarity: similarity,
      confidence: response.results[0].alternatives[0].confidence,
    });

  } catch (e) {
    console.error('Speech recognition error:', error);

    if (e.code === 4) {
      rs.status(400).json({
        success: false,
        error: 'Invalid audio format or corrupted audio data'
      });
    }
    rs.status(500).json({
      success: false,
      error: 'Error processing speech recognition'
    });
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
}

const editDistance = (s1, s2) => {
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j< s2.length; j++) {
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
}

const translatePrompts = async (prompts, targetLanguage) => {
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

    const translatedPrompts = translations.translations.map
    (translation => translation.translatedText);

    return translatedPrompts;
  } catch (e) {
    console.log('Error translating prompts: ', e);
    return prompts;
  }
}

const generatePrompts = async (rq, rs) => {
  const response = await openai.completions.create({
      model: 'gpt-3.5-turbo-instruct',
      prompt: 'Generate a list of ten basic english sentences the progressively get more difficult. Do not number the prompts. They should not contain numbers. Each sentence must be at maximum equal to 68 characters in length and no less then 50 characters.',
      max_tokens: 250,
      temperature: 0.7,
  });

  const generatedText = response.choices[0].text.trim();
  const generatedPrompts = generatedText
    .split('\n')
    .map(prompt => prompt.replace(/^\d+\.\s*/, '').trim())
    .filter(prompt => prompt);

  const targetLanguage = 'es';
  const finalPrompts = await translatePrompts(generatedPrompts, targetLanguage)

  const newPrompt = new Prompt({
    generatedPrompts: generatedPrompts,
    translatedPrompts: finalPrompts,
    targetLanguage: targetLanguage,
    nextUpdateTime: Date.now() + (60 * 60 * 1000)
  });

  await newPrompt.save();
  return newPrompt;
};

export const fetchPrompts = async (rq, rs) => {
  try {
    const currentTime = Date.now();
    const existingPrompts = await Prompt.findOne({}).sort({nextUpdateTime: -1});
    
    if (existingPrompts && existingPrompts.nextUpdateTime > currentTime) {
      return rs.json({ 
        success: true, 
        prompts: existingPrompts.generatedPrompts, translatedPrompts: existingPrompts.translatedPrompts,
        nextUpdateTime: existingPrompts.nextUpdateTime
      });
    }

    await Prompt.deleteOne({})
    const newPrompts = await generatePrompts();
    return rs.json({
      success: true,
      prompts: newPrompts.generatedPrompts,
      translatedPrompts: newPrompts.translatedPrompts,
      nextUpdateTime: newPrompts.nextUpdateTime
    });
  } catch (e) {
    console.log(e);
    return rs.status(500).json({ success: false, message: 'Error generating or translating prompts' });
  }

};

export const timeRemaining = async (rq, rs) => {
  try {
    const existingPrompts = await Prompt.findOne({}).sort({ nextUpdateTime: -1 });
    if (!existingPrompts) {
      return rs.json({timeRemaining: 0});
    }
    const timeRemaining = Math.max(0, existingPrompts.nextUpdateTime - Date.now());
    return rs.json({timeRemaining});
  } catch(e) {
    console.log(e);
    return rs.status(500).json({
      success: false,
      message: 'Error fetching time remaining'
    });
  }
};


export const synthesizeSpeech = async (rq, rs) => {
  const { text } = rq.body;

  if(!text) {
    return rs.status(400).json({error: 'Text Missing'});
  }

  const request = {
    input: {text},
    voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
    audioConfig: {audioEncoding: 'MP3'}
  };

  try {
    const [response] = await tts.synthesizeSpeech(request);
    const audioContent = response.audioContent.toString('base64');
    rs.json({audioContent});
  } catch (e) {
    console.log(e);
    rs.json({success: false, message: "Error synthesizing speech"})
  };
}

