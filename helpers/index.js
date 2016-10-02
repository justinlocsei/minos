'use strict';

var exports = {};

// The base URL, derived from the environment
var baseUrl = process.env.MINOS_BASE_URL;

// A mapping of page names to relative URLs
var PAGE_PATHS = {
  about: 'about',
  index: '',
  robots: 'robots.txt',
  sitemap: 'sitemap.xml'
};

/**
 * Return a mapping of page names to absolute URLs
 *
 * @returns {object}
 */
function resolvePageUrls() {
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

// Expose the base URL
exports.baseUrl = baseUrl;

module.exports = exports;
