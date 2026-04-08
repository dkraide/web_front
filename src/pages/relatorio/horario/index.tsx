import IVenda from '@/interfaces/IVenda'
import styles from './styles.module.scss'
import { useContext, useEffect, useMemo, useState } from 'react'
import { InputGroup } from '@/components/ui/InputGroup'
import CustomButton from '@/components/ui/Buttons'
import { Spinner } from 'react-bootstrap'
import IUsuario from '@/interfaces/IUsuario'
import { AuthContext } from '@/contexts/AuthContext'
import { endOfDay, endOfMonth, endOfWeek, endOfYear, format, startOfDay, startOfMonth, startOfWeek, startOfYear } from 'date-fns'
import { api } from '@/services/apiClient'
import { AxiosError, AxiosResponse } from 'axios'
import { toast } from 'react-toastify'
import { isMobile } from 'react-device-detect'
import KRDTable, { KRDColumn } from '@/components/ui/KRDTable'
import { ExportToExcel, GetCurrencyBRL, LucroPorcentagem } from '@/utils/functions'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine
} from 'recharts'

type PeriodType = 'hoje' | 'semana' | 'mes' | 'ano' | 'personalizado'

type RelatorioProps = {
  horario: string
  vendaTotal: number
  custoTotal: number
  cancelados: number
  qtd: number
  faturados: number
  vendas: IVenda[]
}

interface SearchProps {
  dateIn: string
  dateFim: string
  period: PeriodType
  str: string
}

const PERIOD_OPTIONS: { label: string; value: PeriodType }[] = [
  { label: 'Hoje',          value: 'hoje' },
  { label: 'Esta semana',   value: 'semana' },
  { label: 'Este mês',      value: 'mes' },
  { label: 'Este ano',      value: 'ano' },
  { label: 'Personalizado', value: 'personalizado' },
]

const EXCEL_HEADERS = [
  { label: 'Horário',    key: 'horario' },
  { label: 'Quantidade', key: 'qtd' },
  { label: 'Venda',      key: 'vendaTotal' },
  { label: 'Custo',      key: 'custoTotal' },
  { label: 'Cancelados', key: 'cancelados' },
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

function agruparVendasPorHora(vendas: IVenda[]): RelatorioProps[] {
  const map: Record<string, RelatorioProps> = {}
  vendas.forEach(venda => {
    const hora    = new Date(venda.dataVenda).getHours()
    const horario = `${hora.toString().padStart(2, '0')}:00`
    if (!map[horario]) {
      map[horario] = { horario, vendaTotal: 0, custoTotal: 0, cancelados: 0, qtd: 0, faturados: 0, vendas: [] }
    }
    if (venda.statusVenda) {
      map[horario].vendaTotal += venda.valorTotal
      map[horario].custoTotal += venda.valorCusto
      map[horario].qtd        += 1
      map[horario].vendas.push(venda)
    } else {
      map[horario].cancelados += venda.valorTotal
    }
    if (venda.estd) map[horario].faturados += 1
  })
  return Object.values(map).sort((a, b) => a.horario.localeCompare(b.horario))
}

function getVendaPorPeriodo(result: RelatorioProps[], periodo: 'MANHA' | 'TARDE' | 'NOITE'): number {
  const ranges = { MANHA: [6, 12], TARDE: [12, 18], NOITE: [18, 24] }
  const [min, max] = ranges[periodo]
  return result
    .filter(r => { const h = parseInt(r.horario); return h >= min && h < max })
    .reduce((acc, r) => acc + r.vendaTotal, 0)
}

export default function RelatorioHorario() {
  const { getUser } = useContext(AuthContext)

  const [result,  setResult]  = useState<RelatorioProps[]>([])
  const [loading, setLoading] = useState(true)
  const [user,    setUser]    = useState<IUsuario>()
  const [search,  setSearch]  = useState<SearchProps>({
    ...getDateRange('mes'),
    period: 'mes',
    str: '',
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
      const { data } = await api.get<IVenda[]>(
        `/Venda/List?empresaId=${u.empresaSelecionada}&dataIn=${dateIn}&dataFim=${dateFim}`
      )
      setResult(agruparVendasPorHora(data))
    } catch (err) {
      const e = err as AxiosError
      toast.error(`Erro ao buscar vendas. ${e.response?.data || e.message}`)
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
    result.filter(r => r.horario.includes(search.str)),
    [result, search.str]
  )

  const totalVenda    = useMemo(() => filtered.reduce((a, r) => a + r.vendaTotal, 0), [filtered])
  const totalCusto    = useMemo(() => filtered.reduce((a, r) => a + r.custoTotal, 0), [filtered])
  const totalQtd      = useMemo(() => filtered.reduce((a, r) => a + r.qtd, 0), [filtered])
  const totalMargem   = totalVenda - totalCusto
  const totalMargemPct = totalVenda > 0 ? (totalMargem / totalVenda) * 100 : 0

  const manha = getVendaPorPeriodo(result, 'MANHA')
  const tarde = getVendaPorPeriodo(result, 'TARDE')
  const noite = getVendaPorPeriodo(result, 'NOITE')

  // hora de pico
  const horaPico = useMemo(() =>
    result.reduce((best, r) => r.vendaTotal > (best?.vendaTotal ?? 0) ? r : best, null as RelatorioProps | null),
    [result]
  )

  const chartData = useMemo(() =>
    filtered.map(r => ({ name: r.horario, Venda: r.vendaTotal, Qtd: r.qtd })),
    [filtered]
  )

  const columns: KRDColumn<RelatorioProps>[] = [
    {
      name: 'Horário',
      selector: row => row.horario,
      sortable: true,
      width: '90px',
    },
    {
      name: 'Qtd',
      selector: row => row.qtd,
      sortable: true,
      right: true,
      width: '70px',
    },
    {
      name: 'Venda',
      selector: row => row.vendaTotal,
      cell: row => GetCurrencyBRL(row.vendaTotal),
      sortable: true,
      right: true,
    },
    {
      name: 'Cancelados',
      selector: row => row.cancelados,
      cell: row => GetCurrencyBRL(row.cancelados),
      sortable: true,
      right: true,
    },
    {
      name: 'Custo',
      selector: row => row.custoTotal,
      cell: row => GetCurrencyBRL(row.custoTotal),
      sortable: true,
      right: true,
    },
    {
      name: 'Margem R$',
      selector: row => row.vendaTotal - row.custoTotal,
      cell: row => GetCurrencyBRL(row.vendaTotal - row.custoTotal),
      sortable: true,
      right: true,
    },
    {
      name: 'Margem %',
      selector: row => LucroPorcentagem(row.vendaTotal, row.custoTotal),
      cell: row => {
        const pct = LucroPorcentagem(row.vendaTotal, row.custoTotal)
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
    const margemPct = LucroPorcentagem(item.vendaTotal, item.custoTotal)
    return (
      <div key={item.horario} className={styles.mobileItem}>
        <div className={styles.mobileItemHeader}>
          <span className={styles.mobileHorario}>{item.horario}</span>
          <span className={margemPct >= 0 ? styles.badgeSuccess : styles.badgeDanger}>
            {margemPct.toFixed(1)}%
          </span>
        </div>
        <div className={styles.mobileItemBody}>
          <div className={styles.mobileField}><span>Qtd</span><b>{item.qtd}</b></div>
          <div className={styles.mobileField}><span>Venda</span><b>{GetCurrencyBRL(item.vendaTotal)}</b></div>
          <div className={styles.mobileField}><span>Custo</span><b>{GetCurrencyBRL(item.custoTotal)}</b></div>
          <div className={styles.mobileField}><span>Cancelados</span><b>{GetCurrencyBRL(item.cancelados)}</b></div>
          <div className={styles.mobileField}><span>Margem</span><b>{GetCurrencyBRL(item.vendaTotal - item.custoTotal)}</b></div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>

      {/* Header */}
      <div className={styles.header}>
        <h4 className={styles.title}>Relatório por horário</h4>
        <CustomButton
          onClick={() => ExportToExcel(EXCEL_HEADERS, result, 'relatorio-horario')}
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
              <span className={styles.metricLabel}>Vendas totais</span>
              <span className={styles.metricValue}>{GetCurrencyBRL(totalVenda)}</span>
              <span className={styles.metricSub}>{totalQtd} transações</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Margem bruta</span>
              <span className={styles.metricValue}>{GetCurrencyBRL(totalMargem)}</span>
              <span className={totalMargemPct >= 0 ? styles.badgeSuccess : styles.badgeDanger}>
                {totalMargemPct.toFixed(1)}%
              </span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Hora de pico</span>
              <span className={styles.metricValue}>{horaPico?.horario ?? '—'}</span>
              <span className={styles.metricSub}>{horaPico ? GetCurrencyBRL(horaPico.vendaTotal) : ''}</span>
            </div>
          </div>

          {/* Cards de período do dia */}
          <div className={styles.periodGrid}>
            <div className={styles.periodCard}>
              <span className={styles.periodIcon}>☀</span>
              <div>
                <span className={styles.periodCardLabel}>Manhã</span>
                <span className={styles.periodCardValue}>{GetCurrencyBRL(manha)}</span>
                <span className={styles.periodCardSub}>06:00 – 12:00</span>
              </div>
            </div>
            <div className={styles.periodCard}>
              <span className={styles.periodIcon}>⛅</span>
              <div>
                <span className={styles.periodCardLabel}>Tarde</span>
                <span className={styles.periodCardValue}>{GetCurrencyBRL(tarde)}</span>
                <span className={styles.periodCardSub}>12:00 – 18:00</span>
              </div>
            </div>
            <div className={styles.periodCard}>
              <span className={styles.periodIcon}>🌙</span>
              <div>
                <span className={styles.periodCardLabel}>Noite</span>
                <span className={styles.periodCardValue}>{GetCurrencyBRL(noite)}</span>
                <span className={styles.periodCardSub}>18:00 – 24:00</span>
              </div>
            </div>
          </div>

          {/* Gráfico */}
          {result.length > 0 && (
            <div className={styles.chartCard}>
              <span className={styles.chartTitle}>Venda por horário</span>
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
                    formatter={(v: number, name: string) =>
                      name === 'Venda' ? GetCurrencyBRL(v) : v
                    }
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '0.5px solid #e0d8e1' }}
                  />
                  {horaPico && (
                    <ReferenceLine
                      x={horaPico.horario}
                      stroke="#fc4f6b"
                      strokeDasharray="4 2"
                      label={{ value: 'pico', position: 'top', fontSize: 10, fill: '#fc4f6b' }}
                    />
                  )}
                  <Bar dataKey="Venda" fill="#ada3ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className={styles.chartLegend}>
                <span><i className={styles.dotBlue} />Venda</span>
                <span className={styles.legendPico}><i className={styles.dotMain} />Hora de pico</span>
              </div>
            </div>
          )}

          <hr className={styles.divider} />

          {/* Filtro de horário */}
          <div className={styles.searchRow}>
            <InputGroup
              title="Filtrar por horário"
              value={search.str}
              onChange={v => setSearch(prev => ({ ...prev, str: v.currentTarget.value }))}
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
              pagination={false}
            />
          )}
        </>
      )}
    </div>
  )
}