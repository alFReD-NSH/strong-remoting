var RemoteObjects = require('../');
var express = require('express');
var request = require('supertest');


describe('strong-remoting', function(){
  var app;
  var server;
  var objects;
  
  // setup
  beforeEach(function(){
    if(server) server.close();
    objects = RemoteObjects.create();
    remotes = objects.exports;
    app = express();
  });
  
  function json(method, url) {
    return request(app)[method](url)
      .set('Accept', 'application/json')
      .expect(200)
      .expect('Content-Type', /json/);
  }
  
  describe('handlers', function(){
    describe('rest', function(){
      beforeEach(function () {
        app.use(function (req, res, next) {
          // create the handler for each request
          objects.handler('rest').apply(objects, arguments);
        });
      });
      
      it('should support calling object methods', function(done) {
        function greet(msg, fn) {
          fn(null, msg);
        }
        
        remotes.user = {
          greet: greet
        };

        greet.shared = true;
        greet.accepts = {arg: 'person', type: 'string'};
        greet.returns = {arg: 'msg', type: 'string'};

        json('get', '/user/greet?person=hello')
          .expect({$data: 'hello'}, done);
      });
      
      it('should allow arguments in the url', function(done) {
        remotes.foo = {
          bar: function (a, b, fn) {
            fn(null, a + b);
          }
        };
        
        var fn = remotes.foo.bar;
        
        fn.shared = true;
        fn.accepts = [
          {arg: 'b', type: 'number'},
          {arg: 'a', type: 'number', http: {source: 'url'}}
        ];
        fn.returns = {arg: 'n', type: 'number'};
        fn.http = {
          verb: 'get',
          path: '/:a'
        };
        
        json('get', '/foo/1?b=2')
          .expect({$data: 3}, done);
      });
      
      it('should respond with the result if returns is not defined', function(done) {
        remotes.foo = {
          bar: function (a, b, fn) {
            fn(null, a + b);
          }
        };
        
        var fn = remotes.foo.bar;
        
        fn.shared = true;
        fn.accepts = [
          {arg: 'a', type: 'number', http: {source: 'url'}},
          {arg: 'b', type: 'number'}
        ];
        fn.http = {
          verb: 'get',
          path: '/:a'
        };
        
        json('get', '/foo/1?b=2')
          .expect({$data: 3}, done);
      });
      
      it('should respond with named results if returns has multiple args', function(done) {
        remotes.foo = {
          bar: function (a, b, fn) {
            fn(null, a, b);
          }
        };
        
        var fn = remotes.foo.bar;
        
        fn.shared = true;
        fn.accepts = [
          {arg: 'a', type: 'number'},
          {arg: 'b', type: 'number'}
        ];
        
        fn.returns = [
          {arg: 'a', type: 'number'},
          {arg: 'b', type: 'number'}
        ];
        
        json('get', '/foo/bar?a=1&b=2')
          .expect({a: 1, b: 2}, done);
      });
      
      it('should coerce boolean strings - true', function(done) {
        remotes.foo = {
          bar: function (a, fn) {
            fn(null, a);
          }
        };
        
        var fn = remotes.foo.bar;
        
        fn.shared = true;
        fn.accepts = [
          {arg: 'a', type: 'object'},
        ];
        
        json('get', '/foo/bar?a[foo]=true')
          .expect({foo: true}, done);
      });
      
      it('should coerce boolean strings - false', function(done) {
        remotes.foo = {
          bar: function (a, fn) {
            fn(null, a);
          }
        };
        
        var fn = remotes.foo.bar;
        
        fn.shared = true;
        fn.accepts = [
          {arg: 'a', type: 'object'},
        ];
        
        json('get', '/foo/bar?a[foo]=false')
          .expect({foo: false}, done);
      });
      
      it('should coerce number strings', function(done) {
        remotes.foo = {
          bar: function (a, b, fn) {
            fn(null, a + b);
          }
        };
        
        var fn = remotes.foo.bar;
        
        fn.shared = true;
        fn.accepts = [
          {arg: 'a'},
          {arg: 'b'}
        ];
        
        json('get', '/foo/bar?a=42&b=0.42')
          .expect({$data: 42.42}, done);
      });
      
      it('should coerce null strings', function(done) {
        remotes.foo = {
          bar: function (a, fn) {
            fn(null, a);
          }
        };
        
        var fn = remotes.foo.bar;
        
        fn.shared = true;
        fn.accepts = [
          {arg: 'a'},
        ];
        
        json('get', '/foo/bar?a=null')
          .expect({$data: null}, done);
      });
    });
  });
});