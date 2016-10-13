#!/bin/bash

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR/vendor" || exit 1
java -jar selenium.jar -Dwebdriver.chrome.driver=chromedriver
