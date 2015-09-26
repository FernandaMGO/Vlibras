var parameters = require('../helpers/parameters');
var properties = require('../helpers/properties');
var queue_helper = require('../helpers/queue');
var db = require('../db/api');
var exec = require('child_process').exec, child;
var uuid = require('node-uuid');
var fs = require('fs');
var kue = require('kue'),
    queue = kue.createQueue();
var logger = require('../logsystem/main.js');

function init(req, res, Request) {

	var id = uuid.v4();

	/* Verifica se os paramêtros [transparencia, texto] possuem algum valor */

	if ((req.body.transparencia === '') || (req.body.texto === '') || (req.body.linguagem === '')) {
		res.send(500, parameters.errorMessage('O valor de algum parâmetro está vazio'));
		return;
    }

	/* Verifica se o paramêtro [transparencia] possui os únicos valores possíveis [opaco, transparente] */
	if (parameters.checkTransparency(req.body.transparencia) === false) {
		res.send(500, parameters.errorMessage('Parâmetros insuficientes ou inválidos'));
		return;
	}

	/* Verifica se o paramêtro [linguagem] possui os únicos valores possíveis [portugues, glosa] */
	if (parameters.checkLanguage(req.body.linguagem) === false) {
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
			res.send(200, { 'status': 'Requisição ' + result.id + ' cadastrada com sucesso.', 'video_id': result.id});
      logger.incrementService("outros", "traducoes");
		} else {
			res.send(500, { 'error': 'Erro na criação da requisição.'});
		}
	});

	/* Cria a linha de comando */
	var command_line = 'echo ' + req.body.texto + ' >> text_files/' + id + ' && mkdir uploads/' + id + ' && vlibras_user/vlibras-core/./vlibras -T ' + 'text_files/' + id + ' -l ' + parameters.getLanguage(req.body.linguagem) + ' -b ' + parameters.getTransparency(req.body.transparencia) + ' --id ' + id + ' --mode devel >> /tmp/core_log 2>&1';

  console.log(command_line);
  var child;
	var job = queue.create('exec_command_line' + id, {
	    title: 'Command Line for: ' + req.body.servico,
	    command_line: command_line
	}).removeOnComplete( true ).save();

	queue.process('exec_command_line' + id, function(job, done){
		child = queue_helper.exec_command_line(job.data.command_line, done);
	});

  job.on('complete', function() {
    /* Listener que dispara quando a requisição ao core finaliza */
  	child.on('close', function(code, signal) {
  //		res.send(200, { 'response' : 'http://' + properties.SERVER_IP + ':' + properties.port + '/' + id + '.webm' });
  		db.update(request_object, id, 'Completed', function(result) {});
      logger.incrementService("outros", "traducoes");
  	});

  	/* Listener que dispara quando a requisição ao core da erro */
  	child.on('error', function(code, signal){
  		res.send(500, parameters.errorMessage('Erro na chamada ao core'));
      logger.incrementError("1", 'Erro na chamada ao core');
  		db.update(request_object, 'Error', function(result) {
  		});
  	});

  });

}

module.exports.init = init;
