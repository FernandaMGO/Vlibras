(function() {
  var config, exports, fs, kue, queue, writeLog;

  config = require('../config/main.js');

  fs = require('fs');

  kue = require('kue');

  queue = kue.createQueue();

  exports = module.exports = {};

  writeLog = function(file, path) {
    return fs.writeFileSync(path, JSON.stringify(file, null, 4));
  };

  exports.incrementError = function(id, detalhe, inc) {
    var bloqueante, errors, errors_log_path;
    if (detalhe === null) {
      detalhe = "";
    }
    if (inc === null) {
      inc = 1;
    }
    errors_log_path = "./logsystem/errors.log";
    errors = JSON.parse(fs.readFileSync(errors_log_path, 'utf8'));
    bloqueante = !config.isNaoBloqueante();
    switch (id) {
      case 'core':
        id = "1";
        break;
      case 'video':
        id = "2";
        break;
      case 'legenda':
        id = "3";
        break;
      case 'endpoint':
        id = "4";
        break;
      default:
        console.log("ID inválido");
    }
    if (bloqueante) {
      errors["resumo"]["bloqueante"][id] += inc;
    } else {
      errors["resumo"]["nao-bloqueante"][id] += inc;
    }
    errors["detalhado"][id] = detalhe;
    return writeLog(errors, errors_log_path);
  };

  exports.incrementService = function(serviceType, type, inc) {
    var services, services_log_path;
    if (inc === null) {
      inc = 1;
    }
    services_log_path = "./logsystem/services.log";
    services = JSON.parse(fs.readFileSync(services_log_path, 'utf8'));
    if (serviceType === "videos") {
      services["tipo"]["videos"][type] += inc;
    } else if (serviceType === "outros") {
      services["tipo"]["outros"][type] += inc;
    }
    return writeLog(services, services_log_path);
  };

  exports.updateHealth = function(serviceType, value) {
    var services, services_log_path;
    if (serviceType === null) {
      serviceType = "outros";
    }
    if (value === null) {
      value = 0;
    }
    services_log_path = "./logsystem/services.log";
    services = JSON.parse(fs.readFileSync(services_log_path, 'utf8'));
    if (serviceType === "videos") {
      services["tipo"]["videos"]["saude"] = value;
    } else if (serviceType === "outros") {
      services["tipo"]["outros"]["saude"] = value;
    }
    return writeLog(services, services_log_path);
  };

}).call(this);
