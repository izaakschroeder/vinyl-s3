
'use strict';

var _ = require('lodash'),
	through2 = require('through2'),
	S3S = require('s3-streams');

/**
 * Create a stream which can be piped vinyl files that get uploaded to S3.
 * Once the files have finished being uploaded, they will be re-emitted so
 * that other streams can re-use them later in the pipeline.
 *
 * @param {AWS.S3} s3 S3 instance.
 * @param {Object} awsOptions Settings for AWS.
 * @param {String} awsOptions.Bucket Destination bucket to write files to.
 * @param {String} awsOptions.Key Prefix for all files.
 * @returns {Stream.Transform} Stream.
 */
module.exports = function createWriteStream(s3, awsOptions) {

	if (!s3 || !_.isFunction(s3.putObject)) {
		throw new TypeError();
	}

	if (!_.has(awsOptions, 'Bucket')) {
		throw new TypeError();
	}

	return through2.obj(function writeStream(file, encoding, callback) {

		function done(err) {
			callback(err, file);
		}

		var fileOptions = _.assign({ }, awsOptions, {
			Key: (awsOptions.Key ? awsOptions.Key + '/' : '') + file.path.substr(file.base.length + 1),
			ContentType: file.contentType || 'application/octet-stream'
		});

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
