import { useState, useRef, useContext, useEffect } from "react";
import { useRouter } from "next/router";
import { FiArrowLeft, FiUpload, FiPlus, FiTrash2 } from "react-icons/fi";
import { AuthContext } from "@/contexts/AuthContext";
import { ifoodCatalogService } from "@/services/ifoodCatalogService";
import type {
  IFoodSalvarItemDto,
  IFoodProdutoPayload,
  IFoodGrupoOpcaoPayload,
  IFoodOpcaoPayload,
  IFoodItemPayload,
} from "@/interfaces/ifoodCatalog";
import { TabelaOpcoesPizza, OpcaoPizzaForm } from "@/components/ifood/TabelaOpcoesPizza";
import styles from "./styles.module.scss";
import { toast } from "react-toastify";

// ─── Tipos locais ─────────────────────────────────────────────────────────────

type Step = "detalhes" | "tamanho" | "massa" | "borda" | "disponibilidade";

const STEPS: { key: Step; label: string }[] = [
  { key: "detalhes",        label: "Detalhes" },
  { key: "tamanho",         label: "Tamanho" },
  { key: "massa",           label: "Massa" },
  { key: "borda",           label: "Borda" },
  { key: "disponibilidade", label: "Disponibilidade" },
];

export interface TamanhoForm {
  id:            string;
  nome:          string;
  qtdPedacos:    number;
  fracoes:       number[];
  imagemBase64:  string | null;
  imagemPreview: string | null;
  imagemPath:    string | null; // imagePath já existente (edição)
  externalCode:  string;
  optionId?:     string;
  productId?:    string;
}

type DiaSemana = "D" | "S" | "T" | "Q" | "Q2" | "S2" | "S3";

const DIAS: { key: DiaSemana; label: string; apiKey: string }[] = [
  { key: "D",  label: "D", apiKey: "sunday" },
  { key: "S",  label: "S", apiKey: "monday" },
  { key: "T",  label: "T", apiKey: "tuesday" },
  { key: "Q",  label: "Q", apiKey: "wednesday" },
  { key: "Q2", label: "Q", apiKey: "thursday" },
  { key: "S2", label: "S", apiKey: "friday" },
  { key: "S3", label: "S", apiKey: "saturday" },
];

interface Turno {
  inicio: string;
  fim:    string;
}

// ─── Hidratação ───────────────────────────────────────────────────────────────

function hidratarDados(res: IFoodSalvarItemDto) {
  const optionMap  = new Map(res.options.map(o => [o.id, o]));
  const productMap = new Map(res.products.map(p => [p.id, p]));

  const grupoSize  = res.optionGroups.find(g => g.optionGroupType === "SIZE");
  const grupoCrust = res.optionGroups.find(g => g.optionGroupType === "CRUST");
  const grupoEdge  = res.optionGroups.find(g => g.optionGroupType === "EDGE");
  const grupoTop   = res.optionGroups.find(g => g.optionGroupType === "TOPPING");

  const tamanhos: TamanhoForm[] = (grupoSize?.optionIds ?? []).map(optId => {
    const opt  = optionMap.get(optId)!;
    const prod = productMap.get(opt.productId)!;
    return {
      id:            crypto.randomUUID(),
      nome:          prod.name,
      qtdPedacos:    prod.quantity ?? 0,
      fracoes:       opt.fractions ?? [1],
      imagemBase64:  null,
      imagemPreview: prod.imagePath
        ? `https://static-images.ifood.com.br/${prod.imagePath}`
        : null,
      imagemPath:    prod.imagePath ?? null,
      externalCode:  opt.externalCode ?? "",
      optionId:      opt.id,
      productId:     opt.productId,
    };
  });

  const massas: OpcaoPizzaForm[] = (grupoCrust?.optionIds ?? []).map(optId => {
    const opt  = optionMap.get(optId)!;
    const prod = productMap.get(opt.productId)!;
    return {
      id:           crypto.randomUUID(),
      nome:         prod.name,
      preco:        opt.price?.value ?? 0,
      ativo:        opt.status === "AVAILABLE",
      externalCode: opt.externalCode ?? "",
      optionId:     opt.id,
      productId:    opt.productId,
    };
  });

  const bordas: OpcaoPizzaForm[] = (grupoEdge?.optionIds ?? []).map(optId => {
    const opt  = optionMap.get(optId)!;
    const prod = productMap.get(opt.productId)!;
    return {
      id:           crypto.randomUUID(),
      nome:         prod.name,
      preco:        opt.price?.value ?? 0,
      ativo:        opt.status === "AVAILABLE",
      externalCode: opt.externalCode ?? "",
      optionId:     opt.id,
      productId:    opt.productId,
    };
  });

  return {
    tamanhos,
    massas,
    bordas,
    grupoTamanhoId: grupoSize?.id  ?? null,
    grupoSaborId:   grupoTop?.id   ?? null,
    grupoMassaId:   grupoCrust?.id ?? null,
    grupoBordaId:   grupoEdge?.id  ?? null,
  };
}

// ─── TamanhoRow ───────────────────────────────────────────────────────────────

function TamanhoRow({
  tamanho, onChange, onRemove,
}: {
  tamanho:  TamanhoForm;
  onChange: (patch: Partial<TamanhoForm>) => void;
  onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleImagem(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      onChange({
        imagemPreview: res,
        imagemBase64:  res.split(",")[1],
        imagemPath:    null, // nova imagem → descarta o path antigo
      });
    };
    reader.readAsDataURL(file);
  }

  function toggleFracao(n: number) {
    if (tamanho.fracoes.includes(n) && tamanho.fracoes[tamanho.fracoes.length - 1] === n) {
      onChange({ fracoes: tamanho.fracoes.filter(f => f < n) });
    } else {
      onChange({ fracoes: Array.from({ length: n }, (_, i) => i + 1) });
    }
  }

  return (
    <div className={styles.tamanhoRow}>
      <div className={styles.tamanhoImgBox}
        onClick={() => fileRef.current?.click()} title="Clique para adicionar imagem">
        {tamanho.imagemPreview ? (
          <img src={tamanho.imagemPreview} alt="preview" className={styles.tamanhoImg} />
        ) : (
          <span className={styles.tamanhoImgIcon}><FiUpload size={16} /></span>
        )}
        <input ref={fileRef} type="file" accept="image/*"
          style={{ display: "none" }} onChange={handleImagem} />
      </div>

      <div className={styles.tamanhoField}>
        <label className={styles.tamanhoLabel}>Nome do tamanho</label>
        <input className={styles.tamanhoInput} placeholder="Ex: Grande"
          value={tamanho.nome} onChange={e => onChange({ nome: e.target.value })} />
      </div>

      <div className={styles.tamanhoFieldSm}>
        <label className={styles.tamanhoLabel}>Qtd. Pedaços</label>
        <input type="number" min={1} className={styles.tamanhoInput}
          value={tamanho.qtdPedacos || ""}
          placeholder="8"
          onChange={e => onChange({ qtdPedacos: parseInt(e.target.value) || 0 })} />
      </div>

      <div className={styles.tamanhoFieldFracoes}>
        <label className={styles.tamanhoLabel}>Qtd. Sabores</label>
        <div className={styles.fracoesRow}>
          {[1, 2, 3, 4].map(n => (
            <button key={n} type="button"
              className={`${styles.fracaoBtn} ${tamanho.fracoes.includes(n) ? styles.fracaoBtnAtivo : ""}`}
              onClick={() => toggleFracao(n)}>
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tamanhoFieldSm}>
        <label className={styles.tamanhoLabel}>Cód. PDV</label>
        <input className={styles.tamanhoInput} placeholder="000"
          value={tamanho.externalCode}
          onChange={e => onChange({ externalCode: e.target.value })} />
      </div>

      <button className={styles.btnRemoverTamanho} type="button" onClick={onRemove}>
        <FiTrash2 size={14} />
      </button>
    </div>
  );
}

// ─── TamanhoCard ──────────────────────────────────────────────────────────────

function TamanhoCard({ tamanho }: { tamanho: TamanhoForm }) {
  const maxFracoes = tamanho.fracoes.length;
  const saboresLabel = maxFracoes === 1
    ? "Aceita 1 sabor"
    : `Aceita até ${maxFracoes} sabores`;

  return (
    <div className={styles.tamanhoCard}>
      <span className={styles.tamanhoCardIcon}>🍕</span>
      <p className={styles.tamanhoCardNome}>{tamanho.nome || "Sem nome"}</p>
      {tamanho.qtdPedacos > 0 && (
        <p className={styles.tamanhoCardInfo}>Cortada em {tamanho.qtdPedacos} pedaços</p>
      )}
      <p className={styles.tamanhoCardInfo}>{saboresLabel}</p>
      <p className={styles.tamanhoCardStatus}>Ativado</p>
      <label className={styles.toggle}>
        <input type="checkbox" defaultChecked readOnly />
        <span className={styles.toggleSlider} />
      </label>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function IFoodPizzaPage() {
  const router = useRouter();
  const { catalogId, categoryId } = router.query as {
    catalogId?: string;
    categoryId?: string;
  };
  const { getUser } = useContext(AuthContext);
  const isEdicao = !!categoryId;

  const [empresaId, setEmpresaId]   = useState(0);
  const [stepAtivo, setStepAtivo]   = useState<Step>("detalhes");
  const [salvando, setSalvando]     = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro]             = useState<string | null>(null);

  const [nomeCategoria, setNomeCategoria] = useState("");

  const [tamanhos, setTamanhos] = useState<TamanhoForm[]>([
    { id: crypto.randomUUID(), nome: "Pequena", qtdPedacos: 4,  fracoes: [1],       imagemBase64: null, imagemPreview: null, imagemPath: null, externalCode: "" },
    { id: crypto.randomUUID(), nome: "Média",   qtdPedacos: 6,  fracoes: [1, 2],    imagemBase64: null, imagemPreview: null, imagemPath: null, externalCode: "" },
    { id: crypto.randomUUID(), nome: "Grande",  qtdPedacos: 8,  fracoes: [1, 2, 3], imagemBase64: null, imagemPreview: null, imagemPath: null, externalCode: "" },
  ]);

  const [massas, setMassas] = useState<OpcaoPizzaForm[]>([
    { id: crypto.randomUUID(), nome: "Tradicional", preco: 0, ativo: true, externalCode: "" },
  ]);
  const [bordas, setBordas] = useState<OpcaoPizzaForm[]>([
    { id: crypto.randomUUID(), nome: "Tradicional", preco: 0, ativo: true, externalCode: "" },
  ]);

  // IDs preservados na edição
  const [itemIdExistente,    setItemIdExistente]    = useState<string | null>(null);
  const [rootProductId,      setRootProductId]      = useState<string | null>(null);
  const [grupoTamanhoId,     setGrupoTamanhoId]     = useState<string | null>(null);
  const [grupoSaborId,       setGrupoSaborId]       = useState<string | null>(null);
  const [grupoMassaId,       setGrupoMassaId]       = useState<string | null>(null);
  const [grupoBordaId,       setGrupoBordaId]       = useState<string | null>(null);
  const [saborOptionIds,     setSaborOptionIds]     = useState<string[]>([]);

  const [sempreDisponivel, setSempreDisponivel] = useState(true);
  const [diasAtivos, setDiasAtivos]             = useState<string[]>([]);
  const [turnos, setTurnos]                     = useState<Turno[]>([{ inicio: "", fim: "" }]);

  // ─── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function init() {
      const user = await getUser();
      if (!user) return;
      const empId = user.empresaSelecionada;
      setEmpresaId(empId);

      if (!isEdicao || !categoryId || !catalogId) return;
      setCarregando(true);
      try {
        const categoriasRes = await ifoodCatalogService.listarCategorias(empId, catalogId, true);
        if (!categoriasRes.sucesso) { setErro("Erro ao carregar categoria."); return; }

        const categoria = categoriasRes.dados.find(c => c.id === categoryId);
        const itemResumo = categoria?.items?.[0];
        if (!itemResumo) { setErro("Categoria não encontrada."); return; }

        setNomeCategoria(categoria!.name);

        const itemRes = await ifoodCatalogService.obterItemFlat(empId, itemResumo.id);
        if (!itemRes.sucesso) { setErro("Erro ao carregar dados da pizza."); return; }

        const dados = itemRes.dados;
        setItemIdExistente(dados.item.id);
        setRootProductId(dados.item.productId);

        // Preserva os optionIds dos sabores existentes
        const grupoTop = dados.optionGroups.find(g => g.optionGroupType === "TOPPING");
        setSaborOptionIds(grupoTop?.optionIds ?? []);

        const hidratado = hidratarDados(dados);
        setTamanhos(hidratado.tamanhos);
        setMassas(hidratado.massas);
        setBordas(hidratado.bordas);
        setGrupoTamanhoId(hidratado.grupoTamanhoId);
        setGrupoSaborId(hidratado.grupoSaborId);
        setGrupoMassaId(hidratado.grupoMassaId);
        setGrupoBordaId(hidratado.grupoBordaId);

        // Disponibilidade
        const shifts = dados.item.shifts;
        if (shifts && shifts.length > 0) {
          const primeiroTurno = shifts[0] as any;
          const diasMarcados = DIAS
            .filter(d => primeiroTurno[d.apiKey] === true)
            .map(d => d.apiKey);
          const todosMarcados = DIAS.every(d => diasMarcados.includes(d.apiKey));
          if (!todosMarcados) {
            setSempreDisponivel(false);
            setDiasAtivos(diasMarcados);
            setTurnos(shifts.map((s: any) => ({ inicio: s.startTime, fim: s.endTime })));
          }
        }
      } finally {
        setCarregando(false);
      }
    }
    if (router.isReady) init();
  }, [router.isReady]);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function addTamanho() {
    setTamanhos(p => [...p, {
      id: crypto.randomUUID(), nome: "", qtdPedacos: 0, fracoes: [1],
      imagemBase64: null, imagemPreview: null, imagemPath: null, externalCode: "",
    }]);
  }
  function updateTamanho(id: string, patch: Partial<TamanhoForm>) {
    setTamanhos(p => p.map(t => t.id === id ? { ...t, ...patch } : t));
  }
  function removeTamanho(id: string) {
    setTamanhos(p => p.filter(t => t.id !== id));
  }

  function toggleDia(apiKey: string) {
    setDiasAtivos(p => p.includes(apiKey) ? p.filter(d => d !== apiKey) : [...p, apiKey]);
  }
  function addTurno() {
    setTurnos(p => [...p, { inicio: "", fim: "" }]);
  }
  function updateTurno(i: number, patch: Partial<Turno>) {
    setTurnos(p => p.map((t, idx) => idx === i ? { ...t, ...patch } : t));
  }

  function stepValido(s: Step): boolean {
    switch (s) {
      case "detalhes": return nomeCategoria.trim().length > 0;
      case "tamanho":  return tamanhos.length > 0 && tamanhos.every(t => t.nome.trim().length > 0);
      case "massa":    return massas.length > 0 && massas.every(m => m.nome.trim().length > 0);
      case "borda":    return bordas.length > 0 && bordas.every(b => b.nome.trim().length > 0);
      default:         return true;
    }
  }

  const stepIdx  = STEPS.findIndex(s => s.key === stepAtivo);
  const isUltimo = stepIdx === STEPS.length - 1;

  function proximoStep()  { if (stepIdx < STEPS.length - 1) setStepAtivo(STEPS[stepIdx + 1].key); }
  function anteriorStep() { if (stepIdx > 0) setStepAtivo(STEPS[stepIdx - 1].key); }

  // ─── Monta shifts ──────────────────────────────────────────────────────────

  function montarShifts() {
    if (sempreDisponivel) {
      return [{
        startTime: "00:00", endTime: "23:59",
        monday: true, tuesday: true, wednesday: true, thursday: true,
        friday: true, saturday: true, sunday: true,
      }];
    }
    return turnos
      .filter(t => t.inicio && t.fim)
      .map(t => ({
        startTime:  t.inicio,
        endTime:    t.fim,
        monday:     diasAtivos.includes("monday"),
        tuesday:    diasAtivos.includes("tuesday"),
        wednesday:  diasAtivos.includes("wednesday"),
        thursday:   diasAtivos.includes("thursday"),
        friday:     diasAtivos.includes("friday"),
        saturday:   diasAtivos.includes("saturday"),
        sunday:     diasAtivos.includes("sunday"),
      }));
  }

  // ─── Salvar ────────────────────────────────────────────────────────────────

  async function salvar() {
    if (!catalogId) { setErro("catalogId ausente na URL."); return; }
    setSalvando(true);
    setErro(null);

    try {
      // ── Upload de imagens dos tamanhos ──────────────────────────────────
      const tamanhoImagePaths: (string | null)[] = [];
      for (const t of tamanhos) {
        if (t.imagemBase64) {
          const up = await ifoodCatalogService.uploadImagem(empresaId, t.imagemBase64);
          if (!up.sucesso) {
            setErro(`Falha ao fazer upload da imagem do tamanho "${t.nome}": ${up.erro}`);
            return;
          }
          tamanhoImagePaths.push(up.dados.imagePath);
        } else {
          // Mantém imagePath existente ou null
          tamanhoImagePaths.push(t.imagemPath ?? null);
        }
      }

      // ── IDs — reutiliza na edição, gera novos na criação ────────────────
      const itemId      = itemIdExistente    ?? crypto.randomUUID();
      const productId   = rootProductId      ?? crypto.randomUUID();
      const gTamanhoId  = grupoTamanhoId     ?? crypto.randomUUID();
      const gSaborId    = grupoSaborId       ?? crypto.randomUUID();
      const gMassaId    = grupoMassaId       ?? crypto.randomUUID();
      const gBordaId    = grupoBordaId       ?? crypto.randomUUID();

      const products:     IFoodProdutoPayload[]    = [];
      const optionGroups: IFoodGrupoOpcaoPayload[] = [];
      const options:      IFoodOpcaoPayload[]      = [];

      // ── Tamanhos ────────────────────────────────────────────────────────
      const tamanhoOptionIds: string[] = [];
      for (let i = 0; i < tamanhos.length; i++) {
        const t         = tamanhos[i];
        const optId     = t.optionId  ?? crypto.randomUUID();
        const prodId    = t.productId ?? crypto.randomUUID();
        const imagePath = tamanhoImagePaths[i];
        tamanhoOptionIds.push(optId);

        products.push({
          id: prodId, name: t.nome, description: null,
          additionalInformation: null,
          externalCode: t.externalCode || null,
          imagePath, ean: null, serving: null,
          dietaryRestrictions: null, tags: null,
          quantity: t.qtdPedacos || null,
          optionGroups: null,
        });

        options.push({
          id: optId, status: "AVAILABLE", index: i,
          productId: prodId, price: null,
          fractions: t.fracoes,
          externalCode: t.externalCode || null,
          contextModifiers: null,
        });
      }

      optionGroups.push({
        id: gTamanhoId, name: "Tamanhos", status: "AVAILABLE",
        externalCode: null, optionGroupType: "SIZE",
        optionIds: tamanhoOptionIds, index: 0, min: 1, max: 1,
      });

      // ── Sabores — preserva os existentes na edição, grupo vazio na criação
      optionGroups.push({
        id: gSaborId, name: "Sabores", status: "AVAILABLE",
        externalCode: null, optionGroupType: "TOPPING",
        optionIds: saborOptionIds, // [] na criação, IDs existentes na edição
        index: 1,
        min: 1,
        max: tamanhos.reduce((acc, t) => Math.max(acc, Math.max(...t.fracoes)), 1),
      });

      // ── Massas ──────────────────────────────────────────────────────────
      const massaOptionIds: string[] = [];
      massas.forEach((m, i) => {
        const optId  = m.optionId  ?? crypto.randomUUID();
        const prodId = m.productId ?? crypto.randomUUID();
        massaOptionIds.push(optId);

        products.push({
          id: prodId, name: m.nome, description: null,
          additionalInformation: null,
          externalCode: m.externalCode || null,
          imagePath: null, ean: null, serving: null,
          dietaryRestrictions: null, tags: null,
          quantity: null, optionGroups: null,
        });
        options.push({
          id: optId, status: m.ativo ? "AVAILABLE" : "UNAVAILABLE",
          index: i, productId: prodId,
          price: { value: m.preco, originalValue: null },
          fractions: null, externalCode: m.externalCode || null,
          contextModifiers: null,
        });
      });

      optionGroups.push({
        id: gMassaId, name: "Massas", status: "AVAILABLE",
        externalCode: null, optionGroupType: "CRUST",
        optionIds: massaOptionIds, index: 2, min: 1, max: 1,
      });

      // ── Bordas ──────────────────────────────────────────────────────────
      const bordaOptionIds: string[] = [];
      bordas.forEach((b, i) => {
        const optId  = b.optionId  ?? crypto.randomUUID();
        const prodId = b.productId ?? crypto.randomUUID();
        bordaOptionIds.push(optId);

        products.push({
          id: prodId, name: b.nome, description: null,
          additionalInformation: null,
          externalCode: b.externalCode || null,
          imagePath: null, ean: null, serving: null,
          dietaryRestrictions: null, tags: null,
          quantity: null, optionGroups: null,
        });
        options.push({
          id: optId, status: b.ativo ? "AVAILABLE" : "UNAVAILABLE",
          index: i, productId: prodId,
          price: { value: b.preco, originalValue: null },
          fractions: null, externalCode: b.externalCode || null,
          contextModifiers: null,
        });
      });

      optionGroups.push({
        id: gBordaId, name: "Bordas", status: "AVAILABLE",
        externalCode: null, optionGroupType: "EDGE",
        optionIds: bordaOptionIds, index: 3, min: 0, max: 1,
      });

      // ── Produto raiz ─────────────────────────────────────────────────────
      products.unshift({
        id: productId, name: nomeCategoria, description: null,
        additionalInformation: null, externalCode: null,
        imagePath: null, ean: null, serving: null,
        dietaryRestrictions: null, tags: null, quantity: null,
        optionGroups: optionGroups.map(og => ({
          id: og.id, min: og.min ?? 0, max: og.max ?? 1,
        })),
      });

      // ── Item ─────────────────────────────────────────────────────────────
      const item: IFoodItemPayload = {
        id:           itemId,
        type:         "PIZZA",
        categoryId:   isEdicao ? categoryId! : null,
        status:       "AVAILABLE",
        price:        null,
        externalCode: null,
        index:        0,
        productId,
        tags:         null,
        shifts:       montarShifts(),
        contextModifiers: null,
      };

      // ── Sabores existentes — preserva options e produtos na edição ───────
      // Os sabores já existem no iFood — apenas incluímos no payload para o
      // PUT não removê-los (o iFood usa upsert por ID)
      // Buscamos do itemPizzaCompleto via obterItemFlat se for edição
      if (isEdicao && saborOptionIds.length > 0) {
        const itemAtual = await ifoodCatalogService.obterItemFlat(empresaId, itemId);
        if (itemAtual.sucesso) {
          // Adiciona options e products dos sabores ao payload
          for (const optId of saborOptionIds) {
            const opt = itemAtual.dados.options.find(o => o.id === optId);
            if (opt && !options.find(o => o.id === opt.id)) {
              options.push({ ...opt });
            }
            if (opt) {
              const prod = itemAtual.dados.products.find(p => p.id === opt.productId);
              if (prod && !products.find(p => p.id === prod.id)) {
                products.push({ ...prod });
              }
            }
          }
        }
      }

      const payload: IFoodSalvarItemDto = { item, products, optionGroups, options };
      const result = await ifoodCatalogService.salvarItem(empresaId, payload);

      if (result.sucesso) {
        toast.success(isEdicao ? "Pizza atualizada!" : "Pizza criada!");
        router.push(`/ifood/catalogo?catalogId=${catalogId}`);
      } else {
        setErro(result.erro ?? "Erro ao salvar pizza.");
      }
    } catch (e) {
      console.error(e);
      setErro("Erro inesperado. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (carregando) {
    return (
      <div className={styles.page}>
        <div className={styles.topBar}>
          <button className={styles.backBtn} type="button" onClick={() => router.back()}>
            <FiArrowLeft size={16} />
          </button>
          <span className={styles.topTitulo}>
            {isEdicao ? "Editar categoria de pizza" : "Nova categoria de pizza"}
          </span>
        </div>
        <div className={styles.body} style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
          <p style={{ color: "var(--color-text-secondary)" }}>Carregando...</p>
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} type="button" onClick={() => router.back()}>
          <FiArrowLeft size={16} />
        </button>
        <span className={styles.topTitulo}>
          {isEdicao ? "Editar categoria de pizza" : "Nova categoria de pizza"}
        </span>
      </div>

      <div className={styles.body}>
        <h1 className={styles.titulo}>
          {isEdicao ? "Editar categoria" : "Nova categoria"}
        </h1>

        {/* Abas */}
        <nav className={styles.abas}>
          {STEPS.map((s, i) => (
            <button key={s.key} type="button"
              className={`${styles.aba} ${stepAtivo === s.key ? styles.abaAtiva : ""}`}
              onClick={() => { if (i <= stepIdx + 1) setStepAtivo(s.key); }}>
              {s.label}
            </button>
          ))}
        </nav>

        {/* ══ DETALHES ══ */}
        {stepAtivo === "detalhes" && (
          <div className={styles.stepContent}>
            <div className={styles.stepHead}>
              <h2 className={styles.stepTitulo}>Detalhes</h2>
              <p className={styles.stepDesc}>Preencha as informações da categoria.</p>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Tipo da categoria</label>
              <div className={styles.tipoBox}>
                <span className={styles.tipoIcon}>🍕</span>
                <span className={styles.tipoNome}>Pizza</span>
                {!isEdicao && <span className={styles.tipoAlterar}>Alterar</span>}
              </div>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Nome da categoria</label>
              <input className={styles.input} maxLength={40}
                placeholder="Ex: Pizzas Salgadas"
                value={nomeCategoria}
                onChange={e => setNomeCategoria(e.target.value)} />
              <span className={styles.charCount}>{nomeCategoria.length}/40</span>
            </div>
          </div>
        )}

        {/* ══ TAMANHO ══ */}
        {stepAtivo === "tamanho" && (
          <div className={styles.stepContent}>
            <div className={styles.stepHead}>
              <h2 className={styles.stepTitulo}>Tamanho</h2>
              <p className={styles.stepDesc}>
                Indique os tamanhos, a quantidade de pedaços e até quantos sabores cada tamanho aceita.
              </p>
            </div>
            <div className={styles.tamanhosList}>
              {tamanhos.map(t => (
                <TamanhoRow key={t.id} tamanho={t}
                  onChange={patch => updateTamanho(t.id, patch)}
                  onRemove={() => removeTamanho(t.id)} />
              ))}
            </div>
            <button className={styles.btnAdicionarTamanho} type="button" onClick={addTamanho}>
              <FiPlus size={13} /> Adicionar novo tamanho
            </button>
            <div className={styles.dicaFotoBox}>
              <div className={styles.dicaFotoPreview}>
                <div className={styles.dicaFotoCard}>
                  <p className={styles.dicaFotoCardLabel}>Pizzas salgadas</p>
                  <p className={styles.dicaFotoCardSub}>MÉDIA (6 FATIAS)</p>
                  <p className={styles.dicaFotoCardPreco}>a partir de R$ 59,00</p>
                  <div className={styles.dicaFotoPlaceholder} />
                </div>
              </div>
              <div className={styles.dicaFotoTexto}>
                <p className={styles.dicaFotoPergunta}>Onde a foto aparece?</p>
                <p className={styles.dicaFotoDesc}>
                  A imagem de cada tamanho aparece na{" "}
                  <strong>página inicial do cardápio no app do iFood</strong>.
                </p>
              </div>
            </div>
            <h3 className={styles.tamanhoCardsTitulo}>Resumo e status de venda</h3>
            <div className={styles.tamanhosCards}>
              {tamanhos.map(t => <TamanhoCard key={t.id} tamanho={t} />)}
            </div>
          </div>
        )}

        {/* ══ MASSA ══ */}
        {stepAtivo === "massa" && (
          <div className={styles.stepContent}>
            <div className={styles.stepHead}>
              <h2 className={styles.stepTitulo}>Massa</h2>
              <p className={styles.stepDesc}>Indique os tipos de massa que sua loja trabalha.</p>
            </div>
            <TabelaOpcoesPizza label="Massa" placeholder="Ex: Tradicional"
              itens={massas} onChange={setMassas} />
          </div>
        )}

        {/* ══ BORDA ══ */}
        {stepAtivo === "borda" && (
          <div className={styles.stepContent}>
            <div className={styles.stepHead}>
              <h2 className={styles.stepTitulo}>Borda</h2>
              <p className={styles.stepDesc}>Indique os tipos de borda que sua loja trabalha.</p>
            </div>
            <TabelaOpcoesPizza label="Borda" placeholder="Ex: Catupiry"
              itens={bordas} onChange={setBordas} />
          </div>
        )}

        {/* ══ DISPONIBILIDADE ══ */}
        {stepAtivo === "disponibilidade" && (
          <div className={styles.stepContent}>
            <div className={styles.stepHead}>
              <h2 className={styles.stepTitulo}>Disponibilidade</h2>
              <p className={styles.stepDesc}>
                Defina em quais momentos os clientes poderão comprar itens desta categoria.
              </p>
            </div>
            <h3 className={styles.disponibilidadeSubtitulo}>📅 Dias da semana</h3>
            <div className={styles.radioCard}>
              <label className={styles.radioOpt}>
                <input type="radio" name="disponibilidade"
                  checked={sempreDisponivel} onChange={() => setSempreDisponivel(true)} />
                <div>
                  <p className={styles.radioLabel}>Sempre disponível</p>
                  <p className={styles.radioDesc}>Disponível sempre que o restaurante estiver aberto.</p>
                </div>
              </label>
              <label className={styles.radioOpt}>
                <input type="radio" name="disponibilidade"
                  checked={!sempreDisponivel} onChange={() => setSempreDisponivel(false)} />
                <div>
                  <p className={styles.radioLabel}>Disponível em dias e horários específicos</p>
                  <p className={styles.radioDesc}>
                    Selecione os períodos em que a categoria ficará disponível.
                  </p>
                </div>
              </label>
            </div>
            {!sempreDisponivel && (
              <div className={styles.horarioBox}>
                <div className={styles.diasRow}>
                  {DIAS.map(d => (
                    <button key={d.key} type="button"
                      className={`${styles.diaBtn} ${diasAtivos.includes(d.apiKey) ? styles.diaBtnAtivo : ""}`}
                      onClick={() => toggleDia(d.apiKey)}>
                      {d.label}
                    </button>
                  ))}
                </div>
                <div className={styles.turnosHeader}>
                  <span className={styles.turnosLabel}>Horários</span>
                  <button type="button" className={styles.btnAdicionarTurno} onClick={addTurno}>
                    + Adicionar turno
                  </button>
                </div>
                {turnos.map((turno, i) => (
                  <div key={i} className={styles.turnoRow}>
                    <span className={styles.turnoNum}>{i + 1}º turno</span>
                    <select className={styles.turnoSelect} value={turno.inicio}
                      onChange={e => updateTurno(i, { inicio: e.target.value })}>
                      <option value="">Selecionar</option>
                      {Array.from({ length: 24 }, (_, h) => (
                        <option key={h} value={`${String(h).padStart(2, "0")}:00`}>
                          {String(h).padStart(2, "0")}:00
                        </option>
                      ))}
                    </select>
                    <select className={styles.turnoSelect} value={turno.fim}
                      onChange={e => updateTurno(i, { fim: e.target.value })}>
                      <option value="">Selecionar</option>
                      {Array.from({ length: 24 }, (_, h) => (
                        <option key={h} value={`${String(h).padStart(2, "0")}:00`}>
                          {String(h).padStart(2, "0")}:00
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
            {erro && <p className={styles.erro}>{erro}</p>}
          </div>
        )}

        {/* Navegação */}
        <div className={styles.navFooter}>
          {stepIdx > 0 && (
            <button type="button" className={styles.btnSec} onClick={anteriorStep}>
              Voltar
            </button>
          )}
          <div style={{ flex: 1 }} />
          {!isUltimo ? (
            <button type="button" className={styles.btnPri}
              disabled={!stepValido(stepAtivo)} onClick={proximoStep}>
              Próximo
            </button>
          ) : (
            <button type="button" className={styles.btnPri}
              disabled={salvando} onClick={salvar}>
              {salvando ? "Salvando..." : isEdicao ? "Salvar alterações" : "Salvar categoria"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}