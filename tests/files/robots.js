'use strict';

var parseUrl = require('url').parse;
var robotsChecker = require('robots-txt-guard');
var robotsParser = require('robots-txt-parse');

var assert = require('minos/assert');
var config = require('minos/config');
var requests = require('minos/requests');
var urls = require('minos/urls');

describe('robots.txt', function() {

  // Return a promise for a function that checks if a URL is allowed by robots.txt
  function checkRobots() {
    return parseRobots()
      .then(parsed => robotsChecker(parsed))
      .then(function(checker) {
        return function checkAccess(url) {
          var path = parseUrl(url).path;
          return checker.isAllowed('*', path);
        };
      });
  }

  // Return a promise for a parsed robots.txt file
  function parseRobots() {
    return requests
      .fetchStream(urls.robots)
      .then(response => robotsParser(response));
  }

  it('is gzipped', function() {
    var status = requests
      .fetch(urls.robots, {gzip: true})
      .then(requests.getStatus);

    return assert.eventually.equal(status, 200);
  });

  if (config.isCrawlable) {

    it('allows access to public-facing GET pages', function() {
      return checkRobots().then(function(check) {
        assert.isTrue(check(urls.home));
        assert.isTrue(check(urls.about));
      });
    });

    it('blocks the recommendations page', function() {
      return checkRobots().then(function(check) {
        assert.isFalse(check(urls.recommendations));
      });
    });

    it('points to a valid sitemap', function() {
      var status = parseRobots()
        .then(function(parsed) {
          var sitemap = parsed.extensions.find(e => e.extension === 'sitemap');
          return requests.fetch(sitemap.value);
        })
        .then(requests.getStatus);

      return assert.eventually.equal(status, 200);
    });

  } else {

    it('blocks all pages', function() {
      return checkRobots().then(function(check) {
        assert.isFalse(check(urls.home));
        assert.isFalse(check(urls.about));
        assert.isFalse(check(urls.recommendations));
      });
    });

    it('does not define a sitemap', function() {
      var sitemap = parseRobots().then(function(parsed) {
        return parsed.extensions.find(e => e.extension === 'sitemap');
      });

      return assert.eventually.isUndefined(sitemap);
    });

  }

});
