var parameters = require('./helpers/parameters');
var properties = require('./helpers/properties');

var ep_texto = require('./endpoints/texto');
var ep_ios = require('./endpoints/ios');
var ep_video = require('./endpoints/video');
var ep_legenda = require('./endpoints/legenda');
var ep_video_legenda = require('./endpoints/video_legenda');

var mongoose = require('mongoose');
require('./db/config').connect(mongoose);
var express = require('express');
var path = require('path');
var util = require('util');
var app = express();
var Request = require('./db/schemas/request').init(mongoose);
var db = require('./db/api');

app.use(express.static(path.join(__dirname, '/videos')));
app.use(express.bodyParser({ keepExtensions: true, uploadDir: path.join(__dirname, '/uploads') }));

app.get('/', function(req, res){
	res.send(200, { 'status': 'server is running!' } );
});

app.post('/api', function(req, res) {
	console.log("\n\n\n=============================================");
	console.log("[" + new Date().toISOString() + "] Requisição do IP: " + req.ip);
	console.log("== Parametros: " + util.inspect(req.body));
	console.log("== Body: " + JSON.stringify(req.headers));

	/* Verifica se o paramêtro [servico] possui algum valor */
	if (req.body.servico !== '') {
		/* Verifica qual é o Tipo de Serviço fornecido */ 
		switch(req.body.servico) {
			/* Tipo de Serviço: Texto */
			case 'texto':
				ep_texto.init(req, res, Request);
			break;

			/* Tipo de Serviço: iOS */
			case 'ios':
				ep_ios.init(req, res);
			break;

			/* Tipo de Serviço: Só o Vídeo */
			case 'video':
				ep_video.init(req, res);
			break;

			/* Tipo de Serviço: Só a Legenda */
			case 'legenda':
				ep_legenda.init(req, res);
			break;

			/* Tipo de Serviço: Video + Legenda */
			case 'video-legenda':
				ep_video_legenda.init(req, res);
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

app.get('/api/requests', function(req, res) {
	db.read_all(Request, function(result) {
		if (result !== null) {
			res.send(200, result);
		} else {
			res.send(500, { 'error': 'Erro na busca.'});
		}
	});
});

app.post('/glosa', function(req, res) {
//	options.args = JSON.stringify(req.body);
	PythonShell.run('vlibras_user/vlibras-translate/PortGlosa.py', req.body.texto, function (err, results) {
  		if (err) { console.log(err); res.send(400); return; }
        // results is an array consisting of messages collected during execution
		res.send(results);
	});
});

app.listen(properties.port, properties.host, function(){
	console.log('Server running on ' + properties.host + ':' + properties.port);
});
