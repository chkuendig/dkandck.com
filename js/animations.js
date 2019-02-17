var globePositions = {
    "-1": { latitude: 80.00, longitude: 8.55, altitude: 0.7e7, tilt: 60, heading: 0 }, // start, nord pole 
    0: { latitude: 50.00000, longitude: 8.55, altitude: 1e7, tilt: 0, heading: 0 }, // whole world
    1: { latitude: 47.36667, longitude: 8.54500, altitude: 3100, tilt: 55, heading: 0, overlay: { label: "Zürich", latitude: 47.36667, longitude: 8.54500 } }, // zurich
    2: { latitude: 46.93639, longitude: 6.72383, altitude: 3100, tilt: 10, heading: 0, overlay: { label: "Creux du Van" } },// creux du van
    3: { latitude: 37.85358, longitude: 15.28851, altitude: 2000, tilt: 55, heading: 0, overlay: { label: "Taormina, Sicily", latitude: 37.85358, longitude: 15.28851 } }, // taormina
    4: { latitude: 47.92040, longitude: 8.10523, altitude: 161044, tilt: 26, heading: 0, overlay: { kmlFile: "gpx/cycling/cycle_500m.kml" } }, // alsace
    //   5: { latitude: -3.065653, longitude: 37.35201, altitude: 15000, tilt: 60, overlay: { kmlFile: "./gpx/kili/kili_500m.kml" } }, // kilimanjaro
    5: { latitude: -3.065653, longitude: 37.3, altitude: 26000, tilt: 63, heading: -15, overlay: { kmlFile: "./gpx/kili/kili_500m.kml" } }, // kilimanjaro
}

var overlayLayers = {

}

document.addEventListener('DOMContentLoaded', function () {
    // init globe
    window.wwd = launchGlobe();

    // init controller
    TweenMax.defaultEase = Linear.easeNone;
    var controller = new ScrollMagic.Controller();
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
    var tweenBigGlobe = new TweenMax("#canvasContainer", 1, { className: "globe" });
    var sectionTitle = new ScrollMagic.Scene({ triggerElement: "#sectionTitle", duration: "50%", triggerHook: "0" })
        .addIndicators() // add indicators (requires plugin)
        .setTween(tweenBigGlobe)
        .addTo(controller)
        .on("progress", function (e) {
            loop(-1, e.progress)
        });;


    let myRequest = new Request('photos.json');

    fetch(myRequest)
        .then(function (response) {
            if (!response.ok) {
                throw new Error('HTTP error, status = ' + response.status);
            }
            return response.json();
        })
        .then(function (obj) {
            console.log(obj)
            setUpPhotoSlides(controller, obj);
        });

});

function setUpPhotoSlides(controller, photos) {

    // photo scrolling
    document.querySelectorAll("div.block.pinned").forEach(function (pinnedBlock, blockIdx) {

        if (photos[pinnedBlock.id]) {
            var blockScene = new ScrollMagic.Scene({
                triggerElement: pinnedBlock, duration: "100%", triggerHook: 1
            })
                .addIndicators() // add indicators (requires plugin)
                .addTo(controller)
                .on("progress", function (e) {
                    loop(photos[pinnedBlock.id][0].position - 1, e.progress)
                });;
            if (blockIdx == 0) {
                var tweenSmallGlobe = new TweenMax("#canvasContainer", 1, { className: "globe small" });
                blockScene.setTween(tweenSmallGlobe) // first year, let's resize the globe    
            }
            var igPictures = photos[pinnedBlock.id]
            var tl = new TimelineMax();
            var igLocationDesc = pinnedBlock.querySelector("div.igHeader > p").childNodes[2]
            console.log(igLocationDesc);
            var igFrame = pinnedBlock.querySelector("div.igFrame")
            var igFooterDesc = pinnedBlock.querySelector("div.igFooter > p:first-child").childNodes[1]
            var igFooterDate = pinnedBlock.querySelectorAll("div.igFooter > p.date")
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
            var pictureScene = new ScrollMagic.Scene({
                triggerElement: pinnedBlock,
                triggerHook: "onLeave",
                duration: "200%"
            })
                .setPin(pinnedBlock)
                .setTween(tl)
                .addIndicators()
                .addTo(controller)
                .on("progress", function (e) {
                    var progress = e.progress
                    ratioPerPic = 1 / (igPictures.length - 1)
                    pictureIdx = Math.floor(progress / ratioPerPic) + 1
                    pictureProg = (progress - ratioPerPic * (pictureIdx - 1)) / ratioPerPic;

                    console.log({ pictureIdx: pictureIdx, pictureProg: pictureProg, progress: progress });
                    if (photos[pinnedBlock.id][pictureIdx] && photos[pinnedBlock.id][pictureIdx].position) {
                        loop(photos[pinnedBlock.id][pictureIdx].position - 1, pictureProg)
                    }

                });;
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
function loop(travelPosition, travelProgress) {

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
    htmlCanvas = document.getElementById('canvasOne');

    var wwd = new WorldWind.WorldWindow("canvasOne", new WorldWind.EarthElevationModel());

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