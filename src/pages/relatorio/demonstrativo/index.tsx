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
import { ExportToExcel } from '@/utils/functions'

interface searchProps {
    dateIn: string
    dateFim: string
    incluiEmHaver: boolean
    calculaCusto: boolean
}
interface relatorioProps {
    forma: string
    quantidade: number
    venda: number
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
            .get(`/Relatorio/FormaPagamento?empresaId=${u.empresaSelecionada}&dataIn=${dataIn || search.dateIn}&dataFim=${dataFim || search.dateFim}`)
            .then(({ data }: AxiosResponse) => {
                setVendas(data);
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao buscar Vendas. ${err.response?.data || err.message}`);
            });
    }

    function getEntradas() {
        var v = _.sumBy(vendas, p => p.venda);
        return v;
    }
    function getSaidas() {

        var des = _.sumBy(despesas, x => x.valorTotal);
        var custoProduto = 0;
        if (search?.calculaCusto) {
            custoProduto = _.sumBy(vendas, p => p.custo);
        }
        return des + custoProduto;
    }
    function getTotal() {
        var e = getEntradas();
        var s = getSaidas();
        return e - s;
    }

    function getData() {
        var res = [];
        res.push({
            razao: 'ENTRADAS',
            entrada: '',
            saida: '',
            fat: ''
        });
        vendas.map((venda) => {
            res.push({
                razao: venda.forma,
                entrada: venda.venda.toFixed(2),
                saida: '',
                fat: getPorcentagem(venda.venda)
            });
        });
        res.push({
            razao: 'DESPESA FIXA',
            entrada: '',
            saida: '',
            fat: ''
        });
        despesas.map((despesa) => {
            if (despesa.tipoDespesa == 'DESPESA FIXA') {
                res.push({
                    razao: despesa.descricao || despesa.motivoLancamento?.nome || 'N/D',
                    entrada: '',
                    saida: despesa.valorTotal.toFixed(2),
                    fat: getPorcentagem(despesa.valorTotal)
                });
            }
        })
        res.push({
            razao: 'DESPESA VARIAVEL',
            entrada: '',
            saida: '',
            fat: ''
        });
        despesas.map((despesa) => {
            if (despesa.tipoDespesa.toUpperCase() == 'DESPESA VARIAVEL') {
                res.push({
                    razao: despesa.descricao || despesa.motivoLancamento?.nome || 'N/D',
                    entrada: '',
                    saida: despesa.valorTotal.toFixed(2),
                    fat: getPorcentagem(despesa.valorTotal)
                });
            }
        });
        res.push({
            razao: 'TAXAS E TRIBUTOS',
            entrada: '',
            saida: '',
            fat: ''
        });
        despesas.map((despesa) => {
            if (despesa.tipoDespesa.toUpperCase() == 'TAXAS E TRIBUTOS') {
                res.push({
                    razao: despesa.descricao || despesa.motivoLancamento?.nome || 'N/D',
                    entrada: '',
                    saida: despesa.valorTotal.toFixed(2),
                    fat: getPorcentagem(despesa.valorTotal)
                });
            }
        })
        res.push({
            razao: 'OUTROS',
            entrada: '',
            saida: '',
            fat: ''
        });
        despesas.map((despesa) => {
            if (despesa.tipoDespesa.toUpperCase() == 'OUTROS') {
                res.push({
                    razao: despesa.descricao || despesa.motivoLancamento?.nome || 'N/D',
                    entrada: '',
                    saida: despesa.valorTotal.toFixed(2),
                    fat: getPorcentagem(despesa.valorTotal)
                });
            }
        })
        res.push({
            razao: 'ENTRADAS',
            entrada: _.sumBy(vendas, v => v.venda).toFixed(2),
            saida: '',
            fat: ''
        });
        res.push({
            razao: 'DESPESA FIXA',
            entrada: '',
            saida: _.sumBy(despesas, v => v.tipoDespesa.toUpperCase() == 'DESPESA FIXA' ? v.valorTotal : 0).toFixed(2),
            fat: getPorcentagem(_.sumBy(despesas, v => v.tipoDespesa.toUpperCase() == 'DESPESA FIXA' ? v.valorTotal : 0) || 0)
        });
        res.push({
            razao: 'DESPESA VARIAVEL',
            entrada: '',
            saida: _.sumBy(despesas, v => v.tipoDespesa.toUpperCase() == 'DESPESA VARIAVEL' ? v.valorTotal : 0).toFixed(2),
            fat: getPorcentagem(_.sumBy(despesas, v => v.tipoDespesa.toUpperCase() == 'DESPESA VARIAVEL' ? v.valorTotal : 0) || 0)
        });
        res.push({
            razao: 'TAXAS E TRIBUTOS',
            entrada: '',
            saida: _.sumBy(despesas, v => v.tipoDespesa.toUpperCase() == 'TAXAS E TRIBUTOS' ? v.valorTotal : 0).toFixed(2),
            fat: getPorcentagem(_.sumBy(despesas, v => v.tipoDespesa.toUpperCase() == 'TAXAS E TRIBUTOS' ? v.valorTotal : 0) || 0)
        });
        res.push({
            razao: 'OUTROS',
            entrada: '',
            saida: _.sumBy(despesas, v => v.tipoDespesa.toUpperCase() == 'OUTROS' ? v.valorTotal : 0).toFixed(2),
            fat: getPorcentagem(_.sumBy(despesas, v => v.tipoDespesa.toUpperCase() == 'OUTROS' ? v.valorTotal : 0) || 0)
        });
        res.push({
            razao: 'RESULTADO',
            entrada: getEntradas().toFixed(2),
            saida: getSaidas().toFixed(2),
            fat: getPorcentagem(_.sumBy(despesas, v => v.valorTotal) || 0)
        });
        return res;
    }
    const headers = [
        { label: "Razão", key: "razao" },
        { label: "Entradas", key: "entrada" },
        { label: "Saidas", key: "saida" },
        { label: "% Fat", key: "fat" },
    ]

    function getPorcentagem(valor: number) {
        var x = getEntradas();
        var porcentagem = (valor / x) * 100;
        return `${porcentagem.toFixed(2)}%`
    }
    return (
        <div className={styles.container}>
            <h4>Demonstrativo de Resultado</h4>
            <div className={styles.box}>
                <SelectSimNao title={'Despesa em Aberta'} width={'20%'} selected={search?.incluiEmHaver} setSelected={(v) => { setSearch({ ...search, incluiEmHaver: v }) }} />
                <InputGroup minWidth={'275px'} type={'date'} value={search?.dateIn} onChange={(v) => { setSearch({ ...search, dateIn: v.target.value }) }} title={'Inicio'} width={'20%'} />
                <InputGroup minWidth={'275px'} type={'date'} value={search?.dateFim} onChange={(v) => { setSearch({ ...search, dateFim: v.target.value }) }} title={'Final'} width={'20%'} />
                <SelectSimNao title={'Calcula Custo Produto'} width={'20%'} selected={search?.calculaCusto} setSelected={(v) => { setSearch({ ...search, calculaCusto: v }) }} />
                <div style={{ width: '100%' }}>
                    <CustomButton onClick={() => { loadData() }} typeButton={'dark'}>Pesquisar</CustomButton>
                    <CustomButton onClick={(v) => {
                        ExportToExcel(headers, getData(), "demonstrativo");
                    }} style={{ marginRight: 10 }} typeButton={'dark'}>Excel</CustomButton>
                </div>
            </div>
            <hr />
            {loading ? <Spinner /> : <div>
                <div className={styles.box}>
                    <BoxInfo style={{ marginRight: 10 }} title={'Entradas'} value={`R$ ${getEntradas().toFixed(2)}`} />
                    <BoxInfo style={{ marginRight: 10 }} title={'Saidas'} value={`R$ ${getSaidas().toFixed(2)}`} />
                    <BoxInfo style={{ marginRight: 10 }} title={'Resultado'} value={`R$ ${getTotal().toFixed(2)}`} />
                </div>
                <div style={{ width: '85%' }}>
                    <table className={"table"}>
                        <thead>
                            <tr>
                                <th style={{ width: '60%' }}>
                                    Razão
                                </th>
                                <th style={{ width: '15%' }}>
                                    Entrada
                                </th>
                                <th style={{ width: '15%' }}>
                                    Saida
                                </th>
                                <th style={{ width: '10%' }}>
                                    % Fat
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className={styles.success}>
                                <td colSpan={4}><b>ENTRADAS</b></td>
                            </tr>
                            {vendas.map((venda) => {
                                return (
                                    <tr className={styles.success}>
                                        <td>{venda.forma}</td>
                                        <td >R$ {venda.venda.toFixed(2)}</td>
                                        <td></td>
                                        <td>{getPorcentagem(venda.venda)}</td>
                                    </tr>
                                )
                            })}


                            <tr className={styles.fixa}>
                                <td colSpan={4}><b>DESPESAS FIXAS</b></td>
                            </tr>
                            {despesas.map((despesa) => {
                                if (despesa.tipoDespesa == 'DESPESA FIXA') {
                                    return (
                                        <tr className={styles.fixa}>
                                            <td>{despesa.descricao || despesa.motivoLancamento?.nome || 'N/D'}</td>
                                            <td></td>
                                            <td>R$ {despesa.valorTotal.toFixed(2)}</td>
                                            <td>{getPorcentagem(despesa.valorTotal)}</td>
                                        </tr>
                                    )
                                }
                                return <></>
                            })}

                            <tr className={styles.variavel}>
                                <td colSpan={4}><b>DESPESAS VARIAVEIS</b></td>
                            </tr>
                            {despesas.map((despesa) => {
                                if (despesa.tipoDespesa.toUpperCase() == 'DESPESA VARIAVEL') {
                                    return (
                                        <tr className={styles.variavel}>
                                            <td>{despesa.descricao || despesa.motivoLancamento?.nome || 'N/D'}</td>
                                            <td></td>
                                            <td>R$ {despesa.valorTotal.toFixed(2)}</td>
                                            <td>{getPorcentagem(despesa.valorTotal)}</td>
                                        </tr>
                                    )
                                }
                                return <></>
                            })}

                            <tr className={styles.taxa}>
                                <td colSpan={4}><b>TAXAS E TRIBUTOS</b></td>
                            </tr>
                            {despesas.map((despesa) => {
                                if (despesa.tipoDespesa.toUpperCase() == 'TAXAS E TRIBUTOS') {
                                    return (
                                        <tr className={styles.taxa}>
                                            <td>{despesa.descricao || despesa.motivoLancamento?.nome || 'N/D'}</td>
                                            <td></td>
                                            <td>R$ {despesa.valorTotal.toFixed(2)}</td>
                                            <td>{getPorcentagem(despesa.valorTotal)}</td>
                                        </tr>
                                    )
                                }
                                return <></>
                            })}
                            <tr className={styles.outro}>
                                <td colSpan={4}><b>OUTRAS DESPESAS</b></td>
                            </tr>
                            {despesas.map((despesa) => {
                                if (despesa.tipoDespesa.toUpperCase() == 'OUTROS') {
                                    return (
                                        <tr className={styles.outro}>
                                           <td>{despesa.descricao ||  despesa.motivoLancamento?.nome || 'N/D'}</td>
                                            <td></td>
                                            <td>R$ {despesa.valorTotal.toFixed(2)}</td>
                                            <td>{getPorcentagem(despesa.valorTotal)}</td>
                                        </tr>
                                    )
                                }
                                return <></>
                            })}
                            <tr className={styles.geral}>
                                <td><b>ENTRADAS</b></td>
                                <td>R$ {_.sumBy(vendas, v => v.venda).toFixed(2)}</td>
                                <td></td>
                                <td></td>
                            </tr>
                            <tr className={styles.geral}>
                                <td><b>DESPESAS FIXAS</b></td>
                                <td></td>
                                <td>R$ {_.sumBy(despesas, v => v.tipoDespesa.toUpperCase() == 'DESPESA FIXA' ? v.valorTotal : 0).toFixed(2)}</td>
                                <td>{getPorcentagem(_.sumBy(despesas, v => v.tipoDespesa.toUpperCase() == 'DESPESA FIXA' ? v.valorTotal : 0) || 0)}</td>
                            </tr>
                            <tr className={styles.geral}>
                                <td><b>DESPESAS VARIAVEIS</b></td>
                                <td></td>
                                <td>R$ {_.sumBy(despesas, v => v.tipoDespesa.toUpperCase() == 'DESPESA VARIAVEL' ? v.valorTotal : 0).toFixed(2)}</td>
                                <td>{getPorcentagem(_.sumBy(despesas, v => v.tipoDespesa.toUpperCase() == 'DESPESA VARIAVEL' ? v.valorTotal : 0) || 0)}</td>
                            </tr>
                            <tr className={styles.geral}>
                                <td><b>TAXAS E TRIBUTOS</b></td>
                                <td></td>
                                <td>R$ {_.sumBy(despesas, v => v.tipoDespesa.toUpperCase() == 'TAXAS E TRIBUTOS' ? v.valorTotal : 0).toFixed(2)}</td>
                                <td>{getPorcentagem(_.sumBy(despesas, v => v.tipoDespesa.toUpperCase() == 'TAXAS E TRIBUTOS' ? v.valorTotal : 0) || 0)}</td>
                            </tr>
                            <tr className={styles.geral}>
                                <td><b>OUTRAS DESPESAS</b></td>
                                <td></td>
                                <td>R$ {_.sumBy(despesas, v => v.tipoDespesa.toUpperCase() == 'OUTROS' ? v.valorTotal : 0).toFixed(2)}</td>
                                <td>{getPorcentagem(_.sumBy(despesas, v => v.tipoDespesa.toUpperCase() == 'OUTROS' ? v.valorTotal : 0) || 0)}</td>
                            </tr>
                            <tr className={styles.geral}>
                                <td><b>RESULTADO</b></td>
                                <td> R$ {getEntradas().toFixed(2)}</td>
                                <td> R$ {getSaidas().toFixed(2)}</td>
                                <td>{getPorcentagem(_.sumBy(despesas, v => v.valorTotal) || 0)}</td>
                            </tr>
                        </tbody>

                    </table>

                </div>
            </div>}
        </div>
    )
}