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

controller.deleteExportedFiles = async () => {
  const files = await readdir(PATH_EXPORT)
  const filesFiltered = files.filter(f => f.endsWith('.pdf') || f.endsWith('.tif'))
  return Promise.all(filesFiltered.map(f => unlink(path.join(PATH_EXPORT, f))))
}

controller.getInfoExportedFiles = async () => {
  const files = await readdir(PATH_EXPORT)
  const filesFiltered = files.filter(f => f.endsWith('.pdf') || f.endsWith('.tif'))
  const stats = await Promise.all(filesFiltered.map(f => stat(path.join(PATH_EXPORT, f))))

  let size = 0
  stats.forEach(s => {
    size += s.size
  })
  return { tamanho: formatBytes(size), arquivos: filesFiltered.length }
}

module.exports = controller
