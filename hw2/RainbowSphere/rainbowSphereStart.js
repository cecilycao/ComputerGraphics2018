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

  camera.position.set(10, 10, 10);

  camera.lookAt(scene.position);

  scene.add(camera);

  var axes = new THREE.AxisHelper(20);
  scene.add(axes);

  var theta = 2 * Math.PI / 360 * 5;
  var step = 0.2;
  var circle_radius = 3.6;
  var number_of_steps = 8;

  var colorArray = [new THREE.Color(0x000000),
                    new THREE.Color(0xFF0000),
                    new THREE.Color(0xFFA500),
                    new THREE.Color(0xFFFF00),
                    new THREE.Color(0x00FF00),
                    new THREE.Color(0x0000FF),
                    new THREE.Color(0x800080),
                    new THREE.Color(0xFF00FF),
                    new THREE.Color(0x000000)];

  //generate two halfs
  for (var i = -1; i < 2; i += 2){
    //generate layers along z axis
    for (var k = 0; k <= circle_radius; k += step){
      //generate sectors
      for (var j = 0; j <= 2 * Math.PI / 360 * 360; j += theta){

        var down1 = new THREE.Vector3(Math.cos(j) * (k), 
          Math.sin(j) * (k), i * Math.sqrt(circle_radius * circle_radius - (k*k)));

        var down2 = new THREE.Vector3(Math.cos((j + theta)) * (k), 
          Math.sin(j + theta) * (k), i * Math.sqrt(circle_radius * circle_radius - (k*k)));

        var up1 = new THREE.Vector3(Math.cos(j) * (k+step), 
          Math.sin(j) * (k+step), i * Math.sqrt(circle_radius * circle_radius - (k+step)*(k+step)));

        var up2 = new THREE.Vector3(Math.cos(j+theta) * (k+step), 
          Math.sin(j+theta) * (k+step), i * Math.sqrt(circle_radius * circle_radius - (k+step)*(k+step)));



        //triangle down
        var triangleGeometry = new THREE.Geometry();

        triangleGeometry.vertices.push(down2);
        triangleGeometry.vertices.push(down1);
        triangleGeometry.vertices.push(up1);
        triangleGeometry.faces.push(new THREE.Face3(0,1,2));

        //todo: change the color
        var this_color = Math.round(Math.abs(k) / step) % 8;
        var next_color = Math.round(Math.abs(k) / step + 1) % 8;

        triangleGeometry.faces[0].vertexColors[0] = colorArray[this_color];
        triangleGeometry.faces[0].vertexColors[1] = colorArray[this_color];
        triangleGeometry.faces[0].vertexColors[2] = colorArray[next_color];

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

        //todo: change the color
        triangleGeometry2.faces[0].vertexColors[0] = colorArray[next_color];
        triangleGeometry2.faces[0].vertexColors[1] = colorArray[this_color];
        triangleGeometry2.faces[0].vertexColors[2] = colorArray[next_color];

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

  var spotLight = new THREE.SpotLight( 0xffffff );
  spotLight.position.set(10, 10, 10);
  spotLight.castShadow = false;
  spotLight.shadow.mapSize.width = 1024;
  spotLight.shadow.mapSize.height = 1024;
  scene.add(spotLight);
}


function renderScene(){
  renderer.render(scene, camera);
}