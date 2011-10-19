pakman
===

A collection of tools for building package managers.

Given a directory with a `package.json`, `pakman` can give you back concatonated normalized scripts that will run with a custom module loader - such as in the browser.

Demo
===

    git clone git://github.com/coolaj86/node-pakman.git
    cd node-pakman/tests
    ls ../test_modules/foomodule/
    node test-compile-local ../test_modules/foomodule/
