'use strict';

var bluebird = require('bluebird');
var robotsCheck = require('robots-txt-guard');
var robotsParse = require('robots-txt-parse');
var urlParse = require('url').parse;
var xml2js = require('xml2js');

var assert = require('minos/assert');
var config = require('minos/config');
var requests = require('minos/requests');
var urls = require('minos/urls');

var parseXml = bluebird.promisify(xml2js.parseString);

describe('the sitemap', function() {

  it('is valid XML', function() {
    var sitemap = requests.fetch(urls.sitemap)
      .then(response => parseXml(response.body));

    return assert.eventually.isObject(sitemap);
  });

  it('contains a single URL per location', function() {
    return requests.fetch(urls.sitemap)
      .then(response => parseXml(response.body))
      .then(function(parsed) {
        var pageUrls = parsed.urlset.url;
        assert.isAbove(pageUrls.length, 0);

        pageUrls.forEach(function(pageUrl) {
          assert.equal(pageUrl.loc.length, 1);
        });
      });
  });

  it('contains only GET-accessible URLs', function() {
    return requests.fetch(urls.sitemap)
      .then(response => parseXml(response.body))
      .then(function(parsed) {
        return bluebird.all(parsed.urlset.url.map(function(pageUrl) {
          return requests.fetch(pageUrl.loc[0]);
        }));
      })
      .then(function(responses) {
        responses.forEach(function(response) {
          assert.equal(response.statusCode, 200);
        });
      });
  });

  if (config.isCrawlable) {

    it('defines URLs that are not blocked by robots.txt', function() {
      var parseSitemap = requests.fetch(urls.sitemap)
        .then(response => parseXml(response.body));

      var parseRobots = requests.fetchStream(urls.robots)
        .then(response => robotsParse(response))
        .then(parsed => robotsCheck(parsed));

      return bluebird.all([parseRobots, parseSitemap])
        .then(function(responses) {
          var robots = responses[0];
          var sitemap = responses[1];

          sitemap.urlset.url.forEach(function(url) {
            var path = urlParse(url.loc[0]).path;
            assert.isTrue(robots.isAllowed('*', path));
          });
        });
    });

  }

});
