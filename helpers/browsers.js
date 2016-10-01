'use strict';

var webdriver = require('selenium-webdriver');

/**
 * Create a new instance of a Selenium browser
 *
 * @param {string} [browser] The name of a browser
 * @returns {object}
 */
function buildBrowser(browser) {
  return new webdriver.Builder()
    .forBrowser(browser || 'phantomjs')
    .usingServer('http://localhost:4444/wd/hub')
    .build();
}

module.exports = {
  build: buildBrowser
};
