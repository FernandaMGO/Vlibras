function connectMongo(mongoose) {
	var db = mongoose.connection;

	db.on('error', console.error);
	db.once('open', function() {
		console.log('Conectado ao MongoDB.')
	});

	mongoose.connect('mongodb://localhost/vlibras-api');
};

module.exports.connect = connectMongo;