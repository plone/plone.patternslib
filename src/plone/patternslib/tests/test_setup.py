from plone import api
from plone.patternslib.testing import PLONE_PATTERNSLIB_INTEGRATION_TESTING

import unittest


try:
    from plone.base.utils import get_installer
except ImportError:
    from Products.CMFPlone.utils import get_installer


class TestSetup(unittest.TestCase):

    layer = PLONE_PATTERNSLIB_INTEGRATION_TESTING

    def setUp(self):
        self.portal = self.layer["portal"]
        self.installer = get_installer(self.portal)

    def test_product_installed(self):
        self.assertTrue(self.installer.is_product_installed("plone.patternslib"))


class TestUninstall(unittest.TestCase):

    layer = PLONE_PATTERNSLIB_INTEGRATION_TESTING

    def setUp(self):
        self.portal = self.layer["portal"]
        self.installer = get_installer(self.portal)

        with api.env.adopt_user(username="admin"):
            self.installer.uninstall_product("plone.patternslib")

    def test_product_uninstalled(self):
        self.assertFalse(self.installer.is_product_installed("plone.patternslib"))
