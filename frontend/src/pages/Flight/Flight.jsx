import React, { useEffect, useRef, useContext } from 'react';
import axios from "axios";
import p5 from 'p5';
import { AppContext } from "../../context/AppContext";

const ToucanGame = () => {
  const gameRef = useRef(null);
  const p5Instance = useRef(null);
  const { url } = useContext(AppContext);

  useEffect(() => {
    // Create new p5 instance
    const sketch = (p) => {
      let bird;   
      let pipes = [];
      let timer;
      let score = 0;
      let backgroundImage;
      let backgroundOffset = 0;
      let toucan;
      let randomNums, randomIndex, guessedIndex;
      let textScale;
      let startCountdown = false;
      let startTime;

      class Toucan {
        constructor(parts, offsets, angles, scales, origins) {
            this.parts = parts;
            this.offsets = offsets;
            this.originals = [...angles];
            this.angles = angles;
            this.scales = scales;
            this.origins = origins;
    
            this.moving = false;
            this.direction = -1;
            this.turnAngle = 180;
            this.angle = 0;
            this.scaleAngles = [...angles]
        }
    
        turn(vel) {
            let dir = vel.x;
    
            if (dir >= 0 && this.turnAngle < 180 && this.direction == -1) {
                this.turnAngle += 10;
            } else if (dir >= 0 && this.turnAngle >= 180 && this.direction == -1) {
                this.direction = 1;
                this.turnAngle = 180;
            }
            
            if (dir < 0 && this.turnAngle > 0 && this.direction == 1) {
                this.turnAngle -= 10;
            } else if (dir < 0 && this.turnAngle <= 0 && this.direction == 1) {
                this.direction = -1;
                this.turnAngle = 0;
            }
        }
    
        oscillate(part, amplitude, frequency, type, offset) {
            if (amplitude ==  undefined) {
                this.angle = part;
            } else {
                switch (type) {
                    case 0:
                        this.angles[part] = amplitude * p.sin(frequency * p.frameCount) + this.originals[part];
                        break;
                    case 1:
                        this.scaleAngles[part] = amplitude * p.sin(frequency * p.frameCount) + offset
                        break;
                }
            }
        }
    
        reset() {
            this.angles = [...this.originals];
            this.scaleAngles = [...this.originals];
            this.turnAngle = 180;
        }
    
        display() {
            p.push();  
                p.scale(p.cos(p.radians(this.turnAngle)), 1);
                p.rotate(this.angle);
    
                for (let i = 0; i < this.parts.length; i++) {
                    p.push();
                        let s = this.scales[i];
                        p.translate(this.offsets[i][0]+s*this.parts[i].width/2 , this.offsets[i][1]+s*this.parts[i].height/2 );
                        p.rotate(p.radians(this.angles[i]));
                        p.scale(1, p.cos(this.scaleAngles[i]));
    
                        p.image(this.parts[i], -s*this.parts[i].width/2 * this.origins[i][0], -s*this.parts[i].height/2 * this.origins[i][1], this.parts[i].width * s, this.parts[i].height * s);
                    p.pop();
                }
            p.pop();
        }
      }
    
      var mode = "title";
      class Bird {
          constructor(x, y, size, toucan) {
              this.x = x;
              this.y = y;
              this.size = size;
      
              this.vel = 0;
              this.acc = 1;
      
              this.dead = false;
              this.toucan = toucan;
          }
      
          display() {
              if (!this.dead) {
                  this.toucan.oscillate(2, 10, -0.2, 0);
                  this.toucan.oscillate(0, 0.7, 0.2, 1, 20);
                  this.toucan.oscillate(7, 0.7, 0.2, 1, 20);
                  this.toucan.oscillate(0.2 * p.sin(p.frameCount * 0.2) - p.radians(30));
              }
              p.push();
                  p.translate(this.x, this.y);
                  p.scale(0.5);
                  p.translate(120, 0);
                  this.toucan.display();
              p.pop();
          }
      
          update() {
              this.vel += this.acc;
              this.y += this.vel;
      
              if (this.y >= p.height - this.size / 2) {
                  this.y = p.height - this.size / 2;
                  this.vel = 3;
                  this.dead = true;
              }
      
              if (this.y <= this.size / 2) {
                  this.y = this.size / 2;
                  this.vel = 3;
                  this.dead = true;
              }
          }
      
          flap() {
              this.vel = -15;
          }
      }
      
      class Pipe {
          constructor(x, yGap, gapSize) {
              this.x = x;
              this.yGap = yGap;
              this.gapSize = gapSize;
              this.width = 100;
          }
      
          update() {
              this.x -= 5;
          }
      
          collide(player) {
              let radius = player.size/2;
              if (player.x+radius >= this.x && player.x-radius <= this.x+this.width && 
                  (player.y+radius >= p.height-this.yGap+this.gapSize/2 || player.y-radius <= p.height-this.yGap-this.gapSize/2)) {
                      player.dead = true;
                      player.vel = 3;
                      return true;
              }
              return false;
          }
      
          display(score, player) {
              p.noStroke();
      
              p.fill(87, 62, 24);
              p.rect(this.x - 10, p.height-this.yGap+this.gapSize/2, this.width, this.yGap, 10);
              p.rect (this.x - 10, -10, this.width, p.height-this.yGap-this.gapSize/2+10, 10);        
              
              p.fill(128, 83, 23);
              p.rect(this.x + 10, p.height-this.yGap+this.gapSize/2, this.width, this.yGap, 10);
              p.rect (this.x + 10, -10, this.width, p.height-this.yGap-this.gapSize/2+10, 10);
      
              p.fill(176, 123, 55);
              p.rect(this.x + this.width/2, p.height-this.yGap+this.gapSize/2, 25, 60, 10);
              p.rect(this.x + this.width/2, p.height-this.yGap-this.gapSize/2-40, 25, 40, 10);
      
              p.textAlign(p.CENTER, p.BOTTOM);
              p.textSize(40);
              p.fill(255, 255, 255);
              p.text(score, this.x + this.width/2, p.height-this.yGap);
              
              if (!player.dead) {
                  p.textSize(25);
                  p.textAlign(p.CENTER, p.TOP);
                  p.text(numberToWords(score), this.x + this.width/2, p.height-this.yGap);
                  p.fill(255, 255, 255);
              }
          }
      }

      function numberToWords(num) {
        const onesWords = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
                          'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
        const tensWords = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
        const bigWords = ['', 'thousand', 'million', 'billion'];

        function convertChunk(n) {
          let chunk = '';
          if (n >= 100) {
            chunk += onesWords[Math.floor(n / 100)] + ' hundred ';
            n %= 100;
          }
          if (n >= 20) {
            chunk += tensWords[Math.floor(n / 10)] + ' ';
            n %= 10;
          }
          if (n > 0) {
            chunk += onesWords[n] + ' ';
          }
          return chunk;
        }

        if (num === 0) return onesWords[0];

        const chunks = [];
        while (num) {
          chunks.push(num % 1000);
          num = Math.floor(num / 1000);
        }

        let words = '';
        for (let i = chunks.length - 1; i >= 0; i--) {
          if (chunks[i]) {
            words += convertChunk(chunks[i]) + bigWords[i] + ' ';
          }
        }
        return words.trim();
      }
      var titleOpacity = 255;

      function drawBackground(x) {
        p.background(66, 52, 0);
        for(let i = 0; i < 10; i++){
          p.fill(85, 55, 14);
          p.rect((i * 600/10) + x, 0, 600/10.5, p.height);
        }
        p.noStroke();
        p.fill(0, 143, 36);
        p.ellipse(100 + x, p.height, 300, 270);
        p.ellipse(400 + x, p.height-14, 500, 290);
        p.fill(17, 194, 17);
        
        p.ellipse(400 + x, p.height-30, 430, 180);
        p.ellipse(80 + x, p.height+5, 300, 160);
        p.fill(7, 97, 29);
        p.ellipse(0 + x, 0, 300, 200);
        p.ellipse(200 + x, 70, 300, 200);
        p.ellipse(400 + x, 30, 300, 200);
        p.ellipse(600 + x, 0, 300, 200);
        p.fill(17, 194, 17);
        p.ellipse(0 + x, 0, 200, 150);
        p.ellipse(200 + x, 40, 300, 150);
        p.ellipse(400 + x, 0, 300, 200);
        p.ellipse(600 + x, 0, 200, 150);
        p.fill(96, 232, 96);
        p.ellipse(0 + x, 0, 200, 110);
        p.ellipse(200 + x, 30, 300, 100);
        p.ellipse(400 + x, 0, 300, 120);
        p.ellipse(600 + x, 0, 200, 110);
      }

      function generateNumber(maxNumber, currentNumber) {
        let num = p.floor(p.random(maxNumber));
        while (num === currentNumber) {
          num = p.floor(p.random(maxNumber));
        }
        return num;
      }

      function titleScreen() {
        p.fill(0, 0, 0, 255);
        p.rect(p.width/4 + 10, p.height/3+10, p.width/2, p.height/3, 20);
        p.fill(255);
        p.rect(p.width/4, p.height/3, p.width/2, p.height/3, 20);

        p.textFont('Arial');
        p.fill(0);
        p.textSize(45 * textScale);
        p.textAlign(p.CENTER, p.CENTER);
        p.text("Welcome to Tucan Fly. Press the screen or tap the space bar to fly.", 
               p.width/2 - p.width/5, p.height/2.5 - 100, p.width/2.5, 300);

        p.fill(65, 143, 4);
        if (insideRect(p.width/3, 3*p.height/5-p.height/18, p.width/3, p.height/9)) {
          p.fill(35, 113, 0);
        }
        p.rect(p.width/3, 3*p.height/5-p.height/18, p.width/3, p.height/9, 20);

        p.fill(255);
        p.textSize(60 * textScale);
        p.text("Play Now", p.width/2, 3*p.height/5);
      }

      function insideRect(x, y, w, h) {
        return p.mouseX >= x && p.mouseX <= x+w && p.mouseY >= y && p.mouseY <= y+h;
      }

      function loseScreen(){
        p.fill(0, 0, 0, titleOpacity);
        p.rect(p.width/4 + 10, p.height/3+10, p.width/2, p.height/3, 20);
        p.fill(255, 255, 255, titleOpacity);
        p.rect(p.width/4,p.height/3,p.width/2,p.height/3,20);
    
        p.textFont("Arial");
    
        p.fill(0, titleOpacity)
        p.textSize(30 * textScale);
        p.textAlign(p.CENTER, p.CENTER);
        // if (language == "Spanish") {
        //     text("Tu puntuación fue " + score + " \n¿Cómo se dice tu puntuación en inglés?", p.width/3.3, p.height/2.5-50, p.width/2.5, 100);
        // } else {
            p.text("Your score was " + score + " \nHow do you say your score in English?", p.width/3.3, p.height/2.5-50, p.width/2.5, 100);
        // }
        p.fill(65, 143, 4, titleOpacity);
        if (insideRect(p.width/2.7-p.width/10, 2.7*p.height/5-p.height/36, p.width/5, p.height/18)) p.fill(65-20, 143-20, 0, titleOpacity);
        p.rect(p.width/2.7-p.width/10, 2.7*p.height/5-p.height/36, p.width/5, p.height/18, 20);
    
        p.fill(65, 143, 4, titleOpacity);
        if (insideRect(1.7*p.width/2.7-p.width/10, 2.7*p.height/5-p.height/36, p.width/5, p.height/18)) p.fill(65-20, 143-20, 0, titleOpacity);
        p.rect(1.7*p.width/2.7-p.width/10, 2.7*p.height/5-p.height/36, p.width/5, p.height/18, 20);
    
        p.fill(65, 143, 4, titleOpacity);
        if (insideRect(p.width/2.7-p.width/10, 3.1*p.height/5-p.height/36, p.width/5, p.height/18)) p.fill(65-20, 143-20, 0, titleOpacity);
        p.rect(p.width/2.7-p.width/10, 3.1*p.height/5-p.height/36, p.width/5, p.height/18, 20);   
        
        p.fill(65, 143, 4, titleOpacity);
        if (insideRect(1.7*p.width/2.7-p.width/10, 3.1*p.height/5-p.height/36, p.width/5, p.height/18)) p.fill(65-20, 143-20, 0, titleOpacity);
        p.rect(1.7*p.width/2.7-p.width/10, 3.1*p.height/5-p.height/36, p.width/5, p.height/18, 20);
    
    
        p.fill(255, 255, 255,titleOpacity);
    
        p.textSize(25 * textScale);
    
        p.text(numberToWords(randomNums[0]), p.width/2.7, 2.7*p.height/5);
        p.text(numberToWords(randomNums[1]), 1.7*p.width/2.7, 2.7*p.height/5);
        p.text(numberToWords(randomNums[2]), 1.7*p.width/2.7, 3.1*p.height/5);
        p.text(numberToWords(randomNums[3]), p.width/2.7, 3.1*p.height/5);
    };

    function retryScreen() {
      p.fill(0, 0, 0, titleOpacity);
      p.rect(p.width/4 + 10, p.height/3+10, p.width/2, p.height/3+p.height/9, 20);
      p.fill(255, 255, 255, titleOpacity);
      p.rect(p.width/4,p.height/3,p.width/2,p.height/3+p.height/9,20);
  
      p.textFont("Arial");
  
      p.fill(0, titleOpacity)
      p.textSize(30 * textScale);
      p.textAlign(p.CENTER, p.CENTER);
  
      if (guessedIndex != randomIndex) {
          // if (language == "Spanish") {
              // text("Tu respuesta fue '" + randomNums[guessedIndex] + "'. La respuesta correcta fue '" + randomNums[randomIndex] + "'.", p.width/3.3, p.height/2.5-50, p.width/2.5, 100);
          // } else {
              p.text("Your answer was '" + randomNums[guessedIndex] + "'. The correct answer was '" + randomNums[randomIndex] + "'.", p.width/3.3, p.height/2.5-50, p.width/2.5, 100);
          // }
      } else {
          // if (language == "Spanish") {
              // text(`¡Correcto!\n+${Math.floor(Math.log2(randomNums[randomIndex]+1))}XP`, p.width/3.3, p.height/2.5-50, p.width/2.5, 100);
          // } else {
              p.text(`Correct!\n+4XP`, p.width/3.3, p.height/2.5-50, p.width/2.5, 100);
          // }
      }
  
      p.fill(45, 123, 0, titleOpacity);
      if (guessedIndex === 0) p.fill(200, 0, 0, titleOpacity);
      if (randomIndex === 0) p.fill(0, 220, 0, titleOpacity);
      p.rect(p.width/2.7-p.width/10, 2.7*p.height/5-p.height/36, p.width/5, p.height/18, 20);
  
      p.fill(45, 123, 0, titleOpacity);
      if (guessedIndex === 1) p.fill(200, 0, 0, titleOpacity);
      if (randomIndex === 1) p.fill(0, 220, 0, titleOpacity);
      p.rect(1.7*p.width/2.7-p.width/10, 2.7*p.height/5-p.height/36, p.width/5, p.height/18, 20);
  
      p.fill(45, 123, 0, titleOpacity);
      if (guessedIndex === 2) p.fill(200, 0, 0, titleOpacity);
      if (randomIndex === 2) p.fill(0, 220, 0, titleOpacity);
      p.rect(1.7*p.width/2.7-p.width/10, 3.1*p.height/5-p.height/36, p.width/5, p.height/18, 20);
  
      p.fill(45, 123, 0, titleOpacity);
      if (guessedIndex === 3) p.fill(200, 0, 0, titleOpacity);
      if (randomIndex === 3) p.fill(0, 220, 0, titleOpacity);
      p.rect(p.width/2.7-p.width/10, 3.1*p.height/5-p.height/36, p.width/5, p.height/18, 20);   
      
  
      p.fill(255, 255, 255,titleOpacity);
  
      p.textSize(25 * textScale);
  
      p.text(`${numberToWords(randomNums[0])} (${randomNums[0]})`, p.width/2.7, 2.7*p.height/5);
      p.text(`${numberToWords(randomNums[1])} (${randomNums[1]})`, 1.7*p.width/2.7, 2.7*p.height/5);
      p.text(`${numberToWords(randomNums[2])} (${randomNums[2]})`, 1.7*p.width/2.7, 3.1*p.height/5);
      p.text(`${numberToWords(randomNums[3])} (${randomNums[3]})`, p.width/2.7, 3.1*p.height/5);
      
      p.fill(65, 143, 4, titleOpacity);
      if (insideRect(p.width/2-p.width/10, 2*p.height/3+p.height/(18*2), p.width/5, p.height/18)) p.fill(65-20, 143-20, 0, titleOpacity);
      p.rect(p.width/2-p.width/10, 2*p.height/3+p.height/(18*2), p.width/5, p.height/18, 20);
  
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(45 * textScale);
      p.fill(255, 255, 255);
      // if (language == "Spanish") {
          // p.text("Juega de nuevo", p.width/2, 2*p.height/3+p.height/18);
      // } else {
          p.text("Play Again", p.width/2, 2*p.height/3+p.height/18);
      // }
  };

      p.preload = () => {
        // Load toucan images
        const toucanParts = [
          p.loadImage('/toucan/wing_back.png'),
          p.loadImage('/toucan/claw_left.png'),
          p.loadImage('/toucan/tail.png'),
          p.loadImage('/toucan/beak_bottom.png'),
          p.loadImage('/toucan/beak_top.png'),
          p.loadImage('/toucan/body.png'),
          p.loadImage('/toucan/claw_right.png'),
          p.loadImage('/toucan/wing_front.png')
        ];

        toucan = new Toucan(
          toucanParts,
          [[120,-100], [122,145], [110,65], [80,-17], [75,-77], [100,-80], [170,140], [125,-25]],
          [-30, 0, 0, -10, 0, 0, 0, -12],
          [1, 1, 1, 1, 1, 1, 1, 1],
          [[1,-1.25], [1,1], [1,1], [2,1], [2,1], [1,1], [1,1], [1,-0.5]]
        );
      };

      p.setup = () => {
        const canvas = p.createCanvas(window.innerWidth, window.innerHeight);
        canvas.parent(gameRef.current);
        textScale = p.width/2560;
        
        drawBackground(0);
        backgroundImage = p.get(0, 0, 600, p.height);
        p.image(backgroundImage, 1000, 0);

        bird = new Bird(p.width/2, p.height/2, 100, toucan);
        pipes.push(new Pipe(p.width, p.random(p.height/4, 3*p.height/4), 300));
        timer = 0;

        p.mousePressed = () => mousePressed();
        p.keyPressed = () => keyPressed();
        p.windowResized = () => windowResized()
      };

      p.draw = () => {
        p.background(66, 52, 10);
        let startRound = p.millis() - startTime > 3000;

        let offset = (p.frameCount % 600);
        if (bird.dead) {
          offset = 0;
        }

        for (let i = 0; i < p.width+600; i += 600) {
          p.image(backgroundImage, i - offset, 0);
        }

        for (let i = pipes.length-1; i >= 0; i--) {
          if (!bird.dead) {
            if (mode === "game" && startRound) {
              pipes[i].update();
              pipes[i].collide(bird);
            }
          }  
          pipes[i].display(score, bird);
          if (pipes[i].x < -pipes[i].width) {
            pipes.splice(i, 1);
          }

          if(!bird.dead && pipes[i].x + bird.size >= bird.x && pipes[i].x +bird.size <= bird.x+4) {
            score++;
          }
        }

        if (mode === "game" && startRound) {
          timer ++;
          if (timer % 100 ===0) {
            pipes.push(new Pipe(p.width, p.random(p.height/4, 3*p.height/4), 300));
          }
        }

        if ((mode === "game" || mode === "lose") && startRound) {
          bird.update();
        }

        bird.display();

        if (mode === "title") {
          titleScreen();
        } else if (mode === "lose") {
          loseScreen();
        } else if (mode === "retry") {
          retryScreen();
        }

        if (bird.dead && mode !== "lose" && mode !== "retry") {
          mode = "lose";
          randomNums = p.shuffle(
            [
              generateNumber(p.max(100, score), score),
              generateNumber(p.max(100, score), score),
              generateNumber(p.max(100, score), score),
            score])
          randomIndex = randomNums.indexOf(score);
        }

        if (startCountdown) {
          p.fill(0, 50);
          p.rect(-5, -5, p.width+5, p.height+5);
          p.fill(255);
          p.textSize(50*textScale);
          p.text(p.ceil(3-(p.millis() - startTime)/1000), p.width/2, p.height/2);
          if (startRound) { startCountdown = false; }
        }
      }

      function reset() {
        bird = new Bird(p.width/2, p.height/2, 100, toucan);
        pipes = [new Pipe(p.width, p.random(p.height/4, 3*p.height/4), 300)];
        timer = 0;
        score = 0;
      }

      function sendWin() {
        axios.post(`${url}api/quest/handle-correct-answer`, {
          activityType: "flight"
        });
      }

      function mousePressed() {
        if (mode === "title") {
          if (insideRect(p.width/3, 3*p.height/5-p.height/18, p.width/3, p.height/9)) {
            mode = "game";
            startCountdown = true;
            startTime = p.millis();
            return;
          }
        }

        if (mode === "lose") {
          if (insideRect(p.width/2.7-p.width/10, 2.7*p.height/5-p.height/36, p.width/5, p.height/18)) {
              if (randomIndex === 0) {
                sendWin();
              }
              reset();
              mode = "retry";
              guessedIndex = 0;
              return;
          }
  
          if (insideRect(1.7*p.width/2.7-p.width/10, 2.7*p.height/5-p.height/36, p.width/5, p.height/18)) {
              if (randomIndex === 1) {
                sendWin();
              }
              reset();
              mode = "retry";
              guessedIndex = 1;
              return;
          }
  
          if (insideRect(1.7*p.width/2.7-p.width/10, 3.1*p.height/5-p.height/36, p.width/5, p.height/18))  {
              if (randomIndex === 2) {
                sendWin();
              }
              reset();
              mode = "retry";
              guessedIndex = 2;
              return;
          }
  
          if (insideRect(p.width/2.7-p.width/10, 3.1*p.height/5-p.height/36, p.width/5, p.height/18)) {
              if (randomIndex === 3) {
                sendWin();
              }
              reset();
              mode = "retry";
              guessedIndex = 3;
              return;
          }
  
          return;
      }
  
      if (mode === "retry") {
          if (insideRect(p.width/2-p.width/10, 2*p.height/3+p.height/(18*2), p.width/5, p.height/18)) {
              mode = "game";
              startCountdown = true;
              startTime = millis();
              return;
          }
      }
  
      if (mode === "game") {
          if (!bird.dead) {
              bird.flap();
          } else {
              reset();
          }
      }
      }
      function keyPressed() {
        if (mode != "game") return;

        if ((p.keyCode === 32 || p.keyCode === 38) && !bird.dead) {
          bird.flap();
        }
        if (bird.dead) {
          reset();
        }
      }

      function windowResized() {
        p.resizeCanvas(window.innerWidth, window.innerHeight);
        drawBackground(0);
        backgroundImage = p.get(0, 0, 600, p.height);
        p.image(backgroundImage, 1000, 0);
      }
    };

    p5Instance.current = new p5(sketch, gameRef.current);

    return () => {
      if (p5Instance.current) {
        p5Instance.current.remove();
      }
    };
  }, []);

  return <div ref={gameRef} style={{width: '100%', height: '100vh'}}/>
};

export default ToucanGame;