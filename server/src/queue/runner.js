'use strict'

const fs = require('fs').promises;
const path = require('path')
const util = require('util')
const childProcess = require('child_process')
const { v4: uuidv4 } = require('uuid');

const exec = util.promisify(childProcess.exec)

const { AppError } = require('../utils')

const { FE_PATH, PATH_PDF } = require('../config')

class runnerError extends Error {
  constructor(message, log = null) {
    super(message)
    this.log = log
  }
}

const runner = async (json, tipo, login, senha, proxyHost, proxyPort, proxyUser, proxyPassword, exportTiff) => {

  const uniqueFileName = `${uuidv4()}.json`;
  const filePath = path.join(__dirname, uniqueFileName);
  await fs.writeFile(filePath, JSON.stringify(json, null, 2));

  const executeCmd = `${FE_PATH} --tipo '${tipo}' --json '${filePath}' --login ${login} --senha ${senha} --proxyHost ${proxyHost} --proxyPort ${proxyPort} --proxyUser ${proxyUser} --proxyPassword ${proxyPassword} --exportFolder ${PATH_PDF} --exportTiff ${exportTiff}`;

  try {
    const { stdout, stderr } = await exec(executeCmd)

    if (stderr) {
      console.error(`stderr: ${stderr}`);
      throw new Error(stderr);
    }

    await fs.unlink(filePath);

  } catch (e) {
    throw new AppError('Erro na execução da edição', null, e)
  }
}

module.exports = { runner, runnerError }
