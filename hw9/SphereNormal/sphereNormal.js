'use strict'
////////////////////////////////////////////////////////////////////////////////
/*global THREE, Coordinates, document, window  */
var camera, scene, renderer, cameraControls, canvasWidth, canvasHeight,
    cone, coneObj, sphereObj, sphere, surfacePointBall,
    line, lineGeom, lineMat, gui, params, 
    reflectionCube, intersects;
var SPHERE_SIZE = 200;
var objects = [];
var plane = new THREE.Plane(),
normal = new THREE.Vector3(),
mouse = new THREE.Vector2(),
offset = new THREE.Vector3(),
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
    scale: 1,
    length: 150
  }
  
  gui.add(params, 'scale').min(0.5).max(2).step(0.1).name('Sphere Scale');
	gui.domElement.style.position = "relative";
	gui.domElement.style.top = "-400px";
	gui.domElement.style.left = "350px";
  
  gui.add(params, 'length').min(50).max(300).step(5).name('Normal Display');
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

  drawSphere();
}

function drawSphere() {
  
  var sphereMaterial = new THREE.MeshPhongMaterial( {
		shininess: 100,
		transparent: true,
		opacity: 0.5,
		envMap: reflectionCube,
		combine: THREE.MixOperation,
		reflectivity: 0.3 } );
	sphereMaterial.color.setRGB( 0.2, 0, 0.2 );
	sphereMaterial.specular.setRGB( 1, 1, 1 );
  
  sphereObj = new THREE.Object3D();
  sphereObj.position.y = 100;
  sphereObj.position.x = 200;

  sphere = new THREE.Mesh( new THREE.SphereGeometry( SPHERE_SIZE, 16, 16),
                          sphereMaterial);
  sphere.name = 'sphere';
  sphere.userData.parent = sphereObj;
  sphereObj.add( sphere );
  
  surfacePointBall = new THREE.Mesh( new THREE.SphereGeometry( 25, 12, 12),
                       new THREE.MeshLambertMaterial({ color: 0x8f008f }));
  surfacePointBall.position.x = -SPHERE_SIZE * params.scale;
  surfacePointBall.name = 'surfacePoint';
  sphereObj.add( surfacePointBall );
  
  scene.add(sphereObj);
  
  cone = new THREE.Mesh( new THREE.ConeGeometry( 30, 60, 32 ),
                       new THREE.MeshLambertMaterial({ color: 0x000000 }));
  cone.rotateX( -Math.PI/2 );
  coneObj = new THREE.Object3D();
  //cone.scale.set( 1,1,10 );
  coneObj.add( cone );
  scene.add( coneObj );
  
  lineMat = new THREE.LineBasicMaterial({
	   color: 0x000000
  });
  
  lineGeom= new THREE.Geometry();
  lineGeom.vertices.push(
     surfacePointBall.position.clone().add(sphereObj.position),
     coneObj.position
   );
  line = new THREE.Line( lineGeom, lineMat );
  scene.add( line );
  
  // objects that we want to test for intersection (picking) by
  // the ray caster
  objects = [surfacePointBall, sphere];
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
	camera.position.set( -500, 500, -800);
	cameraControls.target.set(4,0,92);
}

function addToDOM() {
    var canvas = document.getElementById('canvas');
    canvas.appendChild(renderer.domElement);
    canvas.appendChild(gui.domElement);
}

function animate() {
  positionObjects();
  drawLines();
	window.requestAnimationFrame(animate);
	render();
}

// position the objects we can, based on user interaction
function positionObjects() {
  sphere.scale.set(params.scale, params.scale, params.scale);
  surfacePointBall.position.setLength(SPHERE_SIZE * params.scale);
  
  /*TODO:
  Position the cone in the correct location above the surface of the sphere, params.length
  units away from the surfacePointBall in the direction of the sphere's surface normal. 
  
  The line drawn between the surfacePointBall and the coneObj is updated in the drawLines function,
  which has already been written, so the line will take care of itself. 
  
  Note that coneObj is the object you should be positioning, as it is the parent object of 
  the cone object. The large sphere also has a parent object sphereObj, which is where the
  global location of the sphere is set.
  */
  
  // CHANGES BEGIN

  var N = new THREE.Vector3();
  N = N.subVectors(surfacePointBall.getWorldPosition(), sphereObj.position).normalize();
  N.multiplyScalar(params.length);


  coneObj.position.set(surfacePointBall.getWorldPosition().x + N.x,
                       surfacePointBall.getWorldPosition().y + N.y,
                       surfacePointBall.getWorldPosition().z + N.z);


  
  // CHANGES END
} 

function drawLines(){
  lineGeom.vertices = [surfacePointBall.position.clone().add(sphereObj.position), coneObj.position];
  lineGeom.verticesNeedUpdate = true; 
  coneObj.lookAt(surfacePointBall.position.clone().add(sphereObj.position))
}

function render() {
	var delta = clock.getDelta();
	cameraControls.update(delta);
	camera.updateMatrixWorld();
  
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
      if( SELECTED.name === 'surfacePoint' ) {
        var sphereRaycaster = new THREE.Raycaster();
        sphereRaycaster.setFromCamera( mouse, camera );
        var surfPoint = new THREE.Vector3();
        var sph = new THREE.Sphere( sphereObj.position, SPHERE_SIZE * params.scale );
        if ( sphereRaycaster.ray.intersectSphere( sph, surfPoint ) ){
          SELECTED.position.copy( surfPoint.sub(sphereObj.position) );
        }
        
      } else {
        SELECTED.position.copy( intersection.sub( offset ) );
      }
    }
		return;
	}

  // determines which objects are intersected by the ray, and sets the dragging
  // plane with respect to the camera view.
	intersects = raycaster.intersectObjects(objects, true);
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
