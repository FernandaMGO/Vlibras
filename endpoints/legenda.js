var parameters = require('../helpers/parameters');
var properties = require('../helpers/properties');
var queue_helper = require('../helpers/queue');
var exec = require('child_process').exec, child;
var uuid = require('node-uuid');
var fs = require('fs');
var kue = require('kue'),
    queue = kue.createQueue();
var logger = require('../logsystem/main.js');

function init(req, res) {

	var id = uuid.v4();

	/* Verifica se o paramêtro [transparencia] possue algum valor */
	if (req.body.transparencia === '') {
		res.send(500, parameters.errorMessage('O valor de algum parâmetro está vazio'));
		return;
	}

	/* Verifica se os paramêtros [transparencia] possuem os seus únicos valores possíveis */
	if ((parameters.checkTransparency(req.body.transparencia) === false)) {
		res.send(500, parameters.errorMessage('Parâmetros insuficientes ou inválidos'));
		return;
	}

	/* Checa se o arquivo de legenda submetivo possui uma extensão válida */
	if (parameters.checkSubtitle(req.files.legenda.name) == false) {
		res.send(500, parameters.errorMessage('Legenda com Extensão Inválida'));
		return;
	}

	/* Cria uma pasta cujo o nome é o ID */
	child = exec('mkdir ' + __dirname + '/uploads/' + id);

	/* Listener que dispara quando a pasta é criada */
	child.on('close', function(code, signal){
		/* Move a legenda submetido para a pasta com o seu ID correspondente */
		fs.rename(req.files.legenda.path, __dirname + 'uploads/' + id + '/' + req.files.legenda.name, function(error) {
			if (error) { console.log(error); }
		});

		/* Cria a linha de comando */
		var command_line = 'vlibras_user/vlibras-core/./vlibras -S' + ' uploads/' + id + '/' +
							req.files.legenda.name + ' -l ' + parameters.getLanguage(req.body.linguagem) + ' -b ' + parameters.getTransparency(req.body.transparencia) + ' --id ' + id + ' --mode devel > /tmp/core_log 2>&1';

		/* Executa a linha de comando */
		// child = exec(command_line, function(err, stdout, stderr) {
		//  	// [stdout] = vlibras-core output
		//  	// console.log(stdout);
		// });

		var job = queue.create('exec_command_line', {
		    title: 'Command Line for: ' + req.body.servico,
		    command_line: command_line
		}).save();

		queue.process('exec_command_line', function(job, done){
			child = queue_helper.exec_command_line(job.data.command_line, done);
		});

		job.on('complete', function() {
			/* Listener que dispara quando a requisição ao core finaliza */
			child.on('close', function(code, signal){
				res.send(200, { 'response' : 'http://' + properties.SERVER_IP + ':' + properties.port + '/' + id + '.flv' });
        logger.incrementService("outros", "traducoes");
			});

			/* Listener que dispara quando a requisição ao core da erro */
			child.on('error', function(code, signal){
				res.send(500, parameters.errorMessage('Erro na chamada ao core'));
        logger.incrementError("1", err);
			});
		});

	});
}

module.exports.init = init;
