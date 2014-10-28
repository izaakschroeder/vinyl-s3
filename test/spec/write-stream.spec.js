
'use strict';

var _ = require('lodash'),
	Stream = require('stream'),
	createWriteStream = require('write-stream'),
	through2 = require('through2'),
	S3S = require('s3-streams'),
	File = require('vinyl');

describe('#createWriteStream', function() {

	beforeEach(function() {
		this.sandbox = sinon.sandbox.create();
		this.s3 = {
			putObject: this.sandbox.stub()
		};
		this.sandbox.stub(S3S, 'WriteStream');
	});

	afterEach(function() {
		this.sandbox.restore();
	});

	it('should throw a `TypeError` when no S3 instance is provided', function() {
		expect(createWriteStream).to.throw(TypeError);
	});

	it('should throw a `TypeError` when no bucket is provided', function() {
		expect(_.partial(createWriteStream, this.s3)).to.throw(TypeError);
	});

	describe('streaming', function() {

		beforeEach(function() {
			this.sink = new Stream.Writable();
			this.source = new Stream.Readable();
			this.stream = createWriteStream(this.s3, { Bucket: 'my-bucket', Key: 'bar' });
			S3S.WriteStream.returns(this.sink);
			this.sandbox.stub(this.sink, '_write');
			this.sandbox.stub(this.source, '_read');
		});

		it('should work with streamed files', function(done) {
			this.stream.end(new File({ path: '/test', base: '', contents: this.source }));
			process.nextTick(_.bind(function() {
				expect(this.source._read).to.be.called;
				done();
			}, this));
		});

		it('should upload correct data', function() {
			var file = new File({
				path: 'foo/test',
				base: 'foo',
				contents: this.source
			});
			file.contentType = 'app/test';
			this.stream.end(file);
			expect(S3S.WriteStream).to.be.calledWithMatch(this.s3, {
				Bucket: 'my-bucket',
				Key: 'bar/test',
				ContentType: 'app/test'
			});
		});

		it('should correctly pass on streaming upload errors', function(done) {
			this.stream.once('error', function(err) {
				expect(err).to.equal('error');
				done();
			});
			this.stream.end(new File({ path: '/', base: '', contents: through2.obj() }));
			this.sink.emit('error', 'error');
		});
	});

	describe('buffering', function() {

		beforeEach(function() {
			this.stream = createWriteStream(this.s3, { Bucket: 'my-bucket' });
			this.source = new Buffer(100);
		});

		it('should work with buffered files', function() {
			var file = new File({
				path: 'foo/test',
				base: 'foo',
				contents: this.source
			});
			file.contentType = 'app/test';
			this.stream.end(file);
			expect(this.s3.putObject).to.be.calledWithMatch({
				Bucket: 'my-bucket',
				Key: 'test',
				ContentType: 'app/test',
				Body: this.source
			});
		});
	});

	it('should pass through any files it receives', function() {
		var file = new File({ path: '/', base: '', contents: null });
		this.stream = createWriteStream(this.s3, { Bucket: 'my-bucket', Key: 'bar' });
		this.stream.end(file);
		expect(this.stream.read()).to.equal(file);
	});
});
