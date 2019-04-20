# Changelog

## **1.4.0**

* Fix a problem with ``map_layers`` option when it's a list of ids and no title was generated for the baseLayers object.
  [thet]

* Add some nicer, opinionated styles for the popup close button.
  [thet]

* Add option to add some padding to ``fitBounds`` with a default of ``20``.
  This brings search result on corners more in the map.
  [thet]

* Add ``extraClasses`` property to marker icons creation.
  This allows for extra classes like a marker uuid to work with.
  [thet]


## **1.3.0**

* Add ``maxClusterRadius`` option for the marker cluster plugin. Default is 80 (pixels).
  [thet]

* Add ``color`` options to feature properties to explicitly set the marker color.
  ``color`` must be one of the predefined colors ``blue``, ``red``, ``darkred``, ``orange``, ``green``, ``darkgreen``, ``blue``, ``purple``, ``darkpurple``, ``cadetblue`` from https://github.com/lvoogdt/Leaflet.awesome-markers
  [thet]

* Add ``create_marker`` factory function instead of predefining "awesome marker" instances.
  [thet]


## **1.2.0**

* Fire ``moveend`` and ``zoomend`` on the pattern root element.
  [thet]


## **1.1.0**

* Allow optional arguments in pat-leaflet for tile providers that require registration (Fix https://github.com/plone/plone.patternslib/issues/24)
  [pbauer]

* Update bower dependencies to last working versions.
  [thet]


## **1.0.0 (2017-02-24)**

* Initial release.
  [thet]


## **0.0.1 (2016-01-11)**

* Start of everything.
  [thet]
