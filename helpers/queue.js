var exec = require('child_process').exec, child;

exports.exec_command_line = function (command_line, callback) {
  child = exec(command_line, function(err, stdout, stderr) {
	 	// [stdout] = vlibras-core output
	});
  callback();
};
