# plone.patternslib

An add-on to make [Patternslib](http://patternslib.com/) available to Plone 6.

## References

- Patternslib repository: https://github.com/patternslib/Patterns
- Patternslib GitHub releases: https://github.com/Patternslib/Patterns/releases
- Patternslib npm packages: https://www.npmjs.com/package/@patternslib/patternslib

- plone.patternslib repository: https://github.com/plone/plone.patternslib
- plone.patternslib Python packages: https://pypi.org/project/plone.patternslib/


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
numbers and can include a plone.patternlsib specific PATCH level.

This is the scheme:

PA ... Patternslib version
PL ... plone.patternslib version

```python
f"${PA_MAJOR}.${PA_MINOR}.${PA_PATCH}.${PL_PATCH}${PA_PRE_RELEASE}.${PL_DEV_VERSION}"
```

Possible version numbers are:

- 9.9.16      # Patternslib 9.9.16
- 9.9.16.1    # Patternslib 9.9.16 with a plone.patternslib specific patch
- 9.10.0a0    # Patternslib 9.10.0-alpha.0
- 9.10.1b2    # Patternslib 9.10.1-beta.2
- 9.10.1b2.dev0  # Development version of the above.
- 9.10.1.1b2  # Patternslib 9.10.1-beta.2 with a plone.patternslib specific patch
- 9.10.1      # Patternslib 9.10.1


Our update script updates the setup.py version from the Patternslib version
number, which is a [semver compatible version specifier](https://semver.org/).
When releasing, the [zest.releaser scripts](https://github.com/zestsoftware/zest.releaser)
replaces that to a [Python compatible version scheme](https://peps.python.org/pep-0440/#version-scheme).


## Updating Patternslib

Use a branch for updating Patternslib.

To update Patternslib to the latest released version run:

```bash
make update-patterns
```

or to update Patternslib to an arbitrary version - e.g. a pre-release:

```bash
PATTERNSLIB_VERSION=9.10.1-beta.2 make update-patterns
```

This does the following:

- Downloads the latest or a specified Patternslib release from GitHub.
- Copies the Patternslib bundle files to the resource directory at `src/plone/patternslib/static`.
- Updates the version number in the `setup.py` file.
- Generates a news file.
- Commits the changes.

You can then make further changes or push your branch and create a pull request.
Or update the version number for a plone.patternslib specific patch level.


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
