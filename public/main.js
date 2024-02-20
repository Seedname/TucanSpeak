var talking = false;
var talkingCooldown = 0;
var flyDown = false;
var flydownLock = false;
const utterance = new SpeechSynthesisUtterance();
const useHTTPS = false;
var speechQueue = [];

let voice = window.speechSynthesis.getVoices()[0];

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.volume = 1;
  utterance.rate = 1.8;
  utterance.pitch = 1;
  utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
  let r = setInterval(() => {
    console.log(window.speechSynthesis.speaking);
    if (!window.speechSynthesis.speaking) {
      clearInterval(r);
    } else {
      window.speechSynthesis.resume();
    }
  }, 14000);
}

function isNumeric(str) {
  if (typeof str != "string") return false 
  return !isNaN(str) && !isNaN(parseInt(str, 10))
}

var ws;
var startTime = 0;
var startTimer = false;
function startRound() {
  ws.send(JSON.stringify({type: 'startRound'}));
  startTimer = true;
  startTime = millis();
}

document.addEventListener('DOMContentLoaded', () => {

    speak("");

    const responseElement = document.getElementById('response');
    const outputDiv = document.getElementById('output');
    
    if (useHTTPS) {
      ws = new WebSocket(`wss://${window.location.host}:443`);
    } else {
      ws = new WebSocket(`ws://${window.location.host}:80`);
    }
  
    // const startRecordingButton = document.getElementById('startRecording');
    // const stopRecordingButton = document.getElementById('stopRecording');
  
    // startRecordingButton.addEventListener('click', startRecording);
    // stopRecordingButton.addEventListener('click', stopRecording);
    

    const sendMessage = document.getElementById('ask');
    const messageBox = document.getElementById("message");
    sendMessage.addEventListener('click', function() {
      ws.send(JSON.stringify({type: "start", "content": messageBox.value}));
      // flydownLock = true;
      // flyDown = true;
    })

    // document.getElementById("hostGame").addEventListener('click', function() {
    //   ws.send(JSON.stringify({type: "hostGame"}));
    //   document.getElementById("hostGame").style.display = "none";
    //   document.getElementById("joinGame").style.display = "none";
    //   document.getElementById("startRound").style.display = "block";
    // });

    // if (annyang) {
    //   annyang.addCommands({
    //     'toucan': function() {
    //       flyDown = true;
    //       flydownLock = true;
    //     },
    //     'toucan *tag': function(transcript) {
    //       messageBox.value = transcript;
    //       ws.send(JSON.stringify({type: "start", "content": transcript}));
    //     }
    //   });
    
    //   annyang.start();
    //   annyang.pause();
    // }

    // function startRecording() {
    //   // annyang.start();
    //   annyang.resume();
    //   // recognition.start();
    //   startRecordingButton.disabled = true;
    //   stopRecordingButton.disabled = false;
    // }
  
    // function stopRecording() {
    //   // annyang.abort();
    //   // recognition.stop();
    //   annyang.pause();
    //   startRecordingButton.disabled = false;
    //   stopRecordingButton.disabled = true;
    // }
    
    var differential = "";
    var punctuation = [".", "!", "?"];
    var numbers = "0123456789"
    let switched = false;

    ws.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
  
      switch (data.type) {
        case 'start':
            responseElement.innerText = "";
            talkingCooldown = Infinity;
            // flyDown = true;
            // flydownLock = true;
            switched = false;
            break;
        case 'update':
            let m =  data.content;
            // if (m == undefined) {break;}
            // console.log(numbers.indexOf(m), numbers.indexOf(differential.charAt(differential.length-1)) );
            if (isNumeric(m) && !isNumeric(differential.charAt(differential.length-1))) {
              m = " " + m;
            }
            // if (numbers.indexOf(m) >= 0 && numbers.indexOf(differential.charAt(differential.length-1)) < 0) {
            //   m = " " + m;
            //   console.log(true);
            // }
            // differential += m;
            // for (let i = 0; i < punctuation.length; i++) {
            //   if (m == punctuation[i]) {
            //     if (speechQueue.length === 0 && !talking) {
            //       speak(differential);
            //     } else {
            //       speechQueue.push(differential);
            //     }
            //     differential = "";
            //     switched = true;
            //     break;
            //   }
            // }
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
            // speechQueue = responseElement.innerText.split(".");
            // console.log(speechQueue);
            // let sentence1 = String(speechQueue[0]);
            // speechQueue.shift();
            speak(responseElement.innerText);
            // console.log(speechQueue);
            // if (!switched) {
            //   speechQueue.push(differential);
            //   differential = "";
            // }
            // if (!talking && speechQueue.length === 0) {
            //   speak(responseElement.innerText);
            // }
            break;
        case 'startRound':
          if (!talking) {
            responseElement.textContent = data.data;
            speak(data.data);
          }
          break;
        case 'endRound':
          startTimer = false;
          if (!talking) {
            responseElement.textContent = data.data;
            speak(data.data);
          }
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
      if (!flyDown) {
        messageBox.value = "";
      }
      talking = false;
      flydownLock = false;
      flying = false;

      // if (speechQueue[0]) {
      //   let sentence = String(speechQueue[0]);
      //   if (!sentence) {
      //     speechQueue = [];
      //   } else {
      //     speechQueue.shift();
      //     speak(sentence);
      //     console.log(sentence);
      //   }
      // }
      // if (speechQueue.length === 0) {
      //   canDo = true;
      // }
    };
  
    window.addEventListener('beforeunload', () => {
      ws.close();
      talkingCooldown = 1000;
    });
  });
  
