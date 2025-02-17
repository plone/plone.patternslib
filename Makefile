STATIC_DIR = src/plone/patternslib/static

# Prerequisites:
# - make
# - curl
# - git
# - jq

# Download a Patternslib universal bundle from GitHub releases and replace
# the existing one.
#
# You can use the `PATTERNSLIB_VERSION` environment variable to download a
# specific version, e.g. a pre-release version which would not be picked up
# automatically:
# `PATTERNSLIB_VERSION=9.7.0-alpha.5 make update-patterns`
#
.PHONY: update-patterns
update-patterns:
ifndef PATTERNSLIB_VERSION
	@echo "🧪 Get the latest Patternslib version from GitHub (no pre-release)."

	@# If no PATTERNSLIB_VERSION environment variable is defined,
	@# Get the latest version from the GitHub API.
	# Also see: https://stackoverflow.com/a/42040905/1337474
	$(eval PATTERNSLIB_VERSION := $(shell curl https://api.github.com/repos/patternslib/Patterns/releases/latest -s | jq .tag_name -r))
	@echo "🏷️  Patternslib version is: $(PATTERNSLIB_VERSION)"

endif
	@echo "🧪 Copy bundle from GitHub."

	@# Download the Patternslib bundle.
	wget https://github.com/Patternslib/Patterns/releases/download/$(PATTERNSLIB_VERSION)/patternslib-bundle-$(PATTERNSLIB_VERSION).zip 1> /dev/null 2> /dev/null
	@unzip patternslib-bundle-$(PATTERNSLIB_VERSION).zip > /dev/null
	@# Replace the old Patternslib with the new one.
	@rm -Rf $(STATIC_DIR)
	@mv patternslib-bundle-$(PATTERNSLIB_VERSION) $(STATIC_DIR)
	@# Cleanup.
	@rm patternslib-bundle-$(PATTERNSLIB_VERSION).zip

	@echo "🧪 Git add and commit."

	@# Store Patternslib reference
	@sed -i "s/version=[^,]*/version=\"$(PATTERNSLIB_VERSION).dev0\"/" setup.py
	@git add $(STATIC_DIR) setup.py

	@# Add changelog entry
	@towncrier create +update-patternslib.feature \
		--content "Update Patternslib to $(PATTERNSLIB_VERSION)."
	@# Add with a `*` in case a number was appended due to a naming conflict.
	@git add news/+update-patternslib.feature*

	@# commit
	@git commit -m"Update Patternslib to $(PATTERNSLIB_VERSION)." > /dev/null

	@# Spit out info.
	@echo ""
	@echo "📦 Patternslib static folder size is: "
	@cd $(STATIC_DIR) && du -sh
	@echo ""
	@echo "🚀 Updated Patternslib to $(PATTERNSLIB_VERSION)."
	@echo ""
