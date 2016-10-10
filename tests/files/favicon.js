'use strict';

var assert = require('minos/assert');
var requests = require('minos/requests');
var urls = require('minos/urls');

describe('favicon.ico', function() {

  it('exists', function() {
    var status = requests.fetch(urls.favicon, {method: 'HEAD'})
      .then(response => response.statusCode);

    return assert.eventually.equal(status, 200);
  });

  it('is gzipped', function() {
    var status = requests.fetch(urls.favicon, {gzip: true, method: 'HEAD'})
      .then(response => response.statusCode);

    return assert.eventually.equal(status, 200);
  });

});
