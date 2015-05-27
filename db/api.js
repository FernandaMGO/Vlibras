function read_all(Request, callback) {
	Request.find(function(err, requests) {
	  	if (err) callback(null);

	  	callback(requests);
	});
};

function create(object, callback) {
	object.save(function(err, request) {
		if (err) callback(null);
		
		callback(request);
	});
};

function update(object, status, callback) {
	object.update({}, { $set : { 'type' : status }}, function (err, request) {
		if (err) callback(null);
		callback(request);
	});
}

function remove(Request, hash, callback) {
	Request.remove({ id: hash }, function(err, request) {
		if (err) callback(null);

		callback(request);
	});
};

module.exports.read_all = read_all;
module.exports.create = create;
module.exports.remove = remove;
module.exports.update = update;

