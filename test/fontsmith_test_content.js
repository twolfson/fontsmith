var assert = require('assert'),
    fontsmith = require('../lib/fontsmith');
module.exports = {
  "An array of SVGs": function () {
    // Set up our list of SVGs
    this.files = [
      __dirname + '/test_files/eye.svg',
      __dirname + '/test_files/moon.svg',
      __dirname + '/test_files/building_block.svg'
    ];
  },
  "rendered with fontsmith": function (done) {
    // Render with fontsmith
    var params = {src: this.files},
        that = this;
    this.timeout(60000);
    fontsmith(params, function (err, results) {
      // Save the results for later and callback
      that.results = results;
      done(err);
    });
  },
  "generates some fonts": function () {
    // TODO: Assert against expected_files
  },
  "generates an mapping from files to unicode characters": function () {
    // TODO: Assert against expected_files
  }
};