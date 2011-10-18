(function () {
  "use strict";

  require('Array.prototype.forEachAsync');

  var getModuleLeaf = require('./get-module-leaf').getModuleLeaf
    ;


  //
  // this wraps the non-recursive getModuleLeaf to be recursive
  //
  function getModuleTreeHelper(err, pkg, prev, requireString, callback) {

    function handleLeaf(err, pkg, prev, leaf, c, d, e) {
      if (err) {
        callback(err);
        return;
      }
      
      function traverseLeaf(next, requireString, requireIndex) {
        getModuleTreeHelper(null, pkg, leaf, requireString, function (err, deps) {
          if (err) {
            console.error(err);
            callback(err);
            return;
          }

          //console.log(deps);
          leaf.dependencyList[requireIndex] = deps;
          next();
        });
      }

      function callCallback() {
        var deps = {}
          ;

        (leaf.dependencyList || []).forEach(function (dep) {
          //console.log(dep);
          deps[dep.name] = dep;
        });

        leaf.dependencyTree = deps;
        //console.log('1', leaf);
        callback(null, leaf);
      }

      if (!leaf.requires) {
        callback(null, leaf);
        return;
      }

      leaf.dependencyList = [];
      leaf.requires.forEachAsync(traverseLeaf).then(callCallback);
    }

    // this function does not recurse
    getModuleLeaf(pkg, prev, requireString, handleLeaf);
  }

  function getModuleTree(pkg, prev, requireString, fn) {
    getModuleTreeHelper(null, pkg, prev, requireString, function (err, tree) {
      tree.modulepath = tree.name;
      //console.log(tree);
      fn(err, tree);
    });
  }

  module.exports.getModuleTree = getModuleTree;
}());
