var parameters = require('./helpers/parameters');
var properties = require('./helpers/properties');

var ep_texto = require('./endpoints/texto');
var ep_ios = require('./endpoints/ios');
var ep_video = require('./endpoints/video');
var ep_legenda = require('./endpoints/legenda');
var ep_video_legenda = require('./endpoints/video_legenda');

var path = require('path');
var express = require('express');
var app = express();

app.use(express.static(path.join(__dirname, '/videos')));
app.use(express.bodyParser({ keepExtensions: true, uploadDir: path.join(__dirname, '/uploads') }));

app.get('/', function(req, res){
	res.send(200, { 'status': 'server is running!' } );
});

app.post('/api', function(req, res){
	/* Verifica se o paramêtro [servico] possui algum valor */
	if (req.body.servico !== '') {
		/* Verifica qual é o Tipo de Serviço fornecido */ 
		switch(req.body.servico) {
			/* Tipo de Serviço: Texto */
			case 'texto':
				ep_texto.init(req, res);
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

app.listen(properties.port, properties.host, function(){
	console.log('Server running on ' + properties.host + ':' + properties.port);
});
