'use strict';

var bluebird = require('bluebird');
var request = require('request');
var urlParse = require('url').parse;
var xml2js = require('xml2js');

var assert = require('minos/assert');
var urls = require('minos/urls');

var getUrl = bluebird.promisify(request.get);
var parseXml = bluebird.promisify(xml2js.parseString);

describe('the sitemap', function() {

  it('is valid XML', function() {
    var sitemap = getUrl(urls.sitemap)
      .then(response => parseXml(response.body));

    return assert.eventually.isObject(sitemap);
  });

  it('contains a single URL per location', function() {
    return getUrl(urls.sitemap)
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
    return getUrl(urls.sitemap)
      .then(response => parseXml(response.body))
      .then(function(parsed) {
        return bluebird.all(parsed.urlset.url.map(function(pageUrl) {
          return getUrl(pageUrl.loc[0]);
        }));
      })
      .then(function(responses) {
        responses.forEach(function(response) {
          assert.equal(response.statusCode, 200);
        });
      });
  });

  it('defines URLs that are not blocked by robots.txt', function() {
    var getRobots = getUrl(urls.robots);
    var getSitemap = getUrl(urls.sitemap).then(response => parseXml(response.body));

    return bluebird.all([getRobots, getSitemap])
      .then(function(responses) {
        var robots = responses[0];
        var sitemap = responses[1];

        var excludes = robots.body.split('\n')
          .filter(line => /^Disallow/.test(line))
          .map(line => line.replace(/^Disallow: /, ''));

        sitemap.urlset.url.forEach(function(url) {
          var path = urlParse(url.loc[0]).path;
          assert.notInclude(excludes, path);
        });
      });
  });

});
