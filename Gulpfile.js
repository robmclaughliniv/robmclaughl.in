const gulp = require('gulp')
const sass = require('gulp-sass')

gulp.task('img', () => gulp.src(['assets/img/**/*']).pipe(gulp.dest('./public/img')))

gulp.task('js', () => gulp.src(['assets/js/**/*']).pipe(gulp.dest('./public/js')))

gulp.task('css', () => {
    let config = {
        outputStyle: 'compressed'
    }
    return  gulp.src(['assets/sass/**/*.scss'])
                .pipe(
                    sass(config).on('error', sass.logError)
                )
                .pipe(
                    gulp.dest('./public/css')
                )
})

gulp.task('sass:watch', function () {
    gulp.watch('./assets/sass/**/*.scss', ['css']);
})

gulp.task('default', ['css','img','js'])