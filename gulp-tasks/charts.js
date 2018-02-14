const gulp = require('gulp');
const paths = require('./paths');
const connect = require('gulp-connect');

gulp.task('lineChart:reload', () => {
    gulp.src(paths.lineChart)
        .pipe(connect.reload());
});
