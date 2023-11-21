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
import { fGetNumber, nameof } from "@/utils/functions"
import Visualizar from "@/components/Modals/Venda/Visualizar"
import VisualizarMovimento from "@/components/Modals/MovimentoCaixa/Visualizar"
import IMovimentoCaixa from "@/interfaces/IMovimentoCaixa"
import CustomButton from "@/components/ui/Buttons"
import BoxInfo from "@/components/ui/BoxInfo"
import _ from "lodash"
import { Spinner } from "react-bootstrap"
import { CSVLink } from "react-csv";

interface searchProps {
    dateIn: string
    dateFim: string
}
interface relatorioProps {
    forma: string
    quantidade: number
    venda: number,
    custo: number
}

export default function RelatorioForma() {

    const [result, setResult] = useState<relatorioProps[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState<searchProps>()
    const [user, setUser] = useState<IUsuario>()
    const { getUser } = useContext(AuthContext)

    useEffect(() => {
        if (!search) {
            setSearch({ dateIn: format(startOfMonth(new Date()), 'yyyy-MM-dd'), dateFim: format(endOfMonth(new Date()), 'yyyy-MM-dd') });
        }
        setTimeout(() => {
            loadData();
        }, 1000);
    }, [])

    const loadData = async () => {
        
        var u: any;
        if (!user) {
            var res = await getUser();
            setUser(res);
            u = res;
        }
        if (!loading) {
            setLoading(true);
        }
        var url = '';
        if(!search){
            var dateIn = format(startOfMonth(new Date()), 'yyyy-MM-dd');
            var dateFim = format(endOfMonth(new Date()), 'yyyy-MM-dd');
            url =`/Relatorio/FormaPagamento?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}&dataIn=${dateIn}&dataFim=${dateFim}`
        }else{
            url = `/Relatorio/FormaPagamento?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}&dataIn=${search.dateIn}&dataFim=${search.dateFim}`;
        }
        await api.get(url)
            .then(({ data }: AxiosResponse<relatorioProps[]>) => {
                setResult(data);
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao buscar relatorio. ${err.response?.data || err.message}`);
            });
        setLoading(false);
    }
    function getValue(field: string, prefix?: string) {
        if (!result) {
            return '0';
        }
        return `${prefix} ${_.sumBy(result, field).toFixed(2)}`
    }
    function getHeaders() {
        [
            { label: "Forma de Pagamento", key: "forma" },
            { label: "Quantidade", key: "quantidade" },
            { label: "Venda", key: "venda" },
            { label: "Faturado", key: "faturado" },
            { label: "Custo", key: "custo" }
        ]
    }

    const columns = [
        {
            name: 'Forma de Pagamento',
            selector: row => row.forma,
            sortable: true,
        },
        {
            name: 'Quantidade',
            selector: row => row.quantidade,
            sortable: true,
        },
        {
            name: 'Venda',
            selector: row => row.venda,
            cell: (row) => `R$ ${row.venda.toFixed(2)}`,
            sortable: true,
        },
        {
            name: 'Custo',
            selector: row => row.custo,
            cell: (row) => `R$ ${row.custo.toFixed(2)}`,
            sortable: true,
        },

    ]


    return (
        <div className={styles.container}>
            <h4>Relatorio por Forma de Pagamento</h4>
            <div className={styles.box}>
                <InputGroup minWidth={'275px'} type={'date'} value={search?.dateIn} onChange={(v) => { setSearch({ ...search, dateIn: v.target.value }) }} title={'Inicio'} width={'20%'} />
                <InputGroup minWidth={'275px'} type={'date'} value={search?.dateFim} onChange={(v) => { setSearch({ ...search, dateIn: v.target.value }) }} title={'Final'} width={'20%'} />
                <CustomButton onClick={loadData} typeButton={'dark'}>Pesquisar</CustomButton>
            </div>
            <hr />
            {loading ? <Spinner /> : <div>
                <div className={styles.box}>
                    <BoxInfo style={{ marginRight: 10 }} title={'Quantidade'} value={getValue('quantidade', '')} />
                    <BoxInfo style={{ marginRight: 10 }} title={'Venda'} value={getValue('venda', 'R$')} />
                    <BoxInfo style={{ marginRight: 10 }} title={'Custo'} value={getValue('custo', 'R$')} />
                </div>

                <CustomButton style={{marginBottom: 10}} typeButton={'dark'}><CSVLink style={{ padding: 10 }} data={result} headers={getHeaders()} filename={"relatorioForma.csv"}>
                    Download Planilha
                </CSVLink></CustomButton>
                <CustomTable
                    columns={columns}
                    data={result}
                    loading={loading}
                />
            </div>}
        </div>
    )
}