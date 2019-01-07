'use strict'
////////////////////////////////////////////////////////////////////////////////
/*global THREE, document, window  */
var knight, camera, scene, renderer, gui, params, cameraControls;

var clock = new THREE.Clock();

var posx = -300;
var posy = 450;
var posz = -300;

var xMirrorMatrix = new THREE.Matrix4();
var yMirrorMatrix   = new THREE.Matrix4();
var zMirrorMatrix = new THREE.Matrix4();
var multiAxisTransformMatrix = new THREE.Matrix4();

var xCopy, yCopy, zCopy, multiCopy;

function fillScene() {
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog( 0x808080, 3000, 5000 );
  

// Set up gui sliders
	gui = new dat.GUI({
		autoPlace: false,
    height : (32 * 3)- 1
	});

  params = {
    xtrans: 0,
    ytrans: 0,
    ztrans: 0,
  	xrot: 0,
  	yrot: 0,
  	zrot: 0,
    xmir: false,
    ymir: false,
    zmir: false,
    multitrans: false
  };
  
  gui.add(params, 'xtrans').min(-100).max(100).step(5).name('X translation');
	gui.add(params, 'ytrans').min(-100).max(100).step(5).name('Y translation');
  gui.add(params, 'ztrans').min(-100).max(100).step(5).name('Z translation');
	gui.add(params, 'xrot').min(-180).max(180).step(10).name('X rotation');
	gui.add(params, 'yrot').min(-180).max(180).step(10).name('Y rotation');
  gui.add(params, 'zrot').min(-180).max(180).step(10).name('Z rotation');
  gui.add(params, 'xmir').name('X mirror');
  gui.add(params, 'ymir').name('Y mirror');
  gui.add(params, 'zmir').name('Z mirror');
  gui.add(params, 'multitrans').name('Multi-axis');
	gui.domElement.style.position = "relative";
	gui.domElement.style.top = "-400px";
	gui.domElement.style.left = "350px";
  
  gui.__controllers.forEach(function(ct){
    ct.onChange(function(val){
      xCopy.visible = params.xmir;
      yCopy.visible = params.ymir;
      zCopy.visible = params.zmir;
      multiCopy.visible = params.multitrans;
      //console.log(knight.matrix);
      calculateMirrorTransforms();
    })
  })

	// LIGHTS

	scene.add( new THREE.AmbientLight( 0x222222 ) );

	var light = new THREE.DirectionalLight( 0xffffff, 0.7 );
	light.position.set( 200, 500, 500 );

	scene.add( light );

	light = new THREE.DirectionalLight( 0xdddddd, 0.9 );
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

	var loader = new THREE.OBJLoader( manager );
		loader.load( 'chessknightexport.obj', function ( object ) {
      knight = object.children[0];
      knight.position.x = posx;
      knight.position.y = posy;
      knight.position.z = posz;
			scene.add( knight );
      createCopies();
		}, onProgress, onError );
}

function createCopies() {
  xCopy = new THREE.Mesh( 
    knight.geometry, 
    new THREE.MeshLambertMaterial( { 
      color: 0xff0000, 
      side: THREE.DoubleSide
    } )
  );
  xCopy.visible = params.xmir;
  //xCopy.visible = true;
  scene.add( xCopy );
  
  yCopy = new THREE.Mesh( 
    knight.geometry, 
    new THREE.MeshLambertMaterial( { 
      color: 0x00ff00,
      side: THREE.DoubleSide
     } )
  );
  yCopy.visible = params.ymir;
  scene.add( yCopy );
  
  zCopy = new THREE.Mesh( 
    knight.geometry, 
    new THREE.MeshLambertMaterial( { 
      color: 0x0000ff,
      side: THREE.DoubleSide 
    } )
  );
  zCopy.visible = params.zmir;
  scene.add( zCopy );
  
  // Now for something a little different. This uses texgen.js procedural 
  // texture generator to combine colored checkerboard patterns to give this 
  // object a multicolored procedural. 
  // https://github.com/mrdoob/texgen.js/blob/master/README.md
  var tgTexture = new TG.Texture( 256, 256 )
      .add( new TG.CheckerBoard().size(6, 6).tint(1, 0, 0) )
      .add( new TG.CheckerBoard().size(6, 6).offset(2, 2).tint(0, 1, 0) )
      .add( new TG.CheckerBoard().size(6, 6).offset(4, 4).tint(0, 0, 1) )
      .sub( new TG.CheckerBoard().size(3, 3) )

  var texture = new THREE.Texture(tgTexture.toCanvas());
  texture.needsUpdate = true;
  
  multiCopy = new THREE.Mesh( 
    knight.geometry, 
    new THREE.MeshLambertMaterial( { 
      map: texture, // here's the procedural texture we made above
      side: THREE.DoubleSide 
    } )
  );
  multiCopy.visible = params.multitrans;
  scene.add( multiCopy );
  
  xCopy.matrixAutoUpdate = false;
  yCopy.matrixAutoUpdate = false;
  zCopy.matrixAutoUpdate = false;
  multiCopy.matrixAutoUpdate = false;
  
  calculateMirrorTransforms();
}

function calculateMirrorTransforms() { 
  /*
  TODO: Create the transformations as shown in the video on the assignment page.
  You need to set matrices on the objects xCopy, yCopy, zCopy, and multiCopy.
  xCopy is mirrored along the X axis, yCopy along the Y axis, zCopy along the Z axis,
  and multiCopy is transformed on several axes (you need to work out exactly how)
  the transformations should go.
  
  Each object's matrix should be set to the identity matrix at the beginning of
  this function. Each object's matrix should be multiplied by the knight object's matrix
  and then by the appropriate transformation matrix specific to the object. The matrices 
  have been declared above (xMirrorMatrix, yMirrorMatrix, zMirrorMatrix, 
  multiAxisTransformationMatrix). You will have to set the 16 values of each matrix 
  with the .set() method. 
  
  https://threejs.org/docs/#api/math/Matrix4
  
  Be careful of the ordering when multiplying the matrices. Matrices in Three.js are 
  left-multiplied, which may be counter-intuitive. 
  */
  
  //BEGIN CHANGES
  if (knight){
    xCopy.matrix.identity();
    yCopy.matrix.identity();
    zCopy.matrix.identity();
    multiCopy.matrix.identity();

    //console.log(knight.matrix);
    
    var x;
    var y;
    var z;
    x = knight.matrix.elements[12];
    y = knight.matrix.elements[13];
    z = knight.matrix.elements[14];

    
    xMirrorMatrix.set(
      -1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1);

    yMirrorMatrix.set(
      1, 0, 0, 0,
      0, -1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1);



    zMirrorMatrix.set(
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, -1, 0,
      0, 0, 0, 1);


    multiAxisTransformMatrix.set(
      0, 1, 0, 0,
      0, 0, -1, 0,
      -1, 0, 0, 0,
      0, 0, 0, 1);

    xCopy.matrix.multiply(xMirrorMatrix).multiply(knight.matrix);
    yCopy.matrix.multiply(yMirrorMatrix).multiply(knight.matrix);
    zCopy.matrix.multiply(zMirrorMatrix).multiply(knight.matrix);
    multiCopy.matrix.multiply(multiAxisTransformMatrix).multiply(knight.matrix);

  }
  //END CHANGES
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
	camera.position.set( -1000, 1400, 1900);
	cameraControls.target.set(450, 150 , 400);
}

function addToDOM() {
    var canvas = document.getElementById('canvas');
    canvas.appendChild(renderer.domElement);
    canvas.appendChild(gui.domElement);
}

function animate() {
  update();
	window.requestAnimationFrame(animate);
	render();
}

function update(){
  if(knight) {
    knight.rotation.x = params.xrot/180*Math.PI;
    knight.rotation.y = params.yrot/180*Math.PI;
    knight.rotation.z = params.zrot/180*Math.PI;
    knight.position.x = posx + params.xtrans;
    knight.position.y = posy + params.ytrans;
    knight.position.z = posz + params.ztrans;
  }
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
