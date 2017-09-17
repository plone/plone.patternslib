/* Patterns bundle configuration.
 */
require([
    'jquery',
    // Conflicts with pat-autotoc
    // 'pat-legend',
    'pat-registry',
    'modernizr',
    'pat-ajax',
    'pat-auto-scale',
    'pat-auto-submit',
    'pat-auto-suggest',
    'pat-bumper',
    'pat-checked-flag',
    'pat-checklist',
    'pat-clone',
    'pat-collapsible',
    'pat-date-picker',
    'pat-datetime-picker',
    'pat-depends',
    'pat-equaliser',
    'pat-expandable',
    'pat-focus',
    'pat-form-state',
    'pat-forward',
    'pat-inject',
    'pat-input-change-events',
    'pat-masonry',
    'pat-markdown',
    'pat-menu',
    'pat-modal',
    'pat-navigation',
    'pat-placeholder',
    'pat-scroll',
    'pat-selectbox',
    'pat-stacks',
    'pat-sticky',
    'pat-switch',
    'pat-zoom'
], function($, registry) {
    'use strict';

    // initialize only if we are in top frame
    if (window.parent === window) {
        $(document).ready(function() {
            $('body').addClass('bundle-patterns');
            if (!registry.initialized) {
                registry.init();
            }
        });
    }

});
