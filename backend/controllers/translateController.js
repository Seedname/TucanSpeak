import bodyParser from 'body-parser';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY_TRANSLATE,
});

const systemPrompt = "You are an English teacher for Spanish-speaking students. Your task is to assess if the student's translation from Spanish to English is correct. If the translation is correct, include the word 'correct' in your response, and briefly explain why their answer is accurate. Additionally, mention how the translated sentence is useful in real-world contexts. Your response should be primarily in English, with a few minor Spanish words sprinkled in for flavor. If the translation is incorrect, do not use the word 'correct' in your response. Instead, provide a subtle hint pointing out their mistake without directly correcting it. Your feedback should help guide the student toward the right answer. The response should still be mostly in English, with a few minor Spanish words here and there to maintain a conversational tone. Your response should not exceed 200 characters.";

export const handleUserInput = async (req, res) => {

  try {
    // Create a message with the user input
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: req["body"]["message"] }
      ],
      model: "gpt-4o",
      stream: false
    });
    return res.status(200).json({response: completion.choices[0].message.content});
  } catch (error) {
    console.error('Error with OpenAI:', error);
    throw new Error('Failed to get a response from the assistant.');
  }
}

export const changeLanguage = async (req, res) => {
  let languagePreference = req.user.languagePreference === "en" ? "sp" : "en";
  req.user.languagePreference = languagePreference;
  await req.user.save();
  res.cookie('languagePreference', languagePreference, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', 
    maxAge: 36000000, 
  });
  return res.status(200).json({language: languagePreference});
};