'use strict';

var assert = require('minos/assert');
var requests = require('minos/requests');
var urls = require('minos/urls');

describe('robots.txt', function() {

  it('disallows the recommendations page', function() {
    return requests.fetch(urls.robots)
      .then(function(response) {
        var excludes = response.body.split('\n')
          .filter(line => /^Disallow/.test(line))
          .map(line => line.replace(/^Disallow: /, ''));

        assert.include(excludes, '/recommendations');
      });
  });

  it('points to a valid sitemap', function() {
    var responseCode = requests.fetch(urls.robots)
      .then(function(response) {
        var sitemap = response.body.split('\n')
          .find(line => /^Sitemap/.test(line));

        return requests.fetch(sitemap.replace(/^Sitemap: /, ''));
      })
      .then(response => response.statusCode);

    return assert.eventually.equal(responseCode, 200);
  });

});
