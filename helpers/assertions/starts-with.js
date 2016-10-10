'use strict';

var lodash = require('lodash');

function startsWith(chai) {
  chai.assert.startsWith = function(obj, value, positiveMessage, negativeMessage) {
    var match = new RegExp('^' + lodash.escapeRegExp(value));

    var positive = `expected ${obj} to start with ${value}`;
    var negative = `expected ${obj} to not start with ${value}`;

    if (positiveMessage) { positive = `${positiveMessage}: ${positive}`; }
    if (negativeMessage) { negative = `${negativeMessage}: ${negative}`; }

    chai.assert(match.test(obj), positive, negative);
  };
}

module.exports = startsWith;
