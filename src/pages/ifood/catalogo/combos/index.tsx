// pages/ifood/catalogo/combos/index.tsx
// Combo iFood (COMBO_V2): agrupa itens JÁ CADASTRADOS no catálogo — não cria produtos do zero.
// Regras da API validadas na homologação:
//  - optionGroups do produto raiz: exatamente 1 grupo com associationType "MAIN",
//    os demais SEM o campo associationType (nem null, nem OFFER_UNIT — omitido).
//  - cada option do combo precisa de um id novo (crypto.randomUUID()); o productId
//    é que referencia o produto já existente no catálogo.
//  - categoryId é obrigatório no item do combo.
//  - todo grupo (definição completa, não a ref no produto) precisa de
//    optionGroupType: "OFFER_UNIT" — inclusive o grupo principal.
//  - salvarItem usa withRetry com 0 tentativas: nunca reenvia (erro de validação nunca
//    se resolve sozinho), mas ainda converte a resposta 400 em {sucesso:false, erro}
//    em vez de deixar o axios lançar direto pro catch genérico.

import { useState, useRef, useContext, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import {
  FiArrowLeft, FiUpload, FiPlus, FiTrash2,
  FiCheck, FiLoader, FiAlertCircle, FiChevronDown,
  FiChevronUp, FiSave, FiStar, FiSearch,
} from "react-icons/fi";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { AuthContext } from "@/contexts/AuthContext";
import { ifoodCatalogService } from "@/services/ifoodCatalogService";
import type {
  IFoodCategoriaDetalhe,
  IFoodItemDaCategoria,
  IFoodSalvarItemDto,
  IFoodItemPayload,
  IFoodProdutoPayload,
  IFoodGrupoOpcaoPayload,
  IFoodOpcaoPayload,
  IFoodShift,
} from "@/interfaces/ifoodCatalog";
import { humanizarErro, withRetry } from "@/utils/ifoodApiUtils";
import styles from "./styles.module.scss";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Aba = "produtos" | "preco" | "disponibilidade";

const ABAS: { key: Aba; label: string }[] = [
  { key: "produtos",       label: "Produtos"       },
  { key: "preco",          label: "Preço"          },
  { key: "disponibilidade",label: "Disponibilidade"},
];

type ModoPreco = "soma" | "fixo";

interface ProdutoDoGrupo {
  /** id novo da option — nunca reaproveita o id do item de origem no catálogo */
  optionId: string;
  itemOrigemId: string;
  productId: string;
  nome: string;
  preco: number;
  imagePath?: string | null;
}

interface GrupoCombo {
  id: string;
  nome: string;
  min: number;
  max: number;
  principal: boolean;
  aberto: boolean;
  produtos: ProdutoDoGrupo[];
}

interface TurnoDisponibilidade {
  id: string;
  startTime: string;
  endTime: string;
  dias: string[];
}

const DIAS_SEMANA = [
  { key: "monday",    label: "Seg" },
  { key: "tuesday",   label: "Ter" },
  { key: "wednesday", label: "Qua" },
  { key: "thursday",  label: "Qui" },
  { key: "friday",    label: "Sex" },
  { key: "saturday",  label: "Sáb" },
  { key: "sunday",    label: "Dom" },
];

// ─── Modal: selecionar produtos do catálogo ──────────────────────────────────

function ModalSelecionarProdutos({
  categorias,
  jaAdicionados,
  onFechar,
  onAgrupar,
}: {
  categorias: IFoodCategoriaDetalhe[];
  jaAdicionados: Set<string>;
  onFechar: () => void;
  onAgrupar: (itens: IFoodItemDaCategoria[]) => void;
}) {
  const [busca, setBusca] = useState("");
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  const itensFiltrados = useMemo(() => {
    return categorias
      .filter(c => c.template !== "PIZZA")
      .map(c => ({
        categoria: c.name,
        itens: (c.items ?? []).filter(i =>
          i.name.toLowerCase().includes(busca.toLowerCase())
        ),
      }))
      .filter(g => g.itens.length > 0);
  }, [categorias, busca]);

  function toggle(id: string) {
    setSelecionados(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function confirmar() {
    const todos = categorias.flatMap(c => c.items ?? []);
    const itens = todos.filter(i => selecionados.has(i.id));
    onAgrupar(itens);
  }

  return (
    <div className={styles.modalOverlay} onClick={onFechar}>
      <div className={styles.modalProdutos} onClick={e => e.stopPropagation()}>
        <div className={styles.modalProdutosHeader}>
          <h3>Adicionar produtos ao grupo</h3>
          <button className={styles.modalFechar} onClick={onFechar}>×</button>
        </div>
        <div className={styles.buscaWrapper}>
          <FiSearch size={14} className={styles.buscaIcon} />
          <input
            className={styles.buscaInput}
            placeholder="Buscar produto"
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
        <div className={styles.modalProdutosLista}>
          {itensFiltrados.length === 0 && (
            <p className={styles.semItens}>Nenhum produto encontrado.</p>
          )}
          {itensFiltrados.map(grupo => (
            <div key={grupo.categoria} className={styles.produtoGrupoCategoria}>
              <span className={styles.produtoGrupoCategoriaNome}>{grupo.categoria}</span>
              {grupo.itens.map(item => {
                const jaEsta = jaAdicionados.has(item.id);
                return (
                  <label
                    key={item.id}
                    className={`${styles.produtoOpcaoRow} ${jaEsta ? styles.produtoOpcaoDesabilitada : ""}`}
                  >
                    <input
                      type="checkbox"
                      disabled={jaEsta}
                      checked={selecionados.has(item.id)}
                      onChange={() => toggle(item.id)}
                    />
                    {item.imagePath ? (
                      <img src={item.imagePath} alt="" className={styles.produtoOpcaoImagem} />
                    ) : (
                      <div className={styles.produtoOpcaoImagemPlaceholder} />
                    )}
                    <span className={styles.produtoOpcaoNome}>
                      {item.name}{jaEsta ? " (já no combo)" : ""}
                    </span>
                    <span className={styles.produtoOpcaoPreco}>
                      R$ {item.price.value.toFixed(2).replace(".", ",")}
                    </span>
                  </label>
                );
              })}
            </div>
          ))}
        </div>
        <div className={styles.modalProdutosFooter}>
          <span className={styles.selecionadosCount}>
            {selecionados.size} selecionado{selecionados.size !== 1 ? "s" : ""}
          </span>
          <div className={styles.formActions}>
            <button className={styles.btnCancelarModal} onClick={onFechar}>Cancelar</button>
            <button
              className={styles.btnAgruparModal}
              disabled={selecionados.size === 0}
              onClick={confirmar}
            >
              <FiPlus size={14} /> Agrupar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Grupo do combo (accordion) ──────────────────────────────────────────────

function GrupoComboInline({
  grupo,
  onUpdate,
  onRemove,
  onAbrirSeletor,
  onRemoverProduto,
}: {
  grupo: GrupoCombo;
  onUpdate: (patch: Partial<GrupoCombo>) => void;
  onRemove: () => void;
  onAbrirSeletor: () => void;
  onRemoverProduto: (optionId: string) => void;
}) {
  return (
    <div className={`${styles.grupoInline} ${grupo.principal ? styles.grupoInlinePrincipal : ""}`}>
      <div className={styles.grupoInlineHeader}>
        <button className={styles.grupoInlineToggle} onClick={() => onUpdate({ aberto: !grupo.aberto })}>
          <div className={styles.grupoInlineHeaderLeft}>
            <span className={styles.grupoInlineNomePreview}>
              {grupo.nome || <em className={styles.grupoSemNome}>Novo grupo</em>}
              {grupo.principal && (
                <span className={styles.badgePrincipal}><FiStar size={10} /> Principal</span>
              )}
            </span>
            <span className={styles.grupoInlineMeta}>
              {grupo.produtos.length} produto{grupo.produtos.length !== 1 ? "s" : ""}
            </span>
          </div>
          {grupo.aberto ? <FiChevronUp size={15} /> : <FiChevronDown size={15} />}
        </button>
        <button className={styles.grupoInlineBtnRemover} onClick={onRemove} title="Remover grupo">
          <FiTrash2 size={14} />
        </button>
      </div>

      {grupo.aberto && (
        <div className={styles.grupoInlineBody}>
          <div className={styles.grupoInlineRow2}>
            <div className={styles.fieldGroup} style={{ flex: 2 }}>
              <label className={styles.label}>Nome do grupo</label>
              <input
                className={styles.input}
                placeholder="Ex: Escolha seu lanche"
                value={grupo.nome}
                onChange={e => onUpdate({ nome: e.target.value })}
              />
            </div>
            <label className={styles.principalToggle}>
              <input
                type="checkbox"
                checked={grupo.principal}
                onChange={e => onUpdate({ principal: e.target.checked })}
              />
              <span><FiStar size={12} /> Grupo principal</span>
            </label>
          </div>

          <div className={styles.grupoInlineRow3}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Mín.</label>
              <input type="number" min={0} className={styles.inputXsm}
                value={grupo.min}
                onChange={e => onUpdate({ min: parseInt(e.target.value) || 0 })} />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Máx.</label>
              <input type="number" min={1} className={styles.inputXsm}
                value={grupo.max}
                onChange={e => onUpdate({ max: parseInt(e.target.value) || 1 })} />
            </div>
          </div>

          <div className={styles.grupoDivider} />

          <div className={styles.compList}>
            {grupo.produtos.length === 0 && (
              <p className={styles.compVazio}>Nenhum produto neste grupo ainda.</p>
            )}
            {grupo.produtos.map(p => (
              <div key={p.optionId} className={styles.produtoComboRow}>
                {p.imagePath ? (
                  <img src={p.imagePath} alt="" className={styles.produtoComboImagem} />
                ) : (
                  <div className={styles.produtoComboImagemPlaceholder} />
                )}
                <span className={styles.produtoComboNome}>{p.nome}</span>
                <span className={styles.produtoComboPreco}>
                  R$ {p.preco.toFixed(2).replace(".", ",")}
                </span>
                <button className={styles.compBtnRemover} onClick={() => onRemoverProduto(p.optionId)}>
                  <FiTrash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <button className={styles.btnAdicionarComp} onClick={onAbrirSeletor}>
            <FiPlus size={13} /> Adicionar produtos
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function IFoodComboPage() {
  const router = useRouter();
  const { itemId, catalogId, categoryId } = router.query as {
    itemId?: string; catalogId?: string; categoryId?: string;
  };
  const isEdicao = !!itemId;
  const { getUser } = useContext(AuthContext);

  const [empresaId, setEmpresaId] = useState(0);
  const [loading, setLoading]     = useState(isEdicao);
  const [abaAtiva, setAbaAtiva]   = useState<Aba>("produtos");
  const [salvando, setSalvando]   = useState(false);
  const [erros, setErros]         = useState<string[]>([]);

  const [categorias, setCategorias] = useState<IFoodCategoriaDetalhe[]>([]);
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState<{ id: string; name: string }[]>([]);

  const [nome, setNome]           = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [imagemBase64, setImagemBase64]   = useState<string | null>(null);

  const [modoPreco, setModoPreco] = useState<ModoPreco>("soma");
  const [precoTotal, setPrecoTotal] = useState("");
  const [desconto, setDesconto]     = useState("0");

  const [grupos, setGrupos] = useState<GrupoCombo[]>([]);
  const [seletorGrupoId, setSeletorGrupoId] = useState<string | null>(null);

  const [sempreDisponivel, setSempreDisponivel] = useState(true);
  const [turnos, setTurnos] = useState<TurnoDisponibilidade[]>([{
    id: crypto.randomUUID(),
    startTime: "08:00", endTime: "22:00",
    dias: ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"],
  }]);

  // IDs fixos — gerados uma única vez, nunca regenerados entre tentativas de salvar
  // (o iFood trava o recurso por alguns segundos se o mesmo item chegar com IDs diferentes)
  const [itemIdFixo, setItemIdFixo] = useState(() => crypto.randomUUID());
  const [productIdFixo, setProductIdFixo] = useState(() => crypto.randomUUID());

  const fileRef = useRef<HTMLInputElement>(null);

  const jaAdicionados = useMemo(
    () => new Set(grupos.flatMap(g => g.produtos.map(p => p.itemOrigemId))),
    [grupos]
  );

  const sugestaoPreco = useMemo(() => {
    const obrigatorios = grupos.filter(g => g.min > 0);
    return obrigatorios.reduce((soma, g) => {
      const maior = g.produtos.reduce((max, p) => Math.max(max, p.preco), 0);
      return soma + maior;
    }, 0);
  }, [grupos]);

  const precoFinal = useMemo(() => {
    const total = parseFloat(precoTotal) || 0;
    const pct = Math.min(99, Math.max(0, parseFloat(desconto) || 0));
    return total - (total * pct / 100);
  }, [precoTotal, desconto]);

  // ─── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function init() {
      const user = await getUser();
      if (!user) return;
      const eid = user.empresaSelecionada;
      setEmpresaId(eid);
      if (catalogId) await carregarCategorias(eid, String(catalogId));
      if (isEdicao && itemId) await carregarItem(eid, String(itemId));
    }
    if (router.isReady) init();
  }, [router.isReady]);

  async function carregarCategorias(eid: number, cId: string) {
    try {
      const r = await ifoodCatalogService.listarCategorias(eid, cId, true);
      if (r.sucesso) {
        setCategorias(r.dados);
        const disponiveis = r.dados
          .filter(c => c.template !== "PIZZA")
          .map(c => ({ id: c.id, name: c.name }));
        setCategoriasDisponiveis(disponiveis);
        if (!isEdicao) {
          const preSelecionada = categoryId && disponiveis.some(c => c.id === categoryId)
            ? String(categoryId)
            : disponiveis[0]?.id ?? "";
          setCategoriaId(preSelecionada);
        }
      }
    } catch { }
  }

  async function carregarItem(eid: number, id: string) {
    setLoading(true);
    try {
      const r = await ifoodCatalogService.obterItemFlat(eid, id);
      if (!r?.sucesso || !r.dados) return;
      const { item, products, optionGroups, options } = r.dados;

      setItemIdFixo(item.id);
      setProductIdFixo(item.productId);
      const produtoRaiz = products.find(p => p.id === item.productId);
      if (produtoRaiz) {
        setNome(produtoRaiz.name ?? "");
        setDescricao(produtoRaiz.description ?? "");
        if (produtoRaiz.imagePath) setImagemPreview(produtoRaiz.imagePath);
      }

      setCategoriaId(item.categoryId ?? "");

      if (item.price?.value) {
        setModoPreco("fixo");
        setPrecoTotal(String(item.price.originalValue ?? item.price.value));
        const pct = item.price.originalValue
          ? Math.round((1 - item.price.value / item.price.originalValue) * 100)
          : 0;
        setDesconto(String(pct));
      } else {
        setModoPreco("soma");
      }

      const refsPorGrupo = new Map(
        (produtoRaiz?.optionGroups ?? []).map(ref => [ref.id, ref])
      );

      const gruposMontados: GrupoCombo[] = optionGroups.map((og, idx) => ({
        id: og.id,
        nome: og.name,
        min: refsPorGrupo.get(og.id)?.min ?? 0,
        max: refsPorGrupo.get(og.id)?.max ?? 1,
        principal: refsPorGrupo.get(og.id)?.associationType === "MAIN",
        aberto: idx === 0,
        produtos: og.optionIds.map(optId => {
          const opt = options.find(o => o.id === optId);
          const prod = opt ? products.find(p => p.id === opt.productId) : null;
          return {
            optionId: optId,
            itemOrigemId: optId,
            productId: opt?.productId ?? "",
            nome: prod?.name ?? "",
            preco: opt?.price?.value ?? 0,
            imagePath: prod?.imagePath,
          };
        }),
      }));
      setGrupos(gruposMontados);

      if (item.shifts && item.shifts.length > 0) {
        setSempreDisponivel(false);
        setTurnos(item.shifts.map((s: any) => ({
          id: crypto.randomUUID(),
          startTime: s.startTime, endTime: s.endTime,
          dias: DIAS_SEMANA.filter(d => s[d.key]).map(d => d.key),
        })));
      }
    } finally {
      setLoading(false);
    }
  }

  // ─── Helpers de imagem ──────────────────────────────────────────────────────

  function handleImagem(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      setImagemPreview(res);
      setImagemBase64(res.split(",")[1]);
    };
    reader.readAsDataURL(file);
  }

  // ─── Grupos ─────────────────────────────────────────────────────────────────

  function addGrupo() {
    setGrupos(p => [...p, {
      id: crypto.randomUUID(), nome: "", min: 1, max: 1,
      principal: p.length === 0, aberto: true, produtos: [],
    }]);
  }
  function updateGrupo(id: string, patch: Partial<GrupoCombo>) {
    setGrupos(p => p.map(g => {
      if (g.id !== id) return g;
      return { ...g, ...patch };
    }));
  }
  function marcarPrincipal(id: string) {
    setGrupos(p => p.map(g => ({ ...g, principal: g.id === id })));
  }
  function removeGrupo(id: string) {
    setGrupos(p => p.filter(g => g.id !== id));
  }
  function onAgruparProdutos(itens: IFoodItemDaCategoria[]) {
    if (!seletorGrupoId) return;
    setGrupos(p => p.map(g => {
      if (g.id !== seletorGrupoId) return g;
      const novos: ProdutoDoGrupo[] = itens.map(item => ({
        optionId: crypto.randomUUID(),
        itemOrigemId: item.id,
        productId: item.productId,
        nome: item.name,
        preco: item.price.value,
        imagePath: item.imagePath,
      }));
      return { ...g, produtos: [...g.produtos, ...novos] };
    }));
    setSeletorGrupoId(null);
  }
  function removerProdutoDoGrupo(grupoId: string, optionId: string) {
    setGrupos(p => p.map(g => {
      if (g.id !== grupoId) return g;
      return { ...g, produtos: g.produtos.filter(pr => pr.optionId !== optionId) };
    }));
  }

  // ─── Turnos ─────────────────────────────────────────────────────────────────

  function adicionarTurno() {
    setTurnos(p => [...p, {
      id: crypto.randomUUID(), startTime: "08:00", endTime: "22:00",
      dias: ["monday","tuesday","wednesday","thursday","friday"],
    }]);
  }
  function removerTurno(id: string) { setTurnos(p => p.filter(t => t.id !== id)); }
  function atualizarTurno(id: string, patch: Partial<TurnoDisponibilidade>) {
    setTurnos(p => p.map(t => t.id === id ? { ...t, ...patch } : t));
  }
  function toggleDiaTurno(turnoId: string, dia: string) {
    setTurnos(p => p.map(t => {
      if (t.id !== turnoId) return t;
      return { ...t, dias: t.dias.includes(dia) ? t.dias.filter(d => d !== dia) : [...t.dias, dia] };
    }));
  }
  function montarShifts(): IFoodShift[] | null {
    if (sempreDisponivel) return null;
    return turnos
      .filter(t => t.startTime && t.endTime && t.dias.length > 0)
      .map(t => ({
        startTime: t.startTime, endTime: t.endTime,
        monday: t.dias.includes("monday"), tuesday: t.dias.includes("tuesday"),
        wednesday: t.dias.includes("wednesday"), thursday: t.dias.includes("thursday"),
        friday: t.dias.includes("friday"), saturday: t.dias.includes("saturday"),
        sunday: t.dias.includes("sunday"),
      }));
  }

  // ─── Payload e salvar ───────────────────────────────────────────────────────

  async function montarPayload(): Promise<IFoodSalvarItemDto | null> {
    const validacao: string[] = [];
    if (!nome.trim()) validacao.push("Informe o nome do combo.");
    if (!categoriaId) validacao.push("Selecione uma categoria.");
    if (grupos.length === 0) validacao.push("Adicione pelo menos um grupo de produtos.");
    if (grupos.some(g => g.produtos.length === 0)) validacao.push("Todo grupo precisa ter ao menos um produto.");
    if (grupos.filter(g => g.principal).length !== 1) validacao.push("Marque exatamente um grupo como principal.");
    if (modoPreco === "fixo" && (!precoTotal || Number(precoTotal) <= 0)) validacao.push("Informe o preço do combo.");
    if (validacao.length) { setErros(validacao); return null; }

    let imagePath: string | null = null;
    if (imagemBase64) {
      const up = await withRetry(() => ifoodCatalogService.uploadImagem(empresaId, imagemBase64));
      if (!up.sucesso) { setErros([humanizarErro(up.erro)]); return null; }
      imagePath = up.dados.imagePath;
    } else if (imagemPreview && !imagemPreview.startsWith("data:")) {
      imagePath = imagemPreview;
    }

    const products: IFoodProdutoPayload[] = [];
    const optionGroups: IFoodGrupoOpcaoPayload[] = [];
    const options: IFoodOpcaoPayload[] = [];

    products.push({
      id: productIdFixo,
      name: nome,
      description: descricao || null,
      imagePath,
      optionGroups: grupos.map((g, i) => ({
        id: g.id, min: g.min, max: g.max, index: i,
        ...(g.principal ? { associationType: "MAIN" } : {}),
      })),
    });

    grupos.forEach((g, gi) => {
      const optionIds: string[] = [];
      g.produtos.forEach((p, pi) => {
        optionIds.push(p.optionId);
        options.push({
          id: p.optionId,
          status: "AVAILABLE",
          index: pi,
          productId: p.productId,
          price: { value: modoPreco === "fixo" ? 0 : p.preco, originalValue: null },
        });
      });
      optionGroups.push({
        id: g.id, name: g.nome, status: "AVAILABLE",
        // Todo grupo de um combo é uma "unidade de oferta" (slot de escolha de produto),
        // não um complemento comum — o iFood exige OFFER_UNIT inclusive no grupo principal.
        optionGroupType: "OFFER_UNIT",
        optionIds, index: gi, min: g.min, max: g.max,
      });
    });

    const item: IFoodItemPayload = {
      id: itemIdFixo,
      type: "COMBO_V2",
      categoryId: categoriaId,
      status: "AVAILABLE",
      price: modoPreco === "fixo"
        ? {
            value: precoFinal,
            originalValue: Number(desconto) > 0 ? Number(precoTotal) : null,
          }
        : null,
      index: 0,
      productId: productIdFixo,
      shifts: montarShifts(),
    };

    return { item, products, optionGroups, options };
  }

  async function onSalvar() {
    setSalvando(true); setErros([]);
    try {
      const payload = await montarPayload();
      if (!payload) return;

      // tentativas=0: nunca reenvia (um BadRequest de validação nunca passa na
      // tentativa seguinte, e reenviar gera "item sendo modificado" por concorrência
      // no iFood), mas ainda assim converte a resposta 400 em {sucesso:false, erro}
      // em vez de deixar o axios lançar e cair no catch genérico abaixo.
      const result = await withRetry(() => ifoodCatalogService.salvarItem(empresaId, payload), 0);

      if (result.sucesso) {
        toast.success(isEdicao ? "Combo atualizado!" : "Combo criado!");
        router.push(`/ifood/catalogo${catalogId ? `?catalogId=${catalogId}` : ""}`);
      } else {
        setErros([humanizarErro(result.erro)]);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch {
      setErros(["Erro inesperado. Tente novamente."]);
    } finally {
      setSalvando(false);
    }
  }

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <FiLoader size={24} className={styles.spinner} />
        <p>Carregando combo...</p>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>

      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <FiArrowLeft size={16} />
        </button>
        <div className={styles.breadcrumb}>
          <span className={styles.breadcrumbItem} onClick={() => router.push("/ifood/catalogo")}>
            Cardápio
          </span>
          <span className={styles.breadcrumbSep}>›</span>
          <span className={styles.breadcrumbAtivo}>
            {isEdicao ? "Editar combo" : "Criar combo"}
          </span>
        </div>
        <div style={{ flex: 1 }} />
        <button className={styles.btnSalvarTop} disabled={salvando} onClick={onSalvar}>
          {salvando
            ? <><FiLoader size={14} className={styles.spinner} /> Salvando...</>
            : <><FiSave size={14} /> {isEdicao ? "Salvar alterações" : "Criar combo"}</>
          }
        </button>
      </div>

      {erros.length > 0 && (
        <div className={styles.errosBanner}>
          {erros.map((e, i) => (
            <div key={i} className={styles.erroItem}>
              <FiAlertCircle size={13} />
              <span>{e}</span>
            </div>
          ))}
        </div>
      )}

      <div className={styles.abasWrapper}>
        <nav className={styles.abas}>
          {ABAS.map(a => (
            <button key={a.key} type="button"
              className={`${styles.aba} ${abaAtiva === a.key ? styles.abaAtiva : ""}`}
              onClick={() => setAbaAtiva(a.key)}>
              {a.label}
            </button>
          ))}
        </nav>
      </div>

      <div className={styles.conteudo}>

        {/* ══ ABA: Produtos ══ */}
        {abaAtiva === "produtos" && (
          <div className={styles.abaContent}>
            <div className={styles.complementosHeader}>
              <div>
                <h3 className={styles.cardTitulo}>Grupos do combo</h3>
                <p className={styles.cardDesc}>
                  Cada grupo reúne produtos já cadastrados no catálogo. Marque um grupo como
                  principal — ele define o combo em si.
                </p>
              </div>
              <button className={styles.btnNovoGrupo} onClick={addGrupo}>
                <FiPlus size={14} /> Novo grupo
              </button>
            </div>

            {grupos.length === 0 ? (
              <div className={styles.complementosVazio}>
                <p>Nenhum grupo criado.</p>
                <p className={styles.complementosVazioSub}>
                  Crie um grupo e adicione produtos já cadastrados no catálogo.
                </p>
                <button className={styles.btnNovoGrupoCentro} onClick={addGrupo}>
                  <FiPlus size={14} /> Adicionar primeiro grupo
                </button>
              </div>
            ) : (
              <div className={styles.gruposList}>
                {grupos.map(g => (
                  <GrupoComboInline
                    key={g.id}
                    grupo={g}
                    onUpdate={patch => {
                      if (patch.principal) marcarPrincipal(g.id);
                      else updateGrupo(g.id, patch);
                    }}
                    onRemove={() => removeGrupo(g.id)}
                    onAbrirSeletor={() => setSeletorGrupoId(g.id)}
                    onRemoverProduto={optionId => removerProdutoDoGrupo(g.id, optionId)}
                  />
                ))}
                <button className={styles.btnAdicionarGrupo} onClick={addGrupo}>
                  <FiPlus size={13} /> Adicionar outro grupo
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══ ABA: Preço ══ */}
        {abaAtiva === "preco" && (
          <div className={styles.abaContent}>
            <div className={styles.card}>
              <h3 className={styles.cardTitulo}>Dados do combo</h3>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Nome *</label>
                <input className={styles.input} maxLength={100}
                  placeholder="Ex: Combo Hambúrguer + Refrigerante"
                  value={nome} onChange={e => setNome(e.target.value)} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Descrição</label>
                <textarea className={styles.textarea} maxLength={500} rows={3}
                  value={descricao} onChange={e => setDescricao(e.target.value)} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Categoria *</label>
                <select className={styles.select} value={categoriaId}
                  onChange={e => setCategoriaId(e.target.value)}>
                  <option value="">Selecione</option>
                  {categoriasDisponiveis.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <span className={styles.fieldHint}>Onde o combo vai aparecer no cardápio.</span>
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitulo}>Imagem</h3>
              <input ref={fileRef} type="file" accept="image/*"
                style={{ display: "none" }} onChange={handleImagem} />
              {imagemPreview ? (
                <div className={styles.imagemBox}>
                  <img src={imagemPreview} alt="Preview" className={styles.imagemPreview} />
                  <button className={styles.btnTrocarImagem} onClick={() => fileRef.current?.click()}>
                    Trocar imagem
                  </button>
                </div>
              ) : (
                <button className={styles.btnUploadImagem} onClick={() => fileRef.current?.click()}>
                  <FiUpload size={18} />
                  <span>Adicionar imagem</span>
                  <span className={styles.btnUploadDica}>PNG ou JPG, máx. 5MB</span>
                </button>
              )}
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitulo}>Como irá ofertar seu combo?</h3>
              <p className={styles.cardDesc}>Escolha a modalidade de oferta.</p>

              <div className={styles.dispOpcoes}>
                <label className={styles.dispOpcao}>
                  <input type="radio" name="modoPreco"
                    checked={modoPreco === "soma"}
                    onChange={() => setModoPreco("soma")} />
                  <div>
                    <p className={styles.dispOpcaoTitulo}>Preço nos produtos</p>
                    <p className={styles.dispOpcaoDesc}>
                      Cada produto tem seu preço e o valor do combo é a soma dos escolhidos.
                    </p>
                  </div>
                </label>
                <label className={styles.dispOpcao}>
                  <input type="radio" name="modoPreco"
                    checked={modoPreco === "fixo"}
                    onChange={() => setModoPreco("fixo")} />
                  <div>
                    <p className={styles.dispOpcaoTitulo}>Preço no combo</p>
                    <p className={styles.dispOpcaoDesc}>
                      Defina um preço fixo com desconto — aumenta as chances de aparecer em promoções.
                    </p>
                  </div>
                </label>
              </div>

              {modoPreco === "fixo" && (
                <div className={styles.precoFixoPainel}>
                  {sugestaoPreco > 0 && (
                    <div className={styles.sugestaoPreco}>
                      <span>
                        Sugestão: <strong>R$ {sugestaoPreco.toFixed(2).replace(".", ",")}</strong>{" "}
                        (soma dos produtos obrigatórios)
                      </span>
                      <button className={styles.btnUsarSugestao}
                        onClick={() => setPrecoTotal(String(sugestaoPreco))}>
                        Usar sugestão
                      </button>
                    </div>
                  )}
                  <div className={styles.fieldRow2}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Preço total (R$)</label>
                      <div className={styles.inputPrefix}>
                        <span className={styles.prefix}>R$</span>
                        <input type="number" step="0.01" min={0}
                          className={styles.inputPrefixed} placeholder="0,00"
                          value={precoTotal} onChange={e => setPrecoTotal(e.target.value)} />
                      </div>
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Desconto (%)</label>
                      <input type="number" min={0} max={99} className={styles.inputXsm}
                        value={desconto} onChange={e => setDesconto(e.target.value)} />
                    </div>
                  </div>
                  <div className={styles.precoFinalBox}>
                    <span className={styles.precoFinalLabel}>Preço final</span>
                    <div className={styles.precoFinalValores}>
                      {Number(desconto) > 0 && (
                        <span className={styles.precoFinalRiscado}>
                          R$ {(parseFloat(precoTotal) || 0).toFixed(2).replace(".", ",")}
                        </span>
                      )}
                      <span className={styles.precoFinalValor}>
                        R$ {precoFinal.toFixed(2).replace(".", ",")}
                      </span>
                      {Number(desconto) > 0 && (
                        <span className={styles.precoFinalBadge}>-{desconto}%</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ ABA: Disponibilidade ══ */}
        {abaAtiva === "disponibilidade" && (
          <div className={styles.abaContent}>
            <div className={styles.card}>
              <h3 className={styles.cardTitulo}>Quando este combo estará disponível?</h3>

              <div className={styles.dispOpcoes}>
                <label className={styles.dispOpcao}>
                  <input type="radio" name="disp"
                    checked={sempreDisponivel}
                    onChange={() => setSempreDisponivel(true)} />
                  <div>
                    <p className={styles.dispOpcaoTitulo}>Sempre disponível</p>
                    <p className={styles.dispOpcaoDesc}>Visível sempre que a loja estiver aberta.</p>
                  </div>
                </label>
                <label className={styles.dispOpcao}>
                  <input type="radio" name="disp"
                    checked={!sempreDisponivel}
                    onChange={() => setSempreDisponivel(false)} />
                  <div>
                    <p className={styles.dispOpcaoTitulo}>Períodos específicos</p>
                    <p className={styles.dispOpcaoDesc}>Configure dias e horários específicos.</p>
                  </div>
                </label>
              </div>

              {!sempreDisponivel && (
                <div className={styles.turnosWrapper}>
                  {turnos.map((turno, idx) => (
                    <div key={turno.id} className={styles.turnoCard}>
                      <div className={styles.turnoCardHeader}>
                        <span className={styles.turnoCardLabel}>{idx + 1}º período</span>
                        {turnos.length > 1 && (
                          <button className={styles.btnRemoverTurno} onClick={() => removerTurno(turno.id)}>
                            <FiTrash2 size={13} />
                          </button>
                        )}
                      </div>
                      <div className={styles.diasRow}>
                        {DIAS_SEMANA.map(d => (
                          <button key={d.key} type="button"
                            className={`${styles.diaBtn} ${turno.dias.includes(d.key) ? styles.diaBtnAtivo : ""}`}
                            onClick={() => toggleDiaTurno(turno.id, d.key)}>
                            {d.label}
                          </button>
                        ))}
                      </div>
                      <div className={styles.horarioRow}>
                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Das</label>
                          <input type="time" className={styles.timeInput}
                            value={turno.startTime}
                            onChange={e => atualizarTurno(turno.id, { startTime: e.target.value })} />
                        </div>
                        <span className={styles.horarioSep}>até</span>
                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Às</label>
                          <input type="time" className={styles.timeInput}
                            value={turno.endTime}
                            onChange={e => atualizarTurno(turno.id, { endTime: e.target.value })} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className={styles.btnAdicionarTurno} onClick={adicionarTurno}>
                    <FiPlus size={13} /> Adicionar período
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {seletorGrupoId && (
        <ModalSelecionarProdutos
          categorias={categorias}
          jaAdicionados={jaAdicionados}
          onFechar={() => setSeletorGrupoId(null)}
          onAgrupar={onAgruparProdutos}
        />
      )}
    </div>
  );
}
