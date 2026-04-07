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
import { ExportToExcel, GetCurrencyBRL } from "@/utils/functions"
import IMovimentoCaixa from "@/interfaces/IMovimentoCaixa"
import CustomButton from "@/components/ui/Buttons"
import _ from "lodash"
import { Spinner } from "react-bootstrap"
import { isMobile } from "react-device-detect"

type PeriodType = 'hoje' | 'semana' | 'mes' | 'ano' | 'personalizado'

interface SearchProps {
    dateIn: string
    dateFim: string
    period: PeriodType
}

interface VendaForma {
    venda: {
        forma: string
        valor: number
    }
}

interface RelatorioProps {
    caixa: IMovimentoCaixa
    vendas: VendaForma[]
}

interface RowData extends Record<string, unknown> {
    id: number
    idMovimentoCaixa: number
    status: string
    dataMovimento: string
    dataFechamento: string
    valorDinheiro: number
    valorDinheiroFinal: number
    valorSangria: number
    diferenca: number
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

export default function FechamentoCaixa() {
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
                `/Relatorio/FechamentoCaixa?empresaId=${u.empresaSelecionada}&dataIn=${dateIn}&dataFim=${dateFim}`
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
        const range = getDateRange(period)
        setSearch(prev => ({ ...prev, period, ...range }))
        loadData(range) // <-- passa as datas novas direto
    }

    // Formas de pagamento únicas em todos os caixas
    const formas = useMemo(() => {
        const arr: string[] = []
        result.forEach(r =>
            r.vendas.forEach(v => {
                if (!arr.includes(v.venda.forma)) arr.push(v.venda.forma)
            })
        )
        return arr
    }, [result])

    // Linha plana para tabela e Excel
    const rows = useMemo<RowData[]>(() => {
        return result.map(p => {
            const obj: RowData = {
                ...(p.caixa as unknown as RowData),
                status: p.caixa.status ? 'FECHADO' : 'ABERTO',
                valorSangria: _.sumBy(p.caixa.sangrias, s => s.isSangria ? s.valorMovimento : 0),
                diferenca: 0,
            }

            let dinheiro = 0
            formas.forEach(forma => {
                const idx = _.findIndex(p.vendas, v => v.venda.forma === forma)
                obj[forma] = idx < 0 ? 0 : p.vendas[idx].venda.valor
                if (idx >= 0 && forma.toLowerCase().includes('dinheiro')) {
                    dinheiro += p.vendas[idx].venda.valor
                }
            })

            const resultado = p.caixa.valorDinheiro + dinheiro - obj.valorSangria
            obj.diferenca = p.caixa.status
                ? Number((p.caixa.valorDinheiroFinal - resultado).toFixed(2))
                : 0

            return obj
        })
    }, [result, formas])

    // Métricas
    const totalAbertos = rows.filter(r => r.status === 'ABERTO').length
    const totalFechados = rows.filter(r => r.status === 'FECHADO').length
    const totalSangrias = _.sumBy(rows, 'valorSangria')
    const totalDiferenca = _.sumBy(rows, 'diferenca')

    // Colunas base + formas de pagamento dinâmicas
    const columns = useMemo<KRDColumn<RowData>[]>(() => {
        const base: KRDColumn<RowData>[] = [
            {
                name: 'Caixa',
                selector: row => row.id,
                sortable: true,
                width: '70px',
            },
            {
                name: 'Status',
                selector: row => row.status as string,
                cell: row => (
                    <span className={row.status === 'FECHADO' ? styles.badgeFechado : styles.badgeAberto}>
                        {row.status as string}
                    </span>
                ),
                sortable: true,
            },
            {
                name: 'Abertura',
                selector: row => row.dataMovimento as string,
                cell: row => row.dataMovimento ? format(new Date(row.dataMovimento as string), 'dd/MM/yyyy HH:mm') : '—',
                sortable: true,
            },
            {
                name: 'Fechamento',
                selector: row => row.dataFechamento as string,
                cell: row => row.dataFechamento && row.status === 'FECHADO'
                    ? format(new Date(row.dataFechamento as string), 'dd/MM/yyyy HH:mm')
                    : '—',
                sortable: true,
            },
            {
                name: 'Abertura R$',
                selector: row => row.valorDinheiro as number,
                cell: row => GetCurrencyBRL(row.valorDinheiro as number),
                sortable: true,
                right: true,
            },
            {
                name: 'Sangrias',
                selector: row => row.valorSangria as number,
                cell: row => GetCurrencyBRL(row.valorSangria as number),
                sortable: true,
                right: true,
            },
        ]

        formas.forEach(forma => {
            base.push({
                name: forma,
                selector: row => row[forma] as number ?? 0,
                cell: row => GetCurrencyBRL((row[forma] as number) ?? 0),
                sortable: true,
                right: true,
            })
        })

        base.push(
            {
                name: 'Fechamento R$',
                selector: row => row.valorDinheiroFinal as number,
                cell: row => row.status === 'FECHADO' ? GetCurrencyBRL(row.valorDinheiroFinal as number) : '—',
                sortable: true,
                right: true,
            },
            {
                name: 'Diferença',
                selector: row => row.diferenca as number,
                cell: row => {
                    const v = row.diferenca as number
                    return (
                        <span className={v === 0 ? styles.badgeNeutro : v > 0 ? styles.badgeSuccess : styles.badgeDanger}>
                            {GetCurrencyBRL(v)}
                        </span>
                    )
                },
                sortable: true,
                right: true,
            }
        )

        return base
    }, [formas])

    function getExcelHeaders() {
        const h = [
            { label: 'Caixa', key: 'id' },
            { label: 'Status', key: 'status' },
            { label: 'Abertura', key: 'dataMovimento' },
            { label: 'Fechamento', key: 'dataFechamento' },
            { label: 'Abertura R$', key: 'valorDinheiro' },
            { label: 'Sangrias', key: 'valorSangria' },
        ]
        formas.forEach(f => h.push({ label: f, key: f }))
        h.push(
            { label: 'Fechamento R$', key: 'valorDinheiroFinal' },
            { label: 'Diferença', key: 'diferenca' },
        )
        return h
    }

    const MobileItem = (item: RowData) => (
        <div key={item.id} className={styles.mobileItem}>
            <div className={styles.mobileItemHeader}>
                <div>
                    <span className={styles.mobileCaixaId}>Caixa #{item.idMovimentoCaixa ?? item.id}</span>
                    <span className={item.status === 'FECHADO' ? styles.badgeFechado : styles.badgeAberto}>
                        {item.status as string}
                    </span>
                </div>
                <span className={(item.diferenca as number) === 0
                    ? styles.badgeNeutro
                    : (item.diferenca as number) > 0
                        ? styles.badgeSuccess
                        : styles.badgeDanger}>
                    {GetCurrencyBRL(item.diferenca as number)}
                </span>
            </div>
            <div className={styles.mobileItemBody}>
                <div className={styles.mobileField}>
                    <span>Abertura</span>
                    <b>{item.dataMovimento ? format(new Date(item.dataMovimento as string), 'dd/MM/yy HH:mm') : '—'}</b>
                </div>
                <div className={styles.mobileField}>
                    <span>Fechamento</span>
                    <b>{item.dataFechamento && item.status === 'FECHADO'
                        ? format(new Date(item.dataFechamento as string), 'dd/MM/yy HH:mm')
                        : '—'}</b>
                </div>
                <div className={styles.mobileField}>
                    <span>Abertura R$</span>
                    <b>{GetCurrencyBRL(item.valorDinheiro as number)}</b>
                </div>
                <div className={styles.mobileField}>
                    <span>Sangria</span>
                    <b>{GetCurrencyBRL(item.valorSangria as number)}</b>
                </div>
                <div className={styles.mobileField}>
                    <span>Fechamento R$</span>
                    <b>{item.status === 'FECHADO' ? GetCurrencyBRL(item.valorDinheiroFinal as number) : '—'}</b>
                </div>
                <div className={styles.mobileField}>
                    <span>Diferença</span>
                    <b>{GetCurrencyBRL(item.diferenca as number)}</b>
                </div>
            </div>
            {formas.length > 0 && (
                <div className={styles.mobileFormas}>
                    {formas.map(f => (
                        <div key={f} className={styles.mobileField}>
                            <span>{f}</span>
                            <b>{GetCurrencyBRL((item[f] as number) ?? 0)}</b>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )

    return (
        <div className={styles.container}>

            {/* Header */}
            <div className={styles.header}>
                <h4 className={styles.title}>Fechamento de caixa</h4>
                <CustomButton
                    onClick={() => ExportToExcel(getExcelHeaders(), rows, 'fechamento')}
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
                    <CustomButton onClick={() => loadData()} typeButton="dark" style={{ marginBottom: 10 }}>
                        Pesquisar
                    </CustomButton>
                </div>
            )}

            <div className={styles.searchAction}>
                <CustomButton onClick={() => loadData()} typeButton="dark" style={{ marginBottom: 10 }}>
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
                            <span className={styles.metricLabel}>Caixas abertos</span>
                            <span className={styles.metricValue}>{totalAbertos}</span>
                        </div>
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Caixas fechados</span>
                            <span className={styles.metricValue}>{totalFechados}</span>
                        </div>
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Total sangrias</span>
                            <span className={styles.metricValue}>{GetCurrencyBRL(totalSangrias)}</span>
                        </div>
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Diferença total</span>
                            <span className={styles.metricValue}>{GetCurrencyBRL(totalDiferenca)}</span>
                            <span className={totalDiferenca === 0
                                ? styles.badgeNeutro
                                : totalDiferenca > 0
                                    ? styles.badgeSuccess
                                    : styles.badgeDanger}>
                                {totalDiferenca === 0 ? 'zerado' : totalDiferenca > 0 ? 'sobra' : 'falta'}
                            </span>
                        </div>
                    </div>

                    {/* Tabela / Mobile */}
                    {isMobile ? (
                        <div className={styles.mobileList}>
                            {rows.map(item => MobileItem(item))}
                        </div>
                    ) : (
                        <KRDTable<RowData>
                            columns={columns}
                            data={rows}
                            loading={loading}
                        />
                    )}
                </>
            )}
        </div>
    )
}