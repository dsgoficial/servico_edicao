'use strict'

const express = require('express')

const { asyncHandler, httpCode } = require('../utils')

const { verifyAdmin } = require('../login')

const exportCtrl = require('./export_ctrl')

const router = express.Router()

router.get(
  '/',
  verifyAdmin,
  asyncHandler(async (req, res, next) => {
    const dados = await exportCtrl.getInfoExportedFiles()

    const msg = 'Informação dos arquivos exportados retornadas sucesso'

    return res.sendJsonAndLog(true, msg, httpCode.OK, dados)
  })
)

router.delete(
  '/',
  verifyAdmin,
  asyncHandler(async (req, res, next) => {
    await exportCtrl.deleteExportedFiles()

    const msg = 'Arquivos exportados deletados com sucesso'

    return res.sendJsonAndLog(true, msg, httpCode.OK)
  })
)

module.exports = router
