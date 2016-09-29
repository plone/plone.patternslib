/* Patterns bundle configuration.
 *
 * This file is used to tell r.js which Patterns to load when it generates a
 * bundle. This is only used when generating a full Patterns bundle, or when
 * you want a simple way to include all patterns in your own project. If you
 * only want to use selected patterns you will need to pull in the patterns
 * directly in your RequireJS configuration.
 */
define('patterns', [
    "pat-registry",
    "modernizr",
    "pat-ajax",
    "pat-auto-scale",
    "pat-auto-submit",
    "pat-auto-suggest",
    "pat-bumper",
    "pat-checked-flag",
    "pat-checklist",
    "pat-clone",
    "pat-collapsible",
    "pat-depends",
    "pat-equaliser",
    "pat-expandable",
    "pat-focus",
    "pat-form-state",
    "pat-forward",
    "pat-inject",
    "pat-input-change-events",

/* Conflicts with pat-autotoc */
/*    "pat-legend",  */

    "pat-masonry",
    "pat-markdown",
    "pat-menu",
    "pat-modal",
    "pat-navigation",
    "pat-placeholder",
    "pat-scroll",
    "pat-selectbox",
    "pat-stacks",
    "pat-switch",
    "pat-zoom"
], function(registry) {
    window.patterns = registry;
    registry.init();
    return registry;
});

// (function(root) {
//     require(['patterns'], function (patterns) {
//         //patterns is now loaded.
//     });
// })(window);
