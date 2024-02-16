'use strict'

const fs = require('fs').promises;
const path = require('path')
const util = require('util')
const childProcess = require('child_process')
const { v4: uuidv4 } = require('uuid');

const exec = util.promisify(childProcess.exec)

const { AppError } = require('../utils')

const { FE_PATH, PATH_EXPORT } = require('../config')

class runnerError extends Error {
  constructor(message, log = null) {
    super(message)
    this.log = log
  }
}

const runner = async (id, json, tipo, login, senha, proxyHost, proxyPort, proxyUser, proxyPassword, exportTiff) => {

  const uniqueFileName = `${uuidv4()}.json`;
  const filePath = path.join(__dirname, uniqueFileName);
  await fs.writeFile(filePath, JSON.stringify(json, null, 2));

  const exportPath = path.join(PATH_EXPORT, id);

  await fs.mkdir(exportPath, { recursive: true });

  const executeCmd = `${FE_PATH} --tipo '${tipo}' --json '${filePath}' --login ${login} --senha ${senha} --proxyHost ${proxyHost} --proxyPort ${proxyPort} --proxyUser ${proxyUser} --proxyPassword ${proxyPassword} --exportFolder ${exportPath} --exportTiff ${exportTiff}`;

  try {
    const { stdout, stderr } = await exec(executeCmd)

    if (stderr) {
      console.error(`stderr: ${stderr}`);
      throw new Error(stderr);
    }

    await fs.unlink(filePath);

    const files = await fs.readdir(exportPath);
    const result = {
      pdf: '',
      geotiff: ''
    };

    files.forEach(file => {
      if (file.endsWith('.pdf')) {
        result.pdf = path.join(exportPath, file); // Assuming the path you want to return is relative to the /export route
      } else if (exportTiff && file.endsWith('.tif')) {
        result.geotiff = path.join(exportPath, file);
      }
    });

    return result

  } catch (e) {
    throw new AppError('Erro na execução da edição', null, e)
  }
}

module.exports = { runner, runnerError }
