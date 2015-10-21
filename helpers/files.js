var parameters = require('../helpers/parameters');
var http = require('http');
var fs = require('fs');
var logger = require('../logsystem/main.js');

/*
* Função que processa o vídeo (seja baixando, seja pegando o vídeo enviado)
* Deve retornar um objeto contendo o nome e o caminho
*/
function downloadAndMoveVideo(folder, req, locals, callback) {

	// Se enviou o arquivo na requisição
	if (req.files.video !== undefined) {

		// Se a validação falhar
		if (parameters.checkVideo(req.files.video.name) === false) {
			var error = 'Vídeo enviado com extensão inválida';
			logger.incrementError("2");
			return callback(error);
		}

		/* Move o vídeo submetido para a pasta com o seu ID correspondente */
		try {
			fs.renameSync(req.files.video.path, folder + '/' + req.files.video.name);
		} catch (err) {
			callback("Erro ao mover o vídeo submetido: " + err);
		}

		// Se não, retorna o vídeo enviado
		locals.video = {
			'path': folder + '/' + req.files.video.name
		};

		return callback();

	// Se o arquivo não foi enviado, mas um video_url foi
	} else if (req.body.video_url !== undefined) {

		// Requisição para baixar o vídeo
		http.get(req.body.video_url, function(response) {

			// Se o vídeo não foi baixado com sucesso
			if (response.statusCode !== 200) {
				var error = 'Problema ao carregar video_url: status ' + response.statusCode;
				return callback(error);
			}

			// Nome do arquivo
			var filename = req.body.video_url.substring(req.body.video_url.lastIndexOf('/') + 1);

			// Tira os parâmetros HTTP
			if (filename.lastIndexOf("?") !== -1) {
				filename = filename.substring(0, filename.lastIndexOf("?"));
			}

			var path = folder + '/' + filename;

			// Cria o stream para escrita
			var file = fs.createWriteStream(path);

			// Salva o arquivo em disco
			response.pipe(file);

			// Quando a escrita acabar
			file.on('finish', function() {

				// Fecha o arquivo
				file.close(function() {

					// Retorna o vídeo baixado
					locals.video = {
						'path': path
				 	};

				 	// Chama o callback para prosseguir execução
				 	callback();
				});
			});

	 	// Se deu erro na requisição de baixar o vídeo
		}).on('error', function(e) {
			var error = 'Problema ao carregar video_url: ' + e.message;
			return callback(error);
		});

	// Se nem o vídeo foi enviado e nem o video_url foi preenchido
	} else {
		var error = "Video deve ser enviado como parâmetro 'video' ou como 'video_url'";
		return callback(error);
	}
}

/*
* Função que processa a legenda (seja baixando, seja pegando o vídeo enviado)
* Deve retornar um objeto contendo o nome e o caminho
*/
function downloadAndMoveSubtitle(folder, req, locals, callback) {
	// Se enviou o arquivo na requisição
	if (req.files.legenda !== undefined) {

		// Se a validação falhar
		if (parameters.checkSubtitle(req.files.legenda.name) === false) {
			var error = 'Legenda enviado com extensão inválida';
			logger.incrementError("3");
			return callback(error);
		}

		/* Move o vídeo submetido para a pasta com o seu ID correspondente */
		try {
			fs.renameSync(req.files.legenda.path, folder + '/' + req.files.legenda.name);
		} catch (err) {
			callback("Erro ao mover a legenda submetida: " + err);
		}

		// Se não, retorna o vídeo enviado
		locals.subtitle = {
			'path': folder + '/' + req.files.legenda.name
		};

		return callback();

	// Se o arquivo não foi enviado, mas um legenda_url foi
	} else if (req.body.legenda_url !== undefined) {

		// Requisição para baixar a legenda
		http.get(req.body.legenda_url, function(response) {

			// Se a legenda não foi baixado com sucesso
			if (response.statusCode !== 200) {
				var error = 'Problema ao carregar legenda_url: status ' + response.statusCode;
				return callback(error);
			}

			// Nome do arquivo
			var filename = req.body.legenda_url.substring(req.body.legenda_url.lastIndexOf('/') + 1);

			// Tira os parâmetros HTTP
			if (filename.lastIndexOf("?") !== -1) {
				filename = filename.substring(0, filename.lastIndexOf("?"));
			}

			var path = folder + '/' + filename;

			// Cria o stream para escrita
			var file = fs.createWriteStream(path);

			// Salva o arquivo em disco
			response.pipe(file);
			// Quando a escrita acabar
			file.on('finish', function() {

				// Fecha o arquivo
				file.close(function() {

					// Retorna o vídeo baixado
					locals.subtitle = {
						'path': path
				 	};

				 	// Chama o callback para prosseguir execução
					console.log("== Legenda baixada");
				 	callback();
				});
			});

	 	// Se deu erro na requisição de baixar a legenda
		}).on('error', function(e) {
			var error = 'Problema ao carregar legenda_url: ' + e.message;
			return callback(error);
		});

	// Se nem a legenda foi enviada e nem a legenda_url foi preenchida
	} else {
		var error = "Legenda deve ser enviada como parâmetro 'legenda' ou como 'legenda_url'";
		return callback(error);
	}
}

function downloadAndMoveAudio(folder, req, locals, callback) {

	// Se enviou o arquivo na requisição
	if (req.files.audio !== undefined) {

		// Se a validação falhar
		if (parameters.checkAudio(req.files.audio.name) === false) {
			var error = 'Áudio enviado com extensão inválida';
			return callback(error);
		}

		/* Move o áudio submetido para a pasta com o seu ID correspondente */
		try {
			fs.renameSync(req.files.audio.path, folder + '/' + req.files.audio.name);
		} catch (err) {
			callback("Erro ao mover o áudio submetido: " + err);
		}

		// Se não, retorna o áudio enviado
		locals.audio = {
			'path': folder + '/' + req.files.audio.name
		};

		return callback();

	// Se o arquivo não foi enviado, mas um audio_url foi
	} else if (req.body.audio_url !== undefined) {

		// Requisição para baixar o vídeo
		http.get(req.body.audio_url, function(response) {

			// Se o áudio não foi baixado com sucesso
			if (response.statusCode !== 200) {
				var error = 'Problema ao carregar audio_url: status ' + response.statusCode;
				return callback(error);
			}

			// Nome do arquivo
			var filename = req.body.audio_url.substring(req.body.audio_url.lastIndexOf('/') + 1);

			// Tira os parâmetros HTTP
			if (filename.lastIndexOf("?") !== -1) {
				filename = filename.substring(0, filename.lastIndexOf("?"));
			}

			var path = folder + '/' + filename;

			// Cria o stream para escrita
			var file = fs.createWriteStream(path);

			// Salva o arquivo em disco
			response.pipe(file);

			// Quando a escrita acabar
			file.on('finish', function() {

				// Fecha o arquivo
				file.close(function() {

					// Retorna o áudio baixado
					locals.audio = {
						'path': path
				 	};

				 	// Chama o callback para prosseguir execução
				 	callback();
				});
			});

	 	// Se deu erro na requisição de baixar o áudio
		}).on('error', function(e) {
			var error = 'Problema ao carregar audio_url: ' + e.message;
			return callback(error);
		});

	// Se nem o áudio foi enviado e nem o audio_url foi preenchido
	} else {
		var error = "Áudio deve ser enviado como parâmetro 'audio' ou como 'audio_url'";
		return callback(error);
	}
}

module.exports.downloadAndMoveVideo = downloadAndMoveVideo;
module.exports.downloadAndMoveSubtitle = downloadAndMoveSubtitle;
module.exports.downloadAndMoveAudio = downloadAndMoveAudio;
