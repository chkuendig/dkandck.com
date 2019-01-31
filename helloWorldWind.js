function launchGlobe(){
  // Obtain a reference to the canvas element using its id.
  htmlCanvas = document.getElementById('canvasOne');
//  htmlCanvas.width = window.innerWidth;
//  htmlCanvas.height = window.innerHeight/2;
//  htmlCanvas.background = "black";

WorldWind.Logger.setLoggingLevel(WorldWind.Logger.LEVEL_DEBUG);
var wwd = new WorldWind.WorldWindow("canvasOne");
wwd.goToAnimator = new CustomGoToAnimator(wwd.goToAnimator.wwd)
console.log(wwd.navigator.tilt )
wwd.navigator.tilt = 60
wwd.navigator.roll = 0
wwd.navigator.range = 0.7e7

wwd.goToAnimator.travelTime = 700

//wwd.addLayer(new WorldWind.BMNGOneImageLayer());
wwd.addLayer(new WorldWind.BMNGLandsatLayer());

 // The Sun simulation is a feature of Atmosphere layer. We'll create and add the layer.
 var atmosphereLayer = new WorldWind.AtmosphereLayer();
 wwd.addLayer(atmosphereLayer);

 // Atmosphere layer requires a date to simulate the Sun position at that time.
 // In this case the current date will be given to initialize the simulation.
 var timeStamp = Date.now();

 // Update the Sun position in 3 minute steps, every 64 ms in real time. Then redraw the scene.
 /*setInterval(function () {
     timeStamp += 180 * 1000;
     atmosphereLayer.time = new Date(timeStamp);
     wwd.redraw();
 }, 64);
*/


//wwd.addLayer(new WorldWind.CompassLayer());
//wwd.addLayer(new WorldWind.CoordinatesDisplayLayer(wwd));
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