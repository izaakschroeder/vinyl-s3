#!/usr/bin/env node

'use strict';

var argv = require('yargs').argv;

var through2 = require('through2'),
	s3 = require('vinyl-s3');

// env AWS_PROFILE="home" ./example/meta.js "s3://my-bucket/foo/**/*.jpg"
s3.src(argv._, { read: false })
	.pipe(through2.obj(function onFile(file, enc, callback) {
		console.log(file.path);
		callback();
	}))
	.on('finish', function onFinish() {
		console.log('Done.');
	});
