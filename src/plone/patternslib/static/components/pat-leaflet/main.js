require.config({
    paths: {
        "pat-leaflet":             "src/pat-leaflet",
        "leaflet":                 "bower_components/leaflet/dist/leaflet-src",
        "leaflet-fullscreen":      "bower_components/Leaflet.fullscreen/dist/Leaflet.fullscreen",
        "leaflet-providers":       "bower_components/leaflet-providers/leaflet-providers",
        "leaflet-geosearch":       "bower_components/L.GeoSearch/src/js/l.control.geosearch",
        "leaflet-geosearch-bing":  "bower_components/L.GeoSearch/src/js/l.geosearch.provider.bing",
        "leaflet-geosearch-esri":  "bower_components/L.GeoSearch/src/js/l.geosearch.provider.esri",
        "leaflet-geosearch-google": "bower_components/L.GeoSearch/src/js/l.geosearch.provider.google",
        "leaflet-geosearch-openstreetmap": "bower_components/L.GeoSearch/src/js/l.geosearch.provider.openstreetmap",
        "leaflet-markercluster":   "bower_components/leaflet.markercluster/dist/leaflet.markercluster-src",
        "leaflet-awesomemarkers":  "bower_components/Leaflet.awesome-markers/dist/leaflet.awesome-markers",
        "leaflet-locatecontrol":   "bower_components/leaflet.locatecontrol/src/L.Control.Locate",
        "leaflet-minimap":         "bower_components/Leaflet-MiniMap/dist/Control.MiniMap.min",
        "leaflet-sleep":           "bower_components/Leaflet.Sleep/Leaflet.Sleep",
        "leaflet-simplemarkers":   "bower_components/Leaflet.SimpleMarkers/lib/Control.SimpleMarkers",
        // BASE DEPENDENCIES
        "jquery":            "bower_components/jquery/dist/jquery",
        "jquery.browser":    "bower_components/jquery.browser/dist/jquery.browser",
        "logging":           "bower_components/logging/src/logging",
        "pat-base":          "bower_components/patternslib/src/core/base",
        "pat-compat":        "bower_components/patternslib/src/core/compat",
        "pat-jquery-ext":    "bower_components/patternslib/src/core/jquery-ext",
        "pat-logger":        "bower_components/patternslib/src/core/logger",
        "pat-mockup-parser": "bower_components/patternslib/src/core/mockup-parser",
        "pat-parser":        "bower_components/patternslib/src/core/parser",
        "pat-registry":      "bower_components/patternslib/src/core/registry",
        "pat-utils":         "bower_components/patternslib/src/core/utils",
        "underscore":        "bower_components/underscore/underscore"

    },
    "shim": {
        "leaflet-fullscreen": { deps: ["leaflet"] },
        "leaflet-geosearch": { deps: ["leaflet"] },
        "leaflet-geosearch-bing": { deps: ["leaflet-geosearch"] },
        "leaflet-geosearch-esri": { deps: ["leaflet-geosearch"] },
        "leaflet-geosearch-google": { deps: ["leaflet-geosearch"] },
        "leaflet-geosearch-openstreetmap": { deps: ["leaflet-geosearch"] },
        "leaflet-markercluster": { deps: ["leaflet"] },
        "leaflet-awesomemarkers": { deps: ["leaflet"] },
        "leaflet-locatecontrol": { deps: ["leaflet"] },
        "leaflet-minimap": { deps: ["leaflet"] },
        "leaflet-sleep": { deps: ["leaflet"] },
        "leaflet-simplemarkers": { deps: ["leaflet"] },
        "logging": { "exports": "logging" }
    },
    wrapShim: true
});

require(["jquery", "pat-registry", "pat-leaflet"], function($, registry, pattern) {
    window.patterns = registry;
    $(document).ready(function() {
        registry.init();
    });
});
