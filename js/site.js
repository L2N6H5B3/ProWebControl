// Variables

// Connection
var host = "172.16.101.32";
var port = "50000";
var pass = "control";

// User Preference
var useCookies = true;

// Application
var authenticated = false;
var wsUri = "ws://" + host + ":" + port;
var presentation;
var location;
var resetTimeout;
var refresh = true;

// End Variables

// WebSocket Functions

function connect() {
    $(".disconnected").show();
    webSocket = new WebSocket(wsUri + "/remote");
    webSocket.onopen = function (evt) { onOpen(evt) };
    webSocket.onclose = function (evt) { onClose(evt) };
    webSocket.onmessage = function (evt) { onMessage(evt) };
    webSocket.onerror = function (evt) { onError(evt) };
}

function onOpen(evt) {
    if (!authenticated) {
        webSocket.send('{"action":"authenticate","protocol":"700","password":"' + pass + '"}');
        console.log('Connected');
    }
}

function onMessage(evt) {
    var obj = JSON.parse(evt.data);
    console.log("Message: " + evt.data);

    if (obj.action == "authenticate" && obj.authenticated == "1" && authenticated == false) {
        // If the data is stale
        if (refresh) {
            // Set data to fresh
            refresh = false;
        }
        // Set as authenticated
        authenticated = true;
        // Remove disconnected status
        $(".disconnected").hide();
        // Show connected status
        $(".connected").show();
        // Prevent disconnect auto-refresh
        clearTimeout(resetTimeout);
    } else if (obj.action == "presentationCurrent") {
        // Create presentation
        createPresentation(obj);
    } else if (obj.action == "presentationSlideIndex") {
        // Display the current ProPresenter presentation
        displayPresentation(obj);
    } else if (obj.action == "presentationTriggerIndex") {
        // Display the presentation preview slides
        SetSlidePreview();
    } else if (obj.action == "clearAll") {
        // Clear Preview
        ClearPreview();
    }
}

function onError(evt) {
    authenticated = false;
    console.error('Socket encountered error: ', evt.message, 'Closing socket');
    webSocket.close();
}

function onClose(evt) {
    authenticated = false;
    // Remove connected status
    $(".connected").hide();
    // Show disconnected status
    $(".disconnected").show();
    // Retry connection every second
    setTimeout(function () {
        connect();
    }, 1000);

    // Refresh library after 5 minutes of disconnection
    resetTimeout = setTimeout(function () {
        refresh = true;
    }, 300000);
}

//  End WebSocket Functions


// Cookie Functions

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
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

function checkCookie(cname) {
    var name = getCookie(cname);
    if (name != "") {
        return true;
    } else {
        return false;
    }
}

// End Cookie Functions


// Settings Functions

function getSlideSizeCookie() {
    if (checkCookie("slideSize") && useCookies) {
        slideSize = parseInt(getCookie("slideSize"));
        document.getElementById("slide-size").value = parseInt(getCookie("slideSize"));
    } else {
        document.getElementById("slide-size").value = slideSize;
    }
}

function setSlideSizeCookie(int) {
    setCookie("slideSize", int, 90);
}

// End Settings Functions


// Build Functions



// End Build Functions


// Set Data Functions

function SetSlidePreview() {

}

// End Set Data Functions


// Get Data Functions

function GetCurrentPresentation() {
    webSocket.send('{"action":"presentationCurrent", "presentationSlideQuality": 25}');
}

function GetCurrentSlide() {
    webSocket.send('{"action":"presentationSlideIndex"}');
}

function GetPresentation(location) {
    // Send the request to ProPresenter
    webSocket.send('{"action": "presentationRequest","presentationPath": "' + location + '"}');
}

// End Get Data Functions

// Page Actions Functions

function Next() {
    // Check if this is a playlist or library presentation
    if (location.charAt(0) == '0') {
        // Sent the request to ProPresenter
        webSocket.send('{"action":"presentationTriggerIndex","slideIndex":"' + index + '","presentationPath":"' + location + '"}');
    } else {
        // Sent the request to ProPresenter
        webSocket.send('{"action":"presentationTriggerIndex","slideIndex":"' + index + '","presentationPath":"' + location.replace(/\//g, "\\/") + '"}');
    }


}

function Previous() {

}

// End Page Actions Functions


// Page Display Functions

function ClearPreview() {
    $("#current-slide").empty();
    $("#next-slide").empty();
}

// End Page Display Functions


// Utility Functions

function getLocation(obj) {
    // Return the current presentation location
    return $(obj).children("div").attr("id");
}

function getClockSmallFormat(obj) {
    if (obj.length > 6) {
        return obj.split(".")[0];
    } else {
        return obj;
    }
}


function getClockEndTimeFormat(obj) {
    var endTimeFormatted = getClockSmallFormat(obj);
    if (endTimeFormatted == "00:00:00") {
        return "";
    } else {
        return endTimeFormatted;
    }
}

// End Utility Functions


// Initialisation Functions

function initialise() {

    // Get Cookie Values
    // getSlideSizeCookie();

    // Add listener for action keys
    window.addEventListener('keydown', function (e) {
        if (!inputTyping) {
            // When spacebar or right arrow is detected
            if (e.keyCode == 32 || e.keyCode == 39 && e.target == document.body) {
                // Prevent the default action
                e.preventDefault();
                // Trigger the next slide
                Next();
            }
            // When left arrow is detected
            if (e.keyCode == 37 && e.target == document.body) {
                // Prevent the default action
                e.preventDefault();
                // Trigger the previous slide
                Previous();
            }
        }
    });

    // Make images non-draggable
    $("img").attr('draggable', false);
}

// When document is ready
$(document).ready(function () {
    initialise();
    connect();
});

// End Initialisation Functions