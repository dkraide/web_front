// pages/ifood/catalogo/produto/index.tsx
// Redesenhado: abas no topo + complementos inline sem modal

import { useState, useRef, useContext, useEffect } from "react";
import { useRouter } from "next/router";
import {
  FiArrowLeft, FiUpload, FiPlus, FiTrash2,
  FiCheck, FiLoader, FiAlertCircle, FiChevronDown,
  FiChevronUp, FiSave,
} from "react-icons/fi";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { AuthContext } from "@/contexts/AuthContext";
import { ifoodCatalogService } from "@/services/ifoodCatalogService";
import { produtoService } from "@/services/produtoService";
import IProduto from "@/interfaces/IProduto";
import type {
  IFoodCategoriaDetalhe,
  IFoodSalvarItemDto,
  IFoodItemPayload,
  IFoodProdutoPayload,
  IFoodGrupoOpcaoPayload,
  IFoodOpcaoPayload,
  IFoodShift,
} from "@/interfaces/ifoodCatalog";
import { parseVinculo, externalCodeProduto } from "@/interfaces/ifoodCatalog";
import {
  withRetry, humanizarErro, validarProduto,
} from "@/utils/ifoodApiUtils";
import type { CatalogContext } from "@/utils/ifoodApiUtils";
import styles from "./styles.module.scss";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Aba = "informacoes" | "complementos" | "disponibilidade";

const ABAS: { key: Aba; label: string }[] = [
  { key: "informacoes",    label: "Informações"    },
  { key: "complementos",   label: "Complementos"   },
  { key: "disponibilidade",label: "Disponibilidade"},
];

interface ComplementoForm {
  id: string;
  nome: string;
  preco: number;
  // só para itens já existentes no iFood
  optionId?: string;
  productId?: string;
}

interface GrupoComplementoForm {
  id: string;
  nome: string;
  tipo: "ingrediente" | "especificacao" | "crosssell" | "descartavel";
  obrigatorio: boolean;
  min: number;
  max: number;
  complementos: ComplementoForm[];
  aberto: boolean; // accordion
}

interface ProdutoForm {
  nome: string;
  descricao: string;
  servingsUnit: string;
  categoriaId: string;
  preco: number;
  precoOriginal: number | "";
  produtoKrdId: number | "";
}

interface TurnoDisponibilidade {
  id: string;
  startTime: string;
  endTime: string;
  dias: string[];
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const RESTRICOES = [
  { key: "VEGAN",       label: "Vegano",      icon: "🌿" },
  { key: "VEGETARIAN",  label: "Vegetariano", icon: "🥗" },
  { key: "ORGANIC",     label: "Orgânico",    icon: "🌱" },
  { key: "SUGAR_FREE",  label: "Sem açúcar",  icon: "🚫" },
  { key: "LAC_FREE",    label: "Sem lactose", icon: "🥛" },
  { key: "GLUTEN_FREE", label: "Sem glúten",  icon: "🌾" },
  { key: "NATURAL",     label: "Natural",     icon: "🍃" },
  { key: "ZERO",        label: "Zero",        icon: "0️⃣" },
  { key: "DIET",        label: "Diet",        icon: "🥦" },
];

const BEBIDAS = [
  { key: "FROSTY",           label: "Bebida gelada",    icon: "🧊" },
  { key: "ALCOHOLIC_DRINK",  label: "Bebida alcoólica", icon: "🍺" },
];

const TIPOS_GRUPO: {
  key: GrupoComplementoForm["tipo"];
  label: string;
  desc: string;
}[] = [
  { key: "ingrediente",   label: "Ingredientes",  desc: "Remover/adicionar ingredientes" },
  { key: "especificacao", label: "Especificações", desc: "Perguntas sobre preparo"         },
  { key: "crosssell",     label: "Cross-sell",     desc: "Sugerir produtos adicionais"     },
  { key: "descartavel",   label: "Descartáveis",   desc: "Talheres, embalagens"            },
];

const TIPO_GRUPO_MAP: Record<string, GrupoComplementoForm["tipo"]> = {
  INGREDIENTS: "ingrediente", SPECIFICATION: "especificacao",
  DEFAULT: "crosssell", CUTLERY: "descartavel",
  SIZE: "especificacao", TOPPING: "especificacao",
  CRUST: "especificacao", EDGE: "especificacao",
};

const TIPO_GRUPO_IFOOD_MAP: Record<GrupoComplementoForm["tipo"], string> = {
  ingrediente: "INGREDIENTS", especificacao: "SPECIFICATION",
  crosssell: "DEFAULT", descartavel: "CUTLERY",
};

const DIAS_SEMANA = [
  { key: "monday",    label: "Seg" },
  { key: "tuesday",   label: "Ter" },
  { key: "wednesday", label: "Qua" },
  { key: "thursday",  label: "Qui" },
  { key: "friday",    label: "Sex" },
  { key: "saturday",  label: "Sáb" },
  { key: "sunday",    label: "Dom" },
];

// ─── Componente de linha de complemento ──────────────────────────────────────

function ComplementoRow({
  comp,
  onChange,
  onRemove,
}: {
  comp: ComplementoForm;
  onChange: (patch: Partial<ComplementoForm>) => void;
  onRemove: () => void;
}) {
  return (
    <div className={styles.compRow}>
      <input
        className={styles.compInputNome}
        placeholder="Nome do complemento"
        value={comp.nome}
        onChange={e => onChange({ nome: e.target.value })}
      />
      <div className={styles.compPrecoWrapper}>
        <span className={styles.compPrecoPrefix}>R$</span>
        <input
          type="number"
          min={0}
          step={0.01}
          className={styles.compInputPreco}
          placeholder="0,00"
          value={comp.preco === 0 ? "" : comp.preco}
          onChange={e => onChange({ preco: parseFloat(e.target.value) || 0 })}
        />
      </div>
      <button
        className={styles.compBtnRemover}
        onClick={onRemove}
        title="Remover complemento"
      >
        <FiTrash2 size={14} />
      </button>
    </div>
  );
}

// ─── Componente de grupo inline ───────────────────────────────────────────────

function GrupoInline({
  grupo,
  onUpdate,
  onRemove,
}: {
  grupo: GrupoComplementoForm;
  onUpdate: (patch: Partial<GrupoComplementoForm>) => void;
  onRemove: () => void;
}) {
  function addComp() {
    onUpdate({
      complementos: [
        ...grupo.complementos,
        { id: crypto.randomUUID(), nome: "", preco: 0 },
      ],
    });
  }

  function updateComp(id: string, patch: Partial<ComplementoForm>) {
    onUpdate({
      complementos: grupo.complementos.map(c =>
        c.id === id ? { ...c, ...patch } : c
      ),
    });
  }

  function removeComp(id: string) {
    onUpdate({
      complementos: grupo.complementos.filter(c => c.id !== id),
    });
  }

  return (
    <div className={styles.grupoInline}>
      {/* Header do grupo */}
      <div className={styles.grupoInlineHeader}>
        <button
          className={styles.grupoInlineToggle}
          onClick={() => onUpdate({ aberto: !grupo.aberto })}
        >
          <div className={styles.grupoInlineHeaderLeft}>
            <span className={styles.grupoInlineNomePreview}>
              {grupo.nome || <em className={styles.grupoSemNome}>Novo grupo</em>}
            </span>
            <span className={styles.grupoInlineMeta}>
              {TIPOS_GRUPO.find(t => t.key === grupo.tipo)?.label}
              {" · "}
              {grupo.complementos.length} complemento{grupo.complementos.length !== 1 ? "s" : ""}
            </span>
          </div>
          {grupo.aberto ? <FiChevronUp size={15} /> : <FiChevronDown size={15} />}
        </button>
        <button
          className={styles.grupoInlineBtnRemover}
          onClick={onRemove}
          title="Remover grupo"
        >
          <FiTrash2 size={14} />
        </button>
      </div>

      {/* Corpo expandido */}
      {grupo.aberto && (
        <div className={styles.grupoInlineBody}>

          {/* Nome e tipo */}
          <div className={styles.grupoInlineRow2}>
            <div className={styles.fieldGroup} style={{ flex: 2 }}>
              <label className={styles.label}>Nome do grupo</label>
              <input
                className={styles.input}
                placeholder="Ex: Turbine seu lanche"
                value={grupo.nome}
                onChange={e => onUpdate({ nome: e.target.value })}
              />
            </div>
            <div className={styles.fieldGroup} style={{ flex: 1 }}>
              <label className={styles.label}>Tipo</label>
              <select
                className={styles.select}
                value={grupo.tipo}
                onChange={e => onUpdate({ tipo: e.target.value as GrupoComplementoForm["tipo"] })}
              >
                {TIPOS_GRUPO.map(t => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Regras */}
          <div className={styles.grupoInlineRow3}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Obrigatório</label>
              <select
                className={styles.selectSm}
                value={grupo.obrigatorio ? "true" : "false"}
                onChange={e => onUpdate({ obrigatorio: e.target.value === "true" })}
              >
                <option value="false">Opcional</option>
                <option value="true">Obrigatório</option>
              </select>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Mín.</label>
              <input
                type="number" min={0} className={styles.inputXsm}
                value={grupo.min}
                onChange={e => onUpdate({ min: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Máx.</label>
              <input
                type="number" min={1} className={styles.inputXsm}
                value={grupo.max}
                onChange={e => onUpdate({ max: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          {/* Divisor */}
          <div className={styles.grupoDivider} />

          {/* Lista de complementos */}
          <div className={styles.compList}>
            {grupo.complementos.length === 0 && (
              <p className={styles.compVazio}>
                Nenhum complemento. Clique em "+ Adicionar" para começar.
              </p>
            )}
            {grupo.complementos.map(comp => (
              <ComplementoRow
                key={comp.id}
                comp={comp}
                onChange={patch => updateComp(comp.id, patch)}
                onRemove={() => removeComp(comp.id)}
              />
            ))}
          </div>

          <button className={styles.btnAdicionarComp} onClick={addComp}>
            <FiPlus size={13} /> Adicionar complemento
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function IFoodProdutoPage() {
  const router = useRouter();
  const { itemId, catalogId } = router.query as { itemId?: string; catalogId?: string };
  const isEdicao = !!itemId;
  const { getUser } = useContext(AuthContext);

  const [empresaId, setEmpresaId]     = useState(0);
  const [loading, setLoading]         = useState(isEdicao);
  const [abaAtiva, setAbaAtiva]       = useState<Aba>("informacoes");
  const [categorias, setCategorias]   = useState<IFoodCategoriaDetalhe[]>([]);
  const [produtos, setProdutos]       = useState<IProduto[]>([]);
  const [salvando, setSalvando]       = useState(false);
  const [erros, setErros]             = useState<string[]>([]);

  // Informações
  const [restricoes, setRestricoes]       = useState<string[]>([]);
  const [tags, setTags]                   = useState<string[]>([]);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [imagemBase64, setImagemBase64]   = useState<string | null>(null);

  // Complementos
  const [grupos, setGrupos] = useState<GrupoComplementoForm[]>([]);

  // Disponibilidade
  const [sempreDisponivel, setSempreDisponivel] = useState(true);
  const [turnos, setTurnos] = useState<TurnoDisponibilidade[]>([{
    id: crypto.randomUUID(),
    startTime: "08:00", endTime: "22:00",
    dias: ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"],
  }]);

  // IDs originais (edição)
  const [itemIdOriginal, setItemIdOriginal]     = useState<string | null>(null);
  const [productIdOriginal, setProductIdOriginal] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register, handleSubmit, watch, setValue, getValues,
    formState: { errors: formErrors },
  } = useForm<ProdutoForm>({
    defaultValues: {
      nome: "", descricao: "", servingsUnit: "NOT_APPLICABLE",
      categoriaId: "", preco: 0, precoOriginal: "", produtoKrdId: "",
    },
  });

  // ─── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function init() {
      const user = await getUser();
      if (!user) return;
      const eid = user.empresaSelecionada;
      setEmpresaId(eid);
      await Promise.all([carregarCategorias(eid), carregarProdutos(eid)]);
      if (isEdicao && itemId) await carregarItem(eid, itemId);
    }
    if (catalogId || !isEdicao) init();
  }, [catalogId, router.isReady]);

  async function carregarCategorias(eid: number) {
    try {
      if (!catalogId) return;
      const r = await ifoodCatalogService.listarCategorias(eid, catalogId);
      if (r.sucesso) setCategorias(r.dados);
    } catch {}
  }

  async function carregarProdutos(eid: number) {
    try {
      const r = await produtoService.getAll(eid, true);
      if (r) setProdutos(r);
    } catch {}
  }

  async function carregarItem(eid: number, id: string) {
    setLoading(true);
    try {
      const r = await ifoodCatalogService.obterItemFlat(eid, id);
      if (!r?.sucesso || !r.dados) return;
      const { item, products, optionGroups, options } = r.dados;

      setItemIdOriginal(item.id);
      setProductIdOriginal(item.productId);

      const produtoRaiz = products.find(p => p.id === item.productId);
      if (produtoRaiz) {
        setValue("nome",         produtoRaiz.name ?? "");
        setValue("descricao",    produtoRaiz.description ?? "");
        setValue("servingsUnit", produtoRaiz.serving ?? "NOT_APPLICABLE");
        if (produtoRaiz.imagePath) setImagemPreview(produtoRaiz.imagePath);
        setRestricoes(produtoRaiz.dietaryRestrictions ?? []);
        setTags(produtoRaiz.tags ?? []);
      }

      setValue("preco",         item.price?.value ?? 0);
      setValue("precoOriginal", item.price?.originalValue ?? "");
      setValue("categoriaId",   item.categoryId ?? "");

      const vinculo = parseVinculo(item.externalCode);
      if (vinculo?.tipo === "produto") setValue("produtoKrdId", vinculo.id);

      // Reconstrói grupos com accordion aberto para o primeiro
      const gruposHidratados: GrupoComplementoForm[] = optionGroups.map((og, idx) => ({
        id: og.id, nome: og.name,
        tipo: TIPO_GRUPO_MAP[og.optionGroupType ?? ""] ?? "especificacao",
        obrigatorio: (og.min ?? 0) > 0,
        min: og.min ?? 0, max: og.max ?? 1,
        aberto: idx === 0,
        complementos: og.optionIds.map(optId => {
          const opt  = options.find(o => o.id === optId);
          const prod = opt ? products.find(p => p.id === opt.productId) : null;
          return {
            id: optId, nome: prod?.name ?? "",
            preco: opt?.price?.value ?? 0,
            optionId: opt?.id, productId: opt?.productId,
          };
        }),
      }));
      setGrupos(gruposHidratados);

      // Shifts
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

  // ─── Helpers ─────────────────────────────────────────────────────────────

  function toggleRestricao(key: string) {
    setRestricoes(p => p.includes(key) ? p.filter(r => r !== key) : [...p, key]);
  }
  function toggleTag(key: string) {
    setTags(p => p.includes(key) ? p.filter(t => t !== key) : [...p, key]);
  }
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

  function updateGrupo(id: string, patch: Partial<GrupoComplementoForm>) {
    setGrupos(p => p.map(g => g.id === id ? { ...g, ...patch } : g));
  }
  function removeGrupo(id: string) {
    setGrupos(p => p.filter(g => g.id !== id));
  }
  function addGrupo() {
    setGrupos(p => [...p, {
      id: crypto.randomUUID(), nome: "", tipo: "especificacao",
      obrigatorio: false, min: 0, max: 1,
      complementos: [], aberto: true,
    }]);
  }

  // Turnos de disponibilidade
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
      return {
        ...t,
        dias: t.dias.includes(dia) ? t.dias.filter(d => d !== dia) : [...t.dias, dia],
      };
    }));
  }

  function montarShifts(): IFoodShift[] | null {
    if (sempreDisponivel) return null;
    return turnos
      .filter(t => t.startTime && t.endTime && t.dias.length > 0)
      .map(t => ({
        startTime: t.startTime, endTime: t.endTime,
        monday:    t.dias.includes("monday"),
        tuesday:   t.dias.includes("tuesday"),
        wednesday: t.dias.includes("wednesday"),
        thursday:  t.dias.includes("thursday"),
        friday:    t.dias.includes("friday"),
        saturday:  t.dias.includes("saturday"),
        sunday:    t.dias.includes("sunday"),
      }));
  }

  // ─── Monta payload ────────────────────────────────────────────────────────

  async function montarPayload(form: ProdutoForm): Promise<IFoodSalvarItemDto | null> {
    const validacao = validarProduto({
      nome: form.nome, descricao: form.descricao,
      preco: form.preco, categoriaId: form.categoriaId,
    });
    if (!validacao.valido) { setErros(validacao.erros); return null; }

    let imagePath: string | null = null;
    if (imagemBase64) {
      const up = await withRetry(() => ifoodCatalogService.uploadImagem(empresaId, imagemBase64));
      if (!up.sucesso) { setErros([humanizarErro(up.erro)]); return null; }
      imagePath = up.dados.imagePath;
    } else if (imagemPreview && !imagemPreview.startsWith("data:")) {
      imagePath = imagemPreview;
    }

    const itemId    = itemIdOriginal    ?? crypto.randomUUID();
    const productId = productIdOriginal ?? crypto.randomUUID();

    const products:     IFoodProdutoPayload[]    = [];
    const optionGroups: IFoodGrupoOpcaoPayload[] = [];
    const options:      IFoodOpcaoPayload[]      = [];

    products.push({
      id: productId, name: form.nome,
      description: form.descricao || null,
      additionalInformation: null,
      externalCode: form.produtoKrdId ? externalCodeProduto(Number(form.produtoKrdId)) : null,
      imagePath, ean: null,
      serving: form.servingsUnit === "NOT_APPLICABLE" ? null : form.servingsUnit,
      dietaryRestrictions: restricoes.length > 0 ? restricoes : null,
      tags: tags.length > 0 ? tags : null,
      quantity: null,
      optionGroups: grupos.length > 0
        ? grupos.map(g => ({ id: g.id, min: g.min, max: g.max }))
        : null,
    });

    for (const grupo of grupos) {
      const optionIds: string[] = [];
      for (const comp of grupo.complementos) {
        if (!comp.nome.trim()) continue; // ignora linhas vazias
        const compProductId = comp.productId ?? crypto.randomUUID();
        const optionId      = comp.optionId  ?? comp.id;
        optionIds.push(optionId);
        options.push({
          id: optionId, status: "AVAILABLE",
          index: grupo.complementos.indexOf(comp),
          productId: compProductId,
          price: { value: comp.preco, originalValue: null },
          fractions: null, externalCode: null, contextModifiers: null,
        });
        products.push({
          id: compProductId, name: comp.nome,
          description: null, additionalInformation: null,
          externalCode: null, imagePath: null, ean: null,
          serving: null, dietaryRestrictions: null,
          tags: null, quantity: null, optionGroups: null,
        });
      }
      optionGroups.push({
        id: grupo.id, name: grupo.nome, status: "AVAILABLE",
        externalCode: null,
        optionGroupType: TIPO_GRUPO_IFOOD_MAP[grupo.tipo],
        optionIds, index: grupos.indexOf(grupo),
        min: grupo.min, max: grupo.max,
      });
    }

    const item: IFoodItemPayload = {
      id: itemId, type: "DEFAULT",
      categoryId: form.categoriaId, status: "AVAILABLE",
      price: {
        value: Number(form.preco),
        originalValue: form.precoOriginal ? Number(form.precoOriginal) : null,
      },
      externalCode: form.produtoKrdId ? externalCodeProduto(Number(form.produtoKrdId)) : null,
      index: 0, productId, tags: null,
      shifts: montarShifts(), contextModifiers: null,
    };

    return { item, products, optionGroups, options };
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  async function onSalvar(form: ProdutoForm) {
    setSalvando(true); setErros([]);
    try {
      const payload = await montarPayload(form);
      if (!payload) return;

      const result = await withRetry(() =>
        ifoodCatalogService.salvarItem(empresaId, payload)
      );

      if (result.sucesso) {
        toast.success(isEdicao ? "Produto atualizado!" : "Produto criado!");
        router.push(`/ifood/catalogo${catalogId ? `?catalogId=${catalogId}` : ""}`);
      } else {
        setErros([humanizarErro(result.erro)]);
        // Rola para o topo para mostrar erros
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
        <p>Carregando produto...</p>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>

      {/* ── Top bar ── */}
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <FiArrowLeft size={16} />
        </button>
        <div className={styles.breadcrumb}>
          <span className={styles.breadcrumbItem}
            onClick={() => router.push("/ifood/catalogo")}>
            Cardápio
          </span>
          <span className={styles.breadcrumbSep}>›</span>
          <span className={styles.breadcrumbAtivo}>
            {isEdicao ? "Editar produto" : "Criar produto"}
          </span>
        </div>
        <div style={{ flex: 1 }} />
        {/* Botão salvar fixo no topbar */}
        <button
          className={styles.btnSalvarTop}
          disabled={salvando}
          onClick={handleSubmit(onSalvar)}
        >
          {salvando
            ? <><FiLoader size={14} className={styles.spinner} /> Salvando...</>
            : <><FiSave size={14} /> {isEdicao ? "Salvar alterações" : "Criar produto"}</>
          }
        </button>
      </div>

      {/* ── Erros globais ── */}
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

      {/* ── Abas ── */}
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

        {/* ══ ABA: Informações ══ */}
        {abaAtiva === "informacoes" && (
          <div className={styles.abaContent}>

            <div className={styles.infoGrid}>

              {/* Coluna esquerda — campos principais */}
              <div className={styles.infoEsquerda}>
                <div className={styles.card}>
                  <h3 className={styles.cardTitulo}>Dados do produto</h3>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Nome *</label>
                    <input className={styles.input} maxLength={100}
                      placeholder="Ex: Hambúrguer Artesanal"
                      {...register("nome", {
                        required: "Campo obrigatório",
                        maxLength: { value: 100, message: "Máximo 100 caracteres" },
                      })} />
                    <div className={styles.fieldBottom}>
                      {formErrors.nome
                        ? <span className={styles.erro}>{formErrors.nome.message}</span>
                        : <span />
                      }
                      <span className={styles.charCount}>{watch("nome")?.length ?? 0}/100</span>
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Descrição</label>
                    <textarea className={styles.textarea} maxLength={500} rows={3}
                      placeholder="Ex: Pão brioche, blend 180g, queijo cheddar, alface..."
                      {...register("descricao", {
                        maxLength: { value: 500, message: "Máximo 500 caracteres" },
                      })} />
                    <div className={styles.fieldBottom}>
                      {formErrors.descricao
                        ? <span className={styles.erro}>{formErrors.descricao.message}</span>
                        : <span />
                      }
                      <span className={styles.charCount}>{watch("descricao")?.length ?? 0}/500</span>
                    </div>
                  </div>

                  <div className={styles.fieldRow2}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Categoria *</label>
                      <select className={styles.select}
                        {...register("categoriaId", { required: "Selecione uma categoria" })}>
                        <option value="">Selecione</option>
                        {categorias.filter(c => c.template !== "PIZZA").map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      {formErrors.categoriaId && (
                        <span className={styles.erro}>{formErrors.categoriaId.message}</span>
                      )}
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Serve até</label>
                      <select className={styles.select} {...register("servingsUnit")}>
                        <option value="NOT_APPLICABLE">Não informar</option>
                        <option value="SERVES_1">1 pessoa</option>
                        <option value="SERVES_2">2 pessoas</option>
                        <option value="SERVES_3">3 pessoas</option>
                        <option value="SERVES_4">4 pessoas</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className={styles.card}>
                  <h3 className={styles.cardTitulo}>Preço</h3>
                  <div className={styles.fieldRow2}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Preço atual *</label>
                      <div className={styles.inputPrefix}>
                        <span className={styles.prefix}>R$</span>
                        <input type="number" step="0.01" min={0.01}
                          className={styles.inputPrefixed} placeholder="0,00"
                          {...register("preco", {
                            required: "Obrigatório",
                            validate: v => Number(v) > 0 || "Deve ser maior que zero",
                          })} />
                      </div>
                      {formErrors.preco && (
                        <span className={styles.erro}>{formErrors.preco.message}</span>
                      )}
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>
                        Preço "de" <span className={styles.labelOpt}>(opcional)</span>
                      </label>
                      <div className={styles.inputPrefix}>
                        <span className={styles.prefix}>R$</span>
                        <input type="number" step="0.01" min={0}
                          className={styles.inputPrefixed} placeholder="0,00"
                          {...register("precoOriginal")} />
                      </div>
                      <span className={styles.fieldHint}>Aparece riscado no app</span>
                    </div>
                  </div>
                </div>

                <div className={styles.card}>
                  <h3 className={styles.cardTitulo}>
                    Vínculo PDV <span className={styles.cardTituloOpt}>(opcional)</span>
                  </h3>
                  <div className={styles.fieldGroup}>
                    <select className={styles.select} {...register("produtoKrdId")}>
                      <option value="">Nenhum — vincular depois</option>
                      {produtos.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nome}{p.cod ? ` — Cód. ${p.cod}` : ""}
                        </option>
                      ))}
                    </select>
                    <span className={styles.fieldHint}>
                      Vincula ao produto do PDV para controle de estoque automático
                    </span>
                  </div>
                </div>
              </div>

              {/* Coluna direita — imagem + classificações */}
              <div className={styles.infoDireita}>
                <div className={styles.card}>
                  <h3 className={styles.cardTitulo}>Imagem</h3>
                  <input ref={fileRef} type="file" accept="image/*"
                    style={{ display: "none" }} onChange={handleImagem} />
                  {imagemPreview ? (
                    <div className={styles.imagemBox}>
                      <img src={imagemPreview} alt="Preview" className={styles.imagemPreview} />
                      <button className={styles.btnTrocarImagem}
                        onClick={() => fileRef.current?.click()}>
                        Trocar imagem
                      </button>
                    </div>
                  ) : (
                    <button className={styles.btnUploadImagem}
                      onClick={() => fileRef.current?.click()}>
                      <FiUpload size={18} />
                      <span>Adicionar imagem</span>
                      <span className={styles.btnUploadDica}>PNG ou JPG, máx. 5MB</span>
                    </button>
                  )}
                </div>

                <div className={styles.card}>
                  <h3 className={styles.cardTitulo}>Classificações</h3>
                  <p className={styles.cardDesc}>
                    Ajuda o algoritmo do iFood a exibir seu produto para o público certo.
                  </p>

                  <div className={styles.classificacaoSection}>
                    <span className={styles.classificacaoLabel}>Restrições alimentares</span>
                    <div className={styles.tagsRow}>
                      {RESTRICOES.map(r => (
                        <button key={r.key} type="button"
                          className={`${styles.tagChip} ${restricoes.includes(r.key) ? styles.tagChipAtivo : ""}`}
                          onClick={() => toggleRestricao(r.key)}>
                          {r.icon} {r.label}
                          {restricoes.includes(r.key) && <FiCheck size={11} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.classificacaoSection}>
                    <span className={styles.classificacaoLabel}>Bebidas</span>
                    <div className={styles.tagsRow}>
                      {BEBIDAS.map(b => (
                        <button key={b.key} type="button"
                          className={`${styles.tagChip} ${tags.includes(b.key) ? styles.tagChipAtivo : ""}`}
                          onClick={() => toggleTag(b.key)}>
                          {b.icon} {b.label}
                          {tags.includes(b.key) && <FiCheck size={11} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ ABA: Complementos ══ */}
        {abaAtiva === "complementos" && (
          <div className={styles.abaContent}>
            <div className={styles.complementosHeader}>
              <div>
                <h3 className={styles.cardTitulo}>Grupos de complementos</h3>
                <p className={styles.cardDesc}>
                  Cada grupo pode ter múltiplos complementos com preços individuais.
                  Itens com nome em branco são ignorados ao salvar.
                </p>
              </div>
              <button className={styles.btnNovoGrupo} onClick={addGrupo}>
                <FiPlus size={14} /> Novo grupo
              </button>
            </div>

            {grupos.length === 0 ? (
              <div className={styles.complementosVazio}>
                <p>Nenhum grupo de complementos.</p>
                <p className={styles.complementosVazioSub}>
                  Clique em "Novo grupo" para adicionar opções como molhos, tamanhos ou extras.
                </p>
                <button className={styles.btnNovoGrupoCentro} onClick={addGrupo}>
                  <FiPlus size={14} /> Adicionar primeiro grupo
                </button>
              </div>
            ) : (
              <div className={styles.gruposList}>
                {grupos.map(g => (
                  <GrupoInline
                    key={g.id}
                    grupo={g}
                    onUpdate={patch => updateGrupo(g.id, patch)}
                    onRemove={() => removeGrupo(g.id)}
                  />
                ))}
                <button className={styles.btnAdicionarGrupo} onClick={addGrupo}>
                  <FiPlus size={13} /> Adicionar outro grupo
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══ ABA: Disponibilidade ══ */}
        {abaAtiva === "disponibilidade" && (
          <div className={styles.abaContent}>
            <div className={styles.card}>
              <h3 className={styles.cardTitulo}>Quando este produto estará disponível?</h3>

              <div className={styles.dispOpcoes}>
                <label className={styles.dispOpcao}>
                  <input type="radio" name="disp"
                    checked={sempreDisponivel}
                    onChange={() => setSempreDisponivel(true)} />
                  <div>
                    <p className={styles.dispOpcaoTitulo}>Sempre disponível</p>
                    <p className={styles.dispOpcaoDesc}>
                      Visível sempre que o restaurante estiver aberto.
                    </p>
                  </div>
                </label>
                <label className={styles.dispOpcao}>
                  <input type="radio" name="disp"
                    checked={!sempreDisponivel}
                    onChange={() => setSempreDisponivel(false)} />
                  <div>
                    <p className={styles.dispOpcaoTitulo}>Períodos específicos</p>
                    <p className={styles.dispOpcaoDesc}>
                      Configure dias e horários em que o produto aparece.
                    </p>
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
                          <button className={styles.btnRemoverTurno}
                            onClick={() => removerTurno(turno.id)}>
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
    </div>
  );
}
