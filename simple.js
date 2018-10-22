//Make the solar system actually navigable
const SIZESCALE = 0.0001;
const DISTANCESCALE = 0.000001;

//I don't want to type "2 * Math.PI" all the time
const tau = 2 * Math.PI;

var scene, camera, renderer, sun, earth, moon, earthPivot, speedMultiplier, controls, objects, currind, earthPivots, planets, groups;
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

//Get ratio of day completed (epoch in days, just the decimal portion)
function getDayCompletion(){
    return (Date.now() / 1000 / 60 / 60 / 24) % 1;
}

//Class defining planet details and utility functions
class PlanetDetails{    
    //Planet name, radius, distance from parent, texture file, and parent itself
    constructor(name, radius, distanceFromParent, rotationPeriod, yearLength, texture, parent){
        this.name = name;
        this.radius = radius;
        this.distanceFromParent = distanceFromParent;
        //1 over Time in earth days it takes to rotate
        this.rotationPeriod = rotationPeriod;
        //1 over Time it takes in days to orbit parent
        this.yearLength = 1 /yearLength;
        this.texture = texture;   
        this.parent = parent;     
    }

    //Returns a mesh as described by the constructor
    get mesh(){
        var sphere = new THREE.SphereGeometry(1, 32, 32);    
        var planetTexture = THREE.ImageUtils.loadTexture(this.texture);
        var planetMaterial = new THREE.MeshBasicMaterial({ map: planetTexture });
        var planet = new THREE.Mesh(sphere, planetMaterial);
        var rad = this.radius * SIZESCALE;         
        planet.scale.set(rad, rad, rad);        
        return planet;
    }      

    //Returns the new rotation the object should have considering the time
        //date * 2pi would be realtime
        //Date * 2pi * 24 is 24 times faster (1 day = 1 hour)
        //Date * 2pi * 24 * 60 (1 day = 1 minute)
        //Date * 2pi * 24 * 60 * 60 (1 day = 1 second)
        //1 rotation (2pi)    
    updateRotation(){
        return getDayCompletion() * tau * speedMultiplier * this.rotationPeriod;
    }

    //Returns the new position to which the object should be considering the time
        //cos(date * rate) * distance, 0, sin(date * rate) * distance    
    updateRevolution(){        
        return new THREE.Vector3(Math.cos(getDayCompletion() * this.yearLength * speedMultiplier) * this.distanceFromParent, 0, Math.sin(getDayCompletion() * this.yearLength * speedMultiplier) * this.distanceFromParent);
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
    
    //speedMultiplier = 1440; //1 Full earth rotation every 1 minute --> (1440 = number of minutes in a day, 24 * 60)
    //speedMultiplier = 1440 * 60; // 1 Full earth rotation every 1 second (365 seconds in a year)
    speedMultiplier = 1440 * 60 * 365; //1 full earth revolution every 1/365 second (1 y per second)
    
    //Maintain Aspect Ratio
    window.onresize = function(){
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
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

    //Define details
    //Note: Since the sun's rotation period is shown as "24 days", that means it makes a full rotation in that time, so I need to enter 1 / 24
    sunDetails = new PlanetDetails("Sun", 695500 / 4, 0, 1 /24, 0, "textures/sun-map.jpg");            
    //Real distances are in JSON file, but are too big to actually utilize
    earthDetails = new PlanetDetails("Earth", 6378, 50, 1 / 0.9958333333333332, 365.2, "textures/earth-map.jpg", sunDetails);
    moonDetails = new PlanetDetails("Moon", 1737.5, 10, 1 / 27.320833333333336, 27.3, "textures/moon-map.jpg", earthDetails);    
            
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
    earthPivot.translateX(earthDetails.distanceFromParent);

    //Move moon away from center of earth-moon system (earth)
    moon.translateX(moonDetails.distanceFromParent);
      
    //Put the Solar System in the scene
    scene.add(sunPivot);
}

//What to do every frame
function animate() {
    /// ROTATE 
    earth.rotation.y = earthDetails.updateRotation();    
    sun.rotation.y = sunDetails.updateRotation();    
    moon.rotation.y = moonDetails.updateRotation();

    // REVOLVE    
    earthPivot.position.set(earthDetails.updateRevolution().x, earthDetails.updateRevolution().y, earthDetails.updateRevolution().z);    
    moon.position.set(moonDetails.updateRevolution().x, moonDetails.updateRevolution().y, moonDetails.updateRevolution().z);    

    //Get frame    
    requestAnimationFrame(animate);    

    //Render
    renderer.render(scene, camera);
}

init();
animate();