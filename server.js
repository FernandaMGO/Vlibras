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
var config = require('./config/main.js');
var logger = require('./logsystem/main.js');
var kue = require('kue');
var queue = kue.createQueue();
var unirest = require('unirest');

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
		if (config.canRunOnBox(req.body.servico)) {
			switch(req.body.servico) {
				/* Tipo de Serviço: Texto */
				case 'texto':
					logger.incrementService("outros", "requisicoes");
					ep_texto.init(req, res, Request);
				break;

				/* Tipo de Serviço: iOS */
				case 'ios':
					logger.incrementService("outros", "requisicoes");
					ep_ios.init(req, res);
				break;

				/* Tipo de Serviço: Só o Vídeo */
				case 'video':
					logger.incrementService("videos", "requisicoes");
					ep_video.init(req, res);
					// logger.incrementService("videos", "traducoes");
				break;

				/* Tipo de Serviço: Só a Legenda */
				case 'legenda':
					logger.incrementService("outros", "requisicoes");
					ep_legenda.init(req, res);

				break;

				/* Tipo de Serviço: Video + Legenda */
				case 'video-legenda':
					logger.incrementService("outros", "requisicoes");
					ep_video_legenda.init(req, res);
				break;

				/* Case para um Tipo de Serviço inválido */
				default:
					res.send(500, parameters.errorMessage('Tipo do serviço inválido'));
				break;
			} // end of switch
		} // end of if canRunOnBox
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

// para testes apenas
app.get('/incrementaerro', function(req, res) {
	// logger.incrementError("1", "detalhe do erro");
	// logger.incrementService("videos", "traducoes");
	res.send(200, "Incrementado");
});

app.get('/limparfila', function(req, res) {

	// graceful shutdown
	process.once( 'SIGTERM', function ( sig ) {
	  queue.shutdown( 5000, function(err) {
	    console.log( 'Kue shutdown: ', err||'' );
	    process.exit( 0 );
	  });
	});

	// todos abaixos sao redundantes
	queue.inactive( function( err, ids ) {
	  ids.forEach( function( id ) {
	    kue.Job.get( id, function( err, job ) {
				job.remove( function(){
		      // console.log( 'removed ', job.id );
		    });
	    });
	  });
	});

	queue.active( function( err, ids ) {
	  ids.forEach( function( id ) {
	    kue.Job.get( id, function( err, job ) {
				job.remove( function(){
		      // console.log( 'removed ', job.id );
		    });
	    });
	  });
	});

	queue.complete( function( err, ids ) {
	  ids.forEach( function( id ) {
	    kue.Job.get( id, function( err, job ) {
				job.remove( function(){
		      // console.log( 'removed ', job.id );
		    });
	    });
	  });
	});

	queue.failed( function( err, ids ) {
	  ids.forEach( function( id ) {
	    kue.Job.get( id, function( err, job ) {
				job.remove( function(){
		      // console.log( 'removed ', job.id );
		    });
	    });
	  });
	});

	res.send(200, "Fila limpa");
});

// precisa ficar no final caso o request n bata com nenhuma rota anterior
app.get('/*', function(req, res){
	logger.incrementError("4", "Rota nao encontrada");
	res.send(404, { 'status': 'Rota nao encontrada' } );
});

app.listen(properties.port, properties.host, function(){
	console.log('Server running on ' + properties.host + ':' + properties.port);
});



var CronJob = require('cron').CronJob;
// '* * * * * *' == a cada 1 segundo
new CronJob('* * * * * *', function() {
	unirest.post('http://localhost:5000/api')
	.header('Accept', 'application/json')
	.send({ "servico": "texto", "transparencia": "opaco", "texto": "texto teste" })
	.end(function (response) {
	  console.log(response.status);
		if(response.status === 200){
			logger.updateHealth("outros", 1);
		} else {
			logger.updateHealth();
		}
	});
}, null, true); // no lugar do null pode ser uma funcao pra executar quando parar
