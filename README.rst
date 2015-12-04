.. This README is meant for consumption by humans and pypi. Pypi can render rst files so please do not use Sphinx features.
   If you want to learn more about writing documentation, please check out: http://docs.plone.org/about/documentation_styleguide_addons.html
   This text does not appear on pypi or github. It is a comment.

==============================================================================
plone.patternslib
==============================================================================

An experimental add-on to make `patternslib <http://patternslib.com/>`_ patterns available within Plone 5.

Features
--------

The Plone 5 mockup patterns parser and the Patternslib parser have already been re-unified. So for quite some time it had been theoretically possible to run patternslib patters in Plone 5. This package proves that it is possible and makes a selection of the Patternslib patters available in Plone 5.

This is currently in an experimental state - so use at your own risk and not in production - but everyone is invited to give it a try and report back issues. 


Known Issues
------------

There are still a few patterns that both Plone 5 and Patternslib have. They either conflict, because they use the same name or they conflict, because they attempt to do the same or similar things. For now we chose to explicitly exclude them here.


Examples
--------

There are example browser views for four patterns in the browser directory. If all went well, you can test the following patterns by calling their browser view examples on your plone site:

- @@pat-depends
- @@pat-inject
- @@pat-masonry
- @@pat-switch


Documentation
-------------

Full documentation for end users can currently not be found in the "docs" folder, but might be in the future


Development
-----------

This package is built similarly to how the mockup sources are pulled into the Plone egg. There is a Makefile which clones patternslib. It is currently hardcoded to patternslib version 2.0.11, as this is the same parser version used in Plone 5.0. These versions need to be in sync, otherwise this will not work. So don't attempt to upgrade the patterns version unless you also upgraded mockup in Plone.

Again similar to how it is done in Plone5, Patternslib is cloned and built, but only the necessary parts of it are checked in in to plone.patternslib. 


Installation
------------

Install plone.patternslib by adding it to your buildout::

    [buildout]

    ...

    eggs =
        plone.patternslib


and then running ``bin/buildout``

Install the plone.patternslib package into your site. It will register a patternslib resource bundle in addition to the existing plone mockup bundles.

Contribute
----------

- Issue Tracker: https://github.com/plone/plone.patternslib/issues
- Source Code: https://github.com/plone/plone.patternslib
- Documentation: https://docs.plone.org/plone.patternslib  (not yet)


Support
-------

If you are having issues, please put them into the Issue Tracker.


License
-------

The project is licensed under the GPLv2.
