'use strict';

var fs = require('fs');
var path = require('path');

var configFile = path.resolve(__dirname, '..', 'config', 'environments.json');

var environment = process.env.MINOS_ENVIRONMENT || 'development';
var config = fs.readFileSync(configFile);
var data = JSON.parse(config)[environment];

if (!data) {
  throw new Error('No configuration available for the ' + environment + ' environment');
}

module.exports = data;
