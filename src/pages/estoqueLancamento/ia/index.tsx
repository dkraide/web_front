'use client';

import IProduto from '@/interfaces/IProduto';
import styles from './styles.module.scss';
import { useContext, useEffect, useRef, useState } from 'react';
import { AxiosError, AxiosResponse } from 'axios';
import { toast } from 'react-toastify';
import { api } from '@/services/apiClient';
import { AuthContext } from '@/contexts/AuthContext';
import IUsuario from '@/interfaces/IUsuario';
import SelectProdutoModal from '@/components/Modals/Produto/SelectProdutoModal';
import { fGetNumber, GetCurrencyBRL } from '@/utils/functions';
import ILancamentoEstoque from '@/interfaces/ILancamentoEstoque';
import ILancamentoEstoqueProduto from '@/interfaces/ILancamentoEstoqueProduto';
import _ from 'lodash';
import { Modal, Button, Spinner } from 'react-bootstrap';

type ItemIA = {
  item: {
    cProd: string;
    qCom: number;
    vUnCom: number;
    xProd: string;
    multiplicador: number;
  };
  produto?: IProduto | null;
};

type UploadedImage = {
  file: File;
  preview: string;
  status: 'pending' | 'loading' | 'done' | 'error';
};

export default function LancamentoEstoqueIA() {
  const { getUser } = useContext(AuthContext);
  const [user, setUser] = useState<IUsuario>();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [itens, setItens] = useState<ItemIA[]>([]);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showVinculoModal, setShowVinculoModal] = useState(false);
  const [prodModal, setProdModal] = useState(-1);
  const [loadingIA, setLoadingIA] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingSource, setPendingSource] = useState<'gallery' | 'camera' | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getUser().then(setUser);
  }, []);

  /* ─── Abre o seletor de arquivo → mostra modal de regras primeiro ─── */
  function handleAddImageClick() {
    setShowRulesModal(true);
    setPendingSource('gallery');
  }

  function handleCameraClick() {
    setShowRulesModal(true);
    setPendingSource('camera');
  }

  function onRulesConfirmed() {
    setShowRulesModal(false);
    if (pendingSource === 'camera') {
      cameraInputRef.current?.click();
    } else {
      fileInputRef.current?.click();
    }
    setPendingSource(null);
  }

  async function onFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = '';

    const newImages: UploadedImage[] = files.map((f) => ({
      file: f,
      preview: URL.createObjectURL(f),
      status: 'pending',
    }));

    setImages((prev) => [...prev, ...newImages]);
    await processImages(files, newImages);
  }

  async function processImages(files: File[], newImages: UploadedImage[]) {
    if (!user) return;
    setLoadingIA(true);

    // marca como carregando
    setImages((prev) =>
      prev.map((img) =>
        newImages.find((n) => n.preview === img.preview)
          ? { ...img, status: 'loading' }
          : img
      )
    );

    const formData = new FormData();
    files.forEach((f) => formData.append('file', f, f.name));
    formData.append('empresaId', user.empresaSelecionada.toString());

    try {
      const { data }: AxiosResponse<ItemIA[]> = await api.post(
        '/v2/LancamentoEstoque/ler-pedido',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setItens((prev) => mergeItens(prev, data));

      setImages((prev) =>
        prev.map((img) =>
          newImages.find((n) => n.preview === img.preview)
            ? { ...img, status: 'done' }
            : img
        )
      );

      toast.success(`${data.length} item(s) carregado(s)!`);
    } catch (err: any) {
      setImages((prev) =>
        prev.map((img) =>
          newImages.find((n) => n.preview === img.preview)
            ? { ...img, status: 'error' }
            : img
        )
      );
      toast.error(`Erro ao processar imagem: ${err.response?.data || err.message}`);
    } finally {
      setLoadingIA(false);
    }
  }

  function mergeItens(prev: ItemIA[], incoming: ItemIA[]): ItemIA[] {
    const map = new Map(prev.map((p) => [p.item.cProd, p]));
    incoming.forEach((i) => {
      if (map.has(i.item.cProd)) {
        map.get(i.item.cProd)!.item.qCom += i.item.qCom;
      } else {
        map.set(i.item.cProd, i);
      }
    });
    return Array.from(map.values());
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  function selectProduto(p: IProduto) {
    setItens((prev) =>
      prev.map((item, i) => (i === prodModal ? { ...item, produto: p } : item))
    );
    setProdModal(-1);
  }

  function updateField(index: number, field: string, value: string) {
    setItens((prev) => {
      const copy = [...prev];
      const num = parseFloat(value.replace(',', '.')) || 0;
      if (field === 'multiplicador') {
        copy[index] = {
          ...copy[index],
          item: { ...copy[index].item, multiplicador: num },
        };
      } else if (field === 'qCom') {
        copy[index] = {
          ...copy[index],
          item: { ...copy[index].item, qCom: num },
        };
      } else if (field === 'vUnCom') {
        copy[index] = {
          ...copy[index],
          item: { ...copy[index].item, vUnCom: num },
        };
      }
      return copy;
    });
  }

  const semVinculo = itens.filter((i) => !i.produto);
  const totalItens = _.sumBy(itens, (i) => i.item.qCom * (i.item.multiplicador || 1));
  const totalValor = _.sumBy(itens, (i) => i.item.qCom * i.item.vUnCom);

  async function updateProdutoInfo(): Promise<boolean> {
    const list = itens.map((item) => ({
      id: item.produto?.id,
      valorCompra: item.item.vUnCom,
      multiplicadorFornecedor: item.item.multiplicador || 1,
      codigoFornecedor: item.item.cProd,
    }));

    return api.put(`/Produto/UpdateFromXML`, list)
      .then(() => true)
      .catch((err: AxiosError) => {
        toast.error(`Erro ao atualizar produtos. ${err.response?.data || err.message}`);
        return false;
      });
  }

  async function handleFinalizar() {
    if (semVinculo.length > 0) {
      setShowVinculoModal(true);
      return;
    }
    setSubmitting(true);
    const atualizado = await updateProdutoInfo();
    if (!atualizado) {
      setSubmitting(false);
      return;
    }
    await criarLancamento();
  }

  async function criarLancamento() {
    if (!user) return;

    const obj: ILancamentoEstoque = {
      idLancamentoEstoque: 0,
      id: 0,
      dataLancamento: new Date(),
      idPedido: 0,
      arquivoXML: '',
      comentario: 'GERADO A PARTIR DE I.A',
      isEntrada: true,
      isProduto: true,
      nomeArquivo: '',
      empresaId: user.empresaSelecionada,
      produtos: itens.map((o) => {
        const qtd = o.item.qCom;
        const mult = o.item.multiplicador || 1;
        return {
          idLancamentoEstoque: 0,
          idLancamentoEstoqueProduto: 0,
          lancamentoEstoqueId: 0,
          id: 0,
          idProduto: o.produto?.idProduto ?? 0,
          produtoId: o.produto?.id ?? 0,
          idMateriaPrima: 0,
          nomeProduto: o.produto?.nome ?? o.item.xProd,
          custoUnitario: Number((o.item.vUnCom / mult).toFixed(2)),
          quantidade: Number((qtd * mult).toFixed(2)),
          produto: undefined,
          materiaPrima: undefined,
          dataLancamento: new Date(),
          isEntrada: true,
          empresaId: user.empresaSelecionada,
          materiaPrimaId: 0,
          observacao: 'GERADO A PARTIR DE I.A',
        } as ILancamentoEstoqueProduto;
      }),
    };

    try {
      await api.post(`/v2/LancamentoEstoque/${user.empresaSelecionada}/Create`, obj);
      toast.success('Lançamento criado com sucesso!');
      document.location.href = '/estoqueLancamento';
    } catch (err: any) {
      toast.error(`Erro ao criar lançamento: ${err.response?.data || err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  /* ════════════════════════════ RENDER ════════════════════════════ */
  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.badge}>IA</span>
          <div>
            <h1 className={styles.title}>Lançamento por Inteligência Artificial</h1>
            <p className={styles.subtitle}>
              Envie fotos do pedido ou nota fiscal e a IA identifica os produtos automaticamente
            </p>
          </div>
        </div>
      </div>

      {/* ── Upload Zone ── */}
      <div className={styles.uploadSection}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className={styles.hiddenInput}
          onChange={onFilesSelected}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className={styles.hiddenInput}
          onChange={onFilesSelected}
        />

        {images.length === 0 ? (
          <div className={styles.uploadEmptyGrid}>
            <button className={styles.uploadOption} onClick={handleCameraClick}>
              <div className={styles.uploadIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
              <span className={styles.uploadLabel}>Tirar foto</span>
              <span className={styles.uploadHint}>Abrir câmera</span>
            </button>
            <button className={styles.uploadOption} onClick={handleAddImageClick}>
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
                  {img.status === 'loading' && (
                    <Spinner animation="border" size="sm" />
                  )}
                  {img.status === 'done' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {img.status === 'error' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                {img.status !== 'loading' && (
                  <button className={styles.removeImg} onClick={() => removeImage(idx)}>
                    ×
                  </button>
                )}
              </div>
            ))}

            <button className={styles.addMoreBtn} onClick={handleCameraClick} disabled={loadingIA}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
              <span>Câmera</span>
            </button>
            <button className={styles.addMoreBtn} onClick={handleAddImageClick} disabled={loadingIA}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>Galeria</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Tabela de Itens ── */}
      {itens.length > 0 && (
        <>
          {semVinculo.length > 0 && (
            <div className={styles.alertaBanner}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <span>
                <strong>{semVinculo.length} produto(s)</strong> sem vínculo no sistema. Vincule-os antes de finalizar.
              </span>
            </div>
          )}

          {/* desktop table */}
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Produto da IA</th>
                  <th>Produto Local</th>
                  <th>Custo Un.</th>
                  <th>Mult.</th>
                  <th>Qtd.</th>
                  <th>Total Qtd.</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item, idx) => (
                  <tr key={idx} className={!item.produto ? styles.rowSemVinculo : ''}>
                    <td data-label="Produto IA">
                      <span className={styles.codProd}>{item.item.cProd}</span>
                      <span className={styles.nomeProd}>{item.item.xProd}</span>
                    </td>
                    <td data-label="Produto Local">
                      {item.produto ? (
                        <button className={styles.produtoVinculado} onClick={() => setProdModal(idx)}>
                          <span className={styles.checkIcon}>✓</span>
                          <span>{item.produto.nome}</span>
                        </button>
                      ) : (
                        <button className={styles.btnVincular} onClick={() => setProdModal(idx)}>
                          Vincular produto
                        </button>
                      )}
                    </td>
                    <td data-label="Custo Un.">
                      <input
                        className={styles.inputCell}
                        type="number"
                        value={item.item.vUnCom}
                        onChange={(e) => updateField(idx, 'vUnCom', e.target.value)}
                      />
                    </td>
                    <td data-label="Multiplicador">
                      <input
                        className={styles.inputCell}
                        type="number"
                        value={item.item.multiplicador || 1}
                        onChange={(e) => updateField(idx, 'multiplicador', e.target.value)}
                      />
                    </td>
                    <td data-label="Quantidade">
                      <input
                        className={styles.inputCell}
                        type="number"
                        value={item.item.qCom}
                        onChange={(e) => updateField(idx, 'qCom', e.target.value)}
                      />
                    </td>
                    <td data-label="Total Qtd.">
                      <span className={styles.totalQtd}>
                        {(item.item.qCom * (item.item.multiplicador || 1)).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Footer ── */}
          <div className={styles.footer}>
            <div className={styles.footerStats}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Itens</span>
                <span className={styles.statValue}>{itens.length}</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Qtd. Total</span>
                <span className={styles.statValue}>{totalItens.toFixed(2)}</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Valor Total</span>
                <span className={styles.statValue}>{GetCurrencyBRL(totalValor)}</span>
              </div>
            </div>
            <button
              className={`${styles.btnFinalizar} ${semVinculo.length > 0 ? styles.btnFinalizarWarning : ''}`}
              onClick={handleFinalizar}
              disabled={submitting || loadingIA}
            >
              {submitting ? (
                <><Spinner animation="border" size="sm" /> Processando...</>
              ) : semVinculo.length > 0 ? (
                `⚠ Finalizar (${semVinculo.length} sem vínculo)`
              ) : (
                'Finalizar Lançamento'
              )}
            </button>
          </div>
        </>
      )}

      {/* ══════════════ MODAL: REGRAS DE ENVIO ══════════════ */}
      <Modal
        show={showRulesModal}
        onHide={() => setShowRulesModal(false)}
        centered
        contentClassName={styles.modalContent}
      >
        <Modal.Body className={styles.modalBody}>
          <div className={styles.modalIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4m0 4h.01" />
            </svg>
          </div>
          <h2 className={styles.modalTitle}>Antes de enviar a foto</h2>
          <p className={styles.modalDesc}>
            Para que a IA consiga ler corretamente o pedido, siga estas orientações:
          </p>

          <ul className={styles.rulesList}>
            {[
              { icon: '📐', title: 'Documento completo', desc: 'Não corte nenhuma parte da nota ou pedido. Todos os itens devem estar visíveis.' },
              { icon: '🤚', title: 'Câmera estável', desc: 'Segure o celular firme ou apoie em uma superfície. Fotos tremidas prejudicam a leitura.' },
              { icon: '💡', title: 'Boa iluminação', desc: 'Evite sombras sobre o documento. Prefira luz natural ou ambiente bem iluminado.' },
              { icon: '📄', title: 'Documento plano', desc: 'Deixe o papel aberto e sem dobras. Superfície plana garante melhor leitura.' },
              { icon: '🔍', title: 'Foco nítido', desc: 'Aguarde a câmera focar antes de tirar. Textos desfocados não são lidos.' },
              { icon: '📑', title: 'Múltiplas páginas', desc: 'Se o pedido tiver várias páginas, envie todas — a IA vai combinar os itens.' },
            ].map((r, i) => (
              <li key={i} className={styles.ruleItem}>
                <span className={styles.ruleEmoji}>{r.icon}</span>
                <div>
                  <strong>{r.title}</strong>
                  <span>{r.desc}</span>
                </div>
              </li>
            ))}
          </ul>

          <button className={styles.btnEntendido} onClick={onRulesConfirmed}>
            Entendido, enviar foto
          </button>
          <button className={styles.btnCancelar} onClick={() => setShowRulesModal(false)}>
            Cancelar
          </button>
        </Modal.Body>
      </Modal>

      {/* ══════════════ MODAL: ALERTA SEM VÍNCULO ══════════════ */}
      <Modal
        show={showVinculoModal}
        onHide={() => setShowVinculoModal(false)}
        centered
        contentClassName={styles.modalContent}
      >
        <Modal.Body className={styles.modalBody}>
          <div className={`${styles.modalIcon} ${styles.modalIconWarning}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4m0 4h.01" />
            </svg>
          </div>
          <h2 className={styles.modalTitle}>Produtos sem vínculo</h2>
          <p className={styles.modalDesc}>
            Os itens abaixo ainda não foram vinculados a produtos do sistema:
          </p>
          <ul className={styles.semVinculoList}>
            {semVinculo.map((i, idx) => (
              <li key={idx}>
                <span className={styles.codProd}>{i.item.cProd}</span> — {i.item.xProd}
              </li>
            ))}
          </ul>
          <p className={styles.modalDesc} style={{ marginTop: 12 }}>
            Vincule todos os produtos antes de finalizar o lançamento.
          </p>
          <button className={styles.btnEntendido} onClick={() => setShowVinculoModal(false)}>
            Voltar e vincular
          </button>
        </Modal.Body>
      </Modal>

      {/* ══════════════ MODAL: SELECIONAR PRODUTO ══════════════ */}
      {prodModal >= 0 && (
        <SelectProdutoModal
          isOpen={prodModal >= 0}
          selectedId={0}
          setClose={(v) => {
            if (v) selectProduto(v);
            else setProdModal(-1);
          }}
        />
      )}
    </div>
  );
}