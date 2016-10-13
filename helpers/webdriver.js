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
  var phantomjs = {
    browserName: 'phantomjs',
    maxInstances: 5
  };

  if (environment.usesSelfSignedCertificate) {
    phantomjs['phantomjs.cli.args'] = [
      '--ignore-ssl-errors=true',
      '--web-security=false'
    ];
  }

  var browsers = [];
  if (options.gui) {
    browsers.push({
      browserName: 'chrome',
      maxInstances: 1
    });
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

    capabilities: browsers,
    screenshotPath: './screenshots/',
    services: ['phantomjs'],

    coloredLogs: true,
    reporters: ['dot'],
    sync: false,

    framework: 'mocha',
    mochaOpts: {
      timeout: 60000,
      ui: 'bdd'
    }
  };
}

module.exports = {
  config: buildConfig(),
  keys: keys,
  run: run
};
