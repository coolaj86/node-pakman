(function () {
  "use strict";

  require('Array.prototype.forEachAsync');

  var npm = require('npm')
    , Future = require('future')
    , getNpmPackageInfo = require('./get-npm-package-info').getNpmPackageInfo
    , future = Future()
    , fs = require('fs')
    , path = require('path')
    , allModules = {}
      // ls ~/Code/node/lib/ | grep '' | cut -d'.' -f1 | while read M; do echo , \"${M}\"; done
    , builtIns = [
          "_debugger"
        , "_linklist"
        , "assert"
        , "buffer"
        , "child_process"
        , "console"
        , "constants"
        , "crypto"
        , "dgram"
        , "dns"
        , "events"
        , "freelist"
        , "fs"
        , "http"
        , "https"
        , "module"
        , "net"
        , "os"
        , "path"
        , "querystring"
        , "readline"
        , "repl"
        , "stream"
        , "string_decoder"
        , "sys"
        , "timers"
        , "tls"
        , "tty"
        , "tty_posix"
        , "tty_win32"
        , "url"
        , "util"
        , "vm"
      ]
    , browserBuiltIns = [
          "File"
        , "FileWriter"
        , "FileReader"
        , "Uint8Array"
        , "atob"
        , "btoa"
      // http://www.jslint.com/lint.html#browser
      // http://www.jslint.com/jslint.js
        , "clearInterval"
        , "clearTimeout"
        , "document"
        , "event"
        , "frames"
        , "history"
        , "Image"
        , 'localStorage'
        , "location"
        , "name"
        , "navigator"
        , "Option"
        , "parent"
        , "screen"
        , "sessionStorage"
        , "setInterval"
        , "setTimeout"
        , "Storage"
        , "window"
        , "XMLHttpRequest"
      ]
    ;

  function isCoreModule(modulename) {
    return -1 !== builtIns.indexOf(modulename);
  }
  
  function isBrowserGlobal(modulename) {
    return -1 !== browserBuiltIns.indexOf(modulename);
  }

  function sortDeps(packageTree, callback) {
    var missingDeps = {}
      , npmDeps = {}
      , localDeps = {}
      , builtIn = {}
      ;

    function sortDepsHelper(dependencyTree, callback) {
      function eachDep(next, modulename) {
        var module = dependencyTree[modulename]
          ;

        function onReady() {
          sortDepsHelper(module.dependencyTree, next);
        }

        function onNpm(err, map, array) {
          if (err) {
            missingDeps[modulename] = module;
          } else {
            npmDeps[modulename] = array[0];
            module.npm = true;
          }

          onReady();
        }

        //if (isCoreModule(modulename)) 
        if (isBrowserGlobal(modulename)) {
          builtIn[modulename] = module;
        }
        else if (module.error) {
          missingDeps[modulename] = module;
        }
        else if (module.pathname && !module.warning) {
          localDeps[modulename] = module;
        }
        else {
          // possibly something like foo/bar, for which foo is the real dependency
          modulename = modulename.split('/')[0];
          getNpmPackageInfo(modulename, onNpm);
          return;
        }

        onReady();
      }

      function onDone() {
        callback(null, missingDeps, builtIn, localDeps, npmDeps);
      }

      Object.keys(dependencyTree || {}).forEachAsync(eachDep).then(onDone);
    }

    var dependencyTree = {}
      ;

    dependencyTree[packageTree.modulepath || packageTree.name] = packageTree;
    sortDepsHelper(dependencyTree, callback);
  }

  npm.load({}, future.fulfill);

  module.exports.sortTreeByTypes = function () {
    var args = arguments;
    future.when(function () {
      sortDeps.apply(null, args);
    });
  };
}());
