////////////////////////////////////////////////////////////////////////////////
/*global THREE, document, window  */
var camera, renderer, gui;
var objects;

var clock = new THREE.Clock();
var scene = new THREE.Scene();

var intersection = new THREE.Vector3(), mouse = new THREE.Vector2(),
    canvasWidth, canvasHeight, INTERSECTED, SELECTED;
var plane = new THREE.Plane(),
    offset = new THREE.Vector3();

var projector = new THREE.Projector();
var raycaster = new THREE.Raycaster();
var clock = new THREE.Clock();

function fillScene() {
	scene.fog = new THREE.Fog( 0x808080, 2000, 4000 );
  

// Set up gui sliders
	gui = new dat.GUI({
		autoPlace: false,
    height : (32 * 3)- 1
	});

  params = {
  	t: 0.5,
  };
  
	gui.add(params, 't').min(0.0).max(1.0).step(0.1).name('Red To Blue');


	gui.domElement.style.position = "relative";
	gui.domElement.style.top = "-400px";
	gui.domElement.style.left = "350px";

	// LIGHTS

	scene.add( new THREE.AmbientLight( 0x222222 ) );

	var light = new THREE.DirectionalLight( 0xffffff, 0.7 );
	light.position.set( 200, 500, 500 );

	scene.add( light );

	light = new THREE.DirectionalLight( 0xffffff, 0.9 );
	light.position.set( -200, -100, -400 );

	scene.add( light );

	//grid xz
	var gridXZ = new THREE.GridHelper(2000, 100,  new THREE.Color(0xCCCCCC), new THREE.Color(0x888888));
	scene.add(gridXZ);

	//axes
	var axes = new THREE.AxisHelper(150);
  axes.scale.set(7,7,7);
	scene.add(axes);

	drawCircle();
}


function drawCircle() {
  var geometry = new THREE.CircleGeometry( 150, 32 );
  var material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
  var circle = new THREE.Mesh( geometry, material );
  circle.position.z = -50;
  scene.add( circle );
  
    
  redBall = new THREE.Mesh( new THREE.SphereGeometry( 15, 12, 12),
                       new THREE.MeshLambertMaterial({ 
                         color: 0xff0000,
                         transparent: true,
                         opacity: 0.7
                       }));
  scene.add( redBall );
  redBall.position.x = 150;

  blueBall = new THREE.Mesh( new THREE.SphereGeometry( 15, 12, 12),
                       new THREE.MeshLambertMaterial({ 
                         color: 0x0000ff,
                         transparent: true,
                         opacity: 0.7 }));
  scene.add( blueBall );
  blueBall.position.y = 150;
  
  middleBall = new THREE.Mesh( new THREE.SphereGeometry( 10, 12, 12),
                       new THREE.MeshLambertMaterial({ color: 0xffff00 }));
  scene.add( middleBall );
  
  objects = [blueBall, redBall];
  
  animate();
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
	// CAMERA
	camera = new THREE.OrthographicCamera( canvasWidth / - 2, canvasWidth / 2, canvasHeight / 2, canvasHeight / - 2, 1, 1000 );
  camera.position.set( 0, 20, 100);
  
  camera.lookAt( new THREE.Vector3(0, 20, 0));
  scene.add( camera );  
}

function addToDOM() {
    var canvas = document.getElementById('canvas');
    canvas.appendChild(renderer.domElement);
    canvas.appendChild(gui.domElement);
}

function calculateInterpolation() {
  /*
  TODO: Calculate the coordinates of middleBall.position such
  that it correctly is positioned according to params.t along the 
  perimeter of the circle from the red to blue ball. If t == 0, the 
  yellow ball should occupy the same point as the red ball, if t == 1 it
  should occupy the same point as the blue ball, if t == 0.5 it should
  be positioned halfway between the two balls on the edge of the circle, 
  etc. 
  
  Refer to the discussion on spherical linear interpolation 
  from page 259 in Math Primer. The code here will closely follow 
  the introductory example in 2D. 
  */
  // BEGIN CHANGES
  var v0 = new THREE.Vector3(redBall.position.x, redBall.position.y, 0).normalize();
  var v1 = new THREE.Vector3(blueBall.position.x, blueBall.position.y, 0).normalize();

  var angle = v0.angleTo(v1);
  //console.log(angle);

  var k1 = Math.sin(params.t * angle) / Math.sin(angle);
  var k0 = Math.sin((1-params.t) * angle) / Math.sin(angle);

  var vt = v0.multiplyScalar(k0).add(v1.multiplyScalar(k1));
  //console.log(vt);

  middleBall.position.x = vt.x * 150;
  middleBall.position.y = vt.y * 150;


  
  // END CHANGES
}

function animate() {
  calculateInterpolation();
	window.requestAnimationFrame(animate);
	render();
}

function render() {
	var delta = clock.getDelta();
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

      SELECTED.position.copy( intersection.sub( offset ).clone().normalize().multiplyScalar(150) );
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
	if ( INTERSECTED ) {
		SELECTED = null;
	}
	canvas.style.cursor = 'auto';
}

try {
  init();
  fillScene();
  addToDOM();
} catch(error) {
    console.log("Your program encountered an unrecoverable error, can not draw on canvas. Error was:");
    console.log(error);
}
