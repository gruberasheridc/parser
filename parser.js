var express = require('express');
var request = require('request');
var fs = require("fs");

var app = express();

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('app listening at http://%s:%s', host, port);

    parseSites();
});

function parseSites() {
    var sites = ['http://www.cnn.com', 'http://www.ynet.co.il', 'http://www.idc.ac.il', 'http://www.haaretz.co.il'];

    sites.forEach(function(siteURL) {
        request(siteURL, function (error, response, body) {
            console.log(body);
        });
    });
}