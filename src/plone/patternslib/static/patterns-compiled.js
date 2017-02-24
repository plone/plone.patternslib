(function(root) {
define("modernizr", [], function() {
  return (function() {
/*!
 * Modernizr v2.8.3
 * www.modernizr.com
 *
 * Copyright (c) Faruk Ates, Paul Irish, Alex Sexton
 * Available under the BSD and MIT licenses: www.modernizr.com/license/
 */

/*
 * Modernizr tests which native CSS3 and HTML5 features are available in
 * the current UA and makes the results available to you in two ways:
 * as properties on a global Modernizr object, and as classes on the
 * <html> element. This information allows you to progressively enhance
 * your pages with a granular level of control over the experience.
 *
 * Modernizr has an optional (not included) conditional resource loader
 * called Modernizr.load(), based on Yepnope.js (yepnopejs.com).
 * To get a build that includes Modernizr.load(), as well as choosing
 * which tests to include, go to www.modernizr.com/download/
 *
 * Authors        Faruk Ates, Paul Irish, Alex Sexton
 * Contributors   Ryan Seddon, Ben Alman
 */

window.Modernizr = (function( window, document, undefined ) {

    var version = '2.8.3',

    Modernizr = {},

    /*>>cssclasses*/
    // option for enabling the HTML classes to be added
    enableClasses = true,
    /*>>cssclasses*/

    docElement = document.documentElement,

    /**
     * Create our "modernizr" element that we do most feature tests on.
     */
    mod = 'modernizr',
    modElem = document.createElement(mod),
    mStyle = modElem.style,

    /**
     * Create the input element for various Web Forms feature tests.
     */
    inputElem /*>>inputelem*/ = document.createElement('input') /*>>inputelem*/ ,

    /*>>smile*/
    smile = ':)',
    /*>>smile*/

    toString = {}.toString,

    // TODO :: make the prefixes more granular
    /*>>prefixes*/
    // List of property values to set for css tests. See ticket #21
    prefixes = ' -webkit- -moz- -o- -ms- '.split(' '),
    /*>>prefixes*/

    /*>>domprefixes*/
    // Following spec is to expose vendor-specific style properties as:
    //   elem.style.WebkitBorderRadius
    // and the following would be incorrect:
    //   elem.style.webkitBorderRadius

    // Webkit ghosts their properties in lowercase but Opera & Moz do not.
    // Microsoft uses a lowercase `ms` instead of the correct `Ms` in IE8+
    //   erik.eae.net/archives/2008/03/10/21.48.10/

    // More here: github.com/Modernizr/Modernizr/issues/issue/21
    omPrefixes = 'Webkit Moz O ms',

    cssomPrefixes = omPrefixes.split(' '),

    domPrefixes = omPrefixes.toLowerCase().split(' '),
    /*>>domprefixes*/

    /*>>ns*/
    ns = {'svg': 'http://www.w3.org/2000/svg'},
    /*>>ns*/

    tests = {},
    inputs = {},
    attrs = {},

    classes = [],

    slice = classes.slice,

    featureName, // used in testing loop


    /*>>teststyles*/
    // Inject element with style element and some CSS rules
    injectElementWithStyles = function( rule, callback, nodes, testnames ) {

      var style, ret, node, docOverflow,
          div = document.createElement('div'),
          // After page load injecting a fake body doesn't work so check if body exists
          body = document.body,
          // IE6 and 7 won't return offsetWidth or offsetHeight unless it's in the body element, so we fake it.
          fakeBody = body || document.createElement('body');

      if ( parseInt(nodes, 10) ) {
          // In order not to give false positives we create a node for each test
          // This also allows the method to scale for unspecified uses
          while ( nodes-- ) {
              node = document.createElement('div');
              node.id = testnames ? testnames[nodes] : mod + (nodes + 1);
              div.appendChild(node);
          }
      }

      // <style> elements in IE6-9 are considered 'NoScope' elements and therefore will be removed
      // when injected with innerHTML. To get around this you need to prepend the 'NoScope' element
      // with a 'scoped' element, in our case the soft-hyphen entity as it won't mess with our measurements.
      // msdn.microsoft.com/en-us/library/ms533897%28VS.85%29.aspx
      // Documents served as xml will throw if using &shy; so use xml friendly encoded version. See issue #277
      style = ['&#173;','<style id="s', mod, '">', rule, '</style>'].join('');
      div.id = mod;
      // IE6 will false positive on some tests due to the style element inside the test div somehow interfering offsetHeight, so insert it into body or fakebody.
      // Opera will act all quirky when injecting elements in documentElement when page is served as xml, needs fakebody too. #270
      (body ? div : fakeBody).innerHTML += style;
      fakeBody.appendChild(div);
      if ( !body ) {
          //avoid crashing IE8, if background image is used
          fakeBody.style.background = '';
          //Safari 5.13/5.1.4 OSX stops loading if ::-webkit-scrollbar is used and scrollbars are visible
          fakeBody.style.overflow = 'hidden';
          docOverflow = docElement.style.overflow;
          docElement.style.overflow = 'hidden';
          docElement.appendChild(fakeBody);
      }

      ret = callback(div, rule);
      // If this is done after page load we don't want to remove the body so check if body exists
      if ( !body ) {
          fakeBody.parentNode.removeChild(fakeBody);
          docElement.style.overflow = docOverflow;
      } else {
          div.parentNode.removeChild(div);
      }

      return !!ret;

    },
    /*>>teststyles*/

    /*>>mq*/
    // adapted from matchMedia polyfill
    // by Scott Jehl and Paul Irish
    // gist.github.com/786768
    testMediaQuery = function( mq ) {

      var matchMedia = window.matchMedia || window.msMatchMedia;
      if ( matchMedia ) {
        return matchMedia(mq) && matchMedia(mq).matches || false;
      }

      var bool;

      injectElementWithStyles('@media ' + mq + ' { #' + mod + ' { position: absolute; } }', function( node ) {
        bool = (window.getComputedStyle ?
                  getComputedStyle(node, null) :
                  node.currentStyle)['position'] == 'absolute';
      });

      return bool;

     },
     /*>>mq*/


    /*>>hasevent*/
    //
    // isEventSupported determines if a given element supports the given event
    // kangax.github.com/iseventsupported/
    //
    // The following results are known incorrects:
    //   Modernizr.hasEvent("webkitTransitionEnd", elem) // false negative
    //   Modernizr.hasEvent("textInput") // in Webkit. github.com/Modernizr/Modernizr/issues/333
    //   ...
    isEventSupported = (function() {

      var TAGNAMES = {
        'select': 'input', 'change': 'input',
        'submit': 'form', 'reset': 'form',
        'error': 'img', 'load': 'img', 'abort': 'img'
      };

      function isEventSupported( eventName, element ) {

        element = element || document.createElement(TAGNAMES[eventName] || 'div');
        eventName = 'on' + eventName;

        // When using `setAttribute`, IE skips "unload", WebKit skips "unload" and "resize", whereas `in` "catches" those
        var isSupported = eventName in element;

        if ( !isSupported ) {
          // If it has no `setAttribute` (i.e. doesn't implement Node interface), try generic element
          if ( !element.setAttribute ) {
            element = document.createElement('div');
          }
          if ( element.setAttribute && element.removeAttribute ) {
            element.setAttribute(eventName, '');
            isSupported = is(element[eventName], 'function');

            // If property was created, "remove it" (by setting value to `undefined`)
            if ( !is(element[eventName], 'undefined') ) {
              element[eventName] = undefined;
            }
            element.removeAttribute(eventName);
          }
        }

        element = null;
        return isSupported;
      }
      return isEventSupported;
    })(),
    /*>>hasevent*/

    // TODO :: Add flag for hasownprop ? didn't last time

    // hasOwnProperty shim by kangax needed for Safari 2.0 support
    _hasOwnProperty = ({}).hasOwnProperty, hasOwnProp;

    if ( !is(_hasOwnProperty, 'undefined') && !is(_hasOwnProperty.call, 'undefined') ) {
      hasOwnProp = function (object, property) {
        return _hasOwnProperty.call(object, property);
      };
    }
    else {
      hasOwnProp = function (object, property) { /* yes, this can give false positives/negatives, but most of the time we don't care about those */
        return ((property in object) && is(object.constructor.prototype[property], 'undefined'));
      };
    }

    // Adapted from ES5-shim https://github.com/kriskowal/es5-shim/blob/master/es5-shim.js
    // es5.github.com/#x15.3.4.5

    if (!Function.prototype.bind) {
      Function.prototype.bind = function bind(that) {

        var target = this;

        if (typeof target != "function") {
            throw new TypeError();
        }

        var args = slice.call(arguments, 1),
            bound = function () {

            if (this instanceof bound) {

              var F = function(){};
              F.prototype = target.prototype;
              var self = new F();

              var result = target.apply(
                  self,
                  args.concat(slice.call(arguments))
              );
              if (Object(result) === result) {
                  return result;
              }
              return self;

            } else {

              return target.apply(
                  that,
                  args.concat(slice.call(arguments))
              );

            }

        };

        return bound;
      };
    }

    /**
     * setCss applies given styles to the Modernizr DOM node.
     */
    function setCss( str ) {
        mStyle.cssText = str;
    }

    /**
     * setCssAll extrapolates all vendor-specific css strings.
     */
    function setCssAll( str1, str2 ) {
        return setCss(prefixes.join(str1 + ';') + ( str2 || '' ));
    }

    /**
     * is returns a boolean for if typeof obj is exactly type.
     */
    function is( obj, type ) {
        return typeof obj === type;
    }

    /**
     * contains returns a boolean for if substr is found within str.
     */
    function contains( str, substr ) {
        return !!~('' + str).indexOf(substr);
    }

    /*>>testprop*/

    // testProps is a generic CSS / DOM property test.

    // In testing support for a given CSS property, it's legit to test:
    //    `elem.style[styleName] !== undefined`
    // If the property is supported it will return an empty string,
    // if unsupported it will return undefined.

    // We'll take advantage of this quick test and skip setting a style
    // on our modernizr element, but instead just testing undefined vs
    // empty string.

    // Because the testing of the CSS property names (with "-", as
    // opposed to the camelCase DOM properties) is non-portable and
    // non-standard but works in WebKit and IE (but not Gecko or Opera),
    // we explicitly reject properties with dashes so that authors
    // developing in WebKit or IE first don't end up with
    // browser-specific content by accident.

    function testProps( props, prefixed ) {
        for ( var i in props ) {
            var prop = props[i];
            if ( !contains(prop, "-") && mStyle[prop] !== undefined ) {
                return prefixed == 'pfx' ? prop : true;
            }
        }
        return false;
    }
    /*>>testprop*/

    // TODO :: add testDOMProps
    /**
     * testDOMProps is a generic DOM property test; if a browser supports
     *   a certain property, it won't return undefined for it.
     */
    function testDOMProps( props, obj, elem ) {
        for ( var i in props ) {
            var item = obj[props[i]];
            if ( item !== undefined) {

                // return the property name as a string
                if (elem === false) return props[i];

                // let's bind a function
                if (is(item, 'function')){
                  // default to autobind unless override
                  return item.bind(elem || obj);
                }

                // return the unbound function or obj or value
                return item;
            }
        }
        return false;
    }

    /*>>testallprops*/
    /**
     * testPropsAll tests a list of DOM properties we want to check against.
     *   We specify literally ALL possible (known and/or likely) properties on
     *   the element including the non-vendor prefixed one, for forward-
     *   compatibility.
     */
    function testPropsAll( prop, prefixed, elem ) {

        var ucProp  = prop.charAt(0).toUpperCase() + prop.slice(1),
            props   = (prop + ' ' + cssomPrefixes.join(ucProp + ' ') + ucProp).split(' ');

        // did they call .prefixed('boxSizing') or are we just testing a prop?
        if(is(prefixed, "string") || is(prefixed, "undefined")) {
          return testProps(props, prefixed);

        // otherwise, they called .prefixed('requestAnimationFrame', window[, elem])
        } else {
          props = (prop + ' ' + (domPrefixes).join(ucProp + ' ') + ucProp).split(' ');
          return testDOMProps(props, prefixed, elem);
        }
    }
    /*>>testallprops*/


    /**
     * Tests
     * -----
     */

    // The *new* flexbox
    // dev.w3.org/csswg/css3-flexbox

    tests['flexbox'] = function() {
      return testPropsAll('flexWrap');
    };

    // The *old* flexbox
    // www.w3.org/TR/2009/WD-css3-flexbox-20090723/

    tests['flexboxlegacy'] = function() {
        return testPropsAll('boxDirection');
    };

    // On the S60 and BB Storm, getContext exists, but always returns undefined
    // so we actually have to call getContext() to verify
    // github.com/Modernizr/Modernizr/issues/issue/97/

    tests['canvas'] = function() {
        var elem = document.createElement('canvas');
        return !!(elem.getContext && elem.getContext('2d'));
    };

    tests['canvastext'] = function() {
        return !!(Modernizr['canvas'] && is(document.createElement('canvas').getContext('2d').fillText, 'function'));
    };

    // webk.it/70117 is tracking a legit WebGL feature detect proposal

    // We do a soft detect which may false positive in order to avoid
    // an expensive context creation: bugzil.la/732441

    tests['webgl'] = function() {
        return !!window.WebGLRenderingContext;
    };

    /*
     * The Modernizr.touch test only indicates if the browser supports
     *    touch events, which does not necessarily reflect a touchscreen
     *    device, as evidenced by tablets running Windows 7 or, alas,
     *    the Palm Pre / WebOS (touch) phones.
     *
     * Additionally, Chrome (desktop) used to lie about its support on this,
     *    but that has since been rectified: crbug.com/36415
     *
     * We also test for Firefox 4 Multitouch Support.
     *
     * For more info, see: modernizr.github.com/Modernizr/touch.html
     */

    tests['touch'] = function() {
        var bool;

        if(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
          bool = true;
        } else {
          injectElementWithStyles(['@media (',prefixes.join('touch-enabled),('),mod,')','{#modernizr{top:9px;position:absolute}}'].join(''), function( node ) {
            bool = node.offsetTop === 9;
          });
        }

        return bool;
    };


    // geolocation is often considered a trivial feature detect...
    // Turns out, it's quite tricky to get right:
    //
    // Using !!navigator.geolocation does two things we don't want. It:
    //   1. Leaks memory in IE9: github.com/Modernizr/Modernizr/issues/513
    //   2. Disables page caching in WebKit: webk.it/43956
    //
    // Meanwhile, in Firefox < 8, an about:config setting could expose
    // a false positive that would throw an exception: bugzil.la/688158

    tests['geolocation'] = function() {
        return 'geolocation' in navigator;
    };


    tests['postmessage'] = function() {
      return !!window.postMessage;
    };


    // Chrome incognito mode used to throw an exception when using openDatabase
    // It doesn't anymore.
    tests['websqldatabase'] = function() {
      return !!window.openDatabase;
    };

    // Vendors had inconsistent prefixing with the experimental Indexed DB:
    // - Webkit's implementation is accessible through webkitIndexedDB
    // - Firefox shipped moz_indexedDB before FF4b9, but since then has been mozIndexedDB
    // For speed, we don't test the legacy (and beta-only) indexedDB
    tests['indexedDB'] = function() {
      return !!testPropsAll("indexedDB", window);
    };

    // documentMode logic from YUI to filter out IE8 Compat Mode
    //   which false positives.
    tests['hashchange'] = function() {
      return isEventSupported('hashchange', window) && (document.documentMode === undefined || document.documentMode > 7);
    };

    // Per 1.6:
    // This used to be Modernizr.historymanagement but the longer
    // name has been deprecated in favor of a shorter and property-matching one.
    // The old API is still available in 1.6, but as of 2.0 will throw a warning,
    // and in the first release thereafter disappear entirely.
    tests['history'] = function() {
      return !!(window.history && history.pushState);
    };

    tests['draganddrop'] = function() {
        var div = document.createElement('div');
        return ('draggable' in div) || ('ondragstart' in div && 'ondrop' in div);
    };

    // FF3.6 was EOL'ed on 4/24/12, but the ESR version of FF10
    // will be supported until FF19 (2/12/13), at which time, ESR becomes FF17.
    // FF10 still uses prefixes, so check for it until then.
    // for more ESR info, see: mozilla.org/en-US/firefox/organizations/faq/
    tests['websockets'] = function() {
        return 'WebSocket' in window || 'MozWebSocket' in window;
    };


    // css-tricks.com/rgba-browser-support/
    tests['rgba'] = function() {
        // Set an rgba() color and check the returned value

        setCss('background-color:rgba(150,255,150,.5)');

        return contains(mStyle.backgroundColor, 'rgba');
    };

    tests['hsla'] = function() {
        // Same as rgba(), in fact, browsers re-map hsla() to rgba() internally,
        //   except IE9 who retains it as hsla

        setCss('background-color:hsla(120,40%,100%,.5)');

        return contains(mStyle.backgroundColor, 'rgba') || contains(mStyle.backgroundColor, 'hsla');
    };

    tests['multiplebgs'] = function() {
        // Setting multiple images AND a color on the background shorthand property
        //  and then querying the style.background property value for the number of
        //  occurrences of "url(" is a reliable method for detecting ACTUAL support for this!

        setCss('background:url(https://),url(https://),red url(https://)');

        // If the UA supports multiple backgrounds, there should be three occurrences
        //   of the string "url(" in the return value for elemStyle.background

        return (/(url\s*\(.*?){3}/).test(mStyle.background);
    };



    // this will false positive in Opera Mini
    //   github.com/Modernizr/Modernizr/issues/396

    tests['backgroundsize'] = function() {
        return testPropsAll('backgroundSize');
    };

    tests['borderimage'] = function() {
        return testPropsAll('borderImage');
    };


    // Super comprehensive table about all the unique implementations of
    // border-radius: muddledramblings.com/table-of-css3-border-radius-compliance

    tests['borderradius'] = function() {
        return testPropsAll('borderRadius');
    };

    // WebOS unfortunately false positives on this test.
    tests['boxshadow'] = function() {
        return testPropsAll('boxShadow');
    };

    // FF3.0 will false positive on this test
    tests['textshadow'] = function() {
        return document.createElement('div').style.textShadow === '';
    };


    tests['opacity'] = function() {
        // Browsers that actually have CSS Opacity implemented have done so
        //  according to spec, which means their return values are within the
        //  range of [0.0,1.0] - including the leading zero.

        setCssAll('opacity:.55');

        // The non-literal . in this regex is intentional:
        //   German Chrome returns this value as 0,55
        // github.com/Modernizr/Modernizr/issues/#issue/59/comment/516632
        return (/^0.55$/).test(mStyle.opacity);
    };


    // Note, Android < 4 will pass this test, but can only animate
    //   a single property at a time
    //   goo.gl/v3V4Gp
    tests['cssanimations'] = function() {
        return testPropsAll('animationName');
    };


    tests['csscolumns'] = function() {
        return testPropsAll('columnCount');
    };


    tests['cssgradients'] = function() {
        /**
         * For CSS Gradients syntax, please see:
         * webkit.org/blog/175/introducing-css-gradients/
         * developer.mozilla.org/en/CSS/-moz-linear-gradient
         * developer.mozilla.org/en/CSS/-moz-radial-gradient
         * dev.w3.org/csswg/css3-images/#gradients-
         */

        var str1 = 'background-image:',
            str2 = 'gradient(linear,left top,right bottom,from(#9f9),to(white));',
            str3 = 'linear-gradient(left top,#9f9, white);';

        setCss(
             // legacy webkit syntax (FIXME: remove when syntax not in use anymore)
              (str1 + '-webkit- '.split(' ').join(str2 + str1) +
             // standard syntax             // trailing 'background-image:'
              prefixes.join(str3 + str1)).slice(0, -str1.length)
        );

        return contains(mStyle.backgroundImage, 'gradient');
    };


    tests['cssreflections'] = function() {
        return testPropsAll('boxReflect');
    };


    tests['csstransforms'] = function() {
        return !!testPropsAll('transform');
    };


    tests['csstransforms3d'] = function() {

        var ret = !!testPropsAll('perspective');

        // Webkit's 3D transforms are passed off to the browser's own graphics renderer.
        //   It works fine in Safari on Leopard and Snow Leopard, but not in Chrome in
        //   some conditions. As a result, Webkit typically recognizes the syntax but
        //   will sometimes throw a false positive, thus we must do a more thorough check:
        if ( ret && 'webkitPerspective' in docElement.style ) {

          // Webkit allows this media query to succeed only if the feature is enabled.
          // `@media (transform-3d),(-webkit-transform-3d){ ... }`
          injectElementWithStyles('@media (transform-3d),(-webkit-transform-3d){#modernizr{left:9px;position:absolute;height:3px;}}', function( node, rule ) {
            ret = node.offsetLeft === 9 && node.offsetHeight === 3;
          });
        }
        return ret;
    };


    tests['csstransitions'] = function() {
        return testPropsAll('transition');
    };


    /*>>fontface*/
    // @font-face detection routine by Diego Perini
    // javascript.nwbox.com/CSSSupport/

    // false positives:
    //   WebOS github.com/Modernizr/Modernizr/issues/342
    //   WP7   github.com/Modernizr/Modernizr/issues/538
    tests['fontface'] = function() {
        var bool;

        injectElementWithStyles('@font-face {font-family:"font";src:url("https://")}', function( node, rule ) {
          var style = document.getElementById('smodernizr'),
              sheet = style.sheet || style.styleSheet,
              cssText = sheet ? (sheet.cssRules && sheet.cssRules[0] ? sheet.cssRules[0].cssText : sheet.cssText || '') : '';

          bool = /src/i.test(cssText) && cssText.indexOf(rule.split(' ')[0]) === 0;
        });

        return bool;
    };
    /*>>fontface*/

    // CSS generated content detection
    tests['generatedcontent'] = function() {
        var bool;

        injectElementWithStyles(['#',mod,'{font:0/0 a}#',mod,':after{content:"',smile,'";visibility:hidden;font:3px/1 a}'].join(''), function( node ) {
          bool = node.offsetHeight >= 3;
        });

        return bool;
    };



    // These tests evaluate support of the video/audio elements, as well as
    // testing what types of content they support.
    //
    // We're using the Boolean constructor here, so that we can extend the value
    // e.g.  Modernizr.video     // true
    //       Modernizr.video.ogg // 'probably'
    //
    // Codec values from : github.com/NielsLeenheer/html5test/blob/9106a8/index.html#L845
    //                     thx to NielsLeenheer and zcorpan

    // Note: in some older browsers, "no" was a return value instead of empty string.
    //   It was live in FF3.5.0 and 3.5.1, but fixed in 3.5.2
    //   It was also live in Safari 4.0.0 - 4.0.4, but fixed in 4.0.5

    tests['video'] = function() {
        var elem = document.createElement('video'),
            bool = false;

        // IE9 Running on Windows Server SKU can cause an exception to be thrown, bug #224
        try {
            if ( bool = !!elem.canPlayType ) {
                bool      = new Boolean(bool);
                bool.ogg  = elem.canPlayType('video/ogg; codecs="theora"')      .replace(/^no$/,'');

                // Without QuickTime, this value will be `undefined`. github.com/Modernizr/Modernizr/issues/546
                bool.h264 = elem.canPlayType('video/mp4; codecs="avc1.42E01E"') .replace(/^no$/,'');

                bool.webm = elem.canPlayType('video/webm; codecs="vp8, vorbis"').replace(/^no$/,'');
            }

        } catch(e) { }

        return bool;
    };

    tests['audio'] = function() {
        var elem = document.createElement('audio'),
            bool = false;

        try {
            if ( bool = !!elem.canPlayType ) {
                bool      = new Boolean(bool);
                bool.ogg  = elem.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/,'');
                bool.mp3  = elem.canPlayType('audio/mpeg;')               .replace(/^no$/,'');

                // Mimetypes accepted:
                //   developer.mozilla.org/En/Media_formats_supported_by_the_audio_and_video_elements
                //   bit.ly/iphoneoscodecs
                bool.wav  = elem.canPlayType('audio/wav; codecs="1"')     .replace(/^no$/,'');
                bool.m4a  = ( elem.canPlayType('audio/x-m4a;')            ||
                              elem.canPlayType('audio/aac;'))             .replace(/^no$/,'');
            }
        } catch(e) { }

        return bool;
    };


    // In FF4, if disabled, window.localStorage should === null.

    // Normally, we could not test that directly and need to do a
    //   `('localStorage' in window) && ` test first because otherwise Firefox will
    //   throw bugzil.la/365772 if cookies are disabled

    // Also in iOS5 Private Browsing mode, attempting to use localStorage.setItem
    // will throw the exception:
    //   QUOTA_EXCEEDED_ERRROR DOM Exception 22.
    // Peculiarly, getItem and removeItem calls do not throw.

    // Because we are forced to try/catch this, we'll go aggressive.

    // Just FWIW: IE8 Compat mode supports these features completely:
    //   www.quirksmode.org/dom/html5.html
    // But IE8 doesn't support either with local files

    tests['localstorage'] = function() {
        try {
            localStorage.setItem(mod, mod);
            localStorage.removeItem(mod);
            return true;
        } catch(e) {
            return false;
        }
    };

    tests['sessionstorage'] = function() {
        try {
            sessionStorage.setItem(mod, mod);
            sessionStorage.removeItem(mod);
            return true;
        } catch(e) {
            return false;
        }
    };


    tests['webworkers'] = function() {
        return !!window.Worker;
    };


    tests['applicationcache'] = function() {
        return !!window.applicationCache;
    };


    // Thanks to Erik Dahlstrom
    tests['svg'] = function() {
        return !!document.createElementNS && !!document.createElementNS(ns.svg, 'svg').createSVGRect;
    };

    // specifically for SVG inline in HTML, not within XHTML
    // test page: paulirish.com/demo/inline-svg
    tests['inlinesvg'] = function() {
      var div = document.createElement('div');
      div.innerHTML = '<svg/>';
      return (div.firstChild && div.firstChild.namespaceURI) == ns.svg;
    };

    // SVG SMIL animation
    tests['smil'] = function() {
        return !!document.createElementNS && /SVGAnimate/.test(toString.call(document.createElementNS(ns.svg, 'animate')));
    };

    // This test is only for clip paths in SVG proper, not clip paths on HTML content
    // demo: srufaculty.sru.edu/david.dailey/svg/newstuff/clipPath4.svg

    // However read the comments to dig into applying SVG clippaths to HTML content here:
    //   github.com/Modernizr/Modernizr/issues/213#issuecomment-1149491
    tests['svgclippaths'] = function() {
        return !!document.createElementNS && /SVGClipPath/.test(toString.call(document.createElementNS(ns.svg, 'clipPath')));
    };

    /*>>webforms*/
    // input features and input types go directly onto the ret object, bypassing the tests loop.
    // Hold this guy to execute in a moment.
    function webforms() {
        /*>>input*/
        // Run through HTML5's new input attributes to see if the UA understands any.
        // We're using f which is the <input> element created early on
        // Mike Taylr has created a comprehensive resource for testing these attributes
        //   when applied to all input types:
        //   miketaylr.com/code/input-type-attr.html
        // spec: www.whatwg.org/specs/web-apps/current-work/multipage/the-input-element.html#input-type-attr-summary

        // Only input placeholder is tested while textarea's placeholder is not.
        // Currently Safari 4 and Opera 11 have support only for the input placeholder
        // Both tests are available in feature-detects/forms-placeholder.js
        Modernizr['input'] = (function( props ) {
            for ( var i = 0, len = props.length; i < len; i++ ) {
                attrs[ props[i] ] = !!(props[i] in inputElem);
            }
            if (attrs.list){
              // safari false positive's on datalist: webk.it/74252
              // see also github.com/Modernizr/Modernizr/issues/146
              attrs.list = !!(document.createElement('datalist') && window.HTMLDataListElement);
            }
            return attrs;
        })('autocomplete autofocus list placeholder max min multiple pattern required step'.split(' '));
        /*>>input*/

        /*>>inputtypes*/
        // Run through HTML5's new input types to see if the UA understands any.
        //   This is put behind the tests runloop because it doesn't return a
        //   true/false like all the other tests; instead, it returns an object
        //   containing each input type with its corresponding true/false value

        // Big thanks to @miketaylr for the html5 forms expertise. miketaylr.com/
        Modernizr['inputtypes'] = (function(props) {

            for ( var i = 0, bool, inputElemType, defaultView, len = props.length; i < len; i++ ) {

                inputElem.setAttribute('type', inputElemType = props[i]);
                bool = inputElem.type !== 'text';

                // We first check to see if the type we give it sticks..
                // If the type does, we feed it a textual value, which shouldn't be valid.
                // If the value doesn't stick, we know there's input sanitization which infers a custom UI
                if ( bool ) {

                    inputElem.value         = smile;
                    inputElem.style.cssText = 'position:absolute;visibility:hidden;';

                    if ( /^range$/.test(inputElemType) && inputElem.style.WebkitAppearance !== undefined ) {

                      docElement.appendChild(inputElem);
                      defaultView = document.defaultView;

                      // Safari 2-4 allows the smiley as a value, despite making a slider
                      bool =  defaultView.getComputedStyle &&
                              defaultView.getComputedStyle(inputElem, null).WebkitAppearance !== 'textfield' &&
                              // Mobile android web browser has false positive, so must
                              // check the height to see if the widget is actually there.
                              (inputElem.offsetHeight !== 0);

                      docElement.removeChild(inputElem);

                    } else if ( /^(search|tel)$/.test(inputElemType) ){
                      // Spec doesn't define any special parsing or detectable UI
                      //   behaviors so we pass these through as true

                      // Interestingly, opera fails the earlier test, so it doesn't
                      //  even make it here.

                    } else if ( /^(url|email)$/.test(inputElemType) ) {
                      // Real url and email support comes with prebaked validation.
                      bool = inputElem.checkValidity && inputElem.checkValidity() === false;

                    } else {
                      // If the upgraded input compontent rejects the :) text, we got a winner
                      bool = inputElem.value != smile;
                    }
                }

                inputs[ props[i] ] = !!bool;
            }
            return inputs;
        })('search tel url email datetime date month week time datetime-local number range color'.split(' '));
        /*>>inputtypes*/
    }
    /*>>webforms*/


    // End of test definitions
    // -----------------------



    // Run through all tests and detect their support in the current UA.
    // todo: hypothetically we could be doing an array of tests and use a basic loop here.
    for ( var feature in tests ) {
        if ( hasOwnProp(tests, feature) ) {
            // run the test, throw the return value into the Modernizr,
            //   then based on that boolean, define an appropriate className
            //   and push it into an array of classes we'll join later.
            featureName  = feature.toLowerCase();
            Modernizr[featureName] = tests[feature]();

            classes.push((Modernizr[featureName] ? '' : 'no-') + featureName);
        }
    }

    /*>>webforms*/
    // input tests need to run.
    Modernizr.input || webforms();
    /*>>webforms*/


    /**
     * addTest allows the user to define their own feature tests
     * the result will be added onto the Modernizr object,
     * as well as an appropriate className set on the html element
     *
     * @param feature - String naming the feature
     * @param test - Function returning true if feature is supported, false if not
     */
     Modernizr.addTest = function ( feature, test ) {
       if ( typeof feature == 'object' ) {
         for ( var key in feature ) {
           if ( hasOwnProp( feature, key ) ) {
             Modernizr.addTest( key, feature[ key ] );
           }
         }
       } else {

         feature = feature.toLowerCase();

         if ( Modernizr[feature] !== undefined ) {
           // we're going to quit if you're trying to overwrite an existing test
           // if we were to allow it, we'd do this:
           //   var re = new RegExp("\\b(no-)?" + feature + "\\b");
           //   docElement.className = docElement.className.replace( re, '' );
           // but, no rly, stuff 'em.
           return Modernizr;
         }

         test = typeof test == 'function' ? test() : test;

         if (typeof enableClasses !== "undefined" && enableClasses) {
           docElement.className += ' ' + (test ? '' : 'no-') + feature;
         }
         Modernizr[feature] = test;

       }

       return Modernizr; // allow chaining.
     };


    // Reset modElem.cssText to nothing to reduce memory footprint.
    setCss('');
    modElem = inputElem = null;

    /*>>shiv*/
    /**
     * @preserve HTML5 Shiv prev3.7.1 | @afarkas @jdalton @jon_neal @rem | MIT/GPL2 Licensed
     */
    ;(function(window, document) {
        /*jshint evil:true */
        /** version */
        var version = '3.7.0';

        /** Preset options */
        var options = window.html5 || {};

        /** Used to skip problem elements */
        var reSkip = /^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i;

        /** Not all elements can be cloned in IE **/
        var saveClones = /^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i;

        /** Detect whether the browser supports default html5 styles */
        var supportsHtml5Styles;

        /** Name of the expando, to work with multiple documents or to re-shiv one document */
        var expando = '_html5shiv';

        /** The id for the the documents expando */
        var expanID = 0;

        /** Cached data for each document */
        var expandoData = {};

        /** Detect whether the browser supports unknown elements */
        var supportsUnknownElements;

        (function() {
          try {
            var a = document.createElement('a');
            a.innerHTML = '<xyz></xyz>';
            //if the hidden property is implemented we can assume, that the browser supports basic HTML5 Styles
            supportsHtml5Styles = ('hidden' in a);

            supportsUnknownElements = a.childNodes.length == 1 || (function() {
              // assign a false positive if unable to shiv
              (document.createElement)('a');
              var frag = document.createDocumentFragment();
              return (
                typeof frag.cloneNode == 'undefined' ||
                typeof frag.createDocumentFragment == 'undefined' ||
                typeof frag.createElement == 'undefined'
              );
            }());
          } catch(e) {
            // assign a false positive if detection fails => unable to shiv
            supportsHtml5Styles = true;
            supportsUnknownElements = true;
          }

        }());

        /*--------------------------------------------------------------------------*/

        /**
         * Creates a style sheet with the given CSS text and adds it to the document.
         * @private
         * @param {Document} ownerDocument The document.
         * @param {String} cssText The CSS text.
         * @returns {StyleSheet} The style element.
         */
        function addStyleSheet(ownerDocument, cssText) {
          var p = ownerDocument.createElement('p'),
          parent = ownerDocument.getElementsByTagName('head')[0] || ownerDocument.documentElement;

          p.innerHTML = 'x<style>' + cssText + '</style>';
          return parent.insertBefore(p.lastChild, parent.firstChild);
        }

        /**
         * Returns the value of `html5.elements` as an array.
         * @private
         * @returns {Array} An array of shived element node names.
         */
        function getElements() {
          var elements = html5.elements;
          return typeof elements == 'string' ? elements.split(' ') : elements;
        }

        /**
         * Returns the data associated to the given document
         * @private
         * @param {Document} ownerDocument The document.
         * @returns {Object} An object of data.
         */
        function getExpandoData(ownerDocument) {
          var data = expandoData[ownerDocument[expando]];
          if (!data) {
            data = {};
            expanID++;
            ownerDocument[expando] = expanID;
            expandoData[expanID] = data;
          }
          return data;
        }

        /**
         * returns a shived element for the given nodeName and document
         * @memberOf html5
         * @param {String} nodeName name of the element
         * @param {Document} ownerDocument The context document.
         * @returns {Object} The shived element.
         */
        function createElement(nodeName, ownerDocument, data){
          if (!ownerDocument) {
            ownerDocument = document;
          }
          if(supportsUnknownElements){
            return ownerDocument.createElement(nodeName);
          }
          if (!data) {
            data = getExpandoData(ownerDocument);
          }
          var node;

          if (data.cache[nodeName]) {
            node = data.cache[nodeName].cloneNode();
          } else if (saveClones.test(nodeName)) {
            node = (data.cache[nodeName] = data.createElem(nodeName)).cloneNode();
          } else {
            node = data.createElem(nodeName);
          }

          // Avoid adding some elements to fragments in IE < 9 because
          // * Attributes like `name` or `type` cannot be set/changed once an element
          //   is inserted into a document/fragment
          // * Link elements with `src` attributes that are inaccessible, as with
          //   a 403 response, will cause the tab/window to crash
          // * Script elements appended to fragments will execute when their `src`
          //   or `text` property is set
          return node.canHaveChildren && !reSkip.test(nodeName) && !node.tagUrn ? data.frag.appendChild(node) : node;
        }

        /**
         * returns a shived DocumentFragment for the given document
         * @memberOf html5
         * @param {Document} ownerDocument The context document.
         * @returns {Object} The shived DocumentFragment.
         */
        function createDocumentFragment(ownerDocument, data){
          if (!ownerDocument) {
            ownerDocument = document;
          }
          if(supportsUnknownElements){
            return ownerDocument.createDocumentFragment();
          }
          data = data || getExpandoData(ownerDocument);
          var clone = data.frag.cloneNode(),
          i = 0,
          elems = getElements(),
          l = elems.length;
          for(;i<l;i++){
            clone.createElement(elems[i]);
          }
          return clone;
        }

        /**
         * Shivs the `createElement` and `createDocumentFragment` methods of the document.
         * @private
         * @param {Document|DocumentFragment} ownerDocument The document.
         * @param {Object} data of the document.
         */
        function shivMethods(ownerDocument, data) {
          if (!data.cache) {
            data.cache = {};
            data.createElem = ownerDocument.createElement;
            data.createFrag = ownerDocument.createDocumentFragment;
            data.frag = data.createFrag();
          }


          ownerDocument.createElement = function(nodeName) {
            //abort shiv
            if (!html5.shivMethods) {
              return data.createElem(nodeName);
            }
            return createElement(nodeName, ownerDocument, data);
          };

          ownerDocument.createDocumentFragment = Function('h,f', 'return function(){' +
                                                          'var n=f.cloneNode(),c=n.createElement;' +
                                                          'h.shivMethods&&(' +
                                                          // unroll the `createElement` calls
                                                          getElements().join().replace(/[\w\-]+/g, function(nodeName) {
            data.createElem(nodeName);
            data.frag.createElement(nodeName);
            return 'c("' + nodeName + '")';
          }) +
            ');return n}'
                                                         )(html5, data.frag);
        }

        /*--------------------------------------------------------------------------*/

        /**
         * Shivs the given document.
         * @memberOf html5
         * @param {Document} ownerDocument The document to shiv.
         * @returns {Document} The shived document.
         */
        function shivDocument(ownerDocument) {
          if (!ownerDocument) {
            ownerDocument = document;
          }
          var data = getExpandoData(ownerDocument);

          if (html5.shivCSS && !supportsHtml5Styles && !data.hasCSS) {
            data.hasCSS = !!addStyleSheet(ownerDocument,
                                          // corrects block display not defined in IE6/7/8/9
                                          'article,aside,dialog,figcaption,figure,footer,header,hgroup,main,nav,section{display:block}' +
                                            // adds styling not present in IE6/7/8/9
                                            'mark{background:#FF0;color:#000}' +
                                            // hides non-rendered elements
                                            'template{display:none}'
                                         );
          }
          if (!supportsUnknownElements) {
            shivMethods(ownerDocument, data);
          }
          return ownerDocument;
        }

        /*--------------------------------------------------------------------------*/

        /**
         * The `html5` object is exposed so that more elements can be shived and
         * existing shiving can be detected on iframes.
         * @type Object
         * @example
         *
         * // options can be changed before the script is included
         * html5 = { 'elements': 'mark section', 'shivCSS': false, 'shivMethods': false };
         */
        var html5 = {

          /**
           * An array or space separated string of node names of the elements to shiv.
           * @memberOf html5
           * @type Array|String
           */
          'elements': options.elements || 'abbr article aside audio bdi canvas data datalist details dialog figcaption figure footer header hgroup main mark meter nav output progress section summary template time video',

          /**
           * current version of html5shiv
           */
          'version': version,

          /**
           * A flag to indicate that the HTML5 style sheet should be inserted.
           * @memberOf html5
           * @type Boolean
           */
          'shivCSS': (options.shivCSS !== false),

          /**
           * Is equal to true if a browser supports creating unknown/HTML5 elements
           * @memberOf html5
           * @type boolean
           */
          'supportsUnknownElements': supportsUnknownElements,

          /**
           * A flag to indicate that the document's `createElement` and `createDocumentFragment`
           * methods should be overwritten.
           * @memberOf html5
           * @type Boolean
           */
          'shivMethods': (options.shivMethods !== false),

          /**
           * A string to describe the type of `html5` object ("default" or "default print").
           * @memberOf html5
           * @type String
           */
          'type': 'default',

          // shivs the document according to the specified `html5` object options
          'shivDocument': shivDocument,

          //creates a shived element
          createElement: createElement,

          //creates a shived documentFragment
          createDocumentFragment: createDocumentFragment
        };

        /*--------------------------------------------------------------------------*/

        // expose html5
        window.html5 = html5;

        // shiv the document
        shivDocument(document);

    }(this, document));
    /*>>shiv*/

    // Assign private properties to the return object with prefix
    Modernizr._version      = version;

    // expose these for the plugin API. Look in the source for how to join() them against your input
    /*>>prefixes*/
    Modernizr._prefixes     = prefixes;
    /*>>prefixes*/
    /*>>domprefixes*/
    Modernizr._domPrefixes  = domPrefixes;
    Modernizr._cssomPrefixes  = cssomPrefixes;
    /*>>domprefixes*/

    /*>>mq*/
    // Modernizr.mq tests a given media query, live against the current state of the window
    // A few important notes:
    //   * If a browser does not support media queries at all (eg. oldIE) the mq() will always return false
    //   * A max-width or orientation query will be evaluated against the current state, which may change later.
    //   * You must specify values. Eg. If you are testing support for the min-width media query use:
    //       Modernizr.mq('(min-width:0)')
    // usage:
    // Modernizr.mq('only screen and (max-width:768)')
    Modernizr.mq            = testMediaQuery;
    /*>>mq*/

    /*>>hasevent*/
    // Modernizr.hasEvent() detects support for a given event, with an optional element to test on
    // Modernizr.hasEvent('gesturestart', elem)
    Modernizr.hasEvent      = isEventSupported;
    /*>>hasevent*/

    /*>>testprop*/
    // Modernizr.testProp() investigates whether a given style property is recognized
    // Note that the property names must be provided in the camelCase variant.
    // Modernizr.testProp('pointerEvents')
    Modernizr.testProp      = function(prop){
        return testProps([prop]);
    };
    /*>>testprop*/

    /*>>testallprops*/
    // Modernizr.testAllProps() investigates whether a given style property,
    //   or any of its vendor-prefixed variants, is recognized
    // Note that the property names must be provided in the camelCase variant.
    // Modernizr.testAllProps('boxSizing')
    Modernizr.testAllProps  = testPropsAll;
    /*>>testallprops*/


    /*>>teststyles*/
    // Modernizr.testStyles() allows you to add custom styles to the document and test an element afterwards
    // Modernizr.testStyles('#modernizr { position:absolute }', function(elem, rule){ ... })
    Modernizr.testStyles    = injectElementWithStyles;
    /*>>teststyles*/


    /*>>prefixed*/
    // Modernizr.prefixed() returns the prefixed or nonprefixed property name variant of your input
    // Modernizr.prefixed('boxSizing') // 'MozBoxSizing'

    // Properties must be passed as dom-style camelcase, rather than `box-sizing` hypentated style.
    // Return values will also be the camelCase variant, if you need to translate that to hypenated style use:
    //
    //     str.replace(/([A-Z])/g, function(str,m1){ return '-' + m1.toLowerCase(); }).replace(/^ms-/,'-ms-');

    // If you're trying to ascertain which transition end event to bind to, you might do something like...
    //
    //     var transEndEventNames = {
    //       'WebkitTransition' : 'webkitTransitionEnd',
    //       'MozTransition'    : 'transitionend',
    //       'OTransition'      : 'oTransitionEnd',
    //       'msTransition'     : 'MSTransitionEnd',
    //       'transition'       : 'transitionend'
    //     },
    //     transEndEventName = transEndEventNames[ Modernizr.prefixed('transition') ];

    Modernizr.prefixed      = function(prop, obj, elem){
      if(!obj) {
        return testPropsAll(prop, 'pfx');
      } else {
        // Testing DOM property e.g. Modernizr.prefixed('requestAnimationFrame', window) // 'mozRequestAnimationFrame'
        return testPropsAll(prop, obj, elem);
      }
    };
    /*>>prefixed*/


    /*>>cssclasses*/
    // Remove "no-js" class from <html> element, if it exists:
    docElement.className = docElement.className.replace(/(^|\s)no-js(\s|$)/, '$1$2') +

                            // Add the new classes to the <html> element.
                            (enableClasses ? ' js ' + classes.join(' ') : '');
    /*>>cssclasses*/

    return Modernizr;

})(this, this.document);


  }).apply(root, arguments);
});
}(this));

/**
 * Patterns parser - Argument parser
 *
 * Copyright 2012-2013 Florian Friesdorf
 * Copyright 2012-2013 Simplon B.V. - Wichert Akkerman
 */
define('pat-parser',[
    "jquery",
    "underscore",
    "pat-utils",
    "pat-logger"
], function($, _, utils, logger) {
    "use strict";

    function ArgumentParser(name, opts) {
        opts = opts || {};
        this.order = [];
        this.parameters = {};
        this.attribute = "data-pat-" + name;
        this.enum_values = {};
        this.enum_conflicts = [];
        this.groups = {};
        this.possible_groups = {};
        this.log = logger.getLogger(name + ".parser");
    }

    ArgumentParser.prototype = {
        group_pattern: /([a-z][a-z0-9]*)-([A-Z][a-z0-0\-]*)/i,
        json_param_pattern: /^\s*{/i,
        named_param_pattern: /^\s*([a-z][a-z0-9\-]*)\s*:(.*)/i,
        token_pattern: /((["']).*?(?!\\)\2)|\s*(\S+)\s*/g,

        _camelCase: function(str) {
            return str.replace(/\-([a-z])/g, function(_, p1){
                return p1.toUpperCase();
            });
        },

        addAlias: function argParserAddAlias(alias, original) {
            /* Add an alias for a previously added parser argument.
             *
             * Useful when you want to support both US and UK english argument
             * names.
             */
            if (this.parameters[original]) {
                this.parameters[original].alias = alias;
            } else {
                throw("Attempted to add an alias \""+alias+"\" for a non-existing parser argument \""+original+"\".");
            }
        },

        addGroupToSpec: function argParserAddGroupToSpec(spec) {
            /* Determine wether an argument being parsed can be grouped and
             * update its specifications object accordingly.
             *
             * Internal method used by addArgument and addJSONArgument
             */
            var m = spec.name.match(this.group_pattern);
            if (m) {
                var group = m[1],
                    field = m[2];
                if (group in this.possible_groups) {
                    var first_spec = this.possible_groups[group],
                        first_name = first_spec.name.match(this.group_pattern)[2];
                    first_spec.group = group;
                    first_spec.dest = first_name;
                    this.groups[group] = new ArgumentParser();
                    this.groups[group].addArgument(
                            first_name, first_spec.value, first_spec.choices, first_spec.multiple);
                    delete this.possible_groups[group];
                }
                if (group in this.groups) {
                    this.groups[group].addArgument(field, spec.value, spec.choices, spec.multiple);
                    spec.group = group;
                    spec.dest = field;
                } else {
                    this.possible_groups[group] = spec;
                    spec.dest = this._camelCase(spec.name);
                }
            }
            return spec;
        },

        addJSONArgument: function argParserAddJSONArgument(name, default_value) {
            /* Add an argument where the value is provided in JSON format.
             *
             * This is a different usecase than specifying all arguments to
             * the data-pat-... attributes in JSON format, and instead is part
             * of the normal notation except that a value is in JSON instead of
             * for example a string.
             */
            this.order.push(name);
            this.parameters[name] = this.addGroupToSpec({
                name: name,
                value: default_value,
                dest: name,
                group: null,
                type: "json"
            });
        },

        addArgument: function ArgParserAddArgument(name, default_value, choices, multiple) {
            var spec = {
                name: name,
                value: (multiple && !Array.isArray(default_value)) ? [default_value] : default_value,
                multiple: multiple,
                dest: name,
                group: null
            };
            if (choices && Array.isArray(choices) && choices.length) {
                spec.choices = choices;
                spec.type = this._typeof(choices[0]);
                for (var i=0; i<choices.length; i++) {
                    if (this.enum_conflicts.indexOf(choices[i])!==-1) {
                        continue;
                    } else if (choices[i] in this.enum_values) {
                        this.enum_conflicts.push(choices[i]);
                        delete this.enum_values[choices[i]];
                    } else {
                        this.enum_values[choices[i]]=name;
                    }
                }
            } else if (typeof spec.value==="string" && spec.value.slice(0, 1)==="$") {
                spec.type = this.parameters[spec.value.slice(1)].type;
            } else {
                // Note that this will get reset by _defaults if default_value is a function.
                spec.type = this._typeof(multiple ? spec.value[0] : spec.value);
            }
            this.order.push(name);
            this.parameters[name] = this.addGroupToSpec(spec);
        },

        _typeof: function argParserTypeof(obj) {
            var type = typeof obj;
            if (obj===null)
                return "null";
            return type;
        },

        _coerce: function argParserCoerce(name, value) {
            var spec = this.parameters[name];
            if (typeof value !== spec.type)
                try {
                    switch (spec.type) {
                        case "json":
                            value = JSON.parse(value);
                            break;
                        case "boolean":
                            if (typeof value === "string") {
                                value = value.toLowerCase();
                                var num = parseInt(value, 10);
                                if (!isNaN(num))
                                    value = !!num;
                                else
                                    value=(value==="true" || value==="y" || value==="yes" || value==="y");
                            } else if (typeof value === "number")
                                value = !!value;
                            else
                                throw ("Cannot convert value for " + name + " to boolean");
                            break;
                        case "number":
                            if (typeof value === "string") {
                                value = parseInt(value, 10);
                                if (isNaN(value))
                                    throw ("Cannot convert value for " + name + " to number");
                            } else if (typeof value === "boolean")
                                value = value + 0;
                            else
                                throw ("Cannot convert value for " + name + " to number");
                            break;
                        case "string":
                            value=value.toString();
                            break;
                        case "null":  // Missing default values
                        case "undefined":
                            break;
                        default:
                            throw ("Do not know how to convert value for " + name + " to " + spec.type);
                    }
                } catch (e) {
                    this.log.warn(e);
                    return null;
                }

            if (spec.choices && spec.choices.indexOf(value)===-1) {
                this.log.warn("Illegal value for " + name + ": " + value);
                return null;
            }
            return value;
        },

        _set: function argParserSet(opts, name, value) {
            if (!(name in this.parameters)) {
                this.log.debug("Ignoring value for unknown argument " + name);
                return;
            }
            var spec = this.parameters[name],
                parts, i, v;
            if (spec.multiple) {
                if (typeof value === "string") {
                    parts = value.split(/,+/);
                } else {
                    parts = value;
                }
                value = [];
                for (i=0; i<parts.length; i++) {
                    v = this._coerce(name, parts[i].trim());
                    if (v!==null)
                        value.push(v);
                }
            } else {
                value = this._coerce(name, value);
                if (value===null)
                    return;
            }
            opts[name] = value;
        },

        _split: function argParserSplit(text) {
            var tokens = [];
            text.replace(this.token_pattern, function(match, quoted, _, simple) {
                if (quoted)
                    tokens.push(quoted);
                else if (simple)
                    tokens.push(simple);
            });
            return tokens;
        },

        _parseExtendedNotation: function argParserParseExtendedNotation(argstring) {
            var opts = {};
            var parts = argstring.replace(/;;/g, "\0x1f").replace(/&amp;/g, "&amp\0x1f").split(/;/)
                        .map(function(el) {
                            return el.replace(new RegExp("\0x1f", 'g'), ";");
                        });
            _.each(parts, function (part, i) {
                if (!part) { return; }
                var matches = part.match(this.named_param_pattern);
                if (!matches) {
                    this.log.warn("Invalid parameter: " + part + ": " + argstring);
                    return;
                }
                var name = matches[1],
                    value = matches[2].trim(),
                    arg = _.chain(this.parameters).where({'alias': name}).value(),
                    is_alias = arg.length === 1;

                if (is_alias) {
                    this._set(opts, arg[0].name, value);
                } else if (name in this.parameters) {
                    this._set(opts, name, value);
                } else if (name in this.groups) {
                    var subopt = this.groups[name]._parseShorthandNotation(value);
                    for (var field in subopt) {
                        this._set(opts, name+"-"+field, subopt[field]);
                    }
                } else {
                    this.log.warn("Unknown named parameter " + matches[1]);
                    return;
                }
            }.bind(this));
            return opts;
        },

        _parseShorthandNotation: function argParserParseShorthandNotation(parameter) {
            var parts = this._split(parameter),
                opts = {},
                positional = true,
                i=0, part, flag, sense;

            while (parts.length) {
                part=parts.shift().trim();
                if (part.slice(0, 3)==="no-") {
                    sense = false;
                    flag=part.slice(3);
                } else {
                    sense = true;
                    flag = part;
                }
                if (flag in this.parameters && this.parameters[flag].type==="boolean") {
                    positional = false;
                    this._set(opts, flag, sense);
                } else if (flag in this.enum_values) {
                    positional = false;
                    this._set(opts, this.enum_values[flag], flag);
                } else if (positional)
                    this._set(opts, this.order[i], part);
                else {
                    parts.unshift(part);
                    break;
                }
                i++;
                if (i >= this.order.length) {
                    break;
                }
            }
            if (parts.length)
                this.log.warn("Ignore extra arguments: " + parts.join(" "));
            return opts;
        },

        _parse: function argParser_parse(parameter) {
            var opts, extended, sep;
            if (!parameter) { return {}; }
            if (parameter.match(this.json_param_pattern)) {
                try {
                    return JSON.parse(parameter);
                } catch (e) {
                    this.log.warn("Invalid JSON argument found: "+parameter);
                }
            }
            if (parameter.match(this.named_param_pattern)) {
                return this._parseExtendedNotation(parameter);
            }
            sep = parameter.indexOf(";");
            if (sep === -1) {
                return this._parseShorthandNotation(parameter);
            }
            opts = this._parseShorthandNotation(parameter.slice(0, sep));
            extended = this._parseExtendedNotation(parameter.slice(sep+1));
            for (var name in extended)
                opts[name] = extended[name];
            return opts;
        },

        _defaults: function argParserDefaults($el) {
            var result = {};
            for (var name in this.parameters)
                if (typeof this.parameters[name].value === "function")
                    try {
                        result[name] = this.parameters[name].value($el, name);
                        this.parameters[name].type=typeof result[name];
                    } catch(e) {
                        this.log.error("Default function for " + name + " failed.");
                    }
                else
                    result[name] = this.parameters[name].value;
            return result;
        },

        _cleanupOptions: function argParserCleanupOptions(options) {
            var keys = Object.keys(options),
                i, spec, name, target;

            // Resolve references
            for (i=0; i<keys.length; i++) {
                name = keys[i];
                spec = this.parameters[name];
                if (spec === undefined)
                    continue;

                if (options[name] === spec.value &&
                        typeof spec.value==="string" && spec.value.slice(0, 1)==="$")
                    options[name] = options[spec.value.slice(1)];
            }
            // Move options into groups and do renames
            keys = Object.keys(options);
            for (i=0; i<keys.length; i++) {
                name = keys[i];
                spec = this.parameters[name];
                if (spec === undefined)
                    continue;

                if (spec.group)  {
                    if (typeof options[spec.group]!=="object")
                        options[spec.group] = {};
                    target = options[spec.group];
                } else {
                    target = options;
                }

                if (spec.dest !== name) {
                    target[spec.dest] = options[name];
                    delete options[name];
                }
            }
            return options;
        },


        parse: function argParserParse($el, options, multiple, inherit) {
            if (typeof options==="boolean" && multiple===undefined) {
                multiple=options;
                options={};
            }
            inherit = (inherit!==false);
            var stack = inherit ? [[this._defaults($el)]] : [[{}]];
            var $possible_config_providers = inherit ? $el.parents().andSelf() : $el,
                final_length = 1;

            _.each($possible_config_providers, function (provider) {
                var data = $(provider).attr(this.attribute), frame, _parse;
                if (data) {
                    _parse = this._parse.bind(this);
                    if (data.match(/&&/))
                        frame = data.split(/\s*&&\s*/).map(_parse);
                    else
                        frame = [_parse(data)];
                    final_length = Math.max(frame.length, final_length);
                    stack.push(frame);
                }
            }.bind(this));
            if (typeof options==="object") {
                if (Array.isArray(options)) {
                    stack.push(options);
                    final_length = Math.max(options.length, final_length);
                } else
                    stack.push([options]);
            }
            if (!multiple) { final_length = 1; }
            var results = _.map(
                _.compose(utils.removeDuplicateObjects, _.partial(utils.mergeStack, _, final_length))(stack),
                this._cleanupOptions.bind(this)
            );
            return multiple ? results : results[0];
        }
    };
    // BBB
    ArgumentParser.prototype.add_argument = ArgumentParser.prototype.addArgument;
    return ArgumentParser;
});
// jshint indent: 4, browser: true, jquery: true, quotmark: double
// vim: sw=4 expandtab
;
/**
 * Patterns ajax - AJAX injection for forms and anchors
 *
 * Copyright 2012-2013 Florian Friesdorf
 * Copyright 2012-2013 Marko Durkovic
 */
define('pat-ajax',[
    "jquery",
    "pat-logger",
    "pat-parser",
    "pat-registry",
    "jquery.form"
], function($, logger, Parser, registry) {
    var log = logger.getLogger("pat.ajax"),
        parser = new Parser("ajax");
    parser.addArgument("url", function($el) {
        return ($el.is("a") ? $el.attr("href") :
                ($el.is("form") ? $el.attr("action") : "")).split("#")[0];
    });

    $.ajaxSetup ({
        // Disable caching of AJAX responses
        cache: false
    });

    var xhrCount = {};
    xhrCount.get = function(a) { return this[a] !== undefined ? this[a] : 0; };
    xhrCount.inc = function(a) { this[a] = this.get(a) + 1; return this.get(a); };

    var _ = {
        name: "ajax",
        trigger: ".pat-ajax",
        parser: parser,
        init: function($el) {
            $el.off(".pat-ajax");
            $el.filter("a").on("click.pat-ajax", _.onTriggerEvents);
            $el.filter("form")
                .on("submit.pat-ajax", _.onTriggerEvents)
                .on("click.pat-ajax", "[type=submit]", _.onClickSubmit);
            $el.filter(":not(form,a)").each(function() {
                log.warn("Unsupported element:", this);
            });
            return $el;
        },
        destroy: function($el) {
            $el.off(".pat-ajax");
        },
        onClickSubmit: function(event) {
            var $form = $(event.target).parents("form").first(),
                name = event.target.name,
                value = $(event.target).val(),
                data = {};
            if (name) {
                data[name] = value;
            }
            $form.data("pat-ajax.clicked-data", data);
        },
        onTriggerEvents: function(event) {
            if (event) {
                event.preventDefault();
            }
            _.request($(this));
        },
        request: function($el, opts) {
            return $el.each(function() {
                _._request($(this), opts);
            });
        },
        _request: function($el, opts) {
            var cfg = _.parser.parse($el, opts),
                onError = function(jqxhr, status, error) {
                    // error can also stem from a javascript
                    // exception, not only errors described in the
                    // jqxhr.
                    log.error("load error for " + cfg.url + ":", error, jqxhr);
                    $el.trigger({
                        type: "pat-ajax-error",
                        error: error,
                        jqxhr: jqxhr
                    });
                },
                seqNumber = xhrCount.inc(cfg.url),
                onSuccess = function(data, status, jqxhr) {
                    log.debug("success: jqxhr:", jqxhr);
                    if (seqNumber === xhrCount.get(cfg.url)) {
                        // if this url is requested multiple time, only return the last result
                        $el.trigger({
                            type: "pat-ajax-success",
                            jqxhr: jqxhr
                        });
                    } else {
                        // ignore
                    }
                },
                args = {
                    context: $el,
                    data: $el.data("pat-ajax.clicked-data"),
                    url: cfg.url,
                    error: onError,
                    success: onSuccess
                };

            $el.removeData("pat-ajax.clicked-data");
            log.debug("request:", args, $el[0]);
            if ($el.is("form")) {
                $el.ajaxSubmit(args);
            } else {
                $.ajax(args);
            }
        }
    };

    registry.register(_);
    return _;
});

/*!
 * jQuery Browser Plugin 0.0.8
 * https://github.com/gabceb/jquery-browser-plugin
 *
 * Original jquery-browser code Copyright 2005, 2015 jQuery Foundation, Inc. and other contributors
 * http://jquery.org/license
 *
 * Modifications Copyright 2015 Gabriel Cebrian
 * https://github.com/gabceb
 *
 * Released under the MIT license
 *
 * Date: 05-07-2015
 */
/*global window: false */

(function (factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define('jquery.browser',['jquery'], function ($) {
      return factory($);
    });
  } else if (typeof module === 'object' && typeof module.exports === 'object') {
    // Node-like environment
    module.exports = factory(require('jquery'));
  } else {
    // Browser globals
    factory(window.jQuery);
  }
}(function(jQuery) {
  "use strict";

  function uaMatch( ua ) {
    // If an UA is not provided, default to the current browser UA.
    if ( ua === undefined ) {
      ua = window.navigator.userAgent;
    }
    ua = ua.toLowerCase();

    var match = /(edge)\/([\w.]+)/.exec( ua ) ||
        /(opr)[\/]([\w.]+)/.exec( ua ) ||
        /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
        /(version)(applewebkit)[ \/]([\w.]+).*(safari)[ \/]([\w.]+)/.exec( ua ) ||
        /(webkit)[ \/]([\w.]+).*(version)[ \/]([\w.]+).*(safari)[ \/]([\w.]+)/.exec( ua ) ||
        /(webkit)[ \/]([\w.]+)/.exec( ua ) ||
        /(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
        /(msie) ([\w.]+)/.exec( ua ) ||
        ua.indexOf("trident") >= 0 && /(rv)(?::| )([\w.]+)/.exec( ua ) ||
        ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) ||
        [];

    var platform_match = /(ipad)/.exec( ua ) ||
        /(ipod)/.exec( ua ) ||
        /(iphone)/.exec( ua ) ||
        /(kindle)/.exec( ua ) ||
        /(silk)/.exec( ua ) ||
        /(android)/.exec( ua ) ||
        /(windows phone)/.exec( ua ) ||
        /(win)/.exec( ua ) ||
        /(mac)/.exec( ua ) ||
        /(linux)/.exec( ua ) ||
        /(cros)/.exec( ua ) ||
        /(playbook)/.exec( ua ) ||
        /(bb)/.exec( ua ) ||
        /(blackberry)/.exec( ua ) ||
        [];

    var browser = {},
        matched = {
          browser: match[ 5 ] || match[ 3 ] || match[ 1 ] || "",
          version: match[ 2 ] || match[ 4 ] || "0",
          versionNumber: match[ 4 ] || match[ 2 ] || "0",
          platform: platform_match[ 0 ] || ""
        };

    if ( matched.browser ) {
      browser[ matched.browser ] = true;
      browser.version = matched.version;
      browser.versionNumber = parseInt(matched.versionNumber, 10);
    }

    if ( matched.platform ) {
      browser[ matched.platform ] = true;
    }

    // These are all considered mobile platforms, meaning they run a mobile browser
    if ( browser.android || browser.bb || browser.blackberry || browser.ipad || browser.iphone ||
      browser.ipod || browser.kindle || browser.playbook || browser.silk || browser[ "windows phone" ]) {
      browser.mobile = true;
    }

    // These are all considered desktop platforms, meaning they run a desktop browser
    if ( browser.cros || browser.mac || browser.linux || browser.win ) {
      browser.desktop = true;
    }

    // Chrome, Opera 15+ and Safari are webkit based browsers
    if ( browser.chrome || browser.opr || browser.safari ) {
      browser.webkit = true;
    }

    // IE11 has a new token so we will assign it msie to avoid breaking changes
    // IE12 disguises itself as Chrome, but adds a new Edge token.
    if ( browser.rv || browser.edge ) {
      var ie = "msie";

      matched.browser = ie;
      browser[ie] = true;
    }

    // Blackberry browsers are marked as Safari on BlackBerry
    if ( browser.safari && browser.blackberry ) {
      var blackberry = "blackberry";

      matched.browser = blackberry;
      browser[blackberry] = true;
    }

    // Playbook browsers are marked as Safari on Playbook
    if ( browser.safari && browser.playbook ) {
      var playbook = "playbook";

      matched.browser = playbook;
      browser[playbook] = true;
    }

    // BB10 is a newer OS version of BlackBerry
    if ( browser.bb ) {
      var bb = "blackberry";

      matched.browser = bb;
      browser[bb] = true;
    }

    // Opera 15+ are identified as opr
    if ( browser.opr ) {
      var opera = "opera";

      matched.browser = opera;
      browser[opera] = true;
    }

    // Stock Android browsers are marked as Safari on Android.
    if ( browser.safari && browser.android ) {
      var android = "android";

      matched.browser = android;
      browser[android] = true;
    }

    // Kindle browsers are marked as Safari on Kindle
    if ( browser.safari && browser.kindle ) {
      var kindle = "kindle";

      matched.browser = kindle;
      browser[kindle] = true;
    }

     // Kindle Silk browsers are marked as Safari on Kindle
    if ( browser.safari && browser.silk ) {
      var silk = "silk";

      matched.browser = silk;
      browser[silk] = true;
    }

    // Assign the name and platform variable
    browser.name = matched.browser;
    browser.platform = matched.platform;
    return browser;
  }

  // Run the matching process, also assign the function to the returned object
  // for manual, jQuery-free use if desired
  window.jQBrowser = uaMatch( window.navigator.userAgent );
  window.jQBrowser.uaMatch = uaMatch;

  // Only assign to jQuery.browser if jQuery is loaded
  if ( jQuery ) {
    jQuery.browser = window.jQBrowser;
  }

  return window.jQBrowser;
}));

/**
 * Patterns autoscale - scale elements to fit available space
 *
 * Copyright 2012 Humberto Sermeno
 * Copyright 2013 Simplon B.V. - Wichert Akkerman
 */
define('pat-auto-scale',[
    "jquery",
    "jquery.browser",
    "pat-base",
    "pat-registry",
    "pat-parser"
], function($, dummy, Base, registry, Parser) {
    var parser = new Parser("auto-scale");
    parser.addArgument("method", "scale", ["scale", "zoom"]);
    parser.addArgument("min-width", 0);
    parser.addArgument("max-width", 1000000);

    return Base.extend({
        name: "autoscale",
        trigger: ".pat-auto-scale",
        force_method: null,

        init: function($el, opts) {
            this.options = parser.parse(this.$el, opts);
            if (this.force_method !== null) {
                this.options.method = this.force_method;
            }
            this._setup().scale();
            return this.$el;
        },

        _setup: function() {
            if ($.browser.mozilla) {
                // See https://bugzilla.mozilla.org/show_bug.cgi?id=390936
                this.force_method = "scale";
            } else if ($.browser.msie && parseInt($.browser.version, 10) < 9) {
                this.force_method = "zoom";
            }
            $(window).on("resize.autoscale",
                _.debounce(this.scale.bind(this), 250, true)
            );
            $(document).on("pat-update.autoscale", _.debounce(this.scale.bind(this), 250));
            return this;
        },

        scale: function() {
            var available_space, scale, scaled_height, scaled_width;

            if (this.$el[0].tagName.toLowerCase() === "body") {
                available_space = $(window).width();
            } else {
                if (this.$el.closest('.auto-scale-wrapper').length != 0) {
                    available_space = this.$el.closest('.auto-scale-wrapper').parent().outerWidth();
                } else {
                    available_space = this.$el.parent().outerWidth();
                }
            }
            available_space = Math.min(available_space, this.options.maxWidth);
            available_space = Math.max(available_space, this.options.minWidth);
            scale = available_space/this.$el.outerWidth();
            scaled_height = this.$el.outerHeight() * scale;
            scaled_width = this.$el.outerWidth() * scale;

            switch (this.options.method) {
                case "scale":
                    this.$el.css("transform", "scale(" + scale + ")");
                    if (this.$el.parent().attr('class') && $.inArray('auto-scale-wrapper', this.$el.parent().attr('class').split(/\s+/)) === -1) {
                        this.$el.wrap("<div class='auto-scale-wrapper'></div>");                        
                    }
                    this.$el.parent().height(scaled_height).width(scaled_width);
                    break;
                case "zoom":
                    this.$el.css("zoom", scale);
                    break;
            }
            this.$el.addClass("scaled");
            return this;
        }
    });
});

// helper functions to make all input elements
define('pat-input-change-events',[
    "jquery",
    "pat-logger"
], function($, logging) {
    var namespace = "input-change-events",
        log = logging.getLogger(namespace);

    var _ = {
        setup: function($el, pat) {
            if (!pat) {
                log.error("The name of the calling pattern has to be set.");
                return;
            }
            // list of patterns that installed input-change-event handlers
            var patterns = $el.data(namespace) || [];
            log.debug("setup handlers for " + pat);

            if (!patterns.length) {
                log.debug("installing handlers");
                _.setupInputHandlers($el);

                $el.on("patterns-injected." + namespace, function(event) {
                    _.setupInputHandlers($(event.target));
                });
            }
            if (patterns.indexOf(pat) === -1) {
                patterns.push(pat);
                $el.data(namespace, patterns);
            }
        },

        setupInputHandlers: function($el) {
            if (!$el.is(":input")) {
                // We've been given an element that is not a form input. We
                // therefore assume that it's a container of form inputs and
                // register handlers for its children.
                $el.findInclusive(":input").each(_.registerHandlersForElement);
            } else {
                // The element itself is an input, se we simply register a
                // handler fot it.
                _.registerHandlersForElement.bind($el)();
            }
        },

        registerHandlersForElement: function() {
            var $el = $(this),
                isText = $el.is("input:text, input[type=search], textarea");

            if (isText) {
                if ("oninput" in window) {
                    $el.on("input." + namespace, function() {
                        log.debug("translating input");
                        $el.trigger("input-change");
                    });
                } else {
                    // this is the legacy code path for IE8
                    // Work around buggy placeholder polyfill.
                    if ($el.attr("placeholder")) {
                        $el.on("keyup." + namespace, function() {
                            log.debug("translating keyup");
                            $el.trigger("input-change");
                        });
                    } else {
                        $el.on("propertychange." + namespace, function(ev) {
                            if (ev.originalEvent.propertyName === "value") {
                                log.debug("translating propertychange");
                                $el.trigger("input-change");
                            }
                        });
                    }
                }
            } else {
                $el.on("change." + namespace, function() {
                    log.debug("translating change");
                    $el.trigger("input-change");
                });
            }

            $el.on("blur", function() {
                $el.trigger("input-defocus");
            });
        },

        remove: function($el, pat) {
            var patterns = $el.data(namespace) || [];
            if (patterns.indexOf(pat) === -1) {
                log.warn("input-change-events were never installed for " + pat);
            } else {
                patterns = patterns.filter(function(e){return e!==pat;});
                if (patterns.length) {
                    $el.data(namespace, patterns);
                } else {
                    log.debug("remove handlers");
                    $el.removeData(namespace);
                    $el.find(":input").off("." + namespace);
                    $el.off("." + namespace);
                }
            }
        }
    };
    return _;
});

// jshint indent: 4, browser: true, jquery: true, quotmark: double
// vim: sw=4 expandtab
;
/**
 * Patterns autosubmit - automatic submission of forms
 *
 * Copyright 2012-2013 Florian Friesdorf
 * Copyright 2012 Simplon B.V. - Wichert Akkerman
 * Copyright 2013 Marko Durkovic
 * Copyright 2014-2015 Syslab.com GmbH - JC Brand 
 */
define('pat-auto-submit',[
    "jquery",
    "pat-registry",
    "pat-base",
    "pat-logger",
    "pat-parser",
    "pat-input-change-events",
    "pat-utils"
], function($, registry, Base, logging, Parser, input_change_events, utils) {
    var log = logging.getLogger("autosubmit"),
        parser = new Parser("autosubmit");

    // - 400ms -> 400
    // - 400 -> 400
    // - defocus
    parser.addArgument("delay", "400ms");

    return Base.extend({
        name: "autosubmit",
        trigger: ".pat-autosubmit",
        parser: {
            parse: function($el, opts) {
                var cfg = parser.parse($el, opts);
                if (cfg.delay !== "defocus") {
                    cfg.delay = parseInt(cfg.delay.replace(/[^\d]*/g, ""), 10);
                }
                return cfg;
            }
        },

        init: function() {
            this.options = this.parser.parse(this.$el, arguments[1]);
            input_change_events.setup(this.$el, "autosubmit");
            this.registerListeners();
            this.registerTriggers();
            return this.$el;
        },

        registerListeners: function() {
            this.$el.on("input-change-delayed.pat-autosubmit", this.onInputChange);
            this.registerSubformListeners();
            this.$el.on('patterns-injected', this.refreshListeners.bind(this));
        },

        registerSubformListeners: function(ev) {
            /* If there are subforms, we need to listen on them as well, so
             * that only the subform gets submitted if an element inside it
             * changes.
             */
            var $el = typeof ev !== "undefined" ? $(ev.target) : this.$el;
            $el.find(".pat-subform").each(function (idx, el) {
                $(el).on("input-change-delayed.pat-autosubmit", this.onInputChange);
            }.bind(this));
        },

        refreshListeners: function(ev, cfg, el, injected) {
            this.registerSubformListeners();
            // Register change event handlers for new inputs injected into this form
            input_change_events.setup($(injected), "autosubmit");
        },

        registerTriggers: function() {
            var isText = this.$el.is("input:text, input[type=search], textarea");
            if (this.options.delay === "defocus" && !isText) {
                log.error("The defocus delay value makes only sense on text input elements.");
                return this.$el;
            }
            if (this.options.delay === "defocus") {
                this.$el.on("input-defocus.pat-autosubmit", function(ev) {
                    $(ev.target).trigger("input-change-delayed");
                });
            } else if (this.options.delay > 0) {
                this.$el.on("input-change.pat-autosubmit", utils.debounce(function(ev) {
                    $(ev.target).trigger("input-change-delayed");
                }, this.options.delay));
            } else {
                this.$el.on("input-change.pat-autosubmit", function(ev) {
                    $(ev.target).trigger("input-change-delayed");
                });
            }
        },

        destroy: function($el) {
            input_change_events.remove($el, "autosubmit");
            if (this.$el.is("form")) {
                this.$el.find(".pat-subform").addBack(this.$el).each(function (idx, el) {
                    $(el).off(".pat-autosubmit");
                });
            } else {
                $el.off(".pat-autosubmit");
            }
        },

        onInputChange: function(ev) {
            ev.stopPropagation();
            $(this).submit();
            log.debug("triggered by " + ev.type);
        }
    });
});

// jshint indent: 4, browser: true, jquery: true, quotmark: double
// vim: sw=4 expandtab
;
/**
 * Patterns autosuggest - suggestion/completion support
 *
 * Copyright 2012-2013 Florian Friesdorf
 * Copyright 2012 JC Brand
 * Copyright 2013 Marko Durkovic
 */
define('pat-auto-suggest',[
    "jquery",
    "pat-logger",
    "pat-parser",
    "pat-registry",
    "select2"
], function($, logger, Parser, registry) {
    "use strict";
    var log = logger.getLogger("calendar");
    var parser = new Parser("autosuggest");
    parser.addArgument("ajax-data-type", "JSON");
    parser.addArgument("ajax-search-index", "");
    parser.addArgument("ajax-url", "");
    parser.addArgument("allow-new-words", true); // Should custom tags be allowed?
    parser.addArgument("max-selection-size", 0);
    parser.addArgument("placeholder", function($el) { return $el.attr("placeholder") || "Enter text"; });
    parser.addArgument("prefill", function($el) { return $el.val(); });
    parser.addArgument("prefill-json", ""); // JSON format for pre-filling
    parser.addArgument("words", "");
    parser.addArgument("words-json");

    // "selection-classes" allows you to add custom CSS classes to currently
    // selected elements.
    // The value passed in must be an object with each id being the text inside
    // a selection and value being a list of classes to be added to the
    // selection.
    // e.g. {'BMW': ['selected', 'car'], 'BMX': ['selected', 'bicycle']}
    parser.addArgument("selection-classes", "");

    parser.addAlias("maximum-selection-size", "max-selection-size");
    parser.addAlias("data", "prefill-json");
    parser.addAlias("pre-fill", "prefill");

    var _ = {
        name: "autosuggest",
        trigger: ".pat-autosuggest",
        init: function($el, opts) {
            if ($el.length > 1) {
                return $el.each(function() { _.init($(this), opts); });
            }
            var pat_config = parser.parse($el, opts);
            var config = {
                placeholder: $el.attr("readonly") ? "" : pat_config.placeholder,
                tokenSeparators: [","],
                openOnEnter: false,
                maximumSelectionSize: pat_config.maxSelectionSize
            };

            if (pat_config.selectionClasses) {
                // We need to customize the formatting/markup of the selection
                config.formatSelection = function(obj, container) {
                    var selectionClasses = null;
                    try {
                        selectionClasses = $.parseJSON(pat_config.selectionClasses)[obj.text];
                    } catch(SyntaxError) {
                        log.error("SyntaxError: non-JSON data given to pat-autosuggest (selection-classes)");
                    }
                    if (selectionClasses) {
                        // According to Cornelis the classes need to be applied on
                        // the <li>, which is the container's parent
                        container.parent().addClass(selectionClasses.join(" "));
                    }
                    return obj.text;
                };
            }

            if ($el[0].tagName === "INPUT") {
                config = this.configureInput($el, pat_config, config);
            }
            $el.select2(config);
            $el.on("pat-update", function (e, data) {
                if (data.pattern === "depends") {
                    if (data.enabled === true) {
                        $el.select2("enable", true);
                    } else if (data.enabled === false) {
                        $el.select2("disable", true);
                    }

                }
            });

            // suppress propagation for second input field
            $el.prev().on("input-change input-defocus input-change-delayed",
                function(e) { e.stopPropagation(); }
            );

            // Clear the values when a reset button is pressed
            $el.closest("form").find("button[type=reset]").on("click", function () {
                $el.select2("val", "");
            });
            return $el;
        },

        configureInput: function ($el, pat_config, select2_config) {
            var d, data, words, ids = [], prefill;

            select2_config.createSearchChoice = function(term, data) {
                if (pat_config.allowNewWords) {
                    if ($(data).filter(function() { return this.text.localeCompare(term) === 0; }).length === 0) {
                        return { id: term, text: term };
                    }
                }
                else {
                    return null;
                }
            };

            if (pat_config.wordsJson && pat_config.wordsJson.length) {
                try {
                    words = $.parseJSON(pat_config.wordsJson);
                } catch(SyntaxError) {
                    words = [];
                    log.error("SyntaxError: non-JSON data given to pat-autosuggest");
                }
                if (! Array.isArray(words)) {
                    words = $.map(words, function (v, k) { return {id: k, text: v}; });
                }
            } else {
                words = pat_config.words ? pat_config.words.split(/\s*,\s*/) : [];
            }
            select2_config.tags = words;

            if (pat_config.prefill && pat_config.prefill.length) {
                prefill = pat_config.prefill.split(",");
                $el.val(prefill);
                select2_config.initSelection = function (element, callback) {
                    var i, data = [],
                    values = element.val().split(",");
                    for (i=0; i<values.length; i++) {
                        data.push({id: values[i], text: values[i]});
                    }
                    callback(data);
                };
            }

            if (pat_config.prefillJson.length) {
                /* We support two types of JSON data for prefill data:
                 *   {"john-snow": "John Snow", "tywin-lannister": "Tywin Lannister"}
                 * or
                 *   [
                 *    {"id": "john-snow", "text": "John Snow"},
                 *    {"id": "tywin-lannister", "text":"Tywin Lannister"}
                 *   ]
                 */
                try {
                    data = $.parseJSON(pat_config.prefillJson);
                    for (d in data) {
                        if (typeof d === "object") {
                            ids.push(d.id);
                        } else {
                            ids.push(d);
                        }
                    }
                    $el.val(ids);
                    select2_config.initSelection = function (element, callback) {
                        var d, _data = [];
                        for (d in data) {
                            if (typeof d === "object") {
                                _data.push({id: d.id, text: d.text});
                            } else {
                                _data.push({id: d, text: data[d]});
                            }
                        }
                        callback(_data);
                    };
                } catch(SyntaxError) {
                    log.error("SyntaxError: non-JSON data given to pat-autosuggest");
                }
            }

            if ((pat_config.ajax) && (pat_config.ajax.url)) {
                select2_config = $.extend(true, {
                    minimumInputLength: 2,
                    ajax: {
                        url: pat_config.ajax.url,
                        dataType: pat_config.ajax["data-type"],
                        type: "GET",
                        quietMillis: 400,
                        data: function (term, page) {
                            return {
                                index: pat_config.ajax["search-index"],
                                q: term, // search term
                                page_limit: 10,
                                page: page
                            };
                        },
                        results: function (data, page) {
                            // parse the results into the format expected by Select2.
                            // data must be a list of objects with keys "id" and "text"
                            return {results: data, page: page};
                        }
                    }
                }, select2_config);
            }
            return select2_config;
        },

        destroy: function($el) {
            $el.off(".pat-autosuggest");
            $el.select2("destroy");
        },

        transform: function($content) {
            $content.findInclusive("input[type=text].pat-autosuggest").each(function() {
                var $src = $(this),
                    $dest = $("<input type='hidden'/>").insertAfter($src);

                // measure in IE8, otherwise hidden will have width 0
                if (document.all && !document.addEventListener) {
                    $dest.css("width", $src.outerWidth(false)+"px");
                }
                $src.detach();
                $.each($src.prop("attributes"), function() {
                    if (this.name !== "type") {
                        $dest.attr(this.name, this.value);
                    }
                });
                $src.remove();
            });
        }
    };
    registry.register(_);
    return _;
});

// jshint indent: 4, browser: true, jquery: true, quotmark: double
// vim: sw=4 expandtab
;
(function(root) {
define("modernizr-csspositionsticky", ["modernizr"], function() {
  return (function() {
// Sticky positioning - constrains an element to be positioned inside the
// intersection of its container box, and the viewport.
Modernizr.addTest('csspositionsticky', function () {

    var prop = 'position:';
    var value = 'sticky';
    var el = document.createElement('modernizr');
    var mStyle = el.style;

    mStyle.cssText = prop + Modernizr._prefixes.join(value + ';' + prop).slice(0, -prop.length);

    return mStyle.position.indexOf(value) !== -1;
});


  }).apply(root, arguments);
});
}(this));

/**
 * Patterns bumper - `bumper' handling for elements
 *
 * Copyright 2012 Humberto Sermeno
 * Copyright 2013 Florian Friesdorf
 * Copyright 2013-2014 Simplon B.V. - Wichert Akkerman
 */
define('pat-bumper',[
    "jquery",
    "underscore",
    "pat-logger",
    "pat-parser",
    "pat-base",
    "pat-registry",
    "modernizr",
    "modernizr-csspositionsticky"
], function($, _, logger, Parser, Base, registry) {
    var parser = new Parser("bumper"),
        log = logger.getLogger("bumper");

    parser.addArgument("margin", 0);
    parser.addArgument("selector");
    parser.addArgument("bump-add", "bumped");
    parser.addArgument("bump-remove");
    parser.addArgument("unbump-add");
    parser.addArgument("unbump-remove", "bumped");
    parser.addArgument("side", "top", ['all', 'top', 'right', 'bottom', 'left']);

    // XXX Handle resize
    return Base.extend({
        name: "bumper",
        trigger: ".pat-bumper",

        init: function initBumper($el, opts) {
            this.options = parser.parse(this.$el, opts);
            this.$container = this._findScrollContainer();
            var container = this.$container[0];

            if (Modernizr.csspositionsticky) {
                this.$el.addClass("sticky-supported");
            }

            this.$el[0].style.position = "relative";
            if (!this.$container.length) {
                $(window).on("scroll.bumper", this._updateStatus.bind(this));
            } else {
                this.$container.on("scroll.bumper", this._updateStatus.bind(this));
            }
            var bumpall = (this.options.side.indexOf("all") > -1);
            this.options.bumptop =    bumpall || (this.options.side.indexOf("top") > -1);
            this.options.bumpright =  bumpall || (this.options.side.indexOf("right") > -1);
            this.options.bumpbottom = bumpall || (this.options.side.indexOf("bottom") > -1);
            this.options.bumpleft =   bumpall || (this.options.side.indexOf("left") > -1);
            this._updateStatus();
            return this.$el;
        },

        _findScrollContainer: function findScrollContainer() {
            var $parent = this.$el.parent(),
                overflow;
            while (!$parent.is($(document.body)) && $parent.length) {
                if (_.contains(['all', 'top', 'bottom'], this.options.side)) {
                    overflow = $parent.css("overflow-y");
                    if ((overflow === "auto" || overflow === "scroll")) {
                        return $parent;
                    }
                } 
                if (_.contains(['all', 'left', 'right'], this.options.side)) {
                    overflow = $parent.css("overflow-x");
                    if ((overflow === "auto" || overflow === "scroll")) {
                        return $parent;
                    }
                }
                $parent = $parent.parent();
            }
            return $();
        },

        _markBumped: function markBumper(is_bumped) {
            var $target = this.options.selector ? $(this.options.selector) : this.$el,
                todo = is_bumped ? this.options.bump : this.options.unbump;    
            if (todo.add) {
                $target.addClass(todo.add);
            } 
            if (todo.remove) {
                $target.removeClass(todo.remove);
            }
        },

        _updateStatus: function() {
            var sticker = this.$el[0],
                margin = this.options ? this.options.margin : 0,
                frame,
                box = this._getBoundingBox(this.$el, margin),
                delta = {};

            if (this.$container.length) {
                frame = this._getBoundingBox(this.$container, 0); // Scrolling on a container
            } else {
                frame = this._getViewport(); // Scrolling on the window
            }

            delta.top = sticker.style.top ? parseFloat(this.$el.css("top")) : 0;
            delta.left = sticker.style.left ? parseFloat(this.$el.css("left")) : 0;

            box.top -= delta.top;
            box.bottom -= delta.top;
            box.left -= delta.left;
            box.right -= delta.left;

            if ((frame.top > box.top) && this.options.bumptop) {
                sticker.style.top = (frame.top - box.top) + "px";
            } else if ((frame.bottom < box.bottom) && this.options.bumpbottom) {
                sticker.style.top = (frame.bottom - box.bottom) + "px";
            } else {
                sticker.style.top = "";
            }

            if ((frame.left > box.left) && this.options.bumpleft) {
                sticker.style.left = (frame.left - box.left) + "px";
            } else if ((frame.right < box.right) && this.options.bumpright) {
                sticker.style.left = (frame.right - box.right) + "px";
            } else {
                sticker.style.left = "";
            }
            this._markBumped(!!(sticker.style.top || sticker.style.left));
        },

        _getViewport: function getViewport() {
            /* Calculates the bounding box for the current viewport
             */
            var $win = $(window),
                view = {
                    top: $win.scrollTop(),
                    left: $win.scrollLeft()
                };
            view.right = view.left + $win.width();
            view.bottom = view.top + $win.height();
            return view;
        },

        _getBoundingBox: function getBoundingBox($sticker, margin) {
            /* Calculates the bounding box for a given element, taking margins
             * into consideration
             */
            var box = $sticker.offset();
            margin = margin ? margin : 0;
            box.top -= (parseFloat($sticker.css("margin-top")) || 0) + margin;
            box.left -= (parseFloat($sticker.css("margin-left")) || 0) + margin;
            box.right = box.left + $sticker.outerWidth(true) + (2 * margin);
            box.bottom = box.top + $sticker.outerHeight(true) + (2 * margin);
            return box;
        }
    });
});
// vim: sw=4 expandtab
;
/**
 * Patterns checkedflag - Add checked flag to checkbox labels and API
 * for (un)checking.
 *
 * Copyright 2012-2013 Simplon B.V. - Wichert Akkerman
 * Copyright 2012-2013 Florian Friesdorf
 * Copyright 2012-2014 Syslab.com GmBH
 */
define('pat-checked-flag',[
    "jquery",
    "pat-registry",
    "pat-logger",
    "pat-utils"
], function($, patterns, logger, utils) {
    var log = logger.getLogger("checkedflag");

    var checkedflag = {
        name: "checkedflag",
        trigger: "input[type=checkbox],input[type=radio],select",
        jquery_plugin: true,

        init: function($el) {
            var $forms = $();
            $el.each(function() {
                if (this.form === null) {
                    return;
                }
                var $form = $(this.form);
                if ($form.data("pat-checkedflag.reset")) {
                    return;
                }
                $form.data("pat-checkedflag.reset", true);
                $forms = $forms.add(this.form);
            });

            $el.filter("[type=checkbox]")
                .each(checkedflag._onChangeCheckbox)
                .on("change.pat-checkedflag", checkedflag._onChangeCheckbox);

            $el.filter("[type=radio]")
                .each(checkedflag._initRadio)
                .on("change.pat-checkedflag", checkedflag._onChangeRadio);

            $el.filter("select:not([multiple])")
                .each(function() {
                    var $el = $(this);
                    // create parent span if not direct child of a label
                    if ($el.parent("label").length === 0) {
                        $el.wrap("<span />");
                    }
                    checkedflag.onChangeSelect.call(this);
                })
                .on("change.pat-checkedflag", checkedflag.onChangeSelect);

            $el.filter("input:disabled").each(function() {
                $(this).closest("label").addClass("disabled");
            });

            $forms.on("reset.pat-checkedflag", checkedflag._onFormReset);
        },

        destroy: function($el) {
            return $el.off(".pat-checkedflag");
        },

        // XXX: so far I was under the assumption that prop is current
        // state and attr is default and current state. Well, this
        // does not seem to be the case. I feel like doing this
        // without jquery.
        set: function($el, val, opts) {
            opts = opts || {};
            // XXX: no support for radio yet
            return $el.each(function() {
                var $el = $(this);
                if ($el.is("input[type=checkbox]")) {
                    var $input = $(this);
                    if (opts.setdefault) {
                        // XXX: implement me
                    } else {
                        // just change the current state
                        // XXX: not sure whether this is correct
                        $input.prop("checked", val);
                    }
                    checkedflag._onChangeCheckbox.call(this);
                } else if ($el.is("select:not([multiple])")) {
                    var $select = $(this);
                    if (opts.setdefault) {
                        // XXX: implement me
                    } else {
                        // just change the current state
                        $select.find("option:selected")
                            .prop("selected", false);
                        $select.find("option[value=\"" + val + "\"]")
                            .prop("selected", true);
                    }
                    checkedflag.onChangeSelect.call(this);
                } else {
                    log.error("Unsupported element", $el[0]);
                }
            });
        },

        _onFormReset: function() {
            // This event is triggered before the form is reset, and we need
            // the post-reset state to update our pattern. Use a small delay
            // to fix this.
            var form = this;
            setTimeout(function() {
                $("input[type=checkbox]", form).each(checkedflag._onChangeCheckbox);
                $("input[type=radio]", form).each(checkedflag._initRadio);
                $("select:not([multiple])", form).each(checkedflag.onChangeSelect);
            }, 50);
        },

        _getLabelAndFieldset: function(el) {
            var $result = $(utils.findLabel(el));
            return $result.add($(el).closest("fieldset"));
        },

        _getSiblingsWithLabelsAndFieldsets: function(el) {
            var selector = "input[name=\""+el.name+"\"]",
                $related = (el.form===null) ? $(selector) : $(selector, el.form),
                $result = $();
            $result = $related=$related.not(el);
            for (var i=0; i<$related.length; i++) {
                $result=$result.add(checkedflag._getLabelAndFieldset($related[i]));
            }
            return $result;
        },

        _onChangeCheckbox: function() {
            var $el = $(this),
                $label = $(utils.findLabel(this)),
                $fieldset = $el.closest("fieldset");

            if ($el.closest("ul.radioList").length) {
                $label=$label.add($el.closest("li"));
            }

            if (this.checked) {
                $label.add($fieldset).removeClass("unchecked").addClass("checked");
            } else {
                $label.addClass("unchecked").removeClass("checked");
                if ($fieldset.find("input:checked").length) {
                    $fieldset.removeClass("unchecked").addClass("checked");
                } else
                    $fieldset.addClass("unchecked").removeClass("checked");
            }
        },

        _initRadio: function() {
            checkedflag._updateRadio(this, false);
        },

        _onChangeRadio: function() {
            checkedflag._updateRadio(this, true);
        },

        _updateRadio: function(input, update_siblings) {
            var $el = $(input),
                $label = $(utils.findLabel(input)),
                $fieldset = $el.closest("fieldset"),
                $siblings = checkedflag._getSiblingsWithLabelsAndFieldsets(input);

            if ($el.closest("ul.radioList").length) {
                $label=$label.add($el.closest("li"));
                $siblings=$siblings.closest("li");
            }

            if (update_siblings) {
                 $siblings.removeClass("checked").addClass("unchecked");
            }
            if (input.checked) {
                $label.add($fieldset).removeClass("unchecked").addClass("checked");
            } else {
                $label.addClass("unchecked").removeClass("checked");
                if ($fieldset.find("input:checked").length) {
                    $fieldset.removeClass("unchecked").addClass("checked");
                } else {
                    $fieldset.addClass("unchecked").removeClass("checked");
                }
            }
        },

        onChangeSelect: function() {
            var $select = $(this);
            $select.parent().attr(
                "data-option",
                $select.find("option:selected").text()
            );
        }
    };

    patterns.register(checkedflag);
    return checkedflag;
});

// vim: sw=4 expandtab
;
/**
 * @license
 * Patterns @VERSION@ jquery-ext - various jQuery extensions
 *
 * Copyright 2011 Humberto Sermeño
 */
define('pat-jquery-ext',["jquery"], function($) {
    var methods = {
        init: function( options ) {
            var settings = {
                time: 3, /* time it will wait before moving to "timeout" after a move event */
                initialTime: 8, /* time it will wait before first adding the "timeout" class */
                exceptionAreas: [] /* IDs of elements that, if the mouse is over them, will reset the timer */
            };
            return this.each(function() {
                var $this = $(this),
                    data = $this.data("timeout");

                if (!data) {
                    if ( options ) {
                        $.extend( settings, options );
                    }
                    $this.data("timeout", {
                        "lastEvent": new Date(),
                        "trueTime": settings.time,
                        "time": settings.initialTime,
                        "untouched": true,
                        "inExceptionArea": false
                    });

                    $this.bind( "mouseover.timeout", methods.mouseMoved );
                    $this.bind( "mouseenter.timeout", methods.mouseMoved );

                    $(settings.exceptionAreas).each(function() {
                        $this.find(this)
                            .live( "mouseover.timeout", {"parent":$this}, methods.enteredException )
                            .live( "mouseleave.timeout", {"parent":$this}, methods.leftException );
                    });

                    if (settings.initialTime > 0)
                        $this.timeout("startTimer");
                    else
                        $this.addClass("timeout");
                }
            });
        },

        enteredException: function(event) {
            var data = event.data.parent.data("timeout");
            data.inExceptionArea = true;
            event.data.parent.data("timeout", data);
            event.data.parent.trigger("mouseover");
        },

        leftException: function(event) {
            var data = event.data.parent.data("timeout");
            data.inExceptionArea = false;
            event.data.parent.data("timeout", data);
        },

        destroy: function() {
            return this.each( function() {
                var $this = $(this),
                    data = $this.data("timeout");

                $(window).unbind(".timeout");
                data.timeout.remove();
                $this.removeData("timeout");
            });
        },

        mouseMoved: function() {
            var $this = $(this), data = $this.data("timeout");

            if ($this.hasClass("timeout")) {
                $this.removeClass("timeout");
                $this.timeout("startTimer");
            } else if ( data.untouched ) {
                data.untouched = false;
                data.time = data.trueTime;
            }

            data.lastEvent = new Date();
            $this.data("timeout", data);
        },

        startTimer: function() {
            var $this = $(this), data = $this.data("timeout");
            var fn = function(){
                var data = $this.data("timeout");
                if ( data && data.lastEvent ) {
                    if ( data.inExceptionArea ) {
                        setTimeout( fn, Math.floor( data.time*1000 ) );
                    } else {
                        var now = new Date();
                        var diff = Math.floor(data.time*1000) - ( now - data.lastEvent );
                        if ( diff > 0 ) {
                            // the timeout has not ocurred, so set the timeout again
                            setTimeout( fn, diff+100 );
                        } else {
                            // timeout ocurred, so set the class
                            $this.addClass("timeout");
                        }
                    }
                }
            };

            setTimeout( fn, Math.floor( data.time*1000 ) );
        }
    };

    $.fn.timeout = function( method ) {
        if ( methods[method] ) {
            return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === "object" || !method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( "Method " + method + " does not exist on jQuery.timeout" );
        }
    };

    // Custom jQuery selector to find elements with scrollbars
    $.extend($.expr[":"], {
        scrollable: function(element) {
            var vertically_scrollable, horizontally_scrollable;
            if ($(element).css("overflow") === "scroll" ||
                $(element).css("overflowX") === "scroll" ||
                $(element).css("overflowY") === "scroll")
                return true;

            vertically_scrollable = (element.clientHeight < element.scrollHeight) && (
                $.inArray($(element).css("overflowY"), ["scroll", "auto"]) !== -1 || $.inArray($(element).css("overflow"), ["scroll", "auto"]) !== -1);

            if (vertically_scrollable)
                return true;

            horizontally_scrollable = (element.clientWidth < element.scrollWidth) && (
                $.inArray($(element).css("overflowX"), ["scroll", "auto"]) !== -1 || $.inArray($(element).css("overflow"), ["scroll", "auto"]) !== -1);
            return horizontally_scrollable;
        }
    });

    // Make Visible in scroll
    $.fn.makeVisibleInScroll = function( parent_id ) {
        var absoluteParent = null;
        if ( typeof parent_id === "string" ) {
            absoluteParent = $("#" + parent_id);
        } else if ( parent_id ) {
            absoluteParent = $(parent_id);
        }

        return this.each(function() {
            var $this = $(this), parent;
            if (!absoluteParent) {
                parent = $this.parents(":scrollable");
                if (parent.length > 0) {
                    parent = $(parent[0]);
                } else {
                    parent = $(window);
                }
            } else {
                parent = absoluteParent;
            }

            var elemTop = $this.position().top;
            var elemBottom = $this.height() + elemTop;

            var viewTop = parent.scrollTop();
            var viewBottom = parent.height() + viewTop;

            if (elemTop < viewTop) {
                parent.scrollTop(elemTop);
            } else if ( elemBottom > viewBottom - parent.height()/2 ) {
                parent.scrollTop( elemTop - (parent.height() - $this.height())/2 );
            }
        });
    };

    //Make absolute location
    $.fn.setPositionAbsolute = function(element,offsettop,offsetleft) {
        return this.each(function() {
            // set absolute location for based on the element passed
            // dynamically since every browser has different settings
            var $this = $(this);
            var thiswidth = $(this).width();
            var    pos   = element.offset();
            var    width = element.width();
            var    height = element.height();
            var setleft = (pos.left + width - thiswidth + offsetleft);
            var settop = (pos.top + height + offsettop);
            $this.css({ "z-index" : 1, "position": "absolute", "marginLeft": 0, "marginTop": 0, "left": setleft + "px", "top":settop + "px" ,"width":thiswidth});
            $this.remove().appendTo("body").show();
        });
    };

    $.fn.positionAncestor = function(selector) {
        var left = 0;
        var top = 0;
        this.each(function() {
            // check if current element has an ancestor matching a selector
            // and that ancestor is positioned
            var $ancestor = $(this).closest(selector);
            if ($ancestor.length && $ancestor.css("position") !== "static") {
                var $child = $(this);
                var childMarginEdgeLeft = $child.offset().left - parseInt($child.css("marginLeft"), 10);
                var childMarginEdgeTop = $child.offset().top - parseInt($child.css("marginTop"), 10);
                var ancestorPaddingEdgeLeft = $ancestor.offset().left + parseInt($ancestor.css("borderLeftWidth"), 10);
                var ancestorPaddingEdgeTop = $ancestor.offset().top + parseInt($ancestor.css("borderTopWidth"), 10);
                left = childMarginEdgeLeft - ancestorPaddingEdgeLeft;
                top = childMarginEdgeTop - ancestorPaddingEdgeTop;
                // we have found the ancestor and computed the position
                // stop iterating
                return false;
            }
        });
        return {
            left:    left,
            top:    top
        };
    };


    // XXX: In compat.js we include things for browser compatibility,
    // but these two seem to be only convenience. Do we really want to
    // include these as part of patterns?
    String.prototype.startsWith = function(str) { return (this.match("^"+str) !== null); };
    String.prototype.endsWith = function(str) { return (this.match(str+"$") !== null); };


    /******************************

     Simple Placeholder

     ******************************/

    $.simplePlaceholder = {
        placeholder_class: null,

        hide_placeholder: function(){
            var $this = $(this);
            if($this.val() === $this.attr("placeholder")){
                $this.val("").removeClass($.simplePlaceholder.placeholder_class);
            }
        },

        show_placeholder: function(){
            var $this = $(this);
            if($this.val() === ""){
                $this.val($this.attr("placeholder")).addClass($.simplePlaceholder.placeholder_class);
            }
        },

        prevent_placeholder_submit: function(){
            $(this).find(".simple-placeholder").each(function() {
                var $this = $(this);
                if ($this.val() === $this.attr("placeholder")){
                    $this.val("");
                }
            });
            return true;
        }
    };

    $.fn.simplePlaceholder = function(options) {
        if(document.createElement("input").placeholder === undefined){
            var config = {
                placeholder_class : "placeholding"
            };

            if(options) $.extend(config, options);
            $.simplePlaceholder.placeholder_class = config.placeholder_class;

            this.each(function() {
                var $this = $(this);
                $this.focus($.simplePlaceholder.hide_placeholder);
                $this.blur($.simplePlaceholder.show_placeholder);
                if($this.val() === "") {
                    $this.val($this.attr("placeholder"));
                    $this.addClass($.simplePlaceholder.placeholder_class);
                }
                $this.addClass("simple-placeholder");
                $(this.form).submit($.simplePlaceholder.prevent_placeholder_submit);
            });
        }

        return this;
    };

    $.fn.findInclusive = function(selector) {
        return this.find('*').addBack().filter(selector);
    };

    $.fn.slideIn = function(speed, easing, callback) {
        return this.animate({width: "show"}, speed, easing, callback);
    };

    $.fn.slideOut = function(speed, easing, callback) {
        return this.animate({width: "hide"}, speed, easing, callback);
    };

    // case-insensitive :contains
    $.expr[":"].Contains = function(a, i, m) {
        return $(a).text().toUpperCase().indexOf(m[3].toUpperCase()) >= 0;
    };

    $.fn.scopedFind = function (selector) {
        /*  If the selector starts with an object id do a global search,
         *  otherwise do a local search.
         */
        if (selector.startsWith('#')) {
            return $(selector);
        } else {
            return this.find(selector);
        }
    };
});

/**
 * Patterns checklist - Easily (un)check all checkboxes
 *
 * Copyright 2012-2013 Simplon B.V. - Wichert Akkerman
 * Copyright 2012-2013 Florian Friesdorf
 */
define('pat-checklist',[
    "jquery",
    "pat-jquery-ext",
    "pat-parser",
    "pat-registry"
], function($, dummy, Parser, registry) {
    var parser = new Parser("checklist");
    parser.addArgument("select", ".select-all");
    parser.addArgument("deselect", ".deselect-all");

    var _ = {
        name: "checklist",
        trigger: ".pat-checklist",
        jquery_plugin: true,

        init: function($el, opts) {
            return $el.each(function() {
                var $trigger = $(this),
                    options = parser.parse($trigger, opts, false);

                $trigger.data("patternChecklist", options);
                $trigger.scopedFind(options.select)
                    .on("click.pat-checklist", {trigger: $trigger}, _.onSelectAll);
                $trigger.scopedFind(options.deselect)
                    .on("click.pat-checklist", {trigger: $trigger}, _.onDeselectAll);
                $trigger.on("change.pat-checklist", {trigger: $trigger}, _.onChange);
                // update select/deselect button status
                _.onChange({data: {trigger: $trigger}});
            });
        },

        destroy: function($el) {
            return $el.each(function() {
                var $trigger = $(this),
                    options = $trigger.data("patternChecklist");
                $trigger.scopedFind(options.select).off(".pat-checklist");
                $trigger.scopedFind(options.deselect).off(".pat-checklist");
                $trigger.off(".pat-checklist", "input[type=checkbox]");
                $trigger.data("patternChecklist", null);
            });
        },

        onChange: function(event) {
            var $trigger = event.data.trigger,
                options = $trigger.data("patternChecklist"),
                deselect = $trigger.scopedFind(options.deselect),
                select = $trigger.scopedFind(options.select);
            if ($trigger.find("input[type=checkbox]:visible:checked").length===0) {
                deselect.prop("disabled", true);
            } else {
                deselect.prop("disabled", false);
            }

            if ($trigger.find("input[type=checkbox]:visible:not(:checked)").length===0) {
                select.prop("disabled", true);
            } else {
                select.prop("disabled", false);
            }
        },

        onSelectAll: function(event) {
            var $trigger = event.data.trigger,
                options = $trigger.data("patternChecklist");
            $trigger.find("input[type=checkbox]:not(:checked)").each(function () {
                $(this).prop("checked", true).trigger("change");
            });
            $trigger.scopedFind(options.deselect).each(function () {
                $(this).prop("disabled", false);
            });
            $trigger.scopedFind(options.select).each(function () {
                $(this).attr({disabled: "disabled"});
            });
            event.preventDefault();
        },

        onDeselectAll: function(event) {
            var $trigger = event.data.trigger,
                options = $trigger.data("patternChecklist");
            $trigger.find("input[type=checkbox]:checked").each(function () {
                $(this).prop("checked", false).trigger("change");
            });
            $trigger.scopedFind(options.select).each(function () {
                $(this).prop("disabled", false);
            });
            $trigger.scopedFind(options.deselect).each(function () {
                $(this).attr({disabled: "disabled"});
            });
            event.preventDefault();
        }
    };
    registry.register(_);
    return _;
});

// jshint indent: 4, browser: true, jquery: true, quotmark: double
// vim: sw=4 expandtab
;
/* Clone pattern */
define("pat-clone",[
    "jquery",
    "pat-parser",
    "pat-registry",
    "pat-base",
    "pat-logger"
], function($, Parser, registry, Base, logger) {
    "use strict";
    var log = logger.getLogger("pat-clone");
    var parser = new Parser("clone");
    parser.addArgument("max");
    parser.addArgument("template", ":first");
    parser.addArgument("trigger-element", ".add-clone");
    parser.addArgument("remove-element", ".remove-clone");
    parser.addArgument("remove-behaviour", "confirm", ["confirm", "none"]);
    parser.addArgument("remove-confirmation", "Are you sure you want to remove this element?");
    parser.addArgument("clone-element", ".clone");
    parser.addAlias("remove-behavior", "remove-behaviour");
    var TEXT_NODE = 3;

    return Base.extend({
        name: "clone",
        trigger: ".pat-clone",

        init: function patCloneInit($el, opts) {
            this.options = parser.parse(this.$el, opts);
            if (this.options.template.lastIndexOf(":", 0) === 0) {
                this.$template = this.$el.find(this.options.template);
            } else {
                this.$template = $(this.options.template);
            }
            $(document).on("click", this.options.triggerElement, this.clone.bind(this));

            var $clones = this.$el.find(this.options.cloneElement);
            this.num_clones = $clones.length;
            $clones.each(function (idx, clone) {
                var $clone = $(clone);
                $clone.find(this.options.remove.element).on("click", this.confirmRemoval.bind(this, $clone));
            }.bind(this));
        },

        clone: function clone() {
            if (this.num_clones >= this.options.max) {
                alert("Sorry, only "+this.options.max+" elements allowed.");
                return;
            }
            this.num_clones += 1;
            var $clone = this.$template.safeClone();
            var ids = ($clone.attr("id") || "").split(" ");
            $clone.removeAttr("id").removeClass("cant-touch-this");
            $.each(ids, function (idx, id) {
                // Re-add all ids that have the substring #{1} in them, while
                // also replacing that substring with the number of clones.
                if (id.indexOf("#{1}") !== -1) {
                    $clone.attr("id",
                        $clone.attr("id") ? $clone.attr("id") + " " : "" +
                            id.replace("#{1}", this.num_clones));
                }
            }.bind(this));

            $clone.appendTo(this.$el);
            $clone.children().addBack().contents().addBack().filter(this.incrementValues.bind(this));
            $clone.find(this.options.remove.element).on("click", this.confirmRemoval.bind(this, $clone));

            $clone.removeAttr("hidden");
            registry.scan($clone);

            $clone.trigger("pat-update", {'pattern':"clone", 'action': 'clone', '$el': $clone});
            if (this.num_clones >= this.options.max) {
                $(this.options.triggerElement).hide();
            }
        },

        incrementValues: function incrementValues(idx, el) {
            var $el = $(el);
            $el.children().addBack().contents().filter(this.incrementValues.bind(this));
            var callback = function (idx, attr) {
                if (attr.name === "type" || !$el.attr(attr.name)) { return; }
                try {
                    $el.attr(attr.name, $el.attr(attr.name).replace("#{1}", this.num_clones));
                } catch (e) {
                    log.warn(e);
                }
            };
            if (el.nodeType !== TEXT_NODE) {
                $.each(el.attributes, callback.bind(this));
            } else if (el.data.length) {
                el.data = el.data.replace("#{1}", this.num_clones);
            }
        },

        confirmRemoval: function confirmRemoval($el, callback) {
            if (this.options.remove.behaviour === "confirm") {
                if (window.confirm(this.options.remove.confirmation) === true) {
                    this.remove($el);
                }
            } else {
                this.remove($el);
            }
        },

        remove: function remove($el) {
            $el.remove();
            this.num_clones -= 1;
            if (this.num_clones < this.options.max) {
                $(this.options.triggerElement).show();
            }
            this.$el.trigger("pat-update", {'pattern':"clone", 'action': 'remove', '$el': $el});
        }
    });
});
// vim: sw=4 expandtab
;
/*
 * HTML Parser By John Resig (ejohn.org)
 * Original code by Erik Arvidsson, Mozilla Public License
 * http://erik.eae.net/simplehtmlparser/simplehtmlparser.js
 *
 * Modified by Wichert Akkerman to support act as a module and handle new
 * HTML5 elements.
 *
 * // Use like so:
 * HTMLParser(htmlString, {
 *     start: function(tag, attrs, unary) {},
 *     end: function(tag) {},
 *     chars: function(text) {},
 *     comment: function(text) {}
 * });
 *
 * // or to get an XML string:
 * HTMLtoXML(htmlString);
 *
 * // or to get an XML DOM Document
 * HTMLtoDOM(htmlString);
 *
 * // or to inject into an existing document/DOM node
 * HTMLtoDOM(htmlString, document);
 * HTMLtoDOM(htmlString, document.body);
 *
 */

define('pat-htmlparser',[],function(){

	// Regular Expressions for parsing tags and attributes
	var startTag = /^<([\-A-Za-z0-9:_]+)((?:\s+[\-A-Za-z0-9:_]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/,
		endTag = /^<\/([\-A-Za-z0-9:_]+)[^>]*>/,
		attr = /([\-A-Za-z0-9:_]+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g;

	// Empty Elements - HTML 5 Working Draft 25 October 2012
	var empty = makeMap("area,base,basefont,br,col,frame,hr,img,input,isindex,link,meta,param,embed,command,source,embed,track");

	// Block Elements - HTML 5 Working Draft 25 October 2012 and Web Components
	var block = makeMap("address,applet,blockquote,button,center,dd,del,dir,div,dl,dt,fieldset,form,frameset,hr,iframe,ins,isindex,li,map,menu,noframes,noscript,object,ol,p,pre,script,table,tbody,td,tfoot,th,thead,tr,ul,article,aside,details,dialog,summary,figure,footer,header,hgroup,nav,section,audio,video,canvas,datalist,template,element,shadow,decorator,content");

	// Inline Elements - HTML 5 Working Draft 25 October 2012
	var inline = makeMap("a,abbr,acronym,applet,b,basefont,bdo,big,br,button,cite,code,del,dfn,em,font,i,iframe,img,input,ins,kbd,label,map,object,q,s,samp,script,select,small,span,strike,strong,sub,sup,textarea,tt,u,var,bdi,bdo,figcaption,mark,meter,progress,ruby,rt,rp,time,wbr");

	// Elements that you can, intentionally, leave open
	// (and which close themselves)
	var closeSelf = makeMap("colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr");

	// Attributes that have their values filled in disabled="disabled"
	var fillAttrs = makeMap("checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected");

	// Special Elements (can contain anything) Reference: http://www.w3.org/TR/html-markup/syntax.html#replaceable-character-data
	var special = makeMap("script,style,textarea,title");

	var HTMLParser = this.HTMLParser = function( html, handler ) {
		var index, chars, match, stack = [], last = html;
		stack.last = function(){
			return this[ this.length - 1 ];
		};

		if (html.indexOf("<!DOCTYPE")===0) {
			index = html.indexOf(">");
			if (index>=0) {
				if (handler.doctype)
					handler.doctype(html.substring(10, index));
				html = html.substring(index + 1).replace(/^\s+/,"");
			}
		}

		while ( html ) {
			chars = true;

			// Make sure we're not in a script or style element
			if ( !stack.last() || !special[ stack.last() ] ) {

				// Comment
				if ( html.indexOf("<!--")=== 0 ) {
					index = html.indexOf("-->");

					if ( index >= 0 ) {
						if ( handler.comment )
							handler.comment( html.substring( 4, index ) );
						html = html.substring( index + 3 );
						chars = false;
					}

				// end tag
				} else if ( html.indexOf("</") === 0 ) {
					match = html.match( endTag );

					if ( match ) {
						html = html.substring( match[0].length );
						match[0].replace( endTag, parseEndTag );
						chars = false;
					}

				// start tag
				} else if ( html.indexOf("<") === 0 ) {
					match = html.match( startTag );

					if ( match ) {
						html = html.substring( match[0].length );
						match[0].replace( startTag, parseStartTag );
						chars = false;
					}
				}

				if ( chars ) {
					index = html.indexOf("<");

					var text = index < 0 ? html : html.substring( 0, index );
					html = index < 0 ? "" : html.substring( index );

					if ( handler.chars )
						handler.chars( text );
				}

			} else {
				html = html.replace(new RegExp("(.*)<\/" + stack.last() + "[^>]*>"), function(all, text){
					text = text.replace(/<!--(.*?)-->/g, "$1")
						.replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1");

					if ( handler.chars )
						handler.chars( text );

					return "";
				});

				parseEndTag( "", stack.last() );
			}

			if ( html === last )
				throw "Parse Error: " + html;
			last = html;
		}

		// Clean up any remaining tags
		parseEndTag();

		function parseStartTag( tag, tagName, rest, unary ) {
			tagName = tagName.toLowerCase();

			if ( block[ tagName ] ) {
				while ( stack.last() && inline[ stack.last() ] ) {
					parseEndTag( "", stack.last() );
				}
			}

			if ( closeSelf[ tagName ] && stack.last() === tagName ) {
				parseEndTag( "", tagName );
			}

			unary = empty[ tagName ] || !!unary;

			if ( !unary )
				stack.push( tagName );

			if ( handler.start ) {
				var attrs = [];

				rest.replace(attr, function(match, name) {
					var value = arguments[2] ? arguments[2] :
						arguments[3] ? arguments[3] :
						arguments[4] ? arguments[4] :
						fillAttrs[name] ? name : "";

					attrs.push({
						name: name,
						value: value,
						escaped: value.replace(/"/g, "&quot;")
					});
				});

				if ( handler.start )
					handler.start( tagName, attrs, unary );
			}
		}

		function parseEndTag( tag, tagName ) {
			var pos;
			// If no tag name is provided, clean shop
			if ( !tagName )
				pos = 0;

			// Find the closest opened tag of the same type
			else
				for ( pos = stack.length - 1; pos >= 0; pos-- )
					if ( stack[ pos ] === tagName )
						break;

			if ( pos >= 0 ) {
				// Close all the open elements, up the stack
				for ( var i = stack.length - 1; i >= pos; i-- )
					if ( handler.end )
						handler.end( stack[ i ] );

				// Remove the open elements from the stack
				stack.length = pos;
			}
		}
	};

	this.HTMLtoXML = function( html ) {
		var results = "";

		HTMLParser(html, {
			start: function( tag, attrs, unary ) {
				results += "<" + tag;

				for ( var i = 0; i < attrs.length; i++ )
					results += " " + attrs[i].name + '="' + attrs[i].escaped + '"';

				results += (unary ? "/" : "") + ">";
			},
			end: function( tag ) {
				results += "</" + tag + ">";
			},
			chars: function( text ) {
				results += text;
			},
			comment: function( text ) {
				results += "<!--" + text + "-->";
			}
		});

		return results;
	};

	this.HTMLtoDOM = function( html, doc ) {
		// There can be only one of these elements
		var one = makeMap("html,head,body,title");

		// Enforce a structure for the document
		var structure = {
			link: "head",
			base: "head"
		};

		if ( !doc ) {
			if ( typeof DOMDocument !== "undefined" )
				doc = new DOMDocument();
			else if ( typeof document !== "undefined" && document.implementation && document.implementation.createDocument )
				doc = document.implementation.createDocument("", "", null);
			else if ( typeof ActiveX !== "undefined" )
				doc = new ActiveXObject("Msxml.DOMDocument");

		} else
			doc = doc.ownerDocument ||
				doc.getOwnerDocument && doc.getOwnerDocument() ||
				doc;

		var elems = [],
			documentElement = doc.documentElement ||
				doc.getDocumentElement && doc.getDocumentElement();

		// If we're dealing with an empty document then we
		// need to pre-populate it with the HTML document structure
		if ( !documentElement && doc.createElement ) (function(){
			var html = doc.createElement("html");
			var head = doc.createElement("head");
			head.appendChild( doc.createElement("title") );
			html.appendChild( head );
			html.appendChild( doc.createElement("body") );
			doc.appendChild( html );
		})();

		// Find all the unique elements
		if ( doc.getElementsByTagName )
			for ( var i in one )
				one[ i ] = doc.getElementsByTagName( i )[0];

		// If we're working with a document, inject contents into
		// the body element
		var curParentNode = one.body;

		HTMLParser( html, {
			start: function( tagName, attrs, unary ) {
				// If it's a pre-built element, then we can ignore
				// its construction
				if ( one[ tagName ] ) {
					curParentNode = one[ tagName ];
					if ( !unary ) {
						elems.push( curParentNode );
					}
					return;
				}

				var elem = doc.createElement( tagName );

				for ( var attr in attrs )
					elem.setAttribute( attrs[ attr ].name, attrs[ attr ].value );

				if ( structure[ tagName ] && typeof one[ structure[ tagName ] ] !== "boolean" )
					one[ structure[ tagName ] ].appendChild( elem );

				else if ( curParentNode && curParentNode.appendChild )
					curParentNode.appendChild( elem );

				if ( !unary ) {
					elems.push( elem );
					curParentNode = elem;
				}
			},
			end: function( /* tag */ ) {
				elems.length -= 1;

				// Init the new parentNode
				curParentNode = elems[ elems.length - 1 ];
			},
			chars: function( text ) {
				curParentNode.appendChild( doc.createTextNode( text ) );
			},
			comment: function( /* text */ ) {
				// create comment node
			}
		});

		return doc;
	};

	function makeMap(str){
		var obj = {}, items = str.split(",");
		for ( var i = 0; i < items.length; i++ )
			obj[ items[i] ] = true;
		return obj;
	}

	return {HTMLParser: HTMLParser,
		HTMLtoXML: HTMLtoXML,
		HTMLtoDOM: HTMLtoDOM
	};
});

define('pat-inject',[
    "jquery",
    "underscore",
    "pat-ajax",
    "pat-parser",
    "pat-logger",
    "pat-registry",
    "pat-utils",
    "pat-htmlparser",
    "pat-jquery-ext"  // for :scrollable for autoLoading-visible
], function($, _, ajax, Parser, logger, registry, utils, htmlparser) {
    var log = logger.getLogger("pat.inject"),
        parser = new Parser("inject"),
        TEXT_NODE = 3,
        COMMENT_NODE = 8;

    parser.addArgument("selector");
    parser.addArgument("target");
    parser.addArgument("data-type", "html");
    parser.addArgument("next-href");
    parser.addArgument("source");
    parser.addArgument("trigger", "default", ["default", "autoload", "autoload-visible"]);
    parser.addArgument("delay", 0);    // only used in autoload
    parser.addArgument("confirm", 'class', ['never', 'always', 'form-data', 'class']);
    parser.addArgument("confirm-message", 'Are you sure you want to leave this page?');
    parser.addArgument("hooks", [], ["raptor"], true); // After injection, pat-inject will trigger an event for each hook: pat-inject-hook-$(hook)
    parser.addArgument("loading-class", "injecting"); // Add a class to the target while content is still loading.
    parser.addArgument("class"); // Add a class to the injected content.
    parser.addArgument("history");
    // XXX: this should not be here but the parser would bail on
    // unknown parameters and expand/collapsible need to pass the url
    // to us
    parser.addArgument("url");

    var inject = {
        name: "inject",
        trigger: ".raptor-ui .ui-button.pat-inject, a.pat-inject, form.pat-inject, .pat-subform.pat-inject",
        init: function inject_init($el, opts) {
            var cfgs = inject.extractConfig($el, opts);
            if (cfgs.some(function(e){return e.history === "record";}) && !("pushState" in history)) {
                // if the injection shall add a history entry and HTML5 pushState
                // is missing, then don't initialize the injection.
                return $el;
            }
            $el.data("pat-inject", cfgs);

            if (cfgs[0].nextHref && cfgs[0].nextHref.indexOf('#') === 0) {
                // In case the next href is an anchor, and it already
                // exists in the page, we do not activate the injection
                // but instead just change the anchors href.

                // XXX: This is used in only one project for linked
                // fullcalendars, it's sanity is wonky and we should
                // probably solve it differently.
                if ($el.is("a") && $(cfgs[0].nextHref).length > 0) {
                    log.debug("Skipping as next href is anchor, which already exists", cfgs[0].nextHref);
                    // XXX: reconsider how the injection enters exhausted state
                    return $el.attr({href: (window.location.href.split("#")[0] || "") + cfgs[0].nextHref});
                }
            }

            switch (cfgs[0].trigger) {
            case "default":
                // setup event handlers
                if ($el.is("form")) {
                    $el.on("submit.pat-inject", inject.onTrigger)
                        .on("click.pat-inject", "[type=submit]", ajax.onClickSubmit)
                        .on("click.pat-inject", "[type=submit][formaction], [type=image][formaction]", inject.onFormActionSubmit);
                } else if ($el.is(".pat-subform")) {
                    log.debug("Initializing subform with injection");
                } else {
                    $el.on("click.pat-inject", inject.onTrigger);
                }
                break;
            case "autoload":
                if (!cfgs[0].delay) {
                    inject.onTrigger.apply($el[0], []);
                } else {
                    // function to trigger the autoload and mark as triggered
                    function delayed_trigger() {
                        $el.data("pat-inject-autoloaded", true);
                        inject.onTrigger.apply($el[0], []);
                        return true;
                    }
                    window.setTimeout(delayed_trigger, cfgs[0].delay);
                }
                break;
            case "autoload-visible":
                inject._initAutoloadVisible($el);
                break;
            }

            log.debug("initialised:", $el);
            return $el;
        },

        destroy: function inject_destroy($el) {
            $el.off(".pat-inject");
            $el.data("pat-inject", null);
            return $el;
        },

        onTrigger: function inject_onTrigger(ev) {
            /* Injection has been triggered, either via form submission or a
             * link has been clicked.
             */
            var cfgs = $(this).data("pat-inject"),
                $el = $(this);
            if (ev)
                ev.preventDefault();
            $el.trigger("patterns-inject-triggered");
            inject.execute(cfgs, $el);
        },

        onFormActionSubmit: function inject_onFormActionSubmit(ev) {
            ajax.onClickSubmit(ev); // make sure the submitting button is sent with the form

            var $button = $(ev.target),
                formaction = $button.attr("formaction"),
                $form = $button.parents(".pat-inject").first(),
                opts = {url: formaction},
                $cfg_node = $button.closest("[data-pat-inject]"),
                cfgs = inject.extractConfig($cfg_node, opts);

            ev.preventDefault();
            $form.trigger("patterns-inject-triggered");
            inject.execute(cfgs, $form);
        },

        submitSubform: function inject_submitSubform($sub) {
            /* This method is called from pat-subform
             */
            var $el = $sub.parents("form"),
                cfgs = $sub.data("pat-inject");

            // store the params of the subform in the config, to be used by history
            $(cfgs).each(function(i, v) {v.params = $.param($sub.serializeArray());});

            try {
                $el.trigger("patterns-inject-triggered");
            } catch (e) {
                log.error("patterns-inject-triggered", e);
            }
            inject.execute(cfgs, $el);
        },

        extractConfig: function inject_extractConfig($el, opts) {
            opts = $.extend({}, opts);

            var cfgs = parser.parse($el, opts, true);
            cfgs.forEach(function inject_extractConfig_each(cfg) {
                var urlparts, defaultSelector;
                // opts and cfg have priority, fallback to href/action
                cfg.url = opts.url || cfg.url || $el.attr("href") ||
                    $el.attr("action") || $el.parents("form").attr("action") ||
                    "";

                // separate selector from url
                urlparts = cfg.url.split("#");
                cfg.url = urlparts[0];

                // if no selector, check for selector as part of original url
                defaultSelector = urlparts[1] && "#" + urlparts[1] || "body";

                if (urlparts.length > 2) {
                    log.warn("Ignoring additional source ids:", urlparts.slice(2));
                }

                cfg.selector = cfg.selector || defaultSelector;
            });
            return cfgs;
        },

        elementIsDirty: function(m) {
            /* Check whether the passed in form element contains a value.
             */
            var data = $.map(m.find(":input:not(select)"),
                function(i) {
                    var val = $(i).val();
                    return (Boolean(val) && val !== $(i).attr('placeholder'));
                });
            return $.inArray(true, data)!==-1;
        },

        askForConfirmation: function inject_askForConfirmation(cfgs) {
            /* If configured to do so, show a confirmation dialog to the user.
             * This is done before attempting to perform injection.
             */
            var should_confirm = false, message;

            _.each(cfgs, function(cfg) {
                var _confirm = false;
                if (cfg.confirm == 'always') {
                    _confirm = true;
                } else if (cfg.confirm === 'form-data') {
                    _confirm = inject.elementIsDirty(cfg.$target);
                } else if (cfg.confirm === 'class') {
                    _confirm = cfg.$target.hasClass('is-dirty');
                }
                if (_confirm) {
                    should_confirm = true;
                    message = cfg.confirmMessage;
                }
            });
            if (should_confirm) {
                if (!window.confirm(message)) {
                    return false;
                }
            }
            return true;
        },

        ensureTarget: function inject_ensureTarget(cfg, $el) {
            /* Make sure that a target element exists and that it's assigned to
             * cfg.$target.
             */
            // make sure target exist
            cfg.$target = cfg.$target || (cfg.target==="self" ? $el : $(cfg.target));
            if (cfg.$target.length === 0) {
                if (!cfg.target) {
                    log.error("Need target selector", cfg);
                    return false;
                }
                cfg.$target = inject.createTarget(cfg.target);
                cfg.$injected = cfg.$target;
            }
            return true;
        },

        verifySingleConfig: function inject_verifySingleonfig($el, url, cfg) {
            /* Verify one of potentially multiple configs (i.e. argument lists).
             *
             * Extract modifiers such as ::element or ::after.
             * Ensure that a target element exists.
             */
            if (cfg.url !== url) {
                // in case of multi-injection, all injections need to use
                // the same url
                log.error("Unsupported different urls for multi-inject");
                return false;
            }
            // defaults
            cfg.source = cfg.source || cfg.selector;
            cfg.target = cfg.target || cfg.selector;

            if (!inject.extractModifiers(cfg)) {
                return false;
            }
            if (!inject.ensureTarget(cfg, $el)) {
                return false;
            }
            inject.listenForFormReset(cfg);
            return true;
        },

        verifyConfig: function inject_verifyConfig(cfgs, $el) {
            /* Verify and post-process all the configurations.
             * Each "config" is an arguments list separated by the &&
             * combination operator.
             *
             * In case of multi-injection, only one URL is allowed, which
             * should be specified in the first config (i.e. arguments list).
             *
             * Verification for each cfg in the array needs to succeed.
             */
            return cfgs.every(_.partial(inject.verifySingleConfig, $el, cfgs[0].url));
        },

        listenForFormReset: function (cfg) {
            /* if pat-inject is used to populate target in some form and when
             * Cancel button is pressed (this triggers reset event on the
             * form) you would expect to populate with initial placeholder
             */
            var $form = cfg.$target.parents('form');
            if ($form.size() !== 0 && cfg.$target.data('initial-value') === undefined) {
                cfg.$target.data('initial-value', cfg.$target.html());
                $form.on('reset', function() {
                    cfg.$target.html(cfg.$target.data('initial-value'));
                });
            }
        },

        extractModifiers: function inject_extractModifiers(cfg) {
            /* The user can add modifiers to the source and target arguments.
             * Modifiers such as ::element, ::before and ::after.
             * We identifiy and extract these modifiers here.
             */
            var source_re = /^(.*?)(::element)?$/,
                target_re = /^(.*?)(::element)?(::after|::before)?$/,
                source_match = source_re.exec(cfg.source),
                target_match = target_re.exec(cfg.target),
                targetMod, targetPosition;

            cfg.source = source_match[1];
            cfg.sourceMod = source_match[2] ? "element" : "content";
            cfg.target = target_match[1];
            targetMod = target_match[2] ? "element" : "content";
            targetPosition = (target_match[3] || "::").slice(2); // position relative to target

            if (cfg.loadingClass) {
                cfg.loadingClass += " "+ cfg.loadingClass + "-" + targetMod;
                if (targetPosition && cfg.loadingClass) {
                    cfg.loadingClass += " " + cfg.loadingClass + "-" + targetPosition;
                }
            }
            cfg.action = targetMod + targetPosition;
            // Once we start detecting illegal combinations, we'll
            // return false in case of error
            return true;
        },

        createTarget: function inject_createTarget (selector) {
            /* create a target that matches the selector
             *
             * XXX: so far we only support #target and create a div with
             * that id appended to the body.
             */
            var $target;
            if (selector.slice(0,1) !== "#") {
                log.error("only id supported for non-existing target");
                return null;
            }
            $target = $("<div />").attr({id: selector.slice(1)});
            $("body").append($target);
            return $target;
        },

        stopBubblingFromRemovedElement: function ($el, cfgs, ev) {
            /* IE8 fix. Stop event from propagating IF $el will be removed
            * from the DOM. With pat-inject, often $el is the target that
            * will itself be replaced with injected content.
            *
            * IE8 cannot handle events bubbling up from an element removed
            * from the DOM.
            *
            * See: http://stackoverflow.com/questions/7114368/why-is-jquery-remove-throwing-attr-exception-in-ie8
            */
            var s; // jquery selector
            for (var i=0; i<cfgs.length; i++) {
                s = cfgs[i].target;
                if ($el.parents(s).addBack(s) && !ev.isPropagationStopped()) {
                    ev.stopPropagation();
                    return;
                }
            }
        },

        _performInjection: function ($el, $source, cfg, trigger) {
            /* Called after the XHR has succeeded and we have a new $source
             * element to inject.
             */
            if (cfg.sourceMod === "content") {
                $source = $source.contents();
            }
            var $src;
            // $source.clone() does not work with shived elements in IE8
            if (document.all && document.querySelector &&
                !document.addEventListener) {
                $src = $source.map(function() {
                    return $(this.outerHTML)[0];
                });
            } else {
                $src = $source.safeClone();
            }
            var $target = $(this),
                $injected = cfg.$injected || $src;

            $src.findInclusive("img").on("load", function() {
                $(this).trigger("pat-inject-content-loaded");
            });
            // Now the injection actually happens.
            if (inject._inject(trigger, $src, $target, cfg)) { inject._afterInjection($el, $injected, cfg); }
            // History support. if subform is submitted, append form params
            if ((cfg.history === "record") && ("pushState" in history)) {
                if (cfg.params) {
                    history.pushState({'url': cfg.url + '?' + cfg.params}, "", cfg.url + '?' + cfg.params);
                } else {
                    history.pushState({'url': cfg.url}, "", cfg.url);
                }
            }
        },

        _afterInjection: function ($el, $injected, cfg) {
            /* Set a class on the injected elements and fire the
             * patterns-injected event.
             */
            $injected.filter(function() {
                // setting data on textnode fails in IE8
                return this.nodeType !== TEXT_NODE;
            }).data("pat-injected", {origin: cfg.url});

            if ($injected.length === 1 && $injected[0].nodeType == TEXT_NODE) {
                // Only one element injected, and it was a text node.
                // So we trigger "patterns-injected" on the parent.
                // The event handler should check whether the
                // injected element and the triggered element are
                // the same.
                $injected.parent().trigger("patterns-injected", [cfg, $el[0], $injected[0]]);
            } else {
                $injected.each(function () {
                    // patterns-injected event will be triggered for each injected (non-text) element.
                    if (this.nodeType !== TEXT_NODE) {
                        $(this).addClass(cfg["class"]).trigger("patterns-injected", [cfg, $el[0], this]);
                    }
                });
            }
            $el.trigger("pat-inject-success");
        },

        _onInjectSuccess: function ($el, cfgs, ev) {
            var sources$,
                data = ev && ev.jqxhr && ev.jqxhr.responseText;
            if (!data) {
                log.warn("No response content, aborting", ev);
                return;
            }
            $.each(cfgs[0].hooks || [], function (idx, hook) {
                $el.trigger("pat-inject-hook-"+hook);
            });
            inject.stopBubblingFromRemovedElement($el, cfgs, ev);
            sources$ = inject.callTypeHandler(cfgs[0].dataType, "sources", $el, [cfgs, data, ev]);
            cfgs.forEach(function(cfg, idx) {
                cfg.$target.each(function() {
                    inject._performInjection.apply(this, [$el, sources$[idx], cfg, ev.target]);
                });
            });
            if (cfgs[0].nextHref && $el.is("a")) {
                // In case next-href is specified the anchor's href will
                // be set to it after the injection is triggered.
                $el.attr({href: cfgs[0].nextHref.replace(/&amp;/g, '&')});
                inject.destroy($el);
            }
            $el.off("pat-ajax-success.pat-inject");
            $el.off("pat-ajax-error.pat-inject");
        },

        _onInjectError: function ($el, cfgs) {
            cfgs.forEach(function(cfg) {
                if ("$injected" in cfg)
                    cfg.$injected.remove();
            });
            $el.off("pat-ajax-success.pat-inject");
            $el.off("pat-ajax-error.pat-inject");
        },

        execute: function inject_execute(cfgs, $el) {
            /* Actually execute the injection.
             *
             * Either by making an ajax request or by spoofing an ajax
             * request when the content is readily available in the current page.
             */
            // get a kinda deep copy, we scribble on it
            cfgs = cfgs.map(function(cfg) { return $.extend({}, cfg); });
            if (!inject.verifyConfig(cfgs, $el)) {
                return;
            }
            if (!inject.askForConfirmation(cfgs)) {
                return;
            }
            // possibility for spinners on targets
            _.chain(cfgs).filter(_.property('loadingClass')).each(function(cfg) { cfg.$target.addClass(cfg.loadingClass); });

            $el.on("pat-ajax-success.pat-inject", this._onInjectSuccess.bind(this, $el, cfgs));
            $el.on("pat-ajax-error.pat-inject", this._onInjectError.bind(this, $el, cfgs));

            if (cfgs[0].url.length) {
                ajax.request($el, {url: cfgs[0].url});
            } else {
                // If there is no url specified, then content is being fetched
                // from the same page.
                // No need to do an ajax request for this, so we spoof the ajax
                // event.
                $el.trigger({
                    type: "pat-ajax-success",
                    jqxhr: {
                        responseText:  $("body").html()
                    }
                });
            }
        },

        _inject: function inject_inject(trigger, $source, $target, cfg) {
            // action to jquery method mapping, except for "content"
            // and "element"
            var method = {
                contentbefore: "prepend",
                contentafter:  "append",
                elementbefore: "before",
                elementafter:  "after"
            }[cfg.action];

            if ($source.length === 0) {
                log.warn("Aborting injection, source not found:", $source);
                $(trigger).trigger("pat-inject-missingSource",
                        {url: cfg.url,
                         selector: cfg.source});
                return false;
            }
            if ($target.length === 0) {
                log.warn("Aborting injection, target not found:", $target);
                $(trigger).trigger("pat-inject-missingTarget",
                        {selector: cfg.target});
                return false;
            }
            if (cfg.action === "content") {
                $target.empty().append($source);
            } else if (cfg.action === "element") {
                $target.replaceWith($source);
            } else {
                $target[method]($source);
            }
            return true;
        },

        _sourcesFromHtml: function inject_sourcesFromHtml(html, url, sources) {
            var $html = inject._parseRawHtml(html, url);
            return sources.map(function inject_sourcesFromHtml_map(source) {
                if (source === "body") {
                    source = "#__original_body";
                }
                var $source = $html.find(source);

                if ($source.length === 0) {
                    log.warn("No source elements for selector:", source, $html);
                }

                $source.find("a[href^=\"#\"]").each(function () {
                    var href = this.getAttribute("href");
                    if (href.indexOf("#{1}") !== -1) {
                        // We ignore hrefs containing #{1} because they're not
                        // valid and only applicable in the context of
                        // pat-clone.
                        return;
                    }
                    // Skip in-document links pointing to an id that is inside
                    // this fragment.
                    if (href.length === 1) { // Special case for top-of-page links
                        this.href=url;
                    } else if (!$source.find(href).length) {
                        this.href=url+href;
                    }
                });
                return $source;
            });
        },

        _link_attributes: {
            A: "href",
            FORM: "action",
            IMG: "src",
            SOURCE: "src",
            VIDEO: "src"
        },

        _rebaseHTML_via_HTMLParser: function inject_rebaseHTML_via_HTMLParser(base, html) {
            var output = [],
                i, link_attribute, value;

            htmlparser.HTMLParser(html, {
                start: function(tag, attrs, unary) {
                    output.push("<"+tag);
                    link_attribute = inject._link_attributes[tag.toUpperCase()];
                    for (i=0; i<attrs.length; i++) {
                        if (attrs[i].name.toLowerCase() === link_attribute) {
                            value = attrs[i].value;
                            // Do not rewrite Zope views or in-document links.
                            // In-document links will be processed later after
                            // extracting the right fragment.
                            if (value.slice(0, 2) !== "@@" && value[0] !== "#") {
                                value = utils.rebaseURL(base, value);
                                value = value.replace(/(^|[^\\])"/g, "$1\\\"");
                            }
                        }  else
                            value = attrs[i].escaped;
                        output.push(" " + attrs[i].name + "=\"" + value + "\"");
                    }
                    output.push(unary ? "/>" : ">");
                },

                end: function(tag) {
                    output.push("</"+tag+">");
                },

                chars: function(text) {
                    output.push(text);
                },

                comment: function(text) {
                    output.push("<!--"+text+"-->");
                }
            });
            return output.join("");
        },

        _rebaseAttrs: {
            A: "href",
            FORM: "action",
            IMG: "data-pat-inject-rebase-src",
            SOURCE: "data-pat-inject-rebase-src",
            VIDEO: "data-pat-inject-rebase-src"
        },

        _rebaseHTML: function inject_rebaseHTML(base, html) {
            var $page = $(html.replace(
                /(\s)(src\s*)=/gi,
                "$1src=\"\" data-pat-inject-rebase-$2="
            ).trim()).wrapAll("<div>").parent();

            $page.find(Object.keys(inject._rebaseAttrs).join(",")).each(function() {
                var $this = $(this),
                    attrName = inject._rebaseAttrs[this.tagName],
                    value = $this.attr(attrName);

                if (value && value.slice(0, 2) !== "@@" && value[0] !== "#" &&
                    value.slice(0, 7) !== "mailto:") {
                    value = utils.rebaseURL(base, value);
                    $this.attr(attrName, value);
                }
            });
            // XXX: IE8 changes the order of attributes in html. The following
            // lines move data-pat-inject-rebase-src to src.
            $page.find("[data-pat-inject-rebase-src]").each(function() {
                var $el = $(this);
                $el.attr("src", $el.attr("data-pat-inject-rebase-src"))
                   .removeAttr("data-pat-inject-rebase-src");
            });

            return $page.html().replace(
                    /src="" data-pat-inject-rebase-/g, ""
                ).trim();
        },

        _parseRawHtml: function inject_parseRawHtml(html, url) {
            url = url || "";

            // remove script tags and head and replace body by a div
            var clean_html = html
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
                    .replace(/<head\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/head>/gi, "")
                    .replace(/<body([^>]*?)>/gi, "<div id=\"__original_body\">")
                    .replace(/<\/body([^>]*?)>/gi, "</div>");
            try {
                clean_html = inject._rebaseHTML(url, clean_html);
            } catch (e) {
                log.error("Error rebasing urls", e);
            }
            var $html = $("<div/>").html(clean_html);
            if ($html.children().length === 0) {
                log.warn("Parsing html resulted in empty jquery object:", clean_html);
            }
            return $html;
        },

        // XXX: hack
        _initAutoloadVisible: function inject_initAutoloadVisible($el) {
            if ($el.data("pat-inject-autoloaded")) {
                // ignore executed autoloads
                return false;
            }
            var $scrollable = $el.parents(":scrollable"), checkVisibility;

            // function to trigger the autoload and mark as triggered
            function trigger() {
                $el.data("pat-inject-autoloaded", true);
                inject.onTrigger.apply($el[0], []);
                return true;
            }

            // Use case 1: a (heigh-constrained) scrollable parent
            if ($scrollable.length) {
                // if scrollable parent and visible -> trigger it
                // we only look at the closest scrollable parent, no nesting
                checkVisibility = utils.debounce(function inject_checkVisibility_scrollable() {
                    if ($el.data("patterns.autoload") || !$.contains(document, $el[0])) {
                        return false;
                    }
                    if (!$el.is(":visible")) {
                        return false;
                    } 
                    var reltop = $el.offset().top - $scrollable.offset().top - 1000,
                        doTrigger = reltop <= $scrollable.innerHeight();
                    if (doTrigger) {
                        // checkVisibility was possibly installed as a scroll
                        // handler and has now served its purpose -> remove
                        $($scrollable[0]).off("scroll", checkVisibility);
                        $(window).off("resize.pat-autoload", checkVisibility);
                        return trigger();
                    }
                    return false;
                }, 100);
                if (checkVisibility()) {
                    return true;
                }
                // wait to become visible - again only immediate scrollable parent
                $($scrollable[0]).on("scroll", checkVisibility);
                $(window).on("resize.pat-autoload", checkVisibility);
            } else {
                // Use case 2: scrolling the entire page
                checkVisibility = utils.debounce(function inject_checkVisibility_not_scrollable() {
                    if ($el.data("patterns.autoload")) {
                        return false;
                    }
                    if (!utils.elementInViewport($el[0])) {
                        return false;
                    }
                    $(window).off(".pat-autoload", checkVisibility);
                    return trigger();
                }, 100);
                if (checkVisibility()) {
                    return true;
                }
                $(window).on("resize.pat-autoload scroll.pat-autoload", checkVisibility);
            }
            return false;
        },

        // XXX: simple so far to see what the team thinks of the idea
        registerTypeHandler: function inject_registerTypeHandler(type, handler) {
            inject.handlers[type] = handler;
        },

        callTypeHandler: function inject_callTypeHandler(type, fn, context, params) {
            type = type || "html";
            if (inject.handlers[type] && $.isFunction(inject.handlers[type][fn])) {
                return inject.handlers[type][fn].apply(context, params);
            } else {
                return null;
            }
        },

        handlers: {
            "html": {
                sources: function(cfgs, data) {
                    var sources = cfgs.map(function(cfg) { return cfg.source; });
                    return inject._sourcesFromHtml(data, cfgs[0].url, sources);
                }
            }
        }
    };

    $(document).on("patterns-injected.inject", function onInjected(ev, cfg, trigger, injected) {
        /* Listen for the patterns-injected event.
         *
         * Remove the "loading-class" classes from all injection targets and
         * then scan the injected content for new patterns.
         */
        cfg.$target.removeClass(cfg.loadingClass);
        if (injected.nodeType !== TEXT_NODE && injected !== COMMENT_NODE) {
            registry.scan(injected, null, {type: "injection", element: trigger});
            $(injected).trigger("patterns-injected-scanned");
        }
    });

    $(window).bind("popstate", function (event) {
        // popstate also triggers on traditional anchors
        if (!event.originalEvent.state && ("replaceState" in history)) {
            try {
                history.replaceState("anchor", "", document.location.href);
            } catch (e) {
                log.debug(e);
            }
            return;
        }
        // popstate event can be fired when history.back() is called. If
        // event.state is null, then we are at the first "pageload" state
        // and there's nothing left to do, so we do nothing.
        if (event.state) {
            window.location.reload();
        }
    });

    // this entry ensures that the initally loaded page can be reached with
    // the back button
    if ("replaceState" in history) {
        try {
            history.replaceState("pageload", "", document.location.href);
        } catch (e) {
            log.debug(e);
        }
    }
    registry.register(inject);
    return inject;
});

// jshint indent: 4, browser: true, jquery: true, quotmark: double
// vim: sw=4 expandtab
;
/**
 * Patterns store - store pattern state locally in the browser
 *
 * Copyright 2008-2012 Simplon B.V.
 * Copyright 2011 Humberto Sermeño
 * Copyright 2011 Florian Friesdorf
 */
define('pat-store',[],function() {
    function Storage(backend, prefix) {
        this.prefix=prefix;
        this.backend=backend;
    }

    Storage.prototype._key = function Storage_key(name) {
        return this.prefix + ":" + name;
    };

    Storage.prototype._allKeys = function Storage_allKeys() {
        var keys = [],
            prefix = this.prefix + ":",
            prefix_length = prefix.length,
            key, i;

        for (i=0; i<this.backend.length; i++) {
            key=this.backend.key(i);
            if (key.slice(0, prefix_length)===prefix)
                keys.push(key);
        }
        return keys;
    };

    Storage.prototype.get = function Storage_get(name) {
        var key = this._key(name),
            value = this.backend.getItem(key);
        if (value!==null)
            value=JSON.parse(value);
        return value;
    };

    Storage.prototype.set = function Storage_set(name, value) {
        var key = this._key(name);
        return this.backend.setItem(key, JSON.stringify(value));
    };

    Storage.prototype.remove = function Storage_remove(name) {
        var key = this._key(name);
        return this.backend.removeItem(key);
    };

    Storage.prototype.clear = function Storage_clear() {
        var keys = this._allKeys();
        for (var i=0; i<keys.length; i++)
            this.backend.removeItem(keys[i]);
    };

    Storage.prototype.all = function Storage_all() {
        var keys = this._allKeys(),
            prefix_length = this.prefix.length + 1,
            lk,
            data = {};

        for (var i=0; i<keys.length; i++) {
            lk = keys[i].slice(prefix_length);
            data[lk]=JSON.parse(this.backend.getItem(keys[i]));
        }
        return data;
    };

    function ValueStorage(store, name) {
        this.store=store;
        this.name=name;
    }

    ValueStorage.prototype.get = function ValueStorage_get() {
        return this.store.get(this.name);
    }

    ValueStorage.prototype.set = function ValueStorage_get(value) {
        return this.store.set(this.name, value);
    }

    ValueStorage.prototype.remove = function ValueStorage_remove() {
        return this.store.remove(this.name);
    }

    var store = {
        supported: false,

        local: function(name) {
            return new Storage(window.localStorage, name);
        },

        session: function(name) {
            return new Storage(window.sessionStorage, name);
        },

        ValueStorage: ValueStorage,

        // Update storage options for a given element.
        updateOptions: function store_updateOptions(trigger, options) {
            if (options.store!=="none") {
                if (!trigger.id) {
                    log.warn("state persistance requested, but element has no id");
                    options.store="none";
                } else if (!store.supported) {
                    log.warn("state persistance requested, but browser does not support webstorage");
                    options.store="none";
                }
            }
            return options;
        }
    };

    // Perform the test separately since this may throw a SecurityError as
    // reported in #326
    try {
        store.supported=typeof window.sessionStorage !== 'undefined';
    } catch(e) {
    }

    return store;
});

// vim: sw=4 expandtab
;
/**
 * Patterns collapsible - Collapsible content
 *
 * Copyright 2012-2013 Florian Friesdorf
 * Copyright 2012-2013 Simplon B.V. - Wichert Akkerman
 * Copyright 2012 Markus Maier
 * Copyright 2013 Peter Lamut
 * Copyright 2012 Jonas Hoersch
 */
define('pat-collapsible',[
    "jquery",
    "pat-inject",
    "pat-logger",
    "pat-parser",
    "pat-store",
    "pat-registry",
    "pat-base",
    "pat-jquery-ext"
], function($, inject, logger, Parser, store, registry, Base) {
    var log = logger.getLogger("pat.collapsible"),
        parser = new Parser("collapsible");

    parser.addArgument("load-content");
    parser.addArgument("store", "none", ["none", "session", "local"]);
    parser.addArgument("transition", "slide", ["none", "css", "fade", "slide", "slide-horizontal"]);
    parser.addArgument("effect-duration", "fast");
    parser.addArgument("effect-easing", "swing");
    parser.addArgument("closed", false);
    parser.addArgument("trigger", "::first");
    parser.addArgument("close-trigger");
    parser.addArgument("open-trigger");

    return Base.extend({
        name: "collapsible",
        trigger: ".pat-collapsible",
        jquery_plugin: true,

        transitions: {
            none: {closed: "hide", open: "show"},
            fade: {closed: "fadeOut", open: "fadeIn"},
            slide: {closed: "slideUp", open: "slideDown"},
            "slide-horizontal": {closed: "slideOut", open: "slideIn"}
        },

        init: function($el, opts) {
            var $content, state, storage;
            this.options = store.updateOptions($el[0], parser.parse($el, opts));

            if (this.options.trigger === "::first") {
                this.$trigger = $el.children(":first");
                $content = $el.children(":gt(0)");
            } else {
                this.$trigger = $(this.options.trigger);
                $content = $el.children();
            }
            if (this.$trigger.length === 0) {
                log.error("Collapsible has no trigger.", $el[0]);
                return;
            }

            this.$panel = $el.find(".panel-content");
            if (this.$panel.length === 0) {
                if ($content.length) {
                    this.$panel = $content
                        .wrapAll("<div class='panel-content' />")
                        .parent();
                } else {
                    this.$panel = $("<div class='panel-content' />")
                        .insertAfter(this.$trigger);
                }
            }

            state=(this.options.closed || $el.hasClass("closed")) ? "closed" : "open";
            if (this.options.store!=="none") {
                storage=(this.options.store==="local" ? store.local : store.session)(this.name);
                state=storage.get($el.attr('id')) || state;
            }

            if (state==="closed") {
                this.$trigger.removeClass("collapsible-open").addClass("collapsible-closed");
                $el.removeClass("open").addClass("closed");
                this.$panel.hide();
            } else {
                if (this.options.loadContent)
                    this._loadContent($el, this.options.loadContent, this.$panel);
                this.$trigger.removeClass("collapsible-closed").addClass("collapsible-open");
                $el.removeClass("closed").addClass("open");
                this.$panel.show();
            }

            this.$trigger
                .off(".pat-collapsible")
                .on("click.pat-collapsible", null, $el, this._onClick.bind(this))
                .on("keypress.pat-collapsible", null, $el, this._onKeyPress.bind(this));

            if (this.options.closeTrigger) {
                $(document).on("click", this.options.closeTrigger, this.close.bind(this));
            }
            if (this.options.openTrigger) {
                $(document).on("click", this.options.openTrigger, this.open.bind(this));
            }

            return $el;
        },

        open: function() {
            if (!this.$el.hasClass("open"))
                this.toggle();
            return this.$el;
        },

        close: function() {
            if (!this.$el.hasClass("closed"))
                this.toggle();
            return this.$el;
        },

        _onClick: function(event) {
            this.toggle(event.data);
        },

        _onKeyPress : function(event){
            var keycode = (event.keyCode ? event.keyCode : event.which);
            if (keycode === 13)
                this.toggle();
        },

        _loadContent: function($el, url, $target) {
            var components = url.split("#"),
                base_url = components[0],
                id = components[1] ? "#" + components[1] : "body",
                opts = [{
                    url: base_url,
                    source: id,
                    $target: $target,
                    dataType: "html"
                }];
            inject.execute(opts, $el);
        },

        // jQuery method to force loading of content.
        loadContent: function($el) {
            return $el.each(function(idx, el) {
                if (this.options.loadContent)
                    this._loadContent($(el), this.options.loadContent, this.$panel);
            }.bind(this));
        },

        toggle: function() {
            var new_state = this.$el.hasClass("closed") ? "open" : "closed";
            if (this.options.store!=="none") {
                var storage=(this.options.store==="local" ? store.local : store.session)(this.name);
                storage.set(this.$el.attr("id"), new_state);
            }
            if (new_state==="open") {
                this.$el.trigger("patterns-collapsible-open");
                this._transit(this.$el, "closed", "open");
            } else {
                this.$el.trigger("patterns-collapsible-close");
                this._transit(this.$el, "open", "closed");
            }
            return this.$el; // allow chaining
        },

        _transit: function($el, from_cls, to_cls) {
            if (to_cls === "open" && this.options.loadContent) {
                this._loadContent($el, this.options.loadContent, this.$panel);
            }
            var duration = (this.options.transition==="css" || this.options.transition==="none") ? null : this.options.effect.duration;
            if (!duration) {
                this.$trigger.removeClass("collapsible-" + from_cls).addClass("collapsible-" + to_cls);
                $el.removeClass(from_cls)
                   .addClass(to_cls)
                   .trigger("pat-update",
                            {pattern: "collapsible",
                             transition: "complete"});
            } else {
                var t = this.transitions[this.options.transition];
                $el.addClass("in-progress")
                   .trigger("pat-update", {pattern: "collapsible", transition: "start"});
                this.$trigger.addClass("collapsible-in-progress");
                this.$panel[t[to_cls]](duration, this.options.effect.easing, function() {
                    this.$trigger.removeClass("collapsible-" + from_cls)
                                 .removeClass("collapsible-in-progress")
                                 .addClass("collapsible-" + to_cls);
                    $el.removeClass(from_cls)
                       .removeClass("in-progress")
                       .addClass(to_cls)
                       .trigger("pat-update", {pattern: "collapsible", transition: "complete"});
                }.bind(this));
            }
        }
    });
});
// jshint indent: 4, browser: true, jquery: true, quotmark: double
// vim: sw=4 expandtab
;
define('pat-depends_parse',[],function() {
  /*
   * Generated by PEG.js 0.7.0.
   *
   * http://pegjs.majda.cz/
   */
  
  function quote(s) {
    /*
     * ECMA-262, 5th ed., 7.8.4: All characters may appear literally in a
     * string literal except for the closing quote character, backslash,
     * carriage return, line separator, paragraph separator, and line feed.
     * Any character may appear in the form of an escape sequence.
     *
     * For portability, we also escape escape all control and non-ASCII
     * characters. Note that "\0" and "\v" escape sequences are not used
     * because JSHint does not like the first and IE the second.
     */
     return '"' + s
      .replace(/\\/g, '\\\\')  // backslash
      .replace(/"/g, '\\"')    // closing quote character
      .replace(/\x08/g, '\\b') // backspace
      .replace(/\t/g, '\\t')   // horizontal tab
      .replace(/\n/g, '\\n')   // line feed
      .replace(/\f/g, '\\f')   // form feed
      .replace(/\r/g, '\\r')   // carriage return
      .replace(/[\x00-\x07\x0B\x0E-\x1F\x80-\uFFFF]/g, escape)
      + '"';
  }
  
  var result = {
    /*
     * Parses the input with a generated parser. If the parsing is successfull,
     * returns a value explicitly or implicitly specified by the grammar from
     * which the parser was generated (see |PEG.buildParser|). If the parsing is
     * unsuccessful, throws |PEG.parser.SyntaxError| describing the error.
     */
    parse: function(input, startRule) {
      var parseFunctions = {
        "expression": parse_expression,
        "simple_expression": parse_simple_expression,
        "equal_comparison": parse_equal_comparison,
        "order_comparison": parse_order_comparison,
        "logical": parse_logical,
        "identifier": parse_identifier,
        "value": parse_value,
        "number": parse_number,
        "_": parse__,
        "__": parse___,
        "SourceCharacter": parse_SourceCharacter,
        "WhiteSpace": parse_WhiteSpace,
        "IdentifierPart": parse_IdentifierPart,
        "StringLiteral": parse_StringLiteral,
        "DoubleStringCharacters": parse_DoubleStringCharacters,
        "SingleStringCharacters": parse_SingleStringCharacters,
        "DoubleStringCharacter": parse_DoubleStringCharacter,
        "SingleStringCharacter": parse_SingleStringCharacter,
        "EscapeSequence": parse_EscapeSequence,
        "CharacterEscapeSequence": parse_CharacterEscapeSequence,
        "SingleEscapeCharacter": parse_SingleEscapeCharacter,
        "NonEscapeCharacter": parse_NonEscapeCharacter,
        "EscapeCharacter": parse_EscapeCharacter,
        "HexEscapeSequence": parse_HexEscapeSequence,
        "UnicodeEscapeSequence": parse_UnicodeEscapeSequence,
        "DecimalDigit": parse_DecimalDigit,
        "HexDigit": parse_HexDigit,
        "UnicodeLetter": parse_UnicodeLetter,
        "UnicodeCombiningMark": parse_UnicodeCombiningMark,
        "Ll": parse_Ll,
        "Lm": parse_Lm,
        "Lo": parse_Lo,
        "Lt": parse_Lt,
        "Lu": parse_Lu,
        "Mc": parse_Mc,
        "Mn": parse_Mn,
        "Nd": parse_Nd,
        "Nl": parse_Nl,
        "Pc": parse_Pc,
        "Zs": parse_Zs
      };
      
      if (startRule !== undefined) {
        if (parseFunctions[startRule] === undefined) {
          throw new Error("Invalid rule name: " + quote(startRule) + ".");
        }
      } else {
        startRule = "expression";
      }
      
      var pos = 0;
      var reportFailures = 0;
      var rightmostFailuresPos = 0;
      var rightmostFailuresExpected = [];
      
      function padLeft(input, padding, length) {
        var result = input;
        
        var padLength = length - input.length;
        for (var i = 0; i < padLength; i++) {
          result = padding + result;
        }
        
        return result;
      }
      
      function escape(ch) {
        var charCode = ch.charCodeAt(0);
        var escapeChar;
        var length;
        
        if (charCode <= 0xFF) {
          escapeChar = 'x';
          length = 2;
        } else {
          escapeChar = 'u';
          length = 4;
        }
        
        return '\\' + escapeChar + padLeft(charCode.toString(16).toUpperCase(), '0', length);
      }
      
      function matchFailed(failure) {
        if (pos < rightmostFailuresPos) {
          return;
        }
        
        if (pos > rightmostFailuresPos) {
          rightmostFailuresPos = pos;
          rightmostFailuresExpected = [];
        }
        
        rightmostFailuresExpected.push(failure);
      }
      
      function parse_expression() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.substr(pos, 3).toLowerCase() === "not") {
          result0 = input.substr(pos, 3);
          pos += 3;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"not\"");
          }
        }
        if (result0 !== null) {
          result1 = parse__();
          if (result1 !== null) {
            result2 = parse_simple_expression();
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, node) {
                return {type: "NOT", children: [node]};
            })(pos0, result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          pos1 = pos;
          result0 = parse_simple_expression();
          if (result0 !== null) {
            result1 = parse__();
            if (result1 !== null) {
              result2 = parse_logical();
              if (result2 !== null) {
                result3 = parse__();
                if (result3 !== null) {
                  result4 = parse_expression();
                  if (result4 !== null) {
                    result0 = [result0, result1, result2, result3, result4];
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
          if (result0 !== null) {
            result0 = (function(offset, left, type, right) {
                  return {type: type.toUpperCase(), children: [left, right]};
              })(pos0, result0[0], result0[2], result0[4]);
          }
          if (result0 === null) {
            pos = pos0;
          }
          if (result0 === null) {
            pos0 = pos;
            result0 = parse_simple_expression();
            if (result0 !== null) {
              result0 = (function(offset, node) { return node; })(pos0, result0);
            }
            if (result0 === null) {
              pos = pos0;
            }
          }
        }
        return result0;
      }
      
      function parse_simple_expression() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1;
        
        pos0 = pos;
        pos1 = pos;
        if (input.charCodeAt(pos) === 40) {
          result0 = "(";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"(\"");
          }
        }
        if (result0 !== null) {
          result1 = parse___();
          if (result1 !== null) {
            result2 = parse_expression();
            if (result2 !== null) {
              result3 = parse___();
              if (result3 !== null) {
                if (input.charCodeAt(pos) === 41) {
                  result4 = ")";
                  pos++;
                } else {
                  result4 = null;
                  if (reportFailures === 0) {
                    matchFailed("\")\"");
                  }
                }
                if (result4 !== null) {
                  result0 = [result0, result1, result2, result3, result4];
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, content) {
                return content;
            })(pos0, result0[2]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          pos1 = pos;
          result0 = parse_identifier();
          if (result0 !== null) {
            result1 = parse___();
            if (result1 !== null) {
              result2 = parse_equal_comparison();
              if (result2 !== null) {
                result3 = parse___();
                if (result3 !== null) {
                  result4 = parse_value();
                  if (result4 !== null) {
                    result0 = [result0, result1, result2, result3, result4];
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
          if (result0 !== null) {
            result0 = (function(offset, input, op, value) {
                  return {type: "comparison", operator: op, input: input, value: value};
              })(pos0, result0[0], result0[2], result0[4]);
          }
          if (result0 === null) {
            pos = pos0;
          }
          if (result0 === null) {
            pos0 = pos;
            pos1 = pos;
            result0 = parse_identifier();
            if (result0 !== null) {
              result1 = parse___();
              if (result1 !== null) {
                result2 = parse_order_comparison();
                if (result2 !== null) {
                  result3 = parse___();
                  if (result3 !== null) {
                    result4 = parse_number();
                    if (result4 !== null) {
                      result0 = [result0, result1, result2, result3, result4];
                    } else {
                      result0 = null;
                      pos = pos1;
                    }
                  } else {
                    result0 = null;
                    pos = pos1;
                  }
                } else {
                  result0 = null;
                  pos = pos1;
                }
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
            if (result0 !== null) {
              result0 = (function(offset, input, op, value) {
                    return {type: "comparison", operator: op, input: input, value: value};
                })(pos0, result0[0], result0[2], result0[4]);
            }
            if (result0 === null) {
              pos = pos0;
            }
            if (result0 === null) {
              pos0 = pos;
              result0 = parse_identifier();
              if (result0 !== null) {
                result0 = (function(offset, input) {
                      return {type: "truthy", input: input};
                  })(pos0, result0);
              }
              if (result0 === null) {
                pos = pos0;
              }
            }
          }
        }
        return result0;
      }
      
      function parse_equal_comparison() {
        var result0;
        
        reportFailures++;
        if (input.charCodeAt(pos) === 61) {
          result0 = "=";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"=\"");
          }
        }
        if (result0 === null) {
          if (input.substr(pos, 2) === "!=") {
            result0 = "!=";
            pos += 2;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"!=\"");
            }
          }
          if (result0 === null) {
            if (input.substr(pos, 2) === "~=") {
              result0 = "~=";
              pos += 2;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"~=\"");
              }
            }
          }
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("comparison operator");
        }
        return result0;
      }
      
      function parse_order_comparison() {
        var result0;
        
        reportFailures++;
        if (input.substr(pos, 2) === "<=") {
          result0 = "<=";
          pos += 2;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"<=\"");
          }
        }
        if (result0 === null) {
          if (input.charCodeAt(pos) === 60) {
            result0 = "<";
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"<\"");
            }
          }
          if (result0 === null) {
            if (input.substr(pos, 2) === ">=") {
              result0 = ">=";
              pos += 2;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\">=\"");
              }
            }
            if (result0 === null) {
              if (input.charCodeAt(pos) === 62) {
                result0 = ">";
                pos++;
              } else {
                result0 = null;
                if (reportFailures === 0) {
                  matchFailed("\">\"");
                }
              }
            }
          }
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("comparison operator");
        }
        return result0;
      }
      
      function parse_logical() {
        var result0;
        
        reportFailures++;
        if (input.substr(pos, 3).toLowerCase() === "and") {
          result0 = input.substr(pos, 3);
          pos += 3;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"and\"");
          }
        }
        if (result0 === null) {
          if (input.substr(pos, 2).toLowerCase() === "or") {
            result0 = input.substr(pos, 2);
            pos += 2;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"or\"");
            }
          }
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("logical operator");
        }
        return result0;
      }
      
      function parse_identifier() {
        var result0, result1;
        var pos0;
        
        reportFailures++;
        pos0 = pos;
        result1 = parse_IdentifierPart();
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            result1 = parse_IdentifierPart();
          }
        } else {
          result0 = null;
        }
        if (result0 !== null) {
          result0 = (function(offset, chars) {
              return chars.join("");
          })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("input name");
        }
        return result0;
      }
      
      function parse_value() {
        var result0, result1;
        var pos0;
        
        reportFailures++;
        pos0 = pos;
        result1 = parse_IdentifierPart();
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            result1 = parse_IdentifierPart();
          }
        } else {
          result0 = null;
        }
        if (result0 !== null) {
          result0 = (function(offset, chars) { return chars.join(""); })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          result0 = parse_StringLiteral();
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("value");
        }
        return result0;
      }
      
      function parse_number() {
        var result0, result1;
        var pos0;
        
        reportFailures++;
        pos0 = pos;
        if (/^[0-9]/.test(input.charAt(pos))) {
          result1 = input.charAt(pos);
          pos++;
        } else {
          result1 = null;
          if (reportFailures === 0) {
            matchFailed("[0-9]");
          }
        }
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            if (/^[0-9]/.test(input.charAt(pos))) {
              result1 = input.charAt(pos);
              pos++;
            } else {
              result1 = null;
              if (reportFailures === 0) {
                matchFailed("[0-9]");
              }
            }
          }
        } else {
          result0 = null;
        }
        if (result0 !== null) {
          result0 = (function(offset, digits) {
              return parseInt(digits.join(""), 10);
          })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("number");
        }
        return result0;
      }
      
      function parse__() {
        var result0, result1;
        
        result1 = parse_WhiteSpace();
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            result1 = parse_WhiteSpace();
          }
        } else {
          result0 = null;
        }
        return result0;
      }
      
      function parse___() {
        var result0, result1;
        
        result0 = [];
        result1 = parse_WhiteSpace();
        while (result1 !== null) {
          result0.push(result1);
          result1 = parse_WhiteSpace();
        }
        return result0;
      }
      
      function parse_SourceCharacter() {
        var result0;
        
        if (input.length > pos) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("any character");
          }
        }
        return result0;
      }
      
      function parse_WhiteSpace() {
        var result0;
        
        reportFailures++;
        if (/^[\t\x0B\f \xA0\uFEFF]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[\\t\\x0B\\f \\xA0\\uFEFF]");
          }
        }
        if (result0 === null) {
          result0 = parse_Zs();
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("whitespace");
        }
        return result0;
      }
      
      function parse_IdentifierPart() {
        var result0;
        var pos0;
        
        result0 = parse_UnicodeLetter();
        if (result0 === null) {
          if (input.charCodeAt(pos) === 36) {
            result0 = "$";
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"$\"");
            }
          }
          if (result0 === null) {
            if (input.charCodeAt(pos) === 95) {
              result0 = "_";
              pos++;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"_\"");
              }
            }
            if (result0 === null) {
              if (input.charCodeAt(pos) === 45) {
                result0 = "-";
                pos++;
              } else {
                result0 = null;
                if (reportFailures === 0) {
                  matchFailed("\"-\"");
                }
              }
              if (result0 === null) {
                if (input.charCodeAt(pos) === 46) {
                  result0 = ".";
                  pos++;
                } else {
                  result0 = null;
                  if (reportFailures === 0) {
                    matchFailed("\".\"");
                  }
                }
                if (result0 === null) {
                  result0 = parse_UnicodeCombiningMark();
                  if (result0 === null) {
                    result0 = parse_Nd();
                    if (result0 === null) {
                      result0 = parse_Pc();
                      if (result0 === null) {
                        pos0 = pos;
                        if (input.charCodeAt(pos) === 8204) {
                          result0 = "\u200C";
                          pos++;
                        } else {
                          result0 = null;
                          if (reportFailures === 0) {
                            matchFailed("\"\\u200C\"");
                          }
                        }
                        if (result0 !== null) {
                          result0 = (function(offset) { return "\u200C"; })(pos0);
                        }
                        if (result0 === null) {
                          pos = pos0;
                        }
                        if (result0 === null) {
                          pos0 = pos;
                          if (input.charCodeAt(pos) === 8205) {
                            result0 = "\u200D";
                            pos++;
                          } else {
                            result0 = null;
                            if (reportFailures === 0) {
                              matchFailed("\"\\u200D\"");
                            }
                          }
                          if (result0 !== null) {
                            result0 = (function(offset) { return "\u200D"; })(pos0);
                          }
                          if (result0 === null) {
                            pos = pos0;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        return result0;
      }
      
      function parse_StringLiteral() {
        var result0, result1, result2;
        var pos0, pos1;
        
        reportFailures++;
        pos0 = pos;
        pos1 = pos;
        if (input.charCodeAt(pos) === 34) {
          result0 = "\"";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"\\\"\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_DoubleStringCharacters();
          result1 = result1 !== null ? result1 : "";
          if (result1 !== null) {
            if (input.charCodeAt(pos) === 34) {
              result2 = "\"";
              pos++;
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"\\\"\"");
              }
            }
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 === null) {
          pos1 = pos;
          if (input.charCodeAt(pos) === 39) {
            result0 = "'";
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"'\"");
            }
          }
          if (result0 !== null) {
            result1 = parse_SingleStringCharacters();
            result1 = result1 !== null ? result1 : "";
            if (result1 !== null) {
              if (input.charCodeAt(pos) === 39) {
                result2 = "'";
                pos++;
              } else {
                result2 = null;
                if (reportFailures === 0) {
                  matchFailed("\"'\"");
                }
              }
              if (result2 !== null) {
                result0 = [result0, result1, result2];
              } else {
                result0 = null;
                pos = pos1;
              }
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
        }
        if (result0 !== null) {
          result0 = (function(offset, parts) {
              return parts[1];
            })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("string");
        }
        return result0;
      }
      
      function parse_DoubleStringCharacters() {
        var result0, result1;
        var pos0;
        
        pos0 = pos;
        result1 = parse_DoubleStringCharacter();
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            result1 = parse_DoubleStringCharacter();
          }
        } else {
          result0 = null;
        }
        if (result0 !== null) {
          result0 = (function(offset, chars) { return chars.join(""); })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_SingleStringCharacters() {
        var result0, result1;
        var pos0;
        
        pos0 = pos;
        result1 = parse_SingleStringCharacter();
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            result1 = parse_SingleStringCharacter();
          }
        } else {
          result0 = null;
        }
        if (result0 !== null) {
          result0 = (function(offset, chars) { return chars.join(""); })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_DoubleStringCharacter() {
        var result0, result1;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        pos2 = pos;
        reportFailures++;
        if (input.charCodeAt(pos) === 34) {
          result0 = "\"";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"\\\"\"");
          }
        }
        if (result0 === null) {
          if (input.charCodeAt(pos) === 92) {
            result0 = "\\";
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"\\\\\"");
            }
          }
        }
        reportFailures--;
        if (result0 === null) {
          result0 = "";
        } else {
          result0 = null;
          pos = pos2;
        }
        if (result0 !== null) {
          result1 = parse_SourceCharacter();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, char_) { return char_;     })(pos0, result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          pos1 = pos;
          if (input.charCodeAt(pos) === 92) {
            result0 = "\\";
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"\\\\\"");
            }
          }
          if (result0 !== null) {
            result1 = parse_EscapeSequence();
            if (result1 !== null) {
              result0 = [result0, result1];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
          if (result0 !== null) {
            result0 = (function(offset, sequence) { return sequence;  })(pos0, result0[1]);
          }
          if (result0 === null) {
            pos = pos0;
          }
        }
        return result0;
      }
      
      function parse_SingleStringCharacter() {
        var result0, result1;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        pos2 = pos;
        reportFailures++;
        if (input.charCodeAt(pos) === 39) {
          result0 = "'";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"'\"");
          }
        }
        if (result0 === null) {
          if (input.charCodeAt(pos) === 92) {
            result0 = "\\";
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"\\\\\"");
            }
          }
        }
        reportFailures--;
        if (result0 === null) {
          result0 = "";
        } else {
          result0 = null;
          pos = pos2;
        }
        if (result0 !== null) {
          result1 = parse_SourceCharacter();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, char_) { return char_;     })(pos0, result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        if (result0 === null) {
          pos0 = pos;
          pos1 = pos;
          if (input.charCodeAt(pos) === 92) {
            result0 = "\\";
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"\\\\\"");
            }
          }
          if (result0 !== null) {
            result1 = parse_EscapeSequence();
            if (result1 !== null) {
              result0 = [result0, result1];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
          if (result0 !== null) {
            result0 = (function(offset, sequence) { return sequence;  })(pos0, result0[1]);
          }
          if (result0 === null) {
            pos = pos0;
          }
        }
        return result0;
      }
      
      function parse_EscapeSequence() {
        var result0, result1;
        var pos0, pos1, pos2;
        
        result0 = parse_CharacterEscapeSequence();
        if (result0 === null) {
          pos0 = pos;
          pos1 = pos;
          if (input.charCodeAt(pos) === 48) {
            result0 = "0";
            pos++;
          } else {
            result0 = null;
            if (reportFailures === 0) {
              matchFailed("\"0\"");
            }
          }
          if (result0 !== null) {
            pos2 = pos;
            reportFailures++;
            result1 = parse_DecimalDigit();
            reportFailures--;
            if (result1 === null) {
              result1 = "";
            } else {
              result1 = null;
              pos = pos2;
            }
            if (result1 !== null) {
              result0 = [result0, result1];
            } else {
              result0 = null;
              pos = pos1;
            }
          } else {
            result0 = null;
            pos = pos1;
          }
          if (result0 !== null) {
            result0 = (function(offset) { return "\0"; })(pos0);
          }
          if (result0 === null) {
            pos = pos0;
          }
          if (result0 === null) {
            result0 = parse_HexEscapeSequence();
            if (result0 === null) {
              result0 = parse_UnicodeEscapeSequence();
            }
          }
        }
        return result0;
      }
      
      function parse_CharacterEscapeSequence() {
        var result0;
        
        result0 = parse_SingleEscapeCharacter();
        if (result0 === null) {
          result0 = parse_NonEscapeCharacter();
        }
        return result0;
      }
      
      function parse_SingleEscapeCharacter() {
        var result0;
        var pos0;
        
        pos0 = pos;
        if (/^['"\\bfnrtv]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("['\"\\\\bfnrtv]");
          }
        }
        if (result0 !== null) {
          result0 = (function(offset, char_) {
              return char_
                .replace("b", "\b")
                .replace("f", "\f")
                .replace("n", "\n")
                .replace("r", "\r")
                .replace("t", "\t")
                .replace("v", "\x0B") // IE does not recognize "\v".
            })(pos0, result0);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_NonEscapeCharacter() {
        var result0, result1;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        pos2 = pos;
        reportFailures++;
        result0 = parse_EscapeCharacter();
        reportFailures--;
        if (result0 === null) {
          result0 = "";
        } else {
          result0 = null;
          pos = pos2;
        }
        if (result0 !== null) {
          result1 = parse_SourceCharacter();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, char_) { return char_; })(pos0, result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_EscapeCharacter() {
        var result0;
        
        result0 = parse_SingleEscapeCharacter();
        if (result0 === null) {
          result0 = parse_DecimalDigit();
          if (result0 === null) {
            if (input.charCodeAt(pos) === 120) {
              result0 = "x";
              pos++;
            } else {
              result0 = null;
              if (reportFailures === 0) {
                matchFailed("\"x\"");
              }
            }
            if (result0 === null) {
              if (input.charCodeAt(pos) === 117) {
                result0 = "u";
                pos++;
              } else {
                result0 = null;
                if (reportFailures === 0) {
                  matchFailed("\"u\"");
                }
              }
            }
          }
        }
        return result0;
      }
      
      function parse_HexEscapeSequence() {
        var result0, result1, result2;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        if (input.charCodeAt(pos) === 120) {
          result0 = "x";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"x\"");
          }
        }
        if (result0 !== null) {
          pos2 = pos;
          result1 = parse_HexDigit();
          if (result1 !== null) {
            result2 = parse_HexDigit();
            if (result2 !== null) {
              result1 = [result1, result2];
            } else {
              result1 = null;
              pos = pos2;
            }
          } else {
            result1 = null;
            pos = pos2;
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, digits) {
              return String.fromCharCode(parseInt("0x" + digits));
            })(pos0, result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_UnicodeEscapeSequence() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1, pos2;
        
        pos0 = pos;
        pos1 = pos;
        if (input.charCodeAt(pos) === 117) {
          result0 = "u";
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"u\"");
          }
        }
        if (result0 !== null) {
          pos2 = pos;
          result1 = parse_HexDigit();
          if (result1 !== null) {
            result2 = parse_HexDigit();
            if (result2 !== null) {
              result3 = parse_HexDigit();
              if (result3 !== null) {
                result4 = parse_HexDigit();
                if (result4 !== null) {
                  result1 = [result1, result2, result3, result4];
                } else {
                  result1 = null;
                  pos = pos2;
                }
              } else {
                result1 = null;
                pos = pos2;
              }
            } else {
              result1 = null;
              pos = pos2;
            }
          } else {
            result1 = null;
            pos = pos2;
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = pos1;
          }
        } else {
          result0 = null;
          pos = pos1;
        }
        if (result0 !== null) {
          result0 = (function(offset, digits) {
              return String.fromCharCode(parseInt("0x" + digits));
            })(pos0, result0[1]);
        }
        if (result0 === null) {
          pos = pos0;
        }
        return result0;
      }
      
      function parse_DecimalDigit() {
        var result0;
        
        if (/^[0-9]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[0-9]");
          }
        }
        return result0;
      }
      
      function parse_HexDigit() {
        var result0;
        
        if (/^[0-9a-fA-F]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[0-9a-fA-F]");
          }
        }
        return result0;
      }
      
      function parse_UnicodeLetter() {
        var result0;
        
        result0 = parse_Lu();
        if (result0 === null) {
          result0 = parse_Ll();
          if (result0 === null) {
            result0 = parse_Lt();
            if (result0 === null) {
              result0 = parse_Lm();
              if (result0 === null) {
                result0 = parse_Lo();
                if (result0 === null) {
                  result0 = parse_Nl();
                }
              }
            }
          }
        }
        return result0;
      }
      
      function parse_UnicodeCombiningMark() {
        var result0;
        
        result0 = parse_Mn();
        if (result0 === null) {
          result0 = parse_Mc();
        }
        return result0;
      }
      
      function parse_Ll() {
        var result0;
        
        if (/^[abcdefghijklmnopqrstuvwxyz\xAA\xB5\xBA\xDF\xE0\xE1\xE2\xE3\xE4\xE5\xE6\xE7\xE8\xE9\xEA\xEB\xEC\xED\xEE\xEF\xF0\xF1\xF2\xF3\xF4\xF5\xF6\xF8\xF9\xFA\xFB\xFC\xFD\xFE\xFF\u0101\u0103\u0105\u0107\u0109\u010B\u010D\u010F\u0111\u0113\u0115\u0117\u0119\u011B\u011D\u011F\u0121\u0123\u0125\u0127\u0129\u012B\u012D\u012F\u0131\u0133\u0135\u0137\u0138\u013A\u013C\u013E\u0140\u0142\u0144\u0146\u0148\u0149\u014B\u014D\u014F\u0151\u0153\u0155\u0157\u0159\u015B\u015D\u015F\u0161\u0163\u0165\u0167\u0169\u016B\u016D\u016F\u0171\u0173\u0175\u0177\u017A\u017C\u017E\u017F\u0180\u0183\u0185\u0188\u018C\u018D\u0192\u0195\u0199\u019A\u019B\u019E\u01A1\u01A3\u01A5\u01A8\u01AA\u01AB\u01AD\u01B0\u01B4\u01B6\u01B9\u01BA\u01BD\u01BE\u01BF\u01C6\u01C9\u01CC\u01CE\u01D0\u01D2\u01D4\u01D6\u01D8\u01DA\u01DC\u01DD\u01DF\u01E1\u01E3\u01E5\u01E7\u01E9\u01EB\u01ED\u01EF\u01F0\u01F3\u01F5\u01F9\u01FB\u01FD\u01FF\u0201\u0203\u0205\u0207\u0209\u020B\u020D\u020F\u0211\u0213\u0215\u0217\u0219\u021B\u021D\u021F\u0221\u0223\u0225\u0227\u0229\u022B\u022D\u022F\u0231\u0233\u0234\u0235\u0236\u0237\u0238\u0239\u023C\u023F\u0240\u0242\u0247\u0249\u024B\u024D\u024F\u0250\u0251\u0252\u0253\u0254\u0255\u0256\u0257\u0258\u0259\u025A\u025B\u025C\u025D\u025E\u025F\u0260\u0261\u0262\u0263\u0264\u0265\u0266\u0267\u0268\u0269\u026A\u026B\u026C\u026D\u026E\u026F\u0270\u0271\u0272\u0273\u0274\u0275\u0276\u0277\u0278\u0279\u027A\u027B\u027C\u027D\u027E\u027F\u0280\u0281\u0282\u0283\u0284\u0285\u0286\u0287\u0288\u0289\u028A\u028B\u028C\u028D\u028E\u028F\u0290\u0291\u0292\u0293\u0295\u0296\u0297\u0298\u0299\u029A\u029B\u029C\u029D\u029E\u029F\u02A0\u02A1\u02A2\u02A3\u02A4\u02A5\u02A6\u02A7\u02A8\u02A9\u02AA\u02AB\u02AC\u02AD\u02AE\u02AF\u0371\u0373\u0377\u037B\u037C\u037D\u0390\u03AC\u03AD\u03AE\u03AF\u03B0\u03B1\u03B2\u03B3\u03B4\u03B5\u03B6\u03B7\u03B8\u03B9\u03BA\u03BB\u03BC\u03BD\u03BE\u03BF\u03C0\u03C1\u03C2\u03C3\u03C4\u03C5\u03C6\u03C7\u03C8\u03C9\u03CA\u03CB\u03CC\u03CD\u03CE\u03D0\u03D1\u03D5\u03D6\u03D7\u03D9\u03DB\u03DD\u03DF\u03E1\u03E3\u03E5\u03E7\u03E9\u03EB\u03ED\u03EF\u03F0\u03F1\u03F2\u03F3\u03F5\u03F8\u03FB\u03FC\u0430\u0431\u0432\u0433\u0434\u0435\u0436\u0437\u0438\u0439\u043A\u043B\u043C\u043D\u043E\u043F\u0440\u0441\u0442\u0443\u0444\u0445\u0446\u0447\u0448\u0449\u044A\u044B\u044C\u044D\u044E\u044F\u0450\u0451\u0452\u0453\u0454\u0455\u0456\u0457\u0458\u0459\u045A\u045B\u045C\u045D\u045E\u045F\u0461\u0463\u0465\u0467\u0469\u046B\u046D\u046F\u0471\u0473\u0475\u0477\u0479\u047B\u047D\u047F\u0481\u048B\u048D\u048F\u0491\u0493\u0495\u0497\u0499\u049B\u049D\u049F\u04A1\u04A3\u04A5\u04A7\u04A9\u04AB\u04AD\u04AF\u04B1\u04B3\u04B5\u04B7\u04B9\u04BB\u04BD\u04BF\u04C2\u04C4\u04C6\u04C8\u04CA\u04CC\u04CE\u04CF\u04D1\u04D3\u04D5\u04D7\u04D9\u04DB\u04DD\u04DF\u04E1\u04E3\u04E5\u04E7\u04E9\u04EB\u04ED\u04EF\u04F1\u04F3\u04F5\u04F7\u04F9\u04FB\u04FD\u04FF\u0501\u0503\u0505\u0507\u0509\u050B\u050D\u050F\u0511\u0513\u0515\u0517\u0519\u051B\u051D\u051F\u0521\u0523\u0561\u0562\u0563\u0564\u0565\u0566\u0567\u0568\u0569\u056A\u056B\u056C\u056D\u056E\u056F\u0570\u0571\u0572\u0573\u0574\u0575\u0576\u0577\u0578\u0579\u057A\u057B\u057C\u057D\u057E\u057F\u0580\u0581\u0582\u0583\u0584\u0585\u0586\u0587\u1D00\u1D01\u1D02\u1D03\u1D04\u1D05\u1D06\u1D07\u1D08\u1D09\u1D0A\u1D0B\u1D0C\u1D0D\u1D0E\u1D0F\u1D10\u1D11\u1D12\u1D13\u1D14\u1D15\u1D16\u1D17\u1D18\u1D19\u1D1A\u1D1B\u1D1C\u1D1D\u1D1E\u1D1F\u1D20\u1D21\u1D22\u1D23\u1D24\u1D25\u1D26\u1D27\u1D28\u1D29\u1D2A\u1D2B\u1D62\u1D63\u1D64\u1D65\u1D66\u1D67\u1D68\u1D69\u1D6A\u1D6B\u1D6C\u1D6D\u1D6E\u1D6F\u1D70\u1D71\u1D72\u1D73\u1D74\u1D75\u1D76\u1D77\u1D79\u1D7A\u1D7B\u1D7C\u1D7D\u1D7E\u1D7F\u1D80\u1D81\u1D82\u1D83\u1D84\u1D85\u1D86\u1D87\u1D88\u1D89\u1D8A\u1D8B\u1D8C\u1D8D\u1D8E\u1D8F\u1D90\u1D91\u1D92\u1D93\u1D94\u1D95\u1D96\u1D97\u1D98\u1D99\u1D9A\u1E01\u1E03\u1E05\u1E07\u1E09\u1E0B\u1E0D\u1E0F\u1E11\u1E13\u1E15\u1E17\u1E19\u1E1B\u1E1D\u1E1F\u1E21\u1E23\u1E25\u1E27\u1E29\u1E2B\u1E2D\u1E2F\u1E31\u1E33\u1E35\u1E37\u1E39\u1E3B\u1E3D\u1E3F\u1E41\u1E43\u1E45\u1E47\u1E49\u1E4B\u1E4D\u1E4F\u1E51\u1E53\u1E55\u1E57\u1E59\u1E5B\u1E5D\u1E5F\u1E61\u1E63\u1E65\u1E67\u1E69\u1E6B\u1E6D\u1E6F\u1E71\u1E73\u1E75\u1E77\u1E79\u1E7B\u1E7D\u1E7F\u1E81\u1E83\u1E85\u1E87\u1E89\u1E8B\u1E8D\u1E8F\u1E91\u1E93\u1E95\u1E96\u1E97\u1E98\u1E99\u1E9A\u1E9B\u1E9C\u1E9D\u1E9F\u1EA1\u1EA3\u1EA5\u1EA7\u1EA9\u1EAB\u1EAD\u1EAF\u1EB1\u1EB3\u1EB5\u1EB7\u1EB9\u1EBB\u1EBD\u1EBF\u1EC1\u1EC3\u1EC5\u1EC7\u1EC9\u1ECB\u1ECD\u1ECF\u1ED1\u1ED3\u1ED5\u1ED7\u1ED9\u1EDB\u1EDD\u1EDF\u1EE1\u1EE3\u1EE5\u1EE7\u1EE9\u1EEB\u1EED\u1EEF\u1EF1\u1EF3\u1EF5\u1EF7\u1EF9\u1EFB\u1EFD\u1EFF\u1F00\u1F01\u1F02\u1F03\u1F04\u1F05\u1F06\u1F07\u1F10\u1F11\u1F12\u1F13\u1F14\u1F15\u1F20\u1F21\u1F22\u1F23\u1F24\u1F25\u1F26\u1F27\u1F30\u1F31\u1F32\u1F33\u1F34\u1F35\u1F36\u1F37\u1F40\u1F41\u1F42\u1F43\u1F44\u1F45\u1F50\u1F51\u1F52\u1F53\u1F54\u1F55\u1F56\u1F57\u1F60\u1F61\u1F62\u1F63\u1F64\u1F65\u1F66\u1F67\u1F70\u1F71\u1F72\u1F73\u1F74\u1F75\u1F76\u1F77\u1F78\u1F79\u1F7A\u1F7B\u1F7C\u1F7D\u1F80\u1F81\u1F82\u1F83\u1F84\u1F85\u1F86\u1F87\u1F90\u1F91\u1F92\u1F93\u1F94\u1F95\u1F96\u1F97\u1FA0\u1FA1\u1FA2\u1FA3\u1FA4\u1FA5\u1FA6\u1FA7\u1FB0\u1FB1\u1FB2\u1FB3\u1FB4\u1FB6\u1FB7\u1FBE\u1FC2\u1FC3\u1FC4\u1FC6\u1FC7\u1FD0\u1FD1\u1FD2\u1FD3\u1FD6\u1FD7\u1FE0\u1FE1\u1FE2\u1FE3\u1FE4\u1FE5\u1FE6\u1FE7\u1FF2\u1FF3\u1FF4\u1FF6\u1FF7\u2071\u207F\u210A\u210E\u210F\u2113\u212F\u2134\u2139\u213C\u213D\u2146\u2147\u2148\u2149\u214E\u2184\u2C30\u2C31\u2C32\u2C33\u2C34\u2C35\u2C36\u2C37\u2C38\u2C39\u2C3A\u2C3B\u2C3C\u2C3D\u2C3E\u2C3F\u2C40\u2C41\u2C42\u2C43\u2C44\u2C45\u2C46\u2C47\u2C48\u2C49\u2C4A\u2C4B\u2C4C\u2C4D\u2C4E\u2C4F\u2C50\u2C51\u2C52\u2C53\u2C54\u2C55\u2C56\u2C57\u2C58\u2C59\u2C5A\u2C5B\u2C5C\u2C5D\u2C5E\u2C61\u2C65\u2C66\u2C68\u2C6A\u2C6C\u2C71\u2C73\u2C74\u2C76\u2C77\u2C78\u2C79\u2C7A\u2C7B\u2C7C\u2C81\u2C83\u2C85\u2C87\u2C89\u2C8B\u2C8D\u2C8F\u2C91\u2C93\u2C95\u2C97\u2C99\u2C9B\u2C9D\u2C9F\u2CA1\u2CA3\u2CA5\u2CA7\u2CA9\u2CAB\u2CAD\u2CAF\u2CB1\u2CB3\u2CB5\u2CB7\u2CB9\u2CBB\u2CBD\u2CBF\u2CC1\u2CC3\u2CC5\u2CC7\u2CC9\u2CCB\u2CCD\u2CCF\u2CD1\u2CD3\u2CD5\u2CD7\u2CD9\u2CDB\u2CDD\u2CDF\u2CE1\u2CE3\u2CE4\u2D00\u2D01\u2D02\u2D03\u2D04\u2D05\u2D06\u2D07\u2D08\u2D09\u2D0A\u2D0B\u2D0C\u2D0D\u2D0E\u2D0F\u2D10\u2D11\u2D12\u2D13\u2D14\u2D15\u2D16\u2D17\u2D18\u2D19\u2D1A\u2D1B\u2D1C\u2D1D\u2D1E\u2D1F\u2D20\u2D21\u2D22\u2D23\u2D24\u2D25\uA641\uA643\uA645\uA647\uA649\uA64B\uA64D\uA64F\uA651\uA653\uA655\uA657\uA659\uA65B\uA65D\uA65F\uA663\uA665\uA667\uA669\uA66B\uA66D\uA681\uA683\uA685\uA687\uA689\uA68B\uA68D\uA68F\uA691\uA693\uA695\uA697\uA723\uA725\uA727\uA729\uA72B\uA72D\uA72F\uA730\uA731\uA733\uA735\uA737\uA739\uA73B\uA73D\uA73F\uA741\uA743\uA745\uA747\uA749\uA74B\uA74D\uA74F\uA751\uA753\uA755\uA757\uA759\uA75B\uA75D\uA75F\uA761\uA763\uA765\uA767\uA769\uA76B\uA76D\uA76F\uA771\uA772\uA773\uA774\uA775\uA776\uA777\uA778\uA77A\uA77C\uA77F\uA781\uA783\uA785\uA787\uA78C\uFB00\uFB01\uFB02\uFB03\uFB04\uFB05\uFB06\uFB13\uFB14\uFB15\uFB16\uFB17\uFF41\uFF42\uFF43\uFF44\uFF45\uFF46\uFF47\uFF48\uFF49\uFF4A\uFF4B\uFF4C\uFF4D\uFF4E\uFF4F\uFF50\uFF51\uFF52\uFF53\uFF54\uFF55\uFF56\uFF57\uFF58\uFF59\uFF5A]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[abcdefghijklmnopqrstuvwxyz\\xAA\\xB5\\xBA\\xDF\\xE0\\xE1\\xE2\\xE3\\xE4\\xE5\\xE6\\xE7\\xE8\\xE9\\xEA\\xEB\\xEC\\xED\\xEE\\xEF\\xF0\\xF1\\xF2\\xF3\\xF4\\xF5\\xF6\\xF8\\xF9\\xFA\\xFB\\xFC\\xFD\\xFE\\xFF\\u0101\\u0103\\u0105\\u0107\\u0109\\u010B\\u010D\\u010F\\u0111\\u0113\\u0115\\u0117\\u0119\\u011B\\u011D\\u011F\\u0121\\u0123\\u0125\\u0127\\u0129\\u012B\\u012D\\u012F\\u0131\\u0133\\u0135\\u0137\\u0138\\u013A\\u013C\\u013E\\u0140\\u0142\\u0144\\u0146\\u0148\\u0149\\u014B\\u014D\\u014F\\u0151\\u0153\\u0155\\u0157\\u0159\\u015B\\u015D\\u015F\\u0161\\u0163\\u0165\\u0167\\u0169\\u016B\\u016D\\u016F\\u0171\\u0173\\u0175\\u0177\\u017A\\u017C\\u017E\\u017F\\u0180\\u0183\\u0185\\u0188\\u018C\\u018D\\u0192\\u0195\\u0199\\u019A\\u019B\\u019E\\u01A1\\u01A3\\u01A5\\u01A8\\u01AA\\u01AB\\u01AD\\u01B0\\u01B4\\u01B6\\u01B9\\u01BA\\u01BD\\u01BE\\u01BF\\u01C6\\u01C9\\u01CC\\u01CE\\u01D0\\u01D2\\u01D4\\u01D6\\u01D8\\u01DA\\u01DC\\u01DD\\u01DF\\u01E1\\u01E3\\u01E5\\u01E7\\u01E9\\u01EB\\u01ED\\u01EF\\u01F0\\u01F3\\u01F5\\u01F9\\u01FB\\u01FD\\u01FF\\u0201\\u0203\\u0205\\u0207\\u0209\\u020B\\u020D\\u020F\\u0211\\u0213\\u0215\\u0217\\u0219\\u021B\\u021D\\u021F\\u0221\\u0223\\u0225\\u0227\\u0229\\u022B\\u022D\\u022F\\u0231\\u0233\\u0234\\u0235\\u0236\\u0237\\u0238\\u0239\\u023C\\u023F\\u0240\\u0242\\u0247\\u0249\\u024B\\u024D\\u024F\\u0250\\u0251\\u0252\\u0253\\u0254\\u0255\\u0256\\u0257\\u0258\\u0259\\u025A\\u025B\\u025C\\u025D\\u025E\\u025F\\u0260\\u0261\\u0262\\u0263\\u0264\\u0265\\u0266\\u0267\\u0268\\u0269\\u026A\\u026B\\u026C\\u026D\\u026E\\u026F\\u0270\\u0271\\u0272\\u0273\\u0274\\u0275\\u0276\\u0277\\u0278\\u0279\\u027A\\u027B\\u027C\\u027D\\u027E\\u027F\\u0280\\u0281\\u0282\\u0283\\u0284\\u0285\\u0286\\u0287\\u0288\\u0289\\u028A\\u028B\\u028C\\u028D\\u028E\\u028F\\u0290\\u0291\\u0292\\u0293\\u0295\\u0296\\u0297\\u0298\\u0299\\u029A\\u029B\\u029C\\u029D\\u029E\\u029F\\u02A0\\u02A1\\u02A2\\u02A3\\u02A4\\u02A5\\u02A6\\u02A7\\u02A8\\u02A9\\u02AA\\u02AB\\u02AC\\u02AD\\u02AE\\u02AF\\u0371\\u0373\\u0377\\u037B\\u037C\\u037D\\u0390\\u03AC\\u03AD\\u03AE\\u03AF\\u03B0\\u03B1\\u03B2\\u03B3\\u03B4\\u03B5\\u03B6\\u03B7\\u03B8\\u03B9\\u03BA\\u03BB\\u03BC\\u03BD\\u03BE\\u03BF\\u03C0\\u03C1\\u03C2\\u03C3\\u03C4\\u03C5\\u03C6\\u03C7\\u03C8\\u03C9\\u03CA\\u03CB\\u03CC\\u03CD\\u03CE\\u03D0\\u03D1\\u03D5\\u03D6\\u03D7\\u03D9\\u03DB\\u03DD\\u03DF\\u03E1\\u03E3\\u03E5\\u03E7\\u03E9\\u03EB\\u03ED\\u03EF\\u03F0\\u03F1\\u03F2\\u03F3\\u03F5\\u03F8\\u03FB\\u03FC\\u0430\\u0431\\u0432\\u0433\\u0434\\u0435\\u0436\\u0437\\u0438\\u0439\\u043A\\u043B\\u043C\\u043D\\u043E\\u043F\\u0440\\u0441\\u0442\\u0443\\u0444\\u0445\\u0446\\u0447\\u0448\\u0449\\u044A\\u044B\\u044C\\u044D\\u044E\\u044F\\u0450\\u0451\\u0452\\u0453\\u0454\\u0455\\u0456\\u0457\\u0458\\u0459\\u045A\\u045B\\u045C\\u045D\\u045E\\u045F\\u0461\\u0463\\u0465\\u0467\\u0469\\u046B\\u046D\\u046F\\u0471\\u0473\\u0475\\u0477\\u0479\\u047B\\u047D\\u047F\\u0481\\u048B\\u048D\\u048F\\u0491\\u0493\\u0495\\u0497\\u0499\\u049B\\u049D\\u049F\\u04A1\\u04A3\\u04A5\\u04A7\\u04A9\\u04AB\\u04AD\\u04AF\\u04B1\\u04B3\\u04B5\\u04B7\\u04B9\\u04BB\\u04BD\\u04BF\\u04C2\\u04C4\\u04C6\\u04C8\\u04CA\\u04CC\\u04CE\\u04CF\\u04D1\\u04D3\\u04D5\\u04D7\\u04D9\\u04DB\\u04DD\\u04DF\\u04E1\\u04E3\\u04E5\\u04E7\\u04E9\\u04EB\\u04ED\\u04EF\\u04F1\\u04F3\\u04F5\\u04F7\\u04F9\\u04FB\\u04FD\\u04FF\\u0501\\u0503\\u0505\\u0507\\u0509\\u050B\\u050D\\u050F\\u0511\\u0513\\u0515\\u0517\\u0519\\u051B\\u051D\\u051F\\u0521\\u0523\\u0561\\u0562\\u0563\\u0564\\u0565\\u0566\\u0567\\u0568\\u0569\\u056A\\u056B\\u056C\\u056D\\u056E\\u056F\\u0570\\u0571\\u0572\\u0573\\u0574\\u0575\\u0576\\u0577\\u0578\\u0579\\u057A\\u057B\\u057C\\u057D\\u057E\\u057F\\u0580\\u0581\\u0582\\u0583\\u0584\\u0585\\u0586\\u0587\\u1D00\\u1D01\\u1D02\\u1D03\\u1D04\\u1D05\\u1D06\\u1D07\\u1D08\\u1D09\\u1D0A\\u1D0B\\u1D0C\\u1D0D\\u1D0E\\u1D0F\\u1D10\\u1D11\\u1D12\\u1D13\\u1D14\\u1D15\\u1D16\\u1D17\\u1D18\\u1D19\\u1D1A\\u1D1B\\u1D1C\\u1D1D\\u1D1E\\u1D1F\\u1D20\\u1D21\\u1D22\\u1D23\\u1D24\\u1D25\\u1D26\\u1D27\\u1D28\\u1D29\\u1D2A\\u1D2B\\u1D62\\u1D63\\u1D64\\u1D65\\u1D66\\u1D67\\u1D68\\u1D69\\u1D6A\\u1D6B\\u1D6C\\u1D6D\\u1D6E\\u1D6F\\u1D70\\u1D71\\u1D72\\u1D73\\u1D74\\u1D75\\u1D76\\u1D77\\u1D79\\u1D7A\\u1D7B\\u1D7C\\u1D7D\\u1D7E\\u1D7F\\u1D80\\u1D81\\u1D82\\u1D83\\u1D84\\u1D85\\u1D86\\u1D87\\u1D88\\u1D89\\u1D8A\\u1D8B\\u1D8C\\u1D8D\\u1D8E\\u1D8F\\u1D90\\u1D91\\u1D92\\u1D93\\u1D94\\u1D95\\u1D96\\u1D97\\u1D98\\u1D99\\u1D9A\\u1E01\\u1E03\\u1E05\\u1E07\\u1E09\\u1E0B\\u1E0D\\u1E0F\\u1E11\\u1E13\\u1E15\\u1E17\\u1E19\\u1E1B\\u1E1D\\u1E1F\\u1E21\\u1E23\\u1E25\\u1E27\\u1E29\\u1E2B\\u1E2D\\u1E2F\\u1E31\\u1E33\\u1E35\\u1E37\\u1E39\\u1E3B\\u1E3D\\u1E3F\\u1E41\\u1E43\\u1E45\\u1E47\\u1E49\\u1E4B\\u1E4D\\u1E4F\\u1E51\\u1E53\\u1E55\\u1E57\\u1E59\\u1E5B\\u1E5D\\u1E5F\\u1E61\\u1E63\\u1E65\\u1E67\\u1E69\\u1E6B\\u1E6D\\u1E6F\\u1E71\\u1E73\\u1E75\\u1E77\\u1E79\\u1E7B\\u1E7D\\u1E7F\\u1E81\\u1E83\\u1E85\\u1E87\\u1E89\\u1E8B\\u1E8D\\u1E8F\\u1E91\\u1E93\\u1E95\\u1E96\\u1E97\\u1E98\\u1E99\\u1E9A\\u1E9B\\u1E9C\\u1E9D\\u1E9F\\u1EA1\\u1EA3\\u1EA5\\u1EA7\\u1EA9\\u1EAB\\u1EAD\\u1EAF\\u1EB1\\u1EB3\\u1EB5\\u1EB7\\u1EB9\\u1EBB\\u1EBD\\u1EBF\\u1EC1\\u1EC3\\u1EC5\\u1EC7\\u1EC9\\u1ECB\\u1ECD\\u1ECF\\u1ED1\\u1ED3\\u1ED5\\u1ED7\\u1ED9\\u1EDB\\u1EDD\\u1EDF\\u1EE1\\u1EE3\\u1EE5\\u1EE7\\u1EE9\\u1EEB\\u1EED\\u1EEF\\u1EF1\\u1EF3\\u1EF5\\u1EF7\\u1EF9\\u1EFB\\u1EFD\\u1EFF\\u1F00\\u1F01\\u1F02\\u1F03\\u1F04\\u1F05\\u1F06\\u1F07\\u1F10\\u1F11\\u1F12\\u1F13\\u1F14\\u1F15\\u1F20\\u1F21\\u1F22\\u1F23\\u1F24\\u1F25\\u1F26\\u1F27\\u1F30\\u1F31\\u1F32\\u1F33\\u1F34\\u1F35\\u1F36\\u1F37\\u1F40\\u1F41\\u1F42\\u1F43\\u1F44\\u1F45\\u1F50\\u1F51\\u1F52\\u1F53\\u1F54\\u1F55\\u1F56\\u1F57\\u1F60\\u1F61\\u1F62\\u1F63\\u1F64\\u1F65\\u1F66\\u1F67\\u1F70\\u1F71\\u1F72\\u1F73\\u1F74\\u1F75\\u1F76\\u1F77\\u1F78\\u1F79\\u1F7A\\u1F7B\\u1F7C\\u1F7D\\u1F80\\u1F81\\u1F82\\u1F83\\u1F84\\u1F85\\u1F86\\u1F87\\u1F90\\u1F91\\u1F92\\u1F93\\u1F94\\u1F95\\u1F96\\u1F97\\u1FA0\\u1FA1\\u1FA2\\u1FA3\\u1FA4\\u1FA5\\u1FA6\\u1FA7\\u1FB0\\u1FB1\\u1FB2\\u1FB3\\u1FB4\\u1FB6\\u1FB7\\u1FBE\\u1FC2\\u1FC3\\u1FC4\\u1FC6\\u1FC7\\u1FD0\\u1FD1\\u1FD2\\u1FD3\\u1FD6\\u1FD7\\u1FE0\\u1FE1\\u1FE2\\u1FE3\\u1FE4\\u1FE5\\u1FE6\\u1FE7\\u1FF2\\u1FF3\\u1FF4\\u1FF6\\u1FF7\\u2071\\u207F\\u210A\\u210E\\u210F\\u2113\\u212F\\u2134\\u2139\\u213C\\u213D\\u2146\\u2147\\u2148\\u2149\\u214E\\u2184\\u2C30\\u2C31\\u2C32\\u2C33\\u2C34\\u2C35\\u2C36\\u2C37\\u2C38\\u2C39\\u2C3A\\u2C3B\\u2C3C\\u2C3D\\u2C3E\\u2C3F\\u2C40\\u2C41\\u2C42\\u2C43\\u2C44\\u2C45\\u2C46\\u2C47\\u2C48\\u2C49\\u2C4A\\u2C4B\\u2C4C\\u2C4D\\u2C4E\\u2C4F\\u2C50\\u2C51\\u2C52\\u2C53\\u2C54\\u2C55\\u2C56\\u2C57\\u2C58\\u2C59\\u2C5A\\u2C5B\\u2C5C\\u2C5D\\u2C5E\\u2C61\\u2C65\\u2C66\\u2C68\\u2C6A\\u2C6C\\u2C71\\u2C73\\u2C74\\u2C76\\u2C77\\u2C78\\u2C79\\u2C7A\\u2C7B\\u2C7C\\u2C81\\u2C83\\u2C85\\u2C87\\u2C89\\u2C8B\\u2C8D\\u2C8F\\u2C91\\u2C93\\u2C95\\u2C97\\u2C99\\u2C9B\\u2C9D\\u2C9F\\u2CA1\\u2CA3\\u2CA5\\u2CA7\\u2CA9\\u2CAB\\u2CAD\\u2CAF\\u2CB1\\u2CB3\\u2CB5\\u2CB7\\u2CB9\\u2CBB\\u2CBD\\u2CBF\\u2CC1\\u2CC3\\u2CC5\\u2CC7\\u2CC9\\u2CCB\\u2CCD\\u2CCF\\u2CD1\\u2CD3\\u2CD5\\u2CD7\\u2CD9\\u2CDB\\u2CDD\\u2CDF\\u2CE1\\u2CE3\\u2CE4\\u2D00\\u2D01\\u2D02\\u2D03\\u2D04\\u2D05\\u2D06\\u2D07\\u2D08\\u2D09\\u2D0A\\u2D0B\\u2D0C\\u2D0D\\u2D0E\\u2D0F\\u2D10\\u2D11\\u2D12\\u2D13\\u2D14\\u2D15\\u2D16\\u2D17\\u2D18\\u2D19\\u2D1A\\u2D1B\\u2D1C\\u2D1D\\u2D1E\\u2D1F\\u2D20\\u2D21\\u2D22\\u2D23\\u2D24\\u2D25\\uA641\\uA643\\uA645\\uA647\\uA649\\uA64B\\uA64D\\uA64F\\uA651\\uA653\\uA655\\uA657\\uA659\\uA65B\\uA65D\\uA65F\\uA663\\uA665\\uA667\\uA669\\uA66B\\uA66D\\uA681\\uA683\\uA685\\uA687\\uA689\\uA68B\\uA68D\\uA68F\\uA691\\uA693\\uA695\\uA697\\uA723\\uA725\\uA727\\uA729\\uA72B\\uA72D\\uA72F\\uA730\\uA731\\uA733\\uA735\\uA737\\uA739\\uA73B\\uA73D\\uA73F\\uA741\\uA743\\uA745\\uA747\\uA749\\uA74B\\uA74D\\uA74F\\uA751\\uA753\\uA755\\uA757\\uA759\\uA75B\\uA75D\\uA75F\\uA761\\uA763\\uA765\\uA767\\uA769\\uA76B\\uA76D\\uA76F\\uA771\\uA772\\uA773\\uA774\\uA775\\uA776\\uA777\\uA778\\uA77A\\uA77C\\uA77F\\uA781\\uA783\\uA785\\uA787\\uA78C\\uFB00\\uFB01\\uFB02\\uFB03\\uFB04\\uFB05\\uFB06\\uFB13\\uFB14\\uFB15\\uFB16\\uFB17\\uFF41\\uFF42\\uFF43\\uFF44\\uFF45\\uFF46\\uFF47\\uFF48\\uFF49\\uFF4A\\uFF4B\\uFF4C\\uFF4D\\uFF4E\\uFF4F\\uFF50\\uFF51\\uFF52\\uFF53\\uFF54\\uFF55\\uFF56\\uFF57\\uFF58\\uFF59\\uFF5A]");
          }
        }
        return result0;
      }
      
      function parse_Lm() {
        var result0;
        
        if (/^[\u02B0\u02B1\u02B2\u02B3\u02B4\u02B5\u02B6\u02B7\u02B8\u02B9\u02BA\u02BB\u02BC\u02BD\u02BE\u02BF\u02C0\u02C1\u02C6\u02C7\u02C8\u02C9\u02CA\u02CB\u02CC\u02CD\u02CE\u02CF\u02D0\u02D1\u02E0\u02E1\u02E2\u02E3\u02E4\u02EC\u02EE\u0374\u037A\u0559\u0640\u06E5\u06E6\u07F4\u07F5\u07FA\u0971\u0E46\u0EC6\u10FC\u17D7\u1843\u1C78\u1C79\u1C7A\u1C7B\u1C7C\u1C7D\u1D2C\u1D2D\u1D2E\u1D2F\u1D30\u1D31\u1D32\u1D33\u1D34\u1D35\u1D36\u1D37\u1D38\u1D39\u1D3A\u1D3B\u1D3C\u1D3D\u1D3E\u1D3F\u1D40\u1D41\u1D42\u1D43\u1D44\u1D45\u1D46\u1D47\u1D48\u1D49\u1D4A\u1D4B\u1D4C\u1D4D\u1D4E\u1D4F\u1D50\u1D51\u1D52\u1D53\u1D54\u1D55\u1D56\u1D57\u1D58\u1D59\u1D5A\u1D5B\u1D5C\u1D5D\u1D5E\u1D5F\u1D60\u1D61\u1D78\u1D9B\u1D9C\u1D9D\u1D9E\u1D9F\u1DA0\u1DA1\u1DA2\u1DA3\u1DA4\u1DA5\u1DA6\u1DA7\u1DA8\u1DA9\u1DAA\u1DAB\u1DAC\u1DAD\u1DAE\u1DAF\u1DB0\u1DB1\u1DB2\u1DB3\u1DB4\u1DB5\u1DB6\u1DB7\u1DB8\u1DB9\u1DBA\u1DBB\u1DBC\u1DBD\u1DBE\u1DBF\u2090\u2091\u2092\u2093\u2094\u2C7D\u2D6F\u2E2F\u3005\u3031\u3032\u3033\u3034\u3035\u303B\u309D\u309E\u30FC\u30FD\u30FE\uA015\uA60C\uA67F\uA717\uA718\uA719\uA71A\uA71B\uA71C\uA71D\uA71E\uA71F\uA770\uA788\uFF70\uFF9E\uFF9F]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[\\u02B0\\u02B1\\u02B2\\u02B3\\u02B4\\u02B5\\u02B6\\u02B7\\u02B8\\u02B9\\u02BA\\u02BB\\u02BC\\u02BD\\u02BE\\u02BF\\u02C0\\u02C1\\u02C6\\u02C7\\u02C8\\u02C9\\u02CA\\u02CB\\u02CC\\u02CD\\u02CE\\u02CF\\u02D0\\u02D1\\u02E0\\u02E1\\u02E2\\u02E3\\u02E4\\u02EC\\u02EE\\u0374\\u037A\\u0559\\u0640\\u06E5\\u06E6\\u07F4\\u07F5\\u07FA\\u0971\\u0E46\\u0EC6\\u10FC\\u17D7\\u1843\\u1C78\\u1C79\\u1C7A\\u1C7B\\u1C7C\\u1C7D\\u1D2C\\u1D2D\\u1D2E\\u1D2F\\u1D30\\u1D31\\u1D32\\u1D33\\u1D34\\u1D35\\u1D36\\u1D37\\u1D38\\u1D39\\u1D3A\\u1D3B\\u1D3C\\u1D3D\\u1D3E\\u1D3F\\u1D40\\u1D41\\u1D42\\u1D43\\u1D44\\u1D45\\u1D46\\u1D47\\u1D48\\u1D49\\u1D4A\\u1D4B\\u1D4C\\u1D4D\\u1D4E\\u1D4F\\u1D50\\u1D51\\u1D52\\u1D53\\u1D54\\u1D55\\u1D56\\u1D57\\u1D58\\u1D59\\u1D5A\\u1D5B\\u1D5C\\u1D5D\\u1D5E\\u1D5F\\u1D60\\u1D61\\u1D78\\u1D9B\\u1D9C\\u1D9D\\u1D9E\\u1D9F\\u1DA0\\u1DA1\\u1DA2\\u1DA3\\u1DA4\\u1DA5\\u1DA6\\u1DA7\\u1DA8\\u1DA9\\u1DAA\\u1DAB\\u1DAC\\u1DAD\\u1DAE\\u1DAF\\u1DB0\\u1DB1\\u1DB2\\u1DB3\\u1DB4\\u1DB5\\u1DB6\\u1DB7\\u1DB8\\u1DB9\\u1DBA\\u1DBB\\u1DBC\\u1DBD\\u1DBE\\u1DBF\\u2090\\u2091\\u2092\\u2093\\u2094\\u2C7D\\u2D6F\\u2E2F\\u3005\\u3031\\u3032\\u3033\\u3034\\u3035\\u303B\\u309D\\u309E\\u30FC\\u30FD\\u30FE\\uA015\\uA60C\\uA67F\\uA717\\uA718\\uA719\\uA71A\\uA71B\\uA71C\\uA71D\\uA71E\\uA71F\\uA770\\uA788\\uFF70\\uFF9E\\uFF9F]");
          }
        }
        return result0;
      }
      
      function parse_Lo() {
        var result0;
        
        if (/^[\u01BB\u01C0\u01C1\u01C2\u01C3\u0294\u05D0\u05D1\u05D2\u05D3\u05D4\u05D5\u05D6\u05D7\u05D8\u05D9\u05DA\u05DB\u05DC\u05DD\u05DE\u05DF\u05E0\u05E1\u05E2\u05E3\u05E4\u05E5\u05E6\u05E7\u05E8\u05E9\u05EA\u05F0\u05F1\u05F2\u0621\u0622\u0623\u0624\u0625\u0626\u0627\u0628\u0629\u062A\u062B\u062C\u062D\u062E\u062F\u0630\u0631\u0632\u0633\u0634\u0635\u0636\u0637\u0638\u0639\u063A\u063B\u063C\u063D\u063E\u063F\u0641\u0642\u0643\u0644\u0645\u0646\u0647\u0648\u0649\u064A\u066E\u066F\u0671\u0672\u0673\u0674\u0675\u0676\u0677\u0678\u0679\u067A\u067B\u067C\u067D\u067E\u067F\u0680\u0681\u0682\u0683\u0684\u0685\u0686\u0687\u0688\u0689\u068A\u068B\u068C\u068D\u068E\u068F\u0690\u0691\u0692\u0693\u0694\u0695\u0696\u0697\u0698\u0699\u069A\u069B\u069C\u069D\u069E\u069F\u06A0\u06A1\u06A2\u06A3\u06A4\u06A5\u06A6\u06A7\u06A8\u06A9\u06AA\u06AB\u06AC\u06AD\u06AE\u06AF\u06B0\u06B1\u06B2\u06B3\u06B4\u06B5\u06B6\u06B7\u06B8\u06B9\u06BA\u06BB\u06BC\u06BD\u06BE\u06BF\u06C0\u06C1\u06C2\u06C3\u06C4\u06C5\u06C6\u06C7\u06C8\u06C9\u06CA\u06CB\u06CC\u06CD\u06CE\u06CF\u06D0\u06D1\u06D2\u06D3\u06D5\u06EE\u06EF\u06FA\u06FB\u06FC\u06FF\u0710\u0712\u0713\u0714\u0715\u0716\u0717\u0718\u0719\u071A\u071B\u071C\u071D\u071E\u071F\u0720\u0721\u0722\u0723\u0724\u0725\u0726\u0727\u0728\u0729\u072A\u072B\u072C\u072D\u072E\u072F\u074D\u074E\u074F\u0750\u0751\u0752\u0753\u0754\u0755\u0756\u0757\u0758\u0759\u075A\u075B\u075C\u075D\u075E\u075F\u0760\u0761\u0762\u0763\u0764\u0765\u0766\u0767\u0768\u0769\u076A\u076B\u076C\u076D\u076E\u076F\u0770\u0771\u0772\u0773\u0774\u0775\u0776\u0777\u0778\u0779\u077A\u077B\u077C\u077D\u077E\u077F\u0780\u0781\u0782\u0783\u0784\u0785\u0786\u0787\u0788\u0789\u078A\u078B\u078C\u078D\u078E\u078F\u0790\u0791\u0792\u0793\u0794\u0795\u0796\u0797\u0798\u0799\u079A\u079B\u079C\u079D\u079E\u079F\u07A0\u07A1\u07A2\u07A3\u07A4\u07A5\u07B1\u07CA\u07CB\u07CC\u07CD\u07CE\u07CF\u07D0\u07D1\u07D2\u07D3\u07D4\u07D5\u07D6\u07D7\u07D8\u07D9\u07DA\u07DB\u07DC\u07DD\u07DE\u07DF\u07E0\u07E1\u07E2\u07E3\u07E4\u07E5\u07E6\u07E7\u07E8\u07E9\u07EA\u0904\u0905\u0906\u0907\u0908\u0909\u090A\u090B\u090C\u090D\u090E\u090F\u0910\u0911\u0912\u0913\u0914\u0915\u0916\u0917\u0918\u0919\u091A\u091B\u091C\u091D\u091E\u091F\u0920\u0921\u0922\u0923\u0924\u0925\u0926\u0927\u0928\u0929\u092A\u092B\u092C\u092D\u092E\u092F\u0930\u0931\u0932\u0933\u0934\u0935\u0936\u0937\u0938\u0939\u093D\u0950\u0958\u0959\u095A\u095B\u095C\u095D\u095E\u095F\u0960\u0961\u0972\u097B\u097C\u097D\u097E\u097F\u0985\u0986\u0987\u0988\u0989\u098A\u098B\u098C\u098F\u0990\u0993\u0994\u0995\u0996\u0997\u0998\u0999\u099A\u099B\u099C\u099D\u099E\u099F\u09A0\u09A1\u09A2\u09A3\u09A4\u09A5\u09A6\u09A7\u09A8\u09AA\u09AB\u09AC\u09AD\u09AE\u09AF\u09B0\u09B2\u09B6\u09B7\u09B8\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF\u09E0\u09E1\u09F0\u09F1\u0A05\u0A06\u0A07\u0A08\u0A09\u0A0A\u0A0F\u0A10\u0A13\u0A14\u0A15\u0A16\u0A17\u0A18\u0A19\u0A1A\u0A1B\u0A1C\u0A1D\u0A1E\u0A1F\u0A20\u0A21\u0A22\u0A23\u0A24\u0A25\u0A26\u0A27\u0A28\u0A2A\u0A2B\u0A2C\u0A2D\u0A2E\u0A2F\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59\u0A5A\u0A5B\u0A5C\u0A5E\u0A72\u0A73\u0A74\u0A85\u0A86\u0A87\u0A88\u0A89\u0A8A\u0A8B\u0A8C\u0A8D\u0A8F\u0A90\u0A91\u0A93\u0A94\u0A95\u0A96\u0A97\u0A98\u0A99\u0A9A\u0A9B\u0A9C\u0A9D\u0A9E\u0A9F\u0AA0\u0AA1\u0AA2\u0AA3\u0AA4\u0AA5\u0AA6\u0AA7\u0AA8\u0AAA\u0AAB\u0AAC\u0AAD\u0AAE\u0AAF\u0AB0\u0AB2\u0AB3\u0AB5\u0AB6\u0AB7\u0AB8\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05\u0B06\u0B07\u0B08\u0B09\u0B0A\u0B0B\u0B0C\u0B0F\u0B10\u0B13\u0B14\u0B15\u0B16\u0B17\u0B18\u0B19\u0B1A\u0B1B\u0B1C\u0B1D\u0B1E\u0B1F\u0B20\u0B21\u0B22\u0B23\u0B24\u0B25\u0B26\u0B27\u0B28\u0B2A\u0B2B\u0B2C\u0B2D\u0B2E\u0B2F\u0B30\u0B32\u0B33\u0B35\u0B36\u0B37\u0B38\u0B39\u0B3D\u0B5C\u0B5D\u0B5F\u0B60\u0B61\u0B71\u0B83\u0B85\u0B86\u0B87\u0B88\u0B89\u0B8A\u0B8E\u0B8F\u0B90\u0B92\u0B93\u0B94\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8\u0BA9\u0BAA\u0BAE\u0BAF\u0BB0\u0BB1\u0BB2\u0BB3\u0BB4\u0BB5\u0BB6\u0BB7\u0BB8\u0BB9\u0BD0\u0C05\u0C06\u0C07\u0C08\u0C09\u0C0A\u0C0B\u0C0C\u0C0E\u0C0F\u0C10\u0C12\u0C13\u0C14\u0C15\u0C16\u0C17\u0C18\u0C19\u0C1A\u0C1B\u0C1C\u0C1D\u0C1E\u0C1F\u0C20\u0C21\u0C22\u0C23\u0C24\u0C25\u0C26\u0C27\u0C28\u0C2A\u0C2B\u0C2C\u0C2D\u0C2E\u0C2F\u0C30\u0C31\u0C32\u0C33\u0C35\u0C36\u0C37\u0C38\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85\u0C86\u0C87\u0C88\u0C89\u0C8A\u0C8B\u0C8C\u0C8E\u0C8F\u0C90\u0C92\u0C93\u0C94\u0C95\u0C96\u0C97\u0C98\u0C99\u0C9A\u0C9B\u0C9C\u0C9D\u0C9E\u0C9F\u0CA0\u0CA1\u0CA2\u0CA3\u0CA4\u0CA5\u0CA6\u0CA7\u0CA8\u0CAA\u0CAB\u0CAC\u0CAD\u0CAE\u0CAF\u0CB0\u0CB1\u0CB2\u0CB3\u0CB5\u0CB6\u0CB7\u0CB8\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0D05\u0D06\u0D07\u0D08\u0D09\u0D0A\u0D0B\u0D0C\u0D0E\u0D0F\u0D10\u0D12\u0D13\u0D14\u0D15\u0D16\u0D17\u0D18\u0D19\u0D1A\u0D1B\u0D1C\u0D1D\u0D1E\u0D1F\u0D20\u0D21\u0D22\u0D23\u0D24\u0D25\u0D26\u0D27\u0D28\u0D2A\u0D2B\u0D2C\u0D2D\u0D2E\u0D2F\u0D30\u0D31\u0D32\u0D33\u0D34\u0D35\u0D36\u0D37\u0D38\u0D39\u0D3D\u0D60\u0D61\u0D7A\u0D7B\u0D7C\u0D7D\u0D7E\u0D7F\u0D85\u0D86\u0D87\u0D88\u0D89\u0D8A\u0D8B\u0D8C\u0D8D\u0D8E\u0D8F\u0D90\u0D91\u0D92\u0D93\u0D94\u0D95\u0D96\u0D9A\u0D9B\u0D9C\u0D9D\u0D9E\u0D9F\u0DA0\u0DA1\u0DA2\u0DA3\u0DA4\u0DA5\u0DA6\u0DA7\u0DA8\u0DA9\u0DAA\u0DAB\u0DAC\u0DAD\u0DAE\u0DAF\u0DB0\u0DB1\u0DB3\u0DB4\u0DB5\u0DB6\u0DB7\u0DB8\u0DB9\u0DBA\u0DBB\u0DBD\u0DC0\u0DC1\u0DC2\u0DC3\u0DC4\u0DC5\u0DC6\u0E01\u0E02\u0E03\u0E04\u0E05\u0E06\u0E07\u0E08\u0E09\u0E0A\u0E0B\u0E0C\u0E0D\u0E0E\u0E0F\u0E10\u0E11\u0E12\u0E13\u0E14\u0E15\u0E16\u0E17\u0E18\u0E19\u0E1A\u0E1B\u0E1C\u0E1D\u0E1E\u0E1F\u0E20\u0E21\u0E22\u0E23\u0E24\u0E25\u0E26\u0E27\u0E28\u0E29\u0E2A\u0E2B\u0E2C\u0E2D\u0E2E\u0E2F\u0E30\u0E32\u0E33\u0E40\u0E41\u0E42\u0E43\u0E44\u0E45\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94\u0E95\u0E96\u0E97\u0E99\u0E9A\u0E9B\u0E9C\u0E9D\u0E9E\u0E9F\u0EA1\u0EA2\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD\u0EAE\u0EAF\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0\u0EC1\u0EC2\u0EC3\u0EC4\u0EDC\u0EDD\u0F00\u0F40\u0F41\u0F42\u0F43\u0F44\u0F45\u0F46\u0F47\u0F49\u0F4A\u0F4B\u0F4C\u0F4D\u0F4E\u0F4F\u0F50\u0F51\u0F52\u0F53\u0F54\u0F55\u0F56\u0F57\u0F58\u0F59\u0F5A\u0F5B\u0F5C\u0F5D\u0F5E\u0F5F\u0F60\u0F61\u0F62\u0F63\u0F64\u0F65\u0F66\u0F67\u0F68\u0F69\u0F6A\u0F6B\u0F6C\u0F88\u0F89\u0F8A\u0F8B\u1000\u1001\u1002\u1003\u1004\u1005\u1006\u1007\u1008\u1009\u100A\u100B\u100C\u100D\u100E\u100F\u1010\u1011\u1012\u1013\u1014\u1015\u1016\u1017\u1018\u1019\u101A\u101B\u101C\u101D\u101E\u101F\u1020\u1021\u1022\u1023\u1024\u1025\u1026\u1027\u1028\u1029\u102A\u103F\u1050\u1051\u1052\u1053\u1054\u1055\u105A\u105B\u105C\u105D\u1061\u1065\u1066\u106E\u106F\u1070\u1075\u1076\u1077\u1078\u1079\u107A\u107B\u107C\u107D\u107E\u107F\u1080\u1081\u108E\u10D0\u10D1\u10D2\u10D3\u10D4\u10D5\u10D6\u10D7\u10D8\u10D9\u10DA\u10DB\u10DC\u10DD\u10DE\u10DF\u10E0\u10E1\u10E2\u10E3\u10E4\u10E5\u10E6\u10E7\u10E8\u10E9\u10EA\u10EB\u10EC\u10ED\u10EE\u10EF\u10F0\u10F1\u10F2\u10F3\u10F4\u10F5\u10F6\u10F7\u10F8\u10F9\u10FA\u1100\u1101\u1102\u1103\u1104\u1105\u1106\u1107\u1108\u1109\u110A\u110B\u110C\u110D\u110E\u110F\u1110\u1111\u1112\u1113\u1114\u1115\u1116\u1117\u1118\u1119\u111A\u111B\u111C\u111D\u111E\u111F\u1120\u1121\u1122\u1123\u1124\u1125\u1126\u1127\u1128\u1129\u112A\u112B\u112C\u112D\u112E\u112F\u1130\u1131\u1132\u1133\u1134\u1135\u1136\u1137\u1138\u1139\u113A\u113B\u113C\u113D\u113E\u113F\u1140\u1141\u1142\u1143\u1144\u1145\u1146\u1147\u1148\u1149\u114A\u114B\u114C\u114D\u114E\u114F\u1150\u1151\u1152\u1153\u1154\u1155\u1156\u1157\u1158\u1159\u115F\u1160\u1161\u1162\u1163\u1164\u1165\u1166\u1167\u1168\u1169\u116A\u116B\u116C\u116D\u116E\u116F\u1170\u1171\u1172\u1173\u1174\u1175\u1176\u1177\u1178\u1179\u117A\u117B\u117C\u117D\u117E\u117F\u1180\u1181\u1182\u1183\u1184\u1185\u1186\u1187\u1188\u1189\u118A\u118B\u118C\u118D\u118E\u118F\u1190\u1191\u1192\u1193\u1194\u1195\u1196\u1197\u1198\u1199\u119A\u119B\u119C\u119D\u119E\u119F\u11A0\u11A1\u11A2\u11A8\u11A9\u11AA\u11AB\u11AC\u11AD\u11AE\u11AF\u11B0\u11B1\u11B2\u11B3\u11B4\u11B5\u11B6\u11B7\u11B8\u11B9\u11BA\u11BB\u11BC\u11BD\u11BE\u11BF\u11C0\u11C1\u11C2\u11C3\u11C4\u11C5\u11C6\u11C7\u11C8\u11C9\u11CA\u11CB\u11CC\u11CD\u11CE\u11CF\u11D0\u11D1\u11D2\u11D3\u11D4\u11D5\u11D6\u11D7\u11D8\u11D9\u11DA\u11DB\u11DC\u11DD\u11DE\u11DF\u11E0\u11E1\u11E2\u11E3\u11E4\u11E5\u11E6\u11E7\u11E8\u11E9\u11EA\u11EB\u11EC\u11ED\u11EE\u11EF\u11F0\u11F1\u11F2\u11F3\u11F4\u11F5\u11F6\u11F7\u11F8\u11F9\u1200\u1201\u1202\u1203\u1204\u1205\u1206\u1207\u1208\u1209\u120A\u120B\u120C\u120D\u120E\u120F\u1210\u1211\u1212\u1213\u1214\u1215\u1216\u1217\u1218\u1219\u121A\u121B\u121C\u121D\u121E\u121F\u1220\u1221\u1222\u1223\u1224\u1225\u1226\u1227\u1228\u1229\u122A\u122B\u122C\u122D\u122E\u122F\u1230\u1231\u1232\u1233\u1234\u1235\u1236\u1237\u1238\u1239\u123A\u123B\u123C\u123D\u123E\u123F\u1240\u1241\u1242\u1243\u1244\u1245\u1246\u1247\u1248\u124A\u124B\u124C\u124D\u1250\u1251\u1252\u1253\u1254\u1255\u1256\u1258\u125A\u125B\u125C\u125D\u1260\u1261\u1262\u1263\u1264\u1265\u1266\u1267\u1268\u1269\u126A\u126B\u126C\u126D\u126E\u126F\u1270\u1271\u1272\u1273\u1274\u1275\u1276\u1277\u1278\u1279\u127A\u127B\u127C\u127D\u127E\u127F\u1280\u1281\u1282\u1283\u1284\u1285\u1286\u1287\u1288\u128A\u128B\u128C\u128D\u1290\u1291\u1292\u1293\u1294\u1295\u1296\u1297\u1298\u1299\u129A\u129B\u129C\u129D\u129E\u129F\u12A0\u12A1\u12A2\u12A3\u12A4\u12A5\u12A6\u12A7\u12A8\u12A9\u12AA\u12AB\u12AC\u12AD\u12AE\u12AF\u12B0\u12B2\u12B3\u12B4\u12B5\u12B8\u12B9\u12BA\u12BB\u12BC\u12BD\u12BE\u12C0\u12C2\u12C3\u12C4\u12C5\u12C8\u12C9\u12CA\u12CB\u12CC\u12CD\u12CE\u12CF\u12D0\u12D1\u12D2\u12D3\u12D4\u12D5\u12D6\u12D8\u12D9\u12DA\u12DB\u12DC\u12DD\u12DE\u12DF\u12E0\u12E1\u12E2\u12E3\u12E4\u12E5\u12E6\u12E7\u12E8\u12E9\u12EA\u12EB\u12EC\u12ED\u12EE\u12EF\u12F0\u12F1\u12F2\u12F3\u12F4\u12F5\u12F6\u12F7\u12F8\u12F9\u12FA\u12FB\u12FC\u12FD\u12FE\u12FF\u1300\u1301\u1302\u1303\u1304\u1305\u1306\u1307\u1308\u1309\u130A\u130B\u130C\u130D\u130E\u130F\u1310\u1312\u1313\u1314\u1315\u1318\u1319\u131A\u131B\u131C\u131D\u131E\u131F\u1320\u1321\u1322\u1323\u1324\u1325\u1326\u1327\u1328\u1329\u132A\u132B\u132C\u132D\u132E\u132F\u1330\u1331\u1332\u1333\u1334\u1335\u1336\u1337\u1338\u1339\u133A\u133B\u133C\u133D\u133E\u133F\u1340\u1341\u1342\u1343\u1344\u1345\u1346\u1347\u1348\u1349\u134A\u134B\u134C\u134D\u134E\u134F\u1350\u1351\u1352\u1353\u1354\u1355\u1356\u1357\u1358\u1359\u135A\u1380\u1381\u1382\u1383\u1384\u1385\u1386\u1387\u1388\u1389\u138A\u138B\u138C\u138D\u138E\u138F\u13A0\u13A1\u13A2\u13A3\u13A4\u13A5\u13A6\u13A7\u13A8\u13A9\u13AA\u13AB\u13AC\u13AD\u13AE\u13AF\u13B0\u13B1\u13B2\u13B3\u13B4\u13B5\u13B6\u13B7\u13B8\u13B9\u13BA\u13BB\u13BC\u13BD\u13BE\u13BF\u13C0\u13C1\u13C2\u13C3\u13C4\u13C5\u13C6\u13C7\u13C8\u13C9\u13CA\u13CB\u13CC\u13CD\u13CE\u13CF\u13D0\u13D1\u13D2\u13D3\u13D4\u13D5\u13D6\u13D7\u13D8\u13D9\u13DA\u13DB\u13DC\u13DD\u13DE\u13DF\u13E0\u13E1\u13E2\u13E3\u13E4\u13E5\u13E6\u13E7\u13E8\u13E9\u13EA\u13EB\u13EC\u13ED\u13EE\u13EF\u13F0\u13F1\u13F2\u13F3\u13F4\u1401\u1402\u1403\u1404\u1405\u1406\u1407\u1408\u1409\u140A\u140B\u140C\u140D\u140E\u140F\u1410\u1411\u1412\u1413\u1414\u1415\u1416\u1417\u1418\u1419\u141A\u141B\u141C\u141D\u141E\u141F\u1420\u1421\u1422\u1423\u1424\u1425\u1426\u1427\u1428\u1429\u142A\u142B\u142C\u142D\u142E\u142F\u1430\u1431\u1432\u1433\u1434\u1435\u1436\u1437\u1438\u1439\u143A\u143B\u143C\u143D\u143E\u143F\u1440\u1441\u1442\u1443\u1444\u1445\u1446\u1447\u1448\u1449\u144A\u144B\u144C\u144D\u144E\u144F\u1450\u1451\u1452\u1453\u1454\u1455\u1456\u1457\u1458\u1459\u145A\u145B\u145C\u145D\u145E\u145F\u1460\u1461\u1462\u1463\u1464\u1465\u1466\u1467\u1468\u1469\u146A\u146B\u146C\u146D\u146E\u146F\u1470\u1471\u1472\u1473\u1474\u1475\u1476\u1477\u1478\u1479\u147A\u147B\u147C\u147D\u147E\u147F\u1480\u1481\u1482\u1483\u1484\u1485\u1486\u1487\u1488\u1489\u148A\u148B\u148C\u148D\u148E\u148F\u1490\u1491\u1492\u1493\u1494\u1495\u1496\u1497\u1498\u1499\u149A\u149B\u149C\u149D\u149E\u149F\u14A0\u14A1\u14A2\u14A3\u14A4\u14A5\u14A6\u14A7\u14A8\u14A9\u14AA\u14AB\u14AC\u14AD\u14AE\u14AF\u14B0\u14B1\u14B2\u14B3\u14B4\u14B5\u14B6\u14B7\u14B8\u14B9\u14BA\u14BB\u14BC\u14BD\u14BE\u14BF\u14C0\u14C1\u14C2\u14C3\u14C4\u14C5\u14C6\u14C7\u14C8\u14C9\u14CA\u14CB\u14CC\u14CD\u14CE\u14CF\u14D0\u14D1\u14D2\u14D3\u14D4\u14D5\u14D6\u14D7\u14D8\u14D9\u14DA\u14DB\u14DC\u14DD\u14DE\u14DF\u14E0\u14E1\u14E2\u14E3\u14E4\u14E5\u14E6\u14E7\u14E8\u14E9\u14EA\u14EB\u14EC\u14ED\u14EE\u14EF\u14F0\u14F1\u14F2\u14F3\u14F4\u14F5\u14F6\u14F7\u14F8\u14F9\u14FA\u14FB\u14FC\u14FD\u14FE\u14FF\u1500\u1501\u1502\u1503\u1504\u1505\u1506\u1507\u1508\u1509\u150A\u150B\u150C\u150D\u150E\u150F\u1510\u1511\u1512\u1513\u1514\u1515\u1516\u1517\u1518\u1519\u151A\u151B\u151C\u151D\u151E\u151F\u1520\u1521\u1522\u1523\u1524\u1525\u1526\u1527\u1528\u1529\u152A\u152B\u152C\u152D\u152E\u152F\u1530\u1531\u1532\u1533\u1534\u1535\u1536\u1537\u1538\u1539\u153A\u153B\u153C\u153D\u153E\u153F\u1540\u1541\u1542\u1543\u1544\u1545\u1546\u1547\u1548\u1549\u154A\u154B\u154C\u154D\u154E\u154F\u1550\u1551\u1552\u1553\u1554\u1555\u1556\u1557\u1558\u1559\u155A\u155B\u155C\u155D\u155E\u155F\u1560\u1561\u1562\u1563\u1564\u1565\u1566\u1567\u1568\u1569\u156A\u156B\u156C\u156D\u156E\u156F\u1570\u1571\u1572\u1573\u1574\u1575\u1576\u1577\u1578\u1579\u157A\u157B\u157C\u157D\u157E\u157F\u1580\u1581\u1582\u1583\u1584\u1585\u1586\u1587\u1588\u1589\u158A\u158B\u158C\u158D\u158E\u158F\u1590\u1591\u1592\u1593\u1594\u1595\u1596\u1597\u1598\u1599\u159A\u159B\u159C\u159D\u159E\u159F\u15A0\u15A1\u15A2\u15A3\u15A4\u15A5\u15A6\u15A7\u15A8\u15A9\u15AA\u15AB\u15AC\u15AD\u15AE\u15AF\u15B0\u15B1\u15B2\u15B3\u15B4\u15B5\u15B6\u15B7\u15B8\u15B9\u15BA\u15BB\u15BC\u15BD\u15BE\u15BF\u15C0\u15C1\u15C2\u15C3\u15C4\u15C5\u15C6\u15C7\u15C8\u15C9\u15CA\u15CB\u15CC\u15CD\u15CE\u15CF\u15D0\u15D1\u15D2\u15D3\u15D4\u15D5\u15D6\u15D7\u15D8\u15D9\u15DA\u15DB\u15DC\u15DD\u15DE\u15DF\u15E0\u15E1\u15E2\u15E3\u15E4\u15E5\u15E6\u15E7\u15E8\u15E9\u15EA\u15EB\u15EC\u15ED\u15EE\u15EF\u15F0\u15F1\u15F2\u15F3\u15F4\u15F5\u15F6\u15F7\u15F8\u15F9\u15FA\u15FB\u15FC\u15FD\u15FE\u15FF\u1600\u1601\u1602\u1603\u1604\u1605\u1606\u1607\u1608\u1609\u160A\u160B\u160C\u160D\u160E\u160F\u1610\u1611\u1612\u1613\u1614\u1615\u1616\u1617\u1618\u1619\u161A\u161B\u161C\u161D\u161E\u161F\u1620\u1621\u1622\u1623\u1624\u1625\u1626\u1627\u1628\u1629\u162A\u162B\u162C\u162D\u162E\u162F\u1630\u1631\u1632\u1633\u1634\u1635\u1636\u1637\u1638\u1639\u163A\u163B\u163C\u163D\u163E\u163F\u1640\u1641\u1642\u1643\u1644\u1645\u1646\u1647\u1648\u1649\u164A\u164B\u164C\u164D\u164E\u164F\u1650\u1651\u1652\u1653\u1654\u1655\u1656\u1657\u1658\u1659\u165A\u165B\u165C\u165D\u165E\u165F\u1660\u1661\u1662\u1663\u1664\u1665\u1666\u1667\u1668\u1669\u166A\u166B\u166C\u166F\u1670\u1671\u1672\u1673\u1674\u1675\u1676\u1681\u1682\u1683\u1684\u1685\u1686\u1687\u1688\u1689\u168A\u168B\u168C\u168D\u168E\u168F\u1690\u1691\u1692\u1693\u1694\u1695\u1696\u1697\u1698\u1699\u169A\u16A0\u16A1\u16A2\u16A3\u16A4\u16A5\u16A6\u16A7\u16A8\u16A9\u16AA\u16AB\u16AC\u16AD\u16AE\u16AF\u16B0\u16B1\u16B2\u16B3\u16B4\u16B5\u16B6\u16B7\u16B8\u16B9\u16BA\u16BB\u16BC\u16BD\u16BE\u16BF\u16C0\u16C1\u16C2\u16C3\u16C4\u16C5\u16C6\u16C7\u16C8\u16C9\u16CA\u16CB\u16CC\u16CD\u16CE\u16CF\u16D0\u16D1\u16D2\u16D3\u16D4\u16D5\u16D6\u16D7\u16D8\u16D9\u16DA\u16DB\u16DC\u16DD\u16DE\u16DF\u16E0\u16E1\u16E2\u16E3\u16E4\u16E5\u16E6\u16E7\u16E8\u16E9\u16EA\u1700\u1701\u1702\u1703\u1704\u1705\u1706\u1707\u1708\u1709\u170A\u170B\u170C\u170E\u170F\u1710\u1711\u1720\u1721\u1722\u1723\u1724\u1725\u1726\u1727\u1728\u1729\u172A\u172B\u172C\u172D\u172E\u172F\u1730\u1731\u1740\u1741\u1742\u1743\u1744\u1745\u1746\u1747\u1748\u1749\u174A\u174B\u174C\u174D\u174E\u174F\u1750\u1751\u1760\u1761\u1762\u1763\u1764\u1765\u1766\u1767\u1768\u1769\u176A\u176B\u176C\u176E\u176F\u1770\u1780\u1781\u1782\u1783\u1784\u1785\u1786\u1787\u1788\u1789\u178A\u178B\u178C\u178D\u178E\u178F\u1790\u1791\u1792\u1793\u1794\u1795\u1796\u1797\u1798\u1799\u179A\u179B\u179C\u179D\u179E\u179F\u17A0\u17A1\u17A2\u17A3\u17A4\u17A5\u17A6\u17A7\u17A8\u17A9\u17AA\u17AB\u17AC\u17AD\u17AE\u17AF\u17B0\u17B1\u17B2\u17B3\u17DC\u1820\u1821\u1822\u1823\u1824\u1825\u1826\u1827\u1828\u1829\u182A\u182B\u182C\u182D\u182E\u182F\u1830\u1831\u1832\u1833\u1834\u1835\u1836\u1837\u1838\u1839\u183A\u183B\u183C\u183D\u183E\u183F\u1840\u1841\u1842\u1844\u1845\u1846\u1847\u1848\u1849\u184A\u184B\u184C\u184D\u184E\u184F\u1850\u1851\u1852\u1853\u1854\u1855\u1856\u1857\u1858\u1859\u185A\u185B\u185C\u185D\u185E\u185F\u1860\u1861\u1862\u1863\u1864\u1865\u1866\u1867\u1868\u1869\u186A\u186B\u186C\u186D\u186E\u186F\u1870\u1871\u1872\u1873\u1874\u1875\u1876\u1877\u1880\u1881\u1882\u1883\u1884\u1885\u1886\u1887\u1888\u1889\u188A\u188B\u188C\u188D\u188E\u188F\u1890\u1891\u1892\u1893\u1894\u1895\u1896\u1897\u1898\u1899\u189A\u189B\u189C\u189D\u189E\u189F\u18A0\u18A1\u18A2\u18A3\u18A4\u18A5\u18A6\u18A7\u18A8\u18AA\u1900\u1901\u1902\u1903\u1904\u1905\u1906\u1907\u1908\u1909\u190A\u190B\u190C\u190D\u190E\u190F\u1910\u1911\u1912\u1913\u1914\u1915\u1916\u1917\u1918\u1919\u191A\u191B\u191C\u1950\u1951\u1952\u1953\u1954\u1955\u1956\u1957\u1958\u1959\u195A\u195B\u195C\u195D\u195E\u195F\u1960\u1961\u1962\u1963\u1964\u1965\u1966\u1967\u1968\u1969\u196A\u196B\u196C\u196D\u1970\u1971\u1972\u1973\u1974\u1980\u1981\u1982\u1983\u1984\u1985\u1986\u1987\u1988\u1989\u198A\u198B\u198C\u198D\u198E\u198F\u1990\u1991\u1992\u1993\u1994\u1995\u1996\u1997\u1998\u1999\u199A\u199B\u199C\u199D\u199E\u199F\u19A0\u19A1\u19A2\u19A3\u19A4\u19A5\u19A6\u19A7\u19A8\u19A9\u19C1\u19C2\u19C3\u19C4\u19C5\u19C6\u19C7\u1A00\u1A01\u1A02\u1A03\u1A04\u1A05\u1A06\u1A07\u1A08\u1A09\u1A0A\u1A0B\u1A0C\u1A0D\u1A0E\u1A0F\u1A10\u1A11\u1A12\u1A13\u1A14\u1A15\u1A16\u1B05\u1B06\u1B07\u1B08\u1B09\u1B0A\u1B0B\u1B0C\u1B0D\u1B0E\u1B0F\u1B10\u1B11\u1B12\u1B13\u1B14\u1B15\u1B16\u1B17\u1B18\u1B19\u1B1A\u1B1B\u1B1C\u1B1D\u1B1E\u1B1F\u1B20\u1B21\u1B22\u1B23\u1B24\u1B25\u1B26\u1B27\u1B28\u1B29\u1B2A\u1B2B\u1B2C\u1B2D\u1B2E\u1B2F\u1B30\u1B31\u1B32\u1B33\u1B45\u1B46\u1B47\u1B48\u1B49\u1B4A\u1B4B\u1B83\u1B84\u1B85\u1B86\u1B87\u1B88\u1B89\u1B8A\u1B8B\u1B8C\u1B8D\u1B8E\u1B8F\u1B90\u1B91\u1B92\u1B93\u1B94\u1B95\u1B96\u1B97\u1B98\u1B99\u1B9A\u1B9B\u1B9C\u1B9D\u1B9E\u1B9F\u1BA0\u1BAE\u1BAF\u1C00\u1C01\u1C02\u1C03\u1C04\u1C05\u1C06\u1C07\u1C08\u1C09\u1C0A\u1C0B\u1C0C\u1C0D\u1C0E\u1C0F\u1C10\u1C11\u1C12\u1C13\u1C14\u1C15\u1C16\u1C17\u1C18\u1C19\u1C1A\u1C1B\u1C1C\u1C1D\u1C1E\u1C1F\u1C20\u1C21\u1C22\u1C23\u1C4D\u1C4E\u1C4F\u1C5A\u1C5B\u1C5C\u1C5D\u1C5E\u1C5F\u1C60\u1C61\u1C62\u1C63\u1C64\u1C65\u1C66\u1C67\u1C68\u1C69\u1C6A\u1C6B\u1C6C\u1C6D\u1C6E\u1C6F\u1C70\u1C71\u1C72\u1C73\u1C74\u1C75\u1C76\u1C77\u2135\u2136\u2137\u2138\u2D30\u2D31\u2D32\u2D33\u2D34\u2D35\u2D36\u2D37\u2D38\u2D39\u2D3A\u2D3B\u2D3C\u2D3D\u2D3E\u2D3F\u2D40\u2D41\u2D42\u2D43\u2D44\u2D45\u2D46\u2D47\u2D48\u2D49\u2D4A\u2D4B\u2D4C\u2D4D\u2D4E\u2D4F\u2D50\u2D51\u2D52\u2D53\u2D54\u2D55\u2D56\u2D57\u2D58\u2D59\u2D5A\u2D5B\u2D5C\u2D5D\u2D5E\u2D5F\u2D60\u2D61\u2D62\u2D63\u2D64\u2D65\u2D80\u2D81\u2D82\u2D83\u2D84\u2D85\u2D86\u2D87\u2D88\u2D89\u2D8A\u2D8B\u2D8C\u2D8D\u2D8E\u2D8F\u2D90\u2D91\u2D92\u2D93\u2D94\u2D95\u2D96\u2DA0\u2DA1\u2DA2\u2DA3\u2DA4\u2DA5\u2DA6\u2DA8\u2DA9\u2DAA\u2DAB\u2DAC\u2DAD\u2DAE\u2DB0\u2DB1\u2DB2\u2DB3\u2DB4\u2DB5\u2DB6\u2DB8\u2DB9\u2DBA\u2DBB\u2DBC\u2DBD\u2DBE\u2DC0\u2DC1\u2DC2\u2DC3\u2DC4\u2DC5\u2DC6\u2DC8\u2DC9\u2DCA\u2DCB\u2DCC\u2DCD\u2DCE\u2DD0\u2DD1\u2DD2\u2DD3\u2DD4\u2DD5\u2DD6\u2DD8\u2DD9\u2DDA\u2DDB\u2DDC\u2DDD\u2DDE\u3006\u303C\u3041\u3042\u3043\u3044\u3045\u3046\u3047\u3048\u3049\u304A\u304B\u304C\u304D\u304E\u304F\u3050\u3051\u3052\u3053\u3054\u3055\u3056\u3057\u3058\u3059\u305A\u305B\u305C\u305D\u305E\u305F\u3060\u3061\u3062\u3063\u3064\u3065\u3066\u3067\u3068\u3069\u306A\u306B\u306C\u306D\u306E\u306F\u3070\u3071\u3072\u3073\u3074\u3075\u3076\u3077\u3078\u3079\u307A\u307B\u307C\u307D\u307E\u307F\u3080\u3081\u3082\u3083\u3084\u3085\u3086\u3087\u3088\u3089\u308A\u308B\u308C\u308D\u308E\u308F\u3090\u3091\u3092\u3093\u3094\u3095\u3096\u309F\u30A1\u30A2\u30A3\u30A4\u30A5\u30A6\u30A7\u30A8\u30A9\u30AA\u30AB\u30AC\u30AD\u30AE\u30AF\u30B0\u30B1\u30B2\u30B3\u30B4\u30B5\u30B6\u30B7\u30B8\u30B9\u30BA\u30BB\u30BC\u30BD\u30BE\u30BF\u30C0\u30C1\u30C2\u30C3\u30C4\u30C5\u30C6\u30C7\u30C8\u30C9\u30CA\u30CB\u30CC\u30CD\u30CE\u30CF\u30D0\u30D1\u30D2\u30D3\u30D4\u30D5\u30D6\u30D7\u30D8\u30D9\u30DA\u30DB\u30DC\u30DD\u30DE\u30DF\u30E0\u30E1\u30E2\u30E3\u30E4\u30E5\u30E6\u30E7\u30E8\u30E9\u30EA\u30EB\u30EC\u30ED\u30EE\u30EF\u30F0\u30F1\u30F2\u30F3\u30F4\u30F5\u30F6\u30F7\u30F8\u30F9\u30FA\u30FF\u3105\u3106\u3107\u3108\u3109\u310A\u310B\u310C\u310D\u310E\u310F\u3110\u3111\u3112\u3113\u3114\u3115\u3116\u3117\u3118\u3119\u311A\u311B\u311C\u311D\u311E\u311F\u3120\u3121\u3122\u3123\u3124\u3125\u3126\u3127\u3128\u3129\u312A\u312B\u312C\u312D\u3131\u3132\u3133\u3134\u3135\u3136\u3137\u3138\u3139\u313A\u313B\u313C\u313D\u313E\u313F\u3140\u3141\u3142\u3143\u3144\u3145\u3146\u3147\u3148\u3149\u314A\u314B\u314C\u314D\u314E\u314F\u3150\u3151\u3152\u3153\u3154\u3155\u3156\u3157\u3158\u3159\u315A\u315B\u315C\u315D\u315E\u315F\u3160\u3161\u3162\u3163\u3164\u3165\u3166\u3167\u3168\u3169\u316A\u316B\u316C\u316D\u316E\u316F\u3170\u3171\u3172\u3173\u3174\u3175\u3176\u3177\u3178\u3179\u317A\u317B\u317C\u317D\u317E\u317F\u3180\u3181\u3182\u3183\u3184\u3185\u3186\u3187\u3188\u3189\u318A\u318B\u318C\u318D\u318E\u31A0\u31A1\u31A2\u31A3\u31A4\u31A5\u31A6\u31A7\u31A8\u31A9\u31AA\u31AB\u31AC\u31AD\u31AE\u31AF\u31B0\u31B1\u31B2\u31B3\u31B4\u31B5\u31B6\u31B7\u31F0\u31F1\u31F2\u31F3\u31F4\u31F5\u31F6\u31F7\u31F8\u31F9\u31FA\u31FB\u31FC\u31FD\u31FE\u31FF\u3400\u4DB5\u4E00\u9FC3\uA000\uA001\uA002\uA003\uA004\uA005\uA006\uA007\uA008\uA009\uA00A\uA00B\uA00C\uA00D\uA00E\uA00F\uA010\uA011\uA012\uA013\uA014\uA016\uA017\uA018\uA019\uA01A\uA01B\uA01C\uA01D\uA01E\uA01F\uA020\uA021\uA022\uA023\uA024\uA025\uA026\uA027\uA028\uA029\uA02A\uA02B\uA02C\uA02D\uA02E\uA02F\uA030\uA031\uA032\uA033\uA034\uA035\uA036\uA037\uA038\uA039\uA03A\uA03B\uA03C\uA03D\uA03E\uA03F\uA040\uA041\uA042\uA043\uA044\uA045\uA046\uA047\uA048\uA049\uA04A\uA04B\uA04C\uA04D\uA04E\uA04F\uA050\uA051\uA052\uA053\uA054\uA055\uA056\uA057\uA058\uA059\uA05A\uA05B\uA05C\uA05D\uA05E\uA05F\uA060\uA061\uA062\uA063\uA064\uA065\uA066\uA067\uA068\uA069\uA06A\uA06B\uA06C\uA06D\uA06E\uA06F\uA070\uA071\uA072\uA073\uA074\uA075\uA076\uA077\uA078\uA079\uA07A\uA07B\uA07C\uA07D\uA07E\uA07F\uA080\uA081\uA082\uA083\uA084\uA085\uA086\uA087\uA088\uA089\uA08A\uA08B\uA08C\uA08D\uA08E\uA08F\uA090\uA091\uA092\uA093\uA094\uA095\uA096\uA097\uA098\uA099\uA09A\uA09B\uA09C\uA09D\uA09E\uA09F\uA0A0\uA0A1\uA0A2\uA0A3\uA0A4\uA0A5\uA0A6\uA0A7\uA0A8\uA0A9\uA0AA\uA0AB\uA0AC\uA0AD\uA0AE\uA0AF\uA0B0\uA0B1\uA0B2\uA0B3\uA0B4\uA0B5\uA0B6\uA0B7\uA0B8\uA0B9\uA0BA\uA0BB\uA0BC\uA0BD\uA0BE\uA0BF\uA0C0\uA0C1\uA0C2\uA0C3\uA0C4\uA0C5\uA0C6\uA0C7\uA0C8\uA0C9\uA0CA\uA0CB\uA0CC\uA0CD\uA0CE\uA0CF\uA0D0\uA0D1\uA0D2\uA0D3\uA0D4\uA0D5\uA0D6\uA0D7\uA0D8\uA0D9\uA0DA\uA0DB\uA0DC\uA0DD\uA0DE\uA0DF\uA0E0\uA0E1\uA0E2\uA0E3\uA0E4\uA0E5\uA0E6\uA0E7\uA0E8\uA0E9\uA0EA\uA0EB\uA0EC\uA0ED\uA0EE\uA0EF\uA0F0\uA0F1\uA0F2\uA0F3\uA0F4\uA0F5\uA0F6\uA0F7\uA0F8\uA0F9\uA0FA\uA0FB\uA0FC\uA0FD\uA0FE\uA0FF\uA100\uA101\uA102\uA103\uA104\uA105\uA106\uA107\uA108\uA109\uA10A\uA10B\uA10C\uA10D\uA10E\uA10F\uA110\uA111\uA112\uA113\uA114\uA115\uA116\uA117\uA118\uA119\uA11A\uA11B\uA11C\uA11D\uA11E\uA11F\uA120\uA121\uA122\uA123\uA124\uA125\uA126\uA127\uA128\uA129\uA12A\uA12B\uA12C\uA12D\uA12E\uA12F\uA130\uA131\uA132\uA133\uA134\uA135\uA136\uA137\uA138\uA139\uA13A\uA13B\uA13C\uA13D\uA13E\uA13F\uA140\uA141\uA142\uA143\uA144\uA145\uA146\uA147\uA148\uA149\uA14A\uA14B\uA14C\uA14D\uA14E\uA14F\uA150\uA151\uA152\uA153\uA154\uA155\uA156\uA157\uA158\uA159\uA15A\uA15B\uA15C\uA15D\uA15E\uA15F\uA160\uA161\uA162\uA163\uA164\uA165\uA166\uA167\uA168\uA169\uA16A\uA16B\uA16C\uA16D\uA16E\uA16F\uA170\uA171\uA172\uA173\uA174\uA175\uA176\uA177\uA178\uA179\uA17A\uA17B\uA17C\uA17D\uA17E\uA17F\uA180\uA181\uA182\uA183\uA184\uA185\uA186\uA187\uA188\uA189\uA18A\uA18B\uA18C\uA18D\uA18E\uA18F\uA190\uA191\uA192\uA193\uA194\uA195\uA196\uA197\uA198\uA199\uA19A\uA19B\uA19C\uA19D\uA19E\uA19F\uA1A0\uA1A1\uA1A2\uA1A3\uA1A4\uA1A5\uA1A6\uA1A7\uA1A8\uA1A9\uA1AA\uA1AB\uA1AC\uA1AD\uA1AE\uA1AF\uA1B0\uA1B1\uA1B2\uA1B3\uA1B4\uA1B5\uA1B6\uA1B7\uA1B8\uA1B9\uA1BA\uA1BB\uA1BC\uA1BD\uA1BE\uA1BF\uA1C0\uA1C1\uA1C2\uA1C3\uA1C4\uA1C5\uA1C6\uA1C7\uA1C8\uA1C9\uA1CA\uA1CB\uA1CC\uA1CD\uA1CE\uA1CF\uA1D0\uA1D1\uA1D2\uA1D3\uA1D4\uA1D5\uA1D6\uA1D7\uA1D8\uA1D9\uA1DA\uA1DB\uA1DC\uA1DD\uA1DE\uA1DF\uA1E0\uA1E1\uA1E2\uA1E3\uA1E4\uA1E5\uA1E6\uA1E7\uA1E8\uA1E9\uA1EA\uA1EB\uA1EC\uA1ED\uA1EE\uA1EF\uA1F0\uA1F1\uA1F2\uA1F3\uA1F4\uA1F5\uA1F6\uA1F7\uA1F8\uA1F9\uA1FA\uA1FB\uA1FC\uA1FD\uA1FE\uA1FF\uA200\uA201\uA202\uA203\uA204\uA205\uA206\uA207\uA208\uA209\uA20A\uA20B\uA20C\uA20D\uA20E\uA20F\uA210\uA211\uA212\uA213\uA214\uA215\uA216\uA217\uA218\uA219\uA21A\uA21B\uA21C\uA21D\uA21E\uA21F\uA220\uA221\uA222\uA223\uA224\uA225\uA226\uA227\uA228\uA229\uA22A\uA22B\uA22C\uA22D\uA22E\uA22F\uA230\uA231\uA232\uA233\uA234\uA235\uA236\uA237\uA238\uA239\uA23A\uA23B\uA23C\uA23D\uA23E\uA23F\uA240\uA241\uA242\uA243\uA244\uA245\uA246\uA247\uA248\uA249\uA24A\uA24B\uA24C\uA24D\uA24E\uA24F\uA250\uA251\uA252\uA253\uA254\uA255\uA256\uA257\uA258\uA259\uA25A\uA25B\uA25C\uA25D\uA25E\uA25F\uA260\uA261\uA262\uA263\uA264\uA265\uA266\uA267\uA268\uA269\uA26A\uA26B\uA26C\uA26D\uA26E\uA26F\uA270\uA271\uA272\uA273\uA274\uA275\uA276\uA277\uA278\uA279\uA27A\uA27B\uA27C\uA27D\uA27E\uA27F\uA280\uA281\uA282\uA283\uA284\uA285\uA286\uA287\uA288\uA289\uA28A\uA28B\uA28C\uA28D\uA28E\uA28F\uA290\uA291\uA292\uA293\uA294\uA295\uA296\uA297\uA298\uA299\uA29A\uA29B\uA29C\uA29D\uA29E\uA29F\uA2A0\uA2A1\uA2A2\uA2A3\uA2A4\uA2A5\uA2A6\uA2A7\uA2A8\uA2A9\uA2AA\uA2AB\uA2AC\uA2AD\uA2AE\uA2AF\uA2B0\uA2B1\uA2B2\uA2B3\uA2B4\uA2B5\uA2B6\uA2B7\uA2B8\uA2B9\uA2BA\uA2BB\uA2BC\uA2BD\uA2BE\uA2BF\uA2C0\uA2C1\uA2C2\uA2C3\uA2C4\uA2C5\uA2C6\uA2C7\uA2C8\uA2C9\uA2CA\uA2CB\uA2CC\uA2CD\uA2CE\uA2CF\uA2D0\uA2D1\uA2D2\uA2D3\uA2D4\uA2D5\uA2D6\uA2D7\uA2D8\uA2D9\uA2DA\uA2DB\uA2DC\uA2DD\uA2DE\uA2DF\uA2E0\uA2E1\uA2E2\uA2E3\uA2E4\uA2E5\uA2E6\uA2E7\uA2E8\uA2E9\uA2EA\uA2EB\uA2EC\uA2ED\uA2EE\uA2EF\uA2F0\uA2F1\uA2F2\uA2F3\uA2F4\uA2F5\uA2F6\uA2F7\uA2F8\uA2F9\uA2FA\uA2FB\uA2FC\uA2FD\uA2FE\uA2FF\uA300\uA301\uA302\uA303\uA304\uA305\uA306\uA307\uA308\uA309\uA30A\uA30B\uA30C\uA30D\uA30E\uA30F\uA310\uA311\uA312\uA313\uA314\uA315\uA316\uA317\uA318\uA319\uA31A\uA31B\uA31C\uA31D\uA31E\uA31F\uA320\uA321\uA322\uA323\uA324\uA325\uA326\uA327\uA328\uA329\uA32A\uA32B\uA32C\uA32D\uA32E\uA32F\uA330\uA331\uA332\uA333\uA334\uA335\uA336\uA337\uA338\uA339\uA33A\uA33B\uA33C\uA33D\uA33E\uA33F\uA340\uA341\uA342\uA343\uA344\uA345\uA346\uA347\uA348\uA349\uA34A\uA34B\uA34C\uA34D\uA34E\uA34F\uA350\uA351\uA352\uA353\uA354\uA355\uA356\uA357\uA358\uA359\uA35A\uA35B\uA35C\uA35D\uA35E\uA35F\uA360\uA361\uA362\uA363\uA364\uA365\uA366\uA367\uA368\uA369\uA36A\uA36B\uA36C\uA36D\uA36E\uA36F\uA370\uA371\uA372\uA373\uA374\uA375\uA376\uA377\uA378\uA379\uA37A\uA37B\uA37C\uA37D\uA37E\uA37F\uA380\uA381\uA382\uA383\uA384\uA385\uA386\uA387\uA388\uA389\uA38A\uA38B\uA38C\uA38D\uA38E\uA38F\uA390\uA391\uA392\uA393\uA394\uA395\uA396\uA397\uA398\uA399\uA39A\uA39B\uA39C\uA39D\uA39E\uA39F\uA3A0\uA3A1\uA3A2\uA3A3\uA3A4\uA3A5\uA3A6\uA3A7\uA3A8\uA3A9\uA3AA\uA3AB\uA3AC\uA3AD\uA3AE\uA3AF\uA3B0\uA3B1\uA3B2\uA3B3\uA3B4\uA3B5\uA3B6\uA3B7\uA3B8\uA3B9\uA3BA\uA3BB\uA3BC\uA3BD\uA3BE\uA3BF\uA3C0\uA3C1\uA3C2\uA3C3\uA3C4\uA3C5\uA3C6\uA3C7\uA3C8\uA3C9\uA3CA\uA3CB\uA3CC\uA3CD\uA3CE\uA3CF\uA3D0\uA3D1\uA3D2\uA3D3\uA3D4\uA3D5\uA3D6\uA3D7\uA3D8\uA3D9\uA3DA\uA3DB\uA3DC\uA3DD\uA3DE\uA3DF\uA3E0\uA3E1\uA3E2\uA3E3\uA3E4\uA3E5\uA3E6\uA3E7\uA3E8\uA3E9\uA3EA\uA3EB\uA3EC\uA3ED\uA3EE\uA3EF\uA3F0\uA3F1\uA3F2\uA3F3\uA3F4\uA3F5\uA3F6\uA3F7\uA3F8\uA3F9\uA3FA\uA3FB\uA3FC\uA3FD\uA3FE\uA3FF\uA400\uA401\uA402\uA403\uA404\uA405\uA406\uA407\uA408\uA409\uA40A\uA40B\uA40C\uA40D\uA40E\uA40F\uA410\uA411\uA412\uA413\uA414\uA415\uA416\uA417\uA418\uA419\uA41A\uA41B\uA41C\uA41D\uA41E\uA41F\uA420\uA421\uA422\uA423\uA424\uA425\uA426\uA427\uA428\uA429\uA42A\uA42B\uA42C\uA42D\uA42E\uA42F\uA430\uA431\uA432\uA433\uA434\uA435\uA436\uA437\uA438\uA439\uA43A\uA43B\uA43C\uA43D\uA43E\uA43F\uA440\uA441\uA442\uA443\uA444\uA445\uA446\uA447\uA448\uA449\uA44A\uA44B\uA44C\uA44D\uA44E\uA44F\uA450\uA451\uA452\uA453\uA454\uA455\uA456\uA457\uA458\uA459\uA45A\uA45B\uA45C\uA45D\uA45E\uA45F\uA460\uA461\uA462\uA463\uA464\uA465\uA466\uA467\uA468\uA469\uA46A\uA46B\uA46C\uA46D\uA46E\uA46F\uA470\uA471\uA472\uA473\uA474\uA475\uA476\uA477\uA478\uA479\uA47A\uA47B\uA47C\uA47D\uA47E\uA47F\uA480\uA481\uA482\uA483\uA484\uA485\uA486\uA487\uA488\uA489\uA48A\uA48B\uA48C\uA500\uA501\uA502\uA503\uA504\uA505\uA506\uA507\uA508\uA509\uA50A\uA50B\uA50C\uA50D\uA50E\uA50F\uA510\uA511\uA512\uA513\uA514\uA515\uA516\uA517\uA518\uA519\uA51A\uA51B\uA51C\uA51D\uA51E\uA51F\uA520\uA521\uA522\uA523\uA524\uA525\uA526\uA527\uA528\uA529\uA52A\uA52B\uA52C\uA52D\uA52E\uA52F\uA530\uA531\uA532\uA533\uA534\uA535\uA536\uA537\uA538\uA539\uA53A\uA53B\uA53C\uA53D\uA53E\uA53F\uA540\uA541\uA542\uA543\uA544\uA545\uA546\uA547\uA548\uA549\uA54A\uA54B\uA54C\uA54D\uA54E\uA54F\uA550\uA551\uA552\uA553\uA554\uA555\uA556\uA557\uA558\uA559\uA55A\uA55B\uA55C\uA55D\uA55E\uA55F\uA560\uA561\uA562\uA563\uA564\uA565\uA566\uA567\uA568\uA569\uA56A\uA56B\uA56C\uA56D\uA56E\uA56F\uA570\uA571\uA572\uA573\uA574\uA575\uA576\uA577\uA578\uA579\uA57A\uA57B\uA57C\uA57D\uA57E\uA57F\uA580\uA581\uA582\uA583\uA584\uA585\uA586\uA587\uA588\uA589\uA58A\uA58B\uA58C\uA58D\uA58E\uA58F\uA590\uA591\uA592\uA593\uA594\uA595\uA596\uA597\uA598\uA599\uA59A\uA59B\uA59C\uA59D\uA59E\uA59F\uA5A0\uA5A1\uA5A2\uA5A3\uA5A4\uA5A5\uA5A6\uA5A7\uA5A8\uA5A9\uA5AA\uA5AB\uA5AC\uA5AD\uA5AE\uA5AF\uA5B0\uA5B1\uA5B2\uA5B3\uA5B4\uA5B5\uA5B6\uA5B7\uA5B8\uA5B9\uA5BA\uA5BB\uA5BC\uA5BD\uA5BE\uA5BF\uA5C0\uA5C1\uA5C2\uA5C3\uA5C4\uA5C5\uA5C6\uA5C7\uA5C8\uA5C9\uA5CA\uA5CB\uA5CC\uA5CD\uA5CE\uA5CF\uA5D0\uA5D1\uA5D2\uA5D3\uA5D4\uA5D5\uA5D6\uA5D7\uA5D8\uA5D9\uA5DA\uA5DB\uA5DC\uA5DD\uA5DE\uA5DF\uA5E0\uA5E1\uA5E2\uA5E3\uA5E4\uA5E5\uA5E6\uA5E7\uA5E8\uA5E9\uA5EA\uA5EB\uA5EC\uA5ED\uA5EE\uA5EF\uA5F0\uA5F1\uA5F2\uA5F3\uA5F4\uA5F5\uA5F6\uA5F7\uA5F8\uA5F9\uA5FA\uA5FB\uA5FC\uA5FD\uA5FE\uA5FF\uA600\uA601\uA602\uA603\uA604\uA605\uA606\uA607\uA608\uA609\uA60A\uA60B\uA610\uA611\uA612\uA613\uA614\uA615\uA616\uA617\uA618\uA619\uA61A\uA61B\uA61C\uA61D\uA61E\uA61F\uA62A\uA62B\uA66E\uA7FB\uA7FC\uA7FD\uA7FE\uA7FF\uA800\uA801\uA803\uA804\uA805\uA807\uA808\uA809\uA80A\uA80C\uA80D\uA80E\uA80F\uA810\uA811\uA812\uA813\uA814\uA815\uA816\uA817\uA818\uA819\uA81A\uA81B\uA81C\uA81D\uA81E\uA81F\uA820\uA821\uA822\uA840\uA841\uA842\uA843\uA844\uA845\uA846\uA847\uA848\uA849\uA84A\uA84B\uA84C\uA84D\uA84E\uA84F\uA850\uA851\uA852\uA853\uA854\uA855\uA856\uA857\uA858\uA859\uA85A\uA85B\uA85C\uA85D\uA85E\uA85F\uA860\uA861\uA862\uA863\uA864\uA865\uA866\uA867\uA868\uA869\uA86A\uA86B\uA86C\uA86D\uA86E\uA86F\uA870\uA871\uA872\uA873\uA882\uA883\uA884\uA885\uA886\uA887\uA888\uA889\uA88A\uA88B\uA88C\uA88D\uA88E\uA88F\uA890\uA891\uA892\uA893\uA894\uA895\uA896\uA897\uA898\uA899\uA89A\uA89B\uA89C\uA89D\uA89E\uA89F\uA8A0\uA8A1\uA8A2\uA8A3\uA8A4\uA8A5\uA8A6\uA8A7\uA8A8\uA8A9\uA8AA\uA8AB\uA8AC\uA8AD\uA8AE\uA8AF\uA8B0\uA8B1\uA8B2\uA8B3\uA90A\uA90B\uA90C\uA90D\uA90E\uA90F\uA910\uA911\uA912\uA913\uA914\uA915\uA916\uA917\uA918\uA919\uA91A\uA91B\uA91C\uA91D\uA91E\uA91F\uA920\uA921\uA922\uA923\uA924\uA925\uA930\uA931\uA932\uA933\uA934\uA935\uA936\uA937\uA938\uA939\uA93A\uA93B\uA93C\uA93D\uA93E\uA93F\uA940\uA941\uA942\uA943\uA944\uA945\uA946\uAA00\uAA01\uAA02\uAA03\uAA04\uAA05\uAA06\uAA07\uAA08\uAA09\uAA0A\uAA0B\uAA0C\uAA0D\uAA0E\uAA0F\uAA10\uAA11\uAA12\uAA13\uAA14\uAA15\uAA16\uAA17\uAA18\uAA19\uAA1A\uAA1B\uAA1C\uAA1D\uAA1E\uAA1F\uAA20\uAA21\uAA22\uAA23\uAA24\uAA25\uAA26\uAA27\uAA28\uAA40\uAA41\uAA42\uAA44\uAA45\uAA46\uAA47\uAA48\uAA49\uAA4A\uAA4B\uAC00\uD7A3\uF900\uF901\uF902\uF903\uF904\uF905\uF906\uF907\uF908\uF909\uF90A\uF90B\uF90C\uF90D\uF90E\uF90F\uF910\uF911\uF912\uF913\uF914\uF915\uF916\uF917\uF918\uF919\uF91A\uF91B\uF91C\uF91D\uF91E\uF91F\uF920\uF921\uF922\uF923\uF924\uF925\uF926\uF927\uF928\uF929\uF92A\uF92B\uF92C\uF92D\uF92E\uF92F\uF930\uF931\uF932\uF933\uF934\uF935\uF936\uF937\uF938\uF939\uF93A\uF93B\uF93C\uF93D\uF93E\uF93F\uF940\uF941\uF942\uF943\uF944\uF945\uF946\uF947\uF948\uF949\uF94A\uF94B\uF94C\uF94D\uF94E\uF94F\uF950\uF951\uF952\uF953\uF954\uF955\uF956\uF957\uF958\uF959\uF95A\uF95B\uF95C\uF95D\uF95E\uF95F\uF960\uF961\uF962\uF963\uF964\uF965\uF966\uF967\uF968\uF969\uF96A\uF96B\uF96C\uF96D\uF96E\uF96F\uF970\uF971\uF972\uF973\uF974\uF975\uF976\uF977\uF978\uF979\uF97A\uF97B\uF97C\uF97D\uF97E\uF97F\uF980\uF981\uF982\uF983\uF984\uF985\uF986\uF987\uF988\uF989\uF98A\uF98B\uF98C\uF98D\uF98E\uF98F\uF990\uF991\uF992\uF993\uF994\uF995\uF996\uF997\uF998\uF999\uF99A\uF99B\uF99C\uF99D\uF99E\uF99F\uF9A0\uF9A1\uF9A2\uF9A3\uF9A4\uF9A5\uF9A6\uF9A7\uF9A8\uF9A9\uF9AA\uF9AB\uF9AC\uF9AD\uF9AE\uF9AF\uF9B0\uF9B1\uF9B2\uF9B3\uF9B4\uF9B5\uF9B6\uF9B7\uF9B8\uF9B9\uF9BA\uF9BB\uF9BC\uF9BD\uF9BE\uF9BF\uF9C0\uF9C1\uF9C2\uF9C3\uF9C4\uF9C5\uF9C6\uF9C7\uF9C8\uF9C9\uF9CA\uF9CB\uF9CC\uF9CD\uF9CE\uF9CF\uF9D0\uF9D1\uF9D2\uF9D3\uF9D4\uF9D5\uF9D6\uF9D7\uF9D8\uF9D9\uF9DA\uF9DB\uF9DC\uF9DD\uF9DE\uF9DF\uF9E0\uF9E1\uF9E2\uF9E3\uF9E4\uF9E5\uF9E6\uF9E7\uF9E8\uF9E9\uF9EA\uF9EB\uF9EC\uF9ED\uF9EE\uF9EF\uF9F0\uF9F1\uF9F2\uF9F3\uF9F4\uF9F5\uF9F6\uF9F7\uF9F8\uF9F9\uF9FA\uF9FB\uF9FC\uF9FD\uF9FE\uF9FF\uFA00\uFA01\uFA02\uFA03\uFA04\uFA05\uFA06\uFA07\uFA08\uFA09\uFA0A\uFA0B\uFA0C\uFA0D\uFA0E\uFA0F\uFA10\uFA11\uFA12\uFA13\uFA14\uFA15\uFA16\uFA17\uFA18\uFA19\uFA1A\uFA1B\uFA1C\uFA1D\uFA1E\uFA1F\uFA20\uFA21\uFA22\uFA23\uFA24\uFA25\uFA26\uFA27\uFA28\uFA29\uFA2A\uFA2B\uFA2C\uFA2D\uFA30\uFA31\uFA32\uFA33\uFA34\uFA35\uFA36\uFA37\uFA38\uFA39\uFA3A\uFA3B\uFA3C\uFA3D\uFA3E\uFA3F\uFA40\uFA41\uFA42\uFA43\uFA44\uFA45\uFA46\uFA47\uFA48\uFA49\uFA4A\uFA4B\uFA4C\uFA4D\uFA4E\uFA4F\uFA50\uFA51\uFA52\uFA53\uFA54\uFA55\uFA56\uFA57\uFA58\uFA59\uFA5A\uFA5B\uFA5C\uFA5D\uFA5E\uFA5F\uFA60\uFA61\uFA62\uFA63\uFA64\uFA65\uFA66\uFA67\uFA68\uFA69\uFA6A\uFA70\uFA71\uFA72\uFA73\uFA74\uFA75\uFA76\uFA77\uFA78\uFA79\uFA7A\uFA7B\uFA7C\uFA7D\uFA7E\uFA7F\uFA80\uFA81\uFA82\uFA83\uFA84\uFA85\uFA86\uFA87\uFA88\uFA89\uFA8A\uFA8B\uFA8C\uFA8D\uFA8E\uFA8F\uFA90\uFA91\uFA92\uFA93\uFA94\uFA95\uFA96\uFA97\uFA98\uFA99\uFA9A\uFA9B\uFA9C\uFA9D\uFA9E\uFA9F\uFAA0\uFAA1\uFAA2\uFAA3\uFAA4\uFAA5\uFAA6\uFAA7\uFAA8\uFAA9\uFAAA\uFAAB\uFAAC\uFAAD\uFAAE\uFAAF\uFAB0\uFAB1\uFAB2\uFAB3\uFAB4\uFAB5\uFAB6\uFAB7\uFAB8\uFAB9\uFABA\uFABB\uFABC\uFABD\uFABE\uFABF\uFAC0\uFAC1\uFAC2\uFAC3\uFAC4\uFAC5\uFAC6\uFAC7\uFAC8\uFAC9\uFACA\uFACB\uFACC\uFACD\uFACE\uFACF\uFAD0\uFAD1\uFAD2\uFAD3\uFAD4\uFAD5\uFAD6\uFAD7\uFAD8\uFAD9\uFB1D\uFB1F\uFB20\uFB21\uFB22\uFB23\uFB24\uFB25\uFB26\uFB27\uFB28\uFB2A\uFB2B\uFB2C\uFB2D\uFB2E\uFB2F\uFB30\uFB31\uFB32\uFB33\uFB34\uFB35\uFB36\uFB38\uFB39\uFB3A\uFB3B\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46\uFB47\uFB48\uFB49\uFB4A\uFB4B\uFB4C\uFB4D\uFB4E\uFB4F\uFB50\uFB51\uFB52\uFB53\uFB54\uFB55\uFB56\uFB57\uFB58\uFB59\uFB5A\uFB5B\uFB5C\uFB5D\uFB5E\uFB5F\uFB60\uFB61\uFB62\uFB63\uFB64\uFB65\uFB66\uFB67\uFB68\uFB69\uFB6A\uFB6B\uFB6C\uFB6D\uFB6E\uFB6F\uFB70\uFB71\uFB72\uFB73\uFB74\uFB75\uFB76\uFB77\uFB78\uFB79\uFB7A\uFB7B\uFB7C\uFB7D\uFB7E\uFB7F\uFB80\uFB81\uFB82\uFB83\uFB84\uFB85\uFB86\uFB87\uFB88\uFB89\uFB8A\uFB8B\uFB8C\uFB8D\uFB8E\uFB8F\uFB90\uFB91\uFB92\uFB93\uFB94\uFB95\uFB96\uFB97\uFB98\uFB99\uFB9A\uFB9B\uFB9C\uFB9D\uFB9E\uFB9F\uFBA0\uFBA1\uFBA2\uFBA3\uFBA4\uFBA5\uFBA6\uFBA7\uFBA8\uFBA9\uFBAA\uFBAB\uFBAC\uFBAD\uFBAE\uFBAF\uFBB0\uFBB1\uFBD3\uFBD4\uFBD5\uFBD6\uFBD7\uFBD8\uFBD9\uFBDA\uFBDB\uFBDC\uFBDD\uFBDE\uFBDF\uFBE0\uFBE1\uFBE2\uFBE3\uFBE4\uFBE5\uFBE6\uFBE7\uFBE8\uFBE9\uFBEA\uFBEB\uFBEC\uFBED\uFBEE\uFBEF\uFBF0\uFBF1\uFBF2\uFBF3\uFBF4\uFBF5\uFBF6\uFBF7\uFBF8\uFBF9\uFBFA\uFBFB\uFBFC\uFBFD\uFBFE\uFBFF\uFC00\uFC01\uFC02\uFC03\uFC04\uFC05\uFC06\uFC07\uFC08\uFC09\uFC0A\uFC0B\uFC0C\uFC0D\uFC0E\uFC0F\uFC10\uFC11\uFC12\uFC13\uFC14\uFC15\uFC16\uFC17\uFC18\uFC19\uFC1A\uFC1B\uFC1C\uFC1D\uFC1E\uFC1F\uFC20\uFC21\uFC22\uFC23\uFC24\uFC25\uFC26\uFC27\uFC28\uFC29\uFC2A\uFC2B\uFC2C\uFC2D\uFC2E\uFC2F\uFC30\uFC31\uFC32\uFC33\uFC34\uFC35\uFC36\uFC37\uFC38\uFC39\uFC3A\uFC3B\uFC3C\uFC3D\uFC3E\uFC3F\uFC40\uFC41\uFC42\uFC43\uFC44\uFC45\uFC46\uFC47\uFC48\uFC49\uFC4A\uFC4B\uFC4C\uFC4D\uFC4E\uFC4F\uFC50\uFC51\uFC52\uFC53\uFC54\uFC55\uFC56\uFC57\uFC58\uFC59\uFC5A\uFC5B\uFC5C\uFC5D\uFC5E\uFC5F\uFC60\uFC61\uFC62\uFC63\uFC64\uFC65\uFC66\uFC67\uFC68\uFC69\uFC6A\uFC6B\uFC6C\uFC6D\uFC6E\uFC6F\uFC70\uFC71\uFC72\uFC73\uFC74\uFC75\uFC76\uFC77\uFC78\uFC79\uFC7A\uFC7B\uFC7C\uFC7D\uFC7E\uFC7F\uFC80\uFC81\uFC82\uFC83\uFC84\uFC85\uFC86\uFC87\uFC88\uFC89\uFC8A\uFC8B\uFC8C\uFC8D\uFC8E\uFC8F\uFC90\uFC91\uFC92\uFC93\uFC94\uFC95\uFC96\uFC97\uFC98\uFC99\uFC9A\uFC9B\uFC9C\uFC9D\uFC9E\uFC9F\uFCA0\uFCA1\uFCA2\uFCA3\uFCA4\uFCA5\uFCA6\uFCA7\uFCA8\uFCA9\uFCAA\uFCAB\uFCAC\uFCAD\uFCAE\uFCAF\uFCB0\uFCB1\uFCB2\uFCB3\uFCB4\uFCB5\uFCB6\uFCB7\uFCB8\uFCB9\uFCBA\uFCBB\uFCBC\uFCBD\uFCBE\uFCBF\uFCC0\uFCC1\uFCC2\uFCC3\uFCC4\uFCC5\uFCC6\uFCC7\uFCC8\uFCC9\uFCCA\uFCCB\uFCCC\uFCCD\uFCCE\uFCCF\uFCD0\uFCD1\uFCD2\uFCD3\uFCD4\uFCD5\uFCD6\uFCD7\uFCD8\uFCD9\uFCDA\uFCDB\uFCDC\uFCDD\uFCDE\uFCDF\uFCE0\uFCE1\uFCE2\uFCE3\uFCE4\uFCE5\uFCE6\uFCE7\uFCE8\uFCE9\uFCEA\uFCEB\uFCEC\uFCED\uFCEE\uFCEF\uFCF0\uFCF1\uFCF2\uFCF3\uFCF4\uFCF5\uFCF6\uFCF7\uFCF8\uFCF9\uFCFA\uFCFB\uFCFC\uFCFD\uFCFE\uFCFF\uFD00\uFD01\uFD02\uFD03\uFD04\uFD05\uFD06\uFD07\uFD08\uFD09\uFD0A\uFD0B\uFD0C\uFD0D\uFD0E\uFD0F\uFD10\uFD11\uFD12\uFD13\uFD14\uFD15\uFD16\uFD17\uFD18\uFD19\uFD1A\uFD1B\uFD1C\uFD1D\uFD1E\uFD1F\uFD20\uFD21\uFD22\uFD23\uFD24\uFD25\uFD26\uFD27\uFD28\uFD29\uFD2A\uFD2B\uFD2C\uFD2D\uFD2E\uFD2F\uFD30\uFD31\uFD32\uFD33\uFD34\uFD35\uFD36\uFD37\uFD38\uFD39\uFD3A\uFD3B\uFD3C\uFD3D\uFD50\uFD51\uFD52\uFD53\uFD54\uFD55\uFD56\uFD57\uFD58\uFD59\uFD5A\uFD5B\uFD5C\uFD5D\uFD5E\uFD5F\uFD60\uFD61\uFD62\uFD63\uFD64\uFD65\uFD66\uFD67\uFD68\uFD69\uFD6A\uFD6B\uFD6C\uFD6D\uFD6E\uFD6F\uFD70\uFD71\uFD72\uFD73\uFD74\uFD75\uFD76\uFD77\uFD78\uFD79\uFD7A\uFD7B\uFD7C\uFD7D\uFD7E\uFD7F\uFD80\uFD81\uFD82\uFD83\uFD84\uFD85\uFD86\uFD87\uFD88\uFD89\uFD8A\uFD8B\uFD8C\uFD8D\uFD8E\uFD8F\uFD92\uFD93\uFD94\uFD95\uFD96\uFD97\uFD98\uFD99\uFD9A\uFD9B\uFD9C\uFD9D\uFD9E\uFD9F\uFDA0\uFDA1\uFDA2\uFDA3\uFDA4\uFDA5\uFDA6\uFDA7\uFDA8\uFDA9\uFDAA\uFDAB\uFDAC\uFDAD\uFDAE\uFDAF\uFDB0\uFDB1\uFDB2\uFDB3\uFDB4\uFDB5\uFDB6\uFDB7\uFDB8\uFDB9\uFDBA\uFDBB\uFDBC\uFDBD\uFDBE\uFDBF\uFDC0\uFDC1\uFDC2\uFDC3\uFDC4\uFDC5\uFDC6\uFDC7\uFDF0\uFDF1\uFDF2\uFDF3\uFDF4\uFDF5\uFDF6\uFDF7\uFDF8\uFDF9\uFDFA\uFDFB\uFE70\uFE71\uFE72\uFE73\uFE74\uFE76\uFE77\uFE78\uFE79\uFE7A\uFE7B\uFE7C\uFE7D\uFE7E\uFE7F\uFE80\uFE81\uFE82\uFE83\uFE84\uFE85\uFE86\uFE87\uFE88\uFE89\uFE8A\uFE8B\uFE8C\uFE8D\uFE8E\uFE8F\uFE90\uFE91\uFE92\uFE93\uFE94\uFE95\uFE96\uFE97\uFE98\uFE99\uFE9A\uFE9B\uFE9C\uFE9D\uFE9E\uFE9F\uFEA0\uFEA1\uFEA2\uFEA3\uFEA4\uFEA5\uFEA6\uFEA7\uFEA8\uFEA9\uFEAA\uFEAB\uFEAC\uFEAD\uFEAE\uFEAF\uFEB0\uFEB1\uFEB2\uFEB3\uFEB4\uFEB5\uFEB6\uFEB7\uFEB8\uFEB9\uFEBA\uFEBB\uFEBC\uFEBD\uFEBE\uFEBF\uFEC0\uFEC1\uFEC2\uFEC3\uFEC4\uFEC5\uFEC6\uFEC7\uFEC8\uFEC9\uFECA\uFECB\uFECC\uFECD\uFECE\uFECF\uFED0\uFED1\uFED2\uFED3\uFED4\uFED5\uFED6\uFED7\uFED8\uFED9\uFEDA\uFEDB\uFEDC\uFEDD\uFEDE\uFEDF\uFEE0\uFEE1\uFEE2\uFEE3\uFEE4\uFEE5\uFEE6\uFEE7\uFEE8\uFEE9\uFEEA\uFEEB\uFEEC\uFEED\uFEEE\uFEEF\uFEF0\uFEF1\uFEF2\uFEF3\uFEF4\uFEF5\uFEF6\uFEF7\uFEF8\uFEF9\uFEFA\uFEFB\uFEFC\uFF66\uFF67\uFF68\uFF69\uFF6A\uFF6B\uFF6C\uFF6D\uFF6E\uFF6F\uFF71\uFF72\uFF73\uFF74\uFF75\uFF76\uFF77\uFF78\uFF79\uFF7A\uFF7B\uFF7C\uFF7D\uFF7E\uFF7F\uFF80\uFF81\uFF82\uFF83\uFF84\uFF85\uFF86\uFF87\uFF88\uFF89\uFF8A\uFF8B\uFF8C\uFF8D\uFF8E\uFF8F\uFF90\uFF91\uFF92\uFF93\uFF94\uFF95\uFF96\uFF97\uFF98\uFF99\uFF9A\uFF9B\uFF9C\uFF9D\uFFA0\uFFA1\uFFA2\uFFA3\uFFA4\uFFA5\uFFA6\uFFA7\uFFA8\uFFA9\uFFAA\uFFAB\uFFAC\uFFAD\uFFAE\uFFAF\uFFB0\uFFB1\uFFB2\uFFB3\uFFB4\uFFB5\uFFB6\uFFB7\uFFB8\uFFB9\uFFBA\uFFBB\uFFBC\uFFBD\uFFBE\uFFC2\uFFC3\uFFC4\uFFC5\uFFC6\uFFC7\uFFCA\uFFCB\uFFCC\uFFCD\uFFCE\uFFCF\uFFD2\uFFD3\uFFD4\uFFD5\uFFD6\uFFD7\uFFDA\uFFDB\uFFDC]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[\\u01BB\\u01C0\\u01C1\\u01C2\\u01C3\\u0294\\u05D0\\u05D1\\u05D2\\u05D3\\u05D4\\u05D5\\u05D6\\u05D7\\u05D8\\u05D9\\u05DA\\u05DB\\u05DC\\u05DD\\u05DE\\u05DF\\u05E0\\u05E1\\u05E2\\u05E3\\u05E4\\u05E5\\u05E6\\u05E7\\u05E8\\u05E9\\u05EA\\u05F0\\u05F1\\u05F2\\u0621\\u0622\\u0623\\u0624\\u0625\\u0626\\u0627\\u0628\\u0629\\u062A\\u062B\\u062C\\u062D\\u062E\\u062F\\u0630\\u0631\\u0632\\u0633\\u0634\\u0635\\u0636\\u0637\\u0638\\u0639\\u063A\\u063B\\u063C\\u063D\\u063E\\u063F\\u0641\\u0642\\u0643\\u0644\\u0645\\u0646\\u0647\\u0648\\u0649\\u064A\\u066E\\u066F\\u0671\\u0672\\u0673\\u0674\\u0675\\u0676\\u0677\\u0678\\u0679\\u067A\\u067B\\u067C\\u067D\\u067E\\u067F\\u0680\\u0681\\u0682\\u0683\\u0684\\u0685\\u0686\\u0687\\u0688\\u0689\\u068A\\u068B\\u068C\\u068D\\u068E\\u068F\\u0690\\u0691\\u0692\\u0693\\u0694\\u0695\\u0696\\u0697\\u0698\\u0699\\u069A\\u069B\\u069C\\u069D\\u069E\\u069F\\u06A0\\u06A1\\u06A2\\u06A3\\u06A4\\u06A5\\u06A6\\u06A7\\u06A8\\u06A9\\u06AA\\u06AB\\u06AC\\u06AD\\u06AE\\u06AF\\u06B0\\u06B1\\u06B2\\u06B3\\u06B4\\u06B5\\u06B6\\u06B7\\u06B8\\u06B9\\u06BA\\u06BB\\u06BC\\u06BD\\u06BE\\u06BF\\u06C0\\u06C1\\u06C2\\u06C3\\u06C4\\u06C5\\u06C6\\u06C7\\u06C8\\u06C9\\u06CA\\u06CB\\u06CC\\u06CD\\u06CE\\u06CF\\u06D0\\u06D1\\u06D2\\u06D3\\u06D5\\u06EE\\u06EF\\u06FA\\u06FB\\u06FC\\u06FF\\u0710\\u0712\\u0713\\u0714\\u0715\\u0716\\u0717\\u0718\\u0719\\u071A\\u071B\\u071C\\u071D\\u071E\\u071F\\u0720\\u0721\\u0722\\u0723\\u0724\\u0725\\u0726\\u0727\\u0728\\u0729\\u072A\\u072B\\u072C\\u072D\\u072E\\u072F\\u074D\\u074E\\u074F\\u0750\\u0751\\u0752\\u0753\\u0754\\u0755\\u0756\\u0757\\u0758\\u0759\\u075A\\u075B\\u075C\\u075D\\u075E\\u075F\\u0760\\u0761\\u0762\\u0763\\u0764\\u0765\\u0766\\u0767\\u0768\\u0769\\u076A\\u076B\\u076C\\u076D\\u076E\\u076F\\u0770\\u0771\\u0772\\u0773\\u0774\\u0775\\u0776\\u0777\\u0778\\u0779\\u077A\\u077B\\u077C\\u077D\\u077E\\u077F\\u0780\\u0781\\u0782\\u0783\\u0784\\u0785\\u0786\\u0787\\u0788\\u0789\\u078A\\u078B\\u078C\\u078D\\u078E\\u078F\\u0790\\u0791\\u0792\\u0793\\u0794\\u0795\\u0796\\u0797\\u0798\\u0799\\u079A\\u079B\\u079C\\u079D\\u079E\\u079F\\u07A0\\u07A1\\u07A2\\u07A3\\u07A4\\u07A5\\u07B1\\u07CA\\u07CB\\u07CC\\u07CD\\u07CE\\u07CF\\u07D0\\u07D1\\u07D2\\u07D3\\u07D4\\u07D5\\u07D6\\u07D7\\u07D8\\u07D9\\u07DA\\u07DB\\u07DC\\u07DD\\u07DE\\u07DF\\u07E0\\u07E1\\u07E2\\u07E3\\u07E4\\u07E5\\u07E6\\u07E7\\u07E8\\u07E9\\u07EA\\u0904\\u0905\\u0906\\u0907\\u0908\\u0909\\u090A\\u090B\\u090C\\u090D\\u090E\\u090F\\u0910\\u0911\\u0912\\u0913\\u0914\\u0915\\u0916\\u0917\\u0918\\u0919\\u091A\\u091B\\u091C\\u091D\\u091E\\u091F\\u0920\\u0921\\u0922\\u0923\\u0924\\u0925\\u0926\\u0927\\u0928\\u0929\\u092A\\u092B\\u092C\\u092D\\u092E\\u092F\\u0930\\u0931\\u0932\\u0933\\u0934\\u0935\\u0936\\u0937\\u0938\\u0939\\u093D\\u0950\\u0958\\u0959\\u095A\\u095B\\u095C\\u095D\\u095E\\u095F\\u0960\\u0961\\u0972\\u097B\\u097C\\u097D\\u097E\\u097F\\u0985\\u0986\\u0987\\u0988\\u0989\\u098A\\u098B\\u098C\\u098F\\u0990\\u0993\\u0994\\u0995\\u0996\\u0997\\u0998\\u0999\\u099A\\u099B\\u099C\\u099D\\u099E\\u099F\\u09A0\\u09A1\\u09A2\\u09A3\\u09A4\\u09A5\\u09A6\\u09A7\\u09A8\\u09AA\\u09AB\\u09AC\\u09AD\\u09AE\\u09AF\\u09B0\\u09B2\\u09B6\\u09B7\\u09B8\\u09B9\\u09BD\\u09CE\\u09DC\\u09DD\\u09DF\\u09E0\\u09E1\\u09F0\\u09F1\\u0A05\\u0A06\\u0A07\\u0A08\\u0A09\\u0A0A\\u0A0F\\u0A10\\u0A13\\u0A14\\u0A15\\u0A16\\u0A17\\u0A18\\u0A19\\u0A1A\\u0A1B\\u0A1C\\u0A1D\\u0A1E\\u0A1F\\u0A20\\u0A21\\u0A22\\u0A23\\u0A24\\u0A25\\u0A26\\u0A27\\u0A28\\u0A2A\\u0A2B\\u0A2C\\u0A2D\\u0A2E\\u0A2F\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A59\\u0A5A\\u0A5B\\u0A5C\\u0A5E\\u0A72\\u0A73\\u0A74\\u0A85\\u0A86\\u0A87\\u0A88\\u0A89\\u0A8A\\u0A8B\\u0A8C\\u0A8D\\u0A8F\\u0A90\\u0A91\\u0A93\\u0A94\\u0A95\\u0A96\\u0A97\\u0A98\\u0A99\\u0A9A\\u0A9B\\u0A9C\\u0A9D\\u0A9E\\u0A9F\\u0AA0\\u0AA1\\u0AA2\\u0AA3\\u0AA4\\u0AA5\\u0AA6\\u0AA7\\u0AA8\\u0AAA\\u0AAB\\u0AAC\\u0AAD\\u0AAE\\u0AAF\\u0AB0\\u0AB2\\u0AB3\\u0AB5\\u0AB6\\u0AB7\\u0AB8\\u0AB9\\u0ABD\\u0AD0\\u0AE0\\u0AE1\\u0B05\\u0B06\\u0B07\\u0B08\\u0B09\\u0B0A\\u0B0B\\u0B0C\\u0B0F\\u0B10\\u0B13\\u0B14\\u0B15\\u0B16\\u0B17\\u0B18\\u0B19\\u0B1A\\u0B1B\\u0B1C\\u0B1D\\u0B1E\\u0B1F\\u0B20\\u0B21\\u0B22\\u0B23\\u0B24\\u0B25\\u0B26\\u0B27\\u0B28\\u0B2A\\u0B2B\\u0B2C\\u0B2D\\u0B2E\\u0B2F\\u0B30\\u0B32\\u0B33\\u0B35\\u0B36\\u0B37\\u0B38\\u0B39\\u0B3D\\u0B5C\\u0B5D\\u0B5F\\u0B60\\u0B61\\u0B71\\u0B83\\u0B85\\u0B86\\u0B87\\u0B88\\u0B89\\u0B8A\\u0B8E\\u0B8F\\u0B90\\u0B92\\u0B93\\u0B94\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8\\u0BA9\\u0BAA\\u0BAE\\u0BAF\\u0BB0\\u0BB1\\u0BB2\\u0BB3\\u0BB4\\u0BB5\\u0BB6\\u0BB7\\u0BB8\\u0BB9\\u0BD0\\u0C05\\u0C06\\u0C07\\u0C08\\u0C09\\u0C0A\\u0C0B\\u0C0C\\u0C0E\\u0C0F\\u0C10\\u0C12\\u0C13\\u0C14\\u0C15\\u0C16\\u0C17\\u0C18\\u0C19\\u0C1A\\u0C1B\\u0C1C\\u0C1D\\u0C1E\\u0C1F\\u0C20\\u0C21\\u0C22\\u0C23\\u0C24\\u0C25\\u0C26\\u0C27\\u0C28\\u0C2A\\u0C2B\\u0C2C\\u0C2D\\u0C2E\\u0C2F\\u0C30\\u0C31\\u0C32\\u0C33\\u0C35\\u0C36\\u0C37\\u0C38\\u0C39\\u0C3D\\u0C58\\u0C59\\u0C60\\u0C61\\u0C85\\u0C86\\u0C87\\u0C88\\u0C89\\u0C8A\\u0C8B\\u0C8C\\u0C8E\\u0C8F\\u0C90\\u0C92\\u0C93\\u0C94\\u0C95\\u0C96\\u0C97\\u0C98\\u0C99\\u0C9A\\u0C9B\\u0C9C\\u0C9D\\u0C9E\\u0C9F\\u0CA0\\u0CA1\\u0CA2\\u0CA3\\u0CA4\\u0CA5\\u0CA6\\u0CA7\\u0CA8\\u0CAA\\u0CAB\\u0CAC\\u0CAD\\u0CAE\\u0CAF\\u0CB0\\u0CB1\\u0CB2\\u0CB3\\u0CB5\\u0CB6\\u0CB7\\u0CB8\\u0CB9\\u0CBD\\u0CDE\\u0CE0\\u0CE1\\u0D05\\u0D06\\u0D07\\u0D08\\u0D09\\u0D0A\\u0D0B\\u0D0C\\u0D0E\\u0D0F\\u0D10\\u0D12\\u0D13\\u0D14\\u0D15\\u0D16\\u0D17\\u0D18\\u0D19\\u0D1A\\u0D1B\\u0D1C\\u0D1D\\u0D1E\\u0D1F\\u0D20\\u0D21\\u0D22\\u0D23\\u0D24\\u0D25\\u0D26\\u0D27\\u0D28\\u0D2A\\u0D2B\\u0D2C\\u0D2D\\u0D2E\\u0D2F\\u0D30\\u0D31\\u0D32\\u0D33\\u0D34\\u0D35\\u0D36\\u0D37\\u0D38\\u0D39\\u0D3D\\u0D60\\u0D61\\u0D7A\\u0D7B\\u0D7C\\u0D7D\\u0D7E\\u0D7F\\u0D85\\u0D86\\u0D87\\u0D88\\u0D89\\u0D8A\\u0D8B\\u0D8C\\u0D8D\\u0D8E\\u0D8F\\u0D90\\u0D91\\u0D92\\u0D93\\u0D94\\u0D95\\u0D96\\u0D9A\\u0D9B\\u0D9C\\u0D9D\\u0D9E\\u0D9F\\u0DA0\\u0DA1\\u0DA2\\u0DA3\\u0DA4\\u0DA5\\u0DA6\\u0DA7\\u0DA8\\u0DA9\\u0DAA\\u0DAB\\u0DAC\\u0DAD\\u0DAE\\u0DAF\\u0DB0\\u0DB1\\u0DB3\\u0DB4\\u0DB5\\u0DB6\\u0DB7\\u0DB8\\u0DB9\\u0DBA\\u0DBB\\u0DBD\\u0DC0\\u0DC1\\u0DC2\\u0DC3\\u0DC4\\u0DC5\\u0DC6\\u0E01\\u0E02\\u0E03\\u0E04\\u0E05\\u0E06\\u0E07\\u0E08\\u0E09\\u0E0A\\u0E0B\\u0E0C\\u0E0D\\u0E0E\\u0E0F\\u0E10\\u0E11\\u0E12\\u0E13\\u0E14\\u0E15\\u0E16\\u0E17\\u0E18\\u0E19\\u0E1A\\u0E1B\\u0E1C\\u0E1D\\u0E1E\\u0E1F\\u0E20\\u0E21\\u0E22\\u0E23\\u0E24\\u0E25\\u0E26\\u0E27\\u0E28\\u0E29\\u0E2A\\u0E2B\\u0E2C\\u0E2D\\u0E2E\\u0E2F\\u0E30\\u0E32\\u0E33\\u0E40\\u0E41\\u0E42\\u0E43\\u0E44\\u0E45\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94\\u0E95\\u0E96\\u0E97\\u0E99\\u0E9A\\u0E9B\\u0E9C\\u0E9D\\u0E9E\\u0E9F\\u0EA1\\u0EA2\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD\\u0EAE\\u0EAF\\u0EB0\\u0EB2\\u0EB3\\u0EBD\\u0EC0\\u0EC1\\u0EC2\\u0EC3\\u0EC4\\u0EDC\\u0EDD\\u0F00\\u0F40\\u0F41\\u0F42\\u0F43\\u0F44\\u0F45\\u0F46\\u0F47\\u0F49\\u0F4A\\u0F4B\\u0F4C\\u0F4D\\u0F4E\\u0F4F\\u0F50\\u0F51\\u0F52\\u0F53\\u0F54\\u0F55\\u0F56\\u0F57\\u0F58\\u0F59\\u0F5A\\u0F5B\\u0F5C\\u0F5D\\u0F5E\\u0F5F\\u0F60\\u0F61\\u0F62\\u0F63\\u0F64\\u0F65\\u0F66\\u0F67\\u0F68\\u0F69\\u0F6A\\u0F6B\\u0F6C\\u0F88\\u0F89\\u0F8A\\u0F8B\\u1000\\u1001\\u1002\\u1003\\u1004\\u1005\\u1006\\u1007\\u1008\\u1009\\u100A\\u100B\\u100C\\u100D\\u100E\\u100F\\u1010\\u1011\\u1012\\u1013\\u1014\\u1015\\u1016\\u1017\\u1018\\u1019\\u101A\\u101B\\u101C\\u101D\\u101E\\u101F\\u1020\\u1021\\u1022\\u1023\\u1024\\u1025\\u1026\\u1027\\u1028\\u1029\\u102A\\u103F\\u1050\\u1051\\u1052\\u1053\\u1054\\u1055\\u105A\\u105B\\u105C\\u105D\\u1061\\u1065\\u1066\\u106E\\u106F\\u1070\\u1075\\u1076\\u1077\\u1078\\u1079\\u107A\\u107B\\u107C\\u107D\\u107E\\u107F\\u1080\\u1081\\u108E\\u10D0\\u10D1\\u10D2\\u10D3\\u10D4\\u10D5\\u10D6\\u10D7\\u10D8\\u10D9\\u10DA\\u10DB\\u10DC\\u10DD\\u10DE\\u10DF\\u10E0\\u10E1\\u10E2\\u10E3\\u10E4\\u10E5\\u10E6\\u10E7\\u10E8\\u10E9\\u10EA\\u10EB\\u10EC\\u10ED\\u10EE\\u10EF\\u10F0\\u10F1\\u10F2\\u10F3\\u10F4\\u10F5\\u10F6\\u10F7\\u10F8\\u10F9\\u10FA\\u1100\\u1101\\u1102\\u1103\\u1104\\u1105\\u1106\\u1107\\u1108\\u1109\\u110A\\u110B\\u110C\\u110D\\u110E\\u110F\\u1110\\u1111\\u1112\\u1113\\u1114\\u1115\\u1116\\u1117\\u1118\\u1119\\u111A\\u111B\\u111C\\u111D\\u111E\\u111F\\u1120\\u1121\\u1122\\u1123\\u1124\\u1125\\u1126\\u1127\\u1128\\u1129\\u112A\\u112B\\u112C\\u112D\\u112E\\u112F\\u1130\\u1131\\u1132\\u1133\\u1134\\u1135\\u1136\\u1137\\u1138\\u1139\\u113A\\u113B\\u113C\\u113D\\u113E\\u113F\\u1140\\u1141\\u1142\\u1143\\u1144\\u1145\\u1146\\u1147\\u1148\\u1149\\u114A\\u114B\\u114C\\u114D\\u114E\\u114F\\u1150\\u1151\\u1152\\u1153\\u1154\\u1155\\u1156\\u1157\\u1158\\u1159\\u115F\\u1160\\u1161\\u1162\\u1163\\u1164\\u1165\\u1166\\u1167\\u1168\\u1169\\u116A\\u116B\\u116C\\u116D\\u116E\\u116F\\u1170\\u1171\\u1172\\u1173\\u1174\\u1175\\u1176\\u1177\\u1178\\u1179\\u117A\\u117B\\u117C\\u117D\\u117E\\u117F\\u1180\\u1181\\u1182\\u1183\\u1184\\u1185\\u1186\\u1187\\u1188\\u1189\\u118A\\u118B\\u118C\\u118D\\u118E\\u118F\\u1190\\u1191\\u1192\\u1193\\u1194\\u1195\\u1196\\u1197\\u1198\\u1199\\u119A\\u119B\\u119C\\u119D\\u119E\\u119F\\u11A0\\u11A1\\u11A2\\u11A8\\u11A9\\u11AA\\u11AB\\u11AC\\u11AD\\u11AE\\u11AF\\u11B0\\u11B1\\u11B2\\u11B3\\u11B4\\u11B5\\u11B6\\u11B7\\u11B8\\u11B9\\u11BA\\u11BB\\u11BC\\u11BD\\u11BE\\u11BF\\u11C0\\u11C1\\u11C2\\u11C3\\u11C4\\u11C5\\u11C6\\u11C7\\u11C8\\u11C9\\u11CA\\u11CB\\u11CC\\u11CD\\u11CE\\u11CF\\u11D0\\u11D1\\u11D2\\u11D3\\u11D4\\u11D5\\u11D6\\u11D7\\u11D8\\u11D9\\u11DA\\u11DB\\u11DC\\u11DD\\u11DE\\u11DF\\u11E0\\u11E1\\u11E2\\u11E3\\u11E4\\u11E5\\u11E6\\u11E7\\u11E8\\u11E9\\u11EA\\u11EB\\u11EC\\u11ED\\u11EE\\u11EF\\u11F0\\u11F1\\u11F2\\u11F3\\u11F4\\u11F5\\u11F6\\u11F7\\u11F8\\u11F9\\u1200\\u1201\\u1202\\u1203\\u1204\\u1205\\u1206\\u1207\\u1208\\u1209\\u120A\\u120B\\u120C\\u120D\\u120E\\u120F\\u1210\\u1211\\u1212\\u1213\\u1214\\u1215\\u1216\\u1217\\u1218\\u1219\\u121A\\u121B\\u121C\\u121D\\u121E\\u121F\\u1220\\u1221\\u1222\\u1223\\u1224\\u1225\\u1226\\u1227\\u1228\\u1229\\u122A\\u122B\\u122C\\u122D\\u122E\\u122F\\u1230\\u1231\\u1232\\u1233\\u1234\\u1235\\u1236\\u1237\\u1238\\u1239\\u123A\\u123B\\u123C\\u123D\\u123E\\u123F\\u1240\\u1241\\u1242\\u1243\\u1244\\u1245\\u1246\\u1247\\u1248\\u124A\\u124B\\u124C\\u124D\\u1250\\u1251\\u1252\\u1253\\u1254\\u1255\\u1256\\u1258\\u125A\\u125B\\u125C\\u125D\\u1260\\u1261\\u1262\\u1263\\u1264\\u1265\\u1266\\u1267\\u1268\\u1269\\u126A\\u126B\\u126C\\u126D\\u126E\\u126F\\u1270\\u1271\\u1272\\u1273\\u1274\\u1275\\u1276\\u1277\\u1278\\u1279\\u127A\\u127B\\u127C\\u127D\\u127E\\u127F\\u1280\\u1281\\u1282\\u1283\\u1284\\u1285\\u1286\\u1287\\u1288\\u128A\\u128B\\u128C\\u128D\\u1290\\u1291\\u1292\\u1293\\u1294\\u1295\\u1296\\u1297\\u1298\\u1299\\u129A\\u129B\\u129C\\u129D\\u129E\\u129F\\u12A0\\u12A1\\u12A2\\u12A3\\u12A4\\u12A5\\u12A6\\u12A7\\u12A8\\u12A9\\u12AA\\u12AB\\u12AC\\u12AD\\u12AE\\u12AF\\u12B0\\u12B2\\u12B3\\u12B4\\u12B5\\u12B8\\u12B9\\u12BA\\u12BB\\u12BC\\u12BD\\u12BE\\u12C0\\u12C2\\u12C3\\u12C4\\u12C5\\u12C8\\u12C9\\u12CA\\u12CB\\u12CC\\u12CD\\u12CE\\u12CF\\u12D0\\u12D1\\u12D2\\u12D3\\u12D4\\u12D5\\u12D6\\u12D8\\u12D9\\u12DA\\u12DB\\u12DC\\u12DD\\u12DE\\u12DF\\u12E0\\u12E1\\u12E2\\u12E3\\u12E4\\u12E5\\u12E6\\u12E7\\u12E8\\u12E9\\u12EA\\u12EB\\u12EC\\u12ED\\u12EE\\u12EF\\u12F0\\u12F1\\u12F2\\u12F3\\u12F4\\u12F5\\u12F6\\u12F7\\u12F8\\u12F9\\u12FA\\u12FB\\u12FC\\u12FD\\u12FE\\u12FF\\u1300\\u1301\\u1302\\u1303\\u1304\\u1305\\u1306\\u1307\\u1308\\u1309\\u130A\\u130B\\u130C\\u130D\\u130E\\u130F\\u1310\\u1312\\u1313\\u1314\\u1315\\u1318\\u1319\\u131A\\u131B\\u131C\\u131D\\u131E\\u131F\\u1320\\u1321\\u1322\\u1323\\u1324\\u1325\\u1326\\u1327\\u1328\\u1329\\u132A\\u132B\\u132C\\u132D\\u132E\\u132F\\u1330\\u1331\\u1332\\u1333\\u1334\\u1335\\u1336\\u1337\\u1338\\u1339\\u133A\\u133B\\u133C\\u133D\\u133E\\u133F\\u1340\\u1341\\u1342\\u1343\\u1344\\u1345\\u1346\\u1347\\u1348\\u1349\\u134A\\u134B\\u134C\\u134D\\u134E\\u134F\\u1350\\u1351\\u1352\\u1353\\u1354\\u1355\\u1356\\u1357\\u1358\\u1359\\u135A\\u1380\\u1381\\u1382\\u1383\\u1384\\u1385\\u1386\\u1387\\u1388\\u1389\\u138A\\u138B\\u138C\\u138D\\u138E\\u138F\\u13A0\\u13A1\\u13A2\\u13A3\\u13A4\\u13A5\\u13A6\\u13A7\\u13A8\\u13A9\\u13AA\\u13AB\\u13AC\\u13AD\\u13AE\\u13AF\\u13B0\\u13B1\\u13B2\\u13B3\\u13B4\\u13B5\\u13B6\\u13B7\\u13B8\\u13B9\\u13BA\\u13BB\\u13BC\\u13BD\\u13BE\\u13BF\\u13C0\\u13C1\\u13C2\\u13C3\\u13C4\\u13C5\\u13C6\\u13C7\\u13C8\\u13C9\\u13CA\\u13CB\\u13CC\\u13CD\\u13CE\\u13CF\\u13D0\\u13D1\\u13D2\\u13D3\\u13D4\\u13D5\\u13D6\\u13D7\\u13D8\\u13D9\\u13DA\\u13DB\\u13DC\\u13DD\\u13DE\\u13DF\\u13E0\\u13E1\\u13E2\\u13E3\\u13E4\\u13E5\\u13E6\\u13E7\\u13E8\\u13E9\\u13EA\\u13EB\\u13EC\\u13ED\\u13EE\\u13EF\\u13F0\\u13F1\\u13F2\\u13F3\\u13F4\\u1401\\u1402\\u1403\\u1404\\u1405\\u1406\\u1407\\u1408\\u1409\\u140A\\u140B\\u140C\\u140D\\u140E\\u140F\\u1410\\u1411\\u1412\\u1413\\u1414\\u1415\\u1416\\u1417\\u1418\\u1419\\u141A\\u141B\\u141C\\u141D\\u141E\\u141F\\u1420\\u1421\\u1422\\u1423\\u1424\\u1425\\u1426\\u1427\\u1428\\u1429\\u142A\\u142B\\u142C\\u142D\\u142E\\u142F\\u1430\\u1431\\u1432\\u1433\\u1434\\u1435\\u1436\\u1437\\u1438\\u1439\\u143A\\u143B\\u143C\\u143D\\u143E\\u143F\\u1440\\u1441\\u1442\\u1443\\u1444\\u1445\\u1446\\u1447\\u1448\\u1449\\u144A\\u144B\\u144C\\u144D\\u144E\\u144F\\u1450\\u1451\\u1452\\u1453\\u1454\\u1455\\u1456\\u1457\\u1458\\u1459\\u145A\\u145B\\u145C\\u145D\\u145E\\u145F\\u1460\\u1461\\u1462\\u1463\\u1464\\u1465\\u1466\\u1467\\u1468\\u1469\\u146A\\u146B\\u146C\\u146D\\u146E\\u146F\\u1470\\u1471\\u1472\\u1473\\u1474\\u1475\\u1476\\u1477\\u1478\\u1479\\u147A\\u147B\\u147C\\u147D\\u147E\\u147F\\u1480\\u1481\\u1482\\u1483\\u1484\\u1485\\u1486\\u1487\\u1488\\u1489\\u148A\\u148B\\u148C\\u148D\\u148E\\u148F\\u1490\\u1491\\u1492\\u1493\\u1494\\u1495\\u1496\\u1497\\u1498\\u1499\\u149A\\u149B\\u149C\\u149D\\u149E\\u149F\\u14A0\\u14A1\\u14A2\\u14A3\\u14A4\\u14A5\\u14A6\\u14A7\\u14A8\\u14A9\\u14AA\\u14AB\\u14AC\\u14AD\\u14AE\\u14AF\\u14B0\\u14B1\\u14B2\\u14B3\\u14B4\\u14B5\\u14B6\\u14B7\\u14B8\\u14B9\\u14BA\\u14BB\\u14BC\\u14BD\\u14BE\\u14BF\\u14C0\\u14C1\\u14C2\\u14C3\\u14C4\\u14C5\\u14C6\\u14C7\\u14C8\\u14C9\\u14CA\\u14CB\\u14CC\\u14CD\\u14CE\\u14CF\\u14D0\\u14D1\\u14D2\\u14D3\\u14D4\\u14D5\\u14D6\\u14D7\\u14D8\\u14D9\\u14DA\\u14DB\\u14DC\\u14DD\\u14DE\\u14DF\\u14E0\\u14E1\\u14E2\\u14E3\\u14E4\\u14E5\\u14E6\\u14E7\\u14E8\\u14E9\\u14EA\\u14EB\\u14EC\\u14ED\\u14EE\\u14EF\\u14F0\\u14F1\\u14F2\\u14F3\\u14F4\\u14F5\\u14F6\\u14F7\\u14F8\\u14F9\\u14FA\\u14FB\\u14FC\\u14FD\\u14FE\\u14FF\\u1500\\u1501\\u1502\\u1503\\u1504\\u1505\\u1506\\u1507\\u1508\\u1509\\u150A\\u150B\\u150C\\u150D\\u150E\\u150F\\u1510\\u1511\\u1512\\u1513\\u1514\\u1515\\u1516\\u1517\\u1518\\u1519\\u151A\\u151B\\u151C\\u151D\\u151E\\u151F\\u1520\\u1521\\u1522\\u1523\\u1524\\u1525\\u1526\\u1527\\u1528\\u1529\\u152A\\u152B\\u152C\\u152D\\u152E\\u152F\\u1530\\u1531\\u1532\\u1533\\u1534\\u1535\\u1536\\u1537\\u1538\\u1539\\u153A\\u153B\\u153C\\u153D\\u153E\\u153F\\u1540\\u1541\\u1542\\u1543\\u1544\\u1545\\u1546\\u1547\\u1548\\u1549\\u154A\\u154B\\u154C\\u154D\\u154E\\u154F\\u1550\\u1551\\u1552\\u1553\\u1554\\u1555\\u1556\\u1557\\u1558\\u1559\\u155A\\u155B\\u155C\\u155D\\u155E\\u155F\\u1560\\u1561\\u1562\\u1563\\u1564\\u1565\\u1566\\u1567\\u1568\\u1569\\u156A\\u156B\\u156C\\u156D\\u156E\\u156F\\u1570\\u1571\\u1572\\u1573\\u1574\\u1575\\u1576\\u1577\\u1578\\u1579\\u157A\\u157B\\u157C\\u157D\\u157E\\u157F\\u1580\\u1581\\u1582\\u1583\\u1584\\u1585\\u1586\\u1587\\u1588\\u1589\\u158A\\u158B\\u158C\\u158D\\u158E\\u158F\\u1590\\u1591\\u1592\\u1593\\u1594\\u1595\\u1596\\u1597\\u1598\\u1599\\u159A\\u159B\\u159C\\u159D\\u159E\\u159F\\u15A0\\u15A1\\u15A2\\u15A3\\u15A4\\u15A5\\u15A6\\u15A7\\u15A8\\u15A9\\u15AA\\u15AB\\u15AC\\u15AD\\u15AE\\u15AF\\u15B0\\u15B1\\u15B2\\u15B3\\u15B4\\u15B5\\u15B6\\u15B7\\u15B8\\u15B9\\u15BA\\u15BB\\u15BC\\u15BD\\u15BE\\u15BF\\u15C0\\u15C1\\u15C2\\u15C3\\u15C4\\u15C5\\u15C6\\u15C7\\u15C8\\u15C9\\u15CA\\u15CB\\u15CC\\u15CD\\u15CE\\u15CF\\u15D0\\u15D1\\u15D2\\u15D3\\u15D4\\u15D5\\u15D6\\u15D7\\u15D8\\u15D9\\u15DA\\u15DB\\u15DC\\u15DD\\u15DE\\u15DF\\u15E0\\u15E1\\u15E2\\u15E3\\u15E4\\u15E5\\u15E6\\u15E7\\u15E8\\u15E9\\u15EA\\u15EB\\u15EC\\u15ED\\u15EE\\u15EF\\u15F0\\u15F1\\u15F2\\u15F3\\u15F4\\u15F5\\u15F6\\u15F7\\u15F8\\u15F9\\u15FA\\u15FB\\u15FC\\u15FD\\u15FE\\u15FF\\u1600\\u1601\\u1602\\u1603\\u1604\\u1605\\u1606\\u1607\\u1608\\u1609\\u160A\\u160B\\u160C\\u160D\\u160E\\u160F\\u1610\\u1611\\u1612\\u1613\\u1614\\u1615\\u1616\\u1617\\u1618\\u1619\\u161A\\u161B\\u161C\\u161D\\u161E\\u161F\\u1620\\u1621\\u1622\\u1623\\u1624\\u1625\\u1626\\u1627\\u1628\\u1629\\u162A\\u162B\\u162C\\u162D\\u162E\\u162F\\u1630\\u1631\\u1632\\u1633\\u1634\\u1635\\u1636\\u1637\\u1638\\u1639\\u163A\\u163B\\u163C\\u163D\\u163E\\u163F\\u1640\\u1641\\u1642\\u1643\\u1644\\u1645\\u1646\\u1647\\u1648\\u1649\\u164A\\u164B\\u164C\\u164D\\u164E\\u164F\\u1650\\u1651\\u1652\\u1653\\u1654\\u1655\\u1656\\u1657\\u1658\\u1659\\u165A\\u165B\\u165C\\u165D\\u165E\\u165F\\u1660\\u1661\\u1662\\u1663\\u1664\\u1665\\u1666\\u1667\\u1668\\u1669\\u166A\\u166B\\u166C\\u166F\\u1670\\u1671\\u1672\\u1673\\u1674\\u1675\\u1676\\u1681\\u1682\\u1683\\u1684\\u1685\\u1686\\u1687\\u1688\\u1689\\u168A\\u168B\\u168C\\u168D\\u168E\\u168F\\u1690\\u1691\\u1692\\u1693\\u1694\\u1695\\u1696\\u1697\\u1698\\u1699\\u169A\\u16A0\\u16A1\\u16A2\\u16A3\\u16A4\\u16A5\\u16A6\\u16A7\\u16A8\\u16A9\\u16AA\\u16AB\\u16AC\\u16AD\\u16AE\\u16AF\\u16B0\\u16B1\\u16B2\\u16B3\\u16B4\\u16B5\\u16B6\\u16B7\\u16B8\\u16B9\\u16BA\\u16BB\\u16BC\\u16BD\\u16BE\\u16BF\\u16C0\\u16C1\\u16C2\\u16C3\\u16C4\\u16C5\\u16C6\\u16C7\\u16C8\\u16C9\\u16CA\\u16CB\\u16CC\\u16CD\\u16CE\\u16CF\\u16D0\\u16D1\\u16D2\\u16D3\\u16D4\\u16D5\\u16D6\\u16D7\\u16D8\\u16D9\\u16DA\\u16DB\\u16DC\\u16DD\\u16DE\\u16DF\\u16E0\\u16E1\\u16E2\\u16E3\\u16E4\\u16E5\\u16E6\\u16E7\\u16E8\\u16E9\\u16EA\\u1700\\u1701\\u1702\\u1703\\u1704\\u1705\\u1706\\u1707\\u1708\\u1709\\u170A\\u170B\\u170C\\u170E\\u170F\\u1710\\u1711\\u1720\\u1721\\u1722\\u1723\\u1724\\u1725\\u1726\\u1727\\u1728\\u1729\\u172A\\u172B\\u172C\\u172D\\u172E\\u172F\\u1730\\u1731\\u1740\\u1741\\u1742\\u1743\\u1744\\u1745\\u1746\\u1747\\u1748\\u1749\\u174A\\u174B\\u174C\\u174D\\u174E\\u174F\\u1750\\u1751\\u1760\\u1761\\u1762\\u1763\\u1764\\u1765\\u1766\\u1767\\u1768\\u1769\\u176A\\u176B\\u176C\\u176E\\u176F\\u1770\\u1780\\u1781\\u1782\\u1783\\u1784\\u1785\\u1786\\u1787\\u1788\\u1789\\u178A\\u178B\\u178C\\u178D\\u178E\\u178F\\u1790\\u1791\\u1792\\u1793\\u1794\\u1795\\u1796\\u1797\\u1798\\u1799\\u179A\\u179B\\u179C\\u179D\\u179E\\u179F\\u17A0\\u17A1\\u17A2\\u17A3\\u17A4\\u17A5\\u17A6\\u17A7\\u17A8\\u17A9\\u17AA\\u17AB\\u17AC\\u17AD\\u17AE\\u17AF\\u17B0\\u17B1\\u17B2\\u17B3\\u17DC\\u1820\\u1821\\u1822\\u1823\\u1824\\u1825\\u1826\\u1827\\u1828\\u1829\\u182A\\u182B\\u182C\\u182D\\u182E\\u182F\\u1830\\u1831\\u1832\\u1833\\u1834\\u1835\\u1836\\u1837\\u1838\\u1839\\u183A\\u183B\\u183C\\u183D\\u183E\\u183F\\u1840\\u1841\\u1842\\u1844\\u1845\\u1846\\u1847\\u1848\\u1849\\u184A\\u184B\\u184C\\u184D\\u184E\\u184F\\u1850\\u1851\\u1852\\u1853\\u1854\\u1855\\u1856\\u1857\\u1858\\u1859\\u185A\\u185B\\u185C\\u185D\\u185E\\u185F\\u1860\\u1861\\u1862\\u1863\\u1864\\u1865\\u1866\\u1867\\u1868\\u1869\\u186A\\u186B\\u186C\\u186D\\u186E\\u186F\\u1870\\u1871\\u1872\\u1873\\u1874\\u1875\\u1876\\u1877\\u1880\\u1881\\u1882\\u1883\\u1884\\u1885\\u1886\\u1887\\u1888\\u1889\\u188A\\u188B\\u188C\\u188D\\u188E\\u188F\\u1890\\u1891\\u1892\\u1893\\u1894\\u1895\\u1896\\u1897\\u1898\\u1899\\u189A\\u189B\\u189C\\u189D\\u189E\\u189F\\u18A0\\u18A1\\u18A2\\u18A3\\u18A4\\u18A5\\u18A6\\u18A7\\u18A8\\u18AA\\u1900\\u1901\\u1902\\u1903\\u1904\\u1905\\u1906\\u1907\\u1908\\u1909\\u190A\\u190B\\u190C\\u190D\\u190E\\u190F\\u1910\\u1911\\u1912\\u1913\\u1914\\u1915\\u1916\\u1917\\u1918\\u1919\\u191A\\u191B\\u191C\\u1950\\u1951\\u1952\\u1953\\u1954\\u1955\\u1956\\u1957\\u1958\\u1959\\u195A\\u195B\\u195C\\u195D\\u195E\\u195F\\u1960\\u1961\\u1962\\u1963\\u1964\\u1965\\u1966\\u1967\\u1968\\u1969\\u196A\\u196B\\u196C\\u196D\\u1970\\u1971\\u1972\\u1973\\u1974\\u1980\\u1981\\u1982\\u1983\\u1984\\u1985\\u1986\\u1987\\u1988\\u1989\\u198A\\u198B\\u198C\\u198D\\u198E\\u198F\\u1990\\u1991\\u1992\\u1993\\u1994\\u1995\\u1996\\u1997\\u1998\\u1999\\u199A\\u199B\\u199C\\u199D\\u199E\\u199F\\u19A0\\u19A1\\u19A2\\u19A3\\u19A4\\u19A5\\u19A6\\u19A7\\u19A8\\u19A9\\u19C1\\u19C2\\u19C3\\u19C4\\u19C5\\u19C6\\u19C7\\u1A00\\u1A01\\u1A02\\u1A03\\u1A04\\u1A05\\u1A06\\u1A07\\u1A08\\u1A09\\u1A0A\\u1A0B\\u1A0C\\u1A0D\\u1A0E\\u1A0F\\u1A10\\u1A11\\u1A12\\u1A13\\u1A14\\u1A15\\u1A16\\u1B05\\u1B06\\u1B07\\u1B08\\u1B09\\u1B0A\\u1B0B\\u1B0C\\u1B0D\\u1B0E\\u1B0F\\u1B10\\u1B11\\u1B12\\u1B13\\u1B14\\u1B15\\u1B16\\u1B17\\u1B18\\u1B19\\u1B1A\\u1B1B\\u1B1C\\u1B1D\\u1B1E\\u1B1F\\u1B20\\u1B21\\u1B22\\u1B23\\u1B24\\u1B25\\u1B26\\u1B27\\u1B28\\u1B29\\u1B2A\\u1B2B\\u1B2C\\u1B2D\\u1B2E\\u1B2F\\u1B30\\u1B31\\u1B32\\u1B33\\u1B45\\u1B46\\u1B47\\u1B48\\u1B49\\u1B4A\\u1B4B\\u1B83\\u1B84\\u1B85\\u1B86\\u1B87\\u1B88\\u1B89\\u1B8A\\u1B8B\\u1B8C\\u1B8D\\u1B8E\\u1B8F\\u1B90\\u1B91\\u1B92\\u1B93\\u1B94\\u1B95\\u1B96\\u1B97\\u1B98\\u1B99\\u1B9A\\u1B9B\\u1B9C\\u1B9D\\u1B9E\\u1B9F\\u1BA0\\u1BAE\\u1BAF\\u1C00\\u1C01\\u1C02\\u1C03\\u1C04\\u1C05\\u1C06\\u1C07\\u1C08\\u1C09\\u1C0A\\u1C0B\\u1C0C\\u1C0D\\u1C0E\\u1C0F\\u1C10\\u1C11\\u1C12\\u1C13\\u1C14\\u1C15\\u1C16\\u1C17\\u1C18\\u1C19\\u1C1A\\u1C1B\\u1C1C\\u1C1D\\u1C1E\\u1C1F\\u1C20\\u1C21\\u1C22\\u1C23\\u1C4D\\u1C4E\\u1C4F\\u1C5A\\u1C5B\\u1C5C\\u1C5D\\u1C5E\\u1C5F\\u1C60\\u1C61\\u1C62\\u1C63\\u1C64\\u1C65\\u1C66\\u1C67\\u1C68\\u1C69\\u1C6A\\u1C6B\\u1C6C\\u1C6D\\u1C6E\\u1C6F\\u1C70\\u1C71\\u1C72\\u1C73\\u1C74\\u1C75\\u1C76\\u1C77\\u2135\\u2136\\u2137\\u2138\\u2D30\\u2D31\\u2D32\\u2D33\\u2D34\\u2D35\\u2D36\\u2D37\\u2D38\\u2D39\\u2D3A\\u2D3B\\u2D3C\\u2D3D\\u2D3E\\u2D3F\\u2D40\\u2D41\\u2D42\\u2D43\\u2D44\\u2D45\\u2D46\\u2D47\\u2D48\\u2D49\\u2D4A\\u2D4B\\u2D4C\\u2D4D\\u2D4E\\u2D4F\\u2D50\\u2D51\\u2D52\\u2D53\\u2D54\\u2D55\\u2D56\\u2D57\\u2D58\\u2D59\\u2D5A\\u2D5B\\u2D5C\\u2D5D\\u2D5E\\u2D5F\\u2D60\\u2D61\\u2D62\\u2D63\\u2D64\\u2D65\\u2D80\\u2D81\\u2D82\\u2D83\\u2D84\\u2D85\\u2D86\\u2D87\\u2D88\\u2D89\\u2D8A\\u2D8B\\u2D8C\\u2D8D\\u2D8E\\u2D8F\\u2D90\\u2D91\\u2D92\\u2D93\\u2D94\\u2D95\\u2D96\\u2DA0\\u2DA1\\u2DA2\\u2DA3\\u2DA4\\u2DA5\\u2DA6\\u2DA8\\u2DA9\\u2DAA\\u2DAB\\u2DAC\\u2DAD\\u2DAE\\u2DB0\\u2DB1\\u2DB2\\u2DB3\\u2DB4\\u2DB5\\u2DB6\\u2DB8\\u2DB9\\u2DBA\\u2DBB\\u2DBC\\u2DBD\\u2DBE\\u2DC0\\u2DC1\\u2DC2\\u2DC3\\u2DC4\\u2DC5\\u2DC6\\u2DC8\\u2DC9\\u2DCA\\u2DCB\\u2DCC\\u2DCD\\u2DCE\\u2DD0\\u2DD1\\u2DD2\\u2DD3\\u2DD4\\u2DD5\\u2DD6\\u2DD8\\u2DD9\\u2DDA\\u2DDB\\u2DDC\\u2DDD\\u2DDE\\u3006\\u303C\\u3041\\u3042\\u3043\\u3044\\u3045\\u3046\\u3047\\u3048\\u3049\\u304A\\u304B\\u304C\\u304D\\u304E\\u304F\\u3050\\u3051\\u3052\\u3053\\u3054\\u3055\\u3056\\u3057\\u3058\\u3059\\u305A\\u305B\\u305C\\u305D\\u305E\\u305F\\u3060\\u3061\\u3062\\u3063\\u3064\\u3065\\u3066\\u3067\\u3068\\u3069\\u306A\\u306B\\u306C\\u306D\\u306E\\u306F\\u3070\\u3071\\u3072\\u3073\\u3074\\u3075\\u3076\\u3077\\u3078\\u3079\\u307A\\u307B\\u307C\\u307D\\u307E\\u307F\\u3080\\u3081\\u3082\\u3083\\u3084\\u3085\\u3086\\u3087\\u3088\\u3089\\u308A\\u308B\\u308C\\u308D\\u308E\\u308F\\u3090\\u3091\\u3092\\u3093\\u3094\\u3095\\u3096\\u309F\\u30A1\\u30A2\\u30A3\\u30A4\\u30A5\\u30A6\\u30A7\\u30A8\\u30A9\\u30AA\\u30AB\\u30AC\\u30AD\\u30AE\\u30AF\\u30B0\\u30B1\\u30B2\\u30B3\\u30B4\\u30B5\\u30B6\\u30B7\\u30B8\\u30B9\\u30BA\\u30BB\\u30BC\\u30BD\\u30BE\\u30BF\\u30C0\\u30C1\\u30C2\\u30C3\\u30C4\\u30C5\\u30C6\\u30C7\\u30C8\\u30C9\\u30CA\\u30CB\\u30CC\\u30CD\\u30CE\\u30CF\\u30D0\\u30D1\\u30D2\\u30D3\\u30D4\\u30D5\\u30D6\\u30D7\\u30D8\\u30D9\\u30DA\\u30DB\\u30DC\\u30DD\\u30DE\\u30DF\\u30E0\\u30E1\\u30E2\\u30E3\\u30E4\\u30E5\\u30E6\\u30E7\\u30E8\\u30E9\\u30EA\\u30EB\\u30EC\\u30ED\\u30EE\\u30EF\\u30F0\\u30F1\\u30F2\\u30F3\\u30F4\\u30F5\\u30F6\\u30F7\\u30F8\\u30F9\\u30FA\\u30FF\\u3105\\u3106\\u3107\\u3108\\u3109\\u310A\\u310B\\u310C\\u310D\\u310E\\u310F\\u3110\\u3111\\u3112\\u3113\\u3114\\u3115\\u3116\\u3117\\u3118\\u3119\\u311A\\u311B\\u311C\\u311D\\u311E\\u311F\\u3120\\u3121\\u3122\\u3123\\u3124\\u3125\\u3126\\u3127\\u3128\\u3129\\u312A\\u312B\\u312C\\u312D\\u3131\\u3132\\u3133\\u3134\\u3135\\u3136\\u3137\\u3138\\u3139\\u313A\\u313B\\u313C\\u313D\\u313E\\u313F\\u3140\\u3141\\u3142\\u3143\\u3144\\u3145\\u3146\\u3147\\u3148\\u3149\\u314A\\u314B\\u314C\\u314D\\u314E\\u314F\\u3150\\u3151\\u3152\\u3153\\u3154\\u3155\\u3156\\u3157\\u3158\\u3159\\u315A\\u315B\\u315C\\u315D\\u315E\\u315F\\u3160\\u3161\\u3162\\u3163\\u3164\\u3165\\u3166\\u3167\\u3168\\u3169\\u316A\\u316B\\u316C\\u316D\\u316E\\u316F\\u3170\\u3171\\u3172\\u3173\\u3174\\u3175\\u3176\\u3177\\u3178\\u3179\\u317A\\u317B\\u317C\\u317D\\u317E\\u317F\\u3180\\u3181\\u3182\\u3183\\u3184\\u3185\\u3186\\u3187\\u3188\\u3189\\u318A\\u318B\\u318C\\u318D\\u318E\\u31A0\\u31A1\\u31A2\\u31A3\\u31A4\\u31A5\\u31A6\\u31A7\\u31A8\\u31A9\\u31AA\\u31AB\\u31AC\\u31AD\\u31AE\\u31AF\\u31B0\\u31B1\\u31B2\\u31B3\\u31B4\\u31B5\\u31B6\\u31B7\\u31F0\\u31F1\\u31F2\\u31F3\\u31F4\\u31F5\\u31F6\\u31F7\\u31F8\\u31F9\\u31FA\\u31FB\\u31FC\\u31FD\\u31FE\\u31FF\\u3400\\u4DB5\\u4E00\\u9FC3\\uA000\\uA001\\uA002\\uA003\\uA004\\uA005\\uA006\\uA007\\uA008\\uA009\\uA00A\\uA00B\\uA00C\\uA00D\\uA00E\\uA00F\\uA010\\uA011\\uA012\\uA013\\uA014\\uA016\\uA017\\uA018\\uA019\\uA01A\\uA01B\\uA01C\\uA01D\\uA01E\\uA01F\\uA020\\uA021\\uA022\\uA023\\uA024\\uA025\\uA026\\uA027\\uA028\\uA029\\uA02A\\uA02B\\uA02C\\uA02D\\uA02E\\uA02F\\uA030\\uA031\\uA032\\uA033\\uA034\\uA035\\uA036\\uA037\\uA038\\uA039\\uA03A\\uA03B\\uA03C\\uA03D\\uA03E\\uA03F\\uA040\\uA041\\uA042\\uA043\\uA044\\uA045\\uA046\\uA047\\uA048\\uA049\\uA04A\\uA04B\\uA04C\\uA04D\\uA04E\\uA04F\\uA050\\uA051\\uA052\\uA053\\uA054\\uA055\\uA056\\uA057\\uA058\\uA059\\uA05A\\uA05B\\uA05C\\uA05D\\uA05E\\uA05F\\uA060\\uA061\\uA062\\uA063\\uA064\\uA065\\uA066\\uA067\\uA068\\uA069\\uA06A\\uA06B\\uA06C\\uA06D\\uA06E\\uA06F\\uA070\\uA071\\uA072\\uA073\\uA074\\uA075\\uA076\\uA077\\uA078\\uA079\\uA07A\\uA07B\\uA07C\\uA07D\\uA07E\\uA07F\\uA080\\uA081\\uA082\\uA083\\uA084\\uA085\\uA086\\uA087\\uA088\\uA089\\uA08A\\uA08B\\uA08C\\uA08D\\uA08E\\uA08F\\uA090\\uA091\\uA092\\uA093\\uA094\\uA095\\uA096\\uA097\\uA098\\uA099\\uA09A\\uA09B\\uA09C\\uA09D\\uA09E\\uA09F\\uA0A0\\uA0A1\\uA0A2\\uA0A3\\uA0A4\\uA0A5\\uA0A6\\uA0A7\\uA0A8\\uA0A9\\uA0AA\\uA0AB\\uA0AC\\uA0AD\\uA0AE\\uA0AF\\uA0B0\\uA0B1\\uA0B2\\uA0B3\\uA0B4\\uA0B5\\uA0B6\\uA0B7\\uA0B8\\uA0B9\\uA0BA\\uA0BB\\uA0BC\\uA0BD\\uA0BE\\uA0BF\\uA0C0\\uA0C1\\uA0C2\\uA0C3\\uA0C4\\uA0C5\\uA0C6\\uA0C7\\uA0C8\\uA0C9\\uA0CA\\uA0CB\\uA0CC\\uA0CD\\uA0CE\\uA0CF\\uA0D0\\uA0D1\\uA0D2\\uA0D3\\uA0D4\\uA0D5\\uA0D6\\uA0D7\\uA0D8\\uA0D9\\uA0DA\\uA0DB\\uA0DC\\uA0DD\\uA0DE\\uA0DF\\uA0E0\\uA0E1\\uA0E2\\uA0E3\\uA0E4\\uA0E5\\uA0E6\\uA0E7\\uA0E8\\uA0E9\\uA0EA\\uA0EB\\uA0EC\\uA0ED\\uA0EE\\uA0EF\\uA0F0\\uA0F1\\uA0F2\\uA0F3\\uA0F4\\uA0F5\\uA0F6\\uA0F7\\uA0F8\\uA0F9\\uA0FA\\uA0FB\\uA0FC\\uA0FD\\uA0FE\\uA0FF\\uA100\\uA101\\uA102\\uA103\\uA104\\uA105\\uA106\\uA107\\uA108\\uA109\\uA10A\\uA10B\\uA10C\\uA10D\\uA10E\\uA10F\\uA110\\uA111\\uA112\\uA113\\uA114\\uA115\\uA116\\uA117\\uA118\\uA119\\uA11A\\uA11B\\uA11C\\uA11D\\uA11E\\uA11F\\uA120\\uA121\\uA122\\uA123\\uA124\\uA125\\uA126\\uA127\\uA128\\uA129\\uA12A\\uA12B\\uA12C\\uA12D\\uA12E\\uA12F\\uA130\\uA131\\uA132\\uA133\\uA134\\uA135\\uA136\\uA137\\uA138\\uA139\\uA13A\\uA13B\\uA13C\\uA13D\\uA13E\\uA13F\\uA140\\uA141\\uA142\\uA143\\uA144\\uA145\\uA146\\uA147\\uA148\\uA149\\uA14A\\uA14B\\uA14C\\uA14D\\uA14E\\uA14F\\uA150\\uA151\\uA152\\uA153\\uA154\\uA155\\uA156\\uA157\\uA158\\uA159\\uA15A\\uA15B\\uA15C\\uA15D\\uA15E\\uA15F\\uA160\\uA161\\uA162\\uA163\\uA164\\uA165\\uA166\\uA167\\uA168\\uA169\\uA16A\\uA16B\\uA16C\\uA16D\\uA16E\\uA16F\\uA170\\uA171\\uA172\\uA173\\uA174\\uA175\\uA176\\uA177\\uA178\\uA179\\uA17A\\uA17B\\uA17C\\uA17D\\uA17E\\uA17F\\uA180\\uA181\\uA182\\uA183\\uA184\\uA185\\uA186\\uA187\\uA188\\uA189\\uA18A\\uA18B\\uA18C\\uA18D\\uA18E\\uA18F\\uA190\\uA191\\uA192\\uA193\\uA194\\uA195\\uA196\\uA197\\uA198\\uA199\\uA19A\\uA19B\\uA19C\\uA19D\\uA19E\\uA19F\\uA1A0\\uA1A1\\uA1A2\\uA1A3\\uA1A4\\uA1A5\\uA1A6\\uA1A7\\uA1A8\\uA1A9\\uA1AA\\uA1AB\\uA1AC\\uA1AD\\uA1AE\\uA1AF\\uA1B0\\uA1B1\\uA1B2\\uA1B3\\uA1B4\\uA1B5\\uA1B6\\uA1B7\\uA1B8\\uA1B9\\uA1BA\\uA1BB\\uA1BC\\uA1BD\\uA1BE\\uA1BF\\uA1C0\\uA1C1\\uA1C2\\uA1C3\\uA1C4\\uA1C5\\uA1C6\\uA1C7\\uA1C8\\uA1C9\\uA1CA\\uA1CB\\uA1CC\\uA1CD\\uA1CE\\uA1CF\\uA1D0\\uA1D1\\uA1D2\\uA1D3\\uA1D4\\uA1D5\\uA1D6\\uA1D7\\uA1D8\\uA1D9\\uA1DA\\uA1DB\\uA1DC\\uA1DD\\uA1DE\\uA1DF\\uA1E0\\uA1E1\\uA1E2\\uA1E3\\uA1E4\\uA1E5\\uA1E6\\uA1E7\\uA1E8\\uA1E9\\uA1EA\\uA1EB\\uA1EC\\uA1ED\\uA1EE\\uA1EF\\uA1F0\\uA1F1\\uA1F2\\uA1F3\\uA1F4\\uA1F5\\uA1F6\\uA1F7\\uA1F8\\uA1F9\\uA1FA\\uA1FB\\uA1FC\\uA1FD\\uA1FE\\uA1FF\\uA200\\uA201\\uA202\\uA203\\uA204\\uA205\\uA206\\uA207\\uA208\\uA209\\uA20A\\uA20B\\uA20C\\uA20D\\uA20E\\uA20F\\uA210\\uA211\\uA212\\uA213\\uA214\\uA215\\uA216\\uA217\\uA218\\uA219\\uA21A\\uA21B\\uA21C\\uA21D\\uA21E\\uA21F\\uA220\\uA221\\uA222\\uA223\\uA224\\uA225\\uA226\\uA227\\uA228\\uA229\\uA22A\\uA22B\\uA22C\\uA22D\\uA22E\\uA22F\\uA230\\uA231\\uA232\\uA233\\uA234\\uA235\\uA236\\uA237\\uA238\\uA239\\uA23A\\uA23B\\uA23C\\uA23D\\uA23E\\uA23F\\uA240\\uA241\\uA242\\uA243\\uA244\\uA245\\uA246\\uA247\\uA248\\uA249\\uA24A\\uA24B\\uA24C\\uA24D\\uA24E\\uA24F\\uA250\\uA251\\uA252\\uA253\\uA254\\uA255\\uA256\\uA257\\uA258\\uA259\\uA25A\\uA25B\\uA25C\\uA25D\\uA25E\\uA25F\\uA260\\uA261\\uA262\\uA263\\uA264\\uA265\\uA266\\uA267\\uA268\\uA269\\uA26A\\uA26B\\uA26C\\uA26D\\uA26E\\uA26F\\uA270\\uA271\\uA272\\uA273\\uA274\\uA275\\uA276\\uA277\\uA278\\uA279\\uA27A\\uA27B\\uA27C\\uA27D\\uA27E\\uA27F\\uA280\\uA281\\uA282\\uA283\\uA284\\uA285\\uA286\\uA287\\uA288\\uA289\\uA28A\\uA28B\\uA28C\\uA28D\\uA28E\\uA28F\\uA290\\uA291\\uA292\\uA293\\uA294\\uA295\\uA296\\uA297\\uA298\\uA299\\uA29A\\uA29B\\uA29C\\uA29D\\uA29E\\uA29F\\uA2A0\\uA2A1\\uA2A2\\uA2A3\\uA2A4\\uA2A5\\uA2A6\\uA2A7\\uA2A8\\uA2A9\\uA2AA\\uA2AB\\uA2AC\\uA2AD\\uA2AE\\uA2AF\\uA2B0\\uA2B1\\uA2B2\\uA2B3\\uA2B4\\uA2B5\\uA2B6\\uA2B7\\uA2B8\\uA2B9\\uA2BA\\uA2BB\\uA2BC\\uA2BD\\uA2BE\\uA2BF\\uA2C0\\uA2C1\\uA2C2\\uA2C3\\uA2C4\\uA2C5\\uA2C6\\uA2C7\\uA2C8\\uA2C9\\uA2CA\\uA2CB\\uA2CC\\uA2CD\\uA2CE\\uA2CF\\uA2D0\\uA2D1\\uA2D2\\uA2D3\\uA2D4\\uA2D5\\uA2D6\\uA2D7\\uA2D8\\uA2D9\\uA2DA\\uA2DB\\uA2DC\\uA2DD\\uA2DE\\uA2DF\\uA2E0\\uA2E1\\uA2E2\\uA2E3\\uA2E4\\uA2E5\\uA2E6\\uA2E7\\uA2E8\\uA2E9\\uA2EA\\uA2EB\\uA2EC\\uA2ED\\uA2EE\\uA2EF\\uA2F0\\uA2F1\\uA2F2\\uA2F3\\uA2F4\\uA2F5\\uA2F6\\uA2F7\\uA2F8\\uA2F9\\uA2FA\\uA2FB\\uA2FC\\uA2FD\\uA2FE\\uA2FF\\uA300\\uA301\\uA302\\uA303\\uA304\\uA305\\uA306\\uA307\\uA308\\uA309\\uA30A\\uA30B\\uA30C\\uA30D\\uA30E\\uA30F\\uA310\\uA311\\uA312\\uA313\\uA314\\uA315\\uA316\\uA317\\uA318\\uA319\\uA31A\\uA31B\\uA31C\\uA31D\\uA31E\\uA31F\\uA320\\uA321\\uA322\\uA323\\uA324\\uA325\\uA326\\uA327\\uA328\\uA329\\uA32A\\uA32B\\uA32C\\uA32D\\uA32E\\uA32F\\uA330\\uA331\\uA332\\uA333\\uA334\\uA335\\uA336\\uA337\\uA338\\uA339\\uA33A\\uA33B\\uA33C\\uA33D\\uA33E\\uA33F\\uA340\\uA341\\uA342\\uA343\\uA344\\uA345\\uA346\\uA347\\uA348\\uA349\\uA34A\\uA34B\\uA34C\\uA34D\\uA34E\\uA34F\\uA350\\uA351\\uA352\\uA353\\uA354\\uA355\\uA356\\uA357\\uA358\\uA359\\uA35A\\uA35B\\uA35C\\uA35D\\uA35E\\uA35F\\uA360\\uA361\\uA362\\uA363\\uA364\\uA365\\uA366\\uA367\\uA368\\uA369\\uA36A\\uA36B\\uA36C\\uA36D\\uA36E\\uA36F\\uA370\\uA371\\uA372\\uA373\\uA374\\uA375\\uA376\\uA377\\uA378\\uA379\\uA37A\\uA37B\\uA37C\\uA37D\\uA37E\\uA37F\\uA380\\uA381\\uA382\\uA383\\uA384\\uA385\\uA386\\uA387\\uA388\\uA389\\uA38A\\uA38B\\uA38C\\uA38D\\uA38E\\uA38F\\uA390\\uA391\\uA392\\uA393\\uA394\\uA395\\uA396\\uA397\\uA398\\uA399\\uA39A\\uA39B\\uA39C\\uA39D\\uA39E\\uA39F\\uA3A0\\uA3A1\\uA3A2\\uA3A3\\uA3A4\\uA3A5\\uA3A6\\uA3A7\\uA3A8\\uA3A9\\uA3AA\\uA3AB\\uA3AC\\uA3AD\\uA3AE\\uA3AF\\uA3B0\\uA3B1\\uA3B2\\uA3B3\\uA3B4\\uA3B5\\uA3B6\\uA3B7\\uA3B8\\uA3B9\\uA3BA\\uA3BB\\uA3BC\\uA3BD\\uA3BE\\uA3BF\\uA3C0\\uA3C1\\uA3C2\\uA3C3\\uA3C4\\uA3C5\\uA3C6\\uA3C7\\uA3C8\\uA3C9\\uA3CA\\uA3CB\\uA3CC\\uA3CD\\uA3CE\\uA3CF\\uA3D0\\uA3D1\\uA3D2\\uA3D3\\uA3D4\\uA3D5\\uA3D6\\uA3D7\\uA3D8\\uA3D9\\uA3DA\\uA3DB\\uA3DC\\uA3DD\\uA3DE\\uA3DF\\uA3E0\\uA3E1\\uA3E2\\uA3E3\\uA3E4\\uA3E5\\uA3E6\\uA3E7\\uA3E8\\uA3E9\\uA3EA\\uA3EB\\uA3EC\\uA3ED\\uA3EE\\uA3EF\\uA3F0\\uA3F1\\uA3F2\\uA3F3\\uA3F4\\uA3F5\\uA3F6\\uA3F7\\uA3F8\\uA3F9\\uA3FA\\uA3FB\\uA3FC\\uA3FD\\uA3FE\\uA3FF\\uA400\\uA401\\uA402\\uA403\\uA404\\uA405\\uA406\\uA407\\uA408\\uA409\\uA40A\\uA40B\\uA40C\\uA40D\\uA40E\\uA40F\\uA410\\uA411\\uA412\\uA413\\uA414\\uA415\\uA416\\uA417\\uA418\\uA419\\uA41A\\uA41B\\uA41C\\uA41D\\uA41E\\uA41F\\uA420\\uA421\\uA422\\uA423\\uA424\\uA425\\uA426\\uA427\\uA428\\uA429\\uA42A\\uA42B\\uA42C\\uA42D\\uA42E\\uA42F\\uA430\\uA431\\uA432\\uA433\\uA434\\uA435\\uA436\\uA437\\uA438\\uA439\\uA43A\\uA43B\\uA43C\\uA43D\\uA43E\\uA43F\\uA440\\uA441\\uA442\\uA443\\uA444\\uA445\\uA446\\uA447\\uA448\\uA449\\uA44A\\uA44B\\uA44C\\uA44D\\uA44E\\uA44F\\uA450\\uA451\\uA452\\uA453\\uA454\\uA455\\uA456\\uA457\\uA458\\uA459\\uA45A\\uA45B\\uA45C\\uA45D\\uA45E\\uA45F\\uA460\\uA461\\uA462\\uA463\\uA464\\uA465\\uA466\\uA467\\uA468\\uA469\\uA46A\\uA46B\\uA46C\\uA46D\\uA46E\\uA46F\\uA470\\uA471\\uA472\\uA473\\uA474\\uA475\\uA476\\uA477\\uA478\\uA479\\uA47A\\uA47B\\uA47C\\uA47D\\uA47E\\uA47F\\uA480\\uA481\\uA482\\uA483\\uA484\\uA485\\uA486\\uA487\\uA488\\uA489\\uA48A\\uA48B\\uA48C\\uA500\\uA501\\uA502\\uA503\\uA504\\uA505\\uA506\\uA507\\uA508\\uA509\\uA50A\\uA50B\\uA50C\\uA50D\\uA50E\\uA50F\\uA510\\uA511\\uA512\\uA513\\uA514\\uA515\\uA516\\uA517\\uA518\\uA519\\uA51A\\uA51B\\uA51C\\uA51D\\uA51E\\uA51F\\uA520\\uA521\\uA522\\uA523\\uA524\\uA525\\uA526\\uA527\\uA528\\uA529\\uA52A\\uA52B\\uA52C\\uA52D\\uA52E\\uA52F\\uA530\\uA531\\uA532\\uA533\\uA534\\uA535\\uA536\\uA537\\uA538\\uA539\\uA53A\\uA53B\\uA53C\\uA53D\\uA53E\\uA53F\\uA540\\uA541\\uA542\\uA543\\uA544\\uA545\\uA546\\uA547\\uA548\\uA549\\uA54A\\uA54B\\uA54C\\uA54D\\uA54E\\uA54F\\uA550\\uA551\\uA552\\uA553\\uA554\\uA555\\uA556\\uA557\\uA558\\uA559\\uA55A\\uA55B\\uA55C\\uA55D\\uA55E\\uA55F\\uA560\\uA561\\uA562\\uA563\\uA564\\uA565\\uA566\\uA567\\uA568\\uA569\\uA56A\\uA56B\\uA56C\\uA56D\\uA56E\\uA56F\\uA570\\uA571\\uA572\\uA573\\uA574\\uA575\\uA576\\uA577\\uA578\\uA579\\uA57A\\uA57B\\uA57C\\uA57D\\uA57E\\uA57F\\uA580\\uA581\\uA582\\uA583\\uA584\\uA585\\uA586\\uA587\\uA588\\uA589\\uA58A\\uA58B\\uA58C\\uA58D\\uA58E\\uA58F\\uA590\\uA591\\uA592\\uA593\\uA594\\uA595\\uA596\\uA597\\uA598\\uA599\\uA59A\\uA59B\\uA59C\\uA59D\\uA59E\\uA59F\\uA5A0\\uA5A1\\uA5A2\\uA5A3\\uA5A4\\uA5A5\\uA5A6\\uA5A7\\uA5A8\\uA5A9\\uA5AA\\uA5AB\\uA5AC\\uA5AD\\uA5AE\\uA5AF\\uA5B0\\uA5B1\\uA5B2\\uA5B3\\uA5B4\\uA5B5\\uA5B6\\uA5B7\\uA5B8\\uA5B9\\uA5BA\\uA5BB\\uA5BC\\uA5BD\\uA5BE\\uA5BF\\uA5C0\\uA5C1\\uA5C2\\uA5C3\\uA5C4\\uA5C5\\uA5C6\\uA5C7\\uA5C8\\uA5C9\\uA5CA\\uA5CB\\uA5CC\\uA5CD\\uA5CE\\uA5CF\\uA5D0\\uA5D1\\uA5D2\\uA5D3\\uA5D4\\uA5D5\\uA5D6\\uA5D7\\uA5D8\\uA5D9\\uA5DA\\uA5DB\\uA5DC\\uA5DD\\uA5DE\\uA5DF\\uA5E0\\uA5E1\\uA5E2\\uA5E3\\uA5E4\\uA5E5\\uA5E6\\uA5E7\\uA5E8\\uA5E9\\uA5EA\\uA5EB\\uA5EC\\uA5ED\\uA5EE\\uA5EF\\uA5F0\\uA5F1\\uA5F2\\uA5F3\\uA5F4\\uA5F5\\uA5F6\\uA5F7\\uA5F8\\uA5F9\\uA5FA\\uA5FB\\uA5FC\\uA5FD\\uA5FE\\uA5FF\\uA600\\uA601\\uA602\\uA603\\uA604\\uA605\\uA606\\uA607\\uA608\\uA609\\uA60A\\uA60B\\uA610\\uA611\\uA612\\uA613\\uA614\\uA615\\uA616\\uA617\\uA618\\uA619\\uA61A\\uA61B\\uA61C\\uA61D\\uA61E\\uA61F\\uA62A\\uA62B\\uA66E\\uA7FB\\uA7FC\\uA7FD\\uA7FE\\uA7FF\\uA800\\uA801\\uA803\\uA804\\uA805\\uA807\\uA808\\uA809\\uA80A\\uA80C\\uA80D\\uA80E\\uA80F\\uA810\\uA811\\uA812\\uA813\\uA814\\uA815\\uA816\\uA817\\uA818\\uA819\\uA81A\\uA81B\\uA81C\\uA81D\\uA81E\\uA81F\\uA820\\uA821\\uA822\\uA840\\uA841\\uA842\\uA843\\uA844\\uA845\\uA846\\uA847\\uA848\\uA849\\uA84A\\uA84B\\uA84C\\uA84D\\uA84E\\uA84F\\uA850\\uA851\\uA852\\uA853\\uA854\\uA855\\uA856\\uA857\\uA858\\uA859\\uA85A\\uA85B\\uA85C\\uA85D\\uA85E\\uA85F\\uA860\\uA861\\uA862\\uA863\\uA864\\uA865\\uA866\\uA867\\uA868\\uA869\\uA86A\\uA86B\\uA86C\\uA86D\\uA86E\\uA86F\\uA870\\uA871\\uA872\\uA873\\uA882\\uA883\\uA884\\uA885\\uA886\\uA887\\uA888\\uA889\\uA88A\\uA88B\\uA88C\\uA88D\\uA88E\\uA88F\\uA890\\uA891\\uA892\\uA893\\uA894\\uA895\\uA896\\uA897\\uA898\\uA899\\uA89A\\uA89B\\uA89C\\uA89D\\uA89E\\uA89F\\uA8A0\\uA8A1\\uA8A2\\uA8A3\\uA8A4\\uA8A5\\uA8A6\\uA8A7\\uA8A8\\uA8A9\\uA8AA\\uA8AB\\uA8AC\\uA8AD\\uA8AE\\uA8AF\\uA8B0\\uA8B1\\uA8B2\\uA8B3\\uA90A\\uA90B\\uA90C\\uA90D\\uA90E\\uA90F\\uA910\\uA911\\uA912\\uA913\\uA914\\uA915\\uA916\\uA917\\uA918\\uA919\\uA91A\\uA91B\\uA91C\\uA91D\\uA91E\\uA91F\\uA920\\uA921\\uA922\\uA923\\uA924\\uA925\\uA930\\uA931\\uA932\\uA933\\uA934\\uA935\\uA936\\uA937\\uA938\\uA939\\uA93A\\uA93B\\uA93C\\uA93D\\uA93E\\uA93F\\uA940\\uA941\\uA942\\uA943\\uA944\\uA945\\uA946\\uAA00\\uAA01\\uAA02\\uAA03\\uAA04\\uAA05\\uAA06\\uAA07\\uAA08\\uAA09\\uAA0A\\uAA0B\\uAA0C\\uAA0D\\uAA0E\\uAA0F\\uAA10\\uAA11\\uAA12\\uAA13\\uAA14\\uAA15\\uAA16\\uAA17\\uAA18\\uAA19\\uAA1A\\uAA1B\\uAA1C\\uAA1D\\uAA1E\\uAA1F\\uAA20\\uAA21\\uAA22\\uAA23\\uAA24\\uAA25\\uAA26\\uAA27\\uAA28\\uAA40\\uAA41\\uAA42\\uAA44\\uAA45\\uAA46\\uAA47\\uAA48\\uAA49\\uAA4A\\uAA4B\\uAC00\\uD7A3\\uF900\\uF901\\uF902\\uF903\\uF904\\uF905\\uF906\\uF907\\uF908\\uF909\\uF90A\\uF90B\\uF90C\\uF90D\\uF90E\\uF90F\\uF910\\uF911\\uF912\\uF913\\uF914\\uF915\\uF916\\uF917\\uF918\\uF919\\uF91A\\uF91B\\uF91C\\uF91D\\uF91E\\uF91F\\uF920\\uF921\\uF922\\uF923\\uF924\\uF925\\uF926\\uF927\\uF928\\uF929\\uF92A\\uF92B\\uF92C\\uF92D\\uF92E\\uF92F\\uF930\\uF931\\uF932\\uF933\\uF934\\uF935\\uF936\\uF937\\uF938\\uF939\\uF93A\\uF93B\\uF93C\\uF93D\\uF93E\\uF93F\\uF940\\uF941\\uF942\\uF943\\uF944\\uF945\\uF946\\uF947\\uF948\\uF949\\uF94A\\uF94B\\uF94C\\uF94D\\uF94E\\uF94F\\uF950\\uF951\\uF952\\uF953\\uF954\\uF955\\uF956\\uF957\\uF958\\uF959\\uF95A\\uF95B\\uF95C\\uF95D\\uF95E\\uF95F\\uF960\\uF961\\uF962\\uF963\\uF964\\uF965\\uF966\\uF967\\uF968\\uF969\\uF96A\\uF96B\\uF96C\\uF96D\\uF96E\\uF96F\\uF970\\uF971\\uF972\\uF973\\uF974\\uF975\\uF976\\uF977\\uF978\\uF979\\uF97A\\uF97B\\uF97C\\uF97D\\uF97E\\uF97F\\uF980\\uF981\\uF982\\uF983\\uF984\\uF985\\uF986\\uF987\\uF988\\uF989\\uF98A\\uF98B\\uF98C\\uF98D\\uF98E\\uF98F\\uF990\\uF991\\uF992\\uF993\\uF994\\uF995\\uF996\\uF997\\uF998\\uF999\\uF99A\\uF99B\\uF99C\\uF99D\\uF99E\\uF99F\\uF9A0\\uF9A1\\uF9A2\\uF9A3\\uF9A4\\uF9A5\\uF9A6\\uF9A7\\uF9A8\\uF9A9\\uF9AA\\uF9AB\\uF9AC\\uF9AD\\uF9AE\\uF9AF\\uF9B0\\uF9B1\\uF9B2\\uF9B3\\uF9B4\\uF9B5\\uF9B6\\uF9B7\\uF9B8\\uF9B9\\uF9BA\\uF9BB\\uF9BC\\uF9BD\\uF9BE\\uF9BF\\uF9C0\\uF9C1\\uF9C2\\uF9C3\\uF9C4\\uF9C5\\uF9C6\\uF9C7\\uF9C8\\uF9C9\\uF9CA\\uF9CB\\uF9CC\\uF9CD\\uF9CE\\uF9CF\\uF9D0\\uF9D1\\uF9D2\\uF9D3\\uF9D4\\uF9D5\\uF9D6\\uF9D7\\uF9D8\\uF9D9\\uF9DA\\uF9DB\\uF9DC\\uF9DD\\uF9DE\\uF9DF\\uF9E0\\uF9E1\\uF9E2\\uF9E3\\uF9E4\\uF9E5\\uF9E6\\uF9E7\\uF9E8\\uF9E9\\uF9EA\\uF9EB\\uF9EC\\uF9ED\\uF9EE\\uF9EF\\uF9F0\\uF9F1\\uF9F2\\uF9F3\\uF9F4\\uF9F5\\uF9F6\\uF9F7\\uF9F8\\uF9F9\\uF9FA\\uF9FB\\uF9FC\\uF9FD\\uF9FE\\uF9FF\\uFA00\\uFA01\\uFA02\\uFA03\\uFA04\\uFA05\\uFA06\\uFA07\\uFA08\\uFA09\\uFA0A\\uFA0B\\uFA0C\\uFA0D\\uFA0E\\uFA0F\\uFA10\\uFA11\\uFA12\\uFA13\\uFA14\\uFA15\\uFA16\\uFA17\\uFA18\\uFA19\\uFA1A\\uFA1B\\uFA1C\\uFA1D\\uFA1E\\uFA1F\\uFA20\\uFA21\\uFA22\\uFA23\\uFA24\\uFA25\\uFA26\\uFA27\\uFA28\\uFA29\\uFA2A\\uFA2B\\uFA2C\\uFA2D\\uFA30\\uFA31\\uFA32\\uFA33\\uFA34\\uFA35\\uFA36\\uFA37\\uFA38\\uFA39\\uFA3A\\uFA3B\\uFA3C\\uFA3D\\uFA3E\\uFA3F\\uFA40\\uFA41\\uFA42\\uFA43\\uFA44\\uFA45\\uFA46\\uFA47\\uFA48\\uFA49\\uFA4A\\uFA4B\\uFA4C\\uFA4D\\uFA4E\\uFA4F\\uFA50\\uFA51\\uFA52\\uFA53\\uFA54\\uFA55\\uFA56\\uFA57\\uFA58\\uFA59\\uFA5A\\uFA5B\\uFA5C\\uFA5D\\uFA5E\\uFA5F\\uFA60\\uFA61\\uFA62\\uFA63\\uFA64\\uFA65\\uFA66\\uFA67\\uFA68\\uFA69\\uFA6A\\uFA70\\uFA71\\uFA72\\uFA73\\uFA74\\uFA75\\uFA76\\uFA77\\uFA78\\uFA79\\uFA7A\\uFA7B\\uFA7C\\uFA7D\\uFA7E\\uFA7F\\uFA80\\uFA81\\uFA82\\uFA83\\uFA84\\uFA85\\uFA86\\uFA87\\uFA88\\uFA89\\uFA8A\\uFA8B\\uFA8C\\uFA8D\\uFA8E\\uFA8F\\uFA90\\uFA91\\uFA92\\uFA93\\uFA94\\uFA95\\uFA96\\uFA97\\uFA98\\uFA99\\uFA9A\\uFA9B\\uFA9C\\uFA9D\\uFA9E\\uFA9F\\uFAA0\\uFAA1\\uFAA2\\uFAA3\\uFAA4\\uFAA5\\uFAA6\\uFAA7\\uFAA8\\uFAA9\\uFAAA\\uFAAB\\uFAAC\\uFAAD\\uFAAE\\uFAAF\\uFAB0\\uFAB1\\uFAB2\\uFAB3\\uFAB4\\uFAB5\\uFAB6\\uFAB7\\uFAB8\\uFAB9\\uFABA\\uFABB\\uFABC\\uFABD\\uFABE\\uFABF\\uFAC0\\uFAC1\\uFAC2\\uFAC3\\uFAC4\\uFAC5\\uFAC6\\uFAC7\\uFAC8\\uFAC9\\uFACA\\uFACB\\uFACC\\uFACD\\uFACE\\uFACF\\uFAD0\\uFAD1\\uFAD2\\uFAD3\\uFAD4\\uFAD5\\uFAD6\\uFAD7\\uFAD8\\uFAD9\\uFB1D\\uFB1F\\uFB20\\uFB21\\uFB22\\uFB23\\uFB24\\uFB25\\uFB26\\uFB27\\uFB28\\uFB2A\\uFB2B\\uFB2C\\uFB2D\\uFB2E\\uFB2F\\uFB30\\uFB31\\uFB32\\uFB33\\uFB34\\uFB35\\uFB36\\uFB38\\uFB39\\uFB3A\\uFB3B\\uFB3C\\uFB3E\\uFB40\\uFB41\\uFB43\\uFB44\\uFB46\\uFB47\\uFB48\\uFB49\\uFB4A\\uFB4B\\uFB4C\\uFB4D\\uFB4E\\uFB4F\\uFB50\\uFB51\\uFB52\\uFB53\\uFB54\\uFB55\\uFB56\\uFB57\\uFB58\\uFB59\\uFB5A\\uFB5B\\uFB5C\\uFB5D\\uFB5E\\uFB5F\\uFB60\\uFB61\\uFB62\\uFB63\\uFB64\\uFB65\\uFB66\\uFB67\\uFB68\\uFB69\\uFB6A\\uFB6B\\uFB6C\\uFB6D\\uFB6E\\uFB6F\\uFB70\\uFB71\\uFB72\\uFB73\\uFB74\\uFB75\\uFB76\\uFB77\\uFB78\\uFB79\\uFB7A\\uFB7B\\uFB7C\\uFB7D\\uFB7E\\uFB7F\\uFB80\\uFB81\\uFB82\\uFB83\\uFB84\\uFB85\\uFB86\\uFB87\\uFB88\\uFB89\\uFB8A\\uFB8B\\uFB8C\\uFB8D\\uFB8E\\uFB8F\\uFB90\\uFB91\\uFB92\\uFB93\\uFB94\\uFB95\\uFB96\\uFB97\\uFB98\\uFB99\\uFB9A\\uFB9B\\uFB9C\\uFB9D\\uFB9E\\uFB9F\\uFBA0\\uFBA1\\uFBA2\\uFBA3\\uFBA4\\uFBA5\\uFBA6\\uFBA7\\uFBA8\\uFBA9\\uFBAA\\uFBAB\\uFBAC\\uFBAD\\uFBAE\\uFBAF\\uFBB0\\uFBB1\\uFBD3\\uFBD4\\uFBD5\\uFBD6\\uFBD7\\uFBD8\\uFBD9\\uFBDA\\uFBDB\\uFBDC\\uFBDD\\uFBDE\\uFBDF\\uFBE0\\uFBE1\\uFBE2\\uFBE3\\uFBE4\\uFBE5\\uFBE6\\uFBE7\\uFBE8\\uFBE9\\uFBEA\\uFBEB\\uFBEC\\uFBED\\uFBEE\\uFBEF\\uFBF0\\uFBF1\\uFBF2\\uFBF3\\uFBF4\\uFBF5\\uFBF6\\uFBF7\\uFBF8\\uFBF9\\uFBFA\\uFBFB\\uFBFC\\uFBFD\\uFBFE\\uFBFF\\uFC00\\uFC01\\uFC02\\uFC03\\uFC04\\uFC05\\uFC06\\uFC07\\uFC08\\uFC09\\uFC0A\\uFC0B\\uFC0C\\uFC0D\\uFC0E\\uFC0F\\uFC10\\uFC11\\uFC12\\uFC13\\uFC14\\uFC15\\uFC16\\uFC17\\uFC18\\uFC19\\uFC1A\\uFC1B\\uFC1C\\uFC1D\\uFC1E\\uFC1F\\uFC20\\uFC21\\uFC22\\uFC23\\uFC24\\uFC25\\uFC26\\uFC27\\uFC28\\uFC29\\uFC2A\\uFC2B\\uFC2C\\uFC2D\\uFC2E\\uFC2F\\uFC30\\uFC31\\uFC32\\uFC33\\uFC34\\uFC35\\uFC36\\uFC37\\uFC38\\uFC39\\uFC3A\\uFC3B\\uFC3C\\uFC3D\\uFC3E\\uFC3F\\uFC40\\uFC41\\uFC42\\uFC43\\uFC44\\uFC45\\uFC46\\uFC47\\uFC48\\uFC49\\uFC4A\\uFC4B\\uFC4C\\uFC4D\\uFC4E\\uFC4F\\uFC50\\uFC51\\uFC52\\uFC53\\uFC54\\uFC55\\uFC56\\uFC57\\uFC58\\uFC59\\uFC5A\\uFC5B\\uFC5C\\uFC5D\\uFC5E\\uFC5F\\uFC60\\uFC61\\uFC62\\uFC63\\uFC64\\uFC65\\uFC66\\uFC67\\uFC68\\uFC69\\uFC6A\\uFC6B\\uFC6C\\uFC6D\\uFC6E\\uFC6F\\uFC70\\uFC71\\uFC72\\uFC73\\uFC74\\uFC75\\uFC76\\uFC77\\uFC78\\uFC79\\uFC7A\\uFC7B\\uFC7C\\uFC7D\\uFC7E\\uFC7F\\uFC80\\uFC81\\uFC82\\uFC83\\uFC84\\uFC85\\uFC86\\uFC87\\uFC88\\uFC89\\uFC8A\\uFC8B\\uFC8C\\uFC8D\\uFC8E\\uFC8F\\uFC90\\uFC91\\uFC92\\uFC93\\uFC94\\uFC95\\uFC96\\uFC97\\uFC98\\uFC99\\uFC9A\\uFC9B\\uFC9C\\uFC9D\\uFC9E\\uFC9F\\uFCA0\\uFCA1\\uFCA2\\uFCA3\\uFCA4\\uFCA5\\uFCA6\\uFCA7\\uFCA8\\uFCA9\\uFCAA\\uFCAB\\uFCAC\\uFCAD\\uFCAE\\uFCAF\\uFCB0\\uFCB1\\uFCB2\\uFCB3\\uFCB4\\uFCB5\\uFCB6\\uFCB7\\uFCB8\\uFCB9\\uFCBA\\uFCBB\\uFCBC\\uFCBD\\uFCBE\\uFCBF\\uFCC0\\uFCC1\\uFCC2\\uFCC3\\uFCC4\\uFCC5\\uFCC6\\uFCC7\\uFCC8\\uFCC9\\uFCCA\\uFCCB\\uFCCC\\uFCCD\\uFCCE\\uFCCF\\uFCD0\\uFCD1\\uFCD2\\uFCD3\\uFCD4\\uFCD5\\uFCD6\\uFCD7\\uFCD8\\uFCD9\\uFCDA\\uFCDB\\uFCDC\\uFCDD\\uFCDE\\uFCDF\\uFCE0\\uFCE1\\uFCE2\\uFCE3\\uFCE4\\uFCE5\\uFCE6\\uFCE7\\uFCE8\\uFCE9\\uFCEA\\uFCEB\\uFCEC\\uFCED\\uFCEE\\uFCEF\\uFCF0\\uFCF1\\uFCF2\\uFCF3\\uFCF4\\uFCF5\\uFCF6\\uFCF7\\uFCF8\\uFCF9\\uFCFA\\uFCFB\\uFCFC\\uFCFD\\uFCFE\\uFCFF\\uFD00\\uFD01\\uFD02\\uFD03\\uFD04\\uFD05\\uFD06\\uFD07\\uFD08\\uFD09\\uFD0A\\uFD0B\\uFD0C\\uFD0D\\uFD0E\\uFD0F\\uFD10\\uFD11\\uFD12\\uFD13\\uFD14\\uFD15\\uFD16\\uFD17\\uFD18\\uFD19\\uFD1A\\uFD1B\\uFD1C\\uFD1D\\uFD1E\\uFD1F\\uFD20\\uFD21\\uFD22\\uFD23\\uFD24\\uFD25\\uFD26\\uFD27\\uFD28\\uFD29\\uFD2A\\uFD2B\\uFD2C\\uFD2D\\uFD2E\\uFD2F\\uFD30\\uFD31\\uFD32\\uFD33\\uFD34\\uFD35\\uFD36\\uFD37\\uFD38\\uFD39\\uFD3A\\uFD3B\\uFD3C\\uFD3D\\uFD50\\uFD51\\uFD52\\uFD53\\uFD54\\uFD55\\uFD56\\uFD57\\uFD58\\uFD59\\uFD5A\\uFD5B\\uFD5C\\uFD5D\\uFD5E\\uFD5F\\uFD60\\uFD61\\uFD62\\uFD63\\uFD64\\uFD65\\uFD66\\uFD67\\uFD68\\uFD69\\uFD6A\\uFD6B\\uFD6C\\uFD6D\\uFD6E\\uFD6F\\uFD70\\uFD71\\uFD72\\uFD73\\uFD74\\uFD75\\uFD76\\uFD77\\uFD78\\uFD79\\uFD7A\\uFD7B\\uFD7C\\uFD7D\\uFD7E\\uFD7F\\uFD80\\uFD81\\uFD82\\uFD83\\uFD84\\uFD85\\uFD86\\uFD87\\uFD88\\uFD89\\uFD8A\\uFD8B\\uFD8C\\uFD8D\\uFD8E\\uFD8F\\uFD92\\uFD93\\uFD94\\uFD95\\uFD96\\uFD97\\uFD98\\uFD99\\uFD9A\\uFD9B\\uFD9C\\uFD9D\\uFD9E\\uFD9F\\uFDA0\\uFDA1\\uFDA2\\uFDA3\\uFDA4\\uFDA5\\uFDA6\\uFDA7\\uFDA8\\uFDA9\\uFDAA\\uFDAB\\uFDAC\\uFDAD\\uFDAE\\uFDAF\\uFDB0\\uFDB1\\uFDB2\\uFDB3\\uFDB4\\uFDB5\\uFDB6\\uFDB7\\uFDB8\\uFDB9\\uFDBA\\uFDBB\\uFDBC\\uFDBD\\uFDBE\\uFDBF\\uFDC0\\uFDC1\\uFDC2\\uFDC3\\uFDC4\\uFDC5\\uFDC6\\uFDC7\\uFDF0\\uFDF1\\uFDF2\\uFDF3\\uFDF4\\uFDF5\\uFDF6\\uFDF7\\uFDF8\\uFDF9\\uFDFA\\uFDFB\\uFE70\\uFE71\\uFE72\\uFE73\\uFE74\\uFE76\\uFE77\\uFE78\\uFE79\\uFE7A\\uFE7B\\uFE7C\\uFE7D\\uFE7E\\uFE7F\\uFE80\\uFE81\\uFE82\\uFE83\\uFE84\\uFE85\\uFE86\\uFE87\\uFE88\\uFE89\\uFE8A\\uFE8B\\uFE8C\\uFE8D\\uFE8E\\uFE8F\\uFE90\\uFE91\\uFE92\\uFE93\\uFE94\\uFE95\\uFE96\\uFE97\\uFE98\\uFE99\\uFE9A\\uFE9B\\uFE9C\\uFE9D\\uFE9E\\uFE9F\\uFEA0\\uFEA1\\uFEA2\\uFEA3\\uFEA4\\uFEA5\\uFEA6\\uFEA7\\uFEA8\\uFEA9\\uFEAA\\uFEAB\\uFEAC\\uFEAD\\uFEAE\\uFEAF\\uFEB0\\uFEB1\\uFEB2\\uFEB3\\uFEB4\\uFEB5\\uFEB6\\uFEB7\\uFEB8\\uFEB9\\uFEBA\\uFEBB\\uFEBC\\uFEBD\\uFEBE\\uFEBF\\uFEC0\\uFEC1\\uFEC2\\uFEC3\\uFEC4\\uFEC5\\uFEC6\\uFEC7\\uFEC8\\uFEC9\\uFECA\\uFECB\\uFECC\\uFECD\\uFECE\\uFECF\\uFED0\\uFED1\\uFED2\\uFED3\\uFED4\\uFED5\\uFED6\\uFED7\\uFED8\\uFED9\\uFEDA\\uFEDB\\uFEDC\\uFEDD\\uFEDE\\uFEDF\\uFEE0\\uFEE1\\uFEE2\\uFEE3\\uFEE4\\uFEE5\\uFEE6\\uFEE7\\uFEE8\\uFEE9\\uFEEA\\uFEEB\\uFEEC\\uFEED\\uFEEE\\uFEEF\\uFEF0\\uFEF1\\uFEF2\\uFEF3\\uFEF4\\uFEF5\\uFEF6\\uFEF7\\uFEF8\\uFEF9\\uFEFA\\uFEFB\\uFEFC\\uFF66\\uFF67\\uFF68\\uFF69\\uFF6A\\uFF6B\\uFF6C\\uFF6D\\uFF6E\\uFF6F\\uFF71\\uFF72\\uFF73\\uFF74\\uFF75\\uFF76\\uFF77\\uFF78\\uFF79\\uFF7A\\uFF7B\\uFF7C\\uFF7D\\uFF7E\\uFF7F\\uFF80\\uFF81\\uFF82\\uFF83\\uFF84\\uFF85\\uFF86\\uFF87\\uFF88\\uFF89\\uFF8A\\uFF8B\\uFF8C\\uFF8D\\uFF8E\\uFF8F\\uFF90\\uFF91\\uFF92\\uFF93\\uFF94\\uFF95\\uFF96\\uFF97\\uFF98\\uFF99\\uFF9A\\uFF9B\\uFF9C\\uFF9D\\uFFA0\\uFFA1\\uFFA2\\uFFA3\\uFFA4\\uFFA5\\uFFA6\\uFFA7\\uFFA8\\uFFA9\\uFFAA\\uFFAB\\uFFAC\\uFFAD\\uFFAE\\uFFAF\\uFFB0\\uFFB1\\uFFB2\\uFFB3\\uFFB4\\uFFB5\\uFFB6\\uFFB7\\uFFB8\\uFFB9\\uFFBA\\uFFBB\\uFFBC\\uFFBD\\uFFBE\\uFFC2\\uFFC3\\uFFC4\\uFFC5\\uFFC6\\uFFC7\\uFFCA\\uFFCB\\uFFCC\\uFFCD\\uFFCE\\uFFCF\\uFFD2\\uFFD3\\uFFD4\\uFFD5\\uFFD6\\uFFD7\\uFFDA\\uFFDB\\uFFDC]");
          }
        }
        return result0;
      }
      
      function parse_Lt() {
        var result0;
        
        if (/^[\u01C5\u01C8\u01CB\u01F2\u1F88\u1F89\u1F8A\u1F8B\u1F8C\u1F8D\u1F8E\u1F8F\u1F98\u1F99\u1F9A\u1F9B\u1F9C\u1F9D\u1F9E\u1F9F\u1FA8\u1FA9\u1FAA\u1FAB\u1FAC\u1FAD\u1FAE\u1FAF\u1FBC\u1FCC\u1FFC]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[\\u01C5\\u01C8\\u01CB\\u01F2\\u1F88\\u1F89\\u1F8A\\u1F8B\\u1F8C\\u1F8D\\u1F8E\\u1F8F\\u1F98\\u1F99\\u1F9A\\u1F9B\\u1F9C\\u1F9D\\u1F9E\\u1F9F\\u1FA8\\u1FA9\\u1FAA\\u1FAB\\u1FAC\\u1FAD\\u1FAE\\u1FAF\\u1FBC\\u1FCC\\u1FFC]");
          }
        }
        return result0;
      }
      
      function parse_Lu() {
        var result0;
        
        if (/^[ABCDEFGHIJKLMNOPQRSTUVWXYZ\xC0\xC1\xC2\xC3\xC4\xC5\xC6\xC7\xC8\xC9\xCA\xCB\xCC\xCD\xCE\xCF\xD0\xD1\xD2\xD3\xD4\xD5\xD6\xD8\xD9\xDA\xDB\xDC\xDD\xDE\u0100\u0102\u0104\u0106\u0108\u010A\u010C\u010E\u0110\u0112\u0114\u0116\u0118\u011A\u011C\u011E\u0120\u0122\u0124\u0126\u0128\u012A\u012C\u012E\u0130\u0132\u0134\u0136\u0139\u013B\u013D\u013F\u0141\u0143\u0145\u0147\u014A\u014C\u014E\u0150\u0152\u0154\u0156\u0158\u015A\u015C\u015E\u0160\u0162\u0164\u0166\u0168\u016A\u016C\u016E\u0170\u0172\u0174\u0176\u0178\u0179\u017B\u017D\u0181\u0182\u0184\u0186\u0187\u0189\u018A\u018B\u018E\u018F\u0190\u0191\u0193\u0194\u0196\u0197\u0198\u019C\u019D\u019F\u01A0\u01A2\u01A4\u01A6\u01A7\u01A9\u01AC\u01AE\u01AF\u01B1\u01B2\u01B3\u01B5\u01B7\u01B8\u01BC\u01C4\u01C7\u01CA\u01CD\u01CF\u01D1\u01D3\u01D5\u01D7\u01D9\u01DB\u01DE\u01E0\u01E2\u01E4\u01E6\u01E8\u01EA\u01EC\u01EE\u01F1\u01F4\u01F6\u01F7\u01F8\u01FA\u01FC\u01FE\u0200\u0202\u0204\u0206\u0208\u020A\u020C\u020E\u0210\u0212\u0214\u0216\u0218\u021A\u021C\u021E\u0220\u0222\u0224\u0226\u0228\u022A\u022C\u022E\u0230\u0232\u023A\u023B\u023D\u023E\u0241\u0243\u0244\u0245\u0246\u0248\u024A\u024C\u024E\u0370\u0372\u0376\u0386\u0388\u0389\u038A\u038C\u038E\u038F\u0391\u0392\u0393\u0394\u0395\u0396\u0397\u0398\u0399\u039A\u039B\u039C\u039D\u039E\u039F\u03A0\u03A1\u03A3\u03A4\u03A5\u03A6\u03A7\u03A8\u03A9\u03AA\u03AB\u03CF\u03D2\u03D3\u03D4\u03D8\u03DA\u03DC\u03DE\u03E0\u03E2\u03E4\u03E6\u03E8\u03EA\u03EC\u03EE\u03F4\u03F7\u03F9\u03FA\u03FD\u03FE\u03FF\u0400\u0401\u0402\u0403\u0404\u0405\u0406\u0407\u0408\u0409\u040A\u040B\u040C\u040D\u040E\u040F\u0410\u0411\u0412\u0413\u0414\u0415\u0416\u0417\u0418\u0419\u041A\u041B\u041C\u041D\u041E\u041F\u0420\u0421\u0422\u0423\u0424\u0425\u0426\u0427\u0428\u0429\u042A\u042B\u042C\u042D\u042E\u042F\u0460\u0462\u0464\u0466\u0468\u046A\u046C\u046E\u0470\u0472\u0474\u0476\u0478\u047A\u047C\u047E\u0480\u048A\u048C\u048E\u0490\u0492\u0494\u0496\u0498\u049A\u049C\u049E\u04A0\u04A2\u04A4\u04A6\u04A8\u04AA\u04AC\u04AE\u04B0\u04B2\u04B4\u04B6\u04B8\u04BA\u04BC\u04BE\u04C0\u04C1\u04C3\u04C5\u04C7\u04C9\u04CB\u04CD\u04D0\u04D2\u04D4\u04D6\u04D8\u04DA\u04DC\u04DE\u04E0\u04E2\u04E4\u04E6\u04E8\u04EA\u04EC\u04EE\u04F0\u04F2\u04F4\u04F6\u04F8\u04FA\u04FC\u04FE\u0500\u0502\u0504\u0506\u0508\u050A\u050C\u050E\u0510\u0512\u0514\u0516\u0518\u051A\u051C\u051E\u0520\u0522\u0531\u0532\u0533\u0534\u0535\u0536\u0537\u0538\u0539\u053A\u053B\u053C\u053D\u053E\u053F\u0540\u0541\u0542\u0543\u0544\u0545\u0546\u0547\u0548\u0549\u054A\u054B\u054C\u054D\u054E\u054F\u0550\u0551\u0552\u0553\u0554\u0555\u0556\u10A0\u10A1\u10A2\u10A3\u10A4\u10A5\u10A6\u10A7\u10A8\u10A9\u10AA\u10AB\u10AC\u10AD\u10AE\u10AF\u10B0\u10B1\u10B2\u10B3\u10B4\u10B5\u10B6\u10B7\u10B8\u10B9\u10BA\u10BB\u10BC\u10BD\u10BE\u10BF\u10C0\u10C1\u10C2\u10C3\u10C4\u10C5\u1E00\u1E02\u1E04\u1E06\u1E08\u1E0A\u1E0C\u1E0E\u1E10\u1E12\u1E14\u1E16\u1E18\u1E1A\u1E1C\u1E1E\u1E20\u1E22\u1E24\u1E26\u1E28\u1E2A\u1E2C\u1E2E\u1E30\u1E32\u1E34\u1E36\u1E38\u1E3A\u1E3C\u1E3E\u1E40\u1E42\u1E44\u1E46\u1E48\u1E4A\u1E4C\u1E4E\u1E50\u1E52\u1E54\u1E56\u1E58\u1E5A\u1E5C\u1E5E\u1E60\u1E62\u1E64\u1E66\u1E68\u1E6A\u1E6C\u1E6E\u1E70\u1E72\u1E74\u1E76\u1E78\u1E7A\u1E7C\u1E7E\u1E80\u1E82\u1E84\u1E86\u1E88\u1E8A\u1E8C\u1E8E\u1E90\u1E92\u1E94\u1E9E\u1EA0\u1EA2\u1EA4\u1EA6\u1EA8\u1EAA\u1EAC\u1EAE\u1EB0\u1EB2\u1EB4\u1EB6\u1EB8\u1EBA\u1EBC\u1EBE\u1EC0\u1EC2\u1EC4\u1EC6\u1EC8\u1ECA\u1ECC\u1ECE\u1ED0\u1ED2\u1ED4\u1ED6\u1ED8\u1EDA\u1EDC\u1EDE\u1EE0\u1EE2\u1EE4\u1EE6\u1EE8\u1EEA\u1EEC\u1EEE\u1EF0\u1EF2\u1EF4\u1EF6\u1EF8\u1EFA\u1EFC\u1EFE\u1F08\u1F09\u1F0A\u1F0B\u1F0C\u1F0D\u1F0E\u1F0F\u1F18\u1F19\u1F1A\u1F1B\u1F1C\u1F1D\u1F28\u1F29\u1F2A\u1F2B\u1F2C\u1F2D\u1F2E\u1F2F\u1F38\u1F39\u1F3A\u1F3B\u1F3C\u1F3D\u1F3E\u1F3F\u1F48\u1F49\u1F4A\u1F4B\u1F4C\u1F4D\u1F59\u1F5B\u1F5D\u1F5F\u1F68\u1F69\u1F6A\u1F6B\u1F6C\u1F6D\u1F6E\u1F6F\u1FB8\u1FB9\u1FBA\u1FBB\u1FC8\u1FC9\u1FCA\u1FCB\u1FD8\u1FD9\u1FDA\u1FDB\u1FE8\u1FE9\u1FEA\u1FEB\u1FEC\u1FF8\u1FF9\u1FFA\u1FFB\u2102\u2107\u210B\u210C\u210D\u2110\u2111\u2112\u2115\u2119\u211A\u211B\u211C\u211D\u2124\u2126\u2128\u212A\u212B\u212C\u212D\u2130\u2131\u2132\u2133\u213E\u213F\u2145\u2183\u2C00\u2C01\u2C02\u2C03\u2C04\u2C05\u2C06\u2C07\u2C08\u2C09\u2C0A\u2C0B\u2C0C\u2C0D\u2C0E\u2C0F\u2C10\u2C11\u2C12\u2C13\u2C14\u2C15\u2C16\u2C17\u2C18\u2C19\u2C1A\u2C1B\u2C1C\u2C1D\u2C1E\u2C1F\u2C20\u2C21\u2C22\u2C23\u2C24\u2C25\u2C26\u2C27\u2C28\u2C29\u2C2A\u2C2B\u2C2C\u2C2D\u2C2E\u2C60\u2C62\u2C63\u2C64\u2C67\u2C69\u2C6B\u2C6D\u2C6E\u2C6F\u2C72\u2C75\u2C80\u2C82\u2C84\u2C86\u2C88\u2C8A\u2C8C\u2C8E\u2C90\u2C92\u2C94\u2C96\u2C98\u2C9A\u2C9C\u2C9E\u2CA0\u2CA2\u2CA4\u2CA6\u2CA8\u2CAA\u2CAC\u2CAE\u2CB0\u2CB2\u2CB4\u2CB6\u2CB8\u2CBA\u2CBC\u2CBE\u2CC0\u2CC2\u2CC4\u2CC6\u2CC8\u2CCA\u2CCC\u2CCE\u2CD0\u2CD2\u2CD4\u2CD6\u2CD8\u2CDA\u2CDC\u2CDE\u2CE0\u2CE2\uA640\uA642\uA644\uA646\uA648\uA64A\uA64C\uA64E\uA650\uA652\uA654\uA656\uA658\uA65A\uA65C\uA65E\uA662\uA664\uA666\uA668\uA66A\uA66C\uA680\uA682\uA684\uA686\uA688\uA68A\uA68C\uA68E\uA690\uA692\uA694\uA696\uA722\uA724\uA726\uA728\uA72A\uA72C\uA72E\uA732\uA734\uA736\uA738\uA73A\uA73C\uA73E\uA740\uA742\uA744\uA746\uA748\uA74A\uA74C\uA74E\uA750\uA752\uA754\uA756\uA758\uA75A\uA75C\uA75E\uA760\uA762\uA764\uA766\uA768\uA76A\uA76C\uA76E\uA779\uA77B\uA77D\uA77E\uA780\uA782\uA784\uA786\uA78B\uFF21\uFF22\uFF23\uFF24\uFF25\uFF26\uFF27\uFF28\uFF29\uFF2A\uFF2B\uFF2C\uFF2D\uFF2E\uFF2F\uFF30\uFF31\uFF32\uFF33\uFF34\uFF35\uFF36\uFF37\uFF38\uFF39\uFF3A]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[ABCDEFGHIJKLMNOPQRSTUVWXYZ\\xC0\\xC1\\xC2\\xC3\\xC4\\xC5\\xC6\\xC7\\xC8\\xC9\\xCA\\xCB\\xCC\\xCD\\xCE\\xCF\\xD0\\xD1\\xD2\\xD3\\xD4\\xD5\\xD6\\xD8\\xD9\\xDA\\xDB\\xDC\\xDD\\xDE\\u0100\\u0102\\u0104\\u0106\\u0108\\u010A\\u010C\\u010E\\u0110\\u0112\\u0114\\u0116\\u0118\\u011A\\u011C\\u011E\\u0120\\u0122\\u0124\\u0126\\u0128\\u012A\\u012C\\u012E\\u0130\\u0132\\u0134\\u0136\\u0139\\u013B\\u013D\\u013F\\u0141\\u0143\\u0145\\u0147\\u014A\\u014C\\u014E\\u0150\\u0152\\u0154\\u0156\\u0158\\u015A\\u015C\\u015E\\u0160\\u0162\\u0164\\u0166\\u0168\\u016A\\u016C\\u016E\\u0170\\u0172\\u0174\\u0176\\u0178\\u0179\\u017B\\u017D\\u0181\\u0182\\u0184\\u0186\\u0187\\u0189\\u018A\\u018B\\u018E\\u018F\\u0190\\u0191\\u0193\\u0194\\u0196\\u0197\\u0198\\u019C\\u019D\\u019F\\u01A0\\u01A2\\u01A4\\u01A6\\u01A7\\u01A9\\u01AC\\u01AE\\u01AF\\u01B1\\u01B2\\u01B3\\u01B5\\u01B7\\u01B8\\u01BC\\u01C4\\u01C7\\u01CA\\u01CD\\u01CF\\u01D1\\u01D3\\u01D5\\u01D7\\u01D9\\u01DB\\u01DE\\u01E0\\u01E2\\u01E4\\u01E6\\u01E8\\u01EA\\u01EC\\u01EE\\u01F1\\u01F4\\u01F6\\u01F7\\u01F8\\u01FA\\u01FC\\u01FE\\u0200\\u0202\\u0204\\u0206\\u0208\\u020A\\u020C\\u020E\\u0210\\u0212\\u0214\\u0216\\u0218\\u021A\\u021C\\u021E\\u0220\\u0222\\u0224\\u0226\\u0228\\u022A\\u022C\\u022E\\u0230\\u0232\\u023A\\u023B\\u023D\\u023E\\u0241\\u0243\\u0244\\u0245\\u0246\\u0248\\u024A\\u024C\\u024E\\u0370\\u0372\\u0376\\u0386\\u0388\\u0389\\u038A\\u038C\\u038E\\u038F\\u0391\\u0392\\u0393\\u0394\\u0395\\u0396\\u0397\\u0398\\u0399\\u039A\\u039B\\u039C\\u039D\\u039E\\u039F\\u03A0\\u03A1\\u03A3\\u03A4\\u03A5\\u03A6\\u03A7\\u03A8\\u03A9\\u03AA\\u03AB\\u03CF\\u03D2\\u03D3\\u03D4\\u03D8\\u03DA\\u03DC\\u03DE\\u03E0\\u03E2\\u03E4\\u03E6\\u03E8\\u03EA\\u03EC\\u03EE\\u03F4\\u03F7\\u03F9\\u03FA\\u03FD\\u03FE\\u03FF\\u0400\\u0401\\u0402\\u0403\\u0404\\u0405\\u0406\\u0407\\u0408\\u0409\\u040A\\u040B\\u040C\\u040D\\u040E\\u040F\\u0410\\u0411\\u0412\\u0413\\u0414\\u0415\\u0416\\u0417\\u0418\\u0419\\u041A\\u041B\\u041C\\u041D\\u041E\\u041F\\u0420\\u0421\\u0422\\u0423\\u0424\\u0425\\u0426\\u0427\\u0428\\u0429\\u042A\\u042B\\u042C\\u042D\\u042E\\u042F\\u0460\\u0462\\u0464\\u0466\\u0468\\u046A\\u046C\\u046E\\u0470\\u0472\\u0474\\u0476\\u0478\\u047A\\u047C\\u047E\\u0480\\u048A\\u048C\\u048E\\u0490\\u0492\\u0494\\u0496\\u0498\\u049A\\u049C\\u049E\\u04A0\\u04A2\\u04A4\\u04A6\\u04A8\\u04AA\\u04AC\\u04AE\\u04B0\\u04B2\\u04B4\\u04B6\\u04B8\\u04BA\\u04BC\\u04BE\\u04C0\\u04C1\\u04C3\\u04C5\\u04C7\\u04C9\\u04CB\\u04CD\\u04D0\\u04D2\\u04D4\\u04D6\\u04D8\\u04DA\\u04DC\\u04DE\\u04E0\\u04E2\\u04E4\\u04E6\\u04E8\\u04EA\\u04EC\\u04EE\\u04F0\\u04F2\\u04F4\\u04F6\\u04F8\\u04FA\\u04FC\\u04FE\\u0500\\u0502\\u0504\\u0506\\u0508\\u050A\\u050C\\u050E\\u0510\\u0512\\u0514\\u0516\\u0518\\u051A\\u051C\\u051E\\u0520\\u0522\\u0531\\u0532\\u0533\\u0534\\u0535\\u0536\\u0537\\u0538\\u0539\\u053A\\u053B\\u053C\\u053D\\u053E\\u053F\\u0540\\u0541\\u0542\\u0543\\u0544\\u0545\\u0546\\u0547\\u0548\\u0549\\u054A\\u054B\\u054C\\u054D\\u054E\\u054F\\u0550\\u0551\\u0552\\u0553\\u0554\\u0555\\u0556\\u10A0\\u10A1\\u10A2\\u10A3\\u10A4\\u10A5\\u10A6\\u10A7\\u10A8\\u10A9\\u10AA\\u10AB\\u10AC\\u10AD\\u10AE\\u10AF\\u10B0\\u10B1\\u10B2\\u10B3\\u10B4\\u10B5\\u10B6\\u10B7\\u10B8\\u10B9\\u10BA\\u10BB\\u10BC\\u10BD\\u10BE\\u10BF\\u10C0\\u10C1\\u10C2\\u10C3\\u10C4\\u10C5\\u1E00\\u1E02\\u1E04\\u1E06\\u1E08\\u1E0A\\u1E0C\\u1E0E\\u1E10\\u1E12\\u1E14\\u1E16\\u1E18\\u1E1A\\u1E1C\\u1E1E\\u1E20\\u1E22\\u1E24\\u1E26\\u1E28\\u1E2A\\u1E2C\\u1E2E\\u1E30\\u1E32\\u1E34\\u1E36\\u1E38\\u1E3A\\u1E3C\\u1E3E\\u1E40\\u1E42\\u1E44\\u1E46\\u1E48\\u1E4A\\u1E4C\\u1E4E\\u1E50\\u1E52\\u1E54\\u1E56\\u1E58\\u1E5A\\u1E5C\\u1E5E\\u1E60\\u1E62\\u1E64\\u1E66\\u1E68\\u1E6A\\u1E6C\\u1E6E\\u1E70\\u1E72\\u1E74\\u1E76\\u1E78\\u1E7A\\u1E7C\\u1E7E\\u1E80\\u1E82\\u1E84\\u1E86\\u1E88\\u1E8A\\u1E8C\\u1E8E\\u1E90\\u1E92\\u1E94\\u1E9E\\u1EA0\\u1EA2\\u1EA4\\u1EA6\\u1EA8\\u1EAA\\u1EAC\\u1EAE\\u1EB0\\u1EB2\\u1EB4\\u1EB6\\u1EB8\\u1EBA\\u1EBC\\u1EBE\\u1EC0\\u1EC2\\u1EC4\\u1EC6\\u1EC8\\u1ECA\\u1ECC\\u1ECE\\u1ED0\\u1ED2\\u1ED4\\u1ED6\\u1ED8\\u1EDA\\u1EDC\\u1EDE\\u1EE0\\u1EE2\\u1EE4\\u1EE6\\u1EE8\\u1EEA\\u1EEC\\u1EEE\\u1EF0\\u1EF2\\u1EF4\\u1EF6\\u1EF8\\u1EFA\\u1EFC\\u1EFE\\u1F08\\u1F09\\u1F0A\\u1F0B\\u1F0C\\u1F0D\\u1F0E\\u1F0F\\u1F18\\u1F19\\u1F1A\\u1F1B\\u1F1C\\u1F1D\\u1F28\\u1F29\\u1F2A\\u1F2B\\u1F2C\\u1F2D\\u1F2E\\u1F2F\\u1F38\\u1F39\\u1F3A\\u1F3B\\u1F3C\\u1F3D\\u1F3E\\u1F3F\\u1F48\\u1F49\\u1F4A\\u1F4B\\u1F4C\\u1F4D\\u1F59\\u1F5B\\u1F5D\\u1F5F\\u1F68\\u1F69\\u1F6A\\u1F6B\\u1F6C\\u1F6D\\u1F6E\\u1F6F\\u1FB8\\u1FB9\\u1FBA\\u1FBB\\u1FC8\\u1FC9\\u1FCA\\u1FCB\\u1FD8\\u1FD9\\u1FDA\\u1FDB\\u1FE8\\u1FE9\\u1FEA\\u1FEB\\u1FEC\\u1FF8\\u1FF9\\u1FFA\\u1FFB\\u2102\\u2107\\u210B\\u210C\\u210D\\u2110\\u2111\\u2112\\u2115\\u2119\\u211A\\u211B\\u211C\\u211D\\u2124\\u2126\\u2128\\u212A\\u212B\\u212C\\u212D\\u2130\\u2131\\u2132\\u2133\\u213E\\u213F\\u2145\\u2183\\u2C00\\u2C01\\u2C02\\u2C03\\u2C04\\u2C05\\u2C06\\u2C07\\u2C08\\u2C09\\u2C0A\\u2C0B\\u2C0C\\u2C0D\\u2C0E\\u2C0F\\u2C10\\u2C11\\u2C12\\u2C13\\u2C14\\u2C15\\u2C16\\u2C17\\u2C18\\u2C19\\u2C1A\\u2C1B\\u2C1C\\u2C1D\\u2C1E\\u2C1F\\u2C20\\u2C21\\u2C22\\u2C23\\u2C24\\u2C25\\u2C26\\u2C27\\u2C28\\u2C29\\u2C2A\\u2C2B\\u2C2C\\u2C2D\\u2C2E\\u2C60\\u2C62\\u2C63\\u2C64\\u2C67\\u2C69\\u2C6B\\u2C6D\\u2C6E\\u2C6F\\u2C72\\u2C75\\u2C80\\u2C82\\u2C84\\u2C86\\u2C88\\u2C8A\\u2C8C\\u2C8E\\u2C90\\u2C92\\u2C94\\u2C96\\u2C98\\u2C9A\\u2C9C\\u2C9E\\u2CA0\\u2CA2\\u2CA4\\u2CA6\\u2CA8\\u2CAA\\u2CAC\\u2CAE\\u2CB0\\u2CB2\\u2CB4\\u2CB6\\u2CB8\\u2CBA\\u2CBC\\u2CBE\\u2CC0\\u2CC2\\u2CC4\\u2CC6\\u2CC8\\u2CCA\\u2CCC\\u2CCE\\u2CD0\\u2CD2\\u2CD4\\u2CD6\\u2CD8\\u2CDA\\u2CDC\\u2CDE\\u2CE0\\u2CE2\\uA640\\uA642\\uA644\\uA646\\uA648\\uA64A\\uA64C\\uA64E\\uA650\\uA652\\uA654\\uA656\\uA658\\uA65A\\uA65C\\uA65E\\uA662\\uA664\\uA666\\uA668\\uA66A\\uA66C\\uA680\\uA682\\uA684\\uA686\\uA688\\uA68A\\uA68C\\uA68E\\uA690\\uA692\\uA694\\uA696\\uA722\\uA724\\uA726\\uA728\\uA72A\\uA72C\\uA72E\\uA732\\uA734\\uA736\\uA738\\uA73A\\uA73C\\uA73E\\uA740\\uA742\\uA744\\uA746\\uA748\\uA74A\\uA74C\\uA74E\\uA750\\uA752\\uA754\\uA756\\uA758\\uA75A\\uA75C\\uA75E\\uA760\\uA762\\uA764\\uA766\\uA768\\uA76A\\uA76C\\uA76E\\uA779\\uA77B\\uA77D\\uA77E\\uA780\\uA782\\uA784\\uA786\\uA78B\\uFF21\\uFF22\\uFF23\\uFF24\\uFF25\\uFF26\\uFF27\\uFF28\\uFF29\\uFF2A\\uFF2B\\uFF2C\\uFF2D\\uFF2E\\uFF2F\\uFF30\\uFF31\\uFF32\\uFF33\\uFF34\\uFF35\\uFF36\\uFF37\\uFF38\\uFF39\\uFF3A]");
          }
        }
        return result0;
      }
      
      function parse_Mc() {
        var result0;
        
        if (/^[\u0903\u093E\u093F\u0940\u0949\u094A\u094B\u094C\u0982\u0983\u09BE\u09BF\u09C0\u09C7\u09C8\u09CB\u09CC\u09D7\u0A03\u0A3E\u0A3F\u0A40\u0A83\u0ABE\u0ABF\u0AC0\u0AC9\u0ACB\u0ACC\u0B02\u0B03\u0B3E\u0B40\u0B47\u0B48\u0B4B\u0B4C\u0B57\u0BBE\u0BBF\u0BC1\u0BC2\u0BC6\u0BC7\u0BC8\u0BCA\u0BCB\u0BCC\u0BD7\u0C01\u0C02\u0C03\u0C41\u0C42\u0C43\u0C44\u0C82\u0C83\u0CBE\u0CC0\u0CC1\u0CC2\u0CC3\u0CC4\u0CC7\u0CC8\u0CCA\u0CCB\u0CD5\u0CD6\u0D02\u0D03\u0D3E\u0D3F\u0D40\u0D46\u0D47\u0D48\u0D4A\u0D4B\u0D4C\u0D57\u0D82\u0D83\u0DCF\u0DD0\u0DD1\u0DD8\u0DD9\u0DDA\u0DDB\u0DDC\u0DDD\u0DDE\u0DDF\u0DF2\u0DF3\u0F3E\u0F3F\u0F7F\u102B\u102C\u1031\u1038\u103B\u103C\u1056\u1057\u1062\u1063\u1064\u1067\u1068\u1069\u106A\u106B\u106C\u106D\u1083\u1084\u1087\u1088\u1089\u108A\u108B\u108C\u108F\u17B6\u17BE\u17BF\u17C0\u17C1\u17C2\u17C3\u17C4\u17C5\u17C7\u17C8\u1923\u1924\u1925\u1926\u1929\u192A\u192B\u1930\u1931\u1933\u1934\u1935\u1936\u1937\u1938\u19B0\u19B1\u19B2\u19B3\u19B4\u19B5\u19B6\u19B7\u19B8\u19B9\u19BA\u19BB\u19BC\u19BD\u19BE\u19BF\u19C0\u19C8\u19C9\u1A19\u1A1A\u1A1B\u1B04\u1B35\u1B3B\u1B3D\u1B3E\u1B3F\u1B40\u1B41\u1B43\u1B44\u1B82\u1BA1\u1BA6\u1BA7\u1BAA\u1C24\u1C25\u1C26\u1C27\u1C28\u1C29\u1C2A\u1C2B\u1C34\u1C35\uA823\uA824\uA827\uA880\uA881\uA8B4\uA8B5\uA8B6\uA8B7\uA8B8\uA8B9\uA8BA\uA8BB\uA8BC\uA8BD\uA8BE\uA8BF\uA8C0\uA8C1\uA8C2\uA8C3\uA952\uA953\uAA2F\uAA30\uAA33\uAA34\uAA4D]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[\\u0903\\u093E\\u093F\\u0940\\u0949\\u094A\\u094B\\u094C\\u0982\\u0983\\u09BE\\u09BF\\u09C0\\u09C7\\u09C8\\u09CB\\u09CC\\u09D7\\u0A03\\u0A3E\\u0A3F\\u0A40\\u0A83\\u0ABE\\u0ABF\\u0AC0\\u0AC9\\u0ACB\\u0ACC\\u0B02\\u0B03\\u0B3E\\u0B40\\u0B47\\u0B48\\u0B4B\\u0B4C\\u0B57\\u0BBE\\u0BBF\\u0BC1\\u0BC2\\u0BC6\\u0BC7\\u0BC8\\u0BCA\\u0BCB\\u0BCC\\u0BD7\\u0C01\\u0C02\\u0C03\\u0C41\\u0C42\\u0C43\\u0C44\\u0C82\\u0C83\\u0CBE\\u0CC0\\u0CC1\\u0CC2\\u0CC3\\u0CC4\\u0CC7\\u0CC8\\u0CCA\\u0CCB\\u0CD5\\u0CD6\\u0D02\\u0D03\\u0D3E\\u0D3F\\u0D40\\u0D46\\u0D47\\u0D48\\u0D4A\\u0D4B\\u0D4C\\u0D57\\u0D82\\u0D83\\u0DCF\\u0DD0\\u0DD1\\u0DD8\\u0DD9\\u0DDA\\u0DDB\\u0DDC\\u0DDD\\u0DDE\\u0DDF\\u0DF2\\u0DF3\\u0F3E\\u0F3F\\u0F7F\\u102B\\u102C\\u1031\\u1038\\u103B\\u103C\\u1056\\u1057\\u1062\\u1063\\u1064\\u1067\\u1068\\u1069\\u106A\\u106B\\u106C\\u106D\\u1083\\u1084\\u1087\\u1088\\u1089\\u108A\\u108B\\u108C\\u108F\\u17B6\\u17BE\\u17BF\\u17C0\\u17C1\\u17C2\\u17C3\\u17C4\\u17C5\\u17C7\\u17C8\\u1923\\u1924\\u1925\\u1926\\u1929\\u192A\\u192B\\u1930\\u1931\\u1933\\u1934\\u1935\\u1936\\u1937\\u1938\\u19B0\\u19B1\\u19B2\\u19B3\\u19B4\\u19B5\\u19B6\\u19B7\\u19B8\\u19B9\\u19BA\\u19BB\\u19BC\\u19BD\\u19BE\\u19BF\\u19C0\\u19C8\\u19C9\\u1A19\\u1A1A\\u1A1B\\u1B04\\u1B35\\u1B3B\\u1B3D\\u1B3E\\u1B3F\\u1B40\\u1B41\\u1B43\\u1B44\\u1B82\\u1BA1\\u1BA6\\u1BA7\\u1BAA\\u1C24\\u1C25\\u1C26\\u1C27\\u1C28\\u1C29\\u1C2A\\u1C2B\\u1C34\\u1C35\\uA823\\uA824\\uA827\\uA880\\uA881\\uA8B4\\uA8B5\\uA8B6\\uA8B7\\uA8B8\\uA8B9\\uA8BA\\uA8BB\\uA8BC\\uA8BD\\uA8BE\\uA8BF\\uA8C0\\uA8C1\\uA8C2\\uA8C3\\uA952\\uA953\\uAA2F\\uAA30\\uAA33\\uAA34\\uAA4D]");
          }
        }
        return result0;
      }
      
      function parse_Mn() {
        var result0;
        
        if (/^[\u0300\u0301\u0302\u0303\u0304\u0305\u0306\u0307\u0308\u0309\u030A\u030B\u030C\u030D\u030E\u030F\u0310\u0311\u0312\u0313\u0314\u0315\u0316\u0317\u0318\u0319\u031A\u031B\u031C\u031D\u031E\u031F\u0320\u0321\u0322\u0323\u0324\u0325\u0326\u0327\u0328\u0329\u032A\u032B\u032C\u032D\u032E\u032F\u0330\u0331\u0332\u0333\u0334\u0335\u0336\u0337\u0338\u0339\u033A\u033B\u033C\u033D\u033E\u033F\u0340\u0341\u0342\u0343\u0344\u0345\u0346\u0347\u0348\u0349\u034A\u034B\u034C\u034D\u034E\u034F\u0350\u0351\u0352\u0353\u0354\u0355\u0356\u0357\u0358\u0359\u035A\u035B\u035C\u035D\u035E\u035F\u0360\u0361\u0362\u0363\u0364\u0365\u0366\u0367\u0368\u0369\u036A\u036B\u036C\u036D\u036E\u036F\u0483\u0484\u0485\u0486\u0487\u0591\u0592\u0593\u0594\u0595\u0596\u0597\u0598\u0599\u059A\u059B\u059C\u059D\u059E\u059F\u05A0\u05A1\u05A2\u05A3\u05A4\u05A5\u05A6\u05A7\u05A8\u05A9\u05AA\u05AB\u05AC\u05AD\u05AE\u05AF\u05B0\u05B1\u05B2\u05B3\u05B4\u05B5\u05B6\u05B7\u05B8\u05B9\u05BA\u05BB\u05BC\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610\u0611\u0612\u0613\u0614\u0615\u0616\u0617\u0618\u0619\u061A\u064B\u064C\u064D\u064E\u064F\u0650\u0651\u0652\u0653\u0654\u0655\u0656\u0657\u0658\u0659\u065A\u065B\u065C\u065D\u065E\u0670\u06D6\u06D7\u06D8\u06D9\u06DA\u06DB\u06DC\u06DF\u06E0\u06E1\u06E2\u06E3\u06E4\u06E7\u06E8\u06EA\u06EB\u06EC\u06ED\u0711\u0730\u0731\u0732\u0733\u0734\u0735\u0736\u0737\u0738\u0739\u073A\u073B\u073C\u073D\u073E\u073F\u0740\u0741\u0742\u0743\u0744\u0745\u0746\u0747\u0748\u0749\u074A\u07A6\u07A7\u07A8\u07A9\u07AA\u07AB\u07AC\u07AD\u07AE\u07AF\u07B0\u07EB\u07EC\u07ED\u07EE\u07EF\u07F0\u07F1\u07F2\u07F3\u0901\u0902\u093C\u0941\u0942\u0943\u0944\u0945\u0946\u0947\u0948\u094D\u0951\u0952\u0953\u0954\u0962\u0963\u0981\u09BC\u09C1\u09C2\u09C3\u09C4\u09CD\u09E2\u09E3\u0A01\u0A02\u0A3C\u0A41\u0A42\u0A47\u0A48\u0A4B\u0A4C\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81\u0A82\u0ABC\u0AC1\u0AC2\u0AC3\u0AC4\u0AC5\u0AC7\u0AC8\u0ACD\u0AE2\u0AE3\u0B01\u0B3C\u0B3F\u0B41\u0B42\u0B43\u0B44\u0B4D\u0B56\u0B62\u0B63\u0B82\u0BC0\u0BCD\u0C3E\u0C3F\u0C40\u0C46\u0C47\u0C48\u0C4A\u0C4B\u0C4C\u0C4D\u0C55\u0C56\u0C62\u0C63\u0CBC\u0CBF\u0CC6\u0CCC\u0CCD\u0CE2\u0CE3\u0D41\u0D42\u0D43\u0D44\u0D4D\u0D62\u0D63\u0DCA\u0DD2\u0DD3\u0DD4\u0DD6\u0E31\u0E34\u0E35\u0E36\u0E37\u0E38\u0E39\u0E3A\u0E47\u0E48\u0E49\u0E4A\u0E4B\u0E4C\u0E4D\u0E4E\u0EB1\u0EB4\u0EB5\u0EB6\u0EB7\u0EB8\u0EB9\u0EBB\u0EBC\u0EC8\u0EC9\u0ECA\u0ECB\u0ECC\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39\u0F71\u0F72\u0F73\u0F74\u0F75\u0F76\u0F77\u0F78\u0F79\u0F7A\u0F7B\u0F7C\u0F7D\u0F7E\u0F80\u0F81\u0F82\u0F83\u0F84\u0F86\u0F87\u0F90\u0F91\u0F92\u0F93\u0F94\u0F95\u0F96\u0F97\u0F99\u0F9A\u0F9B\u0F9C\u0F9D\u0F9E\u0F9F\u0FA0\u0FA1\u0FA2\u0FA3\u0FA4\u0FA5\u0FA6\u0FA7\u0FA8\u0FA9\u0FAA\u0FAB\u0FAC\u0FAD\u0FAE\u0FAF\u0FB0\u0FB1\u0FB2\u0FB3\u0FB4\u0FB5\u0FB6\u0FB7\u0FB8\u0FB9\u0FBA\u0FBB\u0FBC\u0FC6\u102D\u102E\u102F\u1030\u1032\u1033\u1034\u1035\u1036\u1037\u1039\u103A\u103D\u103E\u1058\u1059\u105E\u105F\u1060\u1071\u1072\u1073\u1074\u1082\u1085\u1086\u108D\u135F\u1712\u1713\u1714\u1732\u1733\u1734\u1752\u1753\u1772\u1773\u17B7\u17B8\u17B9\u17BA\u17BB\u17BC\u17BD\u17C6\u17C9\u17CA\u17CB\u17CC\u17CD\u17CE\u17CF\u17D0\u17D1\u17D2\u17D3\u17DD\u180B\u180C\u180D\u18A9\u1920\u1921\u1922\u1927\u1928\u1932\u1939\u193A\u193B\u1A17\u1A18\u1B00\u1B01\u1B02\u1B03\u1B34\u1B36\u1B37\u1B38\u1B39\u1B3A\u1B3C\u1B42\u1B6B\u1B6C\u1B6D\u1B6E\u1B6F\u1B70\u1B71\u1B72\u1B73\u1B80\u1B81\u1BA2\u1BA3\u1BA4\u1BA5\u1BA8\u1BA9\u1C2C\u1C2D\u1C2E\u1C2F\u1C30\u1C31\u1C32\u1C33\u1C36\u1C37\u1DC0\u1DC1\u1DC2\u1DC3\u1DC4\u1DC5\u1DC6\u1DC7\u1DC8\u1DC9\u1DCA\u1DCB\u1DCC\u1DCD\u1DCE\u1DCF\u1DD0\u1DD1\u1DD2\u1DD3\u1DD4\u1DD5\u1DD6\u1DD7\u1DD8\u1DD9\u1DDA\u1DDB\u1DDC\u1DDD\u1DDE\u1DDF\u1DE0\u1DE1\u1DE2\u1DE3\u1DE4\u1DE5\u1DE6\u1DFE\u1DFF\u20D0\u20D1\u20D2\u20D3\u20D4\u20D5\u20D6\u20D7\u20D8\u20D9\u20DA\u20DB\u20DC\u20E1\u20E5\u20E6\u20E7\u20E8\u20E9\u20EA\u20EB\u20EC\u20ED\u20EE\u20EF\u20F0\u2DE0\u2DE1\u2DE2\u2DE3\u2DE4\u2DE5\u2DE6\u2DE7\u2DE8\u2DE9\u2DEA\u2DEB\u2DEC\u2DED\u2DEE\u2DEF\u2DF0\u2DF1\u2DF2\u2DF3\u2DF4\u2DF5\u2DF6\u2DF7\u2DF8\u2DF9\u2DFA\u2DFB\u2DFC\u2DFD\u2DFE\u2DFF\u302A\u302B\u302C\u302D\u302E\u302F\u3099\u309A\uA66F\uA67C\uA67D\uA802\uA806\uA80B\uA825\uA826\uA8C4\uA926\uA927\uA928\uA929\uA92A\uA92B\uA92C\uA92D\uA947\uA948\uA949\uA94A\uA94B\uA94C\uA94D\uA94E\uA94F\uA950\uA951\uAA29\uAA2A\uAA2B\uAA2C\uAA2D\uAA2E\uAA31\uAA32\uAA35\uAA36\uAA43\uAA4C\uFB1E\uFE00\uFE01\uFE02\uFE03\uFE04\uFE05\uFE06\uFE07\uFE08\uFE09\uFE0A\uFE0B\uFE0C\uFE0D\uFE0E\uFE0F\uFE20\uFE21\uFE22\uFE23\uFE24\uFE25\uFE26]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[\\u0300\\u0301\\u0302\\u0303\\u0304\\u0305\\u0306\\u0307\\u0308\\u0309\\u030A\\u030B\\u030C\\u030D\\u030E\\u030F\\u0310\\u0311\\u0312\\u0313\\u0314\\u0315\\u0316\\u0317\\u0318\\u0319\\u031A\\u031B\\u031C\\u031D\\u031E\\u031F\\u0320\\u0321\\u0322\\u0323\\u0324\\u0325\\u0326\\u0327\\u0328\\u0329\\u032A\\u032B\\u032C\\u032D\\u032E\\u032F\\u0330\\u0331\\u0332\\u0333\\u0334\\u0335\\u0336\\u0337\\u0338\\u0339\\u033A\\u033B\\u033C\\u033D\\u033E\\u033F\\u0340\\u0341\\u0342\\u0343\\u0344\\u0345\\u0346\\u0347\\u0348\\u0349\\u034A\\u034B\\u034C\\u034D\\u034E\\u034F\\u0350\\u0351\\u0352\\u0353\\u0354\\u0355\\u0356\\u0357\\u0358\\u0359\\u035A\\u035B\\u035C\\u035D\\u035E\\u035F\\u0360\\u0361\\u0362\\u0363\\u0364\\u0365\\u0366\\u0367\\u0368\\u0369\\u036A\\u036B\\u036C\\u036D\\u036E\\u036F\\u0483\\u0484\\u0485\\u0486\\u0487\\u0591\\u0592\\u0593\\u0594\\u0595\\u0596\\u0597\\u0598\\u0599\\u059A\\u059B\\u059C\\u059D\\u059E\\u059F\\u05A0\\u05A1\\u05A2\\u05A3\\u05A4\\u05A5\\u05A6\\u05A7\\u05A8\\u05A9\\u05AA\\u05AB\\u05AC\\u05AD\\u05AE\\u05AF\\u05B0\\u05B1\\u05B2\\u05B3\\u05B4\\u05B5\\u05B6\\u05B7\\u05B8\\u05B9\\u05BA\\u05BB\\u05BC\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u0610\\u0611\\u0612\\u0613\\u0614\\u0615\\u0616\\u0617\\u0618\\u0619\\u061A\\u064B\\u064C\\u064D\\u064E\\u064F\\u0650\\u0651\\u0652\\u0653\\u0654\\u0655\\u0656\\u0657\\u0658\\u0659\\u065A\\u065B\\u065C\\u065D\\u065E\\u0670\\u06D6\\u06D7\\u06D8\\u06D9\\u06DA\\u06DB\\u06DC\\u06DF\\u06E0\\u06E1\\u06E2\\u06E3\\u06E4\\u06E7\\u06E8\\u06EA\\u06EB\\u06EC\\u06ED\\u0711\\u0730\\u0731\\u0732\\u0733\\u0734\\u0735\\u0736\\u0737\\u0738\\u0739\\u073A\\u073B\\u073C\\u073D\\u073E\\u073F\\u0740\\u0741\\u0742\\u0743\\u0744\\u0745\\u0746\\u0747\\u0748\\u0749\\u074A\\u07A6\\u07A7\\u07A8\\u07A9\\u07AA\\u07AB\\u07AC\\u07AD\\u07AE\\u07AF\\u07B0\\u07EB\\u07EC\\u07ED\\u07EE\\u07EF\\u07F0\\u07F1\\u07F2\\u07F3\\u0901\\u0902\\u093C\\u0941\\u0942\\u0943\\u0944\\u0945\\u0946\\u0947\\u0948\\u094D\\u0951\\u0952\\u0953\\u0954\\u0962\\u0963\\u0981\\u09BC\\u09C1\\u09C2\\u09C3\\u09C4\\u09CD\\u09E2\\u09E3\\u0A01\\u0A02\\u0A3C\\u0A41\\u0A42\\u0A47\\u0A48\\u0A4B\\u0A4C\\u0A4D\\u0A51\\u0A70\\u0A71\\u0A75\\u0A81\\u0A82\\u0ABC\\u0AC1\\u0AC2\\u0AC3\\u0AC4\\u0AC5\\u0AC7\\u0AC8\\u0ACD\\u0AE2\\u0AE3\\u0B01\\u0B3C\\u0B3F\\u0B41\\u0B42\\u0B43\\u0B44\\u0B4D\\u0B56\\u0B62\\u0B63\\u0B82\\u0BC0\\u0BCD\\u0C3E\\u0C3F\\u0C40\\u0C46\\u0C47\\u0C48\\u0C4A\\u0C4B\\u0C4C\\u0C4D\\u0C55\\u0C56\\u0C62\\u0C63\\u0CBC\\u0CBF\\u0CC6\\u0CCC\\u0CCD\\u0CE2\\u0CE3\\u0D41\\u0D42\\u0D43\\u0D44\\u0D4D\\u0D62\\u0D63\\u0DCA\\u0DD2\\u0DD3\\u0DD4\\u0DD6\\u0E31\\u0E34\\u0E35\\u0E36\\u0E37\\u0E38\\u0E39\\u0E3A\\u0E47\\u0E48\\u0E49\\u0E4A\\u0E4B\\u0E4C\\u0E4D\\u0E4E\\u0EB1\\u0EB4\\u0EB5\\u0EB6\\u0EB7\\u0EB8\\u0EB9\\u0EBB\\u0EBC\\u0EC8\\u0EC9\\u0ECA\\u0ECB\\u0ECC\\u0ECD\\u0F18\\u0F19\\u0F35\\u0F37\\u0F39\\u0F71\\u0F72\\u0F73\\u0F74\\u0F75\\u0F76\\u0F77\\u0F78\\u0F79\\u0F7A\\u0F7B\\u0F7C\\u0F7D\\u0F7E\\u0F80\\u0F81\\u0F82\\u0F83\\u0F84\\u0F86\\u0F87\\u0F90\\u0F91\\u0F92\\u0F93\\u0F94\\u0F95\\u0F96\\u0F97\\u0F99\\u0F9A\\u0F9B\\u0F9C\\u0F9D\\u0F9E\\u0F9F\\u0FA0\\u0FA1\\u0FA2\\u0FA3\\u0FA4\\u0FA5\\u0FA6\\u0FA7\\u0FA8\\u0FA9\\u0FAA\\u0FAB\\u0FAC\\u0FAD\\u0FAE\\u0FAF\\u0FB0\\u0FB1\\u0FB2\\u0FB3\\u0FB4\\u0FB5\\u0FB6\\u0FB7\\u0FB8\\u0FB9\\u0FBA\\u0FBB\\u0FBC\\u0FC6\\u102D\\u102E\\u102F\\u1030\\u1032\\u1033\\u1034\\u1035\\u1036\\u1037\\u1039\\u103A\\u103D\\u103E\\u1058\\u1059\\u105E\\u105F\\u1060\\u1071\\u1072\\u1073\\u1074\\u1082\\u1085\\u1086\\u108D\\u135F\\u1712\\u1713\\u1714\\u1732\\u1733\\u1734\\u1752\\u1753\\u1772\\u1773\\u17B7\\u17B8\\u17B9\\u17BA\\u17BB\\u17BC\\u17BD\\u17C6\\u17C9\\u17CA\\u17CB\\u17CC\\u17CD\\u17CE\\u17CF\\u17D0\\u17D1\\u17D2\\u17D3\\u17DD\\u180B\\u180C\\u180D\\u18A9\\u1920\\u1921\\u1922\\u1927\\u1928\\u1932\\u1939\\u193A\\u193B\\u1A17\\u1A18\\u1B00\\u1B01\\u1B02\\u1B03\\u1B34\\u1B36\\u1B37\\u1B38\\u1B39\\u1B3A\\u1B3C\\u1B42\\u1B6B\\u1B6C\\u1B6D\\u1B6E\\u1B6F\\u1B70\\u1B71\\u1B72\\u1B73\\u1B80\\u1B81\\u1BA2\\u1BA3\\u1BA4\\u1BA5\\u1BA8\\u1BA9\\u1C2C\\u1C2D\\u1C2E\\u1C2F\\u1C30\\u1C31\\u1C32\\u1C33\\u1C36\\u1C37\\u1DC0\\u1DC1\\u1DC2\\u1DC3\\u1DC4\\u1DC5\\u1DC6\\u1DC7\\u1DC8\\u1DC9\\u1DCA\\u1DCB\\u1DCC\\u1DCD\\u1DCE\\u1DCF\\u1DD0\\u1DD1\\u1DD2\\u1DD3\\u1DD4\\u1DD5\\u1DD6\\u1DD7\\u1DD8\\u1DD9\\u1DDA\\u1DDB\\u1DDC\\u1DDD\\u1DDE\\u1DDF\\u1DE0\\u1DE1\\u1DE2\\u1DE3\\u1DE4\\u1DE5\\u1DE6\\u1DFE\\u1DFF\\u20D0\\u20D1\\u20D2\\u20D3\\u20D4\\u20D5\\u20D6\\u20D7\\u20D8\\u20D9\\u20DA\\u20DB\\u20DC\\u20E1\\u20E5\\u20E6\\u20E7\\u20E8\\u20E9\\u20EA\\u20EB\\u20EC\\u20ED\\u20EE\\u20EF\\u20F0\\u2DE0\\u2DE1\\u2DE2\\u2DE3\\u2DE4\\u2DE5\\u2DE6\\u2DE7\\u2DE8\\u2DE9\\u2DEA\\u2DEB\\u2DEC\\u2DED\\u2DEE\\u2DEF\\u2DF0\\u2DF1\\u2DF2\\u2DF3\\u2DF4\\u2DF5\\u2DF6\\u2DF7\\u2DF8\\u2DF9\\u2DFA\\u2DFB\\u2DFC\\u2DFD\\u2DFE\\u2DFF\\u302A\\u302B\\u302C\\u302D\\u302E\\u302F\\u3099\\u309A\\uA66F\\uA67C\\uA67D\\uA802\\uA806\\uA80B\\uA825\\uA826\\uA8C4\\uA926\\uA927\\uA928\\uA929\\uA92A\\uA92B\\uA92C\\uA92D\\uA947\\uA948\\uA949\\uA94A\\uA94B\\uA94C\\uA94D\\uA94E\\uA94F\\uA950\\uA951\\uAA29\\uAA2A\\uAA2B\\uAA2C\\uAA2D\\uAA2E\\uAA31\\uAA32\\uAA35\\uAA36\\uAA43\\uAA4C\\uFB1E\\uFE00\\uFE01\\uFE02\\uFE03\\uFE04\\uFE05\\uFE06\\uFE07\\uFE08\\uFE09\\uFE0A\\uFE0B\\uFE0C\\uFE0D\\uFE0E\\uFE0F\\uFE20\\uFE21\\uFE22\\uFE23\\uFE24\\uFE25\\uFE26]");
          }
        }
        return result0;
      }
      
      function parse_Nd() {
        var result0;
        
        if (/^[0123456789\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669\u06F0\u06F1\u06F2\u06F3\u06F4\u06F5\u06F6\u06F7\u06F8\u06F9\u07C0\u07C1\u07C2\u07C3\u07C4\u07C5\u07C6\u07C7\u07C8\u07C9\u0966\u0967\u0968\u0969\u096A\u096B\u096C\u096D\u096E\u096F\u09E6\u09E7\u09E8\u09E9\u09EA\u09EB\u09EC\u09ED\u09EE\u09EF\u0A66\u0A67\u0A68\u0A69\u0A6A\u0A6B\u0A6C\u0A6D\u0A6E\u0A6F\u0AE6\u0AE7\u0AE8\u0AE9\u0AEA\u0AEB\u0AEC\u0AED\u0AEE\u0AEF\u0B66\u0B67\u0B68\u0B69\u0B6A\u0B6B\u0B6C\u0B6D\u0B6E\u0B6F\u0BE6\u0BE7\u0BE8\u0BE9\u0BEA\u0BEB\u0BEC\u0BED\u0BEE\u0BEF\u0C66\u0C67\u0C68\u0C69\u0C6A\u0C6B\u0C6C\u0C6D\u0C6E\u0C6F\u0CE6\u0CE7\u0CE8\u0CE9\u0CEA\u0CEB\u0CEC\u0CED\u0CEE\u0CEF\u0D66\u0D67\u0D68\u0D69\u0D6A\u0D6B\u0D6C\u0D6D\u0D6E\u0D6F\u0E50\u0E51\u0E52\u0E53\u0E54\u0E55\u0E56\u0E57\u0E58\u0E59\u0ED0\u0ED1\u0ED2\u0ED3\u0ED4\u0ED5\u0ED6\u0ED7\u0ED8\u0ED9\u0F20\u0F21\u0F22\u0F23\u0F24\u0F25\u0F26\u0F27\u0F28\u0F29\u1040\u1041\u1042\u1043\u1044\u1045\u1046\u1047\u1048\u1049\u1090\u1091\u1092\u1093\u1094\u1095\u1096\u1097\u1098\u1099\u17E0\u17E1\u17E2\u17E3\u17E4\u17E5\u17E6\u17E7\u17E8\u17E9\u1810\u1811\u1812\u1813\u1814\u1815\u1816\u1817\u1818\u1819\u1946\u1947\u1948\u1949\u194A\u194B\u194C\u194D\u194E\u194F\u19D0\u19D1\u19D2\u19D3\u19D4\u19D5\u19D6\u19D7\u19D8\u19D9\u1B50\u1B51\u1B52\u1B53\u1B54\u1B55\u1B56\u1B57\u1B58\u1B59\u1BB0\u1BB1\u1BB2\u1BB3\u1BB4\u1BB5\u1BB6\u1BB7\u1BB8\u1BB9\u1C40\u1C41\u1C42\u1C43\u1C44\u1C45\u1C46\u1C47\u1C48\u1C49\u1C50\u1C51\u1C52\u1C53\u1C54\u1C55\u1C56\u1C57\u1C58\u1C59\uA620\uA621\uA622\uA623\uA624\uA625\uA626\uA627\uA628\uA629\uA8D0\uA8D1\uA8D2\uA8D3\uA8D4\uA8D5\uA8D6\uA8D7\uA8D8\uA8D9\uA900\uA901\uA902\uA903\uA904\uA905\uA906\uA907\uA908\uA909\uAA50\uAA51\uAA52\uAA53\uAA54\uAA55\uAA56\uAA57\uAA58\uAA59\uFF10\uFF11\uFF12\uFF13\uFF14\uFF15\uFF16\uFF17\uFF18\uFF19]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[0123456789\\u0660\\u0661\\u0662\\u0663\\u0664\\u0665\\u0666\\u0667\\u0668\\u0669\\u06F0\\u06F1\\u06F2\\u06F3\\u06F4\\u06F5\\u06F6\\u06F7\\u06F8\\u06F9\\u07C0\\u07C1\\u07C2\\u07C3\\u07C4\\u07C5\\u07C6\\u07C7\\u07C8\\u07C9\\u0966\\u0967\\u0968\\u0969\\u096A\\u096B\\u096C\\u096D\\u096E\\u096F\\u09E6\\u09E7\\u09E8\\u09E9\\u09EA\\u09EB\\u09EC\\u09ED\\u09EE\\u09EF\\u0A66\\u0A67\\u0A68\\u0A69\\u0A6A\\u0A6B\\u0A6C\\u0A6D\\u0A6E\\u0A6F\\u0AE6\\u0AE7\\u0AE8\\u0AE9\\u0AEA\\u0AEB\\u0AEC\\u0AED\\u0AEE\\u0AEF\\u0B66\\u0B67\\u0B68\\u0B69\\u0B6A\\u0B6B\\u0B6C\\u0B6D\\u0B6E\\u0B6F\\u0BE6\\u0BE7\\u0BE8\\u0BE9\\u0BEA\\u0BEB\\u0BEC\\u0BED\\u0BEE\\u0BEF\\u0C66\\u0C67\\u0C68\\u0C69\\u0C6A\\u0C6B\\u0C6C\\u0C6D\\u0C6E\\u0C6F\\u0CE6\\u0CE7\\u0CE8\\u0CE9\\u0CEA\\u0CEB\\u0CEC\\u0CED\\u0CEE\\u0CEF\\u0D66\\u0D67\\u0D68\\u0D69\\u0D6A\\u0D6B\\u0D6C\\u0D6D\\u0D6E\\u0D6F\\u0E50\\u0E51\\u0E52\\u0E53\\u0E54\\u0E55\\u0E56\\u0E57\\u0E58\\u0E59\\u0ED0\\u0ED1\\u0ED2\\u0ED3\\u0ED4\\u0ED5\\u0ED6\\u0ED7\\u0ED8\\u0ED9\\u0F20\\u0F21\\u0F22\\u0F23\\u0F24\\u0F25\\u0F26\\u0F27\\u0F28\\u0F29\\u1040\\u1041\\u1042\\u1043\\u1044\\u1045\\u1046\\u1047\\u1048\\u1049\\u1090\\u1091\\u1092\\u1093\\u1094\\u1095\\u1096\\u1097\\u1098\\u1099\\u17E0\\u17E1\\u17E2\\u17E3\\u17E4\\u17E5\\u17E6\\u17E7\\u17E8\\u17E9\\u1810\\u1811\\u1812\\u1813\\u1814\\u1815\\u1816\\u1817\\u1818\\u1819\\u1946\\u1947\\u1948\\u1949\\u194A\\u194B\\u194C\\u194D\\u194E\\u194F\\u19D0\\u19D1\\u19D2\\u19D3\\u19D4\\u19D5\\u19D6\\u19D7\\u19D8\\u19D9\\u1B50\\u1B51\\u1B52\\u1B53\\u1B54\\u1B55\\u1B56\\u1B57\\u1B58\\u1B59\\u1BB0\\u1BB1\\u1BB2\\u1BB3\\u1BB4\\u1BB5\\u1BB6\\u1BB7\\u1BB8\\u1BB9\\u1C40\\u1C41\\u1C42\\u1C43\\u1C44\\u1C45\\u1C46\\u1C47\\u1C48\\u1C49\\u1C50\\u1C51\\u1C52\\u1C53\\u1C54\\u1C55\\u1C56\\u1C57\\u1C58\\u1C59\\uA620\\uA621\\uA622\\uA623\\uA624\\uA625\\uA626\\uA627\\uA628\\uA629\\uA8D0\\uA8D1\\uA8D2\\uA8D3\\uA8D4\\uA8D5\\uA8D6\\uA8D7\\uA8D8\\uA8D9\\uA900\\uA901\\uA902\\uA903\\uA904\\uA905\\uA906\\uA907\\uA908\\uA909\\uAA50\\uAA51\\uAA52\\uAA53\\uAA54\\uAA55\\uAA56\\uAA57\\uAA58\\uAA59\\uFF10\\uFF11\\uFF12\\uFF13\\uFF14\\uFF15\\uFF16\\uFF17\\uFF18\\uFF19]");
          }
        }
        return result0;
      }
      
      function parse_Nl() {
        var result0;
        
        if (/^[\u16EE\u16EF\u16F0\u2160\u2161\u2162\u2163\u2164\u2165\u2166\u2167\u2168\u2169\u216A\u216B\u216C\u216D\u216E\u216F\u2170\u2171\u2172\u2173\u2174\u2175\u2176\u2177\u2178\u2179\u217A\u217B\u217C\u217D\u217E\u217F\u2180\u2181\u2182\u2185\u2186\u2187\u2188\u3007\u3021\u3022\u3023\u3024\u3025\u3026\u3027\u3028\u3029\u3038\u3039\u303A]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[\\u16EE\\u16EF\\u16F0\\u2160\\u2161\\u2162\\u2163\\u2164\\u2165\\u2166\\u2167\\u2168\\u2169\\u216A\\u216B\\u216C\\u216D\\u216E\\u216F\\u2170\\u2171\\u2172\\u2173\\u2174\\u2175\\u2176\\u2177\\u2178\\u2179\\u217A\\u217B\\u217C\\u217D\\u217E\\u217F\\u2180\\u2181\\u2182\\u2185\\u2186\\u2187\\u2188\\u3007\\u3021\\u3022\\u3023\\u3024\\u3025\\u3026\\u3027\\u3028\\u3029\\u3038\\u3039\\u303A]");
          }
        }
        return result0;
      }
      
      function parse_Pc() {
        var result0;
        
        if (/^[_\u203F\u2040\u2054\uFE33\uFE34\uFE4D\uFE4E\uFE4F\uFF3F]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[_\\u203F\\u2040\\u2054\\uFE33\\uFE34\\uFE4D\\uFE4E\\uFE4F\\uFF3F]");
          }
        }
        return result0;
      }
      
      function parse_Zs() {
        var result0;
        
        if (/^[ \xA0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000]/.test(input.charAt(pos))) {
          result0 = input.charAt(pos);
          pos++;
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[ \\xA0\\u1680\\u180E\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200A\\u202F\\u205F\\u3000]");
          }
        }
        return result0;
      }
      
      
      function cleanupExpected(expected) {
        expected.sort();
        
        var lastExpected = null;
        var cleanExpected = [];
        for (var i = 0; i < expected.length; i++) {
          if (expected[i] !== lastExpected) {
            cleanExpected.push(expected[i]);
            lastExpected = expected[i];
          }
        }
        return cleanExpected;
      }
      
      function computeErrorPosition() {
        /*
         * The first idea was to use |String.split| to break the input up to the
         * error position along newlines and derive the line and column from
         * there. However IE's |split| implementation is so broken that it was
         * enough to prevent it.
         */
        
        var line = 1;
        var column = 1;
        var seenCR = false;
        
        for (var i = 0; i < Math.max(pos, rightmostFailuresPos); i++) {
          var ch = input.charAt(i);
          if (ch === "\n") {
            if (!seenCR) { line++; }
            column = 1;
            seenCR = false;
          } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
            line++;
            column = 1;
            seenCR = true;
          } else {
            column++;
            seenCR = false;
          }
        }
        
        return { line: line, column: column };
      }
      
      
      var result = parseFunctions[startRule]();
      
      /*
       * The parser is now in one of the following three states:
       *
       * 1. The parser successfully parsed the whole input.
       *
       *    - |result !== null|
       *    - |pos === input.length|
       *    - |rightmostFailuresExpected| may or may not contain something
       *
       * 2. The parser successfully parsed only a part of the input.
       *
       *    - |result !== null|
       *    - |pos < input.length|
       *    - |rightmostFailuresExpected| may or may not contain something
       *
       * 3. The parser did not successfully parse any part of the input.
       *
       *   - |result === null|
       *   - |pos === 0|
       *   - |rightmostFailuresExpected| contains at least one failure
       *
       * All code following this comment (including called functions) must
       * handle these states.
       */
      if (result === null || pos !== input.length) {
        var offset = Math.max(pos, rightmostFailuresPos);
        var found = offset < input.length ? input.charAt(offset) : null;
        var errorPosition = computeErrorPosition();
        
        throw new this.SyntaxError(
          cleanupExpected(rightmostFailuresExpected),
          found,
          offset,
          errorPosition.line,
          errorPosition.column
        );
      }
      
      return result;
    },
    
    /* Returns the parser source code. */
    toSource: function() { return this._source; }
  };
  
  /* Thrown when a parser encounters a syntax error. */
  
  result.SyntaxError = function(expected, found, offset, line, column) {
    function buildMessage(expected, found) {
      var expectedHumanized, foundHumanized;
      
      switch (expected.length) {
        case 0:
          expectedHumanized = "end of input";
          break;
        case 1:
          expectedHumanized = expected[0];
          break;
        default:
          expectedHumanized = expected.slice(0, expected.length - 1).join(", ")
            + " or "
            + expected[expected.length - 1];
      }
      
      foundHumanized = found ? quote(found) : "end of input";
      
      return "Expected " + expectedHumanized + " but " + foundHumanized + " found.";
    }
    
    this.name = "SyntaxError";
    this.expected = expected;
    this.found = found;
    this.message = buildMessage(expected, found);
    this.offset = offset;
    this.line = line;
    this.column = column;
  };
  
  result.SyntaxError.prototype = Error.prototype;
  
  return result;
});

define('pat-dependshandler',[
    "jquery",
    "pat-depends_parse"
], function($, parser) {
    function DependsHandler($el, expression) {
        var $context = $el.closest("form");
        if (!$context.length)
            $context=$(document);
        this.$el=$el;
        this.$context=$context;
        this.ast=parser.parse(expression);  // TODO: handle parse exceptions here
    }

    DependsHandler.prototype = {
        _findInputs: function(name) {
            var $input = this.$context.find(":input[name='"+name+"']");
            if (!$input.length)
                $input=$("#"+name);
            return $input;
        },

        _getValue: function(name) {
            var $input = this._findInputs(name);
            if (!$input.length)
                return null;

            if ($input.attr("type")==="radio" || $input.attr("type")==="checkbox")
                return $input.filter(":checked").val() || null;
            else
                return $input.val();
        },
        
        getAllInputs: function() {
            var todo = [this.ast],
                $inputs = $(),
                node;

            while (todo.length) {
                node=todo.shift();
                if (node.input)
                    $inputs=$inputs.add(this._findInputs(node.input));
                if (node.children && node.children.length)
                    todo.push.apply(todo, node.children);
            }
            return $inputs;
        },

        _evaluate: function(node) {
            var value = node.input ? this._getValue(node.input) : null,
                i;

            switch (node.type) {
                case "NOT":
                    return !this._evaluate(node.children[0]);
                case "AND":
                    for (i=0; i<node.children.length; i++)
                        if (!this._evaluate(node.children[i]))
                            return false;
                    return true;
                case "OR":
                    for (i=0; i<node.children.length; i++)
                        if (this._evaluate(node.children[i]))
                            return true;
                    return false;
                case "comparison":
                    switch (node.operator) {
                        case "=":
                            return node.value==value;
                        case "!=":
                            return node.value!=value;
                        case "<=":
                            return value<=node.value;
                        case "<":
                            return value<node.value;
                        case ">":
                            return value>node.value;
                        case ">=":
                            return value>=node.value;
                        case "~=":
                            if (value===null)
                                return false;
                            return value.indexOf(node.value)!=-1;
                    }
                    break;
                case "truthy":
                    return !!value;
            }
        },

        evaluate: function() {
            return this._evaluate(this.ast);
        }
    };

    return DependsHandler;
});


/**
 * Patterns depends - show/hide/disable content based on form status
 *
 * Copyright 2012-2013 Florian Friesdorf
 * Copyright 2012-2013 Simplon B.V. - Wichert Akkerman
 */
define('pat-depends',[
    "jquery",
    "pat-registry",
    "pat-base",
    "pat-utils",
    "pat-logger",
    "pat-dependshandler",
    "pat-parser"
], function($, patterns, Base, utils, logging, DependsHandler, Parser) {
    var log = logging.getLogger("depends"),
        parser = new Parser("depends");

    parser.addArgument("condition");
    parser.addArgument("action", "show", ["show", "enable", "both"]);
    parser.addArgument("transition", "none", ["none", "css", "fade", "slide"]);
    parser.addArgument("effect-duration", "fast");
    parser.addArgument("effect-easing", "swing");

    return Base.extend({
        name: "depends",
        trigger: ".pat-depends",
        jquery_plugin: true,

        transitions: {
            none: {hide: "hide", show: "show"},
            fade: {hide: "fadeOut", show: "fadeIn"},
            slide: {hide: "slideUp", show: "slideDown"}
        },

        init: function($el, opts) {
            var slave = this.$el[0],
                options = parser.parse(this.$el, opts),
                handler, state;
            this.$modal = this.$el.parents(".pat-modal");

            try {
                handler=new DependsHandler(this.$el, options.condition);
            } catch (e) {
                log.error("Invalid condition: " + e.message, slave);
                return;
            }

            state=handler.evaluate();
            switch (options.action) {
                case "show":
                    if (state)
                        this.show();
                    else
                        this.hide();
                    break;
                case "enable":
                    if (state)
                        this.enable();
                    else
                        this.disable();
                    break;
                case "both":
                    if (state) {
                        this.show();
                        this.enable();
                    } else {
                        this.hide();
                        this.disable();
                    }
                    break;
            }

            var data = {handler: handler,
                        options: options,
                        slave: slave};

            var that = this;
            handler.getAllInputs().each(function(idx, input) {
                if (input.form) {
                    var $form = $(input.form);
                    var slaves = $form.data("patDepends.slaves");
                    if (!slaves) {
                        slaves=[data];
                        $form.on("reset.pat-depends", that.onReset);
                    } else if (slaves.indexOf(data)===-1)
                        slaves.push(data);
                    $form.data("patDepends.slaves", slaves);
                }
                $(input).on("change.pat-depends", null, data, this.onChange.bind(this));
                $(input).on("keyup.pat-depends", null, data, this.onChange.bind(this));
            }.bind(this));
        },

        onReset: function(event) {
            var slaves = $(event.target).data("patDepends.slaves"),
                i;

            setTimeout(function() {
                for (i=0; i<slaves.length; i++) {
                    event.data=slaves[i];
                    this.onChange(event);
                }
            }.bind(this), 50);
        },

        updateModal: function () {
            /* If we're in a modal, make sure that it gets resized.
             */
            if (this.$modal.length) {
                $(document).trigger("pat-update", {pattern: "depends"});
            }
        },

        show: function () {
            this.$el.show();
            this.updateModal();
        },

        hide: function () {
            this.$el.hide();
            this.updateModal();
        },

        enable: function() {
            if (this.$el.is(":input"))
                this.$el[0].disabled=null;
            else if (this.$el.is("a"))
                this.$el.off("click.patternDepends");
            else if (this.$el.hasClass("pat-autosuggest")) {
                this.$el.findInclusive("input.pat-autosuggest").trigger("pat-update", {
                    pattern: "depends",
                    enabled: true
                });
            }
            this.$el.removeClass("disabled");
        },

        disable: function() {
            if (this.$el.is(":input"))
                this.$el[0].disabled="disabled";
            else if (this.$el.is("a"))
                this.$el.on("click.patternDepends", this.blockDefault);
            else if (this.$el.hasClass("pat-autosuggest")) {
                this.$el.findInclusive("input.pat-autosuggest").trigger("pat-update", {
                    pattern: "depends",
                    enabled: false
                });
            }
            this.$el.addClass("disabled");
        },

        onChange: function(event) {
            var handler = event.data.handler,
                options = event.data.options,
                slave = event.data.slave,
                $slave = $(slave),
                state = handler.evaluate();

            switch (options.action) {
                case "show":
                    utils.hideOrShow($slave, state, options, this.name);
                    this.updateModal();
                    break;
                case "enable":
                    if (state)
                        this.enable();
                    else
                        this.disable();
                    break;
                case "both":
                    utils.hideOrShow($slave, state, options, this.name);
                    this.updateModal();
                    if (state)
                        this.enable();
                    else
                        this.disable();
                    break;
            }
        },

        blockDefault: function(event) {
            event.preventDefault();
        }
    });
});

// jshint indent: 4, browser: true, jquery: true, quotmark: double
// vim: sw=4 expandtab
;
/*!
 * imagesLoaded PACKAGED v4.1.1
 * JavaScript is all like "You images are done yet or what?"
 * MIT License
 */

/**
 * EvEmitter v1.0.3
 * Lil' event emitter
 * MIT License
 */

/* jshint unused: true, undef: true, strict: true */

( function( global, factory ) {
  // universal module definition
  /* jshint strict: false */ /* globals define, module, window */
  if ( typeof define == 'function' && define.amd ) {
    // AMD - RequireJS
    define( 'ev-emitter/ev-emitter',factory );
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS - Browserify, Webpack
    module.exports = factory();
  } else {
    // Browser globals
    global.EvEmitter = factory();
  }

}( typeof window != 'undefined' ? window : this, function() {



function EvEmitter() {}

var proto = EvEmitter.prototype;

proto.on = function( eventName, listener ) {
  if ( !eventName || !listener ) {
    return;
  }
  // set events hash
  var events = this._events = this._events || {};
  // set listeners array
  var listeners = events[ eventName ] = events[ eventName ] || [];
  // only add once
  if ( listeners.indexOf( listener ) == -1 ) {
    listeners.push( listener );
  }

  return this;
};

proto.once = function( eventName, listener ) {
  if ( !eventName || !listener ) {
    return;
  }
  // add event
  this.on( eventName, listener );
  // set once flag
  // set onceEvents hash
  var onceEvents = this._onceEvents = this._onceEvents || {};
  // set onceListeners object
  var onceListeners = onceEvents[ eventName ] = onceEvents[ eventName ] || {};
  // set flag
  onceListeners[ listener ] = true;

  return this;
};

proto.off = function( eventName, listener ) {
  var listeners = this._events && this._events[ eventName ];
  if ( !listeners || !listeners.length ) {
    return;
  }
  var index = listeners.indexOf( listener );
  if ( index != -1 ) {
    listeners.splice( index, 1 );
  }

  return this;
};

proto.emitEvent = function( eventName, args ) {
  var listeners = this._events && this._events[ eventName ];
  if ( !listeners || !listeners.length ) {
    return;
  }
  var i = 0;
  var listener = listeners[i];
  args = args || [];
  // once stuff
  var onceListeners = this._onceEvents && this._onceEvents[ eventName ];

  while ( listener ) {
    var isOnce = onceListeners && onceListeners[ listener ];
    if ( isOnce ) {
      // remove listener
      // remove before trigger to prevent recursion
      this.off( eventName, listener );
      // unset once flag
      delete onceListeners[ listener ];
    }
    // trigger listener
    listener.apply( this, args );
    // get next listener
    i += isOnce ? 0 : 1;
    listener = listeners[i];
  }

  return this;
};

return EvEmitter;

}));

/*!
 * imagesLoaded v4.1.1
 * JavaScript is all like "You images are done yet or what?"
 * MIT License
 */

( function( window, factory ) { 'use strict';
  // universal module definition

  /*global define: false, module: false, require: false */

  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'imagesloaded',[
      'ev-emitter/ev-emitter'
    ], function( EvEmitter ) {
      return factory( window, EvEmitter );
    });
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      window,
      require('ev-emitter')
    );
  } else {
    // browser global
    window.imagesLoaded = factory(
      window,
      window.EvEmitter
    );
  }

})( window,

// --------------------------  factory -------------------------- //

function factory( window, EvEmitter ) {



var $ = window.jQuery;
var console = window.console;

// -------------------------- helpers -------------------------- //

// extend objects
function extend( a, b ) {
  for ( var prop in b ) {
    a[ prop ] = b[ prop ];
  }
  return a;
}

// turn element or nodeList into an array
function makeArray( obj ) {
  var ary = [];
  if ( Array.isArray( obj ) ) {
    // use object if already an array
    ary = obj;
  } else if ( typeof obj.length == 'number' ) {
    // convert nodeList to array
    for ( var i=0; i < obj.length; i++ ) {
      ary.push( obj[i] );
    }
  } else {
    // array of single index
    ary.push( obj );
  }
  return ary;
}

// -------------------------- imagesLoaded -------------------------- //

/**
 * @param {Array, Element, NodeList, String} elem
 * @param {Object or Function} options - if function, use as callback
 * @param {Function} onAlways - callback function
 */
function ImagesLoaded( elem, options, onAlways ) {
  // coerce ImagesLoaded() without new, to be new ImagesLoaded()
  if ( !( this instanceof ImagesLoaded ) ) {
    return new ImagesLoaded( elem, options, onAlways );
  }
  // use elem as selector string
  if ( typeof elem == 'string' ) {
    elem = document.querySelectorAll( elem );
  }

  this.elements = makeArray( elem );
  this.options = extend( {}, this.options );

  if ( typeof options == 'function' ) {
    onAlways = options;
  } else {
    extend( this.options, options );
  }

  if ( onAlways ) {
    this.on( 'always', onAlways );
  }

  this.getImages();

  if ( $ ) {
    // add jQuery Deferred object
    this.jqDeferred = new $.Deferred();
  }

  // HACK check async to allow time to bind listeners
  setTimeout( function() {
    this.check();
  }.bind( this ));
}

ImagesLoaded.prototype = Object.create( EvEmitter.prototype );

ImagesLoaded.prototype.options = {};

ImagesLoaded.prototype.getImages = function() {
  this.images = [];

  // filter & find items if we have an item selector
  this.elements.forEach( this.addElementImages, this );
};

/**
 * @param {Node} element
 */
ImagesLoaded.prototype.addElementImages = function( elem ) {
  // filter siblings
  if ( elem.nodeName == 'IMG' ) {
    this.addImage( elem );
  }
  // get background image on element
  if ( this.options.background === true ) {
    this.addElementBackgroundImages( elem );
  }

  // find children
  // no non-element nodes, #143
  var nodeType = elem.nodeType;
  if ( !nodeType || !elementNodeTypes[ nodeType ] ) {
    return;
  }
  var childImgs = elem.querySelectorAll('img');
  // concat childElems to filterFound array
  for ( var i=0; i < childImgs.length; i++ ) {
    var img = childImgs[i];
    this.addImage( img );
  }

  // get child background images
  if ( typeof this.options.background == 'string' ) {
    var children = elem.querySelectorAll( this.options.background );
    for ( i=0; i < children.length; i++ ) {
      var child = children[i];
      this.addElementBackgroundImages( child );
    }
  }
};

var elementNodeTypes = {
  1: true,
  9: true,
  11: true
};

ImagesLoaded.prototype.addElementBackgroundImages = function( elem ) {
  var style = getComputedStyle( elem );
  if ( !style ) {
    // Firefox returns null if in a hidden iframe https://bugzil.la/548397
    return;
  }
  // get url inside url("...")
  var reURL = /url\((['"])?(.*?)\1\)/gi;
  var matches = reURL.exec( style.backgroundImage );
  while ( matches !== null ) {
    var url = matches && matches[2];
    if ( url ) {
      this.addBackground( url, elem );
    }
    matches = reURL.exec( style.backgroundImage );
  }
};

/**
 * @param {Image} img
 */
ImagesLoaded.prototype.addImage = function( img ) {
  var loadingImage = new LoadingImage( img );
  this.images.push( loadingImage );
};

ImagesLoaded.prototype.addBackground = function( url, elem ) {
  var background = new Background( url, elem );
  this.images.push( background );
};

ImagesLoaded.prototype.check = function() {
  var _this = this;
  this.progressedCount = 0;
  this.hasAnyBroken = false;
  // complete if no images
  if ( !this.images.length ) {
    this.complete();
    return;
  }

  function onProgress( image, elem, message ) {
    // HACK - Chrome triggers event before object properties have changed. #83
    setTimeout( function() {
      _this.progress( image, elem, message );
    });
  }

  this.images.forEach( function( loadingImage ) {
    loadingImage.once( 'progress', onProgress );
    loadingImage.check();
  });
};

ImagesLoaded.prototype.progress = function( image, elem, message ) {
  this.progressedCount++;
  this.hasAnyBroken = this.hasAnyBroken || !image.isLoaded;
  // progress event
  this.emitEvent( 'progress', [ this, image, elem ] );
  if ( this.jqDeferred && this.jqDeferred.notify ) {
    this.jqDeferred.notify( this, image );
  }
  // check if completed
  if ( this.progressedCount == this.images.length ) {
    this.complete();
  }

  if ( this.options.debug && console ) {
    console.log( 'progress: ' + message, image, elem );
  }
};

ImagesLoaded.prototype.complete = function() {
  var eventName = this.hasAnyBroken ? 'fail' : 'done';
  this.isComplete = true;
  this.emitEvent( eventName, [ this ] );
  this.emitEvent( 'always', [ this ] );
  if ( this.jqDeferred ) {
    var jqMethod = this.hasAnyBroken ? 'reject' : 'resolve';
    this.jqDeferred[ jqMethod ]( this );
  }
};

// --------------------------  -------------------------- //

function LoadingImage( img ) {
  this.img = img;
}

LoadingImage.prototype = Object.create( EvEmitter.prototype );

LoadingImage.prototype.check = function() {
  // If complete is true and browser supports natural sizes,
  // try to check for image status manually.
  var isComplete = this.getIsImageComplete();
  if ( isComplete ) {
    // report based on naturalWidth
    this.confirm( this.img.naturalWidth !== 0, 'naturalWidth' );
    return;
  }

  // If none of the checks above matched, simulate loading on detached element.
  this.proxyImage = new Image();
  this.proxyImage.addEventListener( 'load', this );
  this.proxyImage.addEventListener( 'error', this );
  // bind to image as well for Firefox. #191
  this.img.addEventListener( 'load', this );
  this.img.addEventListener( 'error', this );
  this.proxyImage.src = this.img.src;
};

LoadingImage.prototype.getIsImageComplete = function() {
  return this.img.complete && this.img.naturalWidth !== undefined;
};

LoadingImage.prototype.confirm = function( isLoaded, message ) {
  this.isLoaded = isLoaded;
  this.emitEvent( 'progress', [ this, this.img, message ] );
};

// ----- events ----- //

// trigger specified handler for event type
LoadingImage.prototype.handleEvent = function( event ) {
  var method = 'on' + event.type;
  if ( this[ method ] ) {
    this[ method ]( event );
  }
};

LoadingImage.prototype.onload = function() {
  this.confirm( true, 'onload' );
  this.unbindEvents();
};

LoadingImage.prototype.onerror = function() {
  this.confirm( false, 'onerror' );
  this.unbindEvents();
};

LoadingImage.prototype.unbindEvents = function() {
  this.proxyImage.removeEventListener( 'load', this );
  this.proxyImage.removeEventListener( 'error', this );
  this.img.removeEventListener( 'load', this );
  this.img.removeEventListener( 'error', this );
};

// -------------------------- Background -------------------------- //

function Background( url, element ) {
  this.url = url;
  this.element = element;
  this.img = new Image();
}

// inherit LoadingImage prototype
Background.prototype = Object.create( LoadingImage.prototype );

Background.prototype.check = function() {
  this.img.addEventListener( 'load', this );
  this.img.addEventListener( 'error', this );
  this.img.src = this.url;
  // check if image is already complete
  var isComplete = this.getIsImageComplete();
  if ( isComplete ) {
    this.confirm( this.img.naturalWidth !== 0, 'naturalWidth' );
    this.unbindEvents();
  }
};

Background.prototype.unbindEvents = function() {
  this.img.removeEventListener( 'load', this );
  this.img.removeEventListener( 'error', this );
};

Background.prototype.confirm = function( isLoaded, message ) {
  this.isLoaded = isLoaded;
  this.emitEvent( 'progress', [ this, this.element, message ] );
};

// -------------------------- jQuery -------------------------- //

ImagesLoaded.makeJQueryPlugin = function( jQuery ) {
  jQuery = jQuery || window.jQuery;
  if ( !jQuery ) {
    return;
  }
  // set local variable
  $ = jQuery;
  // $().imagesLoaded()
  $.fn.imagesLoaded = function( options, callback ) {
    var instance = new ImagesLoaded( this, options, callback );
    return instance.jqDeferred.promise( $(this) );
  };
};
// try making plugin
ImagesLoaded.makeJQueryPlugin();

// --------------------------  -------------------------- //

return ImagesLoaded;

});


/**
 * equaliser - Equalise height of elements in a row
 *
 * Copyright 2013 Simplon B.V. - Wichert Akkerman
 */
define('pat-equaliser',[
    "jquery",
    "pat-registry",
    "pat-parser",
    "pat-utils",
    "imagesloaded"
], function($, patterns, Parser, utils, imagesLoaded) {
    var parser = new Parser("equaliser");
    parser.addArgument("transition", "none", ["none", "grow"]);
    parser.addArgument("effect-duration", "fast");
    parser.addArgument("effect-easing", "swing");

    var equaliser = {
        name: "equaliser",
        trigger: ".pat-equaliser, .pat-equalizer",

        init: function($el, opts) {
            return $el.each(function() {
                var $container = $(this),
                    options = parser.parse($container, opts);
                $container.data("pat-equaliser", options);
                $container.on("pat-update.pat-equaliser", null, this, equaliser._onEvent);
                $container.on("patterns-injected.pat-equaliser", null, this, equaliser._onEvent);
                $(window).on("resize.pat-equaliser", null, this, utils.debounce(equaliser._onEvent, 100));
                $container.parents('.pat-stacks').on("pat-update", null, this, utils.debounce(equaliser._onEvent, 100));
                imagesLoaded(this, $.proxy(function() {
                    equaliser._update(this);
                }, this));
            });
        },

        _update: function(container) {
            var $container = $(container),
                options = $container.data("pat-equaliser"),
                $children = $container.children(),
                max_height = 0;

            for (var i=0; i<$children.length; i++) {
                var $child = $children.eq(i),
                    css = $child.css("height"),
                    height;
                $child.css("height", "").removeClass("equalised");
                height=$child.height();
                if (height>max_height)
                    max_height=height;
                if (css)
                    $child.css("height", css);
            }

            var new_css = {height: max_height+"px"};

            switch (options.transition) {
                case "none":
                    $children.css(new_css).addClass("equalised");
                    break;
                case "grow":
                    $children.animate(new_css, options.effect.duration, options.effect.easing, function() {
                        $(this).addClass("equalised");
                    });
                    break;
            }
        },

        _onEvent: function(event) {
            if (typeof event.data !== "undefined") {
                equaliser._update(event.data);
            }
        }
    };

    patterns.register(equaliser);
    return equaliser;
});



define('pat-expandable',[
    "jquery",
    "pat-inject",
    "pat-parser",
    "pat-registry"
], function($, inject, Parser, registry) {
    var parser = new Parser("expandable");

    parser.addArgument("load-content");

    var _ = {
        name: "expandable",
        trigger: "ul.pat-expandable",
        jquery_plugin: true,
        init: function($el) {
            // make sure inject folders have a ul
            $el.find(".folder[data-pat-expandable]:not(:has(ul))")
                .append("<ul />");

            // find all folders that contain a ul
            var $folders = $el.find("li.folder:has(ul)");

            // inject span.toggle as first child of each folder
            $folders.prepend("<span class='toggle'></span>");

            // all folders are implicitly closed
            $folders.filter(":not(.open,.closed)").addClass("closed");

            // trigger open event for open folders
            $folders.filter(".open").trigger("patterns-folder-open");

            // wire spans as control elements
            var $ctrls = $el.find("span.toggle");
            $ctrls.each(function() {
                var $ctrl = $(this),
                    $folder = $ctrl.parent();
                $ctrl.on("click.pat-expandable", function() {
                    $folder.toggleClass("open closed")
                        .filter(".open[data-pat-expandable]")
                        .patExpandable("loadContent");
                });
            });
            return $el;
        },
        loadContent: function($el) {
            return $el.each(function() {
                var $el = $(this),
                    url = parser.parse($el).loadContent,
                    components = url.split("#"),
                    base_url = components[0],
                    id = components[1] ? "#" + components[1] : "body",
                    opts = [{
                        url: base_url,
                        source: id,
                        $target: $el.find("ul"),
                        dataType: "html"
                    }];
                inject.execute(opts, $el);
            });
        }

    };
    registry.register(_);
    return _;
});

// jshint indent: 4, browser: true, jquery: true, quotmark: double
// vim: sw=4 expandtab
;
/**
 * @license
 * Patterns @VERSION@ focus - Manage focus class on fieldsets
 *
 * Copyright 2012 Simplon B.V.
 */
define('pat-focus',[
    "jquery",
    "pat-registry"
], function($, patterns) {
    var focus = {
        name: "focus",

        onNewContent: function() {
            if ($(document.activeElement).is(":input"))
                focus._findRelatives(document.activeElement).addClass("focus");
        },

        _findRelatives: function(el) {
            var $el = $(el),
                $relatives = $(el),
                $label = $();

            $relatives=$relatives.add($el.closest("label"));
            $relatives=$relatives.add($el.closest("fieldset"));

            if (el.id)
                $label=$("label[for='"+el.id+"']");
            if (!$label.length) {
                var $form = $el.closest("form");
                if (!$form.length)
                    $form=$(document.body);
                $label=$form.find("label[for='"+el.name+"']");
            }
            $relatives=$relatives.add($label);
            return $relatives;
        },

        onFocus: function() {
            focus._findRelatives(this).addClass("focus");
        },

        onBlur: function() {
            var $relatives = focus._findRelatives(this);

            $(document).one("mouseup keyup", function() {
                $relatives.filter(":not(:has(:input:focus))").removeClass("focus");
            });
        }
    };

    $(document)
        .on("focus.patterns", ":input", focus.onFocus)
        .on("blur.patterns", ":input", focus.onBlur)
        .on("newContent", focus.onNewContent);
    patterns.register(focus);
    return focus;
});

// jshint indent: 4, browser: true, jquery: true, quotmark: double
// vim: sw=4 expandtab
;
define('pat-modal',[
    "jquery",
    "pat-parser",
    "pat-registry",
    "pat-base",
    "pat-utils",
    "pat-inject"
], function($, Parser, registry, Base, utils, inject) {
    var parser = new Parser("modal");
    parser.addArgument("class");
    parser.addArgument("closing", ["close-button"], ["close-button", "outside"], true);
    parser.addArgument("close-text", 'Close');

    return Base.extend({
        name: "modal",
        jquery_plugin: true,
        // div's are turned into modals
        // links, forms and subforms inject modals
        trigger: "div.pat-modal, a.pat-modal, form.pat-modal, .pat-modal.pat-subform",
        init: function ($el, opts, trigger) {
            this.options = parser.parse(this.$el, opts);
            if (trigger && trigger.type === "injection") {
                $.extend(this.options, parser.parse($(trigger.element), {}, false, false));
            }
            if (this.$el.is("div")) {
                this._init_div1();
            } else {
                this._init_inject1();
            }
        },

        _init_inject1: function () {
            var opts = {
                target: "#pat-modal",
                "class": "pat-modal" + (this.options["class"] ? " " + this.options["class"] : "")
            };
            // if $el is already inside a modal, do not detach #pat-modal,
            // because this would unnecessarily close the modal itself
            if (!this.$el.closest("#pat-modal")) {
                $("#pat-modal").detach();
            }
            this.$el.on("pat-inject-missingSource pat-inject-missingTarget", function() {
                $("#pat-modal").detach();
            });
            inject.init(this.$el, opts);
        },

        _init_div1: function () {
            var $header = $("<div class='header' />");
            if (this.options.closing.indexOf("close-button")!==-1) {
                $("<button type='button' class='close-panel'>" + this.options.closeText + "</button>").appendTo($header);
            }
            // We cannot handle text nodes here
            var $children = this.$el.children(":last, :not(:first)");
            if ($children.length) {
                $children.wrapAll("<div class='panel-content' />");
            } else {
                this.$el.append("<div class='panel-content' />");
            }
            $(".panel-content", this.$el).before($header);
            this.$el.children(":first:not(.header)").prependTo($header);

            // Restore focus in case the active element was a child of $el and
            // the focus was lost during the wrapping.
            // Only if we have an activeElement, as IE10/11 can have undefined as activeElement
            if (document.activeElement) {
                document.activeElement.focus();
            }
            this._init_handlers();
            this.resize();
            this.setPosition();
            $('body').addClass("modal-active");
        },

        _init_handlers: function() {
            var $el = this.$el;
            $(document).on("click.pat-modal", ".close-panel", this.destroy.bind(this));
            $(document).on("keyup.pat-modal", this._onKeyUp.bind(this));
            if (this.options.closing.indexOf("outside")!==-1) {
                $(document).on("click.pat-modal", this._onPossibleOutsideClick.bind(this));
            }
            $(window).on("resize.pat-modal-position",
                utils.debounce(this.resize.bind(this), 400));
            $(document).on("pat-inject-content-loaded.pat-modal-position", "#pat-modal",
                utils.debounce(this.resize.bind(this), 400));
            $(document).on("patterns-injected.pat-modal-position", "#pat-modal,div.pat-modal",
                utils.debounce(this.resize.bind(this), 400));
            $(document).on("pat-update.pat-modal-position", "#pat-modal,div.pat-modal",
                utils.debounce(this.resize.bind(this), 50));
        },

        _onPossibleOutsideClick: function(ev) {
            if (this.$el.has(ev.target)) {
                this.destroy();
            }
        },

        _onKeyUp: function(ev) {
            if (ev.which === 27) {
                this.destroy();
            }
        },

        getTallestChild: function() {
            var $tallest_child;
            $("*", this.$el).each(function () {
                var $child = $(this);
                if (typeof $tallest_child === "undefined") {
                    $tallest_child = $child;
                } else if ($child.outerHeight(true) > $tallest_child.outerHeight(true)) {
                    $tallest_child = $child;
                }
            });
            return $tallest_child;
        },

        setPosition: function() {
            this.$el.css("top", ($(window).innerHeight() - this.$el.height())/2);
        },

        resize: function() {
            // reset the height before setting a new one
            this.$el.removeClass("max-height").css("height", "");

            var panel_content_elem = this.$el.find(".panel-content");
            var header_elem = this.$el.find('.header');

            var modal_height = panel_content_elem.outerHeight(true) + header_elem.outerHeight(true);
            if (this.$el.height() < modal_height) {
                this.$el.addClass("max-height").css({"height": modal_height+'px'});
                this.setPosition();
            }
            // XXX: This is a hack. When you have a modal inside a
            // modal.max-height, the CSS of the outermost modal affects the
            // innermost .panel-body. By redrawing here, it's fixed.
            //
            // I think ideally the CSS needs to be fixed here, but I need to
            // discuss with Cornelis first.
            if (this.$el.parent().closest(".pat-modal").length > 0) {
                utils.redraw(this.$el.find(".panel-body"));
            }
        },

        destroy: function() {
            $(document).off(".pat-modal");
            this.$el.remove();
            $('body').removeClass("modal-active");
        }
    });
});

// jshint indent: 4, browser: true, jquery: true, quotmark: double
// vim: sw=4 expandtab
;
define('pat-form-state',[
    "jquery",
    "pat-logger",
    "pat-registry",
    "pat-utils",
    "pat-modal",
    "pat-input-change-events"
], function($, logger, registry, utils, modal, input_change_events) {
    var log = logger.getLogger("form-state");

    var _ = {
        name: "form-state",
        trigger: "form.pat-form-state",
        init: function($form) {
            if ($form.length > 1)
                return $form.each(function() { _.init($(this)); });

            input_change_events.setup($form, _.name);

            // XXX: hide reset buttons until we have proper handling for them
            $form.find("[type=reset]").hide();

            _.setReset.call($form);

            // remember initial state of the form and after
            // successfull submission
            $form.data("pat-ajax.state", $form.serializeArray());
            $form.on("pat-ajax-success", _.saveState);

            return $form;
        },
        saveState: function() {
            var $form = $(this);
            $form.data("pat-ajax.previous-state", $form.data("pat-ajax.state"));
            $form.data("pat-ajax.state", $form.serializeArray());
            $form.trigger("pat-form-state-saved");
        },
        setModified: function() {
            var $form = $(this);

            $form.find("[type=reset]").prop("disabled", false);
            $form.find("[type=submit]").prop("disabled", false);

            $form.addClass("modified")
                .off(".pat-form-state")
                .one("reset.pat-form-state", _.setReset)
                .one("pat-ajax-error.pat-form-state", _.setError)
                .one("pat-ajax-success.pat-form-state", _.setSaved);
            log.debug("modified");
        },
        setReset: function() {
            var $form = $(this);

            // hide only if form has changeable inputs
            if ($form.find(":input[type!=\"hidden\"][type!=\"submit\"]" +
                "[type!=\"reset\"][type!=button]").not("button").length) {

                $form.find("[type=reset]").prop("disabled", true);
                $form.find("[type=submit]").prop("disabled", true);
            }

            $form
                .removeClass("modified")
                .off(".pat-form-state")
                .one("input-change.pat-form-state", _.setModified);
            log.debug("reset");
        },
        setError: function(event) {
            var msg = [event.jqxhr.status, event.jqxhr.statusText].join(" ");
            modal.init($(
                "<div class='pat-modal small'>" +
                    "<h3>Error</h3>" +
                    "<div class='wizard-box'>" +
                    "<div class='panel-body'>" +
                    "<p>A server error has occured.</p>" +
                    "<p>The error message is: <strong>" + msg + "</strong>.</p>" +
                    "</div>" +
                    "<div class='buttons panel-footer'>" +
                    "<button class='close-panel'>Ok</button>" +
                    "</div>" +
                    "</div>" +
                    "</div>"
            ).appendTo($("body")));
        },
        setSaved: function(event) {
            if (event.target !== this)
                return;

            var $form = $(this);
            _.setReset.call($form);

            var time = new Date(),
                timestr = time.getHours() + ":" +
                    time.getMinutes() + ":" +
                    time.getSeconds();
            $form.find("time.last-saved").remove();
            $form.prepend(
                "<time class='last-saved' datetime='" + timestr + "'>" +
                    timestr + "</time>"
            );

            $form.addClass("saved");
        }
    };
    registry.register(_);
});

/**
 * Patterns forward - Forward click events
 *
 * Copyright 2013 Simplon B.V. - Wichert Akkerman
 */
define('pat-forward',[
    "jquery",
    "pat-parser",
    "pat-registry"
], function($, Parser, registry) {
    var parser = new Parser("forward");

    parser.addArgument("selector");

    var _ = {
        name: "forward",
        trigger: ".pat-forward",

        init: function($el, opts) {
            return $el.each(function() {
                var $el = $(this),
                    options = parser.parse($el, opts);

                if (!options.selector)
                    return;

                $el.on("click", null, options.selector, _._onClick);
            });
        },

        _onClick: function(event) {
            $(event.data).click();
            event.preventDefault();
            event.stopPropagation();
        }
    };
    registry.register(_);
    return _;
});

// vim: sw=4 expandtab

;
/*!
 * Masonry PACKAGED v4.1.1
 * Cascading grid layout library
 * http://masonry.desandro.com
 * MIT License
 * by David DeSandro
 */

/**
 * Bridget makes jQuery widgets
 * v2.0.1
 * MIT license
 */

/* jshint browser: true, strict: true, undef: true, unused: true */

( function( window, factory ) {
  // universal module definition
  /*jshint strict: false */ /* globals define, module, require */
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'jquery-bridget/jquery-bridget',[ 'jquery' ], function( jQuery ) {
      return factory( window, jQuery );
    });
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      window,
      require('jquery')
    );
  } else {
    // browser global
    window.jQueryBridget = factory(
      window,
      window.jQuery
    );
  }

}( window, function factory( window, jQuery ) {
'use strict';

// ----- utils ----- //

var arraySlice = Array.prototype.slice;

// helper function for logging errors
// $.error breaks jQuery chaining
var console = window.console;
var logError = typeof console == 'undefined' ? function() {} :
  function( message ) {
    console.error( message );
  };

// ----- jQueryBridget ----- //

function jQueryBridget( namespace, PluginClass, $ ) {
  $ = $ || jQuery || window.jQuery;
  if ( !$ ) {
    return;
  }

  // add option method -> $().plugin('option', {...})
  if ( !PluginClass.prototype.option ) {
    // option setter
    PluginClass.prototype.option = function( opts ) {
      // bail out if not an object
      if ( !$.isPlainObject( opts ) ){
        return;
      }
      this.options = $.extend( true, this.options, opts );
    };
  }

  // make jQuery plugin
  $.fn[ namespace ] = function( arg0 /*, arg1 */ ) {
    if ( typeof arg0 == 'string' ) {
      // method call $().plugin( 'methodName', { options } )
      // shift arguments by 1
      var args = arraySlice.call( arguments, 1 );
      return methodCall( this, arg0, args );
    }
    // just $().plugin({ options })
    plainCall( this, arg0 );
    return this;
  };

  // $().plugin('methodName')
  function methodCall( $elems, methodName, args ) {
    var returnValue;
    var pluginMethodStr = '$().' + namespace + '("' + methodName + '")';

    $elems.each( function( i, elem ) {
      // get instance
      var instance = $.data( elem, namespace );
      if ( !instance ) {
        logError( namespace + ' not initialized. Cannot call methods, i.e. ' +
          pluginMethodStr );
        return;
      }

      var method = instance[ methodName ];
      if ( !method || methodName.charAt(0) == '_' ) {
        logError( pluginMethodStr + ' is not a valid method' );
        return;
      }

      // apply method, get return value
      var value = method.apply( instance, args );
      // set return value if value is returned, use only first value
      returnValue = returnValue === undefined ? value : returnValue;
    });

    return returnValue !== undefined ? returnValue : $elems;
  }

  function plainCall( $elems, options ) {
    $elems.each( function( i, elem ) {
      var instance = $.data( elem, namespace );
      if ( instance ) {
        // set options & init
        instance.option( options );
        instance._init();
      } else {
        // initialize new instance
        instance = new PluginClass( elem, options );
        $.data( elem, namespace, instance );
      }
    });
  }

  updateJQuery( $ );

}

// ----- updateJQuery ----- //

// set $.bridget for v1 backwards compatibility
function updateJQuery( $ ) {
  if ( !$ || ( $ && $.bridget ) ) {
    return;
  }
  $.bridget = jQueryBridget;
}

updateJQuery( jQuery || window.jQuery );

// -----  ----- //

return jQueryBridget;

}));

/**
 * EvEmitter v1.0.3
 * Lil' event emitter
 * MIT License
 */

/* jshint unused: true, undef: true, strict: true */

( function( global, factory ) {
  // universal module definition
  /* jshint strict: false */ /* globals define, module, window */
  if ( typeof define == 'function' && define.amd ) {
    // AMD - RequireJS
    define( 'ev-emitter/ev-emitter',factory );
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS - Browserify, Webpack
    module.exports = factory();
  } else {
    // Browser globals
    global.EvEmitter = factory();
  }

}( typeof window != 'undefined' ? window : this, function() {



function EvEmitter() {}

var proto = EvEmitter.prototype;

proto.on = function( eventName, listener ) {
  if ( !eventName || !listener ) {
    return;
  }
  // set events hash
  var events = this._events = this._events || {};
  // set listeners array
  var listeners = events[ eventName ] = events[ eventName ] || [];
  // only add once
  if ( listeners.indexOf( listener ) == -1 ) {
    listeners.push( listener );
  }

  return this;
};

proto.once = function( eventName, listener ) {
  if ( !eventName || !listener ) {
    return;
  }
  // add event
  this.on( eventName, listener );
  // set once flag
  // set onceEvents hash
  var onceEvents = this._onceEvents = this._onceEvents || {};
  // set onceListeners object
  var onceListeners = onceEvents[ eventName ] = onceEvents[ eventName ] || {};
  // set flag
  onceListeners[ listener ] = true;

  return this;
};

proto.off = function( eventName, listener ) {
  var listeners = this._events && this._events[ eventName ];
  if ( !listeners || !listeners.length ) {
    return;
  }
  var index = listeners.indexOf( listener );
  if ( index != -1 ) {
    listeners.splice( index, 1 );
  }

  return this;
};

proto.emitEvent = function( eventName, args ) {
  var listeners = this._events && this._events[ eventName ];
  if ( !listeners || !listeners.length ) {
    return;
  }
  var i = 0;
  var listener = listeners[i];
  args = args || [];
  // once stuff
  var onceListeners = this._onceEvents && this._onceEvents[ eventName ];

  while ( listener ) {
    var isOnce = onceListeners && onceListeners[ listener ];
    if ( isOnce ) {
      // remove listener
      // remove before trigger to prevent recursion
      this.off( eventName, listener );
      // unset once flag
      delete onceListeners[ listener ];
    }
    // trigger listener
    listener.apply( this, args );
    // get next listener
    i += isOnce ? 0 : 1;
    listener = listeners[i];
  }

  return this;
};

return EvEmitter;

}));

/*!
 * getSize v2.0.2
 * measure size of elements
 * MIT license
 */

/*jshint browser: true, strict: true, undef: true, unused: true */
/*global define: false, module: false, console: false */

( function( window, factory ) {
  'use strict';

  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'get-size/get-size',[],function() {
      return factory();
    });
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory();
  } else {
    // browser global
    window.getSize = factory();
  }

})( window, function factory() {
'use strict';

// -------------------------- helpers -------------------------- //

// get a number from a string, not a percentage
function getStyleSize( value ) {
  var num = parseFloat( value );
  // not a percent like '100%', and a number
  var isValid = value.indexOf('%') == -1 && !isNaN( num );
  return isValid && num;
}

function noop() {}

var logError = typeof console == 'undefined' ? noop :
  function( message ) {
    console.error( message );
  };

// -------------------------- measurements -------------------------- //

var measurements = [
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'paddingBottom',
  'marginLeft',
  'marginRight',
  'marginTop',
  'marginBottom',
  'borderLeftWidth',
  'borderRightWidth',
  'borderTopWidth',
  'borderBottomWidth'
];

var measurementsLength = measurements.length;

function getZeroSize() {
  var size = {
    width: 0,
    height: 0,
    innerWidth: 0,
    innerHeight: 0,
    outerWidth: 0,
    outerHeight: 0
  };
  for ( var i=0; i < measurementsLength; i++ ) {
    var measurement = measurements[i];
    size[ measurement ] = 0;
  }
  return size;
}

// -------------------------- getStyle -------------------------- //

/**
 * getStyle, get style of element, check for Firefox bug
 * https://bugzilla.mozilla.org/show_bug.cgi?id=548397
 */
function getStyle( elem ) {
  var style = getComputedStyle( elem );
  if ( !style ) {
    logError( 'Style returned ' + style +
      '. Are you running this code in a hidden iframe on Firefox? ' +
      'See http://bit.ly/getsizebug1' );
  }
  return style;
}

// -------------------------- setup -------------------------- //

var isSetup = false;

var isBoxSizeOuter;

/**
 * setup
 * check isBoxSizerOuter
 * do on first getSize() rather than on page load for Firefox bug
 */
function setup() {
  // setup once
  if ( isSetup ) {
    return;
  }
  isSetup = true;

  // -------------------------- box sizing -------------------------- //

  /**
   * WebKit measures the outer-width on style.width on border-box elems
   * IE & Firefox<29 measures the inner-width
   */
  var div = document.createElement('div');
  div.style.width = '200px';
  div.style.padding = '1px 2px 3px 4px';
  div.style.borderStyle = 'solid';
  div.style.borderWidth = '1px 2px 3px 4px';
  div.style.boxSizing = 'border-box';

  var body = document.body || document.documentElement;
  body.appendChild( div );
  var style = getStyle( div );

  getSize.isBoxSizeOuter = isBoxSizeOuter = getStyleSize( style.width ) == 200;
  body.removeChild( div );

}

// -------------------------- getSize -------------------------- //

function getSize( elem ) {
  setup();

  // use querySeletor if elem is string
  if ( typeof elem == 'string' ) {
    elem = document.querySelector( elem );
  }

  // do not proceed on non-objects
  if ( !elem || typeof elem != 'object' || !elem.nodeType ) {
    return;
  }

  var style = getStyle( elem );

  // if hidden, everything is 0
  if ( style.display == 'none' ) {
    return getZeroSize();
  }

  var size = {};
  size.width = elem.offsetWidth;
  size.height = elem.offsetHeight;

  var isBorderBox = size.isBorderBox = style.boxSizing == 'border-box';

  // get all measurements
  for ( var i=0; i < measurementsLength; i++ ) {
    var measurement = measurements[i];
    var value = style[ measurement ];
    var num = parseFloat( value );
    // any 'auto', 'medium' value will be 0
    size[ measurement ] = !isNaN( num ) ? num : 0;
  }

  var paddingWidth = size.paddingLeft + size.paddingRight;
  var paddingHeight = size.paddingTop + size.paddingBottom;
  var marginWidth = size.marginLeft + size.marginRight;
  var marginHeight = size.marginTop + size.marginBottom;
  var borderWidth = size.borderLeftWidth + size.borderRightWidth;
  var borderHeight = size.borderTopWidth + size.borderBottomWidth;

  var isBorderBoxSizeOuter = isBorderBox && isBoxSizeOuter;

  // overwrite width and height if we can get it from style
  var styleWidth = getStyleSize( style.width );
  if ( styleWidth !== false ) {
    size.width = styleWidth +
      // add padding and border unless it's already including it
      ( isBorderBoxSizeOuter ? 0 : paddingWidth + borderWidth );
  }

  var styleHeight = getStyleSize( style.height );
  if ( styleHeight !== false ) {
    size.height = styleHeight +
      // add padding and border unless it's already including it
      ( isBorderBoxSizeOuter ? 0 : paddingHeight + borderHeight );
  }

  size.innerWidth = size.width - ( paddingWidth + borderWidth );
  size.innerHeight = size.height - ( paddingHeight + borderHeight );

  size.outerWidth = size.width + marginWidth;
  size.outerHeight = size.height + marginHeight;

  return size;
}

return getSize;

});

/**
 * matchesSelector v2.0.1
 * matchesSelector( element, '.selector' )
 * MIT license
 */

/*jshint browser: true, strict: true, undef: true, unused: true */

( function( window, factory ) {
  /*global define: false, module: false */
  'use strict';
  // universal module definition
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'desandro-matches-selector/matches-selector',factory );
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory();
  } else {
    // browser global
    window.matchesSelector = factory();
  }

}( window, function factory() {
  'use strict';

  var matchesMethod = ( function() {
    var ElemProto = Element.prototype;
    // check for the standard method name first
    if ( ElemProto.matches ) {
      return 'matches';
    }
    // check un-prefixed
    if ( ElemProto.matchesSelector ) {
      return 'matchesSelector';
    }
    // check vendor prefixes
    var prefixes = [ 'webkit', 'moz', 'ms', 'o' ];

    for ( var i=0; i < prefixes.length; i++ ) {
      var prefix = prefixes[i];
      var method = prefix + 'MatchesSelector';
      if ( ElemProto[ method ] ) {
        return method;
      }
    }
  })();

  return function matchesSelector( elem, selector ) {
    return elem[ matchesMethod ]( selector );
  };

}));

/**
 * Fizzy UI utils v2.0.2
 * MIT license
 */

/*jshint browser: true, undef: true, unused: true, strict: true */

( function( window, factory ) {
  // universal module definition
  /*jshint strict: false */ /*globals define, module, require */

  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'fizzy-ui-utils/utils',[
      'desandro-matches-selector/matches-selector'
    ], function( matchesSelector ) {
      return factory( window, matchesSelector );
    });
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      window,
      require('desandro-matches-selector')
    );
  } else {
    // browser global
    window.fizzyUIUtils = factory(
      window,
      window.matchesSelector
    );
  }

}( window, function factory( window, matchesSelector ) {



var utils = {};

// ----- extend ----- //

// extends objects
utils.extend = function( a, b ) {
  for ( var prop in b ) {
    a[ prop ] = b[ prop ];
  }
  return a;
};

// ----- modulo ----- //

utils.modulo = function( num, div ) {
  return ( ( num % div ) + div ) % div;
};

// ----- makeArray ----- //

// turn element or nodeList into an array
utils.makeArray = function( obj ) {
  var ary = [];
  if ( Array.isArray( obj ) ) {
    // use object if already an array
    ary = obj;
  } else if ( obj && typeof obj.length == 'number' ) {
    // convert nodeList to array
    for ( var i=0; i < obj.length; i++ ) {
      ary.push( obj[i] );
    }
  } else {
    // array of single index
    ary.push( obj );
  }
  return ary;
};

// ----- removeFrom ----- //

utils.removeFrom = function( ary, obj ) {
  var index = ary.indexOf( obj );
  if ( index != -1 ) {
    ary.splice( index, 1 );
  }
};

// ----- getParent ----- //

utils.getParent = function( elem, selector ) {
  while ( elem != document.body ) {
    elem = elem.parentNode;
    if ( matchesSelector( elem, selector ) ) {
      return elem;
    }
  }
};

// ----- getQueryElement ----- //

// use element as selector string
utils.getQueryElement = function( elem ) {
  if ( typeof elem == 'string' ) {
    return document.querySelector( elem );
  }
  return elem;
};

// ----- handleEvent ----- //

// enable .ontype to trigger from .addEventListener( elem, 'type' )
utils.handleEvent = function( event ) {
  var method = 'on' + event.type;
  if ( this[ method ] ) {
    this[ method ]( event );
  }
};

// ----- filterFindElements ----- //

utils.filterFindElements = function( elems, selector ) {
  // make array of elems
  elems = utils.makeArray( elems );
  var ffElems = [];

  elems.forEach( function( elem ) {
    // check that elem is an actual element
    if ( !( elem instanceof HTMLElement ) ) {
      return;
    }
    // add elem if no selector
    if ( !selector ) {
      ffElems.push( elem );
      return;
    }
    // filter & find items if we have a selector
    // filter
    if ( matchesSelector( elem, selector ) ) {
      ffElems.push( elem );
    }
    // find children
    var childElems = elem.querySelectorAll( selector );
    // concat childElems to filterFound array
    for ( var i=0; i < childElems.length; i++ ) {
      ffElems.push( childElems[i] );
    }
  });

  return ffElems;
};

// ----- debounceMethod ----- //

utils.debounceMethod = function( _class, methodName, threshold ) {
  // original method
  var method = _class.prototype[ methodName ];
  var timeoutName = methodName + 'Timeout';

  _class.prototype[ methodName ] = function() {
    var timeout = this[ timeoutName ];
    if ( timeout ) {
      clearTimeout( timeout );
    }
    var args = arguments;

    var _this = this;
    this[ timeoutName ] = setTimeout( function() {
      method.apply( _this, args );
      delete _this[ timeoutName ];
    }, threshold || 100 );
  };
};

// ----- docReady ----- //

utils.docReady = function( callback ) {
  var readyState = document.readyState;
  if ( readyState == 'complete' || readyState == 'interactive' ) {
    callback();
  } else {
    document.addEventListener( 'DOMContentLoaded', callback );
  }
};

// ----- htmlInit ----- //

// http://jamesroberts.name/blog/2010/02/22/string-functions-for-javascript-trim-to-camel-case-to-dashed-and-to-underscore/
utils.toDashed = function( str ) {
  return str.replace( /(.)([A-Z])/g, function( match, $1, $2 ) {
    return $1 + '-' + $2;
  }).toLowerCase();
};

var console = window.console;
/**
 * allow user to initialize classes via [data-namespace] or .js-namespace class
 * htmlInit( Widget, 'widgetName' )
 * options are parsed from data-namespace-options
 */
utils.htmlInit = function( WidgetClass, namespace ) {
  utils.docReady( function() {
    var dashedNamespace = utils.toDashed( namespace );
    var dataAttr = 'data-' + dashedNamespace;
    var dataAttrElems = document.querySelectorAll( '[' + dataAttr + ']' );
    var jsDashElems = document.querySelectorAll( '.js-' + dashedNamespace );
    var elems = utils.makeArray( dataAttrElems )
      .concat( utils.makeArray( jsDashElems ) );
    var dataOptionsAttr = dataAttr + '-options';
    var jQuery = window.jQuery;

    elems.forEach( function( elem ) {
      var attr = elem.getAttribute( dataAttr ) ||
        elem.getAttribute( dataOptionsAttr );
      var options;
      try {
        options = attr && JSON.parse( attr );
      } catch ( error ) {
        // log error, do not initialize
        if ( console ) {
          console.error( 'Error parsing ' + dataAttr + ' on ' + elem.className +
          ': ' + error );
        }
        return;
      }
      // initialize
      var instance = new WidgetClass( elem, options );
      // make available via $().data('layoutname')
      if ( jQuery ) {
        jQuery.data( elem, namespace, instance );
      }
    });

  });
};

// -----  ----- //

return utils;

}));

/**
 * Outlayer Item
 */

( function( window, factory ) {
  // universal module definition
  /* jshint strict: false */ /* globals define, module, require */
  if ( typeof define == 'function' && define.amd ) {
    // AMD - RequireJS
    define( 'outlayer/item',[
        'ev-emitter/ev-emitter',
        'get-size/get-size'
      ],
      factory
    );
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS - Browserify, Webpack
    module.exports = factory(
      require('ev-emitter'),
      require('get-size')
    );
  } else {
    // browser global
    window.Outlayer = {};
    window.Outlayer.Item = factory(
      window.EvEmitter,
      window.getSize
    );
  }

}( window, function factory( EvEmitter, getSize ) {
'use strict';

// ----- helpers ----- //

function isEmptyObj( obj ) {
  for ( var prop in obj ) {
    return false;
  }
  prop = null;
  return true;
}

// -------------------------- CSS3 support -------------------------- //


var docElemStyle = document.documentElement.style;

var transitionProperty = typeof docElemStyle.transition == 'string' ?
  'transition' : 'WebkitTransition';
var transformProperty = typeof docElemStyle.transform == 'string' ?
  'transform' : 'WebkitTransform';

var transitionEndEvent = {
  WebkitTransition: 'webkitTransitionEnd',
  transition: 'transitionend'
}[ transitionProperty ];

// cache all vendor properties that could have vendor prefix
var vendorProperties = {
  transform: transformProperty,
  transition: transitionProperty,
  transitionDuration: transitionProperty + 'Duration',
  transitionProperty: transitionProperty + 'Property',
  transitionDelay: transitionProperty + 'Delay'
};

// -------------------------- Item -------------------------- //

function Item( element, layout ) {
  if ( !element ) {
    return;
  }

  this.element = element;
  // parent layout class, i.e. Masonry, Isotope, or Packery
  this.layout = layout;
  this.position = {
    x: 0,
    y: 0
  };

  this._create();
}

// inherit EvEmitter
var proto = Item.prototype = Object.create( EvEmitter.prototype );
proto.constructor = Item;

proto._create = function() {
  // transition objects
  this._transn = {
    ingProperties: {},
    clean: {},
    onEnd: {}
  };

  this.css({
    position: 'absolute'
  });
};

// trigger specified handler for event type
proto.handleEvent = function( event ) {
  var method = 'on' + event.type;
  if ( this[ method ] ) {
    this[ method ]( event );
  }
};

proto.getSize = function() {
  this.size = getSize( this.element );
};

/**
 * apply CSS styles to element
 * @param {Object} style
 */
proto.css = function( style ) {
  var elemStyle = this.element.style;

  for ( var prop in style ) {
    // use vendor property if available
    var supportedProp = vendorProperties[ prop ] || prop;
    elemStyle[ supportedProp ] = style[ prop ];
  }
};

 // measure position, and sets it
proto.getPosition = function() {
  var style = getComputedStyle( this.element );
  var isOriginLeft = this.layout._getOption('originLeft');
  var isOriginTop = this.layout._getOption('originTop');
  var xValue = style[ isOriginLeft ? 'left' : 'right' ];
  var yValue = style[ isOriginTop ? 'top' : 'bottom' ];
  // convert percent to pixels
  var layoutSize = this.layout.size;
  var x = xValue.indexOf('%') != -1 ?
    ( parseFloat( xValue ) / 100 ) * layoutSize.width : parseInt( xValue, 10 );
  var y = yValue.indexOf('%') != -1 ?
    ( parseFloat( yValue ) / 100 ) * layoutSize.height : parseInt( yValue, 10 );

  // clean up 'auto' or other non-integer values
  x = isNaN( x ) ? 0 : x;
  y = isNaN( y ) ? 0 : y;
  // remove padding from measurement
  x -= isOriginLeft ? layoutSize.paddingLeft : layoutSize.paddingRight;
  y -= isOriginTop ? layoutSize.paddingTop : layoutSize.paddingBottom;

  this.position.x = x;
  this.position.y = y;
};

// set settled position, apply padding
proto.layoutPosition = function() {
  var layoutSize = this.layout.size;
  var style = {};
  var isOriginLeft = this.layout._getOption('originLeft');
  var isOriginTop = this.layout._getOption('originTop');

  // x
  var xPadding = isOriginLeft ? 'paddingLeft' : 'paddingRight';
  var xProperty = isOriginLeft ? 'left' : 'right';
  var xResetProperty = isOriginLeft ? 'right' : 'left';

  var x = this.position.x + layoutSize[ xPadding ];
  // set in percentage or pixels
  style[ xProperty ] = this.getXValue( x );
  // reset other property
  style[ xResetProperty ] = '';

  // y
  var yPadding = isOriginTop ? 'paddingTop' : 'paddingBottom';
  var yProperty = isOriginTop ? 'top' : 'bottom';
  var yResetProperty = isOriginTop ? 'bottom' : 'top';

  var y = this.position.y + layoutSize[ yPadding ];
  // set in percentage or pixels
  style[ yProperty ] = this.getYValue( y );
  // reset other property
  style[ yResetProperty ] = '';

  this.css( style );
  this.emitEvent( 'layout', [ this ] );
};

proto.getXValue = function( x ) {
  var isHorizontal = this.layout._getOption('horizontal');
  return this.layout.options.percentPosition && !isHorizontal ?
    ( ( x / this.layout.size.width ) * 100 ) + '%' : x + 'px';
};

proto.getYValue = function( y ) {
  var isHorizontal = this.layout._getOption('horizontal');
  return this.layout.options.percentPosition && isHorizontal ?
    ( ( y / this.layout.size.height ) * 100 ) + '%' : y + 'px';
};

proto._transitionTo = function( x, y ) {
  this.getPosition();
  // get current x & y from top/left
  var curX = this.position.x;
  var curY = this.position.y;

  var compareX = parseInt( x, 10 );
  var compareY = parseInt( y, 10 );
  var didNotMove = compareX === this.position.x && compareY === this.position.y;

  // save end position
  this.setPosition( x, y );

  // if did not move and not transitioning, just go to layout
  if ( didNotMove && !this.isTransitioning ) {
    this.layoutPosition();
    return;
  }

  var transX = x - curX;
  var transY = y - curY;
  var transitionStyle = {};
  transitionStyle.transform = this.getTranslate( transX, transY );

  this.transition({
    to: transitionStyle,
    onTransitionEnd: {
      transform: this.layoutPosition
    },
    isCleaning: true
  });
};

proto.getTranslate = function( x, y ) {
  // flip cooridinates if origin on right or bottom
  var isOriginLeft = this.layout._getOption('originLeft');
  var isOriginTop = this.layout._getOption('originTop');
  x = isOriginLeft ? x : -x;
  y = isOriginTop ? y : -y;
  return 'translate3d(' + x + 'px, ' + y + 'px, 0)';
};

// non transition + transform support
proto.goTo = function( x, y ) {
  this.setPosition( x, y );
  this.layoutPosition();
};

proto.moveTo = proto._transitionTo;

proto.setPosition = function( x, y ) {
  this.position.x = parseInt( x, 10 );
  this.position.y = parseInt( y, 10 );
};

// ----- transition ----- //

/**
 * @param {Object} style - CSS
 * @param {Function} onTransitionEnd
 */

// non transition, just trigger callback
proto._nonTransition = function( args ) {
  this.css( args.to );
  if ( args.isCleaning ) {
    this._removeStyles( args.to );
  }
  for ( var prop in args.onTransitionEnd ) {
    args.onTransitionEnd[ prop ].call( this );
  }
};

/**
 * proper transition
 * @param {Object} args - arguments
 *   @param {Object} to - style to transition to
 *   @param {Object} from - style to start transition from
 *   @param {Boolean} isCleaning - removes transition styles after transition
 *   @param {Function} onTransitionEnd - callback
 */
proto.transition = function( args ) {
  // redirect to nonTransition if no transition duration
  if ( !parseFloat( this.layout.options.transitionDuration ) ) {
    this._nonTransition( args );
    return;
  }

  var _transition = this._transn;
  // keep track of onTransitionEnd callback by css property
  for ( var prop in args.onTransitionEnd ) {
    _transition.onEnd[ prop ] = args.onTransitionEnd[ prop ];
  }
  // keep track of properties that are transitioning
  for ( prop in args.to ) {
    _transition.ingProperties[ prop ] = true;
    // keep track of properties to clean up when transition is done
    if ( args.isCleaning ) {
      _transition.clean[ prop ] = true;
    }
  }

  // set from styles
  if ( args.from ) {
    this.css( args.from );
    // force redraw. http://blog.alexmaccaw.com/css-transitions
    var h = this.element.offsetHeight;
    // hack for JSHint to hush about unused var
    h = null;
  }
  // enable transition
  this.enableTransition( args.to );
  // set styles that are transitioning
  this.css( args.to );

  this.isTransitioning = true;

};

// dash before all cap letters, including first for
// WebkitTransform => -webkit-transform
function toDashedAll( str ) {
  return str.replace( /([A-Z])/g, function( $1 ) {
    return '-' + $1.toLowerCase();
  });
}

var transitionProps = 'opacity,' + toDashedAll( transformProperty );

proto.enableTransition = function(/* style */) {
  // HACK changing transitionProperty during a transition
  // will cause transition to jump
  if ( this.isTransitioning ) {
    return;
  }

  // make `transition: foo, bar, baz` from style object
  // HACK un-comment this when enableTransition can work
  // while a transition is happening
  // var transitionValues = [];
  // for ( var prop in style ) {
  //   // dash-ify camelCased properties like WebkitTransition
  //   prop = vendorProperties[ prop ] || prop;
  //   transitionValues.push( toDashedAll( prop ) );
  // }
  // munge number to millisecond, to match stagger
  var duration = this.layout.options.transitionDuration;
  duration = typeof duration == 'number' ? duration + 'ms' : duration;
  // enable transition styles
  this.css({
    transitionProperty: transitionProps,
    transitionDuration: duration,
    transitionDelay: this.staggerDelay || 0
  });
  // listen for transition end event
  this.element.addEventListener( transitionEndEvent, this, false );
};

// ----- events ----- //

proto.onwebkitTransitionEnd = function( event ) {
  this.ontransitionend( event );
};

proto.onotransitionend = function( event ) {
  this.ontransitionend( event );
};

// properties that I munge to make my life easier
var dashedVendorProperties = {
  '-webkit-transform': 'transform'
};

proto.ontransitionend = function( event ) {
  // disregard bubbled events from children
  if ( event.target !== this.element ) {
    return;
  }
  var _transition = this._transn;
  // get property name of transitioned property, convert to prefix-free
  var propertyName = dashedVendorProperties[ event.propertyName ] || event.propertyName;

  // remove property that has completed transitioning
  delete _transition.ingProperties[ propertyName ];
  // check if any properties are still transitioning
  if ( isEmptyObj( _transition.ingProperties ) ) {
    // all properties have completed transitioning
    this.disableTransition();
  }
  // clean style
  if ( propertyName in _transition.clean ) {
    // clean up style
    this.element.style[ event.propertyName ] = '';
    delete _transition.clean[ propertyName ];
  }
  // trigger onTransitionEnd callback
  if ( propertyName in _transition.onEnd ) {
    var onTransitionEnd = _transition.onEnd[ propertyName ];
    onTransitionEnd.call( this );
    delete _transition.onEnd[ propertyName ];
  }

  this.emitEvent( 'transitionEnd', [ this ] );
};

proto.disableTransition = function() {
  this.removeTransitionStyles();
  this.element.removeEventListener( transitionEndEvent, this, false );
  this.isTransitioning = false;
};

/**
 * removes style property from element
 * @param {Object} style
**/
proto._removeStyles = function( style ) {
  // clean up transition styles
  var cleanStyle = {};
  for ( var prop in style ) {
    cleanStyle[ prop ] = '';
  }
  this.css( cleanStyle );
};

var cleanTransitionStyle = {
  transitionProperty: '',
  transitionDuration: '',
  transitionDelay: ''
};

proto.removeTransitionStyles = function() {
  // remove transition
  this.css( cleanTransitionStyle );
};

// ----- stagger ----- //

proto.stagger = function( delay ) {
  delay = isNaN( delay ) ? 0 : delay;
  this.staggerDelay = delay + 'ms';
};

// ----- show/hide/remove ----- //

// remove element from DOM
proto.removeElem = function() {
  this.element.parentNode.removeChild( this.element );
  // remove display: none
  this.css({ display: '' });
  this.emitEvent( 'remove', [ this ] );
};

proto.remove = function() {
  // just remove element if no transition support or no transition
  if ( !transitionProperty || !parseFloat( this.layout.options.transitionDuration ) ) {
    this.removeElem();
    return;
  }

  // start transition
  this.once( 'transitionEnd', function() {
    this.removeElem();
  });
  this.hide();
};

proto.reveal = function() {
  delete this.isHidden;
  // remove display: none
  this.css({ display: '' });

  var options = this.layout.options;

  var onTransitionEnd = {};
  var transitionEndProperty = this.getHideRevealTransitionEndProperty('visibleStyle');
  onTransitionEnd[ transitionEndProperty ] = this.onRevealTransitionEnd;

  this.transition({
    from: options.hiddenStyle,
    to: options.visibleStyle,
    isCleaning: true,
    onTransitionEnd: onTransitionEnd
  });
};

proto.onRevealTransitionEnd = function() {
  // check if still visible
  // during transition, item may have been hidden
  if ( !this.isHidden ) {
    this.emitEvent('reveal');
  }
};

/**
 * get style property use for hide/reveal transition end
 * @param {String} styleProperty - hiddenStyle/visibleStyle
 * @returns {String}
 */
proto.getHideRevealTransitionEndProperty = function( styleProperty ) {
  var optionStyle = this.layout.options[ styleProperty ];
  // use opacity
  if ( optionStyle.opacity ) {
    return 'opacity';
  }
  // get first property
  for ( var prop in optionStyle ) {
    return prop;
  }
};

proto.hide = function() {
  // set flag
  this.isHidden = true;
  // remove display: none
  this.css({ display: '' });

  var options = this.layout.options;

  var onTransitionEnd = {};
  var transitionEndProperty = this.getHideRevealTransitionEndProperty('hiddenStyle');
  onTransitionEnd[ transitionEndProperty ] = this.onHideTransitionEnd;

  this.transition({
    from: options.visibleStyle,
    to: options.hiddenStyle,
    // keep hidden stuff hidden
    isCleaning: true,
    onTransitionEnd: onTransitionEnd
  });
};

proto.onHideTransitionEnd = function() {
  // check if still hidden
  // during transition, item may have been un-hidden
  if ( this.isHidden ) {
    this.css({ display: 'none' });
    this.emitEvent('hide');
  }
};

proto.destroy = function() {
  this.css({
    position: '',
    left: '',
    right: '',
    top: '',
    bottom: '',
    transition: '',
    transform: ''
  });
};

return Item;

}));

/*!
 * Outlayer v2.1.0
 * the brains and guts of a layout library
 * MIT license
 */

( function( window, factory ) {
  'use strict';
  // universal module definition
  /* jshint strict: false */ /* globals define, module, require */
  if ( typeof define == 'function' && define.amd ) {
    // AMD - RequireJS
    define( 'outlayer/outlayer',[
        'ev-emitter/ev-emitter',
        'get-size/get-size',
        'fizzy-ui-utils/utils',
        './item'
      ],
      function( EvEmitter, getSize, utils, Item ) {
        return factory( window, EvEmitter, getSize, utils, Item);
      }
    );
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS - Browserify, Webpack
    module.exports = factory(
      window,
      require('ev-emitter'),
      require('get-size'),
      require('fizzy-ui-utils'),
      require('./item')
    );
  } else {
    // browser global
    window.Outlayer = factory(
      window,
      window.EvEmitter,
      window.getSize,
      window.fizzyUIUtils,
      window.Outlayer.Item
    );
  }

}( window, function factory( window, EvEmitter, getSize, utils, Item ) {
'use strict';

// ----- vars ----- //

var console = window.console;
var jQuery = window.jQuery;
var noop = function() {};

// -------------------------- Outlayer -------------------------- //

// globally unique identifiers
var GUID = 0;
// internal store of all Outlayer intances
var instances = {};


/**
 * @param {Element, String} element
 * @param {Object} options
 * @constructor
 */
function Outlayer( element, options ) {
  var queryElement = utils.getQueryElement( element );
  if ( !queryElement ) {
    if ( console ) {
      console.error( 'Bad element for ' + this.constructor.namespace +
        ': ' + ( queryElement || element ) );
    }
    return;
  }
  this.element = queryElement;
  // add jQuery
  if ( jQuery ) {
    this.$element = jQuery( this.element );
  }

  // options
  this.options = utils.extend( {}, this.constructor.defaults );
  this.option( options );

  // add id for Outlayer.getFromElement
  var id = ++GUID;
  this.element.outlayerGUID = id; // expando
  instances[ id ] = this; // associate via id

  // kick it off
  this._create();

  var isInitLayout = this._getOption('initLayout');
  if ( isInitLayout ) {
    this.layout();
  }
}

// settings are for internal use only
Outlayer.namespace = 'outlayer';
Outlayer.Item = Item;

// default options
Outlayer.defaults = {
  containerStyle: {
    position: 'relative'
  },
  initLayout: true,
  originLeft: true,
  originTop: true,
  resize: true,
  resizeContainer: true,
  // item options
  transitionDuration: '0.4s',
  hiddenStyle: {
    opacity: 0,
    transform: 'scale(0.001)'
  },
  visibleStyle: {
    opacity: 1,
    transform: 'scale(1)'
  }
};

var proto = Outlayer.prototype;
// inherit EvEmitter
utils.extend( proto, EvEmitter.prototype );

/**
 * set options
 * @param {Object} opts
 */
proto.option = function( opts ) {
  utils.extend( this.options, opts );
};

/**
 * get backwards compatible option value, check old name
 */
proto._getOption = function( option ) {
  var oldOption = this.constructor.compatOptions[ option ];
  return oldOption && this.options[ oldOption ] !== undefined ?
    this.options[ oldOption ] : this.options[ option ];
};

Outlayer.compatOptions = {
  // currentName: oldName
  initLayout: 'isInitLayout',
  horizontal: 'isHorizontal',
  layoutInstant: 'isLayoutInstant',
  originLeft: 'isOriginLeft',
  originTop: 'isOriginTop',
  resize: 'isResizeBound',
  resizeContainer: 'isResizingContainer'
};

proto._create = function() {
  // get items from children
  this.reloadItems();
  // elements that affect layout, but are not laid out
  this.stamps = [];
  this.stamp( this.options.stamp );
  // set container style
  utils.extend( this.element.style, this.options.containerStyle );

  // bind resize method
  var canBindResize = this._getOption('resize');
  if ( canBindResize ) {
    this.bindResize();
  }
};

// goes through all children again and gets bricks in proper order
proto.reloadItems = function() {
  // collection of item elements
  this.items = this._itemize( this.element.children );
};


/**
 * turn elements into Outlayer.Items to be used in layout
 * @param {Array or NodeList or HTMLElement} elems
 * @returns {Array} items - collection of new Outlayer Items
 */
proto._itemize = function( elems ) {

  var itemElems = this._filterFindItemElements( elems );
  var Item = this.constructor.Item;

  // create new Outlayer Items for collection
  var items = [];
  for ( var i=0; i < itemElems.length; i++ ) {
    var elem = itemElems[i];
    var item = new Item( elem, this );
    items.push( item );
  }

  return items;
};

/**
 * get item elements to be used in layout
 * @param {Array or NodeList or HTMLElement} elems
 * @returns {Array} items - item elements
 */
proto._filterFindItemElements = function( elems ) {
  return utils.filterFindElements( elems, this.options.itemSelector );
};

/**
 * getter method for getting item elements
 * @returns {Array} elems - collection of item elements
 */
proto.getItemElements = function() {
  return this.items.map( function( item ) {
    return item.element;
  });
};

// ----- init & layout ----- //

/**
 * lays out all items
 */
proto.layout = function() {
  this._resetLayout();
  this._manageStamps();

  // don't animate first layout
  var layoutInstant = this._getOption('layoutInstant');
  var isInstant = layoutInstant !== undefined ?
    layoutInstant : !this._isLayoutInited;
  this.layoutItems( this.items, isInstant );

  // flag for initalized
  this._isLayoutInited = true;
};

// _init is alias for layout
proto._init = proto.layout;

/**
 * logic before any new layout
 */
proto._resetLayout = function() {
  this.getSize();
};


proto.getSize = function() {
  this.size = getSize( this.element );
};

/**
 * get measurement from option, for columnWidth, rowHeight, gutter
 * if option is String -> get element from selector string, & get size of element
 * if option is Element -> get size of element
 * else use option as a number
 *
 * @param {String} measurement
 * @param {String} size - width or height
 * @private
 */
proto._getMeasurement = function( measurement, size ) {
  var option = this.options[ measurement ];
  var elem;
  if ( !option ) {
    // default to 0
    this[ measurement ] = 0;
  } else {
    // use option as an element
    if ( typeof option == 'string' ) {
      elem = this.element.querySelector( option );
    } else if ( option instanceof HTMLElement ) {
      elem = option;
    }
    // use size of element, if element
    this[ measurement ] = elem ? getSize( elem )[ size ] : option;
  }
};

/**
 * layout a collection of item elements
 * @api public
 */
proto.layoutItems = function( items, isInstant ) {
  items = this._getItemsForLayout( items );

  this._layoutItems( items, isInstant );

  this._postLayout();
};

/**
 * get the items to be laid out
 * you may want to skip over some items
 * @param {Array} items
 * @returns {Array} items
 */
proto._getItemsForLayout = function( items ) {
  return items.filter( function( item ) {
    return !item.isIgnored;
  });
};

/**
 * layout items
 * @param {Array} items
 * @param {Boolean} isInstant
 */
proto._layoutItems = function( items, isInstant ) {
  this._emitCompleteOnItems( 'layout', items );

  if ( !items || !items.length ) {
    // no items, emit event with empty array
    return;
  }

  var queue = [];

  items.forEach( function( item ) {
    // get x/y object from method
    var position = this._getItemLayoutPosition( item );
    // enqueue
    position.item = item;
    position.isInstant = isInstant || item.isLayoutInstant;
    queue.push( position );
  }, this );

  this._processLayoutQueue( queue );
};

/**
 * get item layout position
 * @param {Outlayer.Item} item
 * @returns {Object} x and y position
 */
proto._getItemLayoutPosition = function( /* item */ ) {
  return {
    x: 0,
    y: 0
  };
};

/**
 * iterate over array and position each item
 * Reason being - separating this logic prevents 'layout invalidation'
 * thx @paul_irish
 * @param {Array} queue
 */
proto._processLayoutQueue = function( queue ) {
  this.updateStagger();
  queue.forEach( function( obj, i ) {
    this._positionItem( obj.item, obj.x, obj.y, obj.isInstant, i );
  }, this );
};

// set stagger from option in milliseconds number
proto.updateStagger = function() {
  var stagger = this.options.stagger;
  if ( stagger === null || stagger === undefined ) {
    this.stagger = 0;
    return;
  }
  this.stagger = getMilliseconds( stagger );
  return this.stagger;
};

/**
 * Sets position of item in DOM
 * @param {Outlayer.Item} item
 * @param {Number} x - horizontal position
 * @param {Number} y - vertical position
 * @param {Boolean} isInstant - disables transitions
 */
proto._positionItem = function( item, x, y, isInstant, i ) {
  if ( isInstant ) {
    // if not transition, just set CSS
    item.goTo( x, y );
  } else {
    item.stagger( i * this.stagger );
    item.moveTo( x, y );
  }
};

/**
 * Any logic you want to do after each layout,
 * i.e. size the container
 */
proto._postLayout = function() {
  this.resizeContainer();
};

proto.resizeContainer = function() {
  var isResizingContainer = this._getOption('resizeContainer');
  if ( !isResizingContainer ) {
    return;
  }
  var size = this._getContainerSize();
  if ( size ) {
    this._setContainerMeasure( size.width, true );
    this._setContainerMeasure( size.height, false );
  }
};

/**
 * Sets width or height of container if returned
 * @returns {Object} size
 *   @param {Number} width
 *   @param {Number} height
 */
proto._getContainerSize = noop;

/**
 * @param {Number} measure - size of width or height
 * @param {Boolean} isWidth
 */
proto._setContainerMeasure = function( measure, isWidth ) {
  if ( measure === undefined ) {
    return;
  }

  var elemSize = this.size;
  // add padding and border width if border box
  if ( elemSize.isBorderBox ) {
    measure += isWidth ? elemSize.paddingLeft + elemSize.paddingRight +
      elemSize.borderLeftWidth + elemSize.borderRightWidth :
      elemSize.paddingBottom + elemSize.paddingTop +
      elemSize.borderTopWidth + elemSize.borderBottomWidth;
  }

  measure = Math.max( measure, 0 );
  this.element.style[ isWidth ? 'width' : 'height' ] = measure + 'px';
};

/**
 * emit eventComplete on a collection of items events
 * @param {String} eventName
 * @param {Array} items - Outlayer.Items
 */
proto._emitCompleteOnItems = function( eventName, items ) {
  var _this = this;
  function onComplete() {
    _this.dispatchEvent( eventName + 'Complete', null, [ items ] );
  }

  var count = items.length;
  if ( !items || !count ) {
    onComplete();
    return;
  }

  var doneCount = 0;
  function tick() {
    doneCount++;
    if ( doneCount == count ) {
      onComplete();
    }
  }

  // bind callback
  items.forEach( function( item ) {
    item.once( eventName, tick );
  });
};

/**
 * emits events via EvEmitter and jQuery events
 * @param {String} type - name of event
 * @param {Event} event - original event
 * @param {Array} args - extra arguments
 */
proto.dispatchEvent = function( type, event, args ) {
  // add original event to arguments
  var emitArgs = event ? [ event ].concat( args ) : args;
  this.emitEvent( type, emitArgs );

  if ( jQuery ) {
    // set this.$element
    this.$element = this.$element || jQuery( this.element );
    if ( event ) {
      // create jQuery event
      var $event = jQuery.Event( event );
      $event.type = type;
      this.$element.trigger( $event, args );
    } else {
      // just trigger with type if no event available
      this.$element.trigger( type, args );
    }
  }
};

// -------------------------- ignore & stamps -------------------------- //


/**
 * keep item in collection, but do not lay it out
 * ignored items do not get skipped in layout
 * @param {Element} elem
 */
proto.ignore = function( elem ) {
  var item = this.getItem( elem );
  if ( item ) {
    item.isIgnored = true;
  }
};

/**
 * return item to layout collection
 * @param {Element} elem
 */
proto.unignore = function( elem ) {
  var item = this.getItem( elem );
  if ( item ) {
    delete item.isIgnored;
  }
};

/**
 * adds elements to stamps
 * @param {NodeList, Array, Element, or String} elems
 */
proto.stamp = function( elems ) {
  elems = this._find( elems );
  if ( !elems ) {
    return;
  }

  this.stamps = this.stamps.concat( elems );
  // ignore
  elems.forEach( this.ignore, this );
};

/**
 * removes elements to stamps
 * @param {NodeList, Array, or Element} elems
 */
proto.unstamp = function( elems ) {
  elems = this._find( elems );
  if ( !elems ){
    return;
  }

  elems.forEach( function( elem ) {
    // filter out removed stamp elements
    utils.removeFrom( this.stamps, elem );
    this.unignore( elem );
  }, this );
};

/**
 * finds child elements
 * @param {NodeList, Array, Element, or String} elems
 * @returns {Array} elems
 */
proto._find = function( elems ) {
  if ( !elems ) {
    return;
  }
  // if string, use argument as selector string
  if ( typeof elems == 'string' ) {
    elems = this.element.querySelectorAll( elems );
  }
  elems = utils.makeArray( elems );
  return elems;
};

proto._manageStamps = function() {
  if ( !this.stamps || !this.stamps.length ) {
    return;
  }

  this._getBoundingRect();

  this.stamps.forEach( this._manageStamp, this );
};

// update boundingLeft / Top
proto._getBoundingRect = function() {
  // get bounding rect for container element
  var boundingRect = this.element.getBoundingClientRect();
  var size = this.size;
  this._boundingRect = {
    left: boundingRect.left + size.paddingLeft + size.borderLeftWidth,
    top: boundingRect.top + size.paddingTop + size.borderTopWidth,
    right: boundingRect.right - ( size.paddingRight + size.borderRightWidth ),
    bottom: boundingRect.bottom - ( size.paddingBottom + size.borderBottomWidth )
  };
};

/**
 * @param {Element} stamp
**/
proto._manageStamp = noop;

/**
 * get x/y position of element relative to container element
 * @param {Element} elem
 * @returns {Object} offset - has left, top, right, bottom
 */
proto._getElementOffset = function( elem ) {
  var boundingRect = elem.getBoundingClientRect();
  var thisRect = this._boundingRect;
  var size = getSize( elem );
  var offset = {
    left: boundingRect.left - thisRect.left - size.marginLeft,
    top: boundingRect.top - thisRect.top - size.marginTop,
    right: thisRect.right - boundingRect.right - size.marginRight,
    bottom: thisRect.bottom - boundingRect.bottom - size.marginBottom
  };
  return offset;
};

// -------------------------- resize -------------------------- //

// enable event handlers for listeners
// i.e. resize -> onresize
proto.handleEvent = utils.handleEvent;

/**
 * Bind layout to window resizing
 */
proto.bindResize = function() {
  window.addEventListener( 'resize', this );
  this.isResizeBound = true;
};

/**
 * Unbind layout to window resizing
 */
proto.unbindResize = function() {
  window.removeEventListener( 'resize', this );
  this.isResizeBound = false;
};

proto.onresize = function() {
  this.resize();
};

utils.debounceMethod( Outlayer, 'onresize', 100 );

proto.resize = function() {
  // don't trigger if size did not change
  // or if resize was unbound. See #9
  if ( !this.isResizeBound || !this.needsResizeLayout() ) {
    return;
  }

  this.layout();
};

/**
 * check if layout is needed post layout
 * @returns Boolean
 */
proto.needsResizeLayout = function() {
  var size = getSize( this.element );
  // check that this.size and size are there
  // IE8 triggers resize on body size change, so they might not be
  var hasSizes = this.size && size;
  return hasSizes && size.innerWidth !== this.size.innerWidth;
};

// -------------------------- methods -------------------------- //

/**
 * add items to Outlayer instance
 * @param {Array or NodeList or Element} elems
 * @returns {Array} items - Outlayer.Items
**/
proto.addItems = function( elems ) {
  var items = this._itemize( elems );
  // add items to collection
  if ( items.length ) {
    this.items = this.items.concat( items );
  }
  return items;
};

/**
 * Layout newly-appended item elements
 * @param {Array or NodeList or Element} elems
 */
proto.appended = function( elems ) {
  var items = this.addItems( elems );
  if ( !items.length ) {
    return;
  }
  // layout and reveal just the new items
  this.layoutItems( items, true );
  this.reveal( items );
};

/**
 * Layout prepended elements
 * @param {Array or NodeList or Element} elems
 */
proto.prepended = function( elems ) {
  var items = this._itemize( elems );
  if ( !items.length ) {
    return;
  }
  // add items to beginning of collection
  var previousItems = this.items.slice(0);
  this.items = items.concat( previousItems );
  // start new layout
  this._resetLayout();
  this._manageStamps();
  // layout new stuff without transition
  this.layoutItems( items, true );
  this.reveal( items );
  // layout previous items
  this.layoutItems( previousItems );
};

/**
 * reveal a collection of items
 * @param {Array of Outlayer.Items} items
 */
proto.reveal = function( items ) {
  this._emitCompleteOnItems( 'reveal', items );
  if ( !items || !items.length ) {
    return;
  }
  var stagger = this.updateStagger();
  items.forEach( function( item, i ) {
    item.stagger( i * stagger );
    item.reveal();
  });
};

/**
 * hide a collection of items
 * @param {Array of Outlayer.Items} items
 */
proto.hide = function( items ) {
  this._emitCompleteOnItems( 'hide', items );
  if ( !items || !items.length ) {
    return;
  }
  var stagger = this.updateStagger();
  items.forEach( function( item, i ) {
    item.stagger( i * stagger );
    item.hide();
  });
};

/**
 * reveal item elements
 * @param {Array}, {Element}, {NodeList} items
 */
proto.revealItemElements = function( elems ) {
  var items = this.getItems( elems );
  this.reveal( items );
};

/**
 * hide item elements
 * @param {Array}, {Element}, {NodeList} items
 */
proto.hideItemElements = function( elems ) {
  var items = this.getItems( elems );
  this.hide( items );
};

/**
 * get Outlayer.Item, given an Element
 * @param {Element} elem
 * @param {Function} callback
 * @returns {Outlayer.Item} item
 */
proto.getItem = function( elem ) {
  // loop through items to get the one that matches
  for ( var i=0; i < this.items.length; i++ ) {
    var item = this.items[i];
    if ( item.element == elem ) {
      // return item
      return item;
    }
  }
};

/**
 * get collection of Outlayer.Items, given Elements
 * @param {Array} elems
 * @returns {Array} items - Outlayer.Items
 */
proto.getItems = function( elems ) {
  elems = utils.makeArray( elems );
  var items = [];
  elems.forEach( function( elem ) {
    var item = this.getItem( elem );
    if ( item ) {
      items.push( item );
    }
  }, this );

  return items;
};

/**
 * remove element(s) from instance and DOM
 * @param {Array or NodeList or Element} elems
 */
proto.remove = function( elems ) {
  var removeItems = this.getItems( elems );

  this._emitCompleteOnItems( 'remove', removeItems );

  // bail if no items to remove
  if ( !removeItems || !removeItems.length ) {
    return;
  }

  removeItems.forEach( function( item ) {
    item.remove();
    // remove item from collection
    utils.removeFrom( this.items, item );
  }, this );
};

// ----- destroy ----- //

// remove and disable Outlayer instance
proto.destroy = function() {
  // clean up dynamic styles
  var style = this.element.style;
  style.height = '';
  style.position = '';
  style.width = '';
  // destroy items
  this.items.forEach( function( item ) {
    item.destroy();
  });

  this.unbindResize();

  var id = this.element.outlayerGUID;
  delete instances[ id ]; // remove reference to instance by id
  delete this.element.outlayerGUID;
  // remove data for jQuery
  if ( jQuery ) {
    jQuery.removeData( this.element, this.constructor.namespace );
  }

};

// -------------------------- data -------------------------- //

/**
 * get Outlayer instance from element
 * @param {Element} elem
 * @returns {Outlayer}
 */
Outlayer.data = function( elem ) {
  elem = utils.getQueryElement( elem );
  var id = elem && elem.outlayerGUID;
  return id && instances[ id ];
};


// -------------------------- create Outlayer class -------------------------- //

/**
 * create a layout class
 * @param {String} namespace
 */
Outlayer.create = function( namespace, options ) {
  // sub-class Outlayer
  var Layout = subclass( Outlayer );
  // apply new options and compatOptions
  Layout.defaults = utils.extend( {}, Outlayer.defaults );
  utils.extend( Layout.defaults, options );
  Layout.compatOptions = utils.extend( {}, Outlayer.compatOptions  );

  Layout.namespace = namespace;

  Layout.data = Outlayer.data;

  // sub-class Item
  Layout.Item = subclass( Item );

  // -------------------------- declarative -------------------------- //

  utils.htmlInit( Layout, namespace );

  // -------------------------- jQuery bridge -------------------------- //

  // make into jQuery plugin
  if ( jQuery && jQuery.bridget ) {
    jQuery.bridget( namespace, Layout );
  }

  return Layout;
};

function subclass( Parent ) {
  function SubClass() {
    Parent.apply( this, arguments );
  }

  SubClass.prototype = Object.create( Parent.prototype );
  SubClass.prototype.constructor = SubClass;

  return SubClass;
}

// ----- helpers ----- //

// how many milliseconds are in each unit
var msUnits = {
  ms: 1,
  s: 1000
};

// munge time-like parameter into millisecond number
// '0.4s' -> 40
function getMilliseconds( time ) {
  if ( typeof time == 'number' ) {
    return time;
  }
  var matches = time.match( /(^\d*\.?\d*)(\w*)/ );
  var num = matches && matches[1];
  var unit = matches && matches[2];
  if ( !num.length ) {
    return 0;
  }
  num = parseFloat( num );
  var mult = msUnits[ unit ] || 1;
  return num * mult;
}

// ----- fin ----- //

// back in global
Outlayer.Item = Item;

return Outlayer;

}));

/*!
 * Masonry v4.1.1
 * Cascading grid layout library
 * http://masonry.desandro.com
 * MIT License
 * by David DeSandro
 */

( function( window, factory ) {
  // universal module definition
  /* jshint strict: false */ /*globals define, module, require */
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( 'masonry',[
        'outlayer/outlayer',
        'get-size/get-size'
      ],
      factory );
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      require('outlayer'),
      require('get-size')
    );
  } else {
    // browser global
    window.Masonry = factory(
      window.Outlayer,
      window.getSize
    );
  }

}( window, function factory( Outlayer, getSize ) {



// -------------------------- masonryDefinition -------------------------- //

  // create an Outlayer layout class
  var Masonry = Outlayer.create('masonry');
  // isFitWidth -> fitWidth
  Masonry.compatOptions.fitWidth = 'isFitWidth';

  Masonry.prototype._resetLayout = function() {
    this.getSize();
    this._getMeasurement( 'columnWidth', 'outerWidth' );
    this._getMeasurement( 'gutter', 'outerWidth' );
    this.measureColumns();

    // reset column Y
    this.colYs = [];
    for ( var i=0; i < this.cols; i++ ) {
      this.colYs.push( 0 );
    }

    this.maxY = 0;
  };

  Masonry.prototype.measureColumns = function() {
    this.getContainerWidth();
    // if columnWidth is 0, default to outerWidth of first item
    if ( !this.columnWidth ) {
      var firstItem = this.items[0];
      var firstItemElem = firstItem && firstItem.element;
      // columnWidth fall back to item of first element
      this.columnWidth = firstItemElem && getSize( firstItemElem ).outerWidth ||
        // if first elem has no width, default to size of container
        this.containerWidth;
    }

    var columnWidth = this.columnWidth += this.gutter;

    // calculate columns
    var containerWidth = this.containerWidth + this.gutter;
    var cols = containerWidth / columnWidth;
    // fix rounding errors, typically with gutters
    var excess = columnWidth - containerWidth % columnWidth;
    // if overshoot is less than a pixel, round up, otherwise floor it
    var mathMethod = excess && excess < 1 ? 'round' : 'floor';
    cols = Math[ mathMethod ]( cols );
    this.cols = Math.max( cols, 1 );
  };

  Masonry.prototype.getContainerWidth = function() {
    // container is parent if fit width
    var isFitWidth = this._getOption('fitWidth');
    var container = isFitWidth ? this.element.parentNode : this.element;
    // check that this.size and size are there
    // IE8 triggers resize on body size change, so they might not be
    var size = getSize( container );
    this.containerWidth = size && size.innerWidth;
  };

  Masonry.prototype._getItemLayoutPosition = function( item ) {
    item.getSize();
    // how many columns does this brick span
    var remainder = item.size.outerWidth % this.columnWidth;
    var mathMethod = remainder && remainder < 1 ? 'round' : 'ceil';
    // round if off by 1 pixel, otherwise use ceil
    var colSpan = Math[ mathMethod ]( item.size.outerWidth / this.columnWidth );
    colSpan = Math.min( colSpan, this.cols );

    var colGroup = this._getColGroup( colSpan );
    // get the minimum Y value from the columns
    var minimumY = Math.min.apply( Math, colGroup );
    var shortColIndex = colGroup.indexOf( minimumY );

    // position the brick
    var position = {
      x: this.columnWidth * shortColIndex,
      y: minimumY
    };

    // apply setHeight to necessary columns
    var setHeight = minimumY + item.size.outerHeight;
    var setSpan = this.cols + 1 - colGroup.length;
    for ( var i = 0; i < setSpan; i++ ) {
      this.colYs[ shortColIndex + i ] = setHeight;
    }

    return position;
  };

  /**
   * @param {Number} colSpan - number of columns the element spans
   * @returns {Array} colGroup
   */
  Masonry.prototype._getColGroup = function( colSpan ) {
    if ( colSpan < 2 ) {
      // if brick spans only one column, use all the column Ys
      return this.colYs;
    }

    var colGroup = [];
    // how many different places could this brick fit horizontally
    var groupCount = this.cols + 1 - colSpan;
    // for each group potential horizontal position
    for ( var i = 0; i < groupCount; i++ ) {
      // make an array of colY values for that one group
      var groupColYs = this.colYs.slice( i, i + colSpan );
      // and get the max value of the array
      colGroup[i] = Math.max.apply( Math, groupColYs );
    }
    return colGroup;
  };

  Masonry.prototype._manageStamp = function( stamp ) {
    var stampSize = getSize( stamp );
    var offset = this._getElementOffset( stamp );
    // get the columns that this stamp affects
    var isOriginLeft = this._getOption('originLeft');
    var firstX = isOriginLeft ? offset.left : offset.right;
    var lastX = firstX + stampSize.outerWidth;
    var firstCol = Math.floor( firstX / this.columnWidth );
    firstCol = Math.max( 0, firstCol );
    var lastCol = Math.floor( lastX / this.columnWidth );
    // lastCol should not go over if multiple of columnWidth #425
    lastCol -= lastX % this.columnWidth ? 0 : 1;
    lastCol = Math.min( this.cols - 1, lastCol );
    // set colYs to bottom of the stamp

    var isOriginTop = this._getOption('originTop');
    var stampMaxY = ( isOriginTop ? offset.top : offset.bottom ) +
      stampSize.outerHeight;
    for ( var i = firstCol; i <= lastCol; i++ ) {
      this.colYs[i] = Math.max( stampMaxY, this.colYs[i] );
    }
  };

  Masonry.prototype._getContainerSize = function() {
    this.maxY = Math.max.apply( Math, this.colYs );
    var size = {
      height: this.maxY
    };

    if ( this._getOption('fitWidth') ) {
      size.width = this._getContainerFitWidth();
    }

    return size;
  };

  Masonry.prototype._getContainerFitWidth = function() {
    var unusedCols = 0;
    // count unused columns
    var i = this.cols;
    while ( --i ) {
      if ( this.colYs[i] !== 0 ) {
        break;
      }
      unusedCols++;
    }
    // fit container to columns that have been used
    return ( this.cols - unusedCols ) * this.columnWidth - this.gutter;
  };

  Masonry.prototype.needsResizeLayout = function() {
    var previousWidth = this.containerWidth;
    this.getContainerWidth();
    return previousWidth != this.containerWidth;
  };

  return Masonry;

}));


/**
 * Patternslib pattern for Masonry
 * Copyright 2015 Syslab.com GmBH
 */

(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define('pat-masonry',[
            "jquery",
            "pat-logger",
            "pat-registry",
            "pat-parser",
            "pat-base",
            "pat-utils",
            "masonry",
            "imagesloaded"
            ], function() {
                return factory.apply(this, arguments);
        });
    } else {
        factory(root.$, root.patterns, root.patterns.Parser, root.Base, root.Masonry, root.imagesLoaded);
    }
}(this, function($, logger, registry, Parser, Base, utils, Masonry, imagesLoaded) {
    "use strict";
    var log = logger.getLogger("pat.masonry");
    var parser = new Parser("masonry");
    parser.addArgument("column-width");
    parser.addArgument("container-style", '{ "position": "relative" }');
    parser.addArgument("gutter");
    parser.addArgument("hidden-style", "{ opacity: 0, transform: 'scale(0.001)' }");
    parser.addArgument("is-fit-width", false);
    parser.addArgument("is-origin-left", true);
    parser.addArgument("is-origin-top", true);
    parser.addArgument("item-selector", ".item");
    parser.addArgument("stamp", "");
    parser.addArgument("transition-duration", "0.4s");
    parser.addArgument("visible-style", "{ opacity: 1, transform: 'scale(1)' }");

    return Base.extend({
        name: "masonry",
        trigger: ".pat-masonry",

        init: function masonryInit($el, opts) {
            this.options = parser.parse(this.$el, opts);
            this.initMasonry();
            var imgLoad = imagesLoaded(this.$el);
            imgLoad.on("progress", function() {
                this.quicklayout();
            }.bind(this));
            imgLoad.on("always", this.layout.bind(this));
            // Update if something gets injected inside the pat-masonry
            // element.
            this.$el
                .on("patterns-injected.pat-masonry",
                    utils.debounce(this.update.bind(this), 100))
                .parents().on("pat-update", 
                    utils.debounce(this.quicklayout.bind(this), 200));

        },

        initMasonry: function () {
            var containerStyle;
            try {
                containerStyle = JSON.parse(this.options.containerStyle);
            } catch (e) {
                containerStyle = { "position": "relative" };
                log.warn(
                    "Invalid value passed in as containerStyle. Needs to "+
                    "be valid JSON so that it can be converted to an object for Masonry."
                );
            }
            this.msnry = new Masonry(this.$el[0], {
                columnWidth:         this.getTypeCastedValue(this.options.columnWidth),
                containerStyle:      containerStyle,
                gutter:              this.getTypeCastedValue(this.options.gutter),
                hiddenStyle:         this.options.hiddenStyle,
                isFitWidth:          this.options.is["fit-width"],
                isInitLayout:        false,
                isOriginLeft:        this.options.is["origin-left"],
                isOriginTOp:         this.options.is["origin-top"],
                itemSelector:        this.options.itemSelector,
                stamp:               this.options.stamp,
                transitionDuration:  this.options.transitionDuration,
                visibleStyle:        this.options.visibleStyle
            });
        },

        update: function () {
            this.msnry.remove();
            this.initMasonry();
            this.layout();
        },

        quicklayout: function() {
            // Just calling again without triggering the class change
            this.msnry.layout();
        },

        layout: function () {
            this.$el.removeClass("masonry-ready");
            this.msnry.on("layoutComplete", function() {
                this.$el.addClass("masonry-ready");
            }.bind(this));
            this.msnry.layout();
        },

        getTypeCastedValue: function (original) {
            var val = Number(original);
            return (isNaN(val)) ? (original || 0) : val;
        }
    });
}));

//
// showdown.js -- A javascript port of Markdown.
//
// Copyright (c) 2007 John Fraser.
//
// Original Markdown Copyright (c) 2004-2005 John Gruber
//   <http://daringfireball.net/projects/markdown/>
//
// Redistributable under a BSD-style open source license.
// See license.txt for more information.
//
// The full source distribution is at:
//
//				A A L
//				T C A
//				T K B
//
//   <http://www.attacklab.net/>
//

//
// Wherever possible, Showdown is a straight, line-by-line port
// of the Perl version of Markdown.
//
// This is not a normal parser design; it's basically just a
// series of string substitutions.  It's hard to read and
// maintain this way,  but keeping Showdown close to the original
// design makes it easier to port new features.
//
// More importantly, Showdown behaves like markdown.pl in most
// edge cases.  So web applications can do client-side preview
// in Javascript, and then build identical HTML on the server.
//
// This port needs the new RegExp functionality of ECMA 262,
// 3rd Edition (i.e. Javascript 1.5).  Most modern web browsers
// should do fine.  Even with the new regular expression features,
// We do a lot of work to emulate Perl's regex functionality.
// The tricky changes in this file mostly have the "attacklab:"
// label.  Major or self-explanatory changes don't.
//
// Smart diff tools like Araxis Merge will be able to match up
// this file with markdown.pl in a useful way.  A little tweaking
// helps: in a copy of markdown.pl, replace "#" with "//" and
// replace "$text" with "text".  Be sure to ignore whitespace
// and line endings.
//


//
// Showdown usage:
//
//   var text = "Markdown *rocks*.";
//
//   var converter = new Showdown.converter();
//   var html = converter.makeHtml(text);
//
//   alert(html);
//
// Note: move the sample code to the bottom of this
// file before uncommenting it.
//


//
// Showdown namespace
//
var Showdown = {extensions: {}};

//
// forEach
//
var forEach = Showdown.forEach = function (obj, callback) {
    if (typeof obj.forEach === 'function') {
        obj.forEach(callback);
    } else {
        var i, len = obj.length;
        for (i = 0; i < len; i++) {
            callback(obj[i], i, obj);
        }
    }
};

//
// Standard extension naming
//
var stdExtName = function (s) {
    return s.replace(/[_-]||\s/g, '').toLowerCase();
};

//
// converter
//
// Wraps all "globals" so that the only thing
// exposed is makeHtml().
//
Showdown.converter = function (converter_options) {

//
// Globals:
//

// Global hashes, used by various utility routines
    var g_urls;
    var g_titles;
    var g_html_blocks;

// Used to track when we're inside an ordered or unordered list
// (see _ProcessListItems() for details):
    var g_list_level = 0;

// Global extensions
    var g_lang_extensions = [];
    var g_output_modifiers = [];


//
// Automatic Extension Loading (node only):
//
    if (typeof module !== 'undefined' && typeof exports !== 'undefined' && typeof require !== 'undefined') {
        var fs = require('fs');

        if (fs) {
            // Search extensions folder
            var extensions = fs.readdirSync((__dirname || '.') + '/extensions').filter(function (file) {
                return ~file.indexOf('.js');
            }).map(function (file) {
                return file.replace(/\.js$/, '');
            });
            // Load extensions into Showdown namespace
            Showdown.forEach(extensions, function (ext) {
                var name = stdExtName(ext);
                Showdown.extensions[name] = require('./extensions/' + ext);
            });
        }
    }

    this.makeHtml = function (text) {
//
// Main function. The order in which other subs are called here is
// essential. Link and image substitutions need to happen before
// _EscapeSpecialCharsWithinTagAttributes(), so that any *'s or _'s in the <a>
// and <img> tags get encoded.
//

        // Clear the global hashes. If we don't clear these, you get conflicts
        // from other articles when generating a page which contains more than
        // one article (e.g. an index page that shows the N most recent
        // articles):
        g_urls = {};
        g_titles = {};
        g_html_blocks = [];

        // attacklab: Replace ~ with ~T
        // This lets us use tilde as an escape char to avoid md5 hashes
        // The choice of character is arbitray; anything that isn't
        // magic in Markdown will work.
        text = text.replace(/~/g, "~T");

        // attacklab: Replace $ with ~D
        // RegExp interprets $ as a special character
        // when it's in a replacement string
        text = text.replace(/\$/g, "~D");

        // Standardize line endings
        text = text.replace(/\r\n/g, "\n"); // DOS to Unix
        text = text.replace(/\r/g, "\n"); // Mac to Unix

        // Make sure text begins and ends with a couple of newlines:
        text = "\n\n" + text + "\n\n";

        // Convert all tabs to spaces.
        text = _Detab(text);

        // Strip any lines consisting only of spaces and tabs.
        // This makes subsequent regexen easier to write, because we can
        // match consecutive blank lines with /\n+/ instead of something
        // contorted like /[ \t]*\n+/ .
        text = text.replace(/^[ \t]+$/mg, "");

        // Run language extensions
        Showdown.forEach(g_lang_extensions, function (x) {
            text = _ExecuteExtension(x, text);
        });

        // Handle github codeblocks prior to running HashHTML so that
        // HTML contained within the codeblock gets escaped propertly
        text = _DoGithubCodeBlocks(text);

        // Turn block-level HTML blocks into hash entries
        text = _HashHTMLBlocks(text);

        // Strip link definitions, store in hashes.
        text = _StripLinkDefinitions(text);

        text = _RunBlockGamut(text);

        text = _UnescapeSpecialChars(text);

        // attacklab: Restore dollar signs
        text = text.replace(/~D/g, "$$");

        // attacklab: Restore tildes
        text = text.replace(/~T/g, "~");

        // Run output modifiers
        Showdown.forEach(g_output_modifiers, function (x) {
            text = _ExecuteExtension(x, text);
        });

        return text;
    };


//
// Options:
//

// Parse extensions options into separate arrays
    if (converter_options && converter_options.extensions) {

        var self = this;

        // Iterate over each plugin
        Showdown.forEach(converter_options.extensions, function (plugin) {
            var pluginName = plugin;

            // Assume it's a bundled plugin if a string is given
            if (typeof plugin === 'string') {
                plugin = Showdown.extensions[stdExtName(plugin)];
            }

            if (typeof plugin === 'function') {
                // Iterate over each extension within that plugin
                Showdown.forEach(plugin(self), function (ext) {
                    // Sort extensions by type
                    if (ext.type) {
                        if (ext.type === 'language' || ext.type === 'lang') {
                            g_lang_extensions.push(ext);
                        } else if (ext.type === 'output' || ext.type === 'html') {
                            g_output_modifiers.push(ext);
                        }
                    } else {
                        // Assume language extension
                        g_output_modifiers.push(ext);
                    }
                });
            } else {
                throw "Extension '" + pluginName + "' could not be loaded.  It was either not found or is not a valid extension.";
            }
        });
    }


    var _ExecuteExtension = function (ext, text) {
        if (ext.regex) {
            var re = new RegExp(ext.regex, 'g');
            return text.replace(re, ext.replace);
        } else if (ext.filter) {
            return ext.filter(text);
        }
    };

    var _StripLinkDefinitions = function (text) {
//
// Strips link definitions from text, stores the URLs and titles in
// hash references.
//

        // Link defs are in the form: ^[id]: url "optional title"

        /*
         var text = text.replace(/
         ^[ ]{0,3}\[(.+)\]:  // id = $1  attacklab: g_tab_width - 1
         [ \t]*
         \n?				// maybe *one* newline
         [ \t]*
         <?(\S+?)>?			// url = $2
         [ \t]*
         \n?				// maybe one newline
         [ \t]*
         (?:
         (\n*)				// any lines skipped = $3 attacklab: lookbehind removed
         ["(]
         (.+?)				// title = $4
         [")]
         [ \t]*
         )?					// title is optional
         (?:\n+|$)
         /gm,
         function(){...});
         */

        // attacklab: sentinel workarounds for lack of \A and \Z, safari\khtml bug
        text += "~0";

        text = text.replace(/^[ ]{0,3}\[(.+)\]:[ \t]*\n?[ \t]*<?(\S+?)>?[ \t]*\n?[ \t]*(?:(\n*)["(](.+?)[")][ \t]*)?(?:\n+|(?=~0))/gm,
            function (wholeMatch, m1, m2, m3, m4) {
                m1 = m1.toLowerCase();
                g_urls[m1] = _EncodeAmpsAndAngles(m2);  // Link IDs are case-insensitive
                if (m3) {
                    // Oops, found blank lines, so it's not a title.
                    // Put back the parenthetical statement we stole.
                    return m3 + m4;
                } else if (m4) {
                    g_titles[m1] = m4.replace(/"/g, "&quot;");
                }

                // Completely remove the definition from the text
                return "";
            }
        );

        // attacklab: strip sentinel
        text = text.replace(/~0/, "");

        return text;
    };

    var _HashHTMLBlocks = function (text) {
        // attacklab: Double up blank lines to reduce lookaround
        text = text.replace(/\n/g, "\n\n");

        // Hashify HTML blocks:
        // We only want to do this for block-level HTML tags, such as headers,
        // lists, and tables. That's because we still want to wrap <p>s around
        // "paragraphs" that are wrapped in non-block-level tags, such as anchors,
        // phrase emphasis, and spans. The list of tags we're looking for is
        // hard-coded:
        var block_tags_a = "p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math|ins|del|style|section|header|footer|nav|article|aside";
        var block_tags_b = "p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math|style|section|header|footer|nav|article|aside";

        // First, look for nested blocks, e.g.:
        //   <div>
        //     <div>
        //     tags for inner block must be indented.
        //     </div>
        //   </div>
        //
        // The outermost tags must start at the left margin for this to match, and
        // the inner nested divs must be indented.
        // We need to do this before the next, more liberal match, because the next
        // match will start at the first `<div>` and stop at the first `</div>`.

        // attacklab: This regex can be expensive when it fails.
        /*
         var text = text.replace(/
         (						// save in $1
         ^					// start of line  (with /m)
         <($block_tags_a)	// start tag = $2
         \b					// word break
         // attacklab: hack around khtml/pcre bug...
         [^\r]*?\n			// any number of lines, minimally matching
         </\2>				// the matching end tag
         [ \t]*				// trailing spaces/tabs
         (?=\n+)				// followed by a newline
         )						// attacklab: there are sentinel newlines at end of document
         /gm,function(){...}};
         */
        text = text.replace(/^(<(p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math|ins|del)\b[^\r]*?\n<\/\2>[ \t]*(?=\n+))/gm, hashElement);

        //
        // Now match more liberally, simply from `\n<tag>` to `</tag>\n`
        //

        /*
         var text = text.replace(/
         (						// save in $1
         ^					// start of line  (with /m)
         <($block_tags_b)	// start tag = $2
         \b					// word break
         // attacklab: hack around khtml/pcre bug...
         [^\r]*?				// any number of lines, minimally matching
         </\2>				// the matching end tag
         [ \t]*				// trailing spaces/tabs
         (?=\n+)				// followed by a newline
         )						// attacklab: there are sentinel newlines at end of document
         /gm,function(){...}};
         */
        text = text.replace(/^(<(p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math|style|section|header|footer|nav|article|aside)\b[^\r]*?<\/\2>[ \t]*(?=\n+)\n)/gm, hashElement);

        // Special case just for <hr />. It was easier to make a special case than
        // to make the other regex more complicated.

        /*
         text = text.replace(/
         (						// save in $1
         \n\n				// Starting after a blank line
         [ ]{0,3}
         (<(hr)				// start tag = $2
         \b					// word break
         ([^<>])*?			//
         \/?>)				// the matching end tag
         [ \t]*
         (?=\n{2,})			// followed by a blank line
         )
         /g,hashElement);
         */
        text = text.replace(/(\n[ ]{0,3}(<(hr)\b([^<>])*?\/?>)[ \t]*(?=\n{2,}))/g, hashElement);

        // Special case for standalone HTML comments:

        /*
         text = text.replace(/
         (						// save in $1
         \n\n				// Starting after a blank line
         [ ]{0,3}			// attacklab: g_tab_width - 1
         <!
         (--[^\r]*?--\s*)+
         >
         [ \t]*
         (?=\n{2,})			// followed by a blank line
         )
         /g,hashElement);
         */
        text = text.replace(/(\n\n[ ]{0,3}<!(--[^\r]*?--\s*)+>[ \t]*(?=\n{2,}))/g, hashElement);

        // PHP and ASP-style processor instructions (<?...?> and <%...%>)

        /*
         text = text.replace(/
         (?:
         \n\n				// Starting after a blank line
         )
         (						// save in $1
         [ ]{0,3}			// attacklab: g_tab_width - 1
         (?:
         <([?%])			// $2
         [^\r]*?
         \2>
         )
         [ \t]*
         (?=\n{2,})			// followed by a blank line
         )
         /g,hashElement);
         */
        text = text.replace(/(?:\n\n)([ ]{0,3}(?:<([?%])[^\r]*?\2>)[ \t]*(?=\n{2,}))/g, hashElement);

        // attacklab: Undo double lines (see comment at top of this function)
        text = text.replace(/\n\n/g, "\n");
        return text;
    };

    var hashElement = function (wholeMatch, m1) {
        var blockText = m1;

        // Undo double lines
        blockText = blockText.replace(/\n\n/g, "\n");
        blockText = blockText.replace(/^\n/, "");

        // strip trailing blank lines
        blockText = blockText.replace(/\n+$/g, "");

        // Replace the element text with a marker ("~KxK" where x is its key)
        blockText = "\n\n~K" + (g_html_blocks.push(blockText) - 1) + "K\n\n";

        return blockText;
    };

    var _RunBlockGamut = function (text) {
//
// These are all the transformations that form block-level
// tags like paragraphs, headers, and list items.
//
        text = _DoHeaders(text);

        // Do Horizontal Rules:
        var key = hashBlock("<hr />");
        text = text.replace(/^[ ]{0,2}([ ]?\*[ ]?){3,}[ \t]*$/gm, key);
        text = text.replace(/^[ ]{0,2}([ ]?\-[ ]?){3,}[ \t]*$/gm, key);
        text = text.replace(/^[ ]{0,2}([ ]?\_[ ]?){3,}[ \t]*$/gm, key);

        text = _DoLists(text);
        text = _DoCodeBlocks(text);
        text = _DoBlockQuotes(text);

        // We already ran _HashHTMLBlocks() before, in Markdown(), but that
        // was to escape raw HTML in the original Markdown source. This time,
        // we're escaping the markup we've just created, so that we don't wrap
        // <p> tags around block-level tags.
        text = _HashHTMLBlocks(text);
        text = _FormParagraphs(text);

        return text;
    };

    var _RunSpanGamut = function (text) {
//
// These are all the transformations that occur *within* block-level
// tags like paragraphs, headers, and list items.
//

        text = _DoCodeSpans(text);
        text = _EscapeSpecialCharsWithinTagAttributes(text);
        text = _EncodeBackslashEscapes(text);

        // Process anchor and image tags. Images must come first,
        // because ![foo][f] looks like an anchor.
        text = _DoImages(text);
        text = _DoAnchors(text);

        // Make links out of things like `<http://example.com/>`
        // Must come after _DoAnchors(), because you can use < and >
        // delimiters in inline links like [this](<url>).
        text = _DoAutoLinks(text);
        text = _EncodeAmpsAndAngles(text);
        text = _DoItalicsAndBold(text);

        // Do hard breaks:
        text = text.replace(/  +\n/g, " <br />\n");

        return text;
    };

    var _EscapeSpecialCharsWithinTagAttributes = function (text) {
//
// Within tags -- meaning between < and > -- encode [\ ` * _] so they
// don't conflict with their use in Markdown for code, italics and strong.
//

        // Build a regex to find HTML tags and comments.  See Friedl's
        // "Mastering Regular Expressions", 2nd Ed., pp. 200-201.
        var regex = /(<[a-z\/!$]("[^"]*"|'[^']*'|[^'">])*>|<!(--.*?--\s*)+>)/gi;

        text = text.replace(regex, function (wholeMatch) {
            var tag = wholeMatch.replace(/(.)<\/?code>(?=.)/g, "$1`");
            tag = escapeCharacters(tag, "\\`*_");
            return tag;
        });

        return text;
    };

    var _DoAnchors = function (text) {
//
// Turn Markdown link shortcuts into XHTML <a> tags.
//
        //
        // First, handle reference-style links: [link text] [id]
        //

        /*
         text = text.replace(/
         (							// wrap whole match in $1
         \[
         (
         (?:
         \[[^\]]*\]		// allow brackets nested one level
         |
         [^\[]			// or anything else
         )*
         )
         \]

         [ ]?					// one optional space
         (?:\n[ ]*)?				// one optional newline followed by spaces

         \[
         (.*?)					// id = $3
         \]
         )()()()()					// pad remaining backreferences
         /g,_DoAnchors_callback);
         */
        text = text.replace(/(\[((?:\[[^\]]*\]|[^\[\]])*)\][ ]?(?:\n[ ]*)?\[(.*?)\])()()()()/g, writeAnchorTag);

        //
        // Next, inline-style links: [link text](url "optional title")
        //

        /*
         text = text.replace(/
         (						// wrap whole match in $1
         \[
         (
         (?:
         \[[^\]]*\]	// allow brackets nested one level
         |
         [^\[\]]			// or anything else
         )
         )
         \]
         \(						// literal paren
         [ \t]*
         ()						// no id, so leave $3 empty
         <?(.*?)>?				// href = $4
         [ \t]*
         (						// $5
         (['"])				// quote char = $6
         (.*?)				// Title = $7
         \6					// matching quote
         [ \t]*				// ignore any spaces/tabs between closing quote and )
         )?						// title is optional
         \)
         )
         /g,writeAnchorTag);
         */
        text = text.replace(/(\[((?:\[[^\]]*\]|[^\[\]])*)\]\([ \t]*()<?(.*?(?:\(.*?\).*?)?)>?[ \t]*((['"])(.*?)\6[ \t]*)?\))/g, writeAnchorTag);

        //
        // Last, handle reference-style shortcuts: [link text]
        // These must come last in case you've also got [link test][1]
        // or [link test](/foo)
        //

        /*
         text = text.replace(/
         (		 					// wrap whole match in $1
         \[
         ([^\[\]]+)				// link text = $2; can't contain '[' or ']'
         \]
         )()()()()()					// pad rest of backreferences
         /g, writeAnchorTag);
         */
        text = text.replace(/(\[([^\[\]]+)\])()()()()()/g, writeAnchorTag);

        return text;
    };

    var writeAnchorTag = function (wholeMatch, m1, m2, m3, m4, m5, m6, m7) {
        if (m7 === undefined) m7 = "";
        var whole_match = m1;
        var link_text = m2;
        var link_id = m3.toLowerCase();
        var url = m4;
        var title = m7;

        if (url === "") {
            if (link_id === "") {
                // lower-case and turn embedded newlines into spaces
                link_id = link_text.toLowerCase().replace(/ ?\n/g, " ");
            }
            url = "#" + link_id;

            if (g_urls[link_id] !== undefined) {
                url = g_urls[link_id];
                if (g_titles[link_id] !== undefined) {
                    title = g_titles[link_id];
                }
            }
            else {
                if (whole_match.search(/\(\s*\)$/m) > -1) {
                    // Special case for explicit empty url
                    url = "";
                } else {
                    return whole_match;
                }
            }
        }

        url = escapeCharacters(url, "*_");
        var result = "<a href=\"" + url + "\"";

        if (title !== "") {
            title = title.replace(/"/g, "&quot;");
            title = escapeCharacters(title, "*_");
            result += " title=\"" + title + "\"";
        }

        result += ">" + link_text + "</a>";

        return result;
    };

    var _DoImages = function (text) {
//
// Turn Markdown image shortcuts into <img> tags.
//

        //
        // First, handle reference-style labeled images: ![alt text][id]
        //

        /*
         text = text.replace(/
         (						// wrap whole match in $1
         !\[
         (.*?)				// alt text = $2
         \]

         [ ]?				// one optional space
         (?:\n[ ]*)?			// one optional newline followed by spaces

         \[
         (.*?)				// id = $3
         \]
         )()()()()				// pad rest of backreferences
         /g,writeImageTag);
         */
        text = text.replace(/(!\[(.*?)\][ ]?(?:\n[ ]*)?\[(.*?)\])()()()()/g, writeImageTag);

        //
        // Next, handle inline images:  ![alt text](url "optional title")
        // Don't forget: encode * and _

        /*
         text = text.replace(/
         (						// wrap whole match in $1
         !\[
         (.*?)				// alt text = $2
         \]
         \s?					// One optional whitespace character
         \(					// literal paren
         [ \t]*
         ()					// no id, so leave $3 empty
         <?(\S+?)>?			// src url = $4
         [ \t]*
         (					// $5
         (['"])			// quote char = $6
         (.*?)			// title = $7
         \6				// matching quote
         [ \t]*
         )?					// title is optional
         \)
         )
         /g,writeImageTag);
         */
        text = text.replace(/(!\[(.*?)\]\s?\([ \t]*()<?(\S+?)>?[ \t]*((['"])(.*?)\6[ \t]*)?\))/g, writeImageTag);

        return text;
    };

    var writeImageTag = function (wholeMatch, m1, m2, m3, m4, m5, m6, m7) {
        var whole_match = m1;
        var alt_text = m2;
        var link_id = m3.toLowerCase();
        var url = m4;
        var title = m7;

        if (!title) title = "";

        if (url === "") {
            if (link_id === "") {
                // lower-case and turn embedded newlines into spaces
                link_id = alt_text.toLowerCase().replace(/ ?\n/g, " ");
            }
            url = "#" + link_id;

            if (g_urls[link_id] !== undefined) {
                url = g_urls[link_id];
                if (g_titles[link_id] !== undefined) {
                    title = g_titles[link_id];
                }
            }
            else {
                return whole_match;
            }
        }

        alt_text = alt_text.replace(/"/g, "&quot;");
        url = escapeCharacters(url, "*_");
        var result = "<img src=\"" + url + "\" alt=\"" + alt_text + "\"";

        // attacklab: Markdown.pl adds empty title attributes to images.
        // Replicate this bug.

        //if (title != "") {
        title = title.replace(/"/g, "&quot;");
        title = escapeCharacters(title, "*_");
        result += " title=\"" + title + "\"";
        //}

        result += " />";

        return result;
    };

    var _DoHeaders = function (text) {

        // Setext-style headers:
        //	Header 1
        //	========
        //
        //	Header 2
        //	--------
        //
        text = text.replace(/^(.+)[ \t]*\n=+[ \t]*\n+/gm,
            function (wholeMatch, m1) {
                return hashBlock('<h1 id="' + headerId(m1) + '">' + _RunSpanGamut(m1) + "</h1>");
            });

        text = text.replace(/^(.+)[ \t]*\n-+[ \t]*\n+/gm,
            function (matchFound, m1) {
                return hashBlock('<h2 id="' + headerId(m1) + '">' + _RunSpanGamut(m1) + "</h2>");
            });

        // atx-style headers:
        //  # Header 1
        //  ## Header 2
        //  ## Header 2 with closing hashes ##
        //  ...
        //  ###### Header 6
        //

        /*
         text = text.replace(/
         ^(\#{1,6})				// $1 = string of #'s
         [ \t]*
         (.+?)					// $2 = Header text
         [ \t]*
         \#*						// optional closing #'s (not counted)
         \n+
         /gm, function() {...});
         */

        text = text.replace(/^(\#{1,6})[ \t]*(.+?)[ \t]*\#*\n+/gm,
            function (wholeMatch, m1, m2) {
                var h_level = m1.length;
                return hashBlock("<h" + h_level + ' id="' + headerId(m2) + '">' + _RunSpanGamut(m2) + "</h" + h_level + ">");
            });

        function headerId(m) {
            return m.replace(/[^\w]/g, '').toLowerCase();
        }

        return text;
    };

// This declaration keeps Dojo compressor from outputting garbage:
    var _ProcessListItems;

    var _DoLists = function (text) {
//
// Form HTML ordered (numbered) and unordered (bulleted) lists.
//

        // attacklab: add sentinel to hack around khtml/safari bug:
        // http://bugs.webkit.org/show_bug.cgi?id=11231
        text += "~0";

        // Re-usable pattern to match any entirel ul or ol list:

        /*
         var whole_list = /
         (									// $1 = whole list
         (								// $2
         [ ]{0,3}					// attacklab: g_tab_width - 1
         ([*+-]|\d+[.])				// $3 = first list item marker
         [ \t]+
         )
         [^\r]+?
         (								// $4
         ~0							// sentinel for workaround; should be $
         |
         \n{2,}
         (?=\S)
         (?!							// Negative lookahead for another list item marker
         [ \t]*
         (?:[*+-]|\d+[.])[ \t]+
         )
         )
         )/g
         */
        var whole_list = /^(([ ]{0,3}([*+-]|\d+[.])[ \t]+)[^\r]+?(~0|\n{2,}(?=\S)(?![ \t]*(?:[*+-]|\d+[.])[ \t]+)))/gm;

        if (g_list_level) {
            text = text.replace(whole_list, function (wholeMatch, m1, m2) {
                var list = m1;
                var list_type = (m2.search(/[*+-]/g) > -1) ? "ul" : "ol";

                // Turn double returns into triple returns, so that we can make a
                // paragraph for the last item in a list, if necessary:
                list = list.replace(/\n{2,}/g, "\n\n\n");
                var result = _ProcessListItems(list);

                // Trim any trailing whitespace, to put the closing `</$list_type>`
                // up on the preceding line, to get it past the current stupid
                // HTML block parser. This is a hack to work around the terrible
                // hack that is the HTML block parser.
                result = result.replace(/\s+$/, "");
                result = "<" + list_type + ">" + result + "</" + list_type + ">\n";
                return result;
            });
        } else {
            whole_list = /(\n\n|^\n?)(([ ]{0,3}([*+-]|\d+[.])[ \t]+)[^\r]+?(~0|\n{2,}(?=\S)(?![ \t]*(?:[*+-]|\d+[.])[ \t]+)))/g;
            text = text.replace(whole_list, function (wholeMatch, m1, m2, m3) {
                var runup = m1;
                var list = m2;

                var list_type = (m3.search(/[*+-]/g) > -1) ? "ul" : "ol";
                // Turn double returns into triple returns, so that we can make a
                // paragraph for the last item in a list, if necessary:
                list = list.replace(/\n{2,}/g, "\n\n\n");
                var result = _ProcessListItems(list);
                result = runup + "<" + list_type + ">\n" + result + "</" + list_type + ">\n";
                return result;
            });
        }

        // attacklab: strip sentinel
        text = text.replace(/~0/, "");

        return text;
    };

    _ProcessListItems = function (list_str) {
//
//  Process the contents of a single ordered or unordered list, splitting it
//  into individual list items.
//
        // The $g_list_level global keeps track of when we're inside a list.
        // Each time we enter a list, we increment it; when we leave a list,
        // we decrement. If it's zero, we're not in a list anymore.
        //
        // We do this because when we're not inside a list, we want to treat
        // something like this:
        //
        //    I recommend upgrading to version
        //    8. Oops, now this line is treated
        //    as a sub-list.
        //
        // As a single paragraph, despite the fact that the second line starts
        // with a digit-period-space sequence.
        //
        // Whereas when we're inside a list (or sub-list), that line will be
        // treated as the start of a sub-list. What a kludge, huh? This is
        // an aspect of Markdown's syntax that's hard to parse perfectly
        // without resorting to mind-reading. Perhaps the solution is to
        // change the syntax rules such that sub-lists must start with a
        // starting cardinal number; e.g. "1." or "a.".

        g_list_level++;

        // trim trailing blank lines:
        list_str = list_str.replace(/\n{2,}$/, "\n");

        // attacklab: add sentinel to emulate \z
        list_str += "~0";

        /*
         list_str = list_str.replace(/
         (\n)?							// leading line = $1
         (^[ \t]*)						// leading whitespace = $2
         ([*+-]|\d+[.]) [ \t]+			// list marker = $3
         ([^\r]+?						// list item text   = $4
         (\n{1,2}))
         (?= \n* (~0 | \2 ([*+-]|\d+[.]) [ \t]+))
         /gm, function(){...});
         */
        list_str = list_str.replace(/(\n)?(^[ \t]*)([*+-]|\d+[.])[ \t]+([^\r]+?(\n{1,2}))(?=\n*(~0|\2([*+-]|\d+[.])[ \t]+))/gm,
            function (wholeMatch, m1, m2, m3, m4) {
                var item = m4;
                var leading_line = m1;
                var leading_space = m2;

                if (leading_line || (item.search(/\n{2,}/) > -1)) {
                    item = _RunBlockGamut(_Outdent(item));
                }
                else {
                    // Recursion for sub-lists:
                    item = _DoLists(_Outdent(item));
                    item = item.replace(/\n$/, ""); // chomp(item)
                    item = _RunSpanGamut(item);
                }

                return "<li>" + item + "</li>\n";
            }
        );

        // attacklab: strip sentinel
        list_str = list_str.replace(/~0/g, "");

        g_list_level--;
        return list_str;
    };

    var _DoCodeBlocks = function (text) {
//
//  Process Markdown `<pre><code>` blocks.
//

        /*
         text = text.replace(text,
         /(?:\n\n|^)
         (								// $1 = the code block -- one or more lines, starting with a space/tab
         (?:
         (?:[ ]{4}|\t)			// Lines must start with a tab or a tab-width of spaces - attacklab: g_tab_width
         .*\n+
         )+
         )
         (\n*[ ]{0,3}[^ \t\n]|(?=~0))	// attacklab: g_tab_width
         /g,function(){...});
         */

        // attacklab: sentinel workarounds for lack of \A and \Z, safari\khtml bug
        text += "~0";

        text = text.replace(/(?:\n\n|^)((?:(?:[ ]{4}|\t).*\n+)+)(\n*[ ]{0,3}[^ \t\n]|(?=~0))/g,
            function (wholeMatch, m1, m2) {
                var codeblock = m1;
                var nextChar = m2;

                codeblock = _EncodeCode(_Outdent(codeblock));
                codeblock = _Detab(codeblock);
                codeblock = codeblock.replace(/^\n+/g, ""); // trim leading newlines
                codeblock = codeblock.replace(/\n+$/g, ""); // trim trailing whitespace

                codeblock = "<pre><code>" + codeblock + "\n</code></pre>";

                return hashBlock(codeblock) + nextChar;
            }
        );

        // attacklab: strip sentinel
        text = text.replace(/~0/, "");

        return text;
    };

    var _DoGithubCodeBlocks = function (text) {
//
//  Process Github-style code blocks
//  Example:
//  ```ruby
//  def hello_world(x)
//    puts "Hello, #{x}"
//  end
//  ```
//


        // attacklab: sentinel workarounds for lack of \A and \Z, safari\khtml bug
        text += "~0";

        text = text.replace(/(?:^|\n)```(.*)\n([\s\S]*?)\n```/g,
            function (wholeMatch, m1, m2) {
                var language = m1;
                var codeblock = m2;

                codeblock = _EncodeCode(codeblock);
                codeblock = _Detab(codeblock);
                codeblock = codeblock.replace(/^\n+/g, ""); // trim leading newlines
                codeblock = codeblock.replace(/\n+$/g, ""); // trim trailing whitespace

                codeblock = "<pre><code" + (language ? " class=\"" + language + '"' : "") + ">" + codeblock + "\n</code></pre>";

                return hashBlock(codeblock);
            }
        );

        // attacklab: strip sentinel
        text = text.replace(/~0/, "");

        return text;
    };

    var hashBlock = function (text) {
        text = text.replace(/(^\n+|\n+$)/g, "");
        return "\n\n~K" + (g_html_blocks.push(text) - 1) + "K\n\n";
    };

    var _DoCodeSpans = function (text) {
//
//   *  Backtick quotes are used for <code></code> spans.
//
//   *  You can use multiple backticks as the delimiters if you want to
//	 include literal backticks in the code span. So, this input:
//
//		 Just type ``foo `bar` baz`` at the prompt.
//
//	   Will translate to:
//
//		 <p>Just type <code>foo `bar` baz</code> at the prompt.</p>
//
//	There's no arbitrary limit to the number of backticks you
//	can use as delimters. If you need three consecutive backticks
//	in your code, use four for delimiters, etc.
//
//  *  You can use spaces to get literal backticks at the edges:
//
//		 ... type `` `bar` `` ...
//
//	   Turns to:
//
//		 ... type <code>`bar`</code> ...
//

        /*
         text = text.replace(/
         (^|[^\\])					// Character before opening ` can't be a backslash
         (`+)						// $2 = Opening run of `
         (							// $3 = The code block
         [^\r]*?
         [^`]					// attacklab: work around lack of lookbehind
         )
         \2							// Matching closer
         (?!`)
         /gm, function(){...});
         */

        text = text.replace(/(^|[^\\])(`+)([^\r]*?[^`])\2(?!`)/gm,
            function (wholeMatch, m1, m2, m3, m4) {
                var c = m3;
                c = c.replace(/^([ \t]*)/g, "");	// leading whitespace
                c = c.replace(/[ \t]*$/g, "");	// trailing whitespace
                c = _EncodeCode(c);
                return m1 + "<code>" + c + "</code>";
            });

        return text;
    };

    var _EncodeCode = function (text) {
//
// Encode/escape certain characters inside Markdown code runs.
// The point is that in code, these characters are literals,
// and lose their special Markdown meanings.
//
        // Encode all ampersands; HTML entities are not
        // entities within a Markdown code span.
        text = text.replace(/&/g, "&amp;");

        // Do the angle bracket song and dance:
        text = text.replace(/</g, "&lt;");
        text = text.replace(/>/g, "&gt;");

        // Now, escape characters that are magic in Markdown:
        text = escapeCharacters(text, "\*_{}[]\\", false);

// jj the line above breaks this:
//---

//* Item

//   1. Subitem

//            special char: *
//---

        return text;
    };

    var _DoItalicsAndBold = function (text) {

        // <strong> must go first:
        text = text.replace(/(\*\*|__)(?=\S)([^\r]*?\S[*_]*)\1/g,
            "<strong>$2</strong>");

        text = text.replace(/(\*|_)(?=\S)([^\r]*?\S)\1/g,
            "<em>$2</em>");

        return text;
    };

    var _DoBlockQuotes = function (text) {

        /*
         text = text.replace(/
         (								// Wrap whole match in $1
         (
         ^[ \t]*>[ \t]?			// '>' at the start of a line
         .+\n					// rest of the first line
         (.+\n)*					// subsequent consecutive lines
         \n*						// blanks
         )+
         )
         /gm, function(){...});
         */

        text = text.replace(/((^[ \t]*>[ \t]?.+\n(.+\n)*\n*)+)/gm,
            function (wholeMatch, m1) {
                var bq = m1;

                // attacklab: hack around Konqueror 3.5.4 bug:
                // "----------bug".replace(/^-/g,"") == "bug"

                bq = bq.replace(/^[ \t]*>[ \t]?/gm, "~0");	// trim one level of quoting

                // attacklab: clean up hack
                bq = bq.replace(/~0/g, "");

                bq = bq.replace(/^[ \t]+$/gm, "");		// trim whitespace-only lines
                bq = _RunBlockGamut(bq);				// recurse

                bq = bq.replace(/(^|\n)/g, "$1  ");
                // These leading spaces screw with <pre> content, so we need to fix that:
                bq = bq.replace(
                    /(\s*<pre>[^\r]+?<\/pre>)/gm,
                    function (wholeMatch, m1) {
                        var pre = m1;
                        // attacklab: hack around Konqueror 3.5.4 bug:
                        pre = pre.replace(/^  /mg, "~0");
                        pre = pre.replace(/~0/g, "");
                        return pre;
                    });

                return hashBlock("<blockquote>\n" + bq + "\n</blockquote>");
            });
        return text;
    };

    var _FormParagraphs = function (text) {
//
//  Params:
//    $text - string to process with html <p> tags
//

        // Strip leading and trailing lines:
        text = text.replace(/^\n+/g, "");
        text = text.replace(/\n+$/g, "");

        var grafs = text.split(/\n{2,}/g);
        var grafsOut = [];

        //
        // Wrap <p> tags.
        //
        var end = grafs.length;
        for (var i = 0; i < end; i++) {
            var str = grafs[i];

            // if this is an HTML marker, copy it
            if (str.search(/~K(\d+)K/g) >= 0) {
                grafsOut.push(str);
            }
            else if (str.search(/\S/) >= 0) {
                str = _RunSpanGamut(str);
                str = str.replace(/^([ \t]*)/g, "<p>");
                str += "</p>";
                grafsOut.push(str);
            }

        }

        //
        // Unhashify HTML blocks
        //
        end = grafsOut.length;
        for (i = 0; i < end; i++) {
            // if this is a marker for an html block...
            while (grafsOut[i].search(/~K(\d+)K/) >= 0) {
                var blockText = g_html_blocks[RegExp.$1];
                blockText = blockText.replace(/\$/g, "$$$$"); // Escape any dollar signs
                grafsOut[i] = grafsOut[i].replace(/~K\d+K/, blockText);
            }
        }

        return grafsOut.join("\n\n");
    };

    var _EncodeAmpsAndAngles = function (text) {
// Smart processing for ampersands and angle brackets that need to be encoded.

        // Ampersand-encoding based entirely on Nat Irons's Amputator MT plugin:
        //   http://bumppo.net/projects/amputator/
        text = text.replace(/&(?!#?[xX]?(?:[0-9a-fA-F]+|\w+);)/g, "&amp;");

        // Encode naked <'s
        text = text.replace(/<(?![a-z\/?\$!])/gi, "&lt;");

        return text;
    };

    var _EncodeBackslashEscapes = function (text) {
//
//   Parameter:  String.
//   Returns:	The string, with after processing the following backslash
//			   escape sequences.
//

        // attacklab: The polite way to do this is with the new
        // escapeCharacters() function:
        //
        // 	text = escapeCharacters(text,"\\",true);
        // 	text = escapeCharacters(text,"`*_{}[]()>#+-.!",true);
        //
        // ...but we're sidestepping its use of the (slow) RegExp constructor
        // as an optimization for Firefox.  This function gets called a LOT.

        text = text.replace(/\\(\\)/g, escapeCharacters_callback);
        text = text.replace(/\\([`*_{}\[\]()>#+-.!])/g, escapeCharacters_callback);
        return text;
    };

    var _DoAutoLinks = function (text) {

        text = text.replace(/<((https?|ftp|dict):[^'">\s]+)>/gi, "<a href=\"$1\">$1</a>");

        // Email addresses: <address@domain.foo>

        /*
         text = text.replace(/
         <
         (?:mailto:)?
         (
         [-.\w]+
         \@
         [-a-z0-9]+(\.[-a-z0-9]+)*\.[a-z]+
         )
         >
         /gi, _DoAutoLinks_callback());
         */
        text = text.replace(/<(?:mailto:)?([-.\w]+\@[-a-z0-9]+(\.[-a-z0-9]+)*\.[a-z]+)>/gi,
            function (wholeMatch, m1) {
                return _EncodeEmailAddress(_UnescapeSpecialChars(m1));
            }
        );

        return text;
    };

    var _EncodeEmailAddress = function (addr) {
//
//  Input: an email address, e.g. "foo@example.com"
//
//  Output: the email address as a mailto link, with each character
//	of the address encoded as either a decimal or hex entity, in
//	the hopes of foiling most address harvesting spam bots. E.g.:
//
//	<a href="&#x6D;&#97;&#105;&#108;&#x74;&#111;:&#102;&#111;&#111;&#64;&#101;
//	   x&#x61;&#109;&#x70;&#108;&#x65;&#x2E;&#99;&#111;&#109;">&#102;&#111;&#111;
//	   &#64;&#101;x&#x61;&#109;&#x70;&#108;&#x65;&#x2E;&#99;&#111;&#109;</a>
//
//  Based on a filter by Matthew Wickline, posted to the BBEdit-Talk
//  mailing list: <http://tinyurl.com/yu7ue>
//

        var encode = [
            function (ch) {
                return "&#" + ch.charCodeAt(0) + ";";
            },
            function (ch) {
                return "&#x" + ch.charCodeAt(0).toString(16) + ";";
            },
            function (ch) {
                return ch;
            }
        ];

        addr = "mailto:" + addr;

        addr = addr.replace(/./g, function (ch) {
            if (ch == "@") {
                // this *must* be encoded. I insist.
                ch = encode[Math.floor(Math.random() * 2)](ch);
            } else if (ch != ":") {
                // leave ':' alone (to spot mailto: later)
                var r = Math.random();
                // roughly 10% raw, 45% hex, 45% dec
                ch = (
                    r > 0.9 ? encode[2](ch) :
                        r > 0.45 ? encode[1](ch) :
                            encode[0](ch)
                );
            }
            return ch;
        });

        addr = "<a href=\"" + addr + "\">" + addr + "</a>";
        addr = addr.replace(/">.+:/g, "\">"); // strip the mailto: from the visible part

        return addr;
    };

    var _UnescapeSpecialChars = function (text) {
//
// Swap back in all the special characters we've hidden.
//
        text = text.replace(/~E(\d+)E/g,
            function (wholeMatch, m1) {
                var charCodeToReplace = parseInt(m1);
                return String.fromCharCode(charCodeToReplace);
            }
        );
        return text;
    };

    var _Outdent = function (text) {
//
// Remove one level of line-leading tabs or spaces
//

        // attacklab: hack around Konqueror 3.5.4 bug:
        // "----------bug".replace(/^-/g,"") == "bug"

        text = text.replace(/^(\t|[ ]{1,4})/gm, "~0"); // attacklab: g_tab_width

        // attacklab: clean up hack
        text = text.replace(/~0/g, "");

        return text;
    };

    var _Detab = function (text) {
// attacklab: Detab's completely rewritten for speed.
// In perl we could fix it by anchoring the regexp with \G.
// In javascript we're less fortunate.

        // expand first n-1 tabs
        text = text.replace(/\t(?=\t)/g, "    "); // attacklab: g_tab_width

        // replace the nth with two sentinels
        text = text.replace(/\t/g, "~A~B");

        // use the sentinel to anchor our regex so it doesn't explode
        text = text.replace(/~B(.+?)~A/g,
            function (wholeMatch, m1, m2) {
                var leadingText = m1;
                var numSpaces = 4 - leadingText.length % 4;  // attacklab: g_tab_width

                // there *must* be a better way to do this:
                for (var i = 0; i < numSpaces; i++) leadingText += " ";

                return leadingText;
            }
        );

        // clean up sentinels
        text = text.replace(/~A/g, "    ");  // attacklab: g_tab_width
        text = text.replace(/~B/g, "");

        return text;
    };


//
//  attacklab: Utility functions
//


    var escapeCharacters = function (text, charsToEscape, afterBackslash) {
        // First we have to escape the escape characters so that
        // we can build a character class out of them
        var regexString = "([" + charsToEscape.replace(/([\[\]\\])/g, "\\$1") + "])";

        if (afterBackslash) {
            regexString = "\\\\" + regexString;
        }

        var regex = new RegExp(regexString, "g");
        text = text.replace(regex, escapeCharacters_callback);

        return text;
    };


    var escapeCharacters_callback = function (wholeMatch, m1) {
        var charCodeToEscape = m1.charCodeAt(0);
        return "~E" + charCodeToEscape + "E";
    };

}; // end of Showdown.converter


// export
if (typeof module !== 'undefined') module.exports = Showdown;

// stolen from AMD branch of underscore
// AMD define happens at the end for compatibility with AMD loaders
// that don't enforce next-turn semantics on modules.
if (typeof define === 'function' && define.amd) {
    define('showdown', [],function () {
        return Showdown;
    });
}
;/**
 * Created by Tivie on 04-11-2014.
 */


//Check if AngularJs and Showdown is defined and only load ng-Showdown if both are present
if (typeof angular !== 'undefined'  && typeof Showdown !== 'undefined') {

    (function (module, Showdown) {

        module
            .provider('$Showdown', provider)
            .directive('sdModelToHtml', ['$Showdown', '$sanitize', markdownToHtmlDirective])
            .filter('sdStripHtml', stripHtmlFilter);

        /**
         * Angular Provider
         * Enables configuration of showdown via angular.config and Dependency Injection into controllers, views
         * directives, etc... This assures the directives and filters provided by the library itself stay consistent
         * with the user configurations.
         * If the user wants to use a different configuration in a determined context, he can use the "classic" Showdown
         * object instead.
         *
         */
        function provider() {

            // Configuration parameters for Showdown
            var config = {
                extensions: [],
                stripHtml: true
            };

            /**
             * Sets a configuration option
             *
             * @param {string} key Config parameter key
             * @param {string} value Config parameter value
             */
            this.setOption = function (key, value) {
                config.key = value;

                return this;
            };

            /**
             * Gets the value of the configuration parameter specified by key
             *
             * @param {string} key The config parameter key
             * @returns {string|null} Returns the value of the config parameter. (or null if the config parameter is not set)
             */
            this.getOption = function (key) {
                if (config.hasOwnProperty(key)) {
                    return config.key;
                } else {
                    return null;
                }
            };

            /**
             * Loads a Showdown Extension
             *
             * @param {string} extensionName The name of the extension to load
             */
            this.loadExtension = function (extensionName) {
                config.extensions.push(extensionName);

                return this;
            };

            function SDObject() {
                var converter = new Showdown.converter(config);

                /**
                 * Converts a markdown text into HTML
                 *
                 * @param {string} markdown The markdown string to be converted to HTML
                 * @returns {string} The converted HTML
                 */
                this.makeHtml = function (markdown) {
                    return converter.makeHtml(markdown);
                };

                /**
                 * Strips a text of it's HTML tags
                 *
                 * @param {string} text
                 * @returns {string}
                 */
                this.stripHtml = function (text) {
                    return String(text).replace(/<[^>]+>/gm, '');
                };
            }

            // The object returned by service provider
            this.$get = function () {
                return new SDObject();
            };
        }

        /**
         * AngularJS Directive to Md to HTML transformation
         *
         * Usage example:
         * <div sd-model-to-html="markdownText" ></div>
         *
         * @param $Showdown
         * @param $sanitize
         * @returns {*}
         */
        function markdownToHtmlDirective($Showdown, $sanitize) {

            var link = function (scope, element) {
                scope.$watch('model', function (newValue) {
                    var val;
                    if (typeof newValue === 'string') {
                        val = $sanitize($Showdown.makeHtml(newValue));
                    } else {
                        val = typeof newValue;
                    }
                    element.html(val);
                });
            };

            return {
                restrict: 'A',
                link: link,
                scope: {
                    model: '=sdModelToHtml'
                }
            };
        }

        /**
         * AngularJS Filter to Strip HTML tags from text
         *
         * @returns {Function}
         */
        function stripHtmlFilter() {
            return function (text) {
                return String(text).replace(/<[^>]+>/gm, '');
            };
        }

    })(angular.module('Showdown', ['ngSanitize']), Showdown);

} else {

    /** TODO Since this library is opt out, maybe we should not throw an error so we can concatenate this
             script with the main lib */
    // throw new Error("ng-showdown was not loaded because one of it's dependencies (AngularJS or Showdown) wasn't met");
}

//# sourceMappingURL=showdown.js.map;
(function(root) {
define("showdown-github", ["showdown"], function() {
  return (function() {
//
//  Github Extension (WIP)
//  ~~strike-through~~   ->  <del>strike-through</del>
//

(function(){
    var github = function(converter) {
        return [
            {
              // strike-through
              // NOTE: showdown already replaced "~" with "~T", so we need to adjust accordingly.
              type    : 'lang',
              regex   : '(~T){2}([^~]+)(~T){2}',
              replace : function(match, prefix, content, suffix) {
                  return '<del>' + content + '</del>';
              }
            }
        ];
    };

    // Client-side export
    if (typeof window !== 'undefined' && window.Showdown && window.Showdown.extensions) { window.Showdown.extensions.github = github; }
    // Server-side export
    if (typeof module !== 'undefined') module.exports = github;
}());

//# sourceMappingURL=github.min.js.map;

  }).apply(root, arguments);
});
}(this));

(function(root) {
define("showdown-table", ["showdown"], function() {
  return (function() {
/*global module:true*/
/*
 * Basic table support with re-entrant parsing, where cell content
 * can also specify markdown.
 *
 * Tables
 * ======
 *
 * | Col 1   | Col 2                                              |
 * |======== |====================================================|
 * |**bold** | ![Valid XHTML] (http://w3.org/Icons/valid-xhtml10) |
 * | Plain   | Value                                              |
 *
 */

(function(){
  var table = function(converter) {
    var tables = {}, style = 'text-align:left;', filter;
    tables.th = function(header){
      if (header.trim() === "") { return "";}
      var id = header.trim().replace(/ /g, '_').toLowerCase();
      return '<th id="' + id + '" style="'+style+'">' + header + '</th>';
    };
    tables.td = function(cell) {
      return '<td style="'+style+'">' + converter.makeHtml(cell) + '</td>';
    };
    tables.ths = function(){
      var out = "", i = 0, hs = [].slice.apply(arguments);
      for (i;i<hs.length;i+=1) {
        out += tables.th(hs[i]) + '\n';
      }
      return out;
    };
    tables.tds = function(){
      var out = "", i = 0, ds = [].slice.apply(arguments);
      for (i;i<ds.length;i+=1) {
        out += tables.td(ds[i]) + '\n';
      }
      return out;
    };
    tables.thead = function() {
      var out, i = 0, hs = [].slice.apply(arguments);
      out = "<thead>\n";
      out += "<tr>\n";
      out += tables.ths.apply(this, hs);
      out += "</tr>\n";
      out += "</thead>\n";
      return out;
    };
    tables.tr = function() {
      var out, i = 0, cs = [].slice.apply(arguments);
      out = "<tr>\n";
      out += tables.tds.apply(this, cs);
      out += "</tr>\n";
      return out;
    };
    filter = function(text) {
      var i=0, lines = text.split('\n'), line, hs, rows, out = [];
      for (i; i<lines.length;i+=1) {
        line = lines[i];
        // looks like a table heading
        if (line.trim().match(/^[|]{1}.*[|]{1}$/)) {
          line = line.trim();
          var tbl = [];
          tbl.push('<table>');
          hs = line.substring(1, line.length -1).split('|');
          tbl.push(tables.thead.apply(this, hs));
          line = lines[++i];
          if (!line.trim().match(/^[|]{1}[-=|: ]+[|]{1}$/)) {
            // not a table rolling back
            line = lines[--i];
          }
          else {
            line = lines[++i];
            tbl.push('<tbody>');
            while (line.trim().match(/^[|]{1}.*[|]{1}$/)) {
              line = line.trim();
              tbl.push(tables.tr.apply(this, line.substring(1, line.length -1).split('|')));
              line = lines[++i];
            }
            tbl.push('</tbody>');
            tbl.push('</table>');
            // we are done with this table and we move along
            out.push(tbl.join('\n'));
            continue;
          }
        }
        out.push(line);
      }
      return out.join('\n');
    };
    return [
    {
      type: 'lang',
      filter: filter
    }
    ];
  };

  // Client-side export
  if (typeof window !== 'undefined' && window.Showdown && window.Showdown.extensions) { window.Showdown.extensions.table = table; }
  // Server-side export
  if (typeof module !== 'undefined') {
    module.exports = table;
  }
}());

//# sourceMappingURL=table.min.js.map;

  }).apply(root, arguments);
});
}(this));

define('pat-markdown',[
    "jquery",
    "pat-logger",
    "pat-registry",
    "pat-utils",
    "pat-base",
    "pat-inject",
    "showdown",
    "showdown-github",
    "showdown-table"
], function($, logger, registry, utils, Base, inject, Showdown) {
    var log = logger.getLogger("pat.markdown");
    var is_markdown_resource = /\.md$/;

    var Markdown = Base.extend({
        name: "markdown",
        trigger: ".pat-markdown",

        init: function($el, options) {
            if (this.$el.is(this.trigger)) {
                /* This pattern can either be used standalone or as an enhancement
                * to pat-inject. The following only applies to standalone, when
                * $el is explicitly configured with the pat-markdown trigger.
                */
                var source = this.$el.is(":input") ? this.$el.val() : this.$el.text();
                this.render(source).replaceAll(this.$el);
            }
        },

        render: function(text) {
            var $rendering = $("<div/>"),
                converter = new Showdown.converter({extensions: ['table', 'prettify', 'github']});
            $rendering.html(converter.makeHtml(text));
            return $rendering;
        },

        renderForInjection: function(cfg, data) {
            var header, source = data;
            if (cfg.source && (header=/^#+\s*(.*)/.exec(cfg.source))!==null) {
                source = this.extractSection(source, header[1]);
                if (source===null) {
                    log.warn("Could not find section \"" + cfg.source + "\" in " + cfg.url);
                    return $("<div/>").attr("data-src", cfg.url);
                }
                source+="\n";  // Needed for some markdown syntax
            }
            return this.render(source).attr("data-src", cfg.source ? cfg.url+cfg.source : cfg.url);
        },

        extractSection: function(text, header) {
            var pattern, level;
            header = utils.escapeRegExp(header);
            var matcher = new RegExp(
                        "^((#+)\\s*@TEXT@\\s*|@TEXT@\\s*\\n([=-])+\\s*)$".replace(/@TEXT@/g, header), "m"),
                match = matcher.exec(text);
            if (match===null) {
                return null;
            } else if (match[2]) {
                // We have a ##-style header.
                level = match[2].length;
                pattern="^#{@LEVEL@}\\s*@TEXT@\\s*$\\n+((?:.|\\n)*?(?=^#{1,@LEVEL@}\\s)|.*(?:.|\\n)*)";
                pattern=pattern.replace(/@LEVEL@/g, level);
            } else if (match[3]) {
                // We have an underscore-style header.
                if (match[3]==="=")
                    pattern="^@TEXT@\\s*\\n=+\\s*\\n+((?:.|\\n)*?(?=^.*?\\n=+\\s*$)|(?:.|\\n)*)";
                else
                    pattern="^@TEXT@\\s*\\n-+\\s*\\n+((?:.|\\n)*?(?=^.*?\\n[-=]+\\s*$)|(?:.|\\n)*)";
            } else {
                log.error("Unexpected section match result", match);
                return null;
            }
            pattern = pattern.replace(/@TEXT@/g, header);
            matcher = new RegExp(pattern, "m");
            match = matcher.exec(text);
            if (match===null) {
                log.error("Failed to find section with known present header?");
            }
            return (match!==null) ? match[0] : null;
        }
    });

    // Add support for syntax highlighting via pat-syntax-highlight
    Showdown.extensions.prettify = function(converter) {
        return [{ type: 'output', filter: function(source){
            return source.replace(/(<pre>)?<code>/gi, function(match, pre) {
                if (pre) {
                    return '<pre class="pat-syntax-highlight" tabIndex="0"><code data-inner="1">';
                } else {
                    return '<code class="pat-syntax-highlight">';
                }
            });
        }}];
    };

    $(document).ready(function () {
        $(document.body).on("patterns-inject-triggered.pat-markdown", "a.pat-inject", function identifyMarkdownURLs() {
            /* Identify injected URLs which point to markdown files and set their
            * datatype so that we can register a type handler for them.
            */
            var cfgs = $(this).data("pat-inject");
            cfgs.forEach(function(cfg) {
                if (is_markdown_resource.test(cfg.url)) {
                    cfg.dataType = "markdown";
                }
            });
        });
    });

    inject.registerTypeHandler("markdown", {
        sources: function(cfgs, data) {
            return cfgs.map(function(cfg) {
                var pat = Markdown.init(cfg.$target);
                return pat.renderForInjection(cfg, data);
            });
        }
    });
    return Markdown;
});

define('pat-menu',[
    "jquery",
    "pat-registry"
], function($, patterns) {
    var menu = {
        name: "menu",
        trigger: "ul.pat-menu",

        init: function($root) {
            return $root.each(function() {
                var $menu = $(this),
                    timer,
                    closeMenu, openMenu,
                    mouseOverHandler, mouseOutHandler;

                openMenu = function($li) {
                    if (timer) {
                        clearTimeout(timer);
                        timer = null;
                    }

                    if (!$li.hasClass("open")) {
                        $li.siblings("li.open").each(function() { closeMenu($menu);});
                        $li.addClass("open").removeClass("closed");
                    }
                };

                closeMenu = function($li) {
                    $li.find("li.open").andSelf().removeClass("open").addClass("closed");
                };

                mouseOverHandler = function() {
                    var $li = $(this);
                    openMenu($li);
                };

                mouseOutHandler = function() {
                    var $li = $(this);

                    if (timer) {
                        clearTimeout(timer);
                        timer=null;
                    }

                    timer = setTimeout(function() { closeMenu($li); }, 1000);
                };

                $root.find("li")
                    .addClass("closed")
                    .filter(":has(ul)").addClass("hasChildren").end()
                    .on("mouseover.pat-menu", mouseOverHandler)
                    .on("mouseout.pat-menu", mouseOutHandler);
            });
        }
    };

    patterns.register(menu);
});

// jshint indent: 4, browser: true, jquery: true, quotmark: double
// vim: sw=4 expandtab
;
define('pat-navigation',[
    "jquery",
    "pat-logger",
    "pat-registry"
], function($, logger, registry) {
    var log = logger.getLogger("pat.navigation");

    var _ = {
        name: "navigation",
        trigger: "nav, .navigation, .pat-navigation",
        init: function($el) {
            return $el.each(function() {
                var $el = $(this);
                var curpath = window.location.pathname;
                log.debug("current path:", curpath);

                // check whether to load
                if ($el.hasClass("navigation-load-current")) {
                    $el.find("a.current, .current a").click();
                    // check for current elements injected here
                    $el.on("patterns-injected-scanned", function(ev) {
                        var $target = $(ev.target);
                        if ($target.is("a.current"))
                            $target.click();
                        if ($target.is(".current"))
                            $target.find("a").click();
                        _._updatenavpath($el);
                    });
                }

                // An anchor within this navigation triggered injection
                $el.on("patterns-inject-triggered", "a", function(ev) {
                    var $target = $(ev.target);
                    // remove all set current classes
                    $el.find(".current").removeClass("current");
                    // set .current on target
                    $target.addClass("current");
                    // If target's parent is an LI, also set current there
                    $target.parent("li").addClass("current");
                    _._updatenavpath($el);
                });

                // set current class if it is not set
                if ($el.find(".current").length === 0) {
                    $el.find("li a").each(function() {
                        var $a = $(this),
                            $li = $a.parents("li:first"),
                            url = $a.attr("href"),
                            path;
                        if (typeof url === "undefined") {
                            return;
                        }
                        path = _._pathfromurl(url);
                        log.debug("checking url:", url, "extracted path:", path);
                        if (_._match(curpath, path)) {
                            log.debug("found match", $li);
                            $li.addClass("current");
                        }
                    });
                }
                _._updatenavpath($el);
            });
        },
        _updatenavpath: function($el) {
            $el.find(".navigation-in-path").removeClass("navigation-in-path");
            $el.find("li:has(.current)").addClass("navigation-in-path");
        },
        _match: function(curpath, path) {
            if (!path) {
                log.debug("path empty");
                return false;
            }
            // current path needs to end in the anchor's path
            if (path !== curpath.slice(- path.length)) {
                log.debug(curpath, "does not end in", path);
                return false;
            }
            // XXX: we might need more exclusion tests
            return true;
        },
        _pathfromurl: function(url) {
            var path = url.split("#")[0].split("://");
            if (path.length > 2) {
                log.error("weird url", url);
                return "";
            }
            if (path.length === 1) return path[0];
            return path[1].split("/").slice(1).join("/");
        }
    };
    registry.register(_);
    return _;
});

// jshint indent: 4, browser: true, jquery: true, quotmark: double
// vim: sw=4 expandtab
;
(function(root) {
define("jquery.placeholder", ["jquery"], function() {
  return (function() {
/*! http://mths.be/placeholder v2.0.7 by @mathias */
;(function(window, document, $) {

	var isInputSupported = 'placeholder' in document.createElement('input'),
	    isTextareaSupported = 'placeholder' in document.createElement('textarea'),
	    prototype = $.fn,
	    valHooks = $.valHooks,
	    hooks,
	    placeholder;

	if (isInputSupported && isTextareaSupported) {

		placeholder = prototype.placeholder = function() {
			return this;
		};

		placeholder.input = placeholder.textarea = true;

	} else {

		placeholder = prototype.placeholder = function() {
			var $this = this;
			$this
				.filter((isInputSupported ? 'textarea' : ':input') + '[placeholder]')
				.not('.placeholder')
				.bind({
					'focus.placeholder': clearPlaceholder,
					'blur.placeholder': setPlaceholder
				})
				.data('placeholder-enabled', true)
				.trigger('blur.placeholder');
			return $this;
		};

		placeholder.input = isInputSupported;
		placeholder.textarea = isTextareaSupported;

		hooks = {
			'get': function(element) {
				var $element = $(element);
				return $element.data('placeholder-enabled') && $element.hasClass('placeholder') ? '' : element.value;
			},
			'set': function(element, value) {
				var $element = $(element);
				if (!$element.data('placeholder-enabled')) {
					return element.value = value;
				}
				if (value == '') {
					element.value = value;
					// Issue #56: Setting the placeholder causes problems if the element continues to have focus.
					if (element != document.activeElement) {
						// We can’t use `triggerHandler` here because of dummy text/password inputs :(
						setPlaceholder.call(element);
					}
				} else if ($element.hasClass('placeholder')) {
					clearPlaceholder.call(element, true, value) || (element.value = value);
				} else {
					element.value = value;
				}
				// `set` can not return `undefined`; see http://jsapi.info/jquery/1.7.1/val#L2363
				return $element;
			}
		};

		isInputSupported || (valHooks.input = hooks);
		isTextareaSupported || (valHooks.textarea = hooks);

		$(function() {
			// Look for forms
			$(document).delegate('form', 'submit.placeholder', function() {
				// Clear the placeholder values so they don’t get submitted
				var $inputs = $('.placeholder', this).each(clearPlaceholder);
				setTimeout(function() {
					$inputs.each(setPlaceholder);
				}, 10);
			});
		});

		// Clear placeholder values upon page reload
		$(window).bind('beforeunload.placeholder', function() {
			$('.placeholder').each(function() {
				this.value = '';
			});
		});

	}

	function args(elem) {
		// Return an object of element attributes
		var newAttrs = {},
		    rinlinejQuery = /^jQuery\d+$/;
		$.each(elem.attributes, function(i, attr) {
			if (attr.specified && !rinlinejQuery.test(attr.name)) {
				newAttrs[attr.name] = attr.value;
			}
		});
		return newAttrs;
	}

	function clearPlaceholder(event, value) {
		var input = this,
		    $input = $(input);
		if (input.value == $input.attr('placeholder') && $input.hasClass('placeholder')) {
			if ($input.data('placeholder-password')) {
				$input = $input.hide().next().show().attr('id', $input.removeAttr('id').data('placeholder-id'));
				// If `clearPlaceholder` was called from `$.valHooks.input.set`
				if (event === true) {
					return $input[0].value = value;
				}
				$input.focus();
			} else {
				input.value = '';
				$input.removeClass('placeholder');
				input == document.activeElement && input.select();
			}
		}
	}

	function setPlaceholder() {
		var $replacement,
		    input = this,
		    $input = $(input),
		    $origInput = $input,
		    id = this.id;
		if (input.value == '') {
			if (input.type == 'password') {
				if (!$input.data('placeholder-textinput')) {
					try {
						$replacement = $input.clone().attr({ 'type': 'text' });
					} catch(e) {
						$replacement = $('<input>').attr($.extend(args(this), { 'type': 'text' }));
					}
					$replacement
						.removeAttr('name')
						.data({
							'placeholder-password': true,
							'placeholder-id': id
						})
						.bind('focus.placeholder', clearPlaceholder);
					$input
						.data({
							'placeholder-textinput': $replacement,
							'placeholder-id': id
						})
						.before($replacement);
				}
				$input = $input.removeAttr('id').hide().prev().attr('id', id).show();
				// Note: `$input[0] != input` now!
			}
			$input.addClass('placeholder');
			$input[0].value = $input.attr('placeholder');
		} else {
			$input.removeClass('placeholder');
		}
	}

}(this, document, jQuery));

  }).apply(root, arguments);
});
}(this));

define('pat-placeholder',[
    "pat-registry",
    "jquery.placeholder"
], function(patterns) {
    var pattern_spec = {
        name: "placeholder",
        trigger: ":input[placeholder]",

        init: function($el) {
            return $el.placeholder();
        }
    };

    // This is slightly more accurate test than Modernizr uses.
    if (!("placeholder" in document.createElement("input") &&
          "placeholder" in document.createElement("textarea")))
        patterns.register(pattern_spec);
    return pattern_spec;
});

// jshint indent: 4, browser: true, jquery: true, quotmark: double
// vim: sw=4 expandtab
;
/**
 * Copyright 2012-2013 Syslab.com GmbH - JC Brand
 */
define('pat-scroll',[
    "jquery",
    "pat-registry",
    "pat-base",
    "pat-utils",
    "pat-logger",
    "pat-parser",
    "underscore",
    "imagesloaded"
], function($, patterns, Base, utils, logging, Parser, _, imagesLoaded) {
    var log = logging.getLogger("scroll"),
        parser = new Parser("scroll");
    parser.addArgument("trigger", "click", ["click", "auto"]);
    parser.addArgument("direction", "top", ["top", "left"]);
    parser.addArgument("selector");
    parser.addArgument("offset");

    return Base.extend({
        name: "scroll",
        trigger: ".pat-scroll",
        jquery_plugin: true,

        init: function($el, opts) {
            this.options = parser.parse(this.$el, opts);
            if (this.options.trigger == "auto") {
                // Only calculate the offset when all images are loaded
                var that = this;
                imagesLoaded($('body'), function() {
                   that.smoothScroll();
                });
            } else if (this.options.trigger == "click") {
                this.$el.click(this.onClick.bind(this));
            }
            this.$el.on("pat-update", this.onPatternsUpdate.bind(this));
            this.markBasedOnFragment();
            this.on('hashchange', this.clearIfHidden.bind(this));
            $(window).scroll(_.debounce(this.markIfVisible.bind(this), 50));
        },

        onClick: function(ev) {
            ev.preventDefault();
            history.pushState({}, null, this.$el.attr('href'));
            this.smoothScroll();
            this.markBasedOnFragment();
            // manually trigger the hashchange event on all instances of pat-scroll
            $('a.pat-scroll').trigger("hashchange");
        },

        markBasedOnFragment: function(ev) {
            // Get the fragment from the URL and set the corresponding this.$el as current
            var $target = $('#' + window.location.hash.substr(1));
            if ($target.length > 0) {
                this.$el.addClass("current"); // the element that was clicked on
                $target.addClass("current");
            }
        },

        clearIfHidden: function(ev) {
            var active_target = '#' + window.location.hash.substr(1),
                $active_target = $(active_target),
                target = '#' + this.$el[0].href.split('#').pop();
            if ($active_target.length > 0) {
                if (active_target != target) {
                    // if the element does not match the one listed in the url #,
                    // clear the current class from it.
                    var $target = $('#' + this.$el[0].href.split('#').pop());
                    $target.removeClass("current");
                    this.$el.removeClass("current");
                }
            }
        },

        markIfVisible: function(ev) {
            var fragment, $target, href;
            if (this.$el.hasClass('pat-scroll-animated')) {
                // this section is triggered when the scrolling is a result of the animate function
                // ie. automatic scrolling as opposed to the user manually scrolling
                this.$el.removeClass('pat-scroll-animated');
            } else if (this.$el[0].nodeName === "A") {
                href = this.$el[0].href;
                fragment = href.indexOf('#') !== -1 && href.split('#').pop() || undefined;
                if (fragment) {
                    $target = $('#'+fragment);
                    if ($target.length) {
                        if (utils.isElementInViewport($target[0], true, this.options.offset)) {
                            // check that the anchor's target is visible
                            // if so, mark both the anchor and the target element
                            $target.addClass("current");
                            this.$el.addClass("current");
                        }
                        $(this.$el).trigger("pat-update", {pattern: "scroll"});
                    }
                }
            }
        },

        onPatternsUpdate: function(ev, data) {
            var fragment, $target, href;
            if (data.pattern === 'stacks') {
                if (data.originalEvent && data.originalEvent.type === "click") {
                    this.smoothScroll();
                }
            } else if (data.pattern === 'scroll') {
                href = this.$el[0].href;
                fragment = href.indexOf('#') !== -1 && href.split('#').pop() || undefined;
                if (fragment) {
                    $target = $('#'+fragment);
                    if ($target.length) {
                        if (utils.isElementInViewport($target[0], true, this.options.offset) === false) {
                            // if the anchor's target is invisible, remove current class from anchor and target.
                            $target.removeClass("current");
                            $(this.$el).removeClass("current");
                        }
                    }
                }
            }
        },

        smoothScroll: function() {
            var scroll = this.options.direction == "top" ? 'scrollTop' : 'scrollLeft',
                scrollable, options = {};
            if (typeof this.options.offset != "undefined") {
                // apply scroll options directly
                scrollable = this.options.selector ? $(this.options.selector) : this.$el;
                options[scroll] = this.options.offset;
            } else {
                // Get the first element with overflow (the scroll container)
                // starting from the *target*
                // The intent is to move target into view within scrollable
                // if the scrollable has no scrollbar, do not scroll body

                href = this.$el.attr('href');
                fragment = href.indexOf('#') !== -1 && href.split('#').pop() || undefined;
                var target = $('#'+fragment);
                if (target.length === 0) {
                    return;
                }

                scrollable = $(target.parents().filter(function() {
                    return ( $(this).css('overflow') === 'auto' ||
                             $(this).css('overflow') === 'scroll' );
                }).first())

                if ( typeof scrollable[0] === 'undefined' ) {
                    scrollable = $('html, body');
                    // positioning context is document
                    if ( scroll === "scrollTop" ) {
                        options[scroll] = Math.floor(target.offset().top);
                    } else {
                        options[scroll] = Math.floor(target.offset().left);
                    }
                } else if ( scroll === "scrollTop" ) {
                    // difference between target top and scrollable top becomes 0
                    options[scroll] = Math.floor(scrollable.scrollTop()
                                                 + target.offset().top
                                                 - scrollable.offset().top);
                } else {
                    options[scroll] = Math.floor(scrollable.scrollLeft()
                                                 + target.offset().left
                                                 - scrollable.offset().left);
                }
            }

            // execute the scroll
            scrollable.animate(options, {
                duration: 500,
                start: function() {
                    $('.pat-scroll').addClass('pat-scroll-animated');
                }
            });
        }


    });
});

// jshint indent: 4, browser: true, jquery: true, quotmark: double
// vim: sw=4 expandtab
;
/**
 * Patterns selectbox - Expose select option
 * for (un)checking.
 *
 * Copyright 2012-2014 Simplon B.V. - Wichert Akkerman
 * Copyright 2012 JC Brand
 * Copyright 2012-2013 Florian Friesdorf
 */
define('pat-selectbox',[
    "jquery",
    "pat-registry"
], function($, patterns) {
    var selectbox = {
        name: "selectbox",
        trigger: "select",

        init: function($el) {
            var $forms = $();
            $el.each(function() {
                if (this.form !== null) {
                    var $form = $(this.form);
                    if ($form.data("pat-selectbox.reset"))
                        return;
                    $form.data("pat-selectbox.reset", true);
                    $forms = $forms.add(this.form);
                }
            });

            $el.filter("select:not([multiple])")
                .each(function() {
                    var $el = $(this);
                    // create parent span if not direct child of a label
                    if ($el.parent("label").length === 0)
                        $el.wrap("<span />");
                    selectbox.onChangeSelect.call(this);
                })
                .on("change.pat-selectbox", selectbox.onChangeSelect);

            $forms.on("reset.pat-selectbox", selectbox.onFormReset);
        },

        destroy: function($el) {
            return $el.off(".pat-selectbox");
        },

        onFormReset: function() {
            // This event is triggered before the form is reset, and we need
            // the post-reset state to update our pattern. Use a small delay
            // to fix this.
            var form = this;
            setTimeout(function() {
                $("select:not([multiple])", form).each(selectbox.onChangeSelect);
            }, 50);
        },

        onChangeSelect: function() {
            var $select = $(this);
            $select.parent().attr(
                "data-option",
                $select.find("option:selected").text()
            );
            $select.parent().attr("data-option-value", $select.val());
        }
    };

    patterns.register(selectbox);
    return selectbox;
});

// vim: sw=4 expandtab
;
/**
 * Stacks pattern
 *
 * Copyright 2013 Simplon B.V. - Wichert Akkerman
 */
define('pat-stacks',[
    "jquery",
    "pat-parser",
    "pat-base",
    "pat-logger",
    "pat-utils",
    "pat-registry"
], function($, Parser, Base, logging, utils, registry) {
    "use strict";
    var log = logging.getLogger("stacks"),
        parser = new Parser("stacks");
    parser.addArgument("selector", "> *[id]");
    parser.addArgument("transition", "none", ["none", "css", "fade", "slide"]);
    parser.addArgument("effect-duration", "fast");
    parser.addArgument("effect-easing", "swing");

    return Base.extend({
        name: "stacks",
        trigger: ".pat-stacks",
        document: document,

        init: function($el, opts) {
            this.options = parser.parse(this.$el, opts);
            this._setupStack();
            $(this.document).on("click", "a", this._onClick.bind(this));
            return $el;
        },

        _setupStack: function() {
            var selected = this._currentFragment(),
                $sheets = this.$el.find(this.options.selector),
                $visible = [],
                $invisible;
            if ($sheets.length < 2) {
                log.warn("Stacks pattern: must have more than one sheet.", this.$el[0]);
                return;
            }
            if (selected) {
                try {
                    $visible = $sheets.filter("#"+selected);
                } catch (e) {
                    selected = undefined;
                }
            }
            if (!$visible.length) {
                $visible = $sheets.first();
                selected = $visible[0].id;
            }
            $invisible = $sheets.not($visible);
            utils.hideOrShow($visible, true, {transition: "none"}, this.name);
            utils.hideOrShow($invisible, false, {transition: "none"}, this.name);
            this._updateAnchors(selected);
        },

         _base_URL: function() {
            return this.document.URL.split("#")[0];
         },

        _currentFragment: function() {
            var parts = this.document.URL.split("#");
            if (parts.length === 1) {
                return null;
            }
            return parts[parts.length-1];
        },

        _onClick: function(e) {
            var base_url = this._base_URL(),
                href_parts = e.currentTarget.href.split("#");
            // Check if this is an in-document link and has a fragment
            if (base_url !== href_parts[0] || !href_parts[1]) {
                return;
            }
            if (!this.$el.has("#"+href_parts[1]).length) {
                return;
            }
            e.preventDefault();
            this._updateAnchors(href_parts[1]);
            this._switch(href_parts[1]);
            $(e.target).trigger("pat-update", {
                pattern: "stacks",
                originalEvent: e
            });
        },

        _updateAnchors: function(selected) {
            var $sheets = this.$el.find(this.options.selector),
                base_url = this._base_URL();
            $sheets.each(function (idx, sheet) {
                // This may appear odd, but: when querying a browser uses the
                // original href of an anchor as it appeared in the document
                // source, but when you access the href property you always get
                // the fully qualified version.
                var $anchors = $("a[href=\""+base_url+"#"+sheet.id+"\"],a[href=\"#"+sheet.id+"\"]");
                if (sheet.id === selected) {
                    $anchors.addClass("current");
                } else {
                    $anchors.removeClass("current");
                }
            });
        },

        _switch: function(sheet_id) {
            var $sheet = this.$el.find("#"+sheet_id);
            if (!$sheet.length || $sheet.hasClass("visible")) {
                return;
            }
            var $invisible = this.$el.find(this.options.selector).not($sheet);
            utils.hideOrShow($invisible, false, this.options, this.name);
            utils.hideOrShow($sheet, true, this.options, this.name);
        }
    });
});

(function(root) {
define("stickyfill", [], function() {
  return (function() {
/*!
 * Stickyfill -- `position: sticky` polyfill
 * v. 1.1.4 | https://github.com/wilddeer/stickyfill
 * Copyright Oleg Korsunsky | http://wd.dizaina.net/
 *
 * MIT License
 */
(function(doc, win) {
    var watchArray = [],
        scroll,
        initialized = false,
        html = doc.documentElement,
        noop = function() {},
        checkTimer,

        //visibility API strings
        hiddenPropertyName = 'hidden',
        visibilityChangeEventName = 'visibilitychange';

    //fallback to prefixed names in old webkit browsers
    if (doc.webkitHidden !== undefined) {
        hiddenPropertyName = 'webkitHidden';
        visibilityChangeEventName = 'webkitvisibilitychange';
    }

    //test getComputedStyle
    if (!win.getComputedStyle) {
        seppuku();
    }

    //test for native support
    var prefixes = ['', '-webkit-', '-moz-', '-ms-'],
        block = document.createElement('div');

    for (var i = prefixes.length - 1; i >= 0; i--) {
        try {
            block.style.position = prefixes[i] + 'sticky';
        }
        catch(e) {}
        if (block.style.position != '') {
            seppuku();
        }
    }

    updateScrollPos();

    //commit seppuku!
    function seppuku() {
        init = add = rebuild = pause = stop = kill = noop;
    }

    function mergeObjects(targetObj, sourceObject) {
        for (var key in sourceObject) {
            if (sourceObject.hasOwnProperty(key)) {
                targetObj[key] = sourceObject[key];
            }
        }
    }

    function parseNumeric(val) {
        return parseFloat(val) || 0;
    }

    function updateScrollPos() {
        scroll = {
            top: win.pageYOffset,
            left: win.pageXOffset
        };
    }

    function onScroll() {
        if (win.pageXOffset != scroll.left) {
            updateScrollPos();
            rebuild();
            return;
        }
        
        if (win.pageYOffset != scroll.top) {
            updateScrollPos();
            recalcAllPos();
        }
    }

    //fixes flickering
    function onWheel(event) {
        setTimeout(function() {
            if (win.pageYOffset != scroll.top) {
                scroll.top = win.pageYOffset;
                recalcAllPos();
            }
        }, 0);
    }

    function recalcAllPos() {
        for (var i = watchArray.length - 1; i >= 0; i--) {
            recalcElementPos(watchArray[i]);
        }
    }

    function recalcElementPos(el) {
        if (!el.inited) return;

        var currentMode = (scroll.top <= el.limit.start? 0: scroll.top >= el.limit.end? 2: 1);

        if (el.mode != currentMode) {
            switchElementMode(el, currentMode);
        }
    }

    //checks whether stickies start or stop positions have changed
    function fastCheck() {
        for (var i = watchArray.length - 1; i >= 0; i--) {
            if (!watchArray[i].inited) continue;

            var deltaTop = Math.abs(getDocOffsetTop(watchArray[i].clone) - watchArray[i].docOffsetTop),
                deltaHeight = Math.abs(watchArray[i].parent.node.offsetHeight - watchArray[i].parent.height);

            if (deltaTop >= 2 || deltaHeight >= 2) return false;
        }
        return true;
    }

    function initElement(el) {
        if (isNaN(parseFloat(el.computed.top)) || el.isCell || el.computed.display == 'none') return;

        el.inited = true;

        if (!el.clone) clone(el);
        if (el.parent.computed.position != 'absolute' &&
            el.parent.computed.position != 'relative') el.parent.node.style.position = 'relative';

        recalcElementPos(el);

        el.parent.height = el.parent.node.offsetHeight;
        el.docOffsetTop = getDocOffsetTop(el.clone);
    }

    function deinitElement(el) {
        var deinitParent = true;

        el.clone && killClone(el);
        mergeObjects(el.node.style, el.css);

        //check whether element's parent is used by other stickies
        for (var i = watchArray.length - 1; i >= 0; i--) {
            if (watchArray[i].node !== el.node && watchArray[i].parent.node === el.parent.node) {
                deinitParent = false;
                break;
            }
        };

        if (deinitParent) el.parent.node.style.position = el.parent.css.position;
        el.mode = -1;
    }

    function initAll() {
        for (var i = watchArray.length - 1; i >= 0; i--) {
            initElement(watchArray[i]);
        }
    }

    function deinitAll() {
        for (var i = watchArray.length - 1; i >= 0; i--) {
            deinitElement(watchArray[i]);
        }
    }

    function switchElementMode(el, mode) {
        var nodeStyle = el.node.style;

        switch (mode) {
            case 0:
                nodeStyle.position = 'absolute';
                nodeStyle.left = el.offset.left + 'px';
                nodeStyle.right = el.offset.right + 'px';
                nodeStyle.top = el.offset.top + 'px';
                nodeStyle.bottom = 'auto';
                nodeStyle.width = 'auto';
                nodeStyle.marginLeft = 0;
                nodeStyle.marginRight = 0;
                nodeStyle.marginTop = 0;
                break;

            case 1:
                nodeStyle.position = 'fixed';
                nodeStyle.left = el.box.left + 'px';
                nodeStyle.right = el.box.right + 'px';
                nodeStyle.top = el.css.top;
                nodeStyle.bottom = 'auto';
                nodeStyle.width = 'auto';
                nodeStyle.marginLeft = 0;
                nodeStyle.marginRight = 0;
                nodeStyle.marginTop = 0;
                break;

            case 2:
                nodeStyle.position = 'absolute';
                nodeStyle.left = el.offset.left + 'px';
                nodeStyle.right = el.offset.right + 'px';
                nodeStyle.top = 'auto';
                nodeStyle.bottom = 0;
                nodeStyle.width = 'auto';
                nodeStyle.marginLeft = 0;
                nodeStyle.marginRight = 0;
                break;
        }

        el.mode = mode;
    }

    function clone(el) {
        el.clone = document.createElement('div');

        var refElement = el.node.nextSibling || el.node,
            cloneStyle = el.clone.style;

        cloneStyle.height = el.height + 'px';
        cloneStyle.width = el.width + 'px';
        cloneStyle.marginTop = el.computed.marginTop;
        cloneStyle.marginBottom = el.computed.marginBottom;
        cloneStyle.marginLeft = el.computed.marginLeft;
        cloneStyle.marginRight = el.computed.marginRight;
        cloneStyle.padding = cloneStyle.border = cloneStyle.borderSpacing = 0;
        cloneStyle.fontSize = '1em';
        cloneStyle.position = 'static';
        cloneStyle.cssFloat = el.computed.cssFloat;

        el.node.parentNode.insertBefore(el.clone, refElement);
    }

    function killClone(el) {
        el.clone.parentNode.removeChild(el.clone);
        el.clone = undefined;
    }

    function getElementParams(node) {
        var computedStyle = getComputedStyle(node),
            parentNode = node.parentNode,
            parentComputedStyle = getComputedStyle(parentNode),
            cachedPosition = node.style.position;

        node.style.position = 'relative';

        var computed = {
                top: computedStyle.top,
                marginTop: computedStyle.marginTop,
                marginBottom: computedStyle.marginBottom,
                marginLeft: computedStyle.marginLeft,
                marginRight: computedStyle.marginRight,
                cssFloat: computedStyle.cssFloat,
                display: computedStyle.display
            },
            numeric = {
                top: parseNumeric(computedStyle.top),
                marginBottom: parseNumeric(computedStyle.marginBottom),
                paddingLeft: parseNumeric(computedStyle.paddingLeft),
                paddingRight: parseNumeric(computedStyle.paddingRight),
                borderLeftWidth: parseNumeric(computedStyle.borderLeftWidth),
                borderRightWidth: parseNumeric(computedStyle.borderRightWidth)
            };

        node.style.position = cachedPosition;

        var css = {
                position: node.style.position,
                top: node.style.top,
                bottom: node.style.bottom,
                left: node.style.left,
                right: node.style.right,
                width: node.style.width,
                marginTop: node.style.marginTop,
                marginLeft: node.style.marginLeft,
                marginRight: node.style.marginRight
            },
            nodeOffset = getElementOffset(node),
            parentOffset = getElementOffset(parentNode),
            
            parent = {
                node: parentNode,
                css: {
                    position: parentNode.style.position
                },
                computed: {
                    position: parentComputedStyle.position
                },
                numeric: {
                    borderLeftWidth: parseNumeric(parentComputedStyle.borderLeftWidth),
                    borderRightWidth: parseNumeric(parentComputedStyle.borderRightWidth),
                    borderTopWidth: parseNumeric(parentComputedStyle.borderTopWidth),
                    borderBottomWidth: parseNumeric(parentComputedStyle.borderBottomWidth)
                }
            },

            el = {
                node: node,
                box: {
                    left: nodeOffset.win.left,
                    right: html.clientWidth - nodeOffset.win.right
                },
                offset: {
                    top: nodeOffset.win.top - parentOffset.win.top - parent.numeric.borderTopWidth,
                    left: nodeOffset.win.left - parentOffset.win.left - parent.numeric.borderLeftWidth,
                    right: -nodeOffset.win.right + parentOffset.win.right - parent.numeric.borderRightWidth
                },
                css: css,
                isCell: computedStyle.display == 'table-cell',
                computed: computed,
                numeric: numeric,
                width: nodeOffset.win.right - nodeOffset.win.left,
                height: nodeOffset.win.bottom - nodeOffset.win.top,
                mode: -1,
                inited: false,
                parent: parent,
                limit: {
                    start: nodeOffset.doc.top - numeric.top,
                    end: parentOffset.doc.top + parentNode.offsetHeight - parent.numeric.borderBottomWidth -
                        node.offsetHeight - numeric.top - numeric.marginBottom
                }
            };

        return el;
    }

    function getDocOffsetTop(node) {
        var docOffsetTop = 0;

        while (node) {
            docOffsetTop += node.offsetTop;
            node = node.offsetParent;
        }

        return docOffsetTop;
    }

    function getElementOffset(node) {
        var box = node.getBoundingClientRect();

            return {
                doc: {
                    top: box.top + win.pageYOffset,
                    left: box.left + win.pageXOffset
                },
                win: box
            };
    }

    function startFastCheckTimer() {
        checkTimer = setInterval(function() {
            !fastCheck() && rebuild();
        }, 500);
    }

    function stopFastCheckTimer() {
        clearInterval(checkTimer);
    }

    function handlePageVisibilityChange() {
        if (!initialized) return;

        if (document[hiddenPropertyName]) {
            stopFastCheckTimer();
        }
        else {
            startFastCheckTimer();
        }
    }

    function init() {
        if (initialized) return;

        updateScrollPos();
        initAll();

        win.addEventListener('scroll', onScroll);
        win.addEventListener('wheel', onWheel);

        //watch for width changes
        win.addEventListener('resize', rebuild);
        win.addEventListener('orientationchange', rebuild);

        //watch for page visibility
        doc.addEventListener(visibilityChangeEventName, handlePageVisibilityChange);

        startFastCheckTimer();

        initialized = true;
    }

    function rebuild() {
        if (!initialized) return;

        deinitAll();
        
        for (var i = watchArray.length - 1; i >= 0; i--) {
            watchArray[i] = getElementParams(watchArray[i].node);
        }
        
        initAll();
    }

    function pause() {
        win.removeEventListener('scroll', onScroll);
        win.removeEventListener('wheel', onWheel);
        win.removeEventListener('resize', rebuild);
        win.removeEventListener('orientationchange', rebuild);
        doc.removeEventListener(visibilityChangeEventName, handlePageVisibilityChange);

        stopFastCheckTimer();

        initialized = false;
    }

    function stop() {
        pause();
        deinitAll(); 
    }

    function kill() {
        stop();

        //empty the array without loosing the references,
        //the most performant method according to http://jsperf.com/empty-javascript-array
        while (watchArray.length) {
            watchArray.pop();
        }
    }

    function add(node) {
        //check if Stickyfill is already applied to the node
        for (var i = watchArray.length - 1; i >= 0; i--) {
            if (watchArray[i].node === node) return;
        };

        var el = getElementParams(node);

        watchArray.push(el);

        if (!initialized) {
            init();
        }
        else {
            initElement(el);
        }
    }

    function remove(node) {
        for (var i = watchArray.length - 1; i >= 0; i--) {
            if (watchArray[i].node === node) {
                deinitElement(watchArray[i]);
                watchArray.splice(i, 1);
            }
        };
    }

    //expose Stickyfill
    win.Stickyfill = {
        stickies: watchArray,
        add: add,
        remove: remove,
        init: init,
        rebuild: rebuild,
        pause: pause,
        stop: stop,
        kill: kill
    };
})(document, window);


//if jQuery is available -- create a plugin
if (window.jQuery) {
    (function($) {
        $.fn.Stickyfill = function(options) {
            this.each(function() {
                Stickyfill.add(this);
            });

            return this;
        };
    })(window.jQuery);
}
;

  }).apply(root, arguments);
});
}(this));

/* pat-date-picker  - Polyfill for input type=date */
define('pat-sticky',[
    "underscore",
    "pat-parser",
    "pat-registry",
    "pat-base",
    "pat-logger",
    "stickyfill",
], function(_, Parser, registry, Base, logger, Stickyfill) {
    "use strict";
    var parser = new Parser("sticky");
    var log = logger.getLogger("sticky")
    parser.addArgument("selector", "");

    return Base.extend({
        name: "sticky",
        trigger: ".pat-sticky",
        init: function() {
            this.options = parser.parse(this.$el);
            this.makeSticky();
            this.$el.on('pat-update', this.onPatternUpdate.bind(this));
            return this.$el;
        },
        onPatternUpdate: function (ev, data) {
            /* Handler which gets called when pat-update is triggered within
             * the .pat-sticky element.
             */
            this.makeSticky();
            return true;
        },
        makeSticky: function() {
            if (this.options.selector === "") {
                this.$stickies = this.$el;
            } else {
                this.$stickies = this.$el.children().filter(this.options.selector);
            }
            this.$stickies.each(function () {
                $(this).Stickyfill();
            });
        }
    });
});

// jshint indent: 4, browser: true, jquery: true, quotmark: double
// vim: sw=4 expandtab
;
/**
 * Patterns switch - toggle classes on click
 *
 * Copyright 2013 Simplon B.V. - Wichert Akkerman
 * Copyright 2012 Florian Friesdorf
 * Copyright 2012 SYSLAB.COM GmbH
 */
define('pat-switch',[
    "jquery",
    "pat-registry",
    "pat-logger",
    "pat-parser",
    "pat-store",
    "pat-utils"
], function($, patterns, logger, Parser, store, utils) {
    var log = logger.getLogger("pat.switch"),
        parser = new Parser("switch");

    parser.addArgument("selector");
    parser.addArgument("remove");
    parser.addArgument("add");
    parser.addArgument("store", "none", ["none", "session", "local"]);

    var switcher = {
        name: "switch",
        trigger: ".pat-switch",
        jquery_plugin: true,

        init: function($el, defaults) {
            return $el.each(function() {
                var $trigger = $(this),
                    options = parser.parse($trigger, defaults, true);
                options=switcher._validateOptions(options);
                if (options.length) {
                    $trigger
                        .data("patternSwitch", options)
                        .off(".patternSwitch")
                        .on("click.patternSwitch", switcher._onClick);
                    for (var i=0; i<options.length; i++) {
                        var option = options[i];
                        if (option.store!=="none") {
                            option._storage = (option.store==="local" ? store.local : store.session)("switch");
                            var state = option._storage.get(option.selector);
                            if (state && state.remove===option.remove && state.add===option.add)
                                switcher._update(option.selector, state.remove, state.add);
                        }
                    }
                }

            });
        },

        destroy: function($el) {
            return $el.each(function() {
                $(this).removeData("patternSwitch").off("click.patternSwitch");
            });
        },

        // jQuery API to toggle a switch
        execute: function($el) {
            return $el.each(function() {
                switcher._go($(this));
            });
        },

        _onClick: function(ev) {
            if ($(ev.currentTarget).is("a")) {
                ev.preventDefault();
            }
            switcher._go($(this));
        },

        _go: function($trigger) {
            var options = $trigger.data("patternSwitch"),
                option, i;
            if (!options) {
                log.error("Tried to execute a switch for an uninitialised element.");
                return;
            }
            for (i=0; i<options.length; i++) {
                option=options[i];
                switcher._update(option.selector, option.remove, option.add);
                if (option._storage)
                    option._storage.set(option.selector, {remove: option.remove, add: option.add});
            }
        },

        _validateOptions: function(options) {
            var correct = [];

            for (var i=0; i<options.length; i++) {
                var option = options[i];
                if (option.selector && (option.remove || option.add))
                    correct.push(option);
                else
                    log.error("Switch pattern requires selector and one of add or remove.");
            }
            return correct;
        },

        _update: function(selector, remove, add) {
            var $targets = $(selector);

            if (!$targets.length)
                return;

            if (remove)
                utils.removeWildcardClass($targets, remove);
            if (add)
                $targets.addClass(add);
            $targets.trigger("pat-update", {pattern: "switch"});
        }
    };

    patterns.register(switcher);
    return switcher;
});

// vim: sw=4 sts=4 expandtab
;
define('pat-zoom',[
    "jquery",
    "pat-registry",
    "pat-parser"
], function($, patterns, Parser) {
    var parser = new Parser("zoom");

    parser.addArgument("min", 0);
    parser.addArgument("max", 2);

    var zoom = {
        name: "zoom",
        trigger: ".pat-zoom",

        init: function($el, opts) {
            return $el.each(function() {
                var $block = $(this),
                    options = parser.parse($block, opts),
                    $slider,
                    events;
                $slider=$("<input/>", {type: "range", step: "any", value: 1,
                                       min: options.min, max: options.max});

                if ("oninput" in window) {
                    events = "change input";
                } else {
                    events = "change propertychange";
                }
                $slider
                    .insertBefore($block)
                    .on(events, null, $block, zoom.onZoom);
            });
        },

        onZoom: function(event) {
            var $block=event.data;
            $block.css("zoom", this.value);
        }
    };

    patterns.register(zoom);
    return zoom;
});

// jshint indent: 4, browser: true, jquery: true, quotmark: double
// vim: sw=4 sts=4 expandtab
;
/* Patterns bundle configuration.
 */
require([
    // Conflicts with pat-autotoc
    // "pat-legend",
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
    "pat-masonry",
    "pat-markdown",
    "pat-menu",
    "pat-modal",
    "pat-navigation",
    "pat-placeholder",
    "pat-scroll",
    "pat-selectbox",
    "pat-stacks",
    "pat-sticky",
    "pat-switch",
    "pat-zoom"
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

define("/home/_thet/data/dev/plone/minimalplone5/src/plone.patternslib/src/plone/patternslib/static/patterns.js", function(){});

