# Minos

This repository contains code for the Cover Your Basics end-to-end tests.

## Configuration

To configure the testing environment, run the following command:

```sh
$ ./scripts/configure
```

This will download Selenium and ChromeDriver if they are not installed.  Once
these files are downloaded, you must set the following environment variables:

- `MINOS_ENVIRONMENT`: One of the keys in the `config/environments.json` file
- `MINOS_GOOGLE_API_CREDENTIALS`: The absolute path to the API credentials JSON file

## Running Tests

Tests are run via a wrapper around webdriver.io, which requires a local Selenium
server to be available.  To start Selenium, run the following:

```sh
$ npm run selenium
```

Once Selenium is running, open a new tab and run the following to run all tests:

```sh
$ npm run test
```

The test runner accepts all standard webdriver.io command-line arguments, so you
can run a single test file using the following command:

```sh
$ npm run test -- --spec=tests/files/sitemap.js
```

To run tests using a browser with a GUI, you could run the following command:

```sh
$ npm run test:gui
```

To change the environment under which tests run, you can define a per-run
environment variable as follows:

```sh
$ MINOS_ENVIRONMENT=staging npm run test
```
