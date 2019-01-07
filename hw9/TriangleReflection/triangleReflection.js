'use strict'
////////////////////////////////////////////////////////////////////////////////
/*global THREE, Coordinates, document, window  */
var camera, scene, renderer, cameraControls, canvasWidth, canvasHeight,
    greenBall, redCone, redConeObj, triangle, triangleWireframe, 
    surfacePointBall, v1, v2, v3, center, lineIn, lineInGeom, lineOut, 
    lineOutGeom, lineMat, greenBalllabel, redConelabel, gui, params, 
    intersects;
var objects = [];
var plane = new THREE.Plane(),
mouse = new THREE.Vector2(),
offset = new THREE.Vector3(),
intersection = new THREE.Vector3(), INTERSECTED, SELECTED;

var projector = new THREE.Projector();
var raycaster = new THREE.Raycaster();
var clock = new THREE.Clock();

function fillScene() {
  
  //skybox

  var imagePrefix = "../../images/airport/sky-";
  var imageSuffix = ".png";
  var urls  = [imagePrefix+"xpos"+imageSuffix, imagePrefix+"xneg"+imageSuffix,
							imagePrefix+"ypos"+imageSuffix, imagePrefix+"yneg"+imageSuffix,
							imagePrefix+"zpos"+imageSuffix, imagePrefix+"zneg"+imageSuffix];


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

  var textureLoader = new THREE.CubeTextureLoader();
  textureLoader.load( urls, function (texture) {
    drawObjects(texture);
    addToDOM();
    animate();
  } );
  
}

function drawObjects( reflectionCube ) {
    
  // Triangle vertices represented as spheres
  v1 = new THREE.Mesh( new THREE.SphereGeometry( 30, 12, 12),
                       new THREE.MeshLambertMaterial({ color: 0x4f004f }));
  v1.position.x = 100;
  v1.position.y = 520;
  v1.position.z = 200;
  scene.add( v1 );

  v2 = new THREE.Mesh( new THREE.SphereGeometry( 30, 12, 12),
                       new THREE.MeshLambertMaterial({ color: 0x4f004f }));
  v2.position.x = 100;
  v2.position.y = 300;
  v2.position.z = -200;
  scene.add( v2 );

  v3 = new THREE.Mesh( new THREE.SphereGeometry( 30, 12, 12),
                       new THREE.MeshLambertMaterial({ color: 0x4f004f }));
  v3.position.x = -50;
  v3.position.y = -50;
  v3.position.z = 300;
  scene.add( v3 );
  
  // center is used for the initial position of p, and also for the positioning of
  // the line representing the normal.
  center = new THREE.Vector3( (v1.position.x + v2.position.x + v3.position.x)/3,
                              (v1.position.y + v2.position.y + v3.position.y)/3,
                              (v1.position.z + v2.position.z + v3.position.z)/3);
  
  surfacePointBall = new THREE.Mesh( new THREE.SphereGeometry( 15, 12, 12),
                       new THREE.MeshLambertMaterial({ color: 0xffff00 }));
  surfacePointBall.name = 'surfacePoint';
  surfacePointBall.position.copy(center);
  scene.add( surfacePointBall );
  
  var triangleMaterial = new THREE.MeshPhongMaterial( {
		shininess: 100,
		transparent: true,
		opacity: 0.5,
		envMap: reflectionCube,
		combine: THREE.MixOperation,
		reflectivity: 0.3 } );
	triangleMaterial.color.setRGB( 0.3, 0, 0.3 );
	triangleMaterial.specular.setRGB( 1, 1, 1 );
  
  var geo = new THREE.Geometry();
  geo.vertices = [v1.position, v2.position, v3.position];
  geo.faces = [new THREE.Face3(0, 1, 2)];
  geo.computeFaceNormals();

  triangle = new THREE.Mesh(geo, triangleMaterial)
  triangle.name = 'triangle';
  scene.add(triangle);  
  
  triangleWireframe = new THREE.Mesh(geo,
    new THREE.MeshBasicMaterial({ color: 0xffffff,
                                  wireframe: true,
                                  wireframeLinewidth: 2,
                                  side: THREE.DoubleSide} ));
  scene.add(triangleWireframe);
  
  greenBall = new THREE.Mesh( new THREE.SphereGeometry( 30, 12, 12),
                       new THREE.MeshLambertMaterial({ color: 0x00ff00 }));
  greenBall.position.x = -300;
  greenBall.position.y = 450;
  greenBall.position.z = 300;
  scene.add( greenBall );
  
  
  redCone = new THREE.Mesh( new THREE.ConeGeometry( 50, 100, 32 ),
                       new THREE.MeshLambertMaterial({ color: 0xff0000 }));
  redCone.rotateX( -Math.PI/2 );
  redConeObj = new THREE.Object3D();
  redConeObj.add( redCone );
  scene.add( redConeObj );
  
  lineMat = new THREE.LineBasicMaterial({
	   color: 0x000000
  });

  lineInGeom= new THREE.Geometry();
  lineInGeom.vertices.push(
	   greenBall.position,
	   surfacePointBall.position
   );
  lineIn = new THREE.Line( lineInGeom, lineMat );
  
  scene.add( lineIn );
  lineOutGeom= new THREE.Geometry();
  lineOutGeom.vertices.push(
     surfacePointBall.position,
     redConeObj.position
   );
  lineOut = new THREE.Line( lineOutGeom, lineMat );
  scene.add( lineOut );
  
  // objects that we want to test for intersection (picking) by
  // the ray caster
  objects = [greenBall, surfacePointBall, v1, v2, v3, triangle];
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
	camera.position.set( -800, 600, -500);
	cameraControls.target.set(4,301,92);
}

function addToDOM() {
    var canvas = document.getElementById('canvas');
    canvas.appendChild(renderer.domElement);
}

function animate() {
  calculateReflection();
  drawLines();
	window.requestAnimationFrame(animate);
	render();
}

// caclulate reflection and position cone
function calculateReflection(){
  // TODO: 
  // Everything you need to do will be in this function.
  // Calculate the reflection vector and set the redConeObj.position to the
  // correct coordinates. Also, set the 'visible' value (true or false)
  // for redConeObj, lineIn, and lineOut. The line geometry and cone rotation
  // is handled elsewhere, so you don't need to worry about that. 
  
  // Refer to the slides or textbook for the formula for calculating reflection.
  // For the starter file, the redConeObj position is set to the origin.
  
  var Lneg = new THREE.Vector3();
  var N = new THREE.Vector3();
  var R = new THREE.Vector3();

  Lneg = Lneg.subVectors(lineInGeom.vertices[0], lineInGeom.vertices[1]);

  triangle.geometry.computeFaceNormals();
  N = triangle.geometry.faces[0].normal.clone().normalize();

  R = R.subVectors(N.clone().multiplyScalar(2 * N.clone().dot(Lneg)), Lneg);
 
  var length = Lneg.length();
  
  R = R.normalize().multiplyScalar(length);
  //console.log(R);
  redConeObj.position.set(surfacePointBall.position.x + R.x, 
                          surfacePointBall.position.y + R.y, 
                          surfacePointBall.position.z + R.z);

  
  if (R.angleTo(N) > (90 * Math.PI / 180)) {
    redConeObj.visible = false;
    lineIn.visible = false;
    lineOut.visible = false;    
  } else {
    redConeObj.visible = true;
    lineIn.visible = true;
    lineOut.visible = true;   
  }



  // END OF CHANGES
}

function drawLines(){
  lineInGeom.vertices = [greenBall.position, surfacePointBall.position];
  lineInGeom.verticesNeedUpdate = true;
  lineOutGeom.vertices = [surfacePointBall.position, redConeObj.position];
  lineOutGeom.verticesNeedUpdate = true; 
  redConeObj.lookAt(surfacePointBall.position);
}

function render() {
  triangle.geometry.vertices = [v1.position, v2.position, v3.position]
  triangle.geometry.verticesNeedUpdate = true;
  triangleWireframe.geometry.vertices = [v1.position, v2.position, v3.position]
  triangleWireframe.geometry.verticesNeedUpdate = true;
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
    if (SELECTED === surfacePointBall ) {
      var triRaycaster = new THREE.Raycaster();
      triRaycaster.setFromCamera( mouse, camera );
      plane.setFromCoplanarPoints(
        triangle.geometry.vertices[0],
        triangle.geometry.vertices[1],
        triangle.geometry.vertices[2]);
      var surfPoint = new THREE.Vector3();
      if ( triRaycaster.ray.intersectTriangle( 
        triangle.geometry.vertices[0],
        triangle.geometry.vertices[1],
        triangle.geometry.vertices[2],
        false, surfPoint ) ){
        SELECTED.position.copy( surfPoint );
      }
    }
    if ( raycaster.ray.intersectPlane( plane, intersection ) ) {
      if ( SELECTED !== triangle && SELECTED !== surfacePointBall)  {
          SELECTED.position.copy( intersection.sub( offset ) );
      }
    }
    if ( SELECTED === v1 || SELECTED === v2 || SELECTED === v3  ){
      // if one of the triangle corners is dragged, surfacePointBall will return  
      // to the center of the triangle
      surfacePointBall.position.x = (v1.position.x + v2.position.x + v3.position.x)/3;
      surfacePointBall.position.y = (v1.position.y + v2.position.y + v3.position.y)/3;
      surfacePointBall.position.z = (v1.position.z + v2.position.z + v3.position.z)/3;
      triangle.geometry.normalsNeedUpdate = true;
      triangle.geometry.computeFaceNormals();
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
	//console.log(vector);
  return vector;
}


try {
  init();
  fillScene();
} catch(error) {
    console.log("Your program encountered an unrecoverable error, can not draw on canvas. Error was:");
    console.log(error);
}
