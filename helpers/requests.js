'use strict';

var fs = require('fs');
var http = require('http');
var https = require('https');
var path = require('path');
var Promise = require('bluebird');
var request = require('request');
var urlParse = require('url').parse;

var config = require('minos/config');

var requestAsync = Promise.promisify(request);

var CERTS_DIR = path.resolve(__dirname, '..', 'config', 'certs');

/**
 * Get the self-signed CA certificate for the current environment
 *
 * @returns {Buffer}
 * @private
 */
function getCaCertificate() {
  return fs.readFileSync(path.resolve(CERTS_DIR, config.environment + '.crt'));
}

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

  if (config.usesSelfSignedCertificate) {
    settings.agentOptions = {
      ca: getCaCertificate()
    };
  }

  return requestAsync(settings);
}

/**
 * Fetch a URL as a readable stream
 *
 * This uses the correct request factory for fetching the URL, based on the
 * protocol, and uses a self-signed certificate if the environment requires one.
 *
 * @param {string} url The URL to fetch
 * @param {object} [options] Additional options to pass to http or https
 * @returns {Promise} The results of the fetching the URL
 */
function fetchStream(url, options) {
  var parsed = urlParse(url);
  var factory = parsed.protocol === 'https:' ? https : http;

  var settings = Object.assign({
    method: 'GET'
  }, options || {});

  settings.hostname = parsed.hostname;
  settings.path = parsed.path;

  if (config.usesSelfSignedCertificate) {
    settings.ca = getCaCertificate();
  }

  return new Promise(function(resolve, reject) {
    factory
      .get(settings, response => resolve(response))
      .on('error', error => reject(error))
      .end();
  });
}

module.exports = {
  fetch: fetch,
  fetchStream: fetchStream
};
