import React from 'react'
import ThemeProvider from './theme';
import Router from './Routes';
import CssBaseline from '@mui/material/CssBaseline';
import 'typeface-roboto'

const App = () => (
  <ThemeProvider>
    <CssBaseline />
    <Router />
  </ThemeProvider>
)

export default App
