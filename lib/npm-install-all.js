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
    ;

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

    /*
  var installedModules = {};
  fs.readdir(__dirname + '/' + 'node_modules', function (err, nodes) {
    nodes.forEach(function (nodename) {
      installedModules[nodename] = true;
    });
  });


    function onLocalDeps(err, pkg, missing, builtIn, local, npmDeps) {
      console.log('Local Deps Loaded');

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

    var modulePath = 'test_modules/foomodule';
    getLocalDeps(modulePath, onLocalDeps);
    */
      getAllNpmDeps(pkg, onGotNpmDeps);
}());
