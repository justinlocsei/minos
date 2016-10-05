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

      previous.push(assert.eventually.isTrue(bluebird.resolve(file.startsWith(config.cdnUrl))));
      previous.push(assert.eventually.isAbove(maxAge, 60 * 60 * 24 * 30));

      return previous;
    }, []);

    return bluebird.all(checks);
  }

  // Ensure that all asset URLs are served without optimization
  //
  // This checks that the assets are served in such a way that they will force
  // the user agent to always revalidate.
  function checkUnoptimized(files) {
    return bluebird.map(files, function(file) {
      var cacheControl = requests.fetch(file).then(response => response.headers['cache-control']);
      return assert.eventually.equal(cacheControl, 'no-cache');
    });
  }

  // Perform the correct optimization check on files for the environment
  function checkValid(files) {
    var checker = config.hasFarFutureAssets ? checkOptimized : checkUnoptimized;
    return checker(files);
  }

  var state = config.hasFarFutureAssets ? 'enabled' : 'disabled';

  it(`is ${state} for CSS files`, function() {
    return browser.url(urls.home)
      .then(() => browser.getAttribute('link[rel="stylesheet"]', 'href'))
      .then(checkValid);
  });

  it(`is ${state} for JavaScript files`, function() {
    return browser.url(urls.home)
      .then(() => browser.getAttribute('script', 'src'))
      .then(srcs => srcs.filter(assets.isAppJavaScript))
      .then(checkValid);
  });

  it(`is ${state} for page images`, function() {
    return browser.url(urls.home)
      .then(() => browser.getAttribute('img', 'src'))
      .then(checkValid);
  });

  it(`is ${state} for CSS background images`, function() {
    return browser.url(urls.home)
      .then(() => browser.getAttribute('div', 'style'))
      .then(function(styles) {
        var withBg = lodash.compact(styles)
          .reduce(function(previous, style) {
            var match = style.match(/url\(([^\)]+)\)/);
            if (match) { previous.push(match[1]); }

            return previous;
          }, []);

        return checkValid(withBg);
      });
  });

});
