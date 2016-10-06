'use strict';

var lodash = require('lodash');

function startsWith(chai) {
  chai.assert.startsWith = function(obj, value) {
    var match = new RegExp('^' + lodash.escapeRegExp(value));

    chai.assert(
      match.test(obj),
      `expected ${obj} to start with ${value}`,
      `expected ${obj} to not start with ${value}`
    );
  };
}

module.exports = startsWith;
