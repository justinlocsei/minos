'use strict';

/**
 * Return a selector for a body-shape image
 *
 * @param {string} name The name of the body shape
 * @returns {string}
 */
function bodyShapeImage(name) {
  return `//span[text()="${name}"]/preceding-sibling::img`;
}

var about = {
  bethanyImage: 'img[alt="Bethany"]',
  startSurvey: '.l--about__cta-button'
};

var home = {
  bodyShapeImage: bodyShapeImage,
  bodyShapeImages: 'img[class*="body-shape"]',
  formalityImages: 'img[class*="formality"]',
  pitchGraphic: '.l--pitch [class*="graphic"]',
  startSurvey: '.l--pitch__button'
};

var shared = {
  facebookTitleMeta: 'meta[property="og:title"]',
  facebookUrlMeta: 'meta[property="og:url"]'
};

var survey = {
  form: '#start-survey'
};

module.exports = {
  about: about,
  home: home,
  shared: shared,
  survey: survey
};
