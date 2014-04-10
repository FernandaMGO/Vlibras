function service_type(parameter) {
	switch(parameter) {
		case "texto":
			return 4;
		break;
	}
};

function transparency(parameter) {
	switch(parameter) {
		case "opaco":
			return 0;
		break;

		case "transparente":
			return 1;
		break;
	}
};

function verifyTransparency(transparency) {
	var t_types = ["opaco", "transparente"];

	for (var i = 0; i < t_types.length; i++){
		if (transparency === t_types[i]) {
			return true;
		}

		if ((i + 1) === t_types.length) {
			return false;
		}
	}
};

module.exports.service_type = service_type;
module.exports.transparency = transparency;
module.exports.verifyTransparency = verifyTransparency;
