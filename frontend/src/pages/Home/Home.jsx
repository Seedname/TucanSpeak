import React, {useEffect} from 'react'
import Navbar from '../../components/Home/Navbar/Navbar.jsx'
import AIDisplay from '../../components/Home/AIDisplay/AIDisplay.jsx'
import DailyQuest from '../../components/Home/DailyQuest/DailyQuest.jsx'
import { useNavigate } from 'react-router-dom'
import { getCookie } from '../../utils/helper'

const Home = () => {

  const navigate = useNavigate();

  useEffect(() => {
      if (!getCookie('token')) {
        navigate('/', {replace: true});
      }
    }, [navigate])

  return (
    <div className='flex flex-col h-screen'>
      <div className='flex flex-1'>
        <Navbar />
        <AIDisplay />
        <DailyQuest />
      </div>
    </div>
  )
}

export default Home