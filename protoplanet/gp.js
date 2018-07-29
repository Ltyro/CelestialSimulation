
var pw = 2, ph = 2, pNum = pw * ph
var nw = 1, nh = 72, nodeNum
var resolution = 300;
var debug = false
var PARTICLES = 1, WIDTH = 1, HEIGHT = 1

var GP = function(nodeIpt, cbs) {

    
    var material
    var num = cbs ? cbs.length : 64
    PARTICLES = pNum
    WIDTH = pw, HEIGHT = ph
    var level = 3, nh = (Math.pow(8, level) - 1) / 7
    nodeNum = nh

	
	
	// for(var i = 0; i < 10; i ++) {
	// 	render()
	// }
	// console.log("gpu计算结果:");
	// readPix()


	function render() {
		
    	this.computeV()
    	this.computeP()
	}
}

GP.prototype.init = function(nd, cbs) {
	var tScene, tRenderer, tCamera, uniforms
    var plane, vMat, pMat


	tRenderer = window.tRenderer || new THREE.WebGLRenderer();
	this.tRenderer = tRenderer
    // renderer.setClearColor(0x000000, 1);
    tRenderer.setSize(resolution, resolution);
    // tRenderer.domElement.setAttribute('id', 'renderer');
    // document.body.appendChild(tRenderer.domElement);
    var width = pw, height = ph
    
    tCamera = new THREE.OrthographicCamera(-width/2, width/2, height/2, -height/2, -100, 100);
    tCamera.position.z = 10;	
	this.tCamera = tCamera
	var pos = createPostx(cbs)
	var vel = createVeltx(cbs)
	
 //    var nodeTex = {
	// 	boundTex: createDataTexture(nd.boundIpt, nw, nh),
	// 	CMTex: createDataTexture(nd.CMIpt, nw, nh),
	// 	typeTex: createDataTexture(nd.typeIpt, nw, nh),
	// }
	// var nodeTex = createDataTexture(nd.node, tNodeNum, pNum)
    this.tScene = tScene = new THREE.Scene();
    
    this.uniforms = uniforms = {
        pNum: {type: "f", value: pNum},
        // nodeNum: {type: "f", value: tNodeNum},
        posTexture: {"type": "t", "value": pos},
        velTexture: {"type": "t", "value": vel}, 
        // nodeTexture: {type: 't', value: nodeTex}
    };
    this.vMat = generateMat(uniforms, 'Vert', 'VelFrag')
    this.vMat.defines.nodesNum = pNum.toFixed(1)
    this.pMat = generateMat(uniforms, 'Vert', 'PosFrag')

    this.plane = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height)
    );
    this.plane.position.z = -10;
    tScene.add(this.plane);

    this.pTarget = new THREE.WebGLRenderTarget(pw, ph, {minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat});
    this.vTarget = new THREE.WebGLRenderTarget(pw, ph, {minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat});

    this.target1 = new THREE.WebGLRenderTarget(pw, ph, {minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat}),
    this.target2 = new THREE.WebGLRenderTarget(pw, ph, {minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat})
    this.currentTarget = this.target1
}

GP.prototype.computeV = function() {
	this.plane.material = this.vMat
	this.tRenderer.render(this.tScene, this.tCamera, this.vTarget)
	this.uniforms.velTexture.value = this.vTarget.texture
	// this.readPix()
	return this.vTarget.texture
}

GP.prototype.computeP = function() {
	this.plane.material = this.pMat

	this.tRenderer.render(this.tScene, this.tCamera, this.currentTarget)
	var result = this.uniforms.posTexture.value = this.currentTarget.texture
	this.readPix()
	this.currentTarget = this.currentTarget == this.target1 ? this.target2 : this.target1
	return result
	
}

GP.prototype.readPix = function() {
	var readWidth = pw, readHeight = ph
    var buffer = new Uint8Array(readWidth * readHeight * 4);

    var gl = this.tRenderer.getContext();
    gl.readPixels(0, 0, readWidth, readHeight, gl.RGBA, gl.UNSIGNED_BYTE, buffer);
    console.log(buffer)
}
 
function generateMat(uniforms, vert, frag) {
    var vertexShader = document.getElementById( vert ).textContent
    // var vertexShader = getPassThroughVertexShader()
    var fragmentShader = document.getElementById( frag ).textContent
    
    
    return new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader
    });
}

function createPostx(cbs) {
	var l = cbs ? cbs.length : pNum
	var input = new Float32Array(l * 4)
	for(var i = 0; i < l; i ++) {
		var cbp = cbs ? cbs[i].position : [100, 0, 0]
		input[4*i] = cbp[0]
		input[4*i + 1] = cbp[1]
		input[4*i + 2] = cbp[2]
	}
	console.log('位置: ')
	// console.log(input)
	return createDataTexture(input, pw, ph)
}

function createVeltx(cbs) {
	var l = cbs ? cbs.length : pNum
	var input = new Float32Array(l * 4)
	for(var i = 0; i < l; i ++) {
		var cbv = cbs ? cbs[i].v : [1, 0, 0, 100]
		input[4*i] = cbv[0]
		input[4*i + 1] = cbv[1]
		input[4*i + 2] = cbv[2]
		input[4*i + 3] = cbs ? cbs[i].m : cbv[3]
	}
	return createDataTexture(input, pw, ph)
}

function createDataTexture(input, w, h) {
	var map = new THREE.DataTexture(input, w, h, THREE.RGBAFormat, THREE.FloatType);
	map.magFilter = map.minFilter = THREE.NearestFilter
	map.needsUpdate = true;
	return map;
}
/**
 * node texture
 */
function createNodeTex() {

	var boundInput = new Float32Array(nodeNum * 4) // center and half
	var CMInput = new Float32Array(nodeNum * 4) // center of mass and mass
	var typeInput = new Float32Array(nodeNum * 4) // 
	
	for(var i = 0; i < nodeNum * 4; i += 4) {
		boundInput[i] = 0// x of center
		boundInput[i + 1] = 0// y
		boundInput[i + 2] = 0// z
		boundInput[i + 3] = 50// half

		CMInput[i] = 10
		CMInput[i + 1] = 0
		CMInput[i + 2] = 0
		CMInput[i + 3] = 200

		// alpha: 1——leaf, store data; 
		//		  0——node, store indexes of the first child and parent;
		//		  -1——not exist, null
		// maxItems: 3
		typeInput[i] = 0 // index of p1
		typeInput[i + 1] = 1 // index of p2
		typeInput[i + 2] = -1 // index of p3, -1 means empty
		typeInput[i + 3] = 1 // type (leaf)
		console.log(typeInput)
	}

	var nodeTex = {
		boundTex: createDataTexture(boundInput, nw, nh),
		CMTex: createDataTexture(CMInput, nw, nh),
		typeTex: createDataTexture(typeInput, nw, nh),
	}
	return nodeTex
}

function getPassThroughVertexShader() {

	return	"void main()	{\n" +
			"\n" +
			"	gl_Position = vec4( position, 1.0 );\n" +
			"\n" +
			"}\n";

}
