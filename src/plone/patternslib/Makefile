
patternslib:: ## Get the latest version of the patternslib
	@if [ ! -d "static/components/patternslib" ]; then \
		git clone https://github.com/Patternslib/Patterns.git static/components/patternslib; git checkout 2.0.11; \
	else \
		cd static/components/patternslib && git pull; git checkout 2.0.11; \
	fi;
	cd static/components/patternslib/ && make stamp-bower
