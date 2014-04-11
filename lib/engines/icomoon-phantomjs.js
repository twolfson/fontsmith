var path = require('path'),
    url = require('url'),
    async = require('async'),
    exec = require('child_process').exec,
    icomoonPath = require.resolve('icomoon-phantomjs'),
    vm = require('vm'),
    Tempfile = require('temporary/lib/file'),
    request = require('request'),
    quote = require('shell-quote').quote,
    Zip = require('node-zip');

function IcoMoonPhantomJsEngine(options) {
  // Create a place to store files
  this.files = [];
}
IcoMoonPhantomJsEngine.prototype = {
  // Method to add new SVGs
  addSvg: function (file, cb) {
    // Save the path for later
    this.files.push(file);
    cb();
  },
  // Method to export resulting fonts/map
  'export': function (callback) {
    // Set up shared variables
    var files = this.files,
        tmp,
        zipFiles,
        namespace,
        retObj = {};

    // If there are no files, exit early
    if (files.length === 0) {
      return callback(new Error('No files were provided to `fontsmith`. Exiting early.'));
    }

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
        exec(quote(['phantomjs', icomoonPath, tmpPath]), cb);
      },
      // Handle any stderr errors
      function handleIcoMoon (stdout, stderr, cb) {
        // If there is an stderr
        if (stderr) {
          // Strip out lines that are complaints about fonts
          // https://github.com/twolfson/grunt-fontsmith/issues/10
          var errLines = stderr.split(/\n/g);
          var validErrLines = errLines.filter(function (line) {
            if (line.match(/(WARNING: Method userSpaceScaleFactor|CoreText performance note:)/)) {
              return false;
            }

            // Filter out falsy (empty) lines
            return line;
          });

          // If there still is an error, callback with it
          if (validErrLines.length) {
            var err = new Error(validErrLines.join('\n'));
            return cb(err);
          }
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
            urlPath = res.request.path;

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
      // Extract mapping for SVGs
      function pluckMapping (cb) {
        // Grab the substring of IE JS that specifies a filename mapping
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
    ], callback);
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
