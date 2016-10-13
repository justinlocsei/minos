'use strict';

require('minos/mocha');

var bluebird = require('bluebird');
var cheerio = require('cheerio');
var lodash = require('lodash');
var parseQuerystring = require('querystring').parse;
var parseUrl = require('url').parse;

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

describe('the recommendations page', function() {

  // UI selectors for the recommendations page
  var UI = ui.recommendations;

  // Get the recommendations by submitting a valid survey
  function getRecommendations() {
    return sessions.create(urls.home)
      .then(browser.deleteCookie)
      .then(actions.completeSurvey)
      .then(delay.submitForm(ui.survey.form));
  }

  // Get a cheerio instance of the recommendations page's markup
  function getDom() {
    return getRecommendations()
      .then(browser.getSource)
      .then(source => bluebird.resolve(cheerio.load(source)));
  }

  it('shows a table of contents with multiple basics', function() {
    var uniqueNames = getRecommendations()
      .then(delay.getText(UI.tocGarments))
      .then(names => lodash.uniq(names).length);

    return assert.eventually.isAbove(uniqueNames, 5);
  });

  it('ties each basic in the table of contents to a section', function() {
    var page = getRecommendations();
    var getLinks = page.then(delay.getAttribute(UI.tocLink, 'href'));
    var getTargets = page.then(delay.getAttribute(UI.basic, 'id'));

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
        var $garments = $(this).find(UI.garments);
        assert.isAbove($garments.length, 1);
      });
    });
  });

  it('has a full list of garments for most basics', function() {
    return getDom().then(function($) {
      var $basics = $(UI.basic);

      var fullList = $basics
        .map(function() { return $(this).find(UI.garments).length; })
        .get()
        .filter(count => count === 6);

      var fullRatio = fullList.length / $basics.length;
      assert.isAbove(fullRatio, 0.5);
    });
  });

  it('includes the tracking ID in all Amazon links', function() {
    return getRecommendations()
      .then(delay.getAttribute(UI.garments, 'href'))
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
      .then(delay.getAttribute(UI.garments, 'href'))
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
      var links = $(UI.backToTopLinks)
        .map((i, el) => $(el).attr('href'))
        .get()
        .map(href => href.replace(/^#/, ''));

      assert.equal(lodash.uniq(links).length, 1);

      var target = $(`#${links[0]}`);
      assert.equal(target.length, 1);
    });
  });

  it('returns to the table of contents when clicking a "back to top" link', function() {
    var link = `(//*[contains(@class, "${UI.backToTopLinks.substr(1)}")])[last()]`;

    return getRecommendations()
      .then(delay.scroll(link))
      .then(delay.click(link))
      .then(function() {
        return browser.waitUntil(function() {
          return browser.isVisibleWithinViewport(UI.tocTitle);
        }, 1000, 'The table of contents was not returned to');
      });
  });

  it('has valid product images for a random sampling of garments', function() {
    return getDom()
      .then(function($) {
        var garments = lodash.sampleSize($(UI.garments), 3);

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
          var formAtBottom = flow.negate(browser.isVisibleWithinViewport(UI.emailForm));
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
        .then(delay.getText(UI.tocGarments))
        .then(function(names) {
          garmentNames = names;
          var garments = lodash.sampleSize(garmentNames, 2);
          return bluebird.mapSeries(garments, function(garment) {
            return browser
              .click(UI.tocGarment(garment))
              .then(delay.pause(1000));
          });
        })
        .then(function() {
          return browser.waitUntil(function() {
            return flow.negate(browser.isVisibleWithinViewport(UI.emailForm));
          }, 500, 'The email form was prematurely shown');
        })
        .then(function() {
          var garment = lodash.sample(garmentNames);
          return browser
            .click(UI.tocGarment(garment))
            .then(delay.pause(1000));
        })
        .then(function() {
          return browser.waitUntil(function() {
            return browser.isVisibleWithinViewport(UI.emailForm);
          }, 1000, 'The email form was not shown');
        })
        .then(delay.click(UI.dismissEmail))
        .then(function() {
          return browser.waitUntil(function() {
            return flow.negate(browser.isVisibleWithinViewport(UI.emailForm));
          }, 2000, 'The email form was not dismissed');
        })
        .then(function() {
          var isHidden = flow.negate(browser.isVisible(UI.emailForm));
          return assert.eventually.isFalse(isHidden);
        });
    });

    it('shows a dismissible confirmation message when given a valid email', function() {
      return getRecommendations()
        .then(delay.setValue(UI.emailInput, config.emailAddress))
        .then(delay.keys([keys.return]))
        .then(function() {
          return browser.waitUntil(function() {
            return browser.isVisibleWithinViewport(UI.emailConfirmation);
          }, 2000, 'The email confirmation was not shown');
        })
        .then(function() {
          return browser.waitUntil(function() {
            return browser.isVisible(UI.dismissEmailConfirmation);
          }, 2000, 'The dismiss button was not shown');
        })
        .then(delay.pause(2000))
        .then(delay.click(UI.dismissEmailConfirmation))
        .then(function() {
          return browser.waitUntil(function() {
            return flow.negate(browser.isVisible(UI.emailForm));
          }, 1000, 'The confirmation was not dismissed');
        });
    });

    it('prevents the use of an invalid email address', function() {
      return getRecommendations()
        .then(delay.setValue(UI.emailInput, 'invalid'))
        .then(delay.click(UI.emailSubmit))
        .then(delay.waitForVisible(UI.emailError, 500))
        .then(function() {
          var confirmationVisible = browser.isVisible(UI.emailConfirmation);
          return assert.eventually.isFalse(confirmationVisible);
        });
    });

    it('is not shown to a registered user', function() {
      return getRecommendations()
        .then(delay.setValue(UI.emailInput, config.emailAddress))
        .then(delay.keys([keys.return]))
        .then(delay.pause(2000))
        .then(browser.refresh)
        .then(function() {
          var formVisible = browser.isVisible(UI.emailForm);
          return assert.eventually.isFalse(formVisible);
        });
    });

  });

});
