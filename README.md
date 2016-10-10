# Minos

This repository contains code for the end-to-end tests of Cover Your Basics.

## Configuration

To configure the testing environment, run the following command:

```bash
$ ./scripts/configure.sh
```

This will download Selenium and Chromedriver if they are not installed.  Once
these files are downloaded, you must set your environment to one of the keys in
the `config/environments.json` file using the `MINOS_ENVIRONMENT` environment
variable.  Once you have exported this variable, you can begin to run tests.

## Running Tests

Tests are run via a wrapper around webdriver.io, which requires a local Selenium
server to be available.  To start Selenium, run the following:

```bash
$ npm run selenium
```

Once Selenium is running, open a new tab and run the following to run all tests:

```bash
$ npm run test
```

The test runner accepts all standard webdriver.io command-line arguments, so you
can run a single test file using the following command:

```bash
$ npm run test -- --spec=tests/files/sitemap.js
```

To run tests using a browser with a GUI, you could run the following command:

```bash
$ npm run test -- --gui
```

To change the environment under which tests run, you can define a per-run
environment variable as follows:

```bash
$ MINOS_ENVIRONMENT=staging npm run test
```
