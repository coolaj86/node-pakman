(function () {
  "use strict";

  var fs = require('fs')
    ;

  function getPackageInfo(moduleRoot, masterCallback) {

    function onPackageJsonRead(err, meta) {
      var sub = {}
        ;

      if (err) {
        masterCallback(err);
        return;
      }

      try {
        meta = JSON.parse(meta.toString('utf8'));
      } catch(e) {
        masterCallback(e);
        return;
      }

      // the main file is a special case
      meta.lib = meta.lib || '.';
      meta.moduleRoot = moduleRoot;

      masterCallback(null, meta);

    }

    fs.readFile(moduleRoot + '/package.json', onPackageJsonRead);
  }

  module.exports.getPackageInfo = getPackageInfo;
}());
