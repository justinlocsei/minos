'use strict';

var yargs = require('yargs');

var environment = require('minos/config');

var options = yargs
  .option('minos-email', {
    default: false,
    describe: 'Run email tests'
  })
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
  hasGui: options['minos-gui'],
  testEmail: options['minos-email']
};

// Set an action-specific timeout
var timeout = run.testEmail ? 60000 * 5 : 15000;
run.timeout = timeout;

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
  if (run.hasGui) {
    browsers.push({
      browserName: 'chrome',
      maxInstances: 1
    });
    browsers.push({
      browserName: 'firefox',
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
      main: [
        './tests/assets/*.js',
        './tests/files/*.js',
        './tests/network/*.js',
        './tests/pages/*.js'
      ],
      email: [
        './tests/email/*.js'
      ]
    },

    capabilities: browsers,
    screenshotPath: './screenshots/',
    services: ['phantomjs'],

    coloredLogs: true,
    reporters: ['dot'],
    sync: false,

    framework: 'mocha',
    mochaOpts: {
      timeout: timeout * 1.125,
      ui: 'bdd'
    }
  };
}

module.exports = {
  config: buildConfig(),
  keys: keys,
  run: run
};
