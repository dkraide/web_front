import { useContext, useEffect, useMemo, useState } from "react"
import { startOfMonth, endOfMonth, format } from "date-fns"
import { AxiosError, AxiosResponse } from "axios"
import { toast } from "react-toastify"
import Select from "react-select"
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell
} from "recharts"
import { api } from "@/services/apiClient"
import { AuthContext } from "@/contexts/AuthContext"
import IUsuario from "@/interfaces/IUsuario"
import ICliente from "@/interfaces/ICliente"
import { InputGroup } from "@/components/ui/InputGroup"
import CustomButton from "@/components/ui/Buttons"
import ListaResponsiva, { useTelaEstreita } from "@/components/Recebiveis/ListaResponsiva"
import { CardTotais, CardParcela, COR, SITUACAO, Totais, Parcela, Situacao } from "@/components/Recebiveis/Cards"
import { GetCurrencyBRL } from "@/utils/functions"
import styles from "./styles.module.scss"

interface Recebiveis {
    resumo: Totais
    vencidoForaDoPeriodo: number
    clientes: { clienteId: number, nome: string, totais: Totais }[]
    pagamentos: { forma: string, totais: Totais }[]
    fiscal: { faturadas: Totais, orcamentos: Totais }
    parcelas: Parcela[]
}
interface Filtros {
    dataIn: string
    dataFim: string
    clienteId: number
    statusNf: string
    statusVendas: string
    statusPagamento: string
    tipoData: string
}

const COR_FISCAL = { faturada: "#2f6fdb", orcamento: "#9b59b6" }
const PALETA = ["#2f6fdb", "#2e9e5b", "#e0a800", "#9b59b6", "#d64545", "#17a2b8", "#8a8f98"]

const fmtData = (iso: string) => format(new Date(iso), "dd/MM/yyyy")
const moeda = (v: number) => GetCurrencyBRL(v)
const moedaCurta = (v: number) => v >= 1000 ? `R$ ${(v / 1000).toFixed(1).replace(".", ",")}k` : `R$ ${v.toFixed(0)}`

function Kpi({ titulo, valor, sub, cor }: { titulo: string, valor: string, sub?: string, cor: string }) {
    return (
        <div className={styles.kpi} style={{ ["--kpi-color" as any]: cor }}>
            <div className={styles.kpiTitle}>{titulo}</div>
            <div className={styles.kpiValue}>{valor}</div>
            {sub && <div className={styles.kpiSub}>{sub}</div>}
        </div>
    )
}

function Balanco({ totais }: { totais: Totais }) {
    const dados = [
        { name: "Pago", value: totais.pago, cor: COR.pago },
        { name: "A vencer", value: totais.aVencer, cor: COR.aVencer },
        { name: "Vencido", value: totais.vencido, cor: COR.vencido },
        { name: "Cancelado", value: totais.cancelado, cor: COR.cancelado },
    ].filter(d => d.value > 0)
    if (dados.length == 0) return <div className={styles.vazio}>Sem valores para exibir.</div>
    return (
        <ResponsiveContainer width="100%" height={280}>
            <PieChart>
                <Pie data={dados} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}
                    label={(e: any) => `${(e.percent * 100).toFixed(0)}%`}>
                    {dados.map(d => <Cell key={d.name} fill={d.cor} />)}
                </Pie>
                <Tooltip formatter={(v: number) => moeda(v)} />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    )
}

function BarrasEmpilhadas({ dados, categoria }: { dados: any[], categoria: string }) {
    const estreita = useTelaEstreita()
    if (dados.length == 0) return <div className={styles.vazio}>Sem dados para exibir.</div>
    return (
        <ResponsiveContainer width="100%" height={Math.max(260, dados.length * 38 + 60)}>
            <BarChart data={dados} layout="vertical" margin={{ left: 0, right: estreita ? 5 : 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={moedaCurta} />
                <YAxis type="category" dataKey={categoria} width={estreita ? 80 : 130} tick={{ fontSize: estreita ? 10 : 12 }} />
                <Tooltip formatter={(v: number) => moeda(v)} />
                <Legend />
                <Bar dataKey="pago" name="Pago" stackId="a" fill={COR.pago} />
                <Bar dataKey="aVencer" name="A vencer" stackId="a" fill={COR.aVencer} />
                <Bar dataKey="vencido" name="Vencido" stackId="a" fill={COR.vencido} />
                <Bar dataKey="cancelado" name="Cancelado" stackId="a" fill={COR.cancelado} />
            </BarChart>
        </ResponsiveContainer>
    )
}

export default function RecebiveisPage() {
    const { getUser } = useContext(AuthContext)
    const [user, setUser] = useState<IUsuario>()
    const [clientes, setClientes] = useState<ICliente[]>([])
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<Recebiveis>()
    const [filtros, setFiltros] = useState<Filtros>({
        dataIn: format(startOfMonth(new Date()), "yyyy-MM-dd"),
        dataFim: format(endOfMonth(new Date()), "yyyy-MM-dd"),
        clienteId: 0,
        statusNf: "GERAL",
        statusVendas: "GERAL",
        statusPagamento: "GERAL",
        tipoData: "VENCIMENTO",
    })

    useEffect(() => {
        (async () => {
            const u = await getUser()
            setUser(u)
            await Promise.all([carregar(filtros, u), carregarClientes(u)])
        })()
    }, [])

    async function carregarClientes(u: IUsuario) {
        await api.get(`/Cliente/List?EmpresaId=${u.empresaSelecionada}&status=true`)
            .then(({ data }: AxiosResponse<ICliente[]>) => setClientes(data))
            .catch(() => { })
    }

    async function carregar(f: Filtros = filtros, u: IUsuario = user) {
        setLoading(true)
        await api.get(`/Venda/Recebiveis`, { params: { empresaId: u.empresaSelecionada, ...f } })
            .then(({ data }: AxiosResponse<Recebiveis>) => setData(data))
            .catch((err: AxiosError) => toast.error(`Erro ao buscar recebíveis. ${err.response?.data || err.message}`))
        setLoading(false)
    }

    const set = (campo: keyof Filtros, valor: string | number) => setFiltros(f => ({ ...f, [campo]: valor }))

    const opcoesCliente = useMemo(
        () => [{ value: 0, label: "Todos os clientes" }, ...clientes.map(c => ({ value: c.id, label: c.nome || c.razaoSocial || `#${c.id}` }))],
        [clientes]
    )

    const topClientes = useMemo(() => (data?.clientes || []).slice(0, 10).map(c => ({ nome: c.nome, ...c.totais })), [data])
    const formas = useMemo(() => (data?.pagamentos || []).map(p => ({ forma: p.forma, ...p.totais })), [data])
    const fiscal = useMemo(() => data ? [
        { name: "Faturadas (com nota)", valor: data.fiscal.faturadas.valorTotal, vendas: data.fiscal.faturadas.qtdVendas, parcelas: data.fiscal.faturadas.qtdParcelas, cor: COR_FISCAL.faturada },
        { name: "Orçamentos", valor: data.fiscal.orcamentos.valorTotal, vendas: data.fiscal.orcamentos.qtdVendas, parcelas: data.fiscal.orcamentos.qtdParcelas, cor: COR_FISCAL.orcamento },
    ] : [], [data])

    const r = data?.resumo
    const pct = (parte: number, total: number) => total > 0 ? `${((parte / total) * 100).toFixed(1).replace(".", ",")}% do total` : undefined

    const colunasCliente = [
        { name: "Cliente", selector: (row: any) => row.nome, sortable: true, grow: 2 },
        { name: "Vendas", selector: (row: any) => row.totais.qtdVendas, sortable: true, width: "90px" },
        { name: "Parcelas", selector: (row: any) => row.totais.qtdParcelas, sortable: true, width: "100px" },
        { name: "Pago", selector: (row: any) => row.totais.pago, cell: (row: any) => moeda(row.totais.pago), sortable: true },
        { name: "A vencer", selector: (row: any) => row.totais.aVencer, cell: (row: any) => moeda(row.totais.aVencer), sortable: true },
        { name: "Vencido", selector: (row: any) => row.totais.vencido, cell: (row: any) => moeda(row.totais.vencido), sortable: true },
        { name: "Total", selector: (row: any) => row.totais.valorTotal, cell: (row: any) => moeda(row.totais.valorTotal), sortable: true },
    ]
    const colunasForma = [
        { name: "Forma de pagamento", selector: (row: any) => row.forma, sortable: true, grow: 2 },
        { name: "Vendas", selector: (row: any) => row.qtdVendas, sortable: true, width: "90px" },
        { name: "Parcelas", selector: (row: any) => row.qtdParcelas, sortable: true, width: "100px" },
        { name: "Pago", selector: (row: any) => row.pago, cell: (row: any) => moeda(row.pago), sortable: true },
        { name: "A vencer", selector: (row: any) => row.aVencer, cell: (row: any) => moeda(row.aVencer), sortable: true },
        { name: "Vencido", selector: (row: any) => row.vencido, cell: (row: any) => moeda(row.vencido), sortable: true },
        { name: "Total", selector: (row: any) => row.valorTotal, cell: (row: any) => moeda(row.valorTotal), sortable: true },
    ]
    const colunasParcela = [
        { name: "Venda", selector: (row: Parcela) => row.vendaId, sortable: true, width: "90px" },
        { name: "Vencimento", selector: (row: Parcela) => row.vencimento, cell: (row: Parcela) => fmtData(row.vencimento), sortable: true },
        { name: "Emissão", selector: (row: Parcela) => row.dataVenda, cell: (row: Parcela) => fmtData(row.dataVenda), sortable: true },
        { name: "Cliente", selector: (row: Parcela) => row.cliente, sortable: true, grow: 2 },
        { name: "Forma", selector: (row: Parcela) => row.forma, sortable: true },
        { name: "Documento", selector: (row: Parcela) => row.documento, cell: (row: Parcela) => row.documento == "FATURADA" ? "Faturada" : "Orçamento", sortable: true },
        { name: "Valor", selector: (row: Parcela) => row.valor, cell: (row: Parcela) => moeda(row.valor), sortable: true },
        {
            name: "Situação", selector: (row: Parcela) => row.situacao, sortable: true,
            cell: (row: Parcela) => <span className={styles.badge} style={{ background: SITUACAO[row.situacao].cor }}>{SITUACAO[row.situacao].label}</span>
        },
    ]

    return (
        <div className={styles.container}>
            <h4>Recebíveis</h4>

            <div className={styles.boxSearch}>
                <InputGroup minWidth={"170px"} type={"date"} value={filtros.dataIn} onChange={(e) => set("dataIn", e.target.value)} title={"Início"} width={"15%"} />
                <InputGroup minWidth={"170px"} type={"date"} value={filtros.dataFim} onChange={(e) => set("dataFim", e.target.value)} title={"Final"} width={"15%"} />
                <div className={styles.field}>
                    <label>Data de referência</label>
                    <select value={filtros.tipoData} onChange={(e) => set("tipoData", e.target.value)}>
                        <option value="VENCIMENTO">Vencimento</option>
                        <option value="EMISSAO">Emissão</option>
                    </select>
                </div>
                <div className={styles.fieldCliente}>
                    <label>Cliente</label>
                    <Select
                        options={opcoesCliente}
                        value={opcoesCliente.find(o => o.value == filtros.clienteId) || opcoesCliente[0]}
                        onChange={(o: any) => set("clienteId", o?.value || 0)}
                        noOptionsMessage={() => "Nenhum cliente encontrado"}
                    />
                </div>
                <div className={styles.field}>
                    <label>Pagamento</label>
                    <select value={filtros.statusPagamento} onChange={(e) => set("statusPagamento", e.target.value)}>
                        <option value="GERAL">Geral</option>
                        <option value="PAGO">Pago</option>
                        <option value="A_VENCER">A vencer</option>
                        <option value="VENCIDAS">Vencidas</option>
                    </select>
                </div>
                <div className={styles.field}>
                    <label>Documento fiscal</label>
                    <select value={filtros.statusNf} onChange={(e) => set("statusNf", e.target.value)}>
                        <option value="GERAL">Geral</option>
                        <option value="FATURADAS">Faturadas</option>
                        <option value="ORCAMENTOS">Orçamentos</option>
                    </select>
                </div>
                <div className={styles.field}>
                    <label>Vendas</label>
                    <select value={filtros.statusVendas} onChange={(e) => set("statusVendas", e.target.value)}>
                        <option value="GERAL">Geral</option>
                        <option value="OK">OK</option>
                        <option value="CANCELADAS">Canceladas</option>
                    </select>
                </div>
                <CustomButton typeButton={"dark"} loading={loading} onClick={() => carregar()}>Pesquisar</CustomButton>
            </div>

            {data && r && (
                <>
                    <div className={styles.kpis}>
                        <Kpi titulo="Total no filtro" valor={moeda(r.valorTotal)} sub={`${r.qtdParcelas} parcelas · ${r.qtdVendas} vendas`} cor="#333" />
                        <Kpi titulo="Recebido" valor={moeda(r.pago)} sub={pct(r.pago, r.valorTotal)} cor={COR.pago} />
                        <Kpi titulo="A receber (a vencer)" valor={moeda(r.aVencer)} sub={pct(r.aVencer, r.valorTotal)} cor={COR.aVencer} />
                        <Kpi titulo="Vencido" valor={moeda(r.vencido)} sub={pct(r.vencido, r.valorTotal)} cor={COR.vencido} />
                    </div>
                    {data.vencidoForaDoPeriodo > 0 && (
                        <div className={styles.aviso}>
                            Inclui <b>{moeda(data.vencidoForaDoPeriodo)}</b> vencidos fora do período selecionado, para o saldo em aberto ficar completo.
                        </div>
                    )}

                    {/* 1 - Clientes */}
                    <section className={styles.setor}>
                        <h5>Clientes</h5>
                        <div className={styles.setorDesc}>Quem mais compra e como está a situação do que cada um deve ou já pagou.</div>
                        <div className={styles.charts}>
                            <div className={styles.card}>
                                <div className={styles.cardTitle}>Ranking de clientes (top 10)</div>
                                <BarrasEmpilhadas dados={topClientes} categoria="nome" />
                            </div>
                            <div className={styles.card}>
                                <div className={styles.cardTitle}>Balanço geral</div>
                                <Balanco totais={r} />
                            </div>
                        </div>
                        <ListaResponsiva columns={colunasCliente} data={data.clientes} loading={loading} pageSize={10} renderCard={(c) => <CardTotais titulo={c.nome} totais={c.totais} />} />
                    </section>

                    {/* 2 - Pagamentos */}
                    <section className={styles.setor}>
                        <h5>Formas de pagamento</h5>
                        <div className={styles.setorDesc}>Por qual meio os valores entram — e onde estão acumulados os vencidos.</div>
                        <div className={styles.charts}>
                            <div className={styles.card}>
                                <div className={styles.cardTitle}>Ranking por forma de pagamento</div>
                                <BarrasEmpilhadas dados={formas} categoria="forma" />
                            </div>
                            <div className={styles.card}>
                                <div className={styles.cardTitle}>Participação no valor total</div>
                                {formas.length == 0 ? <div className={styles.vazio}>Sem dados para exibir.</div> : (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <PieChart>
                                            <Pie data={formas} dataKey="valorTotal" nameKey="forma" outerRadius={95}
                                                label={(e: any) => `${(e.percent * 100).toFixed(0)}%`}>
                                                {formas.map((f, i) => <Cell key={f.forma} fill={PALETA[i % PALETA.length]} />)}
                                            </Pie>
                                            <Tooltip formatter={(v: number) => moeda(v)} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                        <ListaResponsiva columns={colunasForma} data={formas} loading={loading} pageSize={10} renderCard={(f) => <CardTotais titulo={f.forma} totais={f} />} />
                    </section>

                    {/* 3 - Fiscal */}
                    <section className={styles.setor}>
                        <h5>Fiscal</h5>
                        <div className={styles.setorDesc}>Comparativo entre vendas faturadas (com nota emitida) e orçamentos.</div>
                        <div className={styles.charts}>
                            <div className={styles.card}>
                                <div className={styles.cardTitle}>Valor por tipo de documento</div>
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={fiscal}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis tickFormatter={moedaCurta} />
                                        <Tooltip formatter={(v: number) => moeda(v)} />
                                        <Bar dataKey="valor" name="Valor" radius={[4, 4, 0, 0]}>
                                            {fiscal.map(f => <Cell key={f.name} fill={f.cor} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className={styles.card}>
                                <div className={styles.cardTitle}>Quantidade de vendas</div>
                                {fiscal.every(f => f.vendas == 0) ? <div className={styles.vazio}>Sem dados para exibir.</div> : (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <PieChart>
                                            <Pie data={fiscal} dataKey="vendas" nameKey="name" outerRadius={90}
                                                label={(e: any) => `${e.value}`}>
                                                {fiscal.map(f => <Cell key={f.name} fill={f.cor} />)}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                        <div className={styles.kpis}>
                            {fiscal.map(f => (
                                <Kpi key={f.name} titulo={f.name} valor={moeda(f.valor)} sub={`${f.vendas} vendas · ${f.parcelas} parcelas`} cor={f.cor} />
                            ))}
                        </div>
                    </section>

                    {/* Detalhe */}
                    <section className={styles.setor}>
                        <h5>Parcelas</h5>
                        <div className={styles.setorDesc}>Detalhamento de cada pagamento considerado no relatório.</div>
                        <ListaResponsiva columns={colunasParcela} data={data.parcelas} loading={loading} pageSize={15} renderCard={(p) => <CardParcela parcela={p} />} />
                    </section>
                </>
            )}
            {!data && loading && <div className={styles.vazio}>Carregando...</div>}
        </div>
    )
}
