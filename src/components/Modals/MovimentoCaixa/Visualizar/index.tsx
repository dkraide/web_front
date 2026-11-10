import { useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import { AxiosResponse } from "axios";
import Loading from "@/components/Loading";
import { toast } from "react-toastify";
import styles from './styles.module.scss';
import IUsuario from "@/interfaces/IUsuario";
import BaseModal from "../../Base/Index";
import _ from "lodash";
import { format } from "date-fns";
import IMovimentoCaixa from "@/interfaces/IMovimentoCaixa";
import { GetCurrencyBRL } from "@/utils/functions";
import { useWindowSize } from "rooks";
import ConferenciaCaixa from "./Conferencia";

interface props {
    isOpen: boolean
    id: number
    setClose: (res?: boolean) => void
    color?: string
    user: IUsuario
}
interface valorProps {
    forma: string
    qntd: number
    valor: number
}
type prodProps = {
    nome: string
    qntd: number
    valor: number
}

type Aba = 'conferencia' | 'pagamentos' | 'vendas' | 'produtos' | 'sangrias'
const ABAS: { key: Aba, label: string }[] = [
    { key: 'conferencia', label: 'Conferência' },
    { key: 'pagamentos', label: 'Pagamentos' },
    { key: 'vendas', label: 'Vendas' },
    { key: 'produtos', label: 'Produtos' },
    { key: 'sangrias', label: 'Sangrias / Reforços' },
]

const fmtData = (d: Date | string) => format(new Date(d), 'dd/MM/yyyy HH:mm')

export default function Visualizar({ user, isOpen, id, setClose, color }: props) {

    const [obj, setObj] = useState<IMovimentoCaixa>({} as IMovimentoCaixa)
    const [totais, setTotais] = useState<valorProps[]>()
    const [produtos, setProdutos] = useState<prodProps[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [aba, setAba] = useState<Aba>('conferencia')
    const { innerWidth } = useWindowSize()
    const mobile = !!innerWidth && innerWidth < 700

    useEffect(() => {
        api.get(`/MovimentoCaixa/Select?id=${id}`)
            .then(({ data }: AxiosResponse<IMovimentoCaixa>) => {
                setObj(data);
                setLoading(false);
            })
            .catch((err) => {
                toast.error(`Erro ao buscar dados. ${err.message}`)
                setLoading(false);
            })
        api.get(`/MovimentoCaixa/GetTotais?id=${id}`)
            .then(({ data }: AxiosResponse<valorProps[]>) => {
                setTotais(data);
            })
            .catch((err) => {
                toast.error(`Erro ao buscar totais. ${err.message}`)
            })
        api.get(`/MovimentoCaixa/Produtos?MovimentoCaixaId=${id}`)
            .then(({ data }: AxiosResponse<prodProps[]>) => {
                setProdutos(data);
            })
            .catch((err) => {
                toast.error(`Erro ao buscar produtos. ${err.message}`)
            })
    }, []);

    const vendasDinheiro = _.sumBy(totais ?? [], p => p.forma.toUpperCase().includes('DINHEIRO') ? p.valor : 0);
    const sangrias = _.sumBy(obj.sangrias ?? [], o => o.isSangria ? o.valorMovimento : 0);
    const entradas = _.sumBy(obj.sangrias ?? [], o => !o.isSangria ? o.valorMovimento : 0);
    const esperado = (obj.valorDinheiro ?? 0) + vendasDinheiro + entradas - sangrias;
    const diferenca = (obj.valorDinheiroFinal ?? 0) - esperado;
    const fechado = !!obj.status;

    const kpi = (label: string, valor: string, classe?: string) => (
        <div className={`${styles.kpi} ${classe ?? ''}`}>
            {label}
            <b>{valor}</b>
        </div>
    )

    return (
        <BaseModal height={'85%'} width={'85%'} color={color} title={`Caixa ${obj.idMovimentoCaixa || obj.id || ''}`} isOpen={isOpen} setClose={setClose}>
            {loading ? (
                <Loading />
            ) : (
                <div className={styles.container}>
                    {/* Identificação */}
                    <div className={styles.head}>
                        <span className={styles.headItem}>Caixa<b>{obj.idMovimentoCaixa || obj.id}</b></span>
                        <span className={styles.headItem}>Usuário<b>{obj.usuario?.nome || obj.idUsuario}</b></span>
                        <span className={styles.headItem}>Abertura<b>{fmtData(obj.dataMovimento || new Date())}</b></span>
                        <span className={styles.headItem}>Fechamento<b>{fechado ? fmtData(obj.dataFechamento) : '--'}</b></span>
                        <span className={styles.headItem}>
                            Status
                            <span className={fechado ? styles.badgeNeutro : styles.badgeAberto}>{fechado ? 'Fechado' : 'Aberto'}</span>
                        </span>
                    </div>

                    {/* Totais do dinheiro */}
                    <div className={styles.kpis}>
                        {kpi('Abertura (+)', GetCurrencyBRL(obj.valorDinheiro ?? 0))}
                        {kpi('Vendas em dinheiro (+)', GetCurrencyBRL(vendasDinheiro))}
                        {kpi('Reforços (+)', GetCurrencyBRL(entradas))}
                        {kpi('Sangrias (-)', GetCurrencyBRL(sangrias))}
                        {kpi('Esperado (=)', fechado ? GetCurrencyBRL(esperado) : '--')}
                        {kpi('Informado (=)', fechado ? GetCurrencyBRL(obj.valorDinheiroFinal) : '--')}
                        {kpi('Diferença', fechado ? GetCurrencyBRL(diferenca) : '--', fechado ? (diferenca === 0 ? styles.kpiOk : styles.kpiDanger) : undefined)}
                    </div>

                    {/* Abas */}
                    <div className={styles.tabs}>
                        {ABAS.map(a => (
                            <button key={a.key} type="button"
                                className={`${styles.tab} ${aba === a.key ? styles.tabActive : ''}`}
                                onClick={() => setAba(a.key)}>
                                {a.label}
                            </button>
                        ))}
                    </div>

                    {aba === 'conferencia' && <ConferenciaCaixa id={id} mobile={mobile} />}

                    {mobile && aba === 'pagamentos' && (
                        <div className={styles.lista}>
                            {totais?.map((item, index) => (
                                <div key={index} className={styles.linha}>
                                    <div className={styles.linhaNome}>{item.forma}</div>
                                    <div className={styles.linhaRodape}><span>{item.qntd} pagamento(s)</span><b>{GetCurrencyBRL(item.valor)}</b></div>
                                </div>
                            ))}
                            <div className={styles.linhaTotal}><span>Total</span><b>{GetCurrencyBRL(_.sumBy(totais, t => t.valor))}</b></div>
                        </div>
                    )}
                    {mobile && aba === 'vendas' && (
                        <div className={styles.lista}>
                            {(!obj.vendas || obj.vendas.length === 0) && <div className={styles.vazio}>Sem vendas neste caixa.</div>}
                            {obj.vendas?.map(item => (
                                <div key={item.id} className={styles.linha}>
                                    <div className={styles.linhaTopo}>
                                        <b>Venda {item.id}</b>
                                        <span className={item.statusVenda ? styles.badgeAtivo : styles.badgeDanger}>{item.statusVenda ? 'OK' : 'Cancelada'}</span>
                                    </div>
                                    <div className={styles.linhaRodape}>
                                        <span>{fmtData(item.dataVenda)} · {item.usuario?.nome || '--'} · {item.estd ? 'Faturada' : 'Orçamento'}</span>
                                        <b>{GetCurrencyBRL(item.valorTotal)}</b>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {mobile && aba === 'produtos' && (
                        <div className={styles.lista}>
                            {produtos.length === 0 && <div className={styles.vazio}>Sem produtos vendidos.</div>}
                            {produtos.map((item, index) => (
                                <div key={index} className={styles.linha}>
                                    <div className={styles.linhaNome}>{item.nome}</div>
                                    <div className={styles.linhaRodape}><span>Qtd {item.qntd}</span><b>{GetCurrencyBRL(item.valor)}</b></div>
                                </div>
                            ))}
                        </div>
                    )}
                    {mobile && aba === 'sangrias' && (
                        <div className={styles.lista}>
                            {(!obj.sangrias || obj.sangrias.length === 0) && <div className={styles.vazio}>Sem sangrias ou reforços.</div>}
                            {obj.sangrias?.map(item => (
                                <div key={item.id} className={styles.linha}>
                                    <div className={styles.linhaTopo}>
                                        <span className={item.isSangria ? styles.badgeAberto : styles.badgeNeutro}>{item.isSangria ? 'Sangria' : 'Reforço'}</span>
                                        <b>{GetCurrencyBRL(item.valorMovimento)}</b>
                                    </div>
                                    <div className={styles.linhaRodape}><span>{fmtData(item.dataSangria)}{item.motivo ? ` · ${item.motivo}` : ''}</span></div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!mobile && aba === 'pagamentos' && (
                        <div className={styles.tableWrap}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Forma de pagamento</th>
                                        <th className={styles.right}>Qntd</th>
                                        <th className={styles.right}>Valor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {totais?.map((item, index) =>
                                        <tr key={index}>
                                            <td>{item.forma}</td>
                                            <td className={styles.right}>{item.qntd}</td>
                                            <td className={styles.right}>{GetCurrencyBRL(item.valor)}</td>
                                        </tr>)}
                                    <tr className={styles.rowTotal}>
                                        <td>TOTAL</td>
                                        <td className={styles.right}>{_.sumBy(totais, t => t.qntd)}</td>
                                        <td className={styles.right}>{GetCurrencyBRL(_.sumBy(totais, t => t.valor))}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!mobile && aba === 'vendas' && (
                        <div className={styles.tableWrap}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Nro</th>
                                        <th>Usuário</th>
                                        <th>Data</th>
                                        <th>Status</th>
                                        <th>Tipo</th>
                                        <th className={styles.right}>Valor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {obj.vendas?.map((item) =>
                                        <tr key={item.id}>
                                            <td>{item.id}</td>
                                            <td>{item.usuario?.nome || '--'}</td>
                                            <td>{fmtData(item.dataVenda)}</td>
                                            <td><span className={item.statusVenda ? styles.badgeAtivo : styles.badgeDanger}>{item.statusVenda ? 'OK' : 'Cancelada'}</span></td>
                                            <td><span className={item.estd ? styles.badgeInfo : styles.badgeNeutro}>{item.estd ? 'Faturada' : 'Orçamento'}</span></td>
                                            <td className={styles.right}>{GetCurrencyBRL(item.valorTotal)}</td>
                                        </tr>)}
                                    {(!obj.vendas || obj.vendas.length === 0) && <tr><td colSpan={6} className={styles.vazio}>Sem vendas neste caixa.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!mobile && aba === 'produtos' && (
                        <div className={styles.tableWrap}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Produto</th>
                                        <th className={styles.right}>Quantidade</th>
                                        <th className={styles.right}>Valor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {produtos?.map((item, index) =>
                                        <tr key={index}>
                                            <td>{item.nome}</td>
                                            <td className={styles.right}>{item.qntd}</td>
                                            <td className={styles.right}>{GetCurrencyBRL(item.valor)}</td>
                                        </tr>)}
                                    {produtos.length === 0 && <tr><td colSpan={3} className={styles.vazio}>Sem produtos vendidos.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!mobile && aba === 'sangrias' && (
                        <div className={styles.tableWrap}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Nro</th>
                                        <th>Tipo</th>
                                        <th>Data</th>
                                        <th>Motivo</th>
                                        <th className={styles.right}>Valor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {obj.sangrias?.map((item) =>
                                        <tr key={item.id}>
                                            <td>{item.id}</td>
                                            <td><span className={item.isSangria ? styles.badgeAberto : styles.badgeNeutro}>{item.isSangria ? 'Sangria' : 'Reforço'}</span></td>
                                            <td>{fmtData(item.dataSangria)}</td>
                                            <td>{item.motivo}</td>
                                            <td className={styles.right}>{GetCurrencyBRL(item.valorMovimento)}</td>
                                        </tr>)}
                                    {(!obj.sangrias || obj.sangrias.length === 0) && <tr><td colSpan={5} className={styles.vazio}>Sem sangrias ou reforços.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </BaseModal>
    )
}
