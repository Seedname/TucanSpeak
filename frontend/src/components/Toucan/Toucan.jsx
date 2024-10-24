import React, {useEffect, useRef, useState} from 'react'
import p5 from 'p5';

var talking = false;
var flyDown = false;

export const setTalking = (state) => {
  talking = state;
};

const ToucanAnimation = () => {
  const canvasRef = useRef(null);
  const [p5Instance, setP5Instance] = useState(null);
  
  useEffect(() => {
    const sketch = (p) => {
      let toucan, camera, canvas, sc, flying, x, y, keys, speed;
      let flydownLock = false;
      let talkingCooldown = 0;
      let speechQueue = [];

      class Toucan {
        constructor(parts, offsets, angles, scales, origins) {
          this.parts = parts;
          this.offsets = offsets;
          this.originals = [...angles];
          this.angles = angles;
          this.scales = scales;
          this.origins = origins;

          this.moving = false;
          this.direction = -1
          this.turnAngle = 180;
          this.angle = 0;
          this.scaleAngles = [...angles];
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
          if (amplitude === undefined) {
            this.angle = part;
          } else {
            switch (type) {
              case 0:
                this.angles[part] = amplitude * p.sin(frequency * p.frameCount) + this.originals[part];
                break;
              case 1:
                this.scaleAngles[part] = amplitude * p.sin(frequency * p.frameCount) + offset;
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
          p.translate(p.width/(2*sc) * (1-p.cos(p.radians(this.turnAngle))), 0);
          p.scale(p.cos(p.radians(this.turnAngle)), 1);
          p.translate(p.width/2, p.height/2);
          p.rotate(this.angle);
          p.translate(p.width/4, p.height/3);

          for (let i = 0; i < this.parts.length; i++) {
            p.push();
            let s = this.scales[i];
            p.translate(this.offsets[i][0]+s*this.parts[i].width/2, this.offsets[i][1]+s*this.parts[i].height/2);
            p.translate(-p.width/2, -p.height/2);
            p.rotate(p.radians(this.angles[i]));
            p.scale(1, p.cos(this.scaleAngles[i]));

            p.image(this.parts[i], -s*this.parts[i].width/2*this.origins[i][0], -s*this.parts[i].height/2 * this.origins[i][1], this.parts[i].width * s, this.parts[i].height * s);
            p.pop();
          }
          p.pop();
        }
      }

      class Mover {
        constructor(x, y) {
          this.pos = p.createVector(x, y);
          this.vel = p.createVector(0, 0);
          this.target = p.createVector(0, 0);
        }

        moveTo(x, y) {
          this.target.set(x-p.width/2, y-p.height/2);
        }

        apply(canvas, elements, offsets, really) {
          if (really) {
            this.vel.set(p5.Vector.div(p5.Vector.sub(this.target, this.pos), 30));
            this.vel.limit(9);
            this.pos.add(this.vel);

            this.pos.y += 3*p.cos(p.frameCount*0.1);
            this.pos.x = p.constrain(this.pos.x, 0, window.innerWidth-p.width);
            this.pos.y = p.constrain(this.pos.y, 0, window.innerHeight-p.height);
            canvas.position(this.pos.x, this.pos.y);
          }

          if (elements) {
            elements.forEach((element, i) => {
              if (element) {
                element.style.left = `${this.pos.x + offsets[i][0]}px`;
                element.style.top = `${this.pos.y + offsets[i][1] - element.offsetHeight}px`
              }
            });
          }
        }
      }

      let sizes = 300;
      p.preload = () => {
        const toucanBody = p.loadImage('/toucan/body.png');
        const toucanTail = p.loadImage('/toucan/tail.png');
        const frontWing = p.loadImage('/toucan/wing_front.png');
        const backWing = p.loadImage('/toucan/wing_back.png');
        const bottomBeak = p.loadImage('/toucan/beak_bottom.png');
        const topBeak = p.loadImage('/toucan/beak_top.png');
        const leftClaw = p.loadImage('/toucan/claw_left.png');
        const rightClaw = p.loadImage('/toucan/claw_right.png');

        const size = 300;
        sizes = size;
        sc = size/450;

        toucan = new Toucan(
          [backWing, leftClaw, toucanTail, bottomBeak, topBeak, toucanBody, rightClaw, frontWing],
          [[120,-100], [122,145], [110,65], [80,-17], [58,-77], [100,-80], [170,140], [125,-25]],
          [-30, 0, 0, -10, 0, 0, 0, -12],
          [1, 1, 1, 1, 1, 1, 1, 1],
          [[1,-1.25], [1,1], [1,1], [2,1], [2,1], [1,1], [1,1], [1,-0.5]]
        );
      };

      p.setup = () => {
        canvas = p.createCanvas(300, 300);
        canvas.position(0, 0);
        canvas.style('z-index', '0');

        camera = new Mover(window.innerWidth/2, window.innerHeight/3);
        flying = true;
        x = window.innerWidth/2;
        y = window.innerHeight/3;
        keys = {};
        speed = 10;
      };

      p.draw = () => {
        p.clear();

        if (!flyDown) {
          // if (keys['w'] || keys['ArrowUp']) y -= speed;
          // if (keys['a'] || keys['ArrowLeft']) x -= speed;
          // if (keys['s'] || keys['ArrowDown']) y += speed;
          // if (keys['d'] || keys['ArrowRight']) x += speed;

          flying = true;
          // x = p.constrain(x, 0, window.innerWidth/2);
          // y = p.constrain(y, 200, window.innerHeight-0.22*window.innerHeight-p.height/2);
          // camera.moveTo(window.innerWidth-2*p.width, window.innerHeight-p.height);
          // if (p.frameCount % 300 === 0) {
          //   x += p.random(-window.innerWidth/8, window.innerWidth/8);
          //   y = p.random(500, 3*window.innerHeight/4);
          // }
        } else {
          // camera.moveTo(window.innerHeight/2, 0.8*window.innerHeight-p.height/4);
          camera.vel.x = 0.1;
          if (camera.vel.mag() < 1 && camera.pos.dist(camera.target) < 10) {
            flying = fasle;
          }
        }

        p.push();
        p.translate(0, p.height/4);
        p.scale(sc);

        if (flying) {
          toucan.turn(camera.vel);
          camera.apply(canvas, [], [[230, 0]], true);

          toucan.oscillate(0, 0.7, 0.1, 20);
          toucan.oscillate(2, 10, -0.1, 0);
          toucan.oscillate(7, 0.7, 0.1, 1, 20);
          toucan.oscillate(0.2 * p.sin(p.frameCount * 0.1) - p.radians(30));
        } else {
          toucan.turn(camera.vel);
          camera.apply(canvas, [], [[230, 0]], false);
          toucan.oscillate(0, 0.7, 0.1, 1, 20);
          toucan.oscillate(2, 10, -0.1, 0);
          toucan.oscillate(7, 0.7, 0.1, 1, 20);
          toucan.oscillate(0.2 * p.sin(p.frameCount * 0.1) - p.radians(30));
        }

        if (talking) {
          toucan.oscillate(3, 5, -0.2, 0);
          toucan.oscillate(4, 5, 0.2, 0);
        } else {
          toucan.angles[3] = 0;
          toucan.angles[4] = 0;
        }

        toucan.display();
        p.pop();
      };

      p.keyPressed = () => {
        keys[p.key] = true;
      };

      p.keyReleased = () => {
        keys[p.key] = false;
      };
    };

    const p5Instance = new p5(sketch, canvasRef.current);
    setP5Instance(p5Instance);

    return () => {
      p5Instance.remove();
    };
  }, []);


  return (
    <div className='relative w-full h-full'>
      <div ref={canvasRef} className='absolute' />
    </div>
  );
};

export default ToucanAnimation;