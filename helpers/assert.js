'use strict';

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

var startsWith = require('./assertions/starts-with');

chai.use(chaiAsPromised);
chai.use(startsWith);

module.exports = chai.assert;
