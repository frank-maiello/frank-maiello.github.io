
    //  CANVAS SETUP AND SCALING --------------------------------------------------------------
    canvas = document.getElementById("myCanvas");
	    c = canvas.getContext("2d");
        canvas.style.cursor = "pointer";
        canvas.style.opacity = "0";
        canvas.style.animation = "fadeIn 1.5s ease-in forwards";
       
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

        simMinWidth = 2.0;
        cScale = Math.min(canvas.width, canvas.height) / simMinWidth;
        simWidth = canvas.width / cScale;
        simHeight = canvas.height / cScale;
        topMargin = 0;
        bottomMargin = 0;
    
    //  LOAD FROSTY IMAGE --------------------------------------------------------------
    const frostyImage = new Image();
    frostyImage.src = 'frosty.png';
    
    //  FAN MENU ROTATION SYSTEM --------------------------------------------------------------
    let currentRotation = 0;
    let targetRotation = 0;
    let targetBladeIndex = 0;
    const totalBlades = 5;
    const bladeAngleSpacing = -20;
    let scrollAccumulator = 0;
    const scrollSensitivity = 0.08;
    let isSnapping = false;
    let snapAnimationFrame = null;
    let smoothScrollFrame = null;
    const smoothingFactor = 0.15;
    
    function updateFanRotation() {
        const blades = document.querySelectorAll('.fan-blade');
        
        blades.forEach((blade, index) => {
            const relativeRotation = currentRotation / bladeAngleSpacing;
            const relativeIndex = index + relativeRotation;
            const angle = relativeIndex * bladeAngleSpacing;
            
            const distanceFromCenter = Math.abs(relativeIndex);
            const zIndex = 100 - Math.floor(distanceFromCenter);
            blade.style.zIndex = zIndex;
            
            const scale = Math.max(0.8, 1 - distanceFromCenter * 0.05);
            const opacity = Math.max(0.4, 1 - distanceFromCenter * 0.2);
            
            blade.style.transform = `rotate(${angle}deg) scale(${scale})`;
            blade.style.opacity = opacity;
            blade.style.pointerEvents = 'auto';
        });
    }
    
    function smoothScrollAnimation() {
        const diff = targetRotation - currentRotation;
        
        if (Math.abs(diff) < 0.01) {
            currentRotation = targetRotation;
            updateFanRotation();
            smoothScrollFrame = null;
            return;
        }
        
        currentRotation += diff * smoothingFactor;
        updateFanRotation();
        smoothScrollFrame = requestAnimationFrame(smoothScrollAnimation);
    }
    
    function snapToNearest() {
        if (isSnapping) return;
        
        // Cancel smooth scroll animation before snapping
        if (smoothScrollFrame) {
            cancelAnimationFrame(smoothScrollFrame);
            smoothScrollFrame = null;
        }
        
        isSnapping = true;
        // Find nearest multiple of 20 (positions where a blade is horizontal)
        const bladeSpacing = Math.abs(bladeAngleSpacing); // 20
        const nearestBladeIndex = Math.round(currentRotation / bladeSpacing);
        const snapTarget = nearestBladeIndex * bladeSpacing;
        
        function animate() {
            const diff = snapTarget - currentRotation;
            if (Math.abs(diff) < 0.1) {
                currentRotation = snapTarget;
                targetRotation = snapTarget;
                scrollAccumulator = snapTarget;
                updateFanRotation();
                isSnapping = false;
                return;
            }
            
            currentRotation += diff * 0.15;
            updateFanRotation();
            snapAnimationFrame = requestAnimationFrame(animate);
        }
        
        animate();
    }
    
    document.addEventListener('wheel', (e) => {
        if (e.target.closest('.fan-blade') || e.target.closest('#fan-container')) {
            e.preventDefault();
            
            if (snapAnimationFrame) {
                cancelAnimationFrame(snapAnimationFrame);
                isSnapping = false;
            }
            
            // Detect mouse wheel vs trackpad and adjust sensitivity
            const isMouseWheel = Math.abs(e.deltaY) > 40;
            const sensitivity = isMouseWheel ? scrollSensitivity * 0.3 : scrollSensitivity;
            
            scrollAccumulator -= e.deltaY * sensitivity;
            
            const minRotation = 0;
            const maxRotation = -(totalBlades - 1) * bladeAngleSpacing;
            scrollAccumulator = Math.max(minRotation, Math.min(maxRotation, scrollAccumulator));
            
            targetRotation = scrollAccumulator;
            
            if (!smoothScrollFrame) {
                smoothScrollFrame = requestAnimationFrame(smoothScrollAnimation);
            }
            
            clearTimeout(window.snapTimeout);
            window.snapTimeout = setTimeout(() => {
                snapToNearest();
            }, 150);
        }
    }, { passive: false });
    
    // Initialize fan on page load
    document.addEventListener('DOMContentLoaded', () => {
        updateFanRotation();
    });
    
    // Initialize immediately
    updateFanRotation();
    
    function resizeCanvas() {
        canvas = document.getElementById("myCanvas");
	    c = canvas.getContext("2d");
        canvas.style.cursor = "pointer";
       
        // Store old dimensions
        const oldSimWidth = simWidth;
        const oldSimHeight = simHeight;
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;        simMinWidth = 2.0;
        cScale = Math.min(canvas.width, canvas.height) / simMinWidth;
        simWidth = canvas.width / cScale;
        simHeight = canvas.height / cScale;
        
        // Calculate scale factors
        const scaleX = simWidth / oldSimWidth;
        const scaleY = simHeight / oldSimHeight;
        
        // Scale all node positions
        if (typeof PrimaryNodes !== 'undefined') {
            for (let i = 0; i < PrimaryNodes.length; i++) {
                PrimaryNodes[i].pos.x *= scaleX;
                PrimaryNodes[i].pos.y *= scaleY;
                // Scale trail positions
                for (let j = 0; j < PrimaryNodes[i].trail.length; j++) {
                    PrimaryNodes[i].trail[j].x *= scaleX;
                    PrimaryNodes[i].trail[j].y *= scaleY;
                }
            }
        }
        
        if (typeof SecondaryNodes !== 'undefined') {
            for (let i = 0; i < SecondaryNodes.length; i++) {
                SecondaryNodes[i].pos.x *= scaleX;
                SecondaryNodes[i].pos.y *= scaleY;
                // Scale trail positions
                for (let j = 0; j < SecondaryNodes[i].trail.length; j++) {
                    SecondaryNodes[i].trail[j].x *= scaleX;
                    SecondaryNodes[i].trail[j].y *= scaleY;
                }
            }
        }
        
        // Scale roid positions
        if (typeof Roid !== 'undefined') {
            for (let i = 0; i < Roid.length; i++) {
                Roid[i].pos.x *= scaleX;
                Roid[i].pos.y *= scaleY;
            }
        }
        
        // Scale cube position
        if (typeof Cube !== 'undefined' && Cube != null) {
            Cube.pos.x *= scaleX;
            Cube.pos.y *= scaleY;
        }
        
        // Recreate Christmas lights with new canvas size
        TopLights = [];
        WorkshopLights = [];
        createTopLightString();
        //createWorkshopLightString();
    }

    window.addEventListener("resize", resizeCanvas);

    function drawCircle(x, y, radius) {
        c.beginPath();			
		c.arc(x, y, radius, 0.0, 2.0 * Math.PI) 
		c.closePath();
	}
    function drawEllipse(x, y, radiusX, radiusY) {
        c.beginPath();			
		c.ellipse(x * cScale, y * cScale, radiusX * cScale, radiusY * cScale, 0, 0, 2 * Math.PI) 
		c.closePath();
	}

    //  SETUP SCENE ======================================================
	function setupScene() {
        //makeStars()

        PrimaryNodes = [];
        SecondaryNodes = [];
        spawnNodes();
        spinner = 0;
        f = 0;

        //  INITIALIZE ARRAYS  
        Roid = [];
        Cube = null; // Single cube instance
        PongGame = null; // Pong game instance

        //  INITIALIZE BOOLEANS 
        dT = 1/60;

        //  SPAWN INITIAL OBJECTS  
        spawnRoid();
        spawnCube();
        spawnPong();

        makeSnow();
        
        // Create Christmas lights
        createTopLightString();
        createWorkshopLightString();
    }
    
    //  MOUSE TRACKBALL INTERACTION -----------------------------------------------------------
    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let draggedRoid = null;
    
    function setupMouseInteraction() {
        // Helper function to check if mouse is over any roid
        function getRoidAtPosition(clientX, clientY) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = (clientX - rect.left) / cScale;
            const mouseY = (clientY - rect.top) / cScale;
            
            for (let i = 0; i < Roid.length; i++) {
                const roid = Roid[i];
                const dx = mouseX - roid.pos.x;
                const dy = mouseY - roid.pos.y;
                const distSq = dx * dx + dy * dy;
                
                if (distSq < roid.radius * roid.radius) {
                    return { roid, mouseX, mouseY };
                }
            }
            return null;
        }
        
        // Use document-level events to capture everything
        document.addEventListener('mousedown', (e) => {
            const result = getRoidAtPosition(e.clientX, e.clientY);
            
            if (result) {
                e.preventDefault();
                e.stopPropagation();
                
                isDragging = true;
                draggedRoid = result.roid;
                lastMouseX = result.mouseX;
                lastMouseY = result.mouseY;
                document.body.style.cursor = 'grabbing';
                
                // Stop the roid's automatic tumbling and prevent automatic updates
                result.roid.omega.x = 0;
                result.roid.omega.y = 0;
                result.roid.omega.z = 0;
                result.roid.isDragging = true;
            } else {
                // Check if click is near pipe for continuous bubble mode
                const rect = canvas.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickY = e.clientY - rect.top;
                
                // Calculate pipe bowl position
                const snowmanX = 0.75 * simWidth * cScale;
                const snowmanY = simHeight * cScale;
                const pipeOffsetX = -147;
                const pipeOffsetY = -356;
                const pipeX = snowmanX + pipeOffsetX;
                const pipeY = snowmanY + pipeOffsetY;
                
                // Check if click is near pipe (within 100 pixels)
                const dx = clickX - pipeX;
                const dy = clickY - pipeY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    // Activate continuous mode for 1 minute
                    continuousMode = true;
                    continuousModeTimer = 0;
                }
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging && draggedRoid) {
                e.preventDefault();
                
                // Calculate delta in PIXEL space for proper sensitivity
                const pixelDx = e.clientX - (lastMouseX * cScale + canvas.getBoundingClientRect().left);
                const pixelDy = e.clientY - (lastMouseY * cScale + canvas.getBoundingClientRect().top);
                
                // Convert to rotation - working in pixel space for proper sensitivity
                const rotationSpeed = 0.005;  // Lower value since we're in pixel space now
                const deltaYaw = pixelDx * rotationSpeed;
                const deltaPitch = pixelDy * rotationSpeed;
                
                // Create rotation quaternions for the drag
                const qYaw = quatFromAxisAngle(0, 1, 0, deltaYaw);
                const qPitch = quatFromAxisAngle(1, 0, 0, deltaPitch);
                
                // Combine rotations
                const qDelta = quatMultiply(qYaw, qPitch);
                
                // Apply to globe orientation
                draggedRoid.orientation = quatMultiply(qDelta, draggedRoid.orientation);
                
                // Normalize to prevent drift
                draggedRoid.orientation = quatNormalize(draggedRoid.orientation);
                
                // Update last position in simulation space for next frame
                const rect = canvas.getBoundingClientRect();
                lastMouseX = (e.clientX - rect.left) / cScale;
                lastMouseY = (e.clientY - rect.top) / cScale;
            } else {
                // Update cursor when hovering
                const result = getRoidAtPosition(e.clientX, e.clientY);
                document.body.style.cursor = result ? 'grab' : 'default';
            }
        });
        
        document.addEventListener('mouseup', (e) => {
            if (isDragging && draggedRoid) {
                draggedRoid.isDragging = false;
                const result = getRoidAtPosition(e.clientX, e.clientY);
                document.body.style.cursor = result ? 'grab' : 'default';
            }
            isDragging = false;
            draggedRoid = null;
        });
        
        // Prevent text selection while dragging
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
        document.body.style.mozUserSelect = 'none';
    }
    
	//  VECTOR OPERATIONS ---------------------------------------------------------------------
	class Vector2 {
		constructor(x = 0.0, y = 0.0) {
			this.x = x; 
			this.y = y;
		}
		set(v) {
			this.x = v.x; 
            this.y = v.y;
		}
		clone() {
			return new Vector2(this.x, this.y);
		}
		add(v, s=1) {
			this.x += v.x * s;
			this.y += v.y * s;
			return this;
		}
		addVectors(a, b) {
			this.x = a.x + b.x;
			this.y = a.y + b.y;
			return this;
		}
		subtract(v, s = 1.0) {
			this.x -= v.x * s;
			this.y -= v.y * s;
			return this;
		}
		subtractVectors(a, b) {
			this.x = a.x - b.x;
			this.y = a.y - b.y;
			return this;			
		}
		length() {
			return Math.sqrt(this.x * this.x + this.y * this.y);
		}
		scale(s) {
			this.x *= s;
			this.y *= s;
		}
		dot(v) {
			return this.x * v.x + this.y * v.y;
		}
        perp() {
			return new Vector2(-this.y, this.x);
		}
	}

    function cX(pos) {
        return pos.x * cScale;
    }
	function cY(pos) {
        return canvas.height - pos.y * cScale;
    }

    //  NORMALIZE DISTANCE  -------------------
    function measureDistAndShade(node1, node2) {
		var dir = new Vector2();
		dir.subtractVectors(node1.pos, node2.pos);
		d = dir.length();
		
		return 1 / d;
	}

    // Quaternion helpers to avoid gimbal lock when integrating orientation
    function quatFromEuler(yaw, pitch, roll) {
        // yaw (Z), pitch (X), roll (Y) — same convention as earlier Euler usage
        const cy = Math.cos(yaw * 0.5);
        const sy = Math.sin(yaw * 0.5);
        const cp = Math.cos(pitch * 0.5);
        const sp = Math.sin(pitch * 0.5);
        const cr = Math.cos(roll * 0.5);
        const sr = Math.sin(roll * 0.5);
        // q = q_yaw * q_pitch * q_roll
        const w = cy * cp * cr + sy * sp * sr;
        const x = cy * sp * cr + sy * cp * sr;
        const y = cy * cp * sr - sy * sp * cr;
        const z = sy * cp * cr - cy * sp * sr;
        return { w: w, x: x, y: y, z: z };
    }

    function quatMultiply(a, b) {
        return {
            w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
            x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
            y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
            z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w
        };
    }

    function quatNormalize(q) {
        const len = Math.sqrt(q.w*q.w + q.x*q.x + q.y*q.y + q.z*q.z) || 1.0;
        q.w /= len; q.x /= len; q.y /= len; q.z /= len;
        return q;
    }
    
    function quatFromAxisAngle(ax, ay, az, angle) {
        // Create a quaternion from axis-angle representation
        const halfAngle = angle * 0.5;
        const s = Math.sin(halfAngle);
        return {
            w: Math.cos(halfAngle),
            x: ax * s,
            y: ay * s,
            z: az * s
        };
    }

    function quatRotateVec(q, vx, vy, vz) {
        // Standard, stable quaternion-vector rotation using cross products:
        // t = 2 * cross(q.xyz, v)
        // v' = v + q.w * t + cross(q.xyz, t)
        const qx = q.x, qy = q.y, qz = q.z, qw = q.w;
        // cross(q.xyz, v)
        const cx = qy * vz - qz * vy;
        const cy = qz * vx - qx * vz;
        const cz = qx * vy - qy * vx;
        const tx = 2 * cx;
        const ty = 2 * cy;
        const tz = 2 * cz;
        // cross(q.xyz, t)
        const c2x = qy * tz - qz * ty;
        const c2y = qz * tx - qx * tz;
        const c2z = qx * ty - qy * tx;
        return {
            x: vx + qw * tx + c2x,
            y: vy + qw * ty + c2y,
            z: vz + qw * tz + c2z
        };
    }

    // BUBBLE CLASS  ---------------------------------------------------------------------
    class BUBBLES{
        constructor(pos) {
            this.pos = pos.clone();
            this.vel = new Vector2(0.1 * (Math.random() - 0.5), -0.2);
            this.drift = 0.1 * (Math.random() - 0.5);
            this.radius = 0.008;
            this.finalRadius = 0.01 + Math.random() * 0.03;
            this.hue = Math.random() * 360;
        }
        simulate() {
            const luft = new Vector2(0, -0.1);
            if (this.radius < this.finalRadius) {
                 this.radius += 0.08 * dT; // bubbles grow as they rise
            } else {
                    this.radius = this.finalRadius;
            }
            this.vel.add(luft, dT);
            this.vel.x += this.drift * dT;
            this.pos.add(this.vel, dT);
        }
        draw() {
            drawCircle(this.pos.x * cScale, this.pos.y * cScale, this.radius * cScale);
            
            //  OVERALL BUBBLE SHADING  ----------
            var sphereGradient = c.createRadialGradient(
                this.pos.x * cScale, 
                this.pos.y * cScale, 
                0, 
                this.pos.x * cScale, 
                this.pos.y * cScale, 
                1 * this.radius * cScale
            );
            var highlight = `hsla(${this.hue}, 40%, 70%, 70%)`;
            var midtone = `hsla(${this.hue + 120}, 50%, 40%, 40%)`;
            var shadow = `hsla(0, 0%, 0%, 0%)`;
            sphereGradient.addColorStop(0.0, shadow);
            sphereGradient.addColorStop(0.8, midtone);
            sphereGradient.addColorStop(0.9, highlight);
            sphereGradient.addColorStop(1.0, shadow);
            c.fillStyle = sphereGradient;
            c.fill();

            //  HIGHLIGHT OVERLAY  ----------
            var sphereGradient = c.createRadialGradient(
                (this.pos.x - (0.2 * this.radius)) * cScale, 
                (this.pos.y - (0.4 * this.radius)) * cScale, 
                0, 
                (this.pos.x - (0.2 * this.radius)) * cScale, 
                (this.pos.y - (0.4 * this.radius)) * cScale, 
                1.6 * this.radius * cScale
            );
            var highlight = `hsla(${this.hue}, 20%, 70%, 70%)`;
            var midtone = `hsla(${this.hue - 120}, 50%, 20%, 60%)`;
            var shadow = `hsla(0, 0%, 0%, 0%)`;
            sphereGradient.addColorStop(0.0, highlight);
            sphereGradient.addColorStop(0.15, midtone);
            sphereGradient.addColorStop(1.0, shadow);
            c.fillStyle = sphereGradient;
            c.fill();
        }
    }

    // MAKE BUBBLES  ---------------------------------------------------------------------
    Bubbles = [];
    let bubbleSpawnTimer = 0;
    let bubbleBurstInterval = 3.0 + Math.random() * 2.0; // random pause between 3-5 seconds
    const bubblesPerBurst = 120; // number of bubbles in each burst
    let burstDuration = 5.0 + Math.random() * 10.0; // random burst duration between 5-15 seconds
    let burstTimer = 0;
    let burstActive = false;
    let bubblesSpawnedInBurst = 0;
    let continuousMode = false;
    let continuousModeTimer = 0;
    const continuousModeDuration = 60.0; // 1 minute

    function spawnBubble() {
        // Calculate pipe bowl position based on snowman image position
        // Image is 400px wide, positioned at 0.75 * simWidth * cScale
        const snowmanX = 0.75 * simWidth * cScale;
        const snowmanY = simHeight * cScale;
        const imageWidth = 400;
        const imageHeight = (frostyImage.naturalHeight / frostyImage.naturalWidth) * imageWidth;
        
        // Pipe bowl is at a fixed pixel offset from the snowman center
        // Adjust these pixel values to match the pipe location in your image
        const pipeOffsetX = -147; // pixels to the left of center
        const pipeOffsetY = -356; // pixels up from bottom
        
        const bubbleX = (snowmanX + pipeOffsetX + (Math.random() - 0.5) * 10) / cScale;
        const bubbleY = (snowmanY + pipeOffsetY + (Math.random() - 0.5) * 2) / cScale;
        
        Bubbles.push(new BUBBLES(new Vector2(bubbleX, bubbleY)));
    }
        
    // SMOKE PUFF CLASS  ---------------------------------------------------------------------
    class SMOKEPUFF {
        constructor(pos) {
            this.pos = pos.clone();
            this.vel = new Vector2((Math.random() - 0.5) * 0.05, -0.08 - Math.random() * 0.04);
            this.radius = 0.015 + Math.random() * 0.01;
            this.maxRadius = this.radius * 2.5;
            this.opacity = 0.7;
            this.age = 0;
            this.lifetime = 3.0 + Math.random() * 2.0; // 3-5 seconds
        }
        simulate() {
            this.age += dT;
            
            // Rise and drift
            this.vel.y *= 0.99; // slow down vertical rise
            this.pos.add(this.vel, dT);
            
            // Expand over time
            if (this.radius < this.maxRadius) {
                this.radius += 0.02 * dT;
            }
            
            // Fade out
            this.opacity = Math.max(0, 0.7 * (1 - this.age / this.lifetime));
        }
        draw() {
            c.save();
            c.globalAlpha = this.opacity;
            
            // Draw cartoony puff - use multiple overlapping circles
            c.fillStyle = 'hsl(0, 0%, 85%)';
            
            // Main puff circles
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2;
                const offsetX = Math.cos(angle) * this.radius * 0.4;
                const offsetY = Math.sin(angle) * this.radius * 0.4;
                
                c.beginPath();
                c.arc(
                    (this.pos.x + offsetX) * cScale,
                    (this.pos.y + offsetY) * cScale,
                    this.radius * 0.7 * cScale,
                    0,
                    Math.PI * 2
                );
                c.fill();
            }
            
            // Center circle
            c.beginPath();
            c.arc(
                this.pos.x * cScale,
                this.pos.y * cScale,
                this.radius * 0.6 * cScale,
                0,
                Math.PI * 2
            );
            c.fill();
            
            c.restore();
        }
        isDead() {
            return this.age >= this.lifetime;
        }
    }

    // MAKE SMOKE PUFFS  ---------------------------------------------------------------------
    SmokePuffs = [];
    let smokeSpawnTimer = 0;
    const smokeSpawnInterval = 1.5 + Math.random() * 1.5; // 1.5-3 seconds between puffs
    let nextSmokeInterval = smokeSpawnInterval;

    function spawnSmokePuff() {
        // Calculate chimney position
        const workshopX = 0.93 * simWidth * cScale;
        const hillBaseY = simHeight * cScale * 0.55;
        const workshopY = hillBaseY + 175;
        const buildingHeight = 60;
        const roofHeight = 35;
        const chimneyX = workshopX + 25;
        const chimneyY = workshopY - buildingHeight - roofHeight + 30;
        const chimneyHeight = 40;
        
        // Spawn from top of chimney
        const smokeX = (chimneyX + (Math.random() - 0.5) * 8) / cScale;
        const smokeY = (chimneyY - chimneyHeight + (Math.random() - 0.5) * 4) / cScale;
        
        SmokePuffs.push(new SMOKEPUFF(new Vector2(smokeX, smokeY)));
    }

    
    //  CHRISTMAS LIGHTS CLASS  ---------------------------------------------------------------------
    class LIGHT_BULB {
        constructor(pos, color, index, rotation, size = 1.0) {
            this.pos = pos.clone();
            this.color = color; // hue value
            this.index = index;
            this.rotation = rotation; // rotation angle in radians
            this.size = size; // size multiplier
            this.brightness = 0.6 + Math.random() * 0.4; // base brightness
            this.group = index % 3; // Assign to one of 3 groups for synchronized flashing
            this.twinklePhase = this.group * (Math.PI * 2 / 3); // Offset by group
            this.twinkleSpeed = 2.5; // Speed of flashing
        }
        
        simulate() {
            // Update twinkle animation
            this.twinklePhase += dT * this.twinkleSpeed;
        }
        
        draw() {
            // Calculate current brightness based on group flash
            // Use a sharper square wave for on/off effect
            const flashCycle = Math.sin(this.twinklePhase);
            const flashBrightness = flashCycle > 0 ? 1.0 : 0.2; // On or dim
            const currentBrightness = this.brightness * flashBrightness;
            const lightness = 40 + currentBrightness * 40;
            
            c.save();
            c.translate(this.pos.x * cScale, this.pos.y * cScale);
            c.rotate(this.rotation);
            
            const bulbWidth = 0.045 * cScale * this.size;
            const bulbHeight = 0.075 * cScale * this.size;
            const socketWidth = 0.0167 * cScale * this.size;
            const socketHeight = 0.03 * cScale * this.size;
            const offset = 0.035 * cScale * this.size; // Push bulb away from wire to make room for socket
            
            // Draw green cylindrical socket/base at wire connection
            // Top ellipse (rim)
            c.fillStyle = 'hsl(0, 0%, 40%)';
            c.beginPath();
            c.ellipse(0, 0, socketWidth, socketWidth * 0.3, 0, 0, Math.PI * 2);
            c.fill();
            
            // Socket body (green cylinder)
            c.fillStyle = 'hsl(120, 50%, 35%)';
            c.fillRect(-socketWidth, 0, socketWidth * 2, socketHeight);
            
            // Bottom ellipse
            c.fillStyle = 'hsl(120, 50%, 25%)';
            c.beginPath();
            c.ellipse(0, socketHeight, socketWidth, socketWidth * 0.3, 0, 0, Math.PI * 2);
            c.fill();
            
            // Socket sides for 3D effect
            c.fillStyle = 'hsl(120, 50%, 30%)';
            c.fillRect(-socketWidth, 0, socketWidth * 0.3, socketHeight);
            c.fillRect(socketWidth * 0.7, 0, socketWidth * 0.3, socketHeight);
            
            // Translate down to offset the bulb from the wire
            c.translate(0, offset + socketHeight);
            
            // Draw glow around the flame shape
            const glowGradient = c.createRadialGradient(0, 0, 0, 0, 0, bulbHeight * 1.3);
            glowGradient.addColorStop(0, `hsla(${this.color}, 100%, ${lightness}%, ${currentBrightness * 0.8})`);
            glowGradient.addColorStop(0.5, `hsla(${this.color}, 100%, ${lightness - 10}%, ${currentBrightness * 0.3})`);
            glowGradient.addColorStop(1, `hsla(${this.color}, 100%, ${lightness - 20}%, 0)`);
            c.fillStyle = glowGradient;
            c.beginPath();
            c.arc(0, 0, bulbHeight * 1.3, 0, Math.PI * 2);
            c.fill();
            
            // Draw classic flame/candle bulb shape pointing downward
            c.fillStyle = `hsl(${this.color}, 90%, ${lightness}%)`;
            c.beginPath();
            // Start at top (rounded)
            c.moveTo(0, -bulbHeight / 2);
            c.quadraticCurveTo(
                bulbWidth / 2, -bulbHeight / 2,
                bulbWidth / 2, -bulbHeight / 4
            );
            // Right curve to bottom point
            c.quadraticCurveTo(
                bulbWidth / 2, bulbHeight / 4,
                0, bulbHeight / 2
            );
            // Left curve from bottom point to top
            c.quadraticCurveTo(
                -bulbWidth / 2, bulbHeight / 4,
                -bulbWidth / 2, -bulbHeight / 4
            );
            c.quadraticCurveTo(
                -bulbWidth / 2, -bulbHeight / 2,
                0, -bulbHeight / 2
            );
            c.fill();
            
            // Draw highlight on bulb
            c.fillStyle = `hsla(${this.color}, 100%, 95%, ${currentBrightness * 0.7})`;
            c.beginPath();
            c.ellipse(
                -bulbWidth * 0.15,
                -bulbHeight * 0.1,
                bulbWidth * 0.25,
                bulbHeight * 0.2,
                0, 0, Math.PI * 2
            );
            c.fill();
            
            c.restore();
        }
    }

    // CREATE LIGHT STRINGS  ---------------------------------------------------------------------
    let TopLights = [];
    let WorkshopLights = [];
    
    function createTopLightString() {
        const colors = [0, 120, 240, 60, 300]; // Red, Green, Blue, Yellow, Magenta
        const numLights = 25;
        const totalWidth = simWidth * 1.15; // Stretch to the right
        const spacing = totalWidth / (numLights + 1);
        
        for (let i = 0; i < numLights; i++) {
            const progress = i / numLights;
            const x = spacing * (i + 1);
            const sag = Math.sin(progress * Math.PI * 6) * 0.18; // three complete arcs with deeper droop
            const y = 0.1 + sag;
            
            // Calculate tangent to the wire at this point
            // dy/dx = (dy/dprogress) / (dx/dprogress)
            // dy/dprogress = cos(progress * π * 6) * π * 6 * 0.18
            // dx/dprogress ≈ totalWidth
            const dyDprogress = Math.cos(progress * Math.PI * 6) * Math.PI * 6 * 0.18;
            const dxDprogress = totalWidth;
            const tangentSlope = dyDprogress / dxDprogress;
            // Use tangent angle directly - bulb hangs perpendicular naturally
            const rotation = Math.atan(tangentSlope);
            
            const color = colors[i % colors.length];
            TopLights.push(new LIGHT_BULB(new Vector2(x, y), color, i, rotation));
        }
    }
    
    function createWorkshopLightString() {
        const colors = [0, 120, 240, 60, 300]; // Red, Green, Blue, Yellow, Magenta
        const numLights = 12;
        
        // Calculate workshop position
        const workshopX = 0.93 * simWidth;
        const hillBaseY = simHeight * 0.55;
        const workshopY = (hillBaseY * cScale + 175) / cScale;
        const buildingWidth = 80 / cScale;
        const buildingHeight = 60 / cScale;
        const roofHeight = 35 / cScale;
        
        // String lights along the roof edge
        const startX = workshopX - buildingWidth/2 - 10/cScale;
        const endX = workshopX + buildingWidth/2 + 10/cScale;
        const roofY = workshopY - buildingHeight - roofHeight;
        
        for (let i = 0; i < numLights; i++) {
            const progress = i / (numLights - 1);
            const x = startX + (endX - startX) * progress;
            // Follow the roof line (triangular)
            const roofProgress = Math.abs(progress - 0.5) * 2; // 0 at peak, 1 at edges
            const y = roofY + roofProgress * roofHeight * 0.8;
            
            // Calculate tangent to roof line
            let tangentSlope;
            if (progress < 0.5) {
                // Ascending to peak
                tangentSlope = -(roofHeight * 0.8) / ((endX - startX) / 2);
            } else {
                // Descending from peak
                tangentSlope = (roofHeight * 0.8) / ((endX - startX) / 2);
            }
            const rotation = Math.atan(tangentSlope);
            
            const color = colors[i % colors.length];
            WorkshopLights.push(new LIGHT_BULB(new Vector2(x, y), color, i, rotation, 0.25));
        }
    }

    
    //  SNOWFLAKE CLASS  ---------------------------------------------------------------------
    class SNOW{
        constructor(pos, vel, radius, angle, type, rotation) {
            this.pos = pos.clone();
            this.vel = vel.clone();
            this.radius = radius;
            this.angle = angle;
            this.type = type;
            this.rotation = rotation;
        }
        simulate() {
            if (this.type == 'bigFlake' || this.type == 'bigFlake2' || this.type == 'bigFlake3') {
                // big flakes fall slower
                const gravity = new Vector2(0, 0.03);
                this.vel.add(gravity, dT);
                // Terminal velocity for big flakes
                if (this.vel.y > 0.15) this.vel.y = 0.15;
            } else {
                // small flakes fall faster
                const gravity = new Vector2(0, 0.1);
                this.vel.add(gravity, dT);
                // Terminal velocity for small flakes
                if (this.vel.y > 0.3) this.vel.y = 0.3;
            }
			this.pos.add(this.vel, dT);
            if (this.type == 'bigFlake' || this.type == 'bigFlake2' || this.type == 'bigFlake3') {
                if (this.pos.y - 5 * this.radius > simHeight) {
                    this.pos.y = -5 * this.radius;
                    this.pos.x = Math.random() * simWidth;
                    // Don't reset velocity - keep it falling
                }
            } else {
                if (this.pos.y - this.radius > simHeight) {
                    this.pos.y = -this.radius;
                    this.pos.x = Math.random() * simWidth;
                    // Don't reset velocity - keep it falling
                }
            }
            
            this.angle += this.rotation * dT;
        }
        draw() {
            c.save();
            c.translate(this.pos.x * cScale, this.pos.y * cScale);
            c.rotate(this.angle);
            c.fillStyle = 'hsla(0, 0%, 100%, 0.8)';
            c.strokeStyle = 'hsla(0, 0%, 100%, 0.8)';
            c.lineWidth = 0.003 * cScale;
            if (this.type == 'dot') {
                c.beginPath();
                c.arc(0, 0, this.radius * cScale, 0, 2 * Math.PI);
                c.fill();
            }
            if (this.type == 'smallFlake') {
                for (var f = 0; f < 6; f++) {
                    c.beginPath();
                    c.moveTo(0, 0);
                    c.lineTo(0, 2 * this.radius * cScale);
                    c.stroke();
                    c.rotate(Math.PI / 3);
                }  
            }
            c.restore();
        }
        drawBig() {
            c.save();
            c.translate(this.pos.x * cScale, this.pos.y * cScale);
            c.rotate(this.angle);
            c.fillStyle = 'hsla(0, 0%, 80%, 0.8)';
            c.strokeStyle = 'hsla(0, 0%, 80%, 0.8)';
            c.lineWidth = 0.003 * cScale;

            if (this.type == 'bigFlake') {
                const bigFlakeRadius = 7 * this.radius;
                const arrowPoint = 0.6 * bigFlakeRadius;
                const arrowBase = 0.8 * bigFlakeRadius;
                const hexSize = 0.4 * bigFlakeRadius;
                c.lineWidth = 0.004 * cScale;
                // drqaw six arms w/ arrows
                for (var f = 0; f < 6; f++) {
                    c.beginPath();
                    c.moveTo(0, 0);
                    c.lineTo(0, bigFlakeRadius * cScale);
                    c.lineWidth = 0.007 * cScale;
                    c.stroke();
                    // draw arrowhead
                    c.beginPath();
                    c.moveTo(-2 * this.radius * cScale, arrowBase * cScale);
                    c.lineTo(0, arrowPoint * cScale);
                    c.lineTo(2 * this.radius * cScale, arrowBase * cScale);
                    c.lineWidth = 0.004 * cScale;
                    c.stroke();
                    c.rotate(Math.PI / 3);
                }

                //c.rotate(Math.PI / 6);
                // draw hexagon inside
                c.beginPath();
                for (var h = 0; h < 6; h++) {
                    const hx = hexSize * Math.cos(h * Math.PI / 3) * cScale;
                    const hy = hexSize * Math.sin(h * Math.PI / 3) * cScale;
                    if (h == 0) {
                        c.moveTo(hx, hy);
                    } else {
                        c.lineTo(hx, hy);
                    }
                }
                c.closePath();
                c.lineWidth = 0.004 * cScale;
                c.stroke();
            }

            if (this.type == 'bigFlake2') {
                const bigFlakeRadius = 7 * this.radius;
                const lowArrowPoint = 0.3 * bigFlakeRadius;
                const lowArrowBase = 0.4 * bigFlakeRadius;
                const midArrowPoint = 0.45 * bigFlakeRadius;
                const midArrowBase = 0.65 * bigFlakeRadius;
                const highArrowPoint = 0.7 * bigFlakeRadius;
                const highArrowBase = 0.85 * bigFlakeRadius;
                c.lineWidth = 0.004 * cScale;
                // drqaw six arms w/ arrows
                for (var f = 0; f < 6; f++) {
                    c.beginPath();
                    c.moveTo(0, 0);
                    c.lineTo(0, bigFlakeRadius * cScale);
                    c.lineWidth = 0.007 * cScale;
                    c.stroke();
                    // draw low arrowhead
                    c.beginPath();
                    c.moveTo(-1.2 * this.radius * cScale, lowArrowBase * cScale);
                    c.lineTo(0, lowArrowPoint * cScale);
                    c.lineTo(1.2 * this.radius * cScale, lowArrowBase * cScale);
                    c.lineWidth = 0.004 * cScale;
                    c.stroke();
                    // draw mid arrowhead
                    c.beginPath();
                    c.moveTo(-1.7 * this.radius * cScale, midArrowBase * cScale);
                    c.lineTo(0, midArrowPoint * cScale);
                    c.lineTo(1.7 * this.radius * cScale, midArrowBase * cScale);
                    c.lineWidth = 0.004 * cScale;
                    c.stroke();
                    c.rotate(Math.PI / 3);
                    // draw high arrowhead
                    c.beginPath();
                    c.moveTo(-1.2 * this.radius * cScale, highArrowBase * cScale);
                    c.lineTo(0, highArrowPoint * cScale);
                    c.lineTo(1.2 * this.radius * cScale, highArrowBase * cScale);
                    c.lineWidth = 0.004 * cScale;
                    c.stroke();
                }
            }

            if (this.type == 'bigFlake3') {
                const bigFlakeRadius = 7 * this.radius;
                const lowArrowPoint = 0.2 * bigFlakeRadius;
                const lowArrowBase = 0.3 * bigFlakeRadius;
                const midArrowPoint = 0.4 * bigFlakeRadius;
                const midArrowBase = 0.7 * bigFlakeRadius;
                const highArrowPoint = 0.8 * bigFlakeRadius;
                const highArrowBase = 0.9 * bigFlakeRadius;
                c.lineWidth = 0.004 * cScale;
                // drqaw six arms w/ arrows
                for (var f = 0; f < 6; f++) {
                    c.beginPath();
                    c.moveTo(0, 0);
                    c.lineTo(0, bigFlakeRadius * cScale);
                    c.lineWidth = 0.007 * cScale;
                    c.stroke();
                    // draw low arrowhead
                    c.beginPath();
                    c.moveTo(-1 * this.radius * cScale, lowArrowBase * cScale);
                    c.lineTo(0, lowArrowPoint * cScale);
                    c.lineTo(1 * this.radius * cScale, lowArrowBase * cScale);
                    c.lineWidth = 0.004 * cScale;
                    c.stroke();
                    // draw middle arrowhead
                    c.beginPath();
                    c.moveTo(-2 * this.radius * cScale, midArrowBase * cScale);
                    c.lineTo(0, midArrowPoint * cScale);
                    c.lineTo(2 * this.radius * cScale, midArrowBase * cScale);
                    c.lineWidth = 0.004 * cScale;
                    c.stroke();
                    // draw high arrowhead
                    c.beginPath();
                    c.moveTo(-4 * this.radius * cScale, highArrowBase * cScale);
                    c.lineTo(0, highArrowPoint * cScale);
                    c.lineTo(4 * this.radius * cScale, highArrowBase * cScale);
                    c.lineWidth = 0.004 * cScale;
                    c.stroke();
                    
                    c.rotate(Math.PI / 3);
                }
            }

            c.restore();
        }
    }

    // MAKE SNOW --------------------------------------------------------------
    function makeSnow() {
        Snowfield = [];
        //  draw small snowflakes
        for (var s = 0; s < 700; s++) {
            posX = Math.random() * simWidth;
            posY = Math.random() * simHeight;
            radius = 0.0025 + 0.004 * Math.random();
            velX = (Math.random() - 0.5) * 0.05;
            velY = 0.0;
            angle = Math.random() * 2 * Math.PI;
            typeRand = Math.random();
            if (typeRand < 0.8) {
                type = 'dot';
            } else {
                type = 'smallFlake'
            }
            rotation = (Math.random() - 0.5) * 1;
            Snowfield.push(new SNOW(
                new Vector2(posX, posY),
                new Vector2(velX, velY),
                radius,
                angle,
                type,
                rotation));
        }

        //  draw big snowflakes
        for (var s = 0; s < 30; s++) {
            posX = Math.random() * simWidth;
            posY = Math.random() * simHeight;
            radius = 0.005 + 0.006 * Math.random();
            velX = (Math.random() - 0.5) * 0.05;
            velY = 0.3;
            angle = Math.random() * 2 * Math.PI;
            typeRand = Math.random();
            if (typeRand < 0.33) {
                type = 'bigFlake';
            } else if (typeRand < 0.66) {
                type = 'bigFlake2'
            } else {
                type = 'bigFlake3'
            }
            
            rotation = (Math.random() - 0.5) * 1;
            Snowfield.push(new SNOW(
                new Vector2(posX, posY),
                new Vector2(velX, velY),
                radius,
                angle,
                type,
                rotation));
        }
    }

    //  DEFINE STAR CLASS  -----------------
    class STAR{
        constructor(posX, posY, radius, lightness) {
            this.posX = posX;
            this.posY = posY;
            this.radius = radius;
            //this.lightness = 0.05 + 0.95 * Math.random() * (1 - (posY / (0.5 * simHeight)));
            this.lightness = lightness;
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

    function makeStars() {
        Starfield = [];
        for (r = 0; r < 1000; r++) {
            posX = Math.random() * simWidth;
            posY = Math.random() * simHeight;
            radius = 0.3 + .8 * Math.random();
            lightness = 0.05 + 0.95 * Math.random();
            Starfield.push(new STAR(posX, posY, radius, lightness));
        }
    }

    //  DEFINE ROIDS  -----------------
    class ROID {
        constructor (pos, vel, radius, hue, saturation, lightness, 
        randomNo, yaw, pitch, roll) {
            this.pos = pos.clone();
            this.vel = vel.clone();
            this.radius = radius;
            this.originalRadius = radius;
            this.mass = radius * radius * radius; // volume proportional to r^3, density constant
            this.hue = hue;
            this.saturation = saturation;
            this.lightness = lightness;
            this.randomNo = randomNo;
            this.spinAngle = 0;
            // pole spin state for globe roids (controls longitudes rotation)
            this.poleSpinAngle = Math.random() * 2 * Math.PI;
            this.poleSpinSpeed = (Math.random() - 0.5) * 0.1;
            // orientation: store as a quaternion to avoid gimbal lock; also keep Euler cache for code compatibility
            this.yaw = Math.random() * 2 * Math.PI; // initial Euler cache
            this.pitch = (Math.random() - 0.5) * Math.PI; // initial Euler cache
            this.roll = Math.random() * 2 * Math.PI; // initial Euler cache
            // quaternion orientation initialized from euler cache
            this.orientation = quatFromEuler(this.yaw, this.pitch, this.roll);
            // 3D angular velocity vector (rad/frame). Keep scalar angularVelocity in sync with omega.z
            this.omega = {
                x: (Math.random() - 0.5) * 0.2, // pitch rate (tumbling)
                y: (Math.random() - 0.5) * 0.2, // roll rate (tumbling)
                z: (Math.random() - 0.5) * 0.08  // yaw rate (main axis spin)
            };
            // also mirror z into scalar for compatibility
            this.angularVelocity = this.omega.z;
            // Flag to prevent automatic rotation during user drag
            this.isDragging = false;
            // Orbiting ball around equator
            this.orbitAngle = Math.random() * 2 * Math.PI;
            this.orbitSpeed = 0.02; // radians per frame (reduced by 20% from 0.03)
            // Three sub-orbiters that orbit the first orbiter, evenly spaced
            this.subOrbitAngle = Math.random() * 2 * Math.PI;
            this.subOrbitSpeed = 0.05; // radians per frame (restored to previous speed)
            this.subOrbitDistanceMultiplier = 4.0; // Distance from main orbiter to sub-orbiter
            // Polar orbiter - fast north-south orbit near surface
            this.polarOrbitAngle = Math.random() * 2 * Math.PI;
            this.polarOrbitSpeed = 0.08; // faster orbit speed
            this.polarOrbitRadius = 1.30; // two orbiter radii away from surface
            // Polar orbiter trail
            this.polarOrbitTrail = [];
            this.maxPolarTrailLength = 60;
        }
        get left() {
            return this.pos.x - this.radius;
        }
        get right() {
            return this.pos.x + this.radius;
        }
        get top() {
            return this.pos.y - this.radius;
        }
        get bottom() {
            return this.pos.y + this.radius;
        }
        simulate() {
            this.pos.add(this.vel, dT);

            const maxSpeed = 0.5;
            if (this.vel.length() > maxSpeed) {
                this.vel.x *= maxSpeed / this.vel.length();
                this.vel.y *= maxSpeed / this.vel.length();
            }

            // angular control constants (declared early so non-globe code can use them)
            const omegaDamping = 1.0; // no automatic damping: tumbling persists until another force acts
            // maximum angular rate (radians/frame) allowed per-axis to avoid runaway
            const maxOmega = 0.5;
            // maximum spin about axis (scalar spin rate applied to spinAngle/poleSpinAngle)
            const maxSpin = 0.01;

            // Integrate 3D omega into visible orientation for globe roids
            // and keep scalar angularVelocity roughly in sync with omega.z
            // pole spin continues to include poleSpinSpeed
            // include yaw rate (omega.z) in poleSpinAngle so visible longitude rotation follows yaw
            // clamp the resulting axial spin so roids don't spin faster than maxSpin
            let spinInc = 60 * dT * (this.poleSpinSpeed + this.omega.z);
            spinInc = Math.max(-maxSpin, Math.min(maxSpin, spinInc));
            this.poleSpinAngle += spinInc;
            if (this.poleSpinAngle > 2 * Math.PI) this.poleSpinAngle -= 2 * Math.PI;
            if (this.poleSpinAngle < -2 * Math.PI) this.poleSpinAngle += 2 * Math.PI;
            // Integrate angular velocity vector (this.omega) into quaternion orientation using small-angle quaternion
            // delta_q ~ [1, 0.5*omega*dt]
            // Skip automatic rotation if user is dragging
            if (!this.isDragging) {
                const half_dt = 0.5 * dT;
                const dq = {
                    w: 1.0,
                    x: this.omega.x * half_dt,
                    y: this.omega.y * half_dt,
                    z: this.omega.z * half_dt
                };
                // new orientation = orientation * dq  (apply small-body-frame rotation)
                this.orientation = quatMultiply(this.orientation, dq);
                this.orientation = quatNormalize(this.orientation);
            }
            // update Euler cache from quaternion for any code that still reads yaw/pitch/roll
            // conversion: yaw (Z), pitch (X), roll (Y) inverse of quatFromEuler
            const qw = this.orientation.w, qx = this.orientation.x, qy = this.orientation.y, qz = this.orientation.z;
            // yaw (Z)
            this.yaw = Math.atan2(2*(qw*qz + qx*qy), 1 - 2*(qy*qy + qz*qz));
            // pitch (X)
            const sinp = 2*(qw*qx - qy*qz);
            this.pitch = Math.abs(sinp) >= 1 ? Math.sign(sinp) * Math.PI/2 : Math.asin(sinp);
            // roll (Y)
            this.roll = Math.atan2(2*(qw*qy + qz*qx), 1 - 2*(qx*qx + qy*qy));
            // apply damping (may be 1.0 for no damping) and then clamp to max allowed rates
            this.omega.x *= omegaDamping;
            this.omega.y *= omegaDamping;
            this.omega.z *= omegaDamping;
            // clamp per-axis angular rates
            this.omega.x = Math.max(-maxOmega, Math.min(maxOmega, this.omega.x));
            this.omega.y = Math.max(-maxOmega, Math.min(maxOmega, this.omega.y));
            this.omega.z = Math.max(-maxOmega, Math.min(maxOmega, this.omega.z));
            // keep scalar angularVelocity in sync with clamped z
            this.angularVelocity = this.omega.z;
            // clamp scalar axial spin used for visual spin/pole spin
            this.angularVelocity = Math.max(-maxSpin, Math.min(maxSpin, this.angularVelocity));
            
            // Update orbiting ball angle
            this.orbitAngle += this.orbitSpeed;
            if (this.orbitAngle > 2 * Math.PI) {
                this.orbitAngle -= 2 * Math.PI;
            }
            
            // Update second orbiter angle
            this.subOrbitAngle += this.subOrbitSpeed;
            if (this.subOrbitAngle > 2 * Math.PI) {
                this.subOrbitAngle -= 2 * Math.PI;
            }
            
            // Update polar orbiter angle
            this.polarOrbitAngle += this.polarOrbitSpeed;
            if (this.polarOrbitAngle > 2 * Math.PI) {
                this.polarOrbitAngle -= 2 * Math.PI;
            }
            
            // Add polar orbiter position to trail
            this.addPolarOrbiterToTrail();
         
            if (this.spinAngle > 2 * Math.PI) {
                this.spinAngle -= 2 * Math.PI;
            }
        }
        
        addPolarOrbiterToTrail() {
            // Calculate polar orbiter's world position
            const polarOrbitDist = this.radius * this.polarOrbitRadius;
            const polarLocalX = 0;
            const polarLocalY = polarOrbitDist * Math.sin(this.polarOrbitAngle);
            const polarLocalZ = polarOrbitDist * Math.cos(this.polarOrbitAngle);
            const polarRotated = quatRotateVec(this.orientation, polarLocalX, polarLocalY, polarLocalZ);
            
            // World position
            const worldX = polarRotated.x + this.pos.x;
            const worldY = polarRotated.y + this.pos.y;
            const worldZ = polarRotated.z;
            
            // Add to trail
            this.polarOrbitTrail.push({ x: worldX, y: worldY, z: worldZ });
            
            // Keep trail at max length
            if (this.polarOrbitTrail.length > this.maxPolarTrailLength) {
                this.polarOrbitTrail.shift();
            }
        }
        
        draw() {
            // Calculate orbiter's 3D position to determine if it's behind or in front
            const orbitRadius = this.radius * 2.5;
            const ballX0 = orbitRadius * Math.cos(this.orbitAngle);
            const ballY0 = orbitRadius * Math.sin(this.orbitAngle);
            const ballZ0 = 0;
            const rotBall = quatRotateVec(this.orientation, ballX0, ballY0, ballZ0);
            
            // Calculate sub-orbiter's 3D position relative to main orbiter
            const subOrbitRadius = this.radius * 0.15 * this.subOrbitDistanceMultiplier; // Orbit around the main orbiter
            const axisOffset = 30 * Math.PI / 180; // 30-degree offset
            const subX0 = subOrbitRadius * Math.cos(this.subOrbitAngle);
            const subY0 = subOrbitRadius * Math.sin(this.subOrbitAngle) * Math.cos(axisOffset);
            const subZ0 = subOrbitRadius * Math.sin(this.subOrbitAngle) * Math.sin(axisOffset);
            // Position relative to main orbiter
            const subBallX = ballX0 + subX0;
            const subBallY = ballY0 + subY0;
            const subBallZ = ballZ0 + subZ0;
            const rotSubBall = quatRotateVec(this.orientation, subBallX, subBallY, subBallZ);
            
            // Calculate orbiter and sub-orbiter positions ONCE (used in both behind/front sections)
            const mainOrbiterInfo = drawOrbiter(this.radius, this.pos, this.orientation, this.orbitAngle);
            const angleOffset = (2 * Math.PI) / 4; // 90 degrees
            const orbiterScaleFactor = mainOrbiterInfo.scaleFactor;
            const subOrbiterInfos = [
                getSubOrbiterPosition(this.radius, this.pos, this.orientation, this.orbitAngle, this.subOrbitAngle, this.subOrbitDistanceMultiplier, orbiterScaleFactor),
                getSubOrbiterPosition(this.radius, this.pos, this.orientation, this.orbitAngle, this.subOrbitAngle + angleOffset, this.subOrbitDistanceMultiplier, orbiterScaleFactor),
                getSubOrbiterPosition(this.radius, this.pos, this.orientation, this.orbitAngle, this.subOrbitAngle + angleOffset * 2, this.subOrbitDistanceMultiplier, orbiterScaleFactor),
                getSubOrbiterPosition(this.radius, this.pos, this.orientation, this.orbitAngle, this.subOrbitAngle + angleOffset * 3, this.subOrbitDistanceMultiplier, orbiterScaleFactor)
            ];
            const subOrbiterInfos2 = [
                getSubOrbiterPosition2(this.radius, this.pos, this.orientation, this.orbitAngle, this.subOrbitAngle, this.subOrbitDistanceMultiplier, orbiterScaleFactor),
                getSubOrbiterPosition2(this.radius, this.pos, this.orientation, this.orbitAngle, this.subOrbitAngle + angleOffset, this.subOrbitDistanceMultiplier, orbiterScaleFactor),
                getSubOrbiterPosition2(this.radius, this.pos, this.orientation, this.orbitAngle, this.subOrbitAngle + angleOffset * 2, this.subOrbitDistanceMultiplier, orbiterScaleFactor),
                getSubOrbiterPosition2(this.radius, this.pos, this.orientation, this.orbitAngle, this.subOrbitAngle + angleOffset * 3, this.subOrbitDistanceMultiplier, orbiterScaleFactor)
            ];
            const subOrbiterHues = [15, 25, 35, 20];
            const subOrbiterHues2 = [170, 185, 195, 180];
            
            // Draw orbiters BEHIND globe if z < 0 (facing away from camera)
            if (rotBall.z < 0) {
                
                // Draw ALL sub-orbiters that are behind the main orbiter (whether behind globe or not)
                for (let i = 0; i < 4; i++) {
                    const subInfo = subOrbiterInfos[i];
                    const subDistFromAxis = Math.sqrt(subInfo.worldPos.x * subInfo.worldPos.x + subInfo.worldPos.y * subInfo.worldPos.y);
                    const isSubBehindGlobe = subInfo.worldPos.z < 0 && subDistFromAxis < this.radius;
                    const isSubInFrontOfGlobe = !isSubBehindGlobe;
                    const isBehindMainOrbiter = subInfo.worldPos.z < mainOrbiterInfo.worldPos.z;
                    
                    // Draw if behind main orbiter (regardless of globe occlusion)
                    if (isBehindMainOrbiter) {
                        drawSubOrbiterBall(subInfo.screenX, subInfo.screenY, subInfo.pixelRadius, subOrbiterHues[i]);
                    }
                }
                
                for (let i = 0; i < 4; i++) {
                    const subInfo = subOrbiterInfos2[i];
                    const subDistFromAxis = Math.sqrt(subInfo.worldPos.x * subInfo.worldPos.x + subInfo.worldPos.y * subInfo.worldPos.y);
                    const isSubBehindGlobe = subInfo.worldPos.z < 0 && subDistFromAxis < this.radius;
                    const isBehindMainOrbiter = subInfo.worldPos.z < mainOrbiterInfo.worldPos.z;
                    
                    if (isBehindMainOrbiter) {
                        drawSubOrbiterBall(subInfo.screenX, subInfo.screenY, subInfo.pixelRadius, subOrbiterHues2[i]);
                    }
                }
                
                // Draw main orbiter ball (it's behind the globe)
                drawOrbiterBall(mainOrbiterInfo.screenX, mainOrbiterInfo.screenY, mainOrbiterInfo.pixelRadius);
                
                // Draw sub-orbiters that are in front of main orbiter (whether behind globe or not)
                for (let i = 0; i < 4; i++) {
                    const subInfo = subOrbiterInfos[i];
                    const subDistFromAxis = Math.sqrt(subInfo.worldPos.x * subInfo.worldPos.x + subInfo.worldPos.y * subInfo.worldPos.y);
                    const isSubBehindGlobe = subInfo.worldPos.z < 0 && subDistFromAxis < this.radius;
                    const isInFrontOfMainOrbiter = subInfo.worldPos.z >= mainOrbiterInfo.worldPos.z;
                    
                    // Draw if in front of main orbiter (regardless of globe occlusion)
                    if (isInFrontOfMainOrbiter) {
                        drawSubOrbiterBall(subInfo.screenX, subInfo.screenY, subInfo.pixelRadius, subOrbiterHues[i]);
                    }
                }
                
                for (let i = 0; i < 4; i++) {
                    const subInfo = subOrbiterInfos2[i];
                    const subDistFromAxis = Math.sqrt(subInfo.worldPos.x * subInfo.worldPos.x + subInfo.worldPos.y * subInfo.worldPos.y);
                    const isSubBehindGlobe = subInfo.worldPos.z < 0 && subDistFromAxis < this.radius;
                    const isInFrontOfMainOrbiter = subInfo.worldPos.z >= mainOrbiterInfo.worldPos.z;
                    
                    if (isInFrontOfMainOrbiter) {
                        drawSubOrbiterBall(subInfo.screenX, subInfo.screenY, subInfo.pixelRadius, subOrbiterHues2[i]);
                    }
                }
            }
            
            // Calculate polar orbiter position for occlusion checking
            const polarOrbitDist = this.radius * this.polarOrbitRadius;
            const polarLocalX = 0;
            const polarLocalY = polarOrbitDist * Math.sin(this.polarOrbitAngle);
            const polarLocalZ = polarOrbitDist * Math.cos(this.polarOrbitAngle);
            const polarRotated = quatRotateVec(this.orientation, polarLocalX, polarLocalY, polarLocalZ);
            
            // Check if polar orbiter is behind globe surface
            const polarDistFromAxis = Math.sqrt(polarRotated.x * polarRotated.x + polarRotated.y * polarRotated.y);
            const isPolarBehindGlobe = polarRotated.z < 0 && polarDistFromAxis < this.radius;
            
            // Draw polar orbiter trail segments that are behind the globe
            if (this.polarOrbitTrail.length > 1) {
                c.lineCap = 'butt';
                c.lineJoin = 'butt';
                
                for (let j = 1; j < this.polarOrbitTrail.length; j++) {
                    const p1 = this.polarOrbitTrail[j - 1];
                    const p2 = this.polarOrbitTrail[j];
                    
                    // Convert world positions to globe-relative positions
                    const rel1X = p1.x - this.pos.x;
                    const rel1Y = p1.y - this.pos.y;
                    const rel1Z = p1.z;
                    const rel2X = p2.x - this.pos.x;
                    const rel2Y = p2.y - this.pos.y;
                    const rel2Z = p2.z;
                    
                    // Check if both points are behind the globe
                    const dist1FromAxis = Math.sqrt(rel1X * rel1X + rel1Y * rel1Y);
                    const dist2FromAxis = Math.sqrt(rel2X * rel2X + rel2Y * rel2Y);
                    const isBehind1 = rel1Z < 0 && dist1FromAxis < this.radius;
                    const isBehind2 = rel2Z < 0 && dist2FromAxis < this.radius;
                    
                    // Only draw if both endpoints are behind the globe
                    if (isBehind1 && isBehind2) {
                        const alpha = j / this.polarOrbitTrail.length;
                        c.strokeStyle = `hsla(50, 90%, 70%, ${alpha * 0.3})`;
                        c.lineWidth = 1 + 3 * alpha;
                        
                        const perspective1 = 800 / (800 + p1.z);
                        const perspective2 = 800 / (800 + p2.z);
                        
                        const screenX1 = p1.x * cScale * perspective1;
                        const screenY1 = p1.y * cScale * perspective1;
                        const screenX2 = p2.x * cScale * perspective2;
                        const screenY2 = p2.y * cScale * perspective2;
                        
                        c.beginPath();
                        c.moveTo(screenX1, screenY1);
                        c.lineTo(screenX2, screenY2);
                        c.stroke();
                    }
                }
            }
            
            // Draw polar orbiter if behind globe
            if (isPolarBehindGlobe) {
                drawPolarOrbiter(this.radius, this.pos, this.orientation, this.polarOrbitAngle, this.polarOrbitRadius);
            }
            
            drawGlobeRoid(
                this.pos.x * cScale, this.pos.y * cScale, this.radius * cScale, 
                this.originalRadius * cScale, this.hue, this.saturation, this.lightness, 
                this.poleSpinAngle, this.orientation);

            //  HIGHLIGHT SHADING ----------
            drawCircle(this.pos.x * cScale, this.pos.y * cScale, this.radius * cScale);
            var sphereGradient = c.createRadialGradient(
                (this.pos.x - (0.3 * this.radius)) * cScale, 
                (this.pos.y - (0.5 * this.radius)) * cScale, 
                0, 
                (this.pos.x - (0.3 * this.radius)) * cScale, 
                (this.pos.y - (0.5 * this.radius)) * cScale, 
                2 * this.radius * cScale);
            var highlight = `hsla(${this.hue + 60}, 50%, 50%, 0.6)`;
            var shadow = `hsla(0, 0%, 0%, 0)`;
            sphereGradient.addColorStop(0.0, highlight);
            sphereGradient.addColorStop(1.0, shadow);
            c.fillStyle = sphereGradient;
            c.fill();

            //  OVERALL BUBBLE SHADING  ----------
            var sphereGradient = c.createRadialGradient(
                    this.pos.x * cScale, 
                    this.pos.y * cScale, 
                    0, 
                    this.pos.x * cScale, 
                    this.pos.y * cScale, 
                    this.radius * cScale);
            var highlight = `hsla(${this.hue + 60}, 50%, 40%, 0.5)`;
            var midtone = `hsla(${this.hue + 60}, 50%, 20%, 0.4)`;
            var shadow = `hsla(${this.hue + 60}, 50%, 10%, 0.2)`;
            sphereGradient.addColorStop(0.0, shadow);
            sphereGradient.addColorStop(0.8, midtone);
            sphereGradient.addColorStop(1.0, highlight);
            c.fillStyle = sphereGradient;
            c.fill();

            // Draw orbiters that are in front of the globe (z >= 0), after all shading
            if (rotBall.z >= 0) {
                const mainOrbiterRadius = this.radius * 0.15;
            
            // STEP 1: Draw sub-orbiters that are BEHIND the main orbiter (first plane)
            for (let i = 0; i < 4; i++) {
                const subInfo = subOrbiterInfos[i];
                const subDistFromAxis = Math.sqrt(subInfo.worldPos.x * subInfo.worldPos.x + subInfo.worldPos.y * subInfo.worldPos.y);
                const isSubInFront = subInfo.worldPos.z >= 0 || subDistFromAxis >= this.radius;
                const isBehindMainOrbiter = subInfo.worldPos.z < mainOrbiterInfo.worldPos.z;
                
                if (isSubInFront && isBehindMainOrbiter) {
                    drawSubOrbiterBall(subInfo.screenX, subInfo.screenY, subInfo.pixelRadius, subOrbiterHues[i]);
                }
            }
            
            // STEP 2: Draw sub-orbiters that are BEHIND the main orbiter (second plane)
            for (let i = 0; i < 4; i++) {
                const subInfo = subOrbiterInfos2[i];
                const subDistFromAxis = Math.sqrt(subInfo.worldPos.x * subInfo.worldPos.x + subInfo.worldPos.y * subInfo.worldPos.y);
                const isSubInFront = subInfo.worldPos.z >= 0 || subDistFromAxis >= this.radius;
                const isBehindMainOrbiter = subInfo.worldPos.z < mainOrbiterInfo.worldPos.z;
                
                if (isSubInFront && isBehindMainOrbiter) {
                    drawSubOrbiterBall(subInfo.screenX, subInfo.screenY, subInfo.pixelRadius, subOrbiterHues2[i]);
                }
            }
            
            // STEP 3: Draw main orbiter (covers sub-orbiters behind it)
            // Draw it when in front of globe for proper occlusion
            if (rotBall.z >= 0) {
                drawOrbiterBall(mainOrbiterInfo.screenX, mainOrbiterInfo.screenY, mainOrbiterInfo.pixelRadius);
            }
            
            // STEP 4: Draw sub-orbiters that are IN FRONT of the main orbiter (first plane)
            for (let i = 0; i < 4; i++) {
                const subInfo = subOrbiterInfos[i];
                const subDistFromAxis = Math.sqrt(subInfo.worldPos.x * subInfo.worldPos.x + subInfo.worldPos.y * subInfo.worldPos.y);
                const isSubInFront = subInfo.worldPos.z >= 0 || subDistFromAxis >= this.radius;
                const isInFrontOfMainOrbiter = subInfo.worldPos.z >= mainOrbiterInfo.worldPos.z;
                
                if (isSubInFront && isInFrontOfMainOrbiter) {
                    drawSubOrbiterBall(subInfo.screenX, subInfo.screenY, subInfo.pixelRadius, subOrbiterHues[i]);
                }
            }
            
            // STEP 5: Draw sub-orbiters that are IN FRONT of the main orbiter (second plane)
            for (let i = 0; i < 4; i++) {
                const subInfo = subOrbiterInfos2[i];
                const subDistFromAxis = Math.sqrt(subInfo.worldPos.x * subInfo.worldPos.x + subInfo.worldPos.y * subInfo.worldPos.y);
                const isSubInFront = subInfo.worldPos.z >= 0 || subDistFromAxis >= this.radius;
                const isInFrontOfMainOrbiter = subInfo.worldPos.z >= mainOrbiterInfo.worldPos.z;
                
                if (isSubInFront && isInFrontOfMainOrbiter) {
                    drawSubOrbiterBall(subInfo.screenX, subInfo.screenY, subInfo.pixelRadius, subOrbiterHues2[i]);
                }
            }
            } // End of "in front of globe" section

            // Draw polar orbiter trail segments that are in front of the globe
            if (this.polarOrbitTrail.length > 1) {
                c.lineCap = 'butt';
                c.lineJoin = 'butt';
                
                for (let j = 1; j < this.polarOrbitTrail.length; j++) {
                    const p1 = this.polarOrbitTrail[j - 1];
                    const p2 = this.polarOrbitTrail[j];
                    
                    // Convert world positions to globe-relative positions
                    const rel1X = p1.x - this.pos.x;
                    const rel1Y = p1.y - this.pos.y;
                    const rel1Z = p1.z;
                    const rel2X = p2.x - this.pos.x;
                    const rel2Y = p2.y - this.pos.y;
                    const rel2Z = p2.z;
                    
                    // Check if points are behind the globe
                    const dist1FromAxis = Math.sqrt(rel1X * rel1X + rel1Y * rel1Y);
                    const dist2FromAxis = Math.sqrt(rel2X * rel2X + rel2Y * rel2Y);
                    const isBehind1 = rel1Z < 0 && dist1FromAxis < this.radius;
                    const isBehind2 = rel2Z < 0 && dist2FromAxis < this.radius;
                    
                    // Only draw if at least one endpoint is in front
                    if (!isBehind1 || !isBehind2) {
                        const alpha = j / this.polarOrbitTrail.length;
                        c.strokeStyle = `hsla(50, 90%, 70%, ${alpha * 0.3})`;
                        c.lineWidth = 1 + 3 * alpha;
                        
                        const perspective1 = 800 / (800 + p1.z);
                        const perspective2 = 800 / (800 + p2.z);
                        
                        const screenX1 = p1.x * cScale * perspective1;
                        const screenY1 = p1.y * cScale * perspective1;
                        const screenX2 = p2.x * cScale * perspective2;
                        const screenY2 = p2.y * cScale * perspective2;
                        
                        c.beginPath();
                        c.moveTo(screenX1, screenY1);
                        c.lineTo(screenX2, screenY2);
                        c.stroke();
                    }
                }
            }

            // Draw polar orbiter if in front of globe
            if (!isPolarBehindGlobe) {
                drawPolarOrbiter(this.radius, this.pos, this.orientation, this.polarOrbitAngle, this.polarOrbitRadius);
            }
        }
    }

    //  DEFINE CUBE  -----------------
    class CUBE {
        constructor(pos, size) {
            this.pos = pos.clone();
            this.size = size; // Half-size of cube (distance from center to face)
            
            // Quaternion orientation
            this.orientation = quatFromEuler(
                Math.random() * 2 * Math.PI,
                Math.random() * 2 * Math.PI,
                Math.random() * 2 * Math.PI
            );

             // Quaternion orientation
            this.orientation = quatFromEuler(
                0.25 * Math.PI,
                0.25 * Math.PI,
                0.25 * Math.PI
            );
            
            // 3D angular velocity (tumbling in all dimensions)
            this.omega = {
                x: 0.8, // slow pitch
                y: -1, // slow roll
                z: -0.6  // slow yaw
            };
            
            // Tic-tac-toe game state
            this.tttBoard = [0, 0, 0, 0, 0, 0, 0, 0, 0]; // 0=empty, 1=X, 2=O
            this.tttCurrentPlayer = 1; // 1=X, 2=O
            this.tttGameOver = false;
            this.tttWinner = 0;
            this.tttMoveTimer = 0;
            this.tttMoveDelay = 1.0; // seconds between moves
        }
        
        simulate() {
            // Update orientation by integrating angular velocity
            const half_dt = dT * 0.5;
            const dq = {
                w: 1,
                x: this.omega.x * half_dt,
                y: this.omega.y * half_dt,
                z: this.omega.z * half_dt
            };
            // new orientation = orientation * dq  (apply small-body-frame rotation)
            this.orientation = quatMultiply(this.orientation, dq);
            this.orientation = quatNormalize(this.orientation);
            
            // Update tic-tac-toe game
            if (!this.tttGameOver) {
                this.tttMoveTimer += dT;
                if (this.tttMoveTimer >= this.tttMoveDelay) {
                    this.tttMoveTimer = 0;
                    this.makeTTTMove();
                }
            } else {
                // Reset game after 3 seconds
                this.tttMoveTimer += dT;
                if (this.tttMoveTimer >= 3.0) {
                    this.resetTTTGame();
                }
            }
        }
        
        makeTTTMove() {
            // Find empty cells
            const emptyCells = [];
            for (let i = 0; i < 9; i++) {
                if (this.tttBoard[i] === 0) {
                    emptyCells.push(i);
                }
            }
            
            if (emptyCells.length === 0) {
                this.tttGameOver = true;
                return;
            }
            
            // Use optimal strategy (minimax) to ensure draws
            const move = this.getBestMove();
            this.tttBoard[move] = this.tttCurrentPlayer;
            
            // Check for winner
            const winner = this.checkTTTWinner();
            if (winner !== 0) {
                this.tttGameOver = true;
                this.tttWinner = winner;
            } else if (emptyCells.length === 1) {
                // Board full, it's a draw
                this.tttGameOver = true;
            } else {
                // Switch player
                this.tttCurrentPlayer = this.tttCurrentPlayer === 1 ? 2 : 1;
            }
        }
        
        getBestMove() {
            let bestScore = -Infinity;
            let bestMove = -1;
            
            for (let i = 0; i < 9; i++) {
                if (this.tttBoard[i] === 0) {
                    this.tttBoard[i] = this.tttCurrentPlayer;
                    const score = this.minimax(0, false);
                    this.tttBoard[i] = 0;
                    
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = i;
                    }
                }
            }
            
            return bestMove;
        }
        
        minimax(depth, isMaximizing) {
            const winner = this.checkTTTWinner();
            
            // Terminal states
            if (winner === this.tttCurrentPlayer) {
                return 10 - depth;
            } else if (winner !== 0) {
                return depth - 10;
            }
            
            // Check for draw
            let hasEmpty = false;
            for (let i = 0; i < 9; i++) {
                if (this.tttBoard[i] === 0) {
                    hasEmpty = true;
                    break;
                }
            }
            if (!hasEmpty) {
                return 0;
            }
            
            if (isMaximizing) {
                let bestScore = -Infinity;
                for (let i = 0; i < 9; i++) {
                    if (this.tttBoard[i] === 0) {
                        this.tttBoard[i] = this.tttCurrentPlayer;
                        const score = this.minimax(depth + 1, false);
                        this.tttBoard[i] = 0;
                        bestScore = Math.max(score, bestScore);
                    }
                }
                return bestScore;
            } else {
                let bestScore = Infinity;
                const opponent = this.tttCurrentPlayer === 1 ? 2 : 1;
                for (let i = 0; i < 9; i++) {
                    if (this.tttBoard[i] === 0) {
                        this.tttBoard[i] = opponent;
                        const score = this.minimax(depth + 1, true);
                        this.tttBoard[i] = 0;
                        bestScore = Math.min(score, bestScore);
                    }
                }
                return bestScore;
            }
        }
        
        checkTTTWinner() {
            const b = this.tttBoard;
            const lines = [
                [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
                [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
                [0, 4, 8], [2, 4, 6]             // diagonals
            ];
            
            for (let line of lines) {
                const [a, b_idx, c] = line;
                if (b[a] !== 0 && b[a] === b[b_idx] && b[a] === b[c]) {
                    return b[a];
                }
            }
            return 0;
        }
        
        resetTTTGame() {
            this.tttBoard = [0, 0, 0, 0, 0, 0, 0, 0, 0];
            this.tttCurrentPlayer = 1;
            this.tttGameOver = false;
            this.tttWinner = 0;
            this.tttMoveTimer = 0;
        }
        
        draw() {
            // Define 8 vertices of the cube in local space
            const s = this.size * cScale;
            const vertices = [
                { x: -s, y: -s, z: -s }, // 0: back-bottom-left
                { x:  s, y: -s, z: -s }, // 1: back-bottom-right
                { x:  s, y:  s, z: -s }, // 2: back-top-right
                { x: -s, y:  s, z: -s }, // 3: back-top-left
                { x: -s, y: -s, z:  s }, // 4: front-bottom-left
                { x:  s, y: -s, z:  s }, // 5: front-bottom-right
                { x:  s, y:  s, z:  s }, // 6: front-top-right
                { x: -s, y:  s, z:  s }  // 7: front-top-left
            ];
            
            // Rotate all vertices by current orientation
            const rotated = vertices.map(v => quatRotateVec(this.orientation, v.x, v.y, v.z));
            
            // Project to screen space
            const screenVerts = rotated.map(v => ({
                x: this.pos.x * cScale + v.x,
                y: this.pos.y * cScale - v.y, // flip Y for canvas
                z: v.z
            }));
            
            // Define 6 faces (each face as array of 4 vertex indices)
            const faces = [
                { indices: [0, 1, 2, 3], normal: { x: 0, y: 0, z: -1 }, baseHue: 170 }, // back
                { indices: [4, 5, 6, 7], normal: { x: 0, y: 0, z: 1 }, baseHue: 170 },  // front
                { indices: [0, 1, 5, 4], normal: { x: 0, y: -1, z: 0 }, baseHue: 170 }, // bottom
                { indices: [3, 2, 6, 7], normal: { x: 0, y: 1, z: 0 }, baseHue: 170 },  // top
                { indices: [0, 3, 7, 4], normal: { x: -1, y: 0, z: 0 }, baseHue: 170 }, // left
                { indices: [1, 2, 6, 5], normal: { x: 1, y: 0, z: 0 }, baseHue: 170 }   // right
            ];
            
            // Calculate each face's average Z and rotated normal for depth sorting and shading
            const facesWithDepth = faces.map(face => {
                // Average Z of face vertices
                const avgZ = face.indices.reduce((sum, idx) => sum + screenVerts[idx].z, 0) / 4;
                
                // Rotate the face normal
                const rotNormal = quatRotateVec(this.orientation, face.normal.x, face.normal.y, face.normal.z);
                
                // Simple lighting: assume light from front-top-right (normalized)
                const lightDir = { x: 0.3, y: 0.5, z: 0.8 };
                const lightMag = Math.sqrt(lightDir.x * lightDir.x + lightDir.y * lightDir.y + lightDir.z * lightDir.z);
                const lightDot = (rotNormal.x * lightDir.x + rotNormal.y * lightDir.y + rotNormal.z * lightDir.z) / lightMag;
                
                // Map dot product to brightness (0.3 to 1.0 range)
                const brightness = 0.3 + 0.7 * Math.max(0, lightDot);
                
                return {
                    face: face,
                    avgZ: avgZ,
                    brightness: brightness,
                    rotNormal: rotNormal
                };
            });
            
            // Sort faces by depth (back to front)
            facesWithDepth.sort((a, b) => a.avgZ - b.avgZ);
            
            // Draw rear faces (facing away) with faint lines first
            facesWithDepth.forEach(({ face, brightness, rotNormal }) => {
                if (rotNormal.z >= 0) { // Facing away from camera
                    c.beginPath();
                    face.indices.forEach((idx, i) => {
                        const v = screenVerts[idx];
                        if (i === 0) {
                            c.moveTo(v.x, v.y);
                        } else {
                            c.lineTo(v.x, v.y);
                        }
                    });
                    c.closePath();
                    
                    // Faint rear edges
                    c.strokeStyle = `hsla(${face.baseHue}, 40%, 30%, 0.8)`;
                    c.lineWidth = 2;
                    c.stroke();
                }
            });
            
            // Draw front faces (facing toward camera)
            facesWithDepth.forEach(({ face, brightness, rotNormal }) => {
                if (rotNormal.z < 0) { // Facing toward camera
                    c.beginPath();
                    face.indices.forEach((idx, i) => {
                        const v = screenVerts[idx];
                        if (i === 0) {
                            c.moveTo(v.x, v.y);
                        } else {
                            c.lineTo(v.x, v.y);
                        }
                    });
                    c.closePath();
                    
                    // Use transparency and shading based on lighting
                    const lightness = 15 + brightness * 30;
                    c.fillStyle = `hsla(${face.baseHue}, 70%, ${lightness}%, 0.6)`;
                    c.fill();
                    
                    // Edge outline
                    c.strokeStyle = `hsla(${face.baseHue}, 70%, ${lightness + 20}%, 0.9)`;
                    c.lineWidth = 3;
                    c.stroke();
                }
            });
            
            // Draw tic-tac-toe on the right face (face index 5: [1, 2, 6, 5])
            // This face always has the game, regardless of orientation
            const tttFace = faces[2]; // Right face with normal { x: 1, y: 0, z: 0 }
            
            // Get the rotated vertices for this face
            const faceVerts = tttFace.indices.map(idx => screenVerts[idx]);
            
            // Calculate grid cells (3x3) in screen space
            // Get corner positions
            const v0 = faceVerts[0]; // bottom-left
            const v1 = faceVerts[1]; // bottom-right
            const v2 = faceVerts[2]; // top-right
            const v3 = faceVerts[3]; // top-left
            
            // Draw grid lines
            c.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            c.lineWidth = 2;
            
            // Vertical lines (divide horizontally into thirds)
            for (let i = 1; i <= 2; i++) {
                const t = i / 3;
                // Bottom edge point
                const bx = v0.x + (v1.x - v0.x) * t;
                const by = v0.y + (v1.y - v0.y) * t;
                // Top edge point
                const tx = v3.x + (v2.x - v3.x) * t;
                const ty = v3.y + (v2.y - v3.y) * t;
                
                c.beginPath();
                c.moveTo(bx, by);
                c.lineTo(tx, ty);
                c.stroke();
            }
            
            // Horizontal lines (divide vertically into thirds)
            for (let i = 1; i <= 2; i++) {
                const t = i / 3;
                // Left edge point
                const lx = v0.x + (v3.x - v0.x) * t;
                const ly = v0.y + (v3.y - v0.y) * t;
                // Right edge point
                const rx = v1.x + (v2.x - v1.x) * t;
                const ry = v1.y + (v2.y - v1.y) * t;
                
                c.beginPath();
                c.moveTo(lx, ly);
                c.lineTo(rx, ry);
                c.stroke();
            }
            
            // Draw X's and O's
            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 3; col++) {
                    const cellIndex = row * 3 + col;
                    const mark = this.tttBoard[cellIndex];
                    
                    if (mark !== 0) {
                        // Calculate cell center
                        const colT = (col + 0.5) / 3;
                        const rowT = (row + 0.5) / 3;
                        
                        // Bottom edge interpolation
                        const bx = v0.x + (v1.x - v0.x) * colT;
                        const by = v0.y + (v1.y - v0.y) * colT;
                        // Top edge interpolation
                        const tx = v3.x + (v2.x - v3.x) * colT;
                        const ty = v3.y + (v2.y - v3.y) * colT;
                        
                        // Final center position
                        const cx = bx + (tx - bx) * rowT;
                        const cy = by + (ty - by) * rowT;
                        
                        // Calculate the offset size for marks (fraction of cell)
                        const offset = 0.25;
                        
                        // Calculate four corner positions of the mark area
                        const colTMin = (col + 0.5 - offset) / 3;
                        const colTMax = (col + 0.5 + offset) / 3;
                        const rowTMin = (row + 0.5 - offset) / 3;
                        const rowTMax = (row + 0.5 + offset) / 3;
                        
                        // Bottom-left corner
                        const bl = {
                            x: v0.x + (v1.x - v0.x) * colTMin,
                            y: v0.y + (v1.y - v0.y) * colTMin
                        };
                        const tl = {
                            x: v3.x + (v2.x - v3.x) * colTMin,
                            y: v3.y + (v2.y - v3.y) * colTMin
                        };
                        bl.x = bl.x + (tl.x - bl.x) * rowTMin;
                        bl.y = bl.y + (tl.y - bl.y) * rowTMin;
                        
                        // Bottom-right corner
                        const br = {
                            x: v0.x + (v1.x - v0.x) * colTMax,
                            y: v0.y + (v1.y - v0.y) * colTMax
                        };
                        const tr = {
                            x: v3.x + (v2.x - v3.x) * colTMax,
                            y: v3.y + (v2.y - v3.y) * colTMax
                        };
                        br.x = br.x + (tr.x - br.x) * rowTMin;
                        br.y = br.y + (tr.y - br.y) * rowTMin;
                        
                        // Top-left corner
                        tl.x = v0.x + (v1.x - v0.x) * colTMin;
                        tl.y = v0.y + (v1.y - v0.y) * colTMin;
                        const tl2 = {
                            x: v3.x + (v2.x - v3.x) * colTMin,
                            y: v3.y + (v2.y - v3.y) * colTMin
                        };
                        tl.x = tl.x + (tl2.x - tl.x) * rowTMax;
                        tl.y = tl.y + (tl2.y - tl.y) * rowTMax;
                        
                        // Top-right corner
                        tr.x = v0.x + (v1.x - v0.x) * colTMax;
                        tr.y = v0.y + (v1.y - v0.y) * colTMax;
                        const tr2 = {
                            x: v3.x + (v2.x - v3.x) * colTMax,
                            y: v3.y + (v2.y - v3.y) * colTMax
                        };
                        tr.x = tr.x + (tr2.x - tr.x) * rowTMax;
                        tr.y = tr.y + (tr2.y - tr.y) * rowTMax;
                        
                        if (mark === 1) {
                            // Draw X using diagonal lines in face space
                            c.strokeStyle = 'rgba(255, 100, 100, 0.9)';
                            c.lineWidth = 4;
                            c.beginPath();
                            c.moveTo(bl.x, bl.y);
                            c.lineTo(tr.x, tr.y);
                            c.moveTo(br.x, br.y);
                            c.lineTo(tl.x, tl.y);
                            c.stroke();
                        } else if (mark === 2) {
                            // Draw O using 8-point approximation in face space
                            c.strokeStyle = 'rgba(100, 100, 255, 0.9)';
                            c.lineWidth = 4;
                            c.beginPath();
                            
                            const numPoints = 16;
                            for (let i = 0; i <= numPoints; i++) {
                                const angle = (i / numPoints) * Math.PI * 2;
                                const localX = Math.cos(angle) * offset;
                                const localY = Math.sin(angle) * offset;
                                
                                const colTCircle = (col + 0.5 + localX) / 3;
                                const rowTCircle = (row + 0.5 + localY) / 3;
                                
                                const bCircle = {
                                    x: v0.x + (v1.x - v0.x) * colTCircle,
                                    y: v0.y + (v1.y - v0.y) * colTCircle
                                };
                                const tCircle = {
                                    x: v3.x + (v2.x - v3.x) * colTCircle,
                                    y: v3.y + (v2.y - v3.y) * colTCircle
                                };
                                const px = bCircle.x + (tCircle.x - bCircle.x) * rowTCircle;
                                const py = bCircle.y + (tCircle.y - bCircle.y) * rowTCircle;
                                
                                if (i === 0) {
                                    c.moveTo(px, py);
                                } else {
                                    c.lineTo(px, py);
                                }
                            }
                            c.stroke();
                        }
                    }
                }
            }
            
            // Draw text on one face - mapped flush to surface like tic-tac-toe
            const faceTexts = [
                { index: 5, text: "A STRANGE GAME", lines: ["A", "STRANGE", "GAME"] }  // right face - three lines
            ];
            
            faceTexts.forEach(({ index, text, lines }) => {
                const textFace = faces[index];
                const textFaceData = facesWithDepth.find(f => f.face === textFace);
                
                // Draw text regardless of face orientation
                if (textFaceData) {
                    const faceVerts = textFace.indices.map(idx => screenVerts[idx]);
                    const v0 = faceVerts[0]; // bottom-left
                    const v1 = faceVerts[1]; // bottom-right
                    const v2 = faceVerts[2]; // top-right
                    const v3 = faceVerts[3]; // top-left
                    
                    // Function to map face coordinates (0-1, 0-1) to screen position
                    const mapToFace = (u, v) => {
                        // Bottom edge interpolation
                        const bx = v0.x + (v1.x - v0.x) * u;
                        const by = v0.y + (v1.y - v0.y) * u;
                        // Top edge interpolation
                        const tx = v3.x + (v2.x - v3.x) * u;
                        const ty = v3.y + (v2.y - v3.y) * u;
                        // Vertical interpolation
                        return {
                            x: bx + (tx - bx) * v,
                            y: by + (ty - by) * v
                        };
                    };
                    
                    // Draw each line
                    lines.forEach((line, lineIndex) => {
                        const chars = line.split(''); // Don't reverse character order
                        const numChars = chars.length;
                        const totalWidth = numChars * 0.12; // Each char takes ~12% of face width
                        const startU = (1 - totalWidth) / 2; // Center horizontally
                        
                        // Calculate vertical position for three lines
                        let lineV;
                        if (lines.length === 3) {
                            lineV = [0.25, 0.5, 0.75][lineIndex]; // Top, middle, bottom
                        } else {
                            lineV = 0.5; // Center vertically
                        }
                        
                        for (let i = 0; i < numChars; i++) {
                            const char = chars[i];
                            if (char === ' ') continue;
                            
                            const charU = startU + i * 0.12 + 0.06; // Center of character
                            const charV = lineV;
                            
                            // Draw character using line segments mapped to face
                            c.strokeStyle = 'rgba(255, 255, 255, 0.95)';
                            c.lineWidth = 3;
                            c.lineCap = 'round';
                            c.lineJoin = 'round';
                            
                            // Define simple stroke patterns for each character
                            const strokes = this.getCharStrokes(char);
                            
                            strokes.forEach(stroke => {
                                c.beginPath();
                                stroke.forEach((point, idx) => {
                                    const u = charU + point.x * 0.08;
                                    const v = charV + point.y * 0.15;
                                    const pos = mapToFace(u, v);
                                    
                                    if (idx === 0) {
                                        c.moveTo(pos.x, pos.y);
                                    } else {
                                        c.lineTo(pos.x, pos.y);
                                    }
                                });
                                c.stroke();
                            });
                        }
                    });
                }
            });
        }
        
        getCharStrokes(char) {
            // Return stroke definitions for characters (simplified vector font)
            const strokes = {
                'W': [
                    [{x:-0.4,y:-0.5},{x:-0.2,y:0.5},{x:0,y:-0.2},{x:0.2,y:0.5},{x:0.4,y:-0.5}]
                ],
                'O': [
                    [{x:-0.3,y:-0.3},{x:0.3,y:-0.3},{x:0.3,y:0.3},{x:-0.3,y:0.3},{x:-0.3,y:-0.3}]
                ],
                'U': [
                    [{x:-0.3,y:-0.4},{x:-0.3,y:0.2},{x:-0.1,y:0.4},{x:0.1,y:0.4},{x:0.3,y:0.2},{x:0.3,y:-0.4}]
                ],
                'L': [
                    [{x:-0.2,y:-0.4},{x:-0.2,y:0.4},{x:0.3,y:0.4}]
                ],
                'D': [
                    [{x:-0.3,y:-0.4},{x:-0.3,y:0.4},{x:0.1,y:0.4},{x:0.3,y:0.2},{x:0.3,y:-0.2},{x:0.1,y:-0.4},{x:-0.3,y:-0.4}]
                ],
                'Y': [
                    [{x:-0.3,y:-0.4},{x:0,y:0}],
                    [{x:0.3,y:-0.4},{x:0,y:0},{x:0,y:0.4}]
                ],
                'I': [
                    [{x:0,y:-0.4},{x:0,y:0.4}]
                ],
                'K': [
                    [{x:-0.2,y:-0.4},{x:-0.2,y:0.4}],
                    [{x:0.3,y:-0.4},{x:-0.2,y:0},{x:0.3,y:0.4}]
                ],
                'E': [
                    [{x:0.2,y:-0.4},{x:-0.2,y:-0.4},{x:-0.2,y:0.4},{x:0.2,y:0.4}],
                    [{x:-0.2,y:0},{x:0.1,y:0}]
                ],
                'T': [
                    [{x:-0.3,y:-0.4},{x:0.3,y:-0.4}],
                    [{x:0,y:-0.4},{x:0,y:0.4}]
                ],
                'P': [
                    [{x:-0.2,y:0.4},{x:-0.2,y:-0.4},{x:0.2,y:-0.4},{x:0.3,y:-0.2},{x:0.3,y:0},{x:0.2,y:0.2},{x:-0.2,y:0.2}]
                ],
                'A': [
                    [{x:-0.3,y:0.4},{x:0,y:-0.4},{x:0.3,y:0.4}],
                    [{x:-0.2,y:0.1},{x:0.2,y:0.1}]
                ],
                'G': [
                    [{x:0.3,y:-0.2},{x:0.2,y:-0.4},{x:-0.2,y:-0.4},{x:-0.3,y:-0.2},{x:-0.3,y:0.2},{x:-0.2,y:0.4},{x:0.2,y:0.4},{x:0.3,y:0.2},{x:0.3,y:0},{x:0,y:0}]
                ],
                'M': [
                    [{x:-0.3,y:0.4},{x:-0.3,y:-0.4},{x:0,y:0},{x:0.3,y:-0.4},{x:0.3,y:0.4}]
                ],
                '?': [
                    [{x:-0.2,y:-0.2},{x:-0.2,y:-0.4},{x:0.2,y:-0.4},{x:0.2,y:-0.1},{x:0,y:0.1}],
                    [{x:0,y:0.3},{x:0,y:0.4}]
                ],
                'S': [
                    [{x:0.3,y:-0.3},{x:0.2,y:-0.4},{x:-0.2,y:-0.4},{x:-0.3,y:-0.3},{x:-0.2,y:-0.1},{x:0.2,y:0.1},{x:0.3,y:0.3},{x:0.2,y:0.4},{x:-0.2,y:0.4},{x:-0.3,y:0.3}]
                ],
                'N': [
                    [{x:-0.3,y:0.4},{x:-0.3,y:-0.4},{x:0.3,y:0.4},{x:0.3,y:-0.4}]
                ],
                'R': [
                    [{x:-0.2,y:0.4},{x:-0.2,y:-0.4},{x:0.2,y:-0.4},{x:0.3,y:-0.2},{x:0.3,y:0},{x:0.2,y:0.2},{x:-0.2,y:0.2}],
                    [{x:0,y:0.2},{x:0.3,y:0.4}]
                ]
            };
            
            return strokes[char] || []; // Return empty if character not defined
        }
    }

    //  PONG GAME  -----------------
    class PONG {
        constructor() {
            // Game area in simulation coordinates (bottom right corner)
            this.width = 0.85 * 0.7; // Game width in sim units (doubled from 0.35)
            this.height = 0.85 * 0.375; // Game height in sim units (50% taller: 0.25 * 1.5)
            this.padding = 0.05; // Fixed padding from edges
            this.updatePosition(); // Calculate initial position
            
            // Paddles
            this.paddleWidth = 0.0075;
            this.paddleHeight = 0.04;
            
            // Goal area (half height, centered)
            this.goalHeight = this.height * 0.5;
            this.goalTop = this.height * 0.25;
            this.goalBottom = this.goalTop + this.goalHeight;
            this.goalCenter = this.goalTop + this.goalHeight / 2;
            
            this.leftPaddleY = this.goalCenter;
            this.rightPaddleY = this.goalCenter;
            this.paddleSpeed = 0.004;
            
            // Ball
            this.ballSize = 0.012;
            this.ballX = this.width / 2;
            this.ballY = this.height / 2;
            this.ballVelX = 0.006;
            this.ballVelY = 0.004;
            
            // AI tracking
            this.leftPaddleTarget = this.ballY;
            this.rightPaddleTarget = this.ballY;
            
            // Scores
            this.leftScore = 0;
            this.rightScore = 0;
        }
        
        updatePosition() {
            // Recalculate position based on current simWidth/simHeight
            this.x = simWidth - this.width - this.padding;
            this.y = simHeight - this.height - this.padding;
        }
        
        simulate() {
            // Update position in case window was resized
            this.updatePosition();
            // Move ball
            this.ballX += this.ballVelX;
            this.ballY += this.ballVelY;
            
            // Bounce off top/bottom walls
            if (this.ballY - this.ballSize / 2 <= 0) {
                this.ballY = this.ballSize / 2;
                this.ballVelY = Math.abs(this.ballVelY);
            }
            if (this.ballY + this.ballSize / 2 >= this.height) {
                this.ballY = this.height - this.ballSize / 2;
                this.ballVelY = -Math.abs(this.ballVelY);
            }
            
            // Check paddle collisions
            const paddlePadding = 0.02;
            
            // Left paddle
            const leftPaddleX = paddlePadding;
            if (this.ballX - this.ballSize / 2 <= leftPaddleX + this.paddleWidth &&
                this.ballX - this.ballSize / 2 >= leftPaddleX &&
                this.ballY >= this.leftPaddleY - this.paddleHeight / 2 &&
                this.ballY <= this.leftPaddleY + this.paddleHeight / 2) {
                this.ballX = leftPaddleX + this.paddleWidth + this.ballSize / 2;
                this.ballVelX = Math.abs(this.ballVelX);
                // Add some variation to Y velocity based on where it hit the paddle
                const hitPos = (this.ballY - this.leftPaddleY) / (this.paddleHeight / 2);
                this.ballVelY += hitPos * 0.002;
            }
            
            // Right paddle
            const rightPaddleX = this.width - this.paddleWidth - paddlePadding;
            if (this.ballX + this.ballSize / 2 >= rightPaddleX &&
                this.ballX + this.ballSize / 2 <= rightPaddleX + this.paddleWidth &&
                this.ballY >= this.rightPaddleY - this.paddleHeight / 2 &&
                this.ballY <= this.rightPaddleY + this.paddleHeight / 2) {
                this.ballX = rightPaddleX - this.ballSize / 2;
                this.ballVelX = -Math.abs(this.ballVelX);
                // Add some variation to Y velocity
                const hitPos = (this.ballY - this.rightPaddleY) / (this.paddleHeight / 2);
                this.ballVelY += hitPos * 0.002;
            }
            
            // Check if ball goes out of bounds - only score if through goal area
            if (this.ballX < 0) {
                // Check if ball went through goal area
                if (this.ballY >= this.goalTop && this.ballY <= this.goalBottom) {
                    // Right player scores
                    this.rightScore++;
                    // Reset scores if either player passes 9
                    if (this.rightScore > 9) {
                        this.rightScore = 0;
                        this.leftScore = 0;
                    }
                } else {
                    // Ball hit wall outside goal - just bounce back
                    this.ballX = 0;
                    this.ballVelX = Math.abs(this.ballVelX);
                }
                // Reset ball position if scored
                if (this.ballX < 0) {
                    this.ballX = this.width / 2;
                    this.ballY = this.height / 2;
                    this.ballVelX = (Math.random() > 0.5 ? 1 : -1) * 0.006;
                    this.ballVelY = (Math.random() - 0.5) * 0.008;
                }
            } else if (this.ballX > this.width) {
                // Check if ball went through goal area
                if (this.ballY >= this.goalTop && this.ballY <= this.goalBottom) {
                    // Left player scores
                    this.leftScore++;
                    // Reset scores if either player passes 9
                    if (this.leftScore > 9) {
                        this.rightScore = 0;
                        this.leftScore = 0;
                    }
                } else {
                    // Ball hit wall outside goal - just bounce back
                    this.ballX = this.width;
                    this.ballVelX = -Math.abs(this.ballVelX);
                }
                // Reset ball position if scored
                if (this.ballX > this.width) {
                    this.ballX = this.width / 2;
                    this.ballY = this.height / 2;
                    this.ballVelX = (Math.random() > 0.5 ? 1 : -1) * 0.006;
                    this.ballVelY = (Math.random() - 0.5) * 0.008;
                }
            }
            
            // AI: paddles only track when ball is moving toward them
            const trackingSpeed = this.paddleSpeed * 1.2;
            const deadZone = 0.005; // Don't move if within this range
            
            // Left paddle AI - only track when ball is moving left
            if (this.ballVelX < 0) {
                if (this.leftPaddleY < this.ballY - deadZone) {
                    this.leftPaddleY += trackingSpeed;
                } else if (this.leftPaddleY > this.ballY + deadZone) {
                    this.leftPaddleY -= trackingSpeed;
                }
            }
            
            // Right paddle AI - only track when ball is moving right
            if (this.ballVelX > 0) {
                if (this.rightPaddleY < this.ballY - deadZone) {
                    this.rightPaddleY += trackingSpeed;
                } else if (this.rightPaddleY > this.ballY + deadZone) {
                    this.rightPaddleY -= trackingSpeed;
                }
            }
            
            // Keep paddles in bounds (allow half paddle length beyond goal opening)
            const paddleExtension = this.paddleHeight / 2;
            this.leftPaddleY = Math.max(this.goalTop - paddleExtension + this.paddleHeight / 2, 
                                        Math.min(this.goalBottom + paddleExtension - this.paddleHeight / 2, this.leftPaddleY));
            this.rightPaddleY = Math.max(this.goalTop - paddleExtension + this.paddleHeight / 2, 
                                         Math.min(this.goalBottom + paddleExtension - this.paddleHeight / 2, this.rightPaddleY));
        }
        
        // Draw seven-segment style digit (classic Pong look)
        drawDigit(digit, x, y, segWidth, segHeight) {
            // Seven segments: top, top-right, bottom-right, bottom, bottom-left, top-left, middle
            const segments = {
                0: [1,1,1,1,1,1,0],
                1: [0,1,1,0,0,0,0],
                2: [1,1,0,1,1,0,1],
                3: [1,1,1,1,0,0,1],
                4: [0,1,1,0,0,1,1],
                5: [1,0,1,1,0,1,1],
                6: [1,0,1,1,1,1,1],
                7: [1,1,1,0,0,0,0],
                8: [1,1,1,1,1,1,1],
                9: [1,1,1,1,0,1,1]
            };
            
            const segs = segments[digit] || [0,0,0,0,0,0,0];
            const gap = segWidth * 0.15;
            
            c.fillStyle = 'hsla(0, 0%, 90%, 0.9)';
            
            // Top
            if (segs[0]) c.fillRect(x + gap, y, segHeight, segWidth);
            // Top-right
            if (segs[1]) c.fillRect(x + gap + segHeight, y + gap, segWidth, segHeight);
            // Bottom-right
            if (segs[2]) c.fillRect(x + gap + segHeight, y + gap + segHeight + gap, segWidth, segHeight);
            // Bottom
            if (segs[3]) c.fillRect(x + gap, y + 2*gap + 2*segHeight, segHeight, segWidth);
            // Bottom-left
            if (segs[4]) c.fillRect(x, y + gap + segHeight + gap, segWidth, segHeight);
            // Top-left
            if (segs[5]) c.fillRect(x, y + gap, segWidth, segHeight);
            // Middle
            if (segs[6]) c.fillRect(x + gap, y + gap + segHeight, segHeight, segWidth);
        }
        
        draw() {
            c.save();

            // fill game border
            c.fillStyle = 'hsla(0, 0%, 0%, 0.8)';
            c.fillRect(
                (this.x) * cScale,
                (this.y) * cScale,
                this.width * cScale,
                this.height * cScale
            );
            
            // Draw game border with goal gaps (half height, centered vertically) 
            c.strokeStyle = 'hsla(0, 0%, 100%, 0.6)';
            c.lineWidth = 2;
            
            const goalHeight = this.height * 0.5; // Goal is half the height
            const goalTop = this.height * 0.25; // Centered vertically
            const goalBottom = goalTop + goalHeight;
            
            c.beginPath();
            // Top border (full width)
            c.moveTo(this.x * cScale, this.y * cScale);
            c.lineTo((this.x + this.width) * cScale, this.y * cScale);
            
            // Bottom border (full width)
            c.moveTo(this.x * cScale, (this.y + this.height) * cScale);
            c.lineTo((this.x + this.width) * cScale, (this.y + this.height) * cScale);
            
            // Left border segments (top and bottom, with gap in middle)
            c.moveTo(this.x * cScale, this.y * cScale);
            c.lineTo(this.x * cScale, (this.y + goalTop) * cScale);
            c.moveTo(this.x * cScale, (this.y + goalBottom) * cScale);
            c.lineTo(this.x * cScale, (this.y + this.height) * cScale);
            
            // Right border segments (top and bottom, with gap in middle)
            c.moveTo((this.x + this.width) * cScale, this.y * cScale);
            c.lineTo((this.x + this.width) * cScale, (this.y + goalTop) * cScale);
            c.moveTo((this.x + this.width) * cScale, (this.y + goalBottom) * cScale);
            c.lineTo((this.x + this.width) * cScale, (this.y + this.height) * cScale);
            c.stroke();
            
            // Draw center line (dashed)
            c.setLineDash([5, 5]);
            c.strokeStyle = 'hsla(0, 0%, 100%, 0.5)';
            c.lineWidth = 1;
            c.beginPath();
            c.moveTo((this.x + this.width / 2) * cScale, this.y * cScale);
            c.lineTo((this.x + this.width / 2) * cScale, (this.y + this.height) * cScale);
            c.stroke();
            c.setLineDash([]);
            
            // Draw left paddle
            c.fillStyle = 'hsla(0, 0%, 100%, 0.9)';
            const paddlePadding = 0.02; // Distance from edge
            c.fillRect(
                (this.x + paddlePadding) * cScale,
                (this.y + this.leftPaddleY - this.paddleHeight / 2) * cScale,
                this.paddleWidth * cScale,
                this.paddleHeight * cScale
            );
            
            // Draw right paddle
            c.fillStyle = 'hsla(0, 0%, 100%, 0.9)';
            c.fillRect(
                (this.x + this.width - this.paddleWidth - paddlePadding) * cScale,
                (this.y + this.rightPaddleY - this.paddleHeight / 2) * cScale,
                this.paddleWidth * cScale,
                this.paddleHeight * cScale
            );
            
            // Draw ball (square)
            c.fillStyle = 'hsla(0, 0%, 100%, 0.95)';
            c.fillRect(
                (this.x + this.ballX - this.ballSize / 2) * cScale,
                (this.y + this.ballY - this.ballSize / 2) * cScale,
                this.ballSize * cScale,
                this.ballSize * cScale
            );
            
            // Draw scores with seven-segment display style
            const digitSegWidth = 3.0;
            const digitSegHeight = 10.8;
            const digitWidth = digitSegHeight + digitSegWidth * 2;
            
            // Left score (closer to center)
            const leftX = (this.x + this.width * 0.4) * cScale - digitWidth / 2;
            const leftY = (this.y + 0.015) * cScale;
            this.drawDigit(this.leftScore, leftX, leftY, digitSegWidth, digitSegHeight);
            
            // Right score (closer to center)
            const rightX = (this.x + this.width * 0.6) * cScale - digitWidth / 2;
            const rightY = (this.y + 0.015) * cScale;
            this.drawDigit(this.rightScore, rightX, rightY, digitSegWidth, digitSegHeight);
            
            c.restore();
        }
    }

    //  DRAW GLOBE ROIDS  --------------------
    function drawGlobeRoid(cx, cy, radius, originalRadius, hue, saturation, lightness, spinAngle = 0, orientation = {w:1,x:0,y:0,z:0}) {
        // Parametric globe-style globe (latitude & longitude) with front-hemisphere clipping
        c.save();
        
        // line width scales with roid size (radius is in pixels already)
        c.lineWidth = 0.02 * radius;
        c.strokeStyle = `hsl(${hue}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
        c.lineCap = 'round';

        // Use orthographic projection with equal X/Y scale so circles remain circular
        const verticalSquash = 1.0;
        // Helper: project 3D point (x,y,z) to screen (no non-uniform squash)
        function project(x, y, z) {
            const sx = cx + x;
            const sy = cy - y; // invert Y to canvas coords
            return { x: sx, y: sy, z: z };
        }

        // rotate by yaw (around Z), pitch (around X), roll (around Y)
        const spin = spinAngle || 0;

        function rotatePoint(x, y, z) {
            return quatRotateVec(orientation, x, y, z);
        }

        // Latitudes: Draw back-facing first (faint), then front-facing (bright)  ----------
        const latStep = 20; 
        const maxLat = 60;  
        const latDegrees = [0];
        for (let d = latStep; d <= maxLat; d += latStep) {
            latDegrees.push(d, -d);
        }
        
        // BACK HEMISPHERE - faint lines
        c.save();
        c.lineWidth = 0.015 * radius;
        c.strokeStyle = `hsla(${hue}, ${Math.round(saturation)}%, ${Math.round(Math.max(20, lightness - 10))}%, 0.6)`;
        for (let li = 0; li < latDegrees.length; li++) {
            const phi = latDegrees[li] * Math.PI / 180;
            const rLat = radius * Math.cos(phi);
            const z0 = radius * Math.sin(phi);
            const steps = 96;
            c.beginPath();
            let hasBack = false;
            for (let s = 0; s <= steps; s++) {
                const theta = (s / steps) * 2 * Math.PI + spin;
                const x0 = rLat * Math.cos(theta);
                const y0 = rLat * Math.sin(theta);
                const rot = rotatePoint(x0, y0, z0);
                const p = project(rot.x, rot.y, rot.z);
                
                // Only draw if facing away (z < 0)
                if (rot.z < 0) {
                    if (!hasBack) {
                        c.moveTo(p.x, p.y);
                        hasBack = true;
                    } else {
                        c.lineTo(p.x, p.y);
                    }
                } else if (hasBack) {
                    // Start new path segment when transitioning front/back
                    c.stroke();
                    c.beginPath();
                    hasBack = false;
                }
            }
            if (hasBack) c.stroke();
        }
        c.restore();
        
        // FRONT HEMISPHERE - bright lines
        c.save();
        c.lineWidth = 0.02 * radius;
        c.strokeStyle = `hsl(${hue}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
        for (let li = 0; li < latDegrees.length; li++) {
            const phi = latDegrees[li] * Math.PI / 180;
            const rLat = radius * Math.cos(phi);
            const z0 = radius * Math.sin(phi);
            const steps = 96;
            c.beginPath();
            let hasFront = false;
            for (let s = 0; s <= steps; s++) {
                const theta = (s / steps) * 2 * Math.PI + spin;
                const x0 = rLat * Math.cos(theta);
                const y0 = rLat * Math.sin(theta);
                const rot = rotatePoint(x0, y0, z0);
                const p = project(rot.x, rot.y, rot.z);
                
                // Only draw if facing forward (z >= 0)
                if (rot.z >= 0) {
                    if (!hasFront) {
                        c.moveTo(p.x, p.y);
                        hasFront = true;
                    } else {
                        c.lineTo(p.x, p.y);
                    }
                } else if (hasFront) {
                    c.stroke();
                    c.beginPath();
                    hasFront = false;
                }
            }
            if (hasFront) c.stroke();
        }
        c.restore();

        // Longitudes: Draw back-facing first (faint), then front-facing (bright)  ----------
        const numLong = 12;
        const phiSteps = 80;
        
        // BACK HEMISPHERE - faint lines
        c.save();
        c.lineWidth = 0.015 * radius;
        c.strokeStyle = `hsla(${hue}, ${Math.round(saturation)}%, ${Math.round(Math.max(20, lightness - 10))}%, 0.6)`;
        for (let k = 0; k < numLong; k++) {
            const lambda = (k / numLong) * 2 * Math.PI + spin;
            c.beginPath();
            let hasBack = false;
            for (let pi = 0; pi <= phiSteps; pi++) {
                const phi = (-0.5 + pi / phiSteps) * Math.PI;
                const x0 = radius * Math.cos(phi) * Math.cos(lambda);
                const y0 = radius * Math.cos(phi) * Math.sin(lambda);
                const z0 = radius * Math.sin(phi);
                const rot = rotatePoint(x0, y0, z0);
                const p = project(rot.x, rot.y, rot.z);
                
                // Only draw if facing away (z < 0)
                if (rot.z < 0) {
                    if (!hasBack) {
                        c.moveTo(p.x, p.y);
                        hasBack = true;
                    } else {
                        c.lineTo(p.x, p.y);
                    }
                } else if (hasBack) {
                    c.stroke();
                    c.beginPath();
                    hasBack = false;
                }
            }
            if (hasBack) c.stroke();
        }
        c.restore();
        
        // FRONT HEMISPHERE - bright lines
        c.save();
        c.lineWidth = 0.02 * radius;
        c.strokeStyle = `hsl(${hue}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
        for (let k = 0; k < numLong; k++) {
            const lambda = (k / numLong) * 2 * Math.PI + spin;
            c.beginPath();
            let hasFront = false;
            for (let pi = 0; pi <= phiSteps; pi++) {
                const phi = (-0.5 + pi / phiSteps) * Math.PI;
                const x0 = radius * Math.cos(phi) * Math.cos(lambda);
                const y0 = radius * Math.cos(phi) * Math.sin(lambda);
                const z0 = radius * Math.sin(phi);
                const rot = rotatePoint(x0, y0, z0);
                const p = project(rot.x, rot.y, rot.z);
                
                // Only draw if facing forward (z >= 0)
                if (rot.z >= 0) {
                    if (!hasFront) {
                        c.moveTo(p.x, p.y);
                        hasFront = true;
                    } else {
                        c.lineTo(p.x, p.y);
                    }
                } else if (hasFront) {
                    c.stroke();
                    c.beginPath();
                    hasFront = false;
                }
            }
            if (hasFront) c.stroke();
        }
        c.restore();

        // Draw outer circle mask to hide arc ends at the edge
        c.save();
        c.lineWidth = 0.03 * radius;
        c.strokeStyle = `hsl(${hue}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
        c.beginPath();
        c.arc(cx, cy, radius, 0, 2 * Math.PI);
        c.stroke();
        c.restore();

        /*// Apply 3D shading overlay - radial gradient lit from upper left
        c.save();
        const lightOffsetX = -radius * 0.35;
        const lightOffsetY = -radius * 0.55;
        const gradient = c.createRadialGradient(
            cx + lightOffsetX, cy + lightOffsetY, radius * 0.1,
            cx, cy, radius
        );
        // Use the sphere's own color for shading (lighter on top-left, darker on bottom-right)
        const brightL = Math.min(95, lightness + 35);
        const darkL = Math.max(10, lightness - 35);
        gradient.addColorStop(0, `hsla(${hue}, ${Math.round(saturation)}%, ${brightL}%, 0.4)`); // Bright highlight
        gradient.addColorStop(0.4, `hsla(${hue}, ${Math.round(saturation)}%, ${lightness}%, 0)`); // Fade to transparent
        gradient.addColorStop(0.7, `hsla(${hue}, ${Math.round(saturation)}%, ${lightness}%, 0)`); // Transparent midtone
        gradient.addColorStop(1, `hsla(${hue}, ${Math.round(saturation)}%, ${darkL}%, 0.5)`); // Dark shadow at edge
        
        c.fillStyle = gradient;
        c.beginPath();
        c.arc(cx, cy, radius, 0, 2 * Math.PI);
        c.fill();
        c.restore();*/
    }

    function drawOrbiter(radius, centerPos, orientation, orbitAngle) {
        // Draw orbiting ball around equator
        const orbitRadius = radius * 2.5; // Slightly outside the globe
        const baseBallRadius = radius * 0.35; // Base ball size
        
        // Calculate 3D position on equator (z=0 plane)
        const ballX0 = orbitRadius * Math.cos(orbitAngle);
        const ballY0 = orbitRadius * Math.sin(orbitAngle);
        const ballZ0 = 0; // On equator
        
        // Rotate the ball position with the globe's orientation
        const rotBall = quatRotateVec(orientation, ballX0, ballY0, ballZ0);
        
        // Scale based on z-position (perspective effect)
        // When z > 0 (toward viewer), scale up; when z < 0 (away from viewer), scale down
        // Normalize z by orbit radius to get a reasonable scale factor
        const zNormalized = rotBall.z / orbitRadius; // Range approximately -1 to 1
        const scaleFactor = 1.0 + zNormalized * 0.3; // Scale from 0.7x to 1.3x
        const ballRadius = baseBallRadius * scaleFactor;
        
        // Project to 2D screen space
        const ballScreenX = (centerPos.x + rotBall.x) * cScale;
        const ballScreenY = (centerPos.y - rotBall.y) * cScale; // Invert Y
        
        // Draw the orbiting ball with spherical shading
        const ballPixelRadius = ballRadius * cScale;
        
        // Return position info for shadow calculation
        return { screenX: ballScreenX, screenY: ballScreenY, pixelRadius: ballPixelRadius, worldPos: rotBall, scaleFactor: scaleFactor };
    }
    
    function drawOrbiterBall(ballScreenX, ballScreenY, ballPixelRadius) {
        // Sphere gradient for the ball
        const ballGradient = c.createRadialGradient(
            ballScreenX - ballPixelRadius * 0.3,
            ballScreenY - ballPixelRadius * 0.4,
            0,
            ballScreenX,
            ballScreenY,
            1.1 * ballPixelRadius
        );

        /*ballGradient.addColorStop(0, 'hsl(320, 80%, 80%)');
        ballGradient.addColorStop(0.3, 'hsl(320, 80%, 60%)');
        ballGradient.addColorStop(0.7, 'hsl(320, 80%, 30%)');
        ballGradient.addColorStop(1, 'hsl(320, 60%, 10%)');*/

        ballGradient.addColorStop(0, 'hsl(320, 80%, 70%)');
        ballGradient.addColorStop(0.3, 'hsl(320, 80%, 40%)');
        ballGradient.addColorStop(0.7, 'hsl(320, 80%, 15%)');
        ballGradient.addColorStop(1, 'hsl(320, 60%, 5%)');
        
        c.beginPath();
        c.arc(ballScreenX, ballScreenY, ballPixelRadius, 0, 2 * Math.PI);
        c.fillStyle = ballGradient;
        c.fill();
    }
    
    function drawPolarOrbiter(radius, centerPos, orientation, polarOrbitAngle, polarOrbitRadius) {
        // Polar orbit: a great circle passing through both poles
        // Testing: use Y as polar axis (since sy = cy - y suggests -Y is up on screen)
        // Orbit in Y-Z plane
        const orbitDist = radius * polarOrbitRadius;
        
        // Circular orbit in Y-Z plane
        const localX = 0;
        const localY = orbitDist * Math.sin(polarOrbitAngle);  // polar axis
        const localZ = orbitDist * Math.cos(polarOrbitAngle);
        // When angle=0°: (0, 0, orbitDist)
        // When angle=90°: (0, orbitDist, 0) - at NORTH POLE
        // When angle=180°: (0, 0, -orbitDist)
        // When angle=270°: (0, -orbitDist, 0) - at SOUTH POLE
        
        // Rotate by globe orientation
        const rotated = quatRotateVec(orientation, localX, localY, localZ);
        
        // Translate to globe position
        const worldX = rotated.x + centerPos.x;
        const worldY = rotated.y + centerPos.y;
        const worldZ = rotated.z;
        
        // Project to screen
        const perspective = 800 / (800 + worldZ);
        const screenX = worldX * cScale * perspective;
        const screenY = worldY * cScale * perspective;
        
        // Small orbiter size
        const baseSize = radius * 0.1;
        const pixelRadius = baseSize * cScale * perspective;
        
        // Draw small spherically-shaded ball
        const ballGradient = c.createRadialGradient(
            screenX - pixelRadius * 0.3,
            screenY - pixelRadius * 0.4,
            0,
            screenX,
            screenY,
            1.1 * pixelRadius
        );
        
        ballGradient.addColorStop(0, 'hsl(275, 30%, 100%)');
        ballGradient.addColorStop(0.3, 'hsl(275, 30%, 65%)');
        ballGradient.addColorStop(0.7, 'hsl(275, 30%, 25%)');
        ballGradient.addColorStop(1, 'hsl(275, 30%, 10%)');
        
        c.beginPath();
        c.arc(screenX, screenY, pixelRadius, 0, 2 * Math.PI);
        c.fillStyle = ballGradient;
        c.fill();
    }
    
    function drawSubOrbiterShadow(mainOrbiterScreenX, mainOrbiterScreenY, mainOrbiterPixelRadius, 
                                   subOrbiterScreenX, subOrbiterScreenY, subOrbiterPixelRadius,
                                   subOrbiterWorldZ, mainOrbiterWorldZ) {
        // Only draw shadow if sub-orbiter is behind main orbiter
        if (subOrbiterWorldZ >= mainOrbiterWorldZ) return;
        
        // Calculate shadow position on main orbiter surface
        const dx = subOrbiterScreenX - mainOrbiterScreenX;
        const dy = subOrbiterScreenY - mainOrbiterScreenY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Only draw shadow if sub-orbiter is reasonably close
        if (distance > mainOrbiterPixelRadius * 4) return;
        
        // Shadow is centered on the main orbiter, not offset
        const shadowCenterX = mainOrbiterScreenX;
        const shadowCenterY = mainOrbiterScreenY;
        
        // Calculate shadow size - larger and softer the farther away
        const depthFactor = Math.abs(subOrbiterWorldZ - mainOrbiterWorldZ) * 0.02;
        const shadowRadius = subOrbiterPixelRadius * (1.5 + depthFactor);
        
        // Draw shadow as a simple dark circular gradient at the center
        c.save();
        c.globalCompositeOperation = 'multiply';
        
        const shadowGradient = c.createRadialGradient(
            shadowCenterX, shadowCenterY, 0,
            shadowCenterX, shadowCenterY, shadowRadius
        );
        shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
        shadowGradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.6)');
        shadowGradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.3)');
        shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        c.fillStyle = shadowGradient;
        c.beginPath();
        c.arc(shadowCenterX, shadowCenterY, shadowRadius, 0, 2 * Math.PI);
        c.fill();
        c.restore();
    }

    function drawSubOrbiter(radius, centerPos, orientation, orbitAngle, subOrbitAngle, subOrbitDistanceMultiplier, orbiterScaleFactor) {
        const info = getSubOrbiterPosition(radius, centerPos, orientation, orbitAngle, subOrbitAngle, subOrbitDistanceMultiplier, orbiterScaleFactor);
        drawSubOrbiterBall(info.screenX, info.screenY, info.pixelRadius);
    }
    
    function getSubOrbiterPosition(radius, centerPos, orientation, orbitAngle, subOrbitAngle, subOrbitDistanceMultiplier, orbiterScaleFactor) {
        // Calculate smaller orbiter that orbits around the main orbiter
        const orbitRadius = radius * 2.5;
        const subOrbitRadius = radius * 0.15 * subOrbitDistanceMultiplier * orbiterScaleFactor; // Orbit radius scales with main orbiter
        const baseBallRadius = radius * 0.12 * orbiterScaleFactor; // Size scales with main orbiter
        
        // Calculate main orbiter position (this is the radial vector from globe center)
        const ballX0 = orbitRadius * Math.cos(orbitAngle);
        const ballY0 = orbitRadius * Math.sin(orbitAngle);
        const ballZ0 = 0;
        
        // Normalize the radial vector to get the direction from globe center to orbiter
        const radialLength = Math.sqrt(ballX0 * ballX0 + ballY0 * ballY0 + ballZ0 * ballZ0);
        const radialX = ballX0 / radialLength;
        const radialY = ballY0 / radialLength;
        const radialZ = ballZ0 / radialLength;
        
        // Create orbital plane perpendicular to radial vector
        // Use Z-axis as reference to find perpendicular vectors
        // First perpendicular vector (in the plane perpendicular to radial)
        let perp1X, perp1Y, perp1Z;
        if (Math.abs(radialZ) < 0.9) {
            // Cross product with Z axis
            perp1X = -radialY;
            perp1Y = radialX;
            perp1Z = 0;
        } else {
            // Cross product with X axis if radial is too close to Z
            perp1X = 0;
            perp1Y = -radialZ;
            perp1Z = radialY;
        }
        const perp1Length = Math.sqrt(perp1X * perp1X + perp1Y * perp1Y + perp1Z * perp1Z);
        perp1X /= perp1Length;
        perp1Y /= perp1Length;
        perp1Z /= perp1Length;
        
        // Second perpendicular vector (cross product of radial and perp1)
        const perp2X = radialY * perp1Z - radialZ * perp1Y;
        const perp2Y = radialZ * perp1X - radialX * perp1Z;
        const perp2Z = radialX * perp1Y - radialY * perp1X;
        
        // Calculate sub-orbiter position in the plane perpendicular to radial vector
        const cosAngle = Math.cos(subOrbitAngle);
        const sinAngle = Math.sin(subOrbitAngle);
        const subX0 = subOrbitRadius * (perp1X * cosAngle + perp2X * sinAngle);
        const subY0 = subOrbitRadius * (perp1Y * cosAngle + perp2Y * sinAngle);
        const subZ0 = subOrbitRadius * (perp1Z * cosAngle + perp2Z * sinAngle);
        
        // Position relative to main orbiter
        const subBallX = ballX0 + subX0;
        const subBallY = ballY0 + subY0;
        const subBallZ = ballZ0 + subZ0;
        
        // Rotate the sub-orbiter position with the globe's orientation
        const rotSubBall = quatRotateVec(orientation, subBallX, subBallY, subBallZ);
        
        // Use the main orbiter's scale factor (already passed in and applied to sizes)
        // No additional scaling needed - the assembly scales as one unit
        const ballRadius = baseBallRadius;
        
        // Project to 2D screen space
        const ballScreenX = (centerPos.x + rotSubBall.x) * cScale;
        const ballScreenY = (centerPos.y - rotSubBall.y) * cScale;
        
        // Return position info
        const ballPixelRadius = ballRadius * cScale;
        return { screenX: ballScreenX, screenY: ballScreenY, pixelRadius: ballPixelRadius, worldPos: rotSubBall };
    }
    
    function getSubOrbiterPosition2(radius, centerPos, orientation, orbitAngle, subOrbitAngle, subOrbitDistanceMultiplier, orbiterScaleFactor) {
        // Calculate smaller orbiter on perpendicular orbital plane (parallel to radial vector)
        const orbitRadius = radius * 2.5;
        const subOrbitRadius = radius * 0.15 * subOrbitDistanceMultiplier * orbiterScaleFactor; // Orbit radius scales with main orbiter
        const baseBallRadius = radius * 0.12 * orbiterScaleFactor; // Size scales with main orbiter
        
        // Calculate main orbiter position (radial vector from globe center)
        const ballX0 = orbitRadius * Math.cos(orbitAngle);
        const ballY0 = orbitRadius * Math.sin(orbitAngle);
        const ballZ0 = 0;
        
        // Normalize the radial vector
        const radialLength = Math.sqrt(ballX0 * ballX0 + ballY0 * ballY0 + ballZ0 * ballZ0);
        const radialX = ballX0 / radialLength;
        const radialY = ballY0 / radialLength;
        const radialZ = ballZ0 / radialLength;
        
        // Create orbital plane parallel to radial vector (perpendicular to first ring)
        // This plane contains the radial vector as one axis
        // Use Z-axis as reference to find perpendicular vector
        let perpX, perpY, perpZ;
        if (Math.abs(radialZ) < 0.9) {
            // Cross product with Z axis
            perpX = -radialY;
            perpY = radialX;
            perpZ = 0;
        } else {
            // Cross product with X axis if radial is too close to Z
            perpX = 0;
            perpY = -radialZ;
            perpZ = radialY;
        }
        const perpLength = Math.sqrt(perpX * perpX + perpY * perpY + perpZ * perpZ);
        perpX /= perpLength;
        perpY /= perpLength;
        perpZ /= perpLength;
        
        // Phase offset to prevent orbital intersections - 45 degrees places balls between first ring's positions
        const phaseOffset = Math.PI / 4; // 45 degrees offset for 4-ball configuration (halfway between 90-degree spacing)
        
        // Calculate sub-orbiter position using radial and perpendicular vectors
        const cosAngle = Math.cos(subOrbitAngle + phaseOffset);
        const sinAngle = Math.sin(subOrbitAngle + phaseOffset);
        const subX0 = subOrbitRadius * (radialX * cosAngle + perpX * sinAngle);
        const subY0 = subOrbitRadius * (radialY * cosAngle + perpY * sinAngle);
        const subZ0 = subOrbitRadius * (radialZ * cosAngle + perpZ * sinAngle);
        
        // Position relative to main orbiter
        const subBallX = ballX0 + subX0;
        const subBallY = ballY0 + subY0;
        const subBallZ = ballZ0 + subZ0;
        
        // Rotate the sub-orbiter position with the globe's orientation
        const rotSubBall = quatRotateVec(orientation, subBallX, subBallY, subBallZ);
        
        // Use the main orbiter's scale factor (already passed in and applied to sizes)
        // No additional scaling needed - the assembly scales as one unit
        const ballRadius = baseBallRadius;
        
        // Project to 2D screen space
        const ballScreenX = (centerPos.x + rotSubBall.x) * cScale;
        const ballScreenY = (centerPos.y - rotSubBall.y) * cScale;
        
        // Return position info
        const ballPixelRadius = ballRadius * cScale;
        return { screenX: ballScreenX, screenY: ballScreenY, pixelRadius: ballPixelRadius, worldPos: rotSubBall };
    }
    
    function drawSubOrbiterBall(ballScreenX, ballScreenY, ballPixelRadius, hue = 200) {
        // Sphere gradient for the sub-orbiter with variable hue
        const ballGradient = c.createRadialGradient(
            ballScreenX - ballPixelRadius * 0.3,
            ballScreenY - ballPixelRadius * 0.4,
            0,
            ballScreenX,
            ballScreenY,
            1.1 * ballPixelRadius
        );
        ballGradient.addColorStop(0, `hsl(${hue}, 80%, 60%)`);
        ballGradient.addColorStop(0.3, `hsl(${hue}, 80%, 50%)`);
        ballGradient.addColorStop(0.7, `hsl(${hue}, 80%, 20%)`);
        ballGradient.addColorStop(1, `hsl(${hue}, 60%, 5%)`);
        
        c.beginPath();
        c.arc(ballScreenX, ballScreenY, ballPixelRadius, 0, 2 * Math.PI);
        c.fillStyle = ballGradient;
        c.fill();
    }

    //  SPAWN ROIDS  ------------------------------------------------------------
    function spawnRoid() {
        var radius = 0.4;
        var pos = new Vector2(0.85 * simWidth, 0.3 * simHeight);
        //var pos = new Vector2(0.7 * simWidth, 0.5 * simHeight);
        var vel = new Vector2(0, 0);
        //var hue = Math.floor(Math.random() * 360);
        var hue = 70;
        var saturation = 60 + 30 * Math.random(); // 60-90% for vibrant colors
        var lightness = 40; // 45-60% to avoid white/pale colors
        let seed = Math.floor(Math.random() * 0xFFFFFFFF);
        let randomNo = Math.random();
        let yaw = Math.random() * 2 * Math.PI;
        let pitch = Math.random() * 2 * Math.PI; // -pi/2 .. +pi/2
        let roll = Math.random() * 2 * Math.PI;
                
        Roid.push(new ROID(pos, vel, radius, hue, saturation, lightness, randomNo, yaw, pitch, roll));   
    }

    //  SPAWN CUBE  ------------------------------------------------------------
    function spawnCube() {
        var size = 0.1; // Half-size of cube
        var pos = new Vector2(2 * size, simHeight - 2 * size); // Center of screen
        Cube = new CUBE(pos, size);
    }

    //  SPAWN PONG GAME  ------------------------------------------------------------
    function spawnPong() {
        PongGame = new PONG();
    }

    //  NODE CLASS  -------------------
    class NODE { 
        constructor(pos, angle, color, speed, direction) {
            this.pos = pos.clone();
            this.angle = angle;
            this.color = color;
            this.speed = speed;
            this.direction = direction;
            this.trail = [];
            this.maxTrailLength = 30;
            this.trailMinDistance = 0.001;
        }
        simulate() {
            this.angle += .05 * this.direction * this.speed;
            if (this.direction > 0 && this.angle > 2 * Math.PI) {
                this.angle -= 2 * Math.PI;
            }
            if (this.direction < 0 && this.angle < 0) {
                this.angle += 2 * Math.PI;
            }

            var lobeId = 5;
            f += 0.000001 * this.speed * this.direction;
            
            // Pre-calculate trig values to avoid redundant calculations
            const angleDirection = this.angle * this.direction;
            const fPlusAngle = f + this.angle;
            const lobeFPlusAngle = lobeId * fPlusAngle;
            
            const cosAngleDirection = Math.cos(angleDirection);
            const sinAngle = Math.sin(this.angle);
            const cosLobeFPlusAngle = Math.cos(lobeFPlusAngle);
            const cosFPlusAngle = Math.cos(fPlusAngle);
            const sinFPlusAngle = Math.sin(fPlusAngle);
            
            const lobeEffect = 0.008 * cosLobeFPlusAngle;
            
            this.pos.x += 0.002 * cosAngleDirection + lobeEffect * cosFPlusAngle;
            this.pos.y += 0.001 * sinAngle + lobeEffect * sinFPlusAngle;
            
            // Add current position to trail
            this.addToTrail();
        }
        addToTrail() {
            // Only add if moved enough distance from last trail point
            if (this.trail.length === 0) {
                this.trail.push(this.pos.clone());
            } else {
                const lastPos = this.trail[this.trail.length - 1];
                const dx = this.pos.x - lastPos.x;
                const dy = this.pos.y - lastPos.y;
                const distSquared = dx * dx + dy * dy;
                
                if (distSquared > this.trailMinDistance * this.trailMinDistance) {
                    this.trail.push(this.pos.clone());
                    
                    // Keep trail at max length
                    if (this.trail.length > this.maxTrailLength) {
                        this.trail.shift();
                    }
                }
            }
        }
    }

    //  GENERATE NODE ARRAY ------------------
    function spawnNodes() {
        // right side
        for (i = 0; i < 20; i++) {
            var radius = 0.1 * simHeight + 0.5 * simHeight * Math.random();
            var angle = 2 * Math.PI * Math.random();
            var color = `hsl(${Math.random() * 360}, 30%, 50%)`;
            var speed = 0.4 * Math.random();
            if (Math.random() < 0.50) {
                var direction = 1;
            } else {
                var direction = -1;
            }
            PrimaryNodes.push(new NODE(
                new Vector2(
                    0.7 * simWidth + radius * Math.cos(angle), 
                    0.5 * simHeight + radius * Math.sin(angle)), 
                2 * Math.PI * Math.random(),
                color,
                speed,
                direction));
        }

        //  left side
        for (i = 0; i < 20; i++) {
            var radius = 0.1 * simHeight + 0.5 * simHeight * Math.random();
            var angle = 2 * Math.PI * Math.random();
            var color = `hsl(${Math.random() * 360}, 30%, 50%)`;
            var speed = .1 + .4 * Math.random();
            if (Math.random() < 0.50) {
                direction = 1;
            } else {
                direction = -1;
            }
            SecondaryNodes.push(new NODE(
                new Vector2(
                    0.1 * simWidth + radius * Math.cos(angle), 
                    0.5 * simHeight + radius * Math.sin(angle)), 
                2 * Math.PI * Math.random(),
                color,
                speed,
                direction));
        }
    }

    function drawPrimaryNodes() {
        // Draw trails for primary nodes
        for (i = 0; i < PrimaryNodes.length; i++) {
            const node = PrimaryNodes[i];
            if (node.trail.length > 1) {
                c.lineCap = 'round';
                c.lineJoin = 'round';
                
                for (let j = 1; j < node.trail.length; j++) {
                    const alpha = j / node.trail.length;
                    c.strokeStyle = `hsla(210, 70%, 60%, ${alpha * 0.1})`;
                    c.lineWidth = 2 + 25 * alpha;
                    
                    c.beginPath();
                    c.moveTo(node.trail[j - 1].x * cScale, node.trail[j - 1].y * cScale);
                    c.lineTo(node.trail[j].x * cScale, node.trail[j].y * cScale);
                    c.stroke();
                }
            }
        }

        // Collect all connections with their distances for sorting
        let primaryConnections = [];

        // Collect connections between primary nodes (right side)
        for (i = 0; i < PrimaryNodes.length; i++) {
            node1 = PrimaryNodes[i];
            for (j = i + 1; j < PrimaryNodes.length; j++) {
                node2 = PrimaryNodes[j];
                const invDistance = measureDistAndShade(node1, node2);
                primaryConnections.push({
                    node1: node1,
                    node2: node2,
                    invDistance: invDistance
                });
            }  
        }

        // Sort connections: large invDistance (close) = draw last, small invDistance (far) = draw first
        primaryConnections.sort((a, b) => a.invDistance - b.invDistance);
        
        // Draw primary connections from farthest to closest
        for (let conn of primaryConnections) {
            c.beginPath();
            c.moveTo(conn.node1.pos.x * cScale, conn.node1.pos.y * cScale);
            c.lineTo(conn.node2.pos.x * cScale, conn.node2.pos.y * cScale);
            if (conn.invDistance * 20 < 60) {
                var lineLite = conn.invDistance * 20;
            } else {
                var lineLite = 60;
            }
            c.strokeStyle = `hsla(${180 + 3 * lineLite}, 50%, ${lineLite}%, ${lineLite + 20}%)`;
            c.lineWidth = Math.min(4 * conn.invDistance, 4);
            c.stroke();
        }
            
        // Draw primary nodes with spherical shading
        for (i = 0; i < PrimaryNodes.length; i++) {
            node1 = PrimaryNodes[i];
            const x = node1.pos.x * cScale;
            const y = node1.pos.y * cScale;
            const radius = 0.03 * cScale;
            
            // Create radial gradient for 3D sphere effect
            const gradient = c.createRadialGradient(
                x - radius * 0.3, y - radius * 0.3, radius * 0.1,
                x, y, radius
            );
            gradient.addColorStop(0, 'hsl(210, 70%, 85%)');
            gradient.addColorStop(0.3, 'hsl(210, 70%, 60%)');
            gradient.addColorStop(0.7, 'hsl(210, 70%, 40%)');
            gradient.addColorStop(1, 'hsl(210, 70%, 20%)');
            
            drawCircle(x, y, radius);
            c.fillStyle = gradient;
            c.fill();   
        }
    }

    function drawSecondaryNodes() { 
        // Draw trails for secondary nodes
        for (i = 0; i < SecondaryNodes.length; i++) {
            const node = SecondaryNodes[i];
            if (node.trail.length > 1) {
                c.lineCap = 'round';
                c.lineJoin = 'round';
                for (let j = 1; j < node.trail.length; j++) {
                    const alpha = j / node.trail.length;
                    c.strokeStyle = `hsla(320, 70%, 50%, ${alpha * 0.15})`;
                    c.lineWidth = 2 + 25 * alpha;
                    
                    c.beginPath();
                    c.moveTo(node.trail[j - 1].x * cScale, node.trail[j - 1].y * cScale);
                    c.lineTo(node.trail[j].x * cScale, node.trail[j].y * cScale);
                    c.stroke();
                }
            }
        }
        
        // Collect all connections with their distances for sorting
        let secondaryConnections = [];
        
        // Collect connections between secondary nodes (left side)
        for (i = 0; i < SecondaryNodes.length; i++) {
            node1 = SecondaryNodes[i];
            for (j = i + 1; j < SecondaryNodes.length; j++) {
                node2 = SecondaryNodes[j];
                const invDistance = measureDistAndShade(node1, node2);
                secondaryConnections.push({
                    node1: node1,
                    node2: node2,
                    invDistance: invDistance
                });
            }   
        }
        
        // Sort connections: large invDistance (close) = draw last, small invDistance (far) = draw first
        secondaryConnections.sort((a, b) => a.invDistance - b.invDistance);
         
        // Draw secondary connections from farthest to closest
        for (let conn of secondaryConnections) {
            c.beginPath();
            c.moveTo(conn.node1.pos.x * cScale, conn.node1.pos.y * cScale);
            c.lineTo(conn.node2.pos.x * cScale, conn.node2.pos.y * cScale);
            if (conn.invDistance * 20 < 60) {
                var lineLite = conn.invDistance * 20;
            } else {
                var lineLite = 60;
            }
            c.strokeStyle = `hsla(130, 50%, ${lineLite}%, ${lineLite + 20}%)`;
            c.lineWidth = Math.min(2 * conn.invDistance, 4);
            c.stroke();
        }
         
        // Draw secondary nodes with spherical shading
        for (i = 0; i < SecondaryNodes.length; i++) {
            node1 = SecondaryNodes[i];
            const x = node1.pos.x * cScale;
            const y = node1.pos.y * cScale;
            const radius = 0.03 * cScale;
            
            // Create radial gradient for 3D sphere effect
            const gradient = c.createRadialGradient(
                x - radius * 0.3, y - radius * 0.3, radius * 0.1,
                x, y, radius
            );
            gradient.addColorStop(0, 'hsl(320, 70%, 85%)');
            gradient.addColorStop(0.3, 'hsl(320, 70%, 60%)');
            gradient.addColorStop(0.7, 'hsl(320, 70%, 40%)');
            gradient.addColorStop(1, 'hsl(320, 70%, 20%)');
            
            drawCircle(x, y, radius);
            c.fillStyle = gradient;
            c.fill();   
        }

        /*// Draw connections between primary and secondary nodes
        for (i = 0; i < PrimaryNodes.length; i++) {
            node1 = PrimaryNodes[i];
            for (j = 0; j < SecondaryNodes.length; j++) {
                node2 = SecondaryNodes[i];
                c.moveTo(node1.pos.x * cScale, node1.pos.y * cScale);
                c.lineTo(node2.pos.x * cScale, node2.pos.y * cScale);
                if (measureDistAndShade(node1, node2) * 20 < 60) {
                    var lineLite = measureDistAndShade(node1, node2) * 20
                } else {
                    var lineLite = 60;
                }
                c.strokeStyle = `hsla(0, 70%, 20%, 10%)`;
                c.lineWidth = Math.min(2 * measureDistAndShade(node1, node2), 2);
                
            }
            c.stroke();
        }*/
    }

    function drawHills() {
        // Draw snow-covered rolling hills in the background
        const hillBaseY = simHeight * cScale * 0.55; // Hills start at 55% down the screen
        
        c.save();
        
        // Create two layers of hills for depth
        
        // Middle hill - gentle rolling with some transparency
        c.beginPath();
        c.moveTo(0, canvas.height);
        c.lineTo(0, hillBaseY + 210);
        c.bezierCurveTo(
            canvas.width * 0.25, hillBaseY + 160,
            canvas.width * 0.5, hillBaseY + 230,
            canvas.width * 0.7, hillBaseY + 180
        );
        c.bezierCurveTo(
            canvas.width * 0.85, hillBaseY + 150,
            canvas.width * 0.95, hillBaseY + 200,
            canvas.width, hillBaseY + 170
        );
        c.lineTo(canvas.width, canvas.height);
        c.closePath();
        
        // Medium snow gradient - fully opaque
        const middleGradient = c.createLinearGradient(0, hillBaseY + 120, 0, hillBaseY + 250);
        middleGradient.addColorStop(0, 'hsl(210, 40%, 65%)');
        middleGradient.addColorStop(0.15, 'hsl(210, 38%, 62%)');
        middleGradient.addColorStop(0.35, 'hsl(210, 36%, 58%)');
        middleGradient.addColorStop(0.55, 'hsl(210, 34%, 54%)');
        middleGradient.addColorStop(0.75, 'hsl(210, 32%, 50%)');
        middleGradient.addColorStop(1, 'hsl(210, 30%, 45%)');
        c.fillStyle = middleGradient;
        c.fill();
        
        // Front hill (closest, lightest) - subtle rolling, fully opaque
        c.beginPath();
        c.moveTo(0, canvas.height);
        c.lineTo(0, hillBaseY + 270);
        c.bezierCurveTo(
            canvas.width * 0.3, hillBaseY + 220,
            canvas.width * 0.45, hillBaseY + 290,
            canvas.width * 0.65, hillBaseY + 240
        );
        c.bezierCurveTo(
            canvas.width * 0.8, hillBaseY + 210,
            canvas.width * 0.92, hillBaseY + 260,
            canvas.width, hillBaseY + 230
        );
        c.lineTo(canvas.width, canvas.height);
        c.closePath();
        
        // Lighter snow gradient - fully opaque
        const frontGradient = c.createLinearGradient(0, hillBaseY + 180, 0, hillBaseY + 320);
        frontGradient.addColorStop(0, 'hsl(210, 45%, 75%)');
        frontGradient.addColorStop(0.15, 'hsl(210, 43%, 72%)');
        frontGradient.addColorStop(0.35, 'hsl(210, 41%, 68%)');
        frontGradient.addColorStop(0.55, 'hsl(210, 39%, 64%)');
        frontGradient.addColorStop(0.75, 'hsl(210, 37%, 58%)');
        frontGradient.addColorStop(1, 'hsl(210, 35%, 53%)');
        c.fillStyle = frontGradient;
        c.fill();
        
        c.restore();
    }

    function drawSantasWorkshop() {
        // Position: right of snowman (which is at 0.75)
        const workshopX = 0.93 * simWidth * cScale;
        const hillBaseY = simHeight * cScale * 0.55;
        // Place on top of the hill
        const workshopY = hillBaseY + 175;
        
        const buildingWidth = 80;
        const buildingHeight = 60;
        const roofHeight = 35;
        
        c.save();
        
        // Draw chimney FIRST (so it appears behind the building)
        const chimneyWidth = 15;
        const chimneyHeight = 40;
        const chimneyX = workshopX + 25;
        const chimneyY = workshopY - buildingHeight - roofHeight + 30;
        
        // Draw alternating red and white curved stripes for 50/50 coverage
        const stripeHeight = 4;
        const numStripes = Math.ceil(chimneyHeight / stripeHeight) + 1; // Add one extra to ensure full coverage
        
        for (let i = 0; i < numStripes; i++) {
            // Alternate between red and white
            c.fillStyle = (i % 2 === 0) ? 'hsl(0, 70%, 40%)' : 'hsl(0, 0%, 95%)';
            
            c.beginPath();
            const startY = chimneyY - chimneyHeight + (i * stripeHeight);
            
            // Create curved stripe path
            c.moveTo(chimneyX - chimneyWidth/2, startY);
            c.bezierCurveTo(
                chimneyX - chimneyWidth/4, startY + stripeHeight * 0.25,
                chimneyX + chimneyWidth/4, startY + stripeHeight * 0.75,
                chimneyX + chimneyWidth/2, startY + stripeHeight
            );
            c.lineTo(chimneyX + chimneyWidth/2, startY + stripeHeight * 2);
            c.bezierCurveTo(
                chimneyX + chimneyWidth/4, startY + stripeHeight * 1.75,
                chimneyX - chimneyWidth/4, startY + stripeHeight * 1.25,
                chimneyX - chimneyWidth/2, startY + stripeHeight
            );
            c.closePath();
            c.fill();
        }
        
        // Chimney cap - more prominent, positioned to conceal incomplete top stripes
        c.fillStyle = 'hsl(0, 60%, 30%)';
        c.fillRect(chimneyX - chimneyWidth/2 - 4, chimneyY - chimneyHeight + 0, chimneyWidth + 8, 6);
        
        // Draw foundation (stone/concrete base)
        const foundationHeight = 8;
        c.fillStyle = 'hsl(0, 0%, 30%)';
        c.fillRect(workshopX - buildingWidth/2 - 5, workshopY, buildingWidth + 10, foundationHeight);
        
        // Foundation detail lines (to show stone blocks)
        c.strokeStyle = 'hsl(0, 0%, 20%)';
        c.lineWidth = 1;
        c.beginPath();
        // Horizontal line
        c.moveTo(workshopX - buildingWidth/2 - 5, workshopY + foundationHeight/2);
        c.lineTo(workshopX + buildingWidth/2 + 5, workshopY + foundationHeight/2);
        // Vertical lines
        c.moveTo(workshopX - buildingWidth/4, workshopY);
        c.lineTo(workshopX - buildingWidth/4, workshopY + foundationHeight);
        c.moveTo(workshopX + buildingWidth/4, workshopY);
        c.lineTo(workshopX + buildingWidth/4, workshopY + foundationHeight);
        c.stroke();
        
        // Draw building walls (red)
        c.fillStyle = 'hsl(0, 80%, 45%)';
        c.fillRect(workshopX - buildingWidth/2, workshopY - buildingHeight, buildingWidth, buildingHeight);
        
        // Draw roof (dark red/brown)
        c.fillStyle = 'hsl(0, 60%, 35%)';
        c.beginPath();
        c.moveTo(workshopX - buildingWidth/2 - 10, workshopY - buildingHeight);
        c.lineTo(workshopX, workshopY - buildingHeight - roofHeight);
        c.lineTo(workshopX + buildingWidth/2 + 10, workshopY - buildingHeight);
        c.closePath();
        c.fill();
        
        // Draw three steps in front of door
        const stepWidth = 26;
        const stepHeight = 4;
        const stepDepth = 6;
        
        // Bottom step
        c.fillStyle = 'hsl(0, 0%, 45%)';
        c.fillRect(workshopX - stepWidth/2, workshopY, stepWidth, stepDepth);
        c.fillRect(workshopX - stepWidth/2, workshopY, stepWidth, stepHeight);
        
        // Middle step
        c.fillStyle = 'hsl(0, 0%, 48%)';
        c.fillRect(workshopX - stepWidth/2 + 3, workshopY - stepHeight, stepWidth - 6, stepDepth);
        c.fillRect(workshopX - stepWidth/2 + 3, workshopY - stepHeight, stepWidth - 6, stepHeight);
        
        // Top step
        c.fillStyle = 'hsl(0, 0%, 51%)';
        c.fillRect(workshopX - stepWidth/2 + 6, workshopY - stepHeight * 2, stepWidth - 12, stepDepth);
        c.fillRect(workshopX - stepWidth/2 + 6, workshopY - stepHeight * 2, stepWidth - 12, stepHeight);
        
        // Draw door ajar with light streaming from crack
        const doorWidth = 20;
        const doorHeight = 30;
        const crackWidth = 3;
        const doorX = workshopX - doorWidth/2;
        const doorY = workshopY - doorHeight;
        
        // Draw door frame/opening (warm interior light)
        c.fillStyle = 'hsl(45, 100%, 60%)';
        c.fillRect(doorX, doorY, doorWidth, doorHeight);
        
        // Draw the door itself (slightly open, covering most of opening)
        c.fillStyle = 'hsl(30, 50%, 20%)';
        c.fillRect(doorX, doorY, doorWidth - crackWidth, doorHeight);
        
        // Draw bright light streaming from the crack (over the door)
        const glowGradient = c.createLinearGradient(doorX + doorWidth - crackWidth - 20, doorY, doorX + doorWidth - crackWidth, doorY);
        glowGradient.addColorStop(0, 'hsla(45, 100%, 60%, 0)');
        glowGradient.addColorStop(0.5, 'hsla(45, 100%, 70%, 0.2)');
        glowGradient.addColorStop(1, 'hsla(45, 100%, 90%, 0.5)');
        c.fillStyle = glowGradient;
        c.fillRect(doorX + doorWidth - crackWidth - 20, doorY, 20, doorHeight);
        
        // Door handle/knob
        c.fillStyle = 'hsl(45, 60%, 80%)';
        c.beginPath();
        c.arc(doorX + doorWidth - crackWidth - 3, doorY + doorHeight/2, 2, 0, Math.PI * 2);
        c.fill();
        
        // Draw windows (yellow light)
        c.fillStyle = 'hsl(45, 100%, 70%)';
        const windowSize = 12;
        c.fillRect(workshopX - 30, workshopY - buildingHeight + 15, windowSize, windowSize);
        c.fillRect(workshopX + 18, workshopY - buildingHeight + 15, windowSize, windowSize);
        
        // Window panes
        c.strokeStyle = 'hsl(30, 50%, 20%)';
        c.lineWidth = 1;
        // Left window
        c.beginPath();
        c.moveTo(workshopX - 24, workshopY - buildingHeight + 15);
        c.lineTo(workshopX - 24, workshopY - buildingHeight + 27);
        c.moveTo(workshopX - 30, workshopY - buildingHeight + 21);
        c.lineTo(workshopX - 18, workshopY - buildingHeight + 21);
        c.stroke();
        // Right window
        c.beginPath();
        c.moveTo(workshopX + 24, workshopY - buildingHeight + 15);
        c.lineTo(workshopX + 24, workshopY - buildingHeight + 27);
        c.moveTo(workshopX + 18, workshopY - buildingHeight + 21);
        c.lineTo(workshopX + 30, workshopY - buildingHeight + 21);
        c.stroke();
        
        c.restore();
    }

    function drawSnowman() {
        // draw snowman image at this position
        const snowmanX = 0.75 * simWidth * cScale;
        const snowmanY = simHeight * cScale;
        
        // Draw the frosty image if it's loaded
        if (frostyImage.complete && frostyImage.naturalWidth > 0) {
            // Calculate size to maintain aspect ratio
            const imageWidth = 400; // Adjust this to desired width
            const imageHeight = (frostyImage.naturalHeight / frostyImage.naturalWidth) * imageWidth;
            
            // Draw image centered at snowmanX, snowmanY
            c.drawImage(frostyImage, 
                snowmanX - imageWidth / 2, 
                snowmanY - imageHeight, 
                imageWidth, 
                imageHeight);
            
            // Draw speech bubble (to the right of Frosty)
            const bubbleX = snowmanX + 80;
            const bubbleY = snowmanY - imageHeight + 30;
            const bubbleWidth = 160;
            const bubbleHeight = 50;
            const tailSize = 40;
            
            c.save();
            
            // Draw bubble main body
            c.fillStyle = 'hsla(180, 80%, 58%, 0.5)';
            c.strokeStyle = 'hsl(0, 0%, 40%)';
            c.lineWidth = 3;
            c.beginPath();
            c.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 15);
            c.fill();
            c.stroke();
            
            // Draw speech bubble tail (pointing to mouth)
            c.fillStyle = 'hsla(180, 80%, 58%, 0.5)';
            c.strokeStyle = 'hsl(0, 0%, 40%)';
            c.lineWidth = 3;
            c.beginPath();
            c.moveTo(bubbleX + 10, bubbleY + bubbleHeight);
            c.lineTo(bubbleX - tailSize, bubbleY + bubbleHeight + tailSize);
            c.lineTo(bubbleX + 40, bubbleY + bubbleHeight);
            c.closePath();
            c.fill();
            c.stroke();
            
            // Draw text "Stay Frosty!"
            c.fillStyle = 'hsl(0, 0%, 95%)';
            c.font = 'italic 24px sans-serif';
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.fillText('Stay Frosty!', bubbleX + bubbleWidth / 2, bubbleY + bubbleHeight / 2);
            
            c.restore();
        }
    }

    //  SIMULATION --------------------------------------------------------------------------
	function simulate() {
        for (n = 0; n < PrimaryNodes.length; n++) {
            PrimaryNodes[n].simulate();
            SecondaryNodes[n].simulate();
        }

        for (var r = 0; r < Roid.length; r++) {
            if (Roid[r] != null) {
                var roid = Roid[r]
                roid.simulate();
            }
        }
        
        /*
        // Simulate cube
        if (Cube != null) {
            Cube.simulate();
        }
        */
        
        // Simulate pong game
        if (PongGame != null) {
            PongGame.simulate();
        }

        for (var i = 0; i < Snowfield.length; i++) {
            var snow = Snowfield[i];
            snow.simulate();
        }
        
        // Simulate smoke puffs
        smokeSpawnTimer += dT;
        if (smokeSpawnTimer >= nextSmokeInterval) {
            spawnSmokePuff();
            smokeSpawnTimer = 0;
            nextSmokeInterval = 1.5 + Math.random() * 1.5; // 1.5-3 seconds between puffs
        }
        
        for (var s = SmokePuffs.length - 1; s >= 0; s--) {
            var puff = SmokePuffs[s];
            puff.simulate();
            
            // Remove dead puffs
            if (puff.isDead()) {
                SmokePuffs.splice(s, 1);
            }
        }
        
        // Simulate Christmas lights
        for (var l = 0; l < TopLights.length; l++) {
            TopLights[l].simulate();
        }
        for (var l = 0; l < WorkshopLights.length; l++) {
            WorkshopLights[l].simulate();
        }
        
        // Simulate bubbles - continuous mode or periodic bursts
        if (continuousMode) {
            // Continuous mode - spawn bubbles constantly
            continuousModeTimer += dT;
            
            // Spawn bubbles almost every frame
            if (Math.random() < 0.98) {
                spawnBubble();
                // Very high chance of extra bubbles for density
                if (Math.random() < 0.8) {
                    spawnBubble();
                    if (Math.random() < 0.4) {
                        spawnBubble();
                    }
                }
            }
            
            // End continuous mode after 1 minute
            if (continuousModeTimer >= continuousModeDuration) {
                continuousMode = false;
                continuousModeTimer = 0;
                // Reset burst timer to start fresh
                bubbleSpawnTimer = 0;
                burstActive = false;
            }
        } else {
            // Normal periodic bursts
            bubbleSpawnTimer += dT;
            
            if (!burstActive) {
                // Wait for next burst
                if (bubbleSpawnTimer >= bubbleBurstInterval) {
                    bubbleSpawnTimer = 0;
                    burstActive = true;
                    burstTimer = 0;
                    bubblesSpawnedInBurst = 0;
                    // Set new random burst duration for this burst
                    burstDuration = 5.0 + Math.random() * 10.0; // 5-15 seconds
                }
            } else {
                // Burst is active - spawn bubbles with natural timing
                burstTimer += dT;
                
                // Use a sine-based curve for natural burst intensity
                // Peak intensity at the middle of the burst
                const burstProgress = burstTimer / burstDuration;
                const intensity = Math.sin(burstProgress * Math.PI); // 0 to 1 and back to 0
                
                // Spawn rate increases at peak (middle of burst)
                // At peak, spawn multiple bubbles per frame for density
                const spawnProbability = intensity * 2.0; // Max 200% chance per frame at peak
                
                if (bubblesSpawnedInBurst < bubblesPerBurst) {
                    if (Math.random() < spawnProbability) {
                        spawnBubble();
                        bubblesSpawnedInBurst++;
                        
                        // Spawn additional bubbles at all intensity levels
                        if (intensity > 0.3 && bubblesSpawnedInBurst < bubblesPerBurst && Math.random() < 0.9) {
                            spawnBubble();
                            bubblesSpawnedInBurst++;
                            // Even more at peak
                            if (intensity > 0.6 && bubblesSpawnedInBurst < bubblesPerBurst && Math.random() < 0.6) {
                                spawnBubble();
                                bubblesSpawnedInBurst++;
                            }
                        }
                    }
                }
                
                // End burst when all bubbles spawned OR duration is complete
                if (bubblesSpawnedInBurst >= bubblesPerBurst || burstTimer >= burstDuration) {
                    burstActive = false;
                    // Set new random pause interval for next burst
                    bubbleBurstInterval = 3.0 + Math.random() * 2.0; // 3-5 seconds
                }
            }
        }
        
        for (var b = Bubbles.length - 1; b >= 0; b--) {
            var bubble = Bubbles[b];
            bubble.simulate();
            
            // Remove bubbles that have floated off screen
            if (bubble.pos.y < -0.1) {
                Bubbles.splice(b, 1);
            }
        }
    }
    
    function drawFootprints(startX, endX, numPrints) {
        // Draw a trail of footprints from startX to endX (as fractions of simWidth)
        const hillBaseY = simHeight * cScale * 0.55;
        const startXPos = startX * simWidth * cScale;
        const endXPos = endX * simWidth * cScale;
        const spacing = (endXPos - startXPos) / numPrints;
        
        // Calculate size based on distance (smaller = farther away)
        const avgX = (startX + endX) / 2;
        const sizeFactor = avgX < 0.6 ? 0.5 : 1.0; // Smaller on middle hill (farther away)
        
        c.save();
        c.fillStyle = 'hsla(210, 30%, 35%, 0.4)'; // Darker indentation in snow
        
        for (let i = 0; i < numPrints; i++) {
            const progress = i / numPrints;
            const x = startXPos + spacing * i;
            
            // Calculate y position on the hill
            let y;
            if (avgX < 0.6) {
                // On middle hill - use its bezier curve approximation
                const t = (x / canvas.width - 0) / (1 - 0);
                if (t < 0.7) {
                    y = hillBaseY + 210 - 50 * Math.sin(t * Math.PI);
                } else {
                    y = hillBaseY + 180 - 30 * Math.sin((t - 0.7) * Math.PI * 3);
                }
            } else {
                // On front hill
                const t = (x / canvas.width - 0) / (1 - 0);
                if (t < 0.65) {
                    y = hillBaseY + 270 - 50 * Math.sin(t * Math.PI * 1.5);
                } else {
                    y = hillBaseY + 240 - 30 * Math.sin((t - 0.65) * Math.PI * 2);
                }
            }
            
            const leftRight = i % 2; // Alternate left and right foot
            const footWidth = 35 * sizeFactor;
            const footLength = 55 * sizeFactor;
            const offset = leftRight ? -20 * sizeFactor : 20 * sizeFactor;
            
            // Draw boot print shape
            c.beginPath();
            // Toe area (rounded front)
            c.ellipse(x + offset, y - footLength * 0.3, footWidth * 0.5, footLength * 0.3, 0, 0, Math.PI * 2);
            c.fill();
            
            // Heel area (rectangular)
            c.fillRect(x + offset - footWidth * 0.35, y, footWidth * 0.7, footLength * 0.4);
        }
        
        c.restore();
    }

    //  DRAW EVERYTHING ==============================================================
	function drawEverything() {
        // Clear the canvas
        c.fillStyle = 'hsl(0, 0%, 0%)';
        c.fillRect(0, 0, canvas.width, canvas.height);

        /*// Draw Starfield  --------------------
        for (var n = 0; n < Starfield.length; n++) {
            star = Starfield[n];
            star.draw();
        }*/

        // Draw nodes and their connections
        drawPrimaryNodes();
        //drawSecondaryNodes();

        // Draw semi-transparent black overlay
        c.fillStyle = 'hsla(0, 0%, 0%, 0.7)';
        c.fillRect(0, 0, canvas.width, canvas.height); 

        // Draw roid
        for (var r = 0; r < Roid.length; r++) {
            if (Roid[r] != null) {
                var roid = Roid[r]
                roid.draw();
            }
        }

        // Draw first 1/3 of light snow (will be behind both hills)
        const snowThird = Math.floor(Snowfield.length / 3);
        for (var i = 0; i < snowThird; i++) {
            var snow = Snowfield[i];
            snow.draw();
        }

        // Draw middle hill (covers first third of snow)
        const hillBaseY = simHeight * cScale * 0.55;
        c.save();
        
        c.beginPath();
        c.moveTo(0, canvas.height);
        c.lineTo(0, hillBaseY + 210);
        c.bezierCurveTo(
            canvas.width * 0.25, hillBaseY + 160,
            canvas.width * 0.5, hillBaseY + 230,
            canvas.width * 0.7, hillBaseY + 180
        );
        c.bezierCurveTo(
            canvas.width * 0.85, hillBaseY + 150,
            canvas.width * 0.95, hillBaseY + 200,
            canvas.width, hillBaseY + 170
        );
        c.lineTo(canvas.width, canvas.height);
        c.closePath();
        
        const middleGradient = c.createLinearGradient(0, hillBaseY + 120, 0, hillBaseY + 250);
        middleGradient.addColorStop(0, 'hsl(210, 40%, 65%)');
        middleGradient.addColorStop(0.15, 'hsl(210, 38%, 62%)');
        middleGradient.addColorStop(0.35, 'hsl(210, 36%, 58%)');
        middleGradient.addColorStop(0.55, 'hsl(210, 34%, 54%)');
        middleGradient.addColorStop(0.75, 'hsl(210, 32%, 50%)');
        middleGradient.addColorStop(1, 'hsl(210, 30%, 45%)');
        c.fillStyle = middleGradient;
        c.fill();
        
        // Draw second 1/3 of light snow (will be behind front hill)
        for (var i = snowThird; i < snowThird * 2; i++) {
            var snow = Snowfield[i];
            snow.draw();
        }

        // Draw front hill (covers second third of snow)
        c.beginPath();
        c.moveTo(0, canvas.height);
        c.lineTo(0, hillBaseY + 270);
        c.bezierCurveTo(
            canvas.width * 0.3, hillBaseY + 220,
            canvas.width * 0.45, hillBaseY + 290,
            canvas.width * 0.65, hillBaseY + 240
        );
        c.bezierCurveTo(
            canvas.width * 0.8, hillBaseY + 210,
            canvas.width * 0.92, hillBaseY + 260,
            canvas.width, hillBaseY + 230
        );
        c.lineTo(canvas.width, canvas.height);
        c.closePath();
        
        const frontGradient = c.createLinearGradient(0, hillBaseY + 180, 0, hillBaseY + 320);
        frontGradient.addColorStop(0, 'hsl(210, 45%, 75%)');
        frontGradient.addColorStop(0.15, 'hsl(210, 43%, 72%)');
        frontGradient.addColorStop(0.35, 'hsl(210, 41%, 68%)');
        frontGradient.addColorStop(0.55, 'hsl(210, 39%, 64%)');
        frontGradient.addColorStop(0.75, 'hsl(210, 37%, 58%)');
        frontGradient.addColorStop(1, 'hsl(210, 35%, 53%)');
        c.fillStyle = frontGradient;
        c.fill();
        
        c.restore();

        // Draw final 1/3 of light snow (will appear in front of hills)
        for (var i = snowThird * 2; i < Snowfield.length; i++) {
            var snow = Snowfield[i];
            snow.draw();
        }

        // Draw side fades
        const sideFade = c.createLinearGradient(0, 0, canvas.width, 0);
        sideFade.addColorStop(0.00, 'hsla(0, 0%, 5%, 0.9)');
        sideFade.addColorStop(0.05, 'hsla(0, 0%, 3%, 0.8)');
        sideFade.addColorStop(0.50, 'hsla(0, 0%, 0%, 0)');
        sideFade.addColorStop(0.90, 'hsla(0, 0%, 0%, 0)');
        sideFade.addColorStop(0.97, 'hsla(0, 0%, 0%, 0.8)');
        sideFade.addColorStop(1, 'hsla(0, 0%, 0%, 0.9)');
        c.fillStyle = sideFade;
        //c.fillRect(0, 0, canvas.width, canvas.height);

        /*
        // Draw cube
        if (Cube != null) {
            Cube.draw();
        }
        */

        /*
        // Draw Santa's Workshop
        drawSantasWorkshop();

        // Workshop light wire
        if (WorkshopLights.length > 0) {
            c.beginPath();
            c.moveTo(WorkshopLights[0].pos.x * cScale, WorkshopLights[0].pos.y * cScale);
            for (var l = 0; l < WorkshopLights.length; l++) {
                c.lineTo(WorkshopLights[l].pos.x * cScale, WorkshopLights[l].pos.y * cScale);
            }
            c.stroke();
        }
        */
        c.restore();
        
        /*
        for (var l = 0; l < WorkshopLights.length; l++) {
            WorkshopLights[l].draw();
        }
        */

        // Draw snowman
        drawSnowman();

        /*
        // Draw smoke puffs
        for (var s = 0; s < SmokePuffs.length; s++) {
            var puff = SmokePuffs[s];
            puff.draw();
        }
            */

         // Draw bubbles
        for (var b = 0; b < Bubbles.length; b++) {
            var bubble = Bubbles[b];
            bubble.draw();
        }

        // draw big snowflakes
        for (var i = 0; i < Snowfield.length; i++) {
            var snow = Snowfield[i];
            snow.drawBig();
        }

        // Draw Christmas light wires
        c.save();
        c.strokeStyle = 'hsl(120, 50%, 15%)';
        c.lineWidth = 4;
        
        // Top light wire
        if (TopLights.length > 0) {
            c.beginPath();
            c.moveTo(0, TopLights[0].pos.y * cScale);
            for (var l = 0; l < TopLights.length; l++) {
                c.lineTo(TopLights[l].pos.x * cScale, TopLights[l].pos.y * cScale);
            }
            c.lineTo(canvas.width, TopLights[TopLights.length - 1].pos.y * cScale);
            c.stroke();
        }

        // Draw Christmas light bulbs
        for (var l = 0; l < TopLights.length; l++) {
            TopLights[l].draw();
        }
        
        // Draw pong game
        if (PongGame != null) {
            PongGame.draw();
        }
	}

    //  MAIN SEQUENCE ----------------------------------------------------------------------------
	setupScene();
    setupMouseInteraction();
    
    function update() {
        simulate();
		drawEverything();
		requestAnimationFrame(update);
	}
    
	update();

    // Title pulse timing system
    const tapTimings = [];
    const wordGroups = [
        ['word1'],  // I
        ['word2'],  // Like
        ['word3'],  // to
        ['word4'],  // Move it
        ['word5']   // Move it
    ];
    let currentTapIndex = 0;
    
    // Saved timings from tapping to "I Like to Move It"
    // Each timing corresponds to one word group
    const savedTimings = [0, 233, 433, 743, 1194]; // Based on your actual tapping
    const loopDuration = 1965; // Total cycle duration before repeat (ms) - average of your cycles
    const pressDurations = [80, 68, 79, 168, 151]; // Hold durations for emphasis (one cycle)
    let playbackInterval = null;

    function pulseWord(wordId, duration = 150, emphasis = 1.0) {
        const word = document.getElementById(wordId);
        if (word) {
            // Scale the pulse based on emphasis (duration of key press)
            const scaleAmount = 1.0 + (emphasis * 0.32); // More emphasis = bigger pulse (max ~1.32x)
            const glowIntensity = 25 + (emphasis * 15); // More emphasis = brighter glow
            
            word.style.transform = `scale(${scaleAmount})`;
            word.style.textShadow = `0px 0px ${glowIntensity}px hsl(0, 0%, 100%), 5px 7px 10px hsl(0, 0%, 0%)`;
            word.style.color = `hsl(0, 0%, 100%)`; // White during pulse
            
            // After pulse duration, transition to red cooldown
            setTimeout(() => {
                word.style.transform = '';
                word.style.textShadow = '5px 7px 10px hsl(0, 0%, 0%)';
                word.style.color = 'hsl(0, 90%, 59%)'; // Red during cooldown
                
                // After cooldown, return to original color
                setTimeout(() => {
                    word.style.textShadow = '';
                    word.style.color = '';
                }, 400); // 300ms red cooldown period
            }, duration);
        }
    }

    function pulseGroup(groupIndex, emphasis = 1.0) {
        const group = wordGroups[groupIndex];
        if (!group) return;
        
        // First three words (I, Like, to) get short staccato pulses
        // Last two (Move it) get longer pulses
        const pulseDuration = groupIndex < 3 ? 100 : 150;
        pulseWord(group[0], pulseDuration, emphasis);
    }

    function startPlayback() {
        // Stop any existing playback
        if (playbackInterval) {
            clearTimeout(playbackInterval);
        }
        
        // Play each group according to recorded timings with emphasis
        savedTimings.forEach((timing, index) => {
            setTimeout(() => {
                // Calculate emphasis based on press duration (normalize to 0-1 scale)
                // Short press ~90ms = 0.5, long press ~290ms = 1.5
                const pressDuration = pressDurations[index % pressDurations.length];
                const emphasis = Math.max(0.5, Math.min(2.0, pressDuration / 150));
                pulseGroup(index % 5, emphasis);
            }, timing);
        });
        
        // Loop the animation
        const totalDuration = loopDuration;
        playbackInterval = setTimeout(() => startPlayback(), totalDuration);
    }

    // Auto-start with saved timings
    setTimeout(() => startPlayback(), 500);