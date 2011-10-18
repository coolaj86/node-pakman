(function () {
  "use strict";

  var reFindRequires = /\brequire\s*\(['"](.*?)['"]\)/g
    ;

  function getRequires(str) {
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

  module.exports.getRequires = getRequires;
}());
