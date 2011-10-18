(function () {
  "use strict";

  require('Array.prototype.forEachAsync');

  var npm = require('npm')
    , Future = require('future')
    , future = Future()
    , cachedNpmModules = {}
    , fs = require('fs')
    , path = require('path')
    , allModules = {}
    , reIsLocal = /^\.{0,2}\//
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

  // https://github.com/isaacs/npm/issues/1493
  // this fixes a confusing part of the API
  function hotFix1493(map) {
    var fixedMap = map
      , fixedArray = []
      ;

    Object.keys(map).forEach(function (version) {
      var pkg = map[version][''];
      fixedMap[pkg.version] = pkg;
      delete map[version][''];
      delete map[version];
    });

    Object.keys(fixedMap).sort().forEach(function (version) {
      fixedArray.push(fixedMap[version]);
    });

    return fixedArray;
  }

  function view(packageName, callback) {
    var nameOnly;

    function onViewable(err, map, array) {
      callback(err, map, array);
    }

    function fixView(err, map) {
      var array
        ;

      if (!err) {
        array = hotFix1493(map);
        cachedNpmModules[nameOnly] = { map: map, array: array };
      }


      console.log('reading "' + nameOnly + '" from npm');
      onViewable(err, map, array);
    }

    function manglePackageJson(err, data) {
      var map = {}
        , array = []
        ;

      if (err) {
        console.error('Could not read "' + packageName + '/package.json'  + '"');
        onViewable(err);
        return;
      }

      try {
        data = JSON.parse(data)
      } catch(e) {
        console.error('Could not parse "' + packageName + '/package.json'  + '"');
        onViewable(e);
        return;
      }

      map[data.version || '0.0.0'] = data;
      array.push(data);

      onViewable(err, map, array);
    }

    if (reIsLocal.exec(packageName)) {
      packageName = path.resolve(packageName);
      fs.readFile(packageName + '/package.json', manglePackageJson);
    } else {
      // TODO handle version comparison properly
      nameOnly = packageName.split('@')[0];
      if (cachedNpmModules[nameOnly]) {
        onViewable(null, cachedNpmModules[nameOnly].map, cachedNpmModules[nameOnly].array);
        return;
      }
      npm.commands.view([nameOnly], true, fixView);
    }
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
          if (!cachedNpmModules[modulename]) {
            view(modulename, onNpm);
            return;
          }
          console.log(cachedNpmModules[modulename]);
          onNpm(null, cachedNpmModules[modulename].map, cachedNpmModules[modulename].array);
        }

        onReady();
      }

      function onDone() {
        callback(null, missingDeps, builtIn, localDeps, npmDeps);
      }

      Object.keys(dependencyTree || {}).forEachAsync(eachDep).then(onDone);
    }

    //var wrapperTree = { dependencyTree: {} };
    //wrapperTree.dependencyTree[packageTree.name] = packageTree;
    //sortDepsHelper(wrapperTree, callback);
    sortDepsHelper(packageTree.dependencyTree, callback);
  }

  npm.load({}, future.fulfill);

  module.exports.viewNpmInfo = function () {
    var args = arguments;
    future.when(function () {
      view.apply(null, args);
    });
  };

  module.exports.sortTreeByTypes = function () {
    var args = arguments;
    future.when(function () {
      sortDeps.apply(null, args);
    });
  };
}());
