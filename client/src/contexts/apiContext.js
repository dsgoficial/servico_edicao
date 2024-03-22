import { createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import { createBrowserHistory } from 'history'
import { useSnackbar } from 'notistack';
import { useAxios } from './axiosContext';

import { APLICACAO, TOKEN_KEY, USER_AUTHORIZATION_KEY, USER_UUID_KEY } from './settings'

const APIContext = createContext('');

const customHistory = createBrowserHistory()


APIProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default function APIProvider({ children }) {

  // variant could be success, error, warning, info, or default
  const { enqueueSnackbar } = useSnackbar();

  const { callAxios } = useAxios()

  const isAuthenticated = () => {
    return window.localStorage.getItem(TOKEN_KEY) !== null &&
      window.localStorage.getItem(USER_UUID_KEY) !== null &&
      window.localStorage.getItem(USER_AUTHORIZATION_KEY) !== null
  }

  const isAdmin = () => {
    return getAuthorization() === 'ADMIN'
  }

  //const getToken = () => window.localStorage.getItem(TOKEN_KEY)

  const setToken = token => window.localStorage.setItem(TOKEN_KEY, token)

  const logout = () => {
    window.localStorage.removeItem(TOKEN_KEY)
    window.localStorage.removeItem(USER_UUID_KEY)
    window.localStorage.removeItem(USER_AUTHORIZATION_KEY)
  }

  const getAuthorization = () => window.localStorage.getItem(USER_AUTHORIZATION_KEY)

  const setAuthorization = admin => {
    admin ? window.localStorage.setItem(USER_AUTHORIZATION_KEY, 'ADMIN') : window.localStorage.setItem(USER_AUTHORIZATION_KEY, 'USER')
  }

  const getUUID = () => window.localStorage.getItem(USER_UUID_KEY)

  const setUUID = uuid => window.localStorage.setItem(USER_UUID_KEY, uuid)

  const handleError = (error) => {
    if ([401, 403].includes(error.response?.status)) {
      logout()
      customHistory.go('/login')
    }
  }

  const login = async (usuario, senha) => {
    const response = await callAxios(
      '/api/login',
      "POST",
      { usuario, senha, aplicacao: APLICACAO, cliente: 'se' }
    );
    if (response.error) {
      enqueueSnackbar('Usuário e Senha não encontrado!', { variant: 'error' });
      return false
    }
    setToken(response.data.dados.token)
    setAuthorization(response.data.dados.administrador)
    setUUID(response.data.dados.uuid)
    return true
  }

  const signUp = async (usuario, senha, nome, nomeGuerra, tipoPostoGradId, tipoTurnoId) => {
    const response = await callAxios(
      '/api/usuarios',
      "POST",
      {
        usuario,
        senha,
        nome,
        nome_guerra: nomeGuerra,
        tipo_posto_grad_id: tipoPostoGradId,
        tipo_turno_id: tipoTurnoId,
      }
    );
    if (response.error) {
      return false
    }
    return true
  }

  const runEdicao = async (edicao) => {
    const response = await callAxios(
      '/api/execucoes',
      "POST",
      edicao
    );
    if (response.error) {
      handleError(response.error)
      return response
    }
    return response.data
  }

  const getEdicoes = async () => {
    const response = await callAxios(
      '/api/execucoes',
      "GET",
      {}
    );
    if (response.error) {
      handleError(response.error)
      return response
    }
    return response.data
  }

  const getStatus = async (edicaoId) => {
    const response = await callAxios(
      `/api/execucoes/${edicaoId}`,
      "GET",
      {}
    );
    if (response.error) {
      handleError(response.error)
      return response
    }
    return response.data
  }

  return (
    <APIContext.Provider
      value={{
        history: customHistory,
        handleLogin: login,
        logout,
        isAuthenticated,
        getAuthorization,
        isAdmin,
        getUUID,
        signUp,

        runEdicao,
        getEdicoes,
        getStatus
      }}>
      {children}
    </APIContext.Provider>
  );
}

export const useAPI = () => useContext(APIContext)