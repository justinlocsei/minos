'use strict';

var bluebird = require('bluebird');
var lodash = require('lodash');

var assert = require('minos/assert');
var assets = require('minos/assets');
var config = require('minos/config');
var requests = require('minos/requests');
var urls = require('minos/urls');

describe('asset optimization', function() {

  // Ensure that all assets URLs are served as optimized files
  //
  // This checks that the assets are served securely over a CDN, and that they
  // have an aggresive expires header set.
  function checkOptimized(files) {
    var checks = files.reduce(function(previous, file) {
      var maxAge = requests.fetch(file).then(function(response) {
        var match = response.headers['cache-control'].match(/max-age=(\d+)/);
        return parseInt(match[1], 10);
      });

      previous.push(assert.eventually.isTrue(bluebird.resolve(file.startsWith(config.cdn))));
      previous.push(assert.eventually.isAbove(maxAge, 60 * 60 * 24 * 30));

      return previous;
    }, []);

    return bluebird.all(checks);
  }

  it('is used for CSS files', function() {
    return browser.url(urls.home)
      .then(() => browser.getAttribute('link[rel="stylesheet"]', 'href'))
      .then(checkOptimized);
  });

  it('is used for JavaScript files', function() {
    return browser.url(urls.home)
      .then(() => browser.getAttribute('script', 'src'))
      .then(srcs => srcs.filter(assets.isAppJavaScript))
      .then(checkOptimized);
  });

  it('is used for page images', function() {
    return browser.url(urls.home)
      .then(() => browser.getAttribute('img', 'src'))
      .then(checkOptimized);
  });

  it('is used for CSS background images', function() {
    return browser.url(urls.home)
      .then(() => browser.getAttribute('div', 'style'))
      .then(function(styles) {
        var withBg = lodash.compact(styles)
          .map(style => style.match(/url\(([^\)]+)\)/)[1]);
        return checkOptimized(withBg);
      });
  });

});
