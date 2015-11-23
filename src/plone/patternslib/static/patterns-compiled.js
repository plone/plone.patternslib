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

define("modernizr", function(){});

/*! jQuery v1.11.3 | (c) 2005, 2015 jQuery Foundation, Inc. | jquery.org/license */
!function(a,b){"object"==typeof module&&"object"==typeof module.exports?module.exports=a.document?b(a,!0):function(a){if(!a.document)throw new Error("jQuery requires a window with a document");return b(a)}:b(a)}("undefined"!=typeof window?window:this,function(a,b){var c=[],d=c.slice,e=c.concat,f=c.push,g=c.indexOf,h={},i=h.toString,j=h.hasOwnProperty,k={},l="1.11.3",m=function(a,b){return new m.fn.init(a,b)},n=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,o=/^-ms-/,p=/-([\da-z])/gi,q=function(a,b){return b.toUpperCase()};m.fn=m.prototype={jquery:l,constructor:m,selector:"",length:0,toArray:function(){return d.call(this)},get:function(a){return null!=a?0>a?this[a+this.length]:this[a]:d.call(this)},pushStack:function(a){var b=m.merge(this.constructor(),a);return b.prevObject=this,b.context=this.context,b},each:function(a,b){return m.each(this,a,b)},map:function(a){return this.pushStack(m.map(this,function(b,c){return a.call(b,c,b)}))},slice:function(){return this.pushStack(d.apply(this,arguments))},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},eq:function(a){var b=this.length,c=+a+(0>a?b:0);return this.pushStack(c>=0&&b>c?[this[c]]:[])},end:function(){return this.prevObject||this.constructor(null)},push:f,sort:c.sort,splice:c.splice},m.extend=m.fn.extend=function(){var a,b,c,d,e,f,g=arguments[0]||{},h=1,i=arguments.length,j=!1;for("boolean"==typeof g&&(j=g,g=arguments[h]||{},h++),"object"==typeof g||m.isFunction(g)||(g={}),h===i&&(g=this,h--);i>h;h++)if(null!=(e=arguments[h]))for(d in e)a=g[d],c=e[d],g!==c&&(j&&c&&(m.isPlainObject(c)||(b=m.isArray(c)))?(b?(b=!1,f=a&&m.isArray(a)?a:[]):f=a&&m.isPlainObject(a)?a:{},g[d]=m.extend(j,f,c)):void 0!==c&&(g[d]=c));return g},m.extend({expando:"jQuery"+(l+Math.random()).replace(/\D/g,""),isReady:!0,error:function(a){throw new Error(a)},noop:function(){},isFunction:function(a){return"function"===m.type(a)},isArray:Array.isArray||function(a){return"array"===m.type(a)},isWindow:function(a){return null!=a&&a==a.window},isNumeric:function(a){return!m.isArray(a)&&a-parseFloat(a)+1>=0},isEmptyObject:function(a){var b;for(b in a)return!1;return!0},isPlainObject:function(a){var b;if(!a||"object"!==m.type(a)||a.nodeType||m.isWindow(a))return!1;try{if(a.constructor&&!j.call(a,"constructor")&&!j.call(a.constructor.prototype,"isPrototypeOf"))return!1}catch(c){return!1}if(k.ownLast)for(b in a)return j.call(a,b);for(b in a);return void 0===b||j.call(a,b)},type:function(a){return null==a?a+"":"object"==typeof a||"function"==typeof a?h[i.call(a)]||"object":typeof a},globalEval:function(b){b&&m.trim(b)&&(a.execScript||function(b){a.eval.call(a,b)})(b)},camelCase:function(a){return a.replace(o,"ms-").replace(p,q)},nodeName:function(a,b){return a.nodeName&&a.nodeName.toLowerCase()===b.toLowerCase()},each:function(a,b,c){var d,e=0,f=a.length,g=r(a);if(c){if(g){for(;f>e;e++)if(d=b.apply(a[e],c),d===!1)break}else for(e in a)if(d=b.apply(a[e],c),d===!1)break}else if(g){for(;f>e;e++)if(d=b.call(a[e],e,a[e]),d===!1)break}else for(e in a)if(d=b.call(a[e],e,a[e]),d===!1)break;return a},trim:function(a){return null==a?"":(a+"").replace(n,"")},makeArray:function(a,b){var c=b||[];return null!=a&&(r(Object(a))?m.merge(c,"string"==typeof a?[a]:a):f.call(c,a)),c},inArray:function(a,b,c){var d;if(b){if(g)return g.call(b,a,c);for(d=b.length,c=c?0>c?Math.max(0,d+c):c:0;d>c;c++)if(c in b&&b[c]===a)return c}return-1},merge:function(a,b){var c=+b.length,d=0,e=a.length;while(c>d)a[e++]=b[d++];if(c!==c)while(void 0!==b[d])a[e++]=b[d++];return a.length=e,a},grep:function(a,b,c){for(var d,e=[],f=0,g=a.length,h=!c;g>f;f++)d=!b(a[f],f),d!==h&&e.push(a[f]);return e},map:function(a,b,c){var d,f=0,g=a.length,h=r(a),i=[];if(h)for(;g>f;f++)d=b(a[f],f,c),null!=d&&i.push(d);else for(f in a)d=b(a[f],f,c),null!=d&&i.push(d);return e.apply([],i)},guid:1,proxy:function(a,b){var c,e,f;return"string"==typeof b&&(f=a[b],b=a,a=f),m.isFunction(a)?(c=d.call(arguments,2),e=function(){return a.apply(b||this,c.concat(d.call(arguments)))},e.guid=a.guid=a.guid||m.guid++,e):void 0},now:function(){return+new Date},support:k}),m.each("Boolean Number String Function Array Date RegExp Object Error".split(" "),function(a,b){h["[object "+b+"]"]=b.toLowerCase()});function r(a){var b="length"in a&&a.length,c=m.type(a);return"function"===c||m.isWindow(a)?!1:1===a.nodeType&&b?!0:"array"===c||0===b||"number"==typeof b&&b>0&&b-1 in a}var s=function(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u="sizzle"+1*new Date,v=a.document,w=0,x=0,y=ha(),z=ha(),A=ha(),B=function(a,b){return a===b&&(l=!0),0},C=1<<31,D={}.hasOwnProperty,E=[],F=E.pop,G=E.push,H=E.push,I=E.slice,J=function(a,b){for(var c=0,d=a.length;d>c;c++)if(a[c]===b)return c;return-1},K="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",L="[\\x20\\t\\r\\n\\f]",M="(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",N=M.replace("w","w#"),O="\\["+L+"*("+M+")(?:"+L+"*([*^$|!~]?=)"+L+"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|("+N+"))|)"+L+"*\\]",P=":("+M+")(?:\\((('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|((?:\\\\.|[^\\\\()[\\]]|"+O+")*)|.*)\\)|)",Q=new RegExp(L+"+","g"),R=new RegExp("^"+L+"+|((?:^|[^\\\\])(?:\\\\.)*)"+L+"+$","g"),S=new RegExp("^"+L+"*,"+L+"*"),T=new RegExp("^"+L+"*([>+~]|"+L+")"+L+"*"),U=new RegExp("="+L+"*([^\\]'\"]*?)"+L+"*\\]","g"),V=new RegExp(P),W=new RegExp("^"+N+"$"),X={ID:new RegExp("^#("+M+")"),CLASS:new RegExp("^\\.("+M+")"),TAG:new RegExp("^("+M.replace("w","w*")+")"),ATTR:new RegExp("^"+O),PSEUDO:new RegExp("^"+P),CHILD:new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+L+"*(even|odd|(([+-]|)(\\d*)n|)"+L+"*(?:([+-]|)"+L+"*(\\d+)|))"+L+"*\\)|)","i"),bool:new RegExp("^(?:"+K+")$","i"),needsContext:new RegExp("^"+L+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+L+"*((?:-\\d)?\\d*)"+L+"*\\)|)(?=[^-]|$)","i")},Y=/^(?:input|select|textarea|button)$/i,Z=/^h\d$/i,$=/^[^{]+\{\s*\[native \w/,_=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,aa=/[+~]/,ba=/'|\\/g,ca=new RegExp("\\\\([\\da-f]{1,6}"+L+"?|("+L+")|.)","ig"),da=function(a,b,c){var d="0x"+b-65536;return d!==d||c?b:0>d?String.fromCharCode(d+65536):String.fromCharCode(d>>10|55296,1023&d|56320)},ea=function(){m()};try{H.apply(E=I.call(v.childNodes),v.childNodes),E[v.childNodes.length].nodeType}catch(fa){H={apply:E.length?function(a,b){G.apply(a,I.call(b))}:function(a,b){var c=a.length,d=0;while(a[c++]=b[d++]);a.length=c-1}}}function ga(a,b,d,e){var f,h,j,k,l,o,r,s,w,x;if((b?b.ownerDocument||b:v)!==n&&m(b),b=b||n,d=d||[],k=b.nodeType,"string"!=typeof a||!a||1!==k&&9!==k&&11!==k)return d;if(!e&&p){if(11!==k&&(f=_.exec(a)))if(j=f[1]){if(9===k){if(h=b.getElementById(j),!h||!h.parentNode)return d;if(h.id===j)return d.push(h),d}else if(b.ownerDocument&&(h=b.ownerDocument.getElementById(j))&&t(b,h)&&h.id===j)return d.push(h),d}else{if(f[2])return H.apply(d,b.getElementsByTagName(a)),d;if((j=f[3])&&c.getElementsByClassName)return H.apply(d,b.getElementsByClassName(j)),d}if(c.qsa&&(!q||!q.test(a))){if(s=r=u,w=b,x=1!==k&&a,1===k&&"object"!==b.nodeName.toLowerCase()){o=g(a),(r=b.getAttribute("id"))?s=r.replace(ba,"\\$&"):b.setAttribute("id",s),s="[id='"+s+"'] ",l=o.length;while(l--)o[l]=s+ra(o[l]);w=aa.test(a)&&pa(b.parentNode)||b,x=o.join(",")}if(x)try{return H.apply(d,w.querySelectorAll(x)),d}catch(y){}finally{r||b.removeAttribute("id")}}}return i(a.replace(R,"$1"),b,d,e)}function ha(){var a=[];function b(c,e){return a.push(c+" ")>d.cacheLength&&delete b[a.shift()],b[c+" "]=e}return b}function ia(a){return a[u]=!0,a}function ja(a){var b=n.createElement("div");try{return!!a(b)}catch(c){return!1}finally{b.parentNode&&b.parentNode.removeChild(b),b=null}}function ka(a,b){var c=a.split("|"),e=a.length;while(e--)d.attrHandle[c[e]]=b}function la(a,b){var c=b&&a,d=c&&1===a.nodeType&&1===b.nodeType&&(~b.sourceIndex||C)-(~a.sourceIndex||C);if(d)return d;if(c)while(c=c.nextSibling)if(c===b)return-1;return a?1:-1}function ma(a){return function(b){var c=b.nodeName.toLowerCase();return"input"===c&&b.type===a}}function na(a){return function(b){var c=b.nodeName.toLowerCase();return("input"===c||"button"===c)&&b.type===a}}function oa(a){return ia(function(b){return b=+b,ia(function(c,d){var e,f=a([],c.length,b),g=f.length;while(g--)c[e=f[g]]&&(c[e]=!(d[e]=c[e]))})})}function pa(a){return a&&"undefined"!=typeof a.getElementsByTagName&&a}c=ga.support={},f=ga.isXML=function(a){var b=a&&(a.ownerDocument||a).documentElement;return b?"HTML"!==b.nodeName:!1},m=ga.setDocument=function(a){var b,e,g=a?a.ownerDocument||a:v;return g!==n&&9===g.nodeType&&g.documentElement?(n=g,o=g.documentElement,e=g.defaultView,e&&e!==e.top&&(e.addEventListener?e.addEventListener("unload",ea,!1):e.attachEvent&&e.attachEvent("onunload",ea)),p=!f(g),c.attributes=ja(function(a){return a.className="i",!a.getAttribute("className")}),c.getElementsByTagName=ja(function(a){return a.appendChild(g.createComment("")),!a.getElementsByTagName("*").length}),c.getElementsByClassName=$.test(g.getElementsByClassName),c.getById=ja(function(a){return o.appendChild(a).id=u,!g.getElementsByName||!g.getElementsByName(u).length}),c.getById?(d.find.ID=function(a,b){if("undefined"!=typeof b.getElementById&&p){var c=b.getElementById(a);return c&&c.parentNode?[c]:[]}},d.filter.ID=function(a){var b=a.replace(ca,da);return function(a){return a.getAttribute("id")===b}}):(delete d.find.ID,d.filter.ID=function(a){var b=a.replace(ca,da);return function(a){var c="undefined"!=typeof a.getAttributeNode&&a.getAttributeNode("id");return c&&c.value===b}}),d.find.TAG=c.getElementsByTagName?function(a,b){return"undefined"!=typeof b.getElementsByTagName?b.getElementsByTagName(a):c.qsa?b.querySelectorAll(a):void 0}:function(a,b){var c,d=[],e=0,f=b.getElementsByTagName(a);if("*"===a){while(c=f[e++])1===c.nodeType&&d.push(c);return d}return f},d.find.CLASS=c.getElementsByClassName&&function(a,b){return p?b.getElementsByClassName(a):void 0},r=[],q=[],(c.qsa=$.test(g.querySelectorAll))&&(ja(function(a){o.appendChild(a).innerHTML="<a id='"+u+"'></a><select id='"+u+"-\f]' msallowcapture=''><option selected=''></option></select>",a.querySelectorAll("[msallowcapture^='']").length&&q.push("[*^$]="+L+"*(?:''|\"\")"),a.querySelectorAll("[selected]").length||q.push("\\["+L+"*(?:value|"+K+")"),a.querySelectorAll("[id~="+u+"-]").length||q.push("~="),a.querySelectorAll(":checked").length||q.push(":checked"),a.querySelectorAll("a#"+u+"+*").length||q.push(".#.+[+~]")}),ja(function(a){var b=g.createElement("input");b.setAttribute("type","hidden"),a.appendChild(b).setAttribute("name","D"),a.querySelectorAll("[name=d]").length&&q.push("name"+L+"*[*^$|!~]?="),a.querySelectorAll(":enabled").length||q.push(":enabled",":disabled"),a.querySelectorAll("*,:x"),q.push(",.*:")})),(c.matchesSelector=$.test(s=o.matches||o.webkitMatchesSelector||o.mozMatchesSelector||o.oMatchesSelector||o.msMatchesSelector))&&ja(function(a){c.disconnectedMatch=s.call(a,"div"),s.call(a,"[s!='']:x"),r.push("!=",P)}),q=q.length&&new RegExp(q.join("|")),r=r.length&&new RegExp(r.join("|")),b=$.test(o.compareDocumentPosition),t=b||$.test(o.contains)?function(a,b){var c=9===a.nodeType?a.documentElement:a,d=b&&b.parentNode;return a===d||!(!d||1!==d.nodeType||!(c.contains?c.contains(d):a.compareDocumentPosition&&16&a.compareDocumentPosition(d)))}:function(a,b){if(b)while(b=b.parentNode)if(b===a)return!0;return!1},B=b?function(a,b){if(a===b)return l=!0,0;var d=!a.compareDocumentPosition-!b.compareDocumentPosition;return d?d:(d=(a.ownerDocument||a)===(b.ownerDocument||b)?a.compareDocumentPosition(b):1,1&d||!c.sortDetached&&b.compareDocumentPosition(a)===d?a===g||a.ownerDocument===v&&t(v,a)?-1:b===g||b.ownerDocument===v&&t(v,b)?1:k?J(k,a)-J(k,b):0:4&d?-1:1)}:function(a,b){if(a===b)return l=!0,0;var c,d=0,e=a.parentNode,f=b.parentNode,h=[a],i=[b];if(!e||!f)return a===g?-1:b===g?1:e?-1:f?1:k?J(k,a)-J(k,b):0;if(e===f)return la(a,b);c=a;while(c=c.parentNode)h.unshift(c);c=b;while(c=c.parentNode)i.unshift(c);while(h[d]===i[d])d++;return d?la(h[d],i[d]):h[d]===v?-1:i[d]===v?1:0},g):n},ga.matches=function(a,b){return ga(a,null,null,b)},ga.matchesSelector=function(a,b){if((a.ownerDocument||a)!==n&&m(a),b=b.replace(U,"='$1']"),!(!c.matchesSelector||!p||r&&r.test(b)||q&&q.test(b)))try{var d=s.call(a,b);if(d||c.disconnectedMatch||a.document&&11!==a.document.nodeType)return d}catch(e){}return ga(b,n,null,[a]).length>0},ga.contains=function(a,b){return(a.ownerDocument||a)!==n&&m(a),t(a,b)},ga.attr=function(a,b){(a.ownerDocument||a)!==n&&m(a);var e=d.attrHandle[b.toLowerCase()],f=e&&D.call(d.attrHandle,b.toLowerCase())?e(a,b,!p):void 0;return void 0!==f?f:c.attributes||!p?a.getAttribute(b):(f=a.getAttributeNode(b))&&f.specified?f.value:null},ga.error=function(a){throw new Error("Syntax error, unrecognized expression: "+a)},ga.uniqueSort=function(a){var b,d=[],e=0,f=0;if(l=!c.detectDuplicates,k=!c.sortStable&&a.slice(0),a.sort(B),l){while(b=a[f++])b===a[f]&&(e=d.push(f));while(e--)a.splice(d[e],1)}return k=null,a},e=ga.getText=function(a){var b,c="",d=0,f=a.nodeType;if(f){if(1===f||9===f||11===f){if("string"==typeof a.textContent)return a.textContent;for(a=a.firstChild;a;a=a.nextSibling)c+=e(a)}else if(3===f||4===f)return a.nodeValue}else while(b=a[d++])c+=e(b);return c},d=ga.selectors={cacheLength:50,createPseudo:ia,match:X,attrHandle:{},find:{},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(a){return a[1]=a[1].replace(ca,da),a[3]=(a[3]||a[4]||a[5]||"").replace(ca,da),"~="===a[2]&&(a[3]=" "+a[3]+" "),a.slice(0,4)},CHILD:function(a){return a[1]=a[1].toLowerCase(),"nth"===a[1].slice(0,3)?(a[3]||ga.error(a[0]),a[4]=+(a[4]?a[5]+(a[6]||1):2*("even"===a[3]||"odd"===a[3])),a[5]=+(a[7]+a[8]||"odd"===a[3])):a[3]&&ga.error(a[0]),a},PSEUDO:function(a){var b,c=!a[6]&&a[2];return X.CHILD.test(a[0])?null:(a[3]?a[2]=a[4]||a[5]||"":c&&V.test(c)&&(b=g(c,!0))&&(b=c.indexOf(")",c.length-b)-c.length)&&(a[0]=a[0].slice(0,b),a[2]=c.slice(0,b)),a.slice(0,3))}},filter:{TAG:function(a){var b=a.replace(ca,da).toLowerCase();return"*"===a?function(){return!0}:function(a){return a.nodeName&&a.nodeName.toLowerCase()===b}},CLASS:function(a){var b=y[a+" "];return b||(b=new RegExp("(^|"+L+")"+a+"("+L+"|$)"))&&y(a,function(a){return b.test("string"==typeof a.className&&a.className||"undefined"!=typeof a.getAttribute&&a.getAttribute("class")||"")})},ATTR:function(a,b,c){return function(d){var e=ga.attr(d,a);return null==e?"!="===b:b?(e+="","="===b?e===c:"!="===b?e!==c:"^="===b?c&&0===e.indexOf(c):"*="===b?c&&e.indexOf(c)>-1:"$="===b?c&&e.slice(-c.length)===c:"~="===b?(" "+e.replace(Q," ")+" ").indexOf(c)>-1:"|="===b?e===c||e.slice(0,c.length+1)===c+"-":!1):!0}},CHILD:function(a,b,c,d,e){var f="nth"!==a.slice(0,3),g="last"!==a.slice(-4),h="of-type"===b;return 1===d&&0===e?function(a){return!!a.parentNode}:function(b,c,i){var j,k,l,m,n,o,p=f!==g?"nextSibling":"previousSibling",q=b.parentNode,r=h&&b.nodeName.toLowerCase(),s=!i&&!h;if(q){if(f){while(p){l=b;while(l=l[p])if(h?l.nodeName.toLowerCase()===r:1===l.nodeType)return!1;o=p="only"===a&&!o&&"nextSibling"}return!0}if(o=[g?q.firstChild:q.lastChild],g&&s){k=q[u]||(q[u]={}),j=k[a]||[],n=j[0]===w&&j[1],m=j[0]===w&&j[2],l=n&&q.childNodes[n];while(l=++n&&l&&l[p]||(m=n=0)||o.pop())if(1===l.nodeType&&++m&&l===b){k[a]=[w,n,m];break}}else if(s&&(j=(b[u]||(b[u]={}))[a])&&j[0]===w)m=j[1];else while(l=++n&&l&&l[p]||(m=n=0)||o.pop())if((h?l.nodeName.toLowerCase()===r:1===l.nodeType)&&++m&&(s&&((l[u]||(l[u]={}))[a]=[w,m]),l===b))break;return m-=e,m===d||m%d===0&&m/d>=0}}},PSEUDO:function(a,b){var c,e=d.pseudos[a]||d.setFilters[a.toLowerCase()]||ga.error("unsupported pseudo: "+a);return e[u]?e(b):e.length>1?(c=[a,a,"",b],d.setFilters.hasOwnProperty(a.toLowerCase())?ia(function(a,c){var d,f=e(a,b),g=f.length;while(g--)d=J(a,f[g]),a[d]=!(c[d]=f[g])}):function(a){return e(a,0,c)}):e}},pseudos:{not:ia(function(a){var b=[],c=[],d=h(a.replace(R,"$1"));return d[u]?ia(function(a,b,c,e){var f,g=d(a,null,e,[]),h=a.length;while(h--)(f=g[h])&&(a[h]=!(b[h]=f))}):function(a,e,f){return b[0]=a,d(b,null,f,c),b[0]=null,!c.pop()}}),has:ia(function(a){return function(b){return ga(a,b).length>0}}),contains:ia(function(a){return a=a.replace(ca,da),function(b){return(b.textContent||b.innerText||e(b)).indexOf(a)>-1}}),lang:ia(function(a){return W.test(a||"")||ga.error("unsupported lang: "+a),a=a.replace(ca,da).toLowerCase(),function(b){var c;do if(c=p?b.lang:b.getAttribute("xml:lang")||b.getAttribute("lang"))return c=c.toLowerCase(),c===a||0===c.indexOf(a+"-");while((b=b.parentNode)&&1===b.nodeType);return!1}}),target:function(b){var c=a.location&&a.location.hash;return c&&c.slice(1)===b.id},root:function(a){return a===o},focus:function(a){return a===n.activeElement&&(!n.hasFocus||n.hasFocus())&&!!(a.type||a.href||~a.tabIndex)},enabled:function(a){return a.disabled===!1},disabled:function(a){return a.disabled===!0},checked:function(a){var b=a.nodeName.toLowerCase();return"input"===b&&!!a.checked||"option"===b&&!!a.selected},selected:function(a){return a.parentNode&&a.parentNode.selectedIndex,a.selected===!0},empty:function(a){for(a=a.firstChild;a;a=a.nextSibling)if(a.nodeType<6)return!1;return!0},parent:function(a){return!d.pseudos.empty(a)},header:function(a){return Z.test(a.nodeName)},input:function(a){return Y.test(a.nodeName)},button:function(a){var b=a.nodeName.toLowerCase();return"input"===b&&"button"===a.type||"button"===b},text:function(a){var b;return"input"===a.nodeName.toLowerCase()&&"text"===a.type&&(null==(b=a.getAttribute("type"))||"text"===b.toLowerCase())},first:oa(function(){return[0]}),last:oa(function(a,b){return[b-1]}),eq:oa(function(a,b,c){return[0>c?c+b:c]}),even:oa(function(a,b){for(var c=0;b>c;c+=2)a.push(c);return a}),odd:oa(function(a,b){for(var c=1;b>c;c+=2)a.push(c);return a}),lt:oa(function(a,b,c){for(var d=0>c?c+b:c;--d>=0;)a.push(d);return a}),gt:oa(function(a,b,c){for(var d=0>c?c+b:c;++d<b;)a.push(d);return a})}},d.pseudos.nth=d.pseudos.eq;for(b in{radio:!0,checkbox:!0,file:!0,password:!0,image:!0})d.pseudos[b]=ma(b);for(b in{submit:!0,reset:!0})d.pseudos[b]=na(b);function qa(){}qa.prototype=d.filters=d.pseudos,d.setFilters=new qa,g=ga.tokenize=function(a,b){var c,e,f,g,h,i,j,k=z[a+" "];if(k)return b?0:k.slice(0);h=a,i=[],j=d.preFilter;while(h){(!c||(e=S.exec(h)))&&(e&&(h=h.slice(e[0].length)||h),i.push(f=[])),c=!1,(e=T.exec(h))&&(c=e.shift(),f.push({value:c,type:e[0].replace(R," ")}),h=h.slice(c.length));for(g in d.filter)!(e=X[g].exec(h))||j[g]&&!(e=j[g](e))||(c=e.shift(),f.push({value:c,type:g,matches:e}),h=h.slice(c.length));if(!c)break}return b?h.length:h?ga.error(a):z(a,i).slice(0)};function ra(a){for(var b=0,c=a.length,d="";c>b;b++)d+=a[b].value;return d}function sa(a,b,c){var d=b.dir,e=c&&"parentNode"===d,f=x++;return b.first?function(b,c,f){while(b=b[d])if(1===b.nodeType||e)return a(b,c,f)}:function(b,c,g){var h,i,j=[w,f];if(g){while(b=b[d])if((1===b.nodeType||e)&&a(b,c,g))return!0}else while(b=b[d])if(1===b.nodeType||e){if(i=b[u]||(b[u]={}),(h=i[d])&&h[0]===w&&h[1]===f)return j[2]=h[2];if(i[d]=j,j[2]=a(b,c,g))return!0}}}function ta(a){return a.length>1?function(b,c,d){var e=a.length;while(e--)if(!a[e](b,c,d))return!1;return!0}:a[0]}function ua(a,b,c){for(var d=0,e=b.length;e>d;d++)ga(a,b[d],c);return c}function va(a,b,c,d,e){for(var f,g=[],h=0,i=a.length,j=null!=b;i>h;h++)(f=a[h])&&(!c||c(f,d,e))&&(g.push(f),j&&b.push(h));return g}function wa(a,b,c,d,e,f){return d&&!d[u]&&(d=wa(d)),e&&!e[u]&&(e=wa(e,f)),ia(function(f,g,h,i){var j,k,l,m=[],n=[],o=g.length,p=f||ua(b||"*",h.nodeType?[h]:h,[]),q=!a||!f&&b?p:va(p,m,a,h,i),r=c?e||(f?a:o||d)?[]:g:q;if(c&&c(q,r,h,i),d){j=va(r,n),d(j,[],h,i),k=j.length;while(k--)(l=j[k])&&(r[n[k]]=!(q[n[k]]=l))}if(f){if(e||a){if(e){j=[],k=r.length;while(k--)(l=r[k])&&j.push(q[k]=l);e(null,r=[],j,i)}k=r.length;while(k--)(l=r[k])&&(j=e?J(f,l):m[k])>-1&&(f[j]=!(g[j]=l))}}else r=va(r===g?r.splice(o,r.length):r),e?e(null,g,r,i):H.apply(g,r)})}function xa(a){for(var b,c,e,f=a.length,g=d.relative[a[0].type],h=g||d.relative[" "],i=g?1:0,k=sa(function(a){return a===b},h,!0),l=sa(function(a){return J(b,a)>-1},h,!0),m=[function(a,c,d){var e=!g&&(d||c!==j)||((b=c).nodeType?k(a,c,d):l(a,c,d));return b=null,e}];f>i;i++)if(c=d.relative[a[i].type])m=[sa(ta(m),c)];else{if(c=d.filter[a[i].type].apply(null,a[i].matches),c[u]){for(e=++i;f>e;e++)if(d.relative[a[e].type])break;return wa(i>1&&ta(m),i>1&&ra(a.slice(0,i-1).concat({value:" "===a[i-2].type?"*":""})).replace(R,"$1"),c,e>i&&xa(a.slice(i,e)),f>e&&xa(a=a.slice(e)),f>e&&ra(a))}m.push(c)}return ta(m)}function ya(a,b){var c=b.length>0,e=a.length>0,f=function(f,g,h,i,k){var l,m,o,p=0,q="0",r=f&&[],s=[],t=j,u=f||e&&d.find.TAG("*",k),v=w+=null==t?1:Math.random()||.1,x=u.length;for(k&&(j=g!==n&&g);q!==x&&null!=(l=u[q]);q++){if(e&&l){m=0;while(o=a[m++])if(o(l,g,h)){i.push(l);break}k&&(w=v)}c&&((l=!o&&l)&&p--,f&&r.push(l))}if(p+=q,c&&q!==p){m=0;while(o=b[m++])o(r,s,g,h);if(f){if(p>0)while(q--)r[q]||s[q]||(s[q]=F.call(i));s=va(s)}H.apply(i,s),k&&!f&&s.length>0&&p+b.length>1&&ga.uniqueSort(i)}return k&&(w=v,j=t),r};return c?ia(f):f}return h=ga.compile=function(a,b){var c,d=[],e=[],f=A[a+" "];if(!f){b||(b=g(a)),c=b.length;while(c--)f=xa(b[c]),f[u]?d.push(f):e.push(f);f=A(a,ya(e,d)),f.selector=a}return f},i=ga.select=function(a,b,e,f){var i,j,k,l,m,n="function"==typeof a&&a,o=!f&&g(a=n.selector||a);if(e=e||[],1===o.length){if(j=o[0]=o[0].slice(0),j.length>2&&"ID"===(k=j[0]).type&&c.getById&&9===b.nodeType&&p&&d.relative[j[1].type]){if(b=(d.find.ID(k.matches[0].replace(ca,da),b)||[])[0],!b)return e;n&&(b=b.parentNode),a=a.slice(j.shift().value.length)}i=X.needsContext.test(a)?0:j.length;while(i--){if(k=j[i],d.relative[l=k.type])break;if((m=d.find[l])&&(f=m(k.matches[0].replace(ca,da),aa.test(j[0].type)&&pa(b.parentNode)||b))){if(j.splice(i,1),a=f.length&&ra(j),!a)return H.apply(e,f),e;break}}}return(n||h(a,o))(f,b,!p,e,aa.test(a)&&pa(b.parentNode)||b),e},c.sortStable=u.split("").sort(B).join("")===u,c.detectDuplicates=!!l,m(),c.sortDetached=ja(function(a){return 1&a.compareDocumentPosition(n.createElement("div"))}),ja(function(a){return a.innerHTML="<a href='#'></a>","#"===a.firstChild.getAttribute("href")})||ka("type|href|height|width",function(a,b,c){return c?void 0:a.getAttribute(b,"type"===b.toLowerCase()?1:2)}),c.attributes&&ja(function(a){return a.innerHTML="<input/>",a.firstChild.setAttribute("value",""),""===a.firstChild.getAttribute("value")})||ka("value",function(a,b,c){return c||"input"!==a.nodeName.toLowerCase()?void 0:a.defaultValue}),ja(function(a){return null==a.getAttribute("disabled")})||ka(K,function(a,b,c){var d;return c?void 0:a[b]===!0?b.toLowerCase():(d=a.getAttributeNode(b))&&d.specified?d.value:null}),ga}(a);m.find=s,m.expr=s.selectors,m.expr[":"]=m.expr.pseudos,m.unique=s.uniqueSort,m.text=s.getText,m.isXMLDoc=s.isXML,m.contains=s.contains;var t=m.expr.match.needsContext,u=/^<(\w+)\s*\/?>(?:<\/\1>|)$/,v=/^.[^:#\[\.,]*$/;function w(a,b,c){if(m.isFunction(b))return m.grep(a,function(a,d){return!!b.call(a,d,a)!==c});if(b.nodeType)return m.grep(a,function(a){return a===b!==c});if("string"==typeof b){if(v.test(b))return m.filter(b,a,c);b=m.filter(b,a)}return m.grep(a,function(a){return m.inArray(a,b)>=0!==c})}m.filter=function(a,b,c){var d=b[0];return c&&(a=":not("+a+")"),1===b.length&&1===d.nodeType?m.find.matchesSelector(d,a)?[d]:[]:m.find.matches(a,m.grep(b,function(a){return 1===a.nodeType}))},m.fn.extend({find:function(a){var b,c=[],d=this,e=d.length;if("string"!=typeof a)return this.pushStack(m(a).filter(function(){for(b=0;e>b;b++)if(m.contains(d[b],this))return!0}));for(b=0;e>b;b++)m.find(a,d[b],c);return c=this.pushStack(e>1?m.unique(c):c),c.selector=this.selector?this.selector+" "+a:a,c},filter:function(a){return this.pushStack(w(this,a||[],!1))},not:function(a){return this.pushStack(w(this,a||[],!0))},is:function(a){return!!w(this,"string"==typeof a&&t.test(a)?m(a):a||[],!1).length}});var x,y=a.document,z=/^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,A=m.fn.init=function(a,b){var c,d;if(!a)return this;if("string"==typeof a){if(c="<"===a.charAt(0)&&">"===a.charAt(a.length-1)&&a.length>=3?[null,a,null]:z.exec(a),!c||!c[1]&&b)return!b||b.jquery?(b||x).find(a):this.constructor(b).find(a);if(c[1]){if(b=b instanceof m?b[0]:b,m.merge(this,m.parseHTML(c[1],b&&b.nodeType?b.ownerDocument||b:y,!0)),u.test(c[1])&&m.isPlainObject(b))for(c in b)m.isFunction(this[c])?this[c](b[c]):this.attr(c,b[c]);return this}if(d=y.getElementById(c[2]),d&&d.parentNode){if(d.id!==c[2])return x.find(a);this.length=1,this[0]=d}return this.context=y,this.selector=a,this}return a.nodeType?(this.context=this[0]=a,this.length=1,this):m.isFunction(a)?"undefined"!=typeof x.ready?x.ready(a):a(m):(void 0!==a.selector&&(this.selector=a.selector,this.context=a.context),m.makeArray(a,this))};A.prototype=m.fn,x=m(y);var B=/^(?:parents|prev(?:Until|All))/,C={children:!0,contents:!0,next:!0,prev:!0};m.extend({dir:function(a,b,c){var d=[],e=a[b];while(e&&9!==e.nodeType&&(void 0===c||1!==e.nodeType||!m(e).is(c)))1===e.nodeType&&d.push(e),e=e[b];return d},sibling:function(a,b){for(var c=[];a;a=a.nextSibling)1===a.nodeType&&a!==b&&c.push(a);return c}}),m.fn.extend({has:function(a){var b,c=m(a,this),d=c.length;return this.filter(function(){for(b=0;d>b;b++)if(m.contains(this,c[b]))return!0})},closest:function(a,b){for(var c,d=0,e=this.length,f=[],g=t.test(a)||"string"!=typeof a?m(a,b||this.context):0;e>d;d++)for(c=this[d];c&&c!==b;c=c.parentNode)if(c.nodeType<11&&(g?g.index(c)>-1:1===c.nodeType&&m.find.matchesSelector(c,a))){f.push(c);break}return this.pushStack(f.length>1?m.unique(f):f)},index:function(a){return a?"string"==typeof a?m.inArray(this[0],m(a)):m.inArray(a.jquery?a[0]:a,this):this[0]&&this[0].parentNode?this.first().prevAll().length:-1},add:function(a,b){return this.pushStack(m.unique(m.merge(this.get(),m(a,b))))},addBack:function(a){return this.add(null==a?this.prevObject:this.prevObject.filter(a))}});function D(a,b){do a=a[b];while(a&&1!==a.nodeType);return a}m.each({parent:function(a){var b=a.parentNode;return b&&11!==b.nodeType?b:null},parents:function(a){return m.dir(a,"parentNode")},parentsUntil:function(a,b,c){return m.dir(a,"parentNode",c)},next:function(a){return D(a,"nextSibling")},prev:function(a){return D(a,"previousSibling")},nextAll:function(a){return m.dir(a,"nextSibling")},prevAll:function(a){return m.dir(a,"previousSibling")},nextUntil:function(a,b,c){return m.dir(a,"nextSibling",c)},prevUntil:function(a,b,c){return m.dir(a,"previousSibling",c)},siblings:function(a){return m.sibling((a.parentNode||{}).firstChild,a)},children:function(a){return m.sibling(a.firstChild)},contents:function(a){return m.nodeName(a,"iframe")?a.contentDocument||a.contentWindow.document:m.merge([],a.childNodes)}},function(a,b){m.fn[a]=function(c,d){var e=m.map(this,b,c);return"Until"!==a.slice(-5)&&(d=c),d&&"string"==typeof d&&(e=m.filter(d,e)),this.length>1&&(C[a]||(e=m.unique(e)),B.test(a)&&(e=e.reverse())),this.pushStack(e)}});var E=/\S+/g,F={};function G(a){var b=F[a]={};return m.each(a.match(E)||[],function(a,c){b[c]=!0}),b}m.Callbacks=function(a){a="string"==typeof a?F[a]||G(a):m.extend({},a);var b,c,d,e,f,g,h=[],i=!a.once&&[],j=function(l){for(c=a.memory&&l,d=!0,f=g||0,g=0,e=h.length,b=!0;h&&e>f;f++)if(h[f].apply(l[0],l[1])===!1&&a.stopOnFalse){c=!1;break}b=!1,h&&(i?i.length&&j(i.shift()):c?h=[]:k.disable())},k={add:function(){if(h){var d=h.length;!function f(b){m.each(b,function(b,c){var d=m.type(c);"function"===d?a.unique&&k.has(c)||h.push(c):c&&c.length&&"string"!==d&&f(c)})}(arguments),b?e=h.length:c&&(g=d,j(c))}return this},remove:function(){return h&&m.each(arguments,function(a,c){var d;while((d=m.inArray(c,h,d))>-1)h.splice(d,1),b&&(e>=d&&e--,f>=d&&f--)}),this},has:function(a){return a?m.inArray(a,h)>-1:!(!h||!h.length)},empty:function(){return h=[],e=0,this},disable:function(){return h=i=c=void 0,this},disabled:function(){return!h},lock:function(){return i=void 0,c||k.disable(),this},locked:function(){return!i},fireWith:function(a,c){return!h||d&&!i||(c=c||[],c=[a,c.slice?c.slice():c],b?i.push(c):j(c)),this},fire:function(){return k.fireWith(this,arguments),this},fired:function(){return!!d}};return k},m.extend({Deferred:function(a){var b=[["resolve","done",m.Callbacks("once memory"),"resolved"],["reject","fail",m.Callbacks("once memory"),"rejected"],["notify","progress",m.Callbacks("memory")]],c="pending",d={state:function(){return c},always:function(){return e.done(arguments).fail(arguments),this},then:function(){var a=arguments;return m.Deferred(function(c){m.each(b,function(b,f){var g=m.isFunction(a[b])&&a[b];e[f[1]](function(){var a=g&&g.apply(this,arguments);a&&m.isFunction(a.promise)?a.promise().done(c.resolve).fail(c.reject).progress(c.notify):c[f[0]+"With"](this===d?c.promise():this,g?[a]:arguments)})}),a=null}).promise()},promise:function(a){return null!=a?m.extend(a,d):d}},e={};return d.pipe=d.then,m.each(b,function(a,f){var g=f[2],h=f[3];d[f[1]]=g.add,h&&g.add(function(){c=h},b[1^a][2].disable,b[2][2].lock),e[f[0]]=function(){return e[f[0]+"With"](this===e?d:this,arguments),this},e[f[0]+"With"]=g.fireWith}),d.promise(e),a&&a.call(e,e),e},when:function(a){var b=0,c=d.call(arguments),e=c.length,f=1!==e||a&&m.isFunction(a.promise)?e:0,g=1===f?a:m.Deferred(),h=function(a,b,c){return function(e){b[a]=this,c[a]=arguments.length>1?d.call(arguments):e,c===i?g.notifyWith(b,c):--f||g.resolveWith(b,c)}},i,j,k;if(e>1)for(i=new Array(e),j=new Array(e),k=new Array(e);e>b;b++)c[b]&&m.isFunction(c[b].promise)?c[b].promise().done(h(b,k,c)).fail(g.reject).progress(h(b,j,i)):--f;return f||g.resolveWith(k,c),g.promise()}});var H;m.fn.ready=function(a){return m.ready.promise().done(a),this},m.extend({isReady:!1,readyWait:1,holdReady:function(a){a?m.readyWait++:m.ready(!0)},ready:function(a){if(a===!0?!--m.readyWait:!m.isReady){if(!y.body)return setTimeout(m.ready);m.isReady=!0,a!==!0&&--m.readyWait>0||(H.resolveWith(y,[m]),m.fn.triggerHandler&&(m(y).triggerHandler("ready"),m(y).off("ready")))}}});function I(){y.addEventListener?(y.removeEventListener("DOMContentLoaded",J,!1),a.removeEventListener("load",J,!1)):(y.detachEvent("onreadystatechange",J),a.detachEvent("onload",J))}function J(){(y.addEventListener||"load"===event.type||"complete"===y.readyState)&&(I(),m.ready())}m.ready.promise=function(b){if(!H)if(H=m.Deferred(),"complete"===y.readyState)setTimeout(m.ready);else if(y.addEventListener)y.addEventListener("DOMContentLoaded",J,!1),a.addEventListener("load",J,!1);else{y.attachEvent("onreadystatechange",J),a.attachEvent("onload",J);var c=!1;try{c=null==a.frameElement&&y.documentElement}catch(d){}c&&c.doScroll&&!function e(){if(!m.isReady){try{c.doScroll("left")}catch(a){return setTimeout(e,50)}I(),m.ready()}}()}return H.promise(b)};var K="undefined",L;for(L in m(k))break;k.ownLast="0"!==L,k.inlineBlockNeedsLayout=!1,m(function(){var a,b,c,d;c=y.getElementsByTagName("body")[0],c&&c.style&&(b=y.createElement("div"),d=y.createElement("div"),d.style.cssText="position:absolute;border:0;width:0;height:0;top:0;left:-9999px",c.appendChild(d).appendChild(b),typeof b.style.zoom!==K&&(b.style.cssText="display:inline;margin:0;border:0;padding:1px;width:1px;zoom:1",k.inlineBlockNeedsLayout=a=3===b.offsetWidth,a&&(c.style.zoom=1)),c.removeChild(d))}),function(){var a=y.createElement("div");if(null==k.deleteExpando){k.deleteExpando=!0;try{delete a.test}catch(b){k.deleteExpando=!1}}a=null}(),m.acceptData=function(a){var b=m.noData[(a.nodeName+" ").toLowerCase()],c=+a.nodeType||1;return 1!==c&&9!==c?!1:!b||b!==!0&&a.getAttribute("classid")===b};var M=/^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,N=/([A-Z])/g;function O(a,b,c){if(void 0===c&&1===a.nodeType){var d="data-"+b.replace(N,"-$1").toLowerCase();if(c=a.getAttribute(d),"string"==typeof c){try{c="true"===c?!0:"false"===c?!1:"null"===c?null:+c+""===c?+c:M.test(c)?m.parseJSON(c):c}catch(e){}m.data(a,b,c)}else c=void 0}return c}function P(a){var b;for(b in a)if(("data"!==b||!m.isEmptyObject(a[b]))&&"toJSON"!==b)return!1;

return!0}function Q(a,b,d,e){if(m.acceptData(a)){var f,g,h=m.expando,i=a.nodeType,j=i?m.cache:a,k=i?a[h]:a[h]&&h;if(k&&j[k]&&(e||j[k].data)||void 0!==d||"string"!=typeof b)return k||(k=i?a[h]=c.pop()||m.guid++:h),j[k]||(j[k]=i?{}:{toJSON:m.noop}),("object"==typeof b||"function"==typeof b)&&(e?j[k]=m.extend(j[k],b):j[k].data=m.extend(j[k].data,b)),g=j[k],e||(g.data||(g.data={}),g=g.data),void 0!==d&&(g[m.camelCase(b)]=d),"string"==typeof b?(f=g[b],null==f&&(f=g[m.camelCase(b)])):f=g,f}}function R(a,b,c){if(m.acceptData(a)){var d,e,f=a.nodeType,g=f?m.cache:a,h=f?a[m.expando]:m.expando;if(g[h]){if(b&&(d=c?g[h]:g[h].data)){m.isArray(b)?b=b.concat(m.map(b,m.camelCase)):b in d?b=[b]:(b=m.camelCase(b),b=b in d?[b]:b.split(" ")),e=b.length;while(e--)delete d[b[e]];if(c?!P(d):!m.isEmptyObject(d))return}(c||(delete g[h].data,P(g[h])))&&(f?m.cleanData([a],!0):k.deleteExpando||g!=g.window?delete g[h]:g[h]=null)}}}m.extend({cache:{},noData:{"applet ":!0,"embed ":!0,"object ":"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"},hasData:function(a){return a=a.nodeType?m.cache[a[m.expando]]:a[m.expando],!!a&&!P(a)},data:function(a,b,c){return Q(a,b,c)},removeData:function(a,b){return R(a,b)},_data:function(a,b,c){return Q(a,b,c,!0)},_removeData:function(a,b){return R(a,b,!0)}}),m.fn.extend({data:function(a,b){var c,d,e,f=this[0],g=f&&f.attributes;if(void 0===a){if(this.length&&(e=m.data(f),1===f.nodeType&&!m._data(f,"parsedAttrs"))){c=g.length;while(c--)g[c]&&(d=g[c].name,0===d.indexOf("data-")&&(d=m.camelCase(d.slice(5)),O(f,d,e[d])));m._data(f,"parsedAttrs",!0)}return e}return"object"==typeof a?this.each(function(){m.data(this,a)}):arguments.length>1?this.each(function(){m.data(this,a,b)}):f?O(f,a,m.data(f,a)):void 0},removeData:function(a){return this.each(function(){m.removeData(this,a)})}}),m.extend({queue:function(a,b,c){var d;return a?(b=(b||"fx")+"queue",d=m._data(a,b),c&&(!d||m.isArray(c)?d=m._data(a,b,m.makeArray(c)):d.push(c)),d||[]):void 0},dequeue:function(a,b){b=b||"fx";var c=m.queue(a,b),d=c.length,e=c.shift(),f=m._queueHooks(a,b),g=function(){m.dequeue(a,b)};"inprogress"===e&&(e=c.shift(),d--),e&&("fx"===b&&c.unshift("inprogress"),delete f.stop,e.call(a,g,f)),!d&&f&&f.empty.fire()},_queueHooks:function(a,b){var c=b+"queueHooks";return m._data(a,c)||m._data(a,c,{empty:m.Callbacks("once memory").add(function(){m._removeData(a,b+"queue"),m._removeData(a,c)})})}}),m.fn.extend({queue:function(a,b){var c=2;return"string"!=typeof a&&(b=a,a="fx",c--),arguments.length<c?m.queue(this[0],a):void 0===b?this:this.each(function(){var c=m.queue(this,a,b);m._queueHooks(this,a),"fx"===a&&"inprogress"!==c[0]&&m.dequeue(this,a)})},dequeue:function(a){return this.each(function(){m.dequeue(this,a)})},clearQueue:function(a){return this.queue(a||"fx",[])},promise:function(a,b){var c,d=1,e=m.Deferred(),f=this,g=this.length,h=function(){--d||e.resolveWith(f,[f])};"string"!=typeof a&&(b=a,a=void 0),a=a||"fx";while(g--)c=m._data(f[g],a+"queueHooks"),c&&c.empty&&(d++,c.empty.add(h));return h(),e.promise(b)}});var S=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,T=["Top","Right","Bottom","Left"],U=function(a,b){return a=b||a,"none"===m.css(a,"display")||!m.contains(a.ownerDocument,a)},V=m.access=function(a,b,c,d,e,f,g){var h=0,i=a.length,j=null==c;if("object"===m.type(c)){e=!0;for(h in c)m.access(a,b,h,c[h],!0,f,g)}else if(void 0!==d&&(e=!0,m.isFunction(d)||(g=!0),j&&(g?(b.call(a,d),b=null):(j=b,b=function(a,b,c){return j.call(m(a),c)})),b))for(;i>h;h++)b(a[h],c,g?d:d.call(a[h],h,b(a[h],c)));return e?a:j?b.call(a):i?b(a[0],c):f},W=/^(?:checkbox|radio)$/i;!function(){var a=y.createElement("input"),b=y.createElement("div"),c=y.createDocumentFragment();if(b.innerHTML="  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>",k.leadingWhitespace=3===b.firstChild.nodeType,k.tbody=!b.getElementsByTagName("tbody").length,k.htmlSerialize=!!b.getElementsByTagName("link").length,k.html5Clone="<:nav></:nav>"!==y.createElement("nav").cloneNode(!0).outerHTML,a.type="checkbox",a.checked=!0,c.appendChild(a),k.appendChecked=a.checked,b.innerHTML="<textarea>x</textarea>",k.noCloneChecked=!!b.cloneNode(!0).lastChild.defaultValue,c.appendChild(b),b.innerHTML="<input type='radio' checked='checked' name='t'/>",k.checkClone=b.cloneNode(!0).cloneNode(!0).lastChild.checked,k.noCloneEvent=!0,b.attachEvent&&(b.attachEvent("onclick",function(){k.noCloneEvent=!1}),b.cloneNode(!0).click()),null==k.deleteExpando){k.deleteExpando=!0;try{delete b.test}catch(d){k.deleteExpando=!1}}}(),function(){var b,c,d=y.createElement("div");for(b in{submit:!0,change:!0,focusin:!0})c="on"+b,(k[b+"Bubbles"]=c in a)||(d.setAttribute(c,"t"),k[b+"Bubbles"]=d.attributes[c].expando===!1);d=null}();var X=/^(?:input|select|textarea)$/i,Y=/^key/,Z=/^(?:mouse|pointer|contextmenu)|click/,$=/^(?:focusinfocus|focusoutblur)$/,_=/^([^.]*)(?:\.(.+)|)$/;function aa(){return!0}function ba(){return!1}function ca(){try{return y.activeElement}catch(a){}}m.event={global:{},add:function(a,b,c,d,e){var f,g,h,i,j,k,l,n,o,p,q,r=m._data(a);if(r){c.handler&&(i=c,c=i.handler,e=i.selector),c.guid||(c.guid=m.guid++),(g=r.events)||(g=r.events={}),(k=r.handle)||(k=r.handle=function(a){return typeof m===K||a&&m.event.triggered===a.type?void 0:m.event.dispatch.apply(k.elem,arguments)},k.elem=a),b=(b||"").match(E)||[""],h=b.length;while(h--)f=_.exec(b[h])||[],o=q=f[1],p=(f[2]||"").split(".").sort(),o&&(j=m.event.special[o]||{},o=(e?j.delegateType:j.bindType)||o,j=m.event.special[o]||{},l=m.extend({type:o,origType:q,data:d,handler:c,guid:c.guid,selector:e,needsContext:e&&m.expr.match.needsContext.test(e),namespace:p.join(".")},i),(n=g[o])||(n=g[o]=[],n.delegateCount=0,j.setup&&j.setup.call(a,d,p,k)!==!1||(a.addEventListener?a.addEventListener(o,k,!1):a.attachEvent&&a.attachEvent("on"+o,k))),j.add&&(j.add.call(a,l),l.handler.guid||(l.handler.guid=c.guid)),e?n.splice(n.delegateCount++,0,l):n.push(l),m.event.global[o]=!0);a=null}},remove:function(a,b,c,d,e){var f,g,h,i,j,k,l,n,o,p,q,r=m.hasData(a)&&m._data(a);if(r&&(k=r.events)){b=(b||"").match(E)||[""],j=b.length;while(j--)if(h=_.exec(b[j])||[],o=q=h[1],p=(h[2]||"").split(".").sort(),o){l=m.event.special[o]||{},o=(d?l.delegateType:l.bindType)||o,n=k[o]||[],h=h[2]&&new RegExp("(^|\\.)"+p.join("\\.(?:.*\\.|)")+"(\\.|$)"),i=f=n.length;while(f--)g=n[f],!e&&q!==g.origType||c&&c.guid!==g.guid||h&&!h.test(g.namespace)||d&&d!==g.selector&&("**"!==d||!g.selector)||(n.splice(f,1),g.selector&&n.delegateCount--,l.remove&&l.remove.call(a,g));i&&!n.length&&(l.teardown&&l.teardown.call(a,p,r.handle)!==!1||m.removeEvent(a,o,r.handle),delete k[o])}else for(o in k)m.event.remove(a,o+b[j],c,d,!0);m.isEmptyObject(k)&&(delete r.handle,m._removeData(a,"events"))}},trigger:function(b,c,d,e){var f,g,h,i,k,l,n,o=[d||y],p=j.call(b,"type")?b.type:b,q=j.call(b,"namespace")?b.namespace.split("."):[];if(h=l=d=d||y,3!==d.nodeType&&8!==d.nodeType&&!$.test(p+m.event.triggered)&&(p.indexOf(".")>=0&&(q=p.split("."),p=q.shift(),q.sort()),g=p.indexOf(":")<0&&"on"+p,b=b[m.expando]?b:new m.Event(p,"object"==typeof b&&b),b.isTrigger=e?2:3,b.namespace=q.join("."),b.namespace_re=b.namespace?new RegExp("(^|\\.)"+q.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,b.result=void 0,b.target||(b.target=d),c=null==c?[b]:m.makeArray(c,[b]),k=m.event.special[p]||{},e||!k.trigger||k.trigger.apply(d,c)!==!1)){if(!e&&!k.noBubble&&!m.isWindow(d)){for(i=k.delegateType||p,$.test(i+p)||(h=h.parentNode);h;h=h.parentNode)o.push(h),l=h;l===(d.ownerDocument||y)&&o.push(l.defaultView||l.parentWindow||a)}n=0;while((h=o[n++])&&!b.isPropagationStopped())b.type=n>1?i:k.bindType||p,f=(m._data(h,"events")||{})[b.type]&&m._data(h,"handle"),f&&f.apply(h,c),f=g&&h[g],f&&f.apply&&m.acceptData(h)&&(b.result=f.apply(h,c),b.result===!1&&b.preventDefault());if(b.type=p,!e&&!b.isDefaultPrevented()&&(!k._default||k._default.apply(o.pop(),c)===!1)&&m.acceptData(d)&&g&&d[p]&&!m.isWindow(d)){l=d[g],l&&(d[g]=null),m.event.triggered=p;try{d[p]()}catch(r){}m.event.triggered=void 0,l&&(d[g]=l)}return b.result}},dispatch:function(a){a=m.event.fix(a);var b,c,e,f,g,h=[],i=d.call(arguments),j=(m._data(this,"events")||{})[a.type]||[],k=m.event.special[a.type]||{};if(i[0]=a,a.delegateTarget=this,!k.preDispatch||k.preDispatch.call(this,a)!==!1){h=m.event.handlers.call(this,a,j),b=0;while((f=h[b++])&&!a.isPropagationStopped()){a.currentTarget=f.elem,g=0;while((e=f.handlers[g++])&&!a.isImmediatePropagationStopped())(!a.namespace_re||a.namespace_re.test(e.namespace))&&(a.handleObj=e,a.data=e.data,c=((m.event.special[e.origType]||{}).handle||e.handler).apply(f.elem,i),void 0!==c&&(a.result=c)===!1&&(a.preventDefault(),a.stopPropagation()))}return k.postDispatch&&k.postDispatch.call(this,a),a.result}},handlers:function(a,b){var c,d,e,f,g=[],h=b.delegateCount,i=a.target;if(h&&i.nodeType&&(!a.button||"click"!==a.type))for(;i!=this;i=i.parentNode||this)if(1===i.nodeType&&(i.disabled!==!0||"click"!==a.type)){for(e=[],f=0;h>f;f++)d=b[f],c=d.selector+" ",void 0===e[c]&&(e[c]=d.needsContext?m(c,this).index(i)>=0:m.find(c,this,null,[i]).length),e[c]&&e.push(d);e.length&&g.push({elem:i,handlers:e})}return h<b.length&&g.push({elem:this,handlers:b.slice(h)}),g},fix:function(a){if(a[m.expando])return a;var b,c,d,e=a.type,f=a,g=this.fixHooks[e];g||(this.fixHooks[e]=g=Z.test(e)?this.mouseHooks:Y.test(e)?this.keyHooks:{}),d=g.props?this.props.concat(g.props):this.props,a=new m.Event(f),b=d.length;while(b--)c=d[b],a[c]=f[c];return a.target||(a.target=f.srcElement||y),3===a.target.nodeType&&(a.target=a.target.parentNode),a.metaKey=!!a.metaKey,g.filter?g.filter(a,f):a},props:"altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(a,b){return null==a.which&&(a.which=null!=b.charCode?b.charCode:b.keyCode),a}},mouseHooks:{props:"button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(a,b){var c,d,e,f=b.button,g=b.fromElement;return null==a.pageX&&null!=b.clientX&&(d=a.target.ownerDocument||y,e=d.documentElement,c=d.body,a.pageX=b.clientX+(e&&e.scrollLeft||c&&c.scrollLeft||0)-(e&&e.clientLeft||c&&c.clientLeft||0),a.pageY=b.clientY+(e&&e.scrollTop||c&&c.scrollTop||0)-(e&&e.clientTop||c&&c.clientTop||0)),!a.relatedTarget&&g&&(a.relatedTarget=g===a.target?b.toElement:g),a.which||void 0===f||(a.which=1&f?1:2&f?3:4&f?2:0),a}},special:{load:{noBubble:!0},focus:{trigger:function(){if(this!==ca()&&this.focus)try{return this.focus(),!1}catch(a){}},delegateType:"focusin"},blur:{trigger:function(){return this===ca()&&this.blur?(this.blur(),!1):void 0},delegateType:"focusout"},click:{trigger:function(){return m.nodeName(this,"input")&&"checkbox"===this.type&&this.click?(this.click(),!1):void 0},_default:function(a){return m.nodeName(a.target,"a")}},beforeunload:{postDispatch:function(a){void 0!==a.result&&a.originalEvent&&(a.originalEvent.returnValue=a.result)}}},simulate:function(a,b,c,d){var e=m.extend(new m.Event,c,{type:a,isSimulated:!0,originalEvent:{}});d?m.event.trigger(e,null,b):m.event.dispatch.call(b,e),e.isDefaultPrevented()&&c.preventDefault()}},m.removeEvent=y.removeEventListener?function(a,b,c){a.removeEventListener&&a.removeEventListener(b,c,!1)}:function(a,b,c){var d="on"+b;a.detachEvent&&(typeof a[d]===K&&(a[d]=null),a.detachEvent(d,c))},m.Event=function(a,b){return this instanceof m.Event?(a&&a.type?(this.originalEvent=a,this.type=a.type,this.isDefaultPrevented=a.defaultPrevented||void 0===a.defaultPrevented&&a.returnValue===!1?aa:ba):this.type=a,b&&m.extend(this,b),this.timeStamp=a&&a.timeStamp||m.now(),void(this[m.expando]=!0)):new m.Event(a,b)},m.Event.prototype={isDefaultPrevented:ba,isPropagationStopped:ba,isImmediatePropagationStopped:ba,preventDefault:function(){var a=this.originalEvent;this.isDefaultPrevented=aa,a&&(a.preventDefault?a.preventDefault():a.returnValue=!1)},stopPropagation:function(){var a=this.originalEvent;this.isPropagationStopped=aa,a&&(a.stopPropagation&&a.stopPropagation(),a.cancelBubble=!0)},stopImmediatePropagation:function(){var a=this.originalEvent;this.isImmediatePropagationStopped=aa,a&&a.stopImmediatePropagation&&a.stopImmediatePropagation(),this.stopPropagation()}},m.each({mouseenter:"mouseover",mouseleave:"mouseout",pointerenter:"pointerover",pointerleave:"pointerout"},function(a,b){m.event.special[a]={delegateType:b,bindType:b,handle:function(a){var c,d=this,e=a.relatedTarget,f=a.handleObj;return(!e||e!==d&&!m.contains(d,e))&&(a.type=f.origType,c=f.handler.apply(this,arguments),a.type=b),c}}}),k.submitBubbles||(m.event.special.submit={setup:function(){return m.nodeName(this,"form")?!1:void m.event.add(this,"click._submit keypress._submit",function(a){var b=a.target,c=m.nodeName(b,"input")||m.nodeName(b,"button")?b.form:void 0;c&&!m._data(c,"submitBubbles")&&(m.event.add(c,"submit._submit",function(a){a._submit_bubble=!0}),m._data(c,"submitBubbles",!0))})},postDispatch:function(a){a._submit_bubble&&(delete a._submit_bubble,this.parentNode&&!a.isTrigger&&m.event.simulate("submit",this.parentNode,a,!0))},teardown:function(){return m.nodeName(this,"form")?!1:void m.event.remove(this,"._submit")}}),k.changeBubbles||(m.event.special.change={setup:function(){return X.test(this.nodeName)?(("checkbox"===this.type||"radio"===this.type)&&(m.event.add(this,"propertychange._change",function(a){"checked"===a.originalEvent.propertyName&&(this._just_changed=!0)}),m.event.add(this,"click._change",function(a){this._just_changed&&!a.isTrigger&&(this._just_changed=!1),m.event.simulate("change",this,a,!0)})),!1):void m.event.add(this,"beforeactivate._change",function(a){var b=a.target;X.test(b.nodeName)&&!m._data(b,"changeBubbles")&&(m.event.add(b,"change._change",function(a){!this.parentNode||a.isSimulated||a.isTrigger||m.event.simulate("change",this.parentNode,a,!0)}),m._data(b,"changeBubbles",!0))})},handle:function(a){var b=a.target;return this!==b||a.isSimulated||a.isTrigger||"radio"!==b.type&&"checkbox"!==b.type?a.handleObj.handler.apply(this,arguments):void 0},teardown:function(){return m.event.remove(this,"._change"),!X.test(this.nodeName)}}),k.focusinBubbles||m.each({focus:"focusin",blur:"focusout"},function(a,b){var c=function(a){m.event.simulate(b,a.target,m.event.fix(a),!0)};m.event.special[b]={setup:function(){var d=this.ownerDocument||this,e=m._data(d,b);e||d.addEventListener(a,c,!0),m._data(d,b,(e||0)+1)},teardown:function(){var d=this.ownerDocument||this,e=m._data(d,b)-1;e?m._data(d,b,e):(d.removeEventListener(a,c,!0),m._removeData(d,b))}}}),m.fn.extend({on:function(a,b,c,d,e){var f,g;if("object"==typeof a){"string"!=typeof b&&(c=c||b,b=void 0);for(f in a)this.on(f,b,c,a[f],e);return this}if(null==c&&null==d?(d=b,c=b=void 0):null==d&&("string"==typeof b?(d=c,c=void 0):(d=c,c=b,b=void 0)),d===!1)d=ba;else if(!d)return this;return 1===e&&(g=d,d=function(a){return m().off(a),g.apply(this,arguments)},d.guid=g.guid||(g.guid=m.guid++)),this.each(function(){m.event.add(this,a,d,c,b)})},one:function(a,b,c,d){return this.on(a,b,c,d,1)},off:function(a,b,c){var d,e;if(a&&a.preventDefault&&a.handleObj)return d=a.handleObj,m(a.delegateTarget).off(d.namespace?d.origType+"."+d.namespace:d.origType,d.selector,d.handler),this;if("object"==typeof a){for(e in a)this.off(e,b,a[e]);return this}return(b===!1||"function"==typeof b)&&(c=b,b=void 0),c===!1&&(c=ba),this.each(function(){m.event.remove(this,a,c,b)})},trigger:function(a,b){return this.each(function(){m.event.trigger(a,b,this)})},triggerHandler:function(a,b){var c=this[0];return c?m.event.trigger(a,b,c,!0):void 0}});function da(a){var b=ea.split("|"),c=a.createDocumentFragment();if(c.createElement)while(b.length)c.createElement(b.pop());return c}var ea="abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",fa=/ jQuery\d+="(?:null|\d+)"/g,ga=new RegExp("<(?:"+ea+")[\\s/>]","i"),ha=/^\s+/,ia=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,ja=/<([\w:]+)/,ka=/<tbody/i,la=/<|&#?\w+;/,ma=/<(?:script|style|link)/i,na=/checked\s*(?:[^=]|=\s*.checked.)/i,oa=/^$|\/(?:java|ecma)script/i,pa=/^true\/(.*)/,qa=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,ra={option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],area:[1,"<map>","</map>"],param:[1,"<object>","</object>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:k.htmlSerialize?[0,"",""]:[1,"X<div>","</div>"]},sa=da(y),ta=sa.appendChild(y.createElement("div"));ra.optgroup=ra.option,ra.tbody=ra.tfoot=ra.colgroup=ra.caption=ra.thead,ra.th=ra.td;function ua(a,b){var c,d,e=0,f=typeof a.getElementsByTagName!==K?a.getElementsByTagName(b||"*"):typeof a.querySelectorAll!==K?a.querySelectorAll(b||"*"):void 0;if(!f)for(f=[],c=a.childNodes||a;null!=(d=c[e]);e++)!b||m.nodeName(d,b)?f.push(d):m.merge(f,ua(d,b));return void 0===b||b&&m.nodeName(a,b)?m.merge([a],f):f}function va(a){W.test(a.type)&&(a.defaultChecked=a.checked)}function wa(a,b){return m.nodeName(a,"table")&&m.nodeName(11!==b.nodeType?b:b.firstChild,"tr")?a.getElementsByTagName("tbody")[0]||a.appendChild(a.ownerDocument.createElement("tbody")):a}function xa(a){return a.type=(null!==m.find.attr(a,"type"))+"/"+a.type,a}function ya(a){var b=pa.exec(a.type);return b?a.type=b[1]:a.removeAttribute("type"),a}function za(a,b){for(var c,d=0;null!=(c=a[d]);d++)m._data(c,"globalEval",!b||m._data(b[d],"globalEval"))}function Aa(a,b){if(1===b.nodeType&&m.hasData(a)){var c,d,e,f=m._data(a),g=m._data(b,f),h=f.events;if(h){delete g.handle,g.events={};for(c in h)for(d=0,e=h[c].length;e>d;d++)m.event.add(b,c,h[c][d])}g.data&&(g.data=m.extend({},g.data))}}function Ba(a,b){var c,d,e;if(1===b.nodeType){if(c=b.nodeName.toLowerCase(),!k.noCloneEvent&&b[m.expando]){e=m._data(b);for(d in e.events)m.removeEvent(b,d,e.handle);b.removeAttribute(m.expando)}"script"===c&&b.text!==a.text?(xa(b).text=a.text,ya(b)):"object"===c?(b.parentNode&&(b.outerHTML=a.outerHTML),k.html5Clone&&a.innerHTML&&!m.trim(b.innerHTML)&&(b.innerHTML=a.innerHTML)):"input"===c&&W.test(a.type)?(b.defaultChecked=b.checked=a.checked,b.value!==a.value&&(b.value=a.value)):"option"===c?b.defaultSelected=b.selected=a.defaultSelected:("input"===c||"textarea"===c)&&(b.defaultValue=a.defaultValue)}}m.extend({clone:function(a,b,c){var d,e,f,g,h,i=m.contains(a.ownerDocument,a);if(k.html5Clone||m.isXMLDoc(a)||!ga.test("<"+a.nodeName+">")?f=a.cloneNode(!0):(ta.innerHTML=a.outerHTML,ta.removeChild(f=ta.firstChild)),!(k.noCloneEvent&&k.noCloneChecked||1!==a.nodeType&&11!==a.nodeType||m.isXMLDoc(a)))for(d=ua(f),h=ua(a),g=0;null!=(e=h[g]);++g)d[g]&&Ba(e,d[g]);if(b)if(c)for(h=h||ua(a),d=d||ua(f),g=0;null!=(e=h[g]);g++)Aa(e,d[g]);else Aa(a,f);return d=ua(f,"script"),d.length>0&&za(d,!i&&ua(a,"script")),d=h=e=null,f},buildFragment:function(a,b,c,d){for(var e,f,g,h,i,j,l,n=a.length,o=da(b),p=[],q=0;n>q;q++)if(f=a[q],f||0===f)if("object"===m.type(f))m.merge(p,f.nodeType?[f]:f);else if(la.test(f)){h=h||o.appendChild(b.createElement("div")),i=(ja.exec(f)||["",""])[1].toLowerCase(),l=ra[i]||ra._default,h.innerHTML=l[1]+f.replace(ia,"<$1></$2>")+l[2],e=l[0];while(e--)h=h.lastChild;if(!k.leadingWhitespace&&ha.test(f)&&p.push(b.createTextNode(ha.exec(f)[0])),!k.tbody){f="table"!==i||ka.test(f)?"<table>"!==l[1]||ka.test(f)?0:h:h.firstChild,e=f&&f.childNodes.length;while(e--)m.nodeName(j=f.childNodes[e],"tbody")&&!j.childNodes.length&&f.removeChild(j)}m.merge(p,h.childNodes),h.textContent="";while(h.firstChild)h.removeChild(h.firstChild);h=o.lastChild}else p.push(b.createTextNode(f));h&&o.removeChild(h),k.appendChecked||m.grep(ua(p,"input"),va),q=0;while(f=p[q++])if((!d||-1===m.inArray(f,d))&&(g=m.contains(f.ownerDocument,f),h=ua(o.appendChild(f),"script"),g&&za(h),c)){e=0;while(f=h[e++])oa.test(f.type||"")&&c.push(f)}return h=null,o},cleanData:function(a,b){for(var d,e,f,g,h=0,i=m.expando,j=m.cache,l=k.deleteExpando,n=m.event.special;null!=(d=a[h]);h++)if((b||m.acceptData(d))&&(f=d[i],g=f&&j[f])){if(g.events)for(e in g.events)n[e]?m.event.remove(d,e):m.removeEvent(d,e,g.handle);j[f]&&(delete j[f],l?delete d[i]:typeof d.removeAttribute!==K?d.removeAttribute(i):d[i]=null,c.push(f))}}}),m.fn.extend({text:function(a){return V(this,function(a){return void 0===a?m.text(this):this.empty().append((this[0]&&this[0].ownerDocument||y).createTextNode(a))},null,a,arguments.length)},append:function(){return this.domManip(arguments,function(a){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var b=wa(this,a);b.appendChild(a)}})},prepend:function(){return this.domManip(arguments,function(a){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var b=wa(this,a);b.insertBefore(a,b.firstChild)}})},before:function(){return this.domManip(arguments,function(a){this.parentNode&&this.parentNode.insertBefore(a,this)})},after:function(){return this.domManip(arguments,function(a){this.parentNode&&this.parentNode.insertBefore(a,this.nextSibling)})},remove:function(a,b){for(var c,d=a?m.filter(a,this):this,e=0;null!=(c=d[e]);e++)b||1!==c.nodeType||m.cleanData(ua(c)),c.parentNode&&(b&&m.contains(c.ownerDocument,c)&&za(ua(c,"script")),c.parentNode.removeChild(c));return this},empty:function(){for(var a,b=0;null!=(a=this[b]);b++){1===a.nodeType&&m.cleanData(ua(a,!1));while(a.firstChild)a.removeChild(a.firstChild);a.options&&m.nodeName(a,"select")&&(a.options.length=0)}return this},clone:function(a,b){return a=null==a?!1:a,b=null==b?a:b,this.map(function(){return m.clone(this,a,b)})},html:function(a){return V(this,function(a){var b=this[0]||{},c=0,d=this.length;if(void 0===a)return 1===b.nodeType?b.innerHTML.replace(fa,""):void 0;if(!("string"!=typeof a||ma.test(a)||!k.htmlSerialize&&ga.test(a)||!k.leadingWhitespace&&ha.test(a)||ra[(ja.exec(a)||["",""])[1].toLowerCase()])){a=a.replace(ia,"<$1></$2>");try{for(;d>c;c++)b=this[c]||{},1===b.nodeType&&(m.cleanData(ua(b,!1)),b.innerHTML=a);b=0}catch(e){}}b&&this.empty().append(a)},null,a,arguments.length)},replaceWith:function(){var a=arguments[0];return this.domManip(arguments,function(b){a=this.parentNode,m.cleanData(ua(this)),a&&a.replaceChild(b,this)}),a&&(a.length||a.nodeType)?this:this.remove()},detach:function(a){return this.remove(a,!0)},domManip:function(a,b){a=e.apply([],a);var c,d,f,g,h,i,j=0,l=this.length,n=this,o=l-1,p=a[0],q=m.isFunction(p);if(q||l>1&&"string"==typeof p&&!k.checkClone&&na.test(p))return this.each(function(c){var d=n.eq(c);q&&(a[0]=p.call(this,c,d.html())),d.domManip(a,b)});if(l&&(i=m.buildFragment(a,this[0].ownerDocument,!1,this),c=i.firstChild,1===i.childNodes.length&&(i=c),c)){for(g=m.map(ua(i,"script"),xa),f=g.length;l>j;j++)d=i,j!==o&&(d=m.clone(d,!0,!0),f&&m.merge(g,ua(d,"script"))),b.call(this[j],d,j);if(f)for(h=g[g.length-1].ownerDocument,m.map(g,ya),j=0;f>j;j++)d=g[j],oa.test(d.type||"")&&!m._data(d,"globalEval")&&m.contains(h,d)&&(d.src?m._evalUrl&&m._evalUrl(d.src):m.globalEval((d.text||d.textContent||d.innerHTML||"").replace(qa,"")));i=c=null}return this}}),m.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(a,b){m.fn[a]=function(a){for(var c,d=0,e=[],g=m(a),h=g.length-1;h>=d;d++)c=d===h?this:this.clone(!0),m(g[d])[b](c),f.apply(e,c.get());return this.pushStack(e)}});var Ca,Da={};function Ea(b,c){var d,e=m(c.createElement(b)).appendTo(c.body),f=a.getDefaultComputedStyle&&(d=a.getDefaultComputedStyle(e[0]))?d.display:m.css(e[0],"display");return e.detach(),f}function Fa(a){var b=y,c=Da[a];return c||(c=Ea(a,b),"none"!==c&&c||(Ca=(Ca||m("<iframe frameborder='0' width='0' height='0'/>")).appendTo(b.documentElement),b=(Ca[0].contentWindow||Ca[0].contentDocument).document,b.write(),b.close(),c=Ea(a,b),Ca.detach()),Da[a]=c),c}!function(){var a;k.shrinkWrapBlocks=function(){if(null!=a)return a;a=!1;var b,c,d;return c=y.getElementsByTagName("body")[0],c&&c.style?(b=y.createElement("div"),d=y.createElement("div"),d.style.cssText="position:absolute;border:0;width:0;height:0;top:0;left:-9999px",c.appendChild(d).appendChild(b),typeof b.style.zoom!==K&&(b.style.cssText="-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:block;margin:0;border:0;padding:1px;width:1px;zoom:1",b.appendChild(y.createElement("div")).style.width="5px",a=3!==b.offsetWidth),c.removeChild(d),a):void 0}}();var Ga=/^margin/,Ha=new RegExp("^("+S+")(?!px)[a-z%]+$","i"),Ia,Ja,Ka=/^(top|right|bottom|left)$/;a.getComputedStyle?(Ia=function(b){return b.ownerDocument.defaultView.opener?b.ownerDocument.defaultView.getComputedStyle(b,null):a.getComputedStyle(b,null)},Ja=function(a,b,c){var d,e,f,g,h=a.style;return c=c||Ia(a),g=c?c.getPropertyValue(b)||c[b]:void 0,c&&(""!==g||m.contains(a.ownerDocument,a)||(g=m.style(a,b)),Ha.test(g)&&Ga.test(b)&&(d=h.width,e=h.minWidth,f=h.maxWidth,h.minWidth=h.maxWidth=h.width=g,g=c.width,h.width=d,h.minWidth=e,h.maxWidth=f)),void 0===g?g:g+""}):y.documentElement.currentStyle&&(Ia=function(a){return a.currentStyle},Ja=function(a,b,c){var d,e,f,g,h=a.style;return c=c||Ia(a),g=c?c[b]:void 0,null==g&&h&&h[b]&&(g=h[b]),Ha.test(g)&&!Ka.test(b)&&(d=h.left,e=a.runtimeStyle,f=e&&e.left,f&&(e.left=a.currentStyle.left),h.left="fontSize"===b?"1em":g,g=h.pixelLeft+"px",h.left=d,f&&(e.left=f)),void 0===g?g:g+""||"auto"});function La(a,b){return{get:function(){var c=a();if(null!=c)return c?void delete this.get:(this.get=b).apply(this,arguments)}}}!function(){var b,c,d,e,f,g,h;if(b=y.createElement("div"),b.innerHTML="  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>",d=b.getElementsByTagName("a")[0],c=d&&d.style){c.cssText="float:left;opacity:.5",k.opacity="0.5"===c.opacity,k.cssFloat=!!c.cssFloat,b.style.backgroundClip="content-box",b.cloneNode(!0).style.backgroundClip="",k.clearCloneStyle="content-box"===b.style.backgroundClip,k.boxSizing=""===c.boxSizing||""===c.MozBoxSizing||""===c.WebkitBoxSizing,m.extend(k,{reliableHiddenOffsets:function(){return null==g&&i(),g},boxSizingReliable:function(){return null==f&&i(),f},pixelPosition:function(){return null==e&&i(),e},reliableMarginRight:function(){return null==h&&i(),h}});function i(){var b,c,d,i;c=y.getElementsByTagName("body")[0],c&&c.style&&(b=y.createElement("div"),d=y.createElement("div"),d.style.cssText="position:absolute;border:0;width:0;height:0;top:0;left:-9999px",c.appendChild(d).appendChild(b),b.style.cssText="-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;display:block;margin-top:1%;top:1%;border:1px;padding:1px;width:4px;position:absolute",e=f=!1,h=!0,a.getComputedStyle&&(e="1%"!==(a.getComputedStyle(b,null)||{}).top,f="4px"===(a.getComputedStyle(b,null)||{width:"4px"}).width,i=b.appendChild(y.createElement("div")),i.style.cssText=b.style.cssText="-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:block;margin:0;border:0;padding:0",i.style.marginRight=i.style.width="0",b.style.width="1px",h=!parseFloat((a.getComputedStyle(i,null)||{}).marginRight),b.removeChild(i)),b.innerHTML="<table><tr><td></td><td>t</td></tr></table>",i=b.getElementsByTagName("td"),i[0].style.cssText="margin:0;border:0;padding:0;display:none",g=0===i[0].offsetHeight,g&&(i[0].style.display="",i[1].style.display="none",g=0===i[0].offsetHeight),c.removeChild(d))}}}(),m.swap=function(a,b,c,d){var e,f,g={};for(f in b)g[f]=a.style[f],a.style[f]=b[f];e=c.apply(a,d||[]);for(f in b)a.style[f]=g[f];return e};var Ma=/alpha\([^)]*\)/i,Na=/opacity\s*=\s*([^)]*)/,Oa=/^(none|table(?!-c[ea]).+)/,Pa=new RegExp("^("+S+")(.*)$","i"),Qa=new RegExp("^([+-])=("+S+")","i"),Ra={position:"absolute",visibility:"hidden",display:"block"},Sa={letterSpacing:"0",fontWeight:"400"},Ta=["Webkit","O","Moz","ms"];function Ua(a,b){if(b in a)return b;var c=b.charAt(0).toUpperCase()+b.slice(1),d=b,e=Ta.length;while(e--)if(b=Ta[e]+c,b in a)return b;return d}function Va(a,b){for(var c,d,e,f=[],g=0,h=a.length;h>g;g++)d=a[g],d.style&&(f[g]=m._data(d,"olddisplay"),c=d.style.display,b?(f[g]||"none"!==c||(d.style.display=""),""===d.style.display&&U(d)&&(f[g]=m._data(d,"olddisplay",Fa(d.nodeName)))):(e=U(d),(c&&"none"!==c||!e)&&m._data(d,"olddisplay",e?c:m.css(d,"display"))));for(g=0;h>g;g++)d=a[g],d.style&&(b&&"none"!==d.style.display&&""!==d.style.display||(d.style.display=b?f[g]||"":"none"));return a}function Wa(a,b,c){var d=Pa.exec(b);return d?Math.max(0,d[1]-(c||0))+(d[2]||"px"):b}function Xa(a,b,c,d,e){for(var f=c===(d?"border":"content")?4:"width"===b?1:0,g=0;4>f;f+=2)"margin"===c&&(g+=m.css(a,c+T[f],!0,e)),d?("content"===c&&(g-=m.css(a,"padding"+T[f],!0,e)),"margin"!==c&&(g-=m.css(a,"border"+T[f]+"Width",!0,e))):(g+=m.css(a,"padding"+T[f],!0,e),"padding"!==c&&(g+=m.css(a,"border"+T[f]+"Width",!0,e)));return g}function Ya(a,b,c){var d=!0,e="width"===b?a.offsetWidth:a.offsetHeight,f=Ia(a),g=k.boxSizing&&"border-box"===m.css(a,"boxSizing",!1,f);if(0>=e||null==e){if(e=Ja(a,b,f),(0>e||null==e)&&(e=a.style[b]),Ha.test(e))return e;d=g&&(k.boxSizingReliable()||e===a.style[b]),e=parseFloat(e)||0}return e+Xa(a,b,c||(g?"border":"content"),d,f)+"px"}m.extend({cssHooks:{opacity:{get:function(a,b){if(b){var c=Ja(a,"opacity");return""===c?"1":c}}}},cssNumber:{columnCount:!0,fillOpacity:!0,flexGrow:!0,flexShrink:!0,fontWeight:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":k.cssFloat?"cssFloat":"styleFloat"},style:function(a,b,c,d){if(a&&3!==a.nodeType&&8!==a.nodeType&&a.style){var e,f,g,h=m.camelCase(b),i=a.style;if(b=m.cssProps[h]||(m.cssProps[h]=Ua(i,h)),g=m.cssHooks[b]||m.cssHooks[h],void 0===c)return g&&"get"in g&&void 0!==(e=g.get(a,!1,d))?e:i[b];if(f=typeof c,"string"===f&&(e=Qa.exec(c))&&(c=(e[1]+1)*e[2]+parseFloat(m.css(a,b)),f="number"),null!=c&&c===c&&("number"!==f||m.cssNumber[h]||(c+="px"),k.clearCloneStyle||""!==c||0!==b.indexOf("background")||(i[b]="inherit"),!(g&&"set"in g&&void 0===(c=g.set(a,c,d)))))try{i[b]=c}catch(j){}}},css:function(a,b,c,d){var e,f,g,h=m.camelCase(b);return b=m.cssProps[h]||(m.cssProps[h]=Ua(a.style,h)),g=m.cssHooks[b]||m.cssHooks[h],g&&"get"in g&&(f=g.get(a,!0,c)),void 0===f&&(f=Ja(a,b,d)),"normal"===f&&b in Sa&&(f=Sa[b]),""===c||c?(e=parseFloat(f),c===!0||m.isNumeric(e)?e||0:f):f}}),m.each(["height","width"],function(a,b){m.cssHooks[b]={get:function(a,c,d){return c?Oa.test(m.css(a,"display"))&&0===a.offsetWidth?m.swap(a,Ra,function(){return Ya(a,b,d)}):Ya(a,b,d):void 0},set:function(a,c,d){var e=d&&Ia(a);return Wa(a,c,d?Xa(a,b,d,k.boxSizing&&"border-box"===m.css(a,"boxSizing",!1,e),e):0)}}}),k.opacity||(m.cssHooks.opacity={get:function(a,b){return Na.test((b&&a.currentStyle?a.currentStyle.filter:a.style.filter)||"")?.01*parseFloat(RegExp.$1)+"":b?"1":""},set:function(a,b){var c=a.style,d=a.currentStyle,e=m.isNumeric(b)?"alpha(opacity="+100*b+")":"",f=d&&d.filter||c.filter||"";c.zoom=1,(b>=1||""===b)&&""===m.trim(f.replace(Ma,""))&&c.removeAttribute&&(c.removeAttribute("filter"),""===b||d&&!d.filter)||(c.filter=Ma.test(f)?f.replace(Ma,e):f+" "+e)}}),m.cssHooks.marginRight=La(k.reliableMarginRight,function(a,b){return b?m.swap(a,{display:"inline-block"},Ja,[a,"marginRight"]):void 0}),m.each({margin:"",padding:"",border:"Width"},function(a,b){m.cssHooks[a+b]={expand:function(c){for(var d=0,e={},f="string"==typeof c?c.split(" "):[c];4>d;d++)e[a+T[d]+b]=f[d]||f[d-2]||f[0];return e}},Ga.test(a)||(m.cssHooks[a+b].set=Wa)}),m.fn.extend({css:function(a,b){return V(this,function(a,b,c){var d,e,f={},g=0;if(m.isArray(b)){for(d=Ia(a),e=b.length;e>g;g++)f[b[g]]=m.css(a,b[g],!1,d);return f}return void 0!==c?m.style(a,b,c):m.css(a,b)},a,b,arguments.length>1)},show:function(){return Va(this,!0)},hide:function(){return Va(this)},toggle:function(a){return"boolean"==typeof a?a?this.show():this.hide():this.each(function(){U(this)?m(this).show():m(this).hide()})}});function Za(a,b,c,d,e){
return new Za.prototype.init(a,b,c,d,e)}m.Tween=Za,Za.prototype={constructor:Za,init:function(a,b,c,d,e,f){this.elem=a,this.prop=c,this.easing=e||"swing",this.options=b,this.start=this.now=this.cur(),this.end=d,this.unit=f||(m.cssNumber[c]?"":"px")},cur:function(){var a=Za.propHooks[this.prop];return a&&a.get?a.get(this):Za.propHooks._default.get(this)},run:function(a){var b,c=Za.propHooks[this.prop];return this.options.duration?this.pos=b=m.easing[this.easing](a,this.options.duration*a,0,1,this.options.duration):this.pos=b=a,this.now=(this.end-this.start)*b+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),c&&c.set?c.set(this):Za.propHooks._default.set(this),this}},Za.prototype.init.prototype=Za.prototype,Za.propHooks={_default:{get:function(a){var b;return null==a.elem[a.prop]||a.elem.style&&null!=a.elem.style[a.prop]?(b=m.css(a.elem,a.prop,""),b&&"auto"!==b?b:0):a.elem[a.prop]},set:function(a){m.fx.step[a.prop]?m.fx.step[a.prop](a):a.elem.style&&(null!=a.elem.style[m.cssProps[a.prop]]||m.cssHooks[a.prop])?m.style(a.elem,a.prop,a.now+a.unit):a.elem[a.prop]=a.now}}},Za.propHooks.scrollTop=Za.propHooks.scrollLeft={set:function(a){a.elem.nodeType&&a.elem.parentNode&&(a.elem[a.prop]=a.now)}},m.easing={linear:function(a){return a},swing:function(a){return.5-Math.cos(a*Math.PI)/2}},m.fx=Za.prototype.init,m.fx.step={};var $a,_a,ab=/^(?:toggle|show|hide)$/,bb=new RegExp("^(?:([+-])=|)("+S+")([a-z%]*)$","i"),cb=/queueHooks$/,db=[ib],eb={"*":[function(a,b){var c=this.createTween(a,b),d=c.cur(),e=bb.exec(b),f=e&&e[3]||(m.cssNumber[a]?"":"px"),g=(m.cssNumber[a]||"px"!==f&&+d)&&bb.exec(m.css(c.elem,a)),h=1,i=20;if(g&&g[3]!==f){f=f||g[3],e=e||[],g=+d||1;do h=h||".5",g/=h,m.style(c.elem,a,g+f);while(h!==(h=c.cur()/d)&&1!==h&&--i)}return e&&(g=c.start=+g||+d||0,c.unit=f,c.end=e[1]?g+(e[1]+1)*e[2]:+e[2]),c}]};function fb(){return setTimeout(function(){$a=void 0}),$a=m.now()}function gb(a,b){var c,d={height:a},e=0;for(b=b?1:0;4>e;e+=2-b)c=T[e],d["margin"+c]=d["padding"+c]=a;return b&&(d.opacity=d.width=a),d}function hb(a,b,c){for(var d,e=(eb[b]||[]).concat(eb["*"]),f=0,g=e.length;g>f;f++)if(d=e[f].call(c,b,a))return d}function ib(a,b,c){var d,e,f,g,h,i,j,l,n=this,o={},p=a.style,q=a.nodeType&&U(a),r=m._data(a,"fxshow");c.queue||(h=m._queueHooks(a,"fx"),null==h.unqueued&&(h.unqueued=0,i=h.empty.fire,h.empty.fire=function(){h.unqueued||i()}),h.unqueued++,n.always(function(){n.always(function(){h.unqueued--,m.queue(a,"fx").length||h.empty.fire()})})),1===a.nodeType&&("height"in b||"width"in b)&&(c.overflow=[p.overflow,p.overflowX,p.overflowY],j=m.css(a,"display"),l="none"===j?m._data(a,"olddisplay")||Fa(a.nodeName):j,"inline"===l&&"none"===m.css(a,"float")&&(k.inlineBlockNeedsLayout&&"inline"!==Fa(a.nodeName)?p.zoom=1:p.display="inline-block")),c.overflow&&(p.overflow="hidden",k.shrinkWrapBlocks()||n.always(function(){p.overflow=c.overflow[0],p.overflowX=c.overflow[1],p.overflowY=c.overflow[2]}));for(d in b)if(e=b[d],ab.exec(e)){if(delete b[d],f=f||"toggle"===e,e===(q?"hide":"show")){if("show"!==e||!r||void 0===r[d])continue;q=!0}o[d]=r&&r[d]||m.style(a,d)}else j=void 0;if(m.isEmptyObject(o))"inline"===("none"===j?Fa(a.nodeName):j)&&(p.display=j);else{r?"hidden"in r&&(q=r.hidden):r=m._data(a,"fxshow",{}),f&&(r.hidden=!q),q?m(a).show():n.done(function(){m(a).hide()}),n.done(function(){var b;m._removeData(a,"fxshow");for(b in o)m.style(a,b,o[b])});for(d in o)g=hb(q?r[d]:0,d,n),d in r||(r[d]=g.start,q&&(g.end=g.start,g.start="width"===d||"height"===d?1:0))}}function jb(a,b){var c,d,e,f,g;for(c in a)if(d=m.camelCase(c),e=b[d],f=a[c],m.isArray(f)&&(e=f[1],f=a[c]=f[0]),c!==d&&(a[d]=f,delete a[c]),g=m.cssHooks[d],g&&"expand"in g){f=g.expand(f),delete a[d];for(c in f)c in a||(a[c]=f[c],b[c]=e)}else b[d]=e}function kb(a,b,c){var d,e,f=0,g=db.length,h=m.Deferred().always(function(){delete i.elem}),i=function(){if(e)return!1;for(var b=$a||fb(),c=Math.max(0,j.startTime+j.duration-b),d=c/j.duration||0,f=1-d,g=0,i=j.tweens.length;i>g;g++)j.tweens[g].run(f);return h.notifyWith(a,[j,f,c]),1>f&&i?c:(h.resolveWith(a,[j]),!1)},j=h.promise({elem:a,props:m.extend({},b),opts:m.extend(!0,{specialEasing:{}},c),originalProperties:b,originalOptions:c,startTime:$a||fb(),duration:c.duration,tweens:[],createTween:function(b,c){var d=m.Tween(a,j.opts,b,c,j.opts.specialEasing[b]||j.opts.easing);return j.tweens.push(d),d},stop:function(b){var c=0,d=b?j.tweens.length:0;if(e)return this;for(e=!0;d>c;c++)j.tweens[c].run(1);return b?h.resolveWith(a,[j,b]):h.rejectWith(a,[j,b]),this}}),k=j.props;for(jb(k,j.opts.specialEasing);g>f;f++)if(d=db[f].call(j,a,k,j.opts))return d;return m.map(k,hb,j),m.isFunction(j.opts.start)&&j.opts.start.call(a,j),m.fx.timer(m.extend(i,{elem:a,anim:j,queue:j.opts.queue})),j.progress(j.opts.progress).done(j.opts.done,j.opts.complete).fail(j.opts.fail).always(j.opts.always)}m.Animation=m.extend(kb,{tweener:function(a,b){m.isFunction(a)?(b=a,a=["*"]):a=a.split(" ");for(var c,d=0,e=a.length;e>d;d++)c=a[d],eb[c]=eb[c]||[],eb[c].unshift(b)},prefilter:function(a,b){b?db.unshift(a):db.push(a)}}),m.speed=function(a,b,c){var d=a&&"object"==typeof a?m.extend({},a):{complete:c||!c&&b||m.isFunction(a)&&a,duration:a,easing:c&&b||b&&!m.isFunction(b)&&b};return d.duration=m.fx.off?0:"number"==typeof d.duration?d.duration:d.duration in m.fx.speeds?m.fx.speeds[d.duration]:m.fx.speeds._default,(null==d.queue||d.queue===!0)&&(d.queue="fx"),d.old=d.complete,d.complete=function(){m.isFunction(d.old)&&d.old.call(this),d.queue&&m.dequeue(this,d.queue)},d},m.fn.extend({fadeTo:function(a,b,c,d){return this.filter(U).css("opacity",0).show().end().animate({opacity:b},a,c,d)},animate:function(a,b,c,d){var e=m.isEmptyObject(a),f=m.speed(b,c,d),g=function(){var b=kb(this,m.extend({},a),f);(e||m._data(this,"finish"))&&b.stop(!0)};return g.finish=g,e||f.queue===!1?this.each(g):this.queue(f.queue,g)},stop:function(a,b,c){var d=function(a){var b=a.stop;delete a.stop,b(c)};return"string"!=typeof a&&(c=b,b=a,a=void 0),b&&a!==!1&&this.queue(a||"fx",[]),this.each(function(){var b=!0,e=null!=a&&a+"queueHooks",f=m.timers,g=m._data(this);if(e)g[e]&&g[e].stop&&d(g[e]);else for(e in g)g[e]&&g[e].stop&&cb.test(e)&&d(g[e]);for(e=f.length;e--;)f[e].elem!==this||null!=a&&f[e].queue!==a||(f[e].anim.stop(c),b=!1,f.splice(e,1));(b||!c)&&m.dequeue(this,a)})},finish:function(a){return a!==!1&&(a=a||"fx"),this.each(function(){var b,c=m._data(this),d=c[a+"queue"],e=c[a+"queueHooks"],f=m.timers,g=d?d.length:0;for(c.finish=!0,m.queue(this,a,[]),e&&e.stop&&e.stop.call(this,!0),b=f.length;b--;)f[b].elem===this&&f[b].queue===a&&(f[b].anim.stop(!0),f.splice(b,1));for(b=0;g>b;b++)d[b]&&d[b].finish&&d[b].finish.call(this);delete c.finish})}}),m.each(["toggle","show","hide"],function(a,b){var c=m.fn[b];m.fn[b]=function(a,d,e){return null==a||"boolean"==typeof a?c.apply(this,arguments):this.animate(gb(b,!0),a,d,e)}}),m.each({slideDown:gb("show"),slideUp:gb("hide"),slideToggle:gb("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(a,b){m.fn[a]=function(a,c,d){return this.animate(b,a,c,d)}}),m.timers=[],m.fx.tick=function(){var a,b=m.timers,c=0;for($a=m.now();c<b.length;c++)a=b[c],a()||b[c]!==a||b.splice(c--,1);b.length||m.fx.stop(),$a=void 0},m.fx.timer=function(a){m.timers.push(a),a()?m.fx.start():m.timers.pop()},m.fx.interval=13,m.fx.start=function(){_a||(_a=setInterval(m.fx.tick,m.fx.interval))},m.fx.stop=function(){clearInterval(_a),_a=null},m.fx.speeds={slow:600,fast:200,_default:400},m.fn.delay=function(a,b){return a=m.fx?m.fx.speeds[a]||a:a,b=b||"fx",this.queue(b,function(b,c){var d=setTimeout(b,a);c.stop=function(){clearTimeout(d)}})},function(){var a,b,c,d,e;b=y.createElement("div"),b.setAttribute("className","t"),b.innerHTML="  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>",d=b.getElementsByTagName("a")[0],c=y.createElement("select"),e=c.appendChild(y.createElement("option")),a=b.getElementsByTagName("input")[0],d.style.cssText="top:1px",k.getSetAttribute="t"!==b.className,k.style=/top/.test(d.getAttribute("style")),k.hrefNormalized="/a"===d.getAttribute("href"),k.checkOn=!!a.value,k.optSelected=e.selected,k.enctype=!!y.createElement("form").enctype,c.disabled=!0,k.optDisabled=!e.disabled,a=y.createElement("input"),a.setAttribute("value",""),k.input=""===a.getAttribute("value"),a.value="t",a.setAttribute("type","radio"),k.radioValue="t"===a.value}();var lb=/\r/g;m.fn.extend({val:function(a){var b,c,d,e=this[0];{if(arguments.length)return d=m.isFunction(a),this.each(function(c){var e;1===this.nodeType&&(e=d?a.call(this,c,m(this).val()):a,null==e?e="":"number"==typeof e?e+="":m.isArray(e)&&(e=m.map(e,function(a){return null==a?"":a+""})),b=m.valHooks[this.type]||m.valHooks[this.nodeName.toLowerCase()],b&&"set"in b&&void 0!==b.set(this,e,"value")||(this.value=e))});if(e)return b=m.valHooks[e.type]||m.valHooks[e.nodeName.toLowerCase()],b&&"get"in b&&void 0!==(c=b.get(e,"value"))?c:(c=e.value,"string"==typeof c?c.replace(lb,""):null==c?"":c)}}}),m.extend({valHooks:{option:{get:function(a){var b=m.find.attr(a,"value");return null!=b?b:m.trim(m.text(a))}},select:{get:function(a){for(var b,c,d=a.options,e=a.selectedIndex,f="select-one"===a.type||0>e,g=f?null:[],h=f?e+1:d.length,i=0>e?h:f?e:0;h>i;i++)if(c=d[i],!(!c.selected&&i!==e||(k.optDisabled?c.disabled:null!==c.getAttribute("disabled"))||c.parentNode.disabled&&m.nodeName(c.parentNode,"optgroup"))){if(b=m(c).val(),f)return b;g.push(b)}return g},set:function(a,b){var c,d,e=a.options,f=m.makeArray(b),g=e.length;while(g--)if(d=e[g],m.inArray(m.valHooks.option.get(d),f)>=0)try{d.selected=c=!0}catch(h){d.scrollHeight}else d.selected=!1;return c||(a.selectedIndex=-1),e}}}}),m.each(["radio","checkbox"],function(){m.valHooks[this]={set:function(a,b){return m.isArray(b)?a.checked=m.inArray(m(a).val(),b)>=0:void 0}},k.checkOn||(m.valHooks[this].get=function(a){return null===a.getAttribute("value")?"on":a.value})});var mb,nb,ob=m.expr.attrHandle,pb=/^(?:checked|selected)$/i,qb=k.getSetAttribute,rb=k.input;m.fn.extend({attr:function(a,b){return V(this,m.attr,a,b,arguments.length>1)},removeAttr:function(a){return this.each(function(){m.removeAttr(this,a)})}}),m.extend({attr:function(a,b,c){var d,e,f=a.nodeType;if(a&&3!==f&&8!==f&&2!==f)return typeof a.getAttribute===K?m.prop(a,b,c):(1===f&&m.isXMLDoc(a)||(b=b.toLowerCase(),d=m.attrHooks[b]||(m.expr.match.bool.test(b)?nb:mb)),void 0===c?d&&"get"in d&&null!==(e=d.get(a,b))?e:(e=m.find.attr(a,b),null==e?void 0:e):null!==c?d&&"set"in d&&void 0!==(e=d.set(a,c,b))?e:(a.setAttribute(b,c+""),c):void m.removeAttr(a,b))},removeAttr:function(a,b){var c,d,e=0,f=b&&b.match(E);if(f&&1===a.nodeType)while(c=f[e++])d=m.propFix[c]||c,m.expr.match.bool.test(c)?rb&&qb||!pb.test(c)?a[d]=!1:a[m.camelCase("default-"+c)]=a[d]=!1:m.attr(a,c,""),a.removeAttribute(qb?c:d)},attrHooks:{type:{set:function(a,b){if(!k.radioValue&&"radio"===b&&m.nodeName(a,"input")){var c=a.value;return a.setAttribute("type",b),c&&(a.value=c),b}}}}}),nb={set:function(a,b,c){return b===!1?m.removeAttr(a,c):rb&&qb||!pb.test(c)?a.setAttribute(!qb&&m.propFix[c]||c,c):a[m.camelCase("default-"+c)]=a[c]=!0,c}},m.each(m.expr.match.bool.source.match(/\w+/g),function(a,b){var c=ob[b]||m.find.attr;ob[b]=rb&&qb||!pb.test(b)?function(a,b,d){var e,f;return d||(f=ob[b],ob[b]=e,e=null!=c(a,b,d)?b.toLowerCase():null,ob[b]=f),e}:function(a,b,c){return c?void 0:a[m.camelCase("default-"+b)]?b.toLowerCase():null}}),rb&&qb||(m.attrHooks.value={set:function(a,b,c){return m.nodeName(a,"input")?void(a.defaultValue=b):mb&&mb.set(a,b,c)}}),qb||(mb={set:function(a,b,c){var d=a.getAttributeNode(c);return d||a.setAttributeNode(d=a.ownerDocument.createAttribute(c)),d.value=b+="","value"===c||b===a.getAttribute(c)?b:void 0}},ob.id=ob.name=ob.coords=function(a,b,c){var d;return c?void 0:(d=a.getAttributeNode(b))&&""!==d.value?d.value:null},m.valHooks.button={get:function(a,b){var c=a.getAttributeNode(b);return c&&c.specified?c.value:void 0},set:mb.set},m.attrHooks.contenteditable={set:function(a,b,c){mb.set(a,""===b?!1:b,c)}},m.each(["width","height"],function(a,b){m.attrHooks[b]={set:function(a,c){return""===c?(a.setAttribute(b,"auto"),c):void 0}}})),k.style||(m.attrHooks.style={get:function(a){return a.style.cssText||void 0},set:function(a,b){return a.style.cssText=b+""}});var sb=/^(?:input|select|textarea|button|object)$/i,tb=/^(?:a|area)$/i;m.fn.extend({prop:function(a,b){return V(this,m.prop,a,b,arguments.length>1)},removeProp:function(a){return a=m.propFix[a]||a,this.each(function(){try{this[a]=void 0,delete this[a]}catch(b){}})}}),m.extend({propFix:{"for":"htmlFor","class":"className"},prop:function(a,b,c){var d,e,f,g=a.nodeType;if(a&&3!==g&&8!==g&&2!==g)return f=1!==g||!m.isXMLDoc(a),f&&(b=m.propFix[b]||b,e=m.propHooks[b]),void 0!==c?e&&"set"in e&&void 0!==(d=e.set(a,c,b))?d:a[b]=c:e&&"get"in e&&null!==(d=e.get(a,b))?d:a[b]},propHooks:{tabIndex:{get:function(a){var b=m.find.attr(a,"tabindex");return b?parseInt(b,10):sb.test(a.nodeName)||tb.test(a.nodeName)&&a.href?0:-1}}}}),k.hrefNormalized||m.each(["href","src"],function(a,b){m.propHooks[b]={get:function(a){return a.getAttribute(b,4)}}}),k.optSelected||(m.propHooks.selected={get:function(a){var b=a.parentNode;return b&&(b.selectedIndex,b.parentNode&&b.parentNode.selectedIndex),null}}),m.each(["tabIndex","readOnly","maxLength","cellSpacing","cellPadding","rowSpan","colSpan","useMap","frameBorder","contentEditable"],function(){m.propFix[this.toLowerCase()]=this}),k.enctype||(m.propFix.enctype="encoding");var ub=/[\t\r\n\f]/g;m.fn.extend({addClass:function(a){var b,c,d,e,f,g,h=0,i=this.length,j="string"==typeof a&&a;if(m.isFunction(a))return this.each(function(b){m(this).addClass(a.call(this,b,this.className))});if(j)for(b=(a||"").match(E)||[];i>h;h++)if(c=this[h],d=1===c.nodeType&&(c.className?(" "+c.className+" ").replace(ub," "):" ")){f=0;while(e=b[f++])d.indexOf(" "+e+" ")<0&&(d+=e+" ");g=m.trim(d),c.className!==g&&(c.className=g)}return this},removeClass:function(a){var b,c,d,e,f,g,h=0,i=this.length,j=0===arguments.length||"string"==typeof a&&a;if(m.isFunction(a))return this.each(function(b){m(this).removeClass(a.call(this,b,this.className))});if(j)for(b=(a||"").match(E)||[];i>h;h++)if(c=this[h],d=1===c.nodeType&&(c.className?(" "+c.className+" ").replace(ub," "):"")){f=0;while(e=b[f++])while(d.indexOf(" "+e+" ")>=0)d=d.replace(" "+e+" "," ");g=a?m.trim(d):"",c.className!==g&&(c.className=g)}return this},toggleClass:function(a,b){var c=typeof a;return"boolean"==typeof b&&"string"===c?b?this.addClass(a):this.removeClass(a):this.each(m.isFunction(a)?function(c){m(this).toggleClass(a.call(this,c,this.className,b),b)}:function(){if("string"===c){var b,d=0,e=m(this),f=a.match(E)||[];while(b=f[d++])e.hasClass(b)?e.removeClass(b):e.addClass(b)}else(c===K||"boolean"===c)&&(this.className&&m._data(this,"__className__",this.className),this.className=this.className||a===!1?"":m._data(this,"__className__")||"")})},hasClass:function(a){for(var b=" "+a+" ",c=0,d=this.length;d>c;c++)if(1===this[c].nodeType&&(" "+this[c].className+" ").replace(ub," ").indexOf(b)>=0)return!0;return!1}}),m.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(a,b){m.fn[b]=function(a,c){return arguments.length>0?this.on(b,null,a,c):this.trigger(b)}}),m.fn.extend({hover:function(a,b){return this.mouseenter(a).mouseleave(b||a)},bind:function(a,b,c){return this.on(a,null,b,c)},unbind:function(a,b){return this.off(a,null,b)},delegate:function(a,b,c,d){return this.on(b,a,c,d)},undelegate:function(a,b,c){return 1===arguments.length?this.off(a,"**"):this.off(b,a||"**",c)}});var vb=m.now(),wb=/\?/,xb=/(,)|(\[|{)|(}|])|"(?:[^"\\\r\n]|\\["\\\/bfnrt]|\\u[\da-fA-F]{4})*"\s*:?|true|false|null|-?(?!0\d)\d+(?:\.\d+|)(?:[eE][+-]?\d+|)/g;m.parseJSON=function(b){if(a.JSON&&a.JSON.parse)return a.JSON.parse(b+"");var c,d=null,e=m.trim(b+"");return e&&!m.trim(e.replace(xb,function(a,b,e,f){return c&&b&&(d=0),0===d?a:(c=e||b,d+=!f-!e,"")}))?Function("return "+e)():m.error("Invalid JSON: "+b)},m.parseXML=function(b){var c,d;if(!b||"string"!=typeof b)return null;try{a.DOMParser?(d=new DOMParser,c=d.parseFromString(b,"text/xml")):(c=new ActiveXObject("Microsoft.XMLDOM"),c.async="false",c.loadXML(b))}catch(e){c=void 0}return c&&c.documentElement&&!c.getElementsByTagName("parsererror").length||m.error("Invalid XML: "+b),c};var yb,zb,Ab=/#.*$/,Bb=/([?&])_=[^&]*/,Cb=/^(.*?):[ \t]*([^\r\n]*)\r?$/gm,Db=/^(?:about|app|app-storage|.+-extension|file|res|widget):$/,Eb=/^(?:GET|HEAD)$/,Fb=/^\/\//,Gb=/^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/,Hb={},Ib={},Jb="*/".concat("*");try{zb=location.href}catch(Kb){zb=y.createElement("a"),zb.href="",zb=zb.href}yb=Gb.exec(zb.toLowerCase())||[];function Lb(a){return function(b,c){"string"!=typeof b&&(c=b,b="*");var d,e=0,f=b.toLowerCase().match(E)||[];if(m.isFunction(c))while(d=f[e++])"+"===d.charAt(0)?(d=d.slice(1)||"*",(a[d]=a[d]||[]).unshift(c)):(a[d]=a[d]||[]).push(c)}}function Mb(a,b,c,d){var e={},f=a===Ib;function g(h){var i;return e[h]=!0,m.each(a[h]||[],function(a,h){var j=h(b,c,d);return"string"!=typeof j||f||e[j]?f?!(i=j):void 0:(b.dataTypes.unshift(j),g(j),!1)}),i}return g(b.dataTypes[0])||!e["*"]&&g("*")}function Nb(a,b){var c,d,e=m.ajaxSettings.flatOptions||{};for(d in b)void 0!==b[d]&&((e[d]?a:c||(c={}))[d]=b[d]);return c&&m.extend(!0,a,c),a}function Ob(a,b,c){var d,e,f,g,h=a.contents,i=a.dataTypes;while("*"===i[0])i.shift(),void 0===e&&(e=a.mimeType||b.getResponseHeader("Content-Type"));if(e)for(g in h)if(h[g]&&h[g].test(e)){i.unshift(g);break}if(i[0]in c)f=i[0];else{for(g in c){if(!i[0]||a.converters[g+" "+i[0]]){f=g;break}d||(d=g)}f=f||d}return f?(f!==i[0]&&i.unshift(f),c[f]):void 0}function Pb(a,b,c,d){var e,f,g,h,i,j={},k=a.dataTypes.slice();if(k[1])for(g in a.converters)j[g.toLowerCase()]=a.converters[g];f=k.shift();while(f)if(a.responseFields[f]&&(c[a.responseFields[f]]=b),!i&&d&&a.dataFilter&&(b=a.dataFilter(b,a.dataType)),i=f,f=k.shift())if("*"===f)f=i;else if("*"!==i&&i!==f){if(g=j[i+" "+f]||j["* "+f],!g)for(e in j)if(h=e.split(" "),h[1]===f&&(g=j[i+" "+h[0]]||j["* "+h[0]])){g===!0?g=j[e]:j[e]!==!0&&(f=h[0],k.unshift(h[1]));break}if(g!==!0)if(g&&a["throws"])b=g(b);else try{b=g(b)}catch(l){return{state:"parsererror",error:g?l:"No conversion from "+i+" to "+f}}}return{state:"success",data:b}}m.extend({active:0,lastModified:{},etag:{},ajaxSettings:{url:zb,type:"GET",isLocal:Db.test(yb[1]),global:!0,processData:!0,async:!0,contentType:"application/x-www-form-urlencoded; charset=UTF-8",accepts:{"*":Jb,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText",json:"responseJSON"},converters:{"* text":String,"text html":!0,"text json":m.parseJSON,"text xml":m.parseXML},flatOptions:{url:!0,context:!0}},ajaxSetup:function(a,b){return b?Nb(Nb(a,m.ajaxSettings),b):Nb(m.ajaxSettings,a)},ajaxPrefilter:Lb(Hb),ajaxTransport:Lb(Ib),ajax:function(a,b){"object"==typeof a&&(b=a,a=void 0),b=b||{};var c,d,e,f,g,h,i,j,k=m.ajaxSetup({},b),l=k.context||k,n=k.context&&(l.nodeType||l.jquery)?m(l):m.event,o=m.Deferred(),p=m.Callbacks("once memory"),q=k.statusCode||{},r={},s={},t=0,u="canceled",v={readyState:0,getResponseHeader:function(a){var b;if(2===t){if(!j){j={};while(b=Cb.exec(f))j[b[1].toLowerCase()]=b[2]}b=j[a.toLowerCase()]}return null==b?null:b},getAllResponseHeaders:function(){return 2===t?f:null},setRequestHeader:function(a,b){var c=a.toLowerCase();return t||(a=s[c]=s[c]||a,r[a]=b),this},overrideMimeType:function(a){return t||(k.mimeType=a),this},statusCode:function(a){var b;if(a)if(2>t)for(b in a)q[b]=[q[b],a[b]];else v.always(a[v.status]);return this},abort:function(a){var b=a||u;return i&&i.abort(b),x(0,b),this}};if(o.promise(v).complete=p.add,v.success=v.done,v.error=v.fail,k.url=((a||k.url||zb)+"").replace(Ab,"").replace(Fb,yb[1]+"//"),k.type=b.method||b.type||k.method||k.type,k.dataTypes=m.trim(k.dataType||"*").toLowerCase().match(E)||[""],null==k.crossDomain&&(c=Gb.exec(k.url.toLowerCase()),k.crossDomain=!(!c||c[1]===yb[1]&&c[2]===yb[2]&&(c[3]||("http:"===c[1]?"80":"443"))===(yb[3]||("http:"===yb[1]?"80":"443")))),k.data&&k.processData&&"string"!=typeof k.data&&(k.data=m.param(k.data,k.traditional)),Mb(Hb,k,b,v),2===t)return v;h=m.event&&k.global,h&&0===m.active++&&m.event.trigger("ajaxStart"),k.type=k.type.toUpperCase(),k.hasContent=!Eb.test(k.type),e=k.url,k.hasContent||(k.data&&(e=k.url+=(wb.test(e)?"&":"?")+k.data,delete k.data),k.cache===!1&&(k.url=Bb.test(e)?e.replace(Bb,"$1_="+vb++):e+(wb.test(e)?"&":"?")+"_="+vb++)),k.ifModified&&(m.lastModified[e]&&v.setRequestHeader("If-Modified-Since",m.lastModified[e]),m.etag[e]&&v.setRequestHeader("If-None-Match",m.etag[e])),(k.data&&k.hasContent&&k.contentType!==!1||b.contentType)&&v.setRequestHeader("Content-Type",k.contentType),v.setRequestHeader("Accept",k.dataTypes[0]&&k.accepts[k.dataTypes[0]]?k.accepts[k.dataTypes[0]]+("*"!==k.dataTypes[0]?", "+Jb+"; q=0.01":""):k.accepts["*"]);for(d in k.headers)v.setRequestHeader(d,k.headers[d]);if(k.beforeSend&&(k.beforeSend.call(l,v,k)===!1||2===t))return v.abort();u="abort";for(d in{success:1,error:1,complete:1})v[d](k[d]);if(i=Mb(Ib,k,b,v)){v.readyState=1,h&&n.trigger("ajaxSend",[v,k]),k.async&&k.timeout>0&&(g=setTimeout(function(){v.abort("timeout")},k.timeout));try{t=1,i.send(r,x)}catch(w){if(!(2>t))throw w;x(-1,w)}}else x(-1,"No Transport");function x(a,b,c,d){var j,r,s,u,w,x=b;2!==t&&(t=2,g&&clearTimeout(g),i=void 0,f=d||"",v.readyState=a>0?4:0,j=a>=200&&300>a||304===a,c&&(u=Ob(k,v,c)),u=Pb(k,u,v,j),j?(k.ifModified&&(w=v.getResponseHeader("Last-Modified"),w&&(m.lastModified[e]=w),w=v.getResponseHeader("etag"),w&&(m.etag[e]=w)),204===a||"HEAD"===k.type?x="nocontent":304===a?x="notmodified":(x=u.state,r=u.data,s=u.error,j=!s)):(s=x,(a||!x)&&(x="error",0>a&&(a=0))),v.status=a,v.statusText=(b||x)+"",j?o.resolveWith(l,[r,x,v]):o.rejectWith(l,[v,x,s]),v.statusCode(q),q=void 0,h&&n.trigger(j?"ajaxSuccess":"ajaxError",[v,k,j?r:s]),p.fireWith(l,[v,x]),h&&(n.trigger("ajaxComplete",[v,k]),--m.active||m.event.trigger("ajaxStop")))}return v},getJSON:function(a,b,c){return m.get(a,b,c,"json")},getScript:function(a,b){return m.get(a,void 0,b,"script")}}),m.each(["get","post"],function(a,b){m[b]=function(a,c,d,e){return m.isFunction(c)&&(e=e||d,d=c,c=void 0),m.ajax({url:a,type:b,dataType:e,data:c,success:d})}}),m._evalUrl=function(a){return m.ajax({url:a,type:"GET",dataType:"script",async:!1,global:!1,"throws":!0})},m.fn.extend({wrapAll:function(a){if(m.isFunction(a))return this.each(function(b){m(this).wrapAll(a.call(this,b))});if(this[0]){var b=m(a,this[0].ownerDocument).eq(0).clone(!0);this[0].parentNode&&b.insertBefore(this[0]),b.map(function(){var a=this;while(a.firstChild&&1===a.firstChild.nodeType)a=a.firstChild;return a}).append(this)}return this},wrapInner:function(a){return this.each(m.isFunction(a)?function(b){m(this).wrapInner(a.call(this,b))}:function(){var b=m(this),c=b.contents();c.length?c.wrapAll(a):b.append(a)})},wrap:function(a){var b=m.isFunction(a);return this.each(function(c){m(this).wrapAll(b?a.call(this,c):a)})},unwrap:function(){return this.parent().each(function(){m.nodeName(this,"body")||m(this).replaceWith(this.childNodes)}).end()}}),m.expr.filters.hidden=function(a){return a.offsetWidth<=0&&a.offsetHeight<=0||!k.reliableHiddenOffsets()&&"none"===(a.style&&a.style.display||m.css(a,"display"))},m.expr.filters.visible=function(a){return!m.expr.filters.hidden(a)};var Qb=/%20/g,Rb=/\[\]$/,Sb=/\r?\n/g,Tb=/^(?:submit|button|image|reset|file)$/i,Ub=/^(?:input|select|textarea|keygen)/i;function Vb(a,b,c,d){var e;if(m.isArray(b))m.each(b,function(b,e){c||Rb.test(a)?d(a,e):Vb(a+"["+("object"==typeof e?b:"")+"]",e,c,d)});else if(c||"object"!==m.type(b))d(a,b);else for(e in b)Vb(a+"["+e+"]",b[e],c,d)}m.param=function(a,b){var c,d=[],e=function(a,b){b=m.isFunction(b)?b():null==b?"":b,d[d.length]=encodeURIComponent(a)+"="+encodeURIComponent(b)};if(void 0===b&&(b=m.ajaxSettings&&m.ajaxSettings.traditional),m.isArray(a)||a.jquery&&!m.isPlainObject(a))m.each(a,function(){e(this.name,this.value)});else for(c in a)Vb(c,a[c],b,e);return d.join("&").replace(Qb,"+")},m.fn.extend({serialize:function(){return m.param(this.serializeArray())},serializeArray:function(){return this.map(function(){var a=m.prop(this,"elements");return a?m.makeArray(a):this}).filter(function(){var a=this.type;return this.name&&!m(this).is(":disabled")&&Ub.test(this.nodeName)&&!Tb.test(a)&&(this.checked||!W.test(a))}).map(function(a,b){var c=m(this).val();return null==c?null:m.isArray(c)?m.map(c,function(a){return{name:b.name,value:a.replace(Sb,"\r\n")}}):{name:b.name,value:c.replace(Sb,"\r\n")}}).get()}}),m.ajaxSettings.xhr=void 0!==a.ActiveXObject?function(){return!this.isLocal&&/^(get|post|head|put|delete|options)$/i.test(this.type)&&Zb()||$b()}:Zb;var Wb=0,Xb={},Yb=m.ajaxSettings.xhr();a.attachEvent&&a.attachEvent("onunload",function(){for(var a in Xb)Xb[a](void 0,!0)}),k.cors=!!Yb&&"withCredentials"in Yb,Yb=k.ajax=!!Yb,Yb&&m.ajaxTransport(function(a){if(!a.crossDomain||k.cors){var b;return{send:function(c,d){var e,f=a.xhr(),g=++Wb;if(f.open(a.type,a.url,a.async,a.username,a.password),a.xhrFields)for(e in a.xhrFields)f[e]=a.xhrFields[e];a.mimeType&&f.overrideMimeType&&f.overrideMimeType(a.mimeType),a.crossDomain||c["X-Requested-With"]||(c["X-Requested-With"]="XMLHttpRequest");for(e in c)void 0!==c[e]&&f.setRequestHeader(e,c[e]+"");f.send(a.hasContent&&a.data||null),b=function(c,e){var h,i,j;if(b&&(e||4===f.readyState))if(delete Xb[g],b=void 0,f.onreadystatechange=m.noop,e)4!==f.readyState&&f.abort();else{j={},h=f.status,"string"==typeof f.responseText&&(j.text=f.responseText);try{i=f.statusText}catch(k){i=""}h||!a.isLocal||a.crossDomain?1223===h&&(h=204):h=j.text?200:404}j&&d(h,i,j,f.getAllResponseHeaders())},a.async?4===f.readyState?setTimeout(b):f.onreadystatechange=Xb[g]=b:b()},abort:function(){b&&b(void 0,!0)}}}});function Zb(){try{return new a.XMLHttpRequest}catch(b){}}function $b(){try{return new a.ActiveXObject("Microsoft.XMLHTTP")}catch(b){}}m.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/(?:java|ecma)script/},converters:{"text script":function(a){return m.globalEval(a),a}}}),m.ajaxPrefilter("script",function(a){void 0===a.cache&&(a.cache=!1),a.crossDomain&&(a.type="GET",a.global=!1)}),m.ajaxTransport("script",function(a){if(a.crossDomain){var b,c=y.head||m("head")[0]||y.documentElement;return{send:function(d,e){b=y.createElement("script"),b.async=!0,a.scriptCharset&&(b.charset=a.scriptCharset),b.src=a.url,b.onload=b.onreadystatechange=function(a,c){(c||!b.readyState||/loaded|complete/.test(b.readyState))&&(b.onload=b.onreadystatechange=null,b.parentNode&&b.parentNode.removeChild(b),b=null,c||e(200,"success"))},c.insertBefore(b,c.firstChild)},abort:function(){b&&b.onload(void 0,!0)}}}});var _b=[],ac=/(=)\?(?=&|$)|\?\?/;m.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var a=_b.pop()||m.expando+"_"+vb++;return this[a]=!0,a}}),m.ajaxPrefilter("json jsonp",function(b,c,d){var e,f,g,h=b.jsonp!==!1&&(ac.test(b.url)?"url":"string"==typeof b.data&&!(b.contentType||"").indexOf("application/x-www-form-urlencoded")&&ac.test(b.data)&&"data");return h||"jsonp"===b.dataTypes[0]?(e=b.jsonpCallback=m.isFunction(b.jsonpCallback)?b.jsonpCallback():b.jsonpCallback,h?b[h]=b[h].replace(ac,"$1"+e):b.jsonp!==!1&&(b.url+=(wb.test(b.url)?"&":"?")+b.jsonp+"="+e),b.converters["script json"]=function(){return g||m.error(e+" was not called"),g[0]},b.dataTypes[0]="json",f=a[e],a[e]=function(){g=arguments},d.always(function(){a[e]=f,b[e]&&(b.jsonpCallback=c.jsonpCallback,_b.push(e)),g&&m.isFunction(f)&&f(g[0]),g=f=void 0}),"script"):void 0}),m.parseHTML=function(a,b,c){if(!a||"string"!=typeof a)return null;"boolean"==typeof b&&(c=b,b=!1),b=b||y;var d=u.exec(a),e=!c&&[];return d?[b.createElement(d[1])]:(d=m.buildFragment([a],b,e),e&&e.length&&m(e).remove(),m.merge([],d.childNodes))};var bc=m.fn.load;m.fn.load=function(a,b,c){if("string"!=typeof a&&bc)return bc.apply(this,arguments);var d,e,f,g=this,h=a.indexOf(" ");return h>=0&&(d=m.trim(a.slice(h,a.length)),a=a.slice(0,h)),m.isFunction(b)?(c=b,b=void 0):b&&"object"==typeof b&&(f="POST"),g.length>0&&m.ajax({url:a,type:f,dataType:"html",data:b}).done(function(a){e=arguments,g.html(d?m("<div>").append(m.parseHTML(a)).find(d):a)}).complete(c&&function(a,b){g.each(c,e||[a.responseText,b,a])}),this},m.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(a,b){m.fn[b]=function(a){return this.on(b,a)}}),m.expr.filters.animated=function(a){return m.grep(m.timers,function(b){return a===b.elem}).length};var cc=a.document.documentElement;function dc(a){return m.isWindow(a)?a:9===a.nodeType?a.defaultView||a.parentWindow:!1}m.offset={setOffset:function(a,b,c){var d,e,f,g,h,i,j,k=m.css(a,"position"),l=m(a),n={};"static"===k&&(a.style.position="relative"),h=l.offset(),f=m.css(a,"top"),i=m.css(a,"left"),j=("absolute"===k||"fixed"===k)&&m.inArray("auto",[f,i])>-1,j?(d=l.position(),g=d.top,e=d.left):(g=parseFloat(f)||0,e=parseFloat(i)||0),m.isFunction(b)&&(b=b.call(a,c,h)),null!=b.top&&(n.top=b.top-h.top+g),null!=b.left&&(n.left=b.left-h.left+e),"using"in b?b.using.call(a,n):l.css(n)}},m.fn.extend({offset:function(a){if(arguments.length)return void 0===a?this:this.each(function(b){m.offset.setOffset(this,a,b)});var b,c,d={top:0,left:0},e=this[0],f=e&&e.ownerDocument;if(f)return b=f.documentElement,m.contains(b,e)?(typeof e.getBoundingClientRect!==K&&(d=e.getBoundingClientRect()),c=dc(f),{top:d.top+(c.pageYOffset||b.scrollTop)-(b.clientTop||0),left:d.left+(c.pageXOffset||b.scrollLeft)-(b.clientLeft||0)}):d},position:function(){if(this[0]){var a,b,c={top:0,left:0},d=this[0];return"fixed"===m.css(d,"position")?b=d.getBoundingClientRect():(a=this.offsetParent(),b=this.offset(),m.nodeName(a[0],"html")||(c=a.offset()),c.top+=m.css(a[0],"borderTopWidth",!0),c.left+=m.css(a[0],"borderLeftWidth",!0)),{top:b.top-c.top-m.css(d,"marginTop",!0),left:b.left-c.left-m.css(d,"marginLeft",!0)}}},offsetParent:function(){return this.map(function(){var a=this.offsetParent||cc;while(a&&!m.nodeName(a,"html")&&"static"===m.css(a,"position"))a=a.offsetParent;return a||cc})}}),m.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(a,b){var c=/Y/.test(b);m.fn[a]=function(d){return V(this,function(a,d,e){var f=dc(a);return void 0===e?f?b in f?f[b]:f.document.documentElement[d]:a[d]:void(f?f.scrollTo(c?m(f).scrollLeft():e,c?e:m(f).scrollTop()):a[d]=e)},a,d,arguments.length,null)}}),m.each(["top","left"],function(a,b){m.cssHooks[b]=La(k.pixelPosition,function(a,c){return c?(c=Ja(a,b),Ha.test(c)?m(a).position()[b]+"px":c):void 0})}),m.each({Height:"height",Width:"width"},function(a,b){m.each({padding:"inner"+a,content:b,"":"outer"+a},function(c,d){m.fn[d]=function(d,e){var f=arguments.length&&(c||"boolean"!=typeof d),g=c||(d===!0||e===!0?"margin":"border");return V(this,function(b,c,d){var e;return m.isWindow(b)?b.document.documentElement["client"+a]:9===b.nodeType?(e=b.documentElement,Math.max(b.body["scroll"+a],e["scroll"+a],b.body["offset"+a],e["offset"+a],e["client"+a])):void 0===d?m.css(b,c,g):m.style(b,c,d,g)},b,f?d:void 0,f,null)}})}),m.fn.size=function(){return this.length},m.fn.andSelf=m.fn.addBack,"function"==typeof define&&define.amd&&define("jquery",[],function(){return m});var ec=a.jQuery,fc=a.$;return m.noConflict=function(b){return a.$===m&&(a.$=fc),b&&a.jQuery===m&&(a.jQuery=ec),m},typeof b===K&&(a.jQuery=a.$=m),m});
//# sourceMappingURL=jquery.min.map;
//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind,
    nativeCreate       = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.8.3';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matcher(value);
    return _.property(value);
  };
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, undefinedOnly) {
    return function(obj) {
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  var property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = property('length');
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  function createReduce(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    }

    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      // Determine the initial value if none is provided.
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      return iterator(obj, iteratee, memo, keys, index, length);
    };
  }

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      var func = isFunc ? method : value[method];
      return func == null ? func : func.apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = isArrayLike(obj) ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [], idx = 0;
    for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        if (!shallow) value = flatten(value, shallow, strict);
        var j = 0, len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(arguments, true, true, 1);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    return _.unzip(arguments);
  };

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  _.unzip = function(array) {
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Generator function to create the findIndex and findLastIndex functions
  function createPredicateIndexFinder(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  }

  // Returns the first index on an array-like that passes a predicate test
  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generator function to create the indexOf and lastIndexOf functions
  function createIndexFinder(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
            i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
            length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  }

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var args = slice.call(arguments, 2);
    var bound = function() {
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object
  // In contrast to _.map it returns an object
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys =  _.keys(obj),
          length = keys.length,
          results = {},
          currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(object, oiteratee, context) {
    var result = {}, obj = object, iteratee, keys;
    if (obj == null) return result;
    if (_.isFunction(oiteratee)) {
      keys = _.allKeys(obj);
      iteratee = optimizeCb(oiteratee, context);
    } else {
      keys = flatten(arguments, false, false, 1);
      iteratee = function(value, key, obj) { return key in obj; };
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(flatten(arguments, false, false, 1), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = property;

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null ? function(){} : function(key) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return '' + this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));

define('pat-utils',[
    "jquery"
], function($) {

    $.fn.safeClone = function () {
        var $clone = this.clone();
        // IE BUG : Placeholder text becomes actual value after deep clone on textarea
        // https://connect.microsoft.com/IE/feedback/details/781612/placeholder-text-becomes-actual-value-after-deep-clone-on-textarea
        if ($.browser.msie !== undefined && true) {
            $clone.findInclusive(':input[placeholder]').each(function(i, item) {
                var $item = $(item);
                if ($item.attr('placeholder') === $item.val()) {
                    $item.val('');
                }
            });
        }
        return $clone;
    };

    // Production steps of ECMA-262, Edition 5, 15.4.4.18
    // Reference: http://es5.github.io/#x15.4.4.18
    if (!Array.prototype.forEach) {
        Array.prototype.forEach = function(callback, thisArg) {
            var T, k;
            if (this === null) {
                throw new TypeError(' this is null or not defined');
            }
            // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
            var O = Object(this);
            // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
            // 3. Let len be ToUint32(lenValue).
            var len = O.length >>> 0;
            // 4. If IsCallable(callback) is false, throw a TypeError exception.
            // See: http://es5.github.com/#x9.11
            if (typeof callback !== "function") {
                throw new TypeError(callback + ' is not a function');
            }
            // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
            if (arguments.length > 1) {
                T = thisArg;
            }
            // 6. Let k be 0
            k = 0;
            // 7. Repeat, while k < len
            while (k < len) {
                var kValue;
                // a. Let Pk be ToString(k).
                //   This is implicit for LHS operands of the in operator
                // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
                //   This step can be combined with c
                // c. If kPresent is true, then
                if (k in O) {
                    // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
                    kValue = O[k];
                    // ii. Call the Call internal method of callback with T as the this value and
                    // argument list containing kValue, k, and O.
                    callback.call(T, kValue, k, O);
                }
                // d. Increase k by 1.
                k++;
            }
            // 8. return undefined
        };
    }

    var singleBoundJQueryPlugin = function (pattern, method, options) {
        /* This is a jQuery plugin for patterns which are invoked ONCE FOR EACH
         * matched element in the DOM.
         *
         * This is how the Mockup-type patterns behave. They are constructor
         * functions which need to be invoked once per jQuery-wrapped DOM node
         * for all DOM nodes on which the pattern applies.
         */
        var $this = this;
        $this.each(function() {
            var pat, $el = $(this);
            pat = pattern.init($el, options);
            if (method) {
                if (pat[method] === undefined) {
                    $.error("Method " + method +
                            " does not exist on jQuery." + pattern.name);
                    return false;
                }
                if (method.charAt(0) === '_') {
                    $.error("Method " + method +
                            " is private on jQuery." + pattern.name);
                    return false;
                }
                pat[method].apply(pat, [options]);
            }
        });
        return $this;
    };

    var pluralBoundJQueryPlugin = function (pattern, method, options) {
        /* This is a jQuery plugin for patterns which are invoked ONCE FOR ALL
         * matched elements in the DOM.
         *
         * This is how the vanilla Patternslib-type patterns behave. They are
         * simple objects with an init method and this method gets called once
         * with a list of jQuery-wrapped DOM nodes on which the pattern
         * applies.
         */
        var $this = this;
        if (method) {
            if (pattern[method]) {
                return pattern[method].apply($this, [$this].concat([options]));
            } else {
                $.error("Method " + method +
                        " does not exist on jQuery." + pattern.name);
            }
        } else {
            pattern.init.apply($this, [$this].concat([options]));
        }
        return $this;
    };

    var jqueryPlugin = function(pattern) {
        return function(method, options) {
            var $this = this;
            if ($this.length === 0) {
                return $this;
            }
            if (typeof method === 'object') {
                options = method;
                method = undefined;
            }
            if (typeof pattern === "function") {
                return singleBoundJQueryPlugin.call(this, pattern, method, options);
            } else {
                return pluralBoundJQueryPlugin.call(this, pattern, method, options);
            }
        };
    };

    //     Underscore.js 1.3.1
    //     (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
    //     Underscore is freely distributable under the MIT license.
    //     Portions of Underscore are inspired or borrowed from Prototype,
    //     Oliver Steele's Functional, and John Resig's Micro-Templating.
    //     For all details and documentation:
    //     http://documentcloud.github.com/underscore
    //
    // Returns a function, that, as long as it continues to be invoked, will not
    // be triggered. The function will be called after it stops being called for
    // N milliseconds.
    function debounce(func, wait) {
        var timeout;
        return function debounce_run() {
            var context = this, args = arguments;
            var later = function() {
                timeout = null;
                func.apply(context, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Is a given variable an object?
    function isObject(obj) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    }

    // Extend a given object with all the properties in passed-in object(s).
    function extend(obj) {
        if (!isObject(obj)) return obj;
        var source, prop;
        for (var i = 1, length = arguments.length; i < length; i++) {
            source = arguments[i];
            for (prop in source) {
                if (hasOwnProperty.call(source, prop)) {
                    obj[prop] = source[prop];
                }
            }
        }
        return obj;
    }
    // END: Taken from Underscore.js until here.

    function rebaseURL(base, url) {
        if (url.indexOf("://")!==-1 || url[0]==="/")
            return url;
        return base.slice(0, base.lastIndexOf("/")+1) + url;
    }

    function findLabel(input) {
        var $label;
        for (var label=input.parentNode; label && label.nodeType!==11; label=label.parentNode) {
            if (label.tagName==="LABEL") {
                return label;
            }
        }
        if (input.id) {
            $label = $("label[for=\""+input.id+"\"]");
        }
        if ($label && $label.length===0 && input.form) {
            $label = $("label[for=\""+input.name+"\"]", input.form);
        }
        if ($label && $label.length) {
            return $label[0];
        } else {
            return null;
        }
    }

    // Taken from http://stackoverflow.com/questions/123999/how-to-tell-if-a-dom-element-is-visible-in-the-current-viewport
    function elementInViewport(el) {
       var rect = el.getBoundingClientRect(),
           docEl = document.documentElement,
           vWidth = window.innerWidth || docEl.clientWidth,
           vHeight = window.innerHeight || docEl.clientHeight;

        if (rect.right<0 || rect.bottom<0 || rect.left>vWidth || rect.top>vHeight)
            return false;
        return true;
    }

    // Taken from http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
    function escapeRegExp(str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }

    function removeWildcardClass($targets, classes) {
        if (classes.indexOf("*")===-1)
            $targets.removeClass(classes);
        else {
            var matcher = classes.replace(/[\-\[\]{}()+?.,\\\^$|#\s]/g, "\\$&");
            matcher = matcher.replace(/[*]/g, ".*");
            matcher = new RegExp("^" + matcher + "$");
            $targets.filter("[class]").each(function() {
                var $this = $(this),
                    classes = $this.attr("class").split(/\s+/),
                    ok=[];
                for (var i=0; i<classes.length; i++)
                    if (!matcher.test(classes[i]))
                        ok.push(classes[i]);
                if (ok.length)
                    $this.attr("class", ok.join(" "));
                else
                    $this.removeAttr("class");
            });
        }
    }

    var transitions = {
        none: {hide: "hide", show: "show"},
        fade: {hide: "fadeOut", show: "fadeIn"},
        slide: {hide: "slideUp", show: "slideDown"}
    };

    function hideOrShow($slave, visible, options, pattern_name) {
        var duration = (options.transition==="css" || options.transition==="none") ? null : options.effect.duration;

        $slave.removeClass("visible hidden in-progress");
        var onComplete = function() {
            $slave
                .removeClass("in-progress")
                .addClass(visible ? "visible" : "hidden")
                .trigger("pat-update",
                        {pattern: pattern_name,
                         transition: "complete"});
        };
        if (!duration) {
            if (options.transition!=="css")
                $slave[visible ? "show" : "hide"]();
            onComplete();
        } else {
            var t = transitions[options.transition];
            $slave
                .addClass("in-progress")
                .trigger("pat-update",
                        {pattern: pattern_name,
                         transition: "start"});
            $slave[visible ? t.show : t.hide]({
                duration: duration,
                easing: options.effect.easing,
                complete: onComplete
            });
        }
    }

    function addURLQueryParameter(fullURL, param, value) {
        /* Using a positive lookahead (?=\=) to find the given parameter,
         * preceded by a ? or &, and followed by a = with a value after
         * than (using a non-greedy selector) and then followed by
         * a & or the end of the string.
         *
         * Taken from http://stackoverflow.com/questions/7640270/adding-modify-query-string-get-variables-in-a-url-with-javascript
         */
        var val = new RegExp('(\\?|\\&)' + param + '=.*?(?=(&|$))'),
            parts = fullURL.toString().split('#'),
            url = parts[0],
            hash = parts[1],
            qstring = /\?.+$/,
            newURL = url;
        // Check if the parameter exists
        if (val.test(url)) {
            // if it does, replace it, using the captured group
            // to determine & or ? at the beginning
            newURL = url.replace(val, '$1' + param + '=' + value);
        } else if (qstring.test(url)) {
            // otherwise, if there is a query string at all
            // add the param to the end of it
            newURL = url + '&' + param + '=' + value;
        } else {
            // if there's no query string, add one
            newURL = url + '?' + param + '=' + value;
        }
        if (hash) { newURL += '#' + hash; }
        return newURL;
    }

    var utils = {
        // pattern pimping - own module?
        jqueryPlugin: jqueryPlugin,
        debounce: debounce,
        escapeRegExp: escapeRegExp,
        isObject: isObject,
        extend: extend,
        rebaseURL: rebaseURL,
        findLabel: findLabel,
        elementInViewport: elementInViewport,
        removeWildcardClass: removeWildcardClass,
        hideOrShow: hideOrShow,
        addURLQueryParameter: addURLQueryParameter
    };
    return utils;
});

define('pat-compat',[],function() {

    // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/every (JS 1.6)
    if (!Array.prototype.every)
    {
        Array.prototype.every = function(fun /*, thisp */)
        {
            

            if (this === null)
                throw new TypeError();

            var t = Object(this);
            var len = t.length >>> 0;
            if (typeof fun !== "function")
                throw new TypeError();

            var thisp = arguments[1];
            for (var i = 0; i < len; i++)
            {
                if (i in t && !fun.call(thisp, t[i], i, t))
                    return false;
            }

            return true;
        };
    }


    // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/filter (JS 1.6)
    if (!Array.prototype.filter) {
        Array.prototype.filter = function(fun /*, thisp */) {
            

            if (this === null)
                throw new TypeError();

            var t = Object(this);
            var len = t.length >>> 0;
            if (typeof fun !== "function")
                throw new TypeError();

            var res = [];
            var thisp = arguments[1];
            for (var i = 0; i < len; i++)
            {
                if (i in t)
                {
                    var val = t[i]; // in case fun mutates this
                    if (fun.call(thisp, val, i, t))
                        res.push(val);
                }
            }

            return res;
        };
    }


    // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/forEach (JS 1.6)
    // Production steps of ECMA-262, Edition 5, 15.4.4.18
    // Reference: http://es5.github.com/#x15.4.4.18
    if ( !Array.prototype.forEach ) {

        Array.prototype.forEach = function( callback, thisArg ) {

            var T, k;

            if ( this === null ) {
                throw new TypeError( " this is null or not defined" );
            }

            // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
            var O = Object(this);

            // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
            // 3. Let len be ToUint32(lenValue).
            var len = O.length >>> 0; // Hack to convert O.length to a UInt32

            // 4. If IsCallable(callback) is false, throw a TypeError exception.
            // See: http://es5.github.com/#x9.11
            if ( {}.toString.call(callback) !== "[object Function]" ) {
                throw new TypeError( callback + " is not a function" );
            }

            // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
            if ( thisArg ) {
                T = thisArg;
            }

            // 6. Let k be 0
            k = 0;

            // 7. Repeat, while k < len
            while( k < len ) {

                var kValue;

                // a. Let Pk be ToString(k).
                //   This is implicit for LHS operands of the in operator
                // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
                //   This step can be combined with c
                // c. If kPresent is true, then
                if ( k in O ) {

                    // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
                    kValue = O[ k ];

                    // ii. Call the Call internal method of callback with T as the this value and
                    // argument list containing kValue, k, and O.
                    callback.call( T, kValue, k, O );
                }
                // d. Increase k by 1.
                k++;
            }
            // 8. return undefined
        };
    }


    // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf (JS 1.6)
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
            
            if (this === null) {
                throw new TypeError();
            }
            var t = Object(this);
            var len = t.length >>> 0;
            if (len === 0) {
                return -1;
            }
            var n = 0;
            if (arguments.length > 0) {
                n = Number(arguments[1]);
                if (n !== n) { // shortcut for verifying if it's NaN
                    n = 0;
                } else if (n !== 0 && n !== Infinity && n !== -Infinity) {
                    n = (n > 0 || -1) * Math.floor(Math.abs(n));
                }
            }
            if (n >= len) {
                return -1;
            }
            var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
            for (; k < len; k++) {
                if (k in t && t[k] === searchElement) {
                    return k;
                }
            }
            return -1;
        };
    }


    // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/lastIndexOf (JS 1.6)
    if (!Array.prototype.lastIndexOf) {
        Array.prototype.lastIndexOf = function(searchElement /*, fromIndex*/) {
            

            if (this === null)
                throw new TypeError();

            var t = Object(this);
            var len = t.length >>> 0;
            if (len === 0)
                return -1;

            var n = len;
            if (arguments.length > 1)
            {
                n = Number(arguments[1]);
                if (n !== n)
                    n = 0;
                else if (n !== 0 && n !== (1 / 0) && n !== -(1 / 0))
                    n = (n > 0 || -1) * Math.floor(Math.abs(n));
            }

            var k = n >= 0 ? Math.min(n, len - 1) : len - Math.abs(n);

            for (; k >= 0; k--)
            {
                if (k in t && t[k] === searchElement)
                    return k;
            }
            return -1;
        };
    }


    // source: https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/map (JS 1.6)
    // Production steps of ECMA-262, Edition 5, 15.4.4.19
    // Reference: http://es5.github.com/#x15.4.4.19
    if (!Array.prototype.map) {
        Array.prototype.map = function(callback, thisArg) {

            var T, A, k;

            if (this === null) {
                throw new TypeError(" this is null or not defined");
            }

            // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
            var O = Object(this);

            // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
            // 3. Let len be ToUint32(lenValue).
            var len = O.length >>> 0;

            // 4. If IsCallable(callback) is false, throw a TypeError exception.
            // See: http://es5.github.com/#x9.11
            if ({}.toString.call(callback) !== "[object Function]") {
                throw new TypeError(callback + " is not a function");
            }

            // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
            if (thisArg) {
                T = thisArg;
            }

            // 6. Let A be a new array created as if by the expression new Array(len) where Array is
            // the standard built-in constructor with that name and len is the value of len.
            A = new Array(len);

            // 7. Let k be 0
            k = 0;

            // 8. Repeat, while k < len
            while(k < len) {

                var kValue, mappedValue;

                // a. Let Pk be ToString(k).
                //   This is implicit for LHS operands of the in operator
                // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
                //   This step can be combined with c
                // c. If kPresent is true, then
                if (k in O) {

                    // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
                    kValue = O[ k ];

                    // ii. Let mappedValue be the result of calling the Call internal method of callback
                    // with T as the this value and argument list containing kValue, k, and O.
                    mappedValue = callback.call(T, kValue, k, O);

                    // iii. Call the DefineOwnProperty internal method of A with arguments
                    // Pk, Property Descriptor {Value: mappedValue, Writable: true, Enumerable: true, Configurable: true},
                    // and false.

                    // In browsers that support Object.defineProperty, use the following:
                    // Object.defineProperty(A, Pk, { value: mappedValue, writable: true, enumerable: true, configurable: true });

                    // For best browser support, use the following:
                    A[ k ] = mappedValue;
                }
                // d. Increase k by 1.
                k++;
            }

            // 9. return A
            return A;
        };
    }


    // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/Reduce (JS 1.8)
    if (!Array.prototype.reduce) {
        Array.prototype.reduce = function reduce(accumulator){
            if (this===null || this===undefined) throw new TypeError("Object is null or undefined");
            var i = 0, l = this.length >> 0, curr;

            if(typeof accumulator !== "function") // ES5 : "If IsCallable(callbackfn) is false, throw a TypeError exception."
                throw new TypeError("First argument is not callable");

            if(arguments.length < 2) {
                if (l === 0) throw new TypeError("Array length is 0 and no second argument");
                curr = this[0];
                i = 1; // start accumulating at the second element
            }
            else
                curr = arguments[1];

            while (i < l) {
                if(i in this) curr = accumulator.call(undefined, curr, this[i], i, this);
                ++i;
            }

            return curr;
        };
    }


    // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/ReduceRight (JS 1.8)
    if (!Array.prototype.reduceRight)
    {
        Array.prototype.reduceRight = function(callbackfn /*, initialValue */)
        {
            

            if (this === null)
                throw new TypeError();

            var t = Object(this);
            var len = t.length >>> 0;
            if (typeof callbackfn !== "function")
                throw new TypeError();

            // no value to return if no initial value, empty array
            if (len === 0 && arguments.length === 1)
                throw new TypeError();

            var k = len - 1;
            var accumulator;
            if (arguments.length >= 2)
            {
                accumulator = arguments[1];
            }
            else
            {
                do
                {
                    if (k in this)
                    {
                        accumulator = this[k--];
                        break;
                    }

                    // if array contains no values, no initial value to return
                    if (--k < 0)
                        throw new TypeError();
                }
                while (true);
            }

            while (k >= 0)
            {
                if (k in t)
                    accumulator = callbackfn.call(undefined, accumulator, t[k], k, t);
                k--;
            }

            return accumulator;
        };
    }


    // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/some (JS 1.6)
    if (!Array.prototype.some)
    {
        Array.prototype.some = function(fun /*, thisp */)
        {
            

            if (this === null)
                throw new TypeError();

            var t = Object(this);
            var len = t.length >>> 0;
            if (typeof fun !== "function")
                throw new TypeError();

            var thisp = arguments[1];
            for (var i = 0; i < len; i++)
            {
                if (i in t && fun.call(thisp, t[i], i, t))
                    return true;
            }

            return false;
        };
    }


    // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/isArray (JS 1.8.5)
    if (!Array.isArray) {
        Array.isArray = function (arg) {
            return Object.prototype.toString.call(arg) === "[object Array]";
        };
    }

    // source: https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/String/Trim (JS 1.8.1)
    if (!String.prototype.trim) {
        String.prototype.trim = function () {
            return this.replace(/^\s+|\s+$/g, "");
        };
    }

    // source: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Function/bind
    if (!Function.prototype.bind) {
        Function.prototype.bind = function (oThis) {
            if (typeof this !== "function") {
                // closest thing possible to the ECMAScript 5 internal IsCallable function
                throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
            }

            var aArgs = Array.prototype.slice.call(arguments, 1),
                fToBind = this,
                fNOP = function () {},
                fBound = function () {
                    return fToBind.apply(this instanceof fNOP &&
                            oThis ? this : oThis,
                            aArgs.concat(Array.prototype.slice.call(arguments)));
                };
            fNOP.prototype = this.prototype;
            fBound.prototype = new fNOP();

            return fBound;
        };
    }

    // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/keys
    if (!Object.keys) {
        Object.keys = (function () {
            var _hasOwnProperty = Object.prototype.hasOwnProperty,
            hasDontEnumBug = !({toString: null}).propertyIsEnumerable("toString"),
            dontEnums = [
            "toString",
            "toLocaleString",
            "valueOf",
            "hasOwnProperty",
            "isPrototypeOf",
            "propertyIsEnumerable",
            "constructor"
            ],
            dontEnumsLength = dontEnums.length;

            return function (obj) {
                if (typeof obj !== "object" && typeof obj !== "function" || obj === null)
                    throw new TypeError("Object.keys called on non-object");

                var result = [];
                for (var prop in obj)
                    if (_hasOwnProperty.call(obj, prop))
                        result.push(prop);

                if (hasDontEnumBug)
                    for (var i=0; i < dontEnumsLength; i++)
                        if (_hasOwnProperty.call(obj, dontEnums[i]))
                            result.push(dontEnums[i]);
                return result;
            };
        })();
    }
});

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

/*!
 * jQuery Form Plugin
 * version: 3.46.0-2013.11.21
 * Requires jQuery v1.5 or later
 * Copyright (c) 2013 M. Alsup
 * Examples and documentation at: http://malsup.com/jquery/form/
 * Project repository: https://github.com/malsup/form
 * Dual licensed under the MIT and GPL licenses.
 * https://github.com/malsup/form#copyright-and-license
 */
/*global ActiveXObject */

// AMD support
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // using AMD; register as anon module
        define('jquery.form',['jquery'], factory);
    } else {
        // no AMD; invoke directly
        factory( (typeof(jQuery) != 'undefined') ? jQuery : window.Zepto );
    }
}

(function($) {


/*
    Usage Note:
    -----------
    Do not use both ajaxSubmit and ajaxForm on the same form.  These
    functions are mutually exclusive.  Use ajaxSubmit if you want
    to bind your own submit handler to the form.  For example,

    $(document).ready(function() {
        $('#myForm').on('submit', function(e) {
            e.preventDefault(); // <-- important
            $(this).ajaxSubmit({
                target: '#output'
            });
        });
    });

    Use ajaxForm when you want the plugin to manage all the event binding
    for you.  For example,

    $(document).ready(function() {
        $('#myForm').ajaxForm({
            target: '#output'
        });
    });

    You can also use ajaxForm with delegation (requires jQuery v1.7+), so the
    form does not have to exist when you invoke ajaxForm:

    $('#myForm').ajaxForm({
        delegation: true,
        target: '#output'
    });

    When using ajaxForm, the ajaxSubmit function will be invoked for you
    at the appropriate time.
*/

/**
 * Feature detection
 */
var feature = {};
feature.fileapi = $("<input type='file'/>").get(0).files !== undefined;
feature.formdata = window.FormData !== undefined;

var hasProp = !!$.fn.prop;

// attr2 uses prop when it can but checks the return type for
// an expected string.  this accounts for the case where a form 
// contains inputs with names like "action" or "method"; in those
// cases "prop" returns the element
$.fn.attr2 = function() {
    if ( ! hasProp )
        return this.attr.apply(this, arguments);
    var val = this.prop.apply(this, arguments);
    if ( ( val && val.jquery ) || typeof val === 'string' )
        return val;
    return this.attr.apply(this, arguments);
};

/**
 * ajaxSubmit() provides a mechanism for immediately submitting
 * an HTML form using AJAX.
 */
$.fn.ajaxSubmit = function(options) {
    /*jshint scripturl:true */

    // fast fail if nothing selected (http://dev.jquery.com/ticket/2752)
    if (!this.length) {
        log('ajaxSubmit: skipping submit process - no element selected');
        return this;
    }

    var method, action, url, $form = this;

    if (typeof options == 'function') {
        options = { success: options };
    }
    else if ( options === undefined ) {
        options = {};
    }

    method = options.type || this.attr2('method');
    action = options.url  || this.attr2('action');

    url = (typeof action === 'string') ? $.trim(action) : '';
    url = url || window.location.href || '';
    if (url) {
        // clean url (don't include hash vaue)
        url = (url.match(/^([^#]+)/)||[])[1];
    }

    options = $.extend(true, {
        url:  url,
        success: $.ajaxSettings.success,
        type: method || $.ajaxSettings.type,
        iframeSrc: /^https/i.test(window.location.href || '') ? 'javascript:false' : 'about:blank'
    }, options);

    // hook for manipulating the form data before it is extracted;
    // convenient for use with rich editors like tinyMCE or FCKEditor
    var veto = {};
    this.trigger('form-pre-serialize', [this, options, veto]);
    if (veto.veto) {
        log('ajaxSubmit: submit vetoed via form-pre-serialize trigger');
        return this;
    }

    // provide opportunity to alter form data before it is serialized
    if (options.beforeSerialize && options.beforeSerialize(this, options) === false) {
        log('ajaxSubmit: submit aborted via beforeSerialize callback');
        return this;
    }

    var traditional = options.traditional;
    if ( traditional === undefined ) {
        traditional = $.ajaxSettings.traditional;
    }

    var elements = [];
    var qx, a = this.formToArray(options.semantic, elements);
    if (options.data) {
        options.extraData = options.data;
        qx = $.param(options.data, traditional);
    }

    // give pre-submit callback an opportunity to abort the submit
    if (options.beforeSubmit && options.beforeSubmit(a, this, options) === false) {
        log('ajaxSubmit: submit aborted via beforeSubmit callback');
        return this;
    }

    // fire vetoable 'validate' event
    this.trigger('form-submit-validate', [a, this, options, veto]);
    if (veto.veto) {
        log('ajaxSubmit: submit vetoed via form-submit-validate trigger');
        return this;
    }

    var q = $.param(a, traditional);
    if (qx) {
        q = ( q ? (q + '&' + qx) : qx );
    }
    if (options.type.toUpperCase() == 'GET') {
        options.url += (options.url.indexOf('?') >= 0 ? '&' : '?') + q;
        options.data = null;  // data is null for 'get'
    }
    else {
        options.data = q; // data is the query string for 'post'
    }

    var callbacks = [];
    if (options.resetForm) {
        callbacks.push(function() { $form.resetForm(); });
    }
    if (options.clearForm) {
        callbacks.push(function() { $form.clearForm(options.includeHidden); });
    }

    // perform a load on the target only if dataType is not provided
    if (!options.dataType && options.target) {
        var oldSuccess = options.success || function(){};
        callbacks.push(function(data) {
            var fn = options.replaceTarget ? 'replaceWith' : 'html';
            $(options.target)[fn](data).each(oldSuccess, arguments);
        });
    }
    else if (options.success) {
        callbacks.push(options.success);
    }

    options.success = function(data, status, xhr) { // jQuery 1.4+ passes xhr as 3rd arg
        var context = options.context || this ;    // jQuery 1.4+ supports scope context
        for (var i=0, max=callbacks.length; i < max; i++) {
            callbacks[i].apply(context, [data, status, xhr || $form, $form]);
        }
    };

    if (options.error) {
        var oldError = options.error;
        options.error = function(xhr, status, error) {
            var context = options.context || this;
            oldError.apply(context, [xhr, status, error, $form]);
        };
    }

     if (options.complete) {
        var oldComplete = options.complete;
        options.complete = function(xhr, status) {
            var context = options.context || this;
            oldComplete.apply(context, [xhr, status, $form]);
        };
    }

    // are there files to upload?

    // [value] (issue #113), also see comment:
    // https://github.com/malsup/form/commit/588306aedba1de01388032d5f42a60159eea9228#commitcomment-2180219
    var fileInputs = $('input[type=file]:enabled', this).filter(function() { return $(this).val() !== ''; });

    var hasFileInputs = fileInputs.length > 0;
    var mp = 'multipart/form-data';
    var multipart = ($form.attr('enctype') == mp || $form.attr('encoding') == mp);

    var fileAPI = feature.fileapi && feature.formdata;
    log("fileAPI :" + fileAPI);
    var shouldUseFrame = (hasFileInputs || multipart) && !fileAPI;

    var jqxhr;

    // options.iframe allows user to force iframe mode
    // 06-NOV-09: now defaulting to iframe mode if file input is detected
    if (options.iframe !== false && (options.iframe || shouldUseFrame)) {
        // hack to fix Safari hang (thanks to Tim Molendijk for this)
        // see:  http://groups.google.com/group/jquery-dev/browse_thread/thread/36395b7ab510dd5d
        if (options.closeKeepAlive) {
            $.get(options.closeKeepAlive, function() {
                jqxhr = fileUploadIframe(a);
            });
        }
        else {
            jqxhr = fileUploadIframe(a);
        }
    }
    else if ((hasFileInputs || multipart) && fileAPI) {
        jqxhr = fileUploadXhr(a);
    }
    else {
        jqxhr = $.ajax(options);
    }

    $form.removeData('jqxhr').data('jqxhr', jqxhr);

    // clear element array
    for (var k=0; k < elements.length; k++)
        elements[k] = null;

    // fire 'notify' event
    this.trigger('form-submit-notify', [this, options]);
    return this;

    // utility fn for deep serialization
    function deepSerialize(extraData){
        var serialized = $.param(extraData, options.traditional).split('&');
        var len = serialized.length;
        var result = [];
        var i, part;
        for (i=0; i < len; i++) {
            // #252; undo param space replacement
            serialized[i] = serialized[i].replace(/\+/g,' ');
            part = serialized[i].split('=');
            // #278; use array instead of object storage, favoring array serializations
            result.push([decodeURIComponent(part[0]), decodeURIComponent(part[1])]);
        }
        return result;
    }

     // XMLHttpRequest Level 2 file uploads (big hat tip to francois2metz)
    function fileUploadXhr(a) {
        var formdata = new FormData();

        for (var i=0; i < a.length; i++) {
            formdata.append(a[i].name, a[i].value);
        }

        if (options.extraData) {
            var serializedData = deepSerialize(options.extraData);
            for (i=0; i < serializedData.length; i++)
                if (serializedData[i])
                    formdata.append(serializedData[i][0], serializedData[i][1]);
        }

        options.data = null;

        var s = $.extend(true, {}, $.ajaxSettings, options, {
            contentType: false,
            processData: false,
            cache: false,
            type: method || 'POST'
        });

        if (options.uploadProgress) {
            // workaround because jqXHR does not expose upload property
            s.xhr = function() {
                var xhr = $.ajaxSettings.xhr();
                if (xhr.upload) {
                    xhr.upload.addEventListener('progress', function(event) {
                        var percent = 0;
                        var position = event.loaded || event.position; /*event.position is deprecated*/
                        var total = event.total;
                        if (event.lengthComputable) {
                            percent = Math.ceil(position / total * 100);
                        }
                        options.uploadProgress(event, position, total, percent);
                    }, false);
                }
                return xhr;
            };
        }

        s.data = null;
        var beforeSend = s.beforeSend;
        s.beforeSend = function(xhr, o) {
            //Send FormData() provided by user
            if (options.formData)
                o.data = options.formData;
            else
                o.data = formdata;
            if(beforeSend)
                beforeSend.call(this, xhr, o);
        };
        return $.ajax(s);
    }

    // private function for handling file uploads (hat tip to YAHOO!)
    function fileUploadIframe(a) {
        var form = $form[0], el, i, s, g, id, $io, io, xhr, sub, n, timedOut, timeoutHandle;
        var deferred = $.Deferred();

        // #341
        deferred.abort = function(status) {
            xhr.abort(status);
        };

        if (a) {
            // ensure that every serialized input is still enabled
            for (i=0; i < elements.length; i++) {
                el = $(elements[i]);
                if ( hasProp )
                    el.prop('disabled', false);
                else
                    el.removeAttr('disabled');
            }
        }

        s = $.extend(true, {}, $.ajaxSettings, options);
        s.context = s.context || s;
        id = 'jqFormIO' + (new Date().getTime());
        if (s.iframeTarget) {
            $io = $(s.iframeTarget);
            n = $io.attr2('name');
            if (!n)
                 $io.attr2('name', id);
            else
                id = n;
        }
        else {
            $io = $('<iframe name="' + id + '" src="'+ s.iframeSrc +'" />');
            $io.css({ position: 'absolute', top: '-1000px', left: '-1000px' });
        }
        io = $io[0];


        xhr = { // mock object
            aborted: 0,
            responseText: null,
            responseXML: null,
            status: 0,
            statusText: 'n/a',
            getAllResponseHeaders: function() {},
            getResponseHeader: function() {},
            setRequestHeader: function() {},
            abort: function(status) {
                var e = (status === 'timeout' ? 'timeout' : 'aborted');
                log('aborting upload... ' + e);
                this.aborted = 1;

                try { // #214, #257
                    if (io.contentWindow.document.execCommand) {
                        io.contentWindow.document.execCommand('Stop');
                    }
                }
                catch(ignore) {}

                $io.attr('src', s.iframeSrc); // abort op in progress
                xhr.error = e;
                if (s.error)
                    s.error.call(s.context, xhr, e, status);
                if (g)
                    $.event.trigger("ajaxError", [xhr, s, e]);
                if (s.complete)
                    s.complete.call(s.context, xhr, e);
            }
        };

        g = s.global;
        // trigger ajax global events so that activity/block indicators work like normal
        if (g && 0 === $.active++) {
            $.event.trigger("ajaxStart");
        }
        if (g) {
            $.event.trigger("ajaxSend", [xhr, s]);
        }

        if (s.beforeSend && s.beforeSend.call(s.context, xhr, s) === false) {
            if (s.global) {
                $.active--;
            }
            deferred.reject();
            return deferred;
        }
        if (xhr.aborted) {
            deferred.reject();
            return deferred;
        }

        // add submitting element to data if we know it
        sub = form.clk;
        if (sub) {
            n = sub.name;
            if (n && !sub.disabled) {
                s.extraData = s.extraData || {};
                s.extraData[n] = sub.value;
                if (sub.type == "image") {
                    s.extraData[n+'.x'] = form.clk_x;
                    s.extraData[n+'.y'] = form.clk_y;
                }
            }
        }

        var CLIENT_TIMEOUT_ABORT = 1;
        var SERVER_ABORT = 2;
                
        function getDoc(frame) {
            /* it looks like contentWindow or contentDocument do not
             * carry the protocol property in ie8, when running under ssl
             * frame.document is the only valid response document, since
             * the protocol is know but not on the other two objects. strange?
             * "Same origin policy" http://en.wikipedia.org/wiki/Same_origin_policy
             */
            
            var doc = null;
            
            // IE8 cascading access check
            try {
                if (frame.contentWindow) {
                    doc = frame.contentWindow.document;
                }
            } catch(err) {
                // IE8 access denied under ssl & missing protocol
                log('cannot get iframe.contentWindow document: ' + err);
            }

            if (doc) { // successful getting content
                return doc;
            }

            try { // simply checking may throw in ie8 under ssl or mismatched protocol
                doc = frame.contentDocument ? frame.contentDocument : frame.document;
            } catch(err) {
                // last attempt
                log('cannot get iframe.contentDocument: ' + err);
                doc = frame.document;
            }
            return doc;
        }

        // Rails CSRF hack (thanks to Yvan Barthelemy)
        var csrf_token = $('meta[name=csrf-token]').attr('content');
        var csrf_param = $('meta[name=csrf-param]').attr('content');
        if (csrf_param && csrf_token) {
            s.extraData = s.extraData || {};
            s.extraData[csrf_param] = csrf_token;
        }

        // take a breath so that pending repaints get some cpu time before the upload starts
        function doSubmit() {
            // make sure form attrs are set
            var t = $form.attr2('target'), a = $form.attr2('action');

            // update form attrs in IE friendly way
            form.setAttribute('target',id);
            if (!method || /post/i.test(method) ) {
                form.setAttribute('method', 'POST');
            }
            if (a != s.url) {
                form.setAttribute('action', s.url);
            }

            // ie borks in some cases when setting encoding
            if (! s.skipEncodingOverride && (!method || /post/i.test(method))) {
                $form.attr({
                    encoding: 'multipart/form-data',
                    enctype:  'multipart/form-data'
                });
            }

            // support timout
            if (s.timeout) {
                timeoutHandle = setTimeout(function() { timedOut = true; cb(CLIENT_TIMEOUT_ABORT); }, s.timeout);
            }

            // look for server aborts
            function checkState() {
                try {
                    var state = getDoc(io).readyState;
                    log('state = ' + state);
                    if (state && state.toLowerCase() == 'uninitialized')
                        setTimeout(checkState,50);
                }
                catch(e) {
                    log('Server abort: ' , e, ' (', e.name, ')');
                    cb(SERVER_ABORT);
                    if (timeoutHandle)
                        clearTimeout(timeoutHandle);
                    timeoutHandle = undefined;
                }
            }

            // add "extra" data to form if provided in options
            var extraInputs = [];
            try {
                if (s.extraData) {
                    for (var n in s.extraData) {
                        if (s.extraData.hasOwnProperty(n)) {
                           // if using the $.param format that allows for multiple values with the same name
                           if($.isPlainObject(s.extraData[n]) && s.extraData[n].hasOwnProperty('name') && s.extraData[n].hasOwnProperty('value')) {
                               extraInputs.push(
                               $('<input type="hidden" name="'+s.extraData[n].name+'">').val(s.extraData[n].value)
                                   .appendTo(form)[0]);
                           } else {
                               extraInputs.push(
                               $('<input type="hidden" name="'+n+'">').val(s.extraData[n])
                                   .appendTo(form)[0]);
                           }
                        }
                    }
                }

                if (!s.iframeTarget) {
                    // add iframe to doc and submit the form
                    $io.appendTo('body');
                }
                if (io.attachEvent)
                    io.attachEvent('onload', cb);
                else
                    io.addEventListener('load', cb, false);
                setTimeout(checkState,15);

                try {
                    form.submit();
                } catch(err) {
                    // just in case form has element with name/id of 'submit'
                    var submitFn = document.createElement('form').submit;
                    submitFn.apply(form);
                }
            }
            finally {
                // reset attrs and remove "extra" input elements
                form.setAttribute('action',a);
                if(t) {
                    form.setAttribute('target', t);
                } else {
                    $form.removeAttr('target');
                }
                $(extraInputs).remove();
            }
        }

        if (s.forceSync) {
            doSubmit();
        }
        else {
            setTimeout(doSubmit, 10); // this lets dom updates render
        }

        var data, doc, domCheckCount = 50, callbackProcessed;

        function cb(e) {
            if (xhr.aborted || callbackProcessed) {
                return;
            }
            
            doc = getDoc(io);
            if(!doc) {
                log('cannot access response document');
                e = SERVER_ABORT;
            }
            if (e === CLIENT_TIMEOUT_ABORT && xhr) {
                xhr.abort('timeout');
                deferred.reject(xhr, 'timeout');
                return;
            }
            else if (e == SERVER_ABORT && xhr) {
                xhr.abort('server abort');
                deferred.reject(xhr, 'error', 'server abort');
                return;
            }

            if (!doc || doc.location.href == s.iframeSrc) {
                // response not received yet
                if (!timedOut)
                    return;
            }
            if (io.detachEvent)
                io.detachEvent('onload', cb);
            else
                io.removeEventListener('load', cb, false);

            var status = 'success', errMsg;
            try {
                if (timedOut) {
                    throw 'timeout';
                }

                var isXml = s.dataType == 'xml' || doc.XMLDocument || $.isXMLDoc(doc);
                log('isXml='+isXml);
                if (!isXml && window.opera && (doc.body === null || !doc.body.innerHTML)) {
                    if (--domCheckCount) {
                        // in some browsers (Opera) the iframe DOM is not always traversable when
                        // the onload callback fires, so we loop a bit to accommodate
                        log('requeing onLoad callback, DOM not available');
                        setTimeout(cb, 250);
                        return;
                    }
                    // let this fall through because server response could be an empty document
                    //log('Could not access iframe DOM after mutiple tries.');
                    //throw 'DOMException: not available';
                }

                //log('response detected');
                var docRoot = doc.body ? doc.body : doc.documentElement;
                xhr.responseText = docRoot ? docRoot.innerHTML : null;
                xhr.responseXML = doc.XMLDocument ? doc.XMLDocument : doc;
                if (isXml)
                    s.dataType = 'xml';
                xhr.getResponseHeader = function(header){
                    var headers = {'content-type': s.dataType};
                    return headers[header.toLowerCase()];
                };
                // support for XHR 'status' & 'statusText' emulation :
                if (docRoot) {
                    xhr.status = Number( docRoot.getAttribute('status') ) || xhr.status;
                    xhr.statusText = docRoot.getAttribute('statusText') || xhr.statusText;
                }

                var dt = (s.dataType || '').toLowerCase();
                var scr = /(json|script|text)/.test(dt);
                if (scr || s.textarea) {
                    // see if user embedded response in textarea
                    var ta = doc.getElementsByTagName('textarea')[0];
                    if (ta) {
                        xhr.responseText = ta.value;
                        // support for XHR 'status' & 'statusText' emulation :
                        xhr.status = Number( ta.getAttribute('status') ) || xhr.status;
                        xhr.statusText = ta.getAttribute('statusText') || xhr.statusText;
                    }
                    else if (scr) {
                        // account for browsers injecting pre around json response
                        var pre = doc.getElementsByTagName('pre')[0];
                        var b = doc.getElementsByTagName('body')[0];
                        if (pre) {
                            xhr.responseText = pre.textContent ? pre.textContent : pre.innerText;
                        }
                        else if (b) {
                            xhr.responseText = b.textContent ? b.textContent : b.innerText;
                        }
                    }
                }
                else if (dt == 'xml' && !xhr.responseXML && xhr.responseText) {
                    xhr.responseXML = toXml(xhr.responseText);
                }

                try {
                    data = httpData(xhr, dt, s);
                }
                catch (err) {
                    status = 'parsererror';
                    xhr.error = errMsg = (err || status);
                }
            }
            catch (err) {
                log('error caught: ',err);
                status = 'error';
                xhr.error = errMsg = (err || status);
            }

            if (xhr.aborted) {
                log('upload aborted');
                status = null;
            }

            if (xhr.status) { // we've set xhr.status
                status = (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) ? 'success' : 'error';
            }

            // ordering of these callbacks/triggers is odd, but that's how $.ajax does it
            if (status === 'success') {
                if (s.success)
                    s.success.call(s.context, data, 'success', xhr);
                deferred.resolve(xhr.responseText, 'success', xhr);
                if (g)
                    $.event.trigger("ajaxSuccess", [xhr, s]);
            }
            else if (status) {
                if (errMsg === undefined)
                    errMsg = xhr.statusText;
                if (s.error)
                    s.error.call(s.context, xhr, status, errMsg);
                deferred.reject(xhr, 'error', errMsg);
                if (g)
                    $.event.trigger("ajaxError", [xhr, s, errMsg]);
            }

            if (g)
                $.event.trigger("ajaxComplete", [xhr, s]);

            if (g && ! --$.active) {
                $.event.trigger("ajaxStop");
            }

            if (s.complete)
                s.complete.call(s.context, xhr, status);

            callbackProcessed = true;
            if (s.timeout)
                clearTimeout(timeoutHandle);

            // clean up
            setTimeout(function() {
                if (!s.iframeTarget)
                    $io.remove();
                else  //adding else to clean up existing iframe response.
                    $io.attr('src', s.iframeSrc);
                xhr.responseXML = null;
            }, 100);
        }

        var toXml = $.parseXML || function(s, doc) { // use parseXML if available (jQuery 1.5+)
            if (window.ActiveXObject) {
                doc = new ActiveXObject('Microsoft.XMLDOM');
                doc.async = 'false';
                doc.loadXML(s);
            }
            else {
                doc = (new DOMParser()).parseFromString(s, 'text/xml');
            }
            return (doc && doc.documentElement && doc.documentElement.nodeName != 'parsererror') ? doc : null;
        };
        var parseJSON = $.parseJSON || function(s) {
            /*jslint evil:true */
            return window['eval']('(' + s + ')');
        };

        var httpData = function( xhr, type, s ) { // mostly lifted from jq1.4.4

            var ct = xhr.getResponseHeader('content-type') || '',
                xml = type === 'xml' || !type && ct.indexOf('xml') >= 0,
                data = xml ? xhr.responseXML : xhr.responseText;

            if (xml && data.documentElement.nodeName === 'parsererror') {
                if ($.error)
                    $.error('parsererror');
            }
            if (s && s.dataFilter) {
                data = s.dataFilter(data, type);
            }
            if (typeof data === 'string') {
                if (type === 'json' || !type && ct.indexOf('json') >= 0) {
                    data = parseJSON(data);
                } else if (type === "script" || !type && ct.indexOf("javascript") >= 0) {
                    $.globalEval(data);
                }
            }
            return data;
        };

        return deferred;
    }
};

/**
 * ajaxForm() provides a mechanism for fully automating form submission.
 *
 * The advantages of using this method instead of ajaxSubmit() are:
 *
 * 1: This method will include coordinates for <input type="image" /> elements (if the element
 *    is used to submit the form).
 * 2. This method will include the submit element's name/value data (for the element that was
 *    used to submit the form).
 * 3. This method binds the submit() method to the form for you.
 *
 * The options argument for ajaxForm works exactly as it does for ajaxSubmit.  ajaxForm merely
 * passes the options argument along after properly binding events for submit elements and
 * the form itself.
 */
$.fn.ajaxForm = function(options) {
    options = options || {};
    options.delegation = options.delegation && $.isFunction($.fn.on);

    // in jQuery 1.3+ we can fix mistakes with the ready state
    if (!options.delegation && this.length === 0) {
        var o = { s: this.selector, c: this.context };
        if (!$.isReady && o.s) {
            log('DOM not ready, queuing ajaxForm');
            $(function() {
                $(o.s,o.c).ajaxForm(options);
            });
            return this;
        }
        // is your DOM ready?  http://docs.jquery.com/Tutorials:Introducing_$(document).ready()
        log('terminating; zero elements found by selector' + ($.isReady ? '' : ' (DOM not ready)'));
        return this;
    }

    if ( options.delegation ) {
        $(document)
            .off('submit.form-plugin', this.selector, doAjaxSubmit)
            .off('click.form-plugin', this.selector, captureSubmittingElement)
            .on('submit.form-plugin', this.selector, options, doAjaxSubmit)
            .on('click.form-plugin', this.selector, options, captureSubmittingElement);
        return this;
    }

    return this.ajaxFormUnbind()
        .bind('submit.form-plugin', options, doAjaxSubmit)
        .bind('click.form-plugin', options, captureSubmittingElement);
};

// private event handlers
function doAjaxSubmit(e) {
    /*jshint validthis:true */
    var options = e.data;
    if (!e.isDefaultPrevented()) { // if event has been canceled, don't proceed
        e.preventDefault();
        $(e.target).ajaxSubmit(options); // #365
    }
}

function captureSubmittingElement(e) {
    /*jshint validthis:true */
    var target = e.target;
    var $el = $(target);
    if (!($el.is("[type=submit],[type=image]"))) {
        // is this a child element of the submit el?  (ex: a span within a button)
        var t = $el.closest('[type=submit]');
        if (t.length === 0) {
            return;
        }
        target = t[0];
    }
    var form = this;
    form.clk = target;
    if (target.type == 'image') {
        if (e.offsetX !== undefined) {
            form.clk_x = e.offsetX;
            form.clk_y = e.offsetY;
        } else if (typeof $.fn.offset == 'function') {
            var offset = $el.offset();
            form.clk_x = e.pageX - offset.left;
            form.clk_y = e.pageY - offset.top;
        } else {
            form.clk_x = e.pageX - target.offsetLeft;
            form.clk_y = e.pageY - target.offsetTop;
        }
    }
    // clear form vars
    setTimeout(function() { form.clk = form.clk_x = form.clk_y = null; }, 100);
}


// ajaxFormUnbind unbinds the event handlers that were bound by ajaxForm
$.fn.ajaxFormUnbind = function() {
    return this.unbind('submit.form-plugin click.form-plugin');
};

/**
 * formToArray() gathers form element data into an array of objects that can
 * be passed to any of the following ajax functions: $.get, $.post, or load.
 * Each object in the array has both a 'name' and 'value' property.  An example of
 * an array for a simple login form might be:
 *
 * [ { name: 'username', value: 'jresig' }, { name: 'password', value: 'secret' } ]
 *
 * It is this array that is passed to pre-submit callback functions provided to the
 * ajaxSubmit() and ajaxForm() methods.
 */
$.fn.formToArray = function(semantic, elements) {
    var a = [];
    if (this.length === 0) {
        return a;
    }

    var form = this[0];
    var els = semantic ? form.getElementsByTagName('*') : form.elements;
    if (!els) {
        return a;
    }

    var i,j,n,v,el,max,jmax;
    for(i=0, max=els.length; i < max; i++) {
        el = els[i];
        n = el.name;
        if (!n || el.disabled) {
            continue;
        }

        if (semantic && form.clk && el.type == "image") {
            // handle image inputs on the fly when semantic == true
            if(form.clk == el) {
                a.push({name: n, value: $(el).val(), type: el.type });
                a.push({name: n+'.x', value: form.clk_x}, {name: n+'.y', value: form.clk_y});
            }
            continue;
        }

        v = $.fieldValue(el, true);
        if (v && v.constructor == Array) {
            if (elements)
                elements.push(el);
            for(j=0, jmax=v.length; j < jmax; j++) {
                a.push({name: n, value: v[j]});
            }
        }
        else if (feature.fileapi && el.type == 'file') {
            if (elements)
                elements.push(el);
            var files = el.files;
            if (files.length) {
                for (j=0; j < files.length; j++) {
                    a.push({name: n, value: files[j], type: el.type});
                }
            }
            else {
                // #180
                a.push({ name: n, value: '', type: el.type });
            }
        }
        else if (v !== null && typeof v != 'undefined') {
            if (elements)
                elements.push(el);
            a.push({name: n, value: v, type: el.type, required: el.required});
        }
    }

    if (!semantic && form.clk) {
        // input type=='image' are not found in elements array! handle it here
        var $input = $(form.clk), input = $input[0];
        n = input.name;
        if (n && !input.disabled && input.type == 'image') {
            a.push({name: n, value: $input.val()});
            a.push({name: n+'.x', value: form.clk_x}, {name: n+'.y', value: form.clk_y});
        }
    }
    return a;
};

/**
 * Serializes form data into a 'submittable' string. This method will return a string
 * in the format: name1=value1&amp;name2=value2
 */
$.fn.formSerialize = function(semantic) {
    //hand off to jQuery.param for proper encoding
    return $.param(this.formToArray(semantic));
};

/**
 * Serializes all field elements in the jQuery object into a query string.
 * This method will return a string in the format: name1=value1&amp;name2=value2
 */
$.fn.fieldSerialize = function(successful) {
    var a = [];
    this.each(function() {
        var n = this.name;
        if (!n) {
            return;
        }
        var v = $.fieldValue(this, successful);
        if (v && v.constructor == Array) {
            for (var i=0,max=v.length; i < max; i++) {
                a.push({name: n, value: v[i]});
            }
        }
        else if (v !== null && typeof v != 'undefined') {
            a.push({name: this.name, value: v});
        }
    });
    //hand off to jQuery.param for proper encoding
    return $.param(a);
};

/**
 * Returns the value(s) of the element in the matched set.  For example, consider the following form:
 *
 *  <form><fieldset>
 *      <input name="A" type="text" />
 *      <input name="A" type="text" />
 *      <input name="B" type="checkbox" value="B1" />
 *      <input name="B" type="checkbox" value="B2"/>
 *      <input name="C" type="radio" value="C1" />
 *      <input name="C" type="radio" value="C2" />
 *  </fieldset></form>
 *
 *  var v = $('input[type=text]').fieldValue();
 *  // if no values are entered into the text inputs
 *  v == ['','']
 *  // if values entered into the text inputs are 'foo' and 'bar'
 *  v == ['foo','bar']
 *
 *  var v = $('input[type=checkbox]').fieldValue();
 *  // if neither checkbox is checked
 *  v === undefined
 *  // if both checkboxes are checked
 *  v == ['B1', 'B2']
 *
 *  var v = $('input[type=radio]').fieldValue();
 *  // if neither radio is checked
 *  v === undefined
 *  // if first radio is checked
 *  v == ['C1']
 *
 * The successful argument controls whether or not the field element must be 'successful'
 * (per http://www.w3.org/TR/html4/interact/forms.html#successful-controls).
 * The default value of the successful argument is true.  If this value is false the value(s)
 * for each element is returned.
 *
 * Note: This method *always* returns an array.  If no valid value can be determined the
 *    array will be empty, otherwise it will contain one or more values.
 */
$.fn.fieldValue = function(successful) {
    for (var val=[], i=0, max=this.length; i < max; i++) {
        var el = this[i];
        var v = $.fieldValue(el, successful);
        if (v === null || typeof v == 'undefined' || (v.constructor == Array && !v.length)) {
            continue;
        }
        if (v.constructor == Array)
            $.merge(val, v);
        else
            val.push(v);
    }
    return val;
};

/**
 * Returns the value of the field element.
 */
$.fieldValue = function(el, successful) {
    var n = el.name, t = el.type, tag = el.tagName.toLowerCase();
    if (successful === undefined) {
        successful = true;
    }

    if (successful && (!n || el.disabled || t == 'reset' || t == 'button' ||
        (t == 'checkbox' || t == 'radio') && !el.checked ||
        (t == 'submit' || t == 'image') && el.form && el.form.clk != el ||
        tag == 'select' && el.selectedIndex == -1)) {
            return null;
    }

    if (tag == 'select') {
        var index = el.selectedIndex;
        if (index < 0) {
            return null;
        }
        var a = [], ops = el.options;
        var one = (t == 'select-one');
        var max = (one ? index+1 : ops.length);
        for(var i=(one ? index : 0); i < max; i++) {
            var op = ops[i];
            if (op.selected) {
                var v = op.value;
                if (!v) { // extra pain for IE...
                    v = (op.attributes && op.attributes['value'] && !(op.attributes['value'].specified)) ? op.text : op.value;
                }
                if (one) {
                    return v;
                }
                a.push(v);
            }
        }
        return a;
    }
    return $(el).val();
};

/**
 * Clears the form data.  Takes the following actions on the form's input fields:
 *  - input text fields will have their 'value' property set to the empty string
 *  - select elements will have their 'selectedIndex' property set to -1
 *  - checkbox and radio inputs will have their 'checked' property set to false
 *  - inputs of type submit, button, reset, and hidden will *not* be effected
 *  - button elements will *not* be effected
 */
$.fn.clearForm = function(includeHidden) {
    return this.each(function() {
        $('input,select,textarea', this).clearFields(includeHidden);
    });
};

/**
 * Clears the selected form elements.
 */
$.fn.clearFields = $.fn.clearInputs = function(includeHidden) {
    var re = /^(?:color|date|datetime|email|month|number|password|range|search|tel|text|time|url|week)$/i; // 'hidden' is not in this list
    return this.each(function() {
        var t = this.type, tag = this.tagName.toLowerCase();
        if (re.test(t) || tag == 'textarea') {
            this.value = '';
        }
        else if (t == 'checkbox' || t == 'radio') {
            this.checked = false;
        }
        else if (tag == 'select') {
            this.selectedIndex = -1;
        }
		else if (t == "file") {
			if (/MSIE/.test(navigator.userAgent)) {
				$(this).replaceWith($(this).clone(true));
			} else {
				$(this).val('');
			}
		}
        else if (includeHidden) {
            // includeHidden can be the value true, or it can be a selector string
            // indicating a special test; for example:
            //  $('#myForm').clearForm('.special:hidden')
            // the above would clean hidden inputs that have the class of 'special'
            if ( (includeHidden === true && /hidden/.test(t)) ||
                 (typeof includeHidden == 'string' && $(this).is(includeHidden)) )
                this.value = '';
        }
    });
};

/**
 * Resets the form data.  Causes all form elements to be reset to their original value.
 */
$.fn.resetForm = function() {
    return this.each(function() {
        // guard against an input with the name of 'reset'
        // note that IE reports the reset function as an 'object'
        if (typeof this.reset == 'function' || (typeof this.reset == 'object' && !this.reset.nodeType)) {
            this.reset();
        }
    });
};

/**
 * Enables or disables any matching elements.
 */
$.fn.enable = function(b) {
    if (b === undefined) {
        b = true;
    }
    return this.each(function() {
        this.disabled = !b;
    });
};

/**
 * Checks/unchecks any matching checkboxes or radio buttons and
 * selects/deselects and matching option elements.
 */
$.fn.selected = function(select) {
    if (select === undefined) {
        select = true;
    }
    return this.each(function() {
        var t = this.type;
        if (t == 'checkbox' || t == 'radio') {
            this.checked = select;
        }
        else if (this.tagName.toLowerCase() == 'option') {
            var $sel = $(this).parent('select');
            if (select && $sel[0] && $sel[0].type == 'select-one') {
                // deselect all other options
                $sel.find('option').selected(false);
            }
            this.selected = select;
        }
    });
};

// expose debug var
$.fn.ajaxSubmit.debug = false;

// helper fn for console logging
function log() {
    if (!$.fn.ajaxSubmit.debug)
        return;
    var msg = '[jquery.form] ' + Array.prototype.join.call(arguments,'');
    if (window.console && window.console.log) {
        window.console.log(msg);
    }
    else if (window.opera && window.opera.postError) {
        window.opera.postError(msg);
    }
}

}));


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
 */!function(a){"function"==typeof define&&define.amd?define('jquery.browser',["jquery"],function(b){return a(b)}):"object"==typeof module&&"object"==typeof module.exports?module.exports=a(require("jquery")):a(window.jQuery)}(function(a){function b(a){void 0===a&&(a=window.navigator.userAgent),a=a.toLowerCase();var b=/(edge)\/([\w.]+)/.exec(a)||/(opr)[\/]([\w.]+)/.exec(a)||/(chrome)[ \/]([\w.]+)/.exec(a)||/(version)(applewebkit)[ \/]([\w.]+).*(safari)[ \/]([\w.]+)/.exec(a)||/(webkit)[ \/]([\w.]+).*(version)[ \/]([\w.]+).*(safari)[ \/]([\w.]+)/.exec(a)||/(webkit)[ \/]([\w.]+)/.exec(a)||/(opera)(?:.*version|)[ \/]([\w.]+)/.exec(a)||/(msie) ([\w.]+)/.exec(a)||a.indexOf("trident")>=0&&/(rv)(?::| )([\w.]+)/.exec(a)||a.indexOf("compatible")<0&&/(mozilla)(?:.*? rv:([\w.]+)|)/.exec(a)||[],c=/(ipad)/.exec(a)||/(ipod)/.exec(a)||/(iphone)/.exec(a)||/(kindle)/.exec(a)||/(silk)/.exec(a)||/(android)/.exec(a)||/(windows phone)/.exec(a)||/(win)/.exec(a)||/(mac)/.exec(a)||/(linux)/.exec(a)||/(cros)/.exec(a)||/(playbook)/.exec(a)||/(bb)/.exec(a)||/(blackberry)/.exec(a)||[],d={},e={browser:b[5]||b[3]||b[1]||"",version:b[2]||b[4]||"0",versionNumber:b[4]||b[2]||"0",platform:c[0]||""};if(e.browser&&(d[e.browser]=!0,d.version=e.version,d.versionNumber=parseInt(e.versionNumber,10)),e.platform&&(d[e.platform]=!0),(d.android||d.bb||d.blackberry||d.ipad||d.iphone||d.ipod||d.kindle||d.playbook||d.silk||d["windows phone"])&&(d.mobile=!0),(d.cros||d.mac||d.linux||d.win)&&(d.desktop=!0),(d.chrome||d.opr||d.safari)&&(d.webkit=!0),d.rv||d.edge){var f="msie";e.browser=f,d[f]=!0}if(d.safari&&d.blackberry){var g="blackberry";e.browser=g,d[g]=!0}if(d.safari&&d.playbook){var h="playbook";e.browser=h,d[h]=!0}if(d.bb){var i="blackberry";e.browser=i,d[i]=!0}if(d.opr){var j="opera";e.browser=j,d[j]=!0}if(d.safari&&d.android){var k="android";e.browser=k,d[k]=!0}if(d.safari&&d.kindle){var l="kindle";e.browser=l,d[l]=!0}if(d.safari&&d.silk){var m="silk";e.browser=m,d[m]=!0}return d.name=e.browser,d.platform=e.platform,d}return window.jQBrowser=b(window.navigator.userAgent),window.jQBrowser.uaMatch=b,a&&(a.browser=window.jQBrowser),window.jQBrowser});
/*
Copyright 2012 Igor Vaynberg

Version: 3.5.1 Timestamp: Tue Jul 22 18:58:56 EDT 2014

This software is licensed under the Apache License, Version 2.0 (the "Apache License") or the GNU
General Public License version 2 (the "GPL License"). You may choose either license to govern your
use of this software only upon the condition that you accept all of the terms of either the Apache
License or the GPL License.

You may obtain a copy of the Apache License and the GPL License at:

    http://www.apache.org/licenses/LICENSE-2.0
    http://www.gnu.org/licenses/gpl-2.0.html

Unless required by applicable law or agreed to in writing, software distributed under the
Apache License or the GPL License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the Apache License and the GPL License for
the specific language governing permissions and limitations under the Apache License and the GPL License.
*/
(function ($) {
    if(typeof $.fn.each2 == "undefined") {
        $.extend($.fn, {
            /*
            * 4-10 times faster .each replacement
            * use it carefully, as it overrides jQuery context of element on each iteration
            */
            each2 : function (c) {
                var j = $([0]), i = -1, l = this.length;
                while (
                    ++i < l
                    && (j.context = j[0] = this[i])
                    && c.call(j[0], i, j) !== false //"this"=DOM, i=index, j=jQuery object
                );
                return this;
            }
        });
    }
})(jQuery);

(function ($, undefined) {
    
    /*global document, window, jQuery, console */

    if (window.Select2 !== undefined) {
        return;
    }

    var KEY, AbstractSelect2, SingleSelect2, MultiSelect2, nextUid, sizer,
        lastMousePosition={x:0,y:0}, $document, scrollBarDimensions,

    KEY = {
        TAB: 9,
        ENTER: 13,
        ESC: 27,
        SPACE: 32,
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40,
        SHIFT: 16,
        CTRL: 17,
        ALT: 18,
        PAGE_UP: 33,
        PAGE_DOWN: 34,
        HOME: 36,
        END: 35,
        BACKSPACE: 8,
        DELETE: 46,
        isArrow: function (k) {
            k = k.which ? k.which : k;
            switch (k) {
            case KEY.LEFT:
            case KEY.RIGHT:
            case KEY.UP:
            case KEY.DOWN:
                return true;
            }
            return false;
        },
        isControl: function (e) {
            var k = e.which;
            switch (k) {
            case KEY.SHIFT:
            case KEY.CTRL:
            case KEY.ALT:
                return true;
            }

            if (e.metaKey) return true;

            return false;
        },
        isFunctionKey: function (k) {
            k = k.which ? k.which : k;
            return k >= 112 && k <= 123;
        }
    },
    MEASURE_SCROLLBAR_TEMPLATE = "<div class='select2-measure-scrollbar'></div>",

    DIACRITICS = {"\u24B6":"A","\uFF21":"A","\u00C0":"A","\u00C1":"A","\u00C2":"A","\u1EA6":"A","\u1EA4":"A","\u1EAA":"A","\u1EA8":"A","\u00C3":"A","\u0100":"A","\u0102":"A","\u1EB0":"A","\u1EAE":"A","\u1EB4":"A","\u1EB2":"A","\u0226":"A","\u01E0":"A","\u00C4":"A","\u01DE":"A","\u1EA2":"A","\u00C5":"A","\u01FA":"A","\u01CD":"A","\u0200":"A","\u0202":"A","\u1EA0":"A","\u1EAC":"A","\u1EB6":"A","\u1E00":"A","\u0104":"A","\u023A":"A","\u2C6F":"A","\uA732":"AA","\u00C6":"AE","\u01FC":"AE","\u01E2":"AE","\uA734":"AO","\uA736":"AU","\uA738":"AV","\uA73A":"AV","\uA73C":"AY","\u24B7":"B","\uFF22":"B","\u1E02":"B","\u1E04":"B","\u1E06":"B","\u0243":"B","\u0182":"B","\u0181":"B","\u24B8":"C","\uFF23":"C","\u0106":"C","\u0108":"C","\u010A":"C","\u010C":"C","\u00C7":"C","\u1E08":"C","\u0187":"C","\u023B":"C","\uA73E":"C","\u24B9":"D","\uFF24":"D","\u1E0A":"D","\u010E":"D","\u1E0C":"D","\u1E10":"D","\u1E12":"D","\u1E0E":"D","\u0110":"D","\u018B":"D","\u018A":"D","\u0189":"D","\uA779":"D","\u01F1":"DZ","\u01C4":"DZ","\u01F2":"Dz","\u01C5":"Dz","\u24BA":"E","\uFF25":"E","\u00C8":"E","\u00C9":"E","\u00CA":"E","\u1EC0":"E","\u1EBE":"E","\u1EC4":"E","\u1EC2":"E","\u1EBC":"E","\u0112":"E","\u1E14":"E","\u1E16":"E","\u0114":"E","\u0116":"E","\u00CB":"E","\u1EBA":"E","\u011A":"E","\u0204":"E","\u0206":"E","\u1EB8":"E","\u1EC6":"E","\u0228":"E","\u1E1C":"E","\u0118":"E","\u1E18":"E","\u1E1A":"E","\u0190":"E","\u018E":"E","\u24BB":"F","\uFF26":"F","\u1E1E":"F","\u0191":"F","\uA77B":"F","\u24BC":"G","\uFF27":"G","\u01F4":"G","\u011C":"G","\u1E20":"G","\u011E":"G","\u0120":"G","\u01E6":"G","\u0122":"G","\u01E4":"G","\u0193":"G","\uA7A0":"G","\uA77D":"G","\uA77E":"G","\u24BD":"H","\uFF28":"H","\u0124":"H","\u1E22":"H","\u1E26":"H","\u021E":"H","\u1E24":"H","\u1E28":"H","\u1E2A":"H","\u0126":"H","\u2C67":"H","\u2C75":"H","\uA78D":"H","\u24BE":"I","\uFF29":"I","\u00CC":"I","\u00CD":"I","\u00CE":"I","\u0128":"I","\u012A":"I","\u012C":"I","\u0130":"I","\u00CF":"I","\u1E2E":"I","\u1EC8":"I","\u01CF":"I","\u0208":"I","\u020A":"I","\u1ECA":"I","\u012E":"I","\u1E2C":"I","\u0197":"I","\u24BF":"J","\uFF2A":"J","\u0134":"J","\u0248":"J","\u24C0":"K","\uFF2B":"K","\u1E30":"K","\u01E8":"K","\u1E32":"K","\u0136":"K","\u1E34":"K","\u0198":"K","\u2C69":"K","\uA740":"K","\uA742":"K","\uA744":"K","\uA7A2":"K","\u24C1":"L","\uFF2C":"L","\u013F":"L","\u0139":"L","\u013D":"L","\u1E36":"L","\u1E38":"L","\u013B":"L","\u1E3C":"L","\u1E3A":"L","\u0141":"L","\u023D":"L","\u2C62":"L","\u2C60":"L","\uA748":"L","\uA746":"L","\uA780":"L","\u01C7":"LJ","\u01C8":"Lj","\u24C2":"M","\uFF2D":"M","\u1E3E":"M","\u1E40":"M","\u1E42":"M","\u2C6E":"M","\u019C":"M","\u24C3":"N","\uFF2E":"N","\u01F8":"N","\u0143":"N","\u00D1":"N","\u1E44":"N","\u0147":"N","\u1E46":"N","\u0145":"N","\u1E4A":"N","\u1E48":"N","\u0220":"N","\u019D":"N","\uA790":"N","\uA7A4":"N","\u01CA":"NJ","\u01CB":"Nj","\u24C4":"O","\uFF2F":"O","\u00D2":"O","\u00D3":"O","\u00D4":"O","\u1ED2":"O","\u1ED0":"O","\u1ED6":"O","\u1ED4":"O","\u00D5":"O","\u1E4C":"O","\u022C":"O","\u1E4E":"O","\u014C":"O","\u1E50":"O","\u1E52":"O","\u014E":"O","\u022E":"O","\u0230":"O","\u00D6":"O","\u022A":"O","\u1ECE":"O","\u0150":"O","\u01D1":"O","\u020C":"O","\u020E":"O","\u01A0":"O","\u1EDC":"O","\u1EDA":"O","\u1EE0":"O","\u1EDE":"O","\u1EE2":"O","\u1ECC":"O","\u1ED8":"O","\u01EA":"O","\u01EC":"O","\u00D8":"O","\u01FE":"O","\u0186":"O","\u019F":"O","\uA74A":"O","\uA74C":"O","\u01A2":"OI","\uA74E":"OO","\u0222":"OU","\u24C5":"P","\uFF30":"P","\u1E54":"P","\u1E56":"P","\u01A4":"P","\u2C63":"P","\uA750":"P","\uA752":"P","\uA754":"P","\u24C6":"Q","\uFF31":"Q","\uA756":"Q","\uA758":"Q","\u024A":"Q","\u24C7":"R","\uFF32":"R","\u0154":"R","\u1E58":"R","\u0158":"R","\u0210":"R","\u0212":"R","\u1E5A":"R","\u1E5C":"R","\u0156":"R","\u1E5E":"R","\u024C":"R","\u2C64":"R","\uA75A":"R","\uA7A6":"R","\uA782":"R","\u24C8":"S","\uFF33":"S","\u1E9E":"S","\u015A":"S","\u1E64":"S","\u015C":"S","\u1E60":"S","\u0160":"S","\u1E66":"S","\u1E62":"S","\u1E68":"S","\u0218":"S","\u015E":"S","\u2C7E":"S","\uA7A8":"S","\uA784":"S","\u24C9":"T","\uFF34":"T","\u1E6A":"T","\u0164":"T","\u1E6C":"T","\u021A":"T","\u0162":"T","\u1E70":"T","\u1E6E":"T","\u0166":"T","\u01AC":"T","\u01AE":"T","\u023E":"T","\uA786":"T","\uA728":"TZ","\u24CA":"U","\uFF35":"U","\u00D9":"U","\u00DA":"U","\u00DB":"U","\u0168":"U","\u1E78":"U","\u016A":"U","\u1E7A":"U","\u016C":"U","\u00DC":"U","\u01DB":"U","\u01D7":"U","\u01D5":"U","\u01D9":"U","\u1EE6":"U","\u016E":"U","\u0170":"U","\u01D3":"U","\u0214":"U","\u0216":"U","\u01AF":"U","\u1EEA":"U","\u1EE8":"U","\u1EEE":"U","\u1EEC":"U","\u1EF0":"U","\u1EE4":"U","\u1E72":"U","\u0172":"U","\u1E76":"U","\u1E74":"U","\u0244":"U","\u24CB":"V","\uFF36":"V","\u1E7C":"V","\u1E7E":"V","\u01B2":"V","\uA75E":"V","\u0245":"V","\uA760":"VY","\u24CC":"W","\uFF37":"W","\u1E80":"W","\u1E82":"W","\u0174":"W","\u1E86":"W","\u1E84":"W","\u1E88":"W","\u2C72":"W","\u24CD":"X","\uFF38":"X","\u1E8A":"X","\u1E8C":"X","\u24CE":"Y","\uFF39":"Y","\u1EF2":"Y","\u00DD":"Y","\u0176":"Y","\u1EF8":"Y","\u0232":"Y","\u1E8E":"Y","\u0178":"Y","\u1EF6":"Y","\u1EF4":"Y","\u01B3":"Y","\u024E":"Y","\u1EFE":"Y","\u24CF":"Z","\uFF3A":"Z","\u0179":"Z","\u1E90":"Z","\u017B":"Z","\u017D":"Z","\u1E92":"Z","\u1E94":"Z","\u01B5":"Z","\u0224":"Z","\u2C7F":"Z","\u2C6B":"Z","\uA762":"Z","\u24D0":"a","\uFF41":"a","\u1E9A":"a","\u00E0":"a","\u00E1":"a","\u00E2":"a","\u1EA7":"a","\u1EA5":"a","\u1EAB":"a","\u1EA9":"a","\u00E3":"a","\u0101":"a","\u0103":"a","\u1EB1":"a","\u1EAF":"a","\u1EB5":"a","\u1EB3":"a","\u0227":"a","\u01E1":"a","\u00E4":"a","\u01DF":"a","\u1EA3":"a","\u00E5":"a","\u01FB":"a","\u01CE":"a","\u0201":"a","\u0203":"a","\u1EA1":"a","\u1EAD":"a","\u1EB7":"a","\u1E01":"a","\u0105":"a","\u2C65":"a","\u0250":"a","\uA733":"aa","\u00E6":"ae","\u01FD":"ae","\u01E3":"ae","\uA735":"ao","\uA737":"au","\uA739":"av","\uA73B":"av","\uA73D":"ay","\u24D1":"b","\uFF42":"b","\u1E03":"b","\u1E05":"b","\u1E07":"b","\u0180":"b","\u0183":"b","\u0253":"b","\u24D2":"c","\uFF43":"c","\u0107":"c","\u0109":"c","\u010B":"c","\u010D":"c","\u00E7":"c","\u1E09":"c","\u0188":"c","\u023C":"c","\uA73F":"c","\u2184":"c","\u24D3":"d","\uFF44":"d","\u1E0B":"d","\u010F":"d","\u1E0D":"d","\u1E11":"d","\u1E13":"d","\u1E0F":"d","\u0111":"d","\u018C":"d","\u0256":"d","\u0257":"d","\uA77A":"d","\u01F3":"dz","\u01C6":"dz","\u24D4":"e","\uFF45":"e","\u00E8":"e","\u00E9":"e","\u00EA":"e","\u1EC1":"e","\u1EBF":"e","\u1EC5":"e","\u1EC3":"e","\u1EBD":"e","\u0113":"e","\u1E15":"e","\u1E17":"e","\u0115":"e","\u0117":"e","\u00EB":"e","\u1EBB":"e","\u011B":"e","\u0205":"e","\u0207":"e","\u1EB9":"e","\u1EC7":"e","\u0229":"e","\u1E1D":"e","\u0119":"e","\u1E19":"e","\u1E1B":"e","\u0247":"e","\u025B":"e","\u01DD":"e","\u24D5":"f","\uFF46":"f","\u1E1F":"f","\u0192":"f","\uA77C":"f","\u24D6":"g","\uFF47":"g","\u01F5":"g","\u011D":"g","\u1E21":"g","\u011F":"g","\u0121":"g","\u01E7":"g","\u0123":"g","\u01E5":"g","\u0260":"g","\uA7A1":"g","\u1D79":"g","\uA77F":"g","\u24D7":"h","\uFF48":"h","\u0125":"h","\u1E23":"h","\u1E27":"h","\u021F":"h","\u1E25":"h","\u1E29":"h","\u1E2B":"h","\u1E96":"h","\u0127":"h","\u2C68":"h","\u2C76":"h","\u0265":"h","\u0195":"hv","\u24D8":"i","\uFF49":"i","\u00EC":"i","\u00ED":"i","\u00EE":"i","\u0129":"i","\u012B":"i","\u012D":"i","\u00EF":"i","\u1E2F":"i","\u1EC9":"i","\u01D0":"i","\u0209":"i","\u020B":"i","\u1ECB":"i","\u012F":"i","\u1E2D":"i","\u0268":"i","\u0131":"i","\u24D9":"j","\uFF4A":"j","\u0135":"j","\u01F0":"j","\u0249":"j","\u24DA":"k","\uFF4B":"k","\u1E31":"k","\u01E9":"k","\u1E33":"k","\u0137":"k","\u1E35":"k","\u0199":"k","\u2C6A":"k","\uA741":"k","\uA743":"k","\uA745":"k","\uA7A3":"k","\u24DB":"l","\uFF4C":"l","\u0140":"l","\u013A":"l","\u013E":"l","\u1E37":"l","\u1E39":"l","\u013C":"l","\u1E3D":"l","\u1E3B":"l","\u017F":"l","\u0142":"l","\u019A":"l","\u026B":"l","\u2C61":"l","\uA749":"l","\uA781":"l","\uA747":"l","\u01C9":"lj","\u24DC":"m","\uFF4D":"m","\u1E3F":"m","\u1E41":"m","\u1E43":"m","\u0271":"m","\u026F":"m","\u24DD":"n","\uFF4E":"n","\u01F9":"n","\u0144":"n","\u00F1":"n","\u1E45":"n","\u0148":"n","\u1E47":"n","\u0146":"n","\u1E4B":"n","\u1E49":"n","\u019E":"n","\u0272":"n","\u0149":"n","\uA791":"n","\uA7A5":"n","\u01CC":"nj","\u24DE":"o","\uFF4F":"o","\u00F2":"o","\u00F3":"o","\u00F4":"o","\u1ED3":"o","\u1ED1":"o","\u1ED7":"o","\u1ED5":"o","\u00F5":"o","\u1E4D":"o","\u022D":"o","\u1E4F":"o","\u014D":"o","\u1E51":"o","\u1E53":"o","\u014F":"o","\u022F":"o","\u0231":"o","\u00F6":"o","\u022B":"o","\u1ECF":"o","\u0151":"o","\u01D2":"o","\u020D":"o","\u020F":"o","\u01A1":"o","\u1EDD":"o","\u1EDB":"o","\u1EE1":"o","\u1EDF":"o","\u1EE3":"o","\u1ECD":"o","\u1ED9":"o","\u01EB":"o","\u01ED":"o","\u00F8":"o","\u01FF":"o","\u0254":"o","\uA74B":"o","\uA74D":"o","\u0275":"o","\u01A3":"oi","\u0223":"ou","\uA74F":"oo","\u24DF":"p","\uFF50":"p","\u1E55":"p","\u1E57":"p","\u01A5":"p","\u1D7D":"p","\uA751":"p","\uA753":"p","\uA755":"p","\u24E0":"q","\uFF51":"q","\u024B":"q","\uA757":"q","\uA759":"q","\u24E1":"r","\uFF52":"r","\u0155":"r","\u1E59":"r","\u0159":"r","\u0211":"r","\u0213":"r","\u1E5B":"r","\u1E5D":"r","\u0157":"r","\u1E5F":"r","\u024D":"r","\u027D":"r","\uA75B":"r","\uA7A7":"r","\uA783":"r","\u24E2":"s","\uFF53":"s","\u00DF":"s","\u015B":"s","\u1E65":"s","\u015D":"s","\u1E61":"s","\u0161":"s","\u1E67":"s","\u1E63":"s","\u1E69":"s","\u0219":"s","\u015F":"s","\u023F":"s","\uA7A9":"s","\uA785":"s","\u1E9B":"s","\u24E3":"t","\uFF54":"t","\u1E6B":"t","\u1E97":"t","\u0165":"t","\u1E6D":"t","\u021B":"t","\u0163":"t","\u1E71":"t","\u1E6F":"t","\u0167":"t","\u01AD":"t","\u0288":"t","\u2C66":"t","\uA787":"t","\uA729":"tz","\u24E4":"u","\uFF55":"u","\u00F9":"u","\u00FA":"u","\u00FB":"u","\u0169":"u","\u1E79":"u","\u016B":"u","\u1E7B":"u","\u016D":"u","\u00FC":"u","\u01DC":"u","\u01D8":"u","\u01D6":"u","\u01DA":"u","\u1EE7":"u","\u016F":"u","\u0171":"u","\u01D4":"u","\u0215":"u","\u0217":"u","\u01B0":"u","\u1EEB":"u","\u1EE9":"u","\u1EEF":"u","\u1EED":"u","\u1EF1":"u","\u1EE5":"u","\u1E73":"u","\u0173":"u","\u1E77":"u","\u1E75":"u","\u0289":"u","\u24E5":"v","\uFF56":"v","\u1E7D":"v","\u1E7F":"v","\u028B":"v","\uA75F":"v","\u028C":"v","\uA761":"vy","\u24E6":"w","\uFF57":"w","\u1E81":"w","\u1E83":"w","\u0175":"w","\u1E87":"w","\u1E85":"w","\u1E98":"w","\u1E89":"w","\u2C73":"w","\u24E7":"x","\uFF58":"x","\u1E8B":"x","\u1E8D":"x","\u24E8":"y","\uFF59":"y","\u1EF3":"y","\u00FD":"y","\u0177":"y","\u1EF9":"y","\u0233":"y","\u1E8F":"y","\u00FF":"y","\u1EF7":"y","\u1E99":"y","\u1EF5":"y","\u01B4":"y","\u024F":"y","\u1EFF":"y","\u24E9":"z","\uFF5A":"z","\u017A":"z","\u1E91":"z","\u017C":"z","\u017E":"z","\u1E93":"z","\u1E95":"z","\u01B6":"z","\u0225":"z","\u0240":"z","\u2C6C":"z","\uA763":"z","\u0386":"\u0391","\u0388":"\u0395","\u0389":"\u0397","\u038A":"\u0399","\u03AA":"\u0399","\u038C":"\u039F","\u038E":"\u03A5","\u03AB":"\u03A5","\u038F":"\u03A9","\u03AC":"\u03B1","\u03AD":"\u03B5","\u03AE":"\u03B7","\u03AF":"\u03B9","\u03CA":"\u03B9","\u0390":"\u03B9","\u03CC":"\u03BF","\u03CD":"\u03C5","\u03CB":"\u03C5","\u03B0":"\u03C5","\u03C9":"\u03C9","\u03C2":"\u03C3"};

    $document = $(document);

    nextUid=(function() { var counter=1; return function() { return counter++; }; }());


    function reinsertElement(element) {
        var placeholder = $(document.createTextNode(''));

        element.before(placeholder);
        placeholder.before(element);
        placeholder.remove();
    }

    function stripDiacritics(str) {
        // Used 'uni range + named function' from http://jsperf.com/diacritics/18
        function match(a) {
            return DIACRITICS[a] || a;
        }

        return str.replace(/[^\u0000-\u007E]/g, match);
    }

    function indexOf(value, array) {
        var i = 0, l = array.length;
        for (; i < l; i = i + 1) {
            if (equal(value, array[i])) return i;
        }
        return -1;
    }

    function measureScrollbar () {
        var $template = $( MEASURE_SCROLLBAR_TEMPLATE );
        $template.appendTo('body');

        var dim = {
            width: $template.width() - $template[0].clientWidth,
            height: $template.height() - $template[0].clientHeight
        };
        $template.remove();

        return dim;
    }

    /**
     * Compares equality of a and b
     * @param a
     * @param b
     */
    function equal(a, b) {
        if (a === b) return true;
        if (a === undefined || b === undefined) return false;
        if (a === null || b === null) return false;
        // Check whether 'a' or 'b' is a string (primitive or object).
        // The concatenation of an empty string (+'') converts its argument to a string's primitive.
        if (a.constructor === String) return a+'' === b+''; // a+'' - in case 'a' is a String object
        if (b.constructor === String) return b+'' === a+''; // b+'' - in case 'b' is a String object
        return false;
    }

    /**
     * Splits the string into an array of values, trimming each value. An empty array is returned for nulls or empty
     * strings
     * @param string
     * @param separator
     */
    function splitVal(string, separator) {
        var val, i, l;
        if (string === null || string.length < 1) return [];
        val = string.split(separator);
        for (i = 0, l = val.length; i < l; i = i + 1) val[i] = $.trim(val[i]);
        return val;
    }

    function getSideBorderPadding(element) {
        return element.outerWidth(false) - element.width();
    }

    function installKeyUpChangeEvent(element) {
        var key="keyup-change-value";
        element.on("keydown", function () {
            if ($.data(element, key) === undefined) {
                $.data(element, key, element.val());
            }
        });
        element.on("keyup", function () {
            var val= $.data(element, key);
            if (val !== undefined && element.val() !== val) {
                $.removeData(element, key);
                element.trigger("keyup-change");
            }
        });
    }


    /**
     * filters mouse events so an event is fired only if the mouse moved.
     *
     * filters out mouse events that occur when mouse is stationary but
     * the elements under the pointer are scrolled.
     */
    function installFilteredMouseMove(element) {
        element.on("mousemove", function (e) {
            var lastpos = lastMousePosition;
            if (lastpos === undefined || lastpos.x !== e.pageX || lastpos.y !== e.pageY) {
                $(e.target).trigger("mousemove-filtered", e);
            }
        });
    }

    /**
     * Debounces a function. Returns a function that calls the original fn function only if no invocations have been made
     * within the last quietMillis milliseconds.
     *
     * @param quietMillis number of milliseconds to wait before invoking fn
     * @param fn function to be debounced
     * @param ctx object to be used as this reference within fn
     * @return debounced version of fn
     */
    function debounce(quietMillis, fn, ctx) {
        ctx = ctx || undefined;
        var timeout;
        return function () {
            var args = arguments;
            window.clearTimeout(timeout);
            timeout = window.setTimeout(function() {
                fn.apply(ctx, args);
            }, quietMillis);
        };
    }

    function installDebouncedScroll(threshold, element) {
        var notify = debounce(threshold, function (e) { element.trigger("scroll-debounced", e);});
        element.on("scroll", function (e) {
            if (indexOf(e.target, element.get()) >= 0) notify(e);
        });
    }

    function focus($el) {
        if ($el[0] === document.activeElement) return;

        /* set the focus in a 0 timeout - that way the focus is set after the processing
            of the current event has finished - which seems like the only reliable way
            to set focus */
        window.setTimeout(function() {
            var el=$el[0], pos=$el.val().length, range;

            $el.focus();

            /* make sure el received focus so we do not error out when trying to manipulate the caret.
                sometimes modals or others listeners may steal it after its set */
            var isVisible = (el.offsetWidth > 0 || el.offsetHeight > 0);
            if (isVisible && el === document.activeElement) {

                /* after the focus is set move the caret to the end, necessary when we val()
                    just before setting focus */
                if(el.setSelectionRange)
                {
                    el.setSelectionRange(pos, pos);
                }
                else if (el.createTextRange) {
                    range = el.createTextRange();
                    range.collapse(false);
                    range.select();
                }
            }
        }, 0);
    }

    function getCursorInfo(el) {
        el = $(el)[0];
        var offset = 0;
        var length = 0;
        if ('selectionStart' in el) {
            offset = el.selectionStart;
            length = el.selectionEnd - offset;
        } else if ('selection' in document) {
            el.focus();
            var sel = document.selection.createRange();
            length = document.selection.createRange().text.length;
            sel.moveStart('character', -el.value.length);
            offset = sel.text.length - length;
        }
        return { offset: offset, length: length };
    }

    function killEvent(event) {
        event.preventDefault();
        event.stopPropagation();
    }
    function killEventImmediately(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
    }

    function measureTextWidth(e) {
        if (!sizer){
            var style = e[0].currentStyle || window.getComputedStyle(e[0], null);
            sizer = $(document.createElement("div")).css({
                position: "absolute",
                left: "-10000px",
                top: "-10000px",
                display: "none",
                fontSize: style.fontSize,
                fontFamily: style.fontFamily,
                fontStyle: style.fontStyle,
                fontWeight: style.fontWeight,
                letterSpacing: style.letterSpacing,
                textTransform: style.textTransform,
                whiteSpace: "nowrap"
            });
            sizer.attr("class","select2-sizer");
            $("body").append(sizer);
        }
        sizer.text(e.val());
        return sizer.width();
    }

    function syncCssClasses(dest, src, adapter) {
        var classes, replacements = [], adapted;

        classes = $.trim(dest.attr("class"));

        if (classes) {
            classes = '' + classes; // for IE which returns object

            $(classes.split(/\s+/)).each2(function() {
                if (this.indexOf("select2-") === 0) {
                    replacements.push(this);
                }
            });
        }

        classes = $.trim(src.attr("class"));

        if (classes) {
            classes = '' + classes; // for IE which returns object

            $(classes.split(/\s+/)).each2(function() {
                if (this.indexOf("select2-") !== 0) {
                    adapted = adapter(this);

                    if (adapted) {
                        replacements.push(adapted);
                    }
                }
            });
        }

        dest.attr("class", replacements.join(" "));
    }


    function markMatch(text, term, markup, escapeMarkup) {
        var match=stripDiacritics(text.toUpperCase()).indexOf(stripDiacritics(term.toUpperCase())),
            tl=term.length;

        if (match<0) {
            markup.push(escapeMarkup(text));
            return;
        }

        markup.push(escapeMarkup(text.substring(0, match)));
        markup.push("<span class='select2-match'>");
        markup.push(escapeMarkup(text.substring(match, match + tl)));
        markup.push("</span>");
        markup.push(escapeMarkup(text.substring(match + tl, text.length)));
    }

    function defaultEscapeMarkup(markup) {
        var replace_map = {
            '\\': '&#92;',
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            "/": '&#47;'
        };

        return String(markup).replace(/[&<>"'\/\\]/g, function (match) {
            return replace_map[match];
        });
    }

    /**
     * Produces an ajax-based query function
     *
     * @param options object containing configuration parameters
     * @param options.params parameter map for the transport ajax call, can contain such options as cache, jsonpCallback, etc. see $.ajax
     * @param options.transport function that will be used to execute the ajax request. must be compatible with parameters supported by $.ajax
     * @param options.url url for the data
     * @param options.data a function(searchTerm, pageNumber, context) that should return an object containing query string parameters for the above url.
     * @param options.dataType request data type: ajax, jsonp, other datatypes supported by jQuery's $.ajax function or the transport function if specified
     * @param options.quietMillis (optional) milliseconds to wait before making the ajaxRequest, helps debounce the ajax function if invoked too often
     * @param options.results a function(remoteData, pageNumber, query) that converts data returned form the remote request to the format expected by Select2.
     *      The expected format is an object containing the following keys:
     *      results array of objects that will be used as choices
     *      more (optional) boolean indicating whether there are more results available
     *      Example: {results:[{id:1, text:'Red'},{id:2, text:'Blue'}], more:true}
     */
    function ajax(options) {
        var timeout, // current scheduled but not yet executed request
            handler = null,
            quietMillis = options.quietMillis || 100,
            ajaxUrl = options.url,
            self = this;

        return function (query) {
            window.clearTimeout(timeout);
            timeout = window.setTimeout(function () {
                var data = options.data, // ajax data function
                    url = ajaxUrl, // ajax url string or function
                    transport = options.transport || $.fn.select2.ajaxDefaults.transport,
                    // deprecated - to be removed in 4.0  - use params instead
                    deprecated = {
                        type: options.type || 'GET', // set type of request (GET or POST)
                        cache: options.cache || false,
                        jsonpCallback: options.jsonpCallback||undefined,
                        dataType: options.dataType||"json"
                    },
                    params = $.extend({}, $.fn.select2.ajaxDefaults.params, deprecated);

                data = data ? data.call(self, query.term, query.page, query.context) : null;
                url = (typeof url === 'function') ? url.call(self, query.term, query.page, query.context) : url;

                if (handler && typeof handler.abort === "function") { handler.abort(); }

                if (options.params) {
                    if ($.isFunction(options.params)) {
                        $.extend(params, options.params.call(self));
                    } else {
                        $.extend(params, options.params);
                    }
                }

                $.extend(params, {
                    url: url,
                    dataType: options.dataType,
                    data: data,
                    success: function (data) {
                        // TODO - replace query.page with query so users have access to term, page, etc.
                        // added query as third paramter to keep backwards compatibility
                        var results = options.results(data, query.page, query);
                        query.callback(results);
                    },
                    error: function(jqXHR, textStatus, errorThrown){
                        var results = {
                            hasError: true,
                            jqXHR: jqXHR,
                            textStatus: textStatus,
                            errorThrown: errorThrown,
                        };

                        query.callback(results);
                    }
                });
                handler = transport.call(self, params);
            }, quietMillis);
        };
    }

    /**
     * Produces a query function that works with a local array
     *
     * @param options object containing configuration parameters. The options parameter can either be an array or an
     * object.
     *
     * If the array form is used it is assumed that it contains objects with 'id' and 'text' keys.
     *
     * If the object form is used it is assumed that it contains 'data' and 'text' keys. The 'data' key should contain
     * an array of objects that will be used as choices. These objects must contain at least an 'id' key. The 'text'
     * key can either be a String in which case it is expected that each element in the 'data' array has a key with the
     * value of 'text' which will be used to match choices. Alternatively, text can be a function(item) that can extract
     * the text.
     */
    function local(options) {
        var data = options, // data elements
            dataText,
            tmp,
            text = function (item) { return ""+item.text; }; // function used to retrieve the text portion of a data item that is matched against the search

         if ($.isArray(data)) {
            tmp = data;
            data = { results: tmp };
        }

         if ($.isFunction(data) === false) {
            tmp = data;
            data = function() { return tmp; };
        }

        var dataItem = data();
        if (dataItem.text) {
            text = dataItem.text;
            // if text is not a function we assume it to be a key name
            if (!$.isFunction(text)) {
                dataText = dataItem.text; // we need to store this in a separate variable because in the next step data gets reset and data.text is no longer available
                text = function (item) { return item[dataText]; };
            }
        }

        return function (query) {
            var t = query.term, filtered = { results: [] }, process;
            if (t === "") {
                query.callback(data());
                return;
            }

            process = function(datum, collection) {
                var group, attr;
                datum = datum[0];
                if (datum.children) {
                    group = {};
                    for (attr in datum) {
                        if (datum.hasOwnProperty(attr)) group[attr]=datum[attr];
                    }
                    group.children=[];
                    $(datum.children).each2(function(i, childDatum) { process(childDatum, group.children); });
                    if (group.children.length || query.matcher(t, text(group), datum)) {
                        collection.push(group);
                    }
                } else {
                    if (query.matcher(t, text(datum), datum)) {
                        collection.push(datum);
                    }
                }
            };

            $(data().results).each2(function(i, datum) { process(datum, filtered.results); });
            query.callback(filtered);
        };
    }

    // TODO javadoc
    function tags(data) {
        var isFunc = $.isFunction(data);
        return function (query) {
            var t = query.term, filtered = {results: []};
            var result = isFunc ? data(query) : data;
            if ($.isArray(result)) {
                $(result).each(function () {
                    var isObject = this.text !== undefined,
                        text = isObject ? this.text : this;
                    if (t === "" || query.matcher(t, text)) {
                        filtered.results.push(isObject ? this : {id: this, text: this});
                    }
                });
                query.callback(filtered);
            }
        };
    }

    /**
     * Checks if the formatter function should be used.
     *
     * Throws an error if it is not a function. Returns true if it should be used,
     * false if no formatting should be performed.
     *
     * @param formatter
     */
    function checkFormatter(formatter, formatterName) {
        if ($.isFunction(formatter)) return true;
        if (!formatter) return false;
        if (typeof(formatter) === 'string') return true;
        throw new Error(formatterName +" must be a string, function, or falsy value");
    }

  /**
   * Returns a given value
   * If given a function, returns its output
   *
   * @param val string|function
   * @param context value of "this" to be passed to function
   * @returns {*}
   */
    function evaluate(val, context) {
        if ($.isFunction(val)) {
            var args = Array.prototype.slice.call(arguments, 2);
            return val.apply(context, args);
        }
        return val;
    }

    function countResults(results) {
        var count = 0;
        $.each(results, function(i, item) {
            if (item.children) {
                count += countResults(item.children);
            } else {
                count++;
            }
        });
        return count;
    }

    /**
     * Default tokenizer. This function uses breaks the input on substring match of any string from the
     * opts.tokenSeparators array and uses opts.createSearchChoice to create the choice object. Both of those
     * two options have to be defined in order for the tokenizer to work.
     *
     * @param input text user has typed so far or pasted into the search field
     * @param selection currently selected choices
     * @param selectCallback function(choice) callback tho add the choice to selection
     * @param opts select2's opts
     * @return undefined/null to leave the current input unchanged, or a string to change the input to the returned value
     */
    function defaultTokenizer(input, selection, selectCallback, opts) {
        var original = input, // store the original so we can compare and know if we need to tell the search to update its text
            dupe = false, // check for whether a token we extracted represents a duplicate selected choice
            token, // token
            index, // position at which the separator was found
            i, l, // looping variables
            separator; // the matched separator

        if (!opts.createSearchChoice || !opts.tokenSeparators || opts.tokenSeparators.length < 1) return undefined;

        while (true) {
            index = -1;

            for (i = 0, l = opts.tokenSeparators.length; i < l; i++) {
                separator = opts.tokenSeparators[i];
                index = input.indexOf(separator);
                if (index >= 0) break;
            }

            if (index < 0) break; // did not find any token separator in the input string, bail

            token = input.substring(0, index);
            input = input.substring(index + separator.length);

            if (token.length > 0) {
                token = opts.createSearchChoice.call(this, token, selection);
                if (token !== undefined && token !== null && opts.id(token) !== undefined && opts.id(token) !== null) {
                    dupe = false;
                    for (i = 0, l = selection.length; i < l; i++) {
                        if (equal(opts.id(token), opts.id(selection[i]))) {
                            dupe = true; break;
                        }
                    }

                    if (!dupe) selectCallback(token);
                }
            }
        }

        if (original!==input) return input;
    }

    function cleanupJQueryElements() {
        var self = this;

        $.each(arguments, function (i, element) {
            self[element].remove();
            self[element] = null;
        });
    }

    /**
     * Creates a new class
     *
     * @param superClass
     * @param methods
     */
    function clazz(SuperClass, methods) {
        var constructor = function () {};
        constructor.prototype = new SuperClass;
        constructor.prototype.constructor = constructor;
        constructor.prototype.parent = SuperClass.prototype;
        constructor.prototype = $.extend(constructor.prototype, methods);
        return constructor;
    }

    AbstractSelect2 = clazz(Object, {

        // abstract
        bind: function (func) {
            var self = this;
            return function () {
                func.apply(self, arguments);
            };
        },

        // abstract
        init: function (opts) {
            var results, search, resultsSelector = ".select2-results";

            // prepare options
            this.opts = opts = this.prepareOpts(opts);

            this.id=opts.id;

            // destroy if called on an existing component
            if (opts.element.data("select2") !== undefined &&
                opts.element.data("select2") !== null) {
                opts.element.data("select2").destroy();
            }

            this.container = this.createContainer();

            this.liveRegion = $("<span>", {
                    role: "status",
                    "aria-live": "polite"
                })
                .addClass("select2-hidden-accessible")
                .appendTo(document.body);

            this.containerId="s2id_"+(opts.element.attr("id") || "autogen"+nextUid());
            this.containerEventName= this.containerId
                .replace(/([.])/g, '_')
                .replace(/([;&,\-\.\+\*\~':"\!\^#$%@\[\]\(\)=>\|])/g, '\\$1');
            this.container.attr("id", this.containerId);

            this.container.attr("title", opts.element.attr("title"));

            this.body = $("body");

            syncCssClasses(this.container, this.opts.element, this.opts.adaptContainerCssClass);

            this.container.attr("style", opts.element.attr("style"));
            this.container.css(evaluate(opts.containerCss, this.opts.element));
            this.container.addClass(evaluate(opts.containerCssClass, this.opts.element));

            this.elementTabIndex = this.opts.element.attr("tabindex");

            // swap container for the element
            this.opts.element
                .data("select2", this)
                .attr("tabindex", "-1")
                .before(this.container)
                .on("click.select2", killEvent); // do not leak click events

            this.container.data("select2", this);

            this.dropdown = this.container.find(".select2-drop");

            syncCssClasses(this.dropdown, this.opts.element, this.opts.adaptDropdownCssClass);

            this.dropdown.addClass(evaluate(opts.dropdownCssClass, this.opts.element));
            this.dropdown.data("select2", this);
            this.dropdown.on("click", killEvent);

            this.results = results = this.container.find(resultsSelector);
            this.search = search = this.container.find("input.select2-input");

            this.queryCount = 0;
            this.resultsPage = 0;
            this.context = null;

            // initialize the container
            this.initContainer();

            this.container.on("click", killEvent);

            installFilteredMouseMove(this.results);

            this.dropdown.on("mousemove-filtered", resultsSelector, this.bind(this.highlightUnderEvent));
            this.dropdown.on("touchstart touchmove touchend", resultsSelector, this.bind(function (event) {
                this._touchEvent = true;
                this.highlightUnderEvent(event);
            }));
            this.dropdown.on("touchmove", resultsSelector, this.bind(this.touchMoved));
            this.dropdown.on("touchstart touchend", resultsSelector, this.bind(this.clearTouchMoved));

            // Waiting for a click event on touch devices to select option and hide dropdown
            // otherwise click will be triggered on an underlying element
            this.dropdown.on('click', this.bind(function (event) {
                if (this._touchEvent) {
                    this._touchEvent = false;
                    this.selectHighlighted();
                }
            }));

            installDebouncedScroll(80, this.results);
            this.dropdown.on("scroll-debounced", resultsSelector, this.bind(this.loadMoreIfNeeded));

            // do not propagate change event from the search field out of the component
            $(this.container).on("change", ".select2-input", function(e) {e.stopPropagation();});
            $(this.dropdown).on("change", ".select2-input", function(e) {e.stopPropagation();});

            // if jquery.mousewheel plugin is installed we can prevent out-of-bounds scrolling of results via mousewheel
            if ($.fn.mousewheel) {
                results.mousewheel(function (e, delta, deltaX, deltaY) {
                    var top = results.scrollTop();
                    if (deltaY > 0 && top - deltaY <= 0) {
                        results.scrollTop(0);
                        killEvent(e);
                    } else if (deltaY < 0 && results.get(0).scrollHeight - results.scrollTop() + deltaY <= results.height()) {
                        results.scrollTop(results.get(0).scrollHeight - results.height());
                        killEvent(e);
                    }
                });
            }

            installKeyUpChangeEvent(search);
            search.on("keyup-change input paste", this.bind(this.updateResults));
            search.on("focus", function () { search.addClass("select2-focused"); });
            search.on("blur", function () { search.removeClass("select2-focused");});

            this.dropdown.on("mouseup", resultsSelector, this.bind(function (e) {
                if ($(e.target).closest(".select2-result-selectable").length > 0) {
                    this.highlightUnderEvent(e);
                    this.selectHighlighted(e);
                }
            }));

            // trap all mouse events from leaving the dropdown. sometimes there may be a modal that is listening
            // for mouse events outside of itself so it can close itself. since the dropdown is now outside the select2's
            // dom it will trigger the popup close, which is not what we want
            // focusin can cause focus wars between modals and select2 since the dropdown is outside the modal.
            this.dropdown.on("click mouseup mousedown touchstart touchend focusin", function (e) { e.stopPropagation(); });

            this.nextSearchTerm = undefined;

            if ($.isFunction(this.opts.initSelection)) {
                // initialize selection based on the current value of the source element
                this.initSelection();

                // if the user has provided a function that can set selection based on the value of the source element
                // we monitor the change event on the element and trigger it, allowing for two way synchronization
                this.monitorSource();
            }

            if (opts.maximumInputLength !== null) {
                this.search.attr("maxlength", opts.maximumInputLength);
            }

            var disabled = opts.element.prop("disabled");
            if (disabled === undefined) disabled = false;
            this.enable(!disabled);

            var readonly = opts.element.prop("readonly");
            if (readonly === undefined) readonly = false;
            this.readonly(readonly);

            // Calculate size of scrollbar
            scrollBarDimensions = scrollBarDimensions || measureScrollbar();

            this.autofocus = opts.element.prop("autofocus");
            opts.element.prop("autofocus", false);
            if (this.autofocus) this.focus();

            this.search.attr("placeholder", opts.searchInputPlaceholder);
        },

        // abstract
        destroy: function () {
            var element=this.opts.element, select2 = element.data("select2"), self = this;

            this.close();

            if (element.length && element[0].detachEvent) {
                element.each(function () {
                    this.detachEvent("onpropertychange", self._sync);
                });
            }
            if (this.propertyObserver) {
                this.propertyObserver.disconnect();
                this.propertyObserver = null;
            }
            this._sync = null;

            if (select2 !== undefined) {
                select2.container.remove();
                select2.liveRegion.remove();
                select2.dropdown.remove();
                element
                    .removeClass("select2-offscreen")
                    .removeData("select2")
                    .off(".select2")
                    .prop("autofocus", this.autofocus || false);
                if (this.elementTabIndex) {
                    element.attr({tabindex: this.elementTabIndex});
                } else {
                    element.removeAttr("tabindex");
                }
                element.show();
            }

            cleanupJQueryElements.call(this,
                "container",
                "liveRegion",
                "dropdown",
                "results",
                "search"
            );
        },

        // abstract
        optionToData: function(element) {
            if (element.is("option")) {
                return {
                    id:element.prop("value"),
                    text:element.text(),
                    element: element.get(),
                    css: element.attr("class"),
                    disabled: element.prop("disabled"),
                    locked: equal(element.attr("locked"), "locked") || equal(element.data("locked"), true)
                };
            } else if (element.is("optgroup")) {
                return {
                    text:element.attr("label"),
                    children:[],
                    element: element.get(),
                    css: element.attr("class")
                };
            }
        },

        // abstract
        prepareOpts: function (opts) {
            var element, select, idKey, ajaxUrl, self = this;

            element = opts.element;

            if (element.get(0).tagName.toLowerCase() === "select") {
                this.select = select = opts.element;
            }

            if (select) {
                // these options are not allowed when attached to a select because they are picked up off the element itself
                $.each(["id", "multiple", "ajax", "query", "createSearchChoice", "initSelection", "data", "tags"], function () {
                    if (this in opts) {
                        throw new Error("Option '" + this + "' is not allowed for Select2 when attached to a <select> element.");
                    }
                });
            }

            opts = $.extend({}, {
                populateResults: function(container, results, query) {
                    var populate, id=this.opts.id, liveRegion=this.liveRegion;

                    populate=function(results, container, depth) {

                        var i, l, result, selectable, disabled, compound, node, label, innerContainer, formatted;

                        results = opts.sortResults(results, container, query);

                        // collect the created nodes for bulk append
                        var nodes = [];
                        for (i = 0, l = results.length; i < l; i = i + 1) {

                            result=results[i];

                            disabled = (result.disabled === true);
                            selectable = (!disabled) && (id(result) !== undefined);

                            compound=result.children && result.children.length > 0;

                            node=$("<li></li>");
                            node.addClass("select2-results-dept-"+depth);
                            node.addClass("select2-result");
                            node.addClass(selectable ? "select2-result-selectable" : "select2-result-unselectable");
                            if (disabled) { node.addClass("select2-disabled"); }
                            if (compound) { node.addClass("select2-result-with-children"); }
                            node.addClass(self.opts.formatResultCssClass(result));
                            node.attr("role", "presentation");

                            label=$(document.createElement("div"));
                            label.addClass("select2-result-label");
                            label.attr("id", "select2-result-label-" + nextUid());
                            label.attr("role", "option");

                            formatted=opts.formatResult(result, label, query, self.opts.escapeMarkup);
                            if (formatted!==undefined) {
                                label.html(formatted);
                                node.append(label);
                            }


                            if (compound) {

                                innerContainer=$("<ul></ul>");
                                innerContainer.addClass("select2-result-sub");
                                populate(result.children, innerContainer, depth+1);
                                node.append(innerContainer);
                            }

                            node.data("select2-data", result);
                            nodes.push(node[0]);
                        }

                        // bulk append the created nodes
                        container.append(nodes);
                        liveRegion.text(opts.formatMatches(results.length));
                    };

                    populate(results, container, 0);
                }
            }, $.fn.select2.defaults, opts);

            if (typeof(opts.id) !== "function") {
                idKey = opts.id;
                opts.id = function (e) { return e[idKey]; };
            }

            if ($.isArray(opts.element.data("select2Tags"))) {
                if ("tags" in opts) {
                    throw "tags specified as both an attribute 'data-select2-tags' and in options of Select2 " + opts.element.attr("id");
                }
                opts.tags=opts.element.data("select2Tags");
            }

            if (select) {
                opts.query = this.bind(function (query) {
                    var data = { results: [], more: false },
                        term = query.term,
                        children, placeholderOption, process;

                    process=function(element, collection) {
                        var group;
                        if (element.is("option")) {
                            if (query.matcher(term, element.text(), element)) {
                                collection.push(self.optionToData(element));
                            }
                        } else if (element.is("optgroup")) {
                            group=self.optionToData(element);
                            element.children().each2(function(i, elm) { process(elm, group.children); });
                            if (group.children.length>0) {
                                collection.push(group);
                            }
                        }
                    };

                    children=element.children();

                    // ignore the placeholder option if there is one
                    if (this.getPlaceholder() !== undefined && children.length > 0) {
                        placeholderOption = this.getPlaceholderOption();
                        if (placeholderOption) {
                            children=children.not(placeholderOption);
                        }
                    }

                    children.each2(function(i, elm) { process(elm, data.results); });

                    query.callback(data);
                });
                // this is needed because inside val() we construct choices from options and their id is hardcoded
                opts.id=function(e) { return e.id; };
            } else {
                if (!("query" in opts)) {

                    if ("ajax" in opts) {
                        ajaxUrl = opts.element.data("ajax-url");
                        if (ajaxUrl && ajaxUrl.length > 0) {
                            opts.ajax.url = ajaxUrl;
                        }
                        opts.query = ajax.call(opts.element, opts.ajax);
                    } else if ("data" in opts) {
                        opts.query = local(opts.data);
                    } else if ("tags" in opts) {
                        opts.query = tags(opts.tags);
                        if (opts.createSearchChoice === undefined) {
                            opts.createSearchChoice = function (term) { return {id: $.trim(term), text: $.trim(term)}; };
                        }
                        if (opts.initSelection === undefined) {
                            opts.initSelection = function (element, callback) {
                                var data = [];
                                $(splitVal(element.val(), opts.separator)).each(function () {
                                    var obj = { id: this, text: this },
                                        tags = opts.tags;
                                    if ($.isFunction(tags)) tags=tags();
                                    $(tags).each(function() { if (equal(this.id, obj.id)) { obj = this; return false; } });
                                    data.push(obj);
                                });

                                callback(data);
                            };
                        }
                    }
                }
            }
            if (typeof(opts.query) !== "function") {
                throw "query function not defined for Select2 " + opts.element.attr("id");
            }

            if (opts.createSearchChoicePosition === 'top') {
                opts.createSearchChoicePosition = function(list, item) { list.unshift(item); };
            }
            else if (opts.createSearchChoicePosition === 'bottom') {
                opts.createSearchChoicePosition = function(list, item) { list.push(item); };
            }
            else if (typeof(opts.createSearchChoicePosition) !== "function")  {
                throw "invalid createSearchChoicePosition option must be 'top', 'bottom' or a custom function";
            }

            return opts;
        },

        /**
         * Monitor the original element for changes and update select2 accordingly
         */
        // abstract
        monitorSource: function () {
            var el = this.opts.element, observer, self = this;

            el.on("change.select2", this.bind(function (e) {
                if (this.opts.element.data("select2-change-triggered") !== true) {
                    this.initSelection();
                }
            }));

            this._sync = this.bind(function () {

                // sync enabled state
                var disabled = el.prop("disabled");
                if (disabled === undefined) disabled = false;
                this.enable(!disabled);

                var readonly = el.prop("readonly");
                if (readonly === undefined) readonly = false;
                this.readonly(readonly);

                syncCssClasses(this.container, this.opts.element, this.opts.adaptContainerCssClass);
                this.container.addClass(evaluate(this.opts.containerCssClass, this.opts.element));

                syncCssClasses(this.dropdown, this.opts.element, this.opts.adaptDropdownCssClass);
                this.dropdown.addClass(evaluate(this.opts.dropdownCssClass, this.opts.element));

            });

            // IE8-10 (IE9/10 won't fire propertyChange via attachEventListener)
            if (el.length && el[0].attachEvent) {
                el.each(function() {
                    this.attachEvent("onpropertychange", self._sync);
                });
            }

            // safari, chrome, firefox, IE11
            observer = window.MutationObserver || window.WebKitMutationObserver|| window.MozMutationObserver;
            if (observer !== undefined) {
                if (this.propertyObserver) { delete this.propertyObserver; this.propertyObserver = null; }
                this.propertyObserver = new observer(function (mutations) {
                    $.each(mutations, self._sync);
                });
                this.propertyObserver.observe(el.get(0), { attributes:true, subtree:false });
            }
        },

        // abstract
        triggerSelect: function(data) {
            var evt = $.Event("select2-selecting", { val: this.id(data), object: data, choice: data });
            this.opts.element.trigger(evt);
            return !evt.isDefaultPrevented();
        },

        /**
         * Triggers the change event on the source element
         */
        // abstract
        triggerChange: function (details) {

            details = details || {};
            details= $.extend({}, details, { type: "change", val: this.val() });
            // prevents recursive triggering
            this.opts.element.data("select2-change-triggered", true);
            this.opts.element.trigger(details);
            this.opts.element.data("select2-change-triggered", false);

            // some validation frameworks ignore the change event and listen instead to keyup, click for selects
            // so here we trigger the click event manually
            this.opts.element.click();

            // ValidationEngine ignores the change event and listens instead to blur
            // so here we trigger the blur event manually if so desired
            if (this.opts.blurOnChange)
                this.opts.element.blur();
        },

        //abstract
        isInterfaceEnabled: function()
        {
            return this.enabledInterface === true;
        },

        // abstract
        enableInterface: function() {
            var enabled = this._enabled && !this._readonly,
                disabled = !enabled;

            if (enabled === this.enabledInterface) return false;

            this.container.toggleClass("select2-container-disabled", disabled);
            this.close();
            this.enabledInterface = enabled;

            return true;
        },

        // abstract
        enable: function(enabled) {
            if (enabled === undefined) enabled = true;
            if (this._enabled === enabled) return;
            this._enabled = enabled;

            this.opts.element.prop("disabled", !enabled);
            this.enableInterface();
        },

        // abstract
        disable: function() {
            this.enable(false);
        },

        // abstract
        readonly: function(enabled) {
            if (enabled === undefined) enabled = false;
            if (this._readonly === enabled) return;
            this._readonly = enabled;

            this.opts.element.prop("readonly", enabled);
            this.enableInterface();
        },

        // abstract
        opened: function () {
            return (this.container) ? this.container.hasClass("select2-dropdown-open") : false;
        },

        // abstract
        positionDropdown: function() {
            var $dropdown = this.dropdown,
                offset = this.container.offset(),
                height = this.container.outerHeight(false),
                width = this.container.outerWidth(false),
                dropHeight = $dropdown.outerHeight(false),
                $window = $(window),
                windowWidth = $window.width(),
                windowHeight = $window.height(),
                viewPortRight = $window.scrollLeft() + windowWidth,
                viewportBottom = $window.scrollTop() + windowHeight,
                dropTop = offset.top + height,
                dropLeft = offset.left,
                enoughRoomBelow = dropTop + dropHeight <= viewportBottom,
                enoughRoomAbove = (offset.top - dropHeight) >= $window.scrollTop(),
                dropWidth = $dropdown.outerWidth(false),
                enoughRoomOnRight = dropLeft + dropWidth <= viewPortRight,
                aboveNow = $dropdown.hasClass("select2-drop-above"),
                bodyOffset,
                above,
                changeDirection,
                css,
                resultsListNode;

            // always prefer the current above/below alignment, unless there is not enough room
            if (aboveNow) {
                above = true;
                if (!enoughRoomAbove && enoughRoomBelow) {
                    changeDirection = true;
                    above = false;
                }
            } else {
                above = false;
                if (!enoughRoomBelow && enoughRoomAbove) {
                    changeDirection = true;
                    above = true;
                }
            }

            //if we are changing direction we need to get positions when dropdown is hidden;
            if (changeDirection) {
                $dropdown.hide();
                offset = this.container.offset();
                height = this.container.outerHeight(false);
                width = this.container.outerWidth(false);
                dropHeight = $dropdown.outerHeight(false);
                viewPortRight = $window.scrollLeft() + windowWidth;
                viewportBottom = $window.scrollTop() + windowHeight;
                dropTop = offset.top + height;
                dropLeft = offset.left;
                dropWidth = $dropdown.outerWidth(false);
                enoughRoomOnRight = dropLeft + dropWidth <= viewPortRight;
                $dropdown.show();

                // fix so the cursor does not move to the left within the search-textbox in IE
                this.focusSearch();
            }

            if (this.opts.dropdownAutoWidth) {
                resultsListNode = $('.select2-results', $dropdown)[0];
                $dropdown.addClass('select2-drop-auto-width');
                $dropdown.css('width', '');
                // Add scrollbar width to dropdown if vertical scrollbar is present
                dropWidth = $dropdown.outerWidth(false) + (resultsListNode.scrollHeight === resultsListNode.clientHeight ? 0 : scrollBarDimensions.width);
                dropWidth > width ? width = dropWidth : dropWidth = width;
                dropHeight = $dropdown.outerHeight(false);
                enoughRoomOnRight = dropLeft + dropWidth <= viewPortRight;
            }
            else {
                this.container.removeClass('select2-drop-auto-width');
            }

            //console.log("below/ droptop:", dropTop, "dropHeight", dropHeight, "sum", (dropTop+dropHeight)+" viewport bottom", viewportBottom, "enough?", enoughRoomBelow);
            //console.log("above/ offset.top", offset.top, "dropHeight", dropHeight, "top", (offset.top-dropHeight), "scrollTop", this.body.scrollTop(), "enough?", enoughRoomAbove);

            // fix positioning when body has an offset and is not position: static
            if (this.body.css('position') !== 'static') {
                bodyOffset = this.body.offset();
                dropTop -= bodyOffset.top;
                dropLeft -= bodyOffset.left;
            }

            if (!enoughRoomOnRight) {
                dropLeft = offset.left + this.container.outerWidth(false) - dropWidth;
            }

            css =  {
                left: dropLeft,
                width: width
            };

            if (above) {
                css.top = offset.top - dropHeight;
                css.bottom = 'auto';
                this.container.addClass("select2-drop-above");
                $dropdown.addClass("select2-drop-above");
            }
            else {
                css.top = dropTop;
                css.bottom = 'auto';
                this.container.removeClass("select2-drop-above");
                $dropdown.removeClass("select2-drop-above");
            }
            css = $.extend(css, evaluate(this.opts.dropdownCss, this.opts.element));

            $dropdown.css(css);
        },

        // abstract
        shouldOpen: function() {
            var event;

            if (this.opened()) return false;

            if (this._enabled === false || this._readonly === true) return false;

            event = $.Event("select2-opening");
            this.opts.element.trigger(event);
            return !event.isDefaultPrevented();
        },

        // abstract
        clearDropdownAlignmentPreference: function() {
            // clear the classes used to figure out the preference of where the dropdown should be opened
            this.container.removeClass("select2-drop-above");
            this.dropdown.removeClass("select2-drop-above");
        },

        /**
         * Opens the dropdown
         *
         * @return {Boolean} whether or not dropdown was opened. This method will return false if, for example,
         * the dropdown is already open, or if the 'open' event listener on the element called preventDefault().
         */
        // abstract
        open: function () {

            if (!this.shouldOpen()) return false;

            this.opening();

            // Only bind the document mousemove when the dropdown is visible
            $document.on("mousemove.select2Event", function (e) {
                lastMousePosition.x = e.pageX;
                lastMousePosition.y = e.pageY;
            });

            return true;
        },

        /**
         * Performs the opening of the dropdown
         */
        // abstract
        opening: function() {
            var cid = this.containerEventName,
                scroll = "scroll." + cid,
                resize = "resize."+cid,
                orient = "orientationchange."+cid,
                mask;

            this.container.addClass("select2-dropdown-open").addClass("select2-container-active");

            this.clearDropdownAlignmentPreference();

            if(this.dropdown[0] !== this.body.children().last()[0]) {
                this.dropdown.detach().appendTo(this.body);
            }

            // create the dropdown mask if doesn't already exist
            mask = $("#select2-drop-mask");
            if (mask.length == 0) {
                mask = $(document.createElement("div"));
                mask.attr("id","select2-drop-mask").attr("class","select2-drop-mask");
                mask.hide();
                mask.appendTo(this.body);
                mask.on("mousedown touchstart click", function (e) {
                    // Prevent IE from generating a click event on the body
                    reinsertElement(mask);

                    var dropdown = $("#select2-drop"), self;
                    if (dropdown.length > 0) {
                        self=dropdown.data("select2");
                        if (self.opts.selectOnBlur) {
                            self.selectHighlighted({noFocus: true});
                        }
                        self.close();
                        e.preventDefault();
                        e.stopPropagation();
                    }
                });
            }

            // ensure the mask is always right before the dropdown
            if (this.dropdown.prev()[0] !== mask[0]) {
                this.dropdown.before(mask);
            }

            // move the global id to the correct dropdown
            $("#select2-drop").removeAttr("id");
            this.dropdown.attr("id", "select2-drop");

            // show the elements
            mask.show();

            this.positionDropdown();
            this.dropdown.show();
            this.positionDropdown();

            this.dropdown.addClass("select2-drop-active");

            // attach listeners to events that can change the position of the container and thus require
            // the position of the dropdown to be updated as well so it does not come unglued from the container
            var that = this;
            this.container.parents().add(window).each(function () {
                $(this).on(resize+" "+scroll+" "+orient, function (e) {
                    if (that.opened()) that.positionDropdown();
                });
            });


        },

        // abstract
        close: function () {
            if (!this.opened()) return;

            var cid = this.containerEventName,
                scroll = "scroll." + cid,
                resize = "resize."+cid,
                orient = "orientationchange."+cid;

            // unbind event listeners
            this.container.parents().add(window).each(function () { $(this).off(scroll).off(resize).off(orient); });

            this.clearDropdownAlignmentPreference();

            $("#select2-drop-mask").hide();
            this.dropdown.removeAttr("id"); // only the active dropdown has the select2-drop id
            this.dropdown.hide();
            this.container.removeClass("select2-dropdown-open").removeClass("select2-container-active");
            this.results.empty();

            // Now that the dropdown is closed, unbind the global document mousemove event
            $document.off("mousemove.select2Event");

            this.clearSearch();
            this.search.removeClass("select2-active");
            this.opts.element.trigger($.Event("select2-close"));
        },

        /**
         * Opens control, sets input value, and updates results.
         */
        // abstract
        externalSearch: function (term) {
            this.open();
            this.search.val(term);
            this.updateResults(false);
        },

        // abstract
        clearSearch: function () {

        },

        //abstract
        getMaximumSelectionSize: function() {
            return evaluate(this.opts.maximumSelectionSize, this.opts.element);
        },

        // abstract
        ensureHighlightVisible: function () {
            var results = this.results, children, index, child, hb, rb, y, more, topOffset;

            index = this.highlight();

            if (index < 0) return;

            if (index == 0) {

                // if the first element is highlighted scroll all the way to the top,
                // that way any unselectable headers above it will also be scrolled
                // into view

                results.scrollTop(0);
                return;
            }

            children = this.findHighlightableChoices().find('.select2-result-label');

            child = $(children[index]);

            topOffset = (child.offset() || {}).top || 0;

            hb = topOffset + child.outerHeight(true);

            // if this is the last child lets also make sure select2-more-results is visible
            if (index === children.length - 1) {
                more = results.find("li.select2-more-results");
                if (more.length > 0) {
                    hb = more.offset().top + more.outerHeight(true);
                }
            }

            rb = results.offset().top + results.outerHeight(true);
            if (hb > rb) {
                results.scrollTop(results.scrollTop() + (hb - rb));
            }
            y = topOffset - results.offset().top;

            // make sure the top of the element is visible
            if (y < 0 && child.css('display') != 'none' ) {
                results.scrollTop(results.scrollTop() + y); // y is negative
            }
        },

        // abstract
        findHighlightableChoices: function() {
            return this.results.find(".select2-result-selectable:not(.select2-disabled):not(.select2-selected)");
        },

        // abstract
        moveHighlight: function (delta) {
            var choices = this.findHighlightableChoices(),
                index = this.highlight();

            while (index > -1 && index < choices.length) {
                index += delta;
                var choice = $(choices[index]);
                if (choice.hasClass("select2-result-selectable") && !choice.hasClass("select2-disabled") && !choice.hasClass("select2-selected")) {
                    this.highlight(index);
                    break;
                }
            }
        },

        // abstract
        highlight: function (index) {
            var choices = this.findHighlightableChoices(),
                choice,
                data;

            if (arguments.length === 0) {
                return indexOf(choices.filter(".select2-highlighted")[0], choices.get());
            }

            if (index >= choices.length) index = choices.length - 1;
            if (index < 0) index = 0;

            this.removeHighlight();

            choice = $(choices[index]);
            choice.addClass("select2-highlighted");

            // ensure assistive technology can determine the active choice
            this.search.attr("aria-activedescendant", choice.find(".select2-result-label").attr("id"));

            this.ensureHighlightVisible();

            this.liveRegion.text(choice.text());

            data = choice.data("select2-data");
            if (data) {
                this.opts.element.trigger({ type: "select2-highlight", val: this.id(data), choice: data });
            }
        },

        removeHighlight: function() {
            this.results.find(".select2-highlighted").removeClass("select2-highlighted");
        },

        touchMoved: function() {
            this._touchMoved = true;
        },

        clearTouchMoved: function() {
          this._touchMoved = false;
        },

        // abstract
        countSelectableResults: function() {
            return this.findHighlightableChoices().length;
        },

        // abstract
        highlightUnderEvent: function (event) {
            var el = $(event.target).closest(".select2-result-selectable");
            if (el.length > 0 && !el.is(".select2-highlighted")) {
                var choices = this.findHighlightableChoices();
                this.highlight(choices.index(el));
            } else if (el.length == 0) {
                // if we are over an unselectable item remove all highlights
                this.removeHighlight();
            }
        },

        // abstract
        loadMoreIfNeeded: function () {
            var results = this.results,
                more = results.find("li.select2-more-results"),
                below, // pixels the element is below the scroll fold, below==0 is when the element is starting to be visible
                page = this.resultsPage + 1,
                self=this,
                term=this.search.val(),
                context=this.context;

            if (more.length === 0) return;
            below = more.offset().top - results.offset().top - results.height();

            if (below <= this.opts.loadMorePadding) {
                more.addClass("select2-active");
                this.opts.query({
                        element: this.opts.element,
                        term: term,
                        page: page,
                        context: context,
                        matcher: this.opts.matcher,
                        callback: this.bind(function (data) {

                    // ignore a response if the select2 has been closed before it was received
                    if (!self.opened()) return;


                    self.opts.populateResults.call(this, results, data.results, {term: term, page: page, context:context});
                    self.postprocessResults(data, false, false);

                    if (data.more===true) {
                        more.detach().appendTo(results).text(evaluate(self.opts.formatLoadMore, self.opts.element, page+1));
                        window.setTimeout(function() { self.loadMoreIfNeeded(); }, 10);
                    } else {
                        more.remove();
                    }
                    self.positionDropdown();
                    self.resultsPage = page;
                    self.context = data.context;
                    this.opts.element.trigger({ type: "select2-loaded", items: data });
                })});
            }
        },

        /**
         * Default tokenizer function which does nothing
         */
        tokenize: function() {

        },

        /**
         * @param initial whether or not this is the call to this method right after the dropdown has been opened
         */
        // abstract
        updateResults: function (initial) {
            var search = this.search,
                results = this.results,
                opts = this.opts,
                data,
                self = this,
                input,
                term = search.val(),
                lastTerm = $.data(this.container, "select2-last-term"),
                // sequence number used to drop out-of-order responses
                queryNumber;

            // prevent duplicate queries against the same term
            if (initial !== true && lastTerm && equal(term, lastTerm)) return;

            $.data(this.container, "select2-last-term", term);

            // if the search is currently hidden we do not alter the results
            if (initial !== true && (this.showSearchInput === false || !this.opened())) {
                return;
            }

            function postRender() {
                search.removeClass("select2-active");
                self.positionDropdown();
                if (results.find('.select2-no-results,.select2-selection-limit,.select2-searching').length) {
                    self.liveRegion.text(results.text());
                }
                else {
                    self.liveRegion.text(self.opts.formatMatches(results.find('.select2-result-selectable').length));
                }
            }

            function render(html) {
                results.html(html);
                postRender();
            }

            queryNumber = ++this.queryCount;

            var maxSelSize = this.getMaximumSelectionSize();
            if (maxSelSize >=1) {
                data = this.data();
                if ($.isArray(data) && data.length >= maxSelSize && checkFormatter(opts.formatSelectionTooBig, "formatSelectionTooBig")) {
                    render("<li class='select2-selection-limit'>" + evaluate(opts.formatSelectionTooBig, opts.element, maxSelSize) + "</li>");
                    return;
                }
            }

            if (search.val().length < opts.minimumInputLength) {
                if (checkFormatter(opts.formatInputTooShort, "formatInputTooShort")) {
                    render("<li class='select2-no-results'>" + evaluate(opts.formatInputTooShort, opts.element, search.val(), opts.minimumInputLength) + "</li>");
                } else {
                    render("");
                }
                if (initial && this.showSearch) this.showSearch(true);
                return;
            }

            if (opts.maximumInputLength && search.val().length > opts.maximumInputLength) {
                if (checkFormatter(opts.formatInputTooLong, "formatInputTooLong")) {
                    render("<li class='select2-no-results'>" + evaluate(opts.formatInputTooLong, opts.element, search.val(), opts.maximumInputLength) + "</li>");
                } else {
                    render("");
                }
                return;
            }

            if (opts.formatSearching && this.findHighlightableChoices().length === 0) {
                render("<li class='select2-searching'>" + evaluate(opts.formatSearching, opts.element) + "</li>");
            }

            search.addClass("select2-active");

            this.removeHighlight();

            // give the tokenizer a chance to pre-process the input
            input = this.tokenize();
            if (input != undefined && input != null) {
                search.val(input);
            }

            this.resultsPage = 1;

            opts.query({
                element: opts.element,
                    term: search.val(),
                    page: this.resultsPage,
                    context: null,
                    matcher: opts.matcher,
                    callback: this.bind(function (data) {
                var def; // default choice

                // ignore old responses
                if (queryNumber != this.queryCount) {
                  return;
                }

                // ignore a response if the select2 has been closed before it was received
                if (!this.opened()) {
                    this.search.removeClass("select2-active");
                    return;
                }

                // handle ajax error
                if(data.hasError !== undefined && checkFormatter(opts.formatAjaxError, "formatAjaxError")) {
                    render("<li class='select2-ajax-error'>" + evaluate(opts.formatAjaxError, opts.element, data.jqXHR, data.textStatus, data.errorThrown) + "</li>");
                    return;
                }

                // save context, if any
                this.context = (data.context===undefined) ? null : data.context;
                // create a default choice and prepend it to the list
                if (this.opts.createSearchChoice && search.val() !== "") {
                    def = this.opts.createSearchChoice.call(self, search.val(), data.results);
                    if (def !== undefined && def !== null && self.id(def) !== undefined && self.id(def) !== null) {
                        if ($(data.results).filter(
                            function () {
                                return equal(self.id(this), self.id(def));
                            }).length === 0) {
                            this.opts.createSearchChoicePosition(data.results, def);
                        }
                    }
                }

                if (data.results.length === 0 && checkFormatter(opts.formatNoMatches, "formatNoMatches")) {
                    render("<li class='select2-no-results'>" + evaluate(opts.formatNoMatches, opts.element, search.val()) + "</li>");
                    return;
                }

                results.empty();
                self.opts.populateResults.call(this, results, data.results, {term: search.val(), page: this.resultsPage, context:null});

                if (data.more === true && checkFormatter(opts.formatLoadMore, "formatLoadMore")) {
                    results.append("<li class='select2-more-results'>" + opts.escapeMarkup(evaluate(opts.formatLoadMore, opts.element, this.resultsPage)) + "</li>");
                    window.setTimeout(function() { self.loadMoreIfNeeded(); }, 10);
                }

                this.postprocessResults(data, initial);

                postRender();

                this.opts.element.trigger({ type: "select2-loaded", items: data });
            })});
        },

        // abstract
        cancel: function () {
            this.close();
        },

        // abstract
        blur: function () {
            // if selectOnBlur == true, select the currently highlighted option
            if (this.opts.selectOnBlur)
                this.selectHighlighted({noFocus: true});

            this.close();
            this.container.removeClass("select2-container-active");
            // synonymous to .is(':focus'), which is available in jquery >= 1.6
            if (this.search[0] === document.activeElement) { this.search.blur(); }
            this.clearSearch();
            this.selection.find(".select2-search-choice-focus").removeClass("select2-search-choice-focus");
        },

        // abstract
        focusSearch: function () {
            focus(this.search);
        },

        // abstract
        selectHighlighted: function (options) {
            if (this._touchMoved) {
              this.clearTouchMoved();
              return;
            }
            var index=this.highlight(),
                highlighted=this.results.find(".select2-highlighted"),
                data = highlighted.closest('.select2-result').data("select2-data");

            if (data) {
                this.highlight(index);
                this.onSelect(data, options);
            } else if (options && options.noFocus) {
                this.close();
            }
        },

        // abstract
        getPlaceholder: function () {
            var placeholderOption;
            return this.opts.element.attr("placeholder") ||
                this.opts.element.attr("data-placeholder") || // jquery 1.4 compat
                this.opts.element.data("placeholder") ||
                this.opts.placeholder ||
                ((placeholderOption = this.getPlaceholderOption()) !== undefined ? placeholderOption.text() : undefined);
        },

        // abstract
        getPlaceholderOption: function() {
            if (this.select) {
                var firstOption = this.select.children('option').first();
                if (this.opts.placeholderOption !== undefined ) {
                    //Determine the placeholder option based on the specified placeholderOption setting
                    return (this.opts.placeholderOption === "first" && firstOption) ||
                           (typeof this.opts.placeholderOption === "function" && this.opts.placeholderOption(this.select));
                } else if ($.trim(firstOption.text()) === "" && firstOption.val() === "") {
                    //No explicit placeholder option specified, use the first if it's blank
                    return firstOption;
                }
            }
        },

        /**
         * Get the desired width for the container element.  This is
         * derived first from option `width` passed to select2, then
         * the inline 'style' on the original element, and finally
         * falls back to the jQuery calculated element width.
         */
        // abstract
        initContainerWidth: function () {
            function resolveContainerWidth() {
                var style, attrs, matches, i, l, attr;

                if (this.opts.width === "off") {
                    return null;
                } else if (this.opts.width === "element"){
                    return this.opts.element.outerWidth(false) === 0 ? 'auto' : this.opts.element.outerWidth(false) + 'px';
                } else if (this.opts.width === "copy" || this.opts.width === "resolve") {
                    // check if there is inline style on the element that contains width
                    style = this.opts.element.attr('style');
                    if (style !== undefined) {
                        attrs = style.split(';');
                        for (i = 0, l = attrs.length; i < l; i = i + 1) {
                            attr = attrs[i].replace(/\s/g, '');
                            matches = attr.match(/^width:(([-+]?([0-9]*\.)?[0-9]+)(px|em|ex|%|in|cm|mm|pt|pc))/i);
                            if (matches !== null && matches.length >= 1)
                                return matches[1];
                        }
                    }

                    if (this.opts.width === "resolve") {
                        // next check if css('width') can resolve a width that is percent based, this is sometimes possible
                        // when attached to input type=hidden or elements hidden via css
                        style = this.opts.element.css('width');
                        if (style.indexOf("%") > 0) return style;

                        // finally, fallback on the calculated width of the element
                        return (this.opts.element.outerWidth(false) === 0 ? 'auto' : this.opts.element.outerWidth(false) + 'px');
                    }

                    return null;
                } else if ($.isFunction(this.opts.width)) {
                    return this.opts.width();
                } else {
                    return this.opts.width;
               }
            };

            var width = resolveContainerWidth.call(this);
            if (width !== null) {
                this.container.css("width", width);
            }
        }
    });

    SingleSelect2 = clazz(AbstractSelect2, {

        // single

        createContainer: function () {
            var container = $(document.createElement("div")).attr({
                "class": "select2-container"
            }).html([
                "<a href='javascript:void(0)' class='select2-choice' tabindex='-1'>",
                "   <span class='select2-chosen'>&#160;</span><abbr class='select2-search-choice-close'></abbr>",
                "   <span class='select2-arrow' role='presentation'><b role='presentation'></b></span>",
                "</a>",
                "<label for='' class='select2-offscreen'></label>",
                "<input class='select2-focusser select2-offscreen' type='text' aria-haspopup='true' role='button' />",
                "<div class='select2-drop select2-display-none'>",
                "   <div class='select2-search'>",
                "       <label for='' class='select2-offscreen'></label>",
                "       <input type='text' autocomplete='off' autocorrect='off' autocapitalize='off' spellcheck='false' class='select2-input' role='combobox' aria-expanded='true'",
                "       aria-autocomplete='list' />",
                "   </div>",
                "   <ul class='select2-results' role='listbox'>",
                "   </ul>",
                "</div>"].join(""));
            return container;
        },

        // single
        enableInterface: function() {
            if (this.parent.enableInterface.apply(this, arguments)) {
                this.focusser.prop("disabled", !this.isInterfaceEnabled());
            }
        },

        // single
        opening: function () {
            var el, range, len;

            if (this.opts.minimumResultsForSearch >= 0) {
                this.showSearch(true);
            }

            this.parent.opening.apply(this, arguments);

            if (this.showSearchInput !== false) {
                // IE appends focusser.val() at the end of field :/ so we manually insert it at the beginning using a range
                // all other browsers handle this just fine

                this.search.val(this.focusser.val());
            }
            if (this.opts.shouldFocusInput(this)) {
                this.search.focus();
                // move the cursor to the end after focussing, otherwise it will be at the beginning and
                // new text will appear *before* focusser.val()
                el = this.search.get(0);
                if (el.createTextRange) {
                    range = el.createTextRange();
                    range.collapse(false);
                    range.select();
                } else if (el.setSelectionRange) {
                    len = this.search.val().length;
                    el.setSelectionRange(len, len);
                }
            }

            // initializes search's value with nextSearchTerm (if defined by user)
            // ignore nextSearchTerm if the dropdown is opened by the user pressing a letter
            if(this.search.val() === "") {
                if(this.nextSearchTerm != undefined){
                    this.search.val(this.nextSearchTerm);
                    this.search.select();
                }
            }

            this.focusser.prop("disabled", true).val("");
            this.updateResults(true);
            this.opts.element.trigger($.Event("select2-open"));
        },

        // single
        close: function () {
            if (!this.opened()) return;
            this.parent.close.apply(this, arguments);

            this.focusser.prop("disabled", false);

            if (this.opts.shouldFocusInput(this)) {
                this.focusser.focus();
            }
        },

        // single
        focus: function () {
            if (this.opened()) {
                this.close();
            } else {
                this.focusser.prop("disabled", false);
                if (this.opts.shouldFocusInput(this)) {
                    this.focusser.focus();
                }
            }
        },

        // single
        isFocused: function () {
            return this.container.hasClass("select2-container-active");
        },

        // single
        cancel: function () {
            this.parent.cancel.apply(this, arguments);
            this.focusser.prop("disabled", false);

            if (this.opts.shouldFocusInput(this)) {
                this.focusser.focus();
            }
        },

        // single
        destroy: function() {
            $("label[for='" + this.focusser.attr('id') + "']")
                .attr('for', this.opts.element.attr("id"));
            this.parent.destroy.apply(this, arguments);

            cleanupJQueryElements.call(this,
                "selection",
                "focusser"
            );
        },

        // single
        initContainer: function () {

            var selection,
                container = this.container,
                dropdown = this.dropdown,
                idSuffix = nextUid(),
                elementLabel;

            if (this.opts.minimumResultsForSearch < 0) {
                this.showSearch(false);
            } else {
                this.showSearch(true);
            }

            this.selection = selection = container.find(".select2-choice");

            this.focusser = container.find(".select2-focusser");

            // add aria associations
            selection.find(".select2-chosen").attr("id", "select2-chosen-"+idSuffix);
            this.focusser.attr("aria-labelledby", "select2-chosen-"+idSuffix);
            this.results.attr("id", "select2-results-"+idSuffix);
            this.search.attr("aria-owns", "select2-results-"+idSuffix);

            // rewrite labels from original element to focusser
            this.focusser.attr("id", "s2id_autogen"+idSuffix);

            elementLabel = $("label[for='" + this.opts.element.attr("id") + "']");

            this.focusser.prev()
                .text(elementLabel.text())
                .attr('for', this.focusser.attr('id'));

            // Ensure the original element retains an accessible name
            var originalTitle = this.opts.element.attr("title");
            this.opts.element.attr("title", (originalTitle || elementLabel.text()));

            this.focusser.attr("tabindex", this.elementTabIndex);

            // write label for search field using the label from the focusser element
            this.search.attr("id", this.focusser.attr('id') + '_search');

            this.search.prev()
                .text($("label[for='" + this.focusser.attr('id') + "']").text())
                .attr('for', this.search.attr('id'));

            this.search.on("keydown", this.bind(function (e) {
                if (!this.isInterfaceEnabled()) return;

                // filter 229 keyCodes (input method editor is processing key input)
                if (229 == e.keyCode) return;

                if (e.which === KEY.PAGE_UP || e.which === KEY.PAGE_DOWN) {
                    // prevent the page from scrolling
                    killEvent(e);
                    return;
                }

                switch (e.which) {
                    case KEY.UP:
                    case KEY.DOWN:
                        this.moveHighlight((e.which === KEY.UP) ? -1 : 1);
                        killEvent(e);
                        return;
                    case KEY.ENTER:
                        this.selectHighlighted();
                        killEvent(e);
                        return;
                    case KEY.TAB:
                        this.selectHighlighted({noFocus: true});
                        return;
                    case KEY.ESC:
                        this.cancel(e);
                        killEvent(e);
                        return;
                }
            }));

            this.search.on("blur", this.bind(function(e) {
                // a workaround for chrome to keep the search field focussed when the scroll bar is used to scroll the dropdown.
                // without this the search field loses focus which is annoying
                if (document.activeElement === this.body.get(0)) {
                    window.setTimeout(this.bind(function() {
                        if (this.opened()) {
                            this.search.focus();
                        }
                    }), 0);
                }
            }));

            this.focusser.on("keydown", this.bind(function (e) {
                if (!this.isInterfaceEnabled()) return;

                if (e.which === KEY.TAB || KEY.isControl(e) || KEY.isFunctionKey(e) || e.which === KEY.ESC) {
                    return;
                }

                if (this.opts.openOnEnter === false && e.which === KEY.ENTER) {
                    killEvent(e);
                    return;
                }

                if (e.which == KEY.DOWN || e.which == KEY.UP
                    || (e.which == KEY.ENTER && this.opts.openOnEnter)) {

                    if (e.altKey || e.ctrlKey || e.shiftKey || e.metaKey) return;

                    this.open();
                    killEvent(e);
                    return;
                }

                if (e.which == KEY.DELETE || e.which == KEY.BACKSPACE) {
                    if (this.opts.allowClear) {
                        this.clear();
                    }
                    killEvent(e);
                    return;
                }
            }));


            installKeyUpChangeEvent(this.focusser);
            this.focusser.on("keyup-change input", this.bind(function(e) {
                if (this.opts.minimumResultsForSearch >= 0) {
                    e.stopPropagation();
                    if (this.opened()) return;
                    this.open();
                }
            }));

            selection.on("mousedown touchstart", "abbr", this.bind(function (e) {
                if (!this.isInterfaceEnabled()) return;
                this.clear();
                killEventImmediately(e);
                this.close();
                this.selection.focus();
            }));

            selection.on("mousedown touchstart", this.bind(function (e) {
                // Prevent IE from generating a click event on the body
                reinsertElement(selection);

                if (!this.container.hasClass("select2-container-active")) {
                    this.opts.element.trigger($.Event("select2-focus"));
                }

                if (this.opened()) {
                    this.close();
                } else if (this.isInterfaceEnabled()) {
                    this.open();
                }

                killEvent(e);
            }));

            dropdown.on("mousedown touchstart", this.bind(function() {
                if (this.opts.shouldFocusInput(this)) {
                    this.search.focus();
                }
            }));

            selection.on("focus", this.bind(function(e) {
                killEvent(e);
            }));

            this.focusser.on("focus", this.bind(function(){
                if (!this.container.hasClass("select2-container-active")) {
                    this.opts.element.trigger($.Event("select2-focus"));
                }
                this.container.addClass("select2-container-active");
            })).on("blur", this.bind(function() {
                if (!this.opened()) {
                    this.container.removeClass("select2-container-active");
                    this.opts.element.trigger($.Event("select2-blur"));
                }
            }));
            this.search.on("focus", this.bind(function(){
                if (!this.container.hasClass("select2-container-active")) {
                    this.opts.element.trigger($.Event("select2-focus"));
                }
                this.container.addClass("select2-container-active");
            }));

            this.initContainerWidth();
            this.opts.element.addClass("select2-offscreen");
            this.setPlaceholder();

        },

        // single
        clear: function(triggerChange) {
            var data=this.selection.data("select2-data");
            if (data) { // guard against queued quick consecutive clicks
                var evt = $.Event("select2-clearing");
                this.opts.element.trigger(evt);
                if (evt.isDefaultPrevented()) {
                    return;
                }
                var placeholderOption = this.getPlaceholderOption();
                this.opts.element.val(placeholderOption ? placeholderOption.val() : "");
                this.selection.find(".select2-chosen").empty();
                this.selection.removeData("select2-data");
                this.setPlaceholder();

                if (triggerChange !== false){
                    this.opts.element.trigger({ type: "select2-removed", val: this.id(data), choice: data });
                    this.triggerChange({removed:data});
                }
            }
        },

        /**
         * Sets selection based on source element's value
         */
        // single
        initSelection: function () {
            var selected;
            if (this.isPlaceholderOptionSelected()) {
                this.updateSelection(null);
                this.close();
                this.setPlaceholder();
            } else {
                var self = this;
                this.opts.initSelection.call(null, this.opts.element, function(selected){
                    if (selected !== undefined && selected !== null) {
                        self.updateSelection(selected);
                        self.close();
                        self.setPlaceholder();
                        self.nextSearchTerm = self.opts.nextSearchTerm(selected, self.search.val());
                    }
                });
            }
        },

        isPlaceholderOptionSelected: function() {
            var placeholderOption;
            if (this.getPlaceholder() === undefined) return false; // no placeholder specified so no option should be considered
            return ((placeholderOption = this.getPlaceholderOption()) !== undefined && placeholderOption.prop("selected"))
                || (this.opts.element.val() === "")
                || (this.opts.element.val() === undefined)
                || (this.opts.element.val() === null);
        },

        // single
        prepareOpts: function () {
            var opts = this.parent.prepareOpts.apply(this, arguments),
                self=this;

            if (opts.element.get(0).tagName.toLowerCase() === "select") {
                // install the selection initializer
                opts.initSelection = function (element, callback) {
                    var selected = element.find("option").filter(function() { return this.selected && !this.disabled });
                    // a single select box always has a value, no need to null check 'selected'
                    callback(self.optionToData(selected));
                };
            } else if ("data" in opts) {
                // install default initSelection when applied to hidden input and data is local
                opts.initSelection = opts.initSelection || function (element, callback) {
                    var id = element.val();
                    //search in data by id, storing the actual matching item
                    var match = null;
                    opts.query({
                        matcher: function(term, text, el){
                            var is_match = equal(id, opts.id(el));
                            if (is_match) {
                                match = el;
                            }
                            return is_match;
                        },
                        callback: !$.isFunction(callback) ? $.noop : function() {
                            callback(match);
                        }
                    });
                };
            }

            return opts;
        },

        // single
        getPlaceholder: function() {
            // if a placeholder is specified on a single select without a valid placeholder option ignore it
            if (this.select) {
                if (this.getPlaceholderOption() === undefined) {
                    return undefined;
                }
            }

            return this.parent.getPlaceholder.apply(this, arguments);
        },

        // single
        setPlaceholder: function () {
            var placeholder = this.getPlaceholder();

            if (this.isPlaceholderOptionSelected() && placeholder !== undefined) {

                // check for a placeholder option if attached to a select
                if (this.select && this.getPlaceholderOption() === undefined) return;

                this.selection.find(".select2-chosen").html(this.opts.escapeMarkup(placeholder));

                this.selection.addClass("select2-default");

                this.container.removeClass("select2-allowclear");
            }
        },

        // single
        postprocessResults: function (data, initial, noHighlightUpdate) {
            var selected = 0, self = this, showSearchInput = true;

            // find the selected element in the result list

            this.findHighlightableChoices().each2(function (i, elm) {
                if (equal(self.id(elm.data("select2-data")), self.opts.element.val())) {
                    selected = i;
                    return false;
                }
            });

            // and highlight it
            if (noHighlightUpdate !== false) {
                if (initial === true && selected >= 0) {
                    this.highlight(selected);
                } else {
                    this.highlight(0);
                }
            }

            // hide the search box if this is the first we got the results and there are enough of them for search

            if (initial === true) {
                var min = this.opts.minimumResultsForSearch;
                if (min >= 0) {
                    this.showSearch(countResults(data.results) >= min);
                }
            }
        },

        // single
        showSearch: function(showSearchInput) {
            if (this.showSearchInput === showSearchInput) return;

            this.showSearchInput = showSearchInput;

            this.dropdown.find(".select2-search").toggleClass("select2-search-hidden", !showSearchInput);
            this.dropdown.find(".select2-search").toggleClass("select2-offscreen", !showSearchInput);
            //add "select2-with-searchbox" to the container if search box is shown
            $(this.dropdown, this.container).toggleClass("select2-with-searchbox", showSearchInput);
        },

        // single
        onSelect: function (data, options) {

            if (!this.triggerSelect(data)) { return; }

            var old = this.opts.element.val(),
                oldData = this.data();

            this.opts.element.val(this.id(data));
            this.updateSelection(data);

            this.opts.element.trigger({ type: "select2-selected", val: this.id(data), choice: data });

            this.nextSearchTerm = this.opts.nextSearchTerm(data, this.search.val());
            this.close();

            if ((!options || !options.noFocus) && this.opts.shouldFocusInput(this)) {
                this.focusser.focus();
            }

            if (!equal(old, this.id(data))) {
                this.triggerChange({ added: data, removed: oldData });
            }
        },

        // single
        updateSelection: function (data) {

            var container=this.selection.find(".select2-chosen"), formatted, cssClass;

            this.selection.data("select2-data", data);

            container.empty();
            if (data !== null) {
                formatted=this.opts.formatSelection(data, container, this.opts.escapeMarkup);
            }
            if (formatted !== undefined) {
                container.append(formatted);
            }
            cssClass=this.opts.formatSelectionCssClass(data, container);
            if (cssClass !== undefined) {
                container.addClass(cssClass);
            }

            this.selection.removeClass("select2-default");

            if (this.opts.allowClear && this.getPlaceholder() !== undefined) {
                this.container.addClass("select2-allowclear");
            }
        },

        // single
        val: function () {
            var val,
                triggerChange = false,
                data = null,
                self = this,
                oldData = this.data();

            if (arguments.length === 0) {
                return this.opts.element.val();
            }

            val = arguments[0];

            if (arguments.length > 1) {
                triggerChange = arguments[1];
            }

            if (this.select) {
                this.select
                    .val(val)
                    .find("option").filter(function() { return this.selected }).each2(function (i, elm) {
                        data = self.optionToData(elm);
                        return false;
                    });
                this.updateSelection(data);
                this.setPlaceholder();
                if (triggerChange) {
                    this.triggerChange({added: data, removed:oldData});
                }
            } else {
                // val is an id. !val is true for [undefined,null,'',0] - 0 is legal
                if (!val && val !== 0) {
                    this.clear(triggerChange);
                    return;
                }
                if (this.opts.initSelection === undefined) {
                    throw new Error("cannot call val() if initSelection() is not defined");
                }
                this.opts.element.val(val);
                this.opts.initSelection(this.opts.element, function(data){
                    self.opts.element.val(!data ? "" : self.id(data));
                    self.updateSelection(data);
                    self.setPlaceholder();
                    if (triggerChange) {
                        self.triggerChange({added: data, removed:oldData});
                    }
                });
            }
        },

        // single
        clearSearch: function () {
            this.search.val("");
            this.focusser.val("");
        },

        // single
        data: function(value) {
            var data,
                triggerChange = false;

            if (arguments.length === 0) {
                data = this.selection.data("select2-data");
                if (data == undefined) data = null;
                return data;
            } else {
                if (arguments.length > 1) {
                    triggerChange = arguments[1];
                }
                if (!value) {
                    this.clear(triggerChange);
                } else {
                    data = this.data();
                    this.opts.element.val(!value ? "" : this.id(value));
                    this.updateSelection(value);
                    if (triggerChange) {
                        this.triggerChange({added: value, removed:data});
                    }
                }
            }
        }
    });

    MultiSelect2 = clazz(AbstractSelect2, {

        // multi
        createContainer: function () {
            var container = $(document.createElement("div")).attr({
                "class": "select2-container select2-container-multi"
            }).html([
                "<ul class='select2-choices'>",
                "  <li class='select2-search-field'>",
                "    <label for='' class='select2-offscreen'></label>",
                "    <input type='text' autocomplete='off' autocorrect='off' autocapitalize='off' spellcheck='false' class='select2-input'>",
                "  </li>",
                "</ul>",
                "<div class='select2-drop select2-drop-multi select2-display-none'>",
                "   <ul class='select2-results'>",
                "   </ul>",
                "</div>"].join(""));
            return container;
        },

        // multi
        prepareOpts: function () {
            var opts = this.parent.prepareOpts.apply(this, arguments),
                self=this;

            // TODO validate placeholder is a string if specified

            if (opts.element.get(0).tagName.toLowerCase() === "select") {
                // install the selection initializer
                opts.initSelection = function (element, callback) {

                    var data = [];

                    element.find("option").filter(function() { return this.selected && !this.disabled }).each2(function (i, elm) {
                        data.push(self.optionToData(elm));
                    });
                    callback(data);
                };
            } else if ("data" in opts) {
                // install default initSelection when applied to hidden input and data is local
                opts.initSelection = opts.initSelection || function (element, callback) {
                    var ids = splitVal(element.val(), opts.separator);
                    //search in data by array of ids, storing matching items in a list
                    var matches = [];
                    opts.query({
                        matcher: function(term, text, el){
                            var is_match = $.grep(ids, function(id) {
                                return equal(id, opts.id(el));
                            }).length;
                            if (is_match) {
                                matches.push(el);
                            }
                            return is_match;
                        },
                        callback: !$.isFunction(callback) ? $.noop : function() {
                            // reorder matches based on the order they appear in the ids array because right now
                            // they are in the order in which they appear in data array
                            var ordered = [];
                            for (var i = 0; i < ids.length; i++) {
                                var id = ids[i];
                                for (var j = 0; j < matches.length; j++) {
                                    var match = matches[j];
                                    if (equal(id, opts.id(match))) {
                                        ordered.push(match);
                                        matches.splice(j, 1);
                                        break;
                                    }
                                }
                            }
                            callback(ordered);
                        }
                    });
                };
            }

            return opts;
        },

        // multi
        selectChoice: function (choice) {

            var selected = this.container.find(".select2-search-choice-focus");
            if (selected.length && choice && choice[0] == selected[0]) {

            } else {
                if (selected.length) {
                    this.opts.element.trigger("choice-deselected", selected);
                }
                selected.removeClass("select2-search-choice-focus");
                if (choice && choice.length) {
                    this.close();
                    choice.addClass("select2-search-choice-focus");
                    this.opts.element.trigger("choice-selected", choice);
                }
            }
        },

        // multi
        destroy: function() {
            $("label[for='" + this.search.attr('id') + "']")
                .attr('for', this.opts.element.attr("id"));
            this.parent.destroy.apply(this, arguments);

            cleanupJQueryElements.call(this,
                "searchContainer",
                "selection"
            );
        },

        // multi
        initContainer: function () {

            var selector = ".select2-choices", selection;

            this.searchContainer = this.container.find(".select2-search-field");
            this.selection = selection = this.container.find(selector);

            var _this = this;
            this.selection.on("click", ".select2-search-choice:not(.select2-locked)", function (e) {
                //killEvent(e);
                _this.search[0].focus();
                _this.selectChoice($(this));
            });

            // rewrite labels from original element to focusser
            this.search.attr("id", "s2id_autogen"+nextUid());

            this.search.prev()
                .text($("label[for='" + this.opts.element.attr("id") + "']").text())
                .attr('for', this.search.attr('id'));

            this.search.on("input paste", this.bind(function() {
                if (this.search.attr('placeholder') && this.search.val().length == 0) return;
                if (!this.isInterfaceEnabled()) return;
                if (!this.opened()) {
                    this.open();
                }
            }));

            this.search.attr("tabindex", this.elementTabIndex);

            this.keydowns = 0;
            this.search.on("keydown", this.bind(function (e) {
                if (!this.isInterfaceEnabled()) return;

                ++this.keydowns;
                var selected = selection.find(".select2-search-choice-focus");
                var prev = selected.prev(".select2-search-choice:not(.select2-locked)");
                var next = selected.next(".select2-search-choice:not(.select2-locked)");
                var pos = getCursorInfo(this.search);

                if (selected.length &&
                    (e.which == KEY.LEFT || e.which == KEY.RIGHT || e.which == KEY.BACKSPACE || e.which == KEY.DELETE || e.which == KEY.ENTER)) {
                    var selectedChoice = selected;
                    if (e.which == KEY.LEFT && prev.length) {
                        selectedChoice = prev;
                    }
                    else if (e.which == KEY.RIGHT) {
                        selectedChoice = next.length ? next : null;
                    }
                    else if (e.which === KEY.BACKSPACE) {
                        if (this.unselect(selected.first())) {
                            this.search.width(10);
                            selectedChoice = prev.length ? prev : next;
                        }
                    } else if (e.which == KEY.DELETE) {
                        if (this.unselect(selected.first())) {
                            this.search.width(10);
                            selectedChoice = next.length ? next : null;
                        }
                    } else if (e.which == KEY.ENTER) {
                        selectedChoice = null;
                    }

                    this.selectChoice(selectedChoice);
                    killEvent(e);
                    if (!selectedChoice || !selectedChoice.length) {
                        this.open();
                    }
                    return;
                } else if (((e.which === KEY.BACKSPACE && this.keydowns == 1)
                    || e.which == KEY.LEFT) && (pos.offset == 0 && !pos.length)) {

                    this.selectChoice(selection.find(".select2-search-choice:not(.select2-locked)").last());
                    killEvent(e);
                    return;
                } else {
                    this.selectChoice(null);
                }

                if (this.opened()) {
                    switch (e.which) {
                    case KEY.UP:
                    case KEY.DOWN:
                        this.moveHighlight((e.which === KEY.UP) ? -1 : 1);
                        killEvent(e);
                        return;
                    case KEY.ENTER:
                        this.selectHighlighted();
                        killEvent(e);
                        return;
                    case KEY.TAB:
                        this.selectHighlighted({noFocus:true});
                        this.close();
                        return;
                    case KEY.ESC:
                        this.cancel(e);
                        killEvent(e);
                        return;
                    }
                }

                if (e.which === KEY.TAB || KEY.isControl(e) || KEY.isFunctionKey(e)
                 || e.which === KEY.BACKSPACE || e.which === KEY.ESC) {
                    return;
                }

                if (e.which === KEY.ENTER) {
                    if (this.opts.openOnEnter === false) {
                        return;
                    } else if (e.altKey || e.ctrlKey || e.shiftKey || e.metaKey) {
                        return;
                    }
                }

                this.open();

                if (e.which === KEY.PAGE_UP || e.which === KEY.PAGE_DOWN) {
                    // prevent the page from scrolling
                    killEvent(e);
                }

                if (e.which === KEY.ENTER) {
                    // prevent form from being submitted
                    killEvent(e);
                }

            }));

            this.search.on("keyup", this.bind(function (e) {
                this.keydowns = 0;
                this.resizeSearch();
            })
            );

            this.search.on("blur", this.bind(function(e) {
                this.container.removeClass("select2-container-active");
                this.search.removeClass("select2-focused");
                this.selectChoice(null);
                if (!this.opened()) this.clearSearch();
                e.stopImmediatePropagation();
                this.opts.element.trigger($.Event("select2-blur"));
            }));

            this.container.on("click", selector, this.bind(function (e) {
                if (!this.isInterfaceEnabled()) return;
                if ($(e.target).closest(".select2-search-choice").length > 0) {
                    // clicked inside a select2 search choice, do not open
                    return;
                }
                this.selectChoice(null);
                this.clearPlaceholder();
                if (!this.container.hasClass("select2-container-active")) {
                    this.opts.element.trigger($.Event("select2-focus"));
                }
                this.open();
                this.focusSearch();
                e.preventDefault();
            }));

            this.container.on("focus", selector, this.bind(function () {
                if (!this.isInterfaceEnabled()) return;
                if (!this.container.hasClass("select2-container-active")) {
                    this.opts.element.trigger($.Event("select2-focus"));
                }
                this.container.addClass("select2-container-active");
                this.dropdown.addClass("select2-drop-active");
                this.clearPlaceholder();
            }));

            this.initContainerWidth();
            this.opts.element.addClass("select2-offscreen");

            // set the placeholder if necessary
            this.clearSearch();
        },

        // multi
        enableInterface: function() {
            if (this.parent.enableInterface.apply(this, arguments)) {
                this.search.prop("disabled", !this.isInterfaceEnabled());
            }
        },

        // multi
        initSelection: function () {
            var data;
            if (this.opts.element.val() === "" && this.opts.element.text() === "") {
                this.updateSelection([]);
                this.close();
                // set the placeholder if necessary
                this.clearSearch();
            }
            if (this.select || this.opts.element.val() !== "") {
                var self = this;
                this.opts.initSelection.call(null, this.opts.element, function(data){
                    if (data !== undefined && data !== null) {
                        self.updateSelection(data);
                        self.close();
                        // set the placeholder if necessary
                        self.clearSearch();
                    }
                });
            }
        },

        // multi
        clearSearch: function () {
            var placeholder = this.getPlaceholder(),
                maxWidth = this.getMaxSearchWidth();

            if (placeholder !== undefined  && this.getVal().length === 0 && this.search.hasClass("select2-focused") === false) {
                this.search.val(placeholder).addClass("select2-default");
                // stretch the search box to full width of the container so as much of the placeholder is visible as possible
                // we could call this.resizeSearch(), but we do not because that requires a sizer and we do not want to create one so early because of a firefox bug, see #944
                this.search.width(maxWidth > 0 ? maxWidth : this.container.css("width"));
            } else {
                this.search.val("").width(10);
            }
        },

        // multi
        clearPlaceholder: function () {
            if (this.search.hasClass("select2-default")) {
                this.search.val("").removeClass("select2-default");
            }
        },

        // multi
        opening: function () {
            this.clearPlaceholder(); // should be done before super so placeholder is not used to search
            this.resizeSearch();

            this.parent.opening.apply(this, arguments);

            this.focusSearch();

            // initializes search's value with nextSearchTerm (if defined by user)
            // ignore nextSearchTerm if the dropdown is opened by the user pressing a letter
            if(this.search.val() === "") {
                if(this.nextSearchTerm != undefined){
                    this.search.val(this.nextSearchTerm);
                    this.search.select();
                }
            }

            this.updateResults(true);
            if (this.opts.shouldFocusInput(this)) {
                this.search.focus();
            }
            this.opts.element.trigger($.Event("select2-open"));
        },

        // multi
        close: function () {
            if (!this.opened()) return;
            this.parent.close.apply(this, arguments);
        },

        // multi
        focus: function () {
            this.close();
            this.search.focus();
        },

        // multi
        isFocused: function () {
            return this.search.hasClass("select2-focused");
        },

        // multi
        updateSelection: function (data) {
            var ids = [], filtered = [], self = this;

            // filter out duplicates
            $(data).each(function () {
                if (indexOf(self.id(this), ids) < 0) {
                    ids.push(self.id(this));
                    filtered.push(this);
                }
            });
            data = filtered;

            this.selection.find(".select2-search-choice").remove();
            $(data).each(function () {
                self.addSelectedChoice(this);
            });
            self.postprocessResults();
        },

        // multi
        tokenize: function() {
            var input = this.search.val();
            input = this.opts.tokenizer.call(this, input, this.data(), this.bind(this.onSelect), this.opts);
            if (input != null && input != undefined) {
                this.search.val(input);
                if (input.length > 0) {
                    this.open();
                }
            }

        },

        // multi
        onSelect: function (data, options) {

            if (!this.triggerSelect(data) || data.text === "") { return; }

            this.addSelectedChoice(data);

            this.opts.element.trigger({ type: "selected", val: this.id(data), choice: data });

            // keep track of the search's value before it gets cleared
            this.nextSearchTerm = this.opts.nextSearchTerm(data, this.search.val());

            this.clearSearch();
            this.updateResults();

            if (this.select || !this.opts.closeOnSelect) this.postprocessResults(data, false, this.opts.closeOnSelect===true);

            if (this.opts.closeOnSelect) {
                this.close();
                this.search.width(10);
            } else {
                if (this.countSelectableResults()>0) {
                    this.search.width(10);
                    this.resizeSearch();
                    if (this.getMaximumSelectionSize() > 0 && this.val().length >= this.getMaximumSelectionSize()) {
                        // if we reached max selection size repaint the results so choices
                        // are replaced with the max selection reached message
                        this.updateResults(true);
                    } else {
                        // initializes search's value with nextSearchTerm and update search result
                        if(this.nextSearchTerm != undefined){
                            this.search.val(this.nextSearchTerm);
                            this.updateResults();
                            this.search.select();
                        }
                    }
                    this.positionDropdown();
                } else {
                    // if nothing left to select close
                    this.close();
                    this.search.width(10);
                }
            }

            // since its not possible to select an element that has already been
            // added we do not need to check if this is a new element before firing change
            this.triggerChange({ added: data });

            if (!options || !options.noFocus)
                this.focusSearch();
        },

        // multi
        cancel: function () {
            this.close();
            this.focusSearch();
        },

        addSelectedChoice: function (data) {
            var enableChoice = !data.locked,
                enabledItem = $(
                    "<li class='select2-search-choice'>" +
                    "    <div></div>" +
                    "    <a href='#' class='select2-search-choice-close' tabindex='-1'></a>" +
                    "</li>"),
                disabledItem = $(
                    "<li class='select2-search-choice select2-locked'>" +
                    "<div></div>" +
                    "</li>");
            var choice = enableChoice ? enabledItem : disabledItem,
                id = this.id(data),
                val = this.getVal(),
                formatted,
                cssClass;

            formatted=this.opts.formatSelection(data, choice.find("div"), this.opts.escapeMarkup);
            if (formatted != undefined) {
                choice.find("div").replaceWith("<div>"+formatted+"</div>");
            }
            cssClass=this.opts.formatSelectionCssClass(data, choice.find("div"));
            if (cssClass != undefined) {
                choice.addClass(cssClass);
            }

            if(enableChoice){
              choice.find(".select2-search-choice-close")
                  .on("mousedown", killEvent)
                  .on("click dblclick", this.bind(function (e) {
                  if (!this.isInterfaceEnabled()) return;

                  this.unselect($(e.target));
                  this.selection.find(".select2-search-choice-focus").removeClass("select2-search-choice-focus");
                  killEvent(e);
                  this.close();
                  this.focusSearch();
              })).on("focus", this.bind(function () {
                  if (!this.isInterfaceEnabled()) return;
                  this.container.addClass("select2-container-active");
                  this.dropdown.addClass("select2-drop-active");
              }));
            }

            choice.data("select2-data", data);
            choice.insertBefore(this.searchContainer);

            val.push(id);
            this.setVal(val);
        },

        // multi
        unselect: function (selected) {
            var val = this.getVal(),
                data,
                index;
            selected = selected.closest(".select2-search-choice");

            if (selected.length === 0) {
                throw "Invalid argument: " + selected + ". Must be .select2-search-choice";
            }

            data = selected.data("select2-data");

            if (!data) {
                // prevent a race condition when the 'x' is clicked really fast repeatedly the event can be queued
                // and invoked on an element already removed
                return;
            }

            var evt = $.Event("select2-removing");
            evt.val = this.id(data);
            evt.choice = data;
            this.opts.element.trigger(evt);

            if (evt.isDefaultPrevented()) {
                return false;
            }

            while((index = indexOf(this.id(data), val)) >= 0) {
                val.splice(index, 1);
                this.setVal(val);
                if (this.select) this.postprocessResults();
            }

            selected.remove();

            this.opts.element.trigger({ type: "select2-removed", val: this.id(data), choice: data });
            this.triggerChange({ removed: data });

            return true;
        },

        // multi
        postprocessResults: function (data, initial, noHighlightUpdate) {
            var val = this.getVal(),
                choices = this.results.find(".select2-result"),
                compound = this.results.find(".select2-result-with-children"),
                self = this;

            choices.each2(function (i, choice) {
                var id = self.id(choice.data("select2-data"));
                if (indexOf(id, val) >= 0) {
                    choice.addClass("select2-selected");
                    // mark all children of the selected parent as selected
                    choice.find(".select2-result-selectable").addClass("select2-selected");
                }
            });

            compound.each2(function(i, choice) {
                // hide an optgroup if it doesn't have any selectable children
                if (!choice.is('.select2-result-selectable')
                    && choice.find(".select2-result-selectable:not(.select2-selected)").length === 0) {
                    choice.addClass("select2-selected");
                }
            });

            if (this.highlight() == -1 && noHighlightUpdate !== false){
                self.highlight(0);
            }

            //If all results are chosen render formatNoMatches
            if(!this.opts.createSearchChoice && !choices.filter('.select2-result:not(.select2-selected)').length > 0){
                if(!data || data && !data.more && this.results.find(".select2-no-results").length === 0) {
                    if (checkFormatter(self.opts.formatNoMatches, "formatNoMatches")) {
                        this.results.append("<li class='select2-no-results'>" + evaluate(self.opts.formatNoMatches, self.opts.element, self.search.val()) + "</li>");
                    }
                }
            }

        },

        // multi
        getMaxSearchWidth: function() {
            return this.selection.width() - getSideBorderPadding(this.search);
        },

        // multi
        resizeSearch: function () {
            var minimumWidth, left, maxWidth, containerLeft, searchWidth,
                sideBorderPadding = getSideBorderPadding(this.search);

            minimumWidth = measureTextWidth(this.search) + 10;

            left = this.search.offset().left;

            maxWidth = this.selection.width();
            containerLeft = this.selection.offset().left;

            searchWidth = maxWidth - (left - containerLeft) - sideBorderPadding;

            if (searchWidth < minimumWidth) {
                searchWidth = maxWidth - sideBorderPadding;
            }

            if (searchWidth < 40) {
                searchWidth = maxWidth - sideBorderPadding;
            }

            if (searchWidth <= 0) {
              searchWidth = minimumWidth;
            }

            this.search.width(Math.floor(searchWidth));
        },

        // multi
        getVal: function () {
            var val;
            if (this.select) {
                val = this.select.val();
                return val === null ? [] : val;
            } else {
                val = this.opts.element.val();
                return splitVal(val, this.opts.separator);
            }
        },

        // multi
        setVal: function (val) {
            var unique;
            if (this.select) {
                this.select.val(val);
            } else {
                unique = [];
                // filter out duplicates
                $(val).each(function () {
                    if (indexOf(this, unique) < 0) unique.push(this);
                });
                this.opts.element.val(unique.length === 0 ? "" : unique.join(this.opts.separator));
            }
        },

        // multi
        buildChangeDetails: function (old, current) {
            var current = current.slice(0),
                old = old.slice(0);

            // remove intersection from each array
            for (var i = 0; i < current.length; i++) {
                for (var j = 0; j < old.length; j++) {
                    if (equal(this.opts.id(current[i]), this.opts.id(old[j]))) {
                        current.splice(i, 1);
                        if(i>0){
                        	i--;
                        }
                        old.splice(j, 1);
                        j--;
                    }
                }
            }

            return {added: current, removed: old};
        },


        // multi
        val: function (val, triggerChange) {
            var oldData, self=this;

            if (arguments.length === 0) {
                return this.getVal();
            }

            oldData=this.data();
            if (!oldData.length) oldData=[];

            // val is an id. !val is true for [undefined,null,'',0] - 0 is legal
            if (!val && val !== 0) {
                this.opts.element.val("");
                this.updateSelection([]);
                this.clearSearch();
                if (triggerChange) {
                    this.triggerChange({added: this.data(), removed: oldData});
                }
                return;
            }

            // val is a list of ids
            this.setVal(val);

            if (this.select) {
                this.opts.initSelection(this.select, this.bind(this.updateSelection));
                if (triggerChange) {
                    this.triggerChange(this.buildChangeDetails(oldData, this.data()));
                }
            } else {
                if (this.opts.initSelection === undefined) {
                    throw new Error("val() cannot be called if initSelection() is not defined");
                }

                this.opts.initSelection(this.opts.element, function(data){
                    var ids=$.map(data, self.id);
                    self.setVal(ids);
                    self.updateSelection(data);
                    self.clearSearch();
                    if (triggerChange) {
                        self.triggerChange(self.buildChangeDetails(oldData, self.data()));
                    }
                });
            }
            this.clearSearch();
        },

        // multi
        onSortStart: function() {
            if (this.select) {
                throw new Error("Sorting of elements is not supported when attached to <select>. Attach to <input type='hidden'/> instead.");
            }

            // collapse search field into 0 width so its container can be collapsed as well
            this.search.width(0);
            // hide the container
            this.searchContainer.hide();
        },

        // multi
        onSortEnd:function() {

            var val=[], self=this;

            // show search and move it to the end of the list
            this.searchContainer.show();
            // make sure the search container is the last item in the list
            this.searchContainer.appendTo(this.searchContainer.parent());
            // since we collapsed the width in dragStarted, we resize it here
            this.resizeSearch();

            // update selection
            this.selection.find(".select2-search-choice").each(function() {
                val.push(self.opts.id($(this).data("select2-data")));
            });
            this.setVal(val);
            this.triggerChange();
        },

        // multi
        data: function(values, triggerChange) {
            var self=this, ids, old;
            if (arguments.length === 0) {
                 return this.selection
                     .children(".select2-search-choice")
                     .map(function() { return $(this).data("select2-data"); })
                     .get();
            } else {
                old = this.data();
                if (!values) { values = []; }
                ids = $.map(values, function(e) { return self.opts.id(e); });
                this.setVal(ids);
                this.updateSelection(values);
                this.clearSearch();
                if (triggerChange) {
                    this.triggerChange(this.buildChangeDetails(old, this.data()));
                }
            }
        }
    });

    $.fn.select2 = function () {

        var args = Array.prototype.slice.call(arguments, 0),
            opts,
            select2,
            method, value, multiple,
            allowedMethods = ["val", "destroy", "opened", "open", "close", "focus", "isFocused", "container", "dropdown", "onSortStart", "onSortEnd", "enable", "disable", "readonly", "positionDropdown", "data", "search"],
            valueMethods = ["opened", "isFocused", "container", "dropdown"],
            propertyMethods = ["val", "data"],
            methodsMap = { search: "externalSearch" };

        this.each(function () {
            if (args.length === 0 || typeof(args[0]) === "object") {
                opts = args.length === 0 ? {} : $.extend({}, args[0]);
                opts.element = $(this);

                if (opts.element.get(0).tagName.toLowerCase() === "select") {
                    multiple = opts.element.prop("multiple");
                } else {
                    multiple = opts.multiple || false;
                    if ("tags" in opts) {opts.multiple = multiple = true;}
                }

                select2 = multiple ? new window.Select2["class"].multi() : new window.Select2["class"].single();
                select2.init(opts);
            } else if (typeof(args[0]) === "string") {

                if (indexOf(args[0], allowedMethods) < 0) {
                    throw "Unknown method: " + args[0];
                }

                value = undefined;
                select2 = $(this).data("select2");
                if (select2 === undefined) return;

                method=args[0];

                if (method === "container") {
                    value = select2.container;
                } else if (method === "dropdown") {
                    value = select2.dropdown;
                } else {
                    if (methodsMap[method]) method = methodsMap[method];

                    value = select2[method].apply(select2, args.slice(1));
                }
                if (indexOf(args[0], valueMethods) >= 0
                    || (indexOf(args[0], propertyMethods) >= 0 && args.length == 1)) {
                    return false; // abort the iteration, ready to return first matched value
                }
            } else {
                throw "Invalid arguments to select2 plugin: " + args;
            }
        });
        return (value === undefined) ? this : value;
    };

    // plugin defaults, accessible to users
    $.fn.select2.defaults = {
        width: "copy",
        loadMorePadding: 0,
        closeOnSelect: true,
        openOnEnter: true,
        containerCss: {},
        dropdownCss: {},
        containerCssClass: "",
        dropdownCssClass: "",
        formatResult: function(result, container, query, escapeMarkup) {
            var markup=[];
            markMatch(result.text, query.term, markup, escapeMarkup);
            return markup.join("");
        },
        formatSelection: function (data, container, escapeMarkup) {
            return data ? escapeMarkup(data.text) : undefined;
        },
        sortResults: function (results, container, query) {
            return results;
        },
        formatResultCssClass: function(data) {return data.css;},
        formatSelectionCssClass: function(data, container) {return undefined;},
        minimumResultsForSearch: 0,
        minimumInputLength: 0,
        maximumInputLength: null,
        maximumSelectionSize: 0,
        id: function (e) { return e == undefined ? null : e.id; },
        matcher: function(term, text) {
            return stripDiacritics(''+text).toUpperCase().indexOf(stripDiacritics(''+term).toUpperCase()) >= 0;
        },
        separator: ",",
        tokenSeparators: [],
        tokenizer: defaultTokenizer,
        escapeMarkup: defaultEscapeMarkup,
        blurOnChange: false,
        selectOnBlur: false,
        adaptContainerCssClass: function(c) { return c; },
        adaptDropdownCssClass: function(c) { return null; },
        nextSearchTerm: function(selectedObject, currentSearchTerm) { return undefined; },
        searchInputPlaceholder: '',
        createSearchChoicePosition: 'top',
        shouldFocusInput: function (instance) {
            // Attempt to detect touch devices
            var supportsTouchEvents = (('ontouchstart' in window) ||
                                       (navigator.msMaxTouchPoints > 0));

            // Only devices which support touch events should be special cased
            if (!supportsTouchEvents) {
                return true;
            }

            // Never focus the input if search is disabled
            if (instance.opts.minimumResultsForSearch < 0) {
                return false;
            }

            return true;
        }
    };

    $.fn.select2.locales = [];

    $.fn.select2.locales['en'] = {
         formatMatches: function (matches) { if (matches === 1) { return "One result is available, press enter to select it."; } return matches + " results are available, use up and down arrow keys to navigate."; },
         formatNoMatches: function () { return "No matches found"; },
         formatAjaxError: function (jqXHR, textStatus, errorThrown) { return "Loading failed"; },
         formatInputTooShort: function (input, min) { var n = min - input.length; return "Please enter " + n + " or more character" + (n == 1 ? "" : "s"); },
         formatInputTooLong: function (input, max) { var n = input.length - max; return "Please delete " + n + " character" + (n == 1 ? "" : "s"); },
         formatSelectionTooBig: function (limit) { return "You can only select " + limit + " item" + (limit == 1 ? "" : "s"); },
         formatLoadMore: function (pageNumber) { return "Loading more results…"; },
         formatSearching: function () { return "Searching…"; },
    };

    $.extend($.fn.select2.defaults, $.fn.select2.locales['en']);

    $.fn.select2.ajaxDefaults = {
        transport: $.ajax,
        params: {
            type: "GET",
            cache: false,
            dataType: "json"
        }
    };

    // exports
    window.Select2 = {
        query: {
            ajax: ajax,
            local: local,
            tags: tags
        }, util: {
            debounce: debounce,
            markMatch: markMatch,
            escapeMarkup: defaultEscapeMarkup,
            stripDiacritics: stripDiacritics
        }, "class": {
            "abstract": AbstractSelect2,
            "single": SingleSelect2,
            "multi": MultiSelect2
        }
    };

}(jQuery));

define("select2", function(){});

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

define("modernizr-csspositionsticky", function(){});

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
        },

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
/*!
 * imagesLoaded PACKAGED v3.1.8
 * JavaScript is all like "You images are done yet or what?"
 * MIT License
 */

(function(){function e(){}function t(e,t){for(var n=e.length;n--;)if(e[n].listener===t)return n;return-1}function n(e){return function(){return this[e].apply(this,arguments)}}var i=e.prototype,r=this,o=r.EventEmitter;i.getListeners=function(e){var t,n,i=this._getEvents();if("object"==typeof e){t={};for(n in i)i.hasOwnProperty(n)&&e.test(n)&&(t[n]=i[n])}else t=i[e]||(i[e]=[]);return t},i.flattenListeners=function(e){var t,n=[];for(t=0;e.length>t;t+=1)n.push(e[t].listener);return n},i.getListenersAsObject=function(e){var t,n=this.getListeners(e);return n instanceof Array&&(t={},t[e]=n),t||n},i.addListener=function(e,n){var i,r=this.getListenersAsObject(e),o="object"==typeof n;for(i in r)r.hasOwnProperty(i)&&-1===t(r[i],n)&&r[i].push(o?n:{listener:n,once:!1});return this},i.on=n("addListener"),i.addOnceListener=function(e,t){return this.addListener(e,{listener:t,once:!0})},i.once=n("addOnceListener"),i.defineEvent=function(e){return this.getListeners(e),this},i.defineEvents=function(e){for(var t=0;e.length>t;t+=1)this.defineEvent(e[t]);return this},i.removeListener=function(e,n){var i,r,o=this.getListenersAsObject(e);for(r in o)o.hasOwnProperty(r)&&(i=t(o[r],n),-1!==i&&o[r].splice(i,1));return this},i.off=n("removeListener"),i.addListeners=function(e,t){return this.manipulateListeners(!1,e,t)},i.removeListeners=function(e,t){return this.manipulateListeners(!0,e,t)},i.manipulateListeners=function(e,t,n){var i,r,o=e?this.removeListener:this.addListener,s=e?this.removeListeners:this.addListeners;if("object"!=typeof t||t instanceof RegExp)for(i=n.length;i--;)o.call(this,t,n[i]);else for(i in t)t.hasOwnProperty(i)&&(r=t[i])&&("function"==typeof r?o.call(this,i,r):s.call(this,i,r));return this},i.removeEvent=function(e){var t,n=typeof e,i=this._getEvents();if("string"===n)delete i[e];else if("object"===n)for(t in i)i.hasOwnProperty(t)&&e.test(t)&&delete i[t];else delete this._events;return this},i.removeAllListeners=n("removeEvent"),i.emitEvent=function(e,t){var n,i,r,o,s=this.getListenersAsObject(e);for(r in s)if(s.hasOwnProperty(r))for(i=s[r].length;i--;)n=s[r][i],n.once===!0&&this.removeListener(e,n.listener),o=n.listener.apply(this,t||[]),o===this._getOnceReturnValue()&&this.removeListener(e,n.listener);return this},i.trigger=n("emitEvent"),i.emit=function(e){var t=Array.prototype.slice.call(arguments,1);return this.emitEvent(e,t)},i.setOnceReturnValue=function(e){return this._onceReturnValue=e,this},i._getOnceReturnValue=function(){return this.hasOwnProperty("_onceReturnValue")?this._onceReturnValue:!0},i._getEvents=function(){return this._events||(this._events={})},e.noConflict=function(){return r.EventEmitter=o,e},"function"==typeof define&&define.amd?define("eventEmitter/EventEmitter",[],function(){return e}):"object"==typeof module&&module.exports?module.exports=e:this.EventEmitter=e}).call(this),function(e){function t(t){var n=e.event;return n.target=n.target||n.srcElement||t,n}var n=document.documentElement,i=function(){};n.addEventListener?i=function(e,t,n){e.addEventListener(t,n,!1)}:n.attachEvent&&(i=function(e,n,i){e[n+i]=i.handleEvent?function(){var n=t(e);i.handleEvent.call(i,n)}:function(){var n=t(e);i.call(e,n)},e.attachEvent("on"+n,e[n+i])});var r=function(){};n.removeEventListener?r=function(e,t,n){e.removeEventListener(t,n,!1)}:n.detachEvent&&(r=function(e,t,n){e.detachEvent("on"+t,e[t+n]);try{delete e[t+n]}catch(i){e[t+n]=void 0}});var o={bind:i,unbind:r};"function"==typeof define&&define.amd?define("eventie/eventie",o):e.eventie=o}(this),function(e,t){"function"==typeof define&&define.amd?define('imagesloaded',["eventEmitter/EventEmitter","eventie/eventie"],function(n,i){return t(e,n,i)}):"object"==typeof exports?module.exports=t(e,require("wolfy87-eventemitter"),require("eventie")):e.imagesLoaded=t(e,e.EventEmitter,e.eventie)}(window,function(e,t,n){function i(e,t){for(var n in t)e[n]=t[n];return e}function r(e){return"[object Array]"===d.call(e)}function o(e){var t=[];if(r(e))t=e;else if("number"==typeof e.length)for(var n=0,i=e.length;i>n;n++)t.push(e[n]);else t.push(e);return t}function s(e,t,n){if(!(this instanceof s))return new s(e,t);"string"==typeof e&&(e=document.querySelectorAll(e)),this.elements=o(e),this.options=i({},this.options),"function"==typeof t?n=t:i(this.options,t),n&&this.on("always",n),this.getImages(),a&&(this.jqDeferred=new a.Deferred);var r=this;setTimeout(function(){r.check()})}function f(e){this.img=e}function c(e){this.src=e,v[e]=this}var a=e.jQuery,u=e.console,h=u!==void 0,d=Object.prototype.toString;s.prototype=new t,s.prototype.options={},s.prototype.getImages=function(){this.images=[];for(var e=0,t=this.elements.length;t>e;e++){var n=this.elements[e];"IMG"===n.nodeName&&this.addImage(n);var i=n.nodeType;if(i&&(1===i||9===i||11===i))for(var r=n.querySelectorAll("img"),o=0,s=r.length;s>o;o++){var f=r[o];this.addImage(f)}}},s.prototype.addImage=function(e){var t=new f(e);this.images.push(t)},s.prototype.check=function(){function e(e,r){return t.options.debug&&h&&u.log("confirm",e,r),t.progress(e),n++,n===i&&t.complete(),!0}var t=this,n=0,i=this.images.length;if(this.hasAnyBroken=!1,!i)return this.complete(),void 0;for(var r=0;i>r;r++){var o=this.images[r];o.on("confirm",e),o.check()}},s.prototype.progress=function(e){this.hasAnyBroken=this.hasAnyBroken||!e.isLoaded;var t=this;setTimeout(function(){t.emit("progress",t,e),t.jqDeferred&&t.jqDeferred.notify&&t.jqDeferred.notify(t,e)})},s.prototype.complete=function(){var e=this.hasAnyBroken?"fail":"done";this.isComplete=!0;var t=this;setTimeout(function(){if(t.emit(e,t),t.emit("always",t),t.jqDeferred){var n=t.hasAnyBroken?"reject":"resolve";t.jqDeferred[n](t)}})},a&&(a.fn.imagesLoaded=function(e,t){var n=new s(this,e,t);return n.jqDeferred.promise(a(this))}),f.prototype=new t,f.prototype.check=function(){var e=v[this.img.src]||new c(this.img.src);if(e.isConfirmed)return this.confirm(e.isLoaded,"cached was confirmed"),void 0;if(this.img.complete&&void 0!==this.img.naturalWidth)return this.confirm(0!==this.img.naturalWidth,"naturalWidth"),void 0;var t=this;e.on("confirm",function(e,n){return t.confirm(e.isLoaded,n),!0}),e.check()},f.prototype.confirm=function(e,t){this.isLoaded=e,this.emit("confirm",this,t)};var v={};return c.prototype=new t,c.prototype.check=function(){if(!this.isChecked){var e=new Image;n.bind(e,"load",this),n.bind(e,"error",this),e.src=this.src,this.isChecked=!0}},c.prototype.handleEvent=function(e){var t="on"+e.type;this[t]&&this[t](e)},c.prototype.onload=function(e){this.confirm(!0,"onload"),this.unbindProxyEvents(e)},c.prototype.onerror=function(e){this.confirm(!1,"onerror"),this.unbindProxyEvents(e)},c.prototype.confirm=function(e,t){this.isConfirmed=!0,this.isLoaded=e,this.emit("confirm",this,t)},c.prototype.unbindProxyEvents=function(e){n.unbind(e.target,"load",this),n.unbind(e.target,"error",this)},s});
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

/*!
 * Masonry PACKAGED v3.2.3
 * Cascading grid layout library
 * http://masonry.desandro.com
 * MIT License
 * by David DeSandro
 */

!function(a){function b(){}function c(a){function c(b){b.prototype.option||(b.prototype.option=function(b){a.isPlainObject(b)&&(this.options=a.extend(!0,this.options,b))})}function e(b,c){a.fn[b]=function(e){if("string"==typeof e){for(var g=d.call(arguments,1),h=0,i=this.length;i>h;h++){var j=this[h],k=a.data(j,b);if(k)if(a.isFunction(k[e])&&"_"!==e.charAt(0)){var l=k[e].apply(k,g);if(void 0!==l)return l}else f("no such method '"+e+"' for "+b+" instance");else f("cannot call methods on "+b+" prior to initialization; attempted to call '"+e+"'")}return this}return this.each(function(){var d=a.data(this,b);d?(d.option(e),d._init()):(d=new c(this,e),a.data(this,b,d))})}}if(a){var f="undefined"==typeof console?b:function(a){console.error(a)};return a.bridget=function(a,b){c(b),e(a,b)},a.bridget}}var d=Array.prototype.slice;"function"==typeof define&&define.amd?define("jquery-bridget/jquery.bridget",["jquery"],c):c("object"==typeof exports?require("jquery"):a.jQuery)}(window),function(a){function b(b){var c=a.event;return c.target=c.target||c.srcElement||b,c}var c=document.documentElement,d=function(){};c.addEventListener?d=function(a,b,c){a.addEventListener(b,c,!1)}:c.attachEvent&&(d=function(a,c,d){a[c+d]=d.handleEvent?function(){var c=b(a);d.handleEvent.call(d,c)}:function(){var c=b(a);d.call(a,c)},a.attachEvent("on"+c,a[c+d])});var e=function(){};c.removeEventListener?e=function(a,b,c){a.removeEventListener(b,c,!1)}:c.detachEvent&&(e=function(a,b,c){a.detachEvent("on"+b,a[b+c]);try{delete a[b+c]}catch(d){a[b+c]=void 0}});var f={bind:d,unbind:e};"function"==typeof define&&define.amd?define("eventie/eventie",f):"object"==typeof exports?module.exports=f:a.eventie=f}(window),function(a){function b(a){"function"==typeof a&&(b.isReady?a():g.push(a))}function c(a){var c="readystatechange"===a.type&&"complete"!==f.readyState;b.isReady||c||d()}function d(){b.isReady=!0;for(var a=0,c=g.length;c>a;a++){var d=g[a];d()}}function e(e){return"complete"===f.readyState?d():(e.bind(f,"DOMContentLoaded",c),e.bind(f,"readystatechange",c),e.bind(a,"load",c)),b}var f=a.document,g=[];b.isReady=!1,"function"==typeof define&&define.amd?define("doc-ready/doc-ready",["eventie/eventie"],e):"object"==typeof exports?module.exports=e(require("eventie")):a.docReady=e(a.eventie)}(window),function(){function a(){}function b(a,b){for(var c=a.length;c--;)if(a[c].listener===b)return c;return-1}function c(a){return function(){return this[a].apply(this,arguments)}}var d=a.prototype,e=this,f=e.EventEmitter;d.getListeners=function(a){var b,c,d=this._getEvents();if(a instanceof RegExp){b={};for(c in d)d.hasOwnProperty(c)&&a.test(c)&&(b[c]=d[c])}else b=d[a]||(d[a]=[]);return b},d.flattenListeners=function(a){var b,c=[];for(b=0;b<a.length;b+=1)c.push(a[b].listener);return c},d.getListenersAsObject=function(a){var b,c=this.getListeners(a);return c instanceof Array&&(b={},b[a]=c),b||c},d.addListener=function(a,c){var d,e=this.getListenersAsObject(a),f="object"==typeof c;for(d in e)e.hasOwnProperty(d)&&-1===b(e[d],c)&&e[d].push(f?c:{listener:c,once:!1});return this},d.on=c("addListener"),d.addOnceListener=function(a,b){return this.addListener(a,{listener:b,once:!0})},d.once=c("addOnceListener"),d.defineEvent=function(a){return this.getListeners(a),this},d.defineEvents=function(a){for(var b=0;b<a.length;b+=1)this.defineEvent(a[b]);return this},d.removeListener=function(a,c){var d,e,f=this.getListenersAsObject(a);for(e in f)f.hasOwnProperty(e)&&(d=b(f[e],c),-1!==d&&f[e].splice(d,1));return this},d.off=c("removeListener"),d.addListeners=function(a,b){return this.manipulateListeners(!1,a,b)},d.removeListeners=function(a,b){return this.manipulateListeners(!0,a,b)},d.manipulateListeners=function(a,b,c){var d,e,f=a?this.removeListener:this.addListener,g=a?this.removeListeners:this.addListeners;if("object"!=typeof b||b instanceof RegExp)for(d=c.length;d--;)f.call(this,b,c[d]);else for(d in b)b.hasOwnProperty(d)&&(e=b[d])&&("function"==typeof e?f.call(this,d,e):g.call(this,d,e));return this},d.removeEvent=function(a){var b,c=typeof a,d=this._getEvents();if("string"===c)delete d[a];else if(a instanceof RegExp)for(b in d)d.hasOwnProperty(b)&&a.test(b)&&delete d[b];else delete this._events;return this},d.removeAllListeners=c("removeEvent"),d.emitEvent=function(a,b){var c,d,e,f,g=this.getListenersAsObject(a);for(e in g)if(g.hasOwnProperty(e))for(d=g[e].length;d--;)c=g[e][d],c.once===!0&&this.removeListener(a,c.listener),f=c.listener.apply(this,b||[]),f===this._getOnceReturnValue()&&this.removeListener(a,c.listener);return this},d.trigger=c("emitEvent"),d.emit=function(a){var b=Array.prototype.slice.call(arguments,1);return this.emitEvent(a,b)},d.setOnceReturnValue=function(a){return this._onceReturnValue=a,this},d._getOnceReturnValue=function(){return this.hasOwnProperty("_onceReturnValue")?this._onceReturnValue:!0},d._getEvents=function(){return this._events||(this._events={})},a.noConflict=function(){return e.EventEmitter=f,a},"function"==typeof define&&define.amd?define("eventEmitter/EventEmitter",[],function(){return a}):"object"==typeof module&&module.exports?module.exports=a:e.EventEmitter=a}.call(this),function(a){function b(a){if(a){if("string"==typeof d[a])return a;a=a.charAt(0).toUpperCase()+a.slice(1);for(var b,e=0,f=c.length;f>e;e++)if(b=c[e]+a,"string"==typeof d[b])return b}}var c="Webkit Moz ms Ms O".split(" "),d=document.documentElement.style;"function"==typeof define&&define.amd?define("get-style-property/get-style-property",[],function(){return b}):"object"==typeof exports?module.exports=b:a.getStyleProperty=b}(window),function(a){function b(a){var b=parseFloat(a),c=-1===a.indexOf("%")&&!isNaN(b);return c&&b}function c(){}function d(){for(var a={width:0,height:0,innerWidth:0,innerHeight:0,outerWidth:0,outerHeight:0},b=0,c=g.length;c>b;b++){var d=g[b];a[d]=0}return a}function e(c){function e(){if(!m){m=!0;var d=a.getComputedStyle;if(j=function(){var a=d?function(a){return d(a,null)}:function(a){return a.currentStyle};return function(b){var c=a(b);return c||f("Style returned "+c+". Are you running this code in a hidden iframe on Firefox? See http://bit.ly/getsizebug1"),c}}(),k=c("boxSizing")){var e=document.createElement("div");e.style.width="200px",e.style.padding="1px 2px 3px 4px",e.style.borderStyle="solid",e.style.borderWidth="1px 2px 3px 4px",e.style[k]="border-box";var g=document.body||document.documentElement;g.appendChild(e);var h=j(e);l=200===b(h.width),g.removeChild(e)}}}function h(a){if(e(),"string"==typeof a&&(a=document.querySelector(a)),a&&"object"==typeof a&&a.nodeType){var c=j(a);if("none"===c.display)return d();var f={};f.width=a.offsetWidth,f.height=a.offsetHeight;for(var h=f.isBorderBox=!(!k||!c[k]||"border-box"!==c[k]),m=0,n=g.length;n>m;m++){var o=g[m],p=c[o];p=i(a,p);var q=parseFloat(p);f[o]=isNaN(q)?0:q}var r=f.paddingLeft+f.paddingRight,s=f.paddingTop+f.paddingBottom,t=f.marginLeft+f.marginRight,u=f.marginTop+f.marginBottom,v=f.borderLeftWidth+f.borderRightWidth,w=f.borderTopWidth+f.borderBottomWidth,x=h&&l,y=b(c.width);y!==!1&&(f.width=y+(x?0:r+v));var z=b(c.height);return z!==!1&&(f.height=z+(x?0:s+w)),f.innerWidth=f.width-(r+v),f.innerHeight=f.height-(s+w),f.outerWidth=f.width+t,f.outerHeight=f.height+u,f}}function i(b,c){if(a.getComputedStyle||-1===c.indexOf("%"))return c;var d=b.style,e=d.left,f=b.runtimeStyle,g=f&&f.left;return g&&(f.left=b.currentStyle.left),d.left=c,c=d.pixelLeft,d.left=e,g&&(f.left=g),c}var j,k,l,m=!1;return h}var f="undefined"==typeof console?c:function(a){console.error(a)},g=["paddingLeft","paddingRight","paddingTop","paddingBottom","marginLeft","marginRight","marginTop","marginBottom","borderLeftWidth","borderRightWidth","borderTopWidth","borderBottomWidth"];"function"==typeof define&&define.amd?define("get-size/get-size",["get-style-property/get-style-property"],e):"object"==typeof exports?module.exports=e(require("desandro-get-style-property")):a.getSize=e(a.getStyleProperty)}(window),function(a){function b(a,b){return a[g](b)}function c(a){if(!a.parentNode){var b=document.createDocumentFragment();b.appendChild(a)}}function d(a,b){c(a);for(var d=a.parentNode.querySelectorAll(b),e=0,f=d.length;f>e;e++)if(d[e]===a)return!0;return!1}function e(a,d){return c(a),b(a,d)}var f,g=function(){if(a.matches)return"matches";if(a.matchesSelector)return"matchesSelector";for(var b=["webkit","moz","ms","o"],c=0,d=b.length;d>c;c++){var e=b[c],f=e+"MatchesSelector";if(a[f])return f}}();if(g){var h=document.createElement("div"),i=b(h,"div");f=i?b:e}else f=d;"function"==typeof define&&define.amd?define("matches-selector/matches-selector",[],function(){return f}):"object"==typeof exports?module.exports=f:window.matchesSelector=f}(Element.prototype),function(a){function b(a,b){for(var c in b)a[c]=b[c];return a}function c(a){for(var b in a)return!1;return b=null,!0}function d(a){return a.replace(/([A-Z])/g,function(a){return"-"+a.toLowerCase()})}function e(a,e,f){function h(a,b){a&&(this.element=a,this.layout=b,this.position={x:0,y:0},this._create())}var i=f("transition"),j=f("transform"),k=i&&j,l=!!f("perspective"),m={WebkitTransition:"webkitTransitionEnd",MozTransition:"transitionend",OTransition:"otransitionend",transition:"transitionend"}[i],n=["transform","transition","transitionDuration","transitionProperty"],o=function(){for(var a={},b=0,c=n.length;c>b;b++){var d=n[b],e=f(d);e&&e!==d&&(a[d]=e)}return a}();b(h.prototype,a.prototype),h.prototype._create=function(){this._transn={ingProperties:{},clean:{},onEnd:{}},this.css({position:"absolute"})},h.prototype.handleEvent=function(a){var b="on"+a.type;this[b]&&this[b](a)},h.prototype.getSize=function(){this.size=e(this.element)},h.prototype.css=function(a){var b=this.element.style;for(var c in a){var d=o[c]||c;b[d]=a[c]}},h.prototype.getPosition=function(){var a=g(this.element),b=this.layout.options,c=b.isOriginLeft,d=b.isOriginTop,e=parseInt(a[c?"left":"right"],10),f=parseInt(a[d?"top":"bottom"],10);e=isNaN(e)?0:e,f=isNaN(f)?0:f;var h=this.layout.size;e-=c?h.paddingLeft:h.paddingRight,f-=d?h.paddingTop:h.paddingBottom,this.position.x=e,this.position.y=f},h.prototype.layoutPosition=function(){var a=this.layout.size,b=this.layout.options,c={};b.isOriginLeft?(c.left=this.position.x+a.paddingLeft+"px",c.right=""):(c.right=this.position.x+a.paddingRight+"px",c.left=""),b.isOriginTop?(c.top=this.position.y+a.paddingTop+"px",c.bottom=""):(c.bottom=this.position.y+a.paddingBottom+"px",c.top=""),this.css(c),this.emitEvent("layout",[this])};var p=l?function(a,b){return"translate3d("+a+"px, "+b+"px, 0)"}:function(a,b){return"translate("+a+"px, "+b+"px)"};h.prototype._transitionTo=function(a,b){this.getPosition();var c=this.position.x,d=this.position.y,e=parseInt(a,10),f=parseInt(b,10),g=e===this.position.x&&f===this.position.y;if(this.setPosition(a,b),g&&!this.isTransitioning)return void this.layoutPosition();var h=a-c,i=b-d,j={},k=this.layout.options;h=k.isOriginLeft?h:-h,i=k.isOriginTop?i:-i,j.transform=p(h,i),this.transition({to:j,onTransitionEnd:{transform:this.layoutPosition},isCleaning:!0})},h.prototype.goTo=function(a,b){this.setPosition(a,b),this.layoutPosition()},h.prototype.moveTo=k?h.prototype._transitionTo:h.prototype.goTo,h.prototype.setPosition=function(a,b){this.position.x=parseInt(a,10),this.position.y=parseInt(b,10)},h.prototype._nonTransition=function(a){this.css(a.to),a.isCleaning&&this._removeStyles(a.to);for(var b in a.onTransitionEnd)a.onTransitionEnd[b].call(this)},h.prototype._transition=function(a){if(!parseFloat(this.layout.options.transitionDuration))return void this._nonTransition(a);var b=this._transn;for(var c in a.onTransitionEnd)b.onEnd[c]=a.onTransitionEnd[c];for(c in a.to)b.ingProperties[c]=!0,a.isCleaning&&(b.clean[c]=!0);if(a.from){this.css(a.from);var d=this.element.offsetHeight;d=null}this.enableTransition(a.to),this.css(a.to),this.isTransitioning=!0};var q=j&&d(j)+",opacity";h.prototype.enableTransition=function(){this.isTransitioning||(this.css({transitionProperty:q,transitionDuration:this.layout.options.transitionDuration}),this.element.addEventListener(m,this,!1))},h.prototype.transition=h.prototype[i?"_transition":"_nonTransition"],h.prototype.onwebkitTransitionEnd=function(a){this.ontransitionend(a)},h.prototype.onotransitionend=function(a){this.ontransitionend(a)};var r={"-webkit-transform":"transform","-moz-transform":"transform","-o-transform":"transform"};h.prototype.ontransitionend=function(a){if(a.target===this.element){var b=this._transn,d=r[a.propertyName]||a.propertyName;if(delete b.ingProperties[d],c(b.ingProperties)&&this.disableTransition(),d in b.clean&&(this.element.style[a.propertyName]="",delete b.clean[d]),d in b.onEnd){var e=b.onEnd[d];e.call(this),delete b.onEnd[d]}this.emitEvent("transitionEnd",[this])}},h.prototype.disableTransition=function(){this.removeTransitionStyles(),this.element.removeEventListener(m,this,!1),this.isTransitioning=!1},h.prototype._removeStyles=function(a){var b={};for(var c in a)b[c]="";this.css(b)};var s={transitionProperty:"",transitionDuration:""};return h.prototype.removeTransitionStyles=function(){this.css(s)},h.prototype.removeElem=function(){this.element.parentNode.removeChild(this.element),this.emitEvent("remove",[this])},h.prototype.remove=function(){if(!i||!parseFloat(this.layout.options.transitionDuration))return void this.removeElem();var a=this;this.on("transitionEnd",function(){return a.removeElem(),!0}),this.hide()},h.prototype.reveal=function(){delete this.isHidden,this.css({display:""});var a=this.layout.options;this.transition({from:a.hiddenStyle,to:a.visibleStyle,isCleaning:!0})},h.prototype.hide=function(){this.isHidden=!0,this.css({display:""});var a=this.layout.options;this.transition({from:a.visibleStyle,to:a.hiddenStyle,isCleaning:!0,onTransitionEnd:{opacity:function(){this.isHidden&&this.css({display:"none"})}}})},h.prototype.destroy=function(){this.css({position:"",left:"",right:"",top:"",bottom:"",transition:"",transform:""})},h}var f=a.getComputedStyle,g=f?function(a){return f(a,null)}:function(a){return a.currentStyle};"function"==typeof define&&define.amd?define("outlayer/item",["eventEmitter/EventEmitter","get-size/get-size","get-style-property/get-style-property"],e):"object"==typeof exports?module.exports=e(require("wolfy87-eventemitter"),require("get-size"),require("desandro-get-style-property")):(a.Outlayer={},a.Outlayer.Item=e(a.EventEmitter,a.getSize,a.getStyleProperty))}(window),function(a){function b(a,b){for(var c in b)a[c]=b[c];return a}function c(a){return"[object Array]"===l.call(a)}function d(a){var b=[];if(c(a))b=a;else if(a&&"number"==typeof a.length)for(var d=0,e=a.length;e>d;d++)b.push(a[d]);else b.push(a);return b}function e(a,b){var c=n(b,a);-1!==c&&b.splice(c,1)}function f(a){return a.replace(/(.)([A-Z])/g,function(a,b,c){return b+"-"+c}).toLowerCase()}function g(c,g,l,n,o,p){function q(a,c){if("string"==typeof a&&(a=h.querySelector(a)),!a||!m(a))return void(i&&i.error("Bad "+this.constructor.namespace+" element: "+a));this.element=a,this.options=b({},this.constructor.defaults),this.option(c);var d=++r;this.element.outlayerGUID=d,s[d]=this,this._create(),this.options.isInitLayout&&this.layout()}var r=0,s={};return q.namespace="outlayer",q.Item=p,q.defaults={containerStyle:{position:"relative"},isInitLayout:!0,isOriginLeft:!0,isOriginTop:!0,isResizeBound:!0,isResizingContainer:!0,transitionDuration:"0.4s",hiddenStyle:{opacity:0,transform:"scale(0.001)"},visibleStyle:{opacity:1,transform:"scale(1)"}},b(q.prototype,l.prototype),q.prototype.option=function(a){b(this.options,a)},q.prototype._create=function(){this.reloadItems(),this.stamps=[],this.stamp(this.options.stamp),b(this.element.style,this.options.containerStyle),this.options.isResizeBound&&this.bindResize()},q.prototype.reloadItems=function(){this.items=this._itemize(this.element.children)},q.prototype._itemize=function(a){for(var b=this._filterFindItemElements(a),c=this.constructor.Item,d=[],e=0,f=b.length;f>e;e++){var g=b[e],h=new c(g,this);d.push(h)}return d},q.prototype._filterFindItemElements=function(a){a=d(a);for(var b=this.options.itemSelector,c=[],e=0,f=a.length;f>e;e++){var g=a[e];if(m(g))if(b){o(g,b)&&c.push(g);for(var h=g.querySelectorAll(b),i=0,j=h.length;j>i;i++)c.push(h[i])}else c.push(g)}return c},q.prototype.getItemElements=function(){for(var a=[],b=0,c=this.items.length;c>b;b++)a.push(this.items[b].element);return a},q.prototype.layout=function(){this._resetLayout(),this._manageStamps();var a=void 0!==this.options.isLayoutInstant?this.options.isLayoutInstant:!this._isLayoutInited;this.layoutItems(this.items,a),this._isLayoutInited=!0},q.prototype._init=q.prototype.layout,q.prototype._resetLayout=function(){this.getSize()},q.prototype.getSize=function(){this.size=n(this.element)},q.prototype._getMeasurement=function(a,b){var c,d=this.options[a];d?("string"==typeof d?c=this.element.querySelector(d):m(d)&&(c=d),this[a]=c?n(c)[b]:d):this[a]=0},q.prototype.layoutItems=function(a,b){a=this._getItemsForLayout(a),this._layoutItems(a,b),this._postLayout()},q.prototype._getItemsForLayout=function(a){for(var b=[],c=0,d=a.length;d>c;c++){var e=a[c];e.isIgnored||b.push(e)}return b},q.prototype._layoutItems=function(a,b){function c(){d.emitEvent("layoutComplete",[d,a])}var d=this;if(!a||!a.length)return void c();this._itemsOn(a,"layout",c);for(var e=[],f=0,g=a.length;g>f;f++){var h=a[f],i=this._getItemLayoutPosition(h);i.item=h,i.isInstant=b||h.isLayoutInstant,e.push(i)}this._processLayoutQueue(e)},q.prototype._getItemLayoutPosition=function(){return{x:0,y:0}},q.prototype._processLayoutQueue=function(a){for(var b=0,c=a.length;c>b;b++){var d=a[b];this._positionItem(d.item,d.x,d.y,d.isInstant)}},q.prototype._positionItem=function(a,b,c,d){d?a.goTo(b,c):a.moveTo(b,c)},q.prototype._postLayout=function(){this.resizeContainer()},q.prototype.resizeContainer=function(){if(this.options.isResizingContainer){var a=this._getContainerSize();a&&(this._setContainerMeasure(a.width,!0),this._setContainerMeasure(a.height,!1))}},q.prototype._getContainerSize=k,q.prototype._setContainerMeasure=function(a,b){if(void 0!==a){var c=this.size;c.isBorderBox&&(a+=b?c.paddingLeft+c.paddingRight+c.borderLeftWidth+c.borderRightWidth:c.paddingBottom+c.paddingTop+c.borderTopWidth+c.borderBottomWidth),a=Math.max(a,0),this.element.style[b?"width":"height"]=a+"px"}},q.prototype._itemsOn=function(a,b,c){function d(){return e++,e===f&&c.call(g),!0}for(var e=0,f=a.length,g=this,h=0,i=a.length;i>h;h++){var j=a[h];j.on(b,d)}},q.prototype.ignore=function(a){var b=this.getItem(a);b&&(b.isIgnored=!0)},q.prototype.unignore=function(a){var b=this.getItem(a);b&&delete b.isIgnored},q.prototype.stamp=function(a){if(a=this._find(a)){this.stamps=this.stamps.concat(a);for(var b=0,c=a.length;c>b;b++){var d=a[b];this.ignore(d)}}},q.prototype.unstamp=function(a){if(a=this._find(a))for(var b=0,c=a.length;c>b;b++){var d=a[b];e(d,this.stamps),this.unignore(d)}},q.prototype._find=function(a){return a?("string"==typeof a&&(a=this.element.querySelectorAll(a)),a=d(a)):void 0},q.prototype._manageStamps=function(){if(this.stamps&&this.stamps.length){this._getBoundingRect();for(var a=0,b=this.stamps.length;b>a;a++){var c=this.stamps[a];this._manageStamp(c)}}},q.prototype._getBoundingRect=function(){var a=this.element.getBoundingClientRect(),b=this.size;this._boundingRect={left:a.left+b.paddingLeft+b.borderLeftWidth,top:a.top+b.paddingTop+b.borderTopWidth,right:a.right-(b.paddingRight+b.borderRightWidth),bottom:a.bottom-(b.paddingBottom+b.borderBottomWidth)}},q.prototype._manageStamp=k,q.prototype._getElementOffset=function(a){var b=a.getBoundingClientRect(),c=this._boundingRect,d=n(a),e={left:b.left-c.left-d.marginLeft,top:b.top-c.top-d.marginTop,right:c.right-b.right-d.marginRight,bottom:c.bottom-b.bottom-d.marginBottom};return e},q.prototype.handleEvent=function(a){var b="on"+a.type;this[b]&&this[b](a)},q.prototype.bindResize=function(){this.isResizeBound||(c.bind(a,"resize",this),this.isResizeBound=!0)},q.prototype.unbindResize=function(){this.isResizeBound&&c.unbind(a,"resize",this),this.isResizeBound=!1},q.prototype.onresize=function(){function a(){b.resize(),delete b.resizeTimeout}this.resizeTimeout&&clearTimeout(this.resizeTimeout);var b=this;this.resizeTimeout=setTimeout(a,100)},q.prototype.resize=function(){this.isResizeBound&&this.needsResizeLayout()&&this.layout()},q.prototype.needsResizeLayout=function(){var a=n(this.element),b=this.size&&a;return b&&a.innerWidth!==this.size.innerWidth},q.prototype.addItems=function(a){var b=this._itemize(a);return b.length&&(this.items=this.items.concat(b)),b},q.prototype.appended=function(a){var b=this.addItems(a);b.length&&(this.layoutItems(b,!0),this.reveal(b))},q.prototype.prepended=function(a){var b=this._itemize(a);if(b.length){var c=this.items.slice(0);this.items=b.concat(c),this._resetLayout(),this._manageStamps(),this.layoutItems(b,!0),this.reveal(b),this.layoutItems(c)}},q.prototype.reveal=function(a){var b=a&&a.length;if(b)for(var c=0;b>c;c++){var d=a[c];d.reveal()}},q.prototype.hide=function(a){var b=a&&a.length;if(b)for(var c=0;b>c;c++){var d=a[c];d.hide()}},q.prototype.getItem=function(a){for(var b=0,c=this.items.length;c>b;b++){var d=this.items[b];if(d.element===a)return d}},q.prototype.getItems=function(a){if(a&&a.length){for(var b=[],c=0,d=a.length;d>c;c++){var e=a[c],f=this.getItem(e);f&&b.push(f)}return b}},q.prototype.remove=function(a){a=d(a);var b=this.getItems(a);if(b&&b.length){this._itemsOn(b,"remove",function(){this.emitEvent("removeComplete",[this,b])});for(var c=0,f=b.length;f>c;c++){var g=b[c];g.remove(),e(g,this.items)}}},q.prototype.destroy=function(){var a=this.element.style;a.height="",a.position="",a.width="";for(var b=0,c=this.items.length;c>b;b++){var d=this.items[b];d.destroy()}this.unbindResize();var e=this.element.outlayerGUID;delete s[e],delete this.element.outlayerGUID,j&&j.removeData(this.element,this.constructor.namespace)},q.data=function(a){var b=a&&a.outlayerGUID;return b&&s[b]},q.create=function(a,c){function d(){q.apply(this,arguments)}return Object.create?d.prototype=Object.create(q.prototype):b(d.prototype,q.prototype),d.prototype.constructor=d,d.defaults=b({},q.defaults),b(d.defaults,c),d.prototype.settings={},d.namespace=a,d.data=q.data,d.Item=function(){p.apply(this,arguments)},d.Item.prototype=new p,g(function(){for(var b=f(a),c=h.querySelectorAll(".js-"+b),e="data-"+b+"-options",g=0,k=c.length;k>g;g++){var l,m=c[g],n=m.getAttribute(e);try{l=n&&JSON.parse(n)}catch(o){i&&i.error("Error parsing "+e+" on "+m.nodeName.toLowerCase()+(m.id?"#"+m.id:"")+": "+o);continue}var p=new d(m,l);j&&j.data(m,a,p)}}),j&&j.bridget&&j.bridget(a,d),d},q.Item=p,q}var h=a.document,i=a.console,j=a.jQuery,k=function(){},l=Object.prototype.toString,m="function"==typeof HTMLElement||"object"==typeof HTMLElement?function(a){return a instanceof HTMLElement}:function(a){return a&&"object"==typeof a&&1===a.nodeType&&"string"==typeof a.nodeName},n=Array.prototype.indexOf?function(a,b){return a.indexOf(b)}:function(a,b){for(var c=0,d=a.length;d>c;c++)if(a[c]===b)return c;return-1};"function"==typeof define&&define.amd?define("outlayer/outlayer",["eventie/eventie","doc-ready/doc-ready","eventEmitter/EventEmitter","get-size/get-size","matches-selector/matches-selector","./item"],g):"object"==typeof exports?module.exports=g(require("eventie"),require("doc-ready"),require("wolfy87-eventemitter"),require("get-size"),require("desandro-matches-selector"),require("./item")):a.Outlayer=g(a.eventie,a.docReady,a.EventEmitter,a.getSize,a.matchesSelector,a.Outlayer.Item)}(window),function(a,b){"function"==typeof define&&define.amd?define('masonry',["outlayer/outlayer","get-size/get-size"],b):"object"==typeof exports?module.exports=b(require("outlayer"),require("get-size")):a.Masonry=b(a.Outlayer,a.getSize)}(window,function(a,b){var c=Array.prototype.indexOf?function(a,b){return a.indexOf(b)}:function(a,b){for(var c=0,d=a.length;d>c;c++){var e=a[c];if(e===b)return c}return-1},d=a.create("masonry");return d.prototype._resetLayout=function(){this.getSize(),this._getMeasurement("columnWidth","outerWidth"),this._getMeasurement("gutter","outerWidth"),this.measureColumns();var a=this.cols;for(this.colYs=[];a--;)this.colYs.push(0);this.maxY=0},d.prototype.measureColumns=function(){if(this.getContainerWidth(),!this.columnWidth){var a=this.items[0],c=a&&a.element;this.columnWidth=c&&b(c).outerWidth||this.containerWidth}var d=this.columnWidth+=this.gutter,e=this.containerWidth+this.gutter,f=e/d,g=d-e%d,h=g&&1>g?"round":"floor";f=Math[h](f),this.cols=Math.max(f,1)},d.prototype.getContainerWidth=function(){var a=this.options.isFitWidth?this.element.parentNode:this.element,c=b(a);this.containerWidth=c&&c.innerWidth},d.prototype._getItemLayoutPosition=function(a){a.getSize();var b=a.size.outerWidth%this.columnWidth,d=b&&1>b?"round":"ceil",e=Math[d](a.size.outerWidth/this.columnWidth);e=Math.min(e,this.cols);for(var f=this._getColGroup(e),g=Math.min.apply(Math,f),h=c(f,g),i={x:this.columnWidth*h,y:g},j=g+a.size.outerHeight,k=this.cols+1-f.length,l=0;k>l;l++)this.colYs[h+l]=j;return i},d.prototype._getColGroup=function(a){if(2>a)return this.colYs;for(var b=[],c=this.cols+1-a,d=0;c>d;d++){var e=this.colYs.slice(d,d+a);b[d]=Math.max.apply(Math,e)}return b},d.prototype._manageStamp=function(a){var c=b(a),d=this._getElementOffset(a),e=this.options.isOriginLeft?d.left:d.right,f=e+c.outerWidth,g=Math.floor(e/this.columnWidth);g=Math.max(0,g);var h=Math.floor(f/this.columnWidth);h-=f%this.columnWidth?0:1,h=Math.min(this.cols-1,h);for(var i=(this.options.isOriginTop?d.top:d.bottom)+c.outerHeight,j=g;h>=j;j++)this.colYs[j]=Math.max(i,this.colYs[j])},d.prototype._getContainerSize=function(){this.maxY=Math.max.apply(Math,this.colYs);var a={height:this.maxY};return this.options.isFitWidth&&(a.width=this._getContainerFitWidth()),a},d.prototype._getContainerFitWidth=function(){for(var a=0,b=this.cols;--b&&0===this.colYs[b];)a++;return(this.cols-a)*this.columnWidth-this.gutter},d.prototype.needsResizeLayout=function(){var a=this.containerWidth;return this.getContainerWidth(),a!==this.containerWidth},d});
/*! showdown 27-05-2015 */
var Showdown={extensions:{}},forEach=Showdown.forEach=function(a,b){if("function"==typeof a.forEach)a.forEach(b);else{var c,d=a.length;for(c=0;d>c;c++)b(a[c],c,a)}},stdExtName=function(a){return a.replace(/[_-]||\s/g,"").toLowerCase()};Showdown.converter=function(a){var b,c,d,e=0,f=[],g=[];if("undefined"!=typeof module&&"undefined"!=typeof exports&&"undefined"!=typeof require){var h=require("fs");if(h){var i=h.readdirSync((__dirname||".")+"/extensions").filter(function(a){return~a.indexOf(".js")}).map(function(a){return a.replace(/\.js$/,"")});Showdown.forEach(i,function(a){var b=stdExtName(a);Showdown.extensions[b]=require("./extensions/"+a)})}}if(this.makeHtml=function(a){return b={},c={},d=[],a=a.replace(/~/g,"~T"),a=a.replace(/\$/g,"~D"),a=a.replace(/\r\n/g,"\n"),a=a.replace(/\r/g,"\n"),a="\n\n"+a+"\n\n",a=M(a),a=a.replace(/^[ \t]+$/gm,""),Showdown.forEach(f,function(b){a=l(b,a)}),a=z(a),a=n(a),a=m(a),a=p(a),a=K(a),a=a.replace(/~D/g,"$$"),a=a.replace(/~T/g,"~"),Showdown.forEach(g,function(b){a=l(b,a)}),a},a&&a.extensions){var j=this;Showdown.forEach(a.extensions,function(a){var b=a;if("string"==typeof a&&(a=Showdown.extensions[stdExtName(a)]),"function"!=typeof a)throw"Extension '"+b+"' could not be loaded.  It was either not found or is not a valid extension.";Showdown.forEach(a(j),function(a){a.type?"language"===a.type||"lang"===a.type?f.push(a):("output"===a.type||"html"===a.type)&&g.push(a):g.push(a)})})}var k,l=function(a,b){if(a.regex){var c=new RegExp(a.regex,"g");return b.replace(c,a.replace)}return a.filter?a.filter(b):void 0},m=function(a){return a+="~0",a=a.replace(/^[ ]{0,3}\[(.+)\]:[ \t]*\n?[ \t]*<?(\S+?)>?[ \t]*\n?[ \t]*(?:(\n*)["(](.+?)[")][ \t]*)?(?:\n+|(?=~0))/gm,function(a,d,e,f,g){return d=d.toLowerCase(),b[d]=G(e),f?f+g:(g&&(c[d]=g.replace(/"/g,"&quot;")),"")}),a=a.replace(/~0/,"")},n=function(a){a=a.replace(/\n/g,"\n\n");return a=a.replace(/^(<(p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math|ins|del)\b[^\r]*?\n<\/\2>[ \t]*(?=\n+))/gm,o),a=a.replace(/^(<(p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math|style|section|header|footer|nav|article|aside)\b[^\r]*?<\/\2>[ \t]*(?=\n+)\n)/gm,o),a=a.replace(/(\n[ ]{0,3}(<(hr)\b([^<>])*?\/?>)[ \t]*(?=\n{2,}))/g,o),a=a.replace(/(\n\n[ ]{0,3}<!(--[^\r]*?--\s*)+>[ \t]*(?=\n{2,}))/g,o),a=a.replace(/(?:\n\n)([ ]{0,3}(?:<([?%])[^\r]*?\2>)[ \t]*(?=\n{2,}))/g,o),a=a.replace(/\n\n/g,"\n")},o=function(a,b){var c=b;return c=c.replace(/\n\n/g,"\n"),c=c.replace(/^\n/,""),c=c.replace(/\n+$/g,""),c="\n\n~K"+(d.push(c)-1)+"K\n\n"},p=function(a){a=w(a);var b=A("<hr />");return a=a.replace(/^[ ]{0,2}([ ]?\*[ ]?){3,}[ \t]*$/gm,b),a=a.replace(/^[ ]{0,2}([ ]?\-[ ]?){3,}[ \t]*$/gm,b),a=a.replace(/^[ ]{0,2}([ ]?\_[ ]?){3,}[ \t]*$/gm,b),a=x(a),a=y(a),a=E(a),a=n(a),a=F(a)},q=function(a){return a=B(a),a=r(a),a=H(a),a=u(a),a=s(a),a=I(a),a=G(a),a=D(a),a=a.replace(/  +\n/g," <br />\n")},r=function(a){var b=/(<[a-z\/!$]("[^"]*"|'[^']*'|[^'">])*>|<!(--.*?--\s*)+>)/gi;return a=a.replace(b,function(a){var b=a.replace(/(.)<\/?code>(?=.)/g,"$1`");return b=N(b,"\\`*_")})},s=function(a){return a=a.replace(/(\[((?:\[[^\]]*\]|[^\[\]])*)\][ ]?(?:\n[ ]*)?\[(.*?)\])()()()()/g,t),a=a.replace(/(\[((?:\[[^\]]*\]|[^\[\]])*)\]\([ \t]*()<?(.*?(?:\(.*?\).*?)?)>?[ \t]*((['"])(.*?)\6[ \t]*)?\))/g,t),a=a.replace(/(\[([^\[\]]+)\])()()()()()/g,t)},t=function(a,d,e,f,g,h,i,j){void 0===j&&(j="");var k=d,l=e,m=f.toLowerCase(),n=g,o=j;if(""===n)if(""===m&&(m=l.toLowerCase().replace(/ ?\n/g," ")),n="#"+m,void 0!==b[m])n=b[m],void 0!==c[m]&&(o=c[m]);else{if(!(k.search(/\(\s*\)$/m)>-1))return k;n=""}n=N(n,"*_");var p='<a href="'+n+'"';return""!==o&&(o=o.replace(/"/g,"&quot;"),o=N(o,"*_"),p+=' title="'+o+'"'),p+=">"+l+"</a>"},u=function(a){return a=a.replace(/(!\[(.*?)\][ ]?(?:\n[ ]*)?\[(.*?)\])()()()()/g,v),a=a.replace(/(!\[(.*?)\]\s?\([ \t]*()<?(\S+?)>?[ \t]*((['"])(.*?)\6[ \t]*)?\))/g,v)},v=function(a,d,e,f,g,h,i,j){var k=d,l=e,m=f.toLowerCase(),n=g,o=j;if(o||(o=""),""===n){if(""===m&&(m=l.toLowerCase().replace(/ ?\n/g," ")),n="#"+m,void 0===b[m])return k;n=b[m],void 0!==c[m]&&(o=c[m])}l=l.replace(/"/g,"&quot;"),n=N(n,"*_");var p='<img src="'+n+'" alt="'+l+'"';return o=o.replace(/"/g,"&quot;"),o=N(o,"*_"),p+=' title="'+o+'"',p+=" />"},w=function(a){function b(a){return a.replace(/[^\w]/g,"").toLowerCase()}return a=a.replace(/^(.+)[ \t]*\n=+[ \t]*\n+/gm,function(a,c){return A('<h1 id="'+b(c)+'">'+q(c)+"</h1>")}),a=a.replace(/^(.+)[ \t]*\n-+[ \t]*\n+/gm,function(a,c){return A('<h2 id="'+b(c)+'">'+q(c)+"</h2>")}),a=a.replace(/^(\#{1,6})[ \t]*(.+?)[ \t]*\#*\n+/gm,function(a,c,d){var e=c.length;return A("<h"+e+' id="'+b(d)+'">'+q(d)+"</h"+e+">")})},x=function(a){a+="~0";var b=/^(([ ]{0,3}([*+-]|\d+[.])[ \t]+)[^\r]+?(~0|\n{2,}(?=\S)(?![ \t]*(?:[*+-]|\d+[.])[ \t]+)))/gm;return e?a=a.replace(b,function(a,b,c){var d=b,e=c.search(/[*+-]/g)>-1?"ul":"ol";d=d.replace(/\n{2,}/g,"\n\n\n");var f=k(d);return f=f.replace(/\s+$/,""),f="<"+e+">"+f+"</"+e+">\n"}):(b=/(\n\n|^\n?)(([ ]{0,3}([*+-]|\d+[.])[ \t]+)[^\r]+?(~0|\n{2,}(?=\S)(?![ \t]*(?:[*+-]|\d+[.])[ \t]+)))/g,a=a.replace(b,function(a,b,c,d){var e=b,f=c,g=d.search(/[*+-]/g)>-1?"ul":"ol";f=f.replace(/\n{2,}/g,"\n\n\n");var h=k(f);return h=e+"<"+g+">\n"+h+"</"+g+">\n"})),a=a.replace(/~0/,"")};k=function(a){return e++,a=a.replace(/\n{2,}$/,"\n"),a+="~0",a=a.replace(/(\n)?(^[ \t]*)([*+-]|\d+[.])[ \t]+([^\r]+?(\n{1,2}))(?=\n*(~0|\2([*+-]|\d+[.])[ \t]+))/gm,function(a,b,c,d,e){var f=e,g=b;return g||f.search(/\n{2,}/)>-1?f=p(L(f)):(f=x(L(f)),f=f.replace(/\n$/,""),f=q(f)),"<li>"+f+"</li>\n"}),a=a.replace(/~0/g,""),e--,a};var y=function(a){return a+="~0",a=a.replace(/(?:\n\n|^)((?:(?:[ ]{4}|\t).*\n+)+)(\n*[ ]{0,3}[^ \t\n]|(?=~0))/g,function(a,b,c){var d=b,e=c;return d=C(L(d)),d=M(d),d=d.replace(/^\n+/g,""),d=d.replace(/\n+$/g,""),d="<pre><code>"+d+"\n</code></pre>",A(d)+e}),a=a.replace(/~0/,"")},z=function(a){return a+="~0",a=a.replace(/(?:^|\n)```(.*)\n([\s\S]*?)\n```/g,function(a,b,c){var d=b,e=c;return e=C(e),e=M(e),e=e.replace(/^\n+/g,""),e=e.replace(/\n+$/g,""),e="<pre><code"+(d?' class="'+d+'"':"")+">"+e+"\n</code></pre>",A(e)}),a=a.replace(/~0/,"")},A=function(a){return a=a.replace(/(^\n+|\n+$)/g,""),"\n\n~K"+(d.push(a)-1)+"K\n\n"},B=function(a){return a=a.replace(/(^|[^\\])(`+)([^\r]*?[^`])\2(?!`)/gm,function(a,b,c,d,e){var f=d;return f=f.replace(/^([ \t]*)/g,""),f=f.replace(/[ \t]*$/g,""),f=C(f),b+"<code>"+f+"</code>"})},C=function(a){return a=a.replace(/&/g,"&amp;"),a=a.replace(/</g,"&lt;"),a=a.replace(/>/g,"&gt;"),a=N(a,"*_{}[]\\",!1)},D=function(a){return a=a.replace(/(\*\*|__)(?=\S)([^\r]*?\S[*_]*)\1/g,"<strong>$2</strong>"),a=a.replace(/(\*|_)(?=\S)([^\r]*?\S)\1/g,"<em>$2</em>")},E=function(a){return a=a.replace(/((^[ \t]*>[ \t]?.+\n(.+\n)*\n*)+)/gm,function(a,b){var c=b;return c=c.replace(/^[ \t]*>[ \t]?/gm,"~0"),c=c.replace(/~0/g,""),c=c.replace(/^[ \t]+$/gm,""),c=p(c),c=c.replace(/(^|\n)/g,"$1  "),c=c.replace(/(\s*<pre>[^\r]+?<\/pre>)/gm,function(a,b){var c=b;return c=c.replace(/^  /gm,"~0"),c=c.replace(/~0/g,"")}),A("<blockquote>\n"+c+"\n</blockquote>")})},F=function(a){a=a.replace(/^\n+/g,""),a=a.replace(/\n+$/g,"");for(var b=a.split(/\n{2,}/g),c=[],e=b.length,f=0;e>f;f++){var g=b[f];g.search(/~K(\d+)K/g)>=0?c.push(g):g.search(/\S/)>=0&&(g=q(g),g=g.replace(/^([ \t]*)/g,"<p>"),g+="</p>",c.push(g))}for(e=c.length,f=0;e>f;f++)for(;c[f].search(/~K(\d+)K/)>=0;){var h=d[RegExp.$1];h=h.replace(/\$/g,"$$$$"),c[f]=c[f].replace(/~K\d+K/,h)}return c.join("\n\n")},G=function(a){return a=a.replace(/&(?!#?[xX]?(?:[0-9a-fA-F]+|\w+);)/g,"&amp;"),a=a.replace(/<(?![a-z\/?\$!])/gi,"&lt;")},H=function(a){return a=a.replace(/\\(\\)/g,O),a=a.replace(/\\([`*_{}\[\]()>#+-.!])/g,O)},I=function(a){return a=a.replace(/<((https?|ftp|dict):[^'">\s]+)>/gi,'<a href="$1">$1</a>'),a=a.replace(/<(?:mailto:)?([-.\w]+\@[-a-z0-9]+(\.[-a-z0-9]+)*\.[a-z]+)>/gi,function(a,b){return J(K(b))})},J=function(a){var b=[function(a){return"&#"+a.charCodeAt(0)+";"},function(a){return"&#x"+a.charCodeAt(0).toString(16)+";"},function(a){return a}];return a="mailto:"+a,a=a.replace(/./g,function(a){if("@"==a)a=b[Math.floor(2*Math.random())](a);else if(":"!=a){var c=Math.random();a=c>.9?b[2](a):c>.45?b[1](a):b[0](a)}return a}),a='<a href="'+a+'">'+a+"</a>",a=a.replace(/">.+:/g,'">')},K=function(a){return a=a.replace(/~E(\d+)E/g,function(a,b){var c=parseInt(b);return String.fromCharCode(c)})},L=function(a){return a=a.replace(/^(\t|[ ]{1,4})/gm,"~0"),a=a.replace(/~0/g,"")},M=function(a){return a=a.replace(/\t(?=\t)/g,"    "),a=a.replace(/\t/g,"~A~B"),a=a.replace(/~B(.+?)~A/g,function(a,b,c){for(var d=b,e=4-d.length%4,f=0;e>f;f++)d+=" ";return d}),a=a.replace(/~A/g,"    "),a=a.replace(/~B/g,"")},N=function(a,b,c){var d="(["+b.replace(/([\[\]\\])/g,"\\$1")+"])";c&&(d="\\\\"+d);var e=new RegExp(d,"g");return a=a.replace(e,O)},O=function(a,b){var c=b.charCodeAt(0);return"~E"+c+"E"}},"undefined"!=typeof module&&(module.exports=Showdown),"function"==typeof define&&define.amd&&define("showdown",[],function(){return Showdown}),"undefined"!=typeof angular&&"undefined"!=typeof Showdown&&!function(a,b){function c(){function a(){var a=new b.converter(c);this.makeHtml=function(b){return a.makeHtml(b)},this.stripHtml=function(a){return String(a).replace(/<[^>]+>/gm,"")}}var c={extensions:[],stripHtml:!0};this.setOption=function(a,b){return c.key=b,this},this.getOption=function(a){return c.hasOwnProperty(a)?c.key:null},this.loadExtension=function(a){return c.extensions.push(a),this},this.$get=function(){return new a}}function d(a,b){var c=function(c,d){c.$watch("model",function(c){var e;e="string"==typeof c?b(a.makeHtml(c)):typeof c,d.html(e)})};return{restrict:"A",link:c,scope:{model:"=sdModelToHtml"}}}function e(){return function(a){return String(a).replace(/<[^>]+>/gm,"")}}a.provider("$Showdown",c).directive("sdModelToHtml",["$Showdown","$sanitize",d]).filter("sdStripHtml",e)}(angular.module("Showdown",["ngSanitize"]),Showdown);
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
define("showdown-github", function(){});

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
define("showdown-table", function(){});

/*! http://mths.be/placeholder v2.0.7 by @mathias */
;(function(f,h,$){var a='placeholder' in h.createElement('input'),d='placeholder' in h.createElement('textarea'),i=$.fn,c=$.valHooks,k,j;if(a&&d){j=i.placeholder=function(){return this};j.input=j.textarea=true}else{j=i.placeholder=function(){var l=this;l.filter((a?'textarea':':input')+'[placeholder]').not('.placeholder').bind({'focus.placeholder':b,'blur.placeholder':e}).data('placeholder-enabled',true).trigger('blur.placeholder');return l};j.input=a;j.textarea=d;k={get:function(m){var l=$(m);return l.data('placeholder-enabled')&&l.hasClass('placeholder')?'':m.value},set:function(m,n){var l=$(m);if(!l.data('placeholder-enabled')){return m.value=n}if(n==''){m.value=n;if(m!=h.activeElement){e.call(m)}}else{if(l.hasClass('placeholder')){b.call(m,true,n)||(m.value=n)}else{m.value=n}}return l}};a||(c.input=k);d||(c.textarea=k);$(function(){$(h).delegate('form','submit.placeholder',function(){var l=$('.placeholder',this).each(b);setTimeout(function(){l.each(e)},10)})});$(f).bind('beforeunload.placeholder',function(){$('.placeholder').each(function(){this.value=''})})}function g(m){var l={},n=/^jQuery\d+$/;$.each(m.attributes,function(p,o){if(o.specified&&!n.test(o.name)){l[o.name]=o.value}});return l}function b(m,n){var l=this,o=$(l);if(l.value==o.attr('placeholder')&&o.hasClass('placeholder')){if(o.data('placeholder-password')){o=o.hide().next().show().attr('id',o.removeAttr('id').data('placeholder-id'));if(m===true){return o[0].value=n}o.focus()}else{l.value='';o.removeClass('placeholder');l==h.activeElement&&l.select()}}}function e(){var q,l=this,p=$(l),m=p,o=this.id;if(l.value==''){if(l.type=='password'){if(!p.data('placeholder-textinput')){try{q=p.clone().attr({type:'text'})}catch(n){q=$('<input>').attr($.extend(g(this),{type:'text'}))}q.removeAttr('name').data({'placeholder-password':true,'placeholder-id':o}).bind('focus.placeholder',b);p.data({'placeholder-textinput':q,'placeholder-id':o}).before(q)}p=p.removeAttr('id').hide().prev().attr('id',o).show()}p.addClass('placeholder');p[0].value=p.attr('placeholder')}else{p.removeClass('placeholder')}}}(this,document,jQuery));
define("jquery.placeholder", function(){});

/**
 * Patterns logging - minimal logging framework
 *
 * Copyright 2012 Simplon B.V.
 */

(function() {
    // source: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Function/bind
    if (!Function.prototype.bind) {
        Function.prototype.bind = function (oThis) {
            if (typeof this !== "function") {
                // closest thing possible to the ECMAScript 5 internal IsCallable function
                throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
            }

            var aArgs = Array.prototype.slice.call(arguments, 1),
                fToBind = this,
                fNOP = function () {},
                fBound = function () {
                    return fToBind.apply(this instanceof fNOP &&
                            oThis ? this : oThis,
                            aArgs.concat(Array.prototype.slice.call(arguments)));
                };
            fNOP.prototype = this.prototype;
            fBound.prototype = new fNOP();

            return fBound;
        };
    }

    var root,    // root logger instance
        writer;  // writer instance, used to output log entries

    var Level = {
        DEBUG: 10,
        INFO: 20,
        WARN: 30,
        ERROR: 40,
        FATAL: 50
    };

    function IEConsoleWriter() {
    }

    IEConsoleWriter.prototype = {
        output:  function(log_name, level, messages) {
            // console.log will magically appear in IE8 when the user opens the
            // F12 Developer Tools, so we have to test for it every time.
            if (typeof window.console==="undefined" || typeof console.log==="undefined")
                    return;
            if (log_name)
                messages.unshift(log_name+":");
            var message = messages.join(" ");

            // Under some conditions console.log will be available but the
            // other functions are missing.
            if (typeof console.info===undefined) {
                var level_name;
                if (level<=Level.DEBUG)
                    level_name="DEBUG";
                else if (level<=Level.INFO)
                    level_name="INFO";
                else if (level<=Level.WARN)
                    level_name="WARN";
                else if (level<=Level.ERROR)
                    level_name="ERROR";
                else
                    level_name="FATAL";
                console.log("["+level_name+"] "+message);
            } else {
                if (level<=Level.DEBUG) {
                    // console.debug exists but is deprecated
                    message="[DEBUG] "+message;
                    console.log(message);
                } else if (level<=Level.INFO)
                    console.info(message);
                else if (level<=Level.WARN)
                    console.warn(message);
                else
                    console.error(message);
            }
        }
    };


    function ConsoleWriter() {
    }

    ConsoleWriter.prototype = {
        output: function(log_name, level, messages) {
            if (log_name)
                messages.unshift(log_name+":");
            if (level<=Level.DEBUG) {
                // console.debug exists but is deprecated
                messages.unshift("[DEBUG]");
                console.log.apply(console, messages);
            } else if (level<=Level.INFO)
                console.info.apply(console, messages);
            else if (level<=Level.WARN)
                console.warn.apply(console, messages);
            else
                console.error.apply(console, messages);
        }
    };


    function Logger(name, parent) {
        this._loggers={};
        this.name=name || "";
        this._parent=parent || null;
        if (!parent) {
            this._enabled=true;
            this._level=Level.WARN;
        }
    }

    Logger.prototype = {
        getLogger: function(name) {
            var path = name.split("."),
                root = this,
                route = this.name ? [this.name] : [];
            while (path.length) {
                var entry = path.shift();
                route.push(entry);
                if (!(entry in root._loggers))
                    root._loggers[entry] = new Logger(route.join("."), root);
                root=root._loggers[entry];
            }
            return root;
        },

        _getFlag: function(flag) {
            var context=this;
            flag="_"+flag;
            while (context!==null) {
                if (context[flag]!==undefined)
                    return context[flag];
                context=context._parent;
            }
            return null;
        },

        setEnabled: function(state) {
            this._enabled=!!state;
        },

        isEnabled: function() {
            this._getFlag("enabled");
        },

        setLevel: function(level) {
            if (typeof level==="number")
                this._level=level;
            else if (typeof level==="string") {
                level=level.toUpperCase();
                if (level in Level)
                    this._level=Level[level];
            }
        },

        getLevel: function() {
            return this._getFlag("level");
        },

        log: function(level, messages) {
            if (!messages.length || !this._getFlag("enabled") || level<this._getFlag("level"))
                return;
            messages=Array.prototype.slice.call(messages);
            writer.output(this.name, level, messages);
        },

        debug: function() {
            this.log(Level.DEBUG, arguments);
        },

        info: function() {
            this.log(Level.INFO, arguments);
        },

        warn: function() {
            this.log(Level.WARN, arguments);
        },

        error: function() {
            this.log(Level.ERROR, arguments);
        },

        fatal: function() {
            this.log(Level.FATAL, arguments);
        }
    };

    function getWriter() {
        return writer;
    }

    function setWriter(w) {
        writer=w;
    }

    if (!window.console || !window.console.log || typeof window.console.log.apply !== "function") {
        setWriter(new IEConsoleWriter());
    } else {
        setWriter(new ConsoleWriter());
    }

    root=new Logger();

    var logconfig = /loglevel(|-[^=]+)=([^&]+)/g,
        match;

    while ((match=logconfig.exec(window.location.search))!==null) {
        var logger = (match[1]==="") ? root : root.getLogger(match[1].slice(1));
        logger.setLevel(match[2].toUpperCase());
    }

    var api = {
        Level: Level,
        getLogger: root.getLogger.bind(root),
        setEnabled: root.setEnabled.bind(root),
        isEnabled: root.isEnabled.bind(root),
        setLevel: root.setLevel.bind(root),
        getLevel: root.getLevel.bind(root),
        debug: root.debug.bind(root),
        info: root.info.bind(root),
        warn: root.warn.bind(root),
        error: root.error.bind(root),
        fatal: root.fatal.bind(root),
        getWriter: getWriter,
        setWriter: setWriter
    };

    // Expose as either an AMD module if possible. If not fall back to exposing
    // a global object.
    if (typeof define==="function")
        define("logging", [], function () {
            return api;
        });
    else
        window.logging=api;
})();

/**
 * Patterns logger - wrapper around logging library
 *
 * Copyright 2012-2013 Florian Friesdorf
 */
define('pat-logger',[
    'logging'
], function(logging) {
    var log = logging.getLogger('patterns');
    return log;
});

/**
 * Patterns registry - Central registry and scan logic for patterns
 *
 * Copyright 2012-2013 Simplon B.V.
 * Copyright 2012-2013 Florian Friesdorf
 * Copyright 2013 Marko Durkovic
 * Copyright 2013 Rok Garbas
 * Copyright 2014-2015 Syslab.com GmBH, JC Brand
 */

/*
 * changes to previous patterns.register/scan mechanism
 * - if you want initialised class, do it in init
 * - init returns set of elements actually initialised
 * - handle once within init
 * - no turnstile anymore
 * - set pattern.jquery_plugin if you want it
 */
define('pat-registry',[
    "jquery",
    "underscore",
    "pat-logger",
    "pat-utils",
    // below here modules that are only loaded
    "pat-compat",
    "pat-jquery-ext"
], function($, _, logger, utils) {
    var TEXT_NODE = 3;
    var COMMENT_NODE = 8;
    var log = logger.getLogger("registry");

    var disable_re = /patterns-disable=([^&]+)/g,
        dont_catch_re = /patterns-dont-catch/g,
        dont_catch = false,
        disabled = {}, match;

    while ((match=disable_re.exec(window.location.search)) !== null) {
        disabled[match[1]] = true;
        log.info("Pattern disabled via url config:", match[1]);
    }

    while ((match=dont_catch_re.exec(window.location.search)) !== null) {
        dont_catch = true;
        log.info("I will not catch init exceptions");
    }

    var registry = {
        patterns: {},
        // as long as the registry is not initialized, pattern
        // registration just registers a pattern. Once init is called,
        // the DOM is scanned. After that registering a new pattern
        // results in rescanning the DOM only for this pattern.
        initialized: false,
        init: function registry_init() {
            $(document).ready(function() {
                log.info("loaded: " + Object.keys(registry.patterns).sort().join(", "));
                registry.scan(document.body);
                registry.initialized = true;
                log.info("finished initial scan.");
            });
        },

        clear: function clearRegistry() {
            // Removes all patterns from the registry. Currently only being
            // used in tests.
            this.patterns = {};
        },

        transformPattern: function(name, content) {
            /* Call the transform method on the pattern with the given name, if
             * it exists.
             */
            if (disabled[name]) {
                log.debug("Skipping disabled pattern:", name);
                return;
            }
            var pattern = registry.patterns[name];
            if (pattern.transform) {
                try {
                    pattern.transform($(content));
                } catch (e) {
                    if (dont_catch) { throw(e); }
                    log.error("Transform error for pattern" + name, e);
                }
            }
        },

        initPattern: function(name, el, trigger) {
            /* Initialize the pattern with the provided name and in the context
             * of the passed in DOM element.
             */
            var $el = $(el);
            var pattern = registry.patterns[name];
            if (pattern.init) {
                plog = logger.getLogger("pat." + name);
                if ($el.is(pattern.trigger)) {
                    plog.debug("Initialising:", $el);
                    try {
                        pattern.init($el, null, trigger);
                        plog.debug("done.");
                    } catch (e) {
                        if (dont_catch) { throw(e); }
                        plog.error("Caught error:", e);
                    }
                }
            }
        },

        orderPatterns: function (patterns) {
            // XXX: Bit of a hack. We need the validation pattern to be
            // parsed and initiated before the inject pattern. So we make
            // sure here, that it appears first. Not sure what would be
            // the best solution. Perhaps some kind of way to register
            // patterns "before" or "after" other patterns.
            if (_.contains(patterns, "validation") && _.contains(patterns, "inject")) {
                patterns.splice(patterns.indexOf("validation"), 1);
                patterns.unshift("validation");
            }
            return patterns;
        },

        scan: function registryScan(content, patterns, trigger) {
            var selectors = [], $match, plog;
            patterns = this.orderPatterns(patterns || Object.keys(registry.patterns));
            patterns.forEach(_.partial(this.transformPattern, _, content));
            patterns = _.each(patterns, function (name) {
                var pattern = registry.patterns[name];
                if (pattern.trigger) {
                    selectors.unshift(pattern.trigger);
                }
            });
            $match = $(content).findInclusive(selectors.join(",")); // Find all DOM elements belonging to a pattern
            $match = $match.filter(function() { return $(this).parents("pre").length === 0; });
            $match = $match.filter(":not(.cant-touch-this)");

            // walk list backwards and initialize patterns inside-out.
            $match.toArray().reduceRight(function registryInitPattern(acc, el) {
                patterns.forEach(_.partial(this.initPattern, _, el, trigger));
            }.bind(this), null);
            $("body").addClass("patterns-loaded");
        },

        register: function registry_register(pattern, name) {
            var plugin_name, jquery_plugin;
            name = name || pattern.name;
            if (!name) {
                log.error("Pattern lacks a name:", pattern);
                return false;
            }
            if (registry.patterns[name]) {
                log.error("Already have a pattern called: " + name);
                return false;
            }

            // register pattern to be used for scanning new content
            registry.patterns[name] = pattern;

            // register pattern as jquery plugin
            if (pattern.jquery_plugin) {
                plugin_name = ("pat-" + name)
                        .replace(/-([a-zA-Z])/g, function(match, p1) {
                            return p1.toUpperCase();
                        });
                $.fn[plugin_name] = utils.jqueryPlugin(pattern);
                // BBB 2012-12-10 and also for Mockup patterns.
                $.fn[plugin_name.replace(/^pat/, "pattern")] = $.fn[plugin_name];
            }
            log.debug("Registered pattern:", name, pattern);
            if (registry.initialized) {
                registry.scan(document.body, [name]);
            }
            return true;
        }
    };

    $(document).on("patterns-injected.patterns",
        function registry_onInject(ev, config, trigger_el, injected_el) {
            if (injected_el.nodeType !== TEXT_NODE && injected_el !== COMMENT_NODE) {
                registry.scan(injected_el, null, {type: "injection", element: trigger_el});
                $(injected_el).trigger("patterns-injected-scanned");
            }
        }
    );
    return registry;
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
                _.registerHandlersForElement($el);
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
/**
 * Patterns parser - Argument parser
 *
 * Copyright 2012-2013 Florian Friesdorf
 * Copyright 2012-2013 Simplon B.V. - Wichert Akkerman
 */
define('pat-parser',[
    "jquery",
    "underscore",
    "pat-logger"
], function($, _, logger) {
    

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
            var parts = argstring.replace(";;", "\xff").split(";")
                        .map(function(el) { return el.replace("\xff", ";"); });
            _.each(parts, function (part, i) {
                if (!part) { return; }
                var matches = part.match(this.named_param_pattern);
                if (!matches) {
                    this.log.warn("Invalid parameter: " + part);
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
                i, part, flag, sense;

            i=0;
            while (parts.length) {
                part=parts.shift().trim();
                if (part.slice(0, 3)==="no-") {
                    sense=false;
                    flag=part.slice(3);
                } else {
                    sense=true;
                    flag=part;
                }
                if (flag in this.parameters && this.parameters[flag].type==="boolean") {
                    positional=false;
                    this._set(opts, flag, sense);
                } else if (flag in this.enum_values) {
                    positional=false;
                    this._set(opts, this.enum_values[flag], flag);
                } else if (positional)
                    this._set(opts, this.order[i], part);
                else {
                    parts.unshift(part);
                    break;
                }
                i++;
                if (i>=this.order.length)
                    break;
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
            if (sep===-1) {
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
                if (typeof this.parameters[name].value==="function")
                    try {
                        result[name]=this.parameters[name].value($el, name);
                        this.parameters[name].type=typeof result[name];
                    } catch(e) {
                        this.log.error("Default function for " + name + " failed.");
                    }
                else
                    result[name]=this.parameters[name].value;
            return result;
        },

        _cleanupOptions: function argParserCleanupOptions(options) {
            var keys = Object.keys(options),
                i, spec, name, target;

            // Resolve references
            for (i=0; i<keys.length; i++) {
                name=keys[i];
                spec=this.parameters[name];
                if (spec===undefined)
                    continue;

                if (options[name]===spec.value &&
                        typeof spec.value==="string" && spec.value.slice(0, 1)==="$")
                    options[name]=options[spec.value.slice(1)];
            }

            // Move options into groups and do renames
            keys=Object.keys(options);
            for (i=0; i<keys.length; i++) {
                name=keys[i];
                spec=this.parameters[name];
                if (spec===undefined)
                    continue;

                if (spec.group)  {
                    if (typeof options[spec.group]!=="object")
                        options[spec.group]={};
                    target=options[spec.group];
                } else
                    target=options;

                if (spec.dest!==name) {
                    target[spec.dest]=options[name];
                    delete options[name];
                }
            }
        },

        parse: function argParserParse($el, options, multiple, inherit) {
            if (typeof options==="boolean" && multiple===undefined) {
                multiple=options;
                options={};
            }
            inherit = (inherit!==false);
            var stack = inherit ? [[this._defaults($el)]] : [[{}]];
            var $possible_config_providers = inherit ? $el.parents().andSelf() : $el,
                final_length = 1,
                i, data, frame;
            for (i=0; i<$possible_config_providers.length; i++) {
                data = $possible_config_providers.eq(i).attr(this.attribute);
                if (data) {
                    var _parse = this._parse.bind(this); // Needed to fix binding in map call
                    if (data.match(/&&/))
                        frame=data.split(/\s*&&\s*/).map(_parse);
                    else
                        frame=[_parse(data)];
                    final_length = Math.max(frame.length, final_length);
                    stack.push(frame);
                }
            }
            if (typeof options==="object") {
                if (Array.isArray(options)) {
                    stack.push(options);
                    final_length=Math.max(options.length, final_length);
                } else
                    stack.push([options]);
            }

            if (!multiple) {
                final_length=1;
            }
            var results=[], frame_length, x, xf;
            for (i=0; i<final_length; i++)
                results.push({});

            for (i=0; i<stack.length; i++) {
                frame=stack[i];
                frame_length=frame.length-1;

                for (x=0; x<final_length; x++) {
                    xf=(x>frame_length) ? frame_length : x;
                    results[x]=$.extend(results[x], frame[xf]);
                }
            }
            for (i=0; i<results.length; i++)
                this._cleanupOptions(results[i]);

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
                onSuccess = function(data, status, jqxhr) {
                    log.debug("success: jqxhr:", jqxhr);
                    $el.trigger({
                        type: "pat-ajax-success",
                        jqxhr: jqxhr
                    });
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

/**
 * Patterns autoscale - scale elements to fit available space
 *
 * Copyright 2012 Humberto Sermeno
 * Copyright 2013 Simplon B.V. - Wichert Akkerman
 */
define('pat-auto-scale',[
    "jquery",
    "jquery.browser",
    "pat-registry",
    "pat-parser"
], function($, dummy, registry, Parser) {
    var parser = new Parser("auto-scale");
    parser.addArgument("method", "scale", ["scale", "zoom"]);
    parser.addArgument("min-width", 0);
    parser.addArgument("max-width", 1000000);

    var _ = {
        name: "autoscale",
        trigger: ".pat-auto-scale",
        force_method: null,

        _setup: function() {
            if ($.browser.mozilla)
                // See https://bugzilla.mozilla.org/show_bug.cgi?id=390936
                _.force_method="scale";
            else if ($.browser.msie && parseInt($.browser.version, 10)<9)
                _.force_method="zoom";
            $(document).ready(function() {
                $(window).one("resize.autoscale", _.onResize);
            });
        },

        init: function($el, opts) {
            return $el.each(function() {
                var $el = $(this),
                    options = parser.parse($el, opts);

                if (_.force_method!==null)
                    options.method=_.force_method;

                $el.data("patterns.auto-scale", options);
                _.scale.apply(this, []);
            });
        },

        scale: function() {
            var $el = $(this),
                options = $el.data("patterns.auto-scale"),
                available_space, scale;

            if ($el[0].tagName.toLowerCase()==="body")
                available_space=$(window).width();
            else
                available_space=$el.parent().outerWidth();

            available_space=Math.min(available_space, options.maxWidth);
            available_space=Math.max(available_space, options.minWidth);
            scale=available_space/$el.outerWidth();

            switch (options.method) {
            case "scale":
                $el.css("transform", "scale(" + scale + ")");
                break;
            case "zoom":
                $el.css("zoom", scale);
                break;
            }
            $el.addClass("scaled");
        },

        onResize: function() {
            $(_.trigger).each(_.scale);

            // necassary at least for IE8
            setTimeout(function() {
                $(window).one("resize.autoscale", _.onResize);
            }, 100);
        }
    };

    _._setup();
    registry.register(_);
    return _;
});

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
                        type: "POST",
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
/**
 * Patterns bumper - `bumper' handling for elements
 *
 * Copyright 2012 Humberto Sermeno
 * Copyright 2013 Florian Friesdorf
 * Copyright 2013-2014 Simplon B.V. - Wichert Akkerman
 */
define('pat-bumper',[
    "jquery",
    "pat-logger",
    "pat-parser",
    "pat-registry",
    "modernizr",
    "modernizr-csspositionsticky"
], function($, logger, Parser, registry) {
    var parser = new Parser("bumper"),
        log = logger.getLogger("bumper");

    parser.addArgument("margin", 0);
    parser.addArgument("selector");
    parser.addArgument("bump-add", "bumped");
    parser.addArgument("bump-remove");
    parser.addArgument("unbump-add");
    parser.addArgument("unbump-remove", "bumped");
    parser.addArgument("side", "top");

    // XXX Handle resize
    var bumper = {
        name: "bumper",
        trigger: ".pat-bumper",

        init: function bumper_init($el, opts) {
            return $el.each(function bumper_initElement() {
                var container = bumper._findScrollContainer(this),
                    $sticker = $(this),
                    options = parser.parse($sticker, opts);

                if (Modernizr.csspositionsticky) {
                    $sticker.addClass("sticky-supported");
                }
                $sticker.data("pat-bumper:config", options);

                this.style.position="relative";
                if (container===null) {
                    $(window).on("scroll.bumper", null, this, bumper._onScrollWindow);
                    bumper._updateStatus(this);
                } else {
                    if (this.offsetParent!==container) {
                        var old_style = container.style.position;
                        container.style.position="relative";
                        if (this.offsetParent!==container) {
                            container.style.position=old_style;
                            log.error("The offset parent for ", this,
                                      " must be its scrolling container ", container,
                                      "but it is ", this.offsetParent);
                            return;
                        }
                    }
                    $(container).on("scroll.bumper", null, this, bumper._onScrollContainer);
                    bumper._updateStatus(this, container);
                }

                var bumpall = (options.side.indexOf("all") > -1);
                options.bumptop =    bumpall || (options.side.indexOf("top") > -1);
                options.bumpright =  bumpall || (options.side.indexOf("right") > -1);
                options.bumpbottom = bumpall || (options.side.indexOf("bottom") > -1);
                options.bumpleft =   bumpall || (options.side.indexOf("left") > -1);
            });
        },

        _findScrollContainer: function bumper_findScrollContainer(el) {
            var parent = el.parentElement;
            while (parent!==document.body && parent!==null) {
                var overflowY = $(parent).css("overflow-y");
                if ((overflowY==="auto" || overflowY==="scroll"))
                    return parent;
                parent=parent.parentElement;
            }
            return null;
        },

        _markBumped: function bumper_markBumper($sticker, options, is_bumped) {
            var $target = options.selector ? $(options.selector) : $sticker,
                todo = is_bumped ? options.bump : options.unbump;

            if (todo.add)
                $target.addClass(todo.add);
            if (todo.remove)
                $target.removeClass(todo.remove);
        },

        _onScrollContainer: function bumper_onScrollContainer(e) {
            var container = e.currentTarget,
                sticker = e.data;
            bumper._updateStatus(sticker, container);
        },

        _onScrollWindow: function bumper_onScrollWindow(e) {
            bumper._updateStatus(e.data);
        },

        _updateStatus: function(sticker) {
            var $sticker = $(sticker),
                options = $sticker.data("pat-bumper:config"),
                margin = options ? options.margin : 0,
                frame,
                box = bumper._getBoundingBox($sticker, margin),
                delta = {};

            if (arguments.length == 1)
              frame = bumper._getViewport();
            else if (arguments.length == 2)
              frame = bumper._getBoundingBox($(arguments[1]), margin);

            delta.top=sticker.style.top ? parseFloat($sticker.css("top")) : 0;
            delta.left=sticker.style.left ? parseFloat($sticker.css("left")) : 0;

            box.top-=delta.top;
            box.bottom-=delta.top;
            box.left-=delta.left;
            box.right-=delta.left;

            if ((frame.top > box.top) && options.bumptop)
                sticker.style.top=(frame.top - box.top) + "px";
            else if ((frame.bottom < box.bottom) && options.bumpbottom)
                sticker.style.top=(frame.bottom - box.bottom) + "px";
            else
                sticker.style.top="";

            if ((frame.left > box.left) && options.bumpleft)
                sticker.style.left=(frame.left - box.left) + "px";
            else if ((frame.right < box.right) && options.bumpright)
                sticker.style.left=(frame.right - box.right) + "px";
            else
                sticker.style.left="";

            bumper._markBumped($sticker, options, !!(sticker.style.top || sticker.style.left));
        },

        // Calculates the bounding box for the current viewport
        _getViewport: function bumper_getViewport() {
            var $win = $(window),
                view = {
                    top: $win.scrollTop(),
                    left: $win.scrollLeft()
                };

            view.right=view.left + $win.width();
            view.bottom=view.top + $win.height();
            return view;
        },

        /**
         * Calculates the bounding box for a given element, taking margins
         * into consideration
         */
        _getBoundingBox: function bumper_getBoundingBox($sticker, margin) {
            var box = $sticker.offset();
            margin = margin ? margin : 0;
            box.top -= (parseFloat($sticker.css("margin-top")) || 0) + margin;
            box.left -= (parseFloat($sticker.css("margin-left")) || 0) + margin;
            box.right = box.left + $sticker.outerWidth(true) + (2 * margin);
            box.bottom = box.top + $sticker.outerHeight(true) + (2 * margin);
            return box;
        }
    };
    registry.register(bumper);
    return bumper;
});

// vim: sw=4 expandtab
;
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
/*
 * changes to previous injection implementations
 * - no support for data-injection anymore, switch to new data-inject
 * - no support for data-href-next anymore, switch to data-inject: next-href
 * - XXX: add support for forms, see remnants in inject1 and ajaxify
 */
define('pat-inject',[
    "jquery",
    "pat-ajax",
    "pat-parser",
    "pat-logger",
    "pat-registry",
    "pat-utils",
    "pat-htmlparser",
    "pat-jquery-ext"  // for :scrollable for autoLoading-visible
], function($, ajax, Parser, logger, registry, utils, htmlparser) {
    var log = logger.getLogger("pat.inject"),
        parser = new Parser("inject"),
        TEXT_NODE = 3;

    parser.addArgument("selector");
    parser.addArgument("target");
    parser.addArgument("data-type", "html");
    parser.addArgument("next-href");
    parser.addArgument("source");
    parser.addArgument("trigger", "default", ["default", "autoload", "autoload-visible"]);
    /* Once injection has completed successfully, pat-inject will trigger
     * an event for each hook: pat-inject-hook-$(hook)
     */
    parser.addArgument("hooks", [], ["raptor"], true);
    parser.addArgument("class"); // Add a class to the injected content.
    parser.addArgument("history");
    // XXX: this should not be here but the parser would bail on
    // unknown parameters and expand/collapsible need to pass the url
    // to us
    parser.addArgument("url");

    var _ = {
        name: "inject",
        trigger: "a.pat-inject, form.pat-inject, .pat-subform.pat-inject",
        init: function inject_init($el, opts) {
            if ($el.length > 1) {
                return $el.each(function() { _.init($(this), opts); });
            }
            var cfgs = _.extractConfig($el, opts);
            // if the injection shall add a history entry and HTML5 pushState
            // is missing, then don't initialize the injection.
            if (cfgs.some(function(e){return e.history === "record";}) &&
                    !("pushState" in history))
                return $el;
            $el.data("pat-inject", cfgs);

            // In case next-href is specified the anchor's href will
            // be set to it after the injection is triggered. In case
            // the next href already exists, we do not activate the
            // injection but instead just change the anchors href.
            //
            // XXX: This is used in only one project for linked
            // fullcalendars, it's sanity is wonky and we should
            // probably solve it differently. -- Maybe it's cool
            // after all.
            var $nexthref = $(cfgs[0].nextHref);
            if ($el.is("a") && $nexthref.length > 0) {
                log.debug("Skipping as next href already exists", $nexthref);
                // XXX: reconsider how the injection enters exhausted state
                return $el.attr({href: (window.location.href.split("#")[0] || "") +
                                 cfgs[0].nextHref});
            }

            switch (cfgs[0].trigger) {
                case "default":
                    // setup event handlers
                    if ($el.is("a")) {
                        $el.on("click.pat-inject", _.onClick);
                    } else if ($el.is("form")) {
                        $el.on("submit.pat-inject", _.onSubmit)
                        .on("click.pat-inject", "[type=submit]", ajax.onClickSubmit)
                        .on("click.pat-inject", "[type=submit][formaction], [type=image][formaction]", _.onFormActionSubmit);
                    } else if ($el.is(".pat-subform")) {
                        log.debug("Initializing subform with injection");
                    }
                    break;
                case "autoload":
                    _.onClick.apply($el[0], []);
                    break;
                case "autoload-visible":
                    _._initAutoloadVisible($el);
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

        onClick: function inject_onClick(ev) {
            var cfgs = $(this).data("pat-inject"),
                $el = $(this);
            if (ev)
                ev.preventDefault();
            $el.trigger("patterns-inject-triggered");
            _.execute(cfgs, $el);
        },

        onSubmit: function inject_onSubmit(ev) {
            var cfgs = $(this).data("pat-inject"),
                $el = $(this);
            if (ev)
                ev.preventDefault();
            $el.trigger("patterns-inject-triggered");
            _.execute(cfgs, $el);
        },

        onFormActionSubmit: function inject_onFormActionSubmit(ev) {
            ajax.onClickSubmit(ev); // make sure the submitting button is sent with the form

            var $button = $(ev.target),
                formaction = $button.attr("formaction"),
                $form = $button.parents(".pat-inject").first(),
                opts = {url: formaction},
                cfgs = _.extractConfig($form, opts);

            ev.preventDefault();
            $form.trigger("patterns-inject-triggered");
            _.execute(cfgs, $form);
        },

        submitSubform: function inject_submitSubform($sub) {
            var $el = $sub.parents("form"),
                cfgs = $sub.data("pat-inject");
            try {
                $el.trigger("patterns-inject-triggered");
            } catch (e) {
                log.error("patterns-inject-triggered", e);
            }
            _.execute(cfgs, $el);
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
        // verify and post-process config
        // XXX: this should return a command instead of messing around on the config
        verifyConfig: function inject_verifyConfig(cfgs, $el) {
            var url = cfgs[0].url;

            // verification for each cfg in the array needs to succeed
            return cfgs.every(function inject_verifyConfig_each(cfg) {
                // in case of multi-injection, all injections need to use
                // the same url
                if (cfg.url !== url) {
                    log.error("Unsupported different urls for multi-inject");
                    return false;
                }

                // defaults
                cfg.source = cfg.source || cfg.selector;
                cfg.target = cfg.target || cfg.selector;

                if (!_._extractModifiers(cfg))
                    return false;

                // make sure target exist
                cfg.$target = cfg.$target || (cfg.target==="self" ? $el : $(cfg.target));
                if (cfg.$target.length === 0) {
                    if (!cfg.target) {
                        log.error("Need target selector", cfg);
                        return false;
                    }
                    cfg.$target = _._createTarget(cfg.target);
                    cfg.$injected = cfg.$target;
                }

                // check if target is "dirty"
                if (cfg.$target.hasClass('is-dirty')) {
                    if (!confirm('Are you sure you want to leave this page?')) {
                      return false;
                    }
                    cfg.$target.removeClass('is-dirty');
                }

                return true;
            });
        },

        _extractModifiers: function inject_extractModifiers(cfg) {
            var source_re = /^(.*?)(::element)?$/,
                target_re = /^(.*?)(::element)?(::after|::before)?$/,
                source_match = source_re.exec(cfg.source),
                target_match = target_re.exec(cfg.target),
                targetMod, targetPosition;

            // source content or element?
            cfg.source = source_match[1];
            // XXX: turn into source processor
            cfg.sourceMod = source_match[2] ? "element" : "content";

            // will be added while the ajax request is in progress
            cfg.targetLoadClasses = "injecting";

            // target content or element?
            targetMod = target_match[2] ? "element" : "content";
            cfg.target = target_match[1];
            cfg.targetLoadClasses += " injecting-" + targetMod;

            // position relative to target
            targetPosition = (target_match[3] || "::").slice(2);
            if (targetPosition)
                cfg.targetLoadClasses += " injecting-" + targetPosition;

            cfg.action = targetMod + targetPosition;
            // Once we start detecting illegal combinations, we'll
            // return false in case of error
            return true;
        },

        // create a target that matches the selector
        //
        // XXX: so far we only support #target and create a div with
        // that id appended to the body.
        _createTarget: function inject_createTarget (selector) {
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
            if (_._inject(trigger, $src, $target, cfg)) { _._afterInjection($el, $injected, cfg); }
            // History support.
            if ((cfg.history === "record") && ("pushState" in history)) {
                history.pushState({'url': cfg.url}, "", cfg.url);
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
            _.stopBubblingFromRemovedElement($el, cfgs, ev);
            sources$ = _.callTypeHandler(cfgs[0].dataType, "sources", $el, [cfgs, data, ev]);
            cfgs.forEach(function(cfg, idx) {
                cfg.$target.each(function() {
                    _._performInjection.apply(this, [$el, sources$[idx], cfg, ev.target]);
                });
            });
            if (cfgs[0].nextHref) {
                $el.attr({href: (window.location.href.split("#")[0] || "") +
                            cfgs[0].nextHref});
                _.destroy($el);
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
            // get a kinda deep copy, we scribble on it
            cfgs = cfgs.map(function(cfg) {
                return $.extend({}, cfg);
            });
            if (!_.verifyConfig(cfgs, $el)) {
                return;
            }
            // possibility for spinners on targets
            cfgs.forEach(function(cfg) { cfg.$target.addClass(cfg.targetLoadClasses); });

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
            if (cfg.action === "content")
                $target.empty().append($source);
            else if (cfg.action === "element")
                $target.replaceWith($source);
            else
                $target[method]($source);

            return true;
        },

        _sourcesFromHtml: function inject_sourcesFromHtml(html, url, sources) {
            var $html = _._parseRawHtml(html, url);
            return sources.map(function inject_sourcesFromHtml_map(source) {
                if (source === "body")
                    source = "#__original_body";

                var $source = $html.find(source);

                if ($source.length === 0)
                    log.warn("No source elements for selector:", source, $html);

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
                    if (href.length === 1)  // Special case for top-of-page links
                        this.href=url;
                    else if (!$source.find(href).length)
                        this.href=url+href;
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
                    link_attribute = _._link_attributes[tag.toUpperCase()];
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

            $page.find(Object.keys(_._rebaseAttrs).join(",")).each(function() {
                var $this = $(this),
                    attrName = _._rebaseAttrs[this.tagName],
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
                clean_html = _._rebaseHTML(url, clean_html);
            } catch (e) {
                log.error("Error rebasing urls", e);
            }
            var $html = $("<div/>").html(clean_html);

            if ($html.children().length === 0)
                log.warn("Parsing html resulted in empty jquery object:", clean_html);

            return $html;
        },

        // XXX: hack
        _initAutoloadVisible: function inject_initAutoloadVisible($el) {
            // ignore executed autoloads
            if ($el.data("pat-inject-autoloaded"))
                return false;

            var $scrollable = $el.parents(":scrollable"),
                checkVisibility;

            // function to trigger the autoload and mark as triggered
            function trigger() {
                $el.data("pat-inject-autoloaded", true);
                _.onClick.apply($el[0], []);
                return true;
            }

            // Use case 1: a (heigh-constrained) scrollable parent
            if ($scrollable.length) {
                // if scrollable parent and visible -> trigger it
                // we only look at the closest scrollable parent, no nesting
                checkVisibility = utils.debounce(function inject_checkVisibility_scrollable() {
                    if ($el.data("patterns.autoload"))
                        return false;
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
                if (checkVisibility())
                    return true;

                // wait to become visible - again only immediate scrollable parent
                $($scrollable[0]).on("scroll", checkVisibility);
                $(window).on("resize.pat-autoload", checkVisibility);
            } else {
                // Use case 2: scrolling the entire page
                checkVisibility = utils.debounce(function inject_checkVisibility_not_scrollable() {
                    if ($el.data("patterns.autoload"))
                        return false;
                    if (!utils.elementInViewport($el[0]))
                        return false;

                    $(window).off(".pat-autoload", checkVisibility);
                    return trigger();
                }, 100);
                if (checkVisibility())
                    return true;
                $(window).on("resize.pat-autoload scroll.pat-autoload",
                        checkVisibility);
            }
            return false;
        },

        // XXX: simple so far to see what the team thinks of the idea
        registerTypeHandler: function inject_registerTypeHandler(type, handler) {
            _.handlers[type] = handler;
        },

        callTypeHandler: function inject_callTypeHandler(type, fn, context, params) {
            type = type || "html";

            if (_.handlers[type] && $.isFunction(_.handlers[type][fn])) {
                return _.handlers[type][fn].apply(context, params);
            } else {
                return null;
            }
        },

        handlers: {
            "html": {
                sources: function(cfgs, data) {
                    var sources = cfgs.map(function(cfg) { return cfg.source; });
                    return _._sourcesFromHtml(data, cfgs[0].url, sources);
                }
            }
        }
    };

    $(document).on("patterns-injected", function(ev, cfg) {
        cfg.$target.removeClass(cfg.targetLoadClasses);
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

    registry.register(_);
    return _;
});

// jshint indent: 4, browser: true, jquery: true, quotmark: double
// vim: sw=4 expandtab
;
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
 * Patterns stacks
 *
 * Copyright 2013 Simplon B.V. - Wichert Akkerman
 */
define('pat-stacks',[
    "jquery",
    "pat-parser",
    "pat-logger",
    "pat-utils",
    "pat-registry"
], function($, Parser, logging, utils, registry) {
    var log = logging.getLogger("stacks"),
        parser = new Parser("stacks");

    parser.addArgument("selector", "> *[id]");
    parser.addArgument("transition", "none", ["none", "css", "fade", "slide"]);
    parser.addArgument("effect-duration", "fast");
    parser.addArgument("effect-easing", "swing");

    var stacks = {
        name: "stacks",
        trigger: ".pat-stacks",
        document: document,

        init: function($el, opts) {
            var fragment = this._currentFragment();

            return $el.each(function() {
                stacks._setupStack(this, opts, fragment);
            });
        },

        _setup: function() {
            $(this.document).on("click", "a", this._onClick);
        },

        _setupStack: function(container, options, selected) {
            var $container = $(container),
                $sheets, $visible, $invisible;
            options=parser.parse($container, options);
            $container.data("pat-stacks", options);
            $sheets=$container.find(options.selector);

            if ($sheets.length < 2) {
                log.warn("Stacks pattern: must have more than one sheet.", $container[0]);
                return;
            }
            $visible = [];
            if (selected) {
                try {
                    $visible = $sheets.filter("#"+selected);
                } catch (e) {
                    selected = undefined;
                }
            }
            if (!$visible.length) {
                $visible=$sheets.first();
                selected=$visible[0].id;
            }
            $invisible=$sheets.not($visible);
            utils.hideOrShow($visible, true, {transition: "none"}, stacks.name);
            utils.hideOrShow($invisible, false, {transition: "none"}, stacks.name);
            stacks._updateAnchors($container, selected);
        },

         _base_URL: function() {
            return this.document.URL.split("#")[0];
         },

        _currentFragment: function() {
            var parts = this.document.URL.split("#");
            if (parts.length===1)
                return null;
            return parts[parts.length-1];
        },

        _onClick: function(e) {
            var base_url = stacks._base_URL(),
                href_parts = e.currentTarget.href.split("#"),
                $stack;
            // Check if this is an in-document link and has a fragment
            if (base_url!==href_parts[0] || !href_parts[1])
                return;
            $stack=$(stacks.trigger+":has(#"+href_parts[1]+")");
            if (!$stack.length)
                return;
            e.preventDefault();
            stacks._updateAnchors($stack, href_parts[1]);
            stacks._switch($stack, href_parts[1]);
        },

        _updateAnchors: function($container, selected) {
            var options = $container.data("pat-stacks"),
                $sheets = $container.find(options.selector),
                base_url = stacks._base_URL();
            for (var i=0; i<$sheets.length; i++) {
                // This may appear odd, but: when querying a browser uses the
                // original href of an anchor as it appeared in the document
                // source, but when you access the href property you always
                // the fully qualified version.
                var sheet = $sheets[i],
                    $anchors = $("a[href=\""+base_url+"#"+sheet.id+"\"],a[href=\"#"+sheet.id+"\"]");
                if (sheet.id===selected)
                    $anchors.addClass("current");
                else
                    $anchors.removeClass("current");
            }
        },

        _switch: function($container, sheet_id) {
            var options = $container.data("pat-stacks"),
                $sheet = $container.find("#"+sheet_id),
                $invisible;
            if (!$sheet.length || $sheet.hasClass("visible"))
                return;
            $invisible=$container.find(options.selector).not($sheet);
            utils.hideOrShow($invisible, false, options, stacks.name);
            utils.hideOrShow($sheet, true, options, stacks.name);
        }
    };

    stacks._setup();
    registry.register(stacks);
    return stacks;
});

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
define('pat-mockup-parser',[
    'jquery'
], function($) {
    

    var parser = {
        getOptions: function getOptions($el, patternName, options) {
            /* This is the Mockup parser. An alternative parser for Patternslib
             * patterns.
             *
             * NOTE: Use of the Mockup parser is discouraged and is added here for
             * legacy support for the Plone Mockup project.
             *
             * It parses a DOM element for pattern configuration options.
             */
            options = options || {};
            // get options from parent element first, stop if element tag name is 'body'
            if ($el.length !== 0 && !$.nodeName($el[0], 'body')) {
                options = getOptions($el.parent(), patternName, options);
            }
            // collect all options from element
            var elOptions = {};
            if ($el.length !== 0) {
                elOptions = $el.data('pat-' + patternName);
                if (elOptions) {
                    // parse options if string
                    if (typeof(elOptions) === 'string') {
                        var tmpOptions = {};
                        $.each(elOptions.split(';'),
                            function(i, item) {
                                item = item.split(':');
                                item.reverse();
                                var key = item.pop();
                                key = key.replace(/^\s+|\s+$/g, '');    // trim
                                item.reverse();
                                var value = item.join(':');
                                value = value.replace(/^\s+|\s+$/g, '');    // trim
                                tmpOptions[key] = value;
                            }
                        );
                        elOptions = tmpOptions;
                    }
                }
            }
            return $.extend(true, {}, options, elOptions);
        }
    };
    return parser;
});

/**
 * A Base pattern for creating scoped patterns. It's similar to Backbone's
 * Model class. The advantage of this approach is that each instance of a
 * pattern has its own local scope (closure).
 *
 * A new instance is created for each DOM element on which a pattern applies.
 *
 * You can assign values, such as $el, to `this` for an instance and they
 * will remain unique to that instance.
 *
 * Older Patternslib patterns on the other hand have a single global scope for
 * all DOM elements.
 */

define('pat-base',[
  "jquery",
  "pat-registry",
  "pat-mockup-parser",
  "pat-logger"
], function($, Registry, mockupParser, logger) {
    
    var log = logger.getLogger("Patternslib Base");

    var initBasePattern = function initBasePattern($el, options, trigger) {
        var name = this.prototype.name;
        var log = logger.getLogger("pat." + name);
        var pattern = $el.data("pattern-" + name);
        if (pattern === undefined && Registry.patterns[name]) {
            try {
                options = this.prototype.parser  === "mockup" ? mockupParser.getOptions($el, name, options) : options;
                pattern = new Registry.patterns[name]($el, options, trigger);
            } catch (e) {
                log.error("Failed while initializing '" + name + "' pattern.", e);
            }
            $el.data("pattern-" + name, pattern);
        }
        return pattern;
    };

    var Base = function($el, options, trigger) {
        this.$el = $el;
        this.options = $.extend(true, {}, this.defaults || {}, options || {});
        this.init($el, options, trigger);
        this.emit("init");
    };

    Base.prototype = {
        constructor: Base,
        on: function(eventName, eventCallback) {
            this.$el.on(eventName + "." + this.name + ".patterns", eventCallback);
        },
        emit: function(eventName, args) {
            // args should be a list
            if (args === undefined) {
                args = [];
            }
            this.$el.trigger(eventName + "." + this.name + ".patterns", args);
        }
    };

    Base.extend = function(patternProps) {
        /* Helper function to correctly set up the prototype chain for new patterns.
        */
        var parent = this;
        var child;

        // Check that the required configuration properties are given.
        if (!patternProps) {
            throw new Error("Pattern configuration properties required when calling Base.extend");
        }

        // The constructor function for the new subclass is either defined by you
        // (the "constructor" property in your `extend` definition), or defaulted
        // by us to simply call the parent's constructor.
        if (patternProps.hasOwnProperty("constructor")) {
            child = patternProps.constructor;
        } else {
            child = function() { parent.apply(this, arguments); };
        }

        // Allow patterns to be extended indefinitely
        child.extend = Base.extend;

        // Static properties required by the Patternslib registry 
        child.init = initBasePattern;
        child.jquery_plugin = true;
        child.trigger = patternProps.trigger;

        // Set the prototype chain to inherit from `parent`, without calling
        // `parent`'s constructor function.
        var Surrogate = function() { this.constructor = child; };
        Surrogate.prototype = parent.prototype;
        child.prototype = new Surrogate();

        // Add pattern's configuration properties (instance properties) to the subclass,
        $.extend(true, child.prototype, patternProps);

        // Set a convenience property in case the parent's prototype is needed
        // later.
        child.__super__ = parent.prototype;

        // Register the pattern in the Patternslib registry.
        if (!patternProps.name) {
            log.warn("This pattern without a name attribute will not be registered!");
        } else if (!patternProps.trigger) {
            log.warn("The pattern '"+patternProps.name+"' does not " +
                     "have a trigger attribute, it will not be registered.");
        } else {
            Registry.register(child, patternProps.name);
        }
        return child;
    };
    return Base;
});

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
            this.$el.on('patterns-injected', this.registerSubformListeners.bind(this));
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
/* pat-clone */
define("pat-clone",[
    "jquery",
    "pat-parser",
    "pat-registry",
    "pat-base",
    "pat-logger"
], function($, Parser, registry, Base, logger) {
    
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

            $clone.trigger("pat-update", {'pattern':"clone", '$el': $clone});
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
        }
    });
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
/**
 * Patternslib pattern for Masonry
 * Copyright 2015 Syslab.com GmBH
 */

(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define('pat-masonry',[
            "jquery",
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
}(this, function($, registry, Parser, Base, utils, Masonry, imagesLoaded) {
    
    var parser = new Parser("masonry");
    parser.addArgument("column-width");
    parser.addArgument("container-style", "{ position: 'relative' }");
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
            $(document).trigger("clear-imagesloaded-cache");
            this.initMasonry();
            this.$el.imagesLoaded(this.layout.bind(this));
            // Update if something gets injected inside the pat-masonry
            // element.
            this.$el.on("patterns-injected.pat-masonry",
                    utils.debounce(this.update.bind(this), 100));
        },

        initMasonry: function () {
            this.msnry = new Masonry(this.$el[0], {
                columnWidth:         this.getTypeCastedValue(this.options.columnWidth),
                containerStyle:      this.options.containerStyle,
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

    return Base.extend({
        name: "modal",
        jquery_plugin: true,
        // div's are turned into modals
        // links, forms and subforms inject modals
        trigger: "div.pat-modal, a.pat-modal, form.pat-modal, .pat-modal.pat-subform",
        init: function ($el, opts, trigger) {
            this.options = parser.parse(this.$el, opts);
            if (trigger && trigger.type === "injection")
                $.extend(this.options, parser.parse($(trigger.element), {}, false, false));
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
            var $header = $("<div class='header' />"),
                activeElement = document.activeElement;

            if (this.options.closing.indexOf("close-button")!==-1)
                $("<button type='button' class='close-panel'>Close</button>").appendTo($header);

            // We cannot handle text nodes here
            this.$el.children(":last, :not(:first)")
                .wrapAll("<div class='panel-content' />");
            $(".panel-content", this.$el).before($header);
            this.$el.children(":first:not(.header)").prependTo($header);

            // Restore focus in case the active element was a child of $el and
            // the focus was lost during the wrapping.
            activeElement.focus();
            this._init_handlers();
            this.resize();
            this.setPosition();
        },

        _init_handlers: function() {
            var $el = this.$el;
            $(document).on("click.pat-modal", ".close-panel", this.destroy.bind(this));
            $(document).on("keyup.pat-modal", this._onKeyUp.bind(this));
            if (this.options.closing.indexOf("outside")!==-1)
                $(document).on("click.pat-modal", this._onPossibleOutsideClick.bind(this));

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
            var modal_height = this.$el.outerHeight(true);
            var modal_padding = modal_height - this.$el.outerHeight();
            var max_height = $(window).innerHeight() - modal_padding;
            var $tallest_child = this.getTallestChild();
            var tallest_child_height = $tallest_child.outerHeight(true);

            if (tallest_child_height !== modal_height) {
                modal_height = tallest_child_height + modal_padding;
            }
            if (max_height < modal_height) {
                this.$el.addClass("max-height").css("height", max_height);
                this.setPosition();
            } else if (modal_height !== this.$el.height()) {
                this.$el.removeClass("max-height").css("height", modal_height);
                this.setPosition();
            } else {
                return;
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
 * Copyright 2012-2013 Syslab.com GmbH - JC Brand
 */
define('pat-scroll',[
    "jquery",
    "pat-registry",
    "pat-base",
    "pat-utils",
    "pat-logger",
    "pat-parser",
    "underscore"
], function($, patterns, Base, utils, logging, Parser, _) {
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
               this.smoothScroll();
            } else if (this.options.trigger == "click") {
                this.$el.click(function (ev) {
                    ev.preventDefault();
                    this.smoothScroll();
                }.bind(this));
            }
        },

        smoothScroll: function() {
            var scroll = this.options.direction == "top" ? 'scrollTop' : 'scrollLeft',
                $el, options = {};
            if (typeof this.options.offset != "undefined") {
                $el = this.options.selector ? $(this.options.selector) : this.$el;
                options[scroll] = this.options.offset;
            } else {
                $el = $('body');
                options[scroll] = $(this.$el.attr('href')).offset().top;
            }
            $el.animate(options, 500);
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
    if (!registry.initialized) {
        registry.init();
    }
});

(function(root) {
    require(['patterns'], function (patterns) {
        //patterns is now loaded.
    });
})(window);

