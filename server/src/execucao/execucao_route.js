"use strict";

const express = require("express");

const { schemaValidation, asyncHandler, httpCode } = require("../utils");

const { verifyAdmin, verifyLogin } = require("../login");

const execucaoCtrl = require("./execucao_ctrl");
const execucaoSchema = require("./execucao_schema");

const router = express.Router();

router.get(
  "/",
  verifyLogin,
  schemaValidation({ query: execucaoSchema.paginacaoQuery }),
  asyncHandler(async (req, res, next) => {
    const { execucoes, total } = await execucaoCtrl.getExecucaoPagination(
      req.query.pagina,
      req.query.total_pagina,
      req.query.coluna_ordem,
      req.query.direcao_ordem,
      req.query.filtro
    );

    const msg = "Lista de execuções retornadas";

    return res.sendJsonAndLog(true, msg, httpCode.OK, execucoes, null, {
      total,
    });
  })
);

router.get(
  "/:uuid",
  schemaValidation({ params: execucaoSchema.uuidParams }),
  asyncHandler(async (req, res, next) => {
    const dados = await execucaoCtrl.getExecucaoStatus(req.params.uuid);

    const msg = "Informação sobre o execução retornada";

    return res.sendJsonAndLog(true, msg, httpCode.OK, dados);
  })
);

router.get(
  "/agendada/cron",
  verifyLogin,
  asyncHandler(async (req, res, next) => {
    const dados = await execucaoCtrl.getExecucaoAgendadaCron();

    const msg = "Lista de execuções retornadas";

    return res.sendJsonAndLog(true, msg, httpCode.OK, dados);
  })
);

router.get(
  "/agendada/data",
  verifyLogin,
  asyncHandler(async (req, res, next) => {
    const dados = await execucaoCtrl.getExecucaoAgendadaData();

    const msg = "Lista de execuções retornadas";

    return res.sendJsonAndLog(true, msg, httpCode.OK, dados);
  })
);

router.post(
  "/",
  schemaValidation({
    body: execucaoSchema.parametros
  }),
  asyncHandler(async (req, res, next) => {
    const jobUuid = uuidv4();

    await execucaoCtrl.execucao(
      jobUuid,
      req.body.json,
      req.body.tipo,
      req.body.login,
      req.body.senha,
      req.body.proxyHost,
      req.body.proxyPort,
      req.body.proxyUser,
      req.body.proxyPassword,
      req.body.exportTiff
    );

    const msg = "Execução da exportação requisitada com sucesso";

    return res.sendJsonAndLog(true, msg, httpCode.Created, {
      job_uuid: jobUuid,
    });
  })
);


module.exports = router;
