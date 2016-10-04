'use strict';

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
  isAppJavaScript: isAppJavaScript
};
