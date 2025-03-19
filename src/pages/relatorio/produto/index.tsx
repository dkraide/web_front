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
import { ExportToExcel, fGetNumber,  LucroPorcentagem, nameof } from "@/utils/functions"
import Visualizar from "@/components/Modals/Venda/Visualizar"
import VisualizarMovimento from "@/components/Modals/MovimentoCaixa/Visualizar"
import IMovimentoCaixa from "@/interfaces/IMovimentoCaixa"
import CustomButton from "@/components/ui/Buttons"
import BoxInfo from "@/components/ui/BoxInfo"
import _ from "lodash"
import { Spinner } from "react-bootstrap"
import { CSVLink } from "react-csv";
import { GetCurrencyBRL } from "@/utils/functions"
import { isMobile } from 'react-device-detect'
import IProduto from "@/interfaces/IProduto"

interface searchProps {
    dateIn: string
    dateFim: string
    searchStr?: string
}
interface relatorioProps {
    produto: string
    quantidade: number
    venda: number
    custo: number
    quantidadeMediaVenda: number
    quantidadeVendas: number
    obj: IProduto
}

export default function RelatorioProduto() {

    const [result, setResult] = useState<relatorioProps[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState<searchProps>()
    const [user, setUser] = useState<IUsuario>()
    const { getUser } = useContext(AuthContext)

    useEffect(() => {
        if (!search) {
            setSearch({ dateIn: format(startOfMonth(new Date()), 'yyyy-MM-dd'), dateFim: format(endOfMonth(new Date()), 'yyyy-MM-dd'), searchStr: '' });
        }
        setTimeout(() => {
            loadData();
        }, 1000);
    }, []);

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
        if (!search) {
            var dateIn = format(startOfMonth(new Date()), 'yyyy-MM-dd');
            var dateFim = format(endOfMonth(new Date()), 'yyyy-MM-dd');
            url = `/Relatorio/produto?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}&dataIn=${dateIn}&dataFim=${dateFim}`
        } else {
            url = `/Relatorio/produto?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}&dataIn=${search.dateIn}&dataFim=${search.dateFim}`;
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
        if (prefix == 'R$') {
            return GetCurrencyBRL(_.sumBy(result, field));

        } else {
            return `${_.sumBy(result, field)?.toFixed(2)}`
        }
    }
    function getHeaders() {
        return [
            { label: "Grupo", key: "classe" },
            { label: "Produto", key: "produto" },
            { label: "Quantidade", key: "quantidade" },
            { label: "Vendas", key: "quantidadeVendas" },
            { label: "Venda", key: "venda" },
            { label: "Custo", key: "custo" }
        ]
    }

    const getData = () => {
        return result.filter((result) => {
            return result?.produto?.toLowerCase().includes(search?.searchStr?.toLowerCase());
        }).map((p) => {
            return {
                ...p,
                classe: p?.obj?.classeMaterial?.nomeClasse || 'sem classe'
            }
        });
    }

    const columns = [
        {
            name: 'Produto',
            selector: row => row.produto,
            sortable: true,
        },
        {
            name: 'Quantidade',
            selector: row => row.quantidade,
            sortable: true,
        },
        {
            name: 'Vendas',
            selector: row => row.quantidadeVendas,
            sortable: true,
        },
        {
            name: 'Venda',
            selector: row => row.venda,
            cell: (row) => GetCurrencyBRL(row.venda),
            sortable: true,
        },
        {
            name: 'Custo',
            selector: row => row.custo,
            cell: (row) => GetCurrencyBRL(row.custo),
            sortable: true,
        },

    ]

    const Item = (item: relatorioProps) => {
        return(
            <div className={styles.item}>
                    <span className={styles.qtd}>Qtd<br/><b>{item.quantidade}</b></span>
                    <span className={styles.nome}>Produto<br/><b>{item.produto}</b></span>
                    <span className={styles.venda}>Venda<br/><b>{GetCurrencyBRL(item.venda)}</b></span>
                    <span className={styles.venda}>Custo<br/><b>{GetCurrencyBRL(item.custo)}</b></span>
                    <span className={styles.venda}>Margem(R$)<br/><b>{GetCurrencyBRL(item.venda - item.custo)}</b></span>
                    <span className={styles.venda}>Margem(%)<br/><b>{LucroPorcentagem(item.venda, item.custo).toFixed(2)}</b></span>


            </div>
        )
    }


    return (
        <div className={styles.container}>
            <h4>Relatorio por Produto</h4>
            <div className={styles.boxSearch}>
                <InputGroup minWidth={'275px'} type={'date'} value={search?.dateIn} onChange={(v) => { setSearch({ ...search, dateIn: v.target.value }) }} title={'Inicio'} width={'20%'} />
                <InputGroup minWidth={'275px'} type={'date'} value={search?.dateFim} onChange={(v) => { setSearch({ ...search, dateFim: v.target.value }) }} title={'Final'} width={'20%'} />
                <CustomButton onClick={(v) => {
                    ExportToExcel(getHeaders(), getData(), "relatorio_produto");
                }} typeButton={'dark'}>Excel</CustomButton>
                <CustomButton onClick={loadData} typeButton={'dark'}>Pesquisar</CustomButton>
            </div>
            <hr />
            {loading ? <Spinner /> : <div>
                <div className={styles.box}>
                    <BoxInfo style={{ marginRight: 10 }} title={'Quantidade'} value={getValue('quantidade', '')} />
                    <BoxInfo style={{ marginRight: 10 }} title={'Venda'} value={getValue('venda', 'R$')} />
                    <BoxInfo style={{ marginRight: 10 }} title={'Custo'} value={getValue('custo', 'R$')} />
                </div>
                <InputGroup title={'Pesquisar'} value={search.searchStr} onChange={(e) => { setSearch({ ...search, searchStr: e.currentTarget.value }) }} />
                {isMobile ? <>
                     {getData()?.map((item) => Item(item))}
                </> : <>
                    <CustomTable
                        columns={columns}
                        data={getData()}
                        loading={loading}
                    />
                </>}
            </div>}
        </div>
    )
}