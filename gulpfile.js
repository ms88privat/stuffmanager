'use strict';

var gulp = require('gulp');
var karma = require('karma').server;
var historyApiFallback = require('connect-history-api-fallback');
var $ = require('gulp-load-plugins')();

gulp.task('watch', ['scripts', 'test', 'doc'], function() {
	gulp.watch('src/**/*.js', ['scripts', 'test', 'doc']);
	gulp.watch('tests/**/*Spec.js', ['test']);
	gulp.watch('docs/index.html', ['html']);
});

gulp.task('build', ['scripts', 'test', 'doc', 'minify']);

gulp.task('default', ['connect', 'watch']);


/* =============================================================================== */
/* 
DOCUMENTATION (neeeds server to be viewed)  
*/
/* =============================================================================== */
gulp.task('connect', function() {
	return $.connect.server({
		root: 'docs',
		port: 8888,
		livereload: true,
		middleware: function() { // params: connect, opt
			return [ historyApiFallback ];
		}
	});
});
 
gulp.task('html', function () {
	gulp.src('./docs/index.html')
		.pipe($.connect.reload());
});
 
gulp.task('doc', function() {
	return gulp.src('src/**/*.js')
	    .pipe($.ngdocs.process())
	    .pipe(gulp.dest('./docs'));
});


/* =============================================================================== */
/* 
SCRIPTS (compile Babel to es5)
*/
/* =============================================================================== */
gulp.task('scripts', [], function() {
	return gulp.src('src/**/*.js')
		.pipe($.babel())
		.pipe(gulp.dest('.tmp/babel'))
		.pipe($.size())
		;
});

gulp.task('minify', [], function() {
	return gulp.src('.tmp/babel/stuffmanager.js')
		.pipe($.ngAnnotate())
		.pipe($.uglify())
		.pipe($.rename('stuffmanager.min.js'))
    	.pipe(gulp.dest('./'));
});

/* =============================================================================== */
/* 
UNIT TESTING  
*/
/* =============================================================================== */

// Run test once and exit
gulp.task('test', ['scripts'], function (done) {
	karma.start({
		configFile: __dirname + '/karma.conf.js',
		singleRun: true
	}, function() {
		done();
	});
});

// Watch for file changes and re-run tests on each change
gulp.task('tdd', ['scripts'], function(done) {
	karma.start({
		configFile: __dirname + '/karma.conf.js'
	}, function() {
		done();
	});
});



