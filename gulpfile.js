var gulp = require('gulp'),
plumber = require('gulp-plumber'),
sass = require('gulp-sass'),
autoprefixer = require('gulp-autoprefixer'),
coffee = require('gulp-coffee'),
include = require("gulp-include"),
connect = require('gulp-connect');


gulp.task('coffee', function() {
  gulp.src('./assets/*.coffee')
    .pipe(plumber())
    .pipe(coffee({bare: true}))
    .pipe(include())
    .pipe(gulp.dest('./assets/'))
    .pipe(connect.reload());
});


gulp.task('scss', function() {
  gulp.src('./assets/*.scss')
    .pipe(plumber())
    .pipe(sass())
    .pipe(autoprefixer())
    .pipe(gulp.dest('./assets/'))
    .pipe(connect.reload());

});

gulp.task('connect', ['scss', 'coffee'], function() {
  connect.server({
    root: '.',
    host: '0.0.0.0',
    livereload: true
  });
});


gulp.task('server', ['connect'], function () {
  
  gulp.watch(['./assets/*.scss'], ['scss']);
  gulp.watch(['./assets/**/*.coffee','./assets/*.js'], ['coffee']);
});