'use strict';

var bluebird = require('bluebird');
var request = require('request');

var assert = require('minos/assert');
var urls = require('minos/urls');

var getUrl = bluebird.promisify(request.get);

describe('robots.txt', function() {

  it('disallows the recommendations page', function() {
    return getUrl(urls.robots)
      .then(function(response) {
        var excludes = response.body.split('\n')
          .filter(line => /^Disallow/.test(line))
          .map(line => line.replace(/^Disallow: /, ''));

        assert.include(excludes, '/recommendations');
      });
  });

  it('points to a valid sitemap', function() {
    var responseCode = getUrl(urls.robots)
      .then(function(response) {
        var sitemap = response.body.split('\n')
          .find(line => /^Sitemap/.test(line));

        return getUrl(sitemap.replace(/^Sitemap: /, ''));
      })
      .then(response => response.statusCode);

    return assert.eventually.equal(responseCode, 200);
  });

});
