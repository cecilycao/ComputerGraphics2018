////////////////////////////////////////////////////////////////////////////////
/*global THREE, document, window  */
var camera, scene, renderer;
var cameraControls;
const NumberOfCylinder = 700;

var clock = new THREE.Clock();

function fillScene() {
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog( 0x808080, 2000, 4000 );

	// LIGHTS

	scene.add( new THREE.AmbientLight( 0x222222 ) );

	var light = new THREE.DirectionalLight( 0xffffff, 0.7 );
	light.position.set( 200, 500, 500 );

	scene.add( light );

	light = new THREE.DirectionalLight( 0xffffff, 0.9 );
	light.position.set( -200, -100, -400 );

	scene.add( light );
;

//grid xz
 var gridXZ = new THREE.GridHelper(2000, 100);
 gridXZ.setColors( new THREE.Color(0xCCCCCC), new THREE.Color(0x888888) );
 scene.add(gridXZ);

 //axes
 var axes = new THREE.AxisHelper(150);
 axes.position.y = 1;
 scene.add(axes);

 drawKooshBall();
}

function drawKooshBall() {

	var cylinder;

	// One material is defined here. You'll need to define a second
	// material to get a multi-colored koosh ball. A good way is to use
	// an array.
	var cylinderMaterial	= [
		new THREE.MeshPhongMaterial({ 
			color: 0x5500DD,
			specular: 0xD1F5FD,
			shininess: 100 
		}),
		new THREE.MeshPhongMaterial({
			color: 0x00FFFF,
			specular: 0xF0FCFD,
			shininess: 100
		}),
	];

	// We can set up the cylinder geometry here"
	var cylinderGeo = new THREE.CylinderGeometry( 3, 3, 500, 32 );

	// Below is the code to create and position single cylinder object. You'll need to
	// make a loop to create many cylinders pointing in random directions.

	// YOUR CODE CHANGES BEGIN

	for (var i = 0; i < NumberOfCylinder; i++) {

		// create the cylinder object using the geometry and material above
		var cylinder = new THREE.Mesh( cylinderGeo, cylinderMaterial[i%2] );

		/*
			For visualization purposes, we'll create a second cylinder by cloning
			the cylinder. This `untransformedCylinder` will have its initial matrix
			unaltered, so we can log it to the console and see that it consists of the
			identity matrix. Check the console in your browser (Developer Tools) and
			drill into the object to see what the matrix looks like. Note that the
			untransformed cylinder appears in the 3D view pointing straight up and down.
		*/
		var untransformedCylinder = cylinder.clone();
		console.log("Untransformed cylinder matrix:")
		console.log(untransformedCylinder.matrix); // Look at the console
		scene.add(untransformedCylinder);

		/*
		 Transformation (rotate) the cylinder by taking two points, finding
		 the vector between them, and then rotating by the angle
		 of that vector.
		*/

		/*
		 get two diagonally-opposite corners. These points will need to be
		 randomized to generate the koosh ball:
		*/
		var x = Math.random();
		var y = Math.random();
		var z = Math.random();
		var maxCorner = new THREE.Vector3(  x, y, z );
		var minCorner = new THREE.Vector3( -x, -y, -z );

		// this creates a vector in the direction from minCorner to maxCorner
		var cylAxis = new THREE.Vector3().subVectors( maxCorner, minCorner );

		// normalize the axis
		cylAxis.normalize();
		// we can derive the angle by taking arccos of the y axis
		var theta = Math.acos( cylAxis.y );

		/*
		 We'll rotate the cylinder around only the x axis for demonstration purposes.
		 Rotations around arbitrary vectors will result in less readable values
		 in the matrix.
		 (this rotation axis will also need to be randomized for the koosh ball):
		*/
		var rotX = Math.random() * 2 - 1;
		var rotY = Math.random() * 2 - 1;
		var rotZ = Math.random() * 2 - 1;
		var rotationAxis = new THREE.Vector3(rotX, rotY, rotZ);
		/*
		 makeRotationAxis wants the axis normalized
		*/
		rotationAxis.normalize();
		/*
		 Don't use position, rotation, scale. Instead, we'll use
		 the matrix property to rotate theta radians around the rotation axis:
		*/
		cylinder.matrixAutoUpdate = false;
		/*
		 This is how we manually set the rotation for the matrix. makeRotationAxis()
		 takes a vector representing a rotation axis and a value (in radians) representing
		 the angle around that axis to rotate.
		*/
		cylinder.matrix.makeRotationAxis( rotationAxis, theta );

		console.log("Theta: " + theta);
		console.log("  cos: " + Math.cos(theta));
		console.log("  sin: " + Math.sin(theta));

		console.log("Transformed cylinder matrix:")
		console.log(cylinder.matrix); // Look at the console
		// We add the cylinder to the scene:
		scene.add( cylinder );
	}
	// YOUR CODE CHANGES END
}

function init() {
	var canvasWidth = 600;
	var canvasHeight = 400;
	var canvasRatio = canvasWidth / canvasHeight;

	// RENDERER
	renderer = new THREE.WebGLRenderer( { antialias: true } );

	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.setSize(canvasWidth, canvasHeight);
	renderer.setClearColor( 0xAAAAAA, 1.0 );

	// CAMERA
	camera = new THREE.PerspectiveCamera( 45, canvasRatio, 1, 4000 );
	// CONTROLS
	cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
	camera.position.set( -800, 600, 500);
	cameraControls.target.set(0,0,0);
}

function addToDOM() {
    var canvas = document.getElementById('canvas');
    canvas.appendChild(renderer.domElement);
}

function animate() {
	window.requestAnimationFrame(animate);
	render();
}

function render() {
	var delta = clock.getDelta();
	cameraControls.update(delta);
	renderer.render(scene, camera);
}

try {
  init();
  fillScene();
  addToDOM();
  animate();
} catch(error) {
    console.log("Your program encountered an unrecoverable error, can not draw on canvas. Error was:");
    console.log(error);
}
