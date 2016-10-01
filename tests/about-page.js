'use strict';

var assert = require('minos/assert');
var browsers = require('minos/browsers');
var urls = require('minos').urls;

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

  it('has a picture of Bethany', function() {
    var imageVisible = browser.get(urls.about)
      .then(() => browser.findElement({css: 'img[alt="Bethany"]'}))
      .then(image => image.isDisplayed());
    return assert.eventually.isTrue(imageVisible);
  });

});
