import React, {useEffect} from 'react'
import Navbar from '../../components/Home/Navbar/Navbar.jsx'
import AIDisplay from '../../components/Home/AIDisplay/AIDisplay.jsx'
import DailyQuest from '../../components/Home/DailyQuest/DailyQuest.jsx'
import { useNavigate } from 'react-router-dom'
import { getCookie, getCookieExp } from '../../utils/helper'

const Home = () => {

  const navigate = useNavigate();
  const token = getCookie('token')


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