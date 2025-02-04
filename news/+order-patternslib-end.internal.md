Order Patternslib bundle at the end.

In case the main `plone` bundle is not available, depending on `plone` would
break the resource registry. This moves rendering of the `patterns` bundle to
the end of all resource registry bundles and avoids depending on `plone`.

Note: In this case you'd need to change the `patterns` bundle to use
`bundle.min.js` - the main module federation bundle instead of `remote.min.js`
or use another main module federation bundle.
