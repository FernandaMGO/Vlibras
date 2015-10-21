var parameters = require('../helpers/parameters');
var properties = require('../helpers/properties');
var files = require('../helpers/files');
var core = require('../helpers/core');
var db = require('../db/api');
var queue_helper = require('../helpers/queue');
var exec = require('child_process').exec, child;
var uuid = require('node-uuid');
var mkdirp = require('mkdirp');
var async = require('async');
var _ = require('lodash');
var kue = require('kue'),
    queue = kue.createQueue();
var logger = require('../logsystem/main.js');


function init(req, res, Request) {
	res.set("Content-Type", "application/json");

	if (_.isEmpty(req.body.legenda_url) && _.isEmpty(req.body.video_url)) {
		res.send(500, parameters.errorMessage('O valor do parâmetro legenda_url e video_url está vazio'));
    logger.incrementError("video", "O valor do parâmetro legenda_url e video_url está vazio");
    logger.incrementError("legenda", "O valor do parâmetro legenda_url e video_url está vazio");
		return;
	}

	if (_.includes(req.body.revisaomanual.toUpperCase(), "SIM", "NAO")) {
	        res.send(500, parameters.errorMessage('O valor do parâmetro revisaomanual é inválido.'));
	        return;
	}

	if (_.isEmpty(req.body.conteudista)) {
	        res.send(500, parameters.errorMessage('O valor do parâmetro conteudista está vazio'));
	        return;
	}

	if (_.isEmpty(req.body.instituicao)) {
	        res.send(500, parameters.errorMessage('O valor do parâmetro instituicao está vazio'));
	        return;
	}

	if (_.isEmpty(req.body.usuario)) {
	        res.send(500, parameters.errorMessage('O valor do parâmetro usuario está vazio'));
	        return;
	}

	process(req, res, Request);
}

function process(req, res, Request) {
	var id = uuid.v4();
	var folder = properties.uploads_folder + id;
	var locals = {};

	var request_object = new Request({
		id: id,
		type: req.body.servico,
		status: 'Submitted',
		link: 'http://' + properties.SERVER_IP + ':' + properties.port + '/' + id + '.mp4',
		user: req.body.usuario,
		institution: req.body.instituicao,
		author: req.body.conteudista,
		manualrevision: req.body.revisaomanual,
		reasonofrevision: req.body.motivodarevisao,
		subtitle: 'http://150.165.204.30:5000/api/subtitle.srt',
		dictionary: '1.0',
		created_at: new Date(),
		updated_at: new Date(),
	});

	db.create(request_object, function(result) {
		if (result !== null) {
			res.send(200, { 'status': 'Requisição ' + result.id + ' cadastrada com sucesso.', 'video_id': result.id});
		} else {
			res.send(500, { 'error': 'Erro na criação da requisição.'});
		}
	});

	async.series([
		// Cria a pasta apropriada
		function(callback) {
			console.log("== Criando pasta " + folder);

			mkdirp(folder, function(err) {
				var error;

				if (err) { error = "Erro na criação da pasta com o id: " + id + "; " + err; }

				callback(error);
			});
		},

		// Baixa e move os arquivos para a pasta correta
		function(callback) {
			console.log("== Baixando os arquivos");

			downloadAndMoveFiles(folder, req, locals, callback);
		},

		// Chama o core
		function(callback) {
			console.log("== Chamando o core");

			// Faz a chamada ao core
			try {
				if (_.isEmpty(req.body.legenda_url)) { // video_url present
					callCore(id, locals.video, locals.subtitle, req, res, Request, request_object);
				} else {
					callCoreSubtitle(id, locals.subtitle, req, res, Request, request_object);
				}
				callback();
			} catch (err) {
				callback(err);
			}
		}
	], function(err) {
		// Se tiver erro
		if (err) {
			res.send(500, parameters.errorMessage(err));

			return;
		}
	});
}


function downloadAndMoveFiles(folder, req, locals, callback) {
	async.parallel([
		function(callback) {
			if (_.isEmpty(req.body.legenda_url)) { // video_url present
				// Download video
        try {
          files.downloadAndMoveVideo(folder, req, locals, callback);
        } catch (e) {
          logger.incrementError("video", e);
        }
			} else {
				// Download subtitle
        try {
          files.downloadAndMoveSubtitle(folder, req, locals, callback);
        } catch (e) {
          logger.incrementError("legenda", e);
        }
			}

		}
	], function(err) {
		if (_.isEmpty(req.body.legenda_url)) { // video_url present
			console.log("== Video baixado");
		} else {
            // nao chama corretamente
			// console.log("== Legenda baixada");
		}
		// Callback chamado depois de todas as tarefas
		// Se tiver erro, vai passar para cima
		callback(err);
	});
}


function callCore(id, video, subtitle, req, res, Request, request_object) {

	/* Cria a linha de comando */
	/* slice(2) é para transformar ./path em path */
	var command_line = 'vlibras_user/vlibras-core/./vlibras -V ' + video.path.slice(2) + ' -p bottom_right -r large - -b opaque --no-mixer --id ' + id + ' --mode devel > /tmp/core_log 2>&1';

	console.log("=== Core: " + command_line);

	console.log("ID: " + request_object.id);
	core.call(id, command_line, req, res, Request, request_object, "videos");
}

function callCoreSubtitle(id, subtitle, req, res, Request, request_object) {
                /* Move a legenda submetido para a pasta com o seu ID correspondente */

                /* Cria a linha de comando */
                var legenda_name = "";
                if(req.body.legenda_url !== undefined) {
                    legenda_name = req.body.legenda_url.substring(req.body.legenda_url.lastIndexOf('/') + 1);
                    legenda_name = legenda_name.split(".")[0];
                } else if (req.files.legenda.name !== undefined) {
                    legenda_name = req.files.legenda.name;
                }

                var command_line = 'vlibras_user/vlibras-core/./vlibras -S ' +  ' uploads/' + id + '/' +
                                                        legenda_name + ' -l portugues -b opaco --id' + id + ' --mode devel > /tmp/core_log 2>&1';


				var child;
				var job = queue.create('exec_command_line' + id, {
				    title: 'Command Line for: ' + req.body.servico,
				    command_line: command_line
				}).removeOnComplete( true ).save();

				queue.process('exec_command_line' + id, function(job, done){
					child = queue_helper.exec_command_line(job.data.command_line, done);
				});

				job.on('complete', function() {
	                /* Executa a linha de comando */
	                child = exec(command_line, function(err, stdout, stderr) {
	                        // [stdout] = vlibras-core output
	                        // console.log(stdout);
	                });

	                /* Listener que dispara quando a requisição ao core finaliza */
	                child.on('close', function(code, signal){

										// res.send(200, { 'response' : 'http://' + properties.SERVER_IP + ':' + properties.port + '/' + id + '.flv' });

										// Se o core executou com erro
								    if (code !== 0) {
								      db.update(Request, request_object.id, 'Error', function (result) {});
						          console.log("Erro no retorno do core. Código: " + code);
						          logger.incrementError('core', "Erro no retorno do core. Código: " + code);
								    } else {
						          // Se o core executou normal
						    			db.update(Request, request_object.id, 'Completed', function (result) {});
						          res.send(200, { 'response' : 'http://' + properties.SERVER_IP + ':' + properties.port + '/' + id + '.mp4'});
						          logger.incrementService("videos", "traducoes");
						        }
									});


	                });

	                /* Listener que dispara quando a requisição ao core da erro */
	                child.on('error', function(code, signal){
										db.update(Request, request_object.id, 'Error', function (result) {});
										console.log("Erro no retorno do core. Código: " + code);
										logger.incrementError('core', "Erro no retorno do core. Código: " + code);
										res.send(500, parameters.errorMessage('Erro na chamada ao core'));
	                });



}

module.exports.init = init;
