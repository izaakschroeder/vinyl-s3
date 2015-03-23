# vinyl-s3

Use S3 as a source or destination of vinyl files.

![build status](http://img.shields.io/travis/izaakschroeder/vinyl-s3.svg?style=flat)
![coverage](http://img.shields.io/coveralls/izaakschroeder/vinyl-s3.svg?style=flat)
![license](http://img.shields.io/npm/l/vinyl-s3.svg?style=flat)
![version](http://img.shields.io/npm/v/vinyl-s3.svg?style=flat)
![downloads](http://img.shields.io/npm/dm/vinyl-s3.svg?style=flat)

Features:
 * Source with multi-globbing support,
 * Use either streaming or buffering,
 * Upload or download files,
 * Pass custom options to S3,
 * Works great with gulp.

## Usage

```javascript
var gulp = require('gulp'),
	AWS = require('aws-sdk'),
	s3 = require('vinyl-s3');

// Upload files to S3
gulp.task('upload', function() {
	return gulp.src('data/*.jpg', { buffer: false })
		.pipe(s3.dest('s3://my-bucket/prefix'));
});

// Download files from S3
gulp.task('download', function() {
	return s3.src('s3://my-bucket/prefix/*.jpg', { buffer: false })
		.pipe(gulp.dest('data'));
});

// Just print a list of files
gulp.task('meta', function() {
	return s3.src('s3://my-bucket/foo/**/*.jpg', { read: false })
		.pipe(through2.obj(function(file, _, callback) {
			console.log('found:',file.path);
			callback();
		}));
})
```

When working with large files you may find it useful to use streaming mode instead of buffering mode. You can enable this in the `src()` family of functions by setting `{ buffer: false }`. The default mode is to use buffering as is the same with `fs.src`.

### src

See [getObject] for a list of supported options.

```javascript
// Specify custom attributes via S3 URL.
s3.src('s3://bucket/key/*?IfModifiedSince=123456789')
    .pipe(fs.dest('downloads'));
```

```javascript
// Specify custom attributes by passing in an AWS options object.
src.src({
    Bucket: 'bucket',
    Key: 'key/*',
    IfModifiedSince: Date.now()
}).pipe(fs.dest('downloads'));
```

```javascript
// Use multiple source buckets and patterns.
s3.src(['s3://bucket1/*.jpg', 's3://bucket1/*.png', 's3://bucket2/*.gif'])
    .pipe(fs.dest('downloads'));
```

### dest

See [putObject] for a list of supported options. There is limited support for automatically detecting the correct `Content-Type` and correct `Content-Encoding`.

```javascript
// Specify custom attributes via S3 URL.
fs.src('files/*.jpg')
    .pipe(s3.dest('s3://bucket/foo?ContentType=image/jpeg'));
```

```javascript
// Specify custom attributes by passing in an AWS options object.
fs.src('files/*.jpg')
    .pipe(s3.dest({
        Bucket: 'bucket',
        Key: 'foo',
        ContentType: 'image/jpeg'
    }));
```

```javascript
// Specify custom attributes per file.
fs.src('files/*.jpg')
    .pipe(through2.obj(function(file, enc, next) {
        // There are some non-standard properties on the file object that
        // are used to generate certain AWS options.
        file.contentType = 'image/jpeg';
        file.contentEncoding = 'gzip';

        // Setting the awsOptions property on a file causes the object to be
        // included in the command sent to S3. These options override any
        // previously set value.
        file.awsOptions = {
            ACL: 'private',
            CacheControl: 'max-age=1296000',
            ContentType: 'image/jpeg',
            Metadata: {
                color: 'red'
            }
        };
        this.push(file);
        next();
    }))
    .pipe(s3.dest('s3://bucket/foo'));
```

[getObject]: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#getObject-property
[putObject]: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property
