'use strict';

var fs = require('fs');
var google = require('googleapis');
var GoogleAuth = require('google-auth-library');
var moment = require('moment');
var path = require('path');
var Promise = require('bluebird');
var readline = require('readline');

var config = require('minos/config');

var readFile = Promise.promisify(fs.readFile);

var SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

var VENDOR_DIR = path.resolve(__dirname, '..', 'vendor');
var SECRETS_PATH = process.env.MINOS_GOOGLE_API_CREDENTIALS;
var TOKEN_PATH = path.join(VENDOR_DIR, 'gmail-api.json');

/**
 * Retrieve the most recent message from the recipient's inbox
 *
 * @param {string} recipient The recipient address
 * @param {object} options Options for fetching the message
 * @param {moment} options.sentAfter A time after which the message must be sent
 * @param {string} options.subject The message's subject
 * @returns {Promise}
 * @resolve {object} The raw message object
 */
function fetchLastMessage(recipient, options) {
  return getAuthorization().then(function(auth) {
    var gmail = google.gmail({
      auth: auth,
      version: 'v1'
    });

    var query = {
      after: options.sentAfter.clone().subtract(1, 'day').format('YYYY/M/D'),
      is: 'unread',
      label: 'testing',
      subject: options.subject,
      to: recipient
    };

    var queryPairs = Object.keys(query).reduce(function(previous, key) {
      previous.push(`${key}:${query[key]}`);
      return previous;
    }, []);

    var listQuery = {
      q: queryPairs.join(' '),
      userId: config.emailAddress
    };

    return new Promise(function(resolve, reject) {
      gmail.users.messages.list(listQuery, function(listError, listResponse) {
        if (listError) { return reject(listError); }

        var messages = listResponse.messages;
        if (!messages || messages.length === 0) {
          return resolve(null);
        }

        var getQuery = {
          id: messages[0].id,
          userId: config.emailAddress
        };

        return gmail.users.messages.get(getQuery, function(getError, getResponse) {
          if (getError) { return reject(getError); }

          var message = getResponse;
          var headers = message.payload.headers.reduce(function(previous, header) {
            previous[header.name] = header.value;
            return previous;
          }, {});

          var sentAt = moment(headers.Date, 'ddd, DD MMM YYYY HH:mm:ss Z');
          if (sentAt.isBefore(options.sentAfter, 'seconds')) {
            return resolve(null);
          }

          return resolve({
            headers: headers,
            message: message
          });
        });
      });
    });
  });
}

/**
 * Get authentication information for an OAuth2 client
 *
 * @param {object} [options] Options for authenticating
 * @param {boolean} options.refresh Whether to refresh the token
 * @returns {Promise}
 * @resolve {google.auth.OAuth2} Authentication data
 */
function getAuthorization(options) {
  var settings = Object.assign({
    refresh: false
  }, options || {});

  return readFile(SECRETS_PATH)
    .then(function(secrets) {
      var credentials = JSON.parse(secrets);
      return authorizeClient(credentials, settings.refresh);
    });
}

/**
 * Generate OAuth2 authentication credentials
 *
 * @param {object} credentials The authorization-client credentials
 * @param {boolean} refresh Whether to refresh the token
 * @returns {Promise}
 * @resolve {google.auth.OAuth2} An authorized OAuth2 client
 */
function authorizeClient(credentials, refresh) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];

  var auth = new GoogleAuth();
  var client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  return readFile(TOKEN_PATH)
    .then(function(token) {
      if (refresh) {
        return createToken(client);
      } else {
        client.credentials = JSON.parse(token);
        return client;
      }
    })
    .catch(function() {
      return createToken(client);
    });
}

/**
 * Create and store a new OAuth2 access token
 *
 * @param {google.auth.OAuth2} client An unauthorized OAuth2 client
 * @returns {Promise}
 * @resolve {object} An access token
 */
function createToken(client) {
  var authUrl = client.generateAuthUrl({
    'access_type': 'offline',
    'scope': SCOPES
  });

  console.log(`Grant access to GMail by visiting ${authUrl}`);

  var reader = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(function(resolve, reject) {
    reader.question('Enter the code from that page here: ', function(code) {
      reader.close();

      client.getToken(code, function(getError, token) {
        if (getError) { return reject(getError); }

        client.credentials = token;
        return fs.writeFile(TOKEN_PATH, JSON.stringify(token), function(writeError) {
          if (writeError) {
            reject(writeError);
          } else {
            resolve(client);
          }
        });
      });
    });
  });
}

module.exports = {
  fetchLastMessage: fetchLastMessage,
  getAuthorization: getAuthorization
};
