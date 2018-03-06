const gulp = require('gulp');
const paths = require('./paths');
const connect = require('gulp-connect');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');

gulp.task('js:build', () => {
  gulp.src([paths.jsSrc])
    .pipe(babel({
      "presets": ["es2015"]
    }))
    .pipe(uglify())
    .pipe(gulp.dest(paths.dest))
    .pipe(connect.reload());
});
