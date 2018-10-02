const DISTANCESCALE = Math.pow(10, -6);
const SIZESCALE = Math.pow(10, -5);

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
    M.toast({ html: this.planetInfo.name });    
}

function makeMesh(planetInfo){
    //console.log(planetInfo);
    sphereGeom = new THREE.SphereGeometry(1, 32, 32);
    planetTexture = THREE.ImageUtils.loadTexture(planetInfo.texture);
    planetMaterial = new THREE.MeshBasicMaterial( {map: planetTexture} );
    planet = new THREE.Mesh(sphereGeom.clone(), planetMaterial);

    planet.scale.x = planetInfo.radius * SIZESCALE;
    planet.scale.y = planetInfo.radius * SIZESCALE;
    planet.scale.z = planetInfo.radius * SIZESCALE;

    if (planetInfo.parent != null){
        planet.position.x = (planetInfo.parent.mesh.position.x + planetInfo.distanceFromParent) * DISTANCESCALE;
    }

    planet.callback = detailsHandler;
    planet.planetInfo = planetInfo;
    planetInfo.mesh = planet;

    objects.push(planet);
    scene.add(planet);
}

function recurseJson(json){
    
    
    makeMesh(json);
    console.log(json.children);
    if (json.children.length == 0){
        return;
    }
    else{
        for (i = 0; i < json.children.length; i++){
            json.children[i].parent = json;
            makeMesh(json.children[i]);
        }
    }
}

function addAstralBodies(){
    $.getJSON("planets.json", function(json){
        recurseJson(json);
    });
}

//Set global variabless
var scene, camera, renderer, earth, moon, earthMoonGroup, speedMultiplier, controls, objects, currind;
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
//2pi, but shorter
const TAU = (2 * Math.PI);

function focusOnMesh(mesh){
    mesh.callback();
    //Change controls to center on that object
    controls.objectToFollow = mesh;
    controls.target = controls.objectToFollow.position;
}

//Initialize
function init() {
    //Stores all of the meshes conveniently
    objects = [];
    currind = 0;

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
        //z --> Towards sun
        if (event.keyCode == 122 && currind != 0){
            currind--;
            focusOnMesh(objects[currind]);
        }
        //x --> Away from sun
        else if (event.keyCode == 120 && currind != objects.length - 1){
            currind++;
            focusOnMesh(objects[currind]);
        }
        //Num - Speed Modifier
        else{
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
            if (speedMessage != ""){
                M.Toast.dismissAll();
                M.toast({html: speedMessage});
            }
        }    
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
    camera.position.z = 1000000 * SIZESCALE;
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
    //moon.position.x = -Math.cos(date * speedMultiplier) * (earth.position.x + /*moon.details.distanceFromParent*/  /* 15 */ 60 );
    //moon.position.z = Math.sin(date * speedMultiplier) * (earth.position.x + /*moon.details.distanceFromParent*/  /* 15 */ 60 );

    //Rotate Earth
    //Set rotation to the percentage of 2pi corresponding to the amount of date completed times the speed multiplier
    //earth.rotation.y = date * TAU * speedMultiplier;
    //moon.rotation.y = date * TAU * speedMultiplier * moon.details.rotationRate;

    //Render
    renderer.render(scene, camera);
}
init();
animate();
