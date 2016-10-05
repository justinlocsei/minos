'use strict';

var bluebird = require('bluebird');
var lodash = require('lodash');
var sizeOf = require('image-size');
var urlParse = require('url').parse;

var assert = require('minos/assert');
var requests = require('minos/requests');
var urls = require('minos/urls');

describe('the about page', function() {

  it('has the expected title', function() {
    var title = browser.url(urls.about).getTitle();
    return assert.eventually.equal(title, 'About - Cover Your Basics');
  });

  it('has a visible picture of Bethany', function() {
    var imageVisible = browser.url(urls.about).isVisible('img[alt="Bethany"]');
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

  it('links to the survey section of the home page via the call-to-action button', function() {
    return browser.url(urls.about)
      .click('=GET STARTED NOW')
      .then(() => browser.getUrl())
      .then(function(url) {
        var parsed = urlParse(url);
        var pageUrl = url.replace(parsed.hash, '');

        assert.equal(pageUrl, urls.home);

        return bluebird.all([
          browser.getLocation(parsed.hash),
          browser.getLocationInView(parsed.hash)
        ]);
      })
      .then(function(positions) {
        var absolute = positions[0];
        var relative = positions[1];

        assert.isAbove(absolute.y, 0);
        assert.equal(relative.y, 0);
      });
  });

});
