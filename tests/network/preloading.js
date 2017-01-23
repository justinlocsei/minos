'use strict';

var bluebird = require('bluebird');
var lodash = require('lodash');

var assert = require('minos/assert');
var requests = require('minos/requests');
var urls = require('minos/urls');

describe('preloading', function() {

  it('is enabled via HTTP Link headers', function() {
    return bluebird.map([urls.about, urls.home], function(url) {
      return requests.fetch(url).then(requests.getHeader('link')).then(function(links) {
        var defs = links.split(', ');
        assert.isAbove(defs.length, 0);

        defs.forEach(function(def) {
          assert.match(def, /^<.+\.(css|js)>/, 'non-asset URL specified');
          assert.match(def, /; rel=preload; /, 'preload directive missing');
          assert.match(def, /; as=\w+$/, 'request destination missing');
        });
      });
    });
  });

  it('uses media-appropriate request destinations', function() {
    return bluebird.map([urls.about, urls.home], function(url) {
      return requests.fetch(url).then(requests.getHeader('link')).then(function(links) {
        var byMedia = links.split(', ').reduce(function(previous, def) {
          var extension = def.match(/^<.+\.([^>]+)>/)[1];
          previous[extension] = previous[extension] || [];
          previous[extension].push(def.match(/; as=(.+)$/)[1]);
          return previous;
        }, {});

        assert.isAbove(byMedia.js.length, 0);
        assert.isAbove(byMedia.css.length, 0);

        assert.deepEqual(lodash.uniq(byMedia.js), ['script']);
        assert.deepEqual(lodash.uniq(byMedia.css), ['style']);
      });
    });
  });

  it('references assets specified on each page', function() {
    return bluebird.map([urls.about, urls.home], function(url) {
      var links = requests.fetch(url).then(requests.getHeader('link'));
      var markup = requests.fetchDom(url);

      return bluebird.all([links, markup]);
    }).then(function(results) {
      results.forEach(function(result) {
        var links = result[0];
        var $ = result[1];

        var byMedia = links.split(', ').reduce(function(previous, def) {
          var extension = def.match(/^<.+\.([^>]+)>/)[1];
          previous[extension] = previous[extension] || [];
          previous[extension].push(def.match(/<(.+)>/)[1]);
          return previous;
        }, {});

        byMedia.js.forEach(function(js) {
          assert.equal($(`script[src="${js}"]`).length, 1);
        });

        byMedia.css.forEach(function(css) {
          assert.equal($(`link[href="${css}"]`).length, 1);
        });
      });
    });
  });

});
