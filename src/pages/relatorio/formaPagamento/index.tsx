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
import CustomButton from "@/components/ui/Buttons"
import _ from "lodash"
import { Spinner } from "react-bootstrap"
import { CSVLink } from "react-csv"
import { GetCurrencyBRL, LucroPorcentagem } from "@/utils/functions"
import { isMobile } from 'react-device-detect'
import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, Legend
} from "recharts"

type PeriodType = 'hoje' | 'semana' | 'mes' | 'ano' | 'personalizado'

interface SearchProps {
  dateIn: string
  dateFim: string
  period: PeriodType
}

interface RelatorioProps {
  forma: string
  quantidade: number
  venda: number
  custo: number
}

const PERIOD_OPTIONS: { label: string; value: PeriodType }[] = [
  { label: 'Hoje',          value: 'hoje' },
  { label: 'Esta semana',   value: 'semana' },
  { label: 'Este mês',      value: 'mes' },
  { label: 'Este ano',      value: 'ano' },
  { label: 'Personalizado', value: 'personalizado' },
]

const CHART_COLORS = ['#ada3ff', '#679f7d', '#fc4f6b', '#edce5f', '#c74949', '#f78396']

function getDateRange(period: PeriodType) {
  const now = new Date()
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd')
  switch (period) {
    case 'hoje':   return { dateIn: fmt(startOfDay(now)),  dateFim: fmt(endOfDay(now)) }
    case 'semana': return { dateIn: fmt(startOfWeek(now, { weekStartsOn: 0 })), dateFim: fmt(endOfWeek(now, { weekStartsOn: 0 })) }
    case 'mes':    return { dateIn: fmt(startOfMonth(now)), dateFim: fmt(endOfMonth(now)) }
    case 'ano':    return { dateIn: fmt(startOfYear(now)),  dateFim: fmt(endOfYear(now)) }
    default:       return { dateIn: fmt(startOfMonth(now)), dateFim: fmt(endOfMonth(now)) }
  }
}

const CSV_HEADERS = [
  { label: "Forma de Pagamento", key: "forma" },
  { label: "Quantidade",         key: "quantidade" },
  { label: "Venda",              key: "venda" },
  { label: "Custo",              key: "custo" },
]

export default function RelatorioForma() {
  const { getUser } = useContext(AuthContext)

  const [result,  setResult]  = useState<RelatorioProps[]>([])
  const [loading, setLoading] = useState(true)
  const [user,    setUser]    = useState<IUsuario>()
  const [search,  setSearch]  = useState<SearchProps>({
    ...getDateRange('mes'),
    period: 'mes',
  })

  useEffect(() => { loadData() }, [])

  const loadData = async (overrideDates?: { dateIn: string; dateFim: string }) => {
    const dateIn  = overrideDates?.dateIn  ?? search.dateIn
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
        `/Relatorio/FormaPagamento?empresaId=${u.empresaSelecionada}&dataIn=${dateIn}&dataFim=${dateFim}`
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
    loadData(range)
  }

  const totalQtd    = _.sumBy(result, 'quantidade')
  const totalVenda  = _.sumBy(result, 'venda')
  const totalCusto  = _.sumBy(result, 'custo')
  const totalMargem = totalVenda - totalCusto
  const totalMargemPct = totalVenda > 0 ? (totalMargem / totalVenda) * 100 : 0

  const chartData = useMemo(() =>
    result.map(r => ({ name: r.forma, value: r.venda })),
    [result]
  )

  const columns: KRDColumn<RelatorioProps>[] = [
    {
      name: 'Forma de pagamento',
      selector: row => row.forma,
      sortable: true,
    },
    {
      name: 'Quantidade',
      selector: row => row.quantidade,
      sortable: true,
      right: true,
    },
    {
      name: 'Venda',
      selector: row => row.venda,
      cell: row => GetCurrencyBRL(row.venda),
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
    const margemPct = LucroPorcentagem(item.venda, item.custo)
    return (
      <div key={item.forma} className={styles.mobileItem}>
        <div className={styles.mobileItemHeader}>
          <span className={styles.mobileForma}>{item.forma}</span>
          <span className={margemPct >= 0 ? styles.badgeSuccess : styles.badgeDanger}>
            {margemPct.toFixed(1)}%
          </span>
        </div>
        <div className={styles.mobileItemBody}>
          <div className={styles.mobileField}><span>Qtd</span><b>{item.quantidade}</b></div>
          <div className={styles.mobileField}><span>Venda</span><b>{GetCurrencyBRL(item.venda)}</b></div>
          <div className={styles.mobileField}><span>Custo</span><b>{GetCurrencyBRL(item.custo)}</b></div>
          <div className={styles.mobileField}><span>Margem</span><b>{GetCurrencyBRL(item.venda - item.custo)}</b></div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>

      {/* Header */}
      <div className={styles.header}>
        <h4 className={styles.title}>Relatório por forma de pagamento</h4>
        <CSVLink data={result} headers={CSV_HEADERS} filename="relatorio-forma.csv">
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
              <span className={styles.metricSub}>transações</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Venda total</span>
              <span className={styles.metricValue}>{GetCurrencyBRL(totalVenda)}</span>
              <span className={styles.metricSub}>receita bruta</span>
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

          {/* Gráfico de pizza — participação por forma */}
          {result.length > 0 && (
            <div className={styles.chartCard}>
              <span className={styles.chartTitle}>Participação por forma de pagamento</span>
              <div className={styles.chartRow}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => GetCurrencyBRL(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className={styles.chartLegend}>
                  {chartData.map((entry, i) => {
                    const pct = totalVenda > 0 ? ((entry.value / totalVenda) * 100).toFixed(1) : '0'
                    return (
                      <div key={i} className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className={styles.legendLabel}>{entry.name}</span>
                        <span className={styles.legendPct}>{pct}%</span>
                      </div>
                    )
                  })}
                </div>
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
              pagination={false}
            />
          )}
        </>
      )}
    </div>
  )
}