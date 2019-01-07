'use strict'
////////////////////////////////////////////////////////////////////////////////
/*global THREE, Coordinates, document, window  */
var camera, scene, renderer, cameraControls, canvasWidth, canvasHeight,
    yellowCone, yellowConeObj, sphereObj, sphere, surfacePointBall, lighting,
    sun, eye, blackCone, blackConeObj, normalLine, normalLineGeom, material,
    lineIn, lineInGeom, lineOut, lineOutGeom, lineMat, sunlabel, gui, params, 
    intersects;
var SPHERE_SIZE = 200;
var objects = [];
var loaded = false;
var plane = new THREE.Plane(),
mouse = new THREE.Vector2(),
offset = new THREE.Vector3(),
intersection = new THREE.Vector3(), INTERSECTED, SELECTED;

var projector = new THREE.Projector();
var raycaster = new THREE.Raycaster();
var clock = new THREE.Clock();

// Defining the diffuse color
var diffuseColor = new THREE.Color( 'darkslategray' );
var color = new THREE.Color();

function fillScene() {
  
  // Set up gui sliders
	gui = new dat.GUI({
		autoPlace: false,
    height : (32 * 3)- 1
	});
  
  params = {
    scale: 1,
    shininess: 10,
    lighting: 'diffuse'
  }
  
  gui.add(params, 'scale').min(0.5).max(2).step(0.1).name('Sphere Scale');
	gui.domElement.style.position = "relative";
	gui.domElement.style.top = "-400px";
	gui.domElement.style.left = "350px";
  
  gui.add(params, 'lighting', [ 'diffuse', 'specular', ] ).name('Lighting Component');
  gui.domElement.style.position = "relative";
  gui.domElement.style.top = "-400px";
  gui.domElement.style.left = "350px";

  gui.add(params, 'shininess').min(1).max(100).step(1).name('Shininess');
	gui.domElement.style.position = "relative";
	gui.domElement.style.top = "-400px";
	gui.domElement.style.left = "350px";
      
    
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog( 0x808080, 2000, 4000 );
	//scene.add( new THREE.AmbientLight( 0x111111 ) );
  
	var light = new THREE.HemisphereLight( 0xffffff,  0x000008, 1);
	light.position.set( -200, 500, 100 );
	camera.add( light );
  
	//var light = new THREE.HemisphereLight( 0x222222,  0x080808, 1);
	//light.position.set( 200, -500, -100 );
	//camera.add( light );

  
  light = new THREE.AmbientLight( 0x404040 );
  scene.add( light );

  //grid xz
  var gridXZ = new THREE.GridHelper(2000, 100, new THREE.Color(0xCCCCCC), new THREE.Color(0x888888));
  scene.add(gridXZ);
  //axes
  var axes = new THREE.AxisHelper(150);
  axes.scale.set(1,1,1);
  scene.add(axes);
  
  scene.add(camera);
  drawSphereIntersection();
}

function drawSphereIntersection() {  
  var sphereMaterial = new THREE.MeshPhongMaterial();
	sphereMaterial.color.copy(diffuseColor);
	//sphereMaterial.specular.setRGB( 1, 1, 1 );
  
  sphereObj = new THREE.Object3D();
  sphereObj.position.x = 400;
  sphereObj.position.y = 100;

  sphere = new THREE.Mesh( new THREE.SphereGeometry( SPHERE_SIZE, 16, 16),
                          sphereMaterial);
  sphere.name = 'sphere';
  sphere.userData.parent = sphereObj;
  sphereObj.add( sphere );
  
  material = new THREE.MeshBasicMaterial({ color: 0x888888 })
  surfacePointBall = new THREE.Mesh( new THREE.SphereGeometry( 35, 12, 12),
                       material);
  surfacePointBall.position.x = -SPHERE_SIZE * params.scale;
  surfacePointBall.name = 'surfacePoint';
  sphereObj.add( surfacePointBall );
  
  scene.add(sphereObj);
  
  
  yellowCone = new THREE.Mesh( new THREE.ConeGeometry( 50, 100, 32 ),
                       new THREE.MeshLambertMaterial({ color: 0xeecc00 }));
  yellowCone.rotateX( -Math.PI/2 );
  yellowConeObj = new THREE.Object3D();
  //yellowCone.scale.set( 1,1,10 );
  yellowConeObj.add( yellowCone );
  scene.add( yellowConeObj );
  
  lineMat = new THREE.LineBasicMaterial({
	   color: 0x000000
  });
  
    
  lineOutGeom= new THREE.Geometry();
  lineOutGeom.vertices.push(
     surfacePointBall.position.clone().add(sphereObj.position),
     yellowConeObj.position
   );
  lineOut = new THREE.Line( lineOutGeom, lineMat );
  scene.add( lineOut );
  
  blackCone = new THREE.Mesh( new THREE.ConeGeometry( 25, 50, 32 ),
                       new THREE.MeshLambertMaterial({ color: 0x000000 }));
  blackCone.rotateX( -Math.PI/2 );
  blackConeObj = new THREE.Object3D();
  blackConeObj.add( blackCone );
  scene.add( blackConeObj );
  
  normalLineGeom = new THREE.Geometry();
  normalLineGeom.vertices.push(
     surfacePointBall.position.clone().add(sphereObj.position),
     blackConeObj.position
   );
  normalLine = new THREE.Line( normalLineGeom, lineMat );
  scene.add( normalLine );

  
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
  
  var mtlLoader = new THREE.MTLLoader();
  mtlLoader.load('eye_and_sun.mtl', function(materials) {
    materials.preload();
    var objLoader = new THREE.OBJLoader( manager );
    objLoader.setMaterials(materials);
  	objLoader.load( 'eye_and_sun.obj', function ( eye_and_sun ) {
      sun = eye_and_sun.children[0];
      eye = eye_and_sun.children[1];
      sun.position.x = -100;
      sun.position.y = 200;
      sun.position.z = 300;
      
      scene.add(sun);
      objects.push(sun);
      
      eye.position.x = -400;
      eye.position.y = 100;
      eye.position.z = 400;
      
      scene.add(eye);
      objects.push(eye);
      
      lineInGeom= new THREE.Geometry();
      lineInGeom.vertices.push(
    	   sun.position,
    	   surfacePointBall.position.clone().add(sphereObj.position)
       );
      lineIn = new THREE.Line( lineInGeom, lineMat );
      scene.add( lineIn );
      
      loaded = true;
      }, onProgress, onError );
  	}, onProgress, onError );

  
  // objects that we want to test for intersection (picking) by
  // the ray caster
  objects = objects.concat([surfacePointBall, sphere]);
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
  renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
  renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
  renderer.domElement.addEventListener( 'mouseup', onDocumentMouseUp, false );
  renderer.setPixelRatio( window.devicePixelRatio );

	// CAMERA
	camera = new THREE.PerspectiveCamera( 45, canvasRatio, 1, 4000 );

	// CONTROLS
	cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
	camera.position.set( -600, 400, -900);
	cameraControls.target.set(10,100,100);
}

function addToDOM() {
    var canvas = document.getElementById('canvas');
    canvas.appendChild(renderer.domElement);
    canvas.appendChild(gui.domElement);
}

function animate() {
  if(loaded){
    positionObjects();
    calculateReflectionAndSpec();
    drawLines();
  }
	window.requestAnimationFrame(animate);
	render();
}


// position the objects we can, based on user interaction
function positionObjects() {
  sphere.scale.set(params.scale, params.scale, params.scale);
  surfacePointBall.position.setLength(SPHERE_SIZE * params.scale);
  
  blackConeObj.position.addVectors(
    surfacePointBall.position.clone().add(sphereObj.position),
    surfacePointBall.position.clone().normalize().multiplyScalar(200)
  )
  sun.lookAt(camera.position);
  eye.lookAt(surfacePointBall.position.clone().add(sphereObj.position));
  blackConeObj.lookAt(sphereObj.position);
  yellowConeObj.lookAt(surfacePointBall.position.clone().add(sphereObj.position))
} 

// caclulate reflection and position cone lighting at surface point
function calculateReflectionAndSpec(){
  /* TODO:
  All your code will go into this function. The reflection code is essentially identical
  to the code you wrote for lab 9. You may copy and paste it (with a few adjustments) from
  that lab. 
  
  In addition to the reflection, you need to set the surfacePointBall material's color (see the code 
  above for that material's definition) to represent what would be the DIFFUSE COMPONENT and 
  the SPECULAR COMPONENT (depending on the selection in the GUI interface) for the point.
  
  The brightness/color of the surfacePointBall represents the amount of diffuse or specular energy 
  that would contribute to the total color of a pixel at that point, when rendered from the point of 
  view of the eye point. 
  
  Assume the diffuse color is the same color as the sphere mesh object, i.e. darkslategray, defined
  at the top of the script. The maximal diffuse component is this color, and the minimal diffuse component
  is 0 (black). The strength of the diffuse component depends on the directness of the light
  hitting the point for which the color is being calculated. 
  
  The specular color is white, so the specular component will range from 0 to 1 (remember, combining
  components is additive, so zero specular would leave the diffuse component unaltered if they were
  composed together). The specular component is based on the position of the eye with respect 
  to the light reflection, with the shininess coefficient taken into account. 
  
  For setting color values, use the 'color' variable defined at the top of the script, which is a
  THREE.Color object. The API for this object may be helpful in setting values:
  
  https://threejs.org/docs/#api/math/Color
  
  */
  // BEGIN CHANGES
  var N = new THREE.Vector3();
  var Lneg = new THREE.Vector3();
  var R = new THREE.Vector3();

  N = N.subVectors(surfacePointBall.getWorldPosition(), sphereObj.position).normalize();
  Lneg = Lneg.subVectors(lineInGeom.vertices[0], lineInGeom.vertices[1]);
  var length = Lneg.length();

  R = R.subVectors(N.clone().multiplyScalar(N.clone().dot(Lneg) * 2), Lneg);
  
  R = R.clone().normalize().multiplyScalar(length);

  yellowConeObj.position.set(surfacePointBall.getWorldPosition().x+ R.x, 
                          surfacePointBall.getWorldPosition().y + R.y,
                          surfacePointBall.getWorldPosition().z + R.z);

  if (R.angleTo(N) > (90 * Math.PI / 180)) {
    yellowConeObj.visible = false;
    lineIn.visible = false;
    lineOut.visible = false;    
  } else {
    yellowConeObj.visible = true;
    lineIn.visible = true;
    lineOut.visible = true;   
  }

  

  if (params.lighting == 'diffuse') {
    //Id = Ii(L.*N)
    
    var difValue = Lneg.normalize().clone().dot(N.normalize());

    color = diffuseColor.clone().multiplyScalar(difValue);
    
  } 
  if (params.lighting == 'specular') {
    //Is = Ii(R.*V)^n
    var whiteLight = new THREE.Color('white');
    var V = new THREE.Vector3();
    var Ii = new THREE.Color();

    V = V.subVectors(eye.getWorldPosition(), surfacePointBall.getWorldPosition()).normalize();

    var specValue = Math.pow(R.normalize().clone().dot(V), params.shininess);

    //Ii = diffuseColor.clone().multiply(whiteLight);
    Ii = whiteLight;
    console.log(specValue);

    color = Ii.clone().multiplyScalar(specValue);

    //surfacePointBall.material.color
  }

  surfacePointBall.material.color.copy(color);
  // END CHANGES
}

function drawLines(){
  lineInGeom.vertices = [sun.position, surfacePointBall.position.clone().add(sphereObj.position)];
  lineInGeom.verticesNeedUpdate = true;
  lineOutGeom.vertices = [surfacePointBall.position.clone().add(sphereObj.position), yellowConeObj.position];
  lineOutGeom.verticesNeedUpdate = true; 
  normalLineGeom.vertices = [surfacePointBall.position.clone().add(sphereObj.position), blackConeObj.position];
  normalLineGeom.verticesNeedUpdate = true;
}

function render() {
	var delta = clock.getDelta();
	cameraControls.update(delta);
	camera.updateMatrixWorld();
	renderer.render(scene, camera);
}


function onDocumentMouseMove( event ) {
	event.preventDefault();
  // this converts window mouse values to x and y mouse coordinates that range
  // between -1 and 1 in the canvas
  mouse.set(
     (( event.clientX / window.innerWidth ) * 2 - 1) *
     (window.innerWidth/canvasWidth),
     (-((event.clientY - ($("#canvas").position().top + (canvasHeight/2))) / window.innerHeight) * 2 )
     * (window.innerHeight/canvasHeight));

  // uses Three.js built-in raycaster to send a ray from the camera
	raycaster.setFromCamera( mouse, camera );
	if ( SELECTED ) {
    if ( raycaster.ray.intersectPlane( plane, intersection ) ) {
      if( SELECTED.name === 'surfacePoint' ) {
        var sphereRaycaster = new THREE.Raycaster();
        sphereRaycaster.setFromCamera( mouse, camera );
        var surfPoint = new THREE.Vector3();
        var sph = new THREE.Sphere( sphereObj.position, SPHERE_SIZE * params.scale );
        if ( sphereRaycaster.ray.intersectSphere( sph, surfPoint ) ){
          SELECTED.position.copy( surfPoint.sub(sphereObj.position) );
        }
        
      } else {
        SELECTED.position.copy( intersection.sub( offset ) );
      }
    }
		return;
	}

  // determines which objects are intersected by the ray, and sets the dragging
  // plane with respect to the camera view.
	intersects = raycaster.intersectObjects(objects, true);
	if ( intersects.length > 0 ) {
		if ( INTERSECTED != intersects[0].object ) {
			INTERSECTED = intersects[0].object;
			plane.setFromNormalAndCoplanarPoint(
        camera.getWorldDirection( plane.normal ),
        INTERSECTED.position);
		}
		canvas.style.cursor = 'pointer';
	} else {
		INTERSECTED = null;
		canvas.style.cursor = 'auto';
	}
}

// handles mouse down event
function onDocumentMouseDown( event ) {
	event.preventDefault();
	raycaster.setFromCamera( mouse, camera );
	var intersects = raycaster.intersectObjects( objects );
	if ( intersects.length > 0 ) {
		cameraControls.enabled = false;
		SELECTED = intersects[ 0 ].object.userData.parent || intersects[ 0 ].object;
		if ( raycaster.ray.intersectPlane( plane, intersection ) ) {
			offset.copy( intersection ).sub( SELECTED.position );
		}
		canvas.style.cursor = 'move';
	}
}

// handles mouse up event
function onDocumentMouseUp( event ) {
	event.preventDefault();
	cameraControls.enabled = true;
	if ( INTERSECTED ) {
		SELECTED = null;
	}
	canvas.style.cursor = 'auto';
}

function toXYCoords (pos) {
  //var vector = projector.projectVector(pos.clone(), camera);
	var vector = pos.clone().project(camera);
	vector.x = (vector.x + 1)/2 * canvasWidth;
	vector.y = -(vector.y - 1)/2 * canvasHeight;
  return vector;
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
