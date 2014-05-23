var parameters = require('./helpers/parameters');
var exec = require('child_process').exec, child;
var path = require('path');
var http = require('http');
var url = require('url');
var fs = require('fs');
var querystring = require('querystring');
var express = require('express');

var host = '0.0.0.0';
var port = 5000;

var app = express();

var ID_FROM_BD = 1;
var SERVER_IP = '150.165.204.30';

app.use(express.static(path.join(__dirname, '/videos')));
app.use(express.bodyParser({ keepExtensions: true, uploadDir: path.join(__dirname, '/uploads') }));

app.get('/', function(req, res){
	res.send(200, { 'status': 'server is running!' } );
});

app.post('/api', function(req, res){
	console.log('Query: \n' + req.query);
	console.log('Params: \n' + req.params);
	/* Verifica se o paramêtro [servico] possui algum valor */
	if (req.query.servico !== '') {
		/* Verifica qual é o Tipo de Serviço fornecido */ 
		switch(req.query.servico) {
			/* Case para o Tipo de Serviço: Texto */
			case 'texto':
				/* Verifica se os paramêtros [transparencia, texto] possuem algum valor */
				if ((req.query.transparencia !== '') && (req.query.texto !== '')) {
					/* Verifica se o paramêtro [transparencia] possui os únicos valores possíveis [opaco, transparente] */
					if (parameters.checkTransparency(req.query.transparencia)) {
						/* Cria a linha de comando */
						var command_line = 'echo ' + req.query.texto + ' >> ' + __dirname + '/text_files/' + ID_FROM_BD + ' && cd ../vlibras-core' +
											' && ./vlibras ' + parameters.getServiceType(req.query.servico) + ' ../vlibras-api/text_files/' + 
											ID_FROM_BD + ' ' + parameters.getTransparency(req.query.transparencia) + ' ' + ID_FROM_BD + ' WEB';

						/* Executa a linha de comando */
						child = exec(command_line, function(err, stdout, stderr) { 
						 	// [stdout] = vlibras-core output
						 	// console.log(stdout);
						});

						/* Listener que dispara quando a requisição ao core finaliza */
						child.on('close', function(code, signal){
							res.send(200, { 'response' : 'http://' + SERVER_IP + ':' + port + '/' + ID_FROM_BD + '.webm' });
							ID_FROM_BD++;
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
			break;

			/* Case para o Tipo de Serviço: iOS */
			case 'ios':
				/* Verifica se os paramêtros [transparencia, texto] possuem algum valor */
				if ((req.query.transparencia !== '') && (req.query.texto !== '')) {
					/* Verifica se o paramêtro [transparencia] possui os únicos valores possíveis [opaco, transparente] */
					if (parameters.checkTransparency(req.query.transparencia)) {
						/* Cria a linha de comando */
						var command_line = 'echo ' + req.query.texto + ' >> ' + __dirname + '/text_files/' + ID_FROM_BD + ' && cd ../vlibras-core' +
											' && ./vlibras ' + parameters.getServiceType(req.query.servico) + ' ../vlibras-api/text_files/' + 
											ID_FROM_BD + ' ' + parameters.getTransparency(req.query.transparencia) + ' ' + ID_FROM_BD + ' IOS';

						/* Executa a linha de comando */
						child = exec(command_line, function(err, stdout, stderr) { 
						 	// [stdout] = vlibras-core output
						 	// console.log(stdout);
						});

						/* Listener que dispara quando a requisição ao core finaliza */
						child.on('close', function(code, signal){
							res.send(200, { 'response' : 'http://' + SERVER_IP + ':' + port + '/' + ID_FROM_BD + '.avi' });
							ID_FROM_BD++;
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
			break;

			case 'video':
				/* Verifica se os paramêtros [posicao, tamanho, transparencia] possuem algum valor */
				if ((req.query.posicao !== '') && (req.query.tamanho !== '') && (req.query.transparencia !== '')) {
					/* Verifica se os paramêtros [linguagem, posicao, tamanho, transparencia] possuem os seus únicos valores possíveis */
					if ((parameters.checkPosition(req.query.posicao) === true) && (parameters.checkSize(req.query.tamanho) === true) && (parameters.checkTransparency(req.query.transparencia) === true)) {
						/* Checa se o arquivo de vídeo submetivo possui uma extensão válida */
						if (parameters.checkVideo(req.files.video.name)) {
							/* Cria uma pasta cujo o nome é o ID */
							child = exec('mkdir ' + __dirname + '/uploads/' + ID_FROM_BD);

							/* Listener que dispara quando a pasta é criada */
							child.on('close', function(code, signal){
								/* Move o vídeo submetido para a pasta com o seu ID correspondente */
								fs.rename(req.files.video.path, __dirname + '/uploads/' + ID_FROM_BD + '/' + req.files.video.name, function(error) {
									if (error) { console.log(error); }
								});

								/* Cria a linha de comando */
								var command_line = 'vlibras_user/vlibras-core/./vlibras ' + parameters.getServiceType(req.query.servico) + ' uploads/' + ID_FROM_BD + '/' +
													req.files.video.name + ' 1 ' + parameters.getPosition(req.query.posicao) + ' ' + parameters.getSize(req.query.tamanho) + ' ' +
													parameters.getTransparency(req.query.transparencia) + ' ' + ID_FROM_BD;

								/* Executa a linha de comando */
								child = exec(command_line, function(err, stdout, stderr) { 
								 	// [stdout] = vlibras-core output
								 	// console.log(stdout);
								});

								if (req.query.callback === undefined) {
									/* Listener que dispara quando a requisição ao core finaliza */
									child.on('close', function(code, signal){
										res.send(200, { 'response' : 'http://' + SERVER_IP + ':' + port + '/' + ID_FROM_BD + '.flv' });
										ID_FROM_BD++;
									});

									/* Listener que dispara quando a requisição ao core da erro */
									child.on('error', function(code, signal){
										res.send(500, parameters.errorMessage('Erro na chamada ao core'));
									});
								} else {

									var path = url.parse(req.query.callback);

									var data = querystring.stringify({ 'response' : 'http://' + SERVER_IP + ':' + port + '/' + ID_FROM_BD + '.flv' });

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
								}
							});
						} else {
							res.send(500, parameters.errorMessage('Vídeo com Extensão Inválida'));
						}
					} else {
						res.send(500, parameters.errorMessage('Parâmetros insuficientes ou inválidos'));
					}
				} else {
					res.send(500, parameters.errorMessage('O valor de algum parâmetro está vazio'));
				}
			break;

			case 'legenda':
				/* Verifica se o paramêtro [transparencia] possue algum valor */
				if (req.query.transparencia !== '') {
					/* Verifica se os paramêtros [transparencia] possuem os seus únicos valores possíveis */
					if ((parameters.checkTransparency(req.query.transparencia) === true)) {
						/* Checa se o arquivo de legenda submetivo possui uma extensão válida */
						if (parameters.checkSubtitle(req.files.legenda.name)) {
							/* Cria uma pasta cujo o nome é o ID */
							child = exec('mkdir ' + __dirname + '/uploads/' + ID_FROM_BD);

							/* Listener que dispara quando a pasta é criada */
							child.on('close', function(code, signal){
								/* Move a legenda submetido para a pasta com o seu ID correspondente */
								fs.rename(req.files.legenda.path, __dirname + '/uploads/' + ID_FROM_BD + '/' + req.files.legenda.name, function(error) {
									if (error) { console.log(error); }
								});

								/* Cria a linha de comando */
								var command_line = 'vlibras_user/vlibras-core/./vlibras ' + parameters.getServiceType(req.query.servico) + ' uploads/' + ID_FROM_BD + '/' +
													req.files.legenda.name + ' ' + parameters.getTransparency(req.query.transparencia) + ' ' + ID_FROM_BD;

								/* Executa a linha de comando */
								child = exec(command_line, function(err, stdout, stderr) { 
								 	// [stdout] = vlibras-core output
								 	// console.log(stdout);
								});

								/* Listener que dispara quando a requisição ao core finaliza */
								child.on('close', function(code, signal){
									res.send(200, { 'response' : 'http://' + SERVER_IP + ':' + port + '/' + ID_FROM_BD + '.flv' });
									ID_FROM_BD++;
								});

								/* Listener que dispara quando a requisição ao core da erro */
								child.on('error', function(code, signal){
									res.send(500, parameters.errorMessage('Erro na chamada ao core'));
								});
							});
						} else {
							res.send(500, parameters.errorMessage('Legenda com Extensão Inválida'));
						}
					} else {
						res.send(500, parameters.errorMessage('Parâmetros insuficientes ou inválidos'));
					}
				} else {
					res.send(500, parameters.errorMessage('O valor de algum parâmetro está vazio'));
				}
			break;

			case 'video-legenda':
				/* Verifica se os paramêtros [transparencia, texto] possuem algum valor */
				if ((req.query.linguagem !== '') && (req.query.posicao !== '') && (req.query.tamanho !== '') && (req.query.transparencia !== '')) {
					/* Verifica se os paramêtros [linguagem, posicao, tamanho, transparencia] possuem os seus únicos valores possíveis */
					if ((parameters.checkLanguage(req.query.linguagem) === true) && (parameters.checkPosition(req.query.posicao) === true) && (parameters.checkSize(req.query.tamanho) === true) && (parameters.checkTransparency(req.query.transparencia) === true)) {
						/* Checa se o arquivo de vídeo submetivo possui uma extensão válida */
						if (parameters.checkVideo(req.files.video.name)) {
							/* Checa se o arquivo de legenda submetivo possui uma extensão válida */
							if (parameters.checkSubtitle(req.files.legenda.name)) {
								/* Cria uma pasta cujo o nome é o ID */
								child = exec('mkdir ' + __dirname + '/uploads/' + ID_FROM_BD);

								/* Listener que dispara quando a pasta é criada */
								child.on('close', function(code, signal){

									/* Move o vídeo submetido para a pasta com o seu ID correspondente */
									fs.rename(req.files.video.path, __dirname + '/uploads/' + ID_FROM_BD + '/' + req.files.video.name, function(error) {
										if (error) { console.log(error); }
									});

									/* Move a legenda submetido para a pasta com o seu ID correspondente */
									fs.rename(req.files.legenda.path, __dirname + '/uploads/' + ID_FROM_BD + '/' + req.files.legenda.name, function(error) {
										if (error) { console.log(error); }
									});

									/* Cria a linha de comando */
									var command_line = 'vlibras_user/vlibras-core/./vlibras ' + parameters.getServiceType(req.query.servico) + ' uploads/' + ID_FROM_BD + '/' +
													req.files.video.name + ' uploads/' + ID_FROM_BD + '/' + req.files.legenda.name + ' ' + parameters.getLanguage(req.query.linguagem) +
													' ' + parameters.getPosition(req.query.posicao) + ' ' + parameters.getSize(req.query.tamanho) + ' ' +
													parameters.getTransparency(req.query.transparencia) + ' ' + ID_FROM_BD;

									/* Executa a linha de comando */
									child = exec(command_line, function(err, stdout, stderr) { 
									 	// [stdout] = vlibras-core output
									});

									if (req.query.callback === undefined) {
										/* Listener que dispara quando a requisição ao core finaliza */
										child.on('close', function(code, signal){
											res.send(200, { 'response' : 'http://' + SERVER_IP + ':' + port + '/' + ID_FROM_BD + '.flv' });
											ID_FROM_BD++;
										});
									} else {

										var path = url.parse(req.query.callback);

										var data = querystring.stringify({ 'response' : 'http://' + SERVER_IP + ':' + port + '/' + ID_FROM_BD + '.flv' });

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
										    res.on('data', function (chunk) {
										        console.log("body: " + chunk);
										    });
										});

										requesting.write(data);
										requesting.end();
									}

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
								});
							} else {
								res.send(500, parameters.errorMessage('Legenda com Extensão Inválida'));
							}
						} else {
							res.send(500, parameters.errorMessage('Vídeo com Extensão Inválida'));
						}
					} else {
						res.send(500, parameters.errorMessage('Parâmetros insuficientes ou inválidos'));
					}
				} else {
					res.send(500, parameters.errorMessage('O valor de algum parâmetro está vazio'));
				}
			break;

			/* Case para um Tipo de Serviço inválido */
			default:
				res.send(500, parameters.errorMessage('Tipo do serviço inválido'));
			break;
		}
	} else {
		res.send(500, parameters.errorMessage('Especifique o tipo do serviço'));
	}
});

app.listen(port, host, function(){
	console.log('Server running on ' + host + ':' + port);
});
