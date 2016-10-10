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
  bodyShapeImage: bodyShapeImage
};

var shared = {
  facebookTitleMeta: 'meta[property="og:title"]',
  facebookUrlMeta: 'meta[property="og:url"]'
};

module.exports = {
  about: about,
  home: home,
  shared: shared
};
