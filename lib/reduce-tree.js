 (function () {
  "use strict";

  require('Array.prototype.forEachAsync');

  //You could traverse it like this
  function mapByDepth(rootPackage) {
    var depth = 0
      , allDeps = {}
      ;

    function traverseDeps(childPackage) {
      depth += 1;

      childPackage.dependencyTree = childPackage.dependencyTree || {};
      Object.keys(childPackage.dependencyTree).forEach(function (depName) {
        var childDeps = (childPackage.dependencyTree[depName] || {}) || {}
          ;

        allDeps[depth] = allDeps[depth] || [];
        allDeps[depth].push(depName);

        if (childDeps) {
          traverseDeps(childDeps);
        }
      });

      depth -= 1;
    }

    traverseDeps(rootPackage);
    return allDeps;
  }

  //And then you can reduce that result into a simple list like so:
  function reduceByDepth(depthTree) {
    var order = 0
      , handled = {}
      , useInOrder = []
      ;

    // it's important to sort and reverse the key listing so that 
    // the most deeply depended on modules are always installed first and listed first in ender.js
    Object.keys(depthTree).sort().reverse().forEach(function (depth) {
      var depNames = depthTree[depth]
        ;

      depNames.forEach(function (depName) {
        if (!handled[depName]) {
          handled[depName] = true;
          useInOrder.push(depName);
        }
      });

    });

    return useInOrder;
  }

  function sortByDepth(rootPackage) {
    return reduceByDepth(mapByDepth(rootPackage));
  }

  module.exports.mapByDepth = mapByDepth;
  module.exports.reduceByDepth = reduceByDepth;
  // maps and reduces
  module.exports.sortByDepth = sortByDepth;
  module.exports.reduceTree = sortByDepth;
}());
