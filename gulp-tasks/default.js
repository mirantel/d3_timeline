const gulp = require('gulp');
const runSequence = require('run-sequence');

gulp.task('default', (done) => {
  runSequence(
    'clean',
    [
      'js:build',
      'html:copy',
      'connect',
      'watch'
    ],
    done
  );
});
