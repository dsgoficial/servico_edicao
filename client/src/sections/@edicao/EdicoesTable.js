import React from "react";
import { format } from 'date-fns'
import DeleteIcon from '@mui/icons-material/Delete';
import LibraryAddIcon from '@mui/icons-material/LibraryAdd';
import { useSnackbar } from 'notistack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import IconButton from '@mui/material/IconButton';
import MaterialTable from '../../components/Table';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import { useAPI } from '../../contexts/apiContext'
import CollectionsIcon from '@mui/icons-material/Collections';

export default function EdicoesTable({
    edicoes,
    onFetchData
}) {


    const {
        deleteNotasCredito
    } = useAPI()

    const { enqueueSnackbar } = useSnackbar();

    const showSnackbar = (message, variant) => {
        // variant could be success, error, warning, info, or default
        enqueueSnackbar(message, { variant });
    };

    const [hiddenCreateBtn, setHiddenCreateBtn] = React.useState(false)
    const [hiddenAdditionalBtn, setHiddenAdditionalBtn] = React.useState(true)
    const [selectedNCs, setSelectedNCs] = React.useState([])

    const getOptionIcon = (key, callback) => {
        return {
            'pdf': (
                <IconButton
                    key={key}
                    onClick={callback}
                >
                    <PictureAsPdfIcon />
                </IconButton>
            ),
            'geotiff': (
                <IconButton
                    key={key}
                    onClick={callback}
                >
                    <CollectionsIcon />
                </IconButton>
            )
        }[key]
    }

    return (
        <>
            <MaterialTable
                title='Edições'
                loaded
                columns={[
                    {
                        title: 'UUID', field: 'uuid'
                    },
                    {
                        title: 'Data Execução', field: 'data_execucao', render: rowData => format(new Date(rowData.data_execucao), "dd/MM/yy")
                    },

                    {
                        title: 'Status', field: 'status'
                    },

                    {
                        title: 'Opções', field: '', render: rowData => {
                            if (!rowData?.sumario) return null
                            return (
                                <>
                                    {
                                        Object.keys(rowData.sumario).map((key, idx) => {
                                            return getOptionIcon(
                                                key,
                                                () => window.open(`${rowData.sumario[key]}`, '_blank').focus()
                                            )
                                        })
                                    }
                                </>
                            )
                        }
                    }
                ]}
                data={edicoes}
                actions={
                    [
                       
                    ]}
                options={{
                    selection: true
                }}
                onSelectionChange={(rows) => {
                    setSelectedNCs(rows)
                    if (rows.length > 1) {
                        setHiddenCreateBtn(true)
                        setHiddenAdditionalBtn(true)
                        return
                    }
                    setHiddenCreateBtn(false)
                    setHiddenAdditionalBtn(false)
                }}
            />
        </>
    )
}
