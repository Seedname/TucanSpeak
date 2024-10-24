import React, { useState, useEffect, useContext } from 'react';
import { assets } from '../../assets/assets';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';

const lvl1 = {
  "Greetings and Introductions": {
    "Hello, how are you?": "Hola, ¿cómo estás?",
    "My name is [your name].": "Me llamo [tu nombre].",
    "Nice to meet you.": "Mucho gusto.",
    "Good morning.": "Buenos días.",
    "Good afternoon.": "Buenas tardes.",
    "Good evening/night.": "Buenas noches."
  },
  // ... rest of the dictionary from script.js
};

export default function Translate() {
  const [score, setScore] = useState(0);
  const [currentSentence, setCurrentSentence] = useState({ spanishSentence: "", englishTranslation: "" });
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [userInput, setUserInput] = useState("");
  const [apiResponse, setApiResponse] = useState("¡Hola! I am tu AI assistant. I'll be helping you con hints y explicaciones en your respuestas. ¡You got this!🙌");
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [showApiResponse, setShowApiResponse] = useState(false);

  const {url} = useContext(AppContext);

  const getRandomSentence = () => {
    const categories = Object.keys(lvl1);
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const phrases = lvl1[randomCategory];
    const keys = Object.keys(phrases);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return {
      spanishSentence: phrases[randomKey],
      englishTranslation: randomKey
    };
  };

  useEffect(() => {
    let timer;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setShowScoreboard(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  const handleStart = () => {
    if (!isRunning) {
      setScore(0);
      setTimeLeft(30);
      setCurrentSentence(getRandomSentence());
      setIsRunning(true);
      setShowScoreboard(false);
    }
  };

  const handleSubmit = async () => {
    if (!isRunning) {
      setApiResponse("Please start the game first!");
      return;
    }

    const apiRequestMessage = `Is "${userInput}" the English translation of "${currentSentence.spanishSentence}"?`;
    setApiResponse("Loading AI response...🔃");

    try {
      const response = await axios.post(`${url}api/translate/message`, {
         message: apiRequestMessage,
      });
      const data = response.data;
      
      if (data.response.toLowerCase().includes('correct')) {
        setScore(prev => prev + 1);
        // Play correct sound
        setCurrentSentence(getRandomSentence());
      }
      // Play incorrect sound
      
      setUserInput("");
      setApiResponse(data.response);
    } catch (error) {
      console.error('Error:', error);
      setApiResponse("An error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-cover" style={{ backgroundImage: "url(./pictures/background.jpg)" }}>
      {/* Scoreboard */}
      {showScoreboard && (
        <div className="fixed inset-0 z-10 flex items-center justify-center">
          <div className={`w-[1200px] h-[700px] bg-pink-100 border-4 border-brown-800 rounded-[50px] text-center bg-${assets.score} bg-cover`}>
            <div className="flex flex-col items-center justify-center h-full">
              <h1 className="text-5xl font-bold text-brown-800">FINAL SCORES</h1>
              <h2 className="text-2xl mt-4">Your final score is:</h2>
              <h2 className="text-4xl text-red-600">{score}</h2>
              <p className="px-24 mt-4">¡Awesome job! Cada día que practicas, te acercas más a tus sueños. ¡Keep going, you're amazing! 🌟💪</p>
              <button 
                onClick={() => setShowScoreboard(false)}
                className="mt-12 px-6 py-2 bg-red-300 text-white rounded-xl hover:bg-red-400"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Section */}
      <div className="flex justify-between p-4">
        <div className="relative">
          <button 
            onClick={() => setShowApiResponse(!showApiResponse)}
            className={`w-[70px] h-[70px] rounded-full border-2 border-blue-400 bg-[url('/robo1.png')] bg-contain hover:bg-[url('./robo2.png')]`}
          />
          {showApiResponse && (
            <div className="absolute left-0 mt-2 p-4 bg-blue-50 border border-blue-200 rounded-3xl w-[200px]">
              {apiResponse}
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-2">
          <div className="px-4 py-2 w-[150px] text-center rounded-xl bg-orange-200 border-2 border-orange-500 text-orange-700">
            TIME: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
          <div className="px-4 py-2 w-[150px] text-center rounded-xl bg-green-200 border-2 border-green-700 text-green-900">
            SCORE: {score}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="mt-24 mb-10">
        <div className="flex justify-center items-center gap-4">
          <img src={assets.toucan} alt="toucan" className="w-[200px]" />
          <div className="bg-white rounded-full p-10 w-[500px] h-[140px] text-center">
            {isRunning ? currentSentence.spanishSentence : "Press 'START' para comenzar el TuCan Translate ✨"}
          </div>
        </div>

        <div className="flex justify-center mt-4">
          <div className="bg-[#FFFEEC] rounded-3xl w-[780px] p-8 border border-[#A47E45]">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type your translation here..."
              className="w-full h-[100px] bg-transparent outline-none text-lg placeholder-[#BBB784] placeholder-italic"
            />
            <div className="flex justify-center gap-4">
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-[#E9F2FF] text-[#4F5F76] border border-[#A4B3C8] rounded-xl hover:bg-[#A4B3C8] hover:text-white"
              >
                Submit
              </button>
              <button
                onClick={handleStart}
                disabled={isRunning}
                className={`px-4 py-2 rounded-xl ${
                  isRunning 
                    ? 'bg-gray-300 text-gray-500 border-gray-400' 
                    : 'bg-[#e9fffc] text-[#4f766c] border border-[#A4B3C8] hover:bg-[#a4c7c8] hover:text-white'
                }`}
              >
                Start
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}