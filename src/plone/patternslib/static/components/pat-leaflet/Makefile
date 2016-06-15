# vim: set noexpandtab:
# Makefile needs to set tabs instead of spaces
BOWER       ?= node_modules/.bin/bower
HTTPSERVE   ?= node_modules/.bin/http-server

all:: install serve
	printf "\n\n All done!\n\n Go to http://localhost:4001/ to see a demo.\n\n\n\n"

designerhappy:: all

install:: stamp-npm stamp-bower

serve::
	$(HTTPSERVE) -p 4001

clean::
	rm -f stamp-npm stamp-bower
	rm -rf node_modules src/bower_components ~/.cache/bower

stamp-npm: package.json
	npm install
	touch stamp-npm

stamp-bower: stamp-npm
	$(BOWER) install
	touch stamp-bower

.PHONY: all clean designerhappy install serve stamp-bower stamp-npm
