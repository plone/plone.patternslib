# -*- coding: utf-8 -*-
from Products.CMFPlone.interfaces import INonInstallable
from zope.interface import implementer


@implementer(INonInstallable)
class HiddenProfiles(object):
    def getNonInstallableProfiles(self):
        """Hide uninstall profile from site-creation and quickinstaller"""
        return [
            "plone.patternslib:uninstall",
            "plone.patternslib.upgrades:1001",
            "plone.patternslib.upgrades:1003",
            "plone.patternslib.upgrades:1004",
            "plone.patternslib.upgrades:1005",
            "plone.patternslib.upgrades:1006",
        ]
