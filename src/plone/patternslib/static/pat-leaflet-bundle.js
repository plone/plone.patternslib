define('pat-leaflet-bundle', [
    "pat-registry",
    "pat-leaflet"
], function(registry) {
  "use strict";
    if (!registry.initialized) {
        registry.init();
    }
});

require(['pat-leaflet-bundle']);
