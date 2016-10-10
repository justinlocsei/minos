'use strict';

/**
 * Create a new browsing session for a page
 *
 * @param {string} url The URL to load
 * @param {object} [options] Options for creating the session
 * @param {number} options.height The height of the viewport
 * @param {number} options.javaScriptTimeout The timeout in milliseconds to wait for JavaScript to load
 * @param {number} options.width The width of the viewport
 * @returns {object} A webdriver.io browser instance
 */
function createSession(url, options) {
  var settings = Object.assign({
    height: 500,
    javaScriptTimeout: 3000,
    width: 1280
  }, options || {});

  return browser
    .setViewportSize({height: settings.height, width: settings.width})
    .url(url)
    .waitUntil(function() {
      return browser.isExisting('html.is-ready');
    }, settings.javaScriptTimeout, 'Client-side React render timed out');
}

/**
 * Return a promise to get the current page's title
 *
 * @returns {Promise}
 * @resolve {string} The current title
 */
function getTitle() {
  return browser.getTitle();
}

/**
 * Return a promise to get the current page's URL
 *
 * @returns {Promise}
 * @resolve {string} The current URL
 */
function getUrl() {
  return browser.getUrl();
}

module.exports = {
  create: createSession,
  getTitle: getTitle,
  getUrl: getUrl
};
