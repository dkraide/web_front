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

export default function MontarCardapioIA() {
  const { getUser } = useContext(AuthContext);
  const [user, setUser] = useState<IUsuario>();
  const [tipo, setTipo] = useState<TipoCardapio>('AUTO');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [cardapio, setCardapio] = useState<ICardapioIA | null>(null);
  const [loadingIA, setLoadingIA] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aberto, setAberto] = useState<number>(-1);

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

    return {
      tipoDetectado: novo.tipoDetectado || prev.tipoDetectado,
      classes,
      gruposAdicionais: grupos,
      produtos,
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
      const base = c ?? { tipoDetectado: 'LANCHE', classes: [], gruposAdicionais: [], produtos: [] };
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
      const base = c ?? { tipoDetectado: 'LANCHE', classes: [], gruposAdicionais: [], produtos: [] };
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

  /* ───────────── Confirmar ───────────── */
  async function handleConfirmar() {
    if (!user || !cardapio) return;
    const validos = cardapio.produtos.filter((p) => p.nome.trim());
    if (validos.length === 0) {
      toast.warning('Nenhum produto com nome para cadastrar.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await produtoService.criarCardapio(user.empresaSelecionada, {
        ...cardapio,
        produtos: validos,
      });
      toast.success(
        `${res.total} produto(s) criado(s)! (${res.classes} classe(s), ${res.gruposAdicionais} grupo(s))`
      );
      window.location.href = '/produto';
    } catch (err: any) {
      toast.error(`Erro ao criar produtos: ${err.response?.data || err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  const totalProdutos = cardapio?.produtos.length ?? 0;

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
                <span className={styles.statLabel}>Grupos</span>
                <span className={styles.statValue}>{cardapio.gruposAdicionais.length}</span>
              </div>
            </div>
            <button className={styles.btnFinalizar} onClick={handleConfirmar} disabled={submitting || loadingIA || totalProdutos === 0}>
              {submitting ? (<><Spinner animation="border" size="sm" /> Criando…</>) : `Confirmar e criar ${totalProdutos} produto(s)`}
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
