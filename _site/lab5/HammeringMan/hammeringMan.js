////////////////////////////////////////////////////////////////////////////////
/*global THREE, document, window  */
var camera, scene, renderer, gui, man, arm, armRot, manRot, cycle = 0;
var cameraControls;

var clock = new THREE.Clock();

function fillScene() {
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog( 0x808080, 2000, 4000 );
  

// Set up gui sliders
	gui = new dat.GUI({
		autoPlace: false,
    height : (32 * 3)- 1
	});

  params = {
  	yrot: 0,
  };
  
	gui.add(params, 'yrot').min(0).max(180).step(10).name('Y rotation');


	gui.domElement.style.position = "relative";
	gui.domElement.style.top = "-400px";
	gui.domElement.style.left = "350px";

	// LIGHTS

	scene.add( new THREE.AmbientLight( 0x222222 ) );

	var light = new THREE.DirectionalLight( 0xffffff, 0.7 );
	light.position.set( 200, 500, 500 );

	scene.add( light );

	light = new THREE.DirectionalLight( 0xffffff, 0.9 );
	light.position.set( -200, -100, -400 );

	scene.add( light );

	//grid xz
	var gridXZ = new THREE.GridHelper(2000, 100,  new THREE.Color(0xCCCCCC), new THREE.Color(0x888888));
	scene.add(gridXZ);

	//axes
	var axes = new THREE.AxisHelper(150);
  axes.scale.set(7,7,7);
	scene.add(axes);

	loadObjects();
}

function loadObjects() {
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
  mtlLoader.load('hammeringman.mtl', function(materials) {
    materials.preload();
    var objLoader = new THREE.OBJLoader( manager );
    objLoader.setMaterials(materials);
    	objLoader.load( 'hammeringman.obj', function ( obj ) {
        man = obj;
        objLoader.load( 'hammeringman_arm.obj', function ( obj ) {
          arm = obj;
          loaded = true;
          drawHammeringMan();
        }, onProgress, onError );
    	}, onProgress, onError );
    })
  }

function drawHammeringMan() {
  armRot = new THREE.Object3D();
  manRot = new THREE.Object3D();
  shoulder = new THREE.Object3D();
  /* TODO:
  Everything in the animate() function below is currently complete and should 
  remain unchanged. All that needs to be done should be done in this function 
  drawHammeringMan(). 
  
  This will involve adjusting the positioning of the objects and their 
  hierarchichal relationship. You may need to create additional objects 
  to get the effect you need. 
  
  The following lines of code can be altered in any way you see fit, but the
  armRot and manRot objects should be retained, and should continue to be the 
  objects that are rotated in the animate() function.
  */
  
  man.position.y = 600; 
  arm.position.z = 80;
  arm.position.y = -375; 

  
  
  armRot.add(arm);
  shoulder.add(armRot);
  
  shoulder.position.y = 400;
  shoulder.position.z = -20;
  man.add(shoulder);
  manRot.add(man);

  scene.add(manRot);

  animate();
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
	camera.position.set( -1200, 1000, 1000);
	cameraControls.target.set(250, 600,250);
}

function addToDOM() {
    var canvas = document.getElementById('canvas');
    canvas.appendChild(renderer.domElement);
    canvas.appendChild(gui.domElement);
}

function animate() {
  cycle = cycle == 360 ? 1 : ++cycle;
  armRot.rotation.x = Math.cos(cycle * (Math.PI/180)) - 0.5;
  manRot.rotation.y = params.yrot * (Math.PI/180);
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
} catch(error) {
    console.log("Your program encountered an unrecoverable error, can not draw on canvas. Error was:");
    console.log(error);
}
