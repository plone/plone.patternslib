module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    uglify: {
      build: {
        src: 'bundle.js',
        dest: 'bundle.min.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-autoprefixer');

  // Default task(s).
  grunt.registerTask('default', ['uglify']);

};
