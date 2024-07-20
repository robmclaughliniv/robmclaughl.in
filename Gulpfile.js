const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));

// Define the 'img' task
function imgTask() {
  return gulp.src('assets/img/**/*')
    .pipe(gulp.dest('./public/img'));
}

// Define the 'js' task
function jsTask() {
  return gulp.src('assets/js/**/*')
    .pipe(gulp.dest('./public/js'));
}

// Define the 'css' task
function cssTask() {
  const config = {
    outputStyle: 'compressed'
  };
  return gulp.src('assets/sass/**/*.scss')
    .pipe(sass(config).on('error', sass.logError))
    .pipe(gulp.dest('./public/css'));
}

// Define the 'watch' task for SASS
function watchTask() {
  gulp.watch('./assets/sass/**/*.scss', cssTask);
}

// Define the default task
const build = gulp.series(gulp.parallel(cssTask, imgTask, jsTask));

// Export tasks to be run with gulp
exports.img = imgTask;
exports.js = jsTask;
exports.css = cssTask;
exports.watch = watchTask;
exports.default = build;