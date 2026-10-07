import { useContext, useEffect, useMemo, useState } from "react"
import { startOfMonth, endOfMonth, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfYear, endOfYear, subDays, format } from 'date-fns'
import { api } from "@/services/apiClient"
import { AxiosError } from "axios"
import { toast } from "react-toastify"
import { Spinner } from "react-bootstrap"
import { isMobile } from 'react-device-detect'
import _ from "lodash"
// Mesmo visual dos demais relatorios.
import styles from '../../relatorio/produto/styles.module.scss'
import KRDTable, { KRDColumn } from "@/components/ui/KRDTable"
import { InputGroup } from "@/components/ui/InputGroup"
import CustomButton from "@/components/ui/Buttons"
import { ExportToExcel, GetCurrencyBRL } from "@/utils/functions"
import { AuthContext } from "@/contexts/AuthContext"

type Periodo = 'hoje' | 'semana' | 'ultimos30' | 'mes' | 'ano' | 'personalizado'
type Situacao = 'RUPTURA' | 'BAIXO' | 'PARADO' | 'OK' | 'PAUSADA'

interface ItemVariante {
    varianteId: number
    produtoId: number
    produto: string
    categoria: string
    cor: string
    tamanho: string
    sku: string | null
    ativo: boolean
    estoque: number
    vendidas: number
    receita: number
    vendas: number
    vendaDia: number
    coberturaDias: number | null
    situacao: Situacao
}

interface Resposta {
    periodo: { inicio: string; fim: string; dias: number }
    regras: { coberturaBaixaDias: number }
    itens: ItemVariante[]
}

const PERIODOS: { label: string; value: Periodo }[] = [
    { label: 'Hoje', value: 'hoje' },
    { label: 'Esta semana', value: 'semana' },
    { label: 'Últimos 30 dias', value: 'ultimos30' },
    { label: 'Este mês', value: 'mes' },
    { label: 'Este ano', value: 'ano' },
    { label: 'Personalizado', value: 'personalizado' },
]

const SITUACOES: { label: string; value: Situacao | 'TODAS' }[] = [
    { label: 'Todas', value: 'TODAS' },
    { label: 'Ruptura', value: 'RUPTURA' },
    { label: 'Estoque baixo', value: 'BAIXO' },
    { label: 'Paradas', value: 'PARADO' },
    { label: 'Ok', value: 'OK' },
    { label: 'Pausadas', value: 'PAUSADA' },
]

const ROTULO_SITUACAO: Record<Situacao, string> = {
    RUPTURA: 'Ruptura',
    BAIXO: 'Estoque baixo',
    PARADO: 'Parada',
    OK: 'Ok',
    PAUSADA: 'Pausada',
}

const EXCEL_HEADERS = [
    { label: 'Produto', key: 'produto' },
    { label: 'Categoria', key: 'categoria' },
    { label: 'Cor', key: 'cor' },
    { label: 'Tamanho', key: 'tamanho' },
    { label: 'SKU', key: 'sku' },
    { label: 'Estoque', key: 'estoque' },
    { label: 'Vendidas', key: 'vendidas' },
    { label: 'Receita', key: 'receita' },
    { label: 'Vendas/dia', key: 'vendaDia' },
    { label: 'Cobertura (dias)', key: 'coberturaDias' },
    { label: 'Situação', key: 'situacaoRotulo' },
]

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

const nomeVariante = (v: ItemVariante) => [v.cor, v.tamanho].filter(Boolean).join(' / ') || 'Única'

function Etiqueta({ situacao }: { situacao: Situacao }) {
    const classe = situacao === 'RUPTURA' ? styles.badgeDanger
        : situacao === 'OK' ? styles.badgeSuccess
            : styles.badgeNeutro
    return <span className={classe}>{ROTULO_SITUACAO[situacao]}</span>
}

export default function RelatorioModas() {
    const { getUser } = useContext(AuthContext)
    const [dados, setDados] = useState<Resposta | null>(null)
    const [loading, setLoading] = useState(true)
    const [periodo, setPeriodo] = useState<Periodo>('ultimos30')
    const [datas, setDatas] = useState(intervalo('ultimos30'))
    const [busca, setBusca] = useState('')
    const [situacao, setSituacao] = useState<Situacao | 'TODAS'>('TODAS')

    const carregar = async (intervaloUsado = datas) => {
        setLoading(true)
        try {
            // Garante a sessao carregada; a empresa vem do token no backend (nao vai na URL).
            await getUser()
            const { data } = await api.get<Resposta>(
                `/ModasRelatorio/variantes?dataIn=${intervaloUsado.dateIn}&dataFim=${intervaloUsado.dateFim}`
            )
            setDados(data)
        } catch (err) {
            const e = err as AxiosError
            toast.error(`Erro ao buscar o relatório. ${e.response?.data || e.message}`)
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

    const itens = dados?.itens ?? []

    const filtrados = useMemo(() => {
        const termo = busca.trim().toLowerCase()
        return itens.filter(i =>
            (situacao === 'TODAS' || i.situacao === situacao) &&
            (!termo || `${i.produto} ${i.cor} ${i.tamanho} ${i.sku ?? ''} ${i.categoria}`.toLowerCase().includes(termo))
        )
    }, [itens, busca, situacao])

    const contagem = (s: Situacao) => itens.filter(i => i.situacao === s).length
    const pecas = _.sumBy(filtrados, 'vendidas')
    const receita = _.sumBy(filtrados, 'receita')
    const estoqueTotal = _.sumBy(filtrados.filter(i => i.ativo), 'estoque')

    const excel = useMemo(() => filtrados.map(i => ({ ...i, situacaoRotulo: ROTULO_SITUACAO[i.situacao] })), [filtrados])

    const colunas: KRDColumn<ItemVariante>[] = [
        { name: 'Produto', selector: r => r.produto, sortable: true },
        { name: 'Variante', selector: r => nomeVariante(r), sortable: true },
        { name: 'Estoque', selector: r => r.estoque, sortable: true, right: true, width: '90px' },
        { name: 'Vendidas', selector: r => r.vendidas, sortable: true, right: true, width: '90px' },
        { name: 'Receita', selector: r => r.receita, cell: r => GetCurrencyBRL(r.receita), sortable: true, right: true },
        { name: 'Vendas/dia', selector: r => r.vendaDia, sortable: true, right: true, width: '100px' },
        {
            name: 'Cobertura',
            selector: r => r.coberturaDias ?? 99999,
            cell: r => r.coberturaDias == null ? '—' : `${r.coberturaDias.toLocaleString('pt-BR')} dias`,
            sortable: true,
            right: true,
        },
        { name: 'Situação', selector: r => r.situacao, cell: r => <Etiqueta situacao={r.situacao} />, sortable: true },
    ]

    const ItemMobile = (i: ItemVariante) => (
        <div key={i.varianteId} className={styles.mobileItem}>
            <div className={styles.mobileItemHeader}>
                <div>
                    <span className={styles.tagClasse}>{i.categoria}</span>
                    <span className={styles.mobileProduto}>{i.produto} — {nomeVariante(i)}</span>
                </div>
                <Etiqueta situacao={i.situacao} />
            </div>
            <div className={styles.mobileItemBody}>
                <div className={styles.mobileField}><span>Estoque</span><b>{i.estoque}</b></div>
                <div className={styles.mobileField}><span>Vendidas</span><b>{i.vendidas}</b></div>
                <div className={styles.mobileField}><span>Receita</span><b>{GetCurrencyBRL(i.receita)}</b></div>
                <div className={styles.mobileField}><span>Cobertura</span><b>{i.coberturaDias == null ? '—' : `${i.coberturaDias} dias`}</b></div>
            </div>
        </div>
    )

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h4 className={styles.title}>Relatório de peças (cor × tamanho)</h4>
                <CustomButton onClick={() => ExportToExcel(EXCEL_HEADERS, excel, 'relatorio-pecas')} typeButton="dark">
                    Exportar Excel
                </CustomButton>
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

            {loading ? (
                <div className={styles.loadingWrap}><Spinner /></div>
            ) : (
                <>
                    <div className={styles.metricsGrid}>
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Peças vendidas</span>
                            <span className={styles.metricValue}>{pecas.toLocaleString('pt-BR')}</span>
                            <span className={styles.metricSub}>em {dados?.periodo.dias ?? 0} dias</span>
                        </div>
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Receita</span>
                            <span className={styles.metricValue}>{GetCurrencyBRL(receita)}</span>
                            <span className={styles.metricSub}>das variantes listadas</span>
                        </div>
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Estoque (ativas)</span>
                            <span className={styles.metricValue}>{estoqueTotal.toLocaleString('pt-BR')}</span>
                            <span className={styles.metricSub}>peças</span>
                        </div>
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Em ruptura</span>
                            <span className={styles.metricValue}>{contagem('RUPTURA')}</span>
                            <span className={styles.metricSub}>variantes sem estoque</span>
                        </div>
                        <div className={styles.metricCard}>
                            <span className={styles.metricLabel}>Paradas</span>
                            <span className={styles.metricValue}>{contagem('PARADO')}</span>
                            <span className={styles.metricSub}>com estoque e sem venda</span>
                        </div>
                    </div>

                    <p style={{ fontSize: 12, opacity: 0.7, margin: '4px 0 0' }}>
                        Ruptura: sem estoque. Estoque baixo: acaba em até {dados?.regras.coberturaBaixaDias ?? 15} dias no ritmo
                        do período. Parada: tem estoque e não vendeu no período. Cobertura = estoque ÷ vendas por dia.
                    </p>

                    <hr className={styles.divider} />

                    <div className={styles.periodBar}>
                        {SITUACOES.map(s => (
                            <button
                                key={s.value}
                                className={`${styles.periodBtn} ${situacao === s.value ? styles.periodBtnActive : ''}`}
                                onClick={() => setSituacao(s.value)}
                            >
                                {s.label}{s.value !== 'TODAS' ? ` (${contagem(s.value)})` : ''}
                            </button>
                        ))}
                    </div>

                    <div className={styles.searchRow}>
                        <InputGroup
                            title="Filtrar por produto, cor, tamanho ou SKU"
                            value={busca}
                            onChange={e => setBusca(e.currentTarget.value)}
                        />
                    </div>

                    {isMobile ? (
                        <div className={styles.mobileList}>{filtrados.map(i => ItemMobile(i))}</div>
                    ) : (
                        <KRDTable<ItemVariante> columns={colunas} data={filtrados} loading={loading} paginationPerPage={25} />
                    )}
                </>
            )}
        </div>
    )
}
