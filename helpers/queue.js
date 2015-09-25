var exec = require('child_process').exec, child;

exports.exec_command_line = function (command_line, done) {

      child = exec(command_line, function(err, stdout, stderr) {
      //  console.log('Err: ' + err);
      //  console.log('STDOUT: ' + stdout);
      //  console.log('STDERR: ' + stderr);
    	});
      //done();
      // if (child === undefined) {
      //   throw "Erro ao conectar com o core";
      // }
      child.on('error', function(code, signal) {
        throw "Erro ao conectar com o core";
      });
      child.on('disconnect', function(code, signal) {
        throw "Disconectado do core";
      });

      // tentar com isso descomentado no lugar de chamar o done() direto
      // child.on('close', function(code, signal) {
      //   done();
      // });
      done();
      return child;

};

// use to debug
exports.text = function (text, callback) {
  console.log("Text inside queue_helper: " + text);
  return text;
};
