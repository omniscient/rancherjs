var gulp = require("gulp");
var ts = require("gulp-typescript");
var merge = require('merge2');
var del = require('del');
var path = require('path');

var tsProject = ts.createProject('tsconfig.json');

gulp.task('clean', () => {
    return del([
    path.join(process.cwd(), '/dist/**/*').replace(/\\/g, '/')
    ],
    { force: true });
});

gulp.task('build', () => {
    var tsResult = tsProject.src().pipe(tsProject());
    return merge([
        tsResult.dts.pipe(gulp.dest('dist')),
        tsResult.js.pipe(gulp.dest('dist'))
    ]);
});

gulp.task('watch', ['build'], () => {
    gulp.watch('src/**/*.ts', ['build']);
});