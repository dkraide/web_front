// pages/ifood/complementos/index.tsx
// Lista os grupos de complementos e seus itens (igual ao painel do iFood),
// permitindo criar, editar, pausar/ativar e excluir grupos de forma standalone.

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import {
  FiArrowLeft, FiSearch, FiEdit2, FiTrash2,
  FiPause, FiPlay, FiMoreVertical, FiLoader,
} from "react-icons/fi";
import { AuthContext } from "@/contexts/AuthContext";
import { ifoodCatalogService } from "@/services/ifoodCatalogService";
import { materiaPrimaService } from "@/services/materiaPrimaService";
import { parseVinculo } from "@/interfaces/ifoodCatalog";
import type { IFoodGrupoComplementoEnriquecido } from "@/interfaces/ifoodCatalog";
import IMateriaPrima from "@/interfaces/IMateriaPrima";
import { humanizarErro } from "@/utils/ifoodApiUtils";
import CustomButton from "@/components/ui/Buttons";
import BaseModal from "@/components/Modals/Base/Index";
import styles from "./styles.module.scss";

/** Tipos de grupo usados por pizzas — não devem aparecer na tela de complementos. */
const TIPOS_PIZZA = new Set(["SIZE", "CRUST", "EDGE", "TOPPING"]);

export default function IFoodComplementosPage() {
  const router = useRouter();
  const { getUser } = useContext(AuthContext);

  const [empresaId, setEmpresaId] = useState(0);
  const [grupos, setGrupos] = useState<IFoodGrupoComplementoEnriquecido[]>([]);
  const [materias, setMaterias] = useState<IMateriaPrima[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  const [menuAberto, setMenuAberto] = useState<string | null>(null);
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);

  const [grupoSelecionado, setGrupoSelecionado] = useState<IFoodGrupoComplementoEnriquecido | null>(null);
  const [modalExcluir, setModalExcluir] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  // ─── Carregamento ────────────────────────────────────────────────────────────

  useEffect(() => { init(); }, []);

  async function init() {
    const user = await getUser();
    if (!user) return;
    const eid = user.empresaSelecionada;
    setEmpresaId(eid);
    await Promise.all([carregarGrupos(eid), carregarMaterias(eid)]);
  }

  async function carregarGrupos(eid: number) {
    setLoading(true);
    try {
      const r = await ifoodCatalogService.listarGruposComplementosEnriquecido(eid);
      if (r.sucesso) {
        // Exibe só grupos de complemento reais: exclui grupos de pizza e
        // grupos sem nenhum produto vinculado.
        const visiveis = (r.dados ?? []).filter(g =>
          !TIPOS_PIZZA.has((g.optionGroupType ?? "").toUpperCase()) &&
          g.linkedProducts.length > 0
        );
        setGrupos(visiveis);
      }
    } catch { } finally {
      setLoading(false);
    }
  }

  async function carregarMaterias(eid: number) {
    try {
      const r = await materiaPrimaService.getAll(eid);
      if (r) setMaterias(r);
    } catch { }
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  function nomeMateria(externalCode?: string | null): string | null {
    const v = parseVinculo(externalCode);
    if (!v || v.tipo !== "materia") return null;
    return materias.find(m => m.id === v.id)?.nome ?? `Matéria #${v.id}`;
  }

  // ─── Ações ─────────────────────────────────────────────────────────────────

  async function toggleStatus(grupo: IFoodGrupoComplementoEnriquecido) {
    setTogglingStatus(grupo.id);
    setMenuAberto(null);
    try {
      const novoStatus = grupo.status === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE";
      const r = await ifoodCatalogService.editarStatusGrupoComplemento(
        empresaId, grupo.id, { status: novoStatus }
      );
      if (r.sucesso) {
        setGrupos(prev => prev.map(g =>
          g.id === grupo.id ? { ...g, status: novoStatus } : g
        ));
      } else {
        toast.error(humanizarErro(r.erro));
      }
    } finally {
      setTogglingStatus(null);
    }
  }

  async function onExcluir() {
    if (!grupoSelecionado) return;
    setExcluindo(true);
    try {
      const r = await ifoodCatalogService.excluirGrupoComplemento(empresaId, grupoSelecionado.id);
      if (r.sucesso) {
        setGrupos(prev => prev.filter(g => g.id !== grupoSelecionado.id));
        setModalExcluir(false);
        toast.success("Grupo excluído.");
      } else {
        toast.error(humanizarErro(r.erro));
      }
    } finally {
      setExcluindo(false);
    }
  }

  function editar(grupo: IFoodGrupoComplementoEnriquecido) {
    router.push(`/ifood/complementos/grupo?grupoId=${grupo.id}`);
  }

  // ─── Filtragem ─────────────────────────────────────────────────────────────

  const gruposFiltrados = grupos.filter(g =>
    g.name.toLowerCase().includes(busca.toLowerCase()) ||
    (g.options ?? []).some(o => o.name.toLowerCase().includes(busca.toLowerCase()))
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.container}>

      {/* Header */}
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={() => router.push("/ifood")}>
          <FiArrowLeft size={16} />
        </button>
        <h1 className={styles.titulo}>Grupos de complementos</h1>
      </div>

      {/* Filtros */}
      <div className={styles.filtros}>
        <div className={styles.buscaWrapper}>
          <FiSearch size={14} className={styles.buscaIcon} />
          <input className={styles.buscaInput} placeholder="Buscar grupo ou complemento"
            value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div className={styles.loadingBox}>
          <FiLoader size={22} className={styles.spinner} />
          <p>Carregando grupos...</p>
        </div>
      ) : gruposFiltrados.length === 0 ? (
        <div className={styles.vazioBox}>
          <p className={styles.vazioTitulo}>Nenhum grupo de complementos.</p>
          <p className={styles.vazioSub}>
            Só aparecem aqui os grupos de complementos que já estão vinculados a
            algum produto do seu cardápio.
          </p>
        </div>
      ) : (
        <div className={styles.gruposList}>
          {gruposFiltrados.map(grupo => (
            <div key={grupo.id} className={styles.grupoCard}>

              {/* Header do grupo */}
              <div className={styles.grupoHeader}>
                <div className={styles.grupoInfo}>
                  <span className={styles.grupoNome}>{grupo.name}</span>
                  <span className={`${styles.grupoBadge} ${grupo.status === "AVAILABLE" ? styles.ativo : styles.pausado}`}>
                    {grupo.status === "AVAILABLE" ? "Ativo" : "Pausado"}
                  </span>
                  <span className={styles.grupoCount}>
                    {grupo.options?.length ?? 0}{" "}
                    {grupo.options?.length === 1 ? "complemento" : "complementos"}
                  </span>
                  <span className={styles.grupoCount}>
                    {grupo.linkedProducts.length}{" "}
                    {grupo.linkedProducts.length === 1 ? "produto" : "produtos"}
                  </span>
                </div>
                <div className={styles.grupoAcoes}>
                  <button className={styles.iconBtn}
                    disabled={togglingStatus === grupo.id}
                    title={grupo.status === "AVAILABLE" ? "Pausar grupo" : "Ativar grupo"}
                    onClick={() => toggleStatus(grupo)}>
                    {grupo.status === "AVAILABLE" ? <FiPause size={14} /> : <FiPlay size={14} />}
                  </button>
                  <button className={styles.iconBtn} title="Editar grupo"
                    onClick={() => editar(grupo)}>
                    <FiEdit2 size={14} />
                  </button>
                  <div className={styles.menuWrapper}>
                    <button className={styles.iconBtn}
                      onClick={() => setMenuAberto(menuAberto === grupo.id ? null : grupo.id)}>
                      <FiMoreVertical size={14} />
                    </button>
                    {menuAberto === grupo.id && (
                      <div className={styles.dropdown}>
                        <button className={styles.dropdownItem} onClick={() => editar(grupo)}>
                          <FiEdit2 size={13} /> Editar grupo
                        </button>
                        <button className={styles.dropdownItem}
                          onClick={() => toggleStatus(grupo)}>
                          {grupo.status === "AVAILABLE"
                            ? <><FiPause size={13} /> Pausar grupo</>
                            : <><FiPlay size={13} /> Ativar grupo</>}
                        </button>
                        <button className={`${styles.dropdownItem} ${styles.dropdownItemPerigo}`}
                          onClick={() => {
                            setGrupoSelecionado(grupo);
                            setMenuAberto(null);
                            setModalExcluir(true);
                          }}>
                          <FiTrash2 size={13} /> Excluir grupo
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Opções */}
              <div className={styles.opcoesList}>
                {(grupo.options ?? []).length === 0 ? (
                  <p className={styles.semOpcoes}>Nenhum complemento neste grupo.</p>
                ) : (
                  (grupo.options ?? []).map(opcao => (
                    <div key={opcao.id}
                      className={`${styles.opcaoRow} ${opcao.status !== "AVAILABLE" ? styles.opcaoPausada : ""}`}>
                      {opcao.imagePath ? (
                        <img src={opcao.imagePath} alt={opcao.name} className={styles.opcaoImg} />
                      ) : (
                        <div className={styles.opcaoImgPlaceholder} />
                      )}
                      <div className={styles.opcaoInfo}>
                        <span className={styles.opcaoNome}>{opcao.name}</span>
                        {opcao.description && (
                          <span className={styles.opcaoDesc}>{opcao.description}</span>
                        )}
                        {nomeMateria(opcao.externalCode) && (
                          <span className={styles.tagVinculado}>
                            KRD: {nomeMateria(opcao.externalCode)}
                          </span>
                        )}
                      </div>
                      <div className={styles.opcaoPreco}>
                        {opcao.price.originalValue != null &&
                          opcao.price.originalValue > opcao.price.value && (
                            <span className={styles.precoOriginal}>
                              R$ {opcao.price.originalValue.toFixed(2).replace(".", ",")}
                            </span>
                          )}
                        <span className={styles.precoAtual}>
                          R$ {opcao.price.value.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal excluir */}
      <BaseModal isOpen={modalExcluir} title="Excluir grupo de complementos"
        setClose={() => setModalExcluir(false)} width="400px">
        <div className={styles.form}>
          <p className={styles.formDesc}>
            Tem certeza que deseja excluir o grupo{" "}
            <strong>{grupoSelecionado?.name}</strong>?
            Todos os produtos associados deixarão de recebê-lo.
          </p>
          <div className={styles.formActions}>
            <CustomButton typeButton="outline-main" onClick={() => setModalExcluir(false)}>
              Cancelar
            </CustomButton>
            <CustomButton typeButton="danger" loading={excluindo} onClick={onExcluir}>
              Excluir
            </CustomButton>
          </div>
        </div>
      </BaseModal>
    </div>
  );
}
