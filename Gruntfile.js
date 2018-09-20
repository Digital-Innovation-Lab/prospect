module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
		screwIE8: true
      },
	  static_mappings: {
		  files: [
			  { src: 'js/map-hub.js', dest: 'js/map-hub.min.js' },
			  { src: 'js/view-core.js', dest: 'js/view-core.min.js' },
			  { src: 'js/view-qr.js', dest: 'js/view-qr.min.js' },
			  { src: 'js/view-aggregate.js', dest: 'js/view-aggregate.min.js' },
			  { src: 'js/view-exhibit.js', dest: 'js/view-exhibit.min.js' },
			  { src: 'js/view-volume.js', dest: 'js/view-volume.min.js' }
		  ]
	  }
    },
	cssmin: {
		dist: {
      		options: {
         		banner: '/*! <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      		},
      		files: {
	        	'css/view-exhibit.min.css': ['css/view-exhibit.css'],
				'css/view-volume.min.css': ['css/view-volume.css']
      		}
  		}
	}
  });

  	// Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  	// And the minify-CSS plugin
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  // Default task(s).
  grunt.registerTask('default', ['uglify', 'cssmin']);
};
