'use strict'

const fs = require('fs')
const path = require('path')
const util = require('util')

const readdir = util.promisify(fs.readdir)
const stat = util.promisify(fs.stat)
const unlink = util.promisify(fs.unlink)

const { PATH_EXPORT } = require('../config')

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

const controller = {}

async function deleteFilesAndFoldersRecursively(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await deleteFilesAndFoldersRecursively(entryPath);
    } else if (entry.name.endsWith('.pdf') || entry.name.endsWith('.tif')) {
      await unlink(entryPath);
    }
  }));

  if (directory !== PATH_EXPORT) {
    await rmdir(directory);
  }
}

controller.deleteExportedFiles = async () => {
  await deleteFilesAndFoldersRecursively(PATH_EXPORT);
}

async function getFileStatsRecursively(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const filesStatsPromises = entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return getFileStatsRecursively(entryPath);
    } else if (entry.name.endsWith('.pdf') || entry.name.endsWith('.tif')) {
      return stat(entryPath);
    }
    return null;
  });

  const filesStats = (await Promise.all(filesStatsPromises)).flat();
  return filesStats.filter(stat => stat);
}

controller.getInfoExportedFiles = async () => {
  const stats = await getFileStatsRecursively(PATH_EXPORT);
  let size = 0;
  stats.forEach(s => {
    size += s.size;
  });
  return { tamanho: formatBytes(size), arquivos: stats.length };
}

module.exports = controller
