
'use strict';

var _ = require('lodash'),
	through2 = require('through2'),
	S3S = require('s3-streams');

/**
 * Create a stream which takes objects with a { Key: 'foo' } property and converts
 * them to S3 objects. The S3 objects inherit all of the given AWS options.
 *
 * @param {AWS.S3} s3 S3 instance.
 * @param {Object} awsOptions Options passed directly to AWS.
 * @param {Object} streamOptions Options for the stream.
 * @param {Boolean} streamOptions.buffer True to use buffering, false for streaming.
 * @param {Boolean} streamOptions.read True to return key content.
 * @param {Boolean} streamOptions.meta True to return key metadata.
 * @returns {Stream.Transform} The stream.
 */
module.exports = function createReadStream(s3, awsOptions, streamOptions) {

	if (!s3 || !_.isFunction(s3.getObject)) {
		throw new TypeError();
	}

	streamOptions = _.assign({
		buffer: true,
		read: true
	}, streamOptions);

	return through2.obj(function readStream(object, encoding, callback) {

		function resolve(err, result) {
			if (err) {
				return callback(err);
			} else {
				return callback(null, _.assign({ }, object, result));
			}
		}

		// Select the appropriate S3 API call based on how the user
		// wants the data.
		var request = _.assign({ }, awsOptions, _.pick(object, ['Key', 'Bucket']));

		if (streamOptions.read && streamOptions.buffer) {
			s3.getObject(request, resolve);
		} else if (streamOptions.read && !streamOptions.buffer) {
			S3S.ReadStream(s3, request)
				.on('open', function open(headers) {
					resolve(null, _.assign(headers, { Body: this }));
				})
				.on('error', resolve)
				.read(0); // Trigger initial read for open event
		} else {
			s3.headObject(request, resolve);
		}
	});
};
