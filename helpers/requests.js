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
		/*
	    console.log('Callback response status: ' + res.statusCode);
		console.log('Callback response headers: ' + JSON.stringify(res.headers));

		res.setEncoding('utf8');

		res.on('data', function (chunk) {
			console.log('Callback response body: ' + chunk);
		});
		*/
	});

	requesting.on('error', function (e) {
        console.log("The callback URL can not be reachable");
    });

	requesting.write(data);
	requesting.end();
}

module.exports.postRequest = postRequest;