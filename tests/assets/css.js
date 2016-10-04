'use strict';

var bluebird = require('bluebird');
var request = require('request');

var assert = require('minos/assert');
var urls = require('minos/urls');

var getUrl = bluebird.promisify(request);

describe('CSS codebase', function() {

  // Get the URLs of all CSS files available at the given URL
  function getCssUrls(sourceUrl) {
    return browser.url(sourceUrl)
      .then(() => browser.getAttribute('link[rel="stylesheet"]', 'href'));
  }

  // Get the content of all CSS files as a promise
  function getCssContent(fileUrls) {
    return bluebird.map(fileUrls, fileUrl => getUrl(fileUrl))
      .then(responses => bluebird.map(responses, response => response.body));
  }

  it('is combined into a few build files', function() {
    var fileCount = getCssUrls(urls.home).then(files => files.length);
    return assert.eventually.isBelow(fileCount, 5);
  });

  it('is aggressively minified', function() {
    var files = getCssUrls(urls.home);

    return getCssContent(files).then(function(contents) {
      contents.forEach(function(content) {
        var lines = content.split('\n');
        var contentDensity = content.length / lines.length;

        assert.isAbove(contentDensity, 2000);
      });
    });
  });

  it('contains media queries', function() {
    var files = getCssUrls(urls.home);

    return getCssContent(files).then(function(contents) {
      contents.forEach(function(content) {
        assert.include(content, '@media screen');
      });
    });
  });

  it('adds vendor prefixes for experimental properties', function() {
    var files = getCssUrls(urls.home);

    return getCssContent(files).then(function(contents) {
      contents.forEach(function(content) {
        if (content.indexOf('display:flex') !== -1) {
          assert.include(content, '-webkit-flex');
          assert.include(content, '-ms-flexbox');
        }
      });
    });
  });

  it('does not add prefixes for stable properties', function() {
    var files = getCssUrls(urls.home);

    return getCssContent(files).then(function(contents) {
      contents.forEach(function(content) {
        assert.notInclude(content, '-moz-opacity');
        assert.notInclude(content, '-ms-filter');
      });
    });
  });

});
