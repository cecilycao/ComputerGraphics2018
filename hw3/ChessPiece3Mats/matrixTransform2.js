////////////////////////////////////////////////////////////////////////////////
/*global THREE, document, window  */
var camera, scene, renderer, gui;
var cameraControls;

var clock = new THREE.Clock();

var knight;

// Define the transformation matrices we'll use later
var translationMatrix = new THREE.Matrix4();
var rotationMatrix   = new THREE.Matrix4();
var scalingMatrix = new THREE.Matrix4();

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
	cameraControls.target.set(0,0,0);
}

function addToDOM() {
    var canvas = document.getElementById('canvas');
    canvas.appendChild(renderer.domElement);
    canvas.appendChild(gui.domElement);
}

function animate() {
  if (knight) { // This is to prevent a crash when the obj file is still loading
    knight.matrix.identity();
    
    /*
    TODO:
    Previously, you set up matrices to translate, rotate, and scale along each
    of the axes individually. Since matrix multiplication is associative, we know
    that it's possible to represent multiple transformations in a single matrix.
    In this exercise, rather than using 9 matrices, use only 3 matrices to 
    accomplish the same behavior. Put translation on all three axes into one
    translation matrix, all scaling into one scaling matrix, and all rotations
    into one rotation matrix. 
    
    Two of these three are very straightforward. One of them requires a bit of
    non-trivial manual matrix multiplication. Refer to the slides and textbook 
    to refresh your memory on this if necessary. Of course, you should also refer
    to your solution for the previous exercise, as these composed matrices are 
    the products of those matrices.  
    
    Be sure to multiply the projection matrices in the order that produces the correct
    results.
    */
    
    translationMatrix.set( 
        1, 0, 0, params.xtrans,
        0, 1, 0, params.ytrans,
        0, 0, 1, params.ztrans,
        0, 0, 0, 1 
       );
    scalingMatrix.set( 
        params.xscale, 0, 0, 0,
        0, params.yscale, 0, 0,
        0, 0, params.zscale, 0,
        0, 0, 0, 1 
       );

    var x = params.xrot * Math.PI / 180;
    var y = params.yrot * Math.PI / 180;
    var z = params.zrot * Math.PI / 180;

    rotationMatrix.set( 
        Math.cos(y)*Math.cos(z), Math.cos(z)*Math.sin(x)*Math.sin(y) - Math.cos(x)*Math.sin(z), Math.cos(x)*Math.cos(z)*Math.sin(y) + Math.sin(x)*Math.sin(z), 0,
        Math.cos(y)*Math.sin(z), Math.cos(x)*Math.cos(z) + Math.sin(x)*Math.sin(y)*Math.sin(z), - Math.cos(z)*Math.sin(x) + Math.cos(x)*Math.sin(y)*Math.sin(z), 0,
        - Math.sin(y), Math.cos(y)*Math.sin(x), Math.cos(x)*Math.cos(y), 0,
        0, 0, 0, 1 
       );
    
    knight.matrix.multiply(translationMatrix)
                  .multiply(rotationMatrix)
                  .multiply(scalingMatrix);


    // END OF YOUR CHANGES
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
