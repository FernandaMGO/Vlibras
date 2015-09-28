var parameters = require('../helpers/parameters');
var properties = require('../helpers/properties');
var files = require('../helpers/files');
var core = require('../helpers/core');

var uuid = require('node-uuid');
var mkdirp = require('mkdirp');
var async = require('async');
var logger = require('../logsystem/main.js');

function init(req, res) {
	res.set("Content-Type", "application/json");

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

	process(req, res);
}

function process(req, res) {
	var id = uuid.v4();
	var folder = properties.uploads_folder + id;
	var locals = {};

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
				callCore(id, locals.video, locals.subtitle, req, res);
				callback();
			} catch (err) {
				callback(err);
				logger.incrementError("1", err);
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
		// Download video
		function(callback) {
			files.downloadAndMoveVideo(folder, req, locals, callback);
		},

		// Download subtitle
		function(callback) {
			files.downloadAndMoveSubtitle(folder, req, locals, callback);
		}
	], function(err) {
		console.log("=== Legenda e video baixados");

		// Callback chamado depois de todas as tarefas
		// Se tiver erro, vai passar para cima
		callback(err);
	});
}


function callCore(id, video, subtitle, req, res) {

	/* Cria a linha de comando */
	/* slice(2) é para transformar ./path em path */
	var command_line = 'vlibras_user/vlibras-core/./vlibras -V ' + video.path.slice(2) + ' -S ' + subtitle.path.slice(2) + ' -l ' + parameters.getLanguage(req.body.linguagem) + ' -p ' + parameters.getPosition(req.body.posicao) + ' -r ' + parameters.getSize(req.body.tamanho) + ' -b  ' +
					parameters.getTransparency(req.body.transparencia) + ' --id ' + id + ' --mode devel > /tmp/core_log 2>&1';

	console.log("=== Core: " + command_line);

	core.call(id, command_line, req, res, null, null, "outros");
}

module.exports.init = init;
