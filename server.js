var parameters = require('./helpers/parameters');
var exec = require('child_process').exec, child;
var express = require("express");

var host = '0.0.0.0';
var port = 5000;

var app = express();

var ID_FROM_BD = 0;
var SERVER_IP = "150.165.204.30";

app.use(express.static(__dirname + "/videos"));

app.get("/", function(req, res){
	res.send(200, "<center><h2>Server " + host + ":" + port + " is running</h2></center>");
});

app.post("/api", function(req, res){

	ID_FROM_BD++;

	if (req.query.servico !== "") {
		switch(req.query.servico) {
			case "texto":
				if ((req.query.transparencia !== "") && (req.query.texto !== "")) {

					if (parameters.verifyTransparency(req.query.transparencia)) {
						child = exec("echo " + req.query.texto + " >> " + __dirname + "/text_files/" + ID_FROM_BD +
									 " && cd ../vlibras-core" +
									 " && ./gtaaas " + parameters.service_type(req.query.servico) + " ../vlibras-api/text_files/" + 
									 ID_FROM_BD + " " + parameters.transparency(req.query.transparencia) + " " + ID_FROM_BD + " WEB", function(err, stdout, stderr) { 
									 	// [stdout] = vlibras-core output
									 });

						child.on("close", function(code, signal){
							res.send(200, { "response" : "http://" + SERVER_IP + ":" + port + "/" + ID_FROM_BD + ".webm" });
						});

					} else {
						res.send(500, "<center><h2>Valor de Transparência Inválido</h2></center>");
					}
				} else {
					res.send(500, "<center><h2>Parâmetro Vazio</h2></center>");
				}
			break;

			default:
				res.send(500, "<center><h2>Tipo de Serviço Inválido</h2></center>");
			break;
		}
	} else {
		res.send(500, "<center><h2>Especifique o Tipo de Serviço</h2></center>");
	}
});

app.listen(port, host, function(){
	console.log("Server running on " + host + ":" + port);
});
