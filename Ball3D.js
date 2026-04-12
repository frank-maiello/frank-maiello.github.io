// Blank 3D Space -------------------------------------------

const DeltaT = 1.0 / 60.0;
const Gravity = new THREE.Vector3(0.0, -10.0, 0.0);
const MaxSpeed = 10.0;
const RepulsionStrength = 0.002; // Strength of ball-to-ball repulsion
const worldSizeX = 15;
const worldSizeY = 10;
const worldSizeZ = 15;

const numBalls = 3000;

var gThreeScene;
var gRenderer;
var gRenderTarget;
var Camera;
var CameraControl;
var gGrabber;
var gMouseDown;
var repulsionEnabled = false;
var buttonCanvas;
var buttonCtx;
var buttonX, buttonY, buttonWidth, buttonHeight;

// Attractor Ball Class -------------------------------------------
class ATTRACTOR {
	constructor(pos, strength, color, noDamping = false) {
		this.pos = new THREE.Vector3(pos.x, pos.y, pos.z);
		this.vel = new THREE.Vector3(0.0, 0.0, 0.0);
		this.strength = strength;
		this.radius = 0.5;
		this.color = color;
		this.noDamping = noDamping;
		this.mass = 4.0 * Math.PI / 3.0 * this.radius * this.radius * this.radius;
		this.restitution = 0.98;
		this.grabbed = false;

		// visual mesh
		let geometry = new THREE.SphereGeometry( this.radius, 32, 32 );
		let material = new THREE.MeshPhongMaterial({color: color});
		this.visMesh = new THREE.Mesh( geometry, material );
		this.visMesh.position.copy(pos);
		this.visMesh.userData = this;		// for raycasting
		this.visMesh.layers.enable(1);
		this.visMesh.castShadow = true;
		this.visMesh.receiveShadow = true;
		gThreeScene.add(this.visMesh);
	}
	applyTo(ball) {
		if (!this.grabbed)
			return;

		let dir = new THREE.Vector3();
		dir.subVectors(this.pos, ball.pos);
		let d2 = dir.lengthSq();
		if (d2 < 0.01)
			d2 = 0.01;
		dir.normalize();
		let force = this.strength / d2;
		ball.vel.addScaledVector(dir, force * DeltaT);
	}
	startGrab(pos) {
		this.grabbed = true;
		this.pos.copy(pos);
		this.vel.set(0.0, 0.0, 0.0);
		this.visMesh.position.copy(pos);
	}
	moveGrabbed(pos, vel) {
		this.pos.copy(pos);
		this.vel.copy(vel);
		this.visMesh.position.copy(pos);
	}
	endGrab(pos, vel) {
		this.grabbed = false;
		// Amplify throw velocity to make it more responsive
		this.vel.copy(vel).multiplyScalar(3.0);
	}
	simulate() {
		if (this.grabbed || this.strength !== 0)
			return;
		
		// Cue ball physics (only for strength = 0)
		if (!this.noDamping) {
			this.vel.multiplyScalar(0.9995);
		}
		this.vel.addScaledVector(Gravity, DeltaT);
		this.pos.addScaledVector(this.vel, DeltaT);
		
		let worldEdgeX = 0.5 * worldSizeX - this.radius;
		let worldEdgeZ = 0.5 * worldSizeZ - this.radius;
		let worldEdgeY = 0.5 * worldSizeY - this.radius;
		
		// Use perfect elastic collisions (restitution = 1.0) for continuous bouncing
		let bounceRestitution = this.noDamping ? 1.0 : this.restitution;
		
		if (this.pos.x < -worldEdgeX) {
			this.pos.x = -worldEdgeX;
			this.vel.x = -bounceRestitution * this.vel.x;
		}
		if (this.pos.x > worldEdgeX) {
			this.pos.x = worldEdgeX;
			this.vel.x = -bounceRestitution * this.vel.x;
		}
		if (this.pos.z < -worldEdgeZ) {
			this.pos.z = -worldEdgeZ;
			this.vel.z = -bounceRestitution * this.vel.z;
		}
		if (this.pos.z > worldEdgeZ) {
			this.pos.z = worldEdgeZ;
			this.vel.z = -bounceRestitution * this.vel.z;
		}
		//if (this.pos.y > worldEdgeY) {
		//	this.pos.y = worldEdgeY;
		//	this.vel.y = -bounceRestitution * this.vel.y;
		//}
		if (this.pos.y < this.radius) {
			this.pos.y = this.radius;
			this.vel.y = -bounceRestitution * this.vel.y;
		}
		
		// Limit maximum speed (only for dampened cue balls, not continuous bouncers)
		if (!this.noDamping) {
			let speed = this.vel.length();
			if (speed > MaxSpeed) {
				this.vel.multiplyScalar(MaxSpeed / speed);
			}
		}
		
		this.visMesh.position.copy(this.pos);
	}
	handleCollisionWithBall(ball) {
		let dir = new THREE.Vector3();
		dir.subVectors(ball.pos, this.pos);
		let d = dir.length();

		let minDist = this.radius + ball.radius;
		if (d >= minDist)
			return;

		dir.multiplyScalar(1.0 / d);
		let corr = (minDist - d) / 2.0;
		
		// If strength is 0, this is a cue ball - use momentum-based collision
		if (this.strength === 0) {
			// Position correction - only push ball away, attractor stays fixed
			ball.pos.addScaledVector(dir, minDist - d);
			
			// Only affect ball velocity - treat attractor as immovable
			// Reflect ball velocity relative to attractor velocity
			let relativeVel = new THREE.Vector3();
			relativeVel.subVectors(ball.vel, this.vel);
			let normalVel = relativeVel.dot(dir);
			
			if (normalVel < 0) {
				// Use perfect elastic collisions for continuous bouncing
				let collisionRestitution = this.noDamping ? 1.0 : this.restitution;
				ball.vel.addScaledVector(dir, -normalVel * (1.0 + collisionRestitution));
			}
		} else {
			// Push ball away from attractor (attractor is stationary)
			ball.pos.addScaledVector(dir, corr);
			
			// Reflect ball velocity
			let v = ball.vel.dot(dir);
			if (v < 0) {
				ball.vel.addScaledVector(dir, -v * (1.0 + 0.5 * ball.restitution));
			}
		}
	}		
}
	
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
		this.restitution = 0.90;
		this.grabbed = false;
	
		// visual mesh
		let geometry = new THREE.SphereGeometry( radius, 32, 32 );
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
	applyRepulsion(other) {
		if (!repulsionEnabled)
			return;
		
		let dir = new THREE.Vector3();
		dir.subVectors(this.pos, other.pos);
		let d = dir.length();
		
		// Don't apply repulsion if balls are colliding - collision handling takes over
		let collisionDist = this.radius + other.radius;
		if (d < collisionDist * 1.1) // Small buffer to avoid overlap with collision
			return;
		
		// Only apply repulsion within 5 radii
		let maxDist = 5.0 * collisionDist;
		if (d >= maxDist || d < 0.01)
			return;
		
		// Much higher minimum distance to prevent extreme forces
		let minDist = 2.5 * collisionDist;
		let effectiveD = Math.max(d, minDist);
		
		dir.normalize();
		// Inverse square law: F = k / d^2 with reduced strength
		let force = RepulsionStrength / (effectiveD * effectiveD);
		
		// Apply force to both balls (Newton's third law)
		let acceleration1 = force * DeltaT / this.mass;
		let acceleration2 = force * DeltaT / other.mass;
		
		// Additional damping when close to prevent oscillations
		let dampFactor = Math.min(1.0, (d - collisionDist) / (maxDist - collisionDist));
		dampFactor = dampFactor * dampFactor; // Square for stronger near-field damping
		
		this.vel.addScaledVector(dir, acceleration1 * dampFactor);
		other.vel.addScaledVector(dir, -acceleration2 * dampFactor);
	}
	simulate(){
		if (this.grabbed)
			return;

		// slow velocity a bit to make the simulation more stable
		this.vel.multiplyScalar(0.99); // Increased damping to prevent feedback loops
		this.vel.addScaledVector(Gravity, DeltaT);
		this.pos.addScaledVector(this.vel, DeltaT);

		let worldEdgeX = 0.5 * worldSizeX - this.radius;
		let worldEdgeZ = 0.5 * worldSizeZ - this.radius;
		let worldEdgeY = 0.5 * worldSizeY - this.radius;

		if (this.pos.x < -worldEdgeX) {
			this.pos.x = -worldEdgeX; 
			this.vel.x = -this.restitution * this.vel.x;
		}
		if (this.pos.x >  worldEdgeX) {
			this.pos.x =  worldEdgeX; 
			this.vel.x = -this.restitution * this.vel.x;
		}
		if (this.pos.z < -worldEdgeZ) {
			this.pos.z = -worldEdgeZ; 
			this.vel.z = -this.restitution * this.vel.z;
		}
		if (this.pos.z >  worldEdgeZ) {
			this.pos.z =  worldEdgeZ; 
			this.vel.z = -this.restitution * this.vel.z;
		}
		//if (this.pos.y > worldEdgeY) {
		//	this.pos.y = worldEdgeY; 
		//	this.vel.y = -this.restitution * this.vel.y;
		//}
		if (this.pos.y < this.radius) {
			this.pos.y = this.radius; 
			this.vel.y = -this.restitution * this.vel.y;
		}
		
		// Limit maximum speed
		let speed = this.vel.length();
		if (speed > MaxSpeed) {
			this.vel.multiplyScalar(MaxSpeed / speed);
		}
		
		// Update color based on velocity
		this.updateColor();
		
		this.visMesh.position.copy(this.pos);
		this.visMesh.geometry.computeBoundingSphere();
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
		let radius = Math.random() * 0.05 + 0.05;
		//let radius = 0.07;
		let pos = new THREE.Vector3(
			Math.random() * worldSizeX - worldSizeX / 2 - radius,
			Math.random() * 0.5 * worldSizeY + radius,
			Math.random() * worldSizeZ - worldSizeZ / 2 - radius
		);
		let speed = 0.5
		let vel = new THREE.Vector3(
			(-0.5 + Math.random()) * speed, 
			(-0.5 + Math.random()) * speed, 
			(-0.5 + Math.random()) * speed);
		
		// Initial color will be updated based on velocity (gray for now)
		let color = new THREE.Color(0x808080);
		Balls.push(new BALL(pos, vel, radius, color));
	}		
	
	// Create an attractor in the center of the world
	Attractor = [];
	Attractor.push(new ATTRACTOR(new THREE.Vector3(
		-3, 0.25 * worldSizeY, 0.0), 
		50.0,
		0xff0000));
	Attractor.push(new ATTRACTOR(new THREE.Vector3(
		3.0, 0.25 * worldSizeY, 0.0), 
		-10.0,
		0x0000ff));
	Attractor.push(new ATTRACTOR(new THREE.Vector3(
		0.0, 0.25 * worldSizeY, 0.0), 
		0.0,
		0xf0f0f0f0));
	Attractor.push(new ATTRACTOR(new THREE.Vector3(
		0.0, 0.15 * worldSizeY, 3.0), 
		0.0,
		0xffff00,
		true)); // Yellow bouncing ball with no damping
	// Give it an initial velocity
	Attractor[3].vel.set(1.2, 0, 2);

}
	
// ------------------------------------------
function initThreeScene() {
	gThreeScene = new THREE.Scene();
	gThreeScene.background = new THREE.Color(0x000000);
	
	// ambient light
	gThreeScene.add( new THREE.AmbientLight( 0x505050 ) );	

	// spotligt
	var spotLight = new THREE.SpotLight( 0xffffff );
	spotLight.angle = Math.PI / 5;
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

	dirLight.shadow.camera.right = worldSizeX / 2;
	dirLight.shadow.camera.left = - worldSizeX / 2;
	dirLight.shadow.camera.top	= worldSizeZ / 2;
	dirLight.shadow.camera.bottom = - worldSizeZ / 2;

	dirLight.shadow.mapSize.width = 1024;
	dirLight.shadow.mapSize.height = 1024;
	gThreeScene.add( dirLight );

	// Create checkerboard texture ------------------------------------------------
	var divisionsPerUnit = 4;
	var divisionsX = worldSizeX * divisionsPerUnit;
	var divisionsZ = worldSizeZ * divisionsPerUnit;
	var canvas = document.createElement('canvas');
	canvas.width = divisionsX;
	canvas.height = divisionsZ;
	var ctx = canvas.getContext('2d');

	var color1 = `hsl(${200}, ${15}%, ${72}%)`;
	var color2 = `hsl(${200}, ${15}%, ${62}%)`;
	for (let i = 0; i < divisionsX; i++) {
		for (let j = 0; j < divisionsZ; j++) {
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
		new THREE.PlaneBufferGeometry( worldSizeX, worldSizeZ, 1, 1),
		new THREE.MeshPhongMaterial( { map: texture, shininess: 10 } )
	);				

	ground.rotation.x = - Math.PI / 2; // rotates X/Y to X/Z
	ground.receiveShadow = true;
	//gThreeScene.add( ground );
	
	// Create rectangular grid with square cells
	var gridGeometry = new THREE.BufferGeometry();
	var vertices = [];
	var halfX = worldSizeX / 2;
	var halfZ = worldSizeZ / 2;
	
	// Lines parallel to Z axis
	for (let i = 0; i <= divisionsX; i++) {
		var x = (i / divisionsX) * worldSizeX - halfX;
		vertices.push(x, 0, -halfZ);
		vertices.push(x, 0, halfZ);
	}
	// Lines parallel to X axis
	for (let i = 0; i <= divisionsZ; i++) {
		var z = (i / divisionsZ) * worldSizeZ - halfZ;
		vertices.push(-halfX, 0, z);
		vertices.push(halfX, 0, z);
	}
	
	gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
	var gridMaterial = new THREE.LineBasicMaterial({ color: 0x888888, transparent: true, opacity: 1.0 });
	var gridHelper = new THREE.LineSegments(gridGeometry, gridMaterial);
	gridHelper.position.set(0, 0.002, 0);
	gThreeScene.add(gridHelper);				
	
	// gRenderer
	var container = document.getElementById('container');
	gRenderer = new THREE.WebGLRenderer({ antialias: true });
	gRenderer.shadowMap.enabled = true;
	gRenderer.setPixelRatio( window.devicePixelRatio );
	gRenderer.setSize( window.innerWidth, window.innerHeight );
	window.addEventListener( 'resize', onWindowResize, false );
	container.appendChild( gRenderer.domElement );
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
	buttonX = window.innerWidth - buttonWidth - 10;
	buttonY = window.innerHeight - buttonHeight - 10;
	
	// Add click handler for button
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
				var pos = this.raycaster.ray.origin.clone();
				pos.addScaledVector(this.raycaster.ray.direction, this.distance);
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
			var pos = this.raycaster.ray.origin.clone();
			pos.addScaledVector(this.raycaster.ray.direction, this.distance);

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
		buttonX = window.innerWidth - buttonWidth - 20;
		buttonY = window.innerHeight - buttonHeight - 20;
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
				// Apply repulsion force only once per pair
				Balls[i].applyRepulsion(other);
				Balls[i].handleCollision(other);
			}
		}
		
		for (let k = 0; k < Attractor.length; k++) {
			Attractor[k].applyTo(Balls[i]);
			Attractor[k].handleCollisionWithBall(Balls[i]);
		}
	}
	
	// Simulate attractors (cue balls)
	for (let k = 0; k < Attractor.length; k++) {
		Attractor[k].simulate();
	}
}

function drawButton() {
	buttonCtx.clearRect(0, 0, buttonCanvas.width, buttonCanvas.height);
	
	// Button background
	buttonCtx.fillStyle = repulsionEnabled ? '#4CAF50' : '#f44336';
	buttonCtx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
	
	// Button border
	buttonCtx.strokeStyle = '#ffffff';
	buttonCtx.lineWidth = 2;
	buttonCtx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
	
	// Button text
	buttonCtx.fillStyle = '#ffffff';
	buttonCtx.font = 'bold 8px Arial';
	buttonCtx.textAlign = 'center';
	buttonCtx.textBaseline = 'middle';
	const text = repulsionEnabled ? 'Repulsion: ON' : 'Repulsion: OFF';
	buttonCtx.fillText(text, buttonX + buttonWidth / 2, buttonY + buttonHeight / 2);
}

function onButtonClick(event) {
	const rect = buttonCanvas.getBoundingClientRect();
	const x = event.clientX - rect.left;
	const y = event.clientY - rect.top;
	
	if (x >= buttonX && x <= buttonX + buttonWidth &&
	    y >= buttonY && y <= buttonY + buttonHeight) {
		repulsionEnabled = !repulsionEnabled;
		drawButton();
	}
}

// ------------------------------------------
function render() {
	gRenderer.render(gThreeScene, Camera);
}

// make browser to call us repeatedly -----------------------------------
function update() {
	simulate();
	render();
	CameraControl.update();	
	gGrabber.increaseTime(DeltaT);			
	requestAnimationFrame(update);
}

initThreeScene();
initScene();
update();