
if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container;
var orbitControls
var camera, scene, renderer;
var clock, composer, txloader, stats
var mesh, lightMesh, geometry;
// physic 
// 比例：1 : 1.496e10m
var G = 6.67e-11, M_SUN = 1.9891e30, M_EARTH = 5.965e24, L_SUNEARTH = 1.496e11
var SCALE = L_SUNEARTH / 100;
//a = G * M / r^2 = v^2 / r
var a_earth = G * M_SUN / (L_SUNEARTH * L_SUNEARTH);	// 加速度
var v_earth = Math.sqrt( G * M_SUN / L_SUNEARTH );	// 线速度
console.log(v_earth);// v
console.log(L_SUNEARTH * 2 * Math.PI / v_earth / 86400); // T
var Earth = {}, Planet = {}, uniforms;// sun
var celebodies = [], particles;
var t_start, t_end, move_flag = true
var directionalLight, pointLight;

var mouseX = 0, mouseY = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var WIDTH = 10, HEIGHT = 10

var RUN = {
	normal: {
		init: init,
		render: render
	},
	points_cpu: {
		init: pc_init,
		render: pc_render
	},
	bhtree: {
		init: bh_init,
		render: bh_render
	},
	aot: {
		init: aot_init,
		render: aot_render
	}
}
var mode = 'bhtree'
commonInit()
RUN[mode].init()
animate();

function initSun() {
	var size = 0.65;
	var sungeo = new THREE.SphereBufferGeometry( size, 30, 30 )//new THREE.SphereBufferGeometry( 20, 20, 20 )
	
	uniforms = {

					fogDensity: { value: 0.45 },
					fogColor: { value: new THREE.Vector3( 0.8, 0.8, 0.8 ) },
					time: { value: 1.0 },
					uvScale: { value: new THREE.Vector2( 3.0, 1.0 ) },
					texture1: { value: txloader.load( 'resource/textures/lava/cloud.png' ) },
					texture2: { value: txloader.load( 'resource/textures/lava/lavatile.jpg' ) }

				};

	uniforms.texture1.value.wrapS = uniforms.texture1.value.wrapT = THREE.RepeatWrapping;
	uniforms.texture2.value.wrapS = uniforms.texture2.value.wrapT = THREE.RepeatWrapping;
	var sunmat;
	// var suntx = txloader.load('resource/textures/sun/sun.jpg')
	$.get('resource/shaders/sun/vertexShader.vs', function(vs){ 
		$.get('resource/shaders/sun/fragmentShader.fs', function(fs){ 
			sunmat = new THREE.ShaderMaterial( {

						uniforms: uniforms,
						vertexShader: vs,
						fragmentShader: fs

					} );
			var sun = new THREE.Mesh(sungeo, sunmat);
			scene.add(sun);
		})
	})
}
function addCelebody(cbs) {
	cbs.forEach(function(celebody) {
		celebodies.push(celebody);
		scene.add(celebody.mesh);
	})
}

function initPlanet() {
	
	var planet_geo = new THREE.SphereGeometry(0.3, 15, 15);
	var planettx = txloader.load('resource/textures/planets/earth.jpg');
	var planet_mat = new THREE.MeshLambertMaterial({
		map: planettx,
		overdraw: 0.5 
	})
	var planet = new THREE.Mesh(planet_geo, planet_mat);
	planet.rotation.y = 0.4;
	scene.add(planet);

	Planet.planet = planet;
	Planet.r = 100 //公转轨道半径
	planet.position.x = Planet.r;
	// planet.position.z = 10 
	Planet.F_scalar;// 受力
	Planet.m = M_EARTH;// 质量
	Planet.a_scalar = a_earth / SCALE;//1.44
	Planet.v_scalar = v_earth / SCALE;
	var a = planet.position.clone().normalize().multiplyScalar(-Planet.a_scalar);
	Planet.a = new Float32Array([a.x, a.y, a.z]);
	// Planet.v0 = new THREE.Vector3(0, 0, -6)//初速度
	Planet.v = new Float32Array([0, -Planet.v_scalar, 0]);//速度
	Planet.angle = 0;
	// Planet.w = Planet.v.length() / Planet.r//角速度
}
function planetMove(delta, i) {
	var planet = Planet.planet, pos = planet.position;
	var posarr = new Float32Array(3);
	for(var i = 0; i < 3; i++) {
		posarr[i] = Planet.v[i] * delta;
	}
	posarr[0] += pos.x, posarr[1] += pos.y, posarr[2] += pos.z;
	pos.fromArray(posarr) // calculate position
	var r = planet.position.length(), v = Planet.v;
	// if(r > 10)
	// 	console.log(2*Math.PI*r / Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]) / 86400)
	var norma = pos.clone().normalize().multiplyScalar(-Planet.a_scalar), a = [];
	a[0] = norma.x, a[1] = norma.y, a[2] = norma.z, Planet.a = a;
	for(var i = 0; i < 3; i++) {
		Planet.v[i] += Planet.a[i] * delta;
	}
	// Planet.a = planet.position.clone().divideScalar(-100) // calculate a
	// Planet.v.add(Planet.a.clone().multiplyScalar(delta)) // calculate v

	// if(i > 8) {
	// 	Planet.angle += Planet.w * delta
	// 	console.log(planet.position.x = Planet.r * Math.cos(Planet.angle))
	// 	console.log(planet.position.z = Planet.r * Math.sin(Planet.angle))
	// }
	
}


function init() {
	
	// initSun()
	// initPlanet() //earth
	initCelebodies()
	// sun
	// var v = new Float32Array([0.0876, 0.00145, -0.268]);
	// var pos = new Float32Array([49400, 798, -156345]);
	// var cb = new Celebody(1, M_SUN, v, pos);
	// cb.mesh.material = mat
	// cbs.push(cb);

	// // earth
	// v = new Float32Array([27700, 0.627, 12200]);
	// pos = new Float32Array([59855368000, -5419989, -1.34e11]);
	// cb = new Celebody(2, M_EARTH, v, pos);
	// cb.mesh.material = mat
	// cbs.push(cb);

	 
	calcu_E(celebodies);
	document.getElementById('pnum').innerText = celebodies.length;
	t_start = new Date();
	
}

function planetsMove(/*celebodies, */interval) {
	// 先计算加速度a，再计算位移后位置position，最后算速度v
	// console.time('nm_computeA');
	calcu_a(/*celebodies*/);
	// console.timeEnd('nm_computeA');
	calcu_p(/*celebodies, */interval);
	calcu_v(/*celebodies, */interval);
}

function calcu_a(/*celebodies*/) {
	var cbs = celebodies;
	for(var i = 0; i < cbs.length; i ++) {
		var cb = cbs[i], cbp = cb.position, a_byothers = [], a = new Float32Array([0, 0, 0]);
		for(var j = 0; j < cbs.length; j ++) {
			if(i == j)
				continue;
			var cbj = cbs[j], cbpj = cbj.position;
			var dif_x = cbpj[0]-cbp[0], dif_y = cbpj[1]-cbp[1], dif_z = cbpj[2]-cbp[2];
			var sq_dis = dif_x*dif_x+dif_y*dif_y+dif_z*dif_z;// 距离平方
			var dis = Math.sqrt(sq_dis);
			var a_scalar = G*cbs[j].m/sq_dis;// 加速度大小
			var normal_x = dif_x/dis, normal_y = dif_y/dis, normal_z = dif_z/dis;
			if(cb.r + cbj.r > dis){
				// aggregate(cb,  cbj);
				// dropCB(cb);
				// dropCB(cbj);
			}
			// 加速度
			a_byothers.push([a_scalar*normal_x, a_scalar*normal_y, a_scalar*normal_z]);
		}
		for(var k = 0; k < a_byothers.length; k++) {
			a[0] += a_byothers[k][0];
			a[1] += a_byothers[k][1];
			a[2] += a_byothers[k][2];
		}
		cb.a = a;
	}
}

function computeAcceleOf2(G, c1, c2, doboth) {
	var m1 = c1.m, m2 = c2.m, 
		p1 = c1.position, p2 = c2.position;
	return computeAcceleOf2directly(G, m1, p1, m2, p2, doboth)
}

function computeAcceleOf2directly(G, m1, p1, m2, p2, doboth) {
	var a1 = null, a2 = null

	var dif_x = p2[0]-p1[0], dif_y = p2[1]-p1[1], dif_z = p2[2]-p1[2];
	var sq_dis = dif_x*dif_x+dif_y*dif_y+dif_z*dif_z;// 距离平方
	var GdivsqDis = G / sq_dis
	var dis = Math.sqrt(sq_dis);
	var a1_scalar = GdivsqDis * m2;
	
	var normal_x = dif_x/dis, normal_y = dif_y/dis, normal_z = dif_z/dis;
	// if(cb.r + cbj.r > dis){
		// aggregate(cb,  cbj);
		// dropCB(cb);
		// dropCB(cbj);
	// }
	a1 = new Float32Array([a1_scalar*normal_x, a1_scalar*normal_y, a1_scalar*normal_z])
	if(doboth === true) {
		var a2_scalar = GdivsqDis * m1;
		a2 = new Float32Array([-a2_scalar*normal_x, a_scalar*normal_y, a_scalar*normal_z])
	}
	return {
		a1: a1,
		a2: a2
	}
}

function calcu_p(/*celebodies, */interval) {
	var cbs = celebodies, t = interval;
	for(var i = 0; i < cbs.length; i ++) {
		var p = cbs[i].position, v = cbs[i].v;
		p[0] += v[0] * t, p[1] += v[1] * t, p[2] += v[2] * t;
		if(cbs[i].mesh)
			cbs[i].setPosition()
			
		// console.log('celebody '+cbs[i].id+' position: '+cbs[i].position)
	}
	// if(new Date() - t_start > 30000) {
	// 	t_end = new Date();
	// 	console.log('运动时间：' + (t_end-t_start) + 'ms');
	// 	move_flag = false;
	// 	calcu_E(celebodies);
	// }
	// console.log(celebodies[0].position[1])
}
function calcu_v(/*celebodies, */interval) {
	var cbs = celebodies, t = interval;
	for(var i = 0; i < cbs.length; i ++) {
		var v = cbs[i].v, a = cbs[i].a;
		v[0] += a[0] * t, v[1] += a[1] * t, v[2] += a[2] * t;
	}
	// console.log(celebodies[0].v[1])
}
function render() {
	var interval = clock.getDelta();
	orbitControls.update();

	// renderer.render( scene, camera );
	if(uniforms)
		uniforms.time.value += interval;
	var dn = 10, ddn = interval / dn;
	//planet
	if(ddn)
		for(var i = 0; i < dn; i ++) { 
			if(move_flag)
				planetsMove(/*celebodies, */ddn );
			// planetMove(interval * 200000, i)
		}
	
	// if((~~((new Date() - t_start) / 1000)%3) == 0) {
	// 	calcu_E(celebodies)
	// }
	renderer.clear();
	// composer.render( 0.01 );
}

function animate() {

	requestAnimationFrame( animate );
	stats.update();
	RUN[mode].render();

}
// 系统机械能
function calcu_E(cbs) {
	var E = 0, Ep = 0, Ek = 0;
	for(var i = 0; i < cbs.length; i ++) {
		for(var j = i + 1; j < cbs.length; j ++) {
			Ep -= cbs[i].m * cbs[j].m / disOf2cb(cbs[i], cbs[j]);
		}
		cbs[i].computeV();
		Ek += cbs[i].m * cbs[i].v_scalar * cbs[i].v_scalar;
	}
	Ep *= G;
	Ek /= 2;
	E = Ek + Ep;
	document.getElementById('E').innerText = E.toFixed(2);
	console.log('系统机械能：' + E.toFixed(2) + 'J');
	return E;
}

// 2间天体距离
function disOf2cb(cb1, cb2) {
	var p1 = cb1.position, p2 = cb2.position;
	return disOf2p(p1, p2)
}
function disOf2p(p1, p2) {
	var dx = p1[0] - p2[0], dy = p1[1] - p2[1], dz = p1[2] - p2[2];
	var dis = Math.sqrt(dx * dx + dy * dy + dz * dz);
	return dis;
}

// 碰撞，消除cb2, 动量守恒
function aggregate(cb1, cb2) {
	var v1 = cb1.v, v2 = cb2.v, m1 = cb1.m, m2 = cb2.m, M = m1 + m2;
	cb1.computeV();
	cb2.computeV();
	var vx = ( v1[0] * m1 + v2[0] * m2 ) / M;
	var vy = ( v1[1] * m1 + v2[1] * m2 ) / M;
	var vz = ( v1[2] * m1 + v2[2] * m2 ) / M;
	cb1.m = M, cb1.v = new Float32Array([vx, vy, vz]);
	cb1.r = Math.pow( 3 * cb1.m / ( 4 * Math.PI * cb1.density ), 1 / 3 );
	cb1.reDraw();
	dropCB(cb2);
}

// 丢弃
function dropCB(dropcb) {
	var newceles = [];
	for(var i = 0; i < celebodies.length; i ++) {
		if(celebodies[i].id == dropcb.id) {
			if(dropcb.mesh) {
				scene.remove(dropcb.mesh);
				var m = dropcb.mesh
				m.geometry.dispose()
				m.material.map.dispose()
				m.material.dispose()
			} else {
				var verts = particles.geometry.vertices
				verts.splice(i, 1)
			}
			
			continue;
		}
		newceles.push(celebodies[i]);
	}
	celebodies = newceles;
	document.getElementById('pnum').innerText = celebodies.length;
}
function onWindowResize() {

	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );
	composer.reset();

}

function addToVector3(v1, v2) {
	v1[0] += v2[0]
	v1[1] += v2[1]
	v1[2] += v2[2]
}
function onDocumentMouseMove(event) {

	mouseX = ( event.clientX - windowHalfX ) * 10;
	mouseY = ( event.clientY - windowHalfY ) * 10;

}
function commonInit() {
	container = document.createElement( 'div' );
	document.body.appendChild( container );

	camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 100000 );
	camera.position.z = 100;
	// camera.position.y = 12;
	clock = new THREE.Clock()
	scene = new THREE.Scene();
	scene.background = new THREE.CubeTextureLoader()
		.setPath( 'resource/textures/cube/MilkyWay/' )
		.load( [ 'dark-s_px.jpg', 
				'dark-s_nx.jpg', 
				'dark-s_py.jpg', 
				'dark-s_ny.jpg', 
				'dark-s_pz.jpg', 
				'dark-s_nz.jpg' ] );
	scene.add(new THREE.AmbientLight(0xffffff, 0.4))

	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	container.appendChild( renderer.domElement );
	orbitControls = new THREE.OrbitControls(camera, renderer.domElement)

	renderer.autoClear = false;

	txloader = new THREE.TextureLoader()
	stats = new Stats();
	container.appendChild(stats.dom);
	//

	var renderModel = new THREE.RenderPass( scene, camera );
	var effectBloom = new THREE.BloomPass( 1.25 );
	var effectFilm = new THREE.FilmPass( 0.35, 0.95, 2048, false );

	effectFilm.renderToScreen = true;

	composer = new THREE.EffectComposer( renderer );

	composer.addPass( renderModel );
	composer.addPass( effectBloom );
	composer.addPass( effectFilm );
	//
	document.getElementById('mode').innerText = mode;
	window.addEventListener( 'resize', onWindowResize, false );
	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
}