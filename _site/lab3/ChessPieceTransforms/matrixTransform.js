////////////////////////////////////////////////////////////////////////////////
/*global THREE, document, window  */
var camera, scene, renderer, gui;
var cameraControls;

var clock = new THREE.Clock();

var knight;

// Define the transformation matrices we'll use later
var xTransMatrix = new THREE.Matrix4();
var yTransMatrix = new THREE.Matrix4();
var zTransMatrix = new THREE.Matrix4();

var xRotMatrix = new THREE.Matrix4();
var yRotMatrix = new THREE.Matrix4();
var zRotMatrix = new THREE.Matrix4();

var xScaleMatrix = new THREE.Matrix4();
var yScaleMatrix = new THREE.Matrix4();
var zScaleMatrix = new THREE.Matrix4();

function fillScene() {
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog( 0x808080, 2000, 4000 );
  

// Set up gui sliders
	gui = new dat.GUI({
		autoPlace: false,
    height : (32 * 3)- 1
	});

  params = {
    xtrans: 0,
    ytrans: 0,
    ztrans: 1,
  	xrot: 0,
  	yrot: 0,
  	zrot: 0,
    xscale: 1,
    yscale: 1,
    zscale: 1,
  };
  
  gui.add(params, 'xtrans').min(-50).max(50).step(5).name('X translation');
	gui.add(params, 'ytrans').min(-50).max(50).step(5).name('Y translation');
  gui.add(params, 'ztrans').min(-50).max(50).step(5).name('Z translation');
	gui.add(params, 'xrot').min(0).max(180).step(10).name('X rotation');
	gui.add(params, 'yrot').min(0).max(180).step(10).name('Y rotation');
  gui.add(params, 'zrot').min(0).max(180).step(10).name('Z rotation');
  gui.add(params, 'xscale').min(0.5).max(2).step(0.1).name('X scale');
	gui.add(params, 'yscale').min(0.5).max(2).step(0.1).name('Y scale');
  gui.add(params, 'zscale').min(0.5).max(2).step(0.1).name('Z scale');

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

	drawKnight();
}

function drawKnight() {
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

	var knightTex = new THREE.Texture();
  
	var loader = new THREE.ImageLoader( manager );
	loader.load( 'KnightTexture2.png', function ( image ) {
		knightTex.image = image;
		knightTex.needsUpdate = true;
	} );

	loader = new THREE.OBJLoader( manager );
		loader.load( 'chessknightexport.obj', function ( object ) {
			object.traverse( function ( child ) {
				if ( child instanceof THREE.Mesh ) {
					child.material.map = knightTex;
				}
			} );
      knight = object;
      knight.matrixAutoUpdate = false; // Necessary to set the matrix manually
			scene.add( knight );
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
  if (knight) { // This is to prevent a crash when the obj file is still loading
    knight.matrix.identity();
    
    // TODO:
    // Each transformation (translation, rotation, scaling) for each of the three 
    // axes is represented with its own matrix. 
    // The matrices are all then be multiplied by the knight's
    // transformation matrix (which has been re-initialized to the identity 
    // matrix in the lines above.)
    
    // You will set the values of the nine matrices below. Currently, they
    // are each set to the identity matrix, but this will need to change. Review 
    // the slides and/or the textbook on transformation matrices to set the correct 
    // values based upon the slider param values in the params object, for example
    // params.xtrans, params.ytrans, params.xrot, etc. 
    // Remember that rotation values from the params values are in degrees, 
    // but any reference to the angle will need to be converted to radians. Three.js
    // has tools for converting from degrees to radians:
    // https://threejs.org/docs/#api/math/Math
    // You may also need to use JavaScript's own Math functions for some of the 
    // transformations. You can find those here:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math
    
    // DO NOT use any other Three.js functions to set the location, rotation, 
    // or scale of the object. Do not write any new lines of code. 
    // Everything you need is in the following matrices. Normally in Three.js, 
    // we would carry out rotation using built-in functions that hide the actual
    // matrix transformations and give us a more intuitive interface, but for
    // this assignment you must set the values directly. 
    
    // For this assignment, you'll set each transformation on each axis with its
    // own matrix. Simply fill in the appropriate values for each of the matrices
    // below:
    // translation along x
    xTransMatrix.set( 
        1, 0, 0, params.xtrans,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1 
       );
    // translation along y
    yTransMatrix.set( 
        1, 0, 0, 0,
        0, 1, 0, params.ytrans,
        0, 0, 1, 0,
        0, 0, 0, 1 
       );
    // translation along z
    zTransMatrix.set( 
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, params.ztrans,
        0, 0, 0, 1 
       );
    // scaling along x
    xScaleMatrix.set( 
        params.xscale, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1 
       );
    // scaling along y
    yScaleMatrix.set( 
        1, 0, 0, 0,
        0, params.yscale, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1 
       );
    // scaling along z
    zScaleMatrix.set( 
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, params.zscale, 0,
        0, 0, 0, 1 
       );   
    var cos = Math.cos(params.xrot * Math.PI / 180);
    var sin = Math.sin(params.xrot * Math.PI / 180);
    // rotation around x
    xRotMatrix.set( 
        1, 0, 0, 0,
        0, cos, -sin, 0,
        0, sin, cos, 0,
        0, 0, 0, 1 
       );
    // rotation around y
    yRotMatrix.set( 
        Math.cos(params.yrot * Math.PI / 180), 0, Math.sin(params.yrot * Math.PI / 180), 0,
        0, 1, 0, 0,
        -Math.sin(params.yrot * Math.PI / 180), 0,Math.cos(params.yrot * Math.PI / 180), 0,
        0, 0, 0, 1 
        );
    // rotation around z
    zRotMatrix.set( 
        Math.cos(params.zrot * Math.PI / 180), - Math.sin(params.zrot * Math.PI / 180), 0, 0,
        Math.sin(params.zrot * Math.PI / 180), Math.cos(params.zrot * Math.PI / 180), 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1 
       );
    // END OF YOUR CHANGES
    
    // Multiply all transformation matrices
    knight.matrix.multiply(zTransMatrix).multiply(yTransMatrix).multiply(xTransMatrix)
                  .multiply(zRotMatrix).multiply(yRotMatrix).multiply(xRotMatrix)
                  .multiply(zScaleMatrix).multiply(yScaleMatrix).multiply(xScaleMatrix);
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
