import React, {useState, useEffect, useContext} from 'react';
import { useNavigate } from "react-router-dom";
import {Clock} from 'lucide-react';
import axios from "axios"
import { AppContext } from '../../../context/AppContext';

const QUEST_REWARDS = {
  talk: 50,
  draw: 50,
  flight: 50,
  translate: 50
};

const DailyQuest = () => {
  const {url} = useContext(AppContext)

  const [quests, setQuests] = useState([]);
  const [resetTime, setResetTime] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchQuests();

    const interval = setInterval(fetchQuests, 60000);
    return () => clearInterval(interval);
  }, [])

  const fetchQuests = async () => {
    try {
      const response = await axios.get(`${url}api/quest/daily-quest`);
      if (response.data.success) {
        setQuests(response.data.quests);

        if (response.data.quests[0]) {
          const resetAt = new Date(response.data.quests[0].lastResetAt);
          resetAt.setHours(resetAt.getHours() + 24);
          setResetTime(resetAt);
        }
      }
    } catch (e) {
      console.error('Error fetching quests', e);
    }
  };

  const getProgressBarWidth = (progress, target) => {
    return `${(progress/target) * 100}%`;
  };

  const getTimeUnitReset = () => {
    if (!resetTime) return '';
    
    const now = new Date();
    const diff = resetTime - now;

    if (diff <= 0) return 'Resetting soon...';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000*60));
    return `${hours}h:${minutes}m`;
  };

  const questTypeToDisplay = {
    'flight': 'TuCan Flight',
    'draw': 'TuCan Draw',
    'talk': 'TuCan Talk',
    'translate': 'TuCan Translate'
  };

  const questDescriptions = {
    'flight': 'Numbers',
    'draw': 'Objects',
    'talk': 'Speaking',
    'translate': 'Sentence'
  };

  return (
    <div className='bg-white w-1/5 p-3'>
      <div className='border-2 rounded-md p-2'>
        <h1 className='text-lg font-semibold mb-3'>Daily Quest</h1>

        <ul className='space-y-4'>
          {quests.map((quest) => (
            <li key={quest.type} className='space-y-1'>
              <div className='flex justify-between items-center'>
                <span className='text-sm font-medium'>
                  {questDescriptions[quest.type]} ({quest.progress}/{quest.target} {questTypeToDisplay[quest.type]})
                </span>
                {quest.completed && (
                  <span className='text-[11px] text-green-600 font-semibold'>
                    +{QUEST_REWARDS[quest.type]} XP
                  </span>
                )}
              </div>

              <div className='bg-gray-200 h-5 rounded-full overflow-hidden'>
                <div
                className={`h-full transition-all duration-300 rounded-full flex items-center justify-end px-2 ${quest.completed ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{
                  width: quest.progress >= 10 ? '100%' : getProgressBarWidth(quest.progress, quest.target)
                }}
                >
                  <span className='text-xs text-white font-medium'>
                    {quest.progress > 1 ? `${quest.progress}/${quest.target}` : ''}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className='mt-6 pt-4 border-t border-gray-200'>
          <div className='flex items-center justify-between text-sm text-gray-600'>
            <div className='flex items-center gap-1'>
              <Clock size={16} />
              <span>Resets in:</span>
            </div>
            <span className='font-medium'>{getTimeUnitReset()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyQuest