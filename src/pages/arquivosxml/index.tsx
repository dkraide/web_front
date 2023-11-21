import IVenda from "@/interfaces/IVenda"
import { useEffect, useState, useContext } from "react"
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { api } from "@/services/apiClient"
import { AxiosError, AxiosResponse } from "axios"
import { toast } from "react-toastify"
import styles from './styles.module.scss'
import CustomTable from "@/components/ui/CustomTable"
import IUsuario from "@/interfaces/IUsuario"
import { AuthContext } from "@/contexts/AuthContext"
import { InputGroup } from "@/components/ui/InputGroup"
import { fGetNumber } from "@/utils/functions"
import Visualizar from "@/components/Modals/Venda/Visualizar"
import VisualizarMovimento from "@/components/Modals/MovimentoCaixa/Visualizar"
import IMovimentoCaixa from "@/interfaces/IMovimentoCaixa"
import CustomButton from "@/components/ui/Buttons"
import { saveAs } from 'file-saver';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faDownload } from "@fortawesome/free-solid-svg-icons"
interface searchProps {
    dateIn: string
    dateFim: string
}
interface xmlProps {
    venda: IVenda
    xml: {
        path: string
        id: number
        pathCancel: string
    }
}

export default function ArquivosXml() {

    const [arquivos, setArquivos] = useState<xmlProps[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState<searchProps>()
    const [showVenda, setShowVenda] = useState(0)
    const [showMovimento, setShowMovimento] = useState(0)
    const [user, setUser] = useState<IUsuario>()
    const { getUser } = useContext(AuthContext)
    const [selected, setSelected] = useState([]);

    useEffect(() => {
        if (!search) {
            setSearch({ dateIn: format(startOfMonth(new Date()), 'yyyy-MM-dd'), dateFim: format(endOfMonth(new Date()), 'yyyy-MM-dd') });
        }
        loadData();
    }, [])

    const loadData = async () => {
        if (!search) {
            return;
        }
        var u: any;
        if (!user) {
            var res = await getUser();
            setUser(res);
            u = res;
        }
        await api.get(`/NFCECFEXml/Get?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}&dataIn=${search.dateIn}&dataFim=${search.dateFim}`)
            .then(({ data }: AxiosResponse<xmlProps[]>) => {
                console.log(data);
                setArquivos(data);
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao buscar vendas. ${err.response?.data || err.message}`);
            });
        setLoading(false);
    }

    const columns = [
        {
            name: 'Venda',
            cell: ({ venda }: xmlProps) => <a href='#' onClick={() => { setShowMovimento(venda.id) }}>{venda.idVenda}</a>,
            selector: row => row.venda.idVenda,
            sortable: true,
            grow: 0,
        },
        {
            name: 'Download',
            cell: ({ venda, xml }: xmlProps) => <CustomButton typeButton={'dark'} onClick={() => {downloadUnico(xml.path, venda.nnf)}}><FontAwesomeIcon icon={faDownload} color={'white'}/></CustomButton>,
            selector: row => row.venda.nnf,
            sortable: true,
            grow: 0,
        },
        {
            name: 'Nnf',
            selector: row => row.venda.nnf,
            sortable: true,
            grow: 0,
        },
        {
            name: 'Data',
            selector: row => row.venda.dataVenda,
            cell: row => format(new Date(row.venda.dataVenda), 'dd/MM/yyyy HH:mm'),
            sortable: true,
            grow: 1
        },
        {
            name: 'Valor',
            selector: row => row.venda.valorTotal,
            cell: row => `R$ ${row.venda.valorTotal.toFixed(2)}`,
            sortable: true,
            grow: 0
        },
    ]

    function onSelectChange(data) {
        console.log(data.selectedRows)
        setSelected(data.selectedRows);
    }
    async function downloadXml(all?: boolean) {
        if (all) {
            if (!arquivos || arquivos.length == 0) {
                toast.error(`Nao ha arquivos para download.`);
                return;
            }
            var files = [];
            arquivos.map(p => files.push(p.xml.path));
            download(files);
            return;
        } else {
            if (!selected || selected.length == 0) {
                toast.error(`Nenhum xml selecionado para download.`);
                return;
            }
            var files = [];
            selected.map(p => {
                files.push(p.xml.path);
            });
            download(files);
        }

    }
    async function download(files: string[]) {
        await api.post(`/NFCECFEXML/DownloadFiles?empresaId=${user.empresaSelecionada}`, files, { responseType: 'blob' })
            .then(({ data }: AxiosResponse) => {
                toast.success(`Sucesso.`);
                saveAs(data, "arquivos.zip");
            }).catch((err: AxiosError) => {
                toast.error(`erro. ${err.response?.data}  - ${err.message}`)
            });
    }
    async function downloadUnico(path: string, nnf: number) {
        await api.post(`/NFCECFEXML/DownloadUnico?empresaId=${user.empresaSelecionada}&Path=${path}`, undefined, {responseType: 'blob'})
            .then(({ data }: AxiosResponse) => {
                toast.success(`Sucesso.`);
                saveAs(data, `${nnf}.xml`);
            }).catch((err: AxiosError) => {
                toast.error(`erro. ${err.response?.data}  - ${err.message}`)
            });
    }

    return (
        <div className={styles.container}>
            <h4>Arquivos XML de Vendas</h4>
            <div className={styles.boxSearch}>
                <InputGroup minWidth={'275px'} type={'date'} value={search?.dateIn || new Date().toString()} onChange={(v) => { setSearch({ ...search, dateIn: v.target.value }) }} title={'Inicio'} width={'20%'} />
                <InputGroup minWidth={'275px'} type={'date'} value={search?.dateFim || new Date().toString()} onChange={(v) => { setSearch({ ...search, dateIn: v.target.value }) }} title={'Final'} width={'20%'} />
                <CustomButton onClick={loadData} typeButton={'dark'}>Pesquisar</CustomButton>
            </div>
            <hr />
            <CustomButton typeButton={'dark'} onClick={() => { downloadXml(false) }}>Download Selecionados</CustomButton>
            <CustomButton style={{ marginLeft: 5 }} typeButton={'dark'} onClick={() => { downloadXml(true) }}>Download Todos</CustomButton>
            <hr />
            <CustomTable
                handleChangeSelected={onSelectChange}
                selectable={true}
                columns={columns}
                data={arquivos}
                loading={loading}
            />
            {showMovimento > 0 && <Visualizar id={showMovimento} isOpen={showMovimento > 0} user={user} setClose={() => { setShowMovimento(0) }} />}
        </div>
    )
}