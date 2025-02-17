from plone.app.testing import setRoles
from plone.app.testing import TEST_USER_ID
from plone.base.utils import get_installer
from plone.patternslib.testing import PLONE_PATTERNSLIB_INTEGRATION_TESTING

import unittest


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
        setRoles(self.portal, TEST_USER_ID, ["Manager"])
        self.installer.uninstall_product("plone.patternslib")

    def test_product_uninstalled(self):
        self.assertFalse(self.installer.is_product_installed("plone.patternslib"))
