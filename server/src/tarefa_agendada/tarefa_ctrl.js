"use strict";
const { v4: uuidv4 } = require("uuid");
const cronValidator = require("cron-validator");
const CronConverter = require("cron-converter");
const moment = require("moment");

const { db } = require("../database");

const { AppError, httpCode } = require("../utils");

const { loadData, loadCron, cancel } = require("./tarefa_handle");

const controller = {};

controller.getCron = async () => {
  const tarefaCron = await db.conn.any(`
    SELECT ta.id, ta.uuid, ta.nome, ta.data_agendamento, ta.usuario_id, ta.configuracao_cron AS configuracao,
    ta.data_inicio, ta.data_fim, ta.parametros, tpg.nome_abrev || ' ' || u.nome_guerra AS usuario
    FROM edicao.tarefa_agendada_cron AS ta
    LEFT JOIN dgeo.usuario AS u ON u.id = ta.usuario_id
    LEFT JOIN dominio.tipo_posto_grad AS tpg ON tpg.code = u.tipo_posto_grad_id
    WHERE ta.data_fim IS NULL OR ta.data_fim > now()
  `);
  tarefaCron.forEach((t) => {
    let cronInstance;
    if (t.data_inicio) {
      cronInstance = new CronConverter(moment(t.data_inicio));
    } else {
      cronInstance = new CronConverter();
    }
    cronInstance.fromString(t.configuracao);
    const schedule = cronInstance.schedule();
    const proximaExecucao = schedule.next();
    if (t.data_fim) {
      const dataFim = moment(t.data_fim);
      if (dataFim.isAfter(proximaExecucao)) {
        t.proxima_execucao = proximaExecucao.format();
      }
    } else {
      t.proxima_execucao = proximaExecucao.format();
    }
  });

  return tarefaCron.filter((t) => {
    return t.proxima_execucao;
  });
};

controller.insertCron = async (
  usuarioUuid,
  nome,
  configuracao,
  parametros,
  dataInicio,
  dataFim
) => {
  return db.conn.tx(async (t) => {
    const usuario = await t.oneOrNone(
      "SELECT id FROM dgeo.usuario WHERE uuid = $<usuarioUuid>",
      { usuarioUuid }
    );

    if (!usuario) {
      throw new AppError("Usuário inválido", httpCode.BadRequest);
    }

    const validCron = cronValidator.isValidCron(configuracao);
    if (!validCron) {
      throw new AppError(
        "Formato inválido para descrição do Cron",
        httpCode.BadRequest
      );
    }

    const tarefaUuid = uuidv4();

    await t.none(
      `INSERT INTO edicao.tarefa_agendada_cron(uuid, nome, data_agendamento, usuario_id, configuracao_cron, parametros, data_inicio, data_fim) 
    VALUES($<uuid>, $<nome>, now(), $<usuarioId>, $<configuracao>, $<parametros:json>, $<dataInicio>, $<dataFim>)`,
      {
        uuid: tarefaUuid,
        nome,
        usuarioId: usuario.id,
        configuracao,
        parametros,
        dataInicio,
        dataFim,
      }
    );

    loadCron(
      tarefaUuid,
      configuracao,
      parametros,
      dataInicio,
      dataFim
    );
  });
};

controller.deleteCron = async (uuid) => {
  return db.conn.tx(async (t) => {
    const result = await t.result(
      "DELETE FROM edicao.tarefa_agendada_cron WHERE uuid = $<uuid>",
      {
        uuid,
      }
    );
    if (!result.rowCount || result.rowCount !== 1) {
      throw new AppError("Tarefa não encontrada", httpCode.BadRequest);
    }

    cancel(uuid);
  });
};

controller.getData = async () => {
  const tarefaData = await db.conn.any(`
    SELECT ta.nome, ta.id, ta.uuid, ta.data_agendamento, ta.usuario_id, ta.data_execucao,
    ta.parametros, tpg.nome_abrev || ' ' || u.nome_guerra AS usuario
    FROM edicao.tarefa_agendada_data AS ta
    LEFT JOIN dgeo.usuario AS u ON u.id = ta.usuario_id
    LEFT JOIN dominio.tipo_posto_grad AS tpg ON tpg.code = u.tipo_posto_grad_id
    WHERE ta.data_execucao > now()
  `);

  return tarefaData;
};

controller.insertData = async (
  usuarioUuid,
  nome,
  configuracao,
  parametros
) => {
  return db.conn.tx(async (t) => {
    const usuario = await t.oneOrNone(
      "SELECT id FROM dgeo.usuario WHERE uuid = $<usuarioUuid>",
      { usuarioUuid }
    );

    if (!usuario) {
      throw new AppError("Usuário inválido", httpCode.BadRequest);
    }

    const tarefaUuid = uuidv4();

    await t.none(
      `INSERT INTO edicao.tarefa_agendada_data(uuid, nome, data_agendamento, usuario_id, data_execucao, parametros) 
    VALUES($<uuid>, $<nome>, now(), $<usuarioId>, $<configuracao>, $<parametros:json>)`,
      {
        uuid: tarefaUuid,
        nome,
        usuarioId: usuario.id,
        configuracao,
        parametros,
      }
    );

    loadData(
      tarefaUuid,
      configuracao,
      parametros
    );
  });
};

controller.deleteData = async (uuid) => {
  return db.conn.tx(async (t) => {
    await t.none("DELETE FROM edicao.tarefa_agendada_data WHERE uuid = $<uuid>", {
      uuid,
    });

    cancel(uuid);
  });
};

module.exports = controller;
