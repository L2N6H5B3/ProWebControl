# ProWebControl
ProWebControl is a simplfied HTML/CSS/JS remote control application for ProPresenter 7, based upon [ProWebRemote](https://github.com/L2N6H5B3/ProWebRemote).

![ProWebRemote](https://raw.githubusercontent.com/L2N6H5B3/ProWebControl/master/Screenshot.png)

## Installation
ProWebControl can be either run directly from `index.html` or can be hosted on a webserver that does not use HTTPS.
Ensure that prior to running that the _IP_, _Port_, and _Password_ have been changed in `site.js`, located in the `js/` folder. 

## Usage
ProWebControl is designed to pull in the currently displayed Presentation from ProPresenter 7 upon launch, and download slides from presentations as they are selected.  Designed primarily for use in a church sitting, ProWebControl will look for a timer with `sermon` (upper or lower case, does not matter) somewhere in the title and will display times from this timer.

## Troubleshooting
ProWebControl is not connecting to ProPresenter 7
* Features were mainly developed on the Chromium platform (Google Chrome / Chromium Open Source Project) and may not work correctly in other browsers; though ProWebControl has been tested on Safari on iOS 9.3.5.
* ProWebControl must be run from either the index.html file or hosted on a non-HTTPS server as ProPresenter 7 uses WebSocket (WS) and not WebSocketSecure (WSS) for remote communication. HTTPS only supports WSS, and will not run a WS connection due to security requirements.
* Ensure that the password provided to ProWebControl matches the Remote password in ProPresenter 7
