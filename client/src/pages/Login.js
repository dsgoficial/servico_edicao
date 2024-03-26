import React from 'react'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Typography, Container, Avatar, Paper, Box } from '@mui/material';
import TextField from '@mui/material/TextField';
import * as Yup from 'yup'
import { Navigate, Link as RouterLink } from 'react-router-dom'
import Page from '../components/Page';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import BackgroundImages from '../components/BackgroundImages'
import { useAPI } from '../contexts/apiContext'
import { styled } from '@mui/system';
import LoadingButton from '@mui/lab/LoadingButton';

const validationSchema = Yup.object().shape({
    usuario: Yup.string()
        .required('Preencha seu usuário'),
    senha: Yup.string()
        .required('Preencha sua senha')
})

const DivStyled = styled('div')(({ theme }) => ({
    flexGrow: 1,
    height: '100vh',
    overflow: 'auto'
}));

const PaperStyled = styled(Paper)(({ theme }) => ({
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: theme.spacing(3, 2),
    elevation: 3
}));


export default function LoginPage() {
    const {
        handleLogin,
        handleApiError,
        history,
        isAuthenticated
    } = useAPI()

    const { enqueueSnackbar } = useSnackbar();
    const [submitting, setSubmitting] = React.useState(false)

    const handleSubmit = async (values, { resetForm }) => {
        setSubmitting(true)
        try {
            const success = await handleLogin(values.usuario, values.senha)
            setSubmitting(false)
            if (success) history.go('/')
        } catch (err) {
            const error = handleApiError(err)
            console.log(error)
            showSnackbar(error.msg, error.status)
            setSubmitting(false)
        }
    }

    const formik = useFormik({
        initialValues: { usuario: '', senha: '' },
        validationSchema: validationSchema,
        onSubmit: handleSubmit
    });




    const showSnackbar = (message, variant) => {
        // variant could be success, error, warning, info, or default
        enqueueSnackbar(message, { variant });
    };

    if (isAuthenticated()) {
        return <Navigate to="/" replace />;
    }

    return (
        <Page title="Controle Orçamentário">
            <BackgroundImages>
                <DivStyled>
                    <Container component='main' maxWidth='xs'>
                        <PaperStyled>
                            <Avatar sx={{
                                bgcolor: '#F50057'
                            }}>
                                <LockOutlinedIcon />
                            </Avatar>
                            <Typography component='h1' variant='h5'>
                                Controle Orçamentário
                            </Typography>
                            <form onSubmit={formik.handleSubmit}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 2,
                                        p: 2
                                    }}
                                >
                                    <TextField
                                        fullWidth
                                        key={'usuario'}
                                        id={'usuario'}
                                        name={'usuario'}
                                        label={'Usuário'}
                                        value={formik.values['usuario']}
                                        onChange={formik.handleChange}
                                        error={formik.touched['usuario'] && Boolean(formik.errors['usuario'])}
                                        helperText={formik.touched['usuario'] && formik.errors['usuario']}
                                    />
                                    <TextField
                                        fullWidth
                                        key={'senha'}
                                        id={'senha'}
                                        name={'senha'}
                                        type="password"
                                        label={'Senha'}
                                        value={formik.values['senha']}
                                        onChange={formik.handleChange}
                                        error={formik.touched['senha'] && Boolean(formik.errors['senha'])}
                                        helperText={formik.touched['senha'] && formik.errors['senha']}
                                    />
                                    <LoadingButton
                                        type="submit"
                                        color="primary"
                                        variant="contained"
                                        fullWidth
                                        loading={submitting}
                                    >
                                        Login
                                    </LoadingButton>
                                </Box>
                            </form>
                        </PaperStyled>
                    </Container>
                </DivStyled>
            </BackgroundImages>
        </Page>
    );
}