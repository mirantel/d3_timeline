const gulp = require('gulp');
const connect = require('gulp-connect');
const paths = require('./paths');
const open = require('open');

gulp.task('connect', () => {
  connect.server({
    root: './public',
    port: 5050,
    livereload: true
  });
  open('http://localhost:5050/');
});

gulp.task('watch', () => {
  gulp.watch(paths.htmlSrc, ['html:copy']);
  gulp.watch(paths.jsSrc, ['js:build']);
});
