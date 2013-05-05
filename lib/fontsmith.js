// Load in modules
var assert = require('assert'),
    path = require('path'),
    url = require('url'),
    exec = require('child_process').exec,
    vm = require('vm'),
    async = require('async'),
    Tempfile = require('temporary/lib/file'),
    request = require('request'),
    Zip = require('node-zip'),
    engines = {};

/**
 * Function which eats SVGs and outputs fonts and a mapping from file names to unicode values
 * @param {Object} params Object containing all parameters for fontsmith
 * @param {String[]} params.src Array of paths to SVGs to compile
 * @param {Function} cb Error-first function to callback with composition results
 */
function fontsmith(params, cb) {
  // TODO-ISSUE: Expand to multi-engine
  // Collect paths
  var files = params.src,
      retObj = {};

  // TODO: Allow specification of engine when we have more
  // TODO: By default, use an `auto` engine which falls back through engines until it finds one.
  // Load in our engine and assert it exists
  var engine = engines['icomoon-phantomjs'];
  assert(engine, 'fontsmith engine "icomoon-phantomjs" could not be loaded. Please verify its dependencies are satisfied.');

  // In series
  var _palette;
  async.waterfall([
    // Create an engine to work with
    function createEngine (cb) {
      // TODO; Figure out what the options will be /where they come from
      engine.create({}, cb);
    },
    // Save the palette for external reference
    function savePalette (_palette, cb) {
      _palette = palette;
      cb();
    },
    // TODO: Each SVG might have a specified character
    // TODO: This is the equivalent of a custom `layout` as defined in spritesmith
    // Add in our svgs
    function addSvgs (cb) {
      // TODO: If we ever run into perf issue regarding this, we should make this a batch function as in spritesmith
      async.forEach(files, palette.addSvg.bind(palette), cb);
    },
    // Export the resulting fonts/map
    function exportFn (cb) {
      palette['export'](cb);
    }
  ], cb);

  // TODO: These are part of export
  // Write paths to file
  var tmp = new Tempfile();
  tmp.writeFileSync(JSON.stringify(files), 'utf8');

  // TODO: This should be engine.export(cb)
  // TODO: Move onto programatic API once its coded
  // TODO: Move to async.waterfall
  // Invoke icomoon-phantomjs
  var tmpPath = tmp.path;
  exec('phantomjs ' + icomoonPath + ' ' + tmpPath, function (err, stdout, stderr) {
    // Fallback err with stderr
    if (!err && stderr) {
      err = new Error(stderr);
    }

    // If there is an error, callback with it
    if (err) {
      return cb(err);
    }

    // Otherwise, download our zip
    var zipUrl = stdout;
    request({'url': zipUrl, 'encoding': 'binary'}, function (err, res, body) {
      // If there is an error, callback with it
      if (err) {
        return cb(err);
      }

      // Otherwise, parse the zip
      var zip = new Zip(body);

      // Pluck out items from zip via `node-zip`
      var urlObj = url.parse(zipUrl),
          urlPath = urlObj.path,
          namespace = path.basename(urlPath, '.zip'),
          zipFiles = zip.files;

      // Pluck out fonts
      retObj.fonts = {
        svg: zipFiles[namespace + '/fonts/icomoon.svg'].data,
        ttf: zipFiles[namespace + '/fonts/icomoon.ttf'].data,
        woff: zipFiles[namespace + '/fonts/icomoon.woff'].data,
        eot: zipFiles[namespace + '/fonts/icomoon.eot'].data,
        'dev-svg': zipFiles[namespace + '/fonts/icomoon.dev.svg'].data
      };

      // Extract mapping for SVGs
      var ieJs = zipFiles[namespace + '/lte-ie7.js'].data,
          iconsVarSubstr = ieJs.match(/var\s*icons[^\}]+}/)[0];
          iconWindow = {};
      vm.runInNewContext(iconsVarSubstr, iconWindow);

      // Pluck out namespaced keys and get off of HTML entities
      var iconNamespaceObj = iconWindow.icons,
          iconNamespaceKeys = Object.getOwnPropertyNames(iconNamespaceObj),
          iconObj = {};
      iconNamespaceKeys.forEach(function (nsKey) {
        var key = nsKey.replace('icon-', ''),
            strVal = iconNamespaceObj[nsKey].replace('&#x', '').replace(';'),
            val = parseInt(strVal, 16);
        iconObj[key] = val;
      });

      // Save the normalized iconKey
      retObj.map = iconObj;

      // Callback with {map:{'absolute/path':'\unicode'}, fonts: {svg:'binary', ttf:'binary'}}
      cb(null, retObj);
    });
  });
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