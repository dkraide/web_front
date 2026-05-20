import { useState, useRef, useEffect } from "react";
import BaseModal from "@/components/Modals/Base/Index";
import CustomButton from "@/components/ui/Buttons";
import type {
  IFoodSalvarItemDto,
  IFoodProdutoPayload,
  IFoodGrupoOpcaoPayload,
  IFoodOpcaoPayload,
  IFoodOptionContextModifier,
} from "@/interfaces/ifoodCatalog";
import { ifoodCatalogService } from "@/services/ifoodCatalogService";
import styles from "./ModalAdicionarSabor.module.scss";
import { FiUpload } from "react-icons/fi";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Aba = "detalhes" | "preco" | "classificacao";

const ABAS: { key: Aba; label: string }[] = [
  { key: "detalhes", label: "Detalhes" },
  { key: "preco", label: "Preço e PDV" },
  { key: "classificacao", label: "Classificação" },
];

const RESTRICOES_OPCOES = [
  { value: "VEGETARIAN", label: "Vegetariano", desc: "Sem carne de nenhum tipo" },
  { value: "VEGAN", label: "Vegano", desc: "Sem produtos de origem animal" },
  { value: "ORGANIC", label: "Orgânico", desc: "Cultivado sem agrotóxicos, segundo a lei 10.831" },
  { value: "SUGAR_FREE", label: "Sem açúcar", desc: "Não contém nenhum tipo de açúcar" },
  { value: "LACTOSE_FREE", label: "Zero lactose", desc: "Não contém lactose, ou seja, leite e seus derivados" },
];

// ─── Tipos locais ─────────────────────────────────────────────────────────────

interface TamanhoConfig {
  optionId: string;
  nome: string;
  preco: number;
  precoOriginal: number | null;
  externalCode: string;
  ativo: boolean;
}

interface Props {
  isOpen: boolean;
  empresaId: number;
  catalogId: string;
  /** Item completo da pizza (GET /items/:id/flat) */
  itemPizza: IFoodSalvarItemDto;
  saborId?: string | null;
  onClose: () => void;
  /** Chamado após salvar com sucesso — retorna o item atualizado */
  onSalvo: (itemAtualizado: IFoodSalvarItemDto) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extrairTamanhos(item: IFoodSalvarItemDto): TamanhoConfig[] {
  const grupoSize = item.optionGroups.find(g => g.optionGroupType === "SIZE");
  if (!grupoSize) return [];

  return grupoSize.optionIds.map(optId => {
    const opt = item.options.find(o => o.id === optId);
    const prod = opt ? item.products.find(p => p.id === opt.productId) : null;
    return {
      optionId: optId,
      nome: prod?.name ?? optId,
      preco: 0,
      precoOriginal: null,
      externalCode: "",
      ativo: true,
    };
  });
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function ModalAdicionarSabor({
  isOpen, empresaId, catalogId, itemPizza, onClose, onSalvo, saborId
}: Props) {


  const [abaAtiva, setAbaAtiva] = useState<Aba>("detalhes");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [codigoPdv, setCodigoPdv] = useState("");
  const [imagemBase64, setImagemBase64] = useState<string | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [tamanhos, setTamanhos] = useState<TamanhoConfig[]>(() =>
    extrairTamanhos(itemPizza)
  );

  const [restricoes, setRestricoes] = useState<string[]>([]);

  useEffect(() => {
    if (!saborId || !isOpen) return;

    // Encontra a option do sabor
    const opt = itemPizza.options.find(o => o.id === saborId);
    const prod = opt ? itemPizza.products.find(p => p.id === opt.productId) : null;
    if (!prod) return;

    setNome(prod.name ?? "");
    setDescricao(prod.description ?? "");
    setCodigoPdv(opt.externalCode ?? "");
    if (prod.imagePath) setImagemPreview(prod.imagePath);
    setRestricoes(prod.dietaryRestrictions ?? []);

    // Popula preços por tamanho via contextModifiers da option
    setTamanhos(prev => prev.map(t => {
      const cm = opt.contextModifiers?.find(
        cm => cm.parentOptionId === t.optionId && cm.catalogContext === "DEFAULT"
      );
      return cm ? {
        ...t,
        preco: cm.price?.value ?? 0,
        precoOriginal: cm.price?.originalValue ?? null,
      } : t;
    }));
  }, [saborId, isOpen]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

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

  function updateTamanho(idx: number, patch: Partial<TamanhoConfig>) {
    setTamanhos(p => p.map((t, i) => i === idx ? { ...t, ...patch } : t));
  }

  function toggleRestricao(value: string) {
    setRestricoes(p =>
      p.includes(value) ? p.filter(r => r !== value) : [...p, value]
    );
  }

  function resetForm() {
    setAbaAtiva("detalhes");
    setNome(""); setDescricao(""); setCodigoPdv("");
    setImagemBase64(null); setImagemPreview(null);
    setTamanhos(extrairTamanhos(itemPizza));
    setRestricoes([]);
    setErro(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function abaValida(aba: Aba): boolean {
    if (aba === "detalhes") return nome.trim().length > 0;
    return true;
  }

  async function salvar() {
    if (!abaValida("detalhes")) {
      setAbaAtiva("detalhes");
      setErro("Preencha o nome do sabor.");
      return;
    }

    setSalvando(true);
    setErro(null);

    try {
      const grupoSize = itemPizza.optionGroups.find(g => g.optionGroupType === "SIZE");
      const grupoTop = itemPizza.optionGroups.find(g => g.optionGroupType === "TOPPING");
      const grupoCrust = itemPizza.optionGroups.find(g => g.optionGroupType === "CRUST");
      const grupoEdge = itemPizza.optionGroups.find(g => g.optionGroupType === "EDGE");

      const categoryId = itemPizza.item.categoryId;
      if (!categoryId) {
        setErro("Não foi possível identificar a categoria da pizza.");
        return;
      }
      // Upload de imagem ANTES de montar o payload
      let imagePath: string | null = null;
      if (imagemBase64) {
        const upResult = await ifoodCatalogService.uploadImagem(empresaId, imagemBase64);
        if (!upResult.sucesso) {
          setErro(`Falha ao fazer upload da imagem: ${upResult.erro}`);
          return;
        }
        imagePath = upResult.dados.imagePath;
      } else if (imagemPreview && !imagemPreview.startsWith("data:")) {
        imagePath = imagemPreview;
      }

      const isEdicao = !!saborId;

      // Na edição, reutiliza os IDs existentes — na criação, gera novos
      const optionExistente = isEdicao
        ? itemPizza.options.find(o => o.id === saborId)
        : null;
      const produtoExistente = optionExistente
        ? itemPizza.products.find(p => p.id === optionExistente.productId)
        : null;

      const saborOptionId = isEdicao ? saborId! : crypto.randomUUID();
      const saborProductId = isEdicao ? (optionExistente?.productId ?? crypto.randomUUID())
        : crypto.randomUUID();

      // ── Produtos ──────────────────────────────────────────────────────────
      const produtosFinaisBase: IFoodProdutoPayload[] = itemPizza.products.map(p => {
        // Na edição, atualiza o produto do sabor
        if (isEdicao && p.id === saborProductId) {
          return {
            ...p,
            name: nome,
            description: descricao || null,
            externalCode: codigoPdv || null,
             imagePath,
            dietaryRestrictions: restricoes.length > 0 ? restricoes : null,
          };
        }
        return { ...p };
      });

      // Na criação, adiciona o novo produto
      if (!isEdicao) {
        produtosFinaisBase.push({
          id: saborProductId,
          name: nome,
          description: descricao || null,
          additionalInformation: null,
          externalCode: codigoPdv || null,
          imagePath,
          ean: null,
          serving: null,
          dietaryRestrictions: restricoes.length > 0 ? restricoes : null,
          tags: null,
          quantity: null,
          optionGroups: null,
        });
      }

      // ── contextModifiers do sabor (preços por tamanho × catálogo) ─────────
      const contextModifiers: IFoodOptionContextModifier[] = tamanhos
        .filter(t => t.ativo)
        .flatMap(t => ([
          {
            parentOptionId: t.optionId,
            catalogContext: "DEFAULT",
            status: "AVAILABLE",
            price: { value: t.preco, originalValue: t.precoOriginal },
            externalCode: null,
          },
          {
            parentOptionId: t.optionId,
            catalogContext: "WHITELABEL",
            status: "AVAILABLE",
            price: { value: t.preco, originalValue: t.precoOriginal },
            externalCode: null,
          },
        ]));

      // ── Options ───────────────────────────────────────────────────────────
      const opcoesFinais: IFoodOpcaoPayload[] = itemPizza.options.map(o => {
        // Na edição, substitui a option do sabor
        if (isEdicao && o.id === saborOptionId) {
          return {
            ...o,
            externalCode: codigoPdv || null,
            contextModifiers,
          };
        }
        return { ...o };
      });

      // Na criação, adiciona a nova option
      if (!isEdicao) {
        opcoesFinais.push({
          id: saborOptionId,
          status: "AVAILABLE",
          index: opcoesFinais.filter(o =>
            grupoTop?.optionIds.includes(o.id)
          ).length,
          productId: saborProductId,
          price: null,
          fractions: null,
          externalCode: codigoPdv || null,
          contextModifiers,
        });
      }

      // ── OptionGroups — só adiciona ao TOPPING se for criação ──────────────
      const gruposAtualizados: IFoodGrupoOpcaoPayload[] = itemPizza.optionGroups.map(og => {
        if (og.optionGroupType !== "TOPPING") return { ...og };
        return {
          ...og,
          optionIds: isEdicao
            ? og.optionIds                           // edição: mantém lista
            : [...og.optionIds, saborOptionId],      // criação: adiciona
        };
      });

      // ── Produto raiz ──────────────────────────────────────────────────────
      const produtoRaizId = itemPizza.item.productId;
      const produtosFinais: IFoodProdutoPayload[] = produtosFinaisBase.map(p => {
        if (p.id !== produtoRaizId) return p;
        return {
          ...p,
          optionGroups: gruposAtualizados.map(og => ({
            id: og.id,
            min: og.min ?? 0,
            max: og.max ?? 1,
          })),
        };
      });

      // ── Payload final ─────────────────────────────────────────────────────
      const payload: IFoodSalvarItemDto = {
        item: {
          ...itemPizza.item,
          categoryId,
          contextModifiers: itemPizza.item.contextModifiers
            ?.filter(cm => cm.status === "AVAILABLE" || cm.status === "UNAVAILABLE")
            ?? null,
        },
        products: produtosFinais,
        optionGroups: gruposAtualizados,
        options: opcoesFinais,
      };

      const result = await ifoodCatalogService.salvarItem(empresaId, payload);

      if (result.sucesso) {
        const itemAtualizado = await ifoodCatalogService.obterItemFlat(
          empresaId, itemPizza.item.id
        );
        if (itemAtualizado.sucesso) onSalvo(itemAtualizado.dados);
        resetForm();
        onClose();
      } else {
        setErro(result.erro ?? "Erro ao salvar sabor.");
      }
    } catch {
      setErro("Erro inesperado. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <BaseModal isOpen={isOpen} title="Novo sabor de pizza"
      setClose={handleClose} width="720px">
      <div className={styles.wrapper}>

        {/* Abas */}
        <nav className={styles.abas}>
          {ABAS.map(a => (
            <button key={a.key} type="button"
              className={`${styles.aba} ${abaAtiva === a.key ? styles.abaAtiva : ""}`}
              onClick={() => setAbaAtiva(a.key)}>
              {a.label}
            </button>
          ))}
        </nav>

        {/* ══ DETALHES ══ */}
        {abaAtiva === "detalhes" && (
          <div className={styles.abaContent}>
            <div className={styles.detalhesGrid}>
              <div className={styles.detalhesLeft}>
                <div className={styles.field}>
                  <label className={styles.label}>Nome do item</label>
                  <input className={styles.input} maxLength={80}
                    placeholder="Exemplo: Pizza de frango com catupiry"
                    value={nome} onChange={e => setNome(e.target.value)} />
                  <span className={styles.charCount}>{nome.length}/80</span>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Descrição</label>
                  <textarea className={styles.textarea} maxLength={1000} rows={5}
                    placeholder="Exemplo: Molho de tomate, mussarela, frango desfiado, catupiry e tomate."
                    value={descricao} onChange={e => setDescricao(e.target.value)} />
                  <span className={styles.charCount}>{descricao.length}/1000</span>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Código PDV</label>
                  <input className={styles.inputSm} placeholder="000"
                    value={codigoPdv} onChange={e => setCodigoPdv(e.target.value)} />
                </div>
              </div>

              <div className={styles.detalhesRight}>
                <label className={styles.label}>Imagem do item</label>
                <div className={styles.imagemBox} onClick={() => fileRef.current?.click()}>
                  {imagemPreview ? (
                    <img src={imagemPreview} alt="preview" className={styles.imagemPreview} />
                  ) : (
                    <div className={styles.imagemPlaceholder}>
                      <div className={styles.imagemPlaceholderIcon}>🍽️</div>
                    </div>
                  )}
                  <button type="button" className={styles.btnEscolherImagem}>
                    <FiUpload size={14} /> Escolher imagem
                  </button>
                  <input ref={fileRef} type="file" accept="image/*"
                    style={{ display: "none" }} onChange={handleImagem} />
                </div>
                <div className={styles.dicaImagem}>
                  <p className={styles.dicaImagemTitulo}>Onde a foto aparece?</p>
                  <p className={styles.dicaImagemDesc}>
                    A imagem será exibida no app do iFood{" "}
                    <strong>dentro das opções de sabores</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ PREÇO E PDV ══ */}
        {abaAtiva === "preco" && (
          <div className={styles.abaContent}>
            {tamanhos.length === 0 ? (
              <p className={styles.semTamanhos}>Nenhum tamanho encontrado nesta pizza.</p>
            ) : (
              <div className={styles.tamanhosPrecoList}>
                {tamanhos.map((t, idx) => (
                  <div key={t.optionId} className={styles.tamanhoPrecoItem}>
                    <div className={styles.tamanhoPrecoHeader}>
                      <span className={styles.tamanhoPrecoIcon}>🍕</span>
                      <span className={styles.tamanhoPrecoNome}>{t.nome}</span>
                    </div>

                    <div className={styles.tamanhoPrecoFields}>
                      <div className={styles.tamanhoPrecoField}>
                        <label className={styles.label}>Preço</label>
                        <div className={styles.precoInputWrapper}>
                          <span className={styles.prefixo}>R$</span>
                          <input type="number" min={0} step={0.01}
                            className={styles.precoInput}
                            value={t.preco || ""}
                            placeholder="0,00"
                            onChange={e => updateTamanho(idx, {
                              preco: parseFloat(e.target.value) || 0,
                            })} />
                        </div>
                      </div>

                      <div className={styles.tamanhoPrecoToggle}>
                        <label className={styles.label}>Ativado</label>
                        <label className={styles.toggle}>
                          <input type="checkbox" checked={t.ativo}
                            onChange={e => updateTamanho(idx, { ativo: e.target.checked })} />
                          <span className={styles.toggleSlider} />
                        </label>
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Código PDV</label>
                      <input className={styles.inputSm} placeholder="000"
                        value={t.externalCode}
                        onChange={e => updateTamanho(idx, { externalCode: e.target.value })} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ CLASSIFICAÇÃO ══ */}
        {abaAtiva === "classificacao" && (
          <div className={styles.abaContent}>
            <h3 className={styles.classificacaoTitulo}>Classificação</h3>
            <p className={styles.classificacaoDesc}>
              Indique se seu item é adequado a restrições alimentares diversas para atrair
              clientes com esse perfil no app do iFood.
            </p>
            <div className={styles.aviso}>
              ⚠️ Lembre-se que você é responsável por todas as informações sobre os itens,
              conforme nossos Termos e Condições.
            </div>
            <p className={styles.restricoesTitulo}>Restrições alimentares:</p>
            <div className={styles.restricoesList}>
              {RESTRICOES_OPCOES.map(r => (
                <label key={r.value} className={styles.restricaoItem}>
                  <input type="checkbox" className={styles.restricaoCheck}
                    checked={restricoes.includes(r.value)}
                    onChange={() => toggleRestricao(r.value)} />
                  <div>
                    <p className={styles.restricaoLabel}>{r.label}</p>
                    <p className={styles.restricaoDesc}>{r.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Rodapé */}
        {erro && <p className={styles.erro}>{erro}</p>}

        <div className={styles.footer}>
          <CustomButton typeButton="outline-main" type="button" onClick={handleClose}>
            Cancelar
          </CustomButton>
          {abaAtiva !== "classificacao" ? (
            <CustomButton typeButton="main" type="button"
              disabled={!abaValida(abaAtiva)}
              onClick={() => {
                const idx = ABAS.findIndex(a => a.key === abaAtiva);
                setAbaAtiva(ABAS[idx + 1].key);
              }}>
              Continuar
            </CustomButton>
          ) : (
            <CustomButton typeButton="main" type="button"
              loading={salvando} onClick={salvar}>
              Salvar sabor
            </CustomButton>
          )}
        </div>
      </div>
    </BaseModal>
  );
}