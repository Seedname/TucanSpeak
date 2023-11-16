var talking = false;
var talkingCooldown = 0;
var flyDown = false;
var flydownLock = false;
const utterance = new SpeechSynthesisUtterance();
const useHTTPS = true;
var speechQueue = [];

function speak(text) {
  talking = true;
  utterance.text = text;
  utterance.volume = 1;
  utterance.rate = 1.5;
  utterance.pitch = 1;
  utterance.voice = window.speechSynthesis.getVoices()[1];
  window.speechSynthesis.speak(utterance);
}
let ws;

document.addEventListener('DOMContentLoaded', () => {
    speak("");

    const responseElement = document.getElementById('response');
    const outputDiv = document.getElementById('output');
    
    if (useHTTPS) {
      ws = new WebSocket(`wss://${window.location.host}:443`);
    } else {
      ws = new WebSocket(`ws://${window.location.host}:80`);
    }
  
    const startRecordingButton = document.getElementById('startRecording');
    const stopRecordingButton = document.getElementById('stopRecording');
  
    startRecordingButton.addEventListener('click', startRecording);
    stopRecordingButton.addEventListener('click', stopRecording);
    

    const sendMessage = document.getElementById('ask');
    const messageBox = document.getElementById("message");
    sendMessage.addEventListener('click', function() {
      ws.send(JSON.stringify({type: "start", "content": messageBox.value}));
      flydownLock = true;
      flyDown = true;
    })

    function called() {
      flyDown = true;
      flydownLock = true;
    }

    function onresult(transcript) {
      messageBox.value = transcript;
      ws.send(JSON.stringify({type: "start", "content": transcript}));
    };

    if (annyang) {
      annyang.addCommands({
        'tilly': called,
        'tilly *tag': onresult
      });
    
      annyang.start();
      annyang.pause();
    }

    function startRecording() {
      // annyang.start();
      annyang.resume();
      // recognition.start();
      startRecordingButton.disabled = true;
      stopRecordingButton.disabled = false;
    }
  
    function stopRecording() {
      // annyang.abort();
      // recognition.stop();
      annyang.pause();
      startRecordingButton.disabled = false;
      stopRecordingButton.disabled = true;
    }
    
    var differential = "";
    var punctuation = [".", "!", "?"];
    var numbers = "0123456789"
    let canDo = true;

    ws.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
  
      switch (data.type) {
        case 'start':
            responseElement.innerText = "";
            talkingCooldown = Infinity;
            flyDown = true;
            flydownLock = true;
            break;
        case 'update':
            const m =  data.content;
            if (numbers.indexOf(m) >= 0 && numbers.indexOf(differential.charAt(differential.length-1)) < 0) {
              differential += " ";
            }
            differential += m;
            for (let i = 0; i < punctuation.length; i++) {
              if (m == punctuation[i]) {
                speechQueue.push(differential)
                differential = "";
              }
            }
            // let normal = true;
            // for (let i = 0; i < punctuation.length; i++) {
            //   let index = data.content.indexOf(punctuation[i]);
            //   if (index >= 0) {
            //     speechQueue.push(differential + data.content.substring(0, index+1));
            //     let rest = data.content.substring(index+1);
            //     differential = rest;
            //     normal = false;
            //     break;
            //   }
            // }
            
            // if (normal) {
            //   differential += data.content;
            // }
            responseElement.innerText += m;
            break;
        case 'end':
            // if (!talking && speechQueue.length === 0) {
            //   speak(responseElement.innerText);
            // }
            break;
        default:
            break;
      }
    });

    utterance.onstart = function() {
      talking = true;
      talkingCooldown = 1000;
    };
    
    utterance.onend = function() {
      talking = false;
      flydownLock = false;
      flying = false;
      // if (speechQueue[0]) {
      //   let sentence = speechQueue[0];
      //   speechQueue.shift();
      //   speak(sentence);
      // }
      // if (speechQueue.length === 0) {
      //   canDo = true;
      // }
    };
  
    window.addEventListener('beforeunload', () => {
      ws.close();
    });
  });
  
