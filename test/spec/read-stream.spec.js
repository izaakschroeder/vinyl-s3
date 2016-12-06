
'use strict';

var through2 = require('through2'),
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

	it('should throw `TypeError` when no S3 instance provided', function() {
		expect(function() {
			createReadStream({ s3: null });
		}).to.throw(TypeError);
	});

	it('should throw `TypeError` when bad S3 instance provided', function() {
		expect(function() {
			createReadStream({ s3: { } });
		}).to.throw(TypeError);
	});

	describe('errors', function() {
		beforeEach(function() {
			this.source = through2.obj();
			this.stream = createReadStream({
				s3: this.s3,
				buffer: true,
				read: true
			});
			this.source.pipe(this.stream);
		});
		it('should skip `304` when `IfNoneMatch`', function() {
			this.s3.getObject.callsArgWith(1, { code: 304 });
			this.source.end({ Key: 'banana', Bucket: 'apple' });
			this.stream.read(0);
		});
		it('should skip `304` when `IfModifiedSince`', function() {
			this.s3.getObject.callsArgWith(1, { code: 304 });
			this.source.end({ Key: 'banana', Bucket: 'apple' });
			this.stream.read(0);
		});
		it('should skip `412` when `IfMatch`', function() {
			this.s3.getObject.callsArgWith(1, { code: 412 });
			this.source.end({ Key: 'banana', Bucket: 'apple' });
			this.stream.read(0);
		});
		it('should skip `412` when `IfUnmodifiedSince`', function() {
			this.s3.getObject.callsArgWith(1, { code: 412 });
			this.source.end({ Key: 'banana', Bucket: 'apple' });
			this.stream.read(0);
		});
	});

	describe('buffering', function() {
		it('should buffer by default', function() {
			var object = { Key: 'banana', Bucket: 'apple' },
				stream = through2.obj();

			stream.pipe(createReadStream({ s3: this.s3 })).read(0);
			stream.end(object);

			expect(this.s3.getObject).to.be.calledOnce;
		});
	});

	describe('streaming', function() {
		beforeEach(function() {
			this.object = { Key: 'banana', Bucket: 'apple' };
			this.stream = through2.obj();
			this.source = through2.obj();
			this.result = this.stream.pipe(createReadStream({
				s3: this.s3,
				buffer: false
			}));
			S3S.ReadStream.returns(this.source);
		});

		it('should produce files with streams', function() {
			this.result.read(0);
			this.stream.end(this.object);
			expect(S3S.ReadStream).to.be.calledOnce;
		});

		it('should pass correct information through open event', function() {
			this.result.read(0);
			this.stream.end(this.object);
			this.source.emit('open', { Key: 'foo' });
			expect(this.result.read()).to.include({
				Key: 'foo',
				Body: this.source,
				Bucket: 'apple'
			});
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



	it('should produce files without content when read disabled', function() {
		var object = { Key: 'banana', Bucket: 'apple' },
			stream = through2.obj();

		stream.pipe(createReadStream({ s3: this.s3, read: false })).read(0);
		stream.end(object);

		expect(this.s3.headObject).to.be.calledOnce;
	});

	it('should not make additional S3 calls when meta disabled', function() {
		var object = { Key: 'banana', Bucket: 'apple' },
			stream = through2.obj();

		stream.pipe(createReadStream({
			s3: this.s3,
			read: false,
			meta: false
		})).read(0);
		stream.end(object);

		expect(this.s3.headObject).not.to.be.called;
	});


});
