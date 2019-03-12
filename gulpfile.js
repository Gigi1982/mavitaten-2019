/* jshint node: true */
/* global $: true */
"use strict";

var path = "src";
var gulp = require( "gulp" ),
	/** @type {Object} Loader of Gulp plugins from `package.json` */
	$ = require( "gulp-load-plugins" )(),
	/** @type {Array} JS source files to concatenate and uglify */
	uglifySrc = [
        "src/js/lib/conditionizr-4.3.0.min.js",
		"src/bower_components/modernizr/modernizr.js",
        "src/js/lib/bodymovin.min.js",
		"src/bower_components/bootstrap/dist/js/bootstrap.min.js",
        "src/bower_components/sticky-kit/jquery.sticky-kit.min.js",
        "src/bower_components/swiper/dist/js/swiper.min.js",
        "src/js/lib/jquery.highlight-5.js",
		"src/bower_components/scrollmagic/scrollmagic/minified/ScrollMagic.min.js",
		"src/bower_components/scrollmagic/scrollmagic/minified/plugins/debug.addIndicators.min.js",
		"src/js/scripts.js",
        "src/js/header.js"
	],
	/** @type {Object of Array} CSS source files to concatenate and minify */
	cssminSrc = {
		development: [
			"src/css/banner.css",
            "src/css/Gilroy.css",
            "src/bower_components/swiper/dist/css/swiper.min.css",
			"src/css/style.css"
		],
		production: [
			"src/css/banner.css",
            "src/css/Gilroy.css",
            "src/bower_components/swiper/dist/css/swiper.min.css",
			"src/css/style.css"
		]
	},
	/** @type {String} Used inside task for set the mode to 'development' or 'production' */
	env = (function() {
		/** @type {String} Default value of env */
		var env = "development";

		/** Test if there was a different value from CLI to env
			Example: gulp styles --env=production
			When ES6 will be default. `find` will replace `some`  */
		process.argv.some(function( key ) {
			var matches = key.match( /^\-{2}env\=([A-Za-z]+)$/ );

			if ( matches && matches.length === 2 ) {
				env = matches[1];
				return true;
			}
		});

		return env;
	} ());

var browserSync = require('browser-sync').create();

gulp.task('serve', ['sass'], function() {

    browserSync.init({
        proxy: "www3.mavitaten2019.com",
        notify: false,
        snippetOptions: {
            ignorePaths: "wp-admin/**"
        }
    });

    gulp.watch(path + "/css/sass/**/*.scss", ['sass']);
    gulp.watch(path + "/**/*.php").on('change', browserSync.reload);
});

/** Clean */
gulp.task( "clean", function(){
    return require( "del" ).bind( null, [ ".tmp", "dist" ] ) ;
});

/** Copy */
gulp.task( "copy", function() {
	return gulp.src([
            "src/*.{php,png,css}",
            "src/css/*.css",
			"src/modules/*.php",
			"src/inc/*.php",
			"src/js/pages/*.js",
			"src/img/**/*.{jpg,png,svg,gif,webp,ico}",
			"src/fonts/*.{woff,woff2,ttf,otf,eot,svg}",
			"src/languages/*.{po,mo,pot}",
		], {
			base: "src"
		})
		.pipe( gulp.dest( "dist" ) );
});

/** CSS Preprocessors */
gulp.task( "sass", function () {
	return gulp.src( "src/css/sass/style.scss" )
		.pipe( $.sourcemaps.init() )
		.pipe( $.sass() )
		.pipe( $.sourcemaps.write( "." ) )
		.on( "error", function( e ) {
			console.error( e );
		})
		.pipe( gulp.dest( "src/css" ) )
        .pipe(browserSync.stream());
});

/** STYLES */
gulp.task( "styles", [ "sass" ], function() {
	console.log( "`styles` task run in `" + env + "` environment" );

	var stream = gulp.src( cssminSrc[ env ] )
		.pipe( $.concat( "style.css" ))
		.pipe( $.autoprefixer( "last 2 version" ) );

	if ( env === "production" ) {
		stream = stream.pipe( $.csso() );
	}

	return stream.on( "error", function( e ) {
			console.error( e );
		})
		.pipe( gulp.dest( "src" ) );
});

/** JSHint */
gulp.task( "jshint", function () {
	/** Test all `js` files exclude those in the `lib` folder */
	return gulp.src( "src/js/{!(lib)/*.js,*.js}" )
		.pipe( $.jshint() )
		.pipe( $.jshint.reporter( "jshint-stylish" ) )
		.pipe( $.jshint.reporter( "fail" ) );
});

/** Templates */
gulp.task( "template", function() {
	console.log( "`template` task run in `" + env + "` environment" );

    var is_debug = ( env === "production" ? "false" : "true" );

    return gulp.src( "src/dev-templates/is-debug.php" )
        .pipe( $.template({ is_debug: is_debug }) )
        .pipe( gulp.dest( "src/modules" ) );
});

/** Uglify */
gulp.task( "uglify", function() {
	return gulp.src( uglifySrc )
		.pipe( $.concat( "scripts.min.js" ) )
		.pipe( $.uglify() )
		.pipe( gulp.dest( "dist/js" ) );
});

/** `env` to 'production' */
gulp.task( "envProduction", function() {
	env = "production";
});

/** Livereload */
gulp.task( "watch", [ "template", "styles", "serve", /*"jshint"*/], function() {
	var server = $.livereload;
	server.listen();

	/** Watch for livereoad */
	gulp.watch([
		"src/js/**/*.js",
		"src/*.php",
		"src/*.css"
	]).on( "change", function( file ) {
		console.log( file.path );
		server.changed( file.path );
	});

	/** Watch for autoprefix */
	gulp.watch( [
		"src/css/*.css",
		"src/css/sass/**/*.scss"
	], [ "styles" ] );

	/** Watch for JSHint */
	//gulp.watch( "src/js/{!(lib)/*.js,*.js}", ["jshint"] );
});

/** Build */
gulp.task( "build", [
	"envProduction",
	"clean",
	"template",
	"styles",
	//"jshint",
	"copy",
	"uglify"
], function () {
	console.log("Build is finished");
});

/** Gulp default task */
gulp.task( "default", ["watch"] );
