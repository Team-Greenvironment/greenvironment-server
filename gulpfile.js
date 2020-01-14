const {src, dest, watch, series, task} = require('gulp');
const ts = require('gulp-typescript');
const minify = require('gulp-minify');
const del = require('delete');
const gulp = require('gulp');

function clearDist(cb) {
    del('dist/*', cb);
}

function compileTypescript() {
    let tsProject = ts.createProject('tsconfig.json');
    let tsResult = tsProject.src().pipe(tsProject());
    return tsResult
    //.pipe(minify())
        .pipe(dest('dist'));
}

function minifyJs() {
    return src('src/public/javascripts/**/*.js')
        .pipe(minify({
            ext: {
                src: '-debug.js',
                min: '.js'
            }
        }))
        .pipe(dest('dist/public/javascripts'));
}

function moveRemaining() {
    return src(['src/**/*', '!src/**/*.ts', '!src/**/*.sass', '!src/**/*.js'])
        .pipe(dest('dist'));
}

task('default', series(clearDist, compileTypescript, minifyJs, moveRemaining));
task('watch', () => {
    watch('**/*.js', minifyJs);
    watch('**/*.ts', compileTypescript);
});
