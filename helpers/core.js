var requests = require('../helpers/requests');
var properties = require('../helpers/properties');
var queue_helper = require('../helpers/queue');
var url = require('url');
var http = require('http');
var querystring = require('querystring');
var exec = require('child_process').exec, child;
var kue = require('kue'),
    queue = kue.createQueue();
var logger = require('../logsystem/main.js');

function call(id, command_line, req, res, Request, request_object) {
	/* Executa a linha de comando */
	// child = exec(command_line, function(err, stdout, stderr) {
	//  	// [stdout] = vlibras-core output
	// 	// console.log('Err: ' + err);
	// 	// console.log('STDOUT: ' + stdout);
	// 	// console.log('STDERR: ' + stderr);
	// });

	var child,
			job = queue.create('exec_command_line', {
	    title: 'Command Line for: ' + req.body.servico,
	    command_line: command_line
	}).removeOnComplete( true ).save();

	queue.process('exec_command_line', function(job, done){
		child = queue_helper.exec_command_line(job.data.command_line, done);
		if (child === undefined) {
			throw "Erro ao conectar com o core";
		}
	});

	job.on('complete', function() {
		// Se o callback não foi definido
		if (req.body.callback === undefined) {

		  // Se a chamada foi feita com sucesso
		  child.on('close', function(code, signal) {

		    // Se o core executou com erro
		    if (code !== 0) {
		      throw "Erro no retorno do core. Código: " + code;
		      db.update(Request, request_object.id, 'Error', function (result) {
		      });
		    }

		    // Se o core executou normal
			db.update(Request, request_object.id, 'Completed', function (result) {
		    });		   
		    res.send(200, { 'response' : 'http://' + properties.SERVER_IP + ':' + properties.port + '/' + id + '.mp4'});
		  });

		  // Se a chamada deu erro
		  child.on('error', function(code, signal) {
		    throw "Erro na chamada ao core";
		  });


		// Se o callback foi definido
		} else {

		  // Se a chamada foi feita com sucesso
		  child.on('close', function(code, signal) {

		    // Endereço do callback
		    var path = url.parse(req.body.callback);

		    // Se o core executou com erro
		    if (code === 0) {
		      var data = querystring.stringify({ 'response' : 'http://' + properties.SERVER_IP + ':' + properties.port + '/' + id + '.mp4', 'id' : id });
		    } else {
		      var data = querystring.stringify({ 'error': 'Erro no Core', 'code': code, 'id' : id });
          logger.incrementError("2");
		    }

		    // Chama o callback
		    requests.postRequest(path, data);
		  });

		  // Se a chamada deu erro
		  child.on('error', function(code, signal) {
		      var path = url.parse(req.body.callback);
		      var data = querystring.stringify( { 'error': 'Erro na chamada ao core', 'code': code, 'id': id } );
          logger.incrementError("2");
		      requests.postRequest(path, data);
		  });

		  // Retorno da primeira requisição
		  res.send(200, JSON.stringify({ 'id': id }));
		}
	});
}

module.exports.call = call;
