
'use strict';

var _ = require('lodash'),
	S3G = require('s3-glob'),
	readStream = require('./read-stream'),
	writeStream = require('./write-stream'),
	vinylStream = require('./vinyl-stream');

var assignWith = _.assignWith || _.assign;

/**
 * @constructor
 * @param {Object} options Default settings.
 */
function S3(options) {
	// `new` short-circuiting
	if (this instanceof S3 === false) {
		return new S3(options);
	}
	this.options = options;
}


/**
 * Fetch vinyl objects from S3 matching a specific set of glob patterns.
 * This method behaves in much the same way as `gulp.src` does.
 *
 * @param {Array|String|Object} path List of glob patterns to fetch.
 * @param {Object} options Options.
 * @returns {Stream} Stream emitting vinyl corresponding to objects in S3.
 *
 * @see gulp.src
 */
S3.src = function src(path, options) {
	options = assignWith({ format: 'query' }, options);
	return S3G(path, options)
		.pipe(readStream(options))
		.pipe(vinylStream(options));
};

/**
 * Create a stream which, when sent vinyl objects, uploads those
 * objects to S3 and then re-emits those objects.
 *
 * @param {String|Object} path Prefix to save objects under in S3.
 * @param {Object} options Stream options.
 * @returns {Stream} Stream emitting same the vinyl as piped in.
 *
 * @see vinyl-fs.dest
 */
S3.dest = function dest(path, options) {
	return writeStream(path, options);
};


S3.prototype.src = function wrapSrc(path, options) {
	return S3.src(path, assignWith({ }, this.options, options));
};

S3.prototype.dest = function wrapDest(path, options) {
	return S3.dest(path, assignWith({ }, this.options, options));
};

module.exports = S3;
