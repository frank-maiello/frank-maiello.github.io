// Sky Rendering Integration Module for Boids
// v1.2
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
        
        // Initialize reusable buffers and geometry
        this.initGeometry();
        
        // Cache uniform and attribute locations
        this.cacheLocations();
        
        // Preallocate reusable matrices
        this.projectionMatrix = new Float32Array(16);
        this.viewMatrix = new Float32Array(16);
        this.modelMatrix = new Float32Array(16);
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
    
    SkyRenderer.prototype.cacheLocations = function() {
        const gl = this.gl;
        const program = this.program;
        
        // Cache sky shader locations
        this.locations = {
            turbidity: gl.getUniformLocation(program, 'turbidity'),
            rayleigh: gl.getUniformLocation(program, 'rayleigh'),
            mieCoefficient: gl.getUniformLocation(program, 'mieCoefficient'),
            mieDirectionalG: gl.getUniformLocation(program, 'mieDirectionalG'),
            exposure: gl.getUniformLocation(program, 'exposure'),
            sunPosition: gl.getUniformLocation(program, 'sunPosition'),
            up: gl.getUniformLocation(program, 'up'),
            cameraPosition: gl.getUniformLocation(program, 'cameraPosition'),
            projectionMatrix: gl.getUniformLocation(program, 'projectionMatrix'),
            viewMatrix: gl.getUniformLocation(program, 'viewMatrix'),
            modelMatrix: gl.getUniformLocation(program, 'modelMatrix'),
            position: gl.getAttribLocation(program, 'position')
        };
        
        // Cache grid shader locations
        this.gridLocations = {
            projectionMatrix: gl.getUniformLocation(this.gridProgram, 'projectionMatrix'),
            viewMatrix: gl.getUniformLocation(this.gridProgram, 'viewMatrix'),
            modelMatrix: gl.getUniformLocation(this.gridProgram, 'modelMatrix'),
            gridColor: gl.getUniformLocation(this.gridProgram, 'gridColor'),
            position: gl.getAttribLocation(this.gridProgram, 'position')
        };
    };
    
    SkyRenderer.prototype.initGeometry = function() {
        const gl = this.gl;
        
        // Create sky cube geometry (reused every frame)
        this.skyVertices = new Float32Array([
            -1,-1,-1, 1,-1,-1, 1,1,-1, -1,1,-1,
            -1,-1,1, 1,-1,1, 1,1,1, -1,1,1
        ]);
        this.skyIndices = new Uint16Array([
            0,1,2, 0,2,3, 1,5,6, 1,6,2,
            5,4,7, 5,7,6, 4,0,3, 4,3,7,
            3,2,6, 3,6,7, 4,5,1, 4,1,0
        ]);
        
        this.skyVertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.skyVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.skyVertices, gl.STATIC_DRAW);
        
        this.skyIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.skyIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.skyIndices, gl.STATIC_DRAW);
        
        // Pre-generate grid geometry
        this.initGridGeometry();
    };
    
    SkyRenderer.prototype.initGridGeometry = function() {
        const gl = this.gl;
        const gridRadius = 450000;
        const latLines = 18;
        const lonLines = 36;
        const vertices = [];
        
        // Latitude circles
        for (let lat = 1; lat < latLines; lat++) {
            const theta = (lat * Math.PI) / latLines;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);
            const segments = 60;
            
            for (let i = 0; i <= segments; i++) {
                const phi = (i * 2 * Math.PI) / segments;
                vertices.push(
                    gridRadius * sinTheta * Math.cos(phi),
                    gridRadius * cosTheta,
                    gridRadius * sinTheta * Math.sin(phi)
                );
            }
        }
        
        // Longitude circles
        for (let lon = 0; lon < lonLines; lon++) {
            const phi = (lon * 2 * Math.PI) / lonLines;
            const cosPhi = Math.cos(phi);
            const sinPhi = Math.sin(phi);
            const segments = 60;
            
            for (let i = 0; i <= segments; i++) {
                const theta = (i * Math.PI) / segments;
                const sinTheta = Math.sin(theta);
                const cosTheta = Math.cos(theta);
                vertices.push(
                    gridRadius * sinTheta * cosPhi,
                    gridRadius * cosTheta,
                    gridRadius * sinTheta * sinPhi
                );
            }
        }
        
        this.gridVertices = new Float32Array(vertices);
        this.gridBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gridBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.gridVertices, gl.STATIC_DRAW);
        
        this.gridLatLines = latLines;
        this.gridLonLines = lonLines;
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
        
        // Set uniforms using cached locations
        const loc = this.locations;
        gl.uniform1f(loc.turbidity, this.effectController.turbidity);
        gl.uniform1f(loc.rayleigh, this.effectController.rayleigh);
        gl.uniform1f(loc.mieCoefficient, this.effectController.mieCoefficient);
        gl.uniform1f(loc.mieDirectionalG, this.effectController.mieDirectionalG);
        gl.uniform1f(loc.exposure, this.effectController.exposure);
        gl.uniform3f(loc.sunPosition, this.sun.x, this.sun.y, this.sun.z);
        gl.uniform3f(loc.up, 0, 1, 0);
        gl.uniform3f(loc.cameraPosition, 
            this.camera.position.x, this.camera.position.y, this.camera.position.z);
        
        // Update reusable matrices
        this.updatePerspectiveMatrix();
        this.updateViewMatrix();
        this.updateModelMatrix(450000);
        
        gl.uniformMatrix4fv(loc.projectionMatrix, false, this.projectionMatrix);
        gl.uniformMatrix4fv(loc.viewMatrix, false, this.viewMatrix);
        gl.uniformMatrix4fv(loc.modelMatrix, false, this.modelMatrix);
        
        // Use pre-created buffers (no recreation per frame)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.skyVertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.skyIndexBuffer);
        
        gl.enableVertexAttribArray(loc.position);
        gl.vertexAttribPointer(loc.position, 3, gl.FLOAT, false, 0, 0);
        
        gl.depthFunc(gl.LEQUAL);
        gl.drawElements(gl.TRIANGLES, this.skyIndices.length, gl.UNSIGNED_SHORT, 0);
        gl.depthFunc(gl.LESS);
        
        // Draw spherical grid if enabled
        if (this.effectController.showGrid) {
            this.drawGrid();
        }
    };
    
    SkyRenderer.prototype.updatePerspectiveMatrix = function() {
        // Update camera FOV from effectController
        this.camera.fov = this.effectController.fov;
        const f = 1.0 / Math.tan(this.camera.fov * Math.PI / 360);
        const nf = 1 / (this.camera.near - this.camera.far);
        const m = this.projectionMatrix;
        m[0] = f / this.camera.aspect; m[1] = 0; m[2] = 0; m[3] = 0;
        m[4] = 0; m[5] = f; m[6] = 0; m[7] = 0;
        m[8] = 0; m[9] = 0; m[10] = (this.camera.far + this.camera.near) * nf; m[11] = -1;
        m[12] = 0; m[13] = 0; m[14] = (2 * this.camera.far * this.camera.near) * nf; m[15] = 0;
    };
    
    SkyRenderer.prototype.updateViewMatrix = function() {
        // Create view matrix with camera rotation
        const pitch = this.effectController.cameraPitch;
        const yaw = this.effectController.cameraYaw;
        
        const cosPitch = Math.cos(pitch);
        const sinPitch = Math.sin(pitch);
        const cosYaw = Math.cos(yaw);
        const sinYaw = Math.sin(yaw);
        
        const m = this.viewMatrix;
        m[0] = cosYaw; m[1] = sinYaw * sinPitch; m[2] = -sinYaw * cosPitch; m[3] = 0;
        m[4] = 0; m[5] = cosPitch; m[6] = sinPitch; m[7] = 0;
        m[8] = sinYaw; m[9] = -cosYaw * sinPitch; m[10] = cosYaw * cosPitch; m[11] = 0;
        m[12] = 0; m[13] = 0; m[14] = 0; m[15] = 1;
    };
    
    SkyRenderer.prototype.updateModelMatrix = function(scale) {
        const m = this.modelMatrix;
        m[0] = scale; m[1] = 0; m[2] = 0; m[3] = 0;
        m[4] = 0; m[5] = scale; m[6] = 0; m[7] = 0;
        m[8] = 0; m[9] = 0; m[10] = scale; m[11] = 0;
        m[12] = 0; m[13] = 0; m[14] = 0; m[15] = 1;
    };
    
    // Backward compatibility wrappers for external code
    SkyRenderer.prototype.createPerspectiveMatrix = function() {
        this.updatePerspectiveMatrix();
        return this.projectionMatrix;
    };
    
    SkyRenderer.prototype.createViewMatrix = function() {
        this.updateViewMatrix();
        return this.viewMatrix;
    };
    
    SkyRenderer.prototype.createModelMatrix = function(scale) {
        this.updateModelMatrix(scale);
        return this.modelMatrix;
    };
    
    SkyRenderer.prototype.drawGrid = function() {
        const gl = this.gl;
        
        // Use the grid shader program
        gl.useProgram(this.gridProgram);
        
        this.updatePerspectiveMatrix();
        this.updateViewMatrix();
        this.updateModelMatrix(1.0);
        
        // Set uniforms for the grid shader using cached locations
        const gridLoc = this.gridLocations;
        gl.uniformMatrix4fv(gridLoc.projectionMatrix, false, this.projectionMatrix);
        gl.uniformMatrix4fv(gridLoc.viewMatrix, false, this.viewMatrix);
        gl.uniformMatrix4fv(gridLoc.modelMatrix, false, this.modelMatrix);
        gl.uniform3f(gridLoc.gridColor, 1.0, 1.0, 1.0);
        
        // Set grid vertex attribute using cached location
        gl.bindBuffer(gl.ARRAY_BUFFER, this.gridBuffer);
        gl.enableVertexAttribArray(gridLoc.position);
        gl.vertexAttribPointer(gridLoc.position, 3, gl.FLOAT, false, 0, 0);
        
        // Enable blending for transparency
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        // Draw grid lines
        const latSegments = 61;
        const lonSegments = 61;
        
        // Draw latitude lines
        for (let lat = 0; lat < this.gridLatLines - 1; lat++) {
            gl.drawArrays(gl.LINE_STRIP, lat * latSegments, latSegments);
        }
        
        // Draw longitude lines
        const lonStart = (this.gridLatLines - 1) * latSegments;
        for (let lon = 0; lon < this.gridLonLines; lon++) {
            gl.drawArrays(gl.LINE_STRIP, lonStart + lon * lonSegments, lonSegments);
        }
        
        // Disable blending
        gl.disable(gl.BLEND);
    };
    
    SkyRenderer.prototype.animate = function() {
        // Just render once - called from boids main loop
        this.render();
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
    // Don't start separate animation loop - boids will call render()
    
    // Expose skyRenderer globally so it can be controlled from the boids menu
    window.skyRenderer = skyRenderer;
    
})();
