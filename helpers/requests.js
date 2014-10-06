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
	    res.setEncoding('utf8');
	});

	requesting.on('error', function (e) {
        console.log("The callback URL can not be reachable");
    });

	requesting.write(data);
	requesting.end();
}

module.exports.postRequest = postRequest;