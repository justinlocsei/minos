'use strict';

var bluebird = require('bluebird');

var assert = require('minos/assert');
var assets = require('minos/assets');
var requests = require('minos/requests');
var urls = require('minos/urls');

describe('JavaScript codebase', function() {

  // Get the URLs for all application JavaScript files from a page
  function getAppJavaScriptUrls(pageUrl) {
    return browser.url(pageUrl)
      .getAttribute('script', 'src')
      .then(srcs => srcs.filter(assets.isAppJavaScript));
  }

  // Get the content of all application JavaScript files and pass them to a processor
  function getJavaScriptContent(url, processor) {
    return bluebird.map(getAppJavaScriptUrls(url), fileUrl => requests.fetch(fileUrl))
      .then(responses => bluebird.map(responses, response => response.body))
      .then(function(contents) {
        return contents.forEach(function(content) {
          processor(content);
        });
      });
  }

  it('is combined into a few build files', function() {
    var fileCount = getAppJavaScriptUrls(urls.home).then(files => files.length);
    return assert.eventually.isBelow(fileCount, 5, 'too many files');
  });

  it('is aggressively minified', function() {
    return getJavaScriptContent(urls.home, function(content) {
      var lines = content.split('\n');
      var contentDensity = content.length / lines.length;

      assert.isAbove(contentDensity, 2000, 'low content/whitespace ratio found');
    });
  });

  it('lacks comments', function() {
    return getJavaScriptContent(urls.home, function(content) {
      assert.notInclude(content, '/**');
    });
  });

  it('lacks sourcemaps', function() {
    return getJavaScriptContent(urls.home, function(content) {
      assert.notInclude(content, 'sourceMappingURL');
    });
  });

});
