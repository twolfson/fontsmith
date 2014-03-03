# fontsmith [![Build status](https://travis-ci.org/twolfson/fontsmith.png?branch=master)](https://travis-ci.org/twolfson/fontsmith)

Collect SVGs into multiple fonts and a character code mapping

## Getting Started
Install the module with: `npm install fontsmith`

```javascript
var fontsmith = require('fontsmith');
fontsmith({src: ['paths', 'to', 'svgs']}, function (err, res) {
  res.map; // Map of file name to unicode value for character
  res.fonts; // Object containing binary string representations of fonts (e.g. {svg, ttf, woff, eot})
});
```

## Dependencies
Currently, there is only the [icomoon-phantomjs][icomoon-phantomjs] engine.

[icomoon-phantomjs]: https://github.com/twolfson/icomoon-phantomjs

### icomoon-phantomjs
This requires installing [phantomjs][phantomjs] and having it accessible from your path (i.e. `phantomjs --version` will work).

[phantomjs]: http://www.phantomjs.org/

## Documentation
`fontsmith` provides a single function as its export.
```js
/**
 * Function which eats SVGs and outputs fonts and a mapping from file names to unicode values
 * @param {Object} params Object containing all parameters for fontsmith
 * @param {String[]} params.src Array of paths to SVGs to compile
 * @param {Function} cb Error-first function to callback with composition results
 */
```

## Examples
Below is taken from the `test` folder

```js
var files = [
      'test_files/eye.svg',
      'test_files/moon.svg',
      'test_files/building_block.svg'
    ],
    params = {src: this.files};
fontsmith(params, function (err, res) {
  err; // Any errors that might have popped up
  res.map; // Map of file name to unicode value for character
  res.fonts; // Object containing binary string representations of fonts (e.g. {svg, ttf, woff, eot})
});
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint using [grunt](https://github.com/gruntjs/grunt) and test via `npm test`.

## Attribution
### Test files
<a href="http://thenounproject.com/noun/building-block/#icon-No5218" target="_blank">Building Block</a> designed by <a href="http://thenounproject.com/Mikhail1986" target="_blank">Michael Rowe</a> from The Noun Project

<a href="http://thenounproject.com/noun/eye/#icon-No5001" target="_blank">Eye</a> designed by <a href="http://thenounproject.com/DmitryBaranovskiy" target="_blank">Dmitry Baranovskiy</a> from The Noun Project

<a href="http://thenounproject.com/noun/moon/#icon-No2853" target="_blank">Moon</a> designed by <a href="http://thenounproject.com/somerandomdude" target="_blank">P.J. Onori</a> from The Noun Project

## Donating
Support this project and [others by twolfson][gittip] via [gittip][].

[![Support via Gittip][gittip-badge]][gittip]

[gittip-badge]: https://rawgithub.com/twolfson/gittip-badge/master/dist/gittip.png
[gittip]: https://www.gittip.com/twolfson/

## License
Copyright (c) 2013 Todd Wolfson

Licensed under the MIT license.
