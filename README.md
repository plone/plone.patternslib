# plone.patternslib

An add-on to make [Patternslib](http://patternslib.com/) available to Plone 6.


## Features

Plone and Mockup depend on Patternslib and it's Patterns registry infrastructure
since quite some time already.
Since Plone 6 there are also some core Patternslib patterns exposed in Plone,
like pat-inject, pat-validation, pat-date-picker and some more.

This package completes that and makes all Patternslib patterns available in
Plone. This includes pat-auto-submit, pat-auto-suggest, pat-carousel,
pat-gallery, the fullcalendar integration pat-calendar, the wysiwyg integration
pat-tiptap, pat-upload and more.

Please note - pat-leaflet is yet not included as it is not part of the
Patternslib distribution.
There are plans to make it available in a separate package.


## Versioning scheme

The version number of plone.patternslib directly follows the Patternslib version
numbers.

Possible version numbers are:

- 9.9.16
- 9.10.0-alpha.0
- 9.10.1-beta.2
- 9.10.1

Due to strict version parsing of the Python packaging tools we cannot add our
own patch levels other that `.dev0`, `.dev1` and so on.
If you want to release a pre-release version, use the dev suffix.


## Implementation

This package includes the Patternslib bundle in a resource directory.

The default profile installs the `++resource++patternslib/remote.min.js` bundle
as a Module Federation remote bundle.
The module federation main bundle in Plone is the `plone` bundle.
You can also use the `++resource++patternslib/bundle.min.js` directly, but then
you need to update the plone bundle to use `remote.min.js` instead of
`bundle.min.js`.
You can find more info on module federation here:

https://github.com/Patternslib/Patterns/blob/master/docs/developer/module-federation.md


## Limitations

Some of the Patternslib patterns have the same name like patterns in Mockup.
They are still included but not registered. The Patterns registry does not
register patterns of the same name twice.


## Examples

There are example browser views for four patterns in the browser
directory. If all went well, you can test the following patterns by
calling their browser view examples on your plone site:

-   `@@pat-depends`
-   `@@pat-inject`
-   `@@pat-masonry`
-   `@@pat-switch`


## Development

To update Patternslib to the latest released version run:

```bash
make update-patterns
```

or to update Patternslib to an arbitrary version - e.g. a pre-release:

```bash
PATTERNSLIB_VERSION=9.10.1-beta.1 make update-patterns
```

## Contribute

-   Issue Tracker: <https://github.com/plone/plone.patternslib/issues>
-   Source Code: <https://github.com/plone/plone.patternslib>


## Support

If you are having issues, please put them into the issue tracker.


## License

The project is licensed under the GPLv2.
