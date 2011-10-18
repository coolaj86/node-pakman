(function () {
  "use strict";

   function readScript(moudlePath, pathname, callback) {
    var paths
      , name
      , main = 'index.js'
      ;   

    function onFileRead(err, data) {
      if (err) {
        console.error('[ERROR (readScript)] :', pathname);
        callback(err);
        return;
      }   

      callback(null, paths.join('/'), name, data.toString('utf8'));
    }   

    function onDirRead(err, nodes) {
      if (err) {
        callback(new Error("Couldn't find \"" + modulePath + '/' + paths.join('/') + "\""));
        return;
      }   

      if (-1 !== nodes.indexOf(name)) {
        if (/\.js$/.exec(name)) {
          // probably a file
          getFile(modulePath + '/' + pathname, onFileRead);
        } else {
          // probably a directory
          paths.push(name);
          name = main;
          getFile(modulePath + '/' + pathname + '/' + main, onFileRead);
        }   
      } else if (-1 !== nodes.indexOf(name + '.js')) {
        // probably a file
        name += '.js';
        getFile(modulePath + '/' + pathname + '.js', onFileRead);
      } else {
        // not a directory nor a file
        // probably doesn't exist
        callback(new Error("Couldn't find \"" + pathname + "\""));
      }   
    }   

    paths = pathname.split('/');
    name = paths.pop();
      
    fs.readdir(modulePath + '/' + paths.join('/'), onDirRead);
  }  

  function getModuleFile(meta, modulePath, pathname, fn) {
  }

  // getSubModule
  module.exports = getModuleFile;
}());
