# -*- coding: utf-8 -*-
from plone import api
from plone.browserlayer.utils import unregister_layer

default_profile = 'profile-plone.patternslib:default'


def upgrade_1000_1001(context):
    try:
        unregister_layer(name=u'plone.patternslib')
    except KeyError:
        # No browser layer with that name registered
        pass


def import_profile(context):
    setup_tool = api.portal.get_tool('portal_setup')
    setup_tool.runImportStepFromProfile(default_profile, 'plone.app.registry')
