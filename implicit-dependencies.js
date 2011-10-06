(function () {
  "use strict";

  require('Array.prototype.forEachAsync');

  var fs = require('fs')
    , path = require('path')
    , reFindRequires = /\brequire\s*\(['"](.*?)['"]\)/g
    , reIsLocal = /^\.{0,2}\//
    ;

  function handleModule(modulePath, callback) {

    function readScript(pathname, callback) {
      var paths
        , name
        , main = 'index.js'
        ;

      function onFileRead(err, data) {
        if (err) {
          console.error('[ERROR (readScript)] :', pathname);
          throw err;
          return;
        }

        callback(null, paths.join('/'), name, data.toString('utf8'));
      }

      function onDirRead(err, nodes) {
        if (err) {
          console.error('ERROR [onDirRead]:', pathname);
          throw err;
          console.error(err);
          return;
        }

        console.log('[name]', paths.join('/'), name + '.js', !!nodes.indexOf(name + '.js'));

        if (-1 !== nodes.indexOf(name)) {
          if (/\.js$/.exec(name)) {
            // probably a file
            fs.readFile(modulePath + '/' + pathname, onFileRead);
          } else {
            // probably a directory
            paths.push(name);
            name = main;
            fs.readFile(modulePath + '/' + pathname + '/' + main, onFileRead);
            //fs.readFile(pathname + '/' + main, onFileRead);
          }
        } else if (-1 !== nodes.indexOf(name + '.js')) {
          console.log('probably a file', pathname + '.js');
          // probably a file
          name += '.js';
          fs.readFile(modulePath + '/' + pathname + '.js', onFileRead);
          //fs.readFile(pathname + '.js', onFileRead);
        } else {
          // not a directory nor a file
          // probably doesn't exist
          callback(new Error("Couldn't find \"" + pathname + "\""));
        }
      }

      paths = pathname.split('/');
      name = paths.pop();
      
      console.log('foo:', name, modulePath + '/' + paths.join('/'));
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

      //console.log('showDepsFile', meta, pkgname, pkgroot, dirname, filename);

      //function showDepsFile(pkgname, pkgroot, dirname, filename, callback) 
      //showDepsFile(meta.name, meta.lib || '.', '.', 'test-local-deps.js', onShownDepsFile);

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
            if (err) {
              console.error('ERR: [localpath]', pkgname, pkgroot, pathname, nextName);
              throw err;
            }

            deps[dep] = tree;
            deps[dep].require = requireString;
            deps[dep].nextName = nextName;
            deps[dep].dep = dep;
            deps[dep].package = pkgname;
            next();
          }

          function onShownModuleDeps(err, tree) {
            if (err) { 
              console.warn('WARN: [pkgname] couldn\'t find:', pkgname, pkgroot, pathname, nextName);
              //throw err;
              // mark as possible npm dep since both 'foo' and 'foo/bar' could be valid package names
              next();
              return;
            }

            deps[dep] = tree;
            deps[dep].require = requireString;
            deps[dep].nextName = nextName;
            deps[dep].dep = dep;
            deps[dep].package = pkgname;
            next();
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
            deps[dep] = {};
            next();
          }
        }

        function onDepsDone() {
          callback(null, {
              dependencies: deps
            , pathname: dirname
            , filename: filename
          });
        }

        depList = showDeps(str);
        depList.forEachAsync(forEachDep).then(onDepsDone);
      }

      function onReadScript(err, dir, name, str) {
        if (err) {
          console.error('ERROR [onReadScript]: ', dir, name, err);
          throw err;
          return;
        }
        //console.log('[LOG]: ', str && str.length);
        dirname = dir;
        filename = name;
        script = str;
        onScriptStr(str);
      }

      readScript(dirname + '/' + filename, onReadScript);
    }

    function onShownDepsFile(err, tree) {
      if (err) {
        console.error('ERROR: [onShownDepsFile]');
        throw err;
        console.error(err);
        return;
      }

      console.log(JSON.stringify(tree, null, '  '));
    }

    function onPackageJsonRead(err, meta) {
      if (err) {
        throw err;
        callback(err);
        return;
      }

      try {
        meta = JSON.parse(meta.toString('utf8'));
      } catch(e) {
        throw e;
        callback(e);
        return;
      }

      meta.lib = meta.lib || '.';
      meta.submoduleName = meta.main || 'index.js';
      meta.submodulePath = '';//modulePath + '/' + (meta.lib || '');

      console.log(meta);
      showDepsFile(meta, callback);
    }

    fs.readFile(modulePath + '/package.json', onPackageJsonRead);
  }

  module.exports = handleModule;

  handleModule('./foomodule', function (err, tree) {
      if (err) {
        console.error('ERR: [onShownDepsFile]');
        throw err;
        console.error(err);
        return;
      }

      console.log(JSON.stringify(tree, null, '  '));
  });

}());
