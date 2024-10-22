import User from "../models/userModel.js";

export const handleQuestProgress = async (userId, questType, progress = 1) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    if (user.shouldResetQuests()) {
      user.dailyQuests = [
        {
          type: 'talk',
          description: 'Recite Prompts',
          target: 10,
          progress: 0,
          completed: false,
          lastResetAt: new Date()
        },
        //add more
      ];
    }

    const quest = user.dailyQuests.find(q => q.type === questType);
    if (quest && !quest.completed) {
      quest.progress += progress;

      if (quest.progress >= quest.target && !quest.completed) {
        quest.completed = true;
        await user.addXP(50)
      }
    }

    await user.save();
    return user;
  } catch (e) {
    console.error('Error handling quest progress:', error);
    throw error;
  }
};