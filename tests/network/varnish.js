'use strict';

var bluebird = require('bluebird');

var assert = require('minos/assert');
var config = require('minos/config');
var requests = require('minos/requests');
var urls = require('minos/urls');

describe('varnish', function() {

  if (config.usesVarnish) {

    it('is enabled for all pages', function() {
      return bluebird.map([urls.about, urls.home], function(url) {
        var age = requests.fetch(url).then(requests.getHeader('age'));
        return assert.eventually.isAbove(age, 0, `${url} is not served through Varnish`);
      });
    });

  } else {

    it('is disabled for all pages', function() {
      return bluebird.map([urls.about, urls.home], function(url) {
        var age = requests.fetch(url).then(requests.getHeader('age'));
        return assert.eventually.isUndefined(age, `${url} is served through Varnish`);
      });
    });

  }

});
