/**
 * Created by tchasid on 1/1/16.
 */

var AlbumArtItem = require('./albumartitem');

var iTunesSearchResult = function() {
    this.result = [];
};

iTunesSearchResult.prototype.addAlbumArtItem = function(albumArtItem) {
    if (albumArtItem instanceof AlbumArtItem) {
        this.result.push(albumArtItem);
    }
};

module.exports = iTunesSearchResult;
