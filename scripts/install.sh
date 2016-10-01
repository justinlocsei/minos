#!/bin/bash

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SCREENSHOTS_DIR="$ROOT_DIR/screenshots"
VENDOR_DIR="$ROOT_DIR/vendor"

SELENIUM_VERSION="2.53"

# Create all required directories
create_directories() {
  for dir in "$SCREENSHOTS_DIR" "$VENDOR_DIR"; do
    mkdir -p "$dir"
  done
}

# Install the standalone Selenium server
install_selenium() {
  local selenium_jar="$VENDOR_DIR/selenium-$SELENIUM_VERSION.jar"

  if [ ! -f "$selenium_jar" ]; then
    curl http://selenium-release.storage.googleapis.com/$SELENIUM_VERSION/selenium-server-standalone-$SELENIUM_VERSION.0.jar --output "$selenium_jar"
  fi

  ln -fs "$selenium_jar" "$VENDOR_DIR/selenium.jar"
}

create_directories
install_selenium
