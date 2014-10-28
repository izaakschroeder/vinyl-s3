# vinyl-s3

Use S3 as a source or destination of vinyl files.

![build status](http://img.shields.io/travis/izaakschroeder/vinyl-s3.svg?style=flat)
![coverage](http://img.shields.io/coveralls/izaakschroeder/vinyl-s3.svg?style=flat)
![license](http://img.shields.io/npm/l/vinyl-s3.svg?style=flat)
![version](http://img.shields.io/npm/v/vinyl-s3.svg?style=flat)
![downloads](http://img.shields.io/npm/dm/vinyl-s3.svg?style=flat)

Features:
 * Source with globbing support,
 * Use either streaming or buffering,
 * Upload or download files,
 * Works great with gulp.


```javascript
var gulp = require('gulp'),
	AWS = require('aws-sdk'),
	s3 = require('vinyl-s3')(new AWS.S3(), { Bucket: 'myBucket' });

// Upload files to S3
gulp.task('upload', function() {
	return gulp.src('data/*.jpg', { buffer: false })
		.pipe(s3.dest('prefix'));
});

// Download files from S3
gulp.task('download', function() {
	return s3.src('prefix/*.jpg', { buffer: false })
		.pipe(gulp.dest('data'));
});

// Just print a list of files
gulp.task('meta', function() {
	return s3.src('/foo/**/*.jpg', { read: false })
		.pipe(through2.obj(function(file, _, callback) {
			console.log('found:',file.path);
			callback();
		}));
})
```

When working with large files you may find it useful to use streaming mode instead of buffering mode. You can enable this in the `src()` family of functions by setting `{ buffer: false }`. The default mode is to use buffering.
