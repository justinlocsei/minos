'use strict';

var bluebird = require('bluebird');

var assert = require('minos/assert');
var requests = require('minos/requests');
var urls = require('minos/urls');

describe('CSS codebase', function() {

  // Get the URLs of all CSS files available at the given URL
  function getCssUrls(sourceUrl) {
    return browser.url(sourceUrl).getAttribute('link[rel="stylesheet"]', 'href');
  }

  // Get the content of all CSS files as a promise
  function getCssContent(url) {
    return bluebird.map(getCssUrls(url), fileUrl => requests.fetch(fileUrl))
      .then(responses => bluebird.map(responses, response => response.body));
  }

  it('is combined into a few build files', function() {
    var fileCount = getCssUrls(urls.home).then(files => files.length);
    return assert.eventually.isBelow(fileCount, 5);
  });

  it('is aggressively minified', function() {
    return getCssContent(urls.home).then(function(contents) {
      contents.forEach(function(content) {
        var lines = content.split('\n');
        var contentDensity = content.length / lines.length;

        assert.isAbove(contentDensity, 2000);
      });
    });
  });

  it('lacks comments', function() {
    return getCssContent(urls.home).then(function(contents) {
      contents.forEach(function(content) {
        assert.notInclude(content, '/*');
      });
    });
  });

  it('lacks sourcemaps', function() {
    return getCssContent(urls.home).then(function(contents) {
      contents.forEach(function(content) {
        assert.notInclude(content, 'sourceMappingURL');
      });
    });
  });

  it('contains media queries', function() {
    return getCssContent(urls.home).then(function(contents) {
      contents.forEach(function(content) {
        assert.include(content, '@media screen');
      });
    });
  });

  it('adds vendor prefixes for experimental properties', function() {
    return getCssContent(urls.home).then(function(contents) {
      contents.forEach(function(content) {
        if (content.indexOf('display:flex') !== -1) {
          assert.include(content, '-webkit-flex');
          assert.include(content, '-ms-flexbox');
        }
      });
    });
  });

  it('does not add prefixes for stable properties', function() {
    return getCssContent(urls.home).then(function(contents) {
      contents.forEach(function(content) {
        assert.notInclude(content, '-moz-opacity');
        assert.notInclude(content, '-ms-filter');
      });
    });
  });

});
