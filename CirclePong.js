// Circle Pong : a 3D fussball/pong style game in a circular boundary
// copyright 2026 :: Frank Maiello :: maiello.frank@gmail.com

// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
// Blank 3D Space -------------------------------------------

const DeltaT = 1.0 / 60.0;
const Gravity = -9.8;
const MaxSpeed = 10.0;
const worldRadius = 10; // Circular boundary radius
const worldSizeY = 6;

const numBalls = 1;

var gThreeScene;
var gRenderer;
var gRenderTarget;
var Camera;
var CameraControl;
var gGrabber;
var gMouseDown;
var gravityEnabled = true;
var buttonCanvas;
var buttonCtx;
var buttonWidth, buttonHeight;
var gravityButtonX, gravityButtonY;
var stats;
var paddleMesh;
var paddleAngle = 0; // Current rotation angle of the paddle
var paddleRotationSpeed = 2.0; // Radians per second
var leftArrowPressed = false;
var rightArrowPressed = false;

// Paddle collision parameters
const paddleRadius = worldRadius * 0.8; // 8.0
const paddleTubeRadius = 0.5; // Collision thickness - should be at least the ball radius
const paddleHalfArc = Math.PI / 18; // Half of the arc angle (total arc is PI/9)
const paddleYMin = 0;
const paddleYMax = worldSizeY;


// Ball Class -------------------------------------------
var nextBallId = 0;
class BALL {
	constructor(pos, vel, radius, color){
		this.id = nextBallId++;
		this.pos = new THREE.Vector3(pos.x, pos.y, pos.z);
		this.vel = new THREE.Vector3(vel.x, vel.y, vel.z);
		this.radius = radius;
		this.color = color;
		this.mass = 4.0 * Math.PI / 3.0 * radius * radius * radius;
		this.restitution = 1.0;
		this.grabbed = false;
	
		// visual mesh
		let geometry = new THREE.SphereGeometry( radius, 16, 16 );
		let material = new THREE.MeshPhongMaterial({color: color});
		this.visMesh = new THREE.Mesh( geometry, material );
		this.visMesh.position.copy(pos);
		this.visMesh.userData = this;		// for raycasting
		this.visMesh.castShadow = true;
		this.visMesh.receiveShadow = true;
		gThreeScene.add(this.visMesh);
		
		// Set initial color based on velocity
		this.updateColor();
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
		if (this.grabbed)
			return;

		// slow velocity a bit to make the simulation more stable
		//this.vel.multiplyScalar(0.99); // Increased damping to prevent feedback loops
		if (gravityEnabled) {
			this.vel.y += Gravity * DeltaT;
		}
		this.pos.addScaledVector(this.vel, DeltaT);

		

		// Circular boundary check in x-z plane
		let distFromCenter = Math.sqrt(this.pos.x * this.pos.x + this.pos.z * this.pos.z);
		let maxDist = worldRadius - this.radius;
		
		if (distFromCenter > maxDist) {
			// Calculate normal direction (pointing inward)
			let nx = this.pos.x / distFromCenter;
			let nz = this.pos.z / distFromCenter;
			
			// Push object back inside circle
			this.pos.x = nx * maxDist;
			this.pos.z = nz * maxDist;
			
			// Reflect velocity along normal
			let velDotNormal = this.vel.x * nx + this.vel.z * nz;
			if (velDotNormal > 0) {
				this.vel.x -= 2 * velDotNormal * nx * this.restitution;
				this.vel.z -= 2 * velDotNormal * nz * this.restitution;
			}
		}
		
		let worldEdgeY =  worldSizeY - this.radius;

		if (this.pos.y > worldEdgeY) {
			this.pos.y = worldEdgeY; 
			this.vel.y = -this.restitution * this.vel.y;
		}
		if (this.pos.y < this.radius) {
			this.pos.y = this.radius; 
			this.vel.y = -this.restitution * this.vel.y;
		}
		
		// Check collision with paddle
		this.checkPaddleCollision();
		
		// Limit maximum speed
		let speed = this.vel.length();
		if (speed > MaxSpeed) {
			this.vel.multiplyScalar(MaxSpeed / speed);
		}
		
		// Update color based on velocity
		//this.updateColor();
		
		this.visMesh.position.copy(this.pos);
	}
	checkPaddleCollision() {
		// Check if ball collides with the paddle (vertical cylindrical arc)
		
		// 1. Check vertical range
		if (this.pos.y < paddleYMin - this.radius || this.pos.y > paddleYMax + this.radius) {
			return; // Ball is outside vertical range
		}
		
		// 2. Convert ball position to polar coordinates in x-z plane
		let ballAngle = Math.atan2(this.pos.z, this.pos.x);
		let ballRadius = Math.sqrt(this.pos.x * this.pos.x + this.pos.z * this.pos.z);
		
		// 3. Calculate angular difference between ball and paddle center
		let angleDiff = ballAngle - paddleAngle;
		
		// Normalize angle difference to [-PI, PI]
		while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
		while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
		
		// 4. Check if ball is within paddle's angular range (with ball radius tolerance)
		// Account for ball size: approximate angular width of ball at given radius
		let ballAngularWidth = Math.asin(Math.min(1.0, this.radius / paddleRadius));
		let effectiveHalfArc = paddleHalfArc + ballAngularWidth;
		
		if (Math.abs(angleDiff) > effectiveHalfArc) {
			return; // Ball is outside angular range
		}
		
		// 5. Check radial distance from paddle path (only check inner surface)
		// Ball must be inside the paddle radius to collide
		if (ballRadius < paddleRadius) {
			let radialDist = paddleRadius - ballRadius;
			let collisionDist = this.radius + paddleTubeRadius;
			
			if (radialDist < collisionDist) {
				// Collision detected on inner (concave) surface!
				
				// Calculate collision normal (pointing outward from center)
				let nx = Math.cos(ballAngle);
				let nz = Math.sin(ballAngle);
				
				// Push ball out toward center (away from paddle) more aggressively
				let penetration = collisionDist - radialDist;
				this.pos.x -= nx * penetration * 1.1; // Extra push to prevent tunneling
				this.pos.z -= nz * penetration * 1.1;
				
				// Update ball radius after position correction
				ballRadius = Math.sqrt(this.pos.x * this.pos.x + this.pos.z * this.pos.z);
				
				// Reflect velocity along normal (only if moving toward the paddle)
				let velDotNormal = this.vel.x * nx + this.vel.z * nz;
				if (velDotNormal > 0) {
					// Ball is moving outward (toward paddle), reflect it
					this.vel.x -= 2 * velDotNormal * nx * this.restitution;
					this.vel.z -= 2 * velDotNormal * nz * this.restitution;
				}
			}
		}
	}
	
	updateColor() {
		// Calculate total speed
		let speed = this.vel.length();
		
		// Map speed to hue: blue (240°) for slow, red (0°) for fast (like heat map)
		let speedRatio = Math.min(speed / MaxSpeed, 1.0);
		let hue = 240 * (1.0 - speedRatio); // 240° (blue) to 0° (red)
		
		// Saturation: use power function for more sensitivity at lower speeds
		let saturation = Math.min(100, Math.pow(speedRatio, 0.4) * 100);
		
		// Lightness: higher for slow balls (lighter gray), lower for fast balls
		let lightness = 0.7 - speedRatio * 0.2; // 0.7 for stationary, 0.5 for max speed
		
		// Update material color
		this.visMesh.material.color.setHSL(hue / 360, saturation / 100, lightness);
	}
	//applyForce(force){
	//	this.vel.y += DeltaT * force / this.mass;
	//	this.vel.multiplyScalar(0.999);
	//}
	startGrab(pos) {
		this.grabbed = true;
		this.pos.copy(pos);
		this.visMesh.position.copy(pos);
	}
	moveGrabbed(pos, vel) {
		this.pos.copy(pos);
		this.visMesh.position.copy(pos);
	}
	endGrab(pos, vel) {
		this.grabbed = false;
		this.vel.copy(vel);
	}		
}

// Spatial Hash Grid for efficient collision detection -------------------------------------------
class SpatialHashGrid {
	constructor(cellSize) {
		this.cellSize = cellSize;
		this.grid = new Map();
	}
	
	clear() {
		this.grid.clear();
	}
	
	getKey(x, y, z) {
		const xi = Math.floor(x / this.cellSize);
		const yi = Math.floor(y / this.cellSize);
		const zi = Math.floor(z / this.cellSize);
		return `${xi},${yi},${zi}`;
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
					const key = `${cx + dx},${cy + dy},${cz + dz}`;
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
	// Create balls with random positions, velocities, radii, and colors
	nextBallId = 0; // Reset ball ID counter
	Balls = [];	
	for (var i = 0; i < numBalls; i++) {
		//let radius = Math.random() * 0.1 + 0.1;
		let radius = 0.5;
		
		// Spawn balls randomly within circular boundary
		let angle = Math.random() * Math.PI * 2;
		let r = Math.sqrt(Math.random()) * (0.3 * worldRadius - radius - 0.5); // sqrt for uniform distribution
		let pos = new THREE.Vector3(
			0,
			worldSizeY * 0.4,
			0);
		let speed = 10.0
		let vel = new THREE.Vector3(
			(-0.5 + Math.random()) * speed, 
			0, 
			(-0.5 + Math.random()) * speed);
		
		// Initial color will be updated based on velocity (gray for now)
		let color = new THREE.Color(0x808080);
		Balls.push(new BALL(pos, vel, radius, color));
	}
}
	
// ------------------------------------------
function initThreeScene() {
	gThreeScene = new THREE.Scene();
	gThreeScene.background = new THREE.Color(0x000000);
	
	// ambient light
	gThreeScene.add( new THREE.AmbientLight( 0x505050 ) );	

	// spotligt 1 -------------------------------------------------
	var spotLight1 = new THREE.SpotLight( 0x80FFFF ); // Light cyan
	spotLight1.angle = Math.PI / 8;
	spotLight1.penumbra = 0.0;
	spotLight1.position.set(10, 8, 5);
	spotLight1.castShadow = true;
	spotLight1.shadow.camera.near = 1;
	spotLight1.shadow.camera.far = 50;
	spotLight1.shadow.mapSize.width = 1024;
	spotLight1.shadow.mapSize.height = 1024;
	gThreeScene.add( spotLight1 );

	// Spotlight 2 -------------------------------------------------
	var spotLight2 = new THREE.SpotLight( 0xFF80FF ); // Light magenta
	spotLight2.angle = Math.PI / 8;
	spotLight2.penumbra = 0.0;
	spotLight2.position.set(-10, 8, 5);
	spotLight2.castShadow = true;
	spotLight2.shadow.camera.near = 1;
	spotLight2.shadow.camera.far = 50;
	spotLight2.shadow.mapSize.width = 1024;
	spotLight2.shadow.mapSize.height = 1024;
	gThreeScene.add( spotLight2 );

	// Spotlight 3 -------------------------------------------------
	var spotLight3 = new THREE.SpotLight( 0xFFFF80 ); // Light yellow
	spotLight3.angle = Math.PI / 8;
	spotLight3.penumbra = 0.0;
	spotLight3.position.set(0, 8, -10);
	spotLight3.castShadow = true;
	spotLight3.shadow.camera.near = 1;
	spotLight3.shadow.camera.far = 50;
	spotLight3.shadow.mapSize.width = 1024;
	spotLight3.shadow.mapSize.height = 1024;
	gThreeScene.add( spotLight3 );

	// Visual cone for Spotlight 1
	var coneHeight = 1;
	var coneRadius = Math.tan(spotLight1.angle) * coneHeight;
	var coneGeometry = new THREE.ConeGeometry( coneRadius, coneHeight, 32, 1, true );
	var coneMaterial = new THREE.MeshBasicMaterial({ 
		color: 0x80FFFF, // Light cyan
		transparent: false,
		side: THREE.DoubleSide
	});
	var coneMesh1 = new THREE.Mesh( coneGeometry, coneMaterial );
	coneMesh1.position.copy(spotLight1.position);

	// Point cone toward origin (wide end points in light direction)
	var targetPos1 = new THREE.Vector3(0, 0, 0);
	var direction1 = new THREE.Vector3().subVectors(targetPos1, spotLight1.position).normalize();
	// Flip direction so pointed end points back toward light source
	var up = new THREE.Vector3(0, -1, 0); // Negative Y makes wide end point forward
	var axis = new THREE.Vector3().crossVectors(up, direction1).normalize();
	var angle = Math.acos(up.dot(direction1));
	coneMesh1.quaternion.setFromAxisAngle(axis, angle);
	// Offset cone so narrow end is at light position
	coneMesh1.translateY(coneHeight / 2);
	gThreeScene.add( coneMesh1 );

	// Visual cone for spotlight2
	var coneHeight = 1;
	var coneRadius = Math.tan(spotLight2.angle) * coneHeight;
	var coneGeometry = new THREE.ConeGeometry( coneRadius, coneHeight, 32, 1, true );
	var coneMaterial = new THREE.MeshBasicMaterial({ 
		color: 0xFF80FF, // Light magenta
		transparent: false,
		side: THREE.DoubleSide
	});
	var coneMesh2 = new THREE.Mesh( coneGeometry, coneMaterial );
	coneMesh2.position.copy(spotLight2.position);

	// Point cone toward origin (wide end points in light direction)
	var targetPos2 = new THREE.Vector3(0, 0, 0);
	var direction2 = new THREE.Vector3().subVectors(targetPos2, spotLight2.position).normalize();
	// Flip direction so pointed end points back toward light source
	var up = new THREE.Vector3(0, -1, 0); // Negative Y makes wide end point forward
	var axis = new THREE.Vector3().crossVectors(up, direction2).normalize();
	var angle = Math.acos(up.dot(direction2));
	coneMesh2.quaternion.setFromAxisAngle(axis, angle);
	// Offset cone so narrow end is at light position
	coneMesh2.translateY(coneHeight / 2);
	gThreeScene.add( coneMesh2 );

	// Visual cone for spotlight3
	var coneHeight = 1;
	var coneRadius = Math.tan(spotLight3.angle) * coneHeight;
	var coneGeometry = new THREE.ConeGeometry( coneRadius, coneHeight, 32, 1, true );
	var coneMaterial = new THREE.MeshBasicMaterial({ 
		color: 0xFFFF80, // Light yellow
		transparent: false,
		side: THREE.DoubleSide
	});
	var coneMesh3 = new THREE.Mesh( coneGeometry, coneMaterial );
	coneMesh3.position.copy(spotLight3.position);

	// Point cone toward origin (wide end points in light direction)
	var targetPos3 = new THREE.Vector3(0, 0, 0);
	var direction3 = new THREE.Vector3().subVectors(targetPos3, spotLight3.position).normalize();
	// Flip direction so pointed end points back toward light source
	var up = new THREE.Vector3(0, -1, 0); // Negative Y makes wide end point forward
	var axis = new THREE.Vector3().crossVectors(up, direction3).normalize();
	var angle = Math.acos(up.dot(direction3));
	coneMesh3.quaternion.setFromAxisAngle(axis, angle);
	// Offset cone so narrow end is at light position
	coneMesh3.translateY(coneHeight / 2);
	gThreeScene.add( coneMesh3 );

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

	/*// Create checkerboard texture ------------------------------------------------
	var divisionsPerUnit = 4;
	var diameter = worldRadius * 2;
	var divisions = Math.floor(diameter * divisionsPerUnit);
	var canvas = document.createElement('canvas');
	canvas.width = divisions;
	canvas.height = divisions;
	var ctx = canvas.getContext('2d');

	var color1 = `hsl(${200}, ${15}%, ${72}%)`;
	var color2 = `hsl(${200}, ${15}%, ${62}%)`;
	for (let i = 0; i < divisions; i++) {
		for (let j = 0; j < divisions; j++) {
			ctx.fillStyle = (i + j) % 2 === 0 ? color1 : color2;
			ctx.fillRect(i, j, 1, 1);
		}
	}
	
	var texture = new THREE.CanvasTexture(canvas);
	texture.wrapS = THREE.ClampToEdgeWrapping;
	texture.wrapT = THREE.ClampToEdgeWrapping;
	texture.magFilter = THREE.NearestFilter;
	texture.minFilter = THREE.NearestFilter;
	
	var ground = new THREE.Mesh(
		new THREE.PlaneBufferGeometry( diameter, diameter, 1, 1),
		new THREE.MeshPhongMaterial( { map: texture, shininess: 10 } )
	);				

	ground.rotation.x = - Math.PI / 2; // rotates X/Y to X/Z
	ground.receiveShadow = true;
	gThreeScene.add( ground );*/
	
	// Create circular grid
	var gridGeometry = new THREE.BufferGeometry();
	var vertices = [];
	
	/*// Draw concentric circles
	var numCircles = Math.floor(worldRadius / 0.25);
	var segmentsPerCircle = 64;
	for (let c = 1; c <= numCircles; c++) {
		let r = (c / numCircles) * worldRadius;
		for (let i = 0; i < segmentsPerCircle; i++) {
			let angle1 = (i / segmentsPerCircle) * Math.PI * 2;
			let angle2 = ((i + 1) / segmentsPerCircle) * Math.PI * 2;
			vertices.push(r * Math.cos(angle1), 0, r * Math.sin(angle1));
			vertices.push(r * Math.cos(angle2), 0, r * Math.sin(angle2));
		}
	}*/
	
	// Draw radial lines
	var numRadialLines = 64;
	var innerRadius = worldRadius * 0.2; // Start lines 20% from center
	for (let i = 0; i < numRadialLines; i++) {
		let angle = (i / numRadialLines) * Math.PI * 2;
		vertices.push(innerRadius * Math.cos(angle), 0, innerRadius * Math.sin(angle));
		vertices.push(worldRadius * Math.cos(angle), 0, worldRadius * Math.sin(angle));
	}
	
	gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
	var gridMaterial = new THREE.LineBasicMaterial({ color: 0x888888, transparent: true, opacity: 1.0 });
	var gridHelper = new THREE.LineSegments(gridGeometry, gridMaterial);
	gridHelper.position.set(0, 0.002, 0);
	gThreeScene.add(gridHelper);

	// Add circle at inner radius where radial lines stop
	var circleSegments = 64;
	var circleVertices = [];
	for (let i = 0; i <= circleSegments; i++) {
		let angle = (i / circleSegments) * Math.PI * 2;
		circleVertices.push(innerRadius * Math.cos(angle), 0, innerRadius * Math.sin(angle));
	}
	var circleGeometry = new THREE.BufferGeometry();
	circleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(circleVertices, 3));
	var circleMaterial = new THREE.LineBasicMaterial({ color: 0x888888, transparent: true, opacity: 1.0 });
	var circleHelper = new THREE.LineLoop(circleGeometry, circleMaterial);
	circleHelper.position.set(0, 0.002, 0);
	gThreeScene.add(circleHelper);

	// create round floor plane
	var floorGeometry = new THREE.CircleGeometry(worldRadius, 64);
	var floorMaterial = new THREE.MeshPhongMaterial({ color:0x808080, side:THREE.FrontSide});
	var floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
	floorMesh.rotation.x = -Math.PI / 2;
	floorMesh.position.set(0, 0, 0);
	floorMesh.receiveShadow = true;
	gThreeScene.add(floorMesh);

	// round ceiling plane  -------------------------------------------------
	var ceilingGeometry = new THREE.CircleGeometry(worldRadius, 64);
	var ceilingMaterial = new THREE.MeshPhongMaterial({ color:0xa2d2e3, side:THREE.DoubleSide, transparent:true, opacity:0.2});
	var ceilingMesh = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
	ceilingMesh.rotation.x = -Math.PI / 2;
	ceilingMesh.position.set(0, worldSizeY, 0);
	ceilingMesh.receiveShadow = true;
	gThreeScene.add(ceilingMesh);

	// thin black ring on floor and ceiling for paddle travel   -------------------------------------------------
	var paddleRingGeometry = new THREE.RingGeometry(worldRadius * 0.79, worldRadius * 0.81, 64);
	var paddleRingMaterial = new THREE.MeshBasicMaterial({ color:0x000000, side:THREE.DoubleSide });
	var paddleRingFloorMesh = new THREE.Mesh(paddleRingGeometry, paddleRingMaterial);
	paddleRingFloorMesh.rotation.x = -Math.PI / 2;
	paddleRingFloorMesh.position.set(0, 0.02, 0);
	gThreeScene.add(paddleRingFloorMesh);

	var paddleRingCeilingMesh = new THREE.Mesh(paddleRingGeometry, paddleRingMaterial);
	paddleRingCeilingMesh.rotation.x = -Math.PI / 2;
	paddleRingCeilingMesh.position.set(0, worldSizeY - 0.02, 0);
	gThreeScene.add(paddleRingCeilingMesh);

	// paddle  -------------------------------------------------
		// radius
		// tube
		// radialSegments
		// tubularSegments
		// arc
		// thetaStart
		// thetaLength
	var paddleGeometry = new THREE.TorusGeometry(
		worldRadius * 0.8, 
		0.02, 
		12, 
		48, 
		Math.PI / 9,
		0,
		2 * Math.PI);
	var paddleMaterial = new THREE.MeshPhongMaterial(
		{ color:0xe96620, 
		side:THREE.DoubleSide,
		transparent:true,
		opacity:0.6 });
	paddleMesh = new THREE.Mesh(paddleGeometry, paddleMaterial);
	paddleMesh.rotation.x = Math.PI / 2;
	paddleMesh.position.set(0, worldSizeY / 2, 0);
	paddleMesh.scale.set(1, 1, 25 * worldSizeY); // Stretch vertically to create arc paddle
	paddleMesh.castShadow = true;
	paddleMesh.receiveShadow = true;
	gThreeScene.add(paddleMesh);
	
	// cylinder boundary wall  -------------------------------------------------
	var wallHeight = worldSizeY;
	var wallGeometry = new THREE.CylinderGeometry(worldRadius, worldRadius, wallHeight, 64, 1, true);
	var wallMaterial = new THREE.MeshPhongMaterial({ color:0xa2d2e3, side:THREE.BackSide, transparent:true});
	var wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
	wallMesh.position.set(0, wallHeight / 2, 0);
	wallMesh.castShadow = false;
	wallMesh.receiveShadow = true;
	wallMesh.material.opacity = 0.3;
	gThreeScene.add(wallMesh);
	
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
	Camera.position.set(0.0, 4, -10);
	Camera.updateMatrixWorld();	
	gThreeScene.add(Camera);

	// Camera control
	CameraControl = new THREE.OrbitControls(Camera, gRenderer.domElement);
	CameraControl.zoomSpeed = 2.0;
	CameraControl.panSpeed = 0.4;
	CameraControl.target.set(0, 1.0, 0);
	CameraControl.enabled = true; // Enable OrbitControls

	// Grabber
	gGrabber = new Grabber();
	container.addEventListener( 'pointerdown', onPointer, false );
	container.addEventListener( 'pointermove', onPointer, false );
	container.addEventListener( 'pointerup', onPointer, false );
	
	// Keyboard events
	window.addEventListener( 'keydown', onKeyDown, false );
	window.addEventListener( 'keyup', onKeyUp, false );
	
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
	
	// Gravity button position 
	gravityButtonX = window.innerWidth - buttonWidth - 10;
	gravityButtonY = window.innerHeight - buttonHeight - 10;
	
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
			var obj = intersects[0].object.userData;
			// Only allow grabbing attractors, not balls
			if (obj && obj instanceof ATTRACTOR) {
				this.physicsObject = obj;
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
	// Track arrow key states for smooth rotation
	else if (evt.key === 'ArrowLeft') {
		leftArrowPressed = true;
	}
	else if (evt.key === 'ArrowRight') {
		rightArrowPressed = true;
	}
}

function onKeyUp( evt ) {
	if (evt.key === 'ArrowLeft') {
		leftArrowPressed = false;
	}
	else if (evt.key === 'ArrowRight') {
		rightArrowPressed = false;
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
		gravityButtonX = window.innerWidth - buttonWidth - 10;
		gravityButtonY = window.innerHeight - buttonHeight - 10;
		drawButton();
	}
}

// ------------------------------------------------------------------
function simulate() {	
	// Clear and rebuild spatial hash grid
	spatialGrid.clear();
	for (let i = 0; i < Balls.length; i++) {
		spatialGrid.insert(Balls[i]);
	}
	
	// Simulate ball physics and handle collisions
	const checkedPairs = new Set();
	for (let i = 0; i < Balls.length; i++) {
		Balls[i].simulate();
		
		// Get nearby balls from spatial grid
		const nearby = spatialGrid.getNearby(Balls[i]);
		for (let j = 0; j < nearby.length; j++) {
			const other = nearby[j];
			if (other === Balls[i]) continue;
			
			// Create unique pair key using ball IDs to avoid duplicate checks
			const id1 = Balls[i].id;
			const id2 = other.id;
			const pairKey = id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;
			if (!checkedPairs.has(pairKey)) {
				checkedPairs.add(pairKey);
				Balls[i].handleCollision(other);
			}
		}
	}
}

function drawButton() {
	buttonCtx.clearRect(0, 0, buttonCanvas.width, buttonCanvas.height);
	
	// Gravity button
	buttonCtx.fillStyle = gravityEnabled ? '#4CAF50' : '#f44336';
	buttonCtx.fillRect(gravityButtonX, gravityButtonY, buttonWidth, buttonHeight);
	buttonCtx.strokeStyle = '#ffffff';
	buttonCtx.lineWidth = 2;
	buttonCtx.strokeRect(gravityButtonX, gravityButtonY, buttonWidth, buttonHeight);
	buttonCtx.fillStyle = '#ffffff';
	buttonCtx.font = 'bold 8px Arial';
	buttonCtx.textAlign = 'center';
	buttonCtx.textBaseline = 'middle';
	const gravityText = gravityEnabled ? 'Gravity: ON' : 'Gravity: OFF';
	buttonCtx.fillText(gravityText, gravityButtonX + buttonWidth / 2, gravityButtonY + buttonHeight / 2);
}

function onButtonClick(event) {
	const rect = buttonCanvas.getBoundingClientRect();
	const x = event.clientX - rect.left;
	const y = event.clientY - rect.top;
	
	// Check gravity button
	if (x >= gravityButtonX && x <= gravityButtonX + buttonWidth &&
	    y >= gravityButtonY && y <= gravityButtonY + buttonHeight) {
		gravityEnabled = !gravityEnabled;
		drawButton();
	}
}

// ------------------------------------------
function render() {
	gRenderer.render(gThreeScene, Camera);
}

// make browser to call us repeatedly -----------------------------------
function update() {
	stats.begin();
	
	// Update paddle rotation based on key states
	if (leftArrowPressed) {
		paddleAngle += paddleRotationSpeed * DeltaT;
		paddleMesh.rotation.z = paddleAngle;
	}
	if (rightArrowPressed) {
		paddleAngle -= paddleRotationSpeed * DeltaT;
		paddleMesh.rotation.z = paddleAngle;
	}
	
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