// ------------------------------------------------------------------

var gPhysicsScene = 
{
	gravity : new THREE.Vector3(0.0, -10.0, 0.0),
	dt : 1.0 / 60.0,
	tankSize : { x: 10.0, y : 1.0, z : 10.0 },
	tankBorder : 0.03,
	waterHeight : 0.8,
	waterSpacing : 0.02,
	waterSurface: null,
	objects: []
};

var gThreeScene;
var gRenderer;
var gRenderTarget;
var gCamera;
var gCameraControl;
var gWaterMaterial; 
var gGrabber;
var gMouseDown;
var gPrevTime = 0.0;
var gBoat; // Reference to the boat for camera following
var gThrustGaugeFill;
var gThrustGaugeValue;

// Speedboat position 
var gSpeedBoatInitialX = 0.0;
var gSpeedBoatInitialZ = 0.0;
var gSpeedBoatStartY = 0.8; // Start at water level

// Boat control states
var gBoatControls = {
	throttle: 0.0,
	steering: 0.0,
	keysPressed: {}
};

// ------------------------------------------------------------------
class WaterSurface {
	constructor(sizeX, sizeZ, depth, spacing, visMaterial) {
		// physics data
		this.waveSpeed = 20.0;
		this.posDamping = 0.1;
		this.velDamping = 0.1;
		this.alpha = 0.5;
		this.time = 0.0;

		this.numX = Math.floor(sizeX / spacing) + 1
		this.numZ = Math.floor(sizeZ / spacing) + 1
		this.spacing = spacing;
		this.numCells = this.numX * this.numZ;
		this.heights = new Float32Array(this.numCells);
		this.bodyHeights = new Float32Array(this.numCells);
		this.prevHeights = new Float32Array(this.numCells);
		this.velocities = new Float32Array(this.numCells);		
		this.heights.fill(depth)
		this.velocities.fill(0.0)

		// visual mesh
		let positions = new Float32Array(this.numCells * 3);
		let uvs = new Float32Array(this.numCells * 2);
		let cx = Math.floor(this.numX / 2.0);
		let cz = Math.floor(this.numZ / 2.0);

		for (let i = 0; i < this.numX; i++) {
			for (let j = 0; j < this.numZ; j++) {
				positions[3 * (i * this.numZ + j)] = (i - cx) * spacing; 
				positions[3 * (i * this.numZ + j) + 2] = (j - cz) * spacing; 

				uvs[2 * (i * this.numZ + j)] = i / this.numX;
				uvs[2 * (i * this.numZ + j) + 1] = j / this.numZ;
			}
		}

		var index = new Uint32Array((this.numX - 1) * (this.numZ - 1) * 2 * 3);
		let pos = 0;
		for (let i = 0; i < this.numX - 1; i++) {
			for (let j = 0; j < this.numZ - 1; j++) {
				let id0 = i * this.numZ + j;
				let id1 = i * this.numZ + j + 1;
				let id2 = (i + 1) * this.numZ + j + 1;
				let id3 = (i + 1) * this.numZ + j;

				index[pos++] = id0;
				index[pos++] = id1;
				index[pos++] = id2;

				index[pos++] = id0;
				index[pos++] = id2;
				index[pos++] = id3;
			}
		}
		var geometry = new THREE.BufferGeometry();

//		var positions = new Float32Array([0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0]);
		geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
		
//		geometry.setIndex(index);
		geometry.setIndex(new THREE.BufferAttribute(index,1));

		this.visMesh = new THREE.Mesh(geometry, visMaterial);

		this.updateVisMesh();
		this.visMesh.renderOrder = -1; // Render water before other objects
		gThreeScene.add(this.visMesh);
	}

	simulateCoupling() {
		let cx = Math.floor(this.numX / 2.0);
		let cz = Math.floor(this.numZ / 2.0);
		let h1 = 1.0 / this.spacing;

		this.prevHeights.set(this.bodyHeights);
		this.bodyHeights.fill(0.0);

		for (let i = 0; i < gPhysicsScene.objects.length; i++) {
			let ball = gPhysicsScene.objects[i];
			let pos = ball.pos;
			let br = ball.radius;
			let h2 = this.spacing * this.spacing;

			let x0 = Math.max(0, cx + Math.floor((pos.x - br) * h1));
			let x1 = Math.min(this.numX - 1, cx + Math.floor((pos.x + br) * h1));
			let z0 = Math.max(0, cz + Math.floor((pos.z - br) * h1));
			let z1 = Math.min(this.numZ - 1, cz + Math.floor((pos.z + br) * h1));

			for (let xi = x0; xi <= x1; xi++) {
				for (let zi = z0; zi <= z1; zi++) {
					let x = (xi - cx) * this.spacing; 
					let z = (zi - cz) * this.spacing;
					let r2 = (pos.x - x) * (pos.x - x) + (pos.z - z) * (pos.z - z);
					if (r2 < br * br) {
						let bodyHalfHeight = Math.sqrt(br * br - r2);
						let waterHeight = this.heights[xi * this.numZ + zi];

						let bodyMin = Math.max(pos.y - bodyHalfHeight, 0.0);
						let bodyMax = Math.min(pos.y + bodyHalfHeight, waterHeight);
						var bodyHeight = Math.max(bodyMax - bodyMin, 0.0);
						if (bodyHeight > 0.0) {
							ball.applyForce(-bodyHeight * h2 * gPhysicsScene.gravity.y);
							this.bodyHeights[xi * this.numZ + zi] += bodyHeight;
						}
					}
				}
			}
		}

		for (let iter = 0; iter < 2; iter++) {
			for (let xi = 0; xi < this.numX; xi++) {
				for (let zi = 0; zi < this.numZ; zi++) {
					let id = xi * this.numZ + zi;

					let num = xi > 0 && xi < this.numX - 1 ? 2 : 1;
					num += zi > 0 && zi < this.numZ - 1 ? 2 : 1; 
					let avg = 0.0;
					if (xi > 0) avg += this.bodyHeights[id - this.numZ];
					if (xi < this.numX - 1) avg += this.bodyHeights[id + this.numZ];
					if (zi > 0) avg += this.bodyHeights[id - 1];
					if (zi < this.numZ - 1) avg += this.bodyHeights[id + 1];
					avg /= num;
					this.bodyHeights[id] = avg;
				}
			}
		}

		for (let i = 0; i < this.numCells; i++) {
			let bodyChange = this.bodyHeights[i] - this.prevHeights[i];
			this.heights[i] += this.alpha * bodyChange;
		}
	}

	simulateSurface(){
		this.waveSpeed = Math.min(this.waveSpeed, 0.5 * this.spacing / gPhysicsScene.dt);
		let c = this.waveSpeed * this.waveSpeed / this.spacing / this.spacing
		let pd = Math.min(this.posDamping * gPhysicsScene.dt, 1.0);
		let vd = Math.max(0.0, 1.0 - this.velDamping * gPhysicsScene.dt);

		for (let i = 0; i < this.numX; i++) {
			for (let j = 0; j < this.numZ; j++) {
				let id = i * this.numZ + j
				let h = this.heights[id];
				let sumH = 0.0;
				sumH += i > 0 ? this.heights[id - this.numZ] : h;
				sumH += i < this.numX - 1 ? this.heights[id + this.numZ] : h;
				sumH += j > 0 ? this.heights[id - 1] : h;
				sumH += j < this.numZ - 1 ? this.heights[id + 1] : h;
				this.velocities[id] += gPhysicsScene.dt * c * (sumH - 4.0 * h)
				this.heights[id] += (0.25 * sumH - h) * pd;  // positional damping
			}
		}

		for (var i = 0; i < this.numCells; i++) {
			this.velocities[i] *= vd;		// velocity damping
			this.heights[i] += this.velocities[i] * gPhysicsScene.dt;
		}
	}

	simulate() {
		this.time += gPhysicsScene.dt;
		this.simulateCoupling()
		this.simulateSurface()
		this.updateVisMesh();
	}

	updateVisMesh() {
		const positions = this.visMesh.geometry.attributes.position.array;
		for (let i = 0; i < this.numCells; i++)
			positions[3 * i + 1] = this.heights[i];
		this.visMesh.geometry.attributes.position.needsUpdate = true;
		this.visMesh.geometry.computeVertexNormals();
		this.visMesh.geometry.computeBoundingSphere();
	}
	
	getHeight(worldX, worldZ) {
		// Convert world coordinates to grid coordinates
		const cx = Math.floor(this.numX / 2.0);
		const cz = Math.floor(this.numZ / 2.0);
		const invSpacing = 1.0 / this.spacing;
		
		const xi = cx + worldX * invSpacing;
		const zi = cz + worldZ * invSpacing;
		
		// Clamp to grid bounds
		if (xi < 0 || xi >= this.numX - 1 || zi < 0 || zi >= this.numZ - 1) {
			return this.heights[0];
		}
		
		// Bilinear interpolation
		const x0 = Math.floor(xi);
		const x1 = x0 + 1;
		const z0 = Math.floor(zi);
		const z1 = z0 + 1;
		
		const fx = xi - x0;
		const fz = zi - z0;
		
		const h00 = this.heights[x0 * this.numZ + z0];
		const h10 = this.heights[x1 * this.numZ + z0];
		const h01 = this.heights[x0 * this.numZ + z1];
		const h11 = this.heights[x1 * this.numZ + z1];
		
		const h0 = h00 * (1 - fx) + h10 * fx;
		const hInterp = h01 * (1 - fx) + h11 * fx;
		
		return h0 * (1 - fz) + hInterp * fz;
	}
	
	addDisplacement(worldX, worldZ, displacement) {
		// Add displacement to water surface at given world position
		const cx = Math.floor(this.numX / 2.0);
		const cz = Math.floor(this.numZ / 2.0);
		const invSpacing = 1.0 / this.spacing;
		
		const xi = Math.round(cx + worldX * invSpacing);
		const zi = Math.round(cz + worldZ * invSpacing);
		
		if (xi >= 0 && xi < this.numX && zi >= 0 && zi < this.numZ) {
			const id = xi * this.numZ + zi;
			this.bodyHeights[id] += displacement;
		}
	}

	setVisible(visible) {
		this.visMesh.visible = visible;
	}
}

// ------------------------------------------------------------------
class Ball {
	constructor(pos, radius, density, color = 0xff0000){
		this.pos = new THREE.Vector3(pos.x, pos.y, pos.z);
		this.radius = radius;
		this.mass = 4.0 * Math.PI / 3.0 * radius * radius * radius * density;
		this.vel = new THREE.Vector3(0.0, 0.0, 0.0);
		this.grabbed = false;
		this.restitution = 0.1;

		// visual mesh
		let geometry = new THREE.SphereGeometry( radius, 32, 32 );
		let material = new THREE.MeshPhongMaterial({color: color});
		this.visMesh = new THREE.Mesh( geometry, material );
		this.visMesh.position.copy(pos);
		this.visMesh.userData = this;		// for raycasting
		this.visMesh.layers.enable(1);
		this.visMesh.castShadow = true;
		this.visMesh.receiveShadow = true;
		gThreeScene.add(this.visMesh);
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

		let newV1 = (m1 * v1 + m2 * v2 - m2 * (v1 - v2) * this.restitution) / (m1 + m2);
		let newV2 = (m1 * v1 + m2 * v2 - m1 * (v2 - v1) * this.restitution) / (m1 + m2);

		this.vel.addScaledVector(dir, newV1 - v1);
		other.vel.addScaledVector(dir, newV2 - v2);					

	}
	simulate(){
		if (this.grabbed)
			return;

		this.vel.addScaledVector(gPhysicsScene.gravity, gPhysicsScene.dt);
		this.pos.addScaledVector(this.vel, gPhysicsScene.dt);

		let wx = 0.5 * gPhysicsScene.tankSize.x - this.radius - 0.5 * gPhysicsScene.tankBorder;
		let wz = 0.5 * gPhysicsScene.tankSize.z - this.radius - 0.5 * gPhysicsScene.tankBorder;

		if (this.pos.x < -wx) {
			this.pos.x = -wx; this.vel.x = -this.restitution * this.vel.x;
		}
		if (this.pos.x >  wx) {
			this.pos.x =  wx; this.vel.x = -this.restitution * this.vel.x;
		}
		if (this.pos.z < -wz) {
			this.pos.z = -wz; this.vel.z = -this.restitution * this.vel.z;
		}
		if (this.pos.z >  wz) {
			this.pos.z =  wz; this.vel.z = -this.restitution * this.vel.z;
		}
		if (this.pos.y < this.radius) {
			this.pos.y = this.radius; this.vel.y = -this.restitution * this.vel.y;
		}

		this.visMesh.position.copy(this.pos);
		this.visMesh.geometry.computeBoundingSphere();
	}
	applyForce(force){
		this.vel.y += gPhysicsScene.dt * force / this.mass;
		this.vel.multiplyScalar(0.999);
	}
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

class Duck {
	constructor(pos, radius = 0.15, density = 0.1, colorOrModel = 0xffff00) {
		this.pos = new THREE.Vector3(pos.x, pos.y, pos.z);
		this.vel = new THREE.Vector3();
		this.radius = radius;
		this.mass = 0.5 * density * 4.0 / 3.0 * Math.PI * this.radius * this.radius * this.radius;
		this.restitution = 0.1;
		this.grabbed = false;
		this.chaseSpeed = 0.9;
		this.chaseAcceleration = 2.0;
		this.chaseStopDistance = 0.55;
		this.trailDistance = 0.9;
		this.horizontalWaterDrag = 0.985;
		
		// Low-pass filter state for smooth movement
		this.filteredVelX = 0.0;
		this.filteredVelZ = 0.0;
		this.filterTau = 0.4; // Time constant for smoothing (seconds)
		
		// Visual offset to align model geometry with physics sphere
		// If model origin is at bottom, offset upward to center it on physics position
		this.visualOffset = new THREE.Vector3(0, 0, 0);
		
		// Debug sphere to visualize physics collision
		const debugGeometry = new THREE.SphereGeometry(radius, 16, 16);
		const debugMaterial = new THREE.MeshBasicMaterial({
			color: 0x00ff00,
			wireframe: true,
			transparent: true,
			opacity: 0.3
		});
		this.debugSphere = new THREE.Mesh(debugGeometry, debugMaterial);
		this.debugSphere.position.copy(this.pos);
		this.debugSphere.visible = false; // Hidden
		gThreeScene.add(this.debugSphere);
		
		// Check if colorOrModel is a mesh (GLTF model) or a color
		if (typeof colorOrModel === 'object' && colorOrModel.isObject3D) {
			// Use the provided model
			this.visMesh = colorOrModel;
			// Model origin appears to be at bottom - offset down by radius to center it
			// Also adjust forward/back to align with physics sphere center
			this.visualOffset.set(-0.03, -this.radius + 0.02, 0);
			this.visMesh.position.copy(this.pos).add(this.visualOffset);
			this.visMesh.userData = this;
			this.visMesh.layers.enable(1);
		} else {
			// Create visual mesh from geometry
			let geometry = new THREE.SphereGeometry(radius, 32, 32);
			let material = new THREE.MeshPhongMaterial({color: colorOrModel});
			this.visMesh = new THREE.Mesh(geometry, material);
			this.visMesh.position.copy(this.pos);
			this.visMesh.userData = this;
			this.visMesh.layers.enable(1);
			this.visMesh.castShadow = true;
			this.visMesh.receiveShadow = true;
			gThreeScene.add(this.visMesh);
		}
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

		let newV1 = (m1 * v1 + m2 * v2 - m2 * (v1 - v2) * this.restitution) / (m1 + m2);
		let newV2 = (m1 * v1 + m2 * v2 - m1 * (v2 - v1) * this.restitution) / (m1 + m2);

		this.vel.addScaledVector(dir, newV1 - v1);
		other.vel.addScaledVector(dir, newV2 - v2);
	}
	
	simulate() {
		if (this.grabbed)
			return;

		this.vel.addScaledVector(gPhysicsScene.gravity, gPhysicsScene.dt);

		if (gBoat) {
			const boatForward = new THREE.Vector3(0, 0, 1).applyQuaternion(gBoat.quaternion);
			boatForward.y = 0;
			if (boatForward.lengthSq() > 0.0001) {
				boatForward.normalize();
			}

			const chaseTarget = gBoat.pos.clone().addScaledVector(boatForward, -this.trailDistance);
			const toTarget = chaseTarget.sub(this.pos);
			toTarget.y = 0;
			const distance = toTarget.length();

			if (distance > 0.0001) {
				toTarget.multiplyScalar(1.0 / distance);
				const desiredSpeed = distance > this.chaseStopDistance
					? Math.min(this.chaseSpeed, (distance - this.chaseStopDistance) * 1.5)
					: 0.0;
				
				// Raw desired velocity
				const rawDesiredVelX = toTarget.x * desiredSpeed;
				const rawDesiredVelZ = toTarget.z * desiredSpeed;
				
				// Low-pass filter the desired velocity
				const alpha = gPhysicsScene.dt / (this.filterTau + gPhysicsScene.dt);
				this.filteredVelX += alpha * (rawDesiredVelX - this.filteredVelX);
				this.filteredVelZ += alpha * (rawDesiredVelZ - this.filteredVelZ);
				
				// Apply steering toward filtered velocity
				const steerX = this.filteredVelX - this.vel.x;
				const steerZ = this.filteredVelZ - this.vel.z;
				const steerLen = Math.sqrt(steerX * steerX + steerZ * steerZ);
				const maxSteer = this.chaseAcceleration * gPhysicsScene.dt;

				if (steerLen > 0.0001) {
					const steerScale = Math.min(1.0, maxSteer / steerLen);
					this.vel.x += steerX * steerScale;
					this.vel.z += steerZ * steerScale;
				}
			}
		}

		this.vel.x *= this.horizontalWaterDrag;
		this.vel.z *= this.horizontalWaterDrag;
		this.pos.addScaledVector(this.vel, gPhysicsScene.dt);

		let wx = 0.5 * gPhysicsScene.tankSize.x - this.radius - 0.5 * gPhysicsScene.tankBorder;
		let wz = 0.5 * gPhysicsScene.tankSize.z - this.radius - 0.5 * gPhysicsScene.tankBorder;

		if (this.pos.x < -wx) {
			this.pos.x = -wx; this.vel.x = -this.restitution * this.vel.x;
		}
		if (this.pos.x >  wx) {
			this.pos.x =  wx; this.vel.x = -this.restitution * this.vel.x;
		}
		if (this.pos.z < -wz) {
			this.pos.z = -wz; this.vel.z = -this.restitution * this.vel.z;
		}
		if (this.pos.z >  wz) {
			this.pos.z =  wz; this.vel.z = -this.restitution * this.vel.z;
		}
		if (this.pos.y < this.radius) {
			this.pos.y = this.radius; this.vel.y = -this.restitution * this.vel.y;
		}

		const horizontalSpeedSq = this.vel.x * this.vel.x + this.vel.z * this.vel.z;
		if (horizontalSpeedSq > 0.0004) {
			this.visMesh.rotation.y = Math.atan2(-this.vel.z, this.vel.x);
		}

		this.visMesh.position.copy(this.pos).add(this.visualOffset);
		this.debugSphere.position.copy(this.pos);
		if (this.visMesh.geometry) {
			this.visMesh.geometry.computeBoundingSphere();
		}
	}
	
	applyForce(force) {
		this.vel.y += gPhysicsScene.dt * force / this.mass;
		this.vel.multiplyScalar(0.999);
	}
	
	startGrab(pos) {
		this.grabbed = true;
		this.pos.copy(pos);
		this.visMesh.position.copy(pos).add(this.visualOffset);
		this.debugSphere.position.copy(pos);
	}
	
	moveGrabbed(pos, vel) {
		this.pos.copy(pos);
		this.visMesh.position.copy(pos).add(this.visualOffset);
		this.debugSphere.position.copy(pos);
	}
	
	endGrab(pos, vel) {
		this.grabbed = false;
		this.vel.copy(vel);
	}
}	

class Boat {
	constructor(pos, speedBoatModel){
		this.pos = new THREE.Vector3(pos.x, pos.y, pos.z);
		this.rotation = new THREE.Euler(0, 0, 0); // Euler angles
		this.quaternion = new THREE.Quaternion();
		
		// Physical dimensions (boat physics size)
		this.lengthX = 1.0;
		this.widthZ = 0.5;
		this.heightY = 0.3;
		this.mass = 30.0; // kg - lighter for better floating
		
		// Moment of inertia (for rotation) - reduced for more responsive steering
		this.inertia = new THREE.Vector3(
			this.mass * (this.lengthX * this.lengthX + this.heightY * this.heightY) / 12.0 * 1.2,
			this.mass * (this.lengthX * this.lengthX + this.widthZ * this.widthZ) / 12.0 * 1.2,
			this.mass * (this.widthZ * this.widthZ + this.heightY * this.heightY) / 12.0 * 1.2
		);
		
		// Velocities
		this.vel = new THREE.Vector3(0.0, 0.0, 0.0);
		this.angularVel = new THREE.Vector3(0.0, 0.0, 0.0);
		
		// Control parameters
		this.throttle = 0.0; // 0 to 1
		this.targetThrottle = 0.0;
		this.throttleRate = 0.5; // How fast throttle responds
		this.idleSpeed = 0.03; // Idle throttle
		
		this.steering = 0.0; // -1 (left) to 1 (right)
		this.maxSteeringAngle = Math.PI / 6; // 30 degrees
		this.steeringRate = 2.0; // How fast steering responds
		
		// Motor parameters
		this.maxThrust = 10.0; // Newtons per motor at full throttle
		this.thrustPosition = new THREE.Vector3(0, 0, -0.8); // Relative to boat center
		
		// Drag coefficients
		this.linearDrag = 0.5;
		this.angularDrag = 0.95; // High water resistance to turning
		
		// Buoyancy parameters (positions relative to boat center)
		this.buoyancyPoints = [
			new THREE.Vector3( 0.0,  0, 0.4),   // front center
			new THREE.Vector3(-0.2,  0, 0.3),   // front left
			new THREE.Vector3( 0.2,  0, 0.3),   // front right
			new THREE.Vector3( 0.0,  0,-0.4),   // back center (wake point)
			new THREE.Vector3(-0.2,  0,-0.3),   // back left
			new THREE.Vector3( 0.2,  0,-0.3),   // back right
		];
		this.buoyancyRadius = 0.15; // Radius for each buoyancy point
		// Collision proxy for boat hull (local-space half extents: x, y, z)
		this.collisionHalfExtents = new THREE.Vector3(0.22, 0.14, 0.42);
		
		this.grabbed = false;
		this.restitution = 0.1;

		// Visual mesh from imported speedboat model
		this.visMesh = speedBoatModel;
		this.visMesh.position.copy(pos);
		this.visMesh.userData = this;
		this.visMesh.layers.enable(1);
		
		// Find motor and propeller objects in the model
		this.motors = {
			port: null,
			center: null,
			starboard: null
		};
		this.propellers = {
			port: null,
			center: null,
			starboard: null
		};
		this.centerOfGravity = null;
		this.centerOfThrust = null;
		this.cogOffset = new THREE.Vector3(0, 0, 0); // Offset from mesh origin to COG
		
		this.findMotorObjects();
		
		// Propeller animation
		this.propSpeed = 0.0;
		this.targetPropSpeed = 8.0; // idle RPM in radians/frame
	}
	
	findMotorObjects() {
		if (!this.visMesh) return;
		
		this.visMesh.traverse((child) => {
			const name = child.name.toLowerCase();
			
			// Find motors
			if (name.includes('motorport')) this.motors.port = child;
			if (name.includes('motorcenter')) this.motors.center = child;
			if (name.includes('motorstarboard')) this.motors.starboard = child;
			
			// Find propellers
			if (name.includes('propgroupport')) this.propellers.port = child;
			if (name.includes('propgroupcenter')) this.propellers.center = child;
			if (name.includes('propgroupstarboard')) this.propellers.starboard = child;
			
			// Find reference points
			if (name.includes('centerofgravity')) this.centerOfGravity = child;
			if (name.includes('centerofthrust')) this.centerOfThrust = child;
		});
		
		// Calculate offset from mesh origin to center of gravity
		if (this.centerOfGravity) {
			const cogWorld = new THREE.Vector3();
			this.centerOfGravity.getWorldPosition(cogWorld);
			this.cogOffset.copy(cogWorld).sub(this.visMesh.position);
			
			// Adjust physics position to be at center of gravity
			this.pos.add(this.cogOffset);
		}
		this.visMesh.traverse((child) => {
			if (child.name) {}
		});
	}
	
	updateControls() {
		// Update throttle smoothly
		const throttleDiff = this.targetThrottle - this.throttle;
		this.throttle += throttleDiff * this.throttleRate * gPhysicsScene.dt;
		
		// Update propeller speed based on throttle
		this.targetPropSpeed = 8.0 + this.throttle * 30.0; // idle to max RPM
		const propDiff = this.targetPropSpeed - this.propSpeed;
		this.propSpeed += propDiff * 2.0 * gPhysicsScene.dt;
		
		// Update steering from keyboard
		let targetSteering = 0.0;
		if (gBoatControls.keysPressed['ArrowLeft']) targetSteering -= 1.0;
		if (gBoatControls.keysPressed['ArrowRight']) targetSteering += 1.0;
		
		const steeringDiff = targetSteering - this.steering;
		this.steering += steeringDiff * this.steeringRate * gPhysicsScene.dt;
		this.steering = Math.max(-1.0, Math.min(1.0, this.steering));
		
		// Update throttle from keyboard
		if (gBoatControls.keysPressed['q'] || gBoatControls.keysPressed['Q']) {
			this.targetThrottle = Math.min(1.0, this.targetThrottle + 1.0 * gPhysicsScene.dt);
		} else {
			this.targetThrottle = Math.max(this.idleSpeed, this.targetThrottle - 8.0 * gPhysicsScene.dt);
		}
	}
	
	updateMotorsAndPropellers() {
		// Rotate motors based on steering
		const steeringAngle = this.steering * this.maxSteeringAngle;
		
		if (this.motors.port) {
			this.motors.port.rotation.y = steeringAngle;
		}
		if (this.motors.center) {
			this.motors.center.rotation.y = steeringAngle;
		}
		if (this.motors.starboard) {
			this.motors.starboard.rotation.y = steeringAngle;
		}
		
		// Rotate propellers based on speed
		if (this.propellers.port) {
			this.propellers.port.rotation.y += this.propSpeed * gPhysicsScene.dt;
		}
		if (this.propellers.center) {
			this.propellers.center.rotation.y += this.propSpeed * gPhysicsScene.dt;
		}
		if (this.propellers.starboard) {
			this.propellers.starboard.rotation.y += this.propSpeed * gPhysicsScene.dt;
		}
	}
	
	applyThrust() {
		if (this.throttle <= 0) return;
		
		// Thrust direction in local space (positive Z is forward for this model)
		const steeringAngle = -this.steering * this.maxSteeringAngle;
		const forwardThrustFactor = Math.max(0.35, Math.cos(Math.abs(steeringAngle)));
		const thrustMagnitude = this.throttle * this.maxThrust * forwardThrustFactor;
		const localThrustDir = new THREE.Vector3(
			Math.sin(steeringAngle),
			0,
			Math.cos(steeringAngle)  // Positive Z is forward for this boat model
		);
		
		// Transform thrust to world space
		const worldThrustDir = localThrustDir.applyQuaternion(this.quaternion);
		worldThrustDir.normalize();
		
		// Apply thrust force
		this.vel.addScaledVector(worldThrustDir, thrustMagnitude * gPhysicsScene.dt / this.mass);
		
		// Apply torque from steering (turning is more effective at higher speeds)
		if (Math.abs(this.steering) > 0.01) {
			// Get boat's forward speed in local space
			const localVel = this.vel.clone();
			const invQuat = this.quaternion.clone().invert();
			localVel.applyQuaternion(invQuat);
			const forwardSpeed = Math.abs(localVel.z); // Speed along boat's forward axis
			
			// Make steering authority rise strongly with throttle.
			// At low throttle steering still works, but high throttle turns much harder.
			const throttleTurnFactor = 0.15 + 1.85 * this.throttle * this.throttle;
			const effectiveThrust = throttleTurnFactor * this.maxThrust;
			const speedFactor = Math.min(forwardSpeed * 2.0, 1.0); // Max effectiveness at 0.5 m/s
			const torque = -this.steering * effectiveThrust * speedFactor * 0.8;
			this.angularVel.y += torque * gPhysicsScene.dt / this.inertia.y;
		}
	}
	
	applyBuoyancy() {
		// Sample water height at multiple points on the hull
		const waterSurface = gPhysicsScene.waterSurface;
		if (!waterSurface) return;
		
		let totalBuoyancy = 0.0;
		let totalTorqueX = 0.0;
		let totalTorqueZ = 0.0;
		
		for (const localPoint of this.buoyancyPoints) {
			// Transform buoyancy point to world space
			const worldPoint = localPoint.clone();
			worldPoint.applyQuaternion(this.quaternion);
			worldPoint.add(this.pos);
			
			// Get water height at this point
			const waterHeight = waterSurface.getHeight(worldPoint.x, worldPoint.z);
			
			// Calculate submersion depth
			const submersion = Math.max(0, waterHeight - worldPoint.y);
			
			if (submersion > 0) {
				// Buoyancy force proportional to submersion and displaced volume
				const buoyancyForce = submersion * this.buoyancyRadius * 20000.0;
				totalBuoyancy += buoyancyForce;
				
				// Calculate torque for self-righting (gentle for stability)
				totalTorqueX += buoyancyForce * localPoint.z * 0.0003;
				totalTorqueZ -= buoyancyForce * localPoint.x * 0.0003;
				
				// Generate wake only at the very rear points (behind boat)
				if (localPoint.z < -0.35) {
					waterSurface.addDisplacement(worldPoint.x, worldPoint.z, -submersion * 0.8);
				}
			}
		}
		
		// Apply total buoyancy force
		this.vel.y += totalBuoyancy * gPhysicsScene.dt / this.mass;
		
		// Apply velocity-based vertical drag (water resistance)
		const verticalDrag = 0.6 * Math.abs(this.vel.y) * this.vel.y;
		this.vel.y -= verticalDrag * gPhysicsScene.dt;
		
		// Additional damping to reduce bobbing
		this.vel.y *= 0.95;
		
		// Apply self-righting torques
		this.angularVel.x += totalTorqueX * gPhysicsScene.dt / this.inertia.x;
		this.angularVel.z += totalTorqueZ * gPhysicsScene.dt / this.inertia.z;
	}
	
	applyDrag() {
		// Directional drag - boats resist sideways motion much more than forward motion
		// Convert velocity to local space
		const localVel = this.vel.clone();
		const invQuat = this.quaternion.clone().invert();
		localVel.applyQuaternion(invQuat);
		
		// Apply different drag coefficients for different directions
		const forwardDrag = this.linearDrag; // Forward (positive Z)
		const backwardDrag = this.linearDrag * 25.0; // Backward (negative Z) - very high resistance
		const lateralDrag = this.linearDrag * 30.0; // Sideways (X) - very high resistance
		const verticalDrag = this.linearDrag * 2.0; // Up/down (Y)
		
		// Apply drag in each local direction
		if (Math.abs(localVel.x) > 0.001) {
			const dragX = lateralDrag * localVel.x * Math.abs(localVel.x);
			localVel.x -= dragX * gPhysicsScene.dt / this.mass;
		}
		if (Math.abs(localVel.y) > 0.001) {
			const dragY = verticalDrag * localVel.y * Math.abs(localVel.y);
			localVel.y -= dragY * gPhysicsScene.dt / this.mass;
		}
		if (Math.abs(localVel.z) > 0.001) {
			// Use different drag for forward vs backward motion
			const dragZ = (localVel.z < 0 ? backwardDrag : forwardDrag) * localVel.z * Math.abs(localVel.z);
			localVel.z -= dragZ * gPhysicsScene.dt / this.mass;
		}
		
		// Convert back to world space
		this.vel.copy(localVel.applyQuaternion(this.quaternion));
		
		// Angular drag (resistance to turning in water)
		this.angularVel.multiplyScalar(Math.max(0, 1.0 - this.angularDrag * gPhysicsScene.dt));
		
		// Progressive damping for roll and pitch (more realistic water resistance)
		this.angularVel.x *= 0.85; // Roll damping
		this.angularVel.z *= 0.85; // Pitch damping
	}
	
	applyWeathervaning() {
		// Weathervaning effect - boat naturally aligns with direction of motion
		// This simulates how water flow naturally rotates the boat to face forward
		
		const speed = this.vel.length();
		if (speed < 0.05) return; // Only apply when moving
		
		// Get boat's forward direction in world space
		const forwardDir = new THREE.Vector3(0, 0, 1); // Local forward
		forwardDir.applyQuaternion(this.quaternion);
		forwardDir.y = 0; // Project to horizontal plane
		forwardDir.normalize();
		
		// Get velocity direction in horizontal plane
		const velDir = this.vel.clone();
		velDir.y = 0;
		const velLength = velDir.length();
		if (velLength < 0.01) return;
		velDir.normalize();
		
		// Calculate angle between forward direction and velocity direction
		const cross = forwardDir.x * velDir.z - forwardDir.z * velDir.x;
		const dot = forwardDir.x * velDir.x + forwardDir.z * velDir.z;
		const angle = Math.atan2(cross, dot);
		
		// Apply torque to align boat with velocity
		// Strength increases with speed and misalignment
		const alignmentStrength = 5.0; // Tuning parameter
		const torque = angle * speed * alignmentStrength;
		this.angularVel.y += torque * gPhysicsScene.dt / this.inertia.y;
	}
	
	handleBoundaries() {
		// Bounce off tank walls
		const wx = 0.5 * gPhysicsScene.tankSize.x - this.lengthX * 0.5 - gPhysicsScene.tankBorder;
		const wz = 0.5 * gPhysicsScene.tankSize.z - this.widthZ * 0.5 - gPhysicsScene.tankBorder;

		if (this.pos.x < -wx) {
			this.pos.x = -wx;
			this.vel.x = -this.restitution * this.vel.x;
			this.angularVel.y *= 0.5;
		}
		if (this.pos.x > wx) {
			this.pos.x = wx;
			this.vel.x = -this.restitution * this.vel.x;
			this.angularVel.y *= 0.5;
		}
		if (this.pos.z < -wz) {
			this.pos.z = -wz;
			this.vel.z = -this.restitution * this.vel.z;
			this.angularVel.y *= 0.5;
		}
		if (this.pos.z > wz) {
			this.pos.z = wz;
			this.vel.z = -this.restitution * this.vel.z;
			this.angularVel.y *= 0.5;
		}
		
		// Floor collision
		if (this.pos.y < 0) {
			this.pos.y = 0;
			this.vel.y = -this.restitution * this.vel.y;
		}
	}
	
	simulate() {
		if (this.grabbed) return;
		
		this.updateControls();
		this.updateMotorsAndPropellers();
		
		// Apply forces
		this.vel.addScaledVector(gPhysicsScene.gravity, gPhysicsScene.dt);
		this.applyBuoyancy();
		this.applyThrust();
		this.applyDrag();
		
		// Update position
		this.pos.addScaledVector(this.vel, gPhysicsScene.dt);
		
		// Update rotation
		const deltaRotation = new THREE.Quaternion();
		const axis = this.angularVel.clone().normalize();
		const angle = this.angularVel.length() * gPhysicsScene.dt;
		
		if (angle > 0.0001) {
			deltaRotation.setFromAxisAngle(axis, angle);
			this.quaternion.multiply(deltaRotation);
			this.quaternion.normalize();
		}
		
		this.handleBoundaries();
		
		// Update visual mesh - account for COG offset
		// Physics position is at COG, but mesh origin may be elsewhere
		const meshPos = this.pos.clone();
		const rotatedOffset = this.cogOffset.clone().applyQuaternion(this.quaternion);
		meshPos.sub(rotatedOffset);
		
		this.visMesh.position.copy(meshPos);
		this.visMesh.quaternion.copy(this.quaternion);
	}
	
	startGrab(pos) {
		this.grabbed = true;
		this.pos.copy(pos);
		// Update mesh position accounting for COG offset
		const meshPos = this.pos.clone().sub(this.cogOffset);
		this.visMesh.position.copy(meshPos);
	}
	
	moveGrabbed(pos, vel) {
		this.pos.copy(pos);
		// Update mesh position accounting for COG offset
		const meshPos = this.pos.clone().sub(this.cogOffset);
		this.visMesh.position.copy(meshPos);
	}
	
	endGrab(pos, vel) {
		this.grabbed = false;
		this.vel.copy(vel);
	}
	
	handleCollision(other) {
		// Handle collision between boat and other objects (primarily balls)
		if (!other.radius) {
			// If other object is also a boat or doesn't have a radius, skip collision
			return;
		}

		// Oriented box (boat hull) vs sphere collision in boat local space.
		const invQuat = this.quaternion.clone().invert();
		const localCenter = other.pos.clone().sub(this.pos).applyQuaternion(invQuat);
		const he = this.collisionHalfExtents;

		const closest = new THREE.Vector3(
			Math.max(-he.x, Math.min(he.x, localCenter.x)),
			Math.max(-he.y, Math.min(he.y, localCenter.y)),
			Math.max(-he.z, Math.min(he.z, localCenter.z))
		);

		const localDelta = localCenter.clone().sub(closest);
		let d = localDelta.length();
		if (d >= other.radius) return;

		if (d < 0.0001) {
			// If center is inside box, choose an outward local direction.
			localDelta.set(localCenter.x >= 0 ? 1 : -1, 0, 0);
			d = 1.0;
		}

		const dir = localDelta.applyQuaternion(this.quaternion).normalize();
		const corr = other.radius - d;

		// Push the sphere away more than the boat (boat is much heavier).
		other.pos.addScaledVector(dir, corr * 0.9);
		this.pos.addScaledVector(dir, -corr * 0.1);

		// Collision response
		let v1 = this.vel.dot(dir);
		let v2 = other.vel.dot(dir);

		let m1 = this.mass;
		let m2 = other.mass;

		let newV1 = (m1 * v1 + m2 * v2 - m2 * (v1 - v2) * this.restitution) / (m1 + m2);
		let newV2 = (m1 * v1 + m2 * v2 - m1 * (v2 - v1) * other.restitution) / (m1 + m2);

		this.vel.addScaledVector(dir, newV1 - v1);
		other.vel.addScaledVector(dir, newV2 - v2);
	}
}


// ------------------------------------------------------------------
function initScene(scene) {				
	// water surface

	let wx = gPhysicsScene.tankSize.x;
	let wy = gPhysicsScene.tankSize.y;
	let wz = gPhysicsScene.tankSize.z;
	let b = gPhysicsScene.tankBorder;

	var waterSurface = new WaterSurface(wx, wz, gPhysicsScene.waterHeight, 
							gPhysicsScene.waterSpacing, gWaterMaterial)
	gPhysicsScene.waterSurface = waterSurface;

	// tank (hidden for now)

	// var tankMaterial = new THREE.MeshPhongMaterial({color: 0x909090});
	// var boxGeometry = new THREE.BoxGeometry(b, wy, wz);
	// var box = new THREE.Mesh(boxGeometry, tankMaterial);
	// box.position.set(-0.5 * wx, wy * 0.5, 0.0)
	// gThreeScene.add(box);
	// var box = new THREE.Mesh(boxGeometry, tankMaterial);
	// box.position.set(0.5 * wx, 0.5 * wy, 0.0)
	// gThreeScene.add(box);
	// var boxGeometry = new THREE.BoxGeometry(wx, wy, b);
	// var box = new THREE.Mesh(boxGeometry, tankMaterial);
	// box.position.set(0.0, 0.5 * wy, - wz * 0.5)
	// gThreeScene.add(box);
	// var box = new THREE.Mesh(boxGeometry, tankMaterial);
	// box.position.set(0.0, 0.5 * wy, wz * 0.5)
	// gThreeScene.add(box);

	// ball

	//gPhysicsScene.objects.push(new Ball({x:-0.5, y:1.0, z:-0.5}, 0.2, 2.0, 0xffff00));
	//gPhysicsScene.objects.push(new Ball({x:0.5, y:1.0, z:-0.5}, 0.3, 0.7, 0xff8000));				
	gPhysicsScene.objects.push(new Ball({x:0.5, y:1.0, z:0.5}, 0.15, 0.2, 0xff0000));
	
	// duck and boat will be added after models load

}

// ------------------------------------------------------------------
function simulate() {
	if (gPhysicsScene.waterSurface) {
		gPhysicsScene.waterSurface.simulate();
	}
	
	for (let i = 0; i < gPhysicsScene.objects.length; i++) {
		obj = gPhysicsScene.objects[i]
		obj.simulate();
		for (let j = 0; j < i; j++) 
			obj.handleCollision(gPhysicsScene.objects[j]);
	}
}

// ------------------------------------------
function render() {
	if (!gPhysicsScene.waterSurface) return;
	
	// First pass: render everything except water to render target (for refraction texture)
	gPhysicsScene.waterSurface.setVisible(false);
	gRenderer.setRenderTarget(gRenderTarget);
	gRenderer.clear();
	gRenderer.render(gThreeScene, gCamera);

	// Second pass: render to screen with stencil masking
	gRenderer.setRenderTarget(null);
	gRenderer.autoClear = false;
	
	// Clear everything including stencil
	gRenderer.clear(true, true, true);
	
	// Update debug overlay position to match boat
	if (gBoat && window.gDebugOverlay) {
		// Extract Y rotation from boat's quaternion
		const euler = new THREE.Euler().setFromQuaternion(gBoat.quaternion, 'YXZ');
		const boatRotationY = euler.y;
		const maskRotationY = -boatRotationY;
		
		// Add forward offset in boat's local coordinate frame
		const forwardOffset = 0.05;
		const offsetX = Math.sin(boatRotationY) * forwardOffset;
		const offsetZ = Math.cos(boatRotationY) * forwardOffset;
		
		window.gDebugOverlay.position.x = gBoat.pos.x + offsetX;
		window.gDebugOverlay.position.y = gPhysicsScene.waterHeight; // Water surface level (0.8)
		window.gDebugOverlay.position.z = gBoat.pos.z + offsetZ;
		// Update Y rotation to match boat heading
		window.gDebugOverlay.rotation.y = maskRotationY;
	}
	
	// Update stencil mask position to match boat
	if (gBoat && window.gStencilMask) {
		// Extract Y rotation from boat's quaternion
		const euler = new THREE.Euler().setFromQuaternion(gBoat.quaternion, 'YXZ');
		const boatRotationY = euler.y;
		const maskRotationY = -boatRotationY;
		
		const forwardOffset = 0.05;
		const offsetX = Math.sin(boatRotationY) * forwardOffset;
		const offsetZ = Math.cos(boatRotationY) * forwardOffset;
		
		window.gStencilMask.position.x = gBoat.pos.x + offsetX;
		window.gStencilMask.position.y = gPhysicsScene.waterHeight; // Water surface level (0.8)
		window.gStencilMask.position.z = gBoat.pos.z + offsetZ;
		// Update Y rotation to match boat heading (X stays at -PI/2 for horizontal)
		window.gStencilMask.rotation.y = maskRotationY;
	}

	if (gBoat && gWaterMaterial) {
		const euler = new THREE.Euler().setFromQuaternion(gBoat.quaternion, 'YXZ');
		const boatRotationY = euler.y;
		const maskRotationY = -boatRotationY;
		const forwardOffset = 0.05;
		const offsetX = Math.sin(boatRotationY) * forwardOffset;
		const offsetZ = Math.cos(boatRotationY) * forwardOffset;

		gWaterMaterial.uniforms.boatMaskCenter.value.set(gBoat.pos.x + offsetX, gBoat.pos.z + offsetZ);
		gWaterMaterial.uniforms.boatMaskCosSin.value.set(Math.cos(maskRotationY), Math.sin(maskRotationY));
		gWaterMaterial.uniforms.boatMaskHalfExtents.value.set(0.06, 0.075);
	}
	
	// Render everything (stencil mask writes to buffer, water skips stenciled areas)
	// First render just the stencil mask to write to stencil buffer
	if (gBoat && gBoat.visMesh) gBoat.visMesh.visible = false;
	gPhysicsScene.waterSurface.setVisible(false);
	if (window.gDebugOverlay) window.gDebugOverlay.visible = false;
	if (window.gStencilMask) window.gStencilMask.visible = true;
	gRenderer.render(gThreeScene, gCamera);
	
	// Now render everything else (stencil is already populated, don't clear it)
	if (gBoat && gBoat.visMesh) gBoat.visMesh.visible = true;
	gPhysicsScene.waterSurface.setVisible(true);
	if (window.gDebugOverlay) window.gDebugOverlay.visible = false;
	if (window.gStencilMask) window.gStencilMask.visible = false;
	gRenderer.render(gThreeScene, gCamera);
	
	gRenderer.autoClear = true;
}

// ------------------------------------------
function initThreeScene() {
	gThreeScene = new THREE.Scene();
	
	// Lights
	gThreeScene.add( new THREE.AmbientLight( 0x505050 ) );	

	var spotLight = new THREE.SpotLight( 0xffffff );
	spotLight.angle = Math.PI / 5;
	spotLight.penumbra = 0.0;
	spotLight.position.set( 2, 3, 3 );
	spotLight.castShadow = true;
	spotLight.shadow.camera.near = 1;
	spotLight.shadow.camera.far = 100;
	spotLight.shadow.mapSize.width = 1024;
	spotLight.shadow.mapSize.height = 1024;
	gThreeScene.add( spotLight );

	var dirLight = new THREE.DirectionalLight( 0x55505a, 1 );
	dirLight.position.set( 0, 10, 0 );
	dirLight.castShadow = true;
	dirLight.shadow.camera.near = 1;
	dirLight.shadow.camera.far = 10;

	let wx = gPhysicsScene.tankSize.x;
	let wy = gPhysicsScene.tankSize.y;
	let wz = gPhysicsScene.tankSize.z;
	dirLight.shadow.camera.right = wx;
	dirLight.shadow.camera.left = - wx;
	dirLight.shadow.camera.top	= wy;
	dirLight.shadow.camera.bottom = - wy;

	dirLight.shadow.mapSize.width = 1024;
	dirLight.shadow.mapSize.height = 1024;
	gThreeScene.add( dirLight );

	
	
	// Geometry
	var ground = new THREE.Mesh(
		new THREE.PlaneBufferGeometry( 10, 10, 1, 1 ),
		new THREE.MeshPhongMaterial( { color: 0xa0adaf, shininess: 150 } )
	);				

	ground.rotation.x = - Math.PI / 2; // rotates X/Y to X/Z
	ground.receiveShadow = true;
	gThreeScene.add( ground );
	
	var helper = new THREE.GridHelper( 10, 80 );
	helper.material.opacity = 1.0;
	helper.material.transparent = true;
	helper.position.set(0, 0.002, 0);
	gThreeScene.add( helper );				
	
	// gRenderer
	var container = document.getElementById('container');
	gRenderer = new THREE.WebGLRenderer({ stencil: true });
	gRenderer.shadowMap.enabled = true;
	gRenderer.setPixelRatio( window.devicePixelRatio );
	gRenderer.setSize( window.innerWidth, window.innerHeight );
	window.addEventListener( 'resize', onWindowResize, false );
	container.appendChild( gRenderer.domElement );

	gRenderTarget = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, 
		{ minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat } );

	gWaterMaterial = new THREE.ShaderMaterial( {
		uniforms: {
			background: { value: gRenderTarget.texture },
			boatMaskCenter: { value: new THREE.Vector2(0.0, 0.0) },
			boatMaskCosSin: { value: new THREE.Vector2(1.0, 0.0) },
			boatMaskHalfExtents: { value: new THREE.Vector2(0.06, 0.075) }
		},
		vertexShader: document.getElementById( 'waterVertexShader' ).textContent,
		fragmentShader: document.getElementById( 'waterFragmentShader' ).textContent,
		depthTest: true,
		depthWrite: true,
		stencilWrite: false,
		stencilFunc: THREE.NotEqualStencilFunc,
		stencilRef: 1,
		stencilFail: THREE.KeepStencilOp,
		stencilZFail: THREE.KeepStencilOp,
		stencilZPass: THREE.KeepStencilOp} );
	
	// Debug overlay to visualize stencil mask area (cockpit area in scaled boat model)
	const debugOverlayGeometry = new THREE.PlaneBufferGeometry(0.12, 0.15);
	const debugOverlayMaterial = new THREE.MeshBasicMaterial({
		color: 0xff0000,
		transparent: true,
		opacity: 0.7,
		side: THREE.DoubleSide,
		depthTest: false,
		depthWrite: false,
		stencilWrite: false,
		stencilFunc: THREE.EqualStencilFunc,
		stencilRef: 1
	});
	window.gDebugOverlay = new THREE.Mesh(debugOverlayGeometry, debugOverlayMaterial);
	window.gDebugOverlay.rotation.order = 'YXZ'; // Set rotation order
	window.gDebugOverlay.rotation.y = 0;
	window.gDebugOverlay.rotation.x = -Math.PI / 2; // Horizontal plane
	window.gDebugOverlay.position.set(0, 0.8, 0); // At water surface level
	window.gDebugOverlay.visible = false;
	gThreeScene.add(window.gDebugOverlay);
	
	// Debug: Show actual boat geometry bounds
	window.gShowBoatGeometry = function() {
		if (!gBoat || !gBoat.visMesh) {
			console.log("No boat loaded yet");
			return;
		}
		
		let meshCount = 0;
		gBoat.visMesh.traverse((child) => {
			if (child.isMesh) {
				meshCount++;
				const bbox = new THREE.Box3().setFromObject(child);
				const size = new THREE.Vector3();
				bbox.getSize(size);
				console.log(`Mesh ${meshCount}: ${child.name}`);
				console.log(`  Size: ${size.x.toFixed(3)} x ${size.y.toFixed(3)} x ${size.z.toFixed(3)}`);
				console.log(`  Visible: ${child.visible}`);
				console.log(`  Material:`, child.material);
				
				// Draw wireframe box around this mesh
				const helper = new THREE.Box3Helper(bbox, 0x00ff00);
				gThreeScene.add(helper);
			}
		});
		console.log(`Total meshes: ${meshCount}`);
	};
	console.log("Run gShowBoatGeometry() to visualize boat mesh bounds");
		
	// gCamera
			
	gCamera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.01, 100);
	gCamera.position.set(0.0, 2.1, 1.5);
	gCamera.updateMatrixWorld();	

	gThreeScene.add( gCamera );

	gCameraControl = new THREE.OrbitControls(gCamera, gRenderer.domElement);
	gCameraControl.zoomSpeed = 2.0;
	gCameraControl.panSpeed = 0.4;
	gCameraControl.target.set(0.0, 0.8, 0.0);
	gCameraControl.enabled = true; // Enable OrbitControls

	// Grabber

	gGrabber = new Grabber();
	container.addEventListener( 'pointerdown', onPointer, false );
	container.addEventListener( 'pointermove', onPointer, false );
	container.addEventListener( 'pointerup', onPointer, false );
	
	// Keyboard controls for boat
	window.addEventListener( 'keydown', onKeyDown, false );
	window.addEventListener( 'keyup', onKeyUp, false );
	
	// Load speedboat model using GLTFLoader
    var speedBoatLoader = new THREE.GLTFLoader();
    speedBoatLoader.load(
        'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/speedBoat.gltf',
        function(gltf) {
            var speedBoat = gltf.scene;
            speedBoat.position.set(gSpeedBoatInitialX, gSpeedBoatStartY, gSpeedBoatInitialZ);
            speedBoat.scale.set(0.1, 0.1, 0.1);
            speedBoat.rotation.y = 0; 
            // Remove any imported lights
            var lightsToRemove = [];
            speedBoat.traverse(function(child) {
                if (child.isLight) {
                    lightsToRemove.push(child);
                }
            });
            lightsToRemove.forEach(function(light) {
                if (light.parent) {
                    light.parent.remove(light);
                }
            });
            
            // Enable shadows and brighten materials
            speedBoat.traverse(function(child) {
                if (child.isMesh) {
                    console.log('Boat mesh:', child.name);
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Brighten materials (no stencil on boat mesh)
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material = child.material.map(m => {
                                const mat = m.clone();
                                // Brighten
                                if (mat.map && mat.emissive !== undefined) {
                                    mat.emissiveMap = mat.map;
                                    mat.emissive = new THREE.Color(0xffffff);
                                    mat.emissiveIntensity = 0.3;
                                }
                                return mat;
                            });
                        } else {
                            child.material = child.material.clone();
                            // Brighten the material
                            if (child.material.map && child.material.emissive !== undefined) {
                                child.material.emissiveMap = child.material.map;
                                child.material.emissive = new THREE.Color(0xffffff);
                                child.material.emissiveIntensity = 0.3;
                            }
                        }
                    }
                }
            });
            
            // Create dedicated stencil mask plane for cockpit area
            const stencilMaskGeometry = new THREE.PlaneBufferGeometry(0.12, 0.15);
            const stencilMaskMaterial = new THREE.MeshBasicMaterial({
				colorWrite: false,
                side: THREE.DoubleSide,
                depthTest: false,   // Always render, ignore depth
                depthWrite: false,  // Don't write depth
                stencilWrite: true,
                stencilFunc: THREE.AlwaysStencilFunc,
                stencilRef: 1,
                stencilFail: THREE.ReplaceStencilOp,  // Always write to stencil
                stencilZFail: THREE.ReplaceStencilOp, // Always write to stencil
                stencilZPass: THREE.ReplaceStencilOp  // Always write to stencil
            });
            window.gStencilMask = new THREE.Mesh(stencilMaskGeometry, stencilMaskMaterial);
            window.gStencilMask.rotation.order = 'YXZ'; // Set rotation order
            window.gStencilMask.rotation.y = 0;
            window.gStencilMask.rotation.x = -Math.PI / 2; // Horizontal
            window.gStencilMask.renderOrder = -1; // Render before everything
            gThreeScene.add(window.gStencilMask); // Add directly to scene
            console.log('Stencil mask created:', window.gStencilMask);
            
            gThreeScene.add(speedBoat);
            window.gSpeedBoat = speedBoat;
            
            // Create Boat instance and add to physics objects
            const boat = new Boat(
                {x: gSpeedBoatInitialX, y: gSpeedBoatStartY, z: gSpeedBoatInitialZ},
                speedBoat
            );
            gPhysicsScene.objects.push(boat);
            gBoat = boat;
            
            console.log('Boat model loaded');
        }
    );
    
    // Load duck model using GLTFLoader
    var duckLoader = new THREE.GLTFLoader();
    duckLoader.load(
        'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/Duck.gltf',
        function(gltf) {
            var duckMesh = gltf.scene;
            duckMesh.position.set(-0.5, 1.0, 0.5);
            duckMesh.scale.set(0.2, 0.2, 0.2);
            duckMesh.rotation.y = 0;
            
            // Remove any imported lights
            var lightsToRemove = [];
            duckMesh.traverse(function(child) {
                if (child.isLight) {
                    lightsToRemove.push(child);
                }
            });
            lightsToRemove.forEach(function(light) {
                if (light.parent) {
                    light.parent.remove(light);
                }
            });
            
            // Enable shadows and brighten materials
            duckMesh.traverse(function(child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Brighten the material
                    if (child.material) {
                        if (child.material.map && child.material.emissive !== undefined) {
                            child.material.emissiveMap = child.material.map;
                            child.material.emissive = new THREE.Color(0xffffff);
                            child.material.emissiveIntensity = 0.3;
                        }
                        child.material.needsUpdate = true;
                    }
                }
            });
            
            gThreeScene.add(duckMesh);
            window.gDuck = duckMesh;
            
            // Create Duck instance with model
            const duck = new Duck(
                {x: -0.5, y: 1.0, z: 0.5},
                0.20,
                0.3,
                duckMesh
            );
            
            // Set up userData for raycasting/grabbing on all mesh children
            duckMesh.traverse(function(child) {
                if (child.isMesh) {
                    child.userData = duck;
                    child.layers.enable(1);
                }
            });
            
            gPhysicsScene.objects.push(duck);
            
            console.log('Duck model loaded');
        }
    );
}

// ------- Grabber -----------------------------------------------------------
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
		this.raycaster.setFromCamera( this.mousePos, gCamera );
	}
	start(x, y) {
		this.physicsObject = null;
		this.updateRaycaster(x, y);
		var intersects = this.raycaster.intersectObjects( gThreeScene.children );
		if (intersects.length > 0) {
			var obj = intersects[0].object.userData;
			if (obj) {
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
			gCameraControl.saveState();
			gCameraControl.enabled = false;
		}
	}
	else if (evt.type == "pointermove" && gMouseDown) {
		gGrabber.move(evt.clientX, evt.clientY);
	}
	else if (evt.type == "pointerup") {
		if (gGrabber.physicsObject) {
			gGrabber.end();
			gCameraControl.reset();
		}
		gMouseDown = false;
		gCameraControl.enabled = true;
	}
}

function onKeyDown( evt ) {
	gBoatControls.keysPressed[evt.key] = true;
}

function onKeyUp( evt ) {
	gBoatControls.keysPressed[evt.key] = false;
}
				
function onWindowResize() {
	gCamera.aspect = window.innerWidth / window.innerHeight;
	gCamera.updateProjectionMatrix();
	gRenderer.setSize( window.innerWidth, window.innerHeight );
	gRenderTarget.setSize(window.innerWidth, window.innerHeight);
}

function restart() {
	location.reload();
}

function initHud() {
	const gauge = document.createElement('div');
	gauge.style.position = 'fixed';
	gauge.style.top = '18px';
	gauge.style.right = '18px';
	gauge.style.width = '116px';
	gauge.style.height = '116px';
	gauge.style.borderRadius = '50%';
	gauge.style.background = 'rgba(12, 16, 28, 0.55)';
	gauge.style.border = '1px solid rgba(255, 255, 255, 0.35)';
	gauge.style.boxShadow = '0 10px 26px rgba(0, 0, 0, 0.35), inset 0 0 0 1px rgba(255, 255, 255, 0.08)';
	gauge.style.backdropFilter = 'blur(4px)';
	gauge.style.pointerEvents = 'none';
	gauge.style.zIndex = '20';

	const ring = document.createElement('div');
	ring.style.position = 'absolute';
	ring.style.left = '8px';
	ring.style.top = '8px';
	ring.style.width = '100px';
	ring.style.height = '100px';
	ring.style.borderRadius = '50%';
	ring.style.background = 'conic-gradient(#4be09f 0deg, #2b2f3f 0deg 360deg)';
	ring.style.transform = 'rotate(-90deg)';

	const inner = document.createElement('div');
	inner.style.position = 'absolute';
	inner.style.left = '18px';
	inner.style.top = '18px';
	inner.style.width = '80px';
	inner.style.height = '80px';
	inner.style.borderRadius = '50%';
	inner.style.background = 'rgba(8, 11, 20, 0.95)';
	inner.style.boxShadow = 'inset 0 0 20px rgba(0, 0, 0, 0.45)';

	const label = document.createElement('div');
	label.textContent = 'THROTTLE';
	label.style.position = 'absolute';
	label.style.top = '36px';
	label.style.left = '0';
	label.style.width = '100%';
	label.style.textAlign = 'center';
	label.style.font = '600 10px/1.0 Helvetica, Arial, sans-serif';
	label.style.letterSpacing = '1.3px';
	label.style.color = 'rgba(205, 219, 255, 0.85)';

	const value = document.createElement('div');
	value.textContent = '0%';
	value.style.position = 'absolute';
	value.style.top = '52px';
	value.style.left = '0';
	value.style.width = '100%';
	value.style.textAlign = 'center';
	value.style.font = '700 20px/1.0 Helvetica, Arial, sans-serif';
	value.style.color = '#e7f4ff';

	gauge.appendChild(ring);
	gauge.appendChild(inner);
	gauge.appendChild(label);
	gauge.appendChild(value);
	document.body.appendChild(gauge);

	gThrustGaugeFill = ring;
	gThrustGaugeValue = value;
}

function updateThrustGauge() {
	if (!gThrustGaugeFill || !gThrustGaugeValue) return;
	const throttle = gBoat ? Math.max(0.0, Math.min(1.0, gBoat.throttle)) : 0.0;
	const pct = Math.round(throttle * 100.0);
	const deg = throttle * 360.0;
	gThrustGaugeFill.style.background = 'conic-gradient(#4be09f 0deg, #4be09f ' + deg.toFixed(1) + 'deg, #2b2f3f ' + deg.toFixed(1) + 'deg 360deg)';
	gThrustGaugeValue.textContent = pct + '%';
}

// make browser to call us repeatedly -----------------------------------
function update() {
	//let time = performance.now();
	//let dt = (time - gPrevTime) / 1000.0;
	//gPrevTime = time;

	//gPhysicsScene.dt = Math.min(1.0 / 30.0, 2.0 * dt);

	simulate();
	
	// Update camera to follow boat (disabled)
	// if (gBoat) {
	// 	// Get boat position and orientation
	// 	const boatPos = gBoat.pos;
	// 	const boatQuat = gBoat.quaternion;
	// 	
	// 	// Calculate camera offset (behind and above the boat)
	// 	const offset = new THREE.Vector3(0, 0.35, -1.5); // Closer and above in local space
	// 	const worldOffset = offset.applyQuaternion(boatQuat);
	// 	
	// 	// Set camera position
	// 	gCamera.position.copy(boatPos).add(worldOffset);
	// 	
	// 	// Look at a point slightly ahead of the boat
	// 	const lookAtOffset = new THREE.Vector3(0, 0.15, 1.0);
	// 	const worldLookAt = lookAtOffset.applyQuaternion(boatQuat);
	// 	const lookAtPos = boatPos.clone().add(worldLookAt);
	// 	gCamera.lookAt(lookAtPos);
	// }
	
	render();
	updateThrustGauge();
	gCameraControl.update();	
	gGrabber.increaseTime(gPhysicsScene.dt);			
	
	requestAnimationFrame(update);
}

initThreeScene();
initHud();
initScene();
update();