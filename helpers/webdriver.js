'use strict';

var yargs = require('yargs');

var environment = require('minos/config');

var options = yargs
  .option('minos-gui', {
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
  hasGui: options['minos-gui']
};

/**
 * Create a new config file for webdriver.io
 *
 * @returns {object}
 */
function buildConfig() {
  var phantomjs = {
    browserName: 'phantomjs',
    maxInstances: 10
  };

  if (environment.usesSelfSignedCertificate) {
    phantomjs['phantomjs.cli.args'] = [
      '--ignore-ssl-errors=true',
      '--web-security=false'
    ];
  }

  var browsers = [];
  if (run.hasGui) {
    browsers.push({
      browserName: 'chrome',
      maxInstances: 2
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
