
if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container;
var orbitControls, dragControls 
var camera, scene, renderer
var clock, composer, outlinePass, raycaster, selectedObjects, infoWindowCB, txloader, stats
var controller
var celebodyManager
// physic 
// 比例：1 : 1.496e10m
var G = 6.67e-11, M_SUN = 1.9891e30, M_EARTH = 5.965e24, L_SUNEARTH = 1.496e11, EPSILON = 1
var SCALE = 1e8, INVERTSCALE = 1e-8
//a = G * M / r^2 = v^2 / r
var a_earth = G * M_SUN / (L_SUNEARTH * L_SUNEARTH);	// 加速度
var v_earth = Math.sqrt( G * M_SUN / L_SUNEARTH );	// 线速度
console.log(v_earth);// v
console.log(L_SUNEARTH * 2 * Math.PI / v_earth / 86400); // T
var Earth = {}, Planet = {}, uniforms;// sun
var celebodies = [], particles;
var t_start, t_end, move_flag = true
var directionalLight, pointLight;

var mouse = new THREE.Vector2(), mouseX = 0, mouseY = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var WIDTH = 10, HEIGHT = 1

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
	}
}
var mode = 'normal'
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
	$.get('shaders/sun/vertexShader.vs', function(vs){ 
		$.get('shaders/sun/fragmentShader.fs', function(fs){ 
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
function createMaterial(pic, type) {
	var planettx = txloader.load(pic);
	var mat 
	if(!type)
		mat = new THREE.MeshLambertMaterial({
			map: planettx,
			overdraw: 0.5 
		})
	else if(type == 'phong')
		mat = new THREE.MeshPhongMaterial({
			map: planettx,
			overdraw: 0.5 
		})
	return mat
}


function init() {
	
	// initSun()
	// initPlanet() //earth
	initCelebodies()
	var cbs = []
	// sun
	// var sunpic = 'resource/textures/sun/sun.jpg'
	var v = new Float32Array([0.0876, 0.00145, -0.268]);
	var pos = new Float32Array([49400, 798, -156345]);
	var cb = new Celebody(1, M_SUN, v, pos, CommomParam.R_SUN);
	// cb.setMaterial(createMaterial(earthpic))
	cb.mesh.material.color = new THREE.Vector3(1, 1, 1)
	cb.setName('太阳')
	cbs.push(cb);

	// earth
	var earthpic = 'resource/textures/planets/earth.jpg'
	v = new Float32Array([27700, 0.627, 12200]);
	pos = new Float32Array([59855368000, -5419989, -1.34e11]);
	cb = new Celebody(2, M_EARTH, v, pos, CommomParam.R_EARTH);
	cb.setMaterial(createMaterial(earthpic, 'phong'))
	cb.setName('earth')
	cbs.push(cb);

	v = new Float32Array([27700, 0.627, 12200]);
	pos = new Float32Array([59855368000, -5419989, 1.34e11]);
	cb = new Celebody(3, M_EARTH, v, pos, CommomParam.R_EARTH);
	cb.setMaterial(createMaterial(earthpic))
	cb.setName('earth')
	cbs.push(cb);

	// addCelebody(cbs)
	calcu_E(celebodies);
	document.getElementById('pnum').innerText = celebodies.length;
	t_start = new Date();
	
}

function printInfo(id) {
	var cb = getCBById(id)
	console.log(cb.name+'`s information:')
	console.log('vx='+cb.v[0]+',vy='+cb.v[1]+',vz='+cb.v[2])
	console.log('px='+cb.position[0]+',py='+cb.position[1]+',pz='+cb.position[2])
	console.log('轨道半径: '+disOf2cb(cb, getCBById(1)))
}

function planetsMove(/*celebodies, */interval) {
	// 先计算加速度a，再计算位移后位置position，最后算速度v
	// console.time('nm_computeA');
	var t1 = new Date()
	calcu_a(/*celebodies*/);
	tcomputeA += (new Date() - t1)
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
			computeCount ++
			var cbj = cbs[j], cbpj = cbj.position;
			var dif_x = cbpj[0]-cbp[0], dif_y = cbpj[1]-cbp[1], dif_z = cbpj[2]-cbp[2];
			var sq_dis = dif_x*dif_x+dif_y*dif_y+dif_z*dif_z;// 距离平方
			var dis = Math.sqrt(sq_dis);
			var a_scalar = G*cbs[j].m/(sq_dis + EPSILON);// 加速度大小
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
	// computeCount ++
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
	if(infoWindowCB)
		upgradeInfoWindow()
	controller.update()
	// renderer.render( scene, camera );
	if(uniforms)
		uniforms.time.value += interval;
	var dn = controller.cps, ddn = interval / dn;
	//planet 
	if(ddn && !isPause)
		for(var i = 0; i < dn; i ++) { 
			planetsMove(/*celebodies, */ddn * controller.speed);
			
			// planetMove(interval * 200000, i)
		}
	
	// if((~~((new Date() - t_start) / 1000)%3) == 0) {
	// 	calcu_E(celebodies)
	// }
	// renderer.clear();
	composer.render( 0.01 );
}

function animate() {

	requestAnimationFrame( animate );
	stats.update();
	// console.time('test_bh_speed')
	RUN[mode].render();
	// console.timeEnd('test_bh_speed')
	// console.time('test_basic')
	// var e1 = calcu_E(celebodies)
	// var num = 1
	// for(var i = 0; i < num; i ++) {
	// 	// computeCount = 0
	// 	planetsMove(1/60)
	// 	console.log(i+'/'+num)
	// 	if(i == 49)
	// 		printAccu(e1)
	// 	if(i == 99)
	// 		printAccu(e1)
	// 	if(i == 249)
	// 		printAccu(e1)
	// 	if(i == 499)
	// 		printAccu(e1)
	// 	if(i == 999)
	// 		printAccu(e1)
	// 	if(i == 1999)
	// 		printAccu(e1)
		
	// }
	// console.log(tcomputeA)
	// var e2 = calcu_E(celebodies)
	// var accuracy = Math.abs((e2 - e1) / e1) * 100 + '%'
	// console.log('accuracy: ' + accuracy)
	// console.timeEnd('test_basic')
}
// accuracy
function printAccu(e1) {
	var e2 = calcu_E(celebodies)
	var accuracy = Math.abs((e2 - e1) / e1) * 100 + '%'
	console.log('accuracy: ' + accuracy)
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
	// scene.background = new THREE.Color(0xeeeeff)
	scene.add(new THREE.AmbientLight(0xffffff, 2))

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
	// composer.addPass( effectBloom );
	// composer.addPass( effectFilm );
	celebodyManager = new CelebodyManager()
	controller = new Controller()
	initInteractive()
	//
	// document.getElementById('mode').innerText = mode;
	window.addEventListener( 'resize', onWindowResize, false );
	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
}

function getCBById(id) {
	for(var i = 0; i < celebodies.length; i ++) 
		if(celebodies[i].id == id) 
			return celebodies[i]
	return null
}

function getCBByMesh(mesh) {
	for(var i = 0; i < celebodies.length; i ++) 
		if(celebodies[i].mesh == mesh) 
			return celebodies[i]
	return null
}
