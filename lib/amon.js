"use strict";

var util = require('util');
var http = require('http');
var zmq;
var events = require('events');

var Amon = function(config) {
  var that = this;
  events.EventEmitter.call(this);

  this.VERSION = '0.4.0';
  this.host = '127.0.0.1';
  this.port = 2464;
  this.secret = false;
  this.app_key = false;
  this.protocol = 'http';

  if (config) {
    ['host', 'port', 'secret', 'app_key', 'protocol' ].forEach(function(param) {
      if (config[param]) {
        that[param] = config[param];
      }
    });
  }

  if (this.protocol == 'zeromq') {
    zmq = require('zmq');
  }

  function exception_data(error) {
    return {
      "additional_data": {
        "application_directory": process.cwd(),
        "node": process.version,
        "env": {
          "args": process.argv,
          "execPath": process.execPath,
          "cwd": process.cwd(),
          "env": process.env,
          "installPrefix": process.installPrefix,
          "pid": process.pid,
          "platform": process.platform,
          "memory": process.memoryUsage()
        }
      },
      "backtrace": error.stack.split("\n"),
      "message": error.message,
      "exception_class": error.stack.split("\n")[0]
    };
  }

  function post_zeromq(data) {
    var socket = zmq.socket('dealer');
    socket.connect('tcp://'+Amon.host+':'+Amon.port);
      socket.send(data);
      socket.close();
  }

  function post_http(type, data) {
    var path = '/api/log';

    var headers = {
      'Content-Length' : data.length,
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    if(type == 'exception') {
      path = '/api/exception';
    }

    // Amon Plus support
    if(Amon.app_key != false){ 
      path += '/'+Amon.app_key;
    }

    var options = {
      host: that.host,
      port: that.port,
      path: path,
      method: 'POST',
      headers: headers
    };

    var request = http.request(options, function(response) {
    });

    request.write(data);
    request.end();

    request.on('error', function (error) {
      that.emit('error',error,data);
    });
  }

  if (this.protocol == 'zeromq') {
    this.handle = function(error) {
      var zeromq_data = JSON.stringify({
        "content": Amon.exception_data(error),
        "type": 'exception',
        "app_key": Amon.app_key
      });
      post_zeromq(zeromq_data);
    };

    this.log = function(message, tags){
      tags = tags || "notset";
      var zeromq_data = JSON.stringify({
        "content": {"message": message, "tags": tags},
        "type": 'log',
        "app_key": Amon.app_key
      });
      post_zeromq(zeromq_data);
    };

  } else if (this.protocol == 'http') {
    this.handle = function(error) {
      var error_data = JSON.stringify(Amon.exception_data(error));
      post_http('exception', error_data);
    };

    this.log = function(message, tags){
      tags = tags || "notset";
      var log_data = JSON.stringify({
        "message": message,
        "tags": tags
      });
      post_http('log', log_data);
    };
  }

};

util.inherits(Amon,events.EventEmitter);

module.exports = Amon;
