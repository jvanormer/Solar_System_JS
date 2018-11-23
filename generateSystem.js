/*
    Name                    --> Markov Chain - //http://max.marrone.nyc/Markov-Word-Generator/              --> DONE
    Type                    --> Determined by parent                                                        --> DONE
    Radius                  --> Determined by parent                                                        --> DONE
    RotationPeriod          --> Random within the real-world range                                          --> DONE
    DistanceFromParent      --> ? (Probably just do random in-range and delete smaller colliding planet)    --> 
    YearLength              --> Random within the real-world range                                          --> DONE
    Texture                 --> TextGen JS - https://github.com/mrdoob/texgen.js                            --> DONE (Mostly)
    Children                --> Recursion                                                                   --> DONE
*/

//Global variables
var scene, camera, renderer, sun, earth, moon, controls;
var objects = [];
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var speedMultiplier = 1440;

function gen(childCount, radius, distanceFromParent, parent){
    var SPHERE = new THREE.SphereGeometry(1, 256, 256);                     //Template of a sphere to be used in mesh creation
    
    var MINYEAR = 88;                                                       //Mercury has an 88 day year
    var MAXYEAR = 59800;                                                    //Neptune has a 59800 day year

    const SIZESCALE = 0.0001;                                               //Arbitrary values to make a sensical size
    const DISTANCESCALE = 0.000001;                                         //Arbitrary values to make a sensical size

    var MINDAY = 0.41250000000000003;                                       //Jupiter has a .4125 day long day
    var MAXDAY = 243.02083333333334;                                        //Venus has a 243 day long day

    var color = {r: 0, g: 0, b: 0};                                         //Colors for the texture    
   
    var pnt = {
        name: generateName(),                                               //Makes name from a Markov chain word generator
        type: null,                                                         //Deterimined Later
        radius: radius,                                                     //Sets the radius based on input (recursion will make this relative)
        rotationPeriod: 1 / randRange(MINDAY, MAXDAY),                      //It's actually 1 / period in Earth days, describes rotation rate
        distanceFromParent: distanceFromParent + radius,                    //Sets how far away this sits from parent
        yearLength: 1 / randRange(MINYEAR, MAXYEAR),                        //It's actually 1 / length in Earth days, describes revolution rate
        pivot: new THREE.Group(),                                           //Create empty pivot for this planet/sun system     
        mesh: null,                                                         //Where the planet itself is stored
        children: [],                                                       //Where the orbiting systems are stored
    };    

    //Decide planet type based on parental status
    if (parent == null){
        pnt.type = "Sun";
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
    }
    else if(parent.type == "Planet"){
        pnt.type = "Moon";                                                  //Define body type
        childCount = 0;                                                     //Moons don't get to have moons
        parent.pivot.add(pnt.pivot);                                        //Add this system to the parent system
        pnt.distanceFromParent += parent.radius;                            //Account for parent's radius
        pnt.pivot.translateX(pnt.distanceFromParent);                       //Move this pivot away from parent
        var mooncolor = Math.random();                                      //Moons are grey, so rgb is one color
        color = {r: mooncolor, g: mooncolor, b: mooncolor};         
    }    

    var material = generateMaterial(color);
    pnt.mesh = new THREE.Mesh(SPHERE, material);                            //Apply the material and sphere to a mesh                                                       
    pnt.mesh.name = pnt.name;                                               //Name the body
    pnt.mesh.scale.set(pnt.radius, pnt.radius, pnt.radius);                 //Scale mesh
    objects.push(pnt.mesh);                                                 //Put the mesh into the object collection for interaction
    pnt.pivot.add(pnt.mesh);                                                //Add mesh to pivot    
    pnt.pivot.name = pnt.name + " System";                                  //Name the system    

    //Add planetary ring
    var ringGeometry = new THREE.RingGeometry(1, 1.001, 100, 100);
    ringGeometry.rotateX(Math.PI / 2);                                      //Put ring on the same plane as planets
    var ringMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    var ring = new THREE.Mesh(ringGeometry, ringMaterial);        
    ring.scale.set(pnt.distanceFromParent, pnt.distanceFromParent, pnt.distanceFromParent);
    ring.position.set(pnt.mesh.getWorldPosition().x, pnt.mesh.getWorldPosition().y, pnt.mesh.getWorldPosition().z)
    
    if (parent != null){
        parent.pivot.add(ring);
    }
    

    //Now recurse with the children
    for (var i = 0; i < childCount; i++){
        var maxRadius = .1 * pnt.radius;                                    //Jupiter is roughly .1 the size of the sun (Thanks Wolfram)
        var minRadius = .0035 * pnt.radius;                                 //Mercury is .0035 the size of the Sun (Thanks Wolfram)
        var nextRadius = randRange(minRadius, maxRadius);                   //Radius is smaller than the parent by a certain ratio 

        var minDistance = pnt.radius * 10 / nextRadius;                     //Distance to Mercury / radius of Sun
        var maxDistance = pnt.radius * 100 / nextRadius;                    //Distance to Neptune / radius of Sun
        var nextDistance = randRange(minDistance, maxDistance);                      

        pnt.children.push(gen(1, nextRadius, nextDistance, pnt));           //Recurse
    }	

	return pnt;
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

//Initializes JS/Browser events
function initEvents(){
    //Initialize Materialize modal 
    $('.modal').modal();      
    $('#welcome-modal').modal("open");  

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
            M.Toast.dismissAll();
            M.toast({html: intersects[0].object.name});    
            
            //Change controls to center on that object
            controls.objectToFollow = intersects[0].object;
            controls.target = controls.objectToFollow.getWorldPosition();            
            controls.update();
        }
    }

    //Handle KeyPress events
    window.onkeypress = function(event) {
        var speedMessage = "";
        switch(event.keyCode){            
            case 49: speedMultiplier = 1440;                    //1 Full Earth rotation every 1 minute --> (1440 = number of minutes in a day, 24 * 60)
            speedMessage = "Speed: 1 day per minute";
            break;                        
            case 50: speedMultiplier = 1440 * 60;               //1 Full Earth rotation every 1 second --> (1440 * 60 = minutes to seconds in a year)
            speedMessage = "Speed: 1 day per second";
            break;                        
            case 51: speedMultiplier = 1440 * 60 * 365;         //1 Full Earth revolution every 1 second --> = (1440 * 60 * 365 = 1 full earth revolution every 1/365 second, or 1 year per second)
            speedMessage = "Speed: 1 year per second";
            break;
        }
        if (speedMessage != ""){
            //Show materialize message
            M.Toast.dismissAll();
            M.toast({html: speedMessage});    
        }
    }
}

//Generates random float between two numbers
function randRange(a, b){    
    return Math.random() * (Math.max(a, b) - Math.min(a, b)) + Math.min(a, b);
}

//Use TexGen JS to generate a material to use with our planets
function generateMaterial(color){    
    var tgTexture = new TG.Texture(64, 64);                             //Size of the texture radically increases loading time
    var vFractal = new TG.VoronoiFractal();                             //VoronoiFractal Looks nice, but maybe look into randomizing the strategy
    vFractal.tint(color.r, color.g, color.b);                           //Set the color base
    
    //Add things here...
    //Look into weight, density, and octaves changing

    tgTexture.set(vFractal);                                            //Apply the fractal style to the texture    
    var texture = new THREE.Texture(tgTexture.toCanvas());
    texture.needsUpdate = true;
    var material = new THREE.MeshBasicMaterial({map: texture});         //Apply the texture to a material
    return material;
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

//What to do every frame
function animate() {        
    requestAnimationFrame(animate);    //Get frame        
    renderer.render(scene, camera);    //Render
}

initThree();
initEvents();
starttime = Date.now();
t = gen(3, 5, 0, null);
console.log("Solar System Generated in " + (Date.now() - starttime) / 1000 + " Seconds");
scene.add(t.pivot);
console.log(t)
animate();