const gulp = require('gulp');
const paths = require('./paths');
const connect = require('gulp-connect');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');

gulp.task('js:build', () => {
  gulp.src([paths.jsSrc])
    .pipe(gulp.dest(paths.dest))
    .pipe(babel({
      'presets': ['env']
    }))
    .pipe(uglify())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest(paths.dest))
    .pipe(connect.reload());
});
