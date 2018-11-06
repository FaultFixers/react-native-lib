const fs = require('fs');
const config = require('./config/load.js');

module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);

    const gruntConfig = {
        webfont: {
            icons: {
                src: 'src/public/images/**/*.svg',
                dest: 'src/public/generated',
                destCss: 'src/public/generated',
                options: {
                    fontFilename: 'ff-icons',
                    stylesheet: 'less',
                    templateOptions: {
                        baseClass: 'ff-icon',
                        classPrefix: 'ff-',
                        mixinPrefix: 'ff-',
                    },
                    relativeFontPath: '/generated',
                },
            },
        },
    };

    grunt.initConfig(gruntConfig);

    grunt.registerTask('default', [
        'build',
    ]);
    grunt.registerTask('build', [
        'webfont',
    ]);
};
