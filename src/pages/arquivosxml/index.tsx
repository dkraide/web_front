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
import LoadingModal from "@/components/Modals/LoadingModal"
import IXml from "@/interfaces/IXml"
interface searchProps {
    dateIn: string
    dateFim: string
}

export default function ArquivosXml() {

    const [arquivos, setArquivos] = useState<IXml[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState<searchProps>()
    const [showMovimento, setShowMovimento] = useState(0)
    const [user, setUser] = useState<IUsuario>()
    const { getUser } = useContext(AuthContext)
    const [selected, setSelected] = useState([]);
    const [onDownload, setOnDownload] = useState(false);

    useEffect(() => {
        if (!search) {
            var s = { dateIn: format(startOfMonth(new Date()), 'yyyy-MM-dd'), dateFim: format(endOfMonth(new Date()), 'yyyy-MM-dd') };
            setSearch(s);
            loadData(s);
        }
    }, [])

    const loadData = async (s?: searchProps) => {
        var u: any;
        if (!user) {
            var res = await getUser();
            setUser(res);
            u = res;
        }
        if(!loading){
            setLoading(true);
        }
        await api.get(`/NFCECFEXml/Get?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}&dataIn=${s?.dateIn || search.dateIn}&dataFim=${s?.dateFim || search.dateFim}`)
            .then(({ data }: AxiosResponse<IXml[]>) => {
                setArquivos(data);
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao buscar vendas. ${err.response?.data || err.message}`);
            });
        setLoading(false);
    }

    const columns = [
        {
            name: 'Venda',
            cell: ({ vendaId, idVenda }: IXml) => <a href='#' onClick={() => { setShowMovimento(vendaId) }}>{idVenda|| 0}</a>,
            selector: row => row.idVenda || 0,
            sortable: true,
            grow: 0,
        },
        {
            name: 'Download',
            cell: ({ id, nnf }: IXml) => <CustomButton typeButton={'dark'} onClick={() => {downloadUnico(id, nnf || '0')}}><FontAwesomeIcon icon={faDownload} color={'white'}/></CustomButton>,
            selector: row => row.nnf || '--',
            sortable: true,
            grow: 0,
        },
        {
            name: 'Nnf',
            selector: row => row.nnf  || 0,
            sortable: true,
            grow: 0,
        },
        {
            name: 'Data',
            selector: row => row.dataEmissao || 0,
            cell: row => format(new Date(row.dataEmissao || new Date().toString()), 'dd/MM/yyyy HH:mm'),
            sortable: true,
            grow: 1
        },
        {
            name: 'Valor',
            selector: row => row.vnf || 0,
            cell: row => `R$ ${(row.vnf || 0).toFixed(2)}`,
            sortable: true,
            grow: 0
        },
    ]

    function onSelectChange(data) {
        setSelected(data.selectedRows);
    }
    async function downloadXml(all?: boolean) {
        if (all) {
            if (!arquivos || arquivos.length == 0) {
                toast.error(`Nao ha arquivos para download.`);
                return;
            }
            var files = [];
            arquivos.map(p => files.push(p.id));
            download(files);
            return;
        } else {
            if (!selected || selected.length == 0) {
                toast.error(`Nenhum xml selecionado para download.`);
                return;
            }
            var files = [];
            selected.map(p => {
                files.push(p.xml.id);
            });
            download(files);
        }

    }
    async function download(ids: number[]) {
        setOnDownload(true);
        await api.post(`/NFCECFEXML/DownloadFiles?empresaId=${user.empresaSelecionada}`, ids, { responseType: 'blob' })
            .then(({ data }: AxiosResponse) => {
                toast.success(`Sucesso.`);
                saveAs(data, "arquivos.zip");
            }).catch((err: AxiosError) => {
                toast.error(`erro. ${err.response?.data}  - ${err.message}`)
            });
        setOnDownload(false);
    }
    async function downloadUnico(id: number, nnf: string) {
        setOnDownload(true);
        await api.post(`/NFCECFEXML/DownloadUnico?empresaId=${user.empresaSelecionada}&id=${id}`, undefined, {responseType: 'blob'})
            .then(({ data }: AxiosResponse) => {
                toast.success(`Sucesso.`);
                saveAs(data, `${nnf}.xml`);
            }).catch((err: AxiosError) => {
                toast.error(`erro. ${err.response?.data || 'Info: '}  - ${err.message}`)
            });
        setOnDownload(false);
    }
    
    return (
        <div className={styles.container}>
            <h4>Arquivos XML de Vendas</h4>
            <div className={styles.boxSearch}>
                <InputGroup minWidth={'275px'} type={'date'} value={search?.dateIn || new Date().toString()} onChange={(v) => { setSearch({ ...search, dateIn: v.target.value }) }} title={'Inicio'} width={'20%'} />
                <InputGroup minWidth={'275px'} type={'date'} value={search?.dateFim || new Date().toString()} onChange={(v) => { setSearch({ ...search, dateFim: v.target.value }) }} title={'Final'} width={'20%'} />
                <CustomButton onClick={() => {loadData()}} typeButton={'dark'}>Pesquisar</CustomButton>
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
            {onDownload && <LoadingModal isOpen={onDownload} setClose={() => {}} title={'Baixando arquivos... Esse processo pode ser demorado, aguarde.'}/>}
            {showMovimento > 0 && <Visualizar id={showMovimento} isOpen={showMovimento > 0} user={user} setClose={() => { setShowMovimento(0) }} />}
        </div>
    )
}