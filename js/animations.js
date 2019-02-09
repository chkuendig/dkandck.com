var globePositions = {
    "-1": { latitude: 80.00, longitude: 8.55, altitude: 0.7e7, tilt: 60 }, // start, nord pole 
    0: { latitude: 50.00000, longitude: 8.55, altitude: 1e7, tilt: 0 }, // whole world
    1: { latitude: 47.36667, longitude: 8.54500, altitude: 3100, tilt: 55 }, // zurich
    2: { latitude: 37.85358, longitude: 15.28851, altitude: 2000, tilt: 55 }, // taormina
    3: { latitude: 47.92040, longitude: 8.10523, altitude: 161044, tilt: 26 }, // alsace
    4: { latitude: -3.065653, longitude: 37.35201, altitude: 5000, tilt: 0 }, // kilimanjaro
}

var kmlFiles = {
    "3": "gpx/cycling/cycle_500m.kml",
    "4": "./gpx/kili/kili_500m.kml"
}

var kmlLayers = {

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

            //TODO: Check kmlStyleUrl on node to remove name on routes (the labels look ugly)
        }
    };
    // build kmlLayers
    Object.keys(kmlFiles).forEach(function (key) {
        var kmlFilePromise = new WorldWind.KmlFile(kmlFiles[key], [kmlController]);
        kmlFilePromise.then(function (kmlFile) {
            kmlLayers[key] = new WorldWind.RenderableLayer("Surface Shapes");

            kmlLayers[key].addRenderable(kmlFile);
            kmlLayers[key].enabled = false
            console.log("add layer: " + key + ":" + kmlFile)
            wwd.addLayer(kmlLayers[key]);
        });
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


    var tweenSmallGlobe = new TweenMax("#canvasContainer", 1, { className: "globe small" });
    var section2016 = new ScrollMagic.Scene({ triggerElement: "#section2016", duration: "100%", triggerHook: 1 })
        .addIndicators() // add indicators (requires plugin)
        .setTween(tweenSmallGlobe)
        .addTo(controller)
        .on("progress", function (e) {
            loop(0, e.progress)
        });;

    var section2017 = new ScrollMagic.Scene({
        triggerElement: "#section2017", duration: "100%", triggerHook: 1
    })
        .addIndicators() // add indicators (requires plugin)
        .addTo(controller)
        .on("progress", function (e) {
            loop(2, e.progress)
        });;



    // photo scrolling
    document.querySelectorAll("div.block.pinned").forEach(function (pinnedBlock, blockIdx) {
        var tl = new TimelineMax();
        var igPictures = pinnedBlock.querySelectorAll("section.igPicture")
        igPictures.forEach(function (igPicture, pictureidx) {
            if (pictureidx > 0) {
                tl.from(igPicture, 1, { yPercent: 100 });
            }
        });
        new ScrollMagic.Scene({
            triggerElement: pinnedBlock,
            triggerHook: "onLeave",
            duration: "200%"
        })
            .setPin(pinnedBlock)
            .setTween(tl)
            .addIndicators()


            .addTo(controller)
            .on("progress", function (e) {
                if (blockIdx == 0) { //2016
                    var progress = e.progress
                    ratioPerPic = 1 / (igPictures.length - 1)
                    pictureIdx = Math.floor(progress / ratioPerPic) + 1
                    pictureProg = (progress - ratioPerPic * (pictureIdx - 1)) / ratioPerPic;

                    console.log({ pictureIdx: pictureIdx, pictureProg: pictureProg, progress: progress });
                    if (pictureIdx == 2) {

                        loop(1, pictureProg)
                    }
                }
            });;

    })


});



var timeStamp = Date.now();
var animator = null
var animatorPage = null
var restingRange = 0.2
var adjustRestingRange = function (progress) {
    return Math.max(0.001, Math.min(1, progress * 1 / (1 - restingRange * 2) - restingRange / (1 - restingRange * 2)));
}
function loop(page, pageProgress) {

    // requestAnimationFrame(function () {

    var nextPage = parseInt(page) + 1
    if (globePositions[page] && globePositions[nextPage]) { // animate globe
        if (animatorPage != page) {
            if (kmlLayers[nextPage]) {
                kmlLayers[nextPage].enabled = true
            } else if (kmlLayers[page - 1]) {
                kmlLayers[page - 1].enabled = false
            }

            // console.log({ page: page, pageProgress: pageProgress, animatorPage: animatorPage, nextPage:nextPage })
            animatorPage = page
            animator = wwd.goToAnimator.goTo(globePositions[page], globePositions[nextPage]);
            /*
            if (page == -1) {
                startSun()
            } else {
               stopSun()
            }
            */
        }
        var compressFactor = 0.8 //rest for 0.1 on both sides
        pageProgress = Math.max(0, Math.min(1, pageProgress / compressFactor - (1 - compressFactor) / (compressFactor * 2)))
        wwd.navigator.tilt = globePositions[page].tilt + (globePositions[nextPage].tilt - globePositions[page].tilt) * pageProgress
        //console.log({ page: page, pageProgress: pageProgress, animatorPage: animatorPage, nextPage:nextPage })

        animator(pageProgress * 100)
        console.log({ page: page, pageProgress: pageProgress, latitude: wwd.navigator.lookAtLocation.latitude, longitude: wwd.navigator.lookAtLocation.longitude, range: wwd.navigator.range, tilt: wwd.navigator.tilt });
    }
    // });


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

    WorldWind.Logger.setLoggingLevel(WorldWind.Logger.LEVEL_DEBUG);
    var wwd = new WorldWind.WorldWindow("canvasOne", new WorldWind.EarthElevationModel());
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