'use strict'

const {src, dest} = require('gulp')
const gulp = require('gulp')
const autoprefixer = require('gulp-autoprefixer')
const cssbeautify = require('gulp-cssbeautify');
const cssnano = require('gulp-cssnano');
const removeComents = require('gulp-strip-css-comments');
const rename = require('gulp-rename');
const sass = require('gulp-sass')(require('sass'));
const uglify = require('gulp-uglify');
const plumber = require('gulp-plumber');
const imagemin = require('gulp-imagemin');
const del = require('del');
const notify = require('gulp-notify')
const browserSync = require('browser-sync').create();
const rigger = require('gulp-rigger')

/* Paths */
const srcPath = 'src/'
const distPath = 'dist/'

/* Куда будет собиратся проект */
const path = {
    build: {
        html: distPath,
        css:    distPath + 'assets/css/',
        js:     distPath + 'assets/js/',
        images: distPath + 'assets/images/',
        fonts:  distPath + 'assets/fonts/'
    },
    /* Откуда будет собиратся проект */
    src: {
        html: srcPath + '*.html',
        css:    srcPath + 'assets/sass/*.sass',
        js:     srcPath + 'assets/js/*.js',
        images: srcPath + 'assets/images/**/*.{jpg,jpeg,png,svg,gif,ico,webp}',
        fonts:  srcPath + 'assets/fonts/**/*.{eot,woff,woff2,ttf,svg}'
    },
    /* За какими файлами нужно следить */
    watch: {
        html: srcPath + '**/*.html',
        css:    srcPath + 'assets/sass/**/*.sass',
        js:     srcPath + 'assets/js/**/*.js',
        images: srcPath + 'assets/images/**/*.{jpg,jpeg,png,svg,gif,ico,webp}',
        fonts:  srcPath + 'assets/fonts/**/*.{ttf,woff,woff2,eot,svg}' //
    },
    /* Для очистки папки dist */
    clean: './' + distPath
}

/* Настройка Tasc */

// Автоперезагрузка локального сервера

function serve() {
    browserSync.init({
        server: {
            baseDir: "./" + distPath
        }
    });
}

/* Проверочная функция на корректность работы создает папку dist/.html */
function html() {
    return src(path.src.html, {base: srcPath})
        .pipe(plumber()) // ловит ошибки в процессе написания кода
        .pipe(dest(path.build.html))
        .pipe(browserSync.reload({stream: true}))  // для browserSync
}

function css() {
    return src(path.src.css, {base: srcPath + "assets/sass/"})
        .pipe(plumber({
            errorHandler : function(err){
                notify.onError({
                    title: 'sass Error',
                    message: 'Error: <%= error.message %>'
                })(err);
                this.emit('end');
            }
        })) // ловит ошибки в процессе написания кода (plumber + notify)
        .pipe(sass())
        .pipe(autoprefixer())
        .pipe(cssbeautify())
        .pipe(dest(path.build.css))
        .pipe(cssnano({
            zindex: false,
            discardComments:{
                removeAll: true
            }
        }))
        .pipe(removeComents())
        .pipe(rename({
            suffix: '.min',
            extname: '.css'
        }))
        .pipe(dest(path.build.css))
        .pipe(browserSync.reload({stream: true}))
}

function js() {
    return src(path.src.js, {base: srcPath + "assets/js/"})
        .pipe(plumber({
            errorHandler : function(err){
                notify.onError({
                    title: 'Java Script Error',
                    message: 'Error: <% error.message%>'
                })(err);
                this.emit('end');
            }
        }))
        .pipe(rigger())
        .pipe(dest(path.build.js))
        .pipe(uglify()) 
        .pipe(rename({
            suffix: '.min',
            extname: '.js'
        }))
        .pipe(dest(path.build.js))
        .pipe(browserSync.reload({stream: true}))
}

function images(){
    return src(path.src.images, {base: srcPath + "assets/images/"})
        .pipe(imagemin([
            imagemin.gifsicle({interlaced: true}),
            imagemin.mozjpeg({quality: 50, progressive: true}),
            imagemin.optipng({optimizationLevel: 5}),
            imagemin.svgo({
                plugins: [
                    {removeViewBox: true},
                    {cleanupIDs: false}
                ]
            })
        ]))
        .pipe(dest(path.build.images))
        .pipe(browserSync.reload({stream: true}))
}

function fonts() {
    return src(path.src.fonts, {base: srcPath + "assets/fonts/"})
    .pipe(dest(path.build.fonts))
    .pipe(browserSync.reload({stream: true}))
}

function clean() {
    return del(path.clean)
}


// Отслеживет и применяет изменения
function watchFiles () {
    gulp.watch([path.watch.html], html)
    gulp.watch([path.watch.css], css)
    gulp.watch([path.watch.js], js)
    gulp.watch([path.watch.images], images)
    gulp.watch([path.watch.fonts], fonts)
}

// билд который полностью удаляет dist и создает актуальный полностью готовый dist
const build = gulp.series(clean, gulp.parallel(html, css, js, images, fonts))

const watch = gulp.parallel(build, watchFiles, serve)



exports.html = html
exports.css = css
exports.js = js
exports.images = images
exports.fonts = fonts
exports.clean = clean
exports.build = build
exports.watch = watch
exports.default = watch
