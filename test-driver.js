(function () {
  "use strict";

  var handleModule = require('./implicit-dependencies')
    ;

  handleModule('./test_modules/foomodule', function (err, tree) {
      if (err) {
        console.error('ERR: [handleModule]');
        throw err;
        console.error(err);
        return;
      }

      //console.log(JSON.stringify(tree, null, '  '));
  });

}());
