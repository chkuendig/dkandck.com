var initialGlobePositions = {
    "-1": {
        "latitude": 80,
        "longitude": 8.55,
        "altitude": 7000000,
        "tilt": 60,
        "heading": 0
    },
    "0": {
        "latitude": 50,
        "longitude": 8.55,
        "altitude": 10000000,
        "tilt": 0,
        "heading": 0
    }
}

var overlayLayers = {

}

var scrollIndicators = false;


document.addEventListener('DOMContentLoaded', function () {

    // get email from hash
    var str = window.location.hash ? window.location.hash.substr(1) : "";
    var re = /.+\@.+\..+/i;
    var email = str.match(re);
    var link = document.querySelector('a[href="//rsvp.dkandck.com"]')
    if (email) {
        link.href = "//rsvp.dkandck.com?email=" + email
    }

    // init ScrollMagic controller
    TweenMax.defaultEase = Linear.easeNone;
    var controller = new ScrollMagic.Controller();

    // fetch photos 
    let reqPhotosJson = new Request('photos/photos.json');
    fetch(reqPhotosJson)
        .then(function (response) {
            if (!response.ok) {
                throw new Error('HTTP error, status = ' + response.status);
            }
            return response.json();
        })
        .then(function (rawPhotoData) {
            var parsed = setupGlobePositions(rawPhotoData)
            setUpSections(controller, parsed.globePositions);
            return parsed.photos
        })
        .then(function (argPhotos) {
            setUpPhotoSlides(controller, argPhotos);
        });

});

function setupGlobePositions(rawData) {
    var photos = {};
    var globePositions = initialGlobePositions;
    var posIdx = 0;
    Object.keys(rawData).forEach(function (sectionKey) {
        var section = rawData[sectionKey]
        photos[sectionKey] = []
        Object.keys(section).forEach(function (photoKey) {
            var photo = section[photoKey]
            if (typeof photo.position == "object") {
                posIdx++;
                globePositions[posIdx] = photo.position;
                photo.position = posIdx;
            }
            photos[sectionKey][photoKey] = photo
        });
    });
    return { "globePositions": globePositions, "photos": photos };
}
function setUpSections(controller, argGlobePositions) {

    window.globePositions = argGlobePositions;
    // init globe
    window.wwd = launchGlobe();


    var kmlController = new WorldWind.KmlControls();
    kmlController.hook = function (node, options) {
        if (options.isFeature) {
            var name = node.kmlName || node.id || WWUtil.guid();
            var enabled = node.enabled && node.kmlVisibility === true;
            if (!enabled) {
                console.log(name)
                console.log(enabled)
            }
        }
    };
    // build overlayLayers
    Object.keys(globePositions).forEach(function (key) {
        var overlay = globePositions[key].overlay
        if (overlay && overlay.kmlFile) {
            var kmlFilePromise = new WorldWind.KmlFile(overlay.kmlFile, [kmlController]);
            kmlFilePromise.then(function (kmlFile) {
                overlayLayers[key] = new WorldWind.RenderableLayer("Surface Shapes");
                overlayLayers[key].addRenderable(kmlFile);
                overlayLayers[key].enabled = false
                wwd.addLayer(overlayLayers[key]);
            });
        } else if (overlay && overlay.label) {
            if (!overlay.latitude) {
                overlay.latitude = globePositions[key].latitude
                overlay.longitude = globePositions[key].longitude
            }
            var placemark = new WorldWind.Placemark(new WorldWind.Position(overlay.latitude, overlay.longitude, 1e2), true, null);
            placemark.label = overlay.label;
            placemark.altitudeMode = WorldWind.CLAMP_TO_GROUND;
            overlayLayers[key] = new WorldWind.RenderableLayer("Placemarks")
            overlayLayers[key].addRenderable(placemark);
            overlayLayers[key].enabled = false
            wwd.addLayer(overlayLayers[key]);
        }
    });

    // build scenes
    var tweenBigGlobe = new TweenMax("#globeContainer", 1, { className: "small" });
    var titleSceneDuration = "80%";
    if(window.matchMedia("only screen and (max-aspect-ratio: 4/3)").matches) {
        titleSceneDuration = "50%";
    }
    var sectionTitleScene = new ScrollMagic.Scene({ triggerElement: "#sectionTitle", duration: titleSceneDuration, triggerHook: "onLeave" })
        .setTween(tweenBigGlobe)
        .addTo(controller)
        .on("progress", function (e) {
            if (e.progress < 0.5) {
                animateGlobe(-1, e.progress * 2)
            } else {
                animateGlobe(0, (e.progress - 0.5) * 2)
            }
        });
    if (scrollIndicators) {
        sectionTitleScene.addIndicators({ name: "sectionTitle " }) // add indicators (requires plugin)
    }


    // build scenes
    var sectionGoaScene = new ScrollMagic.Scene({ triggerElement: "#sectionGoa", duration: "0", triggerHook: "onEnter" })
        .setClassToggle("#globeContainer", "hidden")
        .addTo(controller)
        .on("progress", function (e) {
            console.log(e.progress)
        });
    if (scrollIndicators) {
        sectionGoaScene.addIndicators({ name: "sectionGoa" }) // add indicators (requires plugin)
    }
}

function setUpPhotoSlides(controller, photos) {

    // photo scrolling
    document.querySelectorAll("div.section.pinned").forEach(function (sectionDiv, blockIdx) {
        if (blockIdx > 0) {
            // initial scene before pictures start
            var blockScene = new ScrollMagic.Scene({
                triggerElement: sectionDiv, duration: "100%", triggerHook: "onEnter"
            })
                .addTo(controller)
                .on("progress", function (e) {
                    //     animateGlobe(photos[sectionDiv.id][0].position - 1, e.progress)
                });
            if (scrollIndicators) {
                blockScene.addIndicators({ name: sectionDiv.id })// add indicators (requires plugin)
            }
        }
        if (photos[sectionDiv.id]) {

            var igPictures = photos[sectionDiv.id]
            var igContainer = sectionDiv.querySelector("div.igContainer")
            var igPictureDiv = igContainer.querySelector("div.igPicture")
            igPictureDiv.parentElement.removeChild(igPictureDiv); //remove sample post

            igPictures.forEach(function (igPicture, pictureidx) {
                if (pictureidx > 0) {
                    igPictureDiv = igPictureDiv.cloneNode(true);
                }

                var igFrame = igPictureDiv.querySelector("div.igFrame")
                var igPictureImg = document.createElement("img");
                if (pictureidx > 0) {
                    igPictureImg = igFrame.firstChild;
                }
                igPictureImg.src = "photos/" + igPicture.file
                igPictureImg.style.width = "100%"

                igFrame.appendChild(igPictureImg)

                var igLocationDesc = igPictureDiv.querySelector("div.igHeader > p").childNodes[2]
                igLocationDesc.nodeValue = igPicture.locationText
                var igFooterDesc = igPictureDiv.querySelector("div.igFooter > p:first-child").childNodes[1]
                igFooterDesc.nodeValue = " " + igPicture.text;
                var igFooterDate = igPictureDiv.querySelector("div.igFooter > p.date")
                igFooterDate.textContent = igPicture.date;
                igContainer.appendChild(igPictureDiv)
            });
            igContainer.style.display = ""
            var igContainerStyle = window.getComputedStyle(igContainer, null);
            var igContainerHeight = parseInt(igContainerStyle.getPropertyValue('height'));
            var pictureScene = new ScrollMagic.Scene({
                triggerElement: sectionDiv,
                triggerHook: "onEnter",
                duration: igContainerHeight
            })
                .addTo(controller).setClassToggle(sectionDiv.querySelector("div.sectionCard"), "scaleDownIn")
                .on("progress", function (e) {
                    var progress = e.progress
                    ratioPerPic = 1 / (igPictures.length)
                    pictureIdx = Math.floor(progress / ratioPerPic)
                    pictureProg = (progress - ratioPerPic * (pictureIdx)) / ratioPerPic;
                    //   console.log({ pictureIdx: pictureIdx, pictureProg: pictureProg, progress: progress });
                    if (photos[sectionDiv.id][pictureIdx] && photos[sectionDiv.id][pictureIdx].position) {
                        var travelPosition = photos[sectionDiv.id][pictureIdx].position;
                        if (travelPosition > 1) {
                            animateGlobe(photos[sectionDiv.id][pictureIdx].position - 1, pictureProg)
                        }
                    }
                });
            if (scrollIndicators) {
                pictureScene.addIndicators({ name: "igPicture." + sectionDiv.id, indent: 100 })// add indicators (requires plugin)
            }
        }
    })
}

var timeStamp = Date.now();
var animator = null
var navigatorPosition = null
var restingRange = 0.2
var adjustRestingRange = function (progress) {
    return Math.max(0.001, Math.min(1, progress * 1 / (1 - restingRange * 2) - restingRange / (1 - restingRange * 2)));
}
function animateGlobe(travelPosition, travelProgress) {

    //requestAnimationFrame(function () {

    var nextTravelPosition = parseInt(travelPosition) + 1
    if (globePositions[travelPosition] && globePositions[nextTravelPosition]) { // animate globe
        if (navigatorPosition != travelPosition) {
            navigatorPosition = travelPosition
            animator = wwd.goToAnimator.goTo(globePositions[travelPosition], globePositions[nextTravelPosition]);
            if (!animator) {
                throw "no animator"
            }
            /*
            if (travelPosition == -1) {
                startSun()
            } else {
               stopSun()
            }
            */
            if (travelPosition > 1) {
                showStars()
            } else {
                hideStars()
            }
        }

        // squeeze travel progress
        var compressFactor = 0.8 //rest for 0.1 on both sides
        travelProgress = Math.max(0, Math.min(1, travelProgress / compressFactor - (1 - compressFactor) / (compressFactor * 2)))

        // display/hide overlays ahead
        if (overlayLayers[nextTravelPosition] && travelProgress > 0.5) {
            overlayLayers[nextTravelPosition].enabled = true
        } else if (overlayLayers[nextTravelPosition] && travelProgress < 0.5) {
            overlayLayers[nextTravelPosition].enabled = false
        }

        //  display/hide overlays behind
        if (overlayLayers[travelPosition] && travelProgress > 0.5) {
            overlayLayers[travelPosition].enabled = false
        } else if (overlayLayers[travelPosition] && travelProgress < 0.5) {
            overlayLayers[travelPosition].enabled = true
        }

        // move globe
        wwd.navigator.heading = globePositions[travelPosition].heading + (globePositions[nextTravelPosition].heading - globePositions[travelPosition].heading) * travelProgress

        wwd.navigator.tilt = globePositions[travelPosition].tilt + (globePositions[nextTravelPosition].tilt - globePositions[travelPosition].tilt) * travelProgress
        animator(travelProgress * 100)
        //  console.log({ travelPosition: travelPosition, travelProgress: travelProgress.toFixed(2), lat: wwd.navigator.lookAtLocation.latitude.toFixed(2), long: wwd.navigator.lookAtLocation.longitude.toFixed(2), range: wwd.navigator.range.toFixed(2), tilt: wwd.navigator.tilt.toFixed(2) });
    }
    //});
};


var starFieldLayer = null
function showStars() {
    if (!starFieldLayer.enabled) {
        starFieldLayer.enabled = true;

        htmlCanvas = document.getElementById('globeCanvas').style.background = "black";

    }
    ;
}
function hideStars() {
    if (starFieldLayer.enabled) {
        starFieldLayer.enabled = false;
        htmlCanvas = document.getElementById('globeCanvas').style.background = "none";
    }
}

var atmosphereLayer = null
var atmosphereLayerInterval = null
function startSun() {
    // Atmosphere layer requires a date to simulate the Sun position at that time.
    // In this case the current date will be given to initialize the simulation.
    var timeStamp = Date.now();

    // Update the Sun position in 3 minute steps, every 64 ms in real time. Then redraw the scene.
    atmosphereLayerInterval = setInterval(function () {
        timeStamp += 180 * 1000 * 3;
        atmosphereLayer.time = new Date(timeStamp);
        //  console.log(timeStamp)
        wwd.redraw();
    }, 64);


}
function stopSun() {

    /* later */
    if (atmosphereLayerInterval) {
        clearInterval(atmosphereLayerInterval)
        atmosphereLayer.time = null
        atmosphereLayerInterval = null
    }
}
function launchGlobe() {
    // Obtain a reference to the canvas element using its id.
    htmlCanvas = document.getElementById('globeCanvas');

    WorldWind.configuration.baseUrl = "wwd/"
    var wwd = new WorldWind.WorldWindow("globeCanvas", new CustomEarthElevationModel());

    WorldWind.Logger.setLoggingLevel(WorldWind.Logger.LEVEL_WARNING);
    wwd.goToAnimator = new CustomGoToAnimator(wwd.goToAnimator.wwd)
    wwd.navigator.lookAtLocation.latitude = globePositions["-1"].latitude;
    wwd.navigator.lookAtLocation.longitude = globePositions["-1"].longitude;
    wwd.navigator.tilt = globePositions["-1"].tilt
    wwd.navigator.range = globePositions["-1"].altitude

    var layerBMNGOneImage = new WorldWind.BMNGOneImageLayer()
    layerBMNGOneImage.minActiveAltitude = 0
    wwd.addLayer(layerBMNGOneImage);


    var layerBingAerial = new WorldWind.BingAerialLayer("Aja97SPGWwU2V3NBlnc_A5n0X8pguk8zIp5Z6SYRnk8cEhCwsBiotct2yyiygtq7");
    layerBingAerial.maxActiveAltitude = 5000000;
    layerBingAerial.detailControl = 0.8;
    wwd.addLayer(layerBingAerial);

    atmosphereLayer = new WorldWind.AtmosphereLayer();
    atmosphereLayer.minActiveAltitude = 5000;
    wwd.addLayer(atmosphereLayer);

    starFieldLayer = new WorldWind.StarFieldLayer();
    starFieldLayer.minAtiveAltitude = 10000;
    starFieldLayer.enabled = false;
    wwd.addLayer(starFieldLayer);

    return wwd;
}