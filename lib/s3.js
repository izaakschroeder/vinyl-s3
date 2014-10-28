
'use strict';

var _ = require('lodash'),
	S3G = require('s3-glob'),
	readStream = require('./read-stream'),
	writeStream = require('./write-stream'),
	vinylStream = require('./vinyl-stream');

/**
 * @constructor
 * @param {AWS.S3} s3 S3 instance.
 * @param {Object} awsOptions Default settings.
 */
function S3(s3, awsOptions) {
	// `new` short-circuiting
	if (this instanceof S3 === false) {
		return new S3(s3, awsOptions);
	}

	// Assign local variables
	this.s3 = s3;
	this.awsOptions = awsOptions;
}

/**
 * Fetch vinyl objects from S3 matching a specific set of glob patterns.
 * This method behaves in much the same way as `gulp.src` does.
 *
 * @param {Array|String} path List of glob patterns to fetch.
 * @param {Object} options Options.
 * @returns {Stream} Stream emitting vinyl objects corresponding to objects in S3.
 *
 * @see gulp.src
 */
S3.prototype.src = function src(path, options) {
	return S3G(this.s3, this.awsOptions, path)
		.pipe(readStream(this.s3, this.awsOptions, options))
		.pipe(vinylStream(options));
};

/**
 * Create a stream which, when sent vinyl objects, uploads those
 * objects to S3 and then re-emits those objects.
 *
 * @param {String} path Prefix to save objects under in S3.
 * @returns {Stream} Stream emitting same the vinyl as piped in.
 *
 * @see vinyl-fs.dest
 */
S3.prototype.dest = function dest(path) {
	return writeStream(this.s3, _.assign({ }, this.awsOptions, { Key: path }));
};

module.exports = S3;
