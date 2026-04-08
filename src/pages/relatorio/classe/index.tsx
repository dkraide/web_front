import { useEffect, useState, useContext, useMemo } from "react"
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  startOfYear, endOfYear, startOfDay, endOfDay, format
} from 'date-fns'
import { api } from "@/services/apiClient"
import { AxiosError, AxiosResponse } from "axios"
import { toast } from "react-toastify"
import styles from './styles.module.scss'
import KRDTable, { KRDColumn } from "@/components/ui/KRDTable"
import IUsuario from "@/interfaces/IUsuario"
import { AuthContext } from "@/contexts/AuthContext"
import { InputGroup } from "@/components/ui/InputGroup"
import CustomButton from "@/components/ui/Buttons"
import { Spinner } from "react-bootstrap"
import { CSVLink } from "react-csv"
import { GetCurrencyBRL, LucroPorcentagem } from "@/utils/functions"
import { isMobile } from "react-device-detect"
import _ from "lodash"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from "recharts"
import KRDInput from "@/components/ui/KRDInput"

type PeriodType = 'hoje' | 'semana' | 'mes' | 'ano' | 'personalizado'

interface SearchProps {
  dateIn: string
  dateFim: string
  str: string
  period: PeriodType
}

interface RelatorioProps {
  classe: string
  quantidade: number
  venda: number
  custo: number
}

const PERIOD_OPTIONS: { label: string; value: PeriodType }[] = [
  { label: 'Hoje', value: 'hoje' },
  { label: 'Esta semana', value: 'semana' },
  { label: 'Este mês', value: 'mes' },
  { label: 'Este ano', value: 'ano' },
  { label: 'Personalizado', value: 'personalizado' },
]

function getDateRangeForPeriod(period: PeriodType): { dateIn: string; dateFim: string } {
  const now = new Date()
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd')
  switch (period) {
    case 'hoje':    return { dateIn: fmt(startOfDay(now)),  dateFim: fmt(endOfDay(now)) }
    case 'semana':  return { dateIn: fmt(startOfWeek(now, { weekStartsOn: 0 })), dateFim: fmt(endOfWeek(now, { weekStartsOn: 0 })) }
    case 'mes':     return { dateIn: fmt(startOfMonth(now)), dateFim: fmt(endOfMonth(now)) }
    case 'ano':     return { dateIn: fmt(startOfYear(now)),  dateFim: fmt(endOfYear(now)) }
    default:        return { dateIn: fmt(startOfMonth(now)), dateFim: fmt(endOfMonth(now)) }
  }
}

const CSV_HEADERS = [
  { label: "Classe de Material", key: "classe" },
  { label: "Quantidade",         key: "quantidade" },
  { label: "Venda",              key: "venda" },
  { label: "Custo",              key: "custo" },
]

export default function RelatorioClasse() {
  const { getUser } = useContext(AuthContext)

  const [result,  setResult]  = useState<RelatorioProps[]>([])
  const [loading, setLoading] = useState(true)
  const [user,    setUser]    = useState<IUsuario>()
  const [search,  setSearch]  = useState<SearchProps>({
    ...getDateRangeForPeriod('mes'),
    str: '',
    period: 'mes',
  })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    let u = user
    if (!u) {
      const res = await getUser()
      setUser(res)
      u = res
    }
    setLoading(true)
    try {
      const { data } = await api.get<RelatorioProps[]>(
        `/Relatorio/ClasseMaterial?empresaId=${u.empresaSelecionada}&dataIn=${search.dateIn}&dataFim=${search.dateFim}`
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
    const range = getDateRangeForPeriod(period)
    setSearch(prev => ({ ...prev, period, ...range }))
  }

  const filtered = useMemo(() =>
    result.filter(item =>
      item.classe.toUpperCase().includes(search.str.toUpperCase())
    ), [result, search.str])

  const totalVenda    = _.sumBy(result, 'venda')
  const totalCusto    = _.sumBy(result, 'custo')
  const totalQtd      = _.sumBy(result, 'quantidade')
  const totalMargem   = totalVenda - totalCusto
  const totalMargemPct = totalVenda > 0 ? (totalMargem / totalVenda) * 100 : 0

  const chartData = filtered.map(r => ({
    name:    r.classe.length > 12 ? r.classe.slice(0, 12) + '…' : r.classe,
    Venda:   r.venda,
    Custo:   r.custo,
  }))

  const columns = [
    { name: 'Classe',       selector: (row: RelatorioProps) => row.classe,      sortable: true },
    { name: 'Qtd',          selector: (row: RelatorioProps) => row.quantidade,   sortable: true },
    { name: 'Venda',        selector: (row: RelatorioProps) => row.venda,        sortable: true, cell: (row: RelatorioProps) => GetCurrencyBRL(row.venda) },
    { name: 'Custo',        selector: (row: RelatorioProps) => row.custo,        sortable: true, cell: (row: RelatorioProps) => GetCurrencyBRL(row.custo) },
    { name: 'Margem R$',    selector: (row: RelatorioProps) => row.venda - row.custo, sortable: true,
      cell: (row: RelatorioProps) => GetCurrencyBRL(row.venda - row.custo) },
    { name: 'Margem %',     selector: (row: RelatorioProps) => LucroPorcentagem(row.venda, row.custo),
      sortable: true,
      cell: (row: RelatorioProps) => {
        const pct = LucroPorcentagem(row.venda, row.custo)
        return (
          <span className={pct >= 0 ? styles.badgeSuccess : styles.badgeDanger}>
            {pct.toFixed(1)}%
          </span>
        )
      }
    },
  ]

  const MobileItem = (item: RelatorioProps) => {
    const margem    = item.venda - item.custo
    const margemPct = LucroPorcentagem(item.venda, item.custo)
    return (
      <div key={item.classe} className={styles.mobileItem}>
        <div className={styles.mobileItemHeader}>
          <span className={styles.mobileClasse}>{item.classe}</span>
          <span className={margemPct >= 0 ? styles.badgeSuccess : styles.badgeDanger}>
            {margemPct.toFixed(1)}%
          </span>
        </div>
        <div className={styles.mobileItemBody}>
          <div className={styles.mobileField}><span>Qtd</span><b>{item.quantidade}</b></div>
          <div className={styles.mobileField}><span>Venda</span><b>{GetCurrencyBRL(item.venda)}</b></div>
          <div className={styles.mobileField}><span>Custo</span><b>{GetCurrencyBRL(item.custo)}</b></div>
          <div className={styles.mobileField}><span>Margem</span><b>{GetCurrencyBRL(margem)}</b></div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>

      {/* Header */}
      <div className={styles.header}>
        <h4 className={styles.title}>Relatório por classe de material</h4>
        <CSVLink data={result} headers={CSV_HEADERS} filename="relatorio-classe.csv">
          <CustomButton typeButton="dark">Exportar CSV</CustomButton>
        </CSVLink>
      </div>

      {/* Filtro de período */}
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
          <InputGroup
            type="date"
            title="Início"
            value={search.dateIn}
            onChange={v => setSearch(prev => ({ ...prev, dateIn: v.target.value }))}
            width="180px"
          />
          <InputGroup
            type="date"
            title="Fim"
            value={search.dateFim}
            onChange={v => setSearch(prev => ({ ...prev, dateFim: v.target.value }))}
            width="180px"
          />
          <CustomButton onClick={loadData} typeButton="dark" style={{ marginBottom: 10 }}>
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
          <div className={styles.chartCard}>
            <span className={styles.chartTitle}>Venda vs Custo por classe</span>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,.12)" vertical={false} />
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
                <Legend
                  iconType="square"
                  iconSize={10}
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                />
                <Bar dataKey="Venda" fill="#ada3ff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Custo" fill="#679f7d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <hr className={styles.divider} />

          {/* Filtro de texto */}
          <div className={styles.searchRow}>
            <InputGroup
              title="Filtrar por classe"
              value={search.str}
              onChange={v => setSearch(prev => ({ ...prev, str: v.currentTarget.value }))}
            />
          </div>

          {/* Tabela / Cards mobile */}
          {isMobile ? (
            <div className={styles.mobileList}>
              {filtered.map(item => MobileItem(item))}
            </div>
          ) : (
            <KRDTable columns={columns} data={filtered} loading={loading} />
          )}
        </>
      )}
    </div>
  )
}