'use strict';

/**
 * Extract a background image from an inline style
 *
 * @param {string} style An inline style declaration
 * @returns {string} The URL of the background image
 */
function getBackgroundImage(style) {
  var match = style.match(/url\(([^\)]+)\)/);
  return match ? match[1].replace(/"/g, '') : null;
}

/**
 * Determine if a URL represents application JavaScript
 *
 * @param {string} url A URL for a JavaScript file
 * @returns {boolean}
 */
function isAppJavaScript(url) {
  return url !== '' && !/google-analytics/.test(url);
}

module.exports = {
  getBackgroundImage: getBackgroundImage,
  isAppJavaScript: isAppJavaScript
};
