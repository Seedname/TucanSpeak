class Toucan {
    constructor(parts, offsets, angles, scales, origins) {
        this.parts = parts;
        this.offsets = offsets;
        this.originals = [...angles];
        this.angles = angles;
        this.scales = scales;
        this.origins = origins;

        this.moving = false;
        this.direction = 1;
        this.turnAngle = 180;
        this.angle = 0;
        this.scaleAngles = [...angles]
    }

    turn(vel) {
        // let dir = x - width/2;/
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
                    this.angles[part] = amplitude * sin(frequency * frameCount) + radians(this.originals[part]);
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

            translate(width/2 * (1 - cos(radians(this.turnAngle))), 0)
            scale(cos(radians(this.turnAngle)), 1);
            translate(0, 50);
            // translate(width/2, height/2);
            // rotate(this.angle);

            for (let i = 0; i < this.parts.length; i++) {
                push();
                    let s = this.scales[i];
                    translate(width/2, height/2);
                    translate(this.offsets[i][0], this.offsets[i][1])
                    rotate(radians(this.angles[i]));
                    image(this.parts[i], -this.parts[i].width/2*this.origins[i][0], -this.parts[i].height/2*this.origins[i][1]);
                    // translate(this.offsets[i][0]+s*this.parts[i].width/2 , this.offsets[i][1]+s*this.parts[i].height/2 );
                    // translate(-width/2, -height/2);
                    // rotate(radians(this.angles[i]));
                    // scale(1, cos(this.scaleAngles[i]));

                    // image(this.parts[i], -s*this.parts[i].width/2 * this.origins[i][0], -s*this.parts[i].height/2 * this.origins[i][1], this.parts[i].width * s, this.parts[i].height * s);
                pop();
            }
        pop();
    }
}

class Mover {
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.vel = createVector(0, 0);
        this.target = createVector(0, 0);
    }

    moveTo(x, y) {
        this.target.set(x-width/2, y-height/2);
    } 

    apply(canvas, elements, offsets, really) {
        if (really) {
            this.vel.set(p5.Vector.div(p5.Vector.sub(this.target, this.pos), 30));

            // this.vel.limit(9);
            this.vel.x = constrain(this.vel.x, -10, 10)
            this.pos.add(this.vel);
            // this.pos.y += 3*cos(frameCount*0.1);
            // this.pos.x = constrain(this.pos.x, 0, windowWidth-width);
            this.pos.y = constrain(this.pos.y, 0, innerHeight-height);
            canvas.position( windowWidth/2-width/2, this.pos.y);
        }
        if (elements) {
            for (let i = 0; i < elements.length; i++) {
                // console.log(elements[i])
                // elements[i].style.left = `${this.pos.x + offsets[i][0]}px`;
                elements[i].style.left = `${windowWidth/2-width/2 + offsets[i][0]}px`;
                elements[i].style.top =  `${this.pos.y + offsets[i][1] - elements[i].offsetHeight}px`;
                // console.log(elements[i].style.minHeight);
                // console.log(parseInt(window.getComputedStyle(elements[i]).fontSize, 10));
            }        
        }
    }
}

let size = 700

var camera, canvas, sc, flying, x, y, keys, speed, bubble, backgrounds, input, button;
function setup() {
    canvas = createCanvas(size, size);

    canvas.position(0, 0);
    canvas.style('z-index', '1');

    // const toucanBody = loadImage('toucan/body.png');
    // const toucanTail = loadImage('toucan/tail.png');
    // const frontWing = loadImage('toucan/wing_front.png');
    // const backWing = loadImage('toucan/wing_back.png');
    // const bottomBeak = loadImage('toucan/beak_bottom.png');
    // const topBeak = loadImage('toucan/beak_top.png');
    // const leftClaw = loadImage('toucan/claw_left.png');
    // const rightClaw = loadImage('toucan/claw_right.png');
    // const toucanRest = loadImage('toucanRest.png');

    // const head = loadImage('knight2/head.png');
    // const torso = loadImage('knight2/torso.png');
    // const leftArm = loadImage('knight2/left_arm.png');
    // const rightArm = loadImage('knight2/right_arm.png');
    // const leftLeg = loadImage('knight2/left_leg.png');
    // const rightLeg = loadImage('knight2/right_leg.png');

    // const head = loadImage('knight3/head.png');
    // const torso = loadImage('knight3/torso.png');
    // const leftArm = loadImage('knight3/left_arm.png');
    // const rightArm = loadImage('knight3/right_arm.png');
    // const leftLeg = loadImage('knight3/left_leg.png');
    // const rightLeg = loadImage('knight3/right_leg.png');

    const head = loadImage('knight4/head.png');
    const torso = loadImage('knight4/torso.png');
    const leftArm = loadImage('knight4/left_arm.png');
    const rightArm = loadImage('knight4/right_arm.png');
    const leftLeg = loadImage('knight4/left_leg.png');
    const rightLeg = loadImage('knight4/right_leg.png');


    sc = 1.5;

    toucan = new Toucan( 
        [ leftLeg,     rightLeg,   torso,    leftArm,      rightArm,      head,  ],   // images
        [ [-10,5],   [50,25],    [10,-30],  [-10,-290],   [0,-150],     [2,-190], ],   // position offsets
        [  300,           0,         0,        0,            0,            0,     ],  // angle offsets
        [ 1,            1,          1,        1,            1,            1,     ],  // scale offsets
        [ [1.2,0],      [0.5,0],    [1,1],    [1.8,0],       [0,0],       [1,1], ]  // origin locations
    ); 

    // toucan = new Toucan(
    //     [leftArm,   rightArm, leftLeg, rightLeg, head],   // images
    //     [[120,-100], [122,145], [110,65],   [80,-17], [58 ,-77],  [100,-80],    [170,140],  [125,-25]],  // position offsets
    //     [-30,        0,         0,          -10,      0,          0,            0,          -12],        // angle offsets
    //     [1,          1,         1,          1,        1,          1,            1,          1],          // scale offsets
    //     [[1,-1.25],  [1,1],     [1,1],      [2,1],    [2,1],      [1,1],        [1,1],      [1,-0.5]]    // origin locations
    // );


    camera = new Mover(windowWidth/2-width/2, innerHeight-height);

    flying = true;
    // document.addEventListener('mousemove', (event) => {
    //     camera.moveTo(event.clientX, event.clientY)
    //     console.log(true);
    // });

    x = windowWidth/2;
    y = innerHeight;
    keys = {};
    speed = 10;
    bubble = document.getElementById("response");
    backgrounds = document.querySelectorAll(".bg");
    input = document.getElementById("message");
    button = document.getElementById("ask");

    for (let i = 0; i < backgrounds.length; i++) {
        const bg = backgrounds.item(i);
        bg.style.top = `${0}px`;
        bg.style.height = `100%`;
    }
    


    // input.onfocus=function(){flyDown=true;};
    // input.onblur =function(){
    //     if (!flydownLock) {
    //         flyDown=false;
    //     }
    // };
}

function draw() {

    // console.log(windowWidth);
    input.style.left = `${windowWidth/2-400/2}px`;
    input.style.top = "90%";
    button.style.left = `${windowWidth/2+400/2+30}px`;
    button.style.top = "90%";

    if (startTimer && (millis() - startTime) >= (25*1000)) {
        startTimer = false;
        ws.send(JSON.stringify({type: 'endRound'}));
    }
    clear ();
    // background(255);
    if (bubble.textContent === "") {
        bubble.style.display = "none";
    } else {
        bubble.style.display = "block";
    }
    // background(255);

    if (!flyDown) {
        if (keys['w'] || keys['ArrowUp']) {
            y -= speed;
        }
        if (keys['a'] || keys['ArrowLeft']) {
            x -= speed;
        }
        if (keys['s'] || keys['ArrowDown']) {
            y += speed;
        }
        if (keys['d'] || keys["ArrowRight"]) {
            x += speed;
        }
        flying = true;
        y = innerHeight
        camera.moveTo(x, y);
        if (frameCount % 300 === 0) {
            x += random(-windowWidth, windowWidth);
            // y = random(150, innerHeight);
        }
        
    } else {
        camera.moveTo(x, 0.8*innerHeight-height/4);
        camera.vel.x = .1;
        if (camera.vel.mag() < 1 && camera.pos.dist(camera.target) < 10) {
            flying =  false;
            // toucan.reset();
        }
    }

    
    if (!talking && speechQueue[0]) {
        let sentence = speechQueue[0];
        speechQueue.shift();
        speak(sentence);
    }
    // x = constrain(x, 0, windowWidth);
    


    push();
        translate(-200, -200);
        scale(sc);

        toucan.turn(camera.vel);
        camera.apply(canvas, [bubble], [[400, -20]], true);

        // if (camera.vel.mag() > .1) {
            // leftLeg, rightLeg, torso, leftArm, rightArm, head,
            toucan.oscillate(0, abs(camera.vel.x), 0.1, 0);
            toucan.oscillate(1, abs(camera.vel.x), 0.1, 0);
            // toucan.oscillate(2, 3, .1, 0);
            toucan.oscillate(3,abs(camera.vel.x)/15+0.1, .1, 0);
            toucan.oscillate(4, abs(camera.vel.x)/3+0.1, -0.1, 0);
            toucan.oscillate(5, abs(camera.vel.x)/5+0.1, .1, 0);
        // }

        // if (talking) {
        //     toucan.oscillate(3, 5,  -0.2, 0);
        //     toucan.oscillate(4, 5,  0.2, 0);
        // } else {
        //     toucan.angles[3] = 0;
        //     toucan.angles[4] = 0;
        // }

        toucan.display();
        
    pop();
    if (!talking && talkingCooldown > 0) {
        talkingCooldown --;
    } else if (!talking) {
        bubble.textContent = "Ask me anything about NeoCity! Type your question in the box below."
    }
    // document.getElementById("response").textContent = test.substring(0, floor(frameCount/1))
    // talking = true;
    let w = bubble.style.width.substring(0, bubble.style.width.length-2)
    if (bubble.offsetHeight > 500 && w < 1000) {
        if (!w) {w = 400;}
        bubble.style.width = `${parseInt(w, 10) + 1}px`;
    }
    let x1 = camera.pos.x;
    for (let i = 0; i < backgrounds.length; i++) {
        const bg = backgrounds.item(i);
        // bg.style.left = `${-frameCount*5+bg.width*i}px`;

        bg.style.left = `${-x1-bg.width*(i-ceil(x1/bg.width))}px`
        bg.style.top = `${0}px`;
        bg.style.height = `100%`;
    }

    if (startTimer) {
        textSize(25);
        fill (128);
        text("Timer: " + (25-floor((millis() - startTime)/1000)), 50, 50);
    }
}

function mousePressed() {
    // flying = false;
}

function keyPressed() {
    keys[key] = true;
}

function keyReleased() {
    keys[key] = false;
    if (key === "Enter") {
        const messageBox = document.getElementById("message");
        if (messageBox.value !== "") {
            ws.send(JSON.stringify({type: "start", "content": messageBox.value}));
            // flydownLock = true;
            // flyDown = true;
        }
    }
}

