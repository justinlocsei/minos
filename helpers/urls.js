'use strict';

var config = require('minos/config');

var PAGE_PATHS = {
  about: 'about',
  home: '',
  robots: 'robots.txt',
  sitemap: 'sitemap.xml'
};

module.exports = Object.keys(PAGE_PATHS).reduce(function(urls, pageName) {
  urls[pageName] = config.site.replace(/\/$/, '') + '/' + PAGE_PATHS[pageName];
  return urls;
}, {});