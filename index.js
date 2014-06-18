var http = require('http');
var escapeHtml = require('escape-html');
var send = require('send');
var mime = require('mime-types');
var vary = require('vary');
var mixin = require('utils-merge');
var cookie = require('cookie');
var sign = require('cookie-signature').sign;
var path = require('path');
var statusCodes = http.STATUS_CODES;
var extname = path.extname;
var setCharset = require('./lib/utils').setCharset;
var contentDisposition = require('./lib/utils').contentDisposition;

module.exports = function() {
  return function(req, res, next) {
    
    res.req = req;
    
    res.status = function (code) {
      res.statusCode = code;
      return this;
    };
    
    res.links = function(links){
      var link = this.get('Link') || '';
      if (link) link += ', ';
      return this.set('Link', link + Object.keys(links).map(function(rel){
        return '<' + links[rel] + '>; rel="' + rel + '"';
      }).join(', '));
    };
    
    res.send = function(body){
      var req = this.req;
      var head = 'HEAD' == req.method;
      var type;
      var encoding;
      var len;

      // settings
      var app = this.app;

      // allow status / body
      if (2 == arguments.length) {
        // res.send(body, status) backwards compat
        if ('number' != typeof body && 'number' == typeof arguments[1]) {
          this.statusCode = arguments[1];
        } else {
          this.statusCode = body;
          body = arguments[1];
        }
      }

      switch (typeof body) {
        // response status
        case 'number':
          this.get('Content-Type') || this.type('txt');
          this.statusCode = body;
          body = http.STATUS_CODES[body];
          break;
        // string defaulting to html
        case 'string':
          if (!this.get('Content-Type')) this.type('html');
          break;
        case 'boolean':
        case 'object':
          if (null == body) {
            body = '';
          } else if (Buffer.isBuffer(body)) {
            this.get('Content-Type') || this.type('bin');
          } else {
            return this.json(body);
          }
          break;
      }

      // write strings in utf-8
      if ('string' === typeof body) {
        encoding = 'utf8';
        type = this.get('Content-Type');

        // reflect this in content-type
        if ('string' === typeof type) {
          this.set('Content-Type', setCharset(type, 'utf-8'));
        }
      }

      // populate Content-Length
      if (undefined !== body && !this.get('Content-Length')) {
        len = Buffer.isBuffer(body)
          ? body.length
          : Buffer.byteLength(body, encoding);
        this.set('Content-Length', len);
      }

      // TODO: make this work
      // ETag support
      // var etag = len !== undefined && app.get('etag fn');
      // if (etag && ('GET' === req.method || 'HEAD' === req.method)) {
      //   if (!this.get('ETag')) {
      //     etag = etag(body, encoding);
      //     etag && this.set('ETag', etag);
      //   }
      // }

      // TODO: make this work
      // freshness
      // if (req.fresh) this.statusCode = 304;

      // strip irrelevant headers
      if (204 == this.statusCode || 304 == this.statusCode) {
        this.removeHeader('Content-Type');
        this.removeHeader('Content-Length');
        this.removeHeader('Transfer-Encoding');
        body = '';
      }

      // respond
      this.end((head ? null : body), encoding);

      return this;
    };
    
    res.json = function(obj){
      // allow status / body
      if (2 == arguments.length) {
        this.statusCode = obj;
        obj = arguments[1];
      }

      // settings
      // TODO: make this work?
      // var app = this.app;
      // var replacer = app.get('json replacer');
      // var spaces = app.get('json spaces');
      // var body = JSON.stringify(obj, replacer, spaces);
      var body = JSON.stringify(obj);

      // content-type
      this.get('Content-Type') || this.set('Content-Type', 'application/json');

      return this.send(body);
    };
    
    // TODO: req.query needs to be able to work
    res.jsonp = function(obj){
      // allow status / body
      if (2 == arguments.length) {
        this.statusCode = obj;
        obj = arguments[1];
      }

      // settings
      // TODO: make this work?
      // var app = this.app;
      // var replacer = app.get('json replacer');
      // var spaces = app.get('json spaces');
      // var body = JSON.stringify(obj, replacer, spaces)
      var body = JSON.stringify(obj)
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');
      // var callback = this.req.query[app.get('jsonp callback name')];
      var callback = this.req.query['callback'];

      // content-type
      this.get('Content-Type') || this.set('Content-Type', 'application/json');

      // fixup callback
      if (Array.isArray(callback)) {
        callback = callback[0];
      }

      // jsonp
      if (callback && 'string' === typeof callback) {
        this.set('Content-Type', 'text/javascript');
        var cb = callback.replace(/[^\[\]\w$.]/g, '');
        body = 'typeof ' + cb + ' === \'function\' && ' + cb + '(' + body + ');';
      }

      return this.send(body);
    };
    
    // TODO: make this work
    // res.sendfile = function(path, options, fn){
    //   options = options || {};
    //   var self = this;
    //   var req = self.req;
    //   var next = this.req.next;
    //   var done;


    //   // support function as second arg
    //   if ('function' == typeof options) {
    //     fn = options;
    //     options = {};
    //   }

    //   // socket errors
    //   req.socket.on('error', error);

    //   // errors
    //   function error(err) {
    //     if (done) return;
    //     done = true;

    //     // clean up
    //     cleanup();
    //     if (!self.headersSent) self.removeHeader('Content-Disposition');

    //     // callback available
    //     if (fn) return fn(err);

    //     // list in limbo if there's no callback
    //     if (self.headersSent) return;

    //     // delegate
    //     next(err);
    //   }

    //   // streaming
    //   function stream(stream) {
    //     if (done) return;
    //     cleanup();
    //     if (fn) stream.on('end', fn);
    //   }

    //   // cleanup
    //   function cleanup() {
    //     req.socket.removeListener('error', error);
    //   }

    //   // Back-compat
    //   options.maxage = options.maxage || options.maxAge || 0;

    //   // transfer
    //   var file = send(req, path, options);
    //   file.on('error', error);
    //   file.on('directory', next);
    //   file.on('stream', stream);
    //   file.pipe(this);
    //   this.on('finish', cleanup);
    // };
    
    res.download = function(path, filename, fn){
      // support function as second arg
      if ('function' == typeof filename) {
        fn = filename;
        filename = null;
      }

      filename = filename || path;
      this.set('Content-Disposition', contentDisposition(filename));
      return this.sendfile(path, fn);
    };
    
    res.contentType =
    res.type = function(type){
      return this.set('Content-Type', ~type.indexOf('/')
        ? type
        : mime.lookup(type));
    };
    
    // TODO: make this work
    // res.format = function(obj){
    //   var req = this.req;
    //   var next = req.next;

    //   var fn = obj.default;
    //   if (fn) delete obj.default;
    //   var keys = Object.keys(obj);

    //   // TODO: look this up in request file
    //   var key = req.accepts(keys);

    //   this.vary("Accept");

    //   if (key) {
    //     this.set('Content-Type', normalizeType(key).value);
    //     obj[key](req, this, next);
    //   } else if (fn) {
    //     fn();
    //   } else {
    //     var err = new Error('Not Acceptable');
    //     err.status = 406;
    //     err.types = normalizeTypes(keys).map(function(o){ return o.value });
    //     next(err);
    //   }

    //   return this;
    // };
    
    res.attachment = function(filename){
      if (filename) this.type(extname(filename));
      this.set('Content-Disposition', contentDisposition(filename));
      return this;
    };
    
    res.vary = function(field){
      // checks for back-compat
      if (!field) return this;
      if (Array.isArray(field) && !field.length) return this;

      vary(this, field);

      return this;
    };
    
    res.set =
    res.header = function(field, val){
      if (2 == arguments.length) {
        if (Array.isArray(val)) val = val.map(String);
        else val = String(val);
        if ('content-type' == field.toLowerCase() && !/;\s*charset\s*=/.test(val)) {
          var charset = mime.charsets.lookup(val.split(';')[0]);
          if (charset) val += '; charset=' + charset.toLowerCase();
        }
        this.setHeader(field, val);
      } else {
        for (var key in field) {
          this.set(key, field[key]);
        }
      }
      return this;
    };
    
    res.get = function(field){
      return this.getHeader(field);
    };
    
    res.clearCookie = function(name, options){
      var opts = { expires: new Date(1), path: '/' };
      return this.cookie(name, '', options
        ? mixin(opts, options)
        : opts);
    };
    
    res.cookie = function(name, val, options){
      options = mixin({}, options);
      var secret = this.req.secret;
      var signed = options.signed;
      if (signed && !secret) throw new Error('cookieParser("secret") required for signed cookies');
      if ('number' == typeof val) val = val.toString();
      if ('object' == typeof val) val = 'j:' + JSON.stringify(val);
      if (signed) val = 's:' + sign(val, secret);
      if ('maxAge' in options) {
        options.expires = new Date(Date.now() + options.maxAge);
        options.maxAge /= 1000;
      }
      if (null == options.path) options.path = '/';
      var headerVal = cookie.serialize(name, String(val), options);

      // supports multiple 'res.cookie' calls by getting previous value
      var prev = this.get('Set-Cookie');
      if (prev) {
        if (Array.isArray(prev)) {
          headerVal = prev.concat(headerVal);
        } else {
          headerVal = [prev, headerVal];
        }
      }
      this.set('Set-Cookie', headerVal);
      return this;
    };
    
    res.location = function(url){
      var req = this.req;
      
      // "back" is an alias for the referrer
      if ('back' == url) url = this.headers.referrer || this.headers.referer || '/';

      // Respond
      this.set('Location', url);
      return this;
    };
    
    res.redirect = function(url){
      var head = 'HEAD' == this.req.method;
      var status = 302;
      var body;

      // allow status / url
      if (2 == arguments.length) {
        if ('number' == typeof url) {
          status = url;
          url = arguments[1];
        } else {
          status = arguments[1];
        }
      }

      // Set location header
      this.location(url);
      url = this.get('Location');
      
      // TODO: need to get this.format() working
      // Support text/{plain,html} by default
      this.format({
        text: function(){
          body = statusCodes[status] + '. Redirecting to ' + encodeURI(url);
        },

        html: function(){
          var u = escapeHtml(url);
          body = '<p>' + statusCodes[status] + '. Redirecting to <a href="' + u + '">' + u + '</a></p>';
        },

        default: function(){
          body = '';
        }
      });

      // Respond
      this.statusCode = status;
      this.set('Content-Length', Buffer.byteLength(body));
      this.end(head ? null : body);
    };
    
    next();
  };
};