'use strict'

const fs = require('fs').promises;
const path = require('path')
const util = require('util')
const childProcess = require('child_process')
const { v4: uuidv4 } = require("uuid");

const { spawn } = require('child_process');

const { AppError } = require('../utils')

const { FE_PATH, QGIS_PATH, PATH_EXPORT } = require('../config')

class runnerError extends Error {
  constructor(message, log = null) {
    super(message)
    this.log = log
  }
}

const runner = async (id, json, tipo, login, senha, proxyHost, proxyPort, proxyUser, proxyPassword, exportTiff) => {

  const uniqueFileName = `${uuidv4()}.json`;
  const filePath = path.join(__dirname, '..', 'export', uniqueFileName);
  await fs.writeFile(filePath, JSON.stringify(json, null, 2));

  const exportPath = path.join(PATH_EXPORT, id);
  const standalone = path.join(FE_PATH, 'standalone.py');

  await fs.mkdir(exportPath, { recursive: true });

  const parameters = {
    proxyHost,
    proxyPort,
    proxyUser,
    proxyPassword
  };

 

  const executeCmdArray = [`"${standalone}"`, `"${QGIS_PATH}"`, `--tipo "${tipo}"`, `--json "${filePath}"`, `--login "${login}"`, `--senha "${senha}"`, `--exportFolder "${exportPath}"`]

  for (const key in parameters) {
    if (parameters[key]){
      executeCmdArray.push(`--${key} "${parameters[key]}"`)
    }
  }

  if(exportTiff){
    executeCmdArray.push(`--exportTiff`)
  }

  let env = { ...process.env }; // Clone current environment

  // Set or modify the environment variables as per the batch file
  const OSGEO4W_ROOT = QGIS_PATH;
  env.OSGEO4W_ROOT = OSGEO4W_ROOT;
  env.QT_DIR = "Qt5";
  env.GRASS_DIR = "grass78";
  env.PYTHON_DIR = "Python39";
  env.QGIS_PREFIX_PATH = `${OSGEO4W_ROOT.replace(/\\/g, '/')}/apps/qgis`;
  env.GDAL_FILENAME_IS_UTF8 = "YES";
  env.VSI_CACHE = "TRUE";
  env.VSI_CACHE_SIZE = "1000000";
  env.QT_PLUGIN_PATH = `${OSGEO4W_ROOT}\\apps\\qgis\\qtplugins;${OSGEO4W_ROOT}\\apps\\qt5\\plugins`;
  env.PYTHONPATH = `${OSGEO4W_ROOT}\\apps\\qgis\\python;${env.PYTHONPATH}`;
  env.PYTHONPATH =`${OSGEO4W_ROOT}\\apps\\qgis\\python;${env.USERPROFILE}\\AppData\\Roaming\\QGIS\\QGIS3\\profiles\\default\\python\\plugins;${env.PYTHONPATH}`;
  env.PATH = `${OSGEO4W_ROOT}\\apps\\qgis\\bin;${OSGEO4W_ROOT}\\apps\\grass\\grass78\\lib;${OSGEO4W_ROOT}\\apps\\grass\\grass78\\bin;${OSGEO4W_ROOT}\\apps\\qt5\\bin;${OSGEO4W_ROOT}\\apps\\Python39\\Scripts;${OSGEO4W_ROOT}\\bin;${OSGEO4W_ROOT}\\apps\\qgis\\python\\plugins;${env.PATH}`;
  env.PYTHONHOME = `${OSGEO4W_ROOT}\\apps\\${env.PYTHON_DIR}`;
  
  const pythonScriptPath = path.join(OSGEO4W_ROOT, "apps", "Python39", "python");

  console.log(`"${pythonScriptPath}"`,`${executeCmdArray.join(' ')}`);

  try {
    const executeCmdPromise = new Promise((resolve, reject) => {
      const process = spawn(`"${pythonScriptPath}"`, executeCmdArray, { env: env, shell: true });

      process.stdout.on('data', (data) => {
          console.log(`stdout: ${data}`);
      });
      
      process.stderr.on('data', (data) => {
          console.error(`stderr: ${data}`);
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Process exited with code: ${code}`));
        }
      });

      process.on('error', (err) => {
        console.log(err)
        reject(err);
      });
    });

    await executeCmdPromise;

    await fs.unlink(filePath);

    const files = await fs.readdir(exportPath);
    const result = {
      pdf: '',
      geotiff: ''
    };

    files.forEach(file => {
      if (file.endsWith('.pdf')) {
        result.pdf = path.join(exportPath, file);
      } else if (exportTiff && file.endsWith('.tif')) {
        result.geotiff = path.join(exportPath, file);
      }
    });

    return result

  } catch (e) {
    console.log(e)
    throw new AppError('Erro na execução da edição', null, e)
  }
}

module.exports = { runner, runnerError }
