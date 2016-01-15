/**
 * Created by tchasid on 12/28/15.
 */

var request = require('request');
var ITunesSearchResult = require('../models/itunessearchresult');
var AlbumArtItem = require('../models/albumartitem.js');
var iTunesBaseUrl = 'https://itunes.apple.com/search?term=';
var iTunesAdditionalSearchOptions = '&entity=album';

var iTunesSearchService = {
    search: function(searchPattern, searchCallback) {
        if (!searchPattern || searchPattern.length == 0) {
            return searchCallback('Search pattern cannot be undefined');
        }

        searchPattern = searchPattern.toLowerCase();
        searchPattern = searchPattern.replace(' ', '+');

        request(iTunesBaseUrl + searchPattern + iTunesAdditionalSearchOptions, function iTunesRequestCallback(requestError, iTunesResponse) {
            if (requestError) {
                console.log(requestError);
                return searchCallback(requestError);
            }

            var parsedResponse = '';
            var searchResult = new ITunesSearchResult();

            try {
                parsedResponse = JSON.parse(iTunesResponse.body);
                console.log('Found ' + parsedResponse['result count'] + ' search results.');
                for (i = 0; i < parsedResponse.results.length; i++) {
                    var resultItem = parsedResponse.results[i];
                    var resultItemType = resultItem['collectionType'];
                    var artistName = resultItem['artistName'];
                    var albumName = resultItem['collectionName'];
                    var albumUrl = resultItem['artworkUrl100'] || resultItem['artworkUrl60'];
                    if (artistName && albumName && albumUrl && resultItemType == 'Album') {
                        var highestResAlbumArtUrl = albumUrl.replace(/(.+\/)(\d+)x(\d+)(bb\.jpg)/, '$120000x20000$4');
                        searchResult.addAlbumArtItem(new AlbumArtItem(artistName, albumName, highestResAlbumArtUrl));
                    } else {
                        console.log('Search result item does not contain enough fields: ' + JSON.stringify(resultItem));
                    }
                }
                if (searchResult.result.length == 0) {
                    return searchCallback('None of the results have all the required fields for "' + searchPattern + '"')
                }
            }
            catch (parsingError) {
                console.log('Unable to parse the response from iTunes');
                return searchCallback('Unknown result format from iTunes search API');
            };

            return searchCallback(null, searchResult);
        });
    }
};

module.exports = iTunesSearchService;