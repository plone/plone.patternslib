(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([
            'jquery',
            'pat-base',
            'pat-registry',
            'pat-parser',
            'pat-logger',
            'leaflet',
            'leaflet-fullscreen',
            'leaflet-providers',
            'leaflet-geosearch',
            'leaflet-geosearch-bing',
            'leaflet-geosearch-esri',
            'leaflet-geosearch-google',
            'leaflet-geosearch-openstreetmap',
            'leaflet-markercluster',
            'leaflet-awesomemarkers',
            'leaflet-locatecontrol',
            'leaflet-minimap',
            'leaflet-sleep',
            'leaflet-simplemarkers'
        ], function() {
            return factory.apply(this, arguments);
        });
    } else {
        // If require.js is not available, you'll need to make sure that these
        // global variables are available.
        factory($, patterns.Base, patterns, patterns.Parser, patterns.logger,
            patterns.Leaflet, patterns['leaflet-fullscreen'], patterns['leaflet-providers'],
            patterns['leaflet-geosearch'], patterns['leaflet-geosearch-bing'],
            patterns['leaflet-geosearch-esri'], patterns['leaflet-geosearch-google'],
            patterns['leaflet-geosearch-openstreetmap'],
            patterns['leaflet-markercluster'], patterns['leaflet-awesomemarkers'],
            patterns['leaflet-locatecontrol'], patterns['leaflet-minimap'], patterns['leaflet-sleep'],
            patterns['leaflet-simplemarkers']);
    }
}(this, function($, Base, registry, Parser, logger, L) {
    'use strict';

    var log = logger.getLogger('pat-leaflet');
    log.debug('pattern loaded');

    var parser = new Parser('leaflet');

    parser.addArgument('latitude', '0.0');
    parser.addArgument('longitude', '0.0');
    parser.addArgument('zoom', '14');

    parser.addArgument('maxClusterRadius', '80');

    parser.addArgument('boundsPadding', '20');

    // default controls
    parser.addArgument('fullscreencontrol', true);
    parser.addArgument('zoomcontrol', true);

    // disabled controls
    parser.addArgument('addmarker', false);
    parser.addArgument('autolocate', false);
    parser.addArgument('geosearch', false);
    parser.addArgument('geosearch_provider', 'openstreetmap');
    parser.addArgument('locatecontrol', false);
    parser.addArgument('minimap', false);

    // map layers
    parser.addArgument('default_map_layer', {'id': 'OpenStreetMap.Mapnik', 'options': {}});
    parser.addArgument('map_layers', [
        {'title': 'Map', 'id': 'OpenStreetMap.Mapnik', 'options': {}},
        {'title': 'Satellite', 'id': 'Esri.WorldImagery', 'options': {}},
        {'title': 'Topographic', 'id': 'OpenTopoMap', 'options': {}},
        {'title': 'Toner', 'id': 'Stamen.Toner', 'options': {}}
    ]);

    parser.addArgument('image_path', 'src/bower_components/Leaflet.awesome-markers/dist/images');

    return Base.extend({
        name: 'leaflet',
        trigger: '.pat-leaflet',
        map: undefined,

        init: function initUndefined() {
            var options = this.options = parser.parse(this.$el);

            var fitBoundsOptions = this.fitBoundsOptions = {
                maxZoom: options.zoom,
                padding: [
                    parseInt(options.boundsPadding),
                    parseInt(options.boundsPadding)
                ]
            }

            var baseLayers,
                geojson,
                geosearch;

            // initialize main_marker
            this.main_marker = null;

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

            var marker_cluster = this.marker_cluster = new L.MarkerClusterGroup({
                'maxClusterRadius': this.options.maxClusterRadius
            });

            // hand over some map events to the element
            map.on('moveend zoomend', function(e) {
                this.$el.trigger('leaflet.' + e.type, {original_event: e});
            }.bind(this));

            L.Icon.Default.imagePath = options.image_path;

            // Locatecontrol
            if (options.locatecontrol || options.autolocate) {
                var locatecontrol = L.control.locate({icon: 'fa fa-crosshairs'}).addTo(map);
                if (options.autolocate) {
                    locatecontrol.start();
                }
            }

            // Layers
            // Must be an array
            if ($.isArray(options.map_layers)) {
                baseLayers = {};

                // Convert map_layers elements from string to objects, if necesarry
                options.map_layers = options.map_layers.map(function(it) {
                    if (typeof (it) == 'string') {
                        it = {id: it, title: it, options: {}};
                    }
                    return it;
                });
                for (var cnt = 0; cnt < options.map_layers.length; cnt++) {
                    // build layers object with tileLayer instances
                    var layer = options.map_layers[cnt];
                    baseLayers[layer.title] = L.tileLayer.provider(layer.id, layer.options);
                }
                if (options.map_layers.length > 1) {
                    L.control.layers(baseLayers).addTo(map);
                }
            }

            if (typeof (options.default_map_layer) == 'string') {
                options.default_map_layer = {id: options.default_map_layer, options: {}}
            }
            L.tileLayer.provider(options.default_map_layer.id, options.default_map_layer.options).addTo(map);

            var latlng = [options.latitude || 0.0, options.longitude || 0.0]

            // INIT MAP
            map.setView(latlng, options.zoom);

            // ADD MARKERS
            geojson = this.$el.data().geojson;

            if (geojson) {
                if ((typeof (geojson) === 'string') && (geojson.indexOf(".json") != -1)) {
                    // suppose this is a JSON url which ends with ".json" ... try to load it
                    var self = this;
                    $.ajax({
                        url: geojson,
                        beforeSend: function() {
                            self.$el.trigger('leaflet.geojson.load', {});
                        },
                        success: function(data) {
                            self.init_geojson(map, data);
                            self.$el.trigger('leaflet.geojson.loaded', {status: "success", data: data});
                        },
                        error: function(xhr, status, msg) {
                            self.$el.trigger('leaflet.geojson.loaded', {status: status, data: msg});
                        }
                    });
                } else {
                    // inject inline geoJSON data object
                    this.init_geojson(map, geojson);
                }
            } else {
                // no geojson data is given. place one editable marker to current latitude/longitude
                var marker = L.marker(latlng, {
                    icon: this.create_marker(),
                    draggable: true
                });
                this.widget_marker_events(marker)
                map.addControl(marker);
            }

            if (options.geosearch) {
                var provider, self = this;
                if (options.geosearch_provider === 'esri') {
                    provider = new L.GeoSearch.Provider.Esri();
                } else if (options.geosearch_provider === 'google') {
                    provider = new L.GeoSearch.Provider.Google();
                } else if (options.geosearch_provider === 'bing') {
                    provider = new L.GeoSearch.Provider.Bing();
                } else {
                    provider = new L.GeoSearch.Provider.OpenStreetMap();
                }

                // GEOSEARCH
                geosearch = new L.Control.GeoSearch({
                    showMarker: this.main_marker === null,
                    draggable: true,
                    provider: provider
                });
                geosearch.addTo(map);

                map.on('geosearch_showlocation', function(e) {
                    if (self.main_marker && self.main_marker.feature.properties.editable) {
                        var latlng = {lat: e.Location.Y, lng: e.Location.X};
                        // update, otherwise screen is blank.
                        marker_cluster.removeLayer(self.main_marker);
                        self.main_marker.setLatLng(latlng).update();
                        marker_cluster.addLayer(self.main_marker);
                        // fit to window
                        map.fitBounds([latlng], fitBoundsOptions);
                    } else {
                        e.Marker.setIcon(self.create_marker('red'));
                        self.bind_popup({properties: {editable: true, popup: 'New Marker'}}, e.Marker).bind(self);
                    }
                }.bind(this));

            }

            if (options.addmarker) {
                var self = this;
                var add_marker_callback = function(marker) {
                    this.bind_popup({properties: {editable: true}}, marker);
                };
                var addmarker = new L.Control.SimpleMarkers({
                    delete_control: false,
                    allow_popup: false,
                    marker_icon: this.create_marker('red'),
                    marker_draggable: true,
                    add_marker_callback: add_marker_callback.bind(this)
                });
                map.addControl(addmarker);
            }

            map.on('locationfound', function(e) {
                if (self.main_marker && self.main_marker.feature.properties.editable) {
                    // update, otherwise screen is blank.
                    marker_cluster.removeLayer(self.main_marker);
                    self.main_marker.setLatLng({lat: e.latlng.lat, lng: e.latlng.lng});
                    marker_cluster.addLayer(self.main_marker);
                }
                map.fitBounds([e.latlng], fitBoundsOptions);
            });

            // Minimap
            if (options.minimap) {
                var minimap = new L.Control.MiniMap(L.tileLayer.provider(options.default_map_layer.id, options.default_map_layer.options), {toggleDisplay: true, mapOptions: {sleep: false}}).addTo(map);
            }

            log.debug('pattern initialized');
        },

        init_geojson: function(map, geojson) {
            var self = this, bounds, marker_layer;
            marker_layer = L.geoJson(geojson, {
                pointToLayer: function(feature, latlng) {
                    var extraClasses = feature.properties.extraClasses || '';
                    var markerColor = 'green';
                    if (feature.properties.color) {
                        markerColor = feature.properties.color;
                    } else if (!self.main_marker || feature.properties.main) {
                        markerColor = 'red';
                    }
                    var marker_icon = self.create_marker(markerColor, extraClasses);
                    var marker = L.marker(latlng, {
                        icon: marker_icon,
                        draggable: feature.properties.editable
                    });
                    if (!self.main_marker || feature.properties.main) {
                        // Set main marker. This is the one, which is used
                        // for setting the search result marker.
                        self.widget_marker_events(marker)
                        self.main_marker = marker;
                    }
                    return marker;
                }.bind(self),
                onEachFeature: self.bind_popup.bind(self),
            });
            self.marker_cluster.addLayer(marker_layer);
            map.addLayer(self.marker_cluster);

            // autozoom
            bounds = self.marker_cluster.getBounds();
            map.fitBounds(bounds, self.fitBoundsOptions);
        },

        bind_popup: function(feature, marker) {
            var popup = feature.properties.popup;
            if (feature.properties.editable && !feature.properties.no_delete) {
                // for editable markers add "delete marker" link to popup
                popup = popup || '';
                var $popup = $('<div>' + popup + '</div><br/>');
                var $link = $('<a href=\'#\' class=\'deleteMarker\'>Delete Marker</a>');
                $link.on('click', function(e) {
                    e.preventDefault();
                    this.map.removeLayer(marker);
                    marker = undefined;
                }.bind(this));
                marker.bindPopup(
                    $('<div/>').append($popup).append($link)[0]
                );
            } else if (popup) {
                marker.bindPopup(popup);
            }
        },

        create_marker: function(color, extraClasses) {
            color = color || 'red';
            extraClasses = extraClasses || '';
            return L.AwesomeMarkers.icon({
                markerColor: color,
                prefix: 'fa',
                icon: 'circle',
                extraClasses: extraClasses
            });
        },

        // this is the input marker for geolocation widget
        widget_marker_events: function(marker) {
            var self = this, $geolocation_wrapper = self.$el.parents("div.geolocation_wrapper.edit");
            var $latinput = $geolocation_wrapper.find("input.latitude");
            var $lnginput = $geolocation_wrapper.find("input.longitude");

            if (($latinput.lenght == 0) || ($lnginput.length == 0)) {
                return;
            }

            // update inputs on marker move
            marker.on('dragend move', function(e) {
                var latlng = e.target.getLatLng();
                $latinput.val(latlng.lat);
                $lnginput.val(latlng.lng);
            });
            // update marker on latitude change
            $latinput.on('change', function(e) {
                var latlng = marker.getLatLng();
                self.marker_cluster.removeLayer(marker);
                marker.setLatLng({lat: $(e.target).val(), lng: latlng.lng}).update();
                self.marker_cluster.addLayer(marker);
                // fit bounds
                bounds = self.marker_cluster.getBounds();
                map.fitBounds(bounds, self.fitBoundsOptions);
            });
            // update marker on longitude change
            $lnginput.on('change', function(e) {
                var latlng = marker.getLatLng();
                self.marker_cluster.removeLayer(marker);
                marker.setLatLng({lat: latlng.lat, lng: $(e.target).val()}).update();
                self.marker_cluster.addLayer(marker);
                // fit bounds
                bounds = self.marker_cluster.getBounds();
                map.fitBounds(bounds, self.fitBoundsOptions);
            });
        }

    });
}));
