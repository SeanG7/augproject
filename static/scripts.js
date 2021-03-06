//Google API Key, for development purposes all localmachines are allowed. Change this in production.
var API_KEY = 'AIzaSyAsJGvBskayVLIScXlb9WeCAypC9wGUf40';

//retrieves the audio element id
var audio = document.getElementById("notification-sound");
//sets audio to muted by default
audio.muted = true;
//retrieves mute button id
var soundButton = document.getElementById("sound-toggle");

/* Pulls the google sheet information using the Google API
This is hosted on: https://docs.google.com/spreadsheets/d/1euM71LMUJfVAMVsmXqGpsKhmqQZJgPd8UgGbBihU2e8/edit#gid=0 */
var dblink = "https://sheets.googleapis.com/v4/spreadsheets/1euM71LMUJfVAMVsmXqGpsKhmqQZJgPd8UgGbBihU2e8?includeGridData=true&fields=sheets%2Fdata%2FrowData%2Fvalues%2FuserEnteredValue&key=" + API_KEY;

//Sends a get request to the user, should be a callback but update this when possible
function httpGet(theUrl)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false ); // false for synchronous request
    xmlHttp.send( null );
    return xmlHttp.responseText;
}

//statue object to store statues in
function statue(name, year, desc, lat, longi) {
    this.name = name;
    this.year = year;
    this.description = desc;
    this.latitude = lat;
    this.longitude = longi;
}

//Prints output in json in console
var database = JSON.parse(httpGet(dblink));
var cursor = database.sheets[0].data[0].rowData;

//Creates an array of locations, traversing the array to the exact values needed for the statue function
//use this to create the array, locations2 returns a json file.

var locations2 = [];
var foundLocationNames = [];

expiry = new Date();
//Date format = Days/hours/minutes/seconds/milliseconds
//Sets expiry to 10 days from creation
expiry.setTime(expiry.getTime()+(10*24*60*60*1000));


function checkCookie() {
  if (document.cookie.indexOf("foundLocations") >= 0) {
    foundLocationNames = getCookie("foundLocations").split(",");
    console.log(foundLocationNames);
  } else {
    document.cookie="foundLocations=; expires=" + expiry.toGMTString();
  }
}

function getCookie(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for(var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

//saves array into cookie
function saveCookie(saveArray) {
  var cookieString = saveArray.join();
  document.cookie="foundLocations=" + cookieString + "; expires=" + expiry.toGMTString();
}


//checks that a cookie exists.
checkCookie();

function createArrayLoc(){

  var locations = [];
  var store = [];

    for (item in cursor){
        locations.push(cursor[item].values);
    }

    for(var i = 0; i<locations.length; i++){
        store.push(locations[i]);
    }

    for(var i = 0; i<store.length; i++){
        for(var b = 0; b<store[i].length; b++){
            if(store[i][b].userEnteredValue.stringValue == undefined){
                locations2.push(store[i][b].userEnteredValue.numberValue);
            } else {
                locations2.push(store[i][b].userEnteredValue.stringValue);
            }
        }
    }
    //Locations2 contains
    return locations2;
    //this should return an array of values for each location
}

//call that fills locations2
createArrayLoc();

//instantiates a new statues array to store data from googledoc as statue objects
var statues = [];
var foundStatues = [];

//iterates over locations2, creates objects from the values and stores in statues
for (var i = 0; i <locations2.length; i+=5) {
  statues.push(new statue(locations2[i], locations2[i+1],locations2[i+2], locations2[i+3], locations2[i+4]));
}


//removes all found locations from the statue array, adds them to the foundStatues array
function removeFound(foundLocs, target, foundStatues){
  for (var i = 0; i < foundLocs.length; i++) {
    for (var k = 0; k < target.length; k++) {
      if (foundLocs[i] == target[k].name) {
        foundStatues.push(target[k]);
        removeStatue(target, k);
      }
    }
  }
}

//removes the statue at targetIndex from the targetArray
function removeStatue(targetArray, targetIndex) {
  targetArray.splice(targetIndex, 1);
}

removeFound(foundLocationNames, statues, foundStatues);


//Mutes and unmutes sound on click
soundButton.onclick = function toggleSound() {
    if (audio.muted) {
        audio.muted = false;
        audio.load();
        this.innerHTML = "MUTE";
    } else {
        audio.muted = true;
        this.innerHTML = "UNMUTE";
    }
}

//displays a nice noty notification at top of screen
function notyMessage(statue) {
  $.noty.defaults.killer = true; //closes existing notys
    noty({
       text: 'Congratulations, you found <span class = "emph">' + statue.name + '</span>. <span class = "close">X</span> ',
       layout: 'topCenter',
       closeWith: ['click'],
       type: 'success'
    });
}

//Outputs notification text
function notifyUser(notificationTitle, notificationMessage, notificationImage) {
    document.getElementById("notification-title").innerHTML = notificationTitle;
    document.getElementById("notification-message").innerHTML = notificationMessage;
    document.getElementById("notification-image").innerHTML = "";
    document.getElementById("notification-image").appendChild(notificationImage);
}
//Fills out the info card  with the statue name, and description
function displayInfo(theSculpture) {
    var theName = theSculpture.name;
    var theDesc = theSculpture.description;
    var theYear = theSculpture.year;
    document.getElementById("location-container").getElementsByTagName('h3')[0].innerHTML = theName;
    document.getElementById("location-container").getElementsByTagName("p")[0].innerHTML = theYear;
    document.getElementById("location-container").getElementsByTagName("p")[1].innerHTML = theDesc;
    document.getElementById("location-container").style.display = "block";
}

//Location object to store location values in
function location(lat, longi) {
    this.latitude = lat;
    this.longitude = longi;
}


//Helper function to convert degrees to radians
function toRad(Value) {
    return Value * Math.PI / 180;
}

//Checks distance between 2 gps locations.
//https://stackoverflow.com/questions/1502590/calculate-distance-between-two-points-in-google-maps-v3
function checkDistance(gps1, gps2) {
    var R = 6378137; //Radius in metres
    var distLat = toRad(gps2.latitude - gps1.latitude);
    var distLong = toRad(gps2.longitude - gps1.longitude);
    var lat1 = toRad(gps1.latitude);
    var lat2 = toRad(gps2.latitude);


    var a = Math.sin(distLat / 2) * Math.sin(distLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(distLong / 2) * Math.sin(distLong / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var distance = R * c;
    console.log("You are " + distance + "m away from this target");
    return distance; //Returns distance in metres
}


//Gets the users location using HTML5 geolocation, takes and watches if the target is near
//Takes location object as input
function watchUserLocation(location) {

    if (!navigator.geolocation) {
        notifyUser("Something went wrong!", "<p>Geolocation is not supported by your browser.</p>", "");
        return;
    }
    var id, options;

    //Wakelock does not work, causes code to crash
    //var wakeLock;

    function success(pos) {
        var crd = pos.coords;
        var currentLoc = new location(crd.latitude, crd.longitude);
        var img = new Image();
        //img.src = "https://maps.googleapis.com/maps/api/staticmap?center=" + crd.latitude + "," + crd.longitude + "&zoom=17&size=300x300&sensor=false&key=" + API_KEY;

        var locationOutput = '<p>Latitude is ' + currentLoc.latitude + '° <br>Longitude is ' + currentLoc.longitude + '°</p>';

        notifyUser("Located!", locationOutput, img);

        //Google Maps information added

        var myLatLng = {lat:pos.coords.latitude, lng: pos.coords.longitude};
        //Zooms in the map

        var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 20,
        center: myLatLng
        });


        var marker = new google.maps.Marker({
        position: myLatLng,
        map: map,
        title: 'This is you!'
        });

        //Check current location against the statues array
        for (var i = 0; i < statues.length; i++) {
            var target = new location(statues[i].latitude, statues[i].longitude);
            if (checkDistance(currentLoc, target) < 10) {
                notyMessage(statues[i]);
                console.log('Congratulations, you are within 10m from the target');
                audio.play();
                displayInfo(statues[i]);
                //add found locations name to array
                foundLocationNames.push(statues[i].name)
                //add found locations to foundStatues, and remove from statues
                removeFound(foundLocationNames, statues, foundStatues);
                //saves cookie each time a location is found
                saveCookie(foundLocationNames);
            }
        }

    }

    function error(err) {
        notifyUser("Something went wrong!", "<p>We were unable to locate you.</p>", "");
        console.warn('ERROR(' + err.code + '): ' + err.message);
    }

    options = { 
        enableHighAccuracy: true,
         timeout: 5000,
         maximumAge: 0
    };
    //wakeLock = window.navigator.requestWakeLock('gps');
    id = navigator.geolocation.watchPosition(success, error, options);
}


watchUserLocation(location);
