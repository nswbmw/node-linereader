## linereader

Reading a url or file line by line. Forked from [line-by-line](https://github.com/RustyMarvin/line-by-line), and made some improvements:

- change `process.nextTick` to `setImmediate`
- add `lineno` (number of line)
- support `url` with the `http` or `https` prefix, case-insensitive
- use `iconv-lite`, support more encoding
- use `StringDecoder` when `encoding` set to `utf8`, `ascii` or `base64`

### Install

    npm install linereader


### Usage

    var LineReader = require('linereader');
    var lr = new LineReader('./linereader.js');
    // var lr = new LineReader('./linereader.js', {skipEmptyLines: true});
    // var lr = new LineReader('https://github.com/');
    // var lr = new LineReader('https://raw.githubusercontent.com/nswbmw/N-blog/master/public/images/lufei.jpg', {encoding: "base64"});
    // var lr = new LineReader('HTTP://www.hot3c.com', {encoding: 'Big5'});

    lr.on('error', function (err) {
      console.log(err);
      lr.close();
    });

    lr.on('line', function (lineno, line) {
      if (lineno <= 100) {
        console.log(lineno + "   " + line);
      } else {
        lr.close();
      }
      lr.pause();
      setTimeout(function () {
        lr.resume();
      }, 100);
    });

    lr.on('end', function () {
      console.log("End");
    });

### API

**Class: LineReader(path [, options])**

- `path`: a file path or url.

- `options`: an object with the following defaults: `{encoding: 'utf8', skipEmptyLines: false}`.

**NB:** `encoding` refer to [iconv-lite](https://github.com/ashtuchkin/iconv-lite). when encoding set to `utf8`, `ascii` or `base64`, linereader will use `StringDecoder` automatically. If `skipEmptyLines` set to `true`, empty lines don't trigger a 'line' event but still keep its `lineno`.

**Event: 'line'**

    lr.on('line', function (lineno, line) {
      ...
    }

Emitted on every line read. `lineno` is the current line number, `line` contains the line without the line ending character.

**Event: 'error'**

    lr.on('error', function (err) {
      ...
    }

Emitted if an error occurred. `err` contains the error object.

**Event: 'end'**

    lr.on('end', function () {
      ...
    }

Emitted if all lines are read or after using `lr.close()`.

**lr.pause()**

Call this method to stop emitting 'line' events.

**lr.resume()**

After calling this method, 'line' events gets emitted again.

**lr.close()**

Stops emitting 'line' events and emits the 'end' event.

### Test

    node ./example

### License

MIT