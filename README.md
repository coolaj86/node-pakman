pakman
===

A collection of tools for building package managers.

Given a directory with a `package.json`, `pakman` can give you back concatonated normalized scripts that will run with a custom module loader - such as in the browser.

Features
---

  * alternate dependency lists - searches in this order:
      * package.json.ender.dependencies
      * package.json.enderDependencies
      * package.json.browserDependencies
      * package.json.dependencies
  * modulename aliasing - normalizes local requires as 'mymodule/submodule' or 'myprovidesalias/submodule'
      * package.json.provides
      * package.json.name

Demo
===

    git clone git://github.com/coolaj86/node-pakman.git
    cd node-pakman/tests
    ls ../test_modules/foomodule/
    node test-compile-local ../test_modules/foomodule/

API
===

In order to make debugging (and extension) simpler, every API function is in it's own file in `lib` and contains and point-and-shoot test in `test`.

modules
---

Each module object looks something like this:

    {
        "package": "foomodule-browser",           // npm name
        "name": "corge",
        "pathname": ".",                          // relative to package.json.lib
        "filename": "corge.js",
        "require": "../corge",                    // how this module was require by it's parent
        "modulepath": "foomodule-browser/corge",
        "providespath": "foomodule/corge",        // where package.json.provides is 'foomodule'
        "requires": [
            "./foo",
            "bar"
        ],

        "scriptSource": "(function () {\n  \"use strict\";\n\n  require('./foo');\n  require('bar');\n\n}());\n",

        "dependencyList": [ ... ], // other modules, ordered (by line number)
        "dependencyTree": { ... }, // other modules, mapped by modulepath

        // in the case that it is unknown if the module will be supplied elsewhere
        "warning": {
            "code": 300,
            "symbol": "AMBIGUOUS_DEPENDENCY",
            "message": "This module appeared as though it should be local, but may be in npm"
        },

        // in the case that it is known the module cannot be found
        "error": {
            "stack": "Error: Couldn't find \"./doesnt-exist\"\n    at onDirRead (./lib/get-script.js:50:18)",
            "message": "Couldn't find \"./doesnt-exist\""
        }
    }

makePackageReady
---

Given a module path, makes the module package-ready - hands you back everything you need to template the dependency with your own packag system.


    var makePackageReady = require('../lib/make-package-ready').makePackageReady
      ;

    function handlePackageComponents(error, pkg, missing, unlisted, unused, local, pm, builtin) {
      // error{} - couldn't read package.json, etc
      // pkg{} - the package.json info
      // missing[] - local files referenced, but not found
      // unlisted[] - npm modules referenced, but not in package.json
      // unused[] - npm modules in package.json, but not references
      // local[] - all local modules, ordered as they would need to be listed in a browser package
      // pm[] - all package-managed (npm) modules
      // builtin[] - builtin modules (such as `window`, `document`, etc in the browser, or `Buffer` in node)
    }

    // the directory must contain a `package.json`
    makePackage('/path/to/some/module', handlePackageComponents);

Found in `lib/make-package-ready.js`

Requires

  * `sort-tree-by-types`
  * `reduce-tree`
  * `get-package-tree`
  * `normalize-package-dependencies`
  * `normalize-script-requires`
