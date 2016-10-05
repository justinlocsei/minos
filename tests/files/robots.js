'use strict';

var robotsCheck = require('robots-txt-guard');
var robotsParse = require('robots-txt-parse');

var assert = require('minos/assert');
var config = require('minos/config');
var requests = require('minos/requests');
var urls = require('minos/urls');

describe('robots.txt', function() {

  // Return a promise for an access checker
  function checkRobots() {
    return parseRobots().then(parsed => robotsCheck(parsed));
  }

  // Return a promise for a parsed robots.txt file
  function parseRobots() {
    return requests.fetchStream(urls.robots).then(response => robotsParse(response));
  }

  if (config.isCrawlable) {

    it('allows access to public-facing GET pages', function() {
      return checkRobots()
        .then(function(check) {
          assert.isTrue(check.isAllowed('*', '/'));
          assert.isTrue(check.isAllowed('*', '/about'));
        });
    });

    it('blocks the recommendations page', function() {
      return checkRobots()
        .then(function(check) {
          assert.isFalse(check.isAllowed('*', '/recommendations'));
        });
    });

    it('points to a valid sitemap', function() {
      var responseCode = parseRobots()
        .then(function(parsed) {
          var sitemap = parsed.extensions.find(e => e.extension === 'sitemap');
          return requests.fetch(sitemap.value);
        })
        .then(response => response.statusCode);

      return assert.eventually.equal(responseCode, 200);
    });

  } else {

    it('blocks all pages', function() {
      return checkRobots()
        .then(function(check) {
          assert.isFalse(check.isAllowed('*', '/'));
          assert.isFalse(check.isAllowed('*', '/about'));
          assert.isFalse(check.isAllowed('*', '/recommendations'));
        });
    });

    it('does not define a sitemap', function() {
      var sitemap = parseRobots()
        .then(function(parsed) {
          return parsed.extensions.find(e => e.extension === 'sitemap');
        });

      return assert.eventually.isUndefined(sitemap);
    });

  }

});
