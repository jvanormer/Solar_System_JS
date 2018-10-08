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

var scene, camera, renderer, earth, moon, earthMoonGroup, speedMultiplier, controls, objects, currind, earthPivots, planets;

function recursePlanets(planet){    
    var pivotGroup;
    var sphere = new THREE.SphereGeometry(1, 32, 32);   
    var texture = THREE.ImageUtils.loadTexture(planet.texture);
    var material = new THREE.MeshBasicMaterial({ map: texture });
    planetMesh = new THREE.Mesh(sphere, material);    
    
    if (planet.children.length > 0){
        pivotGroup = new THREE.Group();
    }

    console.log(planet);
    for (var i = 0; i < planet.children.length; i++){
        planet.children[i].parent = planet;
        recursePlanets(planet.children[i]);
    }
    
    return;
}

function generatePlanets(){
    var temp = {
        name: "Sun",
        radius: 3,
        rotationPeriod: 1,
        distanceFromParent: 0,
        yearLength: 0,
        texture: "textures/sun-map.jpg",
        children: [
            {
                name: "Earth",
                radius: 2,
                rotationPeriod: .05,
                distanceFromParent: 5,
                yearLength: 365.2,
                texture: "textures/EARTH-map.jpg",
                children: [
                    {
                        name: "Moon",
                        radius: 1,
                        rotationPeriod: .5,
                        distanceFromParent: 2,
                        yearLength: 27.3,
                        texture: "textures/MOON-map.jpg",
                        children: []
                    }
                ]
            },
            {
                name: "Mars",
                radius: 4,
                rotationPeriod: 1,
                distanceFromParent: 15,
                yearLength: 687,
                texture: "textures/MARS-map.jpg",
                children: []
            }
        ]
    }   
    recursePlanets(temp); 


}

function init(){
    generatePlanets();
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


    var sphere = new THREE.SphereGeometry(1, 32, 32);    

    //Planetary ring
    //var ringGeometry = new THREE.RingGeometry(1, 1.01, 64, 64);
    //ringGeometry.rotateX(Math.PI / 2); //Put it on the same plane
    //var ringMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })

    
    var moonTexture = THREE.ImageUtils.loadTexture("textures/moon-map.jpg");
    var moonMaterial = new THREE.MeshBasicMaterial({ map: moonTexture });
    moon = new THREE.Mesh(sphere, moonMaterial);    
    
    
    var earthTexture = THREE.ImageUtils.loadTexture("textures/earth-map.jpg");
    var earthMaterial = new THREE.MeshBasicMaterial({ map: earthTexture });
    earth = new THREE.Mesh(sphere, earthMaterial);        
    

    var sunTexture = THREE.ImageUtils.loadTexture("textures/sun-map.jpg");
    var sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
    sun = new THREE.Mesh(sphere, sunMaterial);  
    
    earthPivot = new THREE.Group();
    earthPivot.add(earth, moon);

    sunPivot = new THREE.Group();
    sunPivot.add(earthPivot);    
    sunPivot.add(sun);
    
    earthPivot.translateX(8);

    moon.translateX(3);
      
    scene.add(sunPivot);
    


}


function animate() {
    
    date = Date.now() * .01;

    sun.rotateY(1);

    earthPivot.position.set(Math.cos(date * .01) * 5, 0, Math.sin(date * .01) * 5)
    //earth.
    earth.rotateY(1)
    
    moon.position.set(Math.cos(date) * 3, 0, Math.sin(date) * 3)
    
    //Get frame    
    requestAnimationFrame(animate);

    //Render
    renderer.render(scene, camera);
}

init();
animate();