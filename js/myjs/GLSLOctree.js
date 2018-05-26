
var pw = 1, ph = 6, pNum = pw * ph
var nw = 1, nh = 72, nodeNum = nw * nh
var resolution = 300;
var debug = false

function glsloctree(nodeIpt, cbs) {
    
   
    var num = cbs.length
    ph = num
    var level = 3, nh = (Math.pow(8, level) - 1) / 7
	setupGpu(nodeIpt, cbs);
	console.log("加速度gpu计算结果:");
    var result = gpuImpl();

}


function setupGpu(nd, cbs) {
	renderer = window.renderer || new THREE.WebGLRenderer();
    // renderer.setClearColor(0x000000, 1);
    renderer.setSize(resolution, resolution);
    renderer.domElement.setAttribute('id', 'renderer');
    document.body.appendChild(renderer.domElement);
    var width = pw, height = ph
    
    textureCamera = new THREE.OrthographicCamera(-width/2, width/2, height/2, -height/2, -100, 100);
    textureCamera.position.z = 10;	
	
	var pos = createPostx(cbs)
	var vel = createVeltx(cbs)
	
    var nodeTex = {
		boundTex: createDataTexture(nd.boundIpt, nw, nh),
		CMTex: createDataTexture(nd.CMIpt, nw, nh),
		typeTex: createDataTexture(nd.typeIpt, nw, nh),
	}
    textureScene = new THREE.Scene();
    var plane = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height), 
        textureGeneratorMaterial(pos, vel, nodeTex)
    );
    plane.position.z = -10;
    textureScene.add(plane);
}

function gpuImpl() {
	var renderTarget = new THREE.WebGLRenderTarget(pw, ph, {minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat});
     
	renderer.render(textureScene, textureCamera, renderTarget, true);
	var readWidth = pw, readHeight = ph
    var buffer = new Uint8Array(readWidth * readHeight * 4);
    var gl = renderer.getContext();
    gl.readPixels(0, 0, readWidth, readHeight, gl.RGBA, gl.UNSIGNED_BYTE, buffer);
    
    if (debug) console.log(" --- OUTPUT:")
    if (debug) printArray(buffer, 4);
	
	var count = 0;
	// console.log(buffer)
	var result = buffer
	
	console.log(result)
	return result;
}

 
function textureGeneratorMaterial(pos, vel, nodeTex) {
    var vertexShader = document.getElementById( 'octVert' ).textContent
     
    var fragmentShader = document.getElementById( 'octFrag' ).textContent
    fragmentShader = 'const float rsl = ' + resolution + '.0;' + fragmentShader
    var uniforms = {
        resolution: {type: "f", value: resolution},
        // G: {type: "f", value: G},
        pNum: {type: "f", value: ph},
        nodeNum: {type: "f", value: nh + 1},
        posTexture: {"type": "t", "value": pos},
        velTexture: {"type": "t", "value": vel},
        boundTex: {'type': '1t', 'value': nodeTex.boundTex},
        CMTex: {'type': 't', 'value': nodeTex.CMTex},
        typeTex: {'type': 't', 'value': nodeTex.typeTex} 
    };
    return new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader
    });
 //    return new THREE.MeshBasicMaterial( {
	//     color: 0xff0000,
	//     transparent: true, 
	//     opacity: 0.8,
	// } );
}

function createPostx(cbs) {
	var l = cbs.length
	var input = new Float32Array(l * 4)
	for(var i = 0; i < l; i ++) {
		input[4*i] = cbs[i].position[0]
		input[4*i + 1] = cbs[i].position[1]
		input[4*i + 2] = cbs[i].position[2]
	}
	console.log('位置: ')
	console.log(input)
	return createDataTexture(input, pw, ph)
}

function createVeltx(cbs) {
	var l = cbs.length
	var input = new Float32Array(l * 4)
	for(var i = 0; i < l; i ++) {
		input[4*i] = cbs[i].v[0]
		input[4*i + 1] = cbs[i].v[1]
		input[4*i + 2] = cbs[i].v[2]
		input[4*i + 3] = cbs[i].m
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

