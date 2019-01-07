'use strict'
////////////////////////////////////////////////////////////////////////////////
/*global THREE, Coordinates, document, window  */
var camera, scene, renderer, cameraControls, canvasWidth, canvasHeight,
    sphereObj, sphere, surfacePointBall, pointer, blackPuck, whitePuck,
    gui, params, reflectionCube, intersects, loaded;
var SPHERE_SIZE = 300;
var objects = [];
var plane = new THREE.Plane(),
mouse = new THREE.Vector2(),
offset = new THREE.Vector3(),
intersection = new THREE.Vector3(), INTERSECTED, SELECTED;
var center = new THREE.Vector3().set(0, 0, 0);
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
    blackRot: 0,
    whiteRot: 0,
    t: 0.5
  }
  
  gui.add(params, 'blackRot').min(-180).max(180).step(2).name('Black Twist');
  gui.add(params, 'whiteRot').min(-180).max(180).step(2).name('White Twist');
  gui.add(params, 't').min(0).max(1.0).step(0.1).name('Interpolation');
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
  
  loadObjects();
}

function loadObjects() {
  
  var sphereMaterial = new THREE.MeshPhongMaterial( {
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
  sphere.name = 'sphere';
  scene.add(sphere);
  
  // Set up load manager and load image and obj file. 
  var manager = new THREE.LoadingManager();
  manager.onProgress = function ( item, loaded, total ) {
    console.log( item, loaded, total );
  };

  var onProgress = function ( xhr ) {
      if ( xhr.lengthComputable ) {
        var percentComplete = xhr.loaded / xhr.total * 100;
        console.log( Math.round(percentComplete, 2) + '% downloaded' );
      }
    };
    
  var onError = function ( xhr ) {
  };  
  
  
  var mtlLoader = new THREE.MTLLoader();
  mtlLoader.load('va.mtl', function(materials) {
    materials.preload();
    var objLoader = new THREE.OBJLoader( manager );
    objLoader.setMaterials(materials);
  	objLoader.load( 'pointer.obj', function ( va ) {
      pointer = va;
      pointer.matrixAutoUpdate = false;
      scene.add(pointer);
      objLoader.load( 'WhitePuck.obj', function ( wp ) {
        whitePuck = wp.children[0];
        whitePuck.position.z = -300;
        whitePuck.lookAt(center);
        scene.add(whitePuck);
        objects.push(whitePuck);
        objLoader.load( 'BlackPuck.obj', function ( bp ) {
          blackPuck = bp.children[0];
          blackPuck.position.x = -300;
          loaded = true;
          blackPuck.lookAt(center);
          scene.add(blackPuck);
          objects.push(blackPuck);
        }, onProgress, onError );
      }, onProgress, onError );
  	}, onProgress, onError );
  })
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
	cameraControls.target.set(4,0,92);
}

function addToDOM() {
    var canvas = document.getElementById('canvas');
    canvas.appendChild(renderer.domElement);
    canvas.appendChild(gui.domElement);
}

function animate() {
  if (loaded) {
    positionObjects();
    calculateInterpolation();
  }
	 window.requestAnimationFrame(animate);
	 render();
}

function positionObjects() {
  blackPuck.rotation.z = params.blackRot * Math.PI/180
  whitePuck.rotation.z = params.whiteRot * Math.PI/180
} 

// caclulate interpolation
function calculateInterpolation(){
  /*TODO:
  Here you'll implement quaternion slerp and set the pointer's rotation from
  the resulting quaternion. You should use the blackPuck and whitePuck objects'
  current quaternions as the starting points, and calculate the resulting 
  interpolated quaternion. 
  
  Although Three.js has built-in quaterion slerp and dot product functions, do
  not use these. Rather, write your own dot product and slerp code based on the 
  discussion and code sample on pages 261 and 262 of 3D Math Primer. All you need
  to do is adapt that code to JavaScript and ensure that it receives the 
  correct values. You do not need to make any code changes outside of this 
  function. 
  
  For information on how to construct a new quaternion and how to use a 
  quaternion to apply rotation to an object's matrix, look at the Three.js
  documentation here:
  
  https://threejs.org/docs/#api/math/Quaternion
  https://threejs.org/docs/#api/math/Matrix4
  */
  // BEGIN CHANGES

  var q0 = blackPuck.quaternion;
  var q1 = whitePuck.quaternion;

  var t = params.t;

  var output = new THREE.Quaternion();


  var cos = q0.w * q1.w 
          + q0.x * q1.x
          + q0.y * q1.y
          + q0.z * q1.z;


  if (cos < 0) {
    q1.set(-q1.x, -q1.y, -q1.z, -q1.w);
    cos = -cos;
  }

  var k0;
  var k1;

  if (cos > 0.9999) {
    k0 = 1.0 - t;
    k1 = t;
  } else {
    var sin = Math.sqrt(1.0 - cos * cos);

    var omega = Math.atan2(sin, cos);

    var oneOverSin = 1.0 / sin;

    k0 = Math.sin((1.0 - t) * omega) * oneOverSin;
    k1 = Math.sin(t * omega) * oneOverSin;
  }

  output.set(q0.x * k0 + q1.x * k1,
             q0.y * k0 + q1.y * k1,
             q0.z * k0 + q1.z * k1,
             q0.w * k0 + q1.w * k1);


  //output.normalize();

  var m = pointer.matrix;
  m = m.makeRotationFromQuaternion(output);

  //pointer.applyMatrix(m);

  
  // END CHANGES
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
      var sphereRaycaster = new THREE.Raycaster();
      sphereRaycaster.setFromCamera( mouse, camera );
      var surfPoint = new THREE.Vector3();
      var sph = new THREE.Sphere( sphere.position, SPHERE_SIZE);
      if ( sphereRaycaster.ray.intersectSphere( sph, surfPoint ) ){
          SELECTED.position.copy( surfPoint.sub(sphere.position) );
          SELECTED.lookAt(center);
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
	var vector = pos.clone().project(camera);
	vector.x = (vector.x + 1)/2 * canvasWidth;
	vector.y = -(vector.y - 1)/2 * canvasHeight;
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
