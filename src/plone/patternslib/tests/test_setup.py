from plone import api
from plone.app.testing import setRoles
from plone.app.testing import TEST_USER_ID
from plone.base.utils import get_installer
from plone.patternslib.testing import PLONE_PATTERNSLIB_INTEGRATION_TESTING
from Products.CMFPlone.resources.browser.resource import ScriptsView

import unittest


class TestSetup(unittest.TestCase):

    layer = PLONE_PATTERNSLIB_INTEGRATION_TESTING

    def setUp(self):
        self.portal = self.layer["portal"]
        self.installer = get_installer(self.portal)

    def test_product_installed(self):
        self.assertTrue(self.installer.is_product_installed("plone.patternslib"))

    def test_resources_installed(self):
        rec = api.portal.get_registry_record

        # patterns
        self.assertEqual(
            rec("plone.bundles/patterns.jscompilation"),
            "++resource++patternslib/remote.min.js",
        )
        self.assertEqual(
            rec("plone.bundles/patterns.enabled"),
            True,
        )
        self.assertEqual(
            rec("plone.bundles/patterns.depends"),
            "patterns-preinit",
        )

        # patterns-preinit
        self.assertEqual(
            rec("plone.bundles/patterns-preinit.jscompilation"),
            "++resource++patternslib-preinit.js",
        )
        self.assertEqual(
            rec("plone.bundles/patterns-preinit.enabled"),
            True,
        )
        self.assertEqual(
            rec("plone.bundles/patterns-preinit.depends"),
            "plone",
        )

    def test_resources_rendered(self):
        view = ScriptsView(self.portal, self.portal.REQUEST, None, None)
        view.update()
        results = view.render()
        self.assertIn(
            "++resource++patternslib/remote.min.js",
            results,
        )
        self.assertIn(
            "++resource++patternslib-preinit.js",
            results,
        )


class TestUninstall(unittest.TestCase):

    layer = PLONE_PATTERNSLIB_INTEGRATION_TESTING

    def setUp(self):
        self.portal = self.layer["portal"]
        self.installer = get_installer(self.portal)
        setRoles(self.portal, TEST_USER_ID, ["Manager"])
        self.installer.uninstall_product("plone.patternslib")

    def test_product_uninstalled(self):
        self.assertFalse(self.installer.is_product_installed("plone.patternslib"))

    def test_resources_uninstalled(self):
        rec = api.portal.get_registry_record

        # patterns
        self.assertEqual(
            rec("plone.bundles/patterns.jscompilation", default=None),
            None,
        )
        # patterns-preinit
        self.assertEqual(
            rec("plone.bundles/patterns-preinit.jscompilation", default=None),
            None,
        )

    def test_resources_not_rendered(self):
        view = ScriptsView(self.portal, self.portal.REQUEST, None, None)
        view.update()
        results = view.render()
        self.assertNotIn(
            "++resource++patternslib/remote.min.js",
            results,
        )
        self.assertNotIn(
            "++resource++patternslib-preinit.js",
            results,
        )
