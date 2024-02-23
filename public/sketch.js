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
            return;
        } else if (dir >= 0 && this.turnAngle >= 180 && this.direction == -1) {
            this.direction = 1;
            this.turnAngle = 180;
            return;
        }
        
        if (dir < 0 && this.turnAngle > 0 && this.direction == 1) {
            this.turnAngle -= 10;
            return;
        } else if (dir < 0 && this.turnAngle <= 0 && this.direction == 1) {
            this.direction = -1;
            this.turnAngle = 0;
            return;
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

            translate(width/(2*sc) * (1 - cos(radians(this.turnAngle))), 0)
            scale(cos(radians(this.turnAngle)), 1);
            translate(width/2, height/2);
            rotate(this.angle);
            translate(width/4, height/3);

            for (let i = 0; i < this.parts.length; i++) {
                push();
                    let s = this.scales[i];
                    translate(this.offsets[i][0]+s*this.parts[i].width/2 , this.offsets[i][1]+s*this.parts[i].height/2 );
                    translate(-width/2, -height/2);
                    rotate(radians(this.angles[i]));
                    scale(1, cos(this.scaleAngles[i]));

                    image(this.parts[i], -s*this.parts[i].width/2 * this.origins[i][0], -s*this.parts[i].height/2 * this.origins[i][1], this.parts[i].width * s, this.parts[i].height * s);
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
            
            this.vel.limit(9);
            this.pos.add(this.vel);

            this.pos.y += 3*cos(frameCount*0.1);
            this.pos.x = constrain(this.pos.x, 0, windowWidth-width);
            this.pos.y = constrain(this.pos.y, 0, innerHeight-height);
            canvas.position( this.pos.x, this.pos.y);
        }
        if (elements) {
            for (let i = 0; i < elements.length; i++) {
                elements[i].style.left = `${this.pos.x + offsets[i][0]}px`;
                elements[i].style.top =  `${this.pos.y + offsets[i][1] - elements[i].offsetHeight}px`;
            }        
        }
    }
}

let size = 300;

var camera, canvas, sc, flying, x, y, keys, speed, bubble, backgrounds, input, button, micButton;
function setup() {
    canvas = createCanvas(size, size);

    canvas.position(0, 0);
    canvas.style('z-index', '1');

    const toucanBody = loadImage('toucan/body.png');
    const toucanTail = loadImage('toucan/tail.png');
    const frontWing = loadImage('toucan/wing_front.png');
    const backWing = loadImage('toucan/wing_back.png');
    const bottomBeak = loadImage('toucan/beak_bottom.png');
    const topBeak = loadImage('toucan/beak_top.png');
    const leftClaw = loadImage('toucan/claw_left.png');
    const rightClaw = loadImage('toucan/claw_right.png');

    sc = width/450;

    toucan = new Toucan(
        [backWing,   leftClaw, toucanTail, bottomBeak, topBeak,   toucanBody,   rightClaw, frontWing],   // images
        [[120,-100], [122,145], [110,65],   [80,-17], [58 ,-77],  [100,-80],    [170,140],  [125,-25]],  // position offsets
        [-30,        0,         0,          -10,      0,          0,            0,          -12],        // angle offsets
        [1,          1,         1,          1,        1,          1,            1,          1],          // scale offsets
        [[1,-1.25],  [1,1],     [1,1],      [2,1],    [2,1],      [1,1],        [1,1],      [1,-0.5]]    // origin locations
    );
    camera = new Mover(windowWidth/2-width/2, innerHeight/3-height/2);

    flying = true;

    x = windowWidth/2;
    y = innerHeight/3;
    keys = {};
    speed = 10;
    bubble = document.getElementById("response");
    input = document.getElementById("message");
    button = document.getElementById("ask");
    micButton = document.getElementById('mic');
    
    input.style.left = `${windowWidth/2-400/2}px`;
    input.style.top = "80%";
    button.style.left = `${windowWidth/2+400/2+10}px`;
    button.style.top = "80%";
    micButton.style.left = `${windowWidth/2-400/2-50}px`;
    micButton.style.top = "80%";

    input.onfocus=function(){flyDown=true;};
    input.onblur =function(){
        if (!flydownLock) {
            flyDown=false;
        }
    };
}

function draw() {
    input.style.left = `${windowWidth/2-400/2}px`;
    button.style.left = `${windowWidth/2+400/2+10}px`;
    micButton.style.left = `${windowWidth/2-400/2-50}px`;

    clear ();
    if (bubble.textContent === "") {
        bubble.style.display = "none";
    } else {
        bubble.style.display = "block";
    }

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
        x = constrain(x, windowWidth/4, 3*windowWidth/4);
        y = constrain(y, 0, window.innerHeight-0.22*innerHeight-height/2);
        camera.moveTo(x, y);
        if (frameCount % 300 === 0) {
            x += random(-windowWidth/8, windowWidth/8);
            y = random(150, 3*innerHeight/4);
        }
        
    } else {
        camera.moveTo( windowWidth/2, 0.8*innerHeight-height/4);
        camera.vel.x = .1;
        if (camera.vel.mag() < 1 && camera.pos.dist(camera.target) < 10) {
            flying =  false;
        }
    }

    
    if (!talking && speechQueue[0]) {
        let sentence = speechQueue[0];
        speechQueue.shift();
        speak(sentence);
    }
    
    push();
        translate(0, height/4);
        scale(sc);

        if (flying) { 
            toucan.turn(camera.vel);
            camera.apply(canvas, [bubble], [[230, 0]], true);

            toucan.oscillate(0, 0.7, 0.1, 1, 20);
            toucan.oscillate(2, 10, -0.1, 0);
            toucan.oscillate(7, 0.7, 0.1, 1, 20);
            toucan.oscillate(0.2 *sin(frameCount * 0.1) - radians(30));
            
        } else {
            toucan.turn(camera.vel);    
            camera.apply(canvas, [bubble], [[230, 0]], false);
            toucan.oscillate(0, 0.7, 0.1, 1, 20);
            toucan.oscillate(2, 10, -0.1, 0);
            toucan.oscillate(7, 0.7, 0.1, 1, 20);
            toucan.oscillate(0.2 *sin(frameCount * 0.1) - radians(30));
        }

        if (talking) {
            toucan.oscillate(3, 5,  -0.2, 0);
            toucan.oscillate(4, 5,  0.2, 0);
        } else {
            toucan.angles[3] = 0;
            toucan.angles[4] = 0;
        }

        toucan.display();
        
    pop();
    if (!talking && talkingCooldown > 0) {
        talkingCooldown --;
    } else if (!talking) {
        bubble.textContent = "Ask me questions about English! Type your question in the box below.";
        if (language == "Spanish") {
            bubble.textContent = "¡Hazme preguntas sobre inglés! Escriba su pregunta en el cuadro a continuación.";
        }
    }
    if (bubble.offsetHeight > 300) {
        bubble.style.overflowY = "scroll";
    }
}

function keyPressed() {
    keys[key] = true;
}

function keyReleased() {
    keys[key] = false;
    if (key === "Enter") {
        const messageBox = document.getElementById("message");
        if (messageBox.value !== "") {
            ws.send(JSON.stringify({type: "start", 
            "content": messageBox.value, 
            "username": cookies['username'],
            "password": cookies['password'],
            "language": cookies['language']
            }));
            flydownLock = true;
            flyDown = true;
        }
    }
}