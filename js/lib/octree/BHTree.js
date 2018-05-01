function BHTree(r, x, y, z) {
	var x = x || 0, 
		y = y || 0, 
		z = z || 0, 
		half = r || 5000
	var bounds = new Bounds3(x, y, z, half)
	this.root = new TreeNode(bounds)
}

BHTree.prototype.buildTree(array) {
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

BHTree.prototype.