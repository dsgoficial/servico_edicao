'use strict'
const express = require('express')
const path = require('path')

const { databaseVersion } = require('./database')
const {
  httpCode
} = require('./utils')

const { loginRoute } = require('./login')
const { usuarioRoute } = require('./usuario')
const { execucaoRoute } = require('./execucao')
const { dashboardRoute } = require('./dashboard')
const { tarefaRoute } = require('./tarefa_agendada')

const router = express.Router()

router.get('/', (req, res, next) => {
  return res.sendJsonAndLog(
    true,
    'Serviço de Edição operacional',
    httpCode.OK,
    {
      database_version: databaseVersion.nome
    }
  )
})

router.use('/login', loginRoute)

router.use(
  '/export',
  express.static(path.join(__dirname, 'export'))
)

router.use('/tarefas', tarefaRoute)

router.use('/usuarios', usuarioRoute)

router.use('/execucoes', execucaoRoute)

router.use('/dashboard', dashboardRoute)

module.exports = router
