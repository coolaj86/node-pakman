(function () {
  "use strict";

  require('Array.prototype.forEachAsync');

  var fs = require('fs')
    , path = require('path')
    , reFindRequires = /\brequire\s*\(['"](.*?)['"]\)/g
    , reIsLocal = /^\.{0,2}\//
    , getScript = require('./get-script').getFile
    , getRequires = require('./get-requires').getRequires
    ;


  //
  // this wraps the non-recursive getModuleLeaf to be recursive
  //
  function getModuleTree(pkg, prev, requireString, callback) {

    function recurseLeaf(module, sub, requireNames) {
      sub.dependencyList = [];

      function traverseLeaf(next, depname, i, arr) {
        getModuleTree(pkg, sub, depname, function () {
          sub.dependencyList[i] = subDeps;
          next();
        });
      }

      function callCallback() {
        var deps = {}
          ;

        (sub.requires||[]).forEach(function (dep) {
          deps[dep.name] = dep;
        });
        sub.dependencyTree = deps;
        callback(null, deps);
      }

      requireNames.forEachAsync(traverseLeaf).then(callCallback);
    }

    // this function does not recurse
    getModuleLeaf(pkg, prev, requireString, recurseLeaf);
  }




  function getLocalRequires(moduleRoot, masterCallback) {

    function onPackageJsonRead(err, meta) {
      var sub = {}
        ;

      function wrapBeforeCallback(err, treeThing) {
        var wrapper = { dependencyTree: {} };
        wrapper.dependencyTree[meta.name] = meta;
        masterCallback(err, wrapper);
      }

      if (err) {
        throw err;
        masterCallback(err);
        return;
      }

      try {
        meta = JSON.parse(meta.toString('utf8'));
      } catch(e) {
        throw e;
        masterCallback(e);
        return;
      }

      // the main file is a special case
      meta.lib = meta.lib || '.';
      meta.moduleroot = moduleRoot;
      // TODO treat main as require list
      sub.submoduleName = meta.submoduleName = meta.main || 'index.js';
      sub.submodulePath = meta.submodulePath = ''; //moduleRoot + '/' + (meta.lib || '');
      sub.require = meta.name;
      sub.modulepath = meta.name;

      getModuleLeaf(meta, sub, wrapBeforeCallback);
    }

    fs.readFile(moduleRoot + '/package.json', onPackageJsonRead);
  }

  module.exports = getLocalRequires;
}());
