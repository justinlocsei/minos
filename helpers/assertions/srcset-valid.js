'use strict';

var bluebird = require('bluebird');
var lodash = require('lodash');
var sizeOf = require('image-size');

var requests = require('minos/requests');

function srcsetValid(chai) {
  function checkValidity(srcset) {
    var srcs = srcset.split(',').map(src => src.trim());

    var bySize = srcs.reduce(function(previous, src) {
      var parts = src.split(' ');
      var url = parts[0];
      var density = parseFloat(parts[1].replace(/x$/, ''), 10);

      previous[density] = url;
      return previous;
    }, {});

    var sortedBySize = Object.keys(bySize).sort().map(k => bySize[k]);
    chai.assert.isAbove(sortedBySize.length, 1, 'only one pixel density provided');

    var imageRequests = bluebird.map(sortedBySize, url => requests.fetchFile(url));

    return bluebird.all(imageRequests)
      .then(function(images) {
        var dimensions = images.map(image => sizeOf(image));
        var heights = dimensions.map(d => d.height);
        var widths = dimensions.map(d => d.width);

        chai.assert.deepEqual(heights, lodash.sortBy(heights), 'expected heights to increase with density');
        chai.assert.deepEqual(widths, lodash.sortBy(widths), 'expected heights to increase with density');
      });
  }

  chai.assert.eventually.srcsetValid = function(getSrcset) {
    return getSrcset.then(checkValidity);
  };
}

module.exports = srcsetValid;
