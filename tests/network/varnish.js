'use strict';

var bluebird = require('bluebird');

var assert = require('minos/assert');
var config = require('minos/config');
var requests = require('minos/requests');
var urls = require('minos/urls');

describe('varnish', function() {

  if (config.usesVarnish) {

    it('serves the home page', function() {
      var age = requests.fetch(urls.home).then(response => response.headers.age);
      return assert.eventually.isAbove(age, 0);
    });

    it('serves the about page', function() {
      var age = requests.fetch(urls.about).then(response => response.headers.age);
      return assert.eventually.isAbove(age, 0);
    });

  } else {

    it('is disabled for all pages', function() {
      return bluebird.map([urls.about, urls.home], function(url) {
        var age = requests.fetch(url).then(response => response.headers.age);
        return assert.eventually.isUndefined(age);
      });
    });

  }

});
