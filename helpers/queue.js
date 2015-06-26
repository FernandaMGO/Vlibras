var exec = require('child_process').exec, child;

exports.exec_command_line = function (command_line, callback) {

      child = exec(command_line, function(err, stdout, stderr) {
      //  console.log('Err: ' + err);
      //  console.log('STDOUT: ' + stdout);
      //  console.log('STDERR: ' + stderr);
    	});
      //callback();
      // if (child === undefined) {
      //   throw "Erro ao conectar com o core";
      // }
      child.on('error', function(code, signal) {
        throw "Erro ao conectar com o core";
      });
      child.on('disconnect', function(code, signal) {
        throw "Disconectado do core";
      });
      return child;

};
