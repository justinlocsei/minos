'use strict';

var yargs = require('yargs');

var environment = require('minos/config');

var options = yargs
  .option('gui', {
    alias: 'g',
    default: false,
    describe: 'Run tests in a browser with a GUI'
  })
  .argv;

// A mapping of valid Selenium control keys
var keys = {
  return: 'Return',
  tab: 'Tab'
};

// Information on the current webdriver run
var run = {
  hasGui: options.gui
};

/**
 * Create a new config file for webdriver.io
 *
 * @returns {object}
 */
function buildConfig() {
  var chrome = {browserName: 'chrome'};
  var phantomjs = {browserName: 'phantomjs'};

  if (environment.usesSelfSignedCertificate) {
    phantomjs['phantomjs.cli.args'] = [
      '--ignore-ssl-errors=true',
      '--web-security=false'
    ];
  }

  var browsers = [];
  if (options.gui) {
    browsers.push(chrome);
  } else {
    browsers.push(phantomjs);
  }

  if (environment.usesSelfSignedCertificate) {
    browsers.forEach(function(browserConfig) {
      browserConfig.acceptSslCerts = true;
    });
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
  config: buildConfig(),
  keys: keys,
  run: run
};
