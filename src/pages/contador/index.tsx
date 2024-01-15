import { CanSSRContador } from '@/utils/CanSSRContador';
import styles from './styles.module.scss';
import { InputGroup } from '@/components/ui/InputGroup';
import { useContext, useEffect, useState } from 'react';
import CustomButton from '@/components/ui/Buttons';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import SelectSimNao from '@/components/Selects/SelectSimNao';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { AxiosError, AxiosResponse } from 'axios';
import IVenda from '@/interfaces/IVenda';
import { AuthContext } from '@/contexts/AuthContext';
import IUsuario from '@/interfaces/IUsuario';
import { toast } from 'react-toastify';
import saveAs from 'file-saver';
import { api } from '@/services/apiClient';
import CustomTable from '@/components/ui/CustomTable';
import _ from 'lodash';


interface searchProps {
    dateIn: string
    dateFim: string
    searchString: string
    includeCancelamento: boolean
}
interface xmlProps {
    venda: IVenda
    xml: {
        path: string
        id: number
        pathCancel: string
    }
}


export default function Contador() {

    const [search, setSearch] = useState<searchProps>()
    const [onDownload, setOnDownload] = useState(false);
    const [selected, setSelected] = useState([]);
    const [arquivos, setArquivos] = useState<xmlProps[]>([])
    const [user, setUser] = useState<IUsuario>()
    const { getUser } = useContext(AuthContext)
    const [loading, setLoading] = useState(true)
    const columns = [
        {
            name: 'Nnf',
            selector: row => row.venda.nnf,
            sortable: true,
            width: '10%'
        },
        {
            name: 'Download',
            cell: ({ venda, xml }: xmlProps) => <CustomButton typeButton={'dark'} onClick={() => { downloadUnico(xml.id, venda.nnf) }}><FontAwesomeIcon icon={faDownload} color={'white'} /></CustomButton>,
            selector: row => row.venda.nnf,
            sortable: true,
            width: '10%'
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
            width: '20%'
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
            arquivos.map(p => files.push(p.xml.id));
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
    async function downloadUnico(id: number, nnf: number) {
        setOnDownload(true);
        await api.post(`/NFCECFEXML/DownloadUnico?empresaId=${user.empresaSelecionada}&id=${id}`, undefined, { responseType: 'blob' })
            .then(({ data }: AxiosResponse) => {
                toast.success(`Sucesso.`);
                saveAs(data, `${nnf}.xml`);
            }).catch((err: AxiosError) => {
                toast.error(`erro. ${err.response?.data || 'Info: '}  - ${err.message}`)
            });
        setOnDownload(false);
    }

    function filter() {
        var files = [];
        var res = arquivos?.map((arquivo) => {
            var str = arquivo.venda.nnf.toString() + arquivo.venda.dataVenda.toString() + arquivo.venda.valorTotal.toString() + "R$";
            if (str.toUpperCase().includes(search.searchString.toUpperCase())) {
                files.push(arquivo);
            }
        })
        return files;
    }


    useEffect(() => {
        if (!search) {
            var s = { searchString: '', includeCancelamento: false, dateIn: format(startOfMonth(new Date()), 'yyyy-MM-dd'), dateFim: format(endOfMonth(new Date()), 'yyyy-MM-dd') };
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
        await api.get(`/NFCECFEXml/Get?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}&dataIn=${s.dateIn || search.dateIn}&dataFim=${s.dateFim || search.dateFim}`)
            .then(({ data }: AxiosResponse<xmlProps[]>) => {
                setArquivos(data);
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao buscar vendas. ${err.response?.data || err.message}`);
            });
        setLoading(false);
    }
    return (
        <div className={styles.container}>

            <div className={[styles.card, styles.w50, styles.middle, styles.row, styles.spaceBetween].join(' ')}>
                <InputGroup minWidth={'200px'} type={'date'} value={search?.dateIn} onChange={(v) => { setSearch({ ...search, dateIn: v.target.value }) }} title={'Inicio'} width={'20%'} />
                <InputGroup minWidth={'200px'} type={'date'} value={search?.dateFim} onChange={(v) => { setSearch({ ...search, dateIn: v.target.value }) }} title={'Final'} width={'20%'} />
                {/* <SelectSimNao title={'Inclui Canc.'} width={'20%'} selected={search?.includeCancelamento || false} setSelected={(v) => {setSearch({...search, includeCancelamento: v})}} /> */}
                <CustomButton style={{ height: '50px' }} onClick={() => {loadData()}} typeButton={'dark'}>Pesquisar</CustomButton>
            </div>
            <div className={[styles.row, styles.spaceAround].join(' ')}>
                <div className={[styles.card, styles.w30, styles.cardInfo].join(' ')}>
                    <h3>{arquivos.length}</h3>
                    <span>Cupons emitidos</span>
                </div>
                <div className={[styles.card, styles.w30, styles.cardInfo].join(' ')}>
                    <h3>R$ {_.sumBy(arquivos, p => p.venda.valorTotal).toFixed(2)}</h3>
                    <span>Totais</span>
                </div>
            </div>
            <div className={[styles.card, styles.w100].join(' ')}>
                <CustomButton typeButton={'dark'} onClick={() => { downloadXml(false) }}>Download Selecionados</CustomButton>
                <CustomButton style={{ marginLeft: 5 }} typeButton={'dark'} onClick={() => { downloadXml(true) }}>Download Todos</CustomButton>
                <hr />
                <InputGroup title={'Pesquisar'} value={search?.searchString} onChange={(v) => { setSearch({ ...search, searchString: v.target.value }) }} />
                <CustomTable
                    handleChangeSelected={onSelectChange}
                    selectable={true}
                    columns={columns}
                    data={filter()}
                    loading={loading}
                />


            </div>
        </div>
    )
}


export const getServerSideProps = CanSSRContador(async (ctx) => {
    return {
        props: {

        }
    }
})