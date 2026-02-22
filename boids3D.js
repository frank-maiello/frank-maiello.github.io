/*
B0IDS 3D : A 3D Boids Simulation with Interactive Lighting and Obstacles
copyright 2025 :: Frank Maiello :: maiello.frank@gmail.com

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
        
// Asset loading management
var gLoadingManager = null; // THREE.LoadingManager to track asset loading
var gAssetsLoaded = false; // Flag tracking if all assets have finished loading

var gThreeScene;
var gRenderer;
var gAnaglyphEffect = null; // AnaglyphEffect for stereo rendering
var gStereoEnabled = false; // Whether stereo/anaglyph mode is enabled
var gCamera;
var gCameraControl;
var gGrabber;
var gMouseDown = false;
var gCameraAngle = 0;
var gCameraRotationSpeed = 3.0; // Rotation state: 0 = stopped, 0.5 = forward, -0.5 = backward
var gCameraFOV = 50; // Camera field of view (20-120)
var gAutoRotate = true; // Enable/disable auto-rotation
var gCameraMode = 1; // Camera mode: 0=rotate CW, 1=rotate CCW, 2=static, 3=behind boid, 4=in front of boid, 5=walking
var gCameraManualControl = false; // Track if user is manually controlling camera
var gCameraSpringStrength = 0.08; // Spring interpolation strength (lower = smoother)
var gCameraOffset = new THREE.Vector3(0, 0, 0); // Manual camera offset in first-person mode
var gCameraRotationOffset = { theta: 0, phi: 0 }; // Manual rotation offset
var gCameraDistanceOffset = 0; // Distance offset for follow/lead modes
var gCameraPrevPosition = new THREE.Vector3(0, 0, 0); // Previous camera position for velocity calculation
var gCameraVelocity = new THREE.Vector3(0, 0, 0); // Camera velocity for Doppler effect
var gWalkingCameraYaw = 0; // Horizontal rotation for walking mode
var gWalkingCameraPitch = 0; // Vertical tilt for walking mode
var gWalkingCameraPosition = new THREE.Vector3(0, 6.8, 0); // Position for walking mode (eye level at 6.8m)
var gWalkingSpeed = 5.0; // Walking speed in units per second
var gWalkingCameraLookLocked = true; // Whether walking camera look is locked (starts locked)
var gKeysPressed = { w: false, a: false, s: false, d: false, up: false, down: false, left: false, right: false }; // Track key states for walking
var gSavedCameraPosition = null; // Saved camera position from third-person mode
var gSavedCameraTarget = null; // Saved camera target from third-person mode
var gDollyRailsPosition = new THREE.Vector3(9, 0.15, 0); // Center position of dolly rails
var gDollyRailsRotation = 0; // Rotation angle of dolly rails (around Y axis)
var gDollyRailsLength = 65; // Length of dolly rails
var gDollyPosition = 0.5; // Position along rails (0 to 1)
var gDollyDirection = 1; // Direction of dolly movement (1 or -1)
var gDollySpeed = 0.05; // Speed of dolly traversal
var gDollyVelocity = 0.05; // Current velocity of dolly (can be negative)
var gDollyRailsMesh = null; // THREE.Group containing dolly rails visualization
var gDollyCartMesh = null; // THREE.Group containing dolly cart (wheels + platform)
var gDollyCameraMesh = null; // THREE.Group containing film camera model on dolly
var gDollyCameraMountRod = null; // Thin rod connecting camera to dolly platform
var gDraggingDolly = false; // Whether user is dragging dolly rails
var gDraggingDollyEnd = null; // Which end is being dragged: null, 'start', or 'end'
var gDollyDragStartMouseX = 0; // Starting mouse X for dolly drag
var gDollyDragStartMouseY = 0; // Starting mouse Y for dolly drag
var gDollyDragStartRotation = 0; // Starting rotation for dolly rotation
var gDollyDragStartPosition = null; // Starting position for dolly translation
var gDollyDragPivotPosition = null; // Fixed pivot position during rotation drag
var gDollyCameraYaw = Math.PI; // Horizontal rotation for dolly camera mode (starts at -90 degrees)
var gDollyCameraPitch = 0; // Vertical tilt for dolly camera mode
var gDollyCameraHeight = 7.5; // Camera height above ground in dolly mode
var gDollyCameraLookLocked = true; // Whether dolly camera look is locked (starts locked)
var gPointerLastX = 0;
var gPointerLastY = 0;
var container = null; // Container element for renderer
var gLamps = []; // Array to store all Lamp instances

// Camera mode text notification
var gCameraModeText = ''; // Current text to display
var gCameraModeTextTimer = 0; // Countdown timer for text fade
var gCameraModeTextDuration = 2.0; // Duration in seconds for text to fade

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
var gDraggingTorus = false; // Track if dragging the torus obstacle
var gTorusDragOffset = null; // Store offset from click point to torus center
var gTorusDragPlaneHeight = 0; // Store the Y height where the torus was grabbed
var gTorusDragPlaneDistance = 0; // Store the distance from camera for fixed plane dragging
var gTorusHue = 90; // Current hue value for torus obstacle (0-360, same start as sphere)
var gDraggingSkyPig = false; // Track if dragging the sky pig obstacle
var gSkyPigDragOffset = null; // Store offset from click point to sky pig center
var gSkyPigDragPlaneHeight = 0; // Store the Y height where the sky pig was grabbed
var gSkyPigDragPlaneDistance = 0; // Store the distance from camera for fixed plane dragging
var gDuckDragPlaneHeight = 0; // Store the Y height where the duck was grabbed
var gDuckDragOffset = null; // Store offset from click point to duck center (for toggle dragging)
var gMammothDragPlaneHeight = 0; // Store the Y height where the mammoth was grabbed
var gMammothDragOffset = null; // Store offset from click point to mammoth center (for toggle dragging)
var gDraggingMammothSkeleton = false; // Track if dragging the mammoth skeleton
var gMammothSkeletonDragOffset = null; // Store offset from click point to skeleton center
var gMammothSkeletonDragPlaneHeight = 0; // Height of the invisible plane for skeleton dragging
var gTeapotDragPlaneHeight = 0; // Store the Y height where the teapot was grabbed
var gTeapotDragOffset = null; // Store offset from click point to teapot center (for toggle dragging)
var gChairDragPlaneHeight = 0; // Store the Y height where the chair was grabbed
var gChairDragOffset = null; // Store offset from click point to chair center (for toggle dragging)
var gSofaDragPlaneHeight = 0; // Store the Y height where the sofa was grabbed
var gSofaDragOffset = null; // Store offset from click point to sofa center (for toggle dragging)
var gStoolDragPlaneHeight = 0; // Store the Y height where the stool was grabbed
var gStoolDragOffset = null; // Store offset from click point to stool center (for toggle dragging)
var gBirdDragPlaneHeight = 0; // Store the Y height where the bird was grabbed
var gBirdDragOffset = null; // Store offset from click point to bird center (for toggle dragging)
var gKoonsDogDragPlaneHeight = 0; // Store the Y height where the Koons Dog was grabbed
var gKoonsDogDragOffset = null; // Store offset from click point to Koons Dog center (for toggle dragging)
var gGlobeLampDragPlaneDistance = 0; // Store the distance from camera for globe lamp dragging
var gGlobeLampDragOffset = null; // Store offset from click point to globe lamp center (for toggle dragging)
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
var gCurrentlyDraggingObject = null; // Track which object is currently in dragging mode: 'duck', 'mammoth', 'teapot', 'chair', 'sofa', 'stool', etc.
var gLastObjectClickTime = { duck: 0, mammoth: 0, mammothSkeleton: 0, teapot: 0, chair: 0, sofa: 0, stool: 0, bird: 0, koonsDog: 0, globeLamp: 0 }; // Track last click time for double-click detection
var gDragHighlightBox = null; // BoxHelper to show which object is being dragged
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
var cameraMenuVisible = false; // Camera submenu visibility
var cameraMenuVisibleBeforeHide = false;
var cameraMenuOpacity = 0;
var cameraMenuFadeSpeed = 3.0;
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
var cameraMenuX = 0.1; // Camera menu position
var cameraMenuY = 0.2;
var gColorWheelCanvas = null; // Offscreen canvas for color wheel
var gColorWheelCtx = null;
var gPrimaryHue = 180; // Primary hue (0-360)
var gSecondaryHue = 0; // Secondary hue (0-360)
var gPrimaryRingRotation = 180 * Math.PI / 180; // Rotation angle for primary ring (radians)
var gSecondaryRingRotation = 0 * Math.PI / 180; // Rotation angle for secondary ring (radians)
var gColorMixPercentage = 10; // Percentage of boids with primary color (0-100)
var gBoidSaturation = 70; // Global saturation for boids (0-100)
var gBoidLightness = 50; // Global lightness for boids (0-100)
var gBoidHueVariability = 10; // Hue variability range (+/- degrees, 0-60)
var gColorationMode = 0; // 0 = Normal, 1 = By Direction, 2 = By Speed, 3 = By Doppler
var gDraggingMixKnob = false; // Track if dragging the mix knob
var gDraggingSaturationKnob = false; // Track if dragging the saturation knob
var gDraggingVariabilityKnob = false; // Track if dragging the variability knob
var gDraggingLightnessKnob = false; // Track if dragging the lightness knob
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

var gBicycleWheel = null; // Group containing wheel parts
var gWheelParts = []; // Array of wheel meshes (tire, spokes, valve)
var gStool = null; // Reference to entire stool model
var gStoolObstacle = null; // Cylinder obstacle for boid avoidance
var gDraggingStool = false; // Track if dragging the stool (toggleable)
var gRotatingStool = false; // Track if rotating the stool
var gDuck = null; // Reference to duck model
var gDuckObstacle = null; // Sphere obstacle for boid avoidance
var gDraggingDuck = false; // Track if dragging the duck (toggleable)
var gRotatingDuckBeak = false; // Track if rotating the duck via beak
var gDuckEntranceDisc = null; // Black disc for entrance animation
var gDuckEntranceDiscOutline = null; // White outline for disc
var gDuckEntranceState = 'waiting'; // States: waiting, expanding, rising, shrinking, complete
var gDuckEntranceTimer = 0; // Timer for animation
var gDuckTargetY = -0.4; // Target Y position for duck
var gDuckStartY = -8; // Starting Y position (below floor)
var gDuckInitialX = 18; // Initial X position for world resize scaling
var gDuckInitialZ = 12; // Initial Z position for world resize scaling
var gMammoth = null; // Reference to mini mammoth display model
var gMammothObstacle = null; // Sphere obstacle for boid avoidance
var gDraggingMammoth = false; // Track if dragging the mammoth (toggleable)
var gMammothSkeleton = null; // Reference to full mammoth skeleton model
var gMammothSkeletonObstacle = null; // Sphere obstacle for full mammoth
var gMammothSwapDisc = null; // Disc for swap animation hole
var gMammothSwapDiscOutline = null; // Outline ring for swap disc
var gMammothSwapState = 'idle'; // States: idle, expanding-mini, dropping-mini, pausing, rising-full, shrinking, complete
var gMammothSwapTimer = 0; // Timer for animation
var gMammothSwapSpotlight = null; // Spotlight for swap animation
var gMiniMammothStartY = 0; // Starting Y for mini mammoth drop
var gMiniMammothTargetY = -10; // Target Y for mini mammoth (below floor)
var gFullMammothStartY = -25; // Starting Y for full mammoth (below floor)
var gFullMammothTargetY = 0; // Target Y for full mammoth (at floor level)
var gTeapot = null; // Teapot model reference
var gTeapotAnimating = true; // Is teapot currently animating
var gTeapotAnimationTimer = 0; // Timer for teapot slide animation
var gTeapotStartZ = 40; // Starting Z position
var gTeapotTargetZ = 0; // Target Z position
var gTeapotObstacle = null; // Teapot obstacle for boid avoidance
var gDraggingTeapot = false; // Track if dragging the teapot (toggleable)
var gTeapotInitialX = -10; // sets final x Initial X position for world resize scaling
var gTeapotInitialZ = 0; // does nothing Initial Z position for world resize scaling (final position after animation)
var gStoolAnimating = true; // Is stool currently animating
var gStoolAnimationTimer = 0; // Timer for stool lowering animation
var gStoolStartY = 30; // Starting Y position (high above floor)
var gStoolInitialX = -20;
var gStoolInitialZ = -9;

var gColumnInitialX = 26; // Initial X position for world resize scaling
var gColumnInitialZ = -26; // Initial Z position for world resize scaling
var gBird = null; // Brancusi Bird model reference
var gBirdObstacle = null; // Cylinder obstacle for boid avoidance
var gDraggingBird = false; // Track if dragging the bird (toggleable)
var gBirdInitialX = -22; // Initial X position for world resize scaling
var gBirdInitialZ = 8; // Initial Z position for world resize scaling
var gBirdDropping = false; // Flag for bird drop animation
var gBirdDropTimer = 0; // Timer for bird drop animation
var gBirdDropDelay = 0.0; // Delay before bird drops
var gBirdDropDuration = 1.5; // Duration of bird drop animation
var gBirdStartY = 60; // Starting Y offset for bird drop
var gKoonsDog = null; // Koons Dog sculpture model reference
var gKoonsDogObstacle = null; // Sphere obstacle for boid avoidance
var gDraggingKoonsDog = false; // Track if dragging the Koons Dog (toggleable)
var gKoonsDogInitialX = -25; // Initial X position for world resize scaling
var gKoonsDogInitialZ = 26; // Initial Z position for world resize scaling
var gGlobeLamp = null; // Globe lamp model reference
var gGlobeLampLight = null; // Point light at center of globe lamp
var gGlobeLampObstacle = null; // Sphere obstacle for boid avoidance
var gDraggingGlobeLamp = false; // Track if dragging the globe lamp (toggleable)
var gChair = null; // Sheen chair model reference
var gChairObstacle = null; // Box obstacle for boid avoidance
var gDraggingChair = false; // Track if dragging the chair (toggleable)
var gChairInitialX = -2; // Initial X position for world resize scaling
var gChairInitialZ = 0; // Initial Z position for world resize scaling
var gChairSliding = false; // Flag for chair slide animation (starts after loading)
var gSofa = null; // Glam velvet sofa model reference
var gSofaObstacle = null; // Box obstacle for boid avoidance
var gDraggingSofa = false; // Track if dragging the sofa (toggleable)
var gSofaInitialX = 19; // Initial X position for world resize scaling (close to left wall)
var gSofaInitialZ = -11; // Initial Z position for world resize scaling
var gChairSlideTimer = 0; // Timer for chair slide animation
var gChairStartX = 60; // Starting X position for chair slide
var gChairTargetX = -1; // Target X position for chair
var gSofaSliding = false; // Flag for sofa slide animation (starts after loading)
var gSofaSlideTimer = 0; // Timer for sofa slide animation
var gSofaStartX = -60; // Starting X position for sofa slide (off-screen to left)
var gSofaTargetX = 19; // Target X position for sofa
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
var gSpawnPointLight = null; // Point light at boid spawn center
var gDragSpotlight = null; // Spotlight for object being dragged
var gOriginalLightIntensities = {}; // Store original light intensities when dimming for drag
var gAmbientIntensity = 1.2; // Ambient light intensity (0-2)
var gAmbientHue = 0; // Ambient light hue (0-360)
var gAmbientSaturation = 0; // Ambient light saturation (0-100)
var gOverheadIntensity = 0.9; // Directional light intensity (0-2)
var gOverheadHue = 0; // Overhead light hue (0-360)
var gOverheadSaturation = 0; // Overhead light saturation (0-100)
var gSpotlight1Intensity = 0.8; // Spotlight 1 intensity (0-2)
var gSpotlight1Hue = 0; // Spotlight 1 hue (0-360)
var gSpotlight1Saturation = 0; // Spotlight 1 saturation (0-100)
var gSpotlight2Intensity = 0.8; // Spotlight 2 intensity (0-2)
var gSpotlight2Hue = 0; // Spotlight 2 hue (0-360)
var gSpotlight2Saturation = 0; // Spotlight 2 saturation (0-100)
var gMiroPaintingGroup = null; // Reference to Miro painting + frame group
var gDaliPaintingGroup = null; // Reference to Dali painting + frame group
var gDuchampPaintingGroup = null; // Reference to Duchamp painting + frame group
var gBoschPaintingGroup = null; // Reference to Bosch triptych + frames group
var gDuchampBridePaintingGroup = null; // Reference to Duchamp Bride painting + frame group
var gDuchampGrinderPaintingGroup = null; // Reference to Duchamp Grinder painting + frame group
var gDuchampBrideTopPaintingGroup = null; // Reference to Duchamp Bride (top) painting + frame group
var gCurrentPainting = 'miro'; // Current painting displayed: 'miro', 'dali', 'duchamp', or 'bosch'
var gTargetPainting = 'miro'; // Target painting to display
var gPaintingAnimState = 'idle'; // States: idle, exiting, entering
var gPaintingAnimTimer = 0; // Timer for painting animation
var gPaintingBaseY = 0; // Base Y position for paintings in frame
var gDuchampPaintingBaseY = 0; // Base Y position for Duchamp painting specifically
var gPaintingExitY = 50; // Y position when painting exits (above frame)
var gLeftWallPainting = null; // Reference to Duchamp painting on left wall
var gLeftWallFramePieces = []; // Frame pieces for left wall painting
var gOvalPainting = null; // Reference to oval painting on back wall
var gOvalFrame = null; // Reference to oval frame on back wall
var gPaintingsDropping = false; // Flag for painting drop animation (starts after loading)
var gPaintingDropStartY = 50; // Starting Y position for painting drop
var gPaintingDropTimer = 0; // Timer for painting drop animation
var gPaintingDropDelay = 0; // Delay after walls finish before paintings drop
var gPaintingDropDuration = 1.5; // Duration of painting drop animation
var gDuchampExtraPaintingsActive = false; // Track if extra Duchamp paintings should be visible
var gDuchampExtraPaintingsDropping = false; // Track if extra paintings are descending
var gDuchampExtraPaintingsDropTimer = 0; // Timer for extra paintings drop animation
var gDuchampBrideTopActive = false; // Track if Duchamp Bride top painting should be visible
var gDuchampBrideTopDropping = false; // Track if Duchamp Bride top painting is descending
var gDuchampBrideTopDropTimer = 0; // Timer for Duchamp Bride top painting drop animation
var gBoschTriptychScale = 1.0; // Current scale of Bosch triptych (1.0, 1.5, or 2.5)
var gBoschPanelHeight = 12; // Base height for Bosch panels (scaled by gBoschTriptychScale)
var gBoschBottomHeight = 0; // Bottom height of Bosch triptych (constant regardless of scale)
var gSelectedArtwork = 'miro'; // Selected artwork for right wall: 'miro', 'dali', or 'bosch'
var gSpotlightPenumbra = 0.2; // Spotlight penumbra (0-1)
var gShadowCameraFar = 70; // Shadow camera far distance for lamps (10-150)
var gHeadlightIntensity = 0; // Headlight intensity (0-2)
var gHeadlight = null; // Headlight spotlight reference
var gHeadlightPointLight = null; // Point light in front of boid when headlight is active
var gGlobeLampIntensity = 0; // Globe lamp point light intensity (0-3)
var gGlobeLampHue = 0; // Globe lamp hue (0-360)
var gGlobeLampSaturation = 80; // Globe lamp saturation (0-100)
var gOrnamentLightIntensity = 0; // Ornament point light intensity (0-3)
var gOrnamentLightFalloff = 8; // Ornament point light distance/falloff (3-15)
var gOrnamentHeightOffset = 50; // Ornament height percentage (0=floor, 100=above ceiling)
var gHangingStars = []; // Array of hanging star decorations
var gStarAnimData = []; // Animation data for each star {star, wire, targetY, startY, timer, delay, animating}
var gEnableStarSwayAndTwist = true; // Enable/disable star swaying and twisting motion
var gPedestalAnimData = []; // Animation data for pedestals {pedestal, solidGroup, targetPedestalY, targetSolidY, startY, timer, delay, animating}
var gColumnObstacle = null; // Reference to the column cylinder obstacle
var gTorusObstacle = null; // Reference to the torus obstacle
var gColumnDropping = false; // Flag for column drop animation
var gColumnDropTimer = 0; // Timer for column drop animation
var gColumnDropDelay = 0.0; // Delay after pedestals finish before column drops
var gColumnDropDuration = 1.5; // Duration of column drop animation
var gColumnStartY = 60; // Starting Y offset for column drop
var gTorusDropping = false; // Flag for torus drop animation (starts after loading)
var gTorusDropTimer = 0; // Timer for torus drop animation
var gTorusDropDelay = 0.0; // Delay after paintings finish before torus drops
var gTorusDropDuration = 1.5; // Duration of torus drop animation
var gTorusStartY = 20; // Starting Y offset for torus drop
var gTorusTargetY = 10; // Target Y position for torus
var gTorusStartMajorRadius = 0.5; // Starting major radius for torus
var gTorusTargetMajorRadius = 6; // Target major radius for torus
var gTorusStartMinorRadius = 0.1; // Starting minor radius (tube) for torus
var gTorusTargetMinorRadius = 1; // Target minor radius (tube) for torus
var gSphereRising = false; // Flag for sphere rise animation (starts after loading)
var gSphereRiseTimer = 0; // Timer for sphere rise animation
var gSphereRiseDuration = 2.0; // Duration of sphere rise animation
var gSphereStartY = 0; // Starting Y position for sphere (on floor)
var gSphereTargetY = 15; // Target Y position for sphere
var gSphereStartRadius = 0.1; // Starting radius for sphere
var gSphereTargetRadius = 3; // Target radius for sphere
var gSphereObstacle = null; // Reference to sphere obstacle
var gSkyPig = null; // Reference to sky pig model
var gSkyPigObstacle = null; // Reference to sky pig obstacle
var gSkyPigRising = false; // Flag for sky pig rise animation
var gSkyPigRiseTimer = 0; // Timer for sky pig rise animation
var gSkyPigRiseDuration = 2.0; // Duration of sky pig rise animation
var gSkyPigStartY = 0; // Starting Y position for sky pig
var gSkyPigTargetY = 12; // Target Y position for sky pig
var gSkyPigStartScale = 0.1; // Starting scale for sky pig (tiny)
var gSkyPigTargetScale = 2.0; // Target scale for sky pig (full size)
var gColumnBaseSliding = false; // Flag for column base slide animation (starts after loading)
var gColumnBaseSlideTimer = 0; // Timer for column base slide animation
var gColumnBaseStartZ = 35; // Starting Z offset for column base slide
var gColumnBaseTargetZ = -26; // Target Z position for column base
var gColumnEverDragged = false; // Flag to permanently disable animations after first drag

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
var WORLD_DEPTH = 30;   // Z dimension

// Individual world size controls (for menu knobs)
var gWorldSizeX = WORLD_WIDTH;
var gWorldSizeY = WORLD_HEIGHT;
var gWorldSizeZ = WORLD_DEPTH;

var gPhysicsScene = {
    gravity : new THREE.Vector3(0.0, 0.0, 0.0),
    dt : 1.0 / 60.0,
    worldSize : {x: gWorldSizeX, y: gWorldSizeY, z: gWorldSizeZ},
    paused: true,
    objects: [],				
};

// Store references to scene elements that need to be resized
var gWalls = { front: null, back: null, left: null, right: null };
var gBaseboards = { front: null, back: null, left: null, right: null };
var gFloor = null;
var gRug = null; // Afghan rug mesh
var gMarbleTexture = null; // Marble texture for wall squares
var gPedestalMarbleTexture = null; // Marble texture for platonic solid pedestals
var gColumnMarbleTexture = null; // Marble texture for fluted column

// Wall animation state
var gWallAnimation = {
    front: { timer: 0, delay: 1.15, duration: 1.2, animating: true, startRotation: Math.PI / 2, targetRotation: 0 },
    back: { timer: 0, delay: 1.15, duration: 1.2, animating: true, startRotation: -Math.PI / 2, targetRotation: 0 },
    left: { timer: 0, delay: 1.15, duration: 1.2, animating: true, startRotation: Math.PI / 2, targetRotation: 0 },
    right: { timer: 0, delay: 1.15, duration: 1.2, animating: true, startRotation: -Math.PI / 2, targetRotation: 0 }
};

var gRunning = false; // Track if simulation is running (start paused)
var gBoidStartDelay = 10.0; // Delay in seconds before boids start animating
var gBoidStartTimer = 0; // Timer for boid start delay
var gBoidsStarted = false; // Track if boids have started animating

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
    material: 'imported' // Material type: 'basic', 'phong', 'standard', 'normal', 'toon', 'depth', 'imported'
};

// Boid trail tracking variables
var gTrailEnabled = false; // Enable/disable trail tracking
var gTrailLength = 50; // Maximum number of trail points to store
var gTrailRadius = 0.5; // Multiplier for trail tube radius (relative to boid radius)
var gTrailBoidIndex = 0; // Index of boid to track (first boid in array)
var gTrailPositions = []; // Array to store trail positions
var gTrailMesh = null; // THREE.Mesh for the trail tube
var gTrailCapMesh = null; // THREE.Mesh for the disc cap at trail end
var gTrailUpdateCounter = 0; // Counter to limit trail updates
var gTrailUpdateFrequency = 1; // Update trail every N frames
var gTrailColorMode = 3; // 0=White, 1=Black, 2=B&W, 3=Color

// Boid geometry types (multiple can be selected)
var gSelectedBoidTypes = [3]; // Array of selected geometry types: 0=Sphere, 1=Cone, 2=Cylinder, 3=Box, 4=Tetrahedron, 5=Octahedron, 6=Dodecahedron, 7=Icosahedron, 8=Capsule, 9=Torus, 10=TorusKnot, 11=Plane, 12=Duck, 13=Fish, 14=Avocado, 15=Helicopter, 16=PaperPlane, 17=KoonsDog
var gDuckTemplate = null; // Template duck model for boid geometry
var gFishTemplate = null; // Template fish model for boid geometry
var gAvocadoTemplate = null; // Template avocado model for boid geometry
var gHelicopterTemplate = null; // Template helicopter model for boid geometry
var gPaperPlaneTemplate = null; // Template paper plane model for boid geometry
var gKoonsDogTemplate = null; // Template Koons Dog model for boid geometry

// OBSTACLE CLASSES ---------------------------------------------------------------------

class BoxObstacle {
    constructor(width, height, depth, position, rotation) {
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.position = position.clone();
        this.rotation = rotation || { x: 0, y: 0, z: 0 };
        this.mesh = null;
        this.enabled = true;
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
        this.enabled = true;
        
        // Create the torus mesh
        this.createMesh();
    }
    
    createMesh() {
        var geometry = new THREE.TorusGeometry(this.majorRadius, this.minorRadius, 16, 100);
        var material = new THREE.MeshPhongMaterial({shininess: 100});
        material.color.setHSL(gTorusHue / 360, 0.9, 0.5); // Initialize with current hue
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.rotation.x = this.rotation.x;
        this.mesh.rotation.y = this.rotation.y;
        this.mesh.rotation.z = this.rotation.z;
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.userData.isDraggableTorus = true;
        this.mesh.userData.torusObstacle = this;
        gThreeScene.add(this.mesh);
        
        // Force update of matrix world before using it
        this.mesh.updateMatrixWorld(true);
    }
    
    updateRotationMatrices() {
        // Not needed anymore - we read directly from mesh
    }
    
    // Check if a point is inside the solid part of the torus
    // Returns distance to surface (negative if inside solid)
    getDistanceToSurface(point) {
        if (!this.mesh) return 1000; // Far away if no mesh
        
        // Update matrix to ensure we have latest transform
        this.mesh.updateMatrixWorld(true);
        
        // Create inverse world matrix
        const inverseWorldMatrix = new THREE.Matrix4();
        inverseWorldMatrix.copy(this.mesh.matrixWorld).invert();
        
        // Transform point to torus local space
        const localPoint = point.clone();
        localPoint.applyMatrix4(inverseWorldMatrix);
        
        // Signed distance to torus
        // THREE.TorusGeometry: major circle in XY plane, tube extends along Z
        const distToCenter = Math.sqrt(localPoint.x * localPoint.x + localPoint.y * localPoint.y);
        
        // Vector from major circle to point (in the tube cross-section)
        const qx = distToCenter - this.majorRadius;
        const qz = localPoint.z;
        
        // Distance in the tube cross-section plane
        const tubeDistance = Math.sqrt(qx * qx + qz * qz);
        
        // Return signed distance (negative if inside the solid tube)
        return tubeDistance - this.minorRadius;
    }
    
    // Apply avoidance force to a boid
    applyAvoidance(boid, avoidanceStrength = 1.5) {
        const distance = this.getDistanceToSurface(boid.pos);
        const threshold = 2.0; // Start avoiding when within this distance (reduced to allow free passage through center hole)
        
        if (distance < threshold) {
            if (!this.mesh) return;
            
            // Create inverse world matrix
            const inverseWorldMatrix = new THREE.Matrix4();
            inverseWorldMatrix.copy(this.mesh.matrixWorld).invert();
            
            // Transform point to torus local space for gradient calculation
            const localPoint = boid.pos.clone();
            localPoint.applyMatrix4(inverseWorldMatrix);
            
            // Calculate analytical gradient in local space
            // THREE.TorusGeometry: major circle in XY plane, tube extends along Z
            const distToCenter = Math.sqrt(localPoint.x * localPoint.x + localPoint.y * localPoint.y);
            
            if (distToCenter < 0.001) {
                // Special case: near the center axis - push radially outward in XY plane
                const gradient = new THREE.Vector3(1, 0, 0);
                // Transform gradient back to world space using rotation part of world matrix
                const rotationMatrix = new THREE.Matrix3();
                rotationMatrix.setFromMatrix4(this.mesh.matrixWorld);
                gradient.applyMatrix3(rotationMatrix);
                boid.vel.x += gradient.x * avoidanceStrength * 5.0;
                boid.vel.y += gradient.y * avoidanceStrength * 5.0;
                boid.vel.z += gradient.z * avoidanceStrength * 5.0;
                return;
            }
            
            const qx = distToCenter - this.majorRadius;
            const qz = localPoint.z;
            const tubeDistance = Math.sqrt(qx * qx + qz * qz);
            
            if (tubeDistance < 0.001) {
                // Special case: exactly on major circle - push radially in XY plane
                const gradient = new THREE.Vector3(localPoint.x / distToCenter, localPoint.y / distToCenter, 0);
                // Transform gradient back to world space using rotation part of world matrix
                const rotationMatrix = new THREE.Matrix3();
                rotationMatrix.setFromMatrix4(this.mesh.matrixWorld);
                gradient.applyMatrix3(rotationMatrix);
                boid.vel.x += gradient.x * avoidanceStrength * 5.0;
                boid.vel.y += gradient.y * avoidanceStrength * 5.0;
                boid.vel.z += gradient.z * avoidanceStrength * 5.0;
                return;
            }
            
            // Analytical gradient in local space
            const factor = qx / (distToCenter * tubeDistance);
            const gradLocalX = localPoint.x * factor;
            const gradLocalY = localPoint.y * factor;
            const gradLocalZ = qz / tubeDistance;
            
            // Create gradient vector in local space
            const gradient = new THREE.Vector3(gradLocalX, gradLocalY, gradLocalZ);
            
            // Transform gradient back to world space using rotation part of world matrix
            const rotationMatrix = new THREE.Matrix3();
            rotationMatrix.setFromMatrix4(this.mesh.matrixWorld);
            gradient.applyMatrix3(rotationMatrix);
            
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
    
    // Create debug spheres to visualize the torus surface
    createDebugSpheres() {
        const numMajorSegments = 32; // Points around major circle
        const numMinorSegments = 16; // Points around tube
        const debugSphereRadius = 0.15;
        
        this.debugSpheres = [];
        
        if (!this.mesh) return;
        
        // Ensure mesh matrices are up to date
        this.mesh.updateMatrixWorld(true);
        
        for (let i = 0; i < numMajorSegments; i++) {
            // Angle around major circle (THREE.TorusGeometry uses XY plane, not XZ!)
            const theta = (i / numMajorSegments) * Math.PI * 2;
            
            for (let j = 0; j < numMinorSegments; j++) {
                // Angle around tube cross-section
                const phi = (j / numMinorSegments) * Math.PI * 2;
                
                // Point on torus surface in local space
                // THREE.TorusGeometry parametric: major circle in XY plane!
                const localX = (this.majorRadius + this.minorRadius * Math.cos(phi)) * Math.cos(theta);
                const localY = (this.majorRadius + this.minorRadius * Math.cos(phi)) * Math.sin(theta);
                const localZ = this.minorRadius * Math.sin(phi);
                
                // Transform to world space using the mesh's transformation
                const localPoint = new THREE.Vector3(localX, localY, localZ);
                const worldPoint = localPoint.applyMatrix4(this.mesh.matrixWorld);
                
                // Create small sphere at this point
                const sphereGeometry = new THREE.SphereGeometry(debugSphereRadius, 8, 8);
                const sphereMaterial = new THREE.MeshBasicMaterial({
                    color: 0xff0000,
                    transparent: true,
                    opacity: 0.6
                });
                const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
                sphere.position.copy(worldPoint);
                gThreeScene.add(sphere);
                this.debugSpheres.push(sphere);
            }
        }
    }
    
    // Remove debug spheres
    removeDebugSpheres() {
        if (this.debugSpheres) {
            this.debugSpheres.forEach(sphere => {
                gThreeScene.remove(sphere);
                sphere.geometry.dispose();
                sphere.material.dispose();
            });
            this.debugSpheres = [];
        }
    }
    
    // Update torus position
    updatePosition(newPosition) {
        this.position.copy(newPosition);
        if (this.mesh) {
            this.mesh.position.copy(newPosition);
        }
    }
}

class SphereObstacle {
    constructor(radius, position) {
        this.radius = radius;
        this.position = position.clone();
        this.mesh = null;
        this.enabled = true;
        this.createMesh();
    }
    
    createMesh() {
        var geometry = new THREE.SphereGeometry(this.radius, 16, 16);
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
    constructor(radius, height, position, rotation, skipTori, collisionOnly) {
        this.radius = radius;
        this.height = height;
        this.position = position.clone();
        this.rotation = rotation || { x: 0, y: 0, z: 0 };
        this.skipTori = skipTori || false; // Flag to skip creating decorative tori
        this.collisionOnly = collisionOnly || false; // Flag to skip all visual geometry
        this.mesh = null;
        this.enabled = true;
        
        this.columnSections = [];
        this.groutLayers = [];
        
        // Calculate section height for collision detection
        if (this.collisionOnly) {
            // Skip mesh creation, just set up collision properties
            const numSections = 3;
            const groutThickness = 0.05;
            const totalGroutHeight = groutThickness * (numSections - 1);
            this.sectionHeight = (this.height - totalGroutHeight) / numSections;
        } else {
            // Create the cylinder mesh
            this.createMesh();
        }
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
            color: 0xffffff,
            map: gColumnMarbleTexture,
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
        
        // Create two rings on top of column (unless skipTori flag is set)
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
        
        // Create minorToric pedestal
        const minorToricPedestalRadius = this.radius;
        const minorToricPedestalHeight = 3; 
        //const minorToricPedestalGeometry = new THREE.ConeGeometry(minorToricPedestalRadius, minorToricPedestalHeight, 64);
        const minorToricPedestalGeometry = new THREE.TorusGeometry(
            minorToricPedestalRadius, 
            0.3, 
            8, 
            16); // Start with thin torus geometry
        minorToricPedestalGeometry.rotateX(Math.PI / 2); // Rotate to stand upright
        minorToricPedestalGeometry.translate(0, 0.32, 0); // Move up 
        
        const minorToricPedestalMaterial = new THREE.MeshStandardMaterial({
            color: `hsl(25, 10%, 30%)`,
            roughness: 0.5,
            
        });
        
        this.minorToricPedestalMesh = new THREE.Mesh(minorToricPedestalGeometry, minorToricPedestalMaterial);
        this.minorToricPedestalMesh.position.copy(this.position);
        // Start minorToric pedestal at offset Z position for slide animation
        if (Math.abs(this.position.x - gColumnInitialX) < 0.1 && Math.abs(this.position.z - gColumnBaseTargetZ) < 0.1) {
            this.minorToricPedestalMesh.position.z = gColumnBaseStartZ;
        }
        this.minorToricPedestalMesh.position.y = (this.position.y - this.height / 2) + 0.5 * minorToricPedestalHeight + 0.28; // Bottom at y=0
        this.minorToricPedestalMesh.rotation.copy(this.mesh.rotation);
        this.minorToricPedestalMesh.castShadow = true;
        this.minorToricPedestalMesh.receiveShadow = true;
        this.minorToricPedestalMesh.userData.isDraggableCylinder = true;
        this.minorToricPedestalMesh.userData.cylinderObstacle = this;
        gThreeScene.add(this.minorToricPedestalMesh);

        // Create round disc plate to fill between column and pedestal
        const discRadius = this.radius * 1.02; // Larger than column, smaller than pedestal
        const discHeight = 0.2;
        const discGeometry = new THREE.CylinderGeometry(discRadius, discRadius, discHeight, 64);
        discGeometry.translate(0, 0.82, 0); // Move up 
        const discMaterial = new THREE.MeshStandardMaterial({
            color: `hsl(25, 10%, 30%)`,
            roughness: 0.5
        });
        this.discMesh = new THREE.Mesh(discGeometry, discMaterial);
        this.discMesh.position.copy(this.position);
        
        // Start disc at offset Z position for slide animation
        if (Math.abs(this.position.x - gColumnInitialX) < 0.1 && Math.abs(this.position.z - gColumnBaseTargetZ) < 0.1) {
            this.discMesh.position.z = gColumnBaseStartZ;
        }
        this.discMesh.position.y = (this.position.y - this.height / 2) + 1.3; // On top of pedestal
        this.discMesh.rotation.copy(this.mesh.rotation);
        this.discMesh.castShadow = true;
        this.discMesh.receiveShadow = true;
        this.discMesh.userData.isDraggableCylinder = true;
        this.discMesh.userData.cylinderObstacle = this;
        gThreeScene.add(this.discMesh);

        // Create majorToric pedestal
        const majorToricPedestalRadius = this.radius;
        const majorToricPedestalHeight = 3; 
        //const majorToricPedestalGeometry = new THREE.ConeGeometry(majorToricPedestalRadius, majorToricPedestalHeight, 64);
        const majorToricPedestalGeometry = new THREE.TorusGeometry(
            majorToricPedestalRadius, 
            0.55, 
            16, 
            16); 
        majorToricPedestalGeometry.rotateX(Math.PI / 2); // Rotate to stand upright
        majorToricPedestalGeometry.translate(0, -0.5, 0); // Move up 
        
        const majorToricPedestalMaterial = new THREE.MeshStandardMaterial({
            color: `hsl(25, 10%, 30%)`,
            roughness: 0.5,
            
        });
        
        this.majorToricPedestalMesh = new THREE.Mesh(majorToricPedestalGeometry, majorToricPedestalMaterial);
        this.majorToricPedestalMesh.position.copy(this.position);
        // Start majorToric pedestal at offset Z position for slide animation
        if (Math.abs(this.position.x - gColumnInitialX) < 0.1 && Math.abs(this.position.z - gColumnBaseTargetZ) < 0.1) {
            this.majorToricPedestalMesh.position.z = gColumnBaseStartZ;
        }
        this.majorToricPedestalMesh.position.y = (this.position.y - this.height / 2) + 0.5 * majorToricPedestalHeight + 0.28; // Bottom at y=0
        this.majorToricPedestalMesh.rotation.copy(this.mesh.rotation);
        this.majorToricPedestalMesh.castShadow = true;
        this.majorToricPedestalMesh.receiveShadow = true;
        this.majorToricPedestalMesh.userData.isDraggableCylinder = true;
        this.majorToricPedestalMesh.userData.cylinderObstacle = this;
        gThreeScene.add(this.majorToricPedestalMesh);

        // add square pedestal
        const pedestalSize = this.radius * 2.4;
        const pedestalHeight = 1;
        const pedestalGeometry = new THREE.BoxGeometry(pedestalSize, pedestalHeight, pedestalSize);
        const pedestalMaterial = new THREE.MeshStandardMaterial({
            color: `hsl(25, 10%, 40%)`,
            roughness: 0.5
        });
        this.pedestalMesh = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
        this.pedestalMesh.position.copy(this.position);
        // Start pedestal at offset Z position for slide animation
        if (Math.abs(this.position.x - gColumnInitialX) < 0.1 && Math.abs(this.position.z - gColumnBaseTargetZ) < 0.1) {
            this.pedestalMesh.position.z = gColumnBaseStartZ;
        }
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
        
        // Only update visual components if they exist
        if (this.collisionOnly || this.columnSections.length === 0) {
            return;
        }
        
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
        if (this.minorToricPedestalMesh) {
            const minorToricPedestalHeight = 3;
            this.minorToricPedestalMesh.position.set(newPosition.x, bottomY + 0.5 * minorToricPedestalHeight + 0.28, newPosition.z);
        }
        if (this.majorToricPedestalMesh) {
            const majorToricPedestalHeight = 3;
            this.majorToricPedestalMesh.position.set(newPosition.x, bottomY + 0.5 * majorToricPedestalHeight + 0.28, newPosition.z);
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
    constructor(lightPosition, lightTarget, lampId, intensity) {
        this.lampId = lampId;
        this.angle = 0.0; // Start at zero, cone is already oriented correctly
        this.assemblyRotation = 0.0; // Assembly rotation around Y axis
        
        // Create lamp rotatable group
        this.rotatableGroup = new THREE.Group();
        
        // Create spotlight
        this.spotlight = new THREE.SpotLight(0xffffff, intensity);
        this.spotlight.visible = intensity > 0;
        this.spotlight.angle = Math.PI / 4;
        this.spotlight.penumbra = gSpotlightPenumbra;
        this.spotlight.position.copy(lightPosition);
        this.spotlight.castShadow = true;
        this.spotlight.shadow.camera.near = 0.5;
        this.spotlight.shadow.camera.far = gShadowCameraFar;
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

// Helper function to create boid materials based on type
function createBoidMaterial(materialType, hue, sat, light, wireframe) {
    if (materialType === 'standard') {
        return new THREE.MeshStandardMaterial({
            color: new THREE.Color(`hsl(${hue}, ${sat}%, ${light}%)`),
            metalness: 0.5,
            roughness: 0.4,
            wireframe: wireframe
        });
    } else if (materialType === 'phong' || materialType === 'basic') {
        return new THREE.MeshPhongMaterial({
            color: new THREE.Color(`hsl(${hue}, ${sat}%, ${light}%)`),
            shininess: 100,
            wireframe: wireframe
        });
    } else if (materialType === 'normal') {
        return new THREE.MeshNormalMaterial({
            wireframe: wireframe
        });
    } else if (materialType === 'toon') {
        return new THREE.MeshToonMaterial({
            color: new THREE.Color(`hsl(${hue}, ${sat}%, ${light}%)`),
            wireframe: wireframe
        });
    } else if (materialType === 'depth') {
        return new THREE.MeshDepthMaterial({
            wireframe: wireframe
        });
    } else {
        // Fallback to phong
        return new THREE.MeshPhongMaterial({
            color: new THREE.Color(`hsl(${hue}, ${sat}%, ${light}%)`),
            shininess: 100,
            wireframe: wireframe
        });
    }
}

class BOID {
    constructor(pos, rad, vel, hue, sat, light, geometryType) {
        this.pos = pos.clone();
        this.rad = rad;
        this.vel = vel.clone();
        this.hue = hue;
        this.sat = sat;
        this.light = light;
        this.grabbed = false;
        this.spinAngle = 0; // For rotating models like avocado along travel axis
        
        // Determine geometry type from parameter or distribution
        if (geometryType !== undefined) {
            this.geometryType = geometryType;
        } else {
            // No specific type provided, pick from selected types
            if (gSelectedBoidTypes.length > 0) {
                this.geometryType = gSelectedBoidTypes[Math.floor(Math.random() * gSelectedBoidTypes.length)];
            } else {
                this.geometryType = 3; // Default to box if no types selected
            }
        }
        
        // Create front cone mesh
        let material;
        
        // Handle duck and fish geometry specially
        if (this.geometryType === 12 && gDuckTemplate) {
            // Clone duck template for this boid
            this.visMesh = gDuckTemplate.clone();
            this.visMesh.scale.set(0.5, 0.5, 0.5);
            this.visMesh.position.copy(pos);
            this.visMesh.userData = this;
            this.visMesh.castShadow = true;
            this.visMesh.receiveShadow = true;
            
            // Apply material type
            if (boidProps.material !== 'imported') {
                this.visMesh.traverse(function(child) {
                    if (child.isMesh && child.material) {
                        var newMaterial = createBoidMaterial(boidProps.material, hue, sat, light, boidProps.wireframe);
                        if (Array.isArray(child.material)) {
                            child.material = child.material.map(() => newMaterial.clone());
                        } else {
                            child.material = newMaterial;
                        }
                    }
                });
            }
            
            gThreeScene.add(this.visMesh);
        } else if (this.geometryType === 13 && gFishTemplate) {
            // Clone fish template for this boid
            this.visMesh = gFishTemplate.clone();
            this.visMesh.scale.set(0.015, 0.015, 0.015);
            this.visMesh.position.copy(pos);
            this.visMesh.userData = this;
            this.visMesh.castShadow = true;
            this.visMesh.receiveShadow = true;
            
            // Apply material type
            if (boidProps.material !== 'imported') {
                this.visMesh.traverse(function(child) {
                    if (child.isMesh && child.material) {
                        var newMaterial = createBoidMaterial(boidProps.material, hue, sat, light, boidProps.wireframe);
                        if (Array.isArray(child.material)) {
                            child.material = child.material.map(() => newMaterial.clone());
                        } else {
                            child.material = newMaterial;
                        }
                    }
                });
            }
            
            gThreeScene.add(this.visMesh);
        } else if (this.geometryType === 14 && gAvocadoTemplate) {
            // Clone avocado template for this boid
            this.visMesh = gAvocadoTemplate.clone();
            this.visMesh.scale.set(10.0, 10.0, 6.0);
            this.visMesh.position.copy(pos);
            this.visMesh.userData = this;
            this.visMesh.castShadow = true;
            this.visMesh.receiveShadow = true;
            
            // Apply material type
            if (boidProps.material !== 'imported') {
                this.visMesh.traverse(function(child) {
                    if (child.isMesh && child.material) {
                        var newMaterial = createBoidMaterial(boidProps.material, hue, sat, light, boidProps.wireframe);
                        if (Array.isArray(child.material)) {
                            child.material = child.material.map(() => newMaterial.clone());
                        } else {
                            child.material = newMaterial;
                        }
                    }
                });
            }
            
            gThreeScene.add(this.visMesh);
        } else if (this.geometryType === 15 && gHelicopterTemplate) {
            // Clone helicopter template for this boid
            this.visMesh = gHelicopterTemplate.clone();
            this.visMesh.scale.set(1.0, 1.0, 1.0);
            this.visMesh.position.copy(pos);
            this.visMesh.userData = this;
            this.visMesh.castShadow = true;
            this.visMesh.receiveShadow = true;
            // Give each helicopter a random initial rotation
            this.spinAngle = Math.random() * Math.PI * 2;
            
            // Apply material type
            if (boidProps.material !== 'imported') {
                this.visMesh.traverse(function(child) {
                    if (child.isMesh && child.material) {
                        var newMaterial = createBoidMaterial(boidProps.material, hue, sat, light, boidProps.wireframe);
                        if (Array.isArray(child.material)) {
                            child.material = child.material.map(() => newMaterial.clone());
                        } else {
                            child.material = newMaterial;
                        }
                    }
                });
            }
            
            gThreeScene.add(this.visMesh);
        } else if (this.geometryType === 16 && gPaperPlaneTemplate) {
            // Clone paper plane template for this boid
            this.visMesh = gPaperPlaneTemplate.clone();
            this.visMesh.scale.set(0.5, 0.5, 0.5);
            this.visMesh.position.copy(pos);
            this.visMesh.userData = this;
            this.visMesh.castShadow = true;
            this.visMesh.receiveShadow = true;
            
            // Apply material type
            if (boidProps.material !== 'imported') {
                this.visMesh.traverse(function(child) {
                    if (child.isMesh && child.material) {
                        var newMaterial = createBoidMaterial(boidProps.material, hue, sat, light, boidProps.wireframe);
                        if (Array.isArray(child.material)) {
                            child.material = child.material.map(() => newMaterial.clone());
                        } else {
                            child.material = newMaterial;
                        }
                    }
                });
            }
            
            gThreeScene.add(this.visMesh);
        } else if (this.geometryType === 17 && gKoonsDogTemplate) {
            // Clone Koons Dog template for this boid
            this.visMesh = gKoonsDogTemplate.clone();
            this.visMesh.scale.set(0.1, 0.1, 0.1);
            this.visMesh.position.copy(pos);
            this.visMesh.userData = this;
            this.visMesh.castShadow = true;
            this.visMesh.receiveShadow = true;
            
            // Apply material type
            if (boidProps.material !== 'imported') {
                this.visMesh.traverse(function(child) {
                    if (child.isMesh && child.material) {
                        var newMaterial = createBoidMaterial(boidProps.material, hue, sat, light, boidProps.wireframe);
                        if (Array.isArray(child.material)) {
                            child.material = child.material.map(() => newMaterial.clone());
                        } else {
                            child.material = newMaterial;
                        }
                    }
                });
            }
            
            gThreeScene.add(this.visMesh);
        } else {
            // Standard geometry with materials
            // For primitives, if 'imported' is selected, default to 'phong' (plastic)
            var effectiveMaterial = boidProps.material;
            if (effectiveMaterial === 'imported') {
                effectiveMaterial = 'phong';
            }
            
            if (effectiveMaterial === 'standard') {
                material = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(`hsl(${hue}, ${sat}%, ${light}%)`), 
                    metalness: 0.5, 
                    roughness: 0.4, 
                    wireframe: boidProps.wireframe});
            } else if (effectiveMaterial === 'phong') {
                material = new THREE.MeshPhongMaterial({
                    color: new THREE.Color(`hsl(${hue}, ${sat}%, ${light}%)`), 
                    shininess: 100, 
                    shininess: 100, 
                    wireframe: boidProps.wireframe});
            } else if (effectiveMaterial === 'normal') {
                material = new THREE.MeshNormalMaterial({
                    wireframe: boidProps.wireframe});
            } else if (effectiveMaterial === 'toon') {
                material = new THREE.MeshToonMaterial({
                    color: new THREE.Color(`hsl(${hue}, ${sat}%, ${light}%)`), 
                    shininess: 100, 
                    wireframe: boidProps.wireframe});
            } else if (effectiveMaterial === 'depth') {
                material = new THREE.MeshDepthMaterial({
                    wireframe: boidProps.wireframe});
            } else {
                material = new THREE.MeshBasicMaterial({
                    color: new THREE.Color(`hsl(${hue}, ${sat}%, ${light}%)`), 
                    shininess: 100, 
                    wireframe: boidProps.wireframe});
            }
            
            // Create geometry based on this.geometryType
            var geometry;
            if (this.geometryType === 0) {
                geometry = new THREE.SphereGeometry(rad, geometrySegments, geometrySegments);
            } else if (this.geometryType === 1) {
                geometry = new THREE.ConeGeometry(rad, 3 * rad, geometrySegments, 1);
            } else if (this.geometryType === 2) {
                geometry = new THREE.CylinderGeometry(rad, rad, 3 * rad, geometrySegments);
            } else if (this.geometryType === 3) {
                geometry = new THREE.BoxGeometry(2 * rad, 2 * rad, 2 * rad);
            } else if (this.geometryType === 4) {
                geometry = new THREE.TetrahedronGeometry(rad * 1.5);
            } else if (this.geometryType === 5) {
                geometry = new THREE.OctahedronGeometry(rad * 1.5);
            } else if (this.geometryType === 6) {
                geometry = new THREE.DodecahedronGeometry(rad * 1.5);
            } else if (this.geometryType === 7) {
                geometry = new THREE.IcosahedronGeometry(rad * 1.5);
            } else if (this.geometryType === 8) {
                geometry = new THREE.CapsuleGeometry(rad * 0.5, 2 * rad, 4, geometrySegments);
            } else if (this.geometryType === 9) {
                geometry = new THREE.TorusGeometry(rad, rad * 0.4, geometrySegments, geometrySegments);
            } else if (this.geometryType === 10) {
                geometry = new THREE.TorusKnotGeometry(rad, rad * 0.3, geometrySegments * 4, geometrySegments);
            } else if (this.geometryType === 11) {
                geometry = new THREE.PlaneGeometry(2 * rad, 3 * rad, 1, 1);
            } else {
                // Default to cone
                geometry = new THREE.ConeGeometry(rad, 3 * rad, geometrySegments, 1);
            }
            
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
    
    updateOrientation() {
        // Update visual orientation based on velocity vector
        const speed = Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y + this.vel.z * this.vel.z);
        if (speed > 0.01) { // Only update orientation if has meaningful velocity
            const direction = new THREE.Vector3(this.vel.x, this.vel.y, this.vel.z).normalize();
            const up = new THREE.Vector3(0, 1, 0);
            
            // Create target point in direction of velocity
            const target = new THREE.Vector3(
                this.pos.x + direction.x,
                this.pos.y + direction.y,
                this.pos.z + direction.z
            );
            
            // Make mesh look at target (skip for helicopters, paper planes, and Koons Dogs which handle their own rotation)
            if (this.geometryType !== 15 && this.geometryType !== 16 && this.geometryType !== 17) {
                this.visMesh.lookAt(target);
            }
            // Adjust for default orientation based on geometry type
            if (this.geometryType === 1 || this.geometryType === 2 || this.geometryType === 8) {
                this.visMesh.rotateX(Math.PI / 2);
            } else if (this.geometryType === 4) {
                this.visMesh.rotateX(-Math.PI / 4);
                this.visMesh.rotateY(-Math.PI / 4);
                this.visMesh.rotateZ(-Math.PI / 2);
            } else if (this.geometryType === 5) {
                this.visMesh.rotateX(Math.PI / 2);
            } else if (this.geometryType === 11) {
                this.visMesh.rotateX(Math.PI / 2);
            } else if (this.geometryType === 10) {
                // TorusKnot - rotate continuously like avocado
                this.visMesh.rotateZ(this.spinAngle || 0);
            } else if (this.geometryType === 12) {
                this.visMesh.rotateY(-Math.PI / 2);
            } else if (this.geometryType === 14) {
                // Avocado - orient upside-down with spin
                this.visMesh.rotateX(-Math.PI / 2);
                this.visMesh.rotateY(this.spinAngle || 0);
            } else if (this.geometryType === 15) {
                // Helicopter - calculate horizontal direction
                const horizDir = new THREE.Vector3(direction.x, 0, direction.z);
                const horizSpeed = horizDir.length();
                
                if (horizSpeed > 0.01) {
                    horizDir.normalize();
                    const yaw = Math.atan2(horizDir.x, horizDir.z);
                    this.visMesh.rotation.y = yaw + (this.spinAngle || 0);
                    const pitchAmount = Math.min(horizSpeed / boidProps.maxSpeed, 1.0) * 0.35;
                    this.visMesh.rotation.x = -pitchAmount;
                    
                    // Add roll based on turning
                    if (this.lastHorizDir) {
                        const turnDir = new THREE.Vector3().crossVectors(this.lastHorizDir, horizDir);
                        const turnAmount = turnDir.y * 3.0;
                        this.visMesh.rotation.z = Math.max(-0.5, Math.min(0.5, turnAmount));
                    }
                } else {
                    this.visMesh.rotation.y = this.spinAngle || 0;
                    this.visMesh.rotation.x = 0;
                    this.visMesh.rotation.z = 0;
                }
            } else if (this.geometryType === 16) {
                // Paper plane - calculate direction and orient
                const speed = direction.length();
                
                if (speed > 0.01) {
                    // Calculate yaw (horizontal rotation)
                    const yaw = Math.atan2(direction.x, direction.z);
                    // Calculate pitch (vertical angle)
                    const pitch = Math.asin(direction.y / speed);
                    
                    // Apply rotations: model points along +Z by default
                    this.visMesh.rotation.y = yaw;
                    this.visMesh.rotation.x = -pitch;
                    this.visMesh.rotation.z = 0;
                } else {
                    this.visMesh.rotation.x = 0;
                    this.visMesh.rotation.y = 0;
                    this.visMesh.rotation.z = 0;
                }
            } else if (this.geometryType === 17) {
                // Koons Dog - calculate direction and orient (model points along +Z axis)
                const speed = direction.length();
                
                if (speed > 0.01) {
                    // Calculate yaw (horizontal rotation)
                    const yaw = Math.atan2(direction.x, direction.z);
                    // Calculate pitch (vertical angle)
                    const pitch = Math.asin(direction.y / speed);
                    
                    // Apply rotations: model points along +Z by default
                    this.visMesh.rotation.y = yaw;
                    this.visMesh.rotation.x = -pitch;
                    this.visMesh.rotation.z = 0;
                } else {
                    this.visMesh.rotation.x = 0;
                    this.visMesh.rotation.y = 0;
                    this.visMesh.rotation.z = 0;
                }
            }
        }
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
        
        // Update spin angles for animated boids (torus knot, avocado and helicopter)
        if (this.geometryType === 10) {
            // TorusKnot - update spin angle
            this.spinAngle += 2.0 * deltaT;
        } else if (this.geometryType === 14) {
            // Avocado - update spin angle
            this.spinAngle += 2.0 * deltaT;
        } else if (this.geometryType === 15) {
            // Helicopter - update rotor spin angle
            this.spinAngle += 10.0 * deltaT;
            
            // Store horizontal direction for turning calculations
            const speed = Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y + this.vel.z * this.vel.z);
            if (speed > 0.01) {
                const direction = new THREE.Vector3(this.vel.x, this.vel.y, this.vel.z).normalize();
                const horizDir = new THREE.Vector3(direction.x, 0, direction.z);
                const horizSpeed = horizDir.length();
                
                if (horizSpeed > 0.01) {
                    horizDir.normalize();
                    this.lastHorizDir = horizDir.clone();
                }
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
            hue = Math.round(180 + (2 * (-0.5 + Math.random())) * 20);
            sat = 0; 
            light = 100; 
        } else if (i < 151) {
            hue = Math.round(180 + (2 * (-0.5 + Math.random())) * 20);
            sat = gBoidSaturation; 
            light = gBoidLightness; 
        } else {
            hue = Math.round(360 + (2 * (-0.5 + Math.random())) * 20);
            sat = gBoidSaturation; 
            light = gBoidLightness; 
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
        if (gObstacles[i].enabled) {
            gObstacles[i].applyAvoidance(boid);
        }
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
    // Always update orientations so paused boids show correct facing
    for (var i = 0; i < gPhysicsScene.objects.length; i++) {
        var boid = gPhysicsScene.objects[i];
        boid.updateOrientation();
    }
    
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
                color = new THREE.Color(`hsl(${boid.hue}, 50%, 50%)`);
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
    // Distribute types evenly across all boids
    const numBoids = gPhysicsScene.objects.length;
    const numTypes = gSelectedBoidTypes.length;
    
    // Recreate geometry for all boids
    for (let i = 0; i < numBoids; i++) {
        const boid = gPhysicsScene.objects[i];
        
        // Assign geometry type based on even distribution
        boid.geometryType = gSelectedBoidTypes[i % numTypes];
        
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
        
        // Create new geometry based on boid's assigned type
        let geometry;
        var siding = 'THREE.FrontSide';
        const rad = boid.rad;
        
        switch (boid.geometryType) {
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
        if (boid.geometryType === 12 && gDuckTemplate) {
            // For duck geometry, clone the duck template
            boid.visMesh = gDuckTemplate.clone();
            boid.visMesh.scale.set(0.3, 0.3, 0.3); // Scale down for boid size
            
            // Set position and add to scene
            boid.visMesh.position.copy(boid.pos);
            boid.visMesh.castShadow = true;
            boid.visMesh.receiveShadow = true;
            
            // Apply material type
            if (boidProps.material !== 'imported') {
                // Create new material based on boidProps.material type
                boid.visMesh.traverse(function(child) {
                    if (child.isMesh && child.material) {
                        var newMaterial = createBoidMaterial(boidProps.material, boid.hue, boid.sat, boid.light, boidProps.wireframe);
                        if (Array.isArray(child.material)) {
                            child.material = child.material.map(() => newMaterial.clone());
                        } else {
                            child.material = newMaterial;
                        }
                    }
                });
            }
            // For 'imported' mode, materials are preserved as-is from template clone
            
            gThreeScene.add(boid.visMesh);
            continue; // Skip standard material creation
        } else if (boid.geometryType === 13 && gFishTemplate) {
            // For fish geometry, clone the fish template
            boid.visMesh = gFishTemplate.clone();
            boid.visMesh.scale.set(0.15, 0.15, 0.15); // Scale down for boid size
            
            // Set position and add to scene
            boid.visMesh.position.copy(boid.pos);
            boid.visMesh.castShadow = true;
            boid.visMesh.receiveShadow = true;
            
            // Apply material type
            if (boidProps.material !== 'imported') {
                // Create new material based on boidProps.material type
                boid.visMesh.traverse(function(child) {
                    if (child.isMesh && child.material) {
                        var newMaterial = createBoidMaterial(boidProps.material, boid.hue, boid.sat, boid.light, boidProps.wireframe);
                        if (Array.isArray(child.material)) {
                            child.material = child.material.map(() => newMaterial.clone());
                        } else {
                            child.material = newMaterial;
                        }
                    }
                });
            }
            // For 'imported' mode, materials are preserved as-is from template clone
            
            gThreeScene.add(boid.visMesh);
            continue; // Skip standard material creation
        } else if (boid.geometryType === 14 && gAvocadoTemplate) {
            // For avocado geometry, clone the avocado template
            boid.visMesh = gAvocadoTemplate.clone();
            boid.visMesh.scale.set(12.0, 12.0, 12.0); // Scale down for boid size
            
            // Set position and add to scene
            boid.visMesh.position.copy(boid.pos);
            boid.visMesh.castShadow = true;
            boid.visMesh.receiveShadow = true;
            
            // Apply material type
            if (boidProps.material !== 'imported') {
                // Create new material based on boidProps.material type
                boid.visMesh.traverse(function(child) {
                    if (child.isMesh && child.material) {
                        var newMaterial = createBoidMaterial(boidProps.material, boid.hue, boid.sat, boid.light, boidProps.wireframe);
                        if (Array.isArray(child.material)) {
                            child.material = child.material.map(() => newMaterial.clone());
                        } else {
                            child.material = newMaterial;
                        }
                    }
                });
            }
            // For 'imported' mode, materials are preserved as-is from template clone
            
            gThreeScene.add(boid.visMesh);
            continue; // Skip standard material creation
        } else if (boid.geometryType === 15 && gHelicopterTemplate) {
            // For helicopter geometry, clone the helicopter template
            boid.visMesh = gHelicopterTemplate.clone();
            boid.visMesh.scale.set(1.0, 1.0, 1.0); // Scale for boid size
            
            // Set position and add to scene
            boid.visMesh.position.copy(boid.pos);
            boid.visMesh.castShadow = true;
            boid.visMesh.receiveShadow = true;
            // Give each helicopter a random initial rotation
            boid.spinAngle = Math.random() * Math.PI * 2;
            
            // Apply material type
            if (boidProps.material !== 'imported') {
                // Create new material based on boidProps.material type
                boid.visMesh.traverse(function(child) {
                    if (child.isMesh && child.material) {
                        var newMaterial = createBoidMaterial(boidProps.material, boid.hue, boid.sat, boid.light, boidProps.wireframe);
                        if (Array.isArray(child.material)) {
                            child.material = child.material.map(() => newMaterial.clone());
                        } else {
                            child.material = newMaterial;
                        }
                    }
                });
            }
            // For 'imported' mode, materials are preserved as-is from template clone
            
            gThreeScene.add(boid.visMesh);
            continue; // Skip standard material creation
        } else if (boid.geometryType === 16 && gPaperPlaneTemplate) {
            // For paper plane geometry, clone the paper plane template
            boid.visMesh = gPaperPlaneTemplate.clone();
            boid.visMesh.scale.set(0.2, 0.2, 0.2); // Scale for boid size
            
            // Set position and add to scene
            boid.visMesh.position.copy(boid.pos);
            boid.visMesh.castShadow = true;
            boid.visMesh.receiveShadow = true;
            
            // Apply material type
            if (boidProps.material !== 'imported') {
                // Create new material based on boidProps.material type
                boid.visMesh.traverse(function(child) {
                    if (child.isMesh && child.material) {
                        var newMaterial = createBoidMaterial(boidProps.material, boid.hue, boid.sat, boid.light, boidProps.wireframe);
                        if (Array.isArray(child.material)) {
                            child.material = child.material.map(() => newMaterial.clone());
                        } else {
                            child.material = newMaterial;
                        }
                    }
                });
            }
            // For 'imported' mode, materials are preserved as-is from template clone
            
            gThreeScene.add(boid.visMesh);
            continue; // Skip standard material creation
        } else if (boid.geometryType === 17 && gKoonsDogTemplate) {
            // For Koons Dog geometry, clone Koons Dog template
            boid.visMesh = gKoonsDogTemplate.clone();
            boid.visMesh.scale.set(0.1, 0.1, 0.1); // Scale for boid size
            
            // Set position and add to scene
            boid.visMesh.position.copy(boid.pos);
            boid.visMesh.castShadow = true;
            boid.visMesh.receiveShadow = true;
            
            // Apply material type
            if (boidProps.material !== 'imported') {
                // Create new material based on boidProps.material type
                boid.visMesh.traverse(function(child) {
                    if (child.isMesh && child.material) {
                        var newMaterial = createBoidMaterial(boidProps.material, boid.hue, boid.sat, boid.light, boidProps.wireframe);
                        if (Array.isArray(child.material)) {
                            child.material = child.material.map(() => newMaterial.clone());
                        } else {
                            child.material = newMaterial;
                        }
                    }
                });
            }
            // For 'imported' mode, materials are preserved as-is from template clone
            
            gThreeScene.add(boid.visMesh);
            continue; // Skip standard material creation
        } else if (boid.geometryType != 11 && boid.geometryType != 12 && boid.geometryType != 13 && boid.geometryType != 14 && boid.geometryType != 15 && boid.geometryType != 16 && boid.geometryType != 17) {
            // For primitives, if 'imported' is selected, default to 'phong' (plastic)
            var effectiveMaterial = boidProps.material;
            if (effectiveMaterial === 'imported') {
                effectiveMaterial = 'phong';
            }
            
            if (effectiveMaterial === 'standard') {
                material = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(`hsl(${boid.hue}, ${boid.sat}%, ${boid.light}%)`), 
                    metalness: 0.5, 
                    roughness: 0.4, 
                    wireframe: boidProps.wireframe});
            } else if (effectiveMaterial === 'phong') {
                material = new THREE.MeshPhongMaterial({
                    color: new THREE.Color(`hsl(${boid.hue}, ${boid.sat}%, ${boid.light}%)`), 
                    shininess: 100, 
                    wireframe: boidProps.wireframe});
            } else if (effectiveMaterial === 'normal') {
                material = new THREE.MeshNormalMaterial({
                    wireframe: boidProps.wireframe});
            } else if (effectiveMaterial === 'toon') {
                material = new THREE.MeshToonMaterial({
                    color: new THREE.Color(`hsl(${boid.hue}, ${boid.sat}%, ${boid.light}%)`), 
                    wireframe: boidProps.wireframe});
            } else if (effectiveMaterial === 'depth') {
                material = new THREE.MeshDepthMaterial({
                    wireframe: boidProps.wireframe});
            } else {
                material = new THREE.MeshBasicMaterial({
                    color: new THREE.Color(`hsl(${boid.hue}, ${boid.sat}%, ${boid.light}%)`), 
                    wireframe: boidProps.wireframe});
            } 
        } else {
            // For primitives, if 'imported' is selected, default to 'phong' (plastic)
            var effectiveMaterial = boidProps.material;
            if (effectiveMaterial === 'imported') {
                effectiveMaterial = 'phong';
            }
            
            if (effectiveMaterial === 'standard') {
                material = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(`hsl(${boid.hue}, ${boid.sat}%, ${boid.light}%)`), 
                    metalness: 0.5, 
                    roughness: 0.4, 
                    wireframe: boidProps.wireframe,
                    side: THREE.DoubleSide});
            } else if (effectiveMaterial === 'phong') {
                material = new THREE.MeshPhongMaterial({
                    color: new THREE.Color(`hsl(${boid.hue}, ${boid.sat}%, ${boid.light}%)`), 
                    shininess: 100, 
                    wireframe: boidProps.wireframe,
                    side: THREE.DoubleSide});
            } else if (effectiveMaterial === 'normal') {
                material = new THREE.MeshNormalMaterial({
                    wireframe: boidProps.wireframe, 
                    side: THREE.DoubleSide});
            } else if (effectiveMaterial === 'toon') {
                material = new THREE.MeshToonMaterial({
                    color: new THREE.Color(`hsl(${boid.hue}, ${boid.sat}%, ${boid.light}%)`), 
                    wireframe: boidProps.wireframe,
                    side: THREE.DoubleSide});
            } else if (effectiveMaterial === 'depth') {
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

function recreateBoschTriptych(newScale) {
    if (!gBoschPaintingGroup) return;
    
    // Store current position and state
    var currentY = gBoschPaintingGroup.position.y;
    var currentX = gBoschPaintingGroup.position.x;
    var currentZ = gBoschPaintingGroup.position.z;
    var currentRotation = gBoschPaintingGroup.rotation.y;
    
    // Remove old triptych
    while(gBoschPaintingGroup.children.length > 0) {
        var child = gBoschPaintingGroup.children[0];
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
            if (child.material.map) child.material.map.dispose();
            if (child.material.emissiveMap) child.material.emissiveMap.dispose();
            child.material.dispose();
        }
        gBoschPaintingGroup.remove(child);
    }
    
    // Update scale
    gBoschTriptychScale = newScale;
    var boschPanelHeight = gBoschPanelHeight * gBoschTriptychScale;
    var boschLeftWidth = 5.3 * gBoschTriptychScale;
    var boschCenterWidth = 10.6 * gBoschTriptychScale;
    var boschRightWidth = 5.3 * gBoschTriptychScale;
    
    // Recreate frame material
    var frameMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x5a3a1a,
        metalness: 0.1,
        roughness: 0.7
    });
    var frameThickness = 0.3;
    var frameDepth = 0.15;
    
    // Left Panel
    var boschLeftPaintingMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x000000,
        side: THREE.FrontSide,
        shadowSide: THREE.FrontSide,
        emissive: 0x000000,
        emissiveIntensity: 0,
        metalness: 0,
        roughness: 1,
        transparent: true,
        opacity: 1
    });
    
    var boschLeftPainting = new THREE.Mesh(
        new THREE.PlaneGeometry(boschLeftWidth, boschPanelHeight),
        boschLeftPaintingMaterial
    );
    boschLeftPainting.position.set(0, 0, -frameDepth / 2);
    boschLeftPainting.receiveShadow = true;
    boschLeftPainting.castShadow = true;
    gBoschPaintingGroup.add(boschLeftPainting);
    
    var boschLeftFrameTop = new THREE.Mesh(
        new THREE.BoxGeometry(boschLeftWidth + frameThickness * 1.5, frameThickness, frameDepth),
        frameMaterial
    );
    boschLeftFrameTop.position.set(0, boschPanelHeight / 2 + frameThickness / 2, -frameDepth / 2);
    boschLeftFrameTop.castShadow = true;
    boschLeftFrameTop.receiveShadow = true;
    gBoschPaintingGroup.add(boschLeftFrameTop);
    
    var boschLeftFrameBottom = new THREE.Mesh(
        new THREE.BoxGeometry(boschLeftWidth + frameThickness * 1.5, frameThickness, frameDepth),
        frameMaterial
    );
    boschLeftFrameBottom.position.set(0, -boschPanelHeight / 2 - frameThickness / 2, -frameDepth / 2);
    boschLeftFrameBottom.castShadow = true;
    boschLeftFrameBottom.receiveShadow = true;
    gBoschPaintingGroup.add(boschLeftFrameBottom);
    
    var boschLeftFrameLeft = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness, boschPanelHeight, frameDepth),
        frameMaterial
    );
    boschLeftFrameLeft.position.set(-boschLeftWidth / 2 - frameThickness / 2, 0, -frameDepth / 2);
    boschLeftFrameLeft.castShadow = true;
    boschLeftFrameLeft.receiveShadow = true;
    gBoschPaintingGroup.add(boschLeftFrameLeft);
    
    var boschLeftFrameRight = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness / 2, boschPanelHeight, frameDepth),
        frameMaterial
    );
    boschLeftFrameRight.position.set(boschLeftWidth / 2 + frameThickness / 4, 0, -frameDepth / 2);
    boschLeftFrameRight.castShadow = true;
    boschLeftFrameRight.receiveShadow = true;
    gBoschPaintingGroup.add(boschLeftFrameRight);
    
    // Center Panel
    var boschCenterPaintingMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x000000,
        side: THREE.FrontSide,
        shadowSide: THREE.FrontSide,
        emissive: 0x000000,
        emissiveIntensity: 0,
        metalness: 0,
        roughness: 1,
        transparent: true,
        opacity: 1
    });
    
    var boschCenterPainting = new THREE.Mesh(
        new THREE.PlaneGeometry(boschCenterWidth, boschPanelHeight),
        boschCenterPaintingMaterial
    );
    boschCenterPainting.position.set(0, 0, -frameDepth / 2);
    boschCenterPainting.receiveShadow = true;
    boschCenterPainting.castShadow = true;
    gBoschPaintingGroup.add(boschCenterPainting);
    
    var boschCenterFrameTop = new THREE.Mesh(
        new THREE.BoxGeometry(boschCenterWidth + frameThickness, frameThickness, frameDepth),
        frameMaterial
    );
    boschCenterFrameTop.position.set(0, boschPanelHeight / 2 + frameThickness / 2, -frameDepth / 2);
    boschCenterFrameTop.castShadow = true;
    boschCenterFrameTop.receiveShadow = true;
    gBoschPaintingGroup.add(boschCenterFrameTop);
    
    var boschCenterFrameBottom = new THREE.Mesh(
        new THREE.BoxGeometry(boschCenterWidth + frameThickness, frameThickness, frameDepth),
        frameMaterial
    );
    boschCenterFrameBottom.position.set(0, -boschPanelHeight / 2 - frameThickness / 2, -frameDepth / 2);
    boschCenterFrameBottom.castShadow = true;
    boschCenterFrameBottom.receiveShadow = true;
    gBoschPaintingGroup.add(boschCenterFrameBottom);
    
    var boschCenterFrameLeft = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness / 2, boschPanelHeight, frameDepth),
        frameMaterial
    );
    boschCenterFrameLeft.position.set(-boschCenterWidth / 2 - frameThickness / 4, 0, -frameDepth / 2);
    boschCenterFrameLeft.castShadow = true;
    boschCenterFrameLeft.receiveShadow = true;
    gBoschPaintingGroup.add(boschCenterFrameLeft);
    
    var boschCenterFrameRight = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness / 2, boschPanelHeight, frameDepth),
        frameMaterial
    );
    boschCenterFrameRight.position.set(boschCenterWidth / 2 + frameThickness / 4, 0, -frameDepth / 2);
    boschCenterFrameRight.castShadow = true;
    boschCenterFrameRight.receiveShadow = true;
    gBoschPaintingGroup.add(boschCenterFrameRight);
    
    // Right Panel
    var boschRightPaintingMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x000000,
        side: THREE.FrontSide,
        shadowSide: THREE.FrontSide,
        emissive: 0x000000,
        emissiveIntensity: 0,
        metalness: 0,
        roughness: 1,
        transparent: true,
        opacity: 1
    });
    
    var boschRightPainting = new THREE.Mesh(
        new THREE.PlaneGeometry(boschRightWidth, boschPanelHeight),
        boschRightPaintingMaterial
    );
    boschRightPainting.position.set(0, 0, -frameDepth / 2);
    boschRightPainting.receiveShadow = true;
    boschRightPainting.castShadow = true;
    gBoschPaintingGroup.add(boschRightPainting);
    
    var boschRightFrameTop = new THREE.Mesh(
        new THREE.BoxGeometry(boschRightWidth + frameThickness * 1.5, frameThickness, frameDepth),
        frameMaterial
    );
    boschRightFrameTop.position.set(0, boschPanelHeight / 2 + frameThickness / 2, -frameDepth / 2);
    boschRightFrameTop.castShadow = true;
    boschRightFrameTop.receiveShadow = true;
    gBoschPaintingGroup.add(boschRightFrameTop);
    
    var boschRightFrameBottom = new THREE.Mesh(
        new THREE.BoxGeometry(boschRightWidth + frameThickness * 1.5, frameThickness, frameDepth),
        frameMaterial
    );
    boschRightFrameBottom.position.set(0, -boschPanelHeight / 2 - frameThickness / 2, -frameDepth / 2);
    boschRightFrameBottom.castShadow = true;
    boschRightFrameBottom.receiveShadow = true;
    gBoschPaintingGroup.add(boschRightFrameBottom);
    
    var boschRightFrameLeft = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness / 2, boschPanelHeight, frameDepth),
        frameMaterial
    );
    boschRightFrameLeft.position.set(-boschRightWidth / 2 - frameThickness / 4, 0, -frameDepth / 2);
    boschRightFrameLeft.castShadow = true;
    boschRightFrameLeft.receiveShadow = true;
    gBoschPaintingGroup.add(boschRightFrameLeft);
    
    var boschRightFrameRight = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness, boschPanelHeight, frameDepth),
        frameMaterial
    );
    boschRightFrameRight.position.set(boschRightWidth / 2 + frameThickness / 2, 0, -frameDepth / 2);
    boschRightFrameRight.castShadow = true;
    boschRightFrameRight.receiveShadow = true;
    gBoschPaintingGroup.add(boschRightFrameRight);
    
    // Update positions function
    function updateBoschPanelPositionsLocal() {
        var gapSize = 0.12;
        var leftX = -(boschCenterWidth / 2 + frameThickness / 2 + boschLeftWidth / 2 + gapSize);
        var centerX = 0;
        var rightX = boschCenterWidth / 2 + frameThickness / 2 + boschRightWidth / 2 + gapSize;
        
        boschLeftPainting.position.x = leftX;
        boschLeftFrameTop.position.x = leftX - frameThickness / 4;
        boschLeftFrameBottom.position.x = leftX - frameThickness / 4;
        boschLeftFrameLeft.position.x = leftX - boschLeftWidth / 2 - frameThickness / 2;
        boschLeftFrameRight.position.x = leftX + boschLeftWidth / 2 + frameThickness / 4;
        
        boschCenterPainting.position.x = centerX;
        boschCenterFrameTop.position.x = centerX;
        boschCenterFrameBottom.position.x = centerX;
        boschCenterFrameLeft.position.x = centerX - boschCenterWidth / 2 - frameThickness / 4;
        boschCenterFrameRight.position.x = centerX + boschCenterWidth / 2 + frameThickness / 4;
        
        boschRightPainting.position.x = rightX;
        boschRightFrameTop.position.x = rightX + frameThickness / 4;
        boschRightFrameBottom.position.x = rightX + frameThickness / 4;
        boschRightFrameLeft.position.x = rightX - boschRightWidth / 2 - frameThickness / 4;
        boschRightFrameRight.position.x = rightX + boschRightWidth / 2 + frameThickness / 2;
    }
    
    // Load textures
    new THREE.TextureLoader().load(
        'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/Bosch_GED_leftPanel_small.jpg',
        function(texture) {
            var aspectRatio = texture.image.width / texture.image.height;
            boschLeftWidth = boschPanelHeight * aspectRatio;
            
            boschLeftPainting.geometry.dispose();
            boschLeftPainting.geometry = new THREE.PlaneGeometry(boschLeftWidth, boschPanelHeight);
            boschLeftFrameTop.geometry.dispose();
            boschLeftFrameTop.geometry = new THREE.BoxGeometry(boschLeftWidth + frameThickness * 1.5, frameThickness, frameDepth);
            boschLeftFrameBottom.geometry.dispose();
            boschLeftFrameBottom.geometry = new THREE.BoxGeometry(boschLeftWidth + frameThickness * 1.5, frameThickness, frameDepth);
            
            boschLeftPaintingMaterial.map = texture;
            boschLeftPaintingMaterial.emissiveMap = texture;
            boschLeftPaintingMaterial.color.setHex(0xffffff);
            boschLeftPaintingMaterial.emissive.setHex(0xffffff);
            boschLeftPaintingMaterial.emissiveIntensity = 0.3;
            boschLeftPaintingMaterial.needsUpdate = true;
            
            updateBoschPanelPositionsLocal();
        }
    );
    
    new THREE.TextureLoader().load(
        'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/Bosch_GED_centerPanel_small.jpg',
        function(texture) {
            var aspectRatio = texture.image.width / texture.image.height;
            boschCenterWidth = boschPanelHeight * aspectRatio;
            
            boschCenterPainting.geometry.dispose();
            boschCenterPainting.geometry = new THREE.PlaneGeometry(boschCenterWidth, boschPanelHeight);
            boschCenterFrameTop.geometry.dispose();
            boschCenterFrameTop.geometry = new THREE.BoxGeometry(boschCenterWidth + frameThickness, frameThickness, frameDepth);
            boschCenterFrameBottom.geometry.dispose();
            boschCenterFrameBottom.geometry = new THREE.BoxGeometry(boschCenterWidth + frameThickness, frameThickness, frameDepth);
            
            boschCenterPaintingMaterial.map = texture;
            boschCenterPaintingMaterial.emissiveMap = texture;
            boschCenterPaintingMaterial.color.setHex(0xffffff);
            boschCenterPaintingMaterial.emissive.setHex(0xffffff);
            boschCenterPaintingMaterial.emissiveIntensity = 0.3;
            boschCenterPaintingMaterial.needsUpdate = true;
            
            updateBoschPanelPositionsLocal();
        }
    );
    
    new THREE.TextureLoader().load(
        'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/Bosch_GED_rightPanel_small.jpg',
        function(texture) {
            var aspectRatio = texture.image.width / texture.image.height;
            boschRightWidth = boschPanelHeight * aspectRatio;
            
            boschRightPainting.geometry.dispose();
            boschRightPainting.geometry = new THREE.PlaneGeometry(boschRightWidth, boschPanelHeight);
            boschRightFrameTop.geometry.dispose();
            boschRightFrameTop.geometry = new THREE.BoxGeometry(boschRightWidth + frameThickness * 1.5, frameThickness, frameDepth);
            boschRightFrameBottom.geometry.dispose();
            boschRightFrameBottom.geometry = new THREE.BoxGeometry(boschRightWidth + frameThickness * 1.5, frameThickness, frameDepth);
            
            boschRightPaintingMaterial.map = texture;
            boschRightPaintingMaterial.emissiveMap = texture;
            boschRightPaintingMaterial.color.setHex(0xffffff);
            boschRightPaintingMaterial.emissive.setHex(0xffffff);
            boschRightPaintingMaterial.emissiveIntensity = 0.3;
            boschRightPaintingMaterial.needsUpdate = true;
            
            updateBoschPanelPositionsLocal();
        }
    );
    
    updateBoschPanelPositionsLocal();
    
    // Restore position with adjusted Y to keep bottom at constant height
    // Use the stored bottom height reference
    var newY = gBoschBottomHeight + (gBoschPanelHeight * gBoschTriptychScale / 2);
    gBoschPaintingGroup.position.set(currentX, newY, currentZ);
    gBoschPaintingGroup.rotation.y = currentRotation;
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

    // Draw Camera menu item
    const itemY2 = itemY + itemHeight + padding;
    ctx.beginPath();
    ctx.roundRect(itemX, itemY2, itemWidth, itemHeight, cornerRadius * 0.5);
    
    // Background color varies by camera mode
    const cameraBackgroundColors = [
        'hsla(100, 35%, 30%, 0.80)',   // Mode 0: Rotate CW - dark green
        'hsla(150, 40%, 30%, 0.80)',   // Mode 1: Rotate CCW - dark blue
        'hsla(0, 80%, 30%, 0.3)',   // Mode 2: Static - dark red
        'hsla(270, 20%, 30%, 0.80)',   // Mode 3: Behind boid - dark purple
        'hsla(300, 30%, 30%, 0.80)',   // Mode 4: In front of boid - dark gold
        'hsla(40, 50%, 30%, 0.80)'     // Mode 5: Walking - dark orange
    ];
    ctx.fillStyle = cameraBackgroundColors[gCameraMode];
    ctx.fill();
    
    // Draw camera or eye icon depending on camera mode
    const icon2X = itemX + 0.5 * itemWidth;
    const icon2Y = itemY2 + 0.6 * itemHeight;
    
    ctx.save();
    ctx.translate(icon2X, icon2Y);
    
    if (gCameraMode === 5) {
        // Draw stick figure for walking mode
        const figureSize = iconSize * 1.5;
        const yOffset = -0.10; // Move figure up
        ctx.strokeStyle = 'rgba(120, 120, 120, 1.0)';
        ctx.fillStyle = 'rgba(96, 96, 96, 1.0)';
        ctx.lineWidth = figureSize * 0.08;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Head
        const headRadius = figureSize * 0.15;
        ctx.beginPath();
        ctx.arc(0, figureSize * (-0.35 + yOffset), headRadius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        
        // Body (vertical line)
        ctx.beginPath();
        ctx.moveTo(0, figureSize * (-0.35 + yOffset) + headRadius);
        ctx.lineTo(0, figureSize * (0.1 + yOffset));
        ctx.stroke();
        
        // Arms (angled outward)
        ctx.beginPath();
        ctx.moveTo(-figureSize * 0.35, figureSize * (-0.05 + yOffset));
        ctx.lineTo(0, figureSize * (-0.1 + yOffset));
        ctx.lineTo(figureSize * 0.35, figureSize * (-0.05 + yOffset));
        ctx.stroke();
        
        // Left leg
        ctx.beginPath();
        ctx.moveTo(0, figureSize * (0.1 + yOffset));
        ctx.lineTo(-figureSize * 0.15, figureSize * (0.45 + yOffset));
        ctx.stroke();
        
        // Right leg
        ctx.beginPath();
        ctx.moveTo(0, figureSize * (0.1 + yOffset));
        ctx.lineTo(figureSize * 0.15, figureSize * (0.45 + yOffset));
        ctx.stroke();
    } else if (gCameraMode == 0 || gCameraMode == 1 || gCameraMode == 2) {
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
        
        // Determine rotation based on camera mode (cache time calculation)
        const time = (gCameraMode !== 2) ? (performance.now() * 0.001) : 0;
        const rotationSign = (gCameraMode === 0) ? -1 : (gCameraMode === 1) ? 1 : 0;
        
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

    // Draw Simulation menu item
    const itemY3 = itemY2 + itemHeight + padding;
    ctx.beginPath();
    ctx.roundRect(itemX, itemY3, itemWidth, itemHeight, cornerRadius * 0.5);
    ctx.fillStyle = menuVisible ? 'rgba(100, 150, 220, 0.3)' : 'rgba(38, 38, 38, 0.8)';
    ctx.fill();
    
    // Draw icon
    const icon3X = itemX + itemWidth / 2;
    const icon3Y = itemY3 + itemHeight / 2;
    const icon3Color = menuVisible ? 'rgba(230, 230, 230, 1.0)' : 'rgba(76, 76, 76, 1.0)';
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
    
    /*// Draw label
    ctx.font = `${0.025 * menuScale}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = icon3Color;
    ctx.fillText('Simulation', icon3X, itemY3 + itemHeight - padding);*/

    // Draw Styling menu item
    const itemY4 = itemY3 + itemHeight + padding;
    ctx.beginPath();
    ctx.roundRect(itemX, itemY4, itemWidth, itemHeight, cornerRadius * 0.5);
    ctx.fillStyle = stylingMenuVisible ? 'rgba(255, 150, 80, 0.3)' : 'rgba(38, 38, 38, 0.8)';
    ctx.fill();
    
    // Draw necktie icon
    const icon4X = itemX + itemWidth / 2;
    const icon4Y = itemY4 + itemHeight / 2;
    const icon4Color = stylingMenuVisible ? 'rgba(255, 180, 100, 1.0)' : 'rgba(76, 76, 76, 1.0)';
    ctx.strokeStyle = icon4Color;
    ctx.fillStyle = icon4Color;
    ctx.lineWidth = 2;
    
    ctx.save();
    ctx.translate(icon4X, icon4Y);
    
    const tieWidth = iconSize * 0.5;
    const tieLength = iconSize * 1.3;
    const gapSize = iconSize * 0.06;
    
    ctx.fillStyle = icon4Color;
    
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
    const itemY5 = itemY4 + itemHeight + padding;
    ctx.beginPath();
    ctx.roundRect(itemX, itemY5, itemWidth, itemHeight, cornerRadius * 0.5);
    ctx.fillStyle = colorMenuVisible ? 'hsla(0, 100%, 70%, 0.30)' : 'hsla(0, 0%, 15%, 0.80)';
    ctx.fill();
    
    // Draw color palette icon
    const icon5X = itemX + itemWidth / 2;
    const icon5Y = itemY5 + itemHeight / 2;
    const icon5Color = colorMenuVisible ? 'hsla(0, 0%, 70%, 1.0)' : 'hsla(0, 0%, 30%, 1.0)';
    ctx.strokeStyle = icon5Color;
    ctx.fillStyle = icon5Color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    ctx.save();
    ctx.translate(icon5X, icon5Y);
    
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
        // Make colors faint when menu is not visible
        if (colorMenuVisible) {
            ctx.fillStyle = dotColors[i];
        } else {
            // Faint version of the actual color (low saturation and opacity)
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = dotColors[i];
        }
        ctx.fill();
        ctx.globalAlpha = 1.0; // Reset
    }
    
    ctx.restore();

    // Draw Lighting menu item
    const itemY6 = itemY5 + itemHeight + padding;
    ctx.beginPath();
    ctx.roundRect(itemX, itemY6, itemWidth, itemHeight, cornerRadius * 0.5);
    ctx.fillStyle = lightingMenuVisible ? 'rgba(255, 204, 0, 0.3)' : 'rgba(38, 38, 38, 0.8)';
    ctx.fill();
    
    // Draw lightbulb icon
    const icon6X = itemX + itemWidth / 2;
    const icon6Y = itemY6 + itemHeight / 2;
    const icon6Color = lightingMenuVisible ? 'hsla(0, 0%, 70%, 1.0)' : 'hsla(0, 0%, 30%, 1.0)';
    ctx.strokeStyle = icon6Color;
    ctx.fillStyle = icon6Color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    ctx.save();
    ctx.translate(icon6X, icon6Y);
    
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
    ctx.rect(-bulbSize * 0.15, bulbSize * 0.15, bulbSize * 0.3, bulbSize * 0.35);
    ctx.stroke();
    
    // Screw threads (3 horizontal lines)
    for (let i = 0; i < 4; i++) {
        const y = bulbSize * (0.2 + i * 0.08);
        ctx.beginPath();
        ctx.moveTo(-bulbSize * 0.15, y);
        ctx.lineTo(bulbSize * 0.15, y*1.1);
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
        boidProps.minSpeed, boidProps.maxSpeed, boidProps.turnFactor, boidProps.margin,
        gWorldSizeX, gWorldSizeY, gWorldSizeZ
    ];
    // Simulation menu knobs (13 knobs - removed Camera FOV)
    const ranges = [
        {min: 100, max: 5000},      // numBoids
        {min: 0.1, max: 1.0},      // boidRadius
        {min: 0.5, max: 10},        // visualRange
        {min: 0, max: 0.2},         // avoidFactor
        {min: 0, max: 0.2},         // matchingFactor
        {min: 0, max: 0.005},       // centeringFactor
        {min: 1.0, max: 20.0},      // minSpeed
        {min: 1.0, max: 30.0},      // maxSpeed
        {min: 0, max: 0.2},         // turnFactor
        {min: 0.5, max: 5.0},       // margin
        {min: 10, max: 60},         // worldSizeX
        {min: 10, max: 60},         // worldSizeY
        {min: 10, max: 60}          // worldSizeZ
    ];
    
    const knobRadius = 0.1 * menuScale;
    const knobSpacing = knobRadius * 3;
    const menuTopMargin = 0.2 * knobRadius;
    const menuWidth = knobSpacing * 2;
    const menuHeight = knobSpacing * 4.5;  // Adjusted from 5 to 4.5 for 13 knobs (removed FOV)
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
            'Minimum Speed', 'Speed Limit', 'Corralling Force', 'Corral Margin',
            'World Size X', 'World Size Y', 'World Size Z'
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
            case 10: valueText = gWorldSizeX.toFixed(0); break;
            case 11: valueText = gWorldSizeY.toFixed(0); break;
            case 12: valueText = gWorldSizeZ.toFixed(0); break;
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
    const menuHeight = 16.5 * knobRadius;
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
        'Rubber Ducks', 'Barramundi', 'Avocados', 'Helicopters',
        'Paper Planes', 'Koons Dogs'
    ];
    
    for (let i = 0; i < 18; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const totalRowWidth = (buttonWidth * 3) + (buttonSpacing * 2);
        const offsetX = (menuWidth - totalRowWidth) / 2;
        const btnX = offsetX + col * (buttonWidth + buttonSpacing);
        const btnY = buttonY + row * (buttonHeight + buttonSpacing);
        
        // Draw button
        ctx.beginPath();
        ctx.roundRect(btnX, btnY, buttonWidth, buttonHeight, 4);
        if (gSelectedBoidTypes.includes(i)) {
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
    const meshDetailY = buttonY + 6 * (buttonHeight + buttonSpacing) + knobRadius * 0.4;
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
    const materialY = meshRadioY + knobRadius * 1.2;
    ctx.font = `bold ${0.04 * menuScale}px verdana`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `hsla(0, 0%, 10%, ${stylingMenuOpacity})`;
    ctx.fillText('Material Type', 0.5 * menuWidth, materialY + 1);
    ctx.fillStyle = `hsla(30, 10%, 80%, ${stylingMenuOpacity})`;
    ctx.fillText('Material Type', 0.5 * menuWidth, materialY);
    
    // Draw horizontal radio buttons for material types
    const materialOptions = ['basic', 'phong', 'standard', 'normal', 'toon', 'imported'];
    const materialLabels = ['2D', 'Plastic', 'Metal', '"Normal"', 'Cartoon', 'Imported'];
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
    const trailSectionY = materialRadioY + knobRadius * 3.0;
    
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
    const smallKnobRadius = 0.1 * menuScale; // Smaller knobs for saturation/lightness
    const colorWheelSize = 1.1 * menuScale; // Size of the color wheel rings
    const menuWidth = 0.6 * menuScale; // Match other menus
    const padding = 0.17 * menuScale;
    const extraHeight = smallKnobRadius * 5.5; // Extra height for two knobs and checkbox at bottom
    const menuHeight = 0.75 * colorWheelSize + extraHeight;
    const menuTopMargin = 0.33 * colorWheelSize; // Match other menus
    const radioY = -0.03 * menuScale; // Place radio buttons at very top of menu
    const wheelCenterY = 0.45 * colorWheelSize; // Place wheel center lower down
    
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
        
        // Gray out rings when not in Normal mode (except Doppler)
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
    
    // Gray out mix knob in Doppler mode (not functional there)
    if (gColorationMode === 3) {
        ctx.save();
        ctx.filter = 'grayscale(100%) brightness(0.6)';
    }
    
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
    const maxWidth = 10;
    const minWidth = 0;
    
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
    
    // Restore context if filter was applied
    if (gColorationMode === 3) {
        ctx.restore();
    }
    
    // Draw radio buttons for coloration mode (now above the color wheels)
    const radioRadius = knobRadius * 0.3;
    const radioButtonCount = 4;
    const radioTotalWidth = menuWidth * 0.9; // Use 90% of menu width
    const radioStartX = (menuWidth - radioTotalWidth) / 2; // Center the group
    const radioSpacing = radioTotalWidth / (radioButtonCount - 1); // Space between buttons
    const radioLabels = ['Wheel', 'Direction', 'Speed', 'Doppler'];
    
    ctx.font = `${0.035 * menuScale}px verdana`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i < 4; i++) {
        const radioX = radioStartX + i * radioSpacing;
        
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
        ctx.fillStyle = `hsla(0, 10%, 10%, ${colorMenuOpacity})`;
        ctx.fillText(radioLabels[i], radioX + 2, 1 +radioY + 0.07 * menuScale);
        ctx.fillStyle = `hsla(0, 10%, 80%, ${colorMenuOpacity})`;
        ctx.fillText(radioLabels[i], radioX, radioY + 0.07 * menuScale);
    }
    
    // Draw Saturation, Variability, and Lightness knobs at the bottom
    const bottomKnobsY = 0.80 * colorWheelSize + smallKnobRadius * 1.7;
    const knobSpacing = menuWidth / 20;
    
    // Saturation knob (left)
    const satKnobX = knobSpacing * 1;
    ctx.beginPath();
    ctx.arc(satKnobX, bottomKnobsY, smallKnobRadius * 1.05, 0, 2 * Math.PI);
    ctx.fillStyle = `hsla(180, 30%, 10%, ${0.9 * colorMenuOpacity})`;
    ctx.fill();
    ctx.strokeStyle = `hsla(180, 20%, 60%, ${colorMenuOpacity})`;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Saturation arc (reuse fullMeterSweep and meterStart from Mix knob)
    const satValue = gBoidSaturation / 100;
    const satPointerAngle = meterStart + fullMeterSweep * satValue;
    
    // Draw arc with gradient from gray to colored (reuse segmentCount)
    for (let i = 0; i < segmentCount; i++) {
        const segmentStart = meterStart + (i / segmentCount) * fullMeterSweep;
        const segmentEnd = meterStart + ((i + 1) / segmentCount) * fullMeterSweep;
        const satLevel = (i / segmentCount) * 100;
        ctx.beginPath();
        ctx.arc(satKnobX, bottomKnobsY, smallKnobRadius * 0.8, segmentStart, segmentEnd);
        ctx.strokeStyle = `hsla(${gPrimaryHue}, ${satLevel}%, ${gBoidLightness}%, ${colorMenuOpacity})`;
        ctx.lineWidth = 6;
        ctx.stroke();
    }
    
    // Draw needle
    const satPointerLength = smallKnobRadius * 0.6;
    const satPointerEndX = satKnobX + Math.cos(satPointerAngle) * satPointerLength;
    const satPointerEndY = bottomKnobsY + Math.sin(satPointerAngle) * satPointerLength;
    ctx.beginPath();
    ctx.moveTo(satKnobX, bottomKnobsY);
    ctx.lineTo(satPointerEndX, satPointerEndY);
    ctx.strokeStyle = `hsla(0, 0%, 90%, ${colorMenuOpacity})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw label
    ctx.font = `${0.35 * smallKnobRadius}px verdana`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `hsla(0, 10%, 10%, ${colorMenuOpacity})`;
    ctx.fillText('Saturation', satKnobX + 2, 1 +bottomKnobsY + 1.5 * smallKnobRadius);
    ctx.fillStyle = `hsla(0, 10%, 90%, ${colorMenuOpacity})`;
    ctx.fillText('Saturation', satKnobX, bottomKnobsY + 1.5 * smallKnobRadius + 1);
    
    // Variability knob (middle)
    const varKnobX = knobSpacing * 10;
    ctx.beginPath();
    ctx.arc(varKnobX, bottomKnobsY, smallKnobRadius * 1.05, 0, 2 * Math.PI);
    ctx.fillStyle = `hsla(180, 30%, 10%, ${0.9 * colorMenuOpacity})`;
    ctx.fill();
    ctx.strokeStyle = `hsla(180, 20%, 60%, ${colorMenuOpacity})`;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Variability arc (0 to 60 degrees)
    const varValue = gBoidHueVariability / 60;
    const varPointerAngle = meterStart + fullMeterSweep * varValue;
    
    // Draw arc with gradient showing hue range
    for (let i = 0; i < segmentCount; i++) {
        const segmentStart = meterStart + (i / segmentCount) * fullMeterSweep;
        const segmentEnd = meterStart + ((i + 1) / segmentCount) * fullMeterSweep;
        const varRange = (i / segmentCount) * 60; // 0 to 60 degrees
        // Show the hue spread by varying the color
        const offsetHue = gPrimaryHue + (i / segmentCount - 0.5) * 60;
        ctx.beginPath();
        ctx.arc(varKnobX, bottomKnobsY, smallKnobRadius * 0.8, segmentStart, segmentEnd);
        ctx.strokeStyle = `hsla(${offsetHue}, ${gBoidSaturation}%, ${gBoidLightness}%, ${colorMenuOpacity})`;
        ctx.lineWidth = 6;
        ctx.stroke();
    }
    
    // Draw needle
    const varPointerLength = smallKnobRadius * 0.6;
    const varPointerEndX = varKnobX + Math.cos(varPointerAngle) * varPointerLength;
    const varPointerEndY = bottomKnobsY + Math.sin(varPointerAngle) * varPointerLength;
    ctx.beginPath();
    ctx.moveTo(varKnobX, bottomKnobsY);
    ctx.lineTo(varPointerEndX, varPointerEndY);
    ctx.strokeStyle = `hsla(0, 0%, 90%, ${colorMenuOpacity})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw label
    ctx.fillStyle = `hsla(0, 10%, 10%, ${colorMenuOpacity})`;
    ctx.fillText('Variability', varKnobX + 2, 1 + bottomKnobsY + 1.5 * smallKnobRadius);
    ctx.fillStyle = `hsla(0, 10%, 90%, ${colorMenuOpacity})`;
    ctx.fillText('Variability', varKnobX, bottomKnobsY + 1.5 * smallKnobRadius + 1);
    
    // Lightness knob (right)
    const lightKnobX = knobSpacing * 19;
    ctx.beginPath();
    ctx.arc(lightKnobX, bottomKnobsY, smallKnobRadius * 1.05, 0, 2 * Math.PI);
    ctx.fillStyle = `hsla(180, 30%, 10%, ${0.9 * colorMenuOpacity})`;
    ctx.fill();
    ctx.strokeStyle = `hsla(180, 20%, 60%, ${colorMenuOpacity})`;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Lightness arc (reuse fullMeterSweep and meterStart from Mix knob)
    const lightValue = gBoidLightness / 100;
    const lightPointerAngle = meterStart + fullMeterSweep * lightValue;
    
    // Draw arc with gradient from dark to light (reuse segmentCount)
    for (let i = 0; i < segmentCount; i++) {
        const segmentStart = meterStart + (i / segmentCount) * fullMeterSweep;
        const segmentEnd = meterStart + ((i + 1) / segmentCount) * fullMeterSweep;
        const lightLevel = (i / segmentCount) * 100;
        ctx.beginPath();
        ctx.arc(lightKnobX, bottomKnobsY, smallKnobRadius * 0.8, segmentStart, segmentEnd);
        ctx.strokeStyle = `hsla(${gPrimaryHue}, ${gBoidSaturation}%, ${lightLevel}%, ${colorMenuOpacity})`;
        ctx.lineWidth = 6;
        ctx.stroke();
    }
    
    // Draw needle
    const lightPointerLength = smallKnobRadius * 0.6;
    const lightPointerEndX = lightKnobX + Math.cos(lightPointerAngle) * lightPointerLength;
    const lightPointerEndY = bottomKnobsY + Math.sin(lightPointerAngle) * lightPointerLength;
    ctx.beginPath();
    ctx.moveTo(lightKnobX, bottomKnobsY);
    ctx.lineTo(lightPointerEndX, lightPointerEndY);
    ctx.strokeStyle = `hsla(0, 0%, 90%, ${colorMenuOpacity})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw label
    ctx.fillStyle = `hsla(0, 10%, 10%, ${colorMenuOpacity})`;
    ctx.fillText('Lightness', lightKnobX + 2, 1 + bottomKnobsY + 1.5 * smallKnobRadius + 1);
    ctx.fillStyle = `hsla(0, 10%, 90%, ${colorMenuOpacity})`;
    ctx.fillText('Lightness', lightKnobX, bottomKnobsY + 1.5 * smallKnobRadius);
    
    // Draw Artwork Selection radio buttons at the bottom
    const artworkRadioY = bottomKnobsY + 2.8 * smallKnobRadius;
    const artworkRadioRadius = smallKnobRadius * 0.4;
    const artworkOptions = ['miro', 'dali', 'bosch'];
    const artworkLabels = ['Miro', 'Dali', 'Bosch'];
    const artworkRadioSpacing = menuWidth / 3;
    
    ctx.font = `${0.035 * menuScale}px verdana`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i < 3; i++) {
        const artRadioX = (i + 0.5) * artworkRadioSpacing;
        
        // Draw radio button circle
        ctx.beginPath();
        ctx.arc(artRadioX, artworkRadioY, artworkRadioRadius, 0, 2 * Math.PI);
        ctx.fillStyle = `hsla(0, 30%, 20%, ${0.8 * colorMenuOpacity})`;
        ctx.strokeStyle = `hsla(0, 20%, 60%, ${colorMenuOpacity})`;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Fill if selected
        if (gSelectedArtwork === artworkOptions[i]) {
            ctx.beginPath();
            ctx.arc(artRadioX, artworkRadioY, artworkRadioRadius * 0.5, 0, 2 * Math.PI);
            ctx.fillStyle = `hsla(0, 60%, 70%, ${colorMenuOpacity})`;
            ctx.fill();
        }
        
        // Draw label
        ctx.fillStyle = `hsla(0, 10%, 10%, ${colorMenuOpacity})`;
        ctx.fillText(artworkLabels[i], artRadioX + 2, 1 + artworkRadioY + 0.07 * menuScale);
        ctx.fillStyle = `hsla(0, 10%, 90%, ${colorMenuOpacity})`;
        ctx.fillText(artworkLabels[i], artRadioX, artworkRadioY + 0.07 * menuScale);
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
    const menuHeight = knobSpacing * 7; // 7 rows (now with 21 knobs)
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
        { label: 'Hue', value: gAmbientHue, min: 0, max: 360 },
        { label: 'Saturation', value: gAmbientSaturation, min: 0, max: 100 },
        { label: 'Overhead', value: gOverheadIntensity, min: 0, max: 4 },
        { label: 'Hue', value: gOverheadHue, min: 0, max: 360 },
        { label: 'Saturation', value: gOverheadSaturation, min: 0, max: 100 },
        { label: 'Globe', value: gGlobeLampIntensity, min: 0, max: 3 },
        { label: 'Hue', value: gGlobeLampHue, min: 0, max: 360 },
        { label: 'Saturation', value: gGlobeLampSaturation, min: 0, max: 100 },
        { label: 'Spotlight 1', value: gSpotlight1Intensity, min: 0, max: 2 },
        { label: 'Hue', value: gSpotlight1Hue, min: 0, max: 360 },
        { label: 'Saturation', value: gSpotlight1Saturation, min: 0, max: 100 },
        { label: 'Spotlight 2', value: gSpotlight2Intensity, min: 0, max: 2 },
        { label: 'Hue', value: gSpotlight2Hue, min: 0, max: 360 },
        { label: 'Saturation', value: gSpotlight2Saturation, min: 0, max: 100 },
        { label: 'Penumbra', value: gSpotlightPenumbra, min: 0, max: 1 },
        { label: 'Shadow Falloff', value: gShadowCameraFar, min: 10, max: 150 },
        { label: 'Boid Headlight', value: gHeadlightIntensity, min: 0, max: 2 },
        { label: 'Ornament Lights', value: gOrnamentLightIntensity, min: 0, max: 3 },
        { label: 'Falloff', value: gOrnamentLightFalloff, min: 3, max: 15 },
        { label: 'Ornament Height', value: gOrnamentHeightOffset, min: 0, max: 100 }
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
        // For all Hue knobs (1, 4, 7, 10, 13), draw a continuous color gradient
        if (i === 1 || i === 4 || i === 7 || i === 10 || i === 13) {
            // Draw continuous hue gradient arc
            const numSegments = 30; // Reduced from 60 for better performance
            const segmentAngle = fullMeterSweep / numSegments;
            ctx.lineWidth = 4;
            
            for (let seg = 0; seg < numSegments; seg++) {
                const segStart = meterStart + seg * segmentAngle;
                const segEnd = segStart + segmentAngle;
                const hue = (seg / numSegments) * 360;
                
                ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${lightingMenuOpacity})`;
                ctx.beginPath();
                ctx.arc(knobX, knobY, knobRadius * 0.85, segStart, segEnd);
                ctx.stroke();
            }
        } else if (i === 2 || i === 5 || i === 8 || i === 11 || i === 14) {
            // Saturation knobs - draw gradient from gray to full color
            const numSegments = 20; // Reduced from 40 for better performance
            const segmentAngle = fullMeterSweep / numSegments;
            ctx.lineWidth = 4;
            
            // Determine which hue to use based on saturation knob index
            let hueToUse;
            if (i === 2) hueToUse = gAmbientHue;
            else if (i === 5) hueToUse = gOverheadHue;
            else if (i === 8) hueToUse = gGlobeLampHue;
            else if (i === 11) hueToUse = gSpotlight1Hue;
            else if (i === 14) hueToUse = gSpotlight2Hue;
            
            for (let seg = 0; seg < numSegments; seg++) {
                const segStart = meterStart + seg * segmentAngle;
                const segEnd = segStart + segmentAngle;
                const sat = (seg / numSegments) * 100;
                
                ctx.strokeStyle = `hsla(${hueToUse}, ${sat}%, 60%, ${lightingMenuOpacity})`;
                ctx.beginPath();
                ctx.arc(knobX, knobY, knobRadius * 0.85, segStart, segEnd);
                ctx.stroke();
            }
        } else {
            // Normal single-color arc for other knobs
            ctx.strokeStyle = `hsla(45, 60%, 60%, ${lightingMenuOpacity})`;
            ctx.beginPath();
            ctx.arc(knobX, knobY, knobRadius * 0.85, meterStart, meterStart + fullMeterSweep * normalizedValue);
            ctx.lineWidth = 4;
            ctx.stroke();
        }
        
        // Draw needle
        const pointerAngle = meterStart + fullMeterSweep * normalizedValue;
        const pointerLength = knobRadius * 0.6;
        const pointerEndX = knobX + Math.cos(pointerAngle) * pointerLength;
        const pointerEndY = knobY + Math.sin(pointerAngle) * pointerLength;
        ctx.beginPath();
        ctx.moveTo(knobX, knobY);
        ctx.lineTo(pointerEndX, pointerEndY);
        
        // For Hue and Saturation knobs, make needle match the selected color
        if (i === 1 || i === 4 || i === 7 || i === 10 || i === 13) {
            // Hue knobs - needle in the selected hue
            ctx.strokeStyle = `hsla(${knobs[i].value}, 80%, 60%, ${lightingMenuOpacity})`;
        } else if (i === 2) {
            // Ambient saturation - needle in ambient color
            ctx.strokeStyle = `hsla(${gAmbientHue}, ${knobs[i].value}%, 60%, ${lightingMenuOpacity})`;
        } else if (i === 5) {
            // Overhead saturation - needle in overhead color
            ctx.strokeStyle = `hsla(${gOverheadHue}, ${knobs[i].value}%, 60%, ${lightingMenuOpacity})`;
        } else if (i === 8) {
            // Globe saturation - needle in globe color
            ctx.strokeStyle = `hsla(${gGlobeLampHue}, ${knobs[i].value}%, 60%, ${lightingMenuOpacity})`;
        } else if (i === 11) {
            // Spotlight 1 saturation - needle in spotlight 1 color
            ctx.strokeStyle = `hsla(${gSpotlight1Hue}, ${knobs[i].value}%, 60%, ${lightingMenuOpacity})`;
        } else if (i === 14) {
            // Spotlight 2 saturation - needle in spotlight 2 color
            ctx.strokeStyle = `hsla(${gSpotlight2Hue}, ${knobs[i].value}%, 60%, ${lightingMenuOpacity})`;
        } else {
            ctx.strokeStyle = `hsla(45, 30%, 80%, ${lightingMenuOpacity})`;
        }
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw value inside meter
        ctx.font = `${0.3 * knobRadius}px verdana`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Check if this is an intensity knob at 0 (Ambient, Overhead, Globe, Spot1, Spot2, Headlight, Ornament)
        let displayValue;
        if ((i === 0 || i === 3 || i === 6 || i === 9 || i === 12 || i === 17 || i === 18) && knobs[i].value === 0) {
            displayValue = 'OFF';
            ctx.fillStyle = `hsla(0, 80%, 50%, ${lightingMenuOpacity})`; // Red color for OFF
        } else if (i === 1 || i === 4 || i === 7 || i === 10 || i === 13) {
            // Hue knobs - show number in the selected hue color
            ctx.fillStyle = `hsla(${knobs[i].value}, 80%, 60%, ${lightingMenuOpacity})`;
            displayValue = Math.round(knobs[i].value).toString();
        } else if (i === 2) {
            // Ambient Saturation - show number in ambient color
            ctx.fillStyle = `hsla(${gAmbientHue}, ${knobs[i].value}%, 60%, ${lightingMenuOpacity})`;
            displayValue = Math.round(knobs[i].value).toString();
        } else if (i === 5) {
            // Overhead Saturation - show number in overhead color
            ctx.fillStyle = `hsla(${gOverheadHue}, ${knobs[i].value}%, 60%, ${lightingMenuOpacity})`;
            displayValue = Math.round(knobs[i].value).toString();
        } else if (i === 8) {
            // Globe Saturation - show number in globe color
            ctx.fillStyle = `hsla(${gGlobeLampHue}, ${knobs[i].value}%, 60%, ${lightingMenuOpacity})`;
            displayValue = Math.round(knobs[i].value).toString();
        } else if (i === 11) {
            // Spotlight 1 Saturation - show number in spotlight 1 color
            ctx.fillStyle = `hsla(${gSpotlight1Hue}, ${knobs[i].value}%, 60%, ${lightingMenuOpacity})`;
            displayValue = Math.round(knobs[i].value).toString();
        } else if (i === 14) {
            // Spotlight 2 Saturation - show number in spotlight 2 color
            ctx.fillStyle = `hsla(${gSpotlight2Hue}, ${knobs[i].value}%, 60%, ${lightingMenuOpacity})`;
            displayValue = Math.round(knobs[i].value).toString();
        } else if (i === 16) {
            // Shadow Far - show as integer
            ctx.fillStyle = `hsla(45, 60%, 70%, ${lightingMenuOpacity})`;
            displayValue = Math.round(knobs[i].value).toString();
        } else if (i === 20) {
            // Ornament Height - show as integer percentage
            ctx.fillStyle = `hsla(45, 60%, 70%, ${lightingMenuOpacity})`;
            displayValue = Math.round(knobs[i].value).toString();
        } else {
            ctx.fillStyle = `hsla(45, 60%, 70%, ${lightingMenuOpacity})`;
            displayValue = knobs[i].value.toFixed(2);
        }
        ctx.fillText(displayValue, knobX, knobY + 0.6 * knobRadius);
        
        // Draw label below knob
        ctx.font = `${0.35 * knobRadius}px verdana`;
        ctx.fillStyle = `hsla(0, 00%, 10%, ${lightingMenuOpacity})`;
        ctx.fillText(knobs[i].label, knobX + 2, 1 + knobY + 1.35 * knobRadius);
        ctx.fillStyle = `hsla(45, 10%, 90%, ${lightingMenuOpacity})`;
        ctx.fillText(knobs[i].label, knobX, knobY + 1.35 * knobRadius);
    }
    
    ctx.restore();
}

function drawCameraMenu() {
    if (cameraMenuOpacity <= 0) return;
    
    const ctx = gOverlayCtx;
    const knobRadius = 0.1 * menuScale;
    const knobSpacing = knobRadius * 3;
    const menuWidth = knobSpacing * 2 * 0.75;  // 25% narrower than original
    const padding = 0.17 * menuScale;
    const radioButtonSize = 0.04 * menuScale;
    const radioButtonSpacing = 0.104 * menuScale;  // Increased 30% from 0.08
    const knobTopMargin = 0.05 * menuScale;
    const radioSectionHeight = 7 * radioButtonSpacing + 0.05 * menuScale;
    const checkboxSectionHeight = 0.15 * menuScale; // Extra space for stereo checkbox
    const menuHeight = radioSectionHeight + knobRadius * 3 + checkboxSectionHeight;
    
    // Position menu
    const menuOriginX = cameraMenuX * window.innerWidth;
    const menuOriginY = cameraMenuY * window.innerHeight;
    
    ctx.save();
    ctx.translate(menuOriginX, menuOriginY);
    
    // Draw menu background
    const cornerRadius = 8;
    ctx.beginPath();
    ctx.roundRect(-padding, -padding, menuWidth + padding * 2, menuHeight + padding * 2, cornerRadius);
    const menuGradient = ctx.createLinearGradient(0, -padding, 0, menuHeight + padding);
    menuGradient.addColorStop(0, `hsl(210, 30%, 20%, ${cameraMenuOpacity})`);
    menuGradient.addColorStop(1, `hsl(210, 20%, 10%, ${cameraMenuOpacity})`);
    ctx.fillStyle = menuGradient;
    ctx.fill();
    ctx.strokeStyle = `hsla(210, 20%, 50%, ${cameraMenuOpacity})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw title
    ctx.fillStyle = `hsla(210, 10%, 80%, ${cameraMenuOpacity})`;
    ctx.font = `bold ${0.05 * menuScale}px verdana`;
    ctx.textAlign = 'center';
    ctx.fillText('CAMERA', menuWidth / 2, -padding + 0.05 * menuScale);
    
    // Draw close button
    const closeIconRadius = 0.1 * menuScale * 0.25;
    const closeIconX = -padding + closeIconRadius + 0.02 * menuScale;
    const closeIconY = -padding + closeIconRadius + 0.02 * menuScale;
    ctx.beginPath();
    ctx.arc(closeIconX, closeIconY, closeIconRadius, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(180, 40, 40, ${cameraMenuOpacity})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(0, 0, 0, ${cameraMenuOpacity})`;
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
        'Auto Orbit Cam CW',
        'Auto Orbit Cam CCW', 
        'Manual Orbit Cam',
        'Follow Boid, Look Ahead',
        'Lead Boid, Look Behind',
        'Free Roam Cam',
        'Dolly Cam'
    ];
    
    const radioStartY = 0.03 * menuScale;
    
    for (let i = 0; i < cameraModeNames.length; i++) {
        const radioY = radioStartY + i * radioButtonSpacing;
        const radioX = -0.02 * menuScale;
        
        // Draw radio button circle
        ctx.beginPath();
        ctx.arc(radioX, radioY, radioButtonSize, 0, 2 * Math.PI);
        ctx.strokeStyle = `hsla(210, 20%, 60%, ${cameraMenuOpacity})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Fill if selected
        if (gCameraMode === i) {
            ctx.beginPath();
            ctx.arc(radioX, radioY, radioButtonSize * 0.6, 0, 2 * Math.PI);
            ctx.fillStyle = `hsla(210, 80%, 70%, ${cameraMenuOpacity})`;
            ctx.fill();
        }
        
        // Draw label
        ctx.font = `${0.035 * menuScale}px verdana`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `hsla(210, 10%, ${gCameraMode === i ? 95 : 80}%, ${cameraMenuOpacity})`;
        ctx.fillText(cameraModeNames[i], radioX + radioButtonSize + 0.03 * menuScale, radioY);
    }
    
    // Draw FOV, Orbit Speed, and Dolly Speed knobs at bottom (3 knobs side by side, centered)
    const horizontalKnobSpacing = knobRadius * 2.4;
    const fovKnobX = menuWidth / 2 - horizontalKnobSpacing;
    const orbitSpeedKnobX = menuWidth / 2;
    const speedKnobX = menuWidth / 2 + horizontalKnobSpacing;
    const knobY = radioSectionHeight + knobRadius * 1.5;
    
    // ===== FOV Knob =====
    // Draw knob background
    ctx.beginPath();
    ctx.arc(fovKnobX, knobY, knobRadius * 1.05, 0, 2 * Math.PI);
    ctx.fillStyle = `hsla(210, 30%, 10%, ${0.9 * cameraMenuOpacity})`;
    ctx.fill();
    ctx.strokeStyle = `hsla(210, 20%, 60%, ${cameraMenuOpacity})`;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Calculate FOV knob angle
    const fovMin = 20;
    const fovMax = 120;
    const fovNormalized = (gCameraFOV - fovMin) / (fovMax - fovMin);
    const fullMeterSweep = 1.6 * Math.PI;
    const meterStart = 0.5 * Math.PI + 0.5 * (2 * Math.PI - fullMeterSweep);
    const fovPointerAngle = meterStart + fullMeterSweep * fovNormalized;
    
    // Draw meter arc
    ctx.strokeStyle = `hsla(210, 60%, 60%, ${cameraMenuOpacity})`;
    ctx.beginPath();
    ctx.arc(fovKnobX, knobY, knobRadius * 0.85, meterStart, fovPointerAngle);
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Draw needle
    const pointerLength = knobRadius * 0.6;
    const fovPointerEndX = fovKnobX + Math.cos(fovPointerAngle) * pointerLength;
    const fovPointerEndY = knobY + Math.sin(fovPointerAngle) * pointerLength;
    ctx.beginPath();
    ctx.moveTo(fovKnobX, knobY);
    ctx.lineTo(fovPointerEndX, fovPointerEndY);
    ctx.strokeStyle = `hsla(210, 30%, 80%, ${cameraMenuOpacity})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw FOV value
    ctx.font = `${0.3 * knobRadius}px verdana`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `hsla(210, 60%, 70%, ${cameraMenuOpacity})`;
    ctx.fillText(gCameraFOV.toFixed(0), fovKnobX, knobY + 0.6 * knobRadius);
    
    // Draw label
    ctx.font = `${0.35 * knobRadius}px verdana`;
    ctx.fillStyle = `hsla(210, 10%, 90%, ${cameraMenuOpacity})`;
    ctx.fillText('Field of View', fovKnobX, knobY + 1.35 * knobRadius);
    
    // ===== Orbit Speed Knob =====
    // Draw knob background
    ctx.beginPath();
    ctx.arc(orbitSpeedKnobX, knobY, knobRadius * 1.05, 0, 2 * Math.PI);
    ctx.fillStyle = `hsla(210, 30%, 10%, ${0.9 * cameraMenuOpacity})`;
    ctx.fill();
    ctx.strokeStyle = `hsla(210, 20%, 60%, ${cameraMenuOpacity})`;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Calculate orbit speed knob angle
    const orbitMin = 0.5;
    const orbitMax = 25.0;
    const orbitNormalized = (gCameraRotationSpeed - orbitMin) / (orbitMax - orbitMin);
    const orbitPointerAngle = meterStart + fullMeterSweep * orbitNormalized;
    
    // Draw meter arc
    ctx.strokeStyle = `hsla(280, 60%, 60%, ${cameraMenuOpacity})`;
    ctx.beginPath();
    ctx.arc(orbitSpeedKnobX, knobY, knobRadius * 0.85, meterStart, orbitPointerAngle);
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Draw needle
    const orbitPointerEndX = orbitSpeedKnobX + Math.cos(orbitPointerAngle) * pointerLength;
    const orbitPointerEndY = knobY + Math.sin(orbitPointerAngle) * pointerLength;
    ctx.beginPath();
    ctx.moveTo(orbitSpeedKnobX, knobY);
    ctx.lineTo(orbitPointerEndX, orbitPointerEndY);
    ctx.strokeStyle = `hsla(210, 30%, 80%, ${cameraMenuOpacity})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw orbit speed value
    ctx.font = `${0.3 * knobRadius}px verdana`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `hsla(280, 60%, 70%, ${cameraMenuOpacity})`;
    ctx.fillText(gCameraRotationSpeed.toFixed(1), orbitSpeedKnobX, knobY + 0.6 * knobRadius);
    
    // Draw label
    ctx.font = `${0.35 * knobRadius}px verdana`;
    ctx.fillStyle = `hsla(210, 10%, 90%, ${cameraMenuOpacity})`;
    ctx.fillText('Orbit Speed', orbitSpeedKnobX, knobY + 1.35 * knobRadius);
    
    // ===== Dolly Speed Knob =====
    // Draw knob background
    ctx.beginPath();
    ctx.arc(speedKnobX, knobY, knobRadius * 1.05, 0, 2 * Math.PI);
    ctx.fillStyle = `hsla(210, 30%, 10%, ${0.9 * cameraMenuOpacity})`;
    ctx.fill();
    ctx.strokeStyle = `hsla(210, 20%, 60%, ${cameraMenuOpacity})`;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Calculate dolly speed knob angle
    const speedMin = 0.01;
    const speedMax = 0.2;
    const speedNormalized = (gDollySpeed - speedMin) / (speedMax - speedMin);
    const speedPointerAngle = meterStart + fullMeterSweep * speedNormalized;
    
    // Draw meter arc
    ctx.strokeStyle = `hsla(30, 70%, 60%, ${cameraMenuOpacity})`;
    ctx.beginPath();
    ctx.arc(speedKnobX, knobY, knobRadius * 0.85, meterStart, speedPointerAngle);
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Draw needle
    const speedPointerEndX = speedKnobX + Math.cos(speedPointerAngle) * pointerLength;
    const speedPointerEndY = knobY + Math.sin(speedPointerAngle) * pointerLength;
    ctx.beginPath();
    ctx.moveTo(speedKnobX, knobY);
    ctx.lineTo(speedPointerEndX, speedPointerEndY);
    ctx.strokeStyle = `hsla(210, 30%, 80%, ${cameraMenuOpacity})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw dolly speed value
    ctx.font = `${0.3 * knobRadius}px verdana`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `hsla(30, 70%, 70%, ${cameraMenuOpacity})`;
    ctx.fillText((gDollySpeed * 100).toFixed(0), speedKnobX, knobY + 0.6 * knobRadius);
    
    // Draw label
    ctx.font = `${0.35 * knobRadius}px verdana`;
    ctx.fillStyle = `hsla(210, 10%, 90%, ${cameraMenuOpacity})`;
    ctx.fillText('Dolly Speed', speedKnobX, knobY + 1.35 * knobRadius);
    
    // Draw Stereo/Anaglyph checkbox below the knobs
    const checkboxY = knobY + 2.5 * knobRadius;
    const checkboxX = menuWidth / 2;
    const checkboxSize = 0.04 * menuScale;
    
    // Draw checkbox outline
    ctx.strokeStyle = `hsla(210, 20%, 60%, ${cameraMenuOpacity})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(checkboxX - checkboxSize / 2, checkboxY - checkboxSize / 2, checkboxSize, checkboxSize);
    
    // Fill if checked
    if (gStereoEnabled) {
        ctx.fillStyle = `hsla(210, 80%, 70%, ${cameraMenuOpacity})`;
        ctx.fillRect(checkboxX - checkboxSize / 2 + 2, checkboxY - checkboxSize / 2 + 2, checkboxSize - 4, checkboxSize - 4);
    }
    
    // Draw label
    ctx.font = `${0.032 * menuScale}px verdana`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `hsla(210, 10%, 90%, ${cameraMenuOpacity})`;
    ctx.fillText('Stereo (Red/Cyan Anaglyph)', checkboxX, checkboxY + 0.06 * menuScale);
    
    // Update knob positions for mouse interaction
    updateKnobPositions();
    
    ctx.restore();
}

// Store FOV knob position for interaction
var fovKnobInfo = { x: 0, y: 0, radius: 0 };
var orbitSpeedKnobInfo = { x: 0, y: 0, radius: 0 };
var dollySpeedKnobInfo = { x: 0, y: 0, radius: 0 };

// Helper to store knob positions (called from drawCameraMenu)
function updateKnobPositions() {
    const knobRadius = 0.1 * menuScale;
    const knobSpacing = knobRadius * 3;
    const menuWidth = knobSpacing * 2 * 0.75;  // 25% narrower than original
    const radioButtonSpacing = 0.104 * menuScale;
    const radioSectionHeight = 7 * radioButtonSpacing + 0.05 * menuScale;
    
    const menuOriginX = cameraMenuX * window.innerWidth;
    const menuOriginY = cameraMenuY * window.innerHeight;
    
    const horizontalKnobSpacing = knobRadius * 2.4;
    const fovKnobX = menuWidth / 2 - horizontalKnobSpacing;
    const orbitSpeedKnobX = menuWidth / 2;
    const speedKnobX = menuWidth / 2 + horizontalKnobSpacing;
    const knobY = radioSectionHeight + knobRadius * 1.5;
    
    // Convert to screen pixel coordinates
    fovKnobInfo = { x: menuOriginX + fovKnobX, y: menuOriginY + knobY, radius: knobRadius };
    orbitSpeedKnobInfo = { x: menuOriginX + orbitSpeedKnobX, y: menuOriginY + knobY, radius: knobRadius };
    dollySpeedKnobInfo = { x: menuOriginX + speedKnobX, y: menuOriginY + knobY, radius: knobRadius };
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
    
    // Clear canvas first
    gColorWheelCtx.clearRect(0, 0, size, size);
    
    // Draw outer color ring (primary)
    for (let angle = 0; angle < 360; angle += 1) {
        const startAngle = angle * Math.PI / 180;
        const endAngle = (angle + 1) * Math.PI / 180;
        
        gColorWheelCtx.beginPath();
        gColorWheelCtx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
        gColorWheelCtx.arc(centerX, centerY, outerInnerRadius, endAngle, startAngle, true);
        gColorWheelCtx.closePath();
        
        gColorWheelCtx.fillStyle = `hsl(${angle}, ${gBoidSaturation}%, ${gBoidLightness}%)`;
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
        
        gColorWheelCtx.fillStyle = `hsl(${angle}, ${gBoidSaturation}%, ${gBoidLightness}%)`;
        gColorWheelCtx.fill();
    }
}

// Function to update world geometry when size changes
function updateWorldGeometry(changedDimension) {
    const boxSize = gPhysicsScene.worldSize;
    
    // Update floor
    if (gFloor) {
        gThreeScene.remove(gFloor);
        if (gFloor.geometry) gFloor.geometry.dispose();
        if (gFloor.material) {
            if (gFloor.material.map) gFloor.material.map.dispose();
            gFloor.material.dispose();
        }
        
        // Update floor ground with new size - same pattern as startup
        const canvas = document.createElement('canvas');
        const tileRes = 1024;
        canvas.width = tileRes;
        canvas.height = tileRes;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'hsl(0, 0%, 12%)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const tileSize = 256;
        for (let i = 0; i < tileRes; i++) {
            for (let j = 0; j < tileRes; j++) {
                if ((i + j) % 2 === 0) {
                    ctx.beginPath();
                    ctx.arc(
                        i * tileSize + tileSize / 2, 
                        j * tileSize + tileSize / 2, 
                        0.2 * tileSize, 
                        0, 
                        2 * Math.PI);
                    //ctx.fillStyle = 'hsl(296, 65%, 65%)';
                    ctx.fillStyle = 'hsl(180, 30%, 15%)';
                    ctx.fill();
                    ctx.strokeStyle = 'hsl(0, 0%, 70%)';
                    ctx.lineWidth = 0.03 * tileSize;
                    ctx.stroke();
                } else {
                    ctx.beginPath();
                    ctx.arc(
                        i * tileSize + tileSize / 2, 
                        j * tileSize + tileSize / 2, 
                        0.45 * tileSize, 
                        0, 
                        2 * Math.PI);
                    ctx.fillStyle = 'hsl(0, 0%, 0%)';
                    ctx.fill();
                    ctx.strokeStyle = 'hsl(0, 0%, 80%)';
                    ctx.lineWidth = 0.04 * tileSize;
                    ctx.stroke();
                    
                }
            }
        }
        
        const checkerTexture = new THREE.CanvasTexture(canvas);
        checkerTexture.wrapS = THREE.RepeatWrapping;
        checkerTexture.wrapT = THREE.RepeatWrapping;
        const tilesWide = (boxSize.x * 2) / 4;
        const tilesDeep = (boxSize.z * 2) / 4;
        checkerTexture.repeat.set(tilesWide, tilesDeep);
        
        gFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(boxSize.x * 2, boxSize.z * 2, 1, 1),
            new THREE.MeshPhongMaterial({ 
                map: checkerTexture,
                shininess: 1.3,
                roughness: 0.0,
            })
        );
        
        gFloor.rotation.x = -Math.PI / 2;
        gFloor.receiveShadow = true;
        gFloor.position.set(0, -0.05, 0);
        gThreeScene.add(gFloor);
    }
    
    // Update walls
    if (gWalls.front) {
        gWalls.front.geometry.dispose();
        gWalls.front.geometry = new THREE.PlaneGeometry(boxSize.x * 2, boxSize.y);
        gWalls.front.position.set(0, boxSize.y / 2, boxSize.z);
        gWallAnimation.front.animating = false; // Stop animation if resizing
    }
    
    if (gWalls.back) {
        gWalls.back.geometry.dispose();
        gWalls.back.geometry = new THREE.PlaneGeometry(boxSize.x * 2, boxSize.y);
        gWalls.back.position.set(0, boxSize.y / 2, -boxSize.z);
        gWallAnimation.back.animating = false; // Stop animation if resizing
        // Update texture repeat
        if (gWalls.back.material.map) {
            gWalls.back.material.map.repeat.set((boxSize.x * 2) / (4 * 5), boxSize.y / (4 * 5));
        }
    }
    
    if (gWalls.left) {
        gWalls.left.geometry.dispose();
        gWalls.left.geometry = new THREE.PlaneGeometry(boxSize.z * 2, boxSize.y);
        gWalls.left.position.set(-boxSize.x, boxSize.y / 2, 0);
        gWallAnimation.left.animating = false; // Stop animation if resizing
        // Update texture repeat
        if (gWalls.left.material.map) {
            gWalls.left.material.map.repeat.set((boxSize.z * 2) / (4 * 5), boxSize.y / (4 * 5));
        }
    }
    
    if (gWalls.right) {
        gWalls.right.geometry.dispose();
        gWalls.right.geometry = new THREE.PlaneGeometry(boxSize.z * 2, boxSize.y);
        gWalls.right.position.set(boxSize.x, boxSize.y / 2, 0);
        gWallAnimation.right.animating = false; // Stop animation if resizing
        // Update texture repeat
        if (gWalls.right.material.map) {
            gWalls.right.material.map.repeat.set((boxSize.z * 2) / (4 * 5), boxSize.y / (4 * 5));
        }
    }
    
    // Update baseboards
    const baseboardHeight = 0.3;
    const baseboardDepth = 0.1;
    
    if (gBaseboards.front) {
        gBaseboards.front.geometry.dispose();
        gBaseboards.front.geometry = new THREE.BoxGeometry(boxSize.x * 2, baseboardHeight, baseboardDepth);
        gBaseboards.front.position.set(0, baseboardHeight / 2, boxSize.z - baseboardDepth / 2);
    }
    
    if (gBaseboards.back) {
        gBaseboards.back.geometry.dispose();
        gBaseboards.back.geometry = new THREE.BoxGeometry(boxSize.x * 2, baseboardHeight, baseboardDepth);
        gBaseboards.back.position.set(0, baseboardHeight / 2, -boxSize.z + baseboardDepth / 2);
    }
    
    if (gBaseboards.left) {
        gBaseboards.left.geometry.dispose();
        gBaseboards.left.geometry = new THREE.BoxGeometry(baseboardDepth, baseboardHeight, boxSize.z * 2);
        gBaseboards.left.position.set(-boxSize.x + baseboardDepth / 2, baseboardHeight / 2, 0);
    }
    
    if (gBaseboards.right) {
        gBaseboards.right.geometry.dispose();
        gBaseboards.right.geometry = new THREE.BoxGeometry(baseboardDepth, baseboardHeight, boxSize.z * 2);
        gBaseboards.right.position.set(boxSize.x - baseboardDepth / 2, baseboardHeight / 2, 0);
    }
    
    // Update painting positions to follow walls
    const paintingWallX = boxSize.x - 0.3; // X position on right wall
    const leftWallX = -boxSize.x + 0.3; // X position on left wall
    const backWallZ = -boxSize.z + 0.1; // Z position on back wall
    
    // Right wall paintings (Miro, Dali, Duchamp main, Duchamp Bride Top, Bosch)
    if (gMiroPaintingGroup) {
        gMiroPaintingGroup.position.x = paintingWallX;
    }
    if (gDaliPaintingGroup) {
        gDaliPaintingGroup.position.x = paintingWallX;
    }
    if (gDuchampPaintingGroup) {
        gDuchampPaintingGroup.position.x = paintingWallX;
    }
    if (gBoschPaintingGroup) {
        gBoschPaintingGroup.position.x = paintingWallX;
    }
    if (gDuchampBrideTopPaintingGroup) {
        gDuchampBrideTopPaintingGroup.position.x = paintingWallX;
    }
    
    // Left wall paintings
    if (gLeftWallPainting) {
        gLeftWallPainting.position.x = leftWallX;
    }
    // Update left wall frame pieces
    const frameDepth = 0.15;
    if (gLeftWallFramePieces) {
        gLeftWallFramePieces.forEach(function(framePiece) {
            framePiece.position.x = leftWallX + frameDepth / 2;
        });
    }
    if (gDuchampBridePaintingGroup) {
        gDuchampBridePaintingGroup.position.x = leftWallX;
    }
    if (gDuchampGrinderPaintingGroup) {
        gDuchampGrinderPaintingGroup.position.x = leftWallX;
    }
    
    // Back wall paintings (Oval painting)
    if (gOvalPainting) {
        gOvalPainting.position.z = backWallZ + 0.05;
    }
    if (gOvalFrame) {
        gOvalFrame.position.z = backWallZ + frameDepth / 2;
    }
    
    // Update painting base Y values when Y dimension changes
    if (changedDimension === 'y') {
        var newPaintingY = boxSize.y / 2 + 1;
        var newDuchampPaintingY = boxSize.y / 2;
        
        // Update base Y values
        gPaintingBaseY = newPaintingY;
        gDuchampPaintingBaseY = newDuchampPaintingY;
        
        // Don't update gBoschBottomHeight - it should remain constant to keep
        // the triptych bottom at the same absolute height above the floor
        
        // Update Bosch painting position to maintain bottom height
        if (gBoschPaintingGroup) {
            var newY = gBoschBottomHeight + (gBoschPanelHeight * gBoschTriptychScale / 2);
            gBoschPaintingGroup.position.y = newY;
        }
    }
    
    // Update hanging star ornaments positions based on world size changes
    if (gStarAnimData && gStarAnimData.length > 0) {
        const ceilingY = 2 * boxSize.y; // Wire extends to 2x world height
        const initialWorldWidth = WORLD_WIDTH;
        const initialWorldDepth = WORLD_DEPTH;
        const initialWorldHeight = WORLD_HEIGHT;
        const initialMinY = initialWorldHeight * 0.8;
        const initialMaxY = initialWorldHeight * 1.5;
        const newMinY = boxSize.y * 0.8;
        const newMaxY = boxSize.y * 1.5;
        const initialStartY = initialWorldHeight + 12;
        const newStartY = boxSize.y + 12;
        
        for (let i = 0; i < gStarAnimData.length; i++) {
            const starData = gStarAnimData[i];
            
            // Only update X when X dimension changes
            if (changedDimension === 'x') {
                const baseX = starData.initialX !== undefined ? starData.initialX : starData.x;
                const xRatio = baseX / (initialWorldWidth - 3);
                const newX = xRatio * (boxSize.x - 3);
                starData.x = newX;
                
                if (starData.star) {
                    starData.star.position.x = newX + (starData.offsetX || 0);
                }
                if (starData.wire) {
                    starData.wire.position.x = newX;
                }
                if (starData.cone) {
                    starData.cone.position.x = newX;
                }
                if (starData.obstacle) {
                    const currentObstaclePos = starData.obstacle.position.clone();
                    currentObstaclePos.x = newX + (starData.offsetX || 0);
                    starData.obstacle.updatePosition(currentObstaclePos);
                }
                if (starData.pointLight) {
                    starData.pointLight.position.x = newX + (starData.offsetX || 0);
                }
            }
            
            // Only update Z when Z dimension changes
            if (changedDimension === 'z') {
                const baseZ = starData.initialZ !== undefined ? starData.initialZ : starData.z;
                const zRatio = baseZ / (initialWorldDepth - 3);
                const newZ = zRatio * (boxSize.z - 3);
                starData.z = newZ;
                
                if (starData.star) {
                    starData.star.position.z = newZ + (starData.offsetZ || 0);
                }
                if (starData.wire) {
                    starData.wire.position.z = newZ;
                }
                if (starData.cone) {
                    starData.cone.position.z = newZ;
                }
                if (starData.obstacle) {
                    const currentObstaclePos = starData.obstacle.position.clone();
                    currentObstaclePos.z = newZ + (starData.offsetZ || 0);
                    starData.obstacle.updatePosition(currentObstaclePos);
                }
                if (starData.pointLight) {
                    starData.pointLight.position.z = newZ + (starData.offsetZ || 0);
                }
            }
            
            // Only update Y when Y dimension changes
            if (changedDimension === 'y') {
                const baseTargetY = starData.initialTargetY !== undefined ? starData.initialTargetY : starData.targetY;
                const yRatio = (baseTargetY - initialMinY) / (initialMaxY - initialMinY);
                const newTargetY = newMinY + yRatio * (newMaxY - newMinY);
                starData.targetY = newTargetY;
                starData.startY = newStartY;
                
                // If star is currently animating (dropping), maintain its relative progress
                if (starData.animating && starData.star) {
                    const currentProgress = (starData.star.position.y - initialStartY) / (baseTargetY - initialStartY);
                    const newCurrentY = newStartY + currentProgress * (newTargetY - newStartY);
                    starData.star.position.y = newCurrentY;
                } else if (starData.star) {
                    // Star has finished animating, move to new target position
                    starData.star.position.y = newTargetY;
                }
                
                // Update wire position and length
                if (starData.wire && starData.star) {
                    const currentStarY = starData.star.position.y;
                    const wireLength = ceilingY - currentStarY;
                    starData.wire.position.y = currentStarY + wireLength / 2;
                    starData.wire.scale.set(1, wireLength, 1);
                }
                
                // Update cone position (support at ceiling)
                if (starData.cone) {
                    const coneHeight = starData.coneHeight || 0.5;
                    starData.cone.position.y = ceilingY + coneHeight / 2;
                }
                
                // Update obstacle position
                if (starData.obstacle && starData.star) {
                    var obstacleRadius = starData.obstacle.radius;
                    var yOffset = starData.yOffsetMultiplier || 1.0;
                    const obstacleY = starData.animating ? starData.star.position.y - obstacleRadius * yOffset : starData.targetY - obstacleRadius * yOffset;
                    starData.obstacle.updatePosition(new THREE.Vector3(
                        starData.x + (starData.offsetX || 0),
                        obstacleY,
                        starData.z + (starData.offsetZ || 0)
                    ));
                }
                
                // Update point light position
                if (starData.pointLight && starData.star) {
                    const lightY = starData.animating ? starData.star.position.y : starData.targetY;
                    starData.pointLight.position.y = lightY;
                }
            }
        }
    }
    
    // Update object positions (stool, duck, teapot, column) based on world size changes
    // Only update positions when X or Z dimensions change, not Y
    if (changedDimension === 'x' || changedDimension === 'z') {
        const initialWorldWidth = WORLD_WIDTH;
        const initialWorldDepth = WORLD_DEPTH;
        
        // Update stool position
        if (gStool) {
            if (changedDimension === 'x') {
                const xRatio = gStoolInitialX / initialWorldWidth;
                const newX = xRatio * boxSize.x;
                gStool.position.x = newX;
            }
            if (changedDimension === 'z') {
                const zRatio = gStoolInitialZ / initialWorldDepth;
                const newZ = zRatio * boxSize.z;
                gStool.position.z = newZ;
            }
            
            // Update stool obstacle position
            if (gStoolObstacle) {
                gStoolObstacle.updatePosition(new THREE.Vector3(gStool.position.x, gStoolObstacle.position.y, gStool.position.z));
            }
        }
        
        // Update duck position
        if (gDuck) {
            if (changedDimension === 'x') {
                const xRatio = gDuckInitialX / initialWorldWidth;
                const newX = xRatio * boxSize.x;
                gDuck.position.x = newX;
                // Update duck entrance disc positions
                if (gDuckEntranceDisc) {
                    gDuckEntranceDisc.position.x = newX;
                }
                if (gDuckEntranceDiscOutline) {
                    gDuckEntranceDiscOutline.position.x = newX;
                }
            }
            if (changedDimension === 'z') {
                const zRatio = gDuckInitialZ / initialWorldDepth;
                const newZ = zRatio * boxSize.z;
                gDuck.position.z = newZ;
                // Update duck entrance disc positions
                if (gDuckEntranceDisc) {
                    gDuckEntranceDisc.position.z = newZ;
                }
                if (gDuckEntranceDiscOutline) {
                    gDuckEntranceDiscOutline.position.z = newZ;
                }
            }
            
            // Update duck obstacle position
            if (gDuckObstacle) {
                gDuckObstacle.updatePosition(new THREE.Vector3(gDuck.position.x, gDuckObstacle.position.y, gDuck.position.z));
            }
        }
        
        // Update teapot position
        if (gTeapot) {
            if (changedDimension === 'x') {
                const xRatio = gTeapotInitialX / initialWorldWidth;
                const newX = xRatio * boxSize.x;
                gTeapot.position.x = newX;
            }
            if (changedDimension === 'z') {
                const zRatio = gTeapotInitialZ / initialWorldDepth;
                const newZ = zRatio * boxSize.z;
                gTeapot.position.z = newZ;
            }
            
            // Update teapot obstacle position
            if (gTeapotObstacle) {
                gTeapotObstacle.updatePosition(new THREE.Vector3(gTeapot.position.x, gTeapotObstacle.position.y, gTeapot.position.z));
            }
        }
        
        // Update column position
        if (gColumnObstacle) {
            let newX = gColumnObstacle.position.x;
            let newZ = gColumnObstacle.position.z;
            
            if (changedDimension === 'x') {
                const xRatio = gColumnInitialX / initialWorldWidth;
                newX = xRatio * boxSize.x;
            }
            if (changedDimension === 'z') {
                const zRatio = gColumnInitialZ / initialWorldDepth;
                newZ = zRatio * boxSize.z;
            }
            
            gColumnObstacle.updatePosition(new THREE.Vector3(newX, gColumnObstacle.position.y, newZ));
        }
        
        // Update bird position
        if (gBird) {
            if (changedDimension === 'x') {
                const xRatio = gBirdInitialX / initialWorldWidth;
                const newX = xRatio * boxSize.x;
                gBird.position.x = newX;
            }
            if (changedDimension === 'z') {
                const zRatio = gBirdInitialZ / initialWorldDepth;
                const newZ = zRatio * boxSize.z;
                gBird.position.z = newZ;
            }
            
            // Update bird obstacle position
            if (gBirdObstacle) {
                gBirdObstacle.updatePosition(new THREE.Vector3(gBird.position.x, gBirdObstacle.position.y, gBird.position.z));
            }
        }
    }
}

// ------------------------------------------
// Start all animations after assets are loaded
function startAnimations() {
    gChairSliding = true;
    gSofaSliding = true;
    gSphereRising = true;
    gPaintingsDropping = true;
    gTorusDropping = true;
    gColumnBaseSliding = true;
}

// ------------------------------------------
// Create dolly rails visualization
function createDollyRails() {
    // Remove existing dolly rails if any
    if (gDollyRailsMesh) {
        gThreeScene.remove(gDollyRailsMesh);
        // Dispose of geometries and materials
        gDollyRailsMesh.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => mat.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
        gDollyRailsMesh = null;
    }
    
    const railsGroup = new THREE.Group();
    railsGroup.name = 'DollyRails';
    
    const railRadius = 0.1;
    const railSpacing = 1.5; // Distance between the two rails
    const railLength = gDollyRailsLength;
    const crossbeamSpacing = 2.5; // Distance between crossbeams
    
    // Create materials
    const railMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x444444, 
        metalness: 0.8, 
        roughness: 0.2 
    });
    const crossbeamMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x555555, 
        metalness: 0.6, 
        roughness: 0.3 
    });
    const endCapMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xcc6666, 
        metalness: 0.5, 
        roughness: 0.4 
    });
    
    // Create rail geometry
    const railGeometry = new THREE.CylinderGeometry(railRadius, railRadius, railLength, 16);
    railGeometry.rotateZ(Math.PI / 2); // Make horizontal along X axis
    
    // Create two parallel rails
    const rail1 = new THREE.Mesh(railGeometry, railMaterial);
    rail1.position.set(0, 0, -railSpacing / 2);
    rail1.castShadow = true;
    rail1.receiveShadow = true;
    rail1.userData = { type: 'rail' };
    railsGroup.add(rail1);
    
    const rail2 = new THREE.Mesh(railGeometry, railMaterial);
    rail2.position.set(0, 0, railSpacing / 2);
    rail2.castShadow = true;
    rail2.receiveShadow = true;
    rail2.userData = { type: 'rail' };
    railsGroup.add(rail2);
    
    // Create crossbeams
    const crossbeamGeometry = new THREE.CylinderGeometry(railRadius * 0.8, railRadius * 0.8, railSpacing, 12);
    crossbeamGeometry.rotateX(Math.PI / 2); // Make horizontal perpendicular to rails
    const numCrossbeams = Math.floor(railLength / crossbeamSpacing) + 1;
    
    for (let i = 0; i < numCrossbeams; i++) {
        const x = -railLength / 2 + i * crossbeamSpacing;
        const crossbeam = new THREE.Mesh(crossbeamGeometry, crossbeamMaterial);
        crossbeam.position.set(x, 0, 0);
        crossbeam.castShadow = true;
        crossbeam.receiveShadow = true;
        crossbeam.userData = { type: 'crossbeam' };
        railsGroup.add(crossbeam);
    }
    
    // Create end caps for dragging
    // End cap diameter should equal the clear space between rails
    const clearSpace = railSpacing - (2 * railRadius);
    const endCapGeometry = new THREE.SphereGeometry(clearSpace / 2, 16, 16);
    
    const startEndCap = new THREE.Mesh(endCapGeometry, endCapMaterial);
    startEndCap.position.set(-railLength / 2, 0, 0);
    startEndCap.name = 'startEndCap';
    startEndCap.castShadow = true;
    railsGroup.add(startEndCap);
    
    const endEndCap = new THREE.Mesh(endCapGeometry, endCapMaterial);
    endEndCap.position.set(railLength / 2, 0, 0);
    endEndCap.name = 'endEndCap';
    endEndCap.castShadow = true;
    railsGroup.add(endEndCap);
    
    // Position the rails group
    railsGroup.position.copy(gDollyRailsPosition);
    railsGroup.rotation.y = gDollyRailsRotation;
    
    gDollyRailsMesh = railsGroup;
    gThreeScene.add(gDollyRailsMesh);
}

// ------------------------------------------
// Create dolly cart (wheels and platform)
function createDollyCart() {
    // Remove existing dolly cart if any
    if (gDollyCartMesh) {
        gThreeScene.remove(gDollyCartMesh);
        gDollyCartMesh.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => mat.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
        gDollyCartMesh = null;
    }
    
    const cartGroup = new THREE.Group();
    cartGroup.name = 'DollyCart';
    
    const railSpacing = 1.5; // Must match rails
    const wheelRadius = 0.15;
    const wheelThickness = 0.2;
    const platformWidth = railSpacing + 0.5;
    const platformLength = 2.0;
    const platformHeight = 0.1;
    const wheelHeight = 0.24; // Height of wheel axle above ground
    
    // Materials
    const wheelMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x333333, 
        metalness: 0.7, 
        roughness: 0.3 
    });
    const platformMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8B4513, 
        metalness: 0.1, 
        roughness: 0.8 
    });
    
    // Create 4 wheels (cylinders)
    const wheelGeometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelThickness, 16);
    wheelGeometry.rotateX(Math.PI / 2); // Align along Z axis (perpendicular to rails)
    
    const wheelPositions = [
        [-platformLength/2 + 0.3, wheelHeight, -railSpacing/2],
        [-platformLength/2 + 0.3, wheelHeight, railSpacing/2],
        [platformLength/2 - 0.3, wheelHeight, -railSpacing/2],
        [platformLength/2 - 0.3, wheelHeight, railSpacing/2]
    ];
    
    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.position.set(pos[0], pos[1], pos[2]);
        wheel.castShadow = true;
        cartGroup.add(wheel);
    });
    
    // Create platform
    const platformGeometry = new THREE.BoxGeometry(platformLength, platformHeight, platformWidth);
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(0, wheelHeight + wheelRadius + platformHeight/2, 0);
    platform.castShadow = true;
    platform.receiveShadow = true;
    cartGroup.add(platform);
    
    gDollyCartMesh = cartGroup;
    gThreeScene.add(gDollyCartMesh);
    
    // Position will be updated in animation loop
    updateDollyCartPosition();
}

// Update dolly cart position based on gDollyPosition
function updateDollyCartPosition() {
    if (!gDollyCartMesh) return;
    
    // Calculate position along rails (same as camera in dolly mode)
    const localX = (gDollyPosition - 0.5) * gDollyRailsLength;
    
    // Transform from local to world coordinates
    const worldX = gDollyRailsPosition.x + Math.cos(gDollyRailsRotation) * localX;
    const worldZ = gDollyRailsPosition.z - Math.sin(gDollyRailsRotation) * localX;
    
    gDollyCartMesh.position.set(worldX, gDollyRailsPosition.y, worldZ);
    gDollyCartMesh.rotation.y = gDollyRailsRotation;
}

// ------------------------------------------
// Load film camera model for dolly
function loadDollyCameraModel() {
    // Check if GLTFLoader is available
    if (typeof THREE.GLTFLoader !== 'undefined') {
        var loader = new THREE.GLTFLoader(gLoadingManager);
        loader.load(
            'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/simpleCamera.gltf',
            function(gltf) {
                var cameraModel = gltf.scene;
                
                // Scale the camera model to appropriate size
                cameraModel.scale.set(4, 4, 4);
                
                // Remove any imported lights
                var lightsToRemove = [];
                cameraModel.traverse(function(child) {
                    if (child.isLight) {
                        lightsToRemove.push(child);
                    }
                });
                lightsToRemove.forEach(function(light) {
                    if (light.parent) {
                        light.parent.remove(light);
                    }
                });
                
                // Apply materials and enable shadows
                cameraModel.traverse(function(child) {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                // Create camera mount rod (thin semi-transparent cylinder)
                const rodRadius = 0.05;
                const rodGeometry = new THREE.CylinderGeometry(rodRadius, rodRadius, 1, 8);
                const rodMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x888888, 
                    metalness: 0.8, 
                    roughness: 0.2,
                    transparent: true,
                    opacity: 0.5
                });
                gDollyCameraMountRod = new THREE.Mesh(rodGeometry, rodMaterial);
                gDollyCameraMountRod.castShadow = true;
                
                // Store the camera model
                gDollyCameraMesh = cameraModel;
                gThreeScene.add(gDollyCameraMesh);
                gThreeScene.add(gDollyCameraMountRod);
                
                // Initial position update
                updateDollyCameraModel();
            },
            undefined,
            function(error) {
                console.error('Error loading camera model:', error);
            }
        );
    } else {
        console.error('THREE.GLTFLoader is not loaded.');
    }
}

// Update dolly camera model position and orientation
function updateDollyCameraModel() {
    if (!gDollyCameraMesh) return;
    
    // Calculate position along rails (same as camera and cart)
    const localX = (gDollyPosition - 0.5) * gDollyRailsLength;
    
    // Transform from local to world coordinates
    const worldX = gDollyRailsPosition.x + Math.cos(gDollyRailsRotation) * localX;
    const worldZ = gDollyRailsPosition.z - Math.sin(gDollyRailsRotation) * localX;
    
    // Position model so lens (at y=0 in model local space) aligns with actual camera height
    // The lens is at y=0 in the model's coordinate system, so we subtract that from camera height
    const lensLocalY = 0; // Y-position of lens in model's local coordinates
    gDollyCameraMesh.position.set(worldX, gDollyCameraHeight - lensLocalY, worldZ);
    
    // Orient the camera model to match the actual camera look direction
    // Calculate the same look direction as the actual camera
    const baseLookDirection = new THREE.Vector3(
        Math.cos(gDollyRailsRotation + gDollyCameraYaw),
        Math.sin(gDollyCameraPitch),
        -Math.sin(gDollyRailsRotation + gDollyCameraYaw)
    );
    baseLookDirection.normalize();
    
    // Point the camera model in that direction (negate because model's default orientation is backward)
    const lookAtPoint = gDollyCameraMesh.position.clone().sub(baseLookDirection);
    gDollyCameraMesh.lookAt(lookAtPoint);
    
    // Adjust for model's internal coordinate system (90-degree offset)
    gDollyCameraMesh.rotateY(Math.PI / 2);
    
    // Update camera mount rod
    if (gDollyCameraMountRod) {
        // Calculate dolly platform height
        const wheelHeight = 0.24;
        const wheelRadius = 0.15;
        const platformHeight = 0.1;
        const platformTopY = gDollyRailsPosition.y + wheelHeight + wheelRadius + platformHeight;
        
        // Rod extends from camera bottom down to platform top
        const rodLength = gDollyCameraHeight - platformTopY;
        const rodMidpointY = (gDollyCameraHeight + platformTopY) / 2;
        
        // Position and scale the rod
        gDollyCameraMountRod.position.set(worldX, rodMidpointY, worldZ);
        gDollyCameraMountRod.scale.set(1, rodLength, 1);
        gDollyCameraMountRod.rotation.y = gDollyRailsRotation;
    }
}

// Update dolly rails position and rotation
function updateDollyRailsTransform() {
    if (gDollyRailsMesh) {
        gDollyRailsMesh.position.copy(gDollyRailsPosition);
        gDollyRailsMesh.rotation.y = gDollyRailsRotation;
    }
}

// Update existing dolly rails mesh during drag (more efficient than recreating)
function updateDollyRailsMeshForDrag(newLength) {
    if (!gDollyRailsMesh) return;
    
    // Just recreate - this is simpler and more reliable
    createDollyRails();
}

// Update dolly rails geometry for new length
function updateDollyRailsLength(newLength) {
    if (!gDollyRailsMesh) return;
    
    const railRadius = 0.1;
    const railSpacing = 1.5;
    const crossbeamSpacing = 2.5;
    
    // Find and update rails and end caps
    const itemsToRemove = [];
    gDollyRailsMesh.children.forEach(child => {
        if (child.name === 'startEndCap') {
            child.position.x = -newLength / 2;
        } else if (child.name === 'endEndCap') {
            child.position.x = newLength / 2;
        } else if (child.userData && child.userData.type === 'rail') {
            // Update rail geometry
            child.geometry.dispose();
            const newRailGeometry = new THREE.CylinderGeometry(railRadius, railRadius, newLength, 16);
            newRailGeometry.rotateZ(Math.PI / 2);
            child.geometry = newRailGeometry;
        } else if (child.userData && child.userData.type === 'crossbeam') {
            // Mark crossbeams for removal
            itemsToRemove.push(child);
        }
    });
    
    // Remove old crossbeams
    itemsToRemove.forEach(item => {
        gDollyRailsMesh.remove(item);
        if (item.geometry) item.geometry.dispose();
    });
    
    // Add new crossbeams
    const crossbeamGeometry = new THREE.CylinderGeometry(railRadius * 0.8, railRadius * 0.8, railSpacing, 12);
    crossbeamGeometry.rotateX(Math.PI / 2); // Make horizontal perpendicular to rails
    const crossbeamMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x555555, 
        metalness: 0.6, 
        roughness: 0.3 
    });
    const numCrossbeams = Math.floor(newLength / crossbeamSpacing) + 1;
    
    for (let i = 0; i < numCrossbeams; i++) {
        const x = -newLength / 2 + i * crossbeamSpacing;
        const crossbeam = new THREE.Mesh(crossbeamGeometry, crossbeamMaterial);
        crossbeam.position.set(x, 0, 0);
        crossbeam.castShadow = true;
        crossbeam.receiveShadow = true;
        crossbeam.userData = { type: 'crossbeam' };
        gDollyRailsMesh.add(crossbeam);
    }
}

// Check if click is on dolly rails
function checkDollyRailsClick(clientX, clientY) {
    if (!cameraMenuVisible || !gDollyRailsMesh) return false;
    
    // Convert screen coordinates to 3D world ray
    const mouse = new THREE.Vector2();
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, gCamera);
    
    // Test intersection with dolly rails mesh
    const intersects = raycaster.intersectObjects(gDollyRailsMesh.children, true);
    
    if (intersects.length > 0) {
        const hitObject = intersects[0].object;
        
        // Check if hit an end cap
        if (hitObject.name === 'startEndCap') {
            gDraggingDollyEnd = 'start';
            gDraggingDolly = true;
            gDollyDragStartMouseX = clientX;
            gDollyDragStartMouseY = clientY;
            gDollyDragStartRotation = gDollyRailsRotation;
            gDollyDragStartPosition = gDollyRailsPosition.clone();
            // Calculate and store the pivot position (end cap, which stays fixed)
            const pivotLocalOffset = gDollyRailsLength / 2;
            gDollyDragPivotPosition = new THREE.Vector3(
                gDollyRailsPosition.x + Math.cos(gDollyRailsRotation) * pivotLocalOffset,
                0,
                gDollyRailsPosition.z - Math.sin(gDollyRailsRotation) * pivotLocalOffset
            );
            if (gCameraControl) {
                gCameraControl.enabled = false;
            }
            return true;
        } else if (hitObject.name === 'endEndCap') {
            gDraggingDollyEnd = 'end';
            gDraggingDolly = true;
            gDollyDragStartMouseX = clientX;
            gDollyDragStartMouseY = clientY;
            gDollyDragStartRotation = gDollyRailsRotation;
            gDollyDragStartPosition = gDollyRailsPosition.clone();
            // Calculate and store the pivot position (start cap, which stays fixed)
            const pivotLocalOffset = -gDollyRailsLength / 2;
            gDollyDragPivotPosition = new THREE.Vector3(
                gDollyRailsPosition.x + Math.cos(gDollyRailsRotation) * pivotLocalOffset,
                0,
                gDollyRailsPosition.z - Math.sin(gDollyRailsRotation) * pivotLocalOffset
            );
            if (gCameraControl) {
                gCameraControl.enabled = false;
            }
            return true;
        }
    }
    
    return false;
}

// ------------------------------------------		
function initThreeScene() {
    // Create loading manager to track all asset loading
    gLoadingManager = new THREE.LoadingManager();
    
    gLoadingManager.onLoad = function() {
        console.log('All assets loaded. Starting animations...');
        gAssetsLoaded = true;
        startAnimations();
    };
    
    gLoadingManager.onProgress = function(url, itemsLoaded, itemsTotal) {
        const progress = (itemsLoaded / itemsTotal * 100).toFixed(0);
        console.log('Loading assets: ' + progress + '% (' + itemsLoaded + '/' + itemsTotal + ')');
    };
    
    gLoadingManager.onError = function(url) {
        console.error('Error loading: ' + url);
    };
    
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
    gAmbientLight.visible = gAmbientIntensity > 0;
    gThreeScene.add( gAmbientLight );	
    
    //gThreeScene.fog = new THREE.Fog( 0xaaaaaa, 10, 100 );				

    // ===== LAMP 1 =====
    // Create lamp 1 using Lamp class
    gLamps[1] = new Lamp(
        new THREE.Vector3(22.61, 14.14, 18.58),
        new THREE.Vector3(16.16, 10.07, 12.13),
        1,
        gSpotlight1Intensity
    );

    // ===== LAMP 2 =====
    // Spawn lamp 2 at same position as lamp 1
    gLamps[2] = new Lamp(
        new THREE.Vector3(22.61, 14.14, 18.58),
        new THREE.Vector3(16.16, 10.07, 12.13),
        2,
        gSpotlight2Intensity
    );
    // Then move it -7 units along X axis and -15 units along Z axis
    translateLampAssembly(-37, -35, 2);
    // Then rotate it 90 degrees
    rotateLampAssembly(Math.PI * 0.9, 2);

    // Directional Overhead Light
    //var dirLight = new THREE.DirectionalLight( 0x55505a, 1 );
    //var dirLight = new THREE.DirectionalLight( 0x55505a, 2 );
    gDirectionalLight = new THREE.DirectionalLight( 0x55505a, gOverheadIntensity );
    gDirectionalLight.visible = gOverheadIntensity > 0;
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
    
    /*// Spawn Point Light
    gSpawnPointLight = new THREE.PointLight( 0xffffff, 1.0, 30 ); // white light, intensity 1.0, distance 30
    gSpawnPointLight.position.set( 0, 16, 0 ); // At boid spawn center
    gThreeScene.add( gSpawnPointLight );*/
    
    // Floor ground with checkerboard pattern -----------------------------
    var canvas = document.createElement('canvas');
    const tileRes = 1024; // Size of each tile in pixels
    canvas.width = tileRes;
    canvas.height = tileRes;
    var ctx = canvas.getContext('2d');

    ctx.fillStyle = 'hsl(0, 0%, 12%)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const tileSize = 512;
    for (let i = 0; i < tileRes; i++) {
        for (let j = 0; j < tileRes; j++) {
            if ((i + j) % 2 === 0) {
                ctx.beginPath();
                ctx.arc(
                    i * tileSize + tileSize / 2, 
                    j * tileSize + tileSize / 2, 
                    0.2 * tileSize, 
                    0, 
                    2 * Math.PI);
                ctx.fillStyle = 'hsl(180, 30%, 15%)';
                ctx.fill();
                ctx.strokeStyle = 'hsl(0, 0%, 70%)';
                ctx.lineWidth = 0.02 * tileSize;
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.arc(
                    i * tileSize + tileSize / 2, 
                    j * tileSize + tileSize / 2, 
                    0.45 * tileSize, 
                    0, 
                    2 * Math.PI);
                ctx.fillStyle = 'hsl(0, 0%, 0%)';
                ctx.fill();
                ctx.strokeStyle = 'hsl(0, 0%, 70%)';
                ctx.lineWidth = 0.04 * tileSize;
                ctx.stroke();

                
            }
        }

        ctx.strokeStyle = 'hsl(0, 0%, 60%)';
        ctx.lineWidth = 0.01 * tileSize;
        ctx.beginPath();
        ctx.moveTo(i * tileSize, 0);
        ctx.lineTo(i * tileSize, tileRes);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * tileSize);
        ctx.lineTo(tileRes, i * tileSize);
        ctx.stroke();
    }
    
    var checkerTexture = new THREE.CanvasTexture(canvas);
    checkerTexture.wrapS = THREE.RepeatWrapping;
    checkerTexture.wrapT = THREE.RepeatWrapping;
    // Calculate tile repeat based on world dimensions (each tile is 4 units)
    var tilesWide = (WORLD_WIDTH * 2) / 4;
    var tilesDeep = (WORLD_DEPTH * 2) / 4;
    checkerTexture.repeat.set(tilesWide, tilesDeep);
    
    gFloor = new THREE.Mesh(
        new THREE.PlaneGeometry(WORLD_WIDTH * 2, WORLD_DEPTH * 2, 1, 1),
        new THREE.MeshPhongMaterial({ 
            map: checkerTexture,
            //color: new THREE.Color(`hsl(0, 0%, 30%)`),
            shininess: 100,
            roughness: 0.0,
        })
    );				

    gFloor.rotation.x = -Math.PI / 2; // rotates X/Y to X/Z
    gFloor.receiveShadow = true;
    gFloor.position.set(0, -0.05, 0);
    gThreeScene.add( gFloor );
    
    // Create Afghan rug
    var rugTextureLoader = new THREE.TextureLoader();
    rugTextureLoader.load(
        'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/afghan_kazak.jpg',
        function(texture) {
            // Use actual texture dimensions to maintain proper aspect ratio
            var actualWidth = texture.image.width;
            var actualHeight = texture.image.height;
            var aspectRatio = actualWidth / actualHeight;
            
            var rugWidth = 24; // units (X direction)
            var rugHeight = rugWidth / aspectRatio; // Z direction, calculated from actual image ratio
            
            gRug = new THREE.Mesh(
                new THREE.PlaneGeometry(rugWidth, rugHeight),
                new THREE.MeshPhongMaterial({
                    map: texture,
                    shininess: 5,
                    roughness: 0.8
                })
            );
            
            gRug.rotation.x = -Math.PI / 2; // Lie flat on floor
            gRug.position.set(-6, 0.015, 0); // Position between teapot and chair, slightly above floor
            gRug.receiveShadow = true;
            gThreeScene.add(gRug);
            
            console.log('Afghan rug loaded successfully with aspect ratio: ' + aspectRatio.toFixed(3));
        },
        function(xhr) {
            console.log('Afghan rug: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function(error) {
            console.error('Error loading Afghan rug:', error);
        }
    );
    
    /*var gridHelper = new THREE.GridHelper( 75, 50, 0xcca000, 0xcca000 );
    gridHelper.material.opacity = 1.0;
    gridHelper.material.transparent = true;
    gridHelper.position.set(0, 0.01, 0);
    gThreeScene.add( gridHelper );*/
    
    // Load stool model using GLTFLoader -----------------------------
    // Check if GLTFLoader is available
    if (typeof THREE.GLTFLoader !== 'undefined') {
        var loader = new THREE.GLTFLoader(gLoadingManager);
        loader.load(
            'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/stool.gltf',
            function(gltf) {
                var stool = gltf.scene;
                
                // Position on floor in center of room - start high for animation
                
                stool.position.set(gStoolInitialX, 30, gStoolInitialZ);
                stool.rotation.y = -Math.PI / 12; // Rotate 45 degrees
                
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
                var spinningWheelGroup = null;
                
                // First pass: find the spinningWheel group and hubAxle
                stool.traverse(function(child) {
                    var name = child.name.toLowerCase();
                    if (name === 'spinningwheel') {
                        spinningWheelGroup = child;
                    }
                    if (name === 'hubaxle' || name === 'hubbody') {
                        hubMesh = child;
                    }
                });
                
                // Second pass: apply materials, shadows, and mark draggable parts
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
                        
                        // Mark base/fork parts as draggable
                        var name = child.name.toLowerCase();
                        if (name.includes('fork') || name.includes('seat') || name.includes('base')) {
                            child.userData.isDraggableStool = true;
                        }
                        
                        // Mark legs separately for rotation
                        if (name.includes('leg')) {
                            child.userData.isStoolLeg = true;
                        }
                    }
                });
                
                // Collect all children from spinningWheel group
                if (spinningWheelGroup && hubMesh) {
                    // Collect only meshes from the spinningWheel group, preserving group structure
                    spinningWheelGroup.traverse(function(child) {
                        if (child.isMesh && child !== spinningWheelGroup) {
                            wheelPartsToRotate.push(child);
                        }
                    });
                }
                
                // Group wheel parts for rotation around hub
                if (wheelPartsToRotate.length > 0 && hubMesh) {
                    // Update matrices to get accurate world positions
                    stool.updateMatrixWorld(true);
                    
                    // Find the parent that will contain our rotating group
                    var wheelParent = hubMesh.parent;
                    
                    // Add rotating group to the same parent as hub
                    if (wheelParent) {
                        wheelParent.add(rotatingWheelGroup);
                    } else {
                        stool.add(rotatingWheelGroup);
                    }
                    
                    // Position group at hub's world position (converted to local space of parent)
                    var hubWorldPos = new THREE.Vector3();
                    hubMesh.getWorldPosition(hubWorldPos);
                    
                    if (rotatingWheelGroup.parent) {
                        rotatingWheelGroup.parent.worldToLocal(hubWorldPos);
                    }
                    rotatingWheelGroup.position.copy(hubWorldPos);
                    rotatingWheelGroup.updateMatrixWorld(true);
                    
                    // Reparent wheel parts to rotating group, preserving world positions
                    wheelPartsToRotate.forEach(function(part) {
                        // Get world position before reparenting
                        var partWorldPos = new THREE.Vector3();
                        var partWorldQuat = new THREE.Quaternion();
                        var partLocalScale = part.scale.clone(); // Keep local scale
                        
                        part.getWorldPosition(partWorldPos);
                        part.getWorldQuaternion(partWorldQuat);
                        
                        var oldParent = part.parent;
                        if (oldParent) {
                            oldParent.remove(part);
                        }
                        rotatingWheelGroup.add(part);
                        
                        // Convert world position to local position in rotatingWheelGroup
                        var localPos = partWorldPos.clone();
                        rotatingWheelGroup.worldToLocal(localPos);
                        part.position.copy(localPos);
                        
                        // Convert world quaternion to local
                        var rotGroupWorldQuat = new THREE.Quaternion();
                        rotatingWheelGroup.getWorldQuaternion(rotGroupWorldQuat);
                        var rotGroupWorldQuatInv = rotGroupWorldQuat.clone().invert();
                        var localQuat = rotGroupWorldQuatInv.clone().multiply(partWorldQuat);
                        part.quaternion.copy(localQuat);
                        
                        // Keep original local scale
                        part.scale.copy(partLocalScale);
                    });
                    
                    gWheelParts = [rotatingWheelGroup];
                    gBicycleWheel = rotatingWheelGroup;
                    console.log('Wheel configured: ' + wheelPartsToRotate.length + ' parts rotating about hubAxle');
                } else if (hubMesh) {
                    // Fallback: no spinningWheel group found, try to identify parts individually
                    console.log('Warning: spinningWheel group not found, attempting fallback method');
                    
                    // Identify wheel parts by name as fallback
                    stool.traverse(function(child) {
                        if (child.isMesh) {
                            var name = child.name.toLowerCase();
                            if ((name.includes('tire') || name.includes('spoke') || 
                                 name.includes('valve') || name.includes('vavle')) &&
                                !name.includes('hub') && !name.includes('axle') && !name.includes('flange')) {
                                wheelPartsToRotate.push(child);
                            }
                        }
                    });
                    
                    if (wheelPartsToRotate.length > 0) {
                        // Create rotating group and reparent parts
                        var wheelParent = hubMesh.parent;
                        if (wheelParent) {
                            wheelParent.add(rotatingWheelGroup);
                        } else {
                            stool.add(rotatingWheelGroup);
                        }
                        
                        var hubWorldPos = new THREE.Vector3();
                        hubMesh.getWorldPosition(hubWorldPos);
                        if (rotatingWheelGroup.parent) {
                            rotatingWheelGroup.parent.worldToLocal(hubWorldPos);
                        }
                        rotatingWheelGroup.position.copy(hubWorldPos);
                        
                        wheelPartsToRotate.forEach(function(part) {
                            var worldMatrix = new THREE.Matrix4();
                            worldMatrix.copy(part.matrixWorld);
                            
                            var oldParent = part.parent;
                            if (oldParent) {
                                oldParent.remove(part);
                            }
                            rotatingWheelGroup.add(part);
                            
                            var parentWorldMatrixInverse = new THREE.Matrix4();
                            parentWorldMatrixInverse.copy(rotatingWheelGroup.matrixWorld).invert();
                            
                            var localMatrix = new THREE.Matrix4();
                            localMatrix.multiplyMatrices(parentWorldMatrixInverse, worldMatrix);
                            
                            var localPos = new THREE.Vector3();
                            var localQuat = new THREE.Quaternion();
                            var localScale = new THREE.Vector3();
                            localMatrix.decompose(localPos, localQuat, localScale);
                            
                            part.position.copy(localPos);
                            part.quaternion.copy(localQuat);
                            part.scale.copy(localScale);
                        });
                        
                        gWheelParts = [rotatingWheelGroup];
                        gBicycleWheel = rotatingWheelGroup;
                        console.log('Fallback: created rotating group with ' + wheelPartsToRotate.length + ' parts');
                    }
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
                if (gStoolObstacle.minorToricPedestalMesh) gStoolObstacle.minorToricPedestalMesh.visible = false;
                if (gStoolObstacle.majorToricPedestalMesh) gStoolObstacle.majorToricPedestalMesh.visible = false;
                if (gStoolObstacle.pedestalMesh) gStoolObstacle.pedestalMesh.visible = false;
                gObstacles.push(gStoolObstacle);
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
        var duckLoader = new THREE.GLTFLoader(gLoadingManager);
        duckLoader.load(
            'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/Duck.gltf',
            function(gltf) {
                var duck = gltf.scene;
                
                // Position below floor initially for entrance animation
                duck.position.set(gDuckInitialX, gDuckStartY, gDuckInitialZ);
                
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
                
                // Store a clone as template for boid geometry BEFORE adding interaction controls
                gDuckTemplate = duck.clone();
                
                // Add invisible beak collision area for rotation (only to main duck, not template)
                var beakCollisionGeometry = new THREE.BoxGeometry(0.45, 0.36, 0.36);
                var beakCollisionMaterial = new THREE.MeshBasicMaterial({
                    color: 0x000000
                });
                var beakCollisionMesh = new THREE.Mesh(beakCollisionGeometry, beakCollisionMaterial);
                beakCollisionMesh.position.set(0.825, 1.25, -0.15);
                beakCollisionMesh.userData.isDuckBeak = true;
                beakCollisionMesh.visible = false; // Hide the collision box
                duck.add(beakCollisionMesh);
                
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
        var fishLoader = new THREE.GLTFLoader(gLoadingManager);
        fishLoader.load(
            'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/fishBarramundi.gltf',
            function(gltf) {
                var fish = gltf.scene;
            
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
        var avocadoLoader = new THREE.GLTFLoader(gLoadingManager);
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
    
    // Load Mammoth model using GLTFLoader
    if (typeof THREE.GLTFLoader !== 'undefined') {
        var mammothLoader = new THREE.GLTFLoader(gLoadingManager);
        mammothLoader.load(
            'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/miniMammothDisplay.gltf',
            function(gltf) {
                var mammoth = gltf.scene;
                
                // Position on floor
                mammoth.position.set(0, 0, 25);
                
                // Scale appropriately
                mammoth.scale.set(1, 1, 1);
                
                // Rotate to face forward
                mammoth.rotation.y = 0.5 * Math.PI;
                
                // Remove any imported lights
                var lightsToRemove = [];
                mammoth.traverse(function(child) {
                    if (child.isLight) {
                        lightsToRemove.push(child);
                    }
                });
                lightsToRemove.forEach(function(light) {
                    if (light.parent) {
                        light.parent.remove(light);
                    }
                });
                
                // Enable shadows and mark meshes as draggable
                mammoth.traverse(function(child) {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        
                        // Check if this is the pushbutton
                        if (child.name && child.name.toLowerCase().includes('pushbutton')) {
                            child.userData.isMammothPushbutton = true;
                        } else {
                            child.userData.isDraggableMammoth = true;
                        }
                    }
                });
                
                gThreeScene.add(mammoth);
                gMammoth = mammoth; // Store global reference
                
                // Create sphere obstacle for boid avoidance
                var mammothObstacleRadius = 2.0; // Radius that covers the mammoth
                gMammothObstacle = new SphereObstacle(
                    mammothObstacleRadius,
                    new THREE.Vector3(mammoth.position.x, mammoth.position.y + 1.5, mammoth.position.z)
                );
                // Make the obstacle invisible
                if (gMammothObstacle.mesh) {
                    gMammothObstacle.mesh.visible = false;
                }
                gObstacles.push(gMammothObstacle);
                
                console.log('Mammoth model loaded successfully');
            },
            function(xhr) {
                console.log('Mammoth model: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function(error) {
                console.error('Error loading Mammoth model:', error);
            }
        );
    }
    
    // Load Mammoth Skeleton model using GLTFLoader
    if (typeof THREE.GLTFLoader !== 'undefined') {
        var mammothSkeletonLoader = new THREE.GLTFLoader(gLoadingManager);
        mammothSkeletonLoader.load(
            'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/mammothSkeleton.gltf',
            function(gltf) {
                var skeleton = gltf.scene;
                
                // Position below floor initially for entrance animation
                skeleton.position.set(0, gFullMammothStartY, 25);
                
                // Scale appropriately
                skeleton.scale.set(4, 4, 4);
                
                // Rotate to face forward
                skeleton.rotation.y = 0.5 * Math.PI;
                
                // Remove any imported lights
                var lightsToRemove = [];
                skeleton.traverse(function(child) {
                    if (child.isLight) {
                        lightsToRemove.push(child);
                    }
                });
                lightsToRemove.forEach(function(light) {
                    if (light.parent) {
                        light.parent.remove(light);
                    }
                });
                
                // Enable shadows and mark meshes as draggable
                skeleton.traverse(function(child) {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        child.userData.isDraggableMammothSkeleton = true;
                    }
                });
                
                // Don't add to scene yet - will be added during swap animation
                gMammothSkeleton = skeleton; // Store global reference
                
                // Create sphere obstacle for boid avoidance and add to obstacles array
                var skeletonObstacleRadius = 12.0; // Larger radius for full skeleton (4x scale)
                gMammothSkeletonObstacle = new SphereObstacle(
                    skeletonObstacleRadius,
                    new THREE.Vector3(skeleton.position.x, skeleton.position.y + 8, skeleton.position.z)
                );
                // Make the obstacle invisible
                if (gMammothSkeletonObstacle.mesh) {
                    gMammothSkeletonObstacle.mesh.visible = false;
                }
                gObstacles.push(gMammothSkeletonObstacle);
                
                console.log('Mammoth Skeleton model loaded successfully');
            },
            function(xhr) {
                console.log('Mammoth Skeleton model: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function(error) {
                console.error('Error loading Mammoth Skeleton model:', error);
            }
        );
    }
    
    // Load Helicopter model using GLTFLoader
    if (typeof THREE.GLTFLoader !== 'undefined') {
        var helicopterLoader = new THREE.GLTFLoader(gLoadingManager);
        helicopterLoader.load(
            'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/helicopter.gltf',
            function(gltf) {
                var helicopter = gltf.scene;
                
                // Position at geometric center of room (mid-height)
                helicopter.position.set(0, 10, 0);
                
                // Scale helicopter appropriately
                helicopter.scale.set(1.5, 1.5, 1.5);
                
                // Rotate to face forward
                helicopter.rotation.y = 0.5 * Math.PI;
                
                // Remove any imported lights
                var lightsToRemove = [];
                helicopter.traverse(function(child) {
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
                helicopter.traverse(function(child) {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                // Store a clone as template for boid geometry
                gHelicopterTemplate = helicopter.clone();
                
                console.log('Helicopter model loaded successfully');
            },
            function(xhr) {
                console.log('Helicopter model: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function(error) {
                console.error('Error loading Helicopter model:', error);
            }
        );
    }
    
    // Load Paper Plane model using GLTFLoader
    if (typeof THREE.GLTFLoader !== 'undefined') {
        var paperPlaneLoader = new THREE.GLTFLoader(gLoadingManager);
        paperPlaneLoader.load(
            'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/paperPlane.gltf',
            function(gltf) {
                var paperPlane = gltf.scene;
                
                // Scale appropriately
                paperPlane.scale.set(0.5, 0.5, 0.5);
                
                // Remove any imported lights
                var lightsToRemove = [];
                paperPlane.traverse(function(child) {
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
                paperPlane.traverse(function(child) {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                // Store a clone as template for boid geometry
                gPaperPlaneTemplate = paperPlane.clone();
                
                console.log('Paper Plane model loaded successfully');
            },
            function(xhr) {
                console.log('Paper Plane model: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function(error) {
                console.error('Error loading Paper Plane model:', error);
            }
        );
    }
    
    // Load Teapot model using GLTFLoader
    if (typeof THREE.GLTFLoader !== 'undefined') {
        var teapotLoader = new THREE.GLTFLoader(gLoadingManager);
        teapotLoader.load(
            'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/teapotTable.gltf',
            function(gltf) {
                var teapot = gltf.scene;
                
                // Position object at starting position
                teapot.position.set(gTeapotInitialX, 0, gTeapotInitialZ);
                
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
    
    // Load Sheen Chair model using GLTFLoader
    if (typeof THREE.GLTFLoader !== 'undefined') {
        var chairLoader = new THREE.GLTFLoader(gLoadingManager);
        chairLoader.load(
            'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/sheenChair.gltf',
            function(gltf) {
                var chair = gltf.scene;
                
                // Position on floor - start at slide-in position
                chair.position.set(gChairStartX, 0, gChairInitialZ);
                
                // Scale appropriately
                chair.scale.set(1.5, 1, 1);

                // Rotate 90-degrees 
                chair.rotation.y = 3 * Math.PI / 2;
                
                // Remove any imported lights
                var lightsToRemove = [];
                chair.traverse(function(child) {
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
                chair.traverse(function(child) {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        child.userData.isDraggableChair = true;
                    }
                });
                
                gThreeScene.add(chair);
                gChair = chair; // Store global reference
                
                // Create box obstacle for boid avoidance
                var chairObstacleWidth = 2.0;  // X dimension
                var chairObstacleHeight = 3.5; // Y dimension
                var chairObstacleDepth = 2.0;  // Z dimension
                gChairObstacle = new BoxObstacle(
                    chairObstacleWidth,
                    chairObstacleHeight,
                    chairObstacleDepth,
                    new THREE.Vector3(chair.position.x, chair.position.y + chairObstacleHeight / 2, chair.position.z),
                    { x: 0, y: chair.rotation.y, z: 0 }
                );
                // Make the obstacle invisible
                if (gChairObstacle.mesh) {
                    gChairObstacle.mesh.visible = false;
                }
                gObstacles.push(gChairObstacle);
                
                console.log('Sheen Chair model loaded successfully');
            },
            function(xhr) {
                console.log('Sheen Chair model: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function(error) {
                console.error('Error loading Sheen Chair model:', error);
            }
        );
    }
    
    // Load Sheen Chair model using GLTFLoader\n    if (typeof THREE.GLTFLoader !== 'undefined') {\n        var chairLoader = new THREE.GLTFLoader(gLoadingManager);\n        chairLoader.load(\n            'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/sheenChair.gltf',\n            function(gltf) {\n                var chair = gltf.scene;\n                \n                // Position on floor\n                chair.position.set(gChairInitialX, 0, gChairInitialZ);\n                \n                // Scale appropriately\n                chair.scale.set(1, 1, 1);\n                \n                // Remove any imported lights\n                var lightsToRemove = [];\n                chair.traverse(function(child) {\n                    if (child.isLight) {\n                        lightsToRemove.push(child);\n                    }\n                });\n                lightsToRemove.forEach(function(light) {\n                    if (light.parent) {\n                        light.parent.remove(light);\n                    }\n                });\n                \n                // Enable shadows and mark as draggable for all meshes\n                chair.traverse(function(child) {\n                    if (child.isMesh) {\n                        child.castShadow = true;\n                        child.receiveShadow = true;\n                        child.userData.isDraggableChair = true;\n                    }\n                });\n                \n                gThreeScene.add(chair);\n                gChair = chair; // Store global reference\n                \n                // Create box obstacle for boid avoidance\n                var chairObstacleWidth = 2.0;  // X dimension\n                var chairObstacleHeight = 3.5; // Y dimension\n                var chairObstacleDepth = 2.0;  // Z dimension\n                gChairObstacle = new BoxObstacle(\n                    chairObstacleWidth,\n                    chairObstacleHeight,\n                    chairObstacleDepth,\n                    new THREE.Vector3(chair.position.x, chair.position.y + chairObstacleHeight / 2, chair.position.z),\n                    { x: 0, y: chair.rotation.y, z: 0 }\n                );\n                // Make the obstacle invisible\n                if (gChairObstacle.mesh) {\n                    gChairObstacle.mesh.visible = false;\n                }\n                gObstacles.push(gChairObstacle);\n                \n                console.log('Sheen Chair model loaded successfully');\n            },\n            function(xhr) {\n                console.log('Sheen Chair model: ' + (xhr.loaded / xhr.total * 100) + '% loaded');\n            },\n            function(error) {\n                console.error('Error loading Sheen Chair model:', error);\n            }\n        );\n    }\n    \n    // Load Glam Velvet Sofa model using GLTFLoader
    if (typeof THREE.GLTFLoader !== 'undefined') {
        var sofaLoader = new THREE.GLTFLoader(gLoadingManager);
        sofaLoader.load(
            'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/glamVelvetSofa.gltf',
            function(gltf) {
                var sofa = gltf.scene;
                
                // Position close to left wall, centered in Z - start at slide-in position
                sofa.position.set(gSofaStartX, 0, gSofaInitialZ);
                
                // Scale appropriately
                sofa.scale.set(9, 9, 9);

                sofa.rotation.y = -0.25 * Math.PI; // Rotate 90 degrees to face forward
                
                // Remove any imported lights
                var lightsToRemove = [];
                sofa.traverse(function(child) {
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
                sofa.traverse(function(child) {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        child.userData.isDraggableSofa = true;
                    }
                });
                
                gThreeScene.add(sofa);
                gSofa = sofa; // Store global reference
                
                // Create box obstacle for boid avoidance
                var sofaObstacleWidth = 22.0;  // X dimension (width)
                var sofaObstacleHeight = 7.0; // Y dimension
                var sofaObstacleDepth = 10.0;  // Z dimension (depth/length)
                
                // Calculate offset toward rear of sofa accounting for rotation
                var sofaRotation = sofa.rotation.y; // -0.25 * Math.PI
                var rearOffset = 1.2; // Move 1.2 units toward rear in local coordinates
                var offsetX = -rearOffset * Math.sin(sofaRotation);
                var offsetZ = -rearOffset * Math.cos(sofaRotation);
                
                gSofaObstacle = new BoxObstacle(
                    sofaObstacleWidth,
                    sofaObstacleHeight,
                    sofaObstacleDepth,
                    new THREE.Vector3(sofa.position.x + offsetX, sofa.position.y + sofaObstacleHeight / 2, sofa.position.z + offsetZ),
                    { x: 0, y: sofa.rotation.y, z: 0 }
                );
                // Make the obstacle invisible
                if (gSofaObstacle.mesh) {
                    gSofaObstacle.mesh.visible = false;
                }
                gObstacles.push(gSofaObstacle);
                
                console.log('Glam Velvet Sofa model loaded successfully');
            },
            function(xhr) {
                console.log('Glam Velvet Sofa model: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function(error) {
                console.error('Error loading Glam Velvet Sofa model:', error);
            }
        );
    }
    
    // Load Globe Lamp model using GLTFLoader
    if (typeof THREE.GLTFLoader !== 'undefined') {
        var globeLampLoader = new THREE.GLTFLoader(gLoadingManager);
        globeLampLoader.load(
            'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/globeLamp.gltf',
            function(gltf) {
                var globeLamp = gltf.scene;
                
                // Position object at starting position
                globeLamp.position.set(20, 10, -15);
                
                // Scale appropriately if needed
                globeLamp.scale.set(1, 1, 1);
                
                // Remove any imported lights
                var lightsToRemove = [];
                globeLamp.traverse(function(child) {
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
                globeLamp.traverse(function(child) {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        child.userData.isDraggableGlobeLamp = true;
                    }
                });
                
                gThreeScene.add(globeLamp);
                gGlobeLamp = globeLamp; // Store global reference
                
                // Create point light at center of lamp
                const color = new THREE.Color();
                color.setHSL(gGlobeLampHue / 360, gGlobeLampSaturation / 100, 0.5);
                gGlobeLampLight = new THREE.PointLight(color, gGlobeLampIntensity, 50);
                gGlobeLampLight.position.copy(globeLamp.position);
                gGlobeLampLight.castShadow = true;
                gGlobeLampLight.shadow.mapSize.width = 512;
                gGlobeLampLight.shadow.mapSize.height = 512;
                gGlobeLampLight.visible = gGlobeLampIntensity > 0;
                gThreeScene.add(gGlobeLampLight);
                
                // Set initial visibility and enabled state based on intensity
                globeLamp.visible = gGlobeLampIntensity > 0;
                
                // Create sphere obstacle for boid avoidance
                var globeLampObstacleRadius = 3.0; // Radius that covers the lamp
                gGlobeLampObstacle = new SphereObstacle(
                    globeLampObstacleRadius,
                    new THREE.Vector3(globeLamp.position.x, globeLamp.position.y, globeLamp.position.z)
                );
                // Make the obstacle invisible and set enabled state
                if (gGlobeLampObstacle.mesh) {
                    gGlobeLampObstacle.mesh.visible = false;
                }
                gGlobeLampObstacle.enabled = gGlobeLampIntensity > 0;
                gObstacles.push(gGlobeLampObstacle);
                
                console.log('Globe Lamp model loaded successfully');
            },
            function(xhr) {
                console.log('Globe Lamp model: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function(error) {
                console.error('Error loading Globe Lamp model:', error);
            }
        );
    }
    
    // Load Brancusi Bird model using GLTFLoader
    if (typeof THREE.GLTFLoader !== 'undefined') {
        var birdLoader = new THREE.GLTFLoader(gLoadingManager);
        birdLoader.load(
            'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/Brancusi_Bird.gltf',
            function(gltf) {
                var bird = gltf.scene;
                
                // Position object high for drop animation
                bird.position.set(gBirdInitialX, gBirdStartY, gBirdInitialZ);
                
                // Scale appropriately
                bird.scale.set(1, 1, 1);

                // rotate to face forward
                bird.rotation.y = -0.5 * Math.PI; 
                
                // Remove any imported lights
                var lightsToRemove = [];
                bird.traverse(function(child) {
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
                bird.traverse(function(child) {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        child.userData.isDraggableBird = true;
                    }
                });
                
                gThreeScene.add(bird);
                gBird = bird; // Store global reference
                
                // Create cylinder obstacle for boid avoidance (collision only, no visuals)
                var birdObstacleRadius = 1.5; // Radius of cylinder
                var birdObstacleHeight = 8.0; // Height of cylinder
                gBirdObstacle = new CylinderObstacle(
                    birdObstacleRadius,
                    birdObstacleHeight,
                    new THREE.Vector3(bird.position.x, bird.position.y + birdObstacleHeight / 2, bird.position.z),
                    { x: 0, y: 0, z: 0 },
                    false, // skipTori
                    true // collisionOnly - no visual geometry
                );
                gObstacles.push(gBirdObstacle);
                gBirdDropping = true; // Enable drop animation
                
                console.log('Brancusi Bird model loaded successfully');
            },
            function(xhr) {
                console.log('Brancusi Bird model: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function(error) {
                console.error('Error loading Brancusi Bird model:', error);
            }
        );
    }
    
    // Load Koons Dog sculpture using GLTFLoader
    if (typeof THREE.GLTFLoader !== 'undefined') {
        var koonsDogLoader = new THREE.GLTFLoader(gLoadingManager);
        koonsDogLoader.load(
            'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/KoonsDog.gltf',
            function(gltf) {
                var koonsDog = gltf.scene;
                
                // Store a clone as template for boid geometry BEFORE any transformations
                gKoonsDogTemplate = koonsDog.clone();
                
                // Position on floor
                koonsDog.position.set(gKoonsDogInitialX, 0, gKoonsDogInitialZ);
                
                // Scale appropriately
                koonsDog.scale.set(1, 1, 1);
                
                // Rotate to face forward (model points along +Z, rotate 90 degrees to face -X direction)
                koonsDog.rotation.y = 0.5 * Math.PI;
                
                // Remove any imported lights
                var lightsToRemove = [];
                koonsDog.traverse(function(child) {
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
                koonsDog.traverse(function(child) {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        child.userData.isDraggableKoonsDog = true;
                    }
                });
                
                gThreeScene.add(koonsDog);
                gKoonsDog = koonsDog; // Store global reference
                
                // Create sphere obstacle for boid avoidance
                var koonsDogObstacleRadius = 2.5; // Radius that covers the sculpture
                gKoonsDogObstacle = new SphereObstacle(
                    koonsDogObstacleRadius,
                    new THREE.Vector3(koonsDog.position.x, koonsDog.position.y + 2, koonsDog.position.z)
                );
                // Make the obstacle invisible
                if (gKoonsDogObstacle.mesh) {
                    gKoonsDogObstacle.mesh.visible = false;
                }
                gObstacles.push(gKoonsDogObstacle);
                
                console.log('Koons Dog sculpture loaded successfully');
            },
            function(xhr) {
                console.log('Koons Dog sculpture: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function(error) {
                console.error('Error loading Koons Dog sculpture:', error);
            }
        );
    }
    
    // Load Sky Pig model using GLTFLoader
    if (typeof THREE.GLTFLoader !== 'undefined') {
        var skyPigLoader = new THREE.GLTFLoader(gLoadingManager);
        skyPigLoader.load(
            'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/skyPig.gltf',
            function(gltf) {
                var skyPig = gltf.scene;
                
                // Position on floor initially (for rise animation)
                skyPig.position.set(15, gSkyPigStartY, -15);
                
                // Start tiny for growth animation
                skyPig.scale.set(gSkyPigStartScale, gSkyPigStartScale, gSkyPigStartScale);
                
                // Rotate to face forward
                skyPig.rotation.y = 0;
                
                // Remove any imported lights
                var lightsToRemove = [];
                skyPig.traverse(function(child) {
                    if (child.isLight) {
                        lightsToRemove.push(child);
                    }
                });
                lightsToRemove.forEach(function(light) {
                    if (light.parent) {
                        light.parent.remove(light);
                    }
                });
                
                gThreeScene.add(skyPig);
                gSkyPig = skyPig; // Store global reference
                
                // Create sphere obstacle for boid avoidance
                var skyPigObstacleRadius = 3.0;
                gSkyPigObstacle = new SphereObstacle(
                    skyPigObstacleRadius,
                    new THREE.Vector3(15, gSkyPigStartY, -15)
                );
                
                // Enable shadows and mark meshes as draggable with obstacle reference
                skyPig.traverse(function(child) {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        child.userData.isDraggableSkyPig = true;
                        child.userData.skyPigObstacle = gSkyPigObstacle;
                    }
                });
                // Make the obstacle invisible
                if (gSkyPigObstacle.mesh) {
                    gSkyPigObstacle.mesh.visible = false;
                }
                gSkyPigObstacle.enabled = false; // Disable until rise animation completes
                gObstacles.push(gSkyPigObstacle);
                
                // Start rise animation after a delay
                setTimeout(function() {
                    gSkyPigRising = true;
                }, 1000); // Wait 1 second before rising
                
                console.log('Sky Pig model loaded successfully');
            },
            function(xhr) {
                console.log('Sky Pig model: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function(error) {
                console.error('Error loading Sky Pig model:', error);
            }
        );
    }
    
    // Load Tube Star, Heart, Moon, Clover, and Diamond models using GLTFLoader for hanging decorations
    if (typeof THREE.GLTFLoader !== 'undefined') {
        var starTemplate, heartTemplate, moonTemplate, cloverTemplate, diamondTemplate;
        var modelsLoaded = 0;
        var totalModels = 5;
        
        function onModelLoaded() {
            modelsLoaded++;
            if (modelsLoaded === totalModels) {
                createHangingOrnaments();
            }
        }
        
        function createHangingOrnaments() {
            // Create hanging ornaments with random properties
            var numStars = 25;
            var ceilingY = 2 * WORLD_HEIGHT; // Wire extends to 2x world height
            var minY = WORLD_HEIGHT * 0.8; // Upper part of room
            var maxY = WORLD_HEIGHT * 1.5; // Slightly below ceiling
            var startYAboveCeiling = WORLD_HEIGHT + 12; // Start above ceiling
            var minStarDistance = 6; // Minimum distance between stars (about 2 object sizes)
            var starPositions = []; // Track placed star positions
            
            // Obstacle positions to avoid
            var columnPos = {x: 26, z: -26}; // Column XZ position (updated to match gColumnInitialX/Z)
            var columnRadius = 2.5;
            var columnAvoidRadius = 4; // Avoid area above column
            var spherePos = {x: -10, y: 15, z: 18}; // Sphere obstacle position (updated)
            var sphereRadius = 3;
            var sphereAvoidRadius = 5; // Avoid area near sphere
            var torusPos = {x: 11, y: 10, z: 0}; // Torus obstacle position
            var torusMajorRadius = 6;
            var torusAvoidRadius = 8; // Avoid area near torus
            
            // Material for wires
            var wireMaterial = new THREE.MeshPhongMaterial({
                color: 0x222222,
                shininess: 10
            });
            
            // Create array to determine which model to use for each ornament
            // 5 of each type: stars (0-4), hearts (5-9), moons (10-14), clovers (15-19), diamonds (20-24)
            var ornamentTypes = [];
            var modelTypes = ['star', 'heart', 'moon', 'clover', 'diamond'];
            for (var i = 0; i < numStars; i++) {
                ornamentTypes[i] = modelTypes[Math.floor(i / 5)];
            }
            
            for (var i = 0; i < numStars; i++) {
                // Choose the appropriate model template
                var template;
                if (ornamentTypes[i] === 'moon') {
                    template = moonTemplate;
                } else if (ornamentTypes[i] === 'heart') {
                    template = heartTemplate;
                } else if (ornamentTypes[i] === 'clover') {
                    template = cloverTemplate;
                } else if (ornamentTypes[i] === 'diamond') {
                    template = diamondTemplate;
                } else {
                    template = starTemplate;
                }
                
                // Safety check: if template is undefined, skip this ornament
                if (!template) {
                    continue;
                }
                
                var star = template.clone();
                
                // Find a position that doesn't overlap with existing stars
                var x, targetY, z;
                var validPosition = false;
                var maxAttempts = 50;
                var attempt = 0;
                
                while (!validPosition && attempt < maxAttempts) {
                    // Random position in upper 1/3 of room (this is target)
                    x = (Math.random() * 2 - 1) * (WORLD_WIDTH - 3); // Leave margin from walls
                    targetY = minY + Math.random() * (maxY - minY);
                    z = (Math.random() * 2 - 1) * (WORLD_DEPTH - 3); // Leave margin from walls
                    
                    validPosition = true;
                    
                    // Check if above column (XZ distance)
                    var dxColumn = x - columnPos.x;
                    var dzColumn = z - columnPos.z;
                    var distToColumn = Math.sqrt(dxColumn*dxColumn + dzColumn*dzColumn);
                    if (distToColumn < columnAvoidRadius) {
                        validPosition = false;
                        attempt++;
                        continue;
                    }
                    
                    // Check if near sphere obstacle (3D distance)
                    var dxSphere = x - spherePos.x;
                    var dySphere = targetY - spherePos.y;
                    var dzSphere = z - spherePos.z;
                    var distToSphere = Math.sqrt(dxSphere*dxSphere + dySphere*dySphere + dzSphere*dzSphere);
                    if (distToSphere < sphereAvoidRadius) {
                        validPosition = false;
                        attempt++;
                        continue;
                    }
                    
                    // Check if near torus obstacle (3D distance)
                    var dxTorus = x - torusPos.x;
                    var dyTorus = targetY - torusPos.y;
                    var dzTorus = z - torusPos.z;
                    var distToTorus = Math.sqrt(dxTorus*dxTorus + dyTorus*dyTorus + dzTorus*dzTorus);
                    if (distToTorus < torusAvoidRadius) {
                        validPosition = false;
                        attempt++;
                        continue;
                    }
                    
                    // Check distance to all existing stars
                    for (var j = 0; j < starPositions.length; j++) {
                        var dx = x - starPositions[j].x;
                        var dy = targetY - starPositions[j].y;
                        var dz = z - starPositions[j].z;
                        var distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
                        
                        if (distance < minStarDistance) {
                            validPosition = false;
                            break;
                        }
                    }
                    
                    attempt++;
                }
                
                // Store this position
                starPositions.push({x: x, y: targetY, z: z});
                
                // Start above ceiling for drop animation
                star.position.set(x, startYAboveCeiling, z);
                
                // Random scale with limited variability (0.85 to 1.15)
                var scale = 0.7 + Math.random() * 0.6;
                star.scale.set(scale, scale, scale);
                
                // Random rotation about y-axis only
                star.rotation.y = Math.random() * Math.PI * 2;
                
                // Ensure shadows on clone
                star.traverse(function(child) {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                gThreeScene.add(star);
                gHangingStars.push(star);
                
                // Create thin wire from top of star up to ceiling
                // Wire connects to model's origin (0,0,0)
                var starHeight = 0; // No offset - connect to model origin
                var starTop = startYAboveCeiling;
                var wireLength = ceilingY - starTop;
                var wireRadius = 0.015; // Very thin wire
                // Create unit-length cylinder for efficiency (will be scaled)
                var wireGeometry = new THREE.CylinderGeometry(wireRadius, wireRadius, 1, 8);
                var wire = new THREE.Mesh(wireGeometry, wireMaterial);
                
                // Position wire from top of star to ceiling
                wire.position.set(x, starTop + wireLength / 2, z);
                wire.scale.set(1, wireLength, 1); // Scale to correct length
                wire.castShadow = true;
                wire.receiveShadow = true;
                
                gThreeScene.add(wire);
                
                // Create truncated upside-down cone at hanging point
                var coneHeight = 0.5;
                var coneTopRadius = 0.3; // Wider at top
                var coneBottomRadius = 0.05; // Narrow at bottom (where wire connects)
                var coneGeometry = new THREE.CylinderGeometry(coneTopRadius, coneBottomRadius, coneHeight, 16);
                var coneMaterial = new THREE.MeshStandardMaterial({
                    color: 0x444444,
                    shininess: 30,
                    emissive: 0xffffff,
                    emissiveIntensity: 0.1,
                });
                var cone = new THREE.Mesh(coneGeometry, coneMaterial);
                
                // Position at the top of the wire (ceiling attachment point)
                // Cone center should be at ceilingY + coneHeight/2 so bottom aligns with wire top
                cone.position.set(x, ceilingY + coneHeight / 2, z);
                cone.castShadow = true;
                cone.receiveShadow = true;
                
                gThreeScene.add(cone);
                
                // Create sphere obstacle for boid avoidance
                // Adjust parameters based on ornament type
                var baseRadius = 1.68; // Base radius multiplier (40% larger than original 1.2)
                var radiusMultiplier = 1.0;
                var yOffsetMultiplier = 1.0;
                
                if (ornamentTypes[i] === 'heart') {
                    // Hearts: raise by 1/4 radius
                    yOffsetMultiplier = 0.75;
                } else if (ornamentTypes[i] === 'moon') {
                    // Moons: increase radius by 10%, lower by 10% of radius, then raise by 1/8 radius
                    radiusMultiplier = 1.10;
                    yOffsetMultiplier = 0.975;
                } else if (ornamentTypes[i] === 'clover') {
                    // Clovers: increase radius by 20%, lower by 10% of radius, then raise by 1/8 radius
                    radiusMultiplier = 1.20;
                    yOffsetMultiplier = 0.975;
                }
                
                var ornamentObstacleRadius = baseRadius * radiusMultiplier * scale;
                var ornamentObstacle = new SphereObstacle(
                    ornamentObstacleRadius,
                    new THREE.Vector3(x, startYAboveCeiling - ornamentObstacleRadius * yOffsetMultiplier, z) // Lower than origin
                );
                // Make the obstacle invisible
                if (ornamentObstacle.mesh) {
                    ornamentObstacle.mesh.visible = false;
                }
                gObstacles.push(ornamentObstacle);
                
                // Create point light for each ornament with color based on type
                var ornamentLightColor = new THREE.Color();
                if (ornamentTypes[i] === 'star') {
                    ornamentLightColor.setHSL(180 / 360, 0.8, 0.6); // Cyan
                } else if (ornamentTypes[i] === 'heart') {
                    ornamentLightColor.setHSL(320 / 360, 0.9, 0.6); // Pink
                } else if (ornamentTypes[i] === 'moon') {
                    ornamentLightColor.setHSL(0 / 360, 0.0, 0.6); // White (desaturated)
                } else if (ornamentTypes[i] === 'clover') {
                    ornamentLightColor.setHSL(120 / 360, 0.8, 0.6); // Green
                } else if (ornamentTypes[i] === 'diamond') {
                    ornamentLightColor.setHSL(30 / 360, 0.7, 0.6); // Orange
                }
                
                var ornamentPointLight = new THREE.PointLight(ornamentLightColor, gOrnamentLightIntensity, gOrnamentLightFalloff, 2);
                ornamentPointLight.position.set(x, startYAboveCeiling, z);
                ornamentPointLight.visible = gOrnamentLightIntensity > 0;
                gThreeScene.add(ornamentPointLight);
                
                // Store animation data with staggered delay
                gStarAnimData.push({
                    star: star,
                    wire: wire,
                    cone: cone,
                    x: x,
                    z: z,
                    initialX: x, // Store initial position for world resize scaling
                    initialZ: z, // Store initial position for world resize scaling
                    targetY: targetY,
                    initialTargetY: targetY, // Store initial Y for world resize scaling
                    startY: startYAboveCeiling,
                    timer: 0,
                    delay: 5 + i * 0.15, // Wait 10 seconds, then stagger by 0.15 seconds each
                    animating: true,
                    scale: scale,
                    starHeight: starHeight,
                    coneHeight: coneHeight,
                    obstacle: ornamentObstacle, // Reference to the obstacle
                    pointLight: ornamentPointLight, // Reference to the point light
                    yOffsetMultiplier: yOffsetMultiplier, // Store offset multiplier for updates
                    // Sway physics
                    offsetX: 0,
                    offsetZ: 0,
                    velX: (Math.random() - 0.5) * 2.0, // Random initial velocity
                    velZ: (Math.random() - 0.5) * 2.0,
                    swayPhase: Math.random() * 10, // Random phase for variation
                    // Twist physics
                    angularVel: (Math.random() - 0.5) * 4.0, // Random initial twist rate
                    baseRotationY: star.rotation.y,
                    twistPhase: Math.random() * 10 // Random phase for twist driving
                });
            }
            
            console.log('Hanging ornaments created successfully - ' + numStars + ' ornaments (5 stars, 5 hearts, 5 moons, 5 clovers, 5 diamonds)');
        }
        
        // Load Tube Star model
        var starLoader = new THREE.GLTFLoader(gLoadingManager);
        starLoader.load(
            'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/tubeStar.gltf',
            function(gltf) {
                starTemplate = gltf.scene;
                
                // Remove any imported lights
                var lightsToRemove = [];
                starTemplate.traverse(function(child) {
                    if (child.isLight) {
                        lightsToRemove.push(child);
                    }
                });
                lightsToRemove.forEach(function(light) {
                    if (light.parent) {
                        light.parent.remove(light);
                    }
                });
                
                // Enable shadows for template
                starTemplate.traverse(function(child) {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                console.log('Tube Star model loaded successfully');
                onModelLoaded();
            },
            function(xhr) {
                console.log('Tube Star model: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function(error) {
                console.error('Error loading Tube Star model:', error);
            }
        );
        
        // Load Tube Heart model
        var heartLoader = new THREE.GLTFLoader(gLoadingManager);
        heartLoader.load(
            'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/tubeHeart.gltf',
            function(gltf) {
                heartTemplate = gltf.scene;
                
                // Remove any imported lights
                var lightsToRemove = [];
                heartTemplate.traverse(function(child) {
                    if (child.isLight) {
                        lightsToRemove.push(child);
                    }
                });
                lightsToRemove.forEach(function(light) {
                    if (light.parent) {
                        light.parent.remove(light);
                    }
                });
                
                // Enable shadows for template
                heartTemplate.traverse(function(child) {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                console.log('Tube Heart model loaded successfully');
                onModelLoaded();
            },
            function(xhr) {
                console.log('Tube Heart model: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function(error) {
                console.error('Error loading Tube Heart model:', error);
            }
        );
        
        // Load Tube Moon model
        var moonLoader = new THREE.GLTFLoader(gLoadingManager);
        moonLoader.load(
            'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/tubeMoon.gltf',
            function(gltf) {
                moonTemplate = gltf.scene;
                
                // Remove any imported lights
                var lightsToRemove = [];
                moonTemplate.traverse(function(child) {
                    if (child.isLight) {
                        lightsToRemove.push(child);
                    }
                });
                lightsToRemove.forEach(function(light) {
                    if (light.parent) {
                        light.parent.remove(light);
                    }
                });
                
                // Enable shadows for template
                moonTemplate.traverse(function(child) {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                console.log('Tube Moon model loaded successfully');
                onModelLoaded();
            },
            function(xhr) {
                console.log('Tube Moon model: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function(error) {
                console.error('Error loading Tube Moon model:', error);
            }
        );
        
        // Load Tube Clover model
        var cloverLoader = new THREE.GLTFLoader(gLoadingManager);
        cloverLoader.load(
            'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/tubeClover.gltf',
            function(gltf) {
                cloverTemplate = gltf.scene;
                
                // Remove any imported lights
                var lightsToRemove = [];
                cloverTemplate.traverse(function(child) {
                    if (child.isLight) {
                        lightsToRemove.push(child);
                    }
                });
                lightsToRemove.forEach(function(light) {
                    if (light.parent) {
                        light.parent.remove(light);
                    }
                });
                
                // Enable shadows for template
                cloverTemplate.traverse(function(child) {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                console.log('Tube Clover model loaded successfully');
                onModelLoaded();
            },
            function(xhr) {
                console.log('Tube Clover model: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function(error) {
                console.error('Error loading Tube Clover model:', error);
            }
        );
        
        // Load Tube Diamond model
        var diamondLoader = new THREE.GLTFLoader(gLoadingManager);
        diamondLoader.load(
            'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/tubeDiamond.gltf',
            function(gltf) {
                diamondTemplate = gltf.scene;
                
                // Remove any imported lights
                var lightsToRemove = [];
                diamondTemplate.traverse(function(child) {
                    if (child.isLight) {
                        lightsToRemove.push(child);
                    }
                });
                lightsToRemove.forEach(function(light) {
                    if (light.parent) {
                        light.parent.remove(light);
                    }
                });
                
                // Enable shadows for template
                diamondTemplate.traverse(function(child) {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                console.log('Tube Diamond model loaded successfully');
                onModelLoaded();
            },
            function(xhr) {
                console.log('Tube Diamond model: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function(error) {
                console.error('Error loading Tube Diamond model:', error);
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
        emissiveIntensity: 0.0,
        metalness: 0,
        roughness: 1
    });
    
    gWalls.front = new THREE.Mesh(
        new THREE.PlaneGeometry(boxSize.x * 2, boxSize.y),
        frontWallMaterial
    );
    // Start horizontal, rotating around bottom edge at z=boxSize.z
    gWalls.front.rotation.x = gWallAnimation.front.startRotation;
    gWalls.front.position.set(
        0,
        (boxSize.y / 2) * Math.cos(gWallAnimation.front.startRotation),
        boxSize.z + (boxSize.y / 2) * Math.sin(gWallAnimation.front.startRotation)
    );
    gWalls.front.receiveShadow = true;
    gThreeScene.add(gWalls.front);
    
    // Load marble texture for white wall squares using Image with CORS
    var marbleImage = new Image();
    marbleImage.crossOrigin = 'anonymous'; // Enable CORS before setting src
    marbleImage.onload = function() {
        gMarbleTexture = marbleImage;
        // Update all wall canvases with the marble texture
        updateWallsWithMarble();
    };
    marbleImage.onerror = function(err) {
        console.error('Error loading marble texture:', err);
    };
    marbleImage.src = 'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/oysterWhite_marble_square.jpg';
    
    // Load marble texture for platonic solid pedestals using TextureLoader with CORS
    var pedestalTextureLoader = new THREE.TextureLoader();
    pedestalTextureLoader.setCrossOrigin('anonymous');
    pedestalTextureLoader.load(
        'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/marble_pedestal.jpg',
        function(texture) {
            // Rotate texture 90 degrees
            texture.center.set(0.5, 0.5);
            texture.rotation = Math.PI / 2; // 90 degrees in radians
            
            gPedestalMarbleTexture = texture;
            console.log('Pedestal marble texture loaded successfully');
            // Update pedestals if they already exist
            if (gPedestalAnimData && gPedestalAnimData.length > 0) {
                gPedestalAnimData.forEach(function(data) {
                    if (data.pedestal && data.pedestal.material) {
                        data.pedestal.material.map = texture;
                        data.pedestal.material.needsUpdate = true;
                    }
                });
            }
        },
        undefined,
        function(err) {
            console.error('Error loading pedestal marble texture:', err);
        }
    );
    
    // Load marble texture for fluted column using TextureLoader with CORS
    var columnTextureLoader = new THREE.TextureLoader();
    columnTextureLoader.setCrossOrigin('anonymous');
    columnTextureLoader.load(
        'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/marble_column.jpg',
        function(texture) {
            gColumnMarbleTexture = texture;
            console.log('Column marble texture loaded successfully');
            // Update column if it already exists
            if (gColumnObstacle && gColumnObstacle.columnSections) {
                gColumnObstacle.columnSections.forEach(function(section) {
                    if (section.material) {
                        section.material.map = texture;
                        section.material.needsUpdate = true;
                    }
                });
            }
        },
        undefined,
        function(err) {
            console.error('Error loading column marble texture:', err);
        }
    );
    
    // Function to update wall canvases with marble texture
    function updateWallsWithMarble() {
        if (!gMarbleTexture) return;
        
        // Redraw back wall with marble texture
        for (var i = 0; i < 2; i++) {
            for (var j = 0; j < 2; j++) {
                if ((i + j) % 2 !== 0) {
                    backWallCtx.drawImage(gMarbleTexture, i * wallTileSize, j * wallTileSize, wallTileSize, wallTileSize);
                }
            }
        }
        // Redraw strokes
        backWallCtx.strokeStyle = '#333333';
        backWallCtx.lineWidth = 4;
        for (var i = 0; i < 2; i++) {
            for (var j = 0; j < 2; j++) {
                backWallCtx.strokeRect(i * wallTileSize, j * wallTileSize, wallTileSize, wallTileSize);
            }
        }
        backWallTexture.needsUpdate = true;
        
        // Redraw left wall with marble texture
        for (var i = 0; i < 2; i++) {
            for (var j = 0; j < 2; j++) {
                if ((i + j) % 2 !== 0) {
                    leftWallCtx.drawImage(gMarbleTexture, i * wallTileSize, j * wallTileSize, wallTileSize, wallTileSize);
                }
            }
        }
        // Redraw strokes
        leftWallCtx.strokeStyle = '#333333';
        leftWallCtx.lineWidth = 4;
        for (var i = 0; i < 2; i++) {
            for (var j = 0; j < 2; j++) {
                leftWallCtx.strokeRect(i * wallTileSize, j * wallTileSize, wallTileSize, wallTileSize);
            }
        }
        leftWallTexture.needsUpdate = true;
        
        // Redraw right wall with marble texture
        for (var i = 0; i < 2; i++) {
            for (var j = 0; j < 2; j++) {
                if ((i + j) % 2 !== 0) {
                    rightWallCtx.drawImage(gMarbleTexture, i * wallTileSize, j * wallTileSize, wallTileSize, wallTileSize);
                }
            }
        }
        // Redraw strokes
        rightWallCtx.strokeStyle = '#333333';
        rightWallCtx.lineWidth = 4;
        for (var i = 0; i < 2; i++) {
            for (var j = 0; j < 2; j++) {
                rightWallCtx.strokeRect(i * wallTileSize, j * wallTileSize, wallTileSize, wallTileSize);
            }
        }
        rightWallTexture.needsUpdate = true;
    }
    
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
                // White panel - will be updated with marble texture when loaded
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
    
    gWalls.back = new THREE.Mesh(
        new THREE.PlaneGeometry(boxSize.x * 2, boxSize.y),
        new THREE.MeshPhongMaterial({ 
            map: backWallTexture,
            transparent: true, 
            opacity: wallOpacity,
            side: THREE.BackSide
        })
    );
    gWalls.back.rotation.y = Math.PI;
    // Start horizontal, rotating around bottom edge at z=-boxSize.z
    gWalls.back.rotation.x = gWallAnimation.back.startRotation;
    gWalls.back.position.set(
        0,
        (boxSize.y / 2) * Math.cos(gWallAnimation.back.startRotation),
        -boxSize.z + (boxSize.y / 2) * Math.sin(gWallAnimation.back.startRotation)
    );
    gWalls.back.receiveShadow = true;
    gThreeScene.add(gWalls.back);
    
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
                // White panel - will be updated with marble texture when loaded
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
    
    gWalls.left = new THREE.Mesh(
        new THREE.PlaneGeometry(boxSize.z * 2, boxSize.y),
        new THREE.MeshPhongMaterial({
            map: leftWallTexture,
            transparent: true, 
            opacity: wallOpacity,
            side: THREE.BackSide
        })
    );
    // Start horizontal, rotating around bottom edge at x=-boxSize.x
    gWalls.left.rotation.order = 'YXZ'; // Apply Y rotation first, then X
    gWalls.left.rotation.y = -Math.PI / 2;
    gWalls.left.rotation.x = gWallAnimation.left.startRotation;
    gWalls.left.position.set(
        -boxSize.x - (boxSize.y / 2) * Math.sin(gWallAnimation.left.startRotation),
        (boxSize.y / 2) * Math.cos(gWallAnimation.left.startRotation),
        0
    );
    gWalls.left.receiveShadow = true;
    gThreeScene.add(gWalls.left);
    
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
    painting2.position.set(-boxSize.x + 0.3, painting2Y + gPaintingDropStartY, 0);
    painting2.rotation.y = Math.PI / 2;
    painting2.receiveShadow = true;
    painting2.castShadow = true;
    gThreeScene.add(painting2);
    gLeftWallPainting = painting2; // Store global reference
    
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
        painting2Y + painting2Height / 2 + frame2Thickness / 2 + gPaintingDropStartY,
        0
    );
    frame2Top.rotation.y = Math.PI / 2;
    frame2Top.castShadow = true;
    frame2Top.receiveShadow = true;
    gThreeScene.add(frame2Top);
    gLeftWallFramePieces.push(frame2Top);
    
    // Bottom frame
    var frame2Bottom = new THREE.Mesh(
        new THREE.BoxGeometry(painting2Width + frame2Thickness * 2, frame2Thickness, frame2Depth),
        frame2Material
    );
    frame2Bottom.position.set(
        -boxSize.x + 0.3 + frame2Depth / 2,
        painting2Y - painting2Height / 2 - frame2Thickness / 2 + gPaintingDropStartY,
        0
    );
    frame2Bottom.rotation.y = Math.PI / 2;
    frame2Bottom.castShadow = true;
    frame2Bottom.receiveShadow = true;
    gThreeScene.add(frame2Bottom);
    gLeftWallFramePieces.push(frame2Bottom);
    
    // Left frame
    var frame2Left = new THREE.Mesh(
        new THREE.BoxGeometry(frame2Thickness, painting2Height, frame2Depth),
        frame2Material
    );
    frame2Left.position.set(
        -boxSize.x + 0.3 + frame2Depth / 2,
        painting2Y + gPaintingDropStartY,
        -painting2Width / 2 - frame2Thickness / 2
    );
    frame2Left.rotation.y = Math.PI / 2;
    frame2Left.castShadow = true;
    frame2Left.receiveShadow = true;
    gThreeScene.add(frame2Left);
    gLeftWallFramePieces.push(frame2Left);
    
    // Right frame
    var frame2Right = new THREE.Mesh(
        new THREE.BoxGeometry(frame2Thickness, painting2Height, frame2Depth),
        frame2Material
    );
    frame2Right.position.set(
        -boxSize.x + 0.3 + frame2Depth / 2,
        painting2Y + gPaintingDropStartY,
        painting2Width / 2 + frame2Thickness / 2
    );
    frame2Right.rotation.y = Math.PI / 2;
    frame2Right.castShadow = true;
    frame2Right.receiveShadow = true;
    gThreeScene.add(frame2Right);
    gLeftWallFramePieces.push(frame2Right);
    
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
                // White panel - will be updated with marble texture when loaded
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
    
    gWalls.right = new THREE.Mesh(
        new THREE.PlaneGeometry(boxSize.z * 2, boxSize.y),
        new THREE.MeshPhongMaterial({ 
            map: rightWallTexture,
            transparent: true, 
            opacity: wallOpacity,
            side: THREE.BackSide
        })
    );
    // Start horizontal, rotating around bottom edge at x=boxSize.x
    gWalls.right.rotation.order = 'YXZ'; // Apply Y rotation first, then X
    gWalls.right.rotation.y = Math.PI / 2;
    gWalls.right.rotation.x = -gWallAnimation.right.startRotation;
    gWalls.right.position.set(
        boxSize.x - (boxSize.y / 2) * Math.sin(gWallAnimation.right.startRotation),
        (boxSize.y / 2) * Math.cos(gWallAnimation.right.startRotation),
        0
    );
    gWalls.right.receiveShadow = true;
    gThreeScene.add(gWalls.right);
    
    // Add framed paintings on right wall (Miro and Dali with different aspect ratios)
    var paintingY = boxSize.y / 2 + 1; // Vertical position
    var duchampPaintingY = boxSize.y / 2; // Lower position for Duchamp paintings
    var frameThickness = 0.3;
    var frameDepth = 0.15;
    var paintingWallX = boxSize.x - 0.3; // X position on right wall
    
    gPaintingBaseY = paintingY; // Store base Y position
    gDuchampPaintingBaseY = duchampPaintingY; // Store Duchamp base Y position
    
    // Create frame material (wood-like)
    var frameMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x5a3a1a,
        metalness: 0.1,
        roughness: 0.7
    });
    
    // ===== MIRO PAINTING GROUP (Landscape 16x12) =====
    gMiroPaintingGroup = new THREE.Group();
    var miroWidth = 16;
    var miroHeight = 12;
    
    // Create Miro painting plane
    var miroPaintingMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x000000,
        side: THREE.FrontSide,
        shadowSide: THREE.FrontSide,
        emissive: 0x000000,
        emissiveIntensity: 0,
        metalness: 0,
        roughness: 1,
        transparent: true,
        opacity: 1
    });
    
    // Load Miro painting texture
    var miroPaintingTexture = new THREE.TextureLoader().load(
        'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/Joan_Miro_Untitled.webp',
        function(texture) {
            miroPaintingMaterial.map = texture;
            miroPaintingMaterial.emissiveMap = texture;
            miroPaintingMaterial.color.setHex(0xffffff);
            miroPaintingMaterial.emissive.setHex(0xffffff);
            miroPaintingMaterial.emissiveIntensity = 0.3;
            miroPaintingMaterial.needsUpdate = true;
        },
        undefined,
        function(err) {
            console.error('Error loading Joan_Miro_Untitled.webp:', err);
            console.log('Using fallback color for Miro painting');
        }
    );
    
    var miroPainting = new THREE.Mesh(
        new THREE.PlaneGeometry(miroWidth, miroHeight),
        miroPaintingMaterial
    );
    miroPainting.position.set(0, 0, -frameDepth / 2); // Same plane as frames
    miroPainting.receiveShadow = true;
    miroPainting.castShadow = true;
    gMiroPaintingGroup.add(miroPainting);
    
    // Miro frame pieces (relative to group origin)
    var miroFrameTop = new THREE.Mesh(
        new THREE.BoxGeometry(miroWidth + frameThickness * 2, frameThickness, frameDepth),
        frameMaterial
    );
    miroFrameTop.position.set(0, miroHeight / 2 + frameThickness / 2, -frameDepth / 2);
    miroFrameTop.castShadow = true;
    miroFrameTop.receiveShadow = true;
    gMiroPaintingGroup.add(miroFrameTop);
    
    var miroFrameBottom = new THREE.Mesh(
        new THREE.BoxGeometry(miroWidth + frameThickness * 2, frameThickness, frameDepth),
        frameMaterial
    );
    miroFrameBottom.position.set(0, -miroHeight / 2 - frameThickness / 2, -frameDepth / 2);
    miroFrameBottom.castShadow = true;
    miroFrameBottom.receiveShadow = true;
    gMiroPaintingGroup.add(miroFrameBottom);
    
    var miroFrameLeft = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness, miroHeight, frameDepth),
        frameMaterial
    );
    miroFrameLeft.position.set(-miroWidth / 2 - frameThickness / 2, 0, -frameDepth / 2);
    miroFrameLeft.castShadow = true;
    miroFrameLeft.receiveShadow = true;
    gMiroPaintingGroup.add(miroFrameLeft);
    
    var miroFrameRight = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness, miroHeight, frameDepth),
        frameMaterial
    );
    miroFrameRight.position.set(miroWidth / 2 + frameThickness / 2, 0, -frameDepth / 2);
    miroFrameRight.castShadow = true;
    miroFrameRight.receiveShadow = true;
    gMiroPaintingGroup.add(miroFrameRight);
    
    // Position and orient group on wall (start high for drop animation)
    gMiroPaintingGroup.position.set(paintingWallX, paintingY + gPaintingDropStartY, 0);
    gMiroPaintingGroup.rotation.y = -Math.PI / 2;
    gMiroPaintingGroup.visible = true; // Miro is the initial painting
    gThreeScene.add(gMiroPaintingGroup);
    
    // ===== DALI PAINTING GROUP (Portrait 9x12) =====
    gDaliPaintingGroup = new THREE.Group();
    var daliWidth = 9;
    var daliHeight = 12;
    
    // Create Dali painting plane
    var daliPaintingMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x000000,
        side: THREE.FrontSide,
        shadowSide: THREE.FrontSide,
        emissive: 0x000000,
        emissiveIntensity: 0,
        metalness: 0,
        roughness: 1,
        transparent: true,
        opacity: 1
    });
    
    // Load Dali painting texture
    var daliPaintingTexture = new THREE.TextureLoader().load(
        'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/Salvador_Dali_Galatea_of_the_Spheres.jpg',
        function(texture) {
            daliPaintingMaterial.map = texture;
            daliPaintingMaterial.emissiveMap = texture;
            daliPaintingMaterial.color.setHex(0xffffff);
            daliPaintingMaterial.emissive.setHex(0xffffff);
            daliPaintingMaterial.emissiveIntensity = 0.3;
            daliPaintingMaterial.needsUpdate = true;
        },
        undefined,
        function(err) {
            console.error('Error loading Salvador_Dali_Galatea_of_the_Spheres.jpg:', err);
            console.log('Using fallback color for Dali painting');
        }
    );
    
    var daliPainting = new THREE.Mesh(
        new THREE.PlaneGeometry(daliWidth, daliHeight),
        daliPaintingMaterial
    );
    daliPainting.position.set(0, 0, -frameDepth / 2); // Same plane as frames
    daliPainting.receiveShadow = true;
    daliPainting.castShadow = true;
    gDaliPaintingGroup.add(daliPainting);
    
    // Dali frame pieces (relative to group origin)
    var daliFrameTop = new THREE.Mesh(
        new THREE.BoxGeometry(daliWidth + frameThickness * 2, frameThickness, frameDepth),
        frameMaterial
    );
    daliFrameTop.position.set(0, daliHeight / 2 + frameThickness / 2, -frameDepth / 2);
    daliFrameTop.castShadow = true;
    daliFrameTop.receiveShadow = true;
    gDaliPaintingGroup.add(daliFrameTop);
    
    var daliFrameBottom = new THREE.Mesh(
        new THREE.BoxGeometry(daliWidth + frameThickness * 2, frameThickness, frameDepth),
        frameMaterial
    );
    daliFrameBottom.position.set(0, -daliHeight / 2 - frameThickness / 2, -frameDepth / 2);
    daliFrameBottom.castShadow = true;
    daliFrameBottom.receiveShadow = true;
    gDaliPaintingGroup.add(daliFrameBottom);
    
    var daliFrameLeft = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness, daliHeight, frameDepth),
        frameMaterial
    );
    daliFrameLeft.position.set(-daliWidth / 2 - frameThickness / 2, 0, -frameDepth / 2);
    daliFrameLeft.castShadow = true;
    daliFrameLeft.receiveShadow = true;
    gDaliPaintingGroup.add(daliFrameLeft);
    
    var daliFrameRight = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness, daliHeight, frameDepth),
        frameMaterial
    );
    daliFrameRight.position.set(daliWidth / 2 + frameThickness / 2, 0, -frameDepth / 2);
    daliFrameRight.castShadow = true;
    daliFrameRight.receiveShadow = true;
    gDaliPaintingGroup.add(daliFrameRight);
    
    // Position and orient group on wall (start high above frame)
    gDaliPaintingGroup.position.set(paintingWallX, paintingY + 50, 0);
    gDaliPaintingGroup.rotation.y = -Math.PI / 2;
    gDaliPaintingGroup.visible = false; // Hidden until swapped in
    gThreeScene.add(gDaliPaintingGroup);
    
    // ===== DUCHAMP PAINTING GROUP (Landscape 16x12) =====
    gDuchampPaintingGroup = new THREE.Group();
    var duchampWidth = 16;
    var duchampHeight = 12;
    
    // Create Duchamp painting plane
    var duchampPaintingMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x000000,
        side: THREE.FrontSide,
        shadowSide: THREE.FrontSide,
        emissive: 0x000000,
        emissiveIntensity: 0,
        metalness: 0,
        roughness: 1,
        transparent: true,
        opacity: 1
    });
    
    // Load Duchamp painting texture
    var duchampPaintingTexture = new THREE.TextureLoader().load(
        'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/Duchamp_Glass_Bachelors.jpg',
        function(texture) {
            duchampPaintingMaterial.map = texture;
            duchampPaintingMaterial.emissiveMap = texture;
            duchampPaintingMaterial.color.setHex(0xffffff);
            duchampPaintingMaterial.emissive.setHex(0xffffff);
            duchampPaintingMaterial.emissiveIntensity = 0.3;
            duchampPaintingMaterial.needsUpdate = true;
        },
        undefined,
        function(err) {
            console.error('Error loading Duchamp_Glass_Bachelors.jpg:', err);
            console.log('Using fallback color for Duchamp painting');
        }
    );
    
    var duchampPainting = new THREE.Mesh(
        new THREE.PlaneGeometry(duchampWidth, duchampHeight),
        duchampPaintingMaterial
    );
    duchampPainting.position.set(0, 0, -frameDepth / 2); // Same plane as frames
    duchampPainting.receiveShadow = true;
    duchampPainting.castShadow = true;
    gDuchampPaintingGroup.add(duchampPainting);
    
    // Duchamp frame pieces (relative to group origin)
    var duchampFrameTop = new THREE.Mesh(
        new THREE.BoxGeometry(duchampWidth + frameThickness * 2, frameThickness, frameDepth),
        frameMaterial
    );
    duchampFrameTop.position.set(0, duchampHeight / 2 + frameThickness / 2, -frameDepth / 2);
    duchampFrameTop.castShadow = true;
    duchampFrameTop.receiveShadow = true;
    gDuchampPaintingGroup.add(duchampFrameTop);
    
    var duchampFrameBottom = new THREE.Mesh(
        new THREE.BoxGeometry(duchampWidth + frameThickness * 2, frameThickness, frameDepth),
        frameMaterial
    );
    duchampFrameBottom.position.set(0, -duchampHeight / 2 - frameThickness / 2, -frameDepth / 2);
    duchampFrameBottom.castShadow = true;
    duchampFrameBottom.receiveShadow = true;
    gDuchampPaintingGroup.add(duchampFrameBottom);
    
    var duchampFrameLeft = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness, duchampHeight, frameDepth),
        frameMaterial
    );
    duchampFrameLeft.position.set(-duchampWidth / 2 - frameThickness / 2, 0, -frameDepth / 2);
    duchampFrameLeft.castShadow = true;
    duchampFrameLeft.receiveShadow = true;
    gDuchampPaintingGroup.add(duchampFrameLeft);
    
    var duchampFrameRight = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness, duchampHeight, frameDepth),
        frameMaterial
    );
    duchampFrameRight.position.set(duchampWidth / 2 + frameThickness / 2, 0, -frameDepth / 2);
    duchampFrameRight.castShadow = true;
    duchampFrameRight.receiveShadow = true;
    gDuchampPaintingGroup.add(duchampFrameRight);
    
    // Position and orient group on wall (start high above frame)
    gDuchampPaintingGroup.position.set(paintingWallX, duchampPaintingY + 50, 0);
    gDuchampPaintingGroup.rotation.y = -Math.PI / 2;
    gDuchampPaintingGroup.visible = false; // Hidden until swapped in
    gThreeScene.add(gDuchampPaintingGroup);
    
    // ===== DUCHAMP BRIDE PAINTING GROUP (Portrait 10x14) - Left Position =====
    gDuchampBridePaintingGroup = new THREE.Group();
    var duchampBrideWidth = 7;
    var duchampBrideHeight = 9.8;
    
    // Create Duchamp Bride painting plane
    var duchampBridePaintingMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x000000,
        side: THREE.FrontSide,
        shadowSide: THREE.FrontSide,
        emissive: 0x000000,
        emissiveIntensity: 0,
        metalness: 0,
        roughness: 1,
        transparent: true,
        opacity: 1
    });
    
    // Load Duchamp Bride painting texture
    var duchampBridePaintingTexture = new THREE.TextureLoader().load(
        'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/duchampBride.jpg',
        function(texture) {
            duchampBridePaintingMaterial.map = texture;
            duchampBridePaintingMaterial.emissiveMap = texture;
            duchampBridePaintingMaterial.color.setHex(0xffffff);
            duchampBridePaintingMaterial.emissive.setHex(0xffffff);
            duchampBridePaintingMaterial.emissiveIntensity = 0.3;
            duchampBridePaintingMaterial.needsUpdate = true;
        },
        undefined,
        function(err) {
            console.error('Error loading duchampBride.jpg:', err);
            console.log('Using fallback color for Duchamp Bride painting');
        }
    );
    
    var duchampBridePainting = new THREE.Mesh(
        new THREE.PlaneGeometry(duchampBrideWidth, duchampBrideHeight),
        duchampBridePaintingMaterial
    );
    duchampBridePainting.position.set(0, 0, -frameDepth / 2);
    duchampBridePainting.receiveShadow = true;
    duchampBridePainting.castShadow = true;
    gDuchampBridePaintingGroup.add(duchampBridePainting);
    
    // Duchamp Bride frame pieces
    var duchampBrideFrameTop = new THREE.Mesh(
        new THREE.BoxGeometry(duchampBrideWidth + frameThickness * 2, frameThickness, frameDepth),
        frameMaterial
    );
    duchampBrideFrameTop.position.set(0, duchampBrideHeight / 2 + frameThickness / 2, -frameDepth / 2);
    duchampBrideFrameTop.castShadow = true;
    duchampBrideFrameTop.receiveShadow = true;
    gDuchampBridePaintingGroup.add(duchampBrideFrameTop);
    
    var duchampBrideFrameBottom = new THREE.Mesh(
        new THREE.BoxGeometry(duchampBrideWidth + frameThickness * 2, frameThickness, frameDepth),
        frameMaterial
    );
    duchampBrideFrameBottom.position.set(0, -duchampBrideHeight / 2 - frameThickness / 2, -frameDepth / 2);
    duchampBrideFrameBottom.castShadow = true;
    duchampBrideFrameBottom.receiveShadow = true;
    gDuchampBridePaintingGroup.add(duchampBrideFrameBottom);
    
    var duchampBrideFrameLeft = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness, duchampBrideHeight, frameDepth),
        frameMaterial
    );
    duchampBrideFrameLeft.position.set(-duchampBrideWidth / 2 - frameThickness / 2, 0, -frameDepth / 2);
    duchampBrideFrameLeft.castShadow = true;
    duchampBrideFrameLeft.receiveShadow = true;
    gDuchampBridePaintingGroup.add(duchampBrideFrameLeft);
    
    var duchampBrideFrameRight = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness, duchampBrideHeight, frameDepth),
        frameMaterial
    );
    duchampBrideFrameRight.position.set(duchampBrideWidth / 2 + frameThickness / 2, 0, -frameDepth / 2);
    duchampBrideFrameRight.castShadow = true;
    duchampBrideFrameRight.receiveShadow = true;
    gDuchampBridePaintingGroup.add(duchampBrideFrameRight);
    
    // Position and orient group on wall (start high above frame, initially hidden)
    gDuchampBridePaintingGroup.position.set(-boxSize.x + 0.3, paintingY + 50, -15);
    gDuchampBridePaintingGroup.rotation.y = Math.PI / 2;
    gDuchampBridePaintingGroup.visible = false; // Initially hidden
    gThreeScene.add(gDuchampBridePaintingGroup);
    
    // ===== DUCHAMP GRINDER PAINTING GROUP (Portrait 10x14) - Right Position =====
    gDuchampGrinderPaintingGroup = new THREE.Group();
    var duchampGrinderWidth = 7;
    var duchampGrinderHeight = 9.8;
    
    // Create Duchamp Grinder painting plane
    var duchampGrinderPaintingMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x000000,
        side: THREE.FrontSide,
        shadowSide: THREE.FrontSide,
        emissive: 0x000000,
        emissiveIntensity: 0,
        metalness: 0,
        roughness: 1,
        transparent: true,
        opacity: 1
    });
    
    // Load Duchamp Grinder painting texture
    var duchampGrinderPaintingTexture = new THREE.TextureLoader().load(
        'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/duchampGrinder.jpg',
        function(texture) {
            duchampGrinderPaintingMaterial.map = texture;
            duchampGrinderPaintingMaterial.emissiveMap = texture;
            duchampGrinderPaintingMaterial.color.setHex(0xffffff);
            duchampGrinderPaintingMaterial.emissive.setHex(0xffffff);
            duchampGrinderPaintingMaterial.emissiveIntensity = 0.3;
            duchampGrinderPaintingMaterial.needsUpdate = true;
        },
        undefined,
        function(err) {
            console.error('Error loading duchampGrinder.jpg:', err);
            console.log('Using fallback color for Duchamp Grinder painting');
        }
    );
    
    var duchampGrinderPainting = new THREE.Mesh(
        new THREE.PlaneGeometry(duchampGrinderWidth, duchampGrinderHeight),
        duchampGrinderPaintingMaterial
    );
    duchampGrinderPainting.position.set(0, 0, -frameDepth / 2);
    duchampGrinderPainting.receiveShadow = true;
    duchampGrinderPainting.castShadow = true;
    gDuchampGrinderPaintingGroup.add(duchampGrinderPainting);
    
    // Duchamp Grinder frame pieces
    var duchampGrinderFrameTop = new THREE.Mesh(
        new THREE.BoxGeometry(duchampGrinderWidth + frameThickness * 2, frameThickness, frameDepth),
        frameMaterial
    );
    duchampGrinderFrameTop.position.set(0, duchampGrinderHeight / 2 + frameThickness / 2, -frameDepth / 2);
    duchampGrinderFrameTop.castShadow = true;
    duchampGrinderFrameTop.receiveShadow = true;
    gDuchampGrinderPaintingGroup.add(duchampGrinderFrameTop);
    
    var duchampGrinderFrameBottom = new THREE.Mesh(
        new THREE.BoxGeometry(duchampGrinderWidth + frameThickness * 2, frameThickness, frameDepth),
        frameMaterial
    );
    duchampGrinderFrameBottom.position.set(0, -duchampGrinderHeight / 2 - frameThickness / 2, -frameDepth / 2);
    duchampGrinderFrameBottom.castShadow = true;
    duchampGrinderFrameBottom.receiveShadow = true;
    gDuchampGrinderPaintingGroup.add(duchampGrinderFrameBottom);
    
    var duchampGrinderFrameLeft = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness, duchampGrinderHeight, frameDepth),
        frameMaterial
    );
    duchampGrinderFrameLeft.position.set(-duchampGrinderWidth / 2 - frameThickness / 2, 0, -frameDepth / 2);
    duchampGrinderFrameLeft.castShadow = true;
    duchampGrinderFrameLeft.receiveShadow = true;
    gDuchampGrinderPaintingGroup.add(duchampGrinderFrameLeft);
    
    var duchampGrinderFrameRight = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness, duchampGrinderHeight, frameDepth),
        frameMaterial
    );
    duchampGrinderFrameRight.position.set(duchampGrinderWidth / 2 + frameThickness / 2, 0, -frameDepth / 2);
    duchampGrinderFrameRight.castShadow = true;
    duchampGrinderFrameRight.receiveShadow = true;
    gDuchampGrinderPaintingGroup.add(duchampGrinderFrameRight);
    
    // Position and orient group on wall (start high above frame, initially hidden)
    gDuchampGrinderPaintingGroup.position.set(-boxSize.x + 0.3, paintingY + 50, 15);
    gDuchampGrinderPaintingGroup.rotation.y = Math.PI / 2;
    gDuchampGrinderPaintingGroup.visible = false; // Initially hidden
    gThreeScene.add(gDuchampGrinderPaintingGroup);
    
    // ===== DUCHAMP BRIDE TOP PAINTING GROUP (Landscape 16x12) - Above Duchamp painting =====
    gDuchampBrideTopPaintingGroup = new THREE.Group();
    var duchampBrideTopWidth = 16;
    var duchampBrideTopHeight = 12;
    
    // Create Duchamp Bride Top painting plane
    var duchampBrideTopPaintingMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x000000,
        side: THREE.FrontSide,
        shadowSide: THREE.FrontSide,
        emissive: 0x000000,
        emissiveIntensity: 0,
        metalness: 0,
        roughness: 1,
        transparent: true,
        opacity: 1
    });
    
    // Load Duchamp Bride Top painting texture
    var duchampBrideTopPaintingTexture = new THREE.TextureLoader().load(
        'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/Duchamp_Glass_Bride.jpg',
        function(texture) {
            duchampBrideTopPaintingMaterial.map = texture;
            duchampBrideTopPaintingMaterial.emissiveMap = texture;
            duchampBrideTopPaintingMaterial.color.setHex(0xffffff);
            duchampBrideTopPaintingMaterial.emissive.setHex(0xffffff);
            duchampBrideTopPaintingMaterial.emissiveIntensity = 0.3;
            duchampBrideTopPaintingMaterial.needsUpdate = true;
        },
        undefined,
        function(err) {
            console.error('Error loading Duchamp_Glass_Bride.jpg:', err);
            console.log('Using fallback color for Duchamp Bride Top painting');
        }
    );
    
    var duchampBrideTopPainting = new THREE.Mesh(
        new THREE.PlaneGeometry(duchampBrideTopWidth, duchampBrideTopHeight),
        duchampBrideTopPaintingMaterial
    );
    duchampBrideTopPainting.position.set(0, 0, -frameDepth / 2);
    duchampBrideTopPainting.receiveShadow = true;
    duchampBrideTopPainting.castShadow = true;
    gDuchampBrideTopPaintingGroup.add(duchampBrideTopPainting);
    
    // Duchamp Bride Top frame pieces
    var duchampBrideTopFrameTop = new THREE.Mesh(
        new THREE.BoxGeometry(duchampBrideTopWidth + frameThickness * 2, frameThickness, frameDepth),
        frameMaterial
    );
    duchampBrideTopFrameTop.position.set(0, duchampBrideTopHeight / 2 + frameThickness / 2, -frameDepth / 2);
    duchampBrideTopFrameTop.castShadow = true;
    duchampBrideTopFrameTop.receiveShadow = true;
    gDuchampBrideTopPaintingGroup.add(duchampBrideTopFrameTop);
    
    var duchampBrideTopFrameBottom = new THREE.Mesh(
        new THREE.BoxGeometry(duchampBrideTopWidth + frameThickness * 2, frameThickness, frameDepth),
        frameMaterial
    );
    duchampBrideTopFrameBottom.position.set(0, -duchampBrideTopHeight / 2 - frameThickness / 2, -frameDepth / 2);
    duchampBrideTopFrameBottom.castShadow = true;
    duchampBrideTopFrameBottom.receiveShadow = true;
    gDuchampBrideTopPaintingGroup.add(duchampBrideTopFrameBottom);
    
    var duchampBrideTopFrameLeft = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness, duchampBrideTopHeight, frameDepth),
        frameMaterial
    );
    duchampBrideTopFrameLeft.position.set(-duchampBrideTopWidth / 2 - frameThickness / 2, 0, -frameDepth / 2);
    duchampBrideTopFrameLeft.castShadow = true;
    duchampBrideTopFrameLeft.receiveShadow = true;
    gDuchampBrideTopPaintingGroup.add(duchampBrideTopFrameLeft);
    
    var duchampBrideTopFrameRight = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness, duchampBrideTopHeight, frameDepth),
        frameMaterial
    );
    duchampBrideTopFrameRight.position.set(duchampBrideTopWidth / 2 + frameThickness / 2, 0, -frameDepth / 2);
    duchampBrideTopFrameRight.castShadow = true;
    duchampBrideTopFrameRight.receiveShadow = true;
    gDuchampBrideTopPaintingGroup.add(duchampBrideTopFrameRight);
    
    // Position and orient group on wall (start high above frame, initially hidden)
    // Position directly above gDuchampPaintingGroup: offset by duchampHeight + frameThickness = 12.3
    gDuchampBrideTopPaintingGroup.position.set(paintingWallX, paintingY + 50, 0);
    gDuchampBrideTopPaintingGroup.rotation.y = -Math.PI / 2;
    gDuchampBrideTopPaintingGroup.visible = false; // Initially hidden
    gThreeScene.add(gDuchampBrideTopPaintingGroup);
    
    // ===== BOSCH TRIPTYCH GROUP (Three panels: left, center, right) =====
    gBoschPaintingGroup = new THREE.Group();
    
    // Standard height for all panels - width will be calculated from image aspect ratio
    var boschPanelHeight = gBoschPanelHeight * gBoschTriptychScale;
    // Initial placeholder widths (will be updated when textures load)
    var boschLeftWidth = 5.3;
    var boschCenterWidth = 10.6;
    var boschRightWidth = 5.3;
    
    // Left Panel
    var boschLeftPaintingMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x000000,
        side: THREE.FrontSide,
        shadowSide: THREE.FrontSide,
        emissive: 0x000000,
        emissiveIntensity: 0,
        metalness: 0,
        roughness: 1,
        transparent: true,
        opacity: 1
    });
    
    var boschLeftPainting = new THREE.Mesh(
        new THREE.PlaneGeometry(boschLeftWidth, boschPanelHeight),
        boschLeftPaintingMaterial
    );
    boschLeftPainting.position.set(0, 0, -frameDepth / 2);
    boschLeftPainting.receiveShadow = true;
    boschLeftPainting.castShadow = true;
    gBoschPaintingGroup.add(boschLeftPainting);
    
    // Left panel frame pieces (will be updated when texture loads)
    var boschLeftFrameTop = new THREE.Mesh(
        new THREE.BoxGeometry(boschLeftWidth + frameThickness * 2, frameThickness, frameDepth),
        frameMaterial
    );
    boschLeftFrameTop.position.set(0, boschPanelHeight / 2 + frameThickness / 2, -frameDepth / 2);
    boschLeftFrameTop.castShadow = true;
    boschLeftFrameTop.receiveShadow = true;
    gBoschPaintingGroup.add(boschLeftFrameTop);
    
    var boschLeftFrameBottom = new THREE.Mesh(
        new THREE.BoxGeometry(boschLeftWidth + frameThickness * 2, frameThickness, frameDepth),
        frameMaterial
    );
    boschLeftFrameBottom.position.set(0, -boschPanelHeight / 2 - frameThickness / 2, -frameDepth / 2);
    boschLeftFrameBottom.castShadow = true;
    boschLeftFrameBottom.receiveShadow = true;
    gBoschPaintingGroup.add(boschLeftFrameBottom);
    
    var boschLeftFrameLeft = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness, boschPanelHeight, frameDepth),
        frameMaterial
    );
    boschLeftFrameLeft.position.set(-boschLeftWidth / 2 - frameThickness / 2, 0, -frameDepth / 2);
    boschLeftFrameLeft.castShadow = true;
    boschLeftFrameLeft.receiveShadow = true;
    gBoschPaintingGroup.add(boschLeftFrameLeft);
    
    var boschLeftFrameRight = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness / 2, boschPanelHeight, frameDepth),
        frameMaterial
    );
    boschLeftFrameRight.position.set(boschLeftWidth / 2 + frameThickness / 4, 0, -frameDepth / 2);
    boschLeftFrameRight.castShadow = true;
    boschLeftFrameRight.receiveShadow = true;
    gBoschPaintingGroup.add(boschLeftFrameRight);
    
    // Center Panel
    var boschCenterPaintingMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x000000,
        side: THREE.FrontSide,
        shadowSide: THREE.FrontSide,
        emissive: 0x000000,
        emissiveIntensity: 0,
        metalness: 0,
        roughness: 1,
        transparent: true,
        opacity: 1
    });
    
    var boschCenterPainting = new THREE.Mesh(
        new THREE.PlaneGeometry(boschCenterWidth, boschPanelHeight),
        boschCenterPaintingMaterial
    );
    boschCenterPainting.position.set(0, 0, -frameDepth / 2);
    boschCenterPainting.receiveShadow = true;
    boschCenterPainting.castShadow = true;
    gBoschPaintingGroup.add(boschCenterPainting);
    
    // Center panel frame pieces (will be updated when texture loads)
    var boschCenterFrameTop = new THREE.Mesh(
        new THREE.BoxGeometry(boschCenterWidth + frameThickness * 2, frameThickness, frameDepth),
        frameMaterial
    );
    boschCenterFrameTop.position.set(0, boschPanelHeight / 2 + frameThickness / 2, -frameDepth / 2);
    boschCenterFrameTop.castShadow = true;
    boschCenterFrameTop.receiveShadow = true;
    gBoschPaintingGroup.add(boschCenterFrameTop);
    
    var boschCenterFrameBottom = new THREE.Mesh(
        new THREE.BoxGeometry(boschCenterWidth + frameThickness * 2, frameThickness, frameDepth),
        frameMaterial
    );
    boschCenterFrameBottom.position.set(0, -boschPanelHeight / 2 - frameThickness / 2, -frameDepth / 2);
    boschCenterFrameBottom.castShadow = true;
    boschCenterFrameBottom.receiveShadow = true;
    gBoschPaintingGroup.add(boschCenterFrameBottom);
    
    var boschCenterFrameLeft = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness / 2, boschPanelHeight, frameDepth),
        frameMaterial
    );
    boschCenterFrameLeft.position.set(-boschCenterWidth / 2 - frameThickness / 4, 0, -frameDepth / 2);
    boschCenterFrameLeft.castShadow = true;
    boschCenterFrameLeft.receiveShadow = true;
    gBoschPaintingGroup.add(boschCenterFrameLeft);
    
    var boschCenterFrameRight = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness / 2, boschPanelHeight, frameDepth),
        frameMaterial
    );
    boschCenterFrameRight.position.set(boschCenterWidth / 2 + frameThickness / 4, 0, -frameDepth / 2);
    boschCenterFrameRight.castShadow = true;
    boschCenterFrameRight.receiveShadow = true;
    gBoschPaintingGroup.add(boschCenterFrameRight);
    
    // Right Panel
    var boschRightPaintingMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x000000,
        side: THREE.FrontSide,
        shadowSide: THREE.FrontSide,
        emissive: 0x000000,
        emissiveIntensity: 0,
        metalness: 0,
        roughness: 1,
        transparent: true,
        opacity: 1
    });
    
    var boschRightPainting = new THREE.Mesh(
        new THREE.PlaneGeometry(boschRightWidth, boschPanelHeight),
        boschRightPaintingMaterial
    );
    boschRightPainting.position.set(0, 0, -frameDepth / 2);
    boschRightPainting.receiveShadow = true;
    boschRightPainting.castShadow = true;
    gBoschPaintingGroup.add(boschRightPainting);
    
    // Right panel frame pieces (will be updated when texture loads)
    var boschRightFrameTop = new THREE.Mesh(
        new THREE.BoxGeometry(boschRightWidth + frameThickness * 2, frameThickness, frameDepth),
        frameMaterial
    );
    boschRightFrameTop.position.set(0, boschPanelHeight / 2 + frameThickness / 2, -frameDepth / 2);
    boschRightFrameTop.castShadow = true;
    boschRightFrameTop.receiveShadow = true;
    gBoschPaintingGroup.add(boschRightFrameTop);
    
    var boschRightFrameBottom = new THREE.Mesh(
        new THREE.BoxGeometry(boschRightWidth + frameThickness * 2, frameThickness, frameDepth),
        frameMaterial
    );
    boschRightFrameBottom.position.set(0, -boschPanelHeight / 2 - frameThickness / 2, -frameDepth / 2);
    boschRightFrameBottom.castShadow = true;
    boschRightFrameBottom.receiveShadow = true;
    gBoschPaintingGroup.add(boschRightFrameBottom);
    
    var boschRightFrameLeft = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness / 2, boschPanelHeight, frameDepth),
        frameMaterial
    );
    boschRightFrameLeft.position.set(-boschRightWidth / 2 - frameThickness / 4, 0, -frameDepth / 2);
    boschRightFrameLeft.castShadow = true;
    boschRightFrameLeft.receiveShadow = true;
    gBoschPaintingGroup.add(boschRightFrameLeft);
    
    var boschRightFrameRight = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness, boschPanelHeight, frameDepth),
        frameMaterial
    );
    boschRightFrameRight.position.set(boschRightWidth / 2 + frameThickness / 2, 0, -frameDepth / 2);
    boschRightFrameRight.castShadow = true;
    boschRightFrameRight.receiveShadow = true;
    gBoschPaintingGroup.add(boschRightFrameRight);
    
    // Function to update panel positions after dimensions are set
    function updateBoschPanelPositions() {
        // Position panels with a gap between them
        var gapSize = 0.12; // Small gap between panels
        var leftX = -(boschCenterWidth / 2 + frameThickness / 2 + boschLeftWidth / 2 + gapSize);
        var centerX = 0;
        var rightX = boschCenterWidth / 2 + frameThickness / 2 + boschRightWidth / 2 + gapSize;
        
        // Update left panel and frame positions
        boschLeftPainting.position.x = leftX;
        boschLeftFrameTop.position.x = leftX - frameThickness / 4; // Offset for asymmetric frame
        boschLeftFrameBottom.position.x = leftX - frameThickness / 4; // Offset for asymmetric frame
        boschLeftFrameLeft.position.x = leftX - boschLeftWidth / 2 - frameThickness / 2;
        boschLeftFrameRight.position.x = leftX + boschLeftWidth / 2 + frameThickness / 4;
        
        // Center panel stays at x=0, just update frame positions
        boschCenterPainting.position.x = centerX;
        boschCenterFrameTop.position.x = centerX;
        boschCenterFrameBottom.position.x = centerX;
        boschCenterFrameLeft.position.x = centerX - boschCenterWidth / 2 - frameThickness / 4;
        boschCenterFrameRight.position.x = centerX + boschCenterWidth / 2 + frameThickness / 4;
        
        // Update right panel and frame positions
        boschRightPainting.position.x = rightX;
        boschRightFrameTop.position.x = rightX + frameThickness / 4; // Offset for asymmetric frame
        boschRightFrameBottom.position.x = rightX + frameThickness / 4; // Offset for asymmetric frame
        boschRightFrameLeft.position.x = rightX - boschRightWidth / 2 - frameThickness / 4;
        boschRightFrameRight.position.x = rightX + boschRightWidth / 2 + frameThickness / 2;
    }
    
    // Load Bosch left panel texture and update dimensions based on aspect ratio
    var boschLeftPaintingTexture = new THREE.TextureLoader().load(
        'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/Bosch_GED_leftPanel_small.jpg',
        function(texture) {
            // Calculate width based on image aspect ratio
            var aspectRatio = texture.image.width / texture.image.height;
            boschLeftWidth = boschPanelHeight * aspectRatio;
            
            // Update painting geometry
            boschLeftPainting.geometry.dispose();
            boschLeftPainting.geometry = new THREE.PlaneGeometry(boschLeftWidth, boschPanelHeight);
            
            // Update frame geometries (full left frame + half right frame)
            boschLeftFrameTop.geometry.dispose();
            boschLeftFrameTop.geometry = new THREE.BoxGeometry(boschLeftWidth + frameThickness * 1.5, frameThickness, frameDepth);
            boschLeftFrameBottom.geometry.dispose();
            boschLeftFrameBottom.geometry = new THREE.BoxGeometry(boschLeftWidth + frameThickness * 1.5, frameThickness, frameDepth);
            
            // Update material
            boschLeftPaintingMaterial.map = texture;
            boschLeftPaintingMaterial.emissiveMap = texture;
            boschLeftPaintingMaterial.color.setHex(0xffffff);
            boschLeftPaintingMaterial.emissive.setHex(0xffffff);
            boschLeftPaintingMaterial.emissiveIntensity = 0.3;
            boschLeftPaintingMaterial.needsUpdate = true;
            
            // Update positions
            updateBoschPanelPositions();
        },
        undefined,
        function(err) {
            console.error('Error loading Bosch_GED_leftPanel_small.jpg:', err);
            console.log('Using fallback color for Bosch left panel');
        }
    );
    
    // Load Bosch center panel texture and update dimensions based on aspect ratio
    var boschCenterPaintingTexture = new THREE.TextureLoader().load(
        'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/Bosch_GED_centerPanel_small.jpg',
        function(texture) {
            // Calculate width based on image aspect ratio
            var aspectRatio = texture.image.width / texture.image.height;
            boschCenterWidth = boschPanelHeight * aspectRatio;
            
            // Update painting geometry
            boschCenterPainting.geometry.dispose();
            boschCenterPainting.geometry = new THREE.PlaneGeometry(boschCenterWidth, boschPanelHeight);
            
            // Update frame geometries (half left frame + half right frame)
            boschCenterFrameTop.geometry.dispose();
            boschCenterFrameTop.geometry = new THREE.BoxGeometry(boschCenterWidth + frameThickness, frameThickness, frameDepth);
            boschCenterFrameBottom.geometry.dispose();
            boschCenterFrameBottom.geometry = new THREE.BoxGeometry(boschCenterWidth + frameThickness, frameThickness, frameDepth);
            
            // Update material
            boschCenterPaintingMaterial.map = texture;
            boschCenterPaintingMaterial.emissiveMap = texture;
            boschCenterPaintingMaterial.color.setHex(0xffffff);
            boschCenterPaintingMaterial.emissive.setHex(0xffffff);
            boschCenterPaintingMaterial.emissiveIntensity = 0.3;
            boschCenterPaintingMaterial.needsUpdate = true;
            
            // Update positions
            updateBoschPanelPositions();
        },
        undefined,
        function(err) {
            console.error('Error loading Bosch_GED_centerPanel_small.jpg:', err);
            console.log('Using fallback color for Bosch center panel');
        }
    );
    
    // Load Bosch right panel texture and update dimensions based on aspect ratio
    var boschRightPaintingTexture = new THREE.TextureLoader().load(
        'https://raw.githubusercontent.com/frank-maiello/frank-maiello.github.io/main/Bosch_GED_rightPanel_small.jpg',
        function(texture) {
            // Calculate width based on image aspect ratio
            var aspectRatio = texture.image.width / texture.image.height;
            boschRightWidth = boschPanelHeight * aspectRatio;
            
            // Update painting geometry
            boschRightPainting.geometry.dispose();
            boschRightPainting.geometry = new THREE.PlaneGeometry(boschRightWidth, boschPanelHeight);
            
            // Update frame geometries (half left frame + full right frame)
            boschRightFrameTop.geometry.dispose();
            boschRightFrameTop.geometry = new THREE.BoxGeometry(boschRightWidth + frameThickness * 1.5, frameThickness, frameDepth);
            boschRightFrameBottom.geometry.dispose();
            boschRightFrameBottom.geometry = new THREE.BoxGeometry(boschRightWidth + frameThickness * 1.5, frameThickness, frameDepth);
            
            // Update material
            boschRightPaintingMaterial.map = texture;
            boschRightPaintingMaterial.emissiveMap = texture;
            boschRightPaintingMaterial.color.setHex(0xffffff);
            boschRightPaintingMaterial.emissive.setHex(0xffffff);
            boschRightPaintingMaterial.emissiveIntensity = 0.3;
            boschRightPaintingMaterial.needsUpdate = true;
            
            // Update positions
            updateBoschPanelPositions();
        },
        undefined,
        function(err) {
            console.error('Error loading Bosch_GED_rightPanel_small.jpg:', err);
            console.log('Using fallback color for Bosch right panel');
        }
    );
    
    // Initial positioning (will be refined when textures load)
    updateBoschPanelPositions();
    
    // Position and orient group on wall (start high above frame)
    var initialY = paintingY + 50;
    gBoschPaintingGroup.position.set(paintingWallX, initialY, 0);
    gBoschPaintingGroup.rotation.y = -Math.PI / 2;
    gBoschPaintingGroup.visible = false; // Hidden until swapped in
    gThreeScene.add(gBoschPaintingGroup);
    
    // Store bottom height reference (will be set when painting descends to display position)
    // For now, use the target display position
    gBoschBottomHeight = paintingY - (gBoschPanelHeight / 2);
    
    // Add baseboard around perimeter walls
    var baseboardHeight = 0.3;
    var baseboardDepth = 0.1;
    var baseboardMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xc4a574, // Dull tan
        shininess: 10
    });
    
    // Front baseboard
    gBaseboards.front = new THREE.Mesh(
        new THREE.BoxGeometry(boxSize.x * 2, baseboardHeight, baseboardDepth),
        baseboardMaterial
    );
    gBaseboards.front.position.set(0, baseboardHeight / 2, boxSize.z - baseboardDepth / 2);
    gBaseboards.front.receiveShadow = true;
    gBaseboards.front.castShadow = true;
    gThreeScene.add(gBaseboards.front);
    
    // Back baseboard
    gBaseboards.back = new THREE.Mesh(
        new THREE.BoxGeometry(boxSize.x * 2, baseboardHeight, baseboardDepth),
        baseboardMaterial
    );
    gBaseboards.back.position.set(0, baseboardHeight / 2, -boxSize.z + baseboardDepth / 2);
    gBaseboards.back.receiveShadow = true;
    gBaseboards.back.castShadow = true;
    gThreeScene.add(gBaseboards.back);
    
    // Left baseboard
    gBaseboards.left = new THREE.Mesh(
        new THREE.BoxGeometry(baseboardDepth, baseboardHeight, boxSize.z * 2),
        baseboardMaterial
    );
    gBaseboards.left.position.set(-boxSize.x + baseboardDepth / 2, baseboardHeight / 2, 0);
    gBaseboards.left.receiveShadow = true;
    gBaseboards.left.castShadow = true;
    gThreeScene.add(gBaseboards.left);
    
    // Right baseboard
    gBaseboards.right = new THREE.Mesh(
        new THREE.BoxGeometry(baseboardDepth, baseboardHeight, boxSize.z * 2),
        baseboardMaterial
    );
    gBaseboards.right.position.set(boxSize.x - baseboardDepth / 2, baseboardHeight / 2, 0);
    gBaseboards.right.receiveShadow = true;
    gBaseboards.right.castShadow = true;
    gThreeScene.add(gBaseboards.right);
    
    // Create five pedestals with Platonic solids on back wall
    var pedestalSize = 1.5;
    var pedestalHeight = 7;
    var solidSize = 0.8;
    var backWallZ = -boxSize.z + baseboardDepth + pedestalSize / 2;
    var pedestalY = pedestalHeight / 2; // Center of pedestal, bottom will be at y=0 (floor level)
    var solidY = pedestalHeight + solidSize;
    
    // Pedestal material
    var pedestalMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        map: gPedestalMarbleTexture,
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
    
    var pedestalStartY = WORLD_HEIGHT + 60; // Start high above ceiling
    var solidStartY = pedestalStartY + pedestalHeight / 2 + solidSize;
    
    for (var i = 0; i < 5; i++) {
        var xPos = startX + i * spacing;
        
        // Create pedestal
        var pedestal = new THREE.Mesh(
            new THREE.BoxGeometry(pedestalSize, pedestalHeight, pedestalSize),
            pedestalMaterial
        );
        pedestal.position.set(xPos, pedestalStartY, backWallZ);
        pedestal.castShadow = true;
        pedestal.receiveShadow = true;
        gThreeScene.add(pedestal);
        
        // Create outer transparent Platonic solid
        var solidMaterial = new THREE.MeshPhongMaterial({
            color: platonicConfig[i].color,
            transparent: true,
            opacity: 0.6,
            shininess: 0,
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
        
        // Position high above (will descend with pedestal)
        if (i === 0) {
            var yPos = solidStartY - 0.35;
        } else {
            var yPos = solidStartY; 
        }
        solidGroup.position.set(xPos, yPos, backWallZ);
        
        gThreeScene.add(solidGroup);
        
        // Store group for rotation animation (rotates around world Y-axis)
        window.gPlatonicSolids.push(solidGroup);
        
        // Store animation data with staggered delay (left to right)
        var targetPedestalY = pedestalY;
        var targetSolidY = i === 0 ? (solidY - 0.35) : solidY;
        gPedestalAnimData.push({
            pedestal: pedestal,
            solidGroup: solidGroup,
            targetPedestalY: targetPedestalY,
            targetSolidY: targetSolidY,
            startY: pedestalStartY,
            timer: 0,
            delay: 0.5 + i * 0.15, // Staggered delays from left to right
            animating: true
        });
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
    ovalImage.position.set(ovalPaintingX, ovalPaintingY + gPaintingDropStartY, ovalPaintingZ + 0.05);
    ovalImage.castShadow = true;
    ovalImage.receiveShadow = true;
    gThreeScene.add(ovalImage);
    gOvalPainting = ovalImage; // Store global reference
    
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
    ovalFrame.position.set(ovalPaintingX, ovalPaintingY + gPaintingDropStartY, ovalPaintingZ + ovalFrameDepth / 2);
    ovalFrame.castShadow = true;
    ovalFrame.receiveShadow = true;
    gThreeScene.add(ovalFrame);
    gOvalFrame = ovalFrame; // Store global reference
    
   
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
    
    // Create sphere obstacle (start on floor for rise animation)
    gSphereObstacle = new SphereObstacle(
        gSphereStartRadius,  // radius (start small)
        new THREE.Vector3(-10, gSphereStartY, 18),  // position (start on floor)
    );
    gSphereObstacle.enabled = false;  // Disable collision during animation
    gObstacles.push(gSphereObstacle);

    // Create torus obstacle (start high and small for drop animation)
    gTorusObstacle = new TorusObstacle(
        gTorusStartMajorRadius,  // major radius (start small)
        gTorusStartMinorRadius,  // minor radius (tube radius, start small)
        new THREE.Vector3(11, gTorusTargetY + gTorusStartY, 0),  // position (start high)
        { x: 0, y: 0.5 * Math.PI, z: 0 }  // rotation
    );
    gTorusObstacle.enabled = false;  // Disable collision during animation
    gObstacles.push(gTorusObstacle);

    // Create cylinder obstacle (start high for drop animation)
    gColumnObstacle = new CylinderObstacle(
        2.5,  // radius
        12,  // height
        new THREE.Vector3(gColumnInitialX, 6.03 + gColumnStartY, gColumnInitialZ),  // position (start high)
        { x: 0, y: 0, z: 0 }  // rotation
    );
    gObstacles.push(gColumnObstacle);
    gColumnDropping = true; // Enable drop animation
    
    // Renderer
    gRenderer = new THREE.WebGLRenderer();
    gRenderer.shadowMap.enabled = true;
    gRenderer.localClippingEnabled = true; // Enable clipping planes
    gRenderer.setPixelRatio( window.devicePixelRatio );
    gRenderer.setSize( 0.8 * window.innerWidth, 0.8 * window.innerHeight );
    window.addEventListener( 'resize', onWindowResize, false );
    container.appendChild( gRenderer.domElement );
    
    // Initialize AnaglyphEffect for stereo rendering
    if (typeof THREE.AnaglyphEffect !== 'undefined') {
        gAnaglyphEffect = new THREE.AnaglyphEffect(gRenderer);
        gAnaglyphEffect.setSize(0.8 * window.innerWidth, 0.8 * window.innerHeight);
    } else {
        console.warn('THREE.AnaglyphEffect not available. Stereo mode will be disabled.');
    }
    
    // Camera	
    gCamera = new THREE.PerspectiveCamera( gCameraFOV, window.innerWidth / window.innerHeight, 0.01, 1000);
    gCamera.position.set(-16.99, 21.37, 43.12);
    gCamera.updateMatrixWorld();	
    gCameraPrevPosition.copy(gCamera.position); // Initialize for velocity calculation

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
        
        // WASD and arrow key controls for walking camera mode
        if (gCameraMode === 5) {
            if (evt.key === 'w' || evt.key === 'W') {
                gKeysPressed.w = true;
                evt.preventDefault();
            }
            if (evt.key === 's' || evt.key === 'S') {
                gKeysPressed.s = true;
                evt.preventDefault();
            }
            if (evt.key === 'a' || evt.key === 'A') {
                gKeysPressed.a = true;
                evt.preventDefault();
            }
            if (evt.key === 'd' || evt.key === 'D') {
                gKeysPressed.d = true;
                evt.preventDefault();
            }
            if (evt.key === 'ArrowUp') {
                gKeysPressed.up = true;
                evt.preventDefault();
            }
            if (evt.key === 'ArrowDown') {
                gKeysPressed.down = true;
                evt.preventDefault();
            }
            if (evt.key === 'ArrowLeft') {
                gKeysPressed.left = true;
                evt.preventDefault();
            }
            if (evt.key === 'ArrowRight') {
                gKeysPressed.right = true;
                evt.preventDefault();
            }
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
    
    window.addEventListener('keyup', function(evt) {
        // WASD and arrow key release for walking camera mode
        if (evt.key === 'w' || evt.key === 'W') gKeysPressed.w = false;
        if (evt.key === 's' || evt.key === 'S') gKeysPressed.s = false;
        if (evt.key === 'a' || evt.key === 'A') gKeysPressed.a = false;
        if (evt.key === 'd' || evt.key === 'D') gKeysPressed.d = false;
        if (evt.key === 'ArrowUp') gKeysPressed.up = false;
        if (evt.key === 'ArrowDown') gKeysPressed.down = false;
        if (evt.key === 'ArrowLeft') gKeysPressed.left = false;
        if (evt.key === 'ArrowRight') gKeysPressed.right = false;
    });
    
    // grabber
    gGrabber = new Grabber();
    container.addEventListener( 'pointerdown', onPointer, false );
    container.addEventListener( 'pointermove', onPointer, false );
    container.addEventListener( 'pointerup', onPointer, false );
    container.addEventListener( 'pointerleave', onPointerLeave, false );
    
    // Wheel event for camera distance in follow/lead modes and height in dolly mode
    container.addEventListener('wheel', function(evt) {
        if (gCameraMode === 3 || gCameraMode === 4) {
            evt.preventDefault();
            // Adjust camera distance offset based on scroll direction
            const zoomSpeed = 0.1;
            gCameraDistanceOffset += evt.deltaY * zoomSpeed * 0.01;
            // Clamp distance offset to reasonable range
            gCameraDistanceOffset = Math.max(-5, Math.min(10, gCameraDistanceOffset));
        } else if (gCameraMode === 5) {
            evt.preventDefault();
            // Adjust camera elevation in free-roam mode
            const elevationSpeed = 0.1;
            gWalkingCameraPosition.y -= evt.deltaY * elevationSpeed * 0.01;
            // Clamp elevation to reasonable range
            gWalkingCameraPosition.y = Math.max(0.5, Math.min(50, gWalkingCameraPosition.y));
        } else if (gCameraMode === 6) {
            evt.preventDefault();
            // Adjust camera height in dolly mode
            const heightSpeed = 0.1;
            gDollyCameraHeight -= evt.deltaY * heightSpeed * 0.01;
            // Clamp height to reasonable range (allow above and below world bounds)
            gDollyCameraHeight = Math.max(-15, Math.min(30, gDollyCameraHeight));
        }
    }, { passive: false });
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
                cameraMenuVisibleBeforeHide = cameraMenuVisible;
                cameraMenuVisible = false;
            } else {
                menuVisible = menuVisibleBeforeHide;
                stylingMenuVisible = stylingMenuVisibleBeforeHide;
                instructionsMenuVisible = instructionsMenuVisibleBeforeHide;
                colorMenuVisible = colorMenuVisibleBeforeHide;
                lightingMenuVisible = lightingMenuVisibleBeforeHide;
                cameraMenuVisible = cameraMenuVisibleBeforeHide;
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
        
        // Check camera menu click
        if (checkCameraMenuClick(evt.clientX, evt.clientY)) {
            return;
        }
        
        // Check dolly rails click (when in dolly camera mode)
        if (checkDollyRailsClick(evt.clientX, evt.clientY)) {
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
                // Toggle running state (only if boids have started or user is trying to unpause after auto-start)
                if (gBoidsStarted) {
                    gRunning = !gRunning;
                    gPhysicsScene.paused = !gRunning;
                }
                return;
            }
            
            // Check Camera menu item
            const itemY2 = itemY + itemHeight + padding;
            if (evt.clientX >= itemX && evt.clientX <= itemX + itemWidth &&
                evt.clientY >= itemY2 && evt.clientY <= itemY2 + itemHeight) {
                
                if (!cameraMenuVisible) {
                    // Open camera menu without cycling mode
                    cameraMenuVisible = true;
                    // Create dolly rails and cart if they don't exist
                    if (!gDollyRailsMesh) {
                        createDollyRails();
                    }
                    if (!gDollyCartMesh) {
                        createDollyCart();
                    }
                    if (!gDollyCameraMesh) {
                        loadDollyCameraModel();
                    }
                    // Close other menus when opening camera menu
                    menuVisible = false;
                    stylingMenuVisible = false;
                    colorMenuVisible = false;
                    lightingMenuVisible = false;
                    instructionsMenuVisible = false;
                } else {
                    // Menu is already open, cycle camera mode
                    const previousMode = gCameraMode;
                    gCameraMode = (gCameraMode + 1) % 7;
                    
                    // If we cycled back to mode 0 (completed full cycle), close the menu
                    if (gCameraMode === 0) {
                        cameraMenuVisible = false;
                    }
                    
                    // Save camera position when leaving any third-person mode (0, 1, or 2)
                    if (previousMode >= 0 && previousMode <= 2) {
                        gSavedCameraPosition = gCamera.position.clone();
                        gSavedCameraTarget = gCameraControl.target.clone();
                    }
                    
                    // Restore camera position when returning to any third-person mode from first-person
                    if (gCameraMode >= 0 && gCameraMode <= 2 && previousMode >= 3 && gSavedCameraPosition && gSavedCameraTarget) {
                        gCamera.position.copy(gSavedCameraPosition);
                        gCameraControl.target.copy(gSavedCameraTarget);
                        gCameraControl.update();
                    }
                    
                    // Initialize walking camera position when entering mode 5
                    if (gCameraMode === 5) {
                        gWalkingCameraPosition.set(0, 6.8, 0);
                        gWalkingCameraYaw = -Math.PI / 2; // Point in -x direction
                        gWalkingCameraPitch = 0;
                        // gWalkingCameraLookLocked state is preserved from previous walking mode session
                    }
                    
                    // Initialize dolly camera when entering mode 6
                    if (gCameraMode === 6) {
                        // Set camera to current dolly cart position
                        const localX = (gDollyPosition - 0.5) * gDollyRailsLength;
                        const worldX = gDollyRailsPosition.x + Math.cos(gDollyRailsRotation) * localX;
                        const worldZ = gDollyRailsPosition.z - Math.sin(gDollyRailsRotation) * localX;
                        gCamera.position.set(worldX, gDollyCameraHeight, worldZ);
                        
                        // Camera angles (yaw/pitch) are preserved from previous dolly mode session
                        // Create rails and cart if they don't exist yet
                        if (!gDollyRailsMesh) {
                            createDollyRails();
                        }
                        if (!gDollyCartMesh) {
                            createDollyCart();
                        }
                        if (!gDollyCameraMesh) {
                            loadDollyCameraModel();
                        }
                    }
                    
                    // Enable/disable OrbitControls based on camera mode
                    // Modes 0, 1, 2 use OrbitControls; modes 3, 4, 5, 6 don't
                    if (gCameraMode >= 0 && gCameraMode <= 2) {
                        gCameraControl.enabled = true;
                    } else {
                        gCameraControl.enabled = false;
                    }
                    
                    // Reset manual control flags
                    gCameraManualControl = false;
                    gCameraRotationOffset = { theta: 0, phi: 0 };
                }
                gCameraDistanceOffset = 0;
                return;
            }
            
            // Check Simulation menu item
            const itemY3 = itemY2 + itemHeight + padding;
            if (evt.clientX >= itemX && evt.clientX <= itemX + itemWidth &&
                evt.clientY >= itemY3 && evt.clientY <= itemY3 + itemHeight) {
                menuVisible = !menuVisible;
                stylingMenuVisible = false; // Close styling menu when opening simulation
                instructionsMenuVisible = false; // Close instructions menu when opening simulation
                colorMenuVisible = false; // Close color menu when opening simulation
                lightingMenuVisible = false; // Close lighting menu when opening simulation
                cameraMenuVisible = false; // Close camera menu when opening simulation
                return;
            }
            
            // Check Styling menu item
            const itemY4 = itemY3 + itemHeight + padding;
            if (evt.clientX >= itemX && evt.clientX <= itemX + itemWidth &&
                evt.clientY >= itemY4 && evt.clientY <= itemY4 + itemHeight) {
                stylingMenuVisible = !stylingMenuVisible;
                menuVisible = false; // Close simulation menu when opening styling
                instructionsMenuVisible = false; // Close instructions menu when opening styling
                colorMenuVisible = false; // Close color menu when opening styling
                lightingMenuVisible = false; // Close lighting menu when opening styling
                cameraMenuVisible = false; // Close camera menu when opening styling
                return;
            }
            
            // Check Color menu item
            const itemY5 = itemY4 + itemHeight + padding;
            if (evt.clientX >= itemX && evt.clientX <= itemX + itemWidth &&
                evt.clientY >= itemY5 && evt.clientY <= itemY5 + itemHeight) {
                colorMenuVisible = !colorMenuVisible;
                menuVisible = false; // Close simulation menu when opening color
                stylingMenuVisible = false; // Close styling menu when opening color
                instructionsMenuVisible = false; // Close instructions menu when opening color
                lightingMenuVisible = false; // Close lighting menu when opening color
                cameraMenuVisible = false; // Close camera menu when opening color
                return;
            }
            
            // Check Lighting menu item
            const itemY6 = itemY5 + itemHeight + padding;
            if (evt.clientX >= itemX && evt.clientX <= itemX + itemWidth &&
                evt.clientY >= itemY6 && evt.clientY <= itemY6 + itemHeight) {
                lightingMenuVisible = !lightingMenuVisible;
                menuVisible = false; // Close simulation menu when opening lighting
                stylingMenuVisible = false; // Close styling menu when opening lighting
                instructionsMenuVisible = false; // Close instructions menu when opening lighting
                colorMenuVisible = false; // Close color menu when opening lighting
                cameraMenuVisible = false; // Close camera menu when opening lighting
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
                cameraMenuVisible = false; // Close camera menu when opening instructions
                return;
            }

        }
        
        // Handle mouse look for dolly camera mode - toggle lock on click (also skips object interactions)
        if (gCameraMode === 6) {
            gDollyCameraLookLocked = !gDollyCameraLookLocked;
            gPointerLastX = evt.clientX;
            gPointerLastY = evt.clientY;
            return;
        }
        
        // If dragging mammoth skeleton, ANY click should exit dragging mode
        if (gCurrentlyDraggingObject === 'mammothSkeleton' && gDraggingMammothSkeleton) {
            gCurrentlyDraggingObject = null;
            gDraggingMammothSkeleton = false;
            gMammothSkeletonDragOffset = null;
            restoreLightsFromDrag();
            removeDragSpotlight();
            if (gCameraControl) {
                gCameraControl.enabled = true;
            }
            return;
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
        var hitSkyPig = false;
        var hitSkyPigObstacle = null;
        var hitTorus = false;
        var hitTorusObstacle = null;
        var hitLampId = 1; // Default to lamp 1
        var hitStool = false;
        var hitBird = false;
        var hitKoonsDog = false;
        var hitStoolLeg = false;
        var hitDuck = false;
        var hitDuckBeak = false;
        var hitMammoth = false;
        var hitMammothSkeleton = false;
        var hitMammothPushbutton = false;
        var hitTeapot = false;
        var hitChair = false;
        var hitSofa = false;
        var hitGlobeLamp = false;
        
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
            
            // Check for mammoth pushbutton with high priority
            if (intersects[i].object.userData.isMammothPushbutton && !hitMammothPushbutton) {
                hitMammothPushbutton = true;
                // Don't check for draggable mammoth if pushbutton is hit
                continue;
            }
            
            if (intersects[i].object.userData.isDraggableDuck && !hitDuck && !hitDuckBeak) {
                hitDuck = true;
                // No offset calculation - object will follow cursor directly
                // Don't break - check if other objects are also hit
            }
            if (intersects[i].object.userData.isDraggableMammoth && !hitMammoth) {
                hitMammoth = true;
                // No offset calculation - object will follow cursor directly
                // Don't break - check if other objects are also hit
            }
            if (intersects[i].object.userData.isDraggableMammothSkeleton && !hitMammothSkeleton) {
                hitMammothSkeleton = true;
                // No offset calculation - object will follow cursor directly
                // Don't break - check if other objects are also hit
            }
            if (intersects[i].object.userData.isDraggableTeapot && !hitTeapot) {
                hitTeapot = true;
                // No offset calculation - object will follow cursor directly
                // Don't break - check if other objects are also hit
            }
            if (intersects[i].object.userData.isDraggableChair && !hitChair) {
                hitChair = true;
                // No offset calculation - object will follow cursor directly
                // Don't break - check if other objects are also hit
            }
            if (intersects[i].object.userData.isDraggableSofa && !hitSofa) {
                hitSofa = true;
                // No offset calculation - object will follow cursor directly
                // Don't break - check if other objects are also hit
            }
            if (intersects[i].object.userData.isDraggableGlobeLamp && !hitGlobeLamp) {
                hitGlobeLamp = true;
                // No offset calculation - object will follow cursor directly
                // Don't break - check if other objects are also hit
            }
            if (intersects[i].object.userData.isDraggableStool && !hitStool) {
                hitStool = true;
                // No offset calculation - object will follow cursor directly
                // Don't break - check if other objects are also hit
            }
            if (intersects[i].object.userData.isDraggableBird && !hitBird) {
                hitBird = true;
                // No offset calculation - object will follow cursor directly
                // Don't break - check if other objects are also hit
            }
            if (intersects[i].object.userData.isDraggableKoonsDog && !hitKoonsDog) {
                hitKoonsDog = true;
                // No offset calculation - object will follow cursor directly
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
            if (intersects[i].object.userData.isDraggableSkyPig && !hitSkyPig) {
                hitSkyPig = true;
                hitSkyPigObstacle = intersects[i].object.userData.skyPigObstacle;
                
                // Store the actual 3D point where the sky pig was clicked
                var actualClickPoint = intersects[i].point;
                gSkyPigDragPlaneHeight = actualClickPoint.y;
                
                // Store offset from click point to sky pig center
                gSkyPigDragOffset = new THREE.Vector3(
                    hitSkyPigObstacle.position.x - actualClickPoint.x,
                    hitSkyPigObstacle.position.y - actualClickPoint.y,
                    hitSkyPigObstacle.position.z - actualClickPoint.z
                );
                // Don't break - check if other objects are also hit
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
            if (intersects[i].object.userData.isDraggableTorus && !hitTorus) {
                hitTorus = true;
                hitTorusObstacle = intersects[i].object.userData.torusObstacle;
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
                // Don't break - check if base is also hit (base takes precedence)
            }
            if (intersects[i].object.userData.isLampRotation) {
                hitLampRotation = true;
                hitLampId = intersects[i].object.userData.lampId || 1;
                // Don't break - check if base is also hit (base takes precedence)
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
            hitTorus = false;
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
        
        // Mammoth pushbutton click triggers swap animation
        if (hitMammothPushbutton && gMammoth && gMammothSkeleton && gMammothSwapState === 'idle') {
            // Start the swap animation
            gMammothSwapState = 'expanding-mini';
            gMammothSwapTimer = 0;
            gMiniMammothStartY = gMammoth.position.y;
            
            // Position skeleton at the same X,Z location as mini mammoth
            gMammothSkeleton.position.x = gMammoth.position.x;
            gMammothSkeleton.position.z = gMammoth.position.z;
            gMammothSkeleton.position.y = gFullMammothStartY;
            
            // Dim lights and create spotlight above mini mammoth
            dimLightsForDrag();
            gMammothSwapSpotlight = new THREE.SpotLight(0xffffff, 3.0);
            gMammothSwapSpotlight.position.set(gMammoth.position.x, gMammoth.position.y + 15, gMammoth.position.z);
            gMammothSwapSpotlight.angle = Math.PI / 6;
            gMammothSwapSpotlight.penumbra = 0.3;
            gMammothSwapSpotlight.distance = 30;
            gMammothSwapSpotlight.decay = 2;
            gMammothSwapSpotlight.target.position.set(gMammoth.position.x, gMammoth.position.y, gMammoth.position.z);
            gThreeScene.add(gMammothSwapSpotlight);
            gThreeScene.add(gMammothSwapSpotlight.target);
            
            // Create the disc for the hole animation
            var discGeometry = new THREE.CircleGeometry(0.01, 32);
            var discMaterial = new THREE.MeshStandardMaterial({
                color: 0x000000,
                side: THREE.DoubleSide,
                transparent: false
            });
            gMammothSwapDisc = new THREE.Mesh(discGeometry, discMaterial);
            gMammothSwapDisc.position.set(gMammoth.position.x, 0.05, gMammoth.position.z);
            gMammothSwapDisc.rotation.x = -Math.PI / 2; // Lay flat on floor
            gMammothSwapDisc.receiveShadow = true;
            gThreeScene.add(gMammothSwapDisc);
            
            // Create white outline ring
            var ringGeometry = new THREE.RingGeometry(0.009, 0.011, 32);
            var ringMaterial = new THREE.MeshStandardMaterial({
                color: 0xFFFFFF,
                side: THREE.DoubleSide
            });
            gMammothSwapDiscOutline = new THREE.Mesh(ringGeometry, ringMaterial);
            gMammothSwapDiscOutline.position.set(gMammoth.position.x, 0.06, gMammoth.position.z);
            gMammothSwapDiscOutline.rotation.x = -Math.PI / 2;
            gMammothSwapDiscOutline.receiveShadow = true;
            gThreeScene.add(gMammothSwapDiscOutline);
            
            return;
        }
        
        if (hitDuck && gDuck && !hitDuckBeak) {
            var currentTime = Date.now();
            var timeSinceLastClick = currentTime - gLastObjectClickTime.duck;
            
            if (gCurrentlyDraggingObject === 'duck') {
                // Single-click while dragging - lock position and exit dragging mode
                gCurrentlyDraggingObject = null;
                gDraggingDuck = false;
                gDuckDragOffset = null;
                // Restore lights and remove spotlight
                restoreLightsFromDrag();
                removeDragSpotlight();
                if (gCameraControl) {
                    gCameraControl.enabled = true;
                }
                gLastObjectClickTime.duck = 0; // Reset to prevent accidental double-click
                return;
            }
            
            if (timeSinceLastClick < 300) { // 300ms double-click threshold
                // Double-click detected - enter dragging mode
                if (gCurrentlyDraggingObject !== null && gCurrentlyDraggingObject !== 'duck') {
                    // Another object is being dragged, ignore this double-click
                    return;
                }
                gCurrentlyDraggingObject = 'duck';
                gDraggingDuck = true;
                gDuckDragPlaneHeight = gDuck.position.y;
                
                // Dim other lights and create spotlight
                dimLightsForDrag();
                createDragSpotlight(gDuck.position);
                
                // Calculate offset from mouse position to object center
                var rect = gRenderer.domElement.getBoundingClientRect();
                var mousePos = new THREE.Vector2();
                mousePos.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
                mousePos.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
                var raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(mousePos, gCamera);
                var duckPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -gDuckDragPlaneHeight);
                var intersectionPoint = new THREE.Vector3();
                raycaster.ray.intersectPlane(duckPlane, intersectionPoint);
                if (intersectionPoint) {
                    gDuckDragOffset = new THREE.Vector3(
                        gDuck.position.x - intersectionPoint.x,
                        0,
                        gDuck.position.z - intersectionPoint.z
                    );
                }
                
                gPointerLastX = evt.clientX;
                gPointerLastY = evt.clientY;
                // Disable orbit controls while dragging duck
                if (gCameraControl) {
                    gCameraControl.enabled = false;
                }
                gLastObjectClickTime.duck = 0; // Reset to prevent triple-click
                return;
            }
            
            gLastObjectClickTime.duck = currentTime;
            return;
        }
        
        if (hitMammoth && gMammoth) {
            var currentTime = Date.now();
            var timeSinceLastClick = currentTime - gLastObjectClickTime.mammoth;
            
            if (gCurrentlyDraggingObject === 'mammoth') {
                // Single-click while dragging - lock position and exit dragging mode
                gCurrentlyDraggingObject = null;
                gDraggingMammoth = false;
                gMammothDragOffset = null;
                // Restore lights and remove spotlight
                restoreLightsFromDrag();
                removeDragSpotlight();
                if (gCameraControl) {
                    gCameraControl.enabled = true;
                }
                gLastObjectClickTime.mammoth = 0; // Reset to prevent accidental double-click
                return;
            }
            
            if (timeSinceLastClick < 300) { // 300ms double-click threshold
                // Double-click detected - enter dragging mode
                if (gCurrentlyDraggingObject !== null && gCurrentlyDraggingObject !== 'mammoth') {
                    // Another object is being dragged, ignore this double-click
                    return;
                }
                gCurrentlyDraggingObject = 'mammoth';
                gDraggingMammoth = true;
                gMammothDragPlaneHeight = gMammoth.position.y;
                
                // Dim other lights and create spotlight
                dimLightsForDrag();
                createDragSpotlight(gMammoth.position);
                
                // Calculate offset from mouse position to object center
                var rect = gRenderer.domElement.getBoundingClientRect();
                var mousePos = new THREE.Vector2();
                mousePos.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
                mousePos.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
                var raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(mousePos, gCamera);
                var mammothPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -gMammothDragPlaneHeight);
                var intersectionPoint = new THREE.Vector3();
                raycaster.ray.intersectPlane(mammothPlane, intersectionPoint);
                if (intersectionPoint) {
                    gMammothDragOffset = new THREE.Vector3(
                        gMammoth.position.x - intersectionPoint.x,
                        0,
                        gMammoth.position.z - intersectionPoint.z
                    );
                }
                
                gPointerLastX = evt.clientX;
                gPointerLastY = evt.clientY;
                // Disable orbit controls while dragging mammoth
                if (gCameraControl) {
                    gCameraControl.enabled = false;
                }
                gLastObjectClickTime.mammoth = 0; // Reset to prevent triple-click
                return;
            }
            
            gLastObjectClickTime.mammoth = currentTime;
            return;
        }
        
        if (hitMammothSkeleton && gMammothSkeleton) {
            var currentTime = Date.now();
            var timeSinceLastClick = currentTime - gLastObjectClickTime.mammothSkeleton;
            
            if (gCurrentlyDraggingObject === 'mammothSkeleton') {
                // Single-click while dragging - lock position and exit dragging mode
                gCurrentlyDraggingObject = null;
                gDraggingMammothSkeleton = false;
                gMammothSkeletonDragOffset = null;
                // Restore lights and remove spotlight
                restoreLightsFromDrag();
                removeDragSpotlight();
                if (gCameraControl) {
                    gCameraControl.enabled = true;
                }
                gLastObjectClickTime.mammothSkeleton = 0; // Reset to prevent accidental double-click
                return;
            }
            
            if (timeSinceLastClick < 300) { // 300ms double-click threshold
                // Double-click detected - enter dragging mode
                if (gCurrentlyDraggingObject !== null && gCurrentlyDraggingObject !== 'mammothSkeleton') {
                    // Another object is being dragged, ignore this double-click
                    return;
                }
                gCurrentlyDraggingObject = 'mammothSkeleton';
                gDraggingMammothSkeleton = true;
                gMammothSkeletonDragPlaneHeight = gMammothSkeleton.position.y;
                
                // Dim other lights and create spotlight
                dimLightsForDrag();
                createDragSpotlight(gMammothSkeleton.position);
                
                // Calculate offset from mouse position to object center
                var rect = gRenderer.domElement.getBoundingClientRect();
                var mousePos = new THREE.Vector2();
                mousePos.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
                mousePos.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
                var raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(mousePos, gCamera);
                var skeletonPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -gMammothSkeletonDragPlaneHeight);
                var intersectionPoint = new THREE.Vector3();
                raycaster.ray.intersectPlane(skeletonPlane, intersectionPoint);
                if (intersectionPoint) {
                    gMammothSkeletonDragOffset = new THREE.Vector3(
                        gMammothSkeleton.position.x - intersectionPoint.x,
                        0,
                        gMammothSkeleton.position.z - intersectionPoint.z
                    );
                }
                
                gPointerLastX = evt.clientX;
                gPointerLastY = evt.clientY;
                // Disable orbit controls while dragging skeleton
                if (gCameraControl) {
                    gCameraControl.enabled = false;
                }
                gLastObjectClickTime.mammothSkeleton = 0; // Reset to prevent triple-click
                return;
            }
            
            gLastObjectClickTime.mammothSkeleton = currentTime;
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
            var currentTime = Date.now();
            var timeSinceLastClick = currentTime - gLastObjectClickTime.teapot;
            
            if (gCurrentlyDraggingObject === 'teapot') {
                // Single-click while dragging - lock position and exit dragging mode
                gCurrentlyDraggingObject = null;
                gDraggingTeapot = false;
                gTeapotDragOffset = null;
                // Restore lights and remove spotlight
                restoreLightsFromDrag();
                removeDragSpotlight();
                if (gCameraControl) {
                    gCameraControl.enabled = true;
                }
                gLastObjectClickTime.teapot = 0; // Reset to prevent accidental double-click
                return;
            }
            
            if (timeSinceLastClick < 300) { // 300ms double-click threshold
                // Double-click detected - enter dragging mode
                // Stop the teapot animation if still running
                gTeapotAnimating = false;
                if (gCurrentlyDraggingObject !== null && gCurrentlyDraggingObject !== 'teapot') {
                    // Another object is being dragged, ignore this double-click
                    return;
                }
                gCurrentlyDraggingObject = 'teapot';
                gDraggingTeapot = true;
                gTeapotDragPlaneHeight = gTeapot.position.y;
                
                // Dim other lights and create spotlight
                dimLightsForDrag();
                createDragSpotlight(gTeapot.position);
                
                // Calculate offset from mouse position to object center
                var rect = gRenderer.domElement.getBoundingClientRect();
                var mousePos = new THREE.Vector2();
                mousePos.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
                mousePos.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
                var raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(mousePos, gCamera);
                var teapotPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -gTeapotDragPlaneHeight);
                var intersectionPoint = new THREE.Vector3();
                raycaster.ray.intersectPlane(teapotPlane, intersectionPoint);
                if (intersectionPoint) {
                    gTeapotDragOffset = new THREE.Vector3(
                        gTeapot.position.x - intersectionPoint.x,
                        0,
                        gTeapot.position.z - intersectionPoint.z
                    );
                }
                
                gPointerLastX = evt.clientX;
                gPointerLastY = evt.clientY;
                // Disable orbit controls while dragging teapot
                if (gCameraControl) {
                    gCameraControl.enabled = false;
                }
                gLastObjectClickTime.teapot = 0; // Reset to prevent triple-click
                return;
            }
            
            gLastObjectClickTime.teapot = currentTime;
            return;
        }
        
        if (hitChair && gChair) {
            var currentTime = Date.now();
            var timeSinceLastClick = currentTime - gLastObjectClickTime.chair;
            
            if (gCurrentlyDraggingObject === 'chair') {
                // Single-click while dragging - lock position and exit dragging mode
                gCurrentlyDraggingObject = null;
                gDraggingChair = false;
                gChairDragOffset = null;
                // Restore lights and remove spotlight
                restoreLightsFromDrag();
                removeDragSpotlight();
                if (gCameraControl) {
                    gCameraControl.enabled = true;
                }
                gLastObjectClickTime.chair = 0; // Reset to prevent accidental double-click
                return;
            }
            
            if (timeSinceLastClick < 300) { // 300ms double-click threshold
                // Double-click detected - enter dragging mode
                if (gCurrentlyDraggingObject !== null && gCurrentlyDraggingObject !== 'chair') {
                    // Another object is being dragged, ignore this double-click
                    return;
                }
                gCurrentlyDraggingObject = 'chair';
                gDraggingChair = true;
                gChairDragPlaneHeight = gChair.position.y;
                
                // Dim other lights and create spotlight
                dimLightsForDrag();
                createDragSpotlight(gChair.position);
                
                // Calculate offset from mouse position to object center
                var rect = gRenderer.domElement.getBoundingClientRect();
                var mousePos = new THREE.Vector2();
                mousePos.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
                mousePos.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
                var raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(mousePos, gCamera);
                var chairPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -gChairDragPlaneHeight);
                var intersectionPoint = new THREE.Vector3();
                raycaster.ray.intersectPlane(chairPlane, intersectionPoint);
                if (intersectionPoint) {
                    gChairDragOffset = new THREE.Vector3(
                        gChair.position.x - intersectionPoint.x,
                        0,
                        gChair.position.z - intersectionPoint.z
                    );
                }
                
                gPointerLastX = evt.clientX;
                gPointerLastY = evt.clientY;
                // Disable orbit controls while dragging chair
                if (gCameraControl) {
                    gCameraControl.enabled = false;
                }
                gLastObjectClickTime.chair = 0; // Reset to prevent triple-click
                return;
            }
            
            gLastObjectClickTime.chair = currentTime;
            return;
        }
        
        if (hitSofa && gSofa) {
            var currentTime = Date.now();
            var timeSinceLastClick = currentTime - gLastObjectClickTime.sofa;
            
            if (gCurrentlyDraggingObject === 'sofa') {
                // Single-click while dragging - lock position and exit dragging mode
                gCurrentlyDraggingObject = null;
                gDraggingSofa = false;
                gSofaDragOffset = null;
                // Restore lights and remove spotlight
                restoreLightsFromDrag();
                removeDragSpotlight();
                if (gCameraControl) {
                    gCameraControl.enabled = true;
                }
                gLastObjectClickTime.sofa = 0; // Reset to prevent accidental double-click
                return;
            }
            
            if (timeSinceLastClick < 300) { // 300ms double-click threshold
                // Double-click detected - enter dragging mode
                if (gCurrentlyDraggingObject !== null && gCurrentlyDraggingObject !== 'sofa') {
                    // Another object is being dragged, ignore this double-click
                    return;
                }
                gCurrentlyDraggingObject = 'sofa';
                gDraggingSofa = true;
                gSofaDragPlaneHeight = gSofa.position.y;
                
                // Dim other lights and create spotlight
                dimLightsForDrag();
                createDragSpotlight(gSofa.position);
                
                // Calculate offset from mouse position to object center
                var rect = gRenderer.domElement.getBoundingClientRect();
                var mousePos = new THREE.Vector2();
                mousePos.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
                mousePos.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
                var raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(mousePos, gCamera);
                var sofaPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -gSofaDragPlaneHeight);
                var intersectionPoint = new THREE.Vector3();
                raycaster.ray.intersectPlane(sofaPlane, intersectionPoint);
                if (intersectionPoint) {
                    gSofaDragOffset = new THREE.Vector3(
                        gSofa.position.x - intersectionPoint.x,
                        0,
                        gSofa.position.z - intersectionPoint.z
                    );
                }
                
                gPointerLastX = evt.clientX;
                gPointerLastY = evt.clientY;
                // Disable orbit controls while dragging sofa
                if (gCameraControl) {
                    gCameraControl.enabled = false;
                }
                gLastObjectClickTime.sofa = 0; // Reset to prevent triple-click
                return;
            }
            
            gLastObjectClickTime.sofa = currentTime;
            return;
        }
        
        if (hitGlobeLamp && gGlobeLamp) {
            var currentTime = Date.now();
            var timeSinceLastClick = currentTime - gLastObjectClickTime.globeLamp;
            
            if (gCurrentlyDraggingObject === 'globeLamp') {
                // Single-click while dragging - lock position and exit dragging mode
                gCurrentlyDraggingObject = null;
                gDraggingGlobeLamp = false;
                gGlobeLampDragOffset = null;
                // Restore lights and remove spotlight
                restoreLightsFromDrag();
                removeDragSpotlight();
                if (gCameraControl) {
                    gCameraControl.enabled = true;
                }
                gLastObjectClickTime.globeLamp = 0; // Reset to prevent accidental double-click
                return;
            }
            
            if (timeSinceLastClick < 300) { // 300ms double-click threshold
                // Double-click detected - enter dragging mode
                if (gCurrentlyDraggingObject !== null && gCurrentlyDraggingObject !== 'globeLamp') {
                    // Another object is being dragged, ignore this double-click
                    return;
                }
                gCurrentlyDraggingObject = 'globeLamp';
                gDraggingGlobeLamp = true;
                
                // Dim other lights and create spotlight
                dimLightsForDrag();
                createDragSpotlight(gGlobeLamp.position);
                
                // Store the distance from camera to globe lamp center (for fixed plane)
                var cameraToLamp = new THREE.Vector3();
                cameraToLamp.subVectors(gGlobeLamp.position, gCamera.position);
                var cameraDirection = new THREE.Vector3();
                gCamera.getWorldDirection(cameraDirection);
                gGlobeLampDragPlaneDistance = cameraToLamp.dot(cameraDirection);
                
                // Calculate offset from mouse position to object center
                var rect = gRenderer.domElement.getBoundingClientRect();
                var mousePos = new THREE.Vector2();
                mousePos.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
                mousePos.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
                var raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(mousePos, gCamera);
                var planePoint = new THREE.Vector3();
                planePoint.addVectors(gCamera.position, cameraDirection.multiplyScalar(gGlobeLampDragPlaneDistance));
                var globeLampPlane = new THREE.Plane();
                globeLampPlane.setFromNormalAndCoplanarPoint(cameraDirection, planePoint);
                var intersectionPoint = new THREE.Vector3();
                raycaster.ray.intersectPlane(globeLampPlane, intersectionPoint);
                if (intersectionPoint) {
                    gGlobeLampDragOffset = new THREE.Vector3(
                        gGlobeLamp.position.x - intersectionPoint.x,
                        gGlobeLamp.position.y - intersectionPoint.y,
                        gGlobeLamp.position.z - intersectionPoint.z
                    );
                }
                
                gPointerLastX = evt.clientX;
                gPointerLastY = evt.clientY;
                // Disable orbit controls while dragging globe lamp
                if (gCameraControl) {
                    gCameraControl.enabled = false;
                }
                gLastObjectClickTime.globeLamp = 0; // Reset to prevent triple-click
                return;
            }
            
            gLastObjectClickTime.globeLamp = currentTime;
            return;
        }
        
        if (hitStool && gStool) {
            var currentTime = Date.now();
            var timeSinceLastClick = currentTime - gLastObjectClickTime.stool;
            
            if (gCurrentlyDraggingObject === 'stool') {
                // Single-click while dragging - lock position and exit dragging mode
                gCurrentlyDraggingObject = null;
                gDraggingStool = false;
                gStoolDragOffset = null;
                // Restore lights and remove spotlight
                restoreLightsFromDrag();
                removeDragSpotlight();
                if (gCameraControl) {
                    gCameraControl.enabled = true;
                }
                gLastObjectClickTime.stool = 0; // Reset to prevent accidental double-click
                return;
            }
            
            if (timeSinceLastClick < 300) { // 300ms double-click threshold
                // Double-click detected - enter dragging mode
                if (gCurrentlyDraggingObject !== null && gCurrentlyDraggingObject !== 'stool') {
                    // Another object is being dragged, ignore this double-click
                    return;
                }
                gCurrentlyDraggingObject = 'stool';
                gDraggingStool = true;
                gStoolDragPlaneHeight = gStool.position.y;
                
                // Dim other lights and create spotlight
                dimLightsForDrag();
                createDragSpotlight(gStool.position);
                
                // Calculate offset from mouse position to object center
                var rect = gRenderer.domElement.getBoundingClientRect();
                var mousePos = new THREE.Vector2();
                mousePos.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
                mousePos.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
                var raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(mousePos, gCamera);
                var stoolPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -gStoolDragPlaneHeight);
                var intersectionPoint = new THREE.Vector3();
                raycaster.ray.intersectPlane(stoolPlane, intersectionPoint);
                if (intersectionPoint) {
                    gStoolDragOffset = new THREE.Vector3(
                        gStool.position.x - intersectionPoint.x,
                        0,
                        gStool.position.z - intersectionPoint.z
                    );
                }
                
                gPointerLastX = evt.clientX;
                gPointerLastY = evt.clientY;
                // Disable orbit controls while dragging stool
                if (gCameraControl) {
                    gCameraControl.enabled = false;
                }
                gLastObjectClickTime.stool = 0; // Reset to prevent triple-click
                return;
            }
            
            gLastObjectClickTime.stool = currentTime;
            return;
        }
        
        if (hitBird && gBird) {
            var currentTime = Date.now();
            var timeSinceLastClick = currentTime - gLastObjectClickTime.bird;
            
            if (gCurrentlyDraggingObject === 'bird') {
                // Single-click while dragging - lock position and exit dragging mode
                gCurrentlyDraggingObject = null;
                gDraggingBird = false;
                gBirdDragOffset = null;
                // Restore lights and remove spotlight
                restoreLightsFromDrag();
                removeDragSpotlight();
                if (gCameraControl) {
                    gCameraControl.enabled = true;
                }
                gLastObjectClickTime.bird = 0; // Reset to prevent accidental double-click
                return;
            }
            
            if (timeSinceLastClick < 300) { // 300ms double-click threshold
                // Double-click detected - enter dragging mode
                // Stop the bird animation if still running
                gBirdAnimating = false;
                if (gCurrentlyDraggingObject !== null && gCurrentlyDraggingObject !== 'bird') {
                    // Another object is being dragged, ignore this double-click
                    return;
                }
                gCurrentlyDraggingObject = 'bird';
                gDraggingBird = true;
                gBirdDragPlaneHeight = gBird.position.y;
                
                // Dim other lights and create spotlight
                dimLightsForDrag();
                createDragSpotlight(gBird.position);
                
                // Calculate offset from mouse position to object center
                var rect = gRenderer.domElement.getBoundingClientRect();
                var mousePos = new THREE.Vector2();
                mousePos.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
                mousePos.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
                var raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(mousePos, gCamera);
                var birdPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -gBirdDragPlaneHeight);
                var intersectionPoint = new THREE.Vector3();
                raycaster.ray.intersectPlane(birdPlane, intersectionPoint);
                if (intersectionPoint) {
                    gBirdDragOffset = new THREE.Vector3(
                        gBird.position.x - intersectionPoint.x,
                        0,
                        gBird.position.z - intersectionPoint.z
                    );
                }
                
                gPointerLastX = evt.clientX;
                gPointerLastY = evt.clientY;
                // Disable orbit controls while dragging bird
                if (gCameraControl) {
                    gCameraControl.enabled = false;
                }
                gLastObjectClickTime.bird = 0; // Reset to prevent triple-click
                return;
            }
            
            gLastObjectClickTime.bird = currentTime;
            return;
        }
        
        if (hitKoonsDog && gKoonsDog) {
            var currentTime = Date.now();
            var timeSinceLastClick = currentTime - gLastObjectClickTime.koonsDog;
            
            if (gCurrentlyDraggingObject === 'koonsDog') {
                // Single-click while dragging - lock position and exit dragging mode
                gCurrentlyDraggingObject = null;
                gDraggingKoonsDog = false;
                gKoonsDogDragOffset = null;
                // Restore lights and remove spotlight
                restoreLightsFromDrag();
                removeDragSpotlight();
                if (gCameraControl) {
                    gCameraControl.enabled = true;
                }
                gLastObjectClickTime.koonsDog = 0; // Reset to prevent accidental double-click
                return;
            }
            
            if (timeSinceLastClick < 300) { // 300ms double-click threshold
                // Double-click detected - enter dragging mode
                if (gCurrentlyDraggingObject !== null && gCurrentlyDraggingObject !== 'koonsDog') {
                    // Another object is being dragged, ignore this double-click
                    return;
                }
                gCurrentlyDraggingObject = 'koonsDog';
                gDraggingKoonsDog = true;
                gKoonsDogDragPlaneHeight = gKoonsDog.position.y;
                
                // Dim other lights and create spotlight
                dimLightsForDrag();
                createDragSpotlight(gKoonsDog.position);
                
                // Calculate offset from mouse position to object center
                var rect = gRenderer.domElement.getBoundingClientRect();
                var mousePos = new THREE.Vector2();
                mousePos.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
                mousePos.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
                var raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(mousePos, gCamera);
                var dogPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -gKoonsDogDragPlaneHeight);
                var intersectionPoint = new THREE.Vector3();
                raycaster.ray.intersectPlane(dogPlane, intersectionPoint);
                if (intersectionPoint) {
                    gKoonsDogDragOffset = new THREE.Vector3(
                        gKoonsDog.position.x - intersectionPoint.x,
                        0,
                        gKoonsDog.position.z - intersectionPoint.z
                    );
                }
                
                gPointerLastX = evt.clientX;
                gPointerLastY = evt.clientY;
                // Disable orbit controls while dragging Koons Dog
                if (gCameraControl) {
                    gCameraControl.enabled = false;
                }
                gLastObjectClickTime.koonsDog = 0; // Reset to prevent triple-click
                return;
            }
            
            gLastObjectClickTime.koonsDog = currentTime;
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
            
            // Calculate the initial drag plane intersection to get proper offset
            var rect = gRenderer.domElement.getBoundingClientRect();
            var mousePos = new THREE.Vector2();
            mousePos.x = ((evt.clientX - rect.left) / rect.width ) * 2 - 1;
            mousePos.y = -((evt.clientY - rect.top) / rect.height ) * 2 + 1;
            
            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mousePos, gCamera);
            
            // Create the drag plane
            var planePoint = new THREE.Vector3();
            planePoint.addVectors(gCamera.position, cameraDirection.multiplyScalar(gSphereDragPlaneDistance));
            var dragPlane = new THREE.Plane();
            dragPlane.setFromNormalAndCoplanarPoint(cameraDirection, planePoint);
            
            // Find where ray intersects drag plane
            var planeIntersection = new THREE.Vector3();
            raycaster.ray.intersectPlane(dragPlane, planeIntersection);
            
            if (planeIntersection) {
                // Store offset from plane intersection to sphere center
                gSphereDragOffset = new THREE.Vector3(
                    hitSphereObstacle.position.x - planeIntersection.x,
                    hitSphereObstacle.position.y - planeIntersection.y,
                    hitSphereObstacle.position.z - planeIntersection.z
                );
            } else {
                // Fallback to zero offset if plane intersection fails
                gSphereDragOffset = new THREE.Vector3(0, 0, 0);
            }
            
            gPointerLastX = evt.clientX;
            gPointerLastY = evt.clientY;
            // Disable orbit controls while dragging sphere
            if (gCameraControl) {
                gCameraControl.enabled = false;
            }
            return;
        }
        
        if (hitSkyPig && hitSkyPigObstacle) {
            gDraggingSkyPig = true;
            window.draggingSkyPigObstacle = hitSkyPigObstacle; // Store reference globally
            
            // Store the distance from camera to sky pig center (for fixed plane)
            var cameraToSkyPig = new THREE.Vector3();
            cameraToSkyPig.subVectors(hitSkyPigObstacle.position, gCamera.position);
            var cameraDirection = new THREE.Vector3();
            gCamera.getWorldDirection(cameraDirection);
            gSkyPigDragPlaneDistance = cameraToSkyPig.dot(cameraDirection);
            
            // Calculate the initial drag plane intersection to get proper offset
            var rect = gRenderer.domElement.getBoundingClientRect();
            var mousePos = new THREE.Vector2();
            mousePos.x = ((evt.clientX - rect.left) / rect.width ) * 2 - 1;
            mousePos.y = -((evt.clientY - rect.top) / rect.height ) * 2 + 1;
            
            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mousePos, gCamera);
            
            // Create the drag plane
            var planePoint = new THREE.Vector3();
            planePoint.addVectors(gCamera.position, cameraDirection.multiplyScalar(gSkyPigDragPlaneDistance));
            var dragPlane = new THREE.Plane();
            dragPlane.setFromNormalAndCoplanarPoint(cameraDirection, planePoint);
            
            // Find where ray intersects drag plane
            var planeIntersection = new THREE.Vector3();
            raycaster.ray.intersectPlane(dragPlane, planeIntersection);
            
            if (planeIntersection) {
                // Store offset from plane intersection to sky pig center
                gSkyPigDragOffset = new THREE.Vector3(
                    hitSkyPigObstacle.position.x - planeIntersection.x,
                    hitSkyPigObstacle.position.y - planeIntersection.y,
                    hitSkyPigObstacle.position.z - planeIntersection.z
                );
            } else {
                // Fallback to zero offset if plane intersection fails
                gSkyPigDragOffset = new THREE.Vector3(0, 0, 0);
            }
            
            gPointerLastX = evt.clientX;
            gPointerLastY = evt.clientY;
            // Disable orbit controls while dragging sky pig
            if (gCameraControl) {
                gCameraControl.enabled = false;
            }
            return;
        }
        
        if (hitCylinder && hitCylinderObstacle) {
            gDraggingCylinder = true;
            window.draggingCylinderObstacle = hitCylinderObstacle; // Store reference globally
            
            // Permanently disable animations - once dragged, animations should never run again
            gColumnEverDragged = true;
            gColumnBaseSliding = false;
            gColumnDropping = false;
            
            // Immediately synchronize base component positions with column position
            if (gColumnObstacle) {
                const currentPos = gColumnObstacle.position.clone();
                gColumnObstacle.updatePosition(currentPos);
            }
            
            gPointerLastX = evt.clientX;
            gPointerLastY = evt.clientY;
            // Disable orbit controls while dragging cylinder
            if (gCameraControl) {
                gCameraControl.enabled = false;
            }
            return;
        }
        
        if (hitTorus && hitTorusObstacle) {
            gDraggingTorus = true;
            window.draggingTorusObstacle = hitTorusObstacle; // Store reference globally
            
            // Store the distance from camera to torus center (for fixed plane)
            var cameraToTorus = new THREE.Vector3();
            cameraToTorus.subVectors(hitTorusObstacle.position, gCamera.position);
            var cameraDirection = new THREE.Vector3();
            gCamera.getWorldDirection(cameraDirection);
            gTorusDragPlaneDistance = cameraToTorus.dot(cameraDirection);
            
            // Calculate initial offset by finding where mouse ray hits the drag plane
            var rect = gRenderer.domElement.getBoundingClientRect();
            var mousePos = new THREE.Vector2();
            mousePos.x = ((evt.clientX - rect.left) / rect.width ) * 2 - 1;
            mousePos.y = -((evt.clientY - rect.top) / rect.height ) * 2 + 1;
            
            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mousePos, gCamera);
            
            // Create the drag plane
            var planePoint = new THREE.Vector3();
            planePoint.addVectors(gCamera.position, cameraDirection.multiplyScalar(gTorusDragPlaneDistance));
            var dragPlane = new THREE.Plane();
            dragPlane.setFromNormalAndCoplanarPoint(cameraDirection, planePoint);
            
            // Find where ray intersects drag plane
            var planeIntersection = new THREE.Vector3();
            raycaster.ray.intersectPlane(dragPlane, planeIntersection);
            
            if (planeIntersection) {
                // Store offset from plane intersection to torus center
                gTorusDragOffset = new THREE.Vector3(
                    hitTorusObstacle.position.x - planeIntersection.x,
                    hitTorusObstacle.position.y - planeIntersection.y,
                    hitTorusObstacle.position.z - planeIntersection.z
                );
            } else {
                // Fallback to zero offset if plane intersection fails
                gTorusDragOffset = new THREE.Vector3(0, 0, 0);
            }
            
            gPointerLastX = evt.clientX;
            gPointerLastY = evt.clientY;
            // Disable orbit controls while dragging torus
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
        
        // If in toggle-dragging mode and clicking empty space, exit dragging mode
        if (gCurrentlyDraggingObject !== null) {
            gCurrentlyDraggingObject = null;
            gDraggingDuck = false;
            gDraggingMammoth = false;
            gDraggingMammothSkeleton = false;
            gDraggingTeapot = false;
            gDraggingChair = false;
            gDraggingSofa = false;
            gDraggingStool = false;
            gDraggingBird = false;
            gDraggingKoonsDog = false;
            gDraggingGlobeLamp = false;
            // Clear drag offsets
            gDuckDragOffset = null;
            gMammothDragOffset = null;
            gMammothSkeletonDragOffset = null;
            gTeapotDragOffset = null;
            gChairDragOffset = null;
            gSofaDragOffset = null;
            gStoolDragOffset = null;
            gBirdDragOffset = null;
            gKoonsDogDragOffset = null;
            gGlobeLampDragOffset = null;
            // Restore lights and remove spotlight
            restoreLightsFromDrag();
            removeDragSpotlight();
            // Re-enable orbit controls
            if (gCameraControl) {
                gCameraControl.enabled = true;
            }
            return;
        }
        
        // Handle camera control in follow modes and walking mode
        if (gCameraMode === 3 || gCameraMode === 4) {
            gCameraManualControl = true;
            gPointerLastX = evt.clientX;
            gPointerLastY = evt.clientY;
            return;
        }
        
        // Handle mouse look for walking mode - toggle lock on click (like dolly cam)
        if (gCameraMode === 5) {
            gWalkingCameraLookLocked = !gWalkingCameraLookLocked;
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
            } else if (draggingMenuType === 'camera') {
                cameraMenuX = menuStartX + deltaX / window.innerWidth;
                cameraMenuY = menuStartY + deltaY / window.innerHeight;
            }
            return;
        }
        
        // Handle dolly rails dragging
        if (gDraggingDolly) {
            if (gDraggingDollyEnd === 'start' || gDraggingDollyEnd === 'end') {
                // Dragging an end - pivot stays fixed, length changes
                const rect = gRenderer.domElement.getBoundingClientRect();
                const mousePos = new THREE.Vector2();
                mousePos.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
                mousePos.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
                
                const raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(mousePos, gCamera);
                
                // Intersect with ground plane (y=0)
                const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
                const intersectionPoint = new THREE.Vector3();
                raycaster.ray.intersectPlane(groundPlane, intersectionPoint);
                
                if (intersectionPoint && gDollyDragPivotPosition) {
                    // The pivot end stays at its fixed world position
                    // The dragged end moves to the mouse intersection
                    
                    let startCapWorldPos, endCapWorldPos;
                    
                    if (gDraggingDollyEnd === 'start') {
                        // Dragging the start cap - it follows the mouse
                        startCapWorldPos = new THREE.Vector3(intersectionPoint.x, 0, intersectionPoint.z);
                        // End cap stays at stored pivot
                        endCapWorldPos = new THREE.Vector3(gDollyDragPivotPosition.x, 0, gDollyDragPivotPosition.z);
                    } else {
                        // Dragging the end cap - it follows the mouse
                        endCapWorldPos = new THREE.Vector3(intersectionPoint.x, 0, intersectionPoint.z);
                        // Start cap stays at stored pivot
                        startCapWorldPos = new THREE.Vector3(gDollyDragPivotPosition.x, 0, gDollyDragPivotPosition.z);
                    }
                    
                    // Calculate new length from the distance between the caps
                    const dx = endCapWorldPos.x - startCapWorldPos.x;
                    const dz = endCapWorldPos.z - startCapWorldPos.z;
                    const newLength = Math.sqrt(dx * dx + dz * dz);
                    gDollyRailsLength = Math.max(10, newLength);
                    
                    // Calculate rotation (direction from start to end)
                    // NOTE: Negating dz because of how Three.js rotation around Y-axis works
                    gDollyRailsRotation = Math.atan2(-dz, dx);
                    
                    // Calculate center (midpoint between the two caps)
                    gDollyRailsPosition.set(
                        (startCapWorldPos.x + endCapWorldPos.x) / 2,
                        0,
                        (startCapWorldPos.z + endCapWorldPos.z) / 2
                    );
                    
                    // Update the existing mesh instead of recreating
                    updateDollyRailsMeshForDrag(gDollyRailsLength);
                }
            } else {
                // Translating the entire dolly rails horizontally
                const rect = gRenderer.domElement.getBoundingClientRect();
                const mousePos = new THREE.Vector2();
                mousePos.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
                mousePos.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
                
                const raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(mousePos, gCamera);
                
                // Intersect with ground plane (y=0)
                const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
                const intersectionPoint = new THREE.Vector3();
                raycaster.ray.intersectPlane(groundPlane, intersectionPoint);
                
                if (intersectionPoint) {
                    // Calculate drag delta
                    const startX = ((gDollyDragStartMouseX - rect.left) / rect.width) * 2 - 1;
                    const startY = -((gDollyDragStartMouseY - rect.top) / rect.height) * 2 + 1;
                    const startRaycaster = new THREE.Raycaster();
                    startRaycaster.setFromCamera(new THREE.Vector2(startX, startY), gCamera);
                    const startPoint = new THREE.Vector3();
                    startRaycaster.ray.intersectPlane(groundPlane, startPoint);
                    
                    if (startPoint) {
                        const deltaX = intersectionPoint.x - startPoint.x;
                        const deltaZ = intersectionPoint.z - startPoint.z;
                        
                        gDollyRailsPosition.set(
                            gDollyDragStartPosition.x + deltaX,
                            0,
                            gDollyDragStartPosition.z + deltaZ
                        );
                        
                        updateDollyRailsTransform();
                    }
                }
            }
            return;
        }
        
        // Handle mix knob dragging
        if (gDraggingMixKnob) {
            const deltaX = (evt.clientX - dragStartMouseX) / window.innerWidth;
            const deltaY = (evt.clientY - dragStartMouseY) / window.innerHeight;
            const dragDelta = deltaX + deltaY;
            
            const dragSensitivity = 0.15;
            const normalizedDelta = dragDelta / dragSensitivity;
            const rangeSize = 100; // 0 to 100 percentage
            let newValue = dragStartValue + normalizedDelta * rangeSize;
            newValue = Math.max(0, Math.min(100, newValue));
            
            gColorMixPercentage = newValue;
            applyMixedColors();
            return;
        }
        
        // Handle saturation knob dragging
        if (gDraggingSaturationKnob) {
            const deltaX = (evt.clientX - dragStartMouseX) / window.innerWidth;
            const deltaY = (evt.clientY - dragStartMouseY) / window.innerHeight;
            const dragDelta = deltaX + deltaY;
            
            const dragSensitivity = 0.12;
            const normalizedDelta = dragDelta / dragSensitivity;
            const rangeSize = 100; // 0 to 100 percentage
            let newValue = dragStartValue + normalizedDelta * rangeSize;
            newValue = Math.max(0, Math.min(100, newValue));
            
            gBoidSaturation = Math.round(newValue);
            initColorWheel();
            applyMixedColors();
            return;
        }
        
        // Handle variability knob dragging
        if (gDraggingVariabilityKnob) {
            const deltaX = (evt.clientX - dragStartMouseX) / window.innerWidth;
            const deltaY = (evt.clientY - dragStartMouseY) / window.innerHeight;
            const dragDelta = deltaX + deltaY;
            
            const dragSensitivity = 0.12;
            const normalizedDelta = dragDelta / dragSensitivity;
            const rangeSize = 60; // 0 to 60 degrees
            let newValue = dragStartValue + normalizedDelta * rangeSize;
            newValue = Math.max(0, Math.min(60, newValue));
            
            gBoidHueVariability = Math.round(newValue);
            applyMixedColors();
            return;
        }
        
        // Handle lightness knob dragging
        if (gDraggingLightnessKnob) {
            const deltaX = (evt.clientX - dragStartMouseX) / window.innerWidth;
            const deltaY = (evt.clientY - dragStartMouseY) / window.innerHeight;
            const dragDelta = deltaX + deltaY;
            
            const dragSensitivity = 0.12;
            const normalizedDelta = dragDelta / dragSensitivity;
            const rangeSize = 100; // 0 to 100 percentage
            let newValue = dragStartValue + normalizedDelta * rangeSize;
            newValue = Math.max(0, Math.min(100, newValue));
            
            gBoidLightness = Math.round(newValue);
            initColorWheel();
            applyMixedColors();
            return;
        }
        
        // Handle primary ring dragging
        if (gDraggingPrimaryRing) {
            const colorWheelSize = 1.1 * menuScale;
            const menuWidth = 0.6 * menuScale;
            const wheelCenterY = 0.45 * colorWheelSize; // Match drawing code
            const menuUpperLeftX = colorMenuX * window.innerWidth;
            const menuUpperLeftY = (colorMenuY + 0.1) * window.innerHeight;
            const centerX = menuUpperLeftX + menuWidth / 2;
            const centerY = menuUpperLeftY + wheelCenterY;
            
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
            const wheelCenterY = 0.45 * colorWheelSize; // Match drawing code
            const menuUpperLeftX = colorMenuX * window.innerWidth;
            const menuUpperLeftY = (colorMenuY + 0.1) * window.innerHeight;
            const centerX = menuUpperLeftX + menuWidth / 2;
            const centerY = menuUpperLeftY + wheelCenterY;
            
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
            
            // Check if it's the camera FOV knob (300) - must check before >= 200
            if (draggedKnob === 300) {
                const dragSensitivity = 0.2;
                const normalizedDelta = dragDelta / dragSensitivity;
                const rangeSize = 120 - 20; // FOV range: 20 to 120
                let newValue = dragStartValue + normalizedDelta * rangeSize;
                newValue = Math.max(20, Math.min(120, newValue));
                
                gCameraFOV = Math.round(newValue);
                if (gCamera) {
                    gCamera.fov = gCameraFOV;
                    gCamera.updateProjectionMatrix();
                }
                return;
            }
            
            // Check if it's the orbit speed knob (301)
            if (draggedKnob === 301) {
                const dragSensitivity = 0.2;
                const normalizedDelta = dragDelta / dragSensitivity;
                const rangeSize = 25.0 - 0.5; // Orbit speed range: 0.5 to 25.0
                let newValue = dragStartValue + normalizedDelta * rangeSize;
                newValue = Math.max(0.5, Math.min(25.0, newValue));
                
                gCameraRotationSpeed = newValue;
                return;
            }
            
            // Check if it's the dolly speed knob (302)
            if (draggedKnob === 302) {
                const dragSensitivity = 0.2;
                const normalizedDelta = dragDelta / dragSensitivity;
                const rangeSize = 0.2 - 0.01; // Speed range: 0.01 to 0.2
                let newValue = dragStartValue + normalizedDelta * rangeSize;
                newValue = Math.max(0.01, Math.min(0.2, newValue));
                
                gDollySpeed = newValue;
                // Update velocity to match new speed (maintaining direction)
                const velocitySign = gDollyVelocity >= 0 ? 1 : -1;
                gDollyVelocity = velocitySign * Math.min(Math.abs(gDollyVelocity), gDollySpeed);
                return;
            }
            
            // Check if it's a lighting menu knob (offset by 200)
            if (draggedKnob >= 200) {
                const lightingKnob = draggedKnob - 200;
                const ranges = [
                    {min: 0, max: 4},       // 0: ambient intensity
                    {min: 0, max: 360},     // 1: ambient hue
                    {min: 0, max: 100},     // 2: ambient saturation
                    {min: 0, max: 4},       // 3: overhead intensity
                    {min: 0, max: 360},     // 4: overhead hue
                    {min: 0, max: 100},     // 5: overhead saturation
                    {min: 0, max: 3},       // 6: globe lamp intensity
                    {min: 0, max: 360},     // 7: globe lamp hue
                    {min: 0, max: 100},     // 8: globe lamp saturation
                    {min: 0, max: 2},       // 9: spotlight 1 intensity
                    {min: 0, max: 360},     // 10: spotlight 1 hue
                    {min: 0, max: 100},     // 11: spotlight 1 saturation
                    {min: 0, max: 2},       // 12: spotlight 2 intensity
                    {min: 0, max: 360},     // 13: spotlight 2 hue
                    {min: 0, max: 100},     // 14: spotlight 2 saturation
                    {min: 0, max: 1},       // 15: spotlight penumbra
                    {min: 10, max: 150},    // 16: shadow camera far
                    {min: 0, max: 2},       // 17: headlight intensity
                    {min: 0, max: 3},       // 18: ornament light intensity
                    {min: 3, max: 15},      // 19: ornament light falloff
                    {min: 0, max: 100}      // 20: ornament height percentage
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
                        if (gAmbientLight) {
                            gAmbientLight.intensity = gAmbientIntensity;
                            gAmbientLight.visible = gAmbientIntensity > 0;
                        }
                        break;
                    case 1: // Ambient hue
                        gAmbientHue = Math.round(newValue);
                        if (gAmbientLight) {
                            const color = new THREE.Color();
                            color.setHSL(gAmbientHue / 360, gAmbientSaturation / 100, 0.5);
                            gAmbientLight.color = color;
                        }
                        break;
                    case 2: // Ambient saturation
                        gAmbientSaturation = Math.round(newValue);
                        if (gAmbientLight) {
                            const color = new THREE.Color();
                            color.setHSL(gAmbientHue / 360, gAmbientSaturation / 100, 0.5);
                            gAmbientLight.color = color;
                        }
                        break;
                    case 3: // Overhead intensity
                        gOverheadIntensity = newValue;
                        if (gDirectionalLight) {
                            gDirectionalLight.intensity = gOverheadIntensity;
                            gDirectionalLight.visible = gOverheadIntensity > 0;
                        }
                        break;
                    case 4: // Overhead hue
                        gOverheadHue = Math.round(newValue);
                        if (gDirectionalLight) {
                            const color = new THREE.Color();
                            color.setHSL(gOverheadHue / 360, gOverheadSaturation / 100, 0.5);
                            gDirectionalLight.color = color;
                        }
                        break;
                    case 5: // Overhead saturation
                        gOverheadSaturation = Math.round(newValue);
                        if (gDirectionalLight) {
                            const color = new THREE.Color();
                            color.setHSL(gOverheadHue / 360, gOverheadSaturation / 100, 0.5);
                            gDirectionalLight.color = color;
                        }
                        break;
                    case 6: // Globe lamp intensity
                        gGlobeLampIntensity = newValue;
                        if (gGlobeLampLight) {
                            gGlobeLampLight.intensity = gGlobeLampIntensity;
                        }
                        // Show/hide globe lamp based on intensity
                        if (gGlobeLamp) {
                            gGlobeLamp.visible = gGlobeLampIntensity > 0;
                        }
                        if (gGlobeLampLight) {
                            gGlobeLampLight.visible = gGlobeLampIntensity > 0;
                        }
                        // Enable/disable obstacle avoidance
                        if (gGlobeLampObstacle) {
                            gGlobeLampObstacle.enabled = gGlobeLampIntensity > 0;
                        }
                        break;
                    case 7: // Globe lamp hue
                        gGlobeLampHue = Math.round(newValue);
                        if (gGlobeLampLight) {
                            const color = new THREE.Color();
                            color.setHSL(gGlobeLampHue / 360, gGlobeLampSaturation / 100, 0.5);
                            gGlobeLampLight.color = color;
                        }
                        break;
                    case 8: // Globe lamp saturation
                        gGlobeLampSaturation = Math.round(newValue);
                        if (gGlobeLampLight) {
                            const color = new THREE.Color();
                            color.setHSL(gGlobeLampHue / 360, gGlobeLampSaturation / 100, 0.5);
                            gGlobeLampLight.color = color;
                        }
                        break;
                    case 9: // Spotlight 1 intensity
                        gSpotlight1Intensity = newValue;
                        if (gLamps[1] && gLamps[1].spotlight) {
                            const isOn = gSpotlight1Intensity > 0;
                            gLamps[1].spotlight.intensity = gSpotlight1Intensity;
                            gLamps[1].spotlight.visible = isOn;
                            
                            // Update lamp appearance
                            gLamps[1].bulb.material.color.setHex(isOn ? 0xffffff : 0x333333);
                            gLamps[1].innerCone.material.emissive.setHex(isOn ? 0xffffee : 0x000000);
                            gLamps[1].innerCone.material.emissiveIntensity = isOn ? 0.8 : 0;
                            gLamps[1].innerCone.material.color.setHex(isOn ? 0xffff00 : 0x222222);
                            gLamps[1].coneTipCapInner.material.emissive.setHex(isOn ? 0xffffee : 0x000000);
                            gLamps[1].coneTipCapInner.material.emissiveIntensity = isOn ? 0.8 : 0;
                            gLamps[1].coneTipCapInner.material.color.setHex(isOn ? 0xffff00 : 0x222222);
                            gLamps[1].coneTipCapOuter.material.color.setHex(isOn ? 0xffc71e : 0x222222);
                            gLamps[1].tipLight.visible = isOn;
                            gLamps[1].statusIndicator.material.color.setHex(isOn ? 0x00ff00 : 0xff0000);
                            gLamps[1].statusIndicator.material.emissive.setHex(isOn ? 0x00ff00 : 0xff0000);
                            gLamps[1].statusIndicator.material.emissiveIntensity = 0.8;
                        }
                        break;
                    case 10: // Spotlight 1 hue
                        gSpotlight1Hue = Math.round(newValue);
                        if (gLamps[1] && gLamps[1].spotlight) {
                            const color = new THREE.Color();
                            color.setHSL(gSpotlight1Hue / 360, gSpotlight1Saturation / 100, 0.5);
                            gLamps[1].spotlight.color = color;
                        }
                        break;
                    case 11: // Spotlight 1 saturation
                        gSpotlight1Saturation = Math.round(newValue);
                        if (gLamps[1] && gLamps[1].spotlight) {
                            const color = new THREE.Color();
                            color.setHSL(gSpotlight1Hue / 360, gSpotlight1Saturation / 100, 0.5);
                            gLamps[1].spotlight.color = color;
                        }
                        break;
                    case 12: // Spotlight 2 intensity
                        gSpotlight2Intensity = newValue;
                        if (gLamps[2] && gLamps[2].spotlight) {
                            const isOn = gSpotlight2Intensity > 0;
                            gLamps[2].spotlight.intensity = gSpotlight2Intensity;
                            gLamps[2].spotlight.visible = isOn;
                            
                            // Update lamp appearance
                            gLamps[2].bulb.material.color.setHex(isOn ? 0xffffff : 0x333333);
                            gLamps[2].innerCone.material.emissive.setHex(isOn ? 0xffffee : 0x000000);
                            gLamps[2].innerCone.material.emissiveIntensity = isOn ? 0.8 : 0;
                            gLamps[2].innerCone.material.color.setHex(isOn ? 0xffff00 : 0x222222);
                            gLamps[2].coneTipCapInner.material.emissive.setHex(isOn ? 0xffffee : 0x000000);
                            gLamps[2].coneTipCapInner.material.emissiveIntensity = isOn ? 0.8 : 0;
                            gLamps[2].coneTipCapInner.material.color.setHex(isOn ? 0xffff00 : 0x222222);
                            gLamps[2].coneTipCapOuter.material.color.setHex(isOn ? 0xffc71e : 0x222222);
                            gLamps[2].tipLight.visible = isOn;
                            gLamps[2].statusIndicator.material.color.setHex(isOn ? 0x00ff00 : 0xff0000);
                            gLamps[2].statusIndicator.material.emissive.setHex(isOn ? 0x00ff00 : 0xff0000);
                            gLamps[2].statusIndicator.material.emissiveIntensity = 0.8;
                        }
                        break;
                    case 13: // Spotlight 2 hue
                        gSpotlight2Hue = Math.round(newValue);
                        if (gLamps[2] && gLamps[2].spotlight) {
                            const color = new THREE.Color();
                            color.setHSL(gSpotlight2Hue / 360, gSpotlight2Saturation / 100, 0.5);
                            gLamps[2].spotlight.color = color;
                        }
                        break;
                    case 14: // Spotlight 2 saturation
                        gSpotlight2Saturation = Math.round(newValue);
                        if (gLamps[2] && gLamps[2].spotlight) {
                            const color = new THREE.Color();
                            color.setHSL(gSpotlight2Hue / 360, gSpotlight2Saturation / 100, 0.5);
                            gLamps[2].spotlight.color = color;
                        }
                        break;
                    case 15: // Spotlight penumbra
                        gSpotlightPenumbra = newValue;
                        // Update all lamp spotlights
                        for (let lampId in gLamps) {
                            if (gLamps[lampId] && gLamps[lampId].spotlight) {
                                gLamps[lampId].spotlight.penumbra = gSpotlightPenumbra;
                            }
                        }
                        // Update headlight penumbra if it exists
                        if (gHeadlight) {
                            gHeadlight.penumbra = gSpotlightPenumbra;
                        }
                        break;
                    case 16: // Shadow camera far
                        gShadowCameraFar = Math.round(newValue);
                        // Update all lamp shadow cameras
                        for (let lampId in gLamps) {
                            if (gLamps[lampId] && gLamps[lampId].spotlight && gLamps[lampId].spotlight.shadow) {
                                gLamps[lampId].spotlight.shadow.camera.far = gShadowCameraFar;
                                gLamps[lampId].spotlight.shadow.camera.updateProjectionMatrix();
                            }
                        }
                        break;
                    case 17: // Headlight intensity
                        gHeadlightIntensity = newValue;
                        // Create or update headlight
                        if (gHeadlightIntensity > 0) {
                            if (!gHeadlight) {
                                // Create the headlight spotlight
                                gHeadlight = new THREE.SpotLight(0xffffff, gHeadlightIntensity);
                                gHeadlight.angle = Math.PI / 6; // 30 degree cone
                                gHeadlight.penumbra = gSpotlightPenumbra;
                                gHeadlight.castShadow = true;
                                gHeadlight.shadow.camera.near = 0.1;
                                gHeadlight.shadow.camera.far = 50;
                                gHeadlight.shadow.mapSize.width = 1024;
                                gHeadlight.shadow.mapSize.height = 1024;
                                gThreeScene.add(gHeadlight);
                                gHeadlight.target.position.set(0, 0, 0);
                                gThreeScene.add(gHeadlight.target);
                                
                                // Create point light in front of boid
                                gHeadlightPointLight = new THREE.PointLight(0xffffff, gHeadlightIntensity * 1.5, 15);
                                gThreeScene.add(gHeadlightPointLight);
                            } else {
                                gHeadlight.intensity = gHeadlightIntensity;
                                gHeadlight.visible = true;
                                if (gHeadlightPointLight) {
                                    gHeadlightPointLight.intensity = gHeadlightIntensity * 1.5;
                                    gHeadlightPointLight.visible = true;
                                }
                            }
                        } else {
                            // Turn off or remove headlight
                            if (gHeadlight) {
                                gThreeScene.remove(gHeadlight);
                                gThreeScene.remove(gHeadlight.target);
                                gHeadlight = null;
                            }
                            if (gHeadlightPointLight) {
                                gThreeScene.remove(gHeadlightPointLight);
                                gHeadlightPointLight = null;
                            }
                        }
                        break;
                    case 18: // Ornament light intensity
                        gOrnamentLightIntensity = newValue;
                        // Update all ornament point lights
                        for (let i = 0; i < gStarAnimData.length; i++) {
                            if (gStarAnimData[i].pointLight) {
                                gStarAnimData[i].pointLight.intensity = gOrnamentLightIntensity;
                                gStarAnimData[i].pointLight.visible = gOrnamentLightIntensity > 0;
                            }
                        }
                        break;
                    case 19: // Ornament light falloff
                        gOrnamentLightFalloff = newValue;
                        // Update all ornament point light distances
                        for (let i = 0; i < gStarAnimData.length; i++) {
                            if (gStarAnimData[i].pointLight) {
                                gStarAnimData[i].pointLight.distance = gOrnamentLightFalloff;
                            }
                        }
                        break;
                    case 20: // Ornament height percentage
                        gOrnamentHeightOffset = Math.round(newValue); // Round to integer percentage
                        // Update all ornament positions, wires, and related elements
                        // Shift the original range based on percentage
                        const worldHeight = gPhysicsScene.worldSize.y;
                        const originalCenter = worldHeight * 1.15; // Center of original range (0.8 to 1.5)
                        const maxHeight = worldHeight * 2.1;
                        const percentageCenter = (gOrnamentHeightOffset / 100) * maxHeight;
                        const heightOffset = percentageCenter - originalCenter;
                        
                        for (let i = 0; i < gStarAnimData.length; i++) {
                            const starData = gStarAnimData[i];
                            const targetHeight = starData.targetY + heightOffset;
                            
                            // Update star position
                            starData.star.position.y = targetHeight;
                            
                            // Update obstacle position
                            if (starData.obstacle) {
                                const obstacleRadius = starData.obstacle.radius;
                                const yOffset = starData.yOffsetMultiplier || 1.0;
                                starData.obstacle.updatePosition(new THREE.Vector3(
                                    starData.star.position.x,
                                    targetHeight - obstacleRadius * yOffset,
                                    starData.star.position.z
                                ));
                            }
                            
                            // Update point light position
                            if (starData.pointLight) {
                                starData.pointLight.position.y = targetHeight;
                            }
                            
                            // Update wire position and length
                            const ceilingY = 2 * gPhysicsScene.worldSize.y;
                            const starTop = targetHeight;
                            const wireLength = ceilingY - starTop;
                            starData.wire.position.set(starData.star.position.x, starTop + wireLength / 2, starData.star.position.z);
                            starData.wire.scale.set(1, wireLength, 1);
                            
                            // Calculate wire angle for swaying ornaments
                            const dx = starData.star.position.x - starData.x;
                            const dz = starData.star.position.z - starData.z;
                            if (dx !== 0 || dz !== 0) {
                                const angle = Math.atan2(dx, dz);
                                starData.wire.rotation.set(Math.atan(Math.sqrt(dx*dx + dz*dz) / wireLength), 0, -angle);
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
            
            // Simulation menu knobs (13 knobs - removed FOV)
            const ranges = [
                {min: 100, max: 5000},
                {min: 0.1, max: 1.0},
                {min: 0.5, max: 10},
                {min: 0, max: 0.2},
                {min: 0, max: 0.2},
                {min: 0, max: 0.005},
                {min: 1.0, max: 20.0},
                {min: 1.0, max: 30.0},
                {min: 0, max: 0.2},
                {min: 0.5, max: 5.0},
                {min: 10, max: 60},
                {min: 10, max: 60},
                {min: 10, max: 60}
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
                            sat = gBoidSaturation; 
                            light = gBoidLightness; 
                            
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
                            switch (boid.geometryType) {
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
                            // For primitives, if 'imported' is selected, default to 'phong' (plastic)
                            var effectiveMaterial = boidProps.material;
                            if (effectiveMaterial === 'imported') {
                                effectiveMaterial = 'phong';
                            }
                            
                            if (effectiveMaterial === 'standard') {
                                material = new THREE.MeshStandardMaterial({
                                    color: new THREE.Color(`hsl(${boid.hue}, ${boid.sat}%, ${boid.light}%)`), 
                                    metalness: 0.5,
                                    roughness: 0.4, 
                                    wireframe: boidProps.wireframe});
                            } else if (effectiveMaterial === 'phong') {
                                material = new THREE.MeshPhongMaterial({
                                    color: new THREE.Color(`hsl(${boid.hue}, ${boid.sat}%, ${boid.light}%)`), 
                                    shininess: 100, 
                                    wireframe: boidProps.wireframe});
                            } else if (effectiveMaterial === 'normal') {
                                material = new THREE.MeshNormalMaterial({wireframe: boidProps.wireframe});
                            } else if (effectiveMaterial === 'toon') {
                                material = new THREE.MeshToonMaterial({
                                    color: new THREE.Color(`hsl(${boid.hue}, ${boid.sat}%, ${boid.light}%)`), 
                                    wireframe: boidProps.wireframe});
                            } else if (effectiveMaterial === 'depth') {
                                material = new THREE.MeshDepthMaterial({
                                    wireframe: boidProps.wireframe});
                            } else {
                                material = new THREE.MeshBasicMaterial({
                                    color: new THREE.Color(`hsl(${boid.hue}, ${boid.sat}%, ${boid.light}%)`), 
                                    wireframe: boidProps.wireframe});
                            }
                            
                            if (boid.geometryType === 11) {
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
                case 10: // World Size X
                    const oldWorldSizeX = gWorldSizeX;
                    gWorldSizeX = Math.round(newValue / 10) * 10;
                    if (gWorldSizeX !== oldWorldSizeX) {
                        gPhysicsScene.worldSize.x = gWorldSizeX;
                        updateWorldGeometry('x');
                    }
                    break;
                case 11: // World Size Y
                    const oldWorldSizeY = gWorldSizeY;
                    gWorldSizeY = Math.round(newValue / 10) * 10;
                    if (gWorldSizeY !== oldWorldSizeY) {
                        gPhysicsScene.worldSize.y = gWorldSizeY;
                        updateWorldGeometry('y');
                    }
                    break;
                case 12: // World Size Z
                    const oldWorldSizeZ = gWorldSizeZ;
                    gWorldSizeZ = Math.round(newValue / 10) * 10;
                    if (gWorldSizeZ !== oldWorldSizeZ) {
                        gPhysicsScene.worldSize.z = gWorldSizeZ;
                        updateWorldGeometry('z');
                    }
                    break;
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
                // Apply offset to maintain grab point
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
        
        // Handle mammoth dragging (translation along ground, horizontal only)
        if (gDraggingMammoth && gMammoth) {
            var rect = gRenderer.domElement.getBoundingClientRect();
            var mousePos = new THREE.Vector2();
            mousePos.x = ((evt.clientX - rect.left) / rect.width ) * 2 - 1;
            mousePos.y = -((evt.clientY - rect.top) / rect.height ) * 2 + 1;
            
            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mousePos, gCamera);
            
            // Define plane at the height where the mammoth was grabbed
            var mammothPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -gMammothDragPlaneHeight);
            var intersectionPoint = new THREE.Vector3();
            raycaster.ray.intersectPlane(mammothPlane, intersectionPoint);
            
            if (intersectionPoint) {
                // Keep the mammoth's Y position constant, only move X and Z
                // Apply offset to maintain grab point
                var newX = intersectionPoint.x + (gMammothDragOffset ? gMammothDragOffset.x : 0);
                var newZ = intersectionPoint.z + (gMammothDragOffset ? gMammothDragOffset.z : 0);
                
                // Clamp to room boundaries
                var minBoundX = -gPhysicsScene.worldSize.x + 2;
                var maxBoundX = gPhysicsScene.worldSize.x - 2;
                var minBoundZ = -gPhysicsScene.worldSize.z + 2;
                var maxBoundZ = gPhysicsScene.worldSize.z - 2;
                
                newX = Math.max(minBoundX, Math.min(maxBoundX, newX));
                newZ = Math.max(minBoundZ, Math.min(maxBoundZ, newZ));
                
                gMammoth.position.x = newX;
                gMammoth.position.z = newZ;
                
                // Update obstacle position
                if (gMammothObstacle) {
                    gMammothObstacle.updatePosition(new THREE.Vector3(newX, gMammoth.position.y + 1.5, newZ));
                }
            }
            return;
        }
        
        // Handle mammoth skeleton dragging (translation along ground, horizontal only)
        if (gDraggingMammothSkeleton && gMammothSkeleton) {
            var rect = gRenderer.domElement.getBoundingClientRect();
            var mousePos = new THREE.Vector2();
            mousePos.x = ((evt.clientX - rect.left) / rect.width ) * 2 - 1;
            mousePos.y = -((evt.clientY - rect.top) / rect.height ) * 2 + 1;
            
            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mousePos, gCamera);
            
            // Define plane at the height where the skeleton was grabbed
            var skeletonPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -gMammothSkeletonDragPlaneHeight);
            var intersectionPoint = new THREE.Vector3();
            raycaster.ray.intersectPlane(skeletonPlane, intersectionPoint);
            
            if (intersectionPoint) {
                // Keep the skeleton's Y position constant, only move X and Z
                // Apply offset to maintain grab point
                var newX = intersectionPoint.x + (gMammothSkeletonDragOffset ? gMammothSkeletonDragOffset.x : 0);
                var newZ = intersectionPoint.z + (gMammothSkeletonDragOffset ? gMammothSkeletonDragOffset.z : 0);
                
                // Clamp to room boundaries
                var minBoundX = -gPhysicsScene.worldSize.x + 2;
                var maxBoundX = gPhysicsScene.worldSize.x - 2;
                var minBoundZ = -gPhysicsScene.worldSize.z + 2;
                var maxBoundZ = gPhysicsScene.worldSize.z - 2;
                
                newX = Math.max(minBoundX, Math.min(maxBoundX, newX));
                newZ = Math.max(minBoundZ, Math.min(maxBoundZ, newZ));
                
                gMammothSkeleton.position.x = newX;
                gMammothSkeleton.position.z = newZ;
                
                // Update obstacle position
                if (gMammothSkeletonObstacle) {
                    gMammothSkeletonObstacle.updatePosition(new THREE.Vector3(newX, gMammothSkeleton.position.y + 8, newZ));
                }
                
                // Update drag spotlight position
                if (gDragSpotlight) {
                    gDragSpotlight.position.set(newX, gMammothSkeleton.position.y + 15, newZ);
                    gDragSpotlight.target.position.set(newX, gMammothSkeleton.position.y, newZ);
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
                // Apply offset to maintain grab point
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
        
        // Handle chair dragging (translation along ground, horizontal only)
        if (gDraggingChair && gChair) {
            var rect = gRenderer.domElement.getBoundingClientRect();
            var mousePos = new THREE.Vector2();
            mousePos.x = ((evt.clientX - rect.left) / rect.width ) * 2 - 1;
            mousePos.y = -((evt.clientY - rect.top) / rect.height ) * 2 + 1;
            
            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mousePos, gCamera);
            
            // Define plane at the height where the chair was grabbed
            var chairPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -gChairDragPlaneHeight);
            var intersectionPoint = new THREE.Vector3();
            raycaster.ray.intersectPlane(chairPlane, intersectionPoint);
            
            if (intersectionPoint) {
                // Keep the chair's Y position constant, only move X and Z
                // Apply offset to maintain grab point
                var newX = intersectionPoint.x + (gChairDragOffset ? gChairDragOffset.x : 0);
                var newZ = intersectionPoint.z + (gChairDragOffset ? gChairDragOffset.z : 0);
                
                // Clamp to room boundaries
                var minBoundX = -gPhysicsScene.worldSize.x + 2;
                var maxBoundX = gPhysicsScene.worldSize.x - 2;
                var minBoundZ = -gPhysicsScene.worldSize.z + 2;
                var maxBoundZ = gPhysicsScene.worldSize.z - 2;
                
                newX = Math.max(minBoundX, Math.min(maxBoundX, newX));
                newZ = Math.max(minBoundZ, Math.min(maxBoundZ, newZ));
                
                gChair.position.x = newX;
                gChair.position.z = newZ;
                
                // Update obstacle position
                if (gChairObstacle) {
                    gChairObstacle.updatePosition(new THREE.Vector3(newX, gChair.position.y + gChairObstacle.height / 2, newZ));
                }
            }
            return;
        }
        
        // Handle sofa dragging (translation along ground, horizontal only)
        if (gDraggingSofa && gSofa) {
            var rect = gRenderer.domElement.getBoundingClientRect();
            var mousePos = new THREE.Vector2();
            mousePos.x = ((evt.clientX - rect.left) / rect.width ) * 2 - 1;
            mousePos.y = -((evt.clientY - rect.top) / rect.height ) * 2 + 1;
            
            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mousePos, gCamera);
            
            // Define plane at the height where the sofa was grabbed
            var sofaPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -gSofaDragPlaneHeight);
            var intersectionPoint = new THREE.Vector3();
            raycaster.ray.intersectPlane(sofaPlane, intersectionPoint);
            
            if (intersectionPoint) {
                // Keep the sofa's Y position constant, only move X and Z
                // Apply offset to maintain grab point
                var newX = intersectionPoint.x + (gSofaDragOffset ? gSofaDragOffset.x : 0);
                var newZ = intersectionPoint.z + (gSofaDragOffset ? gSofaDragOffset.z : 0);
                
                // Clamp to room boundaries
                var minBoundX = -gPhysicsScene.worldSize.x + 3;
                var maxBoundX = gPhysicsScene.worldSize.x - 3;
                var minBoundZ = -gPhysicsScene.worldSize.z + 3;
                var maxBoundZ = gPhysicsScene.worldSize.z - 3;
                
                newX = Math.max(minBoundX, Math.min(maxBoundX, newX));
                newZ = Math.max(minBoundZ, Math.min(maxBoundZ, newZ));
                
                gSofa.position.x = newX;
                gSofa.position.z = newZ;
                
                // Update obstacle position (with offset toward rear)
                if (gSofaObstacle && gSofa) {
                    var sofaRotation = gSofa.rotation.y;
                    var rearOffset = 1.2;
                    var offsetX = -rearOffset * Math.sin(sofaRotation);
                    var offsetZ = -rearOffset * Math.cos(sofaRotation);
                    gSofaObstacle.updatePosition(new THREE.Vector3(newX + offsetX, gSofa.position.y + gSofaObstacle.height / 2, newZ + offsetZ));
                }
            }
            return;
        }
        
        // Handle globe lamp dragging (3D movement in space)
        if (gDraggingGlobeLamp && gGlobeLamp) {
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
            planePoint.addVectors(gCamera.position, cameraDirection.multiplyScalar(gGlobeLampDragPlaneDistance));
            var globeLampPlane = new THREE.Plane();
            globeLampPlane.setFromNormalAndCoplanarPoint(cameraDirection, planePoint);
            
            var intersectionPoint = new THREE.Vector3();
            raycaster.ray.intersectPlane(globeLampPlane, intersectionPoint);
            
            if (intersectionPoint) {
                // Apply offset to maintain grab point
                var newPosition = new THREE.Vector3(
                    intersectionPoint.x + (gGlobeLampDragOffset ? gGlobeLampDragOffset.x : 0),
                    intersectionPoint.y + (gGlobeLampDragOffset ? gGlobeLampDragOffset.y : 0),
                    intersectionPoint.z + (gGlobeLampDragOffset ? gGlobeLampDragOffset.z : 0)
                );
                
                // Clamp to room boundaries
                var lampRadius = 3.0; // Same as obstacle radius
                var minBoundX = -gPhysicsScene.worldSize.x + lampRadius;
                var maxBoundX = gPhysicsScene.worldSize.x - lampRadius;
                var minBoundY = lampRadius;
                var maxBoundY = gPhysicsScene.worldSize.y - lampRadius;
                var minBoundZ = -gPhysicsScene.worldSize.z + lampRadius;
                var maxBoundZ = gPhysicsScene.worldSize.z - lampRadius;
                
                newPosition.x = Math.max(minBoundX, Math.min(maxBoundX, newPosition.x));
                newPosition.y = Math.max(minBoundY, Math.min(maxBoundY, newPosition.y));
                newPosition.z = Math.max(minBoundZ, Math.min(maxBoundZ, newPosition.z));
                
                gGlobeLamp.position.copy(newPosition);
                
                // Update light position
                if (gGlobeLampLight) {
                    gGlobeLampLight.position.copy(newPosition);
                }
                
                // Update obstacle position
                if (gGlobeLampObstacle) {
                    gGlobeLampObstacle.updatePosition(newPosition);
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
                // Apply offset to maintain grab point
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
        
        if (gDraggingBird && gBird) {
            var rect = gRenderer.domElement.getBoundingClientRect();
            var mousePos = new THREE.Vector2();
            mousePos.x = ((evt.clientX - rect.left) / rect.width ) * 2 - 1;
            mousePos.y = -((evt.clientY - rect.top) / rect.height ) * 2 + 1;
            
            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mousePos, gCamera);
            
            // Define plane at the height where the bird was grabbed
            var birdPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -gBirdDragPlaneHeight);
            var intersectionPoint = new THREE.Vector3();
            raycaster.ray.intersectPlane(birdPlane, intersectionPoint);
            
            if (intersectionPoint) {
                // Keep the bird's Y position constant, only move X and Z
                // Apply offset to maintain grab point
                var newX = intersectionPoint.x + (gBirdDragOffset ? gBirdDragOffset.x : 0);
                var newZ = intersectionPoint.z + (gBirdDragOffset ? gBirdDragOffset.z : 0);
                
                // Clamp to room boundaries
                var minBoundX = -gPhysicsScene.worldSize.x + 2;
                var maxBoundX = gPhysicsScene.worldSize.x - 2;
                var minBoundZ = -gPhysicsScene.worldSize.z + 2;
                var maxBoundZ = gPhysicsScene.worldSize.z - 2;
                
                newX = Math.max(minBoundX, Math.min(maxBoundX, newX));
                newZ = Math.max(minBoundZ, Math.min(maxBoundZ, newZ));
                
                gBird.position.x = newX;
                gBird.position.z = newZ;
                
                // Update obstacle position
                if (gBirdObstacle) {
                    var obstacleHeight = gBirdObstacle.height;
                    gBirdObstacle.updatePosition(new THREE.Vector3(newX, obstacleHeight / 2, newZ));
                }
            }
            return;
        }
        
        if (gDraggingKoonsDog && gKoonsDog) {
            var rect = gRenderer.domElement.getBoundingClientRect();
            var mousePos = new THREE.Vector2();
            mousePos.x = ((evt.clientX - rect.left) / rect.width ) * 2 - 1;
            mousePos.y = -((evt.clientY - rect.top) / rect.height ) * 2 + 1;
            
            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mousePos, gCamera);
            
            // Define plane at the height where the dog was grabbed
            var dogPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -gKoonsDogDragPlaneHeight);
            var intersectionPoint = new THREE.Vector3();
            raycaster.ray.intersectPlane(dogPlane, intersectionPoint);
            
            if (intersectionPoint) {
                // Keep the dog's Y position constant, only move X and Z
                // Apply offset to maintain grab point
                var newX = intersectionPoint.x + (gKoonsDogDragOffset ? gKoonsDogDragOffset.x : 0);
                var newZ = intersectionPoint.z + (gKoonsDogDragOffset ? gKoonsDogDragOffset.z : 0);
                
                // Clamp to room boundaries
                var minBoundX = -gPhysicsScene.worldSize.x + 2;
                var maxBoundX = gPhysicsScene.worldSize.x - 2;
                var minBoundZ = -gPhysicsScene.worldSize.z + 2;
                var maxBoundZ = gPhysicsScene.worldSize.z - 2;
                
                newX = Math.max(minBoundX, Math.min(maxBoundX, newX));
                newZ = Math.max(minBoundZ, Math.min(maxBoundZ, newZ));
                
                gKoonsDog.position.x = newX;
                gKoonsDog.position.z = newZ;
                
                // Update obstacle position
                if (gKoonsDogObstacle) {
                    gKoonsDogObstacle.updatePosition(new THREE.Vector3(newX, 2, newZ));
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
        
        // Handle sky pig dragging (3D movement like sphere)
        if (gDraggingSkyPig && window.draggingSkyPigObstacle) {
            var skyPigObstacle = window.draggingSkyPigObstacle;
            
            // Move sky pig in 3D space along a fixed plane perpendicular to camera view
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
            planePoint.addVectors(gCamera.position, cameraDirection.multiplyScalar(gSkyPigDragPlaneDistance));
            var skyPigPlane = new THREE.Plane();
            skyPigPlane.setFromNormalAndCoplanarPoint(cameraDirection, planePoint);
            
            var intersectionPoint = new THREE.Vector3();
            raycaster.ray.intersectPlane(skyPigPlane, intersectionPoint);
            
            if (intersectionPoint && gSkyPigDragOffset) {
                // Apply the offset to maintain grab point
                var newPosition = new THREE.Vector3(
                    intersectionPoint.x + gSkyPigDragOffset.x,
                    intersectionPoint.y + gSkyPigDragOffset.y,
                    intersectionPoint.z + gSkyPigDragOffset.z
                );
                
                // Clamp to room boundaries (allow sky pig to reach floor)
                var minBoundX = -gPhysicsScene.worldSize.x + skyPigObstacle.radius;
                var maxBoundX = gPhysicsScene.worldSize.x - skyPigObstacle.radius;
                var minBoundY = 0; // Allow sky pig model to reach the floor
                var maxBoundY = gPhysicsScene.worldSize.y - skyPigObstacle.radius;
                var minBoundZ = -gPhysicsScene.worldSize.z + skyPigObstacle.radius;
                var maxBoundZ = gPhysicsScene.worldSize.z - skyPigObstacle.radius;
                
                newPosition.x = Math.max(minBoundX, Math.min(maxBoundX, newPosition.x));
                newPosition.y = Math.max(minBoundY, Math.min(maxBoundY, newPosition.y));
                newPosition.z = Math.max(minBoundZ, Math.min(maxBoundZ, newPosition.z));
                
                skyPigObstacle.updatePosition(newPosition);
                
                // Update sky pig model position to match obstacle
                if (gSkyPig) {
                    gSkyPig.position.copy(skyPigObstacle.position);
                }
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
        
        // Handle torus dragging (translation in 3D)
        if (gDraggingTorus && window.draggingTorusObstacle) {
            var torusObstacle = window.draggingTorusObstacle;
            
            // Move torus in 3D space along a fixed plane perpendicular to camera view
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
            planePoint.addVectors(gCamera.position, cameraDirection.multiplyScalar(gTorusDragPlaneDistance));
            var torusPlane = new THREE.Plane();
            torusPlane.setFromNormalAndCoplanarPoint(cameraDirection, planePoint);
            
            var intersectionPoint = new THREE.Vector3();
            raycaster.ray.intersectPlane(torusPlane, intersectionPoint);
            
            if (intersectionPoint && gTorusDragOffset) {
                // Apply the offset to maintain grab point
                var newPosition = new THREE.Vector3(
                    intersectionPoint.x + gTorusDragOffset.x,
                    intersectionPoint.y + gTorusDragOffset.y,
                    intersectionPoint.z + gTorusDragOffset.z
                );
                
                // Clamp to room boundaries (allow torus to get one major radius closer to walls)
                var margin = torusObstacle.minorRadius;
                var minBoundX = -gPhysicsScene.worldSize.x + margin;
                var maxBoundX = gPhysicsScene.worldSize.x - margin;
                var minBoundY = margin;
                var maxBoundY = gPhysicsScene.worldSize.y - margin;
                var minBoundZ = -gPhysicsScene.worldSize.z + margin;
                var maxBoundZ = gPhysicsScene.worldSize.z - margin;
                
                newPosition.x = Math.max(minBoundX, Math.min(maxBoundX, newPosition.x));
                newPosition.y = Math.max(minBoundY, Math.min(maxBoundY, newPosition.y));
                newPosition.z = Math.max(minBoundZ, Math.min(maxBoundZ, newPosition.z));
                
                torusObstacle.updatePosition(newPosition);
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
        if ((gCameraMode === 3 || gCameraMode === 4) && gCameraManualControl) {
            const deltaX = evt.clientX - gPointerLastX;
            const deltaY = evt.clientY - gPointerLastY;
            
            gCameraRotationOffset.theta += deltaX * 0.005;
            gCameraRotationOffset.phi -= deltaY * 0.005;
            
            gCameraRotationOffset.phi = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, gCameraRotationOffset.phi));
            
            gPointerLastX = evt.clientX;
            gPointerLastY = evt.clientY;
            return;
        }
        
        // Handle mouse look for walking mode (pan/tilt) - only when unlocked
        if (gCameraMode === 5 && !gWalkingCameraLookLocked) {
            const deltaX = evt.clientX - gPointerLastX;
            const deltaY = evt.clientY - gPointerLastY;
            
            // Mouse sensitivity
            const sensitivity = 0.006;
            
            gWalkingCameraYaw -= deltaX * sensitivity;
            gWalkingCameraPitch -= deltaY * sensitivity;
            
            // Clamp pitch to prevent camera flipping
            gWalkingCameraPitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, gWalkingCameraPitch));
            
            gPointerLastX = evt.clientX;
            gPointerLastY = evt.clientY;
            return;
        }
        
        // Handle mouse look for dolly camera mode (pan/tilt) - only when unlocked
        if (gCameraMode === 6 && !gDraggingDolly && !gDollyCameraLookLocked) {
            const deltaX = evt.clientX - gPointerLastX;
            const deltaY = evt.clientY - gPointerLastY;
            
            // Mouse sensitivity - higher to allow full rotation within screen bounds
            const sensitivity = 0.01;
            
            gDollyCameraYaw -= deltaX * sensitivity;
            gDollyCameraPitch -= deltaY * sensitivity;
            
            // Clamp pitch to prevent camera flipping
            gDollyCameraPitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, gDollyCameraPitch));
            
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
        
        if (gDraggingSaturationKnob) {
            gDraggingSaturationKnob = false;
            // Re-enable orbit controls if in normal camera mode
            if (gCameraMode < 3 && gCameraControl) {
                gCameraControl.enabled = true;
            }
            return;
        }
        
        if (gDraggingVariabilityKnob) {
            gDraggingVariabilityKnob = false;
            // Re-enable orbit controls if in normal camera mode
            if (gCameraMode < 3 && gCameraControl) {
                gCameraControl.enabled = true;
            }
            return;
        }
        
        if (gDraggingLightnessKnob) {
            gDraggingLightnessKnob = false;
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
        
        // NOTE: gDraggingDuck, gDraggingMammoth, gDraggingMammothSkeleton, gDraggingTeapot, gDraggingChair, gDraggingSofa, 
        // gDraggingStool, gDraggingBird, gDraggingKoonsDog, gDraggingGlobeLamp are NOT cleared on pointerup
        // because they use toggle-dragging mode (double-click to enter, single-click to exit)
        
        if (gRotatingStool) {
            gRotatingStool = false;
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
        
        if (gDraggingSkyPig) {
            gDraggingSkyPig = false;
            gSkyPigDragOffset = null;
            window.draggingSkyPigObstacle = null;
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
        
        if (gDraggingTorus) {
            gDraggingTorus = false;
            gTorusDragOffset = null;
            window.draggingTorusObstacle = null;
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
        
        if (gDraggingDolly) {
            gDraggingDolly = false;
            gDraggingDollyEnd = null;
            gDollyDragPivotPosition = null;
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
        
        if ((gCameraMode === 3 || gCameraMode === 4) && gCameraManualControl) {
            gCameraManualControl = false;
            return;
        }
        
        // Re-enable orbit controls for any other clicks (e.g., color ring clicks)
        if (gCameraMode < 3 && gCameraControl) {
            gCameraControl.enabled = true;
        }
    }
}

// Handle pointer leaving the window - reset all dragging states
function onPointerLeave(evt) {
    // Reset mouse state
    gMouseDown = false;
    
    // Reset camera control states
    gCameraManualControl = false;
    
    // Lock dolly camera look to prevent continued panning when cursor returns
    gDollyCameraLookLocked = true;
    
    // Lock walking camera look to prevent continued panning when cursor returns
    gWalkingCameraLookLocked = true;
    
    // Reset menu dragging
    isDraggingMenu = false;
    draggingMenuType = null;
    
    // Reset dolly dragging
    gDraggingDolly = false;
    gDraggingDollyEnd = null;
    
    // Reset lamp dragging states
    gDraggingLamp = false;
    gDraggingLampAngle = false;
    gDraggingLampHeight = false;
    gDraggingLampRotation = false;
    gDraggingLampPoleOrSleeve = false;
    gDraggingLampBase = false;
    
    // Reset obstacle dragging
    gDraggingCylinder = false;
    gDraggingSphere = false;
    gDraggingSkyPig = false;
    gDraggingTorus = false;
    
    // Reset color control dragging
    gDraggingMixKnob = false;
    gDraggingSaturationKnob = false;
    gDraggingVariabilityKnob = false;
    gDraggingLightnessKnob = false;
    gDraggingPrimaryRing = false;
    gDraggingSecondaryRing = false;
    
    // Reset prop dragging
    gDraggingStool = false;
    gDraggingDuck = false;
    gDraggingMammoth = false;
    gDraggingMammothSkeleton = false;
    gDraggingTeapot = false;
    gDraggingBird = false;
    gDraggingKoonsDog = false;
    gDraggingGlobeLamp = false;
    gDraggingChair = false;
    gDraggingSofa = false;
    
    // Re-enable orbit controls if in normal camera mode
    if (gCameraMode < 3 && gCameraControl) {
        gCameraControl.enabled = true;
    }
}

// Check if click is on simulation menu
function checkSimMenuClick(clientX, clientY) {
    if (!menuVisible || menuOpacity <= 0.5) return false;
    
    const knobRadius = 0.1 * menuScale;
    const knobSpacing = knobRadius * 3;
    const menuTopMargin = 0.2 * knobRadius;
    const menuWidth = knobSpacing * 2;
    const menuHeight = knobSpacing * 4.6;  // Updated for 13 knobs
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
    
    // Check knobs (now 13 knobs - removed FOV)
    for (let knob = 0; knob < 13; knob++) {
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
                boidProps.minSpeed, boidProps.maxSpeed, boidProps.turnFactor, boidProps.margin,
                gWorldSizeX, gWorldSizeY, gWorldSizeZ
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
    const menuHeight = 16.5 * knobRadius;
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
    
    for (let i = 0; i < 18; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const totalRowWidth = (buttonWidth * 3) + (buttonSpacing * 2);
        const offsetX = (menuWidth - totalRowWidth) / 2;
        const btnX = menuOriginX + offsetX + col * (buttonWidth + buttonSpacing);
        const btnY = buttonY + row * (buttonHeight + buttonSpacing);
        
        if (clientX >= btnX && clientX <= btnX + buttonWidth &&
            clientY >= btnY && clientY <= btnY + buttonHeight) {
            // Toggle type selection
            const typeIndex = gSelectedBoidTypes.indexOf(i);
            if (typeIndex === -1) {
                // Type not selected, add it
                gSelectedBoidTypes.push(i);
            } else {
                // Type already selected, remove it (but keep at least one type selected)
                if (gSelectedBoidTypes.length > 1) {
                    gSelectedBoidTypes.splice(typeIndex, 1);
                }
            }
            
            // Sort selected types for consistent ordering
            gSelectedBoidTypes.sort((a, b) => a - b);
            
            // Recreate all boid geometries with new type distribution
            recreateBoidGeometries();
            return true;
        }
    }
    
    // Check mesh detail radio buttons
    const meshDetailY = buttonY + 6 * (buttonHeight + buttonSpacing) + knobRadius * 0.4;
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
    const materialOptions = ['basic', 'phong', 'standard', 'normal', 'toon', 'imported'];
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
    const trailSectionY = materialRadioY + knobRadius * 3.0;
    for (let knob = 0; knob < 2; knob++) {
        const row = Math.floor(knob / 3);
        const col = knob % 3;
        const knobX = menuOriginX + col * knobSpacing;
        const knobY = trailSectionY + row * knobSpacing;
        
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
    const radioY = trailSectionY - 0.4 * padding;
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
    const smallKnobRadius = 0.1 * menuScale; // Smaller knobs for saturation/lightness
    const colorWheelSize = 1.1 * menuScale; // Size of the color wheel rings
    const menuWidth = 0.6 * menuScale; // Match other menus (actual background width)
    const padding = 0.17 * menuScale;
    const extraHeight = smallKnobRadius * 5.5; // Extra height for two knobs and checkbox at bottom
    const menuHeight = 0.75 * colorWheelSize + extraHeight;
    const menuTopMargin = 0.33 * colorWheelSize; // Match drawing code
    
    const menuUpperLeftX = colorMenuX * window.innerWidth;
    const menuUpperLeftY = (colorMenuY + 0.1) * window.innerHeight;
    const menuOriginX = menuUpperLeftX;
    const menuOriginY = menuUpperLeftY;
    
    const radioY = menuOriginY - 0.03 * menuScale; // Match drawing code - buttons at very top
    const wheelCenterY = menuOriginY + 0.45 * colorWheelSize; // Match drawing code - wheels centered lower down
    
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
    const centerY = wheelCenterY; // Use wheelCenterY instead of menuOriginY + menuTopMargin
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Only allow interaction with knob and rings in Normal mode or Doppler mode
    if (gColorationMode === 0 || gColorationMode === 3) {
        // Check if clicking on mix knob in center (only in Normal mode, not Doppler)
        if (gColorationMode === 0 && distance <= knobRadius * 1.05) {
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
    
    // Check saturation, variability, and lightness knobs at the bottom
    const bottomKnobsY = menuOriginY + 0.80 * colorWheelSize + smallKnobRadius * 1.7;
    const knobSpacing = menuWidth / 20;
    
    // Saturation knob (left)
    const satKnobX = menuOriginX + knobSpacing * 1;
    const satDx = clientX - satKnobX;
    const satDy = clientY - bottomKnobsY;
    if (satDx * satDx + satDy * satDy <= smallKnobRadius * smallKnobRadius * 1.1) {
        gDraggingSaturationKnob = true;
        dragStartMouseX = clientX;
        dragStartMouseY = clientY;
        dragStartValue = gBoidSaturation;
        if (gCameraControl) {
            gCameraControl.enabled = false;
        }
        return true;
    }
    
    // Variability knob (middle)
    const varKnobX = menuOriginX + knobSpacing * 10;
    const varDx = clientX - varKnobX;
    const varDy = clientY - bottomKnobsY;
    if (varDx * varDx + varDy * varDy <= smallKnobRadius * smallKnobRadius * 1.1) {
        gDraggingVariabilityKnob = true;
        dragStartMouseX = clientX;
        dragStartMouseY = clientY;
        dragStartValue = gBoidHueVariability;
        if (gCameraControl) {
            gCameraControl.enabled = false;
        }
        return true;
    }
    
    // Lightness knob (right)
    const lightKnobX = menuOriginX + knobSpacing * 19;
    const lightDx = clientX - lightKnobX;
    const lightDy = clientY - bottomKnobsY;
    if (lightDx * lightDx + lightDy * lightDy <= smallKnobRadius * smallKnobRadius * 1.1) {
        gDraggingLightnessKnob = true;
        dragStartMouseX = clientX;
        dragStartMouseY = clientY;
        dragStartValue = gBoidLightness;
        if (gCameraControl) {
            gCameraControl.enabled = false;
        }
        return true;
    }
    
    // Check radio buttons for coloration mode
    const radioRadius = knobRadius * 0.3;
    const radioButtonCount = 4;
    const radioTotalWidth = menuWidth * 0.9; // Use 90% of menu width
    const radioStartX = menuOriginX + (menuWidth - radioTotalWidth) / 2; // Center the group
    const radioSpacing = radioTotalWidth / (radioButtonCount - 1); // Space between buttons
    
    for (let i = 0; i < 4; i++) {
        const radioX = radioStartX + i * radioSpacing;
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
    
    // Check Artwork Selection radio buttons
    const artworkRadioY = bottomKnobsY + 2.8 * smallKnobRadius;
    const artworkRadioRadius = smallKnobRadius * 0.4;
    const artworkOptions = ['miro', 'dali', 'bosch'];
    const artworkRadioSpacing = menuWidth / 3;
    
    for (let i = 0; i < 3; i++) {
        const artRadioX = menuOriginX + (i + 0.5) * artworkRadioSpacing;
        const rdx = clientX - artRadioX;
        const rdy = clientY - artworkRadioY;
        
        if (rdx * rdx + rdy * rdy < artworkRadioRadius * artworkRadioRadius) {
            const selectedArtwork = artworkOptions[i];
            gSelectedArtwork = selectedArtwork;
            
            // Trigger painting change if needed
            if (gPaintingAnimState === 'idle' && gCurrentPainting !== selectedArtwork) {
                gTargetPainting = selectedArtwork;
                gPaintingAnimState = 'exiting';
                gPaintingAnimTimer = 0;
            }
            
            if (gCameraControl) {
                gCameraControl.enabled = false;
            }
            return true;
        }
    }
    
    // Check if menu background clicked (for dragging or to block clicks underneath)
    // But exclude the color wheel area to prevent dragging when clicking on exposed background
    const outerWheelRadius = (colorWheelSize / 2) * 0.75; // Slightly larger than outer ring for buffer
    const isInWheelArea = distance <= outerWheelRadius;
    
    if (clientX >= menuOriginX - padding && clientX <= menuOriginX + menuWidth + padding &&
        clientY >= menuOriginY - padding && clientY <= menuOriginY + menuHeight + padding) {
        
        // Disable camera controls for any click within menu bounds
        if (gCameraControl) {
            gCameraControl.enabled = false;
        }
        
        // Only allow dragging if not clicking in the wheel area
        if (!isInWheelArea) {
            isDraggingMenu = true;
            draggingMenuType = 'color';
            menuDragStartX = clientX;
            menuDragStartY = clientY;
            menuStartX = colorMenuX;
            menuStartY = colorMenuY;
        }
        // Return true to block all clicks within menu bounds (including wheel area)
        // This prevents world interactions behind the menu
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
    const menuHeight = knobSpacing * 7; // 7 rows (now with 21 knobs)
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
    for (let i = 0; i < 21; i++) {
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
            
            const values = [
                gAmbientIntensity, gAmbientHue, gAmbientSaturation,
                gOverheadIntensity, gOverheadHue, gOverheadSaturation,
                gGlobeLampIntensity, gGlobeLampHue, gGlobeLampSaturation,
                gSpotlight1Intensity, gSpotlight1Hue, gSpotlight1Saturation,
                gSpotlight2Intensity, gSpotlight2Hue, gSpotlight2Saturation,
                gSpotlightPenumbra,
                gShadowCameraFar,
                gHeadlightIntensity,
                gOrnamentLightIntensity,
                gOrnamentLightFalloff,
                gOrnamentHeightOffset
            ];
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

function checkCameraMenuClick(clientX, clientY) {
    if (!cameraMenuVisible || cameraMenuOpacity <= 0.1) return false;
    
    const knobRadius = 0.1 * menuScale;
    const knobSpacing = knobRadius * 3;
    const menuWidth = knobSpacing * 2 * 0.75;  // 25% narrower than original
    const padding = 0.17 * menuScale;
    const radioButtonSize = 0.04 * menuScale;
    const radioButtonSpacing = 0.104 * menuScale;  // Increased 30% from 0.08
    const radioSectionHeight = 7 * radioButtonSpacing + 0.05 * menuScale;
    const checkboxSectionHeight = 0.15 * menuScale; // Extra space for stereo checkbox
    const menuHeight = radioSectionHeight + knobRadius * 3 + checkboxSectionHeight;
    
    const menuUpperLeftX = cameraMenuX * window.innerWidth;
    const menuUpperLeftY = cameraMenuY * window.innerHeight;
    const menuOriginX = menuUpperLeftX;
    const menuOriginY = menuUpperLeftY;
    
    // Debug: log if we're anywhere near the menu
    const inMenuX = (clientX >= menuOriginX - padding && clientX <= menuOriginX + menuWidth + padding);
    const inMenuY = (clientY >= menuOriginY - padding && clientY <= menuOriginY + menuHeight + padding);
    if (inMenuX && inMenuY) {
        console.log('Click in camera menu area at', clientX, clientY);
        console.log('Menu bounds:', menuOriginX - padding, 'to', menuOriginX + menuWidth + padding, ',', menuOriginY - padding, 'to', menuOriginY + menuHeight + padding);
    }
    
    // Check close button
    const closeIconRadius = 0.1 * menuScale * 0.25;
    const closeIconX = menuOriginX - padding + closeIconRadius + 0.02 * menuScale;
    const closeIconY = menuOriginY - padding + closeIconRadius + 0.02 * menuScale;
    const cdx = clientX - closeIconX;
    const cdy = clientY - closeIconY;
    
    if (cdx * cdx + cdy * cdy < closeIconRadius * closeIconRadius) {
        cameraMenuVisible = false;
        return true;
    }
    
    // Check radio buttons for camera modes
    const radioStartY = menuOriginY + 0.03 * menuScale;
    const radioX = menuOriginX + -0.02 * menuScale;
    
    for (let i = 0; i < 7; i++) {
        const radioY = radioStartY + i * radioButtonSpacing;
        const rdx = clientX - radioX;
        const rdy = clientY - radioY;
        
        if (rdx * rdx + rdy * rdy < (radioButtonSize + 5) * (radioButtonSize + 5)) {
            // Change camera mode
            const previousMode = gCameraMode;
            gCameraMode = i;
            
            // Save camera position when leaving any third-person mode (0, 1, or 2)
            if (previousMode >= 0 && previousMode <= 2) {
                gSavedCameraPosition = gCamera.position.clone();
                gSavedCameraTarget = gCameraControl.target.clone();
            }
            
            // Restore camera position when returning to any third-person mode from first-person
            if (gCameraMode >= 0 && gCameraMode <= 2 && previousMode >= 3 && gSavedCameraPosition && gSavedCameraTarget) {
                gCamera.position.copy(gSavedCameraPosition);
                gCameraControl.target.copy(gSavedCameraTarget);
                gCameraControl.update();
            }
            
            // Initialize walking camera position when entering mode 5
            if (gCameraMode === 5) {
                gWalkingCameraPosition.set(0, 6.8, 0);
                gWalkingCameraYaw = -Math.PI / 2; // Point in -x direction
                gWalkingCameraPitch = 0;
            }
            
            // Initialize dolly camera when entering mode 6
            if (gCameraMode === 6) {
                // Set camera to current dolly cart position
                const localX = (gDollyPosition - 0.5) * gDollyRailsLength;
                const worldX = gDollyRailsPosition.x + Math.cos(gDollyRailsRotation) * localX;
                const worldZ = gDollyRailsPosition.z - Math.sin(gDollyRailsRotation) * localX;
                gCamera.position.set(worldX, gDollyCameraHeight, worldZ);
                
                // Camera angles (yaw/pitch) are preserved from previous dolly mode session
                // Create rails and cart if they don't exist yet
                if (!gDollyRailsMesh) {
                    createDollyRails();
                }
                if (!gDollyCartMesh) {
                    createDollyCart();
                }
                if (!gDollyCameraMesh) {
                    loadDollyCameraModel();
                }
            }
            
            // Enable/disable OrbitControls based on camera mode
            if (gCameraMode >= 0 && gCameraMode <= 2) {
                gCameraControl.enabled = true;
            } else {
                gCameraControl.enabled = false;
            }
            
            return true;
        }
    }
    
    // Check FOV knob
    const fovDx = clientX - fovKnobInfo.x;
    const fovDy = clientY - fovKnobInfo.y;
    
    if (fovDx * fovDx + fovDy * fovDy < fovKnobInfo.radius * fovKnobInfo.radius * 1.1) {
        draggedKnob = 300; // Special index for FOV knob in camera menu
        dragStartMouseX = clientX;
        dragStartMouseY = clientY;
        dragStartValue = gCameraFOV;
        
        if (gCameraControl) {
            gCameraControl.enabled = false;
        }
        return true;
    }
    
    // Check Orbit Speed knob
    const orbitDx = clientX - orbitSpeedKnobInfo.x;
    const orbitDy = clientY - orbitSpeedKnobInfo.y;
    
    if (orbitDx * orbitDx + orbitDy * orbitDy < orbitSpeedKnobInfo.radius * orbitSpeedKnobInfo.radius * 1.1) {
        draggedKnob = 301; // Special index for Orbit Speed knob in camera menu
        dragStartMouseX = clientX;
        dragStartMouseY = clientY;
        dragStartValue = gCameraRotationSpeed;
        
        if (gCameraControl) {
            gCameraControl.enabled = false;
        }
        return true;
    }
    
    // Check Dolly Speed knob
    const speedDx = clientX - dollySpeedKnobInfo.x;
    const speedDy = clientY - dollySpeedKnobInfo.y;
    
    if (speedDx * speedDx + speedDy * speedDy < dollySpeedKnobInfo.radius * dollySpeedKnobInfo.radius * 1.1) {
        draggedKnob = 302; // Special index for Dolly Speed knob in camera menu
        dragStartMouseX = clientX;
        dragStartMouseY = clientY;
        dragStartValue = gDollySpeed;
        
        if (gCameraControl) {
            gCameraControl.enabled = false;
        }
        return true;
    }
    
    // Check Stereo checkbox - use same pattern as radio buttons
    const knobY = radioSectionHeight + knobRadius * 1.5;
    const checkboxY = menuOriginY + knobY + 2.5 * knobRadius;
    const checkboxX = menuOriginX + menuWidth / 2;
    const checkboxSize = 0.04 * menuScale;
    
    // Check if click is near checkbox (using same circular hit detection as radio buttons)
    const cbdx = clientX - checkboxX;
    const cbdy = clientY - checkboxY;
    const distSq = cbdx * cbdx + cbdy * cbdy;
    const radiusSq = (checkboxSize * 10) * (checkboxSize * 10);
    
    console.log('Checkbox at', checkboxX, checkboxY, 'click at', clientX, clientY, 'distSq', distSq, 'radiusSq', radiusSq);
    
    if (distSq < radiusSq) {
        // Toggle stereo mode
        if (gAnaglyphEffect) {
            gStereoEnabled = !gStereoEnabled;
            console.log('Stereo mode ' + (gStereoEnabled ? 'enabled' : 'disabled'));
        } else {
            console.warn('Stereo mode not available - AnaglyphEffect not loaded');
        }
        return true;
    }
    
    // Check if menu background clicked (for dragging)
    if (clientX >= menuOriginX - padding && clientX <= menuOriginX + menuWidth + padding &&
        clientY >= menuOriginY - padding && clientY <= menuOriginY + menuHeight + padding) {
        isDraggingMenu = true;
        draggingMenuType = 'camera';
        menuDragStartX = clientX;
        menuDragStartY = clientY;
        menuStartX = cameraMenuX;
        menuStartY = cameraMenuY;
        
        if (gCameraControl) {
            gCameraControl.enabled = false;
        }
        return true;
    }
    
    return false;
}

// Dim all lights to 1/4 intensity for drag mode
function dimLightsForDrag() {
    // Store original intensities
    gOriginalLightIntensities = {};
    
    if (gAmbientLight) {
        gOriginalLightIntensities.ambient = gAmbientLight.intensity;
        gAmbientLight.intensity *= 0.25;
    }
    
    if (gDirectionalLight) {
        gOriginalLightIntensities.directional = gDirectionalLight.intensity;
        gDirectionalLight.intensity *= 0.25;
    }
    
    if (gSpawnPointLight) {
        gOriginalLightIntensities.spawnPoint = gSpawnPointLight.intensity;
        gSpawnPointLight.intensity *= 0.25;
    }
    
    if (gGlobeLampLight) {
        gOriginalLightIntensities.globeLamp = gGlobeLampLight.intensity;
        gGlobeLampLight.intensity *= 0.25;
    }
    
    if (gHeadlight) {
        gOriginalLightIntensities.headlight = gHeadlight.intensity;
        gHeadlight.intensity *= 0.25;
    }
    
    if (gHeadlightPointLight) {
        gOriginalLightIntensities.headlightPoint = gHeadlightPointLight.intensity;
        gHeadlightPointLight.intensity *= 0.25;
    }
    
    // Dim lamp spotlights
    for (var i = 0; i < gLamps.length; i++) {
        if (gLamps[i] && gLamps[i].spotlight) {
            if (!gOriginalLightIntensities.lamps) gOriginalLightIntensities.lamps = [];
            gOriginalLightIntensities.lamps[i] = gLamps[i].spotlight.intensity;
            gLamps[i].spotlight.intensity *= 0.25;
        }
    }
    
    // Dim ornament lights
    if (gStarAnimData && gStarAnimData.length > 0) {
        gOriginalLightIntensities.ornaments = [];
        for (var i = 0; i < gStarAnimData.length; i++) {
            if (gStarAnimData[i].pointLight) {
                gOriginalLightIntensities.ornaments[i] = gStarAnimData[i].pointLight.intensity;
                gStarAnimData[i].pointLight.intensity *= 0.25;
            }
        }
    }
}

// Restore all lights to original intensity
function restoreLightsFromDrag() {
    if (gAmbientLight && gOriginalLightIntensities.ambient !== undefined) {
        gAmbientLight.intensity = gOriginalLightIntensities.ambient;
    }
    
    if (gDirectionalLight && gOriginalLightIntensities.directional !== undefined) {
        gDirectionalLight.intensity = gOriginalLightIntensities.directional;
    }
    
    if (gSpawnPointLight && gOriginalLightIntensities.spawnPoint !== undefined) {
        gSpawnPointLight.intensity = gOriginalLightIntensities.spawnPoint;
    }
    
    if (gGlobeLampLight && gOriginalLightIntensities.globeLamp !== undefined) {
        gGlobeLampLight.intensity = gOriginalLightIntensities.globeLamp;
    }
    
    if (gHeadlight && gOriginalLightIntensities.headlight !== undefined) {
        gHeadlight.intensity = gOriginalLightIntensities.headlight;
    }
    
    if (gHeadlightPointLight && gOriginalLightIntensities.headlightPoint !== undefined) {
        gHeadlightPointLight.intensity = gOriginalLightIntensities.headlightPoint;
    }
    
    // Restore lamp spotlights
    if (gOriginalLightIntensities.lamps) {
        for (var i = 0; i < gLamps.length; i++) {
            if (gLamps[i] && gLamps[i].spotlight && gOriginalLightIntensities.lamps[i] !== undefined) {
                gLamps[i].spotlight.intensity = gOriginalLightIntensities.lamps[i];
            }
        }
    }
    
    // Restore ornament lights
    if (gOriginalLightIntensities.ornaments) {
        for (var i = 0; i < gStarAnimData.length; i++) {
            if (gStarAnimData[i].pointLight && gOriginalLightIntensities.ornaments[i] !== undefined) {
                gStarAnimData[i].pointLight.intensity = gOriginalLightIntensities.ornaments[i];
            }
        }
    }
    
    gOriginalLightIntensities = {};
}

// Create spotlight above dragged object
function createDragSpotlight(position) {
    // Remove existing spotlight if any
    if (gDragSpotlight) {
        gThreeScene.remove(gDragSpotlight);
        gThreeScene.remove(gDragSpotlight.target);
        gDragSpotlight = null;
    }
    
    // Create new spotlight
    gDragSpotlight = new THREE.SpotLight(0xffffff, 3.0); // White light, high intensity
    gDragSpotlight.position.set(position.x, position.y + 15, position.z); // 15 units above object
    gDragSpotlight.angle = Math.PI / 6; // 30 degree cone
    gDragSpotlight.penumbra = 0.3; // Soft edge
    gDragSpotlight.distance = 30; // Max distance
    gDragSpotlight.decay = 2; // Physically accurate falloff
    
    // Set target to object position
    gDragSpotlight.target.position.set(position.x, position.y, position.z);
    
    gThreeScene.add(gDragSpotlight);
    gThreeScene.add(gDragSpotlight.target);
}

// Update spotlight position to follow dragged object
function updateDragSpotlight(position) {
    if (gDragSpotlight) {
        gDragSpotlight.position.set(position.x, position.y + 15, position.z);
        gDragSpotlight.target.position.set(position.x, position.y, position.z);
    }
}

// Remove drag spotlight
function removeDragSpotlight() {
    if (gDragSpotlight) {
        gThreeScene.remove(gDragSpotlight);
        gThreeScene.remove(gDragSpotlight.target);
        gDragSpotlight = null;
    }
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
                
                // Apply hue variability if enabled
                if (gBoidHueVariability > 0) {
                    // Use boid index as seed for consistent per-boid variation
                    const seed = i * 123.456;
                    const randomOffset = (Math.sin(seed) * 2 - 1) * gBoidHueVariability; // -variability to +variability
                    boid.hue = (boid.hue + randomOffset + 360) % 360; // Wrap around 0-360
                }
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
            } else if (gColorationMode === 3) {
                // By Doppler: Color based on velocity relative to camera
                // Calculate vector from camera to boid
                const toBoidX = boid.pos.x - gCamera.position.x;
                const toBoidY = boid.pos.y - gCamera.position.y;
                const toBoidZ = boid.pos.z - gCamera.position.z;
                const toBoidDist = Math.sqrt(toBoidX * toBoidX + toBoidY * toBoidY + toBoidZ * toBoidZ);
                
                if (toBoidDist > 0.001) {
                    // Normalize the direction vector
                    const dirX = toBoidX / toBoidDist;
                    const dirY = toBoidY / toBoidDist;
                    const dirZ = toBoidZ / toBoidDist;
                    
                    // Calculate relative velocity (boid velocity - camera velocity)
                    const relVelX = boid.vel.x - gCameraVelocity.x;
                    const relVelY = boid.vel.y - gCameraVelocity.y;
                    const relVelZ = boid.vel.z - gCameraVelocity.z;
                    
                    // Calculate radial velocity (dot product of relative velocity with direction to boid)
                    // Positive = moving away, negative = moving toward camera
                    const radialVel = relVelX * dirX + relVelY * dirY + relVelZ * dirZ;
                    
                    // Map radial velocity to color
                    // Moving away (positive): red (0°)
                    // Perpendicular (zero): gray (desaturated)
                    // Moving toward (negative): blue/violet (240-270°)
                    const maxRadialSpeed = 3; // Reference speed for full color
                    const normalizedVel = Math.max(-1, Math.min(1, radialVel / maxRadialSpeed));
                    const absVel = Math.abs(normalizedVel);
                    
                    // Saturation increases gradually with velocity magnitude (0% to 100%)
                    boid.sat = Math.round(absVel * 100);
                    
                    if (normalizedVel < 0) {
                        // Moving toward camera: blue-shift → use primary hue from color wheel
                        boid.hue = gPrimaryHue;
                        boid.light = Math.round(65 - 20 * absVel); // 65% to 45% lightness
                    } else {
                        // Moving away from camera: red-shift → use secondary hue from color wheel
                        boid.hue = gSecondaryHue;
                        boid.light = Math.round(65 - 20 * normalizedVel); // 65% to 45% lightness
                    }
                    
                    // Apply hue variability if enabled
                    if (gBoidHueVariability > 0) {
                        // Use boid index as seed for consistent per-boid variation
                        const seed = i * 123.456;
                        const randomOffset = (Math.sin(seed) * 2 - 1) * gBoidHueVariability; // -variability to +variability
                        boid.hue = (boid.hue + randomOffset + 360) % 360; // Wrap around 0-360
                    }
                } else {
                    // Boid at camera position: gray
                    boid.hue = 0;
                    boid.sat = 0;
                    boid.light = 50;
                }
            }
            
            // Update saturation and lightness from global values (except in Doppler mode)
            if (gColorationMode !== 3) {
                boid.sat = Math.round(gBoidSaturation);
                boid.light = Math.round(gBoidLightness);
            }
            
            // Update boid color
            if (boid.visMesh) {
                if (boid.geometryType >= 12 && boid.geometryType <= 17) {
                    // For imported models (Duck, Fish, Avocado, Helicopter, Paper Plane, Koons Dog)
                    // Only update colors if not using 'imported' material (which preserves original colors)
                    if (boidProps.material !== 'imported') {
                        boid.visMesh.traverse(function(child) {
                            if (child.isMesh && child.material) {
                                if (Array.isArray(child.material)) {
                                    child.material.forEach(mat => {
                                        // Only update color if material supports it (not Normal or Depth materials)
                                        if (mat.color) {
                                            mat.color = new THREE.Color(`hsl(${Math.round(boid.hue)}, ${boid.sat}%, ${boid.light}%)`);
                                        }
                                    });
                                } else {
                                    // Only update color if material supports it (not Normal or Depth materials)
                                    if (child.material.color) {
                                        child.material.color = new THREE.Color(`hsl(${Math.round(boid.hue)}, ${boid.sat}%, ${boid.light}%)`);
                                    }
                                }
                            }
                        });
                    }
                } else if (boid.visMesh.material) {
                    // For standard geometries with a single material
                    boid.visMesh.material.color = new THREE.Color(`hsl(${Math.round(boid.hue)}, ${boid.sat}%, ${boid.light}%)`);
                }
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
    if (gAnaglyphEffect) {
        gAnaglyphEffect.setSize( window.innerWidth, window.innerHeight );
    }
    if (gOverlayCanvas) {
        gOverlayCanvas.width = window.innerWidth;
        gOverlayCanvas.height = window.innerHeight;
    }
}

function run() {
    // Only allow toggling if boids have started
    if (gBoidsStarted) {
        gPhysicsScene.paused = !gPhysicsScene.paused;
        gRunning = !gPhysicsScene.paused;
    }
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
                    sat = gBoidSaturation;
                } else {
                    hue = Math.round(340 + Math.random() * 40);
                    sat = gBoidSaturation;
                }
                gPhysicsScene.objects.push(new BOID(pos, radius, vel, hue, sat, gBoidLightness));
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
    
    // Boid start delay - unpause after 10 seconds
    if (!gBoidsStarted) {
        gBoidStartTimer += deltaT;
        if (gBoidStartTimer >= gBoidStartDelay) {
            gBoidsStarted = true;
            gRunning = true;
            gPhysicsScene.paused = false;
        }
    }
    
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
    
    // Update headlight position to track boid 0 (lead boid)
    if (gHeadlight && gHeadlightIntensity > 0 && gPhysicsScene.objects.length > 0) {
        const leadBoid = gPhysicsScene.objects[0];
        if (leadBoid && leadBoid.pos && leadBoid.vel) {
            // Calculate direction the boid is facing
            const direction = new THREE.Vector3(leadBoid.vel.x, leadBoid.vel.y, leadBoid.vel.z).normalize();
            
            // Position headlight at the front of the boid
            const headlightOffset = 1.5; // Distance in front of boid
            gHeadlight.position.set(
                leadBoid.pos.x + direction.x * headlightOffset,
                leadBoid.pos.y + direction.y * headlightOffset,
                leadBoid.pos.z + direction.z * headlightOffset
            );
            
            // Point headlight in the direction the boid is moving
            const targetDistance = 10; // How far ahead to aim
            gHeadlight.target.position.set(
                leadBoid.pos.x + direction.x * targetDistance,
                leadBoid.pos.y + direction.y * targetDistance,
                leadBoid.pos.z + direction.z * targetDistance
            );
            
            // Update point light position in front of boid
            if (gHeadlightPointLight) {
                const pointLightOffset = 2.0; // Distance in front of boid
                gHeadlightPointLight.position.set(
                    leadBoid.pos.x + direction.x * pointLightOffset,
                    leadBoid.pos.y + direction.y * pointLightOffset,
                    leadBoid.pos.z + direction.z * pointLightOffset
                );
            }
        }
    }
    
    // Animate sphere obstacle hue
    if (gObstacles.length > 0) {
        gSphereHue = (gSphereHue + 1 * deltaT) % 360; // Slowly cycle through hues
        var sphereObstacle = gObstacles.find(function(obs) { return obs instanceof SphereObstacle; });
        if (sphereObstacle && sphereObstacle.mesh && sphereObstacle.mesh.material) {
            sphereObstacle.mesh.material.color.setHSL(gSphereHue / 360, 0.9, 0.5);
        }
        
        // Animate torus obstacle hue (opposite direction, same rate)
        gTorusHue = (gTorusHue - 1 * deltaT + 360) % 360; // Cycle in reverse at same rate
        var torusObstacle = gObstacles.find(function(obs) { return obs instanceof TorusObstacle; });
        if (torusObstacle && torusObstacle.mesh && torusObstacle.mesh.material) {
            torusObstacle.mesh.material.color.setHSL(gTorusHue / 360, 0.9, 0.5);
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
    
    // Mammoth swap animation (mini mammoth → full skeleton)
    if (gMammothSwapDisc && gMammothSwapState !== 'idle' && gMammothSwapState !== 'complete') {
        gMammothSwapTimer += deltaT;
        
        if (gMammothSwapState === 'expanding-mini') {
            // Expand hole continuously - this state lasts 1 second
            var totalExpansionDuration = 4.0; // Total time for full expansion (includes pause)
            var t = Math.min(gMammothSwapTimer / totalExpansionDuration, 1.0);
            var eased = t * t; // Quadratic ease-in across entire expansion
            var maxRadius = 12.0; // Final radius (doubled)
            var currentRadius = 0.01 + eased * maxRadius;
            
            // Update disc geometry
            gMammothSwapDisc.geometry.dispose();
            gMammothSwapDisc.geometry = new THREE.CircleGeometry(currentRadius, 32);
            
            // Update outline ring
            if (gMammothSwapDiscOutline) {
                var ringWidth = 0.15;
                gMammothSwapDiscOutline.geometry.dispose();
                gMammothSwapDiscOutline.geometry = new THREE.RingGeometry(currentRadius - ringWidth/2, currentRadius + ringWidth/2, 32);
            }
            
            if (gMammothSwapTimer >= 1.0) {
                gMammothSwapState = 'dropping-mini';
                // Don't reset timer - continue for smooth expansion
            }
        } else if (gMammothSwapState === 'dropping-mini') {
            // Mini mammoth drops through hole over 1.5 seconds
            // Hole continues expanding smoothly (continuous from expanding-mini)
            var totalExpansionDuration = 4.0; // Total time for full expansion (includes pause)
            var t = Math.min(gMammothSwapTimer / totalExpansionDuration, 1.0);
            var eased = t * t; // Same easing curve continues
            var maxRadius = 12.0; // Final radius (doubled)
            var currentRadius = 0.01 + eased * maxRadius;
            
            // Update disc geometry
            gMammothSwapDisc.geometry.dispose();
            gMammothSwapDisc.geometry = new THREE.CircleGeometry(currentRadius, 32);
            
            // Update outline ring
            if (gMammothSwapDiscOutline) {
                var ringWidth = 0.15;
                gMammothSwapDiscOutline.geometry.dispose();
                gMammothSwapDiscOutline.geometry = new THREE.RingGeometry(currentRadius - ringWidth/2, currentRadius + ringWidth/2, 32);
            }
            
            // Mini mammoth drops based on time since state started (1.0 seconds into total animation)
            var dropDuration = 1.5;
            var dropT = Math.min((gMammothSwapTimer - 1.0) / dropDuration, 1.0);
            var dropEased = dropT * dropT; // Quadratic ease-in (accelerating fall)
            gMammoth.position.y = gMiniMammothStartY + dropEased * (gMiniMammothTargetY - gMiniMammothStartY);
            
            // Update obstacle position
            if (gMammothObstacle) {
                gMammothObstacle.updatePosition(new THREE.Vector3(
                    gMammoth.position.x,
                    gMammoth.position.y + 1.5,
                    gMammoth.position.z
                ));
            }
            
            if (dropT >= 1.0) {
                // Hide mini mammoth only when animation is complete
                gMammoth.visible = false;
                gMammothSwapState = 'pausing';
                // Don't reset timer - keep it continuous for hole expansion
                // Remove mini mammoth from scene
                gThreeScene.remove(gMammoth);
                // Remove mini mammoth obstacle
                if (gMammothObstacle) {
                    var index = gObstacles.indexOf(gMammothObstacle);
                    if (index > -1) {
                        gObstacles.splice(index, 1);
                    }
                }
                // Add full skeleton to scene (obstacle already in gObstacles array)
                gThreeScene.add(gMammothSkeleton);
            }
        } else if (gMammothSwapState === 'pausing') {
            // Pause for 1.5 seconds before skeleton rises
            // Hole continues expanding to reach max size when skeleton starts rising
            var totalExpansionDuration = 4.0; // Total time for full expansion
            var t = Math.min(gMammothSwapTimer / totalExpansionDuration, 1.0);
            var eased = t * t; // Same easing curve continues
            var maxRadius = 12.0; // Final radius (doubled)
            var currentRadius = 0.01 + eased * maxRadius;
            
            // Update disc geometry
            gMammothSwapDisc.geometry.dispose();
            gMammothSwapDisc.geometry = new THREE.CircleGeometry(currentRadius, 32);
            
            // Update outline ring
            if (gMammothSwapDiscOutline) {
                var ringWidth = 0.15;
                gMammothSwapDiscOutline.geometry.dispose();
                gMammothSwapDiscOutline.geometry = new THREE.RingGeometry(currentRadius - ringWidth/2, currentRadius + ringWidth/2, 32);
            }
            
            var pauseDuration = 1.5;
            if (gMammothSwapTimer >= 2.5 + pauseDuration) { // 2.5 seconds of drop + 1.5 pause
                gMammothSwapState = 'rising-full';
                gMammothSwapTimer = 0;
            }
        } else if (gMammothSwapState === 'rising-full') {
            // Full skeleton rises over 4 seconds (slowed down from 2 seconds)
            var duration = 4.0;
            var t = Math.min(gMammothSwapTimer / duration, 1.0);
            var eased = 1 - Math.pow(1 - t, 3); // Cubic ease-out
            gMammothSkeleton.position.y = gFullMammothStartY + eased * (gFullMammothTargetY - gFullMammothStartY);
            
            // Update obstacle position
            if (gMammothSkeletonObstacle) {
                gMammothSkeletonObstacle.updatePosition(new THREE.Vector3(
                    gMammothSkeleton.position.x,
                    gMammothSkeleton.position.y + 8,
                    gMammothSkeleton.position.z
                ));
            }
            
            if (t >= 1.0) {
                gMammothSwapState = 'shrinking';
                gMammothSwapTimer = 0;
            }
        } else if (gMammothSwapState === 'shrinking') {
            // Shrink hole over 0.5 seconds
            var duration = 0.5;
            var t = Math.min(gMammothSwapTimer / duration, 1.0);
            var eased = t * t; // Quadratic ease-in
            var maxRadius = 12.0; // Doubled radius
            var currentRadius = maxRadius * (1 - eased);
            
            // Update disc geometry
            gMammothSwapDisc.geometry.dispose();
            gMammothSwapDisc.geometry = new THREE.CircleGeometry(Math.max(0.01, currentRadius), 32);
            
            // Update outline ring
            if (gMammothSwapDiscOutline) {
                var ringWidth = 0.15;
                var safeRadius = Math.max(0.01, currentRadius);
                gMammothSwapDiscOutline.geometry.dispose();
                gMammothSwapDiscOutline.geometry = new THREE.RingGeometry(Math.max(0.001, safeRadius - ringWidth/2), safeRadius + ringWidth/2, 32);
            }
            
            if (t >= 1.0) {
                gMammothSwapState = 'complete';
                // Remove disc and outline
                gThreeScene.remove(gMammothSwapDisc);
                gMammothSwapDisc.geometry.dispose();
                gMammothSwapDisc.material.dispose();
                gMammothSwapDisc = null;
                
                if (gMammothSwapDiscOutline) {
                    gThreeScene.remove(gMammothSwapDiscOutline);
                    gMammothSwapDiscOutline.geometry.dispose();
                    gMammothSwapDiscOutline.material.dispose();
                    gMammothSwapDiscOutline = null;
                }
                
                // Remove spotlight and restore lights
                if (gMammothSwapSpotlight) {
                    gThreeScene.remove(gMammothSwapSpotlight);
                    gThreeScene.remove(gMammothSwapSpotlight.target);
                    gMammothSwapSpotlight = null;
                }
                restoreLightsFromDrag();
            }
        }
    }
    
    // Painting swap animation (Miro <-> Dali <-> Duchamp <-> Bosch groups with frames)
    if (gMiroPaintingGroup && gDaliPaintingGroup && gDuchampPaintingGroup && gBoschPaintingGroup && gPaintingAnimState !== 'idle') {
        gPaintingAnimTimer += deltaT;
        
        if (gPaintingAnimState === 'exiting') {
            // Current painting accelerates upward over 0.8 seconds
            var duration = 0.8;
            var t = Math.min(gPaintingAnimTimer / duration, 1.0);
            // Quadratic ease-in: starts slow, accelerates (y = x^2)
            var eased = t * t;
            
            // Move the current painting up
            var currentGroup = gCurrentPainting === 'miro' ? gMiroPaintingGroup : 
                             (gCurrentPainting === 'dali' ? gDaliPaintingGroup : 
                             (gCurrentPainting === 'bosch' ? gBoschPaintingGroup : gDuchampPaintingGroup));
            var currentBaseY = gCurrentPainting === 'duchamp' ? gDuchampPaintingBaseY : gPaintingBaseY;
            currentGroup.position.y = currentBaseY + eased * (gPaintingExitY - currentBaseY);
            
            if (t >= 1.0) {
                gPaintingAnimState = 'entering';
                gPaintingAnimTimer = 0;
                gCurrentPainting = gTargetPainting; // Update current painting
                // Hide the exited painting
                currentGroup.visible = false;
            }
        } else if (gPaintingAnimState === 'entering') {
            // Target painting drops down with ease-out over 1.0 seconds
            var duration = 1.0;
            var t = Math.min(gPaintingAnimTimer / duration, 1.0);
            // Cubic ease-out: starts fast, decelerates (y = 1 - (1-x)^3)
            var eased = 1 - Math.pow(1 - t, 3);
            var targetBaseY = gTargetPainting === 'duchamp' ? gDuchampPaintingBaseY : gPaintingBaseY;
            var startY = targetBaseY + gPaintingExitY;
            
            // Move the target painting down
            var targetGroup = gTargetPainting === 'miro' ? gMiroPaintingGroup : 
                            (gTargetPainting === 'dali' ? gDaliPaintingGroup : 
                            (gTargetPainting === 'bosch' ? gBoschPaintingGroup : gDuchampPaintingGroup));
            targetGroup.position.y = startY - eased * (startY - targetBaseY);
            
            // Make entering painting visible
            targetGroup.visible = true;
            
            if (t >= 1.0) {
                gPaintingAnimState = 'idle';
                gPaintingAnimTimer = 0;
                // Ensure entering painting is visible
                targetGroup.visible = true;
            }
        }
    }
    
    // Ensure only current painting is visible when not animating
    if (gMiroPaintingGroup && gDaliPaintingGroup && gDuchampPaintingGroup && gBoschPaintingGroup && gPaintingAnimState === 'idle') {
        gMiroPaintingGroup.visible = (gCurrentPainting === 'miro');
        gDaliPaintingGroup.visible = (gCurrentPainting === 'dali');
        gDuchampPaintingGroup.visible = (gCurrentPainting === 'duchamp');
        gBoschPaintingGroup.visible = (gCurrentPainting === 'bosch');
    }
    
    // Update Duchamp Bride and Grinder painting visibility based on world size
    if (gPhysicsScene.worldSize.z >= 30 && !gDuchampExtraPaintingsActive) {
        // Activate extra paintings
        gDuchampExtraPaintingsActive = true;
        gDuchampExtraPaintingsDropping = true;
        gDuchampExtraPaintingsDropTimer = 0; // Reset timer
        
        // Position at 1/4 and 3/4 of the wall dimension
        // Wall goes from -worldSize.z to +worldSize.z
        if (gDuchampBridePaintingGroup) {
            gDuchampBridePaintingGroup.visible = true;
            gDuchampBridePaintingGroup.position.z = gPhysicsScene.worldSize.z / 1.7; // At 3/4 from left (right side)
            gDuchampBridePaintingGroup.position.y = gPaintingBaseY + gPaintingDropStartY;
        }
        if (gDuchampGrinderPaintingGroup) {
            gDuchampGrinderPaintingGroup.visible = true;
            gDuchampGrinderPaintingGroup.position.z = -gPhysicsScene.worldSize.z / 1.7; // At 1/4 from left (left side)
            gDuchampGrinderPaintingGroup.position.y = gPaintingBaseY + gPaintingDropStartY;
        }
        // Center painting is at z=0
    }
    
    // Update positioning when world size changes
    if (gDuchampExtraPaintingsActive && gPhysicsScene.worldSize.z >= 30) {
        if (gDuchampBridePaintingGroup) {
            gDuchampBridePaintingGroup.position.z = gPhysicsScene.worldSize.z / 1.7;
        }
        if (gDuchampGrinderPaintingGroup) {
            gDuchampGrinderPaintingGroup.position.z = -gPhysicsScene.worldSize.z / 1.7;
        }
    }
    
    // Hide if world size becomes too small
    if (gPhysicsScene.worldSize.z < 30 && gDuchampExtraPaintingsActive) {
        if (gDuchampBridePaintingGroup) {
            gDuchampBridePaintingGroup.visible = false;
        }
        if (gDuchampGrinderPaintingGroup) {
            gDuchampGrinderPaintingGroup.visible = false;
        }
        gDuchampExtraPaintingsActive = false;
        gDuchampExtraPaintingsDropping = false;
        gDuchampExtraPaintingsDropTimer = 0;
    }
    
    // Update Duchamp Bride Top painting visibility based on world size Y and boid types
    // DISABLED: Image loads but is never displayed
    /*
    // Only show if world size Y >= 30 AND any selected boid type is Cone (1) or Cylinder (2)
    if (gPhysicsScene.worldSize.y >= 30 && (gSelectedBoidTypes.includes(1) || gSelectedBoidTypes.includes(2)) && !gDuchampBrideTopActive) {
        // Activate top painting
        gDuchampBrideTopActive = true;
        gDuchampBrideTopDropping = true;
        gDuchampBrideTopDropTimer = 0; // Reset timer
        
        // Position directly above gDuchampPaintingGroup
        if (gDuchampBrideTopPaintingGroup) {
            gDuchampBrideTopPaintingGroup.visible = true;
            // Target Y position = duchampPaintingY + duchampHeight + frameThickness = duchampPaintingY + 12.3
            gDuchampBrideTopPaintingGroup.position.y = gDuchampPaintingBaseY + 12.3 + gPaintingDropStartY;
        }
    }
    
    // Hide if world size becomes too small or no cone/cylinder types selected
    if ((gPhysicsScene.worldSize.y < 30 || (!gSelectedBoidTypes.includes(1) && !gSelectedBoidTypes.includes(2))) && gDuchampBrideTopActive) {
        if (gDuchampBrideTopPaintingGroup) {
            gDuchampBrideTopPaintingGroup.visible = false;
        }
        gDuchampBrideTopActive = false;
        gDuchampBrideTopDropping = false;
        gDuchampBrideTopDropTimer = 0;
    }
    */
    
    // Update Duchamp Bride and Grinder painting visibility
    if (gDuchampBridePaintingGroup) {
        var storageThreshold = gPaintingBaseY + gPaintingExitY * 0.5;
        // Only visible if world size is sufficient AND position is below threshold
        if (gDuchampExtraPaintingsActive) {
            gDuchampBridePaintingGroup.visible = gDuchampBridePaintingGroup.position.y < storageThreshold;
        } else {
            gDuchampBridePaintingGroup.visible = false;
        }
    }
    if (gDuchampGrinderPaintingGroup) {
        var storageThreshold = gPaintingBaseY + gPaintingExitY * 0.5;
        // Only visible if world size is sufficient AND position is below threshold
        if (gDuchampExtraPaintingsActive) {
            gDuchampGrinderPaintingGroup.visible = gDuchampGrinderPaintingGroup.position.y < storageThreshold;
        } else {
            gDuchampGrinderPaintingGroup.visible = false;
        }
    }
    
    // Update Bosch triptych scale based on world size
    if (gBoschPaintingGroup) {
        var targetScale = 1.0;
        
        // Determine target scale based on world size
        if (gPhysicsScene.worldSize.y >= 60 && gPhysicsScene.worldSize.z >= 60) {
            targetScale = 4.0;
        } else if (gPhysicsScene.worldSize.y >= 50 && gPhysicsScene.worldSize.z >= 50) {
            targetScale = 3.0;
        } else if (gPhysicsScene.worldSize.y >= 40 && gPhysicsScene.worldSize.z >= 40) {
            targetScale = 2.5;
        } else if (gPhysicsScene.worldSize.y >= 30 && gPhysicsScene.worldSize.z >= 30) {
            targetScale = 1.5;
        } else {
            targetScale = 1.0;
        }
        
        // If scale needs to change, recreate the triptych
        if (targetScale !== gBoschTriptychScale) {
            recreateBoschTriptych(targetScale);
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
        
        // Update obstacle position during animation
        if (gTeapotObstacle) {
            gTeapotObstacle.updatePosition(new THREE.Vector3(
                gTeapot.position.x,
                gTeapot.position.y + gTeapotObstacle.height / 2,
                currentZ
            ));
        }
        
        // Stop animation when complete
        if (t >= 1.0) {
            gTeapotAnimating = false;
            gTeapot.position.z = gTeapotTargetZ; // Ensure final position is exact
            
            // Final obstacle position update
            if (gTeapotObstacle) {
                gTeapotObstacle.updatePosition(new THREE.Vector3(
                    gTeapot.position.x,
                    gTeapot.position.y + gTeapotObstacle.height / 2,
                    gTeapotTargetZ
                ));
            }
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
    
    // Column base slide animation
    // Skip if column was ever dragged - user interaction takes permanent precedence
    if (gColumnBaseSliding && gColumnObstacle && !gColumnEverDragged) {
        gColumnBaseSlideTimer += deltaT;
        
        // Slide from Z=25 to Z=-9 over 2 seconds with ease-out (deceleration)
        var duration = 2.0;
        var t = Math.min(gColumnBaseSlideTimer / duration, 1.0);
        
        // Cubic ease-out: y = 1 - (1-x)^3 (starts fast, ends slow - deceleration)
        var eased = 1 - Math.pow(1 - t, 3);
        
        // Interpolate Z position
        var currentZ = gColumnBaseStartZ + (gColumnBaseTargetZ - gColumnBaseStartZ) * eased;
        
        // Update only the Z coordinate of base components (preserving current X and Y)
        if (gColumnObstacle.minorToricPedestalMesh) {
            gColumnObstacle.minorToricPedestalMesh.position.z = currentZ;
        }
        if (gColumnObstacle.majorToricPedestalMesh) {
            gColumnObstacle.majorToricPedestalMesh.position.z = currentZ;
        }
        if (gColumnObstacle.discMesh) {
            gColumnObstacle.discMesh.position.z = currentZ;
        }
        if (gColumnObstacle.pedestalMesh) {
            gColumnObstacle.pedestalMesh.position.z = currentZ;
        }
        
        // Stop animation when complete
        if (t >= 1.0) {
            gColumnBaseSliding = false;
            // Ensure final Z position is exact
            if (gColumnObstacle.minorToricPedestalMesh) {
                gColumnObstacle.minorToricPedestalMesh.position.z = gColumnBaseTargetZ;
            }
            if (gColumnObstacle.majorToricPedestalMesh) {
                gColumnObstacle.majorToricPedestalMesh.position.z = gColumnBaseTargetZ;
            }
            if (gColumnObstacle.discMesh) {
                gColumnObstacle.discMesh.position.z = gColumnBaseTargetZ;
            }
            if (gColumnObstacle.pedestalMesh) {
                gColumnObstacle.pedestalMesh.position.z = gColumnBaseTargetZ;
            }
        }
    }
    
    // Chair slide animation
    if (gChairSliding && gChair) {
        gChairSlideTimer += deltaT;
        
        // Slide from X=60 to X=-2 over 2 seconds with ease-out (deceleration)
        var duration = 2.0;
        var t = Math.min(gChairSlideTimer / duration, 1.0);
        
        // Cubic ease-out: y = 1 - (1-x)^3 (starts fast, ends slow - deceleration)
        var eased = 1 - Math.pow(1 - t, 3);
        
        // Interpolate X position
        var currentX = gChairStartX + (gChairTargetX - gChairStartX) * eased;
        
        // Update chair position
        gChair.position.x = currentX;
        
        // Update obstacle position
        if (gChairObstacle) {
            gChairObstacle.updatePosition(new THREE.Vector3(currentX, gChair.position.y + gChairObstacle.height / 2, gChair.position.z));
        }
        
        // Stop animation when complete
        if (t >= 1.0) {
            gChairSliding = false;
            // Ensure final position is exact
            gChair.position.x = gChairTargetX;
            if (gChairObstacle) {
                gChairObstacle.updatePosition(new THREE.Vector3(gChairTargetX, gChair.position.y + gChairObstacle.height / 2, gChair.position.z));
            }
        }
    }
    
    // Sofa slide animation
    if (gSofaSliding && gSofa) {
        gSofaSlideTimer += deltaT;
        
        // Slide from X=-60 to final position over 2 seconds with ease-out (deceleration)
        var duration = 2.0;
        var t = Math.min(gSofaSlideTimer / duration, 1.0);
        
        // Cubic ease-out: y = 1 - (1-x)^3 (starts fast, ends slow - deceleration)
        var eased = 1 - Math.pow(1 - t, 3);
        
        // Interpolate X position
        var currentX = gSofaStartX + (gSofaTargetX - gSofaStartX) * eased;
        
        // Update sofa position
        gSofa.position.x = currentX;
        
        // Update obstacle position (with offset toward rear)
        if (gSofaObstacle && gSofa) {
            var sofaRotation = gSofa.rotation.y;
            var rearOffset = 1.2;
            var offsetX = -rearOffset * Math.sin(sofaRotation);
            var offsetZ = -rearOffset * Math.cos(sofaRotation);
            gSofaObstacle.updatePosition(new THREE.Vector3(currentX + offsetX, gSofa.position.y + gSofaObstacle.height / 2, gSofa.position.z + offsetZ));
        }
        
        // Stop animation when complete
        if (t >= 1.0) {
            gSofaSliding = false;
            // Ensure final position is exact
            gSofa.position.x = gSofaTargetX;
            if (gSofaObstacle && gSofa) {
                var sofaRotation = gSofa.rotation.y;
                var rearOffset = 1.2;
                var offsetX = -rearOffset * Math.sin(sofaRotation);
                var offsetZ = -rearOffset * Math.cos(sofaRotation);
                gSofaObstacle.updatePosition(new THREE.Vector3(gSofaTargetX + offsetX, gSofa.position.y + gSofaObstacle.height / 2, gSofa.position.z + offsetZ));
            }
        }
    }
    
    // Star drop animations with staggered timing
    for (var i = 0; i < gStarAnimData.length; i++) {
        var starData = gStarAnimData[i];
        if (starData.animating) {
            starData.timer += deltaT;
            
            // Check if delay has passed
            if (starData.timer >= starData.delay) {
                var animTime = starData.timer - starData.delay;
                var duration = 1.5; // Drop duration in seconds
                var t = Math.min(animTime / duration, 1.0);
                
                // Cubic ease-out for natural drop
                var eased = 1 - Math.pow(1 - t, 3);
                // Calculate target height: preserve original targetY, apply percentage as offset
                // Original range was 0.8 to 1.5 * worldHeight, centered around 1.15 * worldHeight
                var worldHeight = gPhysicsScene.worldSize.y;
                var originalCenter = worldHeight * 1.15; // Center of original range
                var percentageCenter = (gOrnamentHeightOffset / 100) * (worldHeight * 2.1); // Center based on percentage
                var heightOffset = percentageCenter - originalCenter; // How much to shift from original
                var targetHeight = starData.targetY + heightOffset;
                // Drop to adjusted target
                var currentY = starData.startY + (targetHeight - starData.startY) * eased;
                starData.star.position.y = currentY;
                
                // Update obstacle position during drop (lower than origin)
                if (starData.obstacle) {
                    var obstacleRadius = starData.obstacle.radius;
                    var yOffset = starData.yOffsetMultiplier || 1.0;
                    starData.obstacle.updatePosition(new THREE.Vector3(starData.x, currentY - obstacleRadius * yOffset, starData.z));
                }
                
                // Update point light position during drop
                if (starData.pointLight) {
                    starData.pointLight.position.y = currentY;
                }
                
                // Update wire position and length
                var ceilingY = 2 * gPhysicsScene.worldSize.y; // Wire extends to 2x world height
                var starTop = currentY; // Connect to model origin
                var wireLength = ceilingY - starTop;
                
                // Update wire position and scale (no geometry recreation)
                starData.wire.position.set(starData.x, starTop + wireLength / 2, starData.z);
                starData.wire.scale.set(1, wireLength, 1);
                starData.wire.rotation.set(0, 0, 0); // Keep vertical during drop
                
                // Stop animation when complete
                if (t >= 1.0) {
                    starData.animating = false;
                }
            }
        } else if (gEnableStarSwayAndTwist) {
            // Apply gentle swaying and twisting after drop completes
            var swayStiffness = 0.12; // Spring stiffness (lower = more sway)
            var swayDamping = 0.98; // Velocity damping (close to 1 = less damping)
            var twistDamping = 0.992;
            var twistDriveStrength = 0.15;
            
            // Add subtle driving force using accumulated phase (no trig)
            starData.swayPhase += deltaT;
            var phaseX = starData.swayPhase % 4.0 - 2.0; // Oscillates -2 to 2
            var phaseZ = (starData.swayPhase * 0.7) % 4.0 - 2.0;
            var driveX = (phaseX > 0 ? 1 : -1) * 0.2; // Simple forcing
            var driveZ = (phaseZ > 0 ? 1 : -1) * 0.2;
            
            // Simple spring physics for sway
            var accelX = -swayStiffness * starData.offsetX + driveX;
            var accelZ = -swayStiffness * starData.offsetZ + driveZ;
            
            starData.velX = starData.velX * swayDamping + accelX * deltaT;
            starData.velZ = starData.velZ * swayDamping + accelZ * deltaT;
            
            starData.offsetX += starData.velX * deltaT;
            starData.offsetZ += starData.velZ * deltaT;
            
            // Update star position with sway
            var worldHeight = gPhysicsScene.worldSize.y;
            var originalCenter = worldHeight * 1.15;
            var percentageCenter = (gOrnamentHeightOffset / 100) * (worldHeight * 2.1);
            var heightOffset = percentageCenter - originalCenter;
            var targetHeight = starData.targetY + heightOffset;
            starData.star.position.x = starData.x + starData.offsetX;
            starData.star.position.y = targetHeight;
            starData.star.position.z = starData.z + starData.offsetZ;
            
            // Update obstacle position with sway (lower than origin)
            if (starData.obstacle) {
                var obstacleRadius = starData.obstacle.radius;
                var yOffset = starData.yOffsetMultiplier || 1.0;
                var worldHeight = gPhysicsScene.worldSize.y;
                var originalCenter = worldHeight * 1.15;
                var percentageCenter = (gOrnamentHeightOffset / 100) * (worldHeight * 2.1);
                var heightOffset = percentageCenter - originalCenter;
                var targetHeight = starData.targetY + heightOffset;
                starData.obstacle.updatePosition(new THREE.Vector3(
                    starData.x + starData.offsetX,
                    targetHeight - obstacleRadius * yOffset,
                    starData.z + starData.offsetZ
                ));
            }
            
            // Update point light position with sway
            if (starData.pointLight) {
                var worldHeight = gPhysicsScene.worldSize.y;
                var originalCenter = worldHeight * 1.15;
                var percentageCenter = (gOrnamentHeightOffset / 100) * (worldHeight * 2.1);
                var heightOffset = percentageCenter - originalCenter;
                var targetHeight = starData.targetY + heightOffset;
                starData.pointLight.position.x = starData.x + starData.offsetX;
                starData.pointLight.position.y = targetHeight;
                starData.pointLight.position.z = starData.z + starData.offsetZ;
            }
            
            // Update wire to connect fixed ceiling point to moving star (optimized)
            var worldHeight = gPhysicsScene.worldSize.y;
            var originalCenter = worldHeight * 1.15;
            var percentageCenter = (gOrnamentHeightOffset / 100) * (worldHeight * 2.1);
            var heightOffset = percentageCenter - originalCenter;
            var targetHeight = starData.targetY + heightOffset;
            var currentY = targetHeight;
            var starTop = currentY; // Connect to model origin
            var ceilingY = 2 * gPhysicsScene.worldSize.y;
            
            // Fixed ceiling attachment point (bottom of cone)
            var ceilingX = starData.x;
            var ceilingZ = starData.z;
            
            // Moving star attachment point (top of star)
            var starAttachX = starData.star.position.x;
            var starAttachZ = starData.star.position.z;
            
            // Calculate wire vector
            var dx = starAttachX - ceilingX;
            var dy = starTop - ceilingY;
            var dz = starAttachZ - ceilingZ;
            var wireLengthSq = dx*dx + dy*dy + dz*dz;
            var wireLength = Math.sqrt(wireLengthSq);
            var invLength = 1.0 / wireLength;
            
            // Normalize direction (reuse inverted length)
            var ndx = dx * invLength;
            var ndy = dy * invLength;
            var ndz = dz * invLength;
            
            // Position wire at midpoint
            starData.wire.position.set(
                (ceilingX + starAttachX) * 0.5,
                (ceilingY + starTop) * 0.5,
                (ceilingZ + starAttachZ) * 0.5
            );
            
            // Scale wire length (geometry is unit length, keep X and Z at 1)
            starData.wire.scale.set(1, wireLength, 1);
            
            // Rotate wire to point from ceiling to star using lookAt-style approach
            // Create a helper to calculate the rotation
            var upVec = new THREE.Vector3(ndx, ndy, ndz);
            var defaultUp = new THREE.Vector3(0, 1, 0);
            var quat = new THREE.Quaternion();
            quat.setFromUnitVectors(defaultUp, upVec);
            starData.wire.quaternion.copy(quat);
            
            // Gentle twist (damped angular velocity with driving force)
            starData.twistPhase += deltaT * 0.5;
            var twistDrive = ((starData.twistPhase % 3.0 - 1.5) > 0 ? 1 : -1) * twistDriveStrength;
            starData.angularVel = starData.angularVel * twistDamping + twistDrive * deltaT;
            starData.baseRotationY += starData.angularVel * deltaT;
            starData.star.rotation.y = starData.baseRotationY;
        }
    }
    
    // Pedestal descent animations with staggered timing
    for (var i = 0; i < gPedestalAnimData.length; i++) {
        var pedestalData = gPedestalAnimData[i];
        if (pedestalData.animating) {
            pedestalData.timer += deltaT;
            
            // Check if delay has passed
            if (pedestalData.timer >= pedestalData.delay) {
                var animTime = pedestalData.timer - pedestalData.delay;
                var duration = 1.2; // Descent duration in seconds
                var t = Math.min(animTime / duration, 1.0);
                
                // Cubic ease-out for natural descent
                var eased = 1 - Math.pow(1 - t, 3);
                var currentPedestalY = pedestalData.startY + (pedestalData.targetPedestalY - pedestalData.startY) * eased;
                var solidOffset = pedestalData.targetSolidY - pedestalData.targetPedestalY;
                var currentSolidY = pedestalData.startY + solidOffset + (pedestalData.targetPedestalY - pedestalData.startY) * eased;
                
                pedestalData.pedestal.position.y = currentPedestalY;
                pedestalData.solidGroup.position.y = currentSolidY;
                
                // Stop animation when complete
                if (t >= 1.0) {
                    pedestalData.animating = false;
                    pedestalData.pedestal.position.y = pedestalData.targetPedestalY;
                    pedestalData.solidGroup.position.y = pedestalData.targetSolidY;
                }
            }
        }
    }
    
    // Animate column dropping after pedestals finish
    if (gColumnDropping && gColumnObstacle) {
        // Check if all pedestals have finished animating
        const allPedestalsDone = gPedestalAnimData.every(function(data) {
            return !data.animating;
        });
        
        if (allPedestalsDone) {
            gColumnDropTimer += deltaT;
            
            if (gColumnDropTimer >= gColumnDropDelay) {
                const elapsed = gColumnDropTimer - gColumnDropDelay;
                const progress = Math.min(1, elapsed / gColumnDropDuration);
                
                // Cubic ease-out: starts fast, decelerates
                const easedProgress = 1 - Math.pow(1 - progress, 3);
                
                // Calculate current Y offset
                const currentOffset = gColumnStartY * (1 - easedProgress);
                const targetY = 6.03;
                const currentY = targetY + currentOffset;
                
                // Preserve column's current X/Z position (in case it was dragged)
                const columnX = gColumnObstacle.position.x;
                const columnZ = gColumnObstacle.position.z;
                
                // Update column position (this will update all parts including base components)
                gColumnObstacle.updatePosition(new THREE.Vector3(columnX, currentY, columnZ));
                
                // End animation when complete
                if (progress >= 1) {
                    gColumnDropping = false;
                    // Preserve column's current X/Z position (in case it was dragged)
                    const columnX = gColumnObstacle.position.x;
                    const columnZ = gColumnObstacle.position.z;
                    // Update to final Y position
                    gColumnObstacle.updatePosition(new THREE.Vector3(columnX, targetY, columnZ));
                }
            }
        }
    }
    
    // Animate Brancusi Bird dropping after pedestals finish
    if (gBirdDropping && gBird && gBirdObstacle) {
        // Check if all pedestals have finished animating
        const allPedestalsDone = gPedestalAnimData.every(function(data) {
            return !data.animating;
        });
        
        if (allPedestalsDone) {
            gBirdDropTimer += deltaT;
            
            if (gBirdDropTimer >= gBirdDropDelay) {
                const elapsed = gBirdDropTimer - gBirdDropDelay;
                const progress = Math.min(1, elapsed / gBirdDropDuration);
                
                // Cubic ease-out: starts fast, decelerates
                const easedProgress = 1 - Math.pow(1 - progress, 3);
                
                // Calculate current Y offset
                const currentOffset = gBirdStartY * (1 - easedProgress);
                const targetY = 0;
                const currentY = targetY + currentOffset;
                
                // Update bird position
                gBird.position.y = currentY;
                
                // Update obstacle position
                gBirdObstacle.updatePosition(new THREE.Vector3(
                    gBird.position.x,
                    currentY + gBirdObstacle.height / 2,
                    gBird.position.z
                ));
                
                // End animation when complete
                if (progress >= 1) {
                    gBirdDropping = false;
                    gBird.position.y = targetY;
                    gBirdObstacle.updatePosition(new THREE.Vector3(
                        gBird.position.x,
                        targetY + gBirdObstacle.height / 2,
                        gBird.position.z
                    ));
                }
            }
        }
    }
    
    // Animate Platonic solids rotation around Y axis
    if (window.gPlatonicSolids && window.gPlatonicSolids.length === 5) {
        for (var i = 0; i < window.gPlatonicSolids.length; i++) {
            window.gPlatonicSolids[i].rotation.y += 0.5 * deltaT; // Slow rotation
        }
    }
    
    // Animate globe lamp rotation around Y axis (only if visible/enabled)
    if (gGlobeLamp && gGlobeLampIntensity > 0) {
        gGlobeLamp.rotation.y += 0.3 * deltaT; // Slow spin
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
    
    if (cameraMenuVisible) {
        cameraMenuOpacity = Math.min(0.9, cameraMenuOpacity + cameraMenuFadeSpeed * deltaT);
    } else {
        cameraMenuOpacity = Math.max(0, cameraMenuOpacity - cameraMenuFadeSpeed * deltaT);
    }
    
    // Update colors if in dynamic mode (by direction, speed, or doppler)
    if (gColorationMode === 1 || gColorationMode === 2 || gColorationMode === 3) {
        applyMixedColors();
    }
    
    // Animate walls tilting into place
    const boxSize = gPhysicsScene.worldSize;
    ['front', 'back', 'left', 'right'].forEach(wallName => {
        const anim = gWallAnimation[wallName];
        if (anim.animating) {
            anim.timer += deltaT;
            
            if (anim.timer >= anim.delay) {
                const elapsed = anim.timer - anim.delay;
                const progress = Math.min(1, elapsed / anim.duration);
                
                // Ease-in cubic function: t^3
                const easedProgress = progress * progress * progress;
                
                // Interpolate rotation
                const currentRotation = anim.startRotation + (anim.targetRotation - anim.startRotation) * easedProgress;
                
                // Apply rotation and position based on wall orientation
                // Walls rotate around their bottom edges at floor level
                if (wallName === 'front') {
                    gWalls.front.rotation.x = currentRotation;
                    gWalls.front.position.y = (boxSize.y / 2) * Math.cos(currentRotation);
                    gWalls.front.position.z = boxSize.z + (boxSize.y / 2) * Math.sin(currentRotation);
                } else if (wallName === 'back') {
                    gWalls.back.rotation.x = currentRotation;
                    gWalls.back.position.y = (boxSize.y / 2) * Math.cos(currentRotation);
                    gWalls.back.position.z = -boxSize.z + (boxSize.y / 2) * Math.sin(currentRotation);
                } else if (wallName === 'left') {
                    gWalls.left.rotation.x = currentRotation;
                    gWalls.left.position.y = (boxSize.y / 2) * Math.cos(currentRotation);
                    gWalls.left.position.x = -boxSize.x - (boxSize.y / 2) * Math.sin(currentRotation);
                } else if (wallName === 'right') {
                    gWalls.right.rotation.x = -currentRotation;
                    gWalls.right.position.y = (boxSize.y / 2) * Math.cos(currentRotation);
                    gWalls.right.position.x = boxSize.x - (boxSize.y / 2) * Math.sin(currentRotation);
                }
                
                if (progress >= 1) {
                    anim.animating = false;
                    // Ensure final position is exact
                    if (wallName === 'front') {
                        gWalls.front.rotation.x = 0;
                        gWalls.front.position.y = boxSize.y / 2;
                        gWalls.front.position.z = boxSize.z;
                    } else if (wallName === 'back') {
                        gWalls.back.rotation.x = 0;
                        gWalls.back.position.y = boxSize.y / 2;
                        gWalls.back.position.z = -boxSize.z;
                    } else if (wallName === 'left') {
                        gWalls.left.rotation.x = 0;
                        gWalls.left.position.y = boxSize.y / 2;
                        gWalls.left.position.x = -boxSize.x;
                        gWalls.left.position.z = 0;
                    } else if (wallName === 'right') {
                        gWalls.right.rotation.x = 0;
                        gWalls.right.position.y = boxSize.y / 2;
                        gWalls.right.position.x = boxSize.x;
                        gWalls.right.position.z = 0;
                    }
                }
            }
        }
    });
    
    // Animate paintings dropping into place after walls finish
    if (gPaintingsDropping) {
        // Check if all walls have finished animating
        const allWallsDone = !gWallAnimation.front.animating && 
                            !gWallAnimation.back.animating && 
                            !gWallAnimation.left.animating && 
                            !gWallAnimation.right.animating;
        
        if (allWallsDone) {
            gPaintingDropTimer += deltaT;
            
            if (gPaintingDropTimer >= gPaintingDropDelay) {
                const elapsed = gPaintingDropTimer - gPaintingDropDelay;
                const progress = Math.min(1, elapsed / gPaintingDropDuration);
                
                // Cubic ease-out: starts fast, decelerates (y = 1 - (1-x)^3)
                const easedProgress = 1 - Math.pow(1 - progress, 3);
                
                // Calculate current Y offset
                const currentOffset = gPaintingDropStartY * (1 - easedProgress);
                
                // Update Miro painting group
                if (gMiroPaintingGroup) {
                    gMiroPaintingGroup.position.y = gPaintingBaseY + currentOffset;
                }
                
                // Update Dali painting group (already high from swap system)
                if (gDaliPaintingGroup && gDaliPaintingGroup.position.y > gPaintingBaseY + gPaintingDropStartY) {
                    gDaliPaintingGroup.position.y = gPaintingBaseY + gPaintingExitY + currentOffset;
                }
                
                // Update Duchamp painting group (already high from swap system)
                if (gDuchampPaintingGroup && gDuchampPaintingGroup.position.y > gDuchampPaintingBaseY + gPaintingDropStartY) {
                    gDuchampPaintingGroup.position.y = gDuchampPaintingBaseY + gPaintingExitY + currentOffset;
                }
                
                // Update left wall painting and frame
                if (gLeftWallPainting) {
                    const painting2Y = boxSize.y / 2 + 1;
                    gLeftWallPainting.position.y = painting2Y + currentOffset;
                    
                    // Update frame pieces
                    const painting2Width = 12 * 0.9;
                    const painting2Height = 16 * 0.9;
                    const frame2Thickness = 0.3;
                    
                    if (gLeftWallFramePieces.length >= 4) {
                        gLeftWallFramePieces[0].position.y = painting2Y + painting2Height / 2 + frame2Thickness / 2 + currentOffset; // top
                        gLeftWallFramePieces[1].position.y = painting2Y - painting2Height / 2 - frame2Thickness / 2 + currentOffset; // bottom
                        gLeftWallFramePieces[2].position.y = painting2Y + currentOffset; // left
                        gLeftWallFramePieces[3].position.y = painting2Y + currentOffset; // right
                    }
                }
                
                // Update oval painting and frame on back wall
                if (gOvalPainting) {
                    const ovalPaintingY = boxSize.y / 2 + 6;
                    gOvalPainting.position.y = ovalPaintingY + currentOffset;
                }
                if (gOvalFrame) {
                    const ovalPaintingY = boxSize.y / 2 + 6;
                    gOvalFrame.position.y = ovalPaintingY + currentOffset;
                }
                
                // End animation when complete
                if (progress >= 1) {
                    gPaintingsDropping = false;
                }
            }
        }
    }
    
    // Torus drop animation after paintings finish
    if (gTorusDropping && gTorusObstacle) {
        // Check if paintings have finished dropping
        if (!gPaintingsDropping) {
            gTorusDropTimer += deltaT;
            
            if (gTorusDropTimer >= gTorusDropDelay) {
                const elapsed = gTorusDropTimer - gTorusDropDelay;
                const progress = Math.min(1, elapsed / gTorusDropDuration);
                
                // Cubic ease-out: starts fast, decelerates
                const easedProgress = 1 - Math.pow(1 - progress, 3);
                
                // Calculate current Y position
                const currentY = (gTorusTargetY + gTorusStartY) + (gTorusTargetY - (gTorusTargetY + gTorusStartY)) * easedProgress;
                
                // Calculate current radii for visual scaling only
                const currentMajorRadius = gTorusStartMajorRadius + (gTorusTargetMajorRadius - gTorusStartMajorRadius) * easedProgress;
                const currentMinorRadius = gTorusStartMinorRadius + (gTorusTargetMinorRadius - gTorusStartMinorRadius) * easedProgress;
                
                // Update only visual mesh (not collision properties)
                if (gTorusObstacle.mesh) {
                    gTorusObstacle.mesh.position.set(11, currentY, 0);
                    const majorScale = currentMajorRadius / gTorusStartMajorRadius;
                    const minorScale = currentMinorRadius / gTorusStartMinorRadius;
                    // Scale uniformly based on major radius growth
                    gTorusObstacle.mesh.scale.set(majorScale, majorScale, majorScale);
                }
                
                // End animation when complete
                if (progress >= 1) {
                    gTorusDropping = false;
                    // Set final collision properties
                    gTorusObstacle.updatePosition(new THREE.Vector3(11, gTorusTargetY, 0));
                    
                    // Calculate actual final radii based on uniform scaling
                    const finalScale = gTorusTargetMajorRadius / gTorusStartMajorRadius;
                    const actualFinalMajorRadius = gTorusStartMajorRadius * finalScale;  // = 6
                    const actualFinalMinorRadius = gTorusStartMinorRadius * finalScale;  // = 1.2
                    
                    gTorusObstacle.majorRadius = actualFinalMajorRadius;
                    gTorusObstacle.minorRadius = actualFinalMinorRadius;
                    
                    // Recreate geometry at proper size instead of leaving it scaled
                    if (gTorusObstacle.mesh) {
                        gThreeScene.remove(gTorusObstacle.mesh);
                        gTorusObstacle.mesh.geometry.dispose();
                        var newGeometry = new THREE.TorusGeometry(actualFinalMajorRadius, actualFinalMinorRadius, 16, 100);
                        gTorusObstacle.mesh.geometry = newGeometry;
                        gTorusObstacle.mesh.scale.set(1, 1, 1);  // Reset scale to 1
                        gThreeScene.add(gTorusObstacle.mesh);
                    }
                    
                    gTorusObstacle.enabled = true;  // Enable collision after animation
                }
            }
        }
    }
    
    // Sphere rise animation
    if (gSphereRising && gSphereObstacle) {
        gSphereRiseTimer += deltaT;
        
        const progress = Math.min(1, gSphereRiseTimer / gSphereRiseDuration);
        
        // Cubic ease-out: starts fast, decelerates
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        
        // Calculate current Y position
        const currentY = gSphereStartY + (gSphereTargetY - gSphereStartY) * easedProgress;
        
        // Calculate current radius for visual scaling only
        const currentRadius = gSphereStartRadius + (gSphereTargetRadius - gSphereStartRadius) * easedProgress;
        
        // Update only visual mesh (not collision properties)
        if (gSphereObstacle.mesh) {
            gSphereObstacle.mesh.position.set(-10, currentY, 18);
            const scale = currentRadius / gSphereStartRadius;
            gSphereObstacle.mesh.scale.set(scale, scale, scale);
        }
        
        // End animation when complete
        if (progress >= 1) {
            gSphereRising = false;
            // Set final collision properties
            gSphereObstacle.updatePosition(new THREE.Vector3(-10, gSphereTargetY, 18));
            gSphereObstacle.radius = gSphereTargetRadius;
            gSphereObstacle.enabled = true;  // Enable collision after animation
            if (gSphereObstacle.mesh) {
                const finalScale = gSphereTargetRadius / gSphereStartRadius;
                gSphereObstacle.mesh.scale.set(finalScale, finalScale, finalScale);
            }
        }
    }
    
    // Sky Pig rise animation
    if (gSkyPigRising && gSkyPigObstacle && gSkyPig) {
        gSkyPigRiseTimer += deltaT;
        
        const progress = Math.min(1, gSkyPigRiseTimer / gSkyPigRiseDuration);
        
        // Cubic ease-out: starts fast, decelerates
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        
        // Calculate current Y position
        const currentY = gSkyPigStartY + (gSkyPigTargetY - gSkyPigStartY) * easedProgress;
        
        // Calculate current scale (grow from tiny to full size)
        const currentScale = gSkyPigStartScale + (gSkyPigTargetScale - gSkyPigStartScale) * easedProgress;
        
        // Update sky pig position and scale
        gSkyPig.position.y = currentY;
        gSkyPig.scale.set(currentScale, currentScale, currentScale);
        
        // Update obstacle position (center should match model center)
        gSkyPigObstacle.updatePosition(new THREE.Vector3(15, currentY, -15));
        
        // End animation when complete
        if (progress >= 1) {
            gSkyPigRising = false;
            gSkyPigObstacle.enabled = true;  // Enable collision after animation
        }
    }
    
    // Separate animation for Duchamp extra paintings (can drop independently)
    if (gDuchampExtraPaintingsDropping && gDuchampExtraPaintingsActive) {
        gDuchampExtraPaintingsDropTimer += deltaT;
        
        const elapsed = gDuchampExtraPaintingsDropTimer;
        const progress = Math.min(1, elapsed / gPaintingDropDuration);
        
        // Cubic ease-out: starts fast, decelerates (y = 1 - (1-x)^3)
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        
        // Calculate current Y offset
        const currentOffset = gPaintingDropStartY * (1 - easedProgress);
        
        // Update Duchamp Bride painting group
        if (gDuchampBridePaintingGroup) {
            gDuchampBridePaintingGroup.position.y = gPaintingBaseY + currentOffset;
        }
        
        // Update Duchamp Grinder painting group
        if (gDuchampGrinderPaintingGroup) {
            gDuchampGrinderPaintingGroup.position.y = gPaintingBaseY + currentOffset;
        }
        
        // End animation when complete
        if (progress >= 1) {
            gDuchampExtraPaintingsDropping = false;
        }
    }
    
    // Separate animation for Duchamp Bride Top painting (can drop independently)
    if (gDuchampBrideTopDropping && gDuchampBrideTopActive) {
        gDuchampBrideTopDropTimer += deltaT;
        
        const elapsed = gDuchampBrideTopDropTimer;
        const progress = Math.min(1, elapsed / gPaintingDropDuration);
        
        // Cubic ease-out: starts fast, decelerates (y = 1 - (1-x)^3)
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        
        // Calculate current Y offset from target position
        const currentOffset = gPaintingDropStartY * (1 - easedProgress);
        
        // Update Duchamp Bride Top painting group (target = duchampPaintingY + 12.3)
        if (gDuchampBrideTopPaintingGroup) {
            gDuchampBrideTopPaintingGroup.position.y = gDuchampPaintingBaseY + 12.3 + currentOffset;
        }
        
        // End animation when complete
        if (progress >= 1) {
            gDuchampBrideTopDropping = false;
        }
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
    if ((gCameraMode === 3 || gCameraMode === 4) && gPhysicsScene.objects.length > 0) {
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
                const backwardOffset = direction.clone().multiplyScalar(-1.5 - gCameraDistanceOffset);
                targetPos.add(backwardOffset);
                targetPos.y += 1.3;
                lookDirection = direction.clone();
            } else {
                // In front of boid, looking backward
                const forwardOffset = direction.clone().multiplyScalar(2.0 + gCameraDistanceOffset);
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
        // Apply automatic rotation if in rotation modes (0 or 1)
        if (gCameraMode === 0 || gCameraMode === 1) {
            const target = gCameraControl.target;
            
            // Get current camera position relative to target
            const offset = gCamera.position.clone().sub(target);
            const radius = offset.length();
            
            // Rotate around vertical axis (Y) - time-based for smooth independent motion
            const direction = gCameraMode === 1 ? 1 : -1; // Mode 1 = CCW, Mode 0 = CW
            const rotationAngle = direction * gCameraRotationSpeed * deltaT * Math.PI / 180; // Convert to radians, scale by deltaT
            const axis = new THREE.Vector3(0, 1, 0);
            offset.applyAxisAngle(axis, rotationAngle);
            
            // Update camera position
            gCamera.position.copy(target).add(offset);
            gCamera.lookAt(target);
            
            // Sync OrbitControls to prevent stuttering
            gCameraControl.update();
        } else if (gCameraMode === 5) {
            // Walking first-person camera mode (standard FPS controls)
            const walkSpeed = gWalkingSpeed;
            
            // Calculate forward and right directions based on yaw (horizontal plane only)
            const forward = new THREE.Vector3(
                Math.sin(gWalkingCameraYaw),
                0,
                Math.cos(gWalkingCameraYaw)
            );
            const right = new THREE.Vector3(
                Math.cos(gWalkingCameraYaw),
                0,
                -Math.sin(gWalkingCameraYaw)
            );
            
            // Arrow keys control pan and tilt
            const rotationSpeed = 1.5; // radians per second
            if (gKeysPressed.left) {
                gWalkingCameraYaw += rotationSpeed * deltaT;
            }
            if (gKeysPressed.right) {
                gWalkingCameraYaw -= rotationSpeed * deltaT;
            }
            if (gKeysPressed.up) {
                gWalkingCameraPitch += rotationSpeed * deltaT;
            }
            if (gKeysPressed.down) {
                gWalkingCameraPitch -= rotationSpeed * deltaT;
            }
            // Clamp pitch to prevent camera flipping
            gWalkingCameraPitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, gWalkingCameraPitch));
            
            // WASD movement
            if (gKeysPressed.w) {
                gWalkingCameraPosition.add(forward.clone().multiplyScalar(walkSpeed * deltaT));
            }
            if (gKeysPressed.s) {
                gWalkingCameraPosition.add(forward.clone().multiplyScalar(-walkSpeed * deltaT));
            }
            if (gKeysPressed.a) {
                gWalkingCameraPosition.add(right.clone().multiplyScalar(walkSpeed * deltaT));
            }
            if (gKeysPressed.d) {
                gWalkingCameraPosition.add(right.clone().multiplyScalar(-walkSpeed * deltaT));
            }
            
            // Constrain position within world bounds
            const worldSize = gPhysicsScene.worldSize;
            gWalkingCameraPosition.x = Math.max(-worldSize.x + 1, Math.min(worldSize.x - 1, gWalkingCameraPosition.x));
            gWalkingCameraPosition.z = Math.max(-worldSize.z + 1, Math.min(worldSize.z - 1, gWalkingCameraPosition.z));
            
            // Update camera position
            gCamera.position.copy(gWalkingCameraPosition);
            
            // Calculate look-at point based on yaw and pitch
            const lookDirection = new THREE.Vector3(
                Math.sin(gWalkingCameraYaw),
                Math.sin(gWalkingCameraPitch),
                Math.cos(gWalkingCameraYaw)
            ).normalize();
            
            const lookAtPoint = gWalkingCameraPosition.clone().add(lookDirection.multiplyScalar(10));
            gCamera.lookAt(lookAtPoint);
        } else if (gCameraMode === 6) {
            // Dolly camera mode - camera moves along rails
            // (dolly position is updated in the cart visibility section below)
            
            // Calculate position along rails
            // Position ranges from -gDollyRailsLength/2 to +gDollyRailsLength/2 along the local X axis
            const localX = (gDollyPosition - 0.5) * gDollyRailsLength;
            
            // Transform from local to world coordinates
            const worldX = gDollyRailsPosition.x + Math.cos(gDollyRailsRotation) * localX;
            const worldZ = gDollyRailsPosition.z - Math.sin(gDollyRailsRotation) * localX;
            
            // Set camera position on the dolly
            gCamera.position.set(worldX, gDollyCameraHeight, worldZ);
            
            // Calculate look-at point based on dolly rotation plus pan/tilt
            const baseLookDirection = new THREE.Vector3(
                Math.cos(gDollyRailsRotation + gDollyCameraYaw),
                Math.sin(gDollyCameraPitch),
                -Math.sin(gDollyRailsRotation + gDollyCameraYaw)
            );
            baseLookDirection.normalize();
            
            const lookAtPoint = gCamera.position.clone().add(baseLookDirection.multiplyScalar(10));
            gCamera.lookAt(lookAtPoint);
        }
    }
    
    // Update dolly rails visibility based on camera menu
    if (gDollyRailsMesh) {
        gDollyRailsMesh.visible = cameraMenuVisible;
    }
    
    // Update dolly cart visibility and position
    if (gDollyCartMesh) {
        gDollyCartMesh.visible = cameraMenuVisible;
        
        // Update dolly position continuously (not just when menu is visible)
        // Calculate position limits based on end cap size and cart dimensions
        const railRadius = 0.1;
        const railSpacing = 1.5;
        const clearSpace = railSpacing - (2 * railRadius);
        const endCapRadius = clearSpace / 2;
        const platformLength = 2.0; // Must match cart platform length
        const stopDistance = (platformLength / 2) + endCapRadius; // Cart half-length + end cap radius
        const positionOffset = stopDistance / gDollyRailsLength;
        const minPosition = positionOffset;
        const maxPosition = 1 - positionOffset;
        
        // Calculate speed with smooth acceleration/deceleration near ends
        const decelerationZone = 0.04; // Short transition zone at ends
        let speedMultiplier = 1.0;
        
        // Apply speed reduction when near either end (for both acceleration and deceleration)
        if (gDollyPosition < (minPosition + decelerationZone)) {
            // Near start - slow when approaching, slow when leaving
            const distanceFromStart = gDollyPosition - minPosition;
            speedMultiplier = Math.max(0.05, distanceFromStart / decelerationZone);
        } else if (gDollyPosition > (maxPosition - decelerationZone)) {
            // Near end - slow when approaching, slow when leaving
            const distanceFromEnd = maxPosition - gDollyPosition;
            speedMultiplier = Math.max(0.05, distanceFromEnd / decelerationZone);
        }
        
        // Update position with modified speed
        gDollyPosition += gDollyDirection * gDollySpeed * speedMultiplier * deltaT;
        
        // Reverse at ends (only if moving in the wrong direction)
        if (gDollyPosition <= minPosition && gDollyDirection < 0) {
            gDollyPosition = minPosition;
            gDollyDirection = 1;
        } else if (gDollyPosition >= maxPosition && gDollyDirection > 0) {
            gDollyPosition = maxPosition;
            gDollyDirection = -1;
        }
        
        updateDollyCartPosition();
    }
    
    // Update dolly camera model visibility and position
    if (gDollyCameraMesh) {
        // Hide camera model when in dolly camera view (you don't see your own camera)
        gDollyCameraMesh.visible = cameraMenuVisible && gCameraMode !== 6;
        
        // Update camera model position and orientation continuously
        updateDollyCameraModel();
    }
    
    // Update camera mount rod visibility
    if (gDollyCameraMountRod) {
        gDollyCameraMountRod.visible = cameraMenuVisible && gCameraMode !== 6;
    }
    
    // Update drag highlight box for toggle-dragging objects
    if (gCurrentlyDraggingObject !== null) {
        // Determine which object is being dragged and get its reference
        var targetObject = null;
        if (gCurrentlyDraggingObject === 'duck' && gDuck) targetObject = gDuck;
        else if (gCurrentlyDraggingObject === 'mammoth' && gMammoth) targetObject = gMammoth;
        else if (gCurrentlyDraggingObject === 'teapot' && gTeapot) targetObject = gTeapot;
        else if (gCurrentlyDraggingObject === 'chair' && gChair) targetObject = gChair;
        else if (gCurrentlyDraggingObject === 'sofa' && gSofa) targetObject = gSofa;
        else if (gCurrentlyDraggingObject === 'stool' && gStool) targetObject = gStool;
        else if (gCurrentlyDraggingObject === 'bird' && gBird) targetObject = gBird;
        else if (gCurrentlyDraggingObject === 'koonsDog' && gKoonsDog) targetObject = gKoonsDog;
        else if (gCurrentlyDraggingObject === 'globeLamp' && gGlobeLamp) targetObject = gGlobeLamp;
        
        if (targetObject) {
            // Create box helper if it doesn't exist or if it's for a different object
            if (!gDragHighlightBox || gDragHighlightBox.object !== targetObject) {
                // Remove old box helper if it exists
                if (gDragHighlightBox) {
                    gThreeScene.remove(gDragHighlightBox);
                    gDragHighlightBox.dispose();
                }
                
                // Create new box helper with transparent cyan color
                gDragHighlightBox = new THREE.BoxHelper(targetObject, 0x00ffff);
                gDragHighlightBox.material.transparent = true;
                gDragHighlightBox.material.opacity = 0.3;
                gDragHighlightBox.material.linewidth = 2;
                gThreeScene.add(gDragHighlightBox);
            }
            
            // Update box to match object's current transform
            gDragHighlightBox.update();
            
            // Update spotlight to follow object
            updateDragSpotlight(targetObject.position);
        }
    } else {
        // No object is being dragged - remove box helper if it exists
        if (gDragHighlightBox) {
            gThreeScene.remove(gDragHighlightBox);
            gDragHighlightBox = null;
        }
    }
    
    // Render scene with stereo effect if enabled
    if (gStereoEnabled && gAnaglyphEffect) {
        gAnaglyphEffect.render(gThreeScene, gCamera);
    } else {
        gRenderer.render(gThreeScene, gCamera);
    }
    
    // Draw menus on overlay canvas
    gOverlayCtx.clearRect(0, 0, gOverlayCanvas.width, gOverlayCanvas.height);
    // drawButtons(); // Removed - functionality moved to main menu
    drawMainMenu();
    drawSimMenu();
    drawStylingMenu();
    drawInstructionsMenu();
    drawColorMenu();
    drawLightingMenu();
    drawCameraMenu();
    
    // Draw fade-in effect (black overlay that fades out)
    if (gFadeInTime < gFadeInDuration) {
        const fadeProgress = gFadeInTime / gFadeInDuration; // 0 to 1
        const opacity = 1 - fadeProgress; // 1 to 0
        gOverlayCtx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
        gOverlayCtx.fillRect(0, 0, gOverlayCanvas.width, gOverlayCanvas.height);
    }
    
    // Update camera velocity for Doppler effect (based on position change)
    if (deltaT > 0) {
        gCameraVelocity.x = (gCamera.position.x - gCameraPrevPosition.x) / deltaT;
        gCameraVelocity.y = (gCamera.position.y - gCameraPrevPosition.y) / deltaT;
        gCameraVelocity.z = (gCamera.position.z - gCameraPrevPosition.z) / deltaT;
    }
    gCameraPrevPosition.copy(gCamera.position);
    
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