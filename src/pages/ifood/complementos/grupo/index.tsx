// pages/ifood/complementos/grupo/index.tsx
// Criar ou editar um grupo de complementos standalone (com suas opções).
// ?grupoId=<uuid> → modo edição. Sem query → modo criação.

import { useState, useRef, useContext, useEffect } from "react";
import { useRouter } from "next/router";
import {
  FiArrowLeft, FiPlus, FiTrash2, FiSave, FiLoader,
  FiAlertCircle, FiImage, FiEye, FiEyeOff, FiLink,
  FiList, FiPackage,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { AuthContext } from "@/contexts/AuthContext";
import { ifoodCatalogService } from "@/services/ifoodCatalogService";
import { materiaPrimaService } from "@/services/materiaPrimaService";
import {
  parseVinculo, externalCodeMateria,
} from "@/interfaces/ifoodCatalog";
import type {
  IFoodProduto,
  IFoodProdutoVinculadoGrupo,
  IFoodSalvarGrupoComplementoRequest,
} from "@/interfaces/ifoodCatalog";
import IMateriaPrima from "@/interfaces/IMateriaPrima";
import { withRetry, humanizarErro } from "@/utils/ifoodApiUtils";
import styles from "./styles.module.scss";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface OpcaoForm {
  key: string;
  optionId?: string;   // existente
  productId?: string;  // existente
  nome: string;
  descricao: string;
  preco: number;
  status: "AVAILABLE" | "UNAVAILABLE";
  imagePath: string | null;
  imagemBase64: string | null;
  materiaId: number;   // 0 = sem vínculo
  orig?: {
    nome: string; descricao: string; preco: number;
    status: string; imagePath: string | null; externalCode: string | null;
  };
}

// ─── Linha de opção ────────────────────────────────────────────────────────────

function OpcaoRow({
  opc, materias, onChange, onRemove,
}: {
  opc: OpcaoForm;
  materias: IMateriaPrima[];
  onChange: (patch: Partial<OpcaoForm>) => void;
  onRemove: () => void;
}) {
  const fotoRef = useRef<HTMLInputElement>(null);
  const preview = opc.imagemBase64
    ? `data:image/*;base64,${opc.imagemBase64}`
    : opc.imagePath;

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      onChange({ imagemBase64: res.split(",")[1], imagePath: res });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  const off = opc.status === "UNAVAILABLE";

  return (
    <div className={styles.opcaoRow}>
      <input ref={fotoRef} type="file" accept="image/*"
        style={{ display: "none" }} onChange={handleFoto} />
      <button type="button" className={styles.fotoBtn}
        onClick={() => fotoRef.current?.click()}
        title={preview ? "Alterar foto" : "Adicionar foto"}>
        {preview
          ? <img src={preview} alt="" className={styles.fotoImg} />
          : <FiImage size={15} />}
      </button>

      <input className={styles.inputNome} placeholder="Nome do complemento"
        value={opc.nome} onChange={e => onChange({ nome: e.target.value })} />

      <div className={styles.vinculoWrapper}>
        <FiLink size={12} className={styles.vinculoIcon} />
        <select className={styles.vinculoSelect}
          value={opc.materiaId}
          onChange={e => onChange({ materiaId: Number(e.target.value) })}>
          <option value={0}>Sem vínculo</option>
          {materias.map(m => (
            <option key={m.id} value={m.id}>{m.nome}</option>
          ))}
        </select>
      </div>

      <div className={styles.precoWrapper}>
        <span className={styles.precoPrefix}>R$</span>
        <input type="number" min={0} step={0.01} className={styles.inputPreco}
          placeholder="0,00"
          value={opc.preco === 0 ? "" : opc.preco}
          onChange={e => onChange({ preco: parseFloat(e.target.value) || 0 })} />
      </div>

      <button type="button"
        className={`${styles.statusBtn} ${off ? styles.statusOff : styles.statusOn}`}
        onClick={() => onChange({ status: off ? "AVAILABLE" : "UNAVAILABLE" })}
        title={off ? "Pausado — clique para ativar" : "Ativo — clique para pausar"}>
        {off ? <FiEyeOff size={14} /> : <FiEye size={14} />}
      </button>

      <button className={styles.removerBtn} onClick={onRemove} title="Remover complemento">
        <FiTrash2 size={14} />
      </button>
    </div>
  );
}

// ─── Página ─────────────────────────────────────────────────────────────────────

export default function IFoodGrupoComplementoPage() {
  const router = useRouter();
  const { grupoId } = router.query as { grupoId?: string };
  const isEdicao = !!grupoId;
  const { getUser } = useContext(AuthContext);

  const [empresaId, setEmpresaId] = useState(0);
  const [loading, setLoading] = useState(isEdicao);
  const [salvando, setSalvando] = useState(false);
  const [erros, setErros] = useState<string[]>([]);

  const [materias, setMaterias] = useState<IMateriaPrima[]>([]);

  // Campos do grupo
  const [nome, setNome] = useState("");
  const [status, setStatus] = useState<"AVAILABLE" | "UNAVAILABLE">("AVAILABLE");

  // Snapshot do grupo (edição)
  const [origNome, setOrigNome] = useState("");
  const [origStatus, setOrigStatus] = useState("");

  // Opções
  const [opcoes, setOpcoes] = useState<OpcaoForm[]>([]);
  const [removidos, setRemovidos] = useState<{ optionId: string; productId: string }[]>([]);

  // Abas (edição): "complementos" | "produtos"
  const [aba, setAba] = useState<"complementos" | "produtos">("complementos");

  // Aba "Produtos vinculados"
  const [produtosVinculados, setProdutosVinculados] = useState<IFoodProdutoVinculadoGrupo[]>([]);
  const [todosProdutos, setTodosProdutos] = useState<IFoodProduto[]>([]);
  const [vinculosCarregados, setVinculosCarregados] = useState(false);
  const [carregandoVinculos, setCarregandoVinculos] = useState(false);
  const [addProdutoId, setAddProdutoId] = useState("");
  const [addMin, setAddMin] = useState(0);
  const [addMax, setAddMax] = useState(1);
  const [associando, setAssociando] = useState(false);
  const [removendoVinculo, setRemovendoVinculo] = useState<string | null>(null);

  // ─── Init ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!router.isReady) return;
    init();
  }, [router.isReady]);

  async function init() {
    const user = await getUser();
    if (!user) return;
    const eid = user.empresaSelecionada;
    setEmpresaId(eid);
    await carregarMaterias(eid);
    if (isEdicao && grupoId) await carregarGrupo(eid, grupoId);
    else setLoading(false);
  }

  async function carregarMaterias(eid: number) {
    try {
      const r = await materiaPrimaService.getAll(eid);
      if (r) setMaterias(r);
    } catch { }
  }

  async function carregarGrupo(eid: number, id: string) {
    setLoading(true);
    try {
      const r = await ifoodCatalogService.obterGrupoComplemento(eid, id);
      if (!r?.sucesso || !r.dados) {
        toast.error("Grupo não encontrado.");
        router.push("/ifood/complementos");
        return;
      }
      const g = r.dados;
      setNome(g.name);
      setOrigNome(g.name);
      setStatus(g.status === "UNAVAILABLE" ? "UNAVAILABLE" : "AVAILABLE");
      setOrigStatus(g.status);

      setOpcoes((g.options ?? []).map(o => {
        const v = parseVinculo(o.externalCode);
        return {
          key: o.id,
          optionId: o.id,
          productId: o.productId,
          nome: o.name,
          descricao: o.description ?? "",
          preco: o.price?.value ?? 0,
          status: o.status === "UNAVAILABLE" ? "UNAVAILABLE" : "AVAILABLE",
          imagePath: o.imagePath ?? null,
          imagemBase64: null,
          materiaId: v?.tipo === "materia" ? v.id : 0,
          orig: {
            nome: o.name,
            descricao: o.description ?? "",
            preco: o.price?.value ?? 0,
            status: o.status,
            imagePath: o.imagePath ?? null,
            externalCode: o.externalCode ?? null,
          },
        };
      }));
    } finally {
      setLoading(false);
    }
  }

  // ─── Manipulação de opções ──────────────────────────────────────────────────

  function addOpcao() {
    setOpcoes(p => [...p, {
      key: crypto.randomUUID(),
      nome: "", descricao: "", preco: 0, status: "AVAILABLE",
      imagePath: null, imagemBase64: null, materiaId: 0,
    }]);
  }

  function updateOpcao(key: string, patch: Partial<OpcaoForm>) {
    setOpcoes(p => p.map(o => o.key === key ? { ...o, ...patch } : o));
  }

  function removeOpcao(o: OpcaoForm) {
    if (o.optionId && o.productId) {
      setRemovidos(prev => [...prev, { optionId: o.optionId!, productId: o.productId! }]);
    }
    setOpcoes(p => p.filter(x => x.key !== o.key));
  }

  // ─── Produtos vinculados ────────────────────────────────────────────────────

  // Abre a aba e carrega (uma vez) os produtos vinculados + o catálogo de produtos.
  async function abrirAbaProdutos() {
    setAba("produtos");
    if (vinculosCarregados || !grupoId) return;
    setCarregandoVinculos(true);
    try {
      const [enr, prods] = await Promise.all([
        ifoodCatalogService.listarGruposComplementosEnriquecido(empresaId),
        ifoodCatalogService.listarProdutos(empresaId, 200, 1),
      ]);
      if (enr.sucesso) {
        const g = (enr.dados ?? []).find(x => x.id === grupoId);
        setProdutosVinculados(g?.linkedProducts ?? []);
      }
      if (prods.sucesso) setTodosProdutos(prods.dados ?? []);
      setVinculosCarregados(true);
    } finally {
      setCarregandoVinculos(false);
    }
  }

  async function onAssociarProduto() {
    if (!grupoId || !addProdutoId) return;
    if (addMax < 1 || addMin < 0 || addMin > addMax) {
      toast.error("Verifique os valores de mín./máx.");
      return;
    }
    setAssociando(true);
    try {
      const r = await ifoodCatalogService.associarGrupoComplementoAoProduto(
        empresaId, grupoId, addProdutoId,
        { min: addMin, max: addMax, index: produtosVinculados.length });
      if (r.sucesso) {
        const prod = todosProdutos.find(p => p.id === addProdutoId);
        setProdutosVinculados(prev => [...prev, {
          productId: addProdutoId,
          name: prod?.name ?? addProdutoId,
          min: addMin, max: addMax, index: prev.length,
        }]);
        setAddProdutoId("");
        setAddMin(0);
        setAddMax(1);
        toast.success("Produto vinculado ao grupo.");
      } else {
        toast.error(humanizarErro(r.erro));
      }
    } finally {
      setAssociando(false);
    }
  }

  async function onDesassociarProduto(productId: string) {
    if (!grupoId) return;
    setRemovendoVinculo(productId);
    try {
      const r = await ifoodCatalogService.desassociarGrupoComplementoDoProduto(
        empresaId, grupoId, productId);
      if (r.sucesso) {
        setProdutosVinculados(prev => prev.filter(p => p.productId !== productId));
        toast.success("Vínculo removido.");
      } else {
        toast.error(humanizarErro(r.erro));
      }
    } finally {
      setRemovendoVinculo(null);
    }
  }

  // Produtos ainda não vinculados a este grupo (candidatos para adicionar).
  const produtosDisponiveis = todosProdutos.filter(
    p => !produtosVinculados.some(v => v.productId === p.id)
  );

  // Resolve o imagePath final (faz upload se houver imagem nova)
  async function resolverImagem(o: OpcaoForm): Promise<string | null> {
    if (o.imagemBase64) {
      const up = await withRetry(() => ifoodCatalogService.uploadImagem(empresaId, o.imagemBase64!));
      if (!up.sucesso) throw new Error(humanizarErro(up.erro));
      return up.dados.imagePath;
    }
    if (o.imagePath && !o.imagePath.startsWith("data:")) return o.imagePath;
    return null;
  }

  function externalCodeDe(o: OpcaoForm): string | null {
    return o.materiaId > 0 ? externalCodeMateria(o.materiaId) : null;
  }

  // ─── Validação ────────────────────────────────────────────────────────────

  function validar(): string[] {
    const e: string[] = [];
    if (!nome.trim()) e.push("Informe o nome do grupo.");
    const validas = opcoes.filter(o => o.nome.trim());
    if (validas.length === 0) e.push("Adicione ao menos um complemento com nome.");
    return e;
  }

  // ─── Salvar (criação) ───────────────────────────────────────────────────────

  async function salvarCriacao() {
    const options: IFoodSalvarGrupoComplementoRequest["options"] = [];
    for (const o of opcoes) {
      if (!o.nome.trim()) continue;
      const imagePath = await resolverImagem(o);
      options.push({
        name: o.nome.trim(),
        status: o.status,
        price: o.preco,
        description: o.descricao || null,
        externalCode: externalCodeDe(o),
        imagePath,
      });
    }

    const payload: IFoodSalvarGrupoComplementoRequest = {
      name: nome.trim(),
      status,
      options,
    };

    const r = await withRetry(() => ifoodCatalogService.criarGrupoComplemento(empresaId, payload));
    if (!r.sucesso) { setErros([humanizarErro(r.erro)]); return false; }
    return true;
  }

  // ─── Salvar (edição) ────────────────────────────────────────────────────────

  async function salvarEdicao() {
    if (!grupoId) return false;

    // Grupo: nome e status
    if (nome.trim() !== origNome) {
      const r = await ifoodCatalogService.editarNomeGrupoComplemento(
        empresaId, grupoId, { name: nome.trim() });
      if (!r.sucesso) { setErros([humanizarErro(r.erro)]); return false; }
    }
    if (status !== origStatus) {
      const r = await ifoodCatalogService.editarStatusGrupoComplemento(
        empresaId, grupoId, { status });
      if (!r.sucesso) { setErros([humanizarErro(r.erro)]); return false; }
    }

    // Opções removidas
    for (const rem of removidos) {
      await ifoodCatalogService.excluirOpcao(empresaId, grupoId, rem.productId);
    }

    // Opções existentes e novas
    for (const o of opcoes) {
      if (!o.nome.trim()) continue;
      const extCode = externalCodeDe(o);

      // ── Nova opção ──
      if (!o.optionId) {
        const imagePath = await resolverImagem(o);
        const r = await ifoodCatalogService.criarOpcao(empresaId, grupoId, {
          status: o.status,
          product: {
            name: o.nome.trim(),
            description: o.descricao || null,
            imagePath,
            externalCode: extCode,
          },
          externalCode: extCode,
          price: { value: o.preco, originalValue: null },
          index: opcoes.indexOf(o),
        });
        if (!r.sucesso) { setErros([humanizarErro(r.erro)]); return false; }
        continue;
      }

      // ── Opção existente: diff ──
      const orig = o.orig!;

      if (o.preco !== orig.preco) {
        await ifoodCatalogService.editarPrecoOpcao(empresaId, {
          optionId: o.optionId,
          price: { value: o.preco, originalValue: null },
          parentCustomizationOptionId: null,
          priceByCatalog: null,
        });
      }
      if (o.status !== orig.status) {
        await ifoodCatalogService.editarStatusOpcao(empresaId, {
          optionId: o.optionId,
          status: o.status,
          parentCustomizationOptionId: null,
          statusByCatalog: null,
        });
      }
      if ((extCode ?? null) !== (orig.externalCode ?? null)) {
        await ifoodCatalogService.editarExternalCodeOpcao(empresaId, {
          optionId: o.optionId,
          externalCode: extCode,
          parentCustomizationOptionId: null,
          externalCodeByCatalog: null,
        });
      }

      // Nome/descrição/imagem → editam o produto da opção
      const imagemMudou = !!o.imagemBase64 ||
        (o.imagePath ?? null) !== (orig.imagePath ?? null);
      if (o.productId &&
        (o.nome.trim() !== orig.nome || (o.descricao || "") !== (orig.descricao || "") || imagemMudou)) {
        const imagePath = await resolverImagem(o);
        await ifoodCatalogService.editarProduto(empresaId, o.productId, {
          name: o.nome.trim(),
          description: o.descricao || null,
          imagePath,
          externalCode: extCode,
        });
      }
    }

    return true;
  }

  // ─── Submit ─────────────────────────────────────────────────────────────────

  async function onSalvar() {
    const e = validar();
    if (e.length > 0) {
      setErros(e);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSalvando(true);
    setErros([]);
    try {
      const ok = isEdicao ? await salvarEdicao() : await salvarCriacao();
      if (ok) {
        toast.success(isEdicao ? "Grupo atualizado!" : "Grupo criado!");
        router.push("/ifood/complementos");
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      setErros([err instanceof Error ? err.message : "Erro inesperado. Tente novamente."]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSalvando(false);
    }
  }

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <FiLoader size={24} className={styles.spinner} />
        <p>Carregando grupo...</p>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>

      {/* Top bar */}
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => router.push("/ifood/complementos")}>
          <FiArrowLeft size={16} />
        </button>
        <div className={styles.breadcrumb}>
          <span className={styles.breadcrumbItem}
            onClick={() => router.push("/ifood/complementos")}>
            Complementos
          </span>
          <span className={styles.breadcrumbSep}>›</span>
          <span className={styles.breadcrumbAtivo}>
            {isEdicao ? "Editar grupo" : "Novo grupo"}
          </span>
        </div>
        <div style={{ flex: 1 }} />
        <button className={styles.btnSalvarTop} disabled={salvando} onClick={onSalvar}>
          {salvando
            ? <><FiLoader size={14} className={styles.spinner} /> Salvando...</>
            : <><FiSave size={14} /> {isEdicao ? "Salvar alterações" : "Criar grupo"}</>}
        </button>
      </div>

      {/* Erros */}
      {erros.length > 0 && (
        <div className={styles.errosBanner}>
          {erros.map((e, i) => (
            <div key={i} className={styles.erroItem}>
              <FiAlertCircle size={13} /><span>{e}</span>
            </div>
          ))}
        </div>
      )}

      {/* Abas (somente em edição) */}
      {isEdicao && (
        <div className={styles.abas}>
          <button
            className={`${styles.aba} ${aba === "complementos" ? styles.abaAtiva : ""}`}
            onClick={() => setAba("complementos")}>
            <FiList size={14} /> Complementos
          </button>
          <button
            className={`${styles.aba} ${aba === "produtos" ? styles.abaAtiva : ""}`}
            onClick={abrirAbaProdutos}>
            <FiPackage size={14} /> Produtos vinculados
            {vinculosCarregados && (
              <span className={styles.abaBadge}>{produtosVinculados.length}</span>
            )}
          </button>
        </div>
      )}

      <div className={styles.conteudo}>

        {/* ── Aba: Complementos ── */}
        {(!isEdicao || aba === "complementos") && (<>

        {/* Dados do grupo */}
        <div className={styles.card}>
          <h3 className={styles.cardTitulo}>Dados do grupo</h3>

          <div className={styles.row}>
            <div className={styles.fieldGroup} style={{ flex: 2 }}>
              <label className={styles.label}>Nome *</label>
              <input className={styles.input} maxLength={100}
                placeholder="Ex: Turbine seu lanche, Molhos, Adicionais..."
                value={nome} onChange={e => setNome(e.target.value)} />
            </div>
            <div className={styles.fieldGroup} style={{ flex: 1 }}>
              <label className={styles.label}>Situação</label>
              <select className={styles.select} value={status}
                onChange={e => setStatus(e.target.value as "AVAILABLE" | "UNAVAILABLE")}>
                <option value="AVAILABLE">Ativo</option>
                <option value="UNAVAILABLE">Pausado</option>
              </select>
            </div>
          </div>

          <span className={styles.fieldHint}>
            Mín./máx. de seleção e o tipo do grupo são definidos ao associar este grupo
            a cada produto (na tela do produto).
          </span>
        </div>

        {/* Complementos */}
        <div className={styles.card}>
          <div className={styles.complementosHeader}>
            <div>
              <h3 className={styles.cardTitulo}>Complementos</h3>
              <p className={styles.cardDesc}>
                Cada complemento tem nome, preço e status próprios. Vincule à matéria-prima
                do PDV para baixa de estoque automática. Linhas sem nome são ignoradas.
              </p>
            </div>
            <button className={styles.btnNovo} onClick={addOpcao}>
              <FiPlus size={14} /> Adicionar
            </button>
          </div>

          {opcoes.length === 0 ? (
            <div className={styles.vazio}>
              <p>Nenhum complemento ainda.</p>
              <button className={styles.btnNovoCentro} onClick={addOpcao}>
                <FiPlus size={13} /> Adicionar primeiro complemento
              </button>
            </div>
          ) : (
            <div className={styles.opcoesList}>
              {opcoes.map(o => (
                <OpcaoRow key={o.key} opc={o} materias={materias}
                  onChange={patch => updateOpcao(o.key, patch)}
                  onRemove={() => removeOpcao(o)} />
              ))}
              <button className={styles.btnAdicionar} onClick={addOpcao}>
                <FiPlus size={13} /> Adicionar outro complemento
              </button>
            </div>
          )}
        </div>

        </>)}

        {/* ── Aba: Produtos vinculados ── */}
        {isEdicao && aba === "produtos" && (
          <div className={styles.card}>
            <div className={styles.complementosHeader}>
              <div>
                <h3 className={styles.cardTitulo}>Produtos vinculados</h3>
                <p className={styles.cardDesc}>
                  Produtos do cardápio que exibem este grupo de complementos. As alterações
                  aqui são aplicadas imediatamente (não dependem do botão salvar).
                </p>
              </div>
            </div>

            {carregandoVinculos ? (
              <div className={styles.vazio}>
                <FiLoader size={18} className={styles.spinner} />
                <p>Carregando produtos...</p>
              </div>
            ) : (
              <>
                {/* Adicionar vínculo */}
                <div className={styles.addVinculoRow}>
                  <select className={styles.select} style={{ flex: 2 }}
                    value={addProdutoId}
                    onChange={e => setAddProdutoId(e.target.value)}>
                    <option value="">Selecione um produto…</option>
                    {produtosDisponiveis.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <div className={styles.minMaxWrapper}>
                    <label className={styles.minMaxLabel}>Mín.</label>
                    <input type="number" min={0} className={styles.inputMinMax}
                      value={addMin}
                      onChange={e => setAddMin(Math.max(0, Number(e.target.value) || 0))} />
                  </div>
                  <div className={styles.minMaxWrapper}>
                    <label className={styles.minMaxLabel}>Máx.</label>
                    <input type="number" min={1} className={styles.inputMinMax}
                      value={addMax}
                      onChange={e => setAddMax(Math.max(1, Number(e.target.value) || 1))} />
                  </div>
                  <button className={styles.btnNovo}
                    disabled={!addProdutoId || associando}
                    onClick={onAssociarProduto}>
                    {associando
                      ? <FiLoader size={14} className={styles.spinner} />
                      : <><FiLink size={13} /> Vincular</>}
                  </button>
                </div>

                {/* Lista de vínculos */}
                {produtosVinculados.length === 0 ? (
                  <div className={styles.vazio}>
                    <p>Nenhum produto usa este grupo ainda.</p>
                  </div>
                ) : (
                  <div className={styles.vinculosList}>
                    {produtosVinculados.map(p => (
                      <div key={p.productId} className={styles.vinculoRow}>
                        <FiPackage size={15} className={styles.vinculoRowIcon} />
                        <span className={styles.vinculoNome}>{p.name}</span>
                        <span className={styles.vinculoMinMax}>
                          mín. {p.min} · máx. {p.max}
                        </span>
                        <button className={styles.removerBtn}
                          disabled={removendoVinculo === p.productId}
                          onClick={() => onDesassociarProduto(p.productId)}
                          title="Remover vínculo">
                          {removendoVinculo === p.productId
                            ? <FiLoader size={14} className={styles.spinner} />
                            : <FiTrash2 size={14} />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
