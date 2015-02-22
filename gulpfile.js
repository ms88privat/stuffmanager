'use strict';

var gulp = require('gulp');
var karma = require('karma').server;

var $ = require('gulp-load-plugins')();



gulp.task('scripts', [], function() {
	return gulp.src('src/**/*.js')
		.pipe($.babel())
		.pipe(gulp.dest('.tmp/babel'))
		.pipe($.size())
		;
});

gulp.task('watch', ['scripts', 'test'], function() {

	gulp.watch('src/**/*.js', ['scripts', 'test']);
	gulp.watch('tests/**/*Spec.js', ['test']);
});

/**
 * Run test once and exit
 */
gulp.task('test', ['scripts'], function (done) {
	karma.start({
		configFile: __dirname + '/karma.conf.js',
		singleRun: true
	}, function() {
		done();
	});
});

/**
 * Watch for file changes and re-run tests on each change
 */
gulp.task('tdd', ['scripts'], function(done) {
	karma.start({
		configFile: __dirname + '/karma.conf.js'
	}, function() {
		done();
	});
});

gulp.task('default', ['watch']);