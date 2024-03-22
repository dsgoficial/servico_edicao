import React from 'react'
import {
    Box,
} from '@mui/material';
import Page from '../components/Page';
import { EdicoesTable } from '../sections/@edicao'
import { useAPI } from '../contexts/apiContext'


export default function Edicoes() {


    const [edicoes, setEdicoes] = React.useState([])

    const {
        getEdicoes
    } = useAPI()

    const fetch = async () => {
        let res = await getEdicoes()
        setEdicoes(res?.dados)
    }

    React.useEffect(() => {
        fetch()
    }, [])

    return (
        <Page title="Serviço de Edição">
            <Box
                sx={{
                    padding: '15px'
                }}
            >
                <EdicoesTable {...{ edicoes, onFetchData: fetch }} />
            </Box>
        </Page>
    );
}