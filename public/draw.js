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

let classifier;
let imageModelURL = './';

let video;
let flippedVideo;
let label = "";

let ws;

function preload() {
    classifier = ml5.imageClassifier('/model.json');

    if (location.protocol == 'https:') {
        ws = new WebSocket(`wss://${window.location.host}:443`);
    } else {
        ws = new WebSocket(`ws://${window.location.host}:80`);
    }
}

let roundStart = false;
let predictorWord = "";
let sayText = "";
let checked = false;

function clearScreen() {
    background(255);
    noStroke();
    fill(0);
    rect(0,0,width,50);
    rect(0,height-50,width,50);
}

let labels = ["Bucket", "Computer", "Door", "Eye", "Light Bulb", "Mountain", "Scissors", "Rainbow", "Sun", "Tree"];
let bucket = ["Bucket", "Computer", "Door", "Eye", "Light Bulb", "Mountain", "Scissors", "Rainbow", "Sun", "Tree"];
let spanish = ["Balde", "Computadora", "Puerta", "Ojo", "Bombilla", "Montaña", "Tijeras", "Arcoíris", "Sol", "Árbol"];

function pickLabel() {
    let index = Math.floor(Math.random() * bucket.length);
    let label = bucket.splice(index, 1).join("");
    if (bucket.length == 0) {
      bucket = JSON.parse(JSON.stringify(labels));
    }
    return label;
}
  
function startRound() {
    if (sayText != predictorWord && (millis() - startTime) < 25000) {
        return;
    }
    let word = pickLabel();
    document.getElementById("defaultCanvas0").style.display = "block";
    sayText = "";
    startTime = millis();
    clearScreen();
    predictorWord = word;
    roundStart = true;
    checked = false;
}

let language;

function endRound() {
    fill(0, 0, 0, 128);
    noStroke();
    rect (-5, -5, width+5, height+5);
    fill(0);

    textAlign(CENTER, CENTER);
    textSize(40);
    if (label == predictorWord) {
        fill(0, 255, 0);
        text("Correct!\nPalabra: " + spanish[labels.indexOf(predictorWord)], width/2, height/2);
        ws.send(JSON.stringify({type: "drawWin"}));
    } else {
        fill(255, 0, 0);
        text("Time's Up!\nPalabra: " + spanish[labels.indexOf(predictorWord)], width/2, height/2);
    }
    label = "";
    roundStart = false;
}

function setup() {
    createCanvas(400, 500);
    clearScreen();
    document.getElementById("defaultCanvas0").style.display = "none";
    classifyDrawing();
    language = getCookie('language');
    if (language == "Spanish") {
        document.querySelectorAll(".menu").item(0).outerHTML = '\
					<div class="menu"> \
						<button class="menu-button">Menú</button> \
						<ul class="menu-items"><li><a href="/">Página Principal</a></li> \
						<li><a href="/flight">Tucan Volar</a></li> \
						<li><a href="/draw">Tucan Dibujar</a></li> \
						<li><a href="/speak">Tucan Hablar</a></li> \
						<li><a href="/write">Tucan Traducir</a></li> \
						<li><a href="javascript:void(0);" onclick="return changeLanguage()">Change Language</a></li> \
						<li><a href="javascript:void(0);" onclick="return signOut()">Desconectar</a></li></ul> \
					</div>';
        document.getElementById("startRound").textContent = "Empezar la Ronda";
        document.getElementById("clearButton").textContent = "Borrar";
    }
}

var finishedDrawing = false;
var penSize = 12;
var penColor = 0
var startTime = 0;
let tools = ["pen", "eraser"];
let sizes = [12, 24];
let colors = [0, 255];

function draw() {
    if (!checked && millis() - startTime >= 6000) {
        classifyDrawing();
        checked = true;
    }

    if (roundStart && millis() - startTime >= 25000) {
        endRound();
    }

    noStroke();
    fill(0);
    rect(0, 0, width, 50);
    rect(0, height-50, width, 50);
    fill(255);
    textAlign(LEFT, TOP);
    textSize(25);
    if (language == "Spanish") {
        text("Dibujar: '" + predictorWord + "'", 10, 10);
    } else {
        text("Draw: '" + predictorWord + "'", 10, 10);
    }
    textAlign(CENTER, BOTTOM);
    if (sayText) {
        if (language == "Spanish") {
            text("Parece Como: '" + sayText + "'", width/2, height-10);
        } else {
            text("Looks Like: '" + sayText + "'", width/2, height-10);
        }
    }

    textAlign(RIGHT, TOP);
    if (roundStart) {
        if (language == "Spanish") {
            text("Time: " + (25-floor((millis() - startTime)/1000)), width-10, 10);
        } else {
            text("Tiempo: " + (25-floor((millis() - startTime)/1000)), width-10, 10);
        }
    }
}

function toolClick(buttonNumber) {
    const buttons = document.querySelectorAll('#button-container > button');
    
    for (let i = 0; i < buttons.length; i++) {
        if (i === buttonNumber) {
            buttons[i].classList.add('selected');
        } else {
            buttons[i].classList.remove('selected');
        }
    }
    
    tool = tools[buttonNumber];
    penSize = sizes[buttonNumber];
    penColor = colors[buttonNumber];
}

function classifyDrawing() {
    setTimeout(() => {
        let img = get(0,50,400,400);
        img.filter(INVERT);
        classifier.classify(img, gotResult);
    }, 0); 
}

function gotResult(error, results) {
    if (!roundStart) return;
    if (error) {
        console.error(error);
        return;
    }

    if (results[0].confidence > 0.97) {
        label = results[0].label;
        sayText = label;
        if (label == predictorWord) {
            endRound();
        }
    }
}

function offScreen() {
    return mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height;
}

var endX;
var endY;

function mousePressed() {
    if (!roundStart) return;
    fill(penColor);

    noStroke();
    ellipse(mouseX, mouseY, penSize, penSize);
    
    endX = mouseX;
    endY = mouseY;
}

function mouseDragged() {
    if (!roundStart) return;
    stroke(penColor);
    strokeWeight(penSize);
    line(endX, endY, mouseX, mouseY);
    endX = mouseX;
    endY = mouseY;
}

function mouseReleased() {
    if (!roundStart) return;
    endX = mouseX;
    endY = mouseY;
    
    if (checked) {
        classifyDrawing();
    }
}

