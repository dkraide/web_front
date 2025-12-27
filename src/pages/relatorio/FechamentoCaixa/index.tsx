import { useEffect, useState, useContext } from "react"
import { startOfMonth, endOfMonth, format, addHours } from 'date-fns'
import { api } from "@/services/apiClient"
import { AxiosError, AxiosResponse } from "axios"
import { toast } from "react-toastify"
import styles from './styles.module.scss'
import CustomTable from "@/components/ui/CustomTable"
import IUsuario from "@/interfaces/IUsuario"
import { AuthContext } from "@/contexts/AuthContext"
import { InputGroup } from "@/components/ui/InputGroup"
import { ExportToExcel, fGetNumber, fgetDate, nameof } from "@/utils/functions"
import IMovimentoCaixa from "@/interfaces/IMovimentoCaixa"
import CustomButton from "@/components/ui/Buttons"
import _ from "lodash"
import { Spinner } from "react-bootstrap"
import { GetCurrencyBRL } from "@/utils/functions"
import { isMobile } from "react-device-detect"

interface searchProps {
    dateIn: string
    dateFim: string
}
interface relatorioProps {
    caixa: IMovimentoCaixa,
    vendas: {
        venda: {
            forma: string
            valor: number
        }
    }[]
}

export default function FechamentoCaixa() {

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
            url = `/Relatorio/FechamentoCaixa?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}&dataIn=${dateIn}&dataFim=${dateFim}`
        } else {
            url = `/Relatorio/FechamentoCaixa?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}&dataIn=${search.dateIn}&dataFim=${search.dateFim}`;
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
    function getHeaders() {
        var c = [
            { label: "Caixa", key: "id" },
            { label: "Status", key: "status" },
            { label: "Abertura", key: "dataMovimento" },
            { label: "Fechamento", key: "dataFechamento" },
            { label: "Abertura (R$)", key: "valorDinheiro" },
            { label: "Sangrias", key: "valorSangria" }
        ];

        var pagamentos = getFormas();
        pagamentos.map((p) => {
            c.push({
                label: p,
                key: p
            });
        });
        c.push({
            label: 'Fechamento (R$)',
            key: 'valorDinheiroFinal'
        });
        c.push({
            label: 'Diferenca',
            key: 'diferenca'
        });
        return c;
    }

    function getFormas() {
        var arrayPagamentos = [];
        result.map((caixa) => {
            caixa.vendas.map((formas) => {
                var f = formas.venda.forma;
                var ind = _.findIndex(arrayPagamentos, p => p == f);
                if (ind == -1) {
                    arrayPagamentos.push(f);
                }
            });
        });
        return arrayPagamentos;
    }

    function buildColumns() {
        var c = columns;
        var pagamentos = getFormas();
        pagamentos.map((p) => {
            c.push({
                name: p,
                selector: row => row[p],
                cell: row => GetCurrencyBRL(row[p]),
                sortable: true
            });
        });
        c.push({
            name: 'Fechamento (R$)',
            selector: row => row.valorDinheiroFinal,
            cell: row => row.status ? GetCurrencyBRL(row.valorDinheiroFinal) : '--',
            sortable: true
        });
        c.push({
            name: 'Diferenca',
            selector: row => row.diferenca,
            cell: row => GetCurrencyBRL(row.diferenca),
            sortable: true
        });
        return c;
    }

    function buildData() {
        var pagamentos = getFormas();
        var res = [];
        result.map((p) => {
            var obj = p.caixa as any;
            obj.valorSangria = _.sumBy(p.caixa.sangrias, pp => pp.isSangria ? pp.valorMovimento : 0);
            obj.status = p.caixa.status ? 'FECHADO' : 'ABERTO';
            var dinheiro = 0;
            pagamentos.map((pagamento) => {
                var index = _.findIndex(p.vendas, pp => pp.venda.forma == pagamento);
                if (index < 0) {
                    obj[pagamento] = 0;
                } else {
                    if (pagamento.toString().toLowerCase().includes('dinheiro')) {
                        dinheiro += p.vendas[index].venda.valor;
                    }
                    obj[pagamento] = p.vendas[index].venda.valor
                }
            });

            var resultado = p.caixa.valorDinheiro + dinheiro - obj.valorSangria;
            obj.diferenca = p.caixa.status ? Number((p.caixa.valorDinheiroFinal - resultado).toFixed(2)) : 0;
            res.push(obj);
        })
        return res;
    }


    const columns = [
        {
            name: 'Caixa',
            selector: row => row.id,
            cell: row => row.id,
            sortable: true,
        },
        {
            name: 'Status',
            selector: (row: IMovimentoCaixa) => row.status,
            cell: (row: IMovimentoCaixa) => row.status,
            sortable: true,
        },
        {
            name: 'Abertura',
            selector: (row: IMovimentoCaixa) => row.dataMovimento,
            cell: (row: IMovimentoCaixa) => format(new Date(row.dataMovimento), 'dd/MM/yyyy'),
            sortable: true,
        },
        {
            name: 'Fechamento',
            selector: (row: IMovimentoCaixa) => row.dataFechamento,
            cell: (row: IMovimentoCaixa) => format(new Date(row.dataFechamento), 'dd/MM/yyyy'),
            sortable: true,
        },
        {
            name: 'Abertura (R$)',
            selector: row => row.valorDinheiro,
            cell: (row: IMovimentoCaixa) => GetCurrencyBRL(row.valorDinheiro),
            sortable: true,
        },
        {
            name: 'Sangrias',
            selector: row => row.valorSangria,
            cell: (row) => GetCurrencyBRL(row.valorSangria || 0),
            sortable: true,
        },
    ]


    if (loading) {
        return <div className={styles.loading}>Carregando...</div>;
    }
    const Item = (item) => {
        return (
            <div key={item.id} className={styles.item}>
                <span className={styles.w15}>Nro<br /><b>{item.idMovimentoCaixa}</b></span>
                <span className={styles.w30}>Abertura<br /><b>{format(new Date(item.dataMovimento), 'dd/MM/yy HH:mm')}</b></span>
                <span className={styles.w30}>Fechamento<br /><b>{format(new Date(item.dataFechamento), 'dd/MM/yy HH:mm')}</b></span>
                <span className={styles.w20}>Diferenca<br /><b>{GetCurrencyBRL(item.diferenca)}</b></span>
                <span className={styles.w15}>Sangria<br /><b>{GetCurrencyBRL(item.valorSangria)}</b></span>
                <span className={styles.w30}>Abertura<br /><b>{GetCurrencyBRL(item.valorDinheiro)}</b></span>
                <span className={styles.w30}>Fechamento<br /><b>{GetCurrencyBRL(item.valorDinheiroFinal)}</b></span>
            </div>
        )

    }

    return (
        <div className={styles.container}>
            <h4>Relatorio de Fechamento</h4>
            <div className={styles.boxSearch}>
                <InputGroup minWidth={'275px'} type={'date'} value={search?.dateIn} onChange={(v) => { setSearch({ ...search, dateIn: v.target.value }) }} title={'Inicio'} width={'20%'} />
                <InputGroup minWidth={'275px'} type={'date'} value={search?.dateFim} onChange={(v) => { setSearch({ ...search, dateFim: v.target.value }) }} title={'Final'} width={'20%'} />
                <CustomButton onClick={(v) => {
                    ExportToExcel(getHeaders(), buildData(), "fechamento");
                }} typeButton={'dark'}>Excel</CustomButton>
                <CustomButton onClick={loadData} typeButton={'dark'}>Pesquisar</CustomButton>
            </div>
            {isMobile ? <>
                {buildData()?.map((item) => Item(item))}
            </> : <>
                <CustomTable
                    columns={buildColumns()}
                    data={buildData()}
                    loading={loading}
                />
            </>}
        </div>
    )
}