var sass            = require('gulp-sass'),
    autoprefixer    = require('gulp-autoprefixer'),
    cssInlineImages = require('gulp-css-inline-images'),

    <% if (features.livereload) { %>
    livereload = require('gulp-livereload'),
    <% } %>

    <% if (stack == 'ginger') { %>
    minifyCss = require('gulp-minify-css'),
    <% } else { %>
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    <% } %>

    WEBROOT = '<%=paths.webRoot%>',
    VIEWS = '<%=paths.views%>',

    CSS      = WEBROOT + '/css',
    CSS_SRC  = CSS + '/src',
    CSS_DEV  = CSS + '/dev',
    CSS_PROD = CSS + '/prod',

    JS       = WEBROOT + '/js',
    JS_SRC   = JS + '/src',
    JS_DEV   = JS + '/dev',
    JS_PROD  = JS + '/prod',

    BOWER = WEBROOT + '/bower_components',
    HTML5SHIV = BOWER + '/html5shiv/dist',

    CSS_DEFAULT_OPS = [sass(), autoprefixer()];

function process (input, output, operationss) {
    var stream = gulp.src(input);

    operationss.forEach(function (operation) {
        stream = stream.pipe(operation);
    });

    return stream.pipe(gulp.dest(output));
}

gulp.task('watch', function () {
    gulp.watch(CSS_SOURCE + '/**/*.scss', ['styles']);
});

<% if (features.livereload) { %>
gulp.task('livereload', function () {
    var server = livereload(),
        glob;

    gulp.watch([
        CSS_DEV + '/*.css',
        CSS_PROD + '/*.css',
        <% if (stack == 'ginger') { %>
        VIEWS + '/**/*.twig'
        <% } else { %>
        VIEWS + '/**/*.tpl'
        <% } %>
    ], function (file) {
        server.changed(file.path);
    });
});
<% } %>

gulp.task('dev-css', function () {
    return process(CSS_SRC, CSS_DEV, CSS_DEFAULT_OPS);
});

gulp.task('prod-css', function () {
    var additionalOps = [],
        allOps;

    additionalOps.push(
        cssInlineImages({
            webRoot: WEBROOT
        })
    );

    <% if (stack != 'ginger') { %>
    additionalOps.push(
        minifyCss({
            keepSpecialComments: 0,
            processImport: true,
            noAdvanced: false,
            root: WEBROOT,
            relativeTo: CSS_PROD,
            noRebase: true
        })
    );
    <% } %>

    allOps = CSS_DEFAULT_OPS.concat(additionalOps);

    return process(CSS_SRC + '/*.scss', CSS_PROD, allOps);
});

<% if (stack != 'ginger') { %>
gulp.task('prod-js-html5shiv', function () {
    return process(
        [
            HTML5SHIV + '/html5shiv.js',
            HTML5SHIV + '/html5shiv-printshiv.js'
        ],
        JS_PROD,
        [
            concat('html5shiv.js'),
            uglify()
        ]);
});
<% } %>

<% if (stack != 'ginger') { %>
<% if (libraries.jquery || libraries.angular) { %>
gulp.task('prod-js-vendors', function () {
    var input = [];

    <% if (libraries.jquery) { %>
        input.push(BOWER + '/jquery/dist/jquery.js');
    <% } %>

    <% if (libraries.angular) { %>
        input.push(BOWER + '/jquery/dist/angular.js');
    <% } %>

    return process(
        input,
        JS_PROD,
        [
            concat('bootstrap.js'),
            uglify()
        ]
    );
});
<% } %>
<% } %>
