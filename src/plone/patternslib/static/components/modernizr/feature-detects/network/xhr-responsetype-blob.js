/*!
{
  "name": "XHR responseType='blob'",
  "property": "xhrresponsetypeblob",
  "tags": ["network"],
  "notes": [{
    "name": "WHATWG Spec",
    "href": "https://xhr.spec.whatwg.org/#the-responsetype-attribute"
  }]
}
!*/
/* DOC
Tests for XMLHttpRequest xhr.responseType='blob'.
*/
define(['Modernizr', 'testXhrType'], function(Modernizr, testXhrType) {
  Modernizr.addTest('xhrresponsetypeblob', testXhrType('blob'));
});
