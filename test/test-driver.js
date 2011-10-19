(function () {
  "use strict";

  require('Array.prototype.forEachAsync');

  var npm = require('npm')
    , traverser = require('./dependency-traverser')
    , fs = require('fs')
    , path = require('path')
    , allModules = {}
    , reIsLocal = /^\.{0,2}\//
    , getLocalRequires = require('./implicit-dependencies')
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
      // http://www.jslint.com/lint.html#browser
      // http://www.jslint.com/jslint.js
    , browserBuiltIns = [
          "File"
        , "FileWriter"
        , "FileReader"
        , "Uint8Array"
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

  var cachedNpmModules = {};
  function view(pkg, callback) {
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
        console.error('Could not read "' + pkg + '/package.json'  + '"');
        onViewable(err);
        return;
      }

      try {
        data = JSON.parse(data)
      } catch(e) {
        console.error('Could not parse "' + pkg + '/package.json'  + '"');
        onViewable(e);
        return;
      }

      map[data.version || '0.0.0'] = data;
      array.push(data);

      onViewable(err, map, array);
    }

    if (reIsLocal.exec(pkg)) {
      pkg = path.resolve(pkg);
      fs.readFile(pkg + '/package.json', manglePackageJson);
    } else {
      // TODO handle version comparison properly
      nameOnly = pkg.split('@')[0];
      if (cachedNpmModules[nameOnly]) {
        onViewable(null, cachedNpmModules[nameOnly].map, cachedNpmModules[nameOnly].array);
        return;
      }
      npm.commands.view([nameOnly], true, fixView);
    }
  }

  function getAllNpmDeps(masterTree, callback) {
    var modules = {}
      ;

    function helper(tree, callback) {
      var depnames
        , depnamesObj
        ;

      //console.log('tree:', tree);

      function eachDep(next, modulename) {
        var tuple = modulename.split('@')
          , version = tuple[1] || '>= 0.0.0'
          ;

        modulename = tuple[0];

        function onNpm(err, map, array) {
          if (err) {
            tree.dependencyTree[modulename] = {
                name: modulename
              , version: version
              , error: err
              , npm: true
            };
          } else {
            tree.dependencyTree[modulename] = array[array.length - 1];
            if (!tree.dependencyTree[modulename]) {
              console.error(modulename);
            }
            tree.dependencyTree[modulename].npm = true;
          }

          modules[modulename] = modules[modulename] || tree.dependencyTree[modulename];
          helper(tree.dependencyTree[modulename], next);
        }

        view(modulename + '@' + version, onNpm);
      }

      function onDone() {
        callback(null, modules);
      }

      depnamesObj = (tree.ender && tree.ender.dependencies) || tree.dependencies || [];
      if (!Array.isArray(depnames)) {
        depnames = [];
        Object.keys(depnamesObj).forEach(function (name) {
          var version = depnamesObj[name] || ''
            ;

          version = version ? '@' + version.trim() : '';

          depnames.push(name + version);
        });
      }

      tree.dependencyTree = {};
      (depnames || []).forEachAsync(eachDep).then(onDone);
    }

    helper(masterTree, callback);
  }

  var installedModules = {};
  fs.readdir(__dirname + '/' + 'node_modules', function (err, nodes) {
    nodes.forEach(function (nodename) {
      installedModules[nodename] = true;
    });
  });


    function onLocalDeps(err, pkg, missing, builtIn, local, npmDeps) {
      console.log('Local Deps Loaded');

      /*
      console.log('[ERROR]:', err);
      console.log('[MISSING]:', missing);
      console.log('[BUILT-IN]:', builtIn);
      console.log('[LOCAL]:', local);
        console.log('[NPM]:', npmDeps);
        Object.keys(npmDeps).forEachAsync(function (next, modulename) {
          var module = npmDeps[modulename];
          view
        });
      */
      function doInstall(next, depname) {
        console.log('onDoneDidInstall');
        function gotModule() {
          next();
          return;
          getLocalDeps('node_modules/' + depname, function (err, pkg, tree, missing, builtin, local, npmDeps) {
            console.log('[GOT DEPS]', err, tree);
          });
        }

        if (installedModules[depname]) {
          console.log('Already installed', depname);
          gotModule();
          return;
        }

        npm.commands.install(__dirname + '/', [depname], function (err, array, map, versionAndPath) {
          console.log('onNpmInstall');
          if (err) {
            console.error('[NPM] [' + depname + ']', err.message);
            return;
          }
          gotModule(err, array, map, versionAndPath);
        });
      }

      function onGotNpmDeps (err, modules) {
        console.log('onGotNpmDeps');
        var map
          , array
          ;

        console.log();

        map = traverser.mapByDepth(pkg);
        array = traverser.reduceByDepth(map);

        function afterInstall() {
          console.log('All modules installed');
          console.log(pkg && true);
          //array.forEachAsync(getLocalDeps);
          array.forEachAsync(function (next, depname) {
            getLocalDeps('node_modules/' + depname, function (err, pkg, tree, missing, builtin, local, npmDeps) {
              console.log('[GOT DEPS]', err, tree);
              next();
            });
          });
        }

        array.forEachAsync(doInstall).then(afterInstall);
      }

      getAllNpmDeps(pkg, onGotNpmDeps);
    }

    function getLocalDeps(modulePath, callback) {
      console.log('onGotLocalDeps');
      modulePath = __dirname + '/' + modulePath;
      getLocalRequires(modulePath, function (err, tree) {
        console.log('onGotLocalRequires');
        var missing = []
          , extra = []
          , sortedModules
          ;

        if (err) {
          console.error('ERR: [getLocalRequires]');
          throw err;
          console.error(err);
          return;
        }

        function onPackageJson(err, data) {
          console.log('onPackageJson');

          data = JSON.parse(data);
          data.dependencyTree = data.dependencyTree || {};

          Object.keys(tree.dependencyTree).forEach(function (key) {
            if (!data.dependencyTree[key] || tree.dependencyTree[key].error) {
              missing.push(key);
            }
          });

          Object.keys(data.dependencyTree).forEach(function (key) {
            if (!tree.dependencyTree[key]) {
              extra.push(key);
            }
          });

          sortDeps(tree.dependencyTree, function (err, missing, builtin, local, npm) {
            console.log('onSortDeps');
            callback(err, data, tree, missing, builtin, local, npm);
          });

        }

        fs.readFile(modulePath + '/package.json', 'utf8', onPackageJson);
      });
    }

  npm.load({}, function () {

    var modulePath = 'test_modules/foomodule';
    getLocalDeps(modulePath, onLocalDeps);

  });
}());
