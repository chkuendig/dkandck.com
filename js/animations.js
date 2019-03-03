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

    // init ScrollMagic controller
    TweenMax.defaultEase = Linear.easeNone;
    var controller = new ScrollMagic.Controller();

    // fetch photos 
    let reqPhotosJson = new Request('photos.json');
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
    var sectionTitleScene = new ScrollMagic.Scene({ triggerElement: "#sectionTitle", duration: "100%", triggerHook: "onLeave" })
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
    document.querySelectorAll("div.section.pinned").forEach(function (pinnedBlock, blockIdx) {

        if (photos[pinnedBlock.id]) {
            if (blockIdx > 0) {
                // initial scene before pictures start
                var blockScene = new ScrollMagic.Scene({
                    triggerElement: pinnedBlock, duration: "100%", triggerHook: "onEnter"
                })
                    .addTo(controller)
                    .on("progress", function (e) {
                        animateGlobe(photos[pinnedBlock.id][0].position - 1, e.progress)
                    });
                if (scrollIndicators) {
                    blockScene.addIndicators({ name: pinnedBlock.id })// add indicators (requires plugin)
                }
            }
            var igPictures = photos[pinnedBlock.id]
            var tl = new TimelineMax();
            var igLocationDesc = pinnedBlock.querySelector("div.igHeader > p").childNodes[2]

            var igFrame = pinnedBlock.querySelector("div.igFrame")
            var igFooterDesc = pinnedBlock.querySelector("div.igFooter > p:first-child").childNodes[1]
            var igFooterDate = pinnedBlock.querySelectorAll("div.igFooter > p.date")
            var tl = new TimelineMax();
            igPictures.forEach(function (igPicture, pictureidx) {
                var igPictureSection = document.createElement("section");
                igPictureSection.className = "igPicture"

                var igPictureImg = document.createElement("img");
                igPictureImg.src = "pictures/" + igPicture.file
                igPictureImg.style.width = "100%"
                igPictureSection.appendChild(igPictureImg)
                igFrame.appendChild(igPictureSection)
                if (pictureidx > 0) {
                    tl.from(igPictureSection, 1, { yPercent: 100 });
                    tl.set(igLocationDesc, { nodeValue: igPicture.locationText }, "-=0.5");
                    tl.set(igFooterDesc, { nodeValue: igPicture.text }, "-=0.5");
                    tl.set(igFooterDate, { textContent: igPicture.date }, "-=0.5");
                } else {
                    igLocationDesc.nodeValue = igPicture.locationText
                    igFooterDesc.nodeValue = " " + igPicture.text;
                    igFooterDate.textContent = igPicture.date;
                }
            });
            var igContainerStyle = window.getComputedStyle(pinnedBlock.querySelector("div.igContainer"), null);
            var igFrameHeight = parseInt(igContainerStyle.getPropertyValue('height')) * 0.8;
            var duration = igPictures.length * parseInt(igFrameHeight);
            var pictureScene = new ScrollMagic.Scene({
                triggerElement: pinnedBlock,
                triggerHook: "onLeave",
                duration: duration
            })
                .setPin(pinnedBlock)
                .setClassToggle(pinnedBlock.querySelector("div.sectionCard"), "scaleDownIn")
                .setTween(tl)
                .addTo(controller)
                .on("progress", function (e) {
                    var progress = e.progress
                    ratioPerPic = 1 / (igPictures.length - 1)
                    pictureIdx = Math.floor(progress / ratioPerPic) + 1
                    pictureProg = (progress - ratioPerPic * (pictureIdx - 1)) / ratioPerPic;

                    //console.log({ pictureIdx: pictureIdx, pictureProg: pictureProg, progress: progress });
                    if (photos[pinnedBlock.id][pictureIdx] && photos[pinnedBlock.id][pictureIdx].position) {
                        animateGlobe(photos[pinnedBlock.id][pictureIdx].position - 1, pictureProg)
                    }

                });
            if (scrollIndicators) {
                pictureScene.addIndicators({ name: "igPicture." + pinnedBlock.id, indent: 100 })// add indicators (requires plugin)
            }
            pinnedBlock.querySelector(".igContainer").style.display = ""
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
            /*
            if (travelPosition == -1) {
                startSun()
            } else {
               stopSun()
            }
            */
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
        console.log({ travelPosition: travelPosition, travelProgress: travelProgress.toFixed(2), lat: wwd.navigator.lookAtLocation.latitude.toFixed(2), long: wwd.navigator.lookAtLocation.longitude.toFixed(2), range: wwd.navigator.range.toFixed(2), tilt: wwd.navigator.tilt.toFixed(2) });
    }
    //});
};

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

    var wwd = new WorldWind.WorldWindow("globeCanvas", new WorldWind.EarthElevationModel());

    WorldWind.Logger.setLoggingLevel(WorldWind.Logger.LEVEL_WARNING);
    wwd.goToAnimator = new CustomGoToAnimator(wwd.goToAnimator.wwd)
    wwd.navigator.lookAtLocation.latitude = globePositions["-1"].latitude;
    wwd.navigator.lookAtLocation.longitude = globePositions["-1"].longitude;
    wwd.navigator.tilt = globePositions["-1"].tilt
    wwd.navigator.range = globePositions["-1"].altitude

    //wwd.goToAnimator.travelTime = 700
    var layerBMNGOneImage = new WorldWind.BMNGOneImageLayer()
    layerBMNGOneImage.minActiveAltitude = 4000000
    wwd.addLayer(layerBMNGOneImage);
    var layerBMNGLandsat = new WorldWind.BMNGLandsatLayer()
    layerBMNGLandsat.maxActiveAltitude = 4000000
    layerBMNGLandsat.minActiveAltitude = 10000
    wwd.addLayer(layerBMNGLandsat);
    var layerBingAerial = new WorldWind.BingAerialLayer(null);
    layerBingAerial.maxActiveAltitude = 10000;
    wwd.addLayer(layerBingAerial);
    // The Sun simulation is a feature of Atmosphere layer. We'll create and add the layer.
    atmosphereLayer = new WorldWind.AtmosphereLayer();
    atmosphereLayer.minActiveAltitude = 10000;
    wwd.addLayer(atmosphereLayer);

    return wwd;
}