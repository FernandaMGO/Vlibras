function init_schema(mongoose) {
 	var requestSchema = new mongoose.Schema({
	  	id: String,
	  	status: String,
	  	type: String,
	  	created_at: { type: Date },
	  	updated_at: { type: Date }
	});

	var Request = mongoose.model('Request', requestSchema);

	return Request;
};

module.exports.init = init_schema;