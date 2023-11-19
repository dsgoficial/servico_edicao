'use strict'
const path = require('path')
const documentation = require('documentation')
const streamArray = require('stream-array')
const vfs = require('vinyl-fs')
const colors = require('colors') // colors for console
colors.enable()

const buildDocumentation = async () => {
  console.log('Criação da documentação do código.'.blue)

  return documentation
    .build(path.join(__dirname, 'src', '**', '*.js'), { shallow: false })
    .then(documentation.formats.html)
    .then(output => {
      streamArray(output).pipe(vfs.dest(path.join(__dirname, 'src', 'js_docs')))
      console.log('Documentação criada com sucesso!'.blue)
    })
    .catch(e => {
      console.log('Erro ao criar documentação!'.red)
      console.log('-------------------------------------------------')
      console.log(e.message.red)
      console.log('-------------------------------------------------')
      console.log(e)
      process.exit(0)
    })
}

if (typeof require !== 'undefined' && require.main === module) {
  buildDocumentation()
}

module.exports = buildDocumentation
