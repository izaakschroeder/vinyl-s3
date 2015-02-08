#!/usr/bin/env node

'use strict';

var argv = require('yargs').argv;

var path = require('path'),
	through2 = require('through2'),
	fs = require('vinyl-fs'),
	s3 = require(path.join(__dirname, '..'));

// Streaming upload to S3
// env AWS_PROFILE="home" ./example/upload.js --dest="s3://bucket" "./*.jpg"
fs.src(argv._, { buffer: argv.buffer })
	.pipe(s3.dest(argv.dest))
	.pipe(through2.obj(function processed(file, enc, callback) {
		console.log('Uploaded', file.path);
		callback();
	}))
	.on('finish', function end() {
		console.log('Done.');
	});
