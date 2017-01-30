'use strict';

var _ = require('lodash');
var bluebird = require('bluebird');
var parseUrl = require('url').parse;

var assert = require('minos/assert');
var config = require('minos/config');
var requests = require('minos/requests');
var urls = require('minos/urls');

describe('preloading', function() {

  it('is enabled via an HTTP Link header', function() {
    return bluebird.map([urls.about, urls.home], function(url) {
      return requests.fetch(url).then(requests.getHeader('link')).then(function(link) {
        var match = link.match(/^<([^>]+)>; rel=(.+)$/);
        var preconnectUrl = match[1];
        var rel = match[2];

        assert.equal(preconnectUrl, config.cdnUrl);
        assert.equal(rel, 'preconnect');
      });
    });
  });

  it('uses the host for all assets on the page', function() {
    return bluebird.map([urls.about, urls.home], function(url) {
      var link = requests.fetch(url).then(requests.getHeader('link'));
      var markup = requests.fetchDom(url);

      return bluebird.all([link, markup]);
    }).then(function(results) {
      results.forEach(function(result) {
        var link = result[0];
        var preconnectUrl = link.match(/^<([^>]+)>/)[1];

        var $ = result[1];
        var queries = [
          {tag: 'link', attr: 'href'},
          {tag: 'script', attr: 'src'}
        ];

        var assetHosts = queries.reduce(function(previous, query) {
          $(query.tag).each(function() {
            var url = $(this).attr(query.attr);
            var parsed;

            if (url) {
              parsed = parseUrl(url);
              previous.push(`${parsed.protocol}//${parsed.host}`);
            }
          });

          return previous;
        }, []);

        assert.include(_.uniq(assetHosts), preconnectUrl);
      });
    });
  });

});
