'use strict';

var bluebird = require('bluebird');
var request = require('request');

var assert = require('minos/assert');
var urls = require('minos').urls;

var getUrl = bluebird.promisify(request);

describe('JavaScript codebase', function() {

  // Check if a JavaScript URL is for the application
  function isAppFile(url) {
    return url !== '' && !/google-analytics/.test(url);
  }

  // Get the URLs for all application JavaScript files from a page
  function getAppJsUrls(pageUrl) {
    return browser.url(pageUrl)
      .then(() => browser.getAttribute('script', 'src'))
      .then(srcs => srcs.filter(isAppFile));
  }

  it('is combined into a few build files', function() {
    var fileCount = getAppJsUrls(urls.home).then(files => files.length);
    return assert.eventually.isBelow(fileCount, 5);
  });

  it('is aggressively minified', function() {
    var files = getAppJsUrls(urls.home);

    return bluebird.map(files, file => getUrl(file))
      .then(responses => bluebird.map(responses, response => response.body))
      .then(function(contents) {
        contents.forEach(function(content) {
          var lines = content.split('\n');
          var contentDensity = content.length / lines.length;

          assert.isAbove(contentDensity, 2000);
        });
      });
  });

});
