'use strict';

var bluebird = require('bluebird');
var request = require('request');

var assert = require('minos/assert');
var urls = require('minos').urls;

var headAsync = bluebird.promisify(request.head);

describe('the about page', function() {

  it('has the expected title', function() {
    var title = browser.url(urls.about).getTitle();
    assert.equal(title, 'About - Cover Your Basics');
  });

  it('has a visible picture of Bethany', function() {
    var imageVisible = browser.url(urls.about).isVisible('img[alt="Bethany"]');
    assert.isTrue(imageVisible);
  });

  it('has a non-broken picture of Bethany', function() {
    var src = browser.url(urls.about).getAttribute('img[alt="Bethany"]', 'src');
    var status = headAsync(src).then(response => response.statusCode);
    return assert.eventually.equal(status, 200);
  });

});
