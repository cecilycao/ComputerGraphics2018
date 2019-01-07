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

  var θ = 2 * Math.PI / 360 * 1;
  var step = 0.2; //the length between each two vertices in a spoke
  var circle_radius = 3.6;
  var number_of_steps = 8;
  var r = circle_radius - step * number_of_steps;

  var colorArray = [new THREE.Color(0x000000),
                    new THREE.Color(0xFF0000),
                    new THREE.Color(0xFFA500),
                    new THREE.Color(0xFFFF00),
                    new THREE.Color(0x00FF00),
                    new THREE.Color(0x0000FF),
                    new THREE.Color(0x800080),
                    new THREE.Color(0xFF00FF),
                    new THREE.Color(0x000000)];

  for (var j = 0; j <= 2 * Math.PI / 360 * 360; j += θ){
    console.log("theta" + θ);
    for (var i = 0; i < number_of_steps; i++){
      var down1 = new THREE.Vector3(Math.cos(j) * (r + i * step), 
        Math.sin(j) * (r + i * step), 0);

      var down2 = new THREE.Vector3(Math.cos((j + θ)) * (r + i * step), 
        Math.sin(j + θ) * (r + i * step), 0);
      var up1 = new THREE.Vector3(Math.cos(j) * (r + (i + 1) * step), 
        Math.sin(j) * (r + (i + 1) * step), 0);
      var up2 = new THREE.Vector3(Math.cos(j+θ) * (r + (i + 1) * step), 
        Math.sin(j+θ) * (r + (i + 1) * step), 0);

      //triangle down
      var triangleGeometry = new THREE.Geometry();

      triangleGeometry.vertices.push(down2);
      triangleGeometry.vertices.push(down1);
      triangleGeometry.vertices.push(up1);
      triangleGeometry.faces.push(new THREE.Face3(0,1,2));

      //change the color
      triangleGeometry.faces[0].vertexColors[0] = colorArray[i];
      triangleGeometry.faces[0].vertexColors[1] = colorArray[i];
      triangleGeometry.faces[0].vertexColors[2] = colorArray[i+1];

      var triangleMaterial = new THREE.MeshBasicMaterial({
        vertexColors:THREE.VertexColors,
        side:THREE.DoubleSide
      });

      var triangleMesh = new THREE.Mesh(triangleGeometry, triangleMaterial);

      triangleMesh.position.set(0.0, 0.0, 0.0);
      scene.add(triangleMesh);

      //triangle up
      var triangleGeometry2 = new THREE.Geometry();

      triangleGeometry2.vertices.push(up2);
      triangleGeometry2.vertices.push(down2);
      triangleGeometry2.vertices.push(up1);
      triangleGeometry2.faces.push(new THREE.Face3(0,1,2));

      //change the color
      triangleGeometry2.faces[0].vertexColors[0] = colorArray[i+1];
      triangleGeometry2.faces[0].vertexColors[1] = colorArray[i];
      triangleGeometry2.faces[0].vertexColors[2] = colorArray[i+1];

      var triangleMaterial2 = new THREE.MeshBasicMaterial({
        vertexColors:THREE.VertexColors,
        side:THREE.DoubleSide
      });

      var triangleMesh2 = new THREE.Mesh(triangleGeometry2, triangleMaterial2);

      triangleMesh2.position.set(0.0, 0.0, 0.0);
      scene.add(triangleMesh2);
    }
  }
}


function renderScene(){
  renderer.render(scene, camera);
}
