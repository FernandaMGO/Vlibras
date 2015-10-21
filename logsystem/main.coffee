config = require('../config/main.js')
fs = require('fs')
kue = require('kue')
queue = kue.createQueue()
exports = module.exports = {}

# 1 - Core retornou um erro.
# 2 - Vídeo inválido.
# 3 - Legenda inválida.
# 4 - Endpoint inválido.

# params_box = JSON.parse(fs.readFileSync('./config/params_box.json', 'utf8'))
# errors = JSON.parse(fs.readFileSync('./logsystem/errors.log', 'utf8'))
# services = JSON.parse(fs.readFileSync('./logsystem/services.log', 'utf8'))


writeLog = (file, path) ->
  fs.writeFileSync path, JSON.stringify(file, null, 4)


exports.incrementError = (id, detalhe="", inc=1) ->
  errors_log_path = "./logsystem/errors.log"
  errors = JSON.parse(fs.readFileSync(errors_log_path, 'utf8'))

  bloqueante = !config.isNaoBloqueante() # diferente de nao bloqueante aceita bloqueante ou ambos

  # id pode ser "1", "2", "3", "4" ou qualquer outro id criado para identificar erros
  # 1 ou 'core' - Core retornou um erro.
  # 2 ou 'video' - Vídeo inválido.
  # 3 ou 'legenda' - Legenda inválida.
  # 4 ou 'endpoint' - Endpoint inválido.

  switch id
    when 'core' then id = "1"
    when 'video' then id = "2"
    when 'legenda' then id = "3"
    when 'endpoint' then id = "4"
    else
      console.log("ID inválido")

  if bloqueante
    errors["resumo"]["bloqueante"][id] += inc
  else
    errors["resumo"]["nao-bloqueante"][id] += inc

  errors["detalhado"][id] = detalhe

  writeLog(errors, errors_log_path)

exports.incrementService = (serviceType, type, inc=1) ->
  services_log_path = "./logsystem/services.log"
  services = JSON.parse(fs.readFileSync(services_log_path, 'utf8'))

  if serviceType == "videos"
    services["tipo"]["videos"][type] += inc
  else if serviceType == "outros"
    services["tipo"]["outros"][type] += inc


  writeLog(services, services_log_path)

exports.updateHealth = (serviceType="outros", value=0) ->
  services_log_path = "./logsystem/services.log"
  services = JSON.parse(fs.readFileSync(services_log_path, 'utf8'))

  # if e else if pra excluir valores diferente desses dois
  if serviceType == "videos"
    services["tipo"]["videos"]["saude"] = value
  else if serviceType == "outros"
    services["tipo"]["outros"]["saude"] = value

  writeLog(services, services_log_path)
