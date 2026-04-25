// BALL3D : 3D Particle Simulation
// copyright 2026 :: Frank Maiello :: maiello.frank@gmail.com

// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
// Blank 3D Space -------------------------------------------

const DeltaT = 1.0 / 60.0;
const Gravity = -0.5;
const worldRadius = 50; // Circular boundary radius
const worldSizeY = 20;

const particlesPerMortar = 3000; // Particles per mortar
const sparkPoolSize = 3000; // Extra particles for spark trails
const numBalls = 75000 + sparkPoolSize; // 25 mortars × 2000 + spark pool
const mortarAltitude = 0.05; // Start just above ground level
const explosionSpeed = 4.0; // Velocity magnitude for GO button explosion
const mortarSpacing = 3.0; // Space between mortar tubes in grid
const sparkLifetime = 0.3; // Sparks fade very quickly
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
var nextSparkIndex = 50000; // Start spark indices after mortar particles
var buttonCanvas;
var buttonCtx;
var buttonWidth, buttonHeight;
var goButtonX, goButtonY;
var clusterCenter = new THREE.Vector3(); // Center of initial ball cluster
var stats;

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
		let launchVelocity = 20.0 + Math.random() * 10.0;
		
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
		
		// Set random detonation time (0.7 to 1.3 seconds)
		this.detonationTime = 0.7 + Math.random() * 0.6;
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
		this.restitution = 0.90;
		this.grabbed = false;
		this.brightness = 1.0; // Starts at full brightness
		this.active = true; // Track if particle is active
		this.age = 0; // Time since explosion/creation
		this.hasExploded = false; // Track if this particle has been part of an explosion
		this.isSpark = false; // Track if this is a trail spark (not main firework particle)
		
		// Add variability to speed and lifetime (firework embers burn out over time)
		//this.speedMultiplier = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
		this.speedMultiplier = 1.0;
		this.lifetime = 2.0 + Math.random() * 2.0; // 2.0 to 4.0 seconds - time until particle fades out
		
	}
	handleCollision(other) {
		let dir = new THREE.Vector3();
		dir.subVectors(other.pos, this.pos);
		let d = dir.length();

		let minDist = this.radius + other.radius;
		if (d >= minDist)
			return;

		dir.multiplyScalar(1.0 / d);
		let corr = (minDist - d) / 2.0;
		this.pos.addScaledVector(dir, -corr);
		other.pos.addScaledVector(dir, corr);

		let v1 = this.vel.dot(dir);
		let v2 = other.vel.dot(dir);

		let m1 = this.mass;
		let m2 = other.mass;
		
		// Use reduced restitution to dampen collisions and prevent feedback loops
		let effectiveRestitution = this.restitution * 0.7;

		let newV1 = (m1 * v1 + m2 * v2 - m2 * (v1 - v2) * effectiveRestitution) / (m1 + m2);
		let newV2 = (m1 * v1 + m2 * v2 - m1 * (v2 - v1) * effectiveRestitution) / (m1 + m2);

		this.vel.addScaledVector(dir, newV1 - v1);
		other.vel.addScaledVector(dir, newV2 - v2);					

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

		// Only check floor boundary (no walls or ceiling)
		if (this.pos.y < this.radius) {
			this.pos.y = this.radius; 
			this.vel.y = -this.restitution * this.vel.y;
		}
		
		// Limit maximum speed
		let speed = this.vel.length();
		
		// Always update color with brightness (even during mortar flight)
		this.updateColorWithBrightness();
		
		// Age particles after explosion OR if it's a spark
		if (this.hasExploded || this.isSpark) {
			this.age += DeltaT;
			// Brightness fades from 1.0 to 0.3 (still somewhat bright when extinguishing)
			// Sparks fade to 0 (completely disappear)
			let minBrightness = this.isSpark ? 0 : 0.3;
			this.brightness = Math.max(minBrightness, 1.0 - (this.age / this.lifetime));
			
			// Return spark to pool when it fades out
			if (this.isSpark && this.age >= this.lifetime) {
				this.active = false;
				sparkPool.push(this.instanceId);
				// Scale to zero to hide it
				ballMatrix.makeScale(0, 0, 0);
				ballInstancedMesh.setMatrixAt(this.instanceId, ballMatrix);
			}
		}
		
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
	const ballGeometry = new THREE.SphereGeometry(ballRadius, 16, 16);
	const ballMaterial = new THREE.MeshBasicMaterial();
	ballInstancedMesh = new THREE.InstancedMesh(ballGeometry, ballMaterial, numBalls);
	ballInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
	ballInstancedMesh.castShadow = false;
	ballInstancedMesh.receiveShadow = false;
	
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
	
	let mortarIndex = 0;
	for (let row = -2; row <= 2; row++) {
		for (let col = -2; col <= 2; col++) {
			let position = new THREE.Vector3(
				col * mortarSpacing,
				0,
				row * mortarSpacing
			);
			let color = mortarColors[mortarIndex % mortarColors.length];
			let startIndex = mortarIndex * particlesPerMortar;
			let mortar = new MORTAR(position, color, startIndex, particlesPerMortar);
			Mortars.push(mortar);
			mortarIndex++;
		}
	}
	
	// Initialize spark pool (indices after mortar particles)
	sparkPool = [];
	for (let i = 50000; i < numBalls; i++) {
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
	
	// ambient light
	gThreeScene.add( new THREE.AmbientLight( 0x505050 ) );	

	// spotligt
	var spotLight = new THREE.SpotLight( 0xffffff );
	spotLight.angle = Math.PI / 8;
	spotLight.penumbra = 0.0;
	spotLight.position.set(10, 10, 5);
	spotLight.castShadow = true;
	spotLight.shadow.camera.near = 1;
	spotLight.shadow.camera.far = 20;
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
	canvas.width = 512;
	canvas.height = 512;
	var ctx = canvas.getContext('2d');
	
	// Create radial gradient from center (blue) to edge (black)
	var gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
	gradient.addColorStop(0, '#0066ff');  // Blue at center
	gradient.addColorStop(1, '#000000');  // Black at edge
	
	// Fill canvas with gradient
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, 512, 512);
	
	// Create texture from canvas
	var floorTexture = new THREE.CanvasTexture(canvas);
	var floorMaterial = new THREE.MeshPhongMaterial({ 
		map: floorTexture,
		side: THREE.FrontSide
	});
	var floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
	floorMesh.rotation.x = -Math.PI / 2;
	floorMesh.position.set(0, 0, 0);
	floorMesh.receiveShadow = true;
	gThreeScene.add(floorMesh);
	
	// Create 3x3 grid of mortar tubes (vertical cylinders on ground)
	var tubeHeight = 0.4;
	var tubeRadius = 0.08;
	var tubeGeometry = new THREE.CylinderGeometry(tubeRadius, tubeRadius, tubeHeight, 32);
	var tubeMaterial = new THREE.MeshStandardMaterial({
		color: 0x2a2a2a,  // Dark gray/black
		metalness: 0.7,
		roughness: 0.4,
		emissive: 0x0a0a0a,
		emissiveIntensity: 0.1
	});
	
	for (let row = -2; row <= 2; row++) {
		for (let col = -2; col <= 2; col++) {
			var tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
			tubeMesh.position.set(
				col * mortarSpacing,
				tubeHeight / 2,
				row * mortarSpacing
			);
			tubeMesh.castShadow = true;
			tubeMesh.receiveShadow = true;
			gThreeScene.add(tubeMesh);
		}
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
	Camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 1000);
	Camera.position.set(-4.6, 2.1, 8.8);
	Camera.updateMatrixWorld();	
	gThreeScene.add(Camera);

	// Camera control
	CameraControl = new THREE.OrbitControls(Camera, gRenderer.domElement);
	CameraControl.zoomSpeed = 2.0;
	CameraControl.panSpeed = 0.4;
	CameraControl.target.set(-0.0, 3.6, -0.1);
	CameraControl.enabled = true; // Enable OrbitControls

	// Grabber
	gGrabber = new Grabber();
	container.addEventListener( 'pointerdown', onPointer, false );
	container.addEventListener( 'pointermove', onPointer, false );
	container.addEventListener( 'pointerup', onPointer, false );
	
	// Keyboard events
	window.addEventListener( 'keydown', onKeyDown, false );
	
	// Create 2D overlay canvas for UI button
	buttonCanvas = document.createElement('canvas');
	buttonCanvas.width = window.innerWidth;
	buttonCanvas.height = window.innerHeight;
	buttonCanvas.style.position = 'absolute';
	buttonCanvas.style.top = '0';
	buttonCanvas.style.left = '0';
	buttonCanvas.style.pointerEvents = 'none';
	container.appendChild(buttonCanvas);
	buttonCtx = buttonCanvas.getContext('2d');
	
	// Button dimensions
	buttonWidth = 70;
	buttonHeight = 25;
	
	// LAUNCH button position (bottom right)
	goButtonX = window.innerWidth - buttonWidth - 10;
	goButtonY = window.innerHeight - buttonHeight - 10;
	
	// Add click handler for buttons
	container.addEventListener('click', onButtonClick, false);
	
	drawButton();
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
		gGrabber.start(evt.clientX, evt.clientY);
		gMouseDown = true;
		if (gGrabber.physicsObject) {
			CameraControl.saveState();
			CameraControl.enabled = false;
		}
	}
	else if (evt.type == "pointermove" && gMouseDown) {
		gGrabber.move(evt.clientX, evt.clientY);
	}
	else if (evt.type == "pointerup") {
		if (gGrabber.physicsObject) {
			gGrabber.end();
			CameraControl.reset();
		}
		gMouseDown = false;
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
	
	// Resize button canvas
	if (buttonCanvas) {
		buttonCanvas.width = window.innerWidth;
		buttonCanvas.height = window.innerHeight;
		goButtonX = window.innerWidth - buttonWidth - 10;
		goButtonY = window.innerHeight - buttonHeight - 10;
		drawButton();
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

function drawButton() {
	buttonCtx.clearRect(0, 0, buttonCanvas.width, buttonCanvas.height);
	
	// LAUNCH button
	buttonCtx.fillStyle = '#ff8800';
	buttonCtx.fillRect(goButtonX, goButtonY, buttonWidth, buttonHeight);
	buttonCtx.strokeStyle = '#ffffff';
	buttonCtx.lineWidth = 2;
	buttonCtx.strokeRect(goButtonX, goButtonY, buttonWidth, buttonHeight);
	buttonCtx.fillStyle = '#ffffff';
	buttonCtx.font = 'bold 12px Arial';
	buttonCtx.textAlign = 'center';
	buttonCtx.textBaseline = 'middle';
	buttonCtx.fillText('LAUNCH', goButtonX + buttonWidth / 2, goButtonY + buttonHeight / 2);
}

function onButtonClick(event) {
	const rect = buttonCanvas.getBoundingClientRect();
	const x = event.clientX - rect.left;
	const y = event.clientY - rect.top;
	
	// Check LAUNCH button
	if (x >= goButtonX && x <= goButtonX + buttonWidth &&
	    y >= goButtonY && y <= goButtonY + buttonHeight) {
		launchRandomMortar();
	}
}

// Launch a random mortar manually
function launchRandomMortar() {
	// Pick a random mortar that's ready to launch (all particles gone)
	let availableMortars = Mortars.filter(m => m.isReadyToLaunch());
	if (availableMortars.length > 0) {
		let randomMortar = availableMortars[Math.floor(Math.random() * availableMortars.length)];
		randomMortar.launch();
	}
}

// ------------------------------------------
function render() {
	gRenderer.render(gThreeScene, Camera);
}

// make browser to call us repeatedly -----------------------------------
function update() {
	stats.begin();
	simulate();
	render();
	CameraControl.update();	
	gGrabber.increaseTime(DeltaT);			
	stats.end();
	requestAnimationFrame(update);
}

initThreeScene();
initScene();
update();