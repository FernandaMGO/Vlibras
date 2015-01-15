var requests = require('../helpers/requests');
var properties = require('../helpers/properties');

var url = require('url');
var http = require('http');
var querystring = require('querystring');
var exec = require('child_process').exec, child;

function call(id, command_line, req, res) {
	/* Executa a linha de comando */
	child = exec(command_line, function(err, stdout, stderr) { 
	 	// [stdout] = vlibras-core output
		// console.log('Err: ' + err);
		// console.log('STDOUT: ' + stdout);
		// console.log('STDERR: ' + stderr);
	});

	// Se o callback não foi definido
	if (req.body.callback === undefined) {

		// Se a chamada foi feita com sucesso
		child.on('close', function(code, signal) {

			// Se o core executou com erro
			if (code !== 0) {
				throw "Erro no retorno do core. Código: " + code;
			}

			// Se o core executou normal
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
			}

			// Chama o callback
			requests.postRequest(path, data);
		});

		// Se a chamada deu erro
		child.on('error', function(code, signal) {
				var path = url.parse(req.body.callback);
				var data = querystring.stringify( { 'error': 'Erro na chamada ao core', 'code': code, 'id': id } );

				requests.postRequest(path, data);
		});

		// Retorno da primeira requisição
		res.send(200, JSON.stringify({ 'id': id }));
	}
}

module.exports.call = call;