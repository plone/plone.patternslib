from plone.browserlayer.utils import unregister_layer


def upgrade_1000_1001(context):
    try:
        unregister_layer(name=u'plone.patternslib')
    except KeyError:
        # No browser layer with that name registered
        pass
