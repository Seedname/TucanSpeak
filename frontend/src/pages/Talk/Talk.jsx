import React, { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import { assets } from "../../assets/assets";
import { SpeakerWaveIcon, MicrophoneIcon } from "@heroicons/react/24/solid";
import BackButton from "../../components/BackButton/BackButton";
import { AppContext } from "../../context/AppContext";

const Talk = () => {
  const { url } = useContext(AppContext);
  const [allPrompts, setAllPrompts] = useState({ english: [], translated: [] });
  const [currentPrompts, setCurrentPrompts] = useState([
    "Loading...",
    "Cargando...",
  ]);
  const [transcript, setTranscript] = useState("...");
  const [currentIndex, setCurrentIndex] = useState(() => {
    const savedProgess = localStorage.getItem('tucanTalkProgress');
    if (savedProgess) {
      const {index} = JSON.parse(savedProgess);
      return index;
    }
    return 0;
  });

  const [completedAt, setCompletedAt] = useState(() => {
    const saved = localStorage.getItem('tucanTalkCompletedAt');
    return saved ? parseInt(saved, 10) : null;
  });

  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showWrong, setShowWrong] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showTimer, setShowTimer] = useState(false);


  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const streamRef = useRef(null);

  const saveProgress = (index, isCompleted = false) => {
    localStorage.setItem('tucanTalkProgress', JSON.stringify({ index }));

    if (isCompleted) {
      const timestamp = Date.now();
      localStorage.setItem('tucanTalkCompletedAt', timestamp.toString());
      setCompletedAt(timestamp);
    }
  };

  const successSoundRef = useRef(
    new Audio("/sound/Prodigy Sounds_ Correct.mp3")
  );
  const wrongSoundRef = useRef(new Audio("/sound/negative_beeps.mp3"));

  const updateCurrentPrompts = (index) => {
    if (index < allPrompts.english.length) {
      setCurrentPrompts([
        allPrompts.english[index],
        allPrompts.translated[index],
      ]);
    }
  };

  const handleSuccess = () => {
    successSoundRef.current.play();
    setShowSuccess(true);

    setTimeout(() => {
      setShowSuccess(false);
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);

      if (nextIndex >= allPrompts.english.length) {
        saveProgress(nextIndex, true);
        setCurrentPrompts(["...", "..."]);
        setTranscript("...");
        checkTimeRemaining();
      } else {
        saveProgress(nextIndex, false);
        updateCurrentPrompts(nextIndex);
        setTranscript("...");
      }
    }, 2000);
  };

  const handleWrong = () => {
    wrongSoundRef.current.play();
    setShowWrong(true);

    setTimeout(() => {
      setShowWrong(false);
      setTranscript("...");
    }, 2000);
  };

  const checkTimeRemaining = async () => {
    try {
      const response = await axios.get(`${url}prompt/time-remaining`);
      if (response.data && response.data.timeRemaining > 0) {
        setTimeRemaining(response.data.timeRemaining);
        setShowTimer(true);
        startTimer(response.data.timeRemaining);

        const resetAt = Date.now() + response.data.timeRemaining;
        localStorage.setItem('resetAt', resetAt.toString());
      }
    } catch (e) {
      console.error("Error checking time remaining", e);
      setError("Error checking time remaining");
    }
  };

  const startTimer = (initialTime) => {
    let time = initialTime;

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    timerIntervalRef.current = setInterval(() => {
      time -= 1000;
      setTimeRemaining(time);

      if (time <= 0) {
        clearInterval(timerIntervalRef.current);
        setShowTimer(false);

        localStorage.removeItem('resetAt');
        localStorage.removeItem('tucanTalkCompletedAt');
        localStorage.removeItem('tucanTalkProgress');
        window.location.reload();
      }
    }, 1000);
  };

  const formatTime = (ms) => {
    const hours = String(Math.floor(ms / (1000 * 60 * 60))).padStart(2, "0");
    const minutes = String(
      Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    ).padStart(2, "0");
    const seconds = String(Math.floor((ms % (1000 * 60)) / 1000)).padStart(
      2,
      "0"
    );
    return `${hours}:${minutes}:${seconds}`;
  };

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 48000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      streamRef.current = stream;

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
        audioBitsPerSecond: 128000,
      });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        await processAudioData();
      };

      mediaRecorderRef.current.start(250);
      setIsRecording(true);
    } catch (e) {
      console.error("Error accessing microphone:", e);
    }
  };

  const processAudioData = async () => {
    if (audioChunksRef.current.length === 0) {
      console.error("No audio data recorded");
      return;
    }

    const audioBlob = new Blob(audioChunksRef.current, {
      type: "audio/webm;codecs=opus",
    });

    try {
      const base64Audio = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      const response = await axios.post(
        `${url}prompt/recognize-speech`,
        {
          audioData: base64Audio,
          originalPrompt: currentPrompts[0],
        },
        {
          headers: {
            "Content-Type": "application/json",
          }
        });

        if (response.data?.success) {
          setTranscript(response.data.transcript || 'No transcript recieved');
          if (response.data.similarity >= 84) {
            handleSuccess();
          } else {
            handleWrong()
          }
        } else {
          setError('Failed to process speech recognition');
        }
    } catch (e) {
      setError('Error processing speech');
      console.error('Error processing audio:', e);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const fetchPrompts = async () => {
    try {
      const resetAt = localStorage.getItem('resetAt');
      const completedAt = localStorage.getItem('tucanTalkCompletedAt');
      const savedProgess = localStorage.getItem('tucanTalkProgress')

      if (resetAt) {
        const remainingTime = parseInt(resetAt, 10) - Date.now()

        if (remainingTime > 0) {
          setShowTimer(true);
          startTimer(remainingTime);
          return;
        } else {
          localStorage.removeItem('resetAt')
          localStorage.removeItem('tucanTalkCompletedAt')
          localStorage.removeItem('tucanTalkProgress')
        }
      }

      const response = await axios.get(`${url}prompt/get`);

      if (response.data && response.data.success) {
        setAllPrompts({
          english: response.data.prompts,
          translated: response.data.translatedPrompts,
        });

        if (savedProgess && !completedAt) {
          const {index} = JSON.parse(savedProgess);
          const validIndex = Math.min(index, response.data.prompts.length - 1);
          setCurrentIndex(validIndex);
          setCurrentPrompts([
            response.data.prompts[validIndex],
            response.data.translatedPrompts[validIndex],
          ]);
        } else {
          setCurrentIndex(0);
          setCurrentPrompts([
            response.data.prompts[0],
            response.data.translatedPrompts[0],
          ]);
        }
      } else {
        setError("Error fetching prompts");
        console.log("Error fetching prompts");
      }
    } catch (e) {
      setError("Error loading prompts");
      console.error("Error fetching prompts:", e);
    }
  };

  const textToSpeech = async () => {
    try {
      setError(null);
      const response = await axios.post(
        `${url}prompt/synthesize-speech`,
        {
          text: currentPrompts[0],
        },
        {
          headers: { "Content-Type": "application/json" },
          responseType: "json",
        }
      );

      if (response.data && response.data.audioContent) {
        const audioContent = response.data.audioContent;
        const audioUrl = "data:audio/mp3;base64," + audioContent;
        const audio = new Audio(audioUrl);
        audio.play();
      } else {
        setError("No audio received");
        console.error("No audio content in response:", response);
      }
    } catch (e) {
      setError("Error playing audio");
      console.log("Error synthesizing speech", e);
    }
  };

  useEffect(() => {
    fetchPrompts();
    return () => {
      successSoundRef.current.pause();
      successSoundRef.current.currentTime = 0;
      wrongSoundRef.current.pause();
      wrongSoundRef.current.currentTime = 0;
      if (isRecording) {
        stopRecording();
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="p-0 m-0 h-screen overflow-hidden bg-slate-400 text-white select-none bg-no-repeat bg-cover">
      <BackButton />
      {/* Progress Bar */}
      <div className="relative border-[3px] border-black w-[60%] my-5 mx-auto bg-[#676767] h-7 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#37c2e8] transition-[width] duration-300 ease-in-out"
          style={{
            width: `${
              (currentIndex / (allPrompts.english.length || 1)) * 100
            }%`,
          }}
        >
          {/* Progress */}
        </div>
      </div>

      {/*Timer Display*/}
      {showTimer && (
        <div className="absolute w-full h-full top-0 left-0 bg-black bg-opacity-60 text-center flex justify-center items-center text-white text-5xl z-50">
          Next Set of prompts will be available in {formatTime(timeRemaining)}
        </div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-[54%] left-[45%] transform -translate-x-[50%] -translate-y-[50%] bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce">
          Correct!
        </div>
      )}

      {/* Wrong Message */}
      {showWrong && (
        <div className="fixed top-[54%] left-[45%] transform -translate-x-[50%] -translate-y-[50%] bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-shake">
          Try Again!
        </div>
      )}

      {/* Main Tablet */}
      <div className="flex items-center justify-center h-full">
        <div className="w-[700px] h-[80%] translate-y-[-6%] relative">
          <img
            className="flex items-center justify-center m-auto h-full"
            src={assets.tablet}
            alt="tablet"
          />
          <h1 className="absolute top-10 left-[30%] text-3xl font-bold ">
            Speak This Sentence
          </h1>

          {/* Prompt */}
          <div className="absolute w-max h-12 top-[20%] left-[15%] flex">
            <img
              className="h-full w-auto mr-5"
              src={assets.toucan_profile}
              alt="toucan profile"
            />
            <div className="relative h-full min-w-[200px] max-w-fit bg-black border-2 border-[#676767] rounded-[10px] px-[10px] flex items-center">
              <SpeakerWaveIcon
                onClick={() => textToSpeech()}
                className="relative w-7 h-7 cursor-pointer"
              />
              <div className="w-full ml-3 text-sm">
                <p id="prompt">{currentPrompts[0]}</p>
                <p className="text-blue-300" id="prompt-translation">
                  {currentPrompts[1]}
                </p>
              </div>
            </div>
          </div>

          {/* Transcript */}
          <div className="absolute w-max h-12 top-[35%] right-[15%] flex">
            <div className="relative h-full min-w-[200px] max-w-fit bg-black border-2 border-[#676767] rounded-[10px] px-[10px] flex items-center">
              <div className="w-full text-right">
                <p id="transcript">{transcript}</p>
              </div>
            </div>
            <img
              className="h-full w-auto ml-5"
              src={assets.user_profile}
              alt="user profile"
            />
          </div>

          {/* Record Button */}
          <div
            onClick={() => toggleRecording()}
            className="absolute border-2 border-[#676767] bg-black rounded-[20px] p-5 max-w-fit top-[60%] left-[37%]"
          >
            <MicrophoneIcon
              className={`w-28 h-28 cursor-pointer ${
                isRecording ? "text-red-600" : 'text-white'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Talk;
