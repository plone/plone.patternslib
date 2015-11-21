# -*- coding: utf-8 -*-
from plone.app.contenttypes.testing import PLONE_APP_CONTENTTYPES_FIXTURE
from plone.app.robotframework.testing import REMOTE_LIBRARY_BUNDLE_FIXTURE
from plone.app.testing import applyProfile
from plone.app.testing import FunctionalTesting
from plone.app.testing import IntegrationTesting
from plone.app.testing import PloneSandboxLayer
from plone.testing import z2

import plone.patternslib


class PlonePatternslibLayer(PloneSandboxLayer):

    defaultBases = (PLONE_APP_CONTENTTYPES_FIXTURE,)

    def setUpZope(self, app, configurationContext):
        self.loadZCML(package=plone.patternslib)

    def setUpPloneSite(self, portal):
        applyProfile(portal, 'plone.patternslib:default')


PLONE_PATTERNSLIB_FIXTURE = PlonePatternslibLayer()


PLONE_PATTERNSLIB_INTEGRATION_TESTING = IntegrationTesting(
    bases=(PLONE_PATTERNSLIB_FIXTURE,),
    name='PlonePatternslibLayer:IntegrationTesting'
)


PLONE_PATTERNSLIB_FUNCTIONAL_TESTING = FunctionalTesting(
    bases=(PLONE_PATTERNSLIB_FIXTURE,),
    name='PlonePatternslibLayer:FunctionalTesting'
)


PLONE_PATTERNSLIB_ACCEPTANCE_TESTING = FunctionalTesting(
    bases=(
        PLONE_PATTERNSLIB_FIXTURE,
        REMOTE_LIBRARY_BUNDLE_FIXTURE,
        z2.ZSERVER_FIXTURE
    ),
    name='PlonePatternslibLayer:AcceptanceTesting'
)
