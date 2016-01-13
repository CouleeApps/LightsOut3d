LightsOut3d = function(x, y) {
	this.windowSize = new THREE.Vector2(x, y);
	this.rotation = new THREE.Matrix4();
	this.stateMaterial = [];
	this.stateMaterial[0] = new THREE.MeshLambertMaterial({color: 0x0000ff, overdraw: 0.5});
	this.stateMaterial[1] = new THREE.MeshLambertMaterial({color: 0xffff00, overdraw: 0.5});
	this.faces = [];
	this.faceMap = {};
	this.mouseDown = false;
	this.mouseDrag = false;
	this.mouseFirst = new THREE.Vector2(0, 0);
	this.mouseLast = new THREE.Vector2(0, 0);
	this.sideSize = 3;
	this.level = 0;
	this.state = LightsOut3d.STATE_MENU;
	this.lastTimestamp = 0;
	this.animation = {state: LightsOut3d.ANIMATION_STATE_SPINNING, spinTime: 10000};
};
LightsOut3d.prototype.createRenderer = function() {
	//Set up the renderer
	this.renderer = new THREE.WebGLRenderer();
	this.renderer.setSize(this.windowSize.x, this.windowSize.y);
	document.body.insertBefore(this.renderer.domElement, document.body.children[0]);
};
LightsOut3d.prototype.createScene = function() {
	//Create our scene for everything
	this.scene = new THREE.Scene();

	//Basic camera is fine
	this.camera = new THREE.PerspectiveCamera(70, this.windowSize.x / this.windowSize.y, 0.1, 1000);

	//Ambient lighting so everything isn't dark
	this.ambient = new THREE.AmbientLight(0x887777);
	this.scene.add(this.ambient);

	//Sun light
	this.sun = new THREE.DirectionalLight(0xccccff);
	this.sun.position.copy(new THREE.Vector3(1, 0.6, 0.2).normalize());
	this.scene.add(this.sun);

	//Backwards sun so stuff has lighting on the backside
	this.backsun = new THREE.DirectionalLight(0x666688);
	this.backsun.position.copy(new THREE.Vector3(-1, -0.6, -0.2).normalize());
	this.scene.add(this.backsun);
};
LightsOut3d.prototype.createBoard = function() {
	//Each should be offset by this much so they center around 0 0 0
	var offset = new THREE.Vector2(-(this.sideSize - 1) / 2, -(this.sideSize - 1) / 2);

	//Create a bunch of plane surfaces
	for (var plane = 0; plane < 6; plane ++) {
		for (var x = 0; x < this.sideSize; x ++) {
			for (var y = 0; y < this.sideSize; y ++) {
				var face = new Face(new THREE.Vector2(x, y), new THREE.Vector2(1, 1), plane);
				this.faces.push(face);
				this.faceMap[face.stringify()] = face;
				this.scene.add(face.createGeometry(this.stateMaterial[0], offset, this.sideSize / 2));
			}
		}
	}

	//Update the camera position to orbit around our cube in the center
	this.camera.position.copy(new THREE.Vector3(0, 0, this.sideSize * 2).applyMatrix4(this.rotation));
	this.camera.setRotationFromMatrix(this.rotation);
};
LightsOut3d.prototype.deleteBoard = function() {
	this.faces.forEach(function(face) {
		this.scene.remove(face.mesh);
	}, this);
	this.faces = [];
};
LightsOut3d.prototype.toggleFace = function(face) {
	var connections = face.getConnections(new THREE.Vector2(0, 0), new THREE.Vector2(this.sideSize - 1, this.sideSize - 1));
	connections.forEach(function(connection) {
		var face = this.faceMap[connection];
		face.setMaterial(this.stateMaterial[face.state ? 0 : 1]);
		face.state = !face.state;
	}, this);
};
LightsOut3d.prototype.scrambleBoard = function(count) {
	for (var i = 0; i < count; i ++) {
		var face = this.faces[Math.floor(Math.random() * this.faces.length)];
		setTimeout(function(game, face) { game.toggleFace(face); }, i * (this.animation.spinTime / count), this, face);
	}
};
LightsOut3d.prototype.isWinning = function() {
	for (var i = 0; i < this.faces.length; i ++) {
		//If they haven't unlit a face, they haven't won
		if (this.faces[i].state)
			return false;
	}
	return true;
};
LightsOut3d.prototype.resetBoard = function() {
	for (var i = 0; i < this.faces.length; i ++) {
		//Only have to reset active ones
		if (this.faces[i].state) {
			this.faces[i].state = false;
			this.faces[i].setMaterial(this.stateMaterial[0]);
		}
	}
};
LightsOut3d.prototype.beginGame = function() {
	if (this.state === LightsOut3d.STATE_ANIMATING)
		return;

	if (this.level === 0) {
		this.animation.spinTime = 1500;
		this.nextLevel();
	} else {
		this.startWinAnimation();
	}
};
LightsOut3d.prototype.nextLevel = function() {
	this.level ++;

	if (this.level > 8 && Math.log2(this.level) === Math.floor(Math.log2(this.level))) {
		this.sideSize ++;
		this.deleteBoard();
		this.createBoard();
	}

	this.resetBoard();
	this.scrambleBoard(this.level);
	$("#title").text("Level " + this.level);

	this.state = LightsOut3d.STATE_ANIMATING;
	this.animation.state = LightsOut3d.ANIMATION_STATE_SPINNING;
	setTimeout(function(game) { game.startLevel(); }, this.animation.spinTime, this);
};
LightsOut3d.prototype.startLevel = function() {
	this.state = LightsOut3d.STATE_PLAYING;
	this.animation.state = LightsOut3d.ANIMATION_STATE_STOPPED;
};
LightsOut3d.prototype.startWinAnimation = function() {
	this.animation.spinTime = 500;
	this.nextLevel();
};
LightsOut3d.prototype.animateToOrientation = function(quat, duration) {
	this.animation.start = new THREE.Quaternion();
	this.animation.start.setFromRotationMatrix(this.rotation);
	this.animation.end = quat;
	this.animation.time = 0;
	this.animation.duration = duration;
	this.animation.state = LightsOut3d.ANIMATION_STATE_INTERPOLATING;
};
LightsOut3d.prototype.init = function() {
	//Initialize the base scene
	this.createScene();

	//Initialize the rendering
	this.createRenderer();

	//Create the actual board
	this.createBoard();

	//Start everything!
	this.render();

	//Set up initial animation
	this.rotation.makeRotationFromQuaternion(new THREE.Quaternion(0, 0, 0, 1).setFromAxisAngle(new THREE.Vector3(0, 0.707, 0.707), Math.PI / 2));

	setInterval(function(game) {
		if (game.state == LightsOut3d.STATE_MENU) {
			var face = game.faces[Math.floor(Math.random() * game.faces.length)];
			game.toggleFace(face);
		}
	}, 1000, this);
};
LightsOut3d.prototype.render = function(timestamp) {
	//Get the delta time
	var deltaTime = 0;
	if (this.lastTimestamp) {
		deltaTime = timestamp - this.lastTimestamp;
	}
	this.lastTimestamp = timestamp;

	//So we can render again
	requestAnimationFrame(this.render.bind(this));

	//Actually render the scene! Hurrah!
	this.renderer.render(this.scene, this.camera);

	if (this.animation.state !== LightsOut3d.ANIMATION_STATE_STOPPED) {
		this.animation.time += deltaTime;
		switch (this.animation.state) {
			case LightsOut3d.ANIMATION_STATE_INTERPOLATING:
				var quat = new THREE.Quaternion();
				quat.copy(this.animation.start);
				quat.slerp(this.animation.end, this.animation.time / this.animation.duration);
				this.rotation.makeRotationFromQuaternion(quat);
				break;
			case LightsOut3d.ANIMATION_STATE_SPINNING:
				this.rotation.multiply(new THREE.Matrix4().makeRotationY(6.28 * (deltaTime / this.animation.spinTime)));
				break;
		}
		if (this.animation.time > this.animation.duration) {
			this.animation.time = this.animation.duration;
			this.animation.state = LightsOut3d.ANIMATION_STATE_SPINNING;
		}
	}

	//Update the camera position to orbit around our cube in the center
	this.camera.position.copy(new THREE.Vector3(0, 0, this.sideSize * 2).applyMatrix4(this.rotation));
	this.camera.setRotationFromMatrix(this.rotation);
};

//Game states
LightsOut3d.STATE_MENU = 0;
LightsOut3d.STATE_PLAYING = 1;
LightsOut3d.STATE_ANIMATING = 2;

LightsOut3d.ANIMATION_STATE_STOPPED = 0;
LightsOut3d.ANIMATION_STATE_INTERPOLATING = 1;
LightsOut3d.ANIMATION_STATE_SPINNING = 2;
