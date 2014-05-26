var parameters = require('../helpers/parameters');
var properties = require('../helpers/properties');

var exec = require('child_process').exec, child;
var querystring = require('querystring');
var mkdirp = require('mkdirp');
var http = require('http');
var url = require('url');
var fs = require('fs');

function init(req, res) {
	/* Verifica se os paramêtros [posicao, tamanho, transparencia] possuem algum valor */
	if ((req.body.posicao === '') || (req.body.tamanho === '') || (req.body.transparencia === '')) {
		res.send(500, parameters.errorMessage('O valor de algum parâmetro está vazio'));
		return;
	}

	/* Verifica se os paramêtros [linguagem, posicao, tamanho, transparencia] possuem os seus únicos valores possíveis */
	if ((parameters.checkPosition(req.body.posicao) === false) || (parameters.checkSize(req.body.tamanho) === false) || (parameters.checkTransparency(req.body.transparencia) === false)) {
		res.send(500, parameters.errorMessage('Parâmetros insuficientes ou inválidos'));
		return;
	}

	/* Checa se o arquivo de vídeo submetivo possui uma extensão válida */
	if (parameters.checkVideo(req.files.video.name) === false) {
		res.send(500, parameters.errorMessage('Vídeo com Extensão Inválida'));
		return;
	}

	/* Cria uma pasta cujo o nome é o ID atual */
	mkdirp('/home/libras/vlibras-api/uploads/' + properties.ID_FROM_BD, function(error) {
	
		if (error) { console.log(error); res.send(500, parameters.errorMessage('Erro na criação da pasta com o ID: ' + properties.ID_FROM_BD)); return; }

		/* Move o vídeo submetido para a pasta com o seu ID correspondente */
		fs.rename(req.files.video.path, '/home/libras/vlibras-api/uploads/' + properties.ID_FROM_BD + '/' + req.files.video.name, function(error) {
			if (error) { console.log(error); res.send(500, parameters.errorMessage('Erro ao mover o vídeo submetido')); return; }
		});

		/* Cria a linha de comando */
		var command_line = 'vlibras_user/vlibras-core/./vlibras ' + parameters.getServiceType(req.body.servico) + ' uploads/' + properties.ID_FROM_BD + '/' +
							req.files.video.name + ' 1 ' + parameters.getPosition(req.body.posicao) + ' ' + parameters.getSize(req.body.tamanho) + ' ' +
							parameters.getTransparency(req.body.transparencia) + ' ' + properties.ID_FROM_BD;

		/* Executa a linha de comando */
		child = exec(command_line, function(err, stdout, stderr) { 
		 	// [stdout] = vlibras-core output
			console.log('Err: ' + err);
			console.log('STDOUT: ' + stdout);
			console.log('STDERR: ' + stderr);
		});

		if (req.body.callback === undefined) {
			/* Listener que dispara quando a requisição ao core finaliza */
			child.on('close', function(code, signal){
				if (code !== 0) {
					{ console.log(error); res.send(500, { 'error': 'Erro no Core', 'code': code }); return; }
				}

				res.send(200, { 'response' : 'http://' + properties.SERVER_IP + ':' + properties.port + '/' + properties.ID_FROM_BD + '.flv' });
				properties.ID_FROM_BD++;
			});

			child.on('error', function(code, signal){
				res.send(500, parameters.errorMessage('Erro na chamada ao core'));
			});
		} else {

			child.on('close', function(code, signal){
				if (code !== 0) {
					{ console.log(error); res.send(500, { 'error': 'Erro no Core', 'code': code }); return; }
				}

				var path = url.parse(req.body.callback);

				var data = querystring.stringify({ 'response' : 'http://' + properties.SERVER_IP + ':' + properties.port + '/' + properties.ID_FROM_BD + '.flv' });

				var options = {
					host: path.hostname,
					port: path.port,
					path: path.path,
					method: 'POST',
				    headers: {
				        'Content-Type': 'application/x-www-form-urlencoded',
				        'Content-Length': Buffer.byteLength(data)
				    }
				};

				var requesting = http.request(options, function(res) {
				    res.setEncoding('utf8');
				    // res.on('data', function (chunk) {
				    //     console.log("req.body: " + chunk);
				    // });
				});

				requesting.write(data);
				requesting.end();

				properties.ID_FROM_BD++;
			});

			/* Listener que dispara quando a requisição ao core da erro */
			child.on('error', function(code, signal){

				var data = querystring.stringify(parameters.errorMessage('Erro na chamada ao core'));

				var options = {
					host: path.hostname,
					port: path.port,
					path: path.path,
					method: 'POST',
				    headers: {
				        'Content-Type': 'application/x-www-form-urlencoded',
				        'Content-Length': Buffer.byteLength(data)
				    }
				};

				var requesting = http.request(options, function(res) {
				    res.setEncoding('utf8');
				});

				requesting.write(data);
				requesting.end();
			});

			res.send(200);
		}
	});
};

module.exports.init = init;