/*
	node ./node_modules/gulp/bin/gulp.js
*/
var gulp			= require('gulp');
var merge			= require('merge-stream');

function index_task()
{
	return gulp.src(['./*.html','./manifest.json']).pipe(gulp.dest('dist/'));
}

function scripts_task( )
{
    return merge
	(
    	gulp.src(['./node_modules/promiseutil/*.js']).pipe(gulp.dest('dist/PromiseUtils/'))
    	,gulp.src(['./node_modules/extension-framework/*.js']).pipe(gulp.dest('dist/Extension-Framework/'))
    	,gulp.src(['./node_modules/diabetes/Util.js']).pipe(gulp.dest('dist/Diabetes/'))
    	,gulp.src(['./node_modules/db-finger/DatabaseStore.js']).pipe(gulp.dest('dist/Finger/'))
    	,gulp.src(['./images/*.*']).pipe( gulp.dest('dist/images/') )
      	,gulp.src(['./js/*.js']).pipe( gulp.dest('dist/js/') )
	);
}

function css_task()
{
	return gulp.src(['./css/*.css']).pipe(gulp.dest('dist/css'));
}

function watch_task(cb)
{
	console.log('watch');
	return gulp.watch([
			'./index.html',
			'./css/*.css',
			'./js/*.js',
			'./images/*.*',
			'./manifest.json',
			'./node_modules/extension-framework/*.js',
			'./node_modules/promiseutil/PromiseUtils.js',
      		'./node_modules/db-finger/DatabaseStore.js',
      		'./node_modules/diabetes/Util.js'],gulp.parallel(css_task,index_task,scripts_task));
}

exports.default = gulp.series( scripts_task, css_task,index_task,watch_task );
