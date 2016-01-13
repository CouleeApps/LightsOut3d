MouseEvent.BUTTON_LEFT   = 1;
MouseEvent.BUTTON_MIDDLE = 2;
MouseEvent.BUTTON_RIGHT  = 3;

MouseEvent.prototype.getButton = function() {
	if (!this.which && this.button) {
		if (this.button & 1) return BUTTON_LEFT;
		if (this.button & 4) return BUTTON_MIDDLE;
		if (this.button & 2) return BUTTON_RIGHT;
	}
	return this.which;
};

MouseEvent.prototype.getPosition = function() {
	return {x: this.pageX, y: this.pageY};
};

TouchEvent.prototype.getPosition = function() {
	if (typeof(this.pageX) !== "undefined" && typeof(this.pageY) !== "undefined")
		return {x: this.pageX, y: this.pageY};
	if (typeof(this.touches) !== "undefined" && this.touches.length) {
		var touch = this.touches[0];
		return {x: touch.pageX, y: touch.pageY};
	}
	//Unknown
	return {x: 0, y: 0};
};

document.body.onmousedown = function(e) {
	if (game.state === LightsOut3d.STATE_PLAYING) {
		game.onMouseDown(e.getPosition());
	}
	return game.state === LightsOut3d.STATE_MENU;
};
document.body.onmouseup = function(e) {
	if (game.state === LightsOut3d.STATE_PLAYING) {
		game.onMouseUp(e.getPosition());
	}
};
document.body.onmousemove = function(e) {
	if (game.state === LightsOut3d.STATE_PLAYING) {
		game.onMouseMove(e.getPosition());
	}
};
document.body.onselectstart = function(e) {
	return game.state === LightsOut3d.STATE_MENU;
};
document.ontouchstart = function(e) {
	if (game.state === LightsOut3d.STATE_PLAYING) {
		game.onMouseDown(e.getPosition());
		e.preventDefault();
	}
};
document.ontouchend = function(e) {
	if (game.state === LightsOut3d.STATE_PLAYING) {
		game.onMouseUp(e.getPosition());
		e.preventDefault();
	}
};
document.ontouchmove = function(e) {
	if (game.state === LightsOut3d.STATE_PLAYING) {
		game.onMouseMove(e.getPosition());
	}
};
window.onresize = function(e) {
	game.updateSize();
};

LightsOut3d.prototype.onMouseDown = function(position) {
	this.mouseDown = true;
	this.mouseDrag = false;
	this.mouseLast.copy(position);
	this.mouseFirst.copy(position);
};
LightsOut3d.prototype.onMouseUp = function(position) {
	this.mouseDown = false;

	//We count a click if they don't move the mouse
	if (!this.mouseDrag) {
		var domPos = $(this.renderer.domElement).position();
		position = {x: position.x - (domPos.left - window.scrollX), y: position.y - (domPos.top - window.scrollY)};
		var relMouse = new THREE.Vector2((position.x / this.windowSize.x) * 2 - 1, (-position.y / this.windowSize.y) * 2 + 1);

		//Clicked!
		var raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(relMouse, this.camera);
		var intersects = raycaster.intersectObjects(this.scene.children);
		if (intersects.length) {
			var found = intersects[0].object.userData;
			this.toggleFace(found);

			if (this.isWinning()) {
				this.nextLevel();
			}
		}
	}

	this.mouseDrag = false;
};
LightsOut3d.prototype.onMouseMove = function(position) {
	if (this.mouseDown) {
		var movement = {x: position.x - this.mouseLast.x, y: position.y - this.mouseLast.y};
		this.rotation.multiply(new THREE.Matrix4().makeRotationX(-movement.y * 0.01));
		this.rotation.multiply(new THREE.Matrix4().makeRotationY(-movement.x * 0.01));
		this.mouseDrag = true;
	}

	this.mouseLast.copy(position);
};
LightsOut3d.prototype.updateSize = function() {
	this.windowSize.x = window.innerWidth;
	this.windowSize.y = window.innerHeight;
	this.renderer.setSize(this.windowSize.x, this.windowSize.y);
	this.camera.aspect = this.windowSize.x / this.windowSize.y;
	this.camera.updateProjectionMatrix();
};