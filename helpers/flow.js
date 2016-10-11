'use strict';

/**
 * Negate a promise's value
 *
 * @param {Promise} promise A promise
 * @returns {Promise} The negated promise
 */
function negate(promise) {
  return promise.then(result => !result);
}

module.exports = {
  negate: negate
};
