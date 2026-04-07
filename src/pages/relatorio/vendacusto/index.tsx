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
import { GetCurrencyBRL, LucroPorcentagem } from "@/utils/functions"
import CustomButton from "@/components/ui/Buttons"
import _ from "lodash"
import { Spinner } from "react-bootstrap"
import { CSVLink } from "react-csv"
import SelectTipoVendedor from "@/components/Selects/SelectTipoVendedor"
import { isMobile } from 'react-device-detect'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell
} from "recharts"

type PeriodType = 'hoje' | 'semana' | 'mes' | 'ano' | 'personalizado'

interface SearchProps {
  dateIn: string
  dateFim: string
  period: PeriodType
}

interface RelatorioProps {
  usuario: string
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

const CSV_HEADERS = [
  { label: "Usuário",    key: "usuario" },
  { label: "Quantidade", key: "quantidade" },
  { label: "Venda",      key: "venda" },
  { label: "Custo",      key: "custo" },
]

const BAR_COLORS = ['#ada3ff', '#679f7d', '#fc4f6b', '#edce5f', '#f78396', '#c74949']

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

export default function RelatorioUsuario() {
  const { getUser } = useContext(AuthContext)

  const [result,         setResult]         = useState<RelatorioProps[]>([])
  const [loading,        setLoading]        = useState(true)
  const [user,           setUser]           = useState<IUsuario>()
  const [usuarioGorjeta, setUsuarioGorjeta] = useState(false)
  const [search,         setSearch]         = useState<SearchProps>({
    ...getDateRange('mes'),
    period: 'mes',
  })

  useEffect(() => { loadData() }, [])

  const loadData = async (overrideDates?: { dateIn: string; dateFim: string }, overrideVendedor?: boolean) => {
    const dateIn   = overrideDates?.dateIn  ?? search.dateIn
    const dateFim  = overrideDates?.dateFim ?? search.dateFim
    const vendedor = overrideVendedor       ?? usuarioGorjeta

    let u = user
    if (!u) {
      const res = await getUser()
      setUser(res)
      u = res
    }
    setLoading(true)
    try {
      const { data } = await api.get<RelatorioProps[]>(
        `/Relatorio/Usuario?vendedor=${vendedor}&empresaId=${u.empresaSelecionada}&dataIn=${dateIn}&dataFim=${dateFim}`
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

  // Métricas
  const totalQtd    = _.sumBy(result, 'quantidade')
  const totalVenda  = _.sumBy(result, 'venda')
  const totalCusto  = _.sumBy(result, 'custo')
  const totalMargem = totalVenda - totalCusto
  const totalMargemPct = totalVenda > 0 ? (totalMargem / totalVenda) * 100 : 0

  // Top vendedor
  const topVendedor = useMemo(() =>
    result.length ? result.reduce((best, r) => r.venda > best.venda ? r : best) : null,
    [result]
  )

  const chartData = useMemo(() =>
    [...result]
      .sort((a, b) => b.venda - a.venda)
      .map(r => ({
        name:  r.usuario?.length > 14 ? r.usuario.slice(0, 14) + '…' : r.usuario,
        Venda: r.venda,
        Custo: r.custo,
      })),
    [result]
  )

  const columns: KRDColumn<RelatorioProps>[] = [
    {
      name: 'Usuário',
      selector: row => row.usuario,
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
    {
      name: '% do total',
      selector: row => totalVenda > 0 ? (row.venda / totalVenda) * 100 : 0,
      cell: row => {
        const pct = totalVenda > 0 ? (row.venda / totalVenda) * 100 : 0
        return (
          <div className={styles.shareBar}>
            <div className={styles.shareBarFill} style={{ width: `${Math.min(pct, 100)}%` }} />
            <span className={styles.shareBarLabel}>{pct.toFixed(1)}%</span>
          </div>
        )
      },
      sortable: true,
      right: false,
    },
  ]

  const MobileItem = (item: RelatorioProps) => {
    const margemPct  = LucroPorcentagem(item.venda, item.custo)
    const sharePct   = totalVenda > 0 ? (item.venda / totalVenda) * 100 : 0
    return (
      <div key={item.usuario} className={styles.mobileItem}>
        <div className={styles.mobileItemHeader}>
          <span className={styles.mobileUsuario}>{item.usuario}</span>
          <span className={margemPct >= 0 ? styles.badgeSuccess : styles.badgeDanger}>
            {margemPct.toFixed(1)}%
          </span>
        </div>
        <div className={styles.shareBar} style={{ marginBottom: 10 }}>
          <div className={styles.shareBarFill} style={{ width: `${Math.min(sharePct, 100)}%` }} />
          <span className={styles.shareBarLabel}>{sharePct.toFixed(1)}% do total</span>
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
        <h4 className={styles.title}>Relatório por usuário</h4>
        <CSVLink data={result} headers={CSV_HEADERS} filename="relatorio-usuario.csv">
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

      {/* Filtro de tipo + pesquisar */}
      <div className={styles.filtersRow}>
        <SelectTipoVendedor
          width={isMobile ? '100%' : '260px'}
          selected={usuarioGorjeta}
          setSelected={v => {
            setUsuarioGorjeta(v)
            loadData(undefined, v)
          }}
        />
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
              <span className={styles.metricLabel}>Usuários</span>
              <span className={styles.metricValue}>{result.length}</span>
              <span className={styles.metricSub}>no período</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Qtd vendas</span>
              <span className={styles.metricValue}>{totalQtd.toLocaleString('pt-BR')}</span>
              <span className={styles.metricSub}>transações</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Venda total</span>
              <span className={styles.metricValue}>{GetCurrencyBRL(totalVenda)}</span>
              <span className={styles.metricSub}>receita bruta</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Margem bruta</span>
              <span className={styles.metricValue}>{GetCurrencyBRL(totalMargem)}</span>
              <span className={totalMargemPct >= 0 ? styles.badgeSuccess : styles.badgeDanger}>
                {totalMargemPct.toFixed(1)}%
              </span>
            </div>
            {topVendedor && (
              <div className={`${styles.metricCard} ${styles.metricCardHighlight}`}>
                <span className={styles.metricLabel}>Top vendedor</span>
                <span className={styles.metricValue} style={{ fontSize: 15 }}>{topVendedor.usuario}</span>
                <span className={styles.metricSub}>{GetCurrencyBRL(topVendedor.venda)}</span>
              </div>
            )}
          </div>

          {/* Gráfico */}
          {result.length > 0 && (
            <div className={styles.chartCard}>
              <span className={styles.chartTitle}>Venda por usuário</span>
              <ResponsiveContainer width="100%" height={Math.max(180, result.length * 44)}>
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,.1)" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#888' }}
                    axisLine={false} tickLine={false}
                    tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#888' }}
                    axisLine={false} tickLine={false}
                    width={110}
                  />
                  <Tooltip
                    formatter={(v: number) => GetCurrencyBRL(v)}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '0.5px solid #e0d8e1' }}
                  />
                  <Bar dataKey="Venda" radius={[0, 4, 4, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
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