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

The credentials for the Gmail API can be downloaded from the Google APIs
dashboard.  Once you have downloaded this file and set its path via the
environment variable, you must grant the Gmail API access to your account by
running the following:

```sh
$ npm run authorize-gmail
```

## Running Tests

```sh
# Start selenium in the foreground
$ npm run selenium

# Run the main tests in another session
$ npm run test

# Run a specific test file
$ scripts/test --spec=tests/files/sitemap.js

# Run the main tests in a browser with a GUI
$ npm run test:gui

# Test the email workflow
$ npm run test:email

# Use a custom environment for a single run of tests
$ MINOS_ENVIRONMENT=staging npm run test
```
