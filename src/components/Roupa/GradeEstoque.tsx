import { useCallback, useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { Modal, Spinner } from 'react-bootstrap';
import { api } from '@/services/apiClient';
import CustomButton from '@/components/ui/Buttons';
import IProdutoVariante from '@/interfaces/IProdutoVariante';
import styles from './styles.module.scss';

interface ExtratoLinha { data: string; entrada: boolean; quantidade: number; descricao: string | null; saldo: number }
interface Extrato {
    varianteId: number; nome: string; saldoAtual: number; saldoCalculado: number; divergente: boolean; linhas: ExtratoLinha[];
}

type TipoMov = 'ENTRADA' | 'SAIDA';

const fmt = (n: number) => Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 3 });
const fmtData = (iso: string) => {
    const d = new Date(iso);
    return d.getFullYear() < 2000 ? '—' : d.toLocaleString('pt-BR');
};
const msgErro = (err: unknown) => {
    const e = err as AxiosError;
    return (typeof e.response?.data === 'string' ? e.response?.data : '') || e.message;
};

// Grade de estoque por variante (cor x tamanho) de um produto de ROUPA.
// O estoque e SOMENTE LEITURA aqui: so muda por venda ou por um movimento de
// entrada/saida (com motivo e usuario), e tudo fica no extrato da variante.
export default function GradeEstoque({ produtoId, recarregar }: { produtoId: number; recarregar?: number }) {
    const [linhas, setLinhas] = useState<IProdutoVariante[]>([]);
    const [original, setOriginal] = useState<string>('');
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);

    // Modal de movimento
    const [mov, setMov] = useState<TipoMov | null>(null);
    const [motivo, setMotivo] = useState('');
    const [qtds, setQtds] = useState<Record<number, string>>({});
    const [lancando, setLancando] = useState(false);

    // Modal de extrato
    const [extrato, setExtrato] = useState<Extrato | null>(null);
    const [carregandoExtrato, setCarregandoExtrato] = useState(false);

    const aplicar = (dados: IProdutoVariante[]) => {
        setLinhas(dados);
        setOriginal(JSON.stringify(dados.map(dadosEditaveis)));
    };
    const dadosEditaveis = (l: IProdutoVariante) => ({ id: l.id, sku: l.sku ?? '', codBarras: l.codBarras ?? '', ativo: l.ativo });

    const carregar = useCallback(async () => {
        setCarregando(true);
        try {
            const { data } = await api.get<IProdutoVariante[]>(`/ProdutoVariante/${produtoId}`);
            aplicar(data);
        } catch (err) {
            toast.error(`Erro ao carregar variantes. ${msgErro(err)}`);
        } finally {
            setCarregando(false);
        }
    }, [produtoId]);

    useEffect(() => { carregar(); }, [carregar, recarregar]);

    const sujo = useMemo(() => JSON.stringify(linhas.map(dadosEditaveis)) !== original, [linhas, original]);
    const total = useMemo(() => linhas.filter((l) => l.ativo).reduce((s, l) => s + (Number(l.estoque) || 0), 0), [linhas]);

    const set = (id: number, patch: Partial<IProdutoVariante>) =>
        setLinhas((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));

    async function salvarDados() {
        setSalvando(true);
        try {
            const { data } = await api.put<IProdutoVariante[]>(`/ProdutoVariante/${produtoId}`,
                linhas.map((l) => ({ id: l.id, sku: l.sku || null, codBarras: l.codBarras || null, ativo: l.ativo })));
            aplicar(data);
            toast.success('Dados das variantes salvos.');
        } catch (err) {
            toast.error(`Erro ao salvar. ${msgErro(err)}`);
        } finally {
            setSalvando(false);
        }
    }

    async function sincronizar() {
        setCarregando(true);
        try {
            const { data } = await api.post<IProdutoVariante[]>(`/ProdutoVariante/${produtoId}/Sincronizar`);
            aplicar(data);
            toast.success('Variantes atualizadas.');
        } catch (err) {
            toast.error(`Erro ao atualizar variantes. ${msgErro(err)}`);
        } finally {
            setCarregando(false);
        }
    }

    function abrirMovimento(tipo: TipoMov) {
        if (sujo) { toast.warn('Salve os dados da grade antes de lançar estoque.'); return; }
        setMotivo('');
        setQtds({});
        setMov(tipo);
    }

    const itensMov = useMemo(
        () => Object.entries(qtds)
            .map(([id, q]) => ({ varianteId: Number(id), quantidade: Number(String(q).replace(',', '.')) }))
            .filter((i) => Number.isFinite(i.quantidade) && i.quantidade > 0),
        [qtds],
    );

    async function lancar() {
        if (!mov) return;
        if (motivo.trim().length < 3) { toast.error('Informe o motivo do lançamento.'); return; }
        if (itensMov.length === 0) { toast.error('Informe a quantidade de ao menos uma variante.'); return; }
        if (mov === 'SAIDA') {
            const estourou = itensMov.find((i) => i.quantidade > (linhas.find((l) => l.id === i.varianteId)?.estoque ?? 0));
            if (estourou) { toast.error('Existe saída maior que o saldo da variante.'); return; }
        }
        setLancando(true);
        try {
            const { data } = await api.post<IProdutoVariante[]>(`/ProdutoVariante/${produtoId}/Movimento`,
                { tipo: mov, motivo: motivo.trim(), itens: itensMov });
            aplicar(data);
            setMov(null);
            toast.success(mov === 'ENTRADA' ? 'Entrada lançada.' : 'Saída lançada.');
        } catch (err) {
            toast.error(`Erro ao lançar. ${msgErro(err)}`);
        } finally {
            setLancando(false);
        }
    }

    async function abrirExtrato(varianteId: number) {
        setExtrato(null);
        setCarregandoExtrato(true);
        try {
            const { data } = await api.get<Extrato>(`/ProdutoVariante/variante/${varianteId}/Extrato`);
            setExtrato(data);
        } catch (err) {
            toast.error(`Erro ao carregar extrato. ${msgErro(err)}`);
            setCarregandoExtrato(false);
            return;
        }
        setCarregandoExtrato(false);
    }

    if (carregando) return <div className={styles.centro}><Spinner size="sm" /></div>;

    if (linhas.length === 0) {
        return (
            <div className={styles.centro}>
                <p>Este produto ainda não tem variantes. Cadastre cores e tamanhos na aba “Modelos”, salve e volte aqui.</p>
                <CustomButton typeButton="outline-main" onClick={sincronizar}>Gerar variantes</CustomButton>
            </div>
        );
    }

    return (
        <div className={styles.grade}>
            <div className={styles.topo}>
                <span>Estoque total (variantes ativas): <b>{fmt(total)}</b></span>
                <div className={styles.acoes}>
                    <CustomButton typeButton="outline-main" onClick={sincronizar} disabled={salvando}>Atualizar variantes</CustomButton>
                    <CustomButton typeButton="outline-main" onClick={salvarDados} loading={salvando} disabled={!sujo}>Salvar dados</CustomButton>
                    <CustomButton typeButton="success" onClick={() => abrirMovimento('ENTRADA')}>Lançar entrada</CustomButton>
                    <CustomButton typeButton="danger" onClick={() => abrirMovimento('SAIDA')}>Lançar saída</CustomButton>
                </div>
            </div>

            <div className={styles.tabelaWrap}>
                <table className={styles.tabela}>
                    <thead>
                        <tr><th>Cor</th><th>Tamanho</th><th>SKU</th><th>Cód. barras</th><th>Estoque</th><th>Ativa</th><th /></tr>
                    </thead>
                    <tbody>
                        {linhas.map((l) => (
                            <tr key={l.id} className={l.ativo ? '' : styles.inativa}>
                                <td>
                                    {l.corNome ? (
                                        <span className={styles.cor}><i style={{ background: l.corHex || '#fff' }} />{l.corNome}</span>
                                    ) : '—'}
                                </td>
                                <td>{l.tamanhoNome || '—'}</td>
                                <td><input value={l.sku ?? ''} placeholder="opcional" onChange={(e) => set(l.id, { sku: e.target.value })} /></td>
                                <td><input value={l.codBarras ?? ''} placeholder="opcional" onChange={(e) => set(l.id, { codBarras: e.target.value })} /></td>
                                <td className={styles.estoque}>{fmt(l.estoque)}</td>
                                <td><input type="checkbox" checked={l.ativo} onChange={(e) => set(l.id, { ativo: e.target.checked })} /></td>
                                <td><button type="button" className={styles.link} onClick={() => abrirExtrato(l.id)}>Extrato</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <small className={styles.dica}>
                O estoque só muda por venda ou por lançamento de entrada/saída (com motivo). Todo movimento fica registrado no extrato da variante.
            </small>

            {/* ── Movimento (entrada/saída) ─────────────────────────── */}
            <Modal show={mov !== null} onHide={() => !lancando && setMov(null)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>{mov === 'ENTRADA' ? 'Lançar entrada de estoque' : 'Lançar saída de estoque'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <label className={styles.rotulo}>Motivo / documento <b>*</b></label>
                    <input
                        className={styles.motivo} value={motivo} maxLength={150} autoFocus
                        placeholder={mov === 'ENTRADA' ? 'Ex.: Compra NF 1234, estoque inicial, devolução de cliente' : 'Ex.: Perda, avaria, troca, uso interno'}
                        onChange={(e) => setMotivo(e.target.value)}
                    />
                    <div className={styles.tabelaWrap} style={{ marginTop: 12, maxHeight: '45vh', overflowY: 'auto' }}>
                        <table className={styles.tabela}>
                            <thead><tr><th>Cor</th><th>Tamanho</th><th>Saldo atual</th><th>{mov === 'ENTRADA' ? 'Entrada' : 'Saída'}</th></tr></thead>
                            <tbody>
                                {linhas.filter((l) => l.ativo).map((l) => (
                                    <tr key={l.id}>
                                        <td>{l.corNome || '—'}</td>
                                        <td>{l.tamanhoNome || '—'}</td>
                                        <td>{fmt(l.estoque)}</td>
                                        <td>
                                            <input
                                                type="number" min={0} step={1} className={styles.qtd} value={qtds[l.id] ?? ''}
                                                max={mov === 'SAIDA' ? l.estoque : undefined}
                                                onChange={(e) => setQtds((p) => ({ ...p, [l.id]: e.target.value }))}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <small className={styles.dica}>
                        {itensMov.length} variante(s) · total {fmt(itensMov.reduce((s, i) => s + i.quantidade, 0))} un. Deixe em branco o que não mudou.
                    </small>
                </Modal.Body>
                <Modal.Footer>
                    <CustomButton typeButton="outline-main" onClick={() => setMov(null)} disabled={lancando}>Cancelar</CustomButton>
                    <CustomButton typeButton={mov === 'ENTRADA' ? 'success' : 'danger'} onClick={lancar} loading={lancando}>
                        Confirmar {mov === 'ENTRADA' ? 'entrada' : 'saída'}
                    </CustomButton>
                </Modal.Footer>
            </Modal>

            {/* ── Extrato ───────────────────────────────────────────── */}
            <Modal show={carregandoExtrato || extrato !== null} onHide={() => setExtrato(null)} size="lg" centered>
                <Modal.Header closeButton><Modal.Title>Extrato de estoque</Modal.Title></Modal.Header>
                <Modal.Body>
                    {carregandoExtrato && <div className={styles.centro}><Spinner size="sm" /></div>}
                    {extrato && (
                        <>
                            <p style={{ marginBottom: 6 }}><b>{extrato.nome}</b> — saldo atual: <b>{fmt(extrato.saldoAtual)}</b></p>
                            {extrato.divergente && (
                                <div className={styles.alerta}>
                                    Divergência: os lançamentos somam {fmt(extrato.saldoCalculado)}, mas o saldo atual é {fmt(extrato.saldoAtual)}.
                                    O estoque foi alterado fora dos lançamentos — confira antes de seguir.
                                </div>
                            )}
                            <div className={styles.tabelaWrap} style={{ maxHeight: '50vh', overflowY: 'auto' }}>
                                <table className={styles.tabela}>
                                    <thead><tr><th>Data</th><th>Tipo</th><th>Qtd.</th><th>Descrição</th><th>Saldo</th></tr></thead>
                                    <tbody>
                                        {extrato.linhas.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center' }}>Sem movimentos.</td></tr>}
                                        {extrato.linhas.map((l, i) => (
                                            <tr key={i}>
                                                <td>{fmtData(l.data)}</td>
                                                <td className={l.entrada ? styles.entrada : styles.saida}>{l.entrada ? 'Entrada' : 'Saída'}</td>
                                                <td>{fmt(l.quantidade)}</td>
                                                <td style={{ whiteSpace: 'normal' }}>{l.descricao}</td>
                                                <td>{fmt(l.saldo)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </Modal.Body>
            </Modal>
        </div>
    );
}
