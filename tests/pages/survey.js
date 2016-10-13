'use strict';

require('minos/mocha');

var actions = require('minos/actions');
var assert = require('minos/assert');
var config = require('minos/config');
var flow = require('minos/flow');
var keys = require('minos/webdriver').keys;
var requests = require('minos/requests');
var sessions = require('minos/sessions');
var ui = require('minos/ui');
var urls = require('minos/urls');

// A proxy to delayed browser methods
var delay = sessions.delay;

describe('the survey', function() {

  // The wait duration for form events
  var FORM_WAIT = 250;

  // UI selectors for the survey
  var UI = ui.survey;

  it('cannot be empty', function() {
    var destination = sessions.create(urls.home)
      .submitForm(UI.form)
      .then(browser.getUrl);

    return assert.eventually.equal(destination, urls.home);
  });

  it('is validated on the server when JavaScript is disabled', function() {
    var error = requests.fetchDom(urls.home)
      .then(function($) {
        var $survey = $(UI.form);

        return requests.fetchDom(config.siteUrl + $survey.attr('action'), {
          method: $survey.attr('method'),
          form: {}
        });
      }).then(function($) {
        return $(UI.errors.birthYear).text();
      });

    return assert.eventually.equal(error, 'Please provide your birth year');
  });

  it('can be submitted with valid data', function() {
    var destination = sessions.create(urls.home)
      .then(actions.completeSurvey)
      .then(delay.submitForm(UI.form))
      .then(browser.getUrl);

    return assert.eventually.equal(destination, urls.recommendations);
  });

  it('can be submitted with valid data when JavaScript is disabled', function() {
    var title = requests.fetchDom(urls.home)
      .then(function($) {
        var $survey = $(UI.form);

        var form = $survey.serializeArray().reduce(function(previous, field) {
          previous[field.name] = field.value;
          return previous;
        }, {});

        form.birthYear = '1984';
        form.bodyShape = 'hourglass';
        form['formalities[0].frequency'] = 'always';
        form['sizes[0].isSelected'] = 'true';
        form['styles[0].isSelected'] = 'true';

        return requests.fetchDom(config.siteUrl + $survey.attr('action'), {
          method: $survey.attr('method'),
          form: form
        });
      }).then(function($) {
        return $(ui.recommendations.tocTitle).text();
      });

    return assert.eventually.equal(title, 'Your Basics');
  });

  describe('the formality picker', function() {

    it('scrolls to the error when no formalities are selected', function() {
      return sessions.create(urls.home)
        .submitForm(UI.form)
        .then(delay.waitForVisible(UI.errors.formalities, FORM_WAIT))
        .then(function() {
          return browser.waitUntil(function() {
            return browser.isVisibleWithinViewport(UI.errors.formalities);
          }, 1000, 'The formality error was shown but not scrolled to');
        });
    });

    it('hides the error when a single formality has been selected', function() {
      return sessions.create(urls.home)
        .submitForm(UI.form)
        .then(delay.waitForVisible(UI.errors.formalities, FORM_WAIT))
        .then(delay.click(UI.formalityChoice('Casual', 'Occasionally')))
        .then(function() {
          return browser.waitUntil(function() {
            return flow.negate(browser.isVisible(UI.errors.formalities));
          }, FORM_WAIT, 'The formality error was not cleared');
        });
    });

    it('does not hide the error when only never is selected', function() {
      return sessions.create(urls.home)
        .submitForm(UI.form)
        .then(delay.waitForVisible(UI.errors.formalities, FORM_WAIT))
        .then(delay.click(UI.formalityChoice('Casual', 'Occasionally')))
        .then(delay.waitForVisible(UI.errors.formalities, FORM_WAIT, true))
        .then(delay.click(UI.formalityChoice('Casual', 'Never')))
        .then(delay.waitForVisible(UI.errors.formalities, FORM_WAIT));
    });

    it('hides the error when at least one non-never value is selected', function() {
      return sessions.create(urls.home)
        .submitForm(UI.form)
        .then(delay.waitForVisible(UI.errors.formalities, FORM_WAIT))
        .then(delay.click(UI.formalityChoice('Casual', 'Occasionally')))
        .then(delay.waitForVisible(UI.errors.formalities, FORM_WAIT, true))
        .then(delay.click(UI.formalityChoice('Dressy Casual', 'Never')))
        .then(delay.waitForVisible(UI.errors.formalities, FORM_WAIT, true));
    });

  });

  describe('the style picker', function() {

    it('shows an error when no styles are selected', function() {
      return sessions.create(urls.home)
        .submitForm(UI.form)
        .then(delay.waitForVisible(UI.errors.styles, FORM_WAIT));
    });

    it('hides the error when a style is selected', function() {
      return sessions.create(urls.home)
        .submitForm(UI.form)
        .then(delay.waitForVisible(UI.errors.styles, FORM_WAIT))
        .then(delay.click(UI.styleChoice('Creative, Fun')))
        .then(function() {
          return browser.waitUntil(function() {
            return flow.negate(browser.isVisible(UI.errors.styles));
          }, FORM_WAIT, 'The style error was not cleared');
        });
    });

    it('disables the styles when three have been selected', function() {
      return sessions.create(urls.home)
        .submitForm(UI.form)
        .then(delay.click(UI.styleChoice('Creative, Fun')))
        .then(delay.click(UI.styleChoice('Sleek, Efficient')))
        .then(delay.click(UI.styleChoice('Classy, Elegant')))
        .then(delay.click(UI.styleChoice('Bold, Powerful')))
        .then(function() {
          return browser.waitUntil(function() {
            return flow.negate(browser.getAttribute(UI.styleInput('Classy, Elegant'), 'disabled'));
          }, FORM_WAIT, 'Valid styles were not selected');
        })
        .then(function() {
          return browser.waitUntil(function() {
            return browser
              .getAttribute(UI.styleInput('Bold, Powerful'), 'value')
              .then(value => value === 'false');
          }, FORM_WAIT, 'Excess styles were not forbidden');
        })
        .then(function() {
          return browser.waitUntil(function() {
            return browser.getAttribute(UI.styleInput('Bold, Powerful'), 'disabled');
          }, FORM_WAIT, 'Excess styles were not disabled');
        })
        .then(function() {
          return browser.waitUntil(function() {
            return browser.getAttribute(UI.styleInput('Caring, Empathetic'), 'disabled');
          }, FORM_WAIT, 'Remaining styles were not disabled');
        })
        .then(delay.click(UI.styleChoice('Classy, Elegant')))
        .then(function() {
          return browser.waitUntil(function() {
            return flow.negate(browser.getAttribute(UI.styleInput('Caring, Empathetic'), 'disabled'));
          }, FORM_WAIT, 'Styles were not re-enabled');
        });
    });

  });

  describe('the body-shape picker', function() {

    it('shows an error when no body shapes are selected', function() {
      return sessions.create(urls.home)
        .submitForm(UI.form)
        .then(delay.waitForVisible(UI.errors.bodyShapes, FORM_WAIT));
    });

    it('hides the error when a body shape is selected', function() {
      return sessions.create(urls.home)
        .submitForm(UI.form)
        .then(delay.waitForVisible(UI.errors.bodyShapes, FORM_WAIT))
        .then(delay.click(UI.bodyShapeChoice('Pear')))
        .then(function() {
          return browser.waitUntil(function() {
            return flow.negate(browser.isVisible(UI.errors.bodyShapes));
          }, FORM_WAIT, 'The body-shape error was not cleared');
        });
    });

  });

  describe('the size picker', function() {

    it('shows an error when no sizes are selected', function() {
      return sessions.create(urls.home)
        .submitForm(UI.form)
        .then(delay.waitForVisible(UI.errors.sizes, FORM_WAIT));
    });

    it('hides the error when a size is selected', function() {
      return sessions.create(urls.home)
        .submitForm(UI.form)
        .then(delay.waitForVisible(UI.errors.sizes, FORM_WAIT))
        .then(delay.click(UI.sizeChoice('Petite M')))
        .then(function() {
          return browser.waitUntil(function() {
            return flow.negate(browser.isVisible(UI.errors.sizes));
          }, FORM_WAIT, 'The size error was not cleared');
        });
    });

  });

  describe('the birth-year field', function() {

    it('shows an error when no year is provided', function() {
      return sessions.create(urls.home)
        .submitForm(UI.form)
        .then(delay.waitForVisible(UI.errors.birthYear, FORM_WAIT));
    });

    it('validates the year on blur', function() {
      var error = sessions.create(urls.home)
        .setValue(ui.survey.birthYear, '')
        .then(delay.keys([keys.tab]))
        .then(delay.waitForVisible(UI.errors.birthYear, FORM_WAIT))
        .then(delay.getText(UI.errors.birthYear));

      return assert.eventually.equal(error, 'Please provide your birth year');
    });

    it('requires a recent year', function() {
      var error = sessions.create(urls.home)
        .setValue(ui.survey.birthYear, '1600')
        .then(delay.keys([keys.tab]))
        .then(delay.waitForVisible(UI.errors.birthYear, FORM_WAIT))
        .then(delay.getText(UI.errors.birthYear));

      return assert.eventually.equal(error, 'Please provide a reasonable year');
    });

    it('requires a non-future year', function() {
      var error = sessions.create(urls.home)
        .setValue(ui.survey.birthYear, '2030')
        .then(delay.keys([keys.tab]))
        .then(delay.waitForVisible(UI.errors.birthYear, FORM_WAIT))
        .then(delay.getText(UI.errors.birthYear));

      return assert.eventually.equal(error, 'Please provide a reasonable year');
    });

    it('forbids non-numeric input', function() {
      var year = sessions.create(urls.home)
        .setValue(ui.survey.birthYear, 'ten')
        .then(delay.getValue(ui.survey.birthYear));

      return assert.eventually.equal(year, '');
    });

  });

});
