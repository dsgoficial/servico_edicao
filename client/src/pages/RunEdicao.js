import * as React from 'react';
import Page from '../components/Page';
import Slide from '@mui/material/Slide';
import Box from '@mui/material/Box';
import { useFormik } from 'formik';
import * as yup from 'yup';
import TextField from '@mui/material/TextField';
import { useSnackbar } from 'notistack';
import LoadingButton from '@mui/lab/LoadingButton';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Alert from '@mui/material/Alert';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

import { useAPI } from '../contexts/apiContext'

const pdfContentType = 'application/pdf';

const validationSchema = yup.object({
    tipo: yup.string()
        .required('Preencha'),
    login: yup.string()
        .required('Preencha'),
    senha: yup.string()
        .required('Preencha'),
    proxyHost: yup.string(),
    proxyPort: yup.string(),
    proxyUser: yup.string(),
    proxyPassword: yup.string(),
    exportTiff: yup.boolean(),
    json: yup.string()
        .required('Preencha')

});

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default function CreditNoteDlg() {

    const {
        runEdicao,
        getStatus
    } = useAPI()

    const { enqueueSnackbar } = useSnackbar();

    const showSnackbar = (message, variant) => {
        // variant could be success, error, warning, info, or default
        enqueueSnackbar(message, { variant });
    };

    const uploadInputRef = React.useRef(null);
    const [submitting, setSubmitting] = React.useState(false)
    const [loadingJSON, setLoadingJSON] = React.useState(false)
    const [currentJSONName, setCurrentJSONName] = React.useState('')
    const [currentEdicaoId, setCurrentEdicaoId] = React.useState('')
    const contentType = 'application/json';


    const handleCreate = async (values, { resetForm }) => {
        setSubmitting(true)
        console.log(values)
        console.log(Object.entries(values).filter(([_, v]) => v != ""))
        try {
            const data = await runEdicao({
                ...Object.fromEntries(Object.entries(values).filter(([_, v]) => v !== "")),
                json: JSON.parse(values.json),
                tipo: getTipos()[values.tipo]
            })
            if (data?.error) {
                showSnackbar(data.error.response.data.message, 'error')
                setSubmitting(false)
                return
            }
            setCurrentEdicaoId(data?.dados.job_uuid)
            showSnackbar(data?.message, "success")
            // resetForm(formik.initialValues);
        } catch (error) {
            console.log(error)
            showSnackbar(error.message, 'error')
            setSubmitting(false);
            // resetForm(formik.initialValues);
        }
    }

    const getFieldLabel = (field) => {
        return {
            tipo: 'Tipo',
            login: 'Login',
            senha: 'Senha',
            proxyHost: 'Proxy Host',
            proxyPort: 'Proxy Port',
            proxyUser: 'Proxy User',
            proxyPassword: 'Proxy Password',
            exportTiff: 'Export Tiff',
            json: 'JSON'
        }[field]
    }

    const formik = useFormik({
        initialValues: {
            tipo: '',
            login: '',
            senha: '',
            proxyHost: '',
            proxyPort: '',
            proxyUser: '',
            proxyPassword: '',
            exportTiff: false,
            json: '',
        },
        validationSchema: validationSchema,
        onSubmit: handleCreate
    });


    const getTipos = () => {
        return [
            "Carta Topográfica 1.3",
            "Carta Topográfica 1.4",
            "Carta Ortoimagem 2.4",
            "Carta Ortoimagem 2.5",
            "Carta Ortoimagem OM 1.0",
            "Carta Ortoimagem Militar 2.4",
            "Carta Ortoimagem Militar 2.5",
            "Carta Topográfica Militar 1.3",
            "Carta Topográfica Militar 1.4"
        ]
    }

    React.useEffect(() => {
        if (!currentEdicaoId) return

        const verifyStatus = async () => {
            const res = await getStatus(currentEdicaoId)
            if (res.dados?.status_id == 1) {
                //showSnackbar('Aguarde, está em execução!', "info")
                return
            }
            if (res.dados?.status_id == 2) {
                showSnackbar('Executado com sucesso, verifique a tabela de edições!', "success")
            } else {
                showSnackbar('Erro ao executar a edição, verifique com o administrador!', 'error')
            }
            setCurrentEdicaoId(null)
            setSubmitting(false)
        }

        const interval = setInterval(() => {
            verifyStatus()
        }, 1000 * 30);
        return () => clearInterval(interval);
    }, [currentEdicaoId]);

    React.useEffect(() => {
        const elem = document.getElementById("inputFile");
        elem.addEventListener("change", (event) => {
            setLoadingJSON(true)
            var selectedFile = document.getElementById("inputFile").files;
            if (selectedFile.length > 0) {
                var fileToLoad = selectedFile[0];
                setCurrentJSONName(fileToLoad.name)
                var fileReader = new FileReader();
                fileReader.onload = function (event) {
                    formik.setFieldValue("json", event.target.result);
                };
                fileReader.readAsText(fileToLoad);
            }
            setLoadingJSON(false)
        });

    }, [])

    return (
        <Page title="Serviço de Edição">
            <Box
                sx={{
                    padding: '12px',
                    display: 'flex',
                    width: '100%',
                    justifyContent: 'center',
                    gap: 2
                }}
            >
                <Box>
                    <Box
                        sx={{
                            display: 'flex',
                            width: '500px',
                            flexDirection: 'column',
                            paddingTop: '100px',
                            paddingRight: 1.7,
                            '& > :not(style)': {
                                m: 1
                            },
                        }}
                    >
                        {
                            Object.keys(validationSchema.fields).map(n => {
                                if (n == 'exportTiff') {
                                    return (
                                        <FormControlLabel key={n} control={<Checkbox
                                            id={n}
                                            name={n}
                                            checked={formik.values[n]}
                                            onChange={formik.handleChange}

                                        />} label={getFieldLabel(n)} />
                                    )
                                }
                                if (n == 'tipo') {
                                    return (
                                        <FormControl
                                            key={n}
                                            sx={{
                                                width: '100%'
                                            }}
                                        >
                                            <InputLabel>{getFieldLabel(n)}</InputLabel>
                                            <Select
                                                id={n}
                                                name={n}
                                                value={formik.values[n]}
                                                label={n}
                                                onChange={formik.handleChange}
                                                error={formik.touched[n] && Boolean(formik.errors[n])}
                                            >
                                                {
                                                    getTipos().map((t, idx) => {
                                                        return (
                                                            <MenuItem key={t} value={idx}>{t}</MenuItem>
                                                        )
                                                    })
                                                }
                                            </Select>
                                        </FormControl>
                                    )
                                }
                                if (n == 'senha') {
                                    return (
                                        <TextField
                                            fullWidth
                                            key={n}
                                            id={n}
                                            name={n}
                                            type="password"
                                            label={getFieldLabel(n)}
                                            value={formik.values[n]}
                                            onChange={formik.handleChange}
                                            error={formik.touched[n] && Boolean(formik.errors[n])}
                                            helperText={formik.touched[n] && formik.errors[n]}
                                        />
                                    )
                                }
                                if (n == 'json') {
                                    return (
                                        <Box
                                            key={n}
                                            id={n}
                                            sx={{
                                                width: '100%',
                                                display: 'flex',
                                                gap: 2
                                            }}
                                        >
                                            <input
                                                ref={uploadInputRef}
                                                id="inputFile"
                                                type="file"
                                                accept='application/json'
                                                style={{ display: "none" }}
                                                name="file"
                                            />
                                            <LoadingButton
                                                onClick={() => uploadInputRef.current && uploadInputRef.current.click()}
                                                variant="contained"
                                                loading={loadingJSON}
                                                disabled={submitting}
                                            >
                                                Selecionar
                                            </LoadingButton>
                                            <TextField
                                                key={n}
                                                fullWidth
                                                id={n}
                                                name={n}
                                                label={getFieldLabel(n)}
                                                value={currentJSONName}
                                                error={formik.touched[n] && Boolean(formik.errors[n])}
                                                helperText={formik.touched[n] && formik.errors[n]}
                                                disabled
                                                inputProps={
                                                    { readOnly: true }
                                                }
                                            />
                                        </Box>
                                    )
                                }
                                return (
                                    <TextField
                                        key={n}
                                        fullWidth
                                        id={n}
                                        name={n}
                                        label={getFieldLabel(n)}
                                        value={formik.values[n]}
                                        onChange={formik.handleChange}
                                        error={formik.touched[n] && Boolean(formik.errors[n])}
                                        helperText={formik.touched[n] && formik.errors[n]}
                                    />
                                )
                            })
                        }
                        {
                            submitting &&
                            <Alert severity="info">Aguarde, está em execução...</Alert>
                        }
                        <LoadingButton
                            color="primary"
                            variant="contained"
                            fullWidth
                            loading={submitting}
                            onClick={() => {
                                formik.handleSubmit()
                            }}
                        >
                            Executar Edição
                        </LoadingButton>
                    </Box>
                </Box>


            </Box>
        </Page>
    );
}
