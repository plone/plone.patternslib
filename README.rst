.. This README is meant for consumption by humans and pypi. Pypi can render rst files so please do not use Sphinx features.
   If you want to learn more about writing documentation, please check out: http://docs.plone.org/about/documentation_styleguide_addons.html
   This text does not appear on pypi or github. It is a comment.

==============================================================================
plone.patternslib
==============================================================================

An experimental add-on to make patternslib patterns available within Plone 5.

Features
--------

The Plone 5 mockup patterns parser and the Patternslib parser have already been re-unified. So for quite some time it had been theoretically possible to run patternslib patters in Plone 5. This package proves that it is possible and makes a selection of the Patternslib patters available in Plone 5.

This is currently in an experimental state - so use at your own risk and not in production - but everyone is invited to give it a try and report back issues. 


Known Issues
------------

There are still a few patterns that both Plone 5 and Patternslib have. They either conflict, because they use the same name or they conflict, because they attempt to do the same or similar things. For now we chose to explicitly exclude them here.


Examples
--------

This add-on can be seen in action at the following sites:
- Is there a page on the internet where everybody can see the features?


Documentation
-------------

Full documentation for end users can be found in the "docs" folder, and is also available online at http://docs.plone.org/foo/bar


Translations
------------

This product has been translated into

- Klingon (thanks, K'Plai)


Installation
------------

Install plone.patternslib by adding it to your buildout::

    [buildout]

    ...

    eggs =
        plone.patternslib


and then running ``bin/buildout``


Contribute
----------

- Issue Tracker: https://github.com/collective/plone.patternslib/issues
- Source Code: https://github.com/collective/plone.patternslib
- Documentation: https://docs.plone.org/foo/bar


Support
-------

If you are having issues, please let us know.
We have a mailing list located at: project@example.com


License
-------

The project is licensed under the GPLv2.
