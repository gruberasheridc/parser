/*
    The parser works as a command line utility that scraps the given list of websites and outputs log files.
    The log files are written in a format that is ready for the Hadoop Map Reduce Inverted Index job.
    The log format is as follows:
        1. The log contains lines with words delimited by space.
        2. The first word of each line is the web site that is associated with the file (owner site).
        3. All the other words in the line are words collected from the owner site.

    Execution format: node parser.js -o OUTPUT_FOLDER -i INPUT_SITE_FILE_PATH
    Example: node parser.js -o /output/ -i /input/sites.txt
    The -o parameter is used for specifying the output folder.
    The -i parameter is used for specifying the site list input file path.
    The sites list input file should contain a list of URLs delimited by comma (e.g. http://espn.go.com,http://recode.net).
 */

var request = require('request');
var cheerio = require('cheerio');
var validator = require('validator');
var fs = require("fs");
var md5 = require("crypto-js/md5");
var argv = require('minimist')(process.argv.slice(2));

var siteListPath = argv["i"];
var outputFolderPath = argv["o"];
if (!siteListPath || !outputFolderPath) {
    console.log("Input params must include: -o OUTPUT_FOLDER -i INPUT_SITE_FILE_PATH");
    return;
}

// Parse the give sites and output to the given folder sites.
parseSites(siteListPath, outputFolderPath);

function parseSites(sitesPath, outputFolderPath) {
    fs.readFile(sitesPath, function (err, data) {
        if (err) {
            console.log(err);
            return;
        }

        // Parse the sites list.
        var sites = data.toString();
        sites = sites.replace(/\s+/g, ""); // Clear redundant whitespace from the sites text.
        sites = sites.trim().split(",");
        sites.forEach(function(siteURL) {
            request(siteURL, function (error, response, body) {
                if (!error) {
                    var $ = cheerio.load(body); // load the page into Cheerio.
                    $('STYLE').remove(); // Remove style information. We want only presentable words.
                    $('SCRIPT').remove(); // Remove javascripts information. We want only presentable words.
                    var bodyText = $("body").text();
                    var content = bodyText.toLowerCase(); // move all letters to lower case for matching.
                    content = content.replace(/\s+/g, " "); // Clear redundant whitespace from the sites text.

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

                    writeSiteInfoToLog(siteURL, content, urls, outputFolderPath);
                } else {
                    console.log("Error while requesting site: " + siteURL + "." + " Error: " + error);
                }
            });
        });
    });
};

function writeSiteInfoToLog(siteURL, words, urls, outputFolderPath) {
    var fileName = md5(siteURL);

    var file = fs.createWriteStream(outputFolderPath + "/" + fileName + '.txt');
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