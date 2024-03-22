import React, { lazy } from 'react';
import { Navigate, useRoutes } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute'

const DashboardLayout = lazy(() => import('./layouts/dashboard'))
const EdicoesPage = lazy(() => import('./pages/Edicoes'))
const ExecutarEdicaoPage = lazy(() => import('./pages/RunEdicao'))
const Login = lazy(() => import('./pages/Login'))

export default function Router() {
  return useRoutes([
    {
      path: '/',
      element: <DashboardLayout />,
      children: [
        { path: '/', element: <PrivateRoute><EdicoesPage /></PrivateRoute> },
        { path: '/executar', element: <PrivateRoute><ExecutarEdicaoPage /></PrivateRoute> }
      ]
    },
    {
      path: '/login',
      children: [{
        path: '/login',
        element: <Login />
      }]
    },
    { path: '*', element: <Navigate to="/" replace /> }
  ]);
}
