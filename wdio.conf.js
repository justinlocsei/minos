exports.config = {
  specs: ['./tests/**/*.js'],
  screenshotPath: './screenshots/',
  services: ['phantomjs'],
  capabilities: [{
    browserName: 'phantomjs'
  }],

  coloredLogs: true,
  connectionRetryCount: 3,
  connectionRetryTimeout: 90000,
  logLevel: 'silent',
  maxInstances: 10,
  sync: true,
  waitforTimeout: 10000,

  framework: 'mocha',
  mochaOpts: {ui: 'bdd'},
  reporters: ['spec']
}