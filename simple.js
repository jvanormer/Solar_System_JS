//Make the solar system actually navigable
const SIZESCALE = 0.0001;
const DISTANCESCALE = 0.000001;

var scene, camera, renderer, sun, earth, moon, earthMoonGroup, speedMultiplier, controls, objects, currind, earthPivots, planets, groups;
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();


//Class defining planet details and utility functions
class PlanetDetails{    
    //Planet name, radius, distance from parent, texture file, and parent itself
    constructor(name, radius, distanceFromParent, texture, parent){
        this.name = name;
        this.radius = radius;
        this.distanceFromParent = distanceFromParent;
        this.texture = texture;        
    }

    //Returns a mesh as described by the constructor
    get mesh(){
        var sphere = new THREE.SphereGeometry(1, 32, 32);    
        var planetTexture = THREE.ImageUtils.loadTexture(this.texture);
        var planetMaterial = new THREE.MeshBasicMaterial({ map: planetTexture });
        var planet = new THREE.Mesh(sphere, planetMaterial);
        var rad = this.radius * SIZESCALE;
        var dist = this.distanceFromParent * DISTANCESCALE;        
        planet.scale.set(rad, rad, rad);        
        return planet;
    }     

    toString(){
        return "Details: " + this.name;
    }
}

//Makes a ring that shows a planet's path given the planet's details
function makeRing(details){
    //Planetary ring, not useful right now
    var ringGeometry = new THREE.RingGeometry(1, 1.001, 100, 100);
    ringGeometry.rotateX(Math.PI / 2); //Put it on the same plane as planets
    var ringMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    var ring = new THREE.Mesh(ringGeometry, ringMaterial);        

    var rad = details.distanceFromParent * DISTANCESCALE;
    ring.scale.set(rad, rad, rad);    
    ring.position.set(details.parent.pivot.position.x, details.parent.pivot.position.y, details.parent.pivot.position.z);
    return ring;
}

function init(){
    //Stores all of the meshes conveniently
    objects = [];
    planets = [];
    
    //1 Full earth rotation every 1 minute (1440 = number of minutes in a day)
    speedMultiplier = 1440;
    
    //Maintain Aspect Ratio
    window.onresize = function(){
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    //handle clicking
    window.onmousedown = function(event){        
        event.preventDefault();
        //Grab mouse positions
        mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
        mouse.y = - (event.clientY / renderer.domElement.clientHeight) * 2 + 1;
        
        //Take a snaphot of what's going on
        raycaster.setFromCamera(mouse, camera);

        //Grab the objects that were intersected
        var intersects = raycaster.intersectObjects(planets); 

        //If an object was intersected by the mouse
        if (intersects.length > 0) {                        
            //Run the object's function
            //intersects[0].object.callback();
            
            //Change controls to center on that object
            controls.objectToFollow = intersects[0].object;
            controls.target = controls.objectToFollow.position;
            controls.target.set(intersects[0].object.position.x, intersects[0].object.position.y, intersects[0].object.position.z);
            controls.update();
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
    controls = new THREE.OrbitControls(camera);
    
    //Give the controls a default object to latch onto
    controls.objectToFollow = new THREE.Object3D();        

    //Define details
    moonDetails = new PlanetDetails("Moon", 1737.5, 384000, "textures/moon-map.jpg");
    console.log(moonDetails.thing);
    earthDetails = new PlanetDetails("Earth", 6378, 149600000, "textures/earth-map.jpg");
    sunDetails = new PlanetDetails("Sun", 695500 / 4, 0, "textures/sun-map.jpg");            
    
    moon = moonDetails.mesh;
    earth = earthDetails.mesh;
    sun = sunDetails.mesh;

    //Dummy group defining earth-moon system
    earthPivot = new THREE.Group();
    earthPivot.add(earth, moon);

    //Dummy group defining sun-planet system
    sunPivot = new THREE.Group();
    sunPivot.add(earthPivot);    
    sunPivot.add(sun);
    
    //Move earth-moon system away from center (sun)
    earthPivot.translateX(50);

    //Move moon away from center of earth-moon system (earth)
    moon.translateX(10);
      
    //Put the Solar System in the scene
    scene.add(sunPivot);
}

//What to do every frame
function animate() {
    date = Date.now() * .01;

    sun.rotateY(Math.PI/128);

    //cos(date * rate) * distance, 0, sin(date * rate) * distance
    earthPivot.position.set(Math.cos(date * .001) * 50, 0, Math.sin(date * .001) * 50)

    earth.rotateY(.001)
    
    moon.position.set(Math.cos(date) * 10, 0, Math.sin(date) * 10)
    
    //Get frame    
    requestAnimationFrame(animate);

    //Update Mouse/Scroll controls
    //Update the control target based on the position of the object assigned to it
    //controls.target = controls.objectToFollow.position;
    controls.update();


    //Render
    renderer.render(scene, camera);
}

init();
animate();