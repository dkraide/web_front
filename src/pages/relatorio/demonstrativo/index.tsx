import { useContext, useEffect, useState, useMemo } from 'react'
import styles from './styles.module.scss'
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfYear, endOfYear } from 'date-fns'
import IUsuario from '@/interfaces/IUsuario'
import { AuthContext } from '@/contexts/AuthContext'
import { AxiosError, AxiosResponse } from 'axios'
import { api } from '@/services/apiClient'
import { toast } from 'react-toastify'
import IDespesa from '@/interfaces/IDespesa'
import _ from 'lodash'
import { InputGroup } from '@/components/ui/InputGroup'
import CustomButton from '@/components/ui/Buttons'
import { Spinner } from 'react-bootstrap'
import SelectSimNao from '@/components/Selects/SelectSimNao'
import { ExportToExcel, GetCurrencyBRL } from '@/utils/functions'

type PeriodType = 'hoje' | 'semana' | 'mes' | 'ano' | 'personalizado'

interface SearchProps {
  dateIn: string
  dateFim: string
  period: PeriodType
  incluiEmHaver: boolean
  calculaCusto: boolean
}

interface VendaProps {
  forma: string
  quantidade: number
  venda: number
  custo: number
}

const PERIOD_OPTIONS: { label: string; value: PeriodType }[] = [
  { label: 'Hoje',         value: 'hoje' },
  { label: 'Esta semana',  value: 'semana' },
  { label: 'Este mês',     value: 'mes' },
  { label: 'Este ano',     value: 'ano' },
  { label: 'Personalizado', value: 'personalizado' },
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

const EXPENSE_GROUPS = [
  { key: 'DESPESA FIXA',     label: 'Despesas fixas',     rowClass: 'groupFixa' },
  { key: 'DESPESA VARIAVEL', label: 'Despesas variáveis', rowClass: 'groupVariavel' },
  { key: 'TAXAS E TRIBUTOS', label: 'Taxas e tributos',   rowClass: 'groupTaxa' },
  { key: 'OUTROS',           label: 'Outras despesas',    rowClass: 'groupOutro' },
] as const

const CSV_HEADERS = [
  { label: 'Razão',    key: 'razao' },
  { label: 'Entradas', key: 'entrada' },
  { label: 'Saídas',   key: 'saida' },
  { label: '% Fat',    key: 'fat' },
]

export default function Demonstrativo() {
  const { getUser } = useContext(AuthContext)

  const [search,   setSearch]   = useState<SearchProps>({ ...getDateRange('mes'), period: 'mes', incluiEmHaver: false, calculaCusto: false })
  const [user,     setUser]     = useState<IUsuario>()
  const [loading,  setLoading]  = useState(true)
  const [despesas, setDespesas] = useState<IDespesa[]>([])
  const [vendas,   setVendas]   = useState<VendaProps[]>([])

  useEffect(() => { loadData() }, [])

  const getUsuario = async () => {
    if (user) return user
    const res = await getUser()
    setUser(res)
    return res
  }

  const loadData = async (overrideSearch?: Partial<SearchProps>) => {
    const s = { ...search, ...overrideSearch }
    setLoading(true)
    try {
      const u = await getUsuario()
      const status = s.incluiEmHaver ? 0 : 3
      const [despRes, vendRes] = await Promise.all([
        api.get(`/Despesa/List?status=${status}&empresaId=${u.empresaSelecionada}&dataIn=${s.dateIn}&dataFim=${s.dateFim}`),
        api.get(`/Relatorio/FormaPagamento?empresaId=${u.empresaSelecionada}&dataIn=${s.dateIn}&dataFim=${s.dateFim}`),
      ])
      setDespesas(despRes.data)
      setVendas(vendRes.data)
    } catch (err) {
      const e = err as AxiosError
      toast.error(`Erro ao buscar dados. ${e.response?.data || e.message}`)
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

  const totalEntradas = useMemo(() => _.sumBy(vendas, 'venda'), [vendas])

  const totalSaidas = useMemo(() => {
    const des = _.sumBy(despesas, 'valorTotal')
    const custo = search.calculaCusto ? _.sumBy(vendas, 'custo') : 0
    return des + custo
  }, [despesas, vendas, search.calculaCusto])

  const totalResultado = totalEntradas - totalSaidas

  function getPct(valor: number) {
    if (!totalEntradas) return '0,00%'
    return `${((valor / totalEntradas) * 100).toFixed(2)}%`
  }

  function sumByGroup(key: string) {
    return _.sumBy(despesas, v => v.tipoDespesa.toUpperCase() === key ? v.valorTotal : 0)
  }

  function getExportData() {
    const rows: object[] = []
    rows.push({ razao: 'ENTRADAS', entrada: '', saida: '', fat: '' })
    vendas.forEach(v => rows.push({ razao: v.forma, entrada: v.venda.toFixed(2), saida: '', fat: getPct(v.venda) }))
    EXPENSE_GROUPS.forEach(g => {
      rows.push({ razao: g.label.toUpperCase(), entrada: '', saida: '', fat: '' })
      despesas.filter(d => d.tipoDespesa.toUpperCase() === g.key).forEach(d =>
        rows.push({ razao: d.descricao || d.motivoLancamento?.nome || 'N/D', entrada: '', saida: d.valorTotal.toFixed(2), fat: getPct(d.valorTotal) })
      )
    })
    if (search.calculaCusto) {
      rows.push({ razao: 'CUSTO PRODUTO', entrada: '', saida: _.sumBy(vendas, 'custo').toFixed(2), fat: getPct(_.sumBy(vendas, 'custo')) })
    }
    rows.push({ razao: 'RESULTADO', entrada: totalEntradas.toFixed(2), saida: totalSaidas.toFixed(2), fat: '' })
    return rows
  }

  return (
    <div className={styles.container}>

      {/* Header */}
      <div className={styles.header}>
        <h4 className={styles.title}>Demonstrativo de resultado</h4>
        <CustomButton onClick={() => ExportToExcel(CSV_HEADERS, getExportData(), 'demonstrativo')} typeButton="dark">
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

      {/* Filtros adicionais */}
      <div className={styles.filtersRow}>
        <SelectSimNao title="Despesa em aberto" width="200px"
          selected={search.incluiEmHaver}
          setSelected={v => setSearch(prev => ({ ...prev, incluiEmHaver: v }))} />
        <SelectSimNao title="Calcula custo produto" width="200px"
          selected={search.calculaCusto}
          setSelected={v => setSearch(prev => ({ ...prev, calculaCusto: v }))} />
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
              <span className={styles.metricLabel}>Entradas</span>
              <span className={styles.metricValue}>{GetCurrencyBRL(totalEntradas)}</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Saídas</span>
              <span className={styles.metricValue}>{GetCurrencyBRL(totalSaidas)}</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Resultado</span>
              <span className={styles.metricValue}>{GetCurrencyBRL(totalResultado)}</span>
              <span className={totalResultado >= 0 ? styles.badgeSuccess : styles.badgeDanger}>
                {getPct(Math.abs(totalResultado))}
              </span>
            </div>
          </div>

          {/* Tabela demonstrativa */}
          <div className={styles.tableWrap}>
            <table className={styles.demoTable}>
              <thead>
                <tr className={styles.thead}>
                  <th style={{ width: '55%' }}>Razão</th>
                  <th style={{ width: '15%' }}>Entrada</th>
                  <th style={{ width: '15%' }}>Saída</th>
                  <th style={{ width: '15%' }}>% Fat.</th>
                </tr>
              </thead>
              <tbody>

                {/* ── ENTRADAS ── */}
                <tr className={styles.groupHeader}>
                  <td colSpan={4}>Entradas</td>
                </tr>
                {vendas.map((venda, i) => (
                  <tr key={i} className={styles.groupRowEntrada}>
                    <td>{venda.forma}</td>
                    <td>{GetCurrencyBRL(venda.venda)}</td>
                    <td>—</td>
                    <td>{getPct(venda.venda)}</td>
                  </tr>
                ))}

                {/* ── GRUPOS DE DESPESA ── */}
                {EXPENSE_GROUPS.map(g => {
                  const items = despesas.filter(d => d.tipoDespesa.toUpperCase() === g.key)
                  if (!items.length) return null
                  return (
                    <>
                      <tr key={g.key} className={`${styles.groupHeader} ${styles[g.rowClass]}`}>
                        <td colSpan={4}>{g.label}</td>
                      </tr>
                      {items.map((d, i) => (
                        <tr key={i} className={`${styles.groupRow} ${styles[g.rowClass]}`}>
                          <td>{d.descricao || d.motivoLancamento?.nome || 'N/D'}</td>
                          <td>—</td>
                          <td>{GetCurrencyBRL(d.valorTotal)}</td>
                          <td>{getPct(d.valorTotal)}</td>
                        </tr>
                      ))}
                    </>
                  )
                })}

                {/* ── CUSTO PRODUTO ── */}
                {search.calculaCusto && (
                  <>
                    <tr className={`${styles.groupHeader} ${styles.groupOutro}`}>
                      <td colSpan={4}>Custo produto</td>
                    </tr>
                    <tr className={`${styles.groupRow} ${styles.groupOutro}`}>
                      <td>Custo total dos produtos vendidos</td>
                      <td>—</td>
                      <td>{GetCurrencyBRL(_.sumBy(vendas, 'custo'))}</td>
                      <td>{getPct(_.sumBy(vendas, 'custo'))}</td>
                    </tr>
                  </>
                )}

                {/* ── TOTALIZADORES ── */}
                <tr className={styles.totalSeparator}><td colSpan={4} /></tr>

                <tr className={styles.totalRow}>
                  <td>Entradas</td>
                  <td>{GetCurrencyBRL(totalEntradas)}</td>
                  <td>—</td>
                  <td>—</td>
                </tr>
                {EXPENSE_GROUPS.map(g => {
                  const total = sumByGroup(g.key)
                  if (!total) return null
                  return (
                    <tr key={g.key} className={styles.totalRow}>
                      <td>{g.label}</td>
                      <td>—</td>
                      <td>{GetCurrencyBRL(total)}</td>
                      <td>{getPct(total)}</td>
                    </tr>
                  )
                })}
                {search.calculaCusto && (
                  <tr className={styles.totalRow}>
                    <td>Custo produto</td>
                    <td>—</td>
                    <td>{GetCurrencyBRL(_.sumBy(vendas, 'custo'))}</td>
                    <td>{getPct(_.sumBy(vendas, 'custo'))}</td>
                  </tr>
                )}

                {/* ── RESULTADO FINAL ── */}
                <tr className={totalResultado >= 0 ? styles.resultadoPos : styles.resultadoNeg}>
                  <td><b>Resultado</b></td>
                  <td>{GetCurrencyBRL(totalEntradas)}</td>
                  <td>{GetCurrencyBRL(totalSaidas)}</td>
                  <td>{getPct(Math.abs(totalResultado))}</td>
                </tr>

              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}