'use strict'

const fs = require('fs')
const inquirer = require('inquirer')
const colors = require('colors') // colors for console
colors.enable()

const path = require('path')
const promise = require('bluebird')
const crypto = require('crypto')
const axios = require('axios')

const pgp = require('pg-promise')({
  promiseLib: promise
})

const { Command } = require('commander')
const program = new Command()

const readSqlFile = file => {
  const fullPath = path.join(__dirname, file)
  return new pgp.QueryFile(fullPath, { minify: true })
}

const verifyDotEnv = () => {
  return fs.existsSync(path.join(__dirname, 'server', 'config.env'))
}

const verifyAuthServer = async authServer => {
  if (!authServer.startsWith('http://') && !authServer.startsWith('https://')) {
    throw new Error('Servidor deve iniciar com http:// ou https://')
  }
  try {
    const response = await axios.get(`${authServer}/api`)
    const wrongServer =
      !response ||
      response.status !== 200 ||
      !('data' in response) ||
      response.data.message !== 'Serviço de autenticação operacional'

    if (wrongServer) {
      throw new Error()
    }
  } catch (e) {
    console.log(e)
    throw new Error('Erro ao se comunicar com o servidor de autenticação')
  }
}

const getAuthUserData = async (servidor, token, uuid) => {
  const server = `${servidor}/api/usuarios/${uuid}`

  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    }
    const response = await axios.get(server, config)

    if (
      !('status' in response) ||
      response.status !== 200 ||
      !('data' in response) ||
      !('dados' in response.data)
    ) {
      throw new Error()
    }
    return response.data.dados
  } catch (e) {
    console.log(e)
    throw new Error('Erro ao se comunicar com o servidor de autenticação')
  }
}

const verifyLoginAuthServer = async (servidor, usuario, senha) => {
  const server = `${servidor}/api/login`

  try {
    const response = await axios.post(server, {
      usuario,
      senha,
      aplicacao: 'se'
    })
    if (
      !response ||
      !('status' in response) ||
      response.status !== 201 ||
      !('data' in response) ||
      !('dados' in response.data) ||
      !('success' in response.data) ||
      !('token' in response.data.dados) ||
      !('uuid' in response.data.dados)
    ) {
      throw new Error('')
    }

    const authenticated = response.data.success || false
    const authUserUUID = response.data.dados.uuid
    const token = response.data.dados.token

    const authUserData = await getAuthUserData(servidor, token, authUserUUID)
    return { authenticated, authUserData }
  } catch (e) {
    console.log(e)
    throw new Error('Erro ao se comunicar com o servidor de autenticação')
  }
}

const createDotEnv = (
  port,
  dbServer,
  dbPort,
  dbName,
  dbUser,
  dbPassword,
  authServer,
  fePath,
  qgisPath
) => {
  const secret = crypto.randomBytes(64).toString('hex')

  const env = `NODE_TLS_REJECT_UNAUTHORIZED=0
PORT=${port}
DB_SERVER=${dbServer}
DB_PORT=${dbPort}
DB_NAME=${dbName}
DB_USER=${dbUser}
DB_PASSWORD=${dbPassword}
JWT_SECRET=${secret}
AUTH_SERVER=${authServer}
QGIS_PATH=${qgisPath}
FE_PATH=${fePath}`

  fs.writeFileSync(path.join(__dirname, 'server', 'config.env'), env)
}

const givePermission = async ({
  dbUser,
  dbPassword,
  dbPort,
  dbServer,
  dbName,
  connection
}) => {
  if (!connection) {
    const connectionString = `postgres://${dbUser}:${dbPassword}@${dbServer}:${dbPort}/${dbName}`

    connection = pgp(connectionString)
  }

  console.log('Executando permissões...')

  await connection.none(readSqlFile('./er/permissao.sql'), [dbUser])
}

const insertAdminUser = async (authUserData, connection) => {
  const { login, nome, nome_guerra: nomeGuerra, tipo_posto_grad_id: tpgId, uuid } = authUserData

  await connection.none(
    `INSERT INTO dgeo.usuario (login, nome, nome_guerra, tipo_posto_grad_id, administrador, ativo, uuid) VALUES
    ($<login>, $<nome>, $<nomeGuerra>, $<tpgId>, TRUE, TRUE, $<uuid>)`,
    { login, nome, nomeGuerra, tpgId, uuid }
  )
}

const createDatabase = async (
  dbUser,
  dbPassword,
  dbPort,
  dbServer,
  dbName,
  authUserData
) => {
  console.log('Criando Banco...')
  const postgresConnectionString = `postgres://${dbUser}:${dbPassword}@${dbServer}:${dbPort}/postgres`
  const postgresConn = pgp(postgresConnectionString)

  const databases = await postgresConn.any('SELECT datname FROM pg_catalog.pg_database WHERE lower(datname) = lower($1)', dbName)
  if (databases.length > 0) {
    console.log('Banco de dados do Serviço de Edição já existe. Saindo...'.red)
    process.exit(0)
  }

  await postgresConn.none('CREATE DATABASE $1:name', [dbName])

  const connectionString = `postgres://${dbUser}:${dbPassword}@${dbServer}:${dbPort}/${dbName}`

  console.log('Executando SQLs...')

  const db = pgp(connectionString)
  await db.tx(async t => {
    await t.none(readSqlFile('./er/versao.sql'))
    await t.none(readSqlFile('./er/dominio.sql'))
    await t.none(readSqlFile('./er/dgeo.sql'))
    await t.none(readSqlFile('./er/edicao.sql'))
    await givePermission({ dbUser, connection: t })
    await insertAdminUser(authUserData, t)
  })
}

const handleError = error => {
  if (
    error.message ===
    'Postgres error. Cause: permission denied to create database'
  ) {
    console.log(
      'O usuário informado não é superusuário. Sem permissão para criar bancos de dados.'
        .red
    )
  } else if (
    error.message === 'permission denied to create extension "postgis"'
  ) {
    console.log(
      "O usuário informado não é superusuário. Sem permissão para criar a extensão 'postgis'. Delete o banco de dados criado antes de executar a configuração novamente."
        .red
    )
  } else if (
    error.message.startsWith('Attempted to create a duplicate database')
  ) {
    console.log('O banco já existe.'.red)
  } else if (
    error.message.startsWith('password authentication failed for user')
  ) {
    console.log('Senha inválida para o usuário'.red)
  } else {
    console.log(error.message.red)
    console.log('-------------------------------------------------')
    console.log(error)
  }
  process.exit(0)
}

const getConfigFromUser = options => {
  const questions = []

  if (!options.dbServer) {
    questions.push({
      type: 'input',
      name: 'dbServer',
      message: 'Qual o endereço de IP do servidor do banco de dados PostgreSQL?',
    })
  }
  if (!options.dbPort) {
    questions.push({
      type: 'input',
      name: 'dbPort',
      message: 'Qual a porta do servidor do banco de dados PostgreSQL?',
      default: 5432
    })
  }
  if (!options.dbUser) {
    questions.push({
      type: 'input',
      name: 'dbUser',
      message: 'Qual o nome do usuário do PostgreSQL para interação com o Serviço de Edição (já existente no banco de dados e ser superusuario)?',
    })
  }
  if (!options.dbPassword) {
    questions.push({
      type: 'password',
      name: 'dbPassword',
      mask: '*',
      message: 'Qual a senha do usuário do PostgreSQL para interação com o Serviço de Edição?', 
    })
  }
  if (!options.dbName) {
    questions.push({
      type: 'input',
      name: 'dbName',
      message: 'Qual o nome do banco de dados do Serviço de Edição?',
      default: 'servico_edicao'
    })
  }
  if (!options.port) {
    questions.push({
      type: 'input',
      name: 'port',
      message: 'Qual a porta do servidor do Serviço de Edição?',
      default: 3015
    })
  }
  if (!options.dbCreate) {
    questions.push({
      type: 'confirm',
      name: 'dbCreate',
      message: 'Deseja criar o banco de dados do Serviço de Edição?',
      default: true
    })
  }
  if (!options.authServerRaw) {
    questions.push({
      type: 'input',
      name: 'authServerRaw',
      message:
        'Qual a URL do serviço de autenticação (iniciar com http:// ou https://)?',
    })
  }
  if (!options.authUser) {
    questions.push({
      type: 'input',
      name: 'authUser',
      message: 'Qual o nome do usuário já existente Serviço de Autenticação que será administrador do Serviço de Edição?',
    })
  }
  if (!options.authPassword) {
    questions.push({
      type: 'password',
      name: 'authPassword',
      mask: '*',
      message: 'Qual a senha do usuário já existente Serviço de Autenticação que será administrador do Serviço de Edição?',
    })
  }
  
  if (!options.qgisPath) {
    questions.push({
      type: 'input',
      name: 'qgisPath',
      message: 'Entre com o PATH para o QGIS 3.24',
      default: 'C:\\Program Files\\QGIS 3.24.3'
    })
  }

  if (!options.fePath) {
    questions.push({
      type: 'input',
      name: 'fePath',
      message: 'Entre com o PATH para o bat de execução do Ferramentas de Edição',
      default: 'C:\\Users\\servidor\\AppData\\Roaming\\QGIS\\QGIS3\\profiles\\default\\python\\plugins\\ferramentas_edicao\\setup_env.bat'
    })
  }

  return { questions }
}


const createConfig = async (options) => {
  try {
    console.log('Serviço de Edição'.blue)
    console.log('Criação do arquivo de configuração'.blue)
    
    if (!options.overwriteEnv) {
      const exists = verifyDotEnv()
      if (exists) {
        throw new Error(
          'Arquivo config.env já existe, apague antes de iniciar a configuração.'
        )
      }
    }

    let { questions } = getConfigFromUser(options)
    const {
      port, 
      dbServer, 
      dbPort, 
      dbName, 
      dbUser, 
      dbPassword, 
      dbCreate, 
      authServerRaw, 
      authUser, 
      authPassword,
      fePath,
      qgisPath
    } = await inquirer.prompt(questions).then(async userAnswers => {
      const answers = { ...options, ...userAnswers }
      return answers
    })

    const authServer = authServerRaw.endsWith('/') ? authServerRaw.slice(0, -1) : authServerRaw

    await verifyAuthServer(authServer)

    const { authenticated, authUserData } = await verifyLoginAuthServer(
      authServer,
      authUser,
      authPassword
    )
    
    if (!authenticated) {
      throw new Error('Usuário ou senha inválida no Serviço de Autenticação.')
    }

    if (dbCreate) {
      await createDatabase(
        dbUser,
        dbPassword,
        dbPort,
        dbServer,
        dbName,
        authUserData
      )

      console.log('Banco de dados do Serviço de Edição criado com sucesso!'.blue)
    } else {
      await givePermission({ dbUser, dbPassword, dbPort, dbServer, dbName })

      console.log(`Permissão ao usuário ${dbUser} adicionada com sucesso`.blue)
    }

    createDotEnv(
      port,
      dbServer,
      dbPort,
      dbName,
      dbUser,
      dbPassword,
      authServer,
      fePath,
      qgisPath
    )

    console.log(
      'Arquivo de configuração (config.env) criado com sucesso!'.blue
    )
  } catch (e) {
    handleError(e)
  }
}

program
  .option('-dbServer, --db-server <type>', 'Endereço de IP do servidor do banco de dados PostgreSQL')
  .option('-dbPort, --db-port <type>', 'Porta do servidor do banco de dados PostgreSQL')
  .option('-dbUser, --db-user <type>', 'Usuário do PostgreSQL para interação com o Serviço Edição (já existente no banco de dados e ser superusuario)')
  .option('-dbPassword, --db-password <type>', 'Senha do usuário do PostgreSQL para interação com o Serviço Edição')
  .option('-dbName, --db-name <type>', 'Nome do banco de dados do Serviço Edição')
  .option('-port, --port <type>', 'Porta do servidor do Serviço Edição')
  .option('-dbCreate, --db-create', 'Criar banco de dados do Serviço Edição')
  .option('-authServerRaw, --auth-server-raw <type>', 'URL do serviço de autenticação (iniciar com http:// ou https://)')
  .option('-authUser, --auth-user <type>', 'Nome do usuário já existente Serviço de Autenticação que será administrador do Serviço Edição')
  .option('-authPassword, --auth-password <type>', 'Senha do usuário já existente Serviço de Autenticação que será administrador do Serviço Edição')
  .option('-overwriteEnv, --overwrite-env', 'Sobrescrever arquivo de configuração')
  .option('-qgisPath, --qgis-path', 'PATH para o QGIS 3.24')
  .option('-fePath, --fe-path', 'PATH para o bat de execução do Ferramentas de Edição')


program.parse(process.argv)
const options = program.opts()
createConfig(options)