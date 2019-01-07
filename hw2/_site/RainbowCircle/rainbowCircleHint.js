var scene;
var camera;
initializeScene();
renderScene();


function initializeScene(){
  if(Detector.webgl){
    renderer = new THREE.WebGLRenderer( { antialias: true} );
  }else{
    renderer = new THREE.CanvasRenderer();
  }

  renderer.setClearColor(0x000000, 1);

  canvasWidth = 600;
  canvasHeight = 400;

  renderer.setSize(canvasWidth, canvasHeight);

  document.getElementById("canvas").appendChild(renderer.domElement);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(45, canvasWidth/canvasHeight, 1, 100);

  camera.position.set(0, 0, 10);

  camera.lookAt(scene.position);

  scene.add(camera);

  rainbowCircleGeometry = new THREE.Geometry();

  //We rotate around the circle incrementally, adding vertices outward to one "spoke" at a time.
  for(var d = 0; d <= 360; d = d + 72){
    var angle =  Math.PI*(d/180);

    //We use the sine and cosine of the angle to arrive at the innermost vertex.
    rainbowCircleGeometry.vertices.push(new THREE.Vector3(Math.sin(angle), Math.cos(angle), 0));
    //We don't start building faces until we've completed at least one spoke of the wheel.
    if(rainbowCircleGeometry.vertices.length > 3){
      //Think about which vertices to add to the face.
      rainbowCircleGeometry.faces.push(new THREE.Face3(
        rainbowCircleGeometry.vertices.length - 1,
        rainbowCircleGeometry.vertices.length - 3,
        rainbowCircleGeometry.vertices.length - 4));
      //Here we create vertex colors for each face, one vertex at a time.
      //Think about which colors should go with each vertex to obtain the results you want.
      rainbowCircleGeometry.faces[rainbowCircleGeometry.faces.length - 1].vertexColors[0] = new THREE.Color(1, 0, 0);
      rainbowCircleGeometry.faces[rainbowCircleGeometry.faces.length - 1].vertexColors[1] = new THREE.Color(0, 1, 0);
      rainbowCircleGeometry.faces[rainbowCircleGeometry.faces.length - 1].vertexColors[2] = new THREE.Color(1, 0, 0);
    }

    //This is the next vertex out. Because it's the middle vertex on the spoke, it's
    //part of two different faces.
    rainbowCircleGeometry.vertices.push(new THREE.Vector3(Math.sin(angle)*2, Math.cos(angle)*2, 0));
    if(rainbowCircleGeometry.vertices.length > 3){
      rainbowCircleGeometry.faces.push(new THREE.Face3(
        rainbowCircleGeometry.vertices.length - 1,
        rainbowCircleGeometry.vertices.length - 4,
        rainbowCircleGeometry.vertices.length - 2));
      rainbowCircleGeometry.faces[rainbowCircleGeometry.faces.length - 1].vertexColors[0] = new THREE.Color(0, 1, 0);
      rainbowCircleGeometry.faces[rainbowCircleGeometry.faces.length - 1].vertexColors[1] = new THREE.Color(0, 1, 0);
      rainbowCircleGeometry.faces[rainbowCircleGeometry.faces.length - 1].vertexColors[2] = new THREE.Color(1, 0, 0);
      rainbowCircleGeometry.faces.push(new THREE.Face3(
        rainbowCircleGeometry.vertices.length - 1,
        rainbowCircleGeometry.vertices.length - 3,
        rainbowCircleGeometry.vertices.length - 4));
      rainbowCircleGeometry.faces[rainbowCircleGeometry.faces.length - 1].vertexColors[0] = new THREE.Color(0, 1, 0);
      rainbowCircleGeometry.faces[rainbowCircleGeometry.faces.length - 1].vertexColors[1] = new THREE.Color(0, 0, 1);
      rainbowCircleGeometry.faces[rainbowCircleGeometry.faces.length - 1].vertexColors[2] = new THREE.Color(0, 1, 0);
      }

    //This is the third vertex of the spoke, i.e. the outermost. Like the inner vertex, it is only associated
    //with a single face.
    rainbowCircleGeometry.vertices.push(new THREE.Vector3(Math.sin(angle)*3, Math.cos(angle)*3, 0));
    if(rainbowCircleGeometry.vertices.length > 3){
      rainbowCircleGeometry.faces.push(new THREE.Face3(
        rainbowCircleGeometry.vertices.length - 1,
        rainbowCircleGeometry.vertices.length - 4,
        rainbowCircleGeometry.vertices.length - 2));
      rainbowCircleGeometry.faces[rainbowCircleGeometry.faces.length - 1].vertexColors[0] = new THREE.Color(0, 0, 1);
      rainbowCircleGeometry.faces[rainbowCircleGeometry.faces.length - 1].vertexColors[1] = new THREE.Color(0, 0, 1);
      rainbowCircleGeometry.faces[rainbowCircleGeometry.faces.length - 1].vertexColors[2] = new THREE.Color(0 ,1, 0);
        }
  }

  var rainbowCircleMat = new THREE.MeshBasicMaterial({
    vertexColors:THREE.VertexColors,
    //wireframe: true,
    side:THREE.DoubleSide});

  var rainbowCircleMesh = new THREE.Mesh(rainbowCircleGeometry, rainbowCircleMat);

  scene.add(rainbowCircleMesh);
}


function renderScene(){
  renderer.render(scene, camera);
}
