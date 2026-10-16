import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import {
    FiArrowLeft, FiRefreshCw, FiUpload, FiAlertTriangle, FiEdit2,
    FiPause, FiPlay, FiCheck, FiX, FiChevronDown, FiChevronRight, FiRotateCcw
} from "react-icons/fi";
import { food99Service } from "../../../services/food99Service";
import { produtoService } from "../../../services/produtoService";
import { api } from "../../../services/apiClient";
import {
    Food99ItemPreco, Food99MenuGrupo, Food99MenuItem, Food99MenuPreview, Food99MenuTarefa, Food99Problema
} from "../../../interfaces/food99";
import IProduto from "@/interfaces/IProduto";
import { AuthContext } from "@/contexts/AuthContext";
import CustomButton from "@/components/ui/Buttons";
import BaseModal from "@/components/Modals/Base/Index";
import { fGetNumber, GetCurrencyBRL } from "@/utils/functions";
import styles from "./styles.module.scss";

const TAREFA_STATUS: Record<number, { texto: string; classe: string }> = {
    0: { texto: "Aguardando", classe: "neutro" },
    1: { texto: "Concluído", classe: "ok" },
    2: { texto: "Falhou", classe: "erro" },
    3: { texto: "Nova tentativa", classe: "neutro" },
    4: { texto: "Executando", classe: "neutro" },
    5: { texto: "Concluído com avisos", classe: "aviso" },
};

const TAREFA_FINAL = [1, 2, 5];

const OPERACAO_LABEL: Record<string, string> = {
    menuCreate: "Criar menu", menuUpdate: "Atualizar menu",
    cateCreate: "Criar categoria", cateUpdate: "Atualizar categoria", cateDel: "Remover categoria",
    itemCreate: "Criar item", itemUpdate: "Atualizar item", itemDel: "Remover item",
    imageUrlCheck: "Imagem do item", itemSoldInfoIntl: "Horário de venda",
    parameterBuild: "Validação dos dados",
};

const brl = (centavos: number) => GetCurrencyBRL(centavos / 100);

/** "p12" → 12. Itens de adicional ("o_...") não têm produto. */
const produtoIdDe = (appItemId: string): number | null =>
    /^p\d+$/.test(appItemId) ? Number(appItemId.slice(1)) : null;

/** Produto de origem de um app_item_id: "p12", "z12_..." (pizza) ou "zmm12_..." (pizza com vários sabores). */
const produtoDoItem = (appItemId: string): number | null => {
    const m = /^(?:p|zmm|z)(\d+)(?:_|$)/.exec(appItemId);
    return m ? Number(m[1]) : null;
};

/** Primeira frase da mensagem: cabe no selo da linha; a completa fica no tooltip. */
const resumo = (mensagem: string) => mensagem.split(/\.\s/)[0].replace(/\.$/, "");

export default function Food99CardapioPage() {
    const router = useRouter();
    const { getUser } = useContext(AuthContext);
    const [empresaId, setEmpresaId] = useState(0);

    const [preview, setPreview] = useState<Food99MenuPreview | null>(null);
    const [erroPreview, setErroPreview] = useState<string | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [produtos, setProdutos] = useState<IProduto[]>([]);
    const [tarefas, setTarefas] = useState<Food99MenuTarefa[]>([]);
    const [tarefaAberta, setTarefaAberta] = useState<string | null>(null);
    const [categoriasFechadas, setCategoriasFechadas] = useState<Set<string>>(new Set());

    const [modalEnviar, setModalEnviar] = useState(false);
    const [enviando, setEnviando] = useState(false);

    const [editando, setEditando] = useState<{ produtoId: number; valor: string } | null>(null);
    const [salvandoPreco, setSalvandoPreco] = useState(false);
    // Só guarda o que foi pausado nesta tela: o 99Food não informa o estado atual dos itens.
    const [pausados, setPausados] = useState<Set<string>>(new Set());
    const [alterandoItem, setAlterandoItem] = useState<string | null>(null);
    // Preço escolhido para itens de pizza (sabor × tamanho) e filtro da lista.
    const [editandoPizza, setEditandoPizza] = useState<{ appItemId: string; valor: string } | null>(null);
    const [filtro, setFiltro] = useState("");
    const [soProblemas, setSoProblemas] = useState(false);

    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => { carregarEmpresaId(); return pararPolling; }, []);
    useEffect(() => { if (empresaId > 0) carregarTudo(); }, [empresaId]);

    async function carregarEmpresaId() {
        const user = await getUser();
        if (user) setEmpresaId(user.empresaSelecionada);
    }

    async function carregarTudo() {
        setCarregando(true);
        await Promise.all([carregarPreview(), carregarTarefas(), carregarProdutos()]);
        setCarregando(false);
    }

    async function carregarPreview() {
        const r = await food99Service.previewCardapio(empresaId);
        if (r.sucesso) { setPreview(r.dados); setErroPreview(null); }
        else { setPreview(null); setErroPreview(r.erro); }
    }

    async function carregarTarefas() {
        const r = await food99Service.listarTarefas(empresaId);
        if (!r.sucesso) return;
        setTarefas(r.dados);
        // Retoma o acompanhamento se havia envio em andamento.
        const pendente = r.dados.find(t => !TAREFA_FINAL.includes(t.status));
        if (pendente) iniciarPolling(pendente.taskId);
    }

    async function carregarProdutos() {
        try { setProdutos(await produtoService.getAll(empresaId)); } catch { /* o preço continua visível, só não dá para editar */ }
    }

    // ─── Acompanhamento do upload ───────────────────────────────────────────

    function pararPolling() {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    }

    function iniciarPolling(taskId: string) {
        pararPolling();
        let tentativas = 0;
        pollRef.current = setInterval(async () => {
            tentativas++;
            const r = await food99Service.consultarTarefa(empresaId, taskId);
            if (r.sucesso) {
                setTarefas(prev => prev.map(t => (t.taskId === taskId ? { ...t, ...r.dados } : t)));
                if (TAREFA_FINAL.includes(r.dados.status)) {
                    pararPolling();
                    const ok = r.dados.status === 1;
                    (ok ? toast.success : toast.warning)(
                        ok ? "Cardápio atualizado no 99Food." : "Envio concluído com avisos. Veja o detalhe."
                    );
                }
            }
            if (tentativas >= 30) pararPolling(); // ~5 min; o webhook também atualiza a tarefa
        }, 10000);
    }

    async function onEnviar() {
        setEnviando(true);
        const r = await food99Service.enviarCardapio(empresaId);
        setEnviando(false);
        setModalEnviar(false);
        if (!r.sucesso) { toast.error(r.erro || "Erro ao enviar o cardápio."); return; }
        toast.info("Cardápio enviado. Acompanhando o processamento no 99Food...");
        setTarefas(prev => [r.dados, ...prev.filter(t => t.taskId !== r.dados.taskId)]);
        setTarefaAberta(r.dados.taskId);
        iniciarPolling(r.dados.taskId);
    }

    // ─── Preço e disponibilidade ────────────────────────────────────────────

    const produtoPorId = useMemo(() => {
        const m = new Map<number, IProduto>();
        produtos.forEach(p => m.set(p.id, p));
        return m;
    }, [produtos]);

    async function salvarPreco() {
        if (!editando) return;
        const produto = produtoPorId.get(editando.produtoId);
        if (!produto) { toast.error("Produto não encontrado."); return; }
        setSalvandoPreco(true);
        try {
            // Vazio ou 0 = o 99Food usa o mesmo preço do menu digital.
            await api.put(`/produto/UpdateProduct`, { ...produto, valor99: fGetNumber(editando.valor) });
            toast.success("Preço do 99Food atualizado. Envie o cardápio para aplicar.");
            setEditando(null);
            await Promise.all([carregarPreview(), carregarProdutos()]);
        } catch {
            toast.error("Erro ao salvar o preço.");
        } finally {
            setSalvandoPreco(false);
        }
    }

    /** valor nulo = volta ao preço padrão do cadastro. */
    async function salvarPrecoPizza(appItemId: string, valor: string | null) {
        setSalvandoPreco(true);
        const numero = valor == null ? null : fGetNumber(valor);
        const r = await food99Service.definirPrecoItem(empresaId, appItemId, numero && numero > 0 ? numero : null);
        setSalvandoPreco(false);
        if (!r.sucesso) { toast.error(r.erro || "Erro ao salvar o preço."); return; }
        toast.success(numero && numero > 0 ? "Preço escolhido. Envie o cardápio para aplicar." : "Preço padrão restaurado.");
        setEditandoPizza(null);
        await carregarPreview();
    }

    async function alterarDisponibilidade(item: Food99MenuItem, disponivel: boolean) {
        setAlterandoItem(item.app_item_id);
        const r = await food99Service.atualizarStatusItens(empresaId, [item.app_item_id], disponivel ? 1 : 2);
        setAlterandoItem(null);
        const falhou = r.dados?.failed?.includes(item.app_item_id);
        if (!r.sucesso || falhou) {
            toast.error(r.erro || "O 99Food não alterou o item. Envie o cardápio antes de pausar itens.");
            return;
        }
        setPausados(prev => {
            const n = new Set(prev);
            disponivel ? n.delete(item.app_item_id) : n.add(item.app_item_id);
            return n;
        });
        toast.success(disponivel ? "Item disponível." : "Item pausado.");
    }

    // ─── Dados derivados do preview ─────────────────────────────────────────

    const itensPorId = useMemo(() => {
        const m = new Map<string, Food99MenuItem>();
        preview?.cardapio.items.forEach(i => m.set(i.app_item_id, i));
        return m;
    }, [preview]);

    const itensPrecoPorId = useMemo(() => {
        const m = new Map<string, Food99ItemPreco>();
        preview?.itensPreco?.forEach(i => m.set(i.appItemId, i));
        return m;
    }, [preview]);

    // Problemas do cardápio frente às regras do 99Food, por produto (os sem produto são gerais, ex.: limites).
    const problemasPorProduto = useMemo(() => {
        const m = new Map<number, Food99Problema[]>();
        preview?.problemas?.forEach(p => {
            if (p.produtoId == null) return;
            m.set(p.produtoId, [...(m.get(p.produtoId) ?? []), p]);
        });
        return m;
    }, [preview]);

    const errosCount = preview?.problemas?.filter(p => p.nivel === "ERRO").length ?? 0;
    const avisosCount = preview?.problemas?.filter(p => p.nivel === "AVISO").length ?? 0;
    const problemasGerais = preview?.problemas?.filter(p => p.produtoId == null) ?? [];

    const gruposPorId = useMemo(() => {
        const m = new Map<string, Food99MenuGrupo>();
        preview?.cardapio.modifier_groups.forEach(g => m.set(g.app_modifier_group_id, g));
        return m;
    }, [preview]);

    function alternarCategoria(id: string) {
        setCategoriasFechadas(prev => {
            const n = new Set(prev);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
        });
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button className={styles.backButton} onClick={() => router.push("/food99")}>
                    <FiArrowLeft size={14} /> Voltar
                </button>
                <h1>Cardápio 99Food</h1>
                <CustomButton typeButton="outline-main" loading={carregando} onClick={carregarTudo}>
                    <FiRefreshCw size={14} /> Atualizar
                </CustomButton>
                <CustomButton
                    disabled={!preview || errosCount > 0}
                    title={errosCount > 0 ? `Corrija ${errosCount} problema(s) para poder enviar` : undefined}
                    onClick={() => setModalEnviar(true)}
                >
                    <FiUpload size={14} /> Enviar ao 99Food
                </CustomButton>
            </div>

            {erroPreview && (
                <div className={styles.card}>
                    <div className={styles.cardBody}>
                        <p className={styles.erro}>{erroPreview}</p>
                    </div>
                </div>
            )}

            {preview && (
                <>
                    <div className={styles.resumo}>
                        <Resumo valor={preview.categorias} rotulo="Categorias" />
                        <Resumo valor={preview.itensVendaveis} rotulo="Produtos" />
                        <Resumo valor={preview.gruposModificadores} rotulo="Grupos de adicionais" />
                        <Resumo valor={preview.itensTotal - preview.itensVendaveis} rotulo="Adicionais" />
                    </div>

                    {(errosCount > 0 || avisosCount > 0) && (
                        <div className={errosCount > 0 ? styles.erros : styles.avisos}>
                            <div className={styles.avisosTitulo}>
                                <FiAlertTriangle size={15} />
                                {errosCount > 0
                                    ? `${errosCount} problema(s) fora das regras do 99Food — o envio está bloqueado`
                                    : `${avisosCount} ponto(s) de atenção`}
                            </div>
                            <ul>
                                {(preview.problemas ?? []).map((p, i) => (
                                    <li key={i}>
                                        <b>{p.nivel === "ERRO" ? "Erro" : "Aviso"}</b>
                                        {p.produtoNome ? ` · ${p.produtoNome}` : ""}: {p.mensagem}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {preview.avisos.length > 0 && (
                        <div className={styles.avisos}>
                            <div className={styles.avisosTitulo}>
                                <FiAlertTriangle size={15} /> {preview.avisos.length} aviso(s) — itens que não serão enviados
                            </div>
                            <ul>
                                {preview.avisos.map((a, i) => <li key={i}>{a}</li>)}
                            </ul>
                        </div>
                    )}

                    {(errosCount > 0 || avisosCount > 0) && (
                        <button
                            className={styles.linkButton}
                            style={soProblemas ? { borderColor: "var(--danger)", color: "var(--danger)" } : undefined}
                            onClick={() => setSoProblemas(v => !v)}
                        >
                            <FiAlertTriangle size={13} /> {soProblemas ? "Mostrando só itens com problema" : "Só itens com problema"}
                        </button>
                    )}
                    <input
                        className={styles.busca}
                        placeholder="Buscar item..."
                        value={filtro}
                        onChange={e => setFiltro(e.target.value)}
                    />

                    {preview.cardapio.categories.map(cat => {
                        const itens = cat.app_item_ids
                            .map(id => itensPorId.get(id))
                            .filter((i): i is Food99MenuItem =>
                                !!i && i.is_sold_separately &&
                                (!filtro || i.item_name.toLowerCase().includes(filtro.toLowerCase())) &&
                                (!soProblemas || problemasPorProduto.has(produtoDoItem(i.app_item_id) ?? -1)));
                        if ((filtro || soProblemas) && itens.length === 0) return null;
                        const fechada = categoriasFechadas.has(cat.app_category_id);
                        return (
                            <div className={styles.card} key={cat.app_category_id}>
                                <button className={styles.cardHeader} onClick={() => alternarCategoria(cat.app_category_id)}>
                                    <span className={styles.cardTitle}>
                                        {fechada ? <FiChevronRight size={15} /> : <FiChevronDown size={15} />}
                                        {cat.category_name}
                                    </span>
                                    <span className={styles.contador}>{itens.length} produto(s)</span>
                                </button>
                                {!fechada && (
                                    <div className={styles.lista}>
                                        {itens.map(item => {
                                            const pid = produtoIdDe(item.app_item_id);
                                            const produto = pid != null ? produtoPorId.get(pid) : undefined;
                                            const proprio = (produto?.valor99 ?? 0) > 0;
                                            const emEdicao = editando?.produtoId === pid && pid != null;
                                            const pausado = pausados.has(item.app_item_id);
                                            const ip = itensPrecoPorId.get(item.app_item_id);
                                            return (
                                                <div className={styles.linha} key={item.app_item_id}>
                                                    <div className={styles.linhaInfo}>
                                                        <span className={styles.itemNome}>
                                                            {item.item_name}
                                                            {pausado && <span className={styles.pausado}>Pausado</span>}
                                                        </span>
                                                        {(problemasPorProduto.get(produtoDoItem(item.app_item_id) ?? -1) ?? []).length > 0 && (
                                                            <span className={styles.grupos}>
                                                                {problemasPorProduto.get(produtoDoItem(item.app_item_id) ?? -1)!.map((pb, k) => (
                                                                    <span
                                                                        key={k}
                                                                        className={pb.nivel === "ERRO" ? styles.selosErro : styles.selosAviso}
                                                                        title={pb.mensagem}
                                                                    >
                                                                        <FiAlertTriangle size={11} /> {resumo(pb.mensagem)}
                                                                    </span>
                                                                ))}
                                                            </span>
                                                        )}
                        <span className={styles.itemId} title="app_item_id no 99Food (clique para selecionar)">
                                                            {item.app_item_id}
                                                        </span>
                                                        {(item.app_modifier_group_ids ?? []).length > 0 && (
                                                            <span className={styles.grupos}>
                                                                {item.app_modifier_group_ids!.map(g => {
                                                                    const grupo = gruposPorId.get(g);
                                                                    return grupo ? (
                                                                        <span className={styles.grupoChip} key={g}
                                                                            title={grupo.app_mg_items.map(o => `${itensPorId.get(o.app_item_id)?.item_name ?? o.app_item_id} (${brl(o.price)})`).join("\n")}>
                                                                            {grupo.modifier_group_name}
                                                                            {grupo.is_required === 1 ? " *" : ""}
                                                                        </span>
                                                                    ) : null;
                                                                })}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className={styles.linhaPreco}>
                                                        {ip ? (
                                                            ip.editavel ? (
                                                                editandoPizza?.appItemId === ip.appItemId ? (
                                                                    <>
                                                                        <input
                                                                            className={styles.inputPreco}
                                                                            autoFocus
                                                                            inputMode="decimal"
                                                                            placeholder={`${GetCurrencyBRL(ip.precoPadrao)} (padrão)`}
                                                                            value={editandoPizza.valor}
                                                                            onChange={e => setEditandoPizza({ appItemId: ip.appItemId, valor: e.target.value })}
                                                                            onKeyDown={e => {
                                                                                if (e.key === "Enter") salvarPrecoPizza(ip.appItemId, editandoPizza.valor);
                                                                                if (e.key === "Escape") setEditandoPizza(null);
                                                                            }}
                                                                        />
                                                                        <button className={styles.iconButton} disabled={salvandoPreco}
                                                                            onClick={() => salvarPrecoPizza(ip.appItemId, editandoPizza.valor)} title="Salvar">
                                                                            <FiCheck size={15} />
                                                                        </button>
                                                                        <button className={styles.iconButton} onClick={() => setEditandoPizza(null)} title="Cancelar">
                                                                            <FiX size={15} />
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <span className={styles.preco}>{brl(item.price)}</span>
                                                                        <span className={ip.precoEscolhido != null ? styles.origemPropria : styles.origem}>
                                                                            {ip.precoEscolhido != null ? "preço escolhido" : "padrão"}
                                                                        </span>
                                                                        <button
                                                                            className={styles.iconButton}
                                                                            title="Escolher o preço deste item"
                                                                            onClick={() => setEditandoPizza({
                                                                                appItemId: ip.appItemId,
                                                                                valor: ip.precoEscolhido != null ? String(ip.precoEscolhido).replace(".", ",") : "",
                                                                            })}
                                                                        >
                                                                            <FiEdit2 size={14} />
                                                                        </button>
                                                                        {ip.precoEscolhido != null && (
                                                                            <button
                                                                                className={styles.iconButton}
                                                                                disabled={salvandoPreco}
                                                                                title={`Voltar ao preço padrão (${GetCurrencyBRL(ip.precoPadrao)})`}
                                                                                onClick={() => salvarPrecoPizza(ip.appItemId, null)}
                                                                            >
                                                                                <FiRotateCcw size={14} />
                                                                            </button>
                                                                        )}
                                                                    </>
                                                                )
                                                            ) : (
                                                                <span className={styles.origem} title="Cada sabor entra com a fração do seu preço; o total é a média dos sabores escolhidos.">
                                                                    preço pela média dos sabores
                                                                </span>
                                                            )
                                                        ) : emEdicao ? (
                                                            <>
                                                                <input
                                                                    className={styles.inputPreco}
                                                                    autoFocus
                                                                    inputMode="decimal"
                                                                    placeholder={`${GetCurrencyBRL(produto?.valor ?? 0)} (menu)`}
                                                                    value={editando!.valor}
                                                                    onChange={e => setEditando({ produtoId: pid!, valor: e.target.value })}
                                                                    onKeyDown={e => { if (e.key === "Enter") salvarPreco(); if (e.key === "Escape") setEditando(null); }}
                                                                />
                                                                <button className={styles.iconButton} disabled={salvandoPreco} onClick={salvarPreco} title="Salvar">
                                                                    <FiCheck size={15} />
                                                                </button>
                                                                <button className={styles.iconButton} onClick={() => setEditando(null)} title="Cancelar">
                                                                    <FiX size={15} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className={styles.preco}>{brl(item.price)}</span>
                                                                <span className={proprio ? styles.origemPropria : styles.origem}>
                                                                    {proprio ? "preço 99Food" : "= menu"}
                                                                </span>
                                                                {produto && (
                                                                    <button
                                                                        className={styles.iconButton}
                                                                        title="Definir preço do 99Food"
                                                                        onClick={() => setEditando({
                                                                            produtoId: pid!,
                                                                            valor: proprio ? String(produto.valor99).replace(".", ",") : "",
                                                                        })}
                                                                    >
                                                                        <FiEdit2 size={14} />
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>

                                                    <button
                                                        className={styles.linkButton}
                                                        disabled={alterandoItem === item.app_item_id}
                                                        onClick={() => alterarDisponibilidade(item, pausado)}
                                                        title={pausado ? "Voltar a vender no 99Food" : "Parar de vender no 99Food"}
                                                    >
                                                        {pausado ? <><FiPlay size={13} /> Ativar</> : <><FiPause size={13} /> Pausar</>}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {preview.cardapio.modifier_groups.length > 0 && (
                        <div className={styles.card}>
                            <div className={styles.cardHeader} style={{ cursor: "default" }}>
                                <span className={styles.cardTitle}>Grupos de adicionais</span>
                            </div>
                            <div className={styles.lista}>
                                {preview.cardapio.modifier_groups.map(g => (
                                    <div className={styles.linha} key={g.app_modifier_group_id} style={{ alignItems: "flex-start" }}>
                                        <div className={styles.linhaInfo}>
                                            <span className={styles.itemNome}>{g.modifier_group_name}</span>
                                            <span className={styles.detalhe}>
                                                {g.is_required === 1 ? "Obrigatório" : "Opcional"} · de {g.quantity_min_permitted} a {g.quantity_max_permitted}
                                            </span>
                                        </div>
                                        <div className={styles.opcoes}>
                                            {g.app_mg_items.map(o => (
                                                <span className={styles.grupoChip} key={o.app_item_id}>
                                                    {itensPorId.get(o.app_item_id)?.item_name ?? o.app_item_id} · {brl(o.price)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            <div className={styles.card}>
                <div className={styles.cardHeader} style={{ cursor: "default" }}>
                    <span className={styles.cardTitle}>Envios ao 99Food</span>
                </div>
                <div className={styles.lista}>
                    {tarefas.length === 0 && <p className={styles.vazio}>Nenhum cardápio enviado ainda.</p>}
                    {tarefas.map(t => {
                        const st = TAREFA_STATUS[t.status] ?? { texto: String(t.status), classe: "neutro" };
                        const aberta = tarefaAberta === t.taskId;
                        const operacoes = t.detalhe?.operationList ?? [];
                        const falhas = operacoes.flatMap(o => (o.failedList ?? []).map(f => ({ ...f, operacao: o.operationType })));
                        return (
                            <div key={t.taskId}>
                                <button className={styles.linhaTarefa} onClick={() => setTarefaAberta(aberta ? null : t.taskId)}>
                                    <span className={`${styles.statusTarefa} ${styles[st.classe]}`}>{st.texto}</span>
                                    <span>{new Date(t.criadoEm).toLocaleString("pt-BR")}</span>
                                    <span className={styles.detalhe}>
                                        {t.qtdCategorias} categorias · {t.qtdItens} itens · {t.qtdGrupos} grupos
                                    </span>
                                    {falhas.length > 0 && <span className={styles.contadorErro}>{falhas.length} falha(s)</span>}
                                </button>
                                {aberta && (
                                    <div className={styles.tarefaDetalhe}>
                                        {t.mensagem && <p className={styles.detalhe}>Situação no 99Food: {t.mensagem}</p>}
                                        {t.avisos && t.avisos.length > 0 && (
                                            <ul>{t.avisos.map((a, i) => <li key={i}>{a}</li>)}</ul>
                                        )}
                                        {operacoes.length === 0 && !TAREFA_FINAL.includes(t.status) && (
                                            <p className={styles.detalhe}>Aguardando o resultado do processamento...</p>
                                        )}
                                        {falhas.length > 0 && (
                                            <table className={styles.tabela}>
                                                <thead><tr><th>Operação</th><th>Item</th><th>Motivo</th></tr></thead>
                                                <tbody>
                                                    {falhas.map((f, i) => (
                                                        <tr key={i}>
                                                            <td>{OPERACAO_LABEL[f.operacao] ?? f.operacao}</td>
                                                            <td>{f.itemName || f.cateName || f.menuName || f.appItemID || "—"}</td>
                                                            <td>{f.message || "—"}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                        {TAREFA_FINAL.includes(t.status) && falhas.length === 0 && operacoes.length > 0 && (
                                            <p className={styles.detalhe}>Sem falhas reportadas.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <BaseModal
                isOpen={modalEnviar}
                title="Enviar cardápio ao 99Food"
                setClose={() => setModalEnviar(false)}
                width="440px"
            >
                <div className={styles.form}>
                    <p className={styles.formDesc}>
                        O envio <b>substitui todo o cardápio da loja no 99Food</b>: itens e categorias que não
                        estiverem nesta lista serão removidos de lá. Se ainda não validou, teste primeiro em uma loja de teste.
                    </p>
                    {preview && (
                        <p className={styles.formDesc}>
                            Serão enviados {preview.categorias} categoria(s), {preview.itensVendaveis} produto(s) e {preview.gruposModificadores} grupo(s) de adicionais.
                            O 99Food aceita 1 envio por minuto.
                        </p>
                    )}
                    <div className={styles.formActions}>
                        <CustomButton typeButton="outline-main" onClick={() => setModalEnviar(false)}>
                            Cancelar
                        </CustomButton>
                        <CustomButton loading={enviando} onClick={onEnviar}>
                            Enviar e substituir
                        </CustomButton>
                    </div>
                </div>
            </BaseModal>
        </div>
    );
}

function Resumo({ valor, rotulo }: { valor: number; rotulo: string }) {
    return (
        <div className={styles.resumoItem}>
            <strong>{valor}</strong>
            <span>{rotulo}</span>
        </div>
    );
}
