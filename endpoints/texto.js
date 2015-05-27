var parameters = require('../helpers/parameters');
var properties = require('../helpers/properties');
var db = require('../db/api');
var exec = require('child_process').exec, child;
var uuid = require('node-uuid');
var fs = require('fs');

function init(req, res, Request) {

	var id = uuid.v4();

	/* Verifica se os paramêtros [transparencia, texto] possuem algum valor */
	if ((req.body.transparencia === '') || (req.body.texto === '')) {
		res.send(500, parameters.errorMessage('O valor de algum parâmetro está vazio'));
		return;
	}

	/* Verifica se o paramêtro [transparencia] possui os únicos valores possíveis [opaco, transparente] */
	if (parameters.checkTransparency(req.body.transparencia) === false) {
		res.send(500, parameters.errorMessage('Parâmetros insuficientes ou inválidos'));
		return;
	}

	var request_object = new Request({
		id: id,
		type: req.body.servico,
		status: 'Submitted',
		created_at: new Date(),
		updated_at: new Date(),
	});

	db.create(request_object, function(result) {
		if (result !== null) {
			res.send(200, { 'status': 'Requisição ' + result.id + ' cadastrada com sucesso.'});
		} else {
			res.send(500, { 'error': 'Erro na criação da requisição.'});
		}
	});

	/* Cria a linha de comando */
	var command_line = 'echo ' + req.body.texto + ' >> text_files/' + id + ' && mkdir uploads/' + id + ' && vlibras_user/vlibras-core/./vlibras ' + parameters.getServiceType(req.body.servico) + ' text_files/' + 
						id + ' ' + parameters.getTransparency(req.body.transparencia) + ' ' + id + ' WEB > /tmp/core_log 2>&1';

        console.log(command_line)

	/* Executa a linha de comando */
	child = exec(command_line, function(err, stdout, stderr) { 
	 	// [stdout] = vlibras-core output
	});

	/* Listener que dispara quando a requisição ao core finaliza */
	child.on('close', function(code, signal){
//		res.send(200, { 'response' : 'http://' + properties.SERVER_IP + ':' + properties.port + '/' + id + '.webm' });
		db.update(request_object, 'Completed', function(result) {
		});
	});

	/* Listener que dispara quando a requisição ao core da erro */
	child.on('error', function(code, signal){
		res.send(500, parameters.errorMessage('Erro na chamada ao core'));
		db.update(request_object, 'Error', function(result) {
		});
	});
};

module.exports.init = init;
