'use strict'

const fs = require('fs').promises;
const path = require('path')
const util = require('util')
const { v4: uuidv4 } = require("uuid");

const exec = util.promisify(require('child_process').exec);

const { AppError } = require('../utils')

const {
  FE_PATH,
  QGIS_PATH,
  PATH_EXPORT,
  QGIS_QT_DIR,
  QGIS_GRASS_DIR,
  QGIS_PYTHON_DIR,
  QGIS_PROFILE_PLUGINS_PATH
} = require('../config')

class runnerError extends Error {
  constructor(message, log = null) {
    super(message)
    this.log = log
  }
}

const runner = async (id, json, tipo, login, senha, proxyHost, proxyPort, proxyUser, proxyPassword, exportTiff, exportTiffWithoutGrid) => {

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
  if(exportTiffWithoutGrid){
    executeCmdArray.push(`--exportTiffWithoutGrid`)
  }

  let env = { ...process.env }; // Clone current environment

  const OSGEO4W_ROOT = QGIS_PATH;

  // Nomes dos diretorios em <QGIS>\apps (variam por versao do QGIS/ambiente).
  // Configuraveis via .env (QGIS_QT_DIR / QGIS_GRASS_DIR / QGIS_PYTHON_DIR);
  // defaults do QGIS 4.0 vem do config.js.
  const QT_DIR = QGIS_QT_DIR;
  const GRASS_DIR = QGIS_GRASS_DIR;
  const PYTHON_DIR = QGIS_PYTHON_DIR;

  // Pasta de plugins do perfil do QGIS onde o plugin esta instalado.
  // Configuravel via .env (QGIS_PROFILE_PLUGINS_PATH); por padrao usa a pasta
  // pai de FE_PATH (ex.: ...\profiles\default\python\plugins).
  const QGIS_PROFILE_PLUGINS = QGIS_PROFILE_PLUGINS_PATH || path.dirname(FE_PATH);

  env.OSGEO4W_ROOT = OSGEO4W_ROOT;
  // Valores retirados de <QGIS>\bin\etc\ini\*.bat da instalacao do QGIS 4.0.
  env.GDAL_DATA = `${OSGEO4W_ROOT}\\apps\\gdal\\share\\gdal`;
  env.GDAL_DRIVER_PATH = `${OSGEO4W_ROOT}\\apps\\gdal\\lib\\gdalplugins`;
  env.GS_LIB = `${OSGEO4W_ROOT}\\apps\\gs\\lib`;
  env.JPEGMEM = 1000000;
  env.OPENSSL_ENGINES = `${OSGEO4W_ROOT}\\lib\\engines-3`;
  env.SSL_CERT_FILE = `${OSGEO4W_ROOT}\\bin\\curl-ca-bundle.crt`;
  env.SSL_CERT_DIR = `${OSGEO4W_ROOT}\\apps\\openssl\\certs`;
  env.PDAL_DRIVER_PATH = `${OSGEO4W_ROOT}\\apps\\pdal\\plugins`;
  // PROJ 9 (QGIS 4) usa PROJ_DATA; mantemos PROJ_LIB por compatibilidade.
  env.PROJ_DATA = `${OSGEO4W_ROOT}\\share\\proj`;
  env.PROJ_LIB = `${OSGEO4W_ROOT}\\share\\proj`;
  env.QGIS_PREFIX_PATH = `${OSGEO4W_ROOT.replace(/\\/g, '/')}/apps/qgis`;
  env.GDAL_FILENAME_IS_UTF8 = "YES";
  env.VSI_CACHE = "TRUE";
  env.VSI_CACHE_SIZE = "1000000";
  env.PYTHONUTF8 = "1";
  env.QT_PLUGIN_PATH = `${OSGEO4W_ROOT}\\apps\\qgis\\qtplugins;${OSGEO4W_ROOT}\\apps\\${QT_DIR}\\plugins`;
  env.PYTHONHOME = `${OSGEO4W_ROOT}\\apps\\${PYTHON_DIR}`;
  env.PYTHONPATH = [
    `${OSGEO4W_ROOT}\\apps\\qgis\\python`,
    QGIS_PROFILE_PLUGINS,
    env.PYTHONPATH,
  ].filter(Boolean).join(";");
  env.PATH = [
    `${OSGEO4W_ROOT}\\apps\\qgis\\bin`,
    `${OSGEO4W_ROOT}\\apps\\grass\\${GRASS_DIR}\\lib`,
    `${OSGEO4W_ROOT}\\apps\\grass\\${GRASS_DIR}\\bin`,
    `${OSGEO4W_ROOT}\\apps\\${QT_DIR}\\bin`,
    `${OSGEO4W_ROOT}\\apps\\${PYTHON_DIR}\\Scripts`,
    `${OSGEO4W_ROOT}\\bin`,
    `${OSGEO4W_ROOT}\\apps\\qgis\\python\\plugins`,
    env.PATH,
  ].filter(Boolean).join(";");

  const pythonScriptPath = path.join(OSGEO4W_ROOT, "apps", PYTHON_DIR, "python");

  try {
    let executeCmd = `"${pythonScriptPath}" ${executeCmdArray.join(' ')}`

    console.log('Iniciando exportação: ', id)

    const { stdout, stderr } = await exec(executeCmd, { env });

    await fs.unlink(filePath);

    const files = await fs.readdir(exportPath);
    const result = {
      pdf: '',
      geotiff: '',
      geotiff_sem_grid: '',
    };

    files.forEach(file => {
      if (file.endsWith('.pdf')) {
        result.pdf = `api/export/${id}/${file}`;
      } else if (exportTiffWithoutGrid && file.endsWith('.tif') && file.includes('sem_grid')) {
        result.geotiff_sem_grid = `api/export/${id}/${file}`;
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
