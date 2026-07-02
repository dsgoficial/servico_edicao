'use strict'

const dotenv = require('dotenv')
const Joi = require('joi')
const fs = require('fs')
const path = require('path')

const AppError = require('./utils/app_error')
const errorHandler = require('./utils/error_handler')

const configFile =
  process.env.NODE_ENV === 'test' ? 'config_testing.env' : 'config.env'

const configPath = path.join(__dirname, '..', configFile)

if (!fs.existsSync(configPath)) {
  errorHandler.critical(
    new AppError(
      'Arquivo de configuração não encontrado. Configure o serviço primeiro.'
    )
  )
}

dotenv.config({
  path: configPath
})

const VERSION = '1.0.0'
const MIN_DATABASE_VERSION = '1.0.0'

const configSchema = Joi.object().keys({
  PORT: Joi.number()
    .integer()
    .required(),
  DB_SERVER: Joi.string().required(),
  DB_PORT: Joi.number()
    .integer()
    .required(),
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  AUTH_SERVER: Joi.string()
    .uri()
    .required(),
  FE_PATH: Joi.string().required(),
  QGIS_PATH: Joi.string().required(),
  // Nomes dos diretórios internos da instalação do QGIS (variam por versão do
  // QGIS/ambiente). Defaults correspondem ao QGIS 4.0 (\apps\<dir>).
  QGIS_QT_DIR: Joi.string().default('Qt6'),
  QGIS_GRASS_DIR: Joi.string().default('grass84'),
  QGIS_PYTHON_DIR: Joi.string().default('Python312'),
  // Pasta de plugins do perfil do QGIS (onde o plugin está instalado).
  // Vazio => derivado automaticamente de FE_PATH (pasta pai do plugin).
  QGIS_PROFILE_PLUGINS_PATH: Joi.string()
    .allow('')
    .default(''),
  // Nº de exportações simultâneas do QGIS (1 = serial, evita concorrência de licença/IO).
  EXPORT_CONCURRENCY: Joi.number()
    .integer()
    .min(1)
    .default(1),
  // Diretório de saída dos produtos exportados. Vazio => <server>/src/export.
  PATH_EXPORT: Joi.string().required(),
  // Rate limit da API.
  RATE_LIMIT_WINDOW_MS: Joi.number()
    .integer()
    .min(1000)
    .default(60 * 1000),
  RATE_LIMIT_MAX: Joi.number()
    .integer()
    .min(1)
    .default(200),
  // Origens permitidas no CORS. '*' libera todas; lista separada por vírgula restringe.
  CORS_ORIGIN: Joi.string().default('*'),
  VERSION: Joi.string().required(),
  MIN_DATABASE_VERSION: Joi.string().required()
})

const rawConfig = {
  PORT: process.env.PORT,
  DB_SERVER: process.env.DB_SERVER,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  JWT_SECRET: process.env.JWT_SECRET,
  AUTH_SERVER: process.env.AUTH_SERVER,
  FE_PATH: process.env.FE_PATH,
  QGIS_PATH: process.env.QGIS_PATH,
  QGIS_QT_DIR: process.env.QGIS_QT_DIR,
  QGIS_GRASS_DIR: process.env.QGIS_GRASS_DIR,
  QGIS_PYTHON_DIR: process.env.QGIS_PYTHON_DIR,
  QGIS_PROFILE_PLUGINS_PATH: process.env.QGIS_PROFILE_PLUGINS_PATH,
  EXPORT_CONCURRENCY: process.env.EXPORT_CONCURRENCY,
  PATH_EXPORT: process.env.PATH_EXPORT || path.join(__dirname, 'export'),
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  VERSION,
  MIN_DATABASE_VERSION
}

// value já vem com os defaults aplicados e os números convertidos.
const { error, value: config } = configSchema.validate(rawConfig, {
  abortEarly: false
})
if (error) {
  const { details } = error
  const message = details.map(i => i.message).join(',')

  errorHandler.critical(
    new AppError(
      'Arquivo de configuração inválido. Configure novamente o serviço.',
      null,
      message
    )
  )
}

module.exports = config
