import { useContext, useEffect, useState } from 'react'
import styles from './styles.module.scss'
import { addDays, endOfMonth, format, startOfMonth } from 'date-fns'
import IUsuario from '@/interfaces/IUsuario'
import { AuthContext } from '@/contexts/AuthContext'
import { AxiosError, AxiosResponse } from 'axios'
import { api } from '@/services/apiClient'
import { toast } from 'react-toastify'
import IDespesa from '@/interfaces/IDespesa'
import IVenda from '@/interfaces/IVenda'
import _ from 'lodash'
import { InputGroup } from '@/components/ui/InputGroup'
import CustomButton from '@/components/ui/Buttons'
import { CSVLink } from "react-csv";
import CustomTable from '@/components/ui/CustomTable'
import { Spinner } from 'react-bootstrap'
import BoxInfo from '@/components/ui/BoxInfo'
import SelectSimNao from '@/components/Selects/SelectSimNao'

interface searchProps {
    dateIn: string
    dateFim: string
    incluiEmHaver: boolean
    calculaCusto: boolean
}
interface relatorioProps {
    dia: string
    quantidade: number
    venda: number,
    faturado: number
    custo: number
}
interface dataProps {
    dia?: string
    descricao?: string
    entrada: number
    saida: number
}

export default function Demonstrativo() {

    const [search, setSearch] = useState<searchProps>()
    const [user, setUser] = useState<IUsuario>()
    const { getUser } = useContext(AuthContext)
    const [loading, setLoading] = useState(true)
    const [despesas, setDespesas] = useState<IDespesa[]>([])
    const [vendas, setVendas] = useState<relatorioProps[]>([])

    useEffect(() => {
        if (!search) {
            var dataIn = format(startOfMonth(new Date()), 'yyyy-MM-dd');
            var dataFim = format(endOfMonth(new Date()), 'yyyy-MM-dd');
            setSearch({ dateIn: dataIn, dateFim: dataFim, incluiEmHaver: false, calculaCusto: false });
            loadData(dataIn, dataFim);
        }
    }, [])

    const loadData = async (dataIn?: string, dataFim?: string) => {
        await loadDespesas(dataIn, dataFim);
        await loadVendasDia(dataIn, dataFim);
        setLoading(false);
    }

    const getUsuario = async () => {
        if (!user) {
            var res = await getUser();
            return res;
        }
        return user;
    }

    const loadDespesas = async (dataIn?: string, dataFim?: string) => {
        var u = await getUsuario();
        const status = search ? (search.incluiEmHaver ? 0 : 3) : 3
        await api
            .get(`/Despesa/List?status=${status}&empresaId=${u.empresaSelecionada}&dataIn=${dataIn || search.dateIn}&dataFim=${dataFim || search.dateFim}`)
            .then(({ data }: AxiosResponse) => {
                setDespesas(data);
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao buscar Despesas. ${err.response?.data || err.message}`);
            });
    }

    const loadVendasDia = async (dataIn?: string, dataFim?: string) => {
        var u = await getUsuario();
        await api
            .get(`/Relatorio/Dia?empresaId=${u.empresaSelecionada}&dataIn=${dataIn || search.dateIn}&dataFim=${dataFim || search.dateFim}`)
            .then(({ data }: AxiosResponse) => {
                setVendas(data);
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao buscar Vendas. ${err.response?.data || err.message}`);
            });
    }

    function getData() {
        var spl = search.dateIn.split('-')
        var dataIn = new Date(Number(spl[0]), Number(spl[1]) - 1, Number(spl[2]));
        console.log(search.dateIn);
        console.log(dataIn);
        var dataFim = new Date(search.dateFim);
        var data = [] as dataProps[];
        while (dataIn <= dataFim) {
            var nextDay = addDays(dataIn, 1);
            var des = _.filter(despesas, (d: IDespesa) => {
                var dia = new Date(d.dataVencimento);
                if (dia >= dataIn && dia < nextDay) {
                    return d;
                }
            });
            var ven = _.filter(vendas, d => {
                var dia = new Date(d.dia);
                if (dia >= dataIn && dia < nextDay) {
                    return d;
                }
            });
            if (des.length == 0 && ven.length == 0) {
                dataIn = nextDay;
                continue;
            }
            data.push({
                dia: format(dataIn, 'dd/MM/yyyy'),
                descricao: '',
                entrada: 0,
                saida: 0
            });
            if (des && des.length > 0) {
                des.map((d: IDespesa) => {
                    data.push({
                        dia: undefined,
                        descricao: (d.motivoLancamento?.nome || d.descricao) + ` ${d.statusLancamento ? '' : '***ABERTO'}`,
                        entrada: 0,
                        saida: d.valorTotal
                    });
                })
            }
            if (ven && ven.length > 0) {
                ven.map((d: relatorioProps) => {
                    data.push({
                        dia: undefined,
                        descricao: 'VENDAS',
                        entrada: d.venda,
                        saida: 0
                    });
                    if(search.calculaCusto){
                        data.push({
                            dia: undefined,
                            descricao: 'CUSTO VENDA',
                            entrada: 0,
                            saida: d.custo
                        });
                    }
                })
            }
            dataIn = nextDay;
        }
        return data;
    }

    function getEntradas(){
          var v = _.sumBy(vendas, p => p.venda);
          return v;
    }
    function getSaidas(){

        var des = _.sumBy(despesas, x => x.valorTotal);
        var custoProduto = 0;
        if(search?.calculaCusto){
            custoProduto = _.sumBy(vendas, p => p.custo);
        }
        return des + custoProduto;
    }
    function getTotal(){
         var e = getEntradas();
         var s = getSaidas();
         return e-s;
    }

    const columns = [
        {
            name: 'Dia',
            selector: row => row.dia,
            sortable: true,
            width: '20%',
        },
        {
            name: 'Descricao',
            selector: row => row.descricao,
            sortable: true,
            width: '60%',
        },
        {
            name: 'Entrada',
            selector: row => row.entrada,
            cell: row => row.entrada == 0 ? '' : `R$ ${row.entrada.toFixed(2)}`,
            sortable: true,
            width: '10%',
        },
        {
            name: 'Saida',
            selector: row => row.saida,
            cell: row => row.saida == 0 ? '' : `R$ ${row.saida.toFixed(2)}`,
            sortable: true,
            width: '10%',
        },
    ]
    const headers = [
        { label: "Dia", key: "dia" },
        { label: "Descricao", key: "descricao" },
        { label: "Entrada", key: "entrada" },
        { label: "Saida", key: "saida" }
    ]

    return (
        <div className={styles.container}>
            <h4>Demonstrativo de Resultado</h4>
            <div className={styles.box}>
                <SelectSimNao title={'Despesa em Aberta'} width={'20%'} selected={search?.incluiEmHaver} setSelected={(v) => {setSearch({...search, incluiEmHaver: v})}}/>
                <InputGroup minWidth={'275px'} type={'date'} value={search?.dateIn} onChange={(v) => { setSearch({ ...search, dateIn: v.target.value }) }} title={'Inicio'} width={'20%'} />
                <InputGroup minWidth={'275px'} type={'date'} value={search?.dateFim} onChange={(v) => { setSearch({ ...search, dateIn: v.target.value }) }} title={'Final'} width={'20%'} />
                <SelectSimNao title={'Calcula Custo Produto'} width={'20%'} selected={search?.calculaCusto} setSelected={(v) => {setSearch({...search, calculaCusto: v})}}/>
                <div style={{width: '100%'}}>
                    <CustomButton onClick={() => {loadData()}} typeButton={'dark'}>Pesquisar</CustomButton>
                </div>
            </div>
            <hr />
            {loading ? <Spinner /> : <div>
                <div className={styles.box}>
                    <BoxInfo style={{ marginRight: 10 }} title={'Entradas'} value={`R$ ${getEntradas().toFixed(2)}`} />
                    <BoxInfo style={{ marginRight: 10 }} title={'Saidas'} value={`R$ ${getSaidas().toFixed(2)}`} />
                    <BoxInfo style={{ marginRight: 10 }} title={'Resultado'} value={`R$ ${getTotal().toFixed(2)}`} />
                </div>

                <CustomButton style={{ marginBottom: 10 }} typeButton={'dark'}><CSVLink style={{ padding: 10 }} data={getData()} headers={headers} filename={"demonstrativo.csv"}>
                    Download Planilha
                </CSVLink></CustomButton>
                <div style={{ width: '70%' }}>
                    <CustomTable
                        columns={columns}
                        pagination={false}
                        data={getData()}
                        loading={loading}
                    />
                </div>
            </div>}
        </div>
    )
}