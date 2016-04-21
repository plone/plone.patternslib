
patternslib:: ## Get the latest version of the patternslib
	@if [ ! -d "static/components/patternslib" ]; then \
		git clone https://github.com/Patternslib/Patterns.git static/components/patternslib; git checkout master; \
	else \
		cd static/components/patternslib && git pull; git checkout master; \
	fi;
	cd static/components/patternslib/ && make stamp-bower
