
'use strict';

var _ = require('lodash'),
	path = require('path'),
	mime = require('mime'),
	AWS = require('aws-sdk'),
	through2 = require('through2'),
	S3S = require('s3-streams'),
	url = require('s3-url');

var encodings = {
	'gz': 'gzip',
	'xz': 'xz'
};

/**
 * Create a stream which can be piped vinyl files that get uploaded to S3.
 * Once the files have finished being uploaded, they will be re-emitted so
 * that other streams can re-use them later in the pipeline.
 *
 * Vinyl files that have the `awsOptions` property set automatically have those
 * options passed through to S3.
 *
 * @param {String|Object} root Destination to write to.
 * @param {Object} options Stream options.
 * @param {AWS.S3} options.s3 S3 instance.
 * @param {String} options.base Prefix for all keys.
 * @param {Object} options.awsOptions Settings for AWS.
 * @param {String} options.awsOptions.Bucket Destination bucket to write to.
 * @returns {Stream.Transform} Stream.
 */
module.exports = function createWriteStream(root, options) {

	options = _.assign({
		s3: new AWS.S3(),
		awsOptions: { }
	}, options);

	var s3 = options.s3,
		awsOptions = options.awsOptions,
		prefix;

	if (!s3 || !_.isFunction(s3.putObject)) {
		throw new TypeError();
	}

	_.assign(awsOptions, _.isString(root) ? url.urlToOptions(root) : root);

	if (!_.has(awsOptions, 'Bucket')) {
		throw new TypeError();
	}

	prefix = awsOptions.Key ? awsOptions.Key + '/' : '';


	return through2.obj(function writeStream(file, encoding, callback) {

		function done(err) {
			callback(err, file);
		}

		var name = path.basename(file.path),
			contentType = file.contentType,
			contentEncoding = file.contentEncoding;

		// If the file extensions match a known encoding and there isn't an
		// encoding set for the file then use the ones we guessed at.
		if (!contentEncoding) {
			contentEncoding = _.chain(name.split('.'))
				.takeRightWhile(function checkPart(ext) {
					return encodings[ext];
				})
				.map(function encodePart(ext) {
					return encodings[ext];
				})
				.value();
		}

		// If there is a content encoding set then strip off any extensions
		// that are from the encoding processes to get the extension for the
		// "real" content type.
		if (contentEncoding.length > 0 && !contentType) {
			var last = _.chain(name.split('.'))
				.dropRightWhile(function checkPart(ext) {
					return _.contains(contentEncoding, encodings[ext]);
				})
				.last()
				.value();
			contentType = mime.lookup(last);
		}

		// If we still haven't got a content type, then make it our best guess
		// from the file name.
		if (!contentType) {
			contentType = mime.lookup(name);
		}

		var fileOptions = _.assign({ }, awsOptions, {
			Key: prefix + file.relative,
			ContentType: contentType,
			ContentEncoding: contentEncoding.join(',')
		}, file.awsOptions);

		if (file.isStream()) {
			file.contents.pipe(new S3S.WriteStream(s3, fileOptions))
				.once('finish', done)
				.once('error', done);
		} else if (file.isBuffer()) {
			s3.putObject(_.assign(fileOptions, {
				Body: file.contents
			}), done);
		} else {
			done();
		}
	});
};
