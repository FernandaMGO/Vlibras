var host = '0.0.0.0';
var port = 5000;
var SERVER_IP = '150.165.204.30';
var uploads_folder = './uploads/';
var ip = require('ip');

module.exports.host = host;
module.exports.port = port;
module.exports.uploads_folder = uploads_folder;
module.exports.SERVER_IP = ip.address();