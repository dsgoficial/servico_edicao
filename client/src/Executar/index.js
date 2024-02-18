import React, { useState, useEffect } from 'react'
import { withRouter, Link } from 'react-router-dom'
import { Formik, Form, Field } from 'formik'
import { TextField, Select } from 'formik-material-ui'
import Typography from '@material-ui/core/Typography'
import Container from '@material-ui/core/Container'
import Paper from '@material-ui/core/Paper'
import ReactLoading from 'react-loading'
import MenuItem from '@material-ui/core/MenuItem'
import LinkMui from '@material-ui/core/Link'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import Button from '@material-ui/core/Button'
import Backdrop from '@material-ui/core/Backdrop'

import { MessageSnackBar, SubmitButton } from '../helpers'
import styles from './styles'
import validationSchema from './validation_schema'
import { handleExecute } from './api'
import { handleApiError } from '../services'

const ExecutarRotina  = withRouter(props => {
  const classes = styles()

  const initialValues = {
    tipo: '',
    login: '',
    senha: '',
    proxyHost: '',
    proxyPort: '',
    proxyUser: '',
    proxyPassword: '',
    exportTiff: false,
  };

  const [resultDialog, setResultDialog] = useState({
    open: false,
    log: '',
    sumario: []
  })
  const [snackbar, setSnackbar] = useState('')

  const handleForm = async (values, { resetForm }) => {
    try {
      const result = await handleExecute(
        values
      )
      if (result) {
        resetForm(initialValues)
        if (result.status === 'Erro') {
          return setSnackbar({ status: 'error', msg: 'Erro na execução da exportação', date: new Date() })
        }
        setSnackbar({ status: 'success', msg: 'Exportação executada com sucesso', date: new Date() })
        setResultDialog({ open: true, log: result.log, sumario: result.sumario })
      }
    } catch (err) {
      resetForm(initialValues)
      handleApiError(err, setSnackbar)
    }
  }

  const closeLogDialog = () => {
    setResultDialog({
      open: false,
      log: '',
      sumario: []
    })
  }

  const handleFileChange = (e, setFieldValue) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const jsonContent = JSON.parse(e.target.result);
        setFieldValue('json', jsonContent);
      };
      reader.readAsText(file);
    }
  };

  return (
    <>
        <Container maxWidth='sm'>
          <Paper className={classes.paper}>
            <div className={classes.formArea}>
                <>
                  <Typography variant='h5'>
                    Executar
                  </Typography>
                  <Formik
                    initialValues={initialValues}
                    validationSchema={validationSchema}
                    onSubmit={handleForm}
                  >
                    {({ values, isValid, isSubmitting, isValidating, setFieldValue }) => (
                      <>
                        <Backdrop className={classes.backdrop} open={isSubmitting}>
                          <ReactLoading type='spin' color='#147814' height='7%' width='7%' />
                        </Backdrop>
                        <Form className={classes.form}>
                          <FormControl fullWidth margin="normal" variant="outlined">
                            <InputLabel htmlFor="json-file">JSON File</InputLabel>
                            <input
                              id="json-file"
                              name="json"
                              type="file"
                              accept="application/json"
                              onChange={(e) => handleFileChange(e, setFieldValue)}
                              style={{ display: 'none' }}
                            />
                            <Button variant="contained" component="label" htmlFor="json-file">
                              Upload JSON
                            </Button>
                          </FormControl>
                          <Field
                            component={Select}
                            name="tipo"
                            label="Tipo"
                            variant="outlined"
                            displayEmpty
                            className={classes.select}
                            input={<Field component={TextField} />}
                          >
                            <MenuItem disabled value="">
                              Selecione o tipo
                            </MenuItem>
                            <MenuItem value="Carta Topográfica 1.3">Carta Topográfica 1.3</MenuItem>
                            <MenuItem value="Carta Ortoimagem 2.4">Carta Ortoimagem 2.4</MenuItem>
                          </Field>
                          <Field
                            component={TextField}
                            name="login"
                            type="text"
                            label="Login"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                          />
                          <Field
                            component={TextField}
                            name="senha"
                            type="password"
                            label="Senha"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                          />
                          <Field
                            component={TextField}
                            name="proxyHost"
                            type="text"
                            label="Proxy Host"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                          />
                          <Field
                            component={TextField}
                            name="proxyPort"
                            type="number"
                            label="Proxy Port"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                          />
                          <Field
                            component={TextField}
                            name="proxyUser"
                            type="text"
                            label="Proxy User"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                          />
                          <Field
                            component={TextField}
                            name="proxyPassword"
                            type="password"
                            label="Proxy Password"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                          />
                          <div className={classes.checkboxField}>
                            <Field
                              type="checkbox"
                              name="exportTiff"
                              as={TextField}
                              select
                              SelectProps={{
                                native: true,
                              }}
                              helperText="Exportar como TIFF?"
                              variant="outlined"
                              fullWidth
                            >
                              <option value="true">Sim</option>
                              <option value="false">Não</option>
                            </Field>
                          </div>
                          <SubmitButton
                            type='submit' disabled={isValidating || !isValid} submitting={isSubmitting}
                            fullWidth
                            variant='contained'
                            color='primary'
                            className={classes.submit}
                          >
                            Executar
                          </SubmitButton>
                        </Form>
                      </>
                    )}
                  </Formik>
                </>
            </div>
          </Paper>
        </Container>
      <Dialog open={resultDialog.open} onClose={closeLogDialog}>
        <DialogTitle>Sumário execução</DialogTitle>
        <DialogContent>
          <div style={{ margin: '15px' }}>
            <Typography variant='h6' gutterBottom>Sumário</Typography>
            {resultDialog.sumario.map((s, i) => (
              <p key={i}><b>{s.classes}</b> {s.feicoes}</p>
            ))}
          </div>
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

export default ExecutarRotina