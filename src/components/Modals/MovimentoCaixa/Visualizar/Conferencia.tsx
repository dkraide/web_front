import { useEffect, useState } from "react"
import { format } from "date-fns"
import { toast } from "react-toastify"
import { Spinner } from "react-bootstrap"
import { api } from "@/services/apiClient"
import { ExportToExcel, GetCurrencyBRL } from "@/utils/functions"
import CustomButton from "@/components/ui/Buttons"
import styles from "./styles.module.scss"

interface Linha {
    data: string
    tipo: 'ABERTURA' | 'VENDA' | 'REFORCO' | 'SANGRIA'
    descricao: string
    referencia: string
    usuario: string
    entrada: number
    saida: number
    outrasFormas: number
    saldo: number
    cancelada: boolean
}

interface Conferencia {
    fechado: boolean
    linhas: Linha[]
    esperado: number
    informado: number | null
    diferenca: number | null
    dataFechamento: string | null
}

const TIPO_LABEL: Record<Linha['tipo'], string> = {
    ABERTURA: 'Abertura',
    VENDA: 'Venda',
    REFORCO: 'Reforço',
    SANGRIA: 'Sangria',
}

const TIPO_BADGE: Record<Linha['tipo'], string> = {
    ABERTURA: styles.badgeInfo,
    VENDA: styles.badgeAtivo,
    REFORCO: styles.badgeNeutro,
    SANGRIA: styles.badgeAberto,
}

const fmt = (d: string) => format(new Date(d), 'dd/MM/yyyy HH:mm')

/** Extrato do caixa: abertura, vendas, reforços/sangrias e fechamento, com o saldo de dinheiro esperado. */
export default function ConferenciaCaixa({ id, mobile }: { id: number, mobile?: boolean }) {
    const [data, setData] = useState<Conferencia>()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get<Conferencia>(`/MovimentoCaixa/Conferencia?id=${id}`)
            .then(({ data }) => setData(data))
            .catch(err => toast.error(`Erro ao buscar conferência. ${err.response?.data || err.message}`))
            .finally(() => setLoading(false))
    }, [id])

    if (loading) return <div className={styles.vazio}><Spinner /></div>
    if (!data) return null

    const totalEntradas = data.linhas.filter(l => l.tipo !== 'ABERTURA').reduce((s, l) => s + l.entrada, 0)
    const totalSaidas = data.linhas.reduce((s, l) => s + l.saida, 0)
    const difClasse = data.diferenca == null ? '' : data.diferenca === 0 ? styles.kpiOk : styles.kpiDanger

    const exportar = () => {
        const cols = [
            { label: 'Data', key: 'data' }, { label: 'Tipo', key: 'tipo' }, { label: 'Descrição', key: 'descricao' },
            { label: 'Ref.', key: 'ref' }, { label: 'Usuário', key: 'usuario' }, { label: 'Entrada', key: 'entrada' },
            { label: 'Saída', key: 'saida' }, { label: 'Outras formas', key: 'outras' }, { label: 'Saldo dinheiro', key: 'saldo' },
        ]
        const rows = data.linhas.map(l => ({
            data: fmt(l.data), tipo: TIPO_LABEL[l.tipo], descricao: l.descricao || '', ref: l.referencia, usuario: l.usuario || '',
            entrada: l.entrada, saida: l.saida, outras: l.outrasFormas, saldo: l.saldo,
        }))
        rows.push({ data: data.dataFechamento ? fmt(data.dataFechamento) : '--', tipo: 'Fechamento', descricao: 'Informado no fechamento', ref: '', usuario: '', entrada: 0, saida: 0, outras: 0, saldo: data.informado ?? 0 })
        ExportToExcel(cols, rows, `conferencia_caixa_${id}`)
    }

    return (
        <div>
            <div className={styles.toolbar}>
                <span className={styles.hint}>
                    Saldo = dinheiro esperado na gaveta. Cartão, PIX e outras formas aparecem em "Outras formas" e não entram no saldo.
                </span>
                <CustomButton typeButton="dark" onClick={exportar}>Excel</CustomButton>
            </div>
            {mobile ? (
                <div className={styles.lista}>
                    {data.linhas.map((l, i) => (
                        <div key={i} className={`${styles.linha} ${l.cancelada ? styles.cancelada : ''}`}>
                            <div className={styles.linhaTopo}>
                                <span className={TIPO_BADGE[l.tipo]}>{TIPO_LABEL[l.tipo]}{l.referencia ? ` ${l.referencia}` : ''}</span>
                                <span style={{ fontSize: 12, color: '#8a7d90' }}>{fmt(l.data)}</span>
                            </div>
                            {(l.descricao || l.usuario) && <div className={styles.linhaNome}>{l.descricao}{l.usuario ? ` · ${l.usuario}` : ''}</div>}
                            <div className={styles.linhaRodape}>
                                <span>
                                    {l.entrada ? `+ ${GetCurrencyBRL(l.entrada)}` : ''}
                                    {l.saida ? `- ${GetCurrencyBRL(l.saida)}` : ''}
                                    {l.outrasFormas ? ` (outras ${GetCurrencyBRL(l.outrasFormas)})` : ''}
                                </span>
                                <b>Saldo {GetCurrencyBRL(l.saldo)}</b>
                            </div>
                        </div>
                    ))}
                    <div className={styles.linha}>
                        <div className={styles.linhaTopo}>
                            <span className={styles.badgeNeutro}>Fechamento</span>
                            <span style={{ fontSize: 12, color: '#8a7d90' }}>{data.dataFechamento ? fmt(data.dataFechamento) : '--'}</span>
                        </div>
                        <div className={styles.linhaRodape}><span>Esperado</span><b>{GetCurrencyBRL(data.esperado)}</b></div>
                        <div className={styles.linhaRodape}><span>Informado</span><b>{data.informado == null ? '--' : GetCurrencyBRL(data.informado)}</b></div>
                    </div>
                    <div className={`${styles.linhaTotal} ${difClasse}`}>
                        <span>Diferença</span>
                        <b>{data.diferenca == null ? '--' : GetCurrencyBRL(data.diferenca)}</b>
                    </div>
                </div>
            ) : (
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Tipo</th>
                            <th>Descrição</th>
                            <th>Ref.</th>
                            <th>Usuário</th>
                            <th className={styles.right}>Entrada</th>
                            <th className={styles.right}>Saída</th>
                            <th className={styles.right}>Outras formas</th>
                            <th className={styles.right}>Saldo dinheiro</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.linhas.map((l, i) => (
                            <tr key={i} className={l.cancelada ? styles.cancelada : undefined}>
                                <td>{fmt(l.data)}</td>
                                <td><span className={TIPO_BADGE[l.tipo]}>{TIPO_LABEL[l.tipo]}</span></td>
                                <td>{l.descricao}</td>
                                <td>{l.referencia}</td>
                                <td>{l.usuario}</td>
                                <td className={styles.right}>{l.entrada ? GetCurrencyBRL(l.entrada) : '--'}</td>
                                <td className={styles.right}>{l.saida ? GetCurrencyBRL(l.saida) : '--'}</td>
                                <td className={styles.right}>{l.outrasFormas ? GetCurrencyBRL(l.outrasFormas) : '--'}</td>
                                <td className={styles.right}><b>{GetCurrencyBRL(l.saldo)}</b></td>
                            </tr>
                        ))}
                        <tr className={styles.rowTotal}>
                            <td>{data.dataFechamento ? fmt(data.dataFechamento) : '--'}</td>
                            <td><span className={styles.badgeNeutro}>Fechamento</span></td>
                            <td colSpan={3}>{data.fechado ? 'Valor informado no fechamento' : 'Caixa ainda aberto'}</td>
                            <td colSpan={3} className={styles.right}>Esperado: {GetCurrencyBRL(data.esperado)}</td>
                            <td className={styles.right}>{data.informado == null ? '--' : GetCurrencyBRL(data.informado)}</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr className={styles.rowTotal}>
                            <td colSpan={5}>TOTAIS</td>
                            <td className={styles.right}>{GetCurrencyBRL(totalEntradas)}</td>
                            <td className={styles.right}>{GetCurrencyBRL(totalSaidas)}</td>
                            <td className={styles.right}>Diferença</td>
                            <td className={`${styles.right} ${difClasse}`}>
                                <b>{data.diferenca == null ? '--' : GetCurrencyBRL(data.diferenca)}</b>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            )}
        </div>
    )
}
