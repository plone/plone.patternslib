from plone.app.testing import IntegrationTesting
from plone.app.testing import PLONE_INTEGRATION_TESTING
from plone.app.testing.helpers import PloneWithPackageLayer

import plone.patternslib


PLONE_PATTERNSLIB_FIXTURE = PloneWithPackageLayer(
    bases=(PLONE_INTEGRATION_TESTING,),
    name="PlonePatternslibLayer",
    zcml_package=plone.patternslib,
    zcml_filename="configure.zcml",
    gs_profile_id="plone.patternslib:default",
)

PLONE_PATTERNSLIB_INTEGRATION_TESTING = IntegrationTesting(
    bases=(PLONE_PATTERNSLIB_FIXTURE,),
    name="PlonePatternslib:IntegrationTesting",
)
