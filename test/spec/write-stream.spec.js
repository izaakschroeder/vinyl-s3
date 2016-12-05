
'use strict';

var _ = require('lodash'),
	Stream = require('stream'),
	createWriteStream = require('write-stream'),
	through2 = require('through2'),
	File = require('vinyl');

describe('#createWriteStream', function() {

	beforeEach(function() {
		this.sandbox = sinon.sandbox.create();
		this.s3 = {
			putObject: this.sandbox.stub(),
			upload: this.sandbox.stub()
		};
	});

	afterEach(function() {
		this.sandbox.restore();
	});

	it('should throw `TypeError` when no S3 instance provided', function() {
		expect(_.partial(createWriteStream, { }, { s3: null })).to.throw(TypeError);
	});

	it('should throw `TypeError` when bad S3 instance provided', function() {
		expect(_.partial(createWriteStream, { }, { s3: { } })).to.throw(TypeError);
	});

	it('should throw a `TypeError` when no bucket is provided', function() {
		expect(_.partial(createWriteStream, { }, { s3: this.s3 })).to.throw(TypeError);
	});

	describe('streaming', function() {

		beforeEach(function() {
			this.source = new Stream.Readable();
			this.stream = createWriteStream('s3://foo/bar', { s3: this.s3 });
			this.sandbox.stub(this.source, '_read');
		});

		it('should upload correct data', function() {
			var file = new File({
				path: 'foo/test',
				base: 'foo',
				contents: this.source
			});
			file.contentType = 'app/test';
			this.stream.end(file);
			expect(this.s3.upload).to.be.calledWithMatch({
				Bucket: 'foo',
				Body: this.source,
				Key: 'bar/test',
				ContentType: 'app/test'
			});
		});

		it('should correctly pass on streaming upload errors', function(done) {
			this.s3.upload.callsArgWith(2, 'error');
			this.stream.once('error', function(err) {
				expect(err).to.equal('error');
				done();
			});
			this.stream.end(new File({
				path: '/',
				base: '',
				contents: through2.obj()
			}));
		});
	});

	describe('buffering', function() {

		beforeEach(function() {
			this.stream = createWriteStream('s3://foo', { s3: this.s3 });
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
			expect(this.s3.upload).to.be.calledWithMatch({
				Bucket: 'foo',
				Key: 'test',
				ContentType: 'app/test',
				Body: this.source
			});
		});
	});

	it('should pass through any files it receives', function() {
		var file = new File({ path: '/', base: '', contents: null });
		this.stream = createWriteStream('s3://foo/bar', { s3: this.s3 });
		this.stream.end(file);
		expect(this.stream.read()).to.equal(file);
	});

	it('should respect explicitly set content encoding', function() {
		var file = new File({
			path: 'foo.css',
			base: '',
			contents: new Buffer(100)
		});
		var stream = createWriteStream('s3://foo/bar', { s3: this.s3 });
		file.contentEncoding = [ 'gzip' ];
		stream.end(file);
		expect(this.s3.upload).to.be.calledWithMatch({
			ContentType: 'text/css',
			ContentEncoding: 'gzip'
		});
	});

	it('should not set content encoding if not present', function() {
		var file = new File({
			path: 'foo.css',
			base: '',
			contents: new Buffer(100)
		});
		var stream = createWriteStream('s3://foo/bar', { s3: this.s3 });
		stream.end(file);
		expect(this.s3.upload).not.to.be.calledWithMatch({
			ContentEncoding: ''
		});
	});

	it('should respect explicitly set content type', function() {
		var file = new File({
			path: 'foo.css',
			base: '',
			contents: new Buffer(100)
		});
		var stream = createWriteStream('s3://foo/bar', { s3: this.s3 });
		file.contentType = 'application/x-css';
		stream.end(file);
		expect(this.s3.upload).to.be.calledWithMatch({
			ContentType: 'application/x-css'
		});
	});

	it('should detect correct content encoding', function() {
		var file = new File({
			path: 'foo.css.gz',
			base: '',
			contents: new Buffer(100)
		});
		var stream = createWriteStream('s3://foo/bar', { s3: this.s3 });
		stream.end(file);
		expect(this.s3.upload).to.be.calledWithMatch({
			ContentType: 'text/css',
			ContentEncoding: 'gzip'
		});
	});
});
