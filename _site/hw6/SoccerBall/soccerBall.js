////////////////////////////////////////////////////////////////////////////////
/*global THREE, document, window  */
var camera, scene, renderer, cameraControls;
var objects = [];
var plane = new THREE.Plane(),
mouse = new THREE.Vector2(),
offset = new THREE.Vector3(),
intersection = new THREE.Vector3(), INTERSECTED, SELECTED;
var raycaster = new THREE.Raycaster();
var cameraControls;
var canvasWidth = 600;
var canvasHeight = 400;
var canvas = document.getElementById('canvas');
var clock = new THREE.Clock();
var ball = new THREE.Object3D();
var spinSpeed = 0;
var spinAxis = new THREE.Vector3(0, 1, 0);
var spinAngle = 0;
var swiping = false;

function fillScene() {
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog( 0x808080, 2000, 4000 );

	// LIGHTS
	scene.add( new THREE.AmbientLight( 0x222222 ) );

	var light = new THREE.SpotLight( 0xffffdd, 0.7 );
	light.position.set( 0, 600, -200 );

	scene.add( light );

	light = new THREE.SpotLight( 0xffdddd, 0.5, 0.0,  Math.PI/2, 1.0 );
  console.log(light.penumbra);
	light.position.set( 100, -300, 500 );

	scene.add( light );

//grid xz
 var gridXZ = new THREE.GridHelper(2000, 100, new THREE.Color(0xCCCCCC), new THREE.Color(0x888888));
 scene.add(gridXZ);

 //axes
 var axes = new THREE.AxisHelper(150);
 axes.position.y = 1;
 scene.add(axes);
 drawSoccerBall();
}

function drawSoccerBall() {
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
  mtlLoader.load('soccer_ball.mtl', function(materials) {
    materials.preload();
    var objLoader = new THREE.OBJLoader();
    objLoader.setMaterials(materials);
    objLoader.load('soccer_ball.obj', function(object) {
      ball = object.children[0];
      objects.push(ball);
      scene.add(ball);
    }, onProgress, onError);
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
  cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
	camera.position.set( 800, 800, -800);
	camera.lookAt( new THREE.Vector3(0, 0, 0));
}

function addToDOM() {
  canvas.appendChild(renderer.domElement);
}

function animate() {
	window.requestAnimationFrame(animate);
	render();
}

function render() {
  /*
	TODO: We need to do a couple of things with spinSpeed. First, we set it
	based on the swipe, which happens in the onDocumentMouseMove function. 

  Then, we want it to gradually slow down and eventually stop. We do that
	here. Check whether spinSpeed is above some small threshold. 
  If it's below the  threshold, set it to 0.
  If it's above the threshold, reduce it's value to make it
	slow down in a natural-looking way. This does not need to be physically accurate,
	just reasonably natural looking.
	*/
  
  // BEGIN CHANGES

	if (spinAngle > Math.PI * 2) {
		spinAngle = spinAngle - Math.PI * 2;
	}

  if (spinSpeed < 0.1){
    spinSpeed = 0;
  } else {
    spinSpeed = spinSpeed * 0.95;
  }


	spinAngle = spinAngle + spinSpeed;
  
  
  // END CHANGES


  // Here we set the rotation axis using quaternions
  var quaternion = new THREE.Quaternion().setFromAxisAngle( spinAxis, spinAngle );
  
  ball.rotation.setFromQuaternion( quaternion );

	/*
	FYI: You can use the code below instead of the two
	lines of code above, with similar effect, however, you'll need to disable
  the matrixAutoUpdate because the matrix is set manually (using its method).
  I've found the quaternion approach yields smoother rotation. 
	*/

	// setting matrix values directly requires disabling autoupdate
	// ball.matrixAutoUpdate = false;
	// ball.matrix.makeRotationAxis( spinAxis, spinAngle);

	renderer.render(scene, camera);
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
     - ( clientY / window.innerHeight ) * 2 + 1,
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

function onDocumentMouseMove( event ) {
  if ( !mouseDown ) {
    return
  } else {
  	event.preventDefault();
    // uses Three.js built-in raycaster to send a ray from the camera
  	raycaster.setFromCamera( mouse, camera );
  	if ( SELECTED ) {
  		// Get a point in 3D space corresponding to the end (so far) of the mouse swipe.
  		swipeEnd = getMousePoint(event.clientX, event.clientY);
      
    	/*
  		TODO: We need a vector to represent the swipe so far. We have the point that the
  		user first clicked the mouse button, and the current location of the mouse. We need
  		the vector between them. This vector will necessarily be parallel to the viewing plane,
  		and perpendicular to the direction the camera is looking. Since in this example
  		the camera is looking at the origin of the space, this vector will also happen to
  		be perpendicular to the camera's position vector.
  
  	 	You'll need to create a THREE.Vector3 object to represent the swipe vector.
  		*/

      swipe.subVectors(swipeEnd, swipeStart);
      
  
  		/*
  		TODO: Once you've got the swipe vector, you'll need to set the spinAxis for the
  		ball to spin around on. You'll use the swipe vector along with the camera.position
  		vector to derive this vector (see the assignment web page for more hints). Don't
  		forget to normalize! 
  		*/


      spinAxis.crossVectors(camera.position, swipe);
      spinAxis = spinAxis.normalize();
      console.log("axis" + spinAxis);

  
  		/*
  		TODO: Set the spinSpeed value so that the speed the ball spins depends on the speed
  		of the swipe motion. This is going to be related to the length of the swipe vector and
  		the amount of time that has passed between moouseDown and this moment. You can get the
  		current elapsed time from the clock using clock.getElapsedTime(). Do this in the mouseDown
  		function. Read the docs for how to use getDelta. The spin speed will need
  		some adjusting to yield usable values for rotation, so divide it by a suitable value to
  		get it small enough.
      https://threejs.org/docs/#api/core/Clock
      Also, if the swipe vector is zero or very short, the ball's 
      behavior can appear jumpy. I recommend setting the spinSpeed only if the swipe
      vector is some reasonable length (around 20 units worked best for me).
      
      The ball will sometimes appear to jump a little bit when the axis is changed. This can be 
      corrected by applying the ball object's matrix to the ball's geometry, and then resetting
      the ball object's matrix to the identity matrix. Discuss why you think this works in your 
      readme. 
  		*/
      
      if (swipe.length() > 20){
        console.log("length" + swipe.length());
        spinSpeed = swipe.length() / clock.getDelta() / 1000;
        console.log("speed" + spinSpeed);
      }


  	}
  }
}
	

// handles mouse down event
function onDocumentMouseDown( event ) {

	event.preventDefault();
  // this converts window mouse values to x and y mouse coordinates that range
  // between -1 and 1 in the canvas
  mouse.set(
     (( event.clientX / window.innerWidth ) * 2 - 1) *
     (window.innerWidth/canvasWidth),
     (-((event.clientY - ($("#canvas").position().top + (canvasHeight/2))) / window.innerHeight) * 2 )
     * (window.innerHeight/canvasHeight));
  mouseDown = true
  swiping = true;

	raycaster.setFromCamera( mouse, camera );
	var intersects = raycaster.intersectObjects( objects );
	if ( intersects.length > 0 ) {
		cameraControls.enabled = false; // Don't move the camera when the mouse is over the ball
    SELECTED = intersects[ 0 ].object;
		canvas.style.cursor = 'move';
    // We're doing all this inside this conditional to ensure that we spin the ball only when the
    // mouse is over the ball, and otherwise we control the camera. 
    
    /* TODO: Get the elapsed time from the clock here, so that you can get
    the delta during the mouse move
  	https://threejs.org/docs/#api/core/Clock
    */
    // BEGIN CHANGES
    clock.getElapsedTime();
    
    // END CHANGES
    
    // Here we set the start point of the swipe
    swipeStart = getMousePoint(event.clientX, event.clientY);
	} else {
    SELECTED = null;
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
  swiping = false;
  mouseDown = false;
}

function addMouseHandler(canvas) {
    canvas.addEventListener('mousemove', function (e) {
      onDocumentMouseMove(e);
    }, false);
    canvas.addEventListener('mousedown', function (e) {
      onDocumentMouseDown(e);
    }, false);
    canvas.addEventListener('mouseup', function (e) {
      onDocumentMouseUp(e);
    }, false);
		canvas.addEventListener ("mouseout", function (e) {
			e.preventDefault();
			mouseDown = false;
    }, false);
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
