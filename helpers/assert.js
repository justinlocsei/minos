'use strict';

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

var startsWith = require('./assertions/starts-with');
var srcsetValid = require('./assertions/srcset-valid');

chai.use(chaiAsPromised);
chai.use(startsWith);
chai.use(srcsetValid);

module.exports = chai.assert;
