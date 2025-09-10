/*
 * Patternslib pre-initialization.
 * This removes some patterns from being auto-initialized:
 * */

window.__patternslib_patterns_blacklist = [
    "legend", // Transforms <legend> to <p>, breaks pat-autotoc form tabbing.
    // Duplicates
    // These patterns are loaded after the Mockup versions, so they are not
    // initialized and do not need to be blacklisted.
    //"sortable",
    //"toggle",
];
