var answer = require('../index');
var expect = require('chai').expect;
var connect = require('connect');
var request = require('supertest');

describe('answer', function () {
  var app;
  
  beforeEach(function () {
    app = connect()
      .use(answer());
  });
  
  it('sets the status', function (done) {
    app.use(function (req, res, next) {
      res.status(301);
      res.end('redirect');
      next();
    });
    
    request(app)
      .get('/')
      .expect(301)
      .end(done);
  });
  
  it('sets the Link header field', function (done) {
    app.use(function (req, res, next) {
      res.removeHeader('Link');
      res.links({
        next: 'http://api.example.com/users?page=2',
        last: 'http://api.example.com/users?page=5'
      });
      
      res.links({
        prev: 'http://api.example.com/users?page=1',
      });
      
      next();
    });
    
    request(app)
      .get('/')
      .expect(function (res) {
        expect(res.headers.link).to.equal(
          '<http://api.example.com/users?page=2>; rel="next", ' +
          '<http://api.example.com/users?page=5>; rel="last", ' +
          '<http://api.example.com/users?page=1>; rel="prev"');
      })
      .end(done);
  });
  
  it('gets headers', function (done) {
    var contentTypes = [];
    app.use(function (req, res, next) {
      res.setHeader('Content-Type', 'text/x-foo');
      
      contentTypes.push(res.get('Content-type'));
      contentTypes.push(res.get('content-type'));
      
      next();
    });
    
    request(app)
      .get('/')
      .expect(function () {
        expect(contentTypes).to.eql(['text/x-foo', 'text/x-foo']);
      })
      .end(done);
  });
  
  describe('res.set(field, value)', function () {
    it('should set the response header field', function (done) {
      app.use(function(req, res){
        res.set('Content-Type', 'text/x-foo; charset=utf-8').end();
      });

      request(app)
        .get('/')
        .expect('Content-Type', 'text/x-foo; charset=utf-8')
        .end(done);
    });
    
    it('should coerce to a string', function (done) {
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
  
});