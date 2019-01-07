'use strict'
////////////////////////////////////////////////////////////////////////////////
/*global THREE, Coordinates, document, window  */
var camera, scene, renderer, cameraControls, canvasWidth, canvasHeight,
    frustum, frustumGeometry, imagePlane, gui, params, curtain, curtainMat, 
    matte1, matte2, matte3, matte4, matteMat,lineMat;
var redCircle, blueCircle, greenCircle, pinkCircle, yellowCircle, whiteCircle,
    cyanCircle, orangeCircle, violetCircle, magentaCircle, darkGreenCircle, blackCircle;
var copiedScene, copiedMat, copiedCircle;
var vflu = new THREE.Vector3(), vfld = new THREE.Vector3(), vfru = new THREE.Vector3(), vfrd = new THREE.Vector3(), // frustum front vertices
    vrlu = new THREE.Vector3(), vrld = new THREE.Vector3(), vrru = new THREE.Vector3(), vrrd = new THREE.Vector3(), // frustum rear vertices
    iplu = new THREE.Vector3(), ipru = new THREE.Vector3(), ipld = new THREE.Vector3(), iprd  = new THREE.Vector3(); // impage plane left up, right up, left down, right down
var cop = new THREE.Vector3();
var copRayLU = new THREE.Vector3(),
    copRayRU = new THREE.Vector3(),
    copRayLD = new THREE.Vector3(),
    copRayRD = new THREE.Vector3();
var frustumEdge1Geo = new THREE.Geometry(),
    frustumEdge2Geo = new THREE.Geometry(),
    frustumEdge3Geo = new THREE.Geometry(),
    frustumEdge4Geo = new THREE.Geometry();
var curtainObj = new THREE.Object3D();
var leftClipPlane, rightClipPlane, topClipPlane, bottomClipPlane;
var frustumEdge1, frustumEdge2, frustumEdge3, frustumEdge4;
var farPlaneNormal = new THREE.Vector3().set(0, 0, 1);

var projectionMatrix = new THREE.Matrix4();
var visibleProjections = [];
var threeDScene = new THREE.Object3D();
var projectedScene = new THREE.Object3D();

var clock = new THREE.Clock();
var delta;

// misc variables
var i, j, p, t;

// constants
var FAR_PLANE_Z = 700;
var IMAGE_PLANE_WIDTH = 400;
var IMAGE_PLANE_HEIGHT = 300;

function fillScene() {
  // Set up gui sliders
	gui = new dat.GUI({
		autoPlace: false,
    height : (32 * 3)- 1
	});
  
  params = {
    focalLength: 1200,
    curtainOpacity: 0.0,
    clipping: true,
    tracers: false
  }
  
  gui.add(params, 'focalLength').min(300).max(1200).step(5).name('Focal length');
  gui.add(params, 'curtainOpacity').min(0.0).max(1.0).step(0.2).name('Curtain');
  gui.add(params, 'clipping').name('Clip Image Plane').onChange(clearProjections);
  gui.add(params, 'tracers').name('Keep Projections').onChange(clearProjections);
	gui.domElement.style.position = "relative";
	gui.domElement.style.top = "-400px";
	gui.domElement.style.left = "350px";

	scene = new THREE.Scene();
	//scene.fog = new THREE.Fog( 0x808080, 3000, 5000 );
	scene.add( new THREE.AmbientLight( 0x222222 ) );

	var light = new THREE.DirectionalLight( 0xffffff, 0.9 );
	light.position.set( -200, 500, 500 );
	scene.add( light );

	light = new THREE.DirectionalLight( 0xffffff, 0.6 );
	light.position.set( 100, 100, -400 );
	scene.add( light );

  //grid xz
  var gridXZ = new THREE.GridHelper(5000, 100, new THREE.Color(0xCCCCCC), new THREE.Color(0x888888));
  scene.add(gridXZ);
  
  //axes
  var axes = new THREE.AxisHelper(150);
  axes.position.y = 1;
  scene.add(axes);

  // clipping planes
  leftClipPlane = new THREE.Plane( new THREE.Vector3( -1, 0, 0 ), 200);
  rightClipPlane = new THREE.Plane( new THREE.Vector3( 1, 0, 0 ), 200 );
  topClipPlane = new THREE.Plane( new THREE.Vector3( 0, -1, 0 ), 150);
  bottomClipPlane = new THREE.Plane( new THREE.Vector3( 0, 1, 0 ), 150);
  
  // center of projection at origin of space
  cop.set(0, 0, 0);

  makeImagePlane(); //positions image plane params.focalLength distance from the origin
  setFrustumGeometry();
  buildFrustum();  
  makeCircleScene();
  makeCurtain();
}

function animate() {
  updateCurtain();
  updateFrustum();
  updateCircleScene();
  calculateProjection(); // This is where the projected scene object is added
	window.requestAnimationFrame(animate);
	render();
}

function calculateProjection() {
  // If we want the previous projection objects to stay in the scene,
  // we push them into an array so they can be cleaned up later. Otherwise,
  // we remove the current projection object from the scene before 
  // calculating the new one
  if(!params.tracers) {
    scene.remove(projectedScene);
  } else {
    visibleProjections.push(projectedScene);
  }
  
  // The projected scene object is a deep copy of the threeDScene object
  // containing the circles. We want to be able to transform the circles'
  // vertices and modifiy material clipping properties without affecting 
  // the original scene. 
  projectedScene = deepCopy(threeDScene);
  
  /* 
  TODO: You need to set the components of the projection matrix
  to the correct values. For the starter file, the projection matrix
  is set to identity. You need to set the values appropriately to project
  the 3D circles scene onto the image plane. You may use whatever values
  you need, and write whatever additional code is necessary to get correct
  values here, but you should not change any existing values beyond the 
  projectionMatrix components. Take a look at makeImagePlane() below to see 
  how the image plane's location and dimensions are computed. The center 
  of projection (cop) is set in fillScene(), above. 
  
  Take a look at the code below END OF CHANGES to see how this matrix
  will be applied to the projected object's geometry, but don't alter any
  code there.
  */
  
  // BEGIN CHANGES
  
  var d =  cop.z - params.focalLength;
  projectionMatrix.set( 
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 1/d, 0
     );

  // END OF CHANGES

  // In order not to corrupt our object's matrix, we have to 
  // go through the projected scene vertex by vertex, transforming
  // each vertex into the projection space. We could apply the 
  // projection matrix to the whole projectedScene object, however
  // this would cause issues with rendering and clipping due to the 
  // importance of the w component for camera rendering. So instead we 
  // go through each circle, and each vertex in each circle, and 
  // transform them individually. 
  for(i = 0; i < projectedScene.children.length; i++) {
    // each circle
    p = projectedScene.children[i]
    for(j = 0; j < p.geometry.vertices.length; j++) {
      // each vertex
      
      // the vertices are in object space, so in order to find 
      // an appropriate world space position (on which we want to carry 
      // out the projection transform) we add the position of the 
      // corresponding circle in the original threeDScene. 
      p.geometry.vertices[j].add(threeDScene.children[i].position);
      
      // Here we apply the projection matrix. 
      // NB: the applyMatrix method *includes* division by the w component.
      p.geometry.vertices[j].applyMatrix4(projectionMatrix);


      // we subtract the object position again because the vertices will be 
      // rendered in the scene with respect to their object's position. 
      p.geometry.vertices[j].sub(threeDScene.children[i].position);
    }
    projectedScene.children[i].geometry.verticesNeedUpdate = true;
  }
  scene.add(projectedScene);
}

function makeImagePlane() {
  // Image plane x and y don't change. z depends on focal length
  iplu.set(IMAGE_PLANE_WIDTH/2,  IMAGE_PLANE_HEIGHT/2, -params.focalLength);  
  ipld.set(IMAGE_PLANE_WIDTH/2, -IMAGE_PLANE_HEIGHT/2,  -params.focalLength); 
  ipru.set(-IMAGE_PLANE_WIDTH/2, IMAGE_PLANE_HEIGHT/2, -params.focalLength);   
  iprd.set(-IMAGE_PLANE_WIDTH/2, -IMAGE_PLANE_HEIGHT/2, -params.focalLength);
  
  lineMat = new THREE.LineBasicMaterial({
	   color: 0xffffff
  });
  
  var edge1Geo = new THREE.Geometry();
  edge1Geo.vertices.push( iplu, ipru );
  var edge1 = new THREE.Line( edge1Geo, lineMat );
  var edge2Geo = new THREE.Geometry();
  edge2Geo.vertices.push( ipru, iprd );
  var edge2 = new THREE.Line( edge2Geo, lineMat );
  var edge3Geo = new THREE.Geometry();
  edge3Geo.vertices.push( iprd, ipld );
  var edge3 = new THREE.Line( edge3Geo, lineMat );
  var edge4Geo = new THREE.Geometry();
  edge4Geo.vertices.push( ipld, iplu );
  var edge4 = new THREE.Line( edge4Geo, lineMat );
  
  imagePlane = new THREE.Object3D();
  imagePlane.add( edge1 );
  imagePlane.add( edge2 );
  imagePlane.add( edge3 );
  imagePlane.add( edge4 );
  
  scene.add(imagePlane);
}

// Position the vertices of the frustum (view volume) object
function setFrustumGeometry() {  
  iplu.set(200,   150, -params.focalLength);  
  ipld.set(200, -150,  -params.focalLength); 
  ipru.set(-200, 150, -params.focalLength);   
  iprd.set(-200, -150, -params.focalLength);

  imagePlane.children.forEach(function(el){
    if (el.geometry) {
      el.geometry.verticesNeedUpdate = true;
    }
  });

  copRayLU.subVectors(iplu, cop);
  t = -(cop.dot(farPlaneNormal) + params.focalLength + FAR_PLANE_Z) / copRayLU.dot(farPlaneNormal)
  vflu.copy(cop.clone().add(copRayLU.clone().multiplyScalar(t)));

  copRayRU.subVectors(ipru, cop);
  t = -(cop.dot(farPlaneNormal) + params.focalLength + FAR_PLANE_Z) / copRayRU.dot(farPlaneNormal)
  vfru.copy(cop.clone().add(copRayRU.clone().multiplyScalar(t)));

  copRayLD.subVectors(ipld, cop);
  t = -(cop.dot(farPlaneNormal) + params.focalLength + FAR_PLANE_Z) / copRayLD.dot(farPlaneNormal)
  vfld.copy(cop.clone().add(copRayLD.clone().multiplyScalar(t)));

  copRayRD.subVectors(iprd, cop);
  t = -(cop.dot(farPlaneNormal) + params.focalLength + FAR_PLANE_Z) / copRayRD.dot(farPlaneNormal)
  vfrd.copy(cop.clone().add(copRayRD.clone().multiplyScalar(t)));

  frustumEdge1Geo.vertices.push( cop, copRayLU.add(cop) );
  frustumEdge1 = new THREE.Line( frustumEdge1Geo, lineMat );
  
  frustumEdge2Geo.vertices.push( cop, copRayRU.add(cop) );
  frustumEdge2 = new THREE.Line( frustumEdge2Geo, lineMat );
  
  frustumEdge3Geo.vertices.push( cop, copRayLD.add(cop) );
  frustumEdge3 = new THREE.Line( frustumEdge3Geo, lineMat );

  frustumEdge4Geo.vertices.push( cop, copRayRD.add(cop) );
  frustumEdge4 = new THREE.Line( frustumEdge4Geo, lineMat );
  
  // The frustum vertices nearest the image plane are calculated based on the far vertices
  // and the image plane vertices.
  vrlu.addVectors(vflu, iplu.clone().add(imagePlane.position).multiplyScalar(2)).divideScalar(3); 
  vrru.addVectors(vfru, ipru.clone().add(imagePlane.position).multiplyScalar(2)).divideScalar(3); 
  vrld.addVectors(vfld, ipld.clone().add(imagePlane.position).multiplyScalar(2)).divideScalar(3); 
  vrrd.addVectors(vfrd, iprd.clone().add(imagePlane.position).multiplyScalar(2)).divideScalar(3); 
}

function buildFrustum() {
    var frustumGeometry = new THREE.Geometry();
    // Add vertices to build the frustum object
    frustumGeometry.vertices.push( vflu );
    frustumGeometry.vertices.push( vfru );
    frustumGeometry.vertices.push( vfrd );
    frustumGeometry.vertices.push( vfld );
   	frustumGeometry.vertices.push( vrlu );
    frustumGeometry.vertices.push( vrru );
    frustumGeometry.vertices.push( vrrd );
    frustumGeometry.vertices.push( vrld );
    
    // Add faces to create the frustum object
    frustumGeometry.faces.push( new THREE.Face3( 4, 7, 6 ) );    
    frustumGeometry.faces.push( new THREE.Face3( 4, 5, 6 ) );    
    frustumGeometry.faces.push( new THREE.Face3( 0, 4, 3 ) );    
    frustumGeometry.faces.push( new THREE.Face3( 4, 7, 3 ) );    
    frustumGeometry.faces.push( new THREE.Face3( 2, 7, 3 ) );    
    frustumGeometry.faces.push( new THREE.Face3( 6, 2, 7 ) );    
    frustumGeometry.faces.push( new THREE.Face3( 1, 6, 2 ) );    
    frustumGeometry.faces.push( new THREE.Face3( 1, 5, 6 ) );  
    frustumGeometry.faces.push( new THREE.Face3( 0, 4, 5 ) );
    frustumGeometry.faces.push( new THREE.Face3( 0, 1, 5 ) );
    frustumGeometry.faces.push( new THREE.Face3( 2, 3, 0 ) );
    frustumGeometry.faces.push( new THREE.Face3( 0, 1, 2 ) );

    frustumGeometry.computeFaceNormals();

    var frustumMaterial = new THREE.MeshLambertMaterial( {
  		side: THREE.DoubleSide,
  		transparent: true,
  		opacity: 0.4,
  		combine: THREE.MixOperation } );
  	frustumMaterial.color.setRGB( 0.6, 0.6, 0.8 );

    frustum = new THREE.Mesh( frustumGeometry, frustumMaterial);
    frustum.add( frustumEdge1 );
    frustum.add( frustumEdge2 );
    frustum.add( frustumEdge3 );
    frustum.add( frustumEdge4 );
    frustum.renderOrder = 1;
    scene.add(frustum);
}

function updateFrustum() {
  setFrustumGeometry();
  frustumEdge1Geo.verticesNeedUpdate = true;
  frustumEdge2Geo.verticesNeedUpdate = true;
  frustumEdge3Geo.verticesNeedUpdate = true;
  frustumEdge4Geo.verticesNeedUpdate = true;
  frustum.geometry.verticesNeedUpdate = true;
}

function makeCircleScene() {
  redCircle = new THREE.Mesh( new THREE.CircleGeometry( 50, 16 ), 
    new THREE.MeshBasicMaterial({color: 0xff0000, side: THREE.DoubleSide} ));
  redCircle.position.z = -50  - (params.focalLength + 200) ;

  blueCircle = new THREE.Mesh( new THREE.CircleGeometry( 50, 16 ), 
    new THREE.MeshBasicMaterial({color: 0x0000ff, side: THREE.DoubleSide} ));
  blueCircle.position.z = -200  - (params.focalLength + 200) ;
  blueCircle.position.x = 200;

  greenCircle = new THREE.Mesh( new THREE.CircleGeometry( 50, 16 ), 
    new THREE.MeshBasicMaterial({color: 0x00ff00, side: THREE.DoubleSide} ));
  greenCircle.position.z = -350  - (params.focalLength + 200) ;
  greenCircle.position.x = -200;

  pinkCircle = new THREE.Mesh( new THREE.CircleGeometry( 50, 16 ), 
    new THREE.MeshBasicMaterial({color: 0xff2299, side: THREE.DoubleSide} ));
  pinkCircle.position.z = -300  - (params.focalLength + 200) ;
  pinkCircle.position.y = 150;
  pinkCircle.position.x = 100;

  yellowCircle = new THREE.Mesh( new THREE.CircleGeometry( 50, 16 ), 
    new THREE.MeshBasicMaterial({color: 0xffff00, side: THREE.DoubleSide} ));
  yellowCircle.position.z = -100  - (params.focalLength + 200) ;
  yellowCircle.position.y = -150;
  yellowCircle.position.x = -100;

  cyanCircle = new THREE.Mesh( new THREE.CircleGeometry( 50, 16 ), 
    new THREE.MeshBasicMaterial({color: 0x00ffff, side: THREE.DoubleSide} ));
  cyanCircle.position.z = -150  - (params.focalLength + 200) ;
  cyanCircle.position.y = -180;
  cyanCircle.position.x = 100;  

  orangeCircle = new THREE.Mesh( new THREE.CircleGeometry( 50, 16 ), 
    new THREE.MeshBasicMaterial({color: 0xff5500, side: THREE.DoubleSide} ));
  orangeCircle.position.z = -390  - (params.focalLength + 200) ;
  orangeCircle.position.y = 200;
  orangeCircle.position.x = -300;  

  violetCircle = new THREE.Mesh( new THREE.CircleGeometry( 50, 16 ), 
    new THREE.MeshBasicMaterial({color: 0x5500cc, side: THREE.DoubleSide} ));
  violetCircle.position.z = -40  - (params.focalLength + 200) ;
  violetCircle.position.y = 180;
  violetCircle.position.x = 300;

  magentaCircle = new THREE.Mesh( new THREE.CircleGeometry( 50, 16 ), 
    new THREE.MeshBasicMaterial({color: 0xff00ff, side: THREE.DoubleSide} ));
  magentaCircle.position.z = -200  - (params.focalLength + 200) ;
  magentaCircle.position.y = -150;
  magentaCircle.position.x = -350;  

  darkGreenCircle = new THREE.Mesh( new THREE.CircleGeometry( 50, 16 ), 
    new THREE.MeshBasicMaterial({color: 0x007700, side: THREE.DoubleSide} ));
  darkGreenCircle.position.z = -390 - (params.focalLength + 200) ;
  darkGreenCircle.position.y = -250;
  darkGreenCircle.position.x = 450;

  blackCircle = new THREE.Mesh( new THREE.CircleGeometry( 50, 16 ), 
    new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.DoubleSide} ));
  blackCircle.position.z = -490 - (params.focalLength + 200) ;
  blackCircle.position.y = -450;
  blackCircle.position.x = -650;
  
  whiteCircle = new THREE.Mesh( new THREE.CircleGeometry( 50, 16 ), 
    new THREE.MeshBasicMaterial({color: 0xffffff, side: THREE.DoubleSide} ));
  whiteCircle.position.z = -490 - (params.focalLength + 200) ;
  whiteCircle.position.y = 180;
  whiteCircle.position.x = 320;  

  threeDScene.add( redCircle );
  threeDScene.add( blueCircle );
  threeDScene.add( greenCircle );
  threeDScene.add( pinkCircle );
  threeDScene.add( yellowCircle );
  threeDScene.add( cyanCircle );
  threeDScene.add( orangeCircle );
  threeDScene.add( violetCircle );
  threeDScene.add( magentaCircle );
  threeDScene.add( darkGreenCircle );
  threeDScene.add( blackCircle );
  threeDScene.add( whiteCircle );

  scene.add(threeDScene);
}

function updateCircleScene() {
  redCircle.position.z = -50  - (params.focalLength + 200) ;
  blueCircle.position.z = -200  - (params.focalLength + 200) ;
  greenCircle.position.z = -350  - (params.focalLength + 200) ;
  pinkCircle.position.z = -300  - (params.focalLength + 200) ;
  yellowCircle.position.z = -100  - (params.focalLength + 200) ;
  cyanCircle.position.z = -150  - (params.focalLength + 200) ;
  orangeCircle.position.z = -390  - (params.focalLength + 200) ;
  violetCircle.position.z = -40  - (params.focalLength + 200) ;  
  magentaCircle.position.z = -200  - (params.focalLength + 200) ;
  darkGreenCircle.position.z = -390 - (params.focalLength + 200) ;
  blackCircle.position.z = -490 - (params.focalLength + 200) ;
  whiteCircle.position.z = -490 - (params.focalLength + 200) ;

  threeDScene.children.forEach(function(el){
    if (el.geometry) {
      el.geometry.verticesNeedUpdate = true;
    }
  });
}

function makeCurtain() {
  //curtain plane for easier viewing
  curtainMat = new THREE.MeshBasicMaterial(
    { color: 0xbbbbbb, 
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0
    } );
  matteMat = new THREE.MeshBasicMaterial(
    { color: 0x444444, 
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0
    } );
  curtain = new THREE.Mesh( new THREE.PlaneGeometry( 1200, 700 ), curtainMat );
  matte1 = new THREE.Mesh( new THREE.PlaneGeometry( 1200, 200 ), matteMat );
  matte2 = new THREE.Mesh( new THREE.PlaneGeometry( 1200, 200 ), matteMat );
  matte3 = new THREE.Mesh( new THREE.PlaneGeometry( 400, 300 ), matteMat );
  matte4 = new THREE.Mesh( new THREE.PlaneGeometry( 400, 300 ), matteMat );
  curtain.renderOrder = 20;
  matte1.renderOrder = 21;
  matte2.renderOrder = 21;
  matte3.renderOrder = 21;
  matte4.renderOrder = 21;
  curtain.translateZ(-5);
  matte1.translateZ(3);
  matte1.translateY(250);
  matte2.translateZ(3);
  matte2.translateY(-250);
  matte3.translateZ(3);
  matte3.translateX(-400);
  matte4.translateZ(3);
  matte4.translateX(400);
  curtainObj.add(matte1);
  curtainObj.add(matte2);
  curtainObj.add(matte3);
  curtainObj.add(matte4);
  curtainObj.add(curtain);
  curtainObj.translateZ(-(params.focalLength));
  curtain.renderOrder = 20;
  scene.add(curtainObj);
}

function updateCurtain() {
  curtainObj.position.z = -params.focalLength;
  curtainMat.opacity = params.curtainOpacity;
  matteMat.opacity = params.curtainOpacity;
}

// using .clone() on its own doesn't create new vertices. We need
// the projection object to have completely separate geometry so that
// we can transform it on the level of individual vertices.
function deepCopy(sceneToCopy) {
  copiedScene = new THREE.Object3D();
  for (j = 0; j < sceneToCopy.children.length; j++) {
    copiedMat = sceneToCopy.children[j].material.clone();
    if(params.clipping) {
      copiedMat.clippingPlanes = [ leftClipPlane, rightClipPlane, topClipPlane, bottomClipPlane ];
    } else {
      copiedMat.clippingPlanes = [];
    }
    copiedCircle = new THREE.Mesh( new THREE.CircleGeometry( 50, 16 ), copiedMat);
    copiedCircle.position.x = sceneToCopy.children[j].position.x;
    copiedCircle.position.y = sceneToCopy.children[j].position.y;
    copiedCircle.position.z = sceneToCopy.children[j].position.z;
    copiedScene.add( copiedCircle );
  }
  return copiedScene
}

// clears out old projection objects left in the scene
function clearProjections() {
  while(visibleProjections.length) {
    scene.remove(visibleProjections[0]);
    visibleProjections.shift();
  }
}

function render() {
	delta = clock.getDelta();
	cameraControls.update(delta);
	camera.updateMatrixWorld();
	renderer.render(scene, camera);
}

function addToDOM() {
  var canvas = document.getElementById('canvas');
  canvas.appendChild(renderer.domElement);
  canvas.appendChild(gui.domElement);
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
  renderer.localClippingEnabled = true;
  
	// CAMERA
	camera = new THREE.PerspectiveCamera( 45, canvasRatio, 0.1, 5000 );

	// CONTROLS
	cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
	camera.position.set( -500, 500, 500);
	cameraControls.target.set(4,0,-800);
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
