(function () {
  "use strict";

  var getLocalRequires = require('./implicit-dependencies')
    , sortLocalDeps = require('./sort-local-dependencies').sortDependencies
    , traverser = require('./dependency-traverser')
    ;

  function onGotOrganized(err, local, sorted) {
    sorted.forEach(function (modulename) {
      var newScript
        , module
        ;

      module = local[modulename];

      if (!module) {
        return;
      }
      
      // I'm using the 'ender:' prefix to make it
      // easier to search for a module start
      newScript = ''
        + '\n// ender:' + module.modulepath
        + '\n(function () {' 
        + '\n  "use strict";' 
        + '\n  var module = { exports: {} }, exports = module.exports'
        + '\n    , $ = require("ender")'
        + '\n    ;'
        + '\n  ' + module.scriptSource.replace(/\n/g, '\n  ') + '\n'
        + '\n  provide("' + module.modulepath + '", module.exports);'
        + '\n  $.ender(module.exports);'
        + '\n}());'
        ;

      console.log(newScript);
    });    
  }

  function getOrganized(modulepath, callback) {
    getLocalRequires(modulepath, function (err, tree) {
      onGotLocalRequires(err, tree, callback)
    });
  }

  var modulepath = process.argv[2]
    ;

  if (!modulepath) {
    console.error('you must specify the path of a modulepath to inspect: i.e. ./node_modules/futures');
    return;
  }

  getOrganized(modulepath, onGotOrganized);

  module.exports.getSortedDependencies = getOrganized;
}());
