'use strict'

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Serviço de Edição',
      version: '2.0.0',
      description: 'API HTTP para utilização do Serviço de Edição'
    }
  },
  apis: ['./src/**/*.js']
}

module.exports = swaggerOptions
