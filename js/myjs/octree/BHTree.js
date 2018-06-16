var bhtree, BH_THETA = 500;
var farest = 0
var computeCount = 0, tcomputeA = 0
var pmaterial, gpuCompute
function BHTree(r, x, y, z) {
	var x = x || 0, 
		y = y || 0, 
		z = z || 0, 
		half = r || 20000
	var bounds = new Bounds3(x, y, z, half)
	this.root = new TreeNode(bounds)
	
}

BHTree.prototype.buildTree = function(array) {
	this.reset()
	var tNodeNum = 0
	for(var i = 0; i < array.length; i ++) {
		tNodeNum += this.root.insert(i, array, 0)
	}
	this.tNodeNum = tNodeNum
}

BHTree.prototype.destroy = function() {
	// this.root = null
	if(this.root)
		this.root = this.curDeleteNode(this.root)
}

BHTree.prototype.reset = function() {
	var b = this.root.bounds
	this.destroy()
	// var bounds = new Bounds3(0, 0, 0, 20000)
	this.root = new TreeNode(b)
}

BHTree.prototype.curDeleteNode = function(node) {
	node.items = node.bounds = null
	for(var i = 0; i < 8; i ++) {
		if(node.q[i])
			node.q[i] = this.curDeleteNode(node.q[i])
		
	}
	return null
}

BHTree.prototype.printTree = function() {
	console.log(this.root)
}

// BHTree.prototype.
function initCelebodies() {
	var cbs = [];
	var mass = 1e20
	var planettx = txloader.load('resource/textures/planets/earth.jpg')
	var mat = new THREE.MeshLambertMaterial({
					map: planettx,
					overdraw: 0.5 
				})

	n = WIDTH * HEIGHT, posR = 1e12, randomVel = 1e3;
	for(var i = 0; i < WIDTH; i ++) {
		for(var j = 0; j < HEIGHT; j ++) {
			var v = new Float32Array([randomVel*(Math.random()-0.5), randomVel*(Math.random()-0.5), randomVel*(Math.random()-0.5)]);
			var pos = new Float32Array([posR*(Math.random()-0.5), posR*(Math.random()-0.5), posR*(Math.random()-0.5)]);
			var cb = new Celebody(i*HEIGHT+j, mass, v, pos, CommomParam.R_EARTH);
			cb.mesh.material = mat
			cb.setName( 'planet' + cb.id )
			cbs.push(cb);
		}
	}

	// var cb = new Celebody(1, mass, new Float32Array([1, 2, 3]), new Float32Array([5000, 5000, 0]));
	// cb.mesh.material = mat, cbs.push(cb)
	// cb = new Celebody(1, mass, new Float32Array([0, 0, 0]), new Float32Array([5000, 15000, 0]));
	// cb.mesh.material = mat, cbs.push(cb)
	// cb = new Celebody(1, mass, new Float32Array([0, 0, 0]), new Float32Array([15000, 15000, 0]));
	// cb.mesh.material = mat, cbs.push(cb)
	// cb = new Celebody(1, mass, new Float32Array([0, 0, 0]), new Float32Array([15000, 5000, 0]));
	// cb.mesh.material = mat, cbs.push(cb)
	// cb = new Celebody(1, mass, new Float32Array([0, 0, 0]), new Float32Array([-10000, -10000, 0]));
	// cb.mesh.material = mat, cbs.push(cb)
	// cb = new Celebody(1, mass, new Float32Array([0, 0, 0]), new Float32Array([10000, -10000, 0]));
	// cb.mesh.material = mat, cbs.push(cb)
	// cb = new Celebody(1, mass, new Float32Array([0, 0, 0]), new Float32Array([-10000, 10000, 0]));
	// cb.mesh.material = mat, cbs.push(cb)
	// cb = new Celebody(1, mass, new Float32Array([0, 0, 0]), new Float32Array([-18000, 1000, 1000]));
	// cb.mesh.material = mat, cbs.push(cb)
	// cb = new Celebody(1, mass, new Float32Array([0, 0, 0]), new Float32Array([-1000, 18000, 3000]));
	// cb.mesh.material = mat, cbs.push(cb)
	
	addCelebody(cbs);
	// document.getElementById('ptotalnum').innerText = WIDTH * HEIGHT;
}
function printArray() {
	console.log('bound array:')
	console.log(boundInput)
	console.log('CoM and Mass array:')
	console.log(CMInput)
	console.log('type array:')
	console.log(typeInput)
}
function bh_init() {

	initCelebodies()
	// initParticles()
	bhtree = new BHTree(1e15)
	bhtree.buildTree(celebodies)
	console.log(bhtree.root)
	// turn tree to arr
	
	// doBHtreeIter(i, bhtree.root, function() {
	// 	tNodeNum++
	// })
	// initArr()
	// for (var i = 0; i < celebodies.length; i++)
	// 	doBHtreeIter(i, bhtree.root, turnTreeToArr2)
	// printArray()
	// compute a in cpu
	// for (var i = 0; i < celebodies.length; i++)
	// 	doBHtreeIter(i, bhtree.root, computeInItor)
	
	// printMoveAttr('a')
	// glsloctree.init({
	// 	// boundIpt: boundInput,
	// 	// CMIpt: CMInput,
	// 	// typeIpt: typeInput,
	// 	node: arrToCompt
	// }, celebodies)
	// initComputeRenderer({node: arrToCompt}, celebodies)
	// calcu_v(1/60)
	// printMoveAttr('v')
}

function printMoveAttr(attr) {
	var l = celebodies.length
	var attArray = new Float32Array(l * 4)
	for(var i = 0; i < l; i ++) {
		attArray[i * 4] = celebodies[i][attr][0]
		attArray[i * 4 + 1] = celebodies[i][attr][1]
		attArray[i * 4 + 2] = celebodies[i][attr][2]
	}
	var att2name = {
		'a': '加速度',
		'v': '速度',
		'position': '位置'
	}
	console.log(att2name[attr]+': ')
	console.log(attArray)
}

function bh_render() {
	orbitControls.update()
	if(infoWindowCB)
		upgradeInfoWindow()
	controller.update()
	// renderer.render( scene, camera );
	if(uniforms)
		uniforms.time.value += interval;
	
	var interval = clock.getDelta()
	var dn = controller.cps, ddn = interval / dn;
	// planet
	if(ddn)
		for(var i = 0; i < dn; i ++) {
			bh_planetsMove(ddn * controller.speed)
		}

	// if((~~((new Date() - t_start) / 1000)%3) == 0) {
	// 	calcu_E(celebodies)
	// }
	

	// gpuCompute.compute()
	// pmaterial.uniforms.texturePosition.value = gpuCompute.
	// getCurrentRenderTarget( positionVariable ).texture;
	// pmaterial.uniforms.textureVelocity.value = gpuCompute.
	// getCurrentRenderTarget( velocityVariable ).texture;
	// var e1 = calcu_E(celebodies)
	// var count = 100
	// var t1 = new Date()
	// for(var i = 0; i < count; i ++) {
	// 	bh_planetsMove(1/60, i)
	// 	// if(i % 500 == 0) 
	// 	console.log(i+'/'+count)
	// 	if(i == 49)
	// 		printAccu(e1)
	// 	if(i == 99) {
	// 		printAccu(e1)
	// 		console.log(new Date() - t1)
	// 	}
	// 	if(i == 249)
	// 		printAccu(e1)
	// 	if(i == 499) {
	// 		printAccu(e1)
	// 		console.log(new Date() - t1)
	// 	}
	// 	if(i == 999) {
	// 		printAccu(e1)
	// 		console.log(new Date() - t1)
	// 	}
	// 	if(i == 1999) {
	// 		printAccu(e1)
	// 		console.log(new Date() - t1)
	// 	}
	// }
	// tcomputeA += (new Date() - t1)
	// // console.log(computeCount)
	// console.log(tcomputeA)
	// printAccu(e1)
	renderer.render( scene, camera );
}

function bh_planetsMove(dt, count) {
	// console.time('bh_computeA');
	
	bh_computeA(count)
	
	// console.timeEnd('bh_computeA');
	calcu_p(dt)
	calcu_v(dt)

}

function bh_computeA(count) {
	// console.time('build')
	if(count % 50 == 0)
		bhtree.buildTree(celebodies)
	// console.timeEnd('build');
	// console.time('computeA');
	for (var i = 0; i < celebodies.length; i++) {
		// For each body
		// doBHtreeRecurse(i, bhtree.root)
		doBHtreeIter(i, bhtree.root, computeInItor)
	}
	// console.timeEnd('computeA');
}
// recursion
function doBHtreeRecurse(bI, node) {
	var nodeids = node.items.ids
	if (node.isLeaf()) {
		// If node is a leaf node
		for (var k = 0; k < nodeids.length; k++) {
			if (bI != nodeids[k]) { // Skip self
				
				var result_a = computeAcceleOf2(G, celebodies[bI], 
					celebodies[nodeids[k]], false)
				addToVector3(celebodies[bI].a, result_a.a1)
			}
		}
	} else {
		var s = 2 * node.bounds.half
		var d = disOf2p(celebodies[bI].position, node.items.CoM)
		if (s / d < BN_THETA) {
			var m1 = celebodies[bI].m, p1 = celebodies[bI].position,
				m2 = node.items.mass, p2 = node.items.CoM
			var result_a = computeAcceleOf2directly(G, m1, p1, m2, p2, false)
			addToVector3(celebodies[bI].a, result_a.a1)
			
		} else {
			// Recurse for each child
			for (var k = 0; k < 8; k++) {
				if (node.q[k]) {
					doBHtreeRecurse(bI,node.q[k])
				}
			} 
		}
	}
}

//iteration
function doBHtreeIter(bI, node, handler) {
	if(node == null)
		return
	var stack = []
	var parent
	var index = 0, length = 7
	while(node || stack.length != 0 || index <= node.nodeIdx.length - 1) {
		
		while(node != null) {
			// do sth
			// var bk = handler(bI, node, stack)
			// if(bk)
			// 	break
			// var t1 = new Date()
			if(node.isLeaf()) {
				// If node is a leaf node
				var nodeids = node.items.ids 
				for (var k = 0; k < nodeids.length; k++) {
					if (bI != nodeids[k]) { // Skip self
						// console.time('oneParticle');
						// var result_a = computeAcceleOf2(G, celebodies[bI], 
						// 	celebodies[nodeids[k]], false)
						computeCount++
						var m1 = celebodies[bI].m, m2 = celebodies[nodeids[k]].m, 
						p1 = celebodies[bI].position, p2 = celebodies[nodeids[k]].position;

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
						var result_a = new Float32Array([a1_scalar*normal_x, a1_scalar*normal_y, a1_scalar*normal_z])
						
						// console.timeEnd('oneParticle');
						addToVector3(celebodies[bI].a, result_a)
					}
				}
			} else {
				var s = 2 * node.bounds.half
				var d = disOf2p(celebodies[bI].position, node.items.CoM)
				if (s / d < BH_THETA) {
					computeCount++
					var m1 = celebodies[bI].m, p1 = celebodies[bI].position,
						m2 = node.items.mass, p2 = node.items.CoM
					// var result_a = computeAcceleOf2directly(G, m1, p1, m2, p2, false)
					
					var a1 = null, a2 = null

					var dif_x = p2[0]-p1[0], dif_y = p2[1]-p1[1], dif_z = p2[2]-p1[2];
					var sq_dis = dif_x*dif_x+dif_y*dif_y+dif_z*dif_z;// 距离平方
					var GdivsqDis = G / sq_dis
					var dis = Math.sqrt(sq_dis);
					var a1_scalar = GdivsqDis * m2;
					
					var normal_x = dif_x/dis, normal_y = dif_y/dis, normal_z = dif_z/dis;
					
					var result_a = new Float32Array([a1_scalar*normal_x, a1_scalar*normal_y, a1_scalar*normal_z])
					
					addToVector3(celebodies[bI].a, result_a)
					break
				} 
			}
			// tcomputeA += (new Date() - t1)
			
			stack.push(node)
			index = 0
			// debugger
			node = node.q[node.nodeIdx[index]]
		}
		node = stack.pop()

		parent = node.parent
		if(!parent)
			return
		index = parent.nodeIdx.indexOf(parent.q.indexOf(node))

		while(node && index == parent.nodeIdx.length - 1) {
			node = stack.pop()
			if(!node.parent)
				return
			parent = node.parent
			index = parent.nodeIdx.indexOf(parent.q.indexOf(node))
			
		}
		// node = stack[stack.length - 1]

		node = parent.q[parent.nodeIdx[++index]]
	}
}
var level = 3, nodeNum = (Math.pow(8, level) - 1) / 7
var boundInput = new Float32Array(nodeNum * 4) // center and half
var CMInput = new Float32Array(nodeNum * 4) // center of mass and mass
var typeInput = new Float32Array(nodeNum * 4) // 

var arrComptCount = []
var arrToCompt
function initArr() {
	// 初始化
	// for(var i = 0; i < nodeNum * 4; i += 4) {
		
	// 	typeInput[i] = -1 // index of p1
	// 	typeInput[i + 1] = -1 // index of p2
	// 	typeInput[i + 2] = -1 // index of p3, -1 means empty
	// 	typeInput[i + 3] = -1 // type (leaf)
	// }
	var pNum = celebodies.length
	for(var i = 0; i < pNum; i ++) {
		arrComptCount[i] = 0
	}
	arrToCompt = new Float32Array(tNodeNum * pNum * 4)

}

function turnTreeToArr2(bI, node) {
	if(node.isLeaf()) {
		// If node is a leaf node
		var nodeids = node.items.ids 
		for (var k = 0; k < nodeids.length; k++) {
			if (bI != nodeids[k]) { // Skip self
				var m = celebodies[nodeids[k]].m, p = celebodies[nodeids[k]].position
				var index = (tNodeNum * bI + arrComptCount[bI]) * 4
				arrToCompt[index] = p[0]
				arrToCompt[index+1] = p[1]
				arrToCompt[index+2] = p[2]
				arrToCompt[index+3] = m
				arrComptCount[bI]++
			}
		}
	} else {
		var s = 2 * node.bounds.half
		var d = disOf2p(celebodies[bI].position, node.items.CoM)
		if (s / d < BH_THETA) {
			// var m1 = celebodies[bI].m, p1 = celebodies[bI].position
			var	m = node.items.mass, p = node.items.CoM
			var index = (tNodeNum * bI + arrComptCount[bI]) * 4
			arrToCompt[index] = p[0]
			arrToCompt[index+1] = p[1]
			arrToCompt[index+2] = p[2]
			arrToCompt[index+3] = m
			arrComptCount[bI]++
		} 
	}
}

function computeInItor(bI, node) {
	if(node.isLeaf()) {
		// If node is a leaf node
		var nodeids = node.items.ids 
		for (var k = 0; k < nodeids.length; k++) {
			if (bI != nodeids[k]) { // Skip self
				// console.time('oneParticle');
				// var result_a = computeAcceleOf2(G, celebodies[bI], 
				// 	celebodies[nodeids[k]], false)
				var m1 = celebodies[bI].m, m2 = celebodies[nodeids[k]].m, 
				p1 = celebodies[bI].position, p2 = celebodies[nodeids[k]].position;

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
				var result_a = new Float32Array([a1_scalar*normal_x, a1_scalar*normal_y, a1_scalar*normal_z])
				
				// console.timeEnd('oneParticle');
				addToVector3(celebodies[bI].a, result_a)
			}
		}
	} else {
		var s = 2 * node.bounds.half
		var d = disOf2p(celebodies[bI].position, node.items.CoM)
		if (s / d < BH_THETA) {
			var m1 = celebodies[bI].m, p1 = celebodies[bI].position,
				m2 = node.items.mass, p2 = node.items.CoM
			// var result_a = computeAcceleOf2directly(G, m1, p1, m2, p2, false)
			
			var a1 = null, a2 = null

			var dif_x = p2[0]-p1[0], dif_y = p2[1]-p1[1], dif_z = p2[2]-p1[2];
			var sq_dis = dif_x*dif_x+dif_y*dif_y+dif_z*dif_z;// 距离平方
			var GdivsqDis = G / sq_dis
			var dis = Math.sqrt(sq_dis);
			var a1_scalar = GdivsqDis * m2;
			
			var normal_x = dif_x/dis, normal_y = dif_y/dis, normal_z = dif_z/dis;
			
			var result_a = new Float32Array([a1_scalar*normal_x, a1_scalar*normal_y, a1_scalar*normal_z])
			
			addToVector3(celebodies[bI].a, result_a)
			return true
		} 
	}
}

function initParticles() {

	var geometry = new THREE.BufferGeometry();
	PARTICLES = celebodies.length
	var positions = new Float32Array( PARTICLES * 3 );
	var p = 0;

	for ( var i = 0; i < PARTICLES; i++ ) {

		positions[ p++ ] = celebodies[i].position[0]
		positions[ p++ ] = celebodies[i].position[1]
		positions[ p++ ] = celebodies[i].position[2]

	}

	var uvs = new Float32Array( PARTICLES * 2 );
	p = 0;

	for ( var j = 0; j < 1; j++ ) {

		for ( var i = 0; i < PARTICLES; i++ ) {

			uvs[ p++ ] = (i+0.5) / PARTICLES;
			uvs[ p++ ] = (j+0.5) / 1;

		}

	}

	geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
	geometry.addAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ) );
	
	// var texture = new THREE.TextureLoader().load('examples/textures/sprites/earth.jpg')
	// texture.wrapS = THREE.RepeatWrapping;
	// texture.wrapT = THREE.RepeatWrapping;
	particleUniforms = {
		texturePosition: { value: null },
		textureVelocity: { value: null },
		cameraConstant: { value: window.innerHeight / ( Math.tan( THREE.Math.DEG2RAD * 0.5 * camera.fov ) / camera.zoom ) },// 相机常数
		density: { value: 0.0 },
		// texture: { value: texture }
	};

	// ShaderMaterial
	pmaterial = new THREE.ShaderMaterial( {
		uniforms:       particleUniforms,
		vertexShader:   document.getElementById( 'octParticleVert' ).textContent,
		fragmentShader: document.getElementById( 'octParticleFrag' ).textContent
	} );

	pmaterial.extensions.drawBuffers = true;

	var particles = new THREE.Points( geometry, pmaterial );
	particles.matrixAutoUpdate = false;
	particles.updateMatrix();

	scene.add( particles );

}

function turnTreeToArr(bI, node, stack) {
	var index, sibIndex, deep = stack.length
	if(deep == 0) { // root
		index = 0
		
	} else if(deep == 1) {
		index = 1 + stack[0].q.indexOf(node)
	} else {
		index = 0
		for(var i = 0; i < deep - 1; i ++) {
			sibIndex = stack[i].q.indexOf(stack[i + 1])
			index = index * 8 + sibIndex + 1
		}
		index = index * 8 + 1 + stack[deep - 1].q.indexOf(node)
	}
	index *= 4
	boundInput[index] = node.bounds.x
	boundInput[index+1] = node.bounds.y
	boundInput[index+2] = node.bounds.z
	boundInput[index+3] = node.bounds.half

	CMInput[index] = node.items.CoM[0]
	CMInput[index+1] = node.items.CoM[1]
	CMInput[index+2] = node.items.CoM[2]
	CMInput[index+3] = node.items.mass

	if(node.isLeaf()) {
		var ids = node.items.ids
		typeInput[index] = typeof ids[0] == 'number' ? ids[0] : -1
		typeInput[index+1] = typeof ids[1] == 'number' ? ids[1] : -1
		typeInput[index+2] = typeof ids[2] == 'number' ? ids[2] : -1
		typeInput[index+3] = 1
	} else
		typeInput[index+3] = 0
}

function initComputeRenderer(nd, cbs) {

	gpuCompute = new GPUComputationRenderer( pw, ph, renderer );

	var dtPosition = gpuCompute.createTexture();
	var dtVelocity = gpuCompute.createTexture();

	dtPosition = createPostx(cbs)
	dtVelocity = createVeltx(cbs)

	velocityVariable = gpuCompute.addVariable( "textureVelocity", document.getElementById( 'octVelFrag' ).textContent, dtVelocity );
	positionVariable = gpuCompute.addVariable( "texturePosition", document.getElementById( 'octPosFrag' ).textContent, dtPosition );
	

	gpuCompute.setVariableDependencies( velocityVariable, [ positionVariable, velocityVariable ] );
	gpuCompute.setVariableDependencies( positionVariable, [ positionVariable, velocityVariable ] );

	positionUniforms = positionVariable.material.uniforms;
	velocityUniforms = velocityVariable.material.uniforms;

	velocityUniforms.gravityConstant = { value: 0.0 };
	velocityUniforms.density = { value: 0.0 };
	velocityUniforms.pNum = {type: "f", value: pNum}
    velocityUniforms.nodeNum = {type: "f", value: tNodeNum}
    var nodeTex = createDataTexture(nd.node, tNodeNum,  cbs.length)
    velocityUniforms.nodeTexture = {type: 't', value: nodeTex}

	var error = gpuCompute.init();

	if ( error !== null ) {

		console.error( error );

	}

}
