const SIZESCALE = 0.0001;
const DISTANCESCALE = 0.000001;

var scene, camera, renderer, earth, moon, earthMoonGroup, speedMultiplier, controls, objects, currind, earthPivots, planets, groups;
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

function recursePlanets(details){              
    //The sun is too damn big  
    if (details.name == "Sun"){
        details.radius /= 4;
    }    
    
    //Make subsystem for body
    var pivotGroup = pivotGroup = new THREE.Group();
    //Make body
    var mesh = makePlanet(details);    
    //Add body to it's own subsystem
    pivotGroup.add(mesh);    

    if (details.type == "planet" || details.type == "star"){
        planets.push(mesh);
    }

    //Assign the group in the object itself for accessibility
    details.group = pivotGroup;

    if (!details.parentGroup){
        scene.add(pivotGroup);
    }
    else{
        //If the subsystem has a parent group to belong to, put the subsystem into that group
        //ex. EarthSystem --> SunSystem
        details.parentGroup.add(pivotGroup)
        pivotGroup.translateX(details.distanceFromParent * DISTANCESCALE);
    }            

    //For each child of this body
    for (var i = 0; i < details.children.length; i++){
        //Assign a parent group, since the child must be in this system as well
        details.children[i].parentGroup = pivotGroup;
        //Assign the parent in the Object itself for convenience
        details.children[i].parent = details;
        //Add a ring to for the child
        scene.add(makeRing(details.children[i]));
        //Run through this again
        recursePlanets(details.children[i]);
    }        
}

//Makes a planet based on its details and returns the mesh
function makePlanet(details){
    var sphere = new THREE.SphereGeometry(1, 32, 32);    
    var planetTexture = THREE.ImageUtils.loadTexture(details.texture);
    var planetMaterial = new THREE.MeshBasicMaterial({ map: planetTexture });
    planet = new THREE.Mesh(sphere, planetMaterial);
    var rad = details.radius * SIZESCALE;
    var dist = details.distanceFromParent * DISTANCESCALE;
    console.log(details.name + " - Radius: " + rad + " - Distance: " + dist);
    
    planet.scale.set(rad, rad, rad);
    //planet.translateX(dist);

    details.mesh = planet;
    return planet;
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

    //Grab planet information from JSON
    $.getJSON("/planets.json", function(data){        
        recursePlanets(data);
    });        

    //Make bodies
    //moon = makePlanet({texture: "textures/moon-map.jpg"});
    //earth = makePlanet({texture: "textures/earth-map.jpg"});
    //sun = makePlanet({texture: "textures/sun-map.jpg"});

    //Dummy group defining earth-moon system
    //earthPivot = new THREE.Group();
    //earthPivot.add(earth, moon);

    //Dummy group defining sun-planet system
    //sunPivot = new THREE.Group();
    //sunPivot.add(earthPivot);    
    //sunPivot.add(sun);
    
    //Move earth-moon system away from center (sun)
    //earthPivot.translateX(8);

    //Move moon away from center of earth-moon system (earth)
    //moon.translateX(3);
      
    //Put the Solar System in the scene
    //scene.add(sunPivot);
}

//What to do every frame
function animate() {
    date = Date.now() * .01;

    //sun.rotateY(1);

    //cos(date * rate) * distance, 0, sin(date * rate) * distance
    //earthPivot.position.set(Math.cos(date * .01) * 5, 0, Math.sin(date * .01) * 5)

    //earth.rotateY(1)
    
    //moon.position.set(Math.cos(date) * 3, 0, Math.sin(date) * 3)
    
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