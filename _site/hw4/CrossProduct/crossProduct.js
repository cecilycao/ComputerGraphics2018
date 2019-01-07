'use strict'
////////////////////////////////////////////////////////////////////////////////
/*global THREE, Coordinates, document, window  */
var camera, scene, renderer, cameraControls, canvasWidth, canvasHeight,
    redCone, redConeObj, blueCone, blueConeObj, redLine, blueLine, lineMat,
    redLineGeom, blueLineGeom, grayBall,
    purpleCone, purpleConeObj, purpleLine, purpleLineGeom, 
    redConeLabel, blueConeLabel, purpleConeLabel, grayBallLabel,
    gui, params;
var SPHERE_SIZE = 200;
var objects = [];
var plane = new THREE.Plane(),
mouse = new THREE.Vector2(),
offset = new THREE.Vector3(),
crossProduct = new THREE.Vector3,
vRed = new THREE.Vector3(),
vBlue = new THREE.Vector3(),
u = new THREE.Vector3(),
v = new THREE.Vector3(),
intersection = new THREE.Vector3(), INTERSECTED, SELECTED;

var projector = new THREE.Projector();
var raycaster = new THREE.Raycaster();
var clock = new THREE.Clock();

function fillScene() {
  
  // Set up gui sliders
	gui = new dat.GUI({
		autoPlace: false,
    height : (32 * 3)- 1
	});
  
  params = {
    redLength: 0.1,
    blueLength: 0.1,
    display: 200,
    magnitude: 0.1,
    handed: 'right'
  }
  
  gui.add(params, 'redLength').name('Red Length:').listen();
  gui.add(params, 'blueLength').name('Blue Length:').listen();
  gui.add(params, 'magnitude').name('CP Magnitude:').listen();
  var controller1 = gui.add(params, 'display').name('CP Display:').min(50).max(300);
  var controller2 = gui.add(params, 'handed', [ 'right', 'left' ] ).name('Handedness:');
	gui.domElement.style.position = "relative";
	gui.domElement.style.top = "-400px";
	gui.domElement.style.left = "350px";
  
  controller1.onChange(function(value) {
    updateObjects();
  });
  controller2.onChange(function(value) {
    updateObjects();
  });
  
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog( 0x808080, 2000, 4000 );
	scene.add( new THREE.AmbientLight( 0x222222 ) );

	var light = new THREE.DirectionalLight( 0xffffff, 0.9 );
	light.position.set( -200, 500, 500 );
	scene.add( light );

	light = new THREE.DirectionalLight( 0xffffff, 0.6 );
	light.position.set( 100, 100, -400 );
	scene.add( light );

  //grid xz
  var gridXZ = new THREE.GridHelper(2000, 100, new THREE.Color(0xCCCCCC), new THREE.Color(0x888888));
  scene.add(gridXZ);
  
  //axes
  var axes = new THREE.AxisHelper(150);
  axes.scale.set(1,1,1);
  scene.add(axes);

  drawVectors();
}

function drawVectors() {

  grayBall = new THREE.Mesh( new THREE.SphereGeometry( 30, 12, 12),
                       new THREE.MeshLambertMaterial({ 
                         color: 0xdddddd
                        }));
  grayBall.position.x = -300;
  scene.add( grayBall );
  
  redCone = new THREE.Mesh( new THREE.ConeGeometry( 50, 100, 32 ),
                       new THREE.MeshLambertMaterial({ color: 0xff0000 }));
  redCone.rotateX( -Math.PI/2 );
  redConeObj = new THREE.Object3D();
  redConeObj.add( redCone );
  redConeObj.position.x = 300;
  redConeObj.position.y = 300;
  redConeObj.position.z = -20;
  scene.add( redConeObj );
  redCone.userData.parent = redConeObj;
  
  lineMat = new THREE.LineBasicMaterial({
	   color: 0xff0000
  });

  redLineGeom= new THREE.Geometry();
  redLineGeom.vertices.push(
	   grayBall.position,
	   redConeObj.position
   );
  redLine = new THREE.Line( redLineGeom, lineMat );
  scene.add(redLine);
  
  blueCone = new THREE.Mesh( new THREE.ConeGeometry( 50, 100, 32 ),
                       new THREE.MeshLambertMaterial({ color: 0x0000ff }));
  blueCone.rotateX( -Math.PI/2 );
  blueConeObj = new THREE.Object3D();
  blueConeObj.add( blueCone );
  blueConeObj.position.x = 300;
  blueConeObj.position.y = -300;
  blueConeObj.position.z = 20;
  scene.add( blueConeObj );
  blueCone.userData.parent = blueConeObj;
  
  lineMat = new THREE.LineBasicMaterial({
	   color: 0x0000ff
  });

  blueLineGeom= new THREE.Geometry();
  blueLineGeom.vertices.push(
	   grayBall.position,
	   blueConeObj.position
   );
  blueLine = new THREE.Line( blueLineGeom, lineMat );
  scene.add(blueLine);
  
  purpleCone = new THREE.Mesh( new THREE.ConeGeometry( 50, 100, 32 ),
                       new THREE.MeshLambertMaterial({ color: 0xff00ff }));
  purpleCone.rotateX( -Math.PI/2 );
  purpleConeObj = new THREE.Object3D();
  purpleConeObj.add( purpleCone );
  scene.add( purpleConeObj );
  purpleCone.userData.parent = purpleConeObj;
  
  lineMat = new THREE.LineBasicMaterial({
	   color: 0xff00ff
  });

  purpleLineGeom= new THREE.Geometry();
  purpleLineGeom.vertices.push(
	   grayBall.position,
	   purpleConeObj.position
   );
  purpleLine = new THREE.Line( purpleLineGeom, lineMat );
  scene.add(purpleLine);
  
  // objects that we want to test for intersection (picking) by
  // the ray caster
  objects = [grayBall, redCone, blueCone];
  updateObjects();
}

function init() {
	canvasWidth = 600;
	canvasHeight = 400;

	var canvasRatio = canvasWidth / canvasHeight;

	// RENDERER
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.setSize(canvasWidth, canvasHeight);
	renderer.setClearColor( 0xAAAAAA, 1.0 );
  renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
  renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
  renderer.domElement.addEventListener( 'mouseup', onDocumentMouseUp, false );
  renderer.setPixelRatio( window.devicePixelRatio );

	// CAMERA
	camera = new THREE.PerspectiveCamera( 45, canvasRatio, 1, 4000 );

	// CONTROLS
	cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
	camera.position.set( -600, 450, -550);
	cameraControls.target.set(4,0,92);
  
  redConeLabel = document.createElement('div');
	redConeLabel.style.position = 'absolute';
	redConeLabel.style['pointer-events'] = 'none';
	redConeLabel.style.width = 100;
	redConeLabel.style.height = 50;
  
  blueConeLabel = document.createElement('div');
	blueConeLabel.style.position = 'absolute';
	blueConeLabel.style['pointer-events'] = 'none';
	blueConeLabel.style.width = 100;
	blueConeLabel.style.height = 50;

  purpleConeLabel = document.createElement('div');
	purpleConeLabel.style.position = 'absolute';
	purpleConeLabel.style['pointer-events'] = 'none';
	purpleConeLabel.style.width = 100;
	purpleConeLabel.style.height = 50;
  
  grayBallLabel = document.createElement('div');
	grayBallLabel.style.position = 'absolute';
	grayBallLabel.style['pointer-events'] = 'none';
	grayBallLabel.style.width = 100;
	grayBallLabel.style.height = 50;
}

function updateObjects() {
  calculateCrossProduct();
  redConeObj.lookAt(grayBall.position);
  blueConeObj.lookAt(grayBall.position);
  purpleConeObj.lookAt(grayBall.position);
  
  redLineGeom.vertices = [grayBall.position, redConeObj.position];
  redLineGeom.verticesNeedUpdate = true;
  blueLineGeom.vertices = [grayBall.position, blueConeObj.position];
  blueLineGeom.verticesNeedUpdate = true;
  purpleLineGeom.vertices = [grayBall.position, purpleConeObj.position];
  purpleLineGeom.verticesNeedUpdate = true;
}

function calculateCrossProduct(){
  /*
  TODO: 
  Calculate the cross product Red Vector X Blue Vector. Order is important. Note the handedness
  and direction in the demo video. Switch direction based on the params.handed value.
  
  Calculate the cross product using only basic arithmetic operators. Do not use Three.js's built-in
  cross product functions. 
  
  The actual cross product will always have a magnitude equal to the area of the parallelogram spanned by 
  the input vectors. However, for display purposes, it is better to set the length of the arrow representing it
  to a convenient length. Display the actual magnitude in the GUI as params.magnitude. Draw the 
  purple arrow to the length of the slider value of params.display. 
  
  As in the case with the dot product exercise, the lengths of the vectors and the imprecision of the 
  interface means that it you won't easily be able to drag things to make a zero-magnitude cross product. 
  Be sure the magnitude is approaching the correct value and is positive/negative as appropriate. 
  */
  
  // BEGIN CHANGES
  var redVec = new THREE.Vector3().subVectors(redConeObj.position, grayBall.position);
  var blueVec = new THREE.Vector3().subVectors(blueConeObj.position, grayBall.position);

  if (params.handed == 'right'){
    crossProduct.x = redVec.y * blueVec.z - redVec.z * blueVec.y;
    crossProduct.y = redVec.z * blueVec.x - redVec.x * blueVec.z;
    crossProduct.z = redVec.x * blueVec.y - redVec.y * blueVec.x;
  } else {
    crossProduct.x = blueVec.y * redVec.z - blueVec.z * redVec.y;
    crossProduct.y = blueVec.z * redVec.x - blueVec.x * redVec.z;
    crossProduct.z = blueVec.x * redVec.y - blueVec.y * redVec.x;
  }

  params.redLength = redVec.length();
  params.blueLength = blueVec.length();
  params.magnitude = crossProduct.length();

  var purDirect = new THREE.Vector3();
  purDirect.copy(crossProduct).normalize().multiplyScalar(params.display);

  purpleConeObj.position.x = purDirect.x + grayBall.position.x;
  purpleConeObj.position.y = purDirect.y + grayBall.position.y;
  purpleConeObj.position.z = purDirect.z + grayBall.position.z;
  
  
  // END CHANGES
}

function addToDOM() {
    var canvas = document.getElementById('canvas');
    canvas.appendChild(renderer.domElement);
    canvas.appendChild(gui.domElement);
}

function animate() {
	window.requestAnimationFrame(animate);
	render();
}

function render() {
	var delta = clock.getDelta();
	cameraControls.update(delta);

	// place x, y, z HTML labels on each of the points
	camera.updateMatrixWorld();
  
	redConeLabel.style.top = (toXYCoords(redConeObj.position).y + $("#canvas").offset().top + 10)  + 'px';
	redConeLabel.style.left = (toXYCoords(redConeObj.position).x + $("#canvas").offset().left + 10) + 'px';
	redConeLabel.innerHTML =
		Math.round(redConeObj.position.x) + ", " +
		Math.round(redConeObj.position.y) + ", " +
		Math.round(redConeObj.position.z);
	document.body.appendChild(redConeLabel);

	blueConeLabel.style.top = (toXYCoords(blueConeObj.position).y + $("#canvas").offset().top + 10)  + 'px';
	blueConeLabel.style.left = (toXYCoords(blueConeObj.position).x + $("#canvas").offset().left + 10) + 'px';
	blueConeLabel.innerHTML =
		Math.round(blueConeObj.position.x) + ", " +
		Math.round(blueConeObj.position.y) + ", " +
		Math.round(blueConeObj.position.z);
	document.body.appendChild(blueConeLabel);
  
	grayBallLabel.style.top = (toXYCoords(grayBall.position).y + $("#canvas").offset().top + 10)  + 'px';
	grayBallLabel.style.left = (toXYCoords(grayBall.position).x + $("#canvas").offset().left + 10) + 'px';
	grayBallLabel.innerHTML =
		Math.round(grayBall.position.x) + ", " +
		Math.round(grayBall.position.y) + ", " +
		Math.round(grayBall.position.z);
	document.body.appendChild(grayBallLabel);
  
	renderer.render(scene, camera);
}


function onDocumentMouseMove( event ) {
	event.preventDefault();
  // this converts window mouse values to x and y mouse coordinates that range
  // between -1 and 1 in the canvas
  mouse.set(
     (( event.clientX / window.innerWidth ) * 2 - 1) *
     (window.innerWidth/canvasWidth),
     (-((event.clientY - ($("#canvas").position().top + (canvasHeight/2))) / window.innerHeight) * 2 )
     * (window.innerHeight/canvasHeight));

  // uses Three.js built-in raycaster to send a ray from the camera
	raycaster.setFromCamera( mouse, camera );
	if ( SELECTED ) {
    if ( raycaster.ray.intersectPlane( plane, intersection ) ) {
      SELECTED.position.copy( intersection.sub( offset ) );
      SELECTED.position.x = Math.round(SELECTED.position.x);
      SELECTED.position.y = Math.round(SELECTED.position.y);
      SELECTED.position.z = Math.round(SELECTED.position.z);
      updateObjects();
    }
		return;
	}

  // determines which objects are intersected by the ray, and sets the dragging
  // plane with respect to the camera view.
	var intersects = raycaster.intersectObjects(objects);
	if ( intersects.length > 0 ) {
		if ( INTERSECTED != intersects[0].object ) {
			INTERSECTED = intersects[0].object;
			plane.setFromNormalAndCoplanarPoint(
        camera.getWorldDirection( plane.normal ),
        INTERSECTED.position);
		}
		canvas.style.cursor = 'pointer';
	} else {
		INTERSECTED = null;
		canvas.style.cursor = 'auto';
	}
}

// handles mouse down event
function onDocumentMouseDown( event ) {
	event.preventDefault();
	raycaster.setFromCamera( mouse, camera );
	var intersects = raycaster.intersectObjects( objects );
	if ( intersects.length > 0 ) {
		cameraControls.enabled = false;
    SELECTED = intersects[ 0 ].object.userData.parent || intersects[ 0 ].object;
		if ( raycaster.ray.intersectPlane( plane, intersection ) ) {
			offset.copy( intersection ).sub( SELECTED.position ); 
		}
		canvas.style.cursor = 'move';
	}
}

// handles mouse up event
function onDocumentMouseUp( event ) {
	event.preventDefault();
	cameraControls.enabled = true;
	if ( INTERSECTED ) {
		SELECTED = null;
	}
	canvas.style.cursor = 'auto';
}

function toXYCoords (pos) {
  //var vector = projector.projectVector(pos.clone(), camera);
	var vector = pos.clone().project(camera);
	vector.x = (vector.x + 1)/2 * canvasWidth;
	vector.y = -(vector.y - 1)/2 * canvasHeight;
	//console.log(vector);
  return vector;
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
