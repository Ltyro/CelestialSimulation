// var raycaster = new THREE.Raycaster();
// var outlinePass = new THREE.OutlinePass( new THREE.Vector2( window.innerWidth, window.innerHeight ), scene, camera );
// var effectFXAA = new THREE.ShaderPass( THREE.FXAAShader );

// var selectedObjects
// initInteractive()
function initInteractive() {
	initDragControls()
	raycaster = new THREE.Raycaster();
	outlinePass = new THREE.OutlinePass( new THREE.Vector2( window.innerWidth, window.innerHeight ), scene, camera );
	
	composer.addPass( outlinePass );
	txloader.load('resource/textures/tri_pattern.jpg', function(texture) {

				outlinePass.patternTexture = texture;
				texture.wrapS = THREE.RepeatWrapping;
				texture.wrapT = THREE.RepeatWrapping;

			});

	var effectFXAA = new THREE.ShaderPass( THREE.FXAAShader );
	effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );
	effectFXAA.renderToScreen = true;
	composer.addPass( effectFXAA );

	window.addEventListener( 'mousemove', onTouchMove );
	window.addEventListener( 'touchmove', onTouchMove );
	window.addEventListener( 'click', function() {
		if(selectedObjects && selectedObjects.length > 0) {
			infoWindowCB = getCBByMesh(selectedObjects[0])
		}
	} );
	window.addEventListener('keydown', function(evt) {
		if(evt.key == 'Delete' && infoWindowCB) {
			dropCB(infoWindowCB)
			infoWindowCB = null
		}
	})
}

function addSelectedObject( object ) {

	selectedObjects = [];
	selectedObjects.push( object );

}
function onTouchMove( event ) {

	var x, y;

	if ( event.changedTouches ) {

		x = event.changedTouches[ 0 ].pageX;
		y = event.changedTouches[ 0 ].pageY;

	} else {

		x = event.clientX;
		y = event.clientY;

	}

	mouse.x = ( x / window.innerWidth ) * 2 - 1;
	mouse.y = - ( y / window.innerHeight ) * 2 + 1;

	checkIntersection();

}

function checkIntersection() {

	raycaster.setFromCamera( mouse, camera );

	var intersects = raycaster.intersectObjects( [ scene ], true );

	if ( intersects.length > 0 ) {

		var selectedObject = intersects[ 0 ].object;
		addSelectedObject( selectedObject );
		// infoWindowCB = getCBByMesh(selectedObject)
		outlinePass.selectedObjects = selectedObjects;

	} else {

		outlinePass.selectedObjects = [];

	}

}

function initDragControls() {
	dragControls = new THREE.DragControls( scene.children, camera, renderer.domElement );
	dragControls.addEventListener( 'dragstart', function ( event ) { orbitControls.enabled = false; } );
	dragControls.addEventListener( 'dragend', function ( event ) { orbitControls.enabled = true; } );
	dragControls.addEventListener( 'drag', function( event ) {
		var cb = getCBByMesh(event.object)
		cb.setPosFromThree()
		// cb.resetV()
	})
}