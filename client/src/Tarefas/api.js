import { api } from '../services'

const getTarefas = async () => {
  return api.axiosAll({
    cron: api.getData('/api/tarefas/cron'),
    data: api.getData('/api/tarefas/data')
  })
}


const criaTarefaCron = async (nome, configuracao, parametros, dataInicio, dataFim) => {
  return api.post('/api/tarefas/cron', { nome, configuracao, parametros, data_inicio: dataInicio, data_fim: dataFim })
}

const criaTarefaData = async (nome, configuracao, parametros) => {
  return api.post('/api/tarefas/data', { nome, configuracao, parametros })
}

const deletaTarefaCron = async uuid => {
  return api.delete(`/api/tarefas/cron/${uuid}`)
}

const deletaTarefaData = async uuid => {
  return api.delete(`/api/tarefas/data/${uuid}`)
}

export { getTarefas, criaTarefaCron, criaTarefaData, deletaTarefaCron, deletaTarefaData }
