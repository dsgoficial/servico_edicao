import React from "react";
import { format } from 'date-fns'
import DeleteIcon from '@mui/icons-material/Delete';
import LibraryAddIcon from '@mui/icons-material/LibraryAdd';
import { useSnackbar } from 'notistack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import IconButton from '@mui/material/IconButton';
import { MTableCell } from 'material-table';
import MaterialTable from '../../components/Table';
import CreditNoteDlg from './NotaCreditoDlg'
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import { useAPI } from '../../contexts/apiContext'
import Tooltip from '@mui/material/Tooltip';
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

    const [creditNoteDlg, setCreditNoteDlg] = React.useState({})
    const [hiddenCreateBtn, setHiddenCreateBtn] = React.useState(false)
    const [hiddenAdditionalBtn, setHiddenAdditionalBtn] = React.useState(true)
    const [selectedNCs, setSelectedNCs] = React.useState([])

    const [tooltip, setTooltip] = React.useState(null)



    const handleClose = () => {
        onFetchData()
        setCreditNoteDlg({})
    }

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
                        // {
                        //     icon: CreateIcon,
                        //     tooltip: 'Editar',
                        //     hidden: hiddenCreateBtn,
                        //     onClick: () => setCreditNoteDlg({
                        //         open: true,
                        //         type: 'edit',
                        //         text: 'Editar Nota de Crédito',
                        //     })
                        // },
                        {
                            icon: DeleteIcon,
                            tooltip: 'Remover',
                            onClick: async () => {
                                try {
                                    const data = await deleteNotasCredito(selectedNCs.map(i => i.id))
                                    if (data?.error) {
                                        showSnackbar(data.error.response.data.message, 'error')
                                        return
                                    }
                                    showSnackbar("Removido com sucesso.", "success");
                                    onFetchData()
                                } catch (error) {
                                    console.log(error)
                                    showSnackbar(error.message, 'error')
                                }
                            }
                        },
                        {
                            icon: LibraryAddIcon,
                            tooltip: "Adicionar",
                            isFreeAction: true,
                            onClick: () => setCreditNoteDlg({
                                open: true,
                                type: 'add',
                                text: 'Cadastrar Nota de Crédito'
                            })
                        },
                        {
                            icon: NoteAddIcon,
                            tooltip: 'Complementar',
                            hidden: hiddenAdditionalBtn,
                            onClick: () => setCreditNoteDlg({
                                open: true,
                                type: 'additional',
                                text: 'Complementar Nota de Crédito'
                            })
                        }
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
            < CreditNoteDlg
                {...{
                    open: !!(creditNoteDlg?.open && creditNoteDlg?.type == 'add'),
                    onClose: handleClose,
                    text: creditNoteDlg?.text,
                    type: creditNoteDlg?.type
                }
                }
            />
            < CreditNoteDlg
                {...{
                    open: !!(creditNoteDlg?.open && creditNoteDlg?.type == 'edit'),
                    onClose: handleClose,
                    text: creditNoteDlg?.text,
                    type: creditNoteDlg?.type,
                    selectedNC: creditNoteDlg?.selectedNC
                }
                }
            />
            < CreditNoteDlg
                {...{
                    open: !!(creditNoteDlg?.open && creditNoteDlg?.type == 'additional'),
                    onClose: handleClose,
                    text: creditNoteDlg?.text,
                    type: creditNoteDlg?.type,
                    selectedNC: selectedNCs[0]
                }
                }
            />
        </>
    )
}
