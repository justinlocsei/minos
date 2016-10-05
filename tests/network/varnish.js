'use strict';

var assert = require('minos/assert');
var requests = require('minos/requests');
var urls = require('minos/urls');

describe('varnish', function() {

  it('serves the home page', function() {
    var age = requests.fetch(urls.home).then(response => response.headers.age);
    return assert.eventually.isAbove(age, 0);
  });

  it('serves the about page', function() {
    var age = requests.fetch(urls.about).then(response => response.headers.age);
    return assert.eventually.isAbove(age, 0);
  });

});
