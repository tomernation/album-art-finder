/**
 * Created by tchasid on 12/28/15.
 */
var assert = require('chai').assert;
var ModelUnderTest = require('../lib/models/itunessearchresult');
var AlbumArtItem = require('../lib/models/albumartitem');

describe('iTunes Search Results', function() {
    it('Should not add a non compliant _path', function(done) {
        var modelUnderTest = new ModelUnderTest();
        var invalidItem = '';
        modelUnderTest.addAlbumArtItem(invalidItem);
        assert.equal(modelUnderTest.result.length, 0);
        done();
    });

    it('Should add one item', function (done) {
        var modelUnderTest = new ModelUnderTest();
        var validItem = new AlbumArtItem('Fiona Apple', 'Tidal', 'http://is2.mzstatic.com/image/thumb/Music/v4/5f/8e/dc/5f8edccc-4c20-c883-4a1a-3f58585d74d4/source/10000x10000bb.jpg');
        modelUnderTest.addAlbumArtItem(validItem);
        assert.equal(modelUnderTest.result.length, 1);
        done();
    });
});


var serviceUnderTest = require('../lib/services/itunessearchservice');
var nock = require('nock');

describe('iTunes API Data Processing', function() {
    it('Should return error for undefined case 1', function(done) {
        serviceUnderTest.search(null, function checkResult(actualError, actualResult) {
            var expectedError = 'Search pattern cannot be undefined';
            assert.isNotNull(actualError);
            assert.equal(expectedError, actualError);
            assert.isUndefined(actualResult);
            done();
        });
    });

    it('Should return error for undefined case 2', function(done) {
        serviceUnderTest.search('', function checkResult(actualError, actualResult) {
            var expectedError = 'Search pattern cannot be undefined';
            assert.isNotNull(actualError);
            assert.equal(expectedError, actualError);
            assert.isUndefined(actualResult);
            done();
        });
    });

    it('Should return error for unknown result format', function(done) {
        var iTunesServerIntercept = new nock('https://itunes.apple.com')
            .get('/search?term=fiona+apple&entity=album')
            .reply(200, 'malformed json');

        serviceUnderTest.search('fiona+apple', function checkResult(actualError, actualResult) {
            var expectedError = 'Unknown result format from iTunes search API';
            assert.isNotNull(actualError);
            assert.equal(expectedError, actualError);
            assert.isUndefined(actualResult);
            done();
        });
    });

    ['fiona apple', 'Fiona Apple', 'fiona+apple'].forEach(function(searchPattern) {
        it('Should return a search result with 1 entry given "' + searchPattern + '"', function(done) {
            var iTunesServerIntercept = new nock('https://itunes.apple.com')
                .get('/search?term=fiona+apple&entity=album')
               .reply(200, '{ "result count": 1, "results": [ { "artistName": "Fiona Apple", "collectionName": "Tidal", "collectionType": "Album", "artworkUrl100": "https://someurl" } ] }');

            serviceUnderTest.search(searchPattern, function checkResult(actualError, actualResult) {
                assert.isNull(actualError);
                assert.isNotNull(actualResult);
                assert.equal(actualResult.result.length, 1);
                assert.equal(actualResult.result[0]['artistName'], 'Fiona Apple');
                done();
            });
        });
    });

    it('Should return an error that no result have all the required fields', function(done) {
        var iTunesServerIntercept = new nock('https://itunes.apple.com')
            .get('/search?term=fiona+apple&entity=album')
            .reply(200, '{ "result count": 1, "results": [ { "artistName": "Fiona Apple" } ] }');

        serviceUnderTest.search('fiona apple', function checkResult(actualError, actualResult) {
            var expectedError = 'None of the results have all the required fields for "fiona+apple"';
            assert.isNotNull(actualError);
            assert.isUndefined(actualResult);
            assert.equal(expectedError, actualError);
            done();
        });
    });

    it('Should return a search result with 1 entry with the default image url transformation', function(done) {
        var iTunesServerIntercept = new nock('https://itunes.apple.com')
            .get('/search?term=fiona+apple&entity=album')
            .reply(200, '{ "result count": 1, "results": [ { "artistName": "Fiona Apple", "collectionName": "Tidal", "collectionType": "Album", "artworkUrl100": "https://someurl/100x100bb.jpg" } ] }');

        serviceUnderTest.search('fiona apple', function checkResult(actualError, actualResult) {
            assert.isNull(actualError);
            assert.isNotNull(actualResult);
            assert.equal(actualResult.result.length, 1);
            assert.equal(actualResult.result[0]['albumArtUrl'], 'https://someurl/20000x20000bb.jpg');
            done();
        });
    });
});