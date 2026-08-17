'use client';

import { useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { Spinner } from 'react-bootstrap';
import { AuthContext } from '@/contexts/AuthContext';
import IUsuario from '@/interfaces/IUsuario';
import { produtoService } from '@/services/produtoService';
import {
  ICardapioIA,
  IProdutoCardapioIA,
  IGrupoAdicionalIA,
  IPizzaCardapioIA,
  ITamanhoIA,
  IMassaIA,
  IBordaIA,
  ISaborIA,
  IPrecoTamanhoIA,
  TipoCardapio,
} from '@/interfaces/ICardapioIA';
import { GetCurrencyBRL } from '@/utils/functions';
import styles from './styles.module.scss';

type UploadedImage = {
  preview: string;
  status: 'loading' | 'done' | 'error';
};

const TIPOS: { value: TipoCardapio; label: string; hint: string }[] = [
  { value: 'AUTO', label: 'Automático', hint: 'A I.A identifica' },
  { value: 'LANCHE', label: 'Lanchonete', hint: 'Lanches' },
  { value: 'PIZZA', label: 'Pizzaria', hint: 'Pizzas' },
];

// produto em branco para "adicionar manualmente"
const novoProduto = (): IProdutoCardapioIA => ({
  nome: '',
  classe: '',
  descricao: '',
  valorVenda: 0,
  valorCusto: 0,
  codigo: 0,
  ncm: '',
  cfop: '',
  csosn: '',
  ingredientes: [],
  gruposAdicionais: [],
});

// cardapio vazio — base para quando ainda nao ha nada carregado.
const cardapioVazio = (): ICardapioIA => ({
  tipoDetectado: 'LANCHE',
  classes: [],
  gruposAdicionais: [],
  produtos: [],
  pizzas: [],
});

// pizza salgada em branco (uma nova "linha" de pizza).
const novaPizza = (doce = false): IPizzaCardapioIA => ({
  nome: doce ? 'Pizzas Doces' : 'Pizzas Salgadas',
  classe: 'PIZZAS',
  doce,
  ncm: '21069090',
  cfop: '5102',
  csosn: '102',
  tamanhos: [{ nome: 'Média', qtdSabores: 2 }],
  massas: [],
  bordas: [],
  sabores: [],
});

export default function MontarCardapioIA() {
  const { getUser } = useContext(AuthContext);
  const [user, setUser] = useState<IUsuario>();
  const [tipo, setTipo] = useState<TipoCardapio>('AUTO');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [cardapio, setCardapio] = useState<ICardapioIA | null>(null);
  const [loadingIA, setLoadingIA] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aberto, setAberto] = useState<number>(-1);
  const [abertaPizza, setAbertaPizza] = useState<number>(-1);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getUser().then(setUser);
  }, []);

  /* ───────────── Upload + leitura I.A ───────────── */
  async function onFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !user) return;
    e.target.value = '';

    const novasImgs: UploadedImage[] = files.map((f) => ({
      preview: URL.createObjectURL(f),
      status: 'loading',
    }));
    setImages((prev) => [...prev, ...novasImgs]);
    setLoadingIA(true);

    try {
      const data = await produtoService.lerCardapio(user.empresaSelecionada, files, tipo);
      setCardapio((prev) => mergeCardapio(prev, data));
      setImages((prev) =>
        prev.map((img) => (novasImgs.includes(img) ? { ...img, status: 'done' } : img))
      );
      const qtd = data?.produtos?.length ?? 0;
      toast.success(`${qtd} produto(s) identificado(s)!`);
    } catch (err: any) {
      setImages((prev) =>
        prev.map((img) => (novasImgs.includes(img) ? { ...img, status: 'error' } : img))
      );
      toast.error(`Erro ao ler o cardápio: ${err.response?.data || err.message}`);
    } finally {
      setLoadingIA(false);
    }
  }

  // combina resultados de varias fotos: junta classes, grupos (por descricao) e produtos (por nome)
  function mergeCardapio(prev: ICardapioIA | null, novo: ICardapioIA): ICardapioIA {
    if (!prev) return novo;
    const classes = Array.from(new Set([...prev.classes, ...(novo.classes ?? [])]));

    const grupos = [...prev.gruposAdicionais];
    (novo.gruposAdicionais ?? []).forEach((g) => {
      if (!grupos.some((x) => x.descricao.toLowerCase() === g.descricao.toLowerCase()))
        grupos.push(g);
    });

    const produtos = [...prev.produtos];
    (novo.produtos ?? []).forEach((p) => {
      if (!produtos.some((x) => x.nome.toLowerCase() === p.nome.toLowerCase()))
        produtos.push(p);
    });

    // Pizzas: junta por nome. Se a mesma "linha" (ex: Pizzas Especiais) vier em
    // fotos diferentes, mescla os sabores (por nome) na entrada existente.
    const pizzas = [...(prev.pizzas ?? [])];
    (novo.pizzas ?? []).forEach((pz) => {
      const existente = pizzas.find((x) => x.nome.toLowerCase() === pz.nome.toLowerCase());
      if (!existente) {
        pizzas.push(pz);
      } else {
        (pz.sabores ?? []).forEach((s) => {
          if (!existente.sabores.some((x) => x.nome.toLowerCase() === s.nome.toLowerCase()))
            existente.sabores.push(s);
        });
        if ((existente.tamanhos?.length ?? 0) === 0 && (pz.tamanhos?.length ?? 0) > 0)
          existente.tamanhos = pz.tamanhos;
      }
    });

    return {
      tipoDetectado: novo.tipoDetectado || prev.tipoDetectado,
      classes,
      gruposAdicionais: grupos,
      produtos,
      pizzas,
    };
  }

  /* ───────────── Helpers de edição ───────────── */
  function patchProduto(idx: number, patch: Partial<IProdutoCardapioIA>) {
    setCardapio((c) =>
      c
        ? { ...c, produtos: c.produtos.map((p, i) => (i === idx ? { ...p, ...patch } : p)) }
        : c
    );
  }

  function removerProduto(idx: number) {
    setCardapio((c) => (c ? { ...c, produtos: c.produtos.filter((_, i) => i !== idx) } : c));
  }

  function adicionarProduto() {
    setCardapio((c) => {
      const base = c ?? cardapioVazio();
      const produtos = [...base.produtos, novoProduto()];
      setAberto(produtos.length - 1);
      return { ...base, produtos };
    });
  }

  function toggleGrupoNoProduto(idx: number, descricao: string) {
    setCardapio((c) => {
      if (!c) return c;
      return {
        ...c,
        produtos: c.produtos.map((p, i) => {
          if (i !== idx) return p;
          const tem = p.gruposAdicionais.includes(descricao);
          return {
            ...p,
            gruposAdicionais: tem
              ? p.gruposAdicionais.filter((g) => g !== descricao)
              : [...p.gruposAdicionais, descricao],
          };
        }),
      };
    });
  }

  function addIngrediente(idx: number, nome: string) {
    const n = nome.trim();
    if (!n) return;
    setCardapio((c) =>
      c
        ? {
            ...c,
            produtos: c.produtos.map((p, i) =>
              i === idx ? { ...p, ingredientes: [...p.ingredientes, { nome: n, quantidade: 1 }] } : p
            ),
          }
        : c
    );
  }

  function removeIngrediente(idx: number, ingIdx: number) {
    setCardapio((c) =>
      c
        ? {
            ...c,
            produtos: c.produtos.map((p, i) =>
              i === idx
                ? { ...p, ingredientes: p.ingredientes.filter((_, j) => j !== ingIdx) }
                : p
            ),
          }
        : c
    );
  }

  /* ───────────── Grupos de adicionais ───────────── */
  function patchGrupo(idx: number, patch: Partial<IGrupoAdicionalIA>) {
    setCardapio((c) =>
      c
        ? { ...c, gruposAdicionais: c.gruposAdicionais.map((g, i) => (i === idx ? { ...g, ...patch } : g)) }
        : c
    );
  }

  function addGrupo() {
    setCardapio((c) => {
      const base = c ?? cardapioVazio();
      return {
        ...base,
        gruposAdicionais: [
          ...base.gruposAdicionais,
          { descricao: 'Novo grupo', minimo: 0, maximo: 0, itens: [] },
        ],
      };
    });
  }

  function removeGrupo(idx: number) {
    setCardapio((c) => {
      if (!c) return c;
      const desc = c.gruposAdicionais[idx]?.descricao;
      return {
        ...c,
        gruposAdicionais: c.gruposAdicionais.filter((_, i) => i !== idx),
        // remove a referencia nos produtos
        produtos: c.produtos.map((p) => ({
          ...p,
          gruposAdicionais: p.gruposAdicionais.filter((g) => g !== desc),
        })),
      };
    });
  }

  function addItemGrupo(idx: number) {
    setCardapio((c) =>
      c
        ? {
            ...c,
            gruposAdicionais: c.gruposAdicionais.map((g, i) =>
              i === idx ? { ...g, itens: [...g.itens, { nome: '', valor: 0 }] } : g
            ),
          }
        : c
    );
  }

  function patchItemGrupo(idx: number, itIdx: number, patch: Partial<{ nome: string; valor: number }>) {
    setCardapio((c) =>
      c
        ? {
            ...c,
            gruposAdicionais: c.gruposAdicionais.map((g, i) =>
              i === idx
                ? { ...g, itens: g.itens.map((it, j) => (j === itIdx ? { ...it, ...patch } : it)) }
                : g
            ),
          }
        : c
    );
  }

  function removeItemGrupo(idx: number, itIdx: number) {
    setCardapio((c) =>
      c
        ? {
            ...c,
            gruposAdicionais: c.gruposAdicionais.map((g, i) =>
              i === idx ? { ...g, itens: g.itens.filter((_, j) => j !== itIdx) } : g
            ),
          }
        : c
    );
  }

  /* ───────────── Pizzas ───────────── */
  function updatePizza(idx: number, fn: (pz: IPizzaCardapioIA) => IPizzaCardapioIA) {
    setCardapio((c) =>
      c ? { ...c, pizzas: (c.pizzas ?? []).map((pz, i) => (i === idx ? fn(pz) : pz)) } : c
    );
  }

  function patchPizza(idx: number, patch: Partial<IPizzaCardapioIA>) {
    updatePizza(idx, (pz) => ({ ...pz, ...patch }));
  }

  function addPizza(doce = false) {
    setCardapio((c) => {
      const base = c ?? cardapioVazio();
      const pizzas = [...(base.pizzas ?? []), novaPizza(doce)];
      setAbertaPizza(pizzas.length - 1);
      return { ...base, pizzas };
    });
  }

  function removePizza(idx: number) {
    setCardapio((c) => (c ? { ...c, pizzas: (c.pizzas ?? []).filter((_, i) => i !== idx) } : c));
  }

  // ── tamanhos ──
  function addTamanho(idx: number) {
    updatePizza(idx, (pz) => ({
      ...pz,
      tamanhos: [...pz.tamanhos, { nome: '', qtdSabores: 2 }],
    }));
  }
  function patchTamanho(idx: number, ti: number, patch: Partial<ITamanhoIA>) {
    updatePizza(idx, (pz) => ({
      ...pz,
      tamanhos: pz.tamanhos.map((t, i) => (i === ti ? { ...t, ...patch } : t)),
    }));
  }
  // Ao renomear um tamanho, atualiza a referencia nos precos de sabores/bordas.
  function renameTamanho(idx: number, ti: number, novoNome: string) {
    updatePizza(idx, (pz) => {
      const antigo = pz.tamanhos[ti]?.nome ?? '';
      const casa = (t: string) => t === antigo;
      const fix = (precos: IPrecoTamanhoIA[]) =>
        precos.map((p) => (casa(p.tamanho) ? { ...p, tamanho: novoNome } : p));
      return {
        ...pz,
        tamanhos: pz.tamanhos.map((t, i) => (i === ti ? { ...t, nome: novoNome } : t)),
        sabores: pz.sabores.map((s) => ({ ...s, precos: fix(s.precos) })),
        bordas: pz.bordas.map((b) => ({ ...b, precos: fix(b.precos) })),
      };
    });
  }
  function removeTamanho(idx: number, ti: number) {
    updatePizza(idx, (pz) => {
      const nome = pz.tamanhos[ti]?.nome ?? '';
      const drop = (precos: IPrecoTamanhoIA[]) => precos.filter((p) => p.tamanho !== nome);
      return {
        ...pz,
        tamanhos: pz.tamanhos.filter((_, i) => i !== ti),
        sabores: pz.sabores.map((s) => ({ ...s, precos: drop(s.precos) })),
        bordas: pz.bordas.map((b) => ({ ...b, precos: drop(b.precos) })),
      };
    });
  }

  // ── massas ──
  function addMassa(idx: number) {
    updatePizza(idx, (pz) => ({ ...pz, massas: [...pz.massas, { nome: '', valor: 0 }] }));
  }
  function patchMassa(idx: number, mi: number, patch: Partial<IMassaIA>) {
    updatePizza(idx, (pz) => ({
      ...pz,
      massas: pz.massas.map((m, i) => (i === mi ? { ...m, ...patch } : m)),
    }));
  }
  function removeMassa(idx: number, mi: number) {
    updatePizza(idx, (pz) => ({ ...pz, massas: pz.massas.filter((_, i) => i !== mi) }));
  }

  // ── preco por tamanho (usado em sabor e borda) ──
  const getPrecoTam = (precos: IPrecoTamanhoIA[], tamanho: string): number =>
    precos.find((p) => p.tamanho === tamanho)?.valor ?? 0;

  const setPrecoTam = (
    precos: IPrecoTamanhoIA[],
    tamanho: string,
    valor: number
  ): IPrecoTamanhoIA[] => {
    const existe = precos.some((p) => p.tamanho === tamanho);
    return existe
      ? precos.map((p) => (p.tamanho === tamanho ? { ...p, valor } : p))
      : [...precos, { tamanho, valor }];
  };

  // ── sabores ──
  function addSabor(idx: number) {
    updatePizza(idx, (pz) => ({
      ...pz,
      sabores: [...pz.sabores, { nome: '', descricao: '', precos: [] }],
    }));
  }
  function patchSabor(idx: number, si: number, patch: Partial<ISaborIA>) {
    updatePizza(idx, (pz) => ({
      ...pz,
      sabores: pz.sabores.map((s, i) => (i === si ? { ...s, ...patch } : s)),
    }));
  }
  function removeSabor(idx: number, si: number) {
    updatePizza(idx, (pz) => ({ ...pz, sabores: pz.sabores.filter((_, i) => i !== si) }));
  }
  function setPrecoSabor(idx: number, si: number, tamanho: string, valor: number) {
    updatePizza(idx, (pz) => ({
      ...pz,
      sabores: pz.sabores.map((s, i) =>
        i === si ? { ...s, precos: setPrecoTam(s.precos, tamanho, valor) } : s
      ),
    }));
  }

  // ── bordas ──
  function addBorda(idx: number) {
    updatePizza(idx, (pz) => ({ ...pz, bordas: [...pz.bordas, { nome: '', precos: [] }] }));
  }
  function patchBorda(idx: number, bi: number, patch: Partial<IBordaIA>) {
    updatePizza(idx, (pz) => ({
      ...pz,
      bordas: pz.bordas.map((b, i) => (i === bi ? { ...b, ...patch } : b)),
    }));
  }
  function removeBorda(idx: number, bi: number) {
    updatePizza(idx, (pz) => ({ ...pz, bordas: pz.bordas.filter((_, i) => i !== bi) }));
  }
  function setPrecoBorda(idx: number, bi: number, tamanho: string, valor: number) {
    updatePizza(idx, (pz) => ({
      ...pz,
      bordas: pz.bordas.map((b, i) =>
        i === bi ? { ...b, precos: setPrecoTam(b.precos, tamanho, valor) } : b
      ),
    }));
  }

  /* ───────────── Confirmar ───────────── */
  async function handleConfirmar() {
    if (!user || !cardapio) return;
    const validos = cardapio.produtos.filter((p) => p.nome.trim());

    // Pizzas validas: nome + ao menos 1 tamanho + ao menos 1 sabor com preco.
    const pizzasValidas = (cardapio.pizzas ?? []).filter((pz) => pz.nome.trim());
    for (const pz of pizzasValidas) {
      if ((pz.tamanhos?.length ?? 0) === 0) {
        toast.warning(`A pizza "${pz.nome}" precisa de ao menos um tamanho.`);
        return;
      }
      const semSabor =
        (pz.sabores?.length ?? 0) === 0 ||
        !pz.sabores.some((s) => s.nome.trim() && s.precos.some((p) => p.valor > 0));
      if (semSabor) {
        toast.warning(`A pizza "${pz.nome}" precisa de ao menos um sabor com preço.`);
        return;
      }
    }

    if (validos.length === 0 && pizzasValidas.length === 0) {
      toast.warning('Nenhum produto ou pizza com nome para cadastrar.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await produtoService.criarCardapio(user.empresaSelecionada, {
        ...cardapio,
        produtos: validos,
        pizzas: pizzasValidas,
      });
      toast.success(
        `${res.total} item(ns) criado(s)! (${res.classes} classe(s), ${res.gruposAdicionais} grupo(s))`
      );
      window.location.href = '/produto';
    } catch (err: any) {
      toast.error(`Erro ao criar produtos: ${err.response?.data || err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  const totalProdutos = cardapio?.produtos.length ?? 0;
  const totalPizzas = cardapio?.pizzas?.length ?? 0;

  /* ════════════════════════════ RENDER ════════════════════════════ */
  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.badge}>IA</span>
          <div>
            <h1 className={styles.title}>Montar cardápio através da foto</h1>
            <p className={styles.subtitle}>
              Envie fotos do cardápio e a I.A monta os produtos, ingredientes e adicionais para você revisar.
            </p>
          </div>
        </div>
      </div>

      {/* Seletor de tipo */}
      <div className={styles.tipoRow}>
        {TIPOS.map((t) => (
          <button
            key={t.value}
            className={`${styles.tipoBtn} ${tipo === t.value ? styles.tipoBtnAtivo : ''}`}
            onClick={() => setTipo(t.value)}
            disabled={loadingIA}
          >
            <strong>{t.label}</strong>
            <span>{t.hint}</span>
          </button>
        ))}
      </div>

      {/* Upload */}
      <div className={styles.uploadSection}>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className={styles.hiddenInput} onChange={onFilesSelected} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className={styles.hiddenInput} onChange={onFilesSelected} />

        {images.length === 0 ? (
          <div className={styles.uploadEmptyGrid}>
            <button className={styles.uploadOption} onClick={() => cameraInputRef.current?.click()} disabled={loadingIA}>
              <div className={styles.uploadIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
              <span className={styles.uploadLabel}>Tirar foto</span>
              <span className={styles.uploadHint}>Abrir câmera</span>
            </button>
            <button className={styles.uploadOption} onClick={() => fileInputRef.current?.click()} disabled={loadingIA}>
              <div className={styles.uploadIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M4 16l4-4 4 4 4-6 4 6" />
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                </svg>
              </div>
              <span className={styles.uploadLabel}>Galeria / Arquivo</span>
              <span className={styles.uploadHint}>JPG, PNG, HEIC</span>
            </button>
          </div>
        ) : (
          <div className={styles.imageGrid}>
            {images.map((img, idx) => (
              <div key={idx} className={styles.imageThumb}>
                <img src={img.preview} alt="" />
                <div className={`${styles.imageOverlay} ${styles[img.status]}`}>
                  {img.status === 'loading' && <Spinner animation="border" size="sm" />}
                  {img.status === 'done' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M5 13l4 4L19 7" /></svg>
                  )}
                  {img.status === 'error' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M6 18L18 6M6 6l12 12" /></svg>
                  )}
                </div>
              </div>
            ))}
            <button className={styles.addMoreBtn} onClick={() => cameraInputRef.current?.click()} disabled={loadingIA}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
              <span>Câmera</span>
            </button>
            <button className={styles.addMoreBtn} onClick={() => fileInputRef.current?.click()} disabled={loadingIA}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>
              <span>Galeria</span>
            </button>
          </div>
        )}
      </div>

      {loadingIA && (
        <div className={styles.loadingBanner}>
          <Spinner animation="border" size="sm" /> Lendo o cardápio com a I.A… isso pode levar alguns segundos.
        </div>
      )}

      {/* ───────────── Grupos de adicionais ───────────── */}
      {cardapio && (
        <>
          <div className={styles.sectionHead}>
            <h2>Grupos de adicionais</h2>
            <button className={styles.addLink} onClick={addGrupo}>+ Adicionar grupo</button>
          </div>

          {cardapio.gruposAdicionais.length === 0 && (
            <p className={styles.emptyHint}>Nenhum grupo de adicionais. A I.A não encontrou uma seção de adicionais no cardápio.</p>
          )}

          {cardapio.gruposAdicionais.map((g, gi) => (
            <div key={gi} className={styles.grupoCard}>
              <div className={styles.grupoHead}>
                <input
                  className={styles.grupoNome}
                  value={g.descricao}
                  placeholder="Nome do grupo (ex: Turbine seu lanche)"
                  onChange={(e) => patchGrupo(gi, { descricao: e.target.value })}
                />
                <div className={styles.minMax}>
                  <label>mín<input type="number" value={g.minimo} onChange={(e) => patchGrupo(gi, { minimo: +e.target.value })} /></label>
                  <label>máx<input type="number" value={g.maximo} onChange={(e) => patchGrupo(gi, { maximo: +e.target.value })} /></label>
                </div>
                <button className={styles.removeGrupo} onClick={() => removeGrupo(gi)}>Remover</button>
              </div>

              <div className={styles.itensGrupo}>
                {g.itens.map((it, ii) => (
                  <div key={ii} className={styles.itemGrupo}>
                    <input
                      className={styles.itemNome}
                      value={it.nome}
                      placeholder="Adicional"
                      onChange={(e) => patchItemGrupo(gi, ii, { nome: e.target.value })}
                    />
                    <div className={styles.itemValor}>
                      <span>R$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={it.valor}
                        onChange={(e) => patchItemGrupo(gi, ii, { valor: +e.target.value })}
                      />
                    </div>
                    <button className={styles.chipX} onClick={() => removeItemGrupo(gi, ii)}>×</button>
                  </div>
                ))}
                <button className={styles.addItemLink} onClick={() => addItemGrupo(gi)}>+ item</button>
              </div>
            </div>
          ))}

          {/* ───────────── Pizzas ───────────── */}
          <div className={styles.sectionHead}>
            <h2>Pizzas ({totalPizzas})</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className={styles.addLink} onClick={() => addPizza(false)}>+ Salgada</button>
              <button className={styles.addLink} onClick={() => addPizza(true)}>+ Doce</button>
            </div>
          </div>

          {totalPizzas === 0 && (
            <p className={styles.emptyHint}>Nenhuma pizza. Use o tipo “Pizzaria” ao enviar a foto, ou adicione manualmente.</p>
          )}

          <div className={styles.produtosList}>
            {(cardapio.pizzas ?? []).map((pz, zi) => (
              <PizzaCard
                key={zi}
                pizza={pz}
                classes={cardapio.classes}
                aberta={abertaPizza === zi}
                onToggle={() => setAbertaPizza(abertaPizza === zi ? -1 : zi)}
                onPatch={(patch) => patchPizza(zi, patch)}
                onRemove={() => removePizza(zi)}
                onAddTamanho={() => addTamanho(zi)}
                onPatchTamanho={(ti, patch) => patchTamanho(zi, ti, patch)}
                onRenameTamanho={(ti, nome) => renameTamanho(zi, ti, nome)}
                onRemoveTamanho={(ti) => removeTamanho(zi, ti)}
                onAddMassa={() => addMassa(zi)}
                onPatchMassa={(mi, patch) => patchMassa(zi, mi, patch)}
                onRemoveMassa={(mi) => removeMassa(zi, mi)}
                onAddSabor={() => addSabor(zi)}
                onPatchSabor={(si, patch) => patchSabor(zi, si, patch)}
                onRemoveSabor={(si) => removeSabor(zi, si)}
                onSetPrecoSabor={(si, t, v) => setPrecoSabor(zi, si, t, v)}
                onAddBorda={() => addBorda(zi)}
                onPatchBorda={(bi, patch) => patchBorda(zi, bi, patch)}
                onRemoveBorda={(bi) => removeBorda(zi, bi)}
                onSetPrecoBorda={(bi, t, v) => setPrecoBorda(zi, bi, t, v)}
                getPrecoTam={getPrecoTam}
              />
            ))}
          </div>

          {/* ───────────── Produtos ───────────── */}
          <div className={styles.sectionHead}>
            <h2>Produtos ({totalProdutos})</h2>
            <button className={styles.addLink} onClick={adicionarProduto}>+ Adicionar produto</button>
          </div>

          <div className={styles.produtosList}>
            {cardapio.produtos.map((p, pi) => (
              <ProdutoCard
                key={pi}
                idx={pi}
                produto={p}
                classes={cardapio.classes}
                grupos={cardapio.gruposAdicionais.map((g) => g.descricao).filter(Boolean)}
                aberto={aberto === pi}
                onToggle={() => setAberto(aberto === pi ? -1 : pi)}
                onPatch={(patch) => patchProduto(pi, patch)}
                onRemove={() => removerProduto(pi)}
                onToggleGrupo={(d) => toggleGrupoNoProduto(pi, d)}
                onAddIngrediente={(n) => addIngrediente(pi, n)}
                onRemoveIngrediente={(j) => removeIngrediente(pi, j)}
              />
            ))}
          </div>

          {/* Footer fixo */}
          <div className={styles.footer}>
            <div className={styles.footerStats}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Produtos</span>
                <span className={styles.statValue}>{totalProdutos}</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Pizzas</span>
                <span className={styles.statValue}>{totalPizzas}</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Grupos</span>
                <span className={styles.statValue}>{cardapio.gruposAdicionais.length}</span>
              </div>
            </div>
            <button className={styles.btnFinalizar} onClick={handleConfirmar} disabled={submitting || loadingIA || (totalProdutos === 0 && totalPizzas === 0)}>
              {submitting ? (<><Spinner animation="border" size="sm" /> Criando…</>) : `Confirmar e criar ${totalProdutos + totalPizzas} item(ns)`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════ Card de Produto (editável) ══════════════════ */
type ProdutoCardProps = {
  idx: number;
  produto: IProdutoCardapioIA;
  classes: string[];
  grupos: string[];
  aberto: boolean;
  onToggle: () => void;
  onPatch: (patch: Partial<IProdutoCardapioIA>) => void;
  onRemove: () => void;
  onToggleGrupo: (descricao: string) => void;
  onAddIngrediente: (nome: string) => void;
  onRemoveIngrediente: (ingIdx: number) => void;
};

function ProdutoCard({
  produto, classes, grupos, aberto, onToggle, onPatch, onRemove, onToggleGrupo, onAddIngrediente, onRemoveIngrediente,
}: ProdutoCardProps) {
  const [novoIng, setNovoIng] = useState('');

  return (
    <div className={styles.produtoCard}>
      <div className={styles.produtoResumo} onClick={onToggle}>
        <div className={styles.resumoInfo}>
          <span className={styles.chevron}>{aberto ? '▾' : '▸'}</span>
          <div>
            <strong>{produto.nome || 'Sem nome'}</strong>
            <span className={styles.resumoSub}>
              {produto.classe || 'sem classe'} · {produto.ingredientes.length} ingrediente(s)
            </span>
          </div>
        </div>
        <div className={styles.resumoPreco}>{GetCurrencyBRL(produto.valorVenda || 0)}</div>
      </div>

      {aberto && (
        <div className={styles.produtoEdit}>
          <div className={styles.grid2}>
            <label className={styles.field}>
              <span>Nome</span>
              <input value={produto.nome} onChange={(e) => onPatch({ nome: e.target.value })} />
            </label>
            <label className={styles.field}>
              <span>Classe</span>
              <input list="classes-list" value={produto.classe} onChange={(e) => onPatch({ classe: e.target.value })} />
              <datalist id="classes-list">
                {classes.map((c) => <option key={c} value={c} />)}
              </datalist>
            </label>
          </div>

          <div className={styles.grid4}>
            <label className={styles.field}>
              <span>Venda (R$)</span>
              <input type="number" step="0.01" value={produto.valorVenda} onChange={(e) => onPatch({ valorVenda: +e.target.value })} />
            </label>
            <label className={styles.field}>
              <span>Custo (R$)</span>
              <input type="number" step="0.01" value={produto.valorCusto} onChange={(e) => onPatch({ valorCusto: +e.target.value })} />
            </label>
            <label className={styles.field}>
              <span>Código</span>
              <input type="number" value={produto.codigo} placeholder="auto" onChange={(e) => onPatch({ codigo: +e.target.value })} />
            </label>
            <label className={styles.field}>
              <span>NCM</span>
              <input value={produto.ncm} onChange={(e) => onPatch({ ncm: e.target.value })} />
            </label>
          </div>

          <label className={styles.field}>
            <span>Descrição</span>
            <input value={produto.descricao} onChange={(e) => onPatch({ descricao: e.target.value })} />
          </label>

          {/* Ingredientes */}
          <div className={styles.field}>
            <span>Ingredientes (viram matéria-prima)</span>
            <div className={styles.chips}>
              {produto.ingredientes.map((ing, j) => (
                <span key={j} className={styles.chip}>
                  {ing.nome}
                  <button className={styles.chipX} onClick={() => onRemoveIngrediente(j)}>×</button>
                </span>
              ))}
            </div>
            <div className={styles.addChipRow}>
              <input
                value={novoIng}
                placeholder="Novo ingrediente"
                onChange={(e) => setNovoIng(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); onAddIngrediente(novoIng); setNovoIng(''); }
                }}
              />
              <button onClick={() => { onAddIngrediente(novoIng); setNovoIng(''); }}>Adicionar</button>
            </div>
          </div>

          {/* Grupos de adicionais */}
          {grupos.length > 0 && (
            <div className={styles.field}>
              <span>Grupos de adicionais</span>
              <div className={styles.gruposCheck}>
                {grupos.map((g) => (
                  <label key={g} className={styles.checkItem}>
                    <input
                      type="checkbox"
                      checked={produto.gruposAdicionais.includes(g)}
                      onChange={() => onToggleGrupo(g)}
                    />
                    {g}
                  </label>
                ))}
              </div>
            </div>
          )}

          <button className={styles.removerProduto} onClick={onRemove}>Remover produto</button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════ Card de Pizza (editável) ══════════════════ */
type PizzaCardProps = {
  pizza: IPizzaCardapioIA;
  classes: string[];
  aberta: boolean;
  onToggle: () => void;
  onPatch: (patch: Partial<IPizzaCardapioIA>) => void;
  onRemove: () => void;
  onAddTamanho: () => void;
  onPatchTamanho: (ti: number, patch: Partial<ITamanhoIA>) => void;
  onRenameTamanho: (ti: number, nome: string) => void;
  onRemoveTamanho: (ti: number) => void;
  onAddMassa: () => void;
  onPatchMassa: (mi: number, patch: Partial<IMassaIA>) => void;
  onRemoveMassa: (mi: number) => void;
  onAddSabor: () => void;
  onPatchSabor: (si: number, patch: Partial<ISaborIA>) => void;
  onRemoveSabor: (si: number) => void;
  onSetPrecoSabor: (si: number, tamanho: string, valor: number) => void;
  onAddBorda: () => void;
  onPatchBorda: (bi: number, patch: Partial<IBordaIA>) => void;
  onRemoveBorda: (bi: number) => void;
  onSetPrecoBorda: (bi: number, tamanho: string, valor: number) => void;
  getPrecoTam: (precos: IPrecoTamanhoIA[], tamanho: string) => number;
};

function PizzaCard({
  pizza, classes, aberta, onToggle, onPatch, onRemove,
  onAddTamanho, onPatchTamanho, onRenameTamanho, onRemoveTamanho,
  onAddMassa, onPatchMassa, onRemoveMassa,
  onAddSabor, onPatchSabor, onRemoveSabor, onSetPrecoSabor,
  onAddBorda, onPatchBorda, onRemoveBorda, onSetPrecoBorda,
  getPrecoTam,
}: PizzaCardProps) {
  const tamanhos = pizza.tamanhos ?? [];
  const nomesTamanho = tamanhos.map((t) => t.nome).filter(Boolean);
  const cellInput: React.CSSProperties = { width: 90 };

  return (
    <div className={styles.produtoCard}>
      <div className={styles.produtoResumo} onClick={onToggle}>
        <div className={styles.resumoInfo}>
          <span className={styles.chevron}>{aberta ? '▾' : '▸'}</span>
          <div>
            <strong>{pizza.nome || 'Pizza sem nome'} {pizza.doce ? '🍫' : '🍕'}</strong>
            <span className={styles.resumoSub}>
              {pizza.sabores.length} sabor(es) · {tamanhos.length} tamanho(s)
            </span>
          </div>
        </div>
      </div>

      {aberta && (
        <div className={styles.produtoEdit}>
          <div className={styles.grid2}>
            <label className={styles.field}>
              <span>Nome</span>
              <input value={pizza.nome} onChange={(e) => onPatch({ nome: e.target.value })} />
            </label>
            <label className={styles.field}>
              <span>Classe</span>
              <input list="classes-list-pizza" value={pizza.classe} onChange={(e) => onPatch({ classe: e.target.value })} />
              <datalist id="classes-list-pizza">
                {classes.map((c) => <option key={c} value={c} />)}
              </datalist>
            </label>
          </div>

          {/* Tamanhos */}
          <div className={styles.field}>
            <span>Tamanhos (Qtd. sabores = quantos sabores o tamanho aceita, ex.: 2 = meio a meio)</span>
            {tamanhos.map((t, ti) => (
              <div key={ti} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <input
                  placeholder="Nome (ex: Média)"
                  value={t.nome}
                  onChange={(e) => onRenameTamanho(ti, e.target.value)}
                  style={{ flex: 1 }}
                />
                <input
                  type="number"
                  title="Qtd. sabores"
                  value={t.qtdSabores}
                  onChange={(e) => onPatchTamanho(ti, { qtdSabores: +e.target.value })}
                  style={{ width: 70 }}
                />
                <button className={styles.chipX} onClick={() => onRemoveTamanho(ti)}>×</button>
              </div>
            ))}
            <button className={styles.addItemLink} onClick={onAddTamanho}>+ tamanho</button>
          </div>

          {/* Sabores (preço por tamanho) */}
          <div className={styles.field}>
            <span>Sabores (preço da pizza inteira por tamanho)</span>
            {pizza.sabores.map((s, si) => (
              <div key={si} style={{ border: '1px solid #eee', borderRadius: 8, padding: 8, marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <input
                    placeholder="Nome do sabor"
                    value={s.nome}
                    onChange={(e) => onPatchSabor(si, { nome: e.target.value })}
                    style={{ flex: 1 }}
                  />
                  <button className={styles.chipX} onClick={() => onRemoveSabor(si)}>×</button>
                </div>
                <input
                  placeholder="Ingredientes / descrição"
                  value={s.descricao}
                  onChange={(e) => onPatchSabor(si, { descricao: e.target.value })}
                  style={{ width: '100%', marginBottom: 6 }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {nomesTamanho.length === 0 && <em style={{ color: '#999' }}>Cadastre um tamanho primeiro.</em>}
                  {nomesTamanho.map((tn) => (
                    <label key={tn} style={{ display: 'flex', flexDirection: 'column', fontSize: 12 }}>
                      {tn}
                      <input
                        type="number"
                        step="0.01"
                        value={getPrecoTam(s.precos, tn)}
                        onChange={(e) => onSetPrecoSabor(si, tn, +e.target.value)}
                        style={cellInput}
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <button className={styles.addItemLink} onClick={onAddSabor}>+ sabor</button>
          </div>

          {/* Massas */}
          <div className={styles.field}>
            <span>Massas (deixe vazio para “Tradicional” R$ 0)</span>
            {pizza.massas.map((m, mi) => (
              <div key={mi} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <input placeholder="Nome da massa" value={m.nome} onChange={(e) => onPatchMassa(mi, { nome: e.target.value })} style={{ flex: 1 }} />
                <input type="number" step="0.01" title="Preço" value={m.valor} onChange={(e) => onPatchMassa(mi, { valor: +e.target.value })} style={{ width: 90 }} />
                <button className={styles.chipX} onClick={() => onRemoveMassa(mi)}>×</button>
              </div>
            ))}
            <button className={styles.addItemLink} onClick={onAddMassa}>+ massa</button>
          </div>

          {/* Bordas */}
          <div className={styles.field}>
            <span>Bordas (deixe vazio para “Sem Borda” R$ 0)</span>
            {pizza.bordas.map((b, bi) => (
              <div key={bi} style={{ border: '1px solid #eee', borderRadius: 8, padding: 8, marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <input placeholder="Nome da borda" value={b.nome} onChange={(e) => onPatchBorda(bi, { nome: e.target.value })} style={{ flex: 1 }} />
                  <button className={styles.chipX} onClick={() => onRemoveBorda(bi)}>×</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {nomesTamanho.map((tn) => (
                    <label key={tn} style={{ display: 'flex', flexDirection: 'column', fontSize: 12 }}>
                      {tn}
                      <input
                        type="number"
                        step="0.01"
                        value={getPrecoTam(b.precos, tn)}
                        onChange={(e) => onSetPrecoBorda(bi, tn, +e.target.value)}
                        style={cellInput}
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <button className={styles.addItemLink} onClick={onAddBorda}>+ borda</button>
          </div>

          <button className={styles.removerProduto} onClick={onRemove}>Remover pizza</button>
        </div>
      )}
    </div>
  );
}
