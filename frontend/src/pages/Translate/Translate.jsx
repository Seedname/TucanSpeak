import React, { useState, useEffect, useContext, useRef } from 'react';
import { assets } from '../../assets/assets';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import BackButton from "../../components/BackButton/BackButton";
import { getCookie } from '../../utils/helper';

const lvl1 = {
  "Greetings and Introductions": {
    "Hello, how are you?": "Hola, ¿cómo estás?",
    "My name is [your name].": "Me llamo [tu nombre].",
    "Nice to meet you.": "Mucho gusto.",
    "Good morning.": "Buenos días.",
    "Good afternoon.": "Buenas tardes.",
    "Good evening/night.": "Buenas noches."
  },
  "Basic Questions": {
    "How are you?": "¿Qué tal?",
    "What is your name?": "¿Cómo te llamas?",
    "Where are you from?": "¿De dónde eres?",
    "How old are you?": "¿Cuántos años tienes?",
    "What time is it?": "¿Qué hora es?",
    "Can you help me?": "¿Puedes ayudarme?",
    "Where is the bathroom?": "¿Dónde está el baño?",
    "How much does this cost?": "¿Cuánto cuesta esto?",
    "Do you speak English?": "¿Hablas inglés?",
    "What is this?": "¿Qué es esto?",
    "Can you repeat that?": "¿Puedes repetir eso?"
  },
  "Common Phrases": {
    "Please.": "Por favor.",
    "Thank you.": "Gracias.",
    "You're welcome.": "De nada.",
    "Excuse me.": "Perdón.",
    "I'm sorry.": "Lo siento.",
    "Yes.": "Sí.",
    "No.": "No.",
    "I don't understand.": "No entiendo.",
    "I don't know.": "No sé.",
    "I like it.": "Me gusta.",
    "I love you.": "Te quiero.",
    "I am hungry.": "Tengo hambre.",
    "I am thirsty.": "Tengo sed.",
    "I am tired.": "Estoy cansado/cansada.",
    "I need help.": "Necesito ayuda."
  },
  "Directions and Places": {
    "Where is the hotel?": "¿Dónde está el hotel?",
    "Turn right.": "Gira a la derecha.",
    "Turn left.": "Gira a la izquierda.",
    "Go straight ahead.": "Sigue recto.",
    "Is it far?": "¿Está lejos?",
    "Is it near?": "¿Está cerca?",
    "I am lost.": "Estoy perdido/perdida."
  },
  "Shopping and Money": {
    "How much is it?": "¿Cuánto cuesta?",
    "I want to buy this.": "Quiero comprar esto.",
    "Do you accept credit cards?": "¿Aceptan tarjetas de crédito?",
    "I need a receipt.": "Necesito un recibo.",
    "Can you give me a discount?": "¿Me puede dar un descuento?",
    "Where is the market?": "¿Dónde está el mercado?",
    "What time does it open?": "¿A qué hora abre?",
    "What time does it close?": "¿A qué hora cierra?"
  },
  "Eating and Drinking": {
    "I would like a table for two.": "Quisiera una mesa para dos.",
    "Can I see the menu?": "¿Puedo ver el menú?",
    "What do you recommend?": "¿Qué me recomienda?",
    "I am a vegetarian.": "Soy vegetariano/vegetariana.",
    "The check, please.": "La cuenta, por favor.",
    "Water, please.": "Agua, por favor."
  }
};

export default function Translate() {
  const [score, setScore] = useState(0);
  const [currentSentence, setCurrentSentence] = useState({ spanishSentence: "", englishTranslation: "" });
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(35);
  const [userInput, setUserInput] = useState("");
  const [apiResponse, setApiResponse] = useState("¡Hola! I am tu AI assistant. I'll be helping you con hints y explicaciones en your respuestas. ¡You got this!🙌");
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [showApiResponse, setShowApiResponse] = useState(false);


  const [showXpGain, setShowXpGain] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [questComplete, setQuestComplete] = useState(null);
  const [questXp, setQuestXP] = useState(0);

  const successSoundRef = useRef(
    new Audio('/sound/Prodigy Sounds_ Correct.mp3')
  );
  const wrongSoundRef = useRef(
    new Audio('/sound/negative_beeps.mp3')
  )

  const {url} = useContext(AppContext)

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

  const handleXpAndQuest = async () => {

    const token = getCookie('token');

    try {
      const response = await axios.post(`${url}api/quest/handle-correct-answer`, { 
          activityType: 'translate' 
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
          }
      });

      if (response.data.success) {
        setXpGained(response.data.xpGained);
        setShowXpGain(true);

        if (response.data.questCompleted) {
          setQuestComplete(true);
          setQuestXP(response.data.questXP);
        }

        setTimeout(() => {
          setShowXpGain(false);
          if (response.data.questCompleted) {
            setQuestComplete(false);
          }
        }, 2000);
      }

      
    } catch (e) {
      console.error('Error handling XP:', e);
    }
  };

  const handleStart = () => {
    if (!isRunning) {
      setScore(0);
      setTimeLeft(35);
      setCurrentSentence(getRandomSentence());
      setIsRunning(true);
      setShowScoreboard(false);
      setXpGained(0);
      setQuestComplete(false);
      setQuestXP(0);
    }
  };

  const handleSubmit = async () => {

    const token = getCookie('token');

    if (!isRunning) {
      setApiResponse("Please start the game first!");
      return;
    }

    const apiRequestMessage = `Is "${userInput}" the English translation of "${currentSentence.spanishSentence}"?`;
    setApiResponse("Loading AI response...🔃");

    try {
      const response = await axios.post(`${url}api/translate/message`, {
         message: apiRequestMessage,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      const data = response.data;
      
      if (data.response.toLowerCase().includes('correct')) {
        setScore(prev => prev + 1);
        successSoundRef.current.play()
        await handleXpAndQuest();
        setCurrentSentence(getRandomSentence());
      }else {
        wrongSoundRef.current.play()
      }
      
      setUserInput("");
      setApiResponse(data.response);
    } catch (error) {
      console.error('Error:', error);
      setApiResponse("An error occurred. Please try again.");
    }
  };

  return (
    <div className="h-screen bg-cover bg-gray-500" style={{ backgroundImage: `url(${assets.jungle})` }}>
      <BackButton />
      {/* Xp Gained */}
      {showXpGain && (
        <div className="fixed top-24 right-4 bg-yellow-400 text-black px-3 py-1 rounded-lg animate-bounce">
          +{xpGained} XP
        </div>
      )}

      {/* Daily Quest Gain */}
      {questComplete && (
        <div className="fixed top-32 right-4 bg-green-400 text-black px-3 py-1 rounded-lg animate-bounce">
          Daily Quest Complete! +{questXp} XP
        </div>
      )}


      {/* Scoreboard */}
      {showScoreboard && (
        <div className="fixed inset-0 z-10 flex items-center justify-center">
          <div className={`w-[1200px] h-[700px] bg-pink-100 border-4 border-brown-800 rounded-[50px] text-center bg-${assets.score} bg-cover`}>
            <div className="flex flex-col items-center justify-center h-full">
              <h1 className="text-5xl font-bold text-brown-800">FINAL SCORES</h1>
              <h2 className="text-2xl mt-2">Your final score is:</h2>
              <h2 className="text-4xl text-red-600">{score}</h2>
              <p className="px-24 mt-2">¡Awesome job! Cada día que practicas, te acercas más a tus sueños. ¡Keep going, you're amazing! 🌟💪</p>
              <button 
                onClick={() => setShowScoreboard(false)}
                className="mt-6 px-6 py-2 bg-red-300 text-white rounded-xl hover:bg-red-400"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
  
      {/* Top Section */}
      <div className="flex justify-between p-2">
        <div className="relative">
          <button 
            onClick={() => setShowApiResponse(!showApiResponse)}
            className={`absolute w-[60px] top-14 left-2 h-[60px] rounded-full border-2 border-blue-400 bg-[url('/robo1.png')] bg-contain hover:bg-[url('./robo2.png')]`}
          />
          {showApiResponse && (
            <div className="absolute top-[115px] left-0 mt-1 p-3 bg-blue-50 border border-blue-200 rounded-3xl w-[200px]">
              {apiResponse}
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-1">
          <div className="px-4 py-1 w-[150px] text-center rounded-xl bg-orange-200 border-2 border-orange-500 text-orange-700">
            TIME: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
          <div className="px-4 py-1 w-[150px] text-center rounded-xl bg-green-200 border-2 border-green-700 text-green-900">
            SCORE: {score}
          </div>
        </div>
      </div>
  
      {/* Bottom Section */}
      <div className="mt-8">
        <div className="flex justify-center items-center gap-4">
          <img src={assets.toucan} alt="toucan" className="w-[180px] transform scale-x-[-1]" />
          <div className="bg-white rounded-full p-6 w-[500px] h-[120px] text-center flex items-center justify-center">
            {isRunning ? currentSentence.spanishSentence : "Press 'START' para comenzar el TuCan Translate ✨"}
          </div>
        </div>
  
        <div className="flex justify-center mt-2">
          <div className="bg-[#FFFEEC] rounded-3xl w-[780px] p-4 border border-[#A47E45]">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type your translation here..."
              className="w-full h-[80px] bg-transparent outline-none text-lg placeholder-[#BBB784] placeholder-italic"
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
