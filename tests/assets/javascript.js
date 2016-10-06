'use strict';

var bluebird = require('bluebird');

var assert = require('minos/assert');
var assets = require('minos/assets');
var requests = require('minos/requests');
var urls = require('minos/urls');

describe('JavaScript codebase', function() {

  // Get the URLs for all application JavaScript files from a page
  function getAppJsUrls(pageUrl) {
    return browser.url(pageUrl)
      .getAttribute('script', 'src')
      .then(srcs => srcs.filter(assets.isAppJavaScript));
  }

  // Get the content of all application JavaScript files
  function getJsContent(url) {
    return bluebird.map(getAppJsUrls(url), fileUrl => requests.fetch(fileUrl))
      .then(responses => bluebird.map(responses, response => response.body));
  }

  it('is combined into a few build files', function() {
    var fileCount = getAppJsUrls(urls.home).then(files => files.length);
    return assert.eventually.isBelow(fileCount, 5);
  });

  it('is aggressively minified', function() {
    return getJsContent(urls.home)
      .then(function(contents) {
        contents.forEach(function(content) {
          var lines = content.split('\n');
          var contentDensity = content.length / lines.length;

          assert.isAbove(contentDensity, 2000);
        });
      });
  });

});
