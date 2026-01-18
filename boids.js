/*
B0IDS 1.49 :: emergent flocking behavior ::
copyright 2026 :: Frank Maiello :: maiello.frank@gmail.com ::

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. In no event shall the author or copyright holders be liable for any claim, damages, or other liability, whether in an action of contract, tort or otherwise, arising from, our of or in, connection with the software or the use of other dealings in the Software.
*/

// Setup canvas and handle window resizing  ------------------
canvas = document.getElementById("myCanvas");
c = canvas.getContext("2d");
width = window.innerWidth;
height = window.innerHeight;
canvas.width = width;
canvas.height = height;

simMinWidth = 2.0;
cScale = Math.min(canvas.width, canvas.height) / simMinWidth;
simWidth = canvas.width / cScale;
simHeight = canvas.height / cScale;

// Load images
doPlane = true;
kittyPlaneImage = new Image();
kittyPlaneImage.src = 'kitty_plane.png';
kittyPlaneReverseImage = new Image();
kittyPlaneReverseImage.src = 'kitty_plane_reverse.png';

kittyLampImage = new Image();
kittyLampImage.src = 'kitty_lamp.png';

// Mouse tracking
let mouseX = simWidth / 2;
let mouseY = simHeight / 2;
let draggedCloud = null;
let lastClickTime = 0;
let lastClickedCloud = null;

// Spacebar tracking for balloon spawning
let spacebarHeld = false;
let spacebarBalloonTimer = 0;
let spacebarBalloonInterval = 0.1; // 10 per second = 0.1 seconds per balloon

// Main menu visibility and state
let mainMenuVisible = false;
let mainMenuOpacity = 0;
let mainMenuXOffset = -1.0; // Horizontal animation offset (0 = fully shown, negative = hidden to the left)
let mainMenuAnimSpeed = 5.0; // Animation speed for sliding
let mainMenuFadeSpeed = 3.0; // Fade speed (0 to 1 per second)
let arrowBounceTimer = 0;
let doArrow = true;
let arrowStartTime = 0;
let justStarted = true;

// Store submenu visibility states (saved when main menu is closed)
let savedSimMenuVisible = true;
let savedPaintMenuVisible = true;
let savedSkyMenuVisible = true;
let savedDrawMenuVisible = true;

// Menu visibility state
let menuVisible = false;
let menuOpacity = 0;
let menuFadeSpeed = 3.0; // Fade speed (0 to 1 per second)

// Sky menu visibility
let skyMenuVisible = false;
let skyMenuOpacity = 0;

// Draw menu visibility
let drawMenuVisible = false;
let drawMenuOpacity = 0;

// Menu z-order (higher number = on top)
let menuZOrder = 3;
let colorMenuZOrder = 2;
let skyMenuZOrder = 0;
let drawMenuZOrder = 1;

// Menu position
let menuX = 0.1; // World coordinates
let menuY = simHeight - 0.4; // World coordinates

// Sky menu position
let skyMenuX = 0.6; // World coordinates
let skyMenuY = simHeight - 0.3; // World coordinates

// Draw menu position
let drawMenuX = 1.5; // World coordinates
let drawMenuY = simHeight - 0.5; // World coordinates

// Menu knob dragging state
let draggedKnob = null; // Index of the knob being dragged
let draggedSkyKnob = null; // Index of the sky knob being dragged
let draggedDrawKnob = null; // Index of knob being dragged in draw menu
let dragStartMouseX = 0;
let dragStartMouseY = 0;
let dragStartValue = 0;

// Menu dragging state
let isDraggingMenu = false;
let menuDragStartX = 0;
let menuDragStartY = 0;
let menuStartX = 0;
let menuStartY = 0;

// Boid type selection (0=arrows, 1=circles, 2=airfoils, 3=birds, 4=none)
let selectedBoidType = 1; // Default to Arrows
let previousBoidType = 1; // Remembers last type before None was selected
let boidTypeScrollOffset = 0; // Scroll position for boid type list
let boidTypeLabels = ['Triangles', 'Arrows', 'Birds', 'Circles', 'Ellipses', 'Squares', 'Teardrops', 'Bubbles'];
let tailColorMode = 0; // 0 = none, 1 = black, 2 = white, 3 = selected hue, 4 = hue2

// Boid rendering toggles
let boidTraceMode = 2; // 0=none, 1=dark trace, 2=colored trace, 3=white trace
let boidFillEnabled = true; // Controls fill operations

// Color menu visibility state
let colorMenuVisible = false;
let colorMenuOpacity = 0;
let colorMenuAnimatedHeight = 0; // Animated height for smooth transitions

// Color menu position
let colorMenuX = 1.6; // World coordinates
let colorMenuY = simHeight - 0.77; // World coordinates

// Color menu dragging state
let isDraggingColorMenu = false;
let colorMenuDragStartX = 0;
let colorMenuDragStartY = 0;
let colorMenuStartX = 0;
let colorMenuStartY = 0;

// Sky menu dragging state
let isDraggingSkyMenu = false;
let skyMenuDragStartX = 0;
let skyMenuDragStartY = 0;
let skyMenuStartX = 0;
let skyMenuStartY = 0;

// Draw menu dragging state
let isDraggingDrawMenu = false;
let drawMenuDragStartX = 0;
let drawMenuDragStartY = 0;
let drawMenuStartX = 0;
let drawMenuStartY = 0;

// Spraypaint tool state
let spraypaintActive = false;
let spraypaintRadius = 0.15; // Radius in world units
let selectedHue = 0;
let selectedSaturation = 100;
let selectedLightness = 50;
let isSpraying = false;
let sprayParticles = []; // Array to hold spray effect particles
let segregationMode = 0; // 0 = normal, 1 = segregate (all rules only apply to same hue), 2 = segregate2 (rule 1 all, rules 2&3 same hue)
let colorByDirection = false; // When true, boid hue is based on heading direction

// Tutorial message tracking
let firstUserCloudCreated = false;

// Dye tool state
let dyeActive = false;

// Sky hand mode state
let skyHandActive = false;
let isDraggingSky = false;
let skyDragStartX = 0;
let skyDragStartY = 0;
let skyCameraPitchStart = 0;
let skyCameraYawStart = 0;

// Store menu states before camera activation
let menuVisibleBeforeCamera = false;
let colorMenuVisibleBeforeCamera = false;
let skyMenuVisibleBeforeCamera = false;

// Store menu states before paint tool activation
let menuVisibleBeforePaint = false;
let skyMenuVisibleBeforePaint = false;
let drawMenuVisibleBeforePaint = false;
let colorMenuVisibleBeforePaint = false;

// Sky object visibility toggles
let showClouds = true;
let showPlane = true;
let showBalloons = true;
let showHotAirBalloon = true;

// Auto elevation state
let autoElevation = true;
let autoElevationPhase = 0;
let autoElevationRate = 0.05; // Speed of oscillation
let autoElevationInitial = 0; // Initial elevation when auto mode was enabled

// Offscreen canvas for color wheel
let colorWheelCanvas = null;
let colorWheelContext = null;

// Array to store painted color dots on color wheel (hue and saturation pairs)
let paintedColorDots = [];

// Color selection dragging
let isDraggingColorWheel = false;
let isDraggingLightness = false;
let isDraggingHueSensitivity = false;
let isDraggingHueTicker = false;
let isDraggingSpraySlider = false;
let hueSensitivityDragStart = 0;
let hueTickerDragStart = 0;

// Set magnet state
let magnetActive = false;
let isDraggingMagnet = false;
let magnetForce = 5.0;
let magnetEffectRadius = 0.5;
let poleGlowTicker = 0;

// Trace Path state
let tracePathActive = false;
let isDrawingPath = false;
let pathExists = false;
let pathPoints = [];
let pathLength = 0; // Total length of the path in world units
let pathCumulativeDistances = []; // Cumulative distance at each point for arc-length parameterization
let magnetPathProgress = 0;
let magnetPathSpeed = 0.3; // World units per second
let savedMenuStatesForPath = {};

// Cloud rainbow states
let cloudRainbowActive = false;
let rainbowArcProgress = 0;
let rainbowFullyFormedTime = 0; // Time when rainbow reached 100%
let rainbowOpacity = 1.0; // Opacity for fade out
let Hearts = [];
let rainbowHeartSpawnRate = 0.3; // Probability of spawning hearts each frame (0 to 1)

// Create offscreen canvas for color wheel
function createColorWheel() {
    const size = 200; // Size in pixels
    colorWheelCanvas = document.createElement('canvas');
    colorWheelCanvas.width = size;
    colorWheelCanvas.height = size;
    colorWheelContext = colorWheelCanvas.getContext('2d');
    
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2;
    
    // Draw color wheel using wedges to avoid moiré artifacts
    const numWedges = 360;
    const wedgeAngle = (2 * Math.PI) / numWedges;
    
    for (let i = 0; i < numWedges; i++) {
        const hue = (i / numWedges) * 360;
        const startAngle = i * wedgeAngle;
        const endAngle = (i + 1) * wedgeAngle;
        
        // Create radial gradient for saturation
        const gradient = colorWheelContext.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, radius
        );
        gradient.addColorStop(0, `hsl(${hue}, 0%, 50%)`);
        gradient.addColorStop(1, `hsl(${hue}, 100%, 50%)`);
        
        // Draw wedge
        colorWheelContext.fillStyle = gradient;
        colorWheelContext.beginPath();
        colorWheelContext.moveTo(centerX, centerY);
        colorWheelContext.arc(centerX, centerY, radius, startAngle, endAngle);
        colorWheelContext.closePath();
        colorWheelContext.fill();
    }
}
createColorWheel();

// Mouse down event handler ------------------------------
mousedownHandler = function(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) / cScale;
    mouseY = (canvas.height - (e.clientY - rect.top)) / cScale;
    
    // Check for dye tool click - paint closest boid within radius
    if (dyeActive) {
        let closestBoid = null;
        let closestDist = spraypaintRadius;
        
        // Find closest boid to cursor within radius
        for (let i = 0; i < Boids.length; i++) {
            const boid = Boids[i];
            const dx = boid.pos.x - mouseX;
            const dy = boid.pos.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < closestDist) {
                closestDist = dist;
                closestBoid = boid;
            }
        }
        
        // Paint the closest boid if found
        if (closestBoid) {
            closestBoid.hue = selectedHue;
            closestBoid.saturation = selectedSaturation;
            closestBoid.lightness = selectedLightness;
            closestBoid.manualHue = true;
            closestBoid.manualSaturation = true;
            closestBoid.manualLightness = true;
            closestBoid.dyedBoid = true; // Mark as dyed for color transfer
            
            // Deactivate dye tool after painting (menus stay hidden)
            dyeActive = false;
            updateMouseListeners();
        }
        return;
    }
    
    // Check if wand was clicked
    if (isMouseNearWand(mouseX, mouseY, wandPosX * simWidth, wandPosY * simHeight, wandAngle, wandSize)) {
        isDraggingWand = true;
        wandDragOffsetX = mouseX - wandPosX * simWidth;
        wandDragOffsetY = mouseY - wandPosY * simHeight;
        attachMouseMove();
        return;
    }
    
    // Check if ellipsis was clicked (in world coordinates)
    const ellipsisWorldX = 0.05;
    const ellipsisWorldY = simHeight - 0.05;
    const ellipsisRadius = 0.04;
    const dx = mouseX - ellipsisWorldX;
    const dy = mouseY - ellipsisWorldY;
    if (dx * dx + dy * dy < ellipsisRadius * ellipsisRadius) {
        if (mainMenuVisible) {
            // Closing main menu - save current submenu visibility states and hide them
            savedSimMenuVisible = menuVisible;
            savedPaintMenuVisible = colorMenuVisible;
            savedSkyMenuVisible = skyMenuVisible;
            savedDrawMenuVisible = drawMenuVisible;
            menuVisible = false;
            colorMenuVisible = false;
            skyMenuVisible = false;
            drawMenuVisible = false;
        } else {
            // Opening main menu - restore saved submenu visibility states
            menuVisible = savedSimMenuVisible;
            colorMenuVisible = savedPaintMenuVisible;
            skyMenuVisible = savedSkyMenuVisible;
            drawMenuVisible = savedDrawMenuVisible;
        }
        mainMenuVisible = !mainMenuVisible;
        return;
    }
    
    // Check if main menu was clicked
    if (mainMenuVisible && mainMenuOpacity > 0.5) {
        const ellipsisX = ellipsisWorldX * cScale;
        const ellipsisY = canvas.height - ellipsisWorldY * cScale;
        const itemHeight = 0.12 * cScale;
        const itemWidth = 0.24 * cScale;
        const padding = 0.02 * cScale;
        const menuHeight = itemHeight + (padding * 2);
        const menuWidth = (itemWidth * 4) + (padding * 5);
        const menuBaseX = ellipsisX + 0.08 * cScale;
        const menuX = menuBaseX + mainMenuXOffset * cScale;
        const menuY = ellipsisY - 0.01 * cScale;
        
        const clickCanvasX = mouseX * cScale;
        const clickCanvasY = canvas.height - mouseY * cScale;
        
        // Check if click is within main menu bounds
        if (clickCanvasX >= menuX && clickCanvasX <= menuX + menuWidth &&
            clickCanvasY >= menuY && clickCanvasY <= menuY + menuHeight) {
            
            // Determine which item was clicked (horizontal layout)
            const relativeX = clickCanvasX - menuX - padding;
            const itemIndex = Math.floor(relativeX / (itemWidth + padding));
            
            if (itemIndex >= 0 && itemIndex < 4) {
                // Toggle the corresponding menu
                if (itemIndex === 0) {
                    menuVisible = !menuVisible;
                    if (menuVisible) {
                        const maxZ = Math.max(menuZOrder, colorMenuZOrder, skyMenuZOrder, drawMenuZOrder);
                        menuZOrder = maxZ + 1;
                    }
                } else if (itemIndex === 1) {
                    skyMenuVisible = !skyMenuVisible;
                    if (skyMenuVisible) {
                        const maxZ = Math.max(menuZOrder, colorMenuZOrder, skyMenuZOrder, drawMenuZOrder);
                        skyMenuZOrder = maxZ + 1;
                    }
                } else if (itemIndex === 2) {
                    colorMenuVisible = !colorMenuVisible;
                    if (colorMenuVisible) {
                        const maxZ = Math.max(menuZOrder, colorMenuZOrder, skyMenuZOrder, drawMenuZOrder);
                        colorMenuZOrder = maxZ + 1;
                    }
                } else if (itemIndex === 3) {
                    drawMenuVisible = !drawMenuVisible;
                    if (drawMenuVisible) {
                        const maxZ = Math.max(menuZOrder, colorMenuZOrder, skyMenuZOrder, drawMenuZOrder);
                        drawMenuZOrder = maxZ + 1;
                    }
                }
            }
            return;
        }
    }
    
    // Check if magnet was clicked (for dragging)
    if (magnetActive && Magnet.length > 0) {
        const magnetCanvasX = Magnet[0].x * cScale;
        const magnetCanvasY = canvas.height - Magnet[0].y * cScale;
        const clickCanvasX = mouseX * cScale;
        const clickCanvasY = canvas.height - mouseY * cScale;
        const magnetRadius = Magnet[0].radius * cScale;
        const mdx = clickCanvasX - magnetCanvasX;
        const mdy = clickCanvasY - magnetCanvasY;
        
        if (mdx * mdx + mdy * mdy < magnetRadius * magnetRadius) {
            isDraggingMagnet = true;
            attachMouseMove();
            return;
        }
    }
    
    // Check menus in reverse z-order (highest priority first)
    const menuChecks = [
        {check: checkDrawMenuClick, z: drawMenuZOrder, name: 'draw'},
        {check: checkSkyMenuClick, z: skyMenuZOrder, name: 'sky'},
        {check: checkColorMenuClick, z: colorMenuZOrder, name: 'color'},
        {check: checkSimMenuClick, z: menuZOrder, name: 'sim'}
    ];
    menuChecks.sort((a, b) => b.z - a.z); // Sort highest to lowest
    
    for (let menuCheck of menuChecks) {
        if (menuCheck.check()) {
            // Bring this menu to front
            const maxZ = Math.max(menuZOrder, colorMenuZOrder, skyMenuZOrder, drawMenuZOrder);
            if (menuCheck.name === 'sim') menuZOrder = maxZ + 1;
            else if (menuCheck.name === 'color') colorMenuZOrder = maxZ + 1;
            else if (menuCheck.name === 'sky') skyMenuZOrder = maxZ + 1;
            else if (menuCheck.name === 'draw') drawMenuZOrder = maxZ + 1;
            return; // Stop checking other menus
        }
    }
    
    // Helper function for color menu clicks
    function checkColorMenuClick() {
        if (!colorMenuVisible || colorMenuOpacity <= 0.5) return false;
        const knobRadius = 0.1 * cScale;
        const colorWheelRadius = knobRadius * 1.7;
        const sliderWidth = knobRadius * 0.6;
        const sliderHeight = colorWheelRadius * 2;
        const spacing = knobRadius * 0.5;
        const buttonRowHeight = spacing * 2;
        const knobRowHeight = knobRadius * 3;
        const colorMenuWidth = colorWheelRadius * 2 + spacing + sliderWidth + spacing + knobRadius * 2;
        // Use animated height for smooth transitions
        const colorMenuHeight = colorMenuAnimatedHeight;
        const colorPadding = 0.8 * knobRadius;
        const colorMenuOriginX = colorMenuX * cScale;
        const colorMenuOriginY = canvas.height - colorMenuY * cScale;
        
        const clickCanvasX = mouseX * cScale;
        const clickCanvasY = canvas.height - mouseY * cScale;
        
        // Check close icon
        const closeIconRadius = knobRadius * 0.25;
        const colorCloseIconX = colorMenuOriginX - colorPadding + closeIconRadius + 0.2 * knobRadius;
        const colorCloseIconY = colorMenuOriginY - colorPadding + closeIconRadius + 0.2 * knobRadius;
        const ccdx = clickCanvasX - colorCloseIconX;
        const ccdy = clickCanvasY - colorCloseIconY;
        
        if (ccdx * ccdx + ccdy * ccdy < closeIconRadius * closeIconRadius) {
            colorMenuVisible = false;
            spraypaintActive = false; // Turn off spray tool when menu closes
            dyeActive = false; // Turn off dye tool when menu closes
            updateMouseListeners();
            return true;
        }
        
        // Check color wheel click
        const wheelCenterX = colorMenuOriginX + colorWheelRadius;
        const wheelCenterY = colorMenuOriginY + colorWheelRadius;
        const wheelDx = clickCanvasX - wheelCenterX;
        const wheelDy = clickCanvasY - wheelCenterY;
        const wheelDist = Math.sqrt(wheelDx * wheelDx + wheelDy * wheelDy);
        
        if (wheelDist <= colorWheelRadius) {
            isDraggingColorWheel = true;
            attachMouseMove();
            // Calculate hue and saturation
            selectedHue = (Math.atan2(wheelDy, wheelDx) * 180 / Math.PI + 360) % 360;
            selectedSaturation = Math.min(100, (wheelDist / colorWheelRadius) * 100);
            return true;
        }
        
        // Check lightness slider click
        const sliderX = colorMenuOriginX + colorWheelRadius * 2 + spacing;
        const sliderY = colorMenuOriginY;
        
        if (clickCanvasX >= sliderX && clickCanvasX <= sliderX + sliderWidth &&
            clickCanvasY >= sliderY && clickCanvasY <= sliderY + sliderHeight) {
            isDraggingLightness = true;
            attachMouseMove();
            // Calculate lightness
            const relativeY = clickCanvasY - sliderY;
            selectedLightness = Math.max(0, Math.min(100, 100 - (relativeY / sliderHeight) * 100));
            return true;
        }
        
        // Check spraypaint icon click
        const spraypaintX = sliderX + sliderWidth + spacing + knobRadius * 0.85;
        const spraypaintY = colorMenuOriginY + colorWheelRadius;
        const canRadius = knobRadius * 1.2; // 2x larger
        
        if (clickCanvasX >= spraypaintX - canRadius * 0.45 && clickCanvasX <= spraypaintX + canRadius * 0.45 &&
            clickCanvasY >= spraypaintY - canRadius * 0.95 && clickCanvasY <= spraypaintY + canRadius * 0.65) {
            spraypaintActive = !spraypaintActive;
            if (spraypaintActive) {
                skyHandActive = false; // Turn off camera adjust mode when spraypaint is activated
                // Store current menu states
                menuVisibleBeforePaint = menuVisible;
                skyMenuVisibleBeforePaint = skyMenuVisible;
                // Hide other menus
                menuVisible = false;
                skyMenuVisible = false;
            } else {
                // Restore menu states when paint tool is deactivated
                menuVisible = menuVisibleBeforePaint;
                skyMenuVisible = skyMenuVisibleBeforePaint;
            }
            updateMouseListeners();
            return true;
        }
        
        // Check preset color buttons
        const buttonRadius = knobRadius * 0.35;
        const buttonY = colorMenuOriginY + colorWheelRadius * 2 + spacing * 1.5;
        const buttonSpacing = knobRadius * 1.2;
        // Position fourth button centered below lightness slider
        const lightnessSliderCenterX = colorMenuOriginX + colorWheelRadius * 2 + spacing + sliderWidth / 2;
        const buttonStartX = lightnessSliderCenterX - buttonSpacing * 3;
        
        // Black button
        const blackDx = clickCanvasX - buttonStartX;
        const blackDy = clickCanvasY - buttonY;
        if (blackDx * blackDx + blackDy * blackDy < buttonRadius * buttonRadius) {
            colorByDirection = false;
            for (let i = 0; i < Boids.length; i++) {
                Boids[i].hue = 0;
                Boids[i].saturation = 0;
                Boids[i].lightness = 0;
                Boids[i].manualHue = true;
                Boids[i].manualSaturation = true;
                Boids[i].manualLightness = true;
                Boids[i].dyedBoid = false;
            }
            paintedColorDots = []; // Reset painted color indicators
            return true;
        }
        
        // Black and white button
        // Bipartite: first half black, second half white
        const grayDx = clickCanvasX - (buttonStartX + buttonSpacing);
        const grayDy = clickCanvasY - buttonY;
        if (grayDx * grayDx + grayDy * grayDy < buttonRadius * buttonRadius) {
            colorByDirection = false;
            for (let i = 0; i < Boids.length; i++) {
                var boido = Boids[i];
                if (boido.pos.x < 0.5 * simWidth) {
                    boido.hue = 0;
                    boido.saturation = 0;
                    boido.lightness = 0;
                } else {
                    boido.hue = 180;
                    boido.saturation = 0;
                    boido.lightness = 100;
                }
                boido.manualHue = true;
                boido.manualSaturation = true;
                boido.manualLightness = true;
                boido.dyedBoid = false;
            }
            paintedColorDots = []; // Reset painted color indicators
            return true;
        }
        
        // White button
        const whiteDx = clickCanvasX - (buttonStartX + buttonSpacing * 2);
        const whiteDy = clickCanvasY - buttonY;
        if (whiteDx * whiteDx + whiteDy * whiteDy < buttonRadius * buttonRadius) {
            for (let i = 0; i < Boids.length; i++) {
                Boids[i].hue = 180;
                Boids[i].saturation = 0;
                Boids[i].lightness = 100;
                Boids[i].manualHue = true;
                Boids[i].manualSaturation = true;
                Boids[i].manualLightness = true;
                Boids[i].dyedBoid = false;
            }
            paintedColorDots = []; // Reset painted color indicators
            return true;
        }
        
        // Selected color button - Paint all
        const selectedDx = clickCanvasX - (buttonStartX + buttonSpacing * 3);
        const selectedDy = clickCanvasY - buttonY;
        if (selectedDx * selectedDx + selectedDy * selectedDy < buttonRadius * buttonRadius) {
            for (let i = 0; i < Boids.length; i++) {
                Boids[i].hue = selectedHue;
                Boids[i].saturation = selectedSaturation;
                Boids[i].lightness = selectedLightness;
                Boids[i].manualHue = true;
                Boids[i].manualSaturation = true;
                Boids[i].manualLightness = true;
                Boids[i].dyedBoid = false;
            }
            // Reset painted color indicators and add the current selected color
            paintedColorDots = [{hue: selectedHue, saturation: selectedSaturation}];
            colorByDirection = false; // Disable color by direction mode
            return true;
        }
        
        // Dye button - Paint one boid at a time
        const dyeDx = clickCanvasX - (buttonStartX + buttonSpacing * 4.75);
        const dyeDy = clickCanvasY - (buttonY + buttonSpacing * 1.5);
        if (dyeDx * dyeDx + dyeDy * dyeDy < (buttonRadius * 1.5) * (buttonRadius * 1.5)) {
            dyeActive = !dyeActive;
            if (dyeActive) {
                skyHandActive = false;
                spraypaintActive = false;
                // Store current menu states
                menuVisibleBeforePaint = menuVisible;
                skyMenuVisibleBeforePaint = skyMenuVisible;
                drawMenuVisibleBeforePaint = drawMenuVisible;
                colorMenuVisibleBeforePaint = colorMenuVisible;
                // Hide all menus
                menuVisible = false;
                skyMenuVisible = false;
                drawMenuVisible = false;
                colorMenuVisible = false;
            } else {
                // Restore menu states when dye tool is deactivated
                menuVisible = menuVisibleBeforePaint;
                skyMenuVisible = skyMenuVisibleBeforePaint;
                drawMenuVisible = drawMenuVisibleBeforePaint;
                colorMenuVisible = colorMenuVisibleBeforePaint;
            }
            updateMouseListeners();
            // Ensure cursor position is updated immediately for smooth transition
            attachLightweightMouseMove();
            return true;
        }
        
        // Fifth button - Color by direction
        const directionDx = clickCanvasX - (buttonStartX + buttonSpacing * 4);
        const directionDy = clickCanvasY - buttonY;
        if (directionDx * directionDx + directionDy * directionDy < buttonRadius * buttonRadius) {
            colorByDirection = !colorByDirection; // Toggle mode
            if (colorByDirection) {
                // Clear manual color flags so direction-based coloring takes effect
                for (let i = 0; i < Boids.length; i++) {
                    Boids[i].manualHue = false;
                    Boids[i].manualSaturation = false;
                    Boids[i].manualLightness = false;
                    Boids[i].dyedBoid = false;
                }
            }
            paintedColorDots = []; // Reset painted color indicators
            return true;
        }
        
        // Sixth button - Velocity-sensitive color cycling
        const velocityDx = clickCanvasX - (buttonStartX + buttonSpacing * 5);
        const velocityDy = clickCanvasY - buttonY;
        if (velocityDx * velocityDx + velocityDy * velocityDy < buttonRadius * buttonRadius) {
            // Restore velocity-sensitive color cycling mode
            colorByDirection = false;
            for (let i = 0; i < Boids.length; i++) {
                Boids[i].manualHue = false;
                Boids[i].manualSaturation = false;
                Boids[i].manualLightness = false;
                Boids[i].hueCounter = 0; // Reset hue counter
                Boids[i].dyedBoid = false;
            }
            paintedColorDots = []; // Reset painted color indicators
            return true;
        }
        
        // Check segregation radio buttons (below knobs) only when spray tool is not active
        if (!spraypaintActive) {
            const hueTickerY = colorMenuOriginY + colorWheelRadius * 2 + spacing * 2 + knobRadius * 1.5 + knobRadius / 3;
            const segRadioRadius = knobRadius * 0.25;
            const segButtonY = hueTickerY + knobRadius * 2.6;
            const segButtonSpacing = knobRadius * 1.3;
            const segButtonStartX = colorMenuOriginX + colorWheelRadius - segButtonSpacing * 0.5;
            const segModeMap = [0, 2, 1]; // Map visual position to segregationMode value
            
            for (let i = 0; i < 3; i++) {
                const segBtnX = segButtonStartX + i * segButtonSpacing;
                const sdx = clickCanvasX - segBtnX;
                const sdy = clickCanvasY - segButtonY;
                if (sdx * sdx + sdy * sdy < segRadioRadius * segRadioRadius) {
                    segregationMode = segModeMap[i];
                    return true;
                }
            }
        }
        
        // Check spray radius slider
        const spraySliderWidth = canRadius * 1.4;
        const spraySliderX = spraypaintX - spraySliderWidth / 2;
        // Bottom aligned with lightness slider bottom
        const spraySliderBottomY = spraypaintY + colorWheelRadius * 0.9;
        const leftHeight = knobRadius * 0.25; // Shorter on left
        const rightHeight = knobRadius * 0.25 * 1.8; // Taller on right
        const spraySliderKnobRadius = knobRadius * 0.3;
        
        // Expand hit area to include the full trapezoid shape (use rightHeight which is taller)
        const sliderHitYTop = spraySliderBottomY - rightHeight - spraySliderKnobRadius;
        const sliderHitYBottom = spraySliderBottomY - spraySliderKnobRadius * 0.3; // Stop above the bottom edge
        const sliderHitXLeft = spraySliderX - spraySliderKnobRadius;
        const sliderHitXRight = spraySliderX + spraySliderWidth + spraySliderKnobRadius;
        
        if (clickCanvasX >= sliderHitXLeft && clickCanvasX <= sliderHitXRight &&
            clickCanvasY >= sliderHitYTop && clickCanvasY <= sliderHitYBottom) {
            // Calculate new value from click position
            const clickRatio = (clickCanvasX - spraySliderX) / spraySliderWidth;
            spraypaintRadius = 0.05 + clickRatio * (0.5 - 0.05);
            spraypaintRadius = Math.max(0.05, Math.min(0.5, spraypaintRadius)); // Clamp
            isDraggingSpraySlider = true;
            attachMouseMove();
            return true;
        }
        
        // Check hueSensitivity and hueTicker knobs only when spray tool is not active
        if (!spraypaintActive) {
            // Check hueSensitivity knob
            const lightnessSldrX = colorMenuOriginX + colorWheelRadius * 2 + spacing;
            const hueTickerTargetX = lightnessSldrX + sliderWidth / 2; // Center below lightness slider
            const hueTickerOriginalX = colorMenuOriginX + colorWheelRadius + knobRadius * 2.4;
            const knobOffset = hueTickerTargetX - hueTickerOriginalX; // Calculate offset
            const hueSensitivityKnobX = colorMenuOriginX + knobRadius + knobOffset; // Move by same offset
            const hueSensitivityKnobY = colorMenuOriginY + colorWheelRadius * 2 + buttonRowHeight + knobRadius * 1.5 + knobRadius / 3;
            const hsKnobDx = clickCanvasX - hueSensitivityKnobX;
            const hsKnobDy = clickCanvasY - hueSensitivityKnobY;
            if (hsKnobDx * hsKnobDx + hsKnobDy * hsKnobDy < knobRadius * knobRadius) {
                isDraggingHueSensitivity = true;
                attachMouseMove();
                dragStartMouseX = mouseX;
                dragStartMouseY = mouseY;
                hueSensitivityDragStart = boidProps.hueSensitivity;
                return true;
            }
            
            // Check hueTicker knob
            const hueTickerKnobX = hueTickerTargetX; // Centered below lightness slider
            const hueTickerKnobY = hueSensitivityKnobY;
            const htKnobDx = clickCanvasX - hueTickerKnobX;
            const htKnobDy = clickCanvasY - hueTickerKnobY;
            if (htKnobDx * htKnobDx + htKnobDy * htKnobDy < knobRadius * knobRadius) {
                isDraggingHueTicker = true;
                attachMouseMove();
                dragStartMouseX = mouseX;
                dragStartMouseY = mouseY;
                hueTickerDragStart = boidProps.hueTicker;
                return true;
            }
        }
        
        // Check if color menu background was clicked (for dragging entire menu)
        if (clickCanvasX >= colorMenuOriginX - colorPadding && clickCanvasX <= colorMenuOriginX + colorMenuWidth + colorPadding &&
            clickCanvasY >= colorMenuOriginY - colorPadding && clickCanvasY <= colorMenuOriginY + colorMenuHeight + colorPadding) {
            isDraggingColorMenu = true;
            attachMouseMove();
            colorMenuDragStartX = mouseX;
            colorMenuDragStartY = mouseY;
            colorMenuStartX = colorMenuX;
            colorMenuStartY = colorMenuY;
            return true;
        }
        
        return false; // Click was not on color menu
    }
    
    // Helper function for sim menu clicks
    function checkSimMenuClick() {
        if (!menuVisible || menuOpacity <= 0.5) return false;
        const knobRadius = 0.1 * cScale;
        const knobSpacing = knobRadius * 3;
        const menuTopMargin = 0.2 * knobRadius; // Must match the margin in drawSimMenu
        const menuWidth = knobSpacing * 3;
        const menuHeight = knobSpacing * 2 + knobRadius * 3.5;
        const padding = 1.7 * knobRadius;
        const menuUpperLeftX = menuX * cScale;
        const menuUpperLeftY = (canvas.height - menuY * cScale);
        const menuOriginX = menuUpperLeftX + knobSpacing;
        const menuOriginY = menuUpperLeftY + 0.5 * knobSpacing;
        
        // Declare click coordinates once for all checks
        const clickCanvasX = mouseX * cScale;
        const clickCanvasY = canvas.height - mouseY * cScale;
        
        // Check close icon (upper left corner - round button)
        const closeIconRadius = knobRadius * 0.25;
        const closeIconX = menuOriginX - padding + closeIconRadius + 0.2 * knobRadius;
        const closeIconY = menuOriginY - padding + closeIconRadius + 0.2 * knobRadius;
        const cdx = clickCanvasX - closeIconX;
        const cdy = clickCanvasY - closeIconY;
        
        if (cdx * cdx + cdy * cdy < closeIconRadius * closeIconRadius) {
            menuVisible = false;
            return true;
        }
        
        // Check individual knobs first
        for (let knob = 0; knob < 11; knob++) {
            if (knob === 4) continue; // Skip removed knob
            const layoutIndex = knob > 4 ? knob - 1 : knob;
            const row = Math.floor(layoutIndex / 4);
            const col = layoutIndex % 4;
            const knobCanvasX = menuOriginX + col * knobSpacing;
            const knobCanvasY = menuOriginY + row * knobSpacing + menuTopMargin;
            
            // Check in canvas space for accurate hit detection
            const kdx = clickCanvasX - knobCanvasX;
            const kdy = clickCanvasY - knobCanvasY;
            if (kdx * kdx + kdy * kdy < knobRadius * knobRadius) {
                draggedKnob = knob;
                attachMouseMove();
                dragStartMouseX = mouseX;
                dragStartMouseY = mouseY;
                
                // Store the starting value
                const menuItems = [
                    Boids.length, boidRadius * 100, boidProps.visualRange, boidProps.speedLimit,
                    null, boidProps.avoidFactor, boidProps.matchingFactor, boidProps.centeringFactor,
                    boidProps.turnFactor, boidProps.tailLength, boidProps.tailWidth];
                dragStartValue = menuItems[knob];
                return true;
            }
        }
        
        // Check tail color radio buttons (below tail length knob)
        const tailColorRadioRadius = knobRadius * 0.25;
        const tailKnobRow = 2;
        const tailButtonsCenterX = 0.5; // Center between columns 0 and 1
        
        for (let i = 0; i < 5; i++) {
            const buttonX = menuOriginX + tailButtonsCenterX * knobSpacing + (i - 2) * knobRadius * 1.0;
            const buttonY = menuOriginY + tailKnobRow * knobSpacing + knobRadius * 2.9 + menuTopMargin;
            const rdx = clickCanvasX - buttonX;
            const rdy = clickCanvasY - buttonY;
            
            if (rdx * rdx + rdy * rdy < tailColorRadioRadius * tailColorRadioRadius) {
                tailColorMode = i;
                return true;
            }
        }
        
        // Check radio buttons (vertically stacked in column 2)
        const radioButtonRadius = knobRadius * 0.25;
        const radioCol = 2;
        
        // Check reset button (round button at bottom of column 0)
        const resetButtonRadius = knobRadius * 0.4;
        const resetButtonX = menuOriginX + padding - 0.0 * knobRadius;
        const resetButtonY = menuOriginY + menuHeight + padding - 0.65 * knobRadius;
        const rdx = clickCanvasX - resetButtonX;
        const rdy = clickCanvasY - resetButtonY;
        
        if (rdx * rdx + rdy * rdy < resetButtonRadius * resetButtonRadius) {
            // Reset all parameters to defaults
            resetParameters();
            return true;
        }
        
        // Check trace/fill toggle buttons (4th column below confinement)
        const traceButtonRadius = knobRadius * 0.25;
        const traceCol = 3;
        const traceButtonY1 = menuOriginY + (2 * knobSpacing) - (0.6 * knobRadius) + menuTopMargin;
        const traceButtonY2 = traceButtonY1 + 0.8 * knobRadius;
        const traceButtonY3 = traceButtonY2 + 0.8 * knobRadius;
        const traceButtonY4 = traceButtonY3 + 0.8 * knobRadius;
        const fillButtonY1 = traceButtonY4 + 1.0 * knobRadius;
        const fillButtonY2 = fillButtonY1 + 0.8 * knobRadius;
        const traceButtonX = menuOriginX + traceCol * knobSpacing - 0.5 * knobRadius;
        
        // Black button
        let tdx = clickCanvasX - traceButtonX;
        let tdy = clickCanvasY - traceButtonY1;
        if (tdx * tdx + tdy * tdy < traceButtonRadius * traceButtonRadius) {
            boidTraceMode = 1;
            return true;
        }
        
        // White button
        tdx = clickCanvasX - traceButtonX;
        tdy = clickCanvasY - traceButtonY2;
        if (tdx * tdx + tdy * tdy < traceButtonRadius * traceButtonRadius) {
            boidTraceMode = 3;
            return true;
        }
        
        // Color button
        tdx = clickCanvasX - traceButtonX;
        tdy = clickCanvasY - traceButtonY3;
        if (tdx * tdx + tdy * tdy < traceButtonRadius * traceButtonRadius) {
            boidTraceMode = 2;
            return true;
        }
        
        // Trace None button
        tdx = clickCanvasX - traceButtonX;
        tdy = clickCanvasY - traceButtonY4;
        if (tdx * tdx + tdy * tdy < traceButtonRadius * traceButtonRadius) {
            boidTraceMode = 0;
            return true;
        }
        
        // Fill button
        tdx = clickCanvasX - traceButtonX;
        tdy = clickCanvasY - fillButtonY1;
        if (tdx * tdx + tdy * tdy < traceButtonRadius * traceButtonRadius) {
            boidFillEnabled = true;
            return true;
        }
        
        // Fill None button
        tdx = clickCanvasX - traceButtonX;
        tdy = clickCanvasY - fillButtonY2;
        if (tdx * tdx + tdy * tdy < traceButtonRadius * traceButtonRadius) {
            boidFillEnabled = false;
            return true;
        }
        
        // Check scrollable boid type list click
        const listCol = 2;
        const listX = menuOriginX + listCol * knobSpacing - 1.15 * knobRadius;
        const listTitleY = menuOriginY + (2 * knobSpacing) - (2.0 * knobRadius) + menuTopMargin;
        const listY = listTitleY + knobRadius * 0.96;
        const listWidth = knobRadius * 2.3;
        const listHeight = knobRadius * 5.04;
        const itemHeight = knobRadius * 0.72;
        
        if (clickCanvasX >= listX && clickCanvasX <= listX + listWidth &&
            clickCanvasY >= listY && clickCanvasY <= listY + listHeight) {
            // Calculate which item was clicked
            const relativeY = clickCanvasY - listY + boidTypeScrollOffset;
            const clickedIndex = Math.floor(relativeY / itemHeight);
            
            if (clickedIndex >= 0 && clickedIndex < boidTypeLabels.length) {
                selectedBoidType = clickedIndex;
                // Call the appropriate function
                if (clickedIndex === 0) {
                    doTriangleBoids();
                } else if (clickedIndex === 1) {
                    doArrowBoids();
                } else if (clickedIndex === 2) {
                    doFlappyBoids();
                } else if (clickedIndex === 3) {
                    doCircleBoids();
                } else if (clickedIndex === 4) {
                    doEllipseBoids();
                } else if (clickedIndex === 5) {
                    doSquareBoids();
                } else if (clickedIndex === 6) {
                    doAirfoilBoids();
                } else if (clickedIndex === 7) {
                    doGlowBoids();
                }
                return true;
            }
        }

        
        // Check if menu background was clicked (for dragging entire menu)
        const clickX = mouseX * cScale;
        const clickY = canvas.height - mouseY * cScale;
        
        if (clickX >= menuOriginX - padding && clickX <= menuOriginX + menuWidth + padding &&
            clickY >= menuOriginY - padding && clickY <= menuOriginY + menuHeight + padding) {
            isDraggingMenu = true;
            attachMouseMove();
            menuDragStartX = mouseX;
            menuDragStartY = mouseY;
            menuStartX = menuX;
            menuStartY = menuY;
            return true;
        }
        
        return false; // Click was not on sim menu
    }
    
    // Helper function for draw menu clicks
    function checkDrawMenuClick() {
        if (!drawMenuVisible || drawMenuOpacity <= 0.5) return false;
        
        const knobRadius = 0.1 * cScale;
        const knobSpacing = knobRadius * 3;
        const menuWidth = knobSpacing * 2;
        const menuHeight = knobSpacing * 1.5;
        const padding = 1.7 * knobRadius;
        const menuUpperLeftX = drawMenuX * cScale;
        const menuUpperLeftY = canvas.height - drawMenuY * cScale;
        
        // Menu is translated by (knobSpacing, 0.5 * knobSpacing)
        const menuOriginX = menuUpperLeftX + knobSpacing;
        const menuOriginY = menuUpperLeftY + 0.5 * knobSpacing;
        
        const clickCanvasX = mouseX * cScale;
        const clickCanvasY = canvas.height - mouseY * cScale;
        
        // Check close icon (in translated coordinates)
        const closeIconRadius = knobRadius * 0.25;
        const closeIconX = menuOriginX - padding + closeIconRadius + 0.2 * knobRadius;
        const closeIconY = menuOriginY - padding + closeIconRadius + 0.2 * knobRadius;
        const cdx = clickCanvasX - closeIconX;
        const cdy = clickCanvasY - closeIconY;
        
        if (cdx * cdx + cdy * cdy < closeIconRadius * closeIconRadius) {
            drawMenuVisible = false;
            return true;
        }
        
        // Grid layout for buttons
        const menuTopMargin = 0.2 * knobRadius;
        const cols = 3;
        const cellWidth = knobSpacing;
        const cellHeight = knobSpacing;
        const gridStartY = menuTopMargin;
        
        // Check magnet toggle button (row 0, col 0)
        // Magnet visual size: 0.06 * cScale radius, extends vertically from -1.5 to +0.1 * iconRadius
        const magnetIconRadius = 0.06 * cScale;
        const magnetClickRadius = magnetIconRadius * 1.6; // Match visual extent
        const magnetCol = 0;
        const magnetRow = 0;
        const magnetButtonX = menuOriginX + magnetCol * cellWidth;
        const magnetButtonY = menuOriginY + gridStartY + magnetRow * cellHeight;
        const mdx = clickCanvasX - magnetButtonX;
        const mdy = clickCanvasY - magnetButtonY;
        
        if (mdx * mdx + mdy * mdy < magnetClickRadius * magnetClickRadius) {
            magnetActive = !magnetActive;
            return true;
        }
        
        // Check Pull Strength knob (row 0, col 1)
        const pullKnobCol = 1;
        const pullKnobRow = 0;
        const pullKnobX = menuOriginX + pullKnobCol * cellWidth;
        const pullKnobY = menuOriginY + gridStartY + pullKnobRow * cellHeight;
        const pkdx = clickCanvasX - pullKnobX;
        const pkdy = clickCanvasY - pullKnobY;
        
        if (pkdx * pkdx + pkdy * pkdy < knobRadius * knobRadius) {
            draggedDrawKnob = 0; // Index 0 = Pull Strength
            attachMouseMove();
            dragStartMouseX = mouseX;
            dragStartMouseY = mouseY;
            dragStartValue = magnetForce;
            return true;
        }
        
        // Check Effect Radius knob (row 0, col 2)
        const radiusKnobCol = 2;
        const radiusKnobRow = 0;
        const radiusKnobX = menuOriginX + radiusKnobCol * cellWidth;
        const radiusKnobY = menuOriginY + gridStartY + radiusKnobRow * cellHeight;
        const rkdx = clickCanvasX - radiusKnobX;
        const rkdy = clickCanvasY - radiusKnobY;
        
        if (rkdx * rkdx + rkdy * rkdy < knobRadius * knobRadius) {
            draggedDrawKnob = 1; // Index 1 = Effect Radius
            attachMouseMove();
            dragStartMouseX = mouseX;
            dragStartMouseY = mouseY;
            dragStartValue = magnetEffectRadius;
            return true;
        }
        
        // Check Trace Path button (row 1, col 0)
        const traceCol = 0;
        const traceRow = 1;
        const traceIconSize = knobRadius * 0.8;
        const traceButtonX = menuOriginX + traceCol * cellWidth;
        const traceButtonY = menuOriginY + gridStartY + traceRow * cellHeight;
        const traceClickRadius = traceIconSize * 1.2;
        const tdx = clickCanvasX - traceButtonX;
        const tdy = clickCanvasY - traceButtonY;
        
        if (tdx * tdx + tdy * tdy < traceClickRadius * traceClickRadius) {
            // Activate trace path mode (menus will fade away)
            tracePathActive = true;
            isDrawingPath = false; // Don't start drawing yet
            pathPoints = [];
            
            // Update mouse listeners for cursor tracking
            updateMouseListeners();
            
            // Save current menu states and hide them
            savedMenuStatesForPath = {
                mainMenu: mainMenuVisible,
                drawMenu: drawMenuVisible,
                colorMenu: colorMenuVisible,
                skyMenu: skyMenuVisible,
                simMenu: menuVisible
            };
            mainMenuVisible = false;
            drawMenuVisible = false;
            colorMenuVisible = false;
            skyMenuVisible = false;
            menuVisible = false;
            
            return true;
        }
        
        // Check Path Speed knob (row 1, col 1)
        const speedKnobCol = 1;
        const speedKnobRow = 1;
        const speedKnobX = menuOriginX + speedKnobCol * cellWidth;
        const speedKnobY = menuOriginY + gridStartY + speedKnobRow * cellHeight;
        const skdx = clickCanvasX - speedKnobX;
        const skdy = clickCanvasY - speedKnobY;
        
        if (skdx * skdx + skdy * skdy < knobRadius * knobRadius) {
            draggedDrawKnob = 2; // Index 2 = Path Speed
            attachMouseMove();
            dragStartMouseX = mouseX;
            dragStartMouseY = mouseY;
            dragStartValue = magnetPathSpeed;
            return true;
        }
        
        // Check Wand button (row 1, col 2)
        const wandCol = 2;
        const wandRow = 1;
        const wandIconSize = knobRadius * 1.2;
        const wandButtonX = menuOriginX + wandCol * cellWidth;
        const wandButtonY = menuOriginY + gridStartY + wandRow * cellHeight;
        const wandClickRadius = wandIconSize * 0.8;
        const wdx = clickCanvasX - wandButtonX;
        const wdy = clickCanvasY - wandButtonY;
        
        if (wdx * wdx + wdy * wdy < wandClickRadius * wandClickRadius) {
            wandActive = !wandActive;
            return true;
        }
        
        // Check if draw menu background was clicked (for dragging entire menu)
        if (clickCanvasX >= menuOriginX - padding && clickCanvasX <= menuOriginX + menuWidth + padding &&
            clickCanvasY >= menuOriginY - padding && clickCanvasY <= menuOriginY + menuHeight + padding) {
            isDraggingDrawMenu = true;
            attachMouseMove();
            drawMenuDragStartX = mouseX;
            drawMenuDragStartY = mouseY;
            drawMenuStartX = drawMenuX;
            drawMenuStartY = drawMenuY;
            return true;
        }
        
        return false; // Click was not on draw menu
    }
    
    // Helper function for sky menu clicks
    function checkSkyMenuClick() {
        if (!skyMenuVisible || skyMenuOpacity <= 0.5 || !window.skyRenderer) return false;
        const knobRadius = 0.1 * cScale;
        const knobSpacing = knobRadius * 3;
        const menuWidth = knobSpacing * 3;
        const menuHeight = knobSpacing * 2.25;
        const padding = 1.7 * knobRadius;
        const menuUpperLeftX = skyMenuX * cScale;
        const menuUpperLeftY = (canvas.height - skyMenuY * cScale);
        const menuOriginX = menuUpperLeftX + knobSpacing;
        const menuOriginY = menuUpperLeftY + 0.5 * knobSpacing;
        
        const clickCanvasX = mouseX * cScale;
        const clickCanvasY = canvas.height - mouseY * cScale;
        
        // Check close icon
        const closeIconRadius = knobRadius * 0.25;
        const closeIconX = menuOriginX - padding + closeIconRadius + 0.2 * knobRadius;
        const closeIconY = menuOriginY - padding + closeIconRadius + 0.2 * knobRadius;
        const cdx = clickCanvasX - closeIconX;
        const cdy = clickCanvasY - closeIconY;
        
        if (cdx * cdx + cdy * cdy < closeIconRadius * closeIconRadius) {
            skyMenuVisible = false;
            return true;
        }
        
        // Check Auto Rotate button first (before knobs, since it overlaps with rotation speed knob)
        const checkboxRadius = knobRadius * 0.25;
        const autoRotateX = menuOriginX + knobSpacing * 1.0;
        const autoRotateY = menuOriginY + knobSpacing * 1.0;
        const ardx = clickCanvasX - autoRotateX;
        const ardy = clickCanvasY - autoRotateY;
        
        if (ardx * ardx + ardy * ardy < checkboxRadius * checkboxRadius) {
            const skyCtrl = window.skyRenderer.effectController;
            skyCtrl.autoRotate = !skyCtrl.autoRotate;
            return true;
        }
        
        // Check Show Grid button (before knobs, since it overlaps with FOV knob)
        const showGridX = menuOriginX + knobSpacing * 3.0;
        const showGridY = menuOriginY + knobSpacing * 2.0;
        const sgdx = clickCanvasX - showGridX;
        const sgdy = clickCanvasY - showGridY;
        
        if (sgdx * sgdx + sgdy * sgdy < checkboxRadius * checkboxRadius) {
            const skyCtrl = window.skyRenderer.effectController;
            skyCtrl.showGrid = !skyCtrl.showGrid;
            return true;
        }
        
        // Check individual knobs
        for (let knob = 0; knob < 10; knob++) {
            let row = Math.floor(knob / 4);
            let col = knob % 4;
            // Special positioning for exposure knob (index 7) - move to column 1, row 2
            if (knob === 7) {
                row = 2;
                col = 1;
            }
            // Special positioning for FOV knob (index 8) - move to column 3, row 2
            if (knob === 8) {
                row = 2;
                col = 3;
            }
            // Special positioning for autoElevationRate knob (index 9) - move to column 3, row 1
            if (knob === 9) {
                row = 1;
                col = 3;
            }
            const knobCanvasX = menuOriginX + col * knobSpacing;
            const knobCanvasY = menuOriginY + row * knobSpacing;
            
            const kdx = clickCanvasX - knobCanvasX;
            const kdy = clickCanvasY - knobCanvasY;
            if (kdx * kdx + kdy * kdy < knobRadius * knobRadius) {
                // For knob 9 (auto elevation rate), check if clicking the center button
                if (knob === 9) {
                    const centerRadius = checkboxRadius * 0.5;
                    if (kdx * kdx + kdy * kdy < centerRadius * centerRadius) {
                        // Toggle auto elevation
                        autoElevation = !autoElevation;
                        if (autoElevation) {
                            const skyCtrl = window.skyRenderer.effectController;
                            autoElevationInitial = skyCtrl.elevation; // Store current elevation
                            // Set phase so current elevation matches the sine wave (starts rising)
                            autoElevationPhase = -Math.PI / 6; // sin(-π/6) = -0.5, placing current elevation at start
                        }
                        return true;
                    }
                }
                // Otherwise, start dragging the knob
                draggedSkyKnob = knob;
                attachMouseMove();
                dragStartMouseX = mouseX;
                dragStartMouseY = mouseY;
                
                // Store the starting value
                const skyCtrl = window.skyRenderer.effectController;
                const menuItems = [
                    skyCtrl.turbidity,
                    skyCtrl.rayleigh,
                    skyCtrl.mieCoefficient,
                    skyCtrl.mieDirectionalG,
                    skyCtrl.azimuth,
                    -skyCtrl.rotationSpeed,
                    skyCtrl.elevation,
                    skyCtrl.exposure,
                    skyCtrl.fov,
                    autoElevationRate
                ];
                dragStartValue = menuItems[knob];
                return true;
            }
        }
        
        // Check toggle buttons
        const buttonY = knobSpacing * 2;
        
        // Object visibility toggle buttons - 2x2 grid centered below azimuth knob (column 0)
        const buttonRowY = menuOriginY + buttonY;
        const buttonSpacing = knobRadius * 1.5;
        const gridCenterX = menuOriginX + knobSpacing * 0.0; // Column 0 (azimuth)
        const buttonRowSpacing = knobRadius * 1.2;
        
        // Clouds checkbox (top-left)
        const cloudsX = gridCenterX - 0.5 * buttonSpacing;
        const cloudsY = buttonRowY - 0.5 * buttonRowSpacing;
        const cdx3 = clickCanvasX - cloudsX;
        const cdy3 = clickCanvasY - cloudsY;
        if (cdx3 * cdx3 + cdy3 * cdy3 < checkboxRadius * checkboxRadius) {
            showClouds = !showClouds;
            return true;
        }
        
        // Plane checkbox (top-right)
        const planeX = gridCenterX + 0.5 * buttonSpacing;
        const planeY = buttonRowY - 0.5 * buttonRowSpacing;
        const pdx = clickCanvasX - planeX;
        const pdy = clickCanvasY - planeY;
        if (pdx * pdx + pdy * pdy < checkboxRadius * checkboxRadius) {
            showPlane = !showPlane;
            return true;
        }
        
        // Balloons checkbox (bottom-left)
        const balloonsX = gridCenterX - 0.5 * buttonSpacing;
        const balloonsY = buttonRowY + 0.5 * buttonRowSpacing;
        const bdx = clickCanvasX - balloonsX;
        const bdy = clickCanvasY - balloonsY;
        if (bdx * bdx + bdy * bdy < checkboxRadius * checkboxRadius) {
            showBalloons = !showBalloons;
            return true;
        }
        
        // Hot Air Balloon checkbox (bottom-right)
        const hotAirBalloonX = gridCenterX + 0.5 * buttonSpacing;
        const hotAirBalloonY = buttonRowY + 0.5 * buttonRowSpacing;
        const habdx = clickCanvasX - hotAirBalloonX;
        const habdy = clickCanvasY - hotAirBalloonY;
        if (habdx * habdx + habdy * habdy < checkboxRadius * checkboxRadius) {
            showHotAirBalloon = !showHotAirBalloon;
            return true;
        }
        
        // Camera icon (column 2, row 2)
        const handX = menuOriginX + knobSpacing * 2.0;
        const handY = menuOriginY + buttonY;
        const hdx = clickCanvasX - handX;
        const hdy = clickCanvasY - handY;
        const cameraHitRadius = checkboxRadius * 2.5;
        
        if (hdx * hdx + hdy * hdy < cameraHitRadius * cameraHitRadius) {
            skyHandActive = !skyHandActive;
            if (skyHandActive) {
                spraypaintActive = false; // Turn off spraypaint when camera adjust is activated
                // Store current menu states
                menuVisibleBeforeCamera = menuVisible;
                colorMenuVisibleBeforeCamera = colorMenuVisible;
                skyMenuVisibleBeforeCamera = skyMenuVisible;
                // Hide all menus
                menuVisible = false;
                colorMenuVisible = false;
                skyMenuVisible = false;
            }
            updateMouseListeners();
            return true;
        }
        
        // Check credit link at bottom left - only "ThreeJS.org" is clickable
        const menuHeightForClick = knobSpacing * 2.25; // Match the drawing code
        const creditFontSize = 0.032 * cScale;
        c.font = `${creditFontSize}px sans-serif`;
        const prefixText = 'Sun and sky shader by '; 
        const prefixWidth = c.measureText(prefixText).width;
        const linkText = 'ThreeJS.org';
        const linkWidth = c.measureText(linkText).width;
        
        const creditBaseX = menuOriginX - padding + 0.3 * knobRadius;
        const creditBaseY = menuOriginY + menuHeightForClick + padding - 0.3 * knobRadius;
        const linkX = creditBaseX + prefixWidth;
        const linkY = creditBaseY;
        
        // Click detection for ThreeJS.org link only
        if (clickCanvasX >= linkX && clickCanvasX <= linkX + linkWidth &&
            clickCanvasY >= linkY - creditFontSize && clickCanvasY <= linkY + creditFontSize * 0.3) {
            window.open('https://threejs.org/examples/#webgl_shaders_sky', '_blank');
            return true;
        }
        
        // Check if sky menu background was clicked (for dragging entire menu)
        if (clickCanvasX >= menuOriginX - padding && clickCanvasX <= menuOriginX + menuWidth + padding &&
            clickCanvasY >= menuOriginY - padding && clickCanvasY <= menuOriginY + menuHeight + padding) {
            isDraggingSkyMenu = true;
            attachMouseMove();
            skyMenuDragStartX = mouseX;
            skyMenuDragStartY = mouseY;
            skyMenuStartX = skyMenuX;
            skyMenuStartY = skyMenuY;
            return true;
        }
        
        return false; // Click was not on sky menu
    }
    
    // Handle path drawing
    if (tracePathActive && !isDrawingPath && e.button === 0) {
        // Second click - start drawing the path
        isDrawingPath = true;
        pathPoints.push({x: mouseX, y: mouseY});
        attachMouseMove();
        updateMouseListeners();
        return;
    }
    
    if (isDrawingPath && e.button === 0) {
        pathPoints.push({x: mouseX, y: mouseY});
        attachMouseMove();
        return;
    }
    
    // Handle spraypaint tool
    if (spraypaintActive && e.button === 0) {
        isSpraying = true;
        attachMouseMove();
    }
    
    // Handle sky hand tool
    if (skyHandActive && e.button === 0 && window.skyRenderer) {
        isDraggingSky = true;
        attachMouseMove();
        skyDragStartX = mouseX;
        skyDragStartY = mouseY;
        skyCameraPitchStart = window.skyRenderer.effectController.cameraPitch;
        skyCameraYawStart = window.skyRenderer.effectController.cameraYaw;
    }
    
    // Find which cloud was clicked (only foreground clouds)
    let clickedCloud = null;
    for (let cloud of Clouds) {
        if (cloud.contains(mouseX, mouseY)) {
            clickedCloud = cloud;
            break;
        }
    }
    
    // Find which balloon was clicked
    let clickedBalloon = null;
    for (let balloon of Balloons) {
        if (balloon.contains(mouseX, mouseY)) {
            clickedBalloon = balloon;
            break;
        }
    }
    
    // If balloon was clicked, set it to popping
    if (clickedBalloon && !clickedBalloon.popping) {
        clickedBalloon.popping = true;
        clickedBalloon.popStartTime = performance.now();
        spookBoids(clickedBalloon.pos, 5 * clickedBalloon.radius);
        
        // Increase sadness of foreground clouds when balloons are popped
        for (let cloud of ForegroundCloud) {
            if (cloud.sadness < 10) {
                cloud.sadness++;
                // Start raining at sadness 5
                if (cloud.sadness >= 5 && !cloud.isRaining) {
                    cloud.isRaining = true;
                }
                cloud.renderToCanvas();
            }
        }
    }
    
    if (e.button === 0) { // Left click
        const currentTime = Date.now();
        
        // Check for double-click
        if (currentTime - lastClickTime < 300) {
            if (clickedCloud && clickedCloud === lastClickedCloud) {
                // Double-click on cloud: create new cloud at this position
                const showTutorial = !firstUserCloudCreated;
                Clouds.push(new CLOUD(mouseX, mouseY, false, false, false, showTutorial));
                firstUserCloudCreated = true;
            } else if (!clickedCloud && lastClickedCloud === null) {
                // Double-click on empty canvas: create new cloud
                const showTutorial = !firstUserCloudCreated;
                Clouds.push(new CLOUD(mouseX, mouseY, false, false, false, showTutorial));
                firstUserCloudCreated = true;
            }
            lastClickTime = 0;
            lastClickedCloud = null;
        } else {
            // Single click: drag cloud if clicked on one
            draggedCloud = clickedCloud;
            if (draggedCloud) {
                attachMouseMove();
            }
            lastClickTime = currentTime;
            lastClickedCloud = clickedCloud;
        }
    } else if (e.button === 2) { // Right click
        // Delete the clicked cloud
        if (clickedCloud) {
            Clouds = Clouds.filter(cloud => cloud !== clickedCloud);
        }
        e.preventDefault();
    }
};

mouseupHandler = function(e) {
    // Handle path drawing completion
    if (isDrawingPath) {
        isDrawingPath = false;
        
        // Smooth and close the path if we have enough points
        if (pathPoints.length > 2) {
            // Smooth the path using Chaikin's algorithm (2 iterations)
            pathPoints = smoothPath(pathPoints, 2);
            
            // Calculate total path length and cumulative distances
            pathLength = 0;
            pathCumulativeDistances = [0]; // First point is at distance 0
            for (let i = 0; i < pathPoints.length; i++) {
                const p1 = pathPoints[i];
                const p2 = pathPoints[(i + 1) % pathPoints.length];
                const segmentLength = Math.hypot(p2.x - p1.x, p2.y - p1.y);
                pathLength += segmentLength;
                // Store cumulative distance at the end of this segment (start of next point)
                if (i < pathPoints.length - 1) {
                    pathCumulativeDistances.push(pathLength);
                }
            }
            
            // Path is complete, restore menu states
            mainMenuVisible = savedMenuStatesForPath.mainMenu;
            drawMenuVisible = savedMenuStatesForPath.drawMenu;
            colorMenuVisible = savedMenuStatesForPath.colorMenu;
            skyMenuVisible = savedMenuStatesForPath.skyMenu;
            menuVisible = savedMenuStatesForPath.simMenu;
            
            // Enable magnet and start following the path
            magnetActive = true;
            magnetPathProgress = 0;
            // Lock the path - disable trace mode but mark path as existing
            tracePathActive = false;
            pathExists = true;
            updateMouseListeners();
        } else {
            // Not enough points, cancel
            tracePathActive = false;
            pathPoints = [];
            updateMouseListeners();
            mainMenuVisible = savedMenuStatesForPath.mainMenu;
            drawMenuVisible = savedMenuStatesForPath.drawMenu;
            colorMenuVisible = savedMenuStatesForPath.colorMenu;
            skyMenuVisible = savedMenuStatesForPath.skyMenu;
            menuVisible = savedMenuStatesForPath.simMenu;
        }
        return;
    }
    
    // If camera control was active and we were dragging, check if it was a click to lock
    if (isDraggingSky && skyHandActive) {
        // Calculate movement distance
        const dragDistance = Math.sqrt(
            Math.pow(mouseX - skyDragStartX, 2) + 
            Math.pow(mouseY - skyDragStartY, 2)
        );
        
        // Lock camera if it was a click (minimal movement)
        if (dragDistance < 0.02) { // Threshold in world coordinates
            skyHandActive = false;
            updateMouseListeners();
            // Restore menu states
            menuVisible = menuVisibleBeforeCamera;
            colorMenuVisible = colorMenuVisibleBeforeCamera;
            skyMenuVisible = skyMenuVisibleBeforeCamera;
        }
    }
    
    /*// Log camera position if we were dragging the sky
    if (isDraggingSky && window.skyRenderer) {
        console.log('Sky Camera Position - Pitch:', window.skyRenderer.effectController.cameraPitch, 'Yaw:', window.skyRenderer.effectController.cameraYaw);
    }*/
    
    draggedCloud = null;
    draggedKnob = null;
    draggedSkyKnob = null;
    draggedDrawKnob = null;
    isDraggingMenu = false;
    isDraggingColorMenu = false;
    isDraggingSkyMenu = false;
    isDraggingDrawMenu = false;
    isDraggingSky = false;
    isDraggingColorWheel = false;
    isDraggingLightness = false;
    isDraggingHueSensitivity = false;
    isDraggingHueTicker = false;
    isDraggingSpraySlider = false;
    isDraggingMagnet = false;
    isDraggingWand = false;
    isSpraying = false;
    
    // Detach heavy mousemove listener when drag ends
    detachMouseMove();
    
    // Keep or remove lightweight listener based on active tools
    if (!spraypaintActive && !dyeActive && !skyHandActive) {
        detachLightweightMouseMove();
    }
};

contextmenuHandler = function(e) {
    e.preventDefault();
};

// Mousemove handler - only attached when needed for performance
let mousemoveActive = false;
let listenersAttached = false; // Track if main event listeners have been attached

function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) / cScale;
    mouseY = (canvas.height - (e.clientY - rect.top)) / cScale;
    
    // Handle magnet dragging
    if (isDraggingMagnet && Magnet.length > 0) {
        Magnet[0].x = mouseX;
        Magnet[0].y = mouseY;
        return;
    }
    
    // Handle menu dragging
    if (isDraggingMenu) {
        const deltaX = mouseX - menuDragStartX;
        const deltaY = mouseY - menuDragStartY;
        menuX = menuStartX + deltaX;
        menuY = menuStartY + deltaY;
        return;
    }
    
    // Handle color menu dragging
    if (isDraggingColorMenu) {
        const deltaX = mouseX - colorMenuDragStartX;
        const deltaY = mouseY - colorMenuDragStartY;
        colorMenuX = colorMenuStartX + deltaX;
        colorMenuY = colorMenuStartY + deltaY;
        return;
    }
    
    // Handle sky menu dragging
    if (isDraggingSkyMenu) {
        const deltaX = mouseX - skyMenuDragStartX;
        const deltaY = mouseY - skyMenuDragStartY;
        skyMenuX = skyMenuStartX + deltaX;
        skyMenuY = skyMenuStartY + deltaY;
        return;
    }
    
    // Handle draw menu dragging
    if (isDraggingDrawMenu) {
        const deltaX = mouseX - drawMenuDragStartX;
        const deltaY = mouseY - drawMenuDragStartY;
        drawMenuX = drawMenuStartX + deltaX;
        drawMenuY = drawMenuStartY + deltaY;
        return;
    }
    
    // Handle draw menu knob dragging
    if (draggedDrawKnob !== null) {
        const dragDeltaX = mouseX - dragStartMouseX;
        const dragDeltaY = (mouseY - dragStartMouseY);
        const dragDelta = dragDeltaX + dragDeltaY;
        
        const dragSensitivity = 0.5;
        const normalizedDelta = dragDelta / dragSensitivity;
        
        if (draggedDrawKnob === 0) { // Pull Strength
            const pullMin = 1;
            const pullMax = 20;
            const rangeSize = pullMax - pullMin;
            let newValue = dragStartValue + normalizedDelta * rangeSize;
            newValue = Math.max(pullMin, Math.min(pullMax, newValue));
            magnetForce = newValue;
        } else if (draggedDrawKnob === 1) { // Effect Radius
            const radiusMin = 0.01;
            const radiusMax = 1.0;
            const rangeSize = radiusMax - radiusMin;
            let newValue = dragStartValue + normalizedDelta * rangeSize;
            newValue = Math.max(radiusMin, Math.min(radiusMax, newValue));
            magnetEffectRadius = newValue;
            // Update magnet effect radius
            if (Magnet.length > 0) {
                Magnet[0].effectRadius = magnetEffectRadius * Math.min(simWidth, simHeight);
            }
        } else if (draggedDrawKnob === 2) { // Path Speed
            const speedMin = -3;
            const speedMax = 3;
            const rangeSize = speedMax - speedMin;
            let newValue = dragStartValue + normalizedDelta * rangeSize;
            newValue = Math.max(speedMin, Math.min(speedMax, newValue));
            magnetPathSpeed = newValue;
        }
        return;
    }
    
    // Handle path drawing
    if (isDrawingPath) {
        // Add point if far enough from last point
        if (pathPoints.length === 0 || 
            Math.hypot(mouseX - pathPoints[pathPoints.length - 1].x, 
                      mouseY - pathPoints[pathPoints.length - 1].y) > 0.02) {
            pathPoints.push({x: mouseX, y: mouseY});
        }
        return;
    }
    
    // Handle sky camera dragging
    if (isDraggingSky && window.skyRenderer) {
        const deltaX = (mouseX - skyDragStartX) * 0.75; // Horizontal drag (reduced sensitivity)
        const deltaY = (mouseY - skyDragStartY) * 0.75; // Vertical drag (reduced sensitivity)
        window.skyRenderer.effectController.cameraYaw = skyCameraYawStart - deltaX;
        window.skyRenderer.effectController.cameraPitch = skyCameraPitchStart + deltaY;
        // Clamp pitch to avoid flipping
        window.skyRenderer.effectController.cameraPitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, window.skyRenderer.effectController.cameraPitch));
        return;
    }
    
    // Handle color wheel dragging
    if (isDraggingColorWheel) {
        const knobRadius = 0.1 * cScale;
        const colorWheelRadius = knobRadius * 1.7;
        const wheelCenterX = (colorMenuX * cScale) + colorWheelRadius;
        const wheelCenterY = (canvas.height - colorMenuY * cScale) + colorWheelRadius;
        const clickCanvasX = mouseX * cScale;
        const clickCanvasY = canvas.height - mouseY * cScale;
        const wheelDx = clickCanvasX - wheelCenterX;
        const wheelDy = clickCanvasY - wheelCenterY;
        const wheelDist = Math.sqrt(wheelDx * wheelDx + wheelDy * wheelDy);
        
        selectedHue = (Math.atan2(wheelDy, wheelDx) * 180 / Math.PI + 360) % 360;
        selectedSaturation = Math.min(100, (wheelDist / colorWheelRadius) * 100);
        return;
    }
    
    // Handle lightness slider dragging
    if (isDraggingLightness) {
        const knobRadius = 0.1 * cScale;
        const colorWheelRadius = knobRadius * 1.7;
        const spacing = knobRadius * 0.5;
        const sliderHeight = colorWheelRadius * 2;
        const sliderY = canvas.height - colorMenuY * cScale;
        const clickCanvasY = canvas.height - mouseY * cScale;
        const relativeY = clickCanvasY - sliderY;
        selectedLightness = Math.max(0, Math.min(100, 100 - (relativeY / sliderHeight) * 100));
        return;
    }
    
    // Handle hueSensitivity knob dragging
    if (isDraggingHueSensitivity) {
        const dragDeltaX = mouseX - dragStartMouseX;
        const dragDeltaY = mouseY - dragStartMouseY;
        const dragDelta = dragDeltaX + dragDeltaY;
        
        const dragSensitivity = 0.5;
        const normalizedDelta = dragDelta / dragSensitivity;
        const rangeSize = 360 - 0;
        let newValue = hueSensitivityDragStart + normalizedDelta * rangeSize;
        
        newValue = Math.max(0, Math.min(360, newValue));
        boidProps.hueSensitivity = newValue;
        return;
    }
    
    // Handle hueTicker knob dragging with logarithmic scale
    if (isDraggingHueTicker) {
        const dragDeltaX = mouseX - dragStartMouseX;
        const dragDeltaY = mouseY - dragStartMouseY;
        const dragDelta = dragDeltaX + dragDeltaY;
        
        // Convert current value to normalized position (0-1) using log scale
        const logMin = Math.log(0.01);
        const logMax = Math.log(10.0);
        const startLogValue = Math.log(Math.max(0.01, Math.min(10.0, hueTickerDragStart)));
        const startNormalized = (startLogValue - logMin) / (logMax - logMin);
        
        // Apply drag delta
        const dragSensitivity = 0.5;
        const normalizedDelta = dragDelta / dragSensitivity;
        let newNormalized = startNormalized + normalizedDelta;
        newNormalized = Math.max(0, Math.min(1, newNormalized));
        
        // Convert back to log scale value
        const newLogValue = logMin + newNormalized * (logMax - logMin);
        const newValue = Math.exp(newLogValue);
        
        boidProps.hueTicker = Math.max(0.01, Math.min(10.0, newValue));
        return;
    }
    
    // Handle spray slider dragging
    if (isDraggingSpraySlider) {
        const knobRadius = 0.1 * cScale;
        const canRadius = knobRadius * 1.2;
        const spacing = knobRadius * 0.5;
        const colorWheelRadius = knobRadius * 1.7;
        const lightnessSldrWidth = knobRadius * 0.6;
        const sliderWidth = lightnessSldrWidth;
        
        // Calculate spraypaint icon position
        const sliderX = (colorMenuX * cScale) + colorWheelRadius * 2 + spacing;
        const spraypaintX = sliderX + sliderWidth + spacing + knobRadius * 0.85;
        
        const spraySliderWidth = canRadius * 1.4;
        const spraySliderX = spraypaintX - spraySliderWidth / 2;
        const clickCanvasX = mouseX * cScale;
        const clickRatio = (clickCanvasX - spraySliderX) / spraySliderWidth;
        
        spraypaintRadius = 0.05 + clickRatio * (0.5 - 0.05);
        spraypaintRadius = Math.max(0.05, Math.min(0.5, spraypaintRadius));
        return;
    }
    
    // Handle spraypaint tool
    if (isSpraying && spraypaintActive) {
        // Generate spray particles
        const particlesPerFrame = 20;
        for (let i = 0; i < particlesPerFrame; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * spraypaintRadius;
            const px = mouseX + Math.cos(angle) * distance;
            const py = mouseY + Math.sin(angle) * distance;
            sprayParticles.push(new SprayParticle(px, py, selectedHue, selectedSaturation, selectedLightness));
        }
        
        // Apply color to boids within radius
        for (let i = 0; i < Boids.length; i++) {
            const boid = Boids[i];
            const dx = boid.pos.x - mouseX;
            const dy = boid.pos.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < spraypaintRadius) {
                boid.hue = selectedHue;
                boid.saturation = selectedSaturation;
                boid.lightness = selectedLightness;
                boid.manualHue = true;
                boid.manualSaturation = true;
                boid.manualLightness = true;
                
                // Add this color to painted dots (avoid duplicates within small tolerance)
                const tolerance = 5; // degrees/percent
                const alreadyExists = paintedColorDots.some(dot => 
                    Math.abs(dot.hue - selectedHue) < tolerance && 
                    Math.abs(dot.saturation - selectedSaturation) < tolerance
                );
                if (!alreadyExists) {
                    paintedColorDots.push({hue: selectedHue, saturation: selectedSaturation});
                    // Limit array size to prevent memory leak (keep most recent 100 colors)
                    if (paintedColorDots.length > 100) {
                        paintedColorDots.shift();
                    }
                }
            }
        }
    }
    
    // Handle knob dragging
    if (draggedKnob !== null && draggedKnob !== 4) {
        const ranges = [
            {min: 100, max: 5000},      // numBoids
            {min: 1, max: 10},           // boidRadius (scaled by 100)
            {min: 0.05, max: 0.5},       // visualRange
            {min: 0.1, max: 3.0},        // speedLimit
            {min: 0.0, max: 0.2},        // (removed)
            {min: 0, max: 100},          // avoidFactor
            {min: 0, max: 50},           // matchingFactor
            {min: 0, max: 20},           // centeringFactor
            {min: 0, max: 5},            // turnFactor
            {min: 0, max: 100},          // trailLength
            {min: 1.0, max: 5.0}         // tailWidth
        ];
        
        // Calculate drag delta (combined horizontal and vertical)
        const dragDeltaX = mouseX - dragStartMouseX;
        const dragDeltaY = (mouseY - dragStartMouseY); // Up=decrease, down=increase
        const dragDelta = dragDeltaX + dragDeltaY; // Combined drag in world units
        
        // Sensitivity: how much world units equals full range
        const dragSensitivity = 0.5; // 0.5 world units = full range
        const normalizedDelta = dragDelta / dragSensitivity;
        
        const range = ranges[draggedKnob];
        const rangeSize = range.max - range.min;
        let newValue = dragStartValue + normalizedDelta * rangeSize;
        
        // Clamp to range
        newValue = Math.max(range.min, Math.min(range.max, newValue));
        
        // Apply the new value
        switch (draggedKnob) {
            case 0: 
                boidProps.numBoids = Math.round(newValue);
                // Immediately adjust boid count
                const currentCount = Boids.length;
                const targetCount = boidProps.numBoids;
                
                if (currentCount > targetCount) {
                    // Remove excess boids (prioritize those outside canvas)
                    const removeCount = currentCount - targetCount;
                    const regularBoids = [];
                    const specialBoids = [];
                    const outsideBoids = [];
                    const insideBoids = [];
                    
                    // Separate regular and special boids
                    for (let i = 0; i < Boids.length; i++) {
                        const boid = Boids[i];
                        if (boid.whiteBoid || boid.blackBoid) {
                            specialBoids.push(boid);
                        } else {
                            regularBoids.push(boid);
                        }
                    }
                    
                    // Categorize regular boids by position
                    for (let i = 0; i < regularBoids.length; i++) {
                        const boid = regularBoids[i];
                        const isOutside = boid.pos.x < 0 || boid.pos.x > simWidth || 
                                        boid.pos.y < 0 || boid.pos.y > simHeight;
                        
                        if (isOutside) {
                            outsideBoids.push(i);
                        } else {
                            insideBoids.push(i);
                        }
                    }
                    
                    // Remove outside boids first, then inside from the end
                    const toRemove = [];
                    let removed = 0;
                    
                    for (let i = outsideBoids.length - 1; i >= 0 && removed < removeCount; i--) {
                        toRemove.push(outsideBoids[i]);
                        removed++;
                    }
                    
                    for (let i = insideBoids.length - 1; i >= 0 && removed < removeCount; i--) {
                        toRemove.push(insideBoids[i]);
                        removed++;
                    }
                    
                    toRemove.sort((a, b) => b - a);
                    for (let idx of toRemove) {
                        SpatialGrid.remove(regularBoids[idx]);
                        regularBoids.splice(idx, 1);
                    }
                    
                    Boids = [...regularBoids, ...specialBoids];
                    
                } else if (currentCount < targetCount) {
                    // Add new boids outside the canvas
                    const addCount = targetCount - currentCount;
                    const spawnRadius = Math.sqrt(simWidth * simWidth + simHeight * simHeight) * 0.6;
                    
                    for (let i = 0; i < addCount; i++) {
                        const ang = Math.random() * 2 * Math.PI;
                        const pos = new Vector2(
                            0.5 * simWidth + Math.cos(ang) * spawnRadius,
                            0.5 * simHeight + Math.sin(ang) * spawnRadius);
                        // Give initial velocity toward center (prevents slow clustering)
                        const velAngle = Math.random() * 2 * Math.PI;
                        const velMag = 0.3 + Math.random() * 0.4; // Random speed 0.3-0.7
                        const vel = new Vector2(Math.cos(velAngle) * velMag, Math.sin(velAngle) * velMag);
                        const hue = 0;
                        const newBoid = new BOID(pos, vel, hue, false, false);
                        
                        // Set boid type based on selectedBoidType
                        newBoid.triangleBoid = selectedBoidType === 0;
                        newBoid.arrow = selectedBoidType === 1;
                        newBoid.flappy = selectedBoidType === 2;
                        newBoid.circle = selectedBoidType === 3;
                        newBoid.ellipseBoid = selectedBoidType === 4;
                        newBoid.square = selectedBoidType === 5;
                        newBoid.airfoil = selectedBoidType === 6;
                        newBoid.glowBoid = selectedBoidType === 7;
                        
                        // Insert before the last 2 special boids
                        Boids.splice(Boids.length - 2, 0, newBoid);
                        SpatialGrid.insert(newBoid);
                    }
                }
                break;
            case 1: 
                boidRadius = newValue / 100; // Scale back down
                // Update radius for all existing boids
                for (let i = 0; i < Boids.length; i++) {
                    Boids[i].radius = boidRadius;
                }
                // Update dependent properties
                boidProps.minDistance = Math.max(0.08, 5.0 * boidRadius);
                break;
            case 2: 
                boidProps.visualRange = newValue; 
                // Update dependent properties
                SpatialGrid = new SpatialHashGrid(boidProps.visualRange / 2)
                break;
            case 3: boidProps.speedLimit = newValue; break;
            case 5: boidProps.avoidFactor = newValue; break;
            case 6: boidProps.matchingFactor = newValue; break;
            case 7: boidProps.centeringFactor = newValue; break;
            case 8: boidProps.turnFactor = newValue; break;
            case 9: boidProps.tailLength = Math.round(newValue); break;
            case 10: boidProps.tailWidth = newValue; break;
        }
        return;
    }
    
    // Handle sky knob dragging
    if (draggedSkyKnob !== null && window.skyRenderer) {
        const ranges = [
            {min: 0, max: 20},           // turbidity
            {min: 0, max: 4},             // rayleigh
            {min: 0, max: 0.1},           // mieCoefficient
            {min: 0, max: 1},             // mieDirectionalG
            {min: 0, max: 359},           // azimuth
            {min: -2, max: 2},            // rotationSpeed
            {min: -2, max: 10},           // elevation
            {min: 0, max: 1},             // exposure
            {min: 10, max: 120},          // fov
            {min: 0.01, max: 0.10}        // autoElevationRate
        ];
        
        // Calculate drag delta
        const dragDeltaX = mouseX - dragStartMouseX;
        const dragDeltaY = (mouseY - dragStartMouseY);            let dragDelta = dragDeltaX + dragDeltaY;
        
        // Reverse delta for FOV knob (index 8)
        if (draggedSkyKnob === 8) {
            dragDelta = -dragDelta;
        }
        
        // Sensitivity
        const dragSensitivity = 0.5;
        const normalizedDelta = dragDelta / dragSensitivity;
        
        const range = ranges[draggedSkyKnob];
        const rangeSize = range.max - range.min;
        let newValue = dragStartValue + normalizedDelta * rangeSize;
        
        // For azimuth (index 4), allow continuous rotation (wrap around)
        if (draggedSkyKnob === 4) {
            // Wrap azimuth from 0 to 359
            while (newValue >= 360) newValue -= 360;
            while (newValue < 0) newValue += 360;
        } else {
            // Clamp to range for other knobs
            newValue = Math.max(range.min, Math.min(range.max, newValue));
        }
        
        // Apply the new value
        const skyCtrl = window.skyRenderer.effectController;
        switch (draggedSkyKnob) {
            case 0: skyCtrl.turbidity = newValue; break;
            case 1: skyCtrl.rayleigh = newValue; break;
            case 2: skyCtrl.mieCoefficient = newValue; break;
            case 3: skyCtrl.mieDirectionalG = newValue; break;
            case 4: skyCtrl.azimuth = 359 - newValue; break; // Reverse direction
            case 5: skyCtrl.rotationSpeed = -newValue; break; // Reverse direction
            case 6: skyCtrl.elevation = newValue; break;
            case 7: skyCtrl.exposure = newValue; break;
            case 8: skyCtrl.fov = newValue; break;
            case 9: autoElevationRate = newValue; break;
        }
        return;
    }
    
    if (isDraggingWand) {
        wandPosX = (mouseX - wandDragOffsetX) / simWidth;
        wandPosY = (mouseY - wandDragOffsetY) / simHeight;
        
        // Check if wand moved significantly and spawn boids from tip
        const dx = wandPosX - wandPrevX;
        const dy = wandPosY - wandPrevY;
        const distMoved = Math.sqrt(dx * dx + dy * dy);
        
        if (distMoved > 0.001) {
            // Calculate tip position in world coordinates
            const wandLength = 0.15 * wandSize;
            const tipOffsetDist = -0.1 * wandLength;
            const tipX = (wandPosX * simWidth) + Math.cos(wandAngle) * tipOffsetDist;
            const tipY = (wandPosY * simHeight) + Math.sin(wandAngle) * tipOffsetDist;
            
            // Spawn a boid from the tip with random outward velocity
            const velAngle = Math.random() * 2 * Math.PI;
            const velMag = 1.0 + Math.random() * 1.0;
            const vel = new Vector2(Math.cos(velAngle) * velMag, Math.sin(velAngle) * velMag);
            const pos = new Vector2(tipX, tipY);
            const hue = Math.random() * 360;
            
            const newBoid = new BOID(pos, vel, hue, false, false);
            newBoid.arrow = true;
            Boids.push(newBoid);
            
            wandPrevX = wandPosX;
            wandPrevY = wandPosY;
        }
        
        return;
    }
    
    if (draggedCloud) {
        draggedCloud.x = mouseX;
        draggedCloud.y = mouseY;
    }
}

// Lightweight handler for mouse position tracking (only for cursors and idle spray)
let lightweightMousemoveActive = false;
function lightweightMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) / cScale;
    mouseY = (canvas.height - (e.clientY - rect.top)) / cScale;
}

// Helper functions to attach/detach mousemove listeners
function attachMouseMove() {
    if (!mousemoveActive) {
        canvas.addEventListener('mousemove', handleMouseMove);
        mousemoveActive = true;
    }
}

function detachMouseMove() {
    if (mousemoveActive) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        mousemoveActive = false;
    }
}

function attachLightweightMouseMove() {
    if (!lightweightMousemoveActive) {
        canvas.addEventListener('mousemove', lightweightMouseMove);
        lightweightMousemoveActive = true;
    }
}

function detachLightweightMouseMove() {
    if (lightweightMousemoveActive) {
        canvas.removeEventListener('mousemove', lightweightMouseMove);
        lightweightMousemoveActive = false;
    }
}

// Update lightweight listener when tools are toggled
function updateMouseListeners() {
    // Lightweight listener needed for cursors when tools are active
    if (spraypaintActive || dyeActive || skyHandActive || tracePathActive || isDrawingPath) {
        attachLightweightMouseMove();
    } else if (!mousemoveActive) {
        // Only detach if heavy handler isn't active
        detachLightweightMouseMove();
    }
}

// Spacebar event listeners for balloon spawning
keydownHandler = function(e) {
    if (e.code === 'Space' && !spacebarHeld) {
        spacebarHeld = true;
        spacebarBalloonTimer = 0; // Reset timer to spawn immediately
        e.preventDefault(); // Prevent page scrolling
    }
};

keyupHandler = function(e) {
    if (e.code === 'Space') {
        spacebarHeld = false;
        e.preventDefault();
    }
};

//  HANDLE WINDOW RESIZING  ------------------
function resizeCanvas() {
    canvas = document.getElementById("myCanvas");
    c = canvas.getContext("2d");
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const oldSimWidth = simWidth;
    const oldSimHeight = simHeight;

    simMinWidth = 2.0;
    cScale = Math.min(canvas.width, canvas.height) / simMinWidth;
    simWidth = canvas.width / cScale;
    simHeight = canvas.height / cScale;

    // Calculate scale factors
    const scaleX = simWidth / oldSimWidth;
    const scaleY = simHeight / oldSimHeight;
    
    // Scale boid positions
    if (typeof boid !== 'undefined' && boid != null) {
        for (let boid of Boids) {
            boid.pos.x *= scaleX;
            boid.pos.y *= scaleY;
        }
    }
    
    // Scale Clouds
    if (typeof Clouds !== 'undefined' && Clouds != null) {
        for (let cloud of Clouds) {
            cloud.x *= scaleX;
            cloud.y *= scaleY;
            cloud.radius *= Math.min(scaleX, scaleY);
            // Regenerate the cloud's visual representation at the new size
            cloud.renderToCanvas();
        }
    }
    
    // Scale Background Clouds
    if (typeof BackgroundClouds !== 'undefined' && BackgroundClouds != null) {
        for (let cloud of BackgroundClouds) {
            cloud.x *= scaleX;
            cloud.y *= scaleY;
            cloud.radius *= Math.min(scaleX, scaleY);
            cloud.renderToCanvas();
        }
    }
    
    // Scale Foreground Clouds
    if (typeof ForegroundCloud !== 'undefined' && ForegroundCloud != null) {
        for (let cloud of ForegroundCloud) {
            cloud.x *= scaleX;
            cloud.y *= scaleY;
            cloud.radius *= Math.min(scaleX, scaleY);
            cloud.renderToCanvas();
        }
    }
}

// Mouse wheel handler for scrollable elements
let wheelHandler = function(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseCanvasX = (e.clientX - rect.left);
    const mouseCanvasY = (e.clientY - rect.top);
    
    // Check if mouse is over boid type list in simulation menu
    if (menuVisible && menuOpacity > 0.5) {
        const knobRadius = 0.1 * cScale;
        const knobSpacing = knobRadius * 3;
        const menuTopMargin = 0.2 * knobRadius;
        const menuUpperLeftX = menuX * cScale;
        const menuUpperLeftY = canvas.height - menuY * cScale;
        const menuOriginX = menuUpperLeftX + knobSpacing;
        const menuOriginY = menuUpperLeftY + 0.5 * knobSpacing;
        
        const listCol = 2;
        const listX = menuOriginX + listCol * knobSpacing - 1.15 * knobRadius;
        const listTitleY = menuOriginY + (2 * knobSpacing) - (2.0 * knobRadius) + menuTopMargin;
        const listY = listTitleY + knobRadius * 0.96;
        const listWidth = knobRadius * 2.3;
        const listHeight = knobRadius * 5.04;
        const itemHeight = knobRadius * 0.72;
        
        if (mouseCanvasX >= listX && mouseCanvasX <= listX + listWidth &&
            mouseCanvasY >= listY && mouseCanvasY <= listY + listHeight) {
            e.preventDefault();
            
            const maxScroll = Math.max(0, (boidTypeLabels.length * itemHeight) - listHeight);
            boidTypeScrollOffset += e.deltaY * 0.5;
            boidTypeScrollOffset = Math.max(0, Math.min(maxScroll, boidTypeScrollOffset));
            return;
        }
    }
};

// Attach event listeners only once
function attachEventListeners() {
    if (listenersAttached) return;
    
    canvas.addEventListener('mousedown', mousedownHandler);
    canvas.addEventListener('mouseup', mouseupHandler);
    canvas.addEventListener('contextmenu', contextmenuHandler);
    canvas.addEventListener('wheel', wheelHandler, { passive: false });
    document.addEventListener('keydown', keydownHandler);
    document.addEventListener('keyup', keyupHandler);
    window.addEventListener('resize', resizeCanvas);
    
    listenersAttached = true;
}

// Remove event listeners for cleanup
function removeEventListeners() {
    if (!listenersAttached) return;
    
    canvas.removeEventListener('mousedown', mousedownHandler);
    canvas.removeEventListener('mouseup', mouseupHandler);
    canvas.removeEventListener('contextmenu', contextmenuHandler);
    canvas.removeEventListener('wheel', wheelHandler);
    document.removeEventListener('keydown', keydownHandler);
    document.removeEventListener('keyup', keyupHandler);
    window.removeEventListener('resize', resizeCanvas);
    
    listenersAttached = false;
}

//  VECTOR CLASS ---------------------------------
class Vector2 {
    constructor(x = 0.0, y = 0.0) {
        this.x = x; 
        this.y = y;
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
    normalize() {
        const len = this.length();
        if (len > 0) {
            this.x /= len;
            this.y /= len;
        }
        return this;
    }
}

//  COORDINATE CONVERSION  -----------
function cX(pos) {
    return pos.x * cScale;
}
function cY(pos) {
    return canvas.height - pos.y * cScale;
}

// Smooth a closed path using Chaikin's corner cutting algorithm
function smoothPath(points, iterations) {
    if (points.length < 3) return points;
    
    let smoothed = [...points];
    
    for (let iter = 0; iter < iterations; iter++) {
        const newPoints = [];
        const len = smoothed.length;
        
        for (let i = 0; i < len; i++) {
            const p1 = smoothed[i];
            const p2 = smoothed[(i + 1) % len]; // Wrap around for closed path
            
            // Create two new points between each pair
            // Q: 75% of p1 + 25% of p2
            newPoints.push({
                x: 0.75 * p1.x + 0.25 * p2.x,
                y: 0.75 * p1.y + 0.25 * p2.y
            });
            
            // R: 25% of p1 + 75% of p2
            newPoints.push({
                x: 0.25 * p1.x + 0.75 * p2.x,
                y: 0.25 * p1.y + 0.75 * p2.y
            });
        }
        
        smoothed = newPoints;
    }
    
    return smoothed;
}

//  SPATIAL HASH GRID CLASS ---------------------------------------------------------------------
class SpatialHashGrid {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }
    
    // Convert position to grid key
    getKey(x, y) {
        const gridX = Math.floor(x / this.cellSize);
        const gridY = Math.floor(y / this.cellSize);
        return `${gridX},${gridY}`;
    }
    
    // Clear the grid
    clear() {
        this.grid.clear();
    }
    
    // Add boid to grid (initial insertion)
    insert(boid) {
        const key = this.getKey(boid.pos.x, boid.pos.y);
        if (!this.grid.has(key)) {
            this.grid.set(key, []);
        }
        this.grid.get(key).push(boid);
        boid.gridKey = key; // Store current grid key on boid
    }
    
    // Update boid position in grid (incremental update)
    updateBoid(boid) {
        const newKey = this.getKey(boid.pos.x, boid.pos.y);
        
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
    
    // Remove boid from grid
    remove(boid) {
        if (boid.gridKey && this.grid.has(boid.gridKey)) {
            const cell = this.grid.get(boid.gridKey);
            const index = cell.indexOf(boid);
            if (index !== -1) {
                cell[index] = cell[cell.length - 1];
                cell.pop();
                if (cell.length === 0) {
                    this.grid.delete(boid.gridKey);
                }
            }
            boid.gridKey = null;
        }
    }
    
    // Get nearby boids within a radius
    getNearby(boid, radius) {
        const nearby = [];
        const cellRadius = Math.ceil(radius / this.cellSize);
        const centerX = Math.floor(boid.pos.x / this.cellSize);
        const centerY = Math.floor(boid.pos.y / this.cellSize);
        
        // Check all cells in square pattern - actual distance filtering happens later
        for (let dx = -cellRadius; dx <= cellRadius; dx++) {
            for (let dy = -cellRadius; dy <= cellRadius; dy++) {
                const key = `${centerX + dx},${centerY + dy}`;
                if (this.grid.has(key)) {
                    const cellBoids = this.grid.get(key);
                    // Direct iteration instead of spread for better performance
                    for (let i = 0; i < cellBoids.length; i++) {
                        nearby.push(cellBoids[i]);
                    }
                }
            }
        }
        return nearby;
    }
}

//  CREATE SPATIAL GRID  ---------------------------------
function makeSpatialGrid() {
    // Optimal cell size: visualRange/2 ensures 3x3 cell queries with good boid distribution
    SpatialGrid = new SpatialHashGrid(boidProps.visualRange / 2);
}

// DEGREES TO RADIANS  ---------------------------------
function rads(theta) {
    return theta * Math.PI / 180;
};

function getDegrees(theta) {
    return (theta * 180) / Math.PI;
};

//  DRAW ARROW FUNCTION  ---------------------------------
function drawArrow(posX, posY, angle, radius, arrowOpacity) {
// 0 degreees is up, angles rotate counterclockwise
/*var arrow = {
    radius: radius,
    // 1 bottom right
    //a1cos: Math.cos(rads(281.86) + angle), //0.2055
    //a1sin: Math.sin(rads(281.86) + angle), //-0.9786
    a1cos: 0.2055,
    a1sin: -0.9786,
    r1: 0.5109,
    // 2 right inside corner
    //a2cos: Math.cos(rads(43.6) + angle), //0.7233
    //a2sin: Math.sin(rads(43.6) + angle), //0.6905
    a2cos: 0.7233,
    a2sin: 0.6905,
    r2: 0.1450,
    // 3 right tip
    //a3cos: Math.cos(rads(16.86) + angle), //0.9563
    //a3sin: Math.sin(rads(16.86) + angle), //0.2924
    a3cos: 0.9563,
    a3sin: 0.2924,
    r3: 0.3448,
    // 4 top
    //a4cos: Math.cos(rads(90) + angle), //0
    //a4sin: Math.sin(rads(90) + angle), //1
    a4cos: 0.0,
    a4sin: 1.0,
    r4: 0.5,
    // 5 left tip
    //a5cos: Math.cos(rads(163.14) + angle), //-0.9563
    //a5sin: Math.sin(rads(163.14) + angle), //0.2924
    a5cos: -0.9563,
    a5sin: 0.2924,
    r5: 0.3448,
    // 6 left inside corner
    //a6cos: Math.cos(rads(136.4) + angle), //-0.7233
    //a6sin: Math.sin(rads(136.4) + angle), //-0.6905
    a6cos: -0.7233,
    a6sin: -0.6905,
    r6: 0.1450,
    // 7 bottom left
    //a7cos: Math.cos(rads(258.14) + angle), //-0.2055
    //a7sin: Math.sin(rads(258.14) + angle), //-0.9786
    a7cos: -0.2055,
    a7sin: -0.9786,
    r7: 0.5109,
    // 8 bottom center
    //a8cos: Math.cos(rads(270) + angle), //-1.0
    //a8sin: Math.sin(rads(270) + angle), //0.0
    a8cos: -1.0,
    a8sin: 0.0,
    r8: 0.5
    };*/

    c.save();
    c.translate(posX * cScale, posY * cScale);
    c.rotate(rads(-angle + 90)); // Rotate to point in the correct direction

    c.beginPath();
    c.moveTo((radius * 0.5109 * 0.2055) * cScale,
        (-radius * 0.5109 * -0.9786) * cScale);
    c.lineTo((radius * 0.1450 * 0.7233) * cScale,
        (-radius * 0.1450 * 0.6905) * cScale);
    c.lineTo((radius * 0.3448 * 0.9563) * cScale,
        (-radius * 0.3448 * 0.2924) * cScale);
    c.lineTo((radius * 0.5 * 0.0) * cScale,
        (-radius * 0.5 * 1.0) * cScale);
    c.lineTo((radius * 0.3448 * -0.9563) * cScale,
        (-radius * 0.3448 * 0.2924) * cScale);
    c.lineTo((radius * 0.1450 * -0.7233) * cScale,
        (radius * 0.1450 * -0.6905) * cScale);
    c.lineTo((radius * 0.5109 * -0.2055) * cScale,
        (-radius * 0.5109 * -0.9786) * cScale);
    c.closePath();

    c.fillStyle = `hsla(210, 50%, 50%, ${arrowOpacity})`;
    c.fill();
    c.strokeStyle = `hsla(0, 0%, 90%, ${arrowOpacity})`;
    c.lineWidth = 2.0;
    c.stroke();

    c.restore();
}

//  SPRAY PARTICLE CLASS ---------------------------------------------------------------------
class SprayParticle {
    constructor(x, y, hue, saturation, lightness) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 0.3; // Random velocity
        this.vy = (Math.random() - 0.5) * 0.3;
        this.hue = hue;
        this.saturation = saturation;
        this.lightness = lightness;
        this.size = Math.random() * 0.002 + 0.001; // Start small
        this.maxSize = Math.random() * 0.006 + 0.004; // Max size to grow to
        this.life = 1.0; // Full life
        this.decay = 0.5 + Math.random() * 0.5; // Decay speed
    }
    
    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= this.decay * dt;
        // Grow the particle
        if (this.size < this.maxSize) {
            this.size += 0.08 * dt;
        }
        return this.life > 0; // Return true if still alive
    }
    
    draw() {
        const alpha = Math.max(0, this.life);
        c.fillStyle = `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${alpha * 0.6})`;
        c.beginPath();
        c.arc(cX({x: this.x}), cY({y: this.y}), this.size * cScale, 0, 2 * Math.PI);
        c.fill();
    }
}

class HEART {
    constructor(pos, vel) {
        this.pos = pos.clone();
        this.vel = vel.clone();
        this.radius = 0.01;
        this.hue = 320;
        this.alpha = 0;
        this.birthday = Date.now();
        this.lifespan = 250 + Math.random() * 400; // 250-650ms 
    }
    simulate() {
        // Move based on velocity
        this.pos.x += this.vel.x * deltaT;
        this.pos.y += this.vel.y * deltaT;
        
        // Slow down over time
        this.vel.x *= 0.98;
        this.vel.y *= 0.98;
        
        // Get age ratio (0 at birth, 1 at end of lifespan)
        const age = Date.now() - this.birthday;
        const ageRatio = age / this.lifespan;
        
        // Fade in during first 20% of life, fade out during last 20%
        if (ageRatio < 0.05) {
            this.alpha = ageRatio / 0.05;
        } else if (ageRatio > 0.8) {
            this.alpha = (1 - ageRatio) / 0.2;
        } else {
            this.alpha = 1;
        }
        
        /*// Grow radius during first 30% of life
        const maxRadius = 0.03;
        if (ageRatio < 0.3) {
            this.radius = 0.02 + (maxRadius - 0.02) * (ageRatio / 0.5);
        }*/

        this.radius += 0.0007; // Slight growth over time
        
        // Remove if lifespan exceeded and fully faded
        if (age > this.lifespan && this.alpha <= 0) {
            const index = Hearts.indexOf(this);
            if (index > -1) {
                Hearts.splice(index, 1);
            }
        }
    }
    draw() {
        drawHeart(this.pos.x, simHeight - this.pos.y, this.radius);
        c.fillStyle = `hsla(${this.hue}, 100%, 60%, ${this.alpha})`;
        c.fill();
    }
}

// DRAW HEART FUNCTION  ---------------------------------
function drawHeart(posX, posY, radius) {
    c.beginPath();
    c.moveTo(posX * cScale, (posY - 0.5 * radius) * cScale);
    for (var f = 0; f < Math.PI - 0.8; f += 0.1) {
            var drawX = posX + 0.08 * radius * 16 * Math.pow(Math.sin(f), 3);
            var drawY = posY - 0.08 * radius * (13 * Math.cos(f) - 5 * Math.cos(2 * f) - 2 * Math.cos(3 * f) - Math.cos(4 * f));   
            c.lineTo(drawX * cScale, drawY * cScale);
        }
        var f = Math.PI - 0.8;
        var drawX = posX + 0.08 * radius * 16 * Math.pow(Math.sin(f), 3);
        var drawY = posY - 0.08 * radius * (13 * Math.cos(f) - 5 * Math.cos(2 * f) - 2 * Math.cos(3 * f) - Math.cos(4 * f));   
        c.lineTo(drawX * cScale, drawY * cScale);
        c.lineTo(drawX * cScale, drawY * cScale);
    c.lineTo(posX * cScale, (posY + 1.15 * radius) * cScale);   
    for (var f = Math.PI + 0.8; f < 2 * Math.PI; f += 0.1) {
        var drawX = posX + 0.08 * radius * 16 * Math.pow(Math.sin(f), 3);
        var drawY = posY - 0.08 * radius * (13 * Math.cos(f) - 5 * Math.cos(2 * f) - 2 * Math.cos(3 * f) - Math.cos(4 * f));   
        c.lineTo(drawX * cScale, drawY * cScale);
        }
    c.closePath();
}

// RAINDROP CLASS  -----------------------------------------------------
class RAINDROP {
    constructor (pos, vel) {
        this.pos = pos.clone();
        this.vel = vel.clone();
        this.hue = 200;
        this.saturation = 60;
        this.lightness = 50;
    }
    simulate() {
        this.vel.y -= 1 * deltaT;  // gravity effect
        this.pos.add(this.vel, deltaT);
        if (this.pos.y < 0) {
            for (let i = 0; i < Rain.length; i++) {
                if (Rain[i] === this) {
                    Rain.splice(i, 1);
                    break;
                }
            }
        }
    }
    draw() {
        c.save();
        c.translate(cX(this.pos), cY(this.pos));
        const radScale = 0.035 * cScale;

        // Draw airfoil  -----------
        const numPoints = 14; 
        const a = 0.2;
        const b = 1.5;
        const pivotOffsetX = 0;
        const pivotOffsetY = -b * radScale;  // Centroid of bulb head
        c.beginPath();  
        for (let i = 0; i <= numPoints; i++) {
            const t = Math.PI / 2 + (i / numPoints) * (2 * Math.PI);
            const x = (2 * a * Math.cos(t) - a * Math.sin(2 * t)) * radScale;
            const y = b * Math.sin(t) * radScale;
            if (i === 0) {
                c.moveTo(x - pivotOffsetX, -y - pivotOffsetY);
            } else {
                c.lineTo(x - pivotOffsetX, -y - pivotOffsetY);
            }
        }  
        c.closePath();
        const gradient = c.createRadialGradient(
            -a * radScale * 0.5,
            b * radScale * 1.5,
            0,
            -a * radScale * 0.5,
            b * radScale * 1.5,
            b * radScale  * 3.0);
        gradient.addColorStop(0, 'hsla(180, 100%, 70%, 0.5)');
        gradient.addColorStop(0.05, 'hsla(180, 100%, 40%, 0.4)');
        gradient.addColorStop(1, 'hsla(180, 50%, 20%, 0.1)');
        c.fillStyle = gradient;
        
        c.fill();
        c.strokeStyle = `hsl(${this.hue}, ${this.saturation}%, ${this.lightness}%)`;
        c.lineWidth = 1.0;
        //c.stroke();

        c.restore();
    }
}

// Make it rain at specified position -----------------------------------------------------
Rain = [];
function makeItRain(cloud) {
    const pos = new Vector2(
        cloud.x + (Math.random() - 0.5) * 2.2 * cloud.radius,
        cloud.y - (Math.random() - 0.5) * 0.2 * cloud.radius);
    const vel = new Vector2(
        -cloud.speed,
        -0);
    Rain.push(new RAINDROP(pos, vel));
}

//  HOT AIR BALLOON CLASS  -----------------------------------------------------
class HOTAIRBALLOON {
    constructor (radius, pos, vel) {
        this.pos = pos.clone();
        this.vel = vel.clone();
        this.radius = radius;
    }
    simulate() {
        this.pos.add(this.vel, deltaT);
        if (this.pos.x < -2 * this.radius) {
            this.pos.x = simWidth + 2 * this.radius;
            this.pos.y = 0.6 * simHeight + Math.random() * 0.3 * simHeight;
        }
    }
    draw() {
        const radScale = this.radius * cScale;
        const balloonRadius = 0.2 * radScale + (this.pos.x / simWidth) * 0.3 * radScale;
        c.save();
        c.translate(cX(this.pos), cY(this.pos));
        
        // draw balloon as spherical with a net over the top half, like a vintage hot air balloon
        // Sphere is centered at (0, -0.5 * balloonRadius) with radius balloonRadius
        const sphereCenterY = -0.5 * balloonRadius;
        const balloonLightness = 30 + (this.pos.x / simWidth) * 30;
        const gradient = c.createRadialGradient(
            -balloonRadius * 0.3,
            sphereCenterY + balloonRadius * 0.4, 
            0, 
            0, 
            sphereCenterY, 
            balloonRadius * 1.2);
        gradient.addColorStop(0, `hsl(180, 80%, ${balloonLightness}%)`);
        gradient.addColorStop(1, `hsl(220, 60%, ${0.60 * balloonLightness}%)`);
        c.fillStyle = gradient;

        // Draw round top
        c.beginPath();
        c.arc(
            0,
            sphereCenterY,
            balloonRadius,   
            0, 
            2 * Math.PI);
        c.fill();
        c.strokeStyle = `hsla(30, 0%, 20%, 0.7)`;
        c.lineWidth = 0.03 * balloonRadius;
        c.stroke();

        // draw bottom ellipse
        c.beginPath();
        c.ellipse(
            0,
            sphereCenterY,
            balloonRadius,
            balloonRadius * 1.3,
            0,
            Math.PI,
            2 * Math.PI,
            true);
            
        c.lineWidth = 0.022 * balloonRadius;
        c.fill();
        c.strokeStyle = `hsla(30, 0%, 20%, 0.7)`;
        c.stroke();

        // Draw net over top half of balloon (viewed from horizontal side angle)
        const sphereTop = sphereCenterY - balloonRadius;
        const sphereEquator = sphereCenterY;
        
        // Vertical meridian lines - evenly spaced from equator, from top to equator
        const verticalLines = 8;
        //c.strokeStyle = `hsla(30, 50%, 10%, 0.7)`;
        //c.lineWidth = 0.75;
        for (let i = 0; i <= verticalLines; i++) {
            // Evenly space along visible arc of equator (from -π/2 to +π/2)
            const angle = (i / verticalLines - 0.5) * Math.PI; // -π/2 to +π/2
            c.beginPath();
            for (let j = 0; j <= 20; j++) {
                const t = j / 20; // 0 at top, 1 at equator
                const currentAngle = -Math.PI / 2 + t * (Math.PI / 2); // -90° to 0°
                const cosCurrentAngle = Math.cos(currentAngle);
                const x = balloonRadius * Math.sin(angle) * cosCurrentAngle;
                const y = sphereCenterY + balloonRadius * Math.sin(currentAngle);
                if (j === 0) {
                    c.moveTo(x, y);
                } else {
                    c.lineTo(x, y);
                }
            }
            // Calculate intersection with equator ellipse
            const equatorX = balloonRadius * Math.sin(angle);
            const equatorEllipseY = sphereEquator + balloonRadius * 0.3 * Math.sqrt(1 - (equatorX / balloonRadius) ** 2);
            c.lineTo(equatorX, equatorEllipseY);
            c.stroke();
        }
        
        // Horizontal latitude lines - circular arcs at different heights
        const horizontalLines = 3;
        c.lineWidth = 0.03 * balloonRadius;
        for (let i = 1; i <= horizontalLines; i++) {
            const t = i / (horizontalLines + 1); // Position from top to equator
            const currentAngle = -Math.PI / 2 + t * (Math.PI / 2); // -90° to 0°
            const yPos = sphereCenterY + balloonRadius * Math.sin(currentAngle);
            const circleRadius = balloonRadius * Math.cos(currentAngle);
            
            // Draw front half of ellipse only (omit rear arcs)
            c.beginPath();
            c.ellipse(0, yPos, circleRadius, circleRadius * 0.3, 0, -0.1, Math.PI + 0.1);
            c.stroke();
        }
        
        // Draw thicker equator band
        c.beginPath();
        c.ellipse(0, sphereEquator, balloonRadius, balloonRadius * 0.3, 0, -0.1, Math.PI + 0.1);
        //c.strokeStyle = `hsla(30, 0%, 10%, 0.7)`;
        //c.lineWidth = 0.03 * balloonRadius;
        c.stroke();
        
        // Draw basket with rounded corners and cylindrical shading
        const basketWidth = balloonRadius * 0.5;
        const basketHeight = balloonRadius * 0.4;
        const basketY = 1.4 * balloonRadius + basketHeight * 0.5;
        const cornerRadius = basketWidth * 0.15;

        // Connect meridian line endpoints to basket with draped cables
        c.strokeStyle = `hsla(30, 0%, 20%, 0.7)`;
        c.lineWidth = 0.022 * balloonRadius;
        const basketTop = basketY - basketHeight / 2;
        for (let i = 0; i <= verticalLines; i++) {
            const angle = (i / verticalLines - 0.5) * Math.PI;
            
            const normalizedPos = Math.abs(i / verticalLines - 0.5) * 2; // 0 at center, 1 at edges
            
            // For only the outermost cables, attach below the equator
            let connectionX, connectionY;
            if (normalizedPos > 0.8) {
                // Only the very outer cables attach progressively lower
                const verticalOffset = (normalizedPos - 0.8) / 0.2 * (Math.PI / 12); // Up to 15° below equator for outermost
                const connectionAngle = verticalOffset; // below equator
                const connY = sphereCenterY + balloonRadius * Math.sin(connectionAngle);
                const circleRadiusAtHeight = balloonRadius * Math.cos(connectionAngle);
                connectionX = circleRadiusAtHeight * Math.sin(angle);
                // Project onto ellipse for side view
                connectionY = connY + circleRadiusAtHeight * 0.3 * Math.sqrt(Math.max(0, 1 - (Math.sin(angle)) ** 2));
            } else {
                // Most cables attach at equator
                const equatorX = balloonRadius * Math.sin(angle);
                connectionX = equatorX;
                connectionY = sphereEquator + balloonRadius * 0.3 * Math.sqrt(Math.max(0, 1 - (equatorX / balloonRadius) ** 2));
            }
            
            // Connect to basket - distribute connections evenly along basket width
            const basketX = (i / verticalLines - 0.5) * basketWidth;
            
            // Draw draped cable using quadratic curve
            c.beginPath();
            c.moveTo(connectionX, connectionY);
            
            // Create draping curve with control point offset
            const midX = (connectionX + basketX) / 2;
            const midY = (connectionY + basketTop) / 2;
            // Add drape - how much the cable sags (much more for outer cables)
            const drape = balloonRadius * 0.25 * (1 + normalizedPos * normalizedPos * 1.5);
            const controlY = midY + drape; // Drape downward (positive Y is down from balloon)
            
            c.quadraticCurveTo(midX, controlY, basketX, basketTop);
            c.stroke();
        }

        // draw bottom ellipse
        c.beginPath();
        c.ellipse(
            0,
            sphereCenterY,
            balloonRadius,
            balloonRadius * 1.3,
            0,
            Math.PI,
            2 * Math.PI,
            true);
            
        c.lineWidth = 0.03 * balloonRadius;
        c.strokeStyle = `hsla(30, 0%, 20%, 0.7)`;
        c.stroke();

        // Draw basket as 3D cylinder with elliptical top and bottom
        const basketTopRadiusX = basketWidth / 1.8;
        const basketTopRadiusY = basketTopRadiusX * 0.3; // Ellipse compression for 3D view
        const basketBottomRadiusX = basketTopRadiusX * 0.8; // Bottom 90% as wide
        const basketBottomRadiusY = basketTopRadiusY * 0.8;
        //const basketTop = basketY - basketHeight / 2;
        const basketBottom = basketY + basketHeight / 2;
        
        // Create linear gradient for cylindrical appearance
        const basketGradient = c.createLinearGradient(
            -basketWidth / 2, 0,
            basketWidth / 2, 0
        );
        basketGradient.addColorStop(0, `hsl(30, 60%, 20%)`);
        basketGradient.addColorStop(0.4, `hsl(30, 70%, 35%)`);
        basketGradient.addColorStop(0.45, `hsl(30, 70%, 35%)`);
        basketGradient.addColorStop(1, `hsl(30, 60%, 20%)`);

        // Draw bottom ellipse (darkest - furthest from light)
        c.fillStyle = `hsl(30, 50%, 15%)`;
        c.beginPath();
        c.ellipse(
            0, 
            basketBottom, 
            basketBottomRadiusX, 
            basketBottomRadiusY, 
            0, 
            Math.PI, 
            Math.PI * 2,
            true);
        c.fill();
        c.beginPath();
        c.ellipse(
            0, 
            basketBottom, 
            basketBottomRadiusX, 
            basketBottomRadiusY, 
            0, 
            0, 
            Math.PI * 2,
            true);
        c.strokeStyle = `hsl(30, 40%, 10%)`;
        c.lineWidth = 0.05 * balloonRadius;
        c.stroke();

        // Draw basket as filled shape
        c.fillStyle = basketGradient;
        c.beginPath();
        c.moveTo(-basketTopRadiusX, basketTop + basketTopRadiusY);
        c.lineTo(-basketBottomRadiusX, basketBottom);
        c.ellipse(0, basketBottom, basketBottomRadiusX, basketBottomRadiusY, 0, Math.PI, 0, true);
        c.lineTo(basketBottomRadiusX, basketBottom);
        c.lineTo(basketTopRadiusX, basketTop + basketTopRadiusY);
        c.ellipse(0, basketTop, basketTopRadiusX, basketTopRadiusY, 0, 0, Math.PI, true);
        c.closePath();
        c.fill();
        
        // Draw top ellipse stroke (interior visible edge)
        c.beginPath();
        c.ellipse(
            0, 
            basketTop, 
            basketTopRadiusX, 
            basketTopRadiusY, 
            0, 
            0, 
            Math.PI * 2);
        c.fillStyle = `hsl(30, 30%, 15%)`;
        c.fill();
        
        // Draw top front ellipse stroke 
        c.beginPath();
        c.ellipse(
            0, 
            basketTop, 
            basketTopRadiusX, 
            basketTopRadiusY, 
            0, 
            0, 
            Math.PI * 2);
        c.strokeStyle = `hsl(30, 40%, 40%)`;
        c.lineWidth = 0.03 * balloonRadius;
        c.stroke();

        // Draw wicker pattern on basket
        c.strokeStyle = `hsl(30, 70%, 20%)`;
        c.lineWidth = 0.01 * balloonRadius;
        
        // Horizontal wicker strands
        const wickerRows = 7;
        for (let i = 0; i <= wickerRows; i++) {
            const t = i / wickerRows;
            const y = basketTop + basketHeight * t;
            const topRadius = basketTopRadiusX - (basketTopRadiusX - basketBottomRadiusX) * t;
            const vertRadius = (basketTopRadiusY - (basketTopRadiusY - basketBottomRadiusY) * t) * 0.95;
            
            c.beginPath();
            c.ellipse(0, y, topRadius * 0.95, vertRadius, 0, 0.02, Math.PI - 0.02);
            c.stroke();
        }
        
        // Vertical wicker strands
        const wickerColumns = 9;
        for (let i = 0; i <= wickerColumns; i++) {
            const angle = (i / wickerColumns) * Math.PI;
            const xTop = Math.cos(angle) * basketTopRadiusX * 0.95;
            const xBottom = Math.cos(angle) * basketBottomRadiusX * 0.95;
            
            // Calculate starting y position on the visible top rim ellipse
            const topRimOffset = basketTopRadiusY * Math.sin(angle);
            const startY = basketTop + topRimOffset;
            
            // Calculate ending y position on the visible bottom rim ellipse
            const bottomRimOffset = basketBottomRadiusY * Math.sin(angle);
            const endY = basketBottom + bottomRimOffset;
            
            c.beginPath();
            c.moveTo(xTop, startY);
            
            for (let j = 1; j <= 10; j++) {
                const t = j / 10;
                const y = basketTop + basketHeight * t;
                const x = xTop + (xBottom - xTop) * t;
                const offsetY = (basketTopRadiusY - (basketTopRadiusY - basketBottomRadiusY) * t) * 0.6;
                const waveFactor = Math.sin(t * Math.PI) * 0.15;
                
                c.lineTo(x, y + offsetY * waveFactor);
            }
            
            c.lineTo(xBottom, endY);
            c.stroke();
        }

        // Draw bunny in basket
        const bunnyScale = basketTopRadiusX;
        const maxEarHeight = bunnyScale * 1.2;
        const earHeight = maxEarHeight;
        const headRadius = bunnyScale * 0.48;
        const earWidth = bunnyScale * 0.12;
        const earSpacing = bunnyScale * 0.15;
        
        // Position bunny head inside basket
        const headY = basketTop + basketHeight * 0.1;
        
        const earBottomY = headY - headRadius * 0.3;
        const earTopY = earBottomY - earHeight;
        const earCenterY = (earBottomY + earTopY) / 2;
        
        // Draw left ear
        const leftEarGradient = c.createLinearGradient(0, earTopY, 0, earBottomY);
        leftEarGradient.addColorStop(0, 'hsl(195, 75%, 85%)');
        leftEarGradient.addColorStop(0.5, 'hsl(200, 70%, 75%)');
        leftEarGradient.addColorStop(1, 'hsl(205, 65%, 65%)');
        c.fillStyle = leftEarGradient;
        c.beginPath();
        const leftEarX = -earSpacing * 2.0;
        const leftEarW = earWidth * 1.5;
        const leftEarH = earHeight / 2;
        c.save();
        c.translate(leftEarX, earCenterY);
        c.rotate(-0.18);
        // Create airfoil shape - rounded tip at top, wider at bottom
        c.moveTo(0, -leftEarH);
        c.bezierCurveTo(leftEarW * 0.6, -leftEarH, leftEarW * 0.85, -leftEarH * 0.6, leftEarW * 0.9, -leftEarH * 0.2);
        c.bezierCurveTo(leftEarW, leftEarH * 0.3, leftEarW * 0.7, leftEarH * 0.85, 0, leftEarH);
        c.bezierCurveTo(-leftEarW * 0.7, leftEarH * 0.85, -leftEarW, leftEarH * 0.3, -leftEarW * 0.9, -leftEarH * 0.2);
        c.bezierCurveTo(-leftEarW * 0.85, -leftEarH * 0.6, -leftEarW * 0.6, -leftEarH, 0, -leftEarH);
        c.closePath();
        c.fill();
        c.strokeStyle = 'hsl(200, 50%, 55%)';
        c.lineWidth = 0.003 * cScale;
        c.stroke();
        c.restore();
        
        // Draw left inner ear
        c.fillStyle = 'hsl(195, 65%, 90%)';
        c.beginPath();
        const leftInnerW = earWidth * 0.75;
            const leftInnerH = earHeight / 2 * 0.7;
            
        c.save();

        c.translate(leftEarX, earCenterY);
        c.rotate(-0.18);
        c.moveTo(0, -leftInnerH);
        c.bezierCurveTo(leftInnerW * 0.6, -leftInnerH, leftInnerW * 0.85, -leftInnerH * 0.6, leftInnerW * 0.9, -leftInnerH * 0.2);
        c.bezierCurveTo(leftInnerW, leftInnerH * 0.3, leftInnerW * 0.7, leftInnerH * 0.85, 0, leftInnerH);
        c.bezierCurveTo(-leftInnerW * 0.7, leftInnerH * 0.85, -leftInnerW, leftInnerH * 0.3, -leftInnerW * 0.9, -leftInnerH * 0.2);
        c.bezierCurveTo(-leftInnerW * 0.85, -leftInnerH * 0.6, -leftInnerW * 0.6, -leftInnerH, 0, -leftInnerH);
        c.closePath();
        c.fill();

        c.restore();
            
        // Draw right ear
        const rightEarGradient = c.createLinearGradient(0, earTopY, 0, earBottomY);
        rightEarGradient.addColorStop(0, 'hsl(195, 75%, 85%)');
        rightEarGradient.addColorStop(0.5, 'hsl(200, 70%, 75%)');
        rightEarGradient.addColorStop(1, 'hsl(205, 65%, 65%)');
        c.fillStyle = rightEarGradient;
        c.beginPath();
        const rightEarX = earSpacing * 2.0;
        const rightEarW = earWidth * 1.5;
        const rightEarH = earHeight / 2;

        c.save();

        c.translate(rightEarX, earCenterY);
        c.rotate(0.18);
        // Create airfoil shape - rounded tip at top, wider at bottom
        c.moveTo(0, -rightEarH);
        c.bezierCurveTo(rightEarW * 0.6, -rightEarH, rightEarW * 0.85, -rightEarH * 0.6, rightEarW * 0.9, -rightEarH * 0.2);
        c.bezierCurveTo(rightEarW, rightEarH * 0.3, rightEarW * 0.7, rightEarH * 0.85, 0, rightEarH);
        c.bezierCurveTo(-rightEarW * 0.7, rightEarH * 0.85, -rightEarW, rightEarH * 0.3, -rightEarW * 0.9, -rightEarH * 0.2);
        c.bezierCurveTo(-rightEarW * 0.85, -rightEarH * 0.6, -rightEarW * 0.6, -rightEarH, 0, -rightEarH);
        c.closePath();
        c.fill();
        c.strokeStyle = 'hsl(200, 50%, 55%)';
        c.lineWidth = 0.003 * cScale;
        c.stroke();
        c.restore();
        
        // Draw right inner ear
        c.fillStyle = 'hsl(195, 65%, 90%)';
        c.beginPath();
        const rightInnerW = earWidth * 0.75;
        const rightInnerH = earHeight / 2 * 0.7;
        c.save();
        c.translate(rightEarX, earCenterY);
        c.rotate(0.18);
        c.moveTo(0, -rightInnerH);
        c.bezierCurveTo(rightInnerW * 0.6, -rightInnerH, rightInnerW * 0.85, -rightInnerH * 0.6, rightInnerW * 0.9, -rightInnerH * 0.2);
        c.bezierCurveTo(rightInnerW, rightInnerH * 0.3, rightInnerW * 0.7, rightInnerH * 0.85, 0, rightInnerH);
        c.bezierCurveTo(-rightInnerW * 0.7, rightInnerH * 0.85, -rightInnerW, rightInnerH * 0.3, -rightInnerW * 0.9, -rightInnerH * 0.2);
        c.bezierCurveTo(-rightInnerW * 0.85, -rightInnerH * 0.6, -rightInnerW * 0.6, -rightInnerH, 0, -rightInnerH);
        c.closePath();
        c.fill();

        c.restore();
        
        // Draw bunny head
        const headGradient = c.createRadialGradient(-headRadius * 0.3, headY - headRadius * 0.3, 0, 0, headY, headRadius);
        headGradient.addColorStop(0, 'hsl(195, 70%, 85%)');
        headGradient.addColorStop(0.7, 'hsl(200, 65%, 75%)');
        headGradient.addColorStop(1, 'hsl(205, 60%, 65%)');
        
        c.fillStyle = headGradient;
        c.beginPath();
        c.arc(
            0, 
            headY, 
            headRadius, 
            Math.PI * 0.9, 
            Math.PI * 2.1,
        false);
        c.fill();
        
        // Draw eyes
        const eyeY = headY - headRadius * 0.22;
        const eyeSpacing = headRadius * 0.4;
        const eyeWidth = headRadius * 0.2;
        const eyeHeight = headRadius * 0.35;
        const pupilWidth = headRadius * 0.1014;
        const pupilHeight = headRadius * 0.2028;
        const eyeAngle = 0.15;
        const pupilOffsetY = headRadius * 0.05;
        const pupilOffsetX = headRadius * 0.02;
        
        // Left eye
        c.fillStyle = 'white';
        c.beginPath();
        c.ellipse(-eyeSpacing, eyeY, eyeWidth, eyeHeight, -eyeAngle, 0, Math.PI * 2);
        c.fill();
        
        c.fillStyle = 'hsl(210, 60%, 30%)';
        c.beginPath();
        c.ellipse(-eyeSpacing + pupilOffsetX, eyeY + pupilOffsetY, pupilWidth, pupilHeight, -eyeAngle, 0, Math.PI * 2);
        c.fill();
        
        c.fillStyle = 'white';
        c.beginPath();
        c.arc(-eyeSpacing + pupilOffsetX - pupilWidth * 0.3, eyeY + pupilOffsetY - pupilHeight * 0.6, headRadius * 0.04, 0, Math.PI * 2);
        c.fill();
        
        // Right eye
        c.fillStyle = 'white';
        c.beginPath();
        c.ellipse(eyeSpacing, eyeY, eyeWidth, eyeHeight, eyeAngle, 0, Math.PI * 2);
        c.fill();
        
        c.fillStyle = 'hsl(210, 60%, 30%)';
        c.beginPath();
        c.ellipse(eyeSpacing - pupilOffsetX, eyeY + pupilOffsetY, pupilWidth, pupilHeight, eyeAngle, 0, Math.PI * 2);
        c.fill();
        
        c.fillStyle = 'white';
        c.beginPath();
        c.arc(eyeSpacing - pupilOffsetX + pupilWidth * 0.3, eyeY + pupilOffsetY - pupilHeight * 0.6, headRadius * 0.04, 0, Math.PI * 2);
        c.fill();

        // Draw top front ellipse stroke 
        c.beginPath();
        c.ellipse(
            0, 
            basketTop, 
            basketTopRadiusX, 
            basketTopRadiusY, 
            0, 
            Math.PI, 
            Math.PI * 2,
            true);
        c.strokeStyle = `hsl(30, 40%, 60%)`;
        c.lineWidth = 0.03 * balloonRadius;
        c.stroke();
        
        c.restore();
    }
}

// make hot air balloon --------------------------------
function makeHotAirBalloon() {
    HotAirBalloon = [];
    const radius = 0.25;
    const pos = new Vector2(
        1.2 * simWidth, 
        //0.6 * simHeight + Math.random() * 0.3 *simHeight); 
        0.15 * simHeight + 0.75 * Math.random() * simHeight);
    const vel = new Vector2(
        -0.01, 
        (Math.random() - 0.5) * 0.007);
    HotAirBalloon.push(new HOTAIRBALLOON(radius, pos, vel));
}

// BALLOON CLASS ---------------------------------------------------------------------
class BALLOON {
    constructor (pos, vel) {
        this.pos = pos.clone();
        this.vel = vel.clone();
        this.radius = 0.15;
        this.originalRadius = 0.15; // Store original size for string length when popping
        this.hue = 360 * Math.random();
        this.saturation = 40 + Math.random() * 60;
        this.lightness = 40 + Math.random() * 30;
        this.stringPhase = Math.random() * Math.PI * 2; // Random starting phase for wave
        this.popping = false;
        this.tumbleAngle = 0; // Rotation angle for knot tumbling when popped
    }
    simulate() {
        if (this.popping) {
            // When popping, balloon collapses and falls
            const timeSincePop = (performance.now() - this.popStartTime) / 1000; // in seconds
            
            // Collapse the balloon rapidly
            this.radius = Math.max(0.01, 0.15 * (1 - Math.min(timeSincePop * 2, 1)));
            
            // Fall downward with gravity
            this.vel.y -= 0.8 * deltaT; // Strong downward acceleration
            this.vel.x *= 0.98; // Slight horizontal dampening
            
            // Tumble the knot
            this.tumbleAngle += deltaT * 8; // Rotate at 8 radians per second
            
            // Remove balloon when it falls off bottom of screen
            if (this.pos.y < -0.5) {
                const index = Balloons.indexOf(this);
                if (index > -1) {
                    Balloons.splice(index, 1);
                }
            }
        } else {
            // Normal floating behavior
            this.vel.y += 0.001;
        }
        
        this.pos.add(this.vel, deltaT);
        this.stringPhase += deltaT * 3; // Animate the wave
        
        if (this.pos.y > simHeight + 5 * this.radius) {
            // remove balloon from array when it goes off top
            const index = Balloons.indexOf(this);
            if (index > -1) {
                Balloons.splice(index, 1);
            }
        }
    }
    draw() {
        const radScale = this.radius * cScale;
        // Use original radius for string length so it doesn't shrink when popping
        const originalRadScale = this.originalRadius * cScale;
        const stringLength = originalRadScale * 3.5;
        const startY = 0.6 * radScale;
        const segments = 20;

        c.save();
        c.translate(cX(this.pos), cY(this.pos));

        // Always draw the knot at balloon connection
        // Position knot below the balloon body (less negative Y = lower)
        const knotStartY = this.popping ? (-0.3 * originalRadScale) : startY;
        
        // Draw knot at fixed position when not popping
        if (!this.popping) {
            // Draw vertical part of knot at balloon connection
            c.fillStyle = `hsl(${this.hue}, 40%, 30%)`;
            c.beginPath();
            c.ellipse(
                0, 
                startY + radScale * 0.15,
                radScale * 0.08,
                radScale * 0.12,
                0, 
                0, 
                2 * Math.PI);
            c.fill();
            
            // Draw horizontal part of knot at balloon connection
            c.fillStyle = `hsl(${this.hue}, 40%, 20%)`;
            c.beginPath();
            c.ellipse(
                0, 
                startY + radScale * 0.22,
                radScale * 0.12,
                radScale * 0.06,
                0, 
                0, 
                2 * Math.PI);
            c.fill();
        }

        // draw arced string around knot (only when not popping)
        if (!this.popping) {
            c.beginPath();
            const squeeze = 0.3 * Math.PI
            c.arc(0, startY + originalRadScale * 0.02, originalRadScale * 0.15, 0 + squeeze, Math.PI - squeeze, false);
            c.strokeStyle = 'hsl(0, 0%, 80%)';
            c.lineWidth = 2.0;
            c.stroke();
        }

        // Draw string with wave (trails behind when falling)
        c.strokeStyle = 'hsl(0, 0%, 80%)';
        c.lineWidth = 2.0;
        c.beginPath();
        
        // Calculate string start position (where knot will be when popping)
        let stringStartY;
        
        // Store all points first for smooth curve drawing
        const points = [];
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            let y, x;
            
            if (this.popping) {
                // U-turn animation: knot falls and drags string down smoothly
                const timeSincePop = (performance.now() - this.popStartTime) / 1000;
                
                // Knot is at t=0, string extends downward (t increases = further from knot)
                const knotBottomY = knotStartY + originalRadScale * 0.58;
                
                // Original string position (hanging down from knot)
                const originalStringY = knotBottomY + stringLength * t;
                
                // Simplified physics: each segment lags behind based on distance from knot
                // The further from knot, the more delay in responding to the fall
                const delay = t * 0.5; // Segments lag proportionally to distance
                const effectiveTime = Math.max(0, timeSincePop - delay);
                
                // Each segment falls with the same gravity, just delayed
                const fallAcceleration = 0.7;
                const fallDistance = 0.5 * fallAcceleration * effectiveTime * effectiveTime * cScale;
                
                // Far segments (higher t) create upward curve due to delay
                y = originalStringY + fallDistance;
                
                // Store the first segment position for knot placement (t=0)
                if (i === 0) {
                    stringStartY = y;
                }
                
                const amplitude = originalRadScale * 0.4 * t * t;
                x = originalRadScale * 0.065 + Math.sin(this.stringPhase + t * Math.PI * 2) * amplitude;
            } else {
                // Normal downward string
                y = (startY + originalRadScale * 0.18) + stringLength * t;
                const amplitude = originalRadScale * 0.3 * t * t;
                x = originalRadScale * 0.065 + Math.sin(this.stringPhase + t * Math.PI * 2) * amplitude;
            }
            
            points.push({x, y});
        }
        
        // Draw smooth curve through points using quadratic curves
        if (points.length > 0) {
            c.moveTo(points[0].x, points[0].y);
            
            for (let i = 1; i < points.length; i++) {
                if (i < points.length - 1) {
                    // Use quadratic curve with control point at current point
                    const xc = (points[i].x + points[i + 1].x) / 2;
                    const yc = (points[i].y + points[i + 1].y) / 2;
                    c.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
                } else {
                    // Last point - draw straight to it
                    c.quadraticCurveTo(points[i].x, points[i].y, points[i].x, points[i].y);
                }
            }
        }
        c.stroke();
        
        // Draw knot at the start of string when popping (so it moves with the string)
        if (this.popping && stringStartY !== undefined) {
            // Save context and apply rotation for tumbling effect
            c.save();
            c.translate(0, stringStartY - originalRadScale * 0.095);
            c.rotate(this.tumbleAngle);
            
            // Reposition knot to follow the string as it falls
            c.fillStyle = `hsl(${this.hue}, 40%, 30%)`;
            c.beginPath();
            c.ellipse(
                0, 
                -originalRadScale * 0.035,
                originalRadScale * 0.08,
                originalRadScale * 0.12,
                0, 
                0, 
                2 * Math.PI);
            c.fill();
            
            c.fillStyle = `hsl(${this.hue}, 40%, 20%)`;
            c.beginPath();
            c.ellipse(
                0, 
                originalRadScale * 0.035,
                originalRadScale * 0.12,
                originalRadScale * 0.06,
                0, 
                0, 
                2 * Math.PI);
            c.fill();
            
            c.restore();
        }
        
        // Draw balloon (collapsed when popping)
        if (this.popping) {
            // Draw wrinkled/collapsed balloon shape at top, around knot
            const timeSincePop = (performance.now() - this.popStartTime) / 1000;
            const collapseAmount = Math.min(timeSincePop * 2, 1);
            
            c.fillStyle = `hsla(${this.hue}, ${this.saturation}%, ${this.lightness * 0.5}%, ${0.6 * (1 - collapseAmount)})`;
            c.strokeStyle = `hsla(${this.hue}, 50%, 30%, ${0.8 * (1 - collapseAmount)})`;
            c.lineWidth = 2;
            
            // Draw crumpled shape above/around the knot
            c.beginPath();
            const points = 8;
            const balloonScrapY = knotStartY + originalRadScale * 0.2; // Above the knot
            for (let i = 0; i < points; i++) {
                const angle = (i / points) * Math.PI * 2;
                const radiusVariation = 0.5 + Math.sin(angle * 3 + timeSincePop * 10) * 0.3;
                const px = Math.cos(angle) * originalRadScale * 0.3 * radiusVariation;
                const py = balloonScrapY + Math.sin(angle) * originalRadScale * 0.2 * radiusVariation;
                if (i === 0) {
                    c.moveTo(px, py);
                } else {
                    c.lineTo(px, py);
                }
            }
            c.closePath();
            c.fill();
            c.stroke();
        } else {
            // Draw normal inflated balloon
            const gradient = c.createRadialGradient(
                -radScale * 0.25,
                -radScale * 0.7, 
                0, 
                0, 
                -radScale * 0.3, 
                1.2 *radScale);
            gradient.addColorStop(0, `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, 0.8)`);
            gradient.addColorStop(1, `hsla(${this.hue}, ${this.saturation * 0.75}%, 10%, 1.0)`);
            c.fillStyle = gradient;
            c.beginPath();
            c.ellipse(
                0, 
                -radScale * 0.3, 
                radScale * 0.8, 
                radScale, 
                0, 
                0, 
                2 * Math.PI);
            c.fill();
            c.strokeStyle = `hsl(${this.hue}, 50%, 30%)`;
            c.lineWidth = 2;
            c.stroke();
        }

        // draw tiny particles around circumference, moving outward when popping 
        if (this.popping) {
            const particleCount = 60;
            for (let i = 0; i < particleCount; i++) {
                const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
                const distance = radScale * (1.0 + Math.random() * 0.5 + (performance.now() - this.popStartTime) / 200);
                const particleX = Math.cos(angle) * distance;
                const particleY = -radScale * 0.3 + Math.sin(angle) * distance;
                const particleRadius = Math.max(radScale * 0.01, radScale * 0.05 * (1.0 - (performance.now() - this.popStartTime) / 500));
                
                c.fillStyle = `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${1.0 - (performance.now() - this.popStartTime) / 500})`;
                c.beginPath();
                c.arc(particleX, particleY, particleRadius, 0, Math.PI * 2);
                c.fill();
            }
        }
        
        c.restore();
    }
    contains(x, y) {
        // Balloon body is an ellipse centered at (0, -radScale * 0.3) with radii (radScale * 0.8, radScale)
        const dx = x - this.pos.x;
        const dy = y - (this.pos.y - 0.3 * this.radius);
        // Check if point is inside ellipse: (dx/rx)^2 + (dy/ry)^2 <= 1
        const rx = this.radius * 0.8;
        const ry = this.radius;
        return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
    }
}

// initialize balloon --------------------------------
function initBalloon() {
    Balloons = [];
    balloonProps = {
        balloonInitialDelay: 10.0, // Delay before first balloon spawns (0 = immediate)
        balloonSpawnInterval: 50.0 // Time between balloon spawns after first one (seconds)
    } 
    balloonSpawnTimer = -balloonProps.balloonInitialDelay;
}

// spawn balloon --------------------------------
function spawnBalloon() {
    const pos = new Vector2(.1 * simWidth + Math.random() * 0.8 *simWidth, -0.3);
    const vel = new Vector2((Math.random() - 0.5) * 0.3, Math.random() * 0.3);
    Balloons.push(new BALLOON(pos, vel));
    
    // Increase cheerfulness of sad or rainy foreground clouds when balloons spawn
    for (let cloud of ForegroundCloud) {
        if ((cloud.sadness > 0 || cloud.isRaining) && cloud.cheerfulness < 100) {
            cloud.cheerfulness = Math.min(100, cloud.cheerfulness + 2);
            
            // Also reduce sadness as the cloud cheers up
            // Every 20% cheerfulness reduces sadness by 1 (at 100% cheerfulness, sadness becomes 0)
            const targetSadness = Math.max(0, cloud.sadness - Math.floor(cloud.cheerfulness / 20));
            if (cloud.sadness > targetSadness) {
                cloud.sadness = targetSadness;
            }
            
            // Stop raining when fully recovered (100% cheerfulness and 0 sadness)
            if (cloud.cheerfulness >= 100 && cloud.sadness === 0) {
                cloud.isRaining = false;
            }
            
            cloud.renderToCanvas(); // Re-render cloud with new appearance
        }
    }
}   

//  CLOUD CLASS ---------------------------------------------------------------------
class CLOUD {
    constructor(x, y, isBackground = false, isForeground = false, isRaining = false, showTutorial = false) {
        this.x = x;
        this.y = y;
        this.isBackground = isBackground;
        this.isForeground = isForeground;
        this.isRaining = isRaining;
        this.cheerfulness = 0; // 0-100, increases as balloons are spawned
        this.sadness = isRaining ? 10 : 0; // 0-10, if initially raining, start at max sadness
        this.visualSadness = isRaining ? 10 : 0; // Smoothly animates to match sadness for visual transitions
        this.faceOpacity = isRaining ? 1 : 0; // Fade in face when first balloon is popped
        // Blinking state
        this.blinkCount = 0; // Number of blinks completed
        this.blinkTimer = 0; // Timer for blink animation
        this.isBlinking = false; // Currently in a blink
        this.hasTriggeredBlink = false; // Prevents re-triggering
        this.hasFadeBlink = false; // Tracks blink when rainbow starts fading
        // Tutorial message for first user-created cloud
        this.showTutorialMessage = showTutorial;
        this.tutorialMessageTime = showTutorial ? 5.0 : 0; // 5 seconds
        this.tutorialMessageOpacity = showTutorial ? 1.0 : 0;
        // Foreground clouds are largest, background smallest, normal in between
        if (this.isForeground) {
            this.radius = 0.25;
            this.speed = 0.10;
        } else if (this.isBackground) {
            this.radius = 0.07;
            this.speed = 0.02;
        } else {
            this.radius = 0.15;
            this.speed = 0.04 + 2 * (-0.5 + Math.random()) * 0.008; // 20% variation
        }
        // Create unique cloud shape using true randomness (changes on refresh)
        this.seed = Math.random();
        this.generatePuffs();
        this.renderToCanvas();
    }
    generatePuffs() {
        const numPuffs = 4;
        this.puffData = [];
        
        // Use seed to create deterministic but varied random values
        let rng = this.seed;
        const seededRandom = () => {
            rng = (rng * 9301 + 49297) % 233280;
            return rng / 233280;
        };
        
        // Create cloud-like arrangement with horizontal spread
        for (let i = 0; i < numPuffs; i++) {
            if (i < 3) {
                // First 3 puffs form the base with flat bottom
                // Horizontal position: spread across the width with variation
                const offsetX = -0.7 + (i / 2) * 1.4 + (seededRandom() - 0.5) * 0.05;
                
                // Size variation
                const size = 0.6 + seededRandom() * 0.3;
                
                // Vertical position: constrained to be close to the crop line
                const offsetY = 0.3 + (seededRandom() - 0.5) * 0.4;
                
                this.puffData.push({
                    offsetX: offsetX,
                    offsetY: offsetY,
                    size: size
                });
            } else {
                // Fourth puff adds height - positioned above the crop line
                const offsetX = -0.2 + (seededRandom() - 0.5) * 0.4; // More centered
                const size = 0.5 + seededRandom() * 0.25; // Slightly smaller
                const offsetY = -0.3 + (seededRandom() - 0.5) * 0.2; // Positioned higher (negative = up)
                
                this.puffData.push({
                    offsetX: offsetX,
                    offsetY: offsetY,
                    size: size
                });
            }
        }
    }
    contains(x, y) {
        // Calculate the crop line position
        const r = this.radius;
        const cropY = this.y + r * 0.5;
        
        // Don't collide below the crop line
        if (y > cropY) return false;
        
        // Elliptical collision - wider horizontally than vertically
        const dx = (x - this.x) / (r * 1.5); // 1.5x wider horizontally
        const dy = (y - this.y) / r;
        return (dx * dx + dy * dy) < 1;
    }
    renderToCanvas() {
        // Create offscreen canvas sized for the cloud
        const r = this.radius * cScale;
        const padding = 30;
        const size = r * 3 + padding * 2;
        
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCanvas.width = size;
        this.offscreenCanvas.height = size;
        const ctx = this.offscreenCanvas.getContext('2d');
        
        // Center position in offscreen canvas
        const cx = size / 2;
        const cy = size / 2;
        
        // Build puffs array
        const puffs = this.puffData.map(puff => ({
            x: cx + r * puff.offsetX,
            y: cy + r * puff.offsetY,
            r: r * puff.size,
            data: puff
        }));
        
        puffs.sort((a, b) => a.x - b.x);
        
        const bottomY = Math.max(...puffs.map(puff => puff.y + puff.r * 0.5));
        
        ctx.save();
        
        // Create clipping region
        const leftmost = Math.min(...puffs.map(p => p.x - p.r)) - 20;
        const rightmost = Math.max(...puffs.map(p => p.x + p.r)) + 20;
        const topmost = Math.min(...puffs.map(p => p.y - p.r)) - 20;
        
        ctx.beginPath();
        ctx.rect(leftmost, topmost, rightmost - leftmost, bottomY - topmost + 2.5);
        ctx.clip();

        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        // Draw outline strokes (darker for background clouds, lighter for foreground)
        if (this.isForeground && !this.isRaining) {
            // Darken based on visualSadness (85% at 0 sadness, 35% at 10 sadness)
            const sadnessLightness = 85 - (this.visualSadness / 10) * 50;
            const sadnessSaturation = 85 - (this.visualSadness / 10) * 65; // 85% to 20%
            ctx.strokeStyle = `hsl(200, ${sadnessSaturation}%, ${sadnessLightness}%)`;
            ctx.lineWidth = 16;
        } else if (this.isForeground && this.isRaining) {
            // When raining, continue from current sadness colors and brighten with cheerfulness
            // Use same formula as non-raining for sadness component
            const sadnessLightness = 85 - (this.visualSadness / 10) * 50; // Same as non-raining
            const sadnessSaturation = 85 - (this.visualSadness / 10) * 65;
            const cheerLightness = 85;
            const cheerSaturation = 85;
            const lightness = sadnessLightness + (this.cheerfulness / 100) * (cheerLightness - sadnessLightness);
            const saturation = sadnessSaturation + (this.cheerfulness / 100) * (cheerSaturation - sadnessSaturation);
            ctx.strokeStyle = `hsl(200, ${saturation}%, ${lightness}%)`;
            ctx.lineWidth = 16;
        } else if (this.isBackground) {
            ctx.strokeStyle = 'hsl(200, 30%, 50%)';
            ctx.lineWidth = 6;
        } else {
            ctx.strokeStyle = 'hsl(200, 80%, 80%)';
            ctx.lineWidth = 12;
        }
        
        for (let puff of puffs) {
            ctx.beginPath();
            ctx.arc(puff.x, puff.y, puff.r, 0, 2 * Math.PI);
            ctx.lineCap = 'round';
            ctx.stroke();
            ctx.lineCap = 'butt';
        }
        
        // Fill all puffs (darker for background clouds, white for others)
        if (this.isBackground) {
            ctx.fillStyle = 'hsl(0, 0%, 65%)';
        } else if (this.isForeground && !this.isRaining) {
            // Darken based on visualSadness (100% at 0 sadness, 55% at 10 sadness)
            const lightness = 100 - (this.visualSadness / 10) * 45;
            ctx.fillStyle = `hsl(0, 0%, ${lightness}%)`;
        } else if (this.isForeground && this.isRaining) {
            // When raining, continue from current sadness colors and brighten with cheerfulness
            const sadnessLightness = 100 - (this.visualSadness / 10) * 45; // Same as non-raining
            const cheerLightness = 100;
            const lightness = sadnessLightness + (this.cheerfulness / 100) * (cheerLightness - sadnessLightness);
            ctx.fillStyle = `hsl(0, 0%, ${lightness}%)`;
        } else {
            ctx.fillStyle = 'hsl(0, 0%, 95%)';
        }
        for (let puff of puffs) {
            ctx.beginPath();
            ctx.arc(puff.x, puff.y, puff.r, 0, 2 * Math.PI);
            ctx.fill();
        }

        ctx.restore();
        
        // Fill bottom edge area to cover any visible puff arcs
        ctx.save();
        if (this.isBackground) {
            ctx.fillStyle = 'hsl(0, 0%, 65%)';
        } else if (this.isForeground && !this.isRaining) {
            // Darken based on visualSadness (100% at 0 sadness, 55% at 10 sadness)
            const lightness = 100 - (this.visualSadness / 10) * 45;
            ctx.fillStyle = `hsl(0, 0%, ${lightness}%)`;
        } else if (this.isForeground && this.isRaining) {
            // When raining, continue from current sadness colors and brighten with cheerfulness
            const sadnessLightness = 100 - (this.visualSadness / 10) * 45; // Same as non-raining
            const cheerLightness = 100;
            const lightness = sadnessLightness + (this.cheerfulness / 100) * (cheerLightness - sadnessLightness);
            ctx.fillStyle = `hsl(0, 0%, ${lightness}%)`;
        } else {
            ctx.fillStyle = 'hsl(0, 0%, 95%)';
        }
        
        // Draw filled rectangles at bottom edge to cover gaps between puffs
        for (let i = 0; i < puffs.length - 1; i++) {
            const leftPuff = puffs[i];
            const rightPuff = puffs[i + 1];
            const fillHeight = 15; // Height of fill area
            ctx.fillRect(
                leftPuff.x + leftPuff.r * 0.3,
                bottomY - fillHeight,
                rightPuff.x - leftPuff.x - (leftPuff.r * 0.3) - (rightPuff.r * 0.3),
                fillHeight
            );
        }
        ctx.restore();
        
        // Draw bottom edge (darker for background clouds)
        const bottomTraceY = bottomY + 1;
        if (this.isBackground) {
            ctx.strokeStyle = 'hsla(200, 30%, 50%, 1)';
            ctx.lineWidth = 3;
        } else if (this.isForeground && !this.isRaining) {
            // Darken based on visualSadness (85% at 0 sadness, 35% at 10 sadness)
            const sadnessLightness = 85 - (this.visualSadness / 10) * 50;
            const sadnessSaturation = 85 - (this.visualSadness / 10) * 65;
            ctx.strokeStyle = `hsla(200, ${sadnessSaturation}%, ${sadnessLightness}%, 1)`;
            ctx.lineWidth = 7;
        } else if (this.isForeground && this.isRaining) {
            // When raining, continue from current sadness colors and brighten with cheerfulness
            const sadnessLightness = 85 - (this.visualSadness / 10) * 50; // Same as non-raining
            const sadnessSaturation = 85 - (this.visualSadness / 10) * 65;
            const cheerLightness = 85;
            const cheerSaturation = 85;
            const lightness = sadnessLightness + (this.cheerfulness / 100) * (cheerLightness - sadnessLightness);
            const saturation = sadnessSaturation + (this.cheerfulness / 100) * (cheerSaturation - sadnessSaturation);
            ctx.strokeStyle = `hsla(200, ${saturation}%, ${lightness}%, 1)`;
            ctx.lineWidth = 7;
        } else {
            ctx.strokeStyle = 'hsla(200, 80%, 80%, 1)';
            ctx.lineWidth = 5;
        }
        
        // Draw single continuous line from leftmost to rightmost point at bottom
        ctx.beginPath();
        let leftmostX = Infinity;
        let rightmostX = -Infinity;
        
        for (let i = 0; i < puffs.length; i++) {
            const puff = puffs[i];
            const dy = bottomY - puff.y;
            if (dy < puff.r && dy > -puff.r) {
                const ratio = Math.min(1, Math.max(-1, dy / puff.r));
                const angle = Math.acos(ratio);
                const extend = puff.r * 0.055; // Small extension beyond edge
                const leftX = puff.x - puff.r * Math.sin(angle) - (i === 0 ? extend : 0);
                const rightX = puff.x + puff.r * Math.sin(angle) + (i === puffs.length - 1 ? extend : 0);
                leftmostX = Math.min(leftmostX, leftX);
                rightmostX = Math.max(rightmostX, rightX);
            }
        }
        
        if (leftmostX !== Infinity && rightmostX !== -Infinity) {
            ctx.moveTo(leftmostX, bottomTraceY);
            ctx.lineTo(rightmostX, bottomTraceY);
        }
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.lineCap = 'butt';
        
        // Store the offset for drawing
        this.offsetX = size / 2;
        this.offsetY = size / 2;
    }
    update(dt) {
        // Move cloud from right to left
        this.x -= this.speed * dt;
        
        // Smoothly interpolate visualSadness to match target sadness
        if (this.visualSadness !== this.sadness) {
            const sadnessChangeSpeed = 2.0; // Units per second
            const diff = this.sadness - this.visualSadness;
            if (Math.abs(diff) < sadnessChangeSpeed * dt) {
                this.visualSadness = this.sadness;
            } else {
                this.visualSadness += Math.sign(diff) * sadnessChangeSpeed * dt;
            }
            // Re-render when visual sadness changes
            this.renderToCanvas();
        }
        
        // Trigger blink animation when reaching 100% cheerfulness and rainbow is complete
        if (this.isForeground && this.cheerfulness === 100 && rainbowArcProgress >= 1.0 && !this.hasTriggeredBlink) {
            this.hasTriggeredBlink = true;
            this.blinkTimer = 0;
            this.isBlinking = true;
        }
        
        // Update blink animation
        if (this.isBlinking) {
            this.blinkTimer += dt;
            const blinkDuration = 0.15; // Duration of one blink (close and open)
            const pauseBetweenBlinks = 0.2; // Pause between blinks
            const cycleTime = blinkDuration + pauseBetweenBlinks; // Total time for one blink cycle
            
            // Complete first blink and start second
            if (this.blinkTimer > cycleTime && this.blinkCount === 0) {
                this.blinkCount = 1;
                this.blinkTimer = 0; // Reset timer for second blink
            }
            // Complete second blink
            else if (this.blinkTimer > blinkDuration && this.blinkCount === 1) {
                this.blinkCount = 2;
                this.isBlinking = false;
            }
        }
        
        // Update tutorial message timer
        if (this.showTutorialMessage && this.tutorialMessageTime > 0) {
            this.tutorialMessageTime -= dt;
            if (this.tutorialMessageTime <= 0) {
                this.tutorialMessageOpacity = 0;
                this.showTutorialMessage = false;
            } else if (this.tutorialMessageTime < 1.0) {
                // Fade out during last second
                this.tutorialMessageOpacity = this.tutorialMessageTime;
            }
        }
    }
    draw() {
        const cx = this.x * cScale;
        const cy = canvas.height - this.y * cScale;

        // Draw overhead rainbow on foreground clouds when they stop raining
        if (this.isForeground && this.cheerfulness == 100) {
            // Reset rainbow state when starting a new rainbow
            if (rainbowArcProgress === 0 && rainbowFullyFormedTime > 0) {
                rainbowFullyFormedTime = 0;
                rainbowOpacity = 1.0;
                this.hasFadeBlink = false; // Reset fade blink flag for next cycle
            }
            
            const radScale = this.radius * cScale;
            const rainbowRadius = radScale * 0.8;
            const rainbowWidth = radScale * 0.7;
            //const rainbowColors = [
            //    "red", "orange", "yellow", "green",
            //    "blue", "indigo", "violet"
            //];
            // make array with colors having transparency
            const rainbowColors = [
                `hsla(0, 100%, 50%, ${0.7 * rainbowOpacity})`,
                `hsla(30, 100%, 50%, ${0.7 * rainbowOpacity})`,
                `hsla(60, 100%, 50%, ${0.7 * rainbowOpacity})`,
                `hsla(120, 100%, 40%, ${0.7 * rainbowOpacity})`,
                `hsla(240, 100%, 50%, ${0.7 * rainbowOpacity})`,
                `hsla(275, 100%, 50%, ${0.7 * rainbowOpacity})`,
                `hsla(300, 100%, 50%, ${0.7 * rainbowOpacity})`
            ];
            const arcCount = rainbowColors.length;
            c.lineWidth = rainbowWidth / arcCount;

            c.lineCap = 'round';
            for (let i = 0; i < arcCount; i++) {
                c.beginPath();
                c.arc(
                    cx, 
                    cy - radScale * 0.4, 
                    rainbowRadius + i * (rainbowWidth / arcCount), 
                    0.8 * Math.PI, 
                    0.8 * Math.PI + 1.4 * rainbowArcProgress * Math.PI, 
                    false
                );
                var arcColor = rainbowColors[i];
                c.strokeStyle = arcColor;
                c.stroke();
            }
            
            // Spawn hearts rapidly at the leading edge of the rainbow as it grows
            if (rainbowArcProgress < 1.0 && Math.random() < rainbowHeartSpawnRate) {
                const heartsPerFrame = 5;
                const leadingEdgeAngle = 0.8 * Math.PI + 1.4 * rainbowArcProgress * Math.PI;
                for (let h = 0; h < heartsPerFrame; h++) {
                    // Spawn hearts at different radii across the rainbow band thickness
                    const radiusWorld = (rainbowRadius + Math.random() * rainbowWidth) / cScale;
                    const heartX = this.x + radiusWorld * Math.cos(leadingEdgeAngle);
                    const heartY = this.y + (this.radius * 0.4) - radiusWorld * Math.sin(leadingEdgeAngle);
                    const pos = new Vector2(heartX, heartY);
                    const vel = new Vector2(
                        this.speed * deltaT-0.5 + Math.random() * 1.0, 
                        -0.5 + Math.random() * 1.0
                    );
                    
                    Hearts.push(new HEART(pos, vel));
                }
            }
            
            rainbowArcProgress += deltaT * 0.25; 
            if (rainbowArcProgress > 1.0) {
                rainbowArcProgress = 1.0;
                // Record the time when rainbow becomes fully formed
                if (rainbowFullyFormedTime === 0) {
                    rainbowFullyFormedTime = Date.now();
                }
            }
            
            // Fade out rainbow after 3 seconds of being fully formed
            if (rainbowFullyFormedTime > 0) {
                const timeElapsed = (Date.now() - rainbowFullyFormedTime) / 1000; // seconds
                if (timeElapsed > 3) {
                    const fadeTime = timeElapsed - 3;
                    rainbowOpacity = Math.max(0, 1.0 - fadeTime * 0.5); // Fade over 2 seconds
                    
                    // Trigger double-blink when rainbow has completely faded (after 6 seconds total)
                    if (rainbowOpacity === 0 && !this.hasFadeBlink) {
                        this.hasFadeBlink = true;
                        this.blinkTimer = 0;
                        this.isBlinking = true;
                        this.blinkCount = 0; // Reset to trigger new blinks
                    }
                }
            }
        }

        // Draw Hearts
        for (let heart of Hearts) {
            heart.draw();
        }

        // Draw the pre-rendered cloud image
        c.drawImage(this.offscreenCanvas, cx - this.offsetX, cy - this.offsetY);
        
        // Draw face on foreground clouds when sad (balloons popped) or rainy/cheerful
        // Keep face visible during blink animation even after rain stops
        const shouldShowFace = this.isForeground && (this.sadness > 0 || this.isRaining || this.cheerfulness > 0 || this.blinkCount < 2);
        
        if (shouldShowFace) {
            // Fade in face when first balloon is popped or when raining
            if ((this.sadness > 0 || this.isRaining || this.cheerfulness > 0) && this.faceOpacity < 1) {
                this.faceOpacity = Math.min(1, this.faceOpacity + deltaT * 2);
            }
            
            const r = this.radius * cScale;
            const faceY = cy + r * 0.1;
            const eyeOffsetX = r * 0.2;
            const eyeOffsetY = r * 0.1;
            const eyeRadiusX = r * 0.05;
            const eyeRadiusY = r * 0.08;
            
            // Determine if eyes should be closed (during blink)
            const blinkDuration = 0.15;
            const pauseBetweenBlinks = 0.2;
            const cycleTime = blinkDuration + pauseBetweenBlinks;
            const isEyesClosed = this.isBlinking && this.blinkTimer < blinkDuration;
            
            // Make eyes larger between first and second blink
            const isBetweenBlinks = this.isBlinking && this.blinkCount === 0 && this.blinkTimer > blinkDuration && this.blinkTimer < cycleTime;
            const eyeScale = isBetweenBlinks ? 1.3 : 1.0;
            
            const faceAlpha = this.faceOpacity;
            
            if (isEyesClosed) {
                // Draw closed eyes as horizontal lines
                c.strokeStyle = `hsla(0, 0%, 10%, ${faceAlpha})`;
                c.lineWidth = 3;
                c.lineCap = 'round';
                
                // Left eye closed
                c.beginPath();
                c.moveTo(cx - eyeOffsetX - eyeRadiusX, faceY - eyeOffsetY);
                c.lineTo(cx - eyeOffsetX + eyeRadiusX, faceY - eyeOffsetY);
                c.stroke();
                
                // Right eye closed
                c.beginPath();
                c.moveTo(cx + eyeOffsetX - eyeRadiusX, faceY - eyeOffsetY);
                c.lineTo(cx + eyeOffsetX + eyeRadiusX, faceY - eyeOffsetY);
                c.stroke();
                
                c.lineCap = 'butt';
            } else {
                // Draw open eyes (scaled between blinks)
                c.fillStyle = `hsla(0, 0%, 10%, ${faceAlpha})`;
                c.beginPath();
                c.ellipse(cx - eyeOffsetX, faceY - eyeOffsetY, eyeRadiusX * eyeScale, eyeRadiusY * eyeScale, 0, 0, 2 * Math.PI);
                c.fill();
                
                c.beginPath();
                c.ellipse(cx + eyeOffsetX, faceY - eyeOffsetY, eyeRadiusX * eyeScale, eyeRadiusY * eyeScale, 0, 0, 2 * Math.PI);
                c.fill();
            }
            
            // Mouth shape based on sadness level (when balloons popped) or cheerfulness (when raining/happy)
            c.beginPath();
            // Use cheerfulness-based mouth if cheerfulness > 0, otherwise use sadness-based mouth
            if (this.visualSadness > 0 && this.cheerfulness === 0) {
                // Sadness progression: horizontal line -> frown -> pout (smoothly animated)
                const baseMouthWidth = r * 0.25;
                const baseMouthHeight = r * 0.05;
                
                if (this.visualSadness <= 1) {
                    // Horizontal line for first balloon (interpolate to flat)
                    const flatAmount = this.visualSadness; // 0-1
                    const mouthY = faceY + r * 0.1;
                    c.moveTo(cx - baseMouthWidth / 2, mouthY);
                    c.lineTo(cx + baseMouthWidth / 2, mouthY);
                } else if (this.visualSadness <= 2) {
                    // Transition from flat to frown (slight downward curve)
                    const frownAmount = this.visualSadness - 1; // 0-1
                    const mouthY = faceY + r * 0.1;
                    c.moveTo(cx - baseMouthWidth / 2, mouthY);
                    c.quadraticCurveTo(cx, mouthY - baseMouthHeight * 0.3 * frownAmount, cx + baseMouthWidth / 2, mouthY);
                } else {
                    // Deeper frown morphing to pout (sadness 2-10)
                    const poutyAmount = Math.min(1.0, (this.visualSadness - 2) / 2); // 0 at sadness 2, 1.0 at sadness 4+
                    const mouthWidth = baseMouthWidth;
                    const mouthY = faceY + r * 0.1 + (poutyAmount * r * 0.04);
                    c.moveTo(cx - mouthWidth / 2, mouthY);
                    c.quadraticCurveTo(cx, faceY + r * 0.1 - baseMouthHeight * (0.5 + poutyAmount * 0.5), cx + mouthWidth / 2, faceY + r * 0.1);
                }
            } else {
                // Original cheerfulness-based mouth (pouty -> happy for balloon spawning)
                const cheerRatio = this.cheerfulness / 100; // 0 = pouty, 1 = happy
                const baseMouthWidth = r * 0.25;
                const baseMouthHeight = r * 0.05;
                
                if (cheerRatio < 0.5) {
                    // Pouty mouth (curves down) - original shape
                    const poutyAmount = (1 - cheerRatio * 2); // 1 at 0%, 0 at 50%
                    const mouthWidth = baseMouthWidth; // Keep constant width during pout
                    const mouthY = faceY + r * 0.1 + (poutyAmount * r * 0.04); // r * 0.14 at 0%, r * 0.1 at 50%
                    c.moveTo(cx - mouthWidth / 2, mouthY);
                    c.quadraticCurveTo(cx, faceY + r * 0.1 - baseMouthHeight * poutyAmount, cx + mouthWidth / 2, faceY + r * 0.1);
                } else {
                    // Smile phase (50% to 100%) - grows wider from base width
                    const smileAmount = (cheerRatio - 0.5) * 2; // 0 at 50%, 1 at 100%
                    const mouthWidth = baseMouthWidth * (1.0 + smileAmount * 0.2); // Grows from 100% to 120% of base
                    const controlY = faceY + r * 0.1 + smileAmount * baseMouthHeight * 4.0;
                    c.moveTo(cx - mouthWidth / 2, faceY + r * 0.1);
                    c.quadraticCurveTo(cx, controlY, cx + mouthWidth / 2, faceY + r * 0.1);
                }
            }
            c.strokeStyle = `hsla(0, 0%, 10%, ${faceAlpha})`;
            c.lineWidth = 4;
            c.lineCap = 'round';
            c.stroke();
            c.lineCap = 'butt';
        }
        
        // Draw text only on initial foreground cloud during its first pass
        if (this.isForeground && initialForegroundCloudTextVisible) {
            const r = this.radius * cScale;
            c.fillStyle = 'hsl(200, 60%, 30%)';
            c.font = `bold ${r * 0.4}px monospace`;
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.fillText("B 0 I D S", cx, cy + r * 0.25);
        }
        
        // Draw tutorial message
        if (this.showTutorialMessage && this.tutorialMessageOpacity > 0) {
            const r = this.radius * cScale;
            c.save();
            
            // Draw text with shadow for readability
            c.font = `italic ${r * 0.22}px sans-serif`;
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            
            const textY = cy + r * 0.3; // Position lower on cloud
            
            // Draw shadow
            c.strokeStyle = `hsla(0, 0%, 0%, ${this.tutorialMessageOpacity * 0.3})`;
            c.lineWidth = 2;
            c.strokeText('Drag clouds with mouse', cx, textY);
            
            // Draw text in dark blue
            c.fillStyle = `hsla(210, 80%, 30%, ${this.tutorialMessageOpacity})`;
            c.fillText('Drag clouds with mouse', cx, textY);
            
            c.restore();
        }
    }
}

//  MOVING AIRPLANE CLASS ---------------------------------------------------------------------
class AIRPLANE {
    constructor(y, speed, size, respawnDelay, passNumber) {
        // On first five passes, try to spawn above the topmost cloud
        if (passNumber <= 5) {
            this.y = this.pickAltitudeAboveClouds();
        } else {
            // Randomize vertical position avoiding cloud elevations
            this.y = this.pickSafeAltitude();
        }
        this.baseY = this.y; // Store initial y for loop calculation
        this.speed = speed; // Units per second
        this.baseSpeed = speed; // Store base speed
        this.size = size; // Width/height of the cloud
        this.radius = size * 0.7; // Effective radius for collision detection
        this.respawnDelay = respawnDelay; // Seconds to wait before respawning
        this.isWaiting = false;
        this.waitTimer = 0;
        this.initialDelay = passNumber === 1 ? 6.0 : 0; // Wait 6 seconds before first pass starts moving
        this.propellerAngle = 0; // For spinning propeller effect
        this.angle = 0; // Current orientation angle
        this.isUpsideDown = false; // Whether plane is flying upside-down
        
        // Determine if plane should be upside-down (only if in top 30% and NOT in first four passes)
        const topThreshold = simHeight * 0.7; // 30% from top
        if (passNumber > 5 && this.y > topThreshold) {
            this.isUpsideDown = Math.random() < 0.5; // 50% chance
            if (this.isUpsideDown) {
                this.angle = Math.PI; // Start upside-down
            }
        }
        
        // Direction: 1 = left to right, -1 = right to left
        // Pass 1: right to left, Pass 2: left to right, Pass 3: right to left, Pass 4: left to right
        if (passNumber === 1) {
            this.direction = -1;
            this.x = simWidth + size; // Start from right
        } else if (passNumber === 2) {
            this.direction = 1;
            this.x = -size; // Start from left
        } else if (passNumber === 3) {
            this.direction = -1;
            this.x = simWidth + size; // Start from right
        } else if (passNumber === 4) {
            this.direction = 1;
            this.x = -size; // Start from left
        } else if (passNumber === 5) {
            this.direction = -1;
            this.x = simWidth + size; // Start from right
        } else {
            this.direction = 1;
            this.x = -size; // Start from left
        }
        
        // Set image based on direction and upside-down state
        if (this.isUpsideDown) {
            // Upside-down: use reverse image for right-going, normal for left-going
            this.image = this.direction === 1 ? kittyPlaneReverseImage : kittyPlaneImage;
        } else {
            // Right-side up: use normal image for right-going, reverse for left-going
            this.image = this.direction === 1 ? kittyPlaneImage : kittyPlaneReverseImage;
        }
        
        // Loop-the-loop parameters (clothoid trajectory)
        this.loopStartX = 0.4 * simWidth; // Where the loop begins
        this.loopRadius = 0.35 * simHeight; // Radius of the loop
        this.loopPhase = 0; // Current phase through the loop (0 = before, 1-2 = during, 3+ = after)
        this.pathDistance = 0; // Total distance traveled
        this.loopProgress = 0; // Progress through the loop (0 to 1)
        this.willDoLoop = false; // Whether this pass will do a loop
        this.loopDecided = false; // Whether we've decided about the loop yet
        
        // Propeller trails
        this.propTrail1 = []; // Trail for first blade tip
        this.propTrail2 = []; // Trail for second blade tip
        this.maxTrailLength = 120; // Number of trail points to keep
        
        // Banner properties
        this.passNumber = passNumber; // Track which pass we're on (1, 2, 3, 4, etc.)
        this.bannerWavePhase = 0; // Animation phase for banner waving
        this.firstPassBannerText = "Fly with me to Cutetopia";
        this.secondPassBannerText = "Double-click to add clouds";
        this.thirdPassBannerText = "Right-click to remove";
        this.fourthPassBannerText = "Spacebar to PARTY!";
        this.fifthPassBannerText = "That thing for the menu";
        
        // Set banner text based on pass number
        if (this.passNumber === 1) {
            this.bannerText = this.firstPassBannerText;
        } else if (this.passNumber === 2) {
            this.bannerText = this.secondPassBannerText;
        } else if (this.passNumber === 3) {
            this.bannerText = this.thirdPassBannerText;
        } else if (this.passNumber === 4) {
            this.bannerText = this.fourthPassBannerText;
        } else if (this.passNumber === 5) {
            this.bannerText = this.fifthPassBannerText;
        } else {
            this.bannerText = ""; // No banner after fourth pass
        }
    }
    pickAltitudeAboveClouds() {
        const minY = simHeight * 0.05;
        const maxY = simHeight * 0.9;
        const buffer = 0.15;
        
        if (Clouds.length === 0) {
            // No clouds, use regular method
            return this.pickSafeAltitude();
        }
        
        // Find the highest cloud (largest y value)
        let highestCloudBottom = -Infinity;
        for (let cloud of Clouds) {
            const cloudBottom = cloud.y + cloud.radius * 0.5;
            if (cloudBottom > highestCloudBottom) {
                highestCloudBottom = cloudBottom;
            }
        }
        
        // Try to spawn above the highest cloud
        const targetY = highestCloudBottom + buffer;
        
        // Check if there's enough room above
        if (targetY + 0.1 <= maxY) {
            // There's room, pick a random position above the highest cloud
            return targetY + Math.random() * (maxY - targetY);
        } else {
            // Not enough room above, use regular method
            return this.pickSafeAltitude();
        }
    }
    pickSafeAltitude() {
        const minY = simHeight * 0.05;
        const maxY = simHeight * 0.9;
        const buffer = 0.15; // Extra spacing buffer around clouds
        // Try to find a safe altitude (max 20 attempts)
        for (let attempt = 0; attempt < 20; attempt++) {
            const candidateY = minY + Math.random() * (maxY - minY);
            let isSafe = true;
            // Check against all cloud Clouds
            for (let cloud of Clouds) {
                // In simulation coordinates: higher y = higher up on screen
                const cloudBottom = cloud.y + cloud.radius * 0.5; // Flat bottom (crop line)
                const cloudTop = cloud.y - cloud.radius * 1.2; // Approximate top below center
                
                // Cloud occupies the vertical range from cloudTop (lower y) to cloudBottom (higher y)
                const effectiveTop = cloudTop - buffer; // Extend safe zone below cloud
                const effectiveBottom = cloudBottom + buffer; // Extend safe zone above cloud
                
                // Check if candidate altitude conflicts with this cloud
                // Plane is unsafe if it's between the cloud's top and bottom
                if (candidateY >= effectiveTop && candidateY <= effectiveBottom) {
                    isSafe = false;
                    break;
                }
            }
            if (isSafe) {
                return candidateY;
            }
        }
        // If no safe altitude found after attempts, return a default safe position
        return simHeight * 0.2; // Low altitude as fallback
    }
    update(dt) {
        // Handle initial delay (doesn't increment pass number)
        if (this.initialDelay > 0) {
            this.initialDelay -= dt;
            return; // Don't move or update anything during initial delay
        }
        
        if (this.isWaiting) {
            // Count down the respawn timer
            this.waitTimer -= dt;
            
            if (this.waitTimer <= 0) {
                // Increment pass number
                this.passNumber++;
                
                // For first five passes: set specific directions for each pass
                if (this.passNumber <= 5) {
                    if (this.passNumber === 1) {
                        this.direction = -1;
                        this.x = simWidth + this.size; // Start from right
                    } else if (this.passNumber === 2) {
                        this.direction = 1;
                        this.x = -this.size; // Start from left
                    } else if (this.passNumber === 3) {
                        this.direction = -1;
                        this.x = simWidth + this.size; // Start from right
                    } else if (this.passNumber === 4) {
                        this.direction = 1;
                        this.x = -this.size; // Start from left
                    } else if (this.passNumber === 5) {
                        this.direction = -1;
                        this.x = simWidth + this.size; // Start from right
                    }
                    this.y = this.pickAltitudeAboveClouds();
                    this.isUpsideDown = false;
                } else {
                    // After five passes: alternate directions and allow upside-down
                    this.direction *= -1;
                    if (this.direction === 1) {
                        this.x = -this.size; // Start from left
                    } else {
                        this.x = simWidth + this.size; // Start from right
                    }
                    this.y = this.pickSafeAltitude();
                    
                    // Determine if plane should be upside-down (only if in top 30%)
                    const topThreshold = simHeight * 0.7;
                    this.isUpsideDown = false;
                    if (this.y > topThreshold) {
                        this.isUpsideDown = Math.random() < 0.5;
                    }
                }
                
                this.baseY = this.y;
                
                // Set image based on direction and upside-down state
                if (this.isUpsideDown) {
                    this.image = this.direction === 1 ? kittyPlaneReverseImage : kittyPlaneImage;
                } else {
                    this.image = this.direction === 1 ? kittyPlaneImage : kittyPlaneReverseImage;
                }
                
                // Set banner text based on pass number
                if (this.passNumber === 1) {
                    this.bannerText = this.firstPassBannerText;
                } else if (this.passNumber === 2) {
                    this.bannerText = this.secondPassBannerText;
                } else if (this.passNumber === 3) {
                    this.bannerText = this.thirdPassBannerText;
                } else if (this.passNumber === 4) {
                    this.bannerText = this.fourthPassBannerText;
                } else if (this.passNumber === 5) {
                    this.bannerText = this.fifthPassBannerText;
                } else {
                    this.bannerText = ""; // No banner after fifth pass
                }
                
                // Reset loop parameters
                this.pathDistance = 0;
                this.loopPhase = 0;
                this.loopProgress = 0;
                this.angle = this.isUpsideDown ? Math.PI : 0;
                this.loopDecided = false;
                this.willDoLoop = false;
                this.isWaiting = false;
                
                // Clear propeller trails
                this.propTrail1 = [];
                this.propTrail2 = [];
            }
        } else {
            // Check if we've reached the loop start point
            const loopTrigger = this.direction === 1 ? 
                this.x >= this.loopStartX : 
                this.x <= (simWidth - this.loopStartX);
                
            if (this.loopPhase === 0 && loopTrigger && !this.isUpsideDown) {
                // Decide whether to do a loop (50% chance) - only if not upside-down
                // and only if plane is within bottom 25% of screen
                // No loops during first five passes
                const isInBottomQuarter = this.baseY <= simHeight * 0.35;
                
                if (!this.loopDecided && isInBottomQuarter && this.passNumber > 5) {
                    this.willDoLoop = Math.random() < 0.5;
                    this.loopDecided = true;
                }
                
                if (this.willDoLoop) {
                    this.loopPhase = 1;
                    this.loopProgress = 0;
                } else {
                    // Skip the loop, go straight to phase 2
                    this.loopPhase = 2;
                }
            }
            
            if (this.loopPhase === 0) {
                // Before the loop - straight flight
                this.x += this.speed * dt * this.direction;
                this.y = this.baseY;
                this.angle = this.isUpsideDown ? Math.PI : 0;
                this.speed = this.baseSpeed;  
            } else if (this.loopPhase === 1) {
                // During the loop - follow circular trajectory
                const loopCircumference = 2 * Math.PI * this.loopRadius;
                const progressSpeed = this.baseSpeed / loopCircumference;
                
                // Advance through the loop based on time
                this.loopProgress += progressSpeed * dt;
                
                if (this.loopProgress >= 1.0) {
                    // Loop complete
                    this.loopPhase = 2;
                    this.loopProgress = 0;
                    this.y = this.baseY;
                    this.angle = 0;
                    this.speed = this.baseSpeed;
                    // Continue moving forward after loop
                    this.x += this.speed * dt * this.direction;
                } else {
                    // Smooth continuous trajectory
                    const p = this.loopProgress;
                    
                    // Smooth ease-in/ease-out using cosine
                    const easeProgress = 0.5 - 0.5 * Math.cos(p * Math.PI);
                    
                    // Full 2π rotation (base theta is always positive)
                    const theta = easeProgress * 2 * Math.PI;
                    
                    // Smooth speed variation
                    const speedMult = 0.85 + 0.15 * Math.sin(theta * 0.5);
                    this.speed = this.baseSpeed * speedMult;
                    
                    // Move along the circular path - velocity is tangent to the circle
                    // X movement direction depends on flight direction
                    this.x += this.speed * Math.cos(theta) * dt * this.direction;
                    // Y movement is always upward for the loop
                    this.y += this.speed * Math.sin(theta) * dt;
                    
                    // Plane angle follows the tangent (flip for reverse direction)
                    this.angle = theta * this.direction;
                }
            } else {
                // After the loop - straight flight
                this.x += this.speed * dt * this.direction;
                this.y = this.baseY;
                this.angle = this.isUpsideDown ? Math.PI : 0;
                this.speed = this.baseSpeed;
            }
            
            // Check if passed far beyond the edge (simWidth distance)
            const passedEdge = this.direction === 1 ? 
                this.x - this.size > simWidth * 2 : 
                this.x + this.size < -simWidth;
            if (passedEdge) {
                // Start waiting timer (no delay for first five passes)
                this.isWaiting = true;
                this.waitTimer = this.passNumber < 5 ? 0 : this.respawnDelay;
            }
        }
        // Spin the propeller (faster when going faster)
        this.propellerAngle += dt * 20 * (this.speed / this.baseSpeed);
        
        // Animate banner wave for first five passes
        if (this.passNumber <= 5) {
            this.bannerWavePhase += dt * 3;
        }
        
        // Store propeller tip positions for trails (in world coordinates)
        // Continue storing even when off-screen to let trails fade naturally
        if (!this.isWaiting) {
            // Calculate propeller tip positions in world space
            const drawSize = this.size;
            let propX, propY;
            if (this.isUpsideDown) {
                propX = this.direction === 1 ? -drawSize * 0.452 : drawSize * 0.452;
                propY = -drawSize * 0.125; // Negative because rotation system
            } else {
                propX = this.direction === 1 ? drawSize * 0.452 : -drawSize * 0.452;
                propY = -drawSize * 0.125; // Negative because rotation system
            }
            const propLength = drawSize * 0.25;
            
            // Transform propeller tips to world coordinates
            const cos = Math.cos(this.angle);
            const sin = Math.sin(this.angle);
            
            // Tip 1 (vertical blade)
            const tip1LocalX = propX;
            const tip1LocalY = propY + Math.cos(this.propellerAngle) * propLength;
            const tip1WorldX = this.x + (tip1LocalX * cos - tip1LocalY * sin);
            const tip1WorldY = this.y + (tip1LocalX * sin + tip1LocalY * cos);
            
            // Tip 2 (second blade, 90 degrees out of phase)
            const tip2LocalX = propX;
            const tip2LocalY = propY + Math.cos(this.propellerAngle + Math.PI) * propLength;
            const tip2WorldX = this.x + (tip2LocalX * cos - tip2LocalY * sin);
            const tip2WorldY = this.y + (tip2LocalX * sin + tip2LocalY * cos);
            
            // Add to trails
            this.propTrail1.push({ x: tip1WorldX, y: tip1WorldY });
            this.propTrail2.push({ x: tip2WorldX, y: tip2WorldY });
            
            // Limit trail length
            if (this.propTrail1.length > this.maxTrailLength) {
                this.propTrail1.shift();
            }
            if (this.propTrail2.length > this.maxTrailLength) {
                this.propTrail2.shift();
            }
        }
    }
    contains(x, y) {
        // Use rectangular collision for the moving planes
        return x >= this.x - this.size/2 && x <= this.x + this.size/2 &&
                y >= this.y - this.size/2 && y <= this.y + this.size/2;
    }
    drawBanner(drawSize) {
        // Banner parameters
        const bannerLength = drawSize * 2.8; // Length of the banner
        const bannerHeight = drawSize * 0.35; // Height of the banner
        const towLineLength = drawSize * 0.8; // Distance from plane to banner
        const segments = 30; // Number of segments for wave effect
        
        // Calculate attachment point on plane (tail)
        const attachX = this.x * cScale - drawSize * 0.45 * this.direction;
        const attachY = canvas.height - this.y * cScale + bannerHeight * 0.5;
        
        c.save();
        
        // Draw main tow line to Y junction point
        c.strokeStyle = 'black';
        c.lineWidth = 1.0;
        c.beginPath();
        
        // Start from plane attachment point
        c.moveTo(attachX, attachY);
        
        // Draw wavy line to Y junction (80% of tow line length)
        const yJunctionRatio = 0.8;
        let yJunctionX, yJunctionY;
        for (let i = 0; i <= 10; i++) {
            const t = i / 10;
            const x = attachX - (towLineLength * yJunctionRatio) * t * this.direction;
            const waveAmp = drawSize * 0.04 * t;
            const y = attachY + Math.sin(this.bannerWavePhase + t * Math.PI * 2) * waveAmp;
            c.lineTo(x, y);
            if (i === 10) {
                yJunctionX = x;
                yJunctionY = y;
            }
        }
        c.stroke();
        
        // Banner start position (right after tow line)
        const bannerStartX = attachX - towLineLength * this.direction;
        const bannerStartY = attachY;
        
        // Draw banner segments with wave
        const points = [];
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = bannerStartX - (bannerLength * t) * this.direction;
            // Increased wave frequency and amplitude that grows toward the end (flapping effect)
            const waveAmp = drawSize * 0.12 * (0.3 + 0.7 * t * t); // More wave at the end
            const waveFreq = 4; // Waves along the banner
            const y = bannerStartY + Math.sin(this.bannerWavePhase - t * Math.PI * waveFreq) * waveAmp;
            
            // Calculate angle for this segment (tangent to the wave)
            const prevT = Math.max(t - 0.01, 0);
            const prevWaveAmp = drawSize * 0.12 * (0.3 + 0.7 * prevT * prevT);
            const prevY = bannerStartY + Math.sin(this.bannerWavePhase - prevT * Math.PI * waveFreq) * prevWaveAmp;
            const dy = y - prevY;
            const dx = (bannerLength * 0.01);
            const waveAngle = Math.atan2(dy, dx);
            
            // Clamp angle to prevent extreme rotations and blend from front to back
            const maxAngle = Math.PI / 6; // Max 30 degrees
            const clampedAngle = Math.max(-maxAngle, Math.min(maxAngle, waveAngle));
            // Negate angle for left-traveling plane to match direction
            const angle = clampedAngle * (t * t * t) * this.direction;
            
            points.push({x, y, t, angle});
        }
        
        // Get the actual top and bottom corners from the first banner point
        const firstPoint = points[0];
        const offsetY = bannerHeight / 2;
        const topCornerX = firstPoint.x - Math.sin(firstPoint.angle) * offsetY;
        const topCornerY = firstPoint.y - Math.cos(firstPoint.angle) * offsetY;
        const bottomCornerX = firstPoint.x + Math.sin(firstPoint.angle) * offsetY;
        const bottomCornerY = firstPoint.y + Math.cos(firstPoint.angle) * offsetY;
        
        // Draw Y-yoke lines from junction to banner corners
        c.strokeStyle = 'black';
        c.lineWidth = 1.0;
        
        // Top yoke line
        c.beginPath();
        c.moveTo(yJunctionX, yJunctionY);
        c.lineTo(topCornerX, topCornerY);
        c.stroke();
        
        // Bottom yoke line
        c.beginPath();
        c.moveTo(yJunctionX, yJunctionY);
        c.lineTo(bottomCornerX, bottomCornerY);
        c.stroke();
        
        // Draw banner background (white with slight transparency)
        c.fillStyle = 'hsla(0, 0%, 100%, 0.9)';
        c.strokeStyle = 'hsl(0, 0%, 20%)';
        c.lineWidth = 3;
        c.beginPath();
        
        // Top edge
        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            const offsetY = bannerHeight / 2;
            const topX = p.x - Math.sin(p.angle) * offsetY;
            const topY = p.y - Math.cos(p.angle) * offsetY;
            
            if (i === 0) {
                c.moveTo(topX, topY);
            } else {
                c.lineTo(topX, topY);
            }
        }
        
        // Bottom edge (reverse)
        for (let i = points.length - 1; i >= 0; i--) {
            const p = points[i];
            const offsetY = bannerHeight / 2;
            const bottomX = p.x + Math.sin(p.angle) * offsetY;
            const bottomY = p.y + Math.cos(p.angle) * offsetY;
            c.lineTo(bottomX, bottomY);
        }
        
        c.closePath();
        c.fill();
        c.stroke();
        
        // Draw text on banner - warp each character along the banner curve
        c.fillStyle = 'hsl(320, 90%, 50%)';
        c.font = `bold ${drawSize * 0.2}px comic sans ms, sans-serif`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        
        // Calculate total text width to center it on banner
        const totalTextWidth = c.measureText(this.bannerText).width;
        const startOffset = 0.5 - (totalTextWidth / (bannerLength * 2)); // Center on banner
        
        // Draw each character individually along the banner curve
        let currentOffset = startOffset;
        for (let charIndex = 0; charIndex < this.bannerText.length; charIndex++) {
            const char = this.bannerText[charIndex];
            const charWidth = c.measureText(char).width;
            
            // Find position along banner (as fraction from 0 to 1)
            const rawT = currentOffset + (charWidth / (bannerLength * 2));
            // Reverse t based on direction so text always reads correctly
            const t = this.direction === -1 ? rawT : (1 - rawT);
            
            // Make sure we're within banner bounds
            if (t >= 0 && t <= 1) {
                // Interpolate position and angle from points array
                const segmentIndex = Math.floor(t * (points.length - 1));
                const segmentT = (t * (points.length - 1)) - segmentIndex;
                const p1 = points[segmentIndex];
                const p2 = points[Math.min(segmentIndex + 1, points.length - 1)];
                
                // Interpolate position
                const charX = p1.x + (p2.x - p1.x) * segmentT;
                const charY = p1.y + (p2.y - p1.y) * segmentT;
                const charAngle = p1.angle + (p2.angle - p1.angle) * segmentT;
                
                // Draw the character
                c.save();
                c.translate(charX, charY);
                c.rotate(-charAngle); // Rotate to follow banner (same for both directions)
                c.fillText(char, 0, drawSize * 0.02); // Offset down slightly
                c.restore();
            }
            
            // Move to next character position
            currentOffset += charWidth / bannerLength;
        }
        
        c.restore();
    }
    draw() {
        // Only draw the airplane if it's visible or nearby
        if (this.image && this.image.complete && !this.isWaiting) {
            const drawSize = this.size * cScale;
            const centerX = this.x * cScale;
            const centerY = canvas.height - this.y * cScale;
            
            // Draw banner on first five passes
            if (this.passNumber <= 5) {
                this.drawBanner(drawSize);
            }
            
            // Draw propeller trail 1 behind the airplane
            if (this.propTrail1.length > 1) {
                c.lineCap = 'round';
                c.lineJoin = 'round';
                for (let i = 0; i < this.propTrail1.length - 1; i++) {
                    const alpha = (i / this.propTrail1.length) * 0.2;
                    //const width = Math.min(10, 5 / (i / this.propTrail1.length));
                    const maxWidth = Math.min(10, 3 / (i / this.propTrail1.length));
                    const point1 = this.propTrail1[i];
                    const point2 = this.propTrail1[i + 1];
                    c.strokeStyle = `hsla(200, 15%, 50%, ${alpha})`;
                    c.lineWidth = maxWidth;
                    c.beginPath();
                    c.moveTo(point1.x * cScale, canvas.height - point1.y * cScale + maxWidth);
                    c.lineTo(point2.x * cScale, canvas.height - point2.y * cScale - maxWidth);
                    c.stroke();
                }
            }

            // Translate to airplane center and rotate
            c.save();
            c.translate(centerX, centerY);
            c.rotate(-this.angle); // Negative because canvas Y is inverted

            // Draw the airplane image centered at origin
            c.drawImage(
                this.image,
                -drawSize / 2,
                -drawSize / 2,
                drawSize,
                drawSize
            );
            
            // Draw spinning propeller effect
            let propX, propY;
            if (this.isUpsideDown) {
                // When upside-down, flip the horizontal position
                propX = this.direction === 1 ? -drawSize * 0.452 : drawSize * 0.452;
                propY = drawSize * 0.125; // Keep same vertical offset (rotation handles the flip)
            } else {
                propX = this.direction === 1 ? drawSize * 0.452 : -drawSize * 0.452;
                propY = drawSize * 0.125; // Slight vertical offset
            }
            const propLength = drawSize * 0.25;
            // Calculate apparent width based on rotation angle (3D effect)
            const width1 = Math.cos(this.propellerAngle) * propLength;
            const width2 = Math.cos(this.propellerAngle + Math.PI / 2) * propLength;
            // Draw propeller blades with varying width (simulating 3D rotation)
            c.strokeStyle = 'hsla(200, 90%, 70%, 0.6)';
            c.lineWidth = 6;
            c.lineCap = 'round';
            // Vertical blade (appears to change width as it rotates)
            c.beginPath();
            c.moveTo(propX, propY - width1);
            c.lineTo(propX, propY + width1);
            c.stroke();
            // Second blade 90 degrees out of phase
            c.beginPath();
            c.moveTo(propX, propY - width2);
            c.lineTo(propX, propY + width2);
            c.stroke();
            
            c.restore();

            // Draw propeller trail 2 in front of airplane
            if (this.propTrail1.length > 1) {
                c.lineCap = 'round';
                c.lineJoin = 'round';
                let width;
                // Draw 
                for (let i = 0; i < this.propTrail2.length - 1; i++) {
                    const alpha = (i / this.propTrail2.length) * 0.2;
                    //const width = Math.min(10, 50 / (i / this.propTrail1.length));
                    //width += 10;
                    const maxWidth = Math.min(10, 5 / (i / this.propTrail1.length));
                    const point1 = this.propTrail2[i];
                    const point2 = this.propTrail2[i + 1];
                    c.strokeStyle = `hsla(200, 20%, 70%, ${alpha})`;
                    c.lineWidth = maxWidth;
                    c.beginPath();
                    c.moveTo(point1.x * cScale, canvas.height - point1.y * cScale + maxWidth);
                    c.lineTo(point2.x * cScale, canvas.height - point2.y * cScale - maxWidth);
                    c.stroke();
                }
            }
        }
    }
}

//  MAKE CLOUDS  ---------------------------------------------------------------------
function findSafeCloudAltitude(isBackground, existingClouds) {
    // Both cloud types spawn in upper 75% of screen (higher y values)
    const minY = simHeight * 0.25;
    const maxY = isBackground ? simHeight * 0.9 : simHeight * 0.85;
    const minSeparation = 0.3; // Minimum vertical separation between clouds
    
    // Try to find a safe altitude (max 20 attempts)
    for (let attempt = 0; attempt < 20; attempt++) {
        const candidateY = minY + Math.random() * (maxY - minY);
        let isSafe = true;
        
        // Check against all existing clouds
        for (let cloud of existingClouds) {
            if (Math.abs(cloud.y - candidateY) < minSeparation) {
                isSafe = false;
                break;
            }
        }
        
        if (isSafe) {
            return candidateY;
        }
    }
    
    // If no safe position found, return a random position
    return minY + Math.random() * (maxY - minY);
}

function makeBackgroundClouds() {
    BackgroundClouds = [];
    const isBackground = true;
    const isForeGround = false;
    const raining = false;
    // Spawn in upper 75% of screen (25% to 90% height)
    BackgroundClouds.push(new CLOUD(0.3 * simWidth, simHeight * (0.25 + Math.random() * 0.65), 
        isBackground, isForeGround, raining));
    BackgroundClouds.push(new CLOUD(0.6 * simWidth, simHeight * (0.25 + Math.random() * 0.65), 
        isBackground, isForeGround, raining));
    BackgroundClouds.push(new CLOUD(0.85 * simWidth, simHeight * (0.25 + Math.random() * 0.65), 
        isBackground, isForeGround, raining));
}

function makeForegroundClouds() {
    ForegroundCloud = [];
    const isBackground = false;
    const isForeGround = true;
    const raining = false;

    ForegroundCloud.push(new CLOUD(
        0.85 * simWidth, 0.45 * simHeight, 
        isBackground, isForeGround, raining));
}

function makeInitialClouds() {
    Clouds = [];
    const isBackground = false;
    const isForeGround = false;
    const raining = false;
    Clouds.push(new CLOUD(0.8 * simWidth, 0.45 * simHeight, isBackground, isForeGround, raining));
    Clouds.push(new CLOUD(0.25 * simWidth, 0.65 * simHeight, isBackground, isForeGround, raining));
}    

//  MAKE AIRPLANE  ---------------------------------------------------------------------
let initialForegroundCloudTextVisible = true; // Track if initial cloud text should show
function makeAirplane() {
    Airplane = [];
    const y = 0.3 * simHeight;
    const speed = 0.6;
    const size = 0.3;
    const respawnDelay = 30.0;
    const passNumber = 1; // Start with pass 1
    Airplane.push(new AIRPLANE(y, speed, size, respawnDelay, passNumber));
} 

// Spook nearby boids -------
function spookBoids(pos, spookRadius) {
    const spookForce = 50;
    for (let boid of Boids) {
        const toBoid = boid.pos.clone().subtract(pos);
        const distance = toBoid.length();
        if (distance < spookRadius && distance > 0) {
            // Calculate repelling force inversely proportional to distance
            const forceMagnitude = (spookRadius - distance) / spookRadius * spookForce;
            toBoid.normalize().scale(forceMagnitude);
            boid.vel.add(toBoid);
        }
    }
}


//  BOID CLASS ---------------------------------------------------------------------
class BOID {
    constructor(pos, vel, hue, whiteBoid, blackBoid) {
        this.pos = pos.clone();
        this.vel = vel.clone();
        this.hue = hue;
        this.saturation = 0;
        this.lightness = 0;
        this.manualHue = false; // Flag to control if hue is manually set
        this.manualLightness = false; // Flag to control if lightness is manually set
        this.manualSaturation = false; // Flag to control if saturation is manually set
        this.radius = boidRadius;
        this.angle = 0;
        this.hueCounter = 70;
        this.speedAdjust = 0;
        this.whiteBoid = whiteBoid;
        this.blackBoid = blackBoid;
        this.triangleBoid = false;
        this.arrow = true;
        this.circle = false;
        this.ellipseBoid = false;
        this.airfoil = false;
        this.flappy = false;
        this.square = false;
        this.glowBoid = false;
        this.flashing = false;
        this.flashTimer = 0; // Timer for flash duration
        this.flashDuration = 0.1; // How long the flash lasts (100ms)
        this.flashCooldown = 0; // Cooldown timer to prevent immediate re-flashing
        this.flashCooldownDuration = 0.3; // Must wait this long before flashing again (300ms)
        this.lastFlashCycle = -1; // Track which cycle last triggered this boid
        this.tail = [];
        this.tailStartIndex = 0; // Ring buffer start index
        // Cached color strings to avoid garbage collection
        this.cachedFillStyle = '';
        this.cachedStrokeStyle = '';
        this.cachedTailStyle = '';
        this.lastHue = -1;
        this.lastSaturation = -1;
        this.lastLightness = -1;
        this.flapper = 0;
        this.flapOut = true;
    }
    get left() {
        return this.pos.x - this.radius;
    }
    get right() {
        return this.pos.x + this.radius;
    }
    simulate() {
        // Enforce speed limit
        const boidSpeed = this.vel.length();
        if (boidSpeed > boidProps.speedLimit) {
            this.vel.normalize();
            this.vel.scale(boidProps.speedLimit);
        }
        if (this.flappy && this.flapOut) {
            this.flapper += 0.3 * boidSpeed; 
            if (this.flapper >= 1.8) {
                this.flapOut = false;
            }
        } else if (this.flappy && !this.flapOut) {
            this.flapper -= 0.6 * boidSpeed; 
            if (this.flapper <= 0) {
                this.flapOut = true;
            }
        }
        // Update position based on velocity
        this.pos.x += this.vel.x * deltaT;
        this.pos.y += this.vel.y * deltaT;
        // Maintain tail (use shift instead of splice for better performance)
        if (boidProps.doTails == true && boidProps.tailLength > 0 && tailColorMode !== 0) {
            this.tail.push([this.pos.x, this.pos.y]);
            // Remove old elements from front - shift() is faster than splice(0, n)
            while (this.tail.length > boidProps.tailLength) {
                this.tail.shift();
            }
        }
    }
    draw() {
        // scale size based on velocity
        const radScale = this.radius * cScale;
        this.speedAdjust = this.vel.length() / boidProps.speedLimit;

        // arrow dimensions ----------
        const arrowLength = Math.max((this.speedAdjust) * 1.5 * radScale, 1 * radScale);
        const arrowWidth = Math.min((1/this.speedAdjust) * 0.8 * radScale, 1.5 * radScale);
        const arrowDent = Math.min((1/this.speedAdjust) * 1.0 * radScale, 0.7 * radScale);

        // Update hue counter for continuous color cycling ----------
        this.hueCounter += boidProps.hueTicker;
        if (this.hueCounter >= 360) {
            this.hueCounter = 0;
        }

        // code hsl based on speed and height ----------
        // Only auto-calculate hue if not manually controlled
        if (!this.manualHue) {
            if (colorByDirection) {
                // Color based on heading direction
                const headingAngle = Math.atan2(this.vel.y, this.vel.x);
                this.hue = getDegrees(-headingAngle);
            } else {
                this.hue = 360 - this.speedAdjust * boidProps.hueSensitivity + this.hueCounter;
            }
        } 
        // Only auto-calculate saturation if not manually controlled
        if (!this.manualSaturation) {
            this.saturation = colorByDirection ? 85 : 85;
        }
        // Only auto-calculate lightness if not manually controlled
        if (!this.manualLightness) {
            this.lightness = colorByDirection ? 50 : 35 + (1 - (this.pos.y / simHeight)) * 35;
        }
        
        // Cache color strings if they've changed (reduces garbage collection)
        const hueRounded = Math.round(this.hue);
        const satRounded = Math.round(this.saturation);
        const lightRounded = Math.round(this.lightness);
        if (hueRounded !== this.lastHue || satRounded !== this.lastSaturation || lightRounded !== this.lastLightness) {
            this.cachedFillStyle = `hsl(${hueRounded}, ${satRounded}%, ${lightRounded}%)`;
            this.cachedStrokeStyle = `hsl(${hueRounded - 70}, ${satRounded}%, ${Math.round(lightRounded * 0.8)}%)`;
            this.cachedTailStyle = `hsla(${hueRounded}, ${satRounded}%, ${lightRounded}%, 0.5)`;
            this.lastHue = hueRounded;
            this.lastSaturation = satRounded;
            this.lastLightness = lightRounded;
        } 

        // Draw tail ----------
        if (boidProps.doTails == true && boidProps.tailLength > 0 && this.tail.length > 0 && tailColorMode !== 0) {
            c.beginPath();
            c.moveTo(cX({x: this.tail[0][0]}), cY({y: this.tail[0][1]}));
            for (var point of this.tail) {
                c.lineTo(cX({x: point[0]}), cY({y: point[1]}));
            }
            
            // Apply tail color based on tailColorMode
            if (tailColorMode === 1) {
                // Black tail
                c.strokeStyle = 'hsla(0, 0%, 10%, 0.3)';
            } else if (tailColorMode === 2) {
                // White tail
                c.strokeStyle = 'hsla(0, 0%, 95%, 0.5)';
            } else if (tailColorMode === 3) {
                // Selected hue tail (use cached)
                c.strokeStyle = this.cachedTailStyle;
            } else if (tailColorMode === 4) {
                // Alternate hue tail
                c.strokeStyle = `hsla(${Math.round(this.hue - 70)}, ${Math.round(this.saturation)}%, ${Math.round(this.lightness)}%, 0.5)`;
            }

            //c.lineWidth = 1.0 + (1 - this.speedAdjust) * 1.0;
            // line width scales with boid size and inversely with speed, and with tail width slider
            //c.lineWidth = (0.3 + (1 - this.speedAdjust)) * radScale * 0.5 * boidProps.tailWidth;
            c.lineWidth = radScale * 0.2 * boidProps.tailWidth;
            // Override for special boids
            if (this.whiteBoid) {
                c.strokeStyle = `hsla(0, 0%, 95%, 0.5)`;
                c.lineWidth = 4 * boidProps.tailWidth;
            } else if (this.blackBoid && !this.flashing) {
                c.strokeStyle = `hsla(0, 0%, 5%, 0.5)`;
                c.lineWidth = 4 * boidProps.tailWidth;
            } else if (this.flashing && !this.blackBoid) {
                c.strokeStyle = `hsla(0, 0%, ${this.lightness * 1.5}%, 1.0)`;
                c.lineWidth = (1.0 + (1 - this.speedAdjust) * 1.0) * boidProps.tailWidth;
            } else if (this.flashing && this.blackBoid) {
                c.strokeStyle = `hsla(0, 0%, 95%, 0.5)`;
                c.lineWidth = (1.0 + (1 - this.speedAdjust) * 1.0) * boidProps.tailWidth;
            }
            
            c.lineJoin = 'butt';
            c.lineCap = 'round';
            c.stroke();
        }

        // Draw triangle boid --------------------------------------------
        if (this.triangleBoid && !this.arrow && !this.circle && !this.airfoil) {
            const angle = Math.atan2(-this.vel.y, this.vel.x);
            
            c.save();
            c.translate(cX(this.pos), cY(this.pos));
            c.rotate(angle);
            
            // Draw isosceles triangle pointing right
            const height = 1.4 * radScale;
            const baseWidth = 1.0 * radScale;
            
            c.beginPath();
            c.moveTo(height * 0.6, 0); // Tip (pointing right)
            c.lineTo(-height * 0.4, baseWidth * 0.5); // Bottom left
            c.lineTo(-height * 0.4, -baseWidth * 0.5); // Top left
            c.closePath();
            
            // Apply colors
            if (!this.whiteBoid && !this.blackBoid && !this.flashing) {
                c.fillStyle = this.cachedFillStyle;
            } else if (this.whiteBoid) {
                c.fillStyle = 'hsl(0, 0%, 90%)';
            } else if (this.blackBoid) {
                c.fillStyle = 'hsl(0, 0%, 10%)';
            } else if (this.flashing && !this.blackBoid) {
                const flashLight = Math.round(this.lightness * 1.5);
                c.fillStyle = `hsl(${Math.round(this.hue + 70)}, ${Math.round(this.saturation)}%, ${flashLight}%)`;
            } else if (this.flashing && this.blackBoid) {
                c.fillStyle = 'hsl(0, 0%, 90%)';
            }
            
            if (boidFillEnabled) {
                c.fill();
            }
            
            if (boidTraceMode > 0) {
                if (boidTraceMode === 1) {
                    c.strokeStyle = 'hsl(0, 0%, 0%)';
                    c.lineWidth = 1.0;
                } else if (boidTraceMode === 2) {
                    c.strokeStyle = this.cachedStrokeStyle;
                    c.lineWidth = 2.0;
                } else if (boidTraceMode === 3) {
                    c.strokeStyle = 'hsl(0, 0%, 90%)';
                    c.lineWidth = 1.0;
                }
                c.stroke();
            }
            
            c.restore();
        }

        // Draw arrow boid --------------------------------------------
        if (this.arrow && !this.circle && !this.airfoil) {
            const angle = Math.atan2(this.vel.y, this.vel.x);

            c.save();
            c.translate(cX(this.pos), cY(this.pos));
            c.rotate(-angle); // for arrows
            
            // fill body ----------
            c.beginPath();
            c.moveTo(arrowLength, 0);
            c.lineTo(-arrowLength, -arrowWidth / 2);
            c.lineTo(-arrowLength + arrowDent, 0);
            c.lineTo(-arrowLength, arrowWidth / 2);
            c.closePath();
            if (!this.whiteBoid && !this.blackBoid && !this.flashing) {
                c.fillStyle = this.cachedFillStyle;
                c.strokeStyle = this.cachedStrokeStyle;
            } else if (this.whiteBoid) {
                c.fillStyle = 'hsl(0, 0%, 90%)';
                c.strokeStyle = 'hsl(0, 0%, 100%)';
            } else if (this.blackBoid && !this.flashing) {
                c.fillStyle = 'hsl(0, 0%, 10%)';
                c.strokeStyle = 'hsl(0, 0%, 0%)';
            } else if (this.flashing && !this.blackBoid) {
                c.fillStyle = `hsl(${Math.round(this.hue + 70)}, ${Math.round(this.saturation)}%, ${Math.round(this.lightness * 1.5)}%)`;
                c.strokeStyle = `hsl(${Math.round(this.hue)}, ${Math.round(this.saturation)}%, ${Math.round(this.lightness * 1.5)}%)`;
            } else if (this.flashing && this.blackBoid) {
                c.fillStyle = 'hsl(0, 0%, 90%)';
                c.strokeStyle = 'hsl(0, 0%, 100%)';
            }
            if (boidFillEnabled) {
                c.fill();
            }
            if (boidTraceMode > 0) {
                if (boidTraceMode === 1) {
                    c.strokeStyle = 'hsl(0, 0%, 0%)';
                    c.lineWidth = 1.0;
                } else if (boidTraceMode === 2) {
                    c.strokeStyle = this.cachedStrokeStyle;
                    c.lineWidth = 2.0;
                } else if (boidTraceMode === 3) {
                    c.strokeStyle = 'hsl(0, 0%, 90%)';
                    c.lineWidth = 1.0;
                }
                c.stroke();
            }

            /*// draw arrow edges/wings ----------
            c.beginPath();
            c.moveTo(arrowLength, 0);
            c.lineTo(-arrowLength, -arrowWidth / 2);
            if (!this.whiteBoid && !this.blackBoid && !this.flashing) {
                c.strokeStyle = this.cachedStrokeStyle;
            } else if (this.whiteBoid) {
                c.strokeStyle = 'hsl(0, 0%, 100%)';
            } else if (this.blackBoid) {
                c.strokeStyle = 'hsl(0, 0%, 0%)';
            } else if (this.flashing && !this.blackBoid) {
                c.strokeStyle = `hsl(${Math.round(this.hue)}, ${Math.round(this.saturation)}%, ${Math.round(this.lightness * 1.5)}%)`;
            } else if (this.flashing && this.blackBoid) {
                c.strokeStyle = 'hsl(0, 0%, 100%)';
            }
            c.lineWidth = 1.0;
            c.stroke();
            c.beginPath();
            c.moveTo(-arrowLength, arrowWidth / 2);
            c.lineTo(arrowLength, 0);
            c.stroke();*/

            c.restore();
        }

        // Draw glowing boid --------------------------------------------
        if (this.glowBoid) {
            c.beginPath();
            c.arc(cX(this.pos), cY(this.pos), radScale, 0, 2 * Math.PI);
            var glowBallShading = c.createRadialGradient(
                cX(this.pos), cY(this.pos), 0,
                cX(this.pos), cY(this.pos), radScale
            );
            if (!this.whiteBoid && !this.blackBoid && !this.flashing) {
                // Soap bubble with prismatic effect and transparent center
                
                // Base bubble with transparent center and prismatic rim
                let bubbleGradient = c.createRadialGradient(
                    cX(this.pos), cY(this.pos), 0, 
                    cX(this.pos), cY(this.pos), radScale
                );
                
                // Very transparent center - bubbles are thin and don't reflect much light here
                bubbleGradient.addColorStop(0.0, `hsla(${this.hue}, 20%, 80%, 0.05)`);
                bubbleGradient.addColorStop(0.3, `hsla(${this.hue}, 30%, 70%, 0.08)`);
                
                // Prismatic color bands (thin film interference)
                bubbleGradient.addColorStop(0.65, `hsla(${this.hue - 60}, 70%, 60%, 0.25)`);
                bubbleGradient.addColorStop(0.78, `hsla(${this.hue}, 80%, 65%, 0.35)`);
                bubbleGradient.addColorStop(0.88, `hsla(${this.hue + 60}, 85%, 70%, 0.4)`);
                bubbleGradient.addColorStop(0.95, `hsla(${this.hue + 120}, 85%, 70%, 0.45)`);
                
                // Subtle edge with slight fade
                bubbleGradient.addColorStop(0.98, `hsla(${this.hue + 80}, 80%, 75%, 0.35)`);
                bubbleGradient.addColorStop(1.0, `hsla(${this.hue}, 60%, 50%, 0.15)`);
                
                c.fillStyle = bubbleGradient;
                c.fill();

                // Specular highlight (light source reflection)
                const highlightX = (this.pos.x - (0.25 * this.radius)) * cScale;
                const highlightY = canvas.height - (this.pos.y + (0.35 * this.radius)) * cScale;
                const highlightGradient = c.createRadialGradient(
                    highlightX, highlightY, 0, 
                    highlightX, highlightY, 0.5 * radScale
                );
                
                // Bright white highlight with prismatic edge
                highlightGradient.addColorStop(0.0, `hsla(0, 0%, 100%, 0.6)`);
                highlightGradient.addColorStop(0.3, `hsla(${this.hue + 180}, 60%, 85%, 0.4)`);
                highlightGradient.addColorStop(0.6, `hsla(${this.hue}, 70%, 75%, 0.2)`);
                highlightGradient.addColorStop(1.0, `hsla(0, 0%, 100%, 0.0)`);
                
                c.fillStyle = highlightGradient;
                c.fill();
            } else if (this.whiteBoid) {
                // White soap bubble with subtle iridescence
                let bubbleGradient = c.createRadialGradient(
                    cX(this.pos), cY(this.pos), 0, 
                    cX(this.pos), cY(this.pos), radScale
                );
                
                bubbleGradient.addColorStop(0.0, `hsla(0, 0%, 98%, 0.05)`);
                bubbleGradient.addColorStop(0.3, `hsla(0, 0%, 95%, 0.08)`);
                bubbleGradient.addColorStop(0.65, `hsla(200, 30%, 85%, 0.25)`);
                bubbleGradient.addColorStop(0.78, `hsla(240, 25%, 90%, 0.35)`);
                bubbleGradient.addColorStop(0.88, `hsla(280, 30%, 88%, 0.5)`);
                bubbleGradient.addColorStop(0.95, `hsla(320, 25%, 85%, 0.45)`);
                bubbleGradient.addColorStop(0.98, `hsla(0, 15%, 92%, 0.35)`);
                bubbleGradient.addColorStop(1.0, `hsla(0, 0%, 85%, 0.15)`);
                
                c.fillStyle = bubbleGradient;
                c.fill();

                const highlightX = (this.pos.x - (0.25 * this.radius)) * cScale;
                const highlightY = canvas.height - (this.pos.y + (0.35 * this.radius)) * cScale;
                const highlightGradient = c.createRadialGradient(
                    highlightX, highlightY, 0, 
                    highlightX, highlightY, 0.5 * radScale
                );
                
                highlightGradient.addColorStop(0.0, `hsla(0, 0%, 100%, 0.7)`);
                highlightGradient.addColorStop(0.3, `hsla(200, 40%, 95%, 0.5)`);
                highlightGradient.addColorStop(0.6, `hsla(240, 30%, 90%, 0.2)`);
                highlightGradient.addColorStop(1.0, `hsla(0, 0%, 100%, 0.0)`);
                
                c.fillStyle = highlightGradient;
                c.fill();
            } else if (this.blackBoid && !this.flashing) {
                // Dark bubble with subtle color
                let bubbleGradient = c.createRadialGradient(
                    cX(this.pos), cY(this.pos), 0, 
                    cX(this.pos), cY(this.pos), radScale
                );
                
                bubbleGradient.addColorStop(0.0, `hsla(0, 0%, 8%, 0.05)`);
                bubbleGradient.addColorStop(0.3, `hsla(0, 0%, 10%, 0.08)`);
                bubbleGradient.addColorStop(0.65, `hsla(240, 40%, 20%, 0.25)`);
                bubbleGradient.addColorStop(0.78, `hsla(260, 35%, 25%, 0.35)`);
                bubbleGradient.addColorStop(0.88, `hsla(280, 40%, 22%, 0.5)`);
                bubbleGradient.addColorStop(0.95, `hsla(300, 35%, 18%, 0.45)`);
                bubbleGradient.addColorStop(0.98, `hsla(0, 20%, 15%, 0.35)`);
                bubbleGradient.addColorStop(1.0, `hsla(0, 0%, 5%, 0.15)`);
                
                c.fillStyle = bubbleGradient;
                c.fill();

                const highlightX = (this.pos.x - (0.25 * this.radius)) * cScale;
                const highlightY = canvas.height - (this.pos.y + (0.35 * this.radius)) * cScale;
                const highlightGradient = c.createRadialGradient(
                    highlightX, highlightY, 0, 
                    highlightX, highlightY, 0.5 * radScale
                );
                
                highlightGradient.addColorStop(0.0, `hsla(0, 0%, 40%, 0.5)`);
                highlightGradient.addColorStop(0.3, `hsla(260, 30%, 35%, 0.3)`);
                highlightGradient.addColorStop(0.6, `hsla(240, 25%, 25%, 0.15)`);
                highlightGradient.addColorStop(1.0, `hsla(0, 0%, 0%, 0.0)`);
                
                c.fillStyle = highlightGradient;
                c.fill();
            } else if (this.flashing && !this.blackBoid) {
                // Flashing colored bubble - brighter and more saturated
                let bubbleGradient = c.createRadialGradient(
                    cX(this.pos), cY(this.pos), 0, 
                    cX(this.pos), cY(this.pos), radScale
                );
                
                const flashLight = Math.min(95, this.lightness * 1.5);
                bubbleGradient.addColorStop(0.0, `hsla(${this.hue}, 30%, ${flashLight}%, 0.1)`);
                bubbleGradient.addColorStop(0.3, `hsla(${this.hue}, 40%, ${flashLight - 10}%, 0.15)`);
                bubbleGradient.addColorStop(0.65, `hsla(${this.hue - 60}, 80%, ${flashLight - 15}%, 0.4)`);
                bubbleGradient.addColorStop(0.78, `hsla(${this.hue}, 90%, ${flashLight - 10}%, 0.5)`);
                bubbleGradient.addColorStop(0.88, `hsla(${this.hue + 60}, 95%, ${flashLight - 5}%, 0.65)`);
                bubbleGradient.addColorStop(0.95, `hsla(${this.hue + 120}, 90%, ${flashLight}%, 0.6)`);
                bubbleGradient.addColorStop(0.98, `hsla(${this.hue + 80}, 85%, ${flashLight}%, 0.5)`);
                bubbleGradient.addColorStop(1.0, `hsla(${this.hue}, 70%, ${flashLight - 20}%, 0.25)`);
                
                c.fillStyle = bubbleGradient;
                c.fill();

                const highlightX = (this.pos.x - (0.25 * this.radius)) * cScale;
                const highlightY = canvas.height - (this.pos.y + (0.35 * this.radius)) * cScale;
                const highlightGradient = c.createRadialGradient(
                    highlightX, highlightY, 0, 
                    highlightX, highlightY, 0.5 * radScale
                );
                
                highlightGradient.addColorStop(0.0, `hsla(0, 0%, 100%, 0.8)`);
                highlightGradient.addColorStop(0.3, `hsla(${this.hue + 180}, 70%, 90%, 0.6)`);
                highlightGradient.addColorStop(0.6, `hsla(${this.hue}, 80%, 85%, 0.3)`);
                highlightGradient.addColorStop(1.0, `hsla(0, 0%, 100%, 0.0)`);
                
                c.fillStyle = highlightGradient;
                c.fill();
            } else if (this.flashing && this.blackBoid) {
                // Flashing black bubble - same as non-flashing black
                let bubbleGradient = c.createRadialGradient(
                    cX(this.pos), cY(this.pos), 0, 
                    cX(this.pos), cY(this.pos), radScale
                );
                
                bubbleGradient.addColorStop(0.0, `hsla(0, 0%, 8%, 0.05)`);
                bubbleGradient.addColorStop(0.3, `hsla(0, 0%, 10%, 0.08)`);
                bubbleGradient.addColorStop(0.65, `hsla(240, 40%, 20%, 0.25)`);
                bubbleGradient.addColorStop(0.78, `hsla(260, 35%, 25%, 0.35)`);
                bubbleGradient.addColorStop(0.88, `hsla(280, 40%, 22%, 0.5)`);
                bubbleGradient.addColorStop(0.95, `hsla(300, 35%, 18%, 0.45)`);
                bubbleGradient.addColorStop(0.98, `hsla(0, 20%, 15%, 0.35)`);
                bubbleGradient.addColorStop(1.0, `hsla(0, 0%, 5%, 0.15)`);
                
                c.fillStyle = bubbleGradient;
                c.fill();

                const highlightX = (this.pos.x - (0.25 * this.radius)) * cScale;
                const highlightY = canvas.height - (this.pos.y + (0.35 * this.radius)) * cScale;
                const highlightGradient = c.createRadialGradient(
                    highlightX, highlightY, 0, 
                    highlightX, highlightY, 0.5 * radScale
                );
                
                highlightGradient.addColorStop(0.0, `hsla(0, 0%, 40%, 0.5)`);
                highlightGradient.addColorStop(0.3, `hsla(260, 30%, 35%, 0.3)`);
                highlightGradient.addColorStop(0.6, `hsla(240, 25%, 25%, 0.15)`);
                highlightGradient.addColorStop(1.0, `hsla(0, 0%, 0%, 0.0)`);
                
                c.fillStyle = highlightGradient;
                c.fill();
            }
            c.fill();
        }

        // Draw circle boid --------------------------------------------
        if (!this.arrow && this.circle && !this.airfoil) {
            c.beginPath();
            //c.arc(0, 0, radScale, 0, 2 * Math.PI);
            c.arc(cX(this.pos), cY(this.pos), 0.6 * radScale, 0, 2 * Math.PI);
            if (!this.whiteBoid && !this.blackBoid && !this.flashing) {
                c.fillStyle = this.cachedFillStyle;
                //c.strokeStyle = this.cachedStrokeStyle;
            } else if (this.whiteBoid) {
                c.fillStyle = 'hsl(0, 0%, 90%)';
                //c.strokeStyle = 'hsl(0, 0%, 100%)';
            } else if (this.blackBoid) {
                c.fillStyle = 'hsl(0, 0%, 10%)';
                //c.strokeStyle = 'hsl(0, 0%, 0%)';
            } else if (this.flashing && !this.blackBoid) {
                const flashLight = Math.round(this.lightness * 1.5);
                c.fillStyle = `hsl(${Math.round(this.hue + 70)}, ${Math.round(this.saturation)}%, ${flashLight}%)`;
                //c.strokeStyle = `hsl(${Math.round(this.hue)}, ${Math.round(this.saturation)}%, ${flashLight}%)`;
            } else if (this.flashing && this.blackBoid) {
                c.fillStyle = 'hsl(0, 0%, 90%)';
                //c.strokeStyle = 'hsl(0, 0%, 100%)';
            }
            if (boidFillEnabled) {
                c.fill();
            }
            if (boidTraceMode > 0) {
                if (boidTraceMode === 1) {
                    c.strokeStyle = 'hsl(0, 0%, 0%)';
                    c.lineWidth = 1.0;
                } else if (boidTraceMode === 2) {
                    c.strokeStyle = this.cachedStrokeStyle;
                    c.lineWidth = 2.0;
                } else if (boidTraceMode === 3) {
                    c.strokeStyle = 'hsl(0, 0%, 90%)';
                    c.lineWidth = 1.0;
                }
                c.stroke();
            }
        }

        // Ellipse boids - directional ellipses that become more slender with speed
        if (this.ellipseBoid && !this.arrow && !this.circle && !this.airfoil) {
            c.save();
            
            // Calculate aspect ratio based on speed (faster = more slender)
            const speed = Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y);
            const normalizedSpeed = Math.min(speed / 2.0, 1.0); // Normalize speed
            const aspectRatio = 1.0 + normalizedSpeed * 3.0; // Range from 1.0 (round) to 5.0 (slender)
            
            // Get velocity angle for rotation (negate y for canvas coordinate system)
            const angle = Math.atan2(-this.vel.y, this.vel.x);
            
            // Move to boid position and rotate to velocity direction
            c.translate(cX(this.pos), cY(this.pos));
            c.rotate(angle);
            
            // Draw ellipse (keep length constant, shrink width with speed)
            c.beginPath();
            c.ellipse(0, 0, 0.6 * radScale, 0.6 * radScale / aspectRatio, 0, 0, 2 * Math.PI);
            
            // Apply colors
            if (!this.whiteBoid && !this.blackBoid && !this.flashing) {
                c.fillStyle = this.cachedFillStyle;
            } else if (this.whiteBoid) {
                c.fillStyle = 'hsl(0, 0%, 90%)';
            } else if (this.blackBoid) {
                c.fillStyle = 'hsl(0, 0%, 10%)';
            } else if (this.flashing && !this.blackBoid) {
                const flashLight = Math.round(this.lightness * 1.5);
                c.fillStyle = `hsl(${Math.round(this.hue + 70)}, ${Math.round(this.saturation)}%, ${flashLight}%)`;
            } else if (this.flashing && this.blackBoid) {
                c.fillStyle = 'hsl(0, 0%, 90%)';
            }
            
            if (boidFillEnabled) {
                c.fill();
            }
            
            if (boidTraceMode > 0) {
                if (boidTraceMode === 1) {
                    c.strokeStyle = 'hsl(0, 0%, 0%)';
                    c.lineWidth = 1.0;
                } else if (boidTraceMode === 2) {
                    c.strokeStyle = this.cachedStrokeStyle;
                    c.lineWidth = 2.0;
                } else if (boidTraceMode === 3) {
                    c.strokeStyle = 'hsl(0, 0%, 90%)';
                    c.lineWidth = 1.0;
                }
                c.stroke();
            }
            
            c.restore();
        }

        // Draw square boid --------------------------------------------
        if (this.square) {
            const angle = Math.atan2(this.vel.y, this.vel.x);
            if (!this.whiteBoid && !this.blackBoid && !this.flashing) {
                c.fillStyle = this.cachedFillStyle;
                //c.strokeStyle = this.cachedStrokeStyle;
            } else if (this.whiteBoid) {
                c.fillStyle = 'hsl(0, 0%, 90%)';
                //c.strokeStyle = 'hsl(0, 0%, 100%)';
            } else if (this.blackBoid) {
                c.fillStyle = 'hsl(0, 0%, 10%)';
                //c.strokeStyle = 'hsl(0, 0%, 0%)';
            } else if (this.flashing && !this.blackBoid) {
                const flashLight = Math.round(this.lightness * 1.5);
                c.fillStyle = `hsl(${Math.round(this.hue + 70)}, ${Math.round(this.saturation)}%, ${flashLight}%)`;
                //c.strokeStyle = `hsl(${Math.round(this.hue)}, ${Math.round(this.saturation)}%, ${flashLight}%)`;
            } else if (this.flashing && this.blackBoid) {
                c.fillStyle = 'hsl(0, 0%, 90%)';
                //c.strokeStyle = 'hsl(0, 0%, 100%)';
            }
            c.save();
            c.translate(cX(this.pos), cY(this.pos));
            c.rotate(-angle); 
            if (boidFillEnabled) {
                c.fillRect(0.5 * radScale, -0.5 * radScale, radScale, radScale);
            }
            if (boidTraceMode > 0) {
                if (boidTraceMode === 1) {
                    c.strokeStyle = 'hsl(0, 0%, 0%)';
                    c.lineWidth = 1.0;
                } else if (boidTraceMode === 2) {
                    c.strokeStyle = this.cachedStrokeStyle;
                    c.lineWidth = 2.0;
                } else if (boidTraceMode === 3) {
                    c.strokeStyle = 'hsl(0, 0%, 90%)';
                    c.lineWidth = 1.0;
                }
                c.strokeRect(0.5 * radScale, -0.5 * radScale, radScale, radScale);
            }
            c.restore();
        }

        // Draw flappy boid --------------------------------------------
        if (this.flappy) {
            const angle = Math.atan2(this.vel.y, this.vel.x);
            c.save();
            c.translate(cX(this.pos), cY(this.pos));
            c.rotate(-angle); 

            /* boid shape reference:

            o        /\
                    /  \ 
            /------/    \--\
            \------\    /--/
                    \  /   
                     \/    

            */

            const bodyYCenter = 0.5 * this.radius;
            const boidSize = 2.0 * radScale;
            const headLength = boidSize * 0.2;
            const headWidth = boidSize * 0.2;
            const bodyLength = boidSize * 0.3;
            const bodyWidth = boidSize * 0.2;
            const tailLength = boidSize * 0.4;
            const tailWidth = boidSize * 0.1;
            const wingSpan = boidSize * this.flapper;
            
            // start at tail
            c.beginPath();
            c.moveTo(0, bodyYCenter - 0.5 * tailWidth); // tail top
            c.lineTo(tailLength, bodyYCenter - 0.5 * bodyWidth); // rear of left wing
            c.lineTo(tailLength - 0.1 * bodyLength, bodyYCenter - 0.5 * bodyWidth - 0.5 * wingSpan); // left wing tip
            c.lineTo(tailLength + bodyLength, bodyYCenter - 0.5 * headWidth);  // front of left wing / rear of head
            c.lineTo(tailLength + bodyLength + headLength, bodyYCenter); // tip of head
            c.lineTo(tailLength + bodyLength, bodyYCenter + 0.5 * headWidth);  // front of wing / rear of head
            c.lineTo(tailLength - 0.1 * bodyLength, bodyYCenter + 0.5 * bodyWidth + 0.5 * wingSpan); // right wing tip
            c.lineTo(tailLength, bodyYCenter + 0.5 * bodyWidth); // rear of right wing
            c.lineTo(0, bodyYCenter + 0.5 * tailWidth); // tail bottom
            c.closePath();
            if (!this.whiteBoid && !this.blackBoid && !this.flashing) {
                c.fillStyle = this.cachedFillStyle;
                //c.strokeStyle = this.cachedStrokeStyle;
            } else if (this.whiteBoid) {
                c.fillStyle = 'hsl(0, 0%, 90%)';
                //c.strokeStyle = 'hsl(0, 0%, 100%)';
            } else if (this.blackBoid) {
                c.fillStyle = 'hsl(0, 0%, 10%)';
                //c.strokeStyle = 'hsl(0, 0%, 0%)';
            } else if (this.flashing) {
                const flashLight = this.lightness * 1.5;
                c.fillStyle = `hsl(${Math.round(this.hue)}, ${Math.round(this.saturation)}%, ${flashLight}%)`;
                //c.strokeStyle = `hsl(${Math.round(this.hue - 70)}, ${Math.round(this.saturation)}%, ${flashLight}%)`;
            }
            if (boidFillEnabled) {
                c.fill();
            }
            if (boidTraceMode > 0) {
                if (boidTraceMode === 1) {
                    c.strokeStyle = 'hsl(0, 0%, 0%)';
                    c.lineWidth = 1.0;
                } else if (boidTraceMode === 2) {
                    c.strokeStyle = this.cachedStrokeStyle;
                    c.lineWidth = 2.0;
                } else if (boidTraceMode === 3) {
                    c.strokeStyle = 'hsl(0, 0%, 90%)';
                    c.lineWidth = 1.0;
                }
                c.stroke();
            }
            
            c.restore();
        }
            
        // Draw airfoil boid --------------------------------------------
        if (!this.arrow && !this.circle && this.airfoil) {
            const angle = Math.atan2(this.vel.y, this.vel.x);
            c.save();
            c.translate(cX(this.pos), cY(this.pos));
            c.rotate(.5 * Math.PI - angle); // for teadrops
        
            const numPoints = 32; 
            const a = 0.2;
            const b = 1.5;
            const pivotOffsetX = 0;
            const pivotOffsetY = -b * radScale;  // Centroid of bulb head
            c.beginPath();  
            for (let i = 0; i <= numPoints; i++) {
                const t = Math.PI / 2 + (i / numPoints) * (2 * Math.PI);
                const x = (2 * a * Math.cos(t) - a * Math.sin(2 * t)) * radScale;
                const y = b * Math.sin(t) * radScale;
                if (i === 0) {
                    c.moveTo(x - pivotOffsetX, y - pivotOffsetY);
                } else {
                    c.lineTo(x - pivotOffsetX, y - pivotOffsetY);
                }
            }  
            c.closePath();
            if (!this.whiteBoid && !this.blackBoid && !this.flashing) {
                c.fillStyle = this.cachedFillStyle;
            } else if (this.whiteBoid) {
                c.fillStyle = 'hsl(0, 0%, 90%)';
            } else if (this.blackBoid) {
                c.fillStyle = 'hsl(0, 0%, 10%)';
            } else if (this.flashing) {
                const flashLight = Math.round(this.lightness * 1.5);
                c.fillStyle = `hsl(${Math.round(this.hue)}, ${Math.round(this.saturation)}%, ${flashLight}%)`;
                //c.strokeStyle = `hsl(${Math.round(this.hue - 70)}, ${Math.round(this.saturation)}%, ${flashLight}%)`;
            }
            if (boidFillEnabled) {
                c.fill();
            }
            if (boidTraceMode > 0) {
                if (boidTraceMode === 1) {
                    c.strokeStyle = 'hsl(0, 0%, 0%)';
                    c.lineWidth = 1.0;
                } else if (boidTraceMode === 2) {
                    c.strokeStyle = this.cachedStrokeStyle;
                    c.lineWidth = 2.0;
                } else if (boidTraceMode === 3) {
                    c.strokeStyle = 'hsl(0, 0%, 90%)';
                    c.lineWidth = 1.0;
                }
                c.stroke();
            }
            c.restore();
        }
    }
}

//  CHANGE BOID TYPES ---------------------------------------------------------------------
function doTriangleBoids() {
    for (let boid of Boids) {
        boid.triangleBoid = true;
        boid.arrow = false;
        boid.circle = false;
        boid.ellipseBoid = false;
        boid.airfoil = false;
        boid.flappy = false;
        boid.square = false;
        boid.glowBoid = false;
    }
}

function doArrowBoids() {
    for (let boid of Boids) {
        boid.triangleBoid = false;
        boid.arrow = true;
        boid.circle = false;
        boid.airfoil = false;
        boid.flappy = false;
        boid.square = false;
        boid.glowBoid = false;
    }
}   

function doCircleBoids() {
    for (let boid of Boids) {
        boid.triangleBoid = false;
        boid.arrow = false;
        boid.circle = true;
        boid.ellipseBoid = false;
        boid.airfoil = false;
        boid.flappy = false;
        boid.square = false;
        boid.glowBoid = false;
    }
} 

function doEllipseBoids() {
    for (let boid of Boids) {
        boid.triangleBoid = false;
        boid.arrow = false;
        boid.circle = false;
        boid.ellipseBoid = true;
        boid.airfoil = false;
        boid.flappy = false;
        boid.square = false;
        boid.glowBoid = false;
    }
}

function doGlowBoids() {
    for (let boid of Boids) {
        boid.triangleBoid = false;
        boid.arrow = false;
        boid.circle = false;
        boid.ellipseBoid = false;
        boid.airfoil = false;
        boid.flappy = false;
        boid.square = false;
        boid.glowBoid = true;
    }
} 

function doSquareBoids() {
    for (let boid of Boids) {
        boid.triangleBoid = false;
        boid.arrow = false;
        boid.circle = false;
        boid.ellipseBoid = false;
        boid.airfoil = false;
        boid.flappy = false;
        boid.square = true;
        boid.glowBoid = false;
    }
} 

function doAirfoilBoids() {
    for (let boid of Boids) {
        boid.triangleBoid = false;
        boid.arrow = false;
        boid.circle = false;
        boid.ellipseBoid = false;
        boid.airfoil = true;
        boid.flappy = false;
        boid.square = false;
        boid.glowBoid = false;
    }
}  

function doFlappyBoids() {
    for (let boid of Boids) {
        boid.triangleBoid = false;
        boid.arrow = false;
        boid.circle = false;
        boid.ellipseBoid = false;
        boid.airfoil = false;
        boid.flappy = true;
        boid.square = false;
        boid.glowBoid = false;
    }
}

function doNoneBoids() {
    for (let boid of Boids) {
        boid.triangleBoid = false;
        boid.arrow = false;
        boid.circle = false;
        boid.ellipseBoid = false;
        boid.airfoil = false;
        boid.flappy = false;
        boid.square = false;
        boid.glowBoid = false;
    }
}  

function drawMainMenu() {
    // Only draw menu if it has some opacity
    if (mainMenuOpacity <= 0) return;
    
    const ellipsisWorldX = 0.05;
    const ellipsisWorldY = simHeight - 0.05;
    const ellipsisX = ellipsisWorldX * cScale;
    const ellipsisY = canvas.height - ellipsisWorldY * cScale;
    
    // Menu dimensions (horizontal layout)
    const itemHeight = 0.12 * cScale;
    const itemWidth = 0.24 * cScale;
    const padding = 0.02 * cScale;
    const iconSize = 0.06 * cScale;
    const menuHeight = itemHeight + (padding * 2);
    const menuWidth = (itemWidth * 4) + (padding * 5);
    
    // Menu position - to the right of ellipsis with animation
    // Position menu so it extends downward and is clearly visible
    const menuBaseX = ellipsisX + 0.08 * cScale;
    const menuX = menuBaseX + mainMenuXOffset * cScale;
    const menuY = ellipsisY - 0.04 * cScale; // Position top of menu slightly above ellipsis center
    
    c.save();
    c.globalAlpha = mainMenuOpacity;
    
    // Draw menu background with rounded corners
    const cornerRadius = 0.02 * cScale;
    c.beginPath();
    c.moveTo(menuX + cornerRadius, menuY);
    c.lineTo(menuX + menuWidth - cornerRadius, menuY);
    c.quadraticCurveTo(menuX + menuWidth, menuY, menuX + menuWidth, menuY + cornerRadius);
    c.lineTo(menuX + menuWidth, menuY + menuHeight - cornerRadius);
    c.quadraticCurveTo(menuX + menuWidth, menuY + menuHeight, menuX + menuWidth - cornerRadius, menuY + menuHeight);
    c.lineTo(menuX + cornerRadius, menuY + menuHeight);
    c.quadraticCurveTo(menuX, menuY + menuHeight, menuX, menuY + menuHeight - cornerRadius);
    c.lineTo(menuX, menuY + cornerRadius);
    c.quadraticCurveTo(menuX, menuY, menuX + cornerRadius, menuY);
    c.closePath();
    
    const menuGradient = c.createLinearGradient(menuX, menuY, menuX, menuY + menuHeight);
    menuGradient.addColorStop(0, `hsla(210, 0%, 10%, 0.6)`);
    menuGradient.addColorStop(1, `hsla(210, 0%, 20%, 0.6)`);
    c.fillStyle = menuGradient;
    c.fill();
    
    // Menu items configuration
    const menuItems = [
        { label: 'Simulation', active: menuVisible, icon: 'sim' },
        { label: 'Sky', active: skyMenuVisible, icon: 'sky' },
        { label: 'Paint', active: colorMenuVisible, icon: 'paint' },
        { label: 'Draw', active: drawMenuVisible, icon: 'draw' }
    ];
    
    // Draw menu items
    for (let i = 0; i < menuItems.length; i++) {
        const item = menuItems[i];
        const itemX = menuX + padding + (i * (itemWidth + padding));
        const itemY = menuY + padding;

        // Draw item background with rounded corners
        c.beginPath();
        c.moveTo(itemX + cornerRadius * 0.5, itemY);
        c.lineTo(itemX + itemWidth - cornerRadius * 0.5, itemY);
        c.quadraticCurveTo(itemX + itemWidth, itemY, itemX + itemWidth, itemY + cornerRadius * 0.5);
        c.lineTo(itemX + itemWidth, itemY + itemHeight - cornerRadius * 0.5);
        c.quadraticCurveTo(itemX + itemWidth, itemY + itemHeight, itemX + itemWidth - cornerRadius * 0.5, itemY + itemHeight);
        c.lineTo(itemX + cornerRadius * 0.5, itemY + itemHeight);
        c.quadraticCurveTo(itemX, itemY + itemHeight, itemX, itemY + itemHeight - cornerRadius * 0.5);
        c.lineTo(itemX, itemY + cornerRadius * 0.5);
        c.quadraticCurveTo(itemX, itemY, itemX + cornerRadius * 0.5, itemY);
        c.closePath();
        // Draw item background (highlight if active)
        if (item.active) {
            if (item.icon === 'sim') {
                c.fillStyle = `hsla(210, 90%, 60%, 0.3)`;
            } else if (item.icon === 'paint') {
                c.fillStyle = `hsla(0, 0%, 80%, 0.3)`;
            } else if (item.icon === 'sky') {
                c.fillStyle = `hsla(30, 90%, 60%, 0.3)`;
            } else if (item.icon === 'draw') {
                c.fillStyle = `hsla(340, 70%, 60%, 0.3)`;
            }
        } else {
            c.fillStyle = `hsla(0, 0%, 15%, 0.6)`;
        }
        c.fill();
        
        // Draw icon (centered horizontally in item)
        const iconX = itemX + itemWidth / 2;
        const iconY = itemY + itemHeight / 2 - padding;
        const iconColor = item.active ? 
            `hsla(120, 0%, 90%, 1.0)` : 
            `hsla(0, 0%, 30%, 1.0)`;
        
        c.strokeStyle = iconColor;
        c.fillStyle = iconColor;
        c.lineWidth = 0.006 * cScale;
        c.lineCap = 'round';
        c.lineJoin = 'round';
        
        // Draw sim icon --------------------
        if (item.icon === 'sim') {
            // Draw gear icon with flat-topped teeth
            const numTeeth = 8;
            const outerRadius = iconSize * 0.45;
            const innerRadius = iconSize * 0.32;
            const centerRadius = iconSize * 0.18;
            const toothFlatWidth = 0.2; // Width of flat top in radians
            c.beginPath();
            for (let t = 0; t < numTeeth; t++) {
                const baseAngle = (t * 2 * Math.PI) / numTeeth;
                const nextBaseAngle = ((t + 1) * 2 * Math.PI) / numTeeth;
                
                // Left edge of flat top
                const outerLeft = baseAngle - toothFlatWidth / 2;
                const x1 = iconX + Math.cos(outerLeft) * outerRadius;
                const y1 = iconY + Math.sin(outerLeft) * outerRadius;
                if (t === 0) c.moveTo(x1, y1);
                else c.lineTo(x1, y1);
                
                // Right edge of flat top (draws the flat top as a line segment)
                const outerRight = baseAngle + toothFlatWidth / 2;
                const x2 = iconX + Math.cos(outerRight) * outerRadius;
                const y2 = iconY + Math.sin(outerRight) * outerRadius;
                c.lineTo(x2, y2);
                
                // Down to valley
                const valleyAngle = (baseAngle + nextBaseAngle) / 2;
                const x3 = iconX + Math.cos(valleyAngle) * innerRadius;
                const y3 = iconY + Math.sin(valleyAngle) * innerRadius;
                c.lineTo(x3, y3);
            }
            c.closePath();
            c.fill();

            // Draw center circle
            c.fillStyle = `hsla(0, 0%, 15%, 0.6)`;
            c.beginPath();
            c.arc(iconX, iconY, centerRadius, 0, 2 * Math.PI);
            c.fill();

        // Draw paint icon --------------------
        } else if (item.icon === 'paint') {
            // Draw color wheel icon (using pre-generated color wheel)
            const wheelRadius = iconSize * 0.45;
            if (colorWheelCanvas) {
                c.save();
                
                // Dim when not active
                if (!item.active) {
                    c.globalAlpha = mainMenuOpacity * 0.4;
                }
                c.beginPath();
                c.arc(iconX, iconY, wheelRadius, 0, 2 * Math.PI);
                c.clip();
                // Draw the color wheel
                c.drawImage(
                    colorWheelCanvas,
                    iconX - wheelRadius,
                    iconY - wheelRadius,
                    wheelRadius * 2,
                    wheelRadius * 2
                );
                
                c.restore();
                
                // Draw outer ring to clean up edges
                c.strokeStyle = iconColor;
                c.lineWidth = iconSize * 0.06;
                c.beginPath();
                c.arc(iconX, iconY, wheelRadius, 0, 2 * Math.PI);
                c.stroke();
            }

        // Draw sky icon --------------------
        } else if (item.icon === 'sky') {
            // Draw asymmetrical cloud icon with truly flat bottom using clipping
            const cloudRadius = iconSize * 0.35;
            const flatBottomY = iconY + cloudRadius * 1.2;
            
            c.save();
            
            // Create clipping rectangle to cut off bottom at flat line
            const clipLeft = iconX - cloudRadius * 1.8;
            const clipRight = iconX + cloudRadius * 1.8;
            const clipTop = iconY - cloudRadius * 1.5;
            c.beginPath();
            c.rect(clipLeft, clipTop, clipRight - clipLeft, flatBottomY - clipTop);
            c.clip();
            
            // Now draw the circles - they'll be clipped at the bottom
            c.fillStyle = iconColor;
            c.beginPath();
            // Left puff (medium)
            c.arc(iconX - cloudRadius * 0.95, flatBottomY - cloudRadius * 0.5, cloudRadius * 0.82, 0, 2 * Math.PI);
            c.fill();
            c.beginPath();
            // Center puff (largest)
            c.arc(iconX, flatBottomY, cloudRadius * 1.05, 0, 2 * Math.PI);
            c.fill();
            c.beginPath();
            // Right puff (small)
            c.arc(iconX + cloudRadius * 0.9, flatBottomY - cloudRadius * 0.55, cloudRadius * 0.7, 0, 2 * Math.PI);
            c.fill();
            c.beginPath();
            // Fourth puff adds height above center-left
            c.arc(iconX - cloudRadius * 0.3, iconY - cloudRadius * 0.15, cloudRadius * 0.88, 0, 2 * Math.PI);
            c.fill();
            
            c.restore();
        
        // Draw draw icon --------------------
        } else if (item.icon === 'draw') {
            // Draw pencil icon
            const pencilLength = iconSize * 1.25;
            const pencilWidth = iconSize * 0.35;
            const tipHeight = iconSize * 0.36;
            
            c.save();
            c.translate(iconX, iconY);
            c.rotate(-Math.PI / 4); // Rotate 45 degrees
            
            // Draw wooden body
            c.fillStyle = item.active ? `hsla(30, 60%, 55%, 1.0)` : `hsla(30, 30%, 35%, 1.0)`;
            c.beginPath();
            c.rect(-pencilWidth / 2, -pencilLength / 2 + tipHeight, pencilWidth, pencilLength - tipHeight);
            c.fill();
            
            // Draw graphite tip
            c.fillStyle = item.active ? `hsla(0, 0%, 50%, 1.0)` : `hsla(0, 0%, 20%, 1.0)`;
            c.beginPath();
            c.moveTo(0, -pencilLength / 2);
            c.lineTo(-pencilWidth / 2, -pencilLength / 2 + tipHeight);
            c.lineTo(pencilWidth / 2, -pencilLength / 2 + tipHeight);
            c.closePath();
            c.fill();
            
            // Draw eraser
            c.fillStyle = item.active ? `hsla(340, 70%, 60%, 1.0)` : `hsla(340, 30%, 40%, 1.0)`;
            c.beginPath();
            c.rect(-pencilWidth / 2, pencilLength / 2 - iconSize * 0.18, pencilWidth, iconSize * 0.18);
            c.fill();
            
            // Draw metal band
            c.fillStyle = item.active ? `hsla(0, 0%, 70%, 1.0)` : `hsla(0, 0%, 40%, 1.0)`;
            c.beginPath();
            c.rect(-pencilWidth / 2, pencilLength / 2 - iconSize * 0.24, pencilWidth, iconSize * 0.06);
            c.fill();
            
            c.restore();
        }
        
        // Draw label text (centered below icon)
        c.fillStyle = item.active ? 
            `hsla(210, 0%, 90%, 1.0)` : 
            `hsla(210, 0%, 80%, 1.0)`;
        c.font = `bold ${0.028 * cScale}px verdana`;
        c.textAlign = 'center';
        c.textBaseline = 'top';
        c.fillText(item.label, iconX, iconY + iconSize * 0.75);
    }
    
    c.restore();
}


function drawSimMenu() {
    // Draw ellipsis button (in world coordinates)
    const ellipsisWorldX = 0.05;
    const ellipsisWorldY = simHeight - 0.05;
    const ellipsisX = ellipsisWorldX * cScale;
    const ellipsisY = canvas.height - ellipsisWorldY * cScale;
    const dotRadius = 0.006 * cScale;
    const dotSpacing = 0.016 * cScale;

    // Draw three dots for ellipsis
    c.fillStyle = `hsla(210, 60%, 80%, 0.8)`;
    for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.arc(ellipsisX + i * dotSpacing, ellipsisY, dotRadius, 0, 2 * Math.PI);
        c.fill();
    }

    // Draw arrow pointing to ellipsis on fifth pass
    if (Airplane[0].passNumber == 5 && doArrow && !mainMenuVisible) {
        if (justStarted) {
            arrowStartTime = Date.now();
            justStarted = false;
        }
        // Animate arrow bounce
        arrowBounceTimer += 0.05;
        if (arrowBounceTimer >= 2 * Math.PI) {
            arrowBounceTimer = 0;
        }
        const bounceOffset = Math.abs(Math.sin(arrowBounceTimer)) * 0.1;
        let arrowOpacity;
        if (Date.now() - arrowStartTime > 5000) {
            arrowOpacity = 1 - ((Date.now() - arrowStartTime - 5000) / 5000);
        } else {
            arrowOpacity = 1.0;
        }
        drawArrow(0.2 + bounceOffset, simHeight - ellipsisWorldY, 180, 0.11, arrowOpacity);
        if (Date.now() - arrowStartTime > 10000) {
            doArrow = false;
        }
    }
    
    // Only draw menu if it has some opacity
    if (menuOpacity <= 0) return;
    
    // variables to control:
    
    // numBoids - range from 100 to 5000, integer
    // boidRadius - range from 1 to 10, integer
    // visualRange - range from 0.05 to 0.5
    // speedLimit - range from 0.1 to 3.0

    // Rule #1: minDistance - range from 0.0 to 0.2
    // Rule #1: avoidFactor - range from 0 to 100, integer
    // Rule #2: matchingFactor - range from 0 to 50, integer
    // Rule #3: centeringFactor - range from 0 to 20, integer

    // turnFactor - range from 0 to 100, integer
    // trailLength - range from 0 to 100, integer

    // fps display

    const menuItems = [
        boidProps.numBoids, boidProps.boidRadius, boidProps.visualRange, boidProps.speedLimit,
        null, boidProps.avoidFactor, boidProps.matchingFactor, boidProps.centeringFactor,
        boidProps.turnFactor, boidProps.tailLength, boidProps.tailWidth];

    // Define min/max ranges for each parameter
    const ranges = [
        {min: 100, max: 5000},      // numBoids
        {min: 1, max: 10},           // boidRadius (scaled by 100)
        {min: 0.05, max: 0.5},       // visualRange
        {min: 0.1, max: 3.0},        // speedLimit
        {min: 0.0, max: 0.2},        // (removed) was minDistance
        {min: 0, max: 100},          // avoidFactor
        {min: 0, max: 50},           // matchingFactor
        {min: 0, max: 20},           // centeringFactor
        {min: 0, max: 5},            // turnFactor
        {min: 0, max: 100},          // trailLength
        {min: 1.0, max: 5.0}         // tailWidth
    ];

    const knobRadius = 0.1 * cScale;
    const knobSpacing = knobRadius * 3;
    const menuTopMargin = 0.2 * knobRadius; // Control vertical offset of elements within the menu
    const menuUpperLeftX = menuX * cScale;
    const menuUpperLeftY = canvas.height - menuY * cScale;
    const fullMeterSweep = 1.6 * Math.PI;
    const meterStart = 0.5 * Math.PI + 0.5 * (2 * Math.PI - fullMeterSweep);

    c.save();
    c.translate(menuUpperLeftX + knobSpacing, menuUpperLeftY + 0.5 * knobSpacing);
    /*
    drawKittyLamp(
        menuUpperLeftX + 3.3 * knobRadius, 
        menuUpperLeftY + 4.5 * knobRadius,
        menuOpacity);
    */

    // Draw overall menu background with rounded corners
    const menuWidth = knobSpacing * 3;
    const menuHeight = knobSpacing * 2 + knobRadius * 3.5;
    const padding = 1.7 * knobRadius;
    const cornerRadius = 0.05 * cScale;
    c.beginPath();
    c.moveTo(-padding + cornerRadius, -padding);
    c.lineTo(menuWidth + padding - cornerRadius, -padding);
    c.quadraticCurveTo(menuWidth + padding, -padding, menuWidth + padding, -padding + cornerRadius);
    c.lineTo(menuWidth + padding, menuHeight + padding - cornerRadius);
    c.quadraticCurveTo(menuWidth + padding, menuHeight + padding, menuWidth + padding - cornerRadius, menuHeight + padding);
    c.lineTo(-padding + cornerRadius, menuHeight + padding);
    c.quadraticCurveTo(-padding, menuHeight + padding, -padding, menuHeight + padding - cornerRadius);
    c.lineTo(-padding, -padding + cornerRadius);
    c.quadraticCurveTo(-padding, -padding, -padding + cornerRadius, -padding);
    c.closePath();
    //c.fillStyle = `hsla(210, 80%, 10%, ${0.4 * menuOpacity})`;
    c.strokeStyle = `hsla(210, 60%, 80%, ${menuOpacity})`;
    c.lineWidth = 0.004 * cScale;
    const menuGradient = c.createLinearGradient(0, -padding, 0, menuHeight + padding);
    menuGradient.addColorStop(0, `hsla(210, 80%, 20%, ${0.9 * menuOpacity})`);
    menuGradient.addColorStop(1, `hsla(210, 80%, 5%, ${0.9 * menuOpacity})`);
    c.fillStyle = menuGradient;
    c.fill();
    c.stroke();

    // Draw title
    c.fillStyle = `hsla(210, 80%, 80%, ${menuOpacity})`;
    c.font = `bold ${0.05 * cScale}px verdana`;
    c.textAlign = 'center';
    c.fillText('SIMULATION', menuWidth / 2, -padding + 0.04 * cScale);
    
    // Draw close icon in upper left corner (round button)
    const closeIconRadius = knobRadius * 0.25;
    const closeIconX = -padding + closeIconRadius + 0.2 * knobRadius;
    const closeIconY = -padding + closeIconRadius + 0.2 * knobRadius;
    
    // Red background circle
    c.beginPath();
    c.arc(closeIconX, closeIconY, closeIconRadius, 0, 2 * Math.PI);
    c.fillStyle = `hsla(0, 70%, 40%, ${menuOpacity})`;
    c.fill();
    
    // Black X
    c.strokeStyle = `hsla(0, 0%, 0%, ${menuOpacity})`;
    c.lineWidth = 0.05 * knobRadius;
    c.lineCap = 'round';
    const xSize = closeIconRadius * 0.4;
    c.beginPath();
    c.moveTo(closeIconX - xSize, closeIconY - xSize);
    c.lineTo(closeIconX + xSize, closeIconY + xSize);
    c.moveTo(closeIconX + xSize, closeIconY - xSize);
    c.lineTo(closeIconX - xSize, closeIconY + xSize);
    c.stroke();

    // Draw knobs ---------------------------------------------
    c.lineCap = 'round';
    for (var knob = 0; knob < menuItems.length; knob++) {
        if (knob === 4) continue; // Skip removed knob
        // fill and trace knob background
        const layoutIndex = knob > 4 ? knob - 1 : knob;
        const row = Math.floor(layoutIndex / 4);
        const col = layoutIndex % 4;
        const knobX = col * knobSpacing;
        const knobY = row * knobSpacing + menuTopMargin;
        c.beginPath();
        c.arc(knobX, knobY, 1.05 *knobRadius, 0, 2 * Math.PI, false);
        c.fillStyle = `hsla(210, 40%, 15%, ${0.9 * menuOpacity})`;
        c.fill();
        c.strokeStyle = `hsla(210, 40%, 50%, ${menuOpacity})`;
        c.lineWidth = 0.003 * cScale;
        c.stroke();

        // draw needle / knob indicator
        let knobValue = menuItems[knob];
        // Normalize the value based on its range
        let normalizedValue;
        if (knob === 0) {
            // numBoids - use actual count instead of target
            normalizedValue = (Boids.length - ranges[knob].min) / (ranges[knob].max - ranges[knob].min);
        } else if (knob === 1) {
            // boidRadius needs to be scaled by 100
            normalizedValue = (boidRadius * 100 - ranges[knob].min) / (ranges[knob].max - ranges[knob].min);
        } else {
            normalizedValue = (knobValue - ranges[knob].min) / (ranges[knob].max - ranges[knob].min);
        }
        
        // normalize to 0-1 range
        normalizedValue = Math.max(0, Math.min(1, normalizedValue));
        const angle = meterStart + normalizedValue * fullMeterSweep;
        const indicatorLength = knobRadius * 1.0;
        const indicatorX = knobX + Math.cos(angle) * indicatorLength;
        const indicatorY = knobY + Math.sin(angle) * indicatorLength;

        // draw meter arc
        const gradient = c.createLinearGradient(
            knobX + Math.cos(meterStart) * knobRadius,
            knobY + Math.sin(meterStart) * knobRadius,
            knobX + Math.cos(meterStart + fullMeterSweep) * knobRadius,
            knobY + Math.sin(meterStart + fullMeterSweep) * knobRadius
        );
        gradient.addColorStop(0, `hsla(190, 40%, 50%, ${menuOpacity})`);
        gradient.addColorStop(0.5, `hsla(170, 40%, 50%, ${menuOpacity})`);
        c.strokeStyle = gradient;
        c.beginPath();
        c.arc(knobX, knobY, knobRadius * 0.85, meterStart, meterStart + fullMeterSweep * normalizedValue);
        c.lineWidth = 0.02 * cScale;
        c.stroke();

        // Draw needle
        const pointerAngle = meterStart + fullMeterSweep * normalizedValue;
        const pointerLength = knobRadius * 0.6;
        const pointerEndX = knobX + Math.cos(pointerAngle) * pointerLength;
        const pointerEndY = knobY + Math.sin(pointerAngle) * pointerLength;
        c.beginPath();
        c.moveTo(knobX, knobY);
        c.lineTo(pointerEndX, pointerEndY);
        c.strokeStyle = `hsla(210, 80%, 80%, ${menuOpacity})`;
        c.lineWidth = 0.008 * cScale;
        c.stroke();

        // draw knob label
        c.lineWidth = 0.03 * knobRadius;
        c.lineJoin = 'round';
        
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        let label = '';
        switch (knob) {
            case 0: label = "Number of Boids"; break;
            case 1: label = 'Size'; break;
            case 2: label = 'Visual Range'; break;
            case 3: label = 'Speed Limit'; break;
            case 4: label = 'blank'; break;
            case 5: label = 'Rule 1: Separation'; break;
            case 6: label = 'Rule 2: Alignment'; break;
            case 7: label = 'Rule 3: Cohesion'; break;
            case 8: label = 'Confinement'; break;
            case 9: label = 'Tail Length'; break;
            case 10: label = 'Tail Width'; break;
        }
        c.font = `${0.29 * knobRadius}px verdana`;
        c.strokeStyle = `hsla(210, 80%, 0%, ${0.6 * menuOpacity})`;
        c.strokeText(label, 0.04 * knobRadius + knobX, 0.04 * knobRadius + (knobY + 1.35 * knobRadius));
        c.font = ` ${0.29 * knobRadius}px verdana`;
        c.fillStyle = `hsla(210, 80%, 95%, ${menuOpacity})`;
        c.fillText(label, knobX, knobY + 1.35 * knobRadius);

        // draw knob value
        let valueText = '';
        switch (knob) {
            case 0: valueText = Boids.length; break;
            case 1: valueText = (boidRadius * 100).toFixed(1); break;
            case 2: valueText = (boidProps.visualRange).toFixed(2); break;
            case 3: valueText = (boidProps.speedLimit).toFixed(1); break;
            case 5: valueText = (boidProps.avoidFactor).toFixed(0); break;
            case 6: valueText = (boidProps.matchingFactor).toFixed(1); break;
            case 7: valueText = (boidProps.centeringFactor).toFixed(1); break;
            case 8: valueText = (boidProps.turnFactor).toFixed(1); break;
            case 9: valueText = boidProps.tailLength.toString(); break;
            case 10: valueText = (boidProps.tailWidth).toFixed(1); break;
        }
        c.font = `${0.25 * knobRadius}px verdana`;
        c.fillStyle = `hsla(160, 80%, 50%, ${menuOpacity})`;
        c.fillText(valueText, knobX, knobY + 0.6 * knobRadius);
    }

    // Draw tail color radio buttons below tail length knob (knob 9)
    const tailColorRadioRadius = knobRadius * 0.25;
    const tailKnobRow = 2;
    const tailButtonsCenterX = 0.5; // Center between columns 0 and 1
    const tailRadioLabels = ['None', 'Black', 'White', 'Hue', 'Hue2'];
    
    // Draw bracket and label for tail style buttons
    const tailBracketY = tailKnobRow * knobSpacing + knobRadius * 2.4 + menuTopMargin;
    const tailBracketLeftX = tailButtonsCenterX * knobSpacing - 2.4 * knobRadius;
    const tailBracketRightX = tailButtonsCenterX * knobSpacing + 2.4 * knobRadius;
    const tailBracketHeight = 0.15 * knobRadius;
    
    c.beginPath();
    c.moveTo(tailBracketLeftX, tailBracketY);
    c.lineTo(tailBracketLeftX, tailBracketY - tailBracketHeight);
    c.lineTo(tailBracketRightX, tailBracketY - tailBracketHeight);
    c.lineTo(tailBracketRightX, tailBracketY);
    c.strokeStyle = `hsla(210, 80%, 70%, ${menuOpacity})`;
    c.lineWidth = 0.04 * knobRadius;
    c.stroke();
    
    // Draw "Tail Style" label
    c.textAlign = 'center';
    c.textBaseline = 'bottom';
    c.font = `${0.28 * knobRadius}px verdana`;
    c.strokeStyle = `hsla(210, 80%, 0%, ${0.5 * menuOpacity})`;
    c.lineWidth = 0.02 * knobRadius;
    c.strokeText('Tail Style', tailButtonsCenterX * knobSpacing, tailBracketY - tailBracketHeight - 0.1 * knobRadius);
    c.fillStyle = `hsla(210, 80%, 90%, ${menuOpacity})`;
    c.fillText('Tail Style', tailButtonsCenterX * knobSpacing, tailBracketY - tailBracketHeight - 0.1 * knobRadius);
    
    for (let i = 0; i < 5; i++) {
        const buttonX = tailButtonsCenterX * knobSpacing + (i - 2) * knobRadius * 1.0;
        const buttonY = tailKnobRow * knobSpacing + knobRadius * 2.9 + menuTopMargin;
        
        // Draw outer circle
        c.beginPath();
        c.arc(buttonX, buttonY, tailColorRadioRadius, 0, 2 * Math.PI);
        c.fillStyle = `hsla(210, 80%, 20%, ${0.3 * menuOpacity})`;
        c.fill();
        c.strokeStyle = `hsla(210, 80%, 70%, ${menuOpacity})`;
        c.lineWidth = 0.04 * knobRadius;
        c.stroke();
        
        // Draw filled center if selected
        if (tailColorMode === i) {
            c.beginPath();
            c.arc(buttonX, buttonY, tailColorRadioRadius * 0.5, 0, 2 * Math.PI);
            c.fillStyle = `hsla(210, 0%, 90%, ${menuOpacity})`;
            c.fill();
        }

        // Draw label below button
        c.textAlign = 'center';
        c.textBaseline = 'top';
        c.font = `${0.24 * knobRadius}px verdana`;
        c.strokeStyle = `hsla(210, 80%, 0%, ${0.5 * menuOpacity})`;
        c.lineWidth = 0.02 * knobRadius;
        c.strokeText(tailRadioLabels[i], buttonX, buttonY + tailColorRadioRadius + 0.15 * knobRadius);
        c.fillStyle = `hsla(210, 80%, 90%, ${menuOpacity})`;
        c.fillText(tailRadioLabels[i], buttonX, buttonY + tailColorRadioRadius + 0.15 * knobRadius);
    }
    
    // Draw trace/fill radio buttons in 4th column below confinement knob
    const traceButtonRadius = knobRadius * 0.25;
    const traceCol = 3;
    const traceButtonY1 = (2 * knobSpacing) - (0.6 * knobRadius) + menuTopMargin;
    const traceButtonY2 = traceButtonY1 + 0.8 * knobRadius;
    const traceButtonY3 = traceButtonY2 + 0.8 * knobRadius;
    const traceButtonY4 = traceButtonY3 + 0.8 * knobRadius;
    const fillButtonY1 = traceButtonY4 + 1.0 * knobRadius;
    const fillButtonY2 = fillButtonY1 + 0.8 * knobRadius;
    
    const traceButtonX = traceCol * knobSpacing - 0.5 * knobRadius;
    
    // Draw bracket and label for trace buttons
    const bracketX = traceButtonX - traceButtonRadius - 0.35 * knobRadius;
    const bracketTopY = traceButtonY1 - 0.4 * knobRadius;
    const bracketBottomY = traceButtonY4 + 0.4 * knobRadius;
    const bracketMidY = (bracketTopY + bracketBottomY) / 2;
    const bracketWidth = 0.15 * knobRadius;
    
    c.beginPath();
    c.moveTo(bracketX + bracketWidth, bracketTopY);
    c.lineTo(bracketX, bracketTopY);
    c.lineTo(bracketX, bracketBottomY);
    c.lineTo(bracketX + bracketWidth, bracketBottomY);
    c.strokeStyle = `hsla(210, 80%, 70%, ${menuOpacity})`;
    c.lineWidth = 0.04 * knobRadius;
    c.stroke();
    
    // Draw rotated "Trace" label
    c.save();
    c.translate(bracketX - 0.3 * knobRadius, bracketMidY);
    c.rotate(-Math.PI / 2);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `${0.3 * knobRadius}px verdana`;
    c.strokeStyle = `hsla(210, 80%, 0%, ${0.5 * menuOpacity})`;
    c.strokeText('Trace', 0, 0.04 * knobRadius);
    c.fillStyle = `hsla(210, 80%, 90%, ${menuOpacity})`;
    c.fillText('Trace', 0, 0);
    c.restore();
    
    // Trace button (dark outline)
    c.beginPath();
    c.arc(traceButtonX, traceButtonY1, traceButtonRadius, 0, 2 * Math.PI);
    c.fillStyle = `hsla(210, 80%, 20%, ${0.3 * menuOpacity})`;
    c.fill();
    c.strokeStyle = `hsla(210, 80%, 70%, ${menuOpacity})`;
    c.lineWidth = 0.05 * knobRadius;
    c.stroke();
    if (boidTraceMode === 1) {
        c.beginPath();
        c.arc(traceButtonX, traceButtonY1, traceButtonRadius * 0.5, 0, 2 * Math.PI);
        c.fillStyle = `hsla(210, 0%, 90%, ${menuOpacity})`;
        c.fill();
    }
    c.textAlign = 'left';
    c.textBaseline = 'middle';
    c.font = `${0.28 * knobRadius}px verdana`;
    c.strokeStyle = `hsla(210, 80%, 0%, ${0.5 * menuOpacity})`;
    c.strokeText('Black', 0.04 * knobRadius + traceButtonX + traceButtonRadius + 0.2 * knobRadius, 0.04 * knobRadius + traceButtonY1);
    c.fillStyle = `hsla(210, 80%, 90%, ${menuOpacity})`;
    c.fillText('Black', traceButtonX + traceButtonRadius + 0.2 * knobRadius, traceButtonY1);
    
    // White button
    c.beginPath();
    c.arc(traceButtonX, traceButtonY2, traceButtonRadius, 0, 2 * Math.PI);
    c.fillStyle = `hsla(210, 80%, 20%, ${0.3 * menuOpacity})`;
    c.fill();
    c.strokeStyle = `hsla(210, 80%, 70%, ${menuOpacity})`;
    c.lineWidth = 0.05 * knobRadius;
    c.stroke();
    if (boidTraceMode === 3) {
        c.beginPath();
        c.arc(traceButtonX, traceButtonY2, traceButtonRadius * 0.5, 0, 2 * Math.PI);
        c.fillStyle = `hsla(210, 0%, 90%, ${menuOpacity})`;
        c.fill();
    }
    c.textAlign = 'left';
    c.textBaseline = 'middle';
    c.font = `${0.28 * knobRadius}px verdana`;
    c.strokeStyle = `hsla(210, 80%, 0%, ${0.5 * menuOpacity})`;
    c.strokeText('White', 0.04 * knobRadius + traceButtonX + traceButtonRadius + 0.2 * knobRadius, 0.04 * knobRadius + traceButtonY2);
    c.fillStyle = `hsla(210, 80%, 90%, ${menuOpacity})`;
    c.fillText('White', traceButtonX + traceButtonRadius + 0.2 * knobRadius, traceButtonY2);
    
    // Color button (colored outline)
    c.beginPath();
    c.arc(traceButtonX, traceButtonY3, traceButtonRadius, 0, 2 * Math.PI);
    c.fillStyle = `hsla(210, 80%, 20%, ${0.3 * menuOpacity})`;
    c.fill();
    c.strokeStyle = `hsla(210, 80%, 70%, ${menuOpacity})`;
    c.lineWidth = 0.05 * knobRadius;
    c.stroke();
    if (boidTraceMode === 2) {
        c.beginPath();
        c.arc(traceButtonX, traceButtonY3, traceButtonRadius * 0.5, 0, 2 * Math.PI);
        c.fillStyle = `hsla(210, 0%, 90%, ${menuOpacity})`;
        c.fill();
    }
    c.strokeStyle = `hsla(210, 80%, 0%, ${0.5 * menuOpacity})`;
    c.strokeText('Color', 0.04 * knobRadius + traceButtonX + traceButtonRadius + 0.2 * knobRadius, 0.04 * knobRadius + traceButtonY3);
    c.fillStyle = `hsla(210, 80%, 90%, ${menuOpacity})`;
    c.fillText('Color', traceButtonX + traceButtonRadius + 0.2 * knobRadius, traceButtonY3);
    
    // Trace None button
    c.beginPath();
    c.arc(traceButtonX, traceButtonY4, traceButtonRadius, 0, 2 * Math.PI);
    c.fillStyle = `hsla(210, 80%, 20%, ${0.3 * menuOpacity})`;
    c.fill();
    c.strokeStyle = `hsla(210, 80%, 70%, ${menuOpacity})`;
    c.lineWidth = 0.05 * knobRadius;
    c.stroke();
    if (boidTraceMode === 0) {
        c.beginPath();
        c.arc(traceButtonX, traceButtonY4, traceButtonRadius * 0.5, 0, 2 * Math.PI);
        c.fillStyle = `hsla(210, 0%, 90%, ${menuOpacity})`;
        c.fill();
    }
    c.strokeStyle = `hsla(210, 80%, 0%, ${0.5 * menuOpacity})`;
    c.strokeText('None', 0.04 * knobRadius + traceButtonX + traceButtonRadius + 0.2 * knobRadius, 0.04 * knobRadius + traceButtonY4);
    c.fillStyle = `hsla(210, 80%, 90%, ${menuOpacity})`;
    c.fillText('None', traceButtonX + traceButtonRadius + 0.2 * knobRadius, traceButtonY4);
    
    // Draw bracket and label for fill buttons
    const fillBracketX = traceButtonX - traceButtonRadius - 0.35 * knobRadius;
    const fillBracketTopY = fillButtonY1 - 0.4 * knobRadius;
    const fillBracketBottomY = fillButtonY2 + 0.4 * knobRadius;
    const fillBracketMidY = (fillBracketTopY + fillBracketBottomY) / 2;
    
    c.beginPath();
    c.moveTo(fillBracketX + bracketWidth, fillBracketTopY);
    c.lineTo(fillBracketX, fillBracketTopY);
    c.lineTo(fillBracketX, fillBracketBottomY);
    c.lineTo(fillBracketX + bracketWidth, fillBracketBottomY);
    c.strokeStyle = `hsla(210, 80%, 70%, ${menuOpacity})`;
    c.lineWidth = 0.04 * knobRadius;
    c.stroke();
    
    // Draw rotated "Fill" label
    c.save();
    c.translate(fillBracketX - 0.3 * knobRadius, fillBracketMidY);
    c.rotate(-Math.PI / 2);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `${0.3 * knobRadius}px verdana`;
    c.strokeStyle = `hsla(210, 80%, 0%, ${0.5 * menuOpacity})`;
    c.strokeText('Fill', 0, 0.04 * knobRadius);
    c.fillStyle = `hsla(210, 80%, 90%, ${menuOpacity})`;
    c.fillText('Fill', 0, 0);
    c.restore();
    
    // Fill button
    c.beginPath();
    c.arc(traceButtonX, fillButtonY1, traceButtonRadius, 0, 2 * Math.PI);
    c.fillStyle = `hsla(210, 80%, 20%, ${0.3 * menuOpacity})`;
    c.fill();
    c.strokeStyle = `hsla(210, 80%, 70%, ${menuOpacity})`;
    c.lineWidth = 0.05 * knobRadius;
    c.stroke();
    if (boidFillEnabled) {
        c.beginPath();
        c.arc(traceButtonX, fillButtonY1, traceButtonRadius * 0.5, 0, 2 * Math.PI);
        c.fillStyle = `hsla(210, 0%, 90%, ${menuOpacity})`;
        c.fill();
    }
    c.textAlign = 'left';
    c.textBaseline = 'middle';
    c.font = `${0.28 * knobRadius}px verdana`;
    c.strokeStyle = `hsla(210, 80%, 0%, ${0.5 * menuOpacity})`;
    c.strokeText('Fill', 0.04 * knobRadius + traceButtonX + traceButtonRadius + 0.2 * knobRadius, 0.04 * knobRadius + fillButtonY1);
    c.fillStyle = `hsla(210, 80%, 90%, ${menuOpacity})`;
    c.fillText('Fill', traceButtonX + traceButtonRadius + 0.2 * knobRadius, fillButtonY1);
    
    // Fill None button
    c.beginPath();
    c.arc(traceButtonX, fillButtonY2, traceButtonRadius, 0, 2 * Math.PI);
    c.fillStyle = `hsla(210, 80%, 20%, ${0.3 * menuOpacity})`;
    c.fill();
    c.strokeStyle = `hsla(210, 80%, 70%, ${menuOpacity})`;
    c.lineWidth = 0.05 * knobRadius;
    c.stroke();
    if (!boidFillEnabled) {
        c.beginPath();
        c.arc(traceButtonX, fillButtonY2, traceButtonRadius * 0.5, 0, 2 * Math.PI);
        c.fillStyle = `hsla(210, 0%, 90%, ${menuOpacity})`;
        c.fill();
    }
    c.strokeStyle = `hsla(210, 80%, 0%, ${0.5 * menuOpacity})`;
    c.strokeText('None', 0.04 * knobRadius + traceButtonX + traceButtonRadius + 0.2 * knobRadius, 0.04 * knobRadius + fillButtonY2);
    c.fillStyle = `hsla(210, 80%, 90%, ${menuOpacity})`;
    c.fillText('None', traceButtonX + traceButtonRadius + 0.2 * knobRadius, fillButtonY2);
    
    // Draw scrollable boid type selection list
    const listCol = 2;
    const listX = listCol * knobSpacing - 1.15 * knobRadius;
    const listTitleY = (2 * knobSpacing) - (2.0 * knobRadius) + menuTopMargin;
    const listY = listTitleY + knobRadius * 0.96;
    const listWidth = knobRadius * 2.3;
    const listHeight = knobRadius * 5.04;
    const itemHeight = knobRadius * 0.72;
    const listCornerRadius = knobRadius * 0.22;
    
    // Draw "Boid Style" title (rotated 90 degrees CCW on left side)
    c.save();
    c.translate(listX - 0.4 * knobRadius, listY + listHeight / 2);
    c.rotate(-Math.PI / 2);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `${0.28 * knobRadius}px verdana`;
    c.strokeStyle = `hsla(210, 80%, 0%, ${0.5 * menuOpacity})`;
    c.strokeText('Boid Style', 0, 0.04 * knobRadius);
    c.fillStyle = `hsla(210, 80%, 90%, ${menuOpacity})`;
    c.fillText('Boid Style', 0, 0);
    c.restore();
    
    // Draw list background with rounded corners
    c.fillStyle = `hsla(210, 80%, 10%, ${0.5 * menuOpacity})`;
    c.beginPath();
    c.roundRect(listX, listY, listWidth, listHeight, listCornerRadius);
    c.fill();
    c.strokeStyle = `hsla(210, 80%, 70%, ${menuOpacity})`;
    c.lineWidth = 0.04 * knobRadius;
    c.stroke();
    
    // Setup clipping region for scrollable content
    c.save();
    c.beginPath();
    c.rect(listX, listY, listWidth, listHeight);
    c.clip();
    
    // Draw list items
    const visibleItems = Math.ceil(listHeight / itemHeight) + 1;
    const startIndex = Math.max(0, Math.floor(boidTypeScrollOffset / itemHeight));
    const endIndex = Math.min(boidTypeLabels.length, startIndex + visibleItems);
    
    for (let i = startIndex; i < endIndex; i++) {
        const itemY = listY + (i * itemHeight) - boidTypeScrollOffset;
        
        // Draw selection highlight
        if (selectedBoidType === i) {
            c.fillStyle = `hsla(320, 90%, 70%, ${0.7 * menuOpacity})`;
            c.beginPath();
            const highlightPadding = itemHeight * 0.15;
            c.roundRect(listX + 0.5 * highlightPadding, itemY + highlightPadding, listWidth - 2 * highlightPadding, itemHeight - highlightPadding * 2, (itemHeight - highlightPadding * 2) / 2);
            c.fill();
        }
        
        // Draw item text
        c.textAlign = 'left';
        c.textBaseline = 'middle';
        c.font = `${0.3 * knobRadius}px verdana`;
        
        // Shadow for contrast
        c.strokeStyle = `hsla(210, 80%, 0%, ${0.5 * menuOpacity})`;
        c.strokeText(boidTypeLabels[i], listX + 0.15 * knobRadius + 0.04 * knobRadius, itemY + itemHeight / 2 + 0.04 * knobRadius);
        
        // Main text
        c.fillStyle = `hsla(210, 80%, 90%, ${menuOpacity})`;
        c.fillText(boidTypeLabels[i], listX + 0.15 * knobRadius, itemY + itemHeight / 2);
    }
    
    c.restore();
    
    // Draw scrollbar if content overflows
    const maxScroll = Math.max(0, (boidTypeLabels.length * itemHeight) - listHeight);
    if (maxScroll > 0) {
        const scrollbarWidth = 0.1 * knobRadius;
        const scrollbarX = listX + listWidth - scrollbarWidth - 0.05 * knobRadius;
        const scrollbarHeight = listHeight * (listHeight / (boidTypeLabels.length * itemHeight));
        const scrollbarY = listY + (boidTypeScrollOffset / maxScroll) * (listHeight - scrollbarHeight);
        
        c.fillStyle = `hsla(210, 80%, 60%, ${0.7 * menuOpacity})`;
        c.fillRect(scrollbarX, scrollbarY, scrollbarWidth, scrollbarHeight);
    }
    
    // Draw reset button --------------------------------------
    const resetButtonRadius = knobRadius * 0.4;
    const resetButtonX = padding - 0.0 * knobRadius;
    const resetButtonY = menuHeight + padding - 0.65 * knobRadius;
    // Draw reset button
    c.fillStyle = `hsla(60, 80%, 50%, ${menuOpacity})`;
    c.beginPath();
    c.arc(resetButtonX, resetButtonY, 0.7 * resetButtonRadius, 0, 2 * Math.PI);
    c.closePath();
    c.fill();

    // Draw "RESET" text below button
    c.font = `${0.3 * knobRadius}px verdana`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = `hsla(0, 0%, 0%, ${0.7 *menuOpacity})`;
    c.fillText("RESET", resetButtonX + 0.03 * knobRadius, resetButtonY + 0.03 * knobRadius);
    c.fillStyle = `hsla(60, 80%, 90%, ${menuOpacity})`;
    c.fillText("RESET", resetButtonX, resetButtonY);
  
    // Draw FPS counter in bottom right of menu -------------------------------
    updateFPS();
    c.textAlign = 'right';
    c.textBaseline = 'bottom';
    const fpsText = `${currentFPS.toFixed(0)}`;
    // Color code based on FPS: green (57+) to yellow to red
    let fpsHue;
    if (currentFPS >= 57) {
        fpsHue = 120; // Green
    } else if (currentFPS >= 45) {
        // Interpolate from red (0) to yellow (60)
        const t = (currentFPS - 45) / (57 - 45);
        fpsHue = t * 60;
    } else {
        // Full red for very low FPS
        fpsHue = 0;
    }
    
    // draw dark heavy background line for FPS text
    //const fpsTextWidth = c.measureText(fpsText).width;
    c.beginPath();
    c.moveTo(-padding + 0.8 * knobRadius, menuHeight + padding - 0.65 * knobRadius);
    c.lineTo(-padding + 2.4 * knobRadius, menuHeight + padding - 0.65 * knobRadius);
    c.lineWidth = 0.5 * knobRadius;
    c.strokeStyle = `hsla(0, 0%, 0%, ${0.7 * menuOpacity})`;
    c.lineCap = 'round';
    c.stroke();

    // Draw FPS value
    c.font = `${0.4 * knobRadius}px monospace`;
    c.fillStyle = `hsla(${fpsHue}, 90%, 60%, ${menuOpacity})`;
    c.fillText(fpsText, padding - 2.0 * knobRadius, menuHeight + padding - 0.42 * knobRadius);
    
    // Draw 'FPS' label
    c.font = `${0.4 * knobRadius}px monospace`;
    c.fillStyle = `hsla(0, 0%, 80%, ${menuOpacity})`;
    c.fillText('fps', padding - 1.1 * knobRadius, menuHeight + padding - 0.42 * knobRadius);

    // Draw version text in bottom left corner
    c.textAlign = 'left';
    c.textBaseline = 'bottom';
    c.font = `${0.24 * knobRadius}px monospace`;
    c.fillStyle = `hsla(0, 0%, 60%, ${menuOpacity})`;
    c.fillText('v1.49', padding + 7.8 * knobRadius, menuHeight + padding - 0.15 * knobRadius);

    c.restore();
}

//  DRAW COLOR MENU  ---------------------------------------------------------------------
function drawColorMenu() {
    // Only draw menu if it has some opacity
    if (colorMenuOpacity <= 0) return;
    
    const knobRadius = 0.1 * cScale;
    const colorWheelRadius = knobRadius * 1.7;
    const sliderWidth = knobRadius * 0.6;
    const sliderHeight = colorWheelRadius * 2;
    const spacing = knobRadius * 0.5;
    
    const menuUpperLeftX = colorMenuX * cScale;
    const menuUpperLeftY = canvas.height - colorMenuY * cScale;
    
    c.save();
    c.translate(menuUpperLeftX, menuUpperLeftY);
    
    // Calculate menu dimensions (include space for preset buttons, knobs, and segregation buttons)
    const buttonRowHeight = spacing * 2;
    const knobRowHeight = knobRadius * 3;
    const segRadioRowHeight = knobRadius * 3.0 + spacing * 2; // Space for radio buttons, labels, and bottom margin
    const menuWidth = colorWheelRadius * 2 + spacing + sliderWidth + spacing + knobRadius * 2;
    // Use animated height for smooth transitions
    const menuHeight = colorMenuAnimatedHeight;
    const padding = 0.8 * knobRadius;
    
    const cornerRadius = 0.05 * cScale;
    c.beginPath();
    c.moveTo(-padding + cornerRadius, -padding);
    c.lineTo(menuWidth + padding - cornerRadius, -padding);
    c.quadraticCurveTo(menuWidth + padding, -padding, menuWidth + padding, -padding + cornerRadius);
    c.lineTo(menuWidth + padding, menuHeight + padding - cornerRadius);
    c.quadraticCurveTo(menuWidth + padding, menuHeight + padding, menuWidth + padding - cornerRadius, menuHeight + padding);
    c.lineTo(-padding + cornerRadius, menuHeight + padding);
    c.quadraticCurveTo(-padding, menuHeight + padding, -padding, menuHeight + padding - cornerRadius);
    c.lineTo(-padding, -padding + cornerRadius);
    c.quadraticCurveTo(-padding, -padding, -padding + cornerRadius, -padding);
    c.closePath();
    
    // Calculate fill transparency based on menu height (more transparent when shrinking)
    const fullHeight = spacing * 20;
    const heightRatio = colorMenuAnimatedHeight / fullHeight; // 0.35 when shrunk, 1.0 when full
    const fillOpacity = 0.3 + (heightRatio * 0.6); // Range from 0.3 to 0.9
    
    const menuGradient = c.createLinearGradient(0, -padding, 0, menuHeight + padding);
    menuGradient.addColorStop(0, `hsla(210, 0%, 20%, ${fillOpacity * colorMenuOpacity})`);
    menuGradient.addColorStop(1, `hsla(210, 0%, 5%, ${fillOpacity * colorMenuOpacity})`);
    c.fillStyle = menuGradient;
    c.fill();
    c.strokeStyle = `hsla(210, 0%, 80%, ${colorMenuOpacity})`;
    c.lineWidth = 0.004 * cScale;
    c.stroke();

    // Draw title
    c.fillStyle = `hsla(210, 0%, 80%, ${colorMenuOpacity})`;
    c.font = `bold ${0.05 * cScale}px verdana`;
    c.textAlign = 'center';
    c.fillText('PAINT', menuWidth / 2, -padding + 0.04 * cScale);
    
    // Draw close icon in upper left corner
    const closeIconRadius = knobRadius * 0.25;
    const closeIconX = -padding + closeIconRadius + 0.2 * knobRadius;
    const closeIconY = -padding + closeIconRadius + 0.2 * knobRadius;
    
    // Red background circle
    c.beginPath();
    c.arc(closeIconX, closeIconY, closeIconRadius, 0, 2 * Math.PI);
    c.fillStyle = `hsla(0, 70%, 40%, ${colorMenuOpacity})`;
    c.fill();
    
    // Black X
    c.strokeStyle = `hsla(0, 0%, 0%, ${colorMenuOpacity})`;
    c.lineWidth = 0.05 * knobRadius;
    c.lineCap = 'round';
    const xSize = closeIconRadius * 0.4;
    c.beginPath();
    c.moveTo(closeIconX - xSize, closeIconY - xSize);
    c.lineTo(closeIconX + xSize, closeIconY + xSize);
    c.moveTo(closeIconX + xSize, closeIconY - xSize);
    c.lineTo(closeIconX - xSize, closeIconY + xSize);
    c.stroke();
    
    // Draw color wheel from offscreen canvas
    const wheelCenterX = colorWheelRadius;
    const wheelCenterY = colorWheelRadius;
    
    c.save();
    c.globalAlpha = colorMenuOpacity;
    c.drawImage(colorWheelCanvas, 
        0, 0, colorWheelCanvas.width, colorWheelCanvas.height,
        wheelCenterX - colorWheelRadius, wheelCenterY - colorWheelRadius,
        colorWheelRadius * 2, colorWheelRadius * 2);
    c.restore();
    
    // Draw painted color dots on color wheel
    for (let dot of paintedColorDots) {
        const dotAngle = dot.hue * Math.PI / 180;
        const dotRadius = (dot.saturation / 100) * colorWheelRadius;
        const dotX = wheelCenterX + dotRadius * Math.cos(dotAngle);
        const dotY = wheelCenterY + dotRadius * Math.sin(dotAngle);
        
        c.beginPath();
        c.arc(dotX, dotY, knobRadius * 0.08, 0, 2 * Math.PI);
        c.fillStyle = `hsla(0, 0%, 100%, ${colorMenuOpacity * 0.9})`;
        c.fill();
    }
    
    // Draw selection indicator on color wheel
    const angle = selectedHue * Math.PI / 180;
    const radius = (selectedSaturation / 100) * colorWheelRadius;
    const selectorX = wheelCenterX + radius * Math.cos(angle);
    const selectorY = wheelCenterY + radius * Math.sin(angle);
    
    c.beginPath();
    c.arc(selectorX, selectorY, knobRadius * 0.2, 0, 2 * Math.PI);
    c.strokeStyle = `hsla(0, 0%, 90%, ${colorMenuOpacity})`;
    c.lineWidth = 0.005 * cScale;
    c.stroke();
    
    // Draw lightness slider
    const lightnessSliderX = colorWheelRadius * 2 + spacing;
    const lightnessSliderY = 0;
    // Draw gradient for lightness
    const lightnessGradient = c.createLinearGradient(lightnessSliderX, lightnessSliderY, lightnessSliderX, lightnessSliderY + sliderHeight);
    lightnessGradient.addColorStop(0, `hsla(${selectedHue}, ${selectedSaturation}%, 100%, ${colorMenuOpacity})`);
    lightnessGradient.addColorStop(0.5, `hsla(${selectedHue}, ${selectedSaturation}%, 50%, ${colorMenuOpacity})`);
    lightnessGradient.addColorStop(1, `hsla(${selectedHue}, ${selectedSaturation}%, 0%, ${colorMenuOpacity})`);
    c.fillStyle = lightnessGradient;
    c.fillRect(lightnessSliderX, lightnessSliderY, sliderWidth, sliderHeight);
    
    // Draw border around slider
    c.strokeStyle = `hsla(0, 0%, 90%, ${colorMenuOpacity * 0.5})`;
    c.lineWidth = 0.005 * cScale;
    c.strokeRect(lightnessSliderX, lightnessSliderY, sliderWidth, sliderHeight);
    
    // Draw lightness selector
    const lightnessIndicatorY = lightnessSliderY + (1 - selectedLightness / 100) * sliderHeight;
    c.beginPath();
    c.moveTo(lightnessSliderX, lightnessIndicatorY);
    c.lineTo(lightnessSliderX + sliderWidth, lightnessIndicatorY);
    c.strokeStyle = `hsla(0, 0%, ${selectedLightness > 90 ? 50 : 100}%, ${colorMenuOpacity})`;
    c.lineWidth = 0.007 * cScale;
    c.stroke();
    
    // Draw spraypaint icon (aerosol can in profile) ---------
    const spraypaintX = lightnessSliderX + sliderWidth + spacing + knobRadius * 0.85;
    const spraypaintY = colorWheelRadius * 0.8;
    const canRadius = knobRadius * 1.2; // 2x larger
    
    c.save();
    c.translate(spraypaintX, spraypaintY);
    
    // Main cylinder body with gradient for 3D effect
    const bodyGradient = c.createLinearGradient(-canRadius * 0.35, 0, canRadius * 0.35, 0);
    const bodyColor = `hsla(${selectedHue}, ${selectedSaturation}%, ${selectedLightness}%, ${colorMenuOpacity})`;
    const darkBodyColor = `hsla(${selectedHue}, ${selectedSaturation}%, ${Math.max(0, selectedLightness - 20)}%, ${colorMenuOpacity})`;
    const lightBodyColor = `hsla(${selectedHue}, ${selectedSaturation}%, ${Math.min(100, selectedLightness + 15)}%, ${colorMenuOpacity})`;
    bodyGradient.addColorStop(0, darkBodyColor);
    bodyGradient.addColorStop(0.25, lightBodyColor);
    bodyGradient.addColorStop(0.5, bodyColor);
    bodyGradient.addColorStop(1, darkBodyColor);
    c.fillStyle = bodyGradient;
    c.beginPath();
    c.moveTo(-canRadius * 0.35, canRadius * 0.7);
    c.lineTo(-canRadius * 0.35, -canRadius * 0.48);
    c.quadraticCurveTo(-canRadius * 0.35, -canRadius * 0.53, -canRadius * 0.32, -canRadius * 0.55);
    c.lineTo(canRadius * 0.32, -canRadius * 0.55);
    c.quadraticCurveTo(canRadius * 0.35, -canRadius * 0.53, canRadius * 0.35, -canRadius * 0.48);
    c.lineTo(canRadius * 0.35, canRadius * 0.7);
    c.fill();

    // Valve stem
    c.fillStyle = `hsla(0, 0%, 75%, ${colorMenuOpacity})`;
    c.fillRect(-canRadius * 0.04, -canRadius * 0.88, canRadius * 0.08, canRadius * 0.22);
    
    // Spray cap and paint  
    if (spraypaintActive) {
        // Draw spray particles inside the wedge
        const nozzleX = canRadius * 0.15;
        const nozzleY = -canRadius * 0.93 * 0.93;
        const lineLength = canRadius * 1.0;
        const angleSpread = 30 * Math.PI / 180; // 15 degrees = half of 30 degree spread
        const particleCount = 22;
        for (let i = 0; i < particleCount; i++) {
            const t = (i + 1) / particleCount; // Distance from nozzle (0 to 1)
            const distance = t * lineLength * 0.85;
            const angle = (Math.random() - 0.5) * 2 * angleSpread; // Random angle within spread
            const spread = Math.random() * 0.2; // Random lateral spread
            
            const particleX = nozzleX + distance * Math.cos(angle) + spread * (Math.random() - 0.5) * canRadius;
            const particleY = nozzleY - distance * Math.sin(angle) + spread * (Math.random() - 0.5) * canRadius;
            
            const particleSize = canRadius * 0.05 * (1 - t * 0.5); // Smaller as distance increases
            const particleAlpha = colorMenuOpacity * (1 - t * 0.7); // Fade as distance increases
            
            c.fillStyle = `hsla(${selectedHue}, ${selectedSaturation}%, ${selectedLightness}%, ${particleAlpha})`;
            c.beginPath();
            c.arc(particleX, particleY, particleSize, 0, 2 * Math.PI);
            c.fill();
        }            
        // Black spray cap
        const capGradient = c.createLinearGradient(
            -canRadius * 0.1, 
            0, 
            canRadius * 0.1, 
            0);
        capGradient.addColorStop(0, `hsla(0, 0%, 5%, ${colorMenuOpacity})`);
        capGradient.addColorStop(0.3, `hsla(0, 0%, 25%, ${colorMenuOpacity})`);
        capGradient.addColorStop(0.7, `hsla(0, 0%, 15%, ${colorMenuOpacity})`);
        capGradient.addColorStop(1, `hsla(0, 0%, 5%, ${colorMenuOpacity})`);
        c.fillStyle = capGradient;
        c.fillRect(
            -canRadius * 0.1, 
            -canRadius * 1.025 * 0.93, 
            canRadius * 0.2, 
            canRadius * 0.195);
        
        // White spray orifice 
        c.fillStyle = `hsla(0, 0%, 95%, ${colorMenuOpacity})`;
        c.beginPath();
        c.ellipse(
            canRadius * 0.08, 
            -canRadius * 0.93 * 0.93, 
            canRadius * 0.025, 
            canRadius * 0.045, 
            0, 
            0, 
            2 * Math.PI);
        c.fill();
    } else {
        // button not pushed: draw cap and orifice only
        // Black spray cap
        const capGradient = c.createLinearGradient(
            -canRadius * 0.1, 
            0, 
            canRadius * 0.1, 
            0);
        capGradient.addColorStop(0, `hsla(0, 0%, 5%, ${colorMenuOpacity})`);
        capGradient.addColorStop(0.3, `hsla(0, 0%, 25%, ${colorMenuOpacity})`);
        capGradient.addColorStop(0.7, `hsla(0, 0%, 15%, ${colorMenuOpacity})`);
        capGradient.addColorStop(1, `hsla(0, 0%, 5%, ${colorMenuOpacity})`);
        c.fillStyle = capGradient;
        c.fillRect(
            -canRadius * 0.1, 
            -canRadius * 1.025, 
            canRadius * 0.2, 
            canRadius * 0.195);
        
        // White spray orifice 
        c.fillStyle = `hsla(0, 0%, 95%, ${colorMenuOpacity})`;
        c.beginPath();
        c.ellipse(
            canRadius * 0.08, 
            -canRadius * 0.93, 
            canRadius * 0.025, 
            canRadius * 0.045, 
            0, 
            0, 
            2 * Math.PI);
        c.fill();
        
    }

    // Domed valve cup
    const domeGradient = c.createRadialGradient(
        -canRadius * 0.1, 
        -canRadius * 0.68, 
        0, 
        0, 
        -canRadius * 0.68, 
        canRadius * 0.45);
    domeGradient.addColorStop(0, `hsla(0, 0%, 85%, ${colorMenuOpacity})`);
    domeGradient.addColorStop(0.3, `hsla(0, 0%, 30%, ${colorMenuOpacity})`);
    //domeGradient.addColorStop(0.35, `hsla(0, 0%, 30%, ${colorMenuOpacity})`);
    domeGradient.addColorStop(1, `hsla(0, 0%, 0%, ${colorMenuOpacity})`);
    c.fillStyle = domeGradient;
    c.beginPath();
    c.ellipse(
        0, 
        -1.0 * canRadius * 0.58, 
        canRadius * 0.2, 
        canRadius * 0.16, 
        0, 
        Math.PI,
        0);
    c.fill();
    
    // Valve cup rim (metallic flange)
    const rimGradient = c.createLinearGradient(
        -canRadius * 0.5, 
        0, 
        canRadius * 0.5, 
        0);
    rimGradient.addColorStop(0, `hsla(0, 0%, 20%, ${colorMenuOpacity})`);
    rimGradient.addColorStop(0.35, `hsla(0, 0%, 75%, ${colorMenuOpacity})`);
    rimGradient.addColorStop(0.45, `hsla(0, 0%, 40%, ${colorMenuOpacity})`);
    rimGradient.addColorStop(1, `hsla(0, 0%, 10%, ${colorMenuOpacity})`);
    // Draw rim
    c.fillStyle = rimGradient;
    c.beginPath();
    c.ellipse(
        0, 
        -canRadius * 0.54, 
        canRadius * 0.31, 
        canRadius * 0.1, 
        0, 
        Math.PI, 
        0);
    c.fill();

    // top cap with a line
    c.strokeStyle = rimGradient;
    c.beginPath();
    c.lineWidth = 0.005 * cScale;
    c.moveTo(-canRadius * 0.34, -canRadius * 0.53);
    c.lineTo(canRadius * 0.34, -canRadius * 0.53);
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.stroke();

    // Bottom cap with a line
    c.strokeStyle = rimGradient;
    c.beginPath();
    c.lineWidth = 0.005 * cScale;
    c.moveTo(-canRadius * 0.34, canRadius * 0.7);
    c.lineTo(canRadius * 0.34, canRadius * 0.7);
    c.stroke();
    
    // Draw spray radius slider below the can
    const spraySldrWidth = canRadius * 1.4;
    const spraySldrHeight = knobRadius * 0.25;
    // Bottom aligned with lightness slider bottom (lightness slider is at Y=0 to colorWheelRadius*2)
    // Spraypaint icon is at Y=colorWheelRadius*0.8, so bottom should be at colorWheelRadius*2 - colorWheelRadius*0.8 = colorWheelRadius*1.2
    const spraySldrBottomY = colorWheelRadius * 0.9;
    const spraySldrX = -spraySldrWidth / 2;
    
    // Draw slider background - wedge shape (shorter on left, taller on right)
    // Left and right sides are vertical, bottom is horizontal, top angles downward from left to right
    c.fillStyle = `hsla(210, 80%, 10%, ${0.5 * colorMenuOpacity})`;
    c.beginPath();
    const leftHeight = spraySldrHeight; // Shorter on left
    const rightHeight = spraySldrHeight * 1.8; // Taller on right
    c.moveTo(spraySldrX, spraySldrBottomY - leftHeight); // Top left
    c.lineTo(spraySldrX + spraySldrWidth, spraySldrBottomY - rightHeight); // Top right (angled top line)
    c.lineTo(spraySldrX + spraySldrWidth, spraySldrBottomY); // Bottom right (vertical)
    c.lineTo(spraySldrX, spraySldrBottomY); // Bottom left (horizontal)
    c.closePath();
    c.fill();
    c.strokeStyle = `hsla(210, 60%, 80%, ${colorMenuOpacity * 0.3})`;
    c.lineWidth = 0.004 * cScale;
    c.stroke();
    
    // Calculate slider position (0.05 to 0.5 range)
    const sliderValue = (spraypaintRadius - 0.05) / (0.5 - 0.05);
    const sliderKnobX = spraySldrX + sliderValue * spraySldrWidth;
    // Knob Y should follow the angled top line
    const knobHeightAtPos = leftHeight - (leftHeight - rightHeight) * sliderValue;
    const sliderKnobRadius = knobRadius * 0.25;
    const sliderKnobY = spraySldrBottomY - knobHeightAtPos / 2;
    
    // Draw slider knob
    c.beginPath();
    c.arc(sliderKnobX, sliderKnobY, sliderKnobRadius, 0, 2 * Math.PI);
    const sliderKnobGradient = c.createRadialGradient(
        sliderKnobX - sliderKnobRadius * 0.3,
        sliderKnobY - sliderKnobRadius * 0.3,
        0,
        sliderKnobX,
        sliderKnobY,
        sliderKnobRadius
    );
    sliderKnobGradient.addColorStop(0, `hsla(210, 0%, 80%, ${colorMenuOpacity})`);
    sliderKnobGradient.addColorStop(1, `hsla(210, 0%, 50%, ${colorMenuOpacity})`);
    c.fillStyle = sliderKnobGradient;
    c.fill();
    c.strokeStyle = `hsla(210, 0%, 90%, ${colorMenuOpacity})`; 
    c.lineWidth = 0.005 * cScale;
    c.stroke();
    
    // Draw value label
    c.font = `${0.28 * knobRadius}px verdana`;
    c.fillStyle = `hsla(210, 0%, 90%, ${colorMenuOpacity})`;
    c.textAlign = 'center';
    c.textBaseline = 'top';
    c.fillText('Spray Size', 0, spraySldrBottomY + 0.27 * knobRadius);
    
    c.restore();
    
    // Only draw color preset buttons, dye button, and labels when spray tool is not active
    if (!spraypaintActive) {
        // Draw color preset buttons below the color wheel ---------
        const buttonRadius = knobRadius * 0.35;
        const buttonY = colorWheelRadius * 2 + spacing * 1.5;
        const buttonSpacing = knobRadius * 1.2;
        // Position so that fourth button centered below lightness slider
        const lightnessSliderCenterX = lightnessSliderX + sliderWidth / 2;
        const buttonStartX = lightnessSliderCenterX - buttonSpacing * 3;
        
        // Black button
        c.beginPath();
        c.arc(buttonStartX, buttonY, buttonRadius, 0, 2 * Math.PI);
        c.fillStyle = `hsla(0, 0%, 0%, ${colorMenuOpacity})`;
        c.fill();
        c.strokeStyle = `hsla(210, 0%, 70%, ${colorMenuOpacity})`;
        c.lineWidth = 0.01 * cScale;
        c.stroke();
        
        // Black and white button
        c.beginPath();
        c.arc(buttonStartX + buttonSpacing, buttonY, buttonRadius, 0.5 * Math.PI, 1.5 * Math.PI);
        c.fillStyle = `hsla(0, 0%, 0%, ${colorMenuOpacity})`;
        c.fill();
        c.beginPath();
        c.arc(buttonStartX + buttonSpacing, buttonY, buttonRadius, 0.5 * Math.PI, 1.5 * Math.PI, true);
        c.fillStyle = `hsla(0, 0%, 90%, ${colorMenuOpacity})`;
        c.fill();
        c.beginPath();
        c.arc(buttonStartX + buttonSpacing, buttonY, buttonRadius, 0, 2 * Math.PI);
        c.stroke();
        
        // White button
        c.beginPath();
        c.arc(buttonStartX + buttonSpacing * 2, buttonY, buttonRadius, 0, 2 * Math.PI);
        c.fillStyle = `hsla(0, 0%, 100%, ${colorMenuOpacity})`;
        c.fill();
        c.stroke();

        // Draw line from paint all button to dye one button
        c.strokeStyle = `hsla(210, 0%, 70%, ${colorMenuOpacity})`;
        c.setLineDash([0.02 * cScale, 0.02 * cScale]);
        c.lineWidth = 0.008 * cScale;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(buttonStartX + buttonSpacing * 3, buttonY);
        const lineRadScale = 0.035 * cScale;
        const lineB = 1.5;
        const dropEndY = buttonY + buttonSpacing * 1.0 + lineB * lineRadScale;
        c.lineTo(buttonStartX + buttonSpacing * 4.5, dropEndY);
        c.stroke();
        c.setLineDash([0,0]);
        
        // Selected color button - paint all
        c.beginPath();
        c.arc(buttonStartX + buttonSpacing * 3, buttonY, buttonRadius, 0, 2 * Math.PI);
        c.fillStyle = `hsla(${selectedHue}, ${selectedSaturation}%, ${selectedLightness}%, ${colorMenuOpacity})`;
        c.fill();
        c.stroke();

        // Selected color button - dye one (raindrop icon)
        const dropX = buttonStartX + buttonSpacing * 4.75;
        const dropY = buttonY + buttonSpacing * 1.0;
        
        c.save();
        c.translate(dropX, dropY);
        const radScale = 0.035 * cScale;

        // Draw airfoil  -----------
        const numPoints = 24; 
        const a = 0.3;
        const b = 1.5;
        const pivotOffsetX = 0;
        const pivotOffsetY = -b * radScale;  // Centroid of bulb head
        c.beginPath();  
        for (let i = 0; i <= numPoints; i++) {
            const t = Math.PI / 2 + (i / numPoints) * (2 * Math.PI);
            const x = (2 * a * Math.cos(t) - a * Math.sin(2 * t)) * radScale;
            const y = b * Math.sin(t) * radScale;
            if (i === 0) {
                c.moveTo(x - pivotOffsetX, -y - pivotOffsetY);
            } else {
                c.lineTo(x - pivotOffsetX, -y - pivotOffsetY);
            }
        }  
        c.closePath();
        
        // Create 3D gradient with highlight and shadow
        const gradient = c.createRadialGradient(
            -a * radScale * 0.8,
            b * radScale * 0.8,
            0,
            0,
            0,
            b * radScale * 2.5);
        
        // Bright highlight (top-left)
        gradient.addColorStop(0, `hsla(${selectedHue}, ${Math.max(0, selectedSaturation - 30)}%, ${Math.min(100, selectedLightness + 45)}%, ${colorMenuOpacity})`);
    // Mid-tone (user color)
    gradient.addColorStop(0.3, `hsla(${selectedHue}, ${selectedSaturation}%, ${selectedLightness}%, ${colorMenuOpacity * 0.95})`);
    // Darker mid
    gradient.addColorStop(0.6, `hsla(${selectedHue}, ${Math.min(100, selectedSaturation + 10)}%, ${Math.max(10, selectedLightness - 20)}%, ${colorMenuOpacity * 0.85})`);
    // Deep shadow
    gradient.addColorStop(1, `hsla(${selectedHue}, ${Math.min(100, selectedSaturation + 20)}%, ${Math.max(5, selectedLightness - 40)}%, ${colorMenuOpacity * 0.7})`);
    
    c.fillStyle = gradient;
    c.fill();
    
    // Subtle rim light on stroke
    c.strokeStyle = `hsla(${selectedHue}, ${Math.max(0, selectedSaturation - 20)}%, ${Math.min(100, selectedLightness + 10)}%, ${colorMenuOpacity * 0.8})`;
    c.lineWidth = 1.5;
    c.stroke();

    c.restore();

    c.font = `${0.28 * knobRadius}px verdana`;
    c.textAlign = 'center';
    c.textBaseline = 'top';
    
    // Paint label with shadow
    c.strokeStyle = `hsla(210, 0%, 0%, ${0.6 * colorMenuOpacity})`;
    c.strokeText('Paint', 0.02 * knobRadius + buttonStartX + buttonSpacing * 3, 0.02 * knobRadius + buttonY + buttonRadius * 1.5);
    c.fillStyle = `hsla(210, 0%, 90%, ${colorMenuOpacity})`;
    c.fillText('Paint', buttonStartX + buttonSpacing * 3, buttonY + buttonRadius * 1.5);
    
    // Dye label with shadow
    const textRadScale = 0.035 * cScale;
    const textB = 1.5;
    const dropletCenterY = buttonY + buttonSpacing * 1.0;
    const dyeTextY = dropletCenterY + 2 * textB * textRadScale + buttonRadius * 0.3;
    c.strokeStyle = `hsla(210, 0%, 0%, ${0.6 * colorMenuOpacity})`;
    c.strokeText('Dye', 0.02 * knobRadius + buttonStartX + buttonSpacing * 4.75, 0.02 * knobRadius + dyeTextY);
    c.fillStyle = `hsla(210, 0%, 90%, ${colorMenuOpacity})`;
    c.fillText('Dye', buttonStartX + buttonSpacing * 4.75, dyeTextY);
    

    // Color by direction button
    c.beginPath();
    c.arc(buttonStartX + buttonSpacing * 4, buttonY, buttonRadius, 0, 2 * Math.PI);
    // use saved color wheel image as button fill
    c.save();
    c.globalAlpha = colorMenuOpacity;
    c.drawImage(
        colorWheelCanvas, 
        0, 0, 
        colorWheelCanvas.width, colorWheelCanvas.height,
        buttonStartX + buttonSpacing * 4 - buttonRadius, buttonY - buttonRadius,
        buttonRadius * 2, buttonRadius * 2);
    c.restore();
    c.strokeStyle = `hsla(210, 0%, 70%, ${colorMenuOpacity})`;
    c.stroke();
    
    // Velocity-sensitive color cycling button
    c.beginPath();
    c.arc(buttonStartX + buttonSpacing * 5, buttonY, buttonRadius, 0, 2 * Math.PI);
    // Create vertical gradient from blue (slow) to red (fast)
    const velocityGradient = c.createLinearGradient(
        buttonStartX + buttonSpacing * 5,
        buttonY - buttonRadius,
        buttonStartX + buttonSpacing * 5,
        buttonY + buttonRadius);
    velocityGradient.addColorStop(0, `hsla(0, 85%, 50%, ${colorMenuOpacity})`); // Red at top (fast)
    velocityGradient.addColorStop(0.5, `hsla(180, 85%, 50%, ${colorMenuOpacity})`); // Cyan in middle
    velocityGradient.addColorStop(1, `hsla(240, 85%, 50%, ${colorMenuOpacity})`); // Blue at bottom (slow)
    c.fillStyle = velocityGradient;
    c.fill();
    c.strokeStyle = `hsla(210, 0%, 70%, ${colorMenuOpacity})`;
    c.stroke();
    } // End of if (!spraypaintActive)

    // Only draw knobs and segregation buttons when spray tool is not active
    if (!spraypaintActive) {
        // Calculate knob positions first (needed for segregation button placement)
        const hueTickerTargetX = lightnessSliderX + sliderWidth / 2; // Center below lightness slider
        const hueTickerOriginalX = colorWheelRadius + knobRadius * 2.4;
        const knobOffset = hueTickerTargetX - hueTickerOriginalX; // Calculate offset
        const hueSensitivityKnobX = knobRadius + knobOffset; // Move by same offset
        const hueSensitivityKnobY = colorWheelRadius * 2 + buttonRowHeight + knobRadius * 1.5 + knobRadius / 3;
        const hueTickerKnobX = hueTickerTargetX;
        const hueTickerKnobY = hueSensitivityKnobY;
        
        // Draw segregation radio buttons below the knobs
        const segRadioRadius = knobRadius * 0.25;
        const segButtonY = hueTickerKnobY + knobRadius * 2.6;
        const segButtonSpacing = knobRadius * 1.3;
        const segButtonStartX = colorWheelRadius - segButtonSpacing * 0.5;
        const segLabels = ['None', 'Partial', 'Total'];
        const segModeMap = [0, 2, 1]; // Map visual position to segregationMode value
    
    for (let i = 0; i < 3; i++) {
        const segBtnX = segButtonStartX + i * segButtonSpacing;
        
        // Draw outer circle
        c.beginPath();
        c.arc(segBtnX, segButtonY, segRadioRadius, 0, 2 * Math.PI);
        c.fillStyle = `hsla(210, 0%, 20%, ${0.3 * colorMenuOpacity})`;
        c.fill();
        c.strokeStyle = `hsla(210, 0%, 70%, ${colorMenuOpacity})`;
        c.lineWidth = 0.04 * knobRadius;
        c.stroke();
        
        // Draw filled center if selected
        if (segregationMode === segModeMap[i]) {
            c.beginPath();
            c.arc(segBtnX, segButtonY, segRadioRadius * 0.5, 0, 2 * Math.PI);
            c.fillStyle = `hsla(210, 0%, 90%, ${colorMenuOpacity})`;
            c.fill();
        }
        
        // Draw label below button
        c.textAlign = 'center';
        c.textBaseline = 'top';
        
        // Stroke and fill text for better visibility
        c.font = `${0.24 * knobRadius}px verdana`;
        c.fillStyle = `hsla(0, 0%, 0%, ${0.5 * colorMenuOpacity})`;
        c.fillText(segLabels[i], segBtnX + 2, segButtonY + segRadioRadius + 0.15 * knobRadius + 2);
        c.fillStyle = `hsla(210, 0%, 90%, ${colorMenuOpacity})`;
        c.fillText(segLabels[i], segBtnX, segButtonY + segRadioRadius + 0.15 * knobRadius);
    }

    // Draw "Color Separation" label above buttons
    c.font = `${0.3 * knobRadius}px verdana`;
    c.fillStyle = `hsla(0, 0%, 0%, ${0.5 * colorMenuOpacity})`;
    //c.lineWidth = 0.02 * knobRadius;
    c.fillText('Flocking by Color', (segButtonStartX + segButtonSpacing) + 2, (segButtonY + 3.3 * segRadioRadius) + 2);
    c.fillStyle = `hsla(0, 0%, 90%, ${colorMenuOpacity})`;
    c.lineWidth = 0.02 * knobRadius;
    c.fillText('Flocking by Color', segButtonStartX + segButtonSpacing, segButtonY + 3.3 * segRadioRadius);
            
    // Draw hueSensitivity knob
    const meterStart = 0.5 * Math.PI + 0.5 * (2 * Math.PI - 1.6 * Math.PI);
    const fullMeterSweep = 1.6 * Math.PI;
    
    // Draw background circle
    c.beginPath();
    c.arc(hueSensitivityKnobX, hueSensitivityKnobY, 1.05 * knobRadius, 0, 2 * Math.PI, false);
    c.fillStyle = `hsla(210, 0%, 15%, ${0.9 * colorMenuOpacity})`;
    c.fill();
    c.strokeStyle = `hsla(210, 0%, 50%, ${colorMenuOpacity})`;
    c.lineWidth = 0.003 * cScale;
    c.stroke();
    
    // Calculate normalized value
    const normalizedValue = (boidProps.hueSensitivity - 0) / (360 - 0);
    
    // Draw arc meter
    const gradient = c.createLinearGradient(
        hueSensitivityKnobX + Math.cos(meterStart) * knobRadius,
        hueSensitivityKnobY + Math.sin(meterStart) * knobRadius,
        hueSensitivityKnobX + Math.cos(meterStart + fullMeterSweep) * knobRadius,
        hueSensitivityKnobY + Math.sin(meterStart + fullMeterSweep) * knobRadius
    );
    gradient.addColorStop(0, `hsla(190, 0%, 60%, ${colorMenuOpacity})`);
    gradient.addColorStop(0.5, `hsla(170, 0%, 80%, ${colorMenuOpacity})`);
    c.strokeStyle = gradient;
    c.beginPath();
    c.arc(hueSensitivityKnobX, hueSensitivityKnobY, knobRadius * 0.85, meterStart, meterStart + fullMeterSweep * normalizedValue);
    c.lineWidth = 0.02 * cScale;
    c.stroke();
    
    // Draw needle
    const needleAngle = meterStart + normalizedValue * fullMeterSweep;
    const pointerLength = knobRadius * 0.6;
    const pointerEndX = hueSensitivityKnobX + Math.cos(needleAngle) * pointerLength;
    const pointerEndY = hueSensitivityKnobY + Math.sin(needleAngle) * pointerLength;
    c.beginPath();
    c.moveTo(hueSensitivityKnobX, hueSensitivityKnobY);
    c.lineTo(pointerEndX, pointerEndY);
    c.strokeStyle = `hsla(210, 0%, 80%, ${colorMenuOpacity})`;
    c.lineWidth = 0.008 * cScale;
    c.stroke();

    // Draw value label
    c.font = `${0.25 * knobRadius}px verdana`;
    c.fillStyle = `hsla(160, 80%, 50%, ${menuOpacity})`;
    c.fillText((boidProps.hueSensitivity / 3.6).toFixed(0), hueSensitivityKnobX, hueSensitivityKnobY + 0.5 * knobRadius);
    
    // Draw label
    c.font = `${0.29 * knobRadius}px verdana`;
    c.strokeStyle = `hsla(210, 80%, 0%, ${0.6 * colorMenuOpacity})`;
    c.lineWidth = 0.03 * knobRadius;
    c.lineJoin = 'round';
    c.strokeText('Speed', 0.04 * knobRadius + hueSensitivityKnobX, 0.04 * knobRadius + (hueSensitivityKnobY + 1.35 * knobRadius));
    c.strokeText('Sensitivity', 0.04 * knobRadius + hueSensitivityKnobX, 0.04 * knobRadius + (hueSensitivityKnobY + 1.7 * knobRadius));
    c.fillStyle = `hsla(210, 80%, 95%, ${colorMenuOpacity})`;
    c.fillText('Speed', hueSensitivityKnobX, hueSensitivityKnobY + 1.35 * knobRadius);
    c.fillText('Sensitivity', hueSensitivityKnobX, hueSensitivityKnobY + 1.7 * knobRadius);
    
    // Draw hueTicker knob (to the right of hueSensitivity knob)
    // (hueTickerKnobX and hueTickerKnobY already defined above)
    
    // Draw background circle
    c.beginPath();
    c.arc(hueTickerKnobX, hueTickerKnobY, 1.05 * knobRadius, 0, 2 * Math.PI, false);
    c.fillStyle = `hsla(210, 0%, 15%, ${0.9 * colorMenuOpacity})`;
    c.fill();
    c.strokeStyle = `hsla(210, 0%, 50%, ${colorMenuOpacity})`;
    c.lineWidth = 0.003 * cScale;
    c.stroke();
    
    // Convert hueTicker to normalized value using logarithmic scale
    const tickerLogMin = Math.log(0.01);
    const tickerLogMax = Math.log(10.0);
    const tickerLogValue = Math.log(Math.max(0.01, Math.min(10.0, boidProps.hueTicker)));
    const tickerNormalized = (tickerLogValue - tickerLogMin) / (tickerLogMax - tickerLogMin);
    
    // Draw arc meter
    const tickerGradient = c.createLinearGradient(
        hueTickerKnobX + Math.cos(meterStart) * knobRadius,
        hueTickerKnobY + Math.sin(meterStart) * knobRadius,
        hueTickerKnobX + Math.cos(meterStart + fullMeterSweep) * knobRadius,
        hueTickerKnobY + Math.sin(meterStart + fullMeterSweep) * knobRadius
    );
    tickerGradient.addColorStop(0, `hsla(190, 0%, 60%, ${colorMenuOpacity})`);
    tickerGradient.addColorStop(0.5, `hsla(170, 0%, 80%, ${colorMenuOpacity})`);
    c.strokeStyle = tickerGradient;
    c.beginPath();
    c.arc(hueTickerKnobX, hueTickerKnobY, knobRadius * 0.85, meterStart, meterStart + fullMeterSweep * tickerNormalized);
    c.lineWidth = 0.02 * cScale;
    c.stroke();
    
    // Draw needle
    const tickerNeedleAngle = meterStart + tickerNormalized * fullMeterSweep;
    const tickerPointerLength = knobRadius * 0.6;
    const tickerPointerEndX = hueTickerKnobX + Math.cos(tickerNeedleAngle) * tickerPointerLength;
    const tickerPointerEndY = hueTickerKnobY + Math.sin(tickerNeedleAngle) * tickerPointerLength;
    c.beginPath();
    c.moveTo(hueTickerKnobX, hueTickerKnobY);
    c.lineTo(tickerPointerEndX, tickerPointerEndY);
    c.strokeStyle = `hsla(210, 0%, 80%, ${colorMenuOpacity})`;
    c.lineWidth = 0.008 * cScale;
    c.stroke();

    // Draw value label
    c.font = `${0.25 * knobRadius}px verdana`;
    c.fillStyle = `hsla(160, 80%, 50%, ${menuOpacity})`;
    if (boidProps.hueTicker < 0.1) {
        c.fillText((boidProps.hueTicker).toFixed(2), hueTickerKnobX, hueTickerKnobY + 0.5 * knobRadius);
    } else {
    c.fillText((boidProps.hueTicker).toFixed(1), hueTickerKnobX, hueTickerKnobY + 0.5 * knobRadius);
    }

    // Draw label
    c.font = `${0.29 * knobRadius}px verdana`;
    c.strokeStyle = `hsla(210, 0%, 0%, ${0.6 * colorMenuOpacity})`;
    c.lineWidth = 0.03 * knobRadius;
    c.lineJoin = 'round';
    c.strokeText('Color', 0.04 * knobRadius + hueTickerKnobX, 0.04 * knobRadius + (hueTickerKnobY + 1.35 * knobRadius));
    c.strokeText('Cycling', 0.04 * knobRadius + hueTickerKnobX, 0.04 * knobRadius + (hueTickerKnobY + 1.7 * knobRadius));
    c.fillStyle = `hsla(210, 0%, 95%, ${colorMenuOpacity})`;
    c.fillText('Color', hueTickerKnobX, hueTickerKnobY + 1.35 * knobRadius);
    c.fillText('Cycling', hueTickerKnobX, hueTickerKnobY + 1.7 * knobRadius);
    } 
    
    c.restore();
}

//  MAKE BOIDS  ---------------------------------------------------------------------
function resetParameters() {
    // Reset all parameters to defaults
    boidRadius = 0.02;
    boidProps.numBoids = 2200;
    boidProps.minDistance = Math.max(0.08, 5.0 * boidRadius);
    boidProps.avoidFactor = 50.0;
    boidProps.matchingFactor = 10.0;
    boidProps.visualRange = 10.0 * boidRadius;
    boidProps.centeringFactor = 5.0;
    boidProps.speedLimit = 1.1;
    boidProps.turnFactor = 1.0;
    boidProps.tailLength = 10;
    boidProps.tailWidth = 1.0;
    
    // Reset tail color mode to black
    tailColorMode = 0;
    
    // Reset boid type to arrows
    selectedBoidType = 0;
    doArrowBoids();
    
    // Update all boid radii
    for (let i = 0; i < Boids.length; i++) {
        Boids[i].radius = boidRadius;
    }
    
    // Reset boid count to the final count established during startup
    if (finalBoidCount > 0) {
        const currentCount = Boids.length;
        
        if (currentCount > finalBoidCount) {
            // Remove excess boids
            const removeCount = currentCount - finalBoidCount;
            cullBoids(removeCount);
        } else if (currentCount < finalBoidCount) {
            // Add boids to reach final count
            const addCount = finalBoidCount - currentCount;
            const spawnRadius = Math.sqrt(simWidth * simWidth + simHeight * simHeight) * 0.6;
            
            for (let i = 0; i < addCount; i++) {
                const ang = Math.random() * 2 * Math.PI;
                const pos = new Vector2(
                    0.5 * simWidth + Math.cos(ang) * spawnRadius,
                    0.5 * simHeight + Math.sin(ang) * spawnRadius);
                // Give initial velocity toward center (prevents slow clustering)
                const velAngle = Math.random() * 2 * Math.PI;
                const velMag = 0.3 + Math.random() * 0.4; // Random speed 0.3-0.7
                const vel = new Vector2(Math.cos(velAngle) * velMag, Math.sin(velAngle) * velMag);
                const hue = 0;
                
                const newBoid = new BOID(pos, vel, hue, false, false);
                newBoid.triangleBoid = selectedBoidType === 0;
                newBoid.arrow = selectedBoidType === 1;
                newBoid.flappy = selectedBoidType === 2;
                newBoid.circle = selectedBoidType === 3;
                newBoid.ellipseBoid = selectedBoidType === 4;
                newBoid.square = selectedBoidType === 5;
                newBoid.airfoil = selectedBoidType === 6;
                newBoid.glowBoid = selectedBoidType === 7;
                
                // Insert before the last 2 special boids
                Boids.splice(Boids.length - 2, 0, newBoid);
                SpatialGrid.insert(newBoid);
            }
        }
    }
}

function makeBoids() {
    Boids = [];
    boidRadius = 0.02;

    boidProps = {
        numBoids: 2000,
        marginX: Math.min(0.3 * simWidth, 0.3 * simHeight),
        marginY: Math.min(0.3 * simWidth, 0.3 * simHeight),
        minDistance: 5.0 * boidRadius, // Rule #1 - The distance to stay away from other Boids
        avoidFactor: 50.0, // Rule #1 -Adjust velocity by this %
        matchingFactor: 10.0, // Rule #2 - Adjust velocity by this %
        visualRange: 10.0 * boidRadius, // How far Boids can see each other
        centeringFactor: 5.0, // Rule #3 - Adjust velocity by this %
        speedLimit: 1.1, // clamp speed to this value
        turnFactor: 1.0, // How strongly Boids turn back when near edge
        tailLength: 10, // Number of trail points to keep (negative for last N points)
        tailWidth: 1.0, // Width of tail line (1.0 to 5.0)
        doTails: true,
        blackBoidFlashInterval: 5.0, // Flash every 5 seconds
        blackBoidFlashTimer: 0,
        currentFlashCycle: 0, // Track which flash cycle we're in
        hueSensitivity: 40, // How much the hue changes based on speed
        hueTicker: 0.01, // How fast the hue cycles
    };

    // (no trails for phone?)  ---------
    if (simWidth < simHeight) {
        boidProps.doTails = true;
    } else {
        boidProps.doTails = true;
    }

    // Start with only 100 boids (will ramp up gradually)
    const initialBoidCount = 100;
    const spawnRadius = Math.sqrt(simWidth * simWidth + simHeight * simHeight) * 0.6;
    let pos, vel, ang;
    for (var i = 0; i < initialBoidCount; i += 1) {
        // Spawn from anywhere around the circle
        ang = Math.random() * 2 * Math.PI;
        pos = new Vector2(
            0.5 * simWidth + Math.cos(ang) * spawnRadius,
            0.5 * simHeight + Math.sin(ang) * spawnRadius);
        // Give initial velocity toward center (prevents slow clustering)
        const velAngle = Math.random() * 2 * Math.PI;
        const velMag = 0.3 + Math.random() * 0.4; // Random speed 0.3-0.7
        vel = new Vector2(Math.cos(velAngle) * velMag, Math.sin(velAngle) * velMag);
        hue = 0;
        if (i == 0) {
            // White boid
            Boids.push(new BOID(pos, vel, hue, true, false));
        } else if (i == 1) {
            // Black boid
            Boids.push(new BOID(pos, vel, hue, false, true));
        } else {
            Boids.push(new BOID(pos, vel, hue, false, false));
        }
    }
}

// WAND VARIABLES -----------------
let wandPosX = 0.5;
let wandPosY = 0.5;
let wandAngle = 0.4 * Math.PI;
let wandSize = 1;
let wandActive = false;
let isDraggingWand = false;
let wandDragOffsetX = 0;
let wandDragOffsetY = 0;
let wandPrevX = 0.5;
let wandPrevY = 0.5;
let wandSpawnTimer = 0;

// APPLY WAND ---------------------
function applyWand(wandX, wandY, wandAngle, wandSize) {
    drawWand(wandX, wandY, wandAngle, wandSize)
    // spawn boids at wand tip
}

// DRAW WAND ---------------------
function drawWand(wandX, wandY, wandAngle, wandSize) {
    const wandLength = 0.3 * wandSize;
    const wandWidth = 0.008 * wandSize;
    
    c.save();
    c.translate(wandX * cScale, canvas.height - wandY * cScale);
    
    // rotate 30 degrees ccw from vertical
    c.rotate(wandAngle);

    // draw black wand shaft background
    c.fillStyle = 'hsl(0, 0%, 0%)';
    c.fillRect(0, -2 * wandWidth * cScale / 2, wandLength * cScale, 2 * wandWidth * cScale);
    
    // DRAW BLACK END BACKGROUND
    c.beginPath();
    c.arc(wandLength * cScale, 0, wandWidth * 2.0 * cScale, 0, Math.PI * 2);
    c.fill();

    // draw red wand shaft
    c.fillStyle = 'red';
    c.fillRect(0, -wandWidth * cScale / 2, wandLength * cScale, wandWidth * cScale);
    
    // DRAW red END
    c.beginPath();
    c.arc(wandLength * cScale, 0, wandWidth * 1.5 * cScale, 0, Math.PI * 2);
    c.fillStyle = 'red';
    c.fill();
    
    // Move to star tip position (beyond the base/handle)
    c.translate(wandLength * cScale * -0.1, 0);
            
    // Draw each black outline for star points
    c.lineWidth = 0.02 * cScale;
    for (let i = 0; i < 5; i++) {
        const angle = (i * (2 * Math.PI / 5) - Math.PI / 2 - 0.25 * wandAngle);
        const x = Math.cos(angle) * wandLength * 0.2 * cScale;
        const y = Math.sin(angle) * wandLength * 0.2 * cScale;
        const innerAngle = (angle + Math.PI / 5);
        const innerX = Math.cos(innerAngle) * wandLength * 0.1 * cScale;
        const innerY = Math.sin(innerAngle) * wandLength * 0.1 * cScale;
        
        // Next outer point
        const nextAngle = ((i + 1) * (2 * Math.PI / 5) - Math.PI / 2 - 0.25 * wandAngle);
        const nextX = Math.cos(nextAngle) * wandLength * 0.2 * cScale;
        const nextY = Math.sin(nextAngle) * wandLength * 0.2 * cScale;
        
        // Draw one point as a separate path
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(innerX, innerY);
        c.lineTo(nextX, nextY);
        c.strokeStyle = `hsla(0, 0%, 0%, 0.3)`;
        c.stroke();
    }

    // Draw each star point with different colors
    c.lineWidth = 0.007 * cScale;
    for (let i = 0; i < 5; i++) {
        const angle = (i * (2 * Math.PI / 5) - Math.PI / 2 - 0.25 * wandAngle);
        const x = Math.cos(angle) * wandLength * 0.2 * cScale;
        const y = Math.sin(angle) * wandLength * 0.2 * cScale;
        const innerAngle = (angle + Math.PI / 5);
        const innerX = Math.cos(innerAngle) * wandLength * 0.1 * cScale;
        const innerY = Math.sin(innerAngle) * wandLength * 0.1 * cScale;
        
        // Next outer point
        const nextAngle = ((i + 1) * (2 * Math.PI / 5) - Math.PI / 2 - 0.25 * wandAngle);
        const nextX = Math.cos(nextAngle) * wandLength * 0.2 * cScale;
        const nextY = Math.sin(nextAngle) * wandLength * 0.2 * cScale;
        
        // Draw one point as a separate path
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(innerX, innerY);
        c.lineTo(nextX, nextY);
        c.strokeStyle = `hsl(${45 * (i / 5) + 25}, 100%, 50%)`;
        
        c.stroke();
    }

    // Draw each star point with different colors
    c.lineWidth = 0.007 * cScale;
    for (let i = 0; i < 5; i++) {
        const angle = (i * (2 * Math.PI / 5) - Math.PI / 2 - 0.25 * wandAngle);
        const x = Math.cos(angle) * wandLength * 0.1 * cScale;
        const y = Math.sin(angle) * wandLength * 0.1 * cScale;
        const innerAngle = (angle + Math.PI / 5);
        const innerX = Math.cos(innerAngle) * wandLength * 0.1 * cScale;
        const innerY = Math.sin(innerAngle) * wandLength * 0.1 * cScale;
        
        // Next outer point
        const nextAngle = ((i + 1) * (2 * Math.PI / 5) - Math.PI / 2 - 0.25 * wandAngle);
        const nextX = Math.cos(nextAngle) * wandLength * 0.2 * cScale;
        const nextY = Math.sin(nextAngle) * wandLength * 0.2 * cScale;
        
        // Draw one point as a separate path
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(innerX, innerY);
        c.lineTo(nextX, nextY);
        c.strokeStyle = `hsl(${45 * (i / 5) + 25}, 100%, 50%)`;
        
        c.stroke();
    }
    
    c.restore();
}

// CHECK IF MOUSE IS NEAR WAND -----------
function isMouseNearWand(mx, my, wandX, wandY, wandAngle, wandSize) {
    const wandLength = 0.3 * wandSize;
    const wandWidth = 0.008 * wandSize;
    const grabWidth = wandLength * 0.5; // Perpendicular grab distance from center axis
    
    // Transform mouse position to wand's local coordinate system
    const dx = mx - wandX;
    const dy = my - wandY;
    
    // Rotate by positive angle because canvas Y is flipped relative to simulation Y
    const localX = dx * Math.cos(wandAngle) - dy * Math.sin(wandAngle);
    const localY = dx * Math.sin(wandAngle) + dy * Math.cos(wandAngle);
    
    // The wand geometry in local coordinates:
    // - Star at -0.1 * wandLength, star radius ~0.2 * wandLength, so extends to -0.3 * wandLength
    // - Shaft from 0 to wandLength
    // - Red circle at wandLength with radius 1.5 * wandWidth, so extends to wandLength + 1.5 * wandWidth
    const wandStart = -0.3 * wandLength;
    const wandEnd = wandLength + 1.5 * wandWidth;
    
    // Check if point is along the wand length
    if (localX < wandStart || localX > wandEnd) {
        return false;
    }
    
    // Check perpendicular distance from the wand axis
    const perpDist = Math.abs(localY);
    return perpDist <= grabWidth;
}


// HANDLE BOID BOUNDS - RECTANGULAR -------------
function handleBounds(boid) {
    if (boid.pos.x <= boidProps.marginX) {
        boid.vel.x += boidProps.turnFactor * deltaT;
    }
    if (boid.pos.x >= simWidth - boidProps.marginX) {
        boid.vel.x -= boidProps.turnFactor * deltaT;
    }
    if (boid.pos.y <= boidProps.marginY) {
        boid.vel.y += boidProps.turnFactor * deltaT;
    }
    if (boid.pos.y >= simHeight - boidProps.marginY) {
        boid.vel.y -= boidProps.turnFactor * deltaT;
    }
}

/*
// HANDLE BOID BOUNDS - ELLIPTICAL -------------
function handleBounds(boid) {
    // Elliptical boundary check (fast calculation)
    const centerX = simWidth / 2;
    const centerY = simHeight / 2;
    const radiusX = (simWidth / 2) - boidProps.marginX;
    const radiusY = (simHeight / 2) - boidProps.marginY;
    
    // Normalized distance from center (0 at center, 1 at edge of ellipse)
    const dx = (boid.pos.x - centerX) / radiusX;
    const dy = (boid.pos.y - centerY) / radiusY;
    const distSq = dx * dx + dy * dy;
    
    // If outside ellipse boundary, apply turn force toward center
    if (distSq > 1.0) {
        const turnStrength = boidProps.turnFactor * deltaT * (distSq - 1.0);
        boid.vel.x -= dx * turnStrength;
        boid.vel.y -= dy * turnStrength;
    }
}*/

// MAGNET CLASS -------------
class MAGNET {
    constructor() {
        this.x = 0.5 * simWidth;
        this.y = 0.5 * simHeight;
        this.radius = 0.04 * Math.min(simWidth, simHeight);
        this.effectRadius = magnetEffectRadius * Math.min(simWidth, simHeight);
        this.pulser = 0;
        this.lightness = 1.0;
    }
    draw() {
        this.pulser += 0.05;
        if (this.pulser >= 2 *Math.PI) {
            this.pulser = 0;
        }
        this.lightness = Math.abs(Math.cos(this.pulser)) * 0.4 + 0.6;
        c.save();
        c.translate(this.x * cScale, canvas.height - this.y * cScale);

        // Draw magnet sphere
        c.beginPath();
        c.arc(0, 0, this.radius * cScale, 0, 2 * Math.PI);
        const sphereGradient = c.createRadialGradient(
            -0.2 * this.radius * cScale, 
            -0.3 * this.radius * cScale,
            0,
            -0.2 * this.radius * cScale, 
            -0.3 * this.radius * cScale,
            this.radius * cScale);
        sphereGradient.addColorStop(0, `hsl(200, 80%, ${this.lightness * 60}%)`);
        sphereGradient.addColorStop(1, `hsl(200, 80%, ${this.lightness * 20}%)`);
        c.fillStyle = sphereGradient;
        c.fill();

        // Draw horseshoe magnet icon on the sphere as one continuous path
        const iconSize = this.radius * cScale * 0.6;
        c.strokeStyle = 'hsla(0, 70%, 50%, 0.7)'; // Red for magnet body
        c.lineWidth = iconSize * 0.4;
        c.lineCap = 'butt';
        c.lineJoin = 'round';
        
        c.beginPath();
        // Start at top of left arm
        c.moveTo(-iconSize * 0.35, -iconSize * 0.4);
        // Left arm curving outward
        c.quadraticCurveTo(-iconSize * 0.45, 0, -iconSize * 0.35, iconSize * 0.2);
        // Bottom connecting arc
        c.arc(0, iconSize * 0.2, iconSize * 0.35, Math.PI, 0, true);
        // Right arm curving outward
        c.quadraticCurveTo(iconSize * 0.45, 0, iconSize * 0.35, -iconSize * 0.4);
        c.stroke();
        
        // White tips with square ends
        c.strokeStyle = 'hsla(0, 0%, 100%, 0.9)';
        c.lineWidth = iconSize * 0.4;
        c.lineCap = 'butt';
        
        // Left tip
        c.beginPath();
        c.moveTo(-iconSize * 0.35, -iconSize * 0.4);
        c.lineTo(-iconSize * 0.35, -iconSize * 0.25);
        c.stroke();
        
        // Right tip
        c.beginPath();
        c.moveTo(iconSize * 0.35, -iconSize * 0.4);
        c.lineTo(iconSize * 0.35, -iconSize * 0.25);
        c.stroke();

        // Draw glowing aura 
        c.beginPath();
        c.arc(0, 0, this.effectRadius * cScale, 0, 2 * Math.PI);
        const auraGradient = c.createRadialGradient(
            0, 
            0, 
            0, 
            0, 
            0, 
            this.effectRadius * cScale);
        auraGradient.addColorStop(0, `hsl(180, 80%, ${this.lightness * 50}%, 0.0)`);
        auraGradient.addColorStop(this.radius / this.effectRadius, `hsl(180, 80%, ${this.lightness * 50}%, 0.0)`);
        auraGradient.addColorStop(this.radius / this.effectRadius, `hsl(180, 80%, ${this.lightness * 50}%, 0.2)`);
        auraGradient.addColorStop(1, `hsl(180, 80%, ${this.lightness * 30}%, 0.0)`);
        c.fillStyle = auraGradient;
        c.fill();

        c.restore();
    }
}

// Define magnet -------------
function makeMagnet() {
    Magnet = [];
    Magnet.push(new MAGNET);
}

//  HANDLE MAGNET -------------
function handleMagnet(boid) {
    if (magnetActive) {
        const magnetDx = Magnet[0].x - boid.pos.x;
        const magnetDy = Magnet[0].y - boid.pos.y;
        const magnetDistSq = magnetDx * magnetDx + magnetDy * magnetDy;
        const magnetEffectRadius = Magnet[0].effectRadius;
        const radiusSq = magnetEffectRadius * magnetEffectRadius;
        
        if (magnetDistSq < radiusSq && magnetDistSq > 0) {
            // Only compute sqrt when we know we need it
            const magnetDist = Math.sqrt(magnetDistSq);
            boid.vel.x += magnetDx * magnetForce * deltaT;
            boid.vel.y += magnetDy * magnetForce * deltaT;
        }
    }
}

//  HANDLE CLOUDS -------------
function handleClouds(boid) {
    // CLOUD AVOIDANCE - loop through all Clouds
    if (showClouds) {
        for (let cloud of Clouds) {
            const cloudDx = boid.pos.x - cloud.x;
            const cloudDy = boid.pos.y - cloud.y;
            const cloudDistSq = cloudDx * cloudDx + cloudDy * cloudDy;
            const cloudAvoidRadius = cloud.radius + boidProps.minDistance * 1.5;
            const radiusSq = cloudAvoidRadius * cloudAvoidRadius;
            
            if (cloudDistSq < radiusSq && cloudDistSq > 0) {
                // Only compute sqrt when we know we need it
                const cloudDist = Math.sqrt(cloudDistSq);
                const cloudStrength = boidProps.avoidFactor * 3.0 * (cloudAvoidRadius - cloudDist) / cloudDist;
                boid.vel.x += cloudDx * cloudStrength * deltaT;
                boid.vel.y += cloudDy * cloudStrength * deltaT;
            }
        }
    }
    
    // MOVING AIRPLANE AVOIDANCE
    if (showPlane) {
        for (let plane of Airplane) {
            const planeDx = boid.pos.x - plane.x;
            const planeDy = boid.pos.y - plane.y;
            const planeDistSq = planeDx * planeDx + planeDy * planeDy;
            const cloudAvoidRadius = plane.radius + boidProps.minDistance * 1.5;
            const radiusSq = cloudAvoidRadius * cloudAvoidRadius;
            
            if (planeDistSq < radiusSq && planeDistSq > 0) {
                const planeDist = Math.sqrt(planeDistSq);
                const planeStrength = boidProps.avoidFactor * 3.0 * (cloudAvoidRadius - planeDist) / planeDist;
                boid.vel.x += planeDx * planeStrength * deltaT;
                boid.vel.y += planeDy * planeStrength * deltaT;
            }
        }
    }

    // BALLOON AVOIDANCE
    if (showBalloons) {
        for (let balloon of Balloons) {
            const balloonDx = boid.pos.x - balloon.pos.x;
            const balloonDy = boid.pos.y - balloon.pos.y;
            const balloonDistSq = balloonDx * balloonDx + balloonDy * balloonDy;
            const balloonAvoidRadius = balloon.radius + boidProps.minDistance * 1.5;
            const radiusSq = balloonAvoidRadius * balloonAvoidRadius;
            
            if (balloonDistSq < radiusSq && balloonDistSq > 0) {
                const balloonDist = Math.sqrt(balloonDistSq);
                const balloonStrength = boidProps.avoidFactor * 3.0 * (balloonAvoidRadius - balloonDist) / balloonDist;
                boid.vel.x += balloonDx * balloonStrength * deltaT;
                boid.vel.y += balloonDy * balloonStrength * deltaT;
            }
        }
    }
}

//  HANDLE FLASHING -------------
function handleFlashing(boid) {
    // Update flash timer
    if (boid.flashing) {
        boid.flashTimer += deltaT;
        if (boid.flashTimer >= boid.flashDuration) {
            boid.flashing = false;
            boid.flashTimer = 0;
            boid.flashCooldown = boid.flashCooldownDuration; // Start cooldown
        }
    }
    
    // Update cooldown timer
    if (boid.flashCooldown > 0) {
        boid.flashCooldown -= deltaT;
        if (boid.flashCooldown < 0) {
            boid.flashCooldown = 0;
        }
    }
    
    // Check if nearby boids are flashing and respond
    // Only respond if not currently flashing, not in cooldown, not the blackBoid,
    // and hasn't already flashed in this cycle
    if (!boid.flashing && boid.flashCooldown <= 0 && !boid.blackBoid && boid.lastFlashCycle < boidProps.currentFlashCycle) {
        const nearbyBoids = SpatialGrid.getNearby(boid, boidProps.visualRange);
        const flashRangeSq = boidProps.visualRange * boidProps.visualRange;
        
        for (let otherBoid of nearbyBoids) {
            if (otherBoid !== boid && otherBoid.flashing && otherBoid.flashTimer > 0) {
                const dx = boid.pos.x - otherBoid.pos.x;
                const dy = boid.pos.y - otherBoid.pos.y;
                const distSq = dx * dx + dy * dy;
                
                if (distSq < flashRangeSq) {
                    // Trigger flash with a small random delay
                    //const delay = Math.random() * 0.05; // 0-50ms delay
                    const delay = 0.01 + Math.random() * 0.04;
                    boid.flashTimer = -delay;
                    boid.flashing = true;
                    boid.lastFlashCycle = boidProps.currentFlashCycle; // Mark this cycle as processed
                    break;
                }
            }
        }
    }
}

//  HANDLE BOID RULES -------------
function handleBoidRules(boid) {
    let separationX = 0;
    let separationY = 0;
    let avgVelX = 0;
    let avgVelY = 0;
    let centerX = 0;
    let centerY = 0;
    let neighborCount = 0;
    
    // Get nearby boids from spatial hash
    const nearbyBoids = SpatialGrid.getNearby(boid, boidProps.visualRange);
    const visualRangeSq = boidProps.visualRange * boidProps.visualRange;
    const minDistSq = boidProps.minDistance * boidProps.minDistance;
    const avoidFactor = boidProps.avoidFactor;
    const minDistance = Math.max(0.08, 5.0 * boidRadius); // Use this to keep separation consistent if boidRadius changes
    
    // Use traditional for loop for better performance
    for (let i = 0; i < nearbyBoids.length; i++) {
        const otherBoid = nearbyBoids[i];
        if (otherBoid !== boid) {
            const dx = boid.pos.x - otherBoid.pos.x;
            const dy = boid.pos.y - otherBoid.pos.y;
            const distSq = dx * dx + dy * dy;
            
            if (distSq < visualRangeSq && distSq > 0) {
                // Check if segregation mode is active and hues match (within tolerance)
                const hueMatch = segregationMode === 0 || Math.abs(boid.hue - otherBoid.hue) < 10;
                
                // Color transfer: only the originally dyed boid can transfer color
                if (boid.dyedBoid && !otherBoid.dyedBoid) {
                    // Transfer color from originally dyed boid to any other boid
                    otherBoid.hue = boid.hue;
                    otherBoid.saturation = boid.saturation;
                    otherBoid.lightness = boid.lightness;
                    otherBoid.manualHue = true;
                    otherBoid.manualSaturation = true;
                    otherBoid.manualLightness = true;
                    // Don't set dyedBoid = true, so this boid won't transfer color to others
                } else if (otherBoid.dyedBoid && !boid.dyedBoid) {
                    // Transfer color from originally dyed other boid to this boid
                    boid.hue = otherBoid.hue;
                    boid.saturation = otherBoid.saturation;
                    boid.lightness = otherBoid.lightness;
                    boid.manualHue = true;
                    boid.manualSaturation = true;
                    boid.manualLightness = true;
                    // Don't set dyedBoid = true, so this boid won't transfer color to others
                }
                
                // RULE #2 - ALIGNMENT: accumulate velocities (only if hue matches in segregate modes)
                if (hueMatch) {
                    avgVelX += otherBoid.vel.x;
                    avgVelY += otherBoid.vel.y;
                }
                
                // RULE #3 - COHESION: accumulate positions (only if hue matches in segregate modes)
                if (hueMatch) {
                    centerX += otherBoid.pos.x;
                    centerY += otherBoid.pos.y;
                }
                
                // RULE #1 - SEPARATION: depends on mode (mode 1: same hue only, mode 2: all boids)
                const applyRule1 = (segregationMode === 0) || (segregationMode === 1 && hueMatch) || (segregationMode === 2);
                if (applyRule1 && distSq < minDistSq) {
                    const dist = Math.sqrt(distSq);
                    const strength = avoidFactor * (minDistance - dist) / dist;
                    separationX += dx * strength;
                    separationY += dy * strength;
                }

                // Only count as neighbor for alignment/cohesion if hue matches in segregate modes
                if (hueMatch) {
                    neighborCount++;
                }
            }
        }
    }

    // RULE #1 - SEPARATION
    boid.vel.x += separationX * deltaT;
    boid.vel.y += separationY * deltaT;
    
    if (neighborCount > 0) {
        // RULE #2 - ALIGNMENT
        const invNeighborCount = 1.0 / neighborCount;
        avgVelX *= invNeighborCount;
        avgVelY *= invNeighborCount;
        boid.vel.x += (avgVelX - boid.vel.x) * boidProps.matchingFactor * deltaT;
        boid.vel.y += (avgVelY - boid.vel.y) * boidProps.matchingFactor * deltaT;
        
        // RULE #3 - COHESION
        centerX *= invNeighborCount;
        centerY *= invNeighborCount;
        boid.vel.x += (centerX - boid.pos.x) * boidProps.centeringFactor * deltaT;
        boid.vel.y += (centerY - boid.pos.y) * boidProps.centeringFactor * deltaT;
    }
}

function drawSkyMenu() {
    // Only draw menu if it has some opacity
    if (skyMenuOpacity <= 0 || !window.skyRenderer) return;
    
    const skyCtrl = window.skyRenderer.effectController;
    const menuItems = [
        skyCtrl.turbidity,
        skyCtrl.rayleigh,
        skyCtrl.mieCoefficient,
        skyCtrl.mieDirectionalG,
        skyCtrl.azimuth,
        -skyCtrl.rotationSpeed,
        skyCtrl.elevation,
        skyCtrl.exposure,
        skyCtrl.fov,
        autoElevationRate
    ];
    
    const ranges = [
        {min: 0, max: 20},           // turbidity
        {min: 0, max: 4},             // rayleigh
        {min: 0, max: 0.1},           // mieCoefficient
        {min: 0, max: 1},             // mieDirectionalG
        {min: 0, max: 359},           // azimuth
        {min: -2, max: 2},            // rotationSpeed
        {min: -2, max: 10},           // elevation
        {min: 0, max: 1},             // exposure
        {min: 10, max: 120},          // fov
        {min: 0.01, max: 0.10}        // autoElevationRate
    ];
    
    const labels = ['Turbidity', 'Rayleigh Scattering', 'Mie Scattering', 'Scatter Focus', 'Sun Azimuth', 'Auto Azimuth', 'Sun Elevation', 'Exposure', 'Field of View', 'Auto Elevation'];
    
    const knobRadius = 0.1 * cScale;
    const knobSpacing = knobRadius * 3;
    const menuUpperLeftX = skyMenuX * cScale;
    const menuUpperLeftY = canvas.height - skyMenuY * cScale;
    const fullMeterSweep = 1.6 * Math.PI;
    const meterStart = 0.5 * Math.PI + 0.5 * (2 * Math.PI - fullMeterSweep);
    
    c.save();
    c.translate(menuUpperLeftX + knobSpacing, menuUpperLeftY + 0.5 * knobSpacing);
    
    // Draw overall menu background with rounded corners
    const menuWidth = knobSpacing * 3;
    const menuHeight = knobSpacing * 2.25;
    const padding = 1.7 * knobRadius;
    
    const cornerRadius = 0.05 * cScale;
    c.beginPath();
    c.moveTo(-padding + cornerRadius, -padding);
    c.lineTo(menuWidth + padding - cornerRadius, -padding);
    c.quadraticCurveTo(menuWidth + padding, -padding, menuWidth + padding, -padding + cornerRadius);
    c.lineTo(menuWidth + padding, menuHeight + padding - cornerRadius);
    c.quadraticCurveTo(menuWidth + padding, menuHeight + padding, menuWidth + padding - cornerRadius, menuHeight + padding);
    c.lineTo(-padding + cornerRadius, menuHeight + padding);
    c.quadraticCurveTo(-padding, menuHeight + padding, -padding, menuHeight + padding - cornerRadius);
    c.lineTo(-padding, -padding + cornerRadius);
    c.quadraticCurveTo(-padding, -padding, -padding + cornerRadius, -padding);
    c.closePath();
    c.strokeStyle = `hsla(30, 80%, 60%, ${skyMenuOpacity})`;
    c.lineWidth = 0.004 * cScale;
    const menuGradient = c.createLinearGradient(0, -padding, 0, menuHeight + padding);
    menuGradient.addColorStop(0, `hsla(30, 70%, 25%, ${0.9 * skyMenuOpacity})`);
    menuGradient.addColorStop(1, `hsla(30, 70%, 10%, ${0.9 * skyMenuOpacity})`);
    c.fillStyle = menuGradient;
    c.fill();
    c.stroke();
    
    // Draw close icon in upper left corner (round button)
    const closeIconRadius = knobRadius * 0.25;
    const closeIconX = -padding + closeIconRadius + 0.2 * knobRadius;
    const closeIconY = -padding + closeIconRadius + 0.2 * knobRadius;
    
    // Red background circle
    c.beginPath();
    c.arc(closeIconX, closeIconY, closeIconRadius, 0, 2 * Math.PI);
    c.fillStyle = `hsla(0, 70%, 40%, ${skyMenuOpacity})`;
    c.fill();
    
    // Black X
    c.strokeStyle = `hsla(0, 0%, 0%, ${skyMenuOpacity})`;
    c.lineWidth = 0.05 * knobRadius;
    c.lineCap = 'round';
    const xSize = closeIconRadius * 0.4;
    c.beginPath();
    c.moveTo(closeIconX - xSize, closeIconY - xSize);
    c.lineTo(closeIconX + xSize, closeIconY + xSize);
    c.moveTo(closeIconX + xSize, closeIconY - xSize);
    c.lineTo(closeIconX - xSize, closeIconY + xSize);
    c.stroke();
    
    // Draw title
    c.fillStyle = `hsla(30, 80%, 80%, ${skyMenuOpacity})`;
    c.font = `bold ${0.05 * cScale}px verdana`;
    c.textAlign = 'center';
    c.fillText('SKY', menuWidth / 2, -padding + 0.04 * cScale);
    
    // Draw knobs for each parameter
    for (let i = 0; i < menuItems.length && i < 10; i++) {
        let x = (i % 4) * knobSpacing;
        let y = Math.floor(i / 4) * knobSpacing;
        // Special positioning for exposure knob (index 7) - move to column 1, row 2
        if (i === 7) {
            x = 1 * knobSpacing;
            y = 2 * knobSpacing;
        }
        // Special positioning for FOV knob (index 8) - move to column 3, row 2
        if (i === 8) {
            x = 3 * knobSpacing;
            y = 2 * knobSpacing;
        }
        // Special positioning for autoElevationRate knob (index 9) - move to column 3, row 1
        if (i === 9) {
            x = 3 * knobSpacing;
            y = 1 * knobSpacing;
        }
        
        const value = menuItems[i];
        const range = ranges[i];
        const normalized = (value - range.min) / (range.max - range.min);
        
        // Draw knob background circle
        c.beginPath();
        c.arc(x, y, knobRadius, 0, 2 * Math.PI);
        c.fillStyle = `hsla(30, 40%, 15%, ${0.9 *skyMenuOpacity})`;
        c.fill();
        c.strokeStyle = `hsla(30, 60%, 40%, ${skyMenuOpacity})`;
        c.lineWidth = 0.003 * cScale;
        c.stroke();
        
        // Draw meter arc - for azimuth (index 4), draw full circle
        c.beginPath();
        if (i === 4) {
            // Azimuth - draw full circle
            c.arc(x, y, knobRadius * 0.85, 0, 2 * Math.PI);
        } else if (i === 8) {
            // FOV knob - draw inverted arc
            c.arc(x, y, knobRadius * 0.85, meterStart, meterStart + fullMeterSweep * (1 - normalized));
        } else {
            // Other knobs - draw partial arc
            c.arc(x, y, knobRadius * 0.85, meterStart, meterStart + fullMeterSweep * normalized);
        }
        const gradient = c.createLinearGradient(
            x + Math.cos(meterStart) * knobRadius,
            y + Math.sin(meterStart) * knobRadius,
            x + Math.cos(meterStart + fullMeterSweep) * knobRadius,
            y + Math.sin(meterStart + fullMeterSweep) * knobRadius
        );
        gradient.addColorStop(0, `hsla(20, 80%, 60%, ${skyMenuOpacity})`);
        gradient.addColorStop(0.5, `hsla(35, 80%, 60%, ${skyMenuOpacity})`);
        c.strokeStyle = gradient;
        //c.strokeStyle = `hsla(30, 80%, 60%, ${skyMenuOpacity})`;
        c.lineWidth = 0.02 * cScale;
        c.stroke();
        
        // Draw knob pointer
        let pointerAngle;
        if (i === 4) {
            // Azimuth - full 360 degree rotation (reversed)
            pointerAngle = (1 - normalized) * 2 * Math.PI;
        } else if (i === 8) {
            // FOV - inverted
            pointerAngle = meterStart + fullMeterSweep * (1 - normalized);
        } else {
            // Other knobs - normal
            pointerAngle = meterStart + fullMeterSweep * normalized;
        }
        const pointerLength = knobRadius * 0.6;
        const pointerEndX = x + Math.cos(pointerAngle) * pointerLength;
        const pointerEndY = y + Math.sin(pointerAngle) * pointerLength;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(pointerEndX, pointerEndY);
        c.strokeStyle = `hsla(30, 80%, 80%, ${skyMenuOpacity})`;
        c.lineWidth = 0.008 * cScale;
        c.stroke();
        
        // Draw label
        c.fillStyle = `hsla(0, 0%, 80%, ${skyMenuOpacity})`;
        c.font = `${0.032 * cScale}px sans-serif`;
        c.textAlign = 'center';
        c.fillText(labels[i], x, y + knobRadius + 0.04 * cScale);
        
        // Draw value
        let decimals;
        if (i === 1 || i === 5 || i === 7 || i === 9) decimals = 2; // Concentration, sun movement, exposure, auto elevation rate
        else if (i === 4) decimals = 0; // Azimuth
        else if (i === 6) decimals = 1; // Elevation
        else decimals = value < 1 ? 3 : value < 10 ? 1 : 0; // Default logic
        let displayValue = value.toFixed(decimals);
        if (i === 4 || i === 8) displayValue += '°'; // Add degree symbol for azimuth and FOV
        c.fillStyle = `hsla(150, 50%, 60%, ${skyMenuOpacity})`;
        c.font = `${0.025 * cScale}px sans-serif`;
        c.fillText(displayValue, x, y + knobRadius * 0.60);
    }
    
    // Draw toggle buttons below the knobs
    const buttonY = knobSpacing * 2;
    const checkboxRadius = knobRadius * 0.25;
    
    // Auto Rotate checkbox (centered under Rotation Speed knob at col 1, row 1)
    const autoRotateX = knobSpacing * 1.0;
    const autoRotateY = knobSpacing * 1.0;
    
    // Draw outer circle with knob fill color
    c.beginPath();
    c.arc(autoRotateX, autoRotateY, checkboxRadius, 0, 2 * Math.PI);
    c.fillStyle = `hsla(30, 40%, 15%, ${0.9 * skyMenuOpacity})`; // Knob fill color
    c.fill();
    c.strokeStyle = `hsla(30, 60%, 40%, ${skyMenuOpacity})`;
    c.lineWidth = 0.003 * cScale;
    c.stroke();
    
    // Draw filled center (green when on, red when off)
    c.beginPath();
    c.arc(autoRotateX, autoRotateY, checkboxRadius * 0.5, 0, 2 * Math.PI);
    if (skyCtrl.autoRotate) {
        c.fillStyle = `hsla(120, 80%, 50%, ${skyMenuOpacity})`; // Green when active
    } else {
        c.fillStyle = `hsla(0, 80%, 50%, ${skyMenuOpacity})`; // Red when inactive
    }
    c.fill();
    
    // Auto Elevation checkbox (centered under Elevation Rate knob at col 3, row 1)
    const autoElevationX = knobSpacing * 3.0;
    const autoElevationY = knobSpacing * 1.0;
    
    // Draw outer circle with knob fill color
    c.beginPath();
    c.arc(autoElevationX, autoElevationY, checkboxRadius, 0, 2 * Math.PI);
    c.fillStyle = `hsla(30, 40%, 15%, ${0.9 * skyMenuOpacity})`; // Knob fill color
    c.fill();
    c.strokeStyle = `hsla(30, 60%, 40%, ${skyMenuOpacity})`;
    c.lineWidth = 0.003 * cScale;
    c.stroke();
    
    // Draw filled center (green when on, red when off)
    c.beginPath();
    c.arc(autoElevationX, autoElevationY, checkboxRadius * 0.5, 0, 2 * Math.PI);
    if (autoElevation) {
        c.fillStyle = `hsla(120, 80%, 50%, ${skyMenuOpacity})`; // Green when active
    } else {
        c.fillStyle = `hsla(0, 80%, 50%, ${skyMenuOpacity})`; // Red when inactive
    }
    c.fill();
    
    // Show Grid checkbox (centered under FOV knob at col 3, row 2)
    const showGridX = knobSpacing * 3.0;
    const showGridY = knobSpacing * 2.0;
    
    // Draw outer circle with knob fill color
    c.beginPath();
    c.arc(showGridX, showGridY, checkboxRadius, 0, 2 * Math.PI);
    c.fillStyle = `hsla(30, 40%, 15%, ${0.9 * skyMenuOpacity})`; // Knob fill color
    c.fill();
    c.strokeStyle = `hsla(30, 60%, 40%, ${skyMenuOpacity})`;
    c.lineWidth = 0.003 * cScale;
    c.stroke();
    
    // Draw filled center (green when on, red when off)
    c.beginPath();
    c.arc(showGridX, showGridY, checkboxRadius * 0.5, 0, 2 * Math.PI);
    if (skyCtrl.showGrid) {
        c.fillStyle = `hsla(120, 80%, 50%, ${skyMenuOpacity})`; // Green when active
    } else {
        c.fillStyle = `hsla(0, 80%, 50%, ${skyMenuOpacity})`; // Red when inactive
    }
    c.fill();
    
    // Object visibility toggle buttons - 2x2 grid centered below azimuth knob (column 0)
    const buttonRowY = buttonY;
    const buttonSpacing = knobRadius * 1.5;
    const gridCenterX = knobSpacing * 0.0; // Column 0 (azimuth)
    const buttonRowSpacing = knobRadius * 1.2;
    
    // Clouds toggle (top-left)
    const cloudsX = gridCenterX - 0.5 * buttonSpacing;
    const cloudsY = buttonRowY - 0.5 * buttonRowSpacing;
    c.beginPath();
    c.arc(cloudsX, cloudsY, checkboxRadius, 0, 2 * Math.PI);
    c.fillStyle = `hsla(30, 40%, 15%, ${0.3 * skyMenuOpacity})`;
    c.fill();
    c.strokeStyle = `hsla(30, 60%, 40%, ${skyMenuOpacity})`;
    c.lineWidth = 0.003 * cScale;
    c.stroke();
    if (showClouds) {
        c.beginPath();
        c.arc(cloudsX, cloudsY, checkboxRadius * 0.5, 0, 2 * Math.PI);
        c.fillStyle = `hsla(0, 0%, 80%, ${skyMenuOpacity})`;
        c.fill();
    }
    c.fillStyle = `hsla(0, 0%, 80%, ${skyMenuOpacity})`;
    c.font = `${0.028 * cScale}px sans-serif`;
    c.fillText('Clouds', cloudsX, cloudsY + knobRadius * 0.5);
    
    // Plane toggle (top-right)
    const planeX = gridCenterX + 0.5 * buttonSpacing;
    const planeY = buttonRowY - 0.5 * buttonRowSpacing;
    c.beginPath();
    c.arc(planeX, planeY, checkboxRadius, 0, 2 * Math.PI);
    c.fillStyle = `hsla(30, 40%, 15%, ${0.3 * skyMenuOpacity})`;
    c.fill();
    c.strokeStyle = `hsla(30, 60%, 40%, ${skyMenuOpacity})`;
    c.lineWidth = 0.003 * cScale;
    c.stroke();
    if (showPlane) {
        c.beginPath();
        c.arc(planeX, planeY, checkboxRadius * 0.5, 0, 2 * Math.PI);
        c.fillStyle = `hsla(0, 0%, 80%, ${skyMenuOpacity})`;
        c.fill();
    }
    c.fillStyle = `hsla(0, 0%, 80%, ${skyMenuOpacity})`;
    c.fillText('Airplane', planeX, planeY + knobRadius * 0.5);
    
    // Balloons toggle (bottom-left)
    const balloonsX = gridCenterX - 0.5 * buttonSpacing;
    const balloonsY = buttonRowY + 0.5 * buttonRowSpacing;
    c.beginPath();
    c.arc(balloonsX, balloonsY, checkboxRadius, 0, 2 * Math.PI);
    c.fillStyle = `hsla(30, 40%, 15%, ${0.3 * skyMenuOpacity})`;
    c.fill();
    c.strokeStyle = `hsla(30, 60%, 40%, ${skyMenuOpacity})`;
    c.lineWidth = 0.003 * cScale;
    c.stroke();
    if (showBalloons) {
        c.beginPath();
        c.arc(balloonsX, balloonsY, checkboxRadius * 0.5, 0, 2 * Math.PI);
        c.fillStyle = `hsla(0, 0%, 80%, ${skyMenuOpacity})`;
        c.fill();
    }
    c.fillStyle = `hsla(0, 0%, 80%, ${skyMenuOpacity})`;
    c.fillText('Party', balloonsX, balloonsY + knobRadius * 0.50);
    c.fillText('Balloons', balloonsX, balloonsY + knobRadius * 0.80);
    
    // Hot Air Balloon toggle (bottom-right)
    const hotAirBalloonX = gridCenterX + 0.5 * buttonSpacing;
    const hotAirBalloonY = buttonRowY + 0.5 * buttonRowSpacing;
    c.beginPath();
    c.arc(hotAirBalloonX, hotAirBalloonY, checkboxRadius, 0, 2 * Math.PI);
    c.fillStyle = `hsla(30, 40%, 15%, ${0.3 * skyMenuOpacity})`;
    c.fill();
    c.strokeStyle = `hsla(30, 60%, 40%, ${skyMenuOpacity})`;
    c.lineWidth = 0.003 * cScale;
    c.stroke();
    if (showHotAirBalloon) {
        c.beginPath();
        c.arc(hotAirBalloonX, hotAirBalloonY, checkboxRadius * 0.5, 0, 2 * Math.PI);
        c.fillStyle = `hsla(0, 0%, 80%, ${skyMenuOpacity})`;
        c.fill();
    }
    c.fillStyle = `hsla(0, 0%, 80%, ${skyMenuOpacity})`;
    c.fillText('Hot Air', hotAirBalloonX, hotAirBalloonY + knobRadius * 0.50);
    c.fillText('Balloon', hotAirBalloonX, hotAirBalloonY + knobRadius * 0.80);
    
    // Draw camera icon (in column 2, row 2)
    const camX = knobSpacing * 2.0;
    const camSize = knobRadius * 1.5; 
    
    // Draw movie camera icon (no background box)
    c.fillStyle = skyHandActive ? 
        `hsla(120, 90%, 60%, ${skyMenuOpacity})` : 
        `hsla(0, 50%, 40%, ${skyMenuOpacity})`;
    c.strokeStyle = `hsla(0, 0%, 10%, ${skyMenuOpacity})`
    c.lineWidth = 0.003 * cScale;
    c.lineCap = 'round';
    c.lineJoin = 'round';

    // Triangular lens on right side (pointing left, but wide at right)
    const lensY = (buttonY - camSize * 0.12) + (camSize * 0.35 / 2);
    c.beginPath();
    c.moveTo(camX + camSize * 0.45, lensY - camSize * 0.25);
    c.lineTo(camX - camSize * 0.10, lensY);
    c.lineTo(camX + camSize * 0.45, lensY + camSize * 0.25);
    c.closePath();
    c.fill();
    c.stroke();
    
    // Camera body (rectangle) - on the left
    c.beginPath();
    c.rect(
        camX - camSize * 0.5, 
        buttonY - camSize * 0.12, 
        camSize * 0.6, 
        camSize * 0.35);
    c.fill();
    c.stroke();
    
    // Film reels on top (left smaller, right larger)
    const leftReelX = camX - camSize * 0.4;
    const leftReelY = buttonY - camSize * 0.3;
    const leftReelRadius = camSize * 0.16;
    
    const rightReelX = camX - camSize * 0.02;
    const rightReelY = buttonY - camSize * 0.36;
    const rightReelRadius = camSize * 0.22;
    
    // Draw left reel (smaller)
    c.beginPath();
    c.arc(leftReelX, leftReelY, leftReelRadius, 0, 2 * Math.PI);
    c.fill();
    c.stroke();
    
    // Draw rotating circles on left reel when active (faster rotation)
    if (skyHandActive) {
        const time = Date.now() / 1000;
        const leftReelRotation = -time * 4; // 4 radians per second
        const leftReelDots = 4;
        const leftReelDotRadius = leftReelRadius * 0.7;
        const leftReelDotSize = camSize * 0.03;
        
        c.fillStyle = `hsla(0, 0%, 0%, ${skyMenuOpacity})`;
        for (let i = 0; i < leftReelDots; i++) {
            const angle = leftReelRotation + (i * 2 * Math.PI / leftReelDots);
            const dotX = leftReelX + Math.cos(angle) * leftReelDotRadius;
            const dotY = leftReelY + Math.sin(angle) * leftReelDotRadius;
            c.beginPath();
            c.arc(dotX, dotY, leftReelDotSize, 0, 2 * Math.PI);
            c.fill();
        }
    }
    
    // Draw right reel (larger)
    c.fillStyle = skyHandActive ? 
        `hsla(120, 90%, 60%, ${skyMenuOpacity})` : 
        `hsla(0, 50%, 40%, ${skyMenuOpacity})`;
    c.beginPath();
    c.arc(rightReelX, rightReelY, rightReelRadius, 0, 2 * Math.PI);
    c.fill();
    c.stroke();
    
    // Draw rotating circles on right reel when active (slower rotation, opposite direction)
    if (skyHandActive) {
        const time = Date.now() / 1000;
        const rightReelRotation = time * 2.5; // Negative for opposite rotation
        const rightReelDots = 5;
        const rightReelDotRadius = rightReelRadius * 0.7;
        const rightReelDotSize = camSize * 0.04;
        
        c.fillStyle = `hsla(0, 0%, 0%, ${skyMenuOpacity})`;
        for (let i = 0; i < rightReelDots; i++) {
            const angle = rightReelRotation + (i * 2 * Math.PI / rightReelDots);
            const dotX = rightReelX + Math.cos(angle) * rightReelDotRadius;
            const dotY = rightReelY + Math.sin(angle) * rightReelDotRadius;
            c.beginPath();
            c.arc(dotX, dotY, rightReelDotSize, 0, 2 * Math.PI);
            c.fill();
        }
    }

    // Draw lock icon only if skyHandActive is false
    if (!skyHandActive) {
        const lockSize = 40;
        const lockY = -lockSize / 4; // Position slightly above center
        
        // Draw lock body (rectangle)
        c.fillStyle = 'hsl(0, 0%, 70%)';
        c.fillRect(camX - lockSize/4, buttonY + lockY, lockSize/2, lockSize/2.5);
        
        // Draw lock shackle (arc on top)
        c.strokeStyle = 'hsl(0, 0%, 90%)';
        c.lineWidth = 3;
        c.beginPath();
        c.arc(camX, buttonY +(lockY - 0.15 * lockSize), lockSize/6, Math.PI, 0, false);
        c.stroke();

        // Draw shackle straight lengths
        c.beginPath();
        c.moveTo(camX - lockSize/6, buttonY + lockY);
        c.lineTo(camX - lockSize/6, buttonY + (lockY - 0.15 * lockSize));
        c.moveTo(camX + lockSize/6, buttonY + lockY);
        c.lineTo(camX + lockSize/6, buttonY + (lockY - 0.15 * lockSize));
        c.stroke();
    }
    
    // Label
    c.fillStyle = `hsla(0, 0%, 80%, ${skyMenuOpacity})`;
    c.font = `${0.028 * cScale}px sans-serif`;
    c.textAlign = 'center';
    c.fillText('Adjust Sky Camera', camX, buttonY + knobRadius * 0.7);
    
    // Credit link at bottom left - split into two parts
    c.font = `${0.032 * cScale}px sans-serif`;
    c.textAlign = 'left';
    const creditX = -padding + 0.3 * knobRadius;
    const creditY = menuHeight + padding - 0.3 * knobRadius;
    
    // Draw first part in tan
    c.fillStyle = `hsla(30, 50%, 70%, ${skyMenuOpacity})`;
    const prefixText = 'Sun and sky shader by '; 
    c.fillText(prefixText, creditX, creditY);
    
    // Draw ThreeJS.org in green
    const prefixWidth = c.measureText(prefixText).width;
    c.fillStyle = `hsla(120, 80%, 60%, ${skyMenuOpacity})`;
    c.fillText('ThreeJS.org', creditX + prefixWidth, creditY);
    
    c.restore();
}

function drawDrawMenu() {
    // Only draw menu if it has some opacity
    if (drawMenuOpacity <= 0) return;
    
    // Placeholder menu - will contain draw tools in future
    const menuItems = [];
    
    const knobRadius = 0.1 * cScale;
    const knobSpacing = knobRadius * 3;
    const menuUpperLeftX = drawMenuX * cScale;
    const menuUpperLeftY = canvas.height - drawMenuY * cScale;
    
    c.save();
    c.translate(menuUpperLeftX + knobSpacing, menuUpperLeftY + 0.5 * knobSpacing);
    
    // Draw overall menu background with rounded corners
    const menuWidth = knobSpacing * 2;
    const menuHeight = knobSpacing * 1.5;
    const padding = 1.7 * knobRadius;
    
    const cornerRadius = 0.05 * cScale;
    c.beginPath();
    c.moveTo(-padding + cornerRadius, -padding);
    c.lineTo(menuWidth + padding - cornerRadius, -padding);
    c.quadraticCurveTo(menuWidth + padding, -padding, menuWidth + padding, -padding + cornerRadius);
    c.lineTo(menuWidth + padding, menuHeight + padding - cornerRadius);
    c.quadraticCurveTo(menuWidth + padding, menuHeight + padding, menuWidth + padding - cornerRadius, menuHeight + padding);
    c.lineTo(-padding + cornerRadius, menuHeight + padding);
    c.quadraticCurveTo(-padding, menuHeight + padding, -padding, menuHeight + padding - cornerRadius);
    c.lineTo(-padding, -padding + cornerRadius);
    c.quadraticCurveTo(-padding, -padding, -padding + cornerRadius, -padding);
    c.closePath();
    c.strokeStyle = `hsla(340, 70%, 60%, ${drawMenuOpacity})`;
    c.lineWidth = 0.004 * cScale;
    const menuGradient = c.createLinearGradient(0, -padding, 0, menuHeight + padding);
    menuGradient.addColorStop(0, `hsla(340, 60%, 25%, ${0.9 * drawMenuOpacity})`);
    menuGradient.addColorStop(1, `hsla(340, 60%, 10%, ${0.9 * drawMenuOpacity})`);
    c.fillStyle = menuGradient;
    c.fill();
    c.stroke();
    
    // Draw close icon in upper left corner (round button)
    const closeIconRadius = knobRadius * 0.25;
    const closeIconX = -padding + closeIconRadius + 0.2 * knobRadius;
    const closeIconY = -padding + closeIconRadius + 0.2 * knobRadius;
    
    // Red background circle
    c.beginPath();
    c.arc(closeIconX, closeIconY, closeIconRadius, 0, 2 * Math.PI);
    c.fillStyle = `hsla(0, 70%, 40%, ${drawMenuOpacity})`;
    c.fill();
    
    // Black X
    c.strokeStyle = `hsla(0, 0%, 0%, ${drawMenuOpacity})`;
    c.lineWidth = 0.05 * knobRadius;
    c.lineCap = 'round';
    const xSize = closeIconRadius * 0.4;
    c.beginPath();
    c.moveTo(closeIconX - xSize, closeIconY - xSize);
    c.lineTo(closeIconX + xSize, closeIconY + xSize);
    c.moveTo(closeIconX + xSize, closeIconY - xSize);
    c.lineTo(closeIconX - xSize, closeIconY + xSize);
    c.stroke();
    
    // Draw title
    c.fillStyle = `hsla(340, 80%, 80%, ${drawMenuOpacity})`;
    c.font = `bold ${0.05 * cScale}px verdana`;
    c.textAlign = 'center';
    c.fillText('DRAW', menuWidth / 2, -padding + 0.04 * cScale);
    
    // Grid layout: 3 columns, 2 rows (expandable)
    const menuTopMargin = 0.2 * knobRadius;
    const cols = 3;
    const cellWidth = knobSpacing;
    const cellHeight = knobSpacing;
    const gridStartY = menuTopMargin;
    
    // Draw magnet toggle button (row 0, col 0 - upper left)
    const magnetButtonRadius = 0.06 * cScale;
    const iconRadius = magnetButtonRadius;
    const magnetCol = 0;
    const magnetRow = 0;
    const magnetButtonX = magnetCol * cellWidth;
    const magnetButtonY = gridStartY;
    
    // Draw magnet icon, adapted from the code below:
    // only draw glow when magnet is active
    if (magnetActive) {
        poleGlowTicker += 0.05;
        if (poleGlowTicker > 2 * Math.PI) {
            poleGlowTicker = 0;
        }  

        const poleGlowAlpha = 0.6 * Math.abs(Math.sin(poleGlowTicker)) * drawMenuOpacity;
        const glowRadius = 0.4 * iconRadius + poleGlowAlpha * 0.8 * iconRadius + (magnetForce / 5) * 0.4 * iconRadius;
        var poleGlow = c.createRadialGradient(
            magnetButtonX - iconRadius, 
            magnetButtonY - 1.2 * iconRadius, 
            0, 
            magnetButtonX - iconRadius, 
            magnetButtonY - 1.2 * iconRadius, 
            glowRadius);
        poleGlow.addColorStop(0, `hsla(270, 0%, 70%, ${poleGlowAlpha})`);
        poleGlow.addColorStop(1, `hsla(270, 0%, 50%, 0.0)`);
        c.fillStyle = poleGlow;
        c.beginPath();
        c.arc(magnetButtonX - iconRadius, magnetButtonY - 1.2 * iconRadius, glowRadius, 0, 2 * Math.PI);
        c.fill();

        poleGlow = c.createRadialGradient(
            magnetButtonX + iconRadius, 
            magnetButtonY - 1.2 * iconRadius, 
            0, 
            magnetButtonX + iconRadius, 
            magnetButtonY - 1.2 * iconRadius, 
            glowRadius);
        poleGlow.addColorStop(0, `hsla(270, 0%, 70%, ${poleGlowAlpha})`);
        poleGlow.addColorStop(1, `hsla(270, 0%, 50%, 0.0)`);
        c.fillStyle = poleGlow;
        c.beginPath();
        c.arc(magnetButtonX + iconRadius, magnetButtonY - 1.2 * iconRadius, glowRadius, 0, 2 * Math.PI);
        c.fill();
    };

    // black base for poles and arc
    c.lineWidth = 25;
    // Left pole
    c.beginPath();
    c.moveTo(magnetButtonX - iconRadius, magnetButtonY - 0.9 * iconRadius);
    c.lineTo(magnetButtonX - iconRadius, magnetButtonY);
    c.strokeStyle = `hsla(0, 0%, 90%, ${drawMenuOpacity})`;
    c.lineCap = 'butt';
    c.stroke();
    // left pole tip
    c.beginPath();
    c.moveTo(magnetButtonX - iconRadius, magnetButtonY - 1.5 * iconRadius);
    c.lineTo(magnetButtonX - iconRadius, magnetButtonY - 0.9 * iconRadius);
    //c.stroke();
    // Right pole
    c.beginPath();
    c.moveTo(magnetButtonX + iconRadius, magnetButtonY - 0.9 * iconRadius);
    c.lineTo(magnetButtonX + iconRadius, magnetButtonY);
    c.stroke();
    // right pole tip
    c.beginPath();
    c.moveTo(magnetButtonX + iconRadius, magnetButtonY - 1.5 * iconRadius);
    c.lineTo(magnetButtonX + iconRadius, magnetButtonY - 0.9 * iconRadius);
    //c.stroke();
    // Arc connecting poles
    c.beginPath();
    c.arc(magnetButtonX, magnetButtonY, iconRadius, Math.PI, 0, true);
    c.stroke();

    // colored overlay for poles and arc
    c.lineWidth = 22;
    const grau = `hsla(0, 0%, 50%, ${drawMenuOpacity})`;
    const lichtgrau = `hsla(0, 0%, 80%, ${drawMenuOpacity})`;
    const rott = `hsla(0, 85%, 40%, ${drawMenuOpacity})`;
    // Left pole
    c.beginPath();
    c.moveTo(magnetButtonX - iconRadius, magnetButtonY - 0.85 * iconRadius);
    c.lineTo(magnetButtonX - iconRadius, magnetButtonY + 0.1 * iconRadius);
    c.strokeStyle = rott;
    c.stroke();
    // left pole tip
    c.beginPath();
    c.moveTo(magnetButtonX - iconRadius, magnetButtonY - 1.5 * iconRadius);
    c.lineTo(magnetButtonX - iconRadius, magnetButtonY - 0.9 * iconRadius);
    c.strokeStyle = lichtgrau;
    c.stroke();
    
    // Right pole
    c.beginPath();
    c.moveTo(magnetButtonX + iconRadius, magnetButtonY - 0.85 * iconRadius);
    c.lineTo(magnetButtonX + iconRadius, magnetButtonY + 0.1 * iconRadius);
    c.strokeStyle = rott;
    c.stroke();
    // right pole tip
    c.beginPath();
    c.moveTo(magnetButtonX + iconRadius, magnetButtonY - 1.5 * iconRadius);
    c.lineTo(magnetButtonX + iconRadius, magnetButtonY - 0.9 * iconRadius);
    c.strokeStyle = lichtgrau;
    c.stroke();
    // Arc connecting poles
    c.beginPath();
    c.arc(magnetButtonX, magnetButtonY, iconRadius, Math.PI, 0, true);
    c.strokeStyle = rott;
    c.stroke();

    // + - force level indicators
    c.fillStyle = `hsla(0, 0%, 0%, ${drawMenuOpacity})`;
    c.textBaseline = 'middle';
    c.textAlign = "center";
    c.font = `13px verdana`;
    // minus sign on left side
    c.fillText("-", magnetButtonX - iconRadius - 0.01 * iconRadius, magnetButtonY - 1.18 * iconRadius);
    // plus sign on right side
    c.fillText("+", magnetButtonX + iconRadius + 0.01 * iconRadius, magnetButtonY - 1.18 * iconRadius);

    // draw force level indicator dot gauge along the bottom U of the magnget
    const gaugeRadius = 3;
    const gaugeSteps = 10;
    // draw gauge dots in an arc centered on the U-bend
    for (let i = 0; i < gaugeSteps; i++) {
        const t = i / (gaugeSteps - 1);
        const angle = Math.PI - t * Math.PI;
        const dotX = magnetButtonX + (iconRadius - 0.02 * iconRadius) * Math.cos(angle);
        const dotY = magnetButtonY + (iconRadius - 0.02 * iconRadius) * Math.sin(angle);
        c.beginPath();
        c.arc(dotX, dotY, gaugeRadius, 0, 2 * Math.PI);
        if (i < 0.5 * magnetForce) {
            if (magnetForce < 1) {
                c.fillStyle = `hsla(0, 0%, ${magnetForce * 100}%, ${drawMenuOpacity})`;
            } else {
                c.fillStyle = `hsla(0, 0%, 100%, ${drawMenuOpacity})`;
            }
        } else {
            c.fillStyle = `hsla(0, 100%, 50%, ${drawMenuOpacity})`;
        }
        c.fill();
    }
    
    // Draw label
    c.fillStyle = `hsla(340, 70%, 90%, ${drawMenuOpacity})`;
    c.font = `${0.028 * cScale}px verdana`;
    c.textAlign = 'center';
    c.fillText('Magnet on/off', magnetButtonX, magnetButtonY + magnetButtonRadius + 0.07 * cScale);
    
    // Draw Pull Strength knob (row 0, col 1)
    const pullKnobCol = 1;
    const pullKnobRow = 0;
    const pullKnobX = pullKnobCol * cellWidth;
    const pullKnobY = gridStartY + pullKnobRow * cellHeight;
    const fullMeterSweep = 1.6 * Math.PI;
    const meterStart = 0.5 * Math.PI + 0.5 * (2 * Math.PI - fullMeterSweep);
    
    // Knob background
    c.beginPath();
    c.arc(pullKnobX, pullKnobY, 1.05 * knobRadius, 0, 2 * Math.PI, false);
    c.fillStyle = `hsla(340, 40%, 15%, ${0.9 * drawMenuOpacity})`;
    c.fill();
    c.strokeStyle = `hsla(340, 40%, 50%, ${drawMenuOpacity})`;
    c.lineWidth = 0.003 * cScale;
    c.stroke();
    
    // Calculate normalized value
    const pullMin = 1;
    const pullMax = 20;
    const pullNormalizedValue = (magnetForce - pullMin) / (pullMax - pullMin);
    
    // Draw meter arc
    const pullGradient = c.createLinearGradient(
        pullKnobX + Math.cos(meterStart) * knobRadius,
        pullKnobY + Math.sin(meterStart) * knobRadius,
        pullKnobX + Math.cos(meterStart + fullMeterSweep) * knobRadius,
        pullKnobY + Math.sin(meterStart + fullMeterSweep) * knobRadius
    );
    pullGradient.addColorStop(0, `hsla(340, 40%, 50%, ${drawMenuOpacity})`);
    pullGradient.addColorStop(0.5, `hsla(340, 40%, 60%, ${drawMenuOpacity})`);
    c.strokeStyle = pullGradient;
    c.beginPath();
    c.arc(pullKnobX, pullKnobY, knobRadius * 0.85, meterStart, meterStart + fullMeterSweep * pullNormalizedValue);
    c.lineWidth = 0.02 * cScale;
    c.stroke();
    
    // Draw needle
    const pullPointerAngle = meterStart + fullMeterSweep * pullNormalizedValue;
    const pullPointerLength = knobRadius * 0.6;
    const pullPointerEndX = pullKnobX + Math.cos(pullPointerAngle) * pullPointerLength;
    const pullPointerEndY = pullKnobY + Math.sin(pullPointerAngle) * pullPointerLength;
    c.beginPath();
    c.moveTo(pullKnobX, pullKnobY);
    c.lineTo(pullPointerEndX, pullPointerEndY);
    c.strokeStyle = `hsla(340, 80%, 80%, ${drawMenuOpacity})`;
    c.lineWidth = 0.008 * cScale;
    c.stroke();
    
    // Draw knob label (with shadow)
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.lineWidth = 0.03 * knobRadius;
    c.lineJoin = 'round';
    c.font = `${0.29 * knobRadius}px verdana`;
    c.strokeStyle = `hsla(340, 80%, 0%, ${0.6 * drawMenuOpacity})`;
    c.strokeText('Pull Strength', 0.04 * knobRadius + pullKnobX, 0.04 * knobRadius + (pullKnobY + 1.35 * knobRadius));
    c.fillStyle = `hsla(340, 80%, 95%, ${drawMenuOpacity})`;
    c.fillText('Pull Strength', pullKnobX, pullKnobY + 1.35 * knobRadius);
    
    // Draw knob value (inside knob)
    c.font = `${0.25 * knobRadius}px verdana`;
    c.fillStyle = `hsla(40, 80%, 70%, ${drawMenuOpacity})`;
    c.fillText(magnetForce.toFixed(1), pullKnobX, pullKnobY + 0.6 * knobRadius);
    
    // Draw Effect Radius knob (row 0, col 2)
    const radiusKnobCol = 2;
    const radiusKnobRow = 0;
    const radiusKnobX = radiusKnobCol * cellWidth;
    const radiusKnobY = gridStartY + radiusKnobRow * cellHeight;
    
    // Knob background
    c.beginPath();
    c.arc(radiusKnobX, radiusKnobY, 1.05 * knobRadius, 0, 2 * Math.PI, false);
    c.fillStyle = `hsla(340, 40%, 15%, ${0.9 * drawMenuOpacity})`;
    c.fill();
    c.strokeStyle = `hsla(340, 40%, 50%, ${drawMenuOpacity})`;
    c.lineWidth = 0.003 * cScale;
    c.stroke();
    
    // Calculate normalized value
    const radiusMin = 0.01;
    const radiusMax = 1.0;
    const radiusNormalizedValue = (magnetEffectRadius - radiusMin) / (radiusMax - radiusMin);
    
    // Draw meter arc
    const radiusGradient = c.createLinearGradient(
        radiusKnobX + Math.cos(meterStart) * knobRadius,
        radiusKnobY + Math.sin(meterStart) * knobRadius,
        radiusKnobX + Math.cos(meterStart + fullMeterSweep) * knobRadius,
        radiusKnobY + Math.sin(meterStart + fullMeterSweep) * knobRadius
    );
    radiusGradient.addColorStop(0, `hsla(340, 40%, 50%, ${drawMenuOpacity})`);
    radiusGradient.addColorStop(0.5, `hsla(340, 40%, 60%, ${drawMenuOpacity})`);
    c.strokeStyle = radiusGradient;
    c.beginPath();
    c.arc(radiusKnobX, radiusKnobY, knobRadius * 0.85, meterStart, meterStart + fullMeterSweep * radiusNormalizedValue);
    c.lineWidth = 0.02 * cScale;
    c.lineCap = 'round';
    c.stroke();
    c.lineCap = 'butt';
    
    // Draw needle
    const radiusPointerAngle = meterStart + fullMeterSweep * radiusNormalizedValue;
    const radiusPointerLength = knobRadius * 0.6;
    const radiusPointerEndX = radiusKnobX + Math.cos(radiusPointerAngle) * radiusPointerLength;
    const radiusPointerEndY = radiusKnobY + Math.sin(radiusPointerAngle) * radiusPointerLength;
    c.beginPath();
    c.moveTo(radiusKnobX, radiusKnobY);
    c.lineTo(radiusPointerEndX, radiusPointerEndY);
    c.strokeStyle = `hsla(340, 80%, 80%, ${drawMenuOpacity})`;
    c.lineWidth = 0.008 * cScale;
    c.stroke();
    
    // Draw knob label (with shadow)
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.lineWidth = 0.03 * knobRadius;
    c.lineJoin = 'round';
    c.font = `${0.29 * knobRadius}px verdana`;
    c.strokeStyle = `hsla(340, 80%, 0%, ${0.6 * drawMenuOpacity})`;
    c.strokeText('Effect Radius', 0.04 * knobRadius + radiusKnobX, 0.04 * knobRadius + (radiusKnobY + 1.35 * knobRadius));
    c.fillStyle = `hsla(340, 80%, 95%, ${drawMenuOpacity})`;
    c.fillText('Effect Radius', radiusKnobX, radiusKnobY + 1.35 * knobRadius);
    
    // Draw knob value (inside knob)
    c.font = `${0.25 * knobRadius}px verdana`;
    c.fillStyle = `hsla(40, 80%, 70%, ${drawMenuOpacity})`;
    c.fillText(magnetEffectRadius.toFixed(2), radiusKnobX, radiusKnobY + 0.6 * knobRadius);
    
    // Draw Trace Path icon (row 1, col 0)
    const traceCol = 0;
    const traceRow = 1;
    const traceX = traceCol * cellWidth;
    const traceY = gridStartY + traceRow * cellHeight;
    const traceIconSize = 1.2 * knobRadius;
    
    // Draw pencil icon (same proportions as main menu)
    const pencilLength = traceIconSize * 1.5;
    const pencilWidth = traceIconSize * 0.45;
    const tipHeight = traceIconSize * 0.45;
    
    c.save();
    c.translate(traceX, traceY);
    c.rotate(-Math.PI / 4); // Rotate 45 degrees
    
    // Draw wooden body
    c.fillStyle = `hsla(30, 60%, 55%, ${drawMenuOpacity})`;
    c.beginPath();
    c.rect(-pencilWidth / 2, -pencilLength / 2 + tipHeight, pencilWidth, pencilLength - tipHeight);
    c.fill();
    
    // Draw graphite tip
    c.fillStyle = `hsla(0, 0%, 50%, ${drawMenuOpacity})`;
    c.beginPath();
    c.moveTo(0, -pencilLength / 2);
    c.lineTo(-pencilWidth / 2, -pencilLength / 2 + tipHeight);
    c.lineTo(pencilWidth / 2, -pencilLength / 2 + tipHeight);
    c.closePath();
    c.fill();
    
    // Draw tiny black tip at the very end
    c.fillStyle = `hsla(0, 0%, 0%, ${drawMenuOpacity})`;
    c.beginPath();
    c.moveTo(0, -pencilLength / 2);
    c.lineTo(-pencilWidth / 6, -pencilLength / 2 + tipHeight * 0.3);
    c.lineTo(pencilWidth / 6, -pencilLength / 2 + tipHeight * 0.3);
    c.closePath();
    c.fill();
    
    // Draw eraser
    c.fillStyle = `hsla(340, 70%, 60%, ${drawMenuOpacity})`;
    c.beginPath();
    c.rect(-pencilWidth / 2, pencilLength / 2 - traceIconSize * 0.08, pencilWidth, traceIconSize * 0.2);
    c.fill();
    
    // Draw metal band
    c.fillStyle = `hsla(0, 0%, 70%, ${drawMenuOpacity})`;
    c.beginPath();
    c.rect(-pencilWidth / 2, pencilLength / 2 - traceIconSize * 0.24, pencilWidth, traceIconSize * 0.1);
    c.fill();
    
    c.restore();
    
    // Draw label
    c.textAlign = 'center';
    c.fillStyle = `hsla(340, 70%, 90%, ${drawMenuOpacity})`;
    c.font = `${0.029 * cScale}px verdana`;
    c.strokeStyle = `hsla(340, 80%, 0%, ${0.6 * drawMenuOpacity})`;
    c.strokeText('Trace Path', 0.04 * knobRadius + traceX, 0.04 * knobRadius + (traceY + 1.35 * knobRadius));
    c.fillStyle = `hsla(340, 80%, 95%, ${drawMenuOpacity})`;
    c.fillText('Trace Path', traceX, traceY + 1.35 * knobRadius);

    // Draw Path Speed knob (row 1, col 1)
    const speedKnobCol = 1;
    const speedKnobRow = 1;
    const speedKnobX = speedKnobCol * cellWidth;
    const speedKnobY = gridStartY + speedKnobRow * cellHeight;
    
    // Knob background
    c.beginPath();
    c.arc(speedKnobX, speedKnobY, 1.05 * knobRadius, 0, 2 * Math.PI, false);
    c.fillStyle = `hsla(340, 40%, 15%, ${0.9 * drawMenuOpacity})`;
    c.fill();
    c.strokeStyle = `hsla(340, 40%, 50%, ${drawMenuOpacity})`;
    c.lineWidth = 0.003 * cScale;
    c.stroke();
    
    // Calculate normalized value
    const speedMin = -3;
    const speedMax = 3;
    
    // Draw meter arc from 12 o'clock (top)
    const topAngle = -Math.PI / 2; // 12 o'clock position
    const halfSweep = 0.8 * Math.PI; // Half of fullMeterSweep (1.6 * Math.PI / 2)
    
    if (magnetPathSpeed >= 0) {
        // Positive speed: arc extends clockwise from 12 o'clock
        const speedNormalizedValue = magnetPathSpeed / speedMax;
        const arcSweep = speedNormalizedValue * halfSweep;
        
        const speedGradient = c.createLinearGradient(
            speedKnobX + Math.cos(topAngle) * knobRadius,
            speedKnobY + Math.sin(topAngle) * knobRadius,
            speedKnobX + Math.cos(topAngle + arcSweep) * knobRadius,
            speedKnobY + Math.sin(topAngle + arcSweep) * knobRadius
        );
        speedGradient.addColorStop(0, `hsla(340, 40%, 50%, ${drawMenuOpacity})`);
        speedGradient.addColorStop(1, `hsla(340, 40%, 60%, ${drawMenuOpacity})`);
        c.strokeStyle = speedGradient;
        c.beginPath();
        c.arc(speedKnobX, speedKnobY, knobRadius * 0.85, topAngle, topAngle + arcSweep);
        c.lineWidth = 0.02 * cScale;
        c.stroke();
        
        // Draw needle
        const speedPointerAngle = topAngle + arcSweep;
        const speedPointerLength = knobRadius * 0.6;
        const speedPointerEndX = speedKnobX + Math.cos(speedPointerAngle) * speedPointerLength;
        const speedPointerEndY = speedKnobY + Math.sin(speedPointerAngle) * speedPointerLength;
        c.beginPath();
        c.moveTo(speedKnobX, speedKnobY);
        c.lineTo(speedPointerEndX, speedPointerEndY);
        c.strokeStyle = `hsla(340, 80%, 80%, ${drawMenuOpacity})`;
        c.lineWidth = 0.008 * cScale;
        c.stroke();
    } else {
        // Negative speed: arc extends counterclockwise from 12 o'clock
        const speedNormalizedValue = -magnetPathSpeed / speedMax;
        const arcSweep = speedNormalizedValue * halfSweep;
        
        const speedGradient = c.createLinearGradient(
            speedKnobX + Math.cos(topAngle) * knobRadius,
            speedKnobY + Math.sin(topAngle) * knobRadius,
            speedKnobX + Math.cos(topAngle - arcSweep) * knobRadius,
            speedKnobY + Math.sin(topAngle - arcSweep) * knobRadius
        );
        speedGradient.addColorStop(0, `hsla(340, 40%, 50%, ${drawMenuOpacity})`);
        speedGradient.addColorStop(1, `hsla(340, 40%, 60%, ${drawMenuOpacity})`);
        c.strokeStyle = speedGradient;
        c.beginPath();
        c.arc(speedKnobX, speedKnobY, knobRadius * 0.85, topAngle - arcSweep, topAngle);
        c.lineWidth = 0.02 * cScale;
        c.stroke();
        
        // Draw needle
        const speedPointerAngle = topAngle - arcSweep;
        const speedPointerLength = knobRadius * 0.6;
        const speedPointerEndX = speedKnobX + Math.cos(speedPointerAngle) * speedPointerLength;
        const speedPointerEndY = speedKnobY + Math.sin(speedPointerAngle) * speedPointerLength;
        c.beginPath();
        c.moveTo(speedKnobX, speedKnobY);
        c.lineTo(speedPointerEndX, speedPointerEndY);
        c.strokeStyle = `hsla(340, 80%, 80%, ${drawMenuOpacity})`;
        c.lineWidth = 0.008 * cScale;
        c.stroke();
    }
    
    // Draw knob label (with shadow)
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.lineWidth = 0.03 * knobRadius;
    c.lineJoin = 'round';
    c.font = `${0.29 * knobRadius}px verdana`;
    c.strokeStyle = `hsla(340, 80%, 0%, ${0.6 * drawMenuOpacity})`;
    c.strokeText('Path Speed', 0.04 * knobRadius + speedKnobX, 0.04 * knobRadius + (speedKnobY + 1.35 * knobRadius));
    c.fillStyle = `hsla(340, 80%, 95%, ${drawMenuOpacity})`;
    c.fillText('Path Speed', speedKnobX, speedKnobY + 1.35 * knobRadius);
    
    // Draw knob value (inside knob)
    c.font = `${0.25 * knobRadius}px verdana`;
    c.fillStyle = `hsla(40, 80%, 70%, ${drawMenuOpacity})`;
    c.fillText(magnetPathSpeed.toFixed(1), speedKnobX, speedKnobY + 0.6 * knobRadius);
    
    // Draw Wand icon (row 1, col 2)
    const wandCol = 2;
    const wandRow = 1;
    var wandIconX = wandCol * cellWidth - 0.35 * knobRadius;
    var wandIconY = gridStartY + wandRow * cellHeight - 0.3 * knobRadius;
    const wandIconSize = 1.8 * knobRadius;
    
    c.save();
    c.translate(wandIconX, wandIconY);
    
    // Draw a smaller version of the wand
    const iconWandLength = wandIconSize * 0.8;
    const iconWandWidth = wandIconSize * 0.05;
    const iconWandAngle = 0.25 * Math.PI; 
    
    c.rotate(iconWandAngle);
    
    // Draw black wand shaft background
    c.fillStyle = `hsla(0, 0%, 0%, ${drawMenuOpacity})`;
    c.fillRect(0, -2 * iconWandWidth / 2, iconWandLength, 2 * iconWandWidth);
    
    // Draw black end background
    c.beginPath();
    c.arc(iconWandLength, 0, iconWandWidth * 2.0, 0, Math.PI * 2);
    c.fill();
    
    // Draw red wand shaft
    c.fillStyle = `hsla(0, 70%, 50%, ${drawMenuOpacity})`;
    c.fillRect(0, -iconWandWidth / 2, iconWandLength, iconWandWidth);
    
    // Draw red end
    c.beginPath();
    c.arc(iconWandLength, 0, iconWandWidth * 1.5, 0, Math.PI * 2);
    c.fill();
    
    // Move to star position
    c.translate(iconWandLength * -0.1, 0);
    
    // Draw star (simplified)
    c.lineWidth = iconWandWidth * 0.5;
    for (let i = 0; i < 5; i++) {
        const angle = (i * (2 * Math.PI / 5) - Math.PI / 2 - 0.25 * iconWandAngle);
        const x = Math.cos(angle) * iconWandLength * 0.2;
        const y = Math.sin(angle) * iconWandLength * 0.2;
        const innerAngle = (angle + Math.PI / 5);
        const innerX = Math.cos(innerAngle) * iconWandLength * 0.1;
        const innerY = Math.sin(innerAngle) * iconWandLength * 0.1;
        
        const nextAngle = ((i + 1) * (2 * Math.PI / 5) - Math.PI / 2 - 0.25 * iconWandAngle);
        const nextX = Math.cos(nextAngle) * iconWandLength * 0.2;
        const nextY = Math.sin(nextAngle) * iconWandLength * 0.2;
        
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(innerX, innerY);
        c.lineTo(nextX, nextY);
        c.strokeStyle = `hsl(${45 * (i / 5) + 25}, 100%, 50%, ${drawMenuOpacity})`;
        c.stroke();
    }
    
    // Draw sparkles when wand is active - tiny white pixels moving outward
    if (wandActive) {
        const time = Date.now() / 1000;
        const numSparkles = 12;
        
        c.fillStyle = `hsla(0, 0%, 100%, ${drawMenuOpacity})`;
        
        for (let i = 0; i < numSparkles; i++) {
            const sparkleAngle = (i * 13.7 + i * i * 0.3) + time * 0.5;
            const sparkleProgress = ((time * 2 + i * 0.5) % 2) / 2; // 0 to 1 cycle
            const sparkleRadius = sparkleProgress * iconWandLength * 0.6;
            const sparkleX = Math.cos(sparkleAngle) * sparkleRadius;
            const sparkleY = Math.sin(sparkleAngle) * sparkleRadius;
            const sparkleAlpha = (1 - sparkleProgress) * drawMenuOpacity;
            
            c.fillStyle = `hsla(0, 0%, 100%, ${sparkleAlpha})`;
            c.fillRect(sparkleX - iconWandWidth * 0.3, sparkleY - iconWandWidth * 0.3, iconWandWidth * 0.6, iconWandWidth * 0.6);
        }
    }
    
    c.restore();
    wandIconX = wandCol * cellWidth;
    wandIconY = gridStartY + wandRow * cellHeight;
    // Draw label
    c.textAlign = 'center';
    c.fillStyle = `hsla(340, 70%, 90%, ${drawMenuOpacity})`;
    c.font = `${0.029 * cScale}px verdana`;
    c.strokeStyle = `hsla(340, 80%, 0%, ${0.6 * drawMenuOpacity})`;
    c.strokeText('Make Boids', 0.04 * knobRadius + wandIconX, 0.04 * knobRadius + (wandIconY + 1.35 * knobRadius));
    c.fillStyle = `hsla(340, 80%, 95%, ${drawMenuOpacity})`;
    c.fillText('Make Boids', wandIconX, wandIconY + 1.35 * knobRadius);
    
    c.restore();
}

function drawKittyLamp(lampX, lampY, menuOpacity) {
    // Draw kitty lamp last (on top of everything)
    if (kittyLampImage && kittyLampImage.complete) {
        const targetHeight = simHeight * 0.22 * cScale; // Size in canvas pixels
        const aspectRatio = kittyLampImage.width / kittyLampImage.height;
        const lampWidth = targetHeight * aspectRatio;
        const lampHeight = targetHeight;
        //const lampX = 0.5 * canvas.width; // Bottom right in canvas coords
        //const lampY = canvas.height - 0.5 * lampHeight;
        
        c.save();
        //c.rotate(-0.2); // Slight tilt for effect
        c.globalAlpha = 0.8 * menuOpacity;
        c.drawImage(
            kittyLampImage,
            lampX - lampWidth / 2,
            lampY - lampHeight / 2,
            lampWidth,
            lampHeight
        );
        c.restore();
    } else if (kittyLampImage) {
        // Debug: show if image is still loading
        console.log('Kitty lamp image loading...', kittyLampImage.complete, kittyLampImage.src);
    }
}

// Main animation loop  ------------
function simulateEverything() {
    // Update main menu opacity and animation for fade in/out and slide (hide when sky camera is active)
    if (mainMenuVisible && !skyHandActive) {
        if (mainMenuOpacity < 1) {
            mainMenuOpacity = Math.min(1, mainMenuOpacity + mainMenuFadeSpeed * deltaT);
        }
        // Slide right (from negative offset to 0)
        if (mainMenuXOffset < 0) {
            mainMenuXOffset = Math.min(0, mainMenuXOffset + mainMenuAnimSpeed * deltaT);
        }
    } else {
        if (mainMenuOpacity > 0) {
            mainMenuOpacity = Math.max(0, mainMenuOpacity - mainMenuFadeSpeed * deltaT);
        }
        // Slide left (from 0 to negative offset)
        if (mainMenuXOffset > -1.0) {
            mainMenuXOffset = Math.max(-1.0, mainMenuXOffset - mainMenuAnimSpeed * deltaT);
        }
    }
    
    // Update menu opacity for fade in/out (hide when sky camera is active)
    if (menuVisible && menuOpacity < 1 && !skyHandActive) {
        menuOpacity = Math.min(1, menuOpacity + menuFadeSpeed * deltaT);
    } else if ((!menuVisible || skyHandActive) && menuOpacity > 0) {
        menuOpacity = Math.max(0, menuOpacity - menuFadeSpeed * deltaT);
    }
    
    // Update color menu opacity for fade in/out (hide when sky camera is active)
    if (colorMenuVisible && colorMenuOpacity < 1 && !skyHandActive) {
        colorMenuOpacity = Math.min(1, colorMenuOpacity + menuFadeSpeed * deltaT);
    } else if ((!colorMenuVisible || skyHandActive) && colorMenuOpacity > 0) {
        colorMenuOpacity = Math.max(0, colorMenuOpacity - menuFadeSpeed * deltaT);
    }
    
    // Animate color menu height when spray tool is toggled
    const knobRadius = 0.1 * cScale;
    const spacing = knobRadius * 0.5;
    const targetHeight = spraypaintActive ? spacing * 7 : spacing * 20;
    const heightTransitionSpeed = 15; // Speed of height transition
    if (Math.abs(colorMenuAnimatedHeight - targetHeight) > 0.1) {
        const heightDelta = (targetHeight - colorMenuAnimatedHeight) * heightTransitionSpeed * deltaT;
        colorMenuAnimatedHeight += heightDelta;
    } else {
        colorMenuAnimatedHeight = targetHeight;
    }
    
    // Update sky menu opacity for fade in/out
    if (skyMenuVisible && skyMenuOpacity < 1) {
        skyMenuOpacity = Math.min(1, skyMenuOpacity + menuFadeSpeed * deltaT);
    } else if (!skyMenuVisible && skyMenuOpacity > 0) {
        skyMenuOpacity = Math.max(0, skyMenuOpacity - menuFadeSpeed * deltaT);
    }
    
    // Update draw menu opacity for fade in/out (hide when spray tool is active)
    if (drawMenuVisible && drawMenuOpacity < 1 && !spraypaintActive) {
        drawMenuOpacity = Math.min(1, drawMenuOpacity + menuFadeSpeed * deltaT);
    } else if ((!drawMenuVisible || spraypaintActive) && drawMenuOpacity > 0) {
        drawMenuOpacity = Math.max(0, drawMenuOpacity - menuFadeSpeed * deltaT);
    }
    
    // Update auto elevation if enabled
    if (autoElevation && window.skyRenderer) {
        autoElevationPhase += deltaT * autoElevationRate;
        const skyCtrl = window.skyRenderer.effectController;
        // Oscillate between (initial - 1) and (initial + 3)
        const center = autoElevationInitial + 1; // Center point
        const amplitude = 2; // Half of the 4-unit range
        skyCtrl.elevation = center + amplitude * Math.sin(autoElevationPhase);
    }
    
    // Update spray particles
    for (let i = sprayParticles.length - 1; i >= 0; i--) {
        if (!sprayParticles[i].update(deltaT)) {
            sprayParticles.splice(i, 1); // Remove dead particles
        }
    }
    
    // Generate idle spray particles when spray tool is active but not painting
    if (spraypaintActive && !isSpraying) {
        const idleParticlesPerFrame = 0.5; // Generate less frequently
        for (let i = 0; i < idleParticlesPerFrame; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * (spraypaintRadius / 3); // Limit to third of normal radius
            const px = mouseX + Math.cos(angle) * distance;
            const py = mouseY + Math.sin(angle) * distance;
            sprayParticles.push(new SprayParticle(px, py, selectedHue, selectedSaturation, selectedLightness));
        }
    }
    
    // Draw hot air balloon 
    for (let hotAirBalloon of HotAirBalloon) {
        hotAirBalloon.simulate();
    }

    // Update background clouds
    for (let i = BackgroundClouds.length - 1; i >= 0; i--) {
        const cloud = BackgroundClouds[i];
        cloud.update(deltaT);
        
        // Check if cloud has moved off-screen to the left (account for visual size)
        // Clouds are rendered ~3x larger than their radius
        if (cloud.x + cloud.radius * 2 < 0) {
            // Remove this cloud and spawn a new one on the right
            BackgroundClouds.splice(i, 1);
            const newY = findSafeCloudAltitude(true, [...BackgroundClouds, ...Clouds]);
            BackgroundClouds.push(new CLOUD(simWidth + cloud.radius * 2, newY, true));
        }
    }
    
    // Update foreground clouds
    for (let i = Clouds.length - 1; i >= 0; i--) {
        const cloud = Clouds[i];
        cloud.update(deltaT);
        
        // Check if cloud has moved off-screen to the left (account for visual size)
        // Clouds are rendered ~3x larger than their radius
        if (cloud.x + cloud.radius * 2 < 0) {
            // Remove this cloud and spawn a new one on the right
            Clouds.splice(i, 1);
            const newY = findSafeCloudAltitude(false, [...BackgroundClouds, ...Clouds, ...ForegroundCloud]);
            Clouds.push(new CLOUD(simWidth + cloud.radius * 2, newY, false, false));
        }
    }
    
    // Update foreground (non-interactive) clouds
    for (let i = ForegroundCloud.length - 1; i >= 0; i--) {
        const cloud = ForegroundCloud[i];
        cloud.update(deltaT);
        
        // Check if cloud has moved off-screen to the left
        if (cloud.x + cloud.radius * 2 < 0) {
            // Remove this cloud and spawn a new one on the right
            ForegroundCloud.splice(i, 1);
            initialForegroundCloudTextVisible = false; // Text only on first cloud
            const newY = findSafeCloudAltitude(false, [...BackgroundClouds, ...Clouds, ...ForegroundCloud]);
            if (Math.random() < 0.1) { // 10% chance of rain
                var raining = true;
            } else {
                var raining = false;
            }
            ForegroundCloud.push(new CLOUD(simWidth + cloud.radius * 2, newY, false, true, raining));
        }
    }
    
    // Trigger blackBoid flash periodically
    boidProps.blackBoidFlashTimer += deltaT;
    if (boidProps.blackBoidFlashTimer >= boidProps.blackBoidFlashInterval) {
        // Find the blackBoid and check if it's in the central 25% of screen
        for (let boid of Boids) {
            if (boid.blackBoid) {
                // Check if blackBoid is within central 25% of screen
                const centerMinX = simWidth * 0.375;
                const centerMaxX = simWidth * 0.625;
                const centerMinY = simHeight * 0.375;
                const centerMaxY = simHeight * 0.625;
                
                if (boid.pos.x >= centerMinX && boid.pos.x <= centerMaxX &&
                    boid.pos.y >= centerMinY && boid.pos.y <= centerMaxY) {
                    // BlackBoid is in central area, trigger flash
                    boidProps.blackBoidFlashTimer = 0; // Reset timer
                    boidProps.currentFlashCycle++; // Start a new flash cycle
                    boid.flashing = true;
                    boid.flashTimer = 0;
                    boid.lastFlashCycle = boidProps.currentFlashCycle;
                }
                // If not in center, timer stays at max and waits for blackBoid to enter center
                break;
            }
        }
    }
    
    // Update boids
    for (var i = 0; i < Boids.length; i++) {
        var boid = Boids[i];
        handleFlashing(boid);
        handleBoidRules(boid);
        handleClouds(boid);
        handleMagnet(boid);
        handleBounds(boid);
        boid.simulate();
        
        // Update spatial grid position incrementally
        SpatialGrid.updateBoid(boid);
    }
    
    // Check if all boids have been dyed - if so, remove dyedBoid flag from original
    let dyedBoidExists = false;
    let allBoidsColored = true;
    let dyeColor = null;
    
    for (let i = 0; i < Boids.length; i++) {
        if (Boids[i].dyedBoid) {
            dyedBoidExists = true;
            dyeColor = {
                hue: Boids[i].hue,
                saturation: Boids[i].saturation,
                lightness: Boids[i].lightness
            };
            break;
        }
    }
    
    if (dyedBoidExists && dyeColor) {
        // Check if all boids have the same color as the dyed boid
        for (let i = 0; i < Boids.length; i++) {
            const boid = Boids[i];
            if (Math.abs(boid.hue - dyeColor.hue) > 1 || 
                Math.abs(boid.saturation - dyeColor.saturation) > 1 || 
                Math.abs(boid.lightness - dyeColor.lightness) > 1) {
                allBoidsColored = false;
                break;
            }
        }
        
        // If all boids have been colored, remove dyedBoid flag
        if (allBoidsColored) {
            for (let i = 0; i < Boids.length; i++) {
                Boids[i].dyedBoid = false;
            }
        }
    }

    // Update balloon ---------
    // Handle spacebar rapid spawning
    if (spacebarHeld) {
        spacebarBalloonTimer += deltaT;
        if (spacebarBalloonTimer >= spacebarBalloonInterval) {
            spawnBalloon();
            spacebarBalloonTimer = 0;
        }
    } else {
        // Normal timer-based spawning
        // Timer starts at -initialDelay, reaches 0 after initialDelay time
        // After each spawn, resets to -spawnInterval
        balloonSpawnTimer += deltaT;
        
        if (balloonSpawnTimer >= 0) {
            spawnBalloon();
            balloonSpawnTimer = -balloonProps.balloonSpawnInterval;
        }
    }
    
    for (let balloon of Balloons) {
        balloon.simulate();
    }

    // Check balloon-airplane collisions
    if (doPlane && Airplane.length > 0 && Balloons.length > 0) {
        plane = Airplane[0];
        for (let balloon of Balloons) {
            if (!balloon.popping) {
                // Simple distance-based collision detection
                const dx = balloon.pos.x - plane.x;
                const dy = balloon.pos.y - plane.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const collisionDist = balloon.radius + plane.radius;
                
                if (dist < collisionDist) {
                    // Collision detected - pop the balloon
                    balloon.popping = true;
                    balloon.popStartTime = performance.now();
                    spookBoids(balloon.pos, 5 * balloon.radius);
                    
                    // Increase sadness of foreground clouds when balloons are popped
                    for (let cloud of ForegroundCloud) {
                        if (cloud.sadness < 10) {
                            cloud.sadness++;
                            cloud.renderToCanvas();
                        }
                    }
                }
            }
        }
    }

    // Update airplane
    if (doPlane == true) {
        for (let plane of Airplane) {
            plane.update(deltaT);
        }
    }

    // Update Rain --------
    for (let rainDrop of Rain) {
        rainDrop.simulate();
    }

    // Simulate Hearts
    for (let heart of Hearts) {
        heart.simulate();
    }

    // Update magnet position along traced path
    if (pathExists && pathPoints.length > 2 && magnetActive && Magnet.length > 0 && pathLength > 0) {
        // Move along the path at constant speed (world units per second)
        magnetPathProgress += -magnetPathSpeed * deltaT / pathLength;
        
        // Loop back to start (handle both positive and negative speeds)
        if (magnetPathProgress >= 1) {
            magnetPathProgress -= 1;
        } else if (magnetPathProgress < 0) {
            magnetPathProgress += 1;
        }
        
        // Convert progress (0-1) to actual distance along path
        const targetDistance = magnetPathProgress * pathLength;
        
        // Find which segment the magnet is on using binary search on cumulative distances
        let segmentIndex = 0;
        for (let i = 0; i < pathCumulativeDistances.length - 1; i++) {
            if (targetDistance >= pathCumulativeDistances[i] && targetDistance < pathCumulativeDistances[i + 1]) {
                segmentIndex = i;
                break;
            }
        }
        
        // Calculate interpolation factor within this segment
        const segmentStart = pathCumulativeDistances[segmentIndex];
        const segmentEnd = pathCumulativeDistances[segmentIndex + 1] || pathLength;
        const segmentLength = segmentEnd - segmentStart;
        const t = segmentLength > 0 ? (targetDistance - segmentStart) / segmentLength : 0;
        
        // Interpolate position within the segment
        const p1 = pathPoints[segmentIndex];
        const p2 = pathPoints[(segmentIndex + 1) % pathPoints.length];
        
        // Check if points are valid before accessing their properties
        if (p1 && p2) {
            Magnet[0].x = p1.x + (p2.x - p1.x) * t;
            Magnet[0].y = p1.y + (p2.y - p1.y) * t;
        }
    }
}

//  DRAW EVERYTHING  ------------
function drawEverything() {
    // Clear canvas
    c.clearRect(0, 0, width, height);
    //c.fillStyle = 'hsla(0, 0%, 0%, 0.1)';
    //c.fillRect(0, 0, width, height);

    // Draw traced path --------
    if ((tracePathActive || pathExists) && pathPoints.length > 0) {
        c.save();
        c.lineWidth = 2;
        c.lineCap = 'round';
        c.lineJoin = 'round';
        
        if (isDrawingPath) {
            // Drawing in progress - bright line
            c.strokeStyle = 'hsla(340, 70%, 60%, 0.8)';
            c.lineWidth = 3;
        } else {
            // Completed path - faint line
            c.strokeStyle = 'hsla(340, 70%, 60%, 0.3)';
            c.lineWidth = 8;
        }
        
        c.beginPath();
        c.moveTo(pathPoints[0].x * cScale, canvas.height - pathPoints[0].y * cScale);
        for (let i = 1; i < pathPoints.length; i++) {
            c.lineTo(pathPoints[i].x * cScale, canvas.height - pathPoints[i].y * cScale);
        }
        // Close the path
        if (!isDrawingPath) {
            c.closePath();
        }
        c.stroke();
        c.restore();
    }
    
    // Draw hot air balloon 
    if (showHotAirBalloon) {
        for (let hotAirBalloon of HotAirBalloon) {
            hotAirBalloon.draw();
        }
    }
    
    // Draw clouds --------
    if (showClouds) {
        // Draw background clouds
        for (let cloud of BackgroundClouds) {
            cloud.draw();
        }
        // Draw foreground clouds
        for (let cloud of Clouds) {
            cloud.draw();
        }
    }

    // Draw boids --------
    for (var b = 0; b < Boids.length; b++) {
        boid = Boids[b];
        
        // Draw dark circle under dyed boid for visibility
        if (boid.dyedBoid) {
            c.beginPath();
            c.arc(cX(boid.pos), cY(boid.pos), boidProps.visualRange * cScale, 0, 2 * Math.PI);
            //c.fillStyle = 'hsla(0, 0%, 0%, 0.3)';
            c.fillStyle = `hsla(${boid.hue}, ${boid.saturation}%, 30%, 0.3)`;
            c.fill();
            
            // Also draw a colored ring around it
            //c.beginPath();
            //c.arc(cX(boid.pos), cY(boid.pos), boidProps.visualRange * cScale * 0.95, 0, 2 * Math.PI);
            c.strokeStyle = `hsla(${boid.hue}, ${boid.saturation}%, ${boid.lightness}%, 0.6)`;
            c.lineWidth = 2;
            c.stroke();
        }

        boid.draw();
        
        // Draw spray particles emanating from dyed boid
        if (boid.dyedBoid) {
            // Spawn particles more frequently for better visibility
            if (Math.random() < 0.5) { // 50% chance per frame
                const angle = Math.random() * 2 * Math.PI;
                const distance = 0.01 + Math.random() * 0.02;
                const px = boid.pos.x + Math.cos(angle) * distance;
                const py = boid.pos.y + Math.sin(angle) * distance;
                sprayParticles.push(new SprayParticle(px, py, boid.hue, boid.saturation, boid.lightness));
            }
        }
        
        // Draw visual range circle for white and black boids when menu is active
        if (menuVisible && (boid.whiteBoid || boid.blackBoid)) {
            c.beginPath();
            c.arc(cX(boid.pos), cY(boid.pos), boidProps.visualRange * cScale, 0, 2 * Math.PI);
            c.strokeStyle = boid.whiteBoid ? 'hsla(0, 0%, 90%, 0.5)' : 'hsla(0, 0%, 10%, 0.5)';
            c.lineWidth = 2;
            c.stroke();
        }
    }
    
    // Draw airplane --------
    if (doPlane == true && showPlane) {
        // Draw airplane
        for (let plane of Airplane) {
            plane.draw();
        }
    }

    // Draw balloon ---------
    if (showBalloons) {
        for (let balloon of Balloons) {
            balloon.draw();
        }
    }
    
    // Draw Rain --------
    for (let rainDrop of Rain) {
        rainDrop.draw();
    }

    // Draw big foreground cloud (non-interactive) last --------
    if (showClouds) {
        for (let cloud of ForegroundCloud) {
            cloud.draw();
            if (cloud.isRaining) {
                // Rain intensity based on sadness (5 sadness = light rain, 10 sadness = full rain)
                // and cheerfulness (0% cheerful = full rain, 100% cheerful = no rain)
                let rainIntensity = 1.0; // Default to full rain
                if (cloud.sadness >= 5) {
                    // Sadness 5-10 maps to intensity 0.5-1.0
                    rainIntensity = 0.5 + ((cloud.sadness - 5) / 5) * 0.5;
                }
                // Reduce rain as cheerfulness increases
                const rainChance = rainIntensity * (1.0 - (cloud.cheerfulness / 100));
                if (Math.random() < rainChance) {
                    makeItRain(cloud);
                }
            }
        }
    }

    // Draw wand --------
    if (wandActive) {
        applyWand(wandPosX * simWidth, wandPosY * simHeight, wandAngle, wandSize);
    }

    // Draw spray particles --------
    for (let particle of sprayParticles) {
        particle.draw();
    }

    // Draw magnet --------
    if (magnetActive) {
        for (let magnet of Magnet) {
            magnet.draw();
        }
    }

    // Draw menus in z-order (lowest to highest so highest is on top) --------
    const menus = [
        {draw: drawSkyMenu, z: skyMenuZOrder},
        {draw: drawColorMenu, z: colorMenuZOrder},
        {draw: drawSimMenu, z: menuZOrder},
        {draw: drawDrawMenu, z: drawMenuZOrder}
    ];
    menus.sort((a, b) => a.z - b.z);
    for (let menu of menus) {
        menu.draw();
    }
    
    // Draw main menu on top of everything
    drawMainMenu();
    
    // Draw pencil cursor for drawing tool
    if (tracePathActive || isDrawingPath) {
        canvas.style.cursor = 'none';
        
        // Ensure lightweight listener is active for cursor tracking
        attachLightweightMouseMove();
        
        const cursorX = mouseX * cScale;
        const cursorY = canvas.height - mouseY * cScale;
        const pencilSize = 0.08 * cScale;
        
        c.save();
        c.translate(cursorX, cursorY);
        c.rotate(3 * Math.PI / 4); // Rotate 135 degrees (original 45 + 90 clockwise)
        c.translate(0, -pencilSize * 0.2); // Offset so tip is at cursor position
        
        // Pencil body (wooden part)
        c.fillStyle = 'hsla(30, 70%, 50%, 0.9)';
        c.strokeStyle = 'hsla(0, 0%, 0%, 0.9)';
        c.lineWidth = 0.002 * cScale;
        c.beginPath();
        c.rect(-pencilSize * 0.15, -pencilSize * 0.6, pencilSize * 0.3, pencilSize * 0.55);
        c.fill();
        c.stroke();
        
        // Pencil tip (graphite)
        c.fillStyle = 'hsla(0, 0%, 20%, 0.9)';
        c.beginPath();
        c.moveTo(0, pencilSize * 0.2);
        c.lineTo(-pencilSize * 0.15, -pencilSize * 0.05);
        c.lineTo(pencilSize * 0.15, -pencilSize * 0.05);
        c.closePath();
        c.fill();
        c.stroke();
        
        // Eraser
        c.fillStyle = 'hsla(340, 70%, 60%, 0.9)';
        c.beginPath();
        c.rect(-pencilSize * 0.15, -pencilSize * 0.75, pencilSize * 0.3, pencilSize * 0.15);
        c.fill();
        c.stroke();
        
        // Metal band
        c.fillStyle = 'hsla(40, 20%, 60%, 0.9)';
        c.beginPath();
        c.rect(-pencilSize * 0.15, -pencilSize * 0.6, pencilSize * 0.3, pencilSize * 0.08);
        c.fill();
        c.stroke();
        
        c.restore();
    }
    
    // Draw spraypaint cursor
    else if (spraypaintActive) {
        canvas.style.cursor = 'default';
        const cursorX = mouseX * cScale;
        const cursorY = canvas.height - mouseY * cScale;
        const canSize = 0.04 * cScale;
        
        // Draw spray radius indicator
        c.beginPath();
        c.arc(cursorX, cursorY, spraypaintRadius * cScale, 0, 2 * Math.PI);
        c.strokeStyle = `hsla(${selectedHue}, ${selectedSaturation}%, ${selectedLightness}%, 0.5)`;
        c.lineWidth = 2;
        c.stroke();
    }
    
    // Draw dye cursor
    else if (dyeActive) {
        canvas.style.cursor = 'none';
        const cursorX = mouseX * cScale;
        const cursorY = canvas.height - mouseY * cScale;
        const time = Date.now() / 1000;
        
        // Animated pulsing circle
        const pulse = Math.sin(time * 4) * 0.15 + 1;
        const dyeRadius = spraypaintRadius * pulse;
        
        // Draw dye radius indicator with animation
        c.beginPath();
        c.arc(cursorX, cursorY, dyeRadius * cScale, 0, 2 * Math.PI);
        c.strokeStyle = `hsla(${selectedHue}, ${selectedSaturation}%, ${selectedLightness}%, ${0.4 + Math.sin(time * 4) * 0.2})`;
        c.lineWidth = 3;
        c.stroke();
        
        // Draw raindrop at center
        c.save();
        const dropScale = 0.025 * cScale;
        const dropB = 1.5;
        c.translate(cursorX, cursorY - dropB * dropScale);
        
        const numPoints = 14; 
        const a = 0.3;
        const pivotOffsetX = 0;
        const pivotOffsetY = -dropB * dropScale;
        c.beginPath();  
        for (let i = 0; i <= numPoints; i++) {
            const t = Math.PI / 2 + (i / numPoints) * (2 * Math.PI);
            const x = (2 * a * Math.cos(t) - a * Math.sin(2 * t)) * dropScale;
            const y = dropB * Math.sin(t) * dropScale;
            if (i === 0) {
                c.moveTo(x - pivotOffsetX, -y - pivotOffsetY);
            } else {
                c.lineTo(x - pivotOffsetX, -y - pivotOffsetY);
            }
        }  
        c.closePath();
        
        // Create 3D gradient
        const gradient = c.createRadialGradient(
            -a * dropScale * 0.8,
            dropB * dropScale * 0.8,
            0,
            0,
            0,
            dropB * dropScale * 2.5);
        gradient.addColorStop(0, `hsla(${selectedHue}, ${Math.max(0, selectedSaturation - 30)}%, ${Math.min(100, selectedLightness + 45)}%, 1)`);
        gradient.addColorStop(0.3, `hsla(${selectedHue}, ${selectedSaturation}%, ${selectedLightness}%, 0.95)`);
        gradient.addColorStop(0.6, `hsla(${selectedHue}, ${Math.min(100, selectedSaturation + 10)}%, ${Math.max(10, selectedLightness - 20)}%, 0.85)`);
        gradient.addColorStop(1, `hsla(${selectedHue}, ${Math.min(100, selectedSaturation + 20)}%, ${Math.max(5, selectedLightness - 40)}%, 0.7)`);
        
        c.fillStyle = gradient;
        c.fill();
        
        c.strokeStyle = `hsla(${selectedHue}, ${Math.max(0, selectedSaturation - 20)}%, ${Math.min(100, selectedLightness + 10)}%, 0.8)`;
        c.lineWidth = 1.5;
        c.stroke();
        
        c.restore();
    }
    
    // Draw camera cursor when skyHandActive
    else if (skyHandActive) {
        canvas.style.cursor = 'none';
        const cursorX = mouseX * cScale;
        const cursorY = canvas.height - mouseY * cScale;
        const camSize = 0.1 * cScale;
        
        c.fillStyle = 'hsla(120, 0%, 70%, 0.9)';
        c.strokeStyle = 'hsla(30, 0%, 0%, 0.9)';
        c.lineWidth = 0.002 * cScale;
        c.lineCap = 'round';
        c.lineJoin = 'round';

        const lensY = (cursorY - camSize * 0.12) + (camSize * 0.35 / 2);
        // Triangular lens on right side
        c.beginPath();
        c.moveTo(cursorX + camSize * 0.45, lensY - camSize * 0.25);
        c.lineTo(cursorX - camSize * 0.10, lensY);
        c.lineTo(cursorX + camSize * 0.45, lensY + camSize * 0.25);
        c.closePath();
        c.fill();
        c.stroke();
        
        // Camera body (rectangle) - on the left
        c.beginPath();
        c.rect(
            cursorX - camSize * 0.5, 
            cursorY - camSize * 0.12, 
            camSize * 0.6, 
            camSize * 0.35);
        c.fill();
        c.stroke();

        // Film reels on top
        const leftReelX = cursorX - camSize * 0.4;
        const leftReelY = cursorY - camSize * 0.3;
        const leftReelRadius = camSize * 0.16;
        
        const rightReelX = cursorX - camSize * 0.02;
        const rightReelY = cursorY - camSize * 0.36;
        const rightReelRadius = camSize * 0.22;
        
        // Draw left reel (smaller, faster)
        c.beginPath();
        c.arc(leftReelX, leftReelY, leftReelRadius, 0, 2 * Math.PI);
        c.fill();
        c.stroke();
        
        // Draw rotating circles on left reel (faster rotation)
        const time = Date.now() / 1000;
        const leftReelRotation = -time * 4; // 4 radians per second
        const leftReelDots = 4;
        const leftReelDotRadius = leftReelRadius * 0.7;
        const leftReelDotSize = camSize * 0.03;
        
        c.fillStyle = 'hsla(0, 0%, 0%, 0.9)';
        for (let i = 0; i < leftReelDots; i++) {
            const angle = leftReelRotation + (i * 2 * Math.PI / leftReelDots);
            const dotX = leftReelX + Math.cos(angle) * leftReelDotRadius;
            const dotY = leftReelY + Math.sin(angle) * leftReelDotRadius;
            c.beginPath();
            c.arc(dotX, dotY, leftReelDotSize, 0, 2 * Math.PI);
            c.fill();
        }
        
        // Draw right reel (larger, slower)
        c.fillStyle = 'hsla(120, 0%, 70%, 0.9)';
        c.beginPath();
        c.arc(rightReelX, rightReelY, rightReelRadius, 0, 2 * Math.PI);
        c.fill();
        c.stroke();
        
        // Draw rotating circles on right reel (slower rotation, opposite direction)
        const rightReelRotation = time * 2.5; // Negative for opposite rotation
        const rightReelDots = 5;
        const rightReelDotRadius = rightReelRadius * 0.7;
        const rightReelDotSize = camSize * 0.04;
        
        c.fillStyle = 'hsla(0, 0%, 0%, 0.9)';
        for (let i = 0; i < rightReelDots; i++) {
            const angle = rightReelRotation + (i * 2 * Math.PI / rightReelDots);
            const dotX = rightReelX + Math.cos(angle) * rightReelDotRadius;
            const dotY = rightReelY + Math.sin(angle) * rightReelDotRadius;
            c.beginPath();
            c.arc(dotX, dotY, rightReelDotSize, 0, 2 * Math.PI);
            c.fill();
        }
    } else {
        canvas.style.cursor = 'default';
    }

    drawStats();
}

//  FPS MONITORING WITH RAMP-UP  ------------------------------------------------
let fpsFrameTimes = [];
let currentFPS = 60;
let lastFrameTime = 0;
let fpsCheckTimer = 0;
let fpsCheckInterval = 0.25; // Check FPS every 0.25 seconds
let minStableFPS = 58.0; // Target FPS threshold (with buffer below 60)
let fpsStableTimer = 0;
let fpsStableThreshold = 0.5; // FPS must be stable for 0.5 seconds before increasing
let isRampingUp = true; // Track if we're still ramping up
let maxBoidsReached = false; // Track if we've hit the limit
let safetyMarginApplied = false; // Track if we've applied the 200 boid safety reduction
let stabilityTimerAfterMax = 0; // Timer to wait before applying safety margin
let lastSafeBoidCount = 100; // Track the last known safe boid count
let justReverted = false; // Track if we just reverted to safe count
let revertVerificationTimer = 0; // Timer to verify stability after revert
let revertVerificationPeriod = 5.0; // Wait 5 seconds after reverting before allowing further drops
let startupWarmupTimer = 0; // Timer for startup warm-up period
let startupWarmupPeriod = 3.0; // Wait 3 seconds after startup before monitoring FPS
let isWarmedUp = false; // Track if warm-up period is complete
let runtimeTimer = 0; // Track total runtime
let runtimeLockPeriod = 30.0; // Lock boid count after 30 seconds

// Reset warmup state for clean restart
function resetWarmupState() {
    fpsFrameTimes = [];
    currentFPS = 60;
    lastFrameTime = 0;
    fpsCheckTimer = 0;
    fpsStableTimer = 0;
    isRampingUp = true;
    maxBoidsReached = false;
    safetyMarginApplied = false;
    stabilityTimerAfterMax = 0;
    lastSafeBoidCount = 100;
    justReverted = false;
    revertVerificationTimer = 0;
    startupWarmupTimer = 0;
    isWarmedUp = false;
    runtimeTimer = 0;
    lastUpdateTime = 0;
}
let boidCountLocked = false; // Track if boid count is locked
let fadeOutDuration = 5.0; // Fade out over 5 seconds
let fadeOutTimer = 0; // Track fade out progress
let finalBoidCount = 0; // Store the final boid count after startup completes

function updateFPS() {
    const currentTime = performance.now();
    const frameTime = currentTime - lastFrameTime;
    
    // Initialize lastFrameTime on first call
    if (lastFrameTime === 0) {
        lastFrameTime = currentTime;
        return;
    }
    
    lastFrameTime = currentTime;
    
    // Prevent invalid frame times (can happen on page refresh or tab switching)
    if (frameTime > 100 || frameTime <= 0) {
        return; // Skip this frame
    }
    
    // Keep last 60 frame times (1 second at 60fps) - longer window for better stability check
    fpsFrameTimes.push(frameTime);
    if (fpsFrameTimes.length > 60) {
        fpsFrameTimes.shift();
    }
    
    // Calculate average FPS (need at least a few samples)
    if (fpsFrameTimes.length >= 3) {
        const avgFrameTime = fpsFrameTimes.reduce((a, b) => a + b) / fpsFrameTimes.length;
        currentFPS = 1000 / avgFrameTime;
        // Cap at 60fps for display purposes (simulation runs at 60fps)
        currentFPS = Math.min(currentFPS, 60);
    }
}

// Helper function to remove boids, prioritizing those outside visible canvas
function cullBoids(removeCount) {
    if (removeCount <= 0 || Boids.length <= 2) return;
    
    // Identify boids outside the visible canvas (excluding last 2 special boids)
    const regularBoids = Boids.slice(0, -2);
    const specialBoids = Boids.slice(-2);
    
    const outsideBoids = [];
    const insideBoids = [];
    
    for (let i = 0; i < regularBoids.length; i++) {
        const boid = regularBoids[i];
        
        // Never cull whiteBoid or blackBoid
        if (boid.whiteBoid || boid.blackBoid) {
            continue;
        }
        
        const isOutside = boid.pos.x < 0 || boid.pos.x > simWidth || 
                        boid.pos.y < 0 || boid.pos.y > simHeight;
        
        if (isOutside) {
            outsideBoids.push(i);
        } else {
            insideBoids.push(i);
        }
    }
    
    // Build list of indices to remove (prioritize outside boids)
    const toRemove = [];
    let removed = 0;
    
    // First remove outside boids
    for (let i = outsideBoids.length - 1; i >= 0 && removed < removeCount; i--) {
        toRemove.push(outsideBoids[i]);
        removed++;
    }
    
    // If we need to remove more, take from inside boids (from the end)
    for (let i = insideBoids.length - 1; i >= 0 && removed < removeCount; i--) {
        toRemove.push(insideBoids[i]);
        removed++;
    }
    
    // Sort indices in descending order to remove from end first (prevents index shifting issues)
    toRemove.sort((a, b) => b - a);
    
    // Remove the boids from spatial grid and array
    for (let idx of toRemove) {
        SpatialGrid.remove(regularBoids[idx]);
        regularBoids.splice(idx, 1);
    }
    
    // Reconstruct the Boids array
    Boids = [...regularBoids, ...specialBoids];
}

function warmupSequence() {
    // Track runtime and lock after specified period
    runtimeTimer += deltaT;
    if (runtimeTimer >= runtimeLockPeriod && !boidCountLocked) {
        boidCountLocked = true;
        isRampingUp = false;
        fadeOutTimer = 0; // Start fade out
        finalBoidCount = Boids.length; // Store the final boid count
    }
    
    // Handle startup warm-up period
    if (!isWarmedUp) {
        startupWarmupTimer += deltaT;
        
        if (startupWarmupTimer >= startupWarmupPeriod) {
            isWarmedUp = true;
            // Reset FPS tracking after warm-up to start fresh
            fpsFrameTimes = [];
            lastFrameTime = performance.now();
            currentFPS = 60;
        } else {
            // During warm-up, just return without adjusting boids
            return;
        }
    }
    
    fpsCheckTimer += deltaT;
    
    if (fpsCheckTimer >= fpsCheckInterval) {
        fpsCheckTimer = 0;
        
        // Calculate how many frames are significantly slower
        let unstableFrames = 0;
        let maxFrameTime = 0;
        let minFrameTime = Infinity;
        
        for (let frameTime of fpsFrameTimes) {
            const fps = 1000 / frameTime;
            if (fps < minStableFPS) {
                unstableFrames++;
            }
            maxFrameTime = Math.max(maxFrameTime, frameTime);
            minFrameTime = Math.min(minFrameTime, frameTime);
        }
        
        // Calculate variance to check consistency
        const variance = maxFrameTime - minFrameTime;
        const isConsistent = variance < 15; // Less than 15ms variance between frames
        
        // Update revert verification timer if we just reverted
        if (justReverted) {
            if (currentFPS >= minStableFPS && isConsistent) {
                revertVerificationTimer += fpsCheckInterval;
                
                if (revertVerificationTimer >= revertVerificationPeriod) {
                    // Verification period complete, system is stable at safe count
                    justReverted = false;
                    revertVerificationTimer = 0;
                }
            } else {
                // Still unstable during verification - need to remove more boids
                if (Boids.length > 100) {
                    const removeCount = Math.min(50, Boids.length - 100);
                    if (removeCount > 0) {
                        cullBoids(removeCount);
                        lastSafeBoidCount = Boids.length;
                    }
                }
                // Reset verification timer to keep checking
                revertVerificationTimer = 0;
            }
        }
        
        // Check if FPS is unstable or too low
        if (currentFPS < minStableFPS || unstableFrames > fpsFrameTimes.length * 0.25) {
            // Always respond to FPS drops, regardless of ramping state
            if (!justReverted && Boids.length > 100) {
                // If we have a known safe count, revert to it; otherwise remove 100
                const targetCount = (lastSafeBoidCount >= 100 && lastSafeBoidCount < Boids.length) 
                    ? lastSafeBoidCount 
                    : Math.max(100, Boids.length - 100);
                const removeCount = Boids.length - targetCount;
                
                // Remove boids, prioritizing those outside canvas
                if (removeCount > 0) {
                    cullBoids(removeCount);
                    lastSafeBoidCount = Boids.length; // Update safe count
                }
                isRampingUp = false; // Stop ramping up
                maxBoidsReached = true; // We've found the limit
                justReverted = true; // Start verification period
                revertVerificationTimer = 0;
            }
            fpsStableTimer = 0; // Reset stability timer
            stabilityTimerAfterMax = 0; // Reset stability timer for safety margin
        } else if (isRampingUp && !maxBoidsReached && currentFPS >= minStableFPS && !justReverted) {
            // FPS is good, increment stability timer
            fpsStableTimer += fpsCheckInterval;
            
            // Once FPS has been stable for the threshold period, add more boids
            if (fpsStableTimer >= fpsStableThreshold && Boids.length < boidProps.numBoids) {
                fpsStableTimer = 0; // Reset timer
                
                // Save current count as last safe before adding more
                lastSafeBoidCount = Boids.length;
                
                // Add 100 more boids
                const addCount = Math.min(100, boidProps.numBoids - Boids.length);
                const spawnRadius = Math.sqrt(simWidth * simWidth + simHeight * simHeight) * 0.6;
                
                for (let i = 0; i < addCount; i++) {
                    // Spawn from anywhere around the circle
                    const ang = Math.random() * 2 * Math.PI;
                    const pos = new Vector2(
                        0.5 * simWidth + Math.cos(ang) * spawnRadius,
                        0.5 * simHeight + Math.sin(ang) * spawnRadius);
                    // Give initial velocity toward center (prevents slow clustering)
                    const velAngle = Math.random() * 2 * Math.PI;
                    const velMag = 0.3 + Math.random() * 0.4; // Random speed 0.3-0.7
                    const vel = new Vector2(Math.cos(velAngle) * velMag, Math.sin(velAngle) * velMag);
                    const hue = 0;
                    
                    // Create new boid and set type based on selectedBoidType
                    const newBoid = new BOID(pos, vel, hue, false, false);
                    newBoid.triangleBoid = selectedBoidType === 0;
                    newBoid.arrow = selectedBoidType === 1;
                    newBoid.flappy = selectedBoidType === 2;
                    newBoid.circle = selectedBoidType === 3;
                    newBoid.ellipseBoid = selectedBoidType === 4;
                    newBoid.square = selectedBoidType === 5;
                    newBoid.airfoil = selectedBoidType === 6;
                    newBoid.glowBoid = selectedBoidType === 7;
                    
                    // Insert before the last 2 special boids
                    Boids.splice(Boids.length - 2, 0, newBoid);
                    SpatialGrid.insert(newBoid);
                }
                
                // Check if we've reached the target
                if (Boids.length >= boidProps.numBoids) {
                    isRampingUp = false;
                    maxBoidsReached = true;
                }
            }
        } else if (maxBoidsReached && !safetyMarginApplied && currentFPS >= minStableFPS && isConsistent) {
            // Max reached, wait for stability then apply safety margin
            stabilityTimerAfterMax += fpsCheckInterval;
            
            if (stabilityTimerAfterMax >= 3.0 && Boids.length > 200) {
                // Remove 200 boids as safety margin
                //const removeCount = Math.min(200, Boids.length - 100);
                const removeCount = 0;
                if (removeCount > 0) {
                    cullBoids(removeCount);
                }
                
                safetyMarginApplied = true;
            }
        }
    }
}

function drawStats() {
    // Calculate opacity based on fade out
    let opacity = 1.0;
    if (boidCountLocked) {
        if (fadeOutTimer >= fadeOutDuration) {
            return; // Completely faded out, don't draw
        }
        if (fadeOutTimer < fadeOutDuration) {
            fadeOutTimer += deltaT;
        }
        opacity = 1.0 - (fadeOutTimer / fadeOutDuration);
    }

    // Draw FPS and boid count at bottom right
    c.save();
    
    // Set text properties
    c.font = '16px monospace';
    c.textAlign = 'right';
    c.textBaseline = 'bottom';
    c.globalAlpha = opacity; // Apply fade opacity
    
    // Prepare text
    //const fpsText = `${currentFPS.toFixed(0)} fps`;
    const boidText = `please wait... making ${Boids.length} boids`;
    const boidLockedText = `settled on ${Boids.length} boids`;
    
    // Position at bottom right with padding
    const padding = 10;
    const lineHeight = 20;
    const x = canvas.width - padding;
    let y = canvas.height - padding;

    // Draw boid count
    // White text
    if (currentFPS >= 58) {
        c.fillStyle = '#00ff00'; // Green
    } else if (currentFPS >= 45) {
        c.fillStyle = '#ffff00'; // Yellow
    } else {
        c.fillStyle = '#ff0000'; // Red
    }
    // Use different text based on whether boid count is locked
    const displayText = boidCountLocked ? boidLockedText : boidText;
    //c.fillText('Please wait', x - 2 *padding, y - lineHeight);
    c.fillText(displayText, x, y);
    
    /*
    // Draw FPS above it
    y -= lineHeight;
    // Color based on FPS
    if (currentFPS >= 58) {
        c.fillStyle = '#00ff00'; // Green
    } else if (currentFPS >= 45) {
        c.fillStyle = '#ffff00'; // Yellow
    } else {
        c.fillStyle = '#ff0000'; // Red
    }
    c.fillText(fpsText, x, y);
    */
    c.restore();
}

//  SETUP SCENE  ------------
function setupScene() {
    deltaT = 1/60;

    // make Boids ----------
    makeBoids();
    // make Background Clouds ----------
    makeBackgroundClouds();
    // make Foreground Clouds (non-interactive) ----------
    makeForegroundClouds();
    // make Interactive Clouds ----------
    makeInitialClouds();
    // make Airplane ----------
    makeAirplane();
    // make balloon ----------
    initBalloon();
    // make hot air balloon ----------
    makeHotAirBalloon()
    // Make magnet ----------
    makeMagnet(); 
    // make spatial grid ----------
    makeSpatialGrid();
    SpatialGrid = new SpatialHashGrid(boidProps.visualRange);
    
    // Initialize auto elevation and auto azimuth if sky renderer is available
    if (window.skyRenderer) {
        const skyCtrl = window.skyRenderer.effectController;
        skyCtrl.autoRotate = true;
        autoElevationInitial = skyCtrl.elevation;
    }

    /*
    // Load and play audio from GitHub LFS
    const audio = new Audio('https://media.githubusercontent.com/media/frank-maiello/frank-maiello.github.io/main/audio.mp3');
    audio.loop = true; // Loop the audio
    audio.volume = 0.5; // Set volume to 50%
    
    // Try to play audio immediately, or wait for user interaction if blocked
    audio.play().catch(function(error) {
        console.log('Audio autoplay blocked. Waiting for user interaction...');
        // Play on first click anywhere on the page
        document.addEventListener('click', function() {
            audio.play();
        }, { once: true });
    });
    */
}

//  RUN  ------------------------------------------------
let lastUpdateTime = 0;
let animationFrameId = null;

function update(timestamp) {
    // Safety check: stop if another instance started
    if (!window.boidAnimationRunning) {
        console.log('Animation loop stopped');
        return;
    }
    
    // Calculate actual deltaT from timestamp (more accurate than fixed 1/60)
    if (lastUpdateTime === 0) {
        lastUpdateTime = timestamp;
    }
    const frameDelta = timestamp - lastUpdateTime;
    lastUpdateTime = timestamp;
    
    // Cap deltaT to prevent spiral of death if tab was backgrounded
    deltaT = Math.min(frameDelta / 1000, 1/30); // Max 33ms (30fps minimum)
    
    // Update FPS tracking during warmup only (menu updates it after)
    if (!boidCountLocked) {
        updateFPS();
    }
    
    // Render sky first (background layer)
    if (window.skyRenderer) {
        window.skyRenderer.render();
    }
    
    if (!boidCountLocked) warmupSequence();
    simulateEverything();
    drawEverything();
    animationFrameId = requestAnimationFrame(update);
}

// Clean up any existing listeners and animation frame before starting
if (window.boidAnimationRunning) {
    console.warn('Boids animation already running, cleaning up and restarting');
    window.boidAnimationRunning = false; // Stop the old loop first
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    removeEventListeners();
    detachMouseMove();
    detachLightweightMouseMove();
    resetWarmupState();
}

// Reset timing to prevent huge deltaT on first frame
lastUpdateTime = 0;

// Mark as running and start fresh
window.boidAnimationRunning = true;
attachEventListeners();
setupScene();
animationFrameId = requestAnimationFrame(update);
