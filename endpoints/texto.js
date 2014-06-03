var parameters = require('../helpers/parameters');
var properties = require('../helpers/properties');

var exec = require('child_process').exec, child;
var uuid = require('node-uuid');
var fs = require('fs');

function init(req, res) {

	var id = uuid.v4();

	/* Verifica se os paramêtros [transparencia, texto] possuem algum valor */
	if ((req.body.transparencia !== '') && (req.body.texto !== '')) {
		res.send(500, parameters.errorMessage('O valor de algum parâmetro está vazio'));
		return;
	}

	/* Verifica se o paramêtro [transparencia] possui os únicos valores possíveis [opaco, transparente] */
	if (parameters.checkTransparency(req.body.transparencia)) {
		res.send(500, parameters.errorMessage('Parâmetros insuficientes ou inválidos'));
		return;
	}

	/* Cria a linha de comando */
	var command_line = 'echo ' + req.body.texto + ' >> ' + __dirname + '/text_files/' + id + ' && cd ../vlibras-core' +
						' && ./vlibras ' + parameters.getServiceType(req.body.servico) + ' ../vlibras-api/text_files/' + 
						id + ' ' + parameters.getTransparency(req.body.transparencia) + ' ' + id + ' WEB';

	/* Executa a linha de comando */
	child = exec(command_line, function(err, stdout, stderr) { 
	 	// [stdout] = vlibras-core output
	});

	/* Listener que dispara quando a requisição ao core finaliza */
	child.on('close', function(code, signal){
		res.send(200, { 'response' : 'http://' + properties.SERVER_IP + ':' + properties.port + '/' + id + '.webm' });
	});

	/* Listener que dispara quando a requisição ao core da erro */
	child.on('error', function(code, signal){
		res.send(500, parameters.errorMessage('Erro na chamada ao core'));
	});
};

module.exports.init = init;