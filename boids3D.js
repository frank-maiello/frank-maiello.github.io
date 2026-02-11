/*
B0IDS 3D : A 3D Boids Simulation with Interactive Lighting and Obstacles
copyright 2025 :: Frank Maiello :: maiello.frank@gmail.com

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
var gLamps = []; // Array to store all Lamp instances

// Legacy globals for backward compatibility (lamp 1)
var gLampPivot = null; // Pivot point for lamp rotation (pin center)
var gLampRotatableGroup = null; // Group containing lamp parts that rotate
var gSpotLight = null; // Reference to spotlight
var gDraggingLamp = false; // Track if dragging the lamp
var gDraggingLampAngle = false; // Track if adjusting spotlight angle
var gDraggingLampHeight = false; // Track if adjusting lamp height
var gDraggingLampRotation = false; // Track if rotating lamp assembly
var gDraggingLampPoleOrSleeve = false; // Track if dragging pole/sleeve (direction not yet determined)
var gDraggingLampBase = false; // Track if dragging the base to move assembly
var gLampBaseDragOffset = null; // Store offset from click point to lamp base center
var gDraggingCylinder = false; // Track if dragging the cylinder obstacle
var gCylinderDragOffset = null; // Store offset from click point to cylinder center
var gCylinderDragPlaneHeight = 0; // Store the Y height where the cylinder was grabbed
var gDraggingSphere = false; // Track if dragging the sphere obstacle
var gSphereDragOffset = null; // Store offset from click point to sphere center
var gSphereDragPlaneHeight = 0; // Store the Y height where the sphere was grabbed
var gSphereHue = 90; // Current hue value for sphere obstacle (0-360)
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

// Second lamp globals (legacy)
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
    camera: { x: 50, y: 25, radius: 8, color: '#be44ff', hovered: false },
    restart: { x: 75, y: 25, radius: 8, color: '#ffcc00', hovered: false }
};
var gButtonPulseTime = 0;
var deltaT = 1.0 / 60.0;
var geometrySegments = 16 ; // Number of segments for boid geometries

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
var stylingMenuVisible = false; // Styling submenu visibility
var stylingMenuVisibleBeforeHide = false;
var stylingMenuOpacity = 0;
var stylingMenuFadeSpeed = 3.0;
var instructionsMenuVisible = false; // Instructions submenu visibility
var instructionsMenuVisibleBeforeHide = false;
var instructionsMenuOpacity = 0;
var instructionsMenuFadeSpeed = 3.0;
var colorMenuVisible = false; // Color submenu visibility
var colorMenuVisibleBeforeHide = false;
var colorMenuOpacity = 0;
var colorMenuFadeSpeed = 3.0;
var lightingMenuVisible = false; // Lighting submenu visibility
var lightingMenuVisibleBeforeHide = false;
var lightingMenuOpacity = 0;
var lightingMenuFadeSpeed = 3.0;
var menuScale = 300; // Master menu size control (increased 50%)
var simMenuX = 0.1; // Simulation menu position
var simMenuY = 0.2;
var stylingMenuX = 0.1; // Styling menu position
var stylingMenuY = 0.05;
var instructionsMenuX = 0.1; // Instructions menu position
var instructionsMenuY = 0.2;
var colorMenuX = 0.2; // Color menu position
var colorMenuY = 0.2;
var lightingMenuX = 0.1; // Lighting menu position
var lightingMenuY = 0.2;
var gColorWheelCanvas = null; // Offscreen canvas for color wheel
var gColorWheelCtx = null;
var gPrimaryHue = 180; // Primary hue (0-360)
var gSecondaryHue = 0; // Secondary hue (0-360)
var gPrimaryRingRotation = 180 * Math.PI / 180; // Rotation angle for primary ring (radians)
var gSecondaryRingRotation = 0 * Math.PI / 180; // Rotation angle for secondary ring (radians)
var gColorMixPercentage = 50; // Percentage of boids with primary color (0-100)
var gColorationMode = 0; // 0 = Normal, 1 = By Direction, 2 = By Speed
var gDraggingMixKnob = false; // Track if dragging the mix knob
var gDraggingPrimaryRing = false; // Track if dragging primary ring
var gDraggingSecondaryRing = false; // Track if dragging secondary ring
var gRingDragStartAngle = 0; // Starting angle when drag began
var draggedKnob = null; // Currently dragged knob index
var dragStartMouseX = 0;
var dragStartMouseY = 0;
var dragStartValue = 0;
var isDraggingMenu = false;
var draggingMenuType = null; // 'sim', 'styling', 'instructions', 'color'
var menuDragStartX = 0;
var menuDragStartY = 0;
var menuStartX = 0;
var menuStartY = 0;
var mouseAttached = false;

// Lighting control variables
var gAmbientLight = null;

// Bicycle wheel physics variables
var gBicycleWheel = null; // Group containing wheel parts
var gWheelParts = []; // Array of wheel meshes (tire, spokes, valve)
var gStool = null; // Reference to entire stool model
var gStoolObstacle = null; // Cylinder obstacle for boid avoidance
var gDraggingStool = false; // Track if dragging the stool
var gRotatingStool = false; // Track if rotating the stool
var gStoolDragOffset = null; // Store offset from click point to stool center
var gStoolDragPlaneHeight = 0; // Store the Y height where stool was grabbed
var gDuck = null; // Reference to duck model
var gDuckObstacle = null; // Sphere obstacle for boid avoidance
var gDraggingDuck = false; // Track if dragging the duck
var gRotatingDuckBeak = false; // Track if rotating the duck via beak
var gDuckDragOffset = null; // Store offset from click point to duck center
var gDuckDragPlaneHeight = 0; // Store the Y height where duck was grabbed
var gDuckEntranceDisc = null; // Black disc for entrance animation
var gDuckEntranceDiscOutline = null; // White outline for disc
var gDuckEntranceState = 'waiting'; // States: waiting, expanding, rising, shrinking, complete
var gDuckEntranceTimer = 0; // Timer for animation
var gDuckTargetY = -0.4; // Target Y position for duck
var gDuckStartY = -8; // Starting Y position (below floor)
var gTeapot = null; // Teapot model reference
var gTeapotAnimating = true; // Is teapot currently animating
var gTeapotAnimationTimer = 0; // Timer for teapot slide animation
var gTeapotStartZ = 25; // Starting Z position
var gTeapotTargetZ = 10; // Target Z position
var gTeapotObstacle = null; // Teapot obstacle for boid avoidance
var gDraggingTeapot = false; // Track if dragging the teapot
var gTeapotDragOffset = null; // Store offset from click point to teapot center
var gTeapotDragPlaneHeight = 0; // Store the Y height where the teapot was grabbed
var gStoolAnimating = true; // Is stool currently animating
var gStoolAnimationTimer = 0; // Timer for stool lowering animation
var gStoolStartY = 30; // Starting Y position (high above floor)
var gStoolTargetY = 0; // Target Y position (on floor)
var gWheelAngularVelocity = 10; // Current rotation speed (radians per second) - starts at maximum
var gWheelAngularAcceleration = 4.0; // Acceleration when spinning (rad/s²)
var gWheelFriction = 0.1; // Base friction coefficient for deceleration
var gWheelRockAmplitude = 0; // Current rocking amplitude
var gWheelRockPhase = 0; // Current phase in rocking oscillation
var gWheelIsSpinning = false; // Is the wheel currently being actively spun
var gWheelValveInitialAngle = 168.75 * Math.PI / 180; // Initial valve offset from wheel zero rotation
var gWheelValveAngle = 168.75 * Math.PI / 180; // Current angle of valve (initial position from model)
var gWheelValveMass = 0.1; // Relative mass of valve (creates asymmetry)
var gWheelRadius = 1.0; // Wheel radius for torque calculation
var gDirectionalLight = null;
var gAmbientIntensity = 1.0; // Ambient light intensity (0-2)
var gOverheadIntensity = 1.0; // Directional light intensity (0-2)
var gSpotlightIntensity = 0.8; // Spotlight intensity (0-2)
var gSpotlightPenumbra = 0.2; // Spotlight penumbra (0-1)

var segregationMode = 0; // 0 = no segregation, 1 = same hue separation, 2 = all separation
var SpatialGrid; // Global spatial grid instance
var gTori = []; // Array to hold the two torus meshes
var gToriRotation = 0; // Current rotation angle for tori animation
var gFadeInTime = 0; // Track time for fade-in effect
var gFadeInDuration = 1.0; // Fade in over 1 second

// Master world size constants
//var WORLD_WIDTH = 69.5 * 0.5; // X dimension Parthenon
//var WORLD_DEPTH = 31 * 0.5;   // Z dimension Parthenon
var WORLD_WIDTH = 30;   // X dimension
var WORLD_HEIGHT = 20;  // Y dimension  
var WORLD_DEPTH = 20;   // Z dimension

var gPhysicsScene = {
    gravity : new THREE.Vector3(0.0, 0.0, 0.0),
    dt : 1.0 / 60.0,
    worldSize : {x: WORLD_WIDTH, y: WORLD_HEIGHT, z: WORLD_DEPTH},
    paused: false,
    objects: [],				
};

var gRunning = true; // Track if simulation is running

var restitution = {
    ball: 0,
    boundary: 1,
    floor: 0.7,
};

var boidRadius = 0.25; // Radius of each Boid
var boidProps = {
    minDistance: 5.0 * boidRadius, // Rule #1 - The distance to stay away from other Boids
    avoidFactor: 0.05, // Rule #1 -Adjust velocity by this %
    matchingFactor: 0.05, // Rule #2 - Adjust velocity by this %
    visualRange: 7.0 * boidRadius, // How far Boids can see each other
    centeringFactor: 0.0005, // Rule #3 - Adjust velocity by this %
    minSpeed: 2.0, // minimum speed to maintain
    maxSpeed: 8.0, // maximum speed limit
    //minSpeed: 5.0, // minimum speed to maintain
    //maxSpeed: 20.0, // maximum speed limit
    turnFactor: 0.05, // How strongly Boids turn back when near edge
    margin: 2.0, // Distance from boundary to start turning
    wireframe: false, // Render boids in wireframe mode
    material: 'phong' // Material type: 'basic', 'phong', 'standard', 'normal', 'toon', 'depth'
};

// Boid trail tracking variables
var gTrailEnabled = false; // Enable/disable trail tracking
var gTrailLength = 50; // Maximum number of trail points to store
var gTrailRadius = 0.5; // Multiplier for trail tube radius (relative to boid radius)
var gTrailBoidIndex = 1; // Index of boid to track (second boid in array)
var gTrailPositions = []; // Array to store trail positions
var gTrailMesh = null; // THREE.Mesh for the trail tube
var gTrailCapMesh = null; // THREE.Mesh for the disc cap at trail end
var gTrailUpdateCounter = 0; // Counter to limit trail updates
var gTrailUpdateFrequency = 1; // Update trail every N frames
var gTrailColorMode = 3; // 0=White, 1=Black, 2=B&W, 3=Color

// Boid geometry type
var gBoidGeometryType = 1; // 0=Sphere, 1=Cone, 2=Cylinder, 3=Box, 4=Tetrahedron, 5=Octahedron, 6=Dodecahedron, 7=Icosahedron, 8=Capsule, 9=Torus, 10=TorusKnot, 11=Plane, 12=Duck, 13=Fish, 14=Avocado
var gDuckTemplate = null; // Template duck model for boid geometry
var gFishTemplate = null; // Template fish model for boid geometry
var gAvocadoTemplate = null; // Template avocado model for boid geometry

// OBSTACLE CLASSES ---------------------------------------------------------------------

class BoxObstacle {
    constructor(width, height, depth, position, rotation) {
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.position = position.clone();
        this.rotation = rotation || { x: 0, y: 0, z: 0 };
        this.mesh = null;
        this.createMesh();
    }
    
    createMesh() {
        var geometry = new THREE.BoxGeometry(this.width, this.height, this.depth);
        var material = new THREE.MeshPhongMaterial({color: 0x00ff00, shininess: 100});
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.rotation.x = this.rotation.x;
        this.mesh.rotation.y = this.rotation.y;
        this.mesh.rotation.z = this.rotation.z;
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.userData.isDraggableBox = true;
        this.mesh.userData.boxObstacle = this;
        gThreeScene.add(this.mesh);
    }
    
    // Check if a point is inside the box
    // Returns distance to surface (negative if inside)
    getDistanceToSurface(point) {
        // Transform point to box local space
        const localPoint = point.clone().sub(this.position);
        
        // For simplicity, assuming no rotation for now
        // Calculate distances to each face
        const dx = Math.abs(localPoint.x) - this.width / 2;
        const dy = Math.abs(localPoint.y) - this.height / 2;
        const dz = Math.abs(localPoint.z) - this.depth / 2;
        
        // If inside the box (all distances negative)
        if (dx < 0 && dy < 0 && dz < 0) {
            // Return the largest (least negative) distance
            return Math.max(dx, dy, dz);
        }
        
        // If outside, return distance to nearest surface
        const maxDist = Math.max(dx, dy, dz);
        if (maxDist <= 0) {
            return Math.max(dx, dy, dz);
        }
        
        // Distance from outside point to box
        const outsideDx = Math.max(dx, 0);
        const outsideDy = Math.max(dy, 0);
        const outsideDz = Math.max(dz, 0);
        return Math.sqrt(outsideDx * outsideDx + outsideDy * outsideDy + outsideDz * outsideDz);
    }
    
    // Apply avoidance force to a boid
    applyAvoidance(boid, avoidanceStrength = 1.5) {
        const distance = this.getDistanceToSurface(boid.pos);
        const threshold = 5.0; // Start avoiding when within this distance
        
        if (distance < threshold) {
            // Calculate avoidance direction
            const localPoint = boid.pos.clone().sub(this.position);
            
            // Find closest face and push away from it
            const dx = Math.abs(localPoint.x) - this.width / 2;
            const dy = Math.abs(localPoint.y) - this.height / 2;
            const dz = Math.abs(localPoint.z) - this.depth / 2;
            
            const gradient = new THREE.Vector3();
            
            // Determine which axis is closest to the box surface
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);
            const absDz = Math.abs(dz);
            
            if (absDx <= absDy && absDx <= absDz) {
                // X face is closest
                gradient.x = Math.sign(localPoint.x);
            } else if (absDy <= absDx && absDy <= absDz) {
                // Y face is closest
                gradient.y = Math.sign(localPoint.y);
            } else {
                // Z face is closest
                gradient.z = Math.sign(localPoint.z);
            }
            
            // If inside or very close, use full gradient
            if (distance < 0 || absDx < 0.5 || absDy < 0.5 || absDz < 0.5) {
                // Multiple faces may contribute
                if (absDx < 0.5) gradient.x = Math.sign(localPoint.x) * (1.0 - absDx * 2);
                if (absDy < 0.5) gradient.y = Math.sign(localPoint.y) * (1.0 - absDy * 2);
                if (absDz < 0.5) gradient.z = Math.sign(localPoint.z) * (1.0 - absDz * 2);
            }
            
            const gradLen = gradient.length();
            if (gradLen > 0.001) {
                gradient.normalize();
            } else {
                return;
            }
            
            // Stronger avoidance when closer
            let strength;
            if (distance < 0) {
                // Inside the box - EMERGENCY EJECTION
                const penetrationDepth = -distance;
                strength = avoidanceStrength * 10.0 * (1.0 + penetrationDepth * 2.0);
            } else if (distance < 1.0) {
                // Very close - strong repulsion
                strength = avoidanceStrength * 5.0 * (1.0 - distance);
            } else {
                // Outside but within detection range
                strength = avoidanceStrength * (threshold - distance) / threshold;
            }
            
            boid.vel.x += gradient.x * strength;
            boid.vel.y += gradient.y * strength;
            boid.vel.z += gradient.z * strength;
        }
    }
    
    // Update box position
    updatePosition(newPosition) {
        this.position.copy(newPosition);
        if (this.mesh) {
            this.mesh.position.copy(newPosition);
        }
    }
}

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

class SphereObstacle {
    constructor(radius, position) {
        this.radius = radius;
        this.position = position.clone();
        this.mesh = null;
        this.createMesh();
    }
    
    createMesh() {
        var geometry = new THREE.SphereGeometry(this.radius, 32, 32);
        //var geometry = new THREE.TorusKnotGeometry(this.radius, this.radius * 0.4, 100, 16, 2, 3);
        //var material = new THREE.MeshPhongMaterial({color: 0xc6b1aa, shininess: 100});
        /*var material = new THREE.MeshPhongMaterial({
            color: 0xc6b1aa, 
            shininess: 100, 
            wireframe: boidProps.wireframe});*/
        var material = new THREE.MeshStandardMaterial({
            color: `${`hsl(20, 90%, 50%)`}`, 
            metalness: 0.6, 
            roughness: 0.5,
            wireframe: boidProps.wireframe});
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.userData.isDraggableSphere = true;
        this.mesh.userData.sphereObstacle = this;
        gThreeScene.add(this.mesh);
    }
    
    // Check if a point is inside the sphere
    // Returns distance to surface (negative if inside)
    getDistanceToSurface(point) {
        const distanceFromCenter = point.distanceTo(this.position);
        return distanceFromCenter - this.radius;
    }
    
    // Apply avoidance force to a boid
    applyAvoidance(boid, avoidanceStrength = 1.5) {
        const distance = this.getDistanceToSurface(boid.pos);
        const threshold = 3.0; // Start avoiding when within this distance
        
        if (distance < threshold) {
            // Calculate avoidance direction (away from sphere center)
            const gradient = boid.pos.clone().sub(this.position);
            const gradLen = gradient.length();
            
            if (gradLen > 0.001) {
                gradient.normalize();
            } else {
                // At exact center, push in any direction
                gradient.set(1, 0, 0);
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
    
    // Update sphere position
    updatePosition(newPosition) {
        this.position.copy(newPosition);
        if (this.mesh) {
            this.mesh.position.copy(newPosition);
        }
    }
}

class CylinderObstacle {
    constructor(radius, height, position, rotation, skipTori) {
        this.radius = radius;
        this.height = height;
        this.position = position.clone();
        this.rotation = rotation || { x: 0, y: 0, z: 0 };
        this.skipTori = skipTori || false; // Flag to skip creating decorative tori
        this.mesh = null;
        
        // Create the cylinder mesh
        this.createMesh();
    }
    
    createMesh() {
        // Create fluted column with true semicircular half-pipe grooves carved INTO surface
        const numFlutes = 20; // Number of vertical grooves
        const fluteDepth = 0.15; // Maximum depth to carve (not full radius)
        const fluteWidthFraction = 0.9; // Fraction of section to carve (leaves ridges between)
        const radialSegments = numFlutes * 16; // Very high segment count for smooth semicircles
        const heightSegments = 25; // Vertical segments per section for smooth fluting
        
        // Create 3 sections stacked vertically
        const numSections = 3;
        const groutThickness = 0.05;
        const totalGroutHeight = groutThickness * (numSections - 1);
        const sectionHeight = (this.height - totalGroutHeight) / numSections;
        
        // Store section height for extended avoidance calculations
        this.sectionHeight = sectionHeight;
        
        this.columnSections = [];
        this.groutLayers = [];
        
        // Material for column sections
        var columnMaterial = new THREE.MeshStandardMaterial({
            color: `hsl(22, 8%, 74%)`,
            roughness: 1.0
        });
        
        // Material for grout layers
        var groutMaterial = new THREE.MeshStandardMaterial({
            color: `hsl(0, 0%, 45%)`,
            roughness: 0.8
        });
        
        for (let section = 0; section < numSections; section++) {
            // Create custom geometry with flutes for this section
            const geometry = new THREE.CylinderGeometry(
                this.radius, 
                this.radius, 
                sectionHeight, 
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
            
            const sectionMesh = new THREE.Mesh(geometry, columnMaterial);
            
            // Calculate Y position for this section (start on top of disc baseplate)
            const bottomY = this.position.y - this.height / 2;
            const columnBaseY = bottomY + 1.4; // Top of disc baseplate (disc at bottomY + 1.3, disc height 0.2)
            const sectionY = columnBaseY + (section * (sectionHeight + groutThickness)) + sectionHeight / 2;
            
            sectionMesh.position.set(this.position.x, sectionY + 0.03, this.position.z);
            sectionMesh.rotation.x = this.rotation.x;
            sectionMesh.rotation.y = this.rotation.y;
            sectionMesh.rotation.z = this.rotation.z;
            sectionMesh.castShadow = true;
            sectionMesh.receiveShadow = true;
            sectionMesh.flatShading = false;
            sectionMesh.userData.isDraggableCylinder = true;
            sectionMesh.userData.cylinderObstacle = this;
            gThreeScene.add(sectionMesh);
            this.columnSections.push(sectionMesh);
            
            // Create grout layer between sections (except after last section)
            if (section < numSections - 1) {
                const groutGeometry = new THREE.CylinderGeometry(
                    this.radius * 0.94,
                    this.radius * 0.94,
                    groutThickness,
                    32
                );
                const groutMesh = new THREE.Mesh(groutGeometry, groutMaterial);
                const columnBaseY = bottomY + 1.4; // Top of disc baseplate
                const groutY = columnBaseY + ((section + 1) * sectionHeight) + (section * groutThickness) + groutThickness / 2;
                groutMesh.position.set(this.position.x, groutY + 0.03, this.position.z);
                groutMesh.rotation.copy(sectionMesh.rotation);
                groutMesh.castShadow = true;
                groutMesh.receiveShadow = true;
                groutMesh.userData.isDraggableCylinder = true;
                groutMesh.userData.cylinderObstacle = this;
                gThreeScene.add(groutMesh);
                this.groutLayers.push(groutMesh);
            }
        }
        
        // Store reference to first section as 'mesh' for backward compatibility
        this.mesh = this.columnSections[0];
        
        // Create two tori on top of column (unless skipTori flag is set)
        if (!this.skipTori) {
            const torusRadius = this.radius * 0.7; // Major radius
            const tubeRadius = 0.2; // Minor radius (tube thickness)
            const tiltAngle = Math.PI / 6; // 30 degrees tilt from horizontal
            
            // Calculate top of column position
            const columnTopY = this.position.y + 9.23;
            
            // Torus material
            const torusMaterial = new THREE.MeshStandardMaterial({
                color: 0xd4af37, // Gold color
                metalness: 0.7,
                roughness: 0.3
            });
        
            const toriShiftY = Math.sin(tiltAngle) * (torusRadius - 1.6 * tubeRadius);
        // Create first torus (tilted one way) with a parent group for Y rotation
        const torusGroup1 = new THREE.Group();
        torusGroup1.position.set(this.position.x, columnTopY - toriShiftY, this.position.z);
        gThreeScene.add(torusGroup1);
        
        const torusGeometry1 = new THREE.TorusGeometry(torusRadius, tubeRadius, 32, 64);
        const torus1 = new THREE.Mesh(torusGeometry1, torusMaterial);
        torus1.rotation.x = 0.5 * Math.PI + tiltAngle;
        torus1.castShadow = true;
        torus1.receiveShadow = true;
        torusGroup1.add(torus1);
        gTori.push(torusGroup1);
        
        // Create second torus (tilted opposite way) with a parent group for Y rotation
        const torusGroup2 = new THREE.Group();
        torusGroup2.position.set(this.position.x, columnTopY + 2 * toriShiftY, this.position.z);
        gThreeScene.add(torusGroup2);
        
        const torusGeometry2 = new THREE.TorusGeometry(torusRadius, tubeRadius, 32, 64);
        const torus2 = new THREE.Mesh(torusGeometry2, torusMaterial);
        torus2.rotation.x = 0.5 * Math.PI - tiltAngle;
        torus2.castShadow = true;
        torus2.receiveShadow = true;
        torusGroup2.add(torus2);
        gTori.push(torusGroup2);
        
        // Store references to tori groups for updating position
        this.toriGroups = [torusGroup1, torusGroup2];
        this.tiltAngle = tiltAngle;
        this.torusRadius = torusRadius;
        this.tubeRadius = tubeRadius;
        } else {
            // No tori for this obstacle
            this.toriGroups = [];
        }
        
        // Create conical pedestal
        const conicalPedestalRadius = this.radius * 1.5;
        const conicalPedestalHeight = 3; 
        const conicalPedestalGeometry = new THREE.ConeGeometry(conicalPedestalRadius, conicalPedestalHeight, 64);
        // Create clipping plane to cut off bottom portion of cone (y = 0.0 to 0.95)
        const clippingPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.95);
        const conicalPedestalMaterial = new THREE.MeshStandardMaterial({
            color: `hsl(25, 10%, 30%)`,
            roughness: 0.5,
            clippingPlanes: [clippingPlane],
            clipShadows: true
        });
        this.conicalPedestalMesh = new THREE.Mesh(conicalPedestalGeometry, conicalPedestalMaterial);
        this.conicalPedestalMesh.position.copy(this.position);
        this.conicalPedestalMesh.position.y = (this.position.y - this.height / 2) + 0.5 * conicalPedestalHeight + 0.28; // Bottom at y=0
        this.conicalPedestalMesh.rotation.copy(this.mesh.rotation);
        this.conicalPedestalMesh.castShadow = true;
        this.conicalPedestalMesh.receiveShadow = true;
        this.conicalPedestalMesh.userData.isDraggableCylinder = true;
        this.conicalPedestalMesh.userData.cylinderObstacle = this;
        gThreeScene.add(this.conicalPedestalMesh);

        // Create round disc baseplate between column and pedestal
        const discRadius = this.radius * 1.02; // Larger than column, smaller than pedestal
        const discHeight = 0.2;
        const discGeometry = new THREE.CylinderGeometry(discRadius, discRadius, discHeight, 64);
        const discMaterial = new THREE.MeshStandardMaterial({
            color: `hsl(25, 10%, 30%)`,
            roughness: 0.5
        });
        this.discMesh = new THREE.Mesh(discGeometry, discMaterial);
        this.discMesh.position.copy(this.position);
        this.discMesh.position.y = (this.position.y - this.height / 2) + 1.3; // On top of pedestal
        this.discMesh.rotation.copy(this.mesh.rotation);
        this.discMesh.castShadow = true;
        this.discMesh.receiveShadow = true;
        this.discMesh.userData.isDraggableCylinder = true;
        this.discMesh.userData.cylinderObstacle = this;
        gThreeScene.add(this.discMesh);

        // add square pedestal
        const pedestalSize = this.radius * 2.5;
        const pedestalHeight = 1;
        const pedestalGeometry = new THREE.BoxGeometry(pedestalSize, pedestalHeight, pedestalSize);
        const pedestalMaterial = new THREE.MeshStandardMaterial({
            color: `hsl(25, 10%, 40%)`,
            roughness: 0.5
        });
        this.pedestalMesh = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
        this.pedestalMesh.position.copy(this.position);
        this.pedestalMesh.position.y = 0.5 * pedestalHeight; // Bottom at y=0
        this.pedestalMesh.rotation.copy(this.mesh.rotation);
        this.pedestalMesh.castShadow = true;
        this.pedestalMesh.receiveShadow = true;
        this.pedestalMesh.userData.isDraggableCylinder = true;
        this.pedestalMesh.userData.cylinderObstacle = this;
        gThreeScene.add(this.pedestalMesh);
    }
    
    // Check if a point is inside the cylinder
    // Returns distance to surface (negative if inside solid)
    getDistanceToSurface(point) {
        // Transform point to cylinder local space
        const localPoint = point.clone().sub(this.position);
        
        // Distance from cylinder axis (Y axis)
        const radialDist = Math.sqrt(localPoint.x * localPoint.x + localPoint.z * localPoint.z);
        
        // Distance from cylinder caps - extend height by one section for boid avoidance
        const extendedHeight = this.height + (this.sectionHeight || 0);
        const halfHeight = extendedHeight / 2;
        const verticalDist = Math.abs(localPoint.y) - halfHeight;
        
        // Add avoidance region above column where tori are located (if tori exist)
        if (!this.skipTori && localPoint.y > halfHeight) {
            // Tori region extends from top of column up about 2.5 units
            const toriRegionHeight = 5;
            const toriRegionTop = halfHeight + toriRegionHeight;
            
            // Tori have larger radius than column
            const toriRadius = this.radius * 1.0; 
            
            // Check if point is in tori region
            if (localPoint.y <= toriRegionTop && radialDist < toriRadius) {
                // Inside tori avoidance volume
                const distToToriWall = radialDist - toriRadius;
                const distToToriTop = localPoint.y - toriRegionTop;
                return Math.max(distToToriWall, distToToriTop);
            }
        }
        
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
        const threshold = 3.0; // Start avoiding when within this distance
        
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
        
        // Update all column sections and grout layers
        const numSections = this.columnSections.length;
        const groutThickness = 0.05;
        const totalGroutHeight = groutThickness * (numSections - 1);
        const sectionHeight = (this.height - totalGroutHeight) / numSections;
        const bottomY = newPosition.y - this.height / 2;
        const columnBaseY = bottomY + 1.4; // Top of disc baseplate
        
        for (let section = 0; section < numSections; section++) {
            const sectionY = columnBaseY + (section * (sectionHeight + groutThickness)) + sectionHeight / 2;
            this.columnSections[section].position.set(newPosition.x, sectionY + 0.03, newPosition.z);
            
            // Update grout layer (except after last section)
            if (section < numSections - 1) {
                const groutY = columnBaseY + ((section + 1) * sectionHeight) + (section * groutThickness) + groutThickness / 2;
                this.groutLayers[section].position.set(newPosition.x, groutY + 0.03, newPosition.z);
            }
        }
        
        if (this.discMesh) {
            this.discMesh.position.set(newPosition.x, bottomY + 1.3, newPosition.z);
        }
        if (this.conicalPedestalMesh) {
            const conicalPedestalHeight = 3;
            this.conicalPedestalMesh.position.set(newPosition.x, bottomY + 0.5 * conicalPedestalHeight + 0.28, newPosition.z);
        }
        if (this.pedestalMesh) {
            const pedestalHeight = 1;
            this.pedestalMesh.position.set(newPosition.x, 0.5 * pedestalHeight, newPosition.z);
        }
        
        // Update tori positions
        if (this.toriGroups && this.toriGroups.length === 2) {
            const columnTopY = newPosition.y + 9.23;
            const toriShiftY = Math.sin(this.tiltAngle) * (this.torusRadius - 1.6 * this.tubeRadius);
            this.toriGroups[0].position.set(newPosition.x, columnTopY - toriShiftY, newPosition.z);
            this.toriGroups[1].position.set(newPosition.x, columnTopY + 2 * toriShiftY, newPosition.z);
        }
    }
}

var gObstacles = []; // Global array to hold all obstacles

class Lamp {
    constructor(lightPosition, lightTarget, lampId) {
        this.lampId = lampId;
        this.angle = 0.0; // Start at zero, cone is already oriented correctly
        this.assemblyRotation = 0.0; // Assembly rotation around Y axis
        
        // Create lamp rotatable group
        this.rotatableGroup = new THREE.Group();
        
        // Create spotlight
        this.spotlight = new THREE.SpotLight(0xffffff, 0.8);
        this.spotlight.angle = Math.PI / 5;
        this.spotlight.penumbra = 0.2;
        this.spotlight.position.copy(lightPosition);
        this.spotlight.castShadow = true;
        this.spotlight.shadow.camera.near = 0.5;
        this.spotlight.shadow.camera.far = 70;
        this.spotlight.shadow.mapSize.width = 2048;
        this.spotlight.shadow.mapSize.height = 2048;

        // Configure shadow camera to exclude layer 2 (lamp cones will be on layer 2)
        this.spotlight.shadow.camera.layers.set(0); // Only see layer 0
        this.spotlight.target.position.copy(lightTarget);
        gThreeScene.add(this.spotlight.target);
        gThreeScene.add(this.spotlight);
        
        // Position pole directly under the light position
        var poleBasePosition = new THREE.Vector3(lightPosition.x, 0, lightPosition.z);
        
        // Store pivot point (pin center)
        var poleHeight = lightPosition.y - 0.3;
        this.initialHeight = poleHeight;
        var discRadius = 0.25;
        this.pivot = new THREE.Vector3(poleBasePosition.x, poleHeight + 0.9 * discRadius, poleBasePosition.z);
        
        // Add hollow cone visual at spotlight source (lamp shield)
        this.coneHeight = 1.5;
        var coneRadius = Math.tan(this.spotlight.angle) * this.coneHeight;
        
        // Create truncated cone (frustum) by using cylinder with different radii
        var tipRadius = coneRadius * 0.15; // Small opening at tip (15% of base)
        var coneGeometry = new THREE.CylinderGeometry(tipRadius, coneRadius, this.coneHeight, 64, 1, true);
        
        // Outer cone - normal yellow
        var outerConeMaterial = new THREE.MeshStandardMaterial({
            color: 0xe0e0d1,
            side: THREE.FrontSide,
            roughness: 0.4,
            metalness: 0.4,
            colorWrite: true,
            depthWrite: true
        });
        this.outerCone = new THREE.Mesh(coneGeometry, outerConeMaterial);
        this.outerCone.userData.isLampCone = true;
        this.outerCone.userData.lampId = lampId;
        this.outerCone.renderOrder = 1;
        this.outerCone.castShadow = true;
        this.outerCone.receiveShadow = false;
        // Place on layers 0 and 2 - visible to camera but excluded from own spotlight shadow
        this.outerCone.layers.enable(0);
        this.outerCone.layers.enable(2);
        
        // Orient cone to point away from spotlight target (backwards like a lamp shield)
        var direction = lightPosition.clone().sub(lightTarget).normalize();
        var up = new THREE.Vector3(0, 1, 0);
        this.outerCone.quaternion.setFromUnitVectors(up, direction);
        
        // Position cone offset from light - move further away to avoid clipping hardware
        var coneOffset = direction.clone().multiplyScalar(this.coneHeight * 0.7);
        this.outerCone.position.copy(lightPosition).sub(coneOffset);
        this.rotatableGroup.add(this.outerCone);
        
        // Store initial position and orientation for absolute rotation calculations
        this.outerCone.userData.initialPosition = this.outerCone.position.clone();
        this.outerCone.userData.initialQuaternion = this.outerCone.quaternion.clone();
        
        // Add cylindrical plug to close the truncated tip (with thickness)
        // Use two cylinders: inner (bright white, FrontSide) and outer (brass, FrontSide)
        var tipCapThickness = 0.05;
        var outerCapThickness = 0.15; // Thicker to seal the gap better
        var tipCapGeometry = new THREE.CylinderGeometry(tipRadius * 1.15, tipRadius * 1.15, tipCapThickness, 32);
        var outerCapGeometry = new THREE.CylinderGeometry(tipRadius * 1.15, tipRadius * 1.15, outerCapThickness, 32);
        
        // Inner cylinder: bright white, visible from inside (FrontSide)
        // Use same material properties as inner cone for consistency
        var tipCapInnerMaterial = new THREE.MeshPhongMaterial({
            color: 0xffff00,
            side: THREE.FrontSide,
            shininess: 30,
            emissive: 0xffffee,
            emissiveIntensity: 0.8,
            colorWrite: true,
            depthWrite: true
        });
        this.coneTipCapInner = new THREE.Mesh(tipCapGeometry, tipCapInnerMaterial);
        this.coneTipCapInner.renderOrder = 3;
        this.coneTipCapInner.castShadow = false;
        this.coneTipCapInner.receiveShadow = false;
        
        // Outer cylinder: brass, visible from outside (FrontSide)
        var tipCapOuterMaterial = new THREE.MeshPhongMaterial({
            color: 0xffc71e,
            side: THREE.FrontSide,
            shininess: 30
        });
        this.coneTipCapOuter = new THREE.Mesh(outerCapGeometry, tipCapOuterMaterial);
        this.coneTipCapOuter.renderOrder = 1;
        this.coneTipCapOuter.castShadow = true;
        this.coneTipCapOuter.receiveShadow = true;
        
        // Orient both cylinders perpendicular to cone axis
        // CylinderGeometry default axis is Y-axis, need to align with cone axis (direction)
        var yAxis = new THREE.Vector3(0, 1, 0);
        var directionNormalized = direction.clone().normalize();
        this.coneTipCapInner.quaternion.setFromUnitVectors(yAxis, directionNormalized);
        this.coneTipCapOuter.quaternion.copy(this.coneTipCapInner.quaternion);
        
        // Position both cylinders at the narrow end of the frustum
        var coneCenter = lightPosition.clone().sub(coneOffset);
        var capPosition = coneCenter.clone().add(directionNormalized.clone().multiplyScalar(this.coneHeight / 2));
        
        // Offset inner cylinder further inward (toward bulb) to avoid z-fighting with outer
        var innerOffset = directionNormalized.clone().multiplyScalar(-0.08);
        this.coneTipCapInner.position.copy(capPosition).add(innerOffset);
        
        // Offset outer cylinder slightly outward to seal gap and avoid intersecting with cone
        var outerOffset = directionNormalized.clone().multiplyScalar(0.01);
        this.coneTipCapOuter.position.copy(capPosition).add(outerOffset);
        
        this.rotatableGroup.add(this.coneTipCapInner);
        this.rotatableGroup.add(this.coneTipCapOuter);
        
        // Store initial position and orientation for cap cylinders
        this.coneTipCapInner.userData.initialPosition = this.coneTipCapInner.position.clone();
        this.coneTipCapInner.userData.initialQuaternion = this.coneTipCapInner.quaternion.clone();
        this.coneTipCapOuter.userData.initialPosition = this.coneTipCapOuter.position.clone();
        this.coneTipCapOuter.userData.initialQuaternion = this.coneTipCapOuter.quaternion.clone();
        
        // Add small point light at tip to illuminate plug interior
        this.tipLight = new THREE.PointLight(0xffffee, 2.0, 0.5);
        this.tipLight.position.copy(this.coneTipCapInner.position);
        this.rotatableGroup.add(this.tipLight);
        this.tipLight.userData.initialPosition = this.tipLight.position.clone();
        
        this.rotatableGroup.add(this.outerCone);
        
        // Store initial position and orientation for absolute rotation calculations
        this.outerCone.userData.initialPosition = this.outerCone.position.clone();
        this.outerCone.userData.initialQuaternion = this.outerCone.quaternion.clone();
        
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
        this.innerCone = new THREE.Mesh(coneGeometry, innerConeMaterial);
        this.innerCone.userData.isLampCone = true;
        this.innerCone.userData.lampId = lampId;
        this.innerCone.renderOrder = 1;
        this.innerCone.castShadow = false;
        this.innerCone.receiveShadow = false;
        // Place on layers 0 and 2
        this.innerCone.layers.enable(0);
        this.innerCone.layers.enable(2);
        this.innerCone.quaternion.setFromUnitVectors(up, direction);
        this.innerCone.position.copy(lightPosition).sub(coneOffset);
        this.rotatableGroup.add(this.innerCone);
        
        // Store initial position and orientation
        this.innerCone.userData.initialPosition = this.innerCone.position.clone();
        this.innerCone.userData.initialQuaternion = this.innerCone.quaternion.clone();
        
        // Add bright white sphere to represent light source
        var lightBulbGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        var lightBulbMaterial = new THREE.MeshBasicMaterial({color: 0xffffff});
        this.bulb = new THREE.Mesh(lightBulbGeometry, lightBulbMaterial);
        // Position bulb at center of cone (midpoint along cone height)
        this.bulb.position.copy(lightPosition).sub(coneOffset);
        this.rotatableGroup.add(this.bulb);
        
        // Store initial position
        this.bulb.userData.initialPosition = this.bulb.position.clone();
        this.bulb.userData.initialQuaternion = new THREE.Quaternion();
        
        // Add the rotatable group to scene
        gThreeScene.add(this.rotatableGroup);
        
        // Add telescoping lamp pole with 4 sections
        var baseRadius = 0.18; // Largest (bottom) section
        var radiusDecrement = 0.03; // Each section is 0.02 smaller
        var sectionCount = 4;
        var minSectionHeight = 0.5; // Minimum collapsed height per section
        var initialSectionHeight = poleHeight / sectionCount;
        var maxExtensionPerSection = 3.75; // Each section can extend by this much
        
        this.poleSections = [];
        this.poleBasePosition = poleBasePosition;
        this.minSectionHeight = minSectionHeight;
        
        var poleMaterial = new THREE.MeshPhongMaterial({color: 0x333333, shininess: 50});
        
        var currentY = 0;
        for (let i = 0; i < sectionCount; i++) {
            var sectionRadius = baseRadius - i * radiusDecrement; // i=0 is bottom (largest), i=3 is top (smallest)
            var sectionGeometry = new THREE.CylinderGeometry(sectionRadius, sectionRadius, initialSectionHeight, 16);
            var section = new THREE.Mesh(sectionGeometry, poleMaterial);
            section.position.set(poleBasePosition.x, currentY + initialSectionHeight / 2, poleBasePosition.z);
            section.castShadow = true;
            section.receiveShadow = true;
            section.userData.isLampRotation = true;
            section.userData.lampId = lampId;
            section.userData.lampInstance = this;
            section.userData.sectionIndex = i;
            section.userData.maxHeight = initialSectionHeight + maxExtensionPerSection;
            section.renderOrder = 0;
            gThreeScene.add(section);
            this.poleSections.push(section);
            currentY += initialSectionHeight;
        }

        // Add collars to each section
        this.poleCollars = [];
        currentY = 0;
        var collarMaterial = new THREE.MeshPhongMaterial({color: 0xffffff, shininess: 50});
        for (let i = 0; i < sectionCount - 1; i++) {
            var sectionRadius = baseRadius - i * radiusDecrement;
            var collarGeometry = new THREE.CylinderGeometry(sectionRadius, 1.2 * sectionRadius, 0.1 * initialSectionHeight, 16);
            var collar = new THREE.Mesh(collarGeometry, collarMaterial);
            collar.position.set(poleBasePosition.x, currentY + initialSectionHeight, poleBasePosition.z);
            collar.castShadow = true;
            collar.receiveShadow = true;
            collar.userData.isLampRotation = true;
            collar.userData.lampId = lampId;
            collar.userData.lampInstance = this;
            collar.userData.sectionIndex = i;
            collar.renderOrder = 0;
            gThreeScene.add(collar);
            this.poleCollars.push(collar);
            currentY += initialSectionHeight;
        }
        
        // Store reference to topmost section as 'pole' for backward compatibility
        this.pole = this.poleSections[sectionCount - 1];
        
        // Add invisible larger cylinder around upper pole for easier clicking (exclude lower section)
        var poleHitAreaRadius = baseRadius * 4;
        var poleHitHeight = poleHeight * 0.6; // Only upper 60% of pole
        var poleHitGeometry = new THREE.CylinderGeometry(poleHitAreaRadius, poleHitAreaRadius, poleHitHeight, 8);
        var poleHitMaterial = new THREE.MeshBasicMaterial({visible: false});
        this.poleHitArea = new THREE.Mesh(poleHitGeometry, poleHitMaterial);
        // Position in upper portion of pole
        var poleHitYPosition = poleHeight - poleHitHeight / 2;
        this.poleHitArea.position.set(poleBasePosition.x, poleHitYPosition, poleBasePosition.z);
        this.poleHitArea.userData.isLampRotation = true;
        this.poleHitArea.userData.lampId = lampId;
        this.poleHitArea.userData.lampInstance = this;
        gThreeScene.add(this.poleHitArea);
        
        // Add yellow sleeve where pole connects to lamp shade
        var sleeveHeight = 1.05;
        var sleeveRadius = 0.7 * baseRadius ;
        var sleeveGeometry = new THREE.CylinderGeometry(sleeveRadius, sleeveRadius, sleeveHeight, 32);
        var sleeveMaterial = new THREE.MeshPhongMaterial({color: 0xcc9900, shininess: 30});
        this.sleeve = new THREE.Mesh(sleeveGeometry, sleeveMaterial);
        this.sleeve.position.set(poleBasePosition.x, poleHeight - 0.5 * sleeveHeight, poleBasePosition.z);
        this.sleeve.castShadow = true;
        this.sleeve.receiveShadow = true;
        this.sleeve.userData.isLampHeight = true;
        this.sleeve.userData.lampId = lampId;
        this.sleeve.userData.lampInstance = this;
        this.sleeve.renderOrder = 0;
        gThreeScene.add(this.sleeve);

        // Add outer discs at top of pole for lamp angle adjustment
        this.discs = [];
        var discThickness = 0.10;
        var discGeometry = new THREE.CylinderGeometry(discRadius, discRadius, discThickness, 32);
        var discMaterial = new THREE.MeshPhongMaterial({color: 0xcc9900, shininess: 30});
        var disc = new THREE.Mesh(discGeometry, discMaterial);
        disc.position.set(poleBasePosition.x + 0.07, poleHeight + 0.9 * discRadius, poleBasePosition.z - 0.05);
        disc.rotation.y = Math.PI * 1.25;
        disc.rotation.z = Math.PI / 2;
        disc.castShadow = true;
        disc.receiveShadow = true;
        gThreeScene.add(disc);
        this.discs.push(disc);

        // Add second outer disc
        var disc2 = new THREE.Mesh(discGeometry, discMaterial);
        disc2.position.set(poleBasePosition.x - 0.07, poleHeight + 0.9 * discRadius, poleBasePosition.z + 0.05);
        disc2.rotation.y = Math.PI * 1.25;
        disc2.rotation.z = Math.PI / 2;
        disc2.castShadow = true;
        disc2.receiveShadow = true;
        gThreeScene.add(disc2);
        this.discs.push(disc2);

        // Add inner disc
        var innerDiscRadius = discRadius * 1.1;
        var innerDiscGeometry = new THREE.CylinderGeometry(innerDiscRadius, innerDiscRadius, discThickness * 0.8, 32);
        var innerDiscMaterial = new THREE.MeshPhongMaterial({color: 0xffc71e, shininess: 30});
        var innerDisc = new THREE.Mesh(innerDiscGeometry, innerDiscMaterial);
        innerDisc.position.set(poleBasePosition.x, poleHeight + 0.9 * discRadius, poleBasePosition.z);
        innerDisc.rotation.y = Math.PI * 1.25;
        innerDisc.rotation.z = Math.PI / 2;
        innerDisc.castShadow = true;
        innerDisc.receiveShadow = true;
        gThreeScene.add(innerDisc);
        this.discs.push(innerDisc);

        // Add pin through center discs
        var pinHeight = 0.3;
        var pinRadius = 0.05;
        var pinGeometry = new THREE.CylinderGeometry(pinRadius, pinRadius, pinHeight, 16);
        var pinMaterial = new THREE.MeshPhongMaterial({color: 0x888888, shininess: 80});
        this.pin = new THREE.Mesh(pinGeometry, pinMaterial);
        this.pin.position.set(poleBasePosition.x, poleHeight + 0.9 * discRadius, poleBasePosition.z);
        this.pin.rotation.x = Math.PI * 1.5;
        this.pin.rotation.z = Math.PI * 0.75;
        this.pin.castShadow = true;
        this.pin.receiveShadow = true;
        gThreeScene.add(this.pin);
        
        // Calculate pin axis for lamp rotation
        this.pinAxis = new THREE.Vector3(0, 1, 0);
        var pinRotationMatrix = new THREE.Matrix4();
        pinRotationMatrix.makeRotationFromEuler(new THREE.Euler(this.pin.rotation.x, this.pin.rotation.y, this.pin.rotation.z, 'XYZ'));
        this.pinAxis.applyMatrix4(pinRotationMatrix);
        this.pinAxis.normalize();
       
        // Add pedestal base
        var pedestalRadius = 1.6;
        var pedestalHeight = 0.2;
        var pedestalGeometry = new THREE.CylinderGeometry(pedestalRadius, pedestalRadius, pedestalHeight, 32);
        var pedestalMaterial = new THREE.MeshStandardMaterial({
            color: 0x818181, 
            metalness: 0.5,
            roughness: 0.5
        });
        this.basePlate = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
        
        // Position pedestal off-center toward room center
        var offsetDistance = pedestalRadius * 0.4;
        // Calculate direction toward room center (0,0) from pole position
        var dirToCenter = new THREE.Vector3(-poleBasePosition.x, 0, -poleBasePosition.z).normalize();
        var baseOffsetX = dirToCenter.x * offsetDistance;
        var baseOffsetZ = dirToCenter.z * offsetDistance;
        
        this.basePlate.position.set(poleBasePosition.x + baseOffsetX, pedestalHeight / 2, poleBasePosition.z + baseOffsetZ);
        this.basePlate.castShadow = true;
        this.basePlate.receiveShadow = true;
        this.basePlate.userData.isLampBase = true;
        this.basePlate.userData.lampId = lampId;
        this.basePlate.userData.lampInstance = this;
        gThreeScene.add(this.basePlate);
        
        // Add status indicator light in center of base
        var indicatorRadius = 0.15;
        var indicatorHeight = 0.1;
        var indicatorGeometry = new THREE.CylinderGeometry(indicatorRadius, indicatorRadius, indicatorHeight, 16);
        var indicatorMaterial = new THREE.MeshPhongMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.8,
            shininess: 100
        });
        this.statusIndicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
        this.statusIndicator.position.set(
            poleBasePosition.x + baseOffsetX,
            pedestalHeight + indicatorHeight / 2,
            poleBasePosition.z + baseOffsetZ
        );
        this.statusIndicator.castShadow = false;
        this.statusIndicator.receiveShadow = true;
        this.statusIndicator.userData.isNonInteractive = true; // Skip in raycasting
        gThreeScene.add(this.statusIndicator);
        
        // Add black collar around status indicator
        var collarHeight = indicatorHeight * 0.7; // 70% of indicator height so light sticks out
        var collarRadius = indicatorRadius * 1.4; // Slightly larger than indicator
        var collarGeometry = new THREE.CylinderGeometry(collarRadius, collarRadius, collarHeight, 16);
        var collarMaterial = new THREE.MeshPhongMaterial({
            color: 0x000000,
            shininess: 20
        });
        this.statusCollar = new THREE.Mesh(collarGeometry, collarMaterial);
        this.statusCollar.position.set(
            poleBasePosition.x + baseOffsetX,
            pedestalHeight + collarHeight / 2,
            poleBasePosition.z + baseOffsetZ
        );
        this.statusCollar.castShadow = false;
        this.statusCollar.receiveShadow = true;
        this.statusCollar.userData.isNonInteractive = true; // Skip in raycasting
        gThreeScene.add(this.statusCollar);
        
        // Initialize status indicator to match spotlight state (green if on, red if off)
        const isOn = this.spotlight.visible;
        this.statusIndicator.material.color.setHex(isOn ? 0x00ff00 : 0xff0000);
        this.statusIndicator.material.emissive.setHex(isOn ? 0x00ff00 : 0xff0000);
        
        // Store base center for lamp assembly rotation
        this.baseCenter = new THREE.Vector3(poleBasePosition.x + baseOffsetX, 0, poleBasePosition.z + baseOffsetZ);
    }
    
    rotateLamp() {
        // Use the pin's axis for rotation
        const rotationAxis = this.pinAxis.clone();
        
        // Apply absolute rotation from initial state based on current lamp angle
        this.rotatableGroup.children.forEach(child => {
            if (!child.userData.initialPosition || !child.userData.initialQuaternion) return;
            
            // Reset to initial position and orientation
            child.position.copy(child.userData.initialPosition);
            child.quaternion.copy(child.userData.initialQuaternion);
            
            // Apply rotation around pivot using current lamp angle
            child.position.sub(this.pivot);
            child.position.applyAxisAngle(rotationAxis, this.angle);
            child.position.add(this.pivot);
            
            // Rotate orientation
            child.rotateOnWorldAxis(rotationAxis, this.angle);
        });
        
        // Update spotlight position and target
        const bulbWorldPos = new THREE.Vector3();
        this.bulb.getWorldPosition(bulbWorldPos);
        this.spotlight.position.copy(bulbWorldPos);
        
        // Get the cone's actual direction from its world quaternion
        const coneWorldQuaternion = new THREE.Quaternion();
        this.outerCone.getWorldQuaternion(coneWorldQuaternion);
        
        // The cone points away from target (backward like a shield)
        // So spotlight direction is opposite: use negative Y axis
        const coneDirection = new THREE.Vector3(0, -1, 0);
        coneDirection.applyQuaternion(coneWorldQuaternion);
        
        // Set spotlight target based on cone direction
        this.spotlight.target.position.copy(bulbWorldPos).add(coneDirection.multiplyScalar(10));
    }
    
    translateAssembly(deltaX, deltaZ) {
        const translation = new THREE.Vector3(deltaX, 0, deltaZ);
        
        // Translate all components
        this.basePlate.position.add(translation);
        this.statusIndicator.position.add(translation);
        this.statusCollar.position.add(translation);
        this.baseCenter.add(translation);
        
        // Translate all pole sections
        this.poleSections.forEach(section => {
            section.position.add(translation);
        });
        
        // Translate all collars
        this.poleCollars.forEach(collar => {
            collar.position.add(translation);
        });
        
        // Translate hit area
        this.poleHitArea.position.add(translation);
        
        this.sleeve.position.add(translation);
        
        this.discs.forEach(disc => {
            disc.position.add(translation);
        });
        
        this.pin.position.add(translation);
        this.pivot.add(translation);
        
        // Translate lamp group children
        this.rotatableGroup.children.forEach(child => {
            child.position.add(translation);
            if (child.userData.initialPosition) {
                child.userData.initialPosition.add(translation);
            }
        });
        
        // Translate spotlight and target
        this.spotlight.position.add(translation);
        this.spotlight.target.position.add(translation);
    }
    
    rotateAssembly(deltaAngle) {
        this.assemblyRotation += deltaAngle;
        
        const axis = new THREE.Vector3(0, 1, 0);
        const center = this.baseCenter;
        
        // Rotate all pole sections
        this.poleSections.forEach(section => {
            const sectionPos = section.position.clone().sub(center);
            sectionPos.applyAxisAngle(axis, deltaAngle);
            section.position.copy(sectionPos.add(center));
        });
        
        // Rotate all collars
        this.poleCollars.forEach(collar => {
            const collarPos = collar.position.clone().sub(center);
            collarPos.applyAxisAngle(axis, deltaAngle);
            collar.position.copy(collarPos.add(center));
        });
        
        // Rotate hit area
        const hitAreaPos = this.poleHitArea.position.clone().sub(center);
        hitAreaPos.applyAxisAngle(axis, deltaAngle);
        this.poleHitArea.position.copy(hitAreaPos.add(center));
        
        // Rotate sleeve
        const sleevePos = this.sleeve.position.clone().sub(center);
        sleevePos.applyAxisAngle(axis, deltaAngle);
        this.sleeve.position.copy(sleevePos.add(center));
        
        // Rotate status indicator
        const indicatorPos = this.statusIndicator.position.clone().sub(center);
        indicatorPos.applyAxisAngle(axis, deltaAngle);
        this.statusIndicator.position.copy(indicatorPos.add(center));
        
        // Rotate status collar
        const collarPos = this.statusCollar.position.clone().sub(center);
        collarPos.applyAxisAngle(axis, deltaAngle);
        this.statusCollar.position.copy(collarPos.add(center));
        
        // Rotate discs
        this.discs.forEach(disc => {
            const discPos = disc.position.clone().sub(center);
            discPos.applyAxisAngle(axis, deltaAngle);
            disc.position.copy(discPos.add(center));
            disc.rotateOnWorldAxis(axis, deltaAngle);
        });
        
        // Rotate pin
        const pinPos = this.pin.position.clone().sub(center);
        pinPos.applyAxisAngle(axis, deltaAngle);
        this.pin.position.copy(pinPos.add(center));
        this.pin.rotateOnWorldAxis(axis, deltaAngle);
        
        // Update pin axis
        this.pinAxis.applyAxisAngle(axis, deltaAngle);
        
        // Rotate pivot
        const pivotPos = this.pivot.clone().sub(center);
        pivotPos.applyAxisAngle(axis, deltaAngle);
        this.pivot.copy(pivotPos.add(center));
        
        // Rotate lamp group children
        this.rotatableGroup.children.forEach(child => {
            const childPos = child.position.clone().sub(center);
            childPos.applyAxisAngle(axis, deltaAngle);
            child.position.copy(childPos.add(center));
            child.rotateOnWorldAxis(axis, deltaAngle);
            
            if (child.userData.initialPosition) {
                const initPos = child.userData.initialPosition.clone().sub(center);
                initPos.applyAxisAngle(axis, deltaAngle);
                child.userData.initialPosition.copy(initPos.add(center));
            }
            if (child.userData.initialQuaternion) {
                const rotation = new THREE.Quaternion().setFromAxisAngle(axis, deltaAngle);
                child.userData.initialQuaternion.premultiply(rotation);
            }
        });
        
        // Rotate spotlight and target
        const spotPos = this.spotlight.position.clone().sub(center);
        spotPos.applyAxisAngle(axis, deltaAngle);
        this.spotlight.position.copy(spotPos.add(center));
        
        const targetPos = this.spotlight.target.position.clone().sub(center);
        targetPos.applyAxisAngle(axis, deltaAngle);
        this.spotlight.target.position.copy(targetPos.add(center));
    }
    
    updateHeight(deltaHeight) {
        // Calculate total current height
        let totalHeight = 0;
        this.poleSections.forEach(section => {
            totalHeight += section.geometry.parameters.height;
        });
        
        const newHeight = Math.max(2, Math.min(25, totalHeight + deltaHeight));
        let remainingDelta = newHeight - totalHeight;
        
        if (Math.abs(remainingDelta) < 0.001) return;
        
        const extending = remainingDelta > 0;
        
        // Distribute delta proportionally across all sections
        // Each section contributes equally to the change
        const sectionOrder = [3, 2, 1, 0]; // Top to bottom
        const deltaPerSection = remainingDelta / this.poleSections.length;
        
        for (let idx of sectionOrder) {
            if (Math.abs(remainingDelta) < 0.001) break;
            
            const section = this.poleSections[idx];
            const currentSectionHeight = section.geometry.parameters.height;
            const sectionRadius = section.geometry.parameters.radiusTop;
            
            // Try to apply this section's share of the delta
            let sectionDelta = deltaPerSection;
            
            if (extending) {
                // Limit to maxHeight
                const maxHeight = section.userData.maxHeight;
                const availableExtension = maxHeight - currentSectionHeight;
                sectionDelta = Math.min(sectionDelta, availableExtension);
            } else {
                // Limit to minSectionHeight
                const availableContraction = currentSectionHeight - this.minSectionHeight;
                sectionDelta = Math.max(sectionDelta, -availableContraction);
            }
            
            if (Math.abs(sectionDelta) > 0.001) {
                const newSectionHeight = currentSectionHeight + sectionDelta;
                
                // Update this section's geometry
                section.geometry.dispose();
                section.geometry = new THREE.CylinderGeometry(sectionRadius, sectionRadius, newSectionHeight, 16);
                section.position.y += sectionDelta / 2;
                
                // Update all sections above this one (higher indices in our bottom-to-top array)
                for (let i = idx + 1; i < this.poleSections.length; i++) {
                    this.poleSections[i].position.y += sectionDelta;
                }
                
                // Update collars above this section
                for (let i = idx; i < this.poleCollars.length; i++) {
                    this.poleCollars[i].position.y += sectionDelta;
                }
                
                remainingDelta -= sectionDelta;
            }
        }
        
        // If there's still remaining delta, redistribute to sections that can still extend/contract
        if (Math.abs(remainingDelta) > 0.001) {
            for (let idx of sectionOrder) {
                if (Math.abs(remainingDelta) < 0.001) break;
                
                const section = this.poleSections[idx];
                const currentSectionHeight = section.geometry.parameters.height;
                const sectionRadius = section.geometry.parameters.radiusTop;
                
                let sectionDelta = 0;
                
                if (extending) {
                    const maxHeight = section.userData.maxHeight;
                    const availableExtension = maxHeight - currentSectionHeight;
                    sectionDelta = Math.min(remainingDelta, availableExtension);
                } else {
                    const availableContraction = currentSectionHeight - this.minSectionHeight;
                    sectionDelta = Math.max(remainingDelta, -availableContraction);
                }
                
                if (Math.abs(sectionDelta) > 0.001) {
                    const newSectionHeight = currentSectionHeight + sectionDelta;
                    
                    section.geometry.dispose();
                    section.geometry = new THREE.CylinderGeometry(sectionRadius, sectionRadius, newSectionHeight, 16);
                    section.position.y += sectionDelta / 2;
                    
                    for (let i = idx + 1; i < this.poleSections.length; i++) {
                        this.poleSections[i].position.y += sectionDelta;
                    }
                    
                    // Update collars above this section
                    for (let i = idx; i < this.poleCollars.length; i++) {
                        this.poleCollars[i].position.y += sectionDelta;
                    }
                    
                    remainingDelta -= sectionDelta;
                }
            }
        }
        
        // Calculate actual total delta applied
        const actualTotalDelta = (newHeight - totalHeight) - remainingDelta;
        
        if (Math.abs(actualTotalDelta) < 0.001) return;
        
        // Update hit area to match new total height
        let newTotalHeight = 0;
        this.poleSections.forEach(section => {
            newTotalHeight += section.geometry.parameters.height;
        });
        const hitRadius = this.poleHitArea.geometry.parameters.radiusTop;
        this.poleHitArea.geometry.dispose();
        this.poleHitArea.geometry = new THREE.CylinderGeometry(hitRadius, hitRadius, newTotalHeight, 8);
        this.poleHitArea.position.y = newTotalHeight / 2;
        this.sleeve.position.y += actualTotalDelta;
        
        // Update discs positions
        this.discs.forEach(disc => {
            disc.position.y += actualTotalDelta;
        });
        
        // Update pin position
        this.pin.position.y += actualTotalDelta;
        
        // Update pivot
        this.pivot.y += actualTotalDelta;
        
        // Update rotatableGroup children
        this.rotatableGroup.children.forEach(child => {
            child.position.y += actualTotalDelta;
            if (child.userData.initialPosition) {
                child.userData.initialPosition.y += actualTotalDelta;
            }
        });
        
        // Update spotlight and target
        this.spotlight.position.y += actualTotalDelta;
        this.spotlight.target.position.y += actualTotalDelta;
    }
    
    toggleLight() {
        this.spotlight.visible = !this.spotlight.visible;
        const isOn = this.spotlight.visible;
        
        // Update bulb appearance
        this.bulb.material.color.setHex(isOn ? 0xffffff : 0x333333);
        
        // Update inner cone appearance
        this.innerCone.material.emissive.setHex(isOn ? 0xffffee : 0x000000);
        this.innerCone.material.emissiveIntensity = isOn ? 0.8 : 0;
        this.innerCone.material.color.setHex(isOn ? 0xffff00 : 0x222222);
        
        // Update tip cap inner appearance (uses MeshPhongMaterial like inner cone)
        this.coneTipCapInner.material.emissive.setHex(isOn ? 0xffffee : 0x000000);
        this.coneTipCapInner.material.emissiveIntensity = isOn ? 0.8 : 0;
        this.coneTipCapInner.material.color.setHex(isOn ? 0xffff00 : 0x222222);
        
        // Update tip cap outer appearance (brass color)
        this.coneTipCapOuter.material.color.setHex(isOn ? 0xffc71e : 0x222222);
        
        // Toggle tip point light
        this.tipLight.visible = isOn;
        
        // Update status indicator (green when on, red when off)
        this.statusIndicator.material.color.setHex(isOn ? 0x00ff00 : 0xff0000);
        this.statusIndicator.material.emissive.setHex(isOn ? 0x00ff00 : 0xff0000);
        this.statusIndicator.material.emissiveIntensity = 0.8;
    }
    
    updateConeGeometry() {
        // Calculate new cone radius based on spotlight angle
        const newConeRadius = Math.tan(this.spotlight.angle) * this.coneHeight;
        const newTipRadius = newConeRadius * 0.15; // Keep tip at 15% of base
        const newConeGeometry = new THREE.CylinderGeometry(newTipRadius, newConeRadius, this.coneHeight, 32, 1, true);
        
        // Update outer cone
        this.outerCone.geometry.dispose();
        this.outerCone.geometry = newConeGeometry;
        
        // Update inner cone (reuse same geometry)
        this.innerCone.geometry.dispose();
        this.innerCone.geometry = newConeGeometry.clone();
        
        // Update tip cap size for both cylinders
        var tipCapThickness = 0.05;
        var outerCapThickness = 0.15;
        var newCapGeometry = new THREE.CylinderGeometry(newTipRadius * 1.15, newTipRadius * 1.15, tipCapThickness, 32);
        var newOuterCapGeometry = new THREE.CylinderGeometry(newTipRadius * 1.15, newTipRadius * 1.15, outerCapThickness, 32);
        
        this.coneTipCapInner.geometry.dispose();
        this.coneTipCapInner.geometry = newCapGeometry;
        
        this.coneTipCapOuter.geometry.dispose();
        this.coneTipCapOuter.geometry = newOuterCapGeometry;
        
        // Scale bulb to fit inside cone when cone is narrow
        // Bulb is positioned at cone center (0.7 * coneHeight back from light, which is at tip + 0.5*height)
        const bulbDistanceFromTip = this.coneHeight * 0.5;
        const coneRadiusAtBulb = Math.tan(this.spotlight.angle) * bulbDistanceFromTip;
        const maxBulbRadius = coneRadiusAtBulb * 0.85; // 85% of cone radius at that point for safety margin
        const desiredBulbRadius = Math.min(0.4, maxBulbRadius); // Cap at 0.4 (twice original size)
        
        this.bulb.scale.setScalar(desiredBulbRadius / 0.2); // Scale relative to original size
    }
}

class BOID {
    constructor(pos, rad, vel, hue, sat, light) {
        this.pos = pos.clone();
        this.rad = rad;
        this.vel = vel.clone();
        this.hue = hue;
        this.sat = sat;
        this.light = light;
        this.grabbed = false;
        this.spinAngle = 0; // For rotating models like avocado along travel axis
        
        // Create front cone mesh
        let material;
        
        // Handle duck and fish geometry specially
        if (gBoidGeometryType === 12 && gDuckTemplate) {
            // Clone duck template for this boid
            this.visMesh = gDuckTemplate.clone();
            this.visMesh.scale.set(0.3, 0.3, 0.3);
            this.visMesh.position.copy(pos);
            this.visMesh.userData = this;
            this.visMesh.castShadow = true;
            this.visMesh.receiveShadow = true;
            gThreeScene.add(this.visMesh);
        } else if (gBoidGeometryType === 13 && gFishTemplate) {
            // Clone fish template for this boid
            this.visMesh = gFishTemplate.clone();
            this.visMesh.scale.set(2.0, 2.0, 2.0);
            this.visMesh.position.copy(pos);
            this.visMesh.userData = this;
            this.visMesh.castShadow = true;
            this.visMesh.receiveShadow = true;
            gThreeScene.add(this.visMesh);
        } else if (gBoidGeometryType === 14 && gAvocadoTemplate) {
            // Clone avocado template for this boid
            this.visMesh = gAvocadoTemplate.clone();
            this.visMesh.scale.set(10.0, 10.0, 6.0);
            this.visMesh.position.copy(pos);
            this.visMesh.userData = this;
            this.visMesh.castShadow = true;
            this.visMesh.receiveShadow = true;
            gThreeScene.add(this.visMesh);
        } else {
            // Standard geometry with materials
            if (boidProps.material === 'standard') {
                material = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(`hsl(${hue}, ${sat}%, ${light}%)`), 
                    metalness: 0.5, 
                    roughness: 0.4, 
                    wireframe: boidProps.wireframe});
            } else if (boidProps.material === 'phong') {
                material = new THREE.MeshPhongMaterial({
                    color: new THREE.Color(`hsl(${hue}, ${sat}%, ${light}%)`), 
                    shininess: 100, 
                    shininess: 100, 
                    wireframe: boidProps.wireframe});
            } else if (boidProps.material === 'normal') {
                material = new THREE.MeshNormalMaterial({
                    wireframe: boidProps.wireframe});
            } else if (boidProps.material === 'toon') {
                material = new THREE.MeshToonMaterial({
                    color: new THREE.Color(`hsl(${hue}, ${sat}%, ${light}%)`), 
                    shininess: 100, 
                    wireframe: boidProps.wireframe});
            } else if (boidProps.material === 'depth') {
                material = new THREE.MeshDepthMaterial({
                    wireframe: boidProps.wireframe});
            } else {
                material = new THREE.MeshBasicMaterial({
                    color: new THREE.Color(`hsl(${hue}, ${sat}%, ${light}%)`), 
                    shininess: 100, 
                    wireframe: boidProps.wireframe});
            }
            var geometry = new THREE.ConeGeometry(rad, 3 * rad, geometrySegments, 1);
            this.visMesh = new THREE.Mesh(geometry, material);
            this.visMesh.position.copy(pos);
            this.visMesh.userData = this;
            //this.visMesh.layers.enable(1);
            this.visMesh.castShadow = true;
            this.visMesh.receiveShadow = true;
            gThreeScene.add(this.visMesh);
        }

        /*// Create tapered cylinder at rear 
        var geometry2 = new THREE.CylinderGeometry(0.4 * rad, 0.2 * rad, 3 * rad, geometrySegments);
        var material = new THREE.MeshPhongMaterial({color: new THREE.Color(`hsl(${hue + 20}, ${sat}%, ${light}%)`), shininess: 100, shininess: 100, wireframe: boidProps.wireframe});
        this.visMesh2 = new THREE.Mesh(geometry2, material);
        this.visMesh2.position.copy(pos);
        this.visMesh2.userData = this;
        this.visMesh2.layers.enable(1);
        this.visMesh2.castShadow = true;
        this.visMesh2.receiveShadow = true;
        gThreeScene.add(this.visMesh2);*/
    }
    
    simulate() {
        if (this.grabbed) return;
        
        // Apply boundary turning forces or bouncing
        var size = gPhysicsScene.worldSize;
        var margin = boidProps.margin;
        var turnFactor = boidProps.turnFactor;
        var isMaxCorrallingForce = (turnFactor >= 0.2);
        
        if (isMaxCorrallingForce) {
            // MAX setting: Hard boundaries with bouncing
            if (this.pos.x < -size.x) {
                this.pos.x = -size.x;
                this.vel.x = Math.abs(this.vel.x) * 0.8; // Bounce with slight damping
            }
            if (this.pos.x > size.x) {
                this.pos.x = size.x;
                this.vel.x = -Math.abs(this.vel.x) * 0.8;
            }
            if (this.pos.z < -size.z) {
                this.pos.z = -size.z;
                this.vel.z = Math.abs(this.vel.z) * 0.8;
            }
            if (this.pos.z > size.z) {
                this.pos.z = size.z;
                this.vel.z = -Math.abs(this.vel.z) * 0.8;
            }
            if (this.pos.y < 0) {
                this.pos.y = 0;
                this.vel.y = Math.abs(this.vel.y) * 0.8;
            }
            if (this.pos.y > size.y) {
                this.pos.y = size.y;
                this.vel.y = -Math.abs(this.vel.y) * 0.8;
            }
        } else {
            // Normal setting: Soft boundaries with turning forces
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
            
            // Make mesh look at target
            this.visMesh.lookAt(target);
            // Adjust for default orientation based on geometry type
            // Cone points along Y axis by default, needs rotation
            if (gBoidGeometryType === 1 || gBoidGeometryType === 2 || gBoidGeometryType === 8) {
                // Cone, Cylinder, Capsule - point along Y axis
                this.visMesh.rotateX(Math.PI / 2);
            } else if (gBoidGeometryType === 4) {
                // Tetrahedron - try negative Z rotation
                this.visMesh.rotateX(-Math.PI / 4);
                this.visMesh.rotateY(-Math.PI / 4);
                this.visMesh.rotateZ(-Math.PI / 2);
            } else if (gBoidGeometryType === 5) {
                // Octahedron - rotate 90 degrees about horizontal axis
                this.visMesh.rotateX(Math.PI / 2);
            } else if (gBoidGeometryType === 11) {
                // Plane - rotate to be parallel to direction of movement
                this.visMesh.rotateX(Math.PI / 2);
            } else if (gBoidGeometryType === 12) {
                // Duck - beak points along positive X axis in local space
                // Rotate so beak points in direction of travel (forward = -Z after lookAt)
                this.visMesh.rotateY(-Math.PI / 2);
            } else if (gBoidGeometryType === 13) {
                // Fish - orient to swim in direction of travel
                // No rotation needed - fish model is already oriented correctly
            } else if (gBoidGeometryType === 14) {
                // Avocado - orient to lead with bottom, upside-down
                this.visMesh.rotateX(-Math.PI / 2);
                // Add spin around the long axis (Y axis after rotateX)
                this.spinAngle += 2.0 * deltaT; // Spin speed in radians per second
                this.visMesh.rotateY(this.spinAngle);
            }
            // Torus and TorusKnot default orientation works correctly with lookAt (hole perpendicular to movement)
            
            // Position hemisphere at the flat base of the cone (back end)
            if (this.visMesh2) {
                // Cone base is at pos - direction * 1.5 * rad
                const hemisphereOffset = direction.clone().multiplyScalar(-3 * this.rad);
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
    let pos, vel, hue, sat, light;
    const spawnRadius = 4.0; // Radius of spherical spawn volume
    const minMargin = 0.2; // Minimum margin as multiple of radius
    const minDistance = 2 * radius * (1 + minMargin); // Minimum center-to-center distance
    const maxAttempts = 1000; // Max attempts per boid to find valid position (temporarily unlimited)
    const spawnCenter = new THREE.Vector3(0, 4 * spawnRadius, 0); // Center of spawn sphere
    
    function defineAndSet(pos, radius, i) {
        // Set velocity to point outward from spawn center
        vel = pos.clone().sub(spawnCenter).normalize();
        const speed = 1 + Math.random() * 4; // Random speed between 1 and 5
        vel.multiplyScalar(speed);
        if (i == 0) {
            hue = 0;
            sat = 0;
            light = 100;
        } else if (i < 101) {
            hue = Math.round(180 + (2 * (-0.5 + Math.random())) * 20);
            sat = Math.round(40 + Math.random() * 60); 
            light = Math.round(30 + Math.random() * 40); 
        } else {
            hue = Math.round(360 + (2 * (-0.5 + Math.random())) * 20);
            sat = Math.round(40 + Math.random() * 60); 
            light = Math.round(30 + Math.random() * 40); 
        }
        gPhysicsScene.objects.push(new BOID(pos, radius, vel, hue, sat, light) );
    }
    var safelySpawned = 0;
    for (var i = 0; i < numBoids; i++) {
        let validPosition = false;
        let attempts = 0;
        
        while (!validPosition && attempts < maxAttempts) {
            validPosition = true;
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
            defineAndSet(pos, radius, i);
            safelySpawned += 1;
        } else {
            defineAndSet(pos, radius, i);
        }
    }
    console.log("Spawned " + safelySpawned + " clash-free boids ");
    console.log("Spawned " + gPhysicsScene.objects.length + " boids total ");
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
                //const hueMatch = segregationMode === 0 || Math.abs(boid.hue - otherBoid.hue) < 50;
                const hueMatch = true;
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
    
    // Update trail tracking
    if (gTrailLength > 50 && gPhysicsScene.objects.length > gTrailBoidIndex) {
        gTrailUpdateCounter++;
        if (gTrailUpdateCounter >= gTrailUpdateFrequency) {
            gTrailUpdateCounter = 0;
            updateBoidTrail();
        }
    }
    
    gGrabber.increaseTime(deltaT);
}

let res = 1024

// TRAIL TRACKING FUNCTIONS -------------------------------------------------------
function updateBoidTrail() {
    const boid = gPhysicsScene.objects[gTrailBoidIndex];
    if (!boid) return;
    
    // Add current position to trail
    gTrailPositions.push(boid.pos.clone());
    
    // Remove old positions if trail exceeds max length
    while (gTrailPositions.length > gTrailLength) {
        gTrailPositions.shift();
    }
    
    // Need at least 2 points to create a tube
    if (gTrailPositions.length < 2) return;
    
    // Remove old trail mesh
    if (gTrailMesh) {
        gThreeScene.remove(gTrailMesh);
        if (gTrailMesh.geometry) gTrailMesh.geometry.dispose();
        if (gTrailMesh.material) gTrailMesh.material.dispose();
    }
    
    // Remove old trail cap
    if (gTrailCapMesh) {
        gThreeScene.remove(gTrailCapMesh);
        if (gTrailCapMesh.geometry) gTrailCapMesh.geometry.dispose();
        if (gTrailCapMesh.material) gTrailCapMesh.material.dispose();
    }
    
    // Create curve from trail positions
    const curve = new THREE.CatmullRomCurve3(gTrailPositions);
    
    // Create tube geometry from curve
    const tubeRadius = boidRadius * gTrailRadius; 
    const tubularSegments = Math.max(10, gTrailPositions.length * 2);
    const radialSegments = 8;
    const tubeGeometry = new THREE.TubeGeometry(
        curve,
        tubularSegments,
        tubeRadius,
        radialSegments,
        false
    );
    
    // Create material based on color mode
    let tubeMaterial;
    
    if (gTrailColorMode === 2) {
        // B&W alternating bands - create vertex colors
        const colors = [];
        const positionAttribute = tubeGeometry.attributes.position;
        const segmentLength = gTrailPositions.length;
        
        for (let i = 0; i < positionAttribute.count; i++) {
            const vertexIndex = Math.floor(i / radialSegments);
            const segmentIndex = Math.floor(vertexIndex / 50);
            const isWhite = segmentIndex % 2 === 0;
            
            if (isWhite) {
                colors.push(1, 1, 1);
            } else {
                colors.push(0, 0, 0);
            }
        }
        
        tubeGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        tubeMaterial = new THREE.MeshPhongMaterial({
            vertexColors: true,
            shininess: 30
        });
    } else {
        // Solid color modes
        let color;
        if (gTrailColorMode === 0) {
            color = 0xffffff; // White
        } else if (gTrailColorMode === 1) {
            color = 0x000000; // Black
        } else {
            // Color mode - use boid's color
            const boid = gPhysicsScene.objects[gTrailBoidIndex];
            if (boid) {
                color = new THREE.Color(`hsl(${boid.hue}, ${boid.sat}%, 50%)`);
            } else {
                color = 0xffffff;
            }
        }
        
        tubeMaterial = new THREE.MeshPhongMaterial({
            color: color,
            transparent: false,
            shininess: 30
        });
    }
    
    // Create mesh
    gTrailMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
    gTrailMesh.castShadow = true;
    gTrailMesh.receiveShadow = false;
    gThreeScene.add(gTrailMesh);
    
    // Create disc cap at the tail end (oldest position)
    const tailPosition = gTrailPositions[0];
    const capGeometry = new THREE.CircleGeometry(tubeRadius, radialSegments);
    const capMaterial = tubeMaterial.clone();
    gTrailCapMesh = new THREE.Mesh(capGeometry, capMaterial);
    gTrailCapMesh.position.copy(tailPosition);
    
    // Orient the disc to face along the trail direction
    if (gTrailPositions.length > 1) {
        const nextPosition = gTrailPositions[1];
        const direction = new THREE.Vector3().subVectors(nextPosition, tailPosition).normalize();
        const up = new THREE.Vector3(0, 0, 1);
        gTrailCapMesh.quaternion.setFromUnitVectors(up, direction.negate());
    }
    
    gTrailCapMesh.castShadow = true;
    gTrailCapMesh.receiveShadow = false;
    gThreeScene.add(gTrailCapMesh);
}

function clearBoidTrail() {
    gTrailPositions = [];
    if (gTrailMesh) {
        gThreeScene.remove(gTrailMesh);
        if (gTrailMesh.geometry) gTrailMesh.geometry.dispose();
        if (gTrailMesh.material) gTrailMesh.material.dispose();
        gTrailMesh = null;
    }
    if (gTrailCapMesh) {
        gThreeScene.remove(gTrailCapMesh);
        if (gTrailCapMesh.geometry) gTrailCapMesh.geometry.dispose();
        if (gTrailCapMesh.material) gTrailCapMesh.material.dispose();
        gTrailCapMesh = null;
    }
}

function recreateBoidGeometries() {
    // Recreate geometry for all boids
    for (let i = 0; i < gPhysicsScene.objects.length; i++) {
        const boid = gPhysicsScene.objects[i];
        
        // Remove old meshes
        gThreeScene.remove(boid.visMesh);
        if (boid.visMesh.geometry) boid.visMesh.geometry.dispose();
        if (boid.visMesh.material) boid.visMesh.material.dispose();
        
        if (boid.visMesh2) {
            gThreeScene.remove(boid.visMesh2);
            if (boid.visMesh2.geometry) boid.visMesh2.geometry.dispose();
            if (boid.visMesh2.material) boid.visMesh2.material.dispose();
            boid.visMesh2 = null;
        }
        
        // Create new geometry based on type
        let geometry;
        var siding = 'THREE.FrontSide';
        const rad = boid.rad;
        
        switch (gBoidGeometryType) {
            case 0: // Sphere
                geometry = new THREE.SphereGeometry(rad, geometrySegments, geometrySegments);
                break;
            case 1: // Cone (default)
                geometry = new THREE.ConeGeometry(rad, 3 * rad, geometrySegments, 1);
                break;
            case 2: // Cylinder
                geometry = new THREE.CylinderGeometry(rad, rad, 3 * rad, geometrySegments);
                break;
            case 3: // Box
                geometry = new THREE.BoxGeometry(2 * rad, 2 * rad, 2 * rad);
                break;
            case 4: // Tetrahedron
                geometry = new THREE.TetrahedronGeometry(rad * 1.5);
                break;
            case 5: // Octahedron
                geometry = new THREE.OctahedronGeometry(rad * 1.5);
                break;
            case 6: // Dodecahedron
                geometry = new THREE.DodecahedronGeometry(rad * 1.5);
                break;
            case 7: // Icosahedron
                geometry = new THREE.IcosahedronGeometry(rad * 1.5);
                break;
            case 8: // Capsule
                geometry = new THREE.CapsuleGeometry(rad, 2.7 * rad, 0.5 * geometrySegments, geometrySegments);
                break;
            case 9: // Torus
                geometry = new THREE.TorusGeometry(rad, rad * 0.4, geometrySegments, 2 * geometrySegments);
                break;
            case 10: // TorusKnot
                geometry = new THREE.TorusKnotGeometry(rad, rad * 0.3, 4 * geometrySegments, geometrySegments);
                break;
            case 11: // Plane
                geometry = new THREE.PlaneGeometry(2.5 * rad, 2.5 * rad);
                break;
            case 12: // Duck
                // Use cloned duck model if available
                if (gDuckTemplate) {
                    // Duck is handled differently - we'll clone the entire scene
                    // Set a flag so we know to skip standard material creation
                    geometry = null; // Will be handled specially
                } else {
                    // Fallback to cone if duck not loaded yet
                    geometry = new THREE.ConeGeometry(rad, 3 * rad, geometrySegments, 1);
                }
                break;
            default:
                geometry = new THREE.ConeGeometry(rad, 3 * rad, geometrySegments, 1);
        }

        let material;
        if (gBoidGeometryType === 12 && gDuckTemplate) {
            // For duck geometry, clone the duck template
            boid.visMesh = gDuckTemplate.clone();
            boid.visMesh.scale.set(0.3, 0.3, 0.3); // Scale down for boid size
            
            // Set position and add to scene
            boid.visMesh.position.copy(boid.pos);
            boid.visMesh.castShadow = true;
            boid.visMesh.receiveShadow = true;
            gThreeScene.add(boid.visMesh);
            continue; // Skip standard material creation
        } else if (gBoidGeometryType === 13 && gFishTemplate) {
            // For fish geometry, clone the fish template
            boid.visMesh = gFishTemplate.clone();
            boid.visMesh.scale.set(2.0, 2.0, 2.0); // Scale down for boid size
            
            // Set position and add to scene
            boid.visMesh.position.copy(boid.pos);
            boid.visMesh.castShadow = true;
            boid.visMesh.receiveShadow = true;
            gThreeScene.add(boid.visMesh);
            continue; // Skip standard material creation
        } else if (gBoidGeometryType === 14 && gAvocadoTemplate) {
            // For avocado geometry, clone the avocado template
            boid.visMesh = gAvocadoTemplate.clone();
            boid.visMesh.scale.set(12.0, 12.0, 12.0); // Scale down for boid size
            
            // Set position and add to scene
            boid.visMesh.position.copy(boid.pos);
            boid.visMesh.castShadow = true;
            boid.visMesh.receiveShadow = true;
            gThreeScene.add(boid.visMesh);
            continue; // Skip standard material creation
        } else if (gBoidGeometryType != 11 && gBoidGeometryType != 12 && gBoidGeometryType != 13 && gBoidGeometryType != 14) {
            if (boidProps.material === 'standard') {
                material = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(`hsl(${boid.hue}, ${boid.sat}%, ${boid.light}%)`), 
                    metalness: 0.5, 
                    roughness: 0.4, 
                    wireframe: boidProps.wireframe});
            } else if (boidProps.material === 'phong') {
                material = new THREE.MeshPhongMaterial({
                    color: new THREE.Color(`hsl(${boid.hue}, ${boid.sat}%, ${boid.light}%)`), 
                    shininess: 100, 
                    wireframe: boidProps.wireframe});
            } else if (boidProps.material === 'normal') {
                material = new THREE.MeshNormalMaterial({
                    wireframe: boidProps.wireframe});
            } else if (boidProps.material === 'toon') {
                material = new THREE.MeshToonMaterial({
                    color: new THREE.Color(`hsl(${boid.hue}, ${boid.sat}%, ${boid.light}%)`), 
                    wireframe: boidProps.wireframe});
            } else if (boidProps.material === 'depth') {
                material = new THREE.MeshDepthMaterial({
                    wireframe: boidProps.wireframe});
            } else {
                material = new THREE.MeshBasicMaterial({
                    color: new THREE.Color(`hsl(${boid.hue}, ${boid.sat}%, ${boid.light}%)`), 
                    wireframe: boidProps.wireframe});
            } 
        } else {
            if (boidProps.material === 'standard') {
                material = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(`hsl(${boid.hue}, ${boid.sat}%, ${boid.light}%)`), 
                    metalness: 0.5, 
                    roughness: 0.4, 
                    wireframe: boidProps.wireframe,
                    side: THREE.DoubleSide});
            } else if (boidProps.material === 'phong') {
                material = new THREE.MeshPhongMaterial({
                    color: new THREE.Color(`hsl(${boid.hue}, ${boid.sat}%, ${boid.light}%)`), 
                    shininess: 100, 
                    wireframe: boidProps.wireframe,
                    side: THREE.DoubleSide});
            } else if (boidProps.material === 'normal') {
                material = new THREE.MeshNormalMaterial({
                    wireframe: boidProps.wireframe, 
                    side: THREE.DoubleSide});
            } else if (boidProps.material === 'toon') {
                material = new THREE.MeshToonMaterial({
                    color: new THREE.Color(`hsl(${boid.hue}, ${boid.sat}%, ${boid.light}%)`), 
                    wireframe: boidProps.wireframe,
                    side: THREE.DoubleSide});
            } else if (boidProps.material === 'depth') {
                material = new THREE.MeshDepthMaterial({
                    wireframe: boidProps.wireframe,
                    side: THREE.DoubleSide});
            } else {
                material = new THREE.MeshBasicMaterial({
                    color: new THREE.Color(`hsl(${boid.hue}, ${boid.sat}%, ${boid.light}%)`), 
                    wireframe: boidProps.wireframe,
                    side: THREE.DoubleSide});
            }
        }

        boid.visMesh = new THREE.Mesh(geometry, material);
        boid.visMesh.position.copy(boid.pos);
        boid.visMesh.userData = boid;
        boid.visMesh.layers.enable(1);
        boid.visMesh.castShadow = true;
        boid.visMesh.receiveShadow = true;
        gThreeScene.add(boid.visMesh);
    }
}

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
    const itemWidth = 0.15 * menuScale;
    const padding = 0.02 * menuScale;
    const menuHeight = itemHeight * 7 + (padding * 8); // Seven items now
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
    
    // Draw Run/Pause menu item (moved to top)
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

    // Draw Simulation menu item
    const itemY2 = itemY + itemHeight + padding;
    ctx.beginPath();
    ctx.roundRect(itemX, itemY2, itemWidth, itemHeight, cornerRadius * 0.5);
    ctx.fillStyle = menuVisible ? 'rgba(100, 150, 220, 0.3)' : 'rgba(38, 38, 38, 0.8)';
    ctx.fill();
    
    // Draw icon
    const icon2X = itemX + itemWidth / 2;
    const icon2Y = itemY2 + itemHeight / 2;
    const icon2Color = menuVisible ? 'rgba(230, 230, 230, 1.0)' : 'rgba(76, 76, 76, 1.0)';
    ctx.strokeStyle = icon2Color;
    ctx.fillStyle = icon2Color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    // Draw gear icon
    const gearRadius = iconSize * 0.6;
    ctx.save();
    ctx.translate(icon2X, icon2Y);
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
    ctx.fillStyle = icon2Color;
    ctx.fillText('Simulation', icon2X, itemY2 + itemHeight - padding);*/

    // Draw Styling menu item
    const itemY3 = itemY2 + itemHeight + padding;
    ctx.beginPath();
    ctx.roundRect(itemX, itemY3, itemWidth, itemHeight, cornerRadius * 0.5);
    ctx.fillStyle = stylingMenuVisible ? 'rgba(255, 150, 80, 0.3)' : 'rgba(38, 38, 38, 0.8)';
    ctx.fill();
    
    // Draw necktie icon
    const icon3X = itemX + itemWidth / 2;
    const icon3Y = itemY3 + itemHeight / 2;
    const icon3Color = stylingMenuVisible ? 'rgba(255, 180, 100, 1.0)' : 'rgba(76, 76, 76, 1.0)';
    ctx.strokeStyle = icon3Color;
    ctx.fillStyle = icon3Color;
    ctx.lineWidth = 2;
    
    ctx.save();
    ctx.translate(icon3X, icon3Y);
    
    const tieWidth = iconSize * 0.5;
    const tieLength = iconSize * 1.3;
    const gapSize = iconSize * 0.06;
    
    ctx.fillStyle = icon3Color;
    
    // Draw knot (4-sided polygon - trapezoid)
    ctx.beginPath();
    ctx.moveTo(-tieWidth * 0.55, -tieLength * 0.5);  // Top left
    ctx.lineTo(tieWidth * 0.55, -tieLength * 0.5);   // Top right
    ctx.lineTo(tieWidth * 0.22, -tieLength * 0.2);   // Bottom right
    ctx.lineTo(-tieWidth * 0.22, -tieLength * 0.2);  // Bottom left
    ctx.closePath();
    ctx.fill();
    
    // Draw tie body (5-sided polygon - pentagon)
    ctx.beginPath();
    ctx.moveTo(-tieWidth * 0.27, -tieLength * 0.2 + gapSize);  // Top left
    ctx.lineTo(tieWidth * 0.27, -tieLength * 0.2 + gapSize);   // Top right
    ctx.lineTo(tieWidth * 0.5, tieLength * 0.48);              // Right side
    ctx.lineTo(0, tieLength * 0.6);                            // Bottom point
    ctx.lineTo(-tieWidth * 0.5, tieLength * 0.48);             // Left side
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();

    // Draw Color menu item
    const itemY4 = itemY3 + itemHeight + padding;
    ctx.beginPath();
    ctx.roundRect(itemX, itemY4, itemWidth, itemHeight, cornerRadius * 0.5);
    ctx.fillStyle = colorMenuVisible ? 'hsla(0, 100%, 70%, 0.30)' : 'hsla(0, 0%, 15%, 0.80)';
    ctx.fill();
    
    // Draw color palette icon
    const icon4X = itemX + itemWidth / 2;
    const icon4Y = itemY4 + itemHeight / 2;
    const icon4Color = colorMenuVisible ? 'hsla(0, 0%, 70%, 1.0)' : 'hsla(0, 0%, 30%, 1.0)';
    ctx.strokeStyle = icon4Color;
    ctx.fillStyle = icon4Color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    ctx.save();
    ctx.translate(icon4X, icon4Y);
    
    // Draw artist palette shape
    const paletteSize = iconSize * 1.2;
    ctx.beginPath();
    // Oval palette
    ctx.ellipse(0, 0, paletteSize * 0.7, paletteSize * 0.5, 0.3, 0, 2 * Math.PI);
    ctx.stroke();
    if (colorMenuVisible) {
        ctx.fillStyle = 'hsla(0, 0%, 70%, 0.5)';
        ctx.fill();
    }
    
    // Thumb hole
    ctx.beginPath();
    ctx.ellipse(paletteSize * -0.3, paletteSize * 0.15, paletteSize * 0.2, paletteSize * 0.15, 0.3, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fillStyle = colorMenuVisible ? 'hsla(0, 100%, 0%, 0.7)' : 'hsla(0, 0%, 10%, 0.8)';
    ctx.fill();
    
    // Color dots on palette arranged in elliptical arc
    const dotColors = ['#ff0000', '#00ff00', '#8800ff', '#ff8800', '#ffff00', '#0088ff', ];
    const numDots = dotColors.length;
    const ellipseRadiusX = paletteSize * 0.35;
    const ellipseRadiusY = paletteSize * 0.25;
    const ellipseRotation = 0.3;
    const startAngle = -0.7;
    const endAngle = 2.8;
    
    for (let i = 0; i < numDots; i++) {
        const angle = startAngle + (endAngle - startAngle) * (i / (numDots - 1));
        const x = ellipseRadiusX * Math.cos(angle);
        const y = -ellipseRadiusY * Math.sin(angle);
        // Rotate the ellipse
        const rotatedX = x * Math.cos(ellipseRotation) - y * Math.sin(ellipseRotation);
        const rotatedY = x * Math.sin(ellipseRotation) + y * Math.cos(ellipseRotation);
        
        ctx.beginPath();
        ctx.arc(rotatedX, rotatedY, paletteSize * 0.1, 0, 2 * Math.PI);
        ctx.fillStyle = dotColors[i];
        ctx.fill();
    }
    
    ctx.restore();

    // Draw Lighting menu item
    const itemY5 = itemY4 + itemHeight + padding;
    ctx.beginPath();
    ctx.roundRect(itemX, itemY5, itemWidth, itemHeight, cornerRadius * 0.5);
    ctx.fillStyle = lightingMenuVisible ? 'rgba(255, 204, 0, 0.3)' : 'rgba(38, 38, 38, 0.8)';
    ctx.fill();
    
    // Draw lightbulb icon
    const icon5X = itemX + itemWidth / 2;
    const icon5Y = itemY5 + itemHeight / 2;
    const icon5Color = lightingMenuVisible ? 'hsla(0, 0%, 70%, 1.0)' : 'hsla(0, 0%, 30%, 1.0)';
    ctx.strokeStyle = icon5Color;
    ctx.fillStyle = icon5Color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    ctx.save();
    ctx.translate(icon5X, icon5Y);
    
    // Draw lightbulb
    const bulbSize = iconSize * 1.4;
    
    // Bulb glass (rounded shape)
    ctx.beginPath();
    ctx.arc(0, -bulbSize * 0.15, bulbSize * 0.35, 0, Math.PI, true);
    ctx.lineTo(-bulbSize * 0.15, bulbSize * 0.15);
    ctx.arc(0, bulbSize * 0.15, bulbSize * 0.15, Math.PI, 0, true);
    ctx.closePath();
    ctx.stroke();
    if (lightingMenuVisible) {
        ctx.fillStyle = 'hsla(60, 100%, 80%, 0.3)';
        ctx.fill();
    }
    
    // Screw base
    ctx.beginPath();
    ctx.rect(-bulbSize * 0.15, bulbSize * 0.15, bulbSize * 0.3, bulbSize * 0.25);
    ctx.stroke();
    
    // Screw threads (3 horizontal lines)
    for (let i = 0; i < 3; i++) {
        const y = bulbSize * (0.2 + i * 0.08);
        ctx.beginPath();
        ctx.moveTo(-bulbSize * 0.15, y);
        ctx.lineTo(bulbSize * 0.15, y);
        ctx.stroke();
    }
    
    // Filament inside bulb (if visible)
    if (lightingMenuVisible) {
        ctx.strokeStyle = 'hsla(45, 100%, 60%, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, bulbSize * 0.05);
        ctx.lineTo(-bulbSize * 0.1, -bulbSize * 0.1);
        ctx.moveTo(0, bulbSize * 0.05);
        ctx.lineTo(bulbSize * 0.1, -bulbSize * 0.1);
        ctx.stroke();
    }
    
    ctx.restore();

    // Draw Camera menu item
    const itemY6 = itemY5 + itemHeight + padding;
    ctx.beginPath();
    ctx.roundRect(itemX, itemY6, itemWidth, itemHeight, cornerRadius * 0.5);
    
    // Background color varies by camera mode
    const cameraBackgroundColors = [
        'rgba(80, 50, 50, 0.8)',   // Mode 0: Static - dark red
        'rgba(50, 50, 80, 0.8)',   // Mode 1: Rotate CCW - dark blue
        'rgba(50, 80, 50, 0.8)',   // Mode 2: Rotate CW - dark green
        'rgba(80, 50, 80, 0.8)',   // Mode 3: Behind boid - dark purple
        'rgba(80, 70, 50, 0.8)'    // Mode 4: In front of boid - dark gold
    ];
    ctx.fillStyle = cameraBackgroundColors[gCameraMode];
    ctx.fill();
    
    // Draw camera or eye icon depending on camera mode
    const icon6X = itemX + 0.5 * itemWidth;
    const icon6Y = itemY6 + 0.6 * itemHeight;
    //const icon6Color = 'rgba(76, 76, 76, 1.0)';
    
    ctx.save();
    ctx.translate(icon6X, icon6Y);
    
    if (gCameraMode == 0 || gCameraMode == 1 || gCameraMode == 2) {
        // Draw movie camera icon
        const camSize = iconSize * 1.5;
        ctx.fillStyle = `rgba(76, 76, 76, 1.0)`;
        ctx.strokeStyle = `rgba(120, 120, 120, 1.0)`;
        ctx.lineWidth = camSize * 0.04;
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
        
        // Determine rotation based on camera mode
        if (gCameraMode == 1) {
            var time = Date.now() / 1000;
            var rotationSign = 1; // Clockwise
        } else if (gCameraMode == 2) {
            var time = Date.now() / 1000;
            var rotationSign = -1; // Counter-clockwise
        } else {
            var time = 0;
            var rotationSign = 0; // No rotation
        }
        
        // Left reel
        ctx.beginPath();
        ctx.arc(leftReelX, leftReelY, leftReelRadius, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(100, 100, 100, 1.0)`;
        ctx.fill();
        ctx.stroke();
        
        // Draw rotating dots on left reel
        const leftReelRotation = -time * 4;
        const leftReelDots = 4;
        const leftReelDotRadius = leftReelRadius * 0.7;
        const leftReelDotSize = camSize * 0.03;
        ctx.fillStyle = `rgba(26, 26, 26, 1.0)`;
        for (let i = 0; i < leftReelDots; i++) {
            const angle = rotationSign * leftReelRotation + (i * 2 * Math.PI / leftReelDots);
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
        
        // Draw rotating dots on right reel
        const rightReelRotation = time * 2.5;
        const rightReelDots = 5;
        const rightReelDotRadius = rightReelRadius * 0.7;
        const rightReelDotSize = camSize * 0.04;
        ctx.fillStyle = `rgba(26, 26, 26, 1.0)`;
        for (let i = 0; i < rightReelDots; i++) {
            const angle = rotationSign * rightReelRotation + (i * 2 * Math.PI / rightReelDots);
            const dotX = rightReelX + Math.cos(angle) * rightReelDotRadius;
            const dotY = rightReelY + Math.sin(angle) * rightReelDotRadius;
            ctx.beginPath();
            ctx.arc(dotX, dotY, rightReelDotSize, 0, 2 * Math.PI);
            ctx.fill();
        }
    } else {
        // Draw eye icon for first-person mode
        const eyeWidth = iconSize * 1.5;
        const eyeHeight = iconSize * 1.0;
        
        // Draw eye outline
        ctx.strokeStyle = `rgba(96, 96, 96, 0.8)`;
        ctx.lineWidth = eyeHeight * 0.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, -3 + eyeHeight * 0.3, eyeWidth / 2, -0.4, Math.PI + 0.4, true);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, -3 -eyeHeight * 0.3, eyeWidth / 2, 0.4, Math.PI - 0.4, false);
        ctx.stroke();
        
        // Draw iris
        const irisRadius = eyeHeight * 0.25;
        ctx.fillStyle = `rgba(100, 160, 180, 1.0)`;
        ctx.beginPath();
        ctx.arc(0, -3, irisRadius, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw pupil
        const pupilRadius = irisRadius * 0.4;
        ctx.fillStyle = `rgba(26, 26, 26, 1.0)`;
        ctx.beginPath();
        ctx.arc(0, -3, pupilRadius, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    ctx.restore();

    // Draw Instructions menu item
    const itemY7 = itemY6 + itemHeight + padding;
    ctx.beginPath();
    ctx.roundRect(itemX, itemY7, itemWidth, itemHeight, cornerRadius * 0.5);
    ctx.fillStyle = instructionsMenuVisible ? 'rgba(255, 204, 0, 0.3)' : 'rgba(38, 38, 38, 0.8)';
    ctx.fill();
    
    // Draw question mark icon
    const icon7X = itemX + itemWidth / 2;
    const icon7Y = itemY7 + 0.42 * itemHeight;
    const icon7Color = instructionsMenuVisible ? 'rgba(230, 230, 230, 1.0)' : 'rgba(76, 76, 76, 1.0)';
    ctx.strokeStyle = icon7Color;
    ctx.fillStyle = icon7Color;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    
    ctx.save();
    ctx.translate(icon7X, icon7Y);
    
    // Draw question mark
    const qmSize = iconSize;
    ctx.beginPath();
    // Top curve of question mark
    ctx.arc(0, -qmSize * 0.1, qmSize * 0.4, -Math.PI, 0);
    // line going across
    ctx.lineTo(qmSize * 0.4, qmSize * 0.2);
    // Stem going down
    ctx.lineTo(0, qmSize * 0.2);
    ctx.lineTo(0, qmSize * 0.4);
    ctx.stroke();
    
    // Dot at bottom
    ctx.beginPath();
    ctx.arc(0, qmSize * 0.75, qmSize * 0.12, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.restore();

    ctx.restore();
}

function drawSimMenu() {
    if (menuOpacity <= 0) return;
    
    const ctx = gOverlayCtx;
    const menuItems = [
        gPhysicsScene.objects.length, boidRadius, boidProps.visualRange,
        boidProps.avoidFactor, boidProps.matchingFactor, boidProps.centeringFactor,
        boidProps.minSpeed, boidProps.maxSpeed, boidProps.turnFactor, boidProps.margin
    ];
    
    const ranges = [
        {min: 100, max: 5000},      // numBoids
        {min: 0.05, max: 0.5},      // boidRadius
        {min: 0.5, max: 10},        // visualRange
        {min: 0, max: 0.2},         // avoidFactor
        {min: 0, max: 0.2},         // matchingFactor
        {min: 0, max: 0.005},       // centeringFactor
        {min: 1.0, max: 20.0},      // minSpeed
        {min: 1.0, max: 30.0},      // maxSpeed
        {min: 0, max: 0.2},         // turnFactor
        {min: 0.5, max: 5.0}        // margin
    ];
    
    const knobRadius = 0.1 * menuScale;
    const knobSpacing = knobRadius * 3;
    const menuTopMargin = 0.2 * knobRadius;
    const menuWidth = knobSpacing * 2;
    const menuHeight = knobSpacing * 3.3;
    const padding = 1.7 * knobRadius;
    
    // Convert world coordinates to screen coordinates
    const menuUpperLeftX = simMenuX * window.innerWidth;
    const menuUpperLeftY = simMenuY * window.innerHeight;
    
    ctx.save();
    ctx.translate(menuUpperLeftX + knobSpacing, menuUpperLeftY + 0.5 * knobSpacing);
    
    // Draw menu background
    const cornerRadius = 8;
    ctx.beginPath();
    ctx.roundRect(-padding, -padding, menuWidth + padding * 2, menuHeight + padding * 2, cornerRadius);
    const menuGradient = ctx.createLinearGradient(0, -padding, 0, menuHeight + padding);
    menuGradient.addColorStop(0, `rgba(51, 85, 128, ${menuOpacity})`);
    menuGradient.addColorStop(1, `rgba(13, 26, 38, ${menuOpacity})`);
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
            'Quantity', 'Size', 'Visual Range',
            'Separation', 'Alignment', 'Cohesion',
            'Minimum Speed', 'Speed Limit', 'Corralling Force', 'Corral Margin'
        ];
        ctx.font = `${0.35 * knobRadius}px verdana`;
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
            case 6: valueText = boidProps.minSpeed.toFixed(1); break;
            case 7: valueText = boidProps.maxSpeed.toFixed(1); break;
            case 8: valueText = (boidProps.turnFactor >= 0.2) ? 'MAX' : boidProps.turnFactor.toFixed(3); break;
            case 9: valueText = boidProps.margin.toFixed(1); break;
        }
        ctx.font = `${0.3 * knobRadius}px verdana`;
        ctx.fillStyle = `rgba(128, 230, 200, ${menuOpacity})`;
        ctx.fillText(valueText, knobX, knobY + 0.6 * knobRadius);
    }

    ctx.restore();
}

function drawInstructionsMenu() {
    if (instructionsMenuOpacity <= 0) return;
    
    const ctx = gOverlayCtx;

    const menuTopMargin = 0.02 * menuScale;
    const menuWidth = menuScale;
    const menuHeight = 1.45 * menuScale;
    const padding = 0.17 * menuScale;
    
    // Position menu slightly below simulation menu
    const menuUpperLeftX = (instructionsMenuX + 0.01) * window.innerWidth;
    const menuUpperLeftY = (instructionsMenuY + 0.0) * window.innerHeight;
    
    ctx.save();
    ctx.translate(menuUpperLeftX, menuUpperLeftY);
    
    // Draw menu background
    const cornerRadius = 8;
    ctx.beginPath();
    ctx.roundRect(-padding, -padding, menuWidth + padding * 2, menuHeight + padding * 2, cornerRadius);
    const menuGradient = ctx.createLinearGradient(0, -padding, 0, menuHeight + padding);
    menuGradient.addColorStop(0, `hsl(45, 30%, 20%, ${instructionsMenuOpacity})`);
    menuGradient.addColorStop(1, `hsl(45, 10%, 10%, ${instructionsMenuOpacity})`);
    ctx.fillStyle = menuGradient;
    ctx.fill();
    ctx.strokeStyle = `hsla(45, 20%, 70%, ${instructionsMenuOpacity})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw title
    ctx.fillStyle = `hsla(45, 10%, 80%, ${instructionsMenuOpacity})`;
    ctx.font = `bold ${0.05 * menuScale}px verdana`;
    ctx.textAlign = 'center';
    ctx.fillText('HUH?', menuWidth / 2, -padding + 0.05 * menuScale);
    
    // Draw close button
    const closeIconRadius = 0.1 * menuScale * 0.25;
    const closeIconX = -padding + closeIconRadius + 0.02 * menuScale;
    const closeIconY = -padding + closeIconRadius + 0.02 * menuScale;
    ctx.beginPath();
    ctx.arc(closeIconX, closeIconY, closeIconRadius, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(180, 40, 40, ${instructionsMenuOpacity})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(0, 0, 0, ${instructionsMenuOpacity})`;
    ctx.lineWidth = 2;
    const xSize = closeIconRadius * 0.4;
    ctx.beginPath();
    ctx.moveTo(closeIconX - xSize, closeIconY - xSize);
    ctx.lineTo(closeIconX + xSize, closeIconY + xSize);
    ctx.moveTo(closeIconX + xSize, closeIconY - xSize);
    ctx.lineTo(closeIconX - xSize, closeIconY + xSize);
    ctx.stroke();
    
    // Draw text lines
    ctx.fillStyle = `hsla(45, 10%, 80%, ${instructionsMenuOpacity})`;
    ctx.font = `bold ${0.04 * menuScale}px verdana`;
    ctx.textAlign = 'left';
    const textX = -padding + 0.05 * menuScale;
    const textY = menuTopMargin;
    const lineHeight = 0.06 * menuScale;
    ctx.fillText('What is this?', textX, 0);
    ctx.fillText('Camera Controls', textX, textY + 13 * lineHeight);
    ctx.fillText('Lighting Controls', textX, textY + 19 * lineHeight);
    const instructionText = [
        'Boids is a computer simulation created in 1986 by',
        'programmer and graphics researcher, Craig Reynolds.',
        'His algorithm has each "boid" observing its close neighbors',
        'and applying three simple rules: Separation, Alignment,',
        'and Cohesion. The result is the apparent flocking/schooling',
        'behavior seen in birds, fish, and other animals. Cool, right?',
        '',
        'This program is my implementation of that algorithm',
        'using JavaScript, the surprising capabilities of a modern',
        'web browser, and the GPU-accelerated 3D rendering library',
        'created by ThreeJS.org. Enjoy the show!',
        '',
        '',
        '- Left-click and drag to rotate camera',
        '- Scroll wheel to move forward and backward',
        '- Right-click and drag to move focus point',
        '- Camera icon to change camera mode',
        '',
        '',
        '- Lamps are interactive. Double-click to turn on/off',
        '- Left-click and drag...',
        '   BASE to move horizontally',
        '   POLE to rotate and raise/lower',
        '   CONE UP/DOWN to point upward/downward',
        '   CONE LEFT/RIGHT to adjust light spread',
        
        
    ]
    ctx.font = `${0.04 * menuScale}px verdana`;
    for (let i = 0; i < instructionText.length; i++) {
        ctx.fillText(instructionText[i], textX, textY + (i + 1) * lineHeight);
    }
    
    /*// Example of multiple lines of text
    //
    ctx.fillText('What is this?', textX, textY);
    ctx.fillText('line 2', textX, textY + lineHeight);*/
    
    ctx.restore();
}

function drawStylingMenu() {
    if (stylingMenuOpacity <= 0) return;
    
    const ctx = gOverlayCtx;
    const menuItems = [
        gTrailEnabled ? 1 : 0, gTrailLength, gTrailBoidIndex
    ];
    
    const ranges = [
        {min: 0, max: 1},           // trail enabled (0 or 1)
        {min: 50, max: 2000},       // trail length
        {min: 0, max: Math.min(1499, gPhysicsScene.objects.length - 1)} // trail boid index
    ];
    
    const knobRadius = 0.1 * menuScale;
    const knobSpacing = knobRadius * 3;
    const menuTopMargin = 0.2 * knobRadius;
    const menuWidth = knobSpacing * 2;
    const menuHeight = 15 * knobRadius;
    const padding = 1.7 * knobRadius;
    
    // Position menu slightly below simulation menu
    const menuUpperLeftX = stylingMenuX * window.innerWidth;
    const menuUpperLeftY = (stylingMenuY + 0.1) * window.innerHeight;
    
    ctx.save();
    ctx.translate(menuUpperLeftX + knobSpacing, menuUpperLeftY + 0.5 * knobSpacing);
    
    // Draw menu background
    const cornerRadius = 8;
    ctx.beginPath();
    ctx.roundRect(-padding, -padding, menuWidth + padding * 2, menuHeight + padding * 2, cornerRadius);
    const menuGradient = ctx.createLinearGradient(0, -padding, 0, menuHeight + padding);
    menuGradient.addColorStop(0, `hsl(30, 30%, 20%, ${stylingMenuOpacity})`);
    menuGradient.addColorStop(1, `hsl(25, 10%, 10%, ${stylingMenuOpacity})`);
    ctx.fillStyle = menuGradient;
    ctx.fill();
    ctx.strokeStyle = `hsla(35, 20%, 70%, ${stylingMenuOpacity})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw title
    ctx.fillStyle = `hsla(35, 10%, 80%, ${stylingMenuOpacity})`;
    ctx.font = `bold ${0.05 * menuScale}px verdana`;
    ctx.textAlign = 'center';
    ctx.fillText('STYLING', menuWidth / 2, -padding + 0.05 * menuScale);
    
    // Draw close button
    const closeIconRadius = knobRadius * 0.25;
    const closeIconX = -padding + closeIconRadius + 0.2 * knobRadius;
    const closeIconY = -padding + closeIconRadius + 0.2 * knobRadius;
    ctx.beginPath();
    ctx.arc(closeIconX, closeIconY, closeIconRadius, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(180, 40, 40, ${stylingMenuOpacity})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(0, 0, 0, ${stylingMenuOpacity})`;
    ctx.lineWidth = 2;
    const xSize = closeIconRadius * 0.4;
    ctx.beginPath();
    ctx.moveTo(closeIconX - xSize, closeIconY - xSize);
    ctx.lineTo(closeIconX + xSize, closeIconY + xSize);
    ctx.moveTo(closeIconX + xSize, closeIconY - xSize);
    ctx.lineTo(closeIconX - xSize, closeIconY + xSize);
    ctx.stroke();

    // ====== SECTION 1: BOID STYLE (MOVED TO TOP) ======
    
    // Draw boid geometry selection buttons
    const buttonY = menuTopMargin - knobRadius * 0.67;
    const buttonWidth = (menuWidth + padding * 1.2) / 3;
    const buttonHeight = knobRadius * 1.3;
    const buttonSpacing = 4;
    
    ctx.font = `${0.035 * menuScale}px verdana`;
    const geometryNames = [
        'Spheres', 'Cones', 'Cylinders', 'Cubes',
        'Tetrahedrons', 'Octahedrons', 'Dodecahedrons', 'Icosahedrons',
        'Capsules', 'Tori', 'Knots', 'Planes',
        'Rubber Ducks', 'Barramundi', 'Avocados'
    ];
    
    for (let i = 0; i < 15; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const totalRowWidth = (buttonWidth * 3) + (buttonSpacing * 2);
        const offsetX = (menuWidth - totalRowWidth) / 2;
        const btnX = offsetX + col * (buttonWidth + buttonSpacing);
        const btnY = buttonY + row * (buttonHeight + buttonSpacing);
        
        // Draw button
        ctx.beginPath();
        ctx.roundRect(btnX, btnY, buttonWidth, buttonHeight, 4);
        if (gBoidGeometryType === i) {
            ctx.fillStyle = `hsla(30, 30%, 50%, ${0.8 * stylingMenuOpacity})`;
        } else {
            ctx.fillStyle = `hsla(30, 30%, 20%, ${0.6 * stylingMenuOpacity})`;
        }
        ctx.fill();
        ctx.strokeStyle = `hsla(30, 10%, 60%, ${stylingMenuOpacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw label
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `hsla(0, 0%, 10%, ${stylingMenuOpacity})`;
        ctx.fillText(geometryNames[i], btnX + buttonWidth / 2 + 2, btnY + buttonHeight / 2 + 1);
        ctx.fillStyle = `hsla(30, 30%, 90%, ${stylingMenuOpacity})`;
        ctx.fillText(geometryNames[i], btnX + buttonWidth / 2, btnY + buttonHeight / 2);
        
    }
    
    // ====== SECTION 2: SURFACE MESH DETAIL ======
    // Draw Mesh Detail label and radio buttons
    const meshDetailY = buttonY + 5 * (buttonHeight + buttonSpacing) + knobRadius * 0.6;
    ctx.font = `bold ${0.04 * menuScale}px verdana`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `hsla(0, 0%, 10%, ${stylingMenuOpacity})`;
    ctx.fillText('Surface Mesh Detail', 0.5 * menuWidth, meshDetailY + 1);
    ctx.fillStyle = `hsla(30, 10%, 80%, ${stylingMenuOpacity})`;
    ctx.fillText('Surface Mesh Detail', 0.5 * menuWidth, meshDetailY);
    
    // Draw horizontal radio buttons for geometry segments
    const segmentOptions = [8, 16, 24, 32, 64];
    const meshRadioY = meshDetailY + knobRadius * 0.8;
    const meshRadioRadius = knobRadius * 0.35;
    const totalRadioWidth = segmentOptions.length * meshRadioRadius * 2 + (segmentOptions.length - 1) * meshRadioRadius * 1.5;
    const radioStartX = 0.5 * menuWidth - totalRadioWidth / 2 + meshRadioRadius;
    const radioSpacingH = meshRadioRadius * 3.5;
    
    ctx.font = `${0.32 * knobRadius}px Arial`;
    for (let i = 0; i < segmentOptions.length; i++) {
        const rbX = radioStartX + i * radioSpacingH;
        
        // Draw radio button circle
        ctx.beginPath();
        ctx.arc(rbX, meshRadioY, meshRadioRadius, 0, 2 * Math.PI);
        ctx.fillStyle = `hsla(30, 30%, 20%, ${0.8 * stylingMenuOpacity})`;
        ctx.strokeStyle = `hsla(30, 20%, 60%, ${stylingMenuOpacity})`;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw filled circle if selected
        if (geometrySegments === segmentOptions[i]) {
            ctx.beginPath();
            ctx.arc(rbX, meshRadioY, meshRadioRadius * 0.5, 0, 2 * Math.PI);
            ctx.fillStyle = `hsla(30, 60%, 60%, ${stylingMenuOpacity})`;
            ctx.fill();
        }
        
        // Draw label below button
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = `hsla(0, 0%, 10%, ${stylingMenuOpacity})`;
        ctx.fillText(segmentOptions[i], rbX + 1, meshRadioY + meshRadioRadius + 4 + 1);
        ctx.fillStyle = `hsla(30, 10%, 90%, ${stylingMenuOpacity})`;
        ctx.fillText(segmentOptions[i], rbX, meshRadioY + meshRadioRadius + 4);
    }
    
    // ====== SECTION 3: MATERIAL TYPE ======
    // Draw material type section
    const materialY = meshRadioY + knobRadius * 1.4;
    ctx.font = `bold ${0.04 * menuScale}px verdana`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `hsla(0, 0%, 10%, ${stylingMenuOpacity})`;
    ctx.fillText('Material Type', 0.5 * menuWidth, materialY + 1);
    ctx.fillStyle = `hsla(30, 10%, 80%, ${stylingMenuOpacity})`;
    ctx.fillText('Material Type', 0.5 * menuWidth, materialY);
    
    // Draw horizontal radio buttons for material types
    const materialOptions = ['basic', 'phong', 'standard', 'normal', 'toon'];
    const materialLabels = ['2D', 'Plastic', 'Metal', '"Normal"', 'Cartoon'];
    const materialRadioY = materialY + knobRadius * 0.8;
    const materialRadioRadius = knobRadius * 0.35;
    const totalMaterialRadioWidth = materialOptions.length * materialRadioRadius * 2 + (materialOptions.length - 1) * materialRadioRadius * 1.5;
    const materialRadioStartX = 0.5 * menuWidth - totalMaterialRadioWidth / 2 + materialRadioRadius;
    const materialRadioSpacingH = materialRadioRadius * 3.5;
    
    ctx.font = `${0.30 * knobRadius}px arial`;
    for (let i = 0; i < materialOptions.length; i++) {
        const rbX = materialRadioStartX + i * materialRadioSpacingH;
        
        // Draw radio button circle
        ctx.beginPath();
        ctx.arc(rbX, materialRadioY, materialRadioRadius, 0, 2 * Math.PI);
        ctx.fillStyle = `hsla(30, 30%, 20%, ${0.8 * stylingMenuOpacity})`;
        ctx.strokeStyle = `hsla(30, 20%, 60%, ${stylingMenuOpacity})`;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw filled circle if selected
        if (boidProps.material === materialOptions[i]) {
            ctx.beginPath();
            ctx.arc(rbX, materialRadioY, materialRadioRadius * 0.5, 0, 2 * Math.PI);
            ctx.fillStyle = `hsla(30, 60%, 60%, ${stylingMenuOpacity})`;
            ctx.fill();
        }
        
        // Draw label below button
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = `hsla(0, 0%, 10%, ${stylingMenuOpacity})`;
        ctx.fillText(materialLabels[i], rbX + 1, materialRadioY + materialRadioRadius + 4 + 1);
        ctx.fillStyle = `hsla(30, 10%, 90%, ${stylingMenuOpacity})`;
        ctx.fillText(materialLabels[i], rbX, materialRadioY + materialRadioRadius + 4);
    }
    
    // ====== SECTION 4: TRAIL CONTROLS (MOVED TO BOTTOM) ======
    // Draw trail control knobs at the bottom (keep original position)
    const trailSectionY = materialRadioY + knobRadius * 3.5;
    
    // Draw trail section heading above knobs
    const trailHeadingY = trailSectionY - knobRadius * 1.5;
    ctx.font = `bold ${0.04 * menuScale}px verdana`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `hsla(0, 0%, 10%, ${stylingMenuOpacity})`;
    ctx.fillText('Boid Trail', 0.5 * menuWidth, trailHeadingY + 1);
    ctx.fillStyle = `hsla(30, 10%, 80%, ${stylingMenuOpacity})`;
    ctx.fillText('Boid Trail', 0.5 * menuWidth, trailHeadingY);
    
    const fullMeterSweep = 1.6 * Math.PI;
    const meterStart = 0.5 * Math.PI + 0.5 * (2 * Math.PI - fullMeterSweep);
    
    const trailMenuItems = [gTrailLength, gTrailRadius];
    const trailRanges = [
        {min: 50, max: 2000},
        {min: 0.1, max: 2.0}
    ];
    
    for (let knob = 0; knob < 2; knob++) {
        const row = Math.floor(knob / 3);
        const col = knob % 3;
        const knobX = col * knobSpacing;
        const knobY = row * knobSpacing + trailSectionY;
        
        // Draw knob background
        ctx.beginPath();
        ctx.arc(knobX, knobY, 1.05 * knobRadius, 0, 2 * Math.PI);
        ctx.fillStyle = `hsla(30, 30%, 10%, ${0.9 * stylingMenuOpacity})`;
        ctx.fill();
        ctx.strokeStyle = `hsla(30, 20%, 50%, ${stylingMenuOpacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Calculate normalized value
        let knobValue = trailMenuItems[knob];
        let normalizedValue = (knobValue - trailRanges[knob].min) / (trailRanges[knob].max - trailRanges[knob].min);
        normalizedValue = Math.max(0, Math.min(1, normalizedValue));
        
        // Draw meter arc
        const gradient = ctx.createLinearGradient(
            knobX + Math.cos(meterStart) * knobRadius,
            knobY + Math.sin(meterStart) * knobRadius,
            knobX + Math.cos(meterStart + fullMeterSweep) * knobRadius,
            knobY + Math.sin(meterStart + fullMeterSweep) * knobRadius
        );
        gradient.addColorStop(0, `hsla(30, 30%, 60%, ${stylingMenuOpacity})`);
        gradient.addColorStop(0.5, `hsla(40, 30%, 60%, ${stylingMenuOpacity})`);
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
        ctx.strokeStyle = `hsla(30, 30%, 80%, ${stylingMenuOpacity})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw label
        const labels = [
            'Trail Length', 'Trail Radius'
        ];
        ctx.font = `${0.35 * knobRadius}px verdana`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `hsla(0, 0%, 10%, ${stylingMenuOpacity})`;
        ctx.fillText(labels[knob], knobX + 2, knobY + 1.35 * knobRadius + 1);
        ctx.fillStyle = `hsla(30, 10%, 90%, ${stylingMenuOpacity})`;
        ctx.fillText(labels[knob], knobX, knobY + 1.35 * knobRadius);
        
        // Draw value
        let valueText = '';
        let isOff = false;
        switch (knob) {
            case 0: 
                isOff = gTrailLength === 50;
                valueText = isOff ? 'OFF' : gTrailLength;
                break;
            case 1: valueText = gTrailRadius.toFixed(2); break;
        }
        ctx.font = `${0.3 * knobRadius}px verdana`;
        if (isOff && knob === 0) {
            ctx.fillStyle = `hsla(0, 90%, 70%, ${stylingMenuOpacity})`;
        } else {
            ctx.fillStyle = `hsla(30, 80%, 70%, ${stylingMenuOpacity})`;
        }
        ctx.fillText(valueText, knobX, knobY + 0.6 * knobRadius);
    }

    ctx.font = `${0.3 * knobRadius}px Arial`;
    
    // Draw radio buttons for trail color mode - positioned to the right of trail radius knob
    const radioY = trailSectionY - 0.4 * padding;
    const radioX = knobSpacing * 1.75; // To the right of the second knob
    const radioRadius = knobRadius * 0.3;
    const radioSpacing = knobRadius * 0.7;
    const radioLabels = ['White', 'Black', 'B&W', 'Color'];
    const trailDisabled = gTrailLength === 50;
    
    for (let i = 0; i < 4; i++) {
        const rbY = radioY + i * radioSpacing;
        
        // Draw radio button circle
        ctx.beginPath();
        ctx.arc(radioX, rbY, radioRadius, 0, 2 * Math.PI);
        if (trailDisabled) {
            ctx.fillStyle = `hsla(30, 10%, 25%, ${0.5 * stylingMenuOpacity})`;
            ctx.strokeStyle = `hsla(30, 5%, 40%, ${0.5 * stylingMenuOpacity})`;
        } else {
            ctx.fillStyle = `hsla(30, 30%, 20%, ${0.8 * stylingMenuOpacity})`;
            ctx.strokeStyle = `hsla(30, 20%, 60%, ${stylingMenuOpacity})`;
        }
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw filled circle if selected
        if (gTrailColorMode === i && !trailDisabled) {
            ctx.beginPath();
            ctx.arc(radioX, rbY, radioRadius * 0.5, 0, 2 * Math.PI);
            ctx.fillStyle = `hsla(30, 60%, 60%, ${stylingMenuOpacity})`;
            ctx.fill();
        }
        
        // Draw label
        ctx.font = `${0.33 * knobRadius}px Arial`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        if (trailDisabled) {
            ctx.fillStyle = `hsla(0, 0%, 30%, ${0.5 * stylingMenuOpacity})`;
            ctx.fillText(radioLabels[i], radioX + radioRadius + 5 + 2, rbY + 1);
            ctx.fillStyle = `hsla(30, 5%, 50%, ${0.5 * stylingMenuOpacity})`;
            ctx.fillText(radioLabels[i], radioX + radioRadius + 5, rbY);
        } else {
            ctx.fillStyle = `hsla(0, 0%, 10%, ${stylingMenuOpacity})`;
            ctx.fillText(radioLabels[i], radioX + radioRadius + 5 + 2, rbY + 1);
            ctx.fillStyle = `hsla(30, 10%, 90%, ${stylingMenuOpacity})`;
            ctx.fillText(radioLabels[i], radioX + radioRadius + 5, rbY);
        }
    }
    
    ctx.restore();
}

function drawColorMenu() {
    if (colorMenuOpacity <= 0) return;
    
    const ctx = gOverlayCtx;
    const knobRadius = 0.13 * menuScale; // Larger knob for color mix
    const colorWheelSize = 1.1 * menuScale; // Size of the color wheel rings
    const menuWidth = 0.6 * menuScale; // Match other menus
    const padding = 0.17 * menuScale;
    const menuHeight = 0.75 * colorWheelSize;
    const menuTopMargin = 0.33 * colorWheelSize; // Match other menus
    const wheelCenterY = menuTopMargin; // Place center at top margin
    
    // Position menu
    const menuUpperLeftX = colorMenuX * window.innerWidth;
    const menuUpperLeftY = (colorMenuY + 0.1) * window.innerHeight;
    
    ctx.save();
    ctx.translate(menuUpperLeftX, menuUpperLeftY);
    
    // Draw menu background
    const cornerRadius = 8;
    ctx.beginPath();
    ctx.roundRect(-padding, -padding, menuWidth + padding * 2, menuHeight + padding * 2, cornerRadius);
    const menuGradient = ctx.createLinearGradient(0, -padding, 0, menuHeight + padding);
    menuGradient.addColorStop(0, `hsl(0, 40%, 20%, ${colorMenuOpacity})`);
    menuGradient.addColorStop(1, `hsl(20, 20%, 10%, ${colorMenuOpacity})`);
    ctx.fillStyle = menuGradient;
    ctx.fill();
    ctx.strokeStyle = `hsla(0, 20%, 50%, ${colorMenuOpacity})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw title
    ctx.fillStyle = `hsla(0, 10%, 80%, ${colorMenuOpacity})`;
    ctx.font = `bold ${0.05 * menuScale}px verdana`;
    ctx.textAlign = 'center';
    ctx.fillText('COLOR', menuWidth / 2, -padding + 0.05 * menuScale);
    
    // Draw close button
    const closeIconRadius = 0.1 * menuScale * 0.25;
    const closeIconX = -padding + closeIconRadius + 0.02 * menuScale;
    const closeIconY = -padding + closeIconRadius + 0.02 * menuScale;
    ctx.beginPath();
    ctx.arc(closeIconX, closeIconY, closeIconRadius, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(180, 40, 40, ${colorMenuOpacity})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(0, 0, 0, ${colorMenuOpacity})`;
    ctx.lineWidth = 2;
    const xSize = closeIconRadius * 0.4;
    ctx.beginPath();
    ctx.moveTo(closeIconX - xSize, closeIconY - xSize);
    ctx.lineTo(closeIconX + xSize, closeIconY + xSize);
    ctx.moveTo(closeIconX + xSize, closeIconY - xSize);
    ctx.lineTo(closeIconX - xSize, closeIconY + xSize);
    ctx.stroke();
    
    // Draw color rings from offscreen canvas
    if (gColorWheelCanvas) {
        ctx.save();
        ctx.globalAlpha = colorMenuOpacity;
        
        // Gray out rings when not in Normal mode
        if (gColorationMode === 1 || gColorationMode === 2) {
            ctx.filter = 'grayscale(100%) brightness(0.6)';
        }
        
        const centerX = menuWidth / 2;
        const centerY = wheelCenterY;
        
        // Draw rotated rings
        ctx.translate(centerX, centerY);
        
        // Draw primary ring (outer) with rotation
        ctx.save();
        ctx.rotate(gPrimaryRingRotation);
        ctx.drawImage(gColorWheelCanvas, 
            -colorWheelSize / 2, -colorWheelSize / 2, 
            colorWheelSize, colorWheelSize);
        ctx.restore();
        
        // Draw secondary ring (inner) with independent rotation
        // We need to mask out the outer ring area
        ctx.save();
        ctx.rotate(gSecondaryRingRotation);
        // Create a clipping path for the inner ring only
        ctx.beginPath();
        const innerRingOuterR = (colorWheelSize / 2) * 0.475;
        const innerRingInnerR = (colorWheelSize / 2) * 0.343;
        ctx.arc(0, 0, innerRingOuterR, 0, 2 * Math.PI);
        ctx.arc(0, 0, innerRingInnerR, 0, 2 * Math.PI, true);
        ctx.clip();
        ctx.drawImage(gColorWheelCanvas, 
            -colorWheelSize / 2, -colorWheelSize / 2, 
            colorWheelSize, colorWheelSize);
        ctx.restore();
        
        ctx.translate(-centerX, -centerY);
        
        // Draw wedge indicators at 3 o'clock position
        const wedgeLength = 0.08 * menuScale;
        const outerRingRadius = (colorWheelSize / 2) * 0.655;
        const innerRingRadius = (colorWheelSize / 2) * 0.44;
        
        // Primary wedge (outer)
        ctx.strokeStyle = 'white';
        ctx.fillStyle = `hsl(${gPrimaryHue}, 100%, 50%)`;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(centerX + outerRingRadius, centerY, wedgeLength * 0.8, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Secondary wedge (inner)
        ctx.fillStyle = `hsl(${gSecondaryHue}, 100%, 50%)`;
        ctx.beginPath();
        ctx.arc(centerX + innerRingRadius - 8, centerY, wedgeLength * 0.8, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.filter = 'none';
        ctx.restore();
    }
    
    // Draw Mix knob in center (using standard knob style)
    const knobCenterX = menuWidth / 2;
    const knobCenterY = wheelCenterY;
    
    // Draw knob background (matching other menus)
    ctx.beginPath();
    ctx.arc(knobCenterX, knobCenterY, knobRadius * 1.05, 0, 2 * Math.PI);
    ctx.fillStyle = `hsla(180, 30%, 10%, ${0.9 * colorMenuOpacity})`;
    ctx.fill();
    ctx.strokeStyle = `hsla(180, 20%, 60%, ${colorMenuOpacity})`;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Calculate normalized value
    const normalizedValue = gColorMixPercentage / 100;
    
    // Draw two concentric arcs representing the two chosen colors
    const fullMeterSweep = 1.6 * Math.PI;
    const meterStart = 0.5 * Math.PI + 0.5 * (2 * Math.PI - fullMeterSweep);
    const pointerAngle = meterStart + fullMeterSweep * normalizedValue;
    
    // Define arc radii and colors
    const arcRadii = [knobRadius * 0.78, knobRadius * 0.92]; // inner, outer
    const arcColors = [
        // Inner arc = secondary color
        gColorationMode === 1 || gColorationMode === 2 
            ? { hue: 0, sat: 0, light: 40 }
            : { hue: gSecondaryHue, sat: 100, light: 50 },
        // Outer arc = primary color
        gColorationMode === 1 || gColorationMode === 2 
            ? { hue: 0, sat: 0, light: 40 }
            : { hue: gPrimaryHue, sat: 100, light: 50 }
    ];
    
    // Draw two arcs with tapering widths in opposite directions
    const segmentCount = 32;
    const maxWidth = 6;
    const minWidth = 1;
    
    for (let arcIdx = 0; arcIdx < 2; arcIdx++) {
        const arcRadius = arcRadii[arcIdx];
        const arcColor = arcColors[arcIdx];
        
        for (let i = 0; i < segmentCount; i++) {
            const segmentStart = meterStart + (i / segmentCount) * fullMeterSweep;
            const segmentEnd = meterStart + ((i + 1) / segmentCount) * fullMeterSweep;
            
            // Calculate taper factor based on direction
            let taperFactor;
            if (arcIdx === 0) {
                // Inner arc: taper clockwise (full width at start, thin at end)
                taperFactor = 1.0 - (i / segmentCount);
            } else {
                // Outer arc: taper counterclockwise (thin at start, full width at end)
                taperFactor = i / segmentCount;
            }
            
            // Calculate segment width with smooth tapering
            const segmentWidth = minWidth + (maxWidth - minWidth) * taperFactor;
            
            // Draw segment
            ctx.beginPath();
            ctx.arc(knobCenterX, knobCenterY, arcRadius, segmentStart, segmentEnd);
            ctx.strokeStyle = `hsla(${arcColor.hue}, ${arcColor.sat}%, ${arcColor.light}%, ${colorMenuOpacity})`;
            ctx.lineWidth = segmentWidth;
            ctx.stroke();
        }
    }
    
    // Draw needle (pointerAngle already calculated above)
    const pointerLength = knobRadius * 0.6;
    const pointerEndX = knobCenterX + Math.cos(pointerAngle) * pointerLength;
    const pointerEndY = knobCenterY + Math.sin(pointerAngle) * pointerLength;
    ctx.beginPath();
    ctx.moveTo(knobCenterX, knobCenterY);
    ctx.lineTo(pointerEndX, pointerEndY);
    ctx.strokeStyle = `hsla(320, 30%, 80%, ${colorMenuOpacity})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw label (centered on knob)
    ctx.font = `${0.30 * knobRadius}px verdana`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `hsla(0, 10%, 90%, ${colorMenuOpacity})`;
    ctx.fillText('Mix', knobCenterX, knobCenterY + 0.6 * knobRadius);
    
    // Draw radio buttons for coloration mode
    const radioY = menuHeight + 0.01 * menuScale;
    const radioRadius = knobRadius * 0.3;
    const radioSpacing = menuWidth / 3;
    const radioLabels = ['By Wheel', 'By Direction', 'By Speed'];
    
    ctx.font = `${0.03 * menuScale}px verdana`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i < 3; i++) {
        const radioX = (i + 0.5) * radioSpacing;
        
        // Draw radio button circle
        ctx.beginPath();
        ctx.arc(radioX, radioY, radioRadius, 0, 2 * Math.PI);
        ctx.fillStyle = `hsla(0, 30%, 20%, ${0.8 * colorMenuOpacity})`;
        ctx.strokeStyle = `hsla(0, 20%, 60%, ${colorMenuOpacity})`;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Fill if selected
        if (gColorationMode === i) {
            ctx.beginPath();
            ctx.arc(radioX, radioY, radioRadius * 0.5, 0, 2 * Math.PI);
            ctx.fillStyle = `hsla(0, 60%, 70%, ${colorMenuOpacity})`;
            ctx.fill();
        }
        
        // Draw label
        ctx.fillStyle = `hsla(0, 10%, 80%, ${colorMenuOpacity})`;
        ctx.fillText(radioLabels[i], radioX, radioY + 0.07 * menuScale);
    }
    
    ctx.restore();
}

function drawLightingMenu() {
    if (lightingMenuOpacity <= 0) return;
    
    const ctx = gOverlayCtx;
    const knobRadius = 0.1 * menuScale;
    const knobSpacing = knobRadius * 3;
    const menuTopMargin = 0.2 * knobRadius;
    const menuWidth = knobSpacing * 2; // 3 knobs across
    const menuHeight = knobSpacing * 1.5; // 2 rows
    const padding = 1.7 * knobRadius;
    
    const menuOriginX = lightingMenuX * window.innerWidth;
    const menuOriginY = lightingMenuY * window.innerHeight;
    
    ctx.save();
    ctx.translate(menuOriginX + knobSpacing, menuOriginY + 0.5 * knobSpacing);
    ctx.globalAlpha = lightingMenuOpacity;
    
    // Draw menu background
    const cornerRadius = 8;
    ctx.beginPath();
    ctx.roundRect(-padding, -padding, menuWidth + padding * 2, menuHeight + padding * 2, cornerRadius);
    ctx.fillStyle = `hsla(45, 30%, 12%, ${0.95 * lightingMenuOpacity})`;
    ctx.fill();
    ctx.strokeStyle = `hsla(45, 20%, 70%, ${lightingMenuOpacity})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw title
    ctx.fillStyle = `hsla(45, 10%, 90%, ${lightingMenuOpacity})`;
    ctx.font = `bold ${0.05 * menuScale}px verdana`;
    ctx.textAlign = 'center';
    ctx.fillText('LIGHTING', menuWidth / 2, -padding + 0.05 * menuScale);
    
    // Draw close button
    const closeIconRadius = knobRadius * 0.25;
    const closeIconX = -padding + closeIconRadius + 0.2 * knobRadius;
    const closeIconY = -padding + closeIconRadius + 0.2 * knobRadius;
    ctx.beginPath();
    ctx.arc(closeIconX, closeIconY, closeIconRadius, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(180, 40, 40, ${lightingMenuOpacity})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(0, 0, 0, ${lightingMenuOpacity})`;
    ctx.lineWidth = 2;
    const xSize = closeIconRadius * 0.4;
    ctx.beginPath();
    ctx.moveTo(closeIconX - xSize, closeIconY - xSize);
    ctx.lineTo(closeIconX + xSize, closeIconY + xSize);
    ctx.moveTo(closeIconX + xSize, closeIconY - xSize);
    ctx.lineTo(closeIconX - xSize, closeIconY + xSize);
    ctx.stroke();
    
    const knobs = [
        { label: 'Ambient', value: gAmbientIntensity, min: 0, max: 4 },
        { label: 'Overhead', value: gOverheadIntensity, min: 0, max: 4 },
        { label: 'Spotlight', value: gSpotlightIntensity, min: 0, max: 2 },
        { label: 'Penumbra', value: gSpotlightPenumbra, min: 0, max: 1 }
    ];
    
    const fullMeterSweep = 1.6 * Math.PI;
    const meterStart = 0.5 * Math.PI + 0.5 * (2 * Math.PI - fullMeterSweep);
    
    for (let i = 0; i < knobs.length; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const knobX = col * knobSpacing;
        const knobY = row * knobSpacing + menuTopMargin;
        
        // Draw knob background
        ctx.beginPath();
        ctx.arc(knobX, knobY, knobRadius * 1.05, 0, 2 * Math.PI);
        ctx.fillStyle = `hsla(45, 30%, 10%, ${0.9 * lightingMenuOpacity})`;
        ctx.fill();
        ctx.strokeStyle = `hsla(45, 20%, 60%, ${lightingMenuOpacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Calculate normalized value
        const normalizedValue = (knobs[i].value - knobs[i].min) / (knobs[i].max - knobs[i].min);
        
        // Draw meter arc
        ctx.strokeStyle = `hsla(45, 60%, 60%, ${lightingMenuOpacity})`;
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
        ctx.strokeStyle = `hsla(45, 30%, 80%, ${lightingMenuOpacity})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw value inside meter
        ctx.font = `${0.3 * knobRadius}px verdana`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `hsla(45, 60%, 70%, ${lightingMenuOpacity})`;
        ctx.fillText(knobs[i].value.toFixed(2), knobX, knobY + 0.6 * knobRadius);
        
        // Draw label below knob
        ctx.font = `${0.35 * knobRadius}px verdana`;
        ctx.fillStyle = `hsla(45, 10%, 90%, ${lightingMenuOpacity})`;
        ctx.fillText(knobs[i].label, knobX, knobY + 1.35 * knobRadius);
    }
    
    ctx.restore();
}

// Initialize the color wheel on an offscreen canvas
function initColorWheel() {
    // Create offscreen canvas for color rings
    gColorWheelCanvas = document.createElement('canvas');
    const size = 400; // Increased size
    gColorWheelCanvas.width = size;
    gColorWheelCanvas.height = size;
    gColorWheelCtx = gColorWheelCanvas.getContext('2d');
    
    const centerX = size / 2;
    const centerY = size / 2;
    const outerRadius = size / 2 - 55; // Further reduced
    const outerInnerRadius = outerRadius * 0.80; // Adjusted for larger knob
    const innerRadius = outerRadius * 0.65; // Reduced inner ring size
    const innerInnerRadius = outerRadius * 0.47; // Reduced inner ring size
    
    // Draw outer color ring (primary)
    for (let angle = 0; angle < 360; angle += 1) {
        const startAngle = angle * Math.PI / 180;
        const endAngle = (angle + 1) * Math.PI / 180;
        
        gColorWheelCtx.beginPath();
        gColorWheelCtx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
        gColorWheelCtx.arc(centerX, centerY, outerInnerRadius, endAngle, startAngle, true);
        gColorWheelCtx.closePath();
        
        gColorWheelCtx.fillStyle = `hsl(${angle}, 100%, 50%)`;
        gColorWheelCtx.fill();
    }
    
    // Draw inner color ring (secondary)
    for (let angle = 0; angle < 360; angle += 1) {
        const startAngle = angle * Math.PI / 180;
        const endAngle = (angle + 1) * Math.PI / 180;
        
        gColorWheelCtx.beginPath();
        gColorWheelCtx.arc(centerX, centerY, innerRadius, startAngle, endAngle);
        gColorWheelCtx.arc(centerX, centerY, innerInnerRadius, endAngle, startAngle, true);
        gColorWheelCtx.closePath();
        
        gColorWheelCtx.fillStyle = `hsl(${angle}, 100%, 50%)`;
        gColorWheelCtx.fill();
    }
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
    gAmbientLight = new THREE.AmbientLight( 0x4d4d4d );
    gAmbientLight.intensity = gAmbientIntensity;
    gThreeScene.add( gAmbientLight );	
    
    //gThreeScene.fog = new THREE.Fog( 0xaaaaaa, 10, 100 );				

    // ===== LAMP 1 =====
    // Create lamp 1 using Lamp class
    gLamps[1] = new Lamp(
        new THREE.Vector3(22.61, 14.14, 18.58),
        new THREE.Vector3(16.16, 10.07, 12.13),
        1
    );

    // ===== LAMP 2 =====
    // Spawn lamp 2 at same position as lamp 1
    gLamps[2] = new Lamp(
        new THREE.Vector3(22.61, 14.14, 18.58),
        new THREE.Vector3(16.16, 10.07, 12.13),
        2
    );
    // Then move it -7 units along X axis and -15 units along Z axis
    translateLampAssembly(-37, -35, 2);
    // Then rotate it 90 degrees
    rotateLampAssembly(Math.PI * 0.9, 2);

    // Directional Overhead Light
    //var dirLight = new THREE.DirectionalLight( 0x55505a, 1 );
    //var dirLight = new THREE.DirectionalLight( 0x55505a, 2 );
    gDirectionalLight = new THREE.DirectionalLight( 0x55505a, gOverheadIntensity );
    gDirectionalLight.position.set( 0, 30, 0 );
    var dirLight = gDirectionalLight; // Keep backward compatibility
    dirLight.castShadow = true;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 40;

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
    
    // Load stool model using GLTFLoader
    // Check if GLTFLoader is available
    if (typeof THREE.GLTFLoader !== 'undefined') {
        var loader = new THREE.GLTFLoader();
        loader.load(
            'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/stool.gltf',
            function(gltf) {
                var stool = gltf.scene;
                
                // Position on floor in center of room - start high for animation
                stool.position.set(-20, 30, -8);
                stool.rotation.y = -Math.PI / 8; // Rotate 45 degrees
                
                // Scale if needed (adjust this value to make it bigger/smaller)
                stool.scale.set(1.5, 1.5, 1.5);
                
                // Remove any imported lights first
                var lightsToRemove = [];
                stool.traverse(function(child) {
                    if (child.isLight) {
                        lightsToRemove.push(child);
                    }
                });
                lightsToRemove.forEach(function(light) {
                    if (light.parent) {
                        light.parent.remove(light);
                    }
                });
                
                // Create a rotating wheel group
                var rotatingWheelGroup = new THREE.Group();
                var wheelPartsToRotate = [];
                var hubMesh = null;
                
                // Apply MeshPhongMaterial to all meshes and enable shadows
                stool.traverse(function(child) {
                    if (child.isMesh) {
                        // Get the original color if it exists
                        var color = 0xcccccc;
                        if (child.material && child.material.color) {
                            color = child.material.color.getHex();
                        }
                        
                        // Apply new MeshPhongMaterial
                        child.material = new THREE.MeshPhongMaterial({
                            color: color,
                            shininess: 30
                        });
                        
                        // Enable shadows
                        child.castShadow = true;
                        child.receiveShadow = true;
                        
                        // Find hub to use as pivot point
                        var name = child.name.toLowerCase();
                        if (name === 'hubbody') {
                            hubMesh = child;
                        }
                        
                        // Mark base/fork parts as draggable
                        if (name.includes('fork') || name.includes('seat') || name.includes('base')) {
                            child.userData.isDraggableStool = true;
                        }
                        
                        // Mark legs separately for rotation
                        if (name.includes('leg')) {
                            child.userData.isStoolLeg = true;
                        }
                        
                        // Identify wheel parts - tire, spokes, valve (NOT hub/axle/flanges)
                        if ((name.includes('tire') || name.includes('spoke') || 
                             name.includes('valve') || name.includes('vavle')) &&
                            !name.includes('hub') && !name.includes('axle') && !name.includes('flange')) {
                            wheelPartsToRotate.push(child);
                        }
                    }
                });
                
                // Group wheel parts for rotation
                if (wheelPartsToRotate.length > 0 && hubMesh) {
                    // Find the parent that will contain our rotating group
                    var wheelParent = hubMesh.parent;
                    
                    // Add rotating group to the same parent as hub
                    if (wheelParent) {
                        wheelParent.add(rotatingWheelGroup);
                    } else {
                        stool.add(rotatingWheelGroup);
                    }
                    
                    // Position group at hub's local position (but don't copy rotation)
                    rotatingWheelGroup.position.copy(hubMesh.position);
                    
                    // Reparent wheel parts to rotating group
                    wheelPartsToRotate.forEach(function(part) {
                        // Store original local transform relative to parent
                        var localPos = part.position.clone();
                        var localRot = part.rotation.clone();
                        var localScale = part.scale.clone();
                        var oldParent = part.parent;
                        
                        if (oldParent) {
                            oldParent.remove(part);
                        }
                        rotatingWheelGroup.add(part);
                        
                        // Keep the part in the same world position
                        // Calculate offset from hub
                        part.position.set(
                            localPos.x - hubMesh.position.x,
                            localPos.y - hubMesh.position.y,
                            localPos.z - hubMesh.position.z
                        );
                        part.rotation.copy(localRot);
                        part.scale.copy(localScale);
                        
                        // Fix nested torus orientation if this is the tire
                        if (part.name.toLowerCase().includes('tire')) {
                            part.traverse(function(child) {
                                if (child.geometry && child.geometry.type === 'TorusGeometry') {
                                    // Reset rotation to match parent tire orientation
                                    // Tire rotates around X axis, so nested torus should have no relative rotation
                                    child.rotation.set(0, 0, 0);
                                }
                            });
                        }
                    });
                    
                    gWheelParts = [rotatingWheelGroup]; // Store the group
                    gBicycleWheel = rotatingWheelGroup;
                } else {
                    gWheelParts = wheelPartsToRotate;
                    gBicycleWheel = stool;
                }
                
                // Add invisible floor grab area under stool (large cylinder at ground level)
                var floorGrabRadius = 2.5; // Radius to cover area inside legs
                var floorGrabHeight = 0.1;
                var floorGrabGeometry = new THREE.CylinderGeometry(floorGrabRadius, floorGrabRadius, floorGrabHeight, 32);
                var floorGrabMaterial = new THREE.MeshBasicMaterial({visible: false});
                var floorGrabMesh = new THREE.Mesh(floorGrabGeometry, floorGrabMaterial);
                floorGrabMesh.position.set(0, floorGrabHeight / 2, 0); // At ground level
                floorGrabMesh.userData.isDraggableStool = true;
                stool.add(floorGrabMesh);
                
                // Add invisible grab area cylinder for seat area
                var seatGrabRadius = 1.8;
                var seatGrabHeight = 7.0; // Cover from base up through seat
                var seatGrabGeometry = new THREE.CylinderGeometry(seatGrabRadius, seatGrabRadius, seatGrabHeight, 32);
                var seatGrabMaterial = new THREE.MeshBasicMaterial({visible: false});
                var seatGrabMesh = new THREE.Mesh(seatGrabGeometry, seatGrabMaterial);
                seatGrabMesh.position.set(0, seatGrabHeight / 2, 0); // Start from ground
                seatGrabMesh.userData.isDraggableStool = true;
                stool.add(seatGrabMesh);
                
                // Add invisible cylinder around tire for easier clicking to spin wheel
                var tireClickRadius = 2.0; // Larger than actual tire
                var tireClickHeight = 2.0; // Cover tire height
                var tireClickGeometry = new THREE.CylinderGeometry(tireClickRadius, tireClickRadius, tireClickHeight, 32);
                var tireClickMaterial = new THREE.MeshBasicMaterial({visible: false});
                var tireClickMesh = new THREE.Mesh(tireClickGeometry, tireClickMaterial);
                // Position at hub height, rotate to horizontal like the wheel
                if (hubMesh) {
                    tireClickMesh.position.copy(hubMesh.position);
                }
                tireClickMesh.rotation.z = Math.PI / 2; // Rotate to horizontal
                tireClickMesh.userData.isWheelClickArea = true;
                stool.add(tireClickMesh);
                
                gThreeScene.add(stool);
                gStool = stool; // Store global reference
                
                // Create cylinder obstacle for boid avoidance (up to top of tire)
                var stoolObstacleRadius = 2.5; // Cover stool legs area
                var stoolObstacleHeight = 6.0; // Up to top of tire
                // Pass skipTori flag to prevent adding decorative tori
                gStoolObstacle = new CylinderObstacle(
                    stoolObstacleRadius,
                    stoolObstacleHeight,
                    new THREE.Vector3(stool.position.x, stoolObstacleHeight / 2, stool.position.z),
                    { x: 0, y: stool.rotation.y, z: 0 },
                    true  // skipTori parameter
                );
                // Make the obstacle invisible by hiding its meshes
                if (gStoolObstacle.columnSections) {
                    gStoolObstacle.columnSections.forEach(function(section) {
                        section.visible = false;
                    });
                }
                if (gStoolObstacle.groutLayers) {
                    gStoolObstacle.groutLayers.forEach(function(layer) {
                        layer.visible = false;
                    });
                }
                if (gStoolObstacle.discMesh) gStoolObstacle.discMesh.visible = false;
                if (gStoolObstacle.conicalPedestalMesh) gStoolObstacle.conicalPedestalMesh.visible = false;
                if (gStoolObstacle.pedestalMesh) gStoolObstacle.pedestalMesh.visible = false;
                gObstacles.push(gStoolObstacle);
                console.log('Stool loaded successfully with rotating wheel group containing ' + wheelPartsToRotate.length + ' parts');
            },
            function(xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function(error) {
                console.error('Error loading stool model:', error);
            }
        );
    } else {
        console.error('THREE.GLTFLoader is not loaded. Please add the script tag: <script src="https://cdn.jsdelivr.net/npm/three@0.160.0/examples/js/loaders/GLTFLoader.js"></script>');
    }
    
    // Load Duck model using GLTFLoader
    if (typeof THREE.GLTFLoader !== 'undefined') {
        var duckLoader = new THREE.GLTFLoader();
        duckLoader.load(
            'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/Duck.gltf',
            function(gltf) {
                var duck = gltf.scene;
                
                // Position below floor initially for entrance animation
                duck.position.set(18, gDuckStartY, 10);
                
                // Scale if needed (adjust this value to make it bigger/smaller)
                duck.scale.set(4, 4, 4);
                duck.rotation.y = 0.8 * Math.PI; // Rotate to face slightly left of forward
                
                // Optional: rotate the duck to face a specific direction
                // duck.rotation.y = Math.PI / 4; // Uncomment to rotate
                
                // Remove any imported lights
                var lightsToRemove = [];
                duck.traverse(function(child) {
                    if (child.isLight) {
                        lightsToRemove.push(child);
                    }
                });
                lightsToRemove.forEach(function(light) {
                    if (light.parent) {
                        light.parent.remove(light);
                    }
                });
                
                // Enable shadows and mark the main mesh as draggable
                duck.traverse(function(child) {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        child.userData.isDraggableDuck = true;
                    }
                });
                
                // Add invisible beak collision area for rotation
                var beakCollisionGeometry = new THREE.BoxGeometry(0.45, 0.36, 0.36);
                var beakCollisionMaterial = new THREE.MeshBasicMaterial({
                    visible: false
                });
                var beakCollisionMesh = new THREE.Mesh(beakCollisionGeometry, beakCollisionMaterial);
                beakCollisionMesh.position.set(0.825, 1.25, -0.15);
                beakCollisionMesh.userData.isDuckBeak = true;
                duck.add(beakCollisionMesh);
                
                gThreeScene.add(duck);
                gDuck = duck; // Store global reference
                
                // Create blue disc for entrance animation
                var discGeometry = new THREE.CircleGeometry(0.01, 32);
                var discMaterial = new THREE.MeshStandardMaterial({
                    color: 0x1E90FF,
                    side: THREE.DoubleSide,
                    transparent: false
                });
                gDuckEntranceDisc = new THREE.Mesh(discGeometry, discMaterial);
                gDuckEntranceDisc.position.set(duck.position.x, 0.01, duck.position.z);
                gDuckEntranceDisc.rotation.x = -Math.PI / 2; // Lay flat on floor
                gDuckEntranceDisc.receiveShadow = true;
                gThreeScene.add(gDuckEntranceDisc);
                
                // Create white outline ring for disc (thicker)
                var ringGeometry = new THREE.RingGeometry(0.009, 0.011, 32);
                var ringMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0xFFFFFF, 
                    side: THREE.DoubleSide 
                });
                gDuckEntranceDiscOutline = new THREE.Mesh(ringGeometry, ringMaterial);
                gDuckEntranceDiscOutline.position.set(duck.position.x, 0.02, duck.position.z);
                gDuckEntranceDiscOutline.rotation.x = -Math.PI / 2;
                gDuckEntranceDiscOutline.receiveShadow = true;
                gThreeScene.add(gDuckEntranceDiscOutline);
                
                // Store a clone as template for boid geometry
                gDuckTemplate = duck.clone();
                
                // Create sphere obstacle for boid avoidance
                var duckObstacleRadius = 2.0; // Radius that covers the duck
                gDuckObstacle = new SphereObstacle(
                    duckObstacleRadius,
                    new THREE.Vector3(duck.position.x, duck.position.y + 1.5, duck.position.z)
                );
                // Make the obstacle invisible
                if (gDuckObstacle.mesh) {
                    gDuckObstacle.mesh.visible = false;
                }
                gObstacles.push(gDuckObstacle);
                
                console.log('Duck model loaded successfully');
            },
            function(xhr) {
                console.log('Duck model: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function(error) {
                console.error('Error loading Duck model:', error);
            }
        );
    }
    
    // Load Barramundi Fish model using GLTFLoader
    if (typeof THREE.GLTFLoader !== 'undefined') {
        var fishLoader = new THREE.GLTFLoader();
        fishLoader.load(
            'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/BarramundiFish.gltf',
            function(gltf) {
                var fish = gltf.scene;
                
                // Position at geometric center of room (mid-height)
                fish.position.set(15, 15, -19.2);
                
                // Scale fish appropriately
                fish.scale.set(12, 12, 12);
                
                // Rotate to face forward
                fish.rotation.y = 0.5 * Math.PI; // Rotate 90 degrees to face forward
                
                // Remove any imported lights
                var lightsToRemove = [];
                fish.traverse(function(child) {
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
                fish.traverse(function(child) {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        
                        // Brighten the material
                        if (child.material) {
                            if (child.material.map) {
                                child.material.emissiveMap = child.material.map;
                                child.material.emissive = new THREE.Color(0xffffff);
                                child.material.emissiveIntensity = 0.3;
                            }
                            child.material.needsUpdate = true;
                        }
                    }
                });
                
                //gThreeScene.add(fish);
                window.gFish = fish; // Store global reference
                
                // Store a clone as template for boid geometry
                gFishTemplate = fish.clone();
                
                console.log('Barramundi Fish model loaded successfully');
            },
            function(xhr) {
                console.log('Barramundi Fish model: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function(error) {
                console.error('Error loading Barramundi Fish model:', error);
            }
        );
    }
    
    // Load Avocado model using GLTFLoader
    if (typeof THREE.GLTFLoader !== 'undefined') {
        var avocadoLoader = new THREE.GLTFLoader();
        avocadoLoader.load(
            'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/Avocado.gltf',
            function(gltf) {
                var avocado = gltf.scene;
                
                // Position at geometric center of room (mid-height)
                avocado.position.set(0, 8, 0);
                
                // Scale avocado appropriately
                avocado.scale.set(12, 12, 12);
                
                // Rotate to face forward
                avocado.rotation.y = 0.5 * Math.PI;
                
                // Remove any imported lights
                var lightsToRemove = [];
                avocado.traverse(function(child) {
                    if (child.isLight) {
                        lightsToRemove.push(child);
                    }
                });
                lightsToRemove.forEach(function(light) {
                    if (light.parent) {
                        light.parent.remove(light);
                    }
                });
                
                // Enable shadows for all meshes
                avocado.traverse(function(child) {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                //gThreeScene.add(avocado);
                window.gAvocado = avocado; // Store global reference
                
                // Store a clone as template for boid geometry
                gAvocadoTemplate = avocado.clone();
                
                console.log('Avocado model loaded successfully');
            },
            function(xhr) {
                console.log('Avocado model: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function(error) {
                console.error('Error loading Avocado model:', error);
            }
        );
    }
    
    // Load Teapot model using GLTFLoader
    if (typeof THREE.GLTFLoader !== 'undefined') {
        var teapotLoader = new THREE.GLTFLoader();
        teapotLoader.load(
            'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/teapotTable.gltf',
            function(gltf) {
                var teapot = gltf.scene;
                
                // Position object at starting position
                teapot.position.set(-17, 0, 25);
                
                // Scale teapot appropriately
                teapot.scale.set(.25, .25, .25);
                
                // Remove any imported lights
                var lightsToRemove = [];
                teapot.traverse(function(child) {
                    if (child.isLight) {
                        lightsToRemove.push(child);
                    }
                });
                lightsToRemove.forEach(function(light) {
                    if (light.parent) {
                        light.parent.remove(light);
                    }
                });
                
                // Enable shadows and mark as draggable for all meshes
                teapot.traverse(function(child) {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        child.userData.isDraggableTeapot = true;
                    }
                });
                
                gThreeScene.add(teapot);
                gTeapot = teapot; // Store global reference
                
                // Create box obstacle for boid avoidance
                var teapotObstacleWidth = 6.0;  // X dimension
                var teapotObstacleHeight = 4.0; // Y dimension
                var teapotObstacleDepth = 4.0;  // Z dimension
                gTeapotObstacle = new BoxObstacle(
                    teapotObstacleWidth,
                    teapotObstacleHeight,
                    teapotObstacleDepth,
                    new THREE.Vector3(teapot.position.x, teapot.position.y + teapotObstacleHeight / 2, teapot.position.z),
                    { x: 0, y: teapot.rotation.y, z: 0 }
                );
                // Make the obstacle invisible
                if (gTeapotObstacle.mesh) {
                    gTeapotObstacle.mesh.visible = false;
                }
                gObstacles.push(gTeapotObstacle);
                
                console.log('Teapot model loaded successfully');
            },
            function(xhr) {
                console.log('Teapot model: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function(error) {
                console.error('Error loading Teapot model:', error);
            }
        );
    }
    
    // Add transparent boundary walls
    var boxSize = gPhysicsScene.worldSize;
    var wallOpacity = 1.0;
    
    // Front wall (positive Z) - grafWall.jpg image
    // var frontWallCanvas = document.createElement('canvas');
    // frontWallCanvas.width = 1024;
    // frontWallCanvas.height = 1024;
    // var frontWallCtx = frontWallCanvas.getContext('2d');
    var wallTileSize = 512;
    // for (var i = 0; i < 2; i++) {
    //     for (var j = 0; j < 2; j++) {
    //         frontWallCtx.fillStyle = (i + j) % 2 === 0 ? '#FF8A94' : '#e6e6e6';
    //         frontWallCtx.fillRect(i * wallTileSize, j * wallTileSize, wallTileSize, wallTileSize);
    //     }
    // }
    // frontWallCtx.strokeStyle = '#333333';
    // frontWallCtx.lineWidth = 4;
    // for (var i = 0; i < 2; i++) {
    //     for (var j = 0; j < 2; j++) {
    //         frontWallCtx.strokeRect(i * wallTileSize, j * wallTileSize, wallTileSize, wallTileSize);
    //     }
    // }
    // var frontWallTexture = new THREE.CanvasTexture(frontWallCanvas);
    // frontWallTexture.wrapS = THREE.RepeatWrapping;
    // frontWallTexture.wrapT = THREE.RepeatWrapping;
    // frontWallTexture.repeat.set((boxSize.x * 2) / (4 * 5), boxSize.y / (4 * 5));
    
    var frontWallTexture = new THREE.TextureLoader().load(
        'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/grafWall.jpg',
        function(texture) {
            // Flip the texture horizontally
            texture.wrapS = THREE.RepeatWrapping;
            texture.repeat.x = -1;
            texture.needsUpdate = true;
            // Apply texture to emissive map
            frontWallMaterial.emissiveMap = texture;
            frontWallMaterial.needsUpdate = true;
        },
        undefined,
        function(err) {
            console.error('Error loading grafWall.jpg:', err);
        }
    );
    
    var frontWallMaterial = new THREE.MeshStandardMaterial({ 
        map: frontWallTexture,
        side: THREE.BackSide,
        transparent: false,
        emissive: 0xffffff,
        emissiveIntensity: 0.1,
        metalness: 0,
        roughness: 1
    });
    
    var frontWall = new THREE.Mesh(
        new THREE.PlaneGeometry(boxSize.x * 2, boxSize.y),
        frontWallMaterial
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
            if ((i + j) % 2 === 0) {
                // Colored panel - draw 5x5 array of smaller tiles with variation
                var smallTileSize = wallTileSize / 5;
                for (var ti = 0; ti < 5; ti++) {
                    for (var tj = 0; tj < 5; tj++) {
                        // Base color: pastel blue (hsl(200, 50%, 85%))
                        var hue = 200;
                        var sat = 50 + (Math.random() - 0.5) * 10; // 45-55%
                        var light = 50 + (Math.random() - 0.5) * 40; // 30-70%
                        backWallCtx.fillStyle = `hsl(${hue}, ${sat}%, ${light}%)`;
                        backWallCtx.fillRect(
                            i * wallTileSize + ti * smallTileSize,
                            j * wallTileSize + tj * smallTileSize,
                            smallTileSize,
                            smallTileSize
                        );
                    }
                }
            } else {
                // White panel - solid color
                backWallCtx.fillStyle = '#e6e6e6';
                backWallCtx.fillRect(i * wallTileSize, j * wallTileSize, wallTileSize, wallTileSize);
            }
        }
    }
    backWallCtx.strokeStyle = '#333333';
    backWallCtx.lineWidth = 4;
    for (var i = 0; i < 2; i++) {
        for (var j = 0; j < 2; j++) {
            backWallCtx.strokeRect(i * wallTileSize, j * wallTileSize, wallTileSize, wallTileSize);
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
            opacity: wallOpacity,
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
            if ((i + j) % 2 === 0) {
                // Colored panel - draw 5x5 array of smaller tiles with variation
                var smallTileSize = wallTileSize / 5;
                for (var ti = 0; ti < 5; ti++) {
                    for (var tj = 0; tj < 5; tj++) {
                        // Base color: pastel yellow (hsl(55, 50%, 85%))
                        var hue = 55;
                        var sat = 50 + (Math.random() - 0.5) * 10; // 45-55%
                        var light = 50 + (Math.random() - 0.5) * 40; // 30-70%
                        leftWallCtx.fillStyle = `hsl(${hue}, ${sat}%, ${light}%)`;
                        leftWallCtx.fillRect(
                            i * wallTileSize + ti * smallTileSize,
                            j * wallTileSize + tj * smallTileSize,
                            smallTileSize,
                            smallTileSize
                        );
                    }
                }
            } else {
                // White panel - solid color
                leftWallCtx.fillStyle = '#e6e6e6';
                leftWallCtx.fillRect(i * wallTileSize, j * wallTileSize, wallTileSize, wallTileSize);
            }
        }
    }
    leftWallCtx.strokeStyle = '#333333';
    leftWallCtx.lineWidth = 4;
    for (var i = 0; i < 2; i++) {
        for (var j = 0; j < 2; j++) {
            leftWallCtx.strokeRect(i * wallTileSize, j * wallTileSize, wallTileSize, wallTileSize);
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
            opacity: wallOpacity,
            side: THREE.BackSide
        })
    );
    leftWall.rotation.y = -Math.PI / 2;
    leftWall.position.set(-boxSize.x, boxSize.y / 2, 0);
    leftWall.receiveShadow = true;
    gThreeScene.add(leftWall);
    
    // Add framed painting on left wall (Duchamp)
    var painting2Width = 12 * 0.9;
    var painting2Height = 16 * 0.9;
    var painting2Y = boxSize.y / 2 + 1; // Vertical position
    var frame2Thickness = 0.3;
    var frame2Depth = 0.15;
    
    // Create painting plane with fallback color
    var painting2Material = new THREE.MeshStandardMaterial({ 
        color: 0x000000,
        side: THREE.FrontSide,
        emissive: 0x000000,
        emissiveIntensity: 0,
        metalness: 0,
        roughness: 1,
        transparent: true,
        opacity: 1
    });
    
    // Load painting texture
    var painting2Texture = new THREE.TextureLoader().load(
        'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/Marcel_Duchamp_Nude_Descending_Staircase.jpg',
        function(texture) {
            painting2Material.map = texture;
            painting2Material.emissiveMap = texture;
            painting2Material.color.setHex(0xffffff);
            painting2Material.emissive.setHex(0xffffff);
            painting2Material.emissiveIntensity = 0.3;
            painting2Material.needsUpdate = true;
        },
        undefined,
        function(err) {
            console.error('Error loading Marcel_Duchamp_Nude_Descending_Staircase.jpg:', err);
            console.log('Using fallback color for painting 2');
        }
    );
    
    var painting2 = new THREE.Mesh(
        new THREE.PlaneGeometry(painting2Width, painting2Height),
        painting2Material
    );
    painting2.position.set(-boxSize.x + 0.3, painting2Y, 0);
    painting2.rotation.y = Math.PI / 2;
    painting2.receiveShadow = true;
    painting2.castShadow = true;
    gThreeScene.add(painting2);
    
    // Create frame material (wood-like)
    var frame2Material = new THREE.MeshStandardMaterial({ 
        color: 0x5a3a1a,
        metalness: 0.1,
        roughness: 0.7
    });
    
    // Create frame pieces for painting 2
    // Top frame
    var frame2Top = new THREE.Mesh(
        new THREE.BoxGeometry(painting2Width + frame2Thickness * 2, frame2Thickness, frame2Depth),
        frame2Material
    );
    frame2Top.position.set(
        -boxSize.x + 0.3 + frame2Depth / 2,
        painting2Y + painting2Height / 2 + frame2Thickness / 2,
        0
    );
    frame2Top.rotation.y = Math.PI / 2;
    frame2Top.castShadow = true;
    frame2Top.receiveShadow = true;
    gThreeScene.add(frame2Top);
    
    // Bottom frame
    var frame2Bottom = new THREE.Mesh(
        new THREE.BoxGeometry(painting2Width + frame2Thickness * 2, frame2Thickness, frame2Depth),
        frame2Material
    );
    frame2Bottom.position.set(
        -boxSize.x + 0.3 + frame2Depth / 2,
        painting2Y - painting2Height / 2 - frame2Thickness / 2,
        0
    );
    frame2Bottom.rotation.y = Math.PI / 2;
    frame2Bottom.castShadow = true;
    frame2Bottom.receiveShadow = true;
    gThreeScene.add(frame2Bottom);
    
    // Left frame
    var frame2Left = new THREE.Mesh(
        new THREE.BoxGeometry(frame2Thickness, painting2Height, frame2Depth),
        frame2Material
    );
    frame2Left.position.set(
        -boxSize.x + 0.3 + frame2Depth / 2,
        painting2Y,
        -painting2Width / 2 - frame2Thickness / 2
    );
    frame2Left.rotation.y = Math.PI / 2;
    frame2Left.castShadow = true;
    frame2Left.receiveShadow = true;
    gThreeScene.add(frame2Left);
    
    // Right frame
    var frame2Right = new THREE.Mesh(
        new THREE.BoxGeometry(frame2Thickness, painting2Height, frame2Depth),
        frame2Material
    );
    frame2Right.position.set(
        -boxSize.x + 0.3 + frame2Depth / 2,
        painting2Y,
        painting2Width / 2 + frame2Thickness / 2
    );
    frame2Right.rotation.y = Math.PI / 2;
    frame2Right.castShadow = true;
    frame2Right.receiveShadow = true;
    gThreeScene.add(frame2Right);
    
    // Right wall (positive X) - pastel green checkerboard
    var rightWallCanvas = document.createElement('canvas');
    rightWallCanvas.width = 1024;
    rightWallCanvas.height = 1024;
    var rightWallCtx = rightWallCanvas.getContext('2d');
    for (var i = 0; i < 2; i++) {
        for (var j = 0; j < 2; j++) {
            if ((i + j) % 2 === 0) {
                // Colored panel - draw 5x5 array of smaller tiles with variation
                var smallTileSize = wallTileSize / 5;
                for (var ti = 0; ti < 5; ti++) {
                    for (var tj = 0; tj < 5; tj++) {
                        // Base color: pastel green (hsl(130, 50%, 85%))
                        var hue = 130;
                        var sat = 50 + (Math.random() - 0.5) * 10; // 45-55%
                        var light = 50 + (Math.random() - 0.5) * 40; // 30-70%
                        rightWallCtx.fillStyle = `hsl(${hue}, ${sat}%, ${light}%)`;
                        rightWallCtx.fillRect(
                            i * wallTileSize + ti * smallTileSize,
                            j * wallTileSize + tj * smallTileSize,
                            smallTileSize,
                            smallTileSize
                        );
                    }
                }
            } else {
                // White panel - solid color
                rightWallCtx.fillStyle = '#e6e6e6';
                rightWallCtx.fillRect(i * wallTileSize, j * wallTileSize, wallTileSize, wallTileSize);
            }
        }
    }
    rightWallCtx.strokeStyle = '#333333';
    rightWallCtx.lineWidth = 4;
    for (var i = 0; i < 2; i++) {
        for (var j = 0; j < 2; j++) {
            rightWallCtx.strokeRect(i * wallTileSize, j * wallTileSize, wallTileSize, wallTileSize);
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
            opacity: wallOpacity,
            side: THREE.BackSide
        })
    );
    rightWall.rotation.y = Math.PI / 2;
    rightWall.position.set(boxSize.x, boxSize.y / 2, 0);
    rightWall.receiveShadow = true;
    gThreeScene.add(rightWall);
    
    // Add framed painting on right wall
    var paintingWidth = 16;
    var paintingHeight = 12;
    var paintingY = boxSize.y / 2 + 2; // Vertical position
    var frameThickness = 0.3;
    var frameDepth = 0.15;
    
    // Create painting plane with fallback color
    var paintingMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x000000,
        side: THREE.FrontSide,
        emissive: 0x000000,
        emissiveIntensity: 0,
        metalness: 0,
        roughness: 1,
        transparent: true,
        opacity: 1
    });
    
    // Load painting texture
    var paintingTexture = new THREE.TextureLoader().load(
        'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/Joan_Miro_Untitled.webp',
        function(texture) {
            paintingMaterial.map = texture;
            paintingMaterial.emissiveMap = texture;
            paintingMaterial.color.setHex(0xffffff);
            paintingMaterial.emissive.setHex(0xffffff);
            paintingMaterial.emissiveIntensity = 0.3;
            paintingMaterial.needsUpdate = true;
        },
        undefined,
        function(err) {
            console.error('Error loading Joan_Miro_Untitled.webp:', err);
            console.log('Using fallback color for painting');
        }
    );
    
    var painting = new THREE.Mesh(
        new THREE.PlaneGeometry(paintingWidth, paintingHeight),
        paintingMaterial
    );
    painting.position.set(boxSize.x - 0.3, paintingY, 0);
    painting.rotation.y = -Math.PI / 2;
    painting.receiveShadow = true;
    painting.castShadow = true;
    gThreeScene.add(painting);
    
    // Create frame material (wood-like)
    var frameMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x5a3a1a,
        metalness: 0.1,
        roughness: 0.7
    });
    
    // Create frame pieces
    // Top frame
    var frameTop = new THREE.Mesh(
        new THREE.BoxGeometry(paintingWidth + frameThickness * 2, frameThickness, frameDepth),
        frameMaterial
    );
    frameTop.position.set(
        boxSize.x - 0.3 - frameDepth / 2,
        paintingY + paintingHeight / 2 + frameThickness / 2,
        0
    );
    frameTop.rotation.y = -Math.PI / 2;
    frameTop.castShadow = true;
    frameTop.receiveShadow = true;
    gThreeScene.add(frameTop);
    
    // Bottom frame
    var frameBottom = new THREE.Mesh(
        new THREE.BoxGeometry(paintingWidth + frameThickness * 2, frameThickness, frameDepth),
        frameMaterial
    );
    frameBottom.position.set(
        boxSize.x - 0.3 - frameDepth / 2,
        paintingY - paintingHeight / 2 - frameThickness / 2,
        0
    );
    frameBottom.rotation.y = -Math.PI / 2;
    frameBottom.castShadow = true;
    frameBottom.receiveShadow = true;
    gThreeScene.add(frameBottom);
    
    // Left frame
    var frameLeft = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness, paintingHeight, frameDepth),
        frameMaterial
    );
    frameLeft.position.set(
        boxSize.x - 0.3 - frameDepth / 2,
        paintingY,
        -paintingWidth / 2 - frameThickness / 2
    );
    frameLeft.rotation.y = -Math.PI / 2;
    frameLeft.castShadow = true;
    frameLeft.receiveShadow = true;
    gThreeScene.add(frameLeft);
    
    // Right frame
    var frameRight = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness, paintingHeight, frameDepth),
        frameMaterial
    );
    frameRight.position.set(
        boxSize.x - 0.3 - frameDepth / 2,
        paintingY,
        paintingWidth / 2 + frameThickness / 2
    );
    frameRight.rotation.y = -Math.PI / 2;
    frameRight.castShadow = true;
    frameRight.receiveShadow = true;
    gThreeScene.add(frameRight);
    
    // Add baseboard around perimeter walls
    var baseboardHeight = 0.3;
    var baseboardDepth = 0.1;
    var baseboardMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xc4a574, // Dull tan
        shininess: 10
    });
    
    // Front baseboard
    var frontBaseboard = new THREE.Mesh(
        new THREE.BoxGeometry(boxSize.x * 2, baseboardHeight, baseboardDepth),
        baseboardMaterial
    );
    frontBaseboard.position.set(0, baseboardHeight / 2, boxSize.z - baseboardDepth / 2);
    frontBaseboard.receiveShadow = true;
    frontBaseboard.castShadow = true;
    gThreeScene.add(frontBaseboard);
    
    // Back baseboard
    var backBaseboard = new THREE.Mesh(
        new THREE.BoxGeometry(boxSize.x * 2, baseboardHeight, baseboardDepth),
        baseboardMaterial
    );
    backBaseboard.position.set(0, baseboardHeight / 2, -boxSize.z + baseboardDepth / 2);
    backBaseboard.receiveShadow = true;
    backBaseboard.castShadow = true;
    gThreeScene.add(backBaseboard);
    
    // Left baseboard
    var leftBaseboard = new THREE.Mesh(
        new THREE.BoxGeometry(baseboardDepth, baseboardHeight, boxSize.z * 2),
        baseboardMaterial
    );
    leftBaseboard.position.set(-boxSize.x + baseboardDepth / 2, baseboardHeight / 2, 0);
    leftBaseboard.receiveShadow = true;
    leftBaseboard.castShadow = true;
    gThreeScene.add(leftBaseboard);
    
    // Right baseboard
    var rightBaseboard = new THREE.Mesh(
        new THREE.BoxGeometry(baseboardDepth, baseboardHeight, boxSize.z * 2),
        baseboardMaterial
    );
    rightBaseboard.position.set(boxSize.x - baseboardDepth / 2, baseboardHeight / 2, 0);
    rightBaseboard.receiveShadow = true;
    rightBaseboard.castShadow = true;
    gThreeScene.add(rightBaseboard);
    
    // Create five pedestals with Platonic solids on back wall
    var pedestalSize = 1.5;
    var pedestalHeight = 7;
    var solidSize = 0.8;
    var backWallZ = -boxSize.z + baseboardDepth + pedestalSize / 2;
    var pedestalY = baseboardHeight + pedestalHeight / 2;
    var solidY = baseboardHeight + pedestalHeight + solidSize;
    
    // Pedestal material
    var pedestalMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xe2e2e2,
        metalness: 0.1,
        roughness: 0.7
    });
    
    // Calculate spacing to distribute 5 pedestals evenly across back wall
    // with equal spacing from walls and between pedestals
    var totalWidth = boxSize.x * 2;
    var spacing = totalWidth / 6; // 6 equal spaces: wall|space|ped|space|ped|space|ped|space|ped|space|ped|space|wall
    var startX = -totalWidth / 2 + spacing;
    
    // Array to store Platonic solid meshes for rotation animation
    window.gPlatonicSolids = [];
    
    // Define the five Platonic solids with their colors
    var platonicConfig = [
        { name: 'tetrahedron', geometry: new THREE.TetrahedronGeometry(solidSize), color: 0xfd6100 }, // orange
        { name: 'cube', geometry: new THREE.BoxGeometry(solidSize * 1.4, solidSize * 1.4, solidSize * 1.4), color: 0xfd6100 }, // orange
        { name: 'octahedron', geometry: new THREE.OctahedronGeometry(solidSize), color: 0xfd6100 }, // orange
        { name: 'dodecahedron', geometry: new THREE.DodecahedronGeometry(solidSize), color: 0xfd6100 }, // orange
        { name: 'icosahedron', geometry: new THREE.IcosahedronGeometry(solidSize), color: 0xfd6100 } // orange
    ];
    
    for (var i = 0; i < 5; i++) {
        var xPos = startX + i * spacing;
        
        // Create pedestal
        var pedestal = new THREE.Mesh(
            new THREE.BoxGeometry(pedestalSize, pedestalHeight, pedestalSize),
            pedestalMaterial
        );
        pedestal.position.set(xPos, pedestalY, backWallZ);
        pedestal.castShadow = true;
        pedestal.receiveShadow = true;
        gThreeScene.add(pedestal);
        
        // Create outer transparent Platonic solid
        var solidMaterial = new THREE.MeshPhongMaterial({
            color: platonicConfig[i].color,
            transparent: true,
            opacity: 0.6,
            shininess: 0,
            //roughness: 0.0
        });
        
        var solid = new THREE.Mesh(platonicConfig[i].geometry, solidMaterial);
        solid.castShadow = false; // Outer transparent shell doesn't cast shadow
        solid.receiveShadow = true;
        
        // Create inner opaque solid (smaller copy)
        var innerMaterial = new THREE.MeshPhongMaterial({
            color: platonicConfig[i].color,
            transparent: false,
            opacity: 1.0,
            shininess: 100,
            emissive: 0xffffff,
            emissiveIntensity: 0.3,
            //roughness: 0.0
        });
        
        var innerSolid = new THREE.Mesh(platonicConfig[i].geometry, innerMaterial);
        innerSolid.scale.set(0.6, 0.6, 0.6); // 60% of outer size
        innerSolid.castShadow = true;
        innerSolid.receiveShadow = true;
        
        // Orient tetrahedron with base face on pedestal, apex pointing up
        if (i === 0) {
            // Apply the correct rotation for flat base orientation
            solid.rotation.x = -2.4; // ≈ -137.5° - primary tilt
            solid.rotation.y = Math.PI / 6; // 30° - aligns base triangle
            solid.rotation.z = Math.PI / 9; // 20° - fine-tunes horizontal base
            
            // Apply same orientation to inner solid
            innerSolid.rotation.x = -2.4;
            innerSolid.rotation.y = Math.PI / 6;
            innerSolid.rotation.z = Math.PI / 9;
        }
        
        // Create a group to hold both solids so they rotate together around world Y-axis
        var solidGroup = new THREE.Group();
        solidGroup.add(solid);
        solidGroup.add(innerSolid);
        
        // Position on pedestal
        if (i === 0) {
            var yPos = solidY - 0.35;
        } else {
            var yPos = solidY; 
        }
        solidGroup.position.set(xPos, yPos, backWallZ);
        
        gThreeScene.add(solidGroup);
        
        // Store group for rotation animation (rotates around world Y-axis)
        window.gPlatonicSolids.push(solidGroup);
    }
    
    // Add oval-framed painting on back wall (Louis Wain cat)
    var ovalPaintingWidth = 3;
    var ovalPaintingHeight = 4;
    var ovalPaintingX = 0; // Position on right half of back wall
    var ovalPaintingY = boxSize.y / 2 + 6;
    var ovalPaintingZ = -boxSize.z + 0.1;
    var ovalFrameThickness = 0.35; // Tube radius - diameter will be 0.3 to match other frames
    var ovalFrameDepth = 0.15;
    
    // Create painting image (use PlaneGeometry for proper texture display)
    var imageWidth = ovalPaintingWidth * 0.83;
    var imageHeight = ovalPaintingHeight * 0.83;
    var ovalImageMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000,
        side: THREE.FrontSide,
        emissive: 0x000000,
        emissiveIntensity: 0,
        metalness: 0,
        roughness: 1,
        transparent: true,
        opacity: 1
    });
    
    // Load Louis Wain cat painting
    var ovalImageTexture = new THREE.TextureLoader().load(
        'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/wainCatOval.png',
        function(texture) {
            ovalImageMaterial.map = texture;
            ovalImageMaterial.emissiveMap = texture;
            ovalImageMaterial.color.setHex(0xffffff);
            ovalImageMaterial.emissive.setHex(0xffffff);
            ovalImageMaterial.emissiveIntensity = 0.3;
            ovalImageMaterial.needsUpdate = true;
        },
        undefined,
        function(err) {
            console.error('Error loading wainCatOval.png:', err);
        }
    );
    
    var ovalImage = new THREE.Mesh(
        new THREE.PlaneGeometry(imageWidth, imageHeight),
        ovalImageMaterial
    );
    ovalImage.position.set(ovalPaintingX, ovalPaintingY, ovalPaintingZ + 0.05);
    ovalImage.castShadow = true;
    ovalImage.receiveShadow = true;
    gThreeScene.add(ovalImage);
    
    // Create oval frame using torus geometry stretched into ellipse
    var ovalFrameMaterial = new THREE.MeshStandardMaterial({
        color: 0x5a3a1a,
        metalness: 0.1,
        roughness: 0.7
    });
    
    var ovalFrameGeometry = new THREE.TorusGeometry(1, ovalFrameThickness / 2, 16, 64);
    var ovalFrame = new THREE.Mesh(ovalFrameGeometry, ovalFrameMaterial);
    
    // Scale to create ellipse matching the canvas oval
    ovalFrame.scale.set(ovalPaintingWidth / 2, ovalPaintingHeight / 2, 1);
    ovalFrame.position.set(ovalPaintingX, ovalPaintingY, ovalPaintingZ + ovalFrameDepth / 2);
    ovalFrame.castShadow = true;
    ovalFrame.receiveShadow = true;
    gThreeScene.add(ovalFrame);
    
   
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
    
    // Create sphere obstacle
    var sphereObstacle = new SphereObstacle(
        3,  // radius
        new THREE.Vector3(-24, 15, 14),  // position
    );
    gObstacles.push(sphereObstacle);

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
        2.5,  // radius
        12,  // height
        new THREE.Vector3(9, 6.03, -9),  // position
        { x: 0, y: 0, z: 0 }  // rotation
    );
    gObstacles.push(cylinderObstacle);
    
    // Renderer
    gRenderer = new THREE.WebGLRenderer();
    gRenderer.shadowMap.enabled = true;
    gRenderer.localClippingEnabled = true; // Enable clipping planes
    gRenderer.setPixelRatio( window.devicePixelRatio );
    gRenderer.setSize( 0.8 * window.innerWidth, 0.8 * window.innerHeight );
    window.addEventListener( 'resize', onWindowResize, false );
    container.appendChild( gRenderer.domElement );
    
    // Camera	
    gCamera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.01, 1000);
    gCamera.position.set(-10.72, 16.08, 31.37);
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
            if (gLamps[1]) {
                const lamp1 = gLamps[1];
                console.log('LAMP 1:');
                console.log('  lightPosition: new THREE.Vector3(' + 
                    lamp1.spotlight.position.x.toFixed(2) + ', ' + 
                    lamp1.spotlight.position.y.toFixed(2) + ', ' + 
                    lamp1.spotlight.position.z.toFixed(2) + ')');
                console.log('  lightTarget: new THREE.Vector3(' + 
                    lamp1.spotlight.target.position.x.toFixed(2) + ', ' + 
                    lamp1.spotlight.target.position.y.toFixed(2) + ', ' + 
                    lamp1.spotlight.target.position.z.toFixed(2) + ')');
                console.log('  lampAngle: ' + lamp1.angle.toFixed(4) + ' radians (' + 
                    (lamp1.angle * 180 / Math.PI).toFixed(2) + ' degrees)');
                console.log('  assemblyRotation: ' + lamp1.assemblyRotation.toFixed(4) + ' radians (' + 
                    (lamp1.assemblyRotation * 180 / Math.PI).toFixed(2) + ' degrees)');
                console.log('  basePosition: (' + 
                    lamp1.basePlate.position.x.toFixed(2) + ', ' + 
                    lamp1.basePlate.position.y.toFixed(2) + ', ' + 
                    lamp1.basePlate.position.z.toFixed(2) + ')');
                console.log('  poleHeight: ' + (lamp1.pole.position.y * 2).toFixed(2));
            }
            console.log('');
            if (gLamps[2]) {
                const lamp2 = gLamps[2];
                console.log('LAMP 2:');
                console.log('  lightPosition2: new THREE.Vector3(' + 
                    lamp2.spotlight.position.x.toFixed(2) + ', ' + 
                    lamp2.spotlight.position.y.toFixed(2) + ', ' + 
                    lamp2.spotlight.position.z.toFixed(2) + ')');
                console.log('  lightTarget2: new THREE.Vector3(' + 
                    lamp2.spotlight.target.position.x.toFixed(2) + ', ' + 
                    lamp2.spotlight.target.position.y.toFixed(2) + ', ' + 
                    lamp2.spotlight.target.position.z.toFixed(2) + ')');
                console.log('  lampAngle2: ' + lamp2.angle.toFixed(4) + ' radians (' + 
                    (lamp2.angle * 180 / Math.PI).toFixed(2) + ' degrees)');
                console.log('  assemblyRotation2: ' + lamp2.assemblyRotation.toFixed(4) + ' radians (' + 
                    (lamp2.assemblyRotation * 180 / Math.PI).toFixed(2) + ' degrees)');
                console.log('  basePosition2: (' + 
                    lamp2.basePlate.position.x.toFixed(2) + ', ' + 
                    lamp2.basePlate.position.y.toFixed(2) + ', ' + 
                    lamp2.basePlate.position.z.toFixed(2) + ')');
                console.log('  poleHeight2: ' + (lamp2.pole.position.y * 2).toFixed(2));
            }
            console.log('');
            console.log('===============================');
        }
    });
    
    // grabber
    gGrabber = new Grabber();
    container.addEventListener( 'pointerdown', onPointer, false );
    container.addEventListener( 'pointermove', onPointer, false );
    container.addEventListener( 'pointerup', onPointer, false );
}

// ------ Button Functions -----------------------------------------------
// Removed drawButtons() - functionality moved to main menu
function drawButtons() {
    // Deprecated - functionality moved to main menu
}

// Removed checkButtonHover() - functionality moved to main menu
function checkButtonHover(x, y) {
    // Deprecated - functionality moved to main menu
    return false;
}

// Removed checkButtonClick() - functionality moved to main menu
function checkButtonClick(x, y) {
    // Deprecated - functionality moved to main menu
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
            // Hide submenus when main menu is hidden, restore when shown
            if (!mainMenuVisible) {
                menuVisibleBeforeHide = menuVisible;
                menuVisible = false;
                stylingMenuVisibleBeforeHide = stylingMenuVisible;
                stylingMenuVisible = false;
                instructionsMenuVisibleBeforeHide = instructionsMenuVisible;
                instructionsMenuVisible = false;
                colorMenuVisibleBeforeHide = colorMenuVisible;
                colorMenuVisible = false;
                lightingMenuVisibleBeforeHide = lightingMenuVisible;
                lightingMenuVisible = false;
            } else {
                menuVisible = menuVisibleBeforeHide;
                stylingMenuVisible = stylingMenuVisibleBeforeHide;
                instructionsMenuVisible = instructionsMenuVisibleBeforeHide;
                colorMenuVisible = colorMenuVisibleBeforeHide;
                lightingMenuVisible = lightingMenuVisibleBeforeHide;
            }
            return;
        }
        
        // Check simulation submenu clicks FIRST (before main menu)
        if (checkSimMenuClick(evt.clientX, evt.clientY)) {
            return;
        }
        
        // Check styling submenu clicks FIRST (before main menu)
        if (checkStylingMenuClick(evt.clientX, evt.clientY)) {
            return;
        }
        
        // Check instructions submenu clicks FIRST (before main menu)
        if (checkInstructionsMenuClick(evt.clientX, evt.clientY)) {
            return;
        }
        
        // Check color submenu clicks FIRST (before main menu)
        if (checkColorMenuClick(evt.clientX, evt.clientY)) {
            return;
        }
        
        // Check lighting submenu clicks FIRST (before main menu)
        if (checkLightingMenuClick(evt.clientX, evt.clientY)) {
            return;
        }
        
        // Check main menu item clicks (only when menu is visible)
        if (mainMenuVisible && mainMenuOpacity > 0.5) {
            const itemHeight = 0.12 * menuScale;
            const itemWidth = 0.15 * menuScale;
            const padding = 0.02 * menuScale;
            const menuHeight = itemHeight * 7 + (padding * 8);
            const menuBaseY = ellipsisY + 0.08 * menuScale;
            const menuBaseX = ellipsisX - padding;
            const mainMenuPosX = menuBaseX + mainMenuXOffset * menuScale;
            const mainMenuPosY = menuBaseY;
            const itemX = mainMenuPosX + padding;
            const itemY = mainMenuPosY + padding;
            
            // Check Run/Pause menu item (now first)
            if (evt.clientX >= itemX && evt.clientX <= itemX + itemWidth &&
                evt.clientY >= itemY && evt.clientY <= itemY + itemHeight) {
                // Toggle running state
                gRunning = !gRunning;
                gPhysicsScene.paused = !gRunning;
                return;
            }
            
            // Check Simulation menu item
            const itemY2 = itemY + itemHeight + padding;
            if (evt.clientX >= itemX && evt.clientX <= itemX + itemWidth &&
                evt.clientY >= itemY2 && evt.clientY <= itemY2 + itemHeight) {
                menuVisible = !menuVisible;
                stylingMenuVisible = false; // Close styling menu when opening simulation
                instructionsMenuVisible = false; // Close instructions menu when opening simulation
                colorMenuVisible = false; // Close color menu when opening simulation
                lightingMenuVisible = false; // Close lighting menu when opening simulation
                return;
            }
            
            // Check Styling menu item
            const itemY3 = itemY2 + itemHeight + padding;
            if (evt.clientX >= itemX && evt.clientX <= itemX + itemWidth &&
                evt.clientY >= itemY3 && evt.clientY <= itemY3 + itemHeight) {
                stylingMenuVisible = !stylingMenuVisible;
                menuVisible = false; // Close simulation menu when opening styling
                instructionsMenuVisible = false; // Close instructions menu when opening styling
                colorMenuVisible = false; // Close color menu when opening styling
                lightingMenuVisible = false; // Close lighting menu when opening styling
                return;
            }
            
            // Check Color menu item
            const itemY4 = itemY3 + itemHeight + padding;
            if (evt.clientX >= itemX && evt.clientX <= itemX + itemWidth &&
                evt.clientY >= itemY4 && evt.clientY <= itemY4 + itemHeight) {
                colorMenuVisible = !colorMenuVisible;
                menuVisible = false; // Close simulation menu when opening color
                stylingMenuVisible = false; // Close styling menu when opening color
                instructionsMenuVisible = false; // Close instructions menu when opening color
                lightingMenuVisible = false; // Close lighting menu when opening color
                return;
            }
            
            // Check Lighting menu item
            const itemY5 = itemY4 + itemHeight + padding;
            if (evt.clientX >= itemX && evt.clientX <= itemX + itemWidth &&
                evt.clientY >= itemY5 && evt.clientY <= itemY5 + itemHeight) {
                lightingMenuVisible = !lightingMenuVisible;
                menuVisible = false; // Close simulation menu when opening lighting
                stylingMenuVisible = false; // Close styling menu when opening lighting
                instructionsMenuVisible = false; // Close instructions menu when opening lighting
                colorMenuVisible = false; // Close color menu when opening lighting
                return;
            }
            
            // Check Camera menu item
            const itemY6 = itemY5 + itemHeight + padding;
            if (evt.clientX >= itemX && evt.clientX <= itemX + itemWidth &&
                evt.clientY >= itemY6 && evt.clientY <= itemY6 + itemHeight) {
                // Camera mode cycling
                const previousMode = gCameraMode;
                gCameraMode = (gCameraMode + 1) % 5;
                
                // Save camera position when leaving any third-person mode (0, 1, or 2)
                if (previousMode >= 0 && previousMode <= 2) {
                    gSavedCameraPosition = gCamera.position.clone();
                    gSavedCameraTarget = gCameraControl.target.clone();
                }
                
                // Restore camera position when returning to third-person static mode
                if (gCameraMode === 0 && gSavedCameraPosition && gSavedCameraTarget) {
                    gCamera.position.copy(gSavedCameraPosition);
                    gCameraControl.target.copy(gSavedCameraTarget);
                    gCameraControl.update();
                }
                
                // Reset manual control flags
                gCameraManualControl = false;
                gCameraRotationOffset = { theta: 0, phi: 0 };
                return;
            }
            
            // Check Instructions menu item
            const itemY7 = itemY6 + itemHeight + padding;
            if (evt.clientX >= itemX && evt.clientX <= itemX + itemWidth &&
                evt.clientY >= itemY7 && evt.clientY <= itemY7 + itemHeight) {
                instructionsMenuVisible = !instructionsMenuVisible;
                menuVisible = false; // Close simulation menu when opening instructions
                stylingMenuVisible = false; // Close styling menu when opening instructions
                colorMenuVisible = false; // Close color menu when opening instructions
                lightingMenuVisible = false; // Close lighting menu when opening instructions
                return;
            }

        }
        
        // Check if clicking on bicycle wheel
        var rect = gRenderer.domElement.getBoundingClientRect();
        var mousePos = new THREE.Vector2();
        mousePos.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
        mousePos.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
        
        var raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mousePos, gCamera);
        
        if (gWheelParts.length > 0) {
            // Check if clicking on the rotating wheel group or its children
            var wheelIntersects = raycaster.intersectObjects([gBicycleWheel], true);
            // Also check for the tire click area in the stool
            if (gStool) {
                var stoolIntersects = raycaster.intersectObjects([gStool], true);
                for (var i = 0; i < stoolIntersects.length; i++) {
                    if (stoolIntersects[i].object.userData.isWheelClickArea) {
                        gWheelIsSpinning = true;
                        // Disable orbit controls while spinning wheel
                        if (gCameraControl) {
                            gCameraControl.enabled = false;
                        }
                        console.log('Started spinning wheel');
                        return;
                    }
                }
            }
            if (wheelIntersects.length > 0) {
                gWheelIsSpinning = true;
                // Disable orbit controls while spinning wheel
                if (gCameraControl) {
                    gCameraControl.enabled = false;
                }
                console.log('Started spinning wheel');
                return;
            }
        }
        
        // Check if clicking on lamp cone
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
        var hitSphere = false;
        var hitSphereObstacle = null;
        var hitLampId = 1; // Default to lamp 1
        var hitStool = false;
        var hitStoolLeg = false;
        var hitDuck = false;
        var hitDuckBeak = false;
        var hitTeapot = false;
        
        for (var i = 0; i < intersects.length; i++) {
            // Skip non-interactive objects (status indicators, etc.)
            if (intersects[i].object.userData.isNonInteractive) {
                continue;
            }
            if (intersects[i].object.userData.isStoolLeg && !hitStoolLeg) {
                hitStoolLeg = true;
                // Don't break - check if other objects are also hit
            }
            
            // Check for duck beak FIRST with highest priority
            if (intersects[i].object.userData.isDuckBeak && !hitDuckBeak) {
                hitDuckBeak = true;
                // Don't check for draggable duck if beak is hit
                continue;
            }
            
            if (intersects[i].object.userData.isDraggableDuck && !hitDuck && !hitDuckBeak) {
                hitDuck = true;
                var actualClickPoint = intersects[i].point;
                gDuckDragPlaneHeight = actualClickPoint.y;
                
                // Store offset from click point to duck center (X and Z only)
                gDuckDragOffset = new THREE.Vector3(
                    gDuck.position.x - actualClickPoint.x,
                    0,
                    gDuck.position.z - actualClickPoint.z
                );
                // Don't break - check if other objects are also hit
            }
            if (intersects[i].object.userData.isDraggableTeapot && !hitTeapot) {
                hitTeapot = true;
                var actualClickPoint = intersects[i].point;
                gTeapotDragPlaneHeight = actualClickPoint.y;
                
                // Store offset from click point to teapot center (X and Z only)
                gTeapotDragOffset = new THREE.Vector3(
                    gTeapot.position.x - actualClickPoint.x,
                    0,
                    gTeapot.position.z - actualClickPoint.z
                );
                // Don't break - check if other objects are also hit
            }
            if (intersects[i].object.userData.isDraggableStool && !hitStool) {
                hitStool = true;
                var actualClickPoint = intersects[i].point;
                gStoolDragPlaneHeight = actualClickPoint.y;
                
                // Store offset from click point to stool center (X and Z only)
                gStoolDragOffset = new THREE.Vector3(
                    gStool.position.x - actualClickPoint.x,
                    0,
                    gStool.position.z - actualClickPoint.z
                );
                // Don't break - check if other objects are also hit
            }
            if (intersects[i].object.userData.isDraggableSphere && !hitSphere) {
                hitSphere = true;
                hitSphereObstacle = intersects[i].object.userData.sphereObstacle;
                
                // Store the actual 3D point where the sphere was clicked
                var actualClickPoint = intersects[i].point;
                gSphereDragPlaneHeight = actualClickPoint.y;
                
                // Store offset from click point to sphere center
                gSphereDragOffset = new THREE.Vector3(
                    hitSphereObstacle.position.x - actualClickPoint.x,
                    hitSphereObstacle.position.y - actualClickPoint.y,
                    hitSphereObstacle.position.z - actualClickPoint.z
                );
                // Don't break - check if lamp components are also hit
            }
            if (intersects[i].object.userData.isDraggableCylinder && !hitCylinder) {
                hitCylinder = true;
                hitCylinderObstacle = intersects[i].object.userData.cylinderObstacle;
                
                // Store the actual 3D point where the cylinder was clicked
                var actualClickPoint = intersects[i].point;
                gCylinderDragPlaneHeight = actualClickPoint.y;
                
                // Store offset from click point to cylinder center (X and Z only)
                gCylinderDragOffset = new THREE.Vector3(
                    hitCylinderObstacle.position.x - actualClickPoint.x,
                    0,
                    hitCylinderObstacle.position.z - actualClickPoint.z
                );
                // Don't break - check if lamp components are also hit
            }
            if (intersects[i].object.userData.isLampCone) {
                hitLampCone = true;
                hitLampId = intersects[i].object.userData.lampId || 1;
                break; // Lamp cone takes priority, stop checking
            }
            if (intersects[i].object.userData.isLampHeight) {
                hitLampHeight = true;
                hitLampId = intersects[i].object.userData.lampId || 1;
                break; // Lamp pole takes priority, stop checking
            }
            if (intersects[i].object.userData.isLampRotation) {
                hitLampRotation = true;
                hitLampId = intersects[i].object.userData.lampId || 1;
                break; // Lamp rotation sleeve takes priority, stop checking
            }
            if (intersects[i].object.userData.isLampBase) {
                hitLampBase = true;
                hitLampId = intersects[i].object.userData.lampId || 1;
            }
        }
        
        // Base hit takes precedence over pole/rotation hits in overlapping areas
        if (hitLampBase) {
            hitLampHeight = false;
            hitLampRotation = false;
        }
        
        // Lamp components take priority over obstacles
        if (hitLampCone || hitLampHeight || hitLampRotation || hitLampBase) {
            // Clear obstacle hits if lamp was hit
            hitSphere = false;
            hitCylinder = false;
        }
        
        // Handle double-click on any lamp part to toggle light
        if (hitLampCone || hitLampHeight || hitLampRotation || hitLampBase) {
            var currentTime = Date.now();
            var timeSinceLastClick = currentTime - gLastLampBaseClickTime[hitLampId];
            
            if (timeSinceLastClick < 300) { // 300ms double-click threshold
                // Double-click detected - toggle the lamp on/off
                const lamp = gLamps[hitLampId];
                if (lamp) {
                    lamp.toggleLight();
                }
                gLastLampBaseClickTime[hitLampId] = 0; // Reset to prevent triple-click
                return;
            }
            
            gLastLampBaseClickTime[hitLampId] = currentTime;
        }
        
        // Duck beak click takes priority for rotation
        if (hitDuckBeak && gDuck) {
            gRotatingDuckBeak = true;
            gPointerLastX = evt.clientX;
            gPointerLastY = evt.clientY;
            // Disable orbit controls while rotating duck
            if (gCameraControl) {
                gCameraControl.enabled = false;
            }
            return;
        }
        
        if (hitDuck && gDuck && !hitDuckBeak) {
            gDraggingDuck = true;
            gPointerLastX = evt.clientX;
            gPointerLastY = evt.clientY;
            // Disable orbit controls while dragging duck
            if (gCameraControl) {
                gCameraControl.enabled = false;
            }
            return;
        }
        
        // Leg click takes priority for rotation
        if (hitStoolLeg && gStool) {
            gRotatingStool = true;
            gPointerLastX = evt.clientX;
            gPointerLastY = evt.clientY;
            // Disable orbit controls while rotating stool
            if (gCameraControl) {
                gCameraControl.enabled = false;
            }
            return;
        }
        
        if (hitTeapot && gTeapot) {
            // Stop the teapot animation if still running
            gTeapotAnimating = false;
            gDraggingTeapot = true;
            gPointerLastX = evt.clientX;
            gPointerLastY = evt.clientY;
            // Disable orbit controls while dragging teapot
            if (gCameraControl) {
                gCameraControl.enabled = false;
            }
            return;
        }
        
        if (hitStool && gStool) {
            gDraggingStool = true;
            gPointerLastX = evt.clientX;
            gPointerLastY = evt.clientY;
            // Disable orbit controls while dragging stool
            if (gCameraControl) {
                gCameraControl.enabled = false;
            }
            return;
        }
        
        if (hitSphere && hitSphereObstacle) {
            gDraggingSphere = true;
            window.draggingSphereObstacle = hitSphereObstacle; // Store reference globally
            
            // Store the distance from camera to sphere center (for fixed plane)
            var cameraToSphere = new THREE.Vector3();
            cameraToSphere.subVectors(hitSphereObstacle.position, gCamera.position);
            var cameraDirection = new THREE.Vector3();
            gCamera.getWorldDirection(cameraDirection);
            gSphereDragPlaneDistance = cameraToSphere.dot(cameraDirection);
            
            gPointerLastX = evt.clientX;
            gPointerLastY = evt.clientY;
            // Disable orbit controls while dragging sphere
            if (gCameraControl) {
                gCameraControl.enabled = false;
            }
            return;
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
        
        if (hitLampHeight || hitLampRotation) {
            gActiveLampId = hitLampId;
            gDraggingLampPoleOrSleeve = true;
            gPointerLastX = evt.clientX;
            gPointerLastY = evt.clientY;
            // Disable orbit controls while dragging lamp
            if (gCameraControl) {
                gCameraControl.enabled = false;
            }
            return;
        }
        
        if (hitLampBase) {
            gActiveLampId = hitLampId;
            gDraggingLampBase = true;
            gPointerLastX = evt.clientX;
            gPointerLastY = evt.clientY;
            
            // Calculate offset from click point to lamp base center
            var rect = gRenderer.domElement.getBoundingClientRect();
            var mousePos = new THREE.Vector2();
            mousePos.x = ((evt.clientX - rect.left) / rect.width ) * 2 - 1;
            mousePos.y = -((evt.clientY - rect.top) / rect.height ) * 2 + 1;
            
            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mousePos, gCamera);
            
            var groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            var clickPoint = new THREE.Vector3();
            raycaster.ray.intersectPlane(groundPlane, clickPoint);
            
            const lamp = gLamps[hitLampId];
            if (clickPoint && lamp) {
                gLampBaseDragOffset = new THREE.Vector3(
                    lamp.baseCenter.x - clickPoint.x,
                    0,
                    lamp.baseCenter.z - clickPoint.z
                );
            }
            
            // Disable orbit controls while dragging base
            if (gCameraControl) {
                gCameraControl.enabled = false;
            }
            return;
        }
        
        if (hitLampCone) {
            gActiveLampId = hitLampId;
            
            // Left-click: vertical drag = lamp tilt, horizontal drag = spotlight angle
            gDraggingLamp = true;
            gDraggingLampAngle = true;
            
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
            if (draggingMenuType === 'sim') {
                simMenuX = menuStartX + deltaX / window.innerWidth;
                simMenuY = menuStartY + deltaY / window.innerHeight;
            } else if (draggingMenuType === 'styling') {
                stylingMenuX = menuStartX + deltaX / window.innerWidth;
                stylingMenuY = menuStartY + deltaY / window.innerHeight;
            } else if (draggingMenuType === 'instructions') {
                instructionsMenuX = menuStartX + deltaX / window.innerWidth;
                instructionsMenuY = menuStartY + deltaY / window.innerHeight;
            } else if (draggingMenuType === 'color') {
                colorMenuX = menuStartX + deltaX / window.innerWidth;
                colorMenuY = menuStartY + deltaY / window.innerHeight;
            } else if (draggingMenuType === 'lighting') {
                lightingMenuX = menuStartX + deltaX / window.innerWidth;
                lightingMenuY = menuStartY + deltaY / window.innerHeight;
            }
            return;
        }
        
        // Handle mix knob dragging
        if (gDraggingMixKnob) {
            const deltaX = (evt.clientX - dragStartMouseX) / window.innerWidth;
            const deltaY = (evt.clientY - dragStartMouseY) / window.innerHeight;
            const dragDelta = deltaX + deltaY;
            
            const dragSensitivity = 0.2;
            const normalizedDelta = dragDelta / dragSensitivity;
            const rangeSize = 100; // 0 to 100 percentage
            let newValue = dragStartValue + normalizedDelta * rangeSize;
            newValue = Math.max(0, Math.min(100, newValue));
            
            gColorMixPercentage = newValue;
            applyMixedColors();
            return;
        }
        
        // Handle primary ring dragging
        if (gDraggingPrimaryRing) {
            const colorWheelSize = 1.1 * menuScale;
            const menuWidth = 0.6 * menuScale;
            const menuTopMargin = 0.33 * colorWheelSize;
            const menuUpperLeftX = colorMenuX * window.innerWidth;
            const menuUpperLeftY = (colorMenuY + 0.1) * window.innerHeight;
            const centerX = menuUpperLeftX + menuWidth / 2;
            const centerY = menuUpperLeftY + menuTopMargin;
            
            const dx = evt.clientX - centerX;
            const dy = evt.clientY - centerY;
            let angle = Math.atan2(dy, dx);
            
            gPrimaryRingRotation = angle - gRingDragStartAngle;
            
            // Calculate hue from rotation (canvas rotates CCW, so negate)
            let hue = (-gPrimaryRingRotation * 180 / Math.PI) % 360;
            if (hue < 0) hue += 360;
            gPrimaryHue = hue;
            
            applyMixedColors();
            return;
        }
        
        // Handle secondary ring dragging
        if (gDraggingSecondaryRing) {
            const colorWheelSize = 1.1 * menuScale;
            const menuWidth = 0.6 * menuScale;
            const menuTopMargin = 0.33 * colorWheelSize;
            const menuUpperLeftX = colorMenuX * window.innerWidth;
            const menuUpperLeftY = (colorMenuY + 0.1) * window.innerHeight;
            const centerX = menuUpperLeftX + menuWidth / 2;
            const centerY = menuUpperLeftY + menuTopMargin;
            
            const dx = evt.clientX - centerX;
            const dy = evt.clientY - centerY;
            let angle = Math.atan2(dy, dx);
            
            gSecondaryRingRotation = angle - gRingDragStartAngle;
            
            // Calculate hue from rotation
            let hue = (-gSecondaryRingRotation * 180 / Math.PI) % 360;
            if (hue < 0) hue += 360;
            gSecondaryHue = hue;
            
            applyMixedColors();
            return;
        }
        
        // Handle knob dragging
        if (draggedKnob !== null) {
            const deltaX = (evt.clientX - dragStartMouseX) / window.innerWidth;
            const deltaY = (evt.clientY - dragStartMouseY) / window.innerHeight;
            const dragDelta = deltaX + deltaY;
            
            // Check if it's a lighting menu knob (offset by 200)
            if (draggedKnob >= 200) {
                const lightingKnob = draggedKnob - 200;
                const ranges = [
                    {min: 0, max: 4},       // ambient intensity
                    {min: 0, max: 4},       // overhead intensity
                    {min: 0, max: 2},       // spotlight intensity
                    {min: 0, max: 1}        // spotlight penumbra
                ];
                
                const dragSensitivity = 0.2;
                const normalizedDelta = dragDelta / dragSensitivity;
                const range = ranges[lightingKnob];
                const rangeSize = range.max - range.min;
                let newValue = dragStartValue + normalizedDelta * rangeSize;
                newValue = Math.max(range.min, Math.min(range.max, newValue));
                
                switch (lightingKnob) {
                    case 0: // Ambient intensity
                        gAmbientIntensity = newValue;
                        if (gAmbientLight) gAmbientLight.intensity = gAmbientIntensity;
                        break;
                    case 1: // Overhead intensity
                        gOverheadIntensity = newValue;
                        if (gDirectionalLight) gDirectionalLight.intensity = gOverheadIntensity;
                        break;
                    case 2: // Spotlight intensity
                        gSpotlightIntensity = newValue;
                        // Update all lamp spotlights
                        for (let lampId in gLamps) {
                            if (gLamps[lampId] && gLamps[lampId].spotlight) {
                                gLamps[lampId].spotlight.intensity = gSpotlightIntensity;
                            }
                        }
                        break;
                    case 3: // Spotlight penumbra
                        gSpotlightPenumbra = newValue;
                        // Update all lamp spotlights
                        for (let lampId in gLamps) {
                            if (gLamps[lampId] && gLamps[lampId].spotlight) {
                                gLamps[lampId].spotlight.penumbra = gSpotlightPenumbra;
                            }
                        }
                        break;
                }
                return;
            }
            
            // Check if it's a styling menu knob (offset by 100)
            if (draggedKnob >= 100) {
                const stylingKnob = draggedKnob - 100;
                const ranges = [
                    {min: 50, max: 2000},       // trail length
                    {min: 0.1, max: 2.0}        // trail radius
                ];
                
                const dragSensitivity = 0.2;
                const normalizedDelta = dragDelta / dragSensitivity;
                const range = ranges[stylingKnob];
                const rangeSize = range.max - range.min;
                let newValue = dragStartValue + normalizedDelta * rangeSize;
                newValue = Math.max(range.min, Math.min(range.max, newValue));
                
                switch (stylingKnob) {
                    case 0: // Trail length
                        gTrailLength = Math.round(newValue);
                        if (gTrailLength === 50) {
                            clearBoidTrail();
                        }
                        break;
                    case 1: // Trail radius
                        gTrailRadius = newValue;
                        break;
                }
                return;
            }
            
            // Simulation menu knobs
            const ranges = [
                {min: 100, max: 5000},
                {min: 0.05, max: 0.5},
                {min: 0.5, max: 10},
                {min: 0, max: 0.2},
                {min: 0, max: 0.2},
                {min: 0, max: 0.005},
                {min: 1.0, max: 20.0},
                {min: 1.0, max: 30.0},
                {min: 0, max: 0.2},
                {min: 0.5, max: 5.0}
            ];
            
            const dragSensitivity = 0.2;
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
                        const startIndex = currentCount;
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

                            hue = Math.round(340 + Math.random() * 40);
                            sat = Math.round(40 + Math.random() * 60); 
                            light = Math.round(30 + Math.random() * 40); 
                            
                            const newBoid = new BOID(pos, boidRadius, vel, hue, sat, light);
                            gPhysicsScene.objects.push(newBoid);
                            SpatialGrid.insert(newBoid);
                        }
                        // Apply the current geometry type from styling menu to newly created boids only
                        for (let i = startIndex; i < gPhysicsScene.objects.length; i++) {
                            const boid = gPhysicsScene.objects[i];
                            gThreeScene.remove(boid.visMesh);
                            if (boid.visMesh.geometry) boid.visMesh.geometry.dispose();
                            if (boid.visMesh.material) boid.visMesh.material.dispose();
                            
                            let geometry;
                            const rad = boid.rad;
                            switch (gBoidGeometryType) {
                                case 0: geometry = new THREE.SphereGeometry(rad, geometrySegments, 16); break;
                                case 1: geometry = new THREE.ConeGeometry(rad, 3 * rad, geometrySegments, 1); break;
                                case 2: geometry = new THREE.CylinderGeometry(rad, rad, 3 * rad, geometrySegments); break;
                                case 3: geometry = new THREE.BoxGeometry(2 * rad, 2 * rad, 2 * rad); break;
                                case 4: geometry = new THREE.TetrahedronGeometry(rad * 1.5); break;
                                case 5: geometry = new THREE.OctahedronGeometry(rad * 1.5); break;
                                case 6: geometry = new THREE.DodecahedronGeometry(rad * 1.5); break;
                                case 7: geometry = new THREE.IcosahedronGeometry(rad * 1.5); break;
                                case 8: geometry = new THREE.CapsuleGeometry(rad, 2.7 * rad, 0.5 * geometrySegments, geometrySegments); break;
                                case 9: geometry = new THREE.TorusGeometry(rad, rad * 0.4, geometrySegments, 2 * geometrySegments); break;
                                case 10: geometry = new THREE.TorusKnotGeometry(rad, rad * 0.3, 4 * geometrySegments, geometrySegments); break;
                                case 11: geometry = new THREE.PlaneGeometry(2.5 * rad, 2.5 * rad); break;
                                default: geometry = new THREE.ConeGeometry(rad, 3 * rad, geometrySegments, 1);
                            }
                            let material;
                            if (boidProps.material === 'standard') {
                                material = new THREE.MeshStandardMaterial({
                                    color: new THREE.Color(`hsl(${boid.hue}, ${boid.sat}%, ${boid.light}%)`), 
                                    metalness: 0.5,
                                    roughness: 0.4, 
                                    wireframe: boidProps.wireframe});
                            } else if (boidProps.material === 'phong') {
                                material = new THREE.MeshPhongMaterial({
                                    color: new THREE.Color(`hsl(${boid.hue}, ${boid.sat}%, ${boid.light}%)`), 
                                    shininess: 100, 
                                    wireframe: boidProps.wireframe});
                            } else if (boidProps.material === 'normal') {
                                material = new THREE.MeshNormalMaterial({wireframe: boidProps.wireframe});
                            } else if (boidProps.material === 'toon') {
                                material = new THREE.MeshToonMaterial({
                                    color: new THREE.Color(`hsl(${boid.hue}, ${boid.sat}%, ${boid.light}%)`), 
                                    wireframe: boidProps.wireframe});
                            } else if (boidProps.material === 'depth') {
                                material = new THREE.MeshDepthMaterial({
                                    wireframe: boidProps.wireframe});
                            } else {
                                material = new THREE.MeshBasicMaterial({
                                    color: new THREE.Color(`hsl(${boid.hue}, ${boid.sat}%, ${boid.light}%)`), 
                                    wireframe: boidProps.wireframe});
                            }
                            
                            if (gBoidGeometryType === 11) {
                                material = new THREE.MeshStandardMaterial({
                                color: new THREE.Color(`hsl(${boid.hue}, ${boid.sat}%, ${boid.light}%)`),
                                side: THREE.DoubleSide});
                            }

                            boid.visMesh = new THREE.Mesh(geometry, material);
                            boid.visMesh.position.copy(boid.pos);
                            boid.visMesh.userData = boid;
                            boid.visMesh.layers.enable(1);
                            boid.visMesh.castShadow = true;
                            boid.visMesh.receiveShadow = true;
                            gThreeScene.add(boid.visMesh);
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
                    boidProps.minSpeed = newValue;
                    // Ensure maxSpeed is always greater than or equal to minSpeed
                    boidProps.maxSpeed = Math.max(boidProps.maxSpeed, newValue);
                    break;
                case 7: 
                    boidProps.maxSpeed = newValue;
                    // Ensure minSpeed doesn't exceed maxSpeed
                    boidProps.minSpeed = Math.min(boidProps.minSpeed, newValue);
                    break;
                case 8: boidProps.turnFactor = newValue; break;
                case 9: boidProps.margin = newValue; break;
            }
            return;
        }
        
        // Handle duck beak rotation (rotate duck around vertical Y axis)
        if (gRotatingDuckBeak && gDuck) {
            var deltaX = evt.clientX - gPointerLastX;
            gPointerLastX = evt.clientX;
            
            // Rotate around Y axis based on horizontal mouse movement
            var rotationSpeed = 0.01;
            gDuck.rotation.y += deltaX * rotationSpeed;
            return;
        }
        
        // Handle duck dragging (translation along ground, horizontal only)
        if (gDraggingDuck && gDuck) {
            var rect = gRenderer.domElement.getBoundingClientRect();
            var mousePos = new THREE.Vector2();
            mousePos.x = ((evt.clientX - rect.left) / rect.width ) * 2 - 1;
            mousePos.y = -((evt.clientY - rect.top) / rect.height ) * 2 + 1;
            
            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mousePos, gCamera);
            
            // Define plane at the height where the duck was grabbed
            var duckPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -gDuckDragPlaneHeight);
            var intersectionPoint = new THREE.Vector3();
            raycaster.ray.intersectPlane(duckPlane, intersectionPoint);
            
            if (intersectionPoint) {
                // Keep the duck's Y position constant, only move X and Z
                var newX = intersectionPoint.x + (gDuckDragOffset ? gDuckDragOffset.x : 0);
                var newZ = intersectionPoint.z + (gDuckDragOffset ? gDuckDragOffset.z : 0);
                
                // Clamp to room boundaries
                var minBoundX = -gPhysicsScene.worldSize.x + 2;
                var maxBoundX = gPhysicsScene.worldSize.x - 2;
                var minBoundZ = -gPhysicsScene.worldSize.z + 2;
                var maxBoundZ = gPhysicsScene.worldSize.z - 2;
                
                newX = Math.max(minBoundX, Math.min(maxBoundX, newX));
                newZ = Math.max(minBoundZ, Math.min(maxBoundZ, newZ));
                
                gDuck.position.x = newX;
                gDuck.position.z = newZ;
                
                // Update obstacle position
                if (gDuckObstacle) {
                    gDuckObstacle.updatePosition(new THREE.Vector3(newX, gDuck.position.y + 1.5, newZ));
                }
            }
            return;
        }
        
        // Handle stool rotation (rotate around vertical Y axis)
        if (gRotatingStool && gStool) {
            var deltaX = evt.clientX - gPointerLastX;
            gPointerLastX = evt.clientX;
            
            // Rotate around Y axis based on horizontal mouse movement
            var rotationSpeed = 0.01;
            gStool.rotation.y += deltaX * rotationSpeed;
            return;
        }
        
        // Handle teapot dragging (translation along ground, horizontal only)
        if (gDraggingTeapot && gTeapot) {
            var rect = gRenderer.domElement.getBoundingClientRect();
            var mousePos = new THREE.Vector2();
            mousePos.x = ((evt.clientX - rect.left) / rect.width ) * 2 - 1;
            mousePos.y = -((evt.clientY - rect.top) / rect.height ) * 2 + 1;
            
            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mousePos, gCamera);
            
            // Define plane at the height where the teapot was grabbed
            var teapotPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -gTeapotDragPlaneHeight);
            var intersectionPoint = new THREE.Vector3();
            raycaster.ray.intersectPlane(teapotPlane, intersectionPoint);
            
            if (intersectionPoint) {
                // Keep the teapot's Y position constant, only move X and Z
                var newX = intersectionPoint.x + (gTeapotDragOffset ? gTeapotDragOffset.x : 0);
                var newZ = intersectionPoint.z + (gTeapotDragOffset ? gTeapotDragOffset.z : 0);
                
                // Clamp to room boundaries
                var minBoundX = -gPhysicsScene.worldSize.x + 3;
                var maxBoundX = gPhysicsScene.worldSize.x - 3;
                var minBoundZ = -gPhysicsScene.worldSize.z + 3;
                var maxBoundZ = gPhysicsScene.worldSize.z - 3;
                
                newX = Math.max(minBoundX, Math.min(maxBoundX, newX));
                newZ = Math.max(minBoundZ, Math.min(maxBoundZ, newZ));
                
                gTeapot.position.x = newX;
                gTeapot.position.z = newZ;
                
                // Update obstacle position
                if (gTeapotObstacle) {
                    gTeapotObstacle.updatePosition(new THREE.Vector3(newX, gTeapot.position.y + gTeapotObstacle.height / 2, newZ));
                }
            }
            return;
        }
        
        // Handle stool dragging (translation along ground, horizontal only)
        if (gDraggingStool && gStool) {
            var rect = gRenderer.domElement.getBoundingClientRect();
            var mousePos = new THREE.Vector2();
            mousePos.x = ((evt.clientX - rect.left) / rect.width ) * 2 - 1;
            mousePos.y = -((evt.clientY - rect.top) / rect.height ) * 2 + 1;
            
            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mousePos, gCamera);
            
            // Define plane at the height where the stool was grabbed
            var stoolPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -gStoolDragPlaneHeight);
            var intersectionPoint = new THREE.Vector3();
            raycaster.ray.intersectPlane(stoolPlane, intersectionPoint);
            
            if (intersectionPoint) {
                // Keep the stool's Y position constant, only move X and Z
                var newX = intersectionPoint.x + (gStoolDragOffset ? gStoolDragOffset.x : 0);
                var newZ = intersectionPoint.z + (gStoolDragOffset ? gStoolDragOffset.z : 0);
                
                // Clamp to room boundaries
                var minBoundX = -gPhysicsScene.worldSize.x + 1;
                var maxBoundX = gPhysicsScene.worldSize.x - 1;
                var minBoundZ = -gPhysicsScene.worldSize.z + 1;
                var maxBoundZ = gPhysicsScene.worldSize.z - 1;
                
                newX = Math.max(minBoundX, Math.min(maxBoundX, newX));
                newZ = Math.max(minBoundZ, Math.min(maxBoundZ, newZ));
                
                gStool.position.x = newX;
                gStool.position.z = newZ;
                
                // Update obstacle position
                if (gStoolObstacle) {
                    gStoolObstacle.updatePosition(new THREE.Vector3(newX, gStoolObstacle.position.y, newZ));
                }
            }
            return;
        }
        
        // Handle sphere dragging (translation in 3D)
        if (gDraggingSphere && window.draggingSphereObstacle) {
            var sphereObstacle = window.draggingSphereObstacle;
            
            // Move sphere in 3D space along a fixed plane perpendicular to camera view
            var rect = gRenderer.domElement.getBoundingClientRect();
            var mousePos = new THREE.Vector2();
            mousePos.x = ((evt.clientX - rect.left) / rect.width ) * 2 - 1;
            mousePos.y = -((evt.clientY - rect.top) / rect.height ) * 2 + 1;
            
            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mousePos, gCamera);
            
            // Use fixed plane at the distance established when drag started
            var cameraDirection = new THREE.Vector3();
            gCamera.getWorldDirection(cameraDirection);
            var planePoint = new THREE.Vector3();
            planePoint.addVectors(gCamera.position, cameraDirection.multiplyScalar(gSphereDragPlaneDistance));
            var spherePlane = new THREE.Plane();
            spherePlane.setFromNormalAndCoplanarPoint(cameraDirection, planePoint);
            
            var intersectionPoint = new THREE.Vector3();
            raycaster.ray.intersectPlane(spherePlane, intersectionPoint);
            
            if (intersectionPoint && gSphereDragOffset) {
                // Apply the offset to maintain grab point
                var newPosition = new THREE.Vector3(
                    intersectionPoint.x + gSphereDragOffset.x,
                    intersectionPoint.y + gSphereDragOffset.y,
                    intersectionPoint.z + gSphereDragOffset.z
                );
                
                // Clamp to room boundaries (sphere center must stay within room)
                var minBoundX = -gPhysicsScene.worldSize.x + sphereObstacle.radius;
                var maxBoundX = gPhysicsScene.worldSize.x - sphereObstacle.radius;
                var minBoundY = sphereObstacle.radius;
                var maxBoundY = gPhysicsScene.worldSize.y - sphereObstacle.radius;
                var minBoundZ = -gPhysicsScene.worldSize.z + sphereObstacle.radius;
                var maxBoundZ = gPhysicsScene.worldSize.z - sphereObstacle.radius;
                
                newPosition.x = Math.max(minBoundX, Math.min(maxBoundX, newPosition.x));
                newPosition.y = Math.max(minBoundY, Math.min(maxBoundY, newPosition.y));
                newPosition.z = Math.max(minBoundZ, Math.min(maxBoundZ, newPosition.z));
                
                sphereObstacle.updatePosition(newPosition);
            }
            return;
        }
        
        // Handle cylinder dragging (translation along ground)
        if (gDraggingCylinder && window.draggingCylinderObstacle) {
            // Raycast to find where cursor intersects a plane at cylinder's height
            var rect = gRenderer.domElement.getBoundingClientRect();
            var mousePos = new THREE.Vector2();
            mousePos.x = ((evt.clientX - rect.left) / rect.width ) * 2 - 1;
            mousePos.y = -((evt.clientY - rect.top) / rect.height ) * 2 + 1;
            
            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mousePos, gCamera);
            
            var cylinderObstacle = window.draggingCylinderObstacle;
            // Define plane at the height where the cylinder was grabbed
            var cylinderPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -gCylinderDragPlaneHeight);
            var intersectionPoint = new THREE.Vector3();
            raycaster.ray.intersectPlane(cylinderPlane, intersectionPoint);
            
            if (intersectionPoint) {
                // Keep the cylinder's Y position (height above ground) constant
                var newX = intersectionPoint.x + (gCylinderDragOffset ? gCylinderDragOffset.x : 0);
                var newZ = intersectionPoint.z + (gCylinderDragOffset ? gCylinderDragOffset.z : 0);
                
                // Clamp to room boundaries - square pedestal base should not hit walls
                // pedestalSize = radius * 2.5, so half-width = radius * 1.25
                var halfPedestalSize = cylinderObstacle.radius * 1.25;
                var minBoundX = -gPhysicsScene.worldSize.x + halfPedestalSize;
                var maxBoundX = gPhysicsScene.worldSize.x - halfPedestalSize;
                var minBoundZ = -gPhysicsScene.worldSize.z + halfPedestalSize;
                var maxBoundZ = gPhysicsScene.worldSize.z - halfPedestalSize;
                
                newX = Math.max(minBoundX, Math.min(maxBoundX, newX));
                newZ = Math.max(minBoundZ, Math.min(maxBoundZ, newZ));
                
                var newPosition = new THREE.Vector3(
                    newX,
                    cylinderObstacle.position.y, // Keep original height
                    newZ
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
            
            const lamp = gLamps[gActiveLampId];
            if (intersectionPoint && lamp && gLampBaseDragOffset) {
                // Apply offset so lamp doesn't jump
                const targetX = intersectionPoint.x + gLampBaseDragOffset.x;
                const targetZ = intersectionPoint.z + gLampBaseDragOffset.z;
                
                // Calculate translation needed
                const deltaX = targetX - lamp.baseCenter.x;
                const deltaZ = targetZ - lamp.baseCenter.z;
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
        
        // Handle pole/sleeve dragging (both height and rotation simultaneously)
        if (gDraggingLampPoleOrSleeve) {
            const deltaX = evt.clientX - gPointerLastX;
            const deltaY = evt.clientY - gPointerLastY;
            
            // Apply rotation based on horizontal movement
            if (Math.abs(deltaX) > 0.5) {
                rotateLampAssembly(deltaX * 0.01, gActiveLampId);
            }
            
            // Apply height adjustment based on vertical movement
            if (Math.abs(deltaY) > 0.5) {
                updateLampHeight(-deltaY * 0.02, gActiveLampId);
            }
            
            gPointerLastX = evt.clientX;
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
        
        // Handle lamp cone dragging (vertical = tilt, horizontal = spotlight angle)
        if (gDraggingLamp && gDraggingLampAngle) {
            const deltaX = evt.clientX - gPointerLastX;
            const deltaY = evt.clientY - gPointerLastY;
            const lamp = gLamps[gActiveLampId];
            
            if (lamp) {
                // Vertical movement: adjust lamp tilt angle
                if (Math.abs(deltaY) > 0.5) {
                    lamp.angle += deltaY * 0.01;
                    lamp.angle = Math.max(-Math.PI / 2, Math.min(Math.PI / 10, lamp.angle));
                    rotateLamp(gActiveLampId);
                }
                
                // Horizontal movement: adjust spotlight cone angle
                if (Math.abs(deltaX) > 0.5) {
                    lamp.spotlight.angle += deltaX * 0.003;
                    lamp.spotlight.angle = Math.max(Math.PI / 12, Math.min(Math.PI / 3, lamp.spotlight.angle));
                    lamp.updateConeGeometry();
                }
            }
            
            gPointerLastX = evt.clientX;
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
        // Stop spinning the bicycle wheel
        if (gWheelIsSpinning) {
            gWheelIsSpinning = false;
            // Re-enable orbit controls if in normal camera mode
            if (gCameraMode < 3 && gCameraControl) {
                gCameraControl.enabled = true;
            }
            console.log('Stopped spinning wheel - velocity: ' + gWheelAngularVelocity.toFixed(2));
        }
        
        if (gDraggingMixKnob) {
            gDraggingMixKnob = false;
            // Re-enable orbit controls if in normal camera mode
            if (gCameraMode < 3 && gCameraControl) {
                gCameraControl.enabled = true;
            }
            return;
        }
        
        if (gDraggingPrimaryRing) {
            gDraggingPrimaryRing = false;
            // Re-enable orbit controls if in normal camera mode
            if (gCameraMode < 3 && gCameraControl) {
                gCameraControl.enabled = true;
            }
            return;
        }
        
        if (gDraggingSecondaryRing) {
            gDraggingSecondaryRing = false;
            // Re-enable orbit controls if in normal camera mode
            if (gCameraMode < 3 && gCameraControl) {
                gCameraControl.enabled = true;
            }
            return;
        }
        
        if (isDraggingMenu) {
            isDraggingMenu = false;
            draggingMenuType = null;
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
        
        if (gRotatingDuckBeak) {
            gRotatingDuckBeak = false;
            // Re-enable orbit controls if in normal camera mode
            if (gCameraMode < 3 && gCameraControl) {
                gCameraControl.enabled = true;
            }
            return;
        }
        
        if (gDraggingDuck) {
            gDraggingDuck = false;
            gDuckDragOffset = null;
            // Re-enable orbit controls if in normal camera mode
            if (gCameraMode < 3 && gCameraControl) {
                gCameraControl.enabled = true;
            }
            return;
        }
        
        if (gRotatingStool) {
            gRotatingStool = false;
            // Re-enable orbit controls if in normal camera mode
            if (gCameraMode < 3 && gCameraControl) {
                gCameraControl.enabled = true;
            }
            return;
        }
        
        if (gDraggingTeapot) {
            gDraggingTeapot = false;
            gTeapotDragOffset = null;
            // Re-enable orbit controls if in normal camera mode
            if (gCameraMode < 3 && gCameraControl) {
                gCameraControl.enabled = true;
            }
            return;
        }
        
        if (gDraggingStool) {
            gDraggingStool = false;
            gStoolDragOffset = null;
            // Re-enable orbit controls if in normal camera mode
            if (gCameraMode < 3 && gCameraControl) {
                gCameraControl.enabled = true;
            }
            return;
        }
        
        if (gDraggingSphere) {
            gDraggingSphere = false;
            gSphereDragOffset = null;
            window.draggingSphereObstacle = null;
            // Re-enable orbit controls if in normal camera mode
            if (gCameraMode < 3 && gCameraControl) {
                gCameraControl.enabled = true;
            }
            return;
        }
        
        if (gDraggingCylinder) {
            gDraggingCylinder = false;
            gCylinderDragOffset = null;
            window.draggingCylinderObstacle = null;
            // Re-enable orbit controls if in normal camera mode
            if (gCameraMode < 3 && gCameraControl) {
                gCameraControl.enabled = true;
            }
            return;
        }
        
        if (gDraggingLampPoleOrSleeve) {
            gDraggingLampPoleOrSleeve = false;
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
        
        if (gDraggingLamp || gDraggingLampAngle) {
            gDraggingLamp = false;
            gDraggingLampAngle = false;
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
        
        // Re-enable orbit controls for any other clicks (e.g., color ring clicks)
        if (gCameraMode < 3 && gCameraControl) {
            gCameraControl.enabled = true;
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
    const menuHeight = knobSpacing * 3.3;
    const padding = 1.7 * knobRadius;
    
    const menuUpperLeftX = simMenuX * window.innerWidth;
    const menuUpperLeftY = simMenuY * window.innerHeight;
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
    for (let knob = 0; knob < 10; knob++) {
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
                boidProps.minSpeed, boidProps.maxSpeed, boidProps.turnFactor, boidProps.margin
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
        draggingMenuType = 'sim';
        menuDragStartX = clientX;
        menuDragStartY = clientY;
        menuStartX = simMenuX;
        menuStartY = simMenuY;
        
        // Disable orbit controls while dragging menu
        if (gCameraControl) {
            gCameraControl.enabled = false;
        }
        return true;
    }
    
    return false;
}

function checkStylingMenuClick(clientX, clientY) {
    if (!stylingMenuVisible || stylingMenuOpacity <= 0.5) return false;
    
    const knobRadius = 0.1 * menuScale;
    const knobSpacing = knobRadius * 3;
    const menuTopMargin = 0.2 * knobRadius;
    const menuWidth = knobSpacing * 2;
    const menuHeight = 15 * knobRadius;
    const padding = 1.7 * knobRadius;
    
    const menuUpperLeftX = stylingMenuX * window.innerWidth;
    const menuUpperLeftY = (stylingMenuY + 0.1) * window.innerHeight;
    const menuOriginX = menuUpperLeftX + knobSpacing;
    const menuOriginY = menuUpperLeftY + 0.5 * knobSpacing;
    
    // Check close button
    const closeIconRadius = knobRadius * 0.25;
    const closeIconX = menuOriginX - padding + closeIconRadius + 0.2 * knobRadius;
    const closeIconY = menuOriginY - padding + closeIconRadius + 0.2 * knobRadius;
    const cdx = clientX - closeIconX;
    const cdy = clientY - closeIconY;
    
    if (cdx * cdx + cdy * cdy < closeIconRadius * closeIconRadius) {
        stylingMenuVisible = false;
        return true;
    }
    
    // Check geometry selection buttons FIRST (they're now at the top)
    const buttonY = menuOriginY + menuTopMargin - knobRadius * 0.67;
    const buttonWidth = (menuWidth + padding * 1.2) / 3;
    const buttonHeight = knobRadius * 1.3;
    const buttonSpacing = 4;
    
    for (let i = 0; i < 15; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const totalRowWidth = (buttonWidth * 3) + (buttonSpacing * 2);
        const offsetX = (menuWidth - totalRowWidth) / 2;
        const btnX = menuOriginX + offsetX + col * (buttonWidth + buttonSpacing);
        const btnY = buttonY + row * (buttonHeight + buttonSpacing);
        
        if (clientX >= btnX && clientX <= btnX + buttonWidth &&
            clientY >= btnY && clientY <= btnY + buttonHeight) {
            gBoidGeometryType = i;
            // Recreate all boid geometries
            recreateBoidGeometries();
            return true;
        }
    }
    
    // Check mesh detail radio buttons
    const meshDetailY = buttonY + 5 * (buttonHeight + buttonSpacing) + knobRadius * 0.6;
    const segmentOptions = [8, 16, 24, 32, 64];
    const meshRadioY = meshDetailY + knobRadius * 0.8;
    const meshRadioRadius = knobRadius * 0.35;
    const totalRadioWidth = segmentOptions.length * meshRadioRadius * 2 + (segmentOptions.length - 1) * meshRadioRadius * 1.5;
    const radioStartX = menuOriginX + 0.5 * menuWidth - totalRadioWidth / 2 + meshRadioRadius;
    const radioSpacingH = meshRadioRadius * 3.5;
    
    for (let i = 0; i < segmentOptions.length; i++) {
        const rbX = radioStartX + i * radioSpacingH;
        const rdx = clientX - rbX;
        const rdy = clientY - meshRadioY;
        
        if (rdx * rdx + rdy * rdy < (meshRadioRadius + 5) * (meshRadioRadius + 5)) {
            geometrySegments = segmentOptions[i];
            // Recreate all boid geometries with new segment count
            recreateBoidGeometries();
            return true;
        }
    }
    
    // Check material type radio buttons
    const materialOptions = ['basic', 'phong', 'standard', 'normal', 'toon'];
    const materialY = meshRadioY + knobRadius * 1.2;
    const materialRadioY = materialY + knobRadius * 0.8;
    const materialRadioRadius = knobRadius * 0.35;
    const totalMaterialRadioWidth = materialOptions.length * materialRadioRadius * 2 + (materialOptions.length - 1) * materialRadioRadius * 1.5;
    const materialRadioStartX = menuOriginX + 0.5 * menuWidth - totalMaterialRadioWidth / 2 + materialRadioRadius;
    const materialRadioSpacingH = materialRadioRadius * 3.5;
    
    for (let i = 0; i < materialOptions.length; i++) {
        const rbX = materialRadioStartX + i * materialRadioSpacingH;
        const rdx = clientX - rbX;
        const rdy = clientY - materialRadioY;
        
        if (rdx * rdx + rdy * rdy < (materialRadioRadius + 5) * (materialRadioRadius + 5)) {
            boidProps.material = materialOptions[i];
            // Recreate all boid geometries with new material
            recreateBoidGeometries();
            return true;
        }
    }
    
    // Check trail knobs (now at bottom)
    const trailSectionY = materialRadioY + knobRadius * 3.5;
    for (let knob = 0; knob < 2; knob++) {
        const row = Math.floor(knob / 3);
        const col = knob % 3;
        const knobX = menuOriginX + col * knobSpacing;
        const knobY = menuOriginY + row * knobSpacing + (trailSectionY - menuOriginY);
        
        const kdx = clientX - knobX;
        const kdy = clientY - knobY;
        if (kdx * kdx + kdy * kdy < knobRadius * knobRadius) {
            draggedKnob = 100 + knob; // Offset to distinguish from sim menu knobs
            dragStartMouseX = clientX;
            dragStartMouseY = clientY;
            
            const menuItems = [
                gTrailLength, gTrailRadius
            ];
            dragStartValue = menuItems[knob];
            
            if (gCameraControl) {
                gCameraControl.enabled = false;
            }
            return true;
        }
    }
    
    // Check radio buttons for trail color mode (now at bottom with knobs)
    const radioY = menuOriginY + (trailSectionY - menuOriginY) - 0.4 * padding;
    const radioX = menuOriginX + knobSpacing * 1.75;
    const radioRadius = knobRadius * 0.3;
    const radioSpacing = knobRadius * 0.7;
    
    // Only allow interaction if trail is enabled
    if (gTrailLength > 50) {
        for (let i = 0; i < 4; i++) {
            const rbY = radioY + i * radioSpacing;
            const rdx = clientX - radioX;
            const rdy = clientY - rbY;
            
            if (rdx * rdx + rdy * rdy < (radioRadius + 5) * (radioRadius + 5)) {
                gTrailColorMode = i;
                return true;
            }
        }
    }
    

    
    // Check if menu background clicked (for dragging)
    if (clientX >= menuOriginX - padding && clientX <= menuOriginX + menuWidth + padding &&
        clientY >= menuOriginY - padding && clientY <= menuOriginY + menuHeight + padding) {
        isDraggingMenu = true;
        draggingMenuType = 'styling';
        menuDragStartX = clientX;
        menuDragStartY = clientY;
        menuStartX = stylingMenuX;
        menuStartY = stylingMenuY; // Don't add 0.2 offset here, it's already in menuOriginY
        
        if (gCameraControl) {
            gCameraControl.enabled = false;
        }
        return true;
    }
    
    return false;
}

function checkInstructionsMenuClick(clientX, clientY) {
    if (!instructionsMenuVisible || instructionsMenuOpacity <= 0.5) return false;
    
    const menuTopMargin = 0.02 * menuScale;
    const menuWidth = menuScale;
    const menuHeight = 1.45 * menuScale;
    const padding = 0.17 * menuScale;
    
    const menuUpperLeftX = (instructionsMenuX + 0.01) * window.innerWidth;
    const menuUpperLeftY = (instructionsMenuY + 0.0) * window.innerHeight;
    const menuOriginX = menuUpperLeftX;
    const menuOriginY = menuUpperLeftY;
    
    // Check close button
    const closeIconRadius = 0.1 * menuScale * 0.25;
    const closeIconX = menuOriginX - padding + closeIconRadius + 0.02 * menuScale;
    const closeIconY = menuOriginY - padding + closeIconRadius + 0.02 * menuScale;
    const cdx = clientX - closeIconX;
    const cdy = clientY - closeIconY;
    
    if (cdx * cdx + cdy * cdy < closeIconRadius * closeIconRadius) {
        instructionsMenuVisible = false;
        return true;
    }
    
    // Check if menu background clicked (for dragging or to block clicks underneath)
    if (clientX >= menuOriginX - padding && clientX <= menuOriginX + menuWidth + padding &&
        clientY >= menuOriginY - padding && clientY <= menuOriginY + menuHeight + padding) {
        isDraggingMenu = true;
        draggingMenuType = 'instructions';
        menuDragStartX = clientX;
        menuDragStartY = clientY;
        menuStartX = instructionsMenuX + 0.01;
        menuStartY = instructionsMenuY + 0.0;
        
        if (gCameraControl) {
            gCameraControl.enabled = false;
        }
        return true;
    }
    
    return false;
}

function checkColorMenuClick(clientX, clientY) {
    if (!colorMenuVisible || colorMenuOpacity <= 0.5) return false;
    
    const knobRadius = 0.1 * menuScale; // Match standard knob size
    const colorWheelSize = 1.1 * menuScale; // Size of the color wheel rings
    const menuWidth = 0.6 * menuScale; // Match other menus (actual background width)
    const padding = 0.17 * menuScale;
    const menuHeight = 0.75 * colorWheelSize;
    const menuTopMargin = 0.33 * colorWheelSize; // Match drawing code
    
    const menuUpperLeftX = colorMenuX * window.innerWidth;
    const menuUpperLeftY = (colorMenuY + 0.1) * window.innerHeight;
    const menuOriginX = menuUpperLeftX;
    const menuOriginY = menuUpperLeftY;
    
    // Check close button
    const closeIconRadius = 0.1 * menuScale * 0.25;
    const closeIconX = menuOriginX - padding + closeIconRadius + 0.02 * menuScale;
    const closeIconY = menuOriginY - padding + closeIconRadius + 0.02 * menuScale;
    const cdx = clientX - closeIconX;
    const cdy = clientY - closeIconY;
    
    if (cdx * cdx + cdy * cdy < closeIconRadius * closeIconRadius) {
        colorMenuVisible = false;
        return true;
    }
    
    const centerX = menuOriginX + menuWidth / 2;
    const centerY = menuOriginY + menuTopMargin;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Only allow interaction with knob and rings in Normal mode
    if (gColorationMode === 0) {
        // Check if clicking on mix knob in center (with standard knob size)
        if (distance <= knobRadius * 1.05) {
            gDraggingMixKnob = true;
            dragStartMouseX = clientX;
            dragStartMouseY = clientY;
            dragStartValue = gColorMixPercentage;
            if (gCameraControl) {
                gCameraControl.enabled = false;
            }
            return true;
        }
        
        // Define ring boundaries (further reduced)
        const outerRingOuter = (colorWheelSize / 2) * 0.73;
        const outerRingInner = (colorWheelSize / 2) * 0.58;
        const innerRingOuter = (colorWheelSize / 2) * 0.51;
        const innerRingInner = (colorWheelSize / 2) * 0.365;
        
        // Check if clicking on outer ring (primary color) - start dragging
        if (distance >= outerRingInner && distance <= outerRingOuter) {
            gDraggingPrimaryRing = true;
            let angle = Math.atan2(dy, dx);
            gRingDragStartAngle = angle - gPrimaryRingRotation;
            if (gCameraControl) {
                gCameraControl.enabled = false;
            }
            return true;
        }
        
        // Check if clicking on inner ring (secondary color) - start dragging
        if (distance >= innerRingInner && distance <= innerRingOuter) {
            gDraggingSecondaryRing = true;
            let angle = Math.atan2(dy, dx);
            gRingDragStartAngle = angle - gSecondaryRingRotation;
            if (gCameraControl) {
                gCameraControl.enabled = false;
            }
            return true;
        }
    }
    
    // Check radio buttons for coloration mode
    const radioY = menuOriginY + menuHeight + 0.01 * menuScale;
    const radioRadius = knobRadius * 0.3;
    const radioSpacing = menuWidth / 3;
    
    for (let i = 0; i < 3; i++) {
        const radioX = menuOriginX + (i + 0.5) * radioSpacing;
        const rdx = clientX - radioX;
        const rdy = clientY - radioY;
        
        if (rdx * rdx + rdy * rdy < radioRadius * radioRadius) {
            gColorationMode = i;
            applyMixedColors();
            if (gCameraControl) {
                gCameraControl.enabled = false;
            }
            return true;
        }
    }
    
    // Check if menu background clicked (for dragging or to block clicks underneath)
    if (clientX >= menuOriginX - padding && clientX <= menuOriginX + menuWidth + padding &&
        clientY >= menuOriginY - padding && clientY <= menuOriginY + menuHeight + padding) {
        isDraggingMenu = true;
        draggingMenuType = 'color';
        menuDragStartX = clientX;
        menuDragStartY = clientY;
        menuStartX = colorMenuX;
        menuStartY = colorMenuY;
        
        if (gCameraControl) {
            gCameraControl.enabled = false;
        }
        return true;
    }
    
    return false;
}

function checkLightingMenuClick(clientX, clientY) {
    if (!lightingMenuVisible || lightingMenuOpacity <= 0.5) return false;
    
    const knobRadius = 0.1 * menuScale;
    const knobSpacing = knobRadius * 3;
    const menuTopMargin = 0.2 * knobRadius;
    const menuWidth = knobSpacing * 2;
    const menuHeight = knobSpacing * 1.5;
    const padding = 1.7 * knobRadius;
    
    const menuUpperLeftX = lightingMenuX * window.innerWidth;
    const menuUpperLeftY = lightingMenuY * window.innerHeight;
    const menuOriginX = menuUpperLeftX + knobSpacing;
    const menuOriginY = menuUpperLeftY + 0.5 * knobSpacing;
    
    // Check close button
    const closeIconRadius = knobRadius * 0.25;
    const closeIconX = menuOriginX - padding + closeIconRadius + 0.2 * knobRadius;
    const closeIconY = menuOriginY - padding + closeIconRadius + 0.2 * knobRadius;
    const cdx = clientX - closeIconX;
    const cdy = clientY - closeIconY;
    
    if (cdx * cdx + cdy * cdy < closeIconRadius * closeIconRadius) {
        lightingMenuVisible = false;
        return true;
    }
    
    // Check each knob
    for (let i = 0; i < 4; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const knobX = menuOriginX + col * knobSpacing;
        const knobY = menuOriginY + row * knobSpacing + menuTopMargin;
        
        const dx = clientX - knobX;
        const dy = clientY - knobY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= knobRadius * 1.05) {
            draggedKnob = i + 200; // Offset by 200 for lighting menu knobs
            dragStartMouseX = clientX;
            dragStartMouseY = clientY;
            
            const values = [gAmbientIntensity, gOverheadIntensity, gSpotlightIntensity, gSpotlightPenumbra];
            dragStartValue = values[i];
            
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
        draggingMenuType = 'lighting';
        menuDragStartX = clientX;
        menuDragStartY = clientY;
        menuStartX = lightingMenuX;
        menuStartY = lightingMenuY;
        
        if (gCameraControl) {
            gCameraControl.enabled = false;
        }
        return true;
    }
    
    return false;
}

// Apply mixed colors to boids based on percentage
function applyMixedColors() {
    const numBoids = gPhysicsScene.objects.length;
    
    for (let i = 0; i < numBoids; i++) {
        const boid = gPhysicsScene.objects[i];
        if (boid && boid.hue !== undefined) {
            if (gColorationMode === 0) {
                // Normal mode: Mix primary and secondary colors
                const numPrimary = Math.floor(numBoids * (gColorMixPercentage / 100));
                boid.hue = i < numPrimary ? gPrimaryHue : gSecondaryHue;
            } else if (gColorationMode === 1) {
                // By Direction: Color based on heading
                const vx = boid.vel.x;
                const vz = boid.vel.z;
                let angle = Math.atan2(vz, vx);
                // Convert angle from -PI to PI to 0-360 degrees
                boid.hue = ((angle * 180 / Math.PI + 180) % 360);
            } else if (gColorationMode === 2) {
                // By Speed: Color based on velocity magnitude
                const speed = Math.sqrt(boid.vel.x * boid.vel.x + boid.vel.y * boid.vel.y + boid.vel.z * boid.vel.z);
                // Map speed to hue (assuming typical boid speeds are 0-15)
                // Use blue (240) for slow, red (0) for fast
                const maxSpeed = 3;
                const normalizedSpeed = Math.min(speed / maxSpeed, 1);
                boid.hue = Math.round((1 - normalizedSpeed) * 360); // 240 (blue) to 0 (red)
            }
            
            // Update boid color
            if (boid.visMesh && boid.visMesh.material) {
                boid.visMesh.material.color = new THREE.Color(`hsl(${boid.hue}, ${boid.sat}%, ${boid.light}%)`);
            }
        }
    }
}

// Function to rotate lamp around pivot point
function rotateLamp(lampId) {
    lampId = lampId || 1;
    const lamp = gLamps[lampId];
    if (!lamp) return;
    
    lamp.rotateLamp();
}

// Function to translate entire lamp assembly along ground plane
function translateLampAssembly(deltaX, deltaZ, lampId) {
    lampId = lampId || 1;
    const lamp = gLamps[lampId];
    if (!lamp) return;
    
    lamp.translateAssembly(deltaX, deltaZ);
}

// Function to rotate entire lamp assembly around base center
function rotateLampAssembly(deltaAngle, lampId) {
    lampId = lampId || 1;
    const lamp = gLamps[lampId];
    if (!lamp) return;
    
    lamp.rotateAssembly(deltaAngle);
}

// Function to update lamp height
function updateLampHeight(deltaHeight, lampId) {
    lampId = lampId || 1;
    const lamp = gLamps[lampId];
    if (!lamp) return;
    
    lamp.updateHeight(deltaHeight);
}
    
// ------------------------------------------------------
function onWindowResize() {
    gCamera.aspect = window.innerWidth / window.innerHeight;
    gCamera.updateProjectionMatrix();
    gRenderer.setSize( window.innerWidth, window.innerHeight );
    if (gOverlayCanvas) {
        gOverlayCanvas.width = window.innerWidth;
        gOverlayCanvas.height = window.innerHeight;
    }
}

function run() {
    gPhysicsScene.paused = !gPhysicsScene.paused;
}

/*function restart() {
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
                    //hue = Math.round(100 + Math.random() * 40);
                    hue = 180;
                    sat = 90;
                } else {
                    hue = Math.round(340 + Math.random() * 40);
                    sat = Math.round(30 + Math.random() * 70);
                }
                gPhysicsScene.objects.push(new BOID(pos, radius, vel, hue, sat, 50));
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
}*/

//  RUN -----------------------------------
function update() {
    simulate();
    
    // Update fade-in effect
    if (gFadeInTime < gFadeInDuration) {
        gFadeInTime += deltaT;
    }
    
    // Update button pulse animation
    gButtonPulseTime += deltaT;
    
    // Animate tori rotation around Y axis
    if (gTori.length === 2) {
        gToriRotation += 4 * deltaT; // Rotation speed
        
        // Both tori rotate around the Y axis (vertical), preserving their X rotation (tilt)
        gTori[0].rotation.y = gToriRotation;
        gTori[1].rotation.y = gToriRotation;
    }
    
    // Animate sphere obstacle hue
    if (gObstacles.length > 0) {
        gSphereHue = (gSphereHue + 1 * deltaT) % 360; // Slowly cycle through hues
        var sphereObstacle = gObstacles.find(function(obs) { return obs instanceof SphereObstacle; });
        if (sphereObstacle && sphereObstacle.mesh && sphereObstacle.mesh.material) {
            sphereObstacle.mesh.material.color.setHSL(gSphereHue / 360, 0.9, 0.5);
        }
    }
    
    // Duck entrance animation
    if (gDuck && gDuckEntranceDisc && gDuckEntranceState !== 'complete') {
        gDuckEntranceTimer += deltaT;
        
        if (gDuckEntranceState === 'waiting') {
            // Wait for 1 second
            if (gDuckEntranceTimer >= 1.0) {
                gDuckEntranceState = 'expanding';
                gDuckEntranceTimer = 0;
            }
        } else if (gDuckEntranceState === 'expanding') {
            // Expand disc over 1 second with ease-in (slower start, faster end)
            var duration = 1.0;
            var t = Math.min(gDuckEntranceTimer / duration, 1.0);
            // Quadratic ease-in: y = x^2
            var eased = t * t;
            var maxRadius = 5.0; // Bit larger than duck
            var currentRadius = 0.01 + eased * maxRadius;
            
            // Update disc geometry
            gDuckEntranceDisc.geometry.dispose();
            gDuckEntranceDisc.geometry = new THREE.CircleGeometry(currentRadius, 32);
            
            // Update outline ring
            if (gDuckEntranceDiscOutline) {
                var ringWidth = 0.15;
                gDuckEntranceDiscOutline.geometry.dispose();
                gDuckEntranceDiscOutline.geometry = new THREE.RingGeometry(currentRadius - ringWidth/2, currentRadius + ringWidth/2, 32);
            }
            
            if (t >= 1.0) {
                gDuckEntranceState = 'rising';
                gDuckEntranceTimer = 0;
            }
        } else if (gDuckEntranceState === 'rising') {
            // Duck rises over 1.5 seconds
            var duration = 1.5;
            var t = Math.min(gDuckEntranceTimer / duration, 1.0);
            // Smooth ease-out
            var eased = 1 - Math.pow(1 - t, 3);
            gDuck.position.y = gDuckStartY + eased * (gDuckTargetY - gDuckStartY);
            
            // Update obstacle position
            if (gDuckObstacle) {
                gDuckObstacle.updatePosition(new THREE.Vector3(
                    gDuck.position.x,
                    gDuck.position.y + 1.5,
                    gDuck.position.z
                ));
            }
            
            if (t >= 1.0) {
                gDuckEntranceState = 'shrinking';
                gDuckEntranceTimer = 0;
            }
        } else if (gDuckEntranceState === 'shrinking') {
            // Shrink disc over 2 seconds with ease-in (slower start, faster end)
            var duration = 0.5;
            var t = Math.min(gDuckEntranceTimer / duration, 1.0);
            
            // Quadratic ease-in: y = x^2 (starts slow, ends fast)
            var eased = t * t;
            var maxRadius = 5.0;
            var currentRadius = maxRadius * (1 - eased);
            
            // Update disc geometry
            gDuckEntranceDisc.geometry.dispose();
            gDuckEntranceDisc.geometry = new THREE.CircleGeometry(Math.max(0.01, currentRadius), 32);
            
            // Update outline ring
            if (gDuckEntranceDiscOutline) {
                var ringWidth = 0.15;
                var safeRadius = Math.max(0.01, currentRadius);
                gDuckEntranceDiscOutline.geometry.dispose();
                gDuckEntranceDiscOutline.geometry = new THREE.RingGeometry(Math.max(0.001, safeRadius - ringWidth/2), safeRadius + ringWidth/2, 32);
            }
            
            if (t >= 1.0) {
                gDuckEntranceState = 'complete';
                // Remove disc and outline
                gThreeScene.remove(gDuckEntranceDisc);
                gDuckEntranceDisc.geometry.dispose();
                gDuckEntranceDisc.material.dispose();
                gDuckEntranceDisc = null;
                
                if (gDuckEntranceDiscOutline) {
                    gThreeScene.remove(gDuckEntranceDiscOutline);
                    gDuckEntranceDiscOutline.geometry.dispose();
                    gDuckEntranceDiscOutline.material.dispose();
                    gDuckEntranceDiscOutline = null;
                }
            }
        }
    }
    
    // Teapot slide animation
    if (gTeapot && gTeapotAnimating) {
        gTeapotAnimationTimer += deltaT;
        
        // Slide from Z=25 to Z=10 over 2 seconds with ease-out (deceleration)
        var duration = 2.0;
        var t = Math.min(gTeapotAnimationTimer / duration, 1.0);
        
        // Cubic ease-out: y = 1 - (1-x)^3 (starts fast, ends slow - deceleration)
        var eased = 1 - Math.pow(1 - t, 3);
        
        // Interpolate Z position
        var currentZ = gTeapotStartZ + (gTeapotTargetZ - gTeapotStartZ) * eased;
        gTeapot.position.z = currentZ;
        
        // Stop animation when complete
        if (t >= 1.0) {
            gTeapotAnimating = false;
            gTeapot.position.z = gTeapotTargetZ; // Ensure final position is exact
        }
    }
    
    // Stool lowering animation
    if (gStool && gStoolAnimating) {
        gStoolAnimationTimer += deltaT;
        
        // Lower from Y=30 to Y=0 over 2 seconds with ease-out (deceleration)
        var duration = 2.0;
        var t = Math.min(gStoolAnimationTimer / duration, 1.0);
        
        // Cubic ease-out: y = 1 - (1-x)^3 (starts fast, ends slow - deceleration)
        var eased = 1 - Math.pow(1 - t, 3);
        
        // Interpolate Y position
        var currentY = gStoolStartY + (gStoolTargetY - gStoolStartY) * eased;
        gStool.position.y = currentY;
        
        // Update obstacle position during animation
        if (gStoolObstacle) {
            gStoolObstacle.updatePosition(new THREE.Vector3(
                gStool.position.x,
                currentY + gStoolObstacle.height / 2,
                gStool.position.z
            ));
        }
        
        // Stop animation when complete
        if (t >= 1.0) {
            gStoolAnimating = false;
            gStool.position.y = gStoolTargetY; // Ensure final position is exact
            // Final obstacle position update
            if (gStoolObstacle) {
                gStoolObstacle.updatePosition(new THREE.Vector3(
                    gStool.position.x,
                    gStoolTargetY + gStoolObstacle.height / 2,
                    gStool.position.z
                ));
            }
        }
    }
    
    // Animate Platonic solids rotation around Y axis
    if (window.gPlatonicSolids && window.gPlatonicSolids.length === 5) {
        for (var i = 0; i < window.gPlatonicSolids.length; i++) {
            window.gPlatonicSolids[i].rotation.y += 0.5 * deltaT; // Slow rotation
        }
    }
    
    // Update menu animations
    if (mainMenuVisible) {
        mainMenuOpacity = Math.min(1, mainMenuOpacity + mainMenuFadeSpeed * deltaT);
        mainMenuXOffset = Math.min(0, mainMenuXOffset + mainMenuAnimSpeed * deltaT);
    } else {
        mainMenuOpacity = Math.max(0, mainMenuOpacity - mainMenuFadeSpeed * deltaT);
        mainMenuXOffset = Math.max(-1.0, mainMenuXOffset - mainMenuAnimSpeed * deltaT);
    }
    
    if (menuVisible) {
        menuOpacity = Math.min(0.9, menuOpacity + menuFadeSpeed * deltaT);
    } else {
        menuOpacity = Math.max(0, menuOpacity - menuFadeSpeed * deltaT);
    }
    
    if (stylingMenuVisible) {
        stylingMenuOpacity = Math.min(0.9, stylingMenuOpacity + stylingMenuFadeSpeed * deltaT);
    } else {
        stylingMenuOpacity = Math.max(0, stylingMenuOpacity - stylingMenuFadeSpeed * deltaT);
    }
    
    if (instructionsMenuVisible) {
        instructionsMenuOpacity = Math.min(0.9, instructionsMenuOpacity + instructionsMenuFadeSpeed * deltaT);
    } else {
        instructionsMenuOpacity = Math.max(0, instructionsMenuOpacity - instructionsMenuFadeSpeed * deltaT);
    }
    
    if (colorMenuVisible) {
        colorMenuOpacity = Math.min(0.9, colorMenuOpacity + colorMenuFadeSpeed * deltaT);
    } else {
        colorMenuOpacity = Math.max(0, colorMenuOpacity - colorMenuFadeSpeed * deltaT);
    }
    
    if (lightingMenuVisible) {
        lightingMenuOpacity = Math.min(0.9, lightingMenuOpacity + lightingMenuFadeSpeed * deltaT);
    } else {
        lightingMenuOpacity = Math.max(0, lightingMenuOpacity - lightingMenuFadeSpeed * deltaT);
    }
    
    // Update colors if in dynamic mode (by direction or speed)
    if (gColorationMode === 1 || gColorationMode === 2) {
        applyMixedColors();
    }
    
    // Update bicycle wheel physics
    if (gBicycleWheel && gWheelParts.length > 0) {
        // Calculate valve position angle based on current rotation plus initial offset
        gWheelValveAngle = (gBicycleWheel.rotation.x + gWheelValveInitialAngle) % (Math.PI * 2);
        
        // Apply acceleration if actively spinning
        if (gWheelIsSpinning) {
            gWheelAngularVelocity += gWheelAngularAcceleration * deltaT;
            // Cap maximum speed
            gWheelAngularVelocity = Math.min(gWheelAngularVelocity, 10);
        } else {
            // Apply friction deceleration - friction decreases as wheel slows down
            if (Math.abs(gWheelAngularVelocity) > 0.01) {
                // Dynamic friction: high friction at high speeds, very low friction at low speeds
                var speedFactor = Math.abs(gWheelAngularVelocity) / 10.0; // Normalize to 0-1
                var dynamicFriction = gWheelFriction * (0.03 + 0.99 * speedFactor); // Range: 0.02x to 1.0x friction
                
                var frictionDecel = dynamicFriction * deltaT;
                if (gWheelAngularVelocity > 0) {
                    gWheelAngularVelocity -= frictionDecel;
                } else {
                    gWheelAngularVelocity += frictionDecel;
                }
            }
            
            // Valve weight creates oscillating torque at low speeds
            // This causes the wheel to rock back and forth around the axle
            if (Math.abs(gWheelAngularVelocity) < 5.0) {
                // Valve creates torque based on its angular position
                // Maximum torque when valve is at sides (90° and 270°)
                // Gravity pulls valve down: positive torque when valve descending, negative when ascending
                var valveTorque = gWheelValveMass * Math.sin(gWheelValveAngle) * (5.0 - Math.abs(gWheelAngularVelocity));
                gWheelAngularVelocity += valveTorque * deltaT * 4.0;
            }
        }
        
        // Apply rotation to the wheel group (only around X axis - the axle)
        if (gBicycleWheel) {
            gBicycleWheel.rotation.x += gWheelAngularVelocity * deltaT;
        }
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
                targetPos.y += 1.3;
                lookDirection = direction.clone();
            } else {
                // In front of boid, looking backward
                const forwardOffset = direction.clone().multiplyScalar(2.0);
                targetPos.add(forwardOffset);
                targetPos.y += 0.5;
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
            const direction = gCameraMode === 1 ? 1 : -1; // Mode 1 = CCW, Mode 2 = CW
            const rotationAngle = direction * gCameraRotationSpeed * deltaT * Math.PI / 180; // Convert to radians, scale by deltaT
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
    // drawButtons(); // Removed - functionality moved to main menu
    drawMainMenu();
    drawSimMenu();
    drawStylingMenu();
    drawInstructionsMenu();
    drawColorMenu();
    drawLightingMenu();
    
    // Draw fade-in effect (black overlay that fades out)
    if (gFadeInTime < gFadeInDuration) {
        const fadeProgress = gFadeInTime / gFadeInDuration; // 0 to 1
        const opacity = 1 - fadeProgress; // 1 to 0
        gOverlayCtx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
        gOverlayCtx.fillRect(0, 0, gOverlayCanvas.width, gOverlayCanvas.height);
    }
    
    requestAnimationFrame(update);
}

// RUN -----------------------------------
initThreeScene();
initColorWheel();
onWindowResize();
makeBoids();
// Initialize spatial grid and populate it
SpatialGrid = new SpatialHashGrid(boidProps.visualRange);
for (var i = 0; i < gPhysicsScene.objects.length; i++) {
    SpatialGrid.insert(gPhysicsScene.objects[i]);
}
// Don't apply any initial rotations - lamps are already in correct position
// drawButtons(); // Removed - functionality moved to main menu
update();