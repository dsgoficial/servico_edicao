const schedule = require("node-schedule");
const { v4: uuidv4 } = require("uuid");

const { db } = require("../database");
const jobQueue = require("../queue");

const { logger } = require("../utils");

const handleTarefas = {};

handleTarefas.tarefasAgendadas = {};

const criaExecucao = async (uuid, parametros) => {
  await db.conn.none(
    `
      INSERT INTO edicao.execucao(uuid, status_id, data_execucao, parametros)
      VALUES($<uuid>,1, CURRENT_TIMESTAMP, $<parametros:json>)
      `,
    { uuid, parametros }
  );
};

const loadTarefaData = (tarefas) => {
  tarefas.forEach((t) => {
    const job = schedule.scheduleJob(t.configuracao, async () => {
      const jobUuid = uuidv4();
      const taskId = `${jobUuid}|${t.uuid}`;
      await criaExecucao(jobUuid, t.parametros);
      logger.info("Inicio execução tarefa data", {
        uuid: t.uuid,
      });
      jobQueue.push({
        id: taskId,
        parametros: t.parametros
      });
    });
    handleTarefas.tarefasAgendadas[t.uuid] = job;
  });
};

const loadTarefaCron = (tarefas) => {
  tarefas.forEach((t) => {
    const job = schedule.scheduleJob(
      { start: t.data_inicio, end: t.data_fim, rule: t.configuracao },
      async () => {
        const jobUuid = uuidv4();
        const taskId = `${jobUuid}|${t.uuid}`;
        await criaExecucao(jobUuid, t.parametros);
        logger.info("Inicio execução tarefa cron", {
          uuid: t.uuid,
        });
        jobQueue.push({
          id: taskId,
          parametros: t.parametros,
        });
      }
    );
    handleTarefas.tarefasAgendadas[t.uuid] = job;
  });
};

handleTarefas.cancel = (uuid) => {
  handleTarefas.tarefasAgendadas[uuid].cancel();
};

handleTarefas.loadData = (
  uuid,
  path,
  configuracao,
  parametros
) => {
  loadTarefaData([{ uuid, path, configuracao, parametros}]);
};

handleTarefas.loadCron = (
  uuid,
  path,
  configuracao,
  parametros,
  dataInicio,
  dataFim
) => {
  loadTarefaCron([
    {
      uuid,
      path,
      configuracao,
      parametros,
      data_inicio: dataInicio,
      data_fim: dataFim
    },
  ]);
};

handleTarefas.carregaTarefasAgendadas = async () => {
  const tarefasData = await db.conn.any(
    `
    SELECT ta.uuid, ta.data_execucao AS configuracao, ta.parametros
    FROM edicao.tarefa_agendada_data AS ta
    WHERE ta.data_execucao > now()
    `
  );
  if (tarefasData.length > 0) {
    loadTarefaData(tarefasData);
  }

  const tarefasCron = await db.conn.any(
    `
    SELECT ta.uuid, ta.configuracao_cron AS configuracao, ta.parametros,
    ta.data_inicio, ta.data_fim
    FROM edicao.tarefa_agendada_cron AS ta
    WHERE ta.data_fim IS NULL OR ta.data_fim > now()
    `
  );
  if (tarefasCron.length > 0) {
    loadTarefaCron(tarefasCron);
  }
};

module.exports = handleTarefas;
