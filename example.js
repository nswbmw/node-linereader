var LineReader = require('./linereader');
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