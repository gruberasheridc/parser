var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var validator = require('validator');
var fs = require("fs");
var md5 = require("crypto-js/md5");


var app = express();

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('app listening at http://%s:%s', host, port);

    parseSites();
});

function parseSites() {
    var sites = ['http://www.cnn.com', 'http://www.nytimes.com', 'http://www.iht.com', 'http://espn.go.com', 'http://recode.net'];

    sites.forEach(function(siteURL) {
        request(siteURL, function (error, response, body) {
            if (!error) {
                var $ = cheerio.load(body); // load the page into Cheerio.
                $('STYLE').remove(); // Remove style information. We want only presentable words.
                $('SCRIPT').remove(); // Remove javascripts information. We want only presentable words.
                var bodyText = $("body").text();

                // Clear redundant whitespace from the sites text and move all words to lower case.
                var content = bodyText.replace(/\s+/g, " ").toLowerCase();

                // Collect links from the site.
                var urls = [];
                var links = $("a"); // get all hyperlinks
                $(links).each(function(i, link) {
                    var url = $(link).attr("href");
                    if (validator.isURL(url)) {
                        // We collect only valid URLs in order to avoid self references and malformed URLs.
                        urls.push(url);
                    }
                });

                writeSiteInfoToLog(siteURL, content, urls);
            } else {
                console.log("Error while requesting site: " + siteURL + "." + " Error: " + error);
            }
        });
    });
};

function writeSiteInfoToLog(siteURL, words, urls) {
    const fileDirectory = './output/';
    var fileName = md5(siteURL);

    var file = fs.createWriteStream(fileDirectory + fileName + '.txt');
    file.on('error', function(err) {
        console.log("Failed to write the output file for site " + siteURL + "." + "Error: " + err + ".");
        file.close();
    });

    file.once('open', function(fd) {
        // Write lines to the file with the site name as the first word.
        file.write(siteURL +  " " + words + '\n'); // Write the words that were extracted from the site.

        // Write the URLs extracted from the site.
        urls.forEach(function(url) {
            file.write(siteURL +  " " + url + '\n');
        });

        file.end();
    });
}