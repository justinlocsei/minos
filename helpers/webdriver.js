'use strict';

var environment = require('minos/config');

// A mapping of valid Selenium control keys
var keys = {
  return: 'Return',
  tab: 'Tab'
};

/**
 * Create a new config file for webdriver.io
 *
 * @param {object} options Options for creating the config
 * @param {boolean} headless Use a headless browser for the tests
 * @returns {object}
 */
function buildConfig(options) {
  var settings = Object.assign({
    headless: true
  }, options || {});

  var phantomjs = {
    browserName: 'phantomjs'
  };
  if (environment.usesSelfSignedCertificate) {
    phantomjs['phantomjs.cli.args'] = [
      '--ignore-ssl-errors=true',
      '--web-security=false'
    ];
  }

  var chrome = {
    browserName: 'chrome'
  };

  var browsers = [];
  if (settings.headless) {
    browsers.push(phantomjs);
  } else {
    browsers.push(chrome);
  }

  return {
    specs: ['./tests/**/*.js'],
    suites: {
      assets: ['./tests/assets/*.js'],
      files: ['./tests/files/*.js'],
      network: ['./tests/network/*.js'],
      pages: ['./tests/pages/*.js']
    },

    screenshotPath: './screenshots/',
    services: ['phantomjs'],
    capabilities: browsers,

    coloredLogs: true,
    connectionRetryCount: 3,
    connectionRetryTimeout: 90000,
    logLevel: 'silent',
    maxInstances: 10,
    sync: false,
    waitforTimeout: 10000,

    framework: 'mocha',
    mochaOpts: {ui: 'bdd'},
    reporters: ['spec']
  };
}

module.exports = {
  buildConfig: buildConfig,
  keys: keys
};
