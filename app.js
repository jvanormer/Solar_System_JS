/*
NOTES FROM RICKS

Work *down* in code, right to left in math (vector times matrices)
3. rotate about earth as pivot
2. translate away from earth
1. moon rotate/scale about moons pivot

EXAMPLE:
5. Rotate earth about moon
4. Tranlsate moon and earth same distance away (from sun/origin)
3. Rotate earth (not moving yet)
2. Rotate moon about origin
1. Move moon 5 units away from earth (translate from origin)

Other notes:
mesh.scale.set(1, 1, 1);

*/


//Utility Functions
//Degrees to radians
function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

//Radians to degrees
function toDegrees(radians) {
    return radians * 180 / Math.PI;
}

//Hanlders for heaveanly bodies
//Dumps the details for the object
const detailsHandler = function(){
    M.Toast.dismissAll();
    M.toast({html: this.details.toHtmlString()});    
}

//Rescale mesh based on its modifier (relative to earth size)
function scaleShape(mesh){
    mesh.scale.x = mesh.scale.x * mesh.details.scaleModifier;
    mesh.scale.y = mesh.scale.y * mesh.details.scaleModifier;
    mesh.scale.z = mesh.scale.z * mesh.details.scaleModifier;
}

//Create details for an object
function Details(name, type, parent, distanceFromParent, rotationRate, scaleModifier){
    this.name = name;
    this.type = type;
    this.parent = parent;
    this.distanceFromParent = distanceFromParent;
    this.rotationRate = rotationRate;
    this.scaleModifier = scaleModifier;
    this.toHtmlString = function(){
        str = "";
        str += "Name: " + this.name + "<br>";
        str += "Type: " + this.type + "<br>";
        str += "Parent: ";
        this.parent ? str += this.parent.details.name : str += "None";
        str += "<br>";
        return str;
        //return "Name: " + this.name + "<br>Type: " + this.type;
    }
}

function addAstralBodies(){
    //Sphere Geometry 

    

    //Radius, widthsegments, heightsegments, phistart, philength, thetastart, thetalength
    var sphereGeom = new THREE.SphereGeometry(1, 32, 32);

    //Sun Looks
    var sunTexture = THREE.ImageUtils.loadTexture("textures/sun-map.jpg");
    var earthMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });

    //Configure Sun
    sun = new THREE.Mesh(sphereGeom.clone(), earthMaterial);
    sun.details = new Details("Sun", "star", null, 0, 1, 1391000);
    
    console.log(sun.geometry);

    //Earth looks
    var earthTexture = THREE.ImageUtils.loadTexture("textures/earth-map.jpg");
    var earthMaterial = new THREE.MeshBasicMaterial({ map: earthTexture });
    
    //Configure Earth
    earth = new THREE.Mesh(sphereGeom.clone(), earthMaterial);
    earth.rotation.z = toRadians(-23.5);
    //Distance in KM, rates are relative to earth (naturally meaning earth is 1)
    earth.details = new Details("Earth", "planet", null, 149600000, 1, 1);
    scaleShape(earth);
    earth.callback = detailsHandler;

    //Moon looks
    var moonTexture = THREE.ImageUtils.loadTexture("textures/moon-map.jpg");
    var moonMaterial = new THREE.MeshBasicMaterial({ map: moonTexture });

    //Configure Moon
    moon = new THREE.Mesh(sphereGeom.clone(), moonMaterial);
    moon.details = new Details("Moon", "moon", earth, 384400, 1/27, .27);
    scaleShape(moon);
    moon.callback = detailsHandler;

    earthMoonGroup = new THREE.Group();
    earthMoonGroup.add(earth);
    earthMoonGroup.add(moon);

    //Add earth and moon into their group so they can be moved as a pair
    scene.add(earthMoonGroup);
    objects.push(moon, earth);
}

//Set global variabless
var scene, camera, renderer, earth, moon, earthMoonGroup, speedMultiplier, controls, objects;
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
//2pi, but shorter
const TAU = (2 * Math.PI);

//Initialize
function init() {
    //Stores all of the meshes conveniently
    objects = [];

    //1 Full earth rotation every 1 minute (1440 = number of minutes in a day)
    speedMultiplier = 1440;
    
    //Maintain Aspect Ratio
    window.onresize = function() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    //Change the speed modifier with 1 and 2
    window.onkeypress = function(event) {
        var speedMessage = "";
        switch(event.keyCode){
            case 49: speedMultiplier = 1440;
            speedMessage = "Speed: 1 day per minute";
            break;
            case 50: speedMultiplier = 1440 * 60;
            speedMessage = "Speed: 1 day per second";
            break;
            case 51: speedMultiplier = 1440 * 60 * 365;
            speedMessage = "Speed: 1 year per second";
            break;
        }
        M.Toast.dismissAll();
        M.toast({html: speedMessage});    
    }

    //handle clicking
    window.onmousedown = function( event ) {
        event.preventDefault();
        //Grab mouse positions
        mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
        mouse.y = - (event.clientY / renderer.domElement.clientHeight) * 2 + 1;
        
        //Take a snaphot of what's going on
        raycaster.setFromCamera(mouse, camera);

        //Grab the objects that were intersected
        var intersects = raycaster.intersectObjects(objects); 

        //If an object was intersected by the mouse
        if (intersects.length > 0) {
            //Run the object's function
            intersects[0].object.callback();
            //Change controls to center on that object
            controls.objectToFollow = intersects[0].object;
            controls.target = controls.objectToFollow.position;
            //controls.target.set(intersects[0].object.position.x, intersects[0].object.position.y, intersects[0].object.position.z);
            //controls.update();
        }
    }

    //Required THREE.js stuff
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    var bgTexture = THREE.ImageUtils.loadTexture("textures/stars-mw-map.jpg")
    scene.background = bgTexture;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    camera.position.z = 25;
    document.body.appendChild(renderer.domElement);

    //Control Functions
    controls = new THREE.OrbitControls(camera);
    //Give the controls a default object to latch onto
    controls.objectToFollow = new THREE.Object3D();
    
    //Adds astral bodies to the scene
    addAstralBodies();
}

function animate() {
    //Get frame
    requestAnimationFrame(animate);
    
    //Update Mouse/Scroll controls
    //Update the control target based on the position of the object assigned to it
    controls.target = controls.objectToFollow.position;
    controls.update();

    //Move pair...
    //earthMoonGroup.position.x += .01;

    //Get ratio of day completed (epoch in days, just the decimal portion)
    date = (Date.now() / 1000 / 60 / 60 / 24) % 1;

    //Revolve Moon
    //Moon moves around Earth in the context of trig functions by date, with a radius of 15 units away from Earth
    moon.position.x = -Math.cos(date * speedMultiplier) * (earth.position.x + /*moon.details.distanceFromParent*/  /* 15 */ 60 );
    moon.position.z = Math.sin(date * speedMultiplier) * (earth.position.x + /*moon.details.distanceFromParent*/  /* 15 */ 60 );

    //Rotate Earth
    //Set rotation to the percentage of 2pi corresponding to the amount of date completed times the speed multiplier
    earth.rotation.y = date * TAU * speedMultiplier;
    moon.rotation.y = date * TAU * speedMultiplier * moon.details.rotationRate;

    //Render
    renderer.render(scene, camera);
}
init();
animate();
