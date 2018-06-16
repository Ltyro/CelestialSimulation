var isPause = false, timeConversion, cbAdded

function Controller() {
	var self = this
	this.cps = 10
	this.speed = 200000
	this.timeConversion = [
		{name: 'ms', value: 0.001},
		{name: 'sec', value: 1},
		{name: 'min', value: 60},
		{name: 'hour', value: 3600},
		{name: 'days', value: 86400},
		{name: 'month', value: 2592000},
		{name: 'year', value: 31536000},
	]
	this.timeIndex = 1

	document.body.onload = onBodyLoad
	
	function onBodyLoad() {
		var pause = document.getElementById('pause')
		pause.onclick = function() {
			if(pause.innerText == '暂停') {
				isPause = true
				pause.innerText = '开始'
			} else {
				isPause = false
				pause.innerText = '暂停'
			}
		}
		var range = document.getElementById('timeRangeIpt')
		range.onmousedown = function() {
			self.changespeedIt = setInterval(function() {
				if(self.speed < 0.001)
					return
				var interval = (range.value - 50) / 500

				self.speed += interval * self.timeConversion[self.timeIndex].value
				self.getTimePS()
			}, 10)
		}

		range.onmouseup = function() {
			clearInterval(self.changespeedIt)
		}

		range.onchange = function() {
			this.value = 50
		}

		var add = document.getElementById('add')
		add.onclick = function() {
			var id = celebodies.length > 0 ? 
					celebodies[celebodies.length - 1].id + 1 :
					0
			var v = new Float32Array([0, 0, 0]), pos = new Float32Array([0, 0, 0]);
			cbAdded = new Celebody(id, M_EARTH, v, pos, CommomParam.R_EARTH);
			cbAdded.setMaterial(createMaterial('resource/textures/planets/earth.jpg'))
			cbAdded.setName('planet'+id)
			renderer.domElement.style.cursor = 'move'
			self.addOutline(cbAdded.mesh)
			celebodyManager.add2scene(cbAdded)
		}

		container.addEventListener('mousemove', function(event) {
			if(cbAdded) {
				var pos = screenTo3DCoord(event)
				cbAdded.mesh.position.copy(pos)
				cbAdded.setPosFromThree()
				renderer.domElement.style.cursor = 'move'
			}
		})

		container.addEventListener('click', function(event) {
			if(cbAdded) {
				celebodyManager.add2array(cbAdded)
				self.removeOutline(cbAdded.mesh)
				cbAdded = null
				renderer.domElement.style.cursor = 'auto'
			}

		})

		var select = document.getElementById('mode')
		select.onchange = function() {
			mode = select.options[select.selectedIndex].value
			self.restart(mode)
		}

		var pnumipt = document.getElementById('pnum')
		pnumipt.onkeydown = function(evt) {
			if(evt.code == 'Enter') {
				WIDTH = 1
				HEIGHT = pnumipt.value
				select.onchange()
			}
		}
	}

}


Controller.prototype.getTimePS = function() {
	var tc = this.timeConversion, ctt = this.timeIndex
	var t = this.speed / tc[ctt].value
	while( ctt < tc.length - 1 && this.speed > tc[ctt+1].value ) {
		this.timeIndex++
		ctt = this.timeIndex
		// t = this.speed / tc[ctt].value
	}
	while( ctt > 0 && t < 1 ) {
		this.timeIndex--
		ctt = this.timeIndex
		// t = this.speed / tc[ctt].value
	}
	t = this.speed / tc[ctt].value
	return t
}
Controller.prototype.getTimeType = function() {
	return this.timeConversion[this.timeIndex].name
}
Controller.prototype.update = function() {
	var t = this.getTimePS().toFixed(3)
	$('#scaleSpan').text(t)
	$('#conversionSpan').text(this.getTimeType()+'/sec')
}
Controller.prototype.addOutline = function(mesh) {
	outlinePass.selectedObjects.push(mesh)
}
Controller.prototype.removeOutline = function(mesh) {
	var outlineObjs = outlinePass.selectedObjects
	for(var i = 0; i < outlinePass.length; i ++) {
		if(outlineObjs[i] == mesh) {
			outlineObjs.splice(i, 1)
			return
		}
	}
}

Controller.prototype.restart = function(mode) {
	celebodyManager.clear()
	RUN[mode].init()
}

function screenTo3DCoord(event) {
	var vector = new THREE.Vector3();

	vector.set(
	    ( event.clientX / window.innerWidth ) * 2 - 1,
	    - ( event.clientY / window.innerHeight ) * 2 + 1,
	    0.5 );

	vector.unproject( camera );

	var dir = vector.sub( camera.position ).normalize();

	var distance = - camera.position.z / dir.z;

	var pos = camera.position.clone().add( dir.multiplyScalar( distance ) );
	return pos
}

function upgradeInfoWindow() {
	
	infoWindowCB
	$('#celeName').text(infoWindowCB.name)
	var p = infoWindowCB.position
	$('#px').val((p[0] * INVERTSCALE).toFixed(2)+'e8')
	$('#py').val((p[1] * INVERTSCALE).toFixed(2)+'e8')
	$('#pz').val((p[2] * INVERTSCALE).toFixed(2)+'e8')

	var v = infoWindowCB.v
	$('#vx').val((v[0]).toFixed(2))
	$('#vy').val((v[1]).toFixed(2))
	$('#vz').val((v[2]).toFixed(2))

	var a = infoWindowCB.a
	$('#ax').val((a[0]*1e8).toFixed(2)+'e-8')
	$('#ay').val((a[1]*1e8).toFixed(2)+'e-8')
	$('#az').val((a[2]*1e8).toFixed(2)+'e-8')

	$('#radiusInfo').val(infoWindowCB.r)
	$('#massInfo').val(infoWindowCB.m)
	$('#densityInfo').val(infoWindowCB.density)
}