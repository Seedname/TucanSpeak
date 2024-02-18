// Classifier Variable
let classifier;
// Model URL
let imageModelURL = './';

// Video
let video;
let flippedVideo;
// To store the classification
let label = "";

let ws;
// Load the model first
function preload() {
    classifier = ml5.imageClassifier('model.json');
    ws = new WebSocket(`ws://${window.location.host}:80`);
}

let roundStart = false;
let predictorWord = "";
let checked = false;

function clearScreen() {
    background(255);
}

function setup() {
    createCanvas(420*2, 420*2);
    background(255);
    document.getElementById("defaultCanvas0").style.display = "none";
    classifyDrawing();


    ws.onmessage = (event) => {
        const packet = JSON.parse(event.data);
        switch (packet.type) {
            case 'connected':
                ws.send(JSON.stringify({type: "joinGame"}));
                break;
            case "startRound":
                document.getElementById("label").textContent = "Thinking...";
                document.getElementById("defaultCanvas0").style.display = "block";
                document.getElementById("word").textContent = "Draw a " + packet.data;
                startTime = millis();
                background(255);
                predictorWord = packet.data;
                roundStart = true;
                checked = false;
                break;
            case "endRound":
                roundStart = false;
                // document.getElementById("defaultCanvas0").style.display = "none";
                if (packet.data == "tie") {
                    document.getElementById("word").textContent = "Tie Game";
                } else if (packet.data == "you") {
                    document.getElementById("word").textContent = "You Win!";
                } else {
                    document.getElementById("word").textContent = "Opponent Wins!";
                    if (label == predictorWord) {
                        document.getElementById("word").textContent = "You Win!";
                    }
                }
                break;
            case "disconnect":
                location.pathname = "";
                break;
        }
    }
}

var finishedDrawing = false;
var penSize = 15;
var penColor = 0
var startTime = 0;
let tools = ["pen", "eraser"];
let sizes = [15, 30];
let colors = [0, 255];

function draw() {
    if (!checked && millis() - startTime >= 6000) {
        classifyDrawing();
        checked = true;
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

// Get a prediction for the current video frame
function classifyDrawing() {
    setTimeout(() => {
        let img = get();
        img.filter(INVERT);
        classifier.classify(img, gotResult);
    }, 0); // Delay of 0 milliseconds to let the browser update
}

function gotResult(error, results) {
    if (!roundStart) return;
    if (error) {
        console.error(error);
        return;
    }
    // The results are in an array ordered by confidence.
    console.log(results[0]);
    if (results[0].confidence > 0.97) {
        label = results[0].label;
        document.getElementById('label').textContent = "It looks like \"" + label + '"';
        if (label == predictorWord) {
            ws.send(JSON.stringify({type: "answer"}));
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

