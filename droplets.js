/*
DROPLETS 2.75 :: relentless vector graphic eye candy ::
copyright 2025 :: Frank Maiello :: maiello.frank@gmail.com ::

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. In no event shall the author or copyright holders be liable for any claim, damages, or other liability, whether in an action of contract, tort or otherwise, arising from, our of or in, connection with the software or the use of other dealings in the Software.
*/

// Mr. Mister
// louis vuitton logo
// eyes / horus
// rainbow/diagonal arc array
// fish
// clovers
// horseshoes
// figure eights
// bikini tops & bottoms
// footprints/pawprints
// pallete function / sin*cos 
// leaves
// jeremy, one of those
// watermelon slices

//  CANVAS SETUP AND SCALING --------------------------------------------------------------   
function resizeCanvas() {
    canvas = document.getElementById("myCanvas");
    c = canvas.getContext("2d");
    canvas.style.cursor = "pointer";
    canvas.width = window.innerWidth - 15;
    if (window.innerWidth > 1.5 * window.innerHeight) { 
        canvas.height = window.innerHeight - 150;
    } else if (window.innerWidth > window.innerHeight) {
        canvas.height = window.innerHeight - 170; 
    } else if (window.innerWidth < 0.7 * window.innerHeight) {
        canvas.height = window.innerHeight - 220;
        } else if (window.innerWidth < 0.9 * window.innerHeight) {
        canvas.height = window.innerHeight - 280;
    } else if (window.innerWidth < window.innerHeight) {
        canvas.height = window.innerHeight - 250;
    }
    simMinWidth = 2;
    cScale = Math.min(canvas.width, canvas.height) / simMinWidth;
    simWidth = canvas.width / cScale;
    simHeight = canvas.height / cScale;
    setGradient();
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);
window.addEventListener("resize", makeStars);

//  INITIALIZE TIMER  -------------------
var lastTime = new Date, thisTime;

//  MOUSE  ------------------
let mouseHolding = false;

c.canvas.addEventListener("mousedown", e => { 
mouseHolding = true; autoSpawn = false; spawnDroplet(e); });

c.canvas.addEventListener("mousemove", e => { 
if (mouseHolding) spawnDroplet(e); });

c.canvas.addEventListener("mouseup", e => { 
    if (spawn.value != 'mouseOnly') {
        mouseHolding = false;
    }
});

//  TOUCH  -------------------
let touchHolding = false;

c.canvas.addEventListener("touchstart", e => { 
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
    touchHolding = true; 
    });

c.canvas.addEventListener("touchmove", e => {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
if (touchHolding) spawnDroplet(e); });

c.canvas.addEventListener("touchend", e => { 
touchHolding = false });

c.canvas.addEventListener("touchcancel", e => { 
touchHolding = false });

//  KEYBORAD CONTROL  ---------------------
document.addEventListener("keydown", keyDownHandler, false);
//document.addEventListener("keyup", keyUpHandler, false);

leftPressed = false;
rightPressed = false;

function keyDownHandler(u) {
    if (u.key == "a" || u.key == "A") {
    leftPressed = true;
    } else if (u.key == "d" || u.key == "D") {
    rightPressed = true;
    }
}
function keyUpHandler(u) {
    if (u.key == "a" || u.key == "A") {
    leftPressed = false;
    } else if (u.key == "d" || u.key == "D") {
    rightPressed = false;
    } 
}

//  BASIC FUNCTIONS --------------------
function drawCircle(x, y, radius) {
    c.beginPath();			
    c.arc(x, y, radius, 0, 2 * Math.PI) 
    c.closePath();
}
function drawCircleOpen(x, y, radius) {		
    c.arc(x, y, radius, 0, 2 * Math.PI) 
}
function drawEllipse(x, y, radiusX, radiusY) {
    c.beginPath();			
    c.ellipse(x, y, 0.7 * radiusX, 0.7 * radiusY, 0, 0, 2 * Math.PI) 
    c.closePath();
}
function addPi() {
    y += 0.5 * Math.PI;
}
function rads(theta) {
    return theta * Math.PI/180;
}
function spawnBackground() {
    saturation = 5 + 15 * Math.random();
    lightness = 15 + 30 * Math.random();
    // make some big ones
    if (Math.random() <0.05) {
        maxRadius = 0.2 + sizeSlider.value/5 * Math.random();
    } else {
        maxRadius = 0.05 + sizeSlider.value/20 * Math.random();
    }
    // compensate for movement
    if (moveUpBox.checked == true) {
        posX = Math.random() * simWidth;
        posY = Math.random() * 1.3 * simHeight;
    } else
    if (moveDownBox.checked == true) {
        posX = Math.random() * simWidth;
        posY = Math.random() * 1.3 * simHeight - 0.3 * simHeight;  
    } else {  // spawn only in sky if active
        if (gradientBkgrndBox.checked == true) {
            posX = Math.random() * simWidth;
            posY = Math.random() * 0.5 * simHeight;
        } else {
            posX = Math.random() * simWidth;
            posY = Math.random() * simHeight;
        }
    }
}
function setGradient() {
    //  LANDSCAPE SHADING GRADIENT  -----------------
    perspectiveGradient = c.createRadialGradient(
        0.5 * simWidth * cScale, // x1
        2.2 * simHeight * cScale,  // y1
        0.0 * cScale,  // radius1
        0.5 * simWidth * cScale,  // x2
        3.48 * simHeight * cScale,  // y2
        6.0 * cScale)  //  radius2
    perspectiveGradient.addColorStop(.4, 'hsl(30, 5%, 60%)');
    perspectiveGradient.addColorStop(0.95, 'black');

    //  SKY SHADING GRADIENT  ------------------
    skyGradient = c.createLinearGradient(0,0,0,0.5 * canvas.height)
    skyGradient.addColorStop(0, 'hsl(0, 0%, 0%)');
    skyGradient.addColorStop(.3, 'hsl(240, 20%, 3%');
    skyGradient.addColorStop(0.8, 'hsl(20, 70%, 4%)');
    skyGradient.addColorStop(0.999, 'hsl(25, 80%, 5%)');
    skyGradient.addColorStop(1, 'hsl(0, 0%, 0%)');
}
function makeStars() {
    littleStarfield = [];
    bigStarfield = [];
    for (r = 0; r < 1000; r++) {
        posX = Math.random() * simWidth;
        posY = Math.random() * 0.5 * simHeight;
        radius = 0.3 + .8 * Math.random();
        lightness = .05 + 0.95 * Math.random() * (1 - (posY / (0.5 * simHeight)));
        lightnessMax = posY / (0.5 * simHeight);
        dimming = false;
        littleStarfield.push(new STAR(posX, posY, radius, lightness, lightnessMax, dimming));
    }
    for (r = 0; r < 2000; r++) {
        posX = Math.random() * simWidth;
        posY = Math.random() * simHeight;
        radius = 0.3 + .8 * Math.random();
        lightness = .1 + 0.9 * Math.random();
        lightnessMax = 1.0;
        dimming = false;
        bigStarfield.push(new STAR(posX, posY, radius, lightness, lightnessMax, dimming));
    }
}
function randomAll() {
randomObjectManual();
randomScene();
randomSettings();
randomAttributes();
}

//  PREVENT BLANK CANVAS  -----------------
document.getElementById('noTraces').oninput = function() {
    if (noTraces.checked == true && fillBox.checked == false && gradFillBox.checked == false) {   
        blackTraces.checked = true;} 
    }
document.getElementById('fillBox').oninput = function() {
    if (noTraces.checked == true && fillBox.checked == false || gradFillBox.checked == false) {   
        colorTraces.checked = true;} 
    }
document.getElementById('blackBkgrndBox').oninput = function() {
    if (blackTraces.checked == true) {
        whiteTraces.checked = true;}
    }
document.getElementById('blackTraces').oninput = function() {
    if (blackBkgrndBox.checked == true) {
        whiteBkgrndBox.checked = true;}
    }

document.getElementById('shape').oninput = function() {
    if (shape.value == 'softDroplets') {
        gradFillBox.checked = true;
        noTraces.checked = true;
    }
    if (shape.value == 'bubbleDroplets') {
        gradFillBox.checked = true;
        colorTraces.checked = true;
    }   
}

document.getElementById('moveUpBox').oninput = function() {
    if (moveDownBox.checked == true) {
        moveDownBox.checked = false;
    }
}

document.getElementById('moveDownBox').oninput = function() {
    if (moveUpBox.checked == true) {
        moveUpBox.checked = false;
    }
}

//  GOOSE THE SPAWN RATE  ------------------
document.getElementById('goose').onmousedown = function() {
    oldSpawnValue = spawnSlider.value;
    spawnSlider.value = 1.0 + oldSpawnValue}

document.getElementById('goose').onmouseup = function() {
    spawnSlider.value = oldSpawnValue}

//  DEFINE STAR CLASS  -----------------
class STAR{
    constructor(posX, posY, radius, lightness, lightnessMax, dimming) {
        this.posX = posX;
        this.posY = posY;
        this.radius = radius;
        this.lightness = lightness;
        this.ligtnessMax = lightnessMax;
        this.dimming = dimming;
    }       
    draw() {
        c.beginPath();
        c.arc(this.posX * cScale, this.posY * cScale,
        this.radius, 0, 2*Math.PI)
        c.fillStyle = `hsl(0, 0%, ${this.lightness*100}%)`
        c.closePath
        c.fill();
    }
}

//  DEFINE DROPLET  -------------------
class DROPLET {
    constructor(posX, posY, dispX, dispY, radius, maxRadius, 
    hue, saturation, lightness, alpha, birthday, type, spin, angle, recang) {
        this.posX = posX;
        this.posY = posY;
        this.dispX = dispX;
        this.dispY = dispY;
        this.radius = radius;
        this.maxRadius = maxRadius;
        this.hue = hue;
        this.saturation = saturation;
        this.lightness = lightness;
        this.alpha = alpha;
        this.birthday = birthday;
        this.type = type;
        this.spin = spin;
        this.angle = angle;
        this.recang = recang;
    }
    simulate() {
        // STEER  ---------
        if (spawn.value == 'fly') {
            if (leftPressed == true) {
                this.angle += 0.1;
            }
            if (rightPressed == true) {
                this.angle -= 0.1;
            }
        }
        // SET AGE  ----------
        lifespan = lifespanSlider.value * 100;
        // GROW RADIUS AND INCREASE TRANSPARENCY  ----------
        this.radius = this.maxRadius * ((Date.now() - this.birthday)) / lifespan;
        this.alpha = 100 - ((Date.now() - this.birthday)) * 100 / lifespan;
        //  SPIN OBJECTS  -----------
        if (spinBox.checked == true) {
            this.angle += this.spin;
        }
        if (spinBox2.checked == true) {
            this.angle += 5 * this.spin;
        }
        //  MOVE ARROWS IN POINTING DIRECTION  ----------
        if (this.type == 'plainArrow' || this.type == 'fancyArrow' || this.type == 'stickMan') {
            if (moveSlowBox.checked == true) {
                this.posX -= 0.002 * Math.sin(this.angle);
                this.posY -= 0.002 * Math.cos(this.angle);
            }
            if (moveBox.checked == true) {
                this.posX -= 0.005 * Math.sin(this.angle);
                this.posY -= 0.005 * Math.cos(this.angle);
            }
            if (moveUpBox.checked == true ) {
                this.posY -= 0.003;
            }
        } else {
            if (moveUpBox.checked == true ) {
                this.posY -= 0.003;
            }
            if (moveDownBox.checked == true ) {
                this.posY += 0.003;
            }

            if (moveSlowBox.checked == true) {
                if (moveUpBox.checked == true ) {
                    this.posY -= 0.2 * this.dispY;
                } else {
                    this.posY += 0.2 * this.dispY;
                }
                this.posX += 0.2 * this.dispX;   
            }
            if (moveBox.checked == true) {
                if (moveUpBox.checked == true ) {
                    this.posY -= this.dispY;
                } else {
                    this.posY += this.dispY;
                }
                this.posX += this.dispX;   
            }
        }
    
        //  EVERTHING SPIN IN UNISON  -------------------
        if (twirlBox.checked == true) {
            this.angle += 0.05;
        }
        
    }
    draw() {
        //  SET STROKE STYLE BASED ON ALPHA
        if (alphaBox.checked == true) {
            c.fillStyle = `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${this.alpha}%)`;
            if (whiteTraces.checked == true) {
                c.strokeStyle = `hsla(0, 0%, 75%, ${this.alpha}%)`;
            } 
            if (blackTraces.checked == true) {
                c.strokeStyle = `hsla(0, 0%, 0%, ${this.alpha}%)`;
            }
            if (colorTraces.checked == true) {
                c.strokeStyle = `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${this.alpha}%)`;
            }
        } else {
            c.fillStyle = `hsl(${this.hue}, ${this.saturation}%, ${this.lightness}%)`;
            if (whiteTraces.checked == true) {
                c.strokeStyle = `hsl(0, 0%, 75%)`;
            } 
            if (blackTraces.checked == true) {
                c.strokeStyle = `hsl(0, 0%, 0%)`;
            }
            if (colorTraces.checked == true) {
                c.strokeStyle = `hsl(${this.hue}, ${this.saturation}%, ${this.lightness}%)`;
            }
        }
        
        //  RADIAL GRADIENT FILL SHADING FOR EVERYTHING BUT BUBBLES AND CIRCLES ----------------------
        if (gradFillBox.checked == true && this.type != 'bubble' && this.type != 'circle') {
            var sphereGradient = c.createRadialGradient(
                this.posX * cScale, 
                this.posY * cScale, 
                0.1 * this.radius * cScale, 
                this.posX * cScale, 
                this.posY * cScale, 
                1.0 * this.radius * cScale);
            if (alphaBox.checked == true) {
                var highlight = `hsla(${this.hue + 30}, ${this.saturation}%, ${this.lightness}%, ${this.alpha}%)`;
                var midtone = `hsla(${this.hue}, ${this.saturation}%, ${this.lightness-50}%, ${this.alpha}%)`;
            } else {
                var highlight = `hsla(${this.hue + 30}, ${this.saturation}%, ${this.lightness}%)`;
                var midtone = `hsla(${this.hue}, ${this.saturation}%, ${this.lightness-50}%)`;
            }
            
            sphereGradient.addColorStop(0.1, highlight);
            sphereGradient.addColorStop(1.0, midtone);
            c.fillStyle = sphereGradient;
        }

        //  FIGURE-EIGHT DROPLETS  --------------------
        if (this.type == 'figureEight') {
            c.beginPath();
            c.moveTo((this.posX + this.radius) * cScale, this.posY * cScale);

            for (var f = 0; f <  2 * Math.PI; f += .1) {
                var pathScale = 2 / (3 - Math.cos(2 * (f + this.angle)));
                var X = this.posX + this.radius * pathScale * Math.cos(f);
                var Y = this.posY + this.radius * 1.2 * pathScale * Math.sin(2 * f) / 2;
                c.lineTo(X * cScale, Y * cScale);       
            }
            c.lineTo((this.posX + this.radius) * cScale, this.posY * cScale);
            //c.closePath();
        }

        //  NUMBER DROPLETS  --------------------
        if (this.type == 'number') {
            var nums = {
                radius: this.radius,
                pip: 0.05 * this.radius,
                a1cos: Math.cos(rads(0) + this.angle),
                a1sin: Math.sin(rads(0) + this.angle),
                r1: 0,
                a2cos: Math.cos(rads(0) + this.angle),
                a2sin: Math.sin(rads(0) + this.angle),
                r2: 0.667,
                a3cos: Math.cos(rads(90) + this.angle),
                a3sin: Math.sin(rads(90) + this.angle),
                r3: 0.500,
                a4cos: Math.cos(rads(36.73) + this.angle),
                a4sin: Math.sin(rads(36.73) + this.angle),
                r4: 0.8360,
                a5cos: Math.cos(rads(90) + this.angle),
                a5sin: Math.sin(rads(90) + this.angle),
                r5: 1.000,
                a6cos: Math.cos(rads(56.18) + this.angle),
                a6sin: Math.sin(rads(56.18) + this.angle),
                r6: 1.2037
            }
            //if (this.value == 0) {
                c.moveTo((this.posX + nums.radius * nums.r1 * nums.a1cos) * cScale,
                (this.posY - nums.radius * nums.r1 * nums.a1sin) * cScale);
                c.lineTo((this.posX + nums.radius * nums.r2 * nums.a2cos) * cScale,
                (this.posY - nums.radius * nums.r2 * nums.a2sin) * cScale);
                c.lineTo((this.posX + nums.radius * nums.r4 * nums.a4cos) * cScale,
                (this.posY - nums.radius * nums.r4 * nums.a4sin) * cScale);
                c.lineTo((this.posX + nums.radius * nums.r6 * nums.a6cos) * cScale,
                (this.posY - nums.radius * nums.r6 * nums.a6sin) * cScale);
                c.lineTo((this.posX + nums.radius * nums.r5 * nums.a5cos) * cScale,
                (this.posY - nums.radius * nums.r5 * nums.a5sin) * cScale);
                c.lineTo((this.posX + nums.radius * nums.r3 * nums.a3cos) * cScale,
                (this.posY - nums.radius * nums.r3 * nums.a3sin) * cScale);
                c.closePath();
                c.stroke();

                
                drawCircle((this.posX + nums.radius * nums.r1 * nums.a1cos) * cScale,
                (this.posY - nums.radius * nums.r1 * nums.a1sin) * cScale,
                nums.pip * cScale);
                c.stroke();
                drawCircle((this.posX + nums.radius * nums.r2 * nums.a2cos) * cScale,
                (this.posY - nums.radius * nums.r2 * nums.a2sin) * cScale,
                nums.pip * cScale);;
                c.stroke();
                drawCircle((this.posX + nums.radius * nums.r4 * nums.a4cos) * cScale,
                (this.posY - nums.radius * nums.r4 * nums.a4sin) * cScale,
                nums.pip * cScale);;
                c.stroke();
                drawCircle((this.posX + nums.radius * nums.r6 * nums.a6cos) * cScale,
                (this.posY - nums.radius * nums.r6 * nums.a6sin) * cScale,
                nums.pip * cScale);;
                c.stroke();
                drawCircle((this.posX + nums.radius * nums.r5 * nums.a5cos) * cScale,
                (this.posY - nums.radius * nums.r5 * nums.a5sin) * cScale,
                nums.pip * cScale);;
                c.stroke();
                drawCircle((this.posX + nums.radius * nums.r3 * nums.a3cos) * cScale,
                (this.posY - nums.radius * nums.r3 * nums.a3sin) * cScale,
                nums.pip * cScale);;
                c.stroke();
                
                
            //}
            /*
            if (this.value == 1) {
                c.lineTo((this.posX + nums.radius * nums.r2 * nums.a2cos) * cScale,
                (this.posY - nums.radius * nums.r2 * nums.a2sin) * cScale);
                c.lineTo((this.posX + nums.radius * nums.r4 * nums.a4cos) * cScale,
                (this.posY - nums.radius * nums.r4 * nums.a4sin) * cScale);
                c.lineTo((this.posX + nums.radius * nums.r6 * nums.a6cos) * cScale,
                (this.posY - nums.radius * nums.r6 * nums.a6sin) * cScale);
                c.closePath();
                c.stroke();
                drawCircle((this.posX + nums.radius * nums.r2 * nums.a2cos) * cScale,
                (this.posY - nums.radius * nums.r2 * nums.a2sin) * cScale,
                nums.pip * cScale);;
                c.stroke();
                drawCircle((this.posX + nums.radius * nums.r4 * nums.a4cos) * cScale,
                (this.posY - nums.radius * nums.r4 * nums.a4sin) * cScale,
                nums.pip * cScale);;
                c.stroke();
                drawCircle((this.posX + nums.radius * nums.r6 * nums.a6cos) * cScale,
                (this.posY - nums.radius * nums.r6 * nums.a6sin) * cScale,
                nums.pip * cScale);;
                c.stroke();
            }
            if (this.value == 2) {
                c.lineTo((this.posX + nums.radius * nums.r2 * nums.a2cos) * cScale,
                (this.posY - nums.radius * nums.r2 * nums.a2sin) * cScale);
                c.lineTo((this.posX + nums.radius * nums.r4 * nums.a4cos) * cScale,
                (this.posY - nums.radius * nums.r4 * nums.a4sin) * cScale);
                c.lineTo((this.posX + nums.radius * nums.r6 * nums.a6cos) * cScale,
                (this.posY - nums.radius * nums.r6 * nums.a6sin) * cScale);
                c.closePath();
                c.stroke();
                drawCircle((this.posX + nums.radius * nums.r2 * nums.a2cos) * cScale,
                (this.posY - nums.radius * nums.r2 * nums.a2sin) * cScale,
                nums.pip * cScale);;
                c.stroke();
                drawCircle((this.posX + nums.radius * nums.r4 * nums.a4cos) * cScale,
                (this.posY - nums.radius * nums.r4 * nums.a4sin) * cScale,
                nums.pip * cScale);;
                c.stroke();
                drawCircle((this.posX + nums.radius * nums.r6 * nums.a6cos) * cScale,
                (this.posY - nums.radius * nums.r6 * nums.a6sin) * cScale,
                nums.pip * cScale);;
                c.stroke();
            }
            */
        }

        //  CIRCLE DROPLETS  --------------------
        if (this.type == 'circle') {
            if (gradFillBox.checked == true) {
                var sphereGradient = c.createRadialGradient(
                    (this.posX - (0.3 * this.radius)) * cScale, 
                    (this.posY - (0.4 * this.radius)) * cScale, 
                    0.1 * this.radius * cScale, 
                    (this.posX - (0.3 * this.radius)) * cScale, 
                    (this.posY - (0.4 * this.radius)) * cScale, 
                    1.0 * this.radius * cScale);
                if (alphaBox.checked == true) {
                    var highlight =  `hsla(${this.hue + 30}, ${this.saturation}%, ${this.lightness}%, ${this.alpha}%)`;
                    var midtone =  `hsla(${this.hue}, ${this.saturation}%, ${this.lightness-60}%, ${this.alpha}%)`;
                } else {
                    var highlight =  `hsla(${this.hue + 30}, ${this.saturation}%, ${this.lightness}%)`;
                    var midtone =  `hsla(${this.hue}, ${this.saturation}%, ${this.lightness-60}%)`;
                }
                sphereGradient.addColorStop(0.1, highlight);
                sphereGradient.addColorStop(1.0, midtone);
                c.fillStyle = sphereGradient;
            } 
            drawCircle(this.posX * cScale, this.posY * cScale, this.radius * cScale);
        }

        //  BUBBLE DROPLETS  --------------------
        if (this.type == 'bubble') {
            if (gradFillBox.checked == true) {
                var sphereGradient = c.createRadialGradient(
                    this.posX * cScale, 
                    this.posY * cScale, 
                    0.1 * this.radius * cScale, 
                    this.posX * cScale, 
                    this.posY * cScale, 
                    1.0 * this.radius * cScale);
                if (alphaBox.checked == true) {
                    var highlight =  `hsla(${this.hue + 30}, ${this.saturation}%, ${this.lightness}%, ${this.alpha}%)`;
                    var midtone =  `hsla(${this.hue}, ${this.saturation}%, ${this.lightness-60}%, ${this.alpha}%)`;
                } else {
                    var highlight =  `hsla(${this.hue + 30}, ${this.saturation}%, ${this.lightness}%)`;
                    var midtone =  `hsla(${this.hue}, ${this.saturation}%, ${this.lightness-60}%)`;
                }
                sphereGradient.addColorStop(0.8, midtone);
                sphereGradient.addColorStop(1.0, highlight);
                
                c.fillStyle = sphereGradient;
            } 
            drawCircle(this.posX * cScale, this.posY * cScale, this.radius * cScale);
        }

        //  SOFT DROPLETS  --------------------
        if (this.type == 'soft') {
            if (gradFillBox.checked == true) {
                var sphereGradient = c.createRadialGradient(
                    this.posX * cScale, 
                    this.posY  * cScale, 
                    0.6 * this.radius * cScale, 
                    this.posX * cScale, 
                    this.posY * cScale, 
                    1.0 * this.radius * cScale);
                if (alphaBox.checked == true) {
                    var highlight =  `hsla(${this.hue + 30}, ${this.saturation}%, ${this.lightness}%, ${this.alpha}%)`;
                    var midtone =  `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, 0%)`;
                } else {
                    var highlight =  `hsla(${this.hue + 30}, ${this.saturation}%, ${this.lightness}%)`;
                    var midtone =  `hsla(${this.hue}, ${this.saturation}%, 0%)`;
                }
                sphereGradient.addColorStop(0.1, highlight);
                sphereGradient.addColorStop(1.0, midtone);
                c.fillStyle = sphereGradient;
            } 
            drawCircle(this.posX * cScale, this.posY * cScale, this.radius * cScale);
        }

        //  DUST DROPLETS  --------------------
        if (this.type == 'dust') {
            if (gradFillBox.checked == true) {
                var sphereGradient = c.createRadialGradient(
                    this.posX * cScale, 
                    this.posY  * cScale, 
                    0.6 * this.radius * cScale, 
                    this.posX * cScale, 
                    this.posY * cScale, 
                    1.0 * this.radius * cScale);
                
                sphereGradient.addColorStop(0.0, `hsla(0, 0%, 0%, ${this.alpha}%)`);
                sphereGradient.addColorStop(1.0, `hsla(0, 0%, 0%, ${this.alpha-100}%)`);
                c.fillStyle = sphereGradient;
            } 
            drawCircle(this.posX * cScale, this.posY * cScale, this.radius * cScale);
        }

        //  SPIRAL  --------------------
        if (this.type == 'spirals') {
            c.beginPath()
            c.moveTo(this.posX * cScale, this.posY * cScale);
            for (var f = 0; f < 6 * Math.PI; f += .1) {
                var drawX = this.posX + 0.05 * f * this.radius * Math.cos(-f + this.angle);
                var drawY = this.posY - 0.05 * f * this.radius * Math.sin(-f + this.angle);
                c.lineTo(drawX * cScale, drawY * cScale)
            }
            
            //c.closePath();
        }

        //  SMILEY DROPLETS  --------------------
        if (this.type == 'smiley' || this.type == 'pouty' || this.type == 'happy') {
            var sm = {
                radius: 0.08 * this.radius,
                radius2: 0.25 * this.radius,
                smileRad: 0.9 * this.radius,
            // 1 left eye
                a1cos: Math.cos(rads(135) + this.angle),
                a1sin: Math.sin(rads(135) + this.angle),
                rr1: 0.45 * this.radius,
            // 2 right eye
                a2cos: Math.cos(rads(45) + this.angle),
                a2sin: Math.sin(rads(45) + this.angle),
                rr2: 0.45 * this.radius,
            // 3 left mouth corner
                a3cos: Math.cos(rads(200) + this.angle),
                a3sin: Math.sin(rads(200) + this.angle),
                rr3: 0.8 * this.radius,
            // 4 right mouth corner
                a4cos: Math.cos(rads(340) + this.angle),
                a4sin: Math.sin(rads(340) + this.angle),
                rr4: 0.8 * this.radius,
            // 5 smile control point
                a5cos: Math.cos(rads(270) + this.angle),
                a5sin: Math.sin(rads(270) + this.angle),
                rr5: this.radius / 0.8,
            // 6 frown control point
                a6cos: Math.cos(rads(90) + this.angle),
                a6sin: Math.sin(rads(90) + this.angle),
                rr6: this.radius / 0.8,
            }

            // body  ---------
            drawCircle(this.posX * cScale, this.posY * cScale, this.radius * cScale);
            if (fillBox.checked == true || gradFillBox.checked == true) {
                c.fill();
            }
            if (noTraces.checked != true) {
                c.stroke();
            }

            if (alphaBox.checked == true) {
                if (fillBox.checked == true || gradFillBox.checked == true) {
                    if (whiteTraces.checked == true) {
                        c.strokeStyle = `hsla(0, 0%, 85%, ${this.alpha}%)`;
                        c.fillStyle = `hsla(0, 0%, 85%, ${this.alpha}%)`;
                    } 
                    if (blackTraces.checked == true || noTraces.checked == true) {
                        c.strokeStyle = `hsla(0, 0%, 0%, ${this.alpha}%)`;
                        c.fillStyle = `hsla(0, 0%, 0%, ${this.alpha}%)`;
                    }
                    if (colorTraces.checked == true) {
                        c.strokeStyle = `hsla(0, 0%, 0%, ${this.alpha}%)`;
                        c.fillStyle = `hsla(0, 0%, 0%, ${this.alpha}%)`;
                    }
                } else {
                    if (whiteTraces.checked == true) {
                        c.strokeStyle = `hsla(0, 0%, 85%, ${this.alpha}%)`;
                        c.fillStyle = `hsla(0, 0%, 85%, ${this.alpha}%)`;
                    } 
                    if (blackTraces.checked == true || noTraces.checked == true) {
                        c.strokeStyle = `hsla(0, 0%, 0%, ${this.alpha}%)`;
                        c.fillStyle = `hsla(0, 0%, 0%, ${this.alpha}%)`;
                    }
                    if (colorTraces.checked == true) {
                        c.strokeStyle = `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${this.alpha}%)`;
                        c.fillStyle = `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${this.alpha}%)`;
                    }
                }
            } else {
                if (fillBox.checked == true || gradFillBox.checked == true) {
                    if (whiteTraces.checked == true) {
                        c.strokeStyle = `hsl(0, 0%, 85%, ${this.alpha}%)`;
                        c.fillStyle = `hsl(0, 0%, 85%, ${this.alpha}%)`;
                    } 
                    if (blackTraces.checked == true || noTraces.checked == true) {
                        c.strokeStyle = `hsl(0, 0%, 0%, ${this.alpha}%)`;
                        c.fillStyle = `hsl(0, 0%, 0%, ${this.alpha}%)`;
                    }
                    if (colorTraces.checked == true) {
                        c.strokeStyle = `hsl(0, 0%, 0%, ${this.alpha}%)`;
                        c.fillStyle = `hsl(0, 0%, 0%, ${this.alpha}%)`;
                    }
                } else {
                    if (whiteTraces.checked == true) {
                        c.strokeStyle = `hsl(0, 0%, 85%)`;
                        c.fillStyle = `hsl(0, 0%, 85%)`;
                    } 
                    if (blackTraces.checked == true || noTraces.checked == true) {
                        c.strokeStyle = `hsl(0, 0%, 0%)`;
                        c.fillStyle = `hsl(0, 0%, 0%)`;
                    }
                    if (colorTraces.checked == true) {
                        c.strokeStyle = `hsl(${this.hue}, ${this.saturation}%, ${this.lightness}%)`;
                        c.fillStyle = `hsl(0, 0%, 0%)`;
                    }
                }
            }
            if (this.type == 'smiley') {
                var eyeMult = 1;
            } else {
                var eyeMult = 2;
            }
            // left eye  ---------
            drawCircle((this.posX + sm.rr1 * sm.a1cos) * cScale,
                (this.posY - sm.rr1 * sm.a1sin) * cScale, eyeMult * sm.radius * cScale);
            if (fillBox.checked == true || gradFillBox.checked == true) {
                c.fill();
            }
            c.fill();
            // right eye  ----------
            drawCircle((this.posX + sm.rr2 * sm.a2cos) * cScale,
                (this.posY - sm.rr2 * sm.a2sin) * cScale, eyeMult * sm.radius * cScale);
            if (fillBox.checked == true || gradFillBox.checked == true) {
                c.fill();
            }
            c.fill();

            // mouth  ----------
            c.lineWidth = .05 * this.radius * cScale;
            c.beginPath();
            if (this.type == 'smiley') {
                c.moveTo((this.posX + sm.rr3 * sm.a3cos) * cScale,
                    (this.posY - sm.rr3 * sm.a3sin) * cScale, sm.radius2 * cScale);
                c.arcTo((this.posX + sm.rr5 * sm.a5cos) * cScale,
                    (this.posY - sm.rr5 * sm.a5sin) * cScale, 
                    (this.posX + sm.rr4 * sm.a4cos) * cScale,
                    (this.posY - sm.rr4 * sm.a4sin) * cScale,
                    sm.smileRad * cScale);
                    c.stroke();
                    c.closePath();

                if (spinBox.checked == true || spinBox2.checked == true) {
                    //c.stroke();
                    if (Math.abs(this.spin) > 0.009) {
                        c.fillStyle = `hsl(0, 0%, 0%, ${this.alpha}%)`;
                    c.fill();
                    }
                }
                
            } else {  //  POUTY
                c.moveTo((this.posX + sm.rr3 * sm.a3cos) * cScale,
                    (this.posY - sm.rr3 * sm.a3sin) * cScale, sm.radius2 * cScale);
                c.arcTo((this.posX + sm.rr6 * sm.a6cos) * cScale,
                    (this.posY - sm.rr6 * sm.a6sin) * cScale, 
                    (this.posX + sm.rr4 * sm.a4cos) * cScale,
                    (this.posY - sm.rr4 * sm.a4sin) * cScale,
                    sm.smileRad * cScale);
                c.stroke();
                
            }
            c.beginPath();
            c.closePath();
        }

        //  MOON DROPLETS  ------------------
        if (this.type == 'moon') {
            var mm = {
            // 1 top tip
                a1cos: Math.cos(rads(284) + this.angle),
                a1sin: Math.sin(rads(284) + this.angle),
                r1: this.radius,
            // 2 bottom tip
                a2cos: Math.cos(rads(76) + this.angle),
                a2sin: Math.sin(rads(76) + this.angle),
                r2: this.radius,
            // 3 control point inner top
                a3cos: Math.cos(rads(237) + this.angle),
                a3sin: Math.sin(rads(237) + this.angle),
                r3: 0.85 * this.radius,
            // 4 midpoint of inner
                a4cos: Math.cos(rads(180) + this.angle),
                a4sin: Math.sin(rads(180) + this.angle),
                r4: 0.5 * this.radius,
            // 5 control point inner bottom
                a5cos: Math.cos(rads(123) + this.angle),
                a5sin: Math.sin(rads(123) + this.angle),
                r5: 0.92 * this.radius,
            // 7 outer control  bottom
                a7cos: Math.cos(rads(135) + this.angle),
                a7sin: Math.sin(rads(135) + this.angle),
                r7: Math.sqrt(2) * this.radius,
            // 8 outer midpoint
                a8cos: Math.cos(rads(180) + this.angle),
                a8sin: Math.sin(rads(180) + this.angle),
                r8: this.radius,
            // 9 outer control  top
                a9cos: Math.cos(rads(225) + this.angle),
                a9sin: Math.sin(rads(225) + this.angle),
                r9: Math.sqrt(2) * this.radius,
            }

            c.beginPath();

            // go to 2 - bottom tip
            c.moveTo((this.posX + mm.r2 * mm.a2cos) * cScale,
            (this.posY + mm.r2 * mm.a2sin) * cScale);

            // arc to 8 with 7 as control - to outer middle
            c.arcTo((this.posX + mm.r7 * mm.a7cos) * cScale,
            (this.posY + mm.r7 * mm.a7sin) * cScale,  
            (this.posX + mm.r8 * mm.a8cos) * cScale,
            (this.posY + mm.r8 * mm.a8sin) * cScale,
            this.radius * cScale);

            // arc to 1 with 9 as control - to top tip
            c.arcTo((this.posX + mm.r9 * mm.a9cos) * cScale,
            (this.posY + mm.r9 * mm.a9sin) * cScale,  
            (this.posX + mm.r1 * mm.a1cos) * cScale,
            (this.posY + mm.r1 * mm.a1sin) * cScale,
            this.radius * cScale);
            
            // arc to 4 with 3 as control - to inner middle
            c.arcTo((this.posX + mm.r3 * mm.a3cos) * cScale,
            (this.posY + mm.r3 * mm.a3sin) * cScale,  
            (this.posX + mm.r4 * mm.a4cos) * cScale,
            (this.posY + mm.r4 * mm.a4sin) * cScale,
            this.radius * cScale);

            // arc to 2 with 5 as control - to bottom tip
            c.arcTo((this.posX + mm.r5 * mm.a5cos) * cScale,
            (this.posY + mm.r5 * mm.a5sin) * cScale,  
            (this.posX + mm.r2 * mm.a2cos) * cScale,
            (this.posY + mm.r2 * mm.a2sin) * cScale,
            this.radius * cScale);
        
        }

        //  STICK MAN DROPLETS  ------------------
        if (this.type == 'stickMan') {
            var sm = {
                eye: 0.03 * this.radius,
                //mouth: 0.02 * this.radius,
                head: 0.2 * this.radius,
                radius: 2 * this.radius,
                // 1 right foot 
                a1cos: Math.cos(rads(290) + this.angle),
                a1sin: Math.sin(rads(290) + this.angle),
                r1: 0.6,
                // 2 inseam
                a2cos: Math.cos(rads(270) + this.angle),
                a2sin: Math.sin(rads(270) + this.angle),
                r2: 0.1,
                // 3 shoulder
                a3cos: Math.cos(rads(90) + this.angle),
                a3sin: Math.sin(rads(90) + this.angle),
                r3: 0.1,
                // 4 right hand
                a4cos: Math.cos(rads(30) + this.angle),
                a4sin: Math.sin(rads(30) + this.angle),
                r4: 0.4,
                // 5 neck
                a5cos: Math.cos(rads(90) + this.angle),
                a5sin: Math.sin(rads(90) + this.angle),
                r5: 0.2,
                // 6 head
                a6cos: Math.cos(rads(90) + this.angle),
                a6sin: Math.sin(rads(90) + this.angle),
                r6: 0.3,
                // 7 left hand
                a7cos: Math.cos(rads(150) + this.angle),
                a7sin: Math.sin(rads(150) + this.angle),
                r7: 0.4,
                // 8 left foot 
                a8cos: Math.cos(rads(250) + this.angle),
                a8sin: Math.sin(rads(250) + this.angle),
                r8: 0.6,
                // 9 right eye
                a9cos: Math.cos(rads(85) + this.angle),
                a9sin: Math.sin(rads(85) + this.angle),
                r9: 0.32,
                // 10 left eye
                a10cos: Math.cos(rads(95) + this.angle),
                a10sin: Math.sin(rads(95) + this.angle),
                r10: 0.32,
                // 11 mouth
                a11cos: Math.cos(rads(90) + this.angle),
                a11sin: Math.sin(rads(90) + this.angle),
                r11: 0.25,
            }
            //  right leg and body  ---------
            c.beginPath();
            c.moveTo((this.posX + sm.radius * sm.r1 * sm.a1cos) * cScale,
                (this.posY - sm.radius * sm.r1 * sm.a1sin) * cScale);
            c.lineTo((this.posX + sm.radius * sm.r2 * sm.a2cos) * cScale,
                (this.posY - sm.radius * sm.r2 * sm.a2sin) * cScale);
            c.lineTo((this.posX + sm.radius * sm.r5 * sm.a5cos) * cScale,
                (this.posY - sm.radius * sm.r5 * sm.a5sin) * cScale);
            c.lineWidth = 0.06 * this.radius * cScale;
            c.stroke();
            // right and left arms  -----------
            c.beginPath();
            c.moveTo((this.posX + sm.radius * sm.r4 * sm.a4cos) * cScale,
                (this.posY - sm.radius * sm.r4 * sm.a4sin) * cScale);
            c.lineTo((this.posX + sm.radius * sm.r3 * sm.a3cos) * cScale,
                (this.posY - sm.radius * sm.r3 * sm.a3sin) * cScale);
            c.lineTo((this.posX + sm.radius * sm.r7 * sm.a7cos) * cScale,
                (this.posY - sm.radius * sm.r7 * sm.a7sin) * cScale);
            c.lineWidth = 0.05 * this.radius * cScale;
            c.stroke();
            // left leg  ----------
            c.beginPath();
            c.moveTo((this.posX + sm.radius * sm.r2 * sm.a2cos) * cScale,
                (this.posY - sm.radius * sm.r2 * sm.a2sin) * cScale);
            c.lineTo((this.posX + sm.radius * sm.r8 * sm.a8cos) * cScale,
                (this.posY - sm.radius * sm.r8 * sm.a8sin) * cScale);
            c.lineWidth = 0.06 * this.radius * cScale;
            c.stroke();
            //  head ----------
            drawCircle((this.posX + sm.radius * sm.r6 * sm.a6cos) * cScale,
                (this.posY - sm.radius * sm.r6 * sm.a6sin) * cScale, sm.head * cScale);
            if (fillBox.checked == true || gradFillBox.checked == true) {
                c.fill();
                //c.stroke();
            } else {
                c.lineWidth = 0.03 * this.radius * cScale;
                c.stroke();
            }
            //  eyes  ----------
            drawCircle((this.posX + sm.radius * sm.r9 * sm.a9cos) * cScale,
                (this.posY - sm.radius * sm.r9 * sm.a9sin) * cScale, sm.eye * cScale);
            if (fillBox.checked == true || gradFillBox.checked == true) {
                c.fillStyle = `hsl(0, 0%, 0%, ${this.alpha}%)`;
                c.fill();
            } else {
                c.lineWidth = 0.03 * this.radius * cScale;
                c.fill();
            }
            drawCircle((this.posX + sm.radius * sm.r10 * sm.a10cos) * cScale,
                (this.posY - sm.radius * sm.r10 * sm.a10sin) * cScale, sm.eye * cScale);
            if (fillBox.checked == true || gradFillBox.checked == true) {
                c.fill();
            } else {
                c.lineWidth = 1;
                c.fill();
            }
            //  mouth  ----------
            if (spinBox.checked == true) {
                var mouth = 0.02 * this.radius * (1 + Math.abs(this.spin) * 100);   
            } else 
            if (spinBox2.checked == true) {
                var mouth = 0.05 * this.radius * (1 + Math.abs(this.spin) * 100);   
            } else {
                var mouth = 0;
            }
            drawCircle((this.posX + sm.radius * sm.r11 * sm.a11cos) * cScale,
                (this.posY - sm.radius * sm.r11 * sm.a11sin) * cScale, mouth * cScale);
            if (fillBox.checked == true || gradFillBox.checked == true) {
                c.fill();
            } 
        }

        //  PIZZA DROPLETS  -----------------
        if (this.type == 'pizza') {
            if (fillBox.checked == true || gradFillBox.checked == true) {
                if (alphaBox.checked == true) {
                    crust = `hsla(0, 00%, 0%, ${this.alpha}%)`;
                    roni = `hsla(10, 100%, ${this.lightness}%, ${this.alpha}%)`;
                    roniskin = `hsla(0, 0%, ${this.lightness-50}%, ${this.alpha}%)`;
                    olive = `hsla(0, 0%, 0%, ${this.alpha}%)`;
                    
                } else {
                    crust = `hsl(0, 20%, ${this.lightness})`;
                    roni = `hsl(10, 100%, ${this.lightness})`;
                    roniskin = `hsl(0, 0%, ${this.lightness}%)`;
                    olive = 'black';
                }
            } else {
                if (alphaBox.checked == true) {
                    crust = `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}% %, ${this.lightness}%, ${this.alpha}%)`;
                    roni = `hsla(10, 100%, ${this.lightness}%, ${this.alpha}%)`;
                    roniskin = `hsla(0, 0%, 90%, ${this.alpha}%)`;
                    olive = `hsla(0, 0%, 80%, ${this.alpha}%)`;
                    
                } else {
                    crust = `hsl(0, 20%, ${this.lightness})`;
                    roni = `hsl(10, 100%, ${this.lightness})`;
                    roniskin = `hsl(0, 0%, ${this.lightness}%)`;
                    olive = 'black';
                }
            }
            var pizzaRadius = 2 * this.radius;
            var slice = 360 / 8;
            var pp = {
                // 1 outer crust bottom corner
                a1cos: Math.cos(rads(0) + this.angle),
                a1sin: Math.sin(rads(0) + this.angle),
                r1: 0,
                // 2 outer crust top corner
                a2cos: Math.cos(rads(slice) + this.angle),
                a2sin: Math.sin(rads(slice) + this.angle),
                r2: 0,
                // 3 outer crust control point
                a3cos: Math.cos(rads(0.5 * slice) + this.angle),
                a3sin: Math.sin(rads(0.5 * slice) + this.angle),
                r3: 1.08 * pizzaRadius,
                // 4 inner crust bottom corner
                a4cos: Math.cos(rads(0) + this.angle),
                a4sin: Math.sin(rads(0) + this.angle),
                r4: 0,
                // 5 inner crust top corner
                a5cos: Math.cos(rads(slice) + this.angle),
                a5sin: Math.sin(rads(slice) + this.angle),
                r5: 0,
                // 6 inner crust control point
                a6cos: Math.cos(rads(0.5 * slice) + this.angle),
                a6sin: Math.sin(rads(0.5 * slice) + this.angle),
                r6: 1.09 * 0.9 * pizzaRadius,

                // 7 full salami slice #1
                a7cos: Math.cos(rads(0.3 * slice) + this.angle),
                a7sin: Math.sin(rads(0.3 * slice) + this.angle),
                r7: 0.5 * pizzaRadius,
                rr7: 0.07 * pizzaRadius,
                
                // 7b full salami slice #2
                a7bcos: Math.cos(rads(0.7 * slice) + this.angle),
                a7bsin: Math.sin(rads(0.7 * slice) + this.angle),
                r7b: 0.75 * pizzaRadius,
                rr7b: 0.07 * pizzaRadius,

                // 8 olive slice outer
                a8cos: Math.cos(rads(0.65 * slice) + this.angle),
                a8sin: Math.sin(rads(0.65 * slice) + this.angle),
                r8: 0.3 * pizzaRadius,
                rr8: 0.025 * pizzaRadius,
                // 9 olive slice inner
                a9cos: Math.cos(rads(0.65 * slice) + this.angle),
                a9sin: Math.sin(rads(0.65 * slice) + this.angle),
                r9: 0.3 * pizzaRadius,
                rr9: 0.015 * pizzaRadius,
                // 8b olive slice outer
                a8bcos: Math.cos(rads(0.2 * slice) + this.angle),
                a8bsin: Math.sin(rads(0.2 * slice) + this.angle),
                r8b: 0.8 * pizzaRadius,
                rr8b: 0.025 * pizzaRadius,
                // 9b olive slice inner
                a9bcos: Math.cos(rads(0.2 * slice) + this.angle),
                a9bsin: Math.sin(rads(0.2 * slice) + this.angle),
                r9b: 0.8 * pizzaRadius,
                rr9b: 0.015 * pizzaRadius,


                // 10 half salami slice #1 - left start of arc
                a10cos: Math.cos(rads(0) + this.angle),
                a10sin: Math.sin(rads(0) + this.angle),
                r10: 0.5 * pizzaRadius,
                rr10: 0.07 * pizzaRadius,
                // 11 half salami slice #1 - left control point
                a11cos: Math.cos(rads(10.3 * slice) + this.angle),
                a11sin: Math.sin(rads(10.3 * slice) + this.angle),
                r11: 0.5 * pizzaRadius,
                // 12 half salami slice #1 - top quad
                a12cos: Math.cos(rads(8.8 * slice) + this.angle),
                a12sin: Math.sin(rads(8.8 * slice) + this.angle),
                r12: 0.5 * pizzaRadius + 0.5 * 0.07 * pizzaRadius,
                // 13 half salami slice #1 - right control point
                a13cos: Math.cos(rads(7.6 * slice) + this.angle),
                a13sin: Math.sin(rads(7.6 * slice) + this.angle),
                r13: 0.5 * pizzaRadius + 0.07 * pizzaRadius,
                // 14 half salami slice #1 - right end of arc
                a14cos: Math.cos(rads(7.6 * slice) + this.angle),
                a14sin: Math.sin(rads(7.6 * slice) + this.angle),
                r14: 0.5 * pizzaRadius + 0.07 * pizzaRadius,

            


            }

            // SLICE OUTLINE ---------
            c.beginPath();
            c.moveTo(this.posX * cScale, this.posY * cScale);

            c.lineTo((this.posX + pizzaRadius * pp.a1cos) * cScale,  // outer crust bottom corner
                (this.posY - pizzaRadius * pp.a1sin) * cScale)
            c.arcTo((this.posX + pp.r3 * pp.a3cos) * cScale,  // outer crust control point
                (this.posY - pp.r3 * pp.a3sin) * cScale, 
                (this.posX + pizzaRadius * pp.a2cos) * cScale,  // outer crust top corner
                (this.posY - pizzaRadius * pp.a2sin) * cScale, 
                pizzaRadius * cScale);
            c.lineTo(this.posX * cScale, this.posY * cScale);  // point
            if (fillBox.checked == true || gradFillBox == true) {
                c.fill();
            }
            if (noTraces.checked != true) {
                c.stroke();
            }

            // CRUST LINE ---------
            c.beginPath();
            c.moveTo((this.posX + pizzaRadius * pp.a1cos) * cScale,  // outer crust bottom corner
                (this.posY - pizzaRadius * pp.a1sin) * cScale);
            c.arcTo((this.posX + pp.r3 * pp.a3cos) * cScale,  // outer crust control point
                (this.posY - pp.r3 * pp.a3sin) * cScale, 
                (this.posX + pizzaRadius * pp.a2cos) * cScale,  // outer crust top corner
                (this.posY - pizzaRadius * pp.a2sin) * cScale, 
                pizzaRadius * cScale);
            c.lineTo((this.posX + 0.9 * pizzaRadius * pp.a5cos) * cScale,  // inner crust top corner
                (this.posY - 0.9 * pizzaRadius * pp.a5sin) * cScale);

            c.arcTo((this.posX + pp.r6 * pp.a6cos) * cScale,  // inner crust control point
                (this.posY - pp.r6 * pp.a6sin) * cScale, 
                (this.posX + 0.9 * pizzaRadius * pp.a1cos) * cScale,  // inner crust bottom corner
                (this.posY - 0.9 * pizzaRadius * pp.a1sin) * cScale, 
                0.9 * pizzaRadius * cScale);
            c.closePath();
            c.fill();

            if (noTraces.checked != true) {
                c.strokeStyle = crust;
                c.lineWidth = .02 * pizzaRadius * cScale;
                c.stroke();
            }
            // SALAMI 1 ---------
            drawCircle((this.posX + pp.r7 * pp.a7cos) * cScale,
                (this.posY - pp.r7 * pp.a7sin) * cScale,
                pp.rr7 * cScale)
            if (fillBox.checked == true || gradFillBox == true) {
                c.fillStyle = roni;
                c.fill();
            }
            if (noTraces.checked != true) {
                c.strokeStyle = roniskin;
                c.lineWidth = .015 * pizzaRadius * cScale;
                c.stroke();
            }
            // SALAMI 2 ---------
            drawCircle((this.posX + pp.r7b * pp.a7bcos) * cScale,
                (this.posY - pp.r7b * pp.a7bsin) * cScale,
                pp.rr7 * cScale)
            if (fillBox.checked == true || gradFillBox == true) {
                c.fill();
            }
            if (noTraces.checked != true) {
                c.strokeStyle = roniskin;
                c.stroke();
            }
            /*
            // HALF SALAMI SLICE ----------
            c.beginPath();
            c.moveTo((this.posX + pp.r10 * pp.a10cos) * cScale,  // half salami inside start of arc
                (this.posY - pp.r10 * pp.a10sin) * cScale);
            c.arcTo((this.posX + pp.r11 * pp.a11cos) * cScale,  // half salami left control point
                (this.posY - pp.r11 * pp.a11sin) * cScale, 
                (this.posX + pp.r12 * pp.a12cos) * cScale,  // half salami upper quad
                (this.posY - pp.r12 * pp.a12sin) * cScale, 
                0.07 * pizzaRadius * cScale);
            c.arcTo((this.posX + pp.r13 * pp.a13cos) * cScale,  // half salami left control point
                (this.posY - pp.r13 * pp.a13sin) * cScale, 
                (this.posX + pp.r14 * pp.a14cos) * cScale,  // half salami upper quad
                (this.posY - pp.r14 * pp.a14sin) * cScale, 
                0.07 * pizzaRadius * cScale);
            c.closePath();
            if (fillBox.checked == true || gradFillBox == true) {
                c.fill();
            }
            if (noTraces.checked != true) {
                c.strokeStyle = roniskin;
                c.stroke();
            }*/
            // OLIVE 1 ---------
            drawCircle((this.posX + pp.r8 * pp.a8cos) * cScale,  // outer
                (this.posY - pp.r8 * pp.a8sin) * cScale,
                pp.rr8 * cScale)
                c.strokeStyle = olive;
                c.lineWidth = .03 * pizzaRadius * cScale;
                c.stroke();
            // OLIVE 2 ---------
            drawCircle((this.posX + pp.r8b * pp.a8bcos) * cScale, // outer
                (this.posY - pp.r8b * pp.a8bsin) * cScale,
                pp.rr8b * cScale);
                c.stroke();
        }

        //  MUSHROOM DROPLETS
        if (this.type == 'shroom') {
            var mr = {
                // 1 stem right bottom
                a1cos: Math.cos(rads(0) + this.angle),
                a1sin: Math.sin(rads(0) + this.angle),
                r1: 0.200 * this.radius,
                // 2 stem right top
                a2cos: Math.cos(rads(70) + this.angle),
                a2sin: Math.sin(rads(70) + this.angle),
                r2: 0.5852 * this.radius,
                // 3 cap right end
                a3cos: Math.cos(rads(35) + this.angle),
                a3sin: Math.sin(rads(35) + this.angle),
                r3: 0.781 * this.radius,
                // 4 right cap control 
                a4cos: Math.cos(rads(67.0) + this.angle),
                a4sin: Math.sin(rads(67.0) + this.angle),
                r4: 1.087 * this.radius,
                // 5 cap tip
                a5cos: Math.cos(rads(90) + this.angle),
                a5sin: Math.sin(rads(90) + this.angle),
                r5: 1.0 * this.radius,
                // 6 left cap control
                a6cos: Math.cos(rads(113) + this.angle),
                a6sin: Math.sin(rads(113) + this.angle),
                r6: 1.087 * this.radius,
                // 7 cap left end
                a7cos: Math.cos(rads(145) + this.angle),
                a7sin: Math.sin(rads(145) + this.angle),
                r7: 0.781 * this.radius,
                // 8 stem right top
                a8cos: Math.cos(rads(110) + this.angle),
                a8sin: Math.sin(rads(110) + this.angle),
                r8: 0.5852 * this.radius,
                // 9 stem left bottom
                a9cos: Math.cos(rads(180) + this.angle),
                a9sin: Math.sin(rads(180) + this.angle),
                r9: 0.2 * this.radius,
            }
            c.beginPath();
            // 1 
            c.moveTo((this.posX + mr.r1 * mr.a1cos) * cScale,
                (this.posY - mr.r1 * mr.a1sin) * cScale);
            // 2
            c.lineTo((this.posX + mr.r2 * mr.a2cos) * cScale,
                (this.posY - mr.r2 * mr.a2sin) * cScale);
            // 3
            c.lineTo((this.posX + mr.r3 * mr.a3cos) * cScale,
                (this.posY - mr.r3 * mr.a3sin) * cScale);
            // 4 to 5
            c.arcTo((this.posX + mr.r4 * mr.a4cos) * cScale,
                (this.posY - mr.r4 * mr.a4sin) * cScale,
                (this.posX + mr.r5 * mr.a5cos) * cScale,
                (this.posY - mr.r5 * mr.a5sin) * cScale,
                0.6 * this.radius * cScale);
            // 5
            c.lineTo((this.posX + mr.r5 * mr.a5cos) * cScale,
                (this.posY - mr.r5 * mr.a5sin) * cScale);
            // 6 to 7
            c.arcTo((this.posX + mr.r6 * mr.a6cos) * cScale,
                (this.posY - mr.r6 * mr.a6sin) * cScale,
                (this.posX + mr.r7 * mr.a7cos) * cScale,
                (this.posY - mr.r7 * mr.a7sin) * cScale,
                0.6 * this.radius * cScale);
            // 7
                c.lineTo((this.posX + mr.r7 * mr.a7cos) * cScale,
                (this.posY - mr.r7 * mr.a7sin) * cScale);
            // 8
            c.lineTo((this.posX + mr.r8 * mr.a8cos) * cScale,
                (this.posY - mr.r8 * mr.a8sin) * cScale);
            // 9
            c.lineTo((this.posX + mr.r9 * mr.a9cos) * cScale,
                (this.posY - mr.r9 * mr.a9sin) * cScale);
            c.closePath();
        }

        //  ARROW DROPLETS  ------------------
        if (this.type == 'fancyArrow' || this.type == 'plainArrow') {
            if (this.type == 'plainArrow') {
                var cc = {
                radius: 2 * this.radius,
                // 1 bottom right
                a1cos: Math.cos(rads(281.86) + this.angle),
                a1sin: Math.sin(rads(281.86) + this.angle),
                r1: 0.5109,
                // 2 right inside corner
                a2cos: Math.cos(rads(43.6) + this.angle),
                a2sin: Math.sin(rads(43.6) + this.angle),
                r2: 0.1450,
                // 3 right tip
                a3cos: Math.cos(rads(16.86) + this.angle),
                a3sin: Math.sin(rads(16.86) + this.angle),
                r3: 0.3448,
                // 4 top
                a4cos: Math.cos(rads(90) + this.angle),
                a4sin: Math.sin(rads(90) + this.angle),
                r4: 0.5,
                // 5 left tip
                a5cos: Math.cos(rads(163.14) + this.angle),
                a5sin: Math.sin(rads(163.14) + this.angle),
                r5: 0.3448,
                // 6 left inside corner
                a6cos: Math.cos(rads(136.4) + this.angle),
                a6sin: Math.sin(rads(136.4) + this.angle),
                r6: 0.1450,
                // 7 bottom left
                a7cos: Math.cos(rads(258.14) + this.angle),
                a7sin: Math.sin(rads(258.14) + this.angle),
                r7: 0.5109,
                // 8 bottom center
                a8cos: Math.cos(rads(270) + this.angle),
                a8sin: Math.sin(rads(270) + this.angle),
                r8: 0.5,
                }
            } 
            if (this.type == 'fancyArrow') {
                var cc = {
                radius: 2 * this.radius,
                // 1 bottom right
                a1cos: Math.cos(rads(280) + this.angle),
                a1sin: Math.sin(rads(280) + this.angle),
                r1: 0.55,
                // 2 right inside corner
                a2cos: Math.cos(rads(60) + this.angle),
                a2sin: Math.sin(rads(60) + this.angle),
                r2: 0.1,
                // 3 right tip
                a3cos: Math.cos(rads(340) + this.angle),
                a3sin: Math.sin(rads(340) + this.angle),
                r3: 0.3,
                // 4 top
                a4cos: Math.cos(rads(90) + this.angle),
                a4sin: Math.sin(rads(90) + this.angle),
                r4: 0.5,
                // 5 left tip
                a5cos: Math.cos(rads(200) + this.angle),
                a5sin: Math.sin(rads(200) + this.angle),
                r5: 0.3,
                // 6 left inside corner
                a6cos: Math.cos(rads(120) + this.angle),
                a6sin: Math.sin(rads(120) + this.angle),
                r6: 0.1,
                // 7 bottom left
                a7cos: Math.cos(rads(260) + this.angle),
                a7sin: Math.sin(rads(260) + this.angle),
                r7: 0.55,
                // 8 bottom center
                a8cos: Math.cos(rads(270) + this.angle),
                a8sin: Math.sin(rads(270) + this.angle),
                r8: 0.35,
                }
            }
            c.beginPath();
            c.moveTo((this.posX + cc.radius * cc.r1 * cc.a1cos) * cScale,
                (this.posY - cc.radius * cc.r1 * cc.a1sin) * cScale);
            c.lineTo((this.posX + cc.radius * cc.r2 * cc.a2cos) * cScale,
                (this.posY - cc.radius * cc.r2 * cc.a2sin) * cScale);
            c.lineTo((this.posX + cc.radius * cc.r3 * cc.a3cos) * cScale,
                (this.posY - cc.radius * cc.r3 * cc.a3sin) * cScale);
            c.lineTo((this.posX + cc.radius * cc.r4 * cc.a4cos) * cScale,
                (this.posY - cc.radius * cc.r4 * cc.a4sin) * cScale);
            c.lineTo((this.posX + cc.radius * cc.r5 * cc.a5cos) * cScale,
                (this.posY - cc.radius * cc.r5 * cc.a5sin) * cScale);
            c.lineTo((this.posX + cc.radius * cc.r6 * cc.a6cos) * cScale,
                (this.posY - cc.radius * cc.r6 * cc.a6sin) * cScale);
            c.lineTo((this.posX + cc.radius * cc.r7 * cc.a7cos) * cScale,
                (this.posY - cc.radius * cc.r7 * cc.a7sin) * cScale);
            c.lineTo((this.posX + cc.radius * cc.r8 * cc.a8cos) * cScale,
                (this.posY - cc.radius * cc.r8 * cc.a8sin) * cScale);
            c.closePath();
        }

        //  MAPLE LEAF DROPLETS  ------------------
        if (this.type == 'canuck') {
            var ml = {
            radius: 2 * this.radius,
            // 1 -25
            a1cos: Math.cos(rads(273) + this.angle),
            a1sin: Math.sin(rads(273) + this.angle),
            r1: 0.501,
            // 2 -24
            a2cos: Math.cos(rads(273) + this.angle),
            a2sin: Math.sin(rads(273) + this.angle),
            r2: 0.248,
            // 3 -23
            a3cos: Math.cos(rads(311) + this.angle),
            a3sin: Math.sin(rads(311) + this.angle),
            r3: 0.380,
            // 4 -22
            a4cos: Math.cos(rads(315) + this.angle),
            a4sin: Math.sin(rads(315) + this.angle),
            r4: 0.312,
            // 5 -21
            a5cos: Math.cos(rads(2) + this.angle),
            a5sin: Math.sin(rads(2) + this.angle),
            r5: 0.477,
            // 6 -20
            a6cos: Math.cos(rads(3) + this.angle),
            a6sin: Math.sin(rads(3) + this.angle),
            r6: 0.393,
            // 7 -19
            a7cos: Math.cos(rads(22) + this.angle),
            a7sin: Math.sin(rads(22) + this.angle),
            r7: 0.469,
            // 8 -18
            a8cos: Math.cos(rads(27) + this.angle),
            a8sin: Math.sin(rads(27) + this.angle),
            r8: 0.310,
            // 9 -17
            a9cos: Math.cos(rads(39) + this.angle),
            a9sin: Math.sin(rads(39) + this.angle),
            r9: 0.347,
            // 10 -16
            a10cos: Math.cos(rads(34) + this.angle),
            a10sin: Math.sin(rads(34) + this.angle),
            r10: 0.167,
            // 11 -15
            a11cos: Math.cos(rads(64) + this.angle),
            a11sin: Math.sin(rads(64) + this.angle),
            r11: 0.430,
            // 12 -14
            a12cos: Math.cos(rads(75) + this.angle),
            a12sin: Math.sin(rads(75) + this.angle),
            r12: 0.339,
            // 13 
            a13cos: Math.cos(rads(90) + this.angle),
            a13sin: Math.sin(rads(90) + this.angle),
            r13: 0.50,
            // 12 -14
            a14cos: Math.cos(rads(180 - 75) + this.angle),
            a14sin: Math.sin(rads(180 - 75) + this.angle),
            r14: 0.339,
            // 11 -15
            a15cos: Math.cos(rads(180 - 64) + this.angle),
            a15sin: Math.sin(rads(180 - 64) + this.angle),
            r15: 0.430,
            // 10 -16
            a16cos: Math.cos(rads(180 - 34) + this.angle),
            a16sin: Math.sin(rads(180 - 34) + this.angle),
            r16: 0.167,
            // 9 -17
            a17cos: Math.cos(rads(180 - 39) + this.angle),
            a17sin: Math.sin(rads(180 - 39) + this.angle),
            r17: 0.347,
            // 8 -18
            a18cos: Math.cos(rads(180 - 27) + this.angle),
            a18sin: Math.sin(rads(180 - 27) + this.angle),
            r18: 0.310,
            // 7 -19
            a19cos: Math.cos(rads(180 - 22) + this.angle),
            a19sin: Math.sin(rads(180 - 22) + this.angle),
            r19: 0.469,
            // 6 -20
            a20cos: Math.cos(rads(177) + this.angle),
            a20sin: Math.sin(rads(177) + this.angle),
            r20: 0.393,
            // 5 -21
            a21cos: Math.cos(rads(178) + this.angle),
            a21sin: Math.sin(rads(178) + this.angle),
            r21: 0.477,
            // 4 -22
            a22cos: Math.cos(rads(225) + this.angle),
            a22sin: Math.sin(rads(225) + this.angle),
            r22: 0.312,
            // 3 -23
            a23cos: Math.cos(rads(229) + this.angle),
            a23sin: Math.sin(rads(229) + this.angle),
            r23: 0.380,
            // 2 -24
            a24cos: Math.cos(rads(267) + this.angle),
            a24sin: Math.sin(rads(267) + this.angle),
            r24: 0.248,
            // 1 -25
            a25cos: Math.cos(rads(267) + this.angle),
            a25sin: Math.sin(rads(267) + this.angle),
            r25: 0.501,

        
            }
            c.beginPath();
            c.moveTo((this.posX + ml.radius * ml.r1 * ml.a1cos) * cScale,
                (this.posY - ml.radius * ml.r1 * ml.a1sin) * cScale);
            c.lineTo((this.posX + ml.radius * ml.r2 * ml.a2cos) * cScale,
                (this.posY - ml.radius * ml.r2 * ml.a2sin) * cScale);
            c.lineTo((this.posX + ml.radius * ml.r3 * ml.a3cos) * cScale,
                (this.posY - ml.radius * ml.r3 * ml.a3sin) * cScale);
            c.lineTo((this.posX + ml.radius * ml.r4 * ml.a4cos) * cScale,
                (this.posY - ml.radius * ml.r4 * ml.a4sin) * cScale);
            c.lineTo((this.posX + ml.radius * ml.r5 * ml.a5cos) * cScale,
                (this.posY - ml.radius * ml.r5 * ml.a5sin) * cScale);
            c.lineTo((this.posX + ml.radius * ml.r6 * ml.a6cos) * cScale,
                (this.posY - ml.radius * ml.r6 * ml.a6sin) * cScale);
            c.lineTo((this.posX + ml.radius * ml.r7 * ml.a7cos) * cScale,
                (this.posY - ml.radius * ml.r7 * ml.a7sin) * cScale);
            c.lineTo((this.posX + ml.radius * ml.r8 * ml.a8cos) * cScale,
                (this.posY - ml.radius * ml.r8 * ml.a8sin) * cScale);
            c.lineTo((this.posX + ml.radius * ml.r9 * ml.a9cos) * cScale,
                (this.posY - ml.radius * ml.r9 * ml.a9sin) * cScale);
            c.lineTo((this.posX + ml.radius * ml.r10 * ml.a10cos) * cScale,
                (this.posY - ml.radius * ml.r10 * ml.a10sin) * cScale);
            c.lineTo((this.posX + ml.radius * ml.r11 * ml.a11cos) * cScale,
                (this.posY - ml.radius * ml.r11 * ml.a11sin) * cScale);
            c.lineTo((this.posX + ml.radius * ml.r12 * ml.a12cos) * cScale,
                (this.posY - ml.radius * ml.r12 * ml.a12sin) * cScale);
            c.lineTo((this.posX + ml.radius * ml.r13 * ml.a13cos) * cScale,
                (this.posY - ml.radius * ml.r13 * ml.a13sin) * cScale);
            c.lineTo((this.posX + ml.radius * ml.r14 * ml.a14cos) * cScale,
                (this.posY - ml.radius * ml.r14 * ml.a14sin) * cScale);
            c.lineTo((this.posX + ml.radius * ml.r15 * ml.a15cos) * cScale,
                (this.posY - ml.radius * ml.r15 * ml.a15sin) * cScale);
            c.lineTo((this.posX + ml.radius * ml.r16 * ml.a16cos) * cScale,
                (this.posY - ml.radius * ml.r16 * ml.a16sin) * cScale);
            c.lineTo((this.posX + ml.radius * ml.r17 * ml.a17cos) * cScale,
                (this.posY - ml.radius * ml.r17 * ml.a17sin) * cScale);
            c.lineTo((this.posX + ml.radius * ml.r18 * ml.a18cos) * cScale,
                (this.posY - ml.radius * ml.r18 * ml.a18sin) * cScale);
            c.lineTo((this.posX + ml.radius * ml.r19 * ml.a19cos) * cScale,
                (this.posY - ml.radius * ml.r19 * ml.a19sin) * cScale);
            c.lineTo((this.posX + ml.radius * ml.r20 * ml.a20cos) * cScale,
                (this.posY - ml.radius * ml.r20 * ml.a20sin) * cScale);
            c.lineTo((this.posX + ml.radius * ml.r21 * ml.a21cos) * cScale,
                (this.posY - ml.radius * ml.r21 * ml.a21sin) * cScale);
            c.lineTo((this.posX + ml.radius * ml.r22 * ml.a22cos) * cScale,
                (this.posY - ml.radius * ml.r22 * ml.a22sin) * cScale);
            c.lineTo((this.posX + ml.radius * ml.r23 * ml.a23cos) * cScale,
                (this.posY - ml.radius * ml.r23 * ml.a23sin) * cScale);
            c.lineTo((this.posX + ml.radius * ml.r24 * ml.a24cos) * cScale,
                (this.posY - ml.radius * ml.r24 * ml.a24sin) * cScale);
            c.lineTo((this.posX + ml.radius * ml.r25 * ml.a25cos) * cScale,
                (this.posY - ml.radius * ml.r25 * ml.a25sin) * cScale);
            
            c.closePath();
        }

        //  CONCENTRIC CIRCLE DROPLETS  ------------------
        if (this.type == 'concCircle') {
            // outer ring  ----------
            drawCircle(this.posX * cScale, this.posY * cScale, 1.4 * this.radius * cScale);
            if (whiteTraces.checked == true) {
                c.strokeStyle = `hsla(0, 0%, 85%, ${this.alpha - 45}%)`;
            } 
            if (blackTraces.checked == true) {
                c.strokeStyle = `hsla(0, 0%, 0%, ${this.alpha - 45}%)`;
            }
            if (colorTraces.checked == true) {
                c.strokeStyle = `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${this.alpha - 60}%)`;
            }
            c.fillStyle = `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${this.alpha - 60}%)`;
            if (fillBox.checked == true || gradFillBox.checked == true) {
                c.fill();
            }
            if (noTraces.checked == false) {
                c.stroke();
            }
            //  inside of outer ring  -----------
            drawCircle(this.posX * cScale, this.posY * cScale, this.radius * cScale);
            if (whiteTraces.checked == true) {
                c.strokeStyle = `hsla(0, 0%, 85%, ${this.alpha - 30}%)`;
            } 
            if (blackTraces.checked == true) {
                c.strokeStyle = `hsla(0, 0%, 0%, ${this.alpha - 30}%)`;
            }
            if (colorTraces.checked == true) {
                c.strokeStyle = `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${this.alpha - 40}%)`;   
            }
            c.fillStyle = `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${this.alpha - 40}%)`;
            if (fillBox.checked == true || gradFillBox.checked == true) {
                c.fill();
            }
            if (noTraces.checked == false) {
                c.stroke();
            }
            //  outside in inner ring  ----------
            drawCircle(this.posX * cScale, this.posY * cScale, 0.65 * this.radius * cScale);
            if (whiteTraces.checked == true) {
                c.strokeStyle = `hsla(0, 0%, 85%, ${this.alpha - 15}%)`;
            } 
            if (blackTraces.checked == true) {
                c.strokeStyle = `hsla(0, 0%, 0%, ${this.alpha - 15}%)`;
            }
            if (colorTraces.checked == true) {
                c.strokeStyle = `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${this.alpha - 20}%)`;
            }
            c.fillStyle = `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${this.alpha - 20}%)`;
            if (fillBox.checked == true || gradFillBox.checked == true) {
                c.fill();
            }
            if (noTraces.checked == false) {
                c.stroke();
            }
            //  inner ring  -----------
            drawCircle(this.posX * cScale, this.posY * cScale, 0.33 * this.radius * cScale);
            if (whiteTraces.checked == true) {
                c.strokeStyle = `hsla(0, 0%, 85%, ${this.alpha}%)`;
            } 
            if (blackTraces.checked == true) {
                c.strokeStyle = `hsla(0, 0%, 0%, ${this.alpha}%)`;
            }
            if (colorTraces.checked == true) {
                c.strokeStyle = `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${this.alpha}%)`;
            }
            c.fillStyle = `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${this.alpha}%)`;
            if (fillBox.checked == true || gradFillBox.checked == true) {
                c.fill();
            }
            if (noTraces.checked == false) {
                c.stroke();
            }
            //  inner circle  ----------
            drawCircle(this.posX * cScale, this.posY * cScale, 0.08 * this.radius * cScale);
            if (whiteTraces.checked == true) {
                c.strokeStyle = `hsla(0, 0%, 100%, ${this.alpha}%)`;
            } 
            if (blackTraces.checked == true) {
                c.strokeStyle = `hsla(0, 0%, 0%, ${this.alpha}%)`;
            }
            if (colorTraces.checked == true) {
                c.strokeStyle = `hsla(${this.hue}, ${this.saturation + 10}%, ${this.lightness + 10}%, ${this.alpha}%)`;
            }
            c.fillStyle = `hsla(${this.hue}, ${this.saturation + 10}%, ${this.lightness + 10}%, ${this.alpha}%)`;
        }   
        
        //  ELLIPSES - was horizontal -------------------
        if (this.type == 'ellipse') {
            if (gradFillBox.checked == true) {
                var ellipseGradient = c.createRadialGradient(
                    this.posX * cScale, 
                    this.posY * cScale, 
                    0.1 * this.radius * cScale, 
                    this.posX * cScale, 
                    this.posY * cScale, 
                    2 * this.radius * cScale);
                if (alphaBox.checked == true) {
                    var highlight =  `hsla(${this.hue + 30}, ${this.saturation}%, ${this.lightness}%, ${this.alpha}%)`;
                    var midtone =  `hsla(${this.hue}, ${this.saturation}%, ${this.lightness-50}%, ${this.alpha}%)`;
                } else {
                    var highlight =  `hsla(${this.hue + 30}, ${this.saturation}%, ${this.lightness}%)`;
                    var midtone =  `hsla(${this.hue}, ${this.saturation}%, ${this.lightness-50}%)`;
                }
                ellipseGradient.addColorStop(0.1, highlight);
                ellipseGradient.addColorStop(1.0, midtone);
                c.fillStyle = ellipseGradient;
            }
            if (shape.value == 'triptychDroplets' && colorTraces == false && (fillBox.checked == true || gradFillBox.checked == true)) {
                c.strokeStyle = `hsla(0, 0%, 0%, ${this.alpha}%)`;
            } 
            if (shape.value == 'triptychDroplets' && colorTraces == false && fillBox.checked == false) {
                c.strokeStyle = `hsla(0, 0%, 85%, ${this.alpha}%)`;
            }
            c.beginPath();
            for (f = 0; f < 2 * Math.PI; f += 0.1) {
                var drawX = this.posX + Math.cos(f + this.angle) * ( 0.33 * this.radius / Math.sqrt( 0.33 * this.radius * Math.pow(Math.cos(f), 2) + 1.0 * this.radius * Math.pow(Math.sin(f), 2)) );
                var drawY = this.posY + Math.sin(f + this.angle) * ( 0.33 * this.radius / Math.sqrt( 0.33 * this.radius * Math.pow(Math.cos(f), 2) + 1.0 * this.radius * Math.pow(Math.sin(f), 2)) );
                if (f == 0) {
                    c.moveTo(drawX * cScale, drawY * cScale);
                } else {
                    c.lineTo(drawX * cScale, drawY * cScale);
                }
            }
            c.lineTo(drawX * cScale, drawY * cScale);
            c.closePath();
        }
        
        //  ATOMS  -------------------
        if (this.type == 'atom') {
            if (gradFillBox.checked == true) {
                var ellipseGradient = c.createRadialGradient(
                    this.posX * cScale, 
                    this.posY * cScale, 
                    0.1 * this.radius * cScale, 
                    this.posX * cScale, 
                    this.posY * cScale, 
                    this.radius * cScale);
                if (alphaBox.checked == true) {
                    var highlight =  `hsla(${this.hue + 30}, ${this.saturation}%, ${this.lightness}%, ${this.alpha}%)`;
                    var midtone =  `hsla(${this.hue}, ${this.saturation}%, ${this.lightness-50}%, ${this.alpha}%)`;
                } else {
                    var highlight =  `hsla(${this.hue + 30}, ${this.saturation}%, ${this.lightness}%)`;
                    var midtone =  `hsla(${this.hue}, ${this.saturation}%, ${this.lightness-50}%)`;
                }
                ellipseGradient.addColorStop(0.1, highlight);
                ellipseGradient.addColorStop(1.0, midtone);
                c.fillStyle = ellipseGradient;
            }
            if (shape.value == 'triptychDroplets' && colorTraces == false && (fillBox.checked == true || gradFillBox.checked == true)) {
                c.strokeStyle = `hsla(0, 0%, 0%, ${this.alpha}%)`;
            } 
            if (shape.value == 'triptychDroplets' && colorTraces == false && fillBox.checked == false) {
                c.strokeStyle = `hsla(0, 0%, 85%, ${this.alpha}%)`;
            }
            var ellipseRad = 3.0 * this.radius
            c.beginPath();
            for (f = 0; f < 2 * Math.PI; f += 0.1) {
                var drawX = this.posX + Math.cos(f + this.angle) * ( 0.070 * ellipseRad / Math.sqrt( 0.070 * ellipseRad * Math.pow(Math.cos(f), 2) + 1.0 * ellipseRad * Math.pow(Math.sin(f), 2)) );
                var drawY = this.posY + Math.sin(f + this.angle) * ( 0.070 * ellipseRad / Math.sqrt( 0.070 * ellipseRad * Math.pow(Math.cos(f), 2) + 1.0 * ellipseRad * Math.pow(Math.sin(f), 2)) );
                if (f == 0) {
                    c.moveTo(drawX * cScale, drawY * cScale);
                } else {
                    c.lineTo(drawX * cScale, drawY * cScale);
                }
            }
            c.lineTo(drawX * cScale, drawY * cScale);
            c.closePath();
            if (noTraces.checked != true) {
                c.stroke();
            }
            if (fillBox.checked == true || gradFillBox.checked == true) {
                c.fill();
            }

            c.beginPath();
            for (f = 0; f < 2 * Math.PI; f += 0.1) {
                var drawX = this.posX + Math.cos(f + this.angle + 2*Math.PI/3) * ( 0.070 * ellipseRad / Math.sqrt( 0.070 * ellipseRad * Math.pow(Math.cos(f), 2) + 1.0 * ellipseRad * Math.pow(Math.sin(f), 2)) );
                var drawY = this.posY + Math.sin(f + this.angle + 2*Math.PI/3) * ( 0.070 * ellipseRad / Math.sqrt( 0.070 * ellipseRad * Math.pow(Math.cos(f), 2) + 1.0 * ellipseRad * Math.pow(Math.sin(f), 2)) );
                if (f == 0) {
                    c.moveTo(drawX * cScale, drawY * cScale);
                } else {
                    c.lineTo(drawX * cScale, drawY * cScale);
                }
            }
            c.lineTo(drawX * cScale, drawY * cScale);
            c.closePath();
            if (noTraces.checked != true) {
                c.stroke();
            }
            if (fillBox.checked == true || gradFillBox.checked == true) {
                c.fill();
            }

            c.beginPath();
            for (f = 0; f < 2 * Math.PI; f += 0.1) {
                var drawX = this.posX + Math.cos(f + this.angle + 4*Math.PI/3) * ( 0.070 * ellipseRad / Math.sqrt( 0.070 * ellipseRad * Math.pow(Math.cos(f), 2) + 1.0 * ellipseRad * Math.pow(Math.sin(f), 2)) );
                var drawY = this.posY + Math.sin(f + this.angle + 4*Math.PI/3) * ( 0.070 * ellipseRad / Math.sqrt( 0.070 * ellipseRad * Math.pow(Math.cos(f), 2) + 1.0 * ellipseRad * Math.pow(Math.sin(f), 2)) );
                if (f == 0) {
                    c.moveTo(drawX * cScale, drawY * cScale);
                } else {
                    c.lineTo(drawX * cScale, drawY * cScale);
                }
            }
            c.lineTo(drawX * cScale, drawY * cScale);
            c.closePath();
        }

        //  LINES  -------------------
        if (this.type == 'line') {
            c.beginPath();
            c.moveTo((this.posX + this.radius * Math.cos(this.angle)) * cScale, 
                (this.posY - this.radius * Math.sin(this.angle)) * cScale);
            c.lineTo((this.posX - this.radius * Math.cos(this.angle)) * cScale, 
                (this.posY + this.radius * Math.sin(this.angle)) * cScale);
            c.closePath();
        }

        //  BARBELLS  -------------------
        if (this.type == 'barbell') {
            var barRadius = 0.5 * this.radius;
            var bellRadius = 0.2 * this.radius;
            drawCircle((this.posX + (barRadius + bellRadius) * Math.cos(this.angle)) * cScale, 
                (this.posY - (barRadius + bellRadius) * Math.sin(this.angle)) * cScale,
                bellRadius * cScale);
            if (fillBox.checked == true || gradFillBox.checked == true) {
                c.fill();
            } else {
                c.stroke();
            }
            drawCircle((this.posX - (barRadius + bellRadius) * Math.cos(this.angle)) * cScale, 
                (this.posY + (barRadius + bellRadius) * Math.sin(this.angle)) * cScale,
                bellRadius * cScale);
            if (fillBox.checked == true || gradFillBox.checked == true) {
                c.fill();
            } else {
                c.stroke();
            }
            c.beginPath();
            c.moveTo((this.posX + barRadius * Math.cos(this.angle)) * cScale, 
                (this.posY - barRadius * Math.sin(this.angle)) * cScale);
            c.lineTo((this.posX - barRadius * Math.cos(this.angle)) * cScale, 
                (this.posY + barRadius * Math.sin(this.angle)) * cScale);
            c.closePath();
            
        }

        //  CROSSES  -------------------
        if (this.type == 'line4') {
            c.beginPath();
            c.moveTo((this.posX + this.radius * Math.cos(this.angle)) * cScale, 
                (this.posY - this.radius * Math.sin(this.angle)) * cScale);
            c.lineTo((this.posX - this.radius * Math.cos(this.angle)) * cScale, 
                (this.posY + this.radius * Math.sin(this.angle)) * cScale);
            c.moveTo((this.posX + this.radius * Math.cos(this.angle + 0.5 * Math.PI)) * cScale, 
                (this.posY - this.radius * Math.sin(this.angle + 0.5 * Math.PI)) * cScale);
            c.lineTo((this.posX - this.radius * Math.cos(this.angle + 0.5 * Math.PI)) * cScale, 
                (this.posY + this.radius * Math.sin(this.angle + 0.5 * Math.PI)) * cScale);
            c.closePath();
        }

        //  ASTERISKS  -------------------
        if (this.type == 'line8') {
            var wedges = 2 * Math.PI / 8;
            c.beginPath();
            for (var w = 0; w < 8; w++) {
                c.moveTo(this.posX * cScale, this.posY * cScale);
                c.lineTo((this.posX + this.radius * Math.cos(this.angle + (w * wedges))) * cScale, 
                (this.posY + this.radius * Math.sin(this.angle + (w * wedges))) * cScale);
            }
            c.closePath();
        }

        //  16 POINTED LINES  -------------------
        if (this.type == 'line16') {
            var wedges = 2 * Math.PI / 16;
            c.beginPath();
            for (var w = 0; w < 16; w++) {
                if (w % 2 == 0) {
                    c.moveTo(this.posX * cScale, this.posY * cScale);
                    c.lineTo((this.posX + 0.8 * this.radius * Math.cos(this.angle + (w * wedges))) * cScale, 
                    (this.posY + 0.8 * this.radius * Math.sin(this.angle + (w * wedges))) * cScale);
                } else {
                    c.moveTo(this.posX * cScale, this.posY * cScale);
                    c.lineTo((this.posX + this.radius * Math.cos(this.angle + (w * wedges))) * cScale, 
                    (this.posY + this.radius * Math.sin(this.angle + (w * wedges))) * cScale);
                }
            }
            c.closePath();
        }

        //  FUZZY CIRCLES -------------------
        if (this.type == 'fuzz') {
            c.beginPath();
            for (f = 0; f < 25; f++) {
                c.moveTo(this.posX * cScale, this.posY * cScale);    
                var theta = Math.random() * 2 * Math.PI;
                c.lineTo((this.posX + this.radius * Math.cos(theta)) * cScale, 
                    (this.posY + this.radius * Math.sin(theta)) * cScale);
                c.closePath();
            }
        }

        //  RADII DROPLETS  -------------------
        if (this.type == 'radii') {
            var sector = 20;
            var wedge = 2 * Math.PI / sector;
            for (var w = 0; w < sector; w += 1) {
                c.beginPath();
                c.moveTo(
                (this.posX + 0.3 * this.radius * Math.cos(w * wedge + this.angle)) * cScale, 
                (this.posY + 0.3 * this.radius * Math.sin(w * wedge + this.angle)) * cScale);
                c.lineTo(
                (this.posX + this.radius * Math.cos(w * wedge + this.angle)) * cScale, 
                (this.posY + this.radius * Math.sin(w * wedge + this.angle)) * cScale);                
                if (w < sector - 1) {
                    c.stroke();
                }
            }
        }

        //  PINWHEEL DROPLETS  -------------------
        if (this.type == 'pinwheel') {
            var sector = 8;
            var wedge = 2 * Math.PI / sector;
            for (var w = 0; w < sector; w += 1) {
                c.beginPath();
                c.moveTo(
                (this.posX + 0.20 * this.radius * Math.cos(w * wedge + this.angle)) * cScale, 
                (this.posY + 0.20 * this.radius * Math.sin(w * wedge + this.angle)) * cScale);
                c.lineTo(
                (this.posX + 0.65 * this.radius * Math.cos(w * wedge + this.angle + 0.2)) * cScale, 
                (this.posY + 0.65 * this.radius * Math.sin(w * wedge + this.angle + 0.2)) * cScale);
                c.lineTo(
                (this.posX + 1.00 * this.radius * Math.cos(w * wedge + this.angle)) * cScale, 
                (this.posY + 1.00 * this.radius * Math.sin(w * wedge + this.angle)) * cScale);              
                c.lineTo(
                (this.posX + 0.65 * this.radius * Math.cos(w * wedge + this.angle - 0.2)) * cScale, 
                (this.posY + 0.65 * this.radius * Math.sin(w * wedge + this.angle - 0.2)) * cScale);
                c.closePath();
                if (fillBox.checked == true || gradFillBox.checked == true) {
                    c.fill();
                }
                if (noTraces.checked != true && w < sector - 1) {
                    c.stroke();
                }
            }
        }

        //  TRICORNS  -------------------
        if (this.type == 'triPoly3' || this.type == 'triPoly5') {
            if (this.type == 'triPoly3') {var sectors = 3}
            if (this.type == 'triPoly5') {var sectors = 5}  
            var wedges = 2 * Math.PI / sectors;
            c.beginPath();
            for (var w = 0; w < sectors; w++) {
                c.moveTo(this.posX * cScale, this.posY * cScale);
                c.lineTo((this.posX + this.radius * Math.cos(0.25*Math.PI + this.angle + (w * wedges))) * cScale, 
                (this.posY + this.radius * Math.sin(0.25*Math.PI + this.angle + (w * wedges))) * cScale);
                c.arcTo( 
                    (this.posX + 0.5 * this.radius * Math.cos(this.angle + (w * wedges + 0.25 * wedges))) * cScale, 
                    (this.posY + 0.5 * this.radius * Math.sin(this.angle + (w * wedges + 0.25 * wedges))) * cScale,

                    (this.posX + this.radius * Math.cos(this.angle + (w * wedges))) * cScale, 
                    (this.posY + this.radius * Math.sin(this.angle + (w * wedges))) * cScale,
                    0.5 * this.radius * cScale);
                c.closePath();
            }
        }

        //  TRIANGLES  -------------------
        if (this.type == 'triangleU' || this.type == 'triangleD' 
        || this.type == 'triangleL' || this.type == 'triangleR') {
            if (this.type == 'triangleU') {var thetaAdj = Math.PI / 2}
            if (this.type == 'triangleD') {var thetaAdj = 3 * Math.PI / 2}
            if (this.type == 'triangleL') {var thetaAdj = Math.PI}
            if (this.type == 'triangleR') {var thetaAdj = 0}
            
            c.beginPath();
            for (s=0; s < 3; s++) {
                if (s == 0) {
                    c.moveTo((this.posX + this.radius * Math.cos((s * 2 * Math.PI / 3) + this.angle + thetaAdj)) * cScale, 
                    (this.posY - this.radius * Math.sin((s * 2 * Math.PI / 3) + this.angle + thetaAdj)) * cScale);
                } else {
                    c.lineTo((this.posX + this.radius * Math.cos((s * 2 * Math.PI / 3) + this.angle + thetaAdj)) * cScale, 
                    (this.posY - this.radius * Math.sin((s * 2 * Math.PI / 3) + this.angle + thetaAdj)) * cScale);
                }
            }
            c.closePath();
        }
        
        //  SQUARES  -------------------
        if (this.type == 'square' || this.type == 'diamond') {

            if (shape.value == 'triptychDroplets' && blackTraces.checked == true) {
                c.strokeStyle = `hsla(0, 0%, 0%, ${this.alpha}%)`;
            } 
            if (shape.value == 'triptychDroplets' && whiteTraces.checked == true) {
                c.strokeStyle = `hsla(0, 0%, 85%, ${this.alpha}%)`;
            }
            if (shape.value == 'triptychDroplets' && colorTraces.checked == true) {
                c.strokeStyle = `hsla(${this.hue}, 0%, ${this.lightness}, ${this.alpha}%)`;
            }

            if (noTraces.checked == true) {
                var thetaAdj = 0;
            }

            if (this.type == 'square') {var thetaAdj = Math.PI / 4} 
            if (this.type == 'diamond') {var thetaAdj = 0}
            //if (shape.value == 'squareRDroplets') {var thetaAdj = 0}
            
            c.beginPath();
            for (s=0; s < 4; s++) {
                if (s == 0) {
                    c.moveTo((this.posX + this.radius * Math.cos((s * 0.5 * Math.PI) + this.angle + thetaAdj)) * cScale, 
                    (this.posY - this.radius * Math.sin((s * 0.5 * Math.PI) + this.angle + thetaAdj)) * cScale);
                } else {
                    c.lineTo((this.posX + this.radius * Math.cos((s * 0.5 * Math.PI) + this.angle + thetaAdj)) * cScale, 
                    (this.posY - this.radius * Math.sin((s * 0.5 * Math.PI) + this.angle + thetaAdj)) * cScale);
                }
            }
            c.closePath();
        }

        //  RECTANGLE DROPLETS  ------------------
        if (this.type == 'rectangle') {
            var rr = {
                radius: 2 * this.radius,
                // 1 bottom right
                a1cos: Math.cos(rads(this.recang) + this.angle),
                a1sin: Math.sin(rads(this.recang) + this.angle),
                r1: this.radius * 2,
                // 2 right inside corner
                a2cos: Math.cos(rads(180 - this.recang) + this.angle),
                a2sin: Math.sin(rads(180 - this.recang) + this.angle),
                r2: this.radius * 2,
                // 3 right tip
                a3cos: Math.cos(rads(this.recang + 180) + this.angle),
                a3sin: Math.sin(rads(this.recang + 180) + this.angle),
                r3: this.radius * 2,
                // 4 top
                a4cos: Math.cos(rads(360 - this.recang) + this.angle),
                a4sin: Math.sin(rads(360 - this.recang) + this.angle),
                r4: this.radius * 2,
            }
            
            c.beginPath();
            c.moveTo((this.posX + rr.radius * rr.r1 * rr.a1cos) * cScale,
                (this.posY - rr.radius * rr.r1 * rr.a1sin) * cScale);
            c.lineTo((this.posX + rr.radius * rr.r2 * rr.a2cos) * cScale,
                (this.posY - rr.radius * rr.r2 * rr.a2sin) * cScale);
            c.lineTo((this.posX + rr.radius * rr.r3 * rr.a3cos) * cScale,
                (this.posY - rr.radius * rr.r3 * rr.a3sin) * cScale);
            c.lineTo((this.posX + rr.radius * rr.r4 * rr.a4cos) * cScale,
                (this.posY - rr.radius * rr.r4 * rr.a4sin) * cScale);
            c.closePath();
        }
        
        //  HEARTS  --------------------
        if (this.type == 'heart') {
            c.beginPath();
            c.moveTo(this.posX * cScale, (this.posY - 0.5 * this.radius) * cScale);
            for (var f = 0; f < Math.PI - 0.8; f += 0.1) {
                    var drawX = this.posX + 0.08 * this.radius * 16 * Math.pow(Math.sin(f), 3);
                    var drawY = this.posY - 0.08 * this.radius * (13 * Math.cos(f) - 5 * Math.cos(2 * f) - 2 * Math.cos(3 * f) - Math.cos(4 * f));   
                    c.lineTo(drawX * cScale, drawY * cScale);
                }
                var f = Math.PI - 0.8;
                var drawX = this.posX + 0.08 * this.radius * 16 * Math.pow(Math.sin(f), 3);
                var drawY = this.posY - 0.08 * this.radius * (13 * Math.cos(f) - 5 * Math.cos(2 * f) - 2 * Math.cos(3 * f) - Math.cos(4 * f));   
                c.lineTo(drawX * cScale, drawY * cScale);
                c.lineTo(drawX * cScale, drawY * cScale);
            c.lineTo(this.posX * cScale, (this.posY + 1.15 * this.radius) * cScale);   
            for (var f = Math.PI + 0.8; f < 2 * Math.PI; f += 0.1) {
                var drawX = this.posX + 0.08 * this.radius * 16 * Math.pow(Math.sin(f), 3);
                var drawY = this.posY - 0.08 * this.radius * (13 * Math.cos(f) - 5 * Math.cos(2 * f) - 2 * Math.cos(3 * f) - Math.cos(4 * f));   
                c.lineTo(drawX * cScale, drawY * cScale);
                }
            c.closePath();
        }

        //  FLOWERS  --------------------
        if (this.type == 'flower1' || this.type == 'flower2' || this.type == 'flower3' || this.type == 'flower4') {
            if (this.type == 'flower1') {
                var lobeId = 3;
                var piSpins = 1;
            }
            if (this.type == 'flower2') {
                var lobeId = 2;
                var piSpins = 2;
            }
            if (this.type == 'flower3') {
                var lobeId = 5;
                var piSpins = 1;
            }
            if (this.type == 'flower4') {
                var lobeId = 4;
                var piSpins = 2;
            }

            if (this.radius < .08) {
                var index = 0.1;
            } else {
                var index = 0.05;
            }

            c.beginPath();
            for (f = 0; f < piSpins * Math.PI; f += index) {
                var drawX = this.posX + 1.5 * this.radius * Math.cos(lobeId * f) * Math.cos(f + this.angle);
                var drawY = this.posY + 1.5 * this.radius * Math.cos(lobeId * f) * Math.sin(f + this.angle);
                if (f == 0) {
                    c.moveTo(drawX * cScale, drawY * cScale);
                } else {
                    c.lineTo(drawX * cScale, drawY * cScale);
                }
            }
            c.lineTo(drawX * cScale, drawY * cScale);
            c.closePath();
        }

        //  LOTUS  --------------------
        if (this.type == 'lotus') {
            if (this.radius < 0.1) {
                var resolution = 0.1; 
            } else {
                var resolution = 0.05;
            }
            c.beginPath()
            c.moveTo(drawX * cScale, drawY * cScale);
            for (f = 0; f < (4 * Math.PI - 0.1); f += resolution) {
                var drawX = this.posX + this.radius * (Math.sin(f) + Math.sin(5 * (f / 2))) * Math.cos(f + this.angle);
                var drawY = this.posY - this.radius * (Math.sin(f) + Math.sin(5 * (f / 2))) * Math.sin(f + this.angle);
                c.lineTo(drawX * cScale, drawY * cScale)
            }
            c.closePath();
        }

        //  FOUR-WAY LOTUS  --------------------
        if (this.type == 'greatLotus') {
            if (this.radius < 0.1) {
                var resolution = 0.2; 
            } else {
                var resolution = 0.1;
            }
            c.beginPath()
            c.moveTo(drawX * cScale, drawY * cScale);
            for (f = 0; f < 4 * Math.PI; f += resolution) {
                var drawX = this.posX + this.radius * (Math.sin(f) + Math.sin(5 * (f / 2))) * Math.cos(f + this.angle);
                var drawY = this.posY - this.radius * (Math.sin(f) + Math.sin(5 * (f / 2))) * Math.sin(f + this.angle);
                c.lineTo(drawX * cScale, drawY * cScale)
            }
            for (f = 0; f < 4 * Math.PI; f += resolution) {
                var drawX = this.posX + this.radius * (Math.sin(f) + Math.sin(5 * (f / 2))) * Math.cos(f + this.angle + 0.5 * Math.PI);
                var drawY = this.posY - this.radius * (Math.sin(f) + Math.sin(5 * (f / 2))) * Math.sin(f + this.angle + 0.5 * Math.PI);
                c.lineTo(drawX * cScale, drawY * cScale)
            }
            for (f = 0; f < 4 * Math.PI - 0.1; f += resolution) {
                var drawX = this.posX + this.radius * (Math.sin(f) + Math.sin(5 * (f / 2))) * Math.cos(f + this.angle + 1.0 * Math.PI);
                var drawY = this.posY - this.radius * (Math.sin(f) + Math.sin(5 * (f / 2))) * Math.sin(f + this.angle + 1.0 * Math.PI);
                c.lineTo(drawX * cScale, drawY * cScale)
            }
            for (f = 0; f < 4 * Math.PI - 0.1; f += resolution) {
                var drawX = this.posX + this.radius * (Math.sin(f) + Math.sin(5 * (f / 2))) * Math.cos(f + this.angle + 1.5 * Math.PI);
                var drawY = this.posY - this.radius * (Math.sin(f) + Math.sin(5 * (f / 2))) * Math.sin(f + this.angle + 1.5 * Math.PI);
                c.lineTo(drawX * cScale, drawY * cScale)
            }
            c.closePath();
        }

        //  DECO TRI STAR  ------------------
        if (this.type == 'decoTriStar') {
            var rad = 1.0 * this.radius
            var ds = {
                // 1 
                a1cos: Math.cos(rads(0) + this.angle),
                a1sin: Math.sin(rads(0) + this.angle),
                r1: rad,
                // 2
                a2cos: Math.cos(rads(360/3) + this.angle),
                a2sin: Math.sin(rads(360/3) + this.angle),
                r2: rad,
                // 3  
                a3cos: Math.cos(rads(2*360/3) + this.angle),
                a3sin: Math.sin(rads(2*360/3) + this.angle),
                r3: rad,
            }

            // move to right
            c.beginPath();
            c.moveTo((this.posX + rad * ds.a3cos) * cScale,
            (this.posY + rad * ds.a3sin) * cScale);
            
            // up up to top
            c.arcTo(
            this.posX * cScale,
            this.posY * cScale,  
            (this.posX + rad * ds.a2cos) * cScale,
            (this.posY + rad * ds.a2sin) * cScale,
            rad * cScale);
            c.lineTo((this.posX + this.radius * ds.a2cos) * cScale,
            (this.posY + this.radius * ds.a2sin) * cScale);
            
            // arc to left
            c.arcTo(
            this.posX * cScale,
            this.posY * cScale,  
            (this.posX + rad * ds.a1cos) * cScale,
            (this.posY + rad * ds.a1sin) * cScale,
            rad * cScale);
            c.lineTo((this.posX + this.radius * ds.a1cos) * cScale,
            (this.posY + this.radius * ds.a1sin) * cScale);
            
            // arc down to bottom
            c.arcTo(
            this.posX * cScale,
            this.posY * cScale,  
            (this.posX + rad * ds.a3cos) * cScale,
            (this.posY + rad * ds.a3sin) * cScale,
            rad * cScale);
            //c.closePath();
            c.stroke();

            drawCircle((this.posX + (this.radius + 0.1 * this.radius) * ds.a3cos) * cScale,
                (this.posY + (this.radius + 0.1 * this.radius) * ds.a3sin) * cScale, 0.1 * this.radius * cScale);
            if (fillBox.checked == true || gradFillBox.checked == true) {
                c.fill();
            } else {
                c.stroke();
            }
            drawCircle((this.posX + (this.radius + 0.1 * this.radius) * ds.a2cos) * cScale,
                (this.posY + (this.radius + 0.1 * this.radius) * ds.a2sin) * cScale, 0.1 * this.radius * cScale);
            if (fillBox.checked == true || gradFillBox.checked == true) {
                c.fill();
            } else {
                c.stroke();
            }
            drawCircle((this.posX + (this.radius + 0.1 * this.radius) * ds.a1cos) * cScale,
                (this.posY + (this.radius + 0.1 * this.radius) * ds.a1sin) * cScale, 0.1 * this.radius * cScale);
            if (fillBox.checked == true || gradFillBox.checked == true) {
                c.fill();
            }

        }

        //  DECO STAR  ------------------
        if (this.type == 'decoQuadStar') {
            var rad = 1.2 * this.radius
            var ds = {
                // left 
                a1cos: Math.cos(rads(180) + this.angle),
                a1sin: Math.sin(rads(180) + this.angle),
                r1: rad,
                // top
                a2cos: Math.cos(rads(270) + this.angle),
                a2sin: Math.sin(rads(270) + this.angle),
                r2: rad,
                // 3 right 
                a3cos: Math.cos(rads(0) + this.angle),
                a3sin: Math.sin(rads(0) + this.angle),
                r3: rad,
                // 4 bottom
                a4cos: Math.cos(rads(90) + this.angle),
                a4sin: Math.sin(rads(90) + this.angle),
                r4: rad
            }

            // move to right
            c.beginPath();
            c.moveTo((this.posX + rad * ds.a3cos) * cScale,
            (this.posY + rad * ds.a3sin) * cScale);
            // up up to top
            c.arcTo(
            this.posX * cScale,
            this.posY * cScale,  
            (this.posX + rad * ds.a2cos) * cScale,
            (this.posY + rad * ds.a2sin) * cScale,
            rad * cScale);
            //c.moveTo((this.posX + rad * ds.a2cos) * cScale,
            //(this.posY + rad * ds.a2sin) * cScale);
            // arc to left
            c.arcTo(
            this.posX * cScale,
            this.posY * cScale,  
            (this.posX + rad * ds.a1cos) * cScale,
            (this.posY + rad * ds.a1sin) * cScale,
            rad * cScale);
            //c.moveTo((this.posX + rad * ds.a1cos) * cScale,
            //(this.posY + rad * ds.a1sin) * cScale);
            // arc down to bottom
            c.arcTo(
            this.posX * cScale,
            this.posY * cScale,  
            (this.posX + rad * ds.a4cos) * cScale,
            (this.posY + rad * ds.a4sin) * cScale,
            rad * cScale);
            //c.moveTo((this.posX + rad * ds.a4cos) * cScale,
            //(this.posY + rad * ds.a4sin) * cScale);
            // arc to right
            c.arcTo(
            this.posX * cScale,
            this.posY * cScale,  
            (this.posX + rad * ds.a3cos) * cScale,
            (this.posY + rad * ds.a3sin) * cScale,
            rad * cScale);
            c.closePath();

            /* OLD DECO STAR ROUTINE  ---------
            c.beginPath();
            c.moveTo(((this.posX + rad * Math.cos(this.angle + Math.PI))) * cScale, (this.posY - rad * Math.sin(this.angle + Math.PI)) * cScale);
            c.arcTo(this.posX * cScale, this.posY * cScale, ((this.posX + rad * Math.cos(this.angle + 0.5 * Math.PI))) * cScale, ((this.posY - rad * Math.sin(this.angle + 0.5 * Math.PI))) * cScale, rad * cScale);
            c.arcTo(this.posX * cScale, this.posY * cScale, ((this.posX + rad * Math.cos(this.angle))) * cScale, ((this.posY - rad * Math.sin(this.angle))) * cScale, rad * cScale);
            c.arcTo(this.posX * cScale, this.posY * cScale, ((this.posX + rad * Math.cos(this.angle + 1.5 * Math.PI))) * cScale, ((this.posY - rad * Math.sin(this.angle + 1.5 * Math.PI))) * cScale, rad * cScale);
            c.arcTo(this.posX * cScale, this.posY * cScale, ((this.posX - rad * Math.cos(this.angle))) * cScale, ((this.posY + rad * Math.sin(this.angle))) * cScale, rad * cScale);
            c.closePath();
            */
        }

        //  FIVE-POINTED STAR  ------------------
        if (this.type == 'star1') {
            const starWedges = Math.PI / 5;
            var innerRadius = 0.5 * this.radius;
            var outerRadius = 1.5 * this.radius;
            c.beginPath();
            for (var v = 0; v < 10; v++) {
                if (v == 0) {
                    c.moveTo((this.posX + innerRadius * Math.cos(this.angle + v * starWedges)) * cScale, (this.posY + innerRadius * Math.sin(this.angle + v * starWedges)) * cScale);
                } else 
                if (v % 2 == 0) {  //inner
                    c.lineTo((this.posX + innerRadius * Math.cos(this.angle + v * starWedges)) * cScale, (this.posY + innerRadius * Math.sin(this.angle + v * starWedges)) * cScale);
                } else {  //outer
                    c.lineTo((this.posX + outerRadius * Math.cos(this.angle + v * starWedges)) * cScale, (this.posY + outerRadius * Math.sin(this.angle + v * starWedges)) * cScale);
                }
            }
            c.closePath();
        }

        //  TEN-POINTED STAR  ------------------
        if (this.type == 'star2') {
            const starWedges = Math.PI / 10;
            var innerRadius = 0.5 * this.radius;
            var outerRadius = 1.5 * this.radius;
            c.beginPath();
            for (var v = 0; v < 20; v++) {
                if (v == 0) {
                    c.moveTo((this.posX + innerRadius * Math.cos(this.angle + v * starWedges)) * cScale, (this.posY + innerRadius * Math.sin(this.angle + v * starWedges)) * cScale);
                } else 
                if (v % 2 == 0) {  //inner
                    c.lineTo((this.posX + innerRadius * Math.cos(this.angle + v * starWedges)) * cScale, (this.posY + innerRadius * Math.sin(this.angle + v * starWedges)) * cScale);
                } else {  //outer
                    c.lineTo((this.posX + outerRadius * Math.cos(this.angle + v * starWedges)) * cScale, (this.posY + outerRadius * Math.sin(this.angle + v * starWedges)) * cScale);
                }
            }
            c.closePath();
        }

        //  SUN  ------------------
        if (this.type == 'sun') {
            const starWedges = Math.PI / 24;
            var innerRadius = 0.7 * this.radius;
            var outerRadius = 1.3 * this.radius;
            var outRadMult = 1.3;
            c.beginPath();
            for (var v = 0; v < 48; v++) {
                if (v == 0) {
                    c.moveTo((this.posX + innerRadius * Math.cos(this.angle + v * starWedges)) * cScale, (this.posY + innerRadius * Math.sin(this.angle + v * starWedges)) * cScale);
                } else 
                if (v % 2 == 0) {  //inner
                    c.lineTo((this.posX + innerRadius * Math.cos(this.angle + v * starWedges)) * cScale, (this.posY + innerRadius * Math.sin(this.angle + v * starWedges)) * cScale);
                } else {  //outer
                    if (long == true) {
                        c.lineTo((this.posX + outRadMult * outerRadius * Math.cos(this.angle + v * starWedges)) * cScale, (this.posY + outRadMult * outerRadius * Math.sin(this.angle + v * starWedges)) * cScale);
                        long = false;
                    } else {
                        c.lineTo((this.posX + outerRadius * Math.cos(this.angle + v * starWedges)) * cScale, (this.posY + outerRadius * Math.sin(this.angle + v * starWedges)) * cScale);
                        long = true;
                    }
                }
            }
            c.closePath();
        }

        //  TEXT DROPLETS  --------------------
        if (this.type == 'character1' || this.type == 'character2') {
            var char1 = "∞";
            var char2 = "\u00BF";
            c.font = `${5 * this.radius * cScale}px arial`;
            if (noTraces.checked == false && fillBox.checked == false) {
                if (blackTraces.checked == true) {
                    if (alphaBox.checked == true) {
                        c.strokeStyle = `hsla(0, 0%, 0%, ${this.alpha}%)`;
                    } else {
                        c.strokeStyle = `hsl(0, 0%, 0%)`;
                    }
                }
                if (whiteTraces.checked == true) {
                    if (alphaBox.checked == true) {
                        c.strokeStyle = `hsla(0, 0%, 85%, ${this.alpha}%)`;
                    } else {
                        c.strokeStyle = `hsl(0, 0%, 85%)`;
                    }
                }
                if (colorTraces.checked == true) {
                    c.strokeStyle = this.color;
                }
                if (this.type == 'character1') {
                    c.strokeText(char1, (this.posX - 0.5 * this.radius) * cScale, (this.posY + 0.5 * this.radius) * cScale);
                } else {
                    c.strokeText(char2, (this.posX - 0.5 * this.radius) * cScale, (this.posY + 0.5 * this.radius) * cScale);
                }
            }
            if (fillBox.checked == true || gradFillBox.checked == true) {
                if (this.type == 'character1') {
                    c.fillText(char1, (this.posX - 0.5 * this.radius) * cScale, (this.posY + 0.5 * this.radius) * cScale);
                } else {
                    c.fillText(char2, (this.posX - 0.5 * this.radius) * cScale, (this.posY + 0.5 * this.radius) * cScale);
                }
            }
        }

        //  FILL AND/OR STROKE  -----------------
        if (this.type == 'line' || this.type == 'line4' || this.type == 'barbell'){
            c.lineWidth = 0.005 * cScale;
            c.stroke();  
        }
        if (this.type != 'line' && this.type != 'barbell' && noTraces.checked == false) {
            c.lineWidth = 0.006 * cScale;
        }
        if (this.type != 'line' && this.type != 'barbell' && this.type != 'line4') {
            if (noTraces.checked == false && this.type !='stickMan' && this.type != 'pizza') {
                c.stroke();
            }
        }
        if ((fillBox.checked == true || gradFillBox.checked == true) && (this.type != 'smiley' && this.type != 'stickMan' && this.type != 'pizza')) {
            c.fill();
        }

        if (this.type == 'spirals') {
            c.lineWidth = .03 * this.radius * cScale;
            c.stroke();
        }
    }
}

//  DEMO MODE SEQUENCE  -------------------
function blinkOff() {
    demoBox.checked = false;
}
function blinky() {
    demoBox.checked = true;
    setTimeout(blinkOff, 2500)
}
document.getElementById('demoBox').onclick = function() {
    if (demoRunning == true) {
        window.clearInterval(blinkTimeout);
        window.clearInterval(dropletInterval);
        window.clearInterval(settingInterval); 
        window.clearInterval(orbitInterval);
        demoRunning = false;
        demoBox.checked = false;
        spawnSlider.value = spawnRate;
        
    } else {
        orbitInterval = setInterval(randomDemoScene, 20000);
        settingInterval = setInterval(randomAttributes, 10000);
        dropletInterval = setInterval(randomObjectDemo, 5000);
        blinkTimeout = setInterval(blinky, 3000);
        //circleDroplets.checked = true;
        colorTraces.checked = true;
        fillBox.checked = false;
        demoRunning = true;
        demoBox.checked = true;
        spawnSlider.value = 2;
        lifespanSlider.value = 40;
        sizeSlider.value = 4;
        randomObjectDemo();
    } 
}

//  PICK RANDOM OBJECT  -----------------
function randomObjectManual() {
    var randoObject = Math.floor(Math.random() * Objects.length);
    while (oldObject == randoObject || oldOldObject == randoObject) {
        var randoObject = Math.floor(Math.random() * Objects.length)
    }
    shape.value = Objects[randoObject];
    oldOldObject = oldObject;
    oldObject = randoObject;
}

function randomObjectDemo() {
    var randoObject = Math.floor(Math.random() * demoObjects.length);
    while (oldObject == randoObject || oldOldObject == randoObject) {
        var randoObject = Math.floor(Math.random() * demoObjects.length)
    }
    shape.value = demoObjects[randoObject];
    oldOldObject = oldObject;
    oldObject = randoObject;
}

// SCENE RANDOMIZER - MANUAL  -----------------
function randomScene() {
    var randoScene = Math.floor(Math.random() * ManualScenes.length);
    while (randoScene == spawn.value || randoScene == oldScene) {
        var randoScene = Math.floor(Math.random() * ManualScenes.length)
    }
    oldScene = spawn.value;
    spawn.value = ManualScenes[randoScene];
}

//  SPAWN SETTINGS RANDOMIZER  -------------------
function randomSettings() {
    spawnSlider.value = Math.floor(26 * Math.random())
    lifespanSlider.value = Math.floor(100 * Math.random());
}

// SCENE RANDOMIZER - DEMO  -----------------
function randomDemoScene() {
    var randoScene = Math.floor(Math.random() * DemoScenes.length);
    while (spawn.value == randoScene || oldDemoScene == randoScene) {
        var randoScene = Math.floor(Math.random() * DemoScenes.length)
    }
    oldDemoScene = spawn.value;
    spawn.value = DemoScenes[randoScene];
}

//  RANDOMIZE ATTRIBUTE SETTINGS  --------------------
function randomAttributes() {
    // RANDOMIZE SPAWN DURING DEMO
    if (demoRunning == true) {
        if (Math.random() < 0.5) {
            var spawnAmount = 2 + Math.floor(Math.random() * 5);
            spawnSlider.value = spawnAmount;
        }  
    }
    //  RANDOMIZE SIZE  --------------------
    if (Math.random() < 0.8) {
        sizeSlider.value = Math.floor(8 * Math.random())  
    }
    //  ODDS FOR SPIN  -------------------
    if (Math.random() < 0.5) {
        var t = Math.random();
        if (t < 0.25) {
            spinNotBox.checked = true;
        } else 
        if (t < 0.50) {
            twirlBox.checked = true;
        } else 
        if (t < 0.75) {
            spinBox.checked = true;
        } else 
        if (t < 1.00) {
            if (spinBox.checked == true) {
                spinBox2.checked = true;
            } 
        }
    }
    //  ODDS FOR DRIFT  --------------------
    if (Math.random() < 0.5) {
        var u = Math.random();
        if (u < 0.33) {
            moveNotBox.checked = true;
        } else 
        if (u < 0.67) {
            moveSlowBox.checked = true;
        } else 
        if (u < 1.00) {
            if (moveSlowBox.checked == true) {
                moveBox.checked = true;
            }
            //moveNotBox.checked = false;
        }
    }
    //  ODDS FOR PALETTE  --------------------
    /*
    if (Math.random() < 0.2) {  
        if (rainbow.checked == false) {
            rainbow.checked = true;
            colorBands.checked = false;
        } else {
            rainbow.checked = false;
            colorBands.checked = true;
        }
    } 
    */

    //  ODDS FOR FILL  --------------------
    if (Math.random() < 0.4) {
        fillBox.checked = !fillBox.checked;
        if (fillBox.checked == false) {
            noFill.checked = true;
        } 
    }
    //  ODDS FOR FADE  --------------------
    if (alphaBox.checked == true && blackTraces.checked == true && spawnRate > 2) {
        if (Math.random() < 0.01) {
            alphaBox.checked = false;
        }
    }
    if (alphaBox.checked == false) {
        if (Math.random() < 0.8) {
            alphaBox.checked = true
        }
    }
    //  ODDS FOR DRIFT UPWARD  --------------------
    if (Math.random() < 0.05) {
        moveUpBox.checked = !moveUpBox.checked;
    }
    //  ODDS FOR OUTLINES  --------------------
    if (fillBox.checked == true || gradFillBox.checked == true) {
        var t = Math.random();
        if (t < 0.33) {
            blackTraces.checked = true;
        } else 
        if (t < 0.67) {
            whiteTraces.checked = true;
        } else 
        if (t < 1.00) {
            colorTraces.checked = true;
        }
    } else {
        if (whiteTraces.checked == true) {
            colorTraces.checked = true;
        } else {
            var t = Math.random();
            if (t < 0.7) {
                colorTraces.checked = true;
            } else 
            if (t < 1.0) {
                whiteTraces.checked = true;
            } 
        }
    }
}

//  SPAWN DROPLET  -----------------------------------------
function spawnDroplet(e) {
    y += 0.0001;
    radius = 0;
    maxRadius = 0.1 + sizeSlider.value/10 * Math.random();
    if (satBox.checked) {
        saturation = 30 + 50 * Math.random();
    } else {
        saturation = 10 + 20 * Math.random();
    }
    
    lightness = 30 + 50 * Math.random();
    dispX = -0.0025 + 0.005 * Math.random(); 
    dispY = -0.0025 + 0.005 * Math.random();  
    alpha = 0;
    spin = 0.02 * (-0.5 + Math.random());
    birthday = Date.now();
    const rando = Math.random();
    recang = 0;
    
    //  SPAWN AT SCREEN TOUCH POSITION  --------------------
    if (touchHolding == true) {
        posX = (clientX - canvas.clientLeft)/cScale;
        posY = (clientY - canvas.clientTop)/cScale; 
    }

    //  RANDOM SPAWN  -----------------
    if (spawn.value == "random") {
        if (moveUpBox.checked == true) {
            posX = Math.random() * simWidth;
            posY = Math.random() * 1.3 * simHeight;
        } else
            if (moveDownBox.checked == true) {
                posX = Math.random() * simWidth;
                posY = Math.random() * 1.3 * simHeight - 0.3 * simHeight;
            } else {
                posX = Math.random() * simWidth;
                posY = Math.random() * simHeight;
        }
    }

    if (spawn.value == "swarm") {
        if (Math.random() < 0.01) {
            spawnBackground()  
        } else {
            if (moveUpBox.checked == true) {
                var randomCircleRadius = 0.3 * simHeight;
                var randomCircleAngle = Math.random()*2*Math.PI;
                posX = 0.5 * simWidth + Math.random() * randomCircleRadius * Math.cos(randomCircleAngle);
                posY = 0.9 * simHeight + Math.random() * randomCircleRadius * Math.sin(randomCircleAngle);
            } else {
                var randomCircleRadius = 0.3 * simHeight;
                var randomCircleAngle = Math.random()*2*Math.PI;
                posX = (0.5 * simWidth) + Math.random() * randomCircleRadius * Math.cos(randomCircleAngle);
                posY = (0.5 * simHeight) + Math.random() * randomCircleRadius * Math.sin(randomCircleAngle);
            }
        }  
    }

    if (spawn.value == "wanderingSwarm") {
        if (Math.random() < 0.01) {
            spawnBackground()  
        } else {
            if (Math.random() < 0.5) {
                wanderX += 0.05 * (-0.5 + Math.random());
                wanderY += 0.05 * (-0.5 + Math.random());
            }
            if (moveUpBox.checked == true) {
                var randomCircleRadius = 0.3 * simHeight;
                var randomCircleAngle = Math.random()*2*Math.PI;
                posX = 0.5 * simWidth + Math.random() * randomCircleRadius * Math.cos(randomCircleAngle);
                posY = 0.9 * simHeight + Math.random() * randomCircleRadius * Math.sin(randomCircleAngle);
            } else {
                var randomCircleRadius = 0.3 * simHeight;
                var randomCircleAngle = Math.random()*2*Math.PI;
                posX = (0.5 * simWidth + wanderX) + Math.random() * randomCircleRadius * Math.cos(randomCircleAngle);
                posY = (0.5 * simHeight + wanderY) + Math.random() * randomCircleRadius * Math.sin(randomCircleAngle);

                if (posX >= simWidth) {
                    posX -= simWidth;
                }
                if (posX <= 0) {
                    posX += simWidth;
                }
                if (posY >= simHeight) {
                    posY -= simHeight;
                }
                if (posY <= 0) {
                    posY += simHeight;
                }
            }
        }  
    }

    if (spawn.value == "floor") {
        if (Math.random() < 0.01) {
            spawnBackground()  
        } else {
            if (moveUpBox.checked == true) {
                posX = simWidth * Math.random();
                posY = simHeight + maxRadius;
            } else {
                posX = simWidth * Math.random()
                posY = simHeight;
            }
        }  
    }

    //  LINE DROPLET ANGLE PRESET  ------------------
    if (shape.value == 'lineDroplets' || shape.value == 'line4Droplets' 
    || shape.value == 'line8Droplets' || shape.value == 'line16Droplets' 
    || shape.value == 'medley' || shape.value == 'barbellDroplets') {
        angle = Math.random() * 2 * Math.PI;
    } else {
        angle = 0;
    }

    //  STICK MAN ANGLE PRESET  --------------------
    if (shape.value == 'stickManDroplets') {
        angle = Math.random() * 2 * Math.PI;
    }
    
    //  ANGLE FROM THE ANGLE : chase orbit ------------------
    function getAngle(passoldTourTimer, newX, newY) {
        oldX = (0.5 * simWidth) + (0.4 * simWidth) * Math.cos(passoldTourTimer);
        if (moveUpBox.checked == true) {
            oldY = (0.65 * simHeight) + (0.4 * simHeight) * Math.sin(passoldTourTimer);
        } else {
            oldY = (0.5 * simHeight) + (0.4 * simHeight) * Math.sin(passoldTourTimer);
        }  
        
        // top left ----------
        if (oldX <= newX && oldY >= newY) {
            var dangle = 1.5*Math.PI + (Math.atan(Math.abs(oldY - newY) / -(oldX - newX)));
        } 
        // top right ----------
        if (oldX <= newX && oldY <= newY) {
            var dangle = 1.5*Math.PI + (Math.atan(Math.abs(oldY - newY) / (oldX - newX)));
        }
        // bottom left ----------
        if (oldX >= newX && oldY >= newY) {
            var dangle = 0.5*Math.PI + (Math.atan(Math.abs(oldY - newY) / -(oldX - newX)));
        } 
        // bottom right ----------
        if (oldX >= newX && oldY <= newY) {  
            var dangle = 0.5*Math.PI + (Math.atan(Math.abs(oldY - newY) / (oldX - newX)));
        } 
        return dangle;
    }

    //  ANGLE FROM THE FLANGLE : flower orbits ------------------
    function getFlangle(passOldTourTimer, newX, newY, petalNo, spinIndex) {
        oldX = (0.5 * simWidth) + 0.6 * simHeight * Math.cos(petalNo * passOldTourTimer) * Math.cos(passOldTourTimer + spinIndex);
        if (moveUpBox.checked == true) {
            oldY = (0.65 * simHeight) + 0.6 * simHeight * Math.cos(petalNo * passOldTourTimer) * Math.sin(passOldTourTimer + spinIndex);
        } else {
            oldY = (0.5 * simHeight) + 0.6 * simHeight * Math.cos(petalNo * passOldTourTimer) * Math.sin(passOldTourTimer + spinIndex);
        }  
        // top left ----------
        if (oldX <= newX && oldY >= newY) {
            var dangle = 1.5*Math.PI + (Math.atan(Math.abs(oldY - newY) / -(oldX - newX)));
        } 
        // top right ----------
        if (oldX <= newX && oldY <= newY) {
            var dangle = 1.5*Math.PI + (Math.atan(Math.abs(oldY - newY) / (oldX - newX)));
        }
        // bottom left ----------
        if (oldX >= newX && oldY >= newY) {
            var dangle = 0.5*Math.PI + (Math.atan(Math.abs(oldY - newY) / -(oldX - newX)));
        } 
        // bottom right ----------
        if (oldX >= newX && oldY <= newY) {  
            var dangle = 0.5*Math.PI + (Math.atan(Math.abs(oldY - newY) / (oldX - newX)));
        } 
        orbiterX = newX;
        orbiterY = newY;
        return dangle;
    }

    //  ANGLE FROM THE DANGLE : all other orbits ------------------
    function getDangle(newX, newY, oldX, oldY) {
        // top left ---------- #2
        if (oldX < newX && oldY > newY) {
            var dangle = 1.5*Math.PI + (Math.atan(Math.abs(oldY - newY) / -(oldX - newX)));
        } 
        // top right ---------- #1
        if (oldX < newX && oldY < newY) {
            var dangle = 1.5*Math.PI + (Math.atan(Math.abs(oldY - newY) / (oldX - newX)));
        }
        // bottom left ---------- #3
        if (oldX > newX && oldY > newY) {
            var dangle = 0.5*Math.PI + (Math.atan(Math.abs(oldY - newY) / -(oldX - newX)));
        } 
        // bottom right ---------- #4
        if (oldX > newX && oldY < newY) {  
            var dangle = 0.5*Math.PI + (Math.atan(Math.abs(oldY - newY) / (oldX - newX)));
        }
        orbiterX = newX;
        orbiterY = newY;
        return dangle; 
    }

    //  SOLO VERTICAL FIGURE-8 ORBIT  -----------------
    if (spawn.value == "bernoulliVert") {
        if (Math.random() < 0.01) {
            spawnBackground()  
        } else {
            bernoulliScan += 0.004 / spawnRate;
            if (bernoulliScan >= 1.1*simWidth) {
                bernoulliScan = -0.1*simWidth;
            }
            oldTourTimer = tourTimer;
            tourTimer += (0.04 / spawnRate);
            var pathScale = 2 / (3 - Math.cos(2 * tourTimer));
            if (moveUpBox.checked == true) {
                posY = (0.7 * simHeight) + (0.45 * simHeight) * pathScale * Math.cos(tourTimer);
            } else {
                posY = (0.5 * simHeight) + (0.45 * simHeight) * pathScale * Math.cos(tourTimer);
            }

            posX = (bernoulliScan) + (0.45 * simHeight) * 1.2 * pathScale * Math.sin(2 * tourTimer) / 2;
            
            angle = getDangle(posX, posY, oldX, oldY);
            oldX = posX;
            oldY = posY;
        }
    } 

    //  SOLO FIGURE-8 ORBITS  -----------------
    if (spawn.value == "bernoulliSlow" || spawn.value == "bernoulliFast" || spawn.value == "bernoulliBlazing"
    || spawn.value == "geronoSlow" || spawn.value == "geronoFast") {
        if (Math.random() < 0.01) {
            spawnBackground()  
        } else {
            oldTourTimer = tourTimer;
            if (spawn.value == "geronoSlow" || spawn.value == "geronoFast") {
                var pathScale = 1;
            } else {
                var pathScale = 2 / (3 - Math.cos(2 * tourTimer));
            }
            
            if (spawn.value == 'bernoulliSlow' || spawn.value == "geronoSlow") {
                tourTimer += (0.01 / spawnRate);
            } 
            if (spawn.value == 'bernoulliFast' || spawn.value == "geronoFast") {
                tourTimer += (0.05 / spawnRate);
            }
            if (spawn.value == 'bernoulliBlazing') {
                tourTimer += (1 / spawnRate);
            }

            posX = (0.5 * simWidth) + (0.42 * simWidth) * pathScale * Math.cos(tourTimer);
            
            if (moveUpBox.checked == true) {
                posY = (0.7 * simHeight) + (0.42 * simWidth) * 1.2 * pathScale * Math.sin(2 * tourTimer) / 2;
            } else {
                posY = (0.5 * simHeight) + (0.42 * simWidth) * 1.2 * pathScale * Math.sin(2 * tourTimer) / 2;
            }

            angle = getDangle(posX, posY, oldX, oldY);
            oldX = posX;
            oldY = posY;
        }
    } 
        
    //  DUAL FIGURE-8 ORBIT -----------------
    if (spawn.value == 'dual8') {
        if (Math.random() < 0.01) {
            spawnBackground()  
        } else {
            if (pass1 == true) {
                oldTourTimer = tourTimer;
                tourTimer += 0.01 / spawnRate;
                var pathScale = 2 / (3 - Math.cos(2 * tourTimer));
                posX = (0.5 * simWidth) + (0.45 * simWidth) * pathScale * Math.cos(tourTimer);
                if (moveUpBox.checked == true) {
                    posY = (0.65 * simHeight) + (0.45 * simWidth) * 1.2 * pathScale * Math.sin(2 * tourTimer) / 2;
                } else {
                    posY = (0.5 * simHeight) + (0.45 * simWidth) * 1.2 * pathScale * Math.sin(2 * tourTimer) / 2;
                }
                pass1 = false;
            } else {
                oldTourTimer = tourTimer;
                tourTimer += 0.01 / spawnRate + Math.PI;
                var pathScale = 2 / (3 - Math.cos(2 * tourTimer));
                posX = (0.5 * simWidth) + (0.45 * simWidth) * pathScale * Math.cos(tourTimer);
                if (moveUpBox.checked == true) {
                    posY = (0.65 * simHeight) + (0.45 * simWidth) * 1.2 * pathScale * Math.sin(2 * tourTimer) / 2;
                } else {
                    posY = (0.5 * simHeight) + (0.45 * simWidth) * 1.2 * pathScale * Math.sin(2 * tourTimer) / 2;
                }  
                pass1 = true;
            }
        angle = getDangle(posX, posY, oldX, oldY);
        oldX = posX;
        oldY = posY;
        } 
    }

    //  SOLO CIRCLE ORBIT  -----------------
    if (spawn.value == 'soloCircle' || spawn.value == 'soloFastOval' 
    || spawn.value == 'soloFastCircle' || spawn.value == 'soloLittleCircle') {
        if (Math.random() < 0.01) {
            spawnBackground()
        } else {
            oldTourTimer = tourTimer;
            if (spawn.value == 'soloCircle') {
                tourTimer += 0.01 / spawnRate;
                var aspect = simWidth;
            } 
            if (spawn.value == 'soloFastOval') {
                tourTimer += 0.04 / spawnRate; 
                var aspect = simWidth;
            }
            if (spawn.value == 'soloFastCircle') {
                tourTimer += 0.04 / spawnRate; 
                var aspect = simHeight;
            }
            if (spawn.value == 'soloLittleCircle') {
                tourTimer += 0.1 / spawnRate; 
                var aspect = simHeight;
                posX = (0.5 * simWidth) + (0.15 * simHeight) * Math.cos(tourTimer);
                if (moveUpBox.checked == true) {
                    posY = (0.8 * simHeight) + (0.15 * simHeight) * Math.sin(tourTimer);
                } else {
                    posY = (0.5 * simHeight) + (0.15 * simHeight) * Math.sin(tourTimer);
                }
            } else {
                posX = (0.5 * simWidth) + (0.4 * aspect) * Math.cos(tourTimer);
                if (moveUpBox.checked == true) {
                    posY = (0.65 * simHeight) + (0.4 * simHeight) * Math.sin(tourTimer);
                } else {
                    posY = (0.5 * simHeight) + (0.4 * simHeight) * Math.sin(tourTimer);
                }
            }
            angle = getDangle(posX, posY, oldX, oldY);
            oldX = posX;
            oldY = posY;
        } 
    }

    //  SLOW OVAL CHASE ORBIT  -----------------
    if (spawn.value == 'chase') {
        if (Math.random() < 0.01) {
            spawnBackground()
        } else {
            oldTourTimer = tourTimer;
            if (pass1 == true) {
                tourTimer += 0.01 / spawnRate;
                posX = (0.5 * simWidth) + (0.4 * simWidth) * Math.cos(tourTimer);
                if (moveUpBox.checked == true) {
                    posY = (0.65 * simHeight) + (0.4 * simHeight) * Math.sin(tourTimer);
                } else {
                    posY = (0.5 * simHeight) + (0.4 * simHeight) * Math.sin(tourTimer);
                }  
                pass1 = false;
            } else {
                tourTimer += 0.01 / spawnRate + Math.PI;
                posX = (0.5 * simWidth) + (0.4 * simWidth) * Math.cos(tourTimer + Math.PI);
                if (moveUpBox.checked == true) {
                    posY = (0.65 * simHeight) + (0.4 * simHeight) * Math.sin(tourTimer + Math.PI);
                } else {
                    posY = (0.5 * simHeight) + (0.4 * simHeight) * Math.sin(tourTimer + Math.PI);
                }
                pass1 = true;
            }
            angle = getAngle(oldTourTimer, posX, posY);
        } 
    }

    //  FAST CIRCLE CHASE ORBIT  -----------------
    if (spawn.value == 'chase2') {
        if (Math.random() < 0.01) {
            spawnBackground()
        } else {
            oldTourTimer = tourTimer;
            if (pass1 == true) {
                tourTimer += 0.04 / spawnRate;
                posX = (0.5 * simWidth) + (0.4 * simHeight) * Math.cos(tourTimer);
                if (moveUpBox.checked == true) {
                    posY = (0.65 * simHeight) + (0.4 * simHeight) * Math.sin(tourTimer);
                } else {
                    posY = (0.5 * simHeight) + (0.4 * simHeight) * Math.sin(tourTimer);
                }  
                pass1 = false;
            } else {
                tourTimer += 0.04 / spawnRate + Math.PI;
                posX = (0.5 * simWidth) + (0.4 * simHeight) * Math.cos(tourTimer + Math.PI);
                if (moveUpBox.checked == true) {
                    posY = (0.65 * simHeight) + (0.4 * simHeight) * Math.sin(tourTimer + Math.PI);
                } else {
                    posY = (0.5 * simHeight) + (0.4 * simHeight) * Math.sin(tourTimer + Math.PI);
                }
                pass1 = true;
            }
            angle = getAngle(oldTourTimer, posX, posY);
        } 
    }

    //  DNA ORBIT  -----------------
    if (spawn.value == 'dna') {
        if (Math.random() < 0.01) {
            spawnBackground()
        } else {
            oldTourTimer = tourTimer;
            tourTimer += 0.05 / spawnRate;
            dnaMover += 0.005 / spawnRate;

            if (pass1 == true) {
                posX = (0.5 * simWidth) + (0.3 * simWidth) * Math.sin(tourTimer);
                pass1 = false;
            } else {
                posX = (0.5 * simWidth) - (0.3 * simWidth) * Math.sin(tourTimer);
                pass1 = true;
            }

            if (posY > simHeight) {
                dnaMover = 0;
            }

            if (moveUpBox.checked == true) {
                posY = 1.5 * simHeight * dnaMover;
            } else {
                posY = simHeight * dnaMover;
            }  
        
            angle = getAngle(oldTourTimer, posX, posY);
        } 
    }

    //  DUAL CICLE CHASE ORBIT  -----------------
    if (spawn.value == 'chase3' || spawn.value == 'chase4') {
        if (Math.random() < 0.01) {
            spawnBackground()  
        } else {
            oldTourTimer = tourTimer;
            if (pass1 == true) {
                if (spawn.value == 'chase3') {
                    tourTimer += 0.02 / spawnRate;
                }
                if (spawn.value == 'chase4') {
                    tourTimer += 0.2 / spawnRate;
                }
                posX = (0.5 * simWidth) + (0.45 * simHeight) * Math.cos(tourTimer);
                if (moveUpBox.checked == true) {
                    posY = (0.65 * simHeight) + (0.45 * simHeight) * Math.sin(tourTimer);
                } else {
                    posY = (0.5 * simHeight) + (0.45 * simHeight) * Math.sin(tourTimer);
                }  
                pass1 = false;
            } else {
                if (spawn.value == 'chase3') {
                    tourTimer += 0.04 / spawnRate + Math.PI;
                }
                if (spawn.value == 'chase4') {
                    tourTimer += 0.4 / spawnRate + Math.PI;
                }
                posX = (0.5 * simWidth) + (0.2 * simHeight) * Math.sin(tourTimer + Math.PI);
                if (moveUpBox.checked == true) {
                    posY = (0.65 * simHeight) + (0.2 * simHeight) * Math.cos(tourTimer + Math.PI);
                } else {
                    posY = (0.5 * simHeight) + (0.2 * simHeight) * Math.cos(tourTimer + Math.PI);
                }
                pass1 = true;
            }
            angle = getDangle(posX, posY, oldX, oldY);
            oldX = posX;
            oldY = posY;
        } 
    }

    //  SPIRAL ORBIT  -----------------
    if (spawn.value == 'spiral' || spawn.value == 'spiral2' ) {
        if (Math.random() < 0.01) {
            spawnBackground()  
        } else {
            oldTourTimer = tourTimer;
            if (spawn.value == 'spiral') {
                tourTimer += 0.03 / spawnRate;
            } else {
                tourTimer += 0.15 / spawnRate;
            }
            
            posX = (0.5 * simWidth) + (Math.cos(0.05 * tourTimer) * 0.5 * simWidth) * Math.cos(tourTimer);
            if (moveUpBox.checked == true) {
                posY = (0.65 * simHeight) + (Math.cos(0.05 * tourTimer) * 0.5 * simHeight) * Math.sin(tourTimer);
            } else {
                posY = (0.5 * simHeight) + (Math.cos(0.05 * tourTimer) * 0.5 * simHeight) * Math.sin(tourTimer);
            }
            angle = getDangle(posX, posY, oldX, oldY);
            oldX = posX;
            oldY = posY;
        } 
    }

    //  FLY ORBIT  -----------------
    if (spawn.value == 'fly') {
            if (posX > simWidth) {
                posX = 0;
            } 
            if (posX < 0) {
                posX = simWidth;
            }
            if (posY > simHeight) {
                posY = 0;
            }
            if (posY < 0) {
                posY = simHeight;
            } 
            posX += 0.02 * Math.cos(steering) / spawnRate;
            posY += 0.02 * Math.sin(steering) / spawnRate;
            angle = getDangle(posX, posY, oldX, oldY);
            oldX = posX;
            oldY = posY;
    }

    //  SINE ORBIT  -----------------
    if (spawn.value == 'sine') {
        if (Math.random() < 0.01) {
            spawnBackground()  
        } else {
            oldTourTimer = tourTimer;
            tourTimer += 0.002 / spawnRate;
            if (posX >= simWidth) {
                posX = 0;
                tourTimer = 0;
            } else {
                posX = tourTimer / 0.3 * simWidth;
            }
            
            if (moveUpBox.checked == true) {
                posY = 0.94 * simHeight - 0.2 * simHeight * Math.sin(10 * tourTimer);   
            } else {
                posY = 0.4 * simHeight - 0.2 * simHeight * Math.sin(10 * tourTimer);
            }
            angle = getDangle(posX, posY, oldX, oldY);
            oldX = posX;
            oldY = posY;
        }
    }

    //  CARDIOID ORBIT  -----------------
    if (spawn.value == 'cardioid') {
        if (Math.random() < 0.01) {
            spawnBackground()  
        } else {
            oldTourTimer = tourTimer;
            tourTimer += 0.03 / spawnRate;
            posX = (0.5 * simWidth) + 0.38 * simHeight * (1 + Math.sin(1 * tourTimer)) * Math.cos(tourTimer);
            if (moveUpBox.checked == true) {
                posY = (0.95 * simHeight) - 0.38 * simHeight * (1 + Math.sin(1 * tourTimer)) * Math.sin(tourTimer);   
            } else {
                posY = (0.85 * simHeight) - 0.38 * simHeight * (1 + Math.sin(1 * tourTimer)) * Math.sin(tourTimer);   
            }
            angle = getDangle(posX, posY, oldX, oldY);
            oldX = posX;
            oldY = posY;
        }
    }

    if (spawn.value == 'rose') {
        if (Math.random() < 0.01) {
            spawnBackground()  
        } else {
            oldTourTimer = tourTimer;
            tourTimer += 0.03 / spawnRate;
            posX = (0.5 * simWidth) + 0.6 * simHeight * Math.cos(tourTimer / 5) * Math.cos(tourTimer);
            if (moveUpBox.checked == true) {
                posY = (0.7 * simHeight) - 0.6 * simHeight * Math.cos(tourTimer / 5) * Math.sin(tourTimer);   
            } else {
                posY = (0.5 * simHeight) - 0.6 * simHeight * Math.cos(tourTimer / 5) * Math.sin(tourTimer);   
            }
            angle = getDangle(posX, posY, oldX, oldY);
            oldX = posX;
            oldY = posY;
        }
    }

    //  LIMACON ORBIT  -----------------
    if (spawn.value == 'limacon') {
        if (Math.random() < 0.01) {
            spawnBackground() 
        } else {
            oldTourTimer = tourTimer;
            tourTimer += 0.03 / spawnRate;
            posX = (0.5 * simWidth) + (0.4 * simWidth) * (0.5 - Math.sin(tourTimer)) * Math.cos(tourTimer);
            if (moveUpBox.checked == true) {
                posY = (simHeight) + (0.55 * simHeight) * (0.5 - Math.sin(tourTimer)) * Math.sin(tourTimer);
            } else {
                posY = (0.9 * simHeight) + (0.55 * simHeight) * (0.5 - Math.sin(tourTimer)) * Math.sin(tourTimer);
            }
            angle = getDangle(posX, posY, oldX, oldY);
            oldX = posX;
            oldY = posY;
        }
    }

    //  WARPED LIMACON ORBITS - pretzels -----------------
    if (spawn.value == 'limacon2' || spawn.value == 'limacon2slow') {
        if (Math.random() < 0.01) {
            spawnBackground()  
        } else {
            oldTourTimer = tourTimer;
            if (spawn.value == 'limacon2') {
                tourTimer += 0.03 / spawnRate;
            } else {
                    tourTimer += 0.01 / spawnRate;
            }
            posX = (0.5 * simWidth) + (0.5 * simWidth) * (0.5 - Math.sin(tourTimer)) * Math.cos(tourTimer);
            if (moveUpBox.checked == true) {
                posY = (0.5 * simHeight) + (0.8 * simHeight) * (Math.sin(tourTimer)) * Math.sin(tourTimer);
            } else {
                posY = (0.12 * simHeight) + (0.8 * simHeight) * (Math.sin(tourTimer)) * Math.sin(tourTimer);
            }
            angle = getDangle(posX, posY, oldX, oldY);
            oldX = posX;
            oldY = posY;
        }
    }

    //  FLOWER ORBITS  -----------------
    if (spawn.value == '3petals' || spawn.value == '4petals' 
    || spawn.value == '5petals' || spawn.value == '8petals' 
    || spawn.value == '3petalsX3' || spawn.value == 'butterfly' 
    || spawn.value == 'butterfly2') {
        if (spawn.value == '3petals') {
            var petalNo = 3;
        }
        if (spawn.value == '3petalsX3') {
            var petalNo = 3;
        }
        if (spawn.value == '4petals') {
            var petalNo = 2;
        }
        if (spawn.value == '5petals') {
            var petalNo = 5;
        }
        if (spawn.value == '8petals') {
            var petalNo = 4;
        }

        if (Math.random() < 0.01) {
            spawnBackground()  
        } else {
            oldTourTimer = tourTimer;
            if (spawn.value == '3petalsX3') {
                tourTimer += 0.005 / spawnRate;
            }  
            if (spawn.value == 'butterfly' ||spawn.value == 'butterfly2') {
                tourTimer += 0.04 / spawnRate; 
            }  
            if (spawn.value == '5petals' || spawn.value == '8petals'){
                tourTimer += 0.005 / spawnRate; 
            } else {
                tourTimer += 0.01 / spawnRate; 
            }
            
            if (spinBox.checked == true) {
                spinIndex -= 0.0004
            }
            if (spinBox2.checked == true) {
                spinIndex -= 0.007
            }

        if (spawn.value == 'butterfly' || spawn.value == 'butterfly2') {
            var flyPath = Math.pow(Math.E, Math.cos(tourTimer)) - 2 * Math.cos(4 * tourTimer) - ((10*Math.sin(tourTimer) - 5*Math.sin(3*tourTimer) + Math.sin(5*tourTimer)) / 16);
            if (butterflyPass1 == true) {
                posX = 0.5 * simWidth + 0.15 * simHeight * Math.sin(tourTimer) * flyPath;
                if (spawn.value == 'butterfly2') {
                    butterflyPass1 = false;
                }
            } else {
                posX = 0.5 * simWidth - 0.15 * simHeight * Math.sin(tourTimer) * flyPath;
                butterflyPass1 = true;
            }
            if (moveUpBox.checked == true) {
                posY = 0.8 * simHeight - 0.15 * simHeight * Math.cos(tourTimer) * flyPath;
            } else {
                posY = 0.6 * simHeight - 0.15 * simHeight * Math.cos(tourTimer) * flyPath;
            }   
        } else
            if (spawn.value == '3petalsX3') {
                if (pass == 1) {
                    posX = (0.5 * simWidth) + 0.45 * simWidth * Math.cos(petalNo * tourTimer) * Math.cos(tourTimer + spinIndex + 2 * Math.PI / 3);
                    posY = (0.5 * simHeight) + 0.45 * simWidth * Math.cos(petalNo * tourTimer) * Math.sin(tourTimer + spinIndex + 2 * Math.PI / 3);
                    pass = 2;
                } else 
                if (pass == 2) {  
                    posX = (0.5 * simWidth) + 0.45 * simWidth * Math.cos(petalNo * tourTimer) * Math.cos(tourTimer + spinIndex);
                    posY = (0.5 * simHeight) + 0.45 * simWidth * Math.cos(petalNo * tourTimer) * Math.sin(tourTimer + spinIndex);
                    pass = 3;
                } else
                if (pass == 3) {
                    posX = (0.5 * simWidth) + 0.45 * simWidth * Math.cos(petalNo * tourTimer) * Math.cos(tourTimer + spinIndex + 4 * Math.PI / 3);
                    posY = (0.5 * simHeight) + 0.45 * simWidth * Math.cos(petalNo * tourTimer) * Math.sin(tourTimer + spinIndex + 4 * Math.PI / 3);
                    pass = 1;
                }
            } else {
                posX = (0.5 * simWidth) + 0.6 * simHeight * Math.cos(petalNo * tourTimer) * Math.cos(tourTimer + spinIndex);
                posY = (0.5 * simHeight) + 0.6 * simHeight * Math.cos(petalNo * tourTimer) * Math.sin(tourTimer + spinIndex);
            }
        }
        if (spawn.value == 'butterfly' || spawn.value == 'butterfly2') {
            angle = getDangle(posX, posY, oldX, oldY);
        } else {
            angle = getDangle(oldX, oldY, posX, posY);
            //(oldTourTimer, posX, posY, petalNo, spinIndex);
        }
        oldX = posX;
        oldY = posY;
    }

    //  SPAWN IN GRID  -----------------
    if (spawn.value == '3x3a' || spawn.value == '4x4a' || spawn.value == '5x5a' 
    || spawn.value == '6x6a' || spawn.value == '7x7a' || spawn.value == '8x8a' 
    || spawn.value == '9x9a' || spawn.value == '10x10a' || spawn.value == '12x12a' 
    || spawn.value == '15x15a' || spawn.value == '20x20a' || spawn.value == '50x50a'
    || spawn.value == '3x3b' || spawn.value == '4x4b' || spawn.value == '5x5b' 
    || spawn.value == '6x6b' || spawn.value == '7x7b' || spawn.value == '8x8b' 
    || spawn.value == '9x9b' || spawn.value == '10x10b' || spawn.value == '12x12b' 
    || spawn.value == '15x15b' || spawn.value == '20x20b' || spawn.value == '50x50b') {
        if (spawn.value == '3x3a') {
            grid = 3;
            goAhead = false;
        }
        if (spawn.value == '3x3b') {
            grid = 3;
            goAhead = true;
        }
        if (spawn.value == '4x4a') {
            grid = 4;
            goAhead = false;
        }
        if (spawn.value == '4x4b') {
            grid = 4;
            goAhead = true;
        }
        if (spawn.value == '5x5a') {
            grid = 5;
            goAhead = false;
        }
        if (spawn.value == '5x5b') {
            grid = 5;
            goAhead = true;
        }
        if (spawn.value == '10x10a') {
            grid = 10;
            goAhead = false;
        }
        if (spawn.value == '10x10b') {
            grid = 10;
            goAhead = true;
        }
        if (spawn.value == '20x20a') {
            grid = 20;
            goAhead = false;
        }
        if (spawn.value == '20x20b') {
            grid = 20;
            goAhead = true;
        }
        if (spawn.value == '50x50a') {
            grid = 50;
            goAhead = false;
        }
        if (spawn.value == '50x50b') {
            grid = 50;
            goAhead = true;
        }
        // spacing
        hSpace = simWidth / (grid -1);
        vSpace = simHeight / (grid - 1);
            
        if (j > grid - 1) {
            j = 0;
        }
        // add row if moving up
        if (moveUpBox.checked == true) {
            if (k > grid + 2) {
                k = 0;
            }
        } else {
            if (k > grid - 1) {
                k = 0;
            }
        }
        // indent even rows
        if (goAhead == true) {
            if (k % 2 == 0) {
                posX = j * hSpace;
            } else {
                posX = j * hSpace + 0.5 * hSpace;
            }
        } else {
            posX = j * hSpace;
        }

        posY = k * vSpace; 
        j += 1
        if (j == grid - 1) {
            k += 1;
        }  
    }

    //  AUTO SPAWN  -----------------
    if (autoSpawn == true && spawn.value == 'bernoulliSlow' && spawn.value == 'bernoulliFast' 
    && spawn.value == 'geronoSlow' && spawn.value == 'geronoFast' && spawn.value == 'bernoulliVert'
    && spawn.value == 'bernoulliBlazing' && spawn.value == 'dual8' && spawn.value == 'chase' 
    && spawn.value == 'chase2' && spawn.value == 'chase3' && spawn.value == 'chase4' 
    && spawnValue == 'spiral' && spawnValue == 'spiral2' && spawnValue == 'grid' && spawn.value == 'soloCircle' 
    && spawn.value == 'soloFastCirle') {
        if (moveUpBox.checked == true) {
            posX = Math.random() * simWidth;
            posY = Math.random() * 1.3 * simHeight;
            } else
            if (moveDownBox.checked == true) {
                posX = Math.random() * simWidth;
                posY = Math.random() * 1.3 * simHeight - 0.3 * simHeight;
            } else {
                posX = Math.random() * simWidth;
                posY = Math.random() * simHeight;
            }
        }

    //  SPAWN AT MOUSE POSITION  -----------------
    if (mouseHolding == true || spawn.value == 'mouseOnly') { 
        if (Math.random() < 0.01) {
            spawnBackground()  
        } else {
            if (e.offsetX == undefined) {
                posX = (lastMouseX - canvas.clientLeft)/cScale;
                posY = (lastMouseY - canvas.clientTop)/cScale;  
            } else {
                posX = (e.offsetX - canvas.clientLeft)/cScale;
                posY = (e.offsetY - canvas.clientTop)/cScale; 
                lastMouseX = e.offsetX;
                lastMouseY = e.offsetY;
            }
        }
    }
    
    document.getElementById('spawn').oninput = function() {
        if (spawn.value != 'mouseOnly')
        mouseHolding = false;
    }

    //  CHOOSE TYPE FOR MEDLEY  ------------------
    if (shape.value == 'medley') {
        q = Math.random() * 20;
            if (q < 0.5) {
                if (fillBox.checked == true || gradFillBox.checked == true) {
                    type = 'star'
                } else {
                    type = 'line';
                }
            } else 
            if (q < 1) {
                type = 'line4';
            } else 
            if (q < 2) {
                if (fillBox.checked == true || gradFillBox.checked == true) {
                    type = 'moon'
                } else {
                    type = 'line16';
                }
            } else 
            if (q < 3) {
                type = 'circle';
            } else 
            if (q < 4) {
                type = 'ellipse';
            } else
            if (q < 4.2) {
                type = 'triangleU';
            } else
            if (q < 4.4) {
                type = 'triangleD';
            } else
            if (q < 4.6) {
                type = 'triangleL';
            } else
            if (q < 4.8) {
                type = 'triangleR';
            } else
            if (q < 5) {
                type = 'triangleR';
                angle = Math.random() * 0.3 * Math.PI;
            } else
            if (q < 5.33) {
                type = 'square';
                angle = 0;
            } else
            if (q < 5.67) {
                type = 'square';
                angle = 0.25 * Math.PI;
            } else
            if (q < 5.00) {
                type = 'square';
                angle = Math.random() * 0.25 * Math.PI
            } else
            if (q < 6) {
                type = 'decoTriStar';
                angle = Math.random() * 0.25 * Math.PI
            } else
            if (q < 7) {
                type = 'decoQuadStar';
                angle = Math.random() * Math.PI;
            } else
            if (q < 7.33) {
                type = 'star1';
                angle = Math.random() * Math.PI;
            } else
            if (q < 7.67) {
                type = 'star2';
                angle = Math.random() * Math.PI;
            } else
            if (q < 8) {
                type = 'sun'
            } else
            if (q < 9) {
                type = 'heart'
            } else
            if (q < 9.25) {
                type = 'flower1'
                angle = Math.random() * Math.PI;
            } else
            if (q < 9.5) {
                type = 'flower2'
                angle = Math.random() * Math.PI;
            } else
            if (q < 9.75) {
                type = 'flower3'
                angle = Math.random() * Math.PI;
            } else
            if (q < 10) {
                type = 'flower4'
                angle = Math.random() * Math.PI;
            } else
            if (q < 11) {
                type = 'moon'
            } else
            if (q < 12) {
                type = 'concCircle'
            } else
            if (q < 13) {
                type = 'plainArrow'
            } else
            if (q < 14) {
                type = 'fancyArrow'
            } else
            if (q < 15) {
                type = 'triPoly3'
            } else
            if (q < 16) {
                type = 'triPoly5'
            } else
            if (q < 17) {
                type = 'canuck'
                } else 
            if (q < 18) {
                type = 'smiley';
            } else
            if (q < 19) {
                type = 'pizza';
            } 

        // left band
        if (posX < 0.33 * simWidth) {
            if (rando < 0.5) {
                hue = 360 * Math.cos(y);
            } else 
            if (rando < 1.0) {
                hue = 360 * Math.sin(y);
            } 
        } else // middle band
        if (posX < 0.67 * simWidth) {
            if (rando < 0.50) {
                hue = 360 * Math.cos(y + 2*Math.PI/3);
            } else 
            if (rando < 1.0) {
                hue = 360 * Math.sin(y + 2*Math.PI/3);
            }
        } else // right band
        if (posX < simWidth) {
            if (rando < 0.50) {
                hue = 360 * Math.cos(y - 2*Math.PI/3);
            } else 
            if (rando < 1.00) {
                hue = 360 * Math.sin(y - 2*Math.PI/3);
            } 
        }
    }

    //  UP-DOWN TRIANGLES  -----------------
    if (shape.value == 'triangleDroplets') {
        // left band
        if (posX < 0.33 * simWidth) {
            if (rando < 0.5) {
                type = 'triangleU';
                hue = 360 * Math.cos(y);
            } else 
            if (rando < 1.0) {
                type = 'triangleD';
                hue = 360 * Math.sin(y);
            } 
        } else // middle band
        if (posX < 0.67 * simWidth) {
            if (rando < 0.50) {
                type = 'triangleU';
                hue = 360 * Math.cos(y + 2*Math.PI/3);
            } else 
            if (rando < 1.0) {
                type = 'triangleD';
                hue = 360 * Math.sin(y + 2*Math.PI/3);
            }
        } else // right band
        if (posX < simWidth) {
            if (rando < 0.50) {
                type = 'triangleU';
                hue = 360 * Math.cos(y - 2*Math.PI/3);
            } else 
            if (rando < 1.00) {
                type = 'triangleD';
                hue = 360 * Math.sin(y - 2*Math.PI/3);
            } 
        }
    }

    //  LEFT-RIGHT TRIANGLES  -----------------
    if (shape.value == 'triangle2Droplets') {
        // left band
        if (posX < 0.33 * simWidth) {
            if (rando < 0.5) {
                type = 'triangleL';
                hue = 360 * Math.cos(y);
            } else 
            if (rando < 1.0) {
                type = 'triangleR';
                hue = 360 * Math.sin(y);
            } 
        } else // middle band
        if (posX < 0.67 * simWidth) {
            if (rando < 0.50) {
                type = 'triangleL';
                hue = 360 * Math.cos(y + 2*Math.PI/3);
            } else 
            if (rando < 1.0) {
                type = 'triangleR';
                hue = 360 * Math.sin(y + 2*Math.PI/3);
            }
        } else // right band
        if (posX < simWidth) {
            if (rando < 0.50) {
                type = 'triangleL';
                hue = 360 * Math.cos(y - 2*Math.PI/3);
            } else 
            if (rando < 1.00) {
                type = 'triangleR';
                hue = 360 * Math.sin(y - 2*Math.PI/3);
            } 
        }
    }

    //  RANDOM ROTATION TRIANGLES  -----------------
    if (shape.value == 'triangleRDroplets') {
        type = 'triangleU';
        // left band
        if (posX < 0.33 * simWidth) {
            if (rando < 0.5) {
                hue = 360 * Math.cos(y);
            } else 
            if (rando < 1.0) {
                hue = 360 * Math.sin(y);
            } 
        } else // middle band
        if (posX < 0.67 * simWidth) {
            if (rando < 0.50) {
                hue = 360 * Math.cos(y + 2*Math.PI/3);
            } else 
            if (rando < 1.0) {
                hue = 360 * Math.sin(y + 2*Math.PI/3);
            }
        } else // right band
        if (posX < simWidth) {
            if (rando < 0.50) {
                hue = 360 * Math.cos(y - 2*Math.PI/3);
            } else 
            if (rando < 1.00) {
                hue = 360 * Math.sin(y - 2*Math.PI/3);
            } 
        }
    }

    //  ELLIPSES  -----------------
    if (shape.value == 'ellipseDroplets' || shape.value == 'ellipseHDroplets' || shape.value == 'ellipseVDroplets') {
        type = 'ellipse';
        if (spawn.value == 'random' || spawn.value == 'swarm') {
            //  make vertical  ----------
            if (shape.value == 'ellipseVDroplets') {
                angle = 0.5 * Math.PI;
            }
            //  make random  ----------
            if (shape.value == 'ellipseDroplets') {
                angle = Math.random() * Math.PI;
            }
        }
        
        // left band
        if (posX < 0.33 * simWidth) {
            if (rando < 0.50) {
                hue = 360 * Math.cos(y);
            } else 
            if (rando < 1.00) {
                hue = 360 * Math.sin(y);
            } 
        } else // middle band
        if (posX < 0.67 * simWidth) {
            if (rando < 0.50) {
                hue = 360 * Math.cos(y + 2*Math.PI/3);
            } else 
            if (rando < 1.00) {
                hue = 360 * Math.sin(y + 2*Math.PI/3);
            } 
        } else // right band
        if (posX < simWidth) {
            if (rando < 0.48) {
                hue = 360 * Math.cos(y - 2*Math.PI/3);
            } else 
            if (rando < 1.00) {
                hue = 360 * Math.sin(y - 2*Math.PI/3);
            } 
        }
    }

    //  ATOM DROPLETS  -------------------
    if (shape.value == 'atomDroplets') {
        type = 'atom';
        if (spawn.value == 'random' || spawn.value == 'swarm') {
            angle = Math.random() * 2 * Math.PI;
        }
    }
    
    //  INITIAL ROTATION OFFSETS  -----------------
    if (spawn.value == "random" || spawn.value == "swarm" || spawn.value == "floor") {
        if (shape.value == 'triangleRDroplets') {
        angle = Math.random() * Math.PI / 3;
        }
    }
    
    //  MAKE STARS AND FLOWERS VERTICAL  --------------------
    if (spawn.value != 'random' && spawn.value != 'swarm' && spawn.value != "floor") {
        if (shape.value == 'star1Droplets') {
            angle = Math.PI / 10;
        }
        if (shape.value == 'star2Droplets') {
            angle = Math.PI / 5;
        }
        if (shape.value == 'flower1Droplets') {
            angle = Math.PI / 3;
        }
        if (shape.value == 'flower3Droplets') {
            angle = Math.PI / 4;
        }
        if (shape.value == 'flower3Droplets') {
            angle = Math.PI / 4;
        }
        if (shape.value == 'flower4Droplets') {
            angle = Math.PI / 4;
        }
    }
    
    //  SINGLE DROPLET MODES  -----------------
    if (shape.value == 'lineDroplets' || shape.value == 'barbellDroplets'
    || shape.value == 'line4Droplets'
    || shape.value == 'line8Droplets'  || shape.value == 'line16Droplets' 
    || shape.value == 'lineRDroplets' || shape.value == 'stickManDroplets'
    || shape.value == 'triPoly3Droplets' || shape.value == 'triPoly5Droplets'
    || shape.value == 'circleDroplets' || shape.value == 'concCircleDroplets'
    || shape.value == 'smileyDroplets' || shape.value == 'bubbleDroplets'
    || shape.value == 'moonDroplets' || shape.value == 'fancyArrowDroplets'
    || shape.value == 'plainArrowDroplets' || shape.value == 'softDroplets'
    || shape.value == 'fuzzyDroplets'  || shape.value == 'radiiDroplets' 
    || shape.value == 'decoDroplets' || shape.value == 'decoTriDroplets' 
    || shape.value == 'pinwheelDroplets' || shape.value == 'rectangleDroplets'
    || shape.value == 'squareDroplets' || shape.value == 'diamondDroplets' 
    || shape.value == 'squareRDroplets' || shape.value == 'dustDroplets'
    || shape.value == 'star1Droplets' || shape.value == 'star2Droplets'
    || shape.value == 'starRDroplets' || shape.value == 'sunDroplets' 
    || shape.value == 'heartDroplets' || shape.value == 'flower1Droplets'
    || shape.value == 'flower2Droplets' || shape.value == 'flower3Droplets'
    || shape.value == 'flower4Droplets' || shape.value == 'flower5Droplets'
    || shape.value == 'lotusDroplets' || shape.value == 'greatLotusDroplets'
    || shape.value == 'canuckDroplets' || shape.value == 'atomDroplets'
    || shape.value == 'pizzaDroplets' || shape.value == 'shroomDroplets'
    || shape.value == 'spiralDroplets' || shape.value == 'numberDroplets'
    || shape.value == 'figureEightDroplets') {   

        if(shape.value == 'figureEightDroplets') {
            type = 'figureEight';
        }
        if(shape.value == 'numberDroplets') {
            type = 'number';
        }
        if(shape.value == 'pizzaDroplets') {
            type = 'pizza'
            if (spawn.value == 'random' || spawn.value == 'swarm') {
                angle = 2 * Math.PI * Math.random();
            }
        }
        if (shape.value == 'shroomDroplets') {
            type = 'shroom';
            if (spawn.value == 'random' || spawn.value == 'swarm') {
                angle = 2 * Math.PI * Math.random();
            }
        }
        if (shape.value == 'spiralDroplets') {
            type = 'spirals';
            if (spawn.value == 'random' || spawn.value == 'swarm') {
                angle = 2 * Math.PI * Math.random();
            }
        }
        if (shape.value == 'lineDroplets') {
            type = 'line';
        }
        if (shape.value == 'barbellDroplets') {
            type = 'barbell';
        }
        if (shape.value == 'line4Droplets') {
            type = 'line4';
        }
        if (shape.value == 'line8Droplets') {
            type = 'line8';
        }
        if (shape.value == 'line16Droplets') {
            type = 'line16';
        }
        if (shape.value == 'lineRDroplets') {
            var d = Math.random();
            if (d < 0.25) {
                type = 'line';
            } else 
            if (d < 0.50) {
                type = 'line4';
            } else
            if (d < 0.75) {
                type = 'line8';
            } else
            if (d < 1.00) {
                type = 'line16';
            }
            angle = Math.random() * Math.PI
        }
        if (shape.value == 'stickManDroplets') {
            type = 'stickMan';
        }
        if (shape.value == 'triPoly3Droplets') {
            type = 'triPoly3';
        }
        if (shape.value == 'triPoly5Droplets') {
            type = 'triPoly5';
        }
        if (shape.value == 'circleDroplets') {
            type = 'circle';
        }
        if (shape.value == 'concCircleDroplets') {
            type = 'concCircle';
        }
        if (shape.value == 'smileyDroplets') {
            if (Math.random() < 0.98) {
                type = 'smiley';
            } else {
                type = 'pouty';
            }
            if (spawn.value == 'random' || spawn.value == 'swarm') {
                angle = 0.67 * (-0.5 + Math.random()) * Math.PI;
            }
        }
        if (shape.value == 'bubbleDroplets') {
            type = 'bubble';
        }
        if (shape.value == 'softDroplets') {
            type = 'soft';
        }
        if (shape.value == 'dustDroplets') {
            type = 'dust';
        }
        if (shape.value == 'moonDroplets') {
            type = 'moon';
            if (spawn.value == 'random' || spawn.value == 'swarm') {
                angle = 2 * Math.PI * Math.random();
            }
        }
        if (shape.value == 'fancyArrowDroplets') {
            type = 'fancyArrow';
            if (spawn.value != 'soloCircle' && spawn.value != 'soloFastOval'
            && spawn.value != 'soloFastCircle'
            && spawn.value != 'soloLittleCircle' && spawn.value != 'chase'
            && spawn.value != 'chase2' && spawn.value != 'chase3' 
            && spawn.value != 'chase4' && spawn.value != 'cardioid'
            && spawn.value != 'rose' && spawn.value != 'dna'
            && spawn.value != 'limacon' && spawn.value != 'limacon2' 
            && spawn.value != 'limacon2slow' && spawn.value != 'sine' 
            && spawn.value != 'fly' 
            && spawn.value != 'butterfly' && spawn.value != 'butterfly2' 
            && spawn.value != 'spiral' && spawn.value != 'spiral2'
            && spawn.value != '3petals' && spawn.value != '3petalsX3'
            && spawn.value != '4petals' && spawn.value != '5petals'
            && spawn.value != '8petals' 
            && spawn.value != 'bernoulliSlow' && spawn.value != 'bernoulliFast'
            && spawn.value != 'bernoulliVert'
            && spawn.value != 'geronoSlow' && spawn.value != 'geronoFast'
            && spawn.value != 'bernoulliBlazing' && spawn.value != 'dual8') {
                angle = Math.random() * 2 * Math.PI;
            }
        }
        if (shape.value == 'plainArrowDroplets') {
            type = 'plainArrow';
            if (spawn.value != 'soloCircle' && spawn.value != 'soloFastOval'
            && spawn.value != 'soloFastCircle'
            && spawn.value != 'soloLittleCircle' && spawn.value != 'chase'
            && spawn.value != 'chase2' && spawn.value != 'chase3' 
            && spawn.value != 'chase4' && spawn.value != 'cardioid'
            && spawn.value != 'rose' && spawn.value != 'dna'
            && spawn.value != 'limacon' && spawn.value != 'limacon2' 
            && spawn.value != 'limacon2slow' && spawn.value != 'sine' 
            && spawn.value != 'fly' 
            && spawn.value != 'butterfly' && spawn.value != 'butterfly2' 
            && spawn.value != 'spiral' && spawn.value != 'spiral2'
            && spawn.value != '3petals' && spawn.value != '3petalsX3'
            && spawn.value != '4petals' && spawn.value != '5petals'
            && spawn.value != '8petals' 
            && spawn.value != 'bernoulliSlow' && spawn.value != 'bernoulliFast'
            && spawn.value != 'geronoSlow' && spawn.value != 'geronoFast'
            && spawn.value != 'bernoulliVert'
            && spawn.value != 'bernoulliBlazing' && spawn.value != 'dual8') {
                angle = Math.random() * 2 * Math.PI;
            }
        }
        if (shape.value == 'fuzzyDroplets') {
            type = 'fuzz';
        }
        if (shape.value == 'radiiDroplets') {
            type = 'radii';
        }
        if (shape.value == 'squareDroplets') {
            type = 'square';
        }
        if (shape.value == 'diamondDroplets') {
            type = 'diamond'
        }
        if (shape.value == 'squareRDroplets') {
            type = 'square';
            angle = Math.random() * Math.PI / 4;
        }
        if (shape.value == 'rectangleDroplets') {
            type = 'rectangle';
            recang = 10 + 70 * Math.random();
        }
        if (shape.value == 'decoTriDroplets') {
            type = 'decoTriStar';
            if (spawn.value == 'random' || spawn.value == 'swarm') {
                angle = 2 * Math.PI * Math.random();
            }
        }
        if (shape.value == 'decoDroplets') {
            type = 'decoQuadStar';
        }
        if (shape.value == 'star1Droplets') {
            type = 'star1';
        }
        if (shape.value == 'star2Droplets') {
            type = 'star2';
        }
        if (shape.value == 'starRDroplets') {
            var d = Math.random();
            if (d < 0.25) {
                type = 'decoQuadStar';
            } else
            if (d < 0.50) {
                type = 'star1'
            } else
            if (d < 0.75) {
                type = 'star2';
            } else
            if (d < 1.00) {
                type = 'sun';
            }
            angle = Math.random() * Math.PI
        }
        if (shape.value == 'sunDroplets') {
            type = 'sun';
            if (spawn.value == 'random' || spawn.value == 'swarm') {
                angle = Math.random() * 2 * Math.PI;
            }
        }
        if (shape.value == 'pinwheelDroplets') {
            type = 'pinwheel';
            if (spawn.value == 'random' || spawn.value == 'swarm') {
                angle = Math.random() * 2 * Math.PI;
            }
        }
        if (shape.value == 'heartDroplets') {
            type = 'heart';
        }
        if (shape.value == 'canuckDroplets') {
            type = 'canuck';
            if (spawn.value == 'random' || spawn.value == 'swarm') {
                angle = Math.random() * 2 * Math.PI;
            }
        }
        if (shape.value == 'flower1Droplets') {
            type = 'flower1';
            if (spawn.value == 'random' || spawn.value == 'swarm') {
                angle = Math.random() * 2 * Math.PI;
            }
        } 
        if (shape.value == 'flower2Droplets') {
            type = 'flower2';
            if (spawn.value == 'random' || spawn.value == 'swarm') {
                angle = Math.random() * 2 * Math.PI;
            }
        }
        if (shape.value == 'flower3Droplets') {
            type = 'flower3';
            if (spawn.value == 'random' || spawn.value == 'swarm') {
                angle = Math.random() * 2 * Math.PI;
            }
        } 
        if (shape.value == 'flower4Droplets') {
            type = 'flower4';
            if (spawn.value == 'random' || spawn.value == 'swarm') {
                angle = Math.random() * 2 * Math.PI;
            }
        } 
        if (shape.value == 'flower5Droplets') {
            const f = Math.random();
            if (f < 0.25) {
                type = 'flower1';
            } else 
            if (f < 0.50) {
                type = 'flower2';
            } else 
            if (f < 0.75) {
                type = 'flower3';
            } else 
            if (f < 1.00) {
                type = 'flower4';
            }
            if (spawn.value == 'random' || spawn.value == 'swarm') {
                angle = Math.random() * 2 * Math.PI;
            }
        }
        if (shape.value == 'lotusDroplets') {
            type = 'lotus';
            //angle = 0;
        } 
        if (shape.value == 'greatLotusDroplets') {
            type = 'greatLotus';
            //angle = 0;
        }
        // left band colors  ----------
        if (posX < 0.33 * simWidth) {
            if (rando < 0.50) {
                hue = 360 * Math.cos(y);
            } else 
            if (rando < 1.00) {
                hue = 360 * Math.sin(y);
            } 
        } else 
        // middle band colors  ----------
        if (posX < 0.67 * simWidth) {
            if (rando < 0.50) {
                hue = 360 * Math.cos(y + 2*Math.PI/3);
            } else 
            if (rando < 1.00) {
                hue = 360 * Math.sin(y + 2*Math.PI/3);
            } 
        } else 
        // right band colors  ----------
        if (posX < simWidth) {
            if (rando < 0.50) {
                hue = 360 * Math.cos(y - 2*Math.PI/3);
            } else 
            if (rando < 1.00) {
                hue = 360 * Math.sin(y - 2*Math.PI/3);
            } 
        }
    }

    //  CHOOSE TYPES FOR TRIPTYCH  -----------------
    if (shape.value == 'triptychDroplets') {
    //  LEFT band  ----------
    if (posX < 0.33 * simWidth) {
        if (rando < 0.50) {
            type = 'triangleU';
            hue = 360 * Math.cos(y);
        } else 
        if (rando < 1.00) {
            type = 'triangleD';
            hue = 360 * Math.sin(y);
        } 
    } else 
    //  MIDDLE band  ----------
    if (posX < 0.67 * simWidth) {
        type = 'circle';
        if (rando < 0.50) {
            hue = 360 * Math.cos(y + 2*Math.PI/3);
        } else {
            hue = 360 * Math.sin(y + 2*Math.PI/3);
        } 
        
    } else 
        // RIGHT band  ----------
        if (posX < simWidth) {
            //angle = Math.PI / 4;
            if (rando < 0.50) {
                type = 'square';
                hue = 360 * Math.cos(y - 2*Math.PI/3);
            } else {
                type = 'square';
                hue = 360 * Math.sin(y - 2*Math.PI/3);
            } 
        }
    }
    if (rainbow.checked == true) {
        traceHue += .001;
        hue = 100 * Math.cos(traceHue);
    }
    if (rainbow2.checked == true) {
        traceHue += .001;
        hue = 360 * Math.random();
    }

    Droplets.push (new DROPLET(posX, posY, dispX, dispY, radius, maxRadius, 
    hue, saturation, lightness, alpha, birthday, type, spin, angle, recang));
}


//  SETUP  ---------------------
resizeCanvas();
function setupScene() {
    setGradient();
    makeStars();
    spawnrate = 0;
    lifespan = 4000;
    oldQ1 = 0;
    oldQ2 = 0;
    oldR1 = 0;
    oldR2 = 0;
    //window.setInterval(addRandy, 3000);

    t = 0;
    x = 0;
    y = 0;
    j = 0; 
    k = 0;
    b = 0;
    cursorX = 0;
    cursorY = 0;
    lastMouseX = 0;
    lastMouseY = 0;
    autoSpawn = true;
    flip = true;
    starStart = 0;
    tourTimer = 0;
    oldTourTimer = 0;
    bernoulliScan = 0;
    dnaMover = 0;
    sunsetTracker = 0;
    oldX = 0;
    oldY = 0;
    pass1 = true;
    grid = 0;
    hSpace = 0;
    vSpace = 0;
    goAhead = false;
    spinIndex = 0;
    pass = 1;
    combinedAge = 0;
    fpsOut = 0;
    frames = 0;
    thisTime = 0;
    lastTime = -1001;
    demoRunning = false;
    spawnSkip = 0;
    traceHue = 0;
    long = false;
    butterflyPass1 = true;
    orbiterX = 0;
    orbiterY = 0;
    rudolph = 0;
    rudolphIntensity = 0;
    oldOrbiterAngle = 0;
    rokGrowRunner = 0;
    wanderX = 0;
    wanderY = 0;
    steering = -0.25 * Math.PI;

    oldObject = 0;
    oldOldObject = 0;
    
    oldScene = "";
    oldDemoScene = "";

    crust = "";
    roni = "";
    roniskin = "";
    olive = "";

    Droplets = [];

    Objects = ['circleDroplets', 'smileyDroplets', 'concCircleDroplets', 'bubbleDroplets', 'softDroplets', 'moonDroplets', 'plainArrowDroplets', 
    'fancyArrowDroplets','ellipseHDroplets', 'ellipseVDroplets', 'squareDroplets', 'rectangleDroplets', 'dustDroplets',
    'squareRDroplets', 'diamondDroplets', 'lineDroplets', 'barbellDroplets', 'line4Droplets', 'shroomDroplets', 'spiralDroplets', 
    'line8Droplets', 'line16Droplets', 'lineRDroplets', 'fuzzyDroplets', 'radiiDroplets', 'stickManDroplets', 'pizzaDroplets',        'triangleDroplets', "triPoly3Droplets", "triPoly5Droplets", 'pinwheelDroplets',
    'triangle2Droplets', 'triangleRDroplets', 'heartDroplets', 'canuckDroplets', 'flower1Droplets', 'flower2Droplets',
    'flower3Droplets', 'flower4Droplets', 'flower5Droplets', 'lotusDroplets', 'greatLotusDroplets', 
    'triptychDroplets', 'medley', 'decoDroplets', 'decoTriDroplets', 'star1Droplets', 'star2Droplets', 'starRDroplets',
    'sunDroplets']

    demoObjects = ['circleDroplets', 'smileyDroplets', 'concCircleDroplets', 'bubbleDroplets', 'softDroplets', 'moonDroplets', 'plainArrowDroplets', 
    'fancyArrowDroplets','ellipseHDroplets', 'ellipseVDroplets', 'squareDroplets', 'rectangleDroplets', 'dustDroplets',
    'squareRDroplets', 'diamondDroplets', 'lineDroplets', 'barbellDroplets', 'line4Droplets', 'shroomDroplets', 'spiralDroplets',
    'line8Droplets', 'line16Droplets', 'lineRDroplets', 'fuzzyDroplets', 'radiiDroplets', 'stickManDroplets', 'pizzaDroplets',
    'triangleDroplets', "triPoly3Droplets", "triPoly5Droplets", 
    'triangle2Droplets', 'triangleRDroplets', 'heartDroplets', 'canuckDroplets', 'flower1Droplets', 'flower2Droplets',
    'flower3Droplets', 'flower4Droplets', 'flower5Droplets', 
    'triptychDroplets', 'medley', 'decoDroplets', 'decoTriDroplets', 'star1Droplets', 'star2Droplets', 'starRDroplets',
    'sunDroplets']

    ManualScenes = ["random", "swarm", "wanderingSwarm", "floor", "3x3a", "3x3b", "4x4a", "4x4b", "5x5a", "5x5b", 
    "10x10a", "10x10b", "20x20a", "20x20b", "50x50a", "50x50b",
    "bernoulliSlow", "bernoulliVert", "bernoulliFast", "bernoulliBlazing", "geronoSlow", "geronoFast", "dual8", 
    "soloCircle", "soloFastOval", "soloFastCircle", "soloLittleCircle", "chase", "chase2", "chase3", 
    "chase4", "sine", "cardioid", "dna", "rose", "limacon", "limacon2", "limacon2slow", "butterfly", "butterfly2", 
    "spiral", "spiral2", "3petals", "3petalsX3", 
    "4petals", "5petals", "8petals"]

    DemoScenes = ["random", "random", "random", "random", "random", "random", 
    "swarm", "floor", "5x5b", "10x10b", "20x20b", "50x50a", "bernoulliSlow", "bernoulliVert", "bernoulliFast", 
    "bernoulliBlazing", "geronoSlow", "geronoFast", "dual8", "soloCircle",
    "soloFastOval", "soloFastCircle", "soloLittleCircle", "chase", "chase2", "chase3", 
    "chase4", "sine", "cardioid", "dna", "rose", "limacon", "limacon2", "limacon2slow", "butterfly", "butterfly2", 
    "spiral", "spiral2", "3petals", "3petalsX3", 
    "4petals", "5petals", "8petals"]
}

//  SIMULATE DROPLET  --------------------
function spawnAndSimulate() {
    spawnRate = spawnSlider.value;
    for (s=0; s < spawnSlider.value; s++) {
        spawnDroplet(0);
    }

    for(i=0; i < Droplets.length; i++) {
        droplet = Droplets[i];
        droplet.simulate();
        // age out --------
        if (Date.now() - droplet.birthday > lifespan) {
            combinedAge += lifespan;
            Droplets.splice(0, 1);
        }
    }
}

//  DRAW  ---------------------------------------------
function draw() {  
    if (gradientBkgrndBox.checked == true) {
        // SKY BACKGROUND  -----------------
        c.fillStyle = perspectiveGradient;
        c.fillRect(0, 0, canvas.width, canvas.height);
        
        sunsetTracker += 0.0005;
        var sunset = Math.sin(sunsetTracker);
        skyGradient = c.createLinearGradient(0,0,0,0.5 * canvas.height)
        skyGradient.addColorStop(0, 'hsl(240, 0%, 0%)');
        skyGradient.addColorStop(0.3, `hsl(240, 20%, ${3 + sunset * 6}3%`);
        skyGradient.addColorStop(0.8, `hsl(20, 70%, ${sunset * 5}%)`);
        skyGradient.addColorStop(0.999, `hsl(25, 80%, ${sunset * 7}%)`);
        skyGradient.addColorStop(1, 'hsl(0, 0%, 0%)');
        
        c.fillStyle = skyGradient;
        c.fillRect(0, 0, canvas.width, 0.5 * canvas.height);
        // LITTLE STARFIELD  --------------------
        for (var n = 0; n < littleStarfield.length; n++) {
            star = littleStarfield[n];
            star.draw();
        }
    } 
    //  BLACK, BLANK BACKGROUND
    if (blackBkgrndBox.checked == true) {
        c.fillStyle = 'black';
            c.fillRect(0, 0, canvas.width, canvas.height);
        // BIG STARFIELD  --------------------
        for (var n = 0; n < bigStarfield.length; n++) {
            star = bigStarfield[n];
            star.draw();
        }
    }
    //  GRAY BACKGROUND
    if (whiteBkgrndBox.checked == true) {
        c.fillStyle = 'hsl(340, 3%, 50%)';
            c.fillRect(0, 0, canvas.width, canvas.height);
    }

    // DRAW GRAPH-PAPER BACKGROUND GRID ----------------
    if (whiteBkgrndBox.checked == true) {
        const gridSpacing = .07;
        const horizGrids = simWidth / gridSpacing;
        const vertGrids = simHeight / gridSpacing;
        const corr = 0;
        c.setLineDash([4, 4]);
        for (h = 1; h < horizGrids; h++) {
            if (h % 5 == 0) {
                c.lineWidth = 2;
            } else {
                c.lineWidth = 1;
            }
            c.beginPath();
            c.moveTo((h * gridSpacing + corr) * cScale, 0);
            c.lineTo((h * gridSpacing + corr) * cScale, simHeight * cScale);
            c.strokeStyle = "hsl(0, 0%, 15%)";
            c.stroke();
        }
        for (v = 1; v < vertGrids; v++) {
            if (v % 5 == 0) {
                c.lineWidth = 2;
            } else {
                c.lineWidth = 1;
            }
            c.beginPath();
            c.moveTo(0, v * gridSpacing * cScale);
            c.lineTo(simWidth * cScale, v * gridSpacing * cScale);
            c.strokeStyle = "hsl(0, 0%, 15%)";
            c.stroke();
        }
        c.setLineDash([0, 0]);
    }
    
    // DRAW PERSPECTIVE BACKGROUND GRID -----------------------------------------------------------------
    if (gradientBkgrndBox.checked == true) {
        const gridSpacingH = 0.2 * simHeight / 12;
        const gridSpacingV = 0.8 * simHeight / 60;
        //c.setLineDash([4, 4]);   
        for (h = -20; h < 20; h++) {
            c.lineWidth = 2;
            c.strokeStyle = "hsl(0, 0%, 0%)";
            c.beginPath();
            c.moveTo((0.5 * simWidth + h * gridSpacingH) * cScale, 0.5 * simHeight * cScale);
            c.lineTo((0.5 * simWidth + 20 * h * gridSpacingH) * cScale, simHeight * cScale);
            c.stroke();
        } 
        for (v = 0; v < 10; v++) {
            c.beginPath();
            c.moveTo(0, 0.5 * simHeight * cScale + 0.5 * v * (v * gridSpacingV * cScale));
            c.lineTo(simWidth * cScale, 0.5 * simHeight * cScale + 0.5 * v * (v * gridSpacingV * cScale));
            c.lineWidth = 2;
            c.strokeStyle = "hsl(0, 0%, 0%)";
            c.stroke();
        }
    }

    //  DRAW DROPLETS ------ THE ENTIRE POINT OF THIS PROGRAM  -------
    for(i=0; i < Droplets.length; i++) {
        droplet = Droplets[i];
        droplet.draw();
    }

    //  DRAW ROCKET  -------------------
    if (shape.value != 'squareRDroplets' && shape.value != 'triangleRDroplets' 
    && shape.value != 'lineRDroplets' && shape.value != 'starRDroplets'
    && shape.value != 'medley' && shape.value != 'ellipseDroplets' 
    && shape.value != 'ellipseVDroplets'){

        if (spawn.value == "bernoulliSlow" || spawn.value == "bernoulliFast" 
        || spawn.value == "bernoulliVert" 
        || spawn.value == "geronoSlow" || spawn.value == "geronoFast" 
        || spawn.value == "cardioid" || spawn.value == 'rose' 
        || spawn.value == 'sine' || spawn.value == "limacon" 
        || spawn.value == 'fly' 
        || spawn.value == "limacon2" || spawn.value == "limacon2slow" 
        || spawn.value == "spiral" || spawn.value == "spiral2" 
        || spawn.value == "soloCircle" || spawn.value == "soloFastOval" 
        || spawn.value == "soloFastCircle" || spawn.value == "soloLittleCircle") {
            
            var orbiterAngle = angle + 0.5 * Math.PI;
            if (angle % 0.5*Math.PI == 0) { 
                orbiterAngle = oldOrbiterAngle;
            } 
            oldOrbiterAngle = orbiterAngle;
            rokGrowRunner += 0.0025;
            //var rokFactor = (Math.cos(rokGrowRunner) + 1) / 20;

            var roket = {
                //radius: 0.1 + rokFactor,
                radius: 0.10,
                // FUSELAGE -----
                // 1 bottom center
                a1cos: Math.cos(rads(0 - 90) + orbiterAngle),
                a1sin: Math.sin(rads(0 - 90) + orbiterAngle),
                r1: 0,
                // 2 bottom 
                a2cos: Math.cos(rads(0 - 90) + orbiterAngle),
                a2sin: Math.sin(rads(0 - 90) + orbiterAngle),
                r2: 0.07893,
                al2cos: Math.cos(rads(180 - 90) + orbiterAngle),
                al2sin: Math.sin(rads(180 - 90) + orbiterAngle),
                rl2: 0.07893,
                // 6 top fin attach point
                a6cos: Math.cos(rads(66.6 - 90) + orbiterAngle),
                a6sin: Math.sin(rads(66.6 - 90) + orbiterAngle),
                r6: 0.2859,
                al6cos: Math.cos(rads(113.4 - 90) + orbiterAngle),
                al6sin: Math.sin(rads(113.4 - 90) + orbiterAngle),
                rl6: 0.2859,
                // 7 mid side tip
                a7cos: Math.cos(rads(70.1 - 90) + orbiterAngle),
                a7sin: Math.sin(rads(70.1 - 90) + orbiterAngle),
                r7: 0.4383,
                al7cos: Math.cos(rads(109.9 - 90) + orbiterAngle),
                al7sin: Math.sin(rads(109.9 - 90) + orbiterAngle),
                rl7: 0.4383,
                // 8 mid top
                a8cos: Math.cos(rads(78.4 - 90) + orbiterAngle),
                a8sin: Math.sin(rads(78.4 - 90) + orbiterAngle),
                r8: 0.6089,
                al8cos: Math.cos(rads(101.6 - 90) + orbiterAngle),
                al8sin: Math.sin(rads(101.6 - 90) + orbiterAngle),
                rl8: 0.6089,
                // 9 tip
                a9cos: Math.cos(orbiterAngle),
                a9sin: Math.sin(orbiterAngle),
                r9: 0.7630,

                // 10 nozzle top right
                a10cos: Math.cos(rads(0 - 90) + orbiterAngle),
                a10sin: Math.sin(rads(0 - 90) + orbiterAngle),
                r10: 0.03508,
                //  11 nozzle bottom right
                a11cos: Math.cos(rads(-45 - 90) + orbiterAngle),
                a11sin: Math.sin(rads(-45 - 90) + orbiterAngle),
                r11: 0.1,
                //  12 nozzle bottom left
                a12cos: Math.cos(rads(225 - 90) + orbiterAngle),
                a12sin: Math.sin(rads(225 - 90) + orbiterAngle),
                r12: 0.1,
                // 13 nozzle top left
                a13cos: Math.cos(rads(180 - 90) + orbiterAngle),
                a13sin: Math.sin(rads(180 - 90) + orbiterAngle),
                r13: 0.03508,

                // RIGHT FIN -----
                // 3 fin tip bottom
                a3cos: Math.cos(rads(-43.9 - 90) + orbiterAngle),
                a3sin: Math.sin(rads(-43.9 - 90) + orbiterAngle),
                r3: 0.3287,
                // 4 fin tip top
                a4cos: Math.cos(rads(-16.7 - 90) + orbiterAngle),
                a4sin: Math.sin(rads(-16.7 - 90) + orbiterAngle),
                r4: 0.2747,
                // 5 fin side
                a5cos: Math.cos(rads(30.3 - 90) + orbiterAngle),
                a5sin: Math.sin(rads(30.3 - 90) + orbiterAngle),
                r5: 0.2426,

                // LEFT FIN
                // 3l fin tip bottom
                al3cos: Math.cos(rads(223.9 - 90) + orbiterAngle),
                al3sin: Math.sin(rads(223.9 - 90) + orbiterAngle),
                rl3: 0.3287,
                // 4l fin tip top
                al4cos: Math.cos(rads(196.7 - 90) + orbiterAngle),
                al4sin: Math.sin(rads(196.7 - 90) + orbiterAngle),
                rl4: 0.2747,
                // 5l fin side
                al5cos: Math.cos(rads(139.7 - 90) + orbiterAngle),
                al5sin: Math.sin(rads(139.7 - 90) + orbiterAngle),
                rl5: 0.2426,
                // portholes
                windowCos: Math.cos(orbiterAngle),
                windowSin: Math.sin(orbiterAngle),
                rTop: 0.6,
                rMid: 0.456,
                rBot: 0.3,
            }

            //  ANTENNA  ----------
            c.beginPath();
            c.moveTo(orbiterX * cScale, orbiterY * cScale);
            c.lineTo((orbiterX + 1.15 * roket.r9 * roket.radius * Math.cos(orbiterAngle)) * cScale, 
            (orbiterY - 1.15 * roket.r9 * roket.radius * Math.sin(orbiterAngle)) * cScale)
            c.strokeStyle = 'hsl(0, 0%, 90%)';
            c.lineWidth = 0.015 * roket.radius * cScale;
            c.shadowBlur = 10;
            c.shadowColor = 'black';
            c.stroke();

            //  GLOWING LIGHT  ---------
            rudolph += 0.03;
            rudolphIntensity = 10 + 50 * Math.abs(Math.sin(rudolph));
            drawCircle((orbiterX + 1.15 * roket.r9 * roket.radius * Math.cos(orbiterAngle)) * cScale, 
            (orbiterY - 1.15 * roket.r9 * roket.radius * Math.sin(orbiterAngle)) * cScale, 
            0.036 * roket.radius * cScale);
            c.fillStyle = `hsl(0, 100%, ${rudolphIntensity}%)`
            c.shadowBlur = 0;
            c.shadowColor = 'black';
            c.fill();

            // FUSELAGE -----
            c.beginPath();
            c.moveTo((orbiterX + roket.radius * roket.r1 * roket.a1cos) * cScale,
                (orbiterY - roket.radius * roket.r1 * roket.a1sin) * cScale);
            c.lineTo((orbiterX + roket.radius * roket.r2 * roket.a2cos) * cScale,
                (orbiterY - roket.radius * roket.r2 * roket.a2sin) * cScale);
            c.lineTo((orbiterX + roket.radius * roket.r6 * roket.a6cos) * cScale,
                (orbiterY - roket.radius * roket.r6 * roket.a6sin) * cScale);
            c.lineTo((orbiterX + roket.radius * roket.r7 * roket.a7cos) * cScale,
                (orbiterY - roket.radius * roket.r7 * roket.a7sin) * cScale);
            c.lineTo((orbiterX + roket.radius * roket.r8 * roket.a8cos) * cScale,
                (orbiterY - roket.radius * roket.r8 * roket.a8sin) * cScale);
            c.lineTo((orbiterX + roket.radius * roket.r9 * roket.a9cos) * cScale,
                (orbiterY - roket.radius * roket.r9 * roket.a9sin) * cScale);
            c.lineTo((orbiterX + roket.radius * roket.rl8 * roket.al8cos) * cScale,
                (orbiterY - roket.radius * roket.rl8 * roket.al8sin) * cScale);
            c.lineTo((orbiterX + roket.radius * roket.rl7 * roket.al7cos) * cScale,
                (orbiterY - roket.radius * roket.rl7 * roket.al7sin) * cScale);
            c.lineTo((orbiterX + roket.radius * roket.rl6 * roket.al6cos) * cScale,
                (orbiterY - roket.radius * roket.rl6 * roket.al6sin) * cScale);
            c.lineTo((orbiterX + roket.radius * roket.rl2 * roket.al2cos) * cScale,
                (orbiterY - roket.radius * roket.rl2 * roket.al2sin) * cScale);
            c.closePath();
            c.fillStyle = 'hsl(120, 60%, 40%)';
            c.shadowBlur = 8;
            c.fill();
            c.strokeStyle = 'black';
            c.lineWidth = 1;
            c.stroke();

            //  NOZZLE  ---------
            c.beginPath();
            c.moveTo((orbiterX + roket.radius * roket.r10 * roket.a10cos) * cScale,
            (orbiterY - roket.radius * roket.r10 * roket.a10sin) * cScale);
            c.lineTo((orbiterX + roket.radius * roket.r11 * roket.a11cos) * cScale,
            (orbiterY - roket.radius * roket.r11 * roket.a11sin) * cScale);
            c.lineTo((orbiterX + roket.radius * roket.r12 * roket.a12cos) * cScale,
            (orbiterY - roket.radius * roket.r12 * roket.a12sin) * cScale);
            c.lineTo((orbiterX + roket.radius * roket.r13 * roket.a13cos) * cScale,
            (orbiterY - roket.radius * roket.r13 * roket.a13sin) * cScale);
            c.closePath();
            c.shadowBlur = 0;
            c.stroke();
            c.fillStyle = 'hsl(30, 70%, 60%)';
            c.fill();

            // RIGHT FIN -----
            c.beginPath();
            c.moveTo((orbiterX + roket.radius * roket.r2 * roket.a2cos) * cScale,
                (orbiterY - roket.radius * roket.r2 * roket.a2sin) * cScale);
            c.lineTo((orbiterX + roket.radius * roket.r3 * roket.a3cos) * cScale,
                (orbiterY - roket.radius * roket.r3 * roket.a3sin) * cScale);
            c.lineTo((orbiterX + roket.radius * roket.r4 * roket.a4cos) * cScale,
                (orbiterY - roket.radius * roket.r4 * roket.a4sin) * cScale);
            c.lineTo((orbiterX + roket.radius * roket.r5 * roket.a5cos) * cScale,
                (orbiterY - roket.radius * roket.r5 * roket.a5sin) * cScale);
            c.lineTo((orbiterX + roket.radius * roket.r6 * roket.a6cos) * cScale,
                (orbiterY - roket.radius * roket.r6 * roket.a6sin) * cScale);
            c.closePath();
            c.fillStyle = 'hsl(180, 90%, 44%)';
            c.shadowBlur = 5;
            c.fill();
            c.strokeStyle = 'black';
            c.lineWidth = 1;
            c.stroke();

            // LEFT FIN -----
            c.beginPath();
            c.moveTo((orbiterX + roket.radius * roket.rl2 * roket.al2cos) * cScale,
                (orbiterY - roket.radius * roket.rl2 * roket.al2sin) * cScale);
            c.lineTo((orbiterX + roket.radius * roket.rl3 * roket.al3cos) * cScale,
                (orbiterY - roket.radius * roket.rl3 * roket.al3sin) * cScale);
            c.lineTo((orbiterX + roket.radius * roket.rl4 * roket.al4cos) * cScale,
                (orbiterY - roket.radius * roket.rl4 * roket.al4sin) * cScale);
            c.lineTo((orbiterX + roket.radius * roket.rl5 * roket.al5cos) * cScale,
                (orbiterY - roket.radius * roket.rl5 * roket.al5sin) * cScale);
            c.lineTo((orbiterX + roket.radius * roket.rl6 * roket.al6cos) * cScale,
                (orbiterY - roket.radius * roket.rl6 * roket.al6sin) * cScale);
            c.closePath();  
            c.fill();
            c.shadowBlur = 0;
            c.stroke();

            //  WINDOWS  ----------
            drawCircle((orbiterX + roket.rTop * roket.radius * Math.cos(orbiterAngle)) * cScale, 
            (orbiterY - roket.rTop * roket.radius * Math.sin(orbiterAngle)) * cScale,
            0.04 * roket.radius * cScale);
            c.strokeStyle = 'hsl(0, 0%, 90%)';
            c.lineWidth = 0.015 * roket.radius * cScale;
            c.fillStyle = 'black';
            c.fill();
            c.stroke();

            drawCircle((orbiterX + roket.rMid * roket.radius * Math.cos(orbiterAngle)) * cScale, 
            (orbiterY - roket.rMid * roket.radius * Math.sin(orbiterAngle)) * cScale,
            0.05 * roket.radius * cScale);
            c.fill();
            c.stroke();

            drawCircle((orbiterX + roket.rBot * roket.radius * Math.cos(orbiterAngle)) * cScale, 
            (orbiterY - roket.rBot * roket.radius * Math.sin(orbiterAngle)) * cScale,
            0.05 * roket.radius * cScale);
            c.fill();
            c.stroke();
        }
    }

    //  STATISTICS  -------------------
    // fps indicator  ----------
    thisTime = Date.now();
    var fpsOut = 1000 / (thisTime - lastTime) + 1;
    lastTime = thisTime;
        
    //  STAT CIRCLE INDICATOR
    length = 0.05 + 0.05 * (Droplets.length / 5000) * lifespanSlider.value/10 * (simWidth * 0.10);
    if (demoRunning == true) {
        c.fillStyle = `hsla(${120 - 240 * (1 - (fpsOut / 60))}, 50%, 50%, 80%)`;
        drawCircle(0.2*length * cScale, cScale * (simHeight - 0.2*length), 0.2 * length * cScale)
        c.fill();
    }
    
    if (demoRunning == false) {
        // array length meter  ----------
        length = (Droplets.length / 5000) * (simWidth * 0.10);
        c.font = "13px verdana";
        c.textAlign = "left";
        c.fillStyle = `hsla(${120 - 240 * (1 - (fpsOut / 60))}, 50%, 50%, 80%)`;
        c.fillRect(0, cScale * simHeight - 18, 0.5 * length * cScale, 15);
        
        // text background
        c.fillStyle = `hsla(0, 0%, 0%, 40%)`;
        if (Droplets.length < 100) {
            c.fillRect(0.5 * (0.005 + length) * cScale, cScale * simHeight - 18, 24, 15);
        } else 
        if (Droplets.length < 1000) {
            c.fillRect(0.5 * (0.005 + length) * cScale, cScale * simHeight - 18, 33, 15);
        } else 
        if (Droplets.length > 10000) {
            c.fillRect(0.5 * (0.005 + length) * cScale, cScale * simHeight - 18, 48, 15);
        } else
        if (Droplets.length > 1000) {
            c.fillRect(0.5 * (0.005 + length) * cScale, cScale * simHeight - 18, 40, 15);
        } 
        c.fillStyle = 'hsl(0, 0%, 90%)';
        c.fillText(Droplets.length - 1, 0.5 * (0.03 + length) * cScale, cScale * simHeight - 6);
    
        // lifespan meter  ----------
        var length = (lifespan / 4000) * (simWidth * 0.01);
        c.fillStyle = `hsla(0, 0%, 50%, 70%)`;
        c.fillRect(0, cScale * simHeight - 37, 0.5 * length * cScale, 15);
        // text background
            c.fillStyle = `hsla(0, 0%, 0%, 40%)`;
        if (lifespan < 10000) {
            c.fillRect(0.5 * (0.005 + length) * cScale, cScale * simHeight - 37, 39, 15);
        } else {
            c.fillRect(0.5 * (0.005 + length) * cScale, cScale * simHeight - 37, 48, 15);
        }
        text = `${(lifespan / 1000).toFixed(1)}s`;
        c.fillStyle = 'hsl(0, 0%, 90%)';
        c.fillText(text, 0.5 * (0.03 + length) * cScale, cScale * simHeight - 25);
    
    /*
        // age indicator  ----------
        // text
        c.fillStyle = `hsla(0, 0%, 0%, 40%)`;   
        var ageHours = combinedAge / 3600000;
        if (ageHours < 168) {
            if (Math.floor(ageHours) < 2) {
                age = `${(ageHours).toFixed(0)}hr` // hours
            } else {
                age = `${(ageHours).toFixed(0)}hrs` // hours
            } 

            if (ageHours < 1) {
                c.fillRect(0, cScale * simHeight - 56, 32, 15);
            } else
            if (ageHours < 10) {
                c.fillRect(0, cScale * simHeight - 56, 38, 15);
            } else
            if (ageHours < 100) {
                c.fillRect(0, cScale * simHeight - 56, 44, 15);
            } else
            if (ageHours < 1000) {
                c.fillRect(0, cScale * simHeight - 56, 52, 15);
            }
            
        } else 
        if (ageHours < 2160) {
            age = `${(ageHours / 24).toFixed(0)}days` // days
            if (ageHours < 240) {
                c.fillRect(0, cScale * simHeight - 56, 48, 15);
            } else 
            if (ageHours < 2400) {
                c.fillRect(0, cScale * simHeight - 56, 55, 15);
            } else {
                c.fillRect(0, cScale * simHeight - 56, 66, 15);
            }
        } else 
        if (ageHours < 8760) {
            age = `${(ageHours / 168).toFixed(0)}wks` // weeks
            c.fillRect(0, cScale * simHeight - 56, 60, 15);
        }
        if (ageHours > 8760) {
            age = `${(ageHours / 720).toFixed(0)}mnths` // months
            c.fillRect(0, cScale * simHeight - 18, 33, 15);
        }
        c.fillStyle = 'hsl(0, 0%, 90%)';
        c.fillText(age, 0.0075 * cScale, cScale * simHeight - 44);
        //c.fillText(0, 0.0075 * cScale, cScale * simHeight - 64);
    */
    } 
    
}

//  RUN  --------------------
setupScene();
function update() {
    spawnAndSimulate();
    draw();
    requestAnimationFrame(update);
}
update();