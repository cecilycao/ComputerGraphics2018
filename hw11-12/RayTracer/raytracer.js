"use strict";

//CORE VARIABLES
var canvas, context, imageBuffer;

var DEBUG = false; //whether to show debug messages
//ex: if (DEBUG){console.log()};
var EPSILON = 0.00001; //error margins

//scene to render
var scene, camera, surfaces, lights; //etc...

var color;

//initializes the canvas and drawing buffers
function init() {
  canvas = $('#canvas')[0];
  context = canvas.getContext("2d");
  imageBuffer = context.createImageData(canvas.width, canvas.height); //buffer for pixels



  //loadSceneFile("assets/SphereTest.json");
  //loadSceneFile("assets/TriangleShadingTest.json");
  //loadSceneFile("assets/SphereShadingTest1.json");
  //loadSceneFile("assets/SphereShadingTest2.json");
  //loadSceneFile("assets/ShadowTest1.json");
  loadSceneFile("assets/CornellBox.json");
}


var Camera = function(eye, at, up, fovy, aspect){
  this.eye      = new THREE.Vector3(eye[0], eye[1], eye[2]);
  this.at       = new THREE.Vector3(at[0], at[1], at[2]);
  this.up       = new THREE.Vector3(up[0], up[1], up[2]);

  //wVec points backwards from the camera
  this.wVec     = new THREE.Vector3().subVectors(this.eye, this.at).normalize();
  //uVec points to the side of the camera
  this.uVec     = new THREE.Vector3().crossVectors(this.up, this.wVec).normalize();
  //vVec points upwards local to the camera
  this.vVec     = new THREE.Vector3().crossVectors(this.wVec, this.uVec).normalize();

  this.fovy     = fovy;
  this.aspect   = aspect;

  //size of pixels in space, how many pixels to render

  this.halfCameraHeight  = Math.tan(rad(this.fovy/2.0)); 
  this.halfCameraWidth   = this.halfCameraHeight * this.aspect;

  this.cameraWidth =  2 * this.halfCameraWidth;
  this.cameraHeight = 2 * this.halfCameraHeight;


  //the size of individual pixels in 3d space, to position the points for
  //the rays to pass through
  //1 : one unit away from our eyes
  this.pixelHeight  = this.cameraHeight / (canvas.height - 1); 
  this.pixelWidth   = this.cameraWidth / (canvas.width - 1);
  //console.log(this.cameraWidth / this.pixelHeight + " " + this.cameraHeight / this.pixelHeight);
};

//prototype: define a method on camera object.
//compute parametric line from eye point to pixel point
Camera.prototype.castRay  = function(x, y){
  var u = (x * this.pixelWidth) - this.halfCameraWidth; //distance length of u
  var v = this.halfCameraHeight - (y * this.pixelHeight);

  //the u (side) component to the pixel
  var uComp = this.uVec.clone().multiplyScalar(u);
  //the v (up) component to the pixel
  var vComp = this.vVec.clone().multiplyScalar(v);
  var vSum1 = new THREE.Vector3().addVectors(uComp, vComp);

  //ray.direction
  var ray = {
    "origin"    : this.eye,
    "direction" : new THREE.Vector3().addVectors(vSum1,
                  this.wVec.clone().multiplyScalar(-1))
  };

  color = trace(ray);

  setPixel(x, y, color);
};

//like abstract class
var Surface = function(mat, objname, transforms){
  /*
      "name" : "Mirror Sphere",
      "ka" : [1,1,1],
      "kd" : [0,0,0],
      "ks" : [0,0,0],
      "shininess" : 0,
      "kr" : [0.9,0.9,0.9]
  */
  this.materialName = mat.name;
  this.ka = new THREE.Vector3(mat.ka[0], mat.ka[1], mat.ka[2]);
  this.kd = new THREE.Vector3(mat.kd[0], mat.kd[1], mat.kd[2]);
  this.ks = new THREE.Vector3(mat.ks[0], mat.ks[1], mat.ks[2]);
  this.shininess = mat.shininess;
  if (mat.kr != null) {
    this.kr = new THREE.Vector3(mat.kr[0], mat.kr[1], mat.kr[2]);
  }
  

  this.objname = objname;
  this.transforms = transforms;
};


var Sphere = function(mat, center, radius, objname, transforms){
  Surface.call(this, mat, objname, transforms); //like subclass, constructor
  this.center = new THREE.Vector3(center[0], center[1], center[2]);
  this.radius = radius;
};

//return intersection points
Sphere.prototype.intersects = function(ray){
  //redBall eye

  var d = new THREE.Vector3();
  var e = new THREE.Vector3();
  var result1 = new THREE.Vector3();
  var intersection = new THREE.Vector3();
  //var result2 = new THREE.Vector3();

 // d = d.subVectors(greenBall.position, redBall.position).normalize();
  d = ray.direction.normalize();
 // e = e.subVectors(sphere.position, redBall.position);
  e = e.subVectors(this.center, ray.origin);

  var a = e.clone().dot(d);

  var radius = this.radius;

  var fSquare = radius * radius - e.length() * e.length() + a * a;

  var f = Math.sqrt(fSquare);

  var t =  a - f;

  //var t2 = a + f;
  //console.log(t);

  result1 = d.clone().multiplyScalar(t);
  //result2 = d.clone().multiplyScalar(t2);

  if (fSquare > 0){
    intersection = ray.origin.clone().add(result1);
  } else {
    intersection = null;
  }

  return intersection;
};

Sphere.prototype.normal = function(intersection, ray){
  var normal = new THREE.Vector3();
  //normal = normal.subVectors(this.center, intersection).normalize();
  normal = normal.subVectors(intersection, this.center).normalize();
  return normal;
}

//need method return normals

var Triangle = function(mat, p1, p2, p3, objname, transforms){
  Surface.call(this, mat, objname, transforms);
  this.p1 = new THREE.Vector3(p1[0], p1[1], p1[2]);
  this.p2 = new THREE.Vector3(p2[0], p2[1], p2[2]);
  this.p3 = new THREE.Vector3(p3[0], p3[1], p3[2]);

};

Triangle.prototype.normal = function(intersection, ray){
  var normal = new THREE.Vector3();
  var p1p3 = new THREE.Vector3();
  p1p3.subVectors(this.p1, this.p3);
  var p2p3 = new THREE.Vector3();
  p2p3.subVectors(this.p2, this.p3);

  //normal = p1p2.clone().cross(p1p3).normalize();
  normal = p1p3.clone().cross(p2p3).normalize();
  // if (normal.dot(ray.direction) > 0 ) {
  //   normal = normal.multiplyScalar(-1);
  // }
  return normal;
}

Triangle.prototype.intersects = function(ray){
  var intersection = new THREE.Vector3();
  //calculate intersection
  var normal = this.normal(intersection, ray);


  var inverseNormal = normal.clone().multiplyScalar(-1);
  

  var pointInPlane = this.p1;

  var vectorN = new THREE.Vector3();

  vectorN.subVectors(pointInPlane, ray.origin);

  var d = vectorN.clone().dot(inverseNormal);

  var line = new THREE.Vector3();

  line = ray.direction.clone().normalize();

  var tScalar = d / (line.clone().dot(inverseNormal));
  var tPosition = line.multiplyScalar(tScalar);

  intersection = ray.origin.clone().add(tPosition);

  //determine intersection on Triangle
  var e1 = new THREE.Vector3();
  var e2 = new THREE.Vector3();
  var e3 = new THREE.Vector3();
  var d1 = new THREE.Vector3();
  var d2 = new THREE.Vector3();
  var d3 = new THREE.Vector3();
  var n = new THREE.Vector3();
  var n2 = new THREE.Vector3();

  e1 = e1.subVectors(this.p3, this.p2);
  e2 = e2.subVectors(this.p1, this.p3);
  e3 = e3.subVectors(this.p2, this.p1);

  d1 = d1.subVectors(intersection, this.p1);
  d2 = d2.subVectors(intersection, this.p2);
  d3 = d3.subVectors(intersection, this.p3);


  var AT = e1.clone().cross(e2).dot(normal) / 2;
  var AT1 = e1.clone().cross(d3).dot(normal) / 2;
  var AT2 = e2.clone().cross(d1).dot(normal) / 2;
  var AT3 = e3.clone().cross(d2).dot(normal) / 2;



  if (AT1 < 0 || AT2 < 0 || AT3 < 0) {
    intersection = null;
  }


  return intersection;
};


//loads and "parses" the scene file at the given path
function loadSceneFile(filepath) {
  scene = Utils.loadJSON(filepath); //load the scene

  //TODO - set up camera (check slides, may use three.js function from array, toArray.etc to convert array to vectors)
  //eye, at, up, fovy, aspect
  camera = new Camera(scene.camera.eye, scene.camera.at, scene.camera.up, scene.camera.fovy, scene.camera.aspect);
 
  // lights = [];

  // for (var i = 0; i < scene.lights.length; i++){
  //   var theLight = scene.lights[i];
  //   if (theLight.source == "Ambient") {
  //     lights.push(new Light(theLight.source, theLight.color))
  //   } else {
  //     lights.push(new Light(theLight.source, theLight.color, theLight.position))
  //   }
    
  // }



  //console.log(camera);

  //TODO - set up surfaces
  surfaces = [];

  var length = scene.surfaces.length;
  for (var i = 0; i < length; i++) {
    var surf = scene.surfaces[i];
    var shape = surf.shape;
    var material = scene.materials[surf.material];

    if (shape == "Sphere") {

      /*
      "shape" : "Sphere",
      "center" : [0,0,-3],
      "radius" : 1,
      "material" : 0 */
      //mat, center, radius, objname, transforms
      var sphere = new Sphere(material, surf.center, surf.radius, surf.name);
      
      surfaces.push(sphere);
    } else if (shape == "Triangle") {
      /*
      "name" : "Floor",
      "shape" : "Triangle",
      "p1" : [10, -10, 10],
      "p2" : [10, -10, -10],
      "p3" : [-10, -10, 10],
      "material" : 0
      */
      //mat, p1, p2, p3, objname, transforms
      var triangle = new Triangle(material, surf.p1, surf.p2, surf.p3, surf.name);
   
      surfaces.push(triangle);
    }
  }

  render(); //render the scene
}
 
//renders the scene
//call only onece
function render() {
  var start = Date.now(); //for logging

  //TODO - fire a ray , loop though each pixel
  for (var i = 0; i < camera.cameraWidth / camera.pixelWidth; i++){
    for (var j = 0; j < camera.cameraHeight / camera.pixelHeight; j++){
      camera.castRay(i, j);
    }
  }

  // for (var i = 200; i < 210; i++){
  //   for (var j = 200; j < 210; j++){
  //     camera.castRay(i, j);
  //   }
  // }

  //TODO - calculate the intersection of that ray with the scene

  //TODO - set the pixel to be the color of that intersection (using setPixel() method)

  //render the pixels that have been set
  context.putImageData(imageBuffer,0,0);

  var end = Date.now(); //for logging
  $('#log').html("rendered in: "+(end-start)+"ms");
  console.log("rendered in: "+(end-start)+"ms");
}

function trace(ray) {
   var nearest = null;
   var minlength = 100000000;
   var currentSurface;
  var color;
  for(var i = 0; i < surfaces.length; i++){
    var intersection = surfaces[i].intersects(ray);
    if (intersection != null) {
      var vector = new THREE.Vector3();
      vector = vector.subVectors(intersection, ray.origin);
      var length = vector.length();
      if (length < minlength) {
        minlength = length;
        nearest = intersection;
        currentSurface = surfaces[i];
      }  
    }
  }

  if (nearest == null) {
    color = [0, 0, 0];
  } else {
    //color = [1, 1, 1];

    color = calculateShading(nearest, currentSurface, ray);

    

  }
  //console.log(surfaces[0].intersects(ray));
  //console.log(surfaces[0].normal);
  return color;
}


function calculateShading(intersection, surface, ray) {
  var color = [];
  var inShadow = false;

  var rayToLight;

  var ls;
  var la;
  var ld;

  var positionLightpos;
  var ambientLightColor;
  var positionLightColor;

  var N = new THREE.Vector3();
  var Lneg = new THREE.Vector3();
  var L = new THREE.Vector3();
  var R = new THREE.Vector3();

  N = surface.normal(intersection, ray);

  if (surface.objname == "Ceiling") {
      N.multiplyScalar(-1);
      if (DEBUG) {
        console.log("ceiling");
      }
    
  }

  var lightLength = scene.lights.length;
  for (var i = 0; i < lightLength; i++) {
    var light = scene.lights[i];
    var lightName = scene.lights[i].source;
    if (lightName == "Ambient") {
      ambientLightColor = new THREE.Vector3(light.color[0], light.color[1], light.color[2]);

      la = ambientLightColor;


    } else if (lightName == "Point") {
      positionLightpos = new THREE.Vector3(light.position[0], light.position[1], light.position[2]);
      positionLightColor = new THREE.Vector3(light.color[0], light.color[1], light.color[2]);

      //L = L.subVectors(positionLightpos, intersection);
      Lneg = Lneg.subVectors(positionLightpos, intersection);

      var length = Lneg.length();

      R = R.subVectors(N.clone().multiplyScalar(N.clone().dot(Lneg) * 2), Lneg);
  
      R = R.clone().normalize().multiplyScalar(length);

      var V = new THREE.Vector3();

      V = V.subVectors(ray.origin, intersection).normalize();

      var specValue;


      if (R.angleTo(N) > (90 * Math.PI / 180)) {
        specValue = 0;
      } else {
        specValue = Math.pow(R.normalize().clone().dot(V), surface.shininess);
      }

      if(DEBUG){
        console.log("normal" + N.x + " " + N.y + " " + N.z);
        console.log("specValue" + specValue);
      }

      ls = positionLightColor.clone().multiplyScalar(specValue);

      var difValue = Lneg.clone().normalize().dot(N.clone().normalize());
      if(DEBUG){
        console.log("difValue" + difValue);
      }
      

      if (difValue < 0) {
        difValue = 0;
      }

      ld = positionLightColor.clone().multiplyScalar(difValue);

      //calculate shadow:
      rayToLight = {
        "origin"    : positionLightpos,
        "direction" : Lneg.clone().multiplyScalar(-1)
      };






    } else if (lightName == "Directional") {
      var directionalLightdirect = new THREE.Vector3(-light.direction[0], -light.direction[1], -light.direction[2]);
      var directionalLightColor = new THREE.Vector3(light.color[0], light.color[1], light.color[2]);


      Lneg = directionalLightdirect;

      var length = Lneg.length();

      R = R.subVectors(N.clone().multiplyScalar(N.clone().dot(Lneg) * 2), Lneg);
  
      R = R.clone().normalize().multiplyScalar(length);

      var V = new THREE.Vector3();

      V = V.subVectors(ray.origin, intersection).normalize();

      var specValue;

      if (R.angleTo(N) > (90 * Math.PI / 180)) {
        specValue = 0;
      } else {
        specValue = Math.pow(R.normalize().clone().dot(V), surface.shininess);
      }

      ls = directionalLightColor.clone().multiplyScalar(specValue);

      var difValue = Lneg.clone().normalize().dot(N.normalize());

      if (difValue < 0) {
        difValue = 0;
      }

      ld = directionalLightColor.clone().multiplyScalar(difValue);



      //calculate shadow
      // rayToLight = {
      //   "origin"    : intersection,
      //   "direction" : Lneg.clone().multiplyScalar(-1);
      // };
    }
  }

  if (la != null) {

    //color = ls.clone().multiply(surface.ks);

    color[0] = la.x * surface.ka.x;
    color[1] = la.y * surface.ka.y;
    color[2] = la.z * surface.ka.z;

  }
 

  //calculate in shadow?: 
  var nearInterLength = 100000000;
  for(var i = 0; i < surfaces.length; i++){
    //&& surfaces[i].objname.includes("Sphere")
    if (surfaces[i] != surface && surfaces[i].objname.includes("Sphere")) {
      var shadowIntersection = surfaces[i].intersects(rayToLight);
      if (shadowIntersection != null) {
        var v = new THREE.Vector3();
        v = v.subVectors(shadowIntersection, rayToLight.origin);
        var l = v.length();
        if (l < nearInterLength) {
          nearInterLength = l;
        }
      }
      
    }
  }

  var lightToPixel = new THREE.Vector3();
  lightToPixel = lightToPixel.subVectors(intersection, rayToLight.origin);


  if (nearInterLength >= lightToPixel.length()){

    color[0] += ls.x * surface.ks.x + ld.x * surface.kd.x;
    color[1] += ls.y * surface.ks.y + ld.y * surface.kd.y;
    color[2] += ls.z * surface.ks.z + ld.z * surface.kd.z;  
        if (DEBUG) {
    console.log("nearest" + nearInterLength);
    console.log("LtoP" + lightToPixel.length());
    }
  } else {
    if (DEBUG) {
    console.log("nearest" + nearInterLength);
    console.log("LtoP" + lightToPixel.length());
    }
  }







  if (DEBUG) {
        console.log("color: " + color);
        console.log("la: " + la.x + " " + la.y + " " + la.z + " | ld: " + ld.x + " " + ld.y + " " + ld.z  + " | ls: "+ ls.x + " " + ls.y + " " + ls.z );
   }

  return color;
}


//sets the pixel at the given x,y to the given color
/**
 * Sets the pixel at the given screen coordinates to the given color
 * @param {int} x     The x-coordinate of the pixel
 * @param {int} y     The y-coordinate of the pixel
 * @param {float[3]} color A length-3 array (or a vec3) representing the color. Color values should floating point values between 0 and 1
 */
function setPixel(x, y, color){
  var i = (y*imageBuffer.width + x)*4;
  imageBuffer.data[i] = (color[0]*255) | 0;
  imageBuffer.data[i+1] = (color[1]*255) | 0;
  imageBuffer.data[i+2] = (color[2]*255) | 0;
  imageBuffer.data[i+3] = 255; //(color[3]*255) | 0; //switch to include transparency
}

//converts degrees to radians
function rad(degrees){
  return degrees*Math.PI/180;
}

//on document load, run the application
$(document).ready(function(){
  init();
  render();

  //load and render new scene
  $('#load_scene_button').click(function(){
    var filepath = 'assets/'+$('#scene_file_input').val()+'.json';
    loadSceneFile(filepath);
  });

  //debugging - cast a ray through the clicked pixel with DEBUG messaging on
  $('#canvas').click(function(e){
    var x = e.pageX - $('#canvas').offset().left;
    var y = e.pageY - $('#canvas').offset().top;
    DEBUG = true;
    camera.castRay(x,y); //cast a ray through the point
    DEBUG = false;
  });
});
