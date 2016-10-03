'use strict';

var bluebird = require('bluebird');
var request = require('request');

var assert = require('minos/assert');
var urls = require('minos').urls;

var getUrl = bluebird.promisify(request);

describe('asset optimization', function() {

  // Ensure that all assets URLs are served as optimized files
  //
  // This checks that the assets are served securely over a CDN, and that they
  // have an aggresive expires header set.
  function checkOptimized(files) {
    var checks = files.reduce(function(previous, file) {
      var maxAge = getUrl(file).then(function(response) {
        var match = response.headers['cache-control'].match(/max-age=(\d+)/);
        return parseInt(match[1], 10);
      });

      previous.push(assert.eventually.match(bluebird.resolve(file), /https:\/\/[^.]+\.kxcdn\.com/));
      previous.push(assert.eventually.isAbove(maxAge, 60 * 60 * 24 * 30));

      return previous;
    }, []);

    return bluebird.all(checks);
  }

  it('is used for CSS files', function() {
    var files = browser
      .url(urls.home)
      .elements('link[rel="stylesheet"]')
      .getAttribute('href');

    return checkOptimized(files);
  });

  it('is used for JavaScript files', function() {
    var files = browser
      .url(urls.home)
      .elements('script')
      .getAttribute('src')
      .filter(src => src !== '' && !/google-analytics/.test(src));

    return checkOptimized(files);
  });

  it('is used for page images', function() {
    var files = browser
      .url(urls.home)
      .elements('img')
      .getAttribute('src');

    return checkOptimized(files);
  });

  it('is used for CSS background images', function() {
    var files = browser
      .url(urls.home)
      .elements('div')
      .getAttribute('style')
      .filter(style => style && style !== '')
      .map(function(style) {
        var match = style.match(/url\(([^\)]+)\)/);
        return match[1];
      });

    return checkOptimized(files);
  });

});
