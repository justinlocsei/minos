'use strict';

var Promise = require('bluebird');
var https = require('https');
var isProgressive = require('is-progressive');
var request = require('request');

var assert = require('minos/assert');
var urls = require('minos/urls');

var getUrl = Promise.promisify(request.get);
var queryUrl = Promise.promisify(request.head);

// The known sizes of the original development versions of images
var BETHANY_1X_SIZE = 26869;
var PEAR_1X_SIZE = 20109;

describe('image build process', function() {

  it('creates progressive JPEGs', function() {
    var isProgressiveJpeg = browser.url(urls.about)
      .getAttribute('img[alt="Bethany"]', 'src')
      .then(function(src) {
        return new Promise(function(resolve, reject) {
          https
            .get(src, response => resolve(response))
            .on('error', error => reject(error));
        });
      })
      .then(stream => isProgressive.stream(stream));

    return assert.eventually.isTrue(isProgressiveJpeg);
  });

  it('lightly compresses JPEGs', function() {
    var fileSize = browser.url(urls.about)
      .getAttribute('img[alt="Bethany"]', 'src')
      .then(function(src) {
        assert.match(src, /\.jpg$/);
        return queryUrl(src);
      })
      .then(response => parseInt(response.headers['content-length'], 10));

    return assert.eventually.isBelow(fileSize, BETHANY_1X_SIZE);
  });

  it('aggressively compresses PNGs', function() {
    var fileSize = browser.url(urls.home)
      .getAttribute('img[alt="Pear body shape"]', 'src')
      .then(function(src) {
        assert.match(src, /\.png$/);
        return queryUrl(src);
      })
      .then(response => parseInt(response.headers['content-length'], 10));

    return assert.eventually.isBelow(fileSize, PEAR_1X_SIZE * 0.5);
  });

  it('compresses SVGs', function() {
    var svgs = browser.url(urls.home)
      .then(() => browser.getAttribute('img', 'src'))
      .then(srcs => srcs.filter(src => /\.svg$/.test(src)));

    return Promise.map(svgs, function(svg) {
      return getUrl(svg).then(response => response.body)
        .then(function(content) {
          assert.notInclude(content, 'DOCTYPE');
          assert.notInclude(content, '\n');
        });
    });
  });

});