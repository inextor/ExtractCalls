/*
	node ./node_modules/gulp/bin/gulp.js
*/
var gulp			= require('gulp');

function index_task(cb)
{
	gulp.src(['./*.html','./manifest.json']).pipe(gulp.dest('dist/'));
	cb();
}

function scripts_task(cb)
{
	console.log('scripts');

	gulp.src(['./node_modules/promiseutil/*.js']).pipe(gulp.dest('dist/js/PromiseUtils/'));
	gulp.src(['./node_modules/extension-framework/*.js']).pipe(gulp.dest('dist/js/Extension-Framework/'));
	gulp.src(['./node_modules/diabetes/Util.js']).pipe(gulp.dest('dist/js/Diabetes/'));
	gulp.src(['./node_modules/db-finger/DatabaseStore.js']).pipe(gulp.dest('dist/js/Finger/'));

	gulp.src([ './images/*.*']).pipe( gulp.dest('dist/images/') );
	gulp.src([ './js/*.js']).pipe( gulp.dest('dist/js/') );


	cb();
}

function css_task(cb)
{
	console.log('css_task');
	gulp.src(['./css/*.css']).pipe(gulp.dest('dist/css'));
	cb();
}

function watch_task(cb)
{
	console.log('watch');
	gulp.watch([
			'./index.html',
			'./css/*.css',
			'./js/*.js',
			'./images/*.*',
			'./manifest.json',
			'./node_modules/extension-framework/*.js',
			'./node_modules/promiseutil/PromiseUtils.js',
      		'./node_modules/db-finger/DatabaseStore.js',
      		'./node_modules/diabetes/Util.js'],gulp.parallel('scripts_task','css_task','index_task'));

	cb();
}

gulp.task('css_task',css_task);
gulp.task('scripts_task', scripts_task );
gulp.task('index_task', index_task);

exports.default = gulp.series( css_task, scripts_task, watch_task, index_task );
