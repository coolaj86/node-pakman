(function () {
  "use strict";

  var getPackageInfo = require('../lib/get-package-info').getPackageInfo
    , getModuleTree = require('./get-module-tree').getModuleTree
    ;

  function getPackageTree(moduleRoot, fn) {
    getPackageInfo(moduleRoot, function (err, pkg) {
      var leaf = {}
        ;   

      if (err) {
        fn(err);
        return;
      }   

      // TODO treat main as require list ?
      leaf.name = pkg.main || 'index';
      leaf.pathname = '.'; 
      leaf.require = './' + pkg.name;
      leaf.modulepath = pkg.name;

      getModuleTree(pkg, leaf, leaf.require, fn);
    });
  }

  module.exports.getPackageTree = getPackageTree;
}());
