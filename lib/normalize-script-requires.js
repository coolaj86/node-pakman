(function () {
  "use strict";

  var escapeRegExpPattern = /[-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g
    ;

  function escapeRegExp(str) {
    return str.replace(escapeRegExpPattern, "\\$&");
  }

  function normalizeScriptRequires(sorted) {
    sorted.forEach(function (module) {
      var re
        ;

      re = new RegExp("\\brequire\\s*\\(\\s*['\"]" + escapeRegExp(module.require)  + "['\"]\\s*\\)", 'g');

      sorted.forEach(function (moduleb) {
        var newScript
          ;   

        // TODO doesn't account for cases such as `require(__dirname + '/path/to/submodule')`
        moduleb.scriptSource = moduleb.scriptSource.replace(re, " require('" + module.modulepath + "')");
      }); 
    }); 
  
    return sorted;
  }   

  module.exports.normalizeScriptRequires = normalizeScriptRequires;
}());
