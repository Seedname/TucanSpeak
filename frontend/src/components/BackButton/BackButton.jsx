import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftIcon } from '@heroicons/react/24/solid';

const BackButton = () => {

  const navigate = useNavigate();

  return (
    <div onClick={()=>navigate('/home')} className='absolute p-2 w-16 h-[40px] bg-green-500 flex items-center justify-center rounded-lg top-3 left-3 cursor-pointer z-[60]'>
      <ArrowLeftIcon className='w-7 h-7' />
    </div>
  )
}

export default BackButton