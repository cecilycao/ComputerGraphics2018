////////////////////////////////////////////////////////////////////////////////
/*global THREE, document, window  */
var camera, scene, renderer;
var cameraControls;
var canvasWidth = 600;
var canvasHeight = 400;
var canvasPad = 15;
var canvas = document.getElementById('canvas');
var clock = new THREE.Clock();
var spinner;
var loaded = false;
var spinSpeed = 0;
var spinAngle = 0;

function fillScene() {
  var imagePrefix = "../../images/airport/sky-";
  var imageSuffix = ".png";
  var urls  = [imagePrefix+"xpos"+imageSuffix, imagePrefix+"xneg"+imageSuffix,
							imagePrefix+"ypos"+imageSuffix, imagePrefix+"yneg"+imageSuffix,
							imagePrefix+"zpos"+imageSuffix, imagePrefix+"zneg"+imageSuffix];

	scene = new THREE.Scene();
	scene.fog = new THREE.Fog( 0x808080, 2000, 4000 );

	// LIGHTS
	scene.add( new THREE.AmbientLight( 0xffffff, 2 ) );
  
  var light = new THREE.HemisphereLight( 0xffffbb, 0x080820, 2 );
  scene.add( light );

	var light = new THREE.DirectionalLight( 0xffffff, 0.8 );
	light.position.set( -300, 1000, -300 );

	scene.add( light );

	light = new THREE.DirectionalLight( 0xffffff, 0.3 );
	light.position.set( -200, -100, -400 );

	scene.add( light );

//grid xz
 var gridXZ = new THREE.GridHelper(2000, 100, new THREE.Color(0xCCCCCC), new THREE.Color(0x888888));
 scene.add(gridXZ);

 //axes
 var axes = new THREE.AxisHelper(600);
 axes.position.y = 50;
 scene.add(axes);

   var textureLoader = new THREE.CubeTextureLoader();
   textureLoader.load( urls, function (texture) {
     drawFidgetSpinner(texture);
     addToDOM();
     animate();
   } );
   
}

function drawFidgetSpinner(reflectionCube) {
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
  
  var spinnerTex = new THREE.Texture();
  
	var loader = new THREE.ImageLoader( manager );
	loader.load( 'spinnerTexture.png', function ( image ) {
		spinnerTex.image = image;
		spinnerTex.needsUpdate = true;
    
      var mtlLoader = new THREE.MTLLoader();
      mtlLoader.load('fidgetspinner.mtl', function(materials) {
        materials.preload();
        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        
        materials.materials.Metal.combine = THREE.MixOperation;
        materials.materials.Metal.envMap = reflectionCube;
        materials.materials.Metal.reflectivity = 0.75 ;
        materials.materials.Metal.shininess = 40;
        
        objLoader.load('fidgetspinner.obj', function(object) {
          object.traverse( function ( child ) {
    				if ( child instanceof THREE.Mesh ) {
    					child.material.map = spinnerTex;
    				}
    			} );
          spinner = object;
          spinner.position.y = 200;
          spinner.children[0].geometry.computeFaceNormals();
          loaded = true;
          scene.add(spinner);
        }, onProgress, onError);
      });
	});
}

function init() {
	var canvasRatio = canvasWidth / canvasHeight;

	addMouseHandler(canvas);
	// RENDERER
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.setSize(canvasWidth, canvasHeight);
	renderer.setClearColor( 0xAAAAAA, 1.0 );

	// CAMERA
	camera = new THREE.PerspectiveCamera( 45, canvasRatio, 1, 4000 );
	camera.position.set( 0, 1500, 0);
	camera.lookAt( new THREE.Vector3(0, 0, 0));


}

function addToDOM() {
  canvas.appendChild(renderer.domElement);
}

function animate() {
	window.requestAnimationFrame(animate);
	spinSpinner();
  renderer.render(scene, camera);
}

function spinSpinner() {
  /*TODO:
   spinSpeed and spinAngle are declared as global variables already.
   spinAngle is the current rotation of the spinner at the time of rendering,
   and it should increase or decrease (rotate one way or the other) based on
   the value of spinSpeed. spinAngle should be modulo 360 degrees (Pi*2) so that
   it doesn't reach unnecessarily high values. 
   
   spinSpeed will be initially set below (see TODO in onMouseMove) depending
   on the swipe speed and direction. SpinSpeed should decrease by about 2 percent
   per frame, and then go to zero when it reaches some floor value. 
   
   The loaded boolean value is useful to determine whether the spinner object has
   been created. Use this to avoid errors caused by calling methods before fully
   loading the object.
  */
  
  // BEGIN CHANGES

  if(loaded){
    
    if (Math.abs(spinSpeed) < 0.1) {
      spinSpeed = 0;
    }
    
    spinAngle  = Math.abs(spinSpeed) / 2 % (Math.PI*2);

    if(spinSpeed >0){
      spinAngle  = -spinAngle;
    }
    
    spinSpeed = spinSpeed * 97/100;

    spinner.rotation.y = spinAngle;
  }

  // END CHANGES
}

var mouseDown;
var swipeStart;
var swipe = new THREE.Vector3();

/*
This function returns a point "under the mouse" in the 3D space on the
Z=0 plane by "unprojecting" the screen location of the mouse.
*/
function getMousePoint(clientX, clientY){
	/*
	Create a vector based on the mouse location within
	the window. You can think of the z value here as an arbitrary depth.
	*/
	var vector = new THREE.Vector3();
	vector.set(
     ( clientX / window.innerWidth ) * 2 - 1,
     - ( clientY / (canvasHeight + canvasPad) )  * 2 + 1,
     0.5 );
	/*
	To render 3D points to the window, we project them onto a
	2D viewing plane. The unproject method does the opposite. It takes a point
	in screen space and transforms it into a point in 3D space using the camera
	projection matrix. We then extend a ray from the camera location through this
	point to the z=0 plane to get an exact point in 3D space.
	*/
	vector.unproject( camera );
	var dir = vector.sub( camera.position ).normalize();
	var distance = -camera.position.y / dir.y;
	return camera.position.clone().add( dir.multiplyScalar( distance ) );
}

function onMouseDown(evt) {
	evt.preventDefault();
	mouseDown = true;
	clock.getElapsedTime();
	// Get a point in 3D space corresponding to the start of the mouse swipe.
	swipeStart = getMousePoint(evt.clientX, evt.clientY);
}

function onMouseMove(evt) {
  if (!mouseDown) {
    return;
  } else {
	  evt.preventDefault();
		// Get a point in 3D space corresponding to the end (so far) of the mouse swipe.
		swipeEnd = getMousePoint(evt.clientX, evt.clientY);

		/*
		The vector representing the mouse swipe so far. This is updated continuously
		as the mouse continues to be dragged. Note that this vector is necessarily
		parallel to the screen plane and perpendicular to the camera's viewing direction.
		Since the camera is looking at the 0, 0, 0 point, it also happens to be perpendicular
		to the camera's position.
		*/
		swipe.subVectors(swipeEnd, swipeStart);
    if (swipe.length() > 20) {
      // We don't want to do anything unless it's enough of a swipe to be sure. Without this,
      // we'll get jerky behavior.
      /* 
      TODO:
        You need two things here, the spin speed, which will be related to the length of 
        the swipe and the clock's delta value and determine whether the rotation should be 
        in the positive direction or the negative direction. Think about the relationship 
        between the swipe vector and the direction the spinner should rotate. How can the 
        sign of the spin speed (i.e. positive or negative rotation) be determined using 
        a normalized cross product with the swipe vector? Some other vectors involved may
        be helpful. Read the code comments to see how the swipe vector is created. 
        
        For info about working with the clock, check here:
        https://threejs.org/docs/#api/core/Clock
      */
      // BEGIN CHANGES
      
      var startVector = new THREE.Vector3(swipeStart.x, swipeStart.y, swipeStart.z);
      var endVector = new THREE.Vector3(swipeEnd.x, swipeEnd.y, swipeEnd.z);

      var direction = startVector.clone().cross(endVector).normalize();
      
      var deltaTime = clock.getDelta();
      
      if (direction.y > 0) {
        spinSpeed = swipe.length() / deltaTime / 300;
      } else if (direction.y < 0) {
        spinSpeed = - swipe.length() / deltaTime / 300;
      }

      // END CHANGES
    }
	}
}

function addMouseHandler(canvas) {
    canvas.addEventListener('mousemove', function (e) {
      onMouseMove(e);
    }, false);
    canvas.addEventListener('mousedown', function (e) {
      onMouseDown(e);
    }, false);
    canvas.addEventListener('mouseup', function (e) {
			e.preventDefault();
		  mouseDown = false;
    }, false);
		canvas.addEventListener ("mouseout", function (e) {
			e.preventDefault();
			mouseDown = false;
    }, false);
}

try {
  init();
  fillScene();
} catch(error) {
    console.log("Your program encountered an unrecoverable error, can not draw on canvas. Error was:");
    console.log(error);
}
