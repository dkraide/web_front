import { useState, useRef, useEffect, useContext } from "react";
import { useRouter } from "next/router";
import {
    FiArrowLeft, FiChevronRight, FiChevronLeft, FiUpload,
    FiPackage, FiShoppingBag, FiPlus, FiCopy,
    FiTrash2, FiCheck, FiLoader
} from "react-icons/fi";
import { useForm } from "react-hook-form";
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
} from "@/interfaces/ifoodCatalog";
import { parseVinculo, externalCodeProduto } from "@/interfaces/ifoodCatalog";
import styles from "./styles.module.scss";

// ─── Tipos locais ─────────────────────────────────────────────────────────────

type TipoProduto = "preparado" | "industrializado" | null;

// Tipo exclusivo do form interno do modal
interface GrupoForm {
    nome: string;
    obrigatorio: string; // "true" | "false"
    min: number;
    max: number;
}

interface RestricaoAlimentar {
    key: string;
    label: string;
    icon: string;
}

interface ComplementoForm {
    id: string;
    nome: string;
    preco: number;
}

interface GrupoComplementoForm {
    id: string;
    nome: string;
    tipo: "ingrediente" | "especificacao" | "crosssell" | "descartavel";
    obrigatorio: boolean;
    min: number;
    max: number;
    complementos: ComplementoForm[];
}

interface ProdutoForm {
    nome: string;
    descricao: string;
    servingsUnit: string;
    peso: number;
    pesoUnit: string;
    categoriaId: string;
    preco: number;
    precoOriginal: number | "";
    produtoKrdId: number | "";
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const RESTRICOES: RestricaoAlimentar[] = [
    { key: "VEGAN", label: "Vegano", icon: "🌿" },
    { key: "VEGETARIAN", label: "Vegetariano", icon: "🥗" },
    { key: "ORGANIC", label: "Orgânico", icon: "🌱" },
    { key: "SUGAR_FREE", label: "Sem açúcar", icon: "🚫" },
    { key: "LAC_FREE", label: "Sem lactose", icon: "🥛" },
    { key: "GLUTEN_FREE", label: "Sem glúten", icon: "🌾" },
    { key: "NATURAL", label: "Natural", icon: "🍃" },
    { key: "ZERO", label: "Zero", icon: "0️⃣" },
    { key: "DIET", label: "Diet", icon: "🥦" },
];

const BEBIDAS = [
    { key: "FROSTY", label: "Bebida gelada", icon: "🧊" },
    { key: "ALCOHOLIC_DRINK", label: "Bebida alcoólica", icon: "🍺" },
];

const TIPOS_GRUPO = [
    { key: "ingrediente", label: "Ingredientes", icon: "🥬", desc: "Dê a opção do cliente remover e adicionar ingredientes neste produto." },
    { key: "especificacao", label: "Especificações", icon: "📋", desc: "Faça perguntas para que o cliente defina melhor o produto e seu modo de preparo." },
    { key: "crosssell", label: "Cross-sell", icon: "🎁", desc: "Aproveite para sugerir outros produtos e aumentar o valor do pedido." },
    { key: "descartavel", label: "Descartáveis", icon: "♻️", desc: "Pergunte ao cliente se ele precisa de talheres." },
];

const TIPO_GRUPO_MAP: Record<string, GrupoComplementoForm["tipo"]> = {
    INGREDIENTS:   "ingrediente",
    SPECIFICATION: "especificacao",
    DEFAULT:       "crosssell",
    CUTLERY:       "descartavel",
    // fallback para tipos que podem vir da API
    SIZE:          "especificacao",
    TOPPING:       "especificacao",
    CRUST:         "especificacao",
    EDGE:          "especificacao",
    OFFER_UNIT:    "especificacao",
};
const TIPO_GRUPO_IFOOD_MAP: Record<GrupoComplementoForm["tipo"], string> = {
    ingrediente:   "INGREDIENTS",    // era INGREDIENT
    especificacao: "SPECIFICATION",  // era OPTION
    crosssell:     "DEFAULT",        // era ADDON — não existe no iFood, DEFAULT é o mais próximo
    descartavel:   "CUTLERY",        // era DISPOSABLE
};

const STEPS = [
    { label: "Tipo" },
    { label: "Informações" },
    { label: "Complementos" },
    { label: "Categoria & Preço" },
];

// ─── Sub-modal criar grupo ────────────────────────────────────────────────────

function ModalCriarGrupo({
    onSalvar,
    onFechar,
}: {
    onSalvar: (g: GrupoComplementoForm) => void;
    onFechar: () => void;
}) {
    const [subStep, setSubStep] = useState(1);
    const [tipoSelecionado, setTipoSelecionado] = useState<string | null>(null);
    const [complementos, setComplementos] = useState<ComplementoForm[]>([]);
    const [nomeComp, setNomeComp] = useState("");
    const [precoComp, setPrecoComp] = useState("");

    const { register, handleSubmit, formState: { errors } } = useForm<GrupoForm>({
        defaultValues: { nome: "", obrigatorio: "false", min: 0, max: 1 },
    });

    function addComp() {
        if (!nomeComp.trim()) return;
        setComplementos(p => [...p, {
            id: crypto.randomUUID(),
            nome: nomeComp.trim(),
            preco: parseFloat(precoComp) || 0,
        }]);
        setNomeComp("");
        setPrecoComp("");
    }

    function onConcluir(form: any) {
        if (!complementos.length) return;
        onSalvar({
            id: crypto.randomUUID(),
            nome: form.nome,
            tipo: tipoSelecionado as GrupoComplementoForm["tipo"],
            obrigatorio: form.obrigatorio === "true",
            min: Number(form.min),
            max: Number(form.max),
            complementos,
        });
    }

    return (
        <div className={styles.subOverlay} onClick={onFechar}>
            <div className={styles.subModal} onClick={e => e.stopPropagation()}>

                <div className={styles.subHeader}>
                    <div>
                        <p className={styles.subTitulo}>Criar novo grupo</p>
                        <p className={styles.subSubtitle}>Passo {subStep} de 3</p>
                    </div>
                    <button className={styles.closeBtn} onClick={onFechar}>✕</button>
                </div>

                <div className={styles.subStepBar}>
                    {[1, 2, 3].map(i => (
                        <div key={i}
                            className={`${styles.subStepSeg} ${i <= subStep ? styles.subStepSegAtivo : ""}`}
                        />
                    ))}
                </div>

                <div className={styles.subBody}>

                    {subStep === 1 && (
                        <>
                            <p className={styles.subDesc}>Primeiro, defina o tipo do grupo</p>
                            <div className={styles.tiposGrupoGrid}>
                                {TIPOS_GRUPO.map(t => (
                                    <button key={t.key}
                                        className={`${styles.tipoGrupoCard} ${tipoSelecionado === t.key ? styles.tipoGrupoAtivo : ""}`}
                                        onClick={() => setTipoSelecionado(t.key)}>
                                        <span className={styles.tgIcon}>{t.icon}</span>
                                        <span className={styles.tgLabel}>{t.label}</span>
                                        <span className={styles.tgDesc}>{t.desc}</span>
                                        {tipoSelecionado === t.key && <span className={styles.tgCheck}><FiCheck size={12} /></span>}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    {subStep === 2 && (
                        <>
                            <p className={styles.subDesc}>Defina o nome e as regras de seleção</p>
                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>Nome do Grupo *</label>
                                <input className={styles.input} placeholder="Ex: Turbine seu lanche"
                                    {...register("nome", { required: true })} />
                                {errors.nome && <span className={styles.erro}>Campo obrigatório</span>}
                            </div>
                            <div className={styles.fieldRow}>
                                <span className={styles.label}>Este grupo é obrigatório?</span>
                                <div className={styles.radioGroup}>
                                    <label className={styles.radioOpt}>
                                        <input type="radio" value="false" {...register("obrigatorio")} /> Opcional
                                    </label>
                                    <label className={styles.radioOpt}>
                                        <input type="radio" value="true" {...register("obrigatorio")} /> Obrigatório
                                    </label>
                                </div>
                            </div>
                            <div className={styles.qtdRow}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Qtd. mínima</label>
                                    <input type="number" min={0} className={styles.inputSm} {...register("min")} />
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Qtd. máxima</label>
                                    <input type="number" min={1} className={styles.inputSm} {...register("max")} />
                                </div>
                            </div>
                        </>
                    )}

                    {subStep === 3 && (
                        <>
                            <p className={styles.subDesc}>Adicione os complementos do grupo</p>
                            <div className={styles.addCompRow}>
                                <input className={styles.input} placeholder="Nome do complemento"
                                    value={nomeComp} onChange={e => setNomeComp(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && addComp()} />
                                <input type="number" step="0.01" className={styles.inputSm}
                                    placeholder="R$ 0,00" value={precoComp}
                                    onChange={e => setPrecoComp(e.target.value)} />
                                <button className={styles.btnAdd} onClick={addComp}>
                                    <FiPlus size={14} /> Add
                                </button>
                            </div>
                            {complementos.length > 0 ? (
                                <div className={styles.compList}>
                                    {complementos.map(c => (
                                        <div key={c.id} className={styles.compItem}>
                                            <span>{c.nome}</span>
                                            <span className={styles.compPreco}>
                                                {c.preco > 0 ? `+R$${c.preco.toFixed(2)}` : "Grátis"}
                                            </span>
                                            <button className={styles.btnDel}
                                                onClick={() => setComplementos(p => p.filter(x => x.id !== c.id))}>
                                                <FiTrash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className={styles.vazio}>Nenhum complemento adicionado ainda.</p>
                            )}
                        </>
                    )}
                </div>

                <div className={styles.subFooter}>
                    {subStep > 1
                        ? <button className={styles.btnSec} onClick={() => setSubStep(s => s - 1)}>
                            <FiChevronLeft size={14} /> Voltar
                        </button>
                        : <div />
                    }
                    {subStep < 3 && (
                        <button className={styles.btnPri}
                            disabled={subStep === 1 && !tipoSelecionado}
                            onClick={() => subStep === 2
                                ? handleSubmit(() => setSubStep(3))()
                                : setSubStep(s => s + 1)
                            }>
                            Próximo <FiChevronRight size={14} />
                        </button>
                    )}
                    {subStep === 3 && (
                        <button className={styles.btnPri}
                            disabled={!complementos.length}
                            onClick={handleSubmit(onConcluir)}>
                            <FiCheck size={14} /> Concluir
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function IFoodProdutoPage() {
    const router = useRouter();
    const { itemId, catalogId } = router.query as { itemId?: string; catalogId?: string };
    const isEdicao = !!itemId;

    const { getUser } = useContext(AuthContext);
    const [empresaId, setEmpresaId] = useState(0);
    const [loading, setLoading] = useState(isEdicao);

    const [categorias, setCategorias] = useState<IFoodCategoriaDetalhe[]>([]);
    const [produtos, setProdutos] = useState<IProduto[]>([]);

    const [step, setStep] = useState(1);
    const [tipoProduto, setTipoProduto] = useState<TipoProduto>(null);
    const [restricoes, setRestricoes] = useState<string[]>([]);
    const [tags, setTags] = useState<string[]>([]);
    const [imagemPreview, setImagemPreview] = useState<string | null>(null);
    const [imagemBase64, setImagemBase64] = useState<string | null>(null);
    const [grupos, setGrupos] = useState<GrupoComplementoForm[]>([]);
    const [modalGrupo, setModalGrupo] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    // IDs originais — preservados na edição para o PUT não criar novos UUIDs
    const [itemIdOriginal, setItemIdOriginal] = useState<string | null>(null);
    const [productIdOriginal, setProductIdOriginal] = useState<string | null>(null);

    const fileRef = useRef<HTMLInputElement>(null);

    const { register, handleSubmit, watch, setValue, getValues, formState: { errors } } =
        useForm<ProdutoForm>({
            defaultValues: {
                nome: "", descricao: "", servingsUnit: "SERVES",
                peso: 0, pesoUnit: "g",
                categoriaId: "", preco: 0, precoOriginal: "", produtoKrdId: "",
            },
        });

    // ─── Carregamentos ────────────────────────────────────────────────────────

    useEffect(() => {
        async function init() {
            const user = await getUser();
            if (!user) return;
            const eid = user.empresaSelecionada;
            setEmpresaId(eid);
            await Promise.all([
                carregarCategorias(eid),
                carregarProdutos(eid),
            ]);
            if (isEdicao && itemId) {
                await carregarItem(eid, itemId);
            }
        }
        if (catalogId || !isEdicao) init();
    }, [catalogId, router.isReady]);

    async function carregarCategorias(eid: number) {
        try {
            if (!catalogId) return;
            const r = await ifoodCatalogService.listarCategorias(eid, catalogId);
            if (r.sucesso) setCategorias(r.dados);
        } catch { }
    }

    async function carregarProdutos(eid: number) {
        try {
            const r = await produtoService.getAll(eid, true);
            if (r) setProdutos(r);
        } catch { }
    }

    async function carregarItem(eid: number, id: string) {
        setLoading(true);
        try {
            const r = await ifoodCatalogService.obterItemFlat(eid, id);
            if (!r?.sucesso || !r.dados) return;

            const { item, products, optionGroups, options } = r.dados;

            // Preserva IDs originais para o PUT
            setItemIdOriginal(item.id);
            setProductIdOriginal(item.productId);

            // Produto raiz
            const produtoRaiz = products.find(p => p.id === item.productId);
            if (produtoRaiz) {
                setValue("nome", produtoRaiz.name ?? "");
                setValue("descricao", produtoRaiz.description ?? "");
                setValue("servingsUnit", produtoRaiz.serving ?? "NOT_APPLICABLE");
                if (produtoRaiz.imagePath) setImagemPreview(produtoRaiz.imagePath);
                setRestricoes(produtoRaiz.dietaryRestrictions ?? []);
                setTags(produtoRaiz.tags ?? []);
            }

            // Preço e categoria
            setValue("preco", item.price?.value ?? 0);
            setValue("precoOriginal", item.price?.originalValue ?? "");
            setValue("categoriaId", item.categoryId ?? "");

            // Vínculo KRD
            const vinculo = parseVinculo(item.externalCode);
            if (vinculo?.tipo === "produto") setValue("produtoKrdId", vinculo.id);

            // Reconstrói grupos para o state local do wizard
            const gruposReconstruidos: GrupoComplementoForm[] = optionGroups.map(og => ({
                id: og.id,
                nome: og.name,
                tipo: TIPO_GRUPO_MAP[og.optionGroupType ?? ""] ?? "especificacao",
                obrigatorio: (og.min ?? 0) > 0,
                min: og.min ?? 0,
                max: og.max ?? 1,
                complementos: og.optionIds.map(optId => {
                    const opt = options.find(o => o.id === optId);
                    const prod = opt ? products.find(p => p.id === opt.productId) : null;
                    return {
                        id: optId,
                        nome: prod?.name ?? "",
                        preco: opt?.price?.value ?? 0,
                    };
                }),
            }));

            setGrupos(gruposReconstruidos);
        } finally {
            setLoading(false);
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

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

    function podeAvancar(): boolean {
        if (step === 1) return tipoProduto !== null;
        if (step === 2) return !!(getValues("nome")?.trim());
        return true;
    }

    // ─── Monta o payload IFoodSalvarItemDto ───────────────────────────────────

    async function montarPayload(
        form: ProdutoForm,
        eid: number
    ): Promise<IFoodSalvarItemDto | null> {

        // Upload de imagem se houver nova
        let imagePath: string | null = null;
        if (imagemBase64) {
            const upResult = await ifoodCatalogService.uploadImagem(eid, imagemBase64);
            if (!upResult.sucesso) {
                setErro(`Falha ao fazer upload da imagem: ${upResult.erro}`);
                return null;
            }
            imagePath = upResult.dados.imagePath;
        } else if (imagemPreview && !imagemPreview.startsWith("data:")) {
            // Edição sem trocar imagem — mantém o imagePath original
            imagePath = imagemPreview;
        }

        const itemId = itemIdOriginal ?? crypto.randomUUID();
        const productId = productIdOriginal ?? crypto.randomUUID();

        // Monta produtos, grupos e opções
        const products: IFoodProdutoPayload[] = [];
        const optionGroups: IFoodGrupoOpcaoPayload[] = [];
        const options: IFoodOpcaoPayload[] = [];

        // Produto raiz
        products.push({
            id: productId,
            name: form.nome,
            description: form.descricao || null,
            additionalInformation: null,
            externalCode: form.produtoKrdId
                ? externalCodeProduto(Number(form.produtoKrdId))
                : null,
            imagePath,
            ean: null,
            serving: form.servingsUnit === "NOT_APPLICABLE" ? null : form.servingsUnit,
            dietaryRestrictions: restricoes.length > 0 ? restricoes : null,
            tags: tags.length > 0 ? tags : null,
            quantity: null,
            optionGroups: grupos.length > 0
                ? grupos.map(g => ({
                    id: g.id,
                    min: g.min,
                    max: g.max,
                }))
                : null,
        });

        // Grupos e complementos
        for (const grupo of grupos) {
            const optionIds: string[] = [];

            for (const comp of grupo.complementos) {
                const compProductId = crypto.randomUUID();
                const optionId = comp.id; // preserva id na edição

                optionIds.push(optionId);

                options.push({
                    id: optionId,
                    status: "AVAILABLE",
                    index: grupo.complementos.indexOf(comp),
                    productId: compProductId,
                    price: { value: comp.preco, originalValue: null },
                    fractions: null,
                    externalCode: null,
                    contextModifiers: null,
                });

                products.push({
                    id: compProductId,
                    name: comp.nome,
                    description: null,
                    additionalInformation: null,
                    externalCode: null,
                    imagePath: null,
                    ean: null,
                    serving: null,
                    dietaryRestrictions: null,
                    tags: null,
                    quantity: null,
                    optionGroups: null,
                });
            }

            optionGroups.push({
                id: grupo.id,
                name: grupo.nome,
                status: "AVAILABLE",
                externalCode: null,
                optionGroupType: TIPO_GRUPO_IFOOD_MAP[grupo.tipo],
                optionIds,
                index: grupos.indexOf(grupo),
                min: grupo.min,
                max: grupo.max,
            });
        }

        const item: IFoodItemPayload = {
            id: itemId,
            type: "DEFAULT",
            categoryId: form.categoriaId,
            status: "AVAILABLE",
            price: {
                value: form.preco,
                originalValue: form.precoOriginal ? Number(form.precoOriginal) : null,
            },
            externalCode: form.produtoKrdId
                ? externalCodeProduto(Number(form.produtoKrdId))
                : null,
            index: 0,
            productId,
            tags: null,
            shifts: null,
            contextModifiers: null,
        };

        return { item, products, optionGroups, options };
    }

    // ─── Submit ───────────────────────────────────────────────────────────────

    async function onFinalizar(form: ProdutoForm) {
        setSalvando(true);
        setErro(null);
        try {
            const payload = await montarPayload(form, empresaId);
            if (!payload) return;

            const result = await ifoodCatalogService.salvarItem(empresaId, payload);

            if (result.sucesso) {
                router.push(`/ifood/catalogo${catalogId ? `?catalogId=${catalogId}` : ""}`);
            } else {
                setErro(result.erro ?? "Erro ao salvar produto.");
            }
        } catch {
            setErro("Erro ao salvar produto. Tente novamente.");
        } finally {
            setSalvando(false);
        }
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className={styles.loadingPage}>
                <FiLoader size={24} className={styles.spinner} />
                <p>Carregando produto...</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>

            {/* Top bar */}
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
                        {isEdicao ? "Editar produto" : "Criar produto preparado"}
                    </span>
                </div>
            </div>

            <div className={styles.layout}>

                {/* Sidebar de steps */}
                <aside className={styles.sidebar}>
                    <h1 className={styles.pageTitle}>
                        {isEdicao ? "Editar produto" : "Criar produto preparado"}
                    </h1>
                    <div className={styles.stepsList}>
                        {STEPS.map((s, i) => {
                            const num = i + 1;
                            const isDone = step > num;
                            const isAtivo = step === num;
                            return (
                                <button key={num}
                                    className={`${styles.stepItem} ${isAtivo ? styles.stepAtivo : ""} ${isDone ? styles.stepDone : ""}`}
                                    onClick={() => isDone && setStep(num)}
                                    disabled={!isDone && !isAtivo}>
                                    <span className={styles.stepNum}>
                                        {isDone ? <FiCheck size={12} /> : num}
                                    </span>
                                    <span className={styles.stepLabel}>{s.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </aside>

                {/* Conteúdo */}
                <main className={styles.main}>

                    {/* STEP 1 — Tipo */}
                    {step === 1 && (
                        <div className={styles.stepContent}>
                            <div className={styles.stepHead}>
                                <h2 className={styles.stepTitulo}>Escolha o tipo do produto</h2>
                                <p className={styles.stepDesc}>Defina como este produto foi fabricado</p>
                            </div>
                            <div className={styles.tiposGrid}>
                                <button
                                    className={`${styles.tipoCard} ${tipoProduto === "preparado" ? styles.tipoCardAtivo : ""}`}
                                    onClick={() => setTipoProduto("preparado")}>
                                    <FiShoppingBag size={30} />
                                    <span className={styles.tipoLabel}>Produto Preparado</span>
                                    <span className={styles.tipoDesc}>
                                        Itens feitos no seu estabelecimento: lanches, pratos, bebidas artesanais.
                                    </span>
                                    {tipoProduto === "preparado" && <span className={styles.tipoCheck}><FiCheck size={13} /></span>}
                                </button>
                                <button
                                    className={`${styles.tipoCard} ${tipoProduto === "industrializado" ? styles.tipoCardAtivo : ""}`}
                                    onClick={() => setTipoProduto("industrializado")}>
                                    <FiPackage size={30} />
                                    <span className={styles.tipoLabel}>Produto Industrializado</span>
                                    <span className={styles.tipoDesc}>
                                        Itens com código de barras: refrigerantes, snacks, produtos embalados.
                                    </span>
                                    {tipoProduto === "industrializado" && <span className={styles.tipoCheck}><FiCheck size={13} /></span>}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2 — Informações */}
                    {step === 2 && (
                        <div className={styles.stepContent}>
                            <div className={styles.stepHead}>
                                <h2 className={styles.stepTitulo}>Principais informações</h2>
                                <p className={styles.stepDesc}>Preencha os dados do produto que serão exibidos no app</p>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>Nome do Produto *</label>
                                <input className={styles.input} placeholder="Ex: Molho pomodoro" maxLength={80}
                                    {...register("nome", { required: "Campo obrigatório" })} />
                                <span className={styles.charCount}>{watch("nome")?.length ?? 0}/80</span>
                                {errors.nome && <span className={styles.erro}>{errors.nome.message}</span>}
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>Descrição</label>
                                <textarea className={styles.textarea} maxLength={1000}
                                    placeholder="Ex: Molho de tomate italiano clássico..."
                                    {...register("descricao")} />
                                <span className={styles.charCount}>{watch("descricao")?.length ?? 0}/1000</span>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>Imagem do produto</label>
                                <input ref={fileRef} type="file" accept="image/*"
                                    style={{ display: "none" }} onChange={handleImagem} />
                                {imagemPreview ? (
                                    <div className={styles.imgPreviewRow}>
                                        <img src={imagemPreview} alt="Preview" className={styles.imgPreview} />
                                        <button className={styles.btnTrocar}
                                            onClick={() => fileRef.current?.click()}>
                                            Trocar imagem
                                        </button>
                                    </div>
                                ) : (
                                    <button className={styles.btnUpload}
                                        onClick={() => fileRef.current?.click()}>
                                        <FiUpload size={14} /> Adicionar imagem
                                    </button>
                                )}
                            </div>

                            <div className={styles.destaqueBox}>
                                <div className={styles.destaqueTop}>
                                    <span className={styles.destaqueRocket}>🚀</span>
                                    <div>
                                        <p className={styles.destaqueTitulo}>Destaque seu produto</p>
                                        <p className={styles.destaqueSubtitle}>
                                            Essas informações ajudam o algoritmo do iFood a exibir o produto no app.
                                        </p>
                                    </div>
                                </div>

                                <div className={styles.destaqueSection}>
                                    <p className={styles.sectionTag}>RESTRIÇÕES ALIMENTARES</p>
                                    <p className={styles.sectionSubtext}>
                                        Informe se seu produto é adequado a restrições alimentares.
                                    </p>
                                    <div className={styles.tagsRow}>
                                        {RESTRICOES.map(r => (
                                            <button key={r.key}
                                                className={`${styles.tag} ${restricoes.includes(r.key) ? styles.tagAtivo : ""}`}
                                                onClick={() => toggleRestricao(r.key)}>
                                                {r.icon} {r.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className={styles.destaqueSection}>
                                    <p className={styles.sectionTag}>EM CASO DE BEBIDAS</p>
                                    <div className={styles.tagsRow}>
                                        {BEBIDAS.map(b => (
                                            <button key={b.key}
                                                className={`${styles.tag} ${tags.includes(b.key) ? styles.tagAtivo : ""}`}
                                                onClick={() => toggleTag(b.key)}>
                                                {b.icon} {b.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className={styles.destaqueSection}>
                                    <p className={styles.sectionTag}>TAMANHO DO ITEM</p>
                                    <p className={styles.sectionSubtext}>
                                        Dê mais detalhes para que o cliente possa planejar a refeição.
                                    </p>
                                    <div className={styles.tamanhoRow}>
                                        <div className={styles.fieldGroup}>
                                            <label className={styles.label}>Serve até</label>
                                            <select className={styles.selectInline} {...register("servingsUnit")}>
                                                <option value="NOT_APPLICABLE">Não aplicável</option>
                                                <option value="SERVES_1">1 pessoa</option>
                                                <option value="SERVES_2">2 pessoas</option>
                                                <option value="SERVES_3">3 pessoas</option>
                                                <option value="SERVES_4">4 pessoas</option>
                                            </select>
                                        </div>
                                        <div className={styles.fieldGroup}>
                                            <label className={styles.label}>Peso</label>
                                            <div className={styles.inputGroup}>
                                                <input type="number" min={0} className={styles.inputInline}
                                                    {...register("peso")} />
                                                <select className={styles.selectInline} {...register("pesoUnit")}>
                                                    <option value="g">g</option>
                                                    <option value="kg">kg</option>
                                                    <option value="ml">ml</option>
                                                    <option value="l">l</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3 — Complementos */}
                    {step === 3 && (
                        <div className={styles.stepContent}>
                            <div className={styles.stepHead}>
                                <h2 className={styles.stepTitulo}>Grupos de complementos</h2>
                                <p className={styles.stepDesc}>
                                    Adicione grupos de opções para o cliente personalizar o pedido
                                </p>
                            </div>

                            <div className={styles.acoesGrupo}>
                                <button className={styles.btnOpcao} onClick={() => setModalGrupo(true)}>
                                    <span className={styles.btnOpcaoIcon}><FiPlus size={18} /></span>
                                    <div>
                                        <p className={styles.btnOpcaoLabel}>Criar novo complemento</p>
                                        <p className={styles.btnOpcaoDesc}>
                                            Crie um produto novo ou um produto industrializado
                                        </p>
                                    </div>
                                </button>
                                <button className={styles.btnOpcao} disabled>
                                    <span className={styles.btnOpcaoIcon}><FiCopy size={18} /></span>
                                    <div>
                                        <p className={styles.btnOpcaoLabel}>Copiar complemento</p>
                                        <p className={styles.btnOpcaoDesc}>
                                            Reaproveite produtos que já existem no seu cardápio
                                        </p>
                                    </div>
                                </button>
                            </div>

                            {grupos.length > 0 ? (
                                <div className={styles.gruposList}>
                                    {grupos.map(g => (
                                        <div key={g.id} className={styles.grupoCard}>
                                            <div className={styles.grupoCardTop}>
                                                <div>
                                                    <p className={styles.grupoNome}>{g.nome}</p>
                                                    <p className={styles.grupoMeta}>
                                                        {TIPOS_GRUPO.find(t => t.key === g.tipo)?.label} ·{" "}
                                                        {g.obrigatorio ? "Obrigatório" : "Opcional"} ·{" "}
                                                        min {g.min} / max {g.max} ·{" "}
                                                        {g.complementos.length} complemento(s)
                                                    </p>
                                                </div>
                                                <button className={styles.btnDelGrupo}
                                                    onClick={() => setGrupos(p => p.filter(x => x.id !== g.id))}>
                                                    <FiTrash2 size={13} />
                                                </button>
                                            </div>
                                            <div className={styles.grupoTags}>
                                                {g.complementos.map(c => (
                                                    <span key={c.id} className={styles.grupoTag}>
                                                        {c.nome}{c.preco > 0 ? ` +R$${c.preco.toFixed(2)}` : ""}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className={styles.vazio}>
                                    Nenhum grupo adicionado. Pule esta etapa se o produto não tiver complementos.
                                </p>
                            )}
                        </div>
                    )}

                    {/* STEP 4 — Categoria e preço */}
                    {step === 4 && (
                        <div className={styles.stepContent}>
                            <div className={styles.stepHead}>
                                <h2 className={styles.stepTitulo}>Adicionar em categoria</h2>
                                <p className={styles.stepDesc}>Defina onde o produto aparecerá no cardápio e seu preço</p>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>Categoria *</label>
                                <select className={styles.select}
                                    {...register("categoriaId", { required: "Selecione uma categoria" })}>
                                    <option value="">Selecione uma categoria</option>
                                    {categorias
                                        .filter(c => c.template !== "PIZZA")
                                        .map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))
                                    }
                                </select>
                                {errors.categoriaId && (
                                    <span className={styles.erro}>{errors.categoriaId.message}</span>
                                )}
                            </div>

                            <div className={styles.precosRow}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Preço *</label>
                                    <div className={styles.inputPrefix}>
                                        <span className={styles.prefix}>R$</span>
                                        <input type="number" step="0.01" min={0}
                                            className={styles.inputPrefixed} placeholder="0,00"
                                            {...register("preco", {
                                                required: "Obrigatório",
                                                min: { value: 0.01, message: "Maior que zero" },
                                            })} />
                                    </div>
                                    {errors.preco && <span className={styles.erro}>{errors.preco.message}</span>}
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>
                                        Preço original <span className={styles.labelOpt}>(opcional)</span>
                                    </label>
                                    <div className={styles.inputPrefix}>
                                        <span className={styles.prefix}>R$</span>
                                        <input type="number" step="0.01" min={0}
                                            className={styles.inputPrefixed} placeholder="0,00"
                                            {...register("precoOriginal")} />
                                    </div>
                                    <span className={styles.fieldHint}>Exibido riscado como "de" no app</span>
                                </div>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>
                                    Código PDV <span className={styles.labelOpt}>(produto KRD)</span>
                                </label>
                                <select className={styles.select} {...register("produtoKrdId")}>
                                    <option value="">Nenhum — vincular depois</option>
                                    {produtos.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.nome}{p.cod ? ` — Cód. ${p.cod}` : ""}
                                        </option>
                                    ))}
                                </select>
                                <span className={styles.fieldHint}>
                                    Vincula este item do iFood ao produto do PDV para controle de estoque.
                                </span>
                            </div>

                            {erro && <p className={styles.erroGlobal}>{erro}</p>}
                        </div>
                    )}

                    {/* Footer de navegação */}
                    <div className={styles.navFooter}>
                        {step > 1 && (
                            <button className={styles.btnSec} onClick={() => setStep(s => s - 1)}>
                                <FiChevronLeft size={15} /> Voltar
                            </button>
                        )}
                        <div style={{ flex: 1 }} />
                        {step < 4 && (
                            <button className={styles.btnPri} disabled={!podeAvancar()}
                                onClick={() => setStep(s => s + 1)}>
                                Próximo <FiChevronRight size={15} />
                            </button>
                        )}
                        {step === 4 && (
                            <button className={styles.btnPri} disabled={salvando}
                                onClick={handleSubmit(onFinalizar)}>
                                {salvando ? "Salvando..." : isEdicao ? "Salvar alterações" : "Cadastrar produto"}
                            </button>
                        )}
                    </div>
                </main>
            </div>

            {modalGrupo && (
                <ModalCriarGrupo
                    onSalvar={g => { setGrupos(p => [...p, g]); setModalGrupo(false); }}
                    onFechar={() => setModalGrupo(false)}
                />
            )}
        </div>
    );
}