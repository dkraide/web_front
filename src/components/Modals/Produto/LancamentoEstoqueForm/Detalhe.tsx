import { format } from "date-fns"
import { useWindowSize } from "rooks"
import ILancamentoEstoque from "@/interfaces/ILancamentoEstoque"
import ILancamentoEstoqueProduto from "@/interfaces/ILancamentoEstoqueProduto"
import CustomButton from "@/components/ui/Buttons"
import { GetCurrencyBRL } from "@/utils/functions"
import styles from "./detalhe.module.scss"

const qtd = (n: number) => n.toFixed(2)
const total = (p: ILancamentoEstoqueProduto) => p.custoUnitario * p.quantidade

/** Visão somente leitura de um lançamento de estoque já contabilizado. */
export default function DetalheLancamento({ lancamento, produtos, onClose }: {
    lancamento: ILancamentoEstoque
    produtos: ILancamentoEstoqueProduto[]
    onClose: () => void
}) {
    const { innerWidth } = useWindowSize()
    const mobile = !!innerWidth && innerWidth < 700
    const itens = produtos || []

    const reversao = (lancamento.comentario || '').startsWith('[REVERSAO')
    const comentario = (lancamento.comentario || '').replace(/^\[REVERSAO DO LANCAMENTO \d+\]\s*/, '')
    const somaQtd = itens.reduce((s, p) => s + p.quantidade, 0)
    const somaCusto = itens.reduce((s, p) => s + total(p), 0)

    return (
        <div className={styles.container}>
            {/* Identificação */}
            <div className={styles.head}>
                <span className={styles.headItem}>Online<b>{lancamento.id}</b></span>
                <span className={styles.headItem}>Local<b>{lancamento.idLancamentoEstoque || '--'}</b></span>
                <span className={styles.headItem}>Data<b>{format(new Date(lancamento.dataLancamento), 'dd/MM/yyyy HH:mm')}</b></span>
                <span className={styles.headItem}>Nro Ref<b>{lancamento.idPedido || '--'}</b></span>
                <span className={styles.headItem}>
                    Tipo
                    <span>
                        <span className={lancamento.isEntrada ? styles.badgeAtivo : styles.badgeAberto}>{lancamento.isEntrada ? 'Entrada' : 'Saída'}</span>
                        {reversao && <span className={`${styles.badgeNeutro} ${styles.gapLeft}`}>Reversão</span>}
                    </span>
                </span>
            </div>

            {comentario && (
                <div className={styles.comentario}>
                    <small>Comentário</small>
                    {comentario}
                </div>
            )}

            {/* Resumo */}
            <div className={styles.kpis}>
                <div className={styles.kpi}>Itens<b>{itens.length}</b></div>
                <div className={styles.kpi}>Quantidade total<b>{qtd(somaQtd)}</b></div>
                <div className={styles.kpi}>Custo total<b>{GetCurrencyBRL(somaCusto)}</b></div>
            </div>

            <span className={styles.hint}>Lançamento já contabilizado no estoque, não pode ser modificado. Para desfazê-lo, use "Reverter" na lista.</span>

            {/* Itens */}
            {mobile ? (
                <div className={styles.lista}>
                    {itens.length === 0 && <div className={styles.vazio}>Sem itens.</div>}
                    {itens.map(p => (
                        <div key={p.id || p.produtoId} className={styles.linha}>
                            <div className={styles.linhaNome}>{p.nomeProduto}</div>
                            <div className={styles.linhaRodape}>
                                <span>Qtd {qtd(p.quantidade)} · {GetCurrencyBRL(p.custoUnitario)}</span>
                                <b>{GetCurrencyBRL(total(p))}</b>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Produto</th>
                                <th className={styles.right}>Qtd</th>
                                <th className={styles.right}>Custo un.</th>
                                <th className={styles.right}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itens.length === 0 && <tr><td colSpan={4} className={styles.vazio}>Sem itens.</td></tr>}
                            {itens.map(p => (
                                <tr key={p.id || p.produtoId}>
                                    <td>{p.nomeProduto}</td>
                                    <td className={styles.right}>{qtd(p.quantidade)}</td>
                                    <td className={styles.right}>{GetCurrencyBRL(p.custoUnitario)}</td>
                                    <td className={styles.right}>{GetCurrencyBRL(total(p))}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td>Totais</td>
                                <td className={styles.right}>{qtd(somaQtd)}</td>
                                <td />
                                <td className={styles.right}>{GetCurrencyBRL(somaCusto)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}

            <div className={styles.footer}>
                <CustomButton typeButton="secondary" onClick={onClose}>Fechar</CustomButton>
            </div>
        </div>
    )
}
