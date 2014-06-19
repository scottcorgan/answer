var answer = require('../index');
var expect = require('chai').expect;
var connect = require('connect');
var request = require('supertest');

describe('res', function () {
  describe('.set(field, value)', function () {
    it('should set the response header field', function (done) {
      var app = connect().use(answer());

      app.use(function(req, res){
        res.set('Content-Type', 'text/x-foo; charset=utf-8').end();
      });

      request(app)
        .get('/')
        .expect('Content-Type', 'text/x-foo; charset=utf-8')
        .end(done);
    });

    it('should coerce to a string', function (done) {
      var app = connect().use(answer());
      
      app.use(function (req, res) {
          res.headers = {};
          res.set('X-Number', 123);
          res.end(res.get('X-Number'));
        });
        
        request(app)
          .get('/')
          .expect('123')
          .end(done);
    });
  });

  describe('.set(field, values)', function () {
    it('should set multiple response header fields', function (done) {
      var app = connect().use(answer());

      app.use(function(req, res){
        res.set('Set-Cookie', ["type=ninja", "language=javascript"]);
        res.send(res.get('Set-Cookie'));
      });

      request(app)
        .get('/')
        .expect('["type=ninja","language=javascript"]', done);
    });

    it('should coerce to an array of strings', function (done) {
      var app = connect().use(answer());
      
      app.use(function (req, res) {
        res.headers = {};
        res.set('X-Numbers', [123, 456]);
        res.end(JSON.stringify(res.get('X-Numbers')));
      });
      
      request(app)
        .get('/')
        .expect('["123","456"]')
        .end(done);
    });

    it('should not set a charset of one is already set', function (done) {
      var app = connect().use(answer());
      
      app.use(function (req, res) {
        res.headers = {};
        res.set('Content-Type', 'text/html; charset=lol');
        res.end(res.get('content-type'));
      });
      
      request(app)
        .get('/')
        .expect('text/html; charset=lol')
        .end(done);
    });
  });

  describe('.set(object)', function () {
    it('should set multiple fields', function (done) {
      var app = connect().use(answer());

      app.use(function(req, res){
        res.set({
          'X-Foo': 'bar',
          'X-Bar': 'baz'
        }).end();
      });

      request(app)
        .get('/')
        .expect('X-Foo', 'bar')
        .expect('X-Bar', 'baz')
        .end(done);
    });

    it('should coerce to a string', function (done) {
      var app = connect().use(answer());
      
      app.use(function (req, res) {
        res.headers = {};
        res.set({ 'X-Number': 123 });
        res.end(res.get('X-Number'));
      });
      
      request(app)
        .get('/')
        .expect('123')
        .end(done);
    });
  });
});