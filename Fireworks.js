// Fireworks on the Hudson 
// copyright 2026 :: Frank Maiello :: maiello.frank@gmail.com

// "Those who would give up essential Liberty, 
// to purchase a little temporary Safety, 
// deserve neither Liberty nor Safety."
// - Benjamin Franklin

// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

const DeltaT = 1.0 / 60.0;
var Gravity = -1.7; // Controllable gravity strength
const worldRadius = 200; // Circular boundary radius
const worldSizeY = 20;

var ballRadius = 0.03;
const particlesPerMortar = 3000; // Particles per mortar
const sparkPoolSize = 3000; // Extra particles for spark trails
const numBalls = 75000 + sparkPoolSize; // 25 mortars × 3000 + spark pool
const mortarRadius = 0.03; // Initial cluster radius for mortar shell particles	
const mortarAltitude = 1.5; // Start just above ground level
var maxExplosionSize = 5.0; // Base velocity magnitude for explosion particles (controllable)
const explosionUniformity = 0.3; // Higher values = more random explosion patterns, lower values = more uniform spheres
var minLaunchVelocity = 30.0; // Controllable launch velocity
const lauchVelocityRange = 20.0;
var mortarTubeAngle = 10.0; // Angle in degrees for mortar tube tilt away from center (0-45)
const mortarSpacing = 1.5; // Space between mortar tubes in grid
const sparkLifetime = 0.30; // Sparks fade very quickly
const sparksPerFrame = 5; // Number of sparks spawned per mortar per frame

var gThreeScene;
var gRenderer;
var gRenderTarget;
var Camera;
var CameraControl;
var gGrabber;
var gMouseDown;
var gravityEnabled = true; // Always enabled
var Mortars = []; // Array of all mortar instances
var autoLaunchEnabled = false; // Auto-launch mortars at random intervals - starts disabled
var nextLaunchTime = 0; // Time until next mortar launch
var timeSinceLastLaunch = 0; // Time elapsed since last launch
var sparkPool = []; // Pool of available spark particle indices
var clusterCenter = new THREE.Vector3(); // Center of initial ball cluster
var stats;

// Tube flash system
var tubeMaterials = []; // Array of inner tube materials for each mortar
var tubeFlashTimers = []; // Array of flash timers (0 = no flash, > 0 = flashing)
var tubeGroups = []; // Array of THREE.Group objects for each mortar tube
var tubePositions = []; // Array of {x, z} positions for each tube (for calculating tilt direction)
var tubeFlashDuration = 0.25; // Duration of tube flash in seconds
var tubeNormalColor = 0x1a1a1a; // Dark interior color
var tubeFlashColor = 0xffffff; // White flash color

// Explosion flash variables
var explosionLight = null;
var explosionLightIntensity = 0.0; // Current intensity (dim by default)
var explosionLightDimIntensity = 0.0; // Dim baseline intensity
var explosionLightBrightIntensity = 0.6; // Bright flash intensity
var explosionLightFadeSpeed = 20.0; // How fast it fades back to dim

// Camera control variables
var gCameraMode = 0; // 0=Manual Orbit, 1=Auto Orbit CCW, 2=Auto Orbit CW, 3=Helicopter Cam, 4=Zeppelin Cam, 5=Sailboat Cam
var gCameraAngle = 0;
var gCameraRotationSpeed = 1.0;
var gCameraFOV = 57;
var gRunning = false; // Simulation running state - starts paused
var startupTimer = 3.0; // Start paused for 3 seconds

// Ball material variables
var gBallMaterialMode = 0; // 0=Basic, 1=Plastic, 2=Metallic, 3=Normal

// Loading screen variables
var loadingScreen = null;
var loadingProgress = 0;
var totalResources = 6; // barge, zeppelin, cityscape south, cityscape north, helicopter, texture
var loadedResources = 0;
var minLoadTime = 2.0; // Minimum 2 seconds for loading screen
var loadTimeElapsed = 0;
var loadingComplete = false;
var fadeOutStarted = false;
var fadeOutProgress = 0;
var fadeOutDuration = 1.0; // 1 second fade

// Menu system variables
var gOverlayCanvas = null;
var gOverlayCtx = null;
var mainMenuVisible = false;
var mainMenuOpacity = 0;
var mainMenuXOffset = -1.0; // Start off screen
var mainMenuFadeSpeed = 3.0;
var mainMenuAnimSpeed = 4.0;
var cameraMenuVisible = false;
var cameraMenuOpacity = 0;
var cameraMenuFadeSpeed = 3.0;
var simulationMenuVisible = false;
var simulationMenuOpacity = 0;
var simulationMenuFadeSpeed = 3.0;
var instructionsMenuVisible = false;
var instructionsMenuOpacity = 0;
var instructionsMenuFadeSpeed = 3.0;
var submenuX = 0.15; // Shared position for all submenus
var submenuY = 0.1; // Shared position for all submenus
var needsMenuRedraw = true; // Flag to optimize canvas clearing

// Instructions image
var mouseControlsImage = null;
var mouseControlsImageLoaded = false;

// Camera help
var cameraHelpVisible = false;
var manualOrbitImage = null;
var autoOrbitImage = null;
var vehicleImage = null;
var manualOrbitImageLoaded = false;
var autoOrbitImageLoaded = false;
var vehicleImageLoaded = false;

// Knob drag state
var draggingFOVKnob = false;
var draggingOrbitSpeedKnob = false;
var draggingExplosionSizeKnob = false;
var draggingLaunchVelocityKnob = false;
var draggingMortarAngleKnob = false;
var draggingGravityKnob = false;
var draggingBallRadiusKnob = false;
var draggingCamera = false; // For fixed camera pan/tilt dragging
var fovKnobInfo = { x: 0, y: 0, radius: 0 };
var explosionSizeKnobInfo = { x: 0, y: 0, radius: 0 };
var launchVelocityKnobInfo = { x: 0, y: 0, radius: 0 };
var mortarAngleKnobInfo = { x: 0, y: 0, radius: 0 };
var gravityKnobInfo = { x: 0, y: 0, radius: 0 };
var ballRadiusKnobInfo = { x: 0, y: 0, radius: 0 };
var orbitSpeedKnobInfo = { x: 0, y: 0, radius: 0 };
var dragStartMouseX = 0;
var dragStartMouseY = 0;
var dragStartValue = 0;

// Fixed camera pan/tilt (for helicopter, zeppelin, sailboat cams)
var cameraPan = 0; // Horizontal rotation (yaw) in radians
var cameraTilt = 0; // Vertical rotation (pitch) in radians

// Shock wave system
var shockWaves = []; // Array of active shock waves
var shockWaveMeshPool = []; // Pool of reusable shock wave meshes
var maxShockWaves = 50; // Maximum number of concurrent shock waves

// Instanced rendering for performance
var ballInstancedMesh = null;
var ballMatrix = new THREE.Matrix4();
var ballColor = new THREE.Color();

// Zeppelin animation variables
var zeppelinModelTemplate = null;
var propellerPort = null;
var propellerStarboard = null;
var zeppelinLight = null;
var zeppelinCamPoint = null;
var zeppelinAngle = 1.7 * Math.PI; // Current angle on oval path
var zeppelinSpeed = 0.01; // Radians per second

// Sailboat variables
var sailboatModelTemplate = null;
var sailboatCamPoint = null;
var sailboatAngle = 0.5 * Math.PI; // Current angle on oval path (start at different position)
var sailboatSpeed = 0.007; // Radians per second (medium speed)
var sailboatOvalRadiusX = 15; // Smaller horizontal radius than helicopter/zeppelin
var sailboatOvalRadiusZ = 35; // Smaller depth radius
var sailboatHeight = -0.1; // Water level
var sailboatCenterX = 0; // Center of oval path (fireworks launch point)
var sailboatCenterZ = 0; // Center of oval path
var sailboatPivotOffset = -5.0; // Offset forward from path position to make rear act as pivot

var ovalRadiusX = 30; // Horizontal radius of oval
var ovalRadiusZ = 70; // Depth radius of oval
var zeppelinHeight = 24; // Flight altitude
var zeppelinCenterX = 0; // Center of oval path (fireworks launch point)
var zeppelinCenterZ = 0; // Center of oval path
var propellerRotationSpeed = 10.0; // Negative rotation speed for x-axis

// Helicopter animation variables
var helicopterModelTemplate = null;
var mainRotor = null;
var rotorRotationSpeed = 12.0;
var spotlightBase = null;
var rotateGimbalY = null;
var rotateGimbalZ = null;
var helicopterSpotlight = null;
var spotlightCone = null;
var spotlightTarget = new THREE.Vector3(0, 0, 0); // Target position on barge
var helicopterCabCameraOffset = new THREE.Vector3(0.3, 0.7, -1.8); // Center seat, forward position (local to helicopter)
var helicopterCameraGhostSphere = null;
var helicopterAngle = Math.PI; // Start opposite to zeppelin (counterclockwise)
var helicopterSpeed = 0.03; // Slightly faster than zeppelin
var helicopterOvalRadiusX = 47; // Larger oval than zeppelin
var helicopterOvalRadiusZ = 120;
var helicopterHeight = 50; // Higher altitude than zeppelin
var helicopterCenterX = 0;
var helicopterCenterZ = 0;
var helicopterInteriorMeshes = []; // Store all helicopter mesh references for darkening
var helicopterInteriorOriginalMaterials = []; // Store original materials for restoration
var helicopterCabinLight = null; // Red point light for cabin

// Mortar Class -------------------------------------------
class MORTAR {
	constructor(position, particleColor, startIndex, particleCount, tubeIndex) {
		this.position = position.clone();
		this.particleColor = particleColor; // Base color for particles
		this.startIndex = startIndex; // Starting index in global Balls array
		this.particleCount = particleCount; // Number of particles this mortar uses
		this.tubeIndex = tubeIndex; // Index of this mortar's tube for flash effect
		this.inFlight = false;
		this.detonationTime = 0;
		this.flightTime = 0;
		this.hasExploded = false;
		this.clusterCenter = new THREE.Vector3();
		
		// Create particles for this mortar
		this.createParticles();
	}
	// Check if all particles from this mortar are gone
	isReadyToLaunch() {
		if (this.inFlight) return false; // Already in flight
		
		// Check if any particles are still active
		for (let i = this.startIndex; i < this.startIndex + this.particleCount; i++) {
			if (Balls[i] && Balls[i].active) {
				return false; // Still has active particles
			}
		}
		return true; // All clear, ready to launch
	}
	createParticles() {
		for (let i = 0; i < this.particleCount; i++) {
			let pos = null;
			let theta = Math.random() * Math.PI * 2;
			let phi = Math.acos(2 * Math.random() - 1);
			let r = Math.cbrt(Math.random()) * mortarRadius; // Cube root for uniform distribution in sphere
			pos = new THREE.Vector3(
				this.position.x + r * Math.sin(phi) * Math.cos(theta),
				mortarAltitude + r * Math.cos(phi),
				this.position.z + r * Math.sin(phi) * Math.sin(theta)
			);
			let vel = new THREE.Vector3(0, 0, 0);
			let ball = new BALL(pos, vel, ballRadius, this.particleColor.clone());
			ball.mortarId = Mortars.length; // Track which mortar this belongs to
			ball.active = false; // Start inactive
			ball.hasExploded = false;
			Balls[this.startIndex + i] = ball;
		}
	}
	launch() {
		if (!this.isReadyToLaunch()) return; // Not ready yet
		
		// Randomize launch speed (10.0 to 15.0 m/s)
		let launchVelocity = minLaunchVelocity + Math.random() * lauchVelocityRange;
		
		// Calculate launch direction based on mortar tube angle
		// Base direction is straight up (0, 1, 0)
		// Tilt away from center based on mortarTubeAngle
		let launchDir = new THREE.Vector3(0, 1, 0);
		
		if (mortarTubeAngle > 0) {
			// Calculate direction from center to this mortar's position
			let fromCenter = new THREE.Vector2(this.position.x, this.position.z);
			let distFromCenter = fromCenter.length();
			
			if (distFromCenter > 0.01) { // Only tilt if not at center
				fromCenter.normalize();
				
				// Convert angle from degrees to radians
				let angleRad = mortarTubeAngle * Math.PI / 180.0;
				
				// Calculate horizontal component (away from center)
				let horizontalComponent = Math.sin(angleRad);
				let verticalComponent = Math.cos(angleRad);
				
				// Set launch direction: tilted away from center
				launchDir.set(
					fromCenter.x * horizontalComponent,
					verticalComponent,
					fromCenter.y * horizontalComponent
				);
				launchDir.normalize();
			}
		}
		
		// Reset and launch all this mortar's particles
		for (let i = this.startIndex; i < this.startIndex + this.particleCount; i++) {
			if (Balls[i]) {
				// Reset position to tight cluster at mortar location
				let theta = Math.random() * Math.PI * 2;
				let phi = Math.acos(2 * Math.random() - 1);
				let r = Math.cbrt(Math.random()) * mortarRadius; 
				Balls[i].pos.set(
					this.position.x + r * Math.sin(phi) * Math.cos(theta),
					mortarAltitude + r * Math.cos(phi),
					this.position.z + r * Math.sin(phi) * Math.sin(theta)
				);
				
				// Set velocity based on launch direction and speed
				Balls[i].vel.copy(launchDir).multiplyScalar(launchVelocity);
				Balls[i].active = true;
				Balls[i].hasExploded = false;
				Balls[i].age = 0;
				Balls[i].brightness = 1.0;
				
				// Set to BRIGHT WHITE for mortar shell
				Balls[i].baseColor = new THREE.Color(0xffffff);
				Balls[i].updateColorWithBrightness();
				
				// Update instance matrix to make particle visible
				ballMatrix.makeTranslation(Balls[i].pos.x, Balls[i].pos.y, Balls[i].pos.z);
				ballInstancedMesh.setMatrixAt(Balls[i].instanceId, ballMatrix);
			}
		}
		
		// Set random detonation time (0.9 to 1.5 seconds)
		this.detonationTime = 0.9 + Math.random() * 0.6;
		this.flightTime = 0;
		this.inFlight = true;
		this.hasExploded = false;
		
		// Trigger mortar tube flash effect
		if (tubeFlashTimers[this.tubeIndex] !== undefined) {
			tubeFlashTimers[this.tubeIndex] = tubeFlashDuration;
			if (tubeMaterials[this.tubeIndex]) {
				tubeMaterials[this.tubeIndex].color.setHex(tubeFlashColor);
				tubeMaterials[this.tubeIndex].emissive.setHex(tubeFlashColor);
				tubeMaterials[this.tubeIndex].emissiveIntensity = 0.8;
			}
		}
		
		// Update instance mesh
		ballInstancedMesh.instanceMatrix.needsUpdate = true;
		ballInstancedMesh.instanceColor.needsUpdate = true;
	}
	update(deltaTime) {
		if (!this.inFlight || this.hasExploded) return;
		
		this.flightTime += deltaTime;
		
		// Spawn spark trail while mortar is in flight
		this.spawnSparks();
		
		if (this.flightTime >= this.detonationTime) {
			this.explode();
			this.hasExploded = true;
			this.inFlight = false;
		}
	}
	spawnSparks() {
		// Calculate current cluster center for spark spawning
		let center = new THREE.Vector3(0, 0, 0);
		let count = 0;
		for (let i = this.startIndex; i < this.startIndex + this.particleCount; i++) {
			if (Balls[i] && Balls[i].active && !Balls[i].hasExploded) {
				center.add(Balls[i].pos);
				count++;
			}
		}
		if (count === 0) return;
		center.divideScalar(count);
		
		// Spawn several tiny white sparks
		for (let i = 0; i < sparksPerFrame; i++) {
			if (sparkPool.length === 0) break; // No more sparks available
			
			let sparkIdx = sparkPool.pop();
			if (!Balls[sparkIdx]) continue;
			
			// Position at cluster center with slight randomness
			Balls[sparkIdx].pos.copy(center);
			Balls[sparkIdx].pos.x += (Math.random() - 0.5) * 0.05;
			Balls[sparkIdx].pos.y += (Math.random() - 0.5) * 0.05;
			Balls[sparkIdx].pos.z += (Math.random() - 0.5) * 0.05;
			
			// Small random velocity (mostly downward/outward drift)
			Balls[sparkIdx].vel.set(
				(Math.random() - 0.5) * 0.5,
				-0.2 + Math.random() * 0.1,
				(Math.random() - 0.5) * 0.5
			);
			
			// Set as active spark
			Balls[sparkIdx].active = true;
			Balls[sparkIdx].isSpark = true;
			Balls[sparkIdx].hasExploded = false;
			Balls[sparkIdx].age = 0;
			Balls[sparkIdx].lifetime = sparkLifetime;
			Balls[sparkIdx].brightness = 1.0;
			Balls[sparkIdx].baseColor = new THREE.Color(0xffffff); // Bright white
			Balls[sparkIdx].updateColorWithBrightness();
			
			// Update instance matrix
			ballMatrix.makeTranslation(Balls[sparkIdx].pos.x, Balls[sparkIdx].pos.y, Balls[sparkIdx].pos.z);
			ballMatrix.scale(new THREE.Vector3(0.3, 0.3, 0.3)); // Make sparks smaller
			ballInstancedMesh.setMatrixAt(Balls[sparkIdx].instanceId, ballMatrix);
		}
		
		ballInstancedMesh.instanceMatrix.needsUpdate = true;
		ballInstancedMesh.instanceColor.needsUpdate = true;
	}
	
	explode() {
		// Recalculate cluster center from current positions
		this.clusterCenter.set(0, 0, 0);
		let count = 0;
		for (let i = this.startIndex; i < this.startIndex + this.particleCount; i++) {
			if (Balls[i] && Balls[i].active) {
				this.clusterCenter.add(Balls[i].pos);
				count++;
			}
		}
		if (count > 0) {
			this.clusterCenter.divideScalar(count);
		}

		let blastSpeed = 1 + Math.random() * 1;
		var explosionSize = 1 + Math.random() * maxExplosionSize; // Base velocity magnitude for explosion particles
		for (let i = this.startIndex; i < this.startIndex + this.particleCount; i++) {
			if (!Balls[i]) continue;
			
			Balls[i].active = true;
			Balls[i].hasExploded = true;
			Balls[i].age = 0;
			Balls[i].brightness = 1.0;
			//Balls[i].speedMultiplier = 2;
			//Balls[i].speedMultiplier = 0.7 + Math.random() * 0.6;
			Balls[i].speedMultiplier = 2.0 + (-0.5 + Math.random()) * 0.1;
			Balls[i].lifetime = blastSpeed + Math.random() * 2.0;
			
			// NOW set to mortar's color for explosion
			Balls[i].baseColor = this.particleColor.clone();
			Balls[i].updateColorWithBrightness();
			
			// Create random spherical explosion direction (not based on particle position)
			let theta = Math.random() * Math.PI * 2; // Azimuthal angle (0 to 2π)
			let phi = Math.acos(2 * Math.random() - 1); // Polar angle (0 to π) - uniform distribution
			let dir = new THREE.Vector3(
				Math.sin(phi) * Math.cos(theta),
				Math.cos(phi),
				Math.sin(phi) * Math.sin(theta)
			);
			
			var explosionSpeed = explosionSize + Math.random() * explosionUniformity; // Velocity magnitude with some randomness
			
			dir.normalize();
			dir.multiplyScalar(explosionSpeed * Balls[i].speedMultiplier);
			Balls[i].vel.copy(dir);
		}
		
		// Create shock wave at explosion center
		if (shockWaveMeshPool.length > 0) {
			const mesh = shockWaveMeshPool.pop();
			const shockWave = new ShockWave(this.clusterCenter);
			shockWave.mesh = mesh;
			shockWaves.push(shockWave);
		}
		
		// Flash the explosion light
		if (explosionLight) {
			explosionLightIntensity = explosionLightBrightIntensity;
			explosionLight.intensity = explosionLightIntensity;
		}
		
		// Update instance colors on GPU
		ballInstancedMesh.instanceColor.needsUpdate = true;
	}
}

// Ball Class -------------------------------------------
var nextBallId = 0;
class BALL {
	constructor(pos, vel, radius, color){
		this.id = nextBallId++;
		this.instanceId = this.id; // For instanced rendering
		this.pos = new THREE.Vector3(pos.x, pos.y, pos.z);
		this.vel = new THREE.Vector3(vel.x, vel.y, vel.z);
		this.radius = radius;
		this.color = color;
		this.baseColor = color.clone(); // Store base color for brightness calculations
		this.mass = 4.0 * Math.PI / 3.0 * radius * radius * radius;
		this.grabbed = false;
		this.brightness = 1.0; // Starts at full brightness
		this.active = true; // Track if particle is active
		this.age = 0; // Time since explosion/creation
		this.hasExploded = false; // Track if this particle has been part of an explosion
		this.isSpark = false; // Track if this is a trail spark (not main firework particle)
		
		// Add variability to speed and lifetime (firework embers burn out over time)
		this.speedMultiplier = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
		//this.speedMultiplier = 1.0;
		this.lifetime = 2.0 + Math.random() * 2.0; // 2.0 to 4.0 seconds - time until particle fades out
		
	}
	simulate(){
		if (this.grabbed || !this.active)
			return;

		// Apply air resistance damping (firework embers have high drag)
		this.vel.multiplyScalar(0.98); // Simulate air resistance
		
		// Always apply gravity during mortar flight (before explosion), then respect user toggle after explosion
		if (gravityEnabled || !this.hasExploded) {
			this.vel.y += Gravity * DeltaT;
		}
		this.pos.addScaledVector(this.vel, DeltaT);

		// Limit maximum speed
		let speed = this.vel.length();
		
		// Age particles after explosion OR if it's a spark
		if (this.hasExploded || this.isSpark) {
			this.age += DeltaT;
			
			// Remove sparks immediately when they exceed lifetime
			if (this.isSpark && this.age >= this.lifetime) {
				this.active = false;
				sparkPool.push(this.instanceId);
				// Scale to zero to hide it
				ballMatrix.makeScale(0, 0, 0);
				ballInstancedMesh.setMatrixAt(this.instanceId, ballMatrix);
				return; // Skip rendering this frame
			}
			
			// Brightness fades from 1.0 to 0.5 (still somewhat bright when extinguishing)
			// Sparks fade to 0 (completely disappear)
			let minBrightness = this.isSpark ? 0 : 0.5;
			this.brightness = Math.max(minBrightness, 1.0 - (this.age / this.lifetime));
		}
		
		// Always update color with brightness (even during mortar flight)
		this.updateColorWithBrightness();
		
		// Update instance matrix for rendering
		if (ballInstancedMesh && this.instanceId < numBalls) {
			ballMatrix.makeTranslation(this.pos.x, this.pos.y, this.pos.z);
			// Make sparks smaller than regular particles
			if (this.isSpark) {
				let sparkScale = 0.8;
				ballMatrix.scale(new THREE.Vector3(sparkScale, sparkScale, sparkScale));
			}
			ballInstancedMesh.setMatrixAt(this.instanceId, ballMatrix);
		}
	}
	
	
	updateColorWithBrightness() {
		// Use this particle's base color and fade with brightness
		if (!this.baseColor) {
			this.baseColor = new THREE.Color(0xff8800); // Default orange if not set
		}
		
		this.color.setRGB(
			this.baseColor.r * this.brightness,
			this.baseColor.g * this.brightness,
			this.baseColor.b * this.brightness
		);
		
		if (ballInstancedMesh && this.instanceId < numBalls) {
			ballInstancedMesh.setColorAt(this.instanceId, this.color);
		}
	}
}

// Shock Wave Class -------------------------------------------
class ShockWave {
	constructor(position) {
		this.position = position.clone();
		this.age = 0;
		this.lifetime = 0.05; // 
		this.startRadius = 0.0;
		this.maxRadius = 2.0; // Maximum expansion radius
		this.active = true;
		this.mesh = null; // Will be assigned from pool
	}
	
	update(deltaTime) {
		if (!this.active) return;
		
		this.age += deltaTime;
		
		if (this.age >= this.lifetime) {
			this.active = false;
			if (this.mesh) {
				this.mesh.visible = false;
			}
			return;
		}
		
		// Calculate expansion progress (0 to 1)
		const progress = this.age / this.lifetime;
		
		// Expand radius (very fast flash-like expansion)
		const radius = this.startRadius + (this.maxRadius - this.startRadius) * Math.pow(progress, 0.3);
		
		// Fade opacity (start at 0.5, fade to 0)
		const opacity = 0.6 - (0.5 * progress);
		
		// Update mesh
		if (this.mesh) {
			this.mesh.position.copy(this.position);
			this.mesh.scale.setScalar(radius);
			this.mesh.material.opacity = opacity;
			this.mesh.visible = true;
		}
	}
}

// Spatial Hash Grid for efficient collision detection -------------------------------------------
// Optimized with integer hashing instead of string keys
class SpatialHashGrid {
	constructor(cellSize) {
		this.cellSize = cellSize;
		this.grid = new Map();
	}
	
	clear() {
		this.grid.clear();
	}
	
	// Hash function that generates integer keys from coordinates (much faster than strings)
	hashCoords(xi, yi, zi) {
		// Use prime numbers for better distribution
		const h = (xi * 73856093) ^ (yi * 19349663) ^ (zi * 83492791);
		return h;
	}
	
	getKey(x, y, z) {
		const xi = Math.floor(x / this.cellSize);
		const yi = Math.floor(y / this.cellSize);
		const zi = Math.floor(z / this.cellSize);
		return this.hashCoords(xi, yi, zi);
	}
	
	insert(ball) {
		const key = this.getKey(ball.pos.x, ball.pos.y, ball.pos.z);
		if (!this.grid.has(key)) {
			this.grid.set(key, []);
		}
		this.grid.get(key).push(ball);
	}
	
	getNearby(ball) {
		const nearby = [];
		const cx = Math.floor(ball.pos.x / this.cellSize);
		const cy = Math.floor(ball.pos.y / this.cellSize);
		const cz = Math.floor(ball.pos.z / this.cellSize);
		
		// Check all 27 neighboring cells (including the center cell)
		for (let dx = -1; dx <= 1; dx++) {
			for (let dy = -1; dy <= 1; dy++) {
				for (let dz = -1; dz <= 1; dz++) {
					const key = this.hashCoords(cx + dx, cy + dy, cz + dz);
					const cellBalls = this.grid.get(key);
					if (cellBalls) {
						nearby.push(...cellBalls);
					}
				}
			}
		}
		return nearby;
	}
}

var spatialGrid = new SpatialHashGrid(0.5); // Cell size based on typical ball radius

// Loading progress update function
function updateLoadingProgress() {
	loadedResources++;
	loadingProgress = (loadedResources / totalResources) * 100;
	const progressBarFill = document.getElementById('progress-bar-fill');
	if (progressBarFill) {
		progressBarFill.style.width = loadingProgress + '%';
	}
	console.log('Loading progress: ' + loadingProgress.toFixed(0) + '%');
	
	// Check if all resources loaded
	if (loadedResources >= totalResources) {
		loadingComplete = true;
	}
}

// ------------------------------------------------------------------
function initScene() {	
	// Create instanced mesh for all balls (single draw call)
	if (ballInstancedMesh) {
		gThreeScene.remove(ballInstancedMesh);
		ballInstancedMesh.geometry.dispose();
		ballInstancedMesh.material.dispose();
	}
	
	const ballGeometry = new THREE.SphereGeometry(ballRadius, 8, 8);
	
	// Material type for balls (based on gBallMaterialMode)
	var ballMaterial;
	if (gBallMaterialMode === 0) {
		// Basic
		ballMaterial = new THREE.MeshBasicMaterial({
			side: THREE.FrontSide
		});
	} else if (gBallMaterialMode === 1) {
		// Plastic
		ballMaterial = new THREE.MeshPhongMaterial({
			roughness: 0.5,
			metalness: 0.0,
			side: THREE.FrontSide
		});
	} else if (gBallMaterialMode === 2) {
		// Metallic
		ballMaterial = new THREE.MeshStandardMaterial({
			roughness: 0.5,
			metalness: 0.5,
			side: THREE.FrontSide
		});
	} else if (gBallMaterialMode === 3) {
		// Normal
		ballMaterial = new THREE.MeshNormalMaterial({
			side: THREE.FrontSide
		});
	}

	ballInstancedMesh = new THREE.InstancedMesh(ballGeometry, ballMaterial, numBalls);
	ballInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
	
	// Force instance color support
	if (!ballInstancedMesh.instanceColor) {
		const colors = [];
		for (let i = 0; i < numBalls; i++) {
			colors.push(1, 1, 1); // Initialize to white
		}
		ballInstancedMesh.instanceColor = new THREE.InstancedBufferAttribute(
			new Float32Array(colors),
			3
		);
		ballInstancedMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
	}
	
	gThreeScene.add(ballInstancedMesh);
	
	// Create shock wave mesh pool
	const shockWaveGeometry = new THREE.SphereGeometry(1, 16, 16); // Unit sphere, will be scaled
	const shockWaveMaterial = new THREE.MeshBasicMaterial({
		color: 0xffffff,
		transparent: true,
		opacity: 1.0,
		side: THREE.FrontSide
	});
	
	for (let i = 0; i < maxShockWaves; i++) {
		const mesh = new THREE.Mesh(shockWaveGeometry, shockWaveMaterial.clone());
		mesh.visible = false;
		gThreeScene.add(mesh);
		shockWaveMeshPool.push(mesh);
	}
	
	// Create 5x5 grid of mortars with different colors
	nextBallId = 0;
	Balls = new Array(numBalls); // Pre-allocate array
	Mortars = [];

	const mortarColors = [
		new THREE.Color(0xff8800), // Orange
		new THREE.Color(0xff0000), // Red
		new THREE.Color(0x00ff00), // Green
		new THREE.Color(0x0088ff), // Blue
		new THREE.Color(0xff00ff), // Magenta
		new THREE.Color(0xffff00), // Yellow
		new THREE.Color(0x00ffff), // Cyan
		new THREE.Color(0xff8888), // Pink
		new THREE.Color(0xffffff)  // White
	];
	
	// Create mortars in elliptical rings to fit on narrow barge deck: 1 center + 8 in ring 1 + 16 in ring 2
	let mortarIndex = 0;
	let mortarPositions = [];
	
	// Barge deck height and ellipse dimensions
	const deckHeight = 1.0; // Height of barge deck
	const ellipseRadiusX = 1.1; // Narrow width (cross-deck)
	const ellipseRadiusZ = 3.0; // Long length (along deck)
	
	// Center mortar
	mortarPositions.push(new THREE.Vector3(0, deckHeight, 0));
	
	// First elliptical ring: 8 mortars
	for (let i = 0; i < 8; i++) {
		let angle = (i / 8) * Math.PI * 2;
		let x = Math.cos(angle) * ellipseRadiusX;
		let z = Math.sin(angle) * ellipseRadiusZ;
		mortarPositions.push(new THREE.Vector3(x, deckHeight, z));
	}
	
	// Second elliptical ring: 16 mortars
	for (let i = 0; i < 16; i++) {
		let angle = (i / 16) * Math.PI * 2;
		let x = Math.cos(angle) * ellipseRadiusX * 1.8;
		let z = Math.sin(angle) * ellipseRadiusZ * 1.8;
		mortarPositions.push(new THREE.Vector3(x, deckHeight, z));
	}
	
	// Create mortars at each position
	for (let i = 0; i < mortarPositions.length; i++) {
		let color = mortarColors[mortarIndex % mortarColors.length];
		let startIndex = mortarIndex * particlesPerMortar;
		let mortar = new MORTAR(mortarPositions[i], color, startIndex, particlesPerMortar, i);
		Mortars.push(mortar);
		mortarIndex++;
		// Initialize tube flash timer
		tubeFlashTimers.push(0);
	}
	
	// Initialize spark pool (indices after mortar particles)
	sparkPool = [];
	const mortarParticleCount = Mortars.length * particlesPerMortar;
	for (let i = mortarParticleCount; i < numBalls; i++) {
		sparkPool.push(i);
		// Create dummy spark particles (will be configured when spawned)
		let pos = new THREE.Vector3(0, -100, 0); // Hide off-screen
		let vel = new THREE.Vector3(0, 0, 0);
		let dummyBall = new BALL(pos, vel, 0.01, new THREE.Color(0xffffff));
		dummyBall.active = false;
		dummyBall.isSpark = true;
		Balls[i] = dummyBall;
	}
	
	// Initialize all instance matrices and colors
	for (let i = 0; i < Balls.length; i++) {
		if (Balls[i]) {
			if (Balls[i].active) {
				ballMatrix.makeTranslation(Balls[i].pos.x, Balls[i].pos.y, Balls[i].pos.z);
				ballInstancedMesh.setMatrixAt(i, ballMatrix);
			} else {
				// Hide inactive particles
				ballMatrix.makeScale(0, 0, 0);
				ballInstancedMesh.setMatrixAt(i, ballMatrix);
			}
			Balls[i].updateColorWithBrightness();
		}
	}
	ballInstancedMesh.instanceMatrix.needsUpdate = true;
	ballInstancedMesh.instanceColor.needsUpdate = true;
	
	// Set initial random launch time
	nextLaunchTime = 0;
	timeSinceLastLaunch = 0;
	
	// Load instructions image
	mouseControlsImage = new Image();
	mouseControlsImage.onload = function() {
		mouseControlsImageLoaded = true;
		needsMenuRedraw = true;
	};
	mouseControlsImage.onerror = function() {
		console.error("Failed to load instructions image");
		mouseControlsImageLoaded = false;
	};
	mouseControlsImage.src = 'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/manualOrbitMouseControls.png';
	
	// Load camera help images
	manualOrbitImage = new Image();
	manualOrbitImage.onload = function() {
		manualOrbitImageLoaded = true;
		needsMenuRedraw = true;
	};
	manualOrbitImage.onerror = function() {
		console.error("Failed to load manual orbit image");
		manualOrbitImageLoaded = false;
	};
	manualOrbitImage.src = 'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/manualOrbitMouseControls.png';
	
	autoOrbitImage = new Image();
	autoOrbitImage.onload = function() {
		autoOrbitImageLoaded = true;
		needsMenuRedraw = true;
	};
	autoOrbitImage.onerror = function() {
		console.error("Failed to load auto orbit image");
		autoOrbitImageLoaded = false;
	};
	autoOrbitImage.src = 'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/autoOrbitMouseControls.png';
	
	vehicleImage = new Image();
	vehicleImage.onload = function() {
		vehicleImageLoaded = true;
		needsMenuRedraw = true;
	};
	vehicleImage.onerror = function() {
		console.error("Failed to load vehicle image");
		vehicleImageLoaded = false;
	};
	vehicleImage.src = 'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/vehicleMouseControls.png';

}
	
// ------------------------------------------
// Update ball geometry when radius changes
function updateBallGeometry() {
	if (!ballInstancedMesh || !gThreeScene) return;
	
	// Store current instance matrix and colors
	const oldMatrix = ballInstancedMesh.instanceMatrix.clone();
	const oldColor = ballInstancedMesh.instanceColor ? ballInstancedMesh.instanceColor.clone() : null;
	
	// Remove old mesh
	gThreeScene.remove(ballInstancedMesh);
	ballInstancedMesh.geometry.dispose();
	
	// Create new geometry with updated radius
	const ballGeometry = new THREE.SphereGeometry(ballRadius, 8, 8);
	
	// Reuse the same material
	const ballMaterial = ballInstancedMesh.material;
	
	// Create new instanced mesh
	ballInstancedMesh = new THREE.InstancedMesh(ballGeometry, ballMaterial, numBalls);
	ballInstancedMesh.instanceMatrix = oldMatrix;
	ballInstancedMesh.instanceMatrix.needsUpdate = true;
	
	// Restore instance colors
	if (oldColor) {
		ballInstancedMesh.instanceColor = oldColor;
		ballInstancedMesh.instanceColor.needsUpdate = true;
	}
	
	gThreeScene.add(ballInstancedMesh);
}

// ------------------------------------------
// Change ball material
function changeBallMaterial(materialMode) {
	if (!ballInstancedMesh || !gThreeScene) return;
	
	// Store current instance matrix and colors
	const oldMatrix = ballInstancedMesh.instanceMatrix.clone();
	const oldColor = ballInstancedMesh.instanceColor ? ballInstancedMesh.instanceColor.clone() : null;
	const oldGeometry = ballInstancedMesh.geometry;
	
	// Dispose old material
	ballInstancedMesh.material.dispose();
	
	// Create new material based on mode
	let ballMaterial;
	if (materialMode === 0) {
		// Basic
		ballMaterial = new THREE.MeshBasicMaterial({
			side: THREE.FrontSide
		});
	} else if (materialMode === 1) {
		// Plastic
		ballMaterial = new THREE.MeshPhongMaterial({
			roughness: 0.5,
			metalness: 0.0,
			side: THREE.FrontSide
		});
	} else if (materialMode === 2) {
		// Metallic
		ballMaterial = new THREE.MeshStandardMaterial({
			roughness: 0.5,
			metalness: 0.5,
			side: THREE.FrontSide
		});
	} else if (materialMode === 3) {
		// Normal
		ballMaterial = new THREE.MeshNormalMaterial({
			side: THREE.FrontSide
		});
	}
	
	// Remove old mesh
	gThreeScene.remove(ballInstancedMesh);
	
	// Create new instanced mesh with new material
	ballInstancedMesh = new THREE.InstancedMesh(oldGeometry, ballMaterial, numBalls);
	ballInstancedMesh.instanceMatrix = oldMatrix;
	ballInstancedMesh.instanceMatrix.needsUpdate = true;
	
	// Restore instance colors (not used by Normal material, but keep for others)
	if (oldColor) {
		ballInstancedMesh.instanceColor = oldColor;
		ballInstancedMesh.instanceColor.needsUpdate = true;
	}
	
	gThreeScene.add(ballInstancedMesh);
}

// ------------------------------------------
function initThreeScene() {
	gThreeScene = new THREE.Scene();
	gThreeScene.background = new THREE.Color(0x000000);

	// LOAD DOWNTOWN --------------------------------------
	var cityscapeLoader = new THREE.GLTFLoader();
	cityscapeLoader.load(
		'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/HudsonView.gltf',
		function(gltf) {
			cityscapeModelTemplate = gltf.scene;
			cityscapeModelTemplate.position.set(-20, -0.1, -35);
			cityscapeModelTemplate.scale.set(0.5, 0.5, 0.5);

		// Enable shadow casting and receiving on all meshes in the model
		// Replace all materials with uniform 70% gray MeshPhongMaterial
		var uniformCityscapeMaterial = new THREE.MeshPhongMaterial({
			color: 0x666666, // 40% gray
			side: THREE.FrontSide
		});
		
		// Special material for water objects
		var waterMaterial = new THREE.MeshStandardMaterial({
			color: 0x05060c, // #05060c dark blue
			roughness: 0.7,
			side: THREE.FrontSide
		});
		
		cityscapeModelTemplate.traverse(function(child) {
			if (child.isMesh) {
				child.castShadow = true;
				child.receiveShadow = true;
				// Don't override material for warningLight - keep its original material
				if (child.name !== 'warningLight') {
					// Check if this is a water object
					if (child.name.toLowerCase().includes('water')) {
						child.material = waterMaterial;
					} else {
						// Replace material with uniform gray
						child.material = uniformCityscapeMaterial;
					}
				}
			}
		});

			gThreeScene.add(cityscapeModelTemplate);
			console.log('cityscape model loaded successfully');
			updateLoadingProgress();
		},
		function(xhr) {
			console.log('cityscape model: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
		},
		function(error) {
			console.error('Error loading cityscape model:', error);
		}
	);

	// LOAD MIDTOWN --------------------------------------
	var cityscapeNorthLoader = new THREE.GLTFLoader();
	cityscapeNorthLoader.load(
		'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/HudsonViewNorth.gltf',
		function(gltf) {
			cityscapeNorthModelTemplate = gltf.scene;
			cityscapeNorthModelTemplate.position.set(31.75, -0.1, -146.5);
			cityscapeNorthModelTemplate.scale.set(0.5, 0.5, 0.5);

			// Enable shadow casting and receiving on all meshes in the model
		// Replace all materials with uniform 70% gray MeshPhongMaterial
		var uniformCityscapeMaterialNorth = new THREE.MeshPhongMaterial({
			color: 0x666666, // 40% gray
			side: THREE.FrontSide
		});
		
		cityscapeNorthModelTemplate.traverse(function(child) {
			if (child.isMesh) {
				child.castShadow = true;
				child.receiveShadow = true;
				// Don't override material for warningLight - keep its original material
				if (child.name !== 'warningLight') {
					// Check if this is a water object
					if (child.name.toLowerCase().includes('water')) {
						child.material = waterMaterialNorth;
					} else {
						// Replace material with uniform gray
						child.material = uniformCityscapeMaterialNorth;
					}
				}
			}
		});

			gThreeScene.add(cityscapeNorthModelTemplate);
			console.log('cityscape north model loaded successfully');
			updateLoadingProgress();
		},
		function(xhr) {
			console.log('cityscape north model: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
		},
		function(error) {
			console.error('Error loading cityscape north model:', error);
		}
	);

	// LOAD STATUE --------------------------------------
	var statueLoader = new THREE.GLTFLoader();
	statueLoader.load(
		'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/SoLwithBase.gltf',
		function(gltf) {
			statueModelTemplate = gltf.scene;
			statueModelTemplate.position.set(-20, -0.1, -35);
			statueModelTemplate.scale.set(0.5, 0.5, 0.5);

			// Enable shadow casting and receiving on all meshes in the model
			statueModelTemplate.traverse(function(child) {
				if (child.isMesh) {
					child.castShadow = true;
					child.receiveShadow = true;
					// Set materials to FrontSide only
					if (child.material) {
						if (Array.isArray(child.material)) {
							child.material.forEach(function(mat) {
								mat.side = THREE.FrontSide;
							});
						} else {
							child.material.side = THREE.FrontSide;
						}
					}
				}
			});

			gThreeScene.add(statueModelTemplate);
			console.log('statue model loaded successfully');
			updateLoadingProgress();
		},
		function(xhr) {
			console.log('cityscape model: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
		},
		function(error) {
			console.error('Error loading cityscape model:', error);
		}
	);

	

	// LOAD HELICOPTER --------------------------------------
	var helicopterLoader = new THREE.GLTFLoader();
	helicopterLoader.load(
		'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/searchlightHelicopter.gltf',
		function(gltf) {
			helicopterModelTemplate = gltf.scene;
			// Initial position will be set by animation loop
			var x = helicopterCenterX + Math.cos(helicopterAngle) * helicopterOvalRadiusX;
			var z = helicopterCenterZ + Math.sin(helicopterAngle) * helicopterOvalRadiusZ;
			helicopterModelTemplate.position.set(x, helicopterHeight, z);
			helicopterModelTemplate.scale.set(0.5, 0.5, 0.5);

			// Enable shadow casting and receiving on all meshes in the model
			helicopterModelTemplate.traverse(function(child) {
				if (child.name === 'mainRotor') {
					mainRotor = child;
					console.log('Found mainRotor');
				}
				if (child.name === 'spotlightBase') {
					spotlightBase = child;
					console.log('Found spotlightBase');
				}
				if (child.name === 'rotateGimbalY') {
					rotateGimbalY = child;
					console.log('Found rotateGimbalY');
				}
				if (child.name === 'rotateGimbalZ') {
					rotateGimbalZ = child;
					console.log('Found rotateGimbalZ');
				}
				if (child.isMesh) {
					child.castShadow = true;
					child.receiveShadow = true;
					
				// Store all helicopter meshes for darkening in cab view
				helicopterInteriorMeshes.push(child);
				helicopterInteriorOriginalMaterials.push(child.material.clone());
					
					// Set materials to FrontSide only
					if (child.material) {
						if (Array.isArray(child.material)) {
							child.material.forEach(function(mat) {
								mat.side = THREE.FrontSide;
							});
						} else {
							child.material.side = THREE.FrontSide;
						}
					}
				}
			});
			
			// Create and attach spotlight to spotlightBase
			if (spotlightBase) {
				helicopterSpotlight = new THREE.SpotLight(0xffffff, 2.0);
				helicopterSpotlight.angle = Math.PI / 32;
				helicopterSpotlight.penumbra = 0.2;
				helicopterSpotlight.distance = 200;
				helicopterSpotlight.castShadow = true;
				helicopterSpotlight.shadow.camera.near = 40;
				helicopterSpotlight.shadow.camera.far = 70;
				helicopterSpotlight.shadow.camera.fov = 20;
				helicopterSpotlight.shadow.mapSize.width = 2048;
				helicopterSpotlight.shadow.mapSize.height = 2048;
				helicopterSpotlight.shadow.bias = -0.0005;
				
				// Attach spotlight to spotlightBase (points downward in local space)
				spotlightBase.add(helicopterSpotlight);
				gThreeScene.add(helicopterSpotlight.target);
				helicopterSpotlight.target.position.copy(spotlightTarget);
				
				// Create physical cone to represent the spotlight beam
				var coneLength = 500; 
				var coneRadius = Math.tan(helicopterSpotlight.angle) * coneLength;
				var coneGeometry = new THREE.ConeGeometry(coneRadius, coneLength, 32, 1, true);
				
				// Create gradient texture for fade effect
				var canvas = document.createElement('canvas');
				canvas.width = 1;
				canvas.height = 256;
				var ctx = canvas.getContext('2d');
				var gradient = ctx.createLinearGradient(0, 0, 0, 256);
				gradient.addColorStop(0, 'rgba(255, 255, 255, 0.05)'); // More opaque at narrow end
				gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)'); // Transparent at wide end
				ctx.fillStyle = gradient;
				ctx.fillRect(0, 0, 1, 256);
				var gradientTexture = new THREE.CanvasTexture(canvas);
				
				var coneMaterial = new THREE.MeshBasicMaterial({ 
					map: gradientTexture,
					transparent: true,
					side: THREE.DoubleSide,
					depthWrite: false,
					opacity: 1.0
				});
				spotlightCone = new THREE.Mesh(coneGeometry, coneMaterial);
				spotlightCone.position.y = -coneLength / 2;
				
				spotlightBase.add(spotlightCone);
				
				console.log('Helicopter spotlight created and attached');
			}
			
			// Create ghost 'debug' sphere for helicopter cab camera position
			var ghostSphereGeometry = new THREE.SphereGeometry(0.3, 16, 16);
			var ghostSphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: false });
			helicopterCameraGhostSphere = new THREE.Mesh(ghostSphereGeometry, ghostSphereMaterial);
			helicopterCameraGhostSphere.position.copy(helicopterCabCameraOffset);
			helicopterCameraGhostSphere.visible = false; // Hidden but used for positioning
			helicopterModelTemplate.add(helicopterCameraGhostSphere);
			
			// Create red cabin light (initially off)
			helicopterCabinLight = new THREE.PointLight(0xff0000, 0, 5); // Red light, intensity 0 (off), distance 5
			helicopterCabinLight.position.copy(helicopterCabCameraOffset); // Position at camera location
			helicopterCabinLight.position.y += 0.5; // Slightly above camera
			helicopterModelTemplate.add(helicopterCabinLight);
			console.log('Helicopter cabin light created');
			
			gThreeScene.add(helicopterModelTemplate);
			console.log('helicopter model loaded successfully');
			
			updateLoadingProgress();
		},
		function(xhr) {
			console.log('helicopter model: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
		},
		function(error) {
			console.error('Error loading helicopter model:', error);
		}
	);

	// LOAD SAILBOAT --------------------------------------
	var sailboatLoader = new THREE.GLTFLoader();
	sailboatLoader.load(
		'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/Sailboat1.gltf',
		function(gltf) {
			sailboatModelTemplate = gltf.scene;
			sailboatModelTemplate.scale.set(0.08, 0.08, 0.08);
			
			// Set initial position before animation starts
			var initialX = sailboatCenterX + Math.cos(sailboatAngle) * sailboatOvalRadiusX;
			var initialZ = sailboatCenterZ + Math.sin(sailboatAngle) * sailboatOvalRadiusZ;
			var initialDx = -Math.sin(sailboatAngle) * sailboatOvalRadiusX;
			var initialDz = Math.cos(sailboatAngle) * sailboatOvalRadiusZ;
			var initialHeading = Math.atan2(initialDx, initialDz) - Math.PI / 2;
			var initialOffsetX = initialX + Math.sin(initialHeading) * sailboatPivotOffset;
			var initialOffsetZ = initialZ + Math.cos(initialHeading) * sailboatPivotOffset;
			sailboatModelTemplate.position.set(initialOffsetX, sailboatHeight, initialOffsetZ);
			sailboatModelTemplate.rotation.y = initialHeading;

			// Enable shadow casting and receiving on all meshes in the model
			sailboatModelTemplate.traverse(function(child) {
				if (child.isMesh) {
					child.castShadow = true;
					child.receiveShadow = true;
					
					// Replace material with MeshPhongMaterial
					if (child.material) {
						var oldMaterial = child.material;
						var materialConfig = {
							color: oldMaterial.color || 0xb3b3b3
						};
						
						// Make sails double-sided so they're visible from both sides
						if (child.name === 'foreSail' || child.name === 'aftSail') {
							materialConfig.side = THREE.DoubleSide;
							materialConfig.color = 0xbe1414; // red sails
						}

						
						var newMaterial = new THREE.MeshPhongMaterial(materialConfig);
						child.material = newMaterial;
					}
				}
				if (child.name === 'sailboatCamPoint') {
					sailboatCamPoint = child;
					console.log('Found sailboatCamPoint');
				}
			});

			gThreeScene.add(sailboatModelTemplate);
			console.log('sailboat model loaded successfully');
			updateLoadingProgress();
		},
		function(xhr) {
			console.log('sailboat model: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
		},
		function(error) {
			console.error('Error loading sailboat model:', error);
		}
	);

	// LOAD BARGE --------------------------------------
	var bargeLoader = new THREE.GLTFLoader();
	bargeLoader.load(
		'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/riverBarge.gltf',
		function(gltf) {
			bargeModelTemplate = gltf.scene;
			bargeModelTemplate.position.set(0, 0, 0);
			bargeModelTemplate.rotation.y = -0.5 * Math.PI; 
			bargeModelTemplate.scale.set(0.4, 0.4, 0.4);
			bargeModelTemplate.castShadow = true;
			bargeModelTemplate.receiveShadow = true;
			
			var bargeMaterial = new THREE.MeshPhongMaterial({
			//color: 0x4d4d4d, // Light gray
			color: 0x3b2f2b,
			side: THREE.DoubleSide
		});

		// Set materials to DoubleSide to prevent shadow issues with thin geometry
		bargeModelTemplate.traverse(function(child) {
			if (child.isMesh) {
				// Don't override material for noSmokingSign - keep its original texture/material
				if (child.name !== 'noSmokingSign') {
					child.material = bargeMaterial;
				}
				child.castShadow = true;
				child.receiveShadow = true;
			}
			
			// Add point lights to cabin light objects
			if (child.name === 'cabinLight1') {
					var cabinLight = new THREE.PointLight(0xffaa44, 2, 10); // Warm orange-yellow, intensity 1.5, distance 10
					//ffaa44
					cabinLight.castShadow = true;
					cabinLight.shadow.camera.near = 0.1;
					cabinLight.shadow.camera.far = 10;
					cabinLight.shadow.mapSize.width = 512;
					cabinLight.shadow.mapSize.height = 512;
					child.add(cabinLight); // Attach light to the object so it moves with it
					console.log('Added point light to ' + child.name);
				}
			});
		
			gThreeScene.add(bargeModelTemplate);
			console.log('barge model loaded successfully');
			updateLoadingProgress();
		},
		function(xhr) {
			console.log('barge model: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
		},
		function(error) {
			console.error('Error loading barge model:', error);
		}
	);


	// LOAD ZEPPELIN --------------------------------------
	var zeppelinLoader = new THREE.GLTFLoader();
	zeppelinLoader.load(
		'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/Zeppelin.gltf',
		function(gltf) {
			zeppelinModelTemplate = gltf.scene;
			zeppelinModelTemplate.position.set(0, 0, 0);
			zeppelinModelTemplate.scale.set(1.0, 1.0, 1.0);
			
			// Find propeller objects in the model hierarchy
			zeppelinModelTemplate.traverse(function(child) {
				if (child.name === 'propellerPort') {
					propellerPort = child;
					console.log('Found propellerPort');
				}
				if (child.name === 'propellerStarboard') {
					propellerStarboard = child;
					console.log('Found propellerStarboard');
				}
				if (child.name === 'zeppelinLight') {
					zeppelinLight = child;
					console.log('Found zeppelinLight');
					
					// Create and attach point light
					var zeppelinPointLight = new THREE.PointLight(0xffcc88, 1.0, 15);
					zeppelinPointLight.castShadow = true;
					zeppelinPointLight.shadow.camera.near = 0.1;
					zeppelinPointLight.shadow.camera.far = 15;
					zeppelinPointLight.shadow.mapSize.width = 512;
					zeppelinPointLight.shadow.mapSize.height = 512;
					child.add(zeppelinPointLight);
					console.log('Added point light to zeppelinLight');
				}
				if (child.name === 'zeppelinCamPoint') {
					zeppelinCamPoint = child;
					console.log('Found zeppelinCamPoint');
				}
				
			});

			gThreeScene.add(zeppelinModelTemplate);
			console.log('zeppelin model loaded successfully');
			updateLoadingProgress();
		},
		function(xhr) {
			console.log('zeppelin model: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
		},
		function(error) {
			console.error('Error loading zeppelin model:', error);
		}
	);
	
	// ambient light
	gThreeScene.add( new THREE.AmbientLight( 0x101010 ) );	

	// hemispheric light to simulate sky glow
	var hemiLight = new THREE.HemisphereLight( 
		0x969a9f, 
		0x39332b, 
		0.6 ); 
	gThreeScene.add( hemiLight );

	// overhead light
	var dirLight = new THREE.DirectionalLight( 0x55505a, 1.0 );
	dirLight.position.set( 0, 10, 0 );
	dirLight.castShadow = false;
	dirLight.shadow.camera.near = 1;
	dirLight.shadow.camera.far = worldSizeY + 5;
	dirLight.shadow.camera.right = worldRadius;
	dirLight.shadow.camera.left = -worldRadius;
	dirLight.shadow.camera.top	= worldRadius;
	dirLight.shadow.camera.bottom = -worldRadius;
	dirLight.shadow.mapSize.width = 1024;
	dirLight.shadow.mapSize.height = 1024;
	gThreeScene.add( dirLight );

	// directional light to simulate moonlight
	var dirLight = new THREE.DirectionalLight( 0x999999, 0.5 );
	dirLight.position.set( -30, 50, -30 );
	dirLight.castShadow = false; // Disable to avoid shadow conflicts with spotlight
	dirLight.shadow.camera.near = 1;
	dirLight.shadow.camera.far = worldSizeY + 5;
	dirLight.shadow.camera.right = worldRadius;
	dirLight.shadow.camera.left = -worldRadius;
	dirLight.shadow.camera.top	= worldRadius;
	dirLight.shadow.camera.bottom = -worldRadius;
	dirLight.shadow.mapSize.width = 1024;
	dirLight.shadow.mapSize.height = 1024;
	gThreeScene.add( dirLight );

	// OLD SPOTLIGHT CODE - Now using helicopter-mounted spotlight with gimbal
	// The spotlight is created and attached in the helicopter loader above

	// Explosion point light at center of fireworks
	explosionLight = new THREE.PointLight( 0xffaa66, explosionLightDimIntensity, 200 );
	explosionLight.position.set( 0, 20, 0 ); // Center above barge where fireworks explode
	explosionLight.castShadow = true;
	explosionLight.shadow.camera.near = 0.1;
	explosionLight.shadow.camera.far = 200;
	explosionLight.shadow.mapSize.width = 1024;
	explosionLight.shadow.mapSize.height = 1024;
	gThreeScene.add( explosionLight );

	// create round floor plane with radial gradient
	var floorGeometry = new THREE.CircleGeometry(2 * worldRadius, 64);
	
	// Create canvas for radial gradient texture
	var canvas = document.createElement('canvas');
	canvas.width = 1024;
	canvas.height = 1024;
	var ctx = canvas.getContext('2d');
	
	// Create radial gradient from center to edge
	var gradient = ctx.createRadialGradient(512, 512, 0, 512, 512, 512);
	//gradient.addColorStop(0, '#282828');  
	gradient.addColorStop(0, '#1b1a1a');  
	gradient.addColorStop(1, '#000000');  // Black at edge
	
	// Fill canvas with gradient
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, 1024, 1024);
	
	// Create texture from canvas
	var floorTexture = new THREE.CanvasTexture(canvas);
	var floorMaterial = new THREE.MeshPhongMaterial({ 
		map: floorTexture,
		side: THREE.FrontSide
	});
	var floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
	floorMesh.rotation.x = -Math.PI / 2;
	floorMesh.position.set(0, -1, 0);
	floorMesh.receiveShadow = true;
	gThreeScene.add(floorMesh);
	
	// Create mortar tubes in concentric rings 
	var tubeHeight = 0.6;
	var tubeInnerRadius = 0.07;
	var tubeWallThickness = 0.015;
	var tubeOuterRadius = tubeInnerRadius + tubeWallThickness;
	
	// Inner tube (hollow, open-ended)
	var innerTubeGeometry = new THREE.CylinderGeometry(tubeInnerRadius, tubeInnerRadius, tubeHeight, 8, 1, true);
	// Outer tube (hollow, open-ended)
	var outerTubeGeometry = new THREE.CylinderGeometry(tubeOuterRadius, tubeOuterRadius, tubeHeight, 16, 1, true);
	// Top ring cap (connects inner and outer tube at top)
	var topCapGeometry = new THREE.RingGeometry(tubeInnerRadius, tubeOuterRadius, 32);
	// Bottom cap (disc to close bottom of tube) - slightly larger than inner radius
	var bottomCapGeometry = new THREE.CircleGeometry(tubeInnerRadius * 1.2, 32);
	
	// Inner tube material template (we'll create unique materials for each tube)
	var createInnerTubeMaterial = function() {
		return new THREE.MeshPhongMaterial({
			color: tubeNormalColor,
			emissive: new THREE.Color(0x000000),
			emissiveIntensity: 0,
			side: THREE.BackSide
		});
	};
	
	// Load texture for outer tube
	var textureLoader = new THREE.TextureLoader();
	var redStripeTexture = textureLoader.load(
		'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/redStripe.jpg',
		function() { updateLoadingProgress(); } // onLoad
	);
	redStripeTexture.wrapS = THREE.RepeatWrapping;
	redStripeTexture.wrapT = THREE.RepeatWrapping;
	
	// Outer tube material (front side - shows outer surface with texture)
	var outerTubeMaterial = new THREE.MeshPhongMaterial({
		map: redStripeTexture,
		side: THREE.FrontSide
	});
	
	// Top cap material 
	var topCapMaterial = new THREE.MeshPhongMaterial({
		color: 0x666666,
		side: THREE.FrontSide
	});
	
	// Bottom cap material 
	var bottomCapMaterial = new THREE.MeshPhongMaterial({
		color: 0x000000,
		side: THREE.DoubleSide
	});
	
	// Round base geometry (thin box)
	var baseSize = 0.2;
	var baseHeight = 0.05;
	var baseGeometry = new THREE.CylinderGeometry(baseSize, baseSize, baseHeight, 32, 1, false);
	var baseMaterial = new THREE.MeshPhongMaterial({
		color: 0x262626,  
	});
	
	// Hemisphere pivot geometry (sits on top of base)
	var hemisphereRadius = baseSize * 0.9; // Slightly smaller than base
	var hemisphereGeometry = new THREE.SphereGeometry(hemisphereRadius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
	var hemisphereMaterial = new THREE.MeshPhongMaterial({
		color: 0x444444,
	});
	
	// Barge deck height and ellipse dimensions (matching MORTAR positions)
	const deckHeight = 1.0;
	const ellipseRadiusX = 1.1;
	const ellipseRadiusZ = 3.0;
	
	// Center tube with base (create as group for dynamic rotation)
	var tubeGroup = new THREE.Group();
	tubeGroup.position.set(0, deckHeight, 0);
	
	// Inner tube
	var innerTubeMaterial0 = createInnerTubeMaterial();
	tubeMaterials.push(innerTubeMaterial0);
	var innerTubeMesh = new THREE.Mesh(innerTubeGeometry, innerTubeMaterial0);
	innerTubeMesh.position.set(0, tubeHeight / 2, 0);
	innerTubeMesh.castShadow = true;
	innerTubeMesh.receiveShadow = true;
	tubeGroup.add(innerTubeMesh);
	
	// Outer tube
	var outerTubeMesh = new THREE.Mesh(outerTubeGeometry, outerTubeMaterial);
	outerTubeMesh.position.set(0, tubeHeight / 2, 0);
	outerTubeMesh.castShadow = true;
	outerTubeMesh.receiveShadow = true;
	tubeGroup.add(outerTubeMesh);
	
	// Top cap
	var topCapMesh = new THREE.Mesh(topCapGeometry, topCapMaterial);
	topCapMesh.position.set(0, tubeHeight, 0);
	topCapMesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
	topCapMesh.castShadow = true;
	topCapMesh.receiveShadow = true;
	tubeGroup.add(topCapMesh);
	
	// Bottom cap
	var bottomCapMesh = new THREE.Mesh(bottomCapGeometry, bottomCapMaterial);
	bottomCapMesh.position.set(0, tubeHeight * 0.2, 0); // 20% up from tube bottom
	bottomCapMesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal, facing up
	bottomCapMesh.receiveShadow = true;
	tubeGroup.add(bottomCapMesh);
	
	gThreeScene.add(tubeGroup);
	tubeGroups.push(tubeGroup);
	tubePositions.push({x: 0, z: 0});
	
	// Base (fixed, doesn't rotate with tube)
	var baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
	baseMesh.position.set(0, deckHeight + baseHeight / 2, 0);
	baseMesh.castShadow = true;
	baseMesh.receiveShadow = true;
	gThreeScene.add(baseMesh);
	
	// Hemisphere pivot (fixed, doesn't rotate with tube)
	var hemisphereMesh = new THREE.Mesh(hemisphereGeometry, hemisphereMaterial);
	hemisphereMesh.position.set(0, deckHeight + baseHeight, 0);
	hemisphereMesh.castShadow = true;
	hemisphereMesh.receiveShadow = true;
	gThreeScene.add(hemisphereMesh);
	
	// First elliptical ring: 8 tubes
	for (let i = 0; i < 8; i++) {
		let angle = (i / 8) * Math.PI * 2;
		let x = Math.cos(angle) * ellipseRadiusX;
		let z = Math.sin(angle) * ellipseRadiusZ;
		
		tubeGroup = new THREE.Group();
		tubeGroup.position.set(x, deckHeight, z);
		
		// Inner tube (create unique material for flash effect)
		let innerTubeMat = createInnerTubeMaterial();
		tubeMaterials.push(innerTubeMat);
		innerTubeMesh = new THREE.Mesh(innerTubeGeometry, innerTubeMat);
		innerTubeMesh.position.set(0, tubeHeight / 2, 0);
		innerTubeMesh.castShadow = true;
		innerTubeMesh.receiveShadow = true;
		tubeGroup.add(innerTubeMesh);
		
		// Outer tube
		outerTubeMesh = new THREE.Mesh(outerTubeGeometry, outerTubeMaterial);
		outerTubeMesh.position.set(0, tubeHeight / 2, 0);
		outerTubeMesh.castShadow = true;
		outerTubeMesh.receiveShadow = true;
		tubeGroup.add(outerTubeMesh);
		
		// Top cap
		topCapMesh = new THREE.Mesh(topCapGeometry, topCapMaterial);
		topCapMesh.position.set(0, tubeHeight, 0);
		topCapMesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
		topCapMesh.castShadow = true;
		topCapMesh.receiveShadow = true;
		tubeGroup.add(topCapMesh);
		
		// Bottom cap
		bottomCapMesh = new THREE.Mesh(bottomCapGeometry, bottomCapMaterial);
		bottomCapMesh.position.set(0, tubeHeight * 0.2, 0); // 20% up from tube bottom
		bottomCapMesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal, facing up
		bottomCapMesh.receiveShadow = true;
		tubeGroup.add(bottomCapMesh);
		
		gThreeScene.add(tubeGroup);
		tubeGroups.push(tubeGroup);
		tubePositions.push({x: x, z: z});
		
		// Base (fixed, doesn't rotate with tube)
		baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
		baseMesh.position.set(x, deckHeight + baseHeight / 2, z);
		baseMesh.castShadow = true;
		baseMesh.receiveShadow = true;
		gThreeScene.add(baseMesh);
		
		// Hemisphere pivot (fixed, doesn't rotate with tube)
		hemisphereMesh = new THREE.Mesh(hemisphereGeometry, hemisphereMaterial);
		hemisphereMesh.position.set(x, deckHeight + baseHeight, z);
		hemisphereMesh.castShadow = true;
		hemisphereMesh.receiveShadow = true;
		gThreeScene.add(hemisphereMesh);
	}
	
	// Second elliptical ring: 16 tubes
	for (let i = 0; i < 16; i++) {
		let angle = (i / 16) * Math.PI * 2;
		let x = Math.cos(angle) * ellipseRadiusX * 1.8;
		let z = Math.sin(angle) * ellipseRadiusZ * 1.8;
		
		tubeGroup = new THREE.Group();
		tubeGroup.position.set(x, deckHeight, z);
		
		// Inner tube (create unique material for flash effect)
		let innerTubeMat = createInnerTubeMaterial();
		tubeMaterials.push(innerTubeMat);
		innerTubeMesh = new THREE.Mesh(innerTubeGeometry, innerTubeMat);
		innerTubeMesh.position.set(0, tubeHeight / 2, 0);
		innerTubeMesh.castShadow = true;
		innerTubeMesh.receiveShadow = true;
		tubeGroup.add(innerTubeMesh);
		
		// Outer tube
		outerTubeMesh = new THREE.Mesh(outerTubeGeometry, outerTubeMaterial);
		outerTubeMesh.position.set(0, tubeHeight / 2, 0);
		outerTubeMesh.castShadow = true;
		outerTubeMesh.receiveShadow = true;
		tubeGroup.add(outerTubeMesh);
		
		// Top cap
		topCapMesh = new THREE.Mesh(topCapGeometry, topCapMaterial);
		topCapMesh.position.set(0, tubeHeight, 0);
		topCapMesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
		topCapMesh.castShadow = true;
		topCapMesh.receiveShadow = true;
		tubeGroup.add(topCapMesh);
		
		// Bottom cap
		bottomCapMesh = new THREE.Mesh(bottomCapGeometry, bottomCapMaterial);
		bottomCapMesh.position.set(0, tubeHeight * 0.2, 0); // 20% up from tube bottom
		bottomCapMesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal, facing up
		bottomCapMesh.receiveShadow = true;
		tubeGroup.add(bottomCapMesh);
		
		gThreeScene.add(tubeGroup);
		tubeGroups.push(tubeGroup);
		tubePositions.push({x: x, z: z});
		
		// Base (fixed, doesn't rotate with tube)
		baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
		baseMesh.position.set(x, deckHeight + baseHeight / 2, z);
		baseMesh.castShadow = true;
		baseMesh.receiveShadow = true;
		gThreeScene.add(baseMesh);
		
		// Hemisphere pivot (fixed, doesn't rotate with tube)
		hemisphereMesh = new THREE.Mesh(hemisphereGeometry, hemisphereMaterial);
		hemisphereMesh.position.set(x, deckHeight + baseHeight, z);
		hemisphereMesh.castShadow = true;
		hemisphereMesh.receiveShadow = true;
		gThreeScene.add(hemisphereMesh);
	}
	
	// gRenderer
	var container = document.getElementById('container');
	gRenderer = new THREE.WebGLRenderer({ antialias: true });
	gRenderer.shadowMap.enabled = true;
	gRenderer.setPixelRatio( window.devicePixelRatio );
	gRenderer.setSize( window.innerWidth, window.innerHeight );
	window.addEventListener( 'resize', onWindowResize, false );
	container.appendChild( gRenderer.domElement );
	
	// Initialize stats.js for FPS display
	stats = new Stats();
	stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
	stats.dom.style.position = 'absolute';
	stats.dom.style.left = '0px';
	stats.dom.style.bottom = '0px';
	stats.dom.style.top = 'auto'; // Override default top positioning
	container.appendChild(stats.dom);
	gRenderTarget = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, 
		{ minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat } );

	// Camera --------------------------------------------	
	Camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
	Camera.far = 3000;
	Camera.position.set(-28.9, 13.4, 15.2);
	Camera.updateMatrixWorld();	
	gThreeScene.add(Camera);

	// Camera control
	CameraControl = new THREE.OrbitControls(Camera, gRenderer.domElement);
	CameraControl.zoomSpeed = 2.0;
	CameraControl.panSpeed = 0.4;
	CameraControl.target.set(0.0, 16.1, 0.0);
	CameraControl.enabled = true; // Enabled by default (Manual mode)
	
	// Calculate initial camera angle from current position relative to target
	const dx = Camera.position.x - CameraControl.target.x;
	const dz = Camera.position.z - CameraControl.target.z;
	gCameraAngle = Math.atan2(dz, dx);
	
	// Update tube angles initially
	updateTubeAngles();

	// Grabber
	gGrabber = new Grabber();
	container.addEventListener( 'pointerdown', onPointer, false );
	container.addEventListener( 'pointermove', onPointer, false );
	container.addEventListener( 'pointerup', onPointer, false );
	
	// Keyboard events
	window.addEventListener( 'keydown', onKeyDown, false );
	
	// Wheel event for zooming in fixed camera modes
	window.addEventListener( 'wheel', onWheel, false );
	
	// Create 2D overlay canvas for menus
	gOverlayCanvas = document.createElement('canvas');
	gOverlayCanvas.id = 'overlay-canvas'; // Give it an ID
	gOverlayCanvas.width = window.innerWidth;
	gOverlayCanvas.height = window.innerHeight;
	gOverlayCanvas.style.position = 'absolute';
	gOverlayCanvas.style.top = '0';
	gOverlayCanvas.style.left = '0';
	gOverlayCanvas.style.width = window.innerWidth + 'px'; // Explicit pixel width (not %)
	gOverlayCanvas.style.height = window.innerHeight + 'px'; // Explicit pixel height (not %)
	gOverlayCanvas.style.zIndex = '1000'; // Ensure it's on top
	gOverlayCanvas.style.pointerEvents = 'none'; // Don't block interaction with 3D scene
	container.appendChild(gOverlayCanvas);
	gOverlayCtx = gOverlayCanvas.getContext('2d');
	
	// Create loading screen overlay
	loadingScreen = document.createElement('div');
	loadingScreen.style.position = 'absolute';
	loadingScreen.style.top = '0';
	loadingScreen.style.left = '0';
	loadingScreen.style.width = '100%';
	loadingScreen.style.height = '100%';
	loadingScreen.style.backgroundColor = '#000000';
	loadingScreen.style.zIndex = '2000'; // Above everything
	loadingScreen.style.display = 'flex';
	loadingScreen.style.flexDirection = 'column';
	loadingScreen.style.justifyContent = 'center';
	loadingScreen.style.alignItems = 'center';
	loadingScreen.style.opacity = '1';
	loadingScreen.style.transition = 'opacity 1s ease-out';
	
	// Progress bar container
	const progressContainer = document.createElement('div');
	progressContainer.style.width = '300px';
	progressContainer.style.height = '20px';
	progressContainer.style.border = '2px solid #ffffff';
	progressContainer.style.borderRadius = '10px';
	progressContainer.style.overflow = 'hidden';
	progressContainer.style.backgroundColor = '#222222';
	
	// Progress bar fill
	const progressBar = document.createElement('div');
	progressBar.id = 'progress-bar-fill';
	progressBar.style.width = '0%';
	progressBar.style.height = '100%';
	progressBar.style.backgroundColor = '#4488ff';
	progressBar.style.transition = 'width 0.3s ease-out';
	
	progressContainer.appendChild(progressBar);
	loadingScreen.appendChild(progressContainer);
	container.appendChild(loadingScreen);
}

// Update mortar tube angles based on mortarTubeAngle variable
function updateTubeAngles() {
	for (let i = 0; i < tubeGroups.length; i++) {
		const tubeGroup = tubeGroups[i];
		const pos = tubePositions[i];
		
		// Center tube stays vertical
		if (pos.x === 0 && pos.z === 0) {
			tubeGroup.rotation.set(0, 0, 0);
			continue;
		}
		
		// Calculate direction away from center
		const distance = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
		const dirX = pos.x / distance;
		const dirZ = pos.z / distance;
		
		// Calculate angle in XZ plane (azimuth) - this is the direction to tilt toward
		const azimuthAngle = Math.atan2(dirX, dirZ);
		
		// Convert mortarTubeAngle from degrees to radians
		const tiltAngle = mortarTubeAngle * (Math.PI / 180);
		
		// Set rotation order to ZYX so we can tilt then rotate
		tubeGroup.rotation.order = 'ZYX';
		
		// Apply rotation: Tilt outward (X), then rotate to face direction (Y)
		tubeGroup.rotation.set(tiltAngle, azimuthAngle, 0);
	}
}

// Grabber -----------------------------------------------------------
class Grabber {
	constructor() {
		this.raycaster = new THREE.Raycaster();
		this.raycaster.layers.set(1);
		this.raycaster.params.Line.threshold = 0.1;
		this.physicsObject = null;
		this.distance = 0.0;
		this.prevPos = new THREE.Vector3();
		this.vel = new THREE.Vector3();
		this.time = 0.0;
	}
	increaseTime(dt) {
		this.time += dt;
	}
	updateRaycaster(x, y) {
		var rect = gRenderer.domElement.getBoundingClientRect();
		this.mousePos = new THREE.Vector2();
		this.mousePos.x = ((x - rect.left) / rect.width ) * 2 - 1;
		this.mousePos.y = -((y - rect.top) / rect.height ) * 2 + 1;
		this.raycaster.setFromCamera( this.mousePos, Camera );
	}
	start(x, y) {
		this.physicsObject = null;
		this.updateRaycaster(x, y);
		var intersects = this.raycaster.intersectObjects( gThreeScene.children );
		if (intersects.length > 0) {
			// For instanced mesh, find which ball was clicked
			if (intersects[0].object === ballInstancedMesh && intersects[0].instanceId !== undefined) {
				var instanceId = intersects[0].instanceId;
				if (instanceId >= 0 && instanceId < Balls.length) {
					this.physicsObject = Balls[instanceId];
					this.distance = intersects[0].distance;
				
					var pos;
					// For fixed ground objects, use ground plane projection
					if (this.physicsObject.fixed) {
						let rayOrigin = this.raycaster.ray.origin;
						let rayDir = this.raycaster.ray.direction;
						
						// Calculate intersection with ground plane (y=0)
						if (Math.abs(rayDir.y) > 0.001) {
							let t = -rayOrigin.y / rayDir.y;
							if (t > 0) {
								pos = rayOrigin.clone();
								pos.addScaledVector(rayDir, t);
								pos.y = 0;
							} else {
								pos = this.physicsObject.pos.clone();
							}
						} else {
							pos = this.physicsObject.pos.clone();
						}
					} else {
						pos = this.raycaster.ray.origin.clone();
						pos.addScaledVector(this.raycaster.ray.direction, this.distance);
					}
					
					this.physicsObject.startGrab(pos);
					this.prevPos.copy(pos);
					this.vel.set(0.0, 0.0, 0.0);
					this.time = 0.0;
				}
			}
		}
	}
	move(x, y) {
		if (this.physicsObject) {
			this.updateRaycaster(x, y);
			
			var pos;
			// For fixed ground objects, project to y=0 plane
			if (this.physicsObject.fixed) {
				// Calculate intersection with ground plane (y=0)
				let rayOrigin = this.raycaster.ray.origin;
				let rayDir = this.raycaster.ray.direction;
				
				// Solve for t where: origin.y + t * direction.y = 0
				if (Math.abs(rayDir.y) > 0.001) {
					let t = -rayOrigin.y / rayDir.y;
					if (t > 0) {
						pos = rayOrigin.clone();
						pos.addScaledVector(rayDir, t);
						pos.y = 0; // Ensure exactly on ground
					} else {
						// Ray pointing up, keep current position
						pos = this.prevPos.clone();
					}
				} else {
					// Ray parallel to ground, keep current position
					pos = this.prevPos.clone();
				}
			} else {
				// For non-fixed objects, use original fixed-distance method
				pos = this.raycaster.ray.origin.clone();
				pos.addScaledVector(this.raycaster.ray.direction, this.distance);
			}

			this.vel.copy(pos);
			this.vel.sub(this.prevPos);
			if (this.time > 0.0)
				this.vel.divideScalar(this.time);
			else
				this.vel.set(0.0, 0.0, 0.0);
			this.prevPos.copy(pos);
			this.time = 0.0;

			this.physicsObject.moveGrabbed(pos, this.vel);
		}
	}
	end(x, y) {
		if (this.physicsObject) { 
			this.physicsObject.endGrab(this.prevPos, this.vel);
			this.physicsObject = null;
		}
	}
}			

function onPointer( evt ) {
	event.preventDefault();
	if (evt.type == "pointerdown") {
		// Check for menu clicks first
		const menuHandled = onMenuClick(evt);
		if (menuHandled) return; // Don't process further if menu consumed the click
		
		// In fixed camera modes (helicopter, zeppelin, sailboat), start camera pan/tilt dragging
		if (gCameraMode === 3 || gCameraMode === 4 || gCameraMode === 5) {
			draggingCamera = true;
			dragStartMouseX = evt.clientX;
			dragStartMouseY = evt.clientY;
			gMouseDown = true;
			return;
		}
		
		gGrabber.start(evt.clientX, evt.clientY);
		gMouseDown = true;
		if (gGrabber.physicsObject) {
			CameraControl.saveState();
			CameraControl.enabled = false;
		}
	}
	else if (evt.type == "pointermove" && (gMouseDown || draggingFOVKnob || draggingOrbitSpeedKnob || draggingExplosionSizeKnob || draggingLaunchVelocityKnob || draggingMortarAngleKnob || draggingGravityKnob || draggingBallRadiusKnob || draggingCamera)) {
		// Handle camera pan/tilt dragging in fixed camera modes
		if (draggingCamera) {
			const deltaX = evt.clientX - dragStartMouseX;
			const deltaY = evt.clientY - dragStartMouseY;
			
			// Update pan (horizontal) and tilt (vertical)
			const sensitivity = 0.003; // Adjust for desired drag speed
			cameraPan -= deltaX * sensitivity; // Negative for natural drag direction
			cameraTilt += deltaY * sensitivity; // Positive for natural drag direction
			
			// Clamp tilt to prevent flipping upside down
			const maxTilt = Math.PI / 2 - 0.1; // Slightly less than 90 degrees
			cameraTilt = Math.max(-maxTilt, Math.min(maxTilt, cameraTilt));
			
			dragStartMouseX = evt.clientX;
			dragStartMouseY = evt.clientY;
			return;
		}
		
		// Handle knob dragging with linear drag method (like boids3D.js)
		if (draggingFOVKnob) {
			const deltaX = (evt.clientX - dragStartMouseX) / window.innerWidth;
			const deltaY = (evt.clientY - dragStartMouseY) / window.innerHeight;
			const dragDelta = deltaX + deltaY;
			
			const dragSensitivity = 0.1;
			const normalizedDelta = dragDelta / dragSensitivity;
			const rangeSize = 170 - 3; // FOV range: 3 to 170
			let newValue = dragStartValue - normalizedDelta * rangeSize; // Reversed
			newValue = Math.max(3, Math.min(170, newValue));
			
			gCameraFOV = newValue;
			needsMenuRedraw = true;
			return;
		}
		
		if (draggingOrbitSpeedKnob) {
			const deltaX = (evt.clientX - dragStartMouseX) / window.innerWidth;
			const deltaY = (evt.clientY - dragStartMouseY) / window.innerHeight;
			const dragDelta = deltaX + deltaY;
			
			const dragSensitivity = 0.1;
			const normalizedDelta = dragDelta / dragSensitivity;
			const rangeSize = 10.0 - 0.1; // Orbit speed range: 0.1 to 10.0
			let newValue = dragStartValue + normalizedDelta * rangeSize; // Not reversed
			newValue = Math.max(0.1, Math.min(10.0, newValue));
			
			gCameraRotationSpeed = newValue;
			needsMenuRedraw = true;
			return;
		}
		
		if (draggingExplosionSizeKnob) {
			const deltaX = (evt.clientX - dragStartMouseX) / window.innerWidth;
			const deltaY = (evt.clientY - dragStartMouseY) / window.innerHeight;
			const dragDelta = deltaX + deltaY;
			
			const dragSensitivity = 0.1;
			const normalizedDelta = dragDelta / dragSensitivity;
			const rangeSize = 15.0 - 1.0;
			let newValue = dragStartValue + normalizedDelta * rangeSize;
			newValue = Math.max(1.0, Math.min(15.0, newValue));
			
			maxExplosionSize = newValue;
			needsMenuRedraw = true;
			return;
		}
		
		if (draggingLaunchVelocityKnob) {
			const deltaX = (evt.clientX - dragStartMouseX) / window.innerWidth;
			const deltaY = (evt.clientY - dragStartMouseY) / window.innerHeight;
			const dragDelta = deltaX + deltaY;
			
			const dragSensitivity = 0.1;
			const normalizedDelta = dragDelta / dragSensitivity;
			const rangeSize = 60.0 - 15.0;
			let newValue = dragStartValue + normalizedDelta * rangeSize;
			newValue = Math.max(15.0, Math.min(60.0, newValue));
			
			minLaunchVelocity = newValue;
			needsMenuRedraw = true;
			return;
		}
		
		if (draggingMortarAngleKnob) {
			const deltaX = (evt.clientX - dragStartMouseX) / window.innerWidth;
			const deltaY = (evt.clientY - dragStartMouseY) / window.innerHeight;
			const dragDelta = deltaX + deltaY;
			
			const dragSensitivity = 0.1;
			const normalizedDelta = dragDelta / dragSensitivity;
			const rangeSize = 45.0 - 0.0;
			let newValue = dragStartValue + normalizedDelta * rangeSize;
			newValue = Math.max(0.0, Math.min(45.0, newValue));
			
			mortarTubeAngle = newValue;
			needsMenuRedraw = true;
			return;
		}
		
		if (draggingGravityKnob) {
			const deltaX = (evt.clientX - dragStartMouseX) / window.innerWidth;
			const deltaY = (evt.clientY - dragStartMouseY) / window.innerHeight;
			const dragDelta = deltaX + deltaY;
			
			const dragSensitivity = 0.1;
			const normalizedDelta = dragDelta / dragSensitivity;
			const rangeSize = 5.0 - 0.5;
			let newValue = dragStartValue + normalizedDelta * rangeSize;
			newValue = Math.max(0.5, Math.min(5.0, newValue));
			
			Gravity = -newValue; // Keep gravity negative
			needsMenuRedraw = true;
			return;
		}
		
		if (draggingBallRadiusKnob) {
			const deltaX = (evt.clientX - dragStartMouseX) / window.innerWidth;
			const deltaY = (evt.clientY - dragStartMouseY) / window.innerHeight;
			const dragDelta = deltaX + deltaY;
			
			const dragSensitivity = 0.1;
			const normalizedDelta = dragDelta / dragSensitivity;
			const rangeSize = 0.10 - 0.01;
			let newValue = dragStartValue + normalizedDelta * rangeSize;
			newValue = Math.max(0.01, Math.min(0.10, newValue));
			
			ballRadius = newValue;
			updateBallGeometry(); // Update the visual geometry
			needsMenuRedraw = true;
			return;
		}
		
		gGrabber.move(evt.clientX, evt.clientY);
	}
	else if (evt.type == "pointerup") {
		draggingFOVKnob = false;
		draggingOrbitSpeedKnob = false;
		draggingExplosionSizeKnob = false;
		draggingLaunchVelocityKnob = false;
		draggingMortarAngleKnob = false;
		draggingGravityKnob = false;
		draggingBallRadiusKnob = false;
		draggingCamera = false;
		
		if (gGrabber.physicsObject) {
			gGrabber.end();
			CameraControl.reset();
		}
		gMouseDown = false;
		
		// OrbitControls always enabled for position adjustment
		CameraControl.enabled = true;
	}
}

function onKeyDown( evt ) {
	if (evt.key === 'c' || evt.key === 'C') {
		console.log('Camera position and target:');
		console.log(`Camera.position.set(${Camera.position.x.toFixed(1)}, ${Camera.position.y.toFixed(1)}, ${Camera.position.z.toFixed(1)});`);
		console.log(`CameraControl.target.set(${CameraControl.target.x.toFixed(1)}, ${CameraControl.target.y.toFixed(1)}, ${CameraControl.target.z.toFixed(1)});`);
	}
}

function onWheel( evt ) {
	// In fixed camera modes (helicopter, zeppelin, sailboat), adjust FOV instead of camera position
	if (gCameraMode === 3 || gCameraMode === 4 || gCameraMode === 5) {
		evt.preventDefault();
		
		// Adjust FOV based on wheel delta (negative deltaY = scroll up = zoom in = smaller FOV)
		const zoomAmount = evt.deltaY * 0.05;
		gCameraFOV += zoomAmount;
		
		// Clamp FOV to valid range (3 to 170)
		gCameraFOV = Math.max(3, Math.min(170, gCameraFOV));
		
		// Update camera immediately
		Camera.fov = gCameraFOV;
		Camera.updateProjectionMatrix();
		
		// Trigger menu redraw to update knob position
		needsMenuRedraw = true;
	}
}
			
function onWindowResize() {
	Camera.aspect = window.innerWidth / window.innerHeight;
	Camera.updateProjectionMatrix();
	gRenderer.setSize( window.innerWidth, window.innerHeight );
	gRenderTarget.setSize(window.innerWidth, window.innerHeight);
	
	// Resize overlay canvas
	if (gOverlayCanvas) {
		gOverlayCanvas.width = window.innerWidth;
		gOverlayCanvas.height = window.innerHeight;
		gOverlayCanvas.style.width = window.innerWidth + 'px';
		gOverlayCanvas.style.height = window.innerHeight + 'px';
	}
}

// ------------------------------------------------------------------
function simulate() {	
	// Update tube angles based on current mortarTubeAngle setting
	updateTubeAngles();
	
	// Skip physics simulation if paused (but still animate zeppelin and propellers below)
	if (!gRunning) {
		// Animate zeppelin and propellers even when paused
		if (zeppelinModelTemplate) {
			zeppelinAngle += zeppelinSpeed * DeltaT;
			var x = zeppelinCenterX + Math.cos(zeppelinAngle) * ovalRadiusX;
			var z = zeppelinCenterZ + Math.sin(zeppelinAngle) * ovalRadiusZ;
			zeppelinModelTemplate.position.set(x, zeppelinHeight, z);
			var dx = -Math.sin(zeppelinAngle) * ovalRadiusX;
			var dz = Math.cos(zeppelinAngle) * ovalRadiusZ;
			zeppelinModelTemplate.rotation.y = Math.atan2(dx, dz) - Math.PI / 2;
		}
		if (propellerPort) propellerPort.rotation.x += propellerRotationSpeed * DeltaT;
		if (propellerStarboard) propellerStarboard.rotation.x += propellerRotationSpeed * DeltaT;
		if (mainRotor) mainRotor.rotation.z += rotorRotationSpeed * DeltaT;
		
		// Animate sailboat sailing path even when paused
		if (sailboatModelTemplate) {
			sailboatAngle += sailboatSpeed * DeltaT;
			var x = sailboatCenterX + Math.cos(sailboatAngle) * sailboatOvalRadiusX;
			var z = sailboatCenterZ + Math.sin(sailboatAngle) * sailboatOvalRadiusZ;
			
			// Calculate direction of movement (tangent to oval)
			var dx = -Math.sin(sailboatAngle) * sailboatOvalRadiusX;
			var dz = Math.cos(sailboatAngle) * sailboatOvalRadiusZ;
			
			// Orient sailboat to face direction of travel
			var headingAngle = Math.atan2(dx, dz) - Math.PI / 2;
			sailboatModelTemplate.rotation.y = headingAngle;
			
			// Offset position forward along heading so rear of boat follows the path
			var offsetX = x + Math.sin(headingAngle) * sailboatPivotOffset;
			var offsetZ = z + Math.cos(headingAngle) * sailboatPivotOffset;
			sailboatModelTemplate.position.set(offsetX, sailboatHeight, offsetZ);
		}
		
		// Animate helicopter flight path even when paused
		if (helicopterModelTemplate) {
			helicopterAngle += helicopterSpeed * DeltaT;
			var x = helicopterCenterX + Math.cos(helicopterAngle) * helicopterOvalRadiusX;
			var z = helicopterCenterZ + Math.sin(helicopterAngle) * helicopterOvalRadiusZ;
			helicopterModelTemplate.position.set(x, helicopterHeight, z);
			
			// Calculate direction of movement (tangent to oval)
			var dx = -Math.sin(helicopterAngle) * helicopterOvalRadiusX;
			var dz = Math.cos(helicopterAngle) * helicopterOvalRadiusZ;
			
			// Orient helicopter to face direction of travel
			var headingAngle = Math.atan2(dx, dz) + Math.PI; // Add 180° to correct orientation
			helicopterModelTemplate.rotation.y = headingAngle;
			
			// Calculate bank angle based on turn rate (derivative of heading)
			// Positive turn rate = turning left = bank left (negative roll)
			var turnRate = helicopterSpeed; // Angular velocity
			var bankAngle = Math.sin(helicopterAngle) * 0.15; // Bank into turns, max ~8.6 degrees
			helicopterModelTemplate.rotation.z = bankAngle;
			
			// Nose-down pitch for forward flight
			helicopterModelTemplate.rotation.x = -0.1; // ~5.7 degrees nose-down
		}
		
		// Update helicopter spotlight gimbal even when paused
		if (helicopterSpotlight && rotateGimbalY && rotateGimbalZ && spotlightBase) {
			helicopterSpotlight.target.position.copy(spotlightTarget);
			var spotlightWorldPos = new THREE.Vector3();
			spotlightBase.getWorldPosition(spotlightWorldPos);
			var toTarget = new THREE.Vector3().subVectors(spotlightTarget, spotlightWorldPos).normalize();
			
			// Calculate yaw in rotateGimbalY's parent coordinate space
			var gimbalYParent = rotateGimbalY.parent;
			var gimbalYParentInverse = new THREE.Matrix4().copy(gimbalYParent.matrixWorld).invert();
			var dirInGimbalYParent = toTarget.clone().transformDirection(gimbalYParentInverse).normalize();
			var yawAngle = Math.atan2(dirInGimbalYParent.x, dirInGimbalYParent.z) + Math.PI / 2;
			rotateGimbalY.rotation.y = yawAngle;
			
			// Update gimbalY's world matrix before calculating pitch
			rotateGimbalY.updateMatrixWorld(true);
			
			// Calculate pitch in rotateGimbalZ's parent coordinate space (which is rotateGimbalY)
			var gimbalZParentInverse = new THREE.Matrix4().copy(rotateGimbalY.matrixWorld).invert();
			var dirInGimbalZParent = toTarget.clone().transformDirection(gimbalZParentInverse).normalize();
			var pitchAngle = Math.atan2(dirInGimbalZParent.x, -dirInGimbalZParent.y);
			rotateGimbalZ.rotation.z = pitchAngle;
		}
		
		return; // Skip firework physics when paused
	}
	
	// Auto-launch mortars at random intervals
	if (autoLaunchEnabled) {
		timeSinceLastLaunch += DeltaT;
		
		if (timeSinceLastLaunch >= nextLaunchTime) {
			// Pick a random mortar that's ready to launch (all particles gone)
			let availableMortars = Mortars.filter(m => m.isReadyToLaunch());
			if (availableMortars.length > 0) {
				let randomMortar = availableMortars[Math.floor(Math.random() * availableMortars.length)];
				randomMortar.launch();
			}
			
			// Set next launch time (1 to 3 seconds)
			nextLaunchTime = 0;
			timeSinceLastLaunch = 0;
		}
	}
	
	// Update all mortars
	for (let i = 0; i < Mortars.length; i++) {
		Mortars[i].update(DeltaT);
	}
	
	// Update shock waves
	for (let i = shockWaves.length - 1; i >= 0; i--) {
		shockWaves[i].update(DeltaT);
		
		// Remove and recycle inactive shock waves
		if (!shockWaves[i].active) {
			const shockWave = shockWaves.splice(i, 1)[0];
			if (shockWave.mesh) {
				shockWaveMeshPool.push(shockWave.mesh);
			}
		}
	}
	
	// Simulate ball physics without collisions (firework particles pass through each other)
	for (let i = 0; i < Balls.length; i++) {
		if (!Balls[i] || !Balls[i].active) continue;
		
		Balls[i].simulate();
		
		// Remove particles that have exceeded their lifetime (only after explosion)
		if (Balls[i].hasExploded && Balls[i].age >= Balls[i].lifetime) {
			Balls[i].active = false;
			// Scale to zero to hide it
			ballMatrix.makeScale(0, 0, 0);
			ballInstancedMesh.setMatrixAt(Balls[i].instanceId, ballMatrix);
		}
	}
	
	// Update instanced mesh rendering in batch (huge performance gain)
	if (ballInstancedMesh) {
		ballInstancedMesh.instanceMatrix.needsUpdate = true;
		if (ballInstancedMesh.instanceColor) {
			ballInstancedMesh.instanceColor.needsUpdate = true;
		}
	}
	
	// Animate zeppelin flying in oval course
	if (zeppelinModelTemplate) {
		// Update angle along oval path
		zeppelinAngle += zeppelinSpeed * DeltaT;
		
		// Calculate position on oval path (centered at fireworks launch point)
		var x = zeppelinCenterX + Math.cos(zeppelinAngle) * ovalRadiusX;
		var z = zeppelinCenterZ + Math.sin(zeppelinAngle) * ovalRadiusZ;
		
		// Update zeppelin position
		zeppelinModelTemplate.position.set(x, zeppelinHeight, z);
		
		// Calculate direction of movement (tangent to oval)
		var dx = -Math.sin(zeppelinAngle) * ovalRadiusX;
		var dz = Math.cos(zeppelinAngle) * ovalRadiusZ;
		
		// Orient zeppelin to face direction of travel (subtract 90 degrees to correct orientation)
		zeppelinModelTemplate.rotation.y = Math.atan2(dx, dz) - Math.PI / 2;
	}
	
	// Rotate propellers
	if (propellerPort) {
		propellerPort.rotation.x += propellerRotationSpeed * DeltaT;
	}
	if (propellerStarboard) {
		propellerStarboard.rotation.x += propellerRotationSpeed * DeltaT;
	}
	if (mainRotor) {
		mainRotor.rotation.z += rotorRotationSpeed * DeltaT;
	}
	
	// Animate helicopter flight path
	if (helicopterModelTemplate) {
		helicopterAngle += helicopterSpeed * DeltaT;
		var x = helicopterCenterX + Math.cos(helicopterAngle) * helicopterOvalRadiusX;
		var z = helicopterCenterZ + Math.sin(helicopterAngle) * helicopterOvalRadiusZ;
		helicopterModelTemplate.position.set(x, helicopterHeight, z);
		
		// Calculate direction of movement (tangent to oval)
		var dx = -Math.sin(helicopterAngle) * helicopterOvalRadiusX;
		var dz = Math.cos(helicopterAngle) * helicopterOvalRadiusZ;
		
		// Orient helicopter to face direction of travel
		var headingAngle = Math.atan2(dx, dz) + Math.PI; // Add 180° to correct orientation
		helicopterModelTemplate.rotation.y = headingAngle;
		
		// Bank into turns based on position on oval
		var bankAngle = Math.sin(helicopterAngle) * 0.15; // Max ~8.6 degrees
		helicopterModelTemplate.rotation.z = bankAngle;
		
		// Nose-down pitch for forward flight
		helicopterModelTemplate.rotation.x = -0.1; // ~5.7 degrees nose-down
	}
	
	// Animate sailboat sailing path
	if (sailboatModelTemplate) {
		sailboatAngle += sailboatSpeed * DeltaT;
		var x = sailboatCenterX + Math.cos(sailboatAngle) * sailboatOvalRadiusX;
		var z = sailboatCenterZ + Math.sin(sailboatAngle) * sailboatOvalRadiusZ;
		
		// Calculate direction of movement (tangent to oval)
		var dx = -Math.sin(sailboatAngle) * sailboatOvalRadiusX;
		var dz = Math.cos(sailboatAngle) * sailboatOvalRadiusZ;
		
		// Orient sailboat to face direction of travel
		var headingAngle = Math.atan2(dx, dz) - Math.PI / 2;
		sailboatModelTemplate.rotation.y = headingAngle;
		
		// Offset position forward along heading so rear of boat follows the path
		var offsetX = x + Math.sin(headingAngle) * sailboatPivotOffset;
		var offsetZ = z + Math.cos(headingAngle) * sailboatPivotOffset;
		sailboatModelTemplate.position.set(offsetX, sailboatHeight, offsetZ);
	}
	
	// Update helicopter spotlight gimbal to aim at target
	if (helicopterSpotlight && rotateGimbalY && rotateGimbalZ && spotlightBase) {
		// Update spotlight target position
		helicopterSpotlight.target.position.copy(spotlightTarget);
		
		// Get spotlight base world position
		var spotlightWorldPos = new THREE.Vector3();
		spotlightBase.getWorldPosition(spotlightWorldPos);
		
		// Calculate direction from spotlight to target in world space
		var toTarget = new THREE.Vector3().subVectors(spotlightTarget, spotlightWorldPos).normalize();
		
		// Calculate yaw in rotateGimbalY's parent coordinate space
		var gimbalYParent = rotateGimbalY.parent;
		var gimbalYParentInverse = new THREE.Matrix4().copy(gimbalYParent.matrixWorld).invert();
		var dirInGimbalYParent = toTarget.clone().transformDirection(gimbalYParentInverse).normalize();
		var yawAngle = Math.atan2(dirInGimbalYParent.x, dirInGimbalYParent.z) + Math.PI / 2;
		rotateGimbalY.rotation.y = yawAngle;
		
		// Update gimbalY's world matrix before calculating pitch
		rotateGimbalY.updateMatrixWorld(true);
		
		// Calculate pitch in rotateGimbalZ's parent coordinate space (which is rotateGimbalY)
		var gimbalZParentInverse = new THREE.Matrix4().copy(rotateGimbalY.matrixWorld).invert();
		var dirInGimbalZParent = toTarget.clone().transformDirection(gimbalZParentInverse).normalize();
		var pitchAngle = Math.atan2(dirInGimbalZParent.x, -dirInGimbalZParent.y);
		rotateGimbalZ.rotation.z = pitchAngle;
	}
	
	// Fade explosion light back to dim
	if (explosionLight && explosionLightIntensity > explosionLightDimIntensity) {
		explosionLightIntensity -= explosionLightFadeSpeed * DeltaT;
		explosionLightIntensity = Math.max(explosionLightDimIntensity, explosionLightIntensity);
		explosionLight.intensity = explosionLightIntensity;
	}
	
	// Fade tube flashes back to normal
	for (let i = 0; i < tubeFlashTimers.length; i++) {
		if (tubeFlashTimers[i] > 0) {
			tubeFlashTimers[i] -= DeltaT;
			if (tubeFlashTimers[i] <= 0) {
				// Flash complete, return to normal color
				tubeFlashTimers[i] = 0;
				if (tubeMaterials[i]) {
					tubeMaterials[i].color.setHex(tubeNormalColor);
					tubeMaterials[i].emissive.setHex(0x000000);
					tubeMaterials[i].emissiveIntensity = 0;
				}
			} else {
				// Fade from white to black
				let t = tubeFlashTimers[i] / tubeFlashDuration; // 1.0 at start, 0.0 at end
				if (tubeMaterials[i]) {
					let flashAmount = t * t; // Quadratic fade for more punch
					tubeMaterials[i].emissiveIntensity = flashAmount * 0.8;
				}
			}
		}
	}
}

// Menu Drawing Functions -----------------------------------------------------------
function drawMainMenu() {
	const ctx = gOverlayCtx;
	const cScale = Math.min(window.innerWidth, window.innerHeight) / 2.0;
	const menuScale = cScale; // Use same scale as ellipsis
	const ellipsisWorldX = 0.05;
	const ellipsisWorldY = 0.05;
	const ellipsisX = ellipsisWorldX * cScale;
	const ellipsisY = ellipsisWorldY * cScale;
	const dotRadius = 0.006 * cScale;
	const dotSpacing = 0.016 * cScale;
	
	// Always draw three dots for ellipsis
	const ellipsisOpacity = mainMenuVisible ? 1.0 : 0.8;
	ctx.fillStyle = `hsla(210, 60%, 80%, ${ellipsisOpacity})`;
	for (let i = 0; i < 3; i++) {
		ctx.beginPath();
		ctx.arc(ellipsisX + i * dotSpacing, ellipsisY, dotRadius, 0, 2 * Math.PI);
		ctx.fill();
	}
	
	if (mainMenuOpacity <= 0) return;
	
	// Menu dimensions
	const itemHeight = 0.12 * menuScale;
	const itemWidth = 0.15 * menuScale;
	const padding = 0.02 * menuScale;
	const menuHeight = itemHeight * 3 + (padding * 4); // Three items: play/pause, camera, and simulation
	const menuWidth = itemWidth + (padding * 2);
	
	const menuBaseY = ellipsisY + 0.08 * menuScale;
	const menuBaseX = ellipsisX - padding;
	const menuX = menuBaseX + mainMenuXOffset * menuScale; // Slide from left
	const menuY = menuBaseY;
	
	ctx.save();
	ctx.globalAlpha = mainMenuOpacity;
	
	// Draw menu background
	const cornerRadius = 0.02 * menuScale;
	ctx.beginPath();
	ctx.roundRect(menuX, menuY, menuWidth, menuHeight, cornerRadius);
	const menuGradient = ctx.createLinearGradient(menuX, menuY, menuX, menuY + menuHeight);
	menuGradient.addColorStop(0, 'rgba(9, 9, 9, 0.9)');
	menuGradient.addColorStop(1, 'rgba(19, 19, 19, 0.9)');
	ctx.fillStyle = menuGradient;
	ctx.fill();
	
	// Draw Run/Pause menu item
	const itemX = menuX + padding;
	const itemY = menuY + padding;
	const iconSize = 0.06 * menuScale;
	
	ctx.beginPath();
	ctx.roundRect(itemX, itemY, itemWidth, itemHeight, cornerRadius * 0.5);
	ctx.fillStyle = gRunning ? 'rgba(100, 220, 100, 0.3)' : 'rgba(252, 43, 43, 0.3)';
	ctx.fill();
	
	// Draw play/pause icon
	const iconX = itemX + itemWidth / 2;
	const iconY = itemY + itemHeight / 2;
	const iconColor = 'rgba(230, 230, 230, 1.0)';
	ctx.fillStyle = iconColor;
	
	ctx.save();
	ctx.translate(iconX, iconY);
	
	if (!gRunning) {
		// Draw pause icon (two bars)
		const barWidth = iconSize * 0.2;
		const barHeight = iconSize * 0.7;
		const barSpacing = iconSize * 0.25;
		ctx.fillRect(-barSpacing - barWidth / 2, -barHeight / 2, barWidth, barHeight);
		ctx.fillRect(barSpacing - barWidth / 2, -barHeight / 2, barWidth, barHeight);
	} else {
		// Draw play icon (triangle)
		const triSize = iconSize * 1.0;
		ctx.beginPath();
		ctx.moveTo(-triSize * 0.3, -triSize * 0.5);
		ctx.lineTo(-triSize * 0.3, triSize * 0.5);
		ctx.lineTo(triSize * 0.5, 0);
		ctx.closePath();
		ctx.fill();
	}
	
	ctx.restore();
	
	// Draw Camera menu item
	const itemY2 = itemY + itemHeight + padding;
	ctx.beginPath();
	ctx.roundRect(itemX, itemY2, itemWidth, itemHeight, cornerRadius * 0.5);
	
	// Background color - dull orange when visible, gray when not
	ctx.fillStyle = cameraMenuVisible ? 'rgba(180, 110, 60, 0.3)' : 'rgba(38, 38, 38, 0.8)';
	ctx.fill();
	
	// Draw camera icon (movie camera)
	const icon2X = itemX + 0.5 * itemWidth;
	const icon2Y = itemY2 + 0.6 * itemHeight;
	const camSize = iconSize * 1.6;
	
	// Icon color - gray when menu is not visible
	const icon2Color = cameraMenuVisible ? 'rgba(230, 230, 230, 1.0)' : 'rgba(76, 76, 76, 1.0)';
	
	ctx.save();
	ctx.translate(icon2X, icon2Y);
	ctx.fillStyle = cameraMenuVisible ? `hsla(0, 0%, 40%, 1.0)` : `hsla(0, 0%, 30%, 1.0)`;
	ctx.strokeStyle = cameraMenuVisible ? `hsla(0, 0%, 60%, 1.0)` : `hsla(0, 0%, 30%, 1.0)`;
	ctx.lineWidth = camSize * 0.06;
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';

	// Triangular lens on right side
	const lensOffsetY = -camSize * 0.0;
	ctx.beginPath();
	ctx.moveTo(camSize * 0.45, lensOffsetY - camSize * 0.13);
	ctx.lineTo(-camSize * 0.10, lensOffsetY + camSize * 0.05);
	ctx.lineTo(camSize * 0.45, lensOffsetY + camSize * 0.23);
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
	
	// Camera body (rectangle)
	ctx.beginPath();
	ctx.rect(-camSize * 0.5, -camSize * 0.12, camSize * 0.6, camSize * 0.35);
	ctx.fill();
	ctx.stroke();
	
	// Film reels on top
	const leftReelX = -camSize * 0.4;
	const leftReelY = -camSize * 0.3;
	const leftReelRadius = camSize * 0.16;
	
	const rightReelX = -camSize * 0.02;
	const rightReelY = -camSize * 0.36;
	const rightReelRadius = camSize * 0.22;
	
	// Left reel
	ctx.beginPath();
	ctx.arc(leftReelX, leftReelY, leftReelRadius, 0, 2 * Math.PI);
	ctx.fillStyle = `rgba(100, 100, 100, 1.0)`;
	ctx.fill();
	ctx.stroke();
	
	// Draw static dots on left reel
	const leftReelDots = 4;
	const leftReelDotRadius = leftReelRadius * 0.7;
	const leftReelDotSize = camSize * 0.03;
	ctx.fillStyle = `rgba(26, 26, 26, 1.0)`;
	for (let i = 0; i < leftReelDots; i++) {
		const angle = (i * 2 * Math.PI / leftReelDots);
		const dotX = leftReelX + Math.cos(angle) * leftReelDotRadius;
		const dotY = leftReelY + Math.sin(angle) * leftReelDotRadius;
		ctx.beginPath();
		ctx.arc(dotX, dotY, leftReelDotSize, 0, 2 * Math.PI);
		ctx.fill();
	}
	
	// Right reel
	ctx.fillStyle = `rgba(96, 96, 96, 1.0)`;
	ctx.beginPath();
	ctx.arc(rightReelX, rightReelY, rightReelRadius, 0, 2 * Math.PI);
	ctx.fill();
	ctx.stroke();
	
	// Draw static dots on right reel
	const rightReelDots = 5;
	const rightReelDotRadius = rightReelRadius * 0.7;
	const rightReelDotSize = camSize * 0.04;
	ctx.fillStyle = `rgba(26, 26, 26, 1.0)`;
	for (let i = 0; i < rightReelDots; i++) {
		const angle = (i * 2 * Math.PI / rightReelDots);
		const dotX = rightReelX + Math.cos(angle) * rightReelDotRadius;
		const dotY = rightReelY + Math.sin(angle) * rightReelDotRadius;
		ctx.beginPath();
		ctx.arc(dotX, dotY, rightReelDotSize, 0, 2 * Math.PI);
		ctx.fill();
	}
	
	ctx.restore();
	
	// Draw Simulation menu item
	const itemY3 = itemY2 + itemHeight + padding;
	ctx.beginPath();
	ctx.roundRect(itemX, itemY3, itemWidth, itemHeight, cornerRadius * 0.5);
	ctx.fillStyle = simulationMenuVisible ? 'rgba(100, 150, 220, 0.3)' : 'rgba(38, 38, 38, 0.8)';
	ctx.fill();
	
	// Draw gear icon
	const icon3X = itemX + itemWidth / 2;
	const icon3Y = itemY3 + itemHeight / 2;
	const icon3Color = simulationMenuVisible ? 'rgba(230, 230, 230, 1.0)' : 'rgba(76, 76, 76, 1.0)';
	ctx.strokeStyle = icon3Color;
	ctx.fillStyle = icon3Color;
	ctx.lineWidth = 2;
	ctx.lineCap = 'round';
	
	// Draw gear icon
	const gearRadius3 = iconSize * 0.6;
	ctx.save();
	ctx.translate(icon3X, icon3Y);
	ctx.beginPath();
	for (let i = 0; i < 8; i++) {
		const angle = (i / 8) * Math.PI * 2;
		const outerR = gearRadius3;
		const innerR = gearRadius3 * 0.7;
		const x1 = Math.cos(angle - 0.1) * innerR;
		const y1 = Math.sin(angle - 0.1) * innerR;
		const x2 = Math.cos(angle - 0.1) * outerR;
		const y2 = Math.sin(angle - 0.1) * outerR;
		const x3 = Math.cos(angle + 0.1) * outerR;
		const y3 = Math.sin(angle + 0.1) * outerR;
		const x4 = Math.cos(angle + 0.1) * innerR;
		const y4 = Math.sin(angle + 0.1) * innerR;
		if (i === 0) ctx.moveTo(x1, y1);
		ctx.lineTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.lineTo(x3, y3);
		ctx.lineTo(x4, y4);
	}
	ctx.closePath();
	ctx.stroke();
	ctx.beginPath();
	ctx.arc(0, 0, gearRadius3 * 0.3, 0, 2 * Math.PI);
	ctx.stroke();
	ctx.restore();
	
	ctx.restore();
}

function drawCameraMenu() {
	if (cameraMenuOpacity <= 0) return;
	
	const ctx = gOverlayCtx;
	const cScale = Math.min(window.innerWidth, window.innerHeight) / 2.0;
	const menuScale = cScale; // Use same scale as main menu
	const knobRadius = 0.1 * menuScale;
	const padding = 0.17 * menuScale;
	const radioButtonSize = 0.04 * menuScale;
	const radioButtonSpacing = 0.095 * menuScale; // Increased for more vertical spacing
	const horizontalKnobSpacing = knobRadius * 2.5; // Increased for more horizontal spacing
	const menuWidth = knobRadius * 3; // Fixed width
	const radioSectionHeight = 6 * radioButtonSpacing + 0.004 * menuScale; // Adjusted for 6 camera modes
	const menuHeight = radioSectionHeight + knobRadius * 1.7;
	
	// Position menu (shared position with all submenus)
	const menuOriginX = submenuX * window.innerWidth;
	const menuOriginY = submenuY * window.innerHeight;
	
	ctx.save();
	ctx.translate(menuOriginX, menuOriginY);
	ctx.globalAlpha = cameraMenuOpacity;
	
	// Draw menu background (dull orange to match camera icon color)
	const cornerRadius = 8;
	ctx.beginPath();
	ctx.roundRect(-padding, -padding, menuWidth + padding * 2, menuHeight + padding * 2, cornerRadius);
	const menuGradient = ctx.createLinearGradient(0, -padding, 0, menuHeight + padding);
	menuGradient.addColorStop(0, 'rgba(80, 60, 40, 0.9)');
	menuGradient.addColorStop(1, 'rgba(50, 35, 25, 0.9)');
	ctx.fillStyle = menuGradient;
	ctx.fill();
	ctx.strokeStyle = 'rgba(180, 120, 80, 0.9)';
	ctx.lineWidth = 1.5;
	ctx.stroke();
	
	// Draw title
	ctx.fillStyle = 'rgba(200, 200, 210, 1.0)';
	ctx.font = `bold ${0.05 * menuScale}px verdana`;
	ctx.textAlign = 'center';
	ctx.fillText('CAMERA', menuWidth / 2, -padding + 0.06 * menuScale);
	
	// Draw close button
	const closeIconRadius = 0.1 * menuScale * 0.25;
	const closeIconX = -padding + closeIconRadius + 0.02 * menuScale;
	const closeIconY = -padding + closeIconRadius + 0.02 * menuScale;
	ctx.beginPath();
	ctx.arc(closeIconX, closeIconY, closeIconRadius, 0, 2 * Math.PI);
	ctx.fillStyle = 'rgba(180, 40, 40, 1.0)';
	ctx.fill();
	ctx.strokeStyle = 'rgba(0, 0, 0, 1.0)';
	ctx.lineWidth = 2;
	const xSize = closeIconRadius * 0.4;
	ctx.beginPath();
	ctx.moveTo(closeIconX - xSize, closeIconY - xSize);
	ctx.lineTo(closeIconX + xSize, closeIconY + xSize);
	ctx.moveTo(closeIconX + xSize, closeIconY - xSize);
	ctx.lineTo(closeIconX - xSize, closeIconY + xSize);
	ctx.stroke();
	
	// Draw help button (question mark in circle) on top right
	const helpIconRadius = closeIconRadius;
	const helpIconX = menuWidth + padding - helpIconRadius - 0.02 * menuScale;
	const helpIconY = -padding + helpIconRadius + 0.02 * menuScale;
	ctx.beginPath();
	ctx.arc(helpIconX, helpIconY, helpIconRadius, 0, 2 * Math.PI);
	ctx.fillStyle = cameraHelpVisible ? 'rgba(80, 140, 200, 1.0)' : 'rgba(60, 100, 140, 1.0)';
	ctx.fill();
	ctx.strokeStyle = 'rgba(0, 0, 0, 1.0)';
	ctx.lineWidth = 2;
	ctx.stroke();
	
	// Draw question mark text
	ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
	ctx.font = `bold ${helpIconRadius * 1.3}px verdana`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText('?', helpIconX, helpIconY);
	
	// Draw radio buttons for camera modes
	const cameraModeNames = [
		'Manual Orbit Cam',
		'Auto Orbit Cam CCW',
		'Auto Orbit Cam CW',
		'Helicopter Cam',
		'Zeppelin Cam',
		'Sailboat Cam'
	];
	
	const radioStartY = 0;
	
	for (let i = 0; i < cameraModeNames.length; i++) {
		const radioY = radioStartY + i * radioButtonSpacing;
		const radioX = -0.05 * menuScale;
		
		// Draw radio button circle
		ctx.beginPath();
		ctx.arc(radioX, radioY, radioButtonSize, 0, 2 * Math.PI);
		ctx.strokeStyle = 'rgba(150, 150, 160, 1.0)';
		ctx.fillStyle = 'rgba(40, 40, 50, 0.8)';
		ctx.lineWidth = 2;
		ctx.stroke();
		ctx.fill();
		
		// Fill if selected
		if (gCameraMode === i) {
			ctx.beginPath();
			ctx.arc(radioX, radioY, radioButtonSize * 0.6, 0, 2 * Math.PI);
			ctx.fillStyle = 'rgba(255, 180, 80, 1.0)';
			ctx.fill();
		}
		
		// Draw label
		ctx.font = `${0.037 * menuScale}px verdana`;
		ctx.textAlign = 'left';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = 'rgba(10, 10, 10, 1.0)';
		ctx.fillText(cameraModeNames[i], radioX + radioButtonSize + 0.03 * menuScale + 1, 1 + radioY);
		ctx.fillStyle = `rgba(${gCameraMode === i ? 240 : 200}, ${gCameraMode === i ? 240 : 200}, ${gCameraMode === i ? 240 : 240}, 1.0)`;
		ctx.fillText(cameraModeNames[i], radioX + radioButtonSize + 0.03 * menuScale, radioY);
	}
	
	// Draw Focal Length and Orbit Speed knobs at bottom (2 knobs side by side, centered)
	const fovKnobX = menuWidth / 2 - horizontalKnobSpacing / 2;
	const orbitSpeedKnobX = menuWidth / 2 + horizontalKnobSpacing / 2;
	const knobY = radioSectionHeight + knobRadius * 1.3;
	
	// FOV Knob
	drawKnob(ctx, fovKnobX, knobY, knobRadius, gCameraFOV, 3, 170, true, 'Focal Length', 210);
	
	// Orbit Speed Knob
	drawKnob(ctx, orbitSpeedKnobX, knobY, knobRadius, gCameraRotationSpeed, 0.1, 10.0, false, 'Orbit Speed', 280);
	
	// Update knob positions for mouse interaction
	updateKnobPositions();
	
	ctx.restore();
}

function drawKnob(ctx, x, y, radius, value, min, max, reversed, label, hue) {
	// Draw knob background
	ctx.beginPath();
	ctx.arc(x, y, radius * 1.05, 0, 2 * Math.PI);
	ctx.fillStyle = 'rgba(20, 20, 30, 0.9)';
	ctx.fill();
	ctx.strokeStyle = 'rgba(150, 150, 160, 1.0)';
	ctx.lineWidth = 1;
	ctx.stroke();
	
	// Calculate knob angle
	let normalized = (value - min) / (max - min);
	if (reversed) normalized = 1 - normalized;
	const fullMeterSweep = 1.6 * Math.PI;
	const meterStart = 0.5 * Math.PI + 0.5 * (2 * Math.PI - fullMeterSweep);
	const pointerAngle = meterStart + fullMeterSweep * normalized;
	
	// Draw meter arc
	ctx.strokeStyle = `hsla(${hue}, 60%, 60%, 1.0)`;
	ctx.beginPath();
	ctx.arc(x, y, radius * 0.85, meterStart, pointerAngle);
	ctx.lineWidth = 4;
	ctx.stroke();
	
	// Draw needle
	const pointerLength = radius * 0.6;
	const pointerEndX = x + Math.cos(pointerAngle) * pointerLength;
	const pointerEndY = y + Math.sin(pointerAngle) * pointerLength;
	ctx.beginPath();
	ctx.moveTo(x, y);
	ctx.lineTo(pointerEndX, pointerEndY);
	ctx.strokeStyle = 'rgba(200, 200, 210, 1.0)';
	ctx.lineWidth = 2;
	ctx.stroke();
	
	// Draw value
	ctx.font = `${0.3 * radius}px verdana`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillStyle = `hsla(${hue}, 60%, 70%, 1.0)`;
	
	if (label === 'Focal Length') {
		const focalLength = 24 / (2 * Math.tan(value * Math.PI / 360));
		ctx.fillText(focalLength.toFixed(0) + 'mm', x, y + 0.6 * radius);
	} else if (label === 'Tube Angle') {
		ctx.fillText(value.toFixed(1) + '°', x, y + 0.6 * radius);
	} else if (label === 'Particle Size') {
		ctx.fillText(value.toFixed(2), x, y + 0.6 * radius);
	} else {
		ctx.fillText(value.toFixed(1), x, y + 0.6 * radius);
	}
	
	// Draw label
	ctx.font = `${0.35 * radius}px verdana`;
	ctx.fillStyle = 'rgba(220, 220, 230, 1.0)';
	ctx.fillText(label, x, y + 1.35 * radius);
}

function drawSimulationMenu() {
	if (simulationMenuOpacity <= 0) return;
	
	const ctx = gOverlayCtx;
	const cScale = Math.min(window.innerWidth, window.innerHeight) / 2.0;
	const menuScale = cScale;
	const knobRadius = 0.1 * menuScale;
	const padding = 0.17 * menuScale;
	const radioButtonSize = 0.04 * menuScale;
	const radioButtonSpacing = 0.095 * menuScale;
	const horizontalKnobSpacing = knobRadius * 2.5;
	const verticalKnobSpacing = knobRadius * 2.8;
	const menuWidth = knobRadius * 3;
	// Calculate menu height: knobs section + spacing + radio buttons section
	const knobY1 = knobRadius * 0.8;
	const knobY3 = knobY1 + 2 * verticalKnobSpacing;
	const radioStartY = knobY3 + knobRadius * 3.0;
	const radioSectionHeight = 2.0 * radioButtonSpacing;
	const menuHeight = radioStartY + radioSectionHeight;
	
	// Position menu (shared position with all submenus)
	const menuOriginX = submenuX * window.innerWidth;
	const menuOriginY = submenuY * window.innerHeight;
	
	ctx.save();
	ctx.translate(menuOriginX, menuOriginY);
	ctx.globalAlpha = simulationMenuOpacity;
	
	// Draw menu background (blue to match simulation icon color)
	const cornerRadius = 8;
	ctx.beginPath();
	ctx.roundRect(-padding, -padding, menuWidth + padding * 2, menuHeight + padding * 2, cornerRadius);
	const menuGradient = ctx.createLinearGradient(0, -padding, 0, menuHeight + padding);
	menuGradient.addColorStop(0, 'rgba(60, 60, 70, 0.9)');
	menuGradient.addColorStop(1, 'rgba(30, 30, 40, 0.9)');
	ctx.fillStyle = menuGradient;
	ctx.fill();
	ctx.strokeStyle = 'rgba(130, 140, 180, 0.9)';
	ctx.lineWidth = 1.5;
	ctx.stroke();
	
	// Draw title
	ctx.fillStyle = 'rgba(200, 210, 200, 1.0)';
	ctx.font = `bold ${0.05 * menuScale}px verdana`;
	ctx.textAlign = 'center';
	ctx.fillText('SIMULATION', menuWidth / 2, -padding + 0.06 * menuScale);
	
	// Draw close button
	const closeIconRadius = 0.1 * menuScale * 0.25;
	const closeIconX = -padding + closeIconRadius + 0.02 * menuScale;
	const closeIconY = -padding + closeIconRadius + 0.02 * menuScale;
	ctx.beginPath();
	ctx.arc(closeIconX, closeIconY, closeIconRadius, 0, 2 * Math.PI);
	ctx.fillStyle = 'rgba(180, 40, 40, 1.0)';
	ctx.fill();
	ctx.strokeStyle = 'rgba(0, 0, 0, 1.0)';
	ctx.lineWidth = 2;
	const xSize = closeIconRadius * 0.4;
	ctx.beginPath();
	ctx.moveTo(closeIconX - xSize, closeIconY - xSize);
	ctx.lineTo(closeIconX + xSize, closeIconY + xSize);
	ctx.moveTo(closeIconX + xSize, closeIconY - xSize);
	ctx.lineTo(closeIconX - xSize, closeIconY + xSize);
	ctx.stroke();
	
	// Draw five knobs (at top)
	// Row 1: Explosion Size and Launch Velocity (side by side)
	const explosionKnobX = menuWidth / 2 - horizontalKnobSpacing / 2;
	const launchVelocityKnobX = menuWidth / 2 + horizontalKnobSpacing / 2;
	// knobY1 already declared above for menu height calculation
	
	// Row 2: Mortar Angle and Gravity (side by side)
	const mortarAngleKnobX = menuWidth / 2 - horizontalKnobSpacing / 2;
	const gravityKnobX = menuWidth / 2 + horizontalKnobSpacing / 2;
	const knobY2 = knobY1 + verticalKnobSpacing;
	
	// Row 3: Ball Radius (centered)
	const ballRadiusKnobX = menuWidth / 2;
	// knobY3 already declared above for menu height calculation
	
	// Explosion Size Knob
	drawKnob(ctx, explosionKnobX, knobY1, knobRadius, maxExplosionSize, 1.0, 15.0, false, 'Max Blast', 30);
	
	// Launch Velocity Knob
	drawKnob(ctx, launchVelocityKnobX, knobY1, knobRadius, minLaunchVelocity, 15.0, 60.0, false, 'Mortar Vel', 120);
	
	// Mortar Angle Knob
	drawKnob(ctx, mortarAngleKnobX, knobY2, knobRadius, mortarTubeAngle, 0.0, 45.0, false, 'Spread', 180);
	
	// Gravity Knob
	drawKnob(ctx, gravityKnobX, knobY2, knobRadius, Math.abs(Gravity), 0.5, 5.0, false, 'Gravity', 280);
	
	// Ball Radius Knob
	drawKnob(ctx, ballRadiusKnobX, knobY3, knobRadius, ballRadius, 0.01, 0.10, false, 'Particle Size', 90);
	
	// Draw radio buttons for ball material (at bottom)
	const materialModeNames = [
		'Basic',
		'Plastic',
		'Metallic',
		'Normal'
	];
	
	// Position radio buttons below the third knob with its label
	// radioStartY already declared above for menu height calculation
	
	// Draw "Material" heading
	ctx.fillStyle = 'rgba(200, 210, 200, 1.0)';
	ctx.font = `bold ${0.042 * menuScale}px verdana`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText('Material', menuWidth / 2, radioStartY - radioButtonSpacing * 0.9);
	
	for (let i = 0; i < materialModeNames.length; i++) {
		const radioY = radioStartY + i * radioButtonSpacing;
		const radioX = 0.065 * menuScale;
		
		// Draw radio button circle
		ctx.beginPath();
		ctx.arc(radioX, radioY, radioButtonSize, 0, 2 * Math.PI);
		ctx.strokeStyle = 'rgba(150, 150, 160, 1.0)';
		ctx.fillStyle = 'rgba(40, 40, 50, 0.8)';
		ctx.lineWidth = 2;
		ctx.stroke();
		ctx.fill();
		
		// Fill if selected
		if (gBallMaterialMode === i) {
			ctx.beginPath();
			ctx.arc(radioX, radioY, radioButtonSize * 0.6, 0, 2 * Math.PI);
			ctx.fillStyle = 'rgba(130, 140, 200, 1.0)';
			ctx.fill();
		}
		
		// Draw label
		ctx.font = `${0.037 * menuScale}px verdana`;
		ctx.textAlign = 'left';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = 'rgba(10, 10, 10, 1.0)';
		ctx.fillText(materialModeNames[i], radioX + radioButtonSize + 0.03 * menuScale + 1, 1 + radioY);
		ctx.fillStyle = `rgba(${gBallMaterialMode === i ? 240 : 200}, ${gBallMaterialMode === i ? 240 : 200}, ${gBallMaterialMode === i ? 240 : 240}, 1.0)`;
		ctx.fillText(materialModeNames[i], radioX + radioButtonSize + 0.03 * menuScale, radioY);
	}
	
	// Update knob positions for mouse interaction
	updateSimulationKnobPositions();
	
	ctx.restore();
}

function drawCameraHelp() {
	if (!cameraHelpVisible) return;
	
	const ctx = gOverlayCtx;
	const cScale = Math.min(window.innerWidth, window.innerHeight) / 2.0;
	const menuScale = cScale;
	const knobRadius = 0.1 * menuScale;
	const padding = 0.17 * menuScale;
	
	// Select the appropriate image based on camera mode
	let currentImage = null;
	let imageLoaded = false;
	
	if (gCameraMode === 0) {
		// Manual orbit cam
		currentImage = manualOrbitImage;
		imageLoaded = manualOrbitImageLoaded;
	} else if (gCameraMode === 1 || gCameraMode === 2) {
		// Auto orbit cams
		currentImage = autoOrbitImage;
		imageLoaded = autoOrbitImageLoaded;
	} else if (gCameraMode === 3 || gCameraMode === 4 || gCameraMode === 5) {
		// Vehicle cams
		currentImage = vehicleImage;
		imageLoaded = vehicleImageLoaded;
	}
	
	// Only draw if image is loaded
	if (!imageLoaded || !currentImage) return;
	
	// Calculate image dimensions - maintain original aspect ratio
	const cameraMenuWidth = knobRadius * 3;
	const spacing = -0.05 * menuScale; // Negative to overlap slightly, moving left
	const menuOriginX = submenuX * window.innerWidth + cameraMenuWidth + padding * 2 + spacing;
	const menuOriginY = submenuY * window.innerHeight - 0.1 * menuScale; // Move up
	
	// Fixed width, height based on original aspect ratio
	const imageWidth = cameraMenuWidth * 1.8;
	const imgAspect = currentImage.width / currentImage.height;
	const imageHeight = imageWidth / imgAspect;
	
	ctx.save();
	ctx.globalAlpha = cameraMenuOpacity; // Use same opacity as camera menu
	ctx.drawImage(currentImage, menuOriginX, menuOriginY, imageWidth, imageHeight);
	ctx.restore();
}

function updateSimulationKnobPositions() {
	const cScale = Math.min(window.innerWidth, window.innerHeight) / 2.0;
	const menuScale = cScale;
	const knobRadius = 0.1 * menuScale;
	const menuOriginX = submenuX * window.innerWidth;
	const menuOriginY = submenuY * window.innerHeight;
	const horizontalKnobSpacing = knobRadius * 2.5;
	const verticalKnobSpacing = knobRadius * 2.8;
	const menuWidth = knobRadius * 3;
	const explosionKnobX = menuWidth / 2 - horizontalKnobSpacing / 2;
	const launchVelocityKnobX = menuWidth / 2 + horizontalKnobSpacing / 2;
	const mortarAngleKnobX = menuWidth / 2 - horizontalKnobSpacing / 2;
	const gravityKnobX = menuWidth / 2 + horizontalKnobSpacing / 2;
	const ballRadiusKnobX = menuWidth / 2;
	const knobY1 = knobRadius * 0.8;
	const knobY2 = knobY1 + verticalKnobSpacing;
	const knobY3 = knobY2 + verticalKnobSpacing;
	
	explosionSizeKnobInfo = { x: menuOriginX + explosionKnobX, y: menuOriginY + knobY1, radius: knobRadius };
	launchVelocityKnobInfo = { x: menuOriginX + launchVelocityKnobX, y: menuOriginY + knobY1, radius: knobRadius };
	mortarAngleKnobInfo = { x: menuOriginX + mortarAngleKnobX, y: menuOriginY + knobY2, radius: knobRadius };
	gravityKnobInfo = { x: menuOriginX + gravityKnobX, y: menuOriginY + knobY2, radius: knobRadius };
	ballRadiusKnobInfo = { x: menuOriginX + ballRadiusKnobX, y: menuOriginY + knobY3, radius: knobRadius };
}

function updateKnobPositions() {
	const cScale = Math.min(window.innerWidth, window.innerHeight) / 2.0;
	const menuScale = cScale; // Use same scale as main menu
	const knobRadius = 0.1 * menuScale;
	const radioButtonSpacing = 0.095 * menuScale; // Matches drawCameraMenu
	const radioSectionHeight = 6 * radioButtonSpacing + 0.004 * menuScale; // Matches drawCameraMenu (6 camera modes)
	const menuOriginX = submenuX * window.innerWidth;
	const menuOriginY = submenuY * window.innerHeight;
	const horizontalKnobSpacing = knobRadius * 2.5; // Matches drawCameraMenu
	const menuWidth = knobRadius * 3.7; // Matches drawCameraMenu
	const fovKnobX = menuWidth / 2 - horizontalKnobSpacing / 2;
	const orbitSpeedKnobX = menuWidth / 2 + horizontalKnobSpacing / 2;
	const knobY = radioSectionHeight + knobRadius * 1.3;
	
	fovKnobInfo = { x: menuOriginX + fovKnobX, y: menuOriginY + knobY, radius: knobRadius };
	orbitSpeedKnobInfo = { x: menuOriginX + orbitSpeedKnobX, y: menuOriginY + knobY, radius: knobRadius };
}

function drawMenus() {
	if (!gOverlayCtx) return;
	
	// Always clear and redraw if menus are visible or animating
	const isAnimating = (mainMenuOpacity > 0) || (cameraMenuOpacity > 0) || (simulationMenuOpacity > 0);
	if (!needsMenuRedraw && !isAnimating) return;
	
	// Clear overlay
	gOverlayCtx.clearRect(0, 0, gOverlayCanvas.width, gOverlayCanvas.height);
	
	// Draw menus
	drawMainMenu();
	drawCameraMenu();
	drawCameraHelp();
	drawSimulationMenu();
	
	needsMenuRedraw = false;
}

function onMenuClick(evt) {
	const cScale = Math.min(window.innerWidth, window.innerHeight) / 2.0;
	
	// Check ellipsis click (toggle main menu) - simple large top-left corner hitbox
	if (evt.clientX < 0.15 * cScale && evt.clientY < 0.15 * cScale) {
		mainMenuVisible = !mainMenuVisible;
		// Close all submenus when main menu is closed
		if (!mainMenuVisible) {
			cameraMenuVisible = false;
			cameraHelpVisible = false;
			simulationMenuVisible = false;
		}
		needsMenuRedraw = true;
		evt.stopPropagation();
		return true; // Menu click handled
	}
	
	// Check main menu clicks
	if (mainMenuVisible && mainMenuOpacity > 0.5) {
		const cScale = Math.min(window.innerWidth, window.innerHeight) / 2.0;
		const menuScale = cScale; // Use same scale as main menu
		const ellipsisWorldX = 0.05;
		const ellipsisWorldY = 0.05;
		const ellipsisX = ellipsisWorldX * cScale;
		const ellipsisY = ellipsisWorldY * cScale;
		const itemHeight = 0.12 * menuScale;
		const itemWidth = 0.15 * menuScale;
		const padding = 0.02 * menuScale;
		const menuBaseY = ellipsisY + 0.08 * menuScale;
		const menuBaseX = ellipsisX - padding;
		const menuX = menuBaseX + mainMenuXOffset * menuScale;
		const menuY = menuBaseY;
		const itemX = menuX + padding;
		const itemY = menuY + padding;
		
		// Check Run/Pause button
		if (evt.clientX >= itemX && evt.clientX <= itemX + itemWidth &&
			evt.clientY >= itemY && evt.clientY <= itemY + itemHeight) {
			gRunning = !gRunning;
			autoLaunchEnabled = gRunning;
			needsMenuRedraw = true;
			evt.stopPropagation();
			return true; // Menu click handled
		}
		
		// Check Camera button
		const itemY2 = itemY + itemHeight + padding;
		if (evt.clientX >= itemX && evt.clientX <= itemX + itemWidth &&
			evt.clientY >= itemY2 && evt.clientY <= itemY2 + itemHeight) {
			cameraMenuVisible = !cameraMenuVisible;
			// Close camera help when camera menu is closed
			if (!cameraMenuVisible) {
				cameraHelpVisible = false;
			}
			// Close other submenus
			if (cameraMenuVisible) {
				simulationMenuVisible = false;
			}
			needsMenuRedraw = true;
			evt.stopPropagation();
			return true; // Menu click handled
		}
		
		// Check Simulation button
		const itemY3 = itemY2 + itemHeight + padding;
		if (evt.clientX >= itemX && evt.clientX <= itemX + itemWidth &&
			evt.clientY >= itemY3 && evt.clientY <= itemY3 + itemHeight) {
			simulationMenuVisible = !simulationMenuVisible;
			// Close other submenus
			if (simulationMenuVisible) {
				cameraMenuVisible = false;
				cameraHelpVisible = false;
			}
			needsMenuRedraw = true;
			evt.stopPropagation();
			return true; // Menu click handled
		}
	}
	
	// Check camera menu clicks
	if (cameraMenuVisible && cameraMenuOpacity > 0.5) {
		// Update knob positions first so they're correct for hit detection
		updateKnobPositions();
		
		const cScale = Math.min(window.innerWidth, window.innerHeight) / 2.0;
		const menuScale = cScale; // Use same scale as main menu
		const menuOriginX = submenuX * window.innerWidth;
		const menuOriginY = submenuY * window.innerHeight;
		const padding = 0.17 * menuScale;
		const knobRadius = 0.1 * menuScale;
		const radioButtonSpacing = 0.095 * menuScale; // Matches drawCameraMenu
		const horizontalKnobSpacing = knobRadius * 2.5; // Matches drawCameraMenu
		const menuWidth = knobRadius * 3; // Matches drawCameraMenu - FIXED
		const radioSectionHeight = 6 * radioButtonSpacing + 0.004 * menuScale; // Matches drawCameraMenu (6 camera modes)
		const menuHeight = radioSectionHeight + knobRadius * 2.74; // Matches drawCameraMenu
		
		// Check close button
		const closeIconRadius = 0.1 * menuScale * 0.25;
		const closeIconX = menuOriginX - padding + closeIconRadius + 0.02 * menuScale;
		const closeIconY = menuOriginY - padding + closeIconRadius + 0.02 * menuScale;
		const dx = evt.clientX - closeIconX;
		const dy = evt.clientY - closeIconY;
		if (dx * dx + dy * dy < closeIconRadius * closeIconRadius) {
			cameraMenuVisible = false;
			cameraHelpVisible = false; // Close help panel too
			needsMenuRedraw = true;
			evt.stopPropagation();
			return true; // Menu click handled
		}
		
		// Check help button
		const helpIconRadius = closeIconRadius;
		const helpIconX = menuOriginX + menuWidth + padding - helpIconRadius - 0.02 * menuScale;
		const helpIconY = menuOriginY - padding + helpIconRadius + 0.02 * menuScale;
		const hdx = evt.clientX - helpIconX;
		const hdy = evt.clientY - helpIconY;
		if (hdx * hdx + hdy * hdy < helpIconRadius * helpIconRadius) {
			cameraHelpVisible = !cameraHelpVisible;
			needsMenuRedraw = true;
			evt.stopPropagation();
			return true; // Menu click handled
		}
		
		// Check radio buttons
		const radioStartY = 0;
		const radioX = menuOriginX - 0.05 * menuScale
		const radioButtonSize = 0.04 * menuScale;
		
		for (let i = 0; i < 6; i++) {
			const radioY = menuOriginY + radioStartY + i * radioButtonSpacing;
			const rdx = evt.clientX - radioX;
			const rdy = evt.clientY - radioY;
			if (rdx * rdx + rdy * rdy < (radioButtonSize * 2) * (radioButtonSize * 2)) {
				gCameraMode = i;
				
				// When entering auto orbit mode, update gCameraAngle to current camera position
				// so the camera starts orbiting from its current position instead of jumping
				if (i === 1 || i === 2) {
					const target = CameraControl.target;
					const dx = Camera.position.x - target.x;
					const dz = Camera.position.z - target.z;
					gCameraAngle = Math.atan2(dz, dx);
				}
				
				// When entering fixed camera modes, reset pan and tilt
				if (i === 3 || i === 4 || i === 5) {
					cameraPan = 0;
					cameraTilt = 0;
				}
				
				needsMenuRedraw = true;
				// OrbitControls stay enabled in all modes for manual position adjustment
				CameraControl.enabled = true;
				evt.stopPropagation();
				return true; // Menu click handled
			}
		}
		
		// Check if clicking on knobs (set dragging flag and return true)
		const fovDx = evt.clientX - fovKnobInfo.x;
		const fovDy = evt.clientY - fovKnobInfo.y;
		if (fovDx * fovDx + fovDy * fovDy < fovKnobInfo.radius * fovKnobInfo.radius * 1.2) {
			draggingFOVKnob = true;
			dragStartMouseX = evt.clientX;
			dragStartMouseY = evt.clientY;
			dragStartValue = gCameraFOV;
			if (CameraControl) CameraControl.enabled = false;
			return true; // Knob click handled
		}
		
		const orbitDx = evt.clientX - orbitSpeedKnobInfo.x;
		const orbitDy = evt.clientY - orbitSpeedKnobInfo.y;
		if (orbitDx * orbitDx + orbitDy * orbitDy < orbitSpeedKnobInfo.radius * orbitSpeedKnobInfo.radius * 1.2) {
			draggingOrbitSpeedKnob = true;
			dragStartMouseX = evt.clientX;
			dragStartMouseY = evt.clientY;
			dragStartValue = gCameraRotationSpeed;
			if (CameraControl) CameraControl.enabled = false;
			return true; // Knob click handled
		}
	}
	
	// Check simulation menu clicks
	if (simulationMenuVisible && simulationMenuOpacity > 0.5) {
		// Update knob positions first so they're correct for hit detection
		updateSimulationKnobPositions();
		
		const cScale = Math.min(window.innerWidth, window.innerHeight) / 2.0;
		const menuScale = cScale;
		const menuOriginX = submenuX * window.innerWidth;
		const menuOriginY = submenuY * window.innerHeight;
		const padding = 0.17 * menuScale;
		const knobRadius = 0.1 * menuScale;
		const verticalKnobSpacing = knobRadius * 2.8;
		const menuWidth = knobRadius * 3;
		const menuHeight = verticalKnobSpacing * 2 + knobRadius * 1.2;
		
		// Check close button
		const closeIconRadius = 0.1 * menuScale * 0.25;
		const closeIconX = menuOriginX - padding + closeIconRadius + 0.02 * menuScale;
		const closeIconY = menuOriginY - padding + closeIconRadius + 0.02 * menuScale;
		const dx = evt.clientX - closeIconX;
		const dy = evt.clientY - closeIconY;
		if (dx * dx + dy * dy < closeIconRadius * closeIconRadius) {
			simulationMenuVisible = false;
			needsMenuRedraw = true;
			evt.stopPropagation();
			return true; // Menu click handled
		}
		
		// Check radio buttons for ball material (at bottom)
		const radioButtonSize = 0.04 * menuScale;
		const radioButtonSpacing = 0.095 * menuScale;
		// verticalKnobSpacing already declared above
		const knobY1 = knobRadius * 0.8;
		const knobY2 = knobY1 + verticalKnobSpacing;
		const knobY3 = knobY2 + verticalKnobSpacing;
		const radioStartY = knobY3 + knobRadius * 3.0;
		const radioX = menuOriginX + 0.065 * menuScale;
		
		for (let i = 0; i < 4; i++) {
			const radioY = menuOriginY + radioStartY + i * radioButtonSpacing;
			const rdx = evt.clientX - radioX;
			const rdy = evt.clientY - radioY;
			if (rdx * rdx + rdy * rdy < (radioButtonSize * 2) * (radioButtonSize * 2)) {
				gBallMaterialMode = i;
				changeBallMaterial(i);
				needsMenuRedraw = true;
				evt.stopPropagation();
				return true; // Menu click handled
			}
		}
		
		// Check if clicking on explosion size knob
		const explosionDx = evt.clientX - explosionSizeKnobInfo.x;
		const explosionDy = evt.clientY - explosionSizeKnobInfo.y;
		if (explosionDx * explosionDx + explosionDy * explosionDy < explosionSizeKnobInfo.radius * explosionSizeKnobInfo.radius * 1.2) {
			draggingExplosionSizeKnob = true;
			dragStartMouseX = evt.clientX;
			dragStartMouseY = evt.clientY;
			dragStartValue = maxExplosionSize;
			if (CameraControl) CameraControl.enabled = false;
			return true; // Knob click handled
		}
		
		// Check if clicking on launch velocity knob
		const launchVelDx = evt.clientX - launchVelocityKnobInfo.x;
		const launchVelDy = evt.clientY - launchVelocityKnobInfo.y;
		if (launchVelDx * launchVelDx + launchVelDy * launchVelDy < launchVelocityKnobInfo.radius * launchVelocityKnobInfo.radius * 1.2) {
			draggingLaunchVelocityKnob = true;
			dragStartMouseX = evt.clientX;
			dragStartMouseY = evt.clientY;
			dragStartValue = minLaunchVelocity;
			if (CameraControl) CameraControl.enabled = false;
			return true; // Knob click handled
		}
		
		// Check if clicking on mortar angle knob
		const angleDx = evt.clientX - mortarAngleKnobInfo.x;
		const angleDy = evt.clientY - mortarAngleKnobInfo.y;
		if (angleDx * angleDx + angleDy * angleDy < mortarAngleKnobInfo.radius * mortarAngleKnobInfo.radius * 1.2) {
			draggingMortarAngleKnob = true;
			dragStartMouseX = evt.clientX;
			dragStartMouseY = evt.clientY;
			dragStartValue = mortarTubeAngle;
			if (CameraControl) CameraControl.enabled = false;
			return true; // Knob click handled
		}
		
		// Check if clicking on gravity knob
		const gravityDx = evt.clientX - gravityKnobInfo.x;
		const gravityDy = evt.clientY - gravityKnobInfo.y;
		if (gravityDx * gravityDx + gravityDy * gravityDy < gravityKnobInfo.radius * gravityKnobInfo.radius * 1.2) {
			draggingGravityKnob = true;
			dragStartMouseX = evt.clientX;
			dragStartMouseY = evt.clientY;
			dragStartValue = Math.abs(Gravity);
			if (CameraControl) CameraControl.enabled = false;
			return true; // Knob click handled
		}
		
		// Check if clicking on ball radius knob
		const ballRadiusDx = evt.clientX - ballRadiusKnobInfo.x;
		const ballRadiusDy = evt.clientY - ballRadiusKnobInfo.y;
		if (ballRadiusDx * ballRadiusDx + ballRadiusDy * ballRadiusDy < ballRadiusKnobInfo.radius * ballRadiusKnobInfo.radius * 1.2) {
			draggingBallRadiusKnob = true;
			dragStartMouseX = evt.clientX;
			dragStartMouseY = evt.clientY;
			dragStartValue = ballRadius;
			if (CameraControl) CameraControl.enabled = false;
			return true; // Knob click handled
		}
	}
	
	return false; // Click not on any menu element
}

// ------------------------------------------
function render() {
	gRenderer.render(gThreeScene, Camera);
}

// make browser to call us repeatedly -----------------------------------
function update() {
	stats.begin();
	
	// Handle startup delay - unpause after 3 seconds
	if (startupTimer > 0) {
		startupTimer -= DeltaT;
		if (startupTimer <= 0) {
			startupTimer = 0;
			gRunning = true;
			autoLaunchEnabled = true;
			needsMenuRedraw = true;
		}
	}
	
	// Handle loading screen fade
	if (loadingScreen && loadingScreen.parentNode) {
		loadTimeElapsed += DeltaT;
		
		// Start fade out if: min time elapsed AND all resources loaded
		if (!fadeOutStarted && loadTimeElapsed >= minLoadTime && loadingComplete) {
			fadeOutStarted = true;
			loadingScreen.style.opacity = '0';
		}
		
		// Track fade progress and remove when complete
		if (fadeOutStarted) {
			fadeOutProgress += DeltaT;
			if (fadeOutProgress >= fadeOutDuration) {
				loadingScreen.parentNode.removeChild(loadingScreen);
				loadingScreen = null;
			}
		}
	}
	
	// Update camera rotation for auto modes (rotate around OrbitControls target)
	if (gCameraMode === 1 || gCameraMode === 2) {
		// Get current camera position relative to target
		const target = CameraControl.target;
		const dx = Camera.position.x - target.x;
		const dy = Camera.position.y - target.y;
		const dz = Camera.position.z - target.z;
		const radius = Math.sqrt(dx * dx + dz * dz); // Horizontal radius
		
		// Calculate rotation angle
		const angleChange = gCameraRotationSpeed * DeltaT * 0.1;
		gCameraAngle += (gCameraMode === 1) ? -angleChange : angleChange;
		
		// Apply rotation around target (maintaining height)
		Camera.position.x = target.x + Math.cos(gCameraAngle) * radius;
		Camera.position.z = target.z + Math.sin(gCameraAngle) * radius;
		Camera.lookAt(target);
	} else if (gCameraMode === 3 && helicopterModelTemplate) {
		// Helicopter cab camera - position camera at right-hand seat viewer position
		var cabCameraWorldPos = new THREE.Vector3();
		if (helicopterCameraGhostSphere) {
			helicopterCameraGhostSphere.getWorldPosition(cabCameraWorldPos);
			Camera.position.copy(cabCameraWorldPos);
			
			// Calculate look target with pan and tilt applied
			var baseLookTarget = new THREE.Vector3(0, 20, 0);
			var direction = new THREE.Vector3().subVectors(baseLookTarget, cabCameraWorldPos).normalize();
			
			// Apply pan (yaw) rotation around Y axis
			var panQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), cameraPan);
			direction.applyQuaternion(panQuat);
			
			// Apply tilt (pitch) rotation around right axis
			var rightAxis = new THREE.Vector3(1, 0, 0).applyQuaternion(panQuat);
			var tiltQuat = new THREE.Quaternion().setFromAxisAngle(rightAxis, cameraTilt);
			direction.applyQuaternion(tiltQuat);
			
			var lookTarget = cabCameraWorldPos.clone().add(direction.multiplyScalar(100));
			Camera.lookAt(lookTarget);
		}
	} else if (gCameraMode === 4 && zeppelinModelTemplate) {
		// Zeppelin camera - position camera at zeppelinCamPoint
		var zeppelinCameraWorldPos = new THREE.Vector3();
		if (zeppelinCamPoint) {
			zeppelinCamPoint.getWorldPosition(zeppelinCameraWorldPos);
			Camera.position.copy(zeppelinCameraWorldPos);
			
			// Calculate look target with pan and tilt applied
			var baseLookTarget = new THREE.Vector3(0, 20, 0);
			var direction = new THREE.Vector3().subVectors(baseLookTarget, zeppelinCameraWorldPos).normalize();
			
			// Apply pan (yaw) rotation around Y axis
			var panQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), cameraPan);
			direction.applyQuaternion(panQuat);
			
			// Apply tilt (pitch) rotation around right axis
			var rightAxis = new THREE.Vector3(1, 0, 0).applyQuaternion(panQuat);
			var tiltQuat = new THREE.Quaternion().setFromAxisAngle(rightAxis, cameraTilt);
			direction.applyQuaternion(tiltQuat);
			
			var lookTarget = zeppelinCameraWorldPos.clone().add(direction.multiplyScalar(100));
			Camera.lookAt(lookTarget);
		}
	} else if (gCameraMode === 5 && sailboatModelTemplate) {
		// Sailboat camera - position camera at sailboatCamPoint
		var sailboatCameraWorldPos = new THREE.Vector3();
		if (sailboatCamPoint) {
			sailboatCamPoint.getWorldPosition(sailboatCameraWorldPos);
			Camera.position.copy(sailboatCameraWorldPos);
			
			// Calculate look target with pan and tilt applied
			var baseLookTarget = new THREE.Vector3(0, 20, 0);
			var direction = new THREE.Vector3().subVectors(baseLookTarget, sailboatCameraWorldPos).normalize();
			
			// Apply pan (yaw) rotation around Y axis
			var panQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), cameraPan);
			direction.applyQuaternion(panQuat);
			
			// Apply tilt (pitch) rotation around right axis
			var rightAxis = new THREE.Vector3(1, 0, 0).applyQuaternion(panQuat);
			var tiltQuat = new THREE.Quaternion().setFromAxisAngle(rightAxis, cameraTilt);
			direction.applyQuaternion(tiltQuat);
			
			var lookTarget = sailboatCameraWorldPos.clone().add(direction.multiplyScalar(100));
			Camera.lookAt(lookTarget);
		}
	}
	
	// Adjust spotlight cone opacity based on camera mode (very faint in cab view)
	if (spotlightCone) {
		if (gCameraMode === 3) {
			spotlightCone.material.opacity = 0.08; // Very faint in helicopter cab view
		} else {
			spotlightCone.material.opacity = 1.0; // Normal visibility in other views
		}
	}
	
	// Adjust helicopter interior lighting and materials for cab view
	if (gCameraMode === 3) {
		// In cab view: darken interior and activate red cabin light
		for (let i = 0; i < helicopterInteriorMeshes.length; i++) {
			let mesh = helicopterInteriorMeshes[i];
			if (mesh.material) {
				// Create darker version of material
				if (!mesh.material.userData.isDarkened) {
					let darkerMaterial = mesh.material.clone();
					if (darkerMaterial.color) {
						darkerMaterial.color.multiplyScalar(0.15); // 15% brightness
					}
					mesh.material = darkerMaterial;
					mesh.material.userData.isDarkened = true;
				}
			}
		}
		// Turn on red cabin light
		if (helicopterCabinLight) {
			helicopterCabinLight.intensity = 2.0;
		}
	} else {
		// Not in cab view: restore original interior materials and turn off cabin light
		for (let i = 0; i < helicopterInteriorMeshes.length; i++) {
			let mesh = helicopterInteriorMeshes[i];
			if (mesh.material && mesh.material.userData.isDarkened) {
				mesh.material = helicopterInteriorOriginalMaterials[i];
			}
		}
		// Turn off red cabin light
		if (helicopterCabinLight) {
			helicopterCabinLight.intensity = 0;
		}
	}
	
	// Update camera FOV
	Camera.fov = gCameraFOV;
	Camera.updateProjectionMatrix();
	
	// Update menu animations
	if (mainMenuVisible) {
		const oldOpacity = mainMenuOpacity;
		const oldOffset = mainMenuXOffset;
		mainMenuOpacity = Math.min(1, mainMenuOpacity + mainMenuFadeSpeed * DeltaT);
		mainMenuXOffset = Math.min(0, mainMenuXOffset + mainMenuAnimSpeed * DeltaT);
		if (oldOpacity !== mainMenuOpacity || oldOffset !== mainMenuXOffset) needsMenuRedraw = true;
	} else {
		const oldOpacity = mainMenuOpacity;
		const oldOffset = mainMenuXOffset;
		mainMenuOpacity = Math.max(0, mainMenuOpacity - mainMenuFadeSpeed * DeltaT);
		mainMenuXOffset = Math.max(-1.0, mainMenuXOffset - mainMenuAnimSpeed * DeltaT);
		if (oldOpacity !== mainMenuOpacity || oldOffset !== mainMenuXOffset) needsMenuRedraw = true;
	}
	
	if (cameraMenuVisible) {
		const oldOpacity = cameraMenuOpacity;
		cameraMenuOpacity = Math.min(0.9, cameraMenuOpacity + cameraMenuFadeSpeed * DeltaT);
		if (oldOpacity !== cameraMenuOpacity) needsMenuRedraw = true;
	} else {
		const oldOpacity = cameraMenuOpacity;
		cameraMenuOpacity = Math.max(0, cameraMenuOpacity - cameraMenuFadeSpeed * DeltaT);
		if (oldOpacity !== cameraMenuOpacity) needsMenuRedraw = true;
	}
	
	if (simulationMenuVisible) {
		const oldOpacity = simulationMenuOpacity;
		simulationMenuOpacity = Math.min(0.9, simulationMenuOpacity + simulationMenuFadeSpeed * DeltaT);
		if (oldOpacity !== simulationMenuOpacity) needsMenuRedraw = true;
	} else {
		const oldOpacity = simulationMenuOpacity;
		simulationMenuOpacity = Math.max(0, simulationMenuOpacity - simulationMenuFadeSpeed * DeltaT);
		if (oldOpacity !== simulationMenuOpacity) needsMenuRedraw = true;
	}
	
	simulate();
	render();
	drawMenus(); // Draw menus on overlay canvas
	
	// Update OrbitControls in all modes
	CameraControl.update();
	stats.end();
	requestAnimationFrame(update);
}

initThreeScene();
initScene();
update();