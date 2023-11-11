var talking = false;

document.addEventListener('DOMContentLoaded', () => {
    const utterance = new SpeechSynthesisUtterance();
    
    function speak(text) {
      utterance.text = text;
      utterance.volume = 1;
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.voice = window.speechSynthesis.getVoices()[10];
      window.speechSynthesis.speak(utterance);
    }

    speak("");

    const responseElement = document.getElementById('response');
    const outputDiv = document.getElementById('output');
    const ws = new WebSocket(`ws://${window.location.host}:80`);
  
  
    let recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
  
    const startRecordingButton = document.getElementById('startRecording');
    const stopRecordingButton = document.getElementById('stopRecording');
  
    startRecordingButton.addEventListener('click', startRecording);
    stopRecordingButton.addEventListener('click', stopRecording);
  
    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      outputDiv.textContent = transcript;
      ws.send(JSON.stringify({type: "start", "content": transcript}));
    };


    function startRecording() {
      recognition.start();
      startRecordingButton.disabled = true;
      stopRecordingButton.disabled = false;
    }
  
    function stopRecording() {
      recognition.stop();
      startRecordingButton.disabled = false;
      stopRecordingButton.disabled = true;
    }
  
    
    var differential = "";
    var speechQueue = [];
    var punctuation = [".", "!", "?"];
    let canDo = true;

    ws.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
  
      switch (data.type) {
        case 'start':
            responseElement.innerText = "";
            break;
        case 'update':
            let normal = true;
            for (let i = 0; i < punctuation.length; i++) {
              let index = data.content.indexOf(punctuation[i]);
              if (index >= 0) {
                speechQueue.push(differential + data.content.substring(0, index+1));
                let rest = data.content.substring(index+1);
                differential = rest;
                normal = false;
                break;
              }
            }
            
            if (normal) {
              differential += data.content;
            }

            if (!talking && speechQueue[0] && canDo) {
              let sentence = speechQueue[0];
              speechQueue.shift();
              speak(sentence);
              canDo = false;
            }

            responseElement.innerText += data.content;
            break;
        case 'end':
            if (!talking && speechQueue.length === 0) {
              speak(responseElement.innerText);
            }
            break;
        default:
            break;
      }
    });

    utterance.onstart = function(event) {
      talking = true;
    };
    
    utterance.onend = function(event) {
        talking = false;
        if (speechQueue[0]) {
          let sentence = speechQueue[0];
          speechQueue.shift();
          speak(sentence);
        }
        if (speechQueue.length === 0) {
          canDo = true;
        }
    };
  
    // Close the WebSocket when the window is closed
    window.addEventListener('beforeunload', () => {
      ws.close();
    });
  });
  