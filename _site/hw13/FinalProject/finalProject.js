
////////////////////////////////////////////////////////////////////////////////
/*global THREE, Coordinates, document, window  */
var DEBUG = false; //whether to show debug messages
//ex: if (DEBUG){console.log()};

var camera, scene, renderer;
var cameraControls, gui, skybox;

var keyboard = new KeyboardState();
var clock = new THREE.Clock();
var Loaded = false;
var listener;
var musicLoaded = false;

//musics
var bgm, victoryMusic;

//objects
//var platform;
var charactor;
var chickens = [];
var cars = [];
var carsT1 = [];
var carsT2 = [];
var carsT3 = [];
var blood;
var ambientLight;
var spotLight;

//rot Objects
var leftHandRot, rightHandRot, leftLegRot, rightLegRot;

//global values
//Game data
var cycle = 0;
var CHAR_STEP_SPEED = 2.5;
var CHAR_STEP_SIZE = 20;
var CAR_T1_ROTATION_SPEED = Math.PI / 200;
var CAR_T2_ROTATION_SPEED = Math.PI / 300;
var CAR_T3_ROTATION_SPEED = Math.PI / 400;
var radius = 452;
var checkSucessPositonOn = true;

//Game Status
var score = 0;
var success = false;
var dead = false;
var restart = false;






function fillScene() {
  keyboard.update();
  scene = new THREE.Scene();

  var skybox = new THREE.CubeTextureLoader()
      .setPath( 'skybox/' )
        .load( [ 'front.png', 
             'back.png', 
             'up.png', 
             'down.png', 
             'right.png', 
             'left.png' ] );
  scene.background = skybox;



  // LIGHTS

  ambientLight = new THREE.AmbientLight( 0x404040 , 7); // soft white light
  scene.add( ambientLight );

  //grid xz
  //var gridXZ = new THREE.GridHelper(2000, 100, new THREE.Color(0xCCCCCC), new THREE.Color(0x888888));
  //scene.add(gridXZ);

  //axes
  //var axes = new THREE.AxisHelper(150);
  //axes.position.y = 1;
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


  //load platform
  var mtlLoader = new THREE.MTLLoader();
  mtlLoader.load('completeObjects.mtl', function(materials) {
    materials.preload();
    var objLoader = new THREE.OBJLoader( manager );
    objLoader.setMaterials(materials);
    objLoader.load( 'completeObjects.obj', function ( obj ) {

      for (var i = 0; i < obj.children.length; i++) {
        if (obj.children[i].name == "platform_Cube.077") {
          platform = obj.children[i];
          console.log("platform" + i);
        } else if (obj.children[i].name.includes("Chicken")) {
          chickens.push(obj.children[i]);
          console.log("chicken" + i);
        } else  if (obj.children[i].name.includes("car")){
          cars.push(obj.children[i]);
        }
      }


      Loaded = true;

      scene.add(platform);

      for (var i = 0; i < chickens.length; i++) {
        scene.add(chickens[i]);
      }

      for (var i = 0; i < cars.length; i++) {
        if (cars[i].name.includes("car1")){
          carsT1.push(cars[i]);
        } else if (cars[i].name.includes("car2")) {
          carsT2.push(cars[i]);
        } else {
          carsT3.push(cars[i]);
        }
         scene.add(cars[i]);
      }

//load audios

      var bgmLoaded = false;
      var audioLoader = new THREE.AudioLoader();
      bgm = new THREE.Audio( listener );
      audioLoader.load( 'Never_Again.ogg', function ( buffer ) {
        bgm.setBuffer( buffer );
        bgm.setLoop( true );
        bgm.setVolume( 0.5 );
        bgm.play();
        bgmLoaded = true;



        var victoryMusicLoaded = false;
        victoryMusic = new THREE.Audio( listener );
        audioLoader.load( 'Battle_Victory.oga', function ( buffer ) {
          victoryMusic.setBuffer( buffer );
          victoryMusic.setLoop( false );
          victoryMusic.setVolume( 0.5 );
          victoryMusic.play();
          victoryMusicLoaded = true;


          var defeatMusicLoaded = false;
          defeatMusic = new THREE.Audio( listener );
          audioLoader.load( 'BOOM.ogg', function ( buffer ) {
            defeatMusic.setBuffer( buffer );
            defeatMusic.setLoop( false );
            defeatMusic.setVolume( 0.5 );
            defeatMusic.play();
            defeatMusicLoaded = true;

            if (victoryMusicLoaded) {
              victoryMusic.stop();
            }

            if (defeatMusicLoaded) {
              defeatMusic.stop();
            }

            if (bgmLoaded && victoryMusicLoaded && defeatMusicLoaded) {
              musicLoaded = true;
            }

            drawScene();
            addToDOM();
            animate();

          } );

        } );

      } );
      
    }, onProgress, onError );
  }, onProgress, onError );
                                                                                    
}

function drawScene(){
  //Charactor materials
  var bodyMaterial = new THREE.MeshLambertMaterial({
    color: 0xeeeeee
  });

  var handMaterial = new THREE.MeshPhongMaterial({
    color: 0x6d523d
  });

  var legMaterial = handMaterial;


  drawCharactor(bodyMaterial, handMaterial, legMaterial);
  charactor.scale.x = 0.3;
  charactor.scale.y = 0.3;
  charactor.scale.z = 0.3;
  charactor.position.y = 25;
  scene.add(charactor);


  //draw blood
  var bloodMat = new THREE.MeshPhongMaterial({
    color: 0xce0202
  });


  var bloodGeo = new THREE.CircleGeometry(25, 32)
  blood = new THREE.Mesh(bloodGeo, bloodMat);
  blood.scale.x = 1.5;
  blood.rotation.x = -Math.PI / 2;

  scene.add(blood);
  blood.visible = false;

  spotLight = new THREE.SpotLight(0xffe4e1, 10);
  spotLight.position.set( 0, 200, 0 );
  spotLight.angle = 0.2;
  spotLight.castShadow = true;
  spotLight.penumbra = 0.1;
  scene.add(spotLight);
  spotLight.visible = false;

  checkSuccessPosition(bodyMaterial);
}


function checkSuccessPosition(bodyMaterial) {
  var checkPositionGeo = new THREE.BoxGeometry(10, 10, 10);

  var checkPosition = new THREE.Mesh(checkPositionGeo, bodyMaterial);

  checkPosition.position.x = radius;
  
  scene.add(checkPosition);

  checkPosition.visible = checkSucessPositonOn;


}

function drawCharactor(bodyMaterial, handMaterial, legMaterial){
  charactor = new THREE.Object3D();

  //body:
  var bodyGeometry = new THREE.BoxGeometry(100, 120, 100);
  
  var charBody = new THREE.Mesh(bodyGeometry, bodyMaterial);


  //hands: 
  var handGeometry = new THREE.CylinderGeometry(5,5,60,32);

  var charHandMesh = new THREE.Mesh(handGeometry, handMaterial);
  charHandMesh.position.y = -30;
  var charHand = new THREE.Object3D();
  charHand.add(charHandMesh);
  charHand.rotation.z = Math.PI / 6;

  var charHandMesh2 = new THREE.Mesh(handGeometry, handMaterial);
  charHandMesh2.position.y = -30;
  var charHand2 = new THREE.Object3D();
  charHand2.add(charHandMesh2);
  charHand2.rotation.z = - Math.PI / 6;

  leftHandRot = new THREE.Object3D();
  rightHandRot = new THREE.Object3D();
  leftHandRot.add(charHand);
  rightHandRot.add(charHand2);

  leftHandRot.position.x = 45;
  rightHandRot.position.x = -45;


  //legs:
  var legGeometry = new THREE.CylinderGeometry(5, 5, 40, 32);
  var charLegMesh = new THREE.Mesh(legGeometry, legMaterial);
  charLegMesh.position.y = -15;

  var charlegMesh2 = new THREE.Mesh(legGeometry, legMaterial);
  charlegMesh2.position.y = -15;

  leftLegRot = new THREE.Object3D();
  rightLegRot = new THREE.Object3D();

  leftLegRot.add(charLegMesh);
  rightLegRot.add(charlegMesh2)

  leftLegRot.position.x = 20;
  rightLegRot.position.x = -20;

  leftLegRot.position.y = -60;
  rightLegRot.position.y = -60;

  //charactor
  charactor.add(charBody, leftHandRot, rightHandRot, leftLegRot, rightLegRot);
}


function init() {
  var canvasWidth = 800;
  var canvasRatio = 3 / 2;
  var canvasHeight = canvasWidth / canvasRatio;
  

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

//Never_Again.ogg
  listener = new THREE.AudioListener();
  camera.add( listener );
}

function addToDOM() {
    var canvas = document.getElementById('canvas');
    renderer.domElement.id = "innerCanvas";
    canvas.appendChild(renderer.domElement);
}

function animate() {
  cycle = cycle ==  180 ? 1 : ++cycle;
  if(Loaded && musicLoaded){

    keyboard.update();

    if (!success) {
       carRotation();

    }

    if (!dead && !success) {
      var direction = new THREE.Vector3(camera.getWorldDirection().x, 0, camera.getWorldDirection().z);
      direction = direction.normalize();
      var zAxis = new THREE.Vector3(0, 0, 1);
      var angle = direction.angleTo(zAxis);

      if (direction.clone().cross(zAxis).y < 0){
        angle = -angle;
      } else {
        angle = Math.abs(angle);
      }

      if (keyboard.pressed("W")){
          moving();
          turnAndWalk(angle);

        } else if (keyboard.pressed("S")){
          moving();
          turnAndWalk(angle + Math.PI)

        } else if (keyboard.pressed("A")){
          moving();
          turnAndWalk(angle - Math.PI / 2)

        } else if (keyboard.pressed("D")){
          moving();
          turnAndWalk(angle + Math.PI / 2);
        }
      }

      if (checkCollideWith(cars)){
        dead = true;
        deadScene();
      }
      if (checkPickUp(chickens)) {
        score++;
      }

      if (checkSuccess()){
        success = true;
        successScene();
      }

      if (restart) {
        restartGame();
      }
      

  }

  document.getElementById("score").innerHTML = "Score: " + score; 
  window.requestAnimationFrame(animate);
  render();
}

function checkCollideWith(objects) {
  var originPosition = charactor.position.clone();
  var body = charactor.children[0];

  for (var i = 0; i < body.geometry.vertices.length; i++) {
    var localVertex = body.geometry.vertices[i].clone();
    var globalVertex = localVertex.applyMatrix4(charactor.matrix);

    //var direction = globalVertex.sub(body.getWorldPosition());
    var direction = globalVertex.clone().sub(originPosition);


    var ray = new THREE.Raycaster(originPosition, direction.clone().normalize());
    var collisionResults = ray.intersectObjects(objects);
    if (collisionResults.length > 0 && collisionResults[0].distance < direction.length()) {
      //console.log(collisionResults);
      return true;
    }
  }
  return false;
}

function checkPickUp(objects) {
  var originPosition = charactor.position.clone();
  var body = charactor.children[0];

  for (var i = 0; i < body.geometry.vertices.length; i++) {
    var localVertex = body.geometry.vertices[i].clone();
    var globalVertex = localVertex.applyMatrix4(charactor.matrix);

    //var direction = globalVertex.sub(body.getWorldPosition());
    var direction = globalVertex.clone().sub(originPosition);


    var ray = new THREE.Raycaster(originPosition, direction.clone().normalize());
    var collisionResults = ray.intersectObjects(objects);
    if (collisionResults.length > 0 && collisionResults[0].distance < direction.length()) {
      for (var i =0; i < objects.length; i++){
        if (objects[i].name == collisionResults[0].object.name) {
          objects[i].visible = false;
        //objects.splice(i,1);
        
          return true;
        }
      }
      //console.log(collisionResults[0].object.name);
      
    }
  }
  return false;
}

function checkSuccess() {
  var distanceToOrigin = Math.sqrt(charactor.position.x * charactor.position.x + charactor.position.z * charactor.position.z);
  if (distanceToOrigin >= radius) {
    return true;
  }
}

function restartGame() {
  charactor.castShadow = false;
  ambientLight.intensity = 7;
  spotLight.visible = false;
  charactor.position.y = 25;
  charactor.rotation.z = 0;
  
  score = 0;
  success = false;
  dead = false;
  charactor.position.x = 0;
  charactor.position.z = 0;
  restart = false;
  blood.visible = false;
  for (var i = chickens.length - 1; i >= 0; i--) {
    chickens[i].visible = true;
  }

  //music
  defeatMusic.stop();
  victoryMusic.stop();
  bgm.play();


}


function carRotation(){
  for (var i = 0; i < carsT1.length; i++) {
    carsT1[i].rotation.y += CAR_T1_ROTATION_SPEED;
  }
  for (var i = 0; i < carsT2.length; i++) {
    carsT2[i].rotation.y -= CAR_T2_ROTATION_SPEED;
  }
  for (var i = 0; i < carsT3.length; i++) {
    carsT3[i].rotation.y += CAR_T3_ROTATION_SPEED;
  }

}

function moving(){
  handRot();
  legRot();
}



function handRot(){
  leftHandRot.rotation.x = CHAR_STEP_SPEED * Math.cos(cycle * (Math.PI / CHAR_STEP_SIZE));
  rightHandRot.rotation.x = - CHAR_STEP_SPEED * Math.cos(cycle * (Math.PI / CHAR_STEP_SIZE));
}

function legRot(){
  leftLegRot.rotation.x = - CHAR_STEP_SPEED * Math.cos(cycle * (Math.PI / CHAR_STEP_SIZE));
  rightLegRot.rotation.x = CHAR_STEP_SPEED * Math.cos(cycle * (Math.PI / CHAR_STEP_SIZE));
}

function turnAndWalk( angle ){
  charactor.rotation.y = - angle;
  charactor.position.x -= CHAR_STEP_SPEED * Math.sin(angle);
  charactor.position.z += CHAR_STEP_SPEED * Math.cos(angle);
}

function deadScene(){
  charactor.rotation.z = Math.PI / 2;
  charactor.position.y = -5;
  blood.position.x = charactor.position.x;
  blood.position.z = charactor.position.z;
  blood.visible = true;

  bgm.stop();
  defeatMusic.play();
  
}

function successScene(){
  charactor.castShadow = true;
  ambientLight.intensity = 1;
  spotLight.target = charactor;
  spotLight.visible = true;
  bgm.stop();
  victoryMusic.play();
}


function render() {
  var delta = clock.getDelta();
  cameraControls.update(delta);
  renderer.render(scene, camera);
}


$(document).ready(function(){
  init();
  fillScene();

  //load and render new scene
  $('#restart').click(function(){
    restart = true;
  });

  $('#easy').click(function(){
    $(this).css('border', '4px solid #ecd56a');
    $(this).css('color', '#ecd56a');

    $('button#hard').css('border', '4px solid white');
    $('button#hard').css('color', 'white');

    CHAR_STEP_SPEED = 2.5;
    CAR_T1_ROTATION_SPEED = Math.PI / 160;
    CAR_T2_ROTATION_SPEED = Math.PI / 260;
    CAR_T3_ROTATION_SPEED = Math.PI / 300;
  });  

  $('#hard').click(function(){
    $(this).css('border', '4px solid #ecd56a');
    $(this).css('color', '#ecd56a');

    $('button#easy').css('border', '4px solid white');
    $('button#easy').css('color', 'white');

    CHAR_STEP_SPEED = 2.5;
    CAR_T1_ROTATION_SPEED = Math.PI / 120;
    CAR_T2_ROTATION_SPEED = Math.PI / 200;
    CAR_T3_ROTATION_SPEED = Math.PI / 250;
  });  

});
