
'use strict';

var _ = require('lodash'),
	AWS = require('aws-sdk'),
	through2 = require('through2'),
	S3S = require('s3-streams');

/**
 * Check to see whether or not we were actually expecting an error respond code
 * back. This happens sometimes if we're filtering the results by using some of
 * the "If"-style headers.
 *
 * IfNoneMatch: 304
 * IfModifiedSince: 304
 * IfMatch: 412
 * IfUnmodifiedSince: 412
 *
 * @param {Object} request The AWS options we started with.
 * @param {Object} error The error we got back in response to the request.
 * @returns {Boolean} True if the error was expected, false otherwise.
 */
function expectedError(request, error) {
	return (error.code === 304 || error.code === 412);
}

/**
 * Create a stream which takes objects with a { Key: 'foo' } property and  turns
 * them into S3 objects. The S3 objects inherit all of the given AWS options.
 *
 * @param {Object} options Options for the stream.
 * @param {AWS.S3} options.s3 S3 instance.
 * @param {Object} options.awsOptions Options passed directly to AWS.
 * @param {Boolean} options.buffer True to buffer, false to stream.
 * @param {Boolean} options.read True to return key content.
 * @param {Boolean} options.meta True to return key metadata.
 * @returns {Stream.Transform} The stream.
 */
module.exports = function createReadStream(options) {

	options = _.assign({
		buffer: true,
		read: true,
		awsOptions: { },
		s3: new AWS.S3()
	}, options);

	if (!options.s3 || !_.isFunction(options.s3.getObject)) {
		throw new TypeError();
	}

	return through2.obj(function readStream(object, encoding, callback) {

		// Select the appropriate S3 API call based on how the user
		// wants the data.
		var request = _.assign({ }, options.awsOptions, object);

		function resolve(err, result) {
			if (err) {
				return callback(!expectedError(request, err) ? err : null);
			} else {
				return callback(null, _.assign({ }, object, result));
			}
		}

		if (options.read && options.buffer) {
			options.s3.getObject(request, resolve);
		} else if (options.read && !options.buffer) {
			S3S.ReadStream(options.s3, request)
				.on('open', function open(headers) {
					resolve(null, _.assign(headers, { Body: this }));
				})
				.on('error', resolve)
				.read(0); // Trigger initial read for open event
		} else {
			options.s3.headObject(request, resolve);
		}
	});
};
