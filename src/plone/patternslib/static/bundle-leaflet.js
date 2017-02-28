/* Patterns bundle configuration.
 */
require([
    'jquery',
    'pat-registry',
    'pat-leaflet'
], function($, registry) {
    'use strict';

    // initialize only if we are in top frame
    if (window.parent === window) {
        $(document).ready(function() {
            $('body').addClass('bundle-leaflet');
            if (!registry.initialized) {
                registry.init();
            }
        });
    }

});
