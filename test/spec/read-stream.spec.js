
'use strict';

var Stream = require('stream'),
	S3S = require('s3-streams'),
	createReadStream = require('read-stream');

describe('#createReadStream', function() {

	beforeEach(function() {
		this.sandbox = sinon.sandbox.create();
		this.s3 = {
			getObject: this.sandbox.stub(),
			headObject: this.sandbox.stub()
		};
		this.sandbox.stub(S3S, 'ReadStream');
	});

	afterEach(function() {
		this.sandbox.restore();
	});

	it('should throw a TypeError when no S3 instance is provided', function() {
		expect(createReadStream).to.throw(TypeError);
	});

	describe('buffering', function() {
		it('should buffer by default', function() {
			var object = { Key: 'banana', Bucket: 'apple' },
				stream = new Stream.PassThrough({ objectMode: true });

			stream.pipe(createReadStream(this.s3)).read(0);
			stream.end(object);

			expect(this.s3.getObject).to.be.calledOnce;
		});
	});

	describe('streaming', function() {
		beforeEach(function() {
			this.object = { Key: 'banana', Bucket: 'apple' };
			this.stream = new Stream.PassThrough({ objectMode: true });
			this.source = new Stream.PassThrough({ objectMode: true });
			this.result = this.stream.pipe(createReadStream(this.s3, { }, { buffer: false }));
			S3S.ReadStream.returns(this.source);
		});

		it('should produce files with streams when streaming is enabled', function() {
			this.result.read(0);
			this.stream.end(this.object);
			expect(S3S.ReadStream).to.be.calledOnce;
		});

		it('should pass the correct information through on the stream open event', function() {
			this.result.read(0);
			this.stream.end(this.object);
			this.source.emit('open', { Key: 'foo' });
			expect(this.result.read()).to.include({ Key: 'foo', Body: this.source, Bucket: 'apple' });
		});

		it('should pass through the stream error event', function(done) {
			this.result.read(0);
			this.stream.end(this.object);

			this.result.once('error', function(result) {
				expect(result).to.equal('fail');
				done();
			});

			this.source.emit('error', 'fail');
		});
	});



	it('should produce files with no contents when read is disabled', function() {
		var object = { Key: 'banana', Bucket: 'apple' },
			stream = new Stream.PassThrough({ objectMode: true });

		stream.pipe(createReadStream(this.s3, { }, { read: false })).read(0);
		stream.end(object);

		expect(this.s3.headObject).to.be.calledOnce;
	});


});
