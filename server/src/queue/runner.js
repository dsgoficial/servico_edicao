'use strict'

const fs = require('fs')
const path = require('path')
const util = require('util')
const childProcess = require('child_process')

const exec = util.promisify(childProcess.exec)

const { AppError } = require('../utils')

const { FE_PATH, PATH_PDF } = require('../config')

class runnerError extends Error {
  constructor(message, log = null) {
    super(message)
    this.log = log
  }
}

const runner = async (parameters) => {

  const executeCmd = `${FE_PATH} -j '${parameters}' -ef ${PATH_PDF}`;

  try {
    const { stdout, stderr } = await exec(executeCmd)

    if (stderr) {
      console.error(`stderr: ${stderr}`);
      throw new Error(stderr);
    }
  } catch (e) {
    throw new AppError('Erro na execução da edição', null, e)
  }
}

module.exports = { runner, runnerError }
