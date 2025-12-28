// Sky Rendering Integration Module for Boids

(function() {
    'use strict';
    
    // SkyRenderer class
    function SkyRenderer(canvas) {
        this.canvas = canvas;
        this.gl = null;
        this.program = null;
        this.camera = null;
        this.effectController = {
            turbidity: 10,
            rayleigh: 3,
            mieCoefficient: 0.005,
            mieDirectionalG: 0.7,
            elevation: 1,
            azimuth: 180,
            exposure: 0.75,
            autoRotate: false,
            rotationSpeed: -0.1,
            showGrid: false,
            cameraPitch: -0.3922325687031568,  // Vertical rotation
            cameraYaw: 0.29879248996896113,     // Horizontal rotation
            fov: 60                             // Field of view (10-120)
        };
        this.sun = { x: 0, y: 1, z: 0 };
        this.lastTime = Date.now();
    }
    
    SkyRenderer.prototype.init = function() {
        // Setup WebGL context
        this.gl = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl');
        if (!this.gl) {
            console.error('WebGL not supported');
            return;
        }
        
        const gl = this.gl;
        
        // Set canvas size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        
        // Setup camera
        this.camera = {
            fov: 60,
            aspect: window.innerWidth / window.innerHeight,
            near: 100,
            far: 2000000,
            position: { x: 0, y: 100, z: 2000 }
        };
        
        // Create shader programs
        this.program = this.createShaderProgram();
        this.gridProgram = this.createGridShaderProgram();
        
        if (!this.program) {
            console.error('Failed to create shader program');
            return;
        }
        
        if (!this.gridProgram) {
            console.error('Failed to create grid shader program');
            return;
        }
        
        // Setup resize handler
        window.addEventListener('resize', () => this.onResize());
    };
    
    SkyRenderer.prototype.createShaderProgram = function() {
        const gl = this.gl;
        
        const vertexShader = `
            precision highp float;
            attribute vec3 position;
            uniform mat4 projectionMatrix;
            uniform mat4 viewMatrix;
            uniform mat4 modelMatrix;
            uniform vec3 sunPosition;
            uniform float rayleigh;
            uniform float turbidity;
            uniform float mieCoefficient;
            uniform vec3 up;
            varying vec3 vWorldPosition;
            varying vec3 vSunDirection;
            varying float vSunfade;
            varying vec3 vBetaR;
            varying vec3 vBetaM;
            varying float vSunE;
            
            const float e = 2.71828182845904523536028747135266249775724709369995957;
            const float pi = 3.141592653589793238462643383279502884197169;
            const vec3 lambda = vec3(680e-9, 550e-9, 450e-9);
            const vec3 totalRayleigh = vec3(5.804542996261093e-6, 1.3562911419845635e-5, 3.0265902468824876e-5);
            const float v = 4.0;
            const vec3 K = vec3(0.686, 0.678, 0.666);
            const vec3 MieConst = vec3(1.8399918514433978e14, 2.7798023919660528e14, 4.0790479543861094e14);
            const float cutoffAngle = 1.6110731556870734;
            const float steepness = 1.5;
            const float EE = 1000.0;
            
            float sunIntensity(float zenithAngleCos) {
                zenithAngleCos = clamp(zenithAngleCos, -1.0, 1.0);
                return EE * max(0.0, 1.0 - pow(e, -((cutoffAngle - acos(zenithAngleCos)) / steepness)));
            }
            
            vec3 totalMie(float T) {
                float c = (0.2 * T) * 10e-18;
                return 0.434 * c * MieConst;
            }
            
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0);
                gl_Position.z = gl_Position.w;
                vSunDirection = normalize(sunPosition);
                vSunE = sunIntensity(dot(vSunDirection, up));
                vSunfade = 1.0 - clamp(1.0 - exp((sunPosition.y / 450000.0)), 0.0, 1.0);
                float rayleighCoefficient = rayleigh - (1.0 * (1.0 - vSunfade));
                vBetaR = totalRayleigh * rayleighCoefficient;
                vBetaM = totalMie(turbidity) * mieCoefficient;
            }
        `;
        
        const fragmentShader = `
            precision highp float;
            uniform vec3 cameraPosition;
            varying vec3 vWorldPosition;
            varying vec3 vSunDirection;
            varying float vSunfade;
            varying vec3 vBetaR;
            varying vec3 vBetaM;
            varying float vSunE;
            uniform float mieDirectionalG;
            uniform vec3 up;
            uniform float exposure;
            
            const float pi = 3.141592653589793238462643383279502884197169;
            const float n = 1.0003;
            const float N = 2.545e25;
            const float rayleighZenithLength = 8.4e3;
            const float mieZenithLength = 1.25e3;
            const float sunAngularDiameterCos = 0.999956676946448443553574619906976478926848692873900859324;
            const float THREE_OVER_SIXTEENPI = 0.05968310365946075;
            const float ONE_OVER_FOURPI = 0.07957747154594767;
            
            float rayleighPhase(float cosTheta) {
                return THREE_OVER_SIXTEENPI * (1.0 + pow(cosTheta, 2.0));
            }
            float hgPhase(float cosTheta, float g) {
                float g2 = pow(g, 2.0);
                float inverse = 1.0 / pow(1.0 - 2.0 * g * cosTheta + g2, 1.5);
                return ONE_OVER_FOURPI * ((1.0 - g2) * inverse);
            }
            void main() {
                vec3 direction = normalize(vWorldPosition - cameraPosition);
                float zenithAngle = acos(max(0.0, dot(up, direction)));
                float inverse = 1.0 / (cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / pi), -1.253));
                float sR = rayleighZenithLength * inverse;
                float sM = mieZenithLength * inverse;
                vec3 Fex = exp(-(vBetaR * sR + vBetaM * sM));
                float cosTheta = dot(direction, vSunDirection);
                float rPhase = rayleighPhase(cosTheta * 0.5 + 0.5);
                vec3 betaRTheta = vBetaR * rPhase;
                float mPhase = hgPhase(cosTheta, mieDirectionalG);
                vec3 betaMTheta = vBetaM * mPhase;
                vec3 Lin = pow(vSunE * ((betaRTheta + betaMTheta) / (vBetaR + vBetaM)) * (1.0 - Fex), vec3(1.5));
                Lin *= mix(vec3(1.0), pow(vSunE * ((betaRTheta + betaMTheta) / (vBetaR + vBetaM)) * Fex, vec3(1.0 / 2.0)), clamp(pow(1.0 - dot(up, vSunDirection), 5.0), 0.0, 1.0));
                float theta = acos(direction.y);
                float phi = atan(direction.z, direction.x);
                vec2 uv = vec2(phi, theta) / vec2(2.0 * pi, pi) + vec2(0.5, 0.0);
                vec3 L0 = vec3(0.1) * Fex;
                float sundisk = smoothstep(sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta);
                L0 += (vSunE * 19000.0 * Fex) * sundisk;
                vec3 texColor = (Lin + L0) * 0.04 + vec3(0.0, 0.0003, 0.00075);
                vec3 retColor = pow(texColor, vec3(1.0 / (1.2 + (1.2 * vSunfade))));
                retColor = vec3(1.0) - exp(-retColor * exposure);
                gl_FragColor = vec4(retColor, 1.0);
            }
        `;
        
        // Compile shaders
        const vShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vShader, vertexShader);
        gl.compileShader(vShader);
        
        if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) {
            console.error('Vertex shader compile error:', gl.getShaderInfoLog(vShader));
            return null;
        }
        
        const fShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fShader, fragmentShader);
        gl.compileShader(fShader);
        
        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
            console.error('Fragment shader compile error:', gl.getShaderInfoLog(fShader));
            return null;
        }
        
        // Create program
        const program = gl.createProgram();
        gl.attachShader(program, vShader);
        gl.attachShader(program, fShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(program));
            return null;
        }
        
        return program;
    };
    
    SkyRenderer.prototype.createGridShaderProgram = function() {
        const gl = this.gl;
        
        const vertexShader = `
            attribute vec3 position;
            uniform mat4 projectionMatrix;
            uniform mat4 viewMatrix;
            uniform mat4 modelMatrix;
            
            void main() {
                gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
            }
        `;
        
        const fragmentShader = `
            precision highp float;
            uniform vec3 gridColor;
            
            void main() {
                gl_FragColor = vec4(gridColor, 0.3);
            }
        `;
        
        // Compile shaders
        const vShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vShader, vertexShader);
        gl.compileShader(vShader);
        
        if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) {
            console.error('Grid vertex shader compile error:', gl.getShaderInfoLog(vShader));
            return null;
        }
        
        const fShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fShader, fragmentShader);
        gl.compileShader(fShader);
        
        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
            console.error('Grid fragment shader compile error:', gl.getShaderInfoLog(fShader));
            return null;
        }
        
        // Create program
        const program = gl.createProgram();
        gl.attachShader(program, vShader);
        gl.attachShader(program, fShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Grid program link error:', gl.getProgramInfoLog(program));
            return null;
        }
        
        return program;
    };
    
    SkyRenderer.prototype.render = function() {
        if (!this.program) return;
        
        // Handle auto-rotation
        const currentTime = Date.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        if (this.effectController.autoRotate) {
            this.effectController.azimuth += this.effectController.rotationSpeed * deltaTime;
            // Wrap around
            if (this.effectController.azimuth > 180) this.effectController.azimuth -= 360;
            if (this.effectController.azimuth < -180) this.effectController.azimuth += 360;
        }
        
        const gl = this.gl;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(this.program);
        
        // Update sun position
        const phi = (90 - this.effectController.elevation) * Math.PI / 180;
        const theta = this.effectController.azimuth * Math.PI / 180;
        this.sun.x = Math.sin(phi) * Math.sin(theta);
        this.sun.y = Math.cos(phi);
        this.sun.z = Math.sin(phi) * Math.cos(theta);
        
        // Set uniforms
        const program = this.program;
        gl.uniform1f(gl.getUniformLocation(program, 'turbidity'), this.effectController.turbidity);
        gl.uniform1f(gl.getUniformLocation(program, 'rayleigh'), this.effectController.rayleigh);
        gl.uniform1f(gl.getUniformLocation(program, 'mieCoefficient'), this.effectController.mieCoefficient);
        gl.uniform1f(gl.getUniformLocation(program, 'mieDirectionalG'), this.effectController.mieDirectionalG);
        gl.uniform1f(gl.getUniformLocation(program, 'exposure'), this.effectController.exposure);
        gl.uniform3f(gl.getUniformLocation(program, 'sunPosition'), this.sun.x, this.sun.y, this.sun.z);
        gl.uniform3f(gl.getUniformLocation(program, 'up'), 0, 1, 0);
        gl.uniform3f(gl.getUniformLocation(program, 'cameraPosition'), 
            this.camera.position.x, this.camera.position.y, this.camera.position.z);
        
        // Create matrices
        const projectionMatrix = this.createPerspectiveMatrix();
        const viewMatrix = this.createViewMatrix();
        const modelMatrix = this.createModelMatrix(450000);
        
        gl.uniformMatrix4fv(gl.getUniformLocation(program, 'projectionMatrix'), false, projectionMatrix);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, 'viewMatrix'), false, viewMatrix);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, 'modelMatrix'), false, modelMatrix);
        
        // Create cube geometry
        const vertices = new Float32Array([
            -1,-1,-1, 1,-1,-1, 1,1,-1, -1,1,-1,
            -1,-1,1, 1,-1,1, 1,1,1, -1,1,1
        ]);
        const indices = new Uint16Array([
            0,1,2, 0,2,3, 1,5,6, 1,6,2,
            5,4,7, 5,7,6, 4,0,3, 4,3,7,
            3,2,6, 3,6,7, 4,5,1, 4,1,0
        ]);
        
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        
        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        
        const posLoc = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
        
        gl.depthFunc(gl.LEQUAL);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
        gl.depthFunc(gl.LESS);
        
        // Draw spherical grid if enabled
        if (this.effectController.showGrid) {
            this.drawGrid();
        }
    };
    
    SkyRenderer.prototype.createPerspectiveMatrix = function() {
        // Update camera FOV from effectController
        this.camera.fov = this.effectController.fov;
        const f = 1.0 / Math.tan(this.camera.fov * Math.PI / 360);
        const nf = 1 / (this.camera.near - this.camera.far);
        return new Float32Array([
            f / this.camera.aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (this.camera.far + this.camera.near) * nf, -1,
            0, 0, (2 * this.camera.far * this.camera.near) * nf, 0
        ]);
    };
    
    SkyRenderer.prototype.createViewMatrix = function() {
        // Create view matrix with camera rotation
        const pitch = this.effectController.cameraPitch;
        const yaw = this.effectController.cameraYaw;
        
        const cosPitch = Math.cos(pitch);
        const sinPitch = Math.sin(pitch);
        const cosYaw = Math.cos(yaw);
        const sinYaw = Math.sin(yaw);
        
        // Rotation around X (pitch) then Y (yaw)
        return new Float32Array([
            cosYaw, sinYaw * sinPitch, -sinYaw * cosPitch, 0,
            0, cosPitch, sinPitch, 0,
            sinYaw, -cosYaw * sinPitch, cosYaw * cosPitch, 0,
            0, 0, 0, 1
        ]);
    };
    
    SkyRenderer.prototype.createModelMatrix = function(scale) {
        return new Float32Array([
            scale, 0, 0, 0,
            0, scale, 0, 0,
            0, 0, scale, 0,
            0, 0, 0, 1
        ]);
    };
    
    SkyRenderer.prototype.drawGrid = function() {
        const gl = this.gl;
        const gridRadius = 450000; // Large radius for the grid sphere
        const latLines = 18; // Number of latitude lines
        const lonLines = 36; // Number of longitude lines
        
        // Generate grid vertices
        const vertices = [];
        
        // Latitude circles (horizontal)
        for (let lat = 1; lat < latLines; lat++) {
            const theta = (lat * Math.PI) / latLines;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);
            const segments = 60;
            
            for (let i = 0; i <= segments; i++) {
                const phi = (i * 2 * Math.PI) / segments;
                const x = gridRadius * sinTheta * Math.cos(phi);
                const y = gridRadius * cosTheta;
                const z = gridRadius * sinTheta * Math.sin(phi);
                vertices.push(x, y, z);
            }
        }
        
        // Longitude circles (vertical)
        for (let lon = 0; lon < lonLines; lon++) {
            const phi = (lon * 2 * Math.PI) / lonLines;
            const cosPhi = Math.cos(phi);
            const sinPhi = Math.sin(phi);
            const segments = 60;
            
            for (let i = 0; i <= segments; i++) {
                const theta = (i * Math.PI) / segments;
                const sinTheta = Math.sin(theta);
                const cosTheta = Math.cos(theta);
                const x = gridRadius * sinTheta * cosPhi;
                const y = gridRadius * cosTheta;
                const z = gridRadius * sinTheta * sinPhi;
                vertices.push(x, y, z);
            }
        }
        
        // Create and bind buffer
        if (!this.gridBuffer) {
            this.gridBuffer = gl.createBuffer();
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gridBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        
        // Use the grid shader program
        gl.useProgram(this.gridProgram);
        const program = this.gridProgram;
        
        const projectionMatrix = this.createPerspectiveMatrix();
        const viewMatrix = this.createViewMatrix();
        const modelMatrix = this.createModelMatrix(1.0);
        
        // Set uniforms for the grid shader
        gl.uniformMatrix4fv(gl.getUniformLocation(program, 'projectionMatrix'), false, projectionMatrix);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, 'viewMatrix'), false, viewMatrix);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, 'modelMatrix'), false, modelMatrix);
        gl.uniform3f(gl.getUniformLocation(program, 'gridColor'), 1.0, 1.0, 1.0); // White grid
        
        // Set grid vertex attribute
        const posLoc = gl.getAttribLocation(program, 'position');
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gridBuffer);
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
        
        // Enable blending for transparency
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        // Draw grid lines
        const latSegments = 61; // segments + 1
        const lonSegments = 61; // segments + 1
        
        // Draw latitude lines
        for (let lat = 0; lat < latLines - 1; lat++) {
            gl.drawArrays(gl.LINE_STRIP, lat * latSegments, latSegments);
        }
        
        // Draw longitude lines
        const lonStart = (latLines - 1) * latSegments;
        for (let lon = 0; lon < lonLines; lon++) {
            gl.drawArrays(gl.LINE_STRIP, lonStart + lon * lonSegments, lonSegments);
        }
        
        // Disable blending
        gl.disable(gl.BLEND);
    };
    
    SkyRenderer.prototype.animate = function() {
        this.render();
        requestAnimationFrame(() => this.animate());
    };
    
    SkyRenderer.prototype.onResize = function() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    };
    
    // Initialize sky renderer after class is defined
    const skyCanvas = document.getElementById('skyCanvas');
    if (!skyCanvas) {
        console.error('Sky canvas not found');
        return;
    }
    
    const skyRenderer = new SkyRenderer(skyCanvas);
    skyRenderer.init();
    skyRenderer.animate();
    
    // Expose skyRenderer globally so it can be controlled from the boids menu
    window.skyRenderer = skyRenderer;
    
})();
