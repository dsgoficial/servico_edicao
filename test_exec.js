const { exec } = require('child_process');
const path = require('path');

// Assuming the first argument is the OSGEO4W_ROOT path
const OSGEO4W_ROOT = process.argv[2].replace(/"/g, '');
const QT_DIR = 'Qt5';
const GRASS_DIR = 'grass78';
const PYTHON_DIR = 'Python39';
const pythonScriptPath = path.join(OSGEO4W_ROOT, 'apps', PYTHON_DIR, 'python');
const scriptToRun = 'C:\\Users\\diniz\\AppData\\Roaming\\QGIS\\QGIS3\\profiles\\default\\python\\plugins\\ferramentas_edicao\\standalone.py';

// Setting environment variables
process.env.OSGEO4W_ROOT = OSGEO4W_ROOT;
process.env.QT_DIR = QT_DIR;
process.env.GRASS_DIR = GRASS_DIR;
process.env.PYTHON_DIR = PYTHON_DIR;
process.env.QGIS_PREFIX_PATH = `${OSGEO4W_ROOT.replace(/\\/g, '/')}/apps/qgis`;
process.env.GDAL_FILENAME_IS_UTF8 = 'YES';
process.env.VSI_CACHE = 'TRUE';
process.env.VSI_CACHE_SIZE = '1000000';
process.env.QT_PLUGIN_PATH = `${OSGEO4W_ROOT}\\apps\\qgis\\qtplugins;${OSGEO4W_ROOT}\\apps\\qt5\\plugins`;
process.env.PYTHONPATH = `${OSGEO4W_ROOT}\\apps\\qgis\\python;${process.env.USERPROFILE}\\AppData\\Roaming\\QGIS\\QGIS3\\profiles\\default\\python\\plugins;${process.env.PYTHONPATH}`;
process.env.PATH = `${OSGEO4W_ROOT}\\apps\\qgis\\bin;${OSGEO4W_ROOT}\\apps\\grass\\grass78\\lib;${OSGEO4W_ROOT}\\apps\\grass\\grass78\\bin;${OSGEO4W_ROOT}\\apps\\qt5\\bin;${OSGEO4W_ROOT}\\apps\\Python39\\Scripts;${OSGEO4W_ROOT}\\bin;${OSGEO4W_ROOT}\\apps\\qgis\\python\\plugins;${process.env.PATH}`;
process.env.PYTHONHOME = `${OSGEO4W_ROOT}\\apps\\${PYTHON_DIR}`;

// Executing the Python script
const command = `"${pythonScriptPath}" "${scriptToRun}" ${process.argv.slice(3).join(' ')}`;

exec(command, { shell: true }, (error, stdout, stderr) => {
    if (error) {
        console.error(`exec error: ${error}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
    if (stderr) {
        console.error(`stderr: ${stderr}`);
    }
});

