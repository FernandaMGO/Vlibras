
var exports = module.exports = {};
var fs = require('fs');

var params_box = JSON.parse(fs.readFileSync('./config/params_box.json', 'utf8'));

exports.getParamsBox = function () {
  return params_box;
};

exports.getConfig = function (name) {
  return params_box[name];
};

exports.getServiceType = function () {
  return this.getConfig("service-type");
};

exports.getCheckInterval = function () {
  return this.getConfig("check-interval");
};

exports.getPaths = function () {
  // path vem um array, mas atualmente so existe um valor
  return this.getConfig("path")[0];
};

exports.getLogByName = function (name) {
  var paths = this.getPaths();
  return paths[name + '-log'];
};

exports.getServiceLogPath = function () {
  return this.getLogByName('service');
};
exports.getStatisticsLogPath = function () {
  return this.getLogByName('statistics');
};
exports.getErrorLogPath = function () {
  return this.getLogByName('error');
};
exports.getCapacityLogPath = function () {
  return this.getLogByName('capacity');
};
