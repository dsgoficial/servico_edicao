import React, { useState, useEffect } from 'react'
import { withRouter } from 'react-router-dom'
import ViewHeadlineIcon from '@material-ui/icons/ViewHeadline'
import Typography from '@material-ui/core/Typography'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import Button from '@material-ui/core/Button'

import { getExecucao } from './api'
import { MessageSnackBar, MaterialTable } from '../helpers'
import { handleApiError } from '../services'

const ExecucaoAgendada = withRouter(props => {
  const [execucaoCron, setExecucaoCron] = useState([])
  const [execucaoData, setExecucaoData] = useState([])

  const [openLogDialog, setOpenLogDialog] = useState({
    open: false,
    log: ''
  })

  const [snackbar, setSnackbar] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let isCurrent = true
    const load = async () => {
      try {
        const response = await getExecucao()
        if (!response || !isCurrent) return
        setExecucaoCron(response.cron)
        setExecucaoData(response.data)
        setLoaded(true)
      } catch (err) {
        if (!isCurrent) return
        handleApiError(err, setSnackbar)
      }
    }
    load()

    return () => {
      isCurrent = false
    }
  }, [])

  const handleLog = (event, rowData) => {
    setOpenLogDialog({
      open: true,
      log: rowData.log
    })
  }

  const closeLogDialog = () => {
    setOpenLogDialog({
      open: false,
      log: ''
    })
  }

  return (
    <>
      <MaterialTable
        title='Logs de execução - CRON'
        loaded={loaded}
        columns={[
          { title: 'Agendamento UUID', field: 'agendamento_uuid' },
          { title: 'Agendamento', field: 'agendamento' },
          { title: 'Status', field: 'status' },
          { title: 'Data', field: 'data_execucao' },
          { title: 'Tempo', field: 'tempo_execucao' }
        ]}
        data={execucaoCron}
        actions={[
          {
            icon: ViewHeadlineIcon,
            tooltip: 'Log',
            onClick: handleLog
          }
        ]}
        detailPanel={rowData => {
          return (
            <>
            {rowData.sumario ? (
              <div style={{ margin: '15px' }}>
                <Typography variant='h6' gutterBottom>Sumário</Typography>
                {rowData.sumario.map((s, i) => (
                  <p key={i}><b>{s.classes}</b> {s.feicoes}</p>
                ))}
              </div>
            ) : null}
            {rowData.parametros ? (
              <div style={{ margin: '15px' }}>
                <Typography variant='h6' gutterBottom>Parâmetros</Typography>
                {Object.keys(rowData.parametros).map((key, i) => {
                  if(key !== 'LOG_FILE'){
                    return (<p key={i}><b>{key}</b>: {rowData.parametros[key]}</p>)
                  }
                  return null
                }
                )}
              </div>
            ): null }
            </>
          )
        }}
      />
      <MaterialTable
        title='Logs de execução - Data'
        loaded={loaded}
        columns={[
          { title: 'Agendamento UUID', field: 'agendamento_uuid' },
          { title: 'Agendamento', field: 'agendamento' },
          { title: 'Status', field: 'status' },
          { title: 'Data', field: 'data_execucao' },
          { title: 'Tempo', field: 'tempo_execucao' }
        ]}
        data={execucaoData}
        actions={[
          {
            icon: ViewHeadlineIcon,
            tooltip: 'Log',
            onClick: handleLog
          }
        ]}
        detailPanel={rowData => {
          return (
            <>
            {rowData.sumario ? (
              <div style={{ margin: '15px' }}>
                <Typography variant='h6' gutterBottom>Sumário</Typography>
                {rowData.sumario.map((s, i) => (
                  <p key={i}><b>{s.classes}</b> {s.feicoes}</p>
                ))}
              </div>
            ) : null}
            {rowData.parametros ? (
              <div style={{ margin: '15px' }}>
                <Typography variant='h6' gutterBottom>Parâmetros</Typography>
                {Object.keys(rowData.parametros).map((key, i) => {
                  if(key !== 'LOG_FILE'){
                    return (<p key={i}><b>{key}</b>: {rowData.parametros[key]}</p>)
                  }
                  return null
                }
                )}
              </div>
            ): null }
            </>
          )
        }}
      />
      <Dialog open={openLogDialog.open} onClose={closeLogDialog}>
        <DialogTitle>Log de execução</DialogTitle>
        <DialogContent>
        {openLogDialog.log}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeLogDialog} color='primary'>
            OK
          </Button>
        </DialogActions>
      </Dialog>
      {snackbar ? <MessageSnackBar status={snackbar.status} key={snackbar.date} msg={snackbar.msg} /> : null}
    </>
  )
})

export default ExecucaoAgendada