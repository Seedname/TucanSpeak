var talking = false;
var talkingCooldown = 0;
var flyDown = false;
var flydownLock = false;
const utterance = new SpeechSynthesisUtterance();
var speechQueue = [];
var recording = false;

let voice = window.speechSynthesis.getVoices()[0];

function getCookies() {
  let resp = false;
  $.ajax({
      type: 'POST',
      url: '/get-cookie', 
      contentType: 'application/json',
      async: false,
      success: function(response) {
          resp = response;;
      },
      error: function(xhr, status, error) {
          console.error(xhr);
      }
  });
  return resp;
}

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

let cookies;

function micRecord() {
  if (!recording) {
    annyang.resume();
    recording = true;
    document.getElementById('mic-button').src = "./microphone.png";
  } else if (recording) {
    annyang.pause();
    recording = false;
    document.getElementById('mic-button').src = "./microphone-slash.png";
  }
}



document.addEventListener('DOMContentLoaded', () => {
    cookies = getCookies();
    speak("");
    document.getElementById('startRecording').addEventListener('click', micRecord);
    
    const responseElement = document.getElementById('response');
    
    if (location.protocol == 'https:') {
      ws = new WebSocket(`wss://${window.location.host}:443`);
    } else {
        ws = new WebSocket(`ws://${window.location.host}:80`);
    }    

    const sendMessage = document.getElementById('ask');
    const messageBox = document.getElementById("message");
    sendMessage.addEventListener('click', function() {
      ws.send(JSON.stringify({type: "start", 
                              "content": messageBox.value, 
                              "username": cookies['username'],
                              "password": cookies['password']
                            }));
      flydownLock = true;
      flyDown = true;
    })

    if (annyang) {
      annyang.init({
        'en-US': {
          'tilly': function() {
            flyDown = true;
            flydownLock = true;
          },
          'tilly *tag': function(transcript) {
            messageBox.value = transcript;
            flydownLock = true;
            flyDown = true;
            ws.send(JSON.stringify({type: "start", 
              "content": messageBox.value, 
              "username": cookies['username'],
              "password": cookies['password']
            }));
          }
        },
        'es-US': {
          'tilly': function() {
            flyDown = true;
            flydownLock = true;
          },
          'tilly *tag': function(transcript) {
            messageBox.value = transcript;
            flydownLock = true;
            flyDown = true;
            ws.send(JSON.stringify({type: "start", 
              "content": messageBox.value, 
              "username": cookies['username'],
              "password": cookies['password']
            }));
          }
        }
      });
    
      annyang.start();
      annyang.pause();
    }

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
            let message =  data.content;
            if (isNumeric(m) && !isNumeric(message.charAt(message.length-1))) {
              message = " " + message;
            }
            responseElement.innerText += message;
            break;
        case 'end':
            speak(responseElement.innerText);
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
    };
  
    window.addEventListener('beforeunload', () => {
      ws.close();
      talkingCooldown = 1000;
    });
  });
  
