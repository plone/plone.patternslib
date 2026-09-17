/*
 * Patternslib pre-initialization.
 * This removes some patterns from being auto-initialized:
 * */
window.__patternslib_patterns_blacklist = (
    window.__patternslib_patterns_blacklist || []
).concat([
    // Transforms <legend> to <p>, breaks pat-autotoc form tabbing.
    "legend",
    //
    // Duplicates
    // These patterns are loaded after the Mockup versions, so they are not
    // initialized and do not need to be blacklisted.
    //"sortable",
    //"toggle",
]);
