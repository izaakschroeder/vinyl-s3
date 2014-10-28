#!/usr/bin/env node

'use strict';

var argv = require('yargs').argv;

var path = require('path'),
	through2 = require('through2'),
	fs = require('vinyl-fs'),
	AWS = require('aws-sdk'),
	vinylS3 = require(path.join(__dirname, '..'));

var s3 = vinylS3(new AWS.S3(), { Bucket: argv.bucket });

// Download from S3
s3.src(argv._, { buffer: argv.buffer })
	.pipe(fs.dest(argv.dest))
	.pipe(through2.obj(function processed(file, enc, callback) {
		console.log('Downloaded', file.path);
		callback();
	}))
	.on('finish', function end() {
		console.log('Done.');
	});
