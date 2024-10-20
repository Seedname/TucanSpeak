import mongoose from "mongoose";

const promptSchema = new mongoose.Schema({
  generatedPrompts: [String],
  translatedPrompts: [String],
  createdAt: { type: Date, default: Date.now },
  targetLanguage: String,
  nextUpdateTime: Number
});

const Prompt = mongoose.model('Prompt', promptSchema, 'tucan_talk_prompts');

export default Prompt;