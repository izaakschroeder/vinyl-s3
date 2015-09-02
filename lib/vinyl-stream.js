
'use strict';

var _ = require('lodash'),
	File = require('vinyl'),
	through2map = require('through2-map');

/**
 * Create a stream which takes S3 objects and converts them to vinyl.
 *
 * @param {Object} options Options.
 * @param {String} options.base Set the vinyl object's base path.
 * @param {String} options.cwd Set the vinyl object's cwd
 * @returns {Stream.Transform} The stream.
 */
module.exports = function createVinylStream(options) {

	options = _.assign({
		meta: true,
		base: '',
		cwd: process.cwd()
	}, options);

	return through2map.obj(function vinylStream(object) {

		var base = options.base || object.Bucket,
			file = new File({
				base: base,
				cwd: options.cwd,
				contents: object.Body,
				stat: {
					mtime: new Date(object.LastModified),
					size: parseInt(object.ContentLength, 10)
				},
				path: base + '/' + object.Key
			});

		// Set the length on things like streams which are used
		// by some frameworks.
		if (!file.isNull() && !file.contents.length) {
			file.contents.length = file.stat.size;
		}

		// Assign AWS metadata to vinyl files
		if (options.meta) {

			// Support for Content-Type
			if (object.ContentType) {
				file.contentType = object.ContentType;
			}

			// Support for E-Tag
			if (object.ETag) {
				file.eTag = object.ETag;
			}
		}

		return file;
	});
};
