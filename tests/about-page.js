'use strict';

var bluebird = require('bluebird');
var request = require('request');

var assert = require('minos/assert');
var browsers = require('minos/browsers');
var urls = require('minos').urls;

var headAsync = bluebird.promisify(request.head);

var browser;

describe('the about page', function() {

  beforeEach(function() {
    browser = browsers.build();
  });

  afterEach(function() {
    browser.quit();
  });

  it('has the expected title', function() {
    var title = browser.get(urls.about).then(() => browser.getTitle());
    return assert.eventually.equal(title, 'About - Cover Your Basics');
  });

  it('has a visible picture of Bethany', function() {
    var imageVisible = browser.get(urls.about)
      .then(() => browser.findElement({css: 'img[alt="Bethany"]'}))
      .then(image => image.isDisplayed());
    return assert.eventually.isTrue(imageVisible);
  });

  it('has a non-broken picture of Bethany', function() {
    var imageResponse = browser.get(urls.about)
      .then(() => browser.findElement({css: 'img[alt="Bethany"]'}))
      .then(image => image.getAttribute('src'))
      .then(src => headAsync(src))
      .then(response => response.statusCode);
    return assert.eventually.equal(imageResponse, 200);
  });

});
