var parameters = require('../helpers/parameters');
var properties = require('../helpers/properties');

var exec = require('child_process').exec, child;
var fs = require('fs');

function init(req, res) {
	/* Verifica se os paramêtros [transparencia, texto] possuem algum valor */
	if ((req.body.transparencia !== '') && (req.body.texto !== '')) {
		/* Verifica se o paramêtro [transparencia] possui os únicos valores possíveis [opaco, transparente] */
		if (parameters.checkTransparency(req.body.transparencia)) {
			/* Cria a linha de comando */
			var command_line = 'echo ' + req.body.texto + ' >> ' + __dirname + '/text_files/' + properties.ID_FROM_BD + ' && cd ../vlibras-core' +
								' && ./vlibras ' + parameters.getServiceType(req.body.servico) + ' ../vlibras-api/text_files/' + 
								properties.ID_FROM_BD + ' ' + parameters.getTransparency(req.body.transparencia) + ' ' + properties.ID_FROM_BD + ' IOS';

			/* Executa a linha de comando */
			child = exec(command_line, function(err, stdout, stderr) { 
			 	// [stdout] = vlibras-core output
			 	// console.log(stdout);
			});

			/* Listener que dispara quando a requisição ao core finaliza */
			child.on('close', function(code, signal){
				res.send(200, { 'response' : 'http://' + properties.SERVER_IP + ':' + properties.port + '/' + properties.ID_FROM_BD + '.avi' });
				properties.ID_FROM_BD++;
			});

			/* Listener que dispara quando a requisição ao core da erro */
			child.on('error', function(code, signal){
				res.send(500, parameters.errorMessage('Erro na chamada ao core'));
			});
		} else {
			res.send(500, parameters.errorMessage('Parâmetros insuficientes ou inválidos'));
		}
	} else {
		res.send(500, parameters.errorMessage('O valor de algum parâmetro está vazio'));
	}
};

module.exports.init = init;