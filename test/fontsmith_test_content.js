var assert = require('assert'),
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
    // DEV: Write out fonts to files
    var fonts = this.results.fonts;
    if (true) {
      try { fs.mkdirSync(__dirname + '/actual_files'); } catch (e) {}
      fs.writeFileSync(__dirname + '/actual_files/font.svg', fonts.svg, 'binary');
      fs.writeFileSync(__dirname + '/actual_files/font.ttf', fonts.ttf, 'binary');
      fs.writeFileSync(__dirname + '/actual_files/font.otf', fonts.otf, 'binary');
      fs.writeFileSync(__dirname + '/actual_files/font.woff', fonts.woff, 'binary');
      fs.writeFileSync(__dirname + '/actual_files/font.eot', fonts.eot, 'binary');
      fs.writeFileSync(__dirname + '/actual_files/font.dev.svg', fonts['dev-svg'], 'binary');
    }

    // TODO: Assert against expected_files
    // console.log(fonts);
  },
  "generates an mapping from files to unicode characters": function () {
    var map = this.results.map;
    // DEV: Hex equivalent of 'e000'
    assert.strictEqual(map.building_block, 57344);
    assert.strictEqual(map.moon, 57345);
    assert.strictEqual(map.eye, 57346);
  }
};