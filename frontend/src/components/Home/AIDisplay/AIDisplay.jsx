import React, { useState, useContext } from "react";
import ToucanAnimation from "../../Toucan/Toucan";
import { AppContext } from '../../../context/AppContext';
import { PaperAirplaneIcon, MicrophoneIcon } from "@heroicons/react/24/outline";
import LevelBadge from "../../LevelBadge/LevelBadge";
import "./AIDisplay.css"; 

const AIDisplay = () => {
  const { url } = useContext(AppContext);

  let eventSource = null;
  let audioQueue = [];
  let isPlaying = false;

  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);

  const promptAi = () => {
    if (eventSource) {
      eventSource.close();
    }

    setMessages(prev => [...prev, { type: "user", content: userInput }]);
    setUserInput("");

    eventSource = new EventSource(`${url}api/chatbot/stream?message=${encodeURIComponent(userInput)}`);
    let audioChunks = [];
    let currentMessage = "";

    eventSource.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "text") {
        console.log("Received from server:", event.data);
        currentMessage += data.content;
        
        setMessages(prev => {
          if (prev.length > 0 && prev[prev.length - 1].type === "ai" && prev.length > 1) {
            prev[prev.length - 1].content = currentMessage;
          } else {
            prev = [...prev, { type: 'ai', content: currentMessage }];
          }
          return [...prev];
        });
      } else if (data.type === "audio") {
        const binaryString = atob(data.chunk);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);

        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        audioChunks.push(bytes.buffer);
      } else if (data.type === "partialEnd") {
        const audioBlob = new Blob(audioChunks, { type: "audio/ogg" }); // Ensure correct MIME type
        const audioUrl = URL.createObjectURL(audioBlob);
        audioQueue.push(audioUrl);
        audioChunks = [];

        if (!isPlaying) {
          playNextAudio();
        }
      } else if (data.type === "end") {
        eventSource.close();
      }
    };

    eventSource.onerror = (err) => {
      console.error("EventSource failed:", err);
      eventSource.close();
    };
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      promptAi();
    }
  };

  const playNextAudio = async () => {
    if (audioQueue.length === 0) {
      isPlaying = false;
      return;
    }

    isPlaying = true;
    const nextAudioUrl = audioQueue.shift();
    const audio = new Audio(nextAudioUrl);

    audio.onerror = (e) => {
      console.error("Error playing audio:", e);
      isPlaying = false;
      playNextAudio();
    };

    audio.onended = () => {
      isPlaying = false;
      playNextAudio();
    };

    try {
      await audio.play();
    } catch (e) {
      console.error("Error in audio playback:", e);
      isPlaying = false;
      playNextAudio();
    }
  };

  return (
    <div className="bg-white w-2/3 flex flex-col items-center h-screen">
      <LevelBadge />
      <ToucanAnimation />
      <div className="flex flex-col flex-grow w-2/3 p-4 overflow-y-auto space-y-4" id="messageArea">
        {messages.map((message, index) => (
          <div 
            key={index}
            className={`message-bubble ${message.type === 'user' ? 'user-message' : 'ai-message'}`}
          >
            {message.content}
          </div>
        ))}
      </div>
      <div className="w-2/3 flex items-center p-4 bg-gray-100">
        <input
          className="flex-1 bg-slate-50 rounded-full px-6 py-3 ml-2 border border-gray-300"
          id="chatbox"
          type="text"
          placeholder="Ask Me Anything..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <PaperAirplaneIcon
          onClick={promptAi}
          className="w-7 h-7 ml-2 cursor-pointer"
        />
      </div>
    </div>
  );
};

export default AIDisplay;
