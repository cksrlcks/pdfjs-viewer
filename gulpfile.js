var gulp = require("gulp");
var concat = require("gulp-concat");

//js
var babel = require("gulp-babel");
var minify = require("gulp-minify");
//css
var sass = require("gulp-sass");
var minificss = require("gulp-minify-css");
var autoprefixer = require("gulp-autoprefixer");

var del = require("del");

//path
var devsrc = "src";
var pubsrc = "dist";

var paths = {
    dev: {
        js: devsrc + "/!(*.min)*.js",
        scss: devsrc + "/scss/*.scss",
    },
    pub: {
        js: pubsrc + "/js",
        css: pubsrc + "/css",
    },
};

function gulp_js() {
    return gulp
        .src([paths.dev.js])
        .pipe(babel())
        .pipe(
            minify({
                ext: {
                    min: ".min.js",
                },
            })
        )
        .pipe(gulp.dest(paths.pub.js));
}

function gulp_min_js() {
    return gulp.src(["src/*.min.js"]).pipe(gulp.dest(paths.pub.js));
}
function gulp_scss() {
    return gulp
        .src(paths.dev.scss)
        .pipe(
            autoprefixer({
                cascade: false,
            })
        )
        .pipe(sass().on("error", sass.logError))
        .pipe(minificss())
        .pipe(concat("uxis-viewer.css"))
        .pipe(gulp.dest(paths.pub.css));
}

function gulp_watch() {
    gulp.watch(paths.dev.js, gulp_js);
    gulp.watch(paths.dev.scss, gulp_scss);
}

function clean() {
    return del(["./dist/"]);
}

gulp.task("default", gulp.series(clean, gulp.parallel(gulp.series(gulp_js, gulp_min_js, gulp_scss), gulp_watch)));
