.. This README is meant for consumption by humans and pypi. Pypi can render rst files so please do not use Sphinx features.
   If you want to learn more about writing documentation, please check out: http://docs.plone.org/about/documentation_styleguide_addons.html
   This text does not appear on pypi or github. It is a comment.

==============================================================================
plone.patternslib
==============================================================================

An add-on to make `patternslib <http://patternslib.com/>`_ patterns available within Plone 5.
It has some limitations (see below).

Features
--------

Plone 5's Mockup patterns have been relying on the Patternslib core (scanner, registry, base class etc.) for quite some time already.

Because of this it's possible to use Patternslib patterns (as opposed to the Mockup patterns in Plone 5).

This package makes a selection of those patterns available in Plone 5.

Known Issues
------------

There are still a few patterns that both Plone 5 and Patternslib have.
They either conflict, because they use the same name or they conflict,
because they attempt to do the same or similar things.
For now we chose to explicitly exclude them here.

The Patternslib patterns that are currently **disabled** (for various reasons) are:

* ``pat-colour-picker``
* ``pat-date-picker``
* ``pat-gallery``
* ``pat-image-crop``
* ``pat-legend``: It conflicts with pat-autotoc
* ``pat-notification``
* ``pat-sortable``: Naming conflict with *pat-sortable* in Mockup.
* ``pat-subform``
* ``pat-tabs``: New, unreleased Patternslib pattern. Not aware of any conflicts.
* ``pat-toggle``: Naming conflict with *pat-toggle* in Mockup.
* ``pat-tooltip``: Naming conflict with *pat-tooltip* in Mockup.
* ``pat-validation``

Examples
--------

There are example browser views for four patterns in the browser directory.
If all went well, you can test the following patterns by calling their browser view examples on your plone site:

- ``@@pat-depends``
- ``@@pat-inject``
- ``@@pat-masonry``
- ``@@pat-switch``


Development
-----------

This package is built similarly to how the mockup sources are pulled into the Plone egg. There is a Makefile which clones patternslib.
Similarly to how it is done in Plone5, Patternslib is cloned and built, but only the necessary parts of it are checked in to plone.patternslib.

Make sure that when you update Patternslib that the newer version or files are compatible with the version of `pat-utils` that are in Mockup/Plone 5.0.x.
We are able to override the version of `pat-parser`, but not `pat-utils`,
because it's included in the `plone-compiled.js` bundle ("baked into the cake" so to speak).
This means that we have to rely on the version of `pat-utils` in Mockup/Plone 5.x.
If no new methods have been added to `pat-utils` in later versions of Patternslib, then it shouldn't be an issue.

Installation
------------

Install plone.patternslib by adding it to your buildout::

    [buildout]

    ...

    eggs =
        plone.patternslib

and then running ``bin/buildout``.

Install the plone.patternslib package into your site.
It will register a patternslib resource bundle in addition to the existing plone mockup bundles.

Contribute
----------

- Issue Tracker: https://github.com/plone/plone.patternslib/issues
- Source Code: https://github.com/plone/plone.patternslib


Support
-------

If you are having issues, please put them into the issue tracker.


License
-------

The project is licensed under the GPLv2.
