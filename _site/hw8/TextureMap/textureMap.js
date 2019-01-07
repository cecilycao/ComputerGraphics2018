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
    gap: 20,
    angle: 0,
    wire: false
  };
  
  gui.add(params, 'angle').min(0).max(90).step(5).name('Rotation');
  gui.add(params, 'gap').min(0).max(40).step(1).name('Gap');
  gui.add(params, 'wire').name('Wireframe');

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
  plane0 = new THREE.Mesh(new THREE.PlaneGeometry( 500, 500), material );
  plane1 = new THREE.Mesh(new THREE.PlaneGeometry( 500, 500), material );
  plane2 = new THREE.Mesh(new THREE.PlaneGeometry( 500, 500), material );
  plane3 = new THREE.Mesh(new THREE.PlaneGeometry( 500, 500), material );
  
  plane0.position.z = plane1.position.z = plane2.position.z = plane3.position.z = -50;
  
  /*
  TODO: Here's an explicit mapping for the two triangles of plane0. This 
  is in fact the default mapping, so plane1, plane2, and plane3 are all 
  mapped the same, but I include this mapping as a reference to help you get 
  started. You should create mappings for all four planes such that each 
  plane contains one fourth of the yoda image.
  
  Furthe down below, in the updatePlanes() function you'll update the UVs so 
  that they animate with the changing params values. 
  */
  
  // BEGIN CHANGES
  
  plane0.geometry.faceVertexUvs[0][0] = 
  [
    new THREE.Vector2(0, 0.5),
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.5, 0.5), 
   ];
  plane0.geometry.faceVertexUvs[0][1] = 
  [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.5, 0),
    new THREE.Vector2(0.5, 0.5),
   ];

  plane1.geometry.faceVertexUvs[0][0] = 
  [
    new THREE.Vector2(0, 1),
    new THREE.Vector2(0, 0.5),
    new THREE.Vector2(0.5, 1), 
   ];
  plane1.geometry.faceVertexUvs[0][1] = 
  [
    new THREE.Vector2(0, 0.5),
    new THREE.Vector2(0.5, 0.5),
    new THREE.Vector2(0.5, 1),
   ];

  plane2.geometry.faceVertexUvs[0][0] = 
  [
    new THREE.Vector2(0.5, 1),
    new THREE.Vector2(0.5, 0.5),
    new THREE.Vector2(1, 1), 
   ];
  plane2.geometry.faceVertexUvs[0][1] = 
  [
    new THREE.Vector2(0.5, 0.5),
    new THREE.Vector2(1, 0.5),
    new THREE.Vector2(1, 1),
   ];   

  plane3.geometry.faceVertexUvs[0][0] = 
  [
    new THREE.Vector2(0.5, 0.5),
    new THREE.Vector2(0.5, 0),
    new THREE.Vector2(1, 0.5), 
   ];
  plane3.geometry.faceVertexUvs[0][1] = 
  [
    new THREE.Vector2(0.5, 0),
    new THREE.Vector2(1, 0),
    new THREE.Vector2(1, 0.5),
   ];

  
  // END CHANGES
  
  scene.add( plane0 );
  scene.add( plane1 );
  scene.add( plane2 );
  scene.add( plane3 );
}

function updatePlanes(){
  if(params.wire) {
    var wfMat = new THREE.LineBasicMaterial( { 
      color: 0xffffff, 
      linewidth: 2 }
    );
    
    wf0 = new THREE.LineSegments( plane0.geometry, wfMat );
    plane0.add( wf0 );
    wf1 = new THREE.LineSegments( plane1.geometry, wfMat );
    plane1.add( wf1 );
    wf2 = new THREE.LineSegments( plane2.geometry, wfMat );
    plane2.add( wf2 );
    wf3 = new THREE.LineSegments( plane3.geometry, wfMat );
    plane3.add( wf3 );    
  } else {
    for (i = plane0.children.length - 1; i >= 0; i--) {
      plane0.remove(plane0.children[i]);
      plane1.remove(plane1.children[i]);
      plane2.remove(plane2.children[i]);
      plane3.remove(plane3.children[i]);
    }
  }
  plane0.position.x = -(250 + params.gap/2);
  plane0.position.y = -(250 + params.gap/2);
  plane1.position.x = -(250 + params.gap/2);
  plane1.position.y = (250 + params.gap/2);
  plane2.position.x = (250 + params.gap/2);
  plane2.position.y = (250 + params.gap/2);
  plane3.position.x = (250 + params.gap/2);
  plane3.position.y = -(250 + params.gap/2);  


  /*
  TODO:
  Here's where you'll update the UVs. I've written mock updates for
  two vertices which use the params.angle value, but you'll have to 
  change these and write ones for other vertices whose mapping needs to 
  change. You may use whatever approach to interpolating that you wish, 
  provided the Angle slider causes maping to rotate to the right smoothly. 
  The approach I took for the solution file was to use the sine and
  cosine functions of the angle to interpolate between mappings. 
  */
  var angle = params.angle / 180 * Math.PI;
  var NTminusAngle = (90 - params.angle) / 180 * Math.PI;
  var FFminusAngle = (45 - params.angle) / 180 * Math.PI;
  var angleMinusFF = (params.angle - 45) / 180 * Math.PI;
  var cor_display;
  var mid_display;
  mid_display = params.angle < 45 ? 0.5 * Math.tan(angle) : 1 - 0.5 * Math.tan(NTminusAngle);
  cor_display = params.angle < 45 ? 0.5 - 0.5 * Math.tan(FFminusAngle) : 0.5 + 0.5 * Math.tan(angleMinusFF);

  // BEGIN CHANGES
  // Values should be assigned using .set() in order to be updated

  var x_mid = mid_display > 0.5 ? mid_display - 0.5 : 0; //0 - 0 -.. 0 - 0.1 - 0.2 -..-0.5
  var y_mid = mid_display > 0.5 ? 0 : 0.5 - mid_display; //0.5 - 0.4 .. 0.1 - 0 - 0- 0.. 0


  var x_corner = cor_display;
  var y_corner = 1 - cor_display;

  plane0.geometry.faceVertexUvs[0][0][0].set(x_mid, y_mid); 
  plane0.geometry.faceVertexUvs[0][0][1].set(x_corner, 0); 
  //unchangre
  //plane0.geometry.faceVertexUvs[0][0][2].set(0.5, 0.5); 

  plane0.geometry.faceVertexUvs[0][1][0].set(x_corner, 0); 
  plane0.geometry.faceVertexUvs[0][1][1].set(1 - y_mid, x_mid); 
  //unchangre
  //plane0.geometry.faceVertexUvs[0][1][2].set(0.5, 0.5); 


  plane1.geometry.faceVertexUvs[0][0][0].set(0, y_corner); 
  plane1.geometry.faceVertexUvs[0][0][1].set(x_mid, y_mid); 
  plane1.geometry.faceVertexUvs[0][0][2].set(y_mid, 1 - x_mid); 

  plane1.geometry.faceVertexUvs[0][1][0].set(x_mid, y_mid);
  //unchangre 
  //plane1.geometry.faceVertexUvs[0][1][1].set(0.5, 0.5); 
  plane1.geometry.faceVertexUvs[0][1][2].set(y_mid, 1 - x_mid); 

  
  plane2.geometry.faceVertexUvs[0][0][0].set(y_mid, 1 - x_mid); 
  //unchange
  //plane2.geometry.faceVertexUvs[0][0][1].set(0.5, 0.5); 
  plane2.geometry.faceVertexUvs[0][0][2].set(y_corner, 1); 

  //unchange
  //plane2.geometry.faceVertexUvs[0][1][0].set(0.5, 0.5); 
  plane2.geometry.faceVertexUvs[0][1][1].set(1 - x_mid, 1 - y_mid); 
  plane2.geometry.faceVertexUvs[0][1][2].set(y_corner, 1); 


  //unchangre
  //plane3.geometry.faceVertexUvs[0][0][0].set(0.5, 0.5); 
  plane3.geometry.faceVertexUvs[0][0][1].set(1 - y_mid, x_mid); 
  plane3.geometry.faceVertexUvs[0][0][2].set(1 - x_mid, 1 - y_mid); 

  plane3.geometry.faceVertexUvs[0][1][0].set(1 - y_mid, x_mid); 
  plane3.geometry.faceVertexUvs[0][1][1].set(1, x_corner); 
  plane3.geometry.faceVertexUvs[0][1][2].set(1 - x_mid, 1 - y_mid); 


    
  // Changes that need updating must be flagged as such
  plane0.geometry.uvsNeedUpdate = true;
  plane1.geometry.uvsNeedUpdate = true;
  plane2.geometry.uvsNeedUpdate = true;
  plane3.geometry.uvsNeedUpdate = true;
  // END CHANGES
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
  updatePlanes();
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
