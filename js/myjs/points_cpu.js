var ENABLE_POINT_CPU = true
function pc_init() {
	
	var mass = 100000
	var WIDTH = 10, HEIGHT = 10, n = WIDTH * HEIGHT, posR = 5000, randomVel = 30;
	var geometry = new THREE.Geometry();
	var PARTICLES = WIDTH * HEIGHT
	var positions = [];
	var velocities = new Float32Array( PARTICLES * 3 );

	for(var i = 0; i < PARTICLES; i ++) {
		var px = posR * ( 2*Math.random()-1 ), py = posR * ( 2*Math.random()-1 ), pz = posR * ( 2*Math.random()-1 );
		var vtxp = new THREE.Vector3(px, py, pz);
		positions[ i ] = vtxp

		var v = new Float32Array([randomVel*(Math.random()-0.5), randomVel*(Math.random()-0.5), randomVel*(Math.random()-0.5)]);
		var cbpos = new Float32Array([px, py, pz]);
		var cb = new Celebody(i, mass, v, cbpos, 30);
		celebodies.push(cb)
	}

	geometry.vertices = positions;

	var texture = txloader.load('resource/textures/planets/earth.jpg')
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	particleUniforms = { 
		texture: { value: texture },
		cameraConstant: { value: getCameraConstant( camera ) },// 相机常数
	};

	// ShaderMaterial
	var material = new THREE.ShaderMaterial( {
		uniforms:       particleUniforms,
		vertexShader:   document.getElementById( 'particleVertexShader' ).textContent,
		fragmentShader: document.getElementById( 'particleFragmentShader' ).textContent
	} );

	particles = new THREE.Points( geometry, material );
	scene.add( particles );
	camera.z = 500
	document.getElementById('ptotalnum').innerText = PARTICLES;
	t_start = new Date();
}

function pc_render() {
	var interval = clock.getDelta();
	var dn = 10, ddn = interval / dn;
	//planet
	if(ddn)
		for(var i = 0; i < dn; i ++) {
			if(true)
				pc_planetsMove(celebodies, ddn /** 20000*/);
			// planetMove(interval * 200000, i)
		}
	if((~~((new Date() - t_start) / 1000)%3) == 0) {
		calcu_E(celebodies)
	}
	orbitControls.update();
	renderer.render( scene, camera );
}

function pc_planetsMove(celebodies, interval) {

	calcu_a(celebodies);
	calcu_p(celebodies, interval);
	pc_geoUpdate(celebodies);
	calcu_v(celebodies, interval);

	particles.geometry.verticesNeedUpdate = true

}

function pc_geoUpdate(celebodies) {
	for(var i = 0; i < celebodies.length; i ++) {
		var p = celebodies[i].position
		particles.geometry.vertices[i] = new THREE.Vector3(p[0], p[1], p[2])
	}
}

function getCameraConstant( camera ) {

	return window.innerHeight / ( Math.tan( THREE.Math.DEG2RAD * 0.5 * camera.fov ) / camera.zoom );

}