#!/usr/bin/env node

'use strict';

var argv = require('yargs').argv;

var path = require('path'),
	through2 = require('through2'),
	fs = require('vinyl-fs'),
	s3 = require(path.join(__dirname, '..'));

// Download from S3
// env AWS_PROFILE="home" ./example/upload.js --dest="./" "s3://bucket/*.jpg"
s3.src(argv._, { buffer: argv.buffer })
	.pipe(fs.dest(argv.dest))
	.pipe(through2.obj(function processed(file, enc, callback) {
		console.log('Downloaded', file.path);
		callback();
	}))
	.on('finish', function end() {
		console.log('Done.');
	});
