'use strict'

// https://github.com/hapijs/joi/issues/570
const Joi = baseJoi.extend((joi) => ({
  base: joi.array(),
  type: "stringArray",
  coerce: (value, state, options) => {
    if (typeof value !== "string") {
      return value;
    }

    return value.replace(/^,+|,+$/gm, "").split(",");
  },
}));


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
  parametros: Joi.object().required()
});

module.exports = models
