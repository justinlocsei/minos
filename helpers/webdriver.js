'use strict';

var config = require('minos/config');

var phantomConfig = {
  browserName: 'phantomjs'
};

if (config.selfSigned) {
  phantomConfig['phantomjs.cli.args'] = [
    '--ignore-ssl-errors=true',
    '--web-security=false'
  ];
}

module.exports = {
  config: {
    specs: ['./tests/**/*.js'],
    suites: {
      assets: ['./tests/assets/*.js'],
      files: ['./tests/files/*.js'],
      network: ['./tests/network/*.js'],
      pages: ['./tests/pages/*.js']
    },

    screenshotPath: './screenshots/',
    services: ['phantomjs'],
    capabilities: [phantomConfig],

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
  }
};
