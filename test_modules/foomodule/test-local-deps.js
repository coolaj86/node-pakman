(function () {

  console.log('test-local-deps');

  var npm = require('npm')
    , fs = require('fs')
    , path = require('path')
    , xyz = require('test-local-deps/corge')
    , abc = require('./foo')
    , allModules = {}
    , reIsLocal = /^\.{0,2}\//
    ;

}());
