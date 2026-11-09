import { useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import { AxiosResponse } from "axios";
import Loading from "@/components/Loading";
import { toast } from "react-toastify";
import styles from './styles.module.scss';
import IUsuario from "@/interfaces/IUsuario";
import BaseModal from "../../Base/Index";
import IVenda from "@/interfaces/IVenda";
import { format } from "date-fns";
import { GetCurrencyBRL } from "@/utils/functions";
import { useWindowSize } from "rooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBan } from "@fortawesome/free-solid-svg-icons";

interface props {
    isOpen: boolean
    id: number
    setClose: (res?: boolean) => void
    color?: string
    user: IUsuario
}

const fmtData = (d: any) => {
    if (!d) return '--'
    const dt = new Date(d)
    return isNaN(dt.getTime()) ? '--' : format(dt, 'dd/MM/yyyy HH:mm')
}

function Info({ label, value }: { label: string, value: React.ReactNode }) {
    return (
        <div className={styles.info}>
            <span className={styles.infoLabel}>{label}</span>
            <span className={styles.infoValue}>{value}</span>
        </div>
    )
}

export default function Visualizar({ user, isOpen, id, setClose, color }: props) {
    const [obj, setObj] = useState<IVenda>({} as IVenda)
    const [loading, setLoading] = useState<boolean>(true)

    const [cancelando, setCancelando] = useState(false)
    const [confirmando, setConfirmando] = useState(false)
    const [motivo, setMotivo] = useState('')
    const [alterou, setAlterou] = useState(false)

    const carregar = () =>
        api.get(`/Venda/Select?id=${id}`)
            .then(({ data }: AxiosResponse<IVenda>) => {
                setObj(data);
                setLoading(false);
            })
            .catch((err) => {
                toast.error(`Erro ao buscar dados. ${err.message}`)
                setLoading(false);
            })

    useEffect(() => { carregar() }, []);

    // Mesmo fluxo do pdv-web (cancela a NFC-e, se houver, antes de marcar a venda como cancelada), numa rota que
    // aceita o token do painel: /v2/pdv exige a claim empresaId do operador e respondia 403 aqui.
    async function cancelarVenda() {
        if (!motivo.trim()) {
            toast.error('Informe o motivo do cancelamento.')
            return
        }
        setCancelando(true)
        try {
            await api.post(`/Venda/CancelarPainel`, { id, empresaId: user.empresaSelecionada, motivo: motivo.trim() })
            toast.success('Venda cancelada com sucesso.')
            setAlterou(true)
            setConfirmando(false)
            setMotivo('')
            await carregar()
        } catch (err: any) {
            const d = err.response?.data
            toast.error(`Erro ao cancelar venda. ${d?.message || d?.erro || (typeof d === 'string' ? d : '') || err.message}`)
        }
        setCancelando(false)
    }

    const { innerWidth } = useWindowSize()
    const mobile = !!innerWidth && innerWidth < 700

    const produtos = obj.produtos || []
    const pagamentos = obj.pagamentos || []
    const totalPago = pagamentos.reduce((s, p) => s + (p.valor || 0), 0)
    const qtdItens = produtos.reduce((s, p) => s + (p.quantidade || 0), 0)

    return (
        <BaseModal height={'85%'} width={'80%'} color={color} title={`Venda ${obj.idVenda ?? ''}`} isOpen={isOpen} setClose={() => setClose(alterou)}>
            {loading ? (
                <Loading />
            ) : (
                <div className={styles.container}>
                    {/* Ações */}
                    {obj.statusVenda && (
                        <div className={styles.acoes}>
                            {!confirmando && (
                                <button className={styles.btnCancelar} onClick={() => setConfirmando(true)}>
                                    <FontAwesomeIcon icon={faBan} /> Cancelar venda
                                </button>
                            )}
                        </div>
                    )}
                    {obj.statusVenda && confirmando && (
                        <div className={styles.confirmar}>
                            <b>Cancelar esta venda?</b>
                            <p>
                                {obj.estd
                                    ? 'Essa venda gerou nota fiscal: o cancelamento também cancela o cupom fiscal na SEFAZ.'
                                    : 'Essa ação não pode ser desfeita.'}
                            </p>
                            <input
                                className={styles.motivo}
                                value={motivo}
                                onChange={e => setMotivo(e.target.value)}
                                placeholder="Motivo. Ex.: item errado, desistência do cliente..."
                                autoFocus
                                disabled={cancelando}
                            />
                            <div className={styles.confirmarBtns}>
                                <button className={styles.btnVoltar} disabled={cancelando}
                                    onClick={() => { setConfirmando(false); setMotivo('') }}>Voltar</button>
                                <button className={styles.btnConfirmar} disabled={cancelando} onClick={cancelarVenda}>
                                    {cancelando ? 'Cancelando...' : 'Confirmar cancelamento'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Resumo */}
                    <div className={styles.hero}>
                        <div>
                            <div className={styles.heroLabel}>Valor total</div>
                            <div className={`${styles.heroValue} ${obj.statusVenda ? '' : styles.heroCancelada}`}>
                                {GetCurrencyBRL(obj.valorTotal || 0)}
                            </div>
                            <div className={styles.heroSub}>
                                {fmtData(obj.dataVenda)} · {produtos.length} produto{produtos.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                        <div className={styles.badges}>
                            <span className={obj.estd ? styles.badgeInfo : styles.badgeNeutro}>
                                {obj.estd ? 'Faturado' : 'Orçamento'}
                            </span>
                            <span className={obj.statusVenda ? styles.badgeOk : styles.badgeDanger}>
                                {obj.statusVenda ? 'OK' : 'Cancelada'}
                            </span>
                        </div>
                    </div>

                    {/* Cancelamento */}
                    {!obj.statusVenda && (
                        <div className={styles.alerta}>
                            <b>Venda cancelada em {fmtData(obj.dataCancelamento)}</b>
                            {obj.motivoCancelamento && <div>Motivo: {obj.motivoCancelamento}</div>}
                        </div>
                    )}

                    {/* Dados */}
                    <section className={styles.card}>
                        <h5>Dados da venda</h5>
                        <div className={styles.grid}>
                            <Info label="Nº nuvem / local" value={`${obj.id} / ${obj.idVenda}`} />
                            {obj.nnf > 0 && <Info label="NNF" value={obj.nnf} />}
                            <Info label="Caixa" value={obj.movimentoCaixaId || '--'} />
                            <Info label="Usuário" value={obj.usuario?.nome || obj.idUsuario || '--'} />
                            <Info label="Itens" value={qtdItens.toFixed(2).replace(/\.00$/, '')} />
                        </div>
                    </section>

                    {/* Produtos */}
                    <section className={styles.card}>
                        <h5>Produtos</h5>
                        {mobile ? (
                            <div className={styles.lista}>
                                {produtos.length == 0 && <div className={styles.vazio}>Sem produtos.</div>}
                                {produtos.map((item) => (
                                    <div key={item.id} className={styles.linha}>
                                        <div className={styles.linhaNome}>{item.nomeProduto}</div>
                                        <div className={styles.linhaRodape}>
                                            <span>{item.quantidade.toFixed(2).replace(/\.00$/, '')} × {GetCurrencyBRL(item.valorUnitario)}</span>
                                            <b>{GetCurrencyBRL(item.valorTotal)}</b>
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
                                        <th className={styles.right}>Valor un.</th>
                                        <th className={styles.right}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {produtos.length == 0 && <tr><td colSpan={4} className={styles.vazio}>Sem produtos.</td></tr>}
                                    {produtos.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.nomeProduto}</td>
                                            <td className={styles.right}>{item.quantidade.toFixed(2)}</td>
                                            <td className={styles.right}>{GetCurrencyBRL(item.valorUnitario)}</td>
                                            <td className={styles.right}><b>{GetCurrencyBRL(item.valorTotal)}</b></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        )}
                    </section>

                    {/* Pagamentos */}
                    <section className={styles.card}>
                        <h5>Pagamentos</h5>
                        {mobile ? (
                            <div className={styles.lista}>
                                {pagamentos.length == 0 && <div className={styles.vazio}>Sem pagamentos.</div>}
                                {pagamentos.map((item) => (
                                    <div key={item.id} className={`${styles.linha} ${styles.linhaPag}`}>
                                        <span>{item.descricao}</span>
                                        <b>{GetCurrencyBRL(item.valor)}</b>
                                    </div>
                                ))}
                                {pagamentos.length > 0 && (
                                    <div className={`${styles.linha} ${styles.linhaPag} ${styles.linhaTotal}`}>
                                        <span>Total pago</span>
                                        <b>{GetCurrencyBRL(totalPago)}</b>
                                    </div>
                                )}
                            </div>
                        ) : (
                        <div className={styles.tableWrap}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Forma de pagamento</th>
                                        <th className={styles.right}>Valor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagamentos.length == 0 && <tr><td colSpan={2} className={styles.vazio}>Sem pagamentos.</td></tr>}
                                    {pagamentos.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.descricao}</td>
                                            <td className={styles.right}><b>{GetCurrencyBRL(item.valor)}</b></td>
                                        </tr>
                                    ))}
                                </tbody>
                                {pagamentos.length > 0 && (
                                    <tfoot>
                                        <tr>
                                            <td>Total pago</td>
                                            <td className={styles.right}>{GetCurrencyBRL(totalPago)}</td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                        )}
                    </section>
                </div>
            )}
        </BaseModal>
    )
}
