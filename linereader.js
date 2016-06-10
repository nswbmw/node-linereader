/*
 * ## linereader ##
 *
 * Forked from [line-by-line](https://github.com/RustyMarvin/line-by-line), and made some improvements:
 * 
 * - change `process.nextTick` to `setImmediate`
 * - add `lineno` (number of line)
 * - support `url` with the `http` or `https` prefix, case-insensitive
 * - use `iconv-lite`, support more encoding
 * - use `StringDecoder` when `encoding` set to `utf8` or `ascii` or `base64`
 */

var fs = require('fs');
var path = require('path');
var util = require('util');
var events = require('events');
var iconv = require('iconv-lite');
var StringDecoder = require('string_decoder').StringDecoder;

// let's make sure we have a setImmediate function (node.js <0.10)
if (typeof setImmediate === 'undefined') {
  var setImmediate = process.nextTick;
}

var urlProtocolRegex = /^(https?):\/\//i

var LineReader = function (filepath, options) {
  var self = this;
  options = options || {};

  this._filepath = urlProtocolRegex.test(filepath) ? filepath : path.normalize(filepath);
  this._encoding = (options.encoding && iconv.encodingExists(options.encoding)) ? options.encoding : 'utf8';
  this._skipEmptyLines = options.skipEmptyLines || false;
  this._readStream = null;
  this._lines = [];
  this._lineFragment = '';
  this._lineno = 0;
  this._paused = false;
  this._end = false;

  events.EventEmitter.call(this);

  setImmediate(function () {
    self._initStream();
  });
};

util.inherits(LineReader, events.EventEmitter);

LineReader.prototype._initStream = function () {
  var self = this;

  if (urlProtocolRegex.test(self._filepath)) {
    var module = urlProtocolRegex.exec(self._filepath)[1].toLowerCase() // http or https
    require(module).get(self._filepath, function (res) {
      self._readStream = res;
      _initStream();
    }).on('error', function(err) {
      console.error(err);
    });
  } else {
    if (Buffer.isEncoding(this._encoding)) {
      self._readStream = fs.createReadStream(this._filepath, {encoding: this._encoding});
    } else {
      self._readStream = fs.createReadStream(this._filepath);
    }
    _initStream();
  }

  function _initStream() {
    var decoderString = "";
    var decoder;
    if (['utf8', 'base64', 'ascii'].indexOf(self._encoding) !== -1) {
      decoder = new StringDecoder(self._encoding);
    }
    self._readStream.on('error', function (err) {
      self.emit('error', err);
    });

    self._readStream.on('data', function (data) {
      self._readStream.pause();
      if (decoder) {
        decoderString = iconv.decode(decoder.write(data), self._encoding);
      } else {
        decoderString = iconv.decode(data, self._encoding);
      }
      self._lines = self._lines.concat(decoderString.split(/(?:\n|\r\n|\r)/g));
      self._lines[0] = self._lineFragment + self._lines[0];
      self._lineFragment = self._lines.pop() || '';

      setImmediate(function () {
        self._nextLine();
      });
    });

    self._readStream.on('end', function () {
      self._end = true;
      setImmediate(function () {
        self._nextLine();
      });
    });
  }

};

LineReader.prototype._nextLine = function () {
  var self = this, line;
  self._lineno = self._lineno + 1;
  if (this._end && !!this._lineFragment) {
    self._lineno = self._lineno - 1;
    this.emit('line', self._lineno, this._lineFragment);
    this._lineFragment = '';

    if (!this._paused) {
      setImmediate(function () {
        self.emit('end');
      });
    }
    return;
  }

  if (this._paused) {
    return;
  }

  if (this._lines.length === 0) {
    if (this._end) {
      this.emit('end');
    } else {
      this._readStream.resume();
    }
    return;
  }

  line = this._lines.shift();

  if (!this._skipEmptyLines || line.length > 0) {
    this.emit('line', self._lineno, line);
  }

  if (!this._paused) {
    setImmediate(function () {
      self._nextLine();
    });
  }
};

LineReader.prototype.pause = function () {
  this._paused = true;
};

LineReader.prototype.resume = function () {
  var self = this;
  this._paused = false;
  setImmediate(function () {
    self._nextLine();
  });
};

LineReader.prototype.close = function () {
  var self = this;
  this._readStream.destroy();
  this._end = true;
  setImmediate(function () {
    self._nextLine();
  });
};

module.exports = LineReader;
