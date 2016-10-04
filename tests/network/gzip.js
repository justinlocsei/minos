'use strict';

var bluebird = require('bluebird');
var request = require('request');

var assert = require('minos/assert');
var assets = require('minos/assets');
var urls = require('minos').urls;

var getUrl = bluebird.promisify(request);

describe('gzip compression', function() {

  // Get the content encoding from an HTTP response
  function getEncoding(response) {
    return response.headers['content-encoding'];
  }

  // Get the vary header from an HTTP response
  function getVary(response) {
    return response.headers.vary;
  }

  // Get the response code from an HTTP response
  function getStatus(response) {
    return response.statusCode;
  }

  // Check that gzip compression is enabled for a set of URLs
  //
  // This ensures that a request with and without gzip as an accepted content
  // type returns a valid response, and that each response varies based on the
  // acceptable encoding types.
  function checkEncoding(files) {
    var checks = files.reduce(function(previous, file) {
      var withoutGzip = getUrl({url: file, gzip: false});
      var withGzip = getUrl({url: file, gzip: true});

      return previous.concat([
        assert.eventually.equal(withGzip.then(getStatus), 200),
        assert.eventually.equal(withGzip.then(getEncoding), 'gzip'),
        assert.eventually.equal(withGzip.then(getVary), 'Accept-Encoding'),
        assert.eventually.equal(withoutGzip.then(getStatus), 200),
        assert.eventually.equal(withoutGzip.then(getEncoding), undefined),
        assert.eventually.equal(withoutGzip.then(getVary), 'Accept-Encoding')
      ]);
    }, []);

    return bluebird.all(checks);
  }

  it('is applied to pages', function() {
    return checkEncoding([urls.about, urls.home]);
  });

  it('is applied to CSS files', function() {
    return browser.url(urls.home)
      .then(() => browser.getAttribute('link[rel="stylesheet"]', 'href'))
      .then(checkEncoding);
  });

  it('is applied to JavaScript files', function() {
    return browser.url(urls.home)
      .then(() => browser.getAttribute('script', 'src'))
      .then(srcs => srcs.filter(assets.isAppJavaScript))
      .then(checkEncoding);
  });

  it('is applied to SVG files', function() {
    return browser.url(urls.home)
      .then(() => browser.getAttribute('img', 'src'))
      .then(srcs => srcs.filter(src => /\.svg/.test(src)))
      .then(checkEncoding);
  });

});
