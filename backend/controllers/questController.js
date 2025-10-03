import User from "../models/userModel.js";

const QUEST_REWARDS = {
  talk: 50,
  draw: 50,
  flight: 50,
  translate: 50
};

const ACTIVITY_XP = {
  talk: 5,
  draw: 5,
  flight: 5,
  translate: 5
};

const updateQuestProgress = async (user, activityType) => {
  const quest = user.dailyQuests.find(q =>q.type === activityType);

  if (!quest) return {updated: false};

  quest.progress += 1;

  let questCompleted = false;
  let questXP = 0;

  if (quest.progress >= quest.target && !quest.completed) {
    quest.completed = true;
    questCompleted = true;
    questXP = QUEST_REWARDS[activityType];

    await user.addXP(questXP);
  }

  await user.save();

  return {
    updated: true,
    questCompleted, 
    questXP
  };
};

export const handleCorrectAnswer = async (req, res) => {
  try {
    const { activityType } = req.body;
    const user = req.user;

    const baseXP = ACTIVITY_XP[activityType] || 5;
    await user.addXP(baseXP);

    const questResult = await updateQuestProgress(user, activityType);

    res.json({
      success: true,
      xpGained: baseXP,
      questCompleted: questResult.questCompleted,
      questXP: questResult.questXP
    });
  } catch (e) {
    console.error('Error handling correct answer:', e);
    res.status(500).json({success: false, message: 'Server error'});
  }
}

export const dailyQuest = async (req, res) => {
  try {
    const user = req.user;

    if (user.shouldResetQuests()) {

      user.dailyQuests = [
        {
          type: 'talk',
          description: 'Complete 10 speaking exercises',
          target: 10,
          progress: 0,
          completed: false,
          lastResetAt: new Date()
        },
        {
          type: 'draw',
          description: 'Draw 5 pictures',
          target: 5,
          progress: 0,
          completed: false,
          lastResetAt: new Date()
        },
        {
          type: 'flight',
          description: 'Complete 8 flight exercises',
          target: 8,
          progress: 0,
          completed: false,
          lastResetAt: new Date()
        },
        {
          type: 'translate',
          description: 'Translate 12 sentences',
          target: 12,
          progress: 0,
          completed: false,
          lastResetAt: new Date()
        }
      ];
      await user.save();
    }

    res.json({
      success: true,
      quests: user.dailyQuests
    });
  } catch (e) {
    console.error('Error handling daily quests', e);
    res.status(500).json({success: false, message: 'Server error'});
  }
};

export const userStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    // console.log(user);
    if (!user) {
      return res.status(404).json({success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      level: user.level,
      xp: user.xp,
      requiredXP: user.getRequiredXP()
    });
  } catch (e) {
    console.error('Error fetching user stats:', e);
    res.status(500).json({success: false, message: 'Server error'});
  }
};

// export const handleQuestProgress = async (userId, questType, progress = 1) => {
//   try {
//     const user = await User.findById(userId);
//     if (!user) throw new Error('User not found');

//     if (user.shouldResetQuests()) {
//       user.dailyQuests = [
//         {
//           type: 'talk',
//           description: 'Recite Prompts',
//           target: 10,
//           progress: 0,
//           completed: false,
//           lastResetAt: new Date()
//         },
//         //add more
//       ];
//     }

//     const quest = user.dailyQuests.find(q => q.type === questType);
//     if (quest && !quest.completed) {
//       quest.progress += progress;

//       if (quest.progress >= quest.target && !quest.completed) {
//         quest.completed = true;
//         await user.addXP(50)
//       }
//     }

//     await user.save();
//     return user;
//   } catch (e) {
//     console.error('Error handling quest progress:', error);
//     throw error;
//   }
// };