'use strict';

var bluebird = require('bluebird');
var lodash = require('lodash');
var sizeOf = require('image-size');

var assert = require('minos/assert');
var requests = require('minos/requests');
var urls = require('minos/urls');

describe('the about page', function() {

  it('has the expected title', function() {
    var title = browser.url(urls.about)
      .then(() => browser.getTitle());
    return assert.eventually.equal(title, 'About - Cover Your Basics');
  });

  it('has a visible picture of Bethany', function() {
    var imageVisible = browser.url(urls.about)
      .then(() => browser.isVisible('img[alt="Bethany"]'));
    return assert.eventually.isTrue(imageVisible);
  });

  it('has a non-broken picture of Bethany', function() {
    var status = browser.url(urls.about)
      .getAttribute('img[alt="Bethany"]', 'src')
      .then(src => requests.fetch(src, {method: 'HEAD'}))
      .then(response => response.statusCode);

    return assert.eventually.equal(status, 200);
  });

  it('provides multiple pixel densities for the image of Bethany', function() {
    var imageRequests = browser.url(urls.about)
      .getAttribute('img[alt="Bethany"]', 'srcset')
      .then(function(srcset) {
        var srcs = srcset.split(',').map(src => src.trim());

        var bySize = srcs.reduce(function(previous, src) {
          var parts = src.split(' ');
          var url = parts[0];
          var density = parseFloat(parts[1].replace(/x$/, ''), 10);

          previous[density] = url;
          return previous;
        }, {});

        var sortedBySize = Object.keys(bySize).sort().map(k => bySize[k]);
        return bluebird.map(sortedBySize, url => requests.fetchFile(url));
      });

    return bluebird.all(imageRequests)
      .then(function(images) {
        var dimensions = images.map(image => sizeOf(image));
        var heights = dimensions.map(d => d.height);
        var widths = dimensions.map(d => d.width);

        assert.deepEqual(heights, lodash.sortBy(heights));
        assert.deepEqual(widths, lodash.sortBy(widths));
      });
  });

});
