(function () {
  "use strict";

  require('Array.prototype.forEachAsync');

  var fs = require('fs')
    , path = require('path')
    , reFindRequires = /\brequire\s*\(['"](.*?)['"]\)/g
    , reIsLocal = /^\.{0,2}\//
    ;

  function getLocalRequires(modulePath, masterCallback) {

    function readScript(pathname, callback) {
      var paths
        , name
        , main = 'index.js'
        ;

      function onFileRead(err, data) {
        if (err) {
          console.error('[ERROR (readScript)] :', pathname);
          callback(err);
          return;
        }

        callback(null, paths.join('/'), name, data.toString('utf8'));
      }

      function onDirRead(err, nodes) {
        if (err) {
          callback(new Error("Couldn't find \"" + modulePath + '/' + paths.join('/') + "\""));
          return;
        }

        if (-1 !== nodes.indexOf(name)) {
          if (/\.js$/.exec(name)) {
            // probably a file
            fs.readFile(modulePath + '/' + pathname, onFileRead);
          } else {
            // probably a directory
            paths.push(name);
            name = main;
            fs.readFile(modulePath + '/' + pathname + '/' + main, onFileRead);
          }
        } else if (-1 !== nodes.indexOf(name + '.js')) {
          // probably a file
          name += '.js';
          fs.readFile(modulePath + '/' + pathname + '.js', onFileRead);
        } else {
          // not a directory nor a file
          // probably doesn't exist
          callback(new Error("Couldn't find \"" + pathname + "\""));
        }
      }

      paths = pathname.split('/');
      name = paths.pop();
      
      fs.readdir(modulePath + '/' + paths.join('/'), onDirRead);
    }

    function showDeps(str) {
      var match
        , dependsOn = []
        ;

      // TODO: strip out comments, keeping commented-out comments in mind.
      // Examples:
      /*
      the commend is commented out and this line would be executed as code
      //*/
      ///*
        function doStuff() {
         // this function should be left in
        }
      //*/

      // WARN: beware this nasty trick; RegExp stores state until you
      // use a different string or all possible matches have been matched
      // http://www.regular-expressions.info/javascript.html
      while (match = reFindRequires.exec(str)) {
        dependsOn.push(match[1]);
      }

      return dependsOn;
    }

    function showDepsFile(meta, callback) {
      var pkgname = meta.name
        , pkgroot = meta.lib
        , dirname = meta.submodulePath
        , filename = meta.submoduleName
        , script
        ;

      function onScriptStr(str) {
        var deps = {}
          , depList
          ;
          
        function forEachDep(next, requireString) {
          var paths
            , nextName
            , pathname
            , dep = requireString
            ;

          function onShownLocalDeps(err, tree) {
            dep = path.normalize(pkgname + '/' + dep);

            if (err) {
              deps[dep] = { error: err };
            } else {
              deps[dep] = tree;
            }

            deps[dep].require = requireString;
            deps[dep].name = nextName;
            deps[dep].modulepath = dep;
            deps[dep].package = pkgname;
            next();
          }

          function onShownModuleDeps(err, tree) {
            if (err) { 
              /*
              if (/^.{0,2}\//.exec(requireString)) {
                onShownLocalDeps(err, null);
                return;
              }
              */

              tree = tree || {};
              tree.warning = {
                  code: 300
                , symbol: 'AMBIGUOUS_DEPENDENCY'
                , message: 'This module appeared as though it should be local, but may be in npm'
              };
            }

            //console.warn('WARN: [pkgname] couldn\'t find:', pkgname, pkgroot, pathname, nextName);
            // mark as possible npm dep since both 'foo' and 'foo/bar' could be valid package names
            onShownLocalDeps(null, tree);
          }

          if (reIsLocal.exec(dep)) {
            dep = path.normalize(dirname + '/' + dep);
            paths = dep.split('/');
            nextName = paths.pop();
            pathname = paths.join('/') || '.';
            showDepsFile({ name: pkgname, lib: pkgroot, submodulePath: pathname, submoduleName: nextName }, onShownLocalDeps);
          } else if (pkgname === dep.split('/')[0]) {
            paths = dep.split('/');
            paths.shift();
            paths.unshift(pkgroot);
            dep = path.normalize(paths.join('/'));
            nextName = paths.pop();
            pathname = paths.join('/') || '.';
            //showDepsFile(pkgname, pkgroot, pathname, nextName, onShownModuleDeps);
            showDepsFile({ name: pkgname, lib: pkgroot, submodulePath: pathname, submoduleName: nextName }, onShownModuleDeps);
          } else {
            deps[dep] = {
                name: dep
            };
            next();
          }
        }

        function onDepsDone() {
          callback(null, {
              dependencyTree: deps
            , pathname: path.normalize(dirname)
            , filename: filename
          });
        }

        depList = showDeps(str);
        depList.forEachAsync(forEachDep).then(onDepsDone);
      }

      function onReadScript(err, dir, name, str) {
        if (err) {
          callback(err); // put more info in?
          return;
        }

        dirname = dir;
        filename = name;
        script = str;
        onScriptStr(str);
      }

      readScript(dirname + '/' + filename, onReadScript);
    }

    function onPackageJsonRead(err, meta) {
      if (err) {
        throw err;
        masterCallback(err);
        return;
      }

      try {
        meta = JSON.parse(meta.toString('utf8'));
      } catch(e) {
        throw e;
        masterCallback(e);
        return;
      }

      meta.lib = meta.lib || '.';
      meta.submoduleName = meta.main || 'index.js';
      meta.submodulePath = '';//modulePath + '/' + (meta.lib || '');

      showDepsFile(meta, masterCallback);
    }

    fs.readFile(modulePath + '/package.json', onPackageJsonRead);
  }

  module.exports = getLocalRequires;
}());
