(function () {
  "use strict";

  var handleModule = require('./implicit-dependencies')
    ;

  // traverse the tree of local dependencies and provide a flattened
  // list for those that are not local
  function getNpmDeps(tree) {
    // TODO remove @x.y.z if present
    Object.keys(tree).forEach(function () {
    });
  }

  handleModule('./test_modules/foomodule', function (err, tree) {
      if (err) {
        console.error('ERR: [handleModule]');
        throw err;
        console.error(err);
        return;
      }

      console.log(JSON.stringify(tree, null, '  '));
  });

}());
