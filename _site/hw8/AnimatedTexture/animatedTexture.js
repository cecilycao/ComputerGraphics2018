'use strict'
////////////////////////////////////////////////////////////////////////////////
/*global THREE, document, window  */
var knight, camera, scene, renderer, gui, params, cameraControls;
var tgTex, texture, material, i = 0;

var clock = new THREE.Clock();

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
  };
  
  gui.add(params, 'xtrans').min(-100).max(100).step(5).name('X translation');
	gui.add(params, 'ytrans').min(-100).max(100).step(5).name('Y translation');
  gui.add(params, 'ztrans').min(-100).max(100).step(5).name('Z translation');
	gui.add(params, 'xrot').min(-180).max(180).step(10).name('X rotation');
	gui.add(params, 'yrot').min(-180).max(180).step(10).name('Y rotation');
  gui.add(params, 'zrot').min(-180).max(180).step(10).name('Z rotation');
	gui.domElement.style.position = "relative";
	gui.domElement.style.top = "-400px";
	gui.domElement.style.left = "350px";

	// LIGHTS

	scene.add( new THREE.AmbientLight( 0x222222 ) );

	var light = new THREE.DirectionalLight( 0xffffff, 0.7 );
	light.position.set( 200, 500, 500 );

	scene.add( light );

	light = new THREE.DirectionalLight( 0xdddddd, 0.9 );
	light.position.set( -200, -100, -400 );

	scene.add( light );

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

  tgTex = new TG.Texture(256, 256)
    .add( new TG.LinearGradient().interpolation( 1 )
        .point( 0,    [ 1, 0, 0 ] )
        .point( 0.2,  [ 1, 1, 0 ] )
        .point( 0.4,  [ 0, 1, 0 ] )
        .point( 0.6,  [ 0, 1, 1 ] )
        .point( 0.8,  [ 0, 0, 1 ] ) 
        .point( 1.0,  [ 1, 0, 1 ] ) 
      ).toCanvas(); 

  texture = new THREE.Texture(tgTex);
  texture.needsUpdate = true;
  
  material = new THREE.MeshLambertMaterial( { 
    map: texture, 
  } )
  
	var loader = new THREE.OBJLoader( manager );
		loader.load( 'chessknightflatUV.obj', function ( object ) {
      knight = new THREE.Mesh( 
        object.children[0].geometry, 
        material
      );  
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
	camera.position.set( -1300, 200, 2300);
	cameraControls.target.set(400, 50 , 400);
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
    knight.position.x = params.xtrans;
    knight.position.y = params.ytrans;
    knight.position.z = params.ztrans;
    
    // You can base the animation of your texture on this variable. This 
    // increments i by 0.005 and then resets it to 0.0 when it gets to 1.0. 
    i = i < 1.0 ? i + 0.005 : 0.0;
    
    /*
    TODO:
    You'll need to reassign tgTex and texture as new TG.Texture and
    THREE.Texture objects, respectively, then assign the new texture to 
    knight.material.map. Study the preceding code to see how this is done,
    and don't forget to set the texture to needsUpdate = true
    
    In the non-animated texture set above, the linear gradient spans between 
    points 0.0 and 1.0, which represent the extent of the UV space. You may set 
    points beyond this range, but they will not be visible outside of this range. 
    Use this fact, along with the i value which loops from 0.0 to 1.0, to create 
    your endlessly cycling animated rainbow texture. 
    */
    
    // BEGIN CHANGES
    tgTex = new TG.Texture(256, 256)
    .add( new TG.LinearGradient().interpolation( 1 )
        .point( -1.0 + i,    [ 1, 0, 0 ] )
        .point( -0.8 + i,  [ 1, 1, 0 ] )
        .point( -0.6 + i,  [ 0, 1, 0 ] )
        .point( -0.4 + i,  [ 0, 1, 1 ] )
        .point( -0.2 + i,  [ 0, 0, 1 ] ) 
        .point( 0 + i,    [ 1, 0, 0 ] )
        .point( 0.2 + i,  [ 1, 1, 0 ] )
        .point( 0.4 + i,  [ 0, 1, 0 ] )
        .point( 0.6 + i,  [ 0, 1, 1 ] )
        .point( 0.8 + i,  [ 0, 0, 1 ] ) 
        .point( 1.0 + i,  [ 1, 0, 1 ] ) 
      ).toCanvas(); 

  texture = new THREE.Texture(tgTex);
  texture.needsUpdate = true;

  knight.material.map = texture;
    
    // END CHANGES

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
