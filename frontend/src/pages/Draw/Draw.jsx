import React, { useRef, useEffect, useState } from "react";
import BackButton from "../../components/BackButton/BackButton";
import { assets } from "../../assets/assets.js";
import { PaintBrushIcon } from "@heroicons/react/24/solid";
import { EraserIcon } from "lucide-react";
import axios from "axios";


const Draw = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [label, setLabel] = useState("");
  const [roundStart, setRoundStart] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const intervalRef = useRef(null);
  let [bucket, setBucket] = useState([
    "Bucket",
    "Computer",
    "Door",
    "Eye",
    "Light Bulb",
    "Mountain",
    "Scissors",
    "Rainbow",
    "Sun",
    "Tree",
  ]);

  const [currentTool, setCurrentTool] = useState(0);
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
        }
    };

    const getCanvasImage = () => {
      const canvas = canvasRef.current;

      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      return imageData;
      
    };

  const startRound = () => {
    setRoundStart(true);
    setTimeLeft(60);
    setLabel("Round started");
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

    let index = Math.floor(Math.random() * bucket.length); // random index from the word bucket
    let label = bucket.splice(index, 1).join(""); // removes that word from bucket to avoid repetition
    if (bucket.length == 0) {
      // if bucket is empty, reset it
      bucket = JSON.parse(JSON.stringify(label));
    }

    setLabel(label);
  };

  const endRound = () => {
    // stop timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRoundStart(false);
    setLabel("");
    setTimeLeft(0);
  };

  // countdown effect: when a round starts, run a 1s interval and decrement timeLeft
  useEffect(() => {
    if (!roundStart) return;

    // ensure any previous interval is cleared
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // time's up
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setRoundStart(false);
          setLabel("");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // cleanup on unmount or when roundStart changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
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
