var parameters = require('../helpers/parameters');
var properties = require('../helpers/properties');
var files = require('../helpers/files');
var core = require('../helpers/core');
var db = require('../db/api');

var uuid = require('node-uuid');
var mkdirp = require('mkdirp');
var async = require('async');
var _ = require('lodash');
var kue = require('kue'),
    queue = kue.createQueue();

function init(req, res, Request) {
	res.set("Content-Type", "application/json");

	if (_.isEmpty(req.body.legenda_url) && _.isEmpty(req.body.video_url)) {
		res.send(500, parameters.errorMessage('O valor do parâmetro legenda_url e video_url está vazio'));
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
			res.send(200, { 'id':  result.id });
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
				files.downloadAndMoveVideo(folder, req, locals, callback);
			} else {
				// Download subtitle
				files.downloadAndMoveSubtitle(folder, req, locals, callback);
			}

		}
	], function(err) {
		if (_.isEmpty(req.body.legenda_url)) { // video_url present
			console.log("== Video baixado");
		} else {
			console.log("== Legenda baixada");
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
	core.call(id, command_line, req, res, Request, request_object);
}

function callCoreSubtitle(id, subtitle, req, res, Request, request_object) {
                /* Move a legenda submetido para a pasta com o seu ID correspondente */
                fs.rename(req.files.legenda.path, __dirname + '/uploads/' + id + '/' + req.files.legenda.name, function(error) {
                        if (error) { console.log(error); }
                });

                /* Cria a linha de comando */
                var command_line = 'vlibras_user/vlibras-core/./vlibras -S ' +  ' uploads/' + id + '/' +
                                                        req.files.legenda.name + ' -l portugues -b opaco --id' + id + ' --mode devel > /tmp/core_log 2>&1';

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
	                        res.send(200, { 'response' : 'http://' + properties.SERVER_IP + ':' + properties.port + '/' + id + '.flv' });
	                });

	                /* Listener que dispara quando a requisição ao core da erro */
	                child.on('error', function(code, signal){
	                        res.send(500, parameters.errorMessage('Erro na chamada ao core'));
	                });
								});

}

module.exports.init = init;
