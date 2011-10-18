(function () {
  "use strict";

  var path = require('path')
    , reIsLocal = /^\.{0,2}\//
    , getScript = require('./get-script').getScript
    , getRequires = require('./get-requires').getRequires
    ;

  function getModuleLeaf(pkg, prev, requireString, callback) {
    var paths
      , submoduleName
      , submodulePath
      , dep = requireString
      ;

    function onShownLocalDeps(err, leaf) {
      dep = path.normalize(pkg.name + '/' + dep);

      //leaf.pathname = leaf.pathname || '.';
      leaf.require = requireString;
      leaf.name = submoduleName;
      leaf.modulepath = dep;
      leaf.package = pkg.name;
      leaf.requires = getRequires(leaf.scriptSource || '');

      callback(null, pkg, prev, leaf);
    }

    function onReadLocalDeps(err, dir, name, src) {
      var leaf = {};

      if (err) {
        leaf.error = err;
      } else {
        leaf.scriptSource = src;
        leaf.submodulePath = leaf.pathname = path.normalize(dir);
        leaf.filename = name;
      }

      onShownLocalDeps(null, leaf);
    }

    function onReadModuleDeps(err, dir, name, src) {
      var leaf = {}
        ;

      if (err) { 
        // mark as possible npm dep since both 'foo' and 'foo/bar' could be valid package names
        leaf.warning = {
            code: 300
          , symbol: 'AMBIGUOUS_DEPENDENCY'
          , message: 'This module appeared as though it should be local, but may be in npm'
        };
      } else {
        leaf.scriptSource = src;
        leaf.submodulePath = leaf.pathname = path.normalize(dir);
        leaf.filename = name;
      }

      onShownLocalDeps(null, leaf);
    }

    if (reIsLocal.exec(dep)) {

      dep = path.normalize(prev.pathname + '/' + dep);
      paths = dep.split('/');
      submoduleName = paths.pop();
      submodulePath = paths.join('/') || '.';
      getScript(pkg, (submodulePath || '.') + '/' + submoduleName, onReadLocalDeps);

    } else if (pkg.name === dep.split('/')[0]) {

      paths = dep.split('/');
      paths.shift();
      // TODO: there may be other places where pkg.lib is useful
      paths.unshift(pkg.lib);
      dep = path.normalize(paths.join('/'));
      submoduleName = paths.pop();
      submodulePath = paths.join('/') || '.';
      getScript(pkg, submodulePath + '/' + submoduleName, onReadModuleDeps);

    } else {

      // this will be found in npm, if anywhere
      callback(null, pkg, prev, {
          name: dep
      });

    }
  }

  module.exports.getModuleLeaf = getModuleLeaf;
}());
