'use strict'

const fs = require('fs').promises;
const path = require('path')
const util = require('util')
const { v4: uuidv4 } = require("uuid");

const exec = util.promisify(require('child_process').exec);

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

  const OSGEO4W_ROOT = QGIS_PATH;
  env.OSGEO4W_ROOT = OSGEO4W_ROOT;
  env.QT_DIR = "Qt5";
  env.GRASS_DIR = "grass78";
  env.PYTHON_DIR = "Python39";
  env.GDAL_DATA = `${OSGEO4W_ROOT}\\share\\gdal`
  env.GDAL_DRIVER_PATH = `${OSGEO4W_ROOT}\\bin\\gdalplugins`
  env.GS_LIB = `${OSGEO4W_ROOT}\\apps\\gs\\lib`
  env.JPEGMEM = 1000000
  env.OPENSSL_ENGINES = `${OSGEO4W_ROOT}\\lib\\engines-1_1`
  env.SSL_CERT_FILE = `${OSGEO4W_ROOT}\\bin\\curl-ca-bundle.crt`
  env.SSL_CERT_DIR = `${OSGEO4W_ROOT}\\apps\\openssl\\certs`
  env.PROJ_LIB = `${OSGEO4W_ROOT}\\share\\proj`
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

  try {
    let executeCmd = `"${pythonScriptPath}" ${executeCmdArray.join(' ')}`

    console.log('Iniciando exportação: ', id)

    const { stdout, stderr } = await exec(executeCmd, { env });

    await fs.unlink(filePath);

    const files = await fs.readdir(exportPath);
    const result = {
      pdf: '',
      geotiff: ''
    };

    files.forEach(file => {
      if (file.endsWith('.pdf')) {
        result.pdf = `api/export/${id}/${file}`;
      } else if (exportTiff && file.endsWith('.tif')) {
        result.geotiff = `api/export/${id}/${file}`;
      }
    });

    console.log('Finalizada exportação: ', id)

    return result

  } catch (e) {
    console.log(e)
    throw new AppError('Erro na execução da edição', null, e)
  }
}

module.exports = { runner, runnerError }
