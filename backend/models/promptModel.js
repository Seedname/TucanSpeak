import mongoose from "mongoose";

const promptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  generatedPrompts: [{
    type: String,
    required: true
  }],
  translatedPrompts: [{
    type: String,
    required: true
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  targetLanguage: {
    type: String,
    required: true
  },
  nextUpdateTime: {
    type: Number,
    required: true
  }
});

promptSchema.index({ userId: 1, nextUpdateTime: -1 });

const Prompt = mongoose.model('Prompt', promptSchema, 'tucan_talk_prompts');

export default Prompt;