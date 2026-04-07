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
import { ExportToExcel } from "@/utils/functions"
import CustomButton from "@/components/ui/Buttons"
import _ from "lodash"
import { Spinner } from "react-bootstrap"
import IProduto from "@/interfaces/IProduto"
import SelectClasseMaterial from "@/components/Selects/SelectClasseMaterial"
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
    classeId: number
}

interface RelatorioProps {
    produto: IProduto
    entrada: number
    saida: number
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

const EXCEL_HEADERS = [
    { label: "Produto", key: "produto" },
    { label: "Estoque", key: "estoque" },
    { label: "Entrada", key: "entrada" },
    { label: "Saída", key: "saida" },
    { label: "Resultado", key: "resultado" },
]

export default function RelatorioEstoque() {
    const { getUser } = useContext(AuthContext)

    const [result, setResult] = useState<RelatorioProps[]>([])
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<IUsuario>()
    const [search, setSearch] = useState<SearchProps>({
        ...getDateRange('mes'),
        period: 'mes',
        classeId: 0,
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
                `/Relatorio/estoque?empresaId=${u.empresaSelecionada}&dataIn=${dateIn}&dataFim=${dateFim}`
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

    const filtered = useMemo(() =>
        search.classeId
            ? result.filter(r => r.produto?.classeMaterialId === search.classeId)
            : result,
        [result, search.classeId]
    )

    const totalEntrada = _.sumBy(filtered, 'entrada')
    const totalSaida = _.sumBy(filtered, 'saida')
    const totalEstoque = _.sumBy(filtered, r => r.produto?.quantidade ?? 0)
    const totalResultado = _.sumBy(filtered, r => (r.produto?.quantidade ?? 0) - r.entrada + r.saida)

    const chartData = useMemo(() =>
        [...filtered]
            .sort((a, b) => b.saida - a.saida)
            .slice(0, 12)
            .map(r => ({
                name: r.produto?.nome?.length > 14 ? r.produto.nome.slice(0, 14) + '…' : r.produto?.nome,
                Entrada: r.entrada,
                Saída: r.saida,
            })),
        [filtered]
    )

    function getExcelData() {
        return filtered.map(p => ({
            produto: p.produto.nome,
            estoque: p.produto.quantidade,
            entrada: p.entrada,
            saida: p.saida,
            resultado: p.produto.quantidade - p.entrada + p.saida,
        }))
    }

    const columns: KRDColumn<RelatorioProps>[] = [
        {
            name: 'Cód',
            selector: row => row.produto?.cod ?? '',
            sortable: true,
            width: '80px',
        },
        {
            name: 'Produto',
            selector: row => row.produto?.nome ?? '',
            sortable: true,
        },
        {
            name: 'Estoque',
            selector: row => row.produto?.quantidade ?? 0,
            cell: row => (row.produto?.quantidade ?? 0).toFixed(2),
            sortable: true,
            right: true,
        },
        {
            name: 'Entrada',
            selector: row => row.entrada,
            cell: row => row.entrada.toFixed(2),
            sortable: true,
            right: true,
        },
        {
            name: 'Saída',
            selector: row => row.saida,
            cell: row => row.saida.toFixed(2),
            sortable: true,
            right: true,
        },
        {
            name: 'Resultado',
            selector: row => (row.produto?.quantidade ?? 0) - row.entrada + row.saida,
            cell: row => {
                const val = (row.produto?.quantidade ?? 0) - row.entrada + row.saida
                return (
                    <span className={val >= 0 ? styles.badgeSuccess : styles.badgeDanger}>
                        {val.toFixed(2)}
                    </span>
                )
            },
            sortable: true,
            right: true,
        },
    ]

    const MobileItem = (item: RelatorioProps) => {
        const resultado = (item.produto?.quantidade ?? 0) - item.entrada + item.saida
        return (
            <div key={item.produto?.id} className={styles.mobileItem}>
                <div className={styles.mobileItemHeader}>
                    <div>
                        <span className={styles.mobileCod}>{item.produto?.cod}</span>
                        <span className={styles.mobileNome}>{item.produto?.nome}</span>
                    </div>
                    <span className={resultado >= 0 ? styles.badgeSuccess : styles.badgeDanger}>
                        {resultado.toFixed(2)}
                    </span>
                </div>
                <div className={styles.mobileItemBody}>
                    <div className={styles.mobileField}><span>Estoque</span><b>{(item.produto?.quantidade ?? 0).toFixed(2)}</b></div>
                    <div className={styles.mobileField}><span>Entrada</span><b>{item.entrada.toFixed(2)}</b></div>
                    <div className={styles.mobileField}><span>Saída</span><b>{item.saida.toFixed(2)}</b></div>
                    <div className={styles.mobileField}><span>Resultado</span><b>{resultado.toFixed(2)}</b></div>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.container}>

            {/* Header */}
            <div className={styles.header}>
                <h4 className={styles.title}>Relatório de estoque</h4>
                <CustomButton
                    onClick={() => ExportToExcel(EXCEL_HEADERS, getExcelData(), 'relatorio_estoque')}
                    typeButton="dark"
                >
                    Exportar Excel
                </CustomButton>
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
                </div>
            )}

            {/* Filtros adicionais */}
            <div className={styles.filtersRow}>
                <SelectClasseMaterial
                    width={isMobile ? '100%' : '300px'}
                    selected={search.classeId}
                    setSelected={v => setSearch(prev => ({ ...prev, classeId: v }))}
                />
                <CustomButton onClick={() => { loadData(); }} typeButton="dark" style={{ marginBottom: 10 }}>
                    Pesquisar
                </CustomButton>
            </div>

            <hr className={styles.divider} />

            {loading ? (
                <div className={styles.loadingWrap}><Spinner /></div>
            ) : (
                <>
                    {/* Cards de métricas */}
                    <div className={styles.metricsGrid}>
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Produtos</span>
                            <span className={styles.metricValue}>{filtered.length.toLocaleString('pt-BR')}</span>
                            <span className={styles.metricSub}>itens no período</span>
                        </div>
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Estoque total</span>
                            <span className={styles.metricValue}>{totalEstoque.toFixed(2)}</span>
                            <span className={styles.metricSub}>unidades em estoque</span>
                        </div>
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Total entrada</span>
                            <span className={styles.metricValue}>{totalEntrada.toFixed(2)}</span>
                            <span className={styles.metricSub}>unidades entradas</span>
                        </div>
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Total saída</span>
                            <span className={styles.metricValue}>{totalSaida.toFixed(2)}</span>
                            <span className={styles.metricSub}>unidades saídas</span>
                        </div>
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Resultado</span>
                            <span className={styles.metricValue}>{totalResultado.toFixed(2)}</span>
                            <span className={totalResultado >= 0 ? styles.badgeSuccess : styles.badgeDanger}>
                                {totalResultado >= 0 ? 'positivo' : 'negativo'}
                            </span>
                        </div>
                    </div>

                    {/* Gráfico — top 12 por saída */}
                    {filtered.length > 0 && (
                        <div className={styles.chartCard}>
                            <span className={styles.chartTitle}>Entrada vs saída — top produtos</span>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,.1)" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: '#888' }}
                                        axisLine={false} tickLine={false}
                                        width={36}
                                    />
                                    <Tooltip
                                        contentStyle={{ fontSize: 12, borderRadius: 8, border: '0.5px solid #e0d8e1' }}
                                    />
                                    <Bar dataKey="Entrada" fill="#ada3ff" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Saída" fill="#679f7d" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                            <div className={styles.chartLegend}>
                                <span><i className={styles.dotBlue} />Entrada</span>
                                <span><i className={styles.dotGreen} />Saída</span>
                            </div>
                        </div>
                    )}

                    <hr className={styles.divider} />

                    {/* Tabela / Mobile */}
                    {isMobile ? (
                        <div className={styles.mobileList}>
                            {filtered.map(item => MobileItem(item))}
                        </div>
                    ) : (
                        <KRDTable<RelatorioProps>
                            columns={columns}
                            data={filtered}
                            loading={loading}
                        />
                    )}
                </>
            )}
        </div>
    )
}