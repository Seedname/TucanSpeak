import React, { useState } from "react";
import ToucanAnimation from "../../Toucan/Toucan";
import { PaperAirplaneIcon, MicrophoneIcon } from "@heroicons/react/24/outline";

const AIDisplay = () => {


  return (
    <div className="bg-white w-3/5 flex flex-col items-center">
      <ToucanAnimation/>
      <div className="w-[80%] mt-[70%] flex items-center">
        <div className="w-10 h-10 flex items-center justify-center">
          <MicrophoneIcon
            onClick={() => pass}
            className="w-8 h-8 cursor-pointer"
          />
        </div>
        <input
          className="bg-slate-50 rounded-full px-6 py-3 ml-2 w-[90%] border-2 border-black"
          type="text"
          placeholder="Ask Me Anything..."
        />
        <PaperAirplaneIcon
          onClick={() => pass}
          className="w-7 h-7 -ml-10 cursor-pointer"
        />
      </div>
    </div>
  );
};

export default AIDisplay;
