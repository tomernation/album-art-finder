/**
 * Created by tchasid on 1/3/16.
 */
var assert = require('chai').assert;
var fs = require('fs');
var path = require('path');
var AlbumArtItem = require('../lib/models/albumartitem');
var ImageArchiver = require('../lib/models/imagearchiver');
var nock = require('nock');

describe('Image Archiver Add To Archive Tests', function() {
    it('Should stream image to temp directory', function (done) {
        var albumArtItem = new AlbumArtItem('Fiona Apple', 'Tidal', 'http://is2.mzstatic.com/image/thumb/Music/v4/5f/8e/dc/5f8edccc-4c20-c883-4a1a-3f58585d74d4/source/10000x10000bb.jpg');
        var classUnderTest = new ImageArchiver();
        classUnderTest.addToArchive(albumArtItem, function checkResult(error, filePath) {
            assert.isNull(error);
            assert.isNotNull(filePath);
            fs.exists(filePath, function (exists) {
                assert(exists);
            });
            done();
        });
    });

    it('Should return the same directory', function (done) {
        var classUnderTest = new ImageArchiver();
        var expectedValue = classUnderTest.__tempDirPath = '/a/b/c';
        var actualValue = classUnderTest.tempDirPath;
        assert.equal(expectedValue, actualValue);
        done();
    });

    it('Should create and return the same temp directory', function (done) {
        var classUnderTest = new ImageArchiver();
        var expectedDirPath = classUnderTest.tempDirPath;
        var actualDirPath = classUnderTest.tempDirPath;
        assert.isNotNull(expectedDirPath);
        assert.isNotNull(actualDirPath);
        assert.equal(expectedDirPath, actualDirPath);
        fs.exists(actualDirPath, function (exists) {
            assert(exists);
        });
        done();
    });

    it('Should return download error', function (done) {
        var classUnderTest = new ImageArchiver();
        var iTunesServerIntercept = new nock('http://is2.mzstatic.com')
            .get('/albumart.jpg')
            .reply(404);

        var albumArtItem = new AlbumArtItem('Fiona Apple', 'Tidal', 'http://is2.mzstatic.com/albumart.jpg');
        classUnderTest.addToArchive(albumArtItem, function checkResult(error, filePath) {
            assert.isNotNull(error);
            assert.equal('Unable to download image ' + albumArtItem.albumArtUrl, error);
            assert.isUndefined(filePath);
            done();
        });
    });
});

describe('Image Archiver Archive Tests', function() {
    it('Should return an archive error', function(done) {
        var classUnderTest = new ImageArchiver();
        classUnderTest.finalize(function checkResult(error, archiveFilePath) {
            assert.isNotNull(error);
            assert.equal('No images were added to the temp directory', error);
            assert.isUndefined(archiveFilePath);
            done();
        });
    });

    it('Should return an archive error 2', function(done) {
        var classUnderTest = new ImageArchiver();
        classUnderTest.__tempDirPath = 'blahblah';
        classUnderTest.finalize(function checkResult(error, archiveFilePath) {
            assert.isNotNull(error);
            assert.isUndefined(archiveFilePath);
            done();
        });
    });

    it('Should stream image to temp directory and download the archive', function(done) {
        var iTunesServerIntercept = new nock('http://is2.mzstatic.com')
            .get('/albumart.jpg')
            .reply(200, function (uri, callback) {
                return fs.createReadStream(path.join(__dirname, 'albumart.jpg'));
            });

        var albumArtItem = new AlbumArtItem('Fiona Apple', 'Tidal', 'http://is2.mzstatic.com/albumart.jpg');
        var classUnderTest = new ImageArchiver();
        classUnderTest.addToArchive(albumArtItem, function checkResult(error, filePath) {
            assert.isNull(error);
            assert.isNotNull(filePath);
            fs.exists(filePath, function(exists) {
                assert(exists);
            });

            classUnderTest.finalize(function checkResult(error, archiveFilePath) {
                assert.isNull(error);
                assert.isNotNull(filePath);
                fs.exists(archiveFilePath, function(exists) {
                    assert(exists);
                });
            });

            done();
        });
    });
});