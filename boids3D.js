/*
BOIDS 3D :: Copyright 2026 :: Frank Maiello 
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
        
var gThreeScene;
var gRenderer;
var gCamera;
var gCameraControl;
var gGrabber;
var gMouseDown = false;
var gCameraAngle = 0;
var gCameraRotationSpeed = 3.0; // Rotation state: 0 = stopped, 0.5 = forward, -0.5 = backward
var gAutoRotate = true; // Enable/disable auto-rotation
var gCameraMode = 1; // Camera mode: 0=static, 1=rotate CCW, 2=rotate CW, 3=behind boid, 4=in front of boid
var gCameraManualControl = false; // Track if user is manually controlling camera
var gCameraSpringStrength = 0.08; // Spring interpolation strength (lower = smoother)
var gCameraOffset = new THREE.Vector3(0, 0, 0); // Manual camera offset in first-person mode
var gCameraRotationOffset = { theta: 0, phi: 0 }; // Manual rotation offset
var gSavedCameraPosition = null; // Saved camera position from third-person mode
var gSavedCameraTarget = null; // Saved camera target from third-person mode
var gPointerLastX = 0;
var gPointerLastY = 0;
var container = null; // Container element for renderer
var gLampPivot = null; // Pivot point for lamp rotation (pin center)
var gLampRotatableGroup = null; // Group containing lamp parts that rotate
var gSpotLight = null; // Reference to spotlight
var gDraggingLamp = false; // Track if dragging the lamp
var gDraggingLampHeight = false; // Track if adjusting lamp height
var gDraggingLampRotation = false; // Track if rotating lamp assembly
var gDraggingLampBase = false; // Track if dragging the base to move assembly
var gDraggingCylinder = false; // Track if dragging the cylinder obstacle
var gActiveLampId = 1; // Track which lamp is currently being interacted with (1 or 2)
var gLampAngle = -0.0435; // Current lamp angle in radians (-2.49 degrees)
var gLampAssemblyRotation = 0.0; // Current lamp assembly rotation around Y axis
var gLampBaseCenter = null; // Center point of lamp base for rotation
var gLampBasePlate = null; // Reference to the base pedestal
var gLampPole = null; // Reference to lamp pole
var gLampSleeve = null; // Reference to lamp sleeve
var gLampDiscs = []; // References to discs
var gLampPin = null; // Reference to pin
var gLampBulb = null; // Reference to light bulb
var gLampInnerCone = null; // Reference to inner cone

// Second lamp globals
var gLampPivot2 = null;
var gLampRotatableGroup2 = null;
var gSpotLight2 = null;
var gLampAngle2 = -1.0469; // Current lamp 2 angle in radians (-59.98 degrees)
var gLampAssemblyRotation2 = 2.2692; // Current lamp 2 assembly rotation (130.01 degrees)
var gLampBaseCenter2 = null;
var gLampBasePlate2 = null;
var gLampPole2 = null;
var gLampSleeve2 = null;
var gLampDiscs2 = [];
var gLampPin2 = null;
var gLampBulb2 = null; // Reference to light bulb 2
var gLampInnerCone2 = null; // Reference to inner cone 2
var gPinRotationAxis2 = null;
var gInitialLampHeight = 0; // Initial lamp height
var gLastLampBaseClickTime = { 1: 0, 2: 0 }; // Track last click time for double-click detection
var gOverlayCanvas;
var gOverlayCtx;
var gButtons = {
    run: { x: 25, y: 25, radius: 8, color: '#ff4444', hovered: false },
    restart: { x: 50, y: 25, radius: 8, color: '#ffcc00', hovered: false }
};
var deltaT = 1.0 / 60.0;

// Boid rendering options
var renderHemispheres = false; // Set to false to disable rear hemispheres

// Menu system variables
var mainMenuVisible = true;
var mainMenuOpacity = 0;
var mainMenuXOffset = -1.0;
var mainMenuAnimSpeed = 5.0;
var mainMenuFadeSpeed = 3.0;
var menuVisible = false; // Simulation submenu visibility
var menuVisibleBeforeHide = false; // Remember submenu state when main menu is hidden
var menuOpacity = 0;
var menuFadeSpeed = 3.0;
var menuScale = 300; // Master menu size control (increased 50%)
var menuX = 0.02; // Menu position in world coordinates
var menuY = 0.2;
var draggedKnob = null; // Currently dragged knob index
var dragStartMouseX = 0;
var dragStartMouseY = 0;
var dragStartValue = 0;
var isDraggingMenu = false;
var menuDragStartX = 0;
var menuDragStartY = 0;
var menuStartX = 0;
var menuStartY = 0;
var mouseAttached = false;

var segregationMode = 0; // 0 = no segregation, 1 = same hue separation, 2 = all separation
var SpatialGrid; // Global spatial grid instance

// Master world size constants
//var WORLD_WIDTH = 69.5 * 0.5; // X dimension Parthenon
//var WORLD_DEPTH = 31 * 0.5;   // Z dimension Parthenon
var WORLD_WIDTH = 24;   // X dimension
var WORLD_HEIGHT = 20;  // Y dimension  
var WORLD_DEPTH = 20;   // Z dimension

var gPhysicsScene = {
    gravity : new THREE.Vector3(0.0, 0.0, 0.0),
    dt : 1.0 / 60.0,
    worldSize : {x: WORLD_WIDTH, y: WORLD_HEIGHT, z: WORLD_DEPTH},
    paused: false,
    objects: [],				
};

var restitution = {
    ball: 0,
    boundary: 1,
    floor: 0.7,
};

var boidRadius = 0.16;
var boidProps = {
    minDistance: 5.0 * boidRadius, // Rule #1 - The distance to stay away from other Boids
    avoidFactor: 0.05, // Rule #1 -Adjust velocity by this %
    matchingFactor: 0.05, // Rule #2 - Adjust velocity by this %
    visualRange: 7.0 * boidRadius, // How far Boids can see each other
    centeringFactor: 0.0005, // Rule #3 - Adjust velocity by this %
    minSpeed: 2.0, // minimum speed to maintain
    maxSpeed: 8.0, // maximum speed limit
    turnFactor: 0.05, // How strongly Boids turn back when near edge
    margin: 2.0, // Distance from boundary to start turning
};

// OBSTACLE CLASSES ---------------------------------------------------------------------

class TorusObstacle {
    constructor(majorRadius, minorRadius, position, rotation) {
        this.majorRadius = majorRadius;
        this.minorRadius = minorRadius;
        this.position = position.clone();
        this.rotation = rotation || { x: 0, y: 0, z: 0 };
        this.mesh = null;
        
        // Create the torus mesh
        this.createMesh();
    }
    
    createMesh() {
        var geometry = new THREE.TorusGeometry(this.majorRadius, this.minorRadius, 16, 100);
        var material = new THREE.MeshPhongMaterial({color: 0x00ff00, shininess: 100});
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.rotation.x = this.rotation.x;
        this.mesh.rotation.y = this.rotation.y;
        this.mesh.rotation.z = this.rotation.z;
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        gThreeScene.add(this.mesh);
    }
    
    // Check if a point is inside the solid part of the torus
    // Returns distance to surface (negative if inside solid)
    getDistanceToSurface(point) {
        // Transform point to torus local space
        const localPoint = point.clone().sub(this.position);
        
        // Apply inverse rotation (assuming rotation around Y axis for now)
        const cosY = Math.cos(-this.rotation.y);
        const sinY = Math.sin(-this.rotation.y);
        const rotatedX = localPoint.x * cosY - localPoint.z * sinY;
        const rotatedZ = localPoint.x * sinY + localPoint.z * cosY;
        localPoint.x = rotatedX;
        localPoint.z = rotatedZ;
        
        // Signed distance to torus
        // First, find distance from point to the major circle in the XZ plane
        const distToCenter = Math.sqrt(localPoint.x * localPoint.x + localPoint.z * localPoint.z);
        
        // Vector from major circle to point (in the tube cross-section)
        const qx = distToCenter - this.majorRadius;
        const qy = localPoint.y;
        
        // Distance in the tube cross-section plane
        const tubeDistance = Math.sqrt(qx * qx + qy * qy);
        
        // Return signed distance (negative if inside the solid tube)
        return tubeDistance - this.minorRadius;
    }
    
    // Apply avoidance force to a boid
    applyAvoidance(boid, avoidanceStrength = 1.5) {
        const distance = this.getDistanceToSurface(boid.pos);
        const threshold = 5.0; // Start avoiding when within this distance
        
        if (distance < threshold) {
            // Transform point to torus local space for gradient calculation
            const localPoint = boid.pos.clone().sub(this.position);
            
            // Apply inverse rotation (around Y axis)
            const cosY = Math.cos(-this.rotation.y);
            const sinY = Math.sin(-this.rotation.y);
            const rotatedX = localPoint.x * cosY - localPoint.z * sinY;
            const rotatedZ = localPoint.x * sinY + localPoint.z * cosY;
            
            // Calculate analytical gradient in local space
            const distToCenter = Math.sqrt(rotatedX * rotatedX + rotatedZ * rotatedZ);
            
            if (distToCenter < 0.001) {
                // Special case: near the center axis - push radially outward
                const gradient = new THREE.Vector3(1, 0, 0);
                boid.vel.x += gradient.x * avoidanceStrength * 5.0;
                boid.vel.y += gradient.y * avoidanceStrength * 5.0;
                boid.vel.z += gradient.z * avoidanceStrength * 5.0;
                return;
            }
            
            const qx = distToCenter - this.majorRadius;
            const qy = localPoint.y;
            const tubeDistance = Math.sqrt(qx * qx + qy * qy);
            
            if (tubeDistance < 0.001) {
                // Special case: exactly on major circle - push radially
                const gradient = new THREE.Vector3(rotatedX / distToCenter, 0, rotatedZ / distToCenter);
                const gradWorldX = gradient.x * cosY + gradient.z * sinY;
                const gradWorldZ = -gradient.x * sinY + gradient.z * cosY;
                boid.vel.x += gradWorldX * avoidanceStrength * 5.0;
                boid.vel.z += gradWorldZ * avoidanceStrength * 5.0;
                return;
            }
            
            // Analytical gradient in local space
            const factor = qx / (distToCenter * tubeDistance);
            const gradLocalX = rotatedX * factor;
            const gradLocalZ = rotatedZ * factor;
            const gradLocalY = qy / tubeDistance;
            
            // Rotate gradient back to world space
            const gradWorldX = gradLocalX * cosY + gradLocalZ * sinY;
            const gradWorldZ = -gradLocalX * sinY + gradLocalZ * cosY;
            const gradWorldY = gradLocalY;
            
            const gradient = new THREE.Vector3(gradWorldX, gradWorldY, gradWorldZ);
            const gradLen = gradient.length();
            if (gradLen > 0.001) {
                gradient.normalize();
            } else {
                return;
            }
            
            // Much stronger avoidance when closer, especially when inside (distance < 0)
            let strength;
            if (distance < 0) {
                // Inside the solid - EMERGENCY EJECTION with exponential force
                const penetrationDepth = -distance;
                strength = avoidanceStrength * 10.0 * (1.0 + penetrationDepth * 2.0);
            } else if (distance < 1.0) {
                // Very close - strong repulsion
                strength = avoidanceStrength * 5.0 * (1.0 - distance);
            } else {
                // Outside but within detection range - gentle avoidance
                strength = avoidanceStrength * (threshold - distance) / threshold;
            }
            
            boid.vel.x += gradient.x * strength;
            boid.vel.y += gradient.y * strength;
            boid.vel.z += gradient.z * strength;
        }
    }
}

class CylinderObstacle {
    constructor(radius, height, position, rotation) {
        this.radius = radius;
        this.height = height;
        this.position = position.clone();
        this.rotation = rotation || { x: 0, y: 0, z: 0 };
        this.mesh = null;
        
        // Create the cylinder mesh
        this.createMesh();
    }
    
    createMesh() {
        // Create fluted column with true semicircular half-pipe grooves carved INTO surface
        const numFlutes = 16; // Number of vertical grooves
        const fluteDepth = 0.3; // Maximum depth to carve (not full radius)
        const fluteWidthFraction = 0.65; // Fraction of section to carve (leaves ridges between)
        const radialSegments = numFlutes * 16; // Very high segment count for smooth semicircles
        const heightSegments = 64; // Vertical segments for smooth fluting
        
        // Create custom geometry with flutes
        const geometry = new THREE.CylinderGeometry(
            this.radius, 
            this.radius, 
            this.height, 
            radialSegments, 
            heightSegments
        );
        
        // Modify vertices to carve perfect semicircular half-pipe grooves INTO the surface
        const positionAttribute = geometry.attributes.position;
        for (let i = 0; i < positionAttribute.count; i++) {
            const x = positionAttribute.getX(i);
            const y = positionAttribute.getY(i);
            const z = positionAttribute.getZ(i);
            
            // Calculate angle around cylinder
            let angle = Math.atan2(z, x);
            if (angle < 0) angle += Math.PI * 2; // Normalize to 0-2π
            const distFromCenter = Math.sqrt(x * x + z * z);
            
            // Only modify side vertices (not top/bottom caps)
            if (Math.abs(distFromCenter) > 0.01) {
                // Calculate position within flute array
                const flutePosition = (angle / (Math.PI * 2)) * numFlutes;
                const fluteFraction = flutePosition % 1.0; // 0-1 within current flute section
                
                let fluteOffset = 0;
                
                // Only carve in the center portion, leaving ridges at edges
                const ridgeWidth = (1.0 - fluteWidthFraction) / 2.0;
                
                if (fluteFraction >= ridgeWidth && fluteFraction <= (1.0 - ridgeWidth)) {
                    // We're in the groove area - create truly circular semicircular carved profile
                    // Normalize position within groove from 0 to 1
                    const normalizedGroovePos = (fluteFraction - ridgeWidth) / fluteWidthFraction;
                    
                    // Calculate arc length position on cylinder surface for this groove
                    const sectionArcAngle = (Math.PI * 2) / numFlutes; // Total angle per section
                    const grooveArcAngle = sectionArcAngle * fluteWidthFraction; // Angle just for groove
                    const arcPos = (normalizedGroovePos - 0.5) * grooveArcAngle; // -half to +half
                    
                    // Convert arc position to chord (straight-line) distance for circle equation
                    const chordDistance = distFromCenter * Math.sin(arcPos);
                    
                    // Calculate the width of the groove opening at the surface
                    const grooveOpeningWidth = distFromCenter * grooveArcAngle;
                    
                    // Now apply perfect circle equation with this chord distance
                    const x_pos = chordDistance / (grooveOpeningWidth / 2.0); // Normalize by half-width
                    
                    // Perfect semicircular profile: y = sqrt(1 - x²)
                    if (Math.abs(x_pos) <= 1.0) {
                        const y_circle = Math.sqrt(1.0 - x_pos * x_pos);
                        
                        // Carve depth: maximum at center, zero at edges
                        const carveDepth = y_circle * fluteDepth;
                        
                        // Apply NEGATIVE offset to carve INTO the surface
                        fluteOffset = -carveDepth;
                    }
                }
                // else: in ridge area, no carving (fluteOffset = 0)
                
                const newRadius = distFromCenter + fluteOffset;
                
                // Update position
                const normalizedX = x / distFromCenter;
                const normalizedZ = z / distFromCenter;
                positionAttribute.setX(i, normalizedX * newRadius);
                positionAttribute.setZ(i, normalizedZ * newRadius);
            }
        }
        
        // Recompute normals for proper lighting
        geometry.computeVertexNormals();
        
        var material = new THREE.MeshPhongMaterial({
            color: 0x5000ff, 
            shininess: 0, 
            transparent: false, 
            opacity: 1.0,
            flatShading: false // Smooth shading for better flute appearance
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.rotation.x = this.rotation.x;
        this.mesh.rotation.y = this.rotation.y;
        this.mesh.rotation.z = this.rotation.z;
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.userData.isDraggableCylinder = true; // Mark for mouse interaction
        this.mesh.userData.cylinderObstacle = this; // Reference back to this object
        gThreeScene.add(this.mesh);
    }
    
    // Check if a point is inside the cylinder
    // Returns distance to surface (negative if inside solid)
    getDistanceToSurface(point) {
        // Transform point to cylinder local space
        const localPoint = point.clone().sub(this.position);
        
        // Distance from cylinder axis (Y axis)
        const radialDist = Math.sqrt(localPoint.x * localPoint.x + localPoint.z * localPoint.z);
        
        // Distance from cylinder caps
        const halfHeight = this.height / 2;
        const verticalDist = Math.abs(localPoint.y) - halfHeight;
        
        // If inside the cylinder volume
        if (radialDist < this.radius && Math.abs(localPoint.y) < halfHeight) {
            // Distance to nearest surface (negative, inside)
            const distToWall = radialDist - this.radius;
            const distToCap = verticalDist;
            return Math.max(distToWall, distToCap); // Most negative = deepest inside
        }
        
        // Outside cylinder
        if (radialDist >= this.radius && Math.abs(localPoint.y) < halfHeight) {
            // Outside the sides
            return radialDist - this.radius;
        }
        
        if (radialDist < this.radius && Math.abs(localPoint.y) >= halfHeight) {
            // Outside the caps
            return verticalDist;
        }
        
        // Outside corner (diagonal distance)
        const edgeDist = radialDist - this.radius;
        return Math.sqrt(edgeDist * edgeDist + verticalDist * verticalDist);
    }
    
    // Apply avoidance force to a boid
    applyAvoidance(boid, avoidanceStrength = 1.5) {
        const distance = this.getDistanceToSurface(boid.pos);
        const threshold = 5.0; // Start avoiding when within this distance
        
        if (distance < threshold) {
            // Calculate avoidance direction
            const localPoint = boid.pos.clone().sub(this.position);
            const radialDist = Math.sqrt(localPoint.x * localPoint.x + localPoint.z * localPoint.z);
            const halfHeight = this.height / 2;
            
            const gradient = new THREE.Vector3(0, 0, 0);
            
            // Radial component (away from axis)
            if (radialDist > 0.001) {
                gradient.x = localPoint.x / radialDist;
                gradient.z = localPoint.z / radialDist;
            } else {
                // On the axis, push in any radial direction
                gradient.x = 1;
            }
            
            // Vertical component (away from caps)
            if (Math.abs(localPoint.y) > halfHeight - 1.0) {
                gradient.y = localPoint.y > 0 ? 1 : -1;
            }
            
            const gradLen = gradient.length();
            if (gradLen > 0.001) {
                gradient.normalize();
            } else {
                return;
            }
            
            // Much stronger avoidance when closer, especially when inside (distance < 0)
            let strength;
            if (distance < 0) {
                // Inside the solid - EMERGENCY EJECTION with exponential force
                const penetrationDepth = -distance;
                strength = avoidanceStrength * 10.0 * (1.0 + penetrationDepth * 2.0);
            } else if (distance < 1.0) {
                // Very close - strong repulsion
                strength = avoidanceStrength * 5.0 * (1.0 - distance);
            } else {
                // Outside but within detection range - gentle avoidance
                strength = avoidanceStrength * (threshold - distance) / threshold;
            }
            
            boid.vel.x += gradient.x * strength;
            boid.vel.y += gradient.y * strength;
            boid.vel.z += gradient.z * strength;
        }
    }
    
    // Update cylinder position
    updatePosition(newPosition) {
        this.position.copy(newPosition);
        if (this.mesh) {
            this.mesh.position.copy(newPosition);
        }
    }
}

var gObstacles = []; // Global array to hold all obstacles

class BOID {
    constructor(pos, rad, vel, hue, sat) {
        this.pos = pos.clone();
        this.rad = rad;
        this.vel = vel.clone();
        this.hue = hue;
        this.sat = sat;
        this.lightness = 50;
        this.grabbed = false;
        
        // Create front cone mesh
        var geometry = new THREE.ConeGeometry(rad, 3 * rad, 16, 16);
        var material = new THREE.MeshPhongMaterial({color: new THREE.Color(`hsl(${hue}, ${sat}%, 50%)`)});
        this.visMesh = new THREE.Mesh(geometry, material);
        this.visMesh.position.copy(pos);
        this.visMesh.userData = this;
        this.visMesh.layers.enable(1);
        this.visMesh.castShadow = true;
        this.visMesh.receiveShadow = true;
        gThreeScene.add(this.visMesh);

        // Create hemisphere at rear - using top half of sphere
        if (renderHemispheres) {
            var geometry2 = new THREE.SphereGeometry(rad, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
            var material2 = new THREE.MeshPhongMaterial({color: new THREE.Color("hsl(" + hue + ", " + sat + "%, 50%)")});
            this.visMesh2 = new THREE.Mesh(geometry2, material2);
            this.visMesh2.position.copy(pos);
            this.visMesh2.userData = this;
            this.visMesh2.layers.enable(1);
            this.visMesh2.castShadow = true;
            this.visMesh2.receiveShadow = true;
            gThreeScene.add(this.visMesh2);
        } else {
            this.visMesh2 = null;
        }
    }
    
    simulate() {
        if (this.grabbed) return;
        
        // Apply boundary turning forces
        var size = gPhysicsScene.worldSize;
        var margin = boidProps.margin;
        var turnFactor = boidProps.turnFactor;
        
        if (this.pos.x < -size.x + margin) {
            this.vel.x += turnFactor;
        }
        if (this.pos.x > size.x - margin) {
            this.vel.x -= turnFactor;
        }
        if (this.pos.z < -size.z + margin) {
            this.vel.z += turnFactor;
        }
        if (this.pos.z > size.z - margin) {
            this.vel.z -= turnFactor;
        }
        if (this.pos.y < margin) {
            this.vel.y += turnFactor;
        }
        if (this.pos.y > size.y - margin) {
            this.vel.y -= turnFactor;
        }
        
        // Enforce speed limits (both min and max)
        var speed = Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y + this.vel.z * this.vel.z);
        
        if (speed < boidProps.minSpeed && speed > 0) {
            // Speed up to minimum
            const scale = boidProps.minSpeed / speed;
            this.vel.x *= scale;
            this.vel.y *= scale;
            this.vel.z *= scale;
        } else if (speed > boidProps.maxSpeed) {
            // Slow down to maximum
            const scale = boidProps.maxSpeed / speed;
            this.vel.x *= scale;
            this.vel.y *= scale;
            this.vel.z *= scale;
        } else if (speed === 0) {
            // Give stopped boids a random initial velocity
            this.vel.x = (Math.random() - 0.5) * boidProps.minSpeed;
            this.vel.y = (Math.random() - 0.5) * boidProps.minSpeed;
            this.vel.z = (Math.random() - 0.5) * boidProps.minSpeed;
        }
        
        // Update position
        this.pos.x += this.vel.x * deltaT;
        this.pos.y += this.vel.y * deltaT;
        this.pos.z += this.vel.z * deltaT;
        
        // Update visual mesh position
        this.visMesh.position.copy(this.pos);
        
        // Orient cone to point in direction of movement
        speed = Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y + this.vel.z * this.vel.z);
        if (speed > 0.01) { // Only update orientation if moving
            const direction = new THREE.Vector3(this.vel.x, this.vel.y, this.vel.z).normalize();
            const up = new THREE.Vector3(0, 1, 0);
            
            // Create target point in direction of velocity
            const target = new THREE.Vector3(
                this.pos.x + direction.x,
                this.pos.y + direction.y,
                this.pos.z + direction.z
            );
            
            // Make front cone look at target (cone points along Y axis by default)
            this.visMesh.lookAt(target);
            // Adjust for cone's default upward orientation
            this.visMesh.rotateX(Math.PI / 2);
            
            // Position hemisphere at the flat base of the cone (back end)
            if (this.visMesh2) {
                // Cone base is at pos - direction * 1.5 * rad
                const hemisphereOffset = direction.clone().multiplyScalar(-1.5 * this.rad);
                this.visMesh2.position.copy(this.pos).add(hemisphereOffset);
                
                // Orient hemisphere to look backward (opposite of cone direction)
                const backwardTarget = new THREE.Vector3(
                    this.visMesh2.position.x - direction.x,
                    this.visMesh2.position.y - direction.y,
                    this.visMesh2.position.z - direction.z
                );
                this.visMesh2.lookAt(backwardTarget);
                this.visMesh2.rotateX(Math.PI / 2);
            }
        }
    }
    
    startGrab(pos) {
        this.grabbed = true;
        this.pos.copy(pos);
        this.visMesh.position.copy(pos);
        if (this.visMesh2) {
            this.visMesh2.position.copy(pos);
        }
    }
    
    moveGrabbed(pos, vel) {
        this.pos.copy(pos);
        this.visMesh.position.copy(pos);
        if (this.visMesh2) {
            this.visMesh2.position.copy(pos);
        }
    }
    
    endGrab(pos, vel) {
        this.grabbed = false;
        this.vel.copy(vel);
        this.visMesh.position.copy(this.pos);
        if (this.visMesh2) {
            this.visMesh2.position.copy(this.pos);
        }
    }
}

//  SPATIAL HASH GRID CLASS ---------------------------------------------------------------------
class SpatialHashGrid {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }
    // Convert position to grid key
    getKey(x, y, z) {
        const gridX = Math.floor(x / this.cellSize);
        const gridY = Math.floor(y / this.cellSize);
        const gridZ = Math.floor(z / this.cellSize);
        return `${gridX},${gridY},${gridZ}`;
    }
    // Clear the grid
    clear() {
        this.grid.clear();
    }
    // Add boid to grid (initial insertion)
    insert(boid) {
        const key = this.getKey(boid.pos.x, boid.pos.y, boid.pos.z);
        if (!this.grid.has(key)) {
            this.grid.set(key, []);
        }
        this.grid.get(key).push(boid);
        boid.gridKey = key; // Store current grid key on boid
    }
    // Update boid position in grid (incremental update)
    updateBoid(boid) {
        const newKey = this.getKey(boid.pos.x, boid.pos.y, boid.pos.z);
        // Only update if boid moved to a different cell
        if (boid.gridKey !== newKey) {
            // Remove from old cell
            if (boid.gridKey && this.grid.has(boid.gridKey)) {
                const oldCell = this.grid.get(boid.gridKey);
                const index = oldCell.indexOf(boid);
                if (index !== -1) {
                    // Use swap-and-pop for O(1) removal
                    oldCell[index] = oldCell[oldCell.length - 1];
                    oldCell.pop();
                    // Clean up empty cells to prevent memory bloat
                    if (oldCell.length === 0) {
                        this.grid.delete(boid.gridKey);
                    }
                }
            }
            // Add to new cell
            if (!this.grid.has(newKey)) {
                this.grid.set(newKey, []);
            }
            this.grid.get(newKey).push(boid);
            boid.gridKey = newKey;
        }
    }
    
    // Get nearby boids within range
    getNearby(boid, range) {
        const nearby = [];
        const gridX = Math.floor(boid.pos.x / this.cellSize);
        const gridY = Math.floor(boid.pos.y / this.cellSize);
        const gridZ = Math.floor(boid.pos.z / this.cellSize);
        const cellRange = Math.ceil(range / this.cellSize);
        
        // Check all cells within range
        for (let x = gridX - cellRange; x <= gridX + cellRange; x++) {
            for (let y = gridY - cellRange; y <= gridY + cellRange; y++) {
                for (let z = gridZ - cellRange; z <= gridZ + cellRange; z++) {
                    const key = `${x},${y},${z}`;
                    if (this.grid.has(key)) {
                        nearby.push(...this.grid.get(key));
                    }
                }
            }
        }
        return nearby;
    }
}

//  MAKE BOIDS------------------------------------------------------------------
function makeBoids() {
    const radius = boidRadius;
    const numBoids = 1500;
    let pos, vel, hue, sat;
    const spawnRadius = 3.5; // Radius of spherical spawn volume
    const minMargin = 0.2; // Minimum margin as multiple of radius
    const minDistance = 2 * radius * (1 + minMargin); // Minimum center-to-center distance
    const maxAttempts = 100; // Max attempts per boid to find valid position
    const spawnCenter = new THREE.Vector3(0, 4 * spawnRadius, 0); // Center of spawn sphere
    
    for (var i = 0; i < numBoids; i++) {
        let validPosition = false;
        let attempts = 0;
        while (!validPosition && attempts < maxAttempts) {
            // Generate random position within a sphere
            let theta = Math.random() * Math.PI * 2; // Azimuthal angle
            let phi = Math.acos(2 * Math.random() - 1); // Polar angle
            let r = Math.cbrt(Math.random()) * spawnRadius; // Cube root for uniform distribution
            pos = new THREE.Vector3(
                r * Math.sin(phi) * Math.cos(theta),
                4 * spawnRadius + r * Math.cos(phi), // Offset upward
                r * Math.sin(phi) * Math.sin(theta)
            );
            // Check if position overlaps with existing balls
            validPosition = true;
            for (let j = 0; j < gPhysicsScene.objects.length; j++) {
                const existingBall = gPhysicsScene.objects[j];
                const distSquared = pos.distanceToSquared(existingBall.pos);
                if (distSquared < minDistance * minDistance) {
                    validPosition = false;
                    break;
                }
            }
            attempts++;
        }
        // Only add boid if valid position found
        if (validPosition) {
            // Set velocity to point outward from spawn center
            vel = pos.clone().sub(spawnCenter).normalize();
            const speed = 1 + Math.random() * 4; // Random speed between 1 and 5
            vel.multiplyScalar(speed);
            
            if (i == 0) {
                hue = 220;
                sat = 90;
            }
            else if (i < 51) {
                hue = Math.round(100 + Math.random() * 40);
                sat = 90;
            } else {
                hue = Math.round(340 + Math.random() * 40);
                sat = Math.round(30 + Math.random() * 70); // 50% to 100% saturation
            }
            gPhysicsScene.objects.push(new BOID(pos, radius, vel, hue, sat) );
        }
    }
    console.log("Successfully spawned " + gPhysicsScene.objects.length + " boids out of " + numBoids + " requested");
}


//  HANDLE BOID RULES -------------
function handleBoidRules(boid) {
    let separationX = 0;
    let separationY = 0;
    let separationZ = 0;
    let avgVelX = 0;
    let avgVelY = 0;
    let avgVelZ = 0;
    let centerX = 0;
    let centerY = 0;
    let centerZ = 0;
    let neighborCount = 0;
    
    // Get nearby boids from spatial hash
    const nearbyBoids = SpatialGrid.getNearby(boid, boidProps.visualRange);
    const visualRangeSq = boidProps.visualRange * boidProps.visualRange;
    const minDistSq = boidProps.minDistance * boidProps.minDistance;
    const avoidFactor = boidProps.avoidFactor;
    
    // Use traditional for loop for better performance
    for (let i = 0; i < nearbyBoids.length; i++) {
        const otherBoid = nearbyBoids[i];
        if (otherBoid !== boid) {
            const dx = boid.pos.x - otherBoid.pos.x;
            const dy = boid.pos.y - otherBoid.pos.y;
            const dz = boid.pos.z - otherBoid.pos.z;
            const distSq = dx * dx + dy * dy + dz * dz;
            
            if (distSq < visualRangeSq && distSq > 0) {
                // Check if hues match (within threshold)
                const hueMatch = segregationMode === 0 || Math.abs(boid.hue - otherBoid.hue) < 50;
                
                // RULE #1 - SEPARATION
                if (distSq < minDistSq) {
                    const dist = Math.sqrt(distSq);
                    const strength = avoidFactor * (boidProps.minDistance - dist) / dist;
                    separationX += dx * strength;
                    separationY += dy * strength;
                    separationZ += dz * strength;
                }
                
                // RULE #2 - ALIGNMENT: accumulate velocities
                if (hueMatch) {
                    avgVelX += otherBoid.vel.x;
                    avgVelY += otherBoid.vel.y;
                    avgVelZ += otherBoid.vel.z;
                }
                
                // RULE #3 - COHESION: accumulate positions
                if (hueMatch) {
                    centerX += otherBoid.pos.x;
                    centerY += otherBoid.pos.y;
                    centerZ += otherBoid.pos.z;
                }

                if (hueMatch) {
                    neighborCount++;
                }
            }
        }
    }

    // OBSTACLE AVOIDANCE - Apply before other rules
    for (let i = 0; i < gObstacles.length; i++) {
        gObstacles[i].applyAvoidance(boid);
    }
    
    // RULE #1 - SEPARATION
    boid.vel.x += separationX;
    boid.vel.y += separationY;
    boid.vel.z += separationZ;
    
    if (neighborCount > 0) {
        // RULE #2 - ALIGNMENT
        const invNeighborCount = 1.0 / neighborCount;
        avgVelX *= invNeighborCount;
        avgVelY *= invNeighborCount;
        avgVelZ *= invNeighborCount;
        boid.vel.x += (avgVelX - boid.vel.x) * boidProps.matchingFactor;
        boid.vel.y += (avgVelY - boid.vel.y) * boidProps.matchingFactor;
        boid.vel.z += (avgVelZ - boid.vel.z) * boidProps.matchingFactor;
        
        // RULE #3 - COHESION
        centerX *= invNeighborCount;
        centerY *= invNeighborCount;
        centerZ *= invNeighborCount;
        boid.vel.x += (centerX - boid.pos.x) * boidProps.centeringFactor;
        boid.vel.y += (centerY - boid.pos.y) * boidProps.centeringFactor;
        boid.vel.z += (centerZ - boid.pos.z) * boidProps.centeringFactor;
    }
}


// ------------------------------------------------------------------
function simulate() {
    if (gPhysicsScene.paused)
        return;
        
    // Apply boid rules to all boids
    for (var i = 0; i < gPhysicsScene.objects.length; i++) {
        var boid = gPhysicsScene.objects[i];
        handleBoidRules(boid);
    }
    
    // Update positions and spatial grid
    for (var i = 0; i < gPhysicsScene.objects.length; i++) {
        var boid = gPhysicsScene.objects[i];
        boid.simulate();
        SpatialGrid.updateBoid(boid);
    }
    
    gGrabber.increaseTime(deltaT);
}

let res = 1024

// MENU DRAWING FUNCTIONS -------------------------------------------------------
function drawMainMenu() {
    const ctx = gOverlayCtx;
    
    // Use scaling similar to boids.js
    const cScale = Math.min(window.innerWidth, window.innerHeight) / 2.0;
    const ellipsisWorldX = 0.05;
    const ellipsisWorldY = 0.05;
    const ellipsisX = ellipsisWorldX * cScale;
    const ellipsisY = ellipsisWorldY * cScale;
    const dotRadius = 0.006 * cScale;
    const dotSpacing = 0.016 * cScale;
    
    // Always draw three dots for ellipsis (matching boids.js style)
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
    const itemWidth = 0.24 * menuScale;
    const padding = 0.02 * menuScale;
    const menuHeight = itemHeight + (padding * 2);
    const menuWidth = itemWidth + (padding * 2);
    
    const menuBaseX = ellipsisX + 0.08 * menuScale;
    const menuX = menuBaseX + mainMenuXOffset * menuScale;
    const menuY = ellipsisY - 0.04 * menuScale;
    
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
    
    // Draw Simulation menu item
    const itemX = menuX + padding;
    const itemY = menuY + padding;
    const iconSize = 0.06 * menuScale;
    
    ctx.beginPath();
    ctx.roundRect(itemX, itemY, itemWidth, itemHeight, cornerRadius * 0.5);
    ctx.fillStyle = menuVisible ? 'rgba(100, 150, 220, 0.3)' : 'rgba(38, 38, 38, 0.8)';
    ctx.fill();
    
    // Draw icon
    const iconX = itemX + itemWidth / 2;
    const iconY = itemY + itemHeight / 2;
    const iconColor = menuVisible ? 'rgba(230, 230, 230, 1.0)' : 'rgba(76, 76, 76, 1.0)';
    ctx.strokeStyle = iconColor;
    ctx.fillStyle = iconColor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    // Draw gear icon
    const gearRadius = iconSize * 0.6;
    ctx.save();
    ctx.translate(iconX, iconY);
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const outerR = gearRadius;
        const innerR = gearRadius * 0.7;
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
    ctx.arc(0, 0, gearRadius * 0.3, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();
    
    /*// Draw label
    ctx.font = `${0.025 * menuScale}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = iconColor;
    ctx.fillText('Simulation', iconX, itemY + itemHeight - padding);*/

    ctx.restore();
}

function drawSimMenu() {
    if (menuOpacity <= 0) return;
    
    const ctx = gOverlayCtx;
    const menuItems = [
        gPhysicsScene.objects.length, boidRadius, boidProps.visualRange,
        boidProps.avoidFactor, boidProps.matchingFactor, boidProps.centeringFactor,
        boidProps.maxSpeed, boidProps.turnFactor, boidProps.margin
    ];
    
    const ranges = [
        {min: 100, max: 5000},      // numBoids
        {min: 0.05, max: 0.5},      // boidRadius
        {min: 0.5, max: 10},        // visualRange
        {min: 0, max: 0.2},         // avoidFactor
        {min: 0, max: 0.2},         // matchingFactor
        {min: 0, max: 0.005},       // centeringFactor
        {min: 1.0, max: 15.0},      // maxSpeed
        {min: 0, max: 0.2},         // turnFactor
        {min: 0.5, max: 5.0}        // margin
    ];
    
    const knobRadius = 0.1 * menuScale;
    const knobSpacing = knobRadius * 3;
    const menuTopMargin = 0.2 * knobRadius;
    const menuWidth = knobSpacing * 2;
    const menuHeight = knobSpacing * 2 + knobRadius * 2.0;
    const padding = 1.7 * knobRadius;
    
    // Convert world coordinates to screen coordinates
    const menuUpperLeftX = menuX * window.innerWidth;
    const menuUpperLeftY = menuY * window.innerHeight;
    
    ctx.save();
    ctx.translate(menuUpperLeftX + knobSpacing, menuUpperLeftY + 0.5 * knobSpacing);
    
    // Draw menu background
    const cornerRadius = 8;
    ctx.beginPath();
    ctx.roundRect(-padding, -padding, menuWidth + padding * 2, menuHeight + padding * 2, cornerRadius);
    const menuGradient = ctx.createLinearGradient(0, -padding, 0, menuHeight + padding);
    menuGradient.addColorStop(0, `rgba(51, 85, 128, ${0.95 * menuOpacity})`);
    menuGradient.addColorStop(1, `rgba(13, 26, 38, ${0.95 * menuOpacity})`);
    ctx.fillStyle = menuGradient;
    ctx.fill();
    ctx.strokeStyle = `rgba(100, 150, 200, ${menuOpacity})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw title
    ctx.fillStyle = `rgba(200, 220, 240, ${menuOpacity})`;
    ctx.font = `bold ${0.05 * menuScale}px verdana`;
    ctx.textAlign = 'center';
    ctx.fillText('SIMULATION', menuWidth / 2, -padding + 0.05 * menuScale);
    
    // Draw close button
    const closeIconRadius = knobRadius * 0.25;
    const closeIconX = -padding + closeIconRadius + 0.2 * knobRadius;
    const closeIconY = -padding + closeIconRadius + 0.2 * knobRadius;
    ctx.beginPath();
    ctx.arc(closeIconX, closeIconY, closeIconRadius, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(180, 40, 40, ${menuOpacity})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(0, 0, 0, ${menuOpacity})`;
    ctx.lineWidth = 2;
    const xSize = closeIconRadius * 0.4;
    ctx.beginPath();
    ctx.moveTo(closeIconX - xSize, closeIconY - xSize);
    ctx.lineTo(closeIconX + xSize, closeIconY + xSize);
    ctx.moveTo(closeIconX + xSize, closeIconY - xSize);
    ctx.lineTo(closeIconX - xSize, closeIconY + xSize);
    ctx.stroke();
    
    // Draw knobs
    const fullMeterSweep = 1.6 * Math.PI;
    const meterStart = 0.5 * Math.PI + 0.5 * (2 * Math.PI - fullMeterSweep);
    
    for (let knob = 0; knob < menuItems.length; knob++) {
        const row = Math.floor(knob / 3);
        const col = knob % 3;
        const knobX = col * knobSpacing;
        const knobY = row * knobSpacing + menuTopMargin;
        
        // Draw knob background
        ctx.beginPath();
        ctx.arc(knobX, knobY, 1.05 * knobRadius, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(38, 51, 64, ${0.9 * menuOpacity})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(77, 102, 128, ${menuOpacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Calculate normalized value
        let knobValue = menuItems[knob];
        let normalizedValue = (knobValue - ranges[knob].min) / (ranges[knob].max - ranges[knob].min);
        normalizedValue = Math.max(0, Math.min(1, normalizedValue));
        
        // Draw meter arc
        const gradient = ctx.createLinearGradient(
            knobX + Math.cos(meterStart) * knobRadius,
            knobY + Math.sin(meterStart) * knobRadius,
            knobX + Math.cos(meterStart + fullMeterSweep) * knobRadius,
            knobY + Math.sin(meterStart + fullMeterSweep) * knobRadius
        );
        gradient.addColorStop(0, `rgba(77, 153, 179, ${menuOpacity})`);
        gradient.addColorStop(0.5, `rgba(77, 179, 153, ${menuOpacity})`);
        ctx.strokeStyle = gradient;
        ctx.beginPath();
        ctx.arc(knobX, knobY, knobRadius * 0.85, meterStart, meterStart + fullMeterSweep * normalizedValue);
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Draw needle
        const pointerAngle = meterStart + fullMeterSweep * normalizedValue;
        const pointerLength = knobRadius * 0.6;
        const pointerEndX = knobX + Math.cos(pointerAngle) * pointerLength;
        const pointerEndY = knobY + Math.sin(pointerAngle) * pointerLength;
        ctx.beginPath();
        ctx.moveTo(knobX, knobY);
        ctx.lineTo(pointerEndX, pointerEndY);
        ctx.strokeStyle = `rgba(200, 220, 240, ${menuOpacity})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw label
        const labels = [
            'Number', 'Size', 'Visual Range',
            'Separation', 'Alignment', 'Cohesion',
            'Speed Limit', 'Corralling Force', 'Corral Margin'
        ];
        ctx.font = `${0.35 * knobRadius}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `rgba(230, 240, 250, ${menuOpacity})`;
        ctx.fillText(labels[knob], knobX, knobY + 1.35 * knobRadius);
        
        // Draw value
        let valueText = '';
        switch (knob) {
            case 0: valueText = gPhysicsScene.objects.length; break;
            case 1: valueText = boidRadius.toFixed(2); break;
            case 2: valueText = boidProps.visualRange.toFixed(1); break;
            case 3: valueText = boidProps.avoidFactor.toFixed(3); break;
            case 4: valueText = boidProps.matchingFactor.toFixed(3); break;
            case 5: valueText = boidProps.centeringFactor.toFixed(4); break;
            case 6: valueText = boidProps.maxSpeed.toFixed(1); break;
            case 7: valueText = boidProps.turnFactor.toFixed(3); break;
            case 8: valueText = boidProps.margin.toFixed(1); break;
        }
        ctx.font = `${0.25 * knobRadius}px Arial`;
        ctx.fillStyle = `rgba(128, 230, 200, ${menuOpacity})`;
        ctx.fillText(valueText, knobX, knobY + 0.6 * knobRadius);
    }
    
    // Draw camera control note at the bottom
    ctx.font = `italic ${0.035 * menuScale}px verdana`;
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(180, 200, 220, ${menuOpacity})`;
    ctx.fillText('Spacebar to cycle camera', menuWidth / 2, menuHeight + padding * 0.4);
    ctx.fillText('Mouse to move and rotate', menuWidth / 2, menuHeight + padding * 0.7);
    
    ctx.restore();
}

// ------------------------------------------		
function initThreeScene() {
    gThreeScene = new THREE.Scene();
    
    // Get or create container element
    container = document.getElementById('container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'container';
        document.body.appendChild(container);
    }
    
    // Lights
    gThreeScene.add( new THREE.AmbientLight( 0x505050 ) );	
    
    //gThreeScene.fog = new THREE.Fog( 0xaaaaaa, 10, 100 );				

    // ===== LAMP 1 =====
    // Function to create a lamp assembly
    function createLamp(lightPosition, lightTarget, lampId) {
        var lamp = {};
        
        // Create lamp rotatable group
        lamp.rotatableGroup = new THREE.Group();
        
        lamp.spotlight = new THREE.SpotLight( 0xffffff );
        lamp.spotlight.angle = Math.PI / 6;
        lamp.spotlight.penumbra = 0.2;
        lamp.spotlight.position.copy(lightPosition);
        lamp.spotlight.castShadow = true;
        lamp.spotlight.shadow.camera.near = 0.5;
        lamp.spotlight.shadow.camera.far = 70;
        lamp.spotlight.shadow.mapSize.width = res;
        lamp.spotlight.shadow.mapSize.height = res;
        lamp.spotlight.target.position.copy(lightTarget);
        gThreeScene.add(lamp.spotlight.target);
        gThreeScene.add( lamp.spotlight );
        
        // Position pole directly under the light position
        var poleBasePosition = new THREE.Vector3(lightPosition.x, 0, lightPosition.z);
        
        // Store pivot point (pin center)
        var poleHeight = lightPosition.y - 0.3;
        lamp.initialHeight = poleHeight;
        var discRadius = 0.25;
        lamp.pivot = new THREE.Vector3(poleBasePosition.x, poleHeight + 0.9 * discRadius, poleBasePosition.z);
        
        // Add hollow cone visual at spotlight source (lamp shield)
        var coneHeight = 1.5;
        var coneRadius = Math.tan(lamp.spotlight.angle) * coneHeight;
        var coneGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, 32, 1, true);
        
        // Outer cone - normal yellow
        var outerConeMaterial = new THREE.MeshPhongMaterial({
            color: 0xffff00,
            side: THREE.FrontSide,
            shininess: 30,
            colorWrite: true,
            depthWrite: true
        });
        var spotlightCone = new THREE.Mesh(coneGeometry, outerConeMaterial);
        spotlightCone.userData.isLampCone = true;
        spotlightCone.userData.lampId = lampId;
        spotlightCone.renderOrder = 1; // Render cone after discs to use depth buffer
        // Orient cone to point away from spotlight target (backwards like a lamp shield)
        var direction = lightPosition.clone().sub(lightTarget).normalize();
        var up = new THREE.Vector3(0, 1, 0);
        spotlightCone.quaternion.setFromUnitVectors(up, direction);
        // Position cone offset from light so pivot discs/pin remain visible
        var coneOffset = direction.clone().multiplyScalar(coneHeight * 0.4);
        spotlightCone.position.copy(lightPosition).sub(coneOffset);
        lamp.rotatableGroup.add(spotlightCone);
        
        // Store initial position and orientation for absolute rotation calculations
        spotlightCone.userData.initialPosition = spotlightCone.position.clone();
        spotlightCone.userData.initialQuaternion = spotlightCone.quaternion.clone();
        
        // Inner cone - bright white
        var innerConeMaterial = new THREE.MeshPhongMaterial({
            color: 0xffff00,
            side: THREE.BackSide,
            shininess: 30,
            emissive: 0xffffee,
            emissiveIntensity: 0.8,
            colorWrite: true,
            depthWrite: true
        });
        lamp.innerCone = new THREE.Mesh(coneGeometry, innerConeMaterial);
        lamp.innerCone.userData.isLampCone = true;
        lamp.innerCone.userData.lampId = lampId;
        lamp.innerCone.renderOrder = 1; // Render cone after discs to use depth buffer
        lamp.innerCone.quaternion.setFromUnitVectors(up, direction);
        // Position cone offset from light so pivot discs/pin remain visible
        lamp.innerCone.position.copy(lightPosition).sub(coneOffset);
        lamp.rotatableGroup.add(lamp.innerCone);
        
        // Store initial position and orientation
        lamp.innerCone.userData.initialPosition = lamp.innerCone.position.clone();
        lamp.innerCone.userData.initialQuaternion = lamp.innerCone.quaternion.clone();
        
        // Add bright white sphere to represent light source
        var lightBulbGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        var lightBulbMaterial = new THREE.MeshBasicMaterial({color: 0xffffff});
        lamp.bulb = new THREE.Mesh(lightBulbGeometry, lightBulbMaterial);
        // Position bulb inside the cone (offset toward target)
        lamp.bulb.position.copy(lightPosition).sub(coneOffset.clone().multiplyScalar(0.5));
        lamp.rotatableGroup.add(lamp.bulb);
        
        // Store initial position
        lamp.bulb.userData.initialPosition = lamp.bulb.position.clone();
        lamp.bulb.userData.initialQuaternion = new THREE.Quaternion();
        
        // Add the rotatable group to scene
        gThreeScene.add(lamp.rotatableGroup);
        
        // Add lamp pole (tall slender cylinder from light to ground)
        var poleRadius = 0.08;
        var poleGeometry = new THREE.CylinderGeometry(poleRadius, poleRadius, poleHeight, 16);
        var poleMaterial = new THREE.MeshPhongMaterial({color: 0x333333, shininess: 50});
        lamp.pole = new THREE.Mesh(poleGeometry, poleMaterial);
        lamp.pole.position.set(poleBasePosition.x, poleHeight / 2, poleBasePosition.z);
        lamp.pole.castShadow = true;
        lamp.pole.receiveShadow = true;
        lamp.pole.userData.isLampRotation = true;
        lamp.pole.userData.lampId = lampId;
        lamp.pole.renderOrder = 0; // Render before cone so cone can occlude it
        gThreeScene.add(lamp.pole);
        
        // Add invisible larger cylinder around pole for easier clicking
        var poleHitAreaRadius = poleRadius * 4;
        var poleHitGeometry = new THREE.CylinderGeometry(poleHitAreaRadius, poleHitAreaRadius, poleHeight, 8);
        var poleHitMaterial = new THREE.MeshBasicMaterial({visible: false});
        var poleHitArea = new THREE.Mesh(poleHitGeometry, poleHitMaterial);
        poleHitArea.position.set(poleBasePosition.x, poleHeight / 2, poleBasePosition.z);
        poleHitArea.userData.isLampRotation = true;
        poleHitArea.userData.lampId = lampId;
        gThreeScene.add(poleHitArea);
        
        // Add yellow sleeve where pole connects to lamp shade
        var sleeveHeight = 1.0;
        var sleeveRadius = poleRadius * 1.8;
        var sleeveGeometry = new THREE.CylinderGeometry(sleeveRadius, sleeveRadius, sleeveHeight, 16);
        var sleeveMaterial = new THREE.MeshPhongMaterial({color: 0xcc9900, shininess: 30});
        lamp.sleeve = new THREE.Mesh(sleeveGeometry, sleeveMaterial);
        lamp.sleeve.position.set(poleBasePosition.x, poleHeight - 0.5 * sleeveHeight, poleBasePosition.z);
        lamp.sleeve.castShadow = true;
        lamp.sleeve.receiveShadow = true;
        lamp.sleeve.userData.isLampHeight = true;
        lamp.sleeve.userData.lampId = lampId;
        lamp.sleeve.renderOrder = 0; // Render before cone so cone can occlude it
        gThreeScene.add(lamp.sleeve);

        // Add discs at top of pole for lamp angle adjustment
        lamp.discs = [];
        var discThickness = 0.12;
        var discGeometry = new THREE.CylinderGeometry(discRadius, discRadius, discThickness, 16);
        var discMaterial = new THREE.MeshPhongMaterial({color: 0xcc9900, shininess: 30});
        var disc = new THREE.Mesh(discGeometry, discMaterial);
        disc.position.set(poleBasePosition.x + 0.05, poleHeight + 0.9 * discRadius, poleBasePosition.z - 0.05);
        disc.rotation.y = Math.PI * 1.25;
        disc.rotation.z = Math.PI / 2;
        disc.castShadow = true;
        disc.receiveShadow = true;
        gThreeScene.add(disc);
        lamp.discs.push(disc);

        // Add second disc at top of pole for lamp angle adjustment
        var disc2 = new THREE.Mesh(discGeometry, discMaterial);
        disc2.position.set(poleBasePosition.x - 0.05, poleHeight + 0.9 * discRadius, poleBasePosition.z + 0.05);
        disc2.rotation.y = Math.PI * 1.25;
        disc2.rotation.z = Math.PI / 2;
        disc2.castShadow = true;
        disc2.receiveShadow = true;
        gThreeScene.add(disc2);
        lamp.discs.push(disc2);

        // Add pin through center discs
        var pinHeight = 0.3;
        var pinRadius = 0.05;
        var pinGeometry = new THREE.CylinderGeometry(pinRadius, pinRadius, pinHeight, 16);
        var pinMaterial = new THREE.MeshPhongMaterial({color: 0x888888, shininess: 80});
        lamp.pin = new THREE.Mesh(pinGeometry, pinMaterial);
        lamp.pin.position.set(poleBasePosition.x, poleHeight + 0.9 * discRadius, poleBasePosition.z);
        lamp.pin.rotation.x = Math.PI * 1.5;
        lamp.pin.rotation.z = Math.PI * 0.75;
        lamp.pin.castShadow = true;
        lamp.pin.receiveShadow = true;
        gThreeScene.add(lamp.pin);
        
        // Calculate pin axis for lamp rotation
        lamp.pinAxis = new THREE.Vector3(0, 1, 0);
        var pinRotationMatrix = new THREE.Matrix4();
        pinRotationMatrix.makeRotationFromEuler(new THREE.Euler(lamp.pin.rotation.x, lamp.pin.rotation.y, lamp.pin.rotation.z, 'XYZ'));
        lamp.pinAxis.applyMatrix4(pinRotationMatrix);
        lamp.pinAxis.normalize();
       
        // Add pedestal base (circular disc on ground, off-center for balance)
        var pedestalRadius = 1.5;
        var pedestalHeight = 0.15;
        var pedestalGeometry = new THREE.CylinderGeometry(pedestalRadius, pedestalRadius, pedestalHeight, 32);
        var pedestalMaterial = new THREE.MeshPhongMaterial({color: 0x444444, shininess: 30});
        lamp.basePlate = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
        // Position pedestal off-center so pole connects at edge, bringing center of gravity inward
        var offsetDistance = pedestalRadius * 0.4;
        lamp.basePlate.position.set(poleBasePosition.x - offsetDistance, pedestalHeight / 2, poleBasePosition.z - offsetDistance);
        lamp.basePlate.castShadow = true;
        lamp.basePlate.receiveShadow = true;
        lamp.basePlate.userData.isLampBase = true;
        lamp.basePlate.userData.lampId = lampId;
        gThreeScene.add(lamp.basePlate);
        
        // Store base center for lamp assembly rotation
        lamp.baseCenter = new THREE.Vector3(poleBasePosition.x - offsetDistance, 0, poleBasePosition.z - offsetDistance);
        
        return lamp;
    }
    
    // Create lamp 1
    var lamp1 = createLamp(
        new THREE.Vector3(22.61, 14.14, 18.58),
        new THREE.Vector3(16.16, 10.07, 12.13),
        1
    );
    gLampRotatableGroup = lamp1.rotatableGroup;
    gSpotLight = lamp1.spotlight;
    gLampPivot = lamp1.pivot;
    window.gPinRotationAxis = lamp1.pinAxis;
    gLampPole = lamp1.pole;
    gLampSleeve = lamp1.sleeve;
    gLampDiscs = lamp1.discs;
    gLampPin = lamp1.pin;
    gLampBasePlate = lamp1.basePlate;
    gLampBaseCenter = lamp1.baseCenter;
    gLampBulb = lamp1.bulb;
    gLampInnerCone = lamp1.innerCone;
    gInitialLampHeight = lamp1.initialHeight;

    // Directional Overhead Light
    var dirLight = new THREE.DirectionalLight( 0x55505a, 1 );
    dirLight.position.set( 0, 20, 0 );
    dirLight.castShadow = true;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 30;

    dirLight.shadow.camera.right = WORLD_WIDTH;  // Match room width
    dirLight.shadow.camera.left = -WORLD_WIDTH;
    dirLight.shadow.camera.top	= WORLD_DEPTH;   // Match room depth
    dirLight.shadow.camera.bottom = -WORLD_DEPTH;

    dirLight.shadow.mapSize.width = res;
    dirLight.shadow.mapSize.height = res;
    gThreeScene.add( dirLight );
    
    // Floor ground with checkerboard pattern
    var canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    var ctx = canvas.getContext('2d');
    
    // Draw checkerboard
    var tileSize = 128;
    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {
            ctx.fillStyle = (i + j) % 2 === 0 ? '#cccccc' : '#3d3d3d';
            ctx.fillRect(i * tileSize, j * tileSize, tileSize, tileSize);
        }
    }
    
    var checkerTexture = new THREE.CanvasTexture(canvas);
    checkerTexture.wrapS = THREE.RepeatWrapping;
    checkerTexture.wrapT = THREE.RepeatWrapping;
    // Calculate tile repeat based on world dimensions (each tile is 4 units)
    var tilesWide = (WORLD_WIDTH * 2) / 4;
    var tilesDeep = (WORLD_DEPTH * 2) / 4;
    checkerTexture.repeat.set(tilesWide, tilesDeep);
    
    var ground = new THREE.Mesh(
        new THREE.PlaneGeometry(WORLD_WIDTH * 2, WORLD_DEPTH * 2, 1, 1),
        new THREE.MeshPhongMaterial({ 
            map: checkerTexture,
            shininess: 150 
        })
    );				

    ground.rotation.x = - Math.PI / 2; // rotates X/Y to X/Z
    ground.receiveShadow = true;
    ground.position.set(0, 0, 0);
    gThreeScene.add( ground );
    
    var gridHelper = new THREE.GridHelper( 84, 30, 0x888888, 0x888888 );
    gridHelper.material.opacity = 1.0;
    gridHelper.material.transparent = true;
    gridHelper.position.set(0, 0.01, 0);
    //gThreeScene.add( gridHelper );	
    
    // Add transparent boundary walls
    var boxSize = gPhysicsScene.worldSize;
    var wallOpacity = 0.5;
    
    // Front wall (positive Z) - pastel pink checkerboard
    var frontWallCanvas = document.createElement('canvas');
    frontWallCanvas.width = 1024;
    frontWallCanvas.height = 1024;
    var frontWallCtx = frontWallCanvas.getContext('2d');
    var wallTileSize = 512;
    for (var i = 0; i < 2; i++) {
        for (var j = 0; j < 2; j++) {
            frontWallCtx.fillStyle = (i + j) % 2 === 0 ? '#FF8A94' : '#FFE8EB';
            frontWallCtx.fillRect(i * wallTileSize, j * wallTileSize, wallTileSize, wallTileSize);
        }
    }
    var frontWallTexture = new THREE.CanvasTexture(frontWallCanvas);
    frontWallTexture.wrapS = THREE.RepeatWrapping;
    frontWallTexture.wrapT = THREE.RepeatWrapping;
    frontWallTexture.repeat.set((boxSize.x * 2) / (4 * 5), boxSize.y / (4 * 5));
    
    var frontWall = new THREE.Mesh(
        new THREE.PlaneGeometry(boxSize.x * 2, boxSize.y),
        new THREE.MeshPhongMaterial({ 
            map: frontWallTexture,
            transparent: true, 
            opacity: 0.3,
            side: THREE.BackSide
        })
    );
    frontWall.position.set(0, boxSize.y / 2, boxSize.z);
    frontWall.receiveShadow = true;
    gThreeScene.add(frontWall);
    
    // Back wall (negative Z) - pastel blue checkerboard
    var backWallCanvas = document.createElement('canvas');
    backWallCanvas.width = 1024;
    backWallCanvas.height = 1024;
    var backWallCtx = backWallCanvas.getContext('2d');
    for (var i = 0; i < 2; i++) {
        for (var j = 0; j < 2; j++) {
            backWallCtx.fillStyle = (i + j) % 2 === 0 ? '#8AC8FF' : '#E8F4FF';
            backWallCtx.fillRect(i * wallTileSize, j * wallTileSize, wallTileSize, wallTileSize);
        }
    }
    var backWallTexture = new THREE.CanvasTexture(backWallCanvas);
    backWallTexture.wrapS = THREE.RepeatWrapping;
    backWallTexture.wrapT = THREE.RepeatWrapping;
    backWallTexture.repeat.set((boxSize.x * 2) / (4 * 5), boxSize.y / (4 * 5));
    
    var backWall = new THREE.Mesh(
        new THREE.PlaneGeometry(boxSize.x * 2, boxSize.y),
        new THREE.MeshPhongMaterial({ 
            map: backWallTexture,
            transparent: true, 
            opacity: 0.3,
            side: THREE.BackSide
        })
    );
    backWall.rotation.y = Math.PI;
    backWall.position.set(0, boxSize.y / 2, -boxSize.z);
    backWall.receiveShadow = true;
    gThreeScene.add(backWall);
    
    // Left wall (negative X) - pastel yellow checkerboard
    var leftWallCanvas = document.createElement('canvas');
    leftWallCanvas.width = 1024;
    leftWallCanvas.height = 1024;
    var leftWallCtx = leftWallCanvas.getContext('2d');
    for (var i = 0; i < 2; i++) {
        for (var j = 0; j < 2; j++) {
            leftWallCtx.fillStyle = (i + j) % 2 === 0 ? '#FFFF8A' : '#FFFFE8';
            leftWallCtx.fillRect(i * wallTileSize, j * wallTileSize, wallTileSize, wallTileSize);
        }
    }
    var leftWallTexture = new THREE.CanvasTexture(leftWallCanvas);
    leftWallTexture.wrapS = THREE.RepeatWrapping;
    leftWallTexture.wrapT = THREE.RepeatWrapping;
    leftWallTexture.repeat.set((boxSize.z * 2) / (4 * 5), boxSize.y / (4 * 5));
    
    var leftWall = new THREE.Mesh(
        new THREE.PlaneGeometry(boxSize.z * 2, boxSize.y),
        new THREE.MeshPhongMaterial({
            map: leftWallTexture,
            transparent: true, 
            opacity: 0.3,
            side: THREE.BackSide
        })
    );
    leftWall.rotation.y = -Math.PI / 2;
    leftWall.position.set(-boxSize.x, boxSize.y / 2, 0);
    leftWall.receiveShadow = true;
    gThreeScene.add(leftWall);
    
    // Right wall (positive X) - pastel green checkerboard
    var rightWallCanvas = document.createElement('canvas');
    rightWallCanvas.width = 1024;
    rightWallCanvas.height = 1024;
    var rightWallCtx = rightWallCanvas.getContext('2d');
    for (var i = 0; i < 2; i++) {
        for (var j = 0; j < 2; j++) {
            rightWallCtx.fillStyle = (i + j) % 2 === 0 ? '#8AFFAD' : '#E8FFE8';
            rightWallCtx.fillRect(i * wallTileSize, j * wallTileSize, wallTileSize, wallTileSize);
        }
    }
    var rightWallTexture = new THREE.CanvasTexture(rightWallCanvas);
    rightWallTexture.wrapS = THREE.RepeatWrapping;
    rightWallTexture.wrapT = THREE.RepeatWrapping;
    rightWallTexture.repeat.set((boxSize.z * 2) / (4 * 5), boxSize.y / (4 * 5));
    
    var rightWall = new THREE.Mesh(
        new THREE.PlaneGeometry(boxSize.z * 2, boxSize.y),
        new THREE.MeshPhongMaterial({ 
            map: rightWallTexture,
            transparent: true, 
            opacity: 0.3,
            side: THREE.BackSide
        })
    );
    rightWall.rotation.y = Math.PI / 2;
    rightWall.position.set(boxSize.x, boxSize.y / 2, 0);
    rightWall.receiveShadow = true;
    gThreeScene.add(rightWall);
    
    /*// Top wall - pastel lavender
    var topWall = new THREE.Mesh(
        new THREE.PlaneGeometry(boxSize.x * 2, boxSize.z * 2),
        new THREE.MeshPhongMaterial({ 
            color: 0xE0BBE4, 
            transparent: true, 
            opacity: wallOpacity,
            side: THREE.DoubleSide
        })
    );
    topWall.rotation.x = Math.PI / 2;
    topWall.position.set(0, boxSize.y, 0);
    gThreeScene.add(topWall);*/
    
    /* DISABLED: Load and add ceiling image (Sistine Chapel)
    var textureLoader = new THREE.TextureLoader();
    textureLoader.load(
        'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/image_sistine.jpg',
        function(texture) {
            // Success callback
            console.log('Ceiling texture loaded successfully');
            
            // Rotate texture 90 degrees and mirror
            texture.center.set(0.5, 0.5);
            texture.rotation = Math.PI / 2;
            texture.wrapS = THREE.RepeatWrapping;
            texture.repeat.x = -1;  // Just mirror, let geometry handle stretching
            
            // Create barrel vault ceiling (half cylinder)
            // worldSize defined by WORLD_WIDTH, WORLD_HEIGHT, WORLD_DEPTH constants
            // Vault runs along X axis (long dimension), curves across Z axis (depth)
            var vaultRadius = boxSize.z;  // Radius = 15 so diameter = 30 matches room depth
            var vaultLength = boxSize.x * 2;  // Length = 84 to span full room width
            
            var vaultGeometry = new THREE.CylinderGeometry(
                vaultRadius, vaultRadius, vaultLength, 
                64, 1,  // More segments for smoother curve
                true,  // Open ended
                0, Math.PI  // Top half of cylinder
            );
            
            var ceilingMaterial = new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.BackSide  // Visible from inside looking up
            });
            var ceiling = new THREE.Mesh(vaultGeometry, ceilingMaterial);
            
            // Rotate 90 degrees around Z to make cylinder run along X axis
            ceiling.rotation.z = Math.PI / 2;
            
            // Position so vault edges sit exactly on wall tops
            // Center at wall height so radius extends down to walls
            ceiling.position.set(0, boxSize.y, 0);
            
            gThreeScene.add(ceiling);
        },
        undefined,
        function(error) {
            // Error callback
            console.error('Error loading ceiling texture:', error);
        }
    );
    */
    
    // Add white edge lines
    var edgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 1 });
    
    // Bottom edges - slightly above ground to avoid z-fighting with grid
    var edgeOffset = 0.04;
    var bottomEdges = [
        [new THREE.Vector3(-boxSize.x, edgeOffset, -boxSize.z), new THREE.Vector3(boxSize.x, edgeOffset, -boxSize.z)],
        [new THREE.Vector3(boxSize.x, edgeOffset, -boxSize.z), new THREE.Vector3(boxSize.x, edgeOffset, boxSize.z)],
        [new THREE.Vector3(boxSize.x, edgeOffset, boxSize.z), new THREE.Vector3(-boxSize.x, edgeOffset, boxSize.z)],
        [new THREE.Vector3(-boxSize.x, edgeOffset, boxSize.z), new THREE.Vector3(-boxSize.x, edgeOffset, -boxSize.z)]
    ];
    
    // Top edges
    var topEdges = [
        [new THREE.Vector3(-boxSize.x, boxSize.y, -boxSize.z), new THREE.Vector3(boxSize.x, boxSize.y, -boxSize.z)],
        [new THREE.Vector3(boxSize.x, boxSize.y, -boxSize.z), new THREE.Vector3(boxSize.x, boxSize.y, boxSize.z)],
        [new THREE.Vector3(boxSize.x, boxSize.y, boxSize.z), new THREE.Vector3(-boxSize.x, boxSize.y, boxSize.z)],
        [new THREE.Vector3(-boxSize.x, boxSize.y, boxSize.z), new THREE.Vector3(-boxSize.x, boxSize.y, -boxSize.z)]
    ];
    
    // Vertical edges - start from edgeOffset instead of 0
    var verticalEdges = [
        [new THREE.Vector3(-boxSize.x, edgeOffset, -boxSize.z), new THREE.Vector3(-boxSize.x, boxSize.y, -boxSize.z)],
        [new THREE.Vector3(boxSize.x, edgeOffset, -boxSize.z), new THREE.Vector3(boxSize.x, boxSize.y, -boxSize.z)],
        [new THREE.Vector3(boxSize.x, edgeOffset, boxSize.z), new THREE.Vector3(boxSize.x, boxSize.y, boxSize.z)],
        [new THREE.Vector3(-boxSize.x, edgeOffset, boxSize.z), new THREE.Vector3(-boxSize.x, boxSize.y, boxSize.z)]
    ];
    
    // Create and add all edge lines
    var allEdges = bottomEdges.concat(topEdges, verticalEdges);
    for (var i = 0; i < allEdges.length; i++) {
        var geometry = new THREE.BufferGeometry().setFromPoints(allEdges[i]);
        var line = new THREE.Line(geometry, edgeMaterial);
        gThreeScene.add(line);
    }

    /*// Create torus obstacle
    var torusObstacle = new TorusObstacle(
        5,  // major radius
        1,  // minor radius (tube radius)
        new THREE.Vector3(10, 10, 0),  // position
        { x: 0, y: 0.5 * Math.PI, z: 0 }  // rotation
    );
    gObstacles.push(torusObstacle);*/

    // Create cylinder obstacle
    var cylinderObstacle = new CylinderObstacle(
        3,  // radius
        20,  // height
        new THREE.Vector3(10, 10, -10),  // position
        { x: 0, y: 0, z: 0 }  // rotation
    );
    gObstacles.push(cylinderObstacle);
    
    // Renderer
    gRenderer = new THREE.WebGLRenderer();
    gRenderer.shadowMap.enabled = true;
    gRenderer.setPixelRatio( window.devicePixelRatio );
    gRenderer.setSize( 0.8 * window.innerWidth, 0.8 * window.innerHeight );
    window.addEventListener( 'resize', onWindowResize, false );
    container.appendChild( gRenderer.domElement );
    
    // Camera	
    gCamera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.01, 1000);
    gCamera.position.set(9.72, 18.59, 38.02);
    gCamera.updateMatrixWorld();	

    gThreeScene.add(gCamera);

    gCameraControl = new THREE.OrbitControls(gCamera, gRenderer.domElement);
    gCameraControl.target.set(0.14, 4.59, -0.14);
    gCameraControl.zoomSpeed = 0.3;
    gCameraControl.panSpeed = 0.5;
    gCameraControl.update(); // Initialize OrbitControls state

    // Create overlay canvas for buttons programmatically
    gOverlayCanvas = document.createElement('canvas');
    gOverlayCanvas.style.position = 'absolute';
    gOverlayCanvas.style.top = '0';
    gOverlayCanvas.style.left = '0';
    gOverlayCanvas.style.pointerEvents = 'none';
    gOverlayCanvas.style.zIndex = '100';
    gOverlayCanvas.width = window.innerWidth;
    gOverlayCanvas.height = window.innerHeight;
    gOverlayCtx = gOverlayCanvas.getContext('2d');
    document.body.appendChild(gOverlayCanvas);
    
    // Add keyboard listener for camera mode cycling
    window.addEventListener('keydown', function(evt) {
        if (evt.key === ' ') {
            evt.preventDefault(); // Prevent page scrolling
            var previousMode = gCameraMode;
            gCameraMode = (gCameraMode + 1) % 5; // Cycle through 0, 1, 2, 3, 4
            gCameraManualControl = false;
            gCameraOffset.set(0, 0, 0);
            gCameraRotationOffset.theta = 0;
            gCameraRotationOffset.phi = 0;
            
            // Reset rotation speed when entering/leaving rotation modes
            if (gCameraMode === 1) {
                gCameraRotationSpeed = 0.1; // Rotate CCW
                // Save camera state when entering rotation from static mode
                if (previousMode === 0) {
                    gSavedCameraPosition = gCamera.position.clone();
                    gSavedCameraTarget = gCameraControl.target.clone();
                }
                gCameraControl.enabled = true;
                gCameraControl.update(); // Sync OrbitControls with current camera state
                console.log('Camera mode: ROTATE CCW');
            } else if (gCameraMode === 2) {
                gCameraRotationSpeed = -0.1; // Rotate CW
                // Save camera state when entering rotation from static mode
                if (previousMode === 0) {
                    gSavedCameraPosition = gCamera.position.clone();
                    gSavedCameraTarget = gCameraControl.target.clone();
                }
                gCameraControl.enabled = true;
                gCameraControl.update(); // Sync OrbitControls with current camera state
                console.log('Camera mode: ROTATE CW');
            } else if (gCameraMode === 0) {
                gCameraRotationSpeed = 0; // Static
                // Restore camera state when returning to static mode
                if (gSavedCameraPosition && gSavedCameraTarget) {
                    gCamera.position.copy(gSavedCameraPosition);
                    gCameraControl.target.copy(gSavedCameraTarget);
                }
                gCameraControl.enabled = true;
                gCameraControl.update(); // Sync OrbitControls with current camera state
                console.log('Camera mode: STATIC');
            } else {
                gCameraRotationSpeed = 0; // Stop rotation for first-person modes
                // Entering first-person mode - save current camera state
                if (previousMode < 3) {
                    gSavedCameraPosition = gCamera.position.clone();
                    gSavedCameraTarget = gCameraControl.target.clone();
                }
                gCameraControl.enabled = false; // Disable orbit controls in first-person
                console.log('Camera mode: ' + (gCameraMode === 3 ? 'BEHIND BOID' : 'IN FRONT OF BOID'));
            }
        }
        
        if (evt.key === 'm' || evt.key === 'M') {
            mainMenuVisible = !mainMenuVisible;
        }
        
        if (evt.key === 'c' || evt.key === 'C') {
            // Log current camera configuration
            console.log('=== CAMERA CONFIGURATION DATA ===');
            console.log('');
            console.log('CAMERA:');
            console.log('  position: gCamera.position.set(' + 
                gCamera.position.x.toFixed(2) + ', ' + 
                gCamera.position.y.toFixed(2) + ', ' + 
                gCamera.position.z.toFixed(2) + ')');
            console.log('  target: gCameraControl.target.set(' + 
                gCameraControl.target.x.toFixed(2) + ', ' + 
                gCameraControl.target.y.toFixed(2) + ', ' + 
                gCameraControl.target.z.toFixed(2) + ')');
            console.log('');
            console.log('=================================');
        }
        
        if (evt.key === 'l' || evt.key === 'L') {
            // Log current lamp configurations
            console.log('=== LAMP CONFIGURATION DATA ===');
            console.log('');
            console.log('LAMP 1:');
            console.log('  lightPosition: new THREE.Vector3(' + 
                gSpotLight.position.x.toFixed(2) + ', ' + 
                gSpotLight.position.y.toFixed(2) + ', ' + 
                gSpotLight.position.z.toFixed(2) + ')');
            console.log('  lightTarget: new THREE.Vector3(' + 
                gSpotLight.target.position.x.toFixed(2) + ', ' + 
                gSpotLight.target.position.y.toFixed(2) + ', ' + 
                gSpotLight.target.position.z.toFixed(2) + ')');
            console.log('  lampAngle: ' + gLampAngle.toFixed(4) + ' radians (' + 
                (gLampAngle * 180 / Math.PI).toFixed(2) + ' degrees)');
            console.log('  assemblyRotation: ' + gLampAssemblyRotation.toFixed(4) + ' radians (' + 
                (gLampAssemblyRotation * 180 / Math.PI).toFixed(2) + ' degrees)');
            console.log('  basePosition: (' + 
                gLampBasePlate.position.x.toFixed(2) + ', ' + 
                gLampBasePlate.position.y.toFixed(2) + ', ' + 
                gLampBasePlate.position.z.toFixed(2) + ')');
            console.log('  poleHeight: ' + (gLampPole.position.y * 2).toFixed(2));
            console.log('');
            console.log('LAMP 2:');
            console.log('  lightPosition2: new THREE.Vector3(' + 
                gSpotLight2.position.x.toFixed(2) + ', ' + 
                gSpotLight2.position.y.toFixed(2) + ', ' + 
                gSpotLight2.position.z.toFixed(2) + ')');
            console.log('  lightTarget2: new THREE.Vector3(' + 
                gSpotLight2.target.position.x.toFixed(2) + ', ' + 
                gSpotLight2.target.position.y.toFixed(2) + ', ' + 
                gSpotLight2.target.position.z.toFixed(2) + ')');
            console.log('  lampAngle2: ' + gLampAngle2.toFixed(4) + ' radians (' + 
                (gLampAngle2 * 180 / Math.PI).toFixed(2) + ' degrees)');
            console.log('  assemblyRotation2: ' + gLampAssemblyRotation2.toFixed(4) + ' radians (' + 
                (gLampAssemblyRotation2 * 180 / Math.PI).toFixed(2) + ' degrees)');
            console.log('  basePosition2: (' + 
                gLampBasePlate2.position.x.toFixed(2) + ', ' + 
                gLampBasePlate2.position.y.toFixed(2) + ', ' + 
                gLampBasePlate2.position.z.toFixed(2) + ')');
            console.log('  poleHeight2: ' + (gLampPole2.position.y * 2).toFixed(2));
            console.log('');
            console.log('===============================');
        }
    });
    
    // grabber
    gGrabber = new Grabber();
    container.addEventListener( 'pointerdown', onPointer, false );
    container.addEventListener( 'pointermove', onPointer, false );
    container.addEventListener( 'pointerup', onPointer, false );
    
    // Prevent context menu on right-click
    container.addEventListener('contextmenu', function(evt) {
        evt.preventDefault();
    }, false);
}

// ------ Button Functions -----------------------------------------------
function drawButtons() {
    // Position buttons relative to main menu at top-left
    const cScale = Math.min(window.innerWidth, window.innerHeight) / 2.0;
    const ellipsisX = 0.05 * cScale;
    const ellipsisY = 0.05 * cScale;
    const itemWidth = 0.24 * menuScale;
    const padding = 0.02 * menuScale;
    const menuWidth = itemWidth + (padding * 2);
    const menuBaseX = ellipsisX + 0.08 * menuScale;
    const buttonSpacing = 25;
    const buttonY = ellipsisY;
    
    // Update button positions with animation offset
    const buttonStartX = menuBaseX + menuWidth + 20 + (mainMenuXOffset * menuScale);
    gButtons.run.x = buttonStartX;
    gButtons.run.y = buttonY;
    gButtons.restart.x = buttonStartX + buttonSpacing;
    gButtons.restart.y = buttonY;
    
    // Only draw buttons if menu has any opacity
    if (mainMenuOpacity > 0) {
        gOverlayCtx.save();
        gOverlayCtx.globalAlpha = mainMenuOpacity;
        
        // Draw run button
        var runBtn = gButtons.run;
        gOverlayCtx.beginPath();
        gOverlayCtx.arc(runBtn.x, runBtn.y, runBtn.radius, 0, Math.PI * 2);
        gOverlayCtx.fillStyle = gPhysicsScene.paused ? '#ff4444' : '#44ff44';
        gOverlayCtx.fill();
        
        // Draw restart button
        var restartBtn = gButtons.restart;
        gOverlayCtx.beginPath();
        gOverlayCtx.arc(restartBtn.x, restartBtn.y, restartBtn.radius, 0, Math.PI * 2);
        gOverlayCtx.fillStyle = restartBtn.color;
        gOverlayCtx.fill();
        
        gOverlayCtx.restore();
    }
}

function checkButtonHover(x, y) {
    // Button positions are updated in drawButtons, so this still works
    var hoverChanged = false;
    for (var key in gButtons) {
        var btn = gButtons[key];
        var dx = x - btn.x;
        var dy = y - btn.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var wasHovered = btn.hovered;
        btn.hovered = dist <= btn.radius;
        if (wasHovered !== btn.hovered) hoverChanged = true;
    }
    if (hoverChanged) {
        // Redraw will happen in main update loop
    }
}

function checkButtonClick(x, y) {
    var dx = x - gButtons.run.x;
    var dy = y - gButtons.run.y;
    if (Math.sqrt(dx * dx + dy * dy) <= gButtons.run.radius) {
        run();
        return true;
    }
    
    dx = x - gButtons.restart.x;
    dy = y - gButtons.restart.y;
    if (Math.sqrt(dx * dx + dy * dy) <= gButtons.restart.radius) {
        restart();
        return true;
    }
    return false;
}

// ------- grabber -----------------------------------------------------------
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
                if (gPhysicsScene.paused)
                    run();
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
                vel.set(0.0, 0.0, 0.0);
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

/*function onPointer(evt) {
    event.preventDefault();
    if (evt.type == "pointerdown") {
        // Check if clicking on a button
        if (checkButtonClick(evt.clientX, evt.clientY)) {
            return;
        }
        gGrabber.start(evt.clientX, evt.clientY);
        gMouseDown = true;
        if (gGrabber.physicsObject) {
            gCameraControl.saveState();
            gCameraControl.enabled = false;
        }
    } 
    else if (evt.type == "pointermove") {
        checkButtonHover(evt.clientX, evt.clientY);
        if (gMouseDown) {
            gGrabber.move(evt.clientX, evt.clientY);
        }
    }
    else if (evt.type == "pointerup") {
        if (gGrabber.physicsObject) {
            gGrabber.end();
            gCameraControl.reset();
        }
        gMouseDown = false;
        gCameraControl.enabled = true;
    } 
}*/

function onPointer(evt) {
    evt.preventDefault();
    
    if (evt.type == "pointerdown") {
        // Check if clicking on a button
        if (checkButtonClick(evt.clientX, evt.clientY)) {
            return;
        }
        
        // Check ellipsis button click (always active to toggle menu)
        const cScale = Math.min(window.innerWidth, window.innerHeight) / 2.0;
        const ellipsisX = 0.05 * cScale;
        const ellipsisY = 0.05 * cScale;
        const dotSpacing = 0.016 * cScale;
        const clickRadius = 20; // Generous click area
        const dx = evt.clientX - (ellipsisX + dotSpacing);
        const dy = evt.clientY - ellipsisY;
        if (dx * dx + dy * dy < clickRadius * clickRadius) {
            mainMenuVisible = !mainMenuVisible;
            // Hide submenu when main menu is hidden, restore when shown
            if (!mainMenuVisible) {
                menuVisibleBeforeHide = menuVisible;
                menuVisible = false;
            } else {
                menuVisible = menuVisibleBeforeHide;
            }
            return;
        }
        
        // Check main menu item clicks (only when menu is visible)
        if (mainMenuVisible && mainMenuOpacity > 0.5) {
            const itemHeight = 0.12 * menuScale;
            const itemWidth = 0.24 * menuScale;
            const padding = 0.02 * menuScale;
            const menuHeight = itemHeight + (padding * 2);
            const menuBaseX = ellipsisX + 0.08 * menuScale;
            const menuX = menuBaseX + mainMenuXOffset * menuScale;
            const menuY = ellipsisY - 0.04 * menuScale;
            const itemX = menuX + padding;
            const itemY = menuY + padding;
            
            if (evt.clientX >= itemX && evt.clientX <= itemX + itemWidth &&
                evt.clientY >= itemY && evt.clientY <= itemY + itemHeight) {
                menuVisible = !menuVisible;
                return;
            }
        }
        
        // Check simulation submenu clicks
        if (checkSimMenuClick(evt.clientX, evt.clientY)) {
            return;
        }
        
        // Check if clicking on lamp cone
        var rect = gRenderer.domElement.getBoundingClientRect();
        var mousePos = new THREE.Vector2();
        mousePos.x = ((evt.clientX - rect.left) / rect.width ) * 2 - 1;
        mousePos.y = -((evt.clientY - rect.top) / rect.height ) * 2 + 1;
        
        var raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mousePos, gCamera);
        var intersects = raycaster.intersectObjects(gThreeScene.children, true);
        
        // Check if we hit a lamp component or cylinder
        var hitLampCone = false;
        var hitLampHeight = false;
        var hitLampRotation = false;
        var hitLampBase = false;
        var hitCylinder = false;
        var hitCylinderObstacle = null;
        var hitLampId = 1; // Default to lamp 1
        for (var i = 0; i < intersects.length; i++) {
            if (intersects[i].object.userData.isDraggableCylinder) {
                hitCylinder = true;
                hitCylinderObstacle = intersects[i].object.userData.cylinderObstacle;
                break;
            }
            if (intersects[i].object.userData.isLampCone) {
                hitLampCone = true;
                hitLampId = intersects[i].object.userData.lampId || 1;
                break;
            }
            if (intersects[i].object.userData.isLampHeight) {
                hitLampHeight = true;
                hitLampId = intersects[i].object.userData.lampId || 1;
            }
            if (intersects[i].object.userData.isLampRotation) {
                hitLampRotation = true;
                hitLampId = intersects[i].object.userData.lampId || 1;
            }
            if (intersects[i].object.userData.isLampBase) {
                hitLampBase = true;
                hitLampId = intersects[i].object.userData.lampId || 1;
            }
        }
        
        if (hitCylinder && hitCylinderObstacle) {
            gDraggingCylinder = true;
            window.draggingCylinderObstacle = hitCylinderObstacle; // Store reference globally
            gPointerLastX = evt.clientX;
            gPointerLastY = evt.clientY;
            // Disable orbit controls while dragging cylinder
            if (gCameraControl) {
                gCameraControl.enabled = false;
            }
            return;
        }
        
        if (hitLampHeight) {
            gActiveLampId = hitLampId;
            gDraggingLampHeight = true;
            gPointerLastY = evt.clientY;
            // Disable orbit controls while dragging lamp
            if (gCameraControl) {
                gCameraControl.enabled = false;
            }
            return;
        }
        
        if (hitLampBase) {
            // Check for double-click on lamp base to toggle light
            var currentTime = Date.now();
            var timeSinceLastClick = currentTime - gLastLampBaseClickTime[hitLampId];
            
            if (timeSinceLastClick < 300) { // 300ms double-click threshold
                // Double-click detected - toggle the lamp on/off
                var spotlight = hitLampId === 1 ? gSpotLight : gSpotLight2;
                var bulb = hitLampId === 1 ? gLampBulb : gLampBulb2;
                var innerCone = hitLampId === 1 ? gLampInnerCone : gLampInnerCone2;
                
                if (spotlight) {
                    spotlight.visible = !spotlight.visible;
                    var isOn = spotlight.visible;
                    
                    // Update bulb appearance
                    if (bulb) {
                        bulb.material.color.setHex(isOn ? 0xffffff : 0x333333);
                    }
                    
                    // Update inner cone appearance
                    if (innerCone) {
                        innerCone.material.emissive.setHex(isOn ? 0xffffee : 0x000000);
                        innerCone.material.emissiveIntensity = isOn ? 0.8 : 0;
                        innerCone.material.color.setHex(isOn ? 0xffff00 : 0x222222);
                    }
                }
                gLastLampBaseClickTime[hitLampId] = 0; // Reset to prevent triple-click
                return;
            }
            
            gLastLampBaseClickTime[hitLampId] = currentTime;
            gActiveLampId = hitLampId;
            gDraggingLampBase = true;
            gPointerLastX = evt.clientX;
            gPointerLastY = evt.clientY;
            // Disable orbit controls while dragging base
            if (gCameraControl) {
                gCameraControl.enabled = false;
            }
            return;
        }
        
        if (hitLampRotation && !hitLampHeight) {
            gActiveLampId = hitLampId;
            gDraggingLampRotation = true;
            gPointerLastX = evt.clientX;
            // Disable orbit controls while rotating lamp
            if (gCameraControl) {
                gCameraControl.enabled = false;
            }
            return;
        }
        
        if (hitLampCone) {
            gActiveLampId = hitLampId;
            gDraggingLamp = true;
            gPointerLastX = evt.clientX;
            gPointerLastY = evt.clientY;
            // Disable orbit controls while dragging lamp
            if (gCameraControl) {
                gCameraControl.enabled = false;
            }
            return;
        }
        
        // Handle camera control in follow modes
        if (gCameraMode >= 3) {
            gCameraManualControl = true;
            gPointerLastX = evt.clientX;
            gPointerLastY = evt.clientY;
            return;
        }
    } 
    else if (evt.type == "pointermove") {
        // Handle menu dragging
        if (isDraggingMenu) {
            const deltaX = evt.clientX - menuDragStartX;
            const deltaY = evt.clientY - menuDragStartY;
            menuX = menuStartX + deltaX / window.innerWidth;
            menuY = menuStartY + deltaY / window.innerHeight;
            return;
        }
        
        // Handle knob dragging
        if (draggedKnob !== null) {
            const deltaX = (evt.clientX - dragStartMouseX) / window.innerWidth;
            const deltaY = (evt.clientY - dragStartMouseY) / window.innerHeight;
            const dragDelta = deltaX + deltaY;
            
            const ranges = [
                {min: 100, max: 5000},
                {min: 0.05, max: 0.5},
                {min: 0.5, max: 10},
                {min: 0, max: 0.2},
                {min: 0, max: 0.2},
                {min: 0, max: 0.005},
                {min: 1.0, max: 15.0},
                {min: 0, max: 0.2},
                {min: 0.5, max: 5.0}
            ];
            
            const dragSensitivity = 0.5;
            const normalizedDelta = dragDelta / dragSensitivity;
            const range = ranges[draggedKnob];
            const rangeSize = range.max - range.min;
            let newValue = dragStartValue + normalizedDelta * rangeSize;
            newValue = Math.max(range.min, Math.min(range.max, newValue));
            
            switch (draggedKnob) {
                case 0: // Number of boids
                    const targetCount = Math.round(newValue);
                    const currentCount = gPhysicsScene.objects.length;
                    
                    if (currentCount > targetCount) {
                        // Remove excess boids
                        const removeCount = currentCount - targetCount;
                        for (let i = 0; i < removeCount; i++) {
                            const boid = gPhysicsScene.objects.pop();
                            gThreeScene.remove(boid.visMesh);
                            if (boid.visMesh2) {
                                gThreeScene.remove(boid.visMesh2);
                            }
                            SpatialGrid.updateBoid(boid); // Remove from grid
                        }
                    } else if (currentCount < targetCount) {
                        // Add new boids
                        const addCount = targetCount - currentCount;
                        const size = gPhysicsScene.worldSize;
                        let hue, sat;
                        for (let i = 0; i < addCount; i++) {
                            // Random position within simulation area
                            const pos = new THREE.Vector3(
                                (Math.random() - 0.5) * 2 * size.x,
                                Math.random() * size.y,
                                (Math.random() - 0.5) * 2 * size.z
                            );
                            
                            // Random velocity
                            const vel = new THREE.Vector3(
                                (Math.random() - 0.5) * 10,
                                (Math.random() - 0.5) * 10,
                                (Math.random() - 0.5) * 10
                            );
                            
                            // Random hue (but not 220 which is reserved for first boid)
                            hue = Math.round(340 + Math.random() * 40);

                            // saturation
                            sat = Math.floor(30 + 70 * Math.random());
                            
                            const newBoid = new BOID(pos, boidRadius, vel, hue, sat);
                            gPhysicsScene.objects.push(newBoid);
                            SpatialGrid.insert(newBoid);
                        }
                    }
                    break;
                case 1: 
                    boidRadius = newValue;
                    boidProps.minDistance = 5.0 * boidRadius;
                    // Update all existing boid sizes
                    for (var i = 0; i < gPhysicsScene.objects.length; i++) {
                        var boid = gPhysicsScene.objects[i];
                        const scaleFactor = newValue / boid.rad;
                        boid.rad = boidRadius;
                        boid.visMesh.scale.multiplyScalar(scaleFactor);
                    }
                    break;
                case 2:
                    boidProps.visualRange = newValue;
                    // Rebuild spatial grid with new range
                    SpatialGrid = new SpatialHashGrid(boidProps.visualRange);
                    for (var i = 0; i < gPhysicsScene.objects.length; i++) {
                        SpatialGrid.insert(gPhysicsScene.objects[i]);
                    }
                    break;
                case 3: boidProps.avoidFactor = newValue; break;
                case 4: boidProps.matchingFactor = newValue; break;
                case 5: boidProps.centeringFactor = newValue; break;
                case 6: 
                    boidProps.maxSpeed = newValue;
                    // Also adjust minSpeed proportionally if needed
                    boidProps.minSpeed = Math.min(boidProps.minSpeed, newValue * 0.25);
                    break;
                case 7: boidProps.turnFactor = newValue; break;
                case 8: boidProps.margin = newValue; break;
            }
            return;
        }
        
        // Handle cylinder dragging (translation along ground)
        if (gDraggingCylinder && window.draggingCylinderObstacle) {
            // Raycast to find where cursor intersects ground plane
            var rect = gRenderer.domElement.getBoundingClientRect();
            var mousePos = new THREE.Vector2();
            mousePos.x = ((evt.clientX - rect.left) / rect.width ) * 2 - 1;
            mousePos.y = -((evt.clientY - rect.top) / rect.height ) * 2 + 1;
            
            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mousePos, gCamera);
            
            // Define ground plane at Y=0
            var groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            var intersectionPoint = new THREE.Vector3();
            raycaster.ray.intersectPlane(groundPlane, intersectionPoint);
            
            if (intersectionPoint) {
                // Keep the cylinder's Y position (height above ground) constant
                var cylinderObstacle = window.draggingCylinderObstacle;
                var newPosition = new THREE.Vector3(
                    intersectionPoint.x,
                    cylinderObstacle.position.y, // Keep original height
                    intersectionPoint.z
                );
                cylinderObstacle.updatePosition(newPosition);
            }
            return;
        }
        
        // Handle lamp base dragging (translation)
        if (gDraggingLampBase) {
            // Raycast to find where cursor intersects ground plane
            var rect = gRenderer.domElement.getBoundingClientRect();
            var mousePos = new THREE.Vector2();
            mousePos.x = ((evt.clientX - rect.left) / rect.width ) * 2 - 1;
            mousePos.y = -((evt.clientY - rect.top) / rect.height ) * 2 + 1;
            
            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mousePos, gCamera);
            
            // Intersect with ground plane (y=0)
            var groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            var intersectionPoint = new THREE.Vector3();
            raycaster.ray.intersectPlane(groundPlane, intersectionPoint);
            
            var baseCenter = gActiveLampId === 1 ? gLampBaseCenter : gLampBaseCenter2;
            if (intersectionPoint && baseCenter) {
                // Calculate translation needed to move base center to cursor position
                const deltaX = intersectionPoint.x - baseCenter.x;
                const deltaZ = intersectionPoint.z - baseCenter.z;
                translateLampAssembly(deltaX, deltaZ, gActiveLampId);
            }
            return;
        }
        
        // Handle lamp height adjustment
        if (gDraggingLampHeight) {
            const deltaY = evt.clientY - gPointerLastY;
            
            // Adjust lamp height based on vertical mouse movement (inverted)
            updateLampHeight(-deltaY * 0.02, gActiveLampId);
            
            gPointerLastY = evt.clientY;
            return;
        }
        
        // Handle lamp assembly rotation
        if (gDraggingLampRotation) {
            const deltaX = evt.clientX - gPointerLastX;
            
            // Rotate lamp assembly based on horizontal mouse movement
            rotateLampAssembly(deltaX * 0.01, gActiveLampId);
            
            gPointerLastX = evt.clientX;
            return;
        }
        
        // Handle lamp rotation
        if (gDraggingLamp) {
            const deltaY = evt.clientY - gPointerLastY;
            
            // Adjust lamp angle based on vertical mouse movement
            if (gActiveLampId === 1) {
                gLampAngle += deltaY * 0.01;
                gLampAngle = Math.max(-Math.PI / 2, Math.min(Math.PI / 10, gLampAngle));
            } else {
                gLampAngle2 += deltaY * 0.01;
                gLampAngle2 = Math.max(-Math.PI / 2, Math.min(Math.PI / 10, gLampAngle2)); // Same limits as lamp 1
            }
            
            // Rotate lamp group around pivot
            rotateLamp(gActiveLampId);
            
            gPointerLastY = evt.clientY;
            return;
        }
        
        // Handle camera rotation in follow modes
        if (gCameraMode >= 3 && gCameraManualControl) {
            const deltaX = evt.clientX - gPointerLastX;
            const deltaY = evt.clientY - gPointerLastY;
            
            gCameraRotationOffset.theta += deltaX * 0.005;
            gCameraRotationOffset.phi -= deltaY * 0.005;
            
            gCameraRotationOffset.phi = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, gCameraRotationOffset.phi));
            
            gPointerLastX = evt.clientX;
            gPointerLastY = evt.clientY;
            return;
        }
    }
    else if (evt.type == "pointerup") {
        if (isDraggingMenu) {
            isDraggingMenu = false;
            // Re-enable orbit controls if in normal camera mode
            if (gCameraMode < 3 && gCameraControl) {
                gCameraControl.enabled = true;
            }
            return;
        }
        
        if (draggedKnob !== null) {
            draggedKnob = null;
            if (gCameraMode < 3 && gCameraControl) {
                gCameraControl.enabled = true;
            }
            return;
        }
        
        if (gDraggingCylinder) {
            gDraggingCylinder = false;
            window.draggingCylinderObstacle = null;
            // Re-enable orbit controls if in normal camera mode
            if (gCameraMode < 3 && gCameraControl) {
                gCameraControl.enabled = true;
            }
            return;
        }
        
        if (gDraggingLampBase) {
            gDraggingLampBase = false;
            // Re-enable orbit controls if in normal camera mode
            if (gCameraMode < 3 && gCameraControl) {
                gCameraControl.enabled = true;
            }
            return;
        }
        
        if (gDraggingLampHeight) {
            gDraggingLampHeight = false;
            // Re-enable orbit controls if in normal camera mode
            if (gCameraMode < 3 && gCameraControl) {
                gCameraControl.enabled = true;
            }
            return;
        }
        
        if (gDraggingLampRotation) {
            gDraggingLampRotation = false;
            // Re-enable orbit controls if in normal camera mode
            if (gCameraMode < 3 && gCameraControl) {
                gCameraControl.enabled = true;
            }
            return;
        }
        
        if (gDraggingLamp) {
            gDraggingLamp = false;
            // Re-enable orbit controls if in normal camera mode
            if (gCameraMode < 3 && gCameraControl) {
                gCameraControl.enabled = true;
            }
            return;
        }
        
        if (gCameraMode >= 3 && gCameraManualControl) {
            gCameraManualControl = false;
            return;
        }
    }
}

// Check if click is on simulation menu
function checkSimMenuClick(clientX, clientY) {
    if (!menuVisible || menuOpacity <= 0.5) return false;
    
    const knobRadius = 0.1 * menuScale;
    const knobSpacing = knobRadius * 3;
    const menuTopMargin = 0.2 * knobRadius;
    const menuWidth = knobSpacing * 2;
    const menuHeight = knobSpacing * 2 + knobRadius * 2.0;
    const padding = 1.7 * knobRadius;
    
    const menuUpperLeftX = menuX * window.innerWidth;
    const menuUpperLeftY = menuY * window.innerHeight;
    const menuOriginX = menuUpperLeftX + knobSpacing;
    const menuOriginY = menuUpperLeftY + 0.5 * knobSpacing;
    
    // Check close button
    const closeIconRadius = knobRadius * 0.25;
    const closeIconX = menuOriginX - padding + closeIconRadius + 0.2 * knobRadius;
    const closeIconY = menuOriginY - padding + closeIconRadius + 0.2 * knobRadius;
    const cdx = clientX - closeIconX;
    const cdy = clientY - closeIconY;
    
    if (cdx * cdx + cdy * cdy < closeIconRadius * closeIconRadius) {
        menuVisible = false;
        return true;
    }
    
    // Check knobs
    for (let knob = 0; knob < 9; knob++) {
        const row = Math.floor(knob / 3);
        const col = knob % 3;
        const knobX = menuOriginX + col * knobSpacing;
        const knobY = menuOriginY + row * knobSpacing + menuTopMargin;
        
        const kdx = clientX - knobX;
        const kdy = clientY - knobY;
        if (kdx * kdx + kdy * kdy < knobRadius * knobRadius) {
            draggedKnob = knob;
            dragStartMouseX = clientX;
            dragStartMouseY = clientY;
            
            const menuItems = [
                gPhysicsScene.objects.length, boidRadius, boidProps.visualRange,
                boidProps.avoidFactor, boidProps.matchingFactor, boidProps.centeringFactor,
                boidProps.maxSpeed, boidProps.turnFactor, boidProps.margin
            ];
            dragStartValue = menuItems[knob];
            
            if (gCameraControl) {
                gCameraControl.enabled = false;
            }
            return true;
        }
    }
    
    // Check if menu background clicked (for dragging)
    if (clientX >= menuOriginX - padding && clientX <= menuOriginX + menuWidth + padding &&
        clientY >= menuOriginY - padding && clientY <= menuOriginY + menuHeight + padding) {
        isDraggingMenu = true;
        menuDragStartX = clientX;
        menuDragStartY = clientY;
        menuStartX = menuX;
        menuStartY = menuY;
        
        // Disable orbit controls while dragging menu
        if (gCameraControl) {
            gCameraControl.enabled = false;
        }
        return true;
    }
    
    return false;
}

// Function to rotate lamp around pivot point
function rotateLamp(lampId) {
    lampId = lampId || 1;
    const rotGroup = lampId === 1 ? gLampRotatableGroup : gLampRotatableGroup2;
    const pivot = lampId === 1 ? gLampPivot : gLampPivot2;
    const spotlight = lampId === 1 ? gSpotLight : gSpotLight2;
    const pinAxis = lampId === 1 ? window.gPinRotationAxis : gPinRotationAxis2;
    const angle = lampId === 1 ? gLampAngle : gLampAngle2;
    
    if (!rotGroup || !pivot || !spotlight || !pinAxis) return;
    
    // Use the pin's axis for rotation
    const rotationAxis = pinAxis.clone();
    
    // Apply absolute rotation from initial state based on current lamp angle
    rotGroup.children.forEach(child => {
        if (!child.userData.initialPosition || !child.userData.initialQuaternion) return;
        
        // Reset to initial position and orientation
        child.position.copy(child.userData.initialPosition);
        child.quaternion.copy(child.userData.initialQuaternion);
        
        // Apply rotation around pivot using current lamp angle
        child.position.sub(pivot);
        child.position.applyAxisAngle(rotationAxis, angle);
        child.position.add(pivot);
        
        // Rotate orientation
        child.rotateOnWorldAxis(rotationAxis, angle);
    });
    
    // Update spotlight position and target
    const bulbWorldPos = new THREE.Vector3();
    rotGroup.children[2].getWorldPosition(bulbWorldPos); // Light bulb is 3rd child
    spotlight.position.copy(bulbWorldPos);
    
    // Get the cone's actual direction from its world quaternion
    const coneWorldQuaternion = new THREE.Quaternion();
    rotGroup.children[0].getWorldQuaternion(coneWorldQuaternion);
    
    // The cone points along negative Y axis in local space (tip down)
    const coneDirection = new THREE.Vector3(0, -1, 0);
    coneDirection.applyQuaternion(coneWorldQuaternion);
    
    // Set spotlight target based on cone direction
    spotlight.target.position.copy(bulbWorldPos).add(coneDirection.multiplyScalar(10));
}

// Function to translate entire lamp assembly along ground plane
function translateLampAssembly(deltaX, deltaZ, lampId) {
    lampId = lampId || 1;
    const translation = new THREE.Vector3(deltaX, 0, deltaZ);
    const basePlate = lampId === 1 ? gLampBasePlate : gLampBasePlate2;
    const baseCenter = lampId === 1 ? gLampBaseCenter : gLampBaseCenter2;
    const pole = lampId === 1 ? gLampPole : gLampPole2;
    const sleeve = lampId === 1 ? gLampSleeve : gLampSleeve2;
    const discs = lampId === 1 ? gLampDiscs : gLampDiscs2;
    const pin = lampId === 1 ? gLampPin : gLampPin2;
    const pivot = lampId === 1 ? gLampPivot : gLampPivot2;
    const rotGroup = lampId === 1 ? gLampRotatableGroup : gLampRotatableGroup2;
    const spotlight = lampId === 1 ? gSpotLight : gSpotLight2;
    
    // Translate base plate
    if (basePlate) {
        basePlate.position.add(translation);
    }
    
    // Translate base center
    if (baseCenter) {
        baseCenter.add(translation);
    }
    
    // Translate pole
    if (pole) {
        pole.position.add(translation);
    }
    
    // Translate sleeve
    if (sleeve) {
        sleeve.position.add(translation);
    }
    
    // Translate discs
    discs.forEach(disc => {
        disc.position.add(translation);
    });
    
    // Translate pin
    if (pin) {
        pin.position.add(translation);
    }
    
    // Translate pivot
    if (pivot) {
        pivot.add(translation);
    }
    
    // Translate lamp group children
    if (rotGroup) {
        rotGroup.children.forEach(child => {
            child.position.add(translation);
            // Update stored initial position for rotation calculations
            if (child.userData.initialPosition) {
                child.userData.initialPosition.add(translation);
            }
        });
    }
    
    // Translate spotlight and target
    if (spotlight) {
        spotlight.position.add(translation);
        spotlight.target.position.add(translation);
    }
}

// Function to rotate entire lamp assembly around base center
function rotateLampAssembly(deltaAngle, lampId) {
    lampId = lampId || 1;
    const baseCenter = lampId === 1 ? gLampBaseCenter : gLampBaseCenter2;
    const pole = lampId === 1 ? gLampPole : gLampPole2;
    const sleeve = lampId === 1 ? gLampSleeve : gLampSleeve2;
    const discs = lampId === 1 ? gLampDiscs : gLampDiscs2;
    const pin = lampId === 1 ? gLampPin : gLampPin2;
    const pivot = lampId === 1 ? gLampPivot : gLampPivot2;
    const rotGroup = lampId === 1 ? gLampRotatableGroup : gLampRotatableGroup2;
    const spotlight = lampId === 1 ? gSpotLight : gSpotLight2;
    const pinAxis = lampId === 1 ? window.gPinRotationAxis : gPinRotationAxis2;
    
    if (!baseCenter || !pole || !sleeve) return;
    
    if (lampId === 1) {
        gLampAssemblyRotation += deltaAngle;
    } else {
        gLampAssemblyRotation2 += deltaAngle;
    }
    
    // Rotate all lamp components around base center on Y axis
    const axis = new THREE.Vector3(0, 1, 0);
    const center = baseCenter;
    
    // Rotate pole
    const polePos = pole.position.clone().sub(center);
    polePos.applyAxisAngle(axis, deltaAngle);
    pole.position.copy(polePos.add(center));
    
    // Rotate sleeve
    const sleevePos = sleeve.position.clone().sub(center);
    sleevePos.applyAxisAngle(axis, deltaAngle);
    sleeve.position.copy(sleevePos.add(center));
    
    // Rotate discs
    discs.forEach(disc => {
        const discPos = disc.position.clone().sub(center);
        discPos.applyAxisAngle(axis, deltaAngle);
        disc.position.copy(discPos.add(center));
        disc.rotateOnWorldAxis(axis, deltaAngle);
    });
    
    // Rotate pin
    if (pin) {
        const pinPos = pin.position.clone().sub(center);
        pinPos.applyAxisAngle(axis, deltaAngle);
        pin.position.copy(pinPos.add(center));
        pin.rotateOnWorldAxis(axis, deltaAngle);
    }
    
    // Rotate pivot point
    if (pivot) {
        const pivotPos = pivot.clone().sub(center);
        pivotPos.applyAxisAngle(axis, deltaAngle);
        if (lampId === 1) {
            gLampPivot.copy(pivotPos.add(center));
        } else {
            gLampPivot2.copy(pivotPos.add(center));
        }
    }
    
    // Rotate lamp group children around base center
    if (rotGroup && pivot) {
        rotGroup.children.forEach(child => {
            // Rotate initial positions and orientations around base center
            if (child.userData.initialPosition) {
                const initPos = child.userData.initialPosition.clone().sub(center);
                initPos.applyAxisAngle(axis, deltaAngle);
                child.userData.initialPosition.copy(initPos.add(center));
            }
            
            if (child.userData.initialQuaternion) {
                const rotQuat = new THREE.Quaternion().setFromAxisAngle(axis, deltaAngle);
                child.userData.initialQuaternion.premultiply(rotQuat);
            }
        });
        
        // Reapply lamp angle rotation from new base orientations
        rotateLamp(lampId);
    }
    
    // Rotate spotlight
    if (spotlight) {
        const lightPos = spotlight.position.clone().sub(center);
        lightPos.applyAxisAngle(axis, deltaAngle);
        spotlight.position.copy(lightPos.add(center));
        
        // Rotate spotlight target
        const targetPos = spotlight.target.position.clone().sub(center);
        targetPos.applyAxisAngle(axis, deltaAngle);
        spotlight.target.position.copy(targetPos.add(center));
    }
    
    // Update pin rotation axis by recalculating from pin's actual rotation
    if (pin && pinAxis) {
        var recalcPinAxis = new THREE.Vector3(0, 1, 0);
        var pinRotationMatrix = new THREE.Matrix4();
        pinRotationMatrix.makeRotationFromEuler(new THREE.Euler(pin.rotation.x, pin.rotation.y, pin.rotation.z, 'XYZ'));
        recalcPinAxis.applyMatrix4(pinRotationMatrix);
        recalcPinAxis.normalize();
        
        if (lampId === 1) {
            window.gPinRotationAxis.copy(recalcPinAxis);
        } else {
            window.gPinRotationAxis2.copy(recalcPinAxis);
        }
    }
    
    // Update spotlight position based on current bulb position
    if (spotlight && rotGroup) {
        const bulbWorldPos = new THREE.Vector3();
        rotGroup.children[2].getWorldPosition(bulbWorldPos);
        spotlight.position.copy(bulbWorldPos);
        
        // Get the cone's actual direction from its world quaternion
        const coneWorldQuaternion = new THREE.Quaternion();
        rotGroup.children[0].getWorldQuaternion(coneWorldQuaternion);
        
        // The cone points along negative Y axis in local space (tip down)
        const coneDirection = new THREE.Vector3(0, -1, 0);
        coneDirection.applyQuaternion(coneWorldQuaternion);
        
        // Set spotlight target based on cone direction
        spotlight.target.position.copy(bulbWorldPos).add(coneDirection.multiplyScalar(10));
    }
}

// Function to update lamp height
function updateLampHeight(deltaHeight, lampId) {
    lampId = lampId || 1;
    const pole = lampId === 1 ? gLampPole : gLampPole2;
    const sleeve = lampId === 1 ? gLampSleeve : gLampSleeve2;
    const rotGroup = lampId === 1 ? gLampRotatableGroup : gLampRotatableGroup2;
    const pivot = lampId === 1 ? gLampPivot : gLampPivot2;
    const discs = lampId === 1 ? gLampDiscs : gLampDiscs2;
    const pin = lampId === 1 ? gLampPin : gLampPin2;
    const spotlight = lampId === 1 ? gSpotLight : gSpotLight2;
    
    if (!pole || !sleeve || !rotGroup || !pivot) return;
    
    // Calculate new height
    const currentHeight = pole.geometry.parameters.height;
    const newHeight = Math.max(2, Math.min(25, currentHeight + deltaHeight));
    const actualDelta = newHeight - currentHeight;
    
    if (Math.abs(actualDelta) < 0.001) return;
    
    // Update pole
    const poleRadius = pole.geometry.parameters.radiusTop;
    pole.geometry.dispose();
    pole.geometry = new THREE.CylinderGeometry(poleRadius, poleRadius, newHeight, 16);
    pole.position.y += actualDelta / 2;
    
    // Update sleeve
    sleeve.position.y += actualDelta;
    
    // Update discs
    discs.forEach(disc => {
        disc.position.y += actualDelta;
    });
    
    // Update pin
    if (pin) {
        pin.position.y += actualDelta;
    }
    
    // Update pivot point
    if (lampId === 1) {
        gLampPivot.y += actualDelta;
    } else {
        gLampPivot2.y += actualDelta;
    }
    
    // Update lamp rotatable group
    rotGroup.children.forEach(child => {
        child.position.y += actualDelta;
        // Update stored initial position for rotation calculations
        if (child.userData.initialPosition) {
            child.userData.initialPosition.y += actualDelta;
        }
    });
    
    // Update spotlight
    spotlight.position.y += actualDelta;
    
    // Update spotlight target
    spotlight.target.position.y += actualDelta;
}
    
// ------------------------------------------------------
function onWindowResize() {
    gCamera.aspect = window.innerWidth / window.innerHeight;
    gCamera.updateProjectionMatrix();
    gRenderer.setSize( window.innerWidth, window.innerHeight );
    if (gOverlayCanvas) {
        gOverlayCanvas.width = window.innerWidth;
        gOverlayCanvas.height = window.innerHeight;
        drawButtons();
    }
}

function run() {
    gPhysicsScene.paused = !gPhysicsScene.paused;
    drawButtons();
}

function restart() {
    // Remove all existing boids from scene
    for (var i = 0; i < gPhysicsScene.objects.length; i++) {
        gThreeScene.remove(gPhysicsScene.objects[i].visMesh);
    }
    // Clear the physics objects array
    gPhysicsScene.objects = [];
    
    // Create boids in batches over multiple frames to prevent stutter
    const batchSize = 150; // Create 150 boids per frame
    const totalBoids = 1500;
    let boidsCreated = 0;
    
    function createBatch() {
        const radius = boidRadius;
        const spawnRadius = 3.5;
        const minMargin = 0.2;
        const minDistance = 2 * radius * (1 + minMargin);
        const maxAttempts = 100;
        const spawnCenter = new THREE.Vector3(0, 4 * spawnRadius, 0);
        
        const endIndex = Math.min(boidsCreated + batchSize, totalBoids);
        
        for (let i = boidsCreated; i < endIndex; i++) {
            let validPosition = false;
            let attempts = 0;
            let pos, vel, hue, sat;
            
            while (!validPosition && attempts < maxAttempts) {
                let theta = Math.random() * Math.PI * 2;
                let phi = Math.acos(2 * Math.random() - 1);
                let r = Math.cbrt(Math.random()) * spawnRadius;
                pos = new THREE.Vector3(
                    r * Math.sin(phi) * Math.cos(theta),
                    4 * spawnRadius + r * Math.cos(phi),
                    r * Math.sin(phi) * Math.sin(theta)
                );
                
                validPosition = true;
                for (let j = 0; j < gPhysicsScene.objects.length; j++) {
                    const existingBall = gPhysicsScene.objects[j];
                    const distSquared = pos.distanceToSquared(existingBall.pos);
                    if (distSquared < minDistance * minDistance) {
                        validPosition = false;
                        break;
                    }
                }
                attempts++;
            }
            
            if (validPosition) {
                vel = pos.clone().sub(spawnCenter).normalize();
                const speed = 1 + Math.random() * 4;
                vel.multiplyScalar(speed);
                
                if (i == 0) {
                    hue = 220;
                    sat = 90;
                } else if (i < 51) {
                    hue = Math.round(100 + Math.random() * 40);
                    sat = 90;
                } else {
                    hue = Math.round(340 + Math.random() * 40);
                    sat = Math.round(30 + Math.random() * 70);
                }
                gPhysicsScene.objects.push(new BOID(pos, radius, vel, hue, sat));
            }
        }
        
        boidsCreated = endIndex;
        
        if (boidsCreated < totalBoids) {
            requestAnimationFrame(createBatch);
        } else {
            // Rebuild spatial grid after all boids are created
            SpatialGrid = new SpatialHashGrid(boidProps.visualRange);
            for (var i = 0; i < gPhysicsScene.objects.length; i++) {
                SpatialGrid.insert(gPhysicsScene.objects[i]);
            }
        }
    }
    
    requestAnimationFrame(createBatch);
}

//  RUN -----------------------------------
function update() {
    simulate();
    
    // Update menu animations
    if (mainMenuVisible) {
        mainMenuOpacity = Math.min(1, mainMenuOpacity + mainMenuFadeSpeed * deltaT);
        mainMenuXOffset = Math.min(0, mainMenuXOffset + mainMenuAnimSpeed * deltaT);
    } else {
        mainMenuOpacity = Math.max(0, mainMenuOpacity - mainMenuFadeSpeed * deltaT);
        mainMenuXOffset = Math.max(-1.0, mainMenuXOffset - mainMenuAnimSpeed * deltaT);
    }
    
    if (menuVisible) {
        menuOpacity = Math.min(1, menuOpacity + menuFadeSpeed * deltaT);
    } else {
        menuOpacity = Math.max(0, menuOpacity - menuFadeSpeed * deltaT);
    }
    
    // Camera follow modes - follow first boid (modes 3 and 4)
    if (gCameraMode >= 3 && gPhysicsScene.objects.length > 0) {
        const firstBoid = gPhysicsScene.objects[0];
        
        // Calculate target camera position
        const speed = firstBoid.vel.length();
        if (speed > 0.01) {
            const direction = firstBoid.vel.clone().normalize();
            
            // Calculate target position based on camera mode
            const targetPos = firstBoid.pos.clone();
            let lookDirection;
            
            if (gCameraMode === 3) {
                // Behind boid, looking forward
                const backwardOffset = direction.clone().multiplyScalar(-1.5);
                targetPos.add(backwardOffset);
                targetPos.y += 0.3;
                lookDirection = direction.clone();
            } else {
                // In front of boid, looking backward
                const forwardOffset = direction.clone().multiplyScalar(1.5);
                targetPos.add(forwardOffset);
                targetPos.y += 0.3;
                lookDirection = direction.clone().multiplyScalar(-1); // Reverse direction
            }
            
            // Smoothly move camera to target position
            gCamera.position.lerp(targetPos, gCameraSpringStrength);
            
            // Spring back rotation offset when not dragging
            if (!gCameraManualControl) {
                gCameraRotationOffset.theta *= 0.95;
                gCameraRotationOffset.phi *= 0.95;
            }
            
            // Calculate look-at point with manual rotation offset
            const lookAtPoint = firstBoid.pos.clone();
            const forwardDistance = 3;
            
            // Apply manual rotation offset to the look direction
            const rotatedForward = lookDirection.clone();
            
            // Rotate around vertical axis (theta)
            const cosTheta = Math.cos(gCameraRotationOffset.theta);
            const sinTheta = Math.sin(gCameraRotationOffset.theta);
            const tempX = rotatedForward.x * cosTheta - rotatedForward.z * sinTheta;
            const tempZ = rotatedForward.x * sinTheta + rotatedForward.z * cosTheta;
            rotatedForward.x = tempX;
            rotatedForward.z = tempZ;
            
            // Apply pitch offset (phi)
            rotatedForward.y += Math.sin(gCameraRotationOffset.phi);
            rotatedForward.normalize();
            
            // Set look-at point
            lookAtPoint.add(rotatedForward.multiplyScalar(forwardDistance));
            gCamera.lookAt(lookAtPoint);
        }
    } else {
        // Apply automatic rotation if in rotation modes (1 or 2)
        if (gCameraMode === 1 || gCameraMode === 2) {
            const target = gCameraControl.target;
            
            // Get current camera position relative to target
            const offset = gCamera.position.clone().sub(target);
            const radius = offset.length();
            
            // Rotate around vertical axis (Y) - time-based for smooth independent motion
            const rotationAngle = gCameraRotationSpeed * deltaT * Math.PI / 180; // Convert to radians, scale by deltaT
            const axis = new THREE.Vector3(0, 1, 0);
            offset.applyAxisAngle(axis, rotationAngle);
            
            // Update camera position
            gCamera.position.copy(target).add(offset);
            gCamera.lookAt(target);
            
            // Sync OrbitControls to prevent stuttering
            gCameraControl.update();
        }
    }
    
    gRenderer.render(gThreeScene, gCamera);
    
    // Draw menus on overlay canvas
    gOverlayCtx.clearRect(0, 0, gOverlayCanvas.width, gOverlayCanvas.height);
    drawButtons();
    drawMainMenu();
    drawSimMenu();
    
    requestAnimationFrame(update);
}

// RUN -----------------------------------
initThreeScene();
onWindowResize();
makeBoids();
// Initialize spatial grid and populate it
SpatialGrid = new SpatialHashGrid(boidProps.visualRange);
for (var i = 0; i < gPhysicsScene.objects.length; i++) {
    SpatialGrid.insert(gPhysicsScene.objects[i]);
}
// Don't apply any initial rotations - lamps are already in correct position
drawButtons();
update();