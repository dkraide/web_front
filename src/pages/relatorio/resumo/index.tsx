'use client';

import { useContext, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { vendaService } from '@/services/vendaService';
import styles from './styles.module.scss';
import { AuthContext } from '@/contexts/AuthContext';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Periodo = 'hoje' | 'semana' | 'mes' | 'ano' | 'custom';
type StatusFiltro = 0 | 1 | 2;
type NfeFiltro = 0 | 1 | 2;
type LucroTipo = 'RS' | 'P';

interface Produto {
  nomeProduto: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

interface Pagamento {
  descricao: string;
  valor: number;
}

interface Venda {
  id: number;
  dataVenda: string;
  valorTotal: number;
  statusVenda: number;
  estd: boolean;
  produtos: Produto[];
  pagamentos: Pagamento[];
}

// ─── Utilitários ──────────────────────────────────────────────────────────────

function calcularDatas(
  periodo: Periodo,
  customIn: string,
  customFim: string
): { dataIn: string; dataFim: string } {
  const hoje = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];

  if (periodo === 'hoje') {
    return { dataIn: fmt(hoje), dataFim: fmt(hoje) };
  }
  if (periodo === 'semana') {
    const ini = new Date(hoje);
    ini.setDate(hoje.getDate() - 6);
    return { dataIn: fmt(ini), dataFim: fmt(hoje) };
  }
  if (periodo === 'mes') {
    const ini = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    return { dataIn: fmt(ini), dataFim: fmt(hoje) };
  }
  if (periodo === 'ano') {
    const ini = new Date(hoje.getFullYear(), 0, 1);
    return { dataIn: fmt(ini), dataFim: fmt(hoje) };
  }
  return { dataIn: customIn, dataFim: customFim };
}

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtBRLCompact = (v: number) =>
  v >= 1000 ? `R$${(v / 1000).toFixed(1)}k` : `R$${v.toFixed(0)}`;

// ─── Agregação (tudo no front) ─────────────────────────────────────────────

function useVendasAgregadas(
  vendas: Venda[] | null,
  statusFiltro: StatusFiltro,
  nfeFiltro: NfeFiltro
) {
  return useMemo(() => {
    if (!vendas?.length)
      return {
        totalValor: 0,
        totalQtd: 0,
        canceladas: 0,
        valorCancelado: 0,
        ticketMedio: 0,
        nfeEmitidas: 0,
        orcamentos: 0,
        porDia: [],
        top5Dias: [],
        produtosRS: [],
        produtosQtd: [],
        produtosLucro: [],
        pgtoQtd: [],
        pgtoValor: [],
      };

    // Filtra por status
    const filtradas = vendas.filter((v) => {
      const statusOk =
        statusFiltro === 0 ||
        (statusFiltro === 1 && v.statusVenda !== 2) ||
        (statusFiltro === 2 && v.statusVenda === 2);

      const nfeOk =
        nfeFiltro === 0 ||
        (nfeFiltro === 1 && v.estd === true) ||
        (nfeFiltro === 2 && v.estd === false);

      return statusOk && nfeOk;
    });

    const normais = filtradas.filter((v) => v.statusVenda !== 2);
    const canceladasList = vendas.filter((v) => v.statusVenda === 2);

    const totalValor = normais.reduce((acc, v) => acc + (v.valorTotal ?? 0), 0);
    const totalQtd = normais.length;
    const canceladas = canceladasList.length;
    const valorCancelado = canceladasList.reduce(
      (acc, v) => acc + (v.valorTotal ?? 0),
      0
    );
    const ticketMedio = totalQtd > 0 ? totalValor / totalQtd : 0;
    const nfeEmitidas = filtradas.filter((v) => v.estd === true).length;
    const orcamentos = filtradas.filter((v) => v.estd === false).length;

    // Por dia
    const mapasDia = new Map<string, number>();
    normais.forEach((v) => {
      const dia = v.dataVenda.split('T')[0].split('-').reverse().slice(0, 2).join('/');
      mapasDia.set(dia, (mapasDia.get(dia) ?? 0) + v.valorTotal);
    });
    const diasOrdenados = Array.from(mapasDia.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
    let acumulado = 0;
    const porDia = diasOrdenados.map(([dia, valor]) => {
      acumulado += valor;
      return { dia, valor: Math.round(valor), acumulado: Math.round(acumulado) };
    });
    const top5Dias = [...diasOrdenados]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([dia, valor]) => ({ dia, valor: Math.round(valor) }));

    // Por produto
    const mapaProdRS = new Map<string, number>();
    const mapaProdQtd = new Map<string, number>();
    const mapaProdCusto = new Map<string, number>();

    normais.forEach((v) => {
      v.produtos?.forEach((p) => {
        mapaProdRS.set(p.nomeProduto, (mapaProdRS.get(p.nomeProduto) ?? 0) + p.valorTotal);
        mapaProdQtd.set(p.nomeProduto, (mapaProdQtd.get(p.nomeProduto) ?? 0) + p.quantidade);
        // Lucro bruto estimado: valorTotal - (valorUnitario * 0.7 * quantidade)
        // Ajuste o fator de custo conforme sua regra de negócio
        const custo = p.valorUnitario * 0.7 * p.quantidade;
        mapaProdCusto.set(p.nomeProduto, (mapaProdCusto.get(p.nomeProduto) ?? 0) + custo);
      });
    });

    const produtosRS = Array.from(mapaProdRS.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([nome, valor]) => ({ nome, valor: Math.round(valor) }));

    const produtosQtd = Array.from(mapaProdQtd.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([nome, qtd]) => ({ nome, qtd }));

    const produtosLucro = Array.from(mapaProdRS.entries())
      .map(([nome, receita]) => {
        const custo = mapaProdCusto.get(nome) ?? 0;
        const lucroRS = Math.round(receita - custo);
        const lucroP = receita > 0 ? Math.round(((receita - custo) / receita) * 1000) / 10 : 0;
        return { nome, lucroRS, lucroP, valor: lucroRS };
      })
      .sort((a, b) => b.lucroRS - a.lucroRS)
      .slice(0, 8);

    // Por pagamento
    const mapaPgtoQtd = new Map<string, number>();
    const mapaPgtoValor = new Map<string, number>();

    normais.forEach((v) => {
      v.pagamentos?.forEach((p) => {
        mapaPgtoQtd.set(p.descricao, (mapaPgtoQtd.get(p.descricao) ?? 0) + 1);
        mapaPgtoValor.set(p.descricao, (mapaPgtoValor.get(p.descricao) ?? 0) + p.valor);
      });
    });

    const pgtoQtd = Array.from(mapaPgtoQtd.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));

    const pgtoValor = Array.from(mapaPgtoValor.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value: Math.round(value) }));

    return {
      totalValor,
      totalQtd,
      canceladas,
      valorCancelado,
      ticketMedio,
      nfeEmitidas,
      orcamentos,
      porDia,
      top5Dias,
      produtosRS,
      produtosQtd,
      produtosLucro,
      pgtoQtd,
      pgtoValor,
    };
  }, [vendas, statusFiltro, nfeFiltro]);
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

// Cores fixas para os gráficos Recharts (não leem CSS vars)
const CHART_COLORS = {
  grid: 'rgba(255,255,255,0.08)',
  tick: '#94a3b8',
  line1: '#6366f1',   // azul/indigo — visível em dark e light
  line2: '#4ade80',   // verde
  bar1: '#6366f1',
  bar2: '#4ade80',
  bar3: '#f59e0b',
};

function CustomTooltipBRL({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      {label && <p className={styles.tooltipLabel}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? fmtBRL(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.06) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos((-midAngle * Math.PI) / 180);
  const y = cy + r * Math.sin((-midAngle * Math.PI) / 180);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={500}>
      {(percent * 100).toFixed(0)}%
    </text>
  );
}

const CORES_PIE = ['#378ADD', '#1D9E75', '#BA7517', '#D4537E', '#7F77DD', '#D85A30'];

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Resumo() {
  const [periodo, setPeriodo] = useState<Periodo>('semana');
  const [customIn, setCustomIn] = useState('');
  const [customFim, setCustomFim] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>(1);
  const [nfeFiltro, setNfeFiltro] = useState<NfeFiltro>(0);
  const [lucroTipo, setLucroTipo] = useState<LucroTipo>('RS');
  const [vendas, setVendas] = useState<Venda[] | null>(null);
  const [loading, setLoading] = useState(false);
  const  [empresaId, setEmpresaId] = useState(0);
  const {getUser} = useContext(AuthContext);

  useEffect(() => {
      const loadEmpresaId = async  () => {
        const user = await getUser();
        setEmpresaId(user.empresaSelecionada);

      }
      loadEmpresaId();

  }, [])

  const { dataIn, dataFim } = useMemo(
    () => calcularDatas(periodo, customIn, customFim),
    [periodo, customIn, customFim]
  );

  const podeCarregar = empresaId > 0 && (periodo !== 'custom' || (!!customIn && !!customFim));

  // Carrega ao mudar datas (você pode trocar por useEffect + useQuery se preferir)
  const carregarDados = async () => {
    if (!podeCarregar) return;
    setLoading(true);
    try {
      const data = await vendaService.listVendas(empresaId, dataIn, dataFim, true);
      setVendas(data);
    } finally {
      setLoading(false);
    }
  };

  // Dispara automaticamente quando período ou empresa mudam
  useMemo(() => {
    if (podeCarregar) carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataIn, dataFim, empresaId]);

  const ag = useVendasAgregadas(vendas, statusFiltro, nfeFiltro);

  const maxTop5 = ag.top5Dias[0]?.valor ?? 1;

  const lucroData = useMemo(
    () => ag.produtosLucro.map((p) => ({ ...p, valor: lucroTipo === 'RS' ? p.lucroRS : p.lucroP })),
    [ag.produtosLucro, lucroTipo]
  );

  const periodos: { id: Periodo; label: string }[] = [
    { id: 'hoje', label: 'Hoje' },
    { id: 'semana', label: 'Semana' },
    { id: 'mes', label: 'Mês' },
    { id: 'ano', label: 'Ano' },
    { id: 'custom', label: 'Personalizado' },
  ];

  return (
    <div className={styles.container}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <h1>Relatório de Vendas</h1>
        <p>Resumo consolidado do período selecionado</p>
      </div>

      {/* ── Filtros ── */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Período</span>
          <div className={styles.periodBtns}>
            {periodos.map((p) => (
              <button
                key={p.id}
                className={`${styles.periodBtn} ${periodo === p.id ? styles.active : ''}`}
                onClick={() => setPeriodo(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {periodo === 'custom' && (
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Intervalo</span>
            <div className={styles.customDates}>
              <input type="date" value={customIn} onChange={(e) => setCustomIn(e.target.value)} />
              <span className={styles.dateSep}>até</span>
              <input type="date" value={customFim} onChange={(e) => setCustomFim(e.target.value)} />
            </div>
          </div>
        )}

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Status</span>
          <select value={statusFiltro} onChange={(e) => setStatusFiltro(Number(e.target.value) as StatusFiltro)}>
            <option value={0}>Todas</option>
            <option value={1}>Normais</option>
            <option value={2}>Canceladas</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>NF-e</span>
          <select value={nfeFiltro} onChange={(e) => setNfeFiltro(Number(e.target.value) as NfeFiltro)}>
            <option value={0}>Todas</option>
            <option value={1}>Emitidas</option>
            <option value={2}>Orçamentos</option>
          </select>
        </div>
      </div>

      {loading && <div className={styles.loadingBar} />}

      {/* ── Resumo total ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Resumo total</h2>
        <div className={styles.cardsGrid}>
          <div className={`${styles.metricCard} ${styles.green}`}>
            <div className={styles.metricLabel}>Total vendas</div>
            <div className={styles.metricValue}>{fmtBRL(ag.totalValor)}</div>
            <div className={styles.metricSub}>{ag.totalQtd} vendas normais</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Ticket médio</div>
            <div className={styles.metricValue}>{fmtBRL(ag.ticketMedio)}</div>
            <div className={styles.metricSub}>por venda</div>
          </div>
          <div className={`${styles.metricCard} ${styles.red}`}>
            <div className={styles.metricLabel}>Cancelamentos</div>
            <div className={styles.metricValue}>{ag.canceladas}</div>
            <div className={styles.metricSub}>{fmtBRL(ag.valorCancelado)}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>NF-e emitidas</div>
            <div className={styles.metricValue}>{ag.nfeEmitidas}</div>
            <div className={styles.metricSub}>
              {ag.nfeEmitidas + ag.orcamentos > 0
                ? ((ag.nfeEmitidas / (ag.nfeEmitidas + ag.orcamentos)) * 100).toFixed(1) + '%'
                : '—'}
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Orçamentos</div>
            <div className={styles.metricValue}>{ag.orcamentos}</div>
            <div className={styles.metricSub}>sem NF-e</div>
          </div>
        </div>
      </div>

      <div className={styles.divider} />

      {/* ── Por dia ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Vendas por dia</h2>
        <div className={styles.rowLayout}>
          <div className={styles.col30}>
            <div className={styles.cardBox}>
              <h3>Top 5 melhores dias</h3>
              {ag.top5Dias.map((d, i) => (
                <div key={i} className={styles.top5Item}>
                  <div>
                    <div className={styles.top5Row}>
                      <span className={styles.rank}>#{i + 1}</span>
                      <span className={styles.top5Date}>{d.dia}</span>
                    </div>
                    <div className={styles.top5Bar}>
                      <div
                        className={styles.top5BarFill}
                        style={{ width: `${Math.round((d.valor / maxTop5) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className={styles.top5Amt}>{fmtBRLCompact(d.valor)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.col70}>
            <div className={styles.cardBox}>
              <h3>Evolução progressiva</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={ag.porDia} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                  <XAxis dataKey="dia" tick={{ fontSize: 11, fill: CHART_COLORS.tick }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: CHART_COLORS.tick }} axisLine={false} tickLine={false} tickFormatter={fmtBRLCompact} width={56} />
                  <Tooltip content={<CustomTooltipBRL />} />
                  <Legend wrapperStyle={{ fontSize: 12, color: CHART_COLORS.tick }} />
                  <Line type="monotone" dataKey="valor" name="Dia" stroke={CHART_COLORS.line1} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="acumulado" name="Acumulado" stroke={CHART_COLORS.line2} strokeWidth={2} strokeDasharray="5 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.divider} />

      {/* ── Por produto ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Vendas por produto</h2>
        <div className={styles.graficosProdutos}>

          <div className={styles.cardBox}>
            <h3>Mais vendidos (R$)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ag.produtosRS} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: CHART_COLORS.tick }} axisLine={false} tickLine={false} tickFormatter={fmtBRLCompact} />
                <YAxis type="category" dataKey="nome" tick={{ fontSize: 10, fill: CHART_COLORS.tick }} axisLine={false} tickLine={false} width={90} />
                <Tooltip content={<CustomTooltipBRL />} />
                <Bar dataKey="valor" name="Vendas (R$)" fill={CHART_COLORS.bar1} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.cardBox}>
            <h3>Mais vendidos (qtd)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ag.produtosQtd} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: CHART_COLORS.tick }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="nome" tick={{ fontSize: 10, fill: CHART_COLORS.tick }} axisLine={false} tickLine={false} width={90} />
                <Tooltip />
                <Bar dataKey="qtd" name="Unidades" fill={CHART_COLORS.bar2} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.cardBox}>
            <h3>Mais lucrativos</h3>
            <div className={styles.chartToggle}>
              <button
                className={`${styles.toggleBtn} ${lucroTipo === 'RS' ? styles.active : ''}`}
                onClick={() => setLucroTipo('RS')}
              >
                R$
              </button>
              <button
                className={`${styles.toggleBtn} ${lucroTipo === 'P' ? styles.active : ''}`}
                onClick={() => setLucroTipo('P')}
              >
                %
              </button>
            </div>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={lucroData} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: CHART_COLORS.tick }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (lucroTipo === 'RS' ? fmtBRLCompact(v) : `${v}%`)}
                />
                <YAxis type="category" dataKey="nome" tick={{ fontSize: 10, fill: CHART_COLORS.tick }} axisLine={false} tickLine={false} width={90} />
                <Tooltip
                  formatter={(v: number) =>
                    [lucroTipo === 'RS' ? fmtBRL(v) : `${v.toFixed(1)}%`, 'Lucro']
                  }
                />
                <Bar dataKey="valor" name="Lucro" fill={CHART_COLORS.bar3} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className={styles.divider} />

      {/* ── Por pagamento ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Por forma de pagamento</h2>
        <div className={styles.graficosPgto}>

          <div className={styles.cardBox}>
            <h3>Por quantidade</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={ag.pgtoQtd}
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  dataKey="value"
                  nameKey="name"
                  labelLine={false}
                  label={<PieLabel />}
                >
                  {ag.pgtoQtd.map((_, i) => (
                    <Cell key={i} fill={CORES_PIE[i % CORES_PIE.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number, n: string) => [`${v} vendas`, n]} />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.cardBox}>
            <h3>Por valor (R$)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={ag.pgtoValor}
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  dataKey="value"
                  nameKey="name"
                  labelLine={false}
                  label={<PieLabel />}
                >
                  {ag.pgtoValor.map((_, i) => (
                    <Cell key={i} fill={CORES_PIE[i % CORES_PIE.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number, n: string) => [fmtBRL(v), n]} />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}