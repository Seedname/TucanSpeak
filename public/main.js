var talking = false;
var talkingCooldown = 0;
var flyDown = false;
var flydownLock = false;
const utterance = new SpeechSynthesisUtterance();
var speechQueue = [];
var recording = true;
var language = "English";

var voice = window.speechSynthesis.getVoices()[0];

function getCookie(name) {
  let cookieArr = document.cookie.split(";");
  for(let i = 0; i < cookieArr.length; i++) {
      let cookiePair = cookieArr[i].split("=");
      if(name == cookiePair[0].trim()) {
          return decodeURIComponent(cookiePair[1]);
      }
  }
  
  return null;
}

function speak(text) {
  const punctuationRegex = /[.,\/#!$%\^&\*;:{}=\-_`~()]/g;
  const segments = text.split(punctuationRegex);

  const speakSegment = (index) => {
    if (index >= segments.length) return; 
    const segment = segments[index].trim();
    if (segment.length === 0) {
      speakSegment(index + 1);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(segment);
    utterance.volume = 1;
    if (!recording) {
      utterance.volume = 0;
    }
    utterance.rate = 1.3;
    utterance.pitch = 1;
    utterance.voice = voice;

    utterance.onend = () => {
      speakSegment(index + 1);
    };

    window.speechSynthesis.speak(utterance);
  };

  // let r = setInterval(() => {
  //   if (!window.speechSynthesis.speaking) {
  //     clearInterval(r);
  //   } else {
  //     window.speechSynthesis.resume();
  //   }
  // }, 1000);

  speakSegment(0); 
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
    recording = true;
    document.getElementById('mic-button').src = "./microphone.png";
  } else if (recording) {
    recording = false;
    document.getElementById('mic-button').src = "./microphone-slash.png";
  }
}

window.speechSynthesis.onvoiceschanged = () =>{ 
  console.log(true);
  voice = window.speechSynthesis.getVoices()[7];
};

document.addEventListener('DOMContentLoaded', () => {
    speak("");
    
    document.getElementById('mic').addEventListener('click', micRecord);
    
    const responseElement = document.getElementById('response');
    
    if (location.protocol == 'https:') {
      ws = new WebSocket(`wss://${window.location.host}:443`);
    } else {
      ws = new WebSocket(`ws://${window.location.host}:80`);
    }    

    const language = getCookie("language");
    const sendMessage = document.getElementById('ask');
    const messageBox = document.getElementById("message");
    sendMessage.addEventListener('click', function() {
      ws.send(JSON.stringify({type: "start", 
                              "content": messageBox.value, 
                              "language": language
                            }));
      flydownLock = true;
      flyDown = true;
    })

    // if (annyang) {
    //   annyang.setLanguage('en-US');

    //   annyang.init({
    //     'en-US': {
    //       'tilly': function() {
    //         flyDown = true;
    //         flydownLock = true;
    //       },
    //       'tilly *tag': function(transcript) {
    //         messageBox.value = transcript;
    //         flydownLock = true;
    //         flyDown = true;
    //         ws.send(JSON.stringify({type: "start", 
    //           "content": messageBox.value, 
    //           "username": cookies['username'],
    //           "password": cookies['password']
    //         }));
    //       }
    //     },
    //     'es-US': {
    //       'tilly': function() {
    //         flyDown = true;
    //         flydownLock = true;
    //       },
    //       'tilly *tag': function(transcript) {
    //         messageBox.value = transcript;
    //         flydownLock = true;
    //         flyDown = true;
    //         ws.send(JSON.stringify({type: "start", 
    //           "content": messageBox.value, 
    //           "username": cookies['username'],
    //           "password": cookies['password']
    //         }));
    //       }
    //     }
    //   });
    
    //   annyang.start();
    //   annyang.pause();
    // }

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
            if (isNumeric(message)) {
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
  
