import { useContext, useEffect, useState } from "react"
import { startOfMonth, endOfMonth, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfYear, endOfYear, subDays, format } from 'date-fns'
import { api } from "@/services/apiClient"
import { AxiosError } from "axios"
import { toast } from "react-toastify"
import { Spinner } from "react-bootstrap"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
// Mesmo visual dos demais relatorios.
import styles from '../../relatorio/produto/styles.module.scss'
import { InputGroup } from "@/components/ui/InputGroup"
import CustomButton from "@/components/ui/Buttons"
import { GetCurrencyBRL } from "@/utils/functions"
import { AuthContext } from "@/contexts/AuthContext"

type Periodo = 'hoje' | 'semana' | 'ultimos30' | 'mes' | 'ano' | 'personalizado'

interface Totais {
    pedidos: number; receita: number; ticketMedio: number; descontos: number; frete: number
    cancelados: number; entrega: number; retirada: number
}
interface Resposta {
    periodo: { inicio: string; fim: string; dias: number }
    totais: Totais
    anterior: Totais
    serie: { data: string; pedidos: number; receita: number }[]
    cidades: { cidade: string; pedidos: number; receita: number }[]
    bairros: { cidade: string; bairro: string; pedidos: number; receita: number }[]
    pagamentos: { forma: string; pedidos: number; receita: number }[]
    status: { status: string; pedidos: number }[]
    diaSemana: { dia: number; pedidos: number }[]
    horas: { hora: number; pedidos: number }[]
    produtos: { produtoId: number; produto: string; pecas: number; receita: number }[]
    cupons: { codigo: string; usos: number; desconto: number }[]
    clientes: { novasContas: number; compradores: number; recorrentes: number }
}

interface Trafego {
    visitantes: number
    paginas: number
    funil: { visitaram: number; veramProduto: number; sacola: number; checkout: number; pedido: number }
    serie: { data: string; visitantes: number; paginas: number }[]
    origens: { origem: string; sessoes: number }[]
    paginasTop: { caminho: string; visitas: number }[]
    produtos: { produtoId: number; produto: string; visitantes: number; naSacola: number }[]
    buscas: { termo: string; buscas: number; resultados: number }[]
    abandonadas: { sacolas: number; valor: number; lista: { ultima: string; valor: number; cliente: string | null; telefone: string | null; email: string | null; itens: string[] }[] }
}

const PERIODOS: { label: string; value: Periodo }[] = [
    { label: 'Hoje', value: 'hoje' },
    { label: 'Esta semana', value: 'semana' },
    { label: 'Últimos 30 dias', value: 'ultimos30' },
    { label: 'Este mês', value: 'mes' },
    { label: 'Este ano', value: 'ano' },
    { label: 'Personalizado', value: 'personalizado' },
]

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const ROTULO_STATUS: Record<string, string> = {
    NOVO: 'Novos', PREPARANDO: 'Separando', ENTREGANDO: 'Em entrega', PRONTO_PARA_RETIRAR: 'Prontos p/ retirar',
    FINALIZADO: 'Finalizados', CANCELADO: 'Cancelados', SOLICITACAO_CANCELAMENTO: 'Cancelamento solicitado',
}

function intervalo(periodo: Periodo) {
    const agora = new Date()
    const fmt = (d: Date) => format(d, 'yyyy-MM-dd')
    switch (periodo) {
        case 'hoje': return { dateIn: fmt(startOfDay(agora)), dateFim: fmt(endOfDay(agora)) }
        case 'semana': return { dateIn: fmt(startOfWeek(agora, { weekStartsOn: 0 })), dateFim: fmt(endOfWeek(agora, { weekStartsOn: 0 })) }
        case 'ultimos30': return { dateIn: fmt(subDays(agora, 29)), dateFim: fmt(endOfDay(agora)) }
        case 'ano': return { dateIn: fmt(startOfYear(agora)), dateFim: fmt(endOfYear(agora)) }
        default: return { dateIn: fmt(startOfMonth(agora)), dateFim: fmt(endOfMonth(agora)) }
    }
}

// "+12%" / "-5%" contra o periodo anterior; sem base de comparacao, nada.
function Variacao({ atual, anterior }: { atual: number; anterior: number }) {
    if (!anterior) return <span className={styles.metricSub}>sem período anterior</span>
    const pct = ((atual - anterior) / anterior) * 100
    const cor = pct >= 0 ? 'var(--bs-success, #2e7d32)' : 'var(--bs-danger, #c62828)'
    return <span className={styles.metricSub} style={{ color: cor }}>{pct >= 0 ? '▲' : '▼'} {Math.abs(pct).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}% vs. período anterior</span>
}

function Cartao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
    return (
        <div className={styles.metricCard} style={{ alignItems: 'stretch', minWidth: 0 }}>
            <span className={styles.metricLabel} style={{ marginBottom: 8 }}>{titulo}</span>
            {children}
        </div>
    )
}

// Lista "nome ... valor" com barra proporcional (ranking de regioes, produtos, formas de pagamento...).
function Ranking({ linhas, vazio = 'Sem dados no período.' }: { linhas: { chave: string; rotulo: string; sub?: string; valor: number; texto: string }[]; vazio?: string }) {
    if (linhas.length === 0) return <span style={{ fontSize: 13, opacity: 0.7 }}>{vazio}</span>
    const max = Math.max(...linhas.map(l => l.valor), 1)
    return (
        <div style={{ display: 'grid', gap: 8 }}>
            {linhas.map(l => (
                <div key={l.chave}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.rotulo}{l.sub ? <small style={{ opacity: 0.6 }}> · {l.sub}</small> : null}</span>
                        <b style={{ whiteSpace: 'nowrap' }}>{l.texto}</b>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'rgba(128,128,128,.18)', marginTop: 3 }}>
                        <div style={{ width: `${(l.valor / max) * 100}%`, height: '100%', borderRadius: 2, background: 'var(--main, #4a6cf7)' }} />
                    </div>
                </div>
            ))}
        </div>
    )
}

const pct = (parte: number, todo: number) => (todo > 0 ? `${((parte / todo) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : '—')

function BlocoTrafego({ t }: { t: Trafego }) {
    const f = t.funil
    const etapas = [
        { chave: 'v', rotulo: 'Visitaram o site', n: f.visitaram },
        { chave: 'p', rotulo: 'Viram um produto', n: f.veramProduto },
        { chave: 's', rotulo: 'Colocaram na sacola', n: f.sacola },
        { chave: 'c', rotulo: 'Iniciaram o checkout', n: f.checkout },
        { chave: 'o', rotulo: 'Finalizaram o pedido', n: f.pedido },
    ]
    const serie = t.serie.map(x => ({ ...x, rotulo: x.data.slice(8, 10) + '/' + x.data.slice(5, 7) }))
    const semResultado = t.buscas.filter(b => b.resultados === 0)
    const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12, marginTop: 12 } as const
    return (
        <>
            <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                    <span className={styles.metricLabel}>Visitantes</span>
                    <span className={styles.metricValue}>{t.visitantes.toLocaleString('pt-BR')}</span>
                    <span className={styles.metricSub}>{t.paginas.toLocaleString('pt-BR')} páginas vistas</span>
                </div>
                <div className={styles.metricCard}>
                    <span className={styles.metricLabel}>Conversão</span>
                    <span className={styles.metricValue}>{pct(f.pedido, f.visitaram)}</span>
                    <span className={styles.metricSub}>visitantes que compraram</span>
                </div>
                <div className={styles.metricCard}>
                    <span className={styles.metricLabel}>Sacolas abandonadas</span>
                    <span className={styles.metricValue}>{t.abandonadas.sacolas}</span>
                    <span className={styles.metricSub}>≈ {GetCurrencyBRL(t.abandonadas.valor)} deixados na sacola</span>
                </div>
            </div>

            <div style={grid}>
                <Cartao titulo="Funil de compra">
                    <Ranking linhas={etapas.map(e => ({ chave: e.chave, rotulo: e.rotulo, sub: e.chave === 'v' ? undefined : pct(e.n, f.visitaram) + ' dos visitantes', valor: e.n, texto: e.n.toLocaleString('pt-BR') }))} />
                </Cartao>
                <Cartao titulo="De onde vêm as visitas">
                    <Ranking linhas={t.origens.map(o => ({ chave: o.origem, rotulo: o.origem, valor: o.sessoes, texto: o.sessoes.toLocaleString('pt-BR') }))} vazio="Ainda sem dados de origem." />
                </Cartao>
                <Cartao titulo="Produtos mais vistos">
                    <Ranking linhas={t.produtos.map(p => ({ chave: String(p.produtoId), rotulo: p.produto, sub: `${p.naSacola} na sacola`, valor: p.visitantes, texto: `${p.visitantes} visitante${p.visitantes === 1 ? '' : 's'}` }))} />
                </Cartao>
                <Cartao titulo="Páginas mais acessadas">
                    <Ranking linhas={t.paginasTop.map(p => ({ chave: p.caminho, rotulo: p.caminho, valor: p.visitas, texto: p.visitas.toLocaleString('pt-BR') }))} />
                </Cartao>
                <Cartao titulo="O que as clientes buscam">
                    <Ranking linhas={t.buscas.map(b => ({ chave: b.termo, rotulo: b.termo, sub: b.resultados === 0 ? 'nenhum resultado' : undefined, valor: b.buscas, texto: `${b.buscas}x` }))} vazio="Nenhuma busca no período." />
                    {semResultado.length > 0 && (
                        <p style={{ fontSize: 12, margin: '8px 0 0' }}>
                            Buscas sem resultado: {semResultado.map(b => b.termo).join(', ')}. Pode ser peça que a loja ainda não vende.
                        </p>
                    )}
                </Cartao>
            </div>

            <div style={{ marginTop: 12 }}>
                <Cartao titulo="Visitantes por dia">
                    <div style={{ width: '100%', height: 220 }}>
                        <ResponsiveContainer>
                            <AreaChart data={serie} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                                <XAxis dataKey="rotulo" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={24} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={36} />
                                <Tooltip formatter={(v: number) => [v, 'Visitantes']} />
                                <Area type="monotone" dataKey="visitantes" stroke="#8a7a6a" fill="#8a7a6a" fillOpacity={0.2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Cartao>
            </div>

            <div style={{ marginTop: 12 }}>
                <Cartao titulo={`Sacolas abandonadas (${t.abandonadas.sacolas})`}>
                    {t.abandonadas.lista.length === 0 ? (
                        <span style={{ fontSize: 13, opacity: 0.7 }}>Nenhuma sacola abandonada no período.</span>
                    ) : (
                        <div style={{ display: 'grid', gap: 8 }}>
                            {t.abandonadas.lista.map((a, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', fontSize: 13, borderBottom: '1px solid rgba(128,128,128,.2)', paddingBottom: 6 }}>
                                    <span>
                                        <b>{a.cliente ?? 'Visitante sem login'}</b>
                                        {a.telefone ? <> · {a.telefone}</> : null}{a.email ? <> · {a.email}</> : null}
                                        <br /><small style={{ opacity: 0.7 }}>{a.itens.join(', ') || 'Itens'} · {new Date(a.ultima).toLocaleString('pt-BR')}</small>
                                    </span>
                                    <b>{GetCurrencyBRL(a.valor)}</b>
                                </div>
                            ))}
                        </div>
                    )}
                    <p style={{ fontSize: 12, opacity: 0.7, margin: '8px 0 0' }}>
                        Sacola abandonada = colocou peça na sacola e não fez pedido depois. O valor soma tudo que foi colocado, mesmo o que ela removeu depois (aproximado).
                        Sacolas mexidas na última hora ainda não entram. Só aparecem nome e contato de quem estava logada.
                    </p>
                </Cartao>
            </div>
        </>
    )
}

export default function AnalyticsModas() {
    const { getUser } = useContext(AuthContext)
    const [dados, setDados] = useState<Resposta | null>(null)
    const [trafego, setTrafego] = useState<Trafego | null>(null)
    const [trafegoErro, setTrafegoErro] = useState('')
    const [loading, setLoading] = useState(true)
    const [periodo, setPeriodo] = useState<Periodo>('ultimos30')
    const [datas, setDatas] = useState(intervalo('ultimos30'))

    const carregar = async (intervaloUsado = datas) => {
        setLoading(true)
        try {
            // Garante a sessao carregada; a empresa vem do token no backend (nao vai na URL).
            await getUser()
            const { data } = await api.get<Resposta>(
                `/ModasAnalytics/resumo?dataIn=${intervaloUsado.dateIn}&dataFim=${intervaloUsado.dateFim}`
            )
            setDados(data)
            // Trafego e secundario: se falhar (ou o periodo passar de 90 dias), o resto do painel continua.
            setTrafego(null)
            setTrafegoErro('')
            const dias = (new Date(intervaloUsado.dateFim).getTime() - new Date(intervaloUsado.dateIn).getTime()) / 86400000
            if (dias > 90) {
                setTrafegoErro('Os dados de visitas ficam guardados por 90 dias: escolha um período menor para ver o tráfego.')
            } else {
                try {
                    const r = await api.get<Trafego>(`/ModasAnalytics/trafego?dataIn=${intervaloUsado.dateIn}&dataFim=${intervaloUsado.dateFim}`)
                    setTrafego(r.data)
                } catch {
                    setTrafegoErro('Não foi possível carregar os dados de tráfego agora.')
                }
            }
        } catch (err) {
            const e = err as AxiosError
            toast.error(`Erro ao buscar os indicadores. ${e.response?.data || e.message}`)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { carregar() }, [])  // eslint-disable-line react-hooks/exhaustive-deps

    function escolherPeriodo(p: Periodo) {
        setPeriodo(p)
        if (p === 'personalizado') return
        const faixa = intervalo(p)
        setDatas(faixa)
        carregar(faixa)
    }

    const t = dados?.totais
    const a = dados?.anterior
    const serie = (dados?.serie ?? []).map(s => ({ ...s, rotulo: s.data.slice(8, 10) + '/' + s.data.slice(5, 7) }))

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h4 className={styles.title}>Indicadores da loja</h4>
            </div>

            <div className={styles.periodBar}>
                {PERIODOS.map(p => (
                    <button
                        key={p.value}
                        className={`${styles.periodBtn} ${periodo === p.value ? styles.periodBtnActive : ''}`}
                        onClick={() => escolherPeriodo(p.value)}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {periodo === 'personalizado' && (
                <div className={styles.customRange}>
                    <InputGroup type="date" title="Início" value={datas.dateIn} width="180px"
                        onChange={v => setDatas(prev => ({ ...prev, dateIn: v.target.value }))} />
                    <InputGroup type="date" title="Fim" value={datas.dateFim} width="180px"
                        onChange={v => setDatas(prev => ({ ...prev, dateFim: v.target.value }))} />
                    <CustomButton onClick={() => carregar()} typeButton="dark" style={{ marginBottom: 10 }}>
                        Pesquisar
                    </CustomButton>
                </div>
            )}

            <hr className={styles.divider} />

            {loading || !dados || !t || !a ? (
                <div className={styles.loadingWrap}><Spinner /></div>
            ) : (
                <>
                    <div className={styles.metricsGrid}>
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Faturamento</span>
                            <span className={styles.metricValue}>{GetCurrencyBRL(t.receita)}</span>
                            <Variacao atual={t.receita} anterior={a.receita} />
                        </div>
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Pedidos</span>
                            <span className={styles.metricValue}>{t.pedidos.toLocaleString('pt-BR')}</span>
                            <Variacao atual={t.pedidos} anterior={a.pedidos} />
                        </div>
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Ticket médio</span>
                            <span className={styles.metricValue}>{GetCurrencyBRL(t.ticketMedio)}</span>
                            <Variacao atual={t.ticketMedio} anterior={a.ticketMedio} />
                        </div>
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Cancelados</span>
                            <span className={styles.metricValue}>{t.cancelados}</span>
                            <span className={styles.metricSub}>{t.pedidos + t.cancelados > 0 ? `${Math.round((t.cancelados / (t.pedidos + t.cancelados)) * 100)}% dos pedidos` : '—'}</span>
                        </div>
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Entrega × retirada</span>
                            <span className={styles.metricValue}>{t.entrega} / {t.retirada}</span>
                            <span className={styles.metricSub}>pedidos</span>
                        </div>
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Descontos (cupons)</span>
                            <span className={styles.metricValue}>{GetCurrencyBRL(t.descontos)}</span>
                            <span className={styles.metricSub}>frete cobrado: {GetCurrencyBRL(t.frete)}</span>
                        </div>
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Novas contas</span>
                            <span className={styles.metricValue}>{dados.clientes.novasContas}</span>
                            <span className={styles.metricSub}>cadastros no período</span>
                        </div>
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Clientes que compraram</span>
                            <span className={styles.metricValue}>{dados.clientes.compradores}</span>
                            <span className={styles.metricSub}>{dados.clientes.recorrentes} compraram mais de uma vez</span>
                        </div>
                    </div>

                    <hr className={styles.divider} />

                    <Cartao titulo="Faturamento por dia">
                        <div style={{ width: '100%', height: 260 }}>
                            <ResponsiveContainer>
                                <AreaChart data={serie} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                                    <XAxis dataKey="rotulo" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={24} />
                                    <YAxis tick={{ fontSize: 11 }} width={56} tickFormatter={(v: number) => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)} />
                                    <Tooltip formatter={(v: number, nome: string) => nome === 'receita' ? [GetCurrencyBRL(v), 'Faturamento'] : [v, 'Pedidos']} />
                                    <Area type="monotone" dataKey="receita" stroke="#4a6cf7" fill="#4a6cf7" fillOpacity={0.18} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Cartao>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12, marginTop: 12 }}>
                        <Cartao titulo="Cidades que mais compram (entrega)">
                            <Ranking linhas={dados.cidades.map(c => ({ chave: c.cidade, rotulo: c.cidade, sub: `${c.pedidos} ped.`, valor: c.receita, texto: GetCurrencyBRL(c.receita) }))}
                                vazio="Nenhum pedido com entrega no período." />
                        </Cartao>
                        <Cartao titulo="Bairros que mais compram">
                            <Ranking linhas={dados.bairros.map(b => ({ chave: b.cidade + b.bairro, rotulo: b.bairro, sub: `${b.cidade} · ${b.pedidos} ped.`, valor: b.receita, texto: GetCurrencyBRL(b.receita) }))}
                                vazio="Nenhum pedido com entrega no período." />
                        </Cartao>
                        <Cartao titulo="Produtos mais vendidos">
                            <Ranking linhas={dados.produtos.map(p => ({ chave: String(p.produtoId) + p.produto, rotulo: p.produto, sub: GetCurrencyBRL(p.receita), valor: p.pecas, texto: `${p.pecas.toLocaleString('pt-BR')} pç` }))} />
                        </Cartao>
                        <Cartao titulo="Formas de pagamento">
                            <Ranking linhas={dados.pagamentos.map(p => ({ chave: p.forma, rotulo: p.forma, sub: `${p.pedidos} ped.`, valor: p.receita, texto: GetCurrencyBRL(p.receita) }))} />
                        </Cartao>
                        <Cartao titulo="Cupons mais usados">
                            <Ranking linhas={dados.cupons.map(c => ({ chave: c.codigo, rotulo: c.codigo, sub: `desconto ${GetCurrencyBRL(c.desconto)}`, valor: c.usos, texto: `${c.usos} uso${c.usos === 1 ? '' : 's'}` }))}
                                vazio="Nenhum cupom usado no período." />
                        </Cartao>
                        <Cartao titulo="Situação dos pedidos">
                            <Ranking linhas={dados.status.map(s => ({ chave: s.status, rotulo: ROTULO_STATUS[s.status] ?? s.status, valor: s.pedidos, texto: String(s.pedidos) }))} />
                        </Cartao>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12, marginTop: 12 }}>
                        <Cartao titulo="Pedidos por dia da semana">
                            <div style={{ width: '100%', height: 200 }}>
                                <ResponsiveContainer>
                                    <BarChart data={dados.diaSemana.map(d => ({ ...d, rotulo: DIAS[d.dia] }))} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                        <XAxis dataKey="rotulo" tick={{ fontSize: 11 }} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                                        <Tooltip formatter={(v: number) => [v, 'Pedidos']} />
                                        <Bar dataKey="pedidos" fill="#4a6cf7" radius={[3, 3, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Cartao>
                        <Cartao titulo="Pedidos por horário">
                            <div style={{ width: '100%', height: 200 }}>
                                <ResponsiveContainer>
                                    <BarChart data={dados.horas.map(h => ({ ...h, rotulo: `${h.hora}h` }))} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                        <XAxis dataKey="rotulo" tick={{ fontSize: 10 }} interval={2} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                                        <Tooltip formatter={(v: number) => [v, 'Pedidos']} />
                                        <Bar dataKey="pedidos" fill="#8a7a6a" radius={[3, 3, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Cartao>
                    </div>

                    <hr className={styles.divider} />
                    <h5 style={{ margin: '0 0 4px' }}>Tráfego do site</h5>
                    <p style={{ fontSize: 12, opacity: 0.7, margin: '0 0 10px' }}>
                        Conta só quem aceitou os cookies no site, então os números são uma amostra (um mínimo) das visitas reais.
                    </p>
                    {trafegoErro && <p style={{ fontSize: 13 }}>{trafegoErro}</p>}
                    {trafego && <BlocoTrafego t={trafego} />}

                    <p style={{ fontSize: 12, opacity: 0.7, margin: '14px 0 0' }}>
                        Faturamento e pedidos não contam os cancelados. A comparação é com o período anterior, de mesma duração.
                    </p>
                </>
            )}
        </div>
    )
}
