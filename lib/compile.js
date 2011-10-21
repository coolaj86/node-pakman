(function () {
  "use strict";

  require('Array.prototype.forEachAsync');

  var npm = require('npm')
    , fs = require('fs')
    , getNpmTree = require('../lib/get-npm-tree').getNpmTree
    , reduceTree = require('../lib/reduce-tree').reduceTree
    , mapByDepth = require('../lib/reduce-tree').mapByDepth
    , reduceByDepth = require('../lib/reduce-tree').reduceByDepth
    , makePackageReady = require('../lib/make-package-ready').makePackageReady
    , moduleRoot = process.argv[2] || '../test_modules/foomodule'
    ;

  function compile(moduleRoot, render, fn) {
    // TODO cache npm.commands.view results
    // TODO cache all npm commands (so that builds can be done without internet access)
    function buildAll(list) {
      var modulesList = []
        ;

      list.forEachAsync(function (next, modulename) {
        makePackageReady('./' + 'node_modules' + '/' + modulename, function (err, pkg, m, u, v, l, p, b) {
          if (err) {
            next();
            return;
            //throw err;
          }

          l.forEach(function (module) {
            modulesList.push(render(module));
          });

          next();
        });
      }).then(function () {
        makePackageReady(moduleRoot, function (err, pkg, m, u, v, l, p, b) {
          
          l.forEach(function (module) {
            modulesList.push(render(module));
          });

          fn(null, modulesList.join('\n'));
        });
      });
    }

    function install(modulename, fn) {
      var path = '.'
        , moduleRoot = path + '/' + 'node_modules' + '/' + modulename
        ;

      fs.readdir(moduleRoot, function (err, nodes) {
        if (!err) {
          fn(null);
          return;
        }

        npm.commands.install(path, [modulename], fn);
      });
      
    }

    function installAll(list) {
      // TODO check if installed
      list.forEachAsync(function (next, modulename) {
          // not using __dirname so that it will install in the cwd of the user
          install(modulename, function (err, array, map, versionAndPath) {
            if (err) {
              console.error('[NPM] [' + modulename + ']', err.message);
              //return;
            }   
            next();
            //gotModule(err, array, map, versionAndPath);
          }); 
      }).then(function () {
        buildAll(list)
      });
    }

    // TODO needs an emitter for listing files as read
    function log(err, pkg, tree) {
      var list
        ;

      if (err) {
        throw err;
      }

      // puts the list in the correct order
      list = reduceTree(tree);


      installAll(list);
    }

    getNpmTree(moduleRoot, log);
  }

  module.exports.compile = compile;
}());