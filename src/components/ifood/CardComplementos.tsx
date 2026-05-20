import { useState } from "react";
import { FiPause, FiPlay, FiEdit2, FiMoreVertical, FiLink, FiTrash2, FiLink2 } from "react-icons/fi";
import { ifoodCatalogService } from "@/services/ifoodCatalogService";
import type { IFoodGrupoOpcaoResumo, IFoodOpcaoResumo } from "@/interfaces/ifoodCatalog";
import { externalCodeMateria, parseVinculo } from "@/interfaces/ifoodCatalog";
import IMateriaPrima from "@/interfaces/IMateriaPrima";
import BaseModal from "@/components/Modals/Base/Index";
import CustomButton from "@/components/ui/Buttons";
import KRDInput from "@/components/ui/KRDInput";
import SelectMateriaPrima from "@/components/Selects/SelectMateriaPrima";
import { useForm } from "react-hook-form";
import styles from "./CardComplementos.module.scss";

interface Props {
  empresaId: number;
  /** UUID do produto ao qual os grupos estão associados — necessário para desassociar. */
  productId: string;
  grupos: IFoodGrupoOpcaoResumo[];
  materias: IMateriaPrima[];
  onGruposChange: (grupos: IFoodGrupoOpcaoResumo[]) => void;
}

type PrecoForm  = { value: string; originalValue: string };
type NomeForm   = { name: string };

export default function CardComplementos({
  empresaId, productId, grupos, materias, onGruposChange,
}: Props) {

  // ── Opção selecionada ──────────────────────────────────────────────────────
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);
  const [menuOpcaoAberto, setMenuOpcaoAberto] = useState<string | null>(null);
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<IFoodOpcaoResumo | null>(null);

  const [modalPreco, setModalPreco]     = useState(false);
  const [salvandoPreco, setSalvandoPreco] = useState(false);
  const [erroPreco, setErroPreco]       = useState<string | null>(null);

  const [modalVinculo, setModalVinculo]           = useState(false);
  const [materiaSelecionada, setMateriaSelecionada] = useState<number>(0);
  const [salvandoVinculo, setSalvandoVinculo]     = useState(false);

  // ── Grupo selecionado ──────────────────────────────────────────────────────
  const [menuGrupoAberto, setMenuGrupoAberto]         = useState<string | null>(null);
  const [grupoSelecionado, setGrupoSelecionado]       = useState<IFoodGrupoOpcaoResumo | null>(null);

  const [modalEditarNome, setModalEditarNome]         = useState(false);
  const [salvandoNome, setSalvandoNome]               = useState(false);
  const [erroNome, setErroNome]                       = useState<string | null>(null);

  const [modalExcluirGrupo, setModalExcluirGrupo]     = useState(false);
  const [excluindoGrupo, setExcluindoGrupo]           = useState(false);

  const [modalDesassociar, setModalDesassociar]       = useState(false);
  const [desassociando, setDesassociando]             = useState(false);

  const [togglingGrupoStatus, setTogglingGrupoStatus] = useState<string | null>(null);

  const { control, handleSubmit: handlePreco, reset: resetPreco, setValue } =
    useForm<PrecoForm>();
  const { control: controlNome, handleSubmit: handleNome, reset: resetNome,
    setValue: setValueNome } = useForm<NomeForm>();

  // ─── Helpers ────────────────────────────────────────────────────────────────

  function nomeMateria(externalCode?: string | null): string | null {
    const v = parseVinculo(externalCode);
    if (!v || v.tipo !== "materia") return null;
    return materias.find(m => m.id === v.id)?.nome ?? `Matéria #${v.id}`;
  }

  function grupoDeOpcao(opcaoId: string): IFoodGrupoOpcaoResumo | undefined {
    return grupos.find(g => g.options?.some(o => o.id === opcaoId));
  }

  function atualizarOpcao(grupoId: string, opcaoId: string, patch: Partial<IFoodOpcaoResumo>) {
    onGruposChange(grupos.map(g =>
      g.id !== grupoId ? g : {
        ...g,
        options: g.options?.map(o => o.id === opcaoId ? { ...o, ...patch } : o),
      }
    ));
  }

  // ─── Ações de opção ──────────────────────────────────────────────────────────

  async function toggleStatusOpcao(grupoId: string, opcao: IFoodOpcaoResumo) {
    setTogglingStatus(opcao.id);
    setMenuOpcaoAberto(null);
    try {
      const novoStatus = opcao.status === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE";
      const result = await ifoodCatalogService.editarStatusOpcao(empresaId, {
        optionId:                    opcao.id,
        status:                      novoStatus,
        parentCustomizationOptionId: null,
        statusByCatalog:             null,
      });
      if (result.sucesso) atualizarOpcao(grupoId, opcao.id, { status: novoStatus });
    } finally {
      setTogglingStatus(null);
    }
  }

  function abrirModalPreco(opcao: IFoodOpcaoResumo) {
    setOpcaoSelecionada(opcao);
    setValue("value",         String(opcao.price.value));
    setValue("originalValue", String(opcao.price.originalValue ?? ""));
    setErroPreco(null);
    setModalPreco(true);
    setMenuOpcaoAberto(null);
  }

  async function onSalvarPreco(form: PrecoForm) {
    if (!opcaoSelecionada) return;
    setSalvandoPreco(true);
    setErroPreco(null);
    try {
      const novoPreco = {
        value:         parseFloat(form.value),
        originalValue: form.originalValue ? parseFloat(form.originalValue) : null,
      };
      const result = await ifoodCatalogService.editarPrecoOpcao(empresaId, {
        optionId:                    opcaoSelecionada.id,
        price:                       novoPreco,
        parentCustomizationOptionId: null,
        priceByCatalog:              null,
      });
      if (result.sucesso) {
        const grupo = grupoDeOpcao(opcaoSelecionada.id);
        if (grupo) atualizarOpcao(grupo.id, opcaoSelecionada.id, { price: novoPreco });
        setModalPreco(false);
        resetPreco();
      } else {
        setErroPreco(result.erro);
      }
    } finally {
      setSalvandoPreco(false);
    }
  }

  function abrirModalVinculo(opcao: IFoodOpcaoResumo) {
    setOpcaoSelecionada(opcao);
    const v = parseVinculo(opcao.externalCode);
    setMateriaSelecionada(v?.tipo === "materia" ? v.id : 0);
    setMenuOpcaoAberto(null);
    setModalVinculo(true);
  }

  async function onSalvarVinculo() {
    if (!opcaoSelecionada) return;
    setSalvandoVinculo(true);
    try {
      const externalCode = materiaSelecionada > 0
        ? externalCodeMateria(materiaSelecionada)
        : null;
      const result = await ifoodCatalogService.editarExternalCodeOpcao(empresaId, {
        optionId:                    opcaoSelecionada.id,
        externalCode,
        parentCustomizationOptionId: null,
        externalCodeByCatalog:       null,
      });
      if (result.sucesso) {
        const grupo = grupoDeOpcao(opcaoSelecionada.id);
        if (grupo) atualizarOpcao(grupo.id, opcaoSelecionada.id, { externalCode });
        setModalVinculo(false);
      }
    } finally {
      setSalvandoVinculo(false);
    }
  }

  // ─── Ações de grupo ──────────────────────────────────────────────────────────

  async function toggleStatusGrupo(grupo: IFoodGrupoOpcaoResumo) {
    setTogglingGrupoStatus(grupo.id);
    setMenuGrupoAberto(null);
    try {
      const novoStatus = grupo.status === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE";
      const result = await ifoodCatalogService.editarStatusGrupoComplemento(
        empresaId, grupo.id, { status: novoStatus }
      );
      if (result.sucesso) {
        onGruposChange(grupos.map(g =>
          g.id === grupo.id ? { ...g, status: novoStatus } : g
        ));
      }
    } finally {
      setTogglingGrupoStatus(null);
    }
  }

  function abrirModalEditarNome(grupo: IFoodGrupoOpcaoResumo) {
    setGrupoSelecionado(grupo);
    setValueNome("name", grupo.name);
    setErroNome(null);
    setMenuGrupoAberto(null);
    setModalEditarNome(true);
  }

  async function onSalvarNome(form: NomeForm) {
    if (!grupoSelecionado) return;
    setSalvandoNome(true);
    setErroNome(null);
    try {
      const result = await ifoodCatalogService.editarNomeGrupoComplemento(
        empresaId, grupoSelecionado.id, { name: form.name }
      );
      if (result.sucesso) {
        onGruposChange(grupos.map(g =>
          g.id === grupoSelecionado.id ? { ...g, name: form.name } : g
        ));
        setModalEditarNome(false);
        resetNome();
      } else {
        setErroNome(result.erro);
      }
    } finally {
      setSalvandoNome(false);
    }
  }

  function abrirModalExcluir(grupo: IFoodGrupoOpcaoResumo) {
    setGrupoSelecionado(grupo);
    setMenuGrupoAberto(null);
    setModalExcluirGrupo(true);
  }

  async function onExcluirGrupo() {
    if (!grupoSelecionado) return;
    setExcluindoGrupo(true);
    try {
      const result = await ifoodCatalogService.excluirGrupoComplemento(
        empresaId, grupoSelecionado.id
      );
      if (result.sucesso) {
        onGruposChange(grupos.filter(g => g.id !== grupoSelecionado.id));
        setModalExcluirGrupo(false);
      }
    } finally {
      setExcluindoGrupo(false);
    }
  }

  function abrirModalDesassociar(grupo: IFoodGrupoOpcaoResumo) {
    setGrupoSelecionado(grupo);
    setMenuGrupoAberto(null);
    setModalDesassociar(true);
  }

  async function onDesassociar() {
    if (!grupoSelecionado) return;
    setDesassociando(true);
    try {
      const result = await ifoodCatalogService.desassociarGrupoComplementoDoProduto(
        empresaId, grupoSelecionado.id, productId
      );
      if (result.sucesso) {
        onGruposChange(grupos.filter(g => g.id !== grupoSelecionado.id));
        setModalDesassociar(false);
      }
    } finally {
      setDesassociando(false);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className={styles.wrapper}>
      {grupos.map(grupo => (
        <div key={grupo.id} className={styles.grupoCard}>

          {/* ── Header do grupo ── */}
          <div className={styles.grupoHeader}>
            <div className={styles.grupoInfo}>
              <span className={styles.grupoNome}>{grupo.name}</span>
              <span className={`${styles.grupoBadge} ${grupo.status === "AVAILABLE" ? styles.ativo : styles.pausado}`}>
                {grupo.status === "AVAILABLE" ? "Ativo" : "Pausado"}
              </span>
            </div>
            <div className={styles.grupoAcoes}>
              <button className={styles.iconBtn}
                disabled={togglingGrupoStatus === grupo.id}
                title={grupo.status === "AVAILABLE" ? "Pausar grupo" : "Ativar grupo"}
                onClick={() => toggleStatusGrupo(grupo)}>
                {grupo.status === "AVAILABLE" ? <FiPause size={13} /> : <FiPlay size={13} />}
              </button>

              <div className={styles.menuWrapper}>
                <button className={styles.iconBtn}
                  onClick={() => setMenuGrupoAberto(
                    menuGrupoAberto === grupo.id ? null : grupo.id
                  )}>
                  <FiMoreVertical size={13} />
                </button>
                {menuGrupoAberto === grupo.id && (
                  <div className={styles.dropdown}>
                    <button className={styles.dropdownItem}
                      onClick={() => abrirModalEditarNome(grupo)}>
                      <FiEdit2 size={12} /> Editar nome
                    </button>
                    <button className={styles.dropdownItem}
                      onClick={() => toggleStatusGrupo(grupo)}>
                      {grupo.status === "AVAILABLE"
                        ? <><FiPause size={12} /> Pausar grupo</>
                        : <><FiPlay size={12} /> Ativar grupo</>
                      }
                    </button>
                    <button className={styles.dropdownItem}
                      onClick={() => abrirModalDesassociar(grupo)}>
                      <FiLink2 size={12} /> Desassociar do produto
                    </button>
                    <button className={`${styles.dropdownItem} ${styles.dropdownItemPerigo}`}
                      onClick={() => abrirModalExcluir(grupo)}>
                      <FiTrash2 size={12} /> Excluir grupo
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Opções ── */}
          <div className={styles.opcoesList}>
            {(grupo.options ?? []).map(opcao => (
              <div key={opcao.id}
                className={`${styles.opcaoRow} ${opcao.status !== "AVAILABLE" ? styles.opcaoPausada : ""}`}>

                {opcao.imagePath ? (
                  <img src={opcao.imagePath} alt={opcao.name} className={styles.opcaoImg} />
                ) : (
                  <div className={styles.opcaoImgPlaceholder}>
                    <FiEdit2 size={14} color="#ccc" />
                  </div>
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

                <button className={styles.iconBtn}
                  disabled={togglingStatus === opcao.id}
                  onClick={() => toggleStatusOpcao(grupo.id, opcao)}
                  title={opcao.status === "AVAILABLE" ? "Pausar" : "Ativar"}>
                  {opcao.status === "AVAILABLE" ? <FiPause size={13} /> : <FiPlay size={13} />}
                </button>

                <div className={styles.menuWrapper}>
                  <button className={styles.iconBtn}
                    onClick={() => setMenuOpcaoAberto(
                      menuOpcaoAberto === opcao.id ? null : opcao.id
                    )}>
                    <FiMoreVertical size={13} />
                  </button>
                  {menuOpcaoAberto === opcao.id && (
                    <div className={styles.dropdown}>
                      <button className={styles.dropdownItem}
                        onClick={() => abrirModalPreco(opcao)}>
                        <FiEdit2 size={12} /> Editar preço
                      </button>
                      <button className={styles.dropdownItem}
                        onClick={() => abrirModalVinculo(opcao)}>
                        <FiLink size={12} /> Vincular matéria prima
                      </button>
                      <button className={styles.dropdownItem}
                        onClick={() => toggleStatusOpcao(grupo.id, opcao)}>
                        {opcao.status === "AVAILABLE"
                          ? <><FiPause size={12} /> Pausar</>
                          : <><FiPlay size={12} /> Ativar</>
                        }
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* ── Modal editar preço da opção ── */}
      <BaseModal isOpen={modalPreco}
        title={`Editar preço — ${opcaoSelecionada?.name}`}
        setClose={() => { setModalPreco(false); setErroPreco(null); resetPreco(); }}
        width="380px">
        <form onSubmit={handlePreco(onSalvarPreco)} className={styles.form}>
          <div className={styles.precoRow}>
            <KRDInput label="Preço atual (R$)" name="value" type="number"
              control={control} width="50%" placeholder="0,00" />
            <KRDInput label="Preço original (R$)" name="originalValue" type="number"
              control={control} width="50%" placeholder="0,00" />
          </div>
          {erroPreco && <span className={styles.erro}>{erroPreco}</span>}
          <div className={styles.formActions}>
            <CustomButton typeButton="outline-main" type="button"
              onClick={() => { setModalPreco(false); resetPreco(); }}>
              Cancelar
            </CustomButton>
            <CustomButton typeButton="main" type="submit" loading={salvandoPreco}>
              Salvar
            </CustomButton>
          </div>
        </form>
      </BaseModal>

      {/* ── Modal vincular matéria prima ── */}
      <BaseModal isOpen={modalVinculo}
        title={`Vincular matéria prima — ${opcaoSelecionada?.name}`}
        setClose={() => setModalVinculo(false)}
        width="420px">
        <div className={styles.form}>
          <p className={styles.formDesc}>
            Selecione a matéria prima correspondente a este complemento.
          </p>
          {parseVinculo(opcaoSelecionada?.externalCode)?.tipo === "materia" && (
            <div className={styles.vinculoAtual}>
              <span className={styles.vinculoLabel}>Atual</span>
              <span className={styles.vinculoNome}>
                {nomeMateria(opcaoSelecionada?.externalCode)}
              </span>
              <button className={styles.removerBtn}
                onClick={() => setMateriaSelecionada(0)}>
                Remover
              </button>
            </div>
          )}
          <SelectMateriaPrima empresaId={empresaId} selected={materiaSelecionada}
            setSelected={(m: IMateriaPrima) => setMateriaSelecionada(m.id)} width="100%" />
          <div className={styles.formActions}>
            <CustomButton typeButton="outline-main" onClick={() => setModalVinculo(false)}>
              Cancelar
            </CustomButton>
            <CustomButton typeButton="main" loading={salvandoVinculo} onClick={onSalvarVinculo}>
              Vincular
            </CustomButton>
          </div>
        </div>
      </BaseModal>

      {/* ── Modal editar nome do grupo ── */}
      <BaseModal isOpen={modalEditarNome}
        title={`Editar nome — ${grupoSelecionado?.name}`}
        setClose={() => { setModalEditarNome(false); resetNome(); }}
        width="400px">
        <form onSubmit={handleNome(onSalvarNome)} className={styles.form}>
          <KRDInput label="Nome do grupo" name="name" control={controlNome}
            placeholder="Ex: Turbine seu lanche" />
          {erroNome && <span className={styles.erro}>{erroNome}</span>}
          <div className={styles.formActions}>
            <CustomButton typeButton="outline-main" type="button"
              onClick={() => { setModalEditarNome(false); resetNome(); }}>
              Cancelar
            </CustomButton>
            <CustomButton typeButton="main" type="submit" loading={salvandoNome}>
              Salvar
            </CustomButton>
          </div>
        </form>
      </BaseModal>

      {/* ── Modal excluir grupo ── */}
      <BaseModal isOpen={modalExcluirGrupo} title="Excluir grupo de complementos"
        setClose={() => setModalExcluirGrupo(false)} width="400px">
        <div className={styles.form}>
          <p className={styles.formDesc}>
            Tem certeza que deseja excluir o grupo{" "}
            <strong>{grupoSelecionado?.name}</strong>?
            Todos os produtos associados deixarão de recebê-lo.
          </p>
          <div className={styles.formActions}>
            <CustomButton typeButton="outline-main"
              onClick={() => setModalExcluirGrupo(false)}>
              Cancelar
            </CustomButton>
            <CustomButton typeButton="danger" loading={excluindoGrupo}
              onClick={onExcluirGrupo}>
              Excluir
            </CustomButton>
          </div>
        </div>
      </BaseModal>

      {/* ── Modal desassociar grupo do produto ── */}
      <BaseModal isOpen={modalDesassociar} title="Desassociar grupo do produto"
        setClose={() => setModalDesassociar(false)} width="400px">
        <div className={styles.form}>
          <p className={styles.formDesc}>
            O grupo <strong>{grupoSelecionado?.name}</strong> será removido deste produto.
            O grupo continuará existindo e poderá ser associado a outros produtos.
          </p>
          <div className={styles.formActions}>
            <CustomButton typeButton="outline-main"
              onClick={() => setModalDesassociar(false)}>
              Cancelar
            </CustomButton>
            <CustomButton typeButton="danger" loading={desassociando}
              onClick={onDesassociar}>
              Desassociar
            </CustomButton>
          </div>
        </div>
      </BaseModal>
    </div>
  );
}