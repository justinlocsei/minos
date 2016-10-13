'use strict';

var moment = require('moment');

var actions = require('minos/actions');
var assert = require('minos/assert');
var config = require('minos/config');
var gmail = require('minos/gmail');
var keys = require('minos/webdriver').keys;
var sessions = require('minos/sessions');
var ui = require('minos/ui');
var urls = require('minos/urls');
var webdriver = require('minos/webdriver');

// A proxy to delayed browser methods
var delay = sessions.delay;

describe('the welcome email', function() {

  // UI selectors for the recommendations page
  var UI = ui.recommendations;

  // Get the recommendations by submitting a valid survey
  function getRecommendations() {
    return sessions.create(urls.home)
      .then(browser.deleteCookie)
      .then(actions.completeSurvey)
      .then(delay.submitForm(ui.survey.form));
  }

  it('sends a confirmation email to a valid email address', function() {
    var recipient = config.emailAddress;
    var sentAfter;

    return getRecommendations()
      .then(delay.setValue(UI.emailInput, recipient))
      .then(delay.keys([keys.return]))
      .then(function() {
        sentAfter = moment();
        return browser.pause(1000);
      })
      .then(delay.isVisible(UI.emailError))
      .then(function(errorVisible) {
        assert.isFalse(errorVisible);

        return browser.waitUntil(function() {
          return gmail.fetchLastMessage(recipient, {
            sentAfter: sentAfter,
            subject: 'You’re In!'
          });
        }, webdriver.run.timeout, 'The confirmation email was not received', 2000);
      })
      .then(function(response) {
        var message = response.message;
        var headers = response.headers;

        assert.equal(headers.To, recipient);
        assert.match(headers['Content-Type'], /multipart/);

        var auth = headers['Authentication-Results'];
        assert.match(auth, /dkim=pass/, 'Failed DKIM validation');
        assert.match(auth, /spf=pass/, 'Failed SPF validation');

        assert.match(message.snippet, /Welcome to Cover Your Basics/);

        var text = message.payload.parts.find(p => p.mimeType === 'text/plain');
        var html = message.payload.parts.find(p => p.mimeType === 'text/html');

        assert.isDefined(text, 'Text email missing');
        assert.isDefined(html, 'HTML email missing');

        var textContent = new Buffer(text.body.data, 'base64').toString();
        var htmlContent = new Buffer(html.body.data, 'base64').toString();

        assert.match(textContent, /fabulous clothes/);
        assert.match(htmlContent, /fabulous clothes/);
        assert.match(htmlContent, /<table/);
      });
  });

});
