var parameters = require('../helpers/parameters');
var properties = require('../helpers/properties');
var requests = require('../helpers/requests');

var exec = require('child_process').exec, child;
var querystring = require('querystring');
var uuid = require('node-uuid');
var mkdirp = require('mkdirp');
var http = require('http');
var url = require('url');
var fs = require('fs');

function init(req, res) {

	var id = uuid.v4();

	/* Verifica se os paramêtros [transparencia, texto] possuem algum valor */
	if ((req.body.linguagem === '') || (req.body.posicao === '') || (req.body.tamanho === '') || (req.body.transparencia === '')) {
		res.send(500, parameters.errorMessage('O valor de algum parâmetro está vazio'));
		return;
	}

	/* Verifica se os paramêtros [linguagem, posicao, tamanho, transparencia] possuem os seus únicos valores possíveis */
	if ((parameters.checkLanguage(req.body.linguagem) === false) || (parameters.checkPosition(req.body.posicao) === false) || (parameters.checkSize(req.body.tamanho) === false) || (parameters.checkTransparency(req.body.transparencia) === false)) {
		res.send(500, parameters.errorMessage('Parâmetros insuficientes ou inválidos'));
		return;
	}
			
	/* Checa se o arquivo de vídeo submetivo possui uma extensão válida */
	if (parameters.checkVideo(req.files.video.name) === false) {
		res.send(500, parameters.errorMessage('Vídeo com Extensão Inválida'));
		return;
	}

	/* Checa se o arquivo de legenda submetivo possui uma extensão válida */
	if (parameters.checkSubtitle(req.files.legenda.name) === false) {
		res.send(500, parameters.errorMessage('Legenda com Extensão Inválida'));
		return;
	}

	/* Cria uma pasta cujo o nome é o ID atual */
	mkdirp(properties.uploads_folder + id, function(error) {
	
		if (error) { console.log(error); return; }

		/* Move o vídeo submetido para a pasta com o seu ID correspondente */
		fs.rename(req.files.video.path, properties.uploads_folder + id + '/' + req.files.video.name, function(error) {
			if (error) { console.log(error); res.send(500, parameters.errorMessage('Erro ao mover o vídeo submetido')); return; }
		});

		/* Move a legenda submetido para a pasta com o seu ID correspondente */
		fs.rename(req.files.legenda.path, properties.uploads_folder + id + '/' + req.files.legenda.name, function(error) {
			if (error) { console.log(error); res.send(500, parameters.errorMessage('Erro ao mover a legenda submetido')); return; }
		});

		/* Cria a linha de comando */
		var command_line = 'vlibras_user/vlibras-core/./vlibras ' + parameters.getServiceType(req.body.servico) + ' uploads/' + id + '/' +
						req.files.video.name + ' uploads/' + id + '/' + req.files.legenda.name + ' ' + parameters.getLanguage(req.body.linguagem) +
						' ' + parameters.getPosition(req.body.posicao) + ' ' + parameters.getSize(req.body.tamanho) + ' ' +
						parameters.getTransparency(req.body.transparencia) + ' ' + id + ' > /tmp/core_log 2>&1';

		console.log(command_line);

		/* Executa a linha de comando */
		child = exec(command_line, function(err, stdout, stderr) { 
		 	// [stdout] = vlibras-core output
			// console.log('Err: ' + err);
			// console.log('STDOUT: ' + stdout);
			// console.log('STDERR: ' + stderr);
		});

		if (req.body.callback === undefined) {
			/* Listener que dispara quando a requisição ao core finaliza */
			child.on('close', function(code, signal){
				if (code !== 0) {
					console.log('Erro código: ' + code); res.send(500, { 'error': 'Erro no Core', 'code': code }); return;
				}

				res.send(200, { 'response' : 'http://' + properties.SERVER_IP + ':' + properties.port + '/' + id + '.flv' });
			});

			child.on('error', function(code, signal){
				res.send(500, parameters.errorMessage('Erro na chamada ao core'));
			});
		} else {

			child.on('close', function(code, signal){
				if (code !== 0) {
					var path = url.parse(req.body.callback);
					var data = querystring.stringify( { 'error': 'Erro no Core', 'code': code } );

					requests.postRequest(path, data);

					return;
				}

				var path = url.parse(req.body.callback);
				var data = querystring.stringify({ 'response' : 'http://' + properties.SERVER_IP + ':' + properties.port + '/' + id + '.flv' });

				requests.postRequest(path, data);
			});

			/* Listener que dispara quando a requisição ao core da erro */
			child.on('error', function(code, signal){
					var path = url.parse(req.body.callback);
					var data = querystring.stringify( { 'error': 'Erro na chamada ao core', 'code': code, 'id': id } );

					requests.postRequest(path, data);
			});

			res.send(200, JSON.stringify({ 'id': id }));
		}
	});
};

module.exports.init = init;
