import express from 'express';
import auth from '../middleware/auth.js';

const questRouter = express.Router();

const QUEST_REWARDS = {
  talk: 50,
  draw: 50,
  flight: 50,
  translate: 50
};

const ACTIVITY_XP = {
  talk: 5,
  draw: 3,
  flight: 4,
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

questRouter.post('/handle-correct-answer', auth, async (rq, rs) => {
  try {
    const { activityType } = rq.body;
    const user = rq.user;

    const baseXP = ACTIVITY_XP[activityType] || 5;
    await user.addXP(baseXP);

    const questResult = await updateQuestProgress(user, activityType);

    rs.json({
      success: true,
      xpGained: baseXP,
      questCompleted: questResult.questCompleted,
      questXP: questResult.questXP
    });
  } catch (e) {
    console.error('Error handling correct answer:', e);
    rs.status(500).json({success: false, message: 'Server error'});
  }
});

questRouter.get('/daily-quest', auth, async (rq, rs) => {
  try {
    const user = rq.user;

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

    rs.json({
      success: true,
      quests: user.dailyQuests
    });
  } catch (e) {
    console.error('Erro handling daily quests', e);
    rs.status(500).json({success: false, message: 'Server error'});
  }
});

export default questRouter;
