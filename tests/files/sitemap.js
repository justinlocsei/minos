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

  // Parse a sitemap from a response
  function parseSitemap(response) {
    return parseXml(response.body);
  }

  it('is valid XML', function() {
    var sitemap = requests
      .fetch(urls.sitemap)
      .then(parseSitemap);

    return assert.eventually.isObject(sitemap, 'could not parse the sitemap');
  });

  it('is gzipped', function() {
    var status = requests
      .fetch(urls.sitemap, {gzip: true})
      .then(requests.getStatus);

    return assert.eventually.equal(status, 200);
  });

  it('contains a single URL per location', function() {
    return requests.fetch(urls.sitemap)
      .then(parseSitemap)
      .then(function(parsed) {
        var pageUrls = parsed.urlset.url;
        assert.isAbove(pageUrls.length, 0);

        pageUrls.forEach(function(pageUrl) {
          assert.equal(pageUrl.loc.length, 1, `multiple URLs found: ${pageUrl.loc.join(', ')}`);
        });
      });
  });

  it('contains only GET-accessible URLs', function() {
    return requests.fetch(urls.sitemap)
      .then(parseSitemap)
      .then(function(parsed) {
        return bluebird.all(parsed.urlset.url.map(function(pageUrl) {
          var status = requests.fetch(pageUrl.loc[0]).then(requests.getStatus);
          return assert.eventually.equal(status, 200, `${pageUrl.loc[0]} is not accessible`);
        }));
      });
  });

  if (config.isCrawlable) {

    it('defines URLs that are not blocked by robots.txt', function() {
      var getSitemap = requests.fetch(urls.sitemap)
        .then(parseSitemap);

      var getRobots = requests.fetchStream(urls.robots)
        .then(response => robotsParse(response))
        .then(parsed => robotsCheck(parsed));

      return bluebird.all([getRobots, getSitemap]).then(function(responses) {
        var robots = responses[0];
        var sitemap = responses[1];

        sitemap.urlset.url.forEach(function(url) {
          var path = urlParse(url.loc[0]).path;
          assert.isTrue(robots.isAllowed('*', path), `${url.loc[0]} is blocked by robots.txt`);
        });
      });
    });

  }

});
