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
import { ExportToExcel, fGetNumber, nameof } from "@/utils/functions"
import CustomButton from "@/components/ui/Buttons"
import BoxInfo from "@/components/ui/BoxInfo"
import _ from "lodash"
import { Spinner } from "react-bootstrap"
import IProduto from "@/interfaces/IProduto"
import SelectClasseMaterial from "@/components/Selects/SelectClasseMaterial"
import { GetCurrencyBRL } from "@/utils/functions"
import { isMobile } from "react-device-detect"

interface searchProps {
    dateIn: string
    dateFim: string
    classeId: number
}
interface relatorioProps {
    produto: IProduto
    entrada: number
    saida: number
}

export default function RelatorioEstoque() {

    const [result, setResult] = useState<relatorioProps[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState<searchProps>()
    const [user, setUser] = useState<IUsuario>()
    const { getUser } = useContext(AuthContext)

    useEffect(() => {
        if (!search) {
            setSearch({ dateIn: format(startOfMonth(new Date()), 'yyyy-MM-dd'), dateFim: format(endOfMonth(new Date()), 'yyyy-MM-dd'), classeId: 0 });
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
        if (!search) {
            var dateIn = format(startOfMonth(new Date()), 'yyyy-MM-dd');
            var dateFim = format(endOfMonth(new Date()), 'yyyy-MM-dd');
            url = `/Relatorio/estoque?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}&dataIn=${dateIn}&dataFim=${dateFim}`
        } else {
            url = `/Relatorio/estoque?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}&dataIn=${search.dateIn}&dataFim=${search.dateFim}`;
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
            return `${_.sumBy(result, field).toFixed(2)}`
        }
    }
    function getHeaders() {
        return [
            { label: "Produto", key: "produto" },
            { label: "Estoque", key: "estoque" },
            { label: "Entrada", key: "entrada" },
            { label: "Saida", key: "saida" },
            { label: "Resultado", key: "resultado" }
        ]
    }

    const columns = [
        {
            name: 'Cod',
            selector: row => row.produto.cod,
            sortable: true,
            width: '10%'
        },
        {
            name: 'Produto',
            selector: row => row.produto.nome,
            sortable: true,
        },
        {
            name: 'Estoque',
            selector: row => row.produto.quantidade.toFixed(2),
            sortable: true,
        },
        {
            name: 'Entrada',
            selector: row => row.entrada,
            cell: (row) => `${row.entrada.toFixed(2)}`,
            sortable: true,
        },
        {
            name: 'Saida',
            selector: row => row.saida,
            cell: (row) => `${row.saida.toFixed(2)}`,
            sortable: true,
        },
        {
            name: 'Resultado',
            selector: row => (row.produto.quantidade - row.entrada + row.saida),
            cell: (row) => `${(row.produto.quantidade - row.entrada + row.saida).toFixed(2)}`,
            sortable: true,
        },

    ]

    const getData = (isExcel) => {
        if (isExcel) {
            var r = result.map((p) => {
                return {
                    produto: p.produto.nome,
                    estoque: p.produto.quantidade,
                    entrada: p.entrada,
                    saida: p.saida,
                    resultado: p.produto.quantidade - p.entrada + p.saida
                }
            });
            return r;
        }
        return result;
    }

    const Item = (item: relatorioProps) => {
        return (
            <div className={styles.item}>
                <span className={styles.qtd}>Qtd<br /><b>{item.produto?.cod}</b></span>
                <span className={styles.nome}>Produto<br /><b>{item.produto?.nome}</b></span>
                <span className={styles.qtd}>Estoque<br /><b>{item.produto?.quantidade}</b></span>
                <span className={styles.qtd}>Entrada<br /><b>{item.entrada}</b></span>
                <span className={styles.qtd}>Saida<br /><b>{item.saida}</b></span>
            </div>
        )
    }


    return (
        <div className={styles.container}>
            <h4>Relatorio de estoque</h4>
            <div className={styles.boxSearch}>
                <InputGroup minWidth={'275px'} type={'date'} value={search?.dateIn} onChange={(v) => { setSearch({ ...search, dateIn: v.target.value }) }} title={'Inicio'} width={'20%'} />
                <InputGroup minWidth={'275px'} type={'date'} value={search?.dateFim} onChange={(v) => { setSearch({ ...search, dateFim: v.target.value }) }} title={'Final'} width={'20%'} />
                <SelectClasseMaterial width={isMobile ? '100%' : '350px'} selected={search?.classeId} setSelected={(v) => { setSearch({ ...search, classeId: v }) }} />
                <CustomButton style={{ marginTop: 10 }} onClick={loadData} typeButton={'dark'}>Pesquisar</CustomButton>
                <CustomButton onClick={(v) => {
                    ExportToExcel(getHeaders(), getData(true), "relatorio_estoque");
                }} style={{ marginTop: 10 }} typeButton={'dark'}>Excel</CustomButton>
            </div>
            <hr />
            {loading ? <Spinner /> : <div>
                <div className={styles.box}>
                    <BoxInfo style={{ marginRight: 10 }} title={'Entrada'} value={getValue('entrada', '')} />
                    <BoxInfo style={{ marginRight: 10 }} title={'Saida'} value={getValue('saida', '')} />
                </div>

                {isMobile ? <>
                    {result?.map((item) => Item(item))}
                </> : <>
                    <CustomTable
                        columns={columns}
                        data={result}
                        loading={loading}
                    />
                </>}
            </div>}
        </div>
    )
}