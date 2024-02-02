const Queue = require('better-queue')

const { db } = require('../database')

const { runner, runnerError } = require('./runner')

const { errorHandler, AppError } = require('../utils')

const jobQueue = new Queue(
  async (input, cb) => {
    try {
      const result = await runner(
        input.parametros
      )
      cb(null, result)
    } catch (err) {
      cb(err, null)
    }
  },
  { concurrent: 1 }
)

const updateJob = async (taskId, status, time, log = null, summary = null) => {
  const uuid = taskId.includes('|') ? taskId.split('|')[0] : taskId
  const agenda = taskId.includes('|') ? taskId.split('|')[1] : null

  return db.conn.none(
    `
    UPDATE edicao.execucao SET status_id = $<status>, tempo_execucao = $<time>,
    sumario = $<summary:json>, log = $<log>, tarefa_agendada_uuid = $<agenda>
    WHERE uuid = $<uuid>
    `,
    { status, time, summary, log, uuid, agenda }
  )
}

jobQueue.on('task_finish', (taskId, result, stats) => {
  updateJob(taskId, 2, stats.elapsed / 1000, result.log, result.summary)
})

jobQueue.on('task_failed', function (taskId, err, stats) {
  errorHandler.log(
    new AppError(
      `Falha na execução de ${taskId}`
    )
  )
  const log = (err instanceof runnerError) ? err.log : null
  updateJob(taskId, 3, stats.elapsed / 1000, log)
})

module.exports = jobQueue
