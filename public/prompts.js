document.addEventListener("DOMContentLoaded", async function() {
    const playPromptButton = document.getElementById('playPromptButton');
    const promptText = document.getElementById('prompt');
    const promptTranslationText = document.getElementById('prompt-translation');
    const recordButton = document.getElementById('recordButton');
    const transcriptText = document.getElementById('transcript');
    const successMessage = document.getElementById('successMessage');
    const incorrectMessage = document.getElementById('incorrectMessage');
    const successSound = document.getElementById('correctSound');
    const wrongSound = document.getElementById('wrongSound');
    const progressBar = document.querySelector('.progress');

    const mediaQuery = window.matchMedia('(max-width: 1920px) and (max-height: 1200px)');

    let prompts = [];
    let promptsTranslation = [];
    let currentPromptIndex = 0;
    let isRecording = false;
    let mediaRecorder;
    let audioChunks = [];
    let recognition;
    let isRecognizing = false;

    async function fetchPrompts() {
        const response = await fetch("/prompts", {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            }
        });

        const data = await response.json();
        prompts = data.prompts;
        promptText.innerText = prompts[currentPromptIndex];
        promptsTranslation = data.translatedPrompts;
        promptTranslationText.innerText = promptsTranslation[currentPromptIndex];
    }

    function updateProgressBar() {
        const progressPercentage =((currentPromptIndex + 1) / prompts.length) * 100;
        progressBar.style.width = progressPercentage + '%';
    }

    async function checkTimeRemaining () {
        try {
            const response = await fetch('/time-remaining');
            const data = await response.json();
            return data.timeRemaining;
        } catch (e) {
            console.error('Error fetching time remaining: ', error);
            return 0;
        }
    }

    function displayTimer (timeRemaining) {
        const timerDiv = document.createElement('div');
        timerDiv.id = 'timerDiv';
        timerDiv.className = 'timer';
        document.body.appendChild(timerDiv);

        function padWithZero(number) {
            return number < 10 ? `0${number}` : number;
        }

        function updateTimer () {
            const hours = padWithZero(Math.floor(timeRemaining / (100 * 60 * 60)));
            const minutes = padWithZero(Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60)));
            const seconds = padWithZero(Math.floor((timeRemaining % (1000 * 60)) / 1000));

            timerDiv.innerHTML = `Next set of prompts will be available in ${hours}:${minutes}:${seconds}`;

            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                timerDiv.innerHTML = 'New Prompts are available!';
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }

            timeRemaining -= 1000;

        };

        updateTimer();
        const timerInterval = setInterval(updateTimer, 1000);
    }

    async function userFinishedPrompts () {
        if ((currentPromptIndex + 1) >= prompts.length) {
            const timeRemaining = await checkTimeRemaining();
            if (timeRemaining > 0) {
                displayTimer(timeRemaining);
            }
        }
    }

    playPromptButton.addEventListener('click', async function() {
        const text = promptText.innerText;
        try {
            const response = await fetch('/synthesize-speech', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });
    
            if (!response.ok) {
                throw new Error('Failed to synthesize speech');
            }
    
            const data = await response.json();
            const audioResponse = data.audioResponse;
            
            const audio = new Audio(audioResponse);
            stopRecording(mediaQuery);
            audio.play();
        } catch (e) {
            console.error('Error synthesizing speech: ', e);
        }
    });

    recordButton.addEventListener('click', function() {
        if (isRecording) {
            stopRecording(mediaQuery);
        } else {
            startRecording(mediaQuery);
        }
    });

    function moveToNewPosition(mq) {
        const recordDiv = document.querySelector('.record_div');

        recordDiv.style.position = 'absolute';
        recordDiv.style.bottom = '29%';
        recordDiv.style.left = '49.5%';
        recordDiv.style.transform = 'translate(-47%, 52%)';
    }

    async function startRecording(mq) {
        const stream = await navigator.mediaDevices.getUserMedia({audio: true});
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        mediaRecorder.start();
        isRecording = true;
        audioChunks = [];
        if (mq.matches) {
            recordButton.innerHTML = '<img src="img/wave.gif" alt="recording" style="width: 210px; height: auto;">';
        }
        moveToNewPosition();
        startRecognition();

    }

    function stopRecording(mq) {
        if (isRecording){
            if (mq.matches) {
                recordButton.innerHTML = '<img src="img/microphone.png" alt="recording" style="width: 100px; height: auto;">';
            }
            moveToNewPosition();
            mediaRecorder.stop();
            isRecording = false;
            stopRecognition();
        }
    }

    function startRecognition() {
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = 'en-US';
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
            let transcript = '';
            for (let i = 0; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            transcriptText.innerText = transcript.toLowerCase();

            const similarity = calculateSimilarity(
                promptText.innerText.toLowerCase().replace(/[^\w\s]/g, ''), 
                transcript.toLowerCase().replace(/[^\w\s]/g, '')
            );

            if (similarity >= 84) {
                successSound.play();
                stopRecording(mediaQuery);
                updateProgressBar();
                showSuccessMessage();
                setTimeout(() => {
                    if (currentPromptIndex < prompts.length - 1) {
                        currentPromptIndex++;
                        promptText.innerText = prompts[currentPromptIndex];
                        promptTranslationText.innerText = promptsTranslation[currentPromptIndex];
                        transcriptText.innerText = "..."
                    } else {
                        userFinishedPrompts();
                    }
                    hideSuccessMessage();
                }, 3000);
            } else {
                wrongSound.play();
                stopRecording(mediaQuery);
                showIncorrectMessage();
                setTimeout(() => {
                    transcriptText.innerText = "..."
                    hideIncorrectMessage();
                }, 3000);
            }

            stopRecording(mediaQuery);

        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
        };

        recognition.onend = () => {
            if(isRecognizing) {
                recognition.start();
            }
        };

        recognition.start();
        isRecognizing = true;
    }

    function stopRecognition() {
        if(isRecognizing) {
            recognition.stop();
            isRecognizing = false;
        }
    }

    function calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        const longerLength = longer.length;

        if (longerLength === 0) {
            return 1.0;
        }

        return ((longerLength - editDistance(longer, shorter)) / longerLength) * 100;
    }

    function editDistance(s1, s2) {
        const costs = [];
        for (let i = 0; i <= s1.length; i++) {
            let lastValue = i;
            for (let j = 0; j < s2.length; j++) {
                if (i === 0) {
                    costs[j] = j;
                } else {
                    if (j > 0) {
                        let newValue = costs[j - 1];
                        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                        }
                        costs[j - 1] = lastValue;
                        lastValue = newValue;
                    }
                }
            }
            if (i > 0) {
                costs[s2.length] = lastValue;
            }
        }
        return costs[s2.length];
    }

    function showSuccessMessage() {
        successMessage.classList.add('show');
    }

    function hideSuccessMessage() {
        successMessage.classList.remove('show');
    }

    function showIncorrectMessage() {
        incorrectMessage.classList.add('show');
    }

    function hideIncorrectMessage() {
        incorrectMessage.classList.remove('show');
    }

    fetchPrompts();

});
