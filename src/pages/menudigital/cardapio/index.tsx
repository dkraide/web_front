import { useContext, useEffect, useState } from 'react';
import styles from './styles..module.scss';
import IClasseMaterial from '@/interfaces/IClasseMaterial';
import IProduto from '@/interfaces/IProduto';
import IGrupoAdicional from '@/interfaces/IGrupoAdicional';
import { IGrupoAdicionalItem } from '@/interfaces/IGrupoAdicionalItem';
import { api } from '@/services/apiClient';
import { AuthContext } from '@/contexts/AuthContext';
import { GetCurrencyBRL } from '@/utils/functions';
import { toast } from 'react-toastify';
import Loading from '@/components/Loading';
import IUsuario from '@/interfaces/IUsuario';
import {
    FiSearch, FiChevronDown, FiChevronUp, FiPause, FiPlay, FiLayers,
} from 'react-icons/fi';

const TIPO_LABELS: Record<string, string> = {
    PADRAO: 'Padrão',
    BORDA: 'Borda',
    TAMANHO: 'Tamanho',
    SABOR: 'Sabor',
    MASSA: 'Massa',
    COMPLEMENTO: 'Complemento',
};

export default function Cardapio() {
    const { getUser } = useContext(AuthContext);

    const [empresaId, setEmpresaId] = useState<number>(0);
    const [classes, setClasses] = useState<IClasseMaterial[]>([]);
    const [loading, setLoading] = useState(true);

    const [busca, setBusca] = useState('');
    const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas');

    // categorias/itens/grupos expandidos
    const [classesAbertas, setClassesAbertas] = useState<Set<number>>(new Set());
    const [complementosAbertos, setComplementosAbertos] = useState<Set<number>>(new Set());

    // detalhe do produto (grupoAdicionais só vem em GET /v2/produto/{id})
    const [detalhes, setDetalhes] = useState<Record<number, IProduto>>({});
    const [carregandoDetalhe, setCarregandoDetalhe] = useState<Set<number>>(new Set());

    // ids em processamento (evita duplo clique)
    const [togglando, setTogglando] = useState<Set<string>>(new Set());

    // ─── Carregamento ────────────────────────────────────────────────────────────
    async function loadData() {
        setLoading(true);
        const u: IUsuario = await getUser();
        setEmpresaId(u.empresaSelecionada);
        try {
            const { data } = await api.get<IClasseMaterial[]>(
                `/produto/${u.empresaSelecionada}/ListByClasse`
            );
            setClasses(data ?? []);
            setClassesAbertas(new Set((data ?? []).map(c => c.id)));
        } catch (err) {
            console.log(err);
            toast.error('Erro ao carregar o cardápio.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { loadData(); }, []);

    // ─── Toggle categoria / produto (visivelMenu via MenuUpdateData) ──────────────
    async function menuUpdate(isProduto: boolean, id: number, atual: boolean) {
        const key = `${isProduto ? 'p' : 'c'}-${id}`;
        if (togglando.has(key)) return;
        marcarTogglando(key, true);

        const value = atual ? 'false' : 'true';
        const controller = isProduto ? 'Produto' : 'ClasseMaterial';
        try {
            await api.put(
                `/${controller}/MenuUpdateData?id=${id}&column=VISIVELMENU&value=${value}`
            );
            // atualiza estado local sem recarregar tudo
            setClasses(prev => prev.map(c => {
                if (!isProduto && c.id === id) return { ...c, visivelMenu: !atual };
                if (isProduto) {
                    return {
                        ...c,
                        produtos: c.produtos?.map(p =>
                            p.id === id ? { ...p, visivelMenu: !atual } : p
                        ),
                    };
                }
                return c;
            }));
        } catch (err: any) {
            toast.error(`Erro ao atualizar status. ${err.response?.data || err.message}`);
        } finally {
            marcarTogglando(key, false);
        }
    }

    // ─── Complementos: carrega detalhe sob demanda ────────────────────────────────
    async function toggleComplementos(produtoId: number) {
        const jaAberto = complementosAbertos.has(produtoId);
        setComplementosAbertos(prev => {
            const next = new Set(prev);
            jaAberto ? next.delete(produtoId) : next.add(produtoId);
            return next;
        });
        if (jaAberto || detalhes[produtoId]) return;

        setCarregandoDetalhe(prev => new Set(prev).add(produtoId));
        try {
            const { data } = await api.get<IProduto>(
                `/v2/produto/${produtoId}?empresaid=${empresaId}`
            );
            setDetalhes(prev => ({ ...prev, [produtoId]: data }));
        } catch (err: any) {
            toast.error('Erro ao carregar complementos do produto.');
            setComplementosAbertos(prev => {
                const next = new Set(prev);
                next.delete(produtoId);
                return next;
            });
        } finally {
            setCarregandoDetalhe(prev => {
                const next = new Set(prev);
                next.delete(produtoId);
                return next;
            });
        }
    }

    // ─── Toggle grupo de complemento / item do grupo (status via upsert) ──────────
    async function salvarGrupo(grupo: IGrupoAdicional): Promise<boolean> {
        try {
            // busca o grupo completo (com precos aninhados) antes do upsert,
            // pra não perder nada que o detalhe do produto não traga.
            const { data: completo } = await api.get<IGrupoAdicional>(
                `/v2/GrupoAdicional/${grupo.id}`
            );
            const payload: IGrupoAdicional = {
                ...completo,
                status: grupo.status,
                itens: (completo.itens ?? []).map(it => {
                    const alterado = grupo.itens?.find(i => i.id === it.id);
                    return alterado
                        ? { ...it, status: alterado.status, needChange: true }
                        : it;
                }),
                needChange: true,
                empresaId,
            };
            await api.post(`/v2/GrupoAdicional`, payload);
            return true;
        } catch (err: any) {
            toast.error(`Erro ao salvar grupo. ${err.response?.data || err.message}`);
            return false;
        }
    }

    async function toggleGrupo(produtoId: number, grupo: IGrupoAdicional) {
        const key = `g-${grupo.id}`;
        if (togglando.has(key)) return;
        marcarTogglando(key, true);
        const novo = { ...grupo, status: !grupo.status };
        if (await salvarGrupo(novo)) {
            patchDetalhe(produtoId, grupo.id, { grupoStatus: novo.status });
        }
        marcarTogglando(key, false);
    }

    async function toggleItemGrupo(
        produtoId: number,
        grupo: IGrupoAdicional,
        item: IGrupoAdicionalItem
    ) {
        const key = `i-${item.id}`;
        if (togglando.has(key)) return;
        marcarTogglando(key, true);
        const novoItem = { ...item, status: !item.status };
        // envia o grupo com só esse item alterado
        const grupoParaSalvar: IGrupoAdicional = { ...grupo, itens: [novoItem] };
        if (await salvarGrupo(grupoParaSalvar)) {
            patchDetalhe(produtoId, grupo.id, { itemId: item.id, itemStatus: novoItem.status });
        }
        marcarTogglando(key, false);
    }

    // ─── Helpers de estado local ──────────────────────────────────────────────────
    function marcarTogglando(key: string, on: boolean) {
        setTogglando(prev => {
            const next = new Set(prev);
            on ? next.add(key) : next.delete(key);
            return next;
        });
    }

    function patchDetalhe(
        produtoId: number,
        grupoId: number,
        patch: { grupoStatus?: boolean; itemId?: string; itemStatus?: boolean }
    ) {
        setDetalhes(prev => {
            const prod = prev[produtoId];
            if (!prod) return prev;
            return {
                ...prev,
                [produtoId]: {
                    ...prod,
                    grupoAdicionais: prod.grupoAdicionais?.map(pga => {
                        if (pga.grupoAdicional?.id !== grupoId) return pga;
                        const ga = pga.grupoAdicional!;
                        return {
                            ...pga,
                            grupoAdicional: {
                                ...ga,
                                status: patch.grupoStatus ?? ga.status,
                                itens: ga.itens?.map(it =>
                                    patch.itemId && it.id === patch.itemId
                                        ? { ...it, status: patch.itemStatus ?? it.status }
                                        : it
                                ),
                            },
                        };
                    }),
                },
            };
        });
    }

    function toggleClasse(id: number) {
        setClassesAbertas(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    // ─── Filtragem ────────────────────────────────────────────────────────────────
    const classesFiltradas = classes
        .filter(c => categoriaFiltro === 'todas' || String(c.id) === categoriaFiltro)
        .map(c => ({
            ...c,
            produtos: c.produtos?.filter(p =>
                p.nome?.toLowerCase().includes(busca.toLowerCase())
            ),
        }))
        .filter(c => busca === '' || (c.produtos && c.produtos.length > 0));

    // ─── Render ─────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className={styles.container}>
                <Loading />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.topBar}>
                <h1 className={styles.titulo}>Cardápio Digital</h1>
                <p className={styles.subtitulo}>
                    Pause ou ative categorias, itens, grupos de complemento e complementos.
                </p>
            </div>

            {/* Filtros */}
            <div className={styles.filtros}>
                <div className={styles.buscaWrapper}>
                    <FiSearch size={14} className={styles.buscaIcon} />
                    <input
                        className={styles.buscaInput}
                        placeholder="Buscar um item"
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                    />
                </div>
                <select
                    className={styles.categoriaSelect}
                    value={categoriaFiltro}
                    onChange={e => setCategoriaFiltro(e.target.value)}
                >
                    <option value="todas">Todas as categorias</option>
                    {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.nomeClasse}</option>
                    ))}
                </select>
            </div>

            {/* Lista */}
            {classesFiltradas.length === 0 ? (
                <p className={styles.semDados}>Nenhum item encontrado.</p>
            ) : (
                <div className={styles.categoriasList}>
                    {classesFiltradas.map(classe => (
                        <div key={classe.id} className={styles.categoriaCard}>
                            {/* Header da categoria */}
                            <div className={styles.categoriaHeader}>
                                <div className={styles.categoriaHeaderLeft}>
                                    <button
                                        className={styles.categoriaNomeBtn}
                                        onClick={() => toggleClasse(classe.id)}
                                    >
                                        <span className={styles.categoriaNome}>
                                            {classe.nomeClasse}
                                        </span>
                                        <span className={styles.categoriaCount}>
                                            ({classe.produtos?.length ?? 0}{' '}
                                            {classe.produtos?.length === 1 ? 'item' : 'itens'})
                                        </span>
                                    </button>
                                </div>

                                <div className={styles.categoriaHeaderRight}>
                                    <span className={`${styles.statusChip} ${classe.visivelMenu ? styles.statusAtivo : styles.statusPausado}`}>
                                        {classe.visivelMenu ? 'Ativa' : 'Pausada'}
                                    </span>
                                    <button
                                        className={`${styles.iconBtn} ${classe.visivelMenu ? styles.iconBtnAtivo : styles.iconBtnPausado}`}
                                        disabled={togglando.has(`c-${classe.id}`)}
                                        title={classe.visivelMenu ? 'Pausar categoria' : 'Ativar categoria'}
                                        onClick={() => menuUpdate(false, classe.id, classe.visivelMenu)}
                                    >
                                        {classe.visivelMenu ? <FiPause size={14} /> : <FiPlay size={14} />}
                                    </button>
                                    <button
                                        className={styles.iconBtn}
                                        onClick={() => toggleClasse(classe.id)}
                                    >
                                        {classesAbertas.has(classe.id)
                                            ? <FiChevronUp size={16} />
                                            : <FiChevronDown size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Itens da categoria */}
                            {classesAbertas.has(classe.id) && (
                                <div className={styles.itensList}>
                                    {!classe.produtos || classe.produtos.length === 0 ? (
                                        <p className={styles.semItens}>Nenhum item nesta categoria.</p>
                                    ) : (
                                        classe.produtos.map(produto => (
                                            <ProdutoRow
                                                key={produto.id}
                                                produto={produto}
                                                detalhe={detalhes[produto.id]}
                                                complementosAberto={complementosAbertos.has(produto.id)}
                                                carregandoDetalhe={carregandoDetalhe.has(produto.id)}
                                                togglando={togglando}
                                                onToggleProduto={() => menuUpdate(true, produto.id, produto.visivelMenu)}
                                                onToggleComplementos={() => toggleComplementos(produto.id)}
                                                onToggleGrupo={grupo => toggleGrupo(produto.id, grupo)}
                                                onToggleItemGrupo={(grupo, item) => toggleItemGrupo(produto.id, grupo, item)}
                                            />
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Linha do produto ───────────────────────────────────────────────────────────
interface ProdutoRowProps {
    produto: IProduto;
    detalhe?: IProduto;
    complementosAberto: boolean;
    carregandoDetalhe: boolean;
    togglando: Set<string>;
    onToggleProduto: () => void;
    onToggleComplementos: () => void;
    onToggleGrupo: (grupo: IGrupoAdicional) => void;
    onToggleItemGrupo: (grupo: IGrupoAdicional, item: IGrupoAdicionalItem) => void;
}

function ProdutoRow({
    produto, detalhe, complementosAberto, carregandoDetalhe, togglando,
    onToggleProduto, onToggleComplementos, onToggleGrupo, onToggleItemGrupo,
}: ProdutoRowProps) {
    const grupos = (detalhe?.grupoAdicionais ?? [])
        .map(pga => pga.grupoAdicional)
        .filter((g): g is IGrupoAdicional => !!g);

    // qtd de grupos: usa o detalhe se já carregou; antes disso mostramos o botão
    // sem badge pra permitir a expansão que dispara o carregamento.
    const qtdGrupos = detalhe ? grupos.length : null;

    return (
        <>
            <div className={`${styles.itemRow} ${!produto.visivelMenu ? styles.itemPausado : ''}`}>
                <img
                    className={styles.itemImagem}
                    alt={produto.nome}
                    src={produto.localPath}
                    onError={e => { e.currentTarget.src = '/comida.png'; }}
                />
                <div className={styles.itemInfo}>
                    <span className={styles.itemNome}>{produto.nome}</span>
                    {produto.descricao && (
                        <span className={styles.itemDesc}>{produto.descricao}</span>
                    )}
                </div>

                <div className={styles.itemAcoes}>
                    <div className={styles.precos}>
                        <div className={styles.precoBloco}>
                            <span className={styles.precoValor}>{GetCurrencyBRL(produto.valor)}</span>
                            <span className={styles.precoLabel}>Menu</span>
                        </div>
                        {produto.valorKeeta != null && produto.valorKeeta > 0 && (
                            <div className={styles.precoBloco}>
                                <span className={styles.precoValor}>{GetCurrencyBRL(produto.valorKeeta)}</span>
                                <span className={styles.precoLabel}>Keeta</span>
                            </div>
                        )}
                    </div>

                    <button
                        className={`${styles.btnComplementos} ${complementosAberto ? styles.btnComplementosAtivo : ''}`}
                        disabled={carregandoDetalhe}
                        onClick={onToggleComplementos}
                    >
                        <FiLayers size={13} />
                        Complementos
                        {qtdGrupos != null && qtdGrupos > 0 && (
                            <span className={styles.complementosBadge}>{qtdGrupos}</span>
                        )}
                    </button>

                    <span className={`${styles.statusChip} ${produto.visivelMenu ? styles.statusAtivo : styles.statusPausado}`}>
                        {produto.visivelMenu ? 'Ativo' : 'Pausado'}
                    </span>
                    <button
                        className={`${styles.iconBtn} ${produto.visivelMenu ? styles.iconBtnAtivo : styles.iconBtnPausado}`}
                        disabled={togglando.has(`p-${produto.id}`)}
                        title={produto.visivelMenu ? 'Pausar item' : 'Ativar item'}
                        onClick={onToggleProduto}
                    >
                        {produto.visivelMenu ? <FiPause size={15} /> : <FiPlay size={15} />}
                    </button>
                </div>
            </div>

            {/* Grupos de complemento */}
            {complementosAberto && (
                <div className={styles.complementosBox}>
                    {carregandoDetalhe ? (
                        <div className={styles.complementosLoading}>Carregando complementos...</div>
                    ) : grupos.length === 0 ? (
                        <div className={styles.complementosLoading}>
                            Este item não possui grupos de complemento.
                        </div>
                    ) : (
                        grupos.map(grupo => (
                            <div key={grupo.id} className={styles.grupoCard}>
                                <div className={styles.grupoHeader}>
                                    <FiLayers size={14} color="#94a3b8" />
                                    <span className={styles.grupoNome}>{grupo.descricao}</span>
                                    <span className={styles.tipoBadge}>
                                        {TIPO_LABELS[grupo.tipo] ?? grupo.tipo}
                                    </span>
                                    <span className={styles.grupoMeta}>
                                        {grupo.minimo}–{grupo.maximo} · {grupo.itens?.length ?? 0} itens
                                    </span>
                                    <div className={styles.grupoHeaderRight}>
                                        <span className={`${styles.statusChip} ${grupo.status ? styles.statusAtivo : styles.statusPausado}`}>
                                            {grupo.status ? 'Ativo' : 'Pausado'}
                                        </span>
                                        <button
                                            className={`${styles.iconBtn} ${grupo.status ? styles.iconBtnAtivo : styles.iconBtnPausado}`}
                                            disabled={togglando.has(`g-${grupo.id}`)}
                                            title={grupo.status ? 'Pausar grupo inteiro' : 'Ativar grupo inteiro'}
                                            onClick={() => onToggleGrupo(grupo)}
                                        >
                                            {grupo.status ? <FiPause size={13} /> : <FiPlay size={13} />}
                                        </button>
                                    </div>
                                </div>

                                <div className={styles.grupoItens}>
                                    {!grupo.itens || grupo.itens.length === 0 ? (
                                        <div className={styles.grupoSemItens}>Nenhum complemento neste grupo.</div>
                                    ) : (
                                        grupo.itens.map(item => (
                                            <div
                                                key={item.id}
                                                className={`${styles.grupoItemRow} ${!item.status ? styles.itemPausado : ''}`}
                                            >
                                                <div className={styles.grupoItemInfo}>
                                                    <span className={styles.grupoItemNome}>{item.nome}</span>
                                                    {item.descricao && (
                                                        <span className={styles.grupoItemDesc}>{item.descricao}</span>
                                                    )}
                                                </div>
                                                {item.valor > 0 && (
                                                    <span className={styles.grupoItemValor}>
                                                        {GetCurrencyBRL(item.valor)}
                                                    </span>
                                                )}
                                                <button
                                                    className={`${styles.iconBtn} ${item.status ? styles.iconBtnAtivo : styles.iconBtnPausado}`}
                                                    disabled={togglando.has(`i-${item.id}`) || togglando.has(`g-${grupo.id}`)}
                                                    title={item.status ? 'Pausar complemento' : 'Ativar complemento'}
                                                    onClick={() => onToggleItemGrupo(grupo, item)}
                                                >
                                                    {item.status ? <FiPause size={13} /> : <FiPlay size={13} />}
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </>
    );
}
