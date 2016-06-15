/* global module */
module.exports = function(grunt) {
    "use strict";

    var dest_path = "src/build/";

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),

        concat: {
            options: {
                separator: grunt.util.linefeed + grunt.util.linefeed
            },
            js: {
                src: [
                    "src/bower_components/leaflet/dist/leaflet-src.js",
                    "src/bower_components/Leaflet.fullscreen/dist/Leaflet.fullscreen.js",
                    "src/bower_components/leaflet-providers/leaflet-providers.js",
                    "src/bower_components/L.GeoSearch/src/js/l.control.geosearch.js",
                    "src/bower_components/L.GeoSearch/src/js/l.geosearch.provider.esri.js",
                    "src/bower_components/leaflet.markercluster/dist/leaflet.markercluster-src.js",
                    "src/bower_components/Leaflet.awesome-markers/dist/leaflet.awesome-markers.js",
                    "src/bower_components/leaflet.locatecontrol/src/L.Control.Locate.js",
                    "src/bower_components/Leaflet-MiniMap/dist/Control.MiniMap.min.js",
                    "src/bower_components/Leaflet.Sleep/Leaflet.Sleep.js",
                    "src/bower_components/Leaflet.SimpleMarkers/lib/Control.SimpleMarkers.js"
                ],
                dest: dest_path + "libs.js"
            },
            css: {
                src: [
                    "src/bower_components/leaflet/dist/leaflet.css",
                    "src/bower_components/Leaflet.fullscreen/dist/leaflet.fullscreen.css",
                    "src/bower_components/L.GeoSearch/src/css/l.geosearch.css",
                    "src/bower_components/leaflet.markercluster/dist/MarkerCluster.Default.css",
                    "src/bower_components/leaflet.markercluster/dist/MarkerCluster.css",
                    "src/bower_components/Leaflet.awesome-markers/dist/leaflet.awesome-markers.css",
                    "src/bower_components/leaflet.locatecontrol/dist/L.Control.Locate.css",
                    "src/bower_components/font-awesome/css/font-awesome.css",
                    "src/bower_components/Leaflet-MiniMap/dist/Control.MiniMap.min.css",
                    "src/bower_components/Leaflet.SimpleMarkers/lib/Control.SimpleMarkers.css"
                ],
                dest: dest_path + "libs.css"
            }
        },

        uglify: {
            default: {
                options: {
                    sourceMap: true,
                    sourceMapName: dest_path + "libs.min.js.map",
                    sourceMapIncludeSources: false
                },
                files: {
                    "src/build/libs.min.js": [
                        dest_path + "libs.js"
                    ]
                }
            }
        },

        copy: {
            main: {
                files: [{
                    expand: true,
                    cwd: "src/bower_components/leaflet/dist/images/",
                    src: ["**"],
                    dest: dest_path + "images/"
                }, {
                    expand: true,
                    cwd: "src/bower_components/Leaflet.fullscreen/dist/",
                    src: ["*.png"],
                    dest: dest_path + "images/"
                }, {
                    expand: true,
                    cwd: "src/bower_components/Leaflet.awesome-markers/dist/images/",
                    src: ["*.png"],
                    dest: dest_path + "images/"
                }, {
                    expand: true,
                    cwd: "src/bower_components/Leaflet-MiniMap/dist/images/",
                    src: ["**"],
                    dest: dest_path + "images/"
                }, {
                    expand: true,
                    cwd: "src/bower_components/font-awesome/fonts/",
                    src: ["**"],
                    dest: dest_path + "fonts/"
                }]
            }
        },

        sed: {
            "leaflet-fullscreen-1": {
                path: dest_path + "libs.css",
                pattern: "fullscreen.png",
                replacement: "images/fullscreen.png"
            },
            "leaflet-fullscreen-2": {
                path: dest_path + "libs.css",
                pattern: "fullscreen@2x.png",
                replacement: "images/fullscreen@2x.png"
            },
            "fontawesome": {
                path: dest_path + "libs.css",
                pattern: "../fonts/fontawesome",
                replacement: "fonts/fontawesome"
            }
        }

    });

    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-sed");

    // Default task(s).
    grunt.registerTask("default", ["concat", "uglify", "copy", "sed"]);

};
