'use client';
import { useEffect, useState } from 'react';
import { FiDownload, FiAlertCircle, FiCheckCircle, FiClock, FiFileText, FiChevronDown, FiChevronUp, FiCopy, FiX } from 'react-icons/fi';
import { MdPix } from 'react-icons/md';
import { QRCodeSVG } from 'qrcode.react';
import styles from './styles.module.scss';
import { apiFinanceiro, PagamentoPixResultDto, PagamentoPixAtivoDto } from '@/services/apiFinanceiro';

interface Duplicata {
    id: number;
    empresaId: number;
    empresa: { id: number; nome: string };
    dataEmissao: string;
    dataVencimento: string;
    dataPagamento: string;
    valor: number;
    nossoNumero: string;
    codBarras: string;
    isCancelado: boolean;
    isPago: boolean;
    formaPagamento: string;
    boletoId: string;
    url: string;
    chaveNFSE: string;
    loteNFSE: number;
    protocolo: string;
    numeroRPS: string;
    numeroNFSE: string;
    serieNFSE: string;
    statusNFSE: string;
    urlNFSE: string;
    descricaoNFSE: string;
}

type FiltroStatus = 'todas' | 'vencidas' | 'pendentes' | 'pagas' | 'canceladas';

function formatMoeda(valor: number) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatData(data: string) {
    if (!data || data.startsWith('0001')) return '—';
    return new Date(data).toLocaleDateString('pt-BR');
}

function formatDataHora(data: string) {
    if (!data || data.startsWith('0001')) return '—';
    return new Date(data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getStatus(d: Duplicata): 'vencida' | 'pendente' | 'paga' | 'cancelada' {
    if (d.isCancelado) return 'cancelada';
    if (d.isPago) return 'paga';
    const hoje = new Date();
    const venc = new Date(d.dataVencimento);
    if (venc < hoje) return 'vencida';
    return 'pendente';
}

function temBoleto(d: Duplicata) {
    return d.boletoId && d.boletoId.length > 3;
}

function temNFSE(d: Duplicata) {
    return d.statusNFSE?.toUpperCase() == 'AUTORIZADA';
}

// ─── Modal PIX ───────────────────────────────────────────────────────────────

interface ModalPixProps {
    pix: PagamentoPixResultDto | PagamentoPixAtivoDto;
    onFechar: () => void;
}

function ModalPix({ pix, onFechar }: ModalPixProps) {
    const [copiado, setCopiado] = useState(false);

    function copiarCodigo() {
        navigator.clipboard.writeText(pix.pixCopiaECola).then(() => {
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2500);
        });
    }

    return (
        <div className={styles.modalOverlay} onClick={onFechar}>
            <div className={styles.modalPix} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <div className={styles.modalTitulo}>
                        <MdPix size={22} />
                        <span>Pagar via PIX</span>
                    </div>
                    <button className={styles.modalFechar} onClick={onFechar}>
                        <FiX size={20} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <div className={styles.pixValorInfo}>
                        <span className={styles.pixValorLabel}>Valor total</span>
                        <span className={styles.pixValor}>{formatMoeda(pix.valorTotal)}</span>
                        <span className={styles.pixVenc}>Vence em {formatData(pix.vencimento)}</span>
                    </div>

                    {pix.pixCopiaECola && (
                        <div className={styles.qrWrapper}>
                            <QRCodeSVG
                                value={pix.pixCopiaECola}
                                size={200}
                                bgColor="#ffffff"
                                fgColor="#1D1D2E"
                                level="M"
                            />
                        </div>
                    )}

                    <div className={styles.copiaCola}>
                        <span className={styles.copiaColaLabel}>PIX Copia e Cola</span>
                        <div className={styles.copiaColaBox}>
                            <span className={styles.copiaColaTexto}>{pix.pixCopiaECola}</span>
                            <button
                                className={`${styles.btnCopiar} ${copiado ? styles.btnCopiado : ''}`}
                                onClick={copiarCodigo}
                            >
                                <FiCopy size={15} />
                                {copiado ? 'Copiado!' : 'Copiar'}
                            </button>
                        </div>
                    </div>

                    <p className={styles.pixInstrucao}>
                        Abra o app do seu banco, escolha pagar via PIX e escaneie o QR Code ou cole o código acima.
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─── Card PIX Ativo ──────────────────────────────────────────────────────────

interface CardPixAtivoProps {
    pix: PagamentoPixAtivoDto;
    onAbrir: (pix: PagamentoPixAtivoDto) => void;
}

function CardPixAtivo({ pix, onAbrir }: CardPixAtivoProps) {
    return (
        <div className={styles.cardPixAtivo}>
            <div className={styles.cardPixAtivoIcone}>
                <MdPix size={20} />
            </div>
            <div className={styles.cardPixAtivoInfo}>
                <span className={styles.cardPixAtivoValor}>{formatMoeda(pix.valorTotal)}</span>
                <span className={styles.cardPixAtivoObs}>{pix.observacao}</span>
                <span className={styles.cardPixAtivoMeta}>
                    Gerado em {formatDataHora(pix.dataCriacao)} · Vence {formatData(pix.vencimento)}
                </span>
            </div>
            <button className={styles.btnVerPix} onClick={() => onAbrir(pix)}>
                <MdPix size={15} />
                Ver QR Code
            </button>
        </div>
    );
}

// ─── Página ──────────────────────────────────────────────────────────────────

export default function Financeiro() {
    const [duplicatas, setDuplicatas] = useState<Duplicata[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [filtro, setFiltro] = useState<FiltroStatus>('todas');
    const [selecionadas, setSelecionadas] = useState<number[]>([]);
    const [expandidas, setExpandidas] = useState<number[]>([]);
    const [gerandoPix, setGerandoPix] = useState(false);
    const [baixando, setBaixando] = useState<number | null>(null);
    const [pixAtivo, setPixAtivo] = useState<PagamentoPixResultDto | PagamentoPixAtivoDto | null>(null);
    const [pixPendentes, setPixPendentes] = useState<PagamentoPixAtivoDto[]>([]);

    useEffect(() => {
        Promise.all([
            apiFinanceiro.getUltimasDuplicatas(12),
            apiFinanceiro.getPagamentosPixAtivos()
        ]).then(([duplicatasData, pixData]) => {
            setDuplicatas(duplicatasData);
            setPixPendentes(pixData);
            setCarregando(false);
        });
    }, []);

    const vencidas = duplicatas.filter(d => getStatus(d) === 'vencida');
    const pendentes = duplicatas.filter(d => getStatus(d) === 'pendente');
    const totalVencido = vencidas.reduce((acc, d) => acc + d.valor, 0);
    const totalPendente = pendentes.reduce((acc, d) => acc + d.valor, 0);

    const duplicatasFiltradas = duplicatas.filter(d => {
        if (filtro === 'todas') return true;
        return getStatus(d) === filtro.replace('vencidas', 'vencida').replace('pendentes', 'pendente').replace('pagas', 'paga').replace('canceladas', 'cancelada');
    });

    function toggleSelecionada(id: number) {
        setSelecionadas(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    }

    function toggleExpandida(id: number) {
        setExpandidas(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    }

    function selecionarTodas() {
        const ids = duplicatasFiltradas.filter(d => !d.isPago && !d.isCancelado).map(d => d.id);
        setSelecionadas(prev => prev.length === ids.length ? [] : ids);
    }

    async function gerarPix(ids: number[]) {
        setGerandoPix(true);
        const resultado = await apiFinanceiro.gerarPix(ids);
        setGerandoPix(false);
        if (resultado) {
            setPixAtivo(resultado);
            // Recarrega os PIX ativos para incluir o novo
            const atualizados = await apiFinanceiro.getPagamentosPixAtivos();
            setPixPendentes(atualizados);
        }
    }

    function handlePixSelecionadas() {
        if (selecionadas.length === 0) return;
        gerarPix(selecionadas);
    }

    function handlePixUnica(d: Duplicata) {
        gerarPix([d.id]);
    }

    async function handleDownloadBoleto(d: Duplicata) {
        setBaixando(d.id);
        await apiFinanceiro.downloadBoleto(d.id, d.nossoNumero);
        setBaixando(null);
    }

    async function handleDownloadNFSE(d: Duplicata) {
        setBaixando(d.id);
        await apiFinanceiro.downloadNFSe(d.id, d.numeroNFSE);
        setBaixando(null);
    }

    return (
        <div className={styles.container}>

            {pixAtivo && <ModalPix pix={pixAtivo} onFechar={() => setPixAtivo(null)} />}

            {gerandoPix && (
                <div className={styles.modalOverlay}>
                    <div className={styles.gerandoPixBox}>
                        <div className={styles.spinner} />
                        <span>Gerando PIX...</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerTexto}>
                    <h1>Financeiro</h1>
                    <p>Histórico de mensalidades e cobranças</p>
                </div>
            </div>

            {/* Cards de Resumo */}
            <div className={styles.resumoGrid}>
                <div className={`${styles.resumoCard} ${styles.cardVencido}`}>
                    <div className={styles.resumoIcone}><FiAlertCircle size={22} /></div>
                    <div className={styles.resumoInfo}>
                        <span className={styles.resumoLabel}>Em atraso</span>
                        <span className={styles.resumoValor}>{formatMoeda(totalVencido)}</span>
                        <span className={styles.resumoQtd}>{vencidas.length} {vencidas.length === 1 ? 'duplicata' : 'duplicatas'}</span>
                    </div>
                </div>
                <div className={`${styles.resumoCard} ${styles.cardPendente}`}>
                    <div className={styles.resumoIcone}><FiClock size={22} /></div>
                    <div className={styles.resumoInfo}>
                        <span className={styles.resumoLabel}>A vencer</span>
                        <span className={styles.resumoValor}>{formatMoeda(totalPendente)}</span>
                        <span className={styles.resumoQtd}>{pendentes.length} {pendentes.length === 1 ? 'duplicata' : 'duplicatas'}</span>
                    </div>
                </div>
            </div>

            {/* PIX Pendentes */}
            {pixPendentes.length > 0 && (
                <div className={styles.pixPendentesSection}>
                    <div className={styles.pixPendentesTitulo}>
                        <MdPix size={16} />
                        <span>{pixPendentes.length === 1 ? 'PIX aguardando pagamento' : `${pixPendentes.length} PIX aguardando pagamento`}</span>
                    </div>
                    <div className={styles.pixPendentesList}>
                        {pixPendentes.map(p => (
                            <CardPixAtivo key={p.id} pix={p} onAbrir={setPixAtivo} />
                        ))}
                    </div>
                </div>
            )}

            {/* Alerta vencidas */}
            {vencidas.length > 0 && (
                <div className={styles.alertaVencidas}>
                    <FiAlertCircle size={18} />
                    <span>
                        Você possui <strong>{vencidas.length} {vencidas.length === 1 ? 'mensalidade vencida' : 'mensalidades vencidas'}</strong> totalizando <strong>{formatMoeda(totalVencido)}</strong>. Regularize para evitar interrupção dos serviços.
                    </span>
                    <button className={styles.btnPixAlerta} onClick={() => gerarPix(vencidas.map(d => d.id))}>
                        <MdPix size={16} />
                        Pagar via PIX
                    </button>
                </div>
            )}

            {/* Filtros + ações */}
            <div className={styles.toolbar}>
                <div className={styles.filtros}>
                    {(['todas', 'vencidas', 'pendentes', 'pagas', 'canceladas'] as FiltroStatus[]).map(f => (
                        <button
                            key={f}
                            className={`${styles.filtroBotao} ${filtro === f ? styles.filtroAtivo : ''}`}
                            onClick={() => { setFiltro(f); setSelecionadas([]); }}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                            {f === 'vencidas' && vencidas.length > 0 && <span className={styles.badge}>{vencidas.length}</span>}
                        </button>
                    ))}
                </div>
                {selecionadas.length > 0 && (
                    <button className={styles.btnPixMultiplo} onClick={handlePixSelecionadas} disabled={gerandoPix}>
                        <MdPix size={18} />
                        Gerar PIX ({selecionadas.length})
                    </button>
                )}
            </div>

            {/* Lista */}
            <div className={styles.listaWrapper}>
                {carregando ? (
                    <div className={styles.carregando}>
                        <div className={styles.spinner} />
                        <p>Carregando duplicatas...</p>
                    </div>
                ) : duplicatasFiltradas.length === 0 ? (
                    <div className={styles.vazio}>
                        <FiFileText size={40} />
                        <p>Nenhuma duplicata encontrada</p>
                    </div>
                ) : (
                    <>
                        <div className={styles.listaHeader}>
                            <div className={styles.colCheck}>
                                <input type="checkbox" onChange={selecionarTodas}
                                    checked={selecionadas.length === duplicatasFiltradas.filter(d => !d.isPago && !d.isCancelado).length && selecionadas.length > 0} />
                            </div>
                            <div className={styles.colRef}>Referência</div>
                            <div className={styles.colVenc}>Vencimento</div>
                            <div className={styles.colValor}>Valor</div>
                            <div className={styles.colStatus}>Status</div>
                            <div className={styles.colAcoes}>Ações</div>
                        </div>

                        {duplicatasFiltradas.map(d => {
                            const status = getStatus(d);
                            const expandida = expandidas.includes(d.id);
                            const selecionada = selecionadas.includes(d.id);

                            return (
                                <div key={d.id} className={`${styles.linhaItem} ${styles[`status_${status}`]} ${selecionada ? styles.linhaSelecionada : ''}`}>
                                    <div className={styles.linhaPrincipal}>
                                        <div className={styles.colCheck}>
                                            {!d.isPago && !d.isCancelado && (
                                                <input type="checkbox" checked={selecionada} onChange={() => toggleSelecionada(d.id)} />
                                            )}
                                        </div>
                                        <div className={styles.colRef}>
                                            <span className={styles.refNumero}>#{d.nossoNumero || d.id}</span>
                                            <span className={styles.refEmissao}>Emitido {formatData(d.dataEmissao)}</span>
                                        </div>
                                        <div className={styles.colVenc}>
                                            <span className={status === 'vencida' ? styles.dataVencida : ''}>{formatData(d.dataVencimento)}</span>
                                            {d.isPago && d.dataPagamento && !d.dataPagamento.startsWith('0001') && (
                                                <span className={styles.dataPagamento}>Pago {formatData(d.dataPagamento)}</span>
                                            )}
                                        </div>
                                        <div className={styles.colValor}>
                                            <span className={styles.valorPrincipal}>{formatMoeda(d.valor)}</span>
                                        </div>
                                        <div className={styles.colStatus}>
                                            <span className={`${styles.statusBadge} ${styles[`badge_${status}`]}`}>
                                                {status === 'vencida' && <FiAlertCircle size={12} />}
                                                {status === 'pendente' && <FiClock size={12} />}
                                                {status === 'paga' && <FiCheckCircle size={12} />}
                                                {status === 'cancelada' && '✕'}
                                                {status === 'vencida' ? 'Em atraso' : status.charAt(0).toUpperCase() + status.slice(1)}
                                            </span>
                                        </div>
                                        <div className={styles.colAcoes}>
                                            {temBoleto(d) && (
                                                <button
                                                    className={styles.btnAcao}
                                                    onClick={() => handleDownloadBoleto(d)}
                                                    disabled={baixando === d.id}
                                                    title="Baixar boleto"
                                                >
                                                    {baixando === d.id
                                                        ? <div className={styles.spinnerBtn} />
                                                        : <FiDownload size={15} />}
                                                    <span>Boleto</span>
                                                </button>
                                            )}
                                            {temNFSE(d) && (
                                                <button
                                                    className={`${styles.btnAcao} ${styles.btnNfse}`}
                                                    onClick={() => handleDownloadNFSE(d)}
                                                    disabled={baixando === d.id}
                                                    title="Baixar NFS-e"
                                                >
                                                    {baixando === d.id
                                                        ? <div className={styles.spinnerBtn} />
                                                        : <FiFileText size={15} />}
                                                    <span>NFS-e</span>
                                                </button>
                                            )}
                                            {!d.isPago && !d.isCancelado && (
                                                <button className={`${styles.btnAcao} ${styles.btnPix}`} onClick={() => handlePixUnica(d)} title="Pagar via PIX" disabled={gerandoPix}>
                                                    <MdPix size={15} /><span>PIX</span>
                                                </button>
                                            )}
                                            <button className={styles.btnExpandir} onClick={() => toggleExpandida(d.id)}>
                                                {expandida ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    {expandida && (
                                        <div className={styles.linhaDetalhes}>
                                            <div className={styles.detalheGrid}>
                                                {d.formaPagamento && (
                                                    <div className={styles.detalheItem}>
                                                        <span className={styles.detalheLabel}>Forma de pagamento</span>
                                                        <span>{d.formaPagamento}</span>
                                                    </div>
                                                )}
                                                {d.nossoNumero && (
                                                    <div className={styles.detalheItem}>
                                                        <span className={styles.detalheLabel}>Nosso número</span>
                                                        <span>{d.nossoNumero}</span>
                                                    </div>
                                                )}
                                                {d.numeroNFSE && (
                                                    <div className={styles.detalheItem}>
                                                        <span className={styles.detalheLabel}>Número NFS-e</span>
                                                        <span>{d.numeroNFSE}</span>
                                                    </div>
                                                )}
                                                {d.serieNFSE && (
                                                    <div className={styles.detalheItem}>
                                                        <span className={styles.detalheLabel}>Série NFS-e</span>
                                                        <span>{d.serieNFSE}</span>
                                                    </div>
                                                )}
                                                {d.statusNFSE && (
                                                    <div className={styles.detalheItem}>
                                                        <span className={styles.detalheLabel}>Status NFS-e</span>
                                                        <span className={d.statusNFSE === 'AUTORIZADA' ? styles.nfseAutorizada : styles.nfseOutro}>{d.statusNFSE}</span>
                                                    </div>
                                                )}
                                                {d.protocolo && (
                                                    <div className={styles.detalheItem}>
                                                        <span className={styles.detalheLabel}>Protocolo</span>
                                                        <span className={styles.codeMono}>{d.protocolo}</span>
                                                    </div>
                                                )}
                                                {d.descricaoNFSE && (
                                                    <div className={`${styles.detalheItem} ${styles.detalheFullWidth}`}>
                                                        <span className={styles.detalheLabel}>Descrição NFS-e</span>
                                                        <span>{d.descricaoNFSE}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </>
                )}
            </div>
        </div>
    );
}