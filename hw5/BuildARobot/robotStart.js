
////////////////////////////////////////////////////////////////////////////////
/*global THREE, Coordinates, document, window  */

var camera, scene, renderer;
var cameraControls, gui, skybox;

var keyboard = new KeyboardState();
var clock = new THREE.Clock();
var loaded = false;

//gui
var fingerOpen;
var walk;

//objects
var robot;
var robotRot;
var coverObj;
var bodyRot;
var legRot, leg2Rot, leg3Rot, leg4Rot;

var pawRot, pawRot2;
var fingerRot, finger2Rot, finger3Rot, finger4Rot;
var fingerRot2, finger2Rot2, finger3Rot2, finger4Rot2;
var lowerPartRot, upperPartRot, handRot;
var lowerPartRot2, upperPartRot2, handRot2;

//matrices
var xMirrorMatrix = new THREE.Matrix4();
var yMirrorMatrix = new THREE.Matrix4();
var zMirrorMatrix = new THREE.Matrix4();

//values
var cycle = 0;
var stepSize = 0.2;
var handPositionAlongZ = Math.PI / 10;
var STEPSPEED = 30;
var ROBOTSCALE = 0.5;

function fillScene() {
	keyboard.update();
	scene = new THREE.Scene();

/*
	scene.background = new THREE.CubeTextureLoader()
	.setPath( 'airport/' )
	.load( [
		'sky-xpos.png',
		'sky-xneg.png',
		'sky-ypos.png',
		'sky-yneg.png',
		'sky-zpos.png',
		'sky-zneg.png'
	] );*/
	var skybox = new THREE.CubeTextureLoader()
     	.setPath( 'majestic/' )
        .load( [ 'front.png', 
        		 'back.png', 
        		 'up.png', 
        		 'down.png', 
        		 'right.png', 
        		 'left.png' ] );
    scene.background = skybox;


	// Set up gui sliders
	gui = new dat.GUI({
		autoPlace: false,
    	height : (32 * 3)- 1
	});

  	params = {
  		fingerOpen: 30,
  		pawRotSpeed: 1,
  		bodyRotSpeed: 3,
  		lowerPartRot: -20,
  		upperPartRot: 0,
  		handRotSpeed: 0,

  	};
  
	gui.add(params, 'fingerOpen').min(0).max(90).step(10).name('Finger Open');
	gui.add(params, 'pawRotSpeed').min(0).max(8).step(1).name('paw Rotation');
	gui.add(params, 'bodyRotSpeed').min(0).max(8).step(1).name('Body Rotation');
	gui.add(params, 'lowerPartRot').min(-90).max(120).step(10).name('lower part rotation');
	gui.add(params, 'upperPartRot').min(-20).max(90).step(10).name('upper part rotation');
	gui.add(params, 'handRotSpeed').min(0).max(8).step(1).name('hand Rotation');

	gui.domElement.style.position = "relative";
	gui.domElement.style.top = "-400px";
	gui.domElement.style.left = "350px";



	scene.fog = new THREE.Fog( 0x808080, 2000, 4000 );

	// LIGHTS

	scene.add( new THREE.AmbientLight( 0x222222 ) );

	var light = new THREE.DirectionalLight( 0xffffff, 0.7 );
	light.position.set( 200, 500, 500 );

	scene.add( light );

	light = new THREE.DirectionalLight( 0xffffff, 0.9 );
	light.position.set( -200, -100, -400 );

	scene.add( light );

	//grid xz
 	var gridXZ = new THREE.GridHelper(2000, 100, new THREE.Color(0xCCCCCC), new THREE.Color(0x888888));
 	//scene.add(gridXZ);

 	//axes
 	var axes = new THREE.AxisHelper(150);
 	axes.position.y = 1;
 	//scene.add(axes);

 	loadObjects();
}

function loadObjects() {
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
    console.log('Error: ' + xhr)
	};

	
	var coverMaterial = new THREE.MeshPhongMaterial({
		color: 0xf6d1ea, 
		transparent: true, 
		opacity: 0.4,
		envMap: scene.background,
		shininess: 1000,
		emissive: 0xf6d1ea
	});  	
	
	var objLoader = new THREE.OBJLoader( manager );

	objLoader.load( 'cover.obj', function ( obj ) {

    	obj.traverse( function ( node ) {
    		if ( node.isMesh ) node.material = coverMaterial;
    	} );

        coverObj = obj;
        
        loaded = true;
        drawRobot();
  
	}, onProgress, onError );
																																										
}

function drawRobot() {


	//////////////////////////////
	// MATERIALS
	var coverMaterial = new THREE.MeshPhongMaterial({
		//color: 0x7777ff, 
		// color: 0xffffff,
		// transparent: true, 
		// envMap: scene.background,
		// opacity: 0.1
	});

	var handMaterial = new THREE.MeshLambertMaterial({
		color: 0x8c4388,
		transparent: true, 
		opacity: 0.7
	});
	

	var pawMaterial = new THREE.MeshPhongMaterial({
		color: 0x734094,
		transparent: true, 
		opacity: 0.7,
		emissive: 0x734094
	});
	

	var bodySphereMaterial = new THREE.MeshLambertMaterial({
		color: 0xbdd2ff,
		opacity: 1,
		emissive: 0xbdd2ff
	});

	var bodyChunkMaterial = new THREE.MeshPhongMaterial({ 
		color: 0xa5b3f9, 
		envMap: scene.background,
		reflectivity: 0.7,
		emissive: 0xa5b3f9,
		shininess: 100,
		specular: 0xa34781,

	});

	var LegMaterial = new THREE.MeshLambertMaterial({
		color: 0x593da1,
		transparent: true, 
		opacity: 0.6
	});

	

	//////////////////////////////
	//MODELS
	robot = new THREE.Object3D();
	robotRot = new THREE.Object3D();

	var cover = new THREE.Object3D();
	drawCover(cover, coverMaterial);

	var hands = new THREE.Object3D();
	drawHands(hands, handMaterial, pawMaterial);

	var robotBody = new THREE.Object3D();
	drawBody(robotBody, bodySphereMaterial, bodyChunkMaterial);


	var legs = new THREE.Object3D();
	drawLeg(legs, LegMaterial);


	cover.position.y = 520;
	robotBody.position.y = 550;
	hands.position.y = 480;
	legs.position.y = 480;
	legs.position.x = -50;
	legs.position.z = -50;

	robot.add(cover, hands, robotBody, legs);

	//scene.add(legs);
	robot.scale.x = ROBOTSCALE;
	robot.scale.y = ROBOTSCALE;
	robot.scale.z = ROBOTSCALE;
	robot.rotation.y = - Math.PI / 2;
	robotRot.add(robot);
	scene.add(robotRot);




	animate();
}

function drawCover(cover, coverMaterial){

	coverObj.position.x = -80;
	coverObj.position.z = -60;
	cover.add(coverObj);
}

function drawHands(hands, handMaterial, pawMaterial){

	//paw
	var paw = new THREE.Object3D();
	pawRot = new THREE.Object3D();
	fingerRot = new THREE.Object3D();
	finger2Rot = new THREE.Object3D();
	finger3Rot = new THREE.Object3D();
	finger4Rot = new THREE.Object3D();
	drawPaws(paw, fingerRot, finger2Rot, finger3Rot, finger4Rot, pawRot, pawMaterial);

	var paw2 = new THREE.Object3D();
	pawRot2 = new THREE.Object3D();
	fingerRot2 = new THREE.Object3D();
	finger2Rot2 = new THREE.Object3D();
	finger3Rot2 = new THREE.Object3D();
	finger4Rot2 = new THREE.Object3D();
	drawPaws(paw2, fingerRot2, finger2Rot2, finger3Rot2, finger4Rot2, pawRot2, pawMaterial);

	//hand

 	lowerPartRot = new THREE.Object3D();
 	upperPartRot = new THREE.Object3D();
 	handRot = new THREE.Object3D();
 	drawOneHand(lowerPartRot, upperPartRot, handRot, paw, handMaterial);

 	lowerPartRot2 = new THREE.Object3D();
 	upperPartRot2 = new THREE.Object3D();
 	handRot2 = new THREE.Object3D();
 	drawOneHand(lowerPartRot2, upperPartRot2, handRot2, paw2, handMaterial);

 	leftHand = new THREE.Object3D();
 	rightHand = new THREE.Object3D();
 	leftHand.add(handRot);
 	rightHand.add(handRot2);
 	rightHand.rotation.y = Math.PI;
 	leftHand.position.x = 100;
 	rightHand.position.x = -100;

 	hands.add(leftHand, rightHand);
}

function drawPaws(paw, fingerRot, finger2Rot, finger3Rot, finger4Rot, pawRot, pawMaterial){

 	var pawBox;
 	var finger1;
 	var finger2;
 	var finger3;
 	var finger4;
 	var finger1n = new THREE.Object3D();
	var finger2n = new THREE.Object3D();
	var finger3n = new THREE.Object3D();
	var finger4n = new THREE.Object3D();

	//paw joint
	pawBox = new THREE.Mesh(
	new THREE.BoxGeometry(20,5,20), pawMaterial);

	//finger
	var fingerShape = new THREE.Shape();
	  fingerShape.moveTo(  20, 0  );
	  fingerShape.lineTo(  10, -65 );
	  fingerShape.lineTo(  0, 0 );
	  
	var extrudeSettings = { amount: 3, bevelEnabled: false };
	  
	var fingerGeometry = new THREE.ExtrudeGeometry( fingerShape, extrudeSettings );
	  
	finger1 = new THREE.Mesh(fingerGeometry, pawMaterial);
	finger2 = new THREE.Mesh(fingerGeometry, pawMaterial);

	
	//change local position 
	finger1.rotation.x = Math.PI/19;	
	finger1.position.x = -10;
	finger1.position.z = 0;

	finger2.rotation.x = -Math.PI/19;
	finger2.position.x = -10;
	finger2.position.z = 0;

	finger3 = finger1.clone();
	finger4 = finger2.clone();

	finger1n.add(finger1);
	finger2n.add(finger2);
	finger3n.add(finger3);
	finger4n.add(finger4);

	finger3n.rotation.y = Math.PI/2;
	finger4n.rotation.y = Math.PI/2;

	fingerRot.add(finger1n);
	finger2Rot.add(finger2n);
	finger3Rot.add(finger3n);
	finger4Rot.add(finger4n);

	fingerRot.position.z = 10;
	finger2Rot.position.z = -10;
	finger3Rot.position.x = 10;
	finger4Rot.position.x = -10;
	pawRot.add(pawBox, fingerRot, finger2Rot, finger3Rot, finger4Rot);
	paw.add(pawRot);
}

function drawOneHand(lowerPartRot, upperPartRot, handRot, paw, handMaterial){
	var hand = new THREE.Object3D();
	var handBone;
 	var handBall;
 	var handBone2;

 	//hand upper bone
	handBone = new THREE.Mesh(
		new THREE.CylinderGeometry( 10, 10, 100, 32 ), handMaterial );
	
	//hand joint
	handBall = new THREE.Mesh(
		new THREE.SphereGeometry(15,50,50), handMaterial);

	//hand lower bone
	handBone2 = handBone.clone();


	handBone.position.y =  -50;
	handBall.position.y = 0;
	handBone2.position.y = -50;
	paw.position.y = -100;
	
	lowerPartRot.add(handBone2, handBall, paw);
	lowerPartRot.position.y = -110;

	hand.add(handBone, lowerPartRot);
	upperPartRot.add(hand);
	handRot.add(upperPartRot);

	handRot.rotation.z = handPositionAlongZ;

}


function drawBody(robotBody, bodySphereMaterial, bodyChunkMaterial){
	var entireBody = new THREE.Object3D();
	bodyRot = new THREE.Object3D();
	var body = new THREE.Object3D();

	//materials
	var bodyChunkObject = new THREE.SphereGeometry(100, 200, 200);
	var bodyChunk = new THREE.Mesh(bodyChunkObject, bodyChunkMaterial);

	var bodySphereObject = new THREE.SphereGeometry(60, 200, 200);
	var bodySphere = new THREE.Mesh(bodySphereObject, bodySphereMaterial);
	bodySphere.scale.x = 4.2;
	bodySphere.scale.z = 1.6;
	bodySphere.position.x = -25;

	bodySphere2 = bodySphere.clone();
	bodySphere2.rotation.y = Math.PI / 2;


	body.add(bodySphere);
	body.add(bodySphere2);

	body.position.x = 20;
	body.position.z = 0;

	bodyRot.add(body);
	bodyChunk.scale.y = 1;
	bodyChunk.position.x = 0;
	bodyChunk.position.y = -60;

	robotBody.add(bodyRot);
	robotBody.add(bodyChunk);
	
}


function drawLeg(legs, LegMaterial){
	legRot = new THREE.Object3D();
	leg2Rot = new THREE.Object3D();
	leg3Rot = new THREE.Object3D();
	leg4Rot = new THREE.Object3D();


	var legCylinder = new THREE.CylinderGeometry( 10, 10, 400, 32 );

	var legBoneRaw = new THREE.Mesh(legCylinder, LegMaterial);

	var legBone1 = new THREE.Object3D();
	legBone1.add(legBoneRaw);
	legBone1.position.y = -200;

	var legBone3 = legBone1.clone();
	var legBone2 = legBone1.clone();
	var legBone4 = legBone1.clone();

	
	legRot.add(legBone1);
	leg3Rot.add(legBone3);
	leg3Rot.position.x = 100;
	leg3Rot.position.z = 100;

	leg2Rot.add(legBone2);
	leg2Rot.position.z = 100;
	leg2Rot.position.x += 10;

	leg4Rot.add(legBone4);
	leg4Rot.position.x = 110;

	legs.add(legRot, leg2Rot, leg3Rot, leg4Rot);

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
	camera.position.set( -800, 400, -500); //-800, 600, -500
	cameraControls.target.set(4,201,92);
}

function addToDOM() {
    var canvas = document.getElementById('canvas');
    canvas.appendChild(renderer.domElement);
    canvas.appendChild(gui.domElement);
}

function animate() {
	if(loaded){
		cycle = cycle == 360 ? 1 : ++cycle;

  		fingerRotation(fingerRot, finger2Rot, finger3Rot, finger4Rot, pawRot);
  		fingerRotation(fingerRot2, finger2Rot2, finger3Rot2, finger4Rot2, pawRot2);

  		handRotation(lowerPartRot, upperPartRot, handRot);
  		handRotation(lowerPartRot2, upperPartRot2, handRot2);


  		bodyRot.rotation.y += 0.01*params.bodyRotSpeed;
  		
  		keyboard.update();
  		//W: forward
  		//A: turn left
  		//S: turn right

  		var angle;
  		if (keyboard.pressed("W")){
  			angle = robotRot.rotation.y;
  			moveForward();

  			robotRot.position.x -= 4*stepSize* Math.cos(angle);
  			robotRot.position.z += 4*stepSize* Math.sin(angle);
  		} else if (keyboard.pressed("S")){
  			moveForward();
  			robotRot.rotation.y -= Math.PI / 180;
  		} else if (keyboard.pressed("A")){
  			moveForward();
  			robotRot.rotation.y += Math.PI / 180;
  		}
	}

	window.requestAnimationFrame(animate);
	render();
}

function fingerRotation(finger1, finger2, finger3, finger4, paw){
	finger1.rotation.x = - Math.PI / 180 * params.fingerOpen;
  	finger2.rotation.x =  Math.PI / 180 * params.fingerOpen;
  	finger3.rotation.z =  Math.PI / 180 * params.fingerOpen;
  	finger4.rotation.z = - Math.PI / 180 * params.fingerOpen;
  	paw.rotation.y += 0.02*params.pawRotSpeed;
}

function handRotation(lowerPart, upperPart, hand){
	lowerPart.rotation.z = Math.PI / 180 * params.lowerPartRot;
  	upperPart.rotation.z = Math.PI / 180 * params.upperPartRot;
  	hand.rotation.x += 0.01*params.handRotSpeed;
}

function moveForward(faceOnZ, axisNeedPlus){
  	legRot.rotation.x = stepSize * Math.cos(cycle * (Math.PI/STEPSPEED)) ;
  	leg3Rot.rotation.x = stepSize * Math.cos(cycle * (Math.PI/STEPSPEED));	
  	leg2Rot.rotation.x = - stepSize * Math.cos(cycle * (Math.PI/STEPSPEED));	
  	leg4Rot.rotation.x = -stepSize * Math.cos(cycle * (Math.PI/STEPSPEED));
 
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
  //animate();
} catch(error) {
    console.log("Your program encountered an unrecoverable error, can not draw on canvas. Error was:");
    console.log(error);
}
