'use strict'
////////////////////////////////////////////////////////////////////////////////
/*global THREE, Coordinates, document, window  */
var camera, scene, renderer, cameraControls, canvasWidth, canvasHeight,
    redCone, redConeObj, blueCone, blueConeObj, redLine, blueLine, lineMat,
    redLineGeom, blueLineGeom, redBall, blueBall, grayBall,
    redTriangle, blueTriangle, redConeLabel, blueConeLabel,
    redBallLabel, blueBallLabel, grayBallLabel, redCylinderLabel, blueCylinderLabel,
    gui, params;
var SPHERE_SIZE = 200;
var objects = [];
var plane = new THREE.Plane(),
mouse = new THREE.Vector2(),
offset = new THREE.Vector3(),
redToGreenRay = new THREE.Vector3,
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
    cosine: 0.01,
    dotProduct: 0.1
  }
  
  gui.add(params, 'redLength').name('Red Length:').listen();
  gui.add(params, 'blueLength').name('Blue Length:').listen();
  gui.add(params, 'cosine').name('Cosine:').listen();
  gui.add(params, 'dotProduct').name('Dot Product:').listen();
	gui.domElement.style.position = "relative";
	gui.domElement.style.top = "-400px";
	gui.domElement.style.left = "350px";
  

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
  
  redBall = new THREE.Mesh( new THREE.SphereGeometry( 15, 12, 12),
                       new THREE.MeshLambertMaterial({ 
                         color: 0xff0000
                       }));
  redBall.position.x = 0;
  redBall.position.y = 0;
  redBall.position.z = -15;
  scene.add( redBall );
  
  blueBall = new THREE.Mesh( new THREE.SphereGeometry( 15, 12, 12),
                       new THREE.MeshLambertMaterial({ 
                         color: 0x0000ff
                        }));
  blueBall.position.x = 0;
  blueBall.position.y = 0;
  blueBall.position.z = 15;
  scene.add( blueBall );

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
  redConeObj.position.y = -200;
  redConeObj.position.z = -400;
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
  blueConeObj.position.y = 400;
  blueConeObj.position.z = 200;
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
  
  var redTriangleMaterial = new THREE.MeshPhongMaterial( {
		transparent: true,
		opacity: 0.2,
    side: THREE.DoubleSide
  } );
	redTriangleMaterial.color.setRGB( 1, 0, 0 );
  
  var geo = new THREE.Geometry();
  geo.vertices = [redBall.position, redConeObj.position, grayBall.position];
  geo.faces = [new THREE.Face3(0, 1, 2)];
  geo.computeFaceNormals();

  redTriangle = new THREE.Mesh(geo, redTriangleMaterial)
  scene.add(redTriangle);  

  var blueTriangleMaterial = new THREE.MeshPhongMaterial( {
		transparent: true,
		opacity: 0.2,
    side: THREE.DoubleSide
  } );
	blueTriangleMaterial.color.setRGB( 0, 0, 1 );
  
  geo = new THREE.Geometry();
  geo.vertices = [blueBall.position, blueConeObj.position, grayBall.position];
  geo.faces = [new THREE.Face3(0, 1, 2)];
  geo.computeFaceNormals();

  blueTriangle = new THREE.Mesh(geo, blueTriangleMaterial)
  scene.add(blueTriangle);  
  
  updateObjects();
  // objects that we want to test for intersection (picking) by
  // the ray caster
  objects = [grayBall, redCone, blueCone];
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
	camera.position.set( -500, 400, -900);
	cameraControls.target.set(4,0,92);

	// HTML LABELS
  redBallLabel = document.createElement('div');
	redBallLabel.style.position = 'absolute';
	redBallLabel.style['pointer-events'] = 'none';
	redBallLabel.style.width = 100;
	redBallLabel.style.height = 50;
  
  blueBallLabel = document.createElement('div');
	blueBallLabel.style.position = 'absolute';
	blueBallLabel.style['pointer-events'] = 'none';
	blueBallLabel.style.width = 100;
	blueBallLabel.style.height = 50;
  
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
  
  grayBallLabel = document.createElement('div');
	grayBallLabel.style.position = 'absolute';
	grayBallLabel.style['pointer-events'] = 'none';
	grayBallLabel.style.width = 100;
	grayBallLabel.style.height = 50;
}

function updateObjects() {
  redConeObj.lookAt(grayBall.position);
  blueConeObj.lookAt(grayBall.position);
  
  redLineGeom.vertices = [grayBall.position, redConeObj.position];
  redLineGeom.verticesNeedUpdate = true;
  blueLineGeom.vertices = [grayBall.position, blueConeObj.position];
  blueLineGeom.verticesNeedUpdate = true;
  
  redTriangle.geometry.vertices = [redBall.position, redConeObj.position, grayBall.position]
  redTriangle.geometry.verticesNeedUpdate = true;
  blueTriangle.geometry.vertices = [blueBall.position, blueConeObj.position, grayBall.position]
  blueTriangle.geometry.verticesNeedUpdate = true;
  calculateDotProductAndProjections();
}

function calculateDotProductAndProjections(){
  /*TODO:
  Here's where you'll calculate the dot product and the projections of each vector onto
  the other. You may use any built-in function for vectors or numbers in Math or in 
  THREE.js *except* the built-in dot product method. You must calculate the dot product 
  directly from values using only standard arithmetic operators. 
  
  Once you've got the dot product, set the following values so they display in the 
  GUI:
  
  params.dotProdut, params.redLength, params.blueLength, params.cosine
  
  Note that the vectors are quite long (in the hundreds of units) and can be freely moved around, 
  so the cosine, and hence the dot product, will rarely be precisely 0. Getting a dot product in the
  tens or low hundreds may be as close to zero as this exercise allows. Be sure it's negative when it 
  should be and approaches the correct values.
  
  The projection is a matter of positioning the redBall and blueBall objects. Once these
  balls are positioned correctly, the triangles illustrating the projections will
  automatically be drawn (this happens in the updateObjects function above).  
  */
  // BEGIN CHANGES
  var redVec = [redConeObj.position.x - grayBall.position.x, 
                redConeObj.position.y - grayBall.position.y,
                redConeObj.position.z - grayBall.position.z];

  var blueVec = [blueConeObj.position.x - grayBall.position.x, 
                blueConeObj.position.y - grayBall.position.y,
                blueConeObj.position.z - grayBall.position.z];

  params.dotProduct = redVec[0] * blueVec[0] + 
                     redVec[1] * blueVec[1] + 
                     redVec[2] * blueVec[2];

  params.redLength = Math.sqrt(redVec[0] * redVec[0] + redVec[1] * redVec[1] + redVec[2] * redVec[2]);
  params.blueLength = Math.sqrt(blueVec[0] * blueVec[0] + blueVec[1]*blueVec[1] + blueVec[2] * blueVec[2]);
  
  params.cosine = params.dotProduct / (params.redLength * params.blueLength);

  //blue ball
  var parVecB = [params.dotProduct / (params.redLength * params.redLength) * redVec[0],
                params.dotProduct / (params.redLength * params.redLength) * redVec[1],
                params.dotProduct / (params.redLength * params.redLength)  * redVec[2]];

  blueBall.position.x = parVecB[0] + grayBall.position.x;
  blueBall.position.y = parVecB[1] + grayBall.position.y;
  blueBall.position.z = parVecB[2] + grayBall.position.z;

  //red ball
  var parVecR = [params.dotProduct / (params.blueLength * params.blueLength) * blueVec[0],
                params.dotProduct / (params.blueLength * params.blueLength) * blueVec[1],
                params.dotProduct / (params.blueLength * params.blueLength)  * blueVec[2]];

  redBall.position.x = parVecR[0] + grayBall.position.x;
  redBall.position.y = parVecR[1] + grayBall.position.y;
  redBall.position.z = parVecR[2] + grayBall.position.z;


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
  
	redBallLabel.style.top = (toXYCoords(redBall.position).y + $("#canvas").offset().top + 10)  + 'px';
	redBallLabel.style.left = (toXYCoords(redBall.position).x + $("#canvas").offset().left + 10) + 'px';
	redBallLabel.innerHTML =
		Math.round(redBall.position.x) + ", " +
		Math.round(redBall.position.y) + ", " +
		Math.round(redBall.position.z);
	document.body.appendChild(redBallLabel);

	blueBallLabel.style.top = (toXYCoords(blueBall.position).y + $("#canvas").offset().top + 10)  + 'px';
	blueBallLabel.style.left = (toXYCoords(blueBall.position).x + $("#canvas").offset().left + 10) + 'px';
	blueBallLabel.innerHTML =
		Math.round(blueBall.position.x) + ", " +
		Math.round(blueBall.position.y) + ", " +
		Math.round(blueBall.position.z);
	document.body.appendChild(blueBallLabel);
  
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
