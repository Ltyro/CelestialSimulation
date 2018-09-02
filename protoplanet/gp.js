
// var pw = 1, ph = 1, pNum = pw * ph
// var nw = 1, nh = 72, nodeNum
// var resolution = 300;
// var debug = false
// var PARTICLES = 1, WIDTH = 1, HEIGHT = 2

var GP = function() {

    
    // var material
    // var num = cbs ? cbs.length : 64
    // PARTICLES = pNum
    // WIDTH = pw, HEIGHT = ph
    // nodeNum = nh

	
	
	// for(var i = 0; i < 10; i ++) {
	// 	render()
	// }
	// console.log("gpu计算结果:");
	// readPix()


	// function render() {
		
 //    	this.computeV()
 //    	this.computeP()
	// }
}

GP.prototype.init = function(renderer, width, height) {
	var tScene, tRenderer, tCamera, uniforms
    var plane, vMat, pMat


	tRenderer = renderer || window.tRenderer || new THREE.WebGLRenderer();
	this.tRenderer = tRenderer
    // renderer.setClearColor(0x000000, 1);
    // tRenderer.setSize(resolution, resolution);
    // tRenderer.domElement.setAttribute('id', 'renderer');
    // document.body.appendChild(tRenderer.domElement);
    WIDTH = width, HEIGHT = height
    
    // tCamera = new THREE.OrthographicCamera(-width/2, width/2, height/2, -height/2, -100, 100);
    tCamera = new THREE.Camera()
    tCamera.position.z = 1;	
	this.tCamera = tCamera
	var pos = createPostx(/*cbs*/)
	var vel = createVeltx(/*cbs*/)
	
 //    var nodeTex = {
	// 	boundTex: createDataTexture(nd.boundIpt, nw, nh),
	// 	CMTex: createDataTexture(nd.CMIpt, nw, nh),
	// 	typeTex: createDataTexture(nd.typeIpt, nw, nh),
	// }
	// var nodeTex = createDataTexture(nd.node, tNodeNum, pNum)
    this.tScene = tScene = new THREE.Scene();
    
    this.uniforms = uniforms = {
        // pNum: {type: "f", value: pNum},
        // nodeNum: {type: "f", value: tNodeNum},
        posTexture: {"type": "t", "value": pos},
        velTexture: {"type": "t", "value": vel}, 
        // nodeTexture: {type: 't', value: nodeTex}
    };
    this.vMat = generateMat(uniforms, 'Vert', 'VelFrag')
    // this.vMat.defines.nodesNum = pNum.toFixed(1)
    this.pMat = generateMat(uniforms, 'Vert', 'PosFrag')

    this.plane = new THREE.Mesh(
        // new THREE.PlaneGeometry(width, height)
        new THREE.PlaneBufferGeometry( 2, 2 )
    );
    // this.plane.position.z = -10;
    tScene.add(this.plane);

    this.pti = this.vti = 0
    this.pTarget = [], this.vTarget = []
    this.pTarget[0] = createRenderTarget(WIDTH, HEIGHT)
    this.pTarget[1] = createRenderTarget(WIDTH, HEIGHT)
    this.vTarget[0] = createRenderTarget(WIDTH, HEIGHT)
	this.vTarget[1] = createRenderTarget(WIDTH, HEIGHT)

    // this.currentTarget = this.pTarget[0]
}

GP.prototype.computeV = function() {
	// this.currentTarget = this.vTarget[this.vti]
	this.vti = this.vti == 0 ? 1 : 0
	this.plane.material = this.vMat
	this.tRenderer.render(this.tScene, this.tCamera, this.vTarget[this.vti])
	var result = this.uniforms.velTexture.value = this.vTarget[this.vti].texture
	
	// this.readPix()
	return result
}

GP.prototype.computeP = function() {

	// this.currentTarget = this.pTarget[this.pti]
	this.pti = this.pti == 0 ? 1 : 0
	this.plane.material = this.pMat
	this.tRenderer.render(this.tScene, this.tCamera, this.pTarget[this.pti])
	var result = this.uniforms.posTexture.value = this.pTarget[this.pti].texture
	
	
	// this.readPix()
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
    
    var material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader
    });
    material.defines.resolution = 'vec2( ' + WIDTH.toFixed( 1 ) + ', ' + HEIGHT.toFixed( 1 ) + " )"
    return material
}

function createPostx(cbs) {
	var l = cbs ? cbs.length : WIDTH * HEIGHT
	var input = new Float32Array(l * 4)
	for(var i = 0; i < l; i ++) {
		var cbp = cbs ? cbs[i].position : [100, 0, 0]
		input[4*i] = cbp[0]
		input[4*i + 1] = cbp[1]
		input[4*i + 2] = cbp[2]
	}
	var r = 1000, rSq = r * r
	
	for(var i = 0; i < l; i++) {
		var x = (2 * Math.random() - 1 ) * r
		var y = (2 * Math.random() - 1 ) * Math.sqrt(rSq - x * x)
		var z = (2 * Math.random() - 1 ) * Math.sqrt(rSq - x * x - y * y)
		input[4*i] = x
		input[4*i + 1] = y
		input[4*i + 2] = z
	}
	console.log('位置: ')
	console.log(input)
	return createDataTexture(input, WIDTH, HEIGHT)
}

function createVeltx(cbs) {
	var l = cbs ? cbs.length : WIDTH * HEIGHT
	var input = new Float32Array(l * 4)
	var maxV = 100, maxM = 100
	for(var i = 0; i < l; i ++) {
		var vx = Math.random() * maxV
		var vy = Math.random() * maxV
		var vz = Math.random() * maxV
		var m = Math.random() * maxM
		var cbv = cbs ? cbs[i].v : [0, 0, 0, m]
		input[4*i] = cbv[0]
		input[4*i + 1] = cbv[1]
		input[4*i + 2] = cbv[2]
		input[4*i + 3] = cbs ? cbs[i].m : cbv[3]
	}
	console.log('速度: ')
	console.log(input)
	return createDataTexture(input, WIDTH, HEIGHT)
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

function createRenderTarget( sizeXTexture, sizeYTexture, wrapS, wrapT, minFilter, magFilter ) {

	sizeXTexture = sizeXTexture || sizeX;
	sizeYTexture = sizeYTexture || sizeY;

	wrapS = wrapS || THREE.ClampToEdgeWrapping;
	wrapT = wrapT || THREE.ClampToEdgeWrapping;

	minFilter = minFilter || THREE.NearestFilter;
	magFilter = magFilter || THREE.NearestFilter;

	var renderTarget = new THREE.WebGLRenderTarget( sizeXTexture, sizeYTexture, {
		wrapS: wrapS,
		wrapT: wrapT,
		minFilter: minFilter,
		magFilter: magFilter,
		// format: THREE.RGBAFormat,
		type: ( /(iPad|iPhone|iPod)/g.test( navigator.userAgent ) ) ? THREE.HalfFloatType : THREE.FloatType,
		// stencilBuffer: false
	} );

	return renderTarget;

};