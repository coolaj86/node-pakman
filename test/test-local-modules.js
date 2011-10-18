(function () {
  "use strict";

  var getLocalRequires = require('./implicit-dependencies')
    , sortLocalDeps = require('./sort-local-dependencies').sortDependencies
    , traverser = require('./dependency-traverser')
    ;

  function escapeRegExp(str) {
    return str.replace(/[-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  }

  // we know that any module listed in NPM as a dependency
  // will be installed before this module is installed
  // However, we must also determine in what order this
  // module shall load itself
  function onGotLocalRequires(err, tree, callback) {
    function onSortedDependencies(err, missing, builtin, local, repo) {
      console.log('onSortedDependencies', err, local);
      var sorted = traverser.sortByDepth(tree)
        ;

      sorted.forEach(function (modulename) {
        var module = local[modulename];
        if (!module) {
          return;
        }
        console.log('Adjusting', modulename);

        sorted.forEach(function (modulename) {
          var moduleb = local[modulename]
            , re
            , newScript
            ;

          if (!moduleb) {
            return;
          }

          // doesn't account for cases such as `require(__dirname + '/path/to/submodule')`
          re = new RegExp("\\brequire\\s*\\(\\s*['\"]" + escapeRegExp(moduleb.require)  + "['\"]\\s*\\)", 'g');
          module.scriptSource = module.scriptSource.replace(re, " require('" + moduleb.modulepath + "')");
        });
      });
          
      callback(null, local, sorted);
    }

    sortLocalDeps(tree, onSortedDependencies);
  }

  function onGotOrganized(err, local, sorted) {
    sorted.forEach(function (modulename) {
      var newScript
        , module
        ;

      module = local[modulename];

      if (!module) {
        return;
      }
      
      // I'm using the 'ender:' prefix to make it
      // easier to search for a module start
      newScript = ''
        + '\n// ender:' + module.modulepath
        + '\n(function () {' 
        + '\n  "use strict";' 
        + '\n  var module = { exports: {} }, exports = module.exports;\n'
        + '\n  ' + module.scriptSource.replace(/\n/g, '\n  ') + '\n'
        + '\n  provide("' + module.modulepath + '", module.exports);'
        + '\n  $.ender(module.exports);'
        + '\n}());'
        ;

      console.log(newScript);
    });    
  }

  function getOrganized(modulepath, callback) {
    getLocalRequires(modulepath, function (err, tree) {
      onGotLocalRequires(err, tree, callback)
    });
  }

  var modulepath = process.argv[2]
    ;

  if (!modulepath) {
    console.error('you must specify the path of a modulepath to inspect: i.e. ./node_modules/futures');
    return;
  }

  getOrganized(modulepath, onGotOrganized);

  module.exports.getSortedDependencies = getOrganized;
}());
