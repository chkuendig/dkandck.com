var CustomEarthElevationModel = function () {
    WorldWind.ElevationModel.call(this);

    var dted0 = new WorldWind.EarthRestElevationCoverage(null, "tiles/DTED0");
    this.addCoverage(dted0);
};
CustomEarthElevationModel.prototype = Object.create(WorldWind.ElevationModel.prototype);

CustomEarthElevationModel.prototype.elevationAtLocation = function (latitude, longitude) {
    return WorldWind.ElevationModel.prototype.elevationAtLocation.call(this, latitude, longitude) 

}
CustomEarthElevationModel.prototype.elevationsForGrid = function (sector, numLat, numLon, targetResolution, result) {
    return WorldWind.ElevationModel.prototype.elevationsForGrid.call(this, sector, numLat, numLon, targetResolution, result);

}
CustomEarthElevationModel.prototype.bestCoverageAtLocation = function (latitude, longitude, targetResolution) {
    return WorldWind.ElevationModel.prototype.bestCoverageAtLocation.call(this, latitude, longitude, targetResolution)
}

module.exports = CustomEarthElevationModel;