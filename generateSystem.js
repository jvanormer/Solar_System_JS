/*
    Name                    --> Markov Chain - //http://max.marrone.nyc/Markov-Word-Generator/              --> DONE
    Type                    --> Determined by parent                                                        --> DONE
    Radius                  --> Determined by parent                                                        --> DONE
    RotationPeriod          --> Random within the real-world range                                          --> DONE
    DistanceFromParent      --> ? (Probably just do random in-range and delete smaller colliding planet)    --> DONE
    YearLength              --> Orbital Period Function                                                     --> DONE
    Texture                 --> TextGen JS - https://github.com/mrdoob/texgen.js                            --> DONE
    Children                --> Recursion                                                                   --> DONE
*/

var scene, camera, renderer, controls, system;                              //Global variables
var objects = [];                                                           //Holds all selectable meshes
var raycaster = new THREE.Raycaster();                                      //Takes snapshots of what the mouse is hovering over
var mouse = new THREE.Vector2();                                            //Tracks mouse location
var speedMultiplier = 1440;                                                 //Tracks how fast the universe goes
var currentIndex = 0;                                                       //Tracks which object is currently selected
var loadTime;
var lowResInput = false;
var planetCountInput = 9;

const ORIGIN = new THREE.Vector3();
const TAU = 2 * Math.PI;                                                    //I don't want to type "2 * Math.PI" all the time
const G = 9.8;                                                              //Gravity (For revolution)

const SIZESCALE = 0.0001;                                                   //Arbitrary values to make a sensical size
const DISTANCESCALE = 0.001;                                                //Arbitrary values to make a sensical size

function gen(childCount, radius, distanceFromParent, parent){
    var SPHERE = new THREE.SphereGeometry(1, 256, 256);                     //Template of a sphere to be used in mesh creation    

    var MINDAY = 0.41250000000000003;                                       //Jupiter has a .4125 day long day
    var MAXDAY = 243.02083333333334;                                        //Venus has a 243 day long day

    var color = {r: 0, g: 0, b: 0};                                         //Colors for the texture    
   
    var distanceMod = 1;

    var pnt = {
        name: generateName(),                                               //Makes name from a Markov chain word generator
        type: null,                                                         //Deterimined Later
        radius: radius,                                                     //Sets the radius based on input (recursion will make this relative)
        rotationPeriod: 1 / randRange(MINDAY, MAXDAY),                      //It's actually 1 / period in Earth days, describes rotation rate
        distanceFromParent: distanceFromParent + radius,                    //Sets how far away this sits from parent
        yearLength: 0,                                                      //It's actually 1 / length in Earth days, describes revolution rate
        pivot: new THREE.Group(),                                           //Create empty pivot for this planet/sun system     
        mesh: null,                                                         //Where the planet itself is stored
        ring: null,
        parent: parent,
        maxWidth: radius,
        children: [],                                                       //Where the orbiting systems are stored
    };    

    //Decide planet type based on parental status
    if (parent == null){
        pnt.type = "Sun";                                                   //Define body type
        pnt.radius = 695500 * SIZESCALE;                                    //The sun gets a special radius: one proportionate to our sun
        pnt.distanceFromParent = 0;                                         //Suns don't have a parent
        pnt.yearLength = 0;                                                 //Suns don't revolve around anything
        color = {r: 1, g: 1, b: 0}                                          //Suns are yellow        
    }
    else if(parent.type == "Sun"){
        pnt.type = "Planet";                                                //Define body type
        parent.pivot.add(pnt.pivot);                                        //Add this system to the parent system
        pnt.distanceFromParent += parent.radius;                            //Account for parent's radius
        pnt.pivot.translateX(pnt.distanceFromParent);                       //Move this pivot away from parent (account for parent and own radius)
        color = {r: Math.random(), g: Math.random(), b: Math.random()};     //Planets can be any color, really        
        pnt.yearLength = 1 / (TAU * Math.sqrt(Math.pow(pnt.distanceFromParent, 3) / (G * parent.radius)));    //Orbital Period Function
    }
    else if(parent.type == "Planet"){
        pnt.type = "Moon";                                                  //Define body type
        childCount = 0;                                                     //Moons don't get to have moons
        parent.pivot.add(pnt.pivot);                                        //Add this system to the parent system
        pnt.distanceFromParent += parent.radius;                            //Account for parent's radius
        pnt.pivot.translateX(pnt.distanceFromParent);                       //Move this pivot away from parent
        var mooncolor = Math.random();                                      //Moons are grey, so rgb is one color
        color = {r: mooncolor, g: mooncolor, b: mooncolor};         
        pnt.yearLength = 1 / (TAU * Math.sqrt(Math.pow(pnt.distanceFromParent, 3) / (G * parent.radius)));    //Orbital Period Function
        distanceMod = .5;
    }    

    var material = generateMaterial(color);
    pnt.mesh = new THREE.Mesh(SPHERE, material);                            //Apply the material and sphere to a mesh                                                       
    pnt.mesh.name = pnt.name;                                               //Name the body
    pnt.mesh.scale.set(pnt.radius, pnt.radius, pnt.radius);                 //Scale mesh    
    pnt.pivot.add(pnt.mesh);                                                //Add mesh to pivot    
    pnt.pivot.name = pnt.name + " System";                                  //Name the system    

    //Add planetary ring
    var ringGeometry = new THREE.RingGeometry(1, 1.001, 100, 100);
    ringGeometry.rotateX(Math.PI / 2);                                      //Put ring on the same plane as planets
    var ringMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    var ring = new THREE.Mesh(ringGeometry, ringMaterial);        
    ring.scale.set(pnt.distanceFromParent, pnt.distanceFromParent, pnt.distanceFromParent);
    ring.position.set(pnt.mesh.getWorldPosition(ORIGIN).x, pnt.mesh.getWorldPosition(ORIGIN).y, pnt.mesh.getWorldPosition(ORIGIN).z)
    
    if (parent != null){
        parent.pivot.add(ring);
        pnt.ring = ring;
    }
    
    //Now recurse with the children
    for (var i = 0; i < childCount; i++){
        var maxRadius = .1 * pnt.radius;                                    //Jupiter is roughly .1 the size of the sun (Thanks Wolfram)
        var minRadius = .0035 * pnt.radius;                                 //Mercury is .0035 the size of the Sun (Thanks Wolfram)
        var nextRadius = randRange(minRadius, maxRadius);                   //Radius is smaller than the parent by a certain ratio 
        var minDistance = 83.25 * pnt.radius * DISTANCESCALE;               //Mercury is 83.225 Sun Radius distances away from the sun
        var maxDistance = 6462.9 * pnt.radius * DISTANCESCALE;              //Neptune is 6462.9 Sun Radius distances away from the sun
        var nextDistance = Math.pow(randRange(minDistance, maxDistance), distanceMod);                      
        var nextChild = gen(Math.floor(Math.sqrt(childCount)), nextRadius, nextDistance, pnt);           //Recurse

        //Determine maximum width a planet system takes up
        if (pnt.maxWidth < pnt.radius + nextChild.distanceFromParent + nextChild.radius){
            pnt.maxWidth = pnt.radius + nextChild.distanceFromParent + nextChild.radius;
        }

        //Ensures moons can't be eaten by the sun
        if (nextChild.distanceFromParent <= nextChild.maxWidth){
            reject = true;
        }

        //Rejection Sampling
        var reject = false;
        for (var j = 0; !reject && j < pnt.children.length; j++){
            var distanceBetween = Math.abs(nextChild.distanceFromParent - pnt.children[j].distanceFromParent);
            if (distanceBetween <= pnt.children[j].maxWidth + nextChild.maxWidth){
                console.log(nextChild.name + " Rejected!");
                reject = true;
                nextChild.parent.pivot.remove(nextChild.ring);
                nextChild.parent.pivot.remove(nextChild.pivot);
                pnt.maxWidth = pnt.radius;                
                i--;
            }
        }
        if (!reject){
            console.log(nextChild.name + " Accepted!");
            pnt.children.push(nextChild);
        }

        //pnt.children.push(nextChild);
    }	

	return pnt;
}

//Compare function that orders bodies by distance from parent
function compareBodies(a, b){
    if (a.distanceFromParent < b.distanceFromParent){
        return -1;
    }
    else if (a.distanceFromParent > b.distanceFromParent){
        return 1;
    }
    else{
        return 0;
    }
}

//Fills the "objects" variable with planets
function populateObjects(system){
    objects.push(system.mesh);    
    for (var i = 0; i < system.children.length; i++){
        populateObjects(system.children[i]);
    }
}

//Sorts by distance from parent
function sortSystem(system){
    system.children.sort(compareBodies);
    for (var i = 0; i < system.children.length; i++){
        system.children[i].children.sort(compareBodies);
    }
    return system;        
}

//Simplifies generation usability
function makeSystem(planetCount){
    var system = gen(planetCount, 1, 0, null);
    system = sortSystem(system);        
    populateObjects(system);
    return system;
}

//Initializes base THREE JS stuff that basically won't be touched
function initThree(){    
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000000000);
    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    var bgTexture = THREE.ImageUtils.loadTexture("textures/stars-mw-map.jpg");
    scene.background = bgTexture;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    camera.position.z = 1000;
    document.body.appendChild(renderer.domElement);
    controls = new THREE.OrbitControls(camera); 
    controls.objectToFollow = new THREE.Object3D();
}

//Handles speed modification and toast message
function modifySpeed(multiplier){
    speedMultiplier = multiplier;
    speedMessage = "";
    switch (speedMultiplier){
        case 1440: 
            speedMessage = "Speed: 1 day per minute";
            break;
        case 1440 * 60:
            speedMessage = "Speed: 1 day per second";
            break;
        case 1440 * 60 * 365: 
            speedMessage = "Speed: 1 year per second";
            break;
    }
    if (speedMessage != ""){
        //Show materialize message
        M.Toast.dismissAll();
        M.toast({html: speedMessage});    
    }
}

//Searches the system tree passed for the mesh provided
function findDetails(mesh, sys){
    if (sys.mesh == mesh){
        return sys;
    }
    else{
        var result = null;
        for (var i = 0; result == null && i < sys.children.length; i++){
            result = findDetails(mesh, sys.children[i]);
        }
        return result;
    }
}

//Handles planet selection and toast message
function selectPlanet(mesh){
    if (mesh != null){
        var details = findDetails(mesh, system);        
        htmlString = "Name: " + details.name + "<br>" + "Type: " + details.type + "<br>" + "Satellites: " + details.children.length + "<br>" + "Rotation Duration (Days): " + (1 / details.rotationPeriod).toFixed(2) + "<br>" + "Revolution Duration (Days): " + (1 / details.yearLength).toFixed(2);
        //Run the object's function            
        M.Toast.dismissAll();           
        M.toast({displayLength: 10000, outDuration: 0, html: htmlString});    
        
        //Change controls to center on that object
        controls.objectToFollow = mesh;
        controls.target = controls.objectToFollow.getWorldPosition(ORIGIN);            
        controls.update();
    }
}

//Initializes JS/Browser events
function initEvents(){

    //Maintain Aspect Ratio
    window.onresize = function(){
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    //Handle MouseDown events    
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
            for (var i = 0; i < objects.length; i++){
                if (objects[i] == intersects[0].object){
                    currentIndex = i;
                }
            }         
            selectPlanet(objects[currentIndex]);
        }
    }

    //Handle KeyPress events
    window.onkeypress = function(event) {        
        var newSpeed = 0;            
        switch(event.keyCode){            
            case 49:    //1
            modifySpeed(1440);                        //1 Full Earth rotation every 1 minute --> (1440 = number of minutes in a day, 24 * 60)
                break;                        
            case 50:    //2
            modifySpeed(1440 * 60);                   //1 Full Earth rotation every 1 second --> (1440 * 60 = minutes to seconds in a year)
                break;                        
            case 51:    //3
                modifySpeed(1440 * 60 * 365);         //1 Full Earth revolution every 1 second --> = (1440 * 60 * 365 = 1 full earth revolution every 1/365 second, or 1 year per second)
                break;
            case 97:    //a
                //Go "left" (closer to the sun)
                if (currentIndex > 0){
                    currentIndex--;
                    selectPlanet(objects[currentIndex]);
                }
                break;
            case 100:   //b
                //Go "right" (further from the sun)
                if (currentIndex < objects.length - 1){
                    currentIndex++;
                    selectPlanet(objects[currentIndex]);
                }
                break;
        }                
    }
}

//Generates random float between two numbers
function randRange(a, b){    
    return Math.random() * (Math.max(a, b) - Math.min(a, b)) + Math.min(a, b);
}

//Use TexGen JS to generate a material to use with our planets
function generateMaterial(color){    
    var TEXRES = (lowResInput ? 4 : 512);
    var tgTexture = new TG.Texture(TEXRES, TEXRES);                     //Size of the texture radically increases loading time
    //var vFractal = new TG.VoronoiFractal();                           //VoronoiFractal Looks nice, but maybe look into randomizing the strategy
    var vFractal = new TG.VoronoiNoise();                               //VoronoiNoise loads faster
    vFractal.tint(color.r, color.g, color.b);                           //Set the color base
    
    //Add things here...
    //Look into weight, density, and octaves changing

    tgTexture.set(vFractal);                                            //Apply the fractal style to the texture    
    var texture = new THREE.Texture(tgTexture.toCanvas());
    texture.needsUpdate = true;
    var material = new THREE.MeshBasicMaterial({map: texture});         //Apply the texture to a material
    return material;
}

//Revolve a given body around its parent
function revolve(body){
    if (body.pivot == null){
        return;
    }
    else{
        var x = Math.cos(TAU * getDayCompletion() * body.yearLength * speedMultiplier) * body.distanceFromParent;
        var z = Math.sin(TAU * getDayCompletion() * body.yearLength * speedMultiplier) * body.distanceFromParent;
        body.pivot.position.set(x, 0, z);
        for (var i = 0; i < body.children.length; i++){
            revolve(body.children[i]);
        }
    }
}

//Rotate a body on its own y axis
function rotate(body){
    if (body.mesh == null){
        return;
    }
    else{
        body.mesh.rotation.y = getDayCompletion() * TAU * speedMultiplier * body.rotationPeriod;
        for (var i = 0; i < body.children.length; i++){
            rotate(body.children[i]);
        }
    }
}

//Use a markov chain to generate names for the planets
function generateName(){
    //Using Foswig JS
    var chain = new Foswig(3);
    //Dictionary is top 100 popular names
    var dictionary = ["MARY", "JAMES", "PATRICIA", "JOHN", "ELIZABETH", "ROBERT", "JENNIFER", "MICHAEL", "LINDA", "WILLIAM", "BARBARA", "DAVID", "MARGARET", "RICHARD", "SUSAN", "JOSEPH", "DOROTHY", "CHARLES", "SARAH", "THOMAS", "JESSICA", "CHRISTOPHER", "HELEN", "DANIEL", "NANCY", "MATTHEW", "BETTY", "GEORGE", "KAREN", "DONALD", "LISA", "PAUL", "SANDRA", "ANTHONY", "ANNA", "MARK", "DONNA", "EDWARD", "RUTH", "STEVEN", "CAROL", "KENNETH", "KIMBERLY", "ANDREW", "ASHLEY", "BRIAN", "MICHELLE", "KEVIN", "LAURA", "JOSHUA", "AMANDA", "RONALD", "MELISSA", "TIMOTHY", "EMILY", "JASON", "DEBORAH", "JEFFREY", "REBECCA", "FRANK", "STEPHANIE", "GARY", "SHARON", "ERIC", "KATHLEEN", "RYAN", "CYNTHIA", "STEPHEN", "SHIRLEY", "NICHOLAS", "AMY", "LARRY", "ANGELA", "JACOB", "CATHERINE", "SCOTT", "VIRGINIA", "JONATHAN", "KATHERINE", "RAYMOND", "BRENDA", "JUSTIN", "PAMELA", "BRANDON", "FRANCES", "GREGORY", "CHRISTINE", "SAMUEL", "NICOLE", "PATRICK", "JANET", "BENJAMIN", "CAROLYN", "JACK", "DEBRA", "WALTER", "MARTHA", "DENNIS", "RACHEL", "HENRY", "ALICE", "JERRY", "MARIE", "PETER", "HEATHER", "DOUGLAS", "SAMANTHA", "HAROLD", "MARIA", "ALEXANDER", "DIANE", "TYLER", "JOYCE", "ARTHUR", "JULIE", "AARON", "EVELYN", "JOSE", "EMMA", "ADAM", "JOAN", "CARL", "ROSE", "ZACHARY", "CHRISTINA", "ALBERT", "ANN", "NATHAN", "KELLY", "KYLE", "DORIS", "LAWRENCE", "JEAN", "JOE", "MILDRED", "WILLIE", "JUDITH", "GERALD", "KATHRYN", "ROGER", "LAUREN", "KEITH", "CHERYL", "TERRY", "GRACE", "HARRY", "VICTORIA", "JEREMY", "MEGAN", "RALPH", "JULIA", "ROY", "JACQUELINE", "SEAN", "TERESA", "JESSE", "ANDREA", "LOUIS", "GLORIA", "BILLY", "SARA", "BRUCE", "JANICE", "EUGENE", "THERESA", "AUSTIN", "LILLIAN", "BRYAN", "JUDY", "WAYNE", "BEVERLY", "RUSSELL", "HANNAH", "HOWARD", "DENISE", "CHRISTIAN", "MARILYN", "FRED", "JANE", "PHILIP", "AMBER", "ALAN", "DANIELLE", "RANDY", "BRITTANY", "JORDAN", "IRENE", "JUAN", "DIANA", "BOBBY", "ANNIE", "VINCENT", "LORI", "JOHNNY", "FLORENCE", "CLARENCE", "KATHY", "PHILLIP", "TAMMY", "ERNEST"];
    chain.addWordsToChain(dictionary);
    //Words of length 5 to 10
    result = chain.generateWord(5, 10, false);
    //Return it as a proper noun
    return result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
}

//Get ratio of day completed (epoch in days, just the decimal portion)
function getDayCompletion(){
    return (Date.now() / 1000 / 60 / 60 / 24) % 1;
}

//What to do every frame
function animate() {        
    rotate(system);
    revolve(system);
    requestAnimationFrame(animate);    //Get frame        
    renderer.render(scene, camera);    //Render
    controls.target = controls.objectToFollow.getWorldPosition(ORIGIN);
    controls.update();
}

//Do all initialization events
function init(){
    initThree();
    initEvents();
    starttime = Date.now();
    system = makeSystem(planetCountInput);                                                                         //Make a system (plugged with 5 children)
    controls.objectToFollow = system.mesh;                                                          //Link the camera to the Sun
    loadTime = (Date.now() - starttime) / 1000
    console.log(system.name + " System Generated in " + loadTime.toFixed(2) + " Seconds");       //Report load time
    scene.add(system.pivot);                                                                        //Add the system to the scene for rendering
    //camera.position.z = system.children[system.children.length - 1].distanceFromParent;             //Put the camera in a sensible place
}

function go(planetCount, lowRes){        
    planetCountInput = planetCount;
    lowResInput = lowRes;
    init();
    animate();
    M.toast({html: system.name + " System Generated in " + loadTime.toFixed(2) + " Seconds"});
    $('.modal').modal("close");                  
}