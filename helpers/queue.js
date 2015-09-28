var exec = require('child_process').exec, child;

exports.exec_command_line = function (command_line, done) {

      child = exec(command_line, function(err, stdout, stderr) {
      //  console.log('Err: ' + err);
      //  console.log('STDOUT: ' + stdout);
      //  console.log('STDERR: ' + stderr);
    	});

      child.on('error', function(code, signal) {
        throw new Error("Erro ao conectar com o core");
      });
      child.on('disconnect', function(code, signal) {
        throw new Error("Disconectado do core");
      });

      done();
      return child;

};

// use to debug
exports.text = function (text, callback) {
  console.log("Text inside queue_helper: " + text);
  return text;
};
