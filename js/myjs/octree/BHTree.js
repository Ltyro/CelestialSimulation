var bhtree, BH_THETA = 1;
var farest = 0
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
	for(var i = 0; i < array.length; i ++) {
		this.root.insert(i, array, 0)
	}
}

BHTree.prototype.destroy = function() {
	// this.root = null
	if(this.root)
		this.root = this.curDeleteNode(this.root)
}

BHTree.prototype.reset = function() {
	this.destroy()
	var bounds = new Bounds3(0, 0, 0, 20000)
	this.root = new TreeNode(bounds)
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
	var mass = 1e6
	var planettx = txloader.load('resource/textures/planets/earth.jpg')
	var mat = new THREE.MeshLambertMaterial({
					map: planettx,
					overdraw: 0.5 
				})

	n = WIDTH * HEIGHT, posR = 5000, randomVel = 10;
	// for(var i = 0; i < WIDTH; i ++) {
	// 	for(var j = 0; j < HEIGHT; j ++) {
	// 		var v = new Float32Array([randomVel*(Math.random()-0.5), randomVel*(Math.random()-0.5), randomVel*(Math.random()-0.5)]);
	// 		var pos = new Float32Array([posR*(Math.random()-0.5), posR*(Math.random()-0.5), posR*(Math.random()-0.5)]);
	// 		var cb = new Celebody(i*100+j, mass, v, pos);
	// 		cb.mesh.material = mat
	// 		cbs.push(cb);
	// 	}
	// }
	var cb = new Celebody(1, 100, new Float32Array([0, 0, 0]), new Float32Array([100, 100, 100]));
	cb.mesh.material = mat, cbs.push(cb)
	cb = new Celebody(1, 100, new Float32Array([0, 0, 0]), new Float32Array([200, 100, 100]));
	cb.mesh.material = mat, cbs.push(cb)
	cb = new Celebody(1, 100, new Float32Array([0, 0, 0]), new Float32Array([-100, 100, 100]));
	cb.mesh.material = mat, cbs.push(cb)
	cb = new Celebody(1, 100, new Float32Array([0, 0, 0]), new Float32Array([-300, 100, 100]));
	cb.mesh.material = mat, cbs.push(cb)
	addCelebody(cbs);
	document.getElementById('ptotalnum').innerText = WIDTH * HEIGHT;
}

function bh_init() {

	initCelebodies()

	bhtree = new BHTree()
	bhtree.buildTree(celebodies)
	console.log(bhtree.root)
	// turn tree to arr
	doBHtreeIter(0, bhtree.root, turnTreeToArr)
}

function bh_render() {
	// orbitControls.update()
	// var interval = clock.getDelta()
	// var dn = 10, ddn = interval / dn
	// //planet
	// if(ddn)
	// 	for(var i = 0; i < dn; i ++) {
	// 		if(true)
	// 			bh_planetsMove(ddn /** 20000*/)
			
	// 	}

	// if((~~((new Date() - t_start) / 1000)%3) == 0) {
	// 	calcu_E(celebodies)
	// }
	// renderer.render( scene, camera )
}

function bh_planetsMove(dt) {
	// console.time('bh_computeA');
	bh_computeA()
	// console.timeEnd('bh_computeA');
	calcu_p(dt)
	calcu_v(dt)

}

function bh_computeA() {
	// console.time('build')
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
	
	var index = 0, length = 7
	while(node || stack.length != 0 || index <= length) {
		
		while(node != null) {
			// do sth
			var bk = handler(bI, node)
			if(bk)
				break

			stack.push(node)
			index = 0
			node = node.q[index]
		}
		while(index == length) {
			node = stack.pop()
			if(!node.parent)
				return
			index = node.parent.q.indexOf(node)
			
		}
		node = stack[stack.length - 1]

		node = node.q[++index]
	}
}

function turnTreeToArr(bI, node) {
	var level = 2, nodeNum = (Math.pow(8, level) - 1) / 7
	var boundInput = new Float32Array(nodeNum * 4) // center and half
	var CMInput = new Float32Array(nodeNum * 4) // center of mass and mass
	var typeInput = new Float32Array(nodeNum * 4) // 


	var nodeIpt = {
		bound: boundInput,
		CM: CMInput,
		type: typeInput
	}
	return nodeIpt
}

function computeInItor(bI, node) {
	if(node.isLeaf()) {
		// If node is a leaf node
		var nodeids = node.items.ids 
		for (var k = 0; k < nodeids.length; k++) {
			if (bI != nodeids[k]) { // Skip self
				// console.time('oneParticle');
				var result_a = computeAcceleOf2(G, celebodies[bI], 
					celebodies[nodeids[k]], false)
				// console.timeEnd('oneParticle');
				addToVector3(celebodies[bI].a, result_a.a1)
			}
		}
	} else {
		var s = 2 * node.bounds.half
		var d = disOf2p(celebodies[bI].position, node.items.CoM)
		if (s / d < BH_THETA) {
			var m1 = celebodies[bI].m, p1 = celebodies[bI].position,
				m2 = node.items.mass, p2 = node.items.CoM
			var result_a = computeAcceleOf2directly(G, m1, p1, m2, p2, false)
			addToVector3(celebodies[bI].a, result_a.a1)
			return true
		} 
	}
}
