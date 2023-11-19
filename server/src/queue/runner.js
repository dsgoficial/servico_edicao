'use strict'

const fs = require('fs')
const path = require('path')
const util = require('util')
const childProcess = require('child_process')

const readFile = util.promisify(fs.readFile)
const exec = util.promisify(childProcess.exec)

const { AppError } = require('../utils')

const { FE_PATH, PATH_PDF } = require('../config')

class runnerError extends Error {
  constructor(message, log = null) {
    super(message)
    this.log = log
  }
}

const runner = async (workspacePath, parameters) => {
  workspacePath = path.join(PATH_PDF, workspacePath)

  const mainPath = workspacePath
    .split(path.sep)
    .slice(0, -1)
    .join(path.sep)

  const logDate = new Date()
    .toISOString()
    .replace(/-/g, '')
    .replace(/:/g, '')
    .split('.')[0]

  const fixedWorkspacePath = workspacePath
    .split(path.sep)[workspacePath.split(path.sep).length - 1]
    .replace('.fmw', '')

  parameters.LOG_FILE = `${mainPath}${path.sep}fme_logs${path.sep}${fixedWorkspacePath}_${logDate}.log`

  const executeCmdArray = [FE_PATH, workspacePath]
  for (const key in parameters) {
    executeCmdArray.push(`--${key} "${parameters[key]}"`)
  }
  const executeCmd = executeCmdArray.join(' ')

  try {
    const { stderr } = await exec(executeCmd)
    if (stderr.trim().indexOf('Translation was SUCCESSFUL') === -1) {
      throw new Error()
    }

    return getSummary(parameters.LOG_FILE)
  } catch (e) {
    const log = await getLog(parameters.LOG_FILE)
    if (log) {
      throw new runnerError('Erro na execução da edição', log)
    }
    throw new AppError('Erro na execução da edição', null, e)
  }
}

module.exports = { runner, runnerError }
