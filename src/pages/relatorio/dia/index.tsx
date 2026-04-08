import { useEffect, useState, useContext, useMemo } from "react"
import { startOfMonth, endOfMonth, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfYear, endOfYear, format } from 'date-fns'
import { api } from "@/services/apiClient"
import { AxiosError, AxiosResponse } from "axios"
import { toast } from "react-toastify"
import styles from './styles.module.scss'
import KRDTable, { KRDColumn } from "@/components/ui/KRDTable"
import IUsuario from "@/interfaces/IUsuario"
import { AuthContext } from "@/contexts/AuthContext"
import { InputGroup } from "@/components/ui/InputGroup"
import { GetCurrencyBRL, LucroPorcentagem, fgetDate } from "@/utils/functions"
import CustomButton from "@/components/ui/Buttons"
import _ from "lodash"
import { Spinner } from "react-bootstrap"
import { CSVLink } from "react-csv"
import { isMobile } from "react-device-detect"
import {
    BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid
} from "recharts"

type PeriodType = 'hoje' | 'semana' | 'mes' | 'ano' | 'personalizado'

interface SearchProps {
    dateIn: string
    dateFim: string
    period: PeriodType
}

interface RelatorioProps {
    dia: string
    quantidade: number
    venda: number
    faturado: number
    custo: number
}

const PERIOD_OPTIONS: { label: string; value: PeriodType }[] = [
    { label: 'Hoje', value: 'hoje' },
    { label: 'Esta semana', value: 'semana' },
    { label: 'Este mês', value: 'mes' },
    { label: 'Este ano', value: 'ano' },
    { label: 'Personalizado', value: 'personalizado' },
]

function getDateRange(period: PeriodType) {
    const now = new Date()
    const fmt = (d: Date) => format(d, 'yyyy-MM-dd')
    switch (period) {
        case 'hoje': return { dateIn: fmt(startOfDay(now)), dateFim: fmt(endOfDay(now)) }
        case 'semana': return { dateIn: fmt(startOfWeek(now, { weekStartsOn: 0 })), dateFim: fmt(endOfWeek(now, { weekStartsOn: 0 })) }
        case 'mes': return { dateIn: fmt(startOfMonth(now)), dateFim: fmt(endOfMonth(now)) }
        case 'ano': return { dateIn: fmt(startOfYear(now)), dateFim: fmt(endOfYear(now)) }
        default: return { dateIn: fmt(startOfMonth(now)), dateFim: fmt(endOfMonth(now)) }
    }
}

const CSV_HEADERS = [
    { label: "Dia", key: "dia" },
    { label: "Quantidade", key: "quantidade" },
    { label: "Venda", key: "venda" },
    { label: "Faturado", key: "faturado" },
    { label: "Custo", key: "custo" },
]

export default function RelatorioDia() {
    const { getUser } = useContext(AuthContext)

    const [result, setResult] = useState<RelatorioProps[]>([])
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<IUsuario>()
    const [search, setSearch] = useState<SearchProps>({
        ...getDateRange('mes'),
        period: 'mes',
    })

    useEffect(() => { loadData() }, [])

    const loadData = async (overrideDates?: { dateIn: string; dateFim: string }) => {
        const dateIn = overrideDates?.dateIn ?? search.dateIn
        const dateFim = overrideDates?.dateFim ?? search.dateFim
        let u = user
        if (!u) {
            const res = await getUser()
            setUser(res)
            u = res
        }
        setLoading(true)
        try {
            const { data } = await api.get<RelatorioProps[]>(
                `/Relatorio/Dia?empresaId=${u.empresaSelecionada}&dataIn=${dateIn}&dataFim=${dateFim}`
            )
            setResult(data)
        } catch (err) {
            const e = err as AxiosError
            toast.error(`Erro ao buscar relatório. ${e.response?.data || e.message}`)
        } finally {
            setLoading(false)
        }
    }

    function handlePeriod(period: PeriodType) {
        if (period === 'personalizado') {
            setSearch(prev => ({ ...prev, period }))
            return
        }
        setSearch(prev => ({ ...prev, period, ...getDateRange(period) }))
        const range = getDateRange(period)
        setSearch(prev => ({ ...prev, period, ...range }))
        loadData(range) // <-- passa as datas novas direto
    }


    const totalQtd = _.sumBy(result, 'quantidade')
    const totalVenda = _.sumBy(result, 'venda')
    const totalFaturado = _.sumBy(result, 'faturado')
    const totalCusto = _.sumBy(result, 'custo')
    const totalMargem = totalVenda - totalCusto
    const totalMargemPct = totalVenda > 0 ? (totalMargem / totalVenda) * 100 : 0

    const chartData = useMemo(() =>
        result.map(r => ({
            name: format(fgetDate(r.dia), 'dd/MM'),
            Venda: r.venda,
            Faturado: r.faturado,
        })), [result])

    const columns: KRDColumn<RelatorioProps>[] = [
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
            cell: row => GetCurrencyBRL(row.venda),
            sortable: true,
            right: true,
        },
        {
            name: 'Faturado',
            selector: row => row.faturado,
            cell: row => GetCurrencyBRL(row.faturado),
            sortable: true,
            right: true,
        },
        {
            name: 'Custo',
            selector: row => row.custo,
            cell: row => GetCurrencyBRL(row.custo),
            sortable: true,
            right: true,
        },
        {
            name: 'Ticket médio',
            selector: row => row.quantidade > 0 ? row.venda / row.quantidade : 0,
            cell: row => GetCurrencyBRL(row.quantidade > 0 ? row.venda / row.quantidade : 0),
            sortable: true,
            right: true,
        },
        {
            name: 'Margem R$',
            selector: row => row.venda - row.custo,
            cell: row => GetCurrencyBRL(row.venda - row.custo),
            sortable: true,
            right: true,
        },
        {
            name: 'Margem %',
            selector: row => LucroPorcentagem(row.venda, row.custo),
            cell: row => {
                const pct = LucroPorcentagem(row.venda, row.custo)
                return (
                    <span className={pct >= 0 ? styles.badgeSuccess : styles.badgeDanger}>
                        {pct.toFixed(1)}%
                    </span>
                )
            },
            sortable: true,
            right: true,
        },
    ]

    const MobileItem = (item: RelatorioProps) => {
        const margem = item.venda - item.custo
        const margemPct = LucroPorcentagem(item.venda, item.custo)
        return (
            <div key={item.dia} className={styles.mobileItem}>
                <div className={styles.mobileItemHeader}>
                    <span className={styles.mobileDia}>{format(fgetDate(item.dia), 'dd/MM/yyyy')}</span>
                    <span className={margemPct >= 0 ? styles.badgeSuccess : styles.badgeDanger}>
                        {margemPct.toFixed(1)}%
                    </span>
                </div>
                <div className={styles.mobileItemBody}>
                    <div className={styles.mobileField}><span>Qtd</span><b>{item.quantidade}</b></div>
                    <div className={styles.mobileField}><span>Venda</span><b>{GetCurrencyBRL(item.venda)}</b></div>
                    <div className={styles.mobileField}><span>Faturado</span><b>{GetCurrencyBRL(item.faturado)}</b></div>
                    <div className={styles.mobileField}><span>Custo</span><b>{GetCurrencyBRL(item.custo)}</b></div>
                    <div className={styles.mobileField}><span>Ticket médio</span><b>{GetCurrencyBRL(item.quantidade > 0 ? item.venda / item.quantidade : 0)}</b></div>
                    <div className={styles.mobileField}><span>Margem</span><b>{GetCurrencyBRL(margem)}</b></div>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.container}>

            {/* Header */}
            <div className={styles.header}>
                <h4 className={styles.title}>Relatório por dia</h4>
                <CSVLink data={result} headers={CSV_HEADERS} filename="relatorio-dia.csv">
                    <CustomButton typeButton="dark">Exportar CSV</CustomButton>
                </CSVLink>
            </div>

            {/* Filtros de período */}
            <div className={styles.periodBar}>
                {PERIOD_OPTIONS.map(opt => (
                    <button
                        key={opt.value}
                        className={`${styles.periodBtn} ${search.period === opt.value ? styles.periodBtnActive : ''}`}
                        onClick={() => handlePeriod(opt.value)}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {search.period === 'personalizado' && (
                <div className={styles.customRange}>
                    <InputGroup type="date" title="Início" value={search.dateIn} width="180px"
                        onChange={v => setSearch(prev => ({ ...prev, dateIn: v.target.value }))} />
                    <InputGroup type="date" title="Fim" value={search.dateFim} width="180px"
                        onChange={v => setSearch(prev => ({ ...prev, dateFim: v.target.value }))} />
                    <CustomButton onClick={() => loadData()} typeButton="dark" style={{ marginBottom: 10 }}>
                        Pesquisar
                    </CustomButton>
                </div>
            )}

            <hr className={styles.divider} />

            {loading ? (
                <div className={styles.loadingWrap}><Spinner /></div>
            ) : (
                <>
                    {/* Cards de métricas */}
                    <div className={styles.metricsGrid}>
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Quantidade</span>
                            <span className={styles.metricValue}>{totalQtd.toLocaleString('pt-BR')}</span>
                            <span className={styles.metricSub}>itens vendidos</span>
                        </div>
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Venda total</span>
                            <span className={styles.metricValue}>{GetCurrencyBRL(totalVenda)}</span>
                            <span className={styles.metricSub}>receita bruta</span>
                        </div>
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Faturado</span>
                            <span className={styles.metricValue}>{GetCurrencyBRL(totalFaturado)}</span>
                            <span className={styles.metricSub}>valor recebido</span>
                        </div>
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Custo total</span>
                            <span className={styles.metricValue}>{GetCurrencyBRL(totalCusto)}</span>
                            <span className={styles.metricSub}>CMV</span>
                        </div>
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Margem bruta</span>
                            <span className={styles.metricValue}>{GetCurrencyBRL(totalMargem)}</span>
                            <span className={totalMargemPct >= 0 ? styles.badgeSuccess : styles.badgeDanger}>
                                {totalMargemPct.toFixed(1)}%
                            </span>
                        </div>
                    </div>

                    {/* Gráfico */}
                    {result.length > 0 && (
                        <div className={styles.chartCard}>
                            <span className={styles.chartTitle}>Venda e faturado por dia</span>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,.1)" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: '#888' }}
                                        axisLine={false} tickLine={false}
                                        tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`}
                                        width={52}
                                    />
                                    <Tooltip
                                        formatter={(v: number) => GetCurrencyBRL(v)}
                                        contentStyle={{ fontSize: 12, borderRadius: 8, border: '0.5px solid #e0d8e1' }}
                                    />
                                    <Bar dataKey="Venda" fill="#ada3ff" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Faturado" fill="#679f7d" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                            <div className={styles.chartLegend}>
                                <span><i className={styles.dotBlue} />Venda</span>
                                <span><i className={styles.dotGreen} />Faturado</span>
                            </div>
                        </div>
                    )}

                    <hr className={styles.divider} />

                    {/* Tabela / Mobile */}
                    {isMobile ? (
                        <div className={styles.mobileList}>
                            {result.map(item => MobileItem(item))}
                        </div>
                    ) : (
                        <KRDTable<RelatorioProps>
                            columns={columns}
                            data={result}
                            loading={loading}
                        />
                    )}
                </>
            )}
        </div>
    )
}