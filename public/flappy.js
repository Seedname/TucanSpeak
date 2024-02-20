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
                    this.angles[part] = amplitude * sin(frequency * frameCount) + this.originals[part];
                    break;
                case 1:
                    this.scaleAngles[part] = amplitude * sin(frequency * frameCount) + offset
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
        push();  
            scale(cos(radians(this.turnAngle)), 1);
            rotate(this.angle);

            for (let i = 0; i < this.parts.length; i++) {
                push();
                    let s = this.scales[i];
                    translate(this.offsets[i][0]+s*this.parts[i].width/2 , this.offsets[i][1]+s*this.parts[i].height/2 );
                    rotate(radians(this.angles[i]));
                    scale(1, cos(this.scaleAngles[i]));

                    image(this.parts[i], -s*this.parts[i].width/2 * this.origins[i][0], -s*this.parts[i].height/2 * this.origins[i][1], this.parts[i].width * s, this.parts[i].height * s);
                pop();
            }
        pop();
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
            this.toucan.oscillate(0.2 * sin(frameCount * 0.2) - radians(30));
        }
        push();
            translate(this.x, this.y);
            scale(0.5);
            translate(120, 0);
            this.toucan.display();
        pop();
    }

    update() {
        this.vel += this.acc;
        this.y += this.vel;

        if (this.y >= height - this.size / 2) {
            this.y = height - this.size / 2;
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
            (player.y+radius >= height-this.yGap+this.gapSize/2 || player.y-radius <= height-this.yGap-this.gapSize/2)) {
                player.dead = true;
                player.vel = 3;
                return true;
        }
        return false;
    }

    display(score, player) {
        noStroke();

        fill(87, 62, 24);
        rect(this.x - 10, height-this.yGap+this.gapSize/2, this.width, this.yGap, 10);
        rect (this.x - 10, -10, this.width, height-this.yGap-this.gapSize/2+10, 10);        
        
        fill(128, 83, 23);
        rect(this.x + 10, height-this.yGap+this.gapSize/2, this.width, this.yGap, 10);
        rect (this.x + 10, -10, this.width, height-this.yGap-this.gapSize/2+10, 10);

        fill(176, 123, 55);
        rect(this.x + this.width/2, height-this.yGap+this.gapSize/2, 25, 60, 10);
        rect(this.x + this.width/2, height-this.yGap-this.gapSize/2-40, 25, 40, 10);

        textAlign(CENTER, BOTTOM);
        textSize(40);
        fill(255, 255, 255);
        text(score, this.x + this.width/2, height-this.yGap);
        
        if (!player.dead) {
            textSize(25);
            textAlign(CENTER, TOP);
            text(numberToWords(score), this.x + this.width/2, height-this.yGap);
            fill(255, 255, 255);
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

    if (num === 0) {
        return onesWords[0];
    }

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

function shuffle(array) {
    let currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle.
    while (currentIndex > 0) {
  
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
}

var bird;   
var pipes = [];
var timer;
var score = 0;
var backgroundImage;
var backgroundOffset = 0;
var toucan; 
var randomNums, randomIndex, guessedIndex;

function drawBackground(x) {
    background(66, 52, 10);
    for(var i = 0; i < 10; i++){
        fill(105, 75, 34);
        rect((i * 600/10) + x, 0, 600/10.5,height);
    }
    noStroke();
    fill(0, 143, 36);
    ellipse(100 + x,height,300,270);
    ellipse(400 + x,height-14,500,290);
    fill(17, 194, 17);
    
    ellipse(400 + x, height-30, 430,180);
    ellipse(80 + x, height+5, 300,160);
    fill(7, 97, 29);
    ellipse(0 + x,0,300,200);
    ellipse(200 + x,70,300,200);
    ellipse(400 + x,30,300,200);
    ellipse(600 + x,0,300,200);
    fill(17, 194, 17);
    ellipse(0 + x,0,200,150);
    ellipse(200 + x,40,300,150);
    ellipse(400 + x,0,300,200);
    ellipse(600 + x,0,200,150);
    fill(96, 232, 96);
    ellipse(0 + x,0,200,110);
    ellipse(200 + x,30,300,100);
    ellipse(400 + x,0,300,120);
    ellipse(600 + x,0,200,110);

    fill(250, 250, 250);
}

function insideRect(x, y, w, h) {
    return mouseX >= x && mouseX <= x+w && mouseY >= y && mouseY <= y+h;
}

function setup() {
    canvas = createCanvas(window.innerWidth,window.innerHeight);
    canvas.position(0, 0);
    canvas.class("p5canvas");

    drawBackground(0);
    backgroundImage = get(0,0,600,height);
    image(backgroundImage,1000,0);

    const toucanBody = loadImage('toucan/body.png');
    const toucanTail = loadImage('toucan/tail.png');
    const frontWing = loadImage('toucan/wing_front.png');
    const backWing = loadImage('toucan/wing_back.png');
    const bottomBeak = loadImage('toucan/beak_bottom.png');
    const topBeak = loadImage('toucan/beak_top.png');
    const leftClaw = loadImage('toucan/claw_left.png');
    const rightClaw = loadImage('toucan/claw_right.png');

    toucan = new Toucan(
        [backWing,   leftClaw, toucanTail, bottomBeak, topBeak,   toucanBody,   rightClaw, frontWing],   // images
        [[120,-100], [122,145], [110,65],   [80,-17], [75 ,-77],  [100,-80],    [170,140],  [125,-25]],  // position offsets
        [-30,        0,         0,          -10,      0,          0,            0,          -12],        // angle offsets
        [1,          1,         1,          1,        1,          1,            1,          1],          // scale offsets
        [[1,-1.25],  [1,1],     [1,1],      [2,1],    [2,1],      [1,1],        [1,1],      [1,-0.5]]    // origin locations
    );

    bird = new Bird(width/2, height/2, 100, toucan);
    pipes.push(new Pipe(width, random(height/4, 3*height/4), 300));
    timer = 0;
}

var titleOpacity = 255;

function titleScreen(){
    fill(0, 0, 0,titleOpacity);
    rect(width/4 + 10, height/3+10, width/2, height/3, 20);
    fill(255, 255, 255,titleOpacity);
    rect(width/4, height/3, width/2, height/3, 20);

    textFont("Arial");
    fill(0, titleOpacity);

    textSize(45);
    textAlign(CENTER, CENTER);
    text("Bienvenidos a Tucán Volar. Haz clic o presiona la barra espaciadora para comenzar a volar.", width/2 - width/5, height/2.5 - 100, width/2.5, 300);
    
    fill(65, 143,4, titleOpacity);
    if (insideRect(width/3, 3*height/5-height/18, width/3, height/9)) {
        fill(65-30, 143-30, 0, titleOpacity);
    }
    rect(width/3, 3*height/5-height/18, width/3, height/9, 20);

    fill(255, 255, 255, titleOpacity);
    textSize(60);
    text("Reproducir Ahora", width/2, 3*height/5);
};

function loseScreen(){
    fill(0, 0, 0, titleOpacity);
    rect(width/4 + 10, height/3+10, width/2, height/3, 20);
    fill(255, 255, 255, titleOpacity);
    rect(width/4,height/3,width/2,height/3,20);

    textFont("Arial");

    fill(0, titleOpacity)
    textSize(30);
    textAlign(CENTER, CENTER);
    text("Tu puntuación fue " + score + " \n¿Cómo se dice tu puntuación en inglés?", width/3.3, height/2.5-50, width/2.5, 100);

    fill(65, 143, 4, titleOpacity);
    if (insideRect(width/2.7-width/10, 2.7*height/5-height/36, width/5, height/18)) fill(65-20, 143-20, 0, titleOpacity);
    rect(width/2.7-width/10, 2.7*height/5-height/36, width/5, height/18, 20);

    fill(65, 143, 4, titleOpacity);
    if (insideRect(1.7*width/2.7-width/10, 2.7*height/5-height/36, width/5, height/18)) fill(65-20, 143-20, 0, titleOpacity);
    rect(1.7*width/2.7-width/10, 2.7*height/5-height/36, width/5, height/18, 20);

    fill(65, 143, 4, titleOpacity);
    if (insideRect(width/2.7-width/10, 3.1*height/5-height/36, width/5, height/18)) fill(65-20, 143-20, 0, titleOpacity);
    rect(width/2.7-width/10, 3.1*height/5-height/36, width/5, height/18, 20);   
    
    fill(65, 143, 4, titleOpacity);
    if (insideRect(1.7*width/2.7-width/10, 3.1*height/5-height/36, width/5, height/18)) fill(65-20, 143-20, 0, titleOpacity);
    rect(1.7*width/2.7-width/10, 3.1*height/5-height/36, width/5, height/18, 20);


    fill(255, 255, 255,titleOpacity);

    textSize(20);

    text(randomNums[0], width/2.7, 2.7*height/5);
    text(randomNums[1], 1.7*width/2.7, 2.7*height/5);
    text(randomNums[2], 1.7*width/2.7, 3.1*height/5);
    text(randomNums[3], width/2.7, 3.1*height/5);
};

function retryScreen() {
    fill(0, 0, 0, titleOpacity);
    rect(width/4 + 10, height/3+10, width/2, height/3, 20);
    fill(255, 255, 255,titleOpacity);
    rect(width/4, height/3, width/2, height/3, 20);

    textFont("Arial");
    fill(0, titleOpacity)
    textSize(30);
    textAlign(CENTER, CENTER);
    text("Tu respuesta fue '" + randomNums[guessedIndex] + "'. La respuesta correcta fue '" + randomNums[randomIndex] + "'.", width/3.3, height/2.5-50, width/2.5, 100);
    
    fill(65, 143, 4, titleOpacity);
    if (insideRect(width/3, 3*height/7+height/18, width/3, height/9)) fill(65-20, 143-20, 0, titleOpacity);
    rect(width/3, 3*height/7+height/18, width/3, height/9, 20);

    textAlign(CENTER, CENTER);
    textSize(50);
    fill(255,255,255);
    text("Juega de nuevo", width/2, 3*height/7+height/9);
};

function generateNumber(maxNumber, currentNumber) {
    let num = floor(random(maxNumber));
    while (num == currentNumber) {
        num = floor(random(maxNumber));
    }
    return num;
}

function draw() {
    background(66, 52, 10);

    let offset = (frameCount % 600);
    if (bird.dead) {
        offset = 0;
    }

    for (var i = 0; i < width+600; i += 600) {

        image(backgroundImage, i - offset, 0);
    }

    for (let i = pipes.length-1; i >= 0; i--) {
        if (!bird.dead) {
            if (mode === "game") {
                pipes[i].update();
                pipes[i].collide(bird);
            }
        }  
        pipes[i].display(score, bird);
        if (pipes[i].x < -pipes[i].width) {
            pipes.splice(i, 1);
        }

        if(pipes[i].x + bird.size >= bird.x && pipes[i].x + bird.size <= bird.x+4){
            score++;
        }
    }
    
    if (mode === "game") {
        timer ++;
        if (timer % 100 === 0) {
            pipes.push(new Pipe(width, random(height/4, 3*height/4), 300));
        }
    }

    if (mode === "game") {
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

    if (bird.dead && mode !== "lose") {
        mode = "lose";
        randomNums = shuffle([numberToWords(generateNumber(max(100, score), score)), 
                              numberToWords(generateNumber(max(100, score), score)), 
                              numberToWords(generateNumber(max(100, score), score)), 
                              numberToWords(score)]);
        randomIndex = randomNums.indexOf(numberToWords(score));
    }
}

function reset() {
    bird = new Bird(width/2, height/2, 100, toucan);
    pipes = [new Pipe(width, random(height/4, 3*height/4), 300)];
    timer = 0;
    score = 0;
}

function mousePressed() {
    if (mode === "title") {
        if (insideRect(width/3, 3*height/5-height/18, width/3, height/9)) {
            mode = "game";
            return;
        }
    }

    if (mode === "lose") {
        if (insideRect(width/2.7-width/10, 2.7*height/5-height/36, width/5, height/18)) {
            reset();
            if (randomIndex === 0) {
                mode = "game";
                return;
            } 
            mode = "retry";
            guessedIndex = 0;
        }

        if (insideRect(1.7*width/2.7-width/10, 2.7*height/5-height/36, width/5, height/18)) {
            reset();
            if (randomIndex === 1) {
                mode = "game";
                return;
            }
            mode = "retry";
            guessedIndex = 1;
        }

        if (insideRect(1.7*width/2.7-width/10, 3.1*height/5-height/36, width/5, height/18))  {
            reset();
            if (randomIndex === 2) {
                mode = "game";
                return;
            }
            mode = "retry";
            guessedIndex = 2;
        }

        if (insideRect(width/2.7-width/10, 3.1*height/5-height/36, width/5, height/18)) {
            reset();
            if (randomIndex === 3) {
                mode = "game";
                return;
            }
            mode = "retry";
            guessedIndex = 3;
        }

        return;
    }

    if (mode === "retry") {
        if (insideRect(width/3, 3*height/7+height/18, width/3, height/9)) {
            mode = "game";
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
    if (mode !== "game") return;

    if ((keyCode === 32 || keyCode === 38) && !bird.dead) {
        bird.flap();
    }
    if (bird.dead) {
        reset();
    }
}

function windowResized() {
    resizeCanvas(window.innerWidth,window.innerHeight);
    drawBackground(0);
    backgroundImage = get(0,0,600,height);
    image(backgroundImage,1000,0);
}