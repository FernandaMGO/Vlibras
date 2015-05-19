var parameters = require('../helpers/parameters');
var properties = require('../helpers/properties');

var exec = require('child_process').exec, child;
var uuid = require('node-uuid');
var fs = require('fs');

function init(req, res) {

	var id = uuid.v4();

	/* Verifica se o paramêtro [transparencia] possue algum valor */
	if (req.body.transparencia !== '') {
		res.send(500, parameters.errorMessage('O valor de algum parâmetro está vazio'));
		return;
	}

	/* Verifica se os paramêtros [transparencia] possuem os seus únicos valores possíveis */
	if ((parameters.checkTransparency(req.body.transparencia) === true)) {
		res.send(500, parameters.errorMessage('Parâmetros insuficientes ou inválidos'));
		return;
	}

	/* Checa se o arquivo de legenda submetivo possui uma extensão válida */
	if (parameters.checkSubtitle(req.files.legenda.name)) {
		res.send(500, parameters.errorMessage('Legenda com Extensão Inválida'));
		return;
	}

	/* Cria uma pasta cujo o nome é o ID */
	child = exec('mkdir ' + __dirname + '/uploads/' + id);

	/* Listener que dispara quando a pasta é criada */
	child.on('close', function(code, signal){
		/* Move a legenda submetido para a pasta com o seu ID correspondente */
		fs.rename(req.files.legenda.path, __dirname + '/uploads/' + id + '/' + req.files.legenda.name, function(error) {
			if (error) { console.log(error); }
		});

		/* Cria a linha de comando */
		var command_line = 'vlibras_user/vlibras-core/./vlibras ' + parameters.getServiceType(req.body.servico) + ' uploads/' + id + '/' +
							req.files.legenda.name + ' ' + parameters.getTransparency(req.body.transparencia) + ' ' + id;

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
};

module.exports.init = init;