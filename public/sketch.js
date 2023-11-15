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
        // let dir = x - width/2;/
        let dir = vel.x;

        if (dir > 0 || this.turnAngle < 0) {
            this.turnAngle += 10;
            if (this.turnAngle >= 180) {
                this.direction = 1;
                this.turnAngle = 180;
            }
        }  else if (dir < 0 || this.turnAngle > 0) {
            this.turnAngle -= 10;
            if (this.turnAngle <= -180) {
                this.direction = -1;
                this.turnAngle = -180;
            }
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
    constructor() {
        this.pos = createVector(0, 0);
        this.vel = createVector(0, 0);
        this.target = createVector(0, 0);
    }

    moveTo(x, y) {
        this.target.set(x-width/2, y-height/2);
    } 

    apply(canvas, elements, offsets) {
        this.vel.set(p5.Vector.div(p5.Vector.sub(this.target, this.pos), 30));
        
        this.vel.limit(9);
        this.pos.add(this.vel);
        this.pos.y += 3*cos(frameCount*0.1);
        this.pos.x = constrain(this.pos.x, 0, windowWidth-width);
        this.pos.y = constrain(this.pos.y, 0, window.innerHeight-height);
        canvas.position(this.pos.x, this.pos.y);

        if (elements) {
            for (let i = 0; i < elements.length; i++) {
                // console.log(elements[i])
                elements[i].style.left = `${this.pos.x + offsets[i][0]}px`;
                elements[i].style.top =  `${this.pos.y + offsets[i][1] - elements[i].offsetHeight}px`;
                // console.log(elements[i].style.minHeight);
                // console.log(parseInt(window.getComputedStyle(elements[i]).fontSize, 10));
            }        
        }
    }
}

let size = 300;

var camera, canvas, sc, flying, x, y, keys, speed, bubble;
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
    // const toucanRest = loadImage('toucanRest.png');

    sc = width/450;

    toucan = new Toucan(
        [backWing, leftClaw, toucanTail, bottomBeak, topBeak,  toucanBody, rightClaw, frontWing], // images
        [[120,-100], [122,145], [110,65],  [80,-17],   [58 ,-77],  [100,-80],   [170,140],  [125,-25]],  // position offsets
        [-30,        0,         0,          -10,      0,          0,        0,        -12],  // angle offsets
        [1,          1,          1,         1,        1,          1,        1,         1], // scale offsets
        [[1,-1.25],  [1,1],   [1,1],      [2,1],     [2,1],    [1,1],          [1,1],    [1,-0.5]] // origin locations
    );
    camera = new Mover();

    flying = true;

    // document.addEventListener('mousemove', (event) => {
    //     camera.moveTo(event.clientX, event.clientY)
    //     console.log(true);
    // });

    x = 0;
    y = 0;
    keys = {};
    speed = 10;
    bubble = document.getElementById("response");
}

let test = "hello, how are you doing? I am doing wellasdfasdfiasudfhoa8wefhq8wefh q9w8eyfgq w9ey8fgq we9fyqgw efyg ";
function draw() {
    clear ();
    if (bubble.textContent === "") {
        bubble.style.display = "none";
    } else {
        bubble.style.display = "block";
    }
    // background(255);

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

    x = constrain(x, 0, windowWidth);
    y = constrain(y, 0, window.innerHeight);

    camera.moveTo(x, y);

    push();
        translate(0, height/4);
        scale(sc);

        if (flying) { 
            toucan.turn(camera.vel);
            camera.apply(canvas, [bubble], [[230, 0]]);

            
            toucan.oscillate(0, 0.7, 0.1, 1, 20);
            toucan.oscillate(1, 10, -0.1, 0);
            // toucan.oscillate(5, 20, 0.1, 0);
            // toucan.oscillate(6, 20, 0.1, 0);
            toucan.oscillate(7, 0.7, 0.1, 1, 20);

            toucan.oscillate(0.2 *sin(frameCount * 0.1) - radians(30));
            // toucan.oscillate(5*radians(frameCount))
            // toucan.angle = -20*radians(camera.vel.y);
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
    document.getElementById("response").textContent = test.substring(0, floor(frameCount/1))
    // talking = true;
    // let w = bubble.style.width.substring(0, bubble.style.width.length-2)
    // if (bubble.offsetHeight > 100 && w < 800) {
    //     console.log(true);
        
    //     if (!w) {w = 200;}
    //     bubble.style.width = `${parseInt(w, 10) + 1}px`;
    // }
    
}

function mousePressed() {
    // flying = false;
}

function keyPressed() {
    keys[key] = true;
}

function keyReleased() {
    keys[key] = false;
}