#!/usr/bin/env node

'use strict';

var yargs = require('yargs');

var gmail = require('minos/gmail');

var options = yargs
  .option('refresh', {
    alias: 'r',
    default: false,
    describe: 'Refresh the OAuth2 token'
  })
  .argv;

gmail.getAuthorization({refresh: options.refresh}).then(function(auth) {
  console.log('Authentication credentials');
  console.log('--');
  console.log(auth);
});
