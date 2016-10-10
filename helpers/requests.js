'use strict';

var cheerio = require('cheerio');
var fs = require('fs');
var http = require('http');
var https = require('https');
var path = require('path');
var Promise = require('bluebird');
var request = require('request');
var temp = require('temp').track();
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
 * Fetch a URL as an in-memory response object
 *
 * This also checks if the current environment uses a self-signed certificate
 * and passes that certificate if it is available.
 *
 * @param {string} url The URL to load
 * @param {object} [options] Additional options to pass to request
 * @returns {Promise} The results of fetching the URL
 * @resolve {object} A response object
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
 * Fetch a page as a traversable DOM object
 *
 * @param {string} url The URL to load
 * @param {object} [options] Additional options to pass to request
 * @returns {Promise} The results of parsing the URL
 * @resolve {object} A cheerio instance
 */
function fetchDom(url, options) {
  return fetch(url, options).then(function(response) {
    return cheerio.load(response.body);
  });
}

/**
 * Fetch a URL as a local file
 *
 * This stores the URL as a local temporary file, and uses a self-signed
 * certificate if the current environment requires one.
 *
 * @param {string} url The URL to load
 * @param {object} [options] Additional options to pass to request
 * @returns {Promise} The results of downloading the file
 * @resolve {string} The path to the local file
 */
function fetchFile(url, options) {
  var settings = Object.assign({
    method: 'GET'
  }, options || {});

  settings.url = url;

  if (config.usesSelfSignedCertificate) {
    settings.agentOptions = {
      ca: getCaCertificate()
    };
  }

  return new Promise(function(resolve, reject) {
    var localFile = temp.createWriteStream();
    request(settings).pipe(localFile);

    localFile
      .on('error', error => reject(error))
      .on('finish', () => resolve(localFile.path));
  });
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
 * @resolve {stream.Readable} A readable stream
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

/**
 * Create a function to get a header from a response
 *
 * @param {string} header The name of a header
 * @returns {function}
 */
function getHeader(header) {
  return function(response) {
    return response.headers[header];
  };
}

/**
 * Extract the status code from a response
 *
 * @param {object} response A response object
 * @returns {number} The status code
 */
function getStatus(response) {
  return response.statusCode;
}

module.exports = {
  fetch: fetch,
  fetchDom: fetchDom,
  fetchFile: fetchFile,
  fetchStream: fetchStream,
  getHeader: getHeader,
  getStatus: getStatus
};
