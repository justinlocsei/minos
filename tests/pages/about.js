'use strict';

var assert = require('minos/assert');
var requests = require('minos/requests');
var urls = require('minos/urls');

describe('the about page', function() {

  it('has the expected title', function() {
    var title = browser.url(urls.about)
      .then(() => browser.getTitle());
    return assert.eventually.equal(title, 'About - Cover Your Basics');
  });

  it('has a visible picture of Bethany', function() {
    var imageVisible = browser.url(urls.about)
      .then(() => browser.isVisible('img[alt="Bethany"]'));
    return assert.eventually.isTrue(imageVisible);
  });

  it('has a non-broken picture of Bethany', function() {
    var status = browser.url(urls.about)
      .getAttribute('img[alt="Bethany"]', 'src')
      .then(src => requests.fetch(src, {method: 'HEAD'}))
      .then(response => response.statusCode);

    return assert.eventually.equal(status, 200);
  });

});
