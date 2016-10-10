'use strict';

var bluebird = require('bluebird');
var isProgressive = require('is-progressive');

var assert = require('minos/assert');
var requests = require('minos/requests');
var ui = require('minos/ui');
var urls = require('minos/urls');

// The known sizes of the original development versions of images
var BETHANY_1X_SIZE = 26869;
var PEAR_1X_SIZE = 20109;

describe('image build process', function() {

  it('creates progressive JPEGs', function() {
    var isProgressiveJpeg = browser.url(urls.about)
      .getAttribute(ui.about.bethanyImage, 'src')
      .then(src => requests.fetchStream(src))
      .then(stream => isProgressive.stream(stream));

    return assert.eventually.isTrue(isProgressiveJpeg);
  });

  it('lightly compresses JPEGs', function() {
    var fileSize = browser.url(urls.about)
      .getAttribute(ui.about.bethanyImage, 'src')
      .then(function(src) {
        assert.match(src, /\.jpg$/);
        return requests.fetch(src, {method: 'HEAD'});
      })
      .then(response => parseInt(response.headers['content-length'], 10));

    return assert.eventually.isBelow(fileSize, BETHANY_1X_SIZE, 'file size is not lower than the original');
  });

  it('aggressively compresses PNGs', function() {
    var fileSize = browser.url(urls.home)
      .getAttribute(ui.home.bodyShapeImage('Pear'), 'src')
      .then(function(src) {
        assert.match(src, /\.png$/);
        return requests.fetch(src, {method: 'HEAD'});
      })
      .then(response => parseInt(response.headers['content-length'], 10));

    return assert.eventually.isBelow(fileSize, PEAR_1X_SIZE * 0.5, 'file size is not significantly lower than the original');
  });

  it('compresses SVGs', function() {
    var svgs = browser.url(urls.home)
      .getAttribute('img', 'src')
      .then(srcs => srcs.filter(src => /\.svg$/.test(src)));

    return bluebird.map(svgs, function(svg) {
      return requests.fetch(svg).then(response => response.body)
        .then(function(content) {
          assert.notInclude(content, 'DOCTYPE');
          assert.notInclude(content, '\n');
        });
    });
  });

});
