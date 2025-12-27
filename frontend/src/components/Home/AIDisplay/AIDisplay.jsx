import React, { useState, useEffect, useContext, useRef } from "react";
import ToucanAnimation from "../../Toucan/Toucan";
import { AppContext } from "../../../context/AppContext";
import { PaperAirplaneIcon, MicrophoneIcon } from "@heroicons/react/24/outline";
import LevelBadge from "../../LevelBadge/LevelBadge";
import "./AiDisplay.css"; 
import { useTranslation } from "react-i18next";
import axios from "axios";
import { getCookie } from "../../../utils/helper";
import { init } from "i18next";
import { assets } from "../../../assets/assets";

const AIDisplay = () => {
  const {t} = useTranslation()
  const { url } = useContext(AppContext);

  let eventSource = null;
  let audioQueue = [];
  let isPlaying = false;

  let currentMessage = "";
  let audioChunks = [];
  
  const initalMessage = {
    type: "ai", 
    content: "¡Hola! 😄 I'm Tilly, your friendly English tutor! Let's start your English adventure today. 🌟"
  }

  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([initalMessage]);
  const messageEndRef = useRef(null);

  

  useEffect(() => {
    console.log("Current messages:", messages); 
    const storedMessages = localStorage.getItem("messages");
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("messages", JSON.stringify(messages));
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatMessage = (message) => {
    let formattedMessage = message
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>");

    return formattedMessage;
  };

  const promptAi = async () => {
    // if (eventSource) {
    //   eventSource.close();
    // }

    const token = getCookie('token');
    if (!token) {
      console.error('No token found!');
      return;
    }

    setMessages((prev) => [...prev, { type: "user", content: userInput }]);
    setUserInput("");

    console.log(token)

    const res = await fetch(`${url}api/chatbot/stream?message=${encodeURIComponent(userInput)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok || !res.body) {
      console.error('Failed to initiate chatbot stream');
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const {done, value} = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, {stream: true});
      const parts = buffer.split("\n\n");
      buffer = parts.pop();

      for (const part of parts) {
        if (part.startsWith("data:")) {
          const payload = JSON.parse(part.slice(5).trim());
          handleServerEvent(payload);
        }
      }
    }
  };

  const handleServerEvent = (data) => {
    if (data.type === "text") {
      currentMessage += data.content;

        setMessages((prev) => {
          if (
            prev.length > 0 &&
            prev[prev.length - 1].type === "ai" &&
            prev.length > 1
          ) {
            prev[prev.length - 1].content = currentMessage;
          } else {
            prev = [...prev, { type: "ai", content: currentMessage }];
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
      const audioBlob = new Blob(audioChunks, { type: "audio/ogg" });
        const audioUrl = URL.createObjectURL(audioBlob);
        audioQueue.push(audioUrl);
        audioChunks = [];

        if (!isPlaying) {
          playNextAudio();
        }
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
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
    // main container for the chat
    <div className="w-2/3 flex flex-col items-center bg-green-50 h-screen">
      <img src="/vine.png" className="w-80 fixed scale-50 left-[75px] -top-56"/>
      <img src="/vine.png" className="w-80 fixed scale-50 left-[175px] -top-40"/>
      <img src="/vine.png" className="w-80 fixed scale-50 left-[275px] -top-52"/>
      <img src="/vine.png" className="w-80 fixed scale-50 left-[375px] -top-40"/>
      <img src="/vine.png" className="w-80 fixed scale-50 left-[475px] -top-52"/>
      <img src="/vine.png" className="w-80 fixed scale-50 left-[575px] -top-40"/>
      <img src="/vine.png" className="w-80 fixed scale-50 left-[675px] -top-52"/>
      <img src="/vine.png" className="w-80 fixed scale-50 left-[775px] -top-40"/>
      <img src="/vine.png" className="w-80 fixed scale-50 left-[875px] -top-56"/>

      <LevelBadge />
      <ToucanAnimation />
      <div
        className="flex flex-col flex-grow w-2/3 p-4 overflow-y-auto space-y-4"
        id="messageArea"
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message-bubble ${
              message.type === "user" ? "user-message" : "ai-message"
            }`}
            dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
          />
        ))}
        <div ref={messageEndRef} />
      </div>

 
      <div className="w-2/3 flex items-center p-4">
        <input
          className="flex-1 bg-slate-50 rounded-full px-6 py-3 ml-2 border border-gray-300"
          id="chatbox"
          type="text"
          placeholder={t("AiChat")}
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
