#!/usr/bin/env node

'use strict';

var argv = require('yargs').argv;

var path = require('path'),
	through2 = require('through2'),
	fs = require('vinyl-fs'),
	AWS = require('aws-sdk'),
	S3 = require(path.join(__dirname, '..'));

var s3 = new S3(new AWS.S3(), { Bucket: argv.bucket });

// Streaming upload to S3
fs.src(argv._, { buffer: argv.buffer })
	.pipe(s3.dest(argv.dest))
	.pipe(through2.obj(function processed(file, enc, callback) {
		console.log('Uploaded', file.path);
		callback();
	}))
	.on('finish', function end() {
		console.log('Done.');
	});
