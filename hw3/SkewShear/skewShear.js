////////////////////////////////////////////////////////////////////////////////
/*global THREE, document, window  */
var camera, scene, renderer, gui;
var cameraControls;

var clock = new THREE.Clock();

var puzzleBox;

var shearMatrix = new THREE.Matrix4();

function fillScene() {
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog( 0x808080, 2000, 4000 );
  

// Set up gui sliders
	gui = new dat.GUI({
		autoPlace: false,
    height : (32 * 3)- 1
	});

  params = {
    a: 0,
    b: 0,
    c: 0,
  };
  
  gui.add(params, 'a').min(-1).max(1).step(0.1).name('A');
	gui.add(params, 'b').min(-1).max(1).step(0.1).name('B');
  gui.add(params, 'c').min(-1).max(1).step(0.1).name('C');


	gui.domElement.style.position = "relative";
	gui.domElement.style.top = "-400px";
	gui.domElement.style.left = "350px";

	// LIGHTS

	scene.add( new THREE.AmbientLight( 0x222222 ) );

	var light = new THREE.DirectionalLight( 0xffffff, 0.7 );
	light.position.set( -200, 500, 500 );

	scene.add( light );

	light = new THREE.DirectionalLight( 0xffffff, 0.9 );
	light.position.set( 200, -100, -400 );

	scene.add( light );

	//grid xz
	var gridXZ = new THREE.GridHelper(2000, 100,  new THREE.Color(0xCCCCCC), new THREE.Color(0x888888));
	scene.add(gridXZ);

	//axes
	var axes = new THREE.AxisHelper(150);
  axes.scale.set(7,7,7);
	scene.add(axes);

	drawPuzzleBox();
}

function drawPuzzleBox() {
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

	var puzzleBoxTex = new THREE.Texture();
  
	var loader = new THREE.ImageLoader( manager );
	loader.load( 'Full.png', function ( image ) {
		puzzleBoxTex.image = image;
		puzzleBoxTex.needsUpdate = true;
	} );

	loader = new THREE.OBJLoader( manager );
		loader.load( 'puzzlebox.obj', function ( object ) {
			object.traverse( function ( child ) {
				if ( child instanceof THREE.Mesh ) {
					child.material.map = puzzleBoxTex;
				}
			} );
      puzzleBox = object;
      puzzleBox.matrixAutoUpdate = false;
			scene.add( puzzleBox );
		}, onProgress, onError );
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
	camera.position.set( -1200, 1000, 1200);
	cameraControls.target.set(250,-50,250);
}

function addToDOM() {
    var canvas = document.getElementById('canvas');
    canvas.appendChild(renderer.domElement);
    canvas.appendChild(gui.domElement);
}

function animate() {
  if (puzzleBox) {
    puzzleBox.matrix.identity();
    /*TODO:
    Use the params values and whatever other variables or operators
    are necessary to fill in the shear matrix below such that the 
    GUI sliders create the transforms described in the assignment description.
    No other changes to the code are necessary.
    */
    // BEGIN CHANGES

    shearMatrix.set( 
   	1, 0, params.a, 0,
   	0, 1, params.b, 0,
   	params.c, 0, 1, 0,
    0,   0,   0, 1 
    );
    // END CHANGES
    puzzleBox.matrix.multiply(shearMatrix);
  }
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
