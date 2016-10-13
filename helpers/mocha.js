'use strict';

var path = require('path');
var slug = require('slug');

var webdriver = require('minos/webdriver');

afterEach(function() {
  var test = this.currentTest;

  if (test.state === 'failed') {
    var screenshot = path.join(webdriver.config.screenshotPath, slug(test.title));
    browser.saveScreenshot(screenshot);
  }
});
