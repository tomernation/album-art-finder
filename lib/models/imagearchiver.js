/**
 * Created by tchasid on 1/3/16.
 */
var fs = require('fs');
var archiver = require('archiver');
var temp = require('temp')
var http = require('http');
var path = require('path');

// Service object that downloads and archives images into a single temporary file.
var ImageArchiver = function () {
    var self = this;
    // Singleton-like object that creates a temporary directory to store images.
    this.__tempDirPath;
    this.__defineGetter__('tempDirPath', function() {
        if (!self.__tempDirPath) {
            self.__tempDirPath = temp.mkdirSync('albumartfinder');
        }
        return self.__tempDirPath;
    });

    // Asynchronous function that downloads album art image into the temporary directory.
    this.addToArchive = function (albumArtItem, addToArchiveCallback) {
        if (!albumArtItem) {
            return addToArchiveCallback('[albumArtItem] argument cannot be undefined/null');
        }

        // Check the temporary dir path lazy initialization.
        if (!self.tempDirPath) {
            return addToArchiveCallback('Unable to create a temporary directory.');
        }

        // Compose the filename and temporary path for the downloaded image, preserving the file extension.
        var imageExt = path.extname(albumArtItem.albumArtUrl);
        var tempFilePath = path.join(self.tempDirPath,
            albumArtItem.artistName.replace(' ', '_') + '_' + albumArtItem.albumName.replace(' ', '_') + imageExt);

        // Create the file stream to write image data to.
        var tempFileStream = fs.createWriteStream(tempFilePath);

        // Define the download.
        http.get(albumArtItem.albumArtUrl, function ImageDownloadCallback(response) {
            console.log('Downloading ' + albumArtItem.albumArtUrl + ' --> ' + tempFilePath)

            response
                .on('data', function ImageFileWriteCallback(imageBuffer) {
                    // Append downloaded image data as it arrives.
                    tempFileStream.write(imageBuffer);
                })
                .on('end', function ImageFileWriteEndCallback() {
                    // Close the file stream.
                    tempFileStream.end();

                    // Handle all http errors.
                    if (response.statusCode != 200) {
                        console.log('Unable to download image ' + albumArtItem.albumArtUrl);
                        return addToArchiveCallback('Unable to download image ' + albumArtItem.albumArtUrl);
                    }

                    console.log('Done');
                    return addToArchiveCallback(null, tempFilePath);
                })
                .on('error', function ImageDownloadErrorCallback() {
                    // Handle additional error.
                    console.log('Unable to download image ' + albumArtItem.albumArtUrl);
                    return addToArchiveCallback('Unable to download image ' + albumArtItem.albumArtUrl);
                });
        });
    }

    // Asynchronous function to archive the downloaded items.
    this.finalize = function (finalizeCallback) {
        // Make sure the source directory exists, is accessible has items.
        fs.readdir(self.tempDirPath, function (error, files) {
            if (error) {
                return finalizeCallback(error);
            }

            if (files.length == 0) {
                return finalizeCallback('No images were added to the temp directory');
            }

            // Create the archive as a temporary file.
            temp.open({prefix: 'albumart', suffix: '.zip'}, function (error, tempFileInfo) {
                if (error) {
                    return finalizeCallback('Unable to create temporary archive');
                }

                // Intantiate the archiving object.
                var archive = archiver('zip');
                archive
                    .on('error', function (error) {
                        // Handle any error occurring during the archiving process.
                        console.log(error);
                        return finalizeCallback('There was an error in archiving the folder: ' + error);
                    })
                    .on('end', function (data) {
                        // Display the results of the archiving process.
                        console.log('Wrote %d file(s) (%d bytes) to archive', archive._entries.length, archive.pointer());
                        return finalizeCallback(null, tempFileInfo.path);
                    });

                // Create the file stream the to pipe the archived data to.
                var tempFileStream = fs.createWriteStream(tempFileInfo.path);
                archive.pipe(tempFileStream);

                // Initiate the directory archiving service.
                archive.directory(self.tempDirPath, 'albumart');

                // Close up shop.
                archive.finalize();
            });
        });
    }
};

module.exports = ImageArchiver;