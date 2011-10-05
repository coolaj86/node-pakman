(function () {
  "use strict";

  require('Array.prototype.forEachAsync');

  var fs = require('fs')
    , path = require('path')
    , reFindRequires = /\brequire\s*\(['"](.*?)['"]\)/g
    , reIsLocal = /^\.{0,2}\//
    ;

  function readScript(pathname, callback) {
    var paths
      , name
      , main = 'index.js'
      ;

    function onFileRead(err, data) {
      if (err) {
        console.error('[ERROR (readScript)] :', pathname);
        return;
      }

      callback(null, paths.join('/'), name, data.toString('utf8'));
    }

    function onDirRead(err, nodes) {
      if (-1 !== nodes.indexOf(name)) {
        if (/\.js$/.exec(name)) {
          // probably a file
          fs.readFile(pathname, onFileRead);
        } else {
          // probably a directory
          paths.push(name);
          name = main;
          fs.readFile(pathname + '/' + main, onFileRead);
        }
      } else if (-1 !== nodes.indexOf(name + '.js')) {
        // probably a file
        name += '.js';
        fs.readFile(pathname + '.js', onFileRead);
      } else {
        // not a directory nor a file
        // probably doesn't exist
        callback(new Error("Couldn't find \"" + pathname + "\""));
      }
    }

    paths = pathname.split('/');
    name = paths.pop();
    
    fs.readdir(paths.join('/'), onDirRead);
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

  function showDepsFile(pkgname, pkgroot, dirname, filename, callback) {

    function onFileRead(err, data) {
      if (err) {
        if (err) { console.error('ERR: [fileread]', pkgname, pkgroot, pathname, nextName); throw err; }
        callback(err);
        return;
      }

      data = data.toString('utf8');
      onScriptStr(data);
    }

    function onScriptStr(str) {
      var deps = {}
        , depList
        ;
        
      function forEachDep(next, dep) {
        var paths
          , nextName
          , modPath
          , pathname
          , requireString = dep
          ;

        //console.log('dep: ', dep);

        function onShownLocalDeps(err, tree) {
          if (err) {
            console.error('ERR: [localpath]', pkgname, pkgroot, pathname, nextName);
            throw err;
          }

          deps[dep] = {
              dependencies: tree
            , name: dep
            , require: requireString
            , location: pathname + '/' + filename
            , nextName: nextName
          };
          next();
        }

        function onShownModuleDeps(err, tree) {
          if (err) { 
            console.warn('WARN: [pkgname] couldn\'t find:', pkgname, pkgroot, pathname, nextName);
            //throw err;
            // mark as possible npm dep since both 'foo' and 'foo/bar' could be valid package names
            deps['!#! - ' + modPath] = {
                dependencies: tree
              , name: dep
              , require: requireString
              , location: pathname + '/' + filename
              , nextName: nextName
            };
            next();
            return;
          }

          deps[modPath] = {
              dependencies: tree
            , name: dep
            , require: requireString
            , location: pathname + '/' + filename
            , nextName: nextName
          };
          next();
        }

        if (reIsLocal.exec(dep)) {
          dep = path.normalize(dirname + '/' + dep);
          paths = dep.split('/');
          nextName = paths.pop();
          deps[dep] = {};
          pathname = paths.join('/') || '.';
          showDepsFile(pkgname, pkgroot, pathname, nextName, onShownLocalDeps);
        } else if (pkgname === dep.split('/')[0]) {
          paths = dep.split('/');
          paths.shift();
          paths.unshift(pkgroot);
          modPath = path.normalize(paths.join('/'));
          nextName = paths.pop();
          deps[modPath] = {};
          pathname = paths.join('/') || '.';
          showDepsFile(pkgname, pkgroot, pathname, nextName, onShownModuleDeps);
        } else {
          deps['!#! - '+dep] = {};
          next();
        }
      }

      function onDepsDone() {
        callback(null, deps);
      }

      depList = showDeps(str);
      //console.log('depList: ', depList);
      depList.forEachAsync(forEachDep).then(onDepsDone);
    }

    function onReadScript(err, dir, name, str) {
      if (err) {
        console.error('[ERROR]: ', err);
        return;
      }
      //console.log('[LOG]: ', str && str.length);
      dirname = dir;
      filename = name;
      onScriptStr(str);
    }

    //console.log('showDeps called: ', pkgname, 'in', pkgroot, 'looking for', dirname + '/' + filename);
    readScript(dirname + '/' + filename, onReadScript);
  }

  function onShownDepsFile(err, tree) {
    if (err) { console.error('ERR: [onShownDepsFile]'); }
    console.log(JSON.stringify(tree, null, '  '));
  }

  showDepsFile('test-local-deps', 'lib', '.', 'test-local-deps.js', onShownDepsFile);
}());
