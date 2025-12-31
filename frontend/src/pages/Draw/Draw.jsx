import React, { useRef, useEffect, useState, useContext } from "react";
import BackButton from "../../components/BackButton/BackButton";
import { assets } from "../../assets/assets.js";
import { PaintBrushIcon } from "@heroicons/react/24/solid";
import { EraserIcon } from "lucide-react";
import axios from "axios";
import { AppContext } from "../../context/AppContext.jsx";
import { getCookie } from "../../utils/helper.js";


const Draw = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [label, setLabel] = useState("");
  const [roundStart, setRoundStart] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const predictionIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const [wordsCorrect, setWordsCorrect] = useState(0);
  const successSoundRef = useRef(
    new Audio('/sound/Prodigy Sounds_ Correct.mp3')
  );
  const [showEndScreen, setShowEndScreen] = useState(false);
  // const [finalScore, setFinalScore] = useState(0);
  const [showXpGain, setShowXpGain] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [questComplete, setQuestComplete] = useState(null);
  const [questXp, setQuestXP] = useState(0);

  const { url } = useContext(AppContext);

  const ORIGINAL_BUCKET = [
  "Bucket",
  "Laptop",
  "Door",
  "Eye",
  "Lightbulb",
  "Mountain",
  "Rainbow",
  "Scissors",
  "Sun",
  "Tree",
];

const [bucket, setBucket] = useState(ORIGINAL_BUCKET);

  const [currentTool, setCurrentTool] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);
  const [prediction, setPrediction] = useState("");
  let ctx = null;
  
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

        ctx = canvas.getContext('2d'); 
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
      
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#000000';

        // when user draws on the screen
        const handleMouseDown = (e) => {
          // find where the mouse is 
            
            setIsDrawing(true);
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // begin drawing path and moves the cursor there
            ctx.beginPath();
            ctx.moveTo(x, y);
        };

    const handleMouseMove = (e) => {

      if (!isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

            // pen tool
      if (currentTool === 0) {
        ctx.strokeStyle = "#000000";
        ctx.globalCompositeOperation = "source-over";
        ctx.lineTo(x, y);
        ctx.stroke();

            // eraser tool
      } else if (currentTool === 1) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = 15;
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.lineWidth = 3;
      }
    }; 
    const handleMouseUp = () => {
      setIsDrawing(false);
      ctx.closePath();
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mouseleave", handleMouseUp);
    };
  }, [isDrawing, currentTool]);

  const clearScreen = () => {
      const canvas = canvasRef.current;
      if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          setPrediction("");
      }
  };

  const getCanvasImage = async () => {
    // setPrediction("");
    const canvas = canvasRef.current;
    if (!canvas) return;

    // if canvas is blank .....
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const isBlank = !imageData.data.some((channel) => channel !== 0);

    if (isBlank) {
      console.log("Canvas is blank, skipping prediction");
      return;
    }

    const base64Image = canvas.toDataURL("image/png");

    try {
      const response = await axios.post(
        `${url}api/draw/tucan-draw`,
        { image: base64Image, challenge_word: label },
        { headers: { Authorization: `Bearer ${getCookie("token")}` } }
      );

      const { predicted, challenge, correct } = response.data;
      setPrediction(predicted);
      setIsCorrect(correct);
      console.log("Prediction response:", response.data);
      if (correct) {
        console.log("Correct prediction!");
        successSoundRef.current.play();
        handleXpAndQuest();
        selectWord();
        setWordsCorrect((prev) => prev + 1);
        console.log("Words correct:", wordsCorrect);
        // clearInterval(predictionIntervalRef.current);
        // clearInterval(countdownIntervalRef.current);
        // predictionIntervalRef.current = null;
        // countdownIntervalRef.current = null;
      }
    } catch (error) {
      console.error(
        "Error sending canvas image:",
        error.response?.data || error.message
      );
    }
  };

  const selectWord = () => {
    clearScreen();

    setBucket((prev) => {
      const activeBucket = prev.length === 0 ? [...ORIGINAL_BUCKET] : prev;

      const index = Math.floor(Math.random() * activeBucket.length);
      const selected = activeBucket[index];

      console.log("selected word:", selected);
      setLabel(selected);

      return activeBucket.filter((_, i) => i !== index);
    });
  }

  const startRound = () => {
    setRoundStart(true);
    selectWord();
    setWordsCorrect(0);
    setTimeLeft(60);
    // setLabel("Round started");
    let spanish = [
      "Balde",
      "Computadora",
      "Puerta",
      "Ojo",
      "Bombilla",
      "Montaña",
      "Tijeras",
      "Arcoíris",
      "Sol",
      "Árbol",
    ];
    
  };

  const endRound = () => {
    // stop timer
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      clearInterval(predictionIntervalRef.current);
      countdownIntervalRef.current = null;
      predictionIntervalRef.current = null;
    }
    //  if (wordsCorrect >= 1) {
    //   handleXpAndQuest();
    //   console.log("EXP gained:", xpGained);
      
    // } 
     // setFinalScore(score);
     setShowEndScreen(true);

     clearScreen();
     setRoundStart(false);
     setLabel("");
     setTimeLeft(0);
    //  setWordsCorrect(0);
     setBucket([...ORIGINAL_BUCKET]);
  };

  const handleXpAndQuest = async () => {

     const token = getCookie("token");

     try {
       const response = await axios.post(
         `${url}api/quest/handle-correct-answer`,
         {
           activityType: "draw",
         },
         {
           headers: {
             Authorization: `Bearer ${token}`,
           },
         }
       );

       if (response.data.success) {
        console.log("XP and quest response:", response.data);
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
       console.error("Error handling XP:", e);
     }


  }


 useEffect(() => {
   if (!label) return;
   // whenever label changes, restart interval
   if (predictionIntervalRef.current) {
     clearInterval(predictionIntervalRef.current);
   }
   predictionIntervalRef.current = setInterval(getCanvasImage, 1000);

   return () => {
    clearInterval(predictionIntervalRef.current);
    predictionIntervalRef.current = null;
   };
  }, [label]);

 
  // countdown effect: when a round starts, run a 1s interval and decrement timeLeft
  useEffect(() => {
    if (!roundStart) return;

    // ensure any previous interval is cleared
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    countdownIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // time's up
          // clearInterval(countdownIntervalRef.current);
          // countdownIntervalRef.current = null;
          // setRoundStart(false);
          // setLabel("");
          endRound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // cleanup on unmount or when roundStart changes
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [roundStart]);

  const formatTime = (seconds) => {
    const s = Math.max(0, seconds || 0);
    const mm = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const ss = Math.floor(s % 60)
      .toString()
      .padStart(2, "0");
    return `${mm}:${ss}`;
  };

  return (
    <div className="w-auto h-screen overflow-hidden bg-green-300 flex flex-col items-center justify-center relative">
      <div
        width={800}
        height={50}
        className="text-white border-2 border-b-transparent border-gray-400 bg-black w-[705px] h-12 tracking-wide font-bold text-2xl px-4 py-2 flex items-center justify-between"
      >
        <span className="truncate">
          {roundStart ? `Draw: ${label}` : "Click 'Start Round' to begin"}
        </span>
        <span className="ml-4 text-right tabular-nums">
          {roundStart ? `Time: ${formatTime(timeLeft)}` : ""}
        </span>
      </div>

      <canvas
        ref={canvasRef}
        width={700}
        height={500}
        className="border-2 border-gray-400 border-t-transparent bg-white cursor-crosshair"
      />
      <BackButton />

      {/* Xp Gained */}
      {showXpGain && (
        <div className="fixed top-24 right-4 bg-yellow-400 text-black px-3 py-1 rounded-lg animate-bounce">
          +{xpGained} XP
        </div>
      )}

      {/* Prediction Indicator */}
      {roundStart && (
        <div className="text-white border-2 border-t-transparent border-gray-400 bg-black w-[705px] h-12 tracking-wide font-bold text-xl px-4 py-2 flex items-center justify-between">
          <span>Model Prediction: {prediction || "Analyzing..."}</span>
          {isCorrect && (
            <span className="text-green-400 animate-pulse">Correct!</span>
          )}
        </div>
      )}

      {/* Words Correct Counter */}
      <div className="absolute top-2 right-5">
        <div className="relative bg-white text-blue-600 px-4 py-3 rounded-full shadow-xl border-2 border-blue-200">
          <div className="text-xs font-semibold text-center">Words Correct</div>
          <div className="text-3xl font-bold text-center">{wordsCorrect}</div>
        </div>
      </div>

      {/* End Screen Overlay */}
      {showEndScreen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-12 text-center shadow-2xl max-w-md">
            <h2 className="text-5xl font-bold text-white mb-4">
              Round Complete!
            </h2>
            <div className="bg-white rounded-xl p-6 mb-6">
              <p className="text-gray-600 text-xl mb-2">Total Words Correct</p>
              <p className="text-6xl font-bold text-blue-600">{wordsCorrect}</p>
            </div>
            <p className="text-2xl text-white font-semibold mb-6">
              {wordsCorrect >= 8
                ? "Outstanding! 🐣"
                : wordsCorrect >= 5
                ? "Great Job! ⭐"
                : wordsCorrect >= 3
                ? "Good Effort! 🌴"
                : "Keep Practicing! 💪"}
            </p>
            <button
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold text-xl hover:bg-gray-100 transition"
              onClick={() => setShowEndScreen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div
        id="button-container"
        className="absolute right-0 p-[10px] m-0 top-[50%] translate-y-[-50%] flex flex-col gap-2 h-[50%] align-center justify-center"
      >
        <button
          aria-label="Brush tool"
          className="p-2 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
          onClick={() => setCurrentTool(0)}
        >
          <PaintBrushIcon className="w-5 h-5 text-black" />
        </button>
        <button
          aria-label="Eraser tool"
          className="p-2 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
          onClick={() => setCurrentTool(1)}
        >
          <EraserIcon className="w-5 h-5 text-black" />
        </button>
        <button
          className="p-2 bg-gray-200 rounded hover:bg-gray-300"
          onClick={clearScreen}
        >
          {" "}
          Clear
        </button>
      </div>
      <div
        id="button-container"
        className="absolute left-20 p-[10px] m-0 top-0"
      >
        {!roundStart ? (
          <button
            className="p-2 bg-green-600 rounded hover:bg-green-700"
            onClick={startRound}
          >
            Start Round
          </button>
        ) : (
          <button
            className="p-2 bg-green-600 rounded hover:bg-green-700"
            onClick={endRound}
          >
            End Round
          </button>
        )}
      </div>
    </div>
  );
};

export default Draw;
