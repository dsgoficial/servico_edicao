'use strict'

const { db } = require('../database')

const controller = {}

controller.getUltimasExecucoes = async (total = 10) => {
  return db.conn.any(
    `
    SELECT s.nome AS status, e.data_execucao, e.tempo_execucao
    FROM edicao.execucao AS e
    INNER JOIN dominio.status AS s ON s.code = e.status_id
    ORDER BY e.data_execucao DESC
    LIMIT $<total:raw>
    `,
    { total }
  )
}

controller.getExecucoesDia = async (total = 14) => {
  const result = await db.conn.any(
    `SELECT day::date AS data_execucao,count(e.id) AS execucoes FROM 
    generate_series((now() - interval '$<total:raw> day')::date, now()::date, interval  '1 day') AS day
    LEFT JOIN edicao.execucao AS e ON e.data_execucao::date = day.day::date
    GROUP BY day::date
    ORDER BY day::date
    `,
    { total: total - 1 }
  )
  result.forEach(r => {
    r.execucoes = +r.execucoes
  })

  return result
}

controller.getExecucoesMes = async (total = 12) => {
  const result = await db.conn.any(
    `SELECT date_trunc('month', month.month)::date AS data_execucao, count(e.id) AS execucoes FROM 
    generate_series(date_trunc('month', (date_trunc('month', now()) - interval '$<total:raw> months'))::date, date_trunc('month', now())::date, interval  '1 month') AS month
    LEFT JOIN edicao.execucao AS e ON date_trunc('month', e.data_execucao) = date_trunc('month', month.month)
    GROUP BY date_trunc('month', month.month)
    ORDER BY date_trunc('month', month.month)
    `,
    { total: total - 1 }
  )

  result.forEach(r => {
    r.execucoes = +r.execucoes
  })

  return result
}

controller.getExecucoes = async () => {
  const result = await db.conn.one(
    'SELECT count(*) FROM edicao.execucao WHERE status_id = 2'
  )

  return result.count
}

controller.getTempoExecucao = async (total = 365, max = 10) => {
  return db.conn.any(
    `SELECTavg(e.tempo_execucao) AS tempo_execucao_medio
    FROM edicao.execucao AS e
    WHERE e.data_execucao::date >= (now() - interval '$<total:raw> day')::date AND e.status_id = 2
    GROUP BY r.nome
    ORDER BY avg(e.tempo_execucao) DESC
    LIMIT $<max:raw>`,
    { total: total - 1, max }
  )
}

module.exports = controller
