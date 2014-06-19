var answer = require('../index');
var expect = require('chai').expect;
var connect = require('connect');
var request = require('supertest');

describe('res', function () {
  describe('.send(null)', function () {
    it('should set body to ""', function (done) {
      var app = connect().use(answer());

      app.use(function(req, res){
        res.send(null);
      });

      request(app)
        .get('/')
        .expect('Content-Length', '0')
        .expect('', done);
    });
  });

  describe('.send(undefined)', function () {
    it('should set body to ""', function (done) {
      var app = connect().use(answer());

      app.use(function(req, res){
        res.send(undefined);
      });

      request(app)
        .get('/')
        .expect('', function(req, res){
          expect(res.header).to.not.have.property('content-length');
          done();
        });
    });
  });

  describe('.send(code)', function () {
    it('should set .statusCode', function (done) {
      var app = connect().use(answer());

      app.use(function(req, res){
        res.send(201);
      });

      request(app)
        .get('/')
        .expect('Created')
        .expect(201, done);
    });
  });

  describe('.send(code, body)', function () {
    it('should set .statusCode and body', function (done) {
      var app = connect().use(answer());

      app.use(function(req, res){
        res.send(201, 'Created :)');
      });

      request(app)
        .get('/')
        .expect('Created :)')
        .expect(201, done);
    });
  });

  describe('.send(body, code)', function () {
    it('should be supported for backwards compat', function (done) {
      var app = connect().use(answer());

      app.use(function(req, res){
        res.send('Bad!', 400);
      });

      request(app)
        .get('/')
        .expect('Bad!')
        .expect(400, done);
    });
  });

  describe('.send(String)', function () {
    it('should send as html', function (done) {
      var app = connect().use(answer());

      app.use(function(req, res){
        res.send('<p>hey</p>');
      });

      request(app)
        .get('/')
        .end(function(err, res){
          expect(res.headers).to.have.property('content-type', 'text/html; charset=utf-8');
          expect(res.text).to.equal('<p>hey</p>');
          expect(res.statusCode).to.equal(200);
          done();
      });
    });

    // TODO: implement this ETag stuff
    it.skip('should set ETag', function (done) {
      var app = connect().use(answer());

      app.use(function(req, res){
        var str = Array(1024 * 2).join('-');
        res.send(str);
      });

      request(app)
        .get('/')
        .expect('ETag', 'W/"7ff-2796319984"')
        .end(done);
    });

    it('should not set ETag for non-GET/HEAD', function (done) {
      var app = connect().use(answer());

      app.use(function(req, res){
        var str = Array(1024 * 2).join('-');
        res.send(str);
      });

      request(app)
        .post('/')
        .end(function(err, res){
          if (err) return done(err);
          expect(!res.header.etag).to.equal(true);
          done();
        });
    });

    it('should not override Content-Type', function (done) {
      var app = connect().use(answer());

      app.use(function(req, res){
        res.set('Content-Type', 'text/plain').send('hey');
      });

      request(app)
        .get('/')
        .expect('Content-Type', 'text/plain; charset=utf-8')
        .expect(200, 'hey', done);
    });

    it('should override charset in Content-Type', function (done) {
      var app = connect().use(answer());

      app.use(function(req, res){
        res.set('Content-Type', 'text/plain; charset=iso-8859-1').send('hey');
      });

      request(app)
        .get('/')
        .expect('Content-Type', 'text/plain; charset=utf-8')
        .expect(200, 'hey', done);
    });

    it('should keep charset in Content-Type for Buffers', function (done) {
      var app = connect().use(answer());

      app.use(function(req, res){
        res.set('Content-Type', 'text/plain; charset=iso-8859-1').send(new Buffer('hi'));
      });

      request(app)
        .get('/')
        .expect('Content-Type', 'text/plain; charset=iso-8859-1')
        .expect(200, 'hi', done);
    });
  });

  describe('.send(Buffer)', function () {
    it('should send as octet-stream', function (done) {
      var app = connect().use(answer());

      app.use(function(req, res){
        res.send(new Buffer('hello'));
      });

      request(app)
        .get('/')
        .expect(200, 'hello')
        .expect('content-type', 'application/octet-stream', done);
    });

    // TODO: port ETag code
    it.skip('should set ETag', function (done) {
      var app = connect().use(answer());

      app.use(function(req, res){
        var str = Array(1024 * 2).join('-');
        res.send(new Buffer(str));
      });

      request(app)
        .get('/')
        .expect('ETag', 'W/"7ff-2796319984"')
        .end(done);
    });

    it('should not override Content-Type', function (done) {
      var app = connect().use(answer());

      app.use(function(req, res){
        res.set('Content-Type', 'text/plain').send(new Buffer('hey'));
      });

      request(app)
        .get('/')
        .expect('content-type', 'text/plain; charset=utf-8')
        .expect(200, 'hey', done);
    });
  });

  describe('.send(Object)', function () {
    it('should send as application/json', function (done) {
      var app = connect().use(answer());

      app.use(function(req, res){
        res.send({ name: 'tobi' });
      });

      request(app)
        .get('/')
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200, '{"name":"tobi"}', done)
    });
  });

  describe('when the request method is HEAD', function () {
    it('should ignore the body', function (done) {
      var app = connect().use(answer());

      app.use(function(req, res){
        res.send('yay');
      });

      request(app)
        .head('/')
        .expect('', done);
    });
  });

  describe('when .statusCode is 204', function () {
    it('should strip Content-* fields, Transfer-Encoding field, and body', function (done) {
      var app = connect().use(answer());

      app.use(function(req, res){
        res.status(204).set('Transfer-Encoding', 'chunked').send('foo');
      });

      request(app)
        .get('/')
        .expect('')
        .end(function(err, res){
          expect(res.headers).to.not.have.property('content-type');
          expect(res.headers).to.not.have.property('content-length');
          expect(res.headers).to.not.have.property('content-encoding');
          done();
        });
    });
  });

  describe('when .statusCode is 304', function () {
    it('should strip Content-* fields, Transfer-Encoding field, and body', function (done) {
      var app = connect().use(answer());

      app.use(function(req, res){
        res.status(304).set('Transfer-Encoding', 'chunked').send('foo');
      });

      request(app)
        .get('/')
        .expect('')
        .end(function(err, res){
          expect(res.headers).to.not.have.property('content-type');
          expect(res.headers).to.not.have.property('content-length');
          expect(res.headers).to.not.have.property('content-encoding');
          done();
        });
    });
  });
  
  // TODO: configure ETag stuff
  it.skip('should always check regardless of length', function (done) {
    var app = connect().use(answer());;
    var etag = '"asdf"';

    app.use(function(req, res, next){
      res.set('ETag', etag);
      res.send('hey');
    });

    request(app)
      .get('/')
      .set('If-None-Match', etag)
      .expect(304, done);
  });
  
  // TODO: configure ETag/req.fresh stuff
  it.skip('should respond with 304 Not Modified when fresh', function (done) {
    var app = connect().use(answer());;

    app.use(function(req, res){
      var str = Array(1024 * 2).join('-');
      res.send(str);
    });

    request(app)
      .get('/')
      .set('If-None-Match', 'W/"7ff-2796319984"')
      .expect(304, done);
  })

  it('should not perform freshness check unless 2xx or 304', function (done) {
    var app = connect().use(answer());;
    var etag = '"asdf"';

    app.use(function(req, res, next){
      res.status(500);
      res.set('ETag', etag);
      res.send('hey');
    });

    request(app)
      .get('/')
      .set('If-None-Match', etag)
      .expect('hey')
      .expect(500, done);
  });

  it('should not support jsonp callbacks', function (done) {
    var app = connect().use(answer());;

    app.use(function(req, res){
      res.send({ foo: 'bar' });
    });

    request(app)
      .get('/?callback=foo')
      .expect('{"foo":"bar"}', done);
  });
  
  describe.skip('"etag" setting', function () {
    
    // NOTE: use options hash in middleware function call
    // instead of using app.enable/app.disable
    
    describe('when enabled', function () {
  //     it('should send ETag', function (done) {
  //       var app = connect().use(answer());;

  //       app.use(function(req, res){
  //         res.send('kajdslfkasdf');
  //       });

  //       app.enable('etag');

  //       request(app)
  //       .get('/')
  //       .expect('etag', 'W/"c-1525560792"', done)
  //     })

  //     it('should send ETag for empty string response', function (done) {
  //       var app = connect().use(answer());

  //       app.use(function(req, res){
  //         res.send('')
  //       });

  //       app.enable('etag')

  //       request(app)
  //       .get('/')
  //       .expect('etag', 'W/"0-0"', done)
  //     })

  //     it('should send ETag for long response', function (done) {
  //       var app = connect().use(answer());;

  //       app.use(function(req, res){
  //         var str = Array(1024 * 2).join('-');
  //         res.send(str);
  //       });

  //       app.enable('etag');

  //       request(app)
  //       .get('/')
  //       .expect('etag', 'W/"7ff-2796319984"', done)
  //     });

  //     it('should not override ETag when manually set', function (done) {
  //       var app = connect().use(answer());;

  //       app.use(function(req, res){
  //         res.set('etag', '"asdf"');
  //         res.send(200);
  //       });

  //       app.enable('etag');

  //       request(app)
  //       .get('/')
  //       .expect('etag', '"asdf"', done)
  //     });

  //     it('should not send ETag for res.send()', function (done) {
  //       var app = connect().use(answer());

  //       app.use(function(req, res){
  //         res.send()
  //       });

  //       app.enable('etag')

  //       request(app)
  //       .get('/')
  //       .end(function(err, res){
  //         res.headers.should.not.have.property('etag');
  //         done();
  //       })
  //     })
    });

    describe('when disabled', function () {
  //     it('should send no ETag', function (done) {
  //       var app = connect().use(answer());;

  //       app.use(function(req, res){
  //         var str = Array(1024 * 2).join('-');
  //         res.send(str);
  //       });

  //       app.disable('etag');

  //       request(app)
  //       .get('/')
  //       .end(function(err, res){
  //         res.headers.should.not.have.property('etag');
  //         done();
  //       });
  //     });

  //     it('should send ETag when manually set', function (done) {
  //       var app = connect().use(answer());;

  //       app.disable('etag');

  //       app.use(function(req, res){
  //         res.set('etag', '"asdf"');
  //         res.send(200);
  //       });

  //       request(app)
  //       .get('/')
  //       .expect('etag', '"asdf"', done)
  //     });
    });

    describe('when "strong"', function () {
      it('should send strong ETag', function (done) {
        var app = connect().use(answer());

        app.set('etag', 'strong');

        app.use(function(req, res){
          res.send('hello, world!');
        });

        request(app)
          .get('/')
          .expect('etag', '"Otu60XkfuuPskIiUxJY4cA=="', done)
      });
    });

    describe('when "weak"', function () {
      it('should send weak ETag', function (done) {
        var app = connect().use(answer());

        app.set('etag', 'weak');

        app.use(function(req, res){
          res.send('hello, world!');
        });

        request(app)
          .get('/')
          .expect('etag', 'W/"d-1486392595"', done)
      });
    });

    describe('when a function', function () {
      it('should send custom ETag', function (done) {
        var app = connect().use(answer());

        app.set('etag', function(body, encoding){
          expect(body).to.equal('hello, world!');
          expect(encoding).toe.qual('utf8');
          return '"custom"';
        });

        app.use(function(req, res){
          res.send('hello, world!');
        });

        request(app)
          .get('/')
          .expect('etag', '"custom"', done)
      });

      it('should not send falsy ETag', function (done) {
        var app = connect().use(answer());

        app.set('etag', function(body, encoding){
          return undefined
        });

        app.use(function(req, res){
          res.send('hello, world!');
        });

        request(app)
          .get('/')
          .end(function(err, res){
            res.headers.should.not.have.property('etag')
            done();
          });
      });
    });
  });
})