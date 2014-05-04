function getServiceType(service_type) {
	switch(service_type) {		
		case 'video-legenda':
			return 2;
		break;

		case 'video':
			return 3;
		break;

		case 'texto':
			return 4;
		break;

		case 'ios':
			return 4;
		break;

		case 'legenda':
			return 5;
		break;
	}
};

function getLanguage(language) {
	switch(language) {
		case 'portugues':
			return 1;
		break;

		case 'glosa':
			return 2;
		break;
	}
};

function getPosition(position) {
	switch(position) {
		case 'superior-esquerdo':
			return 1;
		break;

		case 'superior-direito':
			return 2;
		break;

		case 'inferior-direito':
			return 3;
		break;

		case 'inferior-esquerdo':
			return 4;
		break;
	}
};

function getSize(size) {
	switch(size) {
		case 'pequeno':
			return 1;
		break;

		case 'medio':
			return 2;
		break;

		case 'grande':
			return 3;
		break;
	}
};

function getTransparency(transparency) {
	switch(transparency) {
		case 'opaco':
			return 0;
		break;

		case 'transparente':
			return 1;
		break;
	}
};

function checkServiceType(service_type) {
	var t_types = ['video', 'texto'];

	for (var i = 0; i < t_types.length; i++){
		if (service_type === t_types[i]) {
			return true;
		}

		if ((i + 1) === t_types.length) {
			return false;
		}
	}
};

function checkLanguage(language) {
	var t_types = ['portugues', 'glosa'];

	for (var i = 0; i < t_types.length; i++){
		if (language === t_types[i]) {
			return true;
		}

		if ((i + 1) === t_types.length) {
			return false;
		}
	}
};

function checkPosition(position) {
	var t_types = ['superior-esquerdo', 'superior-direito', 'inferior-esquerdo', 'inferior-direito'];

	for (var i = 0; i < t_types.length; i++){
		if (position === t_types[i]) {
			return true;
		}

		if ((i + 1) === t_types.length) {
			return false;
		}
	}
};

function checkSize(size) {
	var t_types = ['pequeno', 'medio', 'grande'];

	for (var i = 0; i < t_types.length; i++){
		if (size === t_types[i]) {
			return true;
		}

		if ((i + 1) === t_types.length) {
			return false;
		}
	}
};

function checkTransparency(transparency) {
	var t_types = ['opaco', 'transparente'];

	for (var i = 0; i < t_types.length; i++){
		if (transparency === t_types[i]) {
			return true;
		}

		if ((i + 1) === t_types.length) {
			return false;
		}
	}
};

function checkVideo(file) {
    var accepted_file_types = ['flv', 'ts', 'avi', 'mp4', 'mov', 'webm', 'wmv', 'mkv',];
    return check_type(file, accepted_file_types)
};

function checkSubtitle(file) {
    var accepted_file_types = ['srt'];
    return check_type(file, accepted_file_types)
};

function check_type(file, accepted_file_types) {

  	var ext = file.substring(file.lastIndexOf('.') + 1).toLowerCase();
  	var isValidFile = false;

  	for (var i = 0; i < accepted_file_types.length; i++) {
      	if (ext == accepted_file_types[i]) {
          	isValidFile = true;
          	break;
      	}
  	}

  	if (!isValidFile) {
      	file.value = null;
  	}

  	return isValidFile;
};

function errorMessage(message) {
	return { 'error': message }
};

module.exports.getServiceType = getServiceType;
module.exports.getLanguage = getLanguage;
module.exports.getPosition = getPosition;
module.exports.getSize = getSize;
module.exports.getTransparency = getTransparency;

module.exports.checkServiceType = checkServiceType;
module.exports.checkLanguage = checkLanguage;
module.exports.checkPosition = checkPosition;
module.exports.checkSize = checkSize;
module.exports.checkTransparency = checkTransparency;

module.exports.checkVideo = checkVideo;
module.exports.checkSubtitle = checkSubtitle;

module.exports.errorMessage = errorMessage;