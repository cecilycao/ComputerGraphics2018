'use strict'
////////////////////////////////////////////////////////////////////////////////
/*global THREE, Coordinates, document, window  */
var camera, scene, renderer, cameraControls, canvasWidth, canvasHeight, 
  texture1, texture2, texture3, texture4, texture5;
var clock = new THREE.Clock();

function fillScene() {

	scene = new THREE.Scene();
	scene.fog = new THREE.Fog( 0x808080, 2000, 4000 );
	scene.add( new THREE.AmbientLight( 0x222222 ) );

	var light = new THREE.HemisphereLight( 0xffffff, 0.9 );
	light.position.set( 20, 50, 50 );
	scene.add( light );

	light = new THREE.DirectionalLight( 0xffffff, 0.6 );
	light.position.set( -10, 10, -40 );
	scene.add( light );

  //grid xz
  var gridXZ = new THREE.GridHelper(2000, 100, new THREE.Color(0xCCCCCC), new THREE.Color(0x888888));
  scene.add(gridXZ);
  
  //axes
  var axes = new THREE.AxisHelper(150);
  axes.scale.set(1,1,1);
  scene.add(axes);

  drawCubes();
}

function drawCubes() {

  /* TODO:
    For texture 1, you'll want green and black vertical stripes. You'll
    Need to use a TG.SinX generator and set appropriate frequencey and tint
    values. Check out the examples for how to do this. 
  */  
  var tgTex1 = new TG.Texture(256, 256)
  // BEGIN CHANGES
    .add( new TG.SinX().frequency( 0.1 ).tint( 0, 1, 0 ) )


  // END CHANGES

  /* TODO:
    For texture 2, You'll have three checkerboards overlaid and offset. The 
    checkerboards are red (and black), blue (and black) and green (and black). You'll
    need to set the size, offset, and tints of each checkerboard and also decide what
    function to use to combine them. 
  */    
  var tgTex2 = new TG.Texture( 256, 256 )
  // BEGIN CHANGES
    //.add( new TG.CheckerBoard() )
    .add( new TG.CheckerBoard().size(60, 60).tint( 1, 0, 0 ) )
    .add( new TG.CheckerBoard().size(60, 60).offset(20, 20).tint(0, 1, 0))
    .add( new TG.CheckerBoard().size(60, 60).offset(40, 40).tint(0, 0, 1))

    


  // END CHANGES

  /* TODO:
    For texture 3, you'll need a couple of circles and some other components to 
    generate the horizontal stripes. The larger circle is red, and the smaller circle
    is cyan. Think of what operations could be used to quickly generate a cyan overlay 
    on red (the default color for a TG object is white: 1.0, 1.0, 1.0). 
  */
  var tgTex3 = new TG.Texture( 256, 256 )
  // BEGIN CHANGES
    
    .add(new TG.Circle().radius(256/2, 256/2).position(256 / 2, 256 / 2).tint(1, 0, 0))
    .xor( new TG.Circle().position( 256 / 2, 256 / 2 ).tint(1, 1, 1))
    .and( new TG.SinY().frequency( 0.1 ).tint(1, 1, 1))
    

  
  // END CHANGES
    
  /* TODO:
    Use TG.LinearGradient to generate a rainbow gradient using red, 
    magenta, blue, cyan, green, and yellow.
  */
  var tgTex4 = new TG.Texture(256, 256)
      .add( new TG.LinearGradient().interpolation( 2 )
        .point( 0, [ 1, 0, 0 ] )
        .point( 0.2, [ 1, 1, 0] )
        .point( 0.4, [ 0, 1, 0 ] )
        .point( 0.6, [ 0, 1, 1] ) 
        .point( 0.8, [ 0, 0, 1] ) 
        .point( 1, [ 1, 0, 1] ) )
  // BEGIN CHANGES
  
  // END CHANGES
        
  /* TODO:
  Define your own original texture. Use at least three operations or objects
  from the examples files that haven't been used in other textures in this file. 

  */  

   // BEGIN CHANGES
  var size = 256;
  var yourTex = new TG.Texture(size, size)
      .add( new TG.RadialGradient().center( size / 2, size / 2 ).radius( size / 4 ).repeat( true ).interpolation( 0 )
        .point( 0, [ 1, 1, 0 ] )
        .point( 0.25, [ 0, 1, 1] )
        .point( 0.5, [ 1, 0, 1] ) 
        .point( 0.75, [ 1, 1, 0] ) )
      
       .set( new TG.Transform().offset( size / 2, size / 2 ).scale( 1, 1 ) )
       .set( new TG.Twirl().radius( size / 2 ).strength( 130 ).position( size / 2 , size / 2 ) )
       .set( new TG.Pixelate().size( size / 40, size / 40 ) )


 
  
  // END CHANGES
        
  // create THREE.Texture from TG.Texture
  texture1 = new THREE.Texture(tgTex1.toCanvas());
  texture1.needsUpdate = true;
  texture2 = new THREE.Texture(tgTex2.toCanvas());
  texture2.needsUpdate = true;
  texture3 = new THREE.Texture(tgTex3.toCanvas());
  texture3.needsUpdate = true;
  texture4 = new THREE.Texture(tgTex4.toCanvas());
  texture4.needsUpdate = true;
  texture5 = new THREE.Texture(yourTex.toCanvas());
  texture5.needsUpdate = true;
  
  var geometry = new THREE.BoxGeometry( 10, 10, 10);
  
  var material1 = new THREE.MeshLambertMaterial( { 
    map: texture1
  } );
  var material2 = new THREE.MeshLambertMaterial( { 
    map: texture2
  } );
  var material3 = new THREE.MeshLambertMaterial( { 
    map: texture3
  } );
  var material4 = new THREE.MeshLambertMaterial( { 
    map: texture4
  } );
  var material5 = new THREE.MeshLambertMaterial( { 
    map: texture5
  } );
  
  var cube1 = new THREE.Mesh( geometry, material1 );
  scene.add( cube1 );
  cube1.position.x = -8;
  cube1.position.y = 8;
  cube1.position.z = 8;
  
  var cube2 = new THREE.Mesh( geometry, material2 );
  scene.add( cube2 );
  cube2.position.x = 8;
  cube2.position.y = 8;
  cube2.position.z = -8;

  var cube3 = new THREE.Mesh( geometry, material3 );
  scene.add( cube3 );
  cube3.position.x = -8;
  cube3.position.y = -8;
  cube3.position.z = 8;
  
  var cube4 = new THREE.Mesh( geometry, material4 );
  scene.add( cube4 );
  cube4.position.x = 8;
  cube4.position.y = -8;
  cube4.position.z = -8;

  var cube5 = new THREE.Mesh( geometry, material5 );
  scene.add( cube5 );
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
  renderer.setPixelRatio( window.devicePixelRatio );

	// CAMERA
	camera = new THREE.PerspectiveCamera( 45, canvasRatio, 1, 4000 );

	// CONTROLS
	cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
	camera.position.set( 30, 10, 30);
}

function addToDOM() {
    var canvas = document.getElementById('canvas');
    canvas.appendChild(renderer.domElement);
}

function animate() {
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
