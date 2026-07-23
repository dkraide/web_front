import { useContext, useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import {
  FiArrowLeft, FiSearch, FiChevronDown, FiChevronUp,
  FiEdit2, FiMoreVertical, FiPause, FiPlay, FiPlus,
  FiLink, FiTrash2, FiCopy
} from "react-icons/fi";
import { ifoodCatalogService } from "../../../services/ifoodCatalogService";
import type {
  IFoodCatalogo,
  IFoodCategoriaDetalhe,
  IFoodItemDaCategoria,
  IFoodGrupoComplemento,
  IFoodSalvarItemDto,
  IFoodCategoriaResumo,
  IFoodOpcaoResumo,
  IFoodCustomizationModifier
} from "../../../interfaces/ifoodCatalog";
import { parseVinculo } from "../../../interfaces/ifoodCatalog";
import { humanizarErro } from "@/utils/ifoodApiUtils";
import { AuthContext } from "@/contexts/AuthContext";
import CustomButton from "@/components/ui/Buttons";
import BaseModal from "@/components/Modals/Base/Index";
import KRDInput from "@/components/ui/KRDInput";
import { useForm } from "react-hook-form";
import styles from "./styles.module.scss";
import ModalVinculoItem from "@/components/ifood/ModalVinculoItem";
import ModalVinculoCategoria from "@/components/ifood/ModalVinculoCategoria";
import IProduto from "@/interfaces/IProduto";
import IClasseMaterial from "@/interfaces/IClasseMaterial";
import { produtoService } from "@/services/produtoService";
import { classeMaterialService } from "@/services/classeMaterialService";
import CardComplementos from "@/components/ifood/CardComplementos";
import IMateriaPrima from "@/interfaces/IMateriaPrima";
import { materiaPrimaService } from "@/services/materiaPrimaService";
import ModalCriarCategoria from "@/components/ifood/ModalCriarCategoria";
import ModalAdicionarSabor from "@/components/ifood/ModalAdicionarSabor";

type PrecoForm = { value: string; originalValue: string };

export default function IFoodCatalogoPage() {
  const router = useRouter();
  const { getUser } = useContext(AuthContext);

  const [empresaId, setEmpresaId] = useState(0);
  const [catalogos, setCatalogos] = useState<IFoodCatalogo[]>([]);
  const [catalogoAtivo, setCatalogoAtivo] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<IFoodCategoriaDetalhe[]>([]);
  const [categoriasAbertas, setCategoriasAbertas] = useState<Set<string>>(new Set());
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todas");
  const [loadingCategorias, setLoadingCategorias] = useState(false);

  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);
  const [togglingCategoria, setTogglingCategoria] = useState<string | null>(null);

  const [menuAberto, setMenuAberto] = useState<string | null>(null);
  const [menuCategoriaAberto, setMenuCategoriaAberto] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuCategoriaRef = useRef<HTMLDivElement>(null);

  const [modalVinculoItem, setModalVinculoItem] = useState(false);
  const [modalVinculoCategoria, setModalVinculoCategoria] = useState(false);
  const [modalPreco, setModalPreco] = useState(false);
  const [modalEditarCategoria, setModalEditarCategoria] = useState(false);
  const [modalExcluirCategoria, setModalExcluirCategoria] = useState(false);
  const [modalCriarCategoria, setModalCriarCategoria] = useState(false);
  const [modalAdicionarSabor, setModalAdicionarSabor] = useState(false);

  const [categoriaSelecionada, setCategoriaSelecionada] = useState<IFoodCategoriaDetalhe | null>(null);
  const [itemSelecionado, setItemSelecionado] = useState<IFoodItemDaCategoria | null>(null);
  const [itemPizzaCompleto, setItemPizzaCompleto] = useState<IFoodSalvarItemDto | null>(null);
  const [carregandoPizza, setCarregandoPizza] = useState<string | null>(null);

  const [salvandoPreco, setSalvandoPreco] = useState(false);
  const [erroPreco, setErroPreco] = useState<string | null>(null);
  const [salvandoCategoria, setSalvandoCategoria] = useState(false);
  const [erroCategoria, setErroCategoria] = useState<string | null>(null);
  const [excluindoCategoria, setExcluindoCategoria] = useState(false);

  const [complementosAbertos, setComplementosAbertos] = useState<Set<string>>(new Set());
  const [produtos, setProdutos] = useState<IProduto[]>([]);
  const [classes, setClasses] = useState<IClasseMaterial[]>([]);
  const [materias, setMaterias] = useState<IMateriaPrima[]>([]);

  // Adicione junto aos outros estados
  const [tamanhosPizzaAbertos, setTamanhosPizzaAbertos] = useState<Set<string>>(new Set());
  const [modalEditarSabor, setModalEditarSabor] = useState(false);
  const [modalRemoverSabor, setModalRemoverSabor] = useState(false);
  const [saborSelecionado, setSaborSelecionado] = useState<IFoodOpcaoResumo | null>(null);
  const [itemPizzaSelecionado, setItemPizzaSelecionado] = useState<IFoodItemDaCategoria | null>(null);
  const [removendoSabor, setRemovendoSabor] = useState(false);
  const [togglingStatusSabor, setTogglingStatusSabor] = useState<string | null>(null);
  const [menuSaborAberto, setMenuSaborAberto] = useState<string | null>(null);
  const [modalEditarPrecoTamanhos, setModalEditarPrecoTamanhos] = useState(false);
  const [tamanhosSelecionados, setTamanhosSelecionados] = useState<IFoodOpcaoResumo[]>([]);
  const [precosEditados, setPrecosEditados] = useState<Record<string, string>>({});
  const [salvandoPrecosTamanhos, setSalvandoPrecosTamanhos] = useState(false);


  const { control, handleSubmit, reset, setValue } = useForm<PrecoForm>();
  const { control: controlCat, handleSubmit: handleCat, reset: resetCat, setValue: setValueCat } =
    useForm<{ name: string }>();

  // ─── Helpers ────────────────────────────────────────────────────────────────

  function isPizza(cat: IFoodCategoriaDetalhe): boolean {
    return cat.template === "PIZZA";
  }
  function isCombo(item: IFoodItemDaCategoria): boolean {
    return item.type === "COMBO_V2";
  }
  function grupoSabores(item: IFoodItemDaCategoria) {
    return item.optionGroups?.find(g =>
      g.name?.toLowerCase() === "sabores" ||
      g.name?.toLowerCase().includes("sabor") ||
      g.name?.toLowerCase().includes("topping")
    ) ?? null;
  }

  function grupoTamanhos(item: IFoodItemDaCategoria) {
    return item.optionGroups?.find(g =>
      g.name?.toLowerCase() === "tamanhos" ||
      g.name?.toLowerCase().includes("tamanho") ||
      g.name?.toLowerCase().includes("size")
    ) ?? null;
  }

  function contarTamanhos(item: IFoodItemDaCategoria): number {
    const opts = grupoTamanhos(item)?.options;
    return Array.isArray(opts) ? opts.length : 0;
  }

  function saboresDoPizza(item: IFoodItemDaCategoria): IFoodOpcaoResumo[] {
    const opts = grupoSabores(item)?.options;
    return Array.isArray(opts) ? (opts as IFoodOpcaoResumo[]) : [];
  }

  function tamanhosDoPizza(item: IFoodItemDaCategoria): IFoodOpcaoResumo[] {
    const opts = grupoTamanhos(item)?.options;
    return Array.isArray(opts) ? (opts as IFoodOpcaoResumo[]) : [];
  }

  // Preço mínimo vem dos customizationModifiers do sabor (preço por tamanho)
  function precoMinimoSabor(
    sabor: IFoodOpcaoResumo,
    item: IFoodItemDaCategoria
  ): number | null {
    const modifiers = item.customizationModifiers?.filter(
      cm => cm.customizationOptionId === sabor.id && cm.status === "AVAILABLE"
    ) ?? [];
    const precos = modifiers.map(cm => cm.price).filter(p => p > 0);
    return precos.length ? Math.min(...precos) : null;
  }

  function precoMinimoPizza(item: IFoodItemDaCategoria): number | null {
    const tamanhos = tamanhosDoPizza(item);
    const precos = tamanhos.map(t => t.price?.value ?? 0).filter(v => v > 0);
    return precos.length ? Math.min(...precos) : null;
  }
  function toggleTamanhosPizza(itemId: string) {
    setTamanhosPizzaAbertos(prev => {
      const next = new Set(prev);
      next.has(itemId) ? next.delete(itemId) : next.add(itemId);
      return next;
    });
  }
  interface TamanhoPrecoRowProps {
    tamanho: IFoodOpcaoResumo;
    modifier: IFoodCustomizationModifier | null;
    empresaId: number;
    saborId: string;
    onSalvo: (novoPreco: number) => void;
    onStatusChange: (novoStatus: string) => void;
  }

  function TamanhoPrecoRow({
    tamanho, modifier, empresaId, saborId, onSalvo, onStatusChange
  }: TamanhoPrecoRowProps) {
    const [valor, setValor] = useState(String(modifier?.price ?? 0));
    const [editando, setEditando] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [togglingStatus, setTogglingStatus] = useState(false);

    async function onBlur() {
      const novoPreco = parseFloat(valor) || 0;
      const precoAtual = modifier?.price ?? 0;
      if (novoPreco === precoAtual) { setEditando(false); return; }

      setSalvando(true);
      try {
        const result = await ifoodCatalogService.editarPrecoOpcao(empresaId, {
          optionId: saborId,
          price: null,
          parentCustomizationOptionId: tamanho.id,
          priceByCatalog: [
            { value: novoPreco, originalValue: null, catalogContext: "DEFAULT" },
            { value: novoPreco, originalValue: null, catalogContext: "WHITELABEL" },
          ],
        });
        if (result.sucesso) {
          onSalvo(novoPreco);
        } else {
          setValor(String(precoAtual));
          toast.error(result.erro ?? "Erro ao salvar preço.");
        }
      } finally {
        setSalvando(false);
        setEditando(false);
      }
    }

    async function toggleStatus() {
      if (!modifier) return;
      setTogglingStatus(true);
      try {
        const novoStatus = modifier.status === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE";
        const result = await ifoodCatalogService.editarStatusOpcao(empresaId, {
          optionId: saborId,
          status: null,
          parentCustomizationOptionId: tamanho.id,
          statusByCatalog: [
            { status: novoStatus, catalogContext: "DEFAULT" },
            { status: novoStatus, catalogContext: "WHITELABEL" },
          ],
        });
        if (result.sucesso) {
          onStatusChange(novoStatus);
        } else {
          toast.error(result.erro ?? "Erro ao alterar status.");
        }
      } finally {
        setTogglingStatus(false);
      }
    }

    return (
      <div className={styles.tamanhoRow}>
        <span className={styles.tamanhoNome}>{tamanho.name}</span>

        <div className={styles.tamanhoPrecoInputWrapper}>
          <span className={styles.tamanhoPrecoPrefix}>R$</span>
          {editando || salvando ? (
            <input
              type="number" min={0} step={0.01}
              className={styles.tamanhoPrecoInput}
              value={valor}
              autoFocus
              disabled={salvando}
              onChange={e => setValor(e.target.value)}
              onBlur={onBlur}
              onKeyDown={e => e.key === "Enter" && onBlur()}
            />
          ) : (
            <span className={styles.tamanhoPrecoValor}
              onClick={() => setEditando(true)}
              title="Clique para editar">
              {parseFloat(valor) > 0
                ? parseFloat(valor).toFixed(2).replace(".", ",")
                : "—"
              }
            </span>
          )}
          {salvando && <span className={styles.tamanhoSalvando}>...</span>}
        </div>

        {/* Botão pausar/ativar no lugar do badge */}
        <button
          className={styles.iconBtn}
          disabled={togglingStatus || !modifier}
          title={modifier?.status === "AVAILABLE" ? "Pausar neste tamanho" : "Ativar neste tamanho"}
          onClick={toggleStatus}>
          {modifier?.status === "AVAILABLE"
            ? <FiPause size={13} />
            : <FiPlay size={13} />
          }
        </button>
      </div>
    );
  }

  async function toggleStatusSabor(item: IFoodItemDaCategoria, sabor: IFoodOpcaoResumo) {
    setTogglingStatusSabor(sabor.id);
    setMenuSaborAberto(null);
    try {
      const novoStatus = sabor.status === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE";
      const result = await ifoodCatalogService.editarStatusOpcao(empresaId, {
        optionId: sabor.id,
        status: novoStatus,
        parentCustomizationOptionId: null,
        statusByCatalog: null,
      });
      if (result.sucesso) {
        atualizarSaborNaLista(item.id, sabor.id, { status: novoStatus });
      } else {
        toast.error(result.erro ?? "Erro ao alterar status do sabor.");
      }
    } finally {
      setTogglingStatusSabor(null);
    }
  }

  function atualizarSaborNaLista(
    itemId: string,
    saborId: string,
    patch: Partial<IFoodOpcaoResumo>
  ) {
    setCategorias(prev => prev.map(cat => ({
      ...cat,
      items: cat.items?.map(item => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          optionGroups: item.optionGroups?.map(g => {
            if (!g.name?.toLowerCase().includes("sabor") &&
              !g.name?.toLowerCase().includes("topping")) return g;
            return {
              ...g,
              options: (g.options as IFoodOpcaoResumo[])?.map(o =>
                o.id === saborId ? { ...o, ...patch } : o
              ),
            };
          }),
        };
      }),
    })));
  }

  function abrirEditarPrecoTamanhos(item: IFoodItemDaCategoria) {
    const tamanhos = tamanhosDoPizza(item);
    setTamanhosSelecionados(tamanhos);
    const precos: Record<string, string> = {};
    tamanhos.forEach(t => { precos[t.id] = String(t.price?.value ?? 0); });
    setPrecosEditados(precos);
    setItemPizzaSelecionado(item);
    setModalEditarPrecoTamanhos(true);
  }

  async function onSalvarPrecosTamanhos() {
    setSalvandoPrecosTamanhos(true);
    try {
      for (const tamanho of tamanhosSelecionados) {
        const novoValor = parseFloat(precosEditados[tamanho.id] ?? "0") || 0;
        if (novoValor === (tamanho.price?.value ?? 0)) continue;
        await ifoodCatalogService.editarPrecoOpcao(empresaId, {
          optionId: tamanho.id,
          price: { value: novoValor, originalValue: null },
          parentCustomizationOptionId: null,
          priceByCatalog: null,
        });
      }
      setModalEditarPrecoTamanhos(false);
      // Recarrega a categoria para refletir os novos preços
      if (catalogoAtivo) await carregarCategorias(catalogoAtivo);
    } finally {
      setSalvandoPrecosTamanhos(false);
    }
  }

  async function onRemoverSabor() {
    if (!saborSelecionado || !itemPizzaSelecionado) return;
    setRemovendoSabor(true);
    try {
      // Sabor é uma option — usa excluirOpcao com o productId da opção
      const result = await ifoodCatalogService.excluirOpcao(
        empresaId,
        // grupoId do TOPPING
        itemPizzaSelecionado.optionGroups?.find(g =>
          g.name?.toLowerCase().includes("sabor") ||
          g.name?.toLowerCase().includes("topping")
        )?.id ?? "",
        saborSelecionado.productId ?? "",
      );
      if (result.sucesso) {
        atualizarSaborNaLista(itemPizzaSelecionado.id, saborSelecionado.id, {
          status: "UNAVAILABLE",
        });
        setModalRemoverSabor(false);
      } else {
        toast.error(result.erro ?? "Erro ao remover sabor.");
      }
    } finally {
      setRemovendoSabor(false);
    }
  }


  async function abrirAdicionarSabor(item: IFoodItemDaCategoria) {
    setCarregandoPizza(item.id);
    try {
      const result = await ifoodCatalogService.obterItemFlat(empresaId, item.id);
      if (result.sucesso) {
        setItemPizzaCompleto(result.dados);
        setModalAdicionarSabor(true);
      } else {
        toast.error("Erro ao carregar dados da pizza.");
      }
    } finally {
      setCarregandoPizza(null);
    }
  }

  function onSaborSalvo(itemAtualizado: IFoodSalvarItemDto) {
    setCategorias(prev => prev.map(cat => ({
      ...cat,
      items: cat.items?.map(item => {
        if (item.id !== itemAtualizado.item.id) return item;

        const grupos: IFoodItemDaCategoria["optionGroups"] = itemAtualizado.optionGroups.map(og => ({
          id: og.id,
          name: og.name,
          externalCode: og.externalCode ?? undefined,
          status: og.status,
          // options agora é array — mapeamos cada optionId para uma OpcaoResumo
          options: og.optionIds.map(optId => {
            const opt = itemAtualizado.options.find(o => o.id === optId);
            const prod = opt ? itemAtualizado.products.find(p => p.id === opt.productId) : null;
            return {
              id: optId,
              name: prod?.name ?? "",
              description: prod?.description ?? undefined,
              externalCode: opt?.externalCode ?? undefined,
              productId: opt?.productId ?? "",
              status: opt?.status ?? "AVAILABLE",
              imagePath: prod?.imagePath ?? undefined,
              price: opt?.price ?? { value: 0 },
              ean: prod?.ean ?? undefined,
            };
          }),
        }));

        return { ...item, optionGroups: grupos };
      }),
    })));
  }

  function onCategoriaCriada(categoria: IFoodCategoriaResumo) {
    // IFoodCategoriaResumo não tem items — adicionamos vazio para o estado local
    setCategorias(prev => [...prev, {
      ...categoria,
      items: [],
      pizza: null,
    }]);
    setCategoriasAbertas(prev => new Set([...prev, categoria.id]));
  }

  function toggleComplementos(itemId: string) {
    setComplementosAbertos(prev => {
      const next = new Set(prev);
      next.has(itemId) ? next.delete(itemId) : next.add(itemId);
      return next;
    });
  }

  function onGruposChange(itemId: string, grupos: IFoodGrupoComplemento[]) {
    setCategorias(prev => prev.map(cat => ({
      ...cat,
      items: cat.items?.map(i =>
        i.id === itemId ? { ...i, optionGroups: grupos as IFoodItemDaCategoria["optionGroups"] } : i
      ),
    })));
  }

  function atualizarItemNaLista(itemId: string, patch: Partial<IFoodItemDaCategoria>) {
    setCategorias(prev => prev.map(cat => ({
      ...cat,
      items: cat.items?.map(i => i.id === itemId ? { ...i, ...patch } : i),
    })));
  }

  function nomeProdutoVinculado(externalCode?: string | null): string | null {
    const v = parseVinculo(externalCode);
    if (!v || v.tipo !== "produto") return null;
    return produtos.find(p => p.id === v.id)?.nome ?? `Produto #${v.id}`;
  }

  function nomeClasseVinculada(externalCode?: string | null): string | null {
    const v = parseVinculo(externalCode);
    if (!v || v.tipo !== "classe") return null;
    return classes.find(c => c.id === v.id)?.nomeClasse ?? `Classe #${v.id}`;
  }

  // ─── Ações de categoria ──────────────────────────────────────────────────────

  async function toggleStatusCategoria(cat: IFoodCategoriaDetalhe) {
    setTogglingCategoria(cat.id);
    setMenuCategoriaAberto(null);
    try {
      const novoStatus = cat.status === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE";
      const result = await ifoodCatalogService.editarCategoria(
        empresaId, catalogoAtivo!, cat.id,
        { status: novoStatus }
      );
      if (result.sucesso) {
        setCategorias(prev => prev.map(c =>
          c.id === cat.id ? { ...c, status: novoStatus } : c
        ));
      } else {
        toast.error(result.erro ?? "Erro ao alterar status da categoria.");
      }
    } finally {
      setTogglingCategoria(null);
    }
  }

  function abrirEditarCategoria(cat: IFoodCategoriaDetalhe) {
    if (cat.template === "PIZZA") {
      router.push(`/ifood/catalogo/pizza?catalogId=${catalogoAtivo}&categoryId=${cat.id}`);
      return;
    }
    setCategoriaSelecionada(cat);
    setValueCat("name", cat.name);
    setErroCategoria(null);
    setMenuCategoriaAberto(null);
    setModalEditarCategoria(true);
  }

  async function onSalvarCategoria(form: { name: string }) {
    if (!categoriaSelecionada) return;
    setSalvandoCategoria(true);
    setErroCategoria(null);
    try {

      // Duplicar: id vazio = criação
      if (!categoriaSelecionada.id) {
        const result = await ifoodCatalogService.criarCategoria(
          empresaId, catalogoAtivo!,
          {
            name: form.name,
            status: categoriaSelecionada.status,
            template: categoriaSelecionada.template ?? "DEFAULT",
            index: categorias.length,
          }
        );
        if (result.sucesso) {
          // onCategoriaCriada espera IFoodCategoriaResumo — passamos direto o result.dados
          onCategoriaCriada(result.dados);
          setModalEditarCategoria(false);
          resetCat();
        } else {
          setErroCategoria(result.erro);
        }
        return;
      }

      // Edição normal
      const result = await ifoodCatalogService.editarCategoria(
        empresaId, catalogoAtivo!, categoriaSelecionada.id,
        { name: form.name }
      );
      if (result.sucesso) {
        setCategorias(prev => prev.map(c =>
          c.id === categoriaSelecionada.id ? { ...c, name: form.name } : c
        ));
        setModalEditarCategoria(false);
        resetCat();
      } else {
        setErroCategoria(result.erro);
      }

    } finally {
      setSalvandoCategoria(false);
    }
  }

  function abrirExcluirCategoria(cat: IFoodCategoriaDetalhe) {
    setCategoriaSelecionada(cat);
    setMenuCategoriaAberto(null);
    setModalExcluirCategoria(true);
  }

  async function onExcluirCategoria() {
    if (!categoriaSelecionada) return;
    setExcluindoCategoria(true);
    try {
      const result = await ifoodCatalogService.excluirCategoria(
        empresaId, categoriaSelecionada.id
      );
      if (result.sucesso) {
        setCategorias(prev => prev.filter(c => c.id !== categoriaSelecionada.id));
        setModalExcluirCategoria(false);
      } else {
        toast.error(result.erro ?? "Erro ao excluir categoria.");
      }
    } finally {
      setExcluindoCategoria(false);
    }
  }

  // ─── Ações de item ───────────────────────────────────────────────────────────

  async function toggleStatusItem(item: IFoodItemDaCategoria) {
    setTogglingStatus(item.id);
    setMenuAberto(null);
    try {
      const novoStatus = item.status === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE";
      const result = await ifoodCatalogService.editarItem(empresaId, item.id, {
        status: novoStatus,
      });
      if (result.sucesso) {
        atualizarItemNaLista(item.id, { status: novoStatus });
      } else {
        toast.error(humanizarErro(result.erro));
      }
    } finally {
      setTogglingStatus(null);
    }
  }

  function abrirModalPreco(item: IFoodItemDaCategoria) {
    setItemSelecionado(item);
    setValue("value", String(item.price.value));
    setValue("originalValue", String(item.price.originalValue ?? ""));
    setErroPreco(null);
    setModalPreco(true);
    setMenuAberto(null);
  }

  async function onSalvarPreco(form: PrecoForm) {
    if (!itemSelecionado) return;
    setSalvandoPreco(true);
    setErroPreco(null);
    try {
      const novoPreco = {
        value: parseFloat(form.value),
        originalValue: form.originalValue ? parseFloat(form.originalValue) : undefined,
      };
      const result = await ifoodCatalogService.editarItem(empresaId, itemSelecionado.id, {
        price: novoPreco,
      });
      if (result.sucesso) {
        atualizarItemNaLista(itemSelecionado.id, { price: novoPreco });
        setModalPreco(false);
        reset();
      } else {
        setErroPreco(result.erro);
      }
    } finally {
      setSalvandoPreco(false);
    }
  }

  async function onVinculadoItem(itemId: string, externalCode: string) {
    const result = await ifoodCatalogService.editarItem(empresaId, itemId, {
      externalCode,
    });
    if (result.sucesso) {
      atualizarItemNaLista(itemId, { externalCode });
    } else {
      toast.error(result.erro ?? "Erro ao vincular item.");
    }
  }

  async function onVinculadoCategoria(categoria: IFoodCategoriaDetalhe, externalCode: string) {
    const result = await ifoodCatalogService.editarCategoria(
      empresaId, catalogoAtivo!, categoria.id,
      { externalCode: externalCode || null }  // string vazia → null
    );
    if (result.sucesso) {
      setCategorias(prev => prev.map(c =>
        c.id === categoria.id ? { ...c, externalCode: externalCode || null } : c
      ));
    } else {
      toast.error(result.erro ?? "Erro ao vincular categoria.");
    }
  }

  // ─── Carregamento de dados ───────────────────────────────────────────────────

  async function carregarEmpresaId() {
    const user = await getUser();
    if (user) setEmpresaId(user.empresaSelecionada);
  }

  async function carregarCatalogos() {
    try {
      const result = await ifoodCatalogService.listarCatalogos(empresaId);
      if (result.sucesso) {
        setCatalogos(result.dados);
        const def = result.dados.find(c => c.context.includes("DEFAULT"));
        setCatalogoAtivo(def?.catalogId ?? result.dados[0]?.catalogId ?? null);
      }
    } catch { }
  }

  async function carregarCategorias(catalogId: string) {
    setLoadingCategorias(true);
    try {
      const result = await ifoodCatalogService.listarCategorias(empresaId, catalogId, true);
      if (result.sucesso) {
        setCategorias(result.dados);
        setCategoriasAbertas(new Set(result.dados.map(c => c.id)));
        result.dados
          .filter(cat => cat.template !== "PIZZA" && cat.items && cat.items.length > 0)
          .forEach(cat => enriquecerStatusECategoria(cat.id));
      }
    } finally {
      setLoadingCategorias(false);
    }
  }

  /**
   * O endpoint em bloco (includeItems=true) retorna o status "cadastral" do item,
   * que nem sempre reflete se ele está pausado de verdade — isso fica em
   * contextModifiers[catalogContext=DEFAULT].status no endpoint por categoria.
   * Busca isso em paralelo e corrige o status/type de cada item já renderizado.
   */
  async function enriquecerStatusECategoria(categoriaId: string) {
    try {
      const result = await ifoodCatalogService.listarItensDaCategoria(empresaId, categoriaId);
      if (!result.sucesso) return;
      const { items } = result.dados;

      setCategorias(prev => prev.map(cat => {
        if (cat.id !== categoriaId) return cat;
        return {
          ...cat,
          items: cat.items?.map(item => {
            const flat = items.find(i => i.id === item.id);
            if (!flat) return item;
            const statusReal = flat.contextModifiers?.find(
              cm => cm.catalogContext === "DEFAULT"
            )?.status ?? flat.status;
            return { ...item, status: statusReal, type: flat.type };
          }),
        };
      }));
    } catch { }
  }

  async function carregarProdutos() {
    try {
      const result = await produtoService.getAll(empresaId, true);
      if (result) setProdutos(result);
    } catch { }
  }

  async function carregarClasses() {
    try {
      const result = await classeMaterialService.getAll(empresaId);
      if (result) setClasses(result);
    } catch { }
  }

  async function carregarMaterias() {
    try {
      const result = await materiaPrimaService.getAll(empresaId);
      if (result) setMaterias(result);
    } catch { }
  }

  // ─── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => { carregarEmpresaId(); }, []);
  useEffect(() => { if (empresaId > 0) carregarCatalogos(); }, [empresaId]);
  useEffect(() => { if (catalogoAtivo) carregarCategorias(catalogoAtivo); }, [catalogoAtivo]);
  useEffect(() => {
    if (empresaId > 0) {
      carregarProdutos();
      carregarClasses();
      carregarMaterias();
    }
  }, [empresaId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuAberto(null);
      if (menuCategoriaRef.current && !menuCategoriaRef.current.contains(e.target as Node))
        setMenuCategoriaAberto(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ─── Filtragem ───────────────────────────────────────────────────────────────

  const categoriasFiltradas = categorias
    .filter(cat => categoriaFiltro === "todas" || cat.id === categoriaFiltro)
    .map(cat => ({
      ...cat,
      items: cat.items?.filter(item =>
        item.name.toLowerCase().includes(busca.toLowerCase()) ||
        item.externalCode?.toLowerCase().includes(busca.toLowerCase())
      ),
    }))
    .filter(cat => busca === "" || (cat.items && cat.items.length > 0));

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className={styles.container}>

      {/* Header */}
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={() => router.push("/ifood")}>
          <FiArrowLeft size={16} />
        </button>
        <h1 className={styles.titulo}>Catálogo</h1>
      </div>

      {/* Tabs de catálogo */}
      {catalogos.length > 1 && (
        <div className={styles.tabs}>
          {catalogos.map(c => (
            <button key={c.catalogId}
              className={`${styles.tab} ${catalogoAtivo === c.catalogId ? styles.tabAtiva : ""}`}
              onClick={() => setCatalogoAtivo(c.catalogId)}>
              {c.context.join(" / ")}
            </button>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className={styles.filtros}>
        <div className={styles.buscaWrapper}>
          <FiSearch size={14} className={styles.buscaIcon} />
          <input className={styles.buscaInput} placeholder="Buscar um item"
            value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
        <select className={styles.categoriaSelect} value={categoriaFiltro}
          onChange={e => setCategoriaFiltro(e.target.value)}>
          <option value="todas">Selecionar categoria</option>
          {categorias.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <CustomButton typeButton="outline-main" size="sm"
          onClick={() => setModalCriarCategoria(true)}>
          <FiPlus size={13} /> Adicionar categoria
        </CustomButton>
        <CustomButton typeButton="outline-main" size="sm"
          onClick={() => router.push("/ifood/catalogo/produto?catalogId=" + catalogoAtivo)}>
          <FiPlus size={13} /> Adicionar Produto
        </CustomButton>
      </div>

      {/* Conteúdo */}
      {loadingCategorias ? (
        <p className={styles.semDados}>Carregando catálogo...</p>
      ) : categoriasFiltradas.length === 0 ? (
        <p className={styles.semDados}>Nenhum item encontrado.</p>
      ) : (
        <div className={styles.categoriasList}>
          {categoriasFiltradas.map(cat => (
            <div key={cat.id} className={styles.categoriaCard}>

              {/* Header da categoria */}
              <div className={styles.categoriaHeader}>
                <div className={styles.categoriaHeaderLeft}>
                  <button className={styles.categoriaNomeBtn} onClick={() => toggleCategoria(cat.id)}>
                    {isPizza(cat)
                      ? <span className={styles.pizzaIcon}>🍕</span>
                      : <FiEdit2 size={13} className={styles.editIcon} />
                    }
                    <span className={styles.categoriaNome}>{cat.name}</span>
                    <span className={styles.categoriaCount}>
                      ({cat.items?.length ?? 0}{" "}
                      {isPizza(cat)
                        ? cat.items?.length === 1 ? "sabor" : "sabores"
                        : cat.items?.length === 1 ? "item" : "itens"
                      })
                    </span>
                    {nomeClasseVinculada(cat.externalCode) && (
                      <span className={styles.tagVinculadoCategoria}>
                        KRD: {nomeClasseVinculada(cat.externalCode)}
                      </span>
                    )}
                  </button>
                  <button className={styles.iconBtn} title="Vincular classe"
                    onClick={() => { setCategoriaSelecionada(cat); setModalVinculoCategoria(true); }}>
                    <FiLink size={14} />
                  </button>
                </div>

                <div className={styles.categoriaHeaderRight}>
                  {isPizza(cat) ? (
                    <CustomButton typeButton="outline-main" size="sm"
                      loading={!!carregandoPizza}
                      onClick={() => {
                        const primeiroPizza = cat.items?.[0];
                        if (primeiroPizza) abrirAdicionarSabor(primeiroPizza);
                      }}>
                      <FiPlus size={13} /> Adicionar sabor
                    </CustomButton>
                  ) : (
                    <>
                      <CustomButton typeButton="outline-main" size="sm"
                        onClick={() => router.push(
                          `/ifood/catalogo/combos?catalogId=${catalogoAtivo}&categoryId=${cat.id}`
                        )}>
                        Criar combo
                      </CustomButton>
                      <CustomButton typeButton="outline-main" size="sm" onClick={() => { }}>
                        Adicionar oferta
                      </CustomButton>
                    </>
                  )}

                  <button className={styles.iconBtn}
                    disabled={togglingCategoria === cat.id}
                    title={cat.status === "AVAILABLE" ? "Pausar categoria" : "Ativar categoria"}
                    onClick={() => toggleStatusCategoria(cat)}>
                    {cat.status === "AVAILABLE" ? <FiPause size={14} /> : <FiPlay size={14} />}
                  </button>

                  <div className={styles.menuWrapper}
                    ref={menuCategoriaAberto === cat.id ? menuCategoriaRef : null}>
                    <button className={styles.iconBtn}
                      onClick={() => setMenuCategoriaAberto(
                        menuCategoriaAberto === cat.id ? null : cat.id
                      )}>
                      <FiMoreVertical size={14} />
                    </button>
                    {menuCategoriaAberto === cat.id && (
                      <div className={styles.dropdown}>
                        <button className={styles.dropdownItem}
                          onClick={() => abrirEditarCategoria(cat)}>
                          <FiEdit2 size={13} /> Editar
                        </button>
                        <button className={styles.dropdownItem}
                          onClick={() => {
                            setCategoriaSelecionada({ ...cat, id: "" });
                            setValueCat("name", `${cat.name} (cópia)`);
                            setMenuCategoriaAberto(null);
                            setModalEditarCategoria(true);
                          }}>
                          <FiCopy size={13} /> Duplicar
                        </button>
                        <button className={`${styles.dropdownItem} ${styles.dropdownItemPerigo}`}
                          onClick={() => abrirExcluirCategoria(cat)}>
                          <FiTrash2 size={13} /> Remover
                        </button>
                      </div>
                    )}
                  </div>

                  <button className={styles.iconBtn} onClick={() => toggleCategoria(cat.id)}>
                    {categoriasAbertas.has(cat.id)
                      ? <FiChevronUp size={16} />
                      : <FiChevronDown size={16} />
                    }
                  </button>
                </div>
              </div>

              {/* Itens */}
              {categoriasAbertas.has(cat.id) && (
                <div className={styles.itensList}>
                  {!cat.items || cat.items.length === 0 ? (
                    isPizza(cat) ? (
                      <div className={styles.pizzaVaziaBox}>
                        <p className={styles.semItens}>Nenhum sabor cadastrado.</p>
                        <CustomButton typeButton="outline-main" size="sm"
                          loading={!!carregandoPizza}
                          onClick={() => { }}>
                          <FiPlus size={13} /> Adicionar sabor
                        </CustomButton>
                      </div>
                    ) : (
                      <p className={styles.semItens}>Nenhum item nesta categoria.</p>
                    )
                  ) : (
                    cat.items.map(item => (
                      <div key={item.id}>
                        {isPizza(cat) ? (
                          <div className={styles.pizzaItemWrapper}>
                            {!cat.items || cat.items.length === 0 ? (
                              <p className={styles.semItens} style={{ padding: "14px 18px" }}>
                                Nenhum sabor cadastrado ainda.
                              </p>
                            ) : (
                              cat.items.map(item => (
                                <div key={item.id}>
                                  {saboresDoPizza(item).map(sabor => (
                                    <div key={sabor.id}>
                                      {/* ── Linha do sabor ── */}
                                      <div className={`${styles.saborRow} ${sabor.status !== "AVAILABLE" ? styles.itemPausado : ""}`}>
                                        {sabor.imagePath ? (
                                          <img src={sabor.imagePath} alt={sabor.name} className={styles.saborImagem} />
                                        ) : (
                                          <div className={styles.saborImagemPlaceholder} />
                                        )}

                                        <div className={styles.itemInfo}>
                                          <span className={styles.itemNome}>{sabor.name}</span>
                                          {sabor.description && (
                                            <span className={styles.itemDesc}>{sabor.description}</span>
                                          )}
                                        </div>

                                        <div className={styles.saborAcoes}>
                                          {/* Chip tamanhos — abre logo abaixo deste sabor */}
                                          {contarTamanhos(item) > 0 && (
                                            <button
                                              className={`${styles.chipTamanhos} ${tamanhosPizzaAbertos.has(`${item.id}_${sabor.id}`) ? styles.chipTamanhosAtivo : ""}`}
                                              onClick={() => {
                                                const key = `${item.id}_${sabor.id}`;
                                                setTamanhosPizzaAbertos(prev => {
                                                  const next = new Set(prev);
                                                  next.has(key) ? next.delete(key) : next.add(key);
                                                  return next;
                                                });
                                              }}>
                                              Tamanhos <strong>{contarTamanhos(item)}</strong>
                                            </button>
                                          )}

                                          {/* Preço mínimo do sabor via customizationModifiers */}
                                          {(() => {
                                            const preco = precoMinimoSabor(sabor, item);
                                            return preco !== null ? (
                                              <div className={styles.precosWrapper}>
                                                <span className={styles.precoLabel}>À partir de</span>
                                                <span className={styles.precoAtual}>
                                                  R$ {preco.toFixed(2).replace(".", ",")}
                                                </span>
                                              </div>
                                            ) : (
                                              <div className={styles.precosWrapper}>
                                                <span className={styles.precoLabel}>—</span>
                                              </div>
                                            );
                                          })()}

                                          <button className={styles.iconBtn}
                                            disabled={togglingStatusSabor === sabor.id}
                                            title={sabor.status === "AVAILABLE" ? "Pausar sabor" : "Ativar sabor"}
                                            onClick={() => toggleStatusSabor(item, sabor)}>
                                            {sabor.status === "AVAILABLE" ? <FiPause size={14} /> : <FiPlay size={14} />}
                                          </button>

                                          <div className={styles.menuWrapper}>
                                            <button className={styles.iconBtn}
                                              onClick={() => setMenuSaborAberto(
                                                menuSaborAberto === sabor.id ? null : sabor.id
                                              )}>
                                              <FiMoreVertical size={14} />
                                            </button>
                                            {menuSaborAberto === sabor.id && (
                                              <div className={styles.dropdown}>
                                                <button className={styles.dropdownItem}
                                                  onClick={async () => {
                                                    setMenuSaborAberto(null);
                                                    setCarregandoPizza(item.id);
                                                    try {
                                                      const r = await ifoodCatalogService.obterItemFlat(empresaId, item.id);
                                                      if (r.sucesso) {
                                                        setItemPizzaCompleto(r.dados);
                                                        // Passa o saborId para o modal saber qual editar
                                                        setSaborSelecionado(sabor);
                                                        setModalAdicionarSabor(true);
                                                      }
                                                    } finally {
                                                      setCarregandoPizza(null);
                                                    }
                                                  }}>
                                                  <FiEdit2 size={13} /> Editar sabor
                                                </button>
                                                <button className={styles.dropdownItem}
                                                  onClick={() => {
                                                    setMenuSaborAberto(null);
                                                    toast.info("Em breve: duplicar sabor.");
                                                  }}>
                                                  <FiCopy size={13} /> Duplicar sabor
                                                </button>
                                                <button className={`${styles.dropdownItem} ${styles.dropdownItemPerigo}`}
                                                  onClick={() => {
                                                    setSaborSelecionado(sabor);
                                                    setItemPizzaSelecionado(item);
                                                    setMenuSaborAberto(null);
                                                    setModalRemoverSabor(true);
                                                  }}>
                                                  <FiTrash2 size={13} /> Remover sabor
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {/* ── Tamanhos expandidos — logo abaixo do sabor ── */}
                                      {tamanhosPizzaAbertos.has(`${item.id}_${sabor.id}`) && (
                                        <div className={styles.tamanhosExpandidos}>
                                          <div className={styles.tamanhosHeader}>
                                            <span className={styles.tamanhosTitle}>
                                              Preços por tamanho — {sabor.name}
                                            </span>
                                          </div>
                                          {tamanhosDoPizza(item).map(tamanho => {
                                            // Busca o customizationModifier deste sabor × tamanho
                                            const modifier = item.customizationModifiers?.find(
                                              cm => cm.customizationOptionId === sabor.id &&
                                                cm.parentCustomizationOptionId === tamanho.id
                                            );
                                            return (
                                              <TamanhoPrecoRow
                                                key={tamanho.id}
                                                tamanho={tamanho}
                                                modifier={modifier ?? null}
                                                empresaId={empresaId}
                                                saborId={sabor.id}
                                                onSalvo={(novoPreco) => {
                                                  setCategorias(prev => prev.map(cat => ({
                                                    ...cat,
                                                    items: cat.items?.map(i => {
                                                      if (i.id !== item.id) return i;
                                                      return {
                                                        ...i,
                                                        customizationModifiers: i.customizationModifiers?.map(cm =>
                                                          cm.customizationOptionId === sabor.id &&
                                                            cm.parentCustomizationOptionId === tamanho.id
                                                            ? { ...cm, price: novoPreco }
                                                            : cm
                                                        ),
                                                      };
                                                    }),
                                                  })));
                                                }}
                                                onStatusChange={(novoStatus) => {
                                                  setCategorias(prev => prev.map(cat => ({
                                                    ...cat,
                                                    items: cat.items?.map(i => {
                                                      if (i.id !== item.id) return i;
                                                      return {
                                                        ...i,
                                                        customizationModifiers: i.customizationModifiers?.map(cm =>
                                                          cm.customizationOptionId === sabor.id &&
                                                            cm.parentCustomizationOptionId === tamanho.id
                                                            ? { ...cm, status: novoStatus }
                                                            : cm
                                                        ),
                                                      };
                                                    }),
                                                  })));
                                                }}
                                              />
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ))
                            )}
                          </div>
                        ) : (

                          /* ═══ CARD PADRÃO ═══ */
                          <>
                            <div className={`${styles.itemRow} ${item.status !== "AVAILABLE" ? styles.itemPausado : ""}`}>
                              {item.imagePath ? (
                                <img src={item.imagePath} alt={item.name} className={styles.itemImagem} />
                              ) : (
                                <div className={styles.itemImagemPlaceholder} />
                              )}
                              <div className={styles.itemInfo}>
                                <span className={styles.itemNome}>{item.name}</span>
                                {nomeProdutoVinculado(item.externalCode) && (
                                  <span className={styles.tagVinculado}>
                                    KRD: {nomeProdutoVinculado(item.externalCode)}
                                  </span>
                                )}
                                <div className={styles.itemTags}>
                                  <span className={styles.tagOferta}>
                                    {isCombo(item) ? "Combo" : "Oferta Simples"}
                                  </span>
                                  {item.description && (
                                    <span className={styles.itemDesc}>{item.description}</span>
                                  )}
                                </div>
                              </div>
                              <div className={styles.itemAcoes}>
                                {item.hasOptionGroups && (
                                  <button
                                    className={`${styles.btnComplementos} ${complementosAbertos.has(item.id) ? styles.btnComplementosAtivo : ""}`}
                                    onClick={() => toggleComplementos(item.id)}>
                                    Complementos
                                    <span className={styles.complementosBadge}>
                                      {item.optionGroups?.length ?? 0}
                                    </span>
                                  </button>
                                )}
                                <button className={styles.btnEstoque}>Estoque</button>
                                <div className={styles.precosWrapper}>
                                  {item.price.originalValue != null &&
                                    item.price.originalValue > item.price.value && (
                                      <span className={styles.precoOriginal}>
                                        R$ {item.price.originalValue.toFixed(2).replace(".", ",")}
                                      </span>
                                    )}
                                  <span className={styles.precoAtual}>
                                    R$ {item.price.value.toFixed(2).replace(".", ",")}
                                  </span>
                                </div>
                                <button className={styles.iconBtn}
                                  onClick={() => toggleStatusItem(item)}
                                  disabled={togglingStatus === item.id}>
                                  {item.status === "AVAILABLE" ? <FiPause size={15} /> : <FiPlay size={15} />}
                                </button>
                                <div className={styles.menuWrapper}
                                  ref={menuAberto === item.id ? menuRef : null}>
                                  <button className={styles.iconBtn}
                                    onClick={() => setMenuAberto(menuAberto === item.id ? null : item.id)}>
                                    <FiMoreVertical size={15} />
                                  </button>
                                  {menuAberto === item.id && (
                                    <div className={styles.dropdown}>
                                      <button className={styles.dropdownItem}
                                        onClick={() => {
                                          setItemSelecionado(item);
                                          setModalVinculoItem(true);
                                          setMenuAberto(null);
                                        }}>
                                        <FiLink size={13} /> Vincular produto
                                      </button>
                                      <button className={styles.dropdownItem}
                                        onClick={() => {
                                          const rota = isCombo(item) ? "combos" : "produto";
                                          router.push(`/ifood/catalogo/${rota}?catalogId=${catalogoAtivo}&itemId=${item.id}`);
                                          setMenuAberto(null);
                                        }}>
                                        <FiEdit2 size={13} /> Editar item
                                      </button>
                                      <button className={styles.dropdownItem}
                                        onClick={() => toggleStatusItem(item)}>
                                        {item.status === "AVAILABLE"
                                          ? <><FiPause size={13} /> Pausar item</>
                                          : <><FiPlay size={13} /> Ativar item</>
                                        }
                                      </button>
                                      <button className={styles.dropdownItem}
                                        onClick={() => abrirModalPreco(item)}>
                                        <FiEdit2 size={13} /> Editar preço
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {complementosAbertos.has(item.id) &&
                              item.optionGroups && item.optionGroups.length > 0 && (
                                <CardComplementos
                                  productId={item.productId}
                                  empresaId={empresaId}
                                  grupos={item.optionGroups as unknown as IFoodGrupoComplemento[]}
                                  materias={materias}
                                  onGruposChange={grupos => onGruposChange(item.id, grupos)}
                                />
                              )}
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Modais ── */}
      {/* ── Modal editar preços dos tamanhos ── */}
      <BaseModal isOpen={modalEditarPrecoTamanhos}
        title="Editar preços por tamanho"
        setClose={() => setModalEditarPrecoTamanhos(false)}
        width="440px">
        <div className={styles.form}>
          <p className={styles.formDesc}>
            Defina o preço base de cada tamanho. Os sabores herdam esses valores como padrão.
          </p>
          {tamanhosSelecionados.map(t => (
            <div key={t.id} className={styles.precoRow}>
              <span className={styles.tamanhoNome} style={{ flex: 1 }}>{t.name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>R$</span>
                <input
                  type="number" min={0} step={0.01}
                  className={styles.inputSm}
                  value={precosEditados[t.id] ?? ""}
                  placeholder="0,00"
                  onChange={e => setPrecosEditados(p => ({ ...p, [t.id]: e.target.value }))}
                />
              </div>
            </div>
          ))}
          <div className={styles.formActions}>
            <CustomButton typeButton="outline-main"
              onClick={() => setModalEditarPrecoTamanhos(false)}>
              Cancelar
            </CustomButton>
            <CustomButton typeButton="main" loading={salvandoPrecosTamanhos}
              onClick={onSalvarPrecosTamanhos}>
              Salvar
            </CustomButton>
          </div>
        </div>
      </BaseModal>

      {/* ── Modal remover sabor ── */}
      <BaseModal isOpen={modalRemoverSabor} title="Remover sabor"
        setClose={() => setModalRemoverSabor(false)} width="400px">
        <div className={styles.form}>
          <p className={styles.formDesc}>
            Tem certeza que deseja remover o sabor{" "}
            <strong>{saborSelecionado?.name}</strong>?
            Esta ação não pode ser desfeita.
          </p>
          <div className={styles.formActions}>
            <CustomButton typeButton="outline-main"
              onClick={() => setModalRemoverSabor(false)}>
              Cancelar
            </CustomButton>
            <CustomButton typeButton="danger" loading={removendoSabor}
              onClick={onRemoverSabor}>
              Remover
            </CustomButton>
          </div>
        </div>
      </BaseModal>

      <BaseModal isOpen={modalPreco}
        title={`Editar preço — ${itemSelecionado?.name}`}
        setClose={() => { setModalPreco(false); setErroPreco(null); reset(); }}
        width="400px">
        <form onSubmit={handleSubmit(onSalvarPreco)} className={styles.form}>
          <p className={styles.formDesc}>
            O preço original aparece riscado como "de". Deixe em branco para não exibir.
          </p>
          <div className={styles.precoRow}>
            <KRDInput label="Preço atual (R$)" name="value" type="number"
              control={control} width="50%" placeholder="0,00" />
            <KRDInput label="Preço original (R$)" name="originalValue" type="number"
              control={control} width="50%" placeholder="0,00" />
          </div>
          {erroPreco && <span className={styles.erro}>{erroPreco}</span>}
          <div className={styles.formActions}>
            <CustomButton typeButton="outline-main" type="button"
              onClick={() => { setModalPreco(false); setErroPreco(null); reset(); }}>
              Cancelar
            </CustomButton>
            <CustomButton typeButton="main" type="submit" loading={salvandoPreco}>
              Salvar
            </CustomButton>
          </div>
        </form>
      </BaseModal>

      <ModalVinculoItem
        isOpen={modalVinculoItem}
        empresaId={empresaId}
        item={itemSelecionado}
        onClose={() => setModalVinculoItem(false)}
        onVinculado={onVinculadoItem}
      />

      <ModalVinculoCategoria
        isOpen={modalVinculoCategoria}
        empresaId={empresaId}
        categoria={categoriaSelecionada}
        onClose={() => setModalVinculoCategoria(false)}
        onVinculado={onVinculadoCategoria}
      />

      <BaseModal isOpen={modalEditarCategoria}
        title={categoriaSelecionada?.id ? "Editar categoria" : "Duplicar categoria"}
        setClose={() => { setModalEditarCategoria(false); setErroCategoria(null); resetCat(); }}
        width="400px">
        <form onSubmit={handleCat(onSalvarCategoria)} className={styles.form}>
          <KRDInput label="Nome da categoria" name="name" control={controlCat}
            placeholder="Ex: Lanches, Bebidas..." />
          {erroCategoria && <span className={styles.erro}>{erroCategoria}</span>}
          <div className={styles.formActions}>
            <CustomButton typeButton="outline-main" type="button"
              onClick={() => { setModalEditarCategoria(false); resetCat(); }}>
              Cancelar
            </CustomButton>
            <CustomButton typeButton="main" type="submit" loading={salvandoCategoria}>
              Salvar
            </CustomButton>
          </div>
        </form>
      </BaseModal>

      <BaseModal isOpen={modalExcluirCategoria} title="Remover categoria"
        setClose={() => setModalExcluirCategoria(false)} width="400px">
        <div className={styles.form}>
          <p className={styles.formDesc}>
            Tem certeza que deseja remover a categoria{" "}
            <strong>{categoriaSelecionada?.name}</strong>?
            Todos os itens vinculados serão removidos do catálogo.
          </p>
          <div className={styles.formActions}>
            <CustomButton typeButton="outline-main"
              onClick={() => setModalExcluirCategoria(false)}>
              Cancelar
            </CustomButton>
            <CustomButton typeButton="danger" loading={excluindoCategoria}
              onClick={onExcluirCategoria}>
              Remover
            </CustomButton>
          </div>
        </div>
      </BaseModal>

      <ModalCriarCategoria
        isOpen={modalCriarCategoria}
        empresaId={empresaId}
        catalogId={catalogoAtivo ?? ""}
        sequenceAtual={categorias.length}
        onClose={() => setModalCriarCategoria(false)}
        onCriada={onCategoriaCriada}
      />

      {itemPizzaCompleto && (
        <ModalAdicionarSabor
          isOpen={modalAdicionarSabor}
          empresaId={empresaId}
          catalogId={catalogoAtivo ?? ""}
          itemPizza={itemPizzaCompleto}
          saborId={saborSelecionado?.id}
          onClose={() => { setModalAdicionarSabor(false); setItemPizzaCompleto(null); }}
          onSalvo={onSaborSalvo}
        />
      )}

    </div>
  );

  function toggleCategoria(id: string) {
    setCategoriasAbertas(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

}

