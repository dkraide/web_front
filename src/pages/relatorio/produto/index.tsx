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
import { ExportToExcel, GetCurrencyBRL, LucroPorcentagem } from "@/utils/functions"
import CustomButton from "@/components/ui/Buttons"
import _ from "lodash"
import { Spinner } from "react-bootstrap"
import { isMobile } from 'react-device-detect'
import IProduto from "@/interfaces/IProduto"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts"

type PeriodType = 'hoje' | 'semana' | 'mes' | 'ano' | 'personalizado'

interface SearchProps {
  dateIn: string
  dateFim: string
  period: PeriodType
  searchStr: string
}

interface RelatorioProps {
  produto: string
  quantidade: number
  venda: number
  custo: number
  quantidadeMediaVenda: number
  quantidadeVendas: number
  obj: IProduto
}

const PERIOD_OPTIONS: { label: string; value: PeriodType }[] = [
  { label: 'Hoje',          value: 'hoje' },
  { label: 'Esta semana',   value: 'semana' },
  { label: 'Este mês',      value: 'mes' },
  { label: 'Este ano',      value: 'ano' },
  { label: 'Personalizado', value: 'personalizado' },
]

const EXCEL_HEADERS = [
  { label: "Grupo",      key: "classe" },
  { label: "Produto",    key: "produto" },
  { label: "Quantidade", key: "quantidade" },
  { label: "Vendas",     key: "quantidadeVendas" },
  { label: "Venda",      key: "venda" },
  { label: "Custo",      key: "custo" },
]

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

export default function RelatorioProduto() {
  const { getUser } = useContext(AuthContext)

  const [result,  setResult]  = useState<RelatorioProps[]>([])
  const [loading, setLoading] = useState(true)
  const [user,    setUser]    = useState<IUsuario>()
  const [search,  setSearch]  = useState<SearchProps>({
    ...getDateRange('mes'),
    period: 'mes',
    searchStr: '',
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
        `/Relatorio/produto?empresaId=${u.empresaSelecionada}&dataIn=${dateIn}&dataFim=${dateFim}`
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

  const filtered = useMemo(() =>
    result.filter(r =>
      r.produto?.toLowerCase().includes(search.searchStr.toLowerCase())
    ),
    [result, search.searchStr]
  )

  const excelData = useMemo(() =>
    filtered.map(p => ({
      ...p,
      classe: p.obj?.classeMaterial?.nomeClasse || 'sem classe',
    })),
    [filtered]
  )

  // Métricas
  const totalQtd    = _.sumBy(filtered, 'quantidade')
  const totalVenda  = _.sumBy(filtered, 'venda')
  const totalCusto  = _.sumBy(filtered, 'custo')
  const totalMargem = totalVenda - totalCusto
  const totalMargemPct = totalVenda > 0 ? (totalMargem / totalVenda) * 100 : 0

  // Top 10 por venda para o gráfico
  const chartData = useMemo(() =>
    [...filtered]
      .sort((a, b) => b.venda - a.venda)
      .slice(0, 10)
      .map(r => ({
        name:  r.produto?.length > 16 ? r.produto.slice(0, 16) + '…' : r.produto,
        Venda: r.venda,
        Custo: r.custo,
      })),
    [filtered]
  )

  const columns: KRDColumn<RelatorioProps>[] = [
    {
      name: 'Produto',
      selector: row => row.produto,
      sortable: true,
    },
    {
      name: 'Grupo',
      selector: row => row.obj?.classeMaterial?.nomeClasse ?? '—',
      cell: row => (
        <span className={styles.tagClasse}>
          {row.obj?.classeMaterial?.nomeClasse ?? '—'}
        </span>
      ),
      sortable: true,
    },
    {
      name: 'Qtd',
      selector: row => row.quantidade,
      sortable: true,
      right: true,
      width: '70px',
    },
    {
      name: 'Vendas',
      selector: row => row.quantidadeVendas,
      sortable: true,
      right: true,
      width: '80px',
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
      name: 'Markup %',
      selector: row => row.custo > 0 ? ((row.venda - row.custo) / row.custo) * 100 : 0,
      cell: row => {
        const markup = row.custo > 0 ? ((row.venda - row.custo) / row.custo) * 100 : 0
        return (
          <span className={styles.badgeNeutro}>
            {markup.toFixed(1)}%
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
      <div key={item.produto} className={styles.mobileItem}>
        <div className={styles.mobileItemHeader}>
          <div>
            {item.obj?.classeMaterial?.nomeClasse && (
              <span className={styles.tagClasse}>{item.obj.classeMaterial.nomeClasse}</span>
            )}
            <span className={styles.mobileProduto}>{item.produto}</span>
          </div>
          <span className={margemPct >= 0 ? styles.badgeSuccess : styles.badgeDanger}>
            {margemPct.toFixed(1)}%
          </span>
        </div>
        <div className={styles.mobileItemBody}>
          <div className={styles.mobileField}><span>Qtd</span><b>{item.quantidade}</b></div>
          <div className={styles.mobileField}><span>Vendas</span><b>{item.quantidadeVendas}</b></div>
          <div className={styles.mobileField}><span>Venda</span><b>{GetCurrencyBRL(item.venda)}</b></div>
          <div className={styles.mobileField}><span>Custo</span><b>{GetCurrencyBRL(item.custo)}</b></div>
          <div className={styles.mobileField}><span>Margem R$</span><b>{GetCurrencyBRL(item.venda - item.custo)}</b></div>
          <div className={styles.mobileField}>
            <span>Markup</span>
            <b>{item.custo > 0 ? (((item.venda - item.custo) / item.custo) * 100).toFixed(1) : '0'}%</b>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>

      {/* Header */}
      <div className={styles.header}>
        <h4 className={styles.title}>Relatório por produto</h4>
        <CustomButton
          onClick={() => ExportToExcel(EXCEL_HEADERS, excelData, 'relatorio-produto')}
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
              <span className={styles.metricLabel}>Qtd vendida</span>
              <span className={styles.metricValue}>{totalQtd.toLocaleString('pt-BR')}</span>
              <span className={styles.metricSub}>unidades</span>
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

          {/* Gráfico — top 10 por venda */}
          {filtered.length > 0 && (
            <div className={styles.chartCard}>
              <span className={styles.chartTitle}>Top 10 produtos por venda</span>
              <ResponsiveContainer width="100%" height={240}>
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
                  <Bar dataKey="Venda" fill="#ada3ff" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="Custo" fill="#679f7d" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className={styles.chartLegend}>
                <span><i className={styles.dotBlue} />Venda</span>
                <span><i className={styles.dotGreen} />Custo</span>
              </div>
            </div>
          )}

          <hr className={styles.divider} />

          {/* Filtro de produto */}
          <div className={styles.searchRow}>
            <InputGroup
              title="Filtrar por produto"
              value={search.searchStr}
              onChange={e => setSearch(prev => ({ ...prev, searchStr: e.currentTarget.value }))}
            />
          </div>

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