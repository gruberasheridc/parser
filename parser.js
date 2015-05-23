var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var validator = require('validator');
var fs = require("fs");


var app = express();

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('app listening at http://%s:%s', host, port);

    parseSites();
});

function parseSites() {
    var sites = ['http://www.cnn.com', 'http://www.msn.com', 'https://www.yahoo.com', 'http://espn.go.com', 'http://www.imdb.com'];

    sites.forEach(function(siteURL) {
        request(siteURL, function (error, response, body) {
            if (!error) {
                var $ = cheerio.load(body); // load the page into Cheerio.
                var bodyText = $("body").text();

                // Clear redundant whitespace from the sites text.
                var content = bodyText.replace(/\s+/g, " ").toLowerCase();

                // Collect links from the site.
                var links = $("a"); // get all hyperlinks
                $(links).each(function(i, link) {
                    var url = $(link).attr("href");
                    console.log(url);
                    url = url.replace("/url?q=", "").split("&")[0];
                    console.log(url);
                    console.log(validator.isURL(url));
                    console.log(validator.isURL(siteURL + url));
                });

                console.log(content);
            } else {
                console.log("Error while requesting site: " + siteURL + "." + " Error: " + error);
            }
        });
    });
};