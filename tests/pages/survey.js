'use strict';

var bluebird = require('bluebird');
var cheerio = require('cheerio');
var lodash = require('lodash');
var parseQuerystring = require('querystring').parse;
var parseUrl = require('url').parse;

var assert = require('minos/assert');
var config = require('minos/config');
var keys = require('minos/keys');
var requests = require('minos/requests');
var sessions = require('minos/sessions');
var urls = require('minos/urls');

var UI = {
  backToTop: '.l--recommendations__basic__return-link',
  basic: '.l--recommendations__basic',
  birthYear: '#survey-birth-year',
  dismissEmail: '.l--registration-pitch__dismiss',
  dismissEmailConfirmation: '.l--registration-pitch__complete__dismiss',
  emailConfirmation: '.l--registration-pitch__complete__text',
  emailError: '.c--registration__error',
  emailForm: '.l--registration-pitch__registration',
  emailInput: '#email',
  garment: '.c--garment__preview',
  priceGroup: '.c--recommendations__price-group',
  survey: '#start-survey',
  tocGarment: '.c--basic-teaser__name',
  tocLink: '.c--basic-teaser',
  tocTitle: '.l--recommendations__title__text'
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
  var selections = [
    formalityChoice('Business Casual', '5+ times per week'),
    styleChoice('Bold, Powerful'),
    bodyShapeChoice('Hourglass'),
    sizeChoice('M')
  ];

  return bluebird.mapSeries(selections, selection => browser.click(selection))
    .then(() => browser.setValue(UI.birthYear, '1984'));
}

describe('the survey', function() {

  it('cannot be empty', function() {
    var destination = sessions.create(urls.home)
      .submitForm(UI.survey)
      .then(() => browser.getUrl());

    return assert.eventually.equal(destination, urls.home);
  });

  it('is validated on the server when JavaScript is disabled', function() {
    var error = requests.fetch(urls.home)
      .then(function(response) {
        var dom = cheerio.load(response.body);
        var survey = dom(UI.survey);

        return requests.fetch(config.siteUrl + survey.attr('action'), {
          method: survey.attr('method'),
          form: {}
        });
      }).then(function(response) {
        var dom = cheerio.load(response.body);
        return dom(ERRORS.birthYear).text();
      });

    return assert.eventually.equal(error, 'Please provide your birth year');
  });

  it('can be submitted with valid data', function() {
    var destination = sessions.create(urls.home)
      .then(() => enterValidData())
      .then(() => browser.submitForm(UI.survey))
      .then(() => browser.getUrl());

    return assert.eventually.equal(destination, urls.recommendations);
  });

  it('can be submitted with valid data when JavaScript is disabled', function() {
    var title = requests.fetch(urls.home)
      .then(function(response) {
        var dom = cheerio.load(response.body);
        var survey = dom(UI.survey);

        var form = survey.serializeArray().reduce(function(previous, field) {
          previous[field.name] = field.value;
          return previous;
        }, {});

        form.birthYear = '1984';
        form.bodyShape = 'hourglass';
        form['formalities[0].frequency'] = 'always';
        form['sizes[0].isSelected'] = 'true';
        form['styles[0].isSelected'] = 'true';

        return requests.fetch(config.siteUrl + survey.attr('action'), {
          method: survey.attr('method'),
          form: form
        });
      }).then(function(response) {
        var dom = cheerio.load(response.body);
        return dom(UI.tocTitle).text();
      });

    return assert.eventually.equal(title, 'Your Basics');
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

describe('the recommendations page', function() {

  // Get the recommendations by submitting a valid survey
  function getRecommendations() {
    return sessions.create(urls.home)
      .then(() => enterValidData())
      .then(() => browser.submitForm(UI.survey));
  }

  // Get a cheerio instance of the recommendations page's markup
  function getDom() {
    return getRecommendations()
      .then(() => browser.getSource())
      .then(source => bluebird.resolve(cheerio.load(source)));
  }

  // Get a selector for a garment in the table of contents
  function tocGarment(name) {
    return `${UI.tocGarment}=${name}`;
  }

  it('shows a table of contents with multiple basics', function() {
    var uniqueNames = getRecommendations()
      .then(() => browser.getText(UI.tocGarment))
      .then(names => lodash.uniq(names).length);

    return assert.eventually.isAbove(uniqueNames, 5);
  });

  it('ties each basic in the table of contents to a section', function() {
    var page = getRecommendations();
    var getLinks = page.then(() => browser.getAttribute(UI.tocLink, 'href'));
    var getTargets = page.then(() => browser.getAttribute(UI.basic, 'id'));

    return bluebird.all([getLinks, getTargets]).then(function(queries) {
      var links = queries[0];
      var targets = queries[1];

      var fragments = links.map(link => link.split('#')[1]);
      var valid = lodash.intersection(fragments, targets);

      assert.isAbove(fragments.length, 0);
      assert.equal(valid.length, fragments.length);
    });
  });

  it('has at least one garment for each basic', function() {
    return getDom().then(function($) {
      var $basics = $(UI.basic);
      assert.isAbove($basics.length, 0);

      $basics.each(function() {
        var $garments = $(this).find(UI.garment);
        assert.isAbove($garments.length, 1);
      });
    });
  });

  it('has a full list of garments for most basics', function() {
    return getDom().then(function($) {
      var $basics = $(UI.basic);

      var fullList = $basics
        .map(function() { return $(this).find(UI.garment).length; })
        .get()
        .filter(count => count === 6);

      var fullRatio = fullList.length / $basics.length;
      assert.isAbove(fullRatio, 0.5);
    });
  });

  it('includes the tracking ID in all Amazon links', function() {
    return getRecommendations()
      .then(() => browser.getAttribute(UI.garment, 'href'))
      .then(function(hrefs) {
        var tags = hrefs
          .filter(href => /amazon\.com/.test(href))
          .map(href => parseQuerystring(parseUrl(href).query).tag);

        assert.equal(lodash.uniq(tags).length, 1);
        assert.equal(tags[0], config.amazonTrackingId);
      });
  });

  it('includes the tracking ID in all Shopstyle links', function() {
    return getRecommendations()
      .then(() => browser.getAttribute(UI.garment, 'href'))
      .then(function(hrefs) {
        var pids = hrefs
          .filter(href => /shopstyle\.com/.test(href))
          .map(href => parseQuerystring(parseUrl(href).query).pid);

        assert.equal(lodash.uniq(pids).length, 1);
        assert.equal(pids[0], config.shopstyleId);
      });
  });

  it('has valid "back to top" links for each basic', function() {
    return getDom().then(function($) {
      var links = $(UI.backToTop)
        .map((i, el) => $(el).attr('href'))
        .get()
        .map(href => href.replace(/^#/, ''));

      assert.equal(lodash.uniq(links).length, 1);

      var target = $(`#${links[0]}`);
      assert.equal(target.length, 1);
    });
  });

  it('has valid product images for a random sampling of garments', function() {
    return getDom()
      .then(function($) {
        var garments = lodash.sampleSize($(UI.garment), 3);

        var images = garments
          .map(el => $(el).attr('style'))
          .map(style => style.match(/url\(([^\)]+)\)/)[1]);

        images.forEach(function(image) {
          assert.startsWith(image, config.imagesUrl);
        });

        return bluebird.map(images, function(image) {
          return requests.fetch(image, {method: 'HEAD'});
        });
      })
      .then(function(responses) {
        responses.forEach(function(response) {
          assert.equal(response.statusCode, 200);
        });
      });
  });

  describe('the email form', function() {

    it('is shown as a non-dismissible footer on load', function() {
      return getRecommendations()
        .then(function() {
          var formAtBottom = negate(browser.isVisibleWithinViewport(UI.emailForm));
          return assert.eventually.isTrue(formAtBottom);
        })
        .then(function() {
          var dismissVisible = browser.isVisible(UI.dismissEmail);
          return assert.eventually.isFalse(dismissVisible);
        });
    });

    it('is shown as a fixed-position footer that can be dismissed after viewing a few basics', function() {
      var garmentNames;

      return getRecommendations()
        .then(() => browser.getText(UI.tocGarment))
        .then(function(names) {
          garmentNames = names;
          var garments = lodash.sampleSize(garmentNames, 2);
          return bluebird.mapSeries(garments, function(garment) {
            return browser
              .click(tocGarment(garment))
              .then(() => browser.pause(1000));
          });
        })
        .then(function() {
          return browser.waitUntil(function() {
            return negate(browser.isVisibleWithinViewport(UI.emailForm));
          }, 500, 'The email form was prematurely shown');
        })
        .then(function() {
          var garment = lodash.sample(garmentNames);
          return browser
            .click(tocGarment(garment))
            .then(() => browser.pause(1000));
        })
        .then(function() {
          return browser.waitUntil(function() {
            return browser.isVisibleWithinViewport(UI.emailForm);
          }, 1000, 'The email form was not shown');
        })
        .then(() => browser.click(UI.dismissEmail))
        .then(function() {
          return browser.waitUntil(function() {
            return negate(browser.isVisibleWithinViewport(UI.emailForm));
          }, 2000, 'The email form was not dismissed');
        })
        .then(function() {
          var isHidden = negate(browser.isVisible(UI.emailForm));
          return assert.eventually.isFalse(isHidden);
        });
    });

    it('shows a dismissible confirmation message when given a valid email', function() {
      return getRecommendations()
        .then(() => browser.setValue(UI.emailInput, 'test@example.com'))
        .then(() => browser.keys([keys.return]))
        .then(function() {
          return browser.waitUntil(function() {
            return browser.isVisibleWithinViewport(UI.emailConfirmation);
          }, 2000, 'The email confirmation was not shown');
        });
    });

    it('prevents the use of an invalid email address', function() {
      return getRecommendations()
        .then(() => browser.setValue(UI.emailInput, 'invalid'))
        .then(() => browser.keys([keys.return]))
        .then(() => browser.waitForVisible(UI.emailError, 500))
        .then(function() {
          var confirmationVisible = browser.isVisible(UI.emailConfirmation);
          return assert.eventually.isFalse(confirmationVisible);
        });
    });

    it('is not shown to a registered user', function() {
      return getRecommendations()
        .then(() => browser.setValue(UI.emailInput, 'test@example.com'))
        .then(() => browser.keys([keys.return]))
        .then(() => browser.pause(2000))
        .then(() => browser.refresh())
        .then(function() {
          var formVisible = browser.isVisible(UI.emailForm);
          return assert.eventually.isFalse(formVisible);
        });
    });

  });

});
