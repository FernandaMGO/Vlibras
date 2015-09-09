
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

exports.isBloqueante = function () {
  //1 para bloqueante, 2 para nao bloqueante e 3 pra aceitar os dois
  return this.getServiceType() === 1;
};

exports.isNaoBloqueante = function () {
  //1 para bloqueante, 2 para nao bloqueante e 3 pra aceitar os dois
  return this.getServiceType() === 2;
};

exports.isAmbos = function () {
  //1 para bloqueante, 2 para nao bloqueante e 3 pra aceitar os dois
  return this.getServiceType() === 3;
};

exports.canRunOnBox = function (service) {
  //1 para bloqueante, 2 para nao bloqueante e 3 pra aceitar os dois
  var serviceType = parseInt(this.getServiceType());

  switch(service) {
    case 'texto':
      return serviceType == 1 || serviceType == 3;

    case 'ios':
      return true;

    case 'video':
      return serviceType == 2 || serviceType == 3;

    case 'legenda':
      return serviceType == 1 || serviceType == 3;

    case 'video-legenda':
      return serviceType == 2 || serviceType == 3;

    case 'videornp':
      return serviceType == 2 || serviceType == 3;

    default:
      return false;
  }
};
