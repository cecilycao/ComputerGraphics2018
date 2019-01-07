'use strict'
////////////////////////////////////////////////////////////////////////////////
/*global THREE, Coordinates, document, window  */
var camera, scene, renderer, cameraControls, canvasWidth, canvasHeight,
    redBall, greenBall, sphere, intersect1, intersect2, intersect3,
    line, lineGeom, lineMat, redBalllabel, greenBalllabel, gui, params, 
    reflectionCube;
var transformationMatrix = new THREE.Matrix4();

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
    scalex: 1,
    scaley: 1,
    scalez: 1,
    rotx: 0.0,
    roty: 0.0,
    rotz: 0.0
  }
  
  gui.add(params, 'scalex').min(0.5).max(2).step(0.1).name('Scale X');
  gui.add(params, 'scaley').min(0.5).max(2).step(0.1).name('Scale Y');
  gui.add(params, 'scalez').min(0.5).max(2).step(0.1).name('Scale Z');
  gui.add(params, 'rotx').min(-Math.PI).max(Math.PI).step(0.1).name('Rot X');
  gui.add(params, 'roty').min(-Math.PI).max(Math.PI).step(0.1).name('Rot Y');
  gui.add(params, 'rotz').min(-Math.PI).max(Math.PI).step(0.1).name('Rot Z');
	gui.domElement.style.position = "relative";
	gui.domElement.style.top = "-400px";
	gui.domElement.style.left = "350px";
  
  //skybox

  var imagePrefix = "../../images/airport/sky-";
  var imageSuffix = ".png";
  var urls  = [imagePrefix+"xpos"+imageSuffix, imagePrefix+"xneg"+imageSuffix,
							imagePrefix+"ypos"+imageSuffix, imagePrefix+"yneg"+imageSuffix,
							imagePrefix+"zpos"+imageSuffix, imagePrefix+"zneg"+imageSuffix];
  reflectionCube = new THREE.ImageUtils.loadTextureCube( urls );
  reflectionCube.format = THREE.RGBFormat;

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

  drawSphereIntersection();
}

function drawSphereIntersection() {
  
  var sphereMaterial = new THREE.MeshPhongMaterial( {
		color: 0xFFFFFF,
		shininess: 100,
		transparent: true,
		opacity: 0.5,
		envMap: reflectionCube,
		combine: THREE.MixOperation,
		reflectivity: 0.3 } );
	sphereMaterial.color.setRGB( 0.2, 0, 0.2 );
	sphereMaterial.specular.setRGB( 1, 1, 1 );
  

  sphere = new THREE.Mesh( new THREE.SphereGeometry( SPHERE_SIZE, 16, 16),
                          sphereMaterial);
  scene.add( sphere );
  
  redBall = new THREE.Mesh( new THREE.SphereGeometry( 30, 12, 12),
                       new THREE.MeshLambertMaterial({ color: 0xff0000 }));
  redBall.position.x = 0;
  redBall.position.y = 0;
  redBall.position.z = -300;
  scene.add( redBall );
  
  greenBall = new THREE.Mesh( new THREE.SphereGeometry( 30, 12, 12),
                       new THREE.MeshLambertMaterial({ color: 0x00ff00 }));
  greenBall.position.x = 0;
  greenBall.position.y = 0;
  greenBall.position.z = 300;
  scene.add( greenBall );
  
  intersect1 = new THREE.Mesh( new THREE.SphereGeometry( 15, 12, 12),
                       new THREE.MeshLambertMaterial({ color: 0xff0000 }));
  intersect1.position.x = 0;
  intersect1.position.y = 0;
  intersect1.position.z = -50;
  scene.add( intersect1 );

  intersect2 = new THREE.Mesh( new THREE.SphereGeometry( 15, 12, 12),
                       new THREE.MeshLambertMaterial({ color: 0x00ff00 }));
  intersect2.position.x = 0;
  intersect2.position.y = 0;
  intersect2.position.z = 50;
  scene.add( intersect2 );
  
  intersect3 = new THREE.Mesh( new THREE.SphereGeometry( 15, 12, 12),
                       new THREE.MeshLambertMaterial({ color: 0xffff00 }));
  scene.add( intersect3 );
  
  lineMat = new THREE.LineBasicMaterial({
	   color: 0x000000
  });

  lineGeom= new THREE.Geometry();
  lineGeom.vertices.push(
	   redBall.position,
	   greenBall.position
   );
  line = new THREE.Line( lineGeom, lineMat );
  scene.add( line );
  
  sphere.matrixAutoUpdate = false;
  // objects that we want to test for intersection (picking) by
  // the ray caster
  objects = [redBall, greenBall];
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
	camera.position.set( -800, 600, -500);
	cameraControls.target.set(-200,100,92);

	// HTML LABELS
  redBalllabel = document.createElement('div');
	redBalllabel.style.position = 'absolute';
	redBalllabel.style['pointer-events'] = 'none';
	redBalllabel.style.width = 100;
	redBalllabel.style.height = 50;
  
  greenBalllabel = document.createElement('div');
	greenBalllabel.style.position = 'absolute';
	greenBalllabel.style['pointer-events'] = 'none';
	greenBalllabel.style.width = 100;
	greenBalllabel.style.height = 50;
}

function addToDOM() {
    var canvas = document.getElementById('canvas');
    canvas.appendChild(renderer.domElement);
    canvas.appendChild(gui.domElement);
}

function animate() {
  transformSphere();
  placeIntersects();
	window.requestAnimationFrame(animate);
	render();
}

function transformSphere() {
  /* 
  We're going to use a custom-made transformation matrix that only handles 
  scaling and rotation. 
  */
  var cosx = Math.cos(params.rotx);
  var sinx = Math.sin(params.rotx);
  var cosy = Math.cos(params.roty);
  var siny = Math.sin(params.roty);
  var cosz = Math.cos(params.rotz);
  var sinz = Math.sin(params.rotz);
  
  transformationMatrix.set(
    //first row
    cosy * cosz * params.scalex,
    cosy * -sinz * params.scaley,
    -siny * params.scalez, 
    0,
    //second row
    (cosz * (siny * -sinx) + cosx * sinz) * params.scalex,
    (-sinz * (siny * -sinx) + cosx * cosz) * params.scaley,
    -sinx * cosy * params.scalez, 
    0, 
    //third row
    (cosz * (siny * cosx) + sinx * sinz) * params.scalex,
    (-sinz * (siny * cosx) + cosz * sinx) * params.scaley,
    cosx * cosy * params.scalez, 
    0,
    // fourth row
    0, 0, 0, 1
  );
  
  // This multiplication happens each frame, so we need to 
  // reset the matrix to identity or it will transform the 
  // object repeatedly.
  sphere.matrix.identity();
  // Set the sphere's matrix to the current transformation
  sphere.matrix.multiply(transformationMatrix);  
}

function placeIntersects(){
  /*
  TODO:
  The intersection is identical to plain sphere intersection assignment,
  adapted from 3D Math Primer P 727. You can copy and paste the solution 
  code from that assignment to get started, but you will need to make a
  few changes.
    
  To deal with the transformation, first transform the location of the
  endpoints of the line using the inverse of the transformation matrix, 
  then find the intersection of that (inversely transformed) line and the
  untransformed sphere (represented by the constant SPHERE_SIZE as r). Then
  finally, apply the transformation matrix to the locations of the 
  intersection objects. Thus the locations of the small balls should 
  correspond with the intersection points on the transformed sphere *and* 
  lie along the original line. 
  
  Review matrix operations in Three.js here:
  https://threejs.org/docs/#api/math/Matrix4
  https://threejs.org/docs/#manual/introduction/Matrix-transformations
  */
  
  // BEGIN CHANGES
  var inverseMatrix = new THREE.Matrix4();
  inverseMatrix = inverseMatrix.getInverse(transformationMatrix);

  var invRed = new THREE.Vector3();
  var invGreen = new THREE.Vector3();

  invRed = redBall.getWorldPosition().clone().applyMatrix4(inverseMatrix);
  invGreen = greenBall.getWorldPosition().clone().applyMatrix4(inverseMatrix);

  var d = new THREE.Vector3();
  var e = new THREE.Vector3();
  var result1 = new THREE.Vector3();
  var result2 = new THREE.Vector3();

  d = d.subVectors(invGreen, invRed).normalize();
  e = e.subVectors(sphere.position, invRed);

  var a = e.clone().dot(d);

  var radius = SPHERE_SIZE;

  var fSquare = radius * radius - e.length() * e.length() + a * a;



  var f = Math.sqrt(fSquare);

  var t = a - f;

  var t2 = a + f;
  //console.log(t);

  result1 = d.clone().multiplyScalar(t);
  result2 = d.clone().multiplyScalar(t2);

  var intersect1Position = new THREE.Vector3(invRed.x + result1.x, 
                                         invRed.y + result1.y,
                                         invRed.z + result1.z);
  intersect1Position.applyMatrix4(transformationMatrix);

  var intersect2Position = new THREE.Vector3(invRed.x + result2.x, 
                                         invRed.y + result2.y,
                                         invRed.z + result2.z);
  intersect2Position.applyMatrix4(transformationMatrix);

  var intersect3Position = new THREE.Vector3(invRed.x + result1.x, 
                                         invRed.y + result1.y,
                                         invRed.z + result1.z);
  intersect3Position.applyMatrix4(transformationMatrix);

  if (fSquare < -100) {
    intersect1.visible = false;
    intersect2.visible = false;
    intersect3.visible = false;

  } else if (fSquare > 100){
    intersect3.visible = false;
    intersect1.visible = true;
    intersect2.visible = true;

    intersect1.position.set(intersect1Position.x, 
                            intersect1Position.y,
                            intersect1Position.z);

    //set intersect2:
    intersect2.position.set(intersect2Position.x, 
                            intersect2Position.y,
                            intersect2Position.z);   
  } else {
    intersect3.visible = true;
    intersect1.visible = false;
    intersect2.visible = false;

    intersect3.position.set(intersect1Position.x, 
                            intersect1Position.y,
                            intersect1Position.z);
  }
  

  // END CHANGES
}

function render() {
	var delta = clock.getDelta();
	cameraControls.update(delta);

	// place x, y, z HTML labels on each of the points
	camera.updateMatrixWorld();
  
	redBalllabel.style.top = (toXYCoords(redBall.position).y + $("#canvas").offset().top + 10)  + 'px';
	redBalllabel.style.left = (toXYCoords(redBall.position).x + $("#canvas").offset().left + 10) + 'px';
	redBalllabel.innerHTML =
		Math.round(redBall.position.x) + ", " +
		Math.round(redBall.position.y) + ", " +
		Math.round(redBall.position.z);
	document.body.appendChild(redBalllabel);

	greenBalllabel.style.top = (toXYCoords(greenBall.position).y + $("#canvas").offset().top + 10)  + 'px';
	greenBalllabel.style.left = (toXYCoords(greenBall.position).x + $("#canvas").offset().left + 10) + 'px';
	greenBalllabel.innerHTML =
		Math.round(greenBall.position.x) + ", " +
		Math.round(greenBall.position.y) + ", " +
		Math.round(greenBall.position.z);
	document.body.appendChild(greenBalllabel);
  
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
      lineGeom.vertices = [redBall.position, greenBall.position];
      lineGeom.verticesNeedUpdate = true;
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
		SELECTED = intersects[ 0 ].object;
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
