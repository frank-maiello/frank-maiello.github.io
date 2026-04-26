// BALL3D : 3D Particle Simulation
// copyright 2026 :: Frank Maiello :: maiello.frank@gmail.com

// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
// Blank 3D Space -------------------------------------------

const DeltaT = 1.0 / 60.0;
const Gravity = -1.5;
const worldRadius = 200; // Circular boundary radius
const worldSizeY = 20;

const particlesPerMortar = 3000; // Particles per mortar
const sparkPoolSize = 3000; // Extra particles for spark trails
const numBalls = 75000 + sparkPoolSize; // 25 mortars × 2000 + spark pool
const mortarAltitude = 0.05; // Start just above ground level
const explosionSpeed = 4.0; // Velocity magnitude for GO button explosion
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
var autoLaunchEnabled = true; // Auto-launch mortars at random intervals
var nextLaunchTime = 0; // Time until next mortar launch
var timeSinceLastLaunch = 0; // Time elapsed since last launch
var sparkPool = []; // Pool of available spark particle indices
var clusterCenter = new THREE.Vector3(); // Center of initial ball cluster
var stats;

// Camera control variables
var gCameraMode = 2; // 0=Auto Orbit CW, 1=Auto Orbit CCW, 2=Manual Orbit
var gCameraAngle = 0;
var gCameraRotationSpeed = 3.0;
var gCameraFOV = 57;
var gRunning = true; // Simulation running state

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
var cameraMenuX = 0.15;
var cameraMenuY = 0.1;
var needsMenuRedraw = true; // Flag to optimize canvas clearing

// Knob drag state
var draggingFOVKnob = false;
var draggingOrbitSpeedKnob = false;
var fovKnobInfo = { x: 0, y: 0, radius: 0 };
var orbitSpeedKnobInfo = { x: 0, y: 0, radius: 0 };
var dragStartMouseX = 0;
var dragStartMouseY = 0;
var dragStartValue = 0;

// Shock wave system
var shockWaves = []; // Array of active shock waves
var shockWaveMeshPool = []; // Pool of reusable shock wave meshes
var maxShockWaves = 50; // Maximum number of concurrent shock waves

// Instanced rendering for performance
var ballInstancedMesh = null;
var ballMatrix = new THREE.Matrix4();
var ballColor = new THREE.Color();

// Mortar Class -------------------------------------------
class MORTAR {
	constructor(position, particleColor, startIndex, particleCount) {
		this.position = position.clone();
		this.particleColor = particleColor; // Base color for particles
		this.startIndex = startIndex; // Starting index in global Balls array
		this.particleCount = particleCount; // Number of particles this mortar uses
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
		const ballRadius = 0.02;
		for (let i = 0; i < this.particleCount; i++) {
			let pos = null;
			let theta = Math.random() * Math.PI * 2;
			let phi = Math.acos(2 * Math.random() - 1);
			let r = Math.cbrt(Math.random()) * (3 * ballRadius);
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
		let launchVelocity = 30.0 + Math.random() * 10.0;
		
		// Reset and launch all this mortar's particles
		const ballRadius = 0.02;
		for (let i = this.startIndex; i < this.startIndex + this.particleCount; i++) {
			if (Balls[i]) {
				// Reset position to tight cluster at mortar location
				let theta = Math.random() * Math.PI * 2;
				let phi = Math.acos(2 * Math.random() - 1);
				let r = Math.cbrt(Math.random()) * (3 * ballRadius);
				Balls[i].pos.set(
					this.position.x + r * Math.sin(phi) * Math.cos(theta),
					mortarAltitude + r * Math.cos(phi),
					this.position.z + r * Math.sin(phi) * Math.sin(theta)
				);
				
				// Set upward velocity
				Balls[i].vel.set(0, launchVelocity, 0);
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
		for (let i = this.startIndex; i < this.startIndex + this.particleCount; i++) {
			if (!Balls[i]) continue;
			
			Balls[i].active = true;
			Balls[i].hasExploded = true;
			Balls[i].age = 0;
			Balls[i].brightness = 1.0;
			//Balls[i].speedMultiplier = 0.7 + Math.random() * 0.6;
			Balls[i].speedMultiplier = 2.0 + (-0.5 + Math.random()) * 0.2;
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
		this.lifetime = 0.1; // 0.15 seconds - very quick flash
		this.startRadius = 0.0;
		this.maxRadius = 1.5; // Maximum expansion radius
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
		
		// Fade opacity (start at 0.85, fade to 0 - bright flash)
		const opacity = 0.65 * (1.0 - progress);
		
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

// ------------------------------------------------------------------
function initScene() {	
	// Create instanced mesh for all balls (single draw call)
	if (ballInstancedMesh) {
		gThreeScene.remove(ballInstancedMesh);
		ballInstancedMesh.geometry.dispose();
		ballInstancedMesh.material.dispose();
	}
	
	const ballRadius = 0.02;
	const ballGeometry = new THREE.SphereGeometry(ballRadius, 8, 8);
	const ballMaterial = new THREE.MeshBasicMaterial();
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
	
	// Create mortars in concentric rings: 1 center + 8 in ring 1 + 16 in ring 2
	let mortarIndex = 0;
	let mortarPositions = [];
	
	// Center mortar
	mortarPositions.push(new THREE.Vector3(0, 0, 0));
	
	// First ring: 8 mortars
	let ring1Radius = mortarSpacing * 2.0;
	for (let i = 0; i < 8; i++) {
		let angle = (i / 8) * Math.PI * 2;
		let x = Math.cos(angle) * ring1Radius;
		let z = Math.sin(angle) * ring1Radius;
		mortarPositions.push(new THREE.Vector3(x, 0, z));
	}
	
	// Second ring: 16 mortars
	let ring2Radius = mortarSpacing * 4.0;
	for (let i = 0; i < 16; i++) {
		let angle = (i / 16) * Math.PI * 2;
		let x = Math.cos(angle) * ring2Radius;
		let z = Math.sin(angle) * ring2Radius;
		mortarPositions.push(new THREE.Vector3(x, 0, z));
	}
	
	// Create mortars at each position
	for (let i = 0; i < mortarPositions.length; i++) {
		let color = mortarColors[mortarIndex % mortarColors.length];
		let startIndex = mortarIndex * particlesPerMortar;
		let mortar = new MORTAR(mortarPositions[i], color, startIndex, particlesPerMortar);
		Mortars.push(mortar);
		mortarIndex++;
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

}
	
// ------------------------------------------
function initThreeScene() {
	gThreeScene = new THREE.Scene();
	gThreeScene.background = new THREE.Color(0x000000);

	var cityscapeLoader = new THREE.GLTFLoader();
	cityscapeLoader.load(
		'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/HudsonView.gltf',
		function(gltf) {
			cityscapeModelTemplate = gltf.scene;
			cityscapeModelTemplate.position.set(-25, -0.1, -10);
			cityscapeModelTemplate.scale.set(0.5, 0.5, 0.5);

			gThreeScene.add(cityscapeModelTemplate);
			console.log('cityscape model loaded successfully');
		},
		function(xhr) {
			console.log('cityscape model: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
		},
		function(error) {
			console.error('Error loading cityscape model:', error);
		}
	);
	
	// ambient light
	gThreeScene.add( new THREE.AmbientLight( 0x101010 ) );	

	// directional light to simulate moonlight
	var dirLight = new THREE.DirectionalLight( 0x999999, 0.5 );
	dirLight.position.set( -30, 50, -30 );
	dirLight.castShadow = true;
	dirLight.shadow.camera.near = 1;
	dirLight.shadow.camera.far = worldSizeY + 5;
	dirLight.shadow.camera.right = worldRadius;
	dirLight.shadow.camera.left = -worldRadius;
	dirLight.shadow.camera.top	= worldRadius;
	dirLight.shadow.camera.bottom = -worldRadius;
	dirLight.shadow.mapSize.width = 1024;
	dirLight.shadow.mapSize.height = 1024;
	gThreeScene.add( dirLight );

	// spotligt
	var spotLight = new THREE.SpotLight( 0x999999 );
	spotLight.angle = Math.PI / 16;
	spotLight.penumbra = 0.1;
	spotLight.position.set(30, 80, -50);
	spotLight.castShadow = true;
	spotLight.shadow.camera.near = 70;
	spotLight.shadow.camera.far = 90;
	spotLight.shadow.mapSize.width = 1024;
	spotLight.shadow.mapSize.height = 1024;
	gThreeScene.add( spotLight );
	
	// Visual cone for spotlight
	var coneHeight = 1;
	var coneRadius = Math.tan(spotLight.angle) * coneHeight;
	var coneGeometry = new THREE.ConeGeometry( coneRadius, coneHeight, 32, 1, true );
	var coneMaterial = new THREE.MeshBasicMaterial({ 
		color: 0xffffff, 
		transparent: false,
		side: THREE.DoubleSide
	});
	var coneMesh = new THREE.Mesh( coneGeometry, coneMaterial );
	coneMesh.position.copy(spotLight.position);
	
	// Point cone toward origin (wide end points in light direction)
	var targetPos = new THREE.Vector3(0, 0, 0);
	var direction = new THREE.Vector3().subVectors(targetPos, spotLight.position).normalize();
	// Flip direction so pointed end points back toward light source
	var up = new THREE.Vector3(0, -1, 0); // Negative Y makes wide end point forward
	var axis = new THREE.Vector3().crossVectors(up, direction).normalize();
	var angle = Math.acos(up.dot(direction));
	coneMesh.quaternion.setFromAxisAngle(axis, angle);
	
	// Offset cone so narrow end is at light position
	coneMesh.translateY(coneHeight / 2);
	
	gThreeScene.add( coneMesh );

	// overhead light
	var dirLight = new THREE.DirectionalLight( 0x55505a, 1 );
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

	
	// create round floor plane with radial gradient (blue to black)
	var floorGeometry = new THREE.CircleGeometry(worldRadius, 64);
	
	// Create canvas for radial gradient texture
	var canvas = document.createElement('canvas');
	canvas.width = 1024;
	canvas.height = 1024;
	var ctx = canvas.getContext('2d');
	
	// Create radial gradient from center (blue) to edge (black)
	var gradient = ctx.createRadialGradient(512, 512, 0, 512, 512, 512);
	gradient.addColorStop(0, '#282828');  // Blue at center
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
	
	// Create mortar tubes in concentric rings (vertical cylinders on ground)
	var tubeHeight = 0.7;
	var tubeInnerRadius = 0.09;
	var tubeWallThickness = 0.02;
	var tubeOuterRadius = tubeInnerRadius + tubeWallThickness;
	
	// Inner tube (hollow, open-ended)
	var innerTubeGeometry = new THREE.CylinderGeometry(tubeInnerRadius, tubeInnerRadius, tubeHeight, 8, 1, true);
	// Outer tube (hollow, open-ended)
	var outerTubeGeometry = new THREE.CylinderGeometry(tubeOuterRadius, tubeOuterRadius, tubeHeight, 16, 1, true);
	// Top ring cap (connects inner and outer tube at top)
	var topCapGeometry = new THREE.RingGeometry(tubeInnerRadius, tubeOuterRadius, 32);
	
	// Inner tube material (back side - shows outer surface)
	var innerTubeMaterial = new THREE.MeshBasicMaterial({
		color: 0x1a1a1a,  
		side: THREE.BackSide
	});
	
	// Outer tube material (front side - shows inner surface)
	var outerTubeMaterial = new THREE.MeshPhongMaterial({
		color: 0xf72027,  
		side: THREE.FrontSide
	});
	
	// Top cap material 
	var topCapMaterial = new THREE.MeshPhongMaterial({
		color: 0xf72027,  
		side: THREE.FrontSide
	});
	
	// Square base geometry (thin box)
	var baseSize = 0.35;
	var baseHeight = 0.08;
	var baseGeometry = new THREE.BoxGeometry(baseSize, baseHeight, baseSize);
	var baseMaterial = new THREE.MeshPhongMaterial({
		color: 0xf79a20,  // Darker gray/black
	});
	
	// Center tube with base
	// Inner tube
	var innerTubeMesh = new THREE.Mesh(innerTubeGeometry, innerTubeMaterial);
	innerTubeMesh.position.set(0, tubeHeight / 2, 0);
	innerTubeMesh.castShadow = true;
	innerTubeMesh.receiveShadow = true;
	gThreeScene.add(innerTubeMesh);
	
	// Outer tube
	var outerTubeMesh = new THREE.Mesh(outerTubeGeometry, outerTubeMaterial);
	outerTubeMesh.position.set(0, tubeHeight / 2, 0);
	outerTubeMesh.castShadow = true;
	outerTubeMesh.receiveShadow = true;
	gThreeScene.add(outerTubeMesh);
	
	// Top cap
	var topCapMesh = new THREE.Mesh(topCapGeometry, topCapMaterial);
	topCapMesh.position.set(0, tubeHeight, 0);
	topCapMesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
	topCapMesh.castShadow = true;
	topCapMesh.receiveShadow = true;
	gThreeScene.add(topCapMesh);
	
	var baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
	baseMesh.position.set(0, baseHeight / 2, 0);
	baseMesh.castShadow = true;
	baseMesh.receiveShadow = true;
	gThreeScene.add(baseMesh);
	
	// First ring: 8 tubes
	let ring1Radius = mortarSpacing * 2.0;
	for (let i = 0; i < 8; i++) {
		let angle = (i / 8) * Math.PI * 2;
		let x = Math.cos(angle) * ring1Radius;
		let z = Math.sin(angle) * ring1Radius;
		
		// Inner tube
		innerTubeMesh = new THREE.Mesh(innerTubeGeometry, innerTubeMaterial);
		innerTubeMesh.position.set(x, tubeHeight / 2, z);
		innerTubeMesh.castShadow = true;
		innerTubeMesh.receiveShadow = true;
		gThreeScene.add(innerTubeMesh);
		
		// Outer tube
		outerTubeMesh = new THREE.Mesh(outerTubeGeometry, outerTubeMaterial);
		outerTubeMesh.position.set(x, tubeHeight / 2, z);
		outerTubeMesh.castShadow = true;
		outerTubeMesh.receiveShadow = true;
		gThreeScene.add(outerTubeMesh);
		
		// Top cap
		topCapMesh = new THREE.Mesh(topCapGeometry, topCapMaterial);
		topCapMesh.position.set(x, tubeHeight, z);
		topCapMesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
		topCapMesh.castShadow = true;
		topCapMesh.receiveShadow = true;
		gThreeScene.add(topCapMesh);
		
		baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
		baseMesh.position.set(x, baseHeight / 2, z);
		baseMesh.rotation.y = angle; // Rotate to face radially
		baseMesh.castShadow = true;
		baseMesh.receiveShadow = true;
		gThreeScene.add(baseMesh);
	}
	
	// Second ring: 16 tubes
	let ring2Radius = mortarSpacing * 4.0;
	for (let i = 0; i < 16; i++) {
		let angle = (i / 16) * Math.PI * 2;
		let x = Math.cos(angle) * ring2Radius;
		let z = Math.sin(angle) * ring2Radius;
		
		// Inner tube
		innerTubeMesh = new THREE.Mesh(innerTubeGeometry, innerTubeMaterial);
		innerTubeMesh.position.set(x, tubeHeight / 2, z);
		innerTubeMesh.castShadow = true;
		innerTubeMesh.receiveShadow = true;
		gThreeScene.add(innerTubeMesh);
		
		// Outer tube
		outerTubeMesh = new THREE.Mesh(outerTubeGeometry, outerTubeMaterial);
		outerTubeMesh.position.set(x, tubeHeight / 2, z);
		outerTubeMesh.castShadow = true;
		outerTubeMesh.receiveShadow = true;
		gThreeScene.add(outerTubeMesh);
		
		// Top cap
		topCapMesh = new THREE.Mesh(topCapGeometry, topCapMaterial);
		topCapMesh.position.set(x, tubeHeight, z);
		topCapMesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
		topCapMesh.castShadow = true;
		topCapMesh.receiveShadow = true;
		gThreeScene.add(topCapMesh);
		
		baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
		baseMesh.position.set(x, baseHeight / 2, z);
		baseMesh.rotation.y = angle; // Rotate to face radially
		baseMesh.castShadow = true;
		baseMesh.receiveShadow = true;
		gThreeScene.add(baseMesh);
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

	// Camera	
	Camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
	Camera.position.set(-19.3, 19.2, -8.7);
	Camera.updateMatrixWorld();	
	gThreeScene.add(Camera);

	// Camera control
	CameraControl = new THREE.OrbitControls(Camera, gRenderer.domElement);
	CameraControl.zoomSpeed = 2.0;
	CameraControl.panSpeed = 0.4;
	CameraControl.target.set(0.1, 20.2, -0.9);
	CameraControl.enabled = true; // Enabled by default (Manual mode)
	
	// Calculate initial camera angle from current position relative to target
	const dx = Camera.position.x - CameraControl.target.x;
	const dz = Camera.position.z - CameraControl.target.z;
	gCameraAngle = Math.atan2(dz, dx);

	// Grabber
	gGrabber = new Grabber();
	container.addEventListener( 'pointerdown', onPointer, false );
	container.addEventListener( 'pointermove', onPointer, false );
	container.addEventListener( 'pointerup', onPointer, false );
	
	// Keyboard events
	window.addEventListener( 'keydown', onKeyDown, false );
	
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
		
		gGrabber.start(evt.clientX, evt.clientY);
		gMouseDown = true;
		if (gGrabber.physicsObject) {
			CameraControl.saveState();
			CameraControl.enabled = false;
		}
	}
	else if (evt.type == "pointermove" && (gMouseDown || draggingFOVKnob || draggingOrbitSpeedKnob)) {
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
			const rangeSize = 25.0 - 0.5; // Orbit speed range: 0.5 to 25.0
			let newValue = dragStartValue + normalizedDelta * rangeSize; // Not reversed
			newValue = Math.max(0.5, Math.min(25.0, newValue));
			
			gCameraRotationSpeed = newValue;
			needsMenuRedraw = true;
			return;
		}
		
		gGrabber.move(evt.clientX, evt.clientY);
	}
	else if (evt.type == "pointerup") {
		draggingFOVKnob = false;
		draggingOrbitSpeedKnob = false;
		
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
	const menuHeight = itemHeight * 2 + (padding * 3); // Two items: play/pause and camera
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
	menuGradient.addColorStop(0, 'rgba(26, 26, 26, 0.9)');
	menuGradient.addColorStop(1, 'rgba(51, 51, 51, 0.9)');
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
	
	// Background color varies by camera mode
	const cameraBackgroundColors = [
		'hsla(60, 30%, 30%, 0.80)',   // Mode 0: Rotate CW
		'hsla(80, 30%, 30%, 0.80)',   // Mode 1: Rotate CCW
		'hsla(100, 30%, 30%, 0.80)'   // Mode 2: Manual
	];
	ctx.fillStyle = cameraBackgroundColors[gCameraMode];
	ctx.fill();
	
	// Draw camera icon (movie camera)
	const icon2X = itemX + 0.5 * itemWidth;
	const icon2Y = itemY2 + 0.6 * itemHeight;
	const camSize = iconSize * 1.6;
	
	ctx.save();
	ctx.translate(icon2X, icon2Y);
	ctx.fillStyle = `hsla(0, 0%, 40%, 1.0)`;
	ctx.strokeStyle = `hsla(0, 0%, 60%, 1.0)`;
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
	const menuWidth = knobRadius * 3.7; // Fixed width
	const radioSectionHeight = 3 * radioButtonSpacing + 0.004 * menuScale; // Adjusted to keep height same
	const menuHeight = radioSectionHeight + knobRadius * 2.24;
	
	// Position menu
	const menuOriginX = cameraMenuX * window.innerWidth;
	const menuOriginY = cameraMenuY * window.innerHeight;
	
	ctx.save();
	ctx.translate(menuOriginX, menuOriginY);
	ctx.globalAlpha = cameraMenuOpacity;
	
	// Draw menu background
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
	
	// Draw radio buttons for camera modes
	const cameraModeNames = [
		'Auto Orbit Cam CCW',
		'Auto Orbit Cam CW',
		'Manual Orbit Cam'
	];
	
	const radioStartY = 0;
	
	for (let i = 0; i < cameraModeNames.length; i++) {
		const radioY = radioStartY + i * radioButtonSpacing;
		const radioX = -0.02 * menuScale;
		
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
	const knobY = radioSectionHeight + knobRadius * 0.8;
	
	// FOV Knob
	drawKnob(ctx, fovKnobX, knobY, knobRadius, gCameraFOV, 3, 170, true, 'Focal Length', 210);
	
	// Orbit Speed Knob
	drawKnob(ctx, orbitSpeedKnobX, knobY, knobRadius, gCameraRotationSpeed, 0.5, 25.0, false, 'Orbit Speed', 280);
	
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
	} else {
		ctx.fillText(value.toFixed(1), x, y + 0.6 * radius);
	}
	
	// Draw label
	ctx.font = `${0.35 * radius}px verdana`;
	ctx.fillStyle = 'rgba(220, 220, 230, 1.0)';
	ctx.fillText(label, x, y + 1.35 * radius);
}

function updateKnobPositions() {
	const cScale = Math.min(window.innerWidth, window.innerHeight) / 2.0;
	const menuScale = cScale; // Use same scale as main menu
	const knobRadius = 0.1 * menuScale;
	const radioButtonSpacing = 0.095 * menuScale; // Matches drawCameraMenu
	const radioSectionHeight = 3 * radioButtonSpacing + 0.004 * menuScale; // Matches drawCameraMenu
	const menuOriginX = cameraMenuX * window.innerWidth;
	const menuOriginY = cameraMenuY * window.innerHeight;
	const horizontalKnobSpacing = knobRadius * 2.5; // Matches drawCameraMenu
	const menuWidth = knobRadius * 3.7; // Matches drawCameraMenu
	const fovKnobX = menuWidth / 2 - horizontalKnobSpacing / 2;
	const orbitSpeedKnobX = menuWidth / 2 + horizontalKnobSpacing / 2;
	const knobY = radioSectionHeight + knobRadius * 0.8;
	
	fovKnobInfo = { x: menuOriginX + fovKnobX, y: menuOriginY + knobY, radius: knobRadius };
	orbitSpeedKnobInfo = { x: menuOriginX + orbitSpeedKnobX, y: menuOriginY + knobY, radius: knobRadius };
}

function drawMenus() {
	if (!gOverlayCtx) return;
	
	// Always clear and redraw if menus are visible or animating
	const isAnimating = (mainMenuOpacity > 0) || (cameraMenuOpacity > 0);
	if (!needsMenuRedraw && !isAnimating) return;
	
	// Clear overlay
	gOverlayCtx.clearRect(0, 0, gOverlayCanvas.width, gOverlayCanvas.height);
	
	// Draw menus
	drawMainMenu();
	drawCameraMenu();
	
	needsMenuRedraw = false;
}

function onMenuClick(evt) {
	const cScale = Math.min(window.innerWidth, window.innerHeight) / 2.0;
	
	// Check ellipsis click (toggle main menu) - simple large top-left corner hitbox
	if (evt.clientX < 0.15 * cScale && evt.clientY < 0.15 * cScale) {
		mainMenuVisible = !mainMenuVisible;
		// Close camera menu when main menu is closed
		if (!mainMenuVisible) {
			cameraMenuVisible = false;
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
		const menuOriginX = cameraMenuX * window.innerWidth;
		const menuOriginY = cameraMenuY * window.innerHeight;
		const padding = 0.17 * menuScale;
		const knobRadius = 0.1 * menuScale;
		const radioButtonSpacing = 0.095 * menuScale; // Matches drawCameraMenu
		const horizontalKnobSpacing = knobRadius * 2.5; // Matches drawCameraMenu
		const menuWidth = knobRadius * 3.7; // Matches drawCameraMenu
		const radioSectionHeight = 3 * radioButtonSpacing + 0.004 * menuScale; // Matches drawCameraMenu
		const menuHeight = radioSectionHeight + knobRadius * 2.24; // Matches drawCameraMenu
		
		// Check close button
		const closeIconRadius = 0.1 * menuScale * 0.25;
		const closeIconX = menuOriginX - padding + closeIconRadius + 0.02 * menuScale;
		const closeIconY = menuOriginY - padding + closeIconRadius + 0.02 * menuScale;
		const dx = evt.clientX - closeIconX;
		const dy = evt.clientY - closeIconY;
		if (dx * dx + dy * dy < closeIconRadius * closeIconRadius) {
			cameraMenuVisible = false;
			needsMenuRedraw = true;
			evt.stopPropagation();
			return true; // Menu click handled
		}
		
		// Check radio buttons
		const radioStartY = 0;
		const radioX = menuOriginX - 0.02 * menuScale;
		const radioButtonSize = 0.04 * menuScale;
		
		for (let i = 0; i < 3; i++) {
			const radioY = menuOriginY + radioStartY + i * radioButtonSpacing;
			const rdx = evt.clientX - radioX;
			const rdy = evt.clientY - radioY;
			if (rdx * rdx + rdy * rdy < (radioButtonSize * 2) * (radioButtonSize * 2)) {
				gCameraMode = i;
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
	
	return false; // Click not on any menu element
}

// ------------------------------------------
function render() {
	gRenderer.render(gThreeScene, Camera);
}

// make browser to call us repeatedly -----------------------------------
function update() {
	stats.begin();
	
	// Update camera rotation for auto modes (rotate around OrbitControls target)
	if (gCameraMode === 0 || gCameraMode === 1) {
		// Get current camera position relative to target
		const target = CameraControl.target;
		const dx = Camera.position.x - target.x;
		const dy = Camera.position.y - target.y;
		const dz = Camera.position.z - target.z;
		const radius = Math.sqrt(dx * dx + dz * dz); // Horizontal radius
		
		// Calculate rotation angle
		const angleChange = gCameraRotationSpeed * DeltaT * 0.1;
		gCameraAngle += (gCameraMode === 0) ? -angleChange : angleChange;
		
		// Apply rotation around target (maintaining height)
		Camera.position.x = target.x + Math.cos(gCameraAngle) * radius;
		Camera.position.z = target.z + Math.sin(gCameraAngle) * radius;
		Camera.lookAt(target);
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