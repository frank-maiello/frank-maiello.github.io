/**
 * @author mrdoob / http://mrdoob.com/
 * @author marklundin / http://mark-lundin.com/
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 */

THREE.AnaglyphEffect = function ( renderer ) {

	var _stereo = new THREE.StereoCamera();

	var _renderTargetL, _renderTargetR;
	var _params = { 
		minFilter: THREE.LinearFilter, 
		magFilter: THREE.NearestFilter, 
		format: THREE.RGBAFormat 
	};

	_renderTargetL = new THREE.WebGLRenderTarget( 512, 512, _params );
	_renderTargetR = new THREE.WebGLRenderTarget( 512, 512, _params );

	var _scene = new THREE.Scene();
	var _camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );

	var _material = new THREE.ShaderMaterial( {
		uniforms: {
			"mapLeft": { value: _renderTargetL.texture },
			"mapRight": { value: _renderTargetR.texture }
		},
		vertexShader: [
			"varying vec2 vUv;",
			"void main() {",
			"	vUv = uv;",
			"	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
			"}"
		].join( "\n" ),
		fragmentShader: [
			"uniform sampler2D mapLeft;",
			"uniform sampler2D mapRight;",
			"varying vec2 vUv;",
			"void main() {",
			"	vec4 colorL = texture2D( mapLeft, vUv );",
			"	vec4 colorR = texture2D( mapRight, vUv );",
			"	gl_FragColor = vec4( colorL.r, colorR.g, colorR.b, max( colorL.a, colorR.a ) );",
			"}"
		].join( "\n" )
	} );

	var _mesh = new THREE.Mesh( new THREE.PlaneGeometry( 2, 2 ), _material );
	_scene.add( _mesh );

	this.setSize = function ( width, height ) {
		renderer.setSize( width, height );
		_renderTargetL.setSize( width, height );
		_renderTargetR.setSize( width, height );
	};

	this.render = function ( scene, camera ) {
		scene.updateMatrixWorld();
		if ( camera.parent === null ) camera.updateMatrixWorld();

		_stereo.update( camera );

		// Render left eye to texture
		renderer.setRenderTarget( _renderTargetL );
		renderer.clear();
		renderer.render( scene, _stereo.cameraL );

		// Render right eye to texture
		renderer.setRenderTarget( _renderTargetR );
		renderer.clear();
		renderer.render( scene, _stereo.cameraR );

		// Composite to screen
		renderer.setRenderTarget( null );
		renderer.render( _scene, _camera );
	};

	this.dispose = function() {
		if ( _renderTargetL ) _renderTargetL.dispose();
		if ( _renderTargetR ) _renderTargetR.dispose();
		if ( _material ) _material.dispose();
	};

};
