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

function update(Request, id, status, callback) {
	console.log("== Update requisicao");
	Request.update({'id': id}, {$set : { 'status' : status }}, function (err, result) {
		if (err) callback(null);
		callback(result);
	});
};

function findById(Request, requestId, callback) {
	Request.find({ id : requestId }, { _id: 0, __v: 0 }, function(err, result) {
		if (err) callback(null);
		
		callback(result);
	});
};

function findByIds(Request, requests, callback) {
	console.log(requests);
	Request.find({
	    'id': { $in: requests }
	}, { _id: 0, __v: 0 }, function(err, request){
		if (err) callback(null);
		callback(request);
	});
};

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
module.exports.findById = findById;
module.exports.findByIds = findByIds;
