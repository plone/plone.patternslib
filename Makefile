BOWER           ?= node_modules/.bin/bower
GRUNT           ?= node_modules/.bin/grunt
BUNDLENAME       = patterns
PATTERNS         = src/bower_components/patternslib
SOURCES          = $(wildcard $(PATTERNS)/src/*.js) $(wildcard $(PATTERNS)/src/pat/*.js) $(wildcard $(PATTERNS)/src/lib/*.js)
BUNDLES          = bundles/patterns.js bundles/patterns.min.js

default: all

all:: bundle

stamp-npm: package.json
	npm install
	touch stamp-npm

stamp-bower: stamp-npm
	$(BOWER) install
	touch stamp-bower

clean:
	rm -rf stamp-npm stamp-bower node_modules src/bower_components

bundle: stamp-bower $(SOURCES) build.js
	node_modules/.bin/r.js -o build.js optimize=none
	$(GRUNT) uglify
	mv bundle.js src/plone/patternslib/static/$(BUNDLENAME)-compiled.js
	mv bundle.min.js src/plone/patternslib/static/$(BUNDLENAME)-compiled.min.js

