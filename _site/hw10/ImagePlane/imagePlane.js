'use strict'
////////////////////////////////////////////////////////////////////////////////
/*global THREE, Coordinates, document, window  */
var camera, scene, renderer, cameraControls, canvasWidth, canvasHeight, upCone, 
    atCone, eyeBall, widgetObj, plane, 
    cameraVectorObj, lineUp, lineUpGeom, lineFwd, lineFwdGeom, lineFwdMat, 
    lineView0Geom, lineView1Geom, lineView2Geom, lineView3Geom, 
    lineViewMat, lineView0, lineView1, lineView2, lineView3, greenBalllabel, 
    lineUpMat, atConelabel, gui, params;

var clock = new THREE.Clock();

// Use these vectors in your solution below
var up = new THREE.Vector3(),
    eye = new THREE.Vector3(), 
    at = new THREE.Vector3(), 
    wVec = new THREE.Vector3(), 
    uVec = new THREE.Vector3(), 
    vVec = new THREE.Vector3();

function fillScene() {
  
  // Set up gui sliders
	gui = new dat.GUI({
		autoPlace: false,
    height : (32 * 3)- 1
	});
  
  params = {
    around: 0,
    upAndDown: 70
  }
  
  gui.add(params, 'around').min(-160).max(160).step(5).name('Around');
  gui.add(params, 'upAndDown').min(30).max(110).step(5).name('Up And Down');
	gui.domElement.style.position = "relative";
	gui.domElement.style.top = "-400px";
	gui.domElement.style.left = "350px";
  

	scene = new THREE.Scene();
	scene.fog = new THREE.Fog( 0x808080, 2000, 4000 );
	scene.add( new THREE.AmbientLight( 0x222222 ) );

	var light = new THREE.DirectionalLight( 0xffffff, 0.9 );
	light.position.set( -200, 500, 500 );
	scene.add( light );

	light = new THREE.DirectionalLight( 0xffffff, 0.6 );
	light.position.set( 100, 100, -400 );
	scene.add( light );

  //grid xz
  var gridXZ = new THREE.GridHelper(2000, 100, new THREE.Color(0xCCCCCC), new THREE.Color(0x888888));
  scene.add(gridXZ);

  //axes
  var axes = new THREE.AxisHelper(150);
  axes.position.y = 1;
  scene.add(axes);
  
  drawScene();
}

function drawScene() {
  widgetObj = new THREE.Object3D(); // holds both arrows
  
  eyeBall = new THREE.Mesh( new THREE.SphereGeometry( 15, 12, 12),
                       new THREE.MeshLambertMaterial({ color: 0x555555 }));
  eyeBall.name = 'cop';
  
  upCone = new THREE.Mesh( new THREE.ConeGeometry( 50, 100, 32 ),
            new THREE.MeshLambertMaterial({ color: 0x555555 }));
  upCone.position.y = 600;
  widgetObj.add( upCone );

  atCone = new THREE.Mesh( new THREE.ConeGeometry( 50, 100, 32 ),
            new THREE.MeshLambertMaterial({ color: 0xff0000 }));
    
  cameraVectorObj = new THREE.Object3D();
  cameraVectorObj.position.y = 300;
  cameraVectorObj.add(eyeBall);

  atCone.position.y = -300;
  atCone.rotation.x = Math.PI;
  cameraVectorObj.add( atCone );
  
  lineUpMat = new THREE.LineBasicMaterial({
	   color: 0x555555
  });

  lineUpGeom= new THREE.Geometry();
  lineUpGeom.vertices.push(
	   upCone.position,
	   cameraVectorObj.position
   );
  lineUp = new THREE.Line( lineUpGeom, lineUpMat );
  widgetObj.add( lineUp );
  
  lineFwdMat = new THREE.LineBasicMaterial({
	   color: 0xff0000
  });
  lineFwdGeom= new THREE.Geometry();
  lineFwdGeom.vertices.push(
     new THREE.Vector3().set(0, 0, 0),
     atCone.position
   );
  lineFwd = new THREE.Line( lineFwdGeom, lineFwdMat );
  cameraVectorObj.add( lineFwd );
  
  widgetObj.add( cameraVectorObj );
  
  widgetObj.rotation.y = Math.PI;
  scene.add(widgetObj);
  
  var imageMaterial = new THREE.MeshPhongMaterial( { 
    color: 0xffffff, 
    specular: 0xffffff, 
    shininess: 30,
    side: THREE.DoubleSide,
    map: new THREE.TextureLoader().load( "yoda.jpg" ) 
  } );
  
  plane = new THREE.Mesh(new THREE.PlaneGeometry( 400, 400), imageMaterial );
  scene.add( plane );

  // Add the lines that indicate the frustum
  lineViewMat = new THREE.LineBasicMaterial({
	   color: 0xffffff
  });
  lineView0Geom = new THREE.Geometry();
  lineView0Geom.vertices.push(
     new THREE.Vector3(),
     new THREE.Vector3(),
  );
  lineView1Geom = new THREE.Geometry();
  lineView1Geom.vertices.push(
     new THREE.Vector3(),
     new THREE.Vector3(),
   );
  lineView2Geom = new THREE.Geometry();
  lineView2Geom.vertices.push(
     new THREE.Vector3(),
     new THREE.Vector3(),
   );
  lineView3Geom = new THREE.Geometry();
  lineView3Geom.vertices.push(
     new THREE.Vector3(),
     new THREE.Vector3(),
   );
  lineView0 = new THREE.Line( lineView0Geom, lineViewMat );
  lineView1 = new THREE.Line( lineView1Geom, lineViewMat );
  lineView2 = new THREE.Line( lineView2Geom, lineViewMat );
  lineView3 = new THREE.Line( lineView3Geom, lineViewMat );

  scene.add( lineView0 );
  scene.add( lineView1 );
  scene.add( lineView2 );
  scene.add( lineView3 );
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
	camera.position.set( -900, 700, -600);
	cameraControls.target.set(-150,300,200);
}

function addToDOM() {
    var canvas = document.getElementById('canvas');
    canvas.appendChild(renderer.domElement);
    canvas.appendChild(gui.domElement);
}

function animate() {
  setDirection();
  positionImagePlaneVertices();
  drawLines();
	window.requestAnimationFrame(animate);
	render();
}

// position the objects we can, based on user interaction
function setDirection() {
  cameraVectorObj.rotation.x = params.upAndDown * Math.PI/180;
  widgetObj.rotation.y = Math.PI + (params.around * Math.PI/180);
}

function positionImagePlaneVertices() {
  /*TODO:
  Calculate the position of the image plane's vertices such that the image plane
  is 500 units in front of the eye ball in the direction of the red arrow, and 
  orthogonal to the arrow whatever direction it points. Do not use Object3D 
  parenting or change any code outside this function. The goal is to use geometric
  information about the up direction and the direction the "camera" is pointing
  to determine where the corners of the viewing plane perpendicular to the camera
  view should be.
  
  To do this, you will alculate up, eye, at, then use them to calculate 
  wVec, uVec, vVec. These variables have the following meanings:
  - eye should be the global location of the eyeBall object
  - at should be the global location of the atCone object
  - up should be in the direction of the upCone object
  - wVec points backwards from the "camera"
  - uVec points to the side of the "camera", orthogonal to up and the camera direction
  - vVec points "up" local to the "camera", orthogonal to uVec and wVec
  
  Cross product will be an important tool here, as will several other Vector3
  operations. Don't forget to set verticesNeedUpdate as true on the plane mesh 
  geometry after making changes to the plane's vertices. 
  */
  // CHANGES BEGIN
  
  // Placeholder positioning for the vertice

  wVec = wVec.subVectors(atCone.getWorldPosition(), eyeBall.getWorldPosition()).negate().normalize();
  //console.log(wVec);

  up = up.subVectors(upCone.getWorldPosition(), eyeBall.getWorldPosition()).normalize();
  at = at.subVectors(atCone.getWorldPosition(), eyeBall.getWorldPosition()).normalize();
  uVec.crossVectors(at, up).normalize();

  vVec.crossVectors(wVec, uVec).normalize();

  var center = new THREE.Vector3();
  center = at.clone().multiplyScalar(500);


  var innerVec0 = new THREE.Vector3();
  var innerVec1 = new THREE.Vector3();
  var innerVec2 = new THREE.Vector3();
  var innerVec3 = new THREE.Vector3();

  innerVec0 = uVec.clone().multiplyScalar(200).add(vVec.clone().multiplyScalar(200));
  innerVec1 = (uVec.clone().multiplyScalar(200).negate()).add(vVec.clone().multiplyScalar(200));
  innerVec2 = innerVec1.clone().negate();
  innerVec3 = innerVec0.clone().negate();
  


  var outVec0 = new THREE.Vector3();
  var outVec1 = new THREE.Vector3();
  var outVec2 = new THREE.Vector3();
  var outVec3 = new THREE.Vector3();

   outVec0 = center.clone().add(innerVec0);
   outVec1 = center.clone().add(innerVec1);
   outVec2 = center.clone().add(innerVec2);
   outVec3 = center.clone().add(innerVec3);

   plane.geometry.vertices[0].x = eyeBall.getWorldPosition().x + outVec0.x;
   plane.geometry.vertices[0].y = eyeBall.getWorldPosition().y + outVec0.y;
   plane.geometry.vertices[0].z = eyeBall.getWorldPosition().z + outVec0.z;

   plane.geometry.vertices[1].x = eyeBall.getWorldPosition().x + outVec1.x;
   plane.geometry.vertices[1].y = eyeBall.getWorldPosition().y + outVec1.y;
   plane.geometry.vertices[1].z = eyeBall.getWorldPosition().z + outVec1.z;

   plane.geometry.vertices[2].x = eyeBall.getWorldPosition().x + outVec2.x;
   plane.geometry.vertices[2].y = eyeBall.getWorldPosition().y + outVec2.y;
   plane.geometry.vertices[2].z = eyeBall.getWorldPosition().z + outVec2.z;

   plane.geometry.vertices[3].x = eyeBall.getWorldPosition().x + outVec3.x;
   plane.geometry.vertices[3].y = eyeBall.getWorldPosition().y + outVec3.y;
   plane.geometry.vertices[3].z = eyeBall.getWorldPosition().z + outVec3.z;

  plane.geometry.verticesNeedUpdate = true;
        
   //CHANGES END
} 

function drawLines() {
  lineView0Geom.vertices = [plane.geometry.vertices[0], cameraVectorObj.position];
  lineView0Geom.verticesNeedUpdate = true;
  lineView1Geom.vertices = [plane.geometry.vertices[1], cameraVectorObj.position];
  lineView1Geom.verticesNeedUpdate = true;
  lineView2Geom.vertices = [plane.geometry.vertices[2], cameraVectorObj.position];
  lineView2Geom.verticesNeedUpdate = true;
  lineView3Geom.vertices = [plane.geometry.vertices[3], cameraVectorObj.position];
  lineView3Geom.verticesNeedUpdate = true;
}

function render() {
	var delta = clock.getDelta();
	cameraControls.update(delta);
	camera.updateMatrixWorld();
  
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
