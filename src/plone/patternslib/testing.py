# -*- coding: utf-8 -*-
from plone.app.contenttypes.testing import PLONE_APP_CONTENTTYPES_FIXTURE
from plone.app.robotframework.testing import REMOTE_LIBRARY_BUNDLE_FIXTURE
from plone.app.testing import applyProfile
from plone.app.testing import FunctionalTesting
from plone.app.testing import IntegrationTesting
from plone.app.testing import PloneSandboxLayer
from plone.testing import z2

import denso.tecdb


class DensoTecdbLayer(PloneSandboxLayer):

    defaultBases = (PLONE_APP_CONTENTTYPES_FIXTURE,)

    def setUpZope(self, app, configurationContext):
        self.loadZCML(package=denso.tecdb)

    def setUpPloneSite(self, portal):
        applyProfile(portal, 'denso.tecdb:default')


DENSO_TECDB_FIXTURE = DensoTecdbLayer()


DENSO_TECDB_INTEGRATION_TESTING = IntegrationTesting(
    bases=(DENSO_TECDB_FIXTURE,),
    name='DensoTecdbLayer:IntegrationTesting'
)


DENSO_TECDB_FUNCTIONAL_TESTING = FunctionalTesting(
    bases=(DENSO_TECDB_FIXTURE,),
    name='DensoTecdbLayer:FunctionalTesting'
)


DENSO_TECDB_ACCEPTANCE_TESTING = FunctionalTesting(
    bases=(
        DENSO_TECDB_FIXTURE,
        REMOTE_LIBRARY_BUNDLE_FIXTURE,
        z2.ZSERVER_FIXTURE
    ),
    name='DensoTecdbLayer:AcceptanceTesting'
)
