'use strict'

const { db } = require('../database')

const { AppError, httpCode } = require('../utils')
const jobQueue = require("../queue");

const controller = {}

controller.getExecucaoPagination = async (pagina, totalPagina, colunaOrdem, direcaoOrdem, filtro) => {
  let where = ''

  if (filtro) {
    where = ` WHERE lower(concat_ws('|',e.uuid,s.nome,e.data_execucao,e.tempo_execucao, e.sumario, e.parametros)) LIKE '%${filtro.toLowerCase()}%'`
  }

  let sort = ''
  if (colunaOrdem) {
    if (direcaoOrdem) {
      sort = ` ORDER BY e.${colunaOrdem} ${direcaoOrdem}`
    } else {
      sort = ` ORDER BY e.${colunaOrdem} ASC`
    }
  } else {
    sort = ` ORDER BY e.data_execucao DESC`
  }

  let paginacao = ''

  if (pagina && totalPagina) {
    paginacao = ` LIMIT ${totalPagina} OFFSET (${pagina} - 1)*${totalPagina}`
  }

  const sql = `SELECT e.uuid, s.nome AS status, e.data_execucao, e.tempo_execucao, e.sumario, e.log, e.parametros
  FROM edicao.execucao AS e
  INNER JOIN dominio.status AS s ON s.code = e.status_id
  ${where} ${sort} ${paginacao}`

  const execucoes = await db.conn.any(sql)

  const total = execucoes.length

  return { execucoes, total }
}

controller.getExecucaoStatus = async uuid => {
  const dados = await db.conn.oneOrNone(
    `
    SELECT e.uuid, e.status_id, s.nome AS status, e.data_execucao, e.tempo_execucao, e.sumario, e.parametros, e.log
    FROM edicao.execucao AS e
    INNER JOIN dominio.status AS s ON s.code = e.status_id
    WHERE e.uuid = $<uuid>
    `,
    { uuid }
  )

  if (!dados) {
    throw new AppError('Informação de execução não encontrada', httpCode.BadRequest)
  }

  return dados
}

controller.getExecucaoAgendadaCron = async () => {
  return db.conn.any(
    `
    SELECT s.nome AS status, e.data_execucao, e.tempo_execucao, e.sumario, e.log, e.parametros,
    ta.nome AS agendamento, ta.uuid AS agendamento_uuid
    FROM edicao.execucao AS e
    INNER JOIN edicao.tarefa_agendada_cron AS ta ON ta.uuid = e.tarefa_agendada_uuid
    INNER JOIN dominio.status AS s ON s.code = e.status_id
    `
  )
}

controller.getExecucaoAgendadaData = async () => {
  return db.conn.any(
    `
    SELECT s.nome AS status, e.data_execucao, e.tempo_execucao, e.sumario, e.log, e.parametros,
    ta.nome AS agendamento, ta.uuid AS agendamento_uuid
    FROM edicao.execucao AS e
    INNER JOIN edicao.tarefa_agendada_data AS ta ON ta.uuid = e.tarefa_agendada_uuid
    INNER JOIN dominio.status AS s ON s.code = e.status_id
    `
  )
}

controller.execucao = async (uuid, parametros) => {
  await db.conn.none(
    `
      INSERT INTO edicao.execucao(uuid, status_id, data_execucao, parametros)
      VALUES($<uuid>,1, CURRENT_TIMESTAMP, $<parametros:json>)
      `,
    { uuid, parametros }
  )

  jobQueue.push({ id: uuid, parametros })
}

module.exports = controller
