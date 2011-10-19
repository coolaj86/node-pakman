(function () {
  "use strict";

  var sortTree = require('./sort-tree-by-types').sortTreeByTypes
    , reduceTree = require('./reduce-tree').reduceTree
    , getPackageTree = require('./get-package-tree').getPackageTree
    , normalizeDeps = require('./normalize-package-dependencies').normalizePackageDependencies 
    , normalizeReqs = require('./normalize-script-requires').normalizeScriptRequires
    ;

  function wrappedPackager(moduleRoot, fn) {

    function makeReady(err, pkg, tree) {

      function makePackageReady(err, missing, builtin, local, pm) {
        var list
          , deps
          , missingList = []
          , unlisted = []
          , unused = []
          , builtinList = []
          , pmList = []
          , localList
          ;

        if (err) {
          fn(err);
          return;
        }

        /*
        console.log(Object.keys(missing));
        console.log(Object.keys(builtin));
        console.log(Object.keys(local));
        console.log(Object.keys(pm));
        console.log('show names\n');
        */

        list = reduceTree(tree);
        deps = normalizeDeps(pkg);

        Object.keys(missing).forEach(function (name) {
          missingList.push(missing[name]);
        });

        Object.keys(builtin).forEach(function (name) {
          builtinList.push(builtin[name]);
        });

        Object.keys(pm).forEach(function (name) {
          pmList.push(pm[name]);
        });

        localList = [];
        list.forEach(function (name) {
          var module = local[name];
          if (module) {
            localList.push(module);
          }
        });
        normalizeReqs(localList);

        //
        // NPM 
        //
        Object.keys(deps).forEach(function (name) {
          if (-1 === Object.keys(pm).indexOf(name)) {
            unused.push(name);
          }
        });

        Object.keys(pm).forEach(function (name) {
          if (-1 === Object.keys(deps).indexOf(name)) {
            unlisted.push(name);
          }
        });

        fn(null, missingList, unlisted, unused, localList, pmList, builtinList);
      }

      sortTree(tree, makePackageReady);
    }
    
    getPackageTree(moduleRoot, makeReady);
  }

  module.exports.makePackageReady = wrappedPackager;
}());
