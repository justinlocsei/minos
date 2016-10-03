'use strict';

var bluebird = require('bluebird');
var request = require('request');

var assert = require('minos/assert');
var urls = require('minos').urls;

var getUrl = bluebird.promisify(request);

describe('varnish', function() {

  it('serves the home page', function() {
    var age = getUrl(urls.home).then(response => response.headers.age);
    return assert.eventually.isAbove(age, 0);
  });

  it('serves the about page', function() {
    var age = getUrl(urls.about).then(response => response.headers.age);
    return assert.eventually.isAbove(age, 0);
  });

});
