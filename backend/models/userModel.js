import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  xp: { type: Number, default: 0},
  level: {type: Number, default: 1},
  tucanTalkItems: {
    index: {type: Number, default: 0}
  },
  dailyQuests: [{
    type: {type: String, enum: ['flight', 'draw', 'talk', 'translate']},
    description: String,
    completed: {type: Boolean, default: false},
    progress: {type: Number, default: 0},
    target: {type: Number, required: true},
    lastResetAt: {type: Date, default: Date.now()}
  }]
});

userSchema.methods.getRequiredXP = function() {
  return Math.floor(100*Math.pow(this.level, 1.5));
};

userSchema.methods.addXP = async function(amount) {
  this.xp += amount;

  while (this.xp >= this.getRequiredXP()) {
    this.level += 1;
  }

  await this.save();
  return {
    currentXP: this.xp,
    level: this.level,
    requiredXP: this.getRequiredXP()
  };
};

userSchema.methods.shouldResetQuests = function() {
  if (!this.dailyQuests.length) return true;

  const lastReset = this.dailyQuests[0].lastResetAt;
  const hoursSinceReset = (Date.now() - lastReset) / (1000 * 60 * 60);
  return hoursSinceReset >= 10;
};

export default mongoose.model('User', userSchema);