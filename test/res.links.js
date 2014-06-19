var answer = require('../index');
var expect = require('chai').expect;
var connect = require('connect');
var request = require('supertest');

describe('res', function () {
  describe('.links(obj)', function () {
    it('should set Link header field', function (done) {
      var app = connect().use(answer());
      
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
  });
});