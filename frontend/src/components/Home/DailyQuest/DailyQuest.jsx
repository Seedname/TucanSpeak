import React from 'react'

const DailyQuest = () => {
  return (
    <div className='bg-white w-1/5 p-3'>
      <div className='border-2 rounded-md p-2'>
        <h1 className='text-lg font-semibold mb-3'>Daily Quest</h1>

        <ul>
          <li className='mb-4'>{"Numbers (0/5 TuCan Flight)"}
            <div className='bg-gray-200 flex items-center justify-between px-2 py-1 w-full h-5 rounded-full'>
              <span className='text-xs'>0/5</span>
            </div>
          </li>

          <li className='mb-4'>{"Objects (0/5 TuCan Draw)"}
            <div className='bg-gray-200 flex items-center justify-between px-2 py-1 w-full h-5 rounded-full'>
              <span className='text-xs'>0/5</span>
            </div>
          </li>

          <li className='mb-4'>{"Speaking (0/5 TuCan Talk)"}
            <div className='bg-gray-200 flex items-center justify-between px-2 py-1 w-full h-5 rounded-full'>
              <span className='text-xs'>0/5</span>
            </div>
          </li>

          <li className='mb-4'>{"Sentence (0/5 TuCan Translate)"}
            <div className='bg-gray-200 flex items-center justify-between px-2 py-1 w-full h-5 rounded-full'>
              <span className='text-xs'>0/5</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default DailyQuest