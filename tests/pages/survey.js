'use strict';

var bluebird = require('bluebird');

var assert = require('minos/assert');
var keys = require('minos/keys');
var sessions = require('minos/sessions');
var urls = require('minos/urls');

var UI = {
  birthYear: '#survey-birth-year',
  survey: '#start-survey'
};

var ERRORS = {
  birthYear: '.c--birth-year-picker__error',
  bodyShapes: 'p=Please select your body shape',
  formalities: 'p=Please select at least one frequency',
  sizes: 'p=Please select at least one size',
  styles: 'p=Please select at least one style'
};

// Return a selector for a formality frequency
function formalityChoice(formality, frequency) {
  return `//legend[text()="${formality}"]/..//label[text()="${frequency}"]`;
}

// Return a selector for a style choice
function styleChoice(name) {
  return `label=${name}`;
}

// Return a selector for a style's input
function styleInput(name) {
  return `//label[text()="${name}"]/preceding-sibling::input`;
}

// Return a selector for a size choice
function sizeChoice(name) {
  return `.c--size-picker__size__name=${name}`;
}

// Return a selector for a body-shape choice
function bodyShapeChoice(name) {
  return `.c--body-shape__example__caption=${name}`;
}

// A helper function to reverse the result of a promise
function negate(promise) {
  return promise.then(result => !result);
}

// Enter known good data for the survey
function enterValidData() {
  return sessions.create(urls.home)
    .then(function() {
      return bluebird.mapSeries([
        formalityChoice('Casual', 'Occasionally'),
        styleChoice('Bold, Powerful'),
        bodyShapeChoice('Hourglass'),
        sizeChoice('Petite M')
      ], selection => browser.click(selection));
    })
    .then(() => browser.setValue(UI.birthYear, '1984'));
}

describe('the survey', function() {

  it('cannot be empty', function() {
    var destination = sessions.create(urls.home)
      .submitForm(UI.survey)
      .then(() => browser.getUrl());

    return assert.eventually.equal(destination, urls.home);
  });

  it('can be submitted with valid data', function() {
    var destination = enterValidData()
      .then(() => browser.submitForm(UI.survey))
      .then(() => browser.getUrl());

    return assert.eventually.equal(destination, urls.recommendations);
  });

  describe('the formality picker', function() {

    it('scrolls to an error when no formalities are selected', function() {
      return sessions.create(urls.home)
        .submitForm(UI.survey)
        .then(() => browser.waitForVisible(ERRORS.formalities, 500))
        .then(function() {
          return browser.waitUntil(function() {
            return browser.isVisibleWithinViewport(ERRORS.formalities);
          }, 1000, 'The formality error was visible but not scrolled to');
        });
    });

    it('hides the error error when a single formality has been selected', function() {
      return sessions.create(urls.home)
        .submitForm(UI.survey)
        .then(() => browser.waitForVisible(ERRORS.formalities, 500))
        .then(() => browser.click(formalityChoice('Casual', 'Occasionally')))
        .then(function() {
          return browser.waitUntil(function() {
            return negate(browser.isVisible(ERRORS.formalities));
          }, 1000, 'The formality error was not cleared');
        });
    });

    it('does not hide the error when only never is selected', function() {
      return sessions.create(urls.home)
        .submitForm(UI.survey)
        .then(() => browser.waitForVisible(ERRORS.formalities, 500))
        .then(() => browser.click(formalityChoice('Casual', 'Occasionally')))
        .then(() => browser.waitForVisible(ERRORS.formalities, 500, true))
        .then(() => browser.click(formalityChoice('Casual', 'Never')))
        .then(() => browser.waitForVisible(ERRORS.formalities, 500));
    });

    it('hides the error when at least one non-never value is selected', function() {
      return sessions.create(urls.home)
        .submitForm(UI.survey)
        .then(() => browser.waitForVisible(ERRORS.formalities, 500))
        .then(() => browser.click(formalityChoice('Casual', 'Occasionally')))
        .then(() => browser.waitForVisible(ERRORS.formalities, 500, true))
        .then(() => browser.click(formalityChoice('Dressy Casual', 'Never')))
        .then(() => browser.waitForVisible(ERRORS.formalities, 500, true));
    });

  });

  describe('the style picker', function() {

    it('shows an error when no styles are selected', function() {
      return sessions.create(urls.home)
        .submitForm(UI.survey)
        .then(() => browser.waitForVisible(ERRORS.styles, 500));
    });

    it('hides the error when a style is selected', function() {
      return sessions.create(urls.home)
        .submitForm(UI.survey)
        .then(() => browser.waitForVisible(ERRORS.styles, 500))
        .then(() => browser.click(styleChoice('Creative, Fun')))
        .then(function() {
          return browser.waitUntil(function() {
            return negate(browser.isVisible(ERRORS.styles));
          }, 1000, 'The style error was not cleared');
        });
    });

    it('disables the styles when three have been selected', function() {
      return sessions.create(urls.home)
        .submitForm(UI.survey)
        .then(() => browser.click(styleChoice('Creative, Fun')))
        .then(() => browser.click(styleChoice('Sleek, Efficient')))
        .then(() => browser.click(styleChoice('Classy, Elegant')))
        .then(() => browser.click(styleChoice('Bold, Powerful')))
        .then(function() {
          return browser.waitUntil(function() {
            return negate(browser.getAttribute(styleInput('Classy, Elegant'), 'disabled'));
          }, 500, 'Valid styles were not selected');
        })
        .then(function() {
          return browser.waitUntil(function() {
            return browser
              .getAttribute(styleInput('Bold, Powerful'), 'value')
              .then(value => value === 'false');
          }, 500, 'Excess styles were not forbidden');
        })
        .then(function() {
          return browser.waitUntil(function() {
            return browser.getAttribute(styleInput('Bold, Powerful'), 'disabled');
          }, 500, 'Excess styles were not disabled');
        })
        .then(function() {
          return browser.waitUntil(function() {
            return browser.getAttribute(styleInput('Caring, Empathetic'), 'disabled');
          }, 500, 'Remaining styles were not disabled');
        })
        .then(() => browser.click(styleChoice('Classy, Elegant')))
        .then(function() {
          return browser.waitUntil(function() {
            return negate(browser.getAttribute(styleInput('Caring, Empathetic'), 'disabled'));
          }, 500, 'Styles were not re-enabled');
        });
    });

  });

  describe('the body-shape picker', function() {

    it('shows an error when no body shapes are selected', function() {
      return sessions.create(urls.home)
        .submitForm(UI.survey)
        .then(() => browser.waitForVisible(ERRORS.bodyShapes, 500));
    });

    it('hides the error when a body shape is selected', function() {
      return sessions.create(urls.home)
        .submitForm(UI.survey)
        .then(() => browser.waitForVisible(ERRORS.bodyShapes, 500))
        .then(() => browser.click(bodyShapeChoice('Pear')))
        .then(function() {
          return browser.waitUntil(function() {
            return negate(browser.isVisible(ERRORS.bodyShapes));
          }, 1000, 'The body-shape error was not cleared');
        });
    });

  });

  describe('the size picker', function() {

    it('shows an error when no sizes are selected', function() {
      return sessions.create(urls.home)
        .submitForm(UI.survey)
        .then(() => browser.waitForVisible(ERRORS.sizes, 500));
    });

    it('hides the error when a size is selected', function() {
      return sessions.create(urls.home)
        .submitForm(UI.survey)
        .then(() => browser.waitForVisible(ERRORS.sizes, 500))
        .then(() => browser.click(sizeChoice('Petite M')))
        .then(function() {
          return browser.waitUntil(function() {
            return negate(browser.isVisible(ERRORS.sizes));
          }, 1000, 'The size error was not cleared');
        });
    });

  });

  describe('the birth-year field', function() {

    it('shows an error when no year is provided', function() {
      return sessions.create(urls.home)
        .submitForm(UI.survey)
        .then(() => browser.waitForVisible(ERRORS.birthYear, 500));
    });

    it('validates the year on blur', function() {
      var error = sessions.create(urls.home)
        .setValue(UI.birthYear, '')
        .then(() => browser.keys([keys.tab]))
        .then(() => browser.waitForVisible(ERRORS.birthYear, 500))
        .then(() => browser.getText(ERRORS.birthYear));

      return assert.eventually.equal(error, 'Please provide your birth year');
    });

    it('requires a recent year', function() {
      var error = sessions.create(urls.home)
        .setValue(UI.birthYear, '1600')
        .then(() => browser.keys([keys.tab]))
        .then(() => browser.waitForVisible(ERRORS.birthYear, 500))
        .then(() => browser.getText(ERRORS.birthYear));

      return assert.eventually.equal(error, 'Please provide a reasonable year');
    });

    it('requires a non-future year', function() {
      var error = sessions.create(urls.home)
        .setValue(UI.birthYear, '2030')
        .then(() => browser.keys([keys.tab]))
        .then(() => browser.waitForVisible(ERRORS.birthYear, 500))
        .then(() => browser.getText(ERRORS.birthYear));

      return assert.eventually.equal(error, 'Please provide a reasonable year');
    });

    it('forbids non-numeric input', function() {
      var year = sessions.create(urls.home)
        .setValue(UI.birthYear, 'ten')
        .then(() => browser.getValue(UI.birthYear));

      return assert.eventually.equal(year, '');
    });

  });

});
