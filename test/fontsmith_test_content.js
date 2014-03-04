var assert = require('assert'),
    _s = require('underscore.string'),
    fs = require('fs'),
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
  "An empty array of SVGs": function () {
    this.files = [];
  },
  "rendered with fontsmith": function (done) {
    // Render with fontsmith
    var params = {src: this.files},
        that = this;
    this.timeout(60000);
    fontsmith(params, function (err, results) {
      // Save the results for later and callback
      that.results = results;
      that.err = err;
      done();
    });
  },
  "had no errors": function () {
    assert.strictEqual(this.err, null);
  },
  "generates some fonts": function () {
    var fonts = this.results.fonts;

    // DEV: Write out fonts to files
    try { fs.mkdirSync(__dirname + '/actual_files'); } catch (e) {}
    fs.writeFileSync(__dirname + '/actual_files/font.svg', fonts.svg, 'binary');
    fs.writeFileSync(__dirname + '/actual_files/font.ttf', fonts.ttf, 'binary');
    fs.writeFileSync(__dirname + '/actual_files/font.woff', fonts.woff, 'binary');
    fs.writeFileSync(__dirname + '/actual_files/font.eot', fonts.eot, 'binary');
    fs.writeFileSync(__dirname + '/actual_files/font.dev.svg', fonts['dev-svg'], 'binary');

    // Assert SVG separately from binary content
    var ext = 'svg',
        filepath = __dirname + '/expected_files/font.' + ext,
        actualContent = fonts[ext],
        expectedContent = fs.readFileSync(filepath, 'binary'),
        bitDiff = _s.levenshtein(actualContent, expectedContent),
        isPassing = bitDiff < 50;
    assert(isPassing, 'Font "' + ext + '" is ' + bitDiff + ' different from expected');

    // ANTI-PATTERN: Using a forEach for distinguishable items -- losing sense of the context/stackTrace
    ['eot', 'ttf', 'woff'].forEach(function (ext) {
      var actualContent = fonts[ext];
      assert(actualContent, 'Expected font "' + ext + '" to not be empty');
    });
  },
  "generates an mapping from files to unicode characters": function () {
    var map = this.results.map;
    // DEV: Hex equivalent of 'e000'
    assert(map.building_block >= 57344);
    assert(map.moon >= 57344);
    assert(map.eye >= 57344);
  },
  "notifies the user that there we no fonts found": function () {
    assert(this.err.message.match('No files were provided'));
  }
};
