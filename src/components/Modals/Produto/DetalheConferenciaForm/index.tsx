import { useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import Loading from "@/components/Loading";
import { toast } from "react-toastify";
import { useWindowSize } from "rooks";
import styles from './styles.module.scss';
import IUsuario from "@/interfaces/IUsuario";
import CustomButton from "@/components/ui/Buttons";
import BaseModal from "../../Base/Index";
import IProduto from "@/interfaces/IProduto";
import ILancamentoEstoqueProduto from "@/interfaces/ILancamentoEstoqueProduto";
import { addDays, addMinutes, format } from "date-fns";
import AjusteEstoqueForm from "../AjusteEstoqueForm";
import IConferenciaEstoque from "@/interfaces/IConferenciaEstoque";
import { GetCurrencyBRL } from "@/utils/functions";


interface props {
    isOpen: boolean
    conferencia: IConferenciaEstoque
    setClose: (res?: boolean) => void
    color?: string
    user: IUsuario
}
interface resultProps {
    produto?: IProduto
    lancamentos: ILancamentoEstoqueProduto[]
}

const fmtData = (d: Date | string) => format(new Date(d), 'dd/MM/yyyy HH:mm')
const qtd = (n: number) => n.toFixed(2)
const custoLinha = (l: ILancamentoEstoqueProduto) => l.custoUnitario * l.quantidade

export default function DetalheConferenciaForm({ user, isOpen, conferencia, setClose, color }: props) {

    const [result, setResult] = useState<resultProps>()
    const [loading, setLoading] = useState<boolean>(true)
    const [ajuste, setAjuste] = useState(false);
    const { innerWidth } = useWindowSize()
    const mobile = !!innerWidth && innerWidth < 700

    useEffect(() => {
        loadData();
    }, []);

    // /Estoque/Select devolve so a lista de lancamentos; o produto vem de /Produto/Select
    const loadData = async () => {
        try {
            const dataIn = format(addMinutes(new Date(conferencia.dataConferencia), 1), 'yyyy-MM-dd HH:mm');
            const dataFim = format(addDays(new Date(), 1), 'yyyy-MM-dd');
            const [lanc, prod] = await Promise.all([
                api.get<ILancamentoEstoqueProduto[]>(`/Estoque/Select?ProdutoId=${conferencia.produtoId}&dataIn=${dataIn}&dataFim=${dataFim}`),
                api.get<IProduto>(`/Produto/Select?id=${conferencia.produtoId}`),
            ]);
            setResult({ produto: prod.data, lancamentos: lanc.data || [] });
        } catch (err: any) {
            toast.error(`Erro ao buscar dados. ${err.response?.data || err.message}`)
        }
        setLoading(false);
    }

    if (ajuste && result?.produto) {
        return <AjusteEstoqueForm isOpen={ajuste} produto={result.produto} user={user} setClose={(v) => {
            if (v) {
                loadData();
            }
            setAjuste(false);
        }} />
    }

    const produto = result?.produto
    const entradas = (result?.lancamentos || []).filter(l => l.isEntrada)
    const saidas = (result?.lancamentos || []).filter(l => !l.isEntrada)
    const somaQtd = (list: ILancamentoEstoqueProduto[]) => list.reduce((s, l) => s + l.quantidade, 0)
    const somaCusto = (list: ILancamentoEstoqueProduto[]) => list.reduce((s, l) => s + custoLinha(l), 0)

    const diferenca = conferencia.quantidadeInformada - conferencia.quantidadeReal
    // estoque que deveria existir hoje: o que foi informado na conferência + o que entrou - o que saiu desde então
    const esperadoHoje = conferencia.quantidadeInformada + somaQtd(entradas) - somaQtd(saidas)
    const divergencia = produto ? produto.quantidade - esperadoHoje : 0

    const kpi = (label: string, valor: string, sub?: string, classe?: string) => (
        <div className={`${styles.kpi} ${classe ?? ''}`}>
            {label}
            <b>{valor}</b>
            {sub && <small>{sub}</small>}
        </div>
    )

    const secao = (titulo: string, list: ILancamentoEstoqueProduto[], badge: string) => (
        <section className={styles.section}>
            <h5 className={styles.sectionTitle}>
                <span>{titulo}</span>
                <span className={badge}>{list.length} lançamento{list.length !== 1 ? 's' : ''}</span>
            </h5>
            {mobile ? (
                <div className={styles.lista}>
                    {list.length === 0 && <div className={styles.vazio}>Sem lançamentos desde a conferência.</div>}
                    {list.map(l => (
                        <div key={l.id} className={styles.linha}>
                            <div className={styles.linhaTopo}>
                                <b>Ref. {l.idLancamentoEstoque || l.lancamentoEstoqueId}</b>
                                <span style={{ fontSize: 12, color: '#8a7d90' }}>{fmtData(l.dataLancamento)}</span>
                            </div>
                            {l.observacao && <div style={{ fontSize: 12, marginBottom: 4 }}>{l.observacao}</div>}
                            <div className={styles.linhaRodape}>
                                <span>Qtd {qtd(l.quantidade)}</span>
                                <b>{GetCurrencyBRL(custoLinha(l))}</b>
                            </div>
                        </div>
                    ))}
                    <div className={styles.linhaTotal}>
                        <span>Total · {qtd(somaQtd(list))}</span>
                        <b>{GetCurrencyBRL(somaCusto(list))}</b>
                    </div>
                </div>
            ) : (
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Ref.</th>
                                <th>Data</th>
                                <th>Observação</th>
                                <th className={styles.right}>Qtd</th>
                                <th className={styles.right}>Custo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.length === 0 && <tr><td colSpan={5} className={styles.vazio}>Sem lançamentos desde a conferência.</td></tr>}
                            {list.map(l => (
                                <tr key={l.id}>
                                    <td>{l.idLancamentoEstoque || l.lancamentoEstoqueId}</td>
                                    <td>{fmtData(l.dataLancamento)}</td>
                                    <td>{l.observacao || '--'}</td>
                                    <td className={styles.right}>{qtd(l.quantidade)}</td>
                                    <td className={styles.right}>{GetCurrencyBRL(custoLinha(l))}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={3}>Totais</td>
                                <td className={styles.right}>{qtd(somaQtd(list))}</td>
                                <td className={styles.right}>{GetCurrencyBRL(somaCusto(list))}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </section>
    )

    return (
        <BaseModal height={'90vh'} width={'90%'} color={color} title={'Conferência de estoque'} isOpen={isOpen} setClose={setClose}>
            {(loading || !produto) ? (
                <Loading />
            ) : (
                <div className={styles.container}>
                    {/* Identificação */}
                    <div className={styles.head}>
                        <span className={styles.headItem}>Cód<b>{produto.cod}</b></span>
                        <span className={`${styles.headItem} ${styles.headProduto}`}>Produto<b>{produto.nome}</b></span>
                        <span className={styles.headItem}>Conferência<b>{fmtData(conferencia.dataConferencia)}</b></span>
                        <span className={styles.headItem}>Usuário<b>{conferencia.usuarioNome || '--'}</b></span>
                        <div className={styles.headActions}>
                            <CustomButton typeButton="dark" onClick={() => setAjuste(true)}>Ajustar estoque</CustomButton>
                        </div>
                    </div>

                    {/* Resumo */}
                    <div className={styles.kpis}>
                        {kpi('Informado na conferência', qtd(conferencia.quantidadeInformada))}
                        {kpi('Esperado na conferência', qtd(conferencia.quantidadeReal))}
                        {kpi('Diferença da conferência', qtd(diferenca), undefined, diferenca === 0 ? styles.kpiOk : styles.kpiDanger)}
                        {kpi('Entradas desde então', qtd(somaQtd(entradas)), GetCurrencyBRL(somaCusto(entradas)))}
                        {kpi('Saídas desde então', qtd(somaQtd(saidas)), GetCurrencyBRL(somaCusto(saidas)))}
                        {kpi('Estoque atual', qtd(produto.quantidade), `Esperado: ${qtd(esperadoHoje)}`)}
                        {kpi('Divergência atual', qtd(divergencia), 'atual − (informado + entradas − saídas)', divergencia === 0 ? styles.kpiOk : styles.kpiDanger)}
                    </div>
                    <span className={styles.hint}>
                        Os lançamentos abaixo são os feitos depois da conferência. Se a divergência atual não é zero,
                        o estoque mudou por algo que não passou por um lançamento.
                    </span>

                    {/* Lançamentos após a conferência */}
                    <div className={styles.columns}>
                        {secao('Entradas', entradas, styles.badgeAtivo)}
                        {secao('Saídas', saidas, styles.badgeAberto)}
                    </div>
                </div>
            )}
        </BaseModal>
    )
}
