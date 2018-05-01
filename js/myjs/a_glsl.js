// setupGpu(latInput, lonInput, oslo);
// gpuImpl();
function gpglsl(WIDTH, HEIGHT, G) {
	var debug = true

	
	this.renderer = renderer || new THREE.WebGLRenderer();
    renderer.setClearColor(0x000000, 1);
    renderer.setSize(WIDTH, HEIGHT);
    renderer.domElement.setAttribute('id', 'renderer');
    document.body.appendChild(renderer.domElement);
     
    this.texture = new THREE.WebGLRenderTarget(WIDTH, HEIGHT, {minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat});
     
    this.textureCamera = new THREE.OrthographicCamera(-WIDTH/2, WIDTH/2, HEIGHT/2, -HEIGHT/2, -100, 100);
    textureCamera.position.z = 10;	
	
   
	
    if (debug) console.log(" --- LATITUDES:")
    if (debug) printArray(latMap.image.data, 4);
	if (debug) console.log(" --- LONGITUDES:")
    if (debug) printArray(lonMap.image.data, 4);
    
    this.textureScene = new THREE.Scene();
    var plane = new THREE.Mesh(
        new THREE.PlaneGeometry(WIDTH, HEIGHT)
    );
    plane.position.z = -10;
    this.plane = plane
    textureScene.add(plane);

    function computeAcceleration(posX, posY, posZ, mass, celebodies) {

    	var posxMap = createMap(posX);
	    var posyMap = createMap(posY);
	    var poszMap = createMap(posZ);
	    var massMap = createMap(mass);

	    this.plane.material = textureGeneratorMaterial(posxMap, posyMap, poszMap, massMap)

	    var buffer = new Uint8Array(WIDTH * HEIGHT * 4);
	    var gl = renderer.getContext();
	    gl.readPixels(0, 0, WIDTH, HEIGHT, gl.RGBA, gl.UNSIGNED_BYTE, buffer);
	    if (debug) console.log(" --- OUTPUT:")
    	if (debug) printArray(buffer, 4);

    	for(var i = 0; i < buffer.length; i ++) {
    		var a = new Float32Array([0, 0, 0])
    		var value = fromIEEE754Single([buffer[i], buffer[i+1], buffer[i+2], buffer[i+3]]);
    	}
    }

	function createMap(input) {
		var input8bit = new Uint8Array(WIDTH * HEIGHT * 4);
		
		for (var i = 0; i < WIDTH * HEIGHT; i++){
	        var val = input[i];
	        
	        var valBytes = toIEEE754Single(val);
			
			input8bit[4*i + 0] = valBytes[0];
			input8bit[4*i + 1] = valBytes[1];
			input8bit[4*i + 2] = valBytes[2];
			input8bit[4*i + 3] = valBytes[3];
		}

		var map = new THREE.DataTexture(input8bit, resolution, resolution, THREE.RGBAFormat);
		map.needsUpdate = true;
		
	    return map;
	}

	function textureGeneratorMaterial(posxMap, posyMap, poszMap, massMap) {
	    var vertexShader = "\
	        varying vec2 vUv;\
	        \
	        void main() {\
	            vUv = uv;\
	            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\
	        }\
	    ";
	     
	    var fragmentShader = "\
	        varying vec2 vUv;\n\
	        float width = resolution.x;\n\
			float height = resolution.y;\n\
	        uniform sampler2D posxMap;\n\
	        uniform sampler2D posyMap;\n\
	        uniform sampler2D poszMap;\n\
	        uniform sampler2D massMap;\n\
	        uniform float G;\n\
	        " +
			
			/* Excerpt from http://stackoverflow.com/questions/7059962/how-do-i-convert-a-vec4-rgba-value-to-a-float : */
			"vec4 encode32(float f) {\n\
				float e =5.0;\n\
				\
				float F = abs(f); \n\
				float Sign = step(0.0,-f);\n\
				float Exponent = floor(log2(F)); \n\
				float Mantissa = (exp2(- Exponent) * F);\n\
				Exponent = floor(log2(F) + 127.0) + floor(log2(Mantissa));\n\
				vec4 rgba;\n\
				rgba[0] = 128.0 * Sign  + floor(Exponent*exp2(-1.0));\n\
				rgba[1] = 128.0 * mod(Exponent,2.0) + mod(floor(Mantissa*128.0),128.0);  \n\
				rgba[2] = floor(mod(floor(Mantissa*exp2(23.0 -8.0)),exp2(8.0)));\n\
				rgba[3] = floor(exp2(23.0)*mod(Mantissa,exp2(-15.0)));\n\
				return rgba;\n\
			}\n\
			float decode32(vec4 rgba) {\n\
				float Sign = 1.0 - step(128.0,rgba[0])*2.0;\n\
				float Exponent = 2.0 * mod(rgba[0],128.0) + step(128.0,rgba[1]) - 127.0; \n\
				float Mantissa = mod(rgba[1],128.0)*65536.0 + rgba[2]*256.0 +rgba[3] + float(0x800000);\n\
				float Result =  Sign * exp2(Exponent) * (Mantissa * exp2(-23.0 )); \n\
				return Result;\n\
			}\n" +
			/* End exceprt */
	        "\
	        void main() {\n\
	            vec2 vUvInverted = vec2(vUv.x, 1.0-vUv.y);\n\
				\
				vec4 posxBytes = texture2D(posxMap, vUvInverted)*255.0;\n\
				vec4 posyBytes = texture2D(posyMap, vUvInverted)*255.0;\n\
				vec4 poszBytes = texture2D(poszMap, vUvInverted)*255.0;\n\
				\
				float x = decode32(vec4(posxBytes.r, posxBytes.g, posxBytes.b, posxBytes.a));\n\
	            float y = decode32(vec4(posyBytes.r, posyBytes.g, posyBytes.b, posyBytes.a));\n\
	            float z = decode32(vec4(poszBytes.r, poszBytes.g, poszBytes.b, poszBytes.a));\n\
	            \
				/*TODO: Convert lat/lon to 3D coordinates to get the real distance*/\
				\
				vec3 pos = vec3(x, y, z);\n\
	            float distance = 0.0;\n\
				\
				vec3 acceleration = vec3( 0.0 );\n\
				for (float i = 0.5; i < width; i++) {\n\
					for (float j = 0.5; j < height; j++) {\n\
						vec2 othercoord = vec2(i/width, 1.0-(j/height));\n\
						vec4 otherposxBytes = texture2D(posxMap, othercoord)*255.0;\n\
						vec4 otherposyBytes = texture2D(posyMap, othercoord)*255.0;\n\
						vec4 otherposzBytes = texture2D(poszMap, othercoord)*255.0;\n\
						vec4 othermassBytes = texture2D(massMap, othercoord)*255.0;\n\
						\
						float otherx = decode32(vec4(otherposxBytes.r, otherposxBytes.g, otherposxBytes.b, otherposxBytes.a));\n\
			            float othery = decode32(vec4(otherposyBytes.r, otherposyBytes.g, otherposyBytes.b, otherposyBytes.a));\n\
			            float otherz = decode32(vec4(otherposzBytes.r, otherposzBytes.g, otherposzBytes.b, otherposzBytes.a));\n\
			            float othermass = decode32(vec4(othermassBytes.r, othermassBytes.g, othermassBytes.b, othermassBytes.a));\n\
						vec3 pos2 = vec3(otherx, othery, otherz);\n\
						\
						vec3 dPos = pos2 - pos;\n\
						float distance = length( dPos );\n\
						float distanceSq = distance * distance;\n\
						float gravityField = G * mass2 / distanceSq;\n\
						acceleration += gravityField * normalize( dPos );\n\
					}\n\
				}\n\
				\
				\
				\
				vec4 accelerationBytes = encode32(acceleration) / 255.0;\n\
				\
				gl_FragColor = vec4(accelerationBytes.x, accelerationBytes.y, accelerationBytes.z, accelerationBytes.w);\n\
				\
	        }\
	    ";
	     
	    var uniforms = {
	    	G: {"type": "f", "value": G},
	        posxMap: {"type": "t", "value": posxMap},
	        posyMap: {"type": "t", "value": posyMap},
	        poszMap: {"type": "t", "value": poszMap},
	        massMap: {"type": "t", "value": massMap}
	    };
	 	var materialShader = new THREE.ShaderMaterial({
	        uniforms: uniforms,
	        vertexShader: vertexShader,
	        fragmentShader: fragmentShader
	    });
	 	materialShader.defines.resolution = 'vec2( ' + WIDTH.toFixed( 1 ) + ', ' + HEIGHT.toFixed( 1 ) + " )";
	    return materialShader;
	}
}
