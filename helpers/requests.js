var http = require('http');

function postRequest(path, data) {
	var options = {
		host: path.hostname,
		port: path.port,
		path: path.path,
		method: 'POST',
	    headers: {
	        'Content-Type': 'application/x-www-form-urlencoded',
	        'Content-Length': Buffer.byteLength(data)
	    }
	};

	var requesting = http.request(options, function(res) {
		/* Debugging */

		console.log('=== Chamando callback: ' + path.hostname);
	    console.log('=== Response status: ' + res.statusCode);
		console.log('=== Response headers: ' + JSON.stringify(res.headers));

		res.setEncoding('utf8');

		res.on('data', function (chunk) {
			console.log('=== Response body: ' + chunk);
		});

	});

	requesting.on('error', function (e) {
        console.log("=== Não foi possível chamar a URL de callback");
    });

	requesting.write(data);
	requesting.end();
}

module.exports.postRequest = postRequest;
