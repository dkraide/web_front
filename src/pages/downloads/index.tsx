import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/LandingPage/Header';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import {
    FaAndroid, FaApple, FaChevronDown, FaChevronUp, FaDownload, FaFilePdf, FaGlobe, FaGooglePlay, FaPrint, FaWindows,
} from 'react-icons/fa';
import {
    DownloadDetalhe, DownloadItem, detalheDownload, listarDownloads, urlAbsoluta,
} from '@/services/downloadService';
import styles from './styles.module.scss';

const APP_STORE_URL = 'https://apps.apple.com/br/app/krd-system-lojas/id6797965207';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.krdmobile';

// Ordem das seções: instaladores no topo, acesso remoto logo abaixo, depois o app de celular e o restante.
const prioridade = (categoria: string) => {
    const c = categoria.toLowerCase();
    if (c.includes('instal')) return 0;
    if (c.includes('remot')) return 1;
    return 3;
};

function formatBytes(bytes: number): string {
    if (!bytes || bytes < 0) return '0 B';
    const un = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), un.length - 1);
    const v = bytes / Math.pow(1024, i);
    return `${v.toFixed(i === 0 ? 0 : v >= 100 ? 0 : 1)} ${un[i]}`;
}

function IconePlataforma({ item }: { item: DownloadItem }) {
    const p = `${item.plataforma ?? ''} ${item.categoria ?? ''}`.toLowerCase();
    if (p.includes('android')) return <FaAndroid />;
    if (p.includes('ios') || p.includes('apple')) return <FaApple />;
    if (p.includes('win')) return <FaWindows />;
    if (p.includes('manual') || p.includes('pdf')) return <FaFilePdf />;
    if (p.includes('driver') || p.includes('impress')) return <FaPrint />;
    return <FaGlobe />;
}

function Card({ item }: { item: DownloadItem }) {
    const [aberto, setAberto] = useState(false);
    const [detalhe, setDetalhe] = useState<DownloadDetalhe | null>(null);
    const [carregando, setCarregando] = useState(false);

    async function alternar() {
        const abrir = !aberto;
        setAberto(abrir);
        if (abrir && !detalhe) {
            setCarregando(true);
            try { setDetalhe(await detalheDownload(item.slug)); } catch { /* mostra só o resumo */ }
            setCarregando(false);
        }
    }

    const data = new Date(item.publicadoEm);
    return (
        <div className={styles.card}>
            <div className={styles.cardTopo}>
                <span className={styles.icone}><IconePlataforma item={item} /></span>
                <div>
                    <h3>{item.nome}</h3>
                    <span className={styles.versao}>v{item.versao}</span>
                </div>
            </div>

            {item.descricao && <p className={styles.descricao}>{item.descricao}</p>}

            <div className={styles.meta}>
                <span>{formatBytes(item.tamanhoBytes)}</span>
                {data.getFullYear() > 1 && <span>Atualizado em {format(data, 'dd/MM/yyyy')}</span>}
                {item.plataforma && <span>{item.plataforma}</span>}
            </div>

            {/* Link direto: o navegador faz o download com barra própria e retomada, sem carregar o arquivo na memória da página. */}
            <a className={styles.botao} href={urlAbsoluta(item.url)} download>
                <FaDownload /> Baixar
            </a>

            <button className={styles.detalhes} onClick={alternar} type="button">
                {aberto ? <FaChevronUp /> : <FaChevronDown />} Novidades e verificação
            </button>
            {aberto && (
                <div className={styles.detalhesBox}>
                    {carregando && <span>Carregando…</span>}
                    {!carregando && detalhe?.notas && <p className={styles.notas}>{detalhe.notas}</p>}
                    {!carregando && !detalhe?.notas && <span>Sem notas para esta versão.</span>}
                    {detalhe?.sha256 && (
                        <div className={styles.hash}>
                            <b>SHA-256</b>
                            <code>{detalhe.sha256}</code>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function LojaCard({ nome, url, cor, icone }: { nome: string; url: string; cor: string; icone: React.ReactNode }) {
    return (
        <div className={styles.card}>
            <div className={styles.cardTopo}>
                <span className={styles.icone}>{icone}</span>
                <h3>{nome}</h3>
            </div>
            <div className={styles.qr}>
                <QRCodeSVG value={url} size={160} />
            </div>
            <a className={styles.botao} style={{ backgroundColor: cor }} href={url} target="_blank" rel="noopener noreferrer">
                {icone} Baixar na {nome}
            </a>
        </div>
    );
}

export default function Downloads() {
    const [itens, setItens] = useState<DownloadItem[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(false);

    useEffect(() => {
        listarDownloads()
            .then(setItens)
            .catch(() => setErro(true))
            .finally(() => setCarregando(false));
    }, []);

    const grupos = useMemo(() => {
        const mapa = new Map<string, DownloadItem[]>();
        itens.forEach(i => {
            const k = i.categoria?.trim() || 'Outros';
            mapa.set(k, [...(mapa.get(k) ?? []), i]);
        });
        return Array.from(mapa.entries()).sort(
            ([a], [b]) => prioridade(a) - prioridade(b) || a.localeCompare(b, 'pt-BR')
        );
    }, [itens]);

    const antes = grupos.filter(([c]) => prioridade(c) < 2);
    const depois = grupos.filter(([c]) => prioridade(c) >= 2);
    const renderGrupo = ([categoria, lista]: [string, DownloadItem[]]) => (
        <section key={categoria} className={styles.secao}>
            <h2>{categoria}</h2>
            <div className={styles.cards}>
                {lista.map(i => <Card key={i.slug} item={i} />)}
            </div>
        </section>
    );

    return (
        <>
        <Header />
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Central de downloads</h1>
                <p>Instaladores, atualizações e utilitários do KRD System, sempre na versão mais recente.</p>
            </div>

            {carregando && <div className={styles.estado}>Carregando…</div>}
            {erro && <div className={styles.estado}>Não foi possível carregar a lista agora. Tente novamente em instantes.</div>}
            {!carregando && !erro && itens.length === 0 && <div className={styles.estado}>Nenhum arquivo disponível no momento.</div>}

            {antes.map(renderGrupo)}

            <section id="aplicativo" className={styles.secao}>
                <h2>Aplicativo para celular</h2>
                <p className={styles.secaoInfo}>Aponte a câmera do celular para o QR Code da loja desejada.</p>
                <div className={styles.cards}>
                    <LojaCard nome="App Store" url={APP_STORE_URL} cor="#000000" icone={<FaApple />} />
                    <LojaCard nome="Google Play" url={PLAY_STORE_URL} cor="#01875f" icone={<FaGooglePlay />} />
                </div>
            </section>

            {depois.map(renderGrupo)}

            <div className={styles.footer}>© KRD System</div>
        </div>
        </>
    );
}
