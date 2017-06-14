const gulp = require('gulp');
const eslint = require('gulp-eslint');
let sass = require('gulp-ruby-sass');
let autoprefixer = require('gulp-autoprefixer');
let sourcemaps = require('gulp-sourcemaps');
let browserSync = require('browser-sync').create();

/**
 * STYLESHEETS
 * */

gulp.task('clear:cache', function () {
    sass.clearCache();
});

gulp.task('clean:sass', ['clear:cache'], sassTask);

gulp.task('sass', sassTask);

function sassTask(){
    return sass('./assets/styles/**/*.scss', {sourcemap: true})
        .on('error', sass.logError)
        .pipe(autoprefixer({
            browsers: ['last 3 versions'],
            cascade: false
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./assets/styles'))
        .pipe(browserSync.stream({match: '**/*.css'}));
}

/**
 * LINT
 * */

gulp.task('lint', () => {
    // ESLint ignores files with "node_modules" paths.
    // So, it's best to have gulp ignore the directory as well.
    // Also, Be sure to return the stream from the task;
    // Otherwise, the task may end before the stream has finished.
    return gulp.src(['./assets/js/app/**/*.js'])
    // eslint() attaches the lint output to the "eslint" property
    // of the file object so it can be used by other modules.
        .pipe(eslint())
        // eslint.format() outputs the lint results to the console.
        // Alternatively use eslint.formatEach() (see Docs).
        .pipe(eslint.format())
        // To have the process exit with an error code (1) on
        // lint error, return the stream and pipe to failAfterError last.
        // .pipe(eslint.failAfterError());
});

/**
 * WATCH
 * */

gulp.task('watch', ['clean:sass', 'lint'], function() {

    browserSync.init({
        server: "./"
    });

    gulp.watch('./assets/js/bundle.js').on('change', browserSync.reload);
    gulp.watch('./*.html').on('change', browserSync.reload);
    gulp.watch('./assets/styles/**/*.scss', ['sass']);

});