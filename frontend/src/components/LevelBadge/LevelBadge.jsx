import React, {useState, useEffect, useContext } from 'react'
import { AppContext } from '../../context/AppContext';
import axios from 'axios';

const LevelBadge = () => {
  const [userData, setUserData] = useState({
    level: 1,
    xp: 0,
    requiredXP: 100
  });

  const {url} = useContext(AppContext);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${url}api/quest/user-stats`);
        if (response.data.success) {
          setUserData({
            level: response.data.level,
            xp: response.data.xp,
            requiredXP: response.data.requiredXP
          });
        }
      } catch (e) {
        // console.error('Error fetching user stats:', e)
      }
    };

    fetchUserData();
  }, [])

  
  const progress = (userData.xp / userData.requiredXP) * 100;

  return (
    <div className='fixed top-[5%] left-1/2 transform -translate-x-1/2 flex items-center bg-white rounded-lg p-2 shadow-lg'>
      <div className='relative w-12 h-12 flex items-center justify-center'>
        {/* Background circle */}
        <div className='absolute w-full h-full rounded-full border-4 border-gray-700'></div>
  
        {/* Progress circle using conic-gradient */}
        <div
          className='absolute w-full h-full rounded-full'
          style={{
            background: `conic-gradient(green ${progress * 3.6}deg, transparent 0deg)`,
          }}
        ></div>
  
        {/* Level text */}
        <span className='absolute text-xl font-bold text-gray-800'>
          {userData.level}
        </span>
      </div>
      
      {/* Level progress information */}
      <div className='ml-2'>
        <div className='text-xs text-black'>Level Progress</div>
        <div className='text-sm text-black'>
          {userData.xp} / {userData.requiredXP} XP
        </div>
      </div>
    </div>
  );
  
};

export default LevelBadge;