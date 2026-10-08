import { format } from "date-fns"
import { GetCurrencyBRL } from "@/utils/functions"
import styles from "./styles.module.scss"

export const COR = { pago: "#2e9e5b", aVencer: "#e0a800", vencido: "#d64545", cancelado: "#8a8f98" }

export interface Totais {
    qtdVendas: number
    qtdParcelas: number
    valorTotal: number
    pago: number
    aVencer: number
    vencido: number
    cancelado: number
}

export type Situacao = "PAGO" | "A_VENCER" | "VENCIDO" | "CANCELADO"

export interface Parcela {
    id: number
    vendaId: number
    dataVenda: string
    vencimento: string
    cliente: string
    forma: string
    valor: number
    situacao: Situacao
    documento: "FATURADA" | "ORCAMENTO"
}

export const SITUACAO: Record<Situacao, { label: string, cor: string }> = {
    PAGO: { label: "Pago", cor: COR.pago },
    A_VENCER: { label: "A vencer", cor: COR.aVencer },
    VENCIDO: { label: "Vencido", cor: COR.vencido },
    CANCELADO: { label: "Cancelado", cor: COR.cancelado },
}

const moeda = (v: number) => GetCurrencyBRL(v)
const fmtData = (iso: string) => format(new Date(iso), "dd/MM/yyyy")

// Card de cliente ou forma de pagamento: título, totais e barra proporcional pago/a vencer/vencido.
export function CardTotais({ titulo, totais }: { titulo: string, totais: Totais }) {
    const base = totais.pago + totais.aVencer + totais.vencido + totais.cancelado
    const larg = (v: number) => (base > 0 ? `${(v / base) * 100}%` : "0%")
    return (
        <div className={styles.card} style={{ ["--card-color" as any]: totais.vencido > 0 ? COR.vencido : COR.pago }}>
            <div className={styles.cardTop}>
                <div className={styles.cardNome}>{titulo}</div>
                <div className={styles.cardValor}>{moeda(totais.valorTotal)}</div>
            </div>
            <div className={styles.cardSub}>{totais.qtdVendas} vendas · {totais.qtdParcelas} parcelas</div>
            <div className={styles.barra}>
                <div style={{ width: larg(totais.pago), background: COR.pago }} />
                <div style={{ width: larg(totais.aVencer), background: COR.aVencer }} />
                <div style={{ width: larg(totais.vencido), background: COR.vencido }} />
                <div style={{ width: larg(totais.cancelado), background: COR.cancelado }} />
            </div>
            <div className={styles.legenda}>
                <span><i style={{ background: COR.pago }} />Pago {moeda(totais.pago)}</span>
                <span><i style={{ background: COR.aVencer }} />A vencer {moeda(totais.aVencer)}</span>
                <span><i style={{ background: COR.vencido }} />Vencido {moeda(totais.vencido)}</span>
            </div>
        </div>
    )
}

export function CardParcela({ parcela: p }: { parcela: Parcela }) {
    const s = SITUACAO[p.situacao]
    return (
        <div className={styles.card} style={{ ["--card-color" as any]: s.cor }}>
            <div className={styles.cardTop}>
                <div className={styles.cardNome}>{p.cliente}</div>
                <div className={styles.cardValor}>{moeda(p.valor)}</div>
            </div>
            <div style={{ marginTop: 4 }}>
                <span className={styles.badge} style={{ background: s.cor }}>{s.label}</span>
            </div>
            <div className={styles.dados}>
                <div><b>Vencimento</b>{fmtData(p.vencimento)}</div>
                <div><b>Emissão</b>{fmtData(p.dataVenda)}</div>
                <div><b>Forma</b>{p.forma}</div>
                <div><b>Venda / Documento</b>#{p.vendaId} · {p.documento == "FATURADA" ? "Faturada" : "Orçamento"}</div>
            </div>
        </div>
    )
}
