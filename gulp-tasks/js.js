const gulp = require('gulp');
const paths = require('./paths');
const connect = require('gulp-connect');

gulp.task('js:build', () => {
  gulp.src([paths.jsSrc])
    .pipe(gulp.dest(paths.dest))
    .pipe(connect.reload());
});
