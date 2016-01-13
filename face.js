Face = function(position, extent, plane) {
	this.position = new THREE.Vector2();
	this.position.copy(position);
	this.extent = new THREE.Vector2();
	this.extent.copy(extent);
	this.plane = plane;
	this.state = false;
};
Face.prototype.createGeometry = function(material, offset, translation) {
	this.geometry = new THREE.PlaneGeometry(this.extent.x, this.extent.y);
	this.material = material;
	this.mesh = new THREE.Mesh(this.geometry, this.material);

	//Update rotation
	this.mesh.quaternion.copy(Face.planeRotation[this.plane]);

	//Set the position of the face based on the plane
	this.mesh.position.copy(new THREE.Vector3(offset.x + this.position.x, offset.y + this.position.y));

	//Move the position out from the center of the world by 1.5
	var matrix = new THREE.Matrix4().makeRotationFromQuaternion(Face.planeRotation[this.plane]);
	matrix.multiply(new THREE.Matrix4().makeTranslation(0, 0, translation));

	this.mesh.position.applyMatrix4(matrix);

	this.mesh.userData = this;

	return this.mesh;
};
Face.prototype.setMaterial = function(material) {
	this.mesh.material = material;
};
Face.prototype.getConnections = function(lowEdge, highEdge) {
	var wrapped;
	var connections = [this.stringify()];

	if (this.position.x == highEdge.x) {
		wrapped = Face.wrapFace(this.plane, Face.SIDE_XHIGH, this.position.y, lowEdge, highEdge);
		connections.push(this.stringify(wrapped.x, wrapped.y, wrapped.z));
	} else {
		connections.push(this.stringify(this.position.x + 1, this.position.y, this.plane));
	}
	if (this.position.y == highEdge.y) {
		wrapped = Face.wrapFace(this.plane, Face.SIDE_YHIGH, this.position.x, lowEdge, highEdge);
		connections.push(this.stringify(wrapped.x, wrapped.y, wrapped.z));
	} else {
		connections.push(this.stringify(this.position.x, this.position.y + 1, this.plane));
	}
	if (this.position.x == lowEdge.x) {
		wrapped = Face.wrapFace(this.plane, Face.SIDE_XLOW, this.position.y, lowEdge, highEdge);
		connections.push(this.stringify(wrapped.x, wrapped.y, wrapped.z));
	} else {
		connections.push(this.stringify(this.position.x - 1, this.position.y, this.plane));
	}
	if (this.position.y == lowEdge.y) {
		wrapped = Face.wrapFace(this.plane, Face.SIDE_YLOW, this.position.x, lowEdge, highEdge);
		connections.push(this.stringify(wrapped.x, wrapped.y, wrapped.z));
	} else {
		connections.push(this.stringify(this.position.x, this.position.y - 1, this.plane));
	}

	return connections;
};
Face.prototype.stringify = function(x, y, z) {
	x = (typeof(x) === "undefined" ? this.position.x : x);
	y = (typeof(y) === "undefined" ? this.position.y : y);
	z = (typeof(z) === "undefined" ? this.plane : z);
	return x + " " + y + " " + z;
};

//Various plane orientations along the cube faces
Face.PLANE_XNEGATIVE = 0;
Face.PLANE_XPOSITIVE = 1;
Face.PLANE_YNEGATIVE = 2;
Face.PLANE_YPOSITIVE = 3;
Face.PLANE_ZNEGATIVE = 4;
Face.PLANE_ZPOSITIVE = 5;

//Rotation of the mesh for each plane on the cube
Face.planeRotation = {};
Face.planeRotation[Face.PLANE_XNEGATIVE] = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
Face.planeRotation[Face.PLANE_XPOSITIVE] = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
Face.planeRotation[Face.PLANE_YNEGATIVE] = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
Face.planeRotation[Face.PLANE_YPOSITIVE] = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
Face.planeRotation[Face.PLANE_ZNEGATIVE] = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
Face.planeRotation[Face.PLANE_ZPOSITIVE] = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0);

//Each plane has four sides relative to itself
Face.SIDE_XLOW  = 0;
Face.SIDE_XHIGH = 1;
Face.SIDE_YLOW  = 2;
Face.SIDE_YHIGH = 3;

//Found by a lot of trial and error. These map the sides of plane face to their connecting plane/side. Sides can mirror
// their coordinates on the others, and have different sides for each plane/side.
Face.planeConnection = {};

Face.planeConnection[Face.PLANE_XNEGATIVE] = {};
Face.planeConnection[Face.PLANE_XNEGATIVE][Face.SIDE_XLOW]  = { plane: Face.PLANE_ZPOSITIVE, side: Face.SIDE_XHIGH, mirror: false};
Face.planeConnection[Face.PLANE_XNEGATIVE][Face.SIDE_XHIGH] = { plane: Face.PLANE_ZNEGATIVE, side: Face.SIDE_XLOW,  mirror: false};
Face.planeConnection[Face.PLANE_XNEGATIVE][Face.SIDE_YLOW]  = { plane: Face.PLANE_YNEGATIVE, side: Face.SIDE_XHIGH, mirror: true };
Face.planeConnection[Face.PLANE_XNEGATIVE][Face.SIDE_YHIGH] = { plane: Face.PLANE_YPOSITIVE, side: Face.SIDE_XHIGH, mirror: false};

Face.planeConnection[Face.PLANE_XPOSITIVE] = {};
Face.planeConnection[Face.PLANE_XPOSITIVE][Face.SIDE_XLOW]  = { plane: Face.PLANE_ZNEGATIVE, side: Face.SIDE_XHIGH, mirror: false};
Face.planeConnection[Face.PLANE_XPOSITIVE][Face.SIDE_XHIGH] = { plane: Face.PLANE_ZPOSITIVE, side: Face.SIDE_XLOW,  mirror: false};
Face.planeConnection[Face.PLANE_XPOSITIVE][Face.SIDE_YLOW]  = { plane: Face.PLANE_YNEGATIVE, side: Face.SIDE_XLOW,  mirror: false};
Face.planeConnection[Face.PLANE_XPOSITIVE][Face.SIDE_YHIGH] = { plane: Face.PLANE_YPOSITIVE, side: Face.SIDE_XLOW,  mirror: true };

Face.planeConnection[Face.PLANE_YNEGATIVE] = {};
Face.planeConnection[Face.PLANE_YNEGATIVE][Face.SIDE_XLOW]  = { plane: Face.PLANE_XPOSITIVE, side: Face.SIDE_YLOW,  mirror: false};
Face.planeConnection[Face.PLANE_YNEGATIVE][Face.SIDE_XHIGH] = { plane: Face.PLANE_XNEGATIVE, side: Face.SIDE_YLOW,  mirror: true };
Face.planeConnection[Face.PLANE_YNEGATIVE][Face.SIDE_YLOW]  = { plane: Face.PLANE_ZNEGATIVE, side: Face.SIDE_YLOW,  mirror: true };
Face.planeConnection[Face.PLANE_YNEGATIVE][Face.SIDE_YHIGH] = { plane: Face.PLANE_ZPOSITIVE, side: Face.SIDE_YLOW,  mirror: false};

Face.planeConnection[Face.PLANE_YPOSITIVE] = {};
Face.planeConnection[Face.PLANE_YPOSITIVE][Face.SIDE_XLOW]  = { plane: Face.PLANE_XPOSITIVE, side: Face.SIDE_YHIGH, mirror: true };
Face.planeConnection[Face.PLANE_YPOSITIVE][Face.SIDE_XHIGH] = { plane: Face.PLANE_XNEGATIVE, side: Face.SIDE_YHIGH, mirror: false};
Face.planeConnection[Face.PLANE_YPOSITIVE][Face.SIDE_YLOW]  = { plane: Face.PLANE_ZPOSITIVE, side: Face.SIDE_YHIGH, mirror: false};
Face.planeConnection[Face.PLANE_YPOSITIVE][Face.SIDE_YHIGH] = { plane: Face.PLANE_ZNEGATIVE, side: Face.SIDE_YHIGH, mirror: true };

Face.planeConnection[Face.PLANE_ZNEGATIVE] = {};
Face.planeConnection[Face.PLANE_ZNEGATIVE][Face.SIDE_XLOW]  = { plane: Face.PLANE_XNEGATIVE, side: Face.SIDE_XHIGH, mirror: false};
Face.planeConnection[Face.PLANE_ZNEGATIVE][Face.SIDE_XHIGH] = { plane: Face.PLANE_XPOSITIVE, side: Face.SIDE_XLOW,  mirror: false};
Face.planeConnection[Face.PLANE_ZNEGATIVE][Face.SIDE_YLOW]  = { plane: Face.PLANE_YNEGATIVE, side: Face.SIDE_YLOW,  mirror: true };
Face.planeConnection[Face.PLANE_ZNEGATIVE][Face.SIDE_YHIGH] = { plane: Face.PLANE_YPOSITIVE, side: Face.SIDE_YHIGH, mirror: true };

Face.planeConnection[Face.PLANE_ZPOSITIVE] = {};
Face.planeConnection[Face.PLANE_ZPOSITIVE][Face.SIDE_XLOW]  = { plane: Face.PLANE_XPOSITIVE, side: Face.SIDE_XHIGH, mirror: false};
Face.planeConnection[Face.PLANE_ZPOSITIVE][Face.SIDE_XHIGH] = { plane: Face.PLANE_XNEGATIVE, side: Face.SIDE_XLOW,  mirror: false};
Face.planeConnection[Face.PLANE_ZPOSITIVE][Face.SIDE_YLOW]  = { plane: Face.PLANE_YNEGATIVE, side: Face.SIDE_YHIGH, mirror: false};
Face.planeConnection[Face.PLANE_ZPOSITIVE][Face.SIDE_YHIGH] = { plane: Face.PLANE_YPOSITIVE, side: Face.SIDE_YLOW,  mirror: false};

Face.wrapFace = function(plane, side, other, lowEdge, highEdge) {
	var connection = this.planeConnection[plane][side];
	if (connection.mirror) {
		switch (side) {
			case this.SIDE_XLOW:  other = (highEdge.x - lowEdge.x) - other; break;
			case this.SIDE_XHIGH: other = (highEdge.x - lowEdge.x) - other; break;
			case this.SIDE_YLOW:  other = (highEdge.y - lowEdge.y) - other; break;
			case this.SIDE_YHIGH: other = (highEdge.y - lowEdge.y) - other; break;
		}
	}
	switch (connection.side) {
		case this.SIDE_XLOW:
			return new THREE.Vector3(lowEdge.x, other, connection.plane);
		case this.SIDE_XHIGH:
			return new THREE.Vector3(highEdge.x, other, connection.plane);
		case this.SIDE_YLOW:
			return new THREE.Vector3(other, lowEdge.y, connection.plane);
		case this.SIDE_YHIGH:
			return new THREE.Vector3(other, highEdge.y, connection.plane);
	}
};
