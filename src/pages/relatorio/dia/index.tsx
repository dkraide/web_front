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
import { GetCurrencyBRL, LucroPorcentagem, fGetNumber, fgetDate, isMobile, nameof } from "@/utils/functions"
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
    dia: string
    quantidade: number
    venda: number,
    faturado: number
    custo: number
}

export default function RelatorioDia() {

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
        }, 500);
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
            url = `/Relatorio/Dia?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}&dataIn=${dateIn}&dataFim=${dateFim}`
        } else {
            url = `/Relatorio/Dia?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}&dataIn=${search.dateIn}&dataFim=${search.dateFim}`;
        }
        await api.get(url)
            .then(({ data }: AxiosResponse<relatorioProps[]>) => {
                setResult(data);
                console.log(data);
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
        [
            { label: "Dia", key: "dia" },
            { label: "Quantidade", key: "quantidade" },
            { label: "Venda", key: "venda" },
            { label: "Faturado", key: "faturado" },
            { label: "Custo", key: "custo" }
        ]
    }


    const columns = [
        {
            name: 'Dia',
            selector: row => row.dia,
            cell: row => format(fgetDate(row.dia), 'dd/MM/yyyy'),
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
            cell: (row) => GetCurrencyBRL(row.venda),
            sortable: true,
        },
        {
            name: 'Faturado',
            selector: row => row.faturado,
            cell: (row) => GetCurrencyBRL(row.faturado),
            sortable: true,
        },
        {
            name: 'Custo',
            selector: row => row.custo,
            cell: (row) => GetCurrencyBRL(row.custo),
            sortable: true,
        },
        {
            name: 'Lucro (R$)',
            selector: row => row.venda - row.custo,
            cell: (row) => GetCurrencyBRL(row.venda - row.custo),
            sortable: true,
        },
        {
            name: 'Lucro (%)',
            selector: row => row.venda - row.custo,
            cell: (row) => `${(((row.venda - row.custo) / row.venda) * 100).toFixed(2)} %`,
            sortable: true,
        },

    ]

    const Item = (item: relatorioProps) => {
        return(
            <div key={item.dia} className={styles.item}>
                 <span className={styles.qtd}>Qtd<br/><b>{item.quantidade}</b></span>
                 <span className={styles.nome}>Dia<br/><b>{format(new Date(item.dia), 'dd/MM/yy')}</b></span>
                 <span className={styles.venda}>Venda<br/><b>{GetCurrencyBRL(item.venda)}</b></span>
                 <span className={styles.custo}>Custo<br/><b>{GetCurrencyBRL(item.custo)}</b></span>
                 <span className={styles.media}>Media<br/><b>{GetCurrencyBRL(item.venda / item.quantidade)}</b></span>
                 <span className={styles.venda}>Margem (R$)<br/><b>{GetCurrencyBRL(item.venda - item.custo)}</b></span>
                 <span className={styles.venda}>Margem (%)<br/><b>{LucroPorcentagem(item.venda, item.custo).toFixed(2)}</b></span>


            </div>
        )
    }


    return (
        <div className={styles.container}>
            <h4>Relatorio por Dia</h4>
            <div className={styles.box}>
                <InputGroup minWidth={'275px'} type={'date'} value={search?.dateIn} onChange={(v) => { setSearch({ ...search, dateIn: v.target.value }) }} title={'Inicio'} width={'20%'} />
                <InputGroup minWidth={'275px'} type={'date'} value={search?.dateFim} onChange={(v) => { setSearch({ ...search, dateFim: v.target.value }) }} title={'Final'} width={'20%'} />
                <CustomButton style={{ marginBottom: 10 }} typeButton={'dark'}><CSVLink  data={result} headers={getHeaders()} filename={"relatorioDia.csv"}>
                    Download Planilha
                </CSVLink></CustomButton>
                <CustomButton onClick={loadData} typeButton={'dark'}>Pesquisar</CustomButton>
            </div>
            {loading ? <Spinner /> : <div>
                <div className={styles.box}>
                    <BoxInfo style={{ marginRight: 10, width: isMobile ? '45%' : 'auto' }} title={'Quantidade'} value={getValue('quantidade', '')} />
                    <BoxInfo style={{ marginRight: 10, width: isMobile ? '45%' : 'auto'  }} title={'Venda'} value={getValue('venda', 'R$')} />
                    <BoxInfo style={{ marginRight: 10, width: isMobile ? '45%' : 'auto'  }} title={'Faturado'} value={getValue('faturado', 'R$')} />
                    <BoxInfo style={{ marginRight: 10, width: isMobile ? '45%' : 'auto'  }} title={'Custo'} value={getValue('custo', 'R$')} />
                </div>
                 {isMobile  ?<>
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