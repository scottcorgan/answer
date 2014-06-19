var answer = require('../index');
var expect = require('chai').expect;
var connect = require('connect');
var request = require('supertest');

describe('res', function () {
  describe('.get(field)', function () {
    it('should get the response header field', function (done) {
      var app = connect().use(answer());
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
  });
});