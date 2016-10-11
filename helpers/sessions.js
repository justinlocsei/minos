'use strict';

// The names of browser functions for which to expose delayed versions
var DELAY_FUNCTIONS = [
  'click',
  'getAttribute',
  'getText',
  'getValue',
  'keys',
  'pause',
  'setValue',
  'submitForm',
  'waitForVisible'
];

// Add wrapped versions of browser functions
var delay = DELAY_FUNCTIONS.reduce(function(delayed, functionName) {
  delayed[functionName] = function() {
    var args = [];
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }

    return function delayedBrowser() {
      return browser[functionName].apply(browser, args);
    };
  };

  return delayed;
}, {});

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

module.exports = {
  create: createSession,
  delay: delay
};
