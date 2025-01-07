import { useEffect, useState, useContext } from "react"
import { startOfMonth, endOfMonth, format, addYears } from 'date-fns'
import { api } from "@/services/apiClient"
import { AxiosError, AxiosResponse } from "axios"
import { toast } from "react-toastify"
import styles from './styles.module.scss'
import CustomTable from "@/components/ui/CustomTable"
import IUsuario from "@/interfaces/IUsuario"
import { AuthContext } from "@/contexts/AuthContext"
import { InputGroup } from "@/components/ui/InputGroup"
import CustomButton from "@/components/ui/Buttons"
import BoxInfo from "@/components/ui/BoxInfo"
import _ from "lodash"
import { Spinner } from "react-bootstrap"
import { CSVLink } from "react-csv";
import { BarChart, Bar, Rectangle, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, LineChart, Line } from 'recharts';
import { fGetDate, getMonths, } from "@/utils/functions"
import { GetCurrencyBRL } from "@/utils/functions"
import { isMobile } from 'react-device-detect'


interface searchProps {
    dateIn: string
    dateFim: string
}
interface relatorioProps {
    vendas: {
        data: string,
        valor: number,
    }[],
    despesas: {
        data: string,
        valor: number,
    }[]
}

export default function VendaCusto() {

    const [result, setResult] = useState<relatorioProps>({} as relatorioProps)
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState<searchProps>()
    const [user, setUser] = useState<IUsuario>()
    const { getUser } = useContext(AuthContext)

    useEffect(() => {
        if (!search) {
            setSearch({ dateIn: format(addYears(new Date(), -1), 'yyyy-MM-01'), dateFim: format(endOfMonth(new Date()), 'yyyy-MM-dd') });
        }
        setTimeout(() => {
            loadData();
        }, 1000);
    }, [])
    function getHeaders() {
        [
            { label: "Mes", key: "data" },
            { label: "Valor", key: "valor" },
        ]
    }
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
            var dateIn = format(addYears(new Date(), -1), 'yyyy-MM-01');
            var dateFim = format(endOfMonth(new Date()), 'yyyy-MM-dd');
            url = `/Relatorio/VendaCusto?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}&dataIn=${dateIn}&dataFim=${dateFim}`;
        } else {
            url = `/Relatorio/VendaCusto?empresaId=${user?.empresaSelecionada || u.empresaSelecionada}&dataIn=${search.dateIn}&dataFim=${search.dateFim}`;
        }
        await api.get(url)
            .then(({ data }: AxiosResponse<relatorioProps>) => {
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
        var valor = 0;
        if (field == "venda") {
            valor = _.sumBy(result.vendas, p => p.valor)
        } else if (field == "lucro") {
            var v = _.sumBy(result.vendas, p => p.valor)
            var d = _.sumBy(result.despesas, p => p.valor)
            valor = v - d;
        }
        else {
            valor = _.sumBy(result.despesas, p => p.valor)

        }
        if (!prefix) {
            return valor;
        }else{
            return GetCurrencyBRL(valor)
        }
    }
    function getDataDia() {
        //primeiro passo pegar cada mes entre o intervalo de data;
        var d1 = fGetDate(search.dateIn);
        var array = [];
        var months = getMonths(d1, new Date(search.dateFim));
        months.map((month) => {
            var venda = 0;
            var despesa = 0;
            var i = _.findIndex(result.vendas, p => p.data == month);
            if (i >= 0) {
                venda = result.vendas[i].valor;
            }
            i = _.findIndex(result.despesas, p => p.data == month);
            if (i >= 0) {
                despesa = result.despesas[i].valor;
            }
            array.push({
                name: month,
                venda,
                despesa,
                lucro: venda - despesa,
                lucroP: ((venda - despesa) / venda) * 100,
            });
        })
        return array;
    }
    function chartVendaDespesa() {

        var despesa = Number(getValue("despesa", undefined))
        var venda = Number(getValue("venda", undefined))
        var res = [];
        res.push({
            name: 'Despesa',
            value: Number(despesa.toFixed(2)),
            fill: 'var(--main)',
        })
        res.push({
            name: 'Venda',
            value: Number(venda.toFixed(2)),
            fill: 'var(--green)',
        })
        return res;
    }
    function chartMesLucro() {
        var com = 0;
        var sem = 0;
        var d1 = fGetDate(search.dateIn);
        var months = getMonths(d1, new Date(search.dateFim));
        months.map((month) => {
            var venda = 0;
            var despesa = 0;
            var i = _.findIndex(result.vendas, p => p.data == month);
            if (i >= 0) {
                venda = result.vendas[i].valor;
            }
            i = _.findIndex(result.despesas, p => p.data == month);
            if (i >= 0) {
                despesa = result.despesas[i].valor;
            }
            if ((venda - despesa) > 0) {
                com++;
            } else {
                sem++;
            }

        })

        var res = [];
        res.push({
            name: 'Com',
            value: com,
            fill: 'var(--green)',
        })
        res.push({
            name: 'Sem',
            value: sem,
            fill: 'var(--main)',
        })
        return res;

    }
    return (
        <div className={styles.container}>
            <h4>Relatorio de Vendas e Custos</h4>
            <div className={styles.boxSearch}>
                <InputGroup minWidth={'275px'} type={'date'} value={search?.dateIn} onChange={(v) => { setSearch({ ...search, dateIn: v.target.value }) }} title={'Inicio'} width={'20%'} />
                <InputGroup minWidth={'275px'} type={'date'} value={search?.dateFim} onChange={(v) => { setSearch({ ...search, dateFim: v.target.value }) }} title={'Final'} width={'20%'} />
                <CustomButton typeButton={'dark'}><CSVLink data={result?.vendas || []} headers={getHeaders()} filename={"relatorioMes.csv"}>
                Download Planilha
            </CSVLink></CustomButton>
                <CustomButton onClick={loadData} typeButton={'dark'}>Pesquisar</CustomButton>
            </div>
            <hr />
            {loading ? <Spinner /> : <div>
                <div className={styles.box}>
                    <BoxInfo style={{ marginRight: 10 }} title={'Venda'} value={getValue('venda', 'R$').toString()} />
                    <BoxInfo style={{ marginRight: 10 }} title={'Despesas'} value={getValue('despesa', 'R$').toString()} />
                    <BoxInfo style={{ marginRight: 10 }} title={'Lucro'} value={getValue('lucro', 'R$').toString()} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', width: '100%', justifyContent: isMobile ? 'center' : 'flex-start'}}>
                    <div style={{ width:  isMobile ? '100%' : -'35%', minWidth: '350px', padding: '5px' }}>
                        <div className={"krd-card"} >
                            <h4 className={"krd-card-title"}>Relação Venda/Despesa</h4>
                            <PieChart height={200} width={200} >
                                <Pie
                                    dataKey="value"
                                    isAnimationActive={true}
                                    data={chartVendaDespesa()}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={50}
                                    fill="#8884d8"
                                    label
                                />
                                <Tooltip formatter={(value, name) => <>{GetCurrencyBRL((value.valueOf() as number))}</>} />
                            </PieChart>
                        </div>
                    </div>
                    <div style={{ width:  isMobile ? '100%' : '35%', minWidth: '350px', padding: '5px' }}>
                        <div className={"krd-card"} >
                            <h4 className={"krd-card-title"}>Relação Meses Com/Sem Lucro</h4>
                            <PieChart height={200} width={200} >
                                <Pie
                                    dataKey="value"
                                    isAnimationActive={true}
                                    data={chartMesLucro()}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={50}
                                    fill="#8884d8"
                                    label
                                />
                                <Tooltip />
                            </PieChart>
                        </div>
                    </div>
                    <div className={"krd-card"} style={{ width: '100%' }}>
                        <h4 className={"krd-card-title"}>Relatorio de vendas por dia</h4>
                        <ResponsiveContainer height={250} width={'100%'}>
                            <LineChart height={150} data={getDataDia()}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value, name) => <>{GetCurrencyBRL(value.valueOf() as number)}</>} />
                                <Legend />
                                <Line type="monotone" dataKey="venda" name={"Venda (R$)"} stroke="var(--green)" strokeWidth={3} />
                                <Line type="monotone" dataKey="despesa" name={"Despesa (R$)"} stroke="var(--main)" strokeWidth={3} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ width: isMobile ? '100%' :  '50%', minWidth: '350px', padding: '5px' }}>
                        <div className={"krd-card"} >
                            <h4 className={"krd-card-title"}>Relatorio de lucro (R$)</h4>
                            <ResponsiveContainer height={250} width={'100%'}>
                                <LineChart height={150} data={getDataDia()}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip formatter={(value, name) => <>{GetCurrencyBRL(value.valueOf() as number)}</>} />
                                    <Legend />
                                    <Line type="monotone" dataKey="lucro" name={"Lucro (R$)"} stroke="var(--green)" strokeWidth={3} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div style={{ width: isMobile ? '100%' : '50%', minWidth: '350px', padding: '5px' }}>
                        <div className={"krd-card"} >
                            <h4 className={"krd-card-title"}>Relatorio de lucro (%)</h4>
                            <ResponsiveContainer height={250} width={'100%'}>
                                <LineChart height={150} data={getDataDia()}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip formatter={(value, name) => <>{(value.valueOf() as number).toFixed(2)} %</>} />
                                    <Legend />
                                    <Line type="monotone" dataKey="lucroP" name={"Lucro (%)"} stroke="var(--main)" strokeWidth={3} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>
            </div>}
        </div>
    )
}