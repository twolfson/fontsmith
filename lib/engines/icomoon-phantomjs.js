var path = require('path'),
    url = require('url'),
    async = require('async'),
    exec = require('child_process').exec,
    icomoonPath = require.resolve('icomoon-phantomjs'),
    vm = require('vm'),
    Tempfile = require('temporary/lib/file'),
    request = require('request'),
    Zip = require('node-zip');

function IcoMoonPhantomJsEngine(options) {
  // Create a place to store files
  this.files = [];
}
IcoMoonPhantomJsEngine.prototype = {
  // Method to add new SVGs
  addFile: function (file, cb) {
    // Save the path for later
    this.files.push(file);
    cb();
  },
  // Method to export resulting fonts/map
  'export': function (cb) {
    // Set up shared variables
    var tmp,
        zipFiles,
        namespace,
        retObj = {};

    // In series
    async.waterfall([
      // Write paths to file
      function writeTmpFile (cb) {
        tmp = new Tempfile();
        tmp.writeFile(JSON.stringify(files), 'utf8', cb);
      },
      // Invoke icomoon-phantomjs
      function execIcoMoon (cb) {
        var tmpPath = tmp.path;
        // TODO: Move onto programatic API once its coded
        exec('phantomjs ' + icomoonPath + ' ' + tmpPath, cb);
      },
      //
      function handleIcoMoon (stdout, stderr) {
        // If there is an stderr, callback with it
        if (stderr) {
          var err = new Error(stderr);
          return cb(err);
        }

        // Otherwise, continue with stdout
        cb(null, stdout);
      },
      // Download our zip
      function downloadIcoMoonZip (zipUrl, cb) {
        request({'url': zipUrl, 'encoding': 'binary'}, cb);
      },
      // Parse out the zip
      function extractZip (res, body, cb) {
        // Prepare the zip files for easier interfacing
        var zip = new Zip(body),
            urlObj = url.parse(zipUrl),
            urlPath = urlObj.path;

        // Save the namespace and zipFiles for further iterations
        namespace = path.basename(urlPath, '.zip');
        zipFiles = zip.files;

        // Continue to the next section
        cb();
      },
      // Pluck out fonts
      function pluckFonts (cb) {
        retObj.fonts = {
          svg: zipFiles[namespace + '/fonts/icomoon.svg'].data,
          ttf: zipFiles[namespace + '/fonts/icomoon.ttf'].data,
          woff: zipFiles[namespace + '/fonts/icomoon.woff'].data,
          eot: zipFiles[namespace + '/fonts/icomoon.eot'].data,
          'dev-svg': zipFiles[namespace + '/fonts/icomoon.dev.svg'].data
        };
        cb();
      },
      function pluckMapping (cb) {
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

        // Continue
        cb();
      },
      // Callback with the formalized object
      function callbackWithResults (cb) {
        cb(null, retObj);
      }
    ], cb);
  }
};

// Async function to create a new engine
function createPalette(options, cb) {
  var palette = new IcoMoonPhantomJsEngine(options);
  cb(null, palette);
}

// Expose create and our engine
module.exports = {
  create: createPalette,
  IcoMoonPhantomJsEngine: IcoMoonPhantomJsEngine
};