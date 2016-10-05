'use strict';

var bluebird = require('bluebird');
var fs = require('fs');
var path = require('path');
var request = require('request');

var config = require('minos/config');

var requestAsync = bluebird.promisify(request);

var CERTS_DIR = path.resolve(__dirname, '..', 'config', 'certs');

/**
 * Return a promise to get a URL
 *
 * This also checks if the current environment uses a self-signed certificate
 * and passes that certificate if it is available.
 *
 * @param {string} url The URL to load
 * @param {object} [options] Additional options to pass to request
 * @returns {Promise} The results of fetching the URL
 */
function fetch(url, options) {
  var settings = Object.assign({
    method: 'GET'
  }, options || {});

  settings.url = url;

  if (config.selfSigned) {
    settings.agentOptions = {
      ca: fs.readFileSync(path.resolve(CERTS_DIR, config.environment + '.crt'))
    };
  }

  return requestAsync(settings);
}

module.exports = {
  fetch: fetch
};
