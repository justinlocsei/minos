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
  bethanyImage: 'img[alt="Bethany"]'
};

var home = {
  bodyShapeImage: bodyShapeImage
};

module.exports = {
  about: about,
  home: home
};
