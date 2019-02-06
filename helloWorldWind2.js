var globePositions = {
    "-1": { latitude: 80, longitude: 8.55, altitude: 0.7e7, tilt: 60 },
    0: { latitude: 50, longitude: 8.55, altitude: 2e7, tilt: 0 },
    1: { latitude: 47.36667, longitude: 8.55, altitude: 1000, tilt: 20 },
    2: { latitude: -3.065653, longitude: 37.35201, altitude: 50, tilt: 0 },
}
document.addEventListener('DOMContentLoaded', function () {
    // init globe
    window.wwd = launchGlobe();

    // init controller
    TweenLite.defaultEase = Linear.easeNone;
    var controller = new ScrollMagic.Controller();



    // build scenes
    var tweenBigGlobe = new TweenMax("#canvasContainer", 1, { className: "globe" });
    var scene = new ScrollMagic.Scene({ triggerElement: "#sectionTitle", duration: "50%", triggerHook: "0" })
        .addIndicators() // add indicators (requires plugin)
        .setTween(tweenBigGlobe)
        .addTo(controller)
        .on("progress", function (e) {
            loop(-1, e.progress)
        });;

    var tweenSmallGlobe = new TweenMax("#canvasContainer", 1, { className: "globe small" });

    var scene2 = new ScrollMagic.Scene({ triggerElement: "#section2016", duration: "100%", triggerHook: 1 })
        .addIndicators() // add indicators (requires plugin)
        .setTween(tweenSmallGlobe)
        .addTo(controller)
        .on("progress", function (e) {
            console.log(e)
            loop(0, e.progress)
        });;

    document.querySelectorAll("div.block.pinned").forEach(function (pinnedBlock) {


        var tl = new TimelineMax();

        pinnedBlock.querySelectorAll("section.igPicture").forEach(function (igPicture, idx) {
            if (idx > 0) {
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
            .addTo(controller);

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

    requestAnimationFrame(function () {
        console.log({ page: page, pageProgress: pageProgress, animatorPage: animatorPage })

        var nextPage = parseInt(page) + 1
        if (globePositions[page] && globePositions[nextPage]) { // animate globe
            if (animatorPage != page) {
                animatorPage = page
                animator = wwd.goToAnimator.goTo(globePositions[page], globePositions[nextPage]);
                if (page == -1) {
                    //       startSun()
                } else {
                    //     stopSun()
                }
            }
            wwd.navigator.tilt = globePositions[page].tilt + (globePositions[nextPage].tilt - globePositions[page].tilt) * pageProgress
            animator(pageProgress * 100)
            console.log({ latitude: wwd.navigator.lookAtLocation.latitude, longitude: wwd.navigator.lookAtLocation.longitude, range: wwd.navigator.range, tilt: wwd.navigator.tilt });
        }
    });


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
    //  htmlCanvas.width = window.innerWidth;
    //  htmlCanvas.height = window.innerHeight/2;
    //  htmlCanvas.background = "black";

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
    layerBMNGLandsat.minActiveAltitude = 5000
    wwd.addLayer(layerBMNGLandsat);
    var layerBingAerial = new WorldWind.BingAerialLayer(null);
    layerBingAerial.maxActiveAltitude = 5000;
    wwd.addLayer(layerBingAerial);
    // The Sun simulation is a feature of Atmosphere layer. We'll create and add the layer.
    atmosphereLayer = new WorldWind.AtmosphereLayer();
    atmosphereLayer.minActiveAltitude = 10000;
    wwd.addLayer(atmosphereLayer);


    //wwd.addLayer(new WorldWind.CompassLayer());
    //  wwd.addLayer(new WorldWind.CoordinatesDisplayLayer(wwd));
    //wwd.addLayer(new WorldWind.ViewControlsLayer(wwd));
    /*
    var nullListener = function (event) {
        if (!event.defaultPrevented) {
        event.preventDefault();
        } 
        var worldWindow =  window.wwd.navigator.worldWindow
        Object.keys(     worldWindow.eventListeners).forEach(function (key) {
          var listeners =     worldWindow.eventListeners[key].listeners;
          if(listeners.length >0 ) {
            listeners.forEach(function(listener){
              worldWindow.removeEventListener(key,listener)
          })}
        });
        return true
    }
    wwd.addEventListener("mousemove", nullListener);
    wwd.addEventListener("contextmenu", nullListener);
    wwd.addEventListener("mousedown", nullListener);
    wwd.addEventListener("pointerdown", nullListener);
    wwd.addEventListener("touchstart", nullListener);
    wwd.addEventListener("wheel", nullListener);
    */

    /*
    wwd.navigator.handleWheelEvent = function() {
      // nothing
      var self = this
      if(self.worldWindow.eventListeners.wheel.listeners.length >0 ) {
        self.worldWindow.eventListeners.wheel.listeners.forEach(function(listener){
          self.worldWindow.removeEventListener("wheel",listener)
      })}
      console.log("wheel")
      }
      */
    return wwd;
}