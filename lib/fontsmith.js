// Load in modules
var assert = require('assert'),
    async = require('async'),
    engines = {};

/**
 * Function which eats SVGs and outputs fonts and a mapping from file names to unicode values
 * @param {Object} params Object containing all parameters for fontsmith
 * @param {String[]} params.src Array of paths to SVGs to compile
 * @param {Function} cb Error-first function to callback with composition results
 */
function fontsmith(params, cb) {
  // Collect paths
  var files = params.src,
      retObj = {};

  // TODO: Allow specification of engine when we have more
  // TODO: By default, use an `auto` engine which falls back through engines until it finds one.
  // Load in our engine and assert it exists
  var engine = engines['icomoon-phantomjs'];
  assert(engine, 'fontsmith engine "icomoon-phantomjs" could not be loaded. Please verify its dependencies are satisfied.');

  // In series
  var palette;
  async.waterfall([
    // Create an engine to work with
    function createEngine (cb) {
      // TODO; Figure out what the options will be / where they come from
      engine.create({}, cb);
    },
    // Save the palette for external reference
    function savePalette (_palette, cb) {
      palette = _palette;
      cb();
    },
    // TODO: Each SVG might have a specified character
    // TODO: This is the equivalent of a custom `layout` as defined in spritesmith
    // Add in our svgs
    function addSvgs (cb) {
      // DEV: If we ever run into perf issue regarding this, we should make this a batch function as in spritesmith
      async.forEach(files, palette.addSvg.bind(palette), cb);
    },
    // Export the resulting fonts/map
    function exportFn (cb) {
      // Format should be {map:{'absolute/path':'\unicode'}, fonts: {svg:'binary', ttf:'binary'}}
      palette['export'](cb);
    }
  ], cb);
}

// Add ability to add new engines
function addEngine(name, engine) {
  engines[name] = engine;
}

// Expose engine adding
fontsmith.addEngine = addEngine;
fontsmith.engines = engines;

// Attempt to add in icomoon-phantomjs
var icomoonPhantomJS;
try {
  icomoonPhantomJS = require('./engines/icomoon-phantomjs.js');
} catch (e) {}

if (icomoonPhantomJS) {
  addEngine('icomoon-phantomjs', icomoonPhantomJS);
}

// Expose fontsmith
module.exports = fontsmith;