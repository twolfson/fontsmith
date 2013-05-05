// Load in modules
var exec = require('child_process').exec,
    icomoonPath = require.resolve('icomoon-phantomjs'),
    Tempfile = require('temporary/lib/file'),
    request = require('request'),
    Zip = require('node-zip');

// DEV: We use a single parameter rather than (paths, options, cb)
// since we are developing for grunt which is easier to interface a single object with
/**
 * Collect SVGs into multiple fonts and a character code mapping
 * @param {Object} params Object containing all parameters for fontsmith
 * @param {String[]} params.src Array of paths to SVGs to compile
 * @param {Function} cb Error-first function to callback with composition results
 */
function fontsmith(params, cb) {
  // TODO-ISSUE: Expand to multi-engine
  // Collect paths
  // TODO: This should be engine.create(options, cb)
  var files = params.src;

  // TODO: This should be engine.addFile(file, cb)
  // Write paths to file
  var tmp = new Tempfile();
  tmp.writeFileSync(JSON.stringify(files), 'utf8');

  // TODO: This should be engine.export(cb)
  // TODO: Move onto programatic API once its coded
  // TODO: Move to async.waterfall
  // Invoke icomoon-phantomjs
  var tmpPath = tmp.path;
  console.log('phantomjs ' + icomoonPath + ' ' + tmpPath);
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
      console.log(zipUrl);
      console.log(url.parse(zipUrl));
    });
  });
  // TODO: Extract values
  // TODO: Callback with {map:{'absolute/path':'\unicode'}, fonts: {svg:'binary', ttf:'binary'}}
}

// Expose fontsmith
module.exports = fontsmith;