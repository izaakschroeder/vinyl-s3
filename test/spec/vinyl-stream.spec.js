
'use strict';

var createVinylStream = require('vinyl-stream'),
	Stream = require('stream');

describe('#createVinylStream', function() {

	it('should map `Body` to `contents`', function() {
		var stream = createVinylStream(), body = new Buffer(24);
		stream.write({ Bucket: 'foo', Key: 'key', Body: body });
		expect(stream.read()).to.include({ contents: body });
	});

	it('should prefer `base` value provided in options', function() {
		var stream = createVinylStream({ base: 'bar' }), body = new Buffer(24);
		stream.write({ Bucket: 'foo', Key: 'key', Body: body });
		expect(stream.read()).to.include({ base: 'bar' });
	});

	it('should prefer `cwd` value provided in options', function() {
		var stream = createVinylStream({ cwd: 'test' }), body = new Buffer(24);
		stream.write({ Bucket: 'test', Key: 'key', Body: body });
		expect(stream.read()).to.include({ cwd: 'test' });
	});

	it('should correctly map `Bucket` -> `base`', function() {
		var stream = createVinylStream(), body = new Buffer(24);
		stream.write({ Bucket: 'test', Key: 'key', Body: body });
		expect(stream.read()).to.include({ base: 'test' });
	});

	it('should correctly map `LastModified` -> `fs.Stat` object', function() {
		var stream = createVinylStream(), date = new Date(), body = new Buffer(24);
		stream.write({ LastModified: date, Key: 'key', Body: body });
		expect(stream.read().stat.mtime.toString()).to.equal(date.toString());
	});

	it('should collect metadata when meta is enabled', function() {
		var stream = createVinylStream({ meta: true }), body = new Buffer(24);
		stream.write({ ContentType: 'foo/bar', Key: 'key', Body: body });
		expect(stream.read()).to.include({ contentType: 'foo/bar' });
	});

	it('should omit metadata when meta is disabled', function() {
		var stream = createVinylStream({ meta: false }), body = new Buffer(24);
		stream.write({ ContentType: 'foo/bar', Key: 'key', Body: body });
		expect(stream.read()).to.not.include({ contentType: 'foo/bar' });
	});

	it('should add the length to contents when needed', function() {
		var stream = createVinylStream({ meta: false }), body = new Stream.Readable();
		stream.write({ ContentType: 'foo/bar', Key: 'key', Body: body, ContentLength: '20' });
		expect(stream.read().contents).to.have.property('length', 20);
	});
});
