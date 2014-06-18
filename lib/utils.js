var basename = require('path').basename;
var charsetRegExp = /;\s*charset\s*=/;

exports.contentDisposition = function(filename){
  var ret = 'attachment';
  if (filename) {
    filename = basename(filename);
    // if filename contains non-ascii characters, add a utf-8 version ala RFC 5987
    ret = /[^\040-\176]/.test(filename)
      ? 'attachment; filename=' + encodeURI(filename) + '; filename*=UTF-8\'\'' + encodeURI(filename)
      : 'attachment; filename="' + filename + '"';
  }

  return ret;
};

exports.setCharset = function(type, charset){
  if (!type || !charset) return type;

  var exists = charsetRegExp.test(type);

  // removing existing charset
  if (exists) {
    var parts = type.split(';');

    for (var i = 1; i < parts.length; i++) {
      if (charsetRegExp.test(';' + parts[i])) {
        parts.splice(i, 1);
        break;
      }
    }

    type = parts.join(';');
  }

  return type + '; charset=' + charset;
};