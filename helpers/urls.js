'use strict';

var config = require('minos/config');

var PAGE_PATHS = {
  about: 'about',
  home: '',
  favicon: 'favicon.ico',
  recommendations: 'recommendations',
  robots: 'robots.txt',
  sitemap: 'sitemap.xml'
};

module.exports = Object.keys(PAGE_PATHS).reduce(function(urls, pageName) {
  urls[pageName] = config.siteUrl.replace(/\/$/, '') + '/' + PAGE_PATHS[pageName];
  return urls;
}, {});
