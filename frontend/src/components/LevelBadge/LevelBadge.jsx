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
        const token = localStorage.getItem('token');
        const response = await axios.get(`${url}auth/user-stats`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data.success) {
          setUserData({
            level: response.data.level,
            xp: response.data.xp,
            requiredXP: response.data.requiredXP
          });
        }
      } catch (e) {
        console.error('Error fetching user stats:', e)
      }
    };

    fetchUserData();
  }, [])

  const progress = (userData.xp / userData.requiredXP) * 100;


  return (
    <div className='absolute top-[75%] right-[4%] flex items-center bg-gray-900 rounded-lg p-2 shadow-lg'>
      <div className='relative w-12 h-12 flex items-center justify-center'>
        <div className='absolute w-full h-full rounded-full border-4 border-gray-700 '/>
        <div 
        className='absolute w-full h-full rounded-full border-4 border-blue-500' 
        style={{
          clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%)`,
          transform: `rotate(${progress * 3.6}deg)`
        }}
        />
          <span className='text-xl font-bold text-white'>{userData.level}</span>
        </div>
        <div className='ml-2'>
          <div className='text-xs text-gray-400'>Level Progress</div>
          <div className='text-sm text-white'>
            {userData.xp} / {userData.requiredXP} XP
          </div>
      </div>
    </div>
  );
};

export default LevelBadge;