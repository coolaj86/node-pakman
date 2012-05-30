/*jshint strict:true node:true es5:true onevar:true laxcomma:true laxbreak:true*/
(function () {
  "use strict";

  var path = require('path')
    , reIsLocal = /^\.{0,2}\//
    , getScript = require('./get-script').getScript
    , getRequires = require('./get-requires').getRequires
    ;

  var escapeRegExpPattern = /[-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g
    ;

  function escapeRegExp(str) {
    return str.replace(escapeRegExpPattern, "\\$&");
  }

  function getModuleLeaf(pkg, prev, requireString, callback) {
    var paths
      , modulepath = ''
      , leaf = {}
      , submoduleRoot
      , rePkgLib
      ;

    function onShownLocalDeps(err, leaf) {
      //modulepath = path.normalize(pkg.name + '/' + modulepath);

      //leaf.pathname = leaf.pathname || '.';
      leaf.require = requireString;
      leaf.modulepath = modulepath;
      leaf.name = leaf.modulepath;
      leaf.package = pkg.name;
      leaf.requires = getRequires(leaf.scriptSource || '');

      callback(null, pkg, prev, leaf);
    }

    function onReadLocalDeps(err, dir, name, src) {
      if (err) {
        leaf.error = err;
      } else {
        leaf.scriptSource = src;
        leaf.pathname = path.normalize(dir);
        leaf.filename = name;
      }

      onShownLocalDeps(null, leaf);
    }

    // handle the case that this is main
    if (null === prev || !requireString || pkg.name === requireString) {

      // TODO have one, universal way of distiguishing as main
      modulepath = pkg.name;
      getScript(pkg, pkg.main, onReadLocalDeps);
      
    } else if (reIsLocal.exec(requireString)) {

      // resolve the filepath to a modulepath
      leaf.filepath = path.normalize(prev.pathname + '/' + requireString);

      submoduleRoot = path.normalize(pkg.moduleRoot + '/' + leaf.filepath).substring(0, pkg.moduleRoot.length);
      if (submoduleRoot === pkg.moduleRoot) {
        rePkgLib = new RegExp('(^|\/)' + escapeRegExp(path.normalize(pkg.lib) + '/'));
        modulepath = pkg.name + '/' + leaf.filepath.replace(rePkgLib, function ($) {return $[0];});
      } else {
        console.warn('[WARN] \'' + path.normalize(pkg.moduleRoot + '/' + leaf.filepath) + '\' is outside of the module root.');
        modulepath = pkg.name + '/' + leaf.filepath;
      }

      getScript(pkg, leaf.filepath, onReadLocalDeps);

    } else if (pkg.name === requireString.split('/')[0]) {

      // resolve to a filepath
      paths = requireString.split('/');
      paths[0] = pkg.lib;
      getScript(pkg, paths.join('/'), onReadLocalDeps);
      modulepath = requireString;

    } else {

      // check for this package in npm
      modulepath = requireString.split('/')[0];
      callback(null, pkg, prev, {
          name: modulepath
        , require: requireString
        , modulepath: modulepath
      });

    }
  }

  module.exports.getModuleLeaf = getModuleLeaf;
}());
