(function () {
  "use strict";

  var getPackageInfo = require('../lib/get-package-info').getPackageInfo
    , getModuleTree = require('./get-module-tree').getModuleTree
    ;

  function getPackageTree(moduleRoot, fn) {
    getPackageInfo(moduleRoot, function (err, pkg) {
      var leaf = {}
        , paths
        ;   

      if (err) {
        fn(err);
        return;
      }

      paths = pkg.main.split('/')

      // the index / main is a special case that must
      // be set up appropriately
      leaf.name = pkg.name;
      leaf.filename = paths.pop();
      leaf.pathname = paths.join('/');
      leaf.filepath = pkg.main; 
      leaf.require = pkg.name;
      leaf.modulepath = pkg.name;

      getModuleTree(pkg, leaf, leaf.require, function (err, tree) {
        fn(err, pkg, tree);
      });
    });
  }

  module.exports.getPackageTree = getPackageTree;
}());
