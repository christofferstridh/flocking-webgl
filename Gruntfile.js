module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    copy: {
      main: {
        files: [
          // includes files within path
          {expand: true, flatten:true, src: ['src/css/images/*'], dest: 'dist/css/images'}
        ]
      }
    },
    jsdoc : {
        dist : {
            src: ['src/js/mine/*.js'],
            options: {
                configure : "jsdoc_conf.json",
                destination: 'doc'
            }
        }
    },
    jshint: {
      files: ['src/js/mine/*.js'],
      options: {
        globals: {
          jQuery: true
        }
      }
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint']
    },

    cssmin: {
      target: {
        files: {
          'dist/css/main.min.css': ['src/css/*.css']
        }
      }
    },
    uglify: {
      options: {
          // the banner is inserted at the top of the output
          banner: '/*built <%= grunt.template.today("dd-mm-yyyy HH:MM") %> */\n',
          compress: true,
          mangle: false,
          sourceMap: true
      },
      my_target: {
        files: {
          'dist/js/main.min.js': ['src/js/mine/*.js','src/js/theirs/*.js','!src/js/theirs/require.js']
        }
      }
    }
    // minified : {
    //   files: {
    //     src: [
    //       'src/js/mine/*.js',
    //       'src/js/theirs/*.js',
    //       '!src/js/theirs/require.js'
    //     ],
    //     dest: 'dist/js/main.min.js'
    //   }
    // }
  });

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  //grunt.loadNpmTasks('grunt-minified');

  grunt.registerTask('default',  ['copy', 'jshint', 'jsdoc', 'cssmin', 'uglify']);

};
