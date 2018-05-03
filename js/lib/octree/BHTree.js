var bhtree, BN_THETA = 0.5;

function BHTree(r, x, y, z) {
	var x = x || 0, 
		y = y || 0, 
		z = z || 0, 
		half = r || 50000
	var bounds = new Bounds3(x, y, z, half)
	this.root = new TreeNode(bounds)
}

BHTree.prototype.buildTree = function(array) {
	this.destroy()
	
	this.root.insert(array)

}

BHTree.prototype.destroy = function() {
	this.root = null
	// this.curDeleteNode(this.root)
}

BHTree.prototype.curDeleteNode = function(node) {
	if(node.q[0]) {
		for(var i = 0; i < node.q.length; i ++)
			this.curDeleteNode(q[i])
	}
	node.items = null
	node = null
}

BHTree.prototype.printTree = function() {
	console.log(this.root)
}

// BHTree.prototype.

function bh_init() {

	initCelebodies()

	bhtree = new BHTree()
	bhtree.buildTree(celebodies)
}

function bh_render() {
	var interval = clock.getDelta()
	var dn = 10, ddn = interval / dn
	//planet
	if(ddn)
		for(var i = 0; i < dn; i ++) {
			if(true)
				bh_planetsMove(ddn /** 20000*/)
			// planetMove(interval * 200000, i)
		}
	if((~~((new Date() - t_start) / 1000)%3) == 0) {
		calcu_E(celebodies)
	}
	orbitControls.update()
	renderer.render( scene, camera )
}

function bh_planetsMove(dt) {

	bh_computeA()
	calcu_p(dt)
	calcu_v(dt)

}

function bh_computeA() {
	bhtree.buildTree(celebodies)

	for (var i = 0; i < celebodies.length; i++) {
		// For each body
		doBHtreeRecurse(i, bhtree.root)
	}
}

function doBHtreeRecurse(bI, node) {
	var nodeids = node.items.ids
	if (node.isLeaf()) {
		// If node is a leaf node
		for (var k = 0; k < nodeids.length; k++) {
			if (bI != nodeids[k]) { // Skip self
				
				var result_a = computeAcceleOf2(G, celebodies[bI], 
					celebodies[nodeids[k]], false)
				celebodies[bI].a = result_a.a1
			}
		}
	} else {
		var s = 2 * node.bounds.harf
		var d = disOf2p(celebodies[bI].position, node.items.CoM)
		if (s / d < BN_THETA) {
			var m1 = celebodies[bI].m, p1 = celebodies[bI].position,
				m2 = node.items.mass, p2 = node.items.CoM
			var result_a = computeAcceleOf2directly(G, m1, p1, m2, p2, false)
			celebodies[bI].a = result_a.a1
			
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