default_profile = "profile-plone.patternslib:default"


def import_profile(context):
    setup_tool = context.portal_setup
    setup_tool.runImportStepFromProfile(default_profile, "plone.app.registry")
