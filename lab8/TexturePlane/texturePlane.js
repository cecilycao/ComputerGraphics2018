////////////////////////////////////////////////////////////////////////////////
/*global THREE, document, window  */
var camera, scene, renderer, gui;
var cameraControls;

var clock = new THREE.Clock();
var plane0, plane1, plane2, plane3,
    wf0, wf1, wf2, wf3;

function fillScene() {
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog( 0x808080, 2000, 4000 );
  

// Set up gui sliders
	gui = new dat.GUI({
		autoPlace: false,
    height : (32 * 3)- 1
	});

  params = {
    zoom: 1.0,
  };
  
  gui.add(params, 'zoom').min(1.0).max(2.0).step(0.2).name('Zoom');
	gui.domElement.style.position = "relative";
	gui.domElement.style.top = "-400px";
	gui.domElement.style.left = "350px";

	// LIGHTS

	var light = new THREE.DirectionalLight( 0xffffff, 0.7 );
	light.position.set( 200, 500, 500 );

	scene.add( light );

	light = new THREE.DirectionalLight( 0xffffff, 0.9 );
	light.position.set( -200, -100, -400 );

	scene.add( light );

	//axes
	var axes = new THREE.AxisHelper(150);
  axes.scale.set(7,7,7);
	scene.add(axes);

	drawPlanes();
}

function drawPlanes() {
  var material = new THREE.MeshPhongMaterial( { 
    color: 0xffffff, 
    specular: 0xffffff, 
    shininess: 30,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: 5, 
    polygonOffsetUnits: 5,
    map: new THREE.TextureLoader().load( "yoda.jpg" ) 
  } );
  
  // wireframe
  plane = new THREE.Mesh(new THREE.PlaneGeometry( 700, 700), material );

  plane.position.z = -50;
  

  
  plane.geometry.faceVertexUvs[0][0] = 
  [
    new THREE.Vector2(0, 1),
    new THREE.Vector2(0, 0),
    new THREE.Vector2(1, 1), 
   ];
  plane.geometry.faceVertexUvs[0][1] = 
  [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(1, 0),
    new THREE.Vector2(1, 1),
   ];
  
  scene.add( plane );
}

function updatePlane(){
  /*
  TODO: Set the vertices' UV mapping to animate a zoom-in effect
  according to params.zoom. All you need to do is to change the 
  arguments of the .set() methods below. 
  */
  //params.zoom (1-2)
  var x = (params.zoom - 1) / 4;

  plane.geometry.faceVertexUvs[0][0][0].set(x, 1-x); 
  plane.geometry.faceVertexUvs[0][0][1].set(x, x);
  plane.geometry.faceVertexUvs[0][0][2].set(1-x, 1-x);

  plane.geometry.faceVertexUvs[0][1][0].set(x, x); 
  plane.geometry.faceVertexUvs[0][1][1].set(1-x, x);
  plane.geometry.faceVertexUvs[0][1][2].set(1-x, 1-x);
  
  // This is necessary to call if there have been changes
  plane.geometry.uvsNeedUpdate = true;
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
	camera.position.set( -300, 300, 1200);
	cameraControls.target.set(0, 50, 0);
}

function addToDOM() {
    var canvas = document.getElementById('canvas');
    canvas.appendChild(renderer.domElement);
    canvas.appendChild(gui.domElement);
}

function animate() {
  updatePlane();
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
