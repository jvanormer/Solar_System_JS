/*
    Name                    --> Markov Chain - //http://max.marrone.nyc/Markov-Word-Generator/
    Type                    --> Determined by parent
    Radius                  --> Determined by parent
    RotationPeriod          --> ? (Probably pure random)
    DistanceFromParent      --> ? (Probably just do random in-range and delete smaller colliding planet)
    YearLength              --> ? (Probably pure random) (Note: Sun doesn't get one)
    Texture                 --> ??? (TextGen JS)
    Children                --> Recursion
*/

function gen(childCount, radius, distanceFromParent, parent){
	var pnt = {};
	pnt.children = [];
    
    pnt.name = generateName();
    pnt.radius = radius;
    pnt.distanceFromParent = distanceFromParent;
    
    //Decide planet type based on parental status
    if (parent == null){
        pnt.type = "Sun";
        pnt.distanceFromParent = 0;     //Just to make sure nobody gives silly input
        //Set the year period to 0 here
    }
    else if(parent.type == "Sun"){
        pnt.type = "Planet";
    }
    else if(parent.type == "Planet"){
        pnt.type = "Moon";
        childCount = 0;                 //Moons don't get to have moons
    }

    for (var i = 0; i < childCount; i++){
        var maxRadius = .1 * pnt.radius;    //Jupiter is roughly .1 the size of the sun (Thanks Wolfram)
        var minRadius = .0035 * pnt.radius;  //Mercury is .0035 the size of the Sun (Thanks Wolfram)
        //Radius is smaller than the parent by a certain ratio
        var nextRadius = Math.floor(Math.random() * (maxRadius - minRadius + 1)) + maxRadius;

        var minDistance = 0;        //Get ratio of distance from Sun to Mercury
        var maxDistance = 1;        //Get ratio of distance from Sun to Neptune

        var nextDistance = Math.floor(Math.random() * (maxDistance - minDistance + 1)) + maxDistance;

        //This one will be trickier... Need to prevent overlapping.
        //Consider a bound for the system (Sun's would be Neptune's orbit?)
        var nextDistance = 0;
        pnt.children.push(gen(1, nextRadius, 0, pnt));
    }	

	return pnt;
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

t = gen(3, 10000, 0, null);
console.log(t)