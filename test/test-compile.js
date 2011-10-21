(function () {
  "use strict";

  require('Array.prototype.forEachAsync');

  var npm = require('npm')
    , fs = require('fs')
    , compile = require('../lib/compile').compile
    , render = require('./example-template').render
    , moduleRoot = process.argv[2] || '../test_modules/foomodule'
    ;

  function log(err, string) {
    console.log(string);
  }

  compile(moduleRoot, render, log);
}());
