'use strict';

var exports = {};

// A mapping of page names to relative URLs
var PAGE_PATHS = {
  about: 'about',
  index: ''
};

/**
 * Return a mapping of page names to absolute URLs
 *
 * @returns {object}
 */
function resolvePageUrls() {
  var baseUrl = process.env.MINOS_BASE_URL;
  if (!baseUrl) {
    throw new Error('You must specify a base page URL via the MINOS_BASE_URL environment variable');
  }

  return Object.keys(PAGE_PATHS).reduce(function(urls, pageName) {
    urls[pageName] = baseUrl.replace(/\/$/, '') + '/' + PAGE_PATHS[pageName];
    return urls;
  }, {});
}

// Define a URL object that lazily loads page URLs
Object.defineProperty(exports, 'urls', {
  get: resolvePageUrls
});

module.exports = exports;
