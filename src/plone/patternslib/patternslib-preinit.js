/*
 * Patternslib pre-initialization.
 * This removes some patterns from being auto-initialized:
 * */

window.__patternslib_patterns_blacklist = [
    "legend", // Transforms <legend> to <p>, breaks pat-autotoc form tabbing.
    // Duplicates
    //"modal",
    //"sortable",
    //"toggle",
];
