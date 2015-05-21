var generators = require('yeoman-generator'),
    fs         = require('fs'),
    _          = require('lodash');

module.exports = generators.Base.extend({
    constructor: function () {
        generators.Base.apply(this, arguments);
    },

    initializing: function () {
        this.answers = {};

        this.defaults = {
            ginger: {
                templateRoot: 'templates',
                webRoot: 'lib'
            },
            symfony2: {
                templateRoot: 'src/AppBundle/Resources/views',
                webRoot: 'src/AppBundle/Resources/public'
            }
        };

        this.log("\n");
        this.log("\n");
        this.log("     _      _      _     _ _");
        this.log("  __| |_ __(_) ___| |__ (_) |_");
        this.log(" / _` | '__| |/ _ \\ '_ \\| | __|");
        this.log("| (_| | |  | |  __/ |_) | | |_");
        this.log(" \\__,_|_|  |_|\\___|_.__/|_|\\__|");
        this.log("\n");
        this.log("\n");


        // Probably Symfony2
        if (fs.existsSync('src/AppBundle')) {
            this.answers.stack        = 'symfony2';
            this.answers.templateRoot = 'src/AppBundle/Resources/views';
            this.answers.webRoot      = 'src/AppBundle/Resources/public';

            this.log('[INFO] Possibly detected Symfony2 as backend technology');

        // Probably Ginger
        } else if (fs.existsSync('lib') && fs.existsSync('templates')) {
            this.answers.stack        = 'ginger';
            this.answers.templateRoot = 'templates';
            this.answers.webRoot      = 'lib';

            this.log('[INFO] Possibly detected Ginger as backend technology');
        }
    },

    //
    // PROMPT THE USER FOR VARIOUS OPTIONS
    //
    prompting: {
        stack: function () {
            var done = this.async(),
                defaultValue;

            this.prompt({
                type: 'list',
                name: 'stack',
                message: 'What backend stack are you using?',
                default: this.answers.stack,
                choices: [
                    { name: 'Symfony2 / Twig', value: 'symfony2' },
                    { name: 'Ginger',          value: 'ginger' },
                    { name: 'Other / Twig',    value: 'other' }
                ]
            }, (function (answer) {
                this.answers.stack = answer.stack;

                done();
            }).bind(this))
        },

        templateRoot: function () {
            var done = this.async(),
                templateRoot;

            if (this.answers.stack != 'other') {
                templateRoot = this.defaults[this.answers.stack].templateRoot;
            }

            this.prompt({
                type: 'input',
                name: 'templateRoot',
                message: 'What is the path of the template directory relative to the current directory (e.g. `views`)?',
                default: templateRoot,
            }, (function (answer) {
                var path = answer.templateRoot;

                this.answers.templateRoot = path.replace(/^\/|\/$/g, ''); // strip slashes at the beginning and the end of the path

                done();
            }).bind(this));
        },

        webRoot: function () {
            var done = this.async(),
                webRoot;

            if (this.answers.stack != 'other') {
                webRoot = this.defaults[this.answers.stack].webRoot;
            }

            this.prompt({
                type: 'input',
                name: 'webRoot',
                message: 'What is the path of the web root relative to the current directory (e.g. `web`)?',
                default: webRoot
            }, (function (answer) {
                var path = answer.webRoot;

                this.answers.webRoot = path.replace(/^\/|\/$/g, ''); // strip slashes at the beginning and the end of the path

                done();
            }).bind(this));
        },

        libraries: function () {
            var done = this.async();

            this.prompt({
                type: 'checkbox',
                name: 'libraries',
                message: 'Do you need any of the following libraries? You can add your own later if necessary',
                choices: [
                    { name: 'Angular',    value: 'angular' },
                    { name: 'jQuery',     value: 'jquery',    checked: true },
                    { name: 'HTML5 shiv', value: 'html5shiv', checked: true }
                ],
            }, (function (answers) {
                this.answers.libraries = answers.libraries;

                done();
            }).bind(this));
        },

        features: function () {
            var done = this.async();

            this.prompt({
                type: 'checkbox',
                name: 'features',
                message: 'What features do you need? If you are using Ginger, you don\'t need "asset versioning". Ginger takes care of that.',
                choices: [
                    //{ name: 'Asset versioning', value: 'assetversioning', checked: this.answers.stack !== 'ginger' },
                    { name: 'LiveReload',       value: 'livereload',      checked: this.answers.stack !== 'ginger' }
                ],
            }, (function (answers) {
                this.answers.features = answers.features;

                done();
            }).bind(this));
        }
    },

    //
    // WRITE ALL THE META DATA FILES
    //
    configuring:  {
        jshint: function () {
            var jshintSrc = this.templatePath('.jshintrc');

            this.fs.copyTpl(
                this.templatePath('.jshintrc'),
                this.destinationPath('.jshintrc'),
                { type: 'node' }
            );

            this.fs.copyTpl(
                this.templatePath('.jshintrc'),
                this.destinationPath(this.answers.webRoot + '/.jshintrc'),
                {
                    type: 'browser',
                    jQuery: this.answers.libraries.indexOf('jquery') > -1
                }
            );
        },

        editorConfig: function () {
            this.fs.copy(
                this.templatePath('.editorconfig'),
                this.destinationPath('.editorconfig')
            );
        }
    },

    //
    // WRITE THE PROJECT FILES
    //
    writing: {
        layoutTemplate: function () {
            var stack = this.answers.stack,
                fileName;

            if (stack == 'ginger') {
                fileName = 'base.tpl';
            } else {
                fileName = 'layout.twig';
            }

            this.fs.copyTpl(
                this.templatePath('baselayout.tmpl'),
                this.destinationPath(this.answers.templateRoot + '/' + fileName),
                {
                    stack: stack,
                    features: {
                        livereload: this.answers.features.indexOf('livereload') > -1
                    },
                    libraries: {
                        jquery: this.answers.libraries.indexOf('jquery') > -1,
                        angular: this.answers.libraries.indexOf('angular') > -1,
                        html5shiv: this.answers.libraries.indexOf('html5shiv') > -1
                    }
                }
            );
        },

        gulpFile: function () {
            var stack = this.answers.stack,
                answers = this.answers;

            console.log(this.templatePath('Gulpfile.js'));
            console.log(this.destinationPath());

            this.fs.copyTpl(
                this.templatePath('Gulpfile.js'),
                this.destinationPath(),
                {
                    stack: stack,
                    paths: {
                        webRoot: answers.webRoot,
                        views: answers.templateRoot
                    },
                    features: {
                        livereload: answers.features.indexOf('livereload') > -1
                    },
                    libraries: {
                        jquery: answers.libraries.indexOf('jquery') > -1,
                        angular: answers.libraries.indexOf('angular') > -1,
                        html5shiv: answers.libraries.indexOf('html5shiv') > -1
                    }
                }
            );
        },

        cssStructure: function () {
            var css = this.answers.webRoot + '/css';

            fs.mkdirSync(css);
            fs.mkdirSync(css + '/src');
            fs.mkdirSync(css + '/src/modules');
            fs.mkdirSync(css + '/src/pages');
            fs.mkdirSync(css + '/dev');
            fs.mkdirSync(css + '/prod');

            _.forEach([
                'css/src/_mixins.scss',
                'css/src/_variables.scss',
                'css/src/screen.scss'
            ], function (path) {
                this.fs.copyTpl(
                    this.templatePath(path),
                    this.destinationPath(this.answers.webRoot + '/' + path)
                );
            }, this);
        },

        jsStructure: function () {
            var js = this.answers.webRoot + '/js';

            fs.mkdirSync(js + '');
            fs.mkdirSync(js + '/src');
            fs.mkdirSync(js + '/prod');

            if (this.answers.libraries.indexOf('angular') > -1) {
                fs.mkdirSync(js + '/src/angular');
            }
        }
    },

    //
    // INSTALL BOWER AND NPM MODULES
    //
    install: {
        bower: function () {
            var done      = this.async(),
                libs      = this.answers.libraries,
                completed = 0;

            function installComplete () {
                completed += 1;

                if (completed === libs.length) {
                    done();
                }
            }

            _.forEach(libs, function (lib) {
                this.bowerInstall([lib], { 'save': true }, installComplete);
            }, this);
        },

        npm: function () {
            var libsAll = [
                    'gulp',
                    'gulp-autoprefixer',
                    'gulp-css-inline-images',
                    'gulp-sass'
                ],
                libsLiveReload = [
                    'gulp-livereload',
                ],
                libsNotGinger = [
                    'gulp-concat',
                    'gulp-minify-css',
                    'gulp-uglify'
                ],
                installLibs,
                completed = 0,
                done = this.async();

            function installComplete () {
                completed += 1;

                if (completed === installLibs.length) {
                    done();
                }
            }

            installLibs = libsAll;

            if (this.stack != 'ginger') {
                installLibs = installLibs.concat(libsNotGinger);
            }

            if (this.answers.features.indexOf('livereload') > -1) {
                installLibs = installLibs.concat(libsLiveReload);
            }

            _.forEach(installLibs, function (lib) {
                this.npmInstall([lib], { 'save': true }, installComplete)
            }, this);
        }
    }
});
