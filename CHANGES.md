# Changelog

<!-- towncrier release notes start -->

## 9.10.2 (2025-07-01)

### New features:

- Update Patternslib to 9.10.2.


## 9.10.1b3 (2025-04-07)

### New features:

- Update Patternslib to 9.10.1-beta.3.

### Bug fixes:

- Do not create a file extension when creating towncrier news fragments to comply with the towncrier configuration.
  [thet]


## 9.9.16 (2025-02-17)

No significant changes.


## 9.9.16.0a1 (2025-02-03)

### Breaking changes:

- Upgrade for Plone 6 and Python >= 3.9 only.
  [ale, thet]

### New features:

- Update Patternslib to 9.9.16.

### Internal:

- Update configuration files.
  [plone devs]


## 1.3.0 (2023-02-02)

-   Update jQuery to 1.12.4 and Patternslib to 2.1.5. Fixes:
    <https://github.com/plone/plone.patternslib/issues/73> (thet)
-   `pat-leaflet` AJAX geoJSON feature (petschki)

## 1.2.1 (2020-11-23)

-   Bugfix: Register upgrade step for the correct profile (frapell)

## 1.2.0 (2020-08-07)

-   Register `pat-datetime-picker` in the resource registry. (thet)
-   Restructure upgrades to follow bobtemplates.plone recommendations.
    (thet)

## 1.1.1 (2020-07-10)

-   Do not autoinclude ZCML (this was not needed here). (jensens)
-   Fix dependency chain, depend on `Products.CMFPlone` in `setup.py`.
    (jensens)
-   Upgrade to pat-leaflet 1.4.0. (thet)

## 1.1.0 (2019-04-11)

-   Upgrade pat-leaflet to 1.3.0. (thet)
-   Remove 2nd CSS resource from Leaflet Markercluster as Plone doesn\'t
    compile it properly. (thet)
-   Register `pat-date-picker`. (thet)
-   Update dependencies, deped on Patterns 2.1.x. (thet)
-   Update to latest Patterns. (thet)
-   Remove registry initialization in bundles. (cekk)
-   Declare support for python 3. (vincero)

## 1.0 (2017-02-28)

-   Git-un-exclude `dist` directory within the `static` folder. (thet)
-   Fix font-awesome web font path. (thet)
-   Fix Leaflet icon integration. (thet)
-   Register resources with their uncompressed files, wherever they are
    available. This helps debugging and the resource registry itself can
    handle compression on it\'s own. (thet)
-   Upgrade Patternslib to latest version. (thet)
-   Better `pat-gallery` integration. (thet)
-   Add `pat-leaflet` resources. (thet)
-   Use bower to manage resources instead of Makefile script. (thet)
-   Remove browserlayer and add upgrade step for removal from component
    registry. (thet)
-   Cleanup. (thet)

## 0.2 (2016-04-27)

-   Polyfill removeDuplicateObjects so that we can use version 2.0.13 of
    Patternslib with Plone/Mockup which still uses Patternslib 2.0.11.

## 0.1 (2016-04-27)

-   Initial release.
