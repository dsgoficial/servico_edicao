'use strict'

const Joi = require('joi')

const models = {}

models.uuidParams = Joi.object().keys({
  uuid: Joi.string()
    .guid({ version: 'uuidv4' })
    .required()
})

models.paginacaoQuery = Joi.object().keys({
  pagina: Joi.number().integer().min(1),
  total_pagina: Joi.number().integer().min(5),
  coluna_ordem: Joi.string().allow(''),
  direcao_ordem: Joi.string().valid('asc', 'desc', ''),
  filtro: Joi.string().allow('')
})

models.parametros = Joi.object().keys({
  json: Joi.object().required(),
  tipo: Joi.string().valid('Carta Topográfica 1.3', 'Carta Topográfica 1.4', 'Carta Ortoimagem 2.4', 'Carta Ortoimagem 2.5', "Carta Ortoimagem OM 1.0", "Carta Ortoimagem Militar 2.4", "Carta Ortoimagem Militar 2.5", "Carta Topográfica Militar 1.3", "Carta Topográfica Militar 1.4").required(),
  login: Joi.string().required(),
  senha: Joi.string().required(),
  proxyHost: Joi.string().allow(''),
  proxyPort: Joi.number().integer().min(0),
  proxyUser: Joi.string().allow(''),
  proxyPassword: Joi.string().allow(''),
  exportTiff: Joi.boolean()
});

module.exports = models
