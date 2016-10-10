'use strict';

var webdriver = require('minos/webdriver');
var yargs = require('yargs');

var options = yargs
  .option('gui', {
    alias: 'g',
    default: false,
    describe: 'Run tests in a browser with a GUI'
  })
  .argv;

exports.config = webdriver.buildConfig({
  headless: !options.gui
});
