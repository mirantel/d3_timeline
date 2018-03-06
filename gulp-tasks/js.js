const gulp = require('gulp');
const paths = require('./paths');
const connect = require('gulp-connect');
const babel = require('gulp-babel');

gulp.task('js:build', () => {
  gulp.src([paths.jsSrc])
    .pipe(babel())
    .pipe(gulp.dest(paths.dest))
    .pipe(connect.reload());
});
