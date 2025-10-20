import React, { useRef, useEffect, useState } from 'react';
import BackButton from "../../components/BackButton/BackButton";
import { assets } from '../../assets/assets.js';
import axios from "axios";


const Draw = () => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [word, setWord] = useState('');
    const [label, setLabel] = useState('');
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
                ctx.strokeStyle = '#000000';
                ctx.globalCompositeOperation = 'source-over';
                ctx.lineTo(x, y);
                ctx.stroke();

            // eraser tool
            } else if (currentTool === 1) {
                ctx.globalCompositeOperation = 'destination-out';
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

        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseUp);

        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('mouseleave', handleMouseUp);
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
        setWord('Draw something!');
        setLabel('Round started');
        let spanish = ["Balde", "Computadora", "Puerta", "Ojo", "Bombilla", "Montaña", "Tijeras", "Arcoíris", "Sol", "Árbol"];

        let index = Math.floor(Math.random() * bucket.length); // random index from the word bucket
        let label = bucket.splice(index, 1).join(""); // removes that word from bucket to avoid repetition
        if (bucket.length == 0) { // if bucket is empty, reset it
          bucket = JSON.parse(JSON.stringify(label));
        }
        setLabel(label);
        setInterval(getCanvasImage, 1000);
    
    };


    return (
      <div className="w-auto h-screen overflow-hidden bg-cover flex flex-col items-center justify-center relative" style={{ backgroundImage: `url(${assets.jungle})` }}>
        <div
          width={800}
          height={50}
          className="text-white border-2 border-b-transparent border-gray-400 bg-black w-[805px] h-12 text-center font-bold text-2xl p-2"
        >
            {label}
        </div>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border-2 border-gray-400 border-t-transparent bg-white cursor-crosshair"
        />

        <BackButton />

        <p className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-5xl text-gray-100 font-semibold select-none">
          {word}
        </p>

        <div
          id="button-container"
          className="absolute right-0 p-[10px] m-0 top-[50%] translate-y-[-50%] flex flex-col gap-2 h-[50%] align-center justify-center"
        >
          <button
            className="p-2 bg-gray-200 rounded hover:bg-gray-300"
            onClick={() => setCurrentTool(0)}
          >
            Brush
          </button>
          <button
            className="p-2 bg-gray-200 rounded hover:bg-gray-300"
            onClick={() => setCurrentTool(1)}
          >
            Eraser
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
          <button
            className="p-2 bg-green-600 rounded hover:bg-green-700"
            onClick={startRound}
          >
            Start Round
          </button>
        </div>
      </div>
    );
};

export default Draw;