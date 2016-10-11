'use strict';

var bluebird = require('bluebird');
var parseUrl = require('url').parse;

var assert = require('minos/assert');
var requests = require('minos/requests');
var ui = require('minos/ui');
var urls = require('minos/urls');

describe('the about page', function() {

  it('has the expected title', function() {
    var title = browser.url(urls.about).getTitle();
    return assert.eventually.equal(title, 'About - Cover Your Basics');
  });

  it('has the expected Facebook title', function() {
    var title = browser.url(urls.about)
      .getAttribute(ui.shared.facebookTitleMeta, 'content');

    return assert.eventually.equal(title, 'About');
  });

  it('has a valid Facebook share URL', function() {
    var url = browser.url(urls.about)
      .getAttribute(ui.shared.facebookUrlMeta, 'content');

    return assert.eventually.equal(url, urls.about);
  });

  it('has a visible picture of Bethany', function() {
    var imageVisible = browser.url(urls.about).isVisible(ui.about.bethanyImage);
    return assert.eventually.isTrue(imageVisible);
  });

  it('has a non-broken picture of Bethany', function() {
    var status = browser.url(urls.about)
      .getAttribute(ui.about.bethanyImage, 'src')
      .then(src => requests.fetch(src, {method: 'HEAD'}))
      .then(requests.getStatus);

    return assert.eventually.equal(status, 200);
  });

  it('provides multiple pixel densities for the image of Bethany', function() {
    var srcset = browser.url(urls.about)
      .getAttribute(ui.about.bethanyImage, 'srcset');

    return assert.eventually.srcsetValid(srcset);
  });

  it('links to the survey section of the home page via the call-to-action button', function() {
    return browser.url(urls.about)
      .click(ui.about.startSurvey)
      .then(browser.getUrl)
      .then(function(url) {
        var parsed = parseUrl(url);
        var pageUrl = url.replace(parsed.hash, '');

        assert.equal(pageUrl, urls.home);

        return bluebird.all([
          browser.getLocation(parsed.hash),
          browser.getLocationInView(parsed.hash)
        ]);
      })
      .then(function(positions) {
        var absolute = positions[0];
        var relative = positions[1];

        assert.isAbove(absolute.y, 0);
        assert.equal(relative.y, 0);
      });
  });

});
