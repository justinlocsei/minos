'use strict';

require('minos/mocha');

var bluebird = require('bluebird');
var sizeOf = require('image-size');

var assert = require('minos/assert');
var config = require('minos/config');
var requests = require('minos/requests');
var ui = require('minos/ui');
var urls = require('minos/urls');

describe('page foundation', function() {

  it('sets Modernizr classes on the root element', function() {
    return browser.url(urls.home)
      .getAttribute('html', 'class')
      .then(function(classAttr) {
        var classes = classAttr.split(/\s+/);

        assert.include(classes, 'supports-js');
        assert.notInclude(classes, 'supports-no-js');
      });
  });

  it('includes the site logo', function() {
    return browser.url(urls.home)
      .getAttribute(ui.shared.logo, 'src')
      .then(function(src) {
        assert.startsWith(src, config.cdnUrl);
        return requests.fetch(src);
      })
      .then(function(response) {
        assert.equal(response.statusCode, 200);
      });
  });

  it('uses the logo as a link to the home page', function() {
    var destination = browser.url(urls.home)
      .click(ui.shared.logo)
      .then(browser.getUrl);

    return assert.eventually.equal(destination, urls.home);
  });

  it('has a link to the home page in the footer', function() {
    var destination = browser.url(urls.home)
      .click(ui.shared.footerHomeLink)
      .then(browser.getUrl);

    return assert.eventually.equal(destination, urls.home);
  });

  it('has a link to the about page in the footer', function() {
    var destination = browser.url(urls.home)
      .click(ui.shared.footerAboutLink)
      .then(browser.getUrl);

    return assert.eventually.equal(destination, urls.about);
  });

  it('uses a favicon served over the CDN', function() {
    return browser.url(urls.home)
      .getAttribute(ui.shared.faviconLink, 'href')
      .then(function(href) {
        assert.startsWith(href, config.cdnUrl);
        return requests.fetch(href);
      })
      .then(function(response) {
        assert.equal(response.statusCode, 200);
      });
  });

  it('keeps the favicon and shortcut icon in sync', function() {
    var getFavicon = requests.fetch(urls.favicon);
    var getShortcut = browser.url(urls.home)
      .getAttribute(ui.shared.faviconLink, 'href')
      .then(requests.fetch);

    return bluebird.all([getFavicon, getShortcut])
      .then(function(images) {
        var favicon = images[0];
        var shortcut = images[1];

        assert.notEqual(favicon.request.uri.href, shortcut.request.uri.href);
        assert.equal(favicon.body, shortcut.body);
      });
  });

  it('uses a valid image for the apple touch icon', function() {
    return browser.url(urls.home)
      .getAttribute(ui.shared.touchIconLink, 'href')
      .then(requests.fetchFile)
      .then(function(image) {
        var dimensions = sizeOf(image);

        assert.equal(dimensions.height, 180);
        assert.equal(dimensions.width, 180);
      });
  });

  it('has a valid Facebook share image', function() {
    var status = browser.url(urls.home)
      .getAttribute(ui.shared.facebookImageMeta, 'content')
      .then(requests.fetch)
      .then(requests.getStatus);

    return assert.eventually.equal(status, 200);
  });

  it('has a valid Twitter share image', function() {
    var status = browser.url(urls.home)
      .getAttribute(ui.shared.twitterImageMeta, 'content')
      .then(requests.fetch)
      .then(requests.getStatus);

    return assert.eventually.equal(status, 200);
  });

});
