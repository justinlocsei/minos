'use strict';

/**
 * Create a new browsing session for a page
 *
 * @param {string} url The URL to load
 * @param {object} [options] Options for creating the session
 * @param {number} options.height The height of the viewport
 * @param {number} options.javaScriptTimeout The timeout in milliseconds to wait for JavaScript to load
 * @param {boolean} options.useJavaScript Whether to enable JavaScript
 * @param {number} options.width The width of the viewport
 * @returns {object} A webdriver.io browser instance
 */
function createSession(url, options) {
  var settings = Object.assign({
    useJavaScript: true,
    height: 500,
    javaScriptTimeout: 3000,
    width: 1280
  }, options || {});

  var session = browser
    .setViewportSize({height: settings.height, width: settings.width})
    .url(url);

  if (settings.useJavaScript) {
    session = session.waitUntil(function() {
      return browser.isExisting('html.is-ready');
    }, settings.javaScriptTimeout, 'Client-side React render timed out');
  }

  return session;
}

module.exports = {
  create: createSession
};
