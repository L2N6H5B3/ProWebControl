// Variables

// Connection
var host = "172.16.101.27";
var port = "50000";
var pass = "control";

// Application
var authenticated = false;
var wsUri = "ws://" + host + ":" + port;
var presentationSlides;
var presentationPath;
var currentSlide;
var clockIndex;
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
        webSocket.send('{"action":"authenticate","protocol":"701","password":"' + pass + '"}');
    }
}

function onMessage(evt) {
    // Parse the message data
    var obj = JSON.parse(evt.data);
    // Detect message type
    if (obj.action == "authenticate" && obj.authenticated == "1" && authenticated == false) {
        // If the data is stale
        if (refresh) {
            // Get the current presentation
            GetCurrentPresentation();
            // Get clocks
            GetClocks();
            // Set data to fresh
            refresh = false;
        }
        // Set as authenticated
        authenticated = true;
        // Remove disconnected status
        $(".disconnected").hide();
        // Show downloading status
        $(".downloading").show();
        // Prevent disconnect auto-refresh
        clearTimeout(resetTimeout);
    } else if (obj.action == "presentationCurrent") {
        // Save the presentation
        SetPresentation(obj);
    } else if (obj.action == "presentationTriggerIndex") {
        // Check if this is the same Presentation
        if (obj.presentationPath == presentationPath) {
            // Display the presentation preview slides
            SetSlidePreview(obj.slideIndex);
        } else {
            // Get the current presentation
            GetCurrentPresentation();
        }
    } else if (obj.action == "presentationSlideIndex") {
        // Set the presentation preview slides
        SetSlidePreview(parseInt(obj.slideIndex));
        // Display the preview slides
        $(".slide-container").removeClass("hidden");
        // Display the preview slides
        $(".button-container").removeClass("hidden");
        // Hide downloading status
        $(".downloading").hide();
        // Show connected status
        $(".connected").show();
    } else if (obj.action == "clearAll") {
        // Clear Preview
        ClearPreview();
    } else if (obj.action == "clearText") {
        // Clear Preview
        ClearPreview();
    } else if (obj.action == "clockRequest") {
        // For each clock in the list
        obj.clockInfo.forEach(function(item, index) {
            // Find the sermon counter
            if (item.clockName.toLowerCase().includes("sermon")) {
                // Set the clock index
                clockIndex = index;
                // If the clock is running
                if (item.clockState) {
                    // Start receiving clock times
                    StartReceivingClockTimes();
                }
            }
        });
    } else if (obj.action == "clockCurrentTimes") {
        // Update timer display
        UpdateTimerDisplay(obj);
    } else if (obj.action == "clockStartStop") {
        // Update timer display
        StartStopClockTimes(obj);
    } else if (obj.action == "clockResetIndex") {
        // Reset timer display
        ResetTimerDisplay(obj)
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


// Set Data Functions

function SetPresentation(obj) {
    // Reset the current presentation slides
    presentationSlides = [];
    // Save the current presentation location
    presentationPath = obj.presentationPath
    // Iterate through each slide group
    obj.presentation.presentationSlideGroups.forEach(
        function (presentationSlideGroup) {
            // Iterate through each slide in the group
            presentationSlideGroup.groupSlides.forEach(
                function (groupSlide) {
                    // Add the slide image
                    presentationSlides.push(groupSlide.slideImage);
                }
            );
        }
    );
    // Get the current slide
    GetCurrentSlide();
}

function SetSlidePreview(slideIndex) {
    // Set the current slide index
    currentSlide = slideIndex;
    // Set the current slide image
    $("#current-slide").attr('src', 'data:image/jpg;base64,' + presentationSlides[slideIndex]);
    // Show the next slide container
    $("#current-slide-container").removeClass("hidden");
    // If this is not the first slide
    if (slideIndex > 1) {
        // Show the previous button
        $("#previous").show();
    } else {
        // Hide the previous button
        $("#previous").hide();
    }
    // If this is not the last slide
    if (slideIndex < presentationSlides.length - 1) {
        // Set the next slide image
        $("#next-slide").attr('src', 'data:image/jpg;base64,' + presentationSlides[slideIndex + 1]);
        // Show the next slide container
        $("#next-slide-container").removeClass("hidden");
        // Show the next button
        $("#next").show();
    } else {
        // Clear the next slide image
        $("#next-slide").attr('src', '');
        // Hide the next slide container
        $("#next-slide-container").addClass("hidden");
        // Hide the next button
        $("#next").hide();
    }
}

// End Set Data Functions


// Get Data Functions

function GetCurrentPresentation() {
    // Send the request to ProPresenter
    webSocket.send('{"action":"presentationCurrent", "presentationSlideQuality": 25}');
}

function GetCurrentSlide() {
    // Send the request to ProPresenter
    webSocket.send('{"action":"presentationSlideIndex"}');
}

function GetClocks() {
    // Send the request to ProPresenter
    webSocket.send('{"action":"clockRequest"}');
}

function StartReceivingClockTimes() {
    // Send the start receiving clock times command
    webSocket.send('{"action":"clockStartSendingCurrentTime"}');
}

function StopReceivingClockTimes() {
    // Send the stop receiving clock times command
    webSocket.send('{"action":"clockStopSendingCurrentTime"}');
}

// End Get Data Functions

// Page Actions Functions

function Next() {
    if (currentSlide < presentationSlides.length - 1) {
        // Check if this is a playlist or library presentation
        if (presentationPath.charAt(0) == '0') {
            // Sent the request to ProPresenter
            webSocket.send('{"action":"presentationTriggerIndex","slideIndex":"' + (currentSlide + 1) + '","presentationPath":"' + presentationPath + '"}');
        } else {
            // Sent the request to ProPresenter
            webSocket.send('{"action":"presentationTriggerIndex","slideIndex":"' + (currentSlide + 1) + '","presentationPath":"' + presentationPath.replace(/\//g, "\\/") + '"}');
        }
    }
}

function Previous() {
    if (currentSlide > 0) {
        // Check if this is a playlist or library presentation
        if (presentationPath.charAt(0) == '0') {
            // Sent the request to ProPresenter
            webSocket.send('{"action":"presentationTriggerIndex","slideIndex":"' + (currentSlide - 1) + '","presentationPath":"' + presentationPath + '"}');
        } else {
            // Sent the request to ProPresenter
            webSocket.send('{"action":"presentationTriggerIndex","slideIndex":"' + (currentSlide - 1) + '","presentationPath":"' + presentationPath.replace(/\//g, "\\/") + '"}');
        }
    }
}

// End Page Actions Functions


// Page Display Functions

function StartStopClockTimes(obj) {
    if (obj.clockIndex == clockIndex && obj.clockState) {
        StartReceivingClockTimes();
    } else {
        StopReceivingClockTimes();
    }
}

function UpdateTimerDisplay(obj) {
    document.getElementById('timer-display').innerHTML = GetClockSmallFormat(obj.clockTimes[clockIndex]);
}

function ResetTimerDisplay(obj) {
    if (obj.clockIndex == clockIndex) {
        document.getElementById('timer-display').innerHTML = "";
    }
}

function ClearPreview() {
    $("#current-slide").attr('src', '');
    $("#next-slide").attr('src', '');
    $("#current-slide-container").addClass('hidden');
    $("#next-slide-container").addClass('hidden');
    // Hide the previous button
    $("#previous").hide();
    // Hide the next button
    $("#next").hide();
}

// End Page Display Functions


// Utility Functions

function GetClockSmallFormat(obj) {
    if (obj.length > 6) {
        var dayHourMinute = obj.split(".")[0];
        return dayHourMinute.substring(dayHourMinute.indexOf(":") + 1);
    } else {
        return obj;
    }
}

// End Utility Functions


// Initialisation Functions

function initialise() {

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
