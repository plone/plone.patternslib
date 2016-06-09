from plone.browserlayer.utils import unregister_layer
from zope.component.hooks import getSiteManager


def upgrade_1000_1001(context):
    unregister_layer(
        u'plone.patternslib',
        site_manager=getSiteManager(context=context)
    )
