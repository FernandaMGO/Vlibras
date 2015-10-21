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
var db = require('../db/api');

// req_type == "video" ou "outros" para ser usado no logger
function call(id, command_line, req, res, Request, request_object, req_type) {
	/* Executa a linha de comando */
	// child = exec(command_line, function(err, stdout, stderr) {
	//  	// [stdout] = vlibras-core output
	// 	// console.log('Err: ' + err);
	// 	// console.log('STDOUT: ' + stdout);
	// 	// console.log('STDERR: ' + stderr);
	// });

  // para ser usado no logger
  req_type = req_type === "videos" ? req_type : "outros";

  logger.incrementService(req_type, "requisicoes");

	var child,
			job = queue.create('exec_command_line' + id, {
	    title: 'Command Line for: ' + req.body.servico,
	    command_line: command_line
	}).removeOnComplete( true ).save();

	queue.process('exec_command_line' + id, function(job, done){
		child = queue_helper.exec_command_line(job.data.command_line, done);
	});

	job.on('complete', function() {
		// Se o callback não foi definido
		if (req.body.callback === undefined) {

		  // Se a chamada foi feita com sucesso
		  child.on('close', function(code, signal) {

		    // Se o core executou com erro
		    if (code !== 0) {
		      db.update(Request, request_object.id, 'Error', function (result) {
		      });
          console.log("Erro no retorno do core. Código: " + code);
          logger.incrementError('core', "Erro no retorno do core. Código: " + code);
		    } else {
          // Se o core executou normal
    			db.update(Request, request_object.id, 'Completed', function (result) {});
          res.send(200, { 'response' : 'http://' + properties.SERVER_IP + ':' + properties.port + '/' + id + '.mp4'});
          logger.incrementService(req_type, "traducoes");
        }
		  });

		  // Se a chamada deu erro
		  child.on('error', function(code, signal) {
		    console.log("Erro no retorno do core. Código: " + code);
        logger.incrementError('core', "Erro no retorno do core. Código: " + code);
		  });


		// Se o callback foi definido
		} else {

		  // Se a chamada foi feita com sucesso
		  child.on('close', function(code, signal) {
            var data;

		    // Endereço do callback
		    var path = url.parse(req.body.callback);

		    // Se o core executou com erro
		    // if (code === 0) {
		    //   data = querystring.stringify({ 'response' : 'http://' + properties.SERVER_IP + ':' + properties.port + '/' + id + '.mp4', 'id' : id });
		    // } else {
		    //   data = querystring.stringify({ 'error': 'Erro no Core', 'code': code, 'id' : id });
        //   logger.incrementError('core', "Erro no retorno do core. Código: " + code);
		    // }

        // Se o core executou com erro
        if (code !== 0) {
          db.update(Request, request_object.id, 'Error', function (result) {
          });
          console.log("Erro no retorno do core. Código: " + code);
          logger.incrementError('core', "Erro no retorno do core. Código: " + code);
          data = {
            'error' : code
          };
        } else {
          // Se o core executou normal
          db.update(Request, request_object.id, 'Completed', function (result) {});
          res.send(200, { 'response' : 'http://' + properties.SERVER_IP + ':' + properties.port + '/' + id + '.mp4'});
          logger.incrementService(req_type, "traducoes");

          data = {
            'response' : 'http://' + properties.SERVER_IP + ':' + properties.port + '/' + id + '.mp4',
            'versao' : '1.0',
            'legenda' : ''
          };
        }
          console.log("Path == " + path);
          data = querystring.stringify(data);
          requests.postRequest(path, data);
		  });

		  // Se a chamada deu erro
		  child.on('error', function(code, signal) {
		      var path = url.parse(req.body.callback);
		      var data = querystring.stringify( { 'error': 'Erro na chamada ao core', 'code': code, 'id': id } );
          logger.incrementError('core', "Erro no retorno do core. Código: " + code);
		      requests.postRequest(path, data);
		  });

		  // Retorno da primeira requisição
		  res.send(200, JSON.stringify({ 'id': id }));
		}
	});
}

module.exports.call = call;
