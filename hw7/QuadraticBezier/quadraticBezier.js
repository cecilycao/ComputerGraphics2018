////////////////////////////////////////////////////////////////////////////////
/*global THREE, Coordinates, document, window  */
var camera, scene, renderer, cameraControls, canvasWidth, canvasHeight,
    v0, v1, v2, curve, curveGeometry, curveObject, t_ball, li1, li2,
    handle1, handle1Geom, handle2, handle2Geom, handle3, handle3Geom, handleMat,
    v1label, v2label, plabel;
var objects = [];
var plane = new THREE.Plane(),
mouse = new THREE.Vector2(),
offset = new THREE.Vector3(),
intersection = new THREE.Vector3(), INTERSECTED, SELECTED;

var projector = new THREE.Projector();
var raycaster = new THREE.Raycaster();
var clock = new THREE.Clock();

function fillScene() {
  
  // Set up gui sliders
	gui = new dat.GUI({
		autoPlace: false,
    height : (32 * 3)- 1
	});
  
  params = {
    t: 0.5
  }
  
  gui.add(params, 't').min(0).max(1).step(0.05).name('T');
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

  drawBezierCurve();
}

function drawBezierCurve() {
  /* TODO:
  Create control point objects v0, v1, and v2. v0 and v2 are the end points and should be
  black, v1 is the middle control point and should be red. 
  
  Create a green ball representing the point along the bexier curve corresponding to t. 
  
  Create two smaller yellow balls representing the linear interpolation points between 
  v0 and v1 and between v1 and v2. 
  
  Create two red lines between the end points and the middle point. 
  
  Create a black curve line between the two end points. Read the Three.js documentation to 
  learn how to set up a quadratic Bezier curve for three dimensional space. 
  
  Create a yellow line between the two linear interpolation points. 
  
  Make sure that the three control points v0, v1, and v2 are all draggable. Refer to the 
  raycaster code below and to the cubic Bezier curve starter code from the previous assignment
  for hints on this. 
  */
  
  // BEGIN CHANGES
  //points
  v0 = new THREE.Mesh( new THREE.SphereGeometry( 30, 12, 12),
                       new THREE.MeshLambertMaterial({ color: 0x000000 }));
  v0.position.x = 0;
  v0.position.y = 0;
  v0.position.z = -200;
  scene.add( v0 );
  
  v1 = new THREE.Mesh( new THREE.SphereGeometry( 30, 12, 12),
                       new THREE.MeshLambertMaterial({ color: 0xff0000 }));
  v1.position.x = 0;
  v1.position.y = 500;
  v1.position.z = -100;
  scene.add( v1 );

  v2 = new THREE.Mesh( new THREE.SphereGeometry( 30, 12, 12),
                       new THREE.MeshLambertMaterial({ color: 0x000000 }));
  v2.position.x = 0;
  v2.position.y = 0;
  v2.position.z = 200;
  scene.add( v2 );

  t_ball = new THREE.Mesh( new THREE.SphereGeometry( 30, 12, 12),
                       new THREE.MeshLambertMaterial({ color: 0x55ff22 }));
  t_ball.position.x = 0;
  t_ball.position.y = 0;
  t_ball.position.z = 0;
  scene.add( t_ball );

  li1 = new THREE.Mesh( new THREE.SphereGeometry( 20, 12, 12),
                       new THREE.MeshLambertMaterial({ color: 0xffff00 }));
  li1.position.x = 50;
  li1.position.y = 0;
  li1.position.z = 0;
  scene.add( li1 );

  li2 = new THREE.Mesh( new THREE.SphereGeometry( 20, 12, 12),
                       new THREE.MeshLambertMaterial({ color: 0xffff00 }));
  li2.position.x = -50;
  li2.position.y = 0;
  li2.position.z = 0;
  scene.add( li2 );

  //lines
  handleMat = new THREE.LineBasicMaterial({
	   color: 0xff0000
  });

  handle3Mat = new THREE.LineBasicMaterial({
	   color: 0xffff00
  });

  handle1Geom = new THREE.Geometry();
  handle1Geom.vertices.push(
	   v0.position,
	   v1.position
   );
  handle1 = new THREE.Line( handle1Geom, handleMat );
  scene.add( handle1 );
  
  handle2Geom = new THREE.Geometry();
  handle2Geom.vertices.push(
	   v2.position,
	   v1.position
   );
  handle2 = new THREE.Line( handle2Geom, handleMat );
  scene.add( handle2 );

  handle3Geom = new THREE.Geometry();
  handle3Geom.vertices.push(
	   li1.position,
	   li2.position
   );
  handle3 = new THREE.Line( handle3Geom, handle3Mat );
  scene.add( handle3 );


  //curve
  curve = new THREE.QuadraticBezierCurve3(
	   new THREE.Vector3( v0.position.x, v0.position.y, v0.position.z),
	   new THREE.Vector3( v1.position.x, v1.position.y, v1.position.z),
	   new THREE.Vector3( v2.position.x, v2.position.y, v2.position.z),
  );
  
  curveGeometry = new THREE.Geometry();
  curveGeometry.vertices = curve.getPoints( 50 );
  var material = new THREE.LineBasicMaterial( { 
    linewidth: 3,
    color : 0x000000 
  } );

  // Create the final object to add to the scene
  curveObject = new THREE.Line( curveGeometry, material );
  scene.add( curveObject );

  // objects that we want to test for intersection (picking) by
  // the ray caster
  objects = [v0, v1, v2];
 
  // END CHANGES
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
	cameraControls.target.set(4,200,92);

	// HTML LABELS
	v0label = document.createElement('div');
	v0label.style.position = 'absolute';
	v0label.style['pointer-events'] = 'none';
	v0label.style.width = 100;
	v0label.style.height = 50;
  
	v1label = document.createElement('div');
	v1label.style.position = 'absolute';
	v1label.style['pointer-events'] = 'none';
	v1label.style.width = 100;
	v1label.style.height = 50;

	v2label = document.createElement('div');
	v2label.style.position = 'absolute';
	v2label.style['pointer-events'] = 'none';
	v2label.style.width = 100;
	v2label.style.height = 50;
  
  tlabel = document.createElement('div');
	tlabel.style.position = 'absolute';
	tlabel.style['pointer-events'] = 'none';
	tlabel.style.width = 100;
	tlabel.style.height = 50;
}

function addToDOM() {
    var canvas = document.getElementById('canvas');
    canvas.appendChild(renderer.domElement);
    canvas.appendChild(gui.domElement);
}

function animate() {
  setTBallPosition();
	window.requestAnimationFrame(animate);
	render();
}

function setTBallPosition() {
/* TODO:
  Here's where you'll set the position of the balls representing the various interpolations, including
  the linear interpolations between v0 and v1 and between v1 and v2, and also the ball
  representing the quadratic Bexier curve between v0 and v2. 
*/ 

// BEGIN CHANGES

//set li1.position: (1-t)P0 + tP1
var li1p = new THREE.Vector3();
li1p = li1p.addScaledVector(v0.position, (1 - params.t))
		   .addScaledVector(v1.position, params.t);

li1.position.set(li1p.x, li1p.y, li1p.z);

//set li2.position
var li2p = new THREE.Vector3();
li2p = li2p.addScaledVector(v1.position, (1 - params.t))
		   .addScaledVector(v2.position, params.t);

li2.position.set(li2p.x, li2p.y, li2p.z);

//set t_ball.position
var tp = new THREE.Vector3();
tp = tp.addScaledVector(li1.position, (1 - params.t))
		   .addScaledVector(li2.position, params.t);

t_ball.position.set(tp.x, tp.y, tp.z);

handle3Geom.vertices = [li1.position, li2.position];
handle3Geom.verticesNeedUpdate = true;

// END CHANGES
}

function render() {
	var delta = clock.getDelta();
	cameraControls.update(delta);

	// place x, y, z HTML labels on each of the points
	camera.updateMatrixWorld();
  
  /* TODO:
    Uncomment the code below to set labels in place once v0, v1, and v2 are defined and have
    positions. Otherwise, this code will cause errors. 
  */
  
	v0label.style.top = (toXYCoords(v0.position).y + $("#canvas").offset().top + 10)  + 'px';
	v0label.style.left = (toXYCoords(v0.position).x + $("#canvas").offset().left + 10) + 'px';
	v0label.innerHTML =
		Math.round(v0.position.x) + ", " +
		Math.round(v0.position.y) + ", " +
		Math.round(v0.position.z);
	document.body.appendChild(v0label);

	v1label.style.top = (toXYCoords(v1.position).y + $("#canvas").offset().top + 10)  + 'px';
	v1label.style.left = (toXYCoords(v1.position).x + $("#canvas").offset().left + 10) + 'px';
	v1label.innerHTML =
		Math.round(v1.position.x) + ", " +
		Math.round(v1.position.y) + ", " +
		Math.round(v1.position.z);
	document.body.appendChild(v1label);

	v2label.style.top = (toXYCoords(v2.position).y + $("#canvas").offset().top + 10)  + 'px';
	v2label.style.left = (toXYCoords(v2.position).x + $("#canvas").offset().left + 10) + 'px';
	v2label.innerHTML =
		Math.round(v2.position.x) + ", " +
		Math.round(v2.position.y) + ", " +
		Math.round(v2.position.z);
	document.body.appendChild(v2label);

	tlabel.style.top = (toXYCoords(t_ball.position).y + $("#canvas").offset().top + 10)  + 'px';
	tlabel.style.left = (toXYCoords(t_ball.position).x + $("#canvas").offset().left + 10) + 'px';
	tlabel.innerHTML =
		Math.round(t_ball.position.x) + ", " +
		Math.round(t_ball.position.y) + ", " +
		Math.round(t_ball.position.z);
	document.body.appendChild(tlabel);
  
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
      SELECTED.position.copy( intersection.sub( offset ) );
      
      /*TODO:
        update the curve and handle geometry when the control points are dragged
        Refer to the cubic Bezier curve starter file or solution for hints on this. 
      */
      
      // BEGIN CHANGES
      curve.v0.set(v0.position.x, v0.position.y, v0.position.z);
      curve.v1.set(v1.position.x, v1.position.y, v1.position.z);
      curve.v2.set(v2.position.x, v2.position.y, v2.position.z);
      curveGeometry.vertices = curve.getPoints( 50 );
      curveGeometry.verticesNeedUpdate = true;
      
      handle1Geom.vertices = [v0.position, v1.position];
      handle1Geom.verticesNeedUpdate = true;
      
      handle2Geom.vertices = [v2.position, v1.position];
      handle2Geom.verticesNeedUpdate = true;

      handle3Geom.vertices = [li1.position, li2.position];
      handle3Geom.verticesNeedUpdate = true;
      
      // END CHANGES
    }
		return;
	}

  // determines which objects are intersected by the ray, and sets the dragging
  // plane with respect to the camera view.
	var intersects = raycaster.intersectObjects(objects);
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
		SELECTED = intersects[ 0 ].object;
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
  addToDOM();
  animate();
} catch(error) {
    console.log("Your program encountered an unrecoverable error, can not draw on canvas. Error was:");
    console.log(error);
}
