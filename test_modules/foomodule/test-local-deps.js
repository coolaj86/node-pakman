(function () {
  var npm = require('npm')
    , fs = require('fs')
    , path = require('path')
    , xyz = require('test-local-deps/corge')
    , abc = require('./foo')
    , allModules = {}
    , reIsLocal = /^\.{0,2}\//
    ;

  //console.log('npm.commands', npm.commands);

  // https://github.com/isaacs/npm/issues/1493
  // this fixes a broken part of the API
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

  npm.load({}, function () {
    /*
    npm.commands.install(__dirname + '/', ['future'], function (err, a, b, c) {
      console.log(err);
      console.log(a);
      console.log(b);
      console.log(c);
    });
    */
    /*
    npm.commands.view(["futures@>= 2.3.0"], true, function (err, map, array) {
      array = hotFix1493(map);
      console.log(err);
      console.log(map);
      console.log(array);
    });
    */

    var paths = [
          // considered to be local
            "./"
          , "../"
          , "./package"
          , "/abspath/to/package"
          , "../package"
          , "../../package"
          // considered to be remote
          , "..package"
          , "package/slashname"
          , "package../weirdname"
          , "package/..weirdname"
          , "package/../weirdname"
          , "package/slashname"
          , "packagename"
        ]
      ;

    paths.forEach(function (pathname) {
      var newpathname = pathname;
      //if (/^\/|(^|\/)\.{1,2}\//.exec(pathname)) {
      if (reIsLocal.exec(pathname)) {
        newpathname = '!' + path.resolve('./', pathname);
      }
      console.log(pathname === newpathname, newpathname, pathname);
    });

    function view(pkg, callback) {
      function onViewable(err, map, array) {
        console.log(err);
        console.log(map);
        console.log(array);
      }

      function fixView(err, map) {
        if (err) {
          throw err;
        }

        array = hotFix1493(map);
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
        console.log('local', pkg);
        pkg = path.resolve(pkg);
        fs.readFile(pkg + '/package.json', manglePackageJson);
      } else {
        console.log('remote', pkg);
        npm.commands.view([pkg], true, fixView);
      }
    }

    view('./');
    view('futures');
  });
}());
