(function(root, factory) {
    if (typeof define === "function" && define.amd) {
        define([
            "jquery",
            "pat-base",
            "pat-registry",
            "pat-parser",
            "pat-logger",
            "leaflet",
            "leaflet-fullscreen",
            "leaflet-providers",
            "leaflet-geosearch",
            "leaflet-geosearch-bing",
            "leaflet-geosearch-esri",
            "leaflet-geosearch-google",
            "leaflet-geosearch-openstreetmap",
            "leaflet-markercluster",
            "leaflet-awesomemarkers",
            "leaflet-locatecontrol",
            "leaflet-minimap",
            "leaflet-sleep",
            "leaflet-simplemarkers"
        ], function() {
            return factory.apply(this, arguments);
        });
    } else {
        // If require.js is not available, you'll need to make sure that these
        // global variables are available.
        factory($, patterns.Base, patterns, patterns.Parser, patterns.logger,
            patterns.Leaflet, patterns.leaflet-fullscreen, patterns.leaflet-providers,
            patterns.leaflet-geosearch, patterns.leaflet-geosearch-bing,
            patterns.leaflet-geosearch-esri, patterns.leaflet-geosearch-google,
            patterns.leaflet-geosearch-openstreetmap,
            patterns.leaflet-markercluster, patterns.leaflet-awesomemarkers,
            patterns.leaflet-locatecontrol, patterns.leaflet-minimap, patterns.leaflet-sleep,
            patterns.leaflet-simplemarkers);
    }
}(this, function($, Base, registry, Parser, logger, L) {
    "use strict";

    var log = logger.getLogger("pat-leaflet");
    log.debug("pattern loaded");

    var parser = new Parser("leaflet");

    parser.addArgument("latitude", "0.0");
    parser.addArgument("longitude", "0.0");
    parser.addArgument("zoom", "1");

    // default controls
    parser.addArgument("fullscreencontrol", true);
    parser.addArgument("locatecontrol", true);
    parser.addArgument("zoomcontrol", true);

    // disabled controls
    parser.addArgument("autolocate", false);
    parser.addArgument("minimap", false);
    parser.addArgument("geosearch", false);
    parser.addArgument("geosearch_provider", "openstreetmap");
    parser.addArgument("addmarker", false);

    // map layers
    parser.addArgument("map_layers", [
        {"title": "Map", "id": "OpenStreetMap.Mapnik"},
        {"title": "Satellite", "id": "Esri.WorldImagery"},
        {"title": "Topographic", "id": "OpenTopoMap"},
        {"title": "Toner", "id": "Stamen.Toner"}
    ]);

    parser.addArgument("image_path", "src/bower_components/Leaflet.awesome-markers/dist/images");

    parser.addArgument("editable", false);
    parser.addArgument("input_latitude_selector", undefined);
    parser.addArgument("input_longitude_selector", undefined);

    return Base.extend({
        name: "leaflet",
        trigger: ".pat-leaflet",
        map: undefined,

        init: function initUndefined () {
            var options = this.options = parser.parse(this.$el);

            var baseLayers,
                geojson,
                marker_cluster,
                marker_layer,
                bounds,
                geosearch;

            // MAP INIT
            var map = this.map = new L.Map(this.$el[0], {
                fullscreenControl: options.fullscreencontrol,
                zoomControl: options.zoomcontrol,
                // Leaflet.Sleep options
                sleep: true,
                sleepNote: false,
                hoverToWake: false,
                sleepOpacity: 1
            });

            L.Icon.Default.imagePath = options.image_path;

            // Locatecontrol
            if (options.locatecontrol || options.autolocate) {
                var locatecontrol = L.control.locate({icon: "fa fa-crosshairs"}).addTo(map);
                if (options.autolocate) {
                    locatecontrol.start();
                }
            }

            // Layers
            // Must be an array
            if ($.isArray(options.map_layers)) {
                baseLayers = {};
                for (var cnt = 0; cnt < options.map_layers.length; cnt++) {
                    // build layers object with tileLayer instances
                    baseLayers[options.map_layers[cnt].title] = L.tileLayer.provider(options.map_layers[cnt].id);
                    if (cnt===0) {
                        baseLayers[options.map_layers[cnt].title].addTo(map); // default map
                    }
                }
                if (options.map_layers.length > 1) {
                    L.control.layers(baseLayers).addTo(map);
                }
            }

            // ADD MARKERS
            geojson = this.$el.data().geojson;
            if (geojson) {
                marker_cluster = new L.MarkerClusterGroup();
                marker_layer = L.geoJson(geojson, {
                    pointToLayer: function(feature, latlng) {
                        return L.marker(latlng, {
                            icon: this.green_marker,
                            draggable: feature.properties.editable
                        });
                    }.bind(this),
                    onEachFeature: this.bind_popup.bind(this),
                });
                marker_cluster.addLayer(marker_layer);
                map.addLayer(marker_cluster);

                // autozoom
                bounds = marker_cluster.getBounds();
                map.fitBounds(bounds);
            } else {
                map.setView(
                    [options.latitude, options.longitude],
                    options.zoom
                );
            }

            if (options.geosearch) {
                var provider;
                if (options.geosearch_provider === "esri") {
                    provider = new L.GeoSearch.Provider.Esri();
                } else if (options.geosearch_provider === "google") {
                    provider = new L.GeoSearch.Provider.Google();
                } else if (options.geosearch_provider === "bing") {
                    provider = new L.GeoSearch.Provider.Bing();
                } else {
                    provider = new L.GeoSearch.Provider.OpenStreetMap();
                }

                // GEOSEARCH
                geosearch = new L.Control.GeoSearch({
                    showMarker: true,
                    draggable: true,
                    provider: provider
                });
                geosearch.addTo(map);

                map.on("geosearch_showlocation", function(e) {
                    e.Marker.setIcon(this.red_marker);
                    this.bind_popup({properties: {editable: true, popup: "New Marker"}}, e.Marker).bind(this);
                }.bind(this));

            }

            if (options.addmarker) {
                var add_marker_callback = function (marker) {
                    this.bind_popup({properties: {editable: true}}, marker);
                };
                var addmarker = new L.Control.SimpleMarkers({
                    delete_control: false,
                    allow_popup: false,
                    marker_icon: this.red_marker,
                    marker_draggable: true,
                    add_marker_callback: add_marker_callback.bind(this)
                });
                map.addControl(addmarker);
            }

            // Minimap
            if (options.minimap) {
                var minimap = new L.Control.MiniMap(L.tileLayer.provider("OpenStreetMap.Mapnik"), {toggleDisplay: true, mapOptions: {sleep: false}}).addTo(map);
            }

            if (options.editable) {
                map.on("geosearch_showlocation", function(e) {
                    if (marker_cluster) {
                        map.removeLayer(marker_cluster);
                    }
                    var coords = e.Location;
                    this.update_inputs(coords.Y, coords.X);
                    this.bind_draggable_marker(e.Marker);
                });
            }

            log.debug("pattern initialized");
        },

        bind_popup: function(feature, marker) {
            var popup = feature.properties.popup;
            if (feature.properties.editable) {
                // for editable markers add "delete marker" link to popup
                popup = popup || "";
                var $popup = $("<div>" + popup + "</div><br/>");
                var $link = $("<a href='#' class='deleteMarker'>Delete Marker</a>");
                $link.on("click", function (e) {
                    e.preventDefault();
                    this.map.removeLayer(marker);
                }.bind(this));
                marker.bindPopup(
                    $("<div/>").append($popup).append($link)[0]
                );
            } else if (popup) {
                marker.bindPopup(popup);
            }
        },

        red_marker: L.AwesomeMarkers.icon({
            markerColor: "red",
            prefix: "fa",
            icon: "circle"
        }),
        green_marker: L.AwesomeMarkers.icon({
            markerColor: "green",
            prefix: "fa",
            icon: "circle"
        }),
        blue_marker: L.AwesomeMarkers.icon({
            markerColor: "blue",
            prefix: "fa",
            icon: "circle"
        }),

        update_inputs: function(lat, lng) {
            $(this.options.input_latitude_selector).attr("value", lat);
            $(this.options.input_longitude_selector).attr("value", lng);
        },

        bind_draggable_marker: function(marker) {
            marker.on("dragend", function(e) {
                var coords = e.target.getLatLng();
                this.update_inputs(coords.lat, coords.lng);
            });
        },

        create_markers: function(geopoints, editable) {
            // return MarkerClusterGroup from geopoints
            // geopoints = [{lat: NUMBER, lng: NUMBER, popup: STRING}]
            var markers = new L.MarkerClusterGroup();
            for (var i = 0, size = geopoints.length; i < size; i++) {
                var geopoint = geopoints[i],
                    marker;
                marker = new L.Marker([geopoint.lat, geopoint.lng], {
                    icon: this.green_marker,
                    draggable: editable
                });
                if (geopoint.popup) {
                    marker.bindPopup(geopoint.popup);
                }
                if (editable) {
                    this.bind_draggable_marker(marker);
                }
                markers.addLayer(marker);
            }
            return markers;
        }

    });
}));
