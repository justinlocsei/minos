'use strict';

var bluebird = require('bluebird');

var delay = require('minos/sessions').delay;
var ui = require('minos/ui');

/**
 * Enter known good data into the survey form
 *
 * @returns {Promise}
 */
function completeSurvey() {
  var selections = [
    ui.survey.formalityChoice('Business Casual', '5+ times per week'),
    ui.survey.styleChoice('Bold, Powerful'),
    ui.survey.bodyShapeChoice('Hourglass'),
    ui.survey.sizeChoice('M')
  ];

  return bluebird
    .mapSeries(selections, selection => browser.click(selection))
    .then(delay.setValue(ui.survey.birthYear, '1984'));
}

module.exports = {
  completeSurvey: completeSurvey
};
