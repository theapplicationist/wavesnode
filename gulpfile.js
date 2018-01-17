var gulp = require('gulp')
var clean = require('gulp-clean')
var ts = require("gulp-typescript");
var tsProject = ts.createProject("tsconfig.json");

gulp.task('clean', function () {
  return gulp.src('dist/', { allowEmpty: true })
    .pipe(clean())
})

gulp.task('compile', function () {
  return gulp.src('src/**/*.ts', '!src/web/*')
    .pipe(tsProject())
    .js.pipe(gulp.dest('dist'))
})

gulp.task('copy-web', function () {
  return gulp.src('src/web/*')
    .pipe(gulp.dest('dist/web'))
})

gulp.task('default', gulp.series('clean', 'compile', 'copy-web', function (done) {
  done()
}))