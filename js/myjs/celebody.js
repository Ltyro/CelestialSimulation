/**
 * 天体
 * @param v: 初速度
 */
var Celebody = function(id, m, v, p, r) {
	this.id = id || 0
	this.m = m || 0 													// 质量
	this.v = v || new Float32Array([0, 0, 0]) 							// 速度
	this.v_scalar = v ? Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]) : 0	// 速度大小
	this.position = p || new Float32Array([0, 0, 0])				// 位置
	this.r = r || 1													// 天体半径
	this.a = new Float32Array([0, 0, 0])								// 加速度
	this.init()
}

Celebody.prototype.init = function() {
	var m = this.m
	// var F = this.F, 
	// var a = new Float32Array([F[0]/m, F[1]/m, F[2]/m]) 	// 加速度

	// this.a = a
	// this.a_scalar =Math.sqrt(a[0]*a[0]+a[1]*a[1]+a[2]*a[2])

	this.density = 3*this.m / (4*Math.PI*this.r*this.r*this.r)

	this.geoR = 30
	var geo = new THREE.SphereGeometry(this.geoR, 15, 15)
	// var planettx = txloader.load('resource/textures/planets/earth.jpg')
	// var mat = new THREE.MeshLambertMaterial({
	// 				map: planettx,
	// 				overdraw: 0.5 
	// 			})
	var mesh = new THREE.Mesh(geo/*, mat*/)
	var pos = this.position
	mesh.position = new THREE.Vector3(pos[0], pos[1], pos[2])

	this.geometry = geo
	// this.material = mat
	this.mesh = mesh

}

Celebody.prototype.computeV = function() {
	var v = this.v
	this.v_scalar = Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2])
}

Celebody.prototype.resetV = function() {
	this.v[0] = 0, this.v[1] = 0, this.v[2] = 0
}

Celebody.prototype.reDraw = function() {
	if(this.mesh) {
		var geo = new THREE.SphereGeometry(this.r, 15, 15)
		this.mesh.geometry = this.geometry = geo
	}
}

Celebody.prototype.setPosition = function() {
	if(this.mesh)
		this.mesh.position.fromArray(this.position).multiplyScalar(INVERTSCALE);
}

Celebody.prototype.setPosFromThree = function() {
	var pos = this.mesh.position
	this.position[0] = pos.x * SCALE
	this.position[1] = pos.y * SCALE
	this.position[2] = pos.z * SCALE
}

Celebody.prototype.getX = function() {
	return this.position[0]
}

Celebody.prototype.getY = function() {
	return this.position[1]
}

Celebody.prototype.getZ = function() {
	return this.position[2]
}

Celebody.prototype.getMass = function() {
	return this.m
}

Celebody.prototype.setName = function(name) {
	this.mesh.name = this.name = name
}

Celebody.prototype.setTexture = function(tx) {
	this.mesh.material.map = tx
}

Celebody.prototype.setMaterial = function(mat) {
	this.mesh.material = mat
}
