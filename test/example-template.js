(function () {

  "use strict";

  function templateModule(module) {
    var newScript
      ;   

    // module.providespath is added by normalizeScriptRequires
    // TODO move to where?

    if (!module) {
      console.log('missing module', module);
      return;
    }   

    if (!module.scriptSource) {
      console.log('missing script source', module);
      return;
    }   
  
    // I'm using the 'ender:' prefix to make it
    // easier to search for a module start
    newScript = ''
      + '\n// ender:' + module.modulepath + ' as ' + module.providespath
      + '\n(function () {' 
      + '\n  "use strict";' 
      + '\n  '
      + '\n  var module = { exports: {} }, exports = module.exports'
      + '\n    , $ = require("ender")'
      + '\n    ;'
      + '\n  '
      + '\n  '
      + '\n  ' + module.scriptSource.replace(/\n/g, '\n  ')
      + '\n'
      + '\n  provide("' + module.providespath + '", module.exports);'
      + '\n  $.ender(module.exports);'
      + '\n}());'
      ;   

    console.log(newScript);
    return newScript;
  }

  module.exports.render = templateModule;
}());
