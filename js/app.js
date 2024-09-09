import {TweenMax} from "gsap/TweenMax.js";
import {WorldWind} from "@nasaworldwind/worldwind/build/dist/worldwind.js";

ScrollMagic = require("scrollmagic");
require("scrollmagic/scrollmagic/uncompressed/plugins/animation.gsap.js");
//require("scrollmagic/scrollmagic/uncompressed/plugins/debug.addIndicators.js")
CustomGoToAnimator = require("./CustomGoToAnimator.js");
CustomEarthElevationModel = require("./CustomEarthElevationModel.js");
require("./animations.js");
