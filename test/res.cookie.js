var answer = require('../index');
var expect = require('chai').expect;
var connect = require('connect');
var request = require('supertest');
var mixin = require('utils-merge');
var cookieParser = require('cookie-parser');
var cookie = require('cookie');

describe('res', function () {
  describe('.cookie(name, object)', function () {
    it('should generate a JSON cookie', function (done) {
      var app = connect().use(answer());

      app.use(function(req, res){
        res.cookie('user', { name: 'tobi' }).end();
      });

      request(app)
        .get('/')
        .end(function(err, res){
          var val = ['user=' + encodeURIComponent('j:{"name":"tobi"}') + '; Path=/'];
          expect(res.headers['set-cookie']).to.eql(val);
          done();
        });
    });
  });

  describe('.cookie(name, string)', function () {
    it('should set a cookie', function (done) {
      var app = connect().use(answer());

      app.use(function(req, res){
        res.cookie('name', 'tobi').end();
      });

      request(app)
        .get('/')
        .end(function(err, res){
          var val = ['name=tobi; Path=/'];
          expect(res.headers['set-cookie']).to.eql(val);
          done();
        });
    });

    // FIXME: gets and sets multiple of the same headers, WEIRD!
    it.skip('should allow multiple calls', function (done) {
      var app = connect().use(answer());

      app.use(function(req, res){
        res.cookie('name', 'tobi');
        res.cookie('age', 1);
        res.cookie('gender', '?');
        res.end();
      });

      request(app)
        .get('/')
        .end(function(err, res){
          var val = ['name=tobi; Path=/', 'age=1; Path=/', 'gender=%3F; Path=/'];
          // expect(res.headers['set-cookie']).to.eql(val);
          done();
        });
    });
  });

  describe('.cookie(name, string, options)', function () {
    it('should set params', function (done) {
      var app = connect().use(answer());

      app.use(function(req, res){
        res.cookie('name', 'tobi', { httpOnly: true, secure: true });
        res.end();
      });

      request(app)
      .get('/')
        .end(function(err, res){
          var val = ['name=tobi; Path=/; HttpOnly; Secure'];
          expect(res.headers['set-cookie']).to.eql(val);
          done();
        });
    });

    describe('maxAge', function () {
      it('should set relative expires', function (done) {
        var app = connect().use(answer());

        app.use(function(req, res){
          res.cookie('name', 'tobi', { maxAge: 1000 });
          res.end();
        });

        request(app)
          .get('/')
          .end(function(err, res){
            expect(res.header['set-cookie'][0]).to.not.contain('Thu, 01 Jan 1970 00:00:01 GMT');
            done();
          });
      });

      it('should set max-age', function (done) {
        var app = connect().use(answer());

        app.use(function(req, res){
          res.cookie('name', 'tobi', { maxAge: 1000 });
          res.end();
        });

        request(app)
          .get('/')
          .expect('Set-Cookie', /Max-Age=1/, done)
      });

      it('should not mutate the options object', function (done) {
        var app = connect().use(answer());

        var options = { maxAge: 1000 };
        var optionsCopy = mixin({}, options);

        app.use(function(req, res){
          res.cookie('name', 'tobi', options)
          res.end();
        });

        request(app)
        .get('/')
        .end(function(err, res){
          expect(options).to.eql(optionsCopy);
          done();
        });
      });
    });

    describe('signed', function () {
      it('should generate a signed JSON cookie', function (done) {
        var app = connect().use(answer());

        app.use(cookieParser('foo bar baz'));

        app.use(function(req, res){
          res.cookie('user', { name: 'tobi' }, { signed: true }).end();
        });

        request(app)
          .get('/')
          .end(function(err, res){
            var val = res.headers['set-cookie'][0];
            val = cookie.parse(val.split('.')[0]);
            expect(val.user).to.equal('s:j:{"name":"tobi"}');
            done();
          });
      });
    });

    describe('.signedCookie(name, string)', function () {
      it('should set a signed cookie', function (done) {
        var app = connect().use(answer());

        app.use(cookieParser('foo bar baz'));

        app.use(function(req, res){
          res.cookie('name', 'tobi', { signed: true }).end();
        });

        request(app)
        .get('/')
          .end(function(err, res){
            var val = ['name=s%3Atobi.xJjV2iZ6EI7C8E5kzwbfA9PVLl1ZR07UTnuTgQQ4EnQ; Path=/'];
            expect(res.headers['set-cookie']).to.eql(val);
            done();
          });
      });
    });
  });
});