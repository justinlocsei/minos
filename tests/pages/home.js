'use strict';

var bluebird = require('bluebird');

var assert = require('minos/assert');
var config = require('minos/config');
var requests = require('minos/requests');
var sessions = require('minos/sessions');
var urls = require('minos/urls');

describe('the home page', function() {

  it('has the expected title', function() {
    var title = browser.url(urls.home).getTitle();
    return assert.eventually.equal(title, 'Cover Your Basics');
  });

  it('has the expected Facebook title', function() {
    var title = browser.url(urls.home)
      .getAttribute('meta[property="og:title"]', 'content');

    return assert.eventually.equal(title, 'Fill Out Our Survey');
  });

  it('has a valid Facebook share URL', function() {
    var url = browser.url(urls.home)
      .getAttribute('meta[property="og:url"]', 'content');

    return assert.eventually.equal(url, urls.home);
  });

  it('has a valid image for the pitch', function() {
    var status = browser.url(urls.home)
      .getAttribute('.l--pitch [class*="graphic"]', 'style')
      .then(function(style) {
        var match = style.match(/url\(([^\)]+)\)/);
        return requests.fetch(match[1]);
      })
      .then(response => response.statusCode);

    return assert.eventually.equal(status, 200);
  });

  it('uses valid images for the formalities', function() {
    var srcs = browser.url(urls.home)
      .getAttribute('img[class*="formality"]', 'src');

    return bluebird.map(srcs, function(src) {
      return requests.fetch(src, {method: 'HEAD'})
        .then(function(response) {
          assert.equal(response.statusCode, 200);
        });
    });
  });

  it('uses high-DPI images for the formalities', function() {
    var srcsets = browser.url(urls.home)
      .getAttribute('img[class*="formality"]', 'srcset');

    return bluebird.map(srcsets, function(srcset) {
      return assert.eventually.srcsetValid(bluebird.resolve(srcset));
    });
  });

  it('uses valid images for the body shapes', function() {
    var srcs = browser.url(urls.home)
      .getAttribute('img[class*="body-shape"]', 'src');

    return bluebird.map(srcs, function(src) {
      return requests.fetch(src, {method: 'HEAD'})
        .then(function(response) {
          assert.equal(response.statusCode, 200);
        });
    });
  });

  it('uses high-DPI images for the body shapes', function() {
    var srcsets = browser.url(urls.home)
      .getAttribute('img[class*="body-shape"]', 'srcset');

    return bluebird.map(srcsets, function(srcset) {
      return assert.eventually.srcsetValid(bluebird.resolve(srcset));
    });
  });

  it('scrolls to the survey when clicking on the start-survey button', function() {
    return sessions.create(urls.home)
      .click('=Fill Out Our Survey')
      .then(function() {
        return browser.waitUntil(function() {
          return browser.isVisibleWithinViewport('#start-survey');
        }, 1000, 'The survey was not scrolled to');
      });
  });

  if (config.usesVarnish) {

    it('is served through Varnish when a user is registered', function() {
      var maxAge = requests.fetch(urls.home, {headers: {cookie: 'registered=1'}})
        .then(response => response.headers.age);

      return assert.eventually.isAbove(maxAge, 0);
    });

  }

});
