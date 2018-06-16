var CelebodyManager = function() {
	this.celebodies = celebodies
}

CelebodyManager.prototype.update = function() {
	this.celebodies = celebodies
}

CelebodyManager.prototype.getById = function(id) {
	this.update()
	var cbs = this.celebodies
	for(var i = 0; i < cbs.length; i ++) 
		if(cbs[i].id == id) 
			return cbs[i]
	return null
}

CelebodyManager.prototype.getByMesh = function(mesh) {
	this.update()
	var cbs = this.celebodies
	for(var i = 0; i < cbs.length; i ++) 
		if(cbs[i].mesh == mesh) 
			return cbs[i]
	return null
}

CelebodyManager.prototype.add2scene = function(cb) {
	scene.add(cb.mesh)
}

CelebodyManager.prototype.add2array = function(cb) {
	this.update()
	var cbs = this.celebodies
	cbs.push(cb)
}

CelebodyManager.prototype.add = function(cb) {
	this.add2array(cb)
	this.add2scene(cb)
}

CelebodyManager.prototype.clear = function() {
	var cbs = this.celebodies
	for(var i = 0; i < cbs.length; i ++) {
		var mat = cbs[i].mesh.material
		if(mat.map)
			mat.map.dispose()
		mat.dispose()
		scene.remove(cbs[i].mesh)
	}
	this.celebodies.length = celebodies.length = 0
}