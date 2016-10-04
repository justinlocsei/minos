exports.config = {
  specs: ['./tests/**/*.js'],
  suites: {
    assets: ['./tests/assets/*.js'],
    files: ['./tests/files/*.js'],
    network: ['./tests/network/*.js'],
    pages: ['./tests/pages/*.js']
  },

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
  sync: false,
  waitforTimeout: 10000,

  framework: 'mocha',
  mochaOpts: {ui: 'bdd'},
  reporters: ['spec']
}
