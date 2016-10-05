'use strict';

var bluebird = require('bluebird');

var assert = require('minos/assert');
var assets = require('minos/assets');
var urls = require('minos/urls');

describe('page asset mapping', function() {

  // Find all CSS files for a page
  function findCss(url) {
    return browser.url(url)
      .then(() => browser.getAttribute('link[rel="stylesheet"]', 'href'));
  }

  // Find all JavaScript files for a page
  function findJavaScript(url) {
    return browser.url(url)
      .then(() => browser.getAttribute('script', 'src'))
      .then(srcs => srcs.filter(assets.isAppJavaScript));
  }

  // Determine if a page loads page-specific resources
  function hasPageFiles(pages, assetFinder) {
    return bluebird.mapSeries(pages, function(page) {
      return assetFinder(page.url)
        .then(function(hrefs) {
          var pageFiles = hrefs.filter(href => /\/himation/.test(href));
          assert.equal(pageFiles.length, 1);

          var pageFile = pageFiles[0];
          assert.match(pageFile, new RegExp('/himation\.' + page.positive + '-'));
          assert.notMatch(pageFile, new RegExp('/himation\.' + page.negative + '-'));
        });
    });
  }

  // Determine if a page loads a commons chunk
  function hasCommonsFiles(pages, assetFinder) {
    return bluebird.mapSeries(pages, function(page) {
      return assetFinder(page.url)
        .then(function(hrefs) {
          var forCommons = hrefs.filter(href => /\/commons\.himation-/.test(href));
          assert.equal(forCommons.length, 1);
        });
    });
  }

  it('loads per-page CSS files', function() {
    var pages = [
      {
        url: urls.about,
        positive: 'about',
        negative: 'index'
      },
      {
        url: urls.home,
        positive: 'index',
        negative: 'about'
      }
    ];

    return hasPageFiles(pages, findCss);
  });

  it('loads per-page JavaScript files', function() {
    var pages = [
      {
        url: urls.about,
        positive: 'about',
        negative: 'index'
      },
      {
        url: urls.home,
        positive: 'index',
        negative: 'about'
      }
    ];

    return hasPageFiles(pages, findJavaScript);
  });

  it('loads commons chunks for CSS files', function() {
    return hasCommonsFiles([urls.about, urls.home], findCss);
  });

  it('loads commons chunks for JavaScript files', function() {
    return hasCommonsFiles([urls.about, urls.home], findJavaScript);
  });

});
